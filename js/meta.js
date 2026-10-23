/* Progress kept between runs: achievements (succès), unlocked decks, difficulty levels (mises). */
(function () {
  const KEY = 'chichalatro-meta';

  const DECKS = [
    { id: 'rosa', n: 'Deck Rosa', d: 'Le deck de base. Aucun bonus.', color: '#ff2e88' },
    { id: 'fiesta', n: 'Deck Fiesta', d: '+1 défausse à chaque tanda.', color: '#ff7a00', ach: 'tanda1' },
    { id: 'soles', n: 'Deck Soles', d: 'Commence avec S/ 14. Intérêts jusqu\'à 7 par tanda.', color: '#ffe600', ach: 'rich' },
    { id: 'neon', n: 'Deck Neón', d: '+1 emplacement de super carte.', color: '#18d6ff', ach: 'band' },
    { id: 'cumbia', n: 'Deck Cumbia', d: 'Paire, Double paire et Brelan commencent au niveau 2.', color: '#2bff6e', ach: 'cumbia4' },
    { id: 'jefe', n: 'Deck Jefe', d: '+1 main à chaque tanda, mais 1 carte de moins en main.', color: '#a43bff', ach: 'noche4' },
    { id: 'escalera', n: 'Deck Escalera', d: 'Quinte, Couleur et Quinte flush commencent au niveau 3.', color: '#00e0b0', ach: 'sflush' },
    { id: 'leyenda', n: 'Deck Leyenda', d: 'Commence avec une super carte Légendaire au hasard.', color: '#ffd84a', ach: 'champion' }
  ];

  const ACHIEVEMENTS = [
    { id: 'tanda1', n: 'Primera tanda', d: 'Gagner ta première tanda' },
    { id: 'rich', n: 'Plata como cancha', d: 'Avoir 40 Soles en même temps' },
    { id: 'band', n: 'La banda completa', d: 'Avoir 5 super cartes en même temps' },
    { id: 'cumbia4', n: 'Rey de la cumbia', d: 'Monter une main au niveau 4' },
    { id: 'noche4', n: 'Trasnochador', d: 'Atteindre la noche 4' },
    { id: 'sflush', n: 'Escalera real', d: 'Jouer une Quinte flush' },
    { id: 'champion', n: 'Campeón', d: 'Gagner une partie' },
    { id: 'big', n: 'Un palo', d: 'Marquer 100 000 en une seule main' },
    { id: 'jefes', n: 'Cazajefes', d: 'Battre 10 Jefes (toutes parties confondues)' },
    { id: 'negra', n: 'Leyenda negra', d: 'Gagner une partie en Mise Negra' }
  ];

  // Each level adds its rule to all the levels below it.
  const STAKES = [
    { n: 'Blanca', c: '#f1e9ff', d: 'Difficulté normale' },
    { n: 'Rosa', c: '#ff2e88', d: 'La Tanda chica ne rapporte plus rien' },
    { n: 'Naranja', c: '#ff7a00', d: 'Objectifs +25 %' },
    { n: 'Verde', c: '#2bff6e', d: 'Une défausse de moins' },
    { n: 'Azul', c: '#18d6ff', d: 'Les Jefes demandent ×2,5 au lieu de ×2' },
    { n: 'Negra', c: '#2a1f33', d: 'Une main de moins' }
  ];

  function blank() { return { ach: {}, stake: 0, deckWins: {}, stats: { bosses: 0, wins: 0, runs: 0, best: 0, bestHand: 0 }, last: { deck: 'rosa', stake: 0 } }; }
  let m = blank();
  try { m = Object.assign(blank(), JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) { }
  m.stats = Object.assign(blank().stats, m.stats);
  function save() { try { localStorage.setItem(KEY, JSON.stringify(m)); } catch (e) { } }

  const listeners = [];
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

  function winRun(deckId, stake) {
    m.stats.wins++;
    m.stake = Math.max(m.stake, Math.min(STAKES.length - 1, stake + 1));
    m.deckWins[deckId] = Math.max(m.deckWins[deckId] ?? -1, stake);
    save();
    unlock('champion');
    if (stake === STAKES.length - 1) unlock('negra');
  }

  window.Meta = {
    DECKS, ACHIEVEMENTS, STAKES,
    get data() { return m; },
    save, unlock, deckUnlocked, winRun,
    onUnlock: fn => listeners.push(fn),
    reset() { m = blank(); save(); }
  };
})();
