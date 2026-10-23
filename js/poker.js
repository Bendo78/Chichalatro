/* Poker rules: deck, hand detection, base values. */
(function () {
  const SUITS = [
    { k: 'C', s: '♥', n: 'Cœur', col: 'rosa' },
    { k: 'K', s: '♦', n: 'Carreau', col: 'naranja' },
    { k: 'T', s: '♣', n: 'Trèfle', col: 'verde' },
    { k: 'P', s: '♠', n: 'Pique', col: 'azul' }
  ];
  const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  const RANK_LABEL = { J: 'V', Q: 'D', K: 'R', A: 'A' }; // Valet, Dame, Roi, As

  // Hands from weakest to strongest. Base chips × base mult, plus what each level adds.
  const HANDS = [
    { id: 'high', n: 'Carte haute', c: 5, m: 1, lc: 10, lm: 1 },
    { id: 'pair', n: 'Paire', c: 10, m: 2, lc: 15, lm: 1 },
    { id: 'two', n: 'Double paire', c: 20, m: 2, lc: 20, lm: 1 },
    { id: 'three', n: 'Brelan', c: 30, m: 3, lc: 20, lm: 2 },
    { id: 'straight', n: 'Quinte', c: 30, m: 4, lc: 30, lm: 3 },
    { id: 'flush', n: 'Couleur', c: 35, m: 4, lc: 15, lm: 2 },
    { id: 'full', n: 'Full', c: 40, m: 4, lc: 25, lm: 2 },
    { id: 'four', n: 'Carré', c: 60, m: 7, lc: 30, lm: 3 },
    { id: 'sflush', n: 'Quinte flush', c: 100, m: 8, lc: 40, lm: 4 },
    // secret hands: only possible with copied or Caméléon cards, hidden until played once
    { id: 'five', n: 'Cinq pareils', c: 120, m: 12, lc: 35, lm: 3, secret: true },
    { id: 'fhouse', n: 'Full couleur', c: 140, m: 14, lc: 40, lm: 4, secret: true },
    { id: 'ffive', n: 'Couleur parfaite', c: 160, m: 16, lc: 50, lm: 3, secret: true }
  ];
  const HAND_BY_ID = Object.fromEntries(HANDS.map((h, i) => [h.id, Object.assign({ i }, h)]));

  let uid = 0;
  function newDeck() {
    const d = [];
    for (const s of SUITS) for (let i = 0; i < RANKS.length; i++)
      d.push({ uid: ++uid, suit: s.k, rank: RANKS[i], v: i + 2 });
    return d;
  }
  const suitOf = k => SUITS.find(s => s.k === k);
  const label = c => RANK_LABEL[c.rank] || c.rank;
  const chipsOf = c => (c.v <= 10 ? c.v : c.v === 14 ? 11 : 10);
  const isFace = c => c.v >= 11 && c.v <= 13;

  function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // Straight on 5 distinct values, ace can be low (A-2-3-4-5).
  function straightCards(cards) {
    if (cards.length < 5) return null;
    const vals = [...new Set(cards.map(c => c.v))].sort((a, b) => a - b);
    if (vals.length < 5) return null;
    const ok = vals[4] - vals[0] === 4 || vals.join() === '2,3,4,5,14';
    return ok ? cards.slice() : null;
  }

  // Enhanced cards: "joker" (Caméléon) counts as every suit, "pierre" has no rank or suit and always scores.
  const isStone = c => c.enh === 'pierre';
  const suitIs = (c, k) => !isStone(c) && (c.enh === 'joker' || c.suit === k);

  /** Returns { hand, scoring } — the detected hand and the cards that score. */
  function evaluate(cards) {
    if (!cards.length) return null;
    const pick = id => HAND_BY_ID[id];
    const stones = cards.filter(isStone), normal = cards.filter(c => !isStone(c));
    // scoring cards keep the order they were played in; stone cards always score
    const withStones = sc => cards.filter(c => sc.includes(c) || isStone(c));
    if (!normal.length) return { hand: pick('high'), scoring: stones.slice() };

    const groups = {};
    normal.forEach(c => (groups[c.v] = groups[c.v] || []).push(c));
    const g = Object.values(groups).sort((a, b) => b.length - a.length || b[0].v - a[0].v);
    const natural = normal.filter(c => c.enh !== 'joker');
    const flush = normal.length >= 5 && (!natural.length || natural.every(c => c.suit === natural[0].suit));
    const straight = straightCards(normal);
    const res = (id, sc) => ({ hand: pick(id), scoring: withStones(sc) });

    if (g[0].length >= 5) return res(flush ? 'ffive' : 'five', normal);
    if (flush && g[0].length === 3 && g[1] && g[1].length >= 2) return res('fhouse', normal);
    if (flush && straight) return res('sflush', normal);
    if (g[0].length >= 4) return res('four', g[0].slice(0, 4));
    if (g[0].length === 3 && g[1] && g[1].length >= 2) return res('full', normal);
    if (flush) return res('flush', normal);
    if (straight) return res('straight', normal);
    if (g[0].length === 3) return res('three', g[0]);
    if (g[0].length === 2 && g[1] && g[1].length === 2) return res('two', g[0].concat(g[1]));
    if (g[0].length === 2) return res('pair', g[0]);
    const top = normal.slice().sort((a, b) => b.v - a.v)[0];
    return res('high', [top]);
  }

  // "Contains" checks used by super cards (a Full contains a Paire and a Brelan, etc.).
  const CONTAINS = {
    pair: ['pair', 'two', 'three', 'full', 'four', 'five', 'fhouse', 'ffive'],
    two: ['two', 'full', 'fhouse'],
    three: ['three', 'full', 'four', 'five', 'fhouse', 'ffive'],
    straight: ['straight', 'sflush'],
    flush: ['flush', 'sflush', 'fhouse', 'ffive'],
    full: ['full', 'fhouse'],
    four: ['four', 'five', 'ffive']
  };
  const contains = (handId, what) => (CONTAINS[what] || [what]).includes(handId);

  window.Poker = { SUITS, RANKS, HANDS, HAND_BY_ID, newDeck, shuffle, evaluate, suitOf, label, chipsOf, isFace, contains, suitIs, isStone };
})();
