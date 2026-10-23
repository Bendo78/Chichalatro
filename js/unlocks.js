/* Card unlocks: a starter set is open from the first game, every other card has its own condition
   (lifetime stats), harder for rarer cards. Unlocked cards are saved in Meta.data.cards. */
(function () {
  const STARTER = { 1: 22, 2: 9, 3: 5, 4: 2 };

  function hash(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  const fmt = n => Math.floor(n).toLocaleString('fr-FR');
  const handName = id => Poker.HAND_BY_ID[id].n;

  // Condition templates. T = tier 1..4. Each returns { key, n, text }.
  const TEMPLATES = [
    T => ({ key: 'rounds', n: [3, 8, 18, 35][T - 1], text: n => `Gagner ${n} manches` }),
    T => ({ key: 'bosses', n: [1, 3, 7, 12][T - 1], text: n => `Battre ${n} boss` }),
    T => ({ key: 'best', n: [2, 3, 5, 7][T - 1], text: n => `Atteindre la nuit ${n}` }),
    T => ({ key: 'bestHand', n: [400, 2500, 15000, 80000][T - 1], text: n => `Marquer ${fmt(n)} en une seule main` }),
    T => ({ key: 'maxSoles', n: [12, 22, 35, 55][T - 1], text: n => `Avoir ${n} € en même temps` }),
    T => ({ key: 'recruited', n: [3, 8, 20, 40][T - 1], text: n => `Recruter ${n} super cartes` }),
    T => ({ key: 'cumbias', n: [2, 5, 12, 25][T - 1], text: n => `Écouter ${n} Cumbias` }),
    T => ({ key: 'discards', n: [15, 50, 120, 260][T - 1], text: n => `Défausser ${n} cartes` }),
    (T, h) => {
      const hands = T <= 2 ? ['pair', 'two', 'three', 'straight', 'flush'] : ['full', 'flush', 'straight', 'four'];
      const id = hands[h % hands.length];
      const base = { pair: 12, two: 8, three: 6, straight: 4, flush: 4, full: 3, four: 1 }[id];
      const n = Math.max(1, Math.round(base * [1, 2, 3, 5][T - 1] / (T >= 3 ? 2 : 1)));
      return { key: 'hand:' + id, n, text: n => `Jouer ${n} fois une ${handName(id)}` };
    }
  ];
  const WIN = T => ({ key: 'wins', n: T === 4 ? 1 : 1, text: n => n > 1 ? `Gagner ${n} parties` : 'Gagner une partie' });

  let conds = {}, starter = new Set(), all = [];

  function init(cards) {
    all = cards;
    conds = {}; starter = new Set();
    const byTier = { 1: [], 2: [], 3: [], 4: [] };
    cards.forEach(c => byTier[Supers.TIER_OF[c.r] || 1].push(c));
    for (const t of [1, 2, 3, 4]) {
      byTier[t].sort((a, b) => hash('start' + a.id) - hash('start' + b.id)).slice(0, STARTER[t]).forEach(c => starter.add(c.id));
    }
    cards.forEach(c => {
      if (starter.has(c.id)) return;
      const T = Supers.TIER_OF[c.r] || 1, h = hash('cond' + c.id);
      // a few Légendaires ask for a won game
      const tpl = T === 4 && h % 7 === 0 ? WIN : TEMPLATES[h % TEMPLATES.length];
      const k = tpl(T, h >>> 8);
      conds[c.id] = { key: k.key, n: k.n, text: k.text(k.n) };
    });
  }

  function value(key) {
    const s = Meta.data.stats;
    if (key.startsWith('hand:')) return s.hands[key.slice(5)] || 0;
    return s[key] || 0;
  }
  const isOpen = c => starter.has(c.id) || !!Meta.data.cards[c.id];
  const condOf = c => conds[c.id] || null;
  function progress(c) {
    const k = conds[c.id];
    if (!k) return null;
    return { text: k.text, have: Math.min(k.n, value(k.key)), need: k.n };
  }

  // Unlock every card whose condition is met. Returns the newly unlocked cards.
  function check() {
    const fresh = [];
    all.forEach(c => {
      if (isOpen(c)) return;
      const k = conds[c.id];
      if (k && value(k.key) >= k.n) { Meta.data.cards[c.id] = Date.now(); fresh.push(c); }
    });
    if (fresh.length) Meta.save();
    return fresh;
  }

  const open = () => all.filter(isOpen);

  window.Unlocks = { init, isOpen, condOf, progress, check, open };
})();
