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
    bonus: { n: 'Bonus', d: '+30 Jetons quand elle est jouée', ico: 'bonus', col: '#0f9be8' },
    piment: { n: 'Piment', d: '+4 Mult quand elle est jouée', ico: 'piment', col: '#ff3355' },
    joker: { n: 'Caméléon', d: 'Compte comme toutes les couleurs', ico: 'joker', col: '#13b86b' },
    verre: { n: 'Verre', d: '×2 Mult quand elle est jouée. 1 chance sur 4 de se briser', ico: 'verre', col: '#9fe8ff' },
    acier: { n: 'Acier', d: '×1,5 Mult si elle reste en main', ico: 'acier', col: '#9aa3b5' },
    or: { n: 'Or', d: '+3 € si elle reste en main à la fin de la manche', ico: 'or', col: '#ffc93c' },
    chance: { n: 'Chance', d: '1 chance sur 5 : +20 Mult. 1 chance sur 15 : +20 €', ico: 'chance', col: '#2bff6e' },
    pierre: { n: 'Pierre', d: '+50 Jetons. Pas de valeur ni de couleur, compte toujours', ico: 'pierre', col: '#8a7f73' }
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
    { id: 'pimentee', n: 'La Pimentée', d: 'Jusqu\'à 2 cartes deviennent Piment', max: 2, ico: 'piment', apply: enhance('piment') },
    { id: 'genereuse', n: 'La Généreuse', d: 'Jusqu\'à 2 cartes deviennent Bonus', max: 2, ico: 'cadeau', apply: enhance('bonus') },
    { id: 'cameleon', n: 'Le Caméléon', d: 'Jusqu\'à 2 cartes deviennent Caméléon', max: 2, ico: 'lezard', apply: enhance('joker') },
    { id: 'vitrier', n: 'Le Vitrier', d: '1 carte devient Verre', max: 1, ico: 'verre', apply: enhance('verre') },
    { id: 'forgeron', n: 'Le Forgeron', d: 'Jusqu\'à 2 cartes deviennent Acier', max: 2, ico: 'marteau', apply: enhance('acier') },
    { id: 'bijoutier', n: 'Le Bijoutier', d: '1 carte devient Or', max: 1, ico: 'bague', apply: enhance('or') },
    { id: 'portebonheur', n: 'Le Porte-bonheur', d: 'Jusqu\'à 2 cartes deviennent Chance', max: 2, ico: 'chance', apply: enhance('chance') },
    { id: 'macon', n: 'Le Maçon', d: '1 carte devient Pierre', max: 1, ico: 'brique', apply: enhance('pierre') },
    { id: 'teinturier', n: 'Le Teinturier', d: '2 ou 3 cartes prennent la couleur de la carte la plus à gauche', max: 3, min: 2, ico: 'pinceau', apply: ctx => { const s = ctx.targets[0].suit; ctx.targets.forEach(c => ctx.setSuit(c, s)); } },
    { id: 'promo', n: 'La Promo', d: 'Jusqu\'à 2 cartes montent d\'un rang', max: 2, ico: 'fleche', apply: ctx => ctx.targets.forEach(c => ctx.rankUp(c)) },
    { id: 'broyeuse', n: 'La Broyeuse', d: 'Détruit jusqu\'à 2 cartes de ton deck', max: 2, ico: 'broyeuse', apply: ctx => ctx.destroy(ctx.targets) },
    { id: 'photocopieur', n: 'Le Photocopieur', d: 'Sélectionne 2 cartes : celle de gauche devient une copie de celle de droite', max: 2, min: 2, ico: 'copie', apply: ctx => ctx.copy(ctx.targets[1], ctx.targets[0]) },
    { id: 'tirelire', n: 'La Tirelire', d: 'Double ton argent (20 € max)', max: 0, ico: 'cochon', apply: ctx => ctx.money(Math.min(20, Math.max(0, ctx.st.soles))) },
    { id: 'fanclub', n: 'Le Fan-club', d: 'Crée une super carte au hasard (s\'il y a de la place)', max: 0, ico: 'megaphone', can: ctx => ctx.st.supers.filter(s => s.ed !== 'negatif').length < ctx.st.maxSupers, apply: ctx => ctx.newSuper() },
    { id: 'dj', n: 'Le DJ', d: 'Crée jusqu\'à 2 Vinyles au hasard (s\'il y a de la place)', max: 0, ico: 'casque', apply: ctx => { ctx.newVinyl(); ctx.newVinyl(); } },
    { id: 'roue', n: 'La Roue de la fortune', d: '1 chance sur 4 d\'ajouter une édition à une super carte au hasard', max: 0, ico: 'roue', can: ctx => ctx.st.supers.some(s => !s.ed), apply: ctx => ctx.wheel() }
  ];
  const VOY = Object.fromEntries(VOYANCE.map(v => [v.id, v]));

  // ---------- Tickets VIP (one per night in the shop, permanent for the run) ----------
  const VOUCHERS = [
    { id: 'bras', n: 'Bras long', d: '+1 main à chaque manche', ico: 'main', col: '#18d6ff' },
    { id: 'poubelle', n: 'Poubelle XL', d: '+1 défausse à chaque manche', ico: 'poubelle', col: '#ff3355' },
    { id: 'grandemain', n: 'Grande main', d: '+1 carte en main', ico: 'eventail', col: '#ff7a00' },
    { id: 'vip', n: 'Carte VIP', d: '+1 emplacement de super carte', ico: 'etoile', col: '#ffc93c', price: 12 },
    { id: 'codepromo', n: 'Code promo', d: 'Tout coûte 25 % moins cher dans la ChichaClub', ico: 'etiquette', col: '#2bff6e' },
    { id: 'relance', n: 'Relance facile', d: 'Les relances coûtent 2 € de moins', ico: 'relance', col: '#a43bff' },
    { id: 'sac', n: 'Sac banane', d: '+1 emplacement de consommable', ico: 'banane', col: '#ff2e88' },
    { id: 'cochon', n: 'Cochon tirelire', d: 'Intérêts plafonnés 5 € plus haut', ico: 'cochon', col: '#ff86de' },
    { id: 'disquaire', n: 'Disquaire', d: 'Les Vinyles sortent 2× plus souvent', ico: 'disque', col: '#2bff6e' },
    { id: 'cristal', n: 'Boule de cristal', d: 'Les cartes Voyance sortent 2× plus souvent', ico: 'boule', col: '#a43bff' },
    { id: 'paillettes', n: 'Paillettes', d: 'Les éditions sont 2× plus fréquentes', ico: 'paillettes', col: '#ffe600' },
    { id: 'etal', n: 'Étal en plus', d: '+1 article en vente dans la ChichaClub', ico: 'chariot', col: '#ff7a00' }
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

  // ---------- artwork (original, built from the Icons set) ----------
  const HAND_COL = { high: '#9aa3b5', pair: '#18d6ff', two: '#0f9be8', three: '#2bff6e', straight: '#ff7a00', flush: '#ff2e88', full: '#a43bff', four: '#ffc93c', sflush: '#ff3355' };
  function voyanceArt(v) {
    return `<div class="item voy"><svg class="bgsvg" viewBox="0 0 63 88" aria-hidden="true">
      <defs><linearGradient id="vg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3d1466"/><stop offset="1" stop-color="#1a0a2e"/></linearGradient></defs>
      <rect x="1" y="1" width="61" height="86" rx="6" fill="url(#vg)" stroke="${INK}" stroke-width="2"/>
      <rect x="4.5" y="4.5" width="54" height="79" rx="4" fill="none" stroke="#ffc93c" stroke-width="1.4"/>
      <rect x="7" y="7" width="49" height="74" rx="3" fill="none" stroke="#ffc93c" stroke-width=".6" stroke-dasharray="2 1.6"/>
      <path d="M12 52 V26 A19.5 19.5 0 0 1 51 26 V52 Z" fill="#2a0d47" stroke="#ffc93c" stroke-width="1"/>
      ${[[14, 14], [49, 16], [16, 58], [47, 60], [31.5, 9]].map(([x, y]) => `<path d="M${x} ${y - 2.4} L${x + .7} ${y - .7} L${x + 2.4} ${y} L${x + .7} ${y + .7} L${x} ${y + 2.4} L${x - .7} ${y + .7} L${x - 2.4} ${y} L${x - .7} ${y - .7} Z" fill="#ffe8a3"/>`).join('')}
      <path d="M5 66 h53 v12 h-53 z" fill="#ffc93c" stroke="${INK}" stroke-width="1"/>
      <path d="M5 66 l-3 6 l3 6 M58 66 l3 6 l-3 6" fill="#c98a00" stroke="${INK}" stroke-width="1"/>
    </svg><span class="ico voy-ico">${Icons.svg(v.ico)}</span><span class="nm voy-nm">${v.n}</span></div>`;
  }
  function vinylArt(h) {
    const c = HAND_COL[h.id] || '#2bff6e';
    return `<div class="item vin" style="--hc:${c}"><svg class="bgsvg" viewBox="0 0 63 88" aria-hidden="true">
      <rect x="1" y="1" width="61" height="86" rx="6" fill="${c}" stroke="${INK}" stroke-width="2"/>
      <clipPath id="vs-${h.id}"><rect x="1" y="1" width="61" height="86" rx="6"/></clipPath>
      <g clip-path="url(#vs-${h.id})">${[0, 1, 2, 3, 4, 5, 6].map(i => `<path d="M${-20 + i * 14} 90 L${10 + i * 14} 0 L${17 + i * 14} 0 L${-13 + i * 14} 90 Z" fill="#000" opacity=".12"/>`).join('')}</g>
      <circle cx="31.5" cy="32" r="22" fill="#140b1a" stroke="${INK}" stroke-width="1.5"/>
      ${[18, 14.5, 11].map(r => `<circle cx="31.5" cy="32" r="${r}" fill="none" stroke="#3a2a4a" stroke-width=".8"/>`).join('')}
      <circle cx="31.5" cy="32" r="7.5" fill="#fff6e6" stroke="${INK}" stroke-width="1"/>
      <circle cx="31.5" cy="32" r="5" fill="${c}"/><circle cx="31.5" cy="32" r="1.3" fill="${INK}"/>
      <path d="M17 18 a20 20 0 0 1 9 -6" fill="none" stroke="#fff" stroke-width="1.4" opacity=".35" stroke-linecap="round"/>
      <rect x="4" y="62" width="55" height="20" rx="3" fill="#fff6e6" stroke="${INK}" stroke-width="1.2"/>
      <text x="31.5" y="70" text-anchor="middle" font-family="Bungee, sans-serif" font-size="5" fill="${INK}" opacity=".7">VINYLE</text>
    </svg><span class="nm vin-nm">${h.n}</span></div>`;
  }
  function ticketArt(v) {
    const holes = Array.from({ length: 9 }, (_, i) => `<circle cx="2" cy="${12 + i * 9}" r="1.8" fill="#120a18"/><circle cx="68" cy="${12 + i * 9}" r="1.8" fill="#120a18"/>`).join('');
    return `<div class="item tkt" style="--tc:${v.col}"><svg class="bgsvg" viewBox="0 0 70 92" aria-hidden="true">
      <defs><linearGradient id="tg-${v.id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".45"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".18"/></linearGradient></defs>
      <rect x="2" y="2" width="66" height="88" rx="6" fill="${v.col}" stroke="${INK}" stroke-width="2.4"/>
      <rect x="2" y="2" width="66" height="88" rx="6" fill="url(#tg-${v.id})"/>
      ${holes}
      <rect x="9" y="7" width="52" height="14" rx="3" fill="${INK}"/>
      <text x="35" y="17.4" text-anchor="middle" font-family="Bungee, sans-serif" font-size="7.6" fill="#ffc93c">TICKET VIP</text>
      <circle cx="35" cy="45" r="18" fill="#fff6e6" stroke="${INK}" stroke-width="2"/>
      <circle cx="35" cy="45" r="15" fill="none" stroke="${v.col}" stroke-width="1.4" stroke-dasharray="2.4 1.8"/>
      <path d="M8 70 H62" stroke="${INK}" stroke-width="1.2" stroke-dasharray="3 2.4"/>
      <rect x="9" y="74" width="52" height="11" rx="2.4" fill="#fff6e6" stroke="${INK}" stroke-width="1.2"/>
    </svg><span class="ico tkt-ico">${Icons.svg(v.ico)}</span><span class="nm tkt-nm">${v.n}</span><i class="shine"></i></div>`;
  }
  function packArt(p) {
    const label = { super: 'BANDE', voyance: 'VOYANCE', vinyl: 'VINYLES', cards: 'CARTES' }[p.kind];
    const art = p.kind === 'super' ? Icons.svg('eventail') : p.kind === 'voyance' ? Icons.svg('boule') : p.kind === 'vinyl' ? Icons.svg('disque')
      : `<span class="suits"><b style="color:#e5126a">♥</b><b style="color:#f26100">♦</b><b style="color:#0c9a4a">♣</b><b style="color:#3a2fd1">♠</b></span>`;
    const zig = (y, up) => Array.from({ length: 15 }, (_, i) => `${i ? 'L' : 'M'}${4 + i * 4} ${up ? (i % 2 ? y - 3.4 : y) : (i % 2 ? y + 3.4 : y)}`).join(' ');
    return `<div class="item pck${p.pick > 1 ? ' xl' : ''}" style="--pc:${p.col}"><svg class="bgsvg" viewBox="0 0 66 92" aria-hidden="true">
      <defs><linearGradient id="pg-${p.id}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity=".25"/><stop offset=".35" stop-color="#fff" stop-opacity=".35"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".3"/></linearGradient></defs>
      <path d="${zig(8, true)} L60 84 ${zig(84, false).replace('M', 'L').split(' ').reverse().join(' ')} Z" fill="${p.col}" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/>
      <rect x="4" y="6" width="58" height="80" fill="url(#pg-${p.id})"/>
      <rect x="4" y="11" width="58" height="5" fill="#fff6e6" opacity=".6"/><rect x="4" y="76" width="58" height="5" fill="#fff6e6" opacity=".6"/>
      <circle cx="33" cy="38" r="17" fill="${INK}" opacity=".85"/><circle cx="33" cy="38" r="17" fill="none" stroke="#fff6e6" stroke-width="1.4" stroke-dasharray="3 2"/>
      <rect x="8" y="59" width="50" height="13" rx="3" fill="${INK}"/>
      <text x="33" y="68.4" text-anchor="middle" font-family="Bungee, sans-serif" font-size="7" fill="#fff6e6">${label}</text>
    </svg><span class="ico pck-ico">${art}</span>${p.pick > 1 ? '<span class="mega">MÉGA</span>' : ''}<span class="pck-sub">${p.pick} parmi ${p.size}</span><i class="shine"></i></div>`;
  }

  window.Items = { ENH, ENH_IDS, EDITIONS, rollEdition, VOYANCE, VOY, VOUCHERS, VCH, PACKS, rollPack, voyanceArt, vinylArt, ticketArt, packArt };
})();
