/* Shop items beyond super cards:
   - améliorations (playing card mutations), éditions (super card mutations)
   - cartes Voyance (consumables that change playing cards or give bonuses)
   - Vinyles (consumables that level up a poker hand)
   - Tickets VIP (permanent upgrades for the run)
   - Pochettes (boosters: choose cards among 4 or 5)
   All names, effects and artwork are original to Chichalatro. */
(function () {
  const INK = '#1d1022';

  // ---------- playing card mutations ----------
  const ENH = {
    bonus: { n: 'Bonus', d: '+30 Jetons quand elle est jouée', ico: '+30', col: '#0f9be8' },
    piment: { n: 'Piment', d: '+4 Mult quand elle est jouée', ico: '🌶', col: '#ff3355' },
    joker: { n: 'Caméléon', d: 'Compte comme toutes les couleurs', ico: '🦎', col: '#13b86b' },
    verre: { n: 'Verre', d: '×2 Mult quand elle est jouée. 1 chance sur 4 de se briser', ico: '🍸', col: '#9fe8ff' },
    acier: { n: 'Acier', d: '×1,5 Mult si elle reste en main', ico: '⚙', col: '#9aa3b5' },
    or: { n: 'Or', d: '+3 € si elle reste en main à la fin de la manche', ico: '🪙', col: '#ffc93c' },
    chance: { n: 'Chance', d: '1 chance sur 5 : +20 Mult. 1 chance sur 15 : +20 €', ico: '🍀', col: '#2bff6e' },
    pierre: { n: 'Pierre', d: '+50 Jetons. Pas de valeur ni de couleur, compte toujours', ico: '🪨', col: '#8a7f73' }
  };
  const ENH_IDS = Object.keys(ENH);

  // ---------- super card mutations ----------
  const EDITIONS = {
    neon: { n: 'Néon', d: '+50 Jetons', w: 20, price: 2 },
    holo: { n: 'Holo', d: '+10 Mult', w: 14, price: 3 },
    arc: { n: 'Arc-en-ciel', d: '×1,5 Mult', w: 3, price: 5 },
    negatif: { n: 'Négatif', d: '+1 emplacement de super carte', w: 3, price: 5 }
  };
  // base chance for a super card to come with an edition (in %)
  function rollEdition(mul) {
    const r = Math.random() * 100 / (mul || 1);
    let acc = 0;
    for (const [id, e] of Object.entries(EDITIONS)) { acc += e.w / 10; if (r < acc) return id; }
    return null;
  }

  // ---------- cartes Voyance ----------
  // max = how many cards in hand to select, min = minimum, need: 'cards' (needs a selection) or 'none'
  const enhance = (id) => (ctx) => ctx.targets.forEach(c => ctx.setEnh(c, id));
  const VOYANCE = [
    { id: 'pimentee', n: 'La Pimentée', d: 'Jusqu\'à 2 cartes deviennent Piment', max: 2, ico: '🌶', apply: enhance('piment') },
    { id: 'genereuse', n: 'La Généreuse', d: 'Jusqu\'à 2 cartes deviennent Bonus', max: 2, ico: '🎁', apply: enhance('bonus') },
    { id: 'cameleon', n: 'Le Caméléon', d: 'Jusqu\'à 2 cartes deviennent Caméléon', max: 2, ico: '🦎', apply: enhance('joker') },
    { id: 'vitrier', n: 'Le Vitrier', d: '1 carte devient Verre', max: 1, ico: '🍸', apply: enhance('verre') },
    { id: 'forgeron', n: 'Le Forgeron', d: 'Jusqu\'à 2 cartes deviennent Acier', max: 2, ico: '⚒', apply: enhance('acier') },
    { id: 'bijoutier', n: 'Le Bijoutier', d: '1 carte devient Or', max: 1, ico: '💍', apply: enhance('or') },
    { id: 'portebonheur', n: 'Le Porte-bonheur', d: 'Jusqu\'à 2 cartes deviennent Chance', max: 2, ico: '🍀', apply: enhance('chance') },
    { id: 'macon', n: 'Le Maçon', d: '1 carte devient Pierre', max: 1, ico: '🧱', apply: enhance('pierre') },
    { id: 'teinturier', n: 'Le Teinturier', d: '2 ou 3 cartes prennent la couleur de la carte la plus à gauche', max: 3, min: 2, ico: '🎨', apply: ctx => { const s = ctx.targets[0].suit; ctx.targets.forEach(c => ctx.setSuit(c, s)); } },
    { id: 'promo', n: 'La Promo', d: 'Jusqu\'à 2 cartes montent d\'un rang', max: 2, ico: '📈', apply: ctx => ctx.targets.forEach(c => ctx.rankUp(c)) },
    { id: 'broyeuse', n: 'La Broyeuse', d: 'Détruit jusqu\'à 2 cartes de ton deck', max: 2, ico: '🗑', apply: ctx => ctx.destroy(ctx.targets) },
    { id: 'photocopieur', n: 'Le Photocopieur', d: 'Sélectionne 2 cartes : celle de gauche devient une copie de celle de droite', max: 2, min: 2, ico: '🖨', apply: ctx => ctx.copy(ctx.targets[1], ctx.targets[0]) },
    { id: 'tirelire', n: 'La Tirelire', d: 'Double ton argent (20 € max)', max: 0, ico: '🐷', apply: ctx => ctx.money(Math.min(20, Math.max(0, ctx.st.soles))) },
    { id: 'fanclub', n: 'Le Fan-club', d: 'Crée une super carte au hasard (s\'il y a de la place)', max: 0, ico: '📣', can: ctx => ctx.st.supers.filter(s => s.ed !== 'negatif').length < ctx.st.maxSupers, apply: ctx => ctx.newSuper() },
    { id: 'dj', n: 'Le DJ', d: 'Crée jusqu\'à 2 Vinyles au hasard (s\'il y a de la place)', max: 0, ico: '🎧', apply: ctx => { ctx.newVinyl(); ctx.newVinyl(); } },
    { id: 'roue', n: 'La Roue de la fortune', d: '1 chance sur 4 d\'ajouter une édition à une super carte au hasard', max: 0, ico: '🎡', can: ctx => ctx.st.supers.some(s => !s.ed), apply: ctx => ctx.wheel() }
  ];
  const VOY = Object.fromEntries(VOYANCE.map(v => [v.id, v]));

  // ---------- Tickets VIP (one per night in the shop, permanent for the run) ----------
  const VOUCHERS = [
    { id: 'bras', n: 'Bras long', d: '+1 main à chaque manche', ico: '✋', col: '#18d6ff' },
    { id: 'poubelle', n: 'Poubelle XL', d: '+1 défausse à chaque manche', ico: '🗑', col: '#ff3355' },
    { id: 'grandemain', n: 'Grande main', d: '+1 carte en main', ico: '🖐', col: '#ff7a00' },
    { id: 'vip', n: 'Carte VIP', d: '+1 emplacement de super carte', ico: '⭐', col: '#ffc93c', price: 12 },
    { id: 'codepromo', n: 'Code promo', d: 'Tout coûte 25 % moins cher dans la ChichaClub', ico: '🏷', col: '#2bff6e' },
    { id: 'relance', n: 'Relance facile', d: 'Les relances coûtent 2 € de moins', ico: '🔁', col: '#a43bff' },
    { id: 'sac', n: 'Sac banane', d: '+1 emplacement de consommable', ico: '🎒', col: '#ff2e88' },
    { id: 'cochon', n: 'Cochon tirelire', d: 'Intérêts plafonnés 5 € plus haut', ico: '🐖', col: '#ff86de' },
    { id: 'disquaire', n: 'Disquaire', d: 'Les Vinyles sortent 2× plus souvent', ico: '💿', col: '#2bff6e' },
    { id: 'cristal', n: 'Boule de cristal', d: 'Les cartes Voyance sortent 2× plus souvent', ico: '🔮', col: '#a43bff' },
    { id: 'paillettes', n: 'Paillettes', d: 'Les éditions sont 2× plus fréquentes', ico: '✨', col: '#ffe600' },
    { id: 'etal', n: 'Étal en plus', d: '+1 article en vente dans la ChichaClub', ico: '🛒', col: '#ff7a00' }
  ];
  const VCH = Object.fromEntries(VOUCHERS.map(v => [v.id, v]));

  // ---------- Pochettes (boosters) ----------
  const PACKS = [
    { id: 'bande', n: 'Pochette Bande', kind: 'super', size: 4, pick: 1, price: 5, col: '#ff2e88', w: 3 },
    { id: 'bandexl', n: 'Méga Pochette Bande', kind: 'super', size: 5, pick: 2, price: 9, col: '#ff2e88', w: 1 },
    { id: 'voyance', n: 'Pochette Voyance', kind: 'voyance', size: 4, pick: 1, price: 4, col: '#a43bff', w: 3 },
    { id: 'voyancexl', n: 'Méga Pochette Voyance', kind: 'voyance', size: 5, pick: 2, price: 8, col: '#a43bff', w: 1 },
    { id: 'vinyle', n: 'Pochette Vinyles', kind: 'vinyl', size: 4, pick: 1, price: 4, col: '#13b86b', w: 3 },
    { id: 'vinylexl', n: 'Méga Pochette Vinyles', kind: 'vinyl', size: 5, pick: 2, price: 8, col: '#13b86b', w: 1 },
    { id: 'cartes', n: 'Pochette Cartes', kind: 'cards', size: 4, pick: 1, price: 4, col: '#ff7a00', w: 3 },
    { id: 'cartesxl', n: 'Méga Pochette Cartes', kind: 'cards', size: 5, pick: 2, price: 7, col: '#ff7a00', w: 1 }
  ];
  function rollPack() {
    const total = PACKS.reduce((s, p) => s + p.w, 0);
    let r = Math.random() * total;
    for (const p of PACKS) { r -= p.w; if (r <= 0) return p; }
    return PACKS[0];
  }

  // ---------- artwork ----------
  function voyanceArt(v) {
    return `<div class="item voy"><svg viewBox="0 0 63 88" aria-hidden="true">
      <rect x="1" y="1" width="61" height="86" rx="6" fill="#2b1140" stroke="${INK}" stroke-width="2"/>
      <rect x="5" y="5" width="53" height="78" rx="4" fill="none" stroke="#ffc93c" stroke-width="1.2"/>
      ${[0, 1, 2, 3, 4, 5, 6, 7].map(i => `<path d="M31.5 38 L${31.5 + 30 * Math.cos(i * Math.PI / 4)} ${38 + 30 * Math.sin(i * Math.PI / 4)}" stroke="#a43bff" stroke-width="3" opacity=".45"/>`).join('')}
      <circle cx="31.5" cy="38" r="16" fill="#3d1a5c" stroke="#ffc93c" stroke-width="1.5"/>
      <path d="M8 12 l2 -4 l2 4 l-2 4 Z M51 70 l2 -4 l2 4 l-2 4 Z" fill="#ffc93c"/>
    </svg><span class="ico">${v.ico}</span><span class="nm">${v.n}</span></div>`;
  }
  function vinylArt(h) {
    return `<div class="item vin"><svg viewBox="0 0 63 88" aria-hidden="true">
      <rect x="1" y="1" width="61" height="86" rx="6" fill="#0f3a2a" stroke="${INK}" stroke-width="2"/>
      <circle cx="31.5" cy="38" r="24" fill="#120a18" stroke="#000" stroke-width="1.5"/>
      ${[20, 16, 12].map(r => `<circle cx="31.5" cy="38" r="${r}" fill="none" stroke="#2a1d33" stroke-width="1"/>`).join('')}
      <circle cx="31.5" cy="38" r="8" fill="#ff2e88"/><circle cx="31.5" cy="38" r="1.6" fill="#000"/>
      <path d="M31.5 30 A8 8 0 0 1 39.5 38 L31.5 38 Z" fill="#ffe600"/>
    </svg><span class="nm">${h.n}</span></div>`;
  }
  function ticketArt(v) {
    return `<div class="item tkt" style="--tc:${v.col}"><svg viewBox="0 0 70 92" aria-hidden="true">
      <path d="M4 4 H66 V30 A6 6 0 0 0 66 42 V88 H4 V42 A6 6 0 0 0 4 30 Z" fill="${v.col}" stroke="${INK}" stroke-width="2.5"/>
      <path d="M4 36 H66" stroke="${INK}" stroke-width="1.5" stroke-dasharray="3 3"/>
      <rect x="10" y="9" width="50" height="16" rx="3" fill="#fff6e6" stroke="${INK}" stroke-width="1.5"/>
      <text x="35" y="21" text-anchor="middle" font-family="Bungee, sans-serif" font-size="9" fill="${INK}">TICKET VIP</text>
    </svg><span class="ico">${v.ico}</span></div>`;
  }
  function packArt(p) {
    const label = { super: 'BANDE', voyance: 'VOYANCE', vinyl: 'VINYLES', cards: 'CARTES' }[p.kind];
    return `<div class="item pck${p.pick > 1 ? ' xl' : ''}" style="--pc:${p.col}"><svg viewBox="0 0 66 92" aria-hidden="true">
      <path d="M6 8 L10 4 L14 8 L18 4 L22 8 L26 4 L30 8 L34 4 L38 8 L42 4 L46 8 L50 4 L54 8 L58 4 L60 8 V84 L56 88 L52 84 L48 88 L44 84 L40 88 L36 84 L32 88 L28 84 L24 88 L20 84 L16 88 L12 84 L8 88 L6 84 Z" fill="${p.col}" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>
      <rect x="6" y="14" width="54" height="6" fill="#fff6e6" opacity=".55"/><rect x="6" y="72" width="54" height="6" fill="#fff6e6" opacity=".55"/>
      <rect x="11" y="30" width="44" height="30" rx="4" fill="${INK}"/>
      <text x="33" y="44" text-anchor="middle" font-family="Bungee, sans-serif" font-size="7.5" fill="#fff6e6">${label}</text>
      <text x="33" y="55" text-anchor="middle" font-family="Bungee, sans-serif" font-size="6.5" fill="#ffe600">${p.pick > 1 ? `${p.pick} parmi ${p.size}` : `1 parmi ${p.size}`}</text>
    </svg><i class="shine"></i></div>`;
  }

  window.Items = { ENH, ENH_IDS, EDITIONS, rollEdition, VOYANCE, VOY, VOUCHERS, VCH, PACKS, rollPack, voyanceArt, vinylArt, ticketArt, packArt };
})();
