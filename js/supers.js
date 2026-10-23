/* Super cards: turns a CHICHA TCG card into a scoring effect.
   - TCG rarity (13 levels) → game tier 1..4 (strength + price)
   - TCG type (feu, eau, ...) → preferred effect family
   - every card gets a DIFFERENT effect from a catalog of ~146 (assigned once with Supers.init)
   Hooks an effect can have:
     perCard(card, ctx, sc), afterHand(ctx, sc), retrigger(card, i, ctx, sc) → extra plays,
     onPlayed(ctx, sc), onDiscard(n, sc), endRound(st, sc) → money, mods: { hands, discards, handSize, interest, reroll } */
(function () {
  const TIER_OF = { C: 1, U: 1, H: 2, R: 2, X: 2, E: 3, P: 3, N: 3, I: 3, L: 4, M: 4, S: 4, K: 4 };
  const TIERS = [
    null,
    { n: 'Commune', cls: 't1', price: 4, w: 60 },
    { n: 'Rare', cls: 't2', price: 6, w: 27 },
    { n: 'Épique', cls: 't3', price: 8, w: 10 },
    { n: 'Légendaire', cls: 't4', price: 11, w: 3 }
  ];
  const FAM_NAME = { mult: 'Mult', chips: 'Jetons', xmult: 'Multiplicateur', grow: 'Croissance', psy: 'Esprit', money: 'Argent' };
  const TYPE_FAM = { feu: 'mult', eau: 'chips', foudre: 'xmult', nature: 'grow', psy: 'psy', ombre: 'money' };

  function hash(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  const X = x => '×' + String(Math.round(x * 100) / 100).replace('.', ',');
  const SUITS = [['C', '♥'], ['K', '♦'], ['T', '♣'], ['P', '♠']];
  const RANKS = [['2', '2'], ['3', '3'], ['4', '4'], ['5', '5'], ['6', '6'], ['7', '7'], ['8', '8'], ['9', '9'], ['10', '10'], ['J', 'Valet'], ['Q', 'Dame'], ['K', 'Roi'], ['A', 'As']];
  const HANDS = [['pair', 'une Paire'], ['two', 'une Double paire'], ['three', 'un Brelan'], ['straight', 'une Quinte'], ['flush', 'une Couleur'], ['full', 'un Full'], ['four', 'un Carré']];
  const stone = c => Poker.isStone(c);
  const face = c => !stone(c) && Poker.isFace(c);
  const is = (c, s) => Poker.suitIs(c, s);
  const rk = (c, r) => !stone(c) && c.rank === r;
  const has = (ctx, h) => Poker.contains(ctx.hand.id, h);
  const odd = c => !stone(c) && (c.v === 14 || c.v % 2 === 1);
  const even = c => !stone(c) && c.v <= 10 && c.v % 2 === 0;

  // ---------- the catalog ----------
  const T = [];
  const add = (key, fam, make) => T.push({ key, fam, make });

  // Mult
  add('m_flat', 'mult', t => ({ text: `+${4 * t} Mult`, afterHand: () => ({ mult: 4 * t }) }));
  HANDS.forEach(([h, nm]) => {
    const b = { pair: 8, two: 10, three: 12, straight: 12, flush: 10, full: 14, four: 20 }[h];
    add('m_hand_' + h, 'mult', t => ({ text: `+${b * t} Mult si la main contient ${nm}`, afterHand: c => has(c, h) ? { mult: b * t } : null }));
  });
  SUITS.forEach(([s, y]) => add('m_suit_' + s, 'mult', t => ({ text: `Chaque ${y} joué donne +${2 * t} Mult`, perCard: c => is(c, s) ? { mult: 2 * t } : null })));
  SUITS.forEach(([s, y]) => add('m_held_' + s, 'mult', t => ({ text: `+${2 * t} Mult par ${y} resté en main`, afterHand: c => { const n = c.held.filter(x => is(x, s)).length; return n ? { mult: 2 * t * n } : null; } })));
  add('m_face', 'mult', t => ({ text: `Chaque figure jouée donne +${3 * t} Mult`, perCard: c => face(c) ? { mult: 3 * t } : null }));
  add('m_even', 'mult', t => ({ text: `Chaque carte paire jouée (2, 4, 6, 8, 10) donne +${2 * t} Mult`, perCard: c => even(c) ? { mult: 2 * t } : null }));
  add('m_odd', 'mult', t => ({ text: `Chaque carte impaire jouée (A, 3, 5, 7, 9) donne +${2 * t} Mult`, perCard: c => odd(c) ? { mult: 2 * t } : null }));
  add('m_small', 'mult', t => ({ text: `+${6 * t} Mult si tu joues 3 cartes ou moins`, afterHand: c => c.played.length <= 3 ? { mult: 6 * t } : null }));
  add('m_handsleft', 'mult', t => ({ text: `+${2 * t} Mult par main restante`, afterHand: c => c.handsLeft ? { mult: 2 * t * c.handsLeft } : null }));
  add('m_supers', 'mult', t => ({ text: `+${t} Mult par super carte que tu possèdes`, afterHand: c => ({ mult: t * c.nSupers }) }));
  add('m_money', 'mult', t => ({ text: `+${t} Mult par tranche de 5 € que tu possèdes`, afterHand: c => { const n = Math.floor(c.soles / 5); return n ? { mult: t * n } : null; } }));
  add('m_disc', 'mult', t => ({ text: `+${2 * t} Mult par défausse restante`, afterHand: c => c.discardsLeft ? { mult: 2 * t * c.discardsLeft } : null }));
  add('m_first', 'mult', t => ({ text: `+${12 * t} Mult sur la première main de la manche`, afterHand: c => c.firstHand ? { mult: 12 * t } : null }));
  RANKS.forEach(([r, nm]) => add('m_rank_' + r, 'mult', t => ({ text: `Chaque ${nm} joué donne +${3 * t} Mult`, perCard: c => rk(c, r) ? { mult: 3 * t } : null })));
  add('m_level', 'mult', t => ({ text: `+${t} Mult par niveau de la main jouée`, afterHand: c => ({ mult: t * c.level }) }));
  add('m_enh', 'mult', t => ({ text: `Chaque carte améliorée jouée donne +${4 * t} Mult`, perCard: c => c.enh ? { mult: 4 * t } : null }));
  add('m_random', 'mult', t => ({ text: `+0 à +${10 * t} Mult au hasard`, afterHand: () => ({ mult: Math.floor(Math.random() * (10 * t + 1)) }) }));

  // Jetons
  add('c_flat', 'chips', t => ({ text: `+${30 * t} Jetons`, afterHand: () => ({ chips: 30 * t }) }));
  SUITS.forEach(([s, y]) => add('c_suit_' + s, 'chips', t => ({ text: `Chaque ${y} joué donne +${10 * t} Jetons`, perCard: c => is(c, s) ? { chips: 10 * t } : null })));
  HANDS.forEach(([h, nm]) => {
    const b = { pair: 30, two: 40, three: 50, straight: 60, flush: 50, full: 70, four: 100 }[h];
    add('c_hand_' + h, 'chips', t => ({ text: `+${b * t} Jetons si la main contient ${nm}`, afterHand: c => has(c, h) ? { chips: b * t } : null }));
  });
  add('c_held', 'chips', t => ({ text: `+${6 * t} Jetons par carte restée en main`, afterHand: c => c.held.length ? { chips: 6 * t * c.held.length } : null }));
  add('c_face', 'chips', t => ({ text: `Chaque figure jouée donne +${10 * t} Jetons`, perCard: c => face(c) ? { chips: 10 * t } : null }));
  add('c_small', 'chips', t => ({ text: `+${50 * t} Jetons si tu joues 3 cartes ou moins`, afterHand: c => c.played.length <= 3 ? { chips: 50 * t } : null }));
  add('c_deck', 'chips', t => ({ text: `+${2 * t} Jetons par carte restant dans le deck`, afterHand: c => c.deckLeft ? { chips: 2 * t * c.deckLeft } : null }));
  RANKS.forEach(([r, nm]) => add('c_rank_' + r, 'chips', t => ({ text: `Chaque ${nm} joué donne +${15 * t} Jetons`, perCard: c => rk(c, r) ? { chips: 15 * t } : null })));
  add('c_discused', 'chips', t => ({ text: `+${15 * t} Jetons par défausse utilisée cette manche`, afterHand: c => c.discUsed ? { chips: 15 * t * c.discUsed } : null }));
  add('c_low', 'chips', t => ({ text: `Chaque carte de 2 à 5 jouée donne +${20 * t} Jetons`, perCard: c => !stone(c) && c.v <= 5 ? { chips: 20 * t } : null }));
  add('c_supers', 'chips', t => ({ text: `+${15 * t} Jetons par super carte que tu possèdes`, afterHand: c => ({ chips: 15 * t * c.nSupers }) }));

  // Multiplicateur
  add('x_flat', 'xmult', t => ({ text: `${X(1 + .25 * t)} Mult`, afterHand: () => ({ xmult: 1 + .25 * t }) }));
  HANDS.forEach(([h, nm]) => {
    const f = { pair: .25, two: .3, three: .4, straight: .5, flush: .5, full: .5, four: .75 }[h];
    add('x_hand_' + h, 'xmult', t => ({ text: `${X(1 + f * t)} Mult si la main contient ${nm}`, afterHand: c => has(c, h) ? { xmult: 1 + f * t } : null }));
  });
  [['J', 'Valet'], ['Q', 'Dame'], ['K', 'Roi'], ['A', 'As']].forEach(([r, nm]) => add('x_rank_' + r, 'xmult', t => ({ text: `Chaque ${nm} joué donne ${X(1 + .15 * t)} Mult`, perCard: c => rk(c, r) ? { xmult: 1 + .15 * t } : null })));
  SUITS.forEach(([s, y]) => add('x_suit_' + s, 'xmult', t => ({ text: `Chaque ${y} joué donne ${X(1 + .1 * t)} Mult`, perCard: c => is(c, s) ? { xmult: 1 + .1 * t } : null })));
  SUITS.forEach(([s, y]) => add('x_held_' + s, 'xmult', t => ({ text: `${X(1 + .1 * t)} Mult par ${y} resté en main`, afterHand: c => { const n = c.held.filter(x => is(x, s)).length; return n ? { xmult: Math.pow(1 + .1 * t, n) } : null; } })));
  add('x_last', 'xmult', t => ({ text: `${X(1 + .5 * t)} Mult sur la dernière main de la manche`, afterHand: c => c.isLastHand ? { xmult: 1 + .5 * t } : null }));
  add('x_nodisc', 'xmult', t => ({ text: `${X(1 + .4 * t)} Mult si tu n'as pas encore défaussé cette manche`, afterHand: c => !c.discUsed ? { xmult: 1 + .4 * t } : null }));
  add('x_broke', 'xmult', t => ({ text: `${X(1 + .5 * t)} Mult si tu as 5 € ou moins`, afterHand: c => c.soles <= 5 ? { xmult: 1 + .5 * t } : null }));
  add('x_five', 'xmult', t => ({ text: `${X(1 + .3 * t)} Mult si tu joues exactement 5 cartes`, afterHand: c => c.played.length === 5 ? { xmult: 1 + .3 * t } : null }));
  add('x_money', 'xmult', t => ({ text: `${X(1 + .1 * t)} Mult par tranche de 10 € que tu possèdes`, afterHand: c => { const n = Math.floor(c.soles / 10); return n ? { xmult: 1 + .1 * t * n } : null; } }));

  // Croissance (grows during the run)
  const grows = (unit, extra) => Object.assign({ grow: unit, afterHand: (c, sc) => sc.store.n ? (unit === 'x' ? { xmult: 1 + sc.store.n } : unit === 'mult' ? { mult: sc.store.n } : { chips: sc.store.n }) : null }, extra);
  add('g_hand', 'grow', t => grows('mult', { text: `Gagne +${t} Mult à chaque main jouée`, onPlayed: (c, sc) => { sc.store.n = (sc.store.n || 0) + t; } }));
  add('g_disc', 'grow', t => grows('chips', { text: `Gagne +${5 * t} Jetons à chaque défausse`, onDiscard: (n, sc) => { sc.store.n = (sc.store.n || 0) + 5 * t; } }));
  SUITS.forEach(([s, y]) => add('g_suit_' + s, 'grow', t => grows('chips', { text: `Gagne +${3 * t} Jetons par ${y} joué`, onPlayed: (c, sc) => { sc.store.n = (sc.store.n || 0) + 3 * t * c.scoring.filter(x => is(x, s)).length; } })));
  HANDS.forEach(([h, nm]) => add('g_hand_' + h, 'grow', t => grows('mult', { text: `Gagne +${2 * t} Mult chaque fois que tu joues ${nm}`, onPlayed: (c, sc) => { if (has(c, h)) sc.store.n = (sc.store.n || 0) + 2 * t; } })));
  add('g_boss', 'grow', t => grows('x', { text: `Gagne +${X(.1 * t).slice(1)} au multiplicateur à chaque boss battu`, endRound: (st, sc) => { if (st.tanda === 2) sc.store.n = Math.round(((sc.store.n || 0) + .1 * t) * 100) / 100; return 0; } }));
  add('g_round', 'grow', t => grows('chips', { text: `Gagne +${8 * t} Jetons à chaque manche gagnée`, endRound: (st, sc) => { sc.store.n = (sc.store.n || 0) + 8 * t; return 0; } }));
  add('g_face', 'grow', t => grows('mult', { text: `Gagne +${t} Mult par figure jouée`, onPlayed: (c, sc) => { sc.store.n = (sc.store.n || 0) + t * c.scoring.filter(face).length; } }));

  // Esprit (replays and passive bonuses)
  add('p_first', 'psy', t => ({ text: t >= 3 ? 'Rejoue 2 fois la première carte jouée' : 'Rejoue la première carte jouée', retrigger: (c, i) => i === 0 ? (t >= 3 ? 2 : 1) : 0 }));
  add('p_last', 'psy', t => ({ text: 'Rejoue la dernière carte jouée', retrigger: (c, i, ctx) => i === ctx.scoring.length - 1 ? 1 : 0 }));
  add('p_faces', 'psy', t => ({ text: 'Rejoue les figures jouées', retrigger: c => face(c) ? 1 : 0 }));
  add('p_low', 'psy', t => ({ text: 'Rejoue les 2, 3, 4 et 5 joués', retrigger: c => !stone(c) && c.v <= 5 ? 1 : 0 }));
  RANKS.forEach(([r, nm]) => add('p_rank_' + r, 'psy', t => ({ text: `Rejoue chaque ${nm} joué${t >= 4 ? ' (2 fois)' : ''}`, retrigger: c => rk(c, r) ? (t >= 4 ? 2 : 1) : 0 })));
  add('p_disc', 'psy', t => ({ text: '+1 défausse à chaque manche', mods: { discards: 1 } }));
  add('p_hand', 'psy', t => ({ text: '+1 main à chaque manche', mods: { hands: 1 } }));
  add('p_size', 'psy', t => ({ text: '+1 carte en main', mods: { handSize: 1 } }));
  add('p_reroll', 'psy', t => ({ text: 'Les relances coûtent 1 € de moins', mods: { reroll: 1 } }));

  // Argent
  add('$_end', 'money', t => ({ text: `Gagne ${2 * t} € en fin de manche`, endRound: () => 2 * t }));
  SUITS.forEach(([s, y]) => add('$_suit_' + s, 'money', t => ({ text: `Chaque ${y} joué rapporte ${t >= 3 ? 2 : 1} €`, perCard: c => is(c, s) ? { money: t >= 3 ? 2 : 1 } : null })));
  add('$_disc', 'money', t => ({ text: `+${t} € par défausse restante en fin de manche`, endRound: st => t * (st.discards || 0) }));
  add('$_face', 'money', t => ({ text: 'Chaque figure jouée a 1 chance sur 2 de rapporter 1 €', perCard: c => face(c) && Math.random() < .5 ? { money: 1 } : null }));
  add('$_hands', 'money', t => ({ text: `+${t} € par main restante en fin de manche`, endRound: st => t * (st.hands || 0) }));
  add('$_interest', 'money', t => ({ text: `Intérêts plafonnés ${2 * t} € plus haut`, mods: { interest: 2 * t } }));
  add('$_pair', 'money', t => ({ text: `Chaque main contenant une Paire rapporte ${t} €`, afterHand: c => has(c, 'pair') ? { money: t } : null }));
  add('$_boss', 'money', t => ({ text: `+${5 * t} € quand tu bats un boss`, endRound: st => st.tanda === 2 ? 5 * t : 0 }));

  const BY_KEY = Object.fromEntries(T.map(x => [x.key, x]));

  // ---------- assignment: one different effect per card ----------
  let assigned = {};
  function init(cards) {
    assigned = {};
    const used = new Set();
    const sorted = cards.slice().sort((a, b) => hash('fx' + a.id) - hash('fx' + b.id));
    for (const c of sorted) {
      const fam = TYPE_FAM[c.t] || 'mult';
      let pool = T.filter(x => x.fam === fam && !used.has(x.key));
      if (!pool.length) pool = T.filter(x => !used.has(x.key));
      if (!pool.length) pool = T;
      const pick = pool[hash('pick' + c.id) % pool.length];
      used.add(pick.key);
      assigned[c.id] = pick.key;
    }
  }
  function keyOf(card) {
    if (assigned[card.id]) return assigned[card.id];
    const fam = TYPE_FAM[card.t] || 'mult', pool = T.filter(x => x.fam === fam);
    return pool[hash('pick' + card.id) % pool.length].key;
  }

  /** Build a super card from a TCG card. */
  function make(card, series) {
    const tier = TIER_OF[card.r] || 1;
    const tpl = BY_KEY[keyOf(card)];
    const eff = tpl.make(tier);
    return Object.assign({
      uid: 'sc' + Math.random().toString(36).slice(2, 9),
      card, series, tier, fam: tpl.fam, famName: FAM_NAME[tpl.fam], fx: tpl.key, store: {},
      price: TIERS[tier].price
    }, eff);
  }

  function liveText(sc) {
    if (sc.grow && sc.store.n) {
      const v = sc.grow === 'x' ? X(1 + sc.store.n) + ' Mult' : `+${sc.store.n} ${sc.grow === 'mult' ? 'Mult' : 'Jetons'}`;
      return sc.text + ` (actuel : ${v})`;
    }
    return sc.text;
  }

  // Weighted pick of a TCG card for the shop, avoiding cards already owned.
  function rollCard(pool, ownedIds) {
    const free = pool.filter(c => !ownedIds.has(c.id));
    const list = free.length ? free : pool;
    const total = list.reduce((s, c) => s + TIERS[TIER_OF[c.r] || 1].w, 0);
    let r = Math.random() * total;
    for (const c of list) { r -= TIERS[TIER_OF[c.r] || 1].w; if (r <= 0) return c; }
    return list[list.length - 1];
  }

  window.Supers = { TIERS, TIER_OF, TYPE_FAM: FAM_NAME, CATALOG: T, init, make, liveText, rollCard };
})();
