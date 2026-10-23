/* Progress kept between runs: achievements (succès), unlocked decks, difficulty levels (mises),
   lifetime stats used by the card unlock conditions. */
(function () {
  const KEY = 'chichalatro-meta';

  const DECKS = [
    { id: 'rosa', n: 'Deck Rose', d: 'Le deck de base. Aucun bonus.', color: '#ff2e88' },
    { id: 'fiesta', n: 'Deck Teuf', d: '+1 défausse à chaque manche.', color: '#ff7a00', ach: 'tanda1' },
    { id: 'soles', n: 'Deck Thune', d: 'Commence avec 14 €. Intérêts jusqu\'à 7 € par manche.', color: '#ffe600', ach: 'rich' },
    { id: 'neon', n: 'Deck Néon', d: '+1 emplacement de super carte.', color: '#18d6ff', ach: 'band' },
    { id: 'cumbia', n: 'Deck Cumbia', d: 'Paire, Double paire et Brelan commencent au niveau 2.', color: '#2bff6e', ach: 'cumbia4' },
    { id: 'jefe', n: 'Deck Patron', d: '+1 main à chaque manche, mais 1 carte de moins en main.', color: '#a43bff', ach: 'noche4' },
    { id: 'escalera', n: 'Deck Suite', d: 'Quinte, Couleur et Quinte flush commencent au niveau 3.', color: '#00e0b0', ach: 'sflush' },
    { id: 'leyenda', n: 'Deck Légende', d: 'Commence avec une super carte Légendaire débloquée au hasard.', color: '#ffd84a', ach: 'champion' },
    { id: 'voyant', n: 'Deck Voyant', d: 'Commence avec le ticket Boule de cristal et une carte Voyance.', color: '#c46bff', ach: 'voy5' },
    { id: 'disco', n: 'Deck Disco', d: 'Commence avec le ticket Disquaire et 2 Vinyles.', color: '#13b86b', ach: 'vin5' },
    { id: 'bijou', n: 'Deck Bijou', d: '12 cartes du deck commencent avec une amélioration au hasard.', color: '#ffc93c', ach: 'enh10' },
    { id: 'damier', n: 'Deck Damier', d: 'Seulement des ♥ et des ♠ (26 de chaque).', color: '#e5126a', ach: 'flush10' },
    { id: 'vide', n: 'Deck Sans Tête', d: 'Aucune figure : 40 cartes seulement.', color: '#8a7f73', ach: 'pack5' },
    { id: 'peintre', n: 'Deck Peintre', d: '+2 cartes en main, mais 1 emplacement de super carte en moins.', color: '#ff7a00', ach: 'noche6' },
    { id: 'paillettes', n: 'Deck Paillettes', d: 'Les éditions (Néon, Holo…) sont 3× plus fréquentes.', color: '#ff86de', ach: 'ed1' },
    { id: 'ticket', n: 'Deck Coupon', d: 'Commence avec 2 tickets VIP au hasard.', color: '#18d6ff', ach: 'vouch3' }
  ];

  const ACHIEVEMENTS = [
    { id: 'tanda1', n: 'Premier apéro', d: 'Gagner ta première manche' },
    { id: 'rich', n: 'Riche comme Crésus', d: 'Avoir 40 € en même temps' },
    { id: 'band', n: 'Toute la bande est là', d: 'Avoir 5 super cartes en même temps' },
    { id: 'cumbia4', n: 'DJ de la soirée', d: 'Monter une main au niveau 4' },
    { id: 'noche4', n: 'Nuit blanche', d: 'Atteindre la nuit 4' },
    { id: 'sflush', n: 'Quinte royale', d: 'Jouer une Quinte flush' },
    { id: 'champion', n: 'Roi de la nuit', d: 'Gagner une partie' },
    { id: 'big', n: 'Ça passe crème', d: 'Marquer 100 000 en une seule main' },
    { id: 'jefes', n: 'Chasseur de boss', d: 'Battre 10 boss (toutes parties confondues)' },
    { id: 'negra', n: 'Légende noire', d: 'Gagner une partie en Mise Noire' },
    { id: 'voy5', n: 'Madame Irma', d: 'Utiliser 5 cartes Voyance' },
    { id: 'vin5', n: 'Platine d\'or', d: 'Utiliser 5 Vinyles' },
    { id: 'enh10', n: 'Bling-bling', d: 'Avoir 10 cartes améliorées dans ton deck' },
    { id: 'flush10', n: 'Tout en couleur', d: 'Jouer 10 Couleurs (toutes parties confondues)' },
    { id: 'pack5', n: 'Déballage', d: 'Ouvrir 5 Pochettes' },
    { id: 'noche6', n: 'Jusqu\'au bout de la nuit', d: 'Atteindre la nuit 6' },
    { id: 'ed1', n: 'Édition limitée', d: 'Obtenir une super carte avec une édition' },
    { id: 'vouch3', n: 'Carré VIP', d: 'Acheter 3 tickets VIP' }
  ];

  // Each level adds its rule to all the levels below it.
  const STAKES = [
    { n: 'Blanche', c: '#f1e9ff', d: 'Difficulté normale' },
    { n: 'Rose', c: '#ff2e88', d: 'L\'Apéro ne rapporte plus rien' },
    { n: 'Orange', c: '#ff7a00', d: 'Objectifs +25 %' },
    { n: 'Verte', c: '#2bff6e', d: 'Une défausse de moins' },
    { n: 'Violette', c: '#a43bff', d: 'Tout coûte 1 € de plus dans la ChichaClub' },
    { n: 'Bleue', c: '#18d6ff', d: 'Les boss demandent ×2,5 au lieu de ×2' },
    { n: 'Dorée', c: '#ffc93c', d: 'Intérêts plafonnés à 3 €' },
    { n: 'Noire', c: '#2a1f33', d: 'Une main de moins' }
  ];

  function blank() {
    return {
      ach: {}, cards: {}, stake: 0, deckWins: {},
      stats: { bosses: 0, wins: 0, runs: 0, best: 0, bestHand: 0, rounds: 0, maxSoles: 0, recruited: 0, cumbias: 0, discards: 0, hands: {} },
      last: { deck: 'rosa', stake: 0 }
    };
  }
  let m = blank();
  try { m = Object.assign(blank(), JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) { }
  m.stats = Object.assign(blank().stats, m.stats);
  m.stats.hands = m.stats.hands || {};
  m.cards = m.cards || {};
  function save() { try { localStorage.setItem(KEY, JSON.stringify(m)); } catch (e) { } }

  const listeners = [], statListeners = [];
  function unlock(id) {
    if (m.ach[id]) return false;
    const a = ACHIEVEMENTS.find(x => x.id === id);
    if (!a) return false;
    m.ach[id] = Date.now();
    save();
    const deck = DECKS.find(d => d.ach === id);
    listeners.forEach(fn => fn(a, deck));
    return true;
  }
  const deckUnlocked = d => !d.ach || !!m.ach[d.ach];

  // Lifetime stats. Every change can unlock cards, so listeners get called.
  function changed() { save(); statListeners.forEach(fn => fn()); }
  function add(key, n) { m.stats[key] = (m.stats[key] || 0) + (n == null ? 1 : n); changed(); }
  function max(key, v) { if (v > (m.stats[key] || 0)) { m.stats[key] = v; changed(); } }
  function addHand(id) {
    m.stats.hands[id] = (m.stats.hands[id] || 0) + 1;
    changed();
    if ((m.stats.hands.flush || 0) + (m.stats.hands.sflush || 0) >= 10) unlock('flush10');
  }

  function winRun(deckId, stake) {
    m.stats.wins++;
    m.stake = Math.max(m.stake, Math.min(STAKES.length - 1, stake + 1));
    m.deckWins[deckId] = Math.max(m.deckWins[deckId] ?? -1, stake);
    changed();
    unlock('champion');
    if (stake === STAKES.length - 1) unlock('negra');
  }

  window.Meta = {
    DECKS, ACHIEVEMENTS, STAKES,
    get data() { return m; },
    save, unlock, deckUnlocked, winRun, add, max, addHand,
    onUnlock: fn => listeners.push(fn),
    onStats: fn => statListeners.push(fn),
    reset() { m = blank(); save(); }
  };
})();
