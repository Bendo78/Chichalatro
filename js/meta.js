/* Progress kept between runs: achievements (succès), unlocked decks, difficulty levels (mises),
   lifetime stats used by the card unlock conditions. */
(function () {
  const KEY = 'chichalatro-meta';

  const DECKS = [
    { id: 'rosa', n: 'Deck Rose', d: 'Le deck de base. Aucun bonus.', color: '#ff2e88' },
    { id: 'fiesta', n: 'Deck Teuf', d: '+1 défausse à chaque manche.', color: '#ff7a00' },
    { id: 'soles', n: 'Deck Thune', d: 'Commence avec 14 €. Intérêts jusqu\'à 7 € par manche.', color: '#ffe600', win: { deck: 'fiesta', stake: 0 } },
    { id: 'neon', n: 'Deck Néon', d: '+1 emplacement de super carte.', color: '#18d6ff', win: { deck: 'rosa', stake: 1 } },
    { id: 'cumbia', n: 'Deck Cumbia', d: 'Paire, Double paire et Brelan commencent au niveau 2.', color: '#2bff6e', ach: 'cumbia6' },
    { id: 'jefe', n: 'Deck Patron', d: '+1 main à chaque manche, mais 1 carte de moins en main.', color: '#a43bff', win: { deck: 'rosa', stake: 0 } },
    { id: 'escalera', n: 'Deck Suite', d: 'Quinte, Couleur et Quinte flush commencent au niveau 3.', color: '#00e0b0', win: { deck: 'cumbia', stake: 0 } },
    { id: 'leyenda', n: 'Deck Légende', d: 'Commence avec une super carte Légendaire débloquée au hasard.', color: '#ffd84a', win: { deck: 'fiesta', stake: 1 } },
    { id: 'voyant', n: 'Deck Voyant', d: 'Commence avec le ticket Boule de cristal et une carte Voyance.', color: '#c46bff', ach: 'voy15' },
    { id: 'disco', n: 'Deck Disco', d: 'Commence avec le ticket Disquaire et 2 Vinyles.', color: '#13b86b', ach: 'vin15' },
    { id: 'bijou', n: 'Deck Bijou', d: '12 cartes du deck commencent avec une amélioration au hasard.', color: '#ffc93c', ach: 'enh15' },
    { id: 'damier', n: 'Deck Damier', d: 'Seulement des ♥ et des ♠ (26 de chaque).', color: '#e5126a', ach: 'flush25' },
    { id: 'vide', n: 'Deck Sans Tête', d: 'Aucune figure : 40 cartes seulement.', color: '#8a7f73', win: { deck: 'jefe', stake: 0 } },
    { id: 'peintre', n: 'Deck Peintre', d: '+2 cartes en main, mais 1 emplacement de super carte en moins.', color: '#ff7a00', win: { deck: 'soles', stake: 2 } },
    { id: 'paillettes', n: 'Deck Paillettes', d: 'Les éditions (Néon, Holo…) sont 3× plus fréquentes.', color: '#ff86de', ach: 'ed3' },
    { id: 'ticket', n: 'Deck Coupon', d: 'Commence avec 2 tickets VIP au hasard.', color: '#18d6ff', ach: 'vouch8' }
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
    { id: 'vouch3', n: 'Carré VIP', d: 'Acheter 3 tickets VIP' },
    { id: 'cumbia6', n: 'Platine de diamant', d: 'Monter une main au niveau 6' },
    { id: 'voy15', n: 'Voyante extralucide', d: 'Utiliser 15 cartes Voyance (toutes parties)' },
    { id: 'vin15', n: 'Discothèque', d: 'Utiliser 15 Vinyles (toutes parties)' },
    { id: 'enh15', n: 'Joaillier', d: 'Avoir 15 cartes améliorées dans ton deck' },
    { id: 'flush25', n: 'Arc-en-ciel humain', d: 'Jouer 25 Couleurs (toutes parties)' },
    { id: 'ed3', n: 'Collection brillante', d: 'Avoir 3 super cartes avec une édition en même temps' },
    { id: 'vouch8', n: 'Membre à vie', d: 'Acheter 8 tickets VIP (toutes parties)' },
    { id: 'secret', n: 'Main secrète', d: 'Jouer une main secrète (Cinq pareils, Full couleur…)' },
    { id: 'streak5', n: 'En feu', d: 'Enchaîner 5 grosses mains de suite' },
    { id: 'ghost3', n: 'Chasseur de fantômes', d: 'Utiliser 3 cartes Fantôme' },
    { id: 'tag5', n: 'Collectionneur de tags', d: 'Récupérer 5 tags en sautant des manches' }
  ];

  // Card skins for playing cards (chosen in the title menu).
  const SKINS = [
    { id: 'chicha', n: 'Chicha', d: 'Le style de base, couleurs fluo.' },
    { id: 'bloc', n: 'Bloc', d: 'Cartes en gros pixels cubiques, façon jeu de construction.', ach: 'tanda1' },
    { id: 'neon', n: 'Néon', d: 'Cartes noires qui brillent dans le noir.', ach: 'band' },
    { id: 'kraft', n: 'Croquis', d: 'Papier kraft et encre, dessiné à la main.', ach: 'noche4' },
    { id: 'arcade', n: 'Arcade', d: 'Écran vert rétro, 8 bits.', ach: 'jefes' },
    { id: 'luxe', n: 'Luxe', d: 'Noir et or, pour les rois de la nuit.', ach: 'champion' }
  ];

  // Each level adds its rule to all the levels below it.
  const STAKES = [
    { n: 'Blanche', c: '#f1e9ff', d: 'Difficulté normale' },
    { n: 'Rose', c: '#ff2e88', d: 'L\'Apéro ne rapporte plus rien' },
    { n: 'Orange', c: '#ff7a00', d: 'Objectifs +25 %' },
    { n: 'Verte', c: '#2bff6e', d: 'Des super cartes Collées (impossibles à vendre) apparaissent' },
    { n: 'Violette', c: '#a43bff', d: 'Une défausse de moins' },
    { n: 'Bleue', c: '#18d6ff', d: 'Des super cartes Périmées (s\'éteignent après 5 manches) apparaissent' },
    { n: 'Dorée', c: '#ffc93c', d: 'Des super cartes en Location (1 € puis 3 € par manche) apparaissent' },
    { n: 'Noire', c: '#2a1f33', d: 'Une main de moins et les boss demandent ×2,5' }
  ];

  function blank() {
    return {
      ach: {}, cards: {}, stake: 0, deckWins: {},
      stats: { bosses: 0, wins: 0, runs: 0, best: 0, bestHand: 0, rounds: 0, maxSoles: 0, recruited: 0, cumbias: 0, discards: 0, hands: {} },
      last: { deck: 'rosa', stake: 0 }, skin: 'chicha'
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
  // A deck is open if it has no condition, its achievement is done, or the required deck was won at the required stake.
  function deckUnlocked(d) {
    if (d.ach) return !!m.ach[d.ach];
    if (d.win) return (m.deckWins[d.win.deck] ?? -1) >= d.win.stake;
    return true;
  }
  // Text shown on a locked deck.
  function deckReq(d) {
    if (d.ach) { const a = ACHIEVEMENTS.find(x => x.id === d.ach); return { title: a.n, text: a.d }; }
    if (d.win) {
      const src = DECKS.find(x => x.id === d.win.deck), sk = STAKES[d.win.stake];
      return { title: 'Finir le ' + src.n, text: `Gagne une partie avec le ${src.n} en Mise ${sk.n} (ou plus difficile)` };
    }
    return null;
  }

  // Lifetime stats. Every change can unlock cards, so listeners get called.
  function changed() { save(); statListeners.forEach(fn => fn()); }
  function add(key, n) { m.stats[key] = (m.stats[key] || 0) + (n == null ? 1 : n); changed(); }
  function max(key, v) { if (v > (m.stats[key] || 0)) { m.stats[key] = v; changed(); } }
  function addHand(id) {
    m.stats.hands[id] = (m.stats.hands[id] || 0) + 1;
    changed();
    const fl = (m.stats.hands.flush || 0) + (m.stats.hands.sflush || 0) + (m.stats.hands.fhouse || 0) + (m.stats.hands.ffive || 0);
    if (fl >= 10) unlock('flush10');
    if (fl >= 25) unlock('flush25');
    if (['five', 'fhouse', 'ffive'].includes(id)) unlock('secret');
  }

  function winRun(deckId, stake) {
    const before = DECKS.filter(deckUnlocked).map(d => d.id);
    m.stats.wins++;
    m.stake = Math.max(m.stake, Math.min(STAKES.length - 1, stake + 1));
    m.deckWins[deckId] = Math.max(m.deckWins[deckId] ?? -1, stake);
    changed();
    // decks opened by this win
    DECKS.filter(d => d.win && deckUnlocked(d) && !before.includes(d.id)).forEach(d => {
      const src = DECKS.find(x => x.id === d.win.deck);
      listeners.forEach(fn => fn({ n: src.n + ' fini !', d: 'Mise ' + STAKES[d.win.stake].n }, d));
    });
    unlock('champion');
    if (stake === STAKES.length - 1) unlock('negra');
  }

  window.Meta = {
    DECKS, ACHIEVEMENTS, STAKES, SKINS,
    skinUnlocked: k => !k.ach || !!m.ach[k.ach],
    get data() { return m; },
    save, unlock, deckUnlocked, deckReq, winRun, add, max, addHand,
    onUnlock: fn => listeners.push(fn),
    onStats: fn => statListeners.push(fn),
    reset() { m = blank(); save(); }
  };
})();
