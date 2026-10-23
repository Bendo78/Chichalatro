/* Super cards: turns a CHICHA TCG card into a scoring effect.
   - TCG rarity (13 levels) → game tier 1..4 (strength + price)
   - TCG type (feu, eau, ...) → effect family
   - card id → which variant of the family (stable for a given card) */
(function () {
  const TIER_OF = { C: 1, U: 1, H: 2, R: 2, X: 2, E: 3, P: 3, N: 3, I: 3, L: 4, M: 4, S: 4, K: 4 };
  const TIERS = [
    null,
    { n: 'Commune', cls: 't1', price: 4, w: 60 },
    { n: 'Rare', cls: 't2', price: 6, w: 27 },
    { n: 'Épique', cls: 't3', price: 8, w: 10 },
    { n: 'Légendaire', cls: 't4', price: 11, w: 3 }
  ];
  const TYPE_FAM = { feu: 'Mult', eau: 'Jetons', foudre: 'Multiplicateur', nature: 'Croissance', psy: 'Esprit', ombre: 'Soles' };

  function hash(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  const suitSym = k => Poker.suitOf(k).s;
  const fmtX = x => '×' + (Math.round(x * 100) / 100);

  // Each builder gets the tier T and returns { text, hooks... }.
  // Hooks: perCard(card, ctx, sc), afterHand(ctx, sc), retrigger(card, i, ctx, sc),
  //        onPlayed(ctx, sc), onDiscard(n, sc), endRound(st, sc), suit (for per-suit effects).
  const FAMILIES = {
    feu: [
      T => ({ text: `+${4 * T} Mult`, afterHand: () => ({ mult: 4 * T }) }),
      T => ({ text: `+${8 * T} Mult si la main contient une Paire`, afterHand: c => Poker.contains(c.hand.id, 'pair') ? { mult: 8 * T } : null }),
      (T, suit) => ({ text: `Chaque ${suitSym(suit)} joué donne +${2 * T} Mult`, perCard: card => card.suit === suit ? { mult: 2 * T } : null })
    ],
    eau: [
      T => ({ text: `+${30 * T} Jetons`, afterHand: () => ({ chips: 30 * T }) }),
      T => ({ text: `Chaque figure jouée donne +${10 * T} Jetons`, perCard: card => Poker.isFace(card) ? { chips: 10 * T } : null }),
      T => ({ text: `+${60 * T} Jetons si tu joues 3 cartes ou moins`, afterHand: c => c.played.length <= 3 ? { chips: 60 * T } : null })
    ],
    foudre: [
      T => ({ text: `${fmtX(1 + 0.25 * T)} Mult`, afterHand: () => ({ xmult: 1 + 0.25 * T }) }),
      T => ({ text: `${fmtX(1 + 0.5 * T)} Mult si la main contient un Brelan`, afterHand: c => Poker.contains(c.hand.id, 'three') ? { xmult: 1 + 0.5 * T } : null }),
      T => ({ text: `Chaque As joué donne ${fmtX(1 + 0.2 * T)} Mult`, perCard: card => card.v === 14 ? { xmult: 1 + 0.2 * T } : null })
    ],
    nature: [
      T => ({ text: `Gagne +${T} Mult à chaque main jouée`, grow: 'mult', onPlayed: (c, sc) => { sc.store.n = (sc.store.n || 0) + T; }, afterHand: (c, sc) => sc.store.n ? { mult: sc.store.n } : null }),
      T => ({ text: `Gagne +${5 * T} Jetons à chaque défausse`, grow: 'chips', onDiscard: (n, sc) => { sc.store.n = (sc.store.n || 0) + 5 * T; }, afterHand: (c, sc) => sc.store.n ? { chips: sc.store.n } : null }),
      (T, suit) => ({ text: `Gagne +${3 * T} Jetons par ${suitSym(suit)} joué`, grow: 'chips', onPlayed: (c, sc) => { sc.store.n = (sc.store.n || 0) + 3 * T * c.scoring.filter(x => x.suit === suit).length; }, afterHand: (c, sc) => sc.store.n ? { chips: sc.store.n } : null })
    ],
    psy: [
      T => ({ text: T >= 3 ? 'Rejoue la première et la dernière carte jouée' : 'Rejoue la première carte jouée', retrigger: (card, i, c) => (i === 0 || (T >= 3 && i === c.scoring.length - 1)) ? 1 : 0 }),
      (T, suit) => ({ text: `Chaque ${suitSym(suit)} joué donne +${3 * T} Mult`, perCard: card => card.suit === suit ? { mult: 3 * T } : null }),
      T => ({ text: `+${2 * T} Mult par défausse restante`, afterHand: c => c.discardsLeft ? { mult: 2 * T * c.discardsLeft } : null })
    ],
    ombre: [
      T => ({ text: `Gagne ${2 * T} Soles en fin de manche`, endRound: () => 2 * T }),
      T => ({ text: `${fmtX(1 + 0.5 * T)} Mult sur la dernière main de la manche`, afterHand: c => c.isLastHand ? { xmult: 1 + 0.5 * T } : null }),
      T => ({ text: `Chaque ♦ joué rapporte ${T >= 3 ? 2 : 1} Sol`, perCard: card => card.suit === 'K' ? { money: T >= 3 ? 2 : 1 } : null })
    ]
  };

  /** Build a super card from a TCG card. */
  function make(card, series) {
    const tier = TIER_OF[card.r] || 1;
    const fam = FAMILIES[card.t] ? card.t : 'feu';
    const h = hash(String(card.id));
    const variant = h % FAMILIES[fam].length;
    const suit = Poker.SUITS[(h >>> 4) % 4].k;
    const eff = FAMILIES[fam][variant](tier, suit);
    return Object.assign({
      uid: 'sc' + Math.random().toString(36).slice(2, 9),
      card, series, tier, fam, famName: TYPE_FAM[fam], variant, store: {},
      price: TIERS[tier].price
    }, eff);
  }

  function liveText(sc) {
    if (sc.grow && sc.store.n) return sc.text + ` (actuel : +${sc.store.n} ${sc.grow === 'mult' ? 'Mult' : 'Jetons'})`;
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

  window.Supers = { TIERS, TIER_OF, TYPE_FAM, make, liveText, rollCard };
})();
