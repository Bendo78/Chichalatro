/* Original artwork drawn in SVG: the Chichalatro clown logo, playing card faces, card backs. */
(function () {
  const INK = '#1d1022';
  const SUIT_INK = { C: '#e5126a', K: '#f26100', T: '#0c9a4a', P: '#3a2fd1' };
  const SUIT_SYM = { C: '♥', K: '♦', T: '♣', P: '♠' };

  // ---------- logo: a circus clown with rainbow hair, smoking a chicha (hookah) ----------
  function clown() {
    const hair = ['#ff2e88', '#ff7a00', '#ffe600', '#2bff6e', '#18d6ff', '#a43bff'];
    const puff = (cx, cy, side) => hair.map((c, i) => {
      const a = (-70 + i * 30) * Math.PI / 180;
      const x = cx + side * Math.cos(a) * 26, y = cy + Math.sin(a) * 30;
      return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="19" fill="${c}" stroke="${INK}" stroke-width="5"/>`;
    }).join('');
    const smoke = [0, 1, 2, 3, 4].map(i => `<circle class="smk smk${i}" cx="0" cy="0" r="${9 + i * 3}" fill="none" stroke="#efe6ff" stroke-width="${5 - i * .6}" opacity="0"/>`).join('');
    return `<svg class="clown" viewBox="0 0 420 300" aria-hidden="true">
      <defs>
        <radialGradient id="glass" cx="40%" cy="35%"><stop offset="0" stop-color="#bff6ff"/><stop offset=".6" stop-color="#18d6ff"/><stop offset="1" stop-color="#0a5d8f"/></radialGradient>
        <radialGradient id="coal"><stop offset="0" stop-color="#fff2a8"/><stop offset=".5" stop-color="#ff7a00"/><stop offset="1" stop-color="#b3001b"/></radialGradient>
      </defs>
      <!-- hookah -->
      <g class="hookah">
        <ellipse cx="318" cy="276" rx="58" ry="10" fill="#000" opacity=".35"/>
        <path d="M318 168 C 268 176 262 270 318 272 C 374 270 368 176 318 168 Z" fill="url(#glass)" stroke="${INK}" stroke-width="6"/>
        <path d="M296 200 q -8 28 4 52" stroke="#fff" stroke-width="6" fill="none" opacity=".55" stroke-linecap="round"/>
        <rect x="309" y="92" width="18" height="80" rx="4" fill="#ffe600" stroke="${INK}" stroke-width="6"/>
        <rect x="300" y="132" width="36" height="12" rx="5" fill="#ff2e88" stroke="${INK}" stroke-width="5"/>
        <ellipse cx="318" cy="92" rx="38" ry="9" fill="#a43bff" stroke="${INK}" stroke-width="5"/>
        <path d="M296 88 L 302 60 L 334 60 L 340 88 Z" fill="#ff7a00" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>
        <ellipse class="coal" cx="318" cy="58" rx="20" ry="7" fill="url(#coal)" stroke="${INK}" stroke-width="4"/>
        <g class="smoke-top" transform="translate(318 44)">${smoke}</g>
      </g>
      <!-- hose -->
      <path d="M327 150 C 380 150 372 236 300 240 C 236 244 196 222 178 196" fill="none" stroke="${INK}" stroke-width="15" stroke-linecap="round"/>
      <path d="M327 150 C 380 150 372 236 300 240 C 236 244 196 222 178 196" fill="none" stroke="#2bff6e" stroke-width="8" stroke-linecap="round" stroke-dasharray="10 8"/>
      <!-- clown -->
      <g class="clown-head">
        <path d="M70 238 l 24 -26 l 22 26 l 22 -26 l 22 26 l 22 -26 l 22 26 l 22 -26 l 18 26 Z" fill="#ff2e88" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>
        <path d="M80 238 l 20 18 l 20 -18 l 20 18 l 20 -18 l 20 18 l 20 -18 l 20 18 l 20 -18 l 10 10 L 80 248 Z" fill="#ffe600" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>
        ${puff(78, 132, -1)}${puff(222, 132, 1)}
        <ellipse cx="150" cy="142" rx="74" ry="82" fill="#fff8ef" stroke="${INK}" stroke-width="6"/>
        <!-- hat -->
        <path d="M112 76 L 150 -4 L 188 76 Z" fill="#18d6ff" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>
        <path d="M128 42 L 172 42 M 120 60 L 180 60" stroke="#ff2e88" stroke-width="9"/>
        <circle cx="150" cy="-2" r="12" fill="#ffe600" stroke="${INK}" stroke-width="5"/>
        <ellipse cx="150" cy="76" rx="46" ry="9" fill="#a43bff" stroke="${INK}" stroke-width="5"/>
        <!-- eye makeup and relaxed eyes -->
        <path d="M108 110 l 8 -18 l 8 18 l -8 18 Z" fill="#18d6ff" stroke="${INK}" stroke-width="3"/>
        <path d="M176 110 l 8 -18 l 8 18 l -8 18 Z" fill="#18d6ff" stroke="${INK}" stroke-width="3"/>
        <path class="eye" d="M104 116 q 12 -12 24 0" fill="none" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>
        <path class="eye" d="M172 116 q 12 -12 24 0" fill="none" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>
        <path d="M100 98 q 14 -10 30 -2 M 170 96 q 16 -8 30 2" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>
        <ellipse cx="102" cy="150" rx="12" ry="8" fill="#ff2e88" opacity=".5"/>
        <ellipse cx="198" cy="150" rx="12" ry="8" fill="#ff2e88" opacity=".5"/>
        <!-- painted smile with mouthpiece -->
        <path d="M100 168 Q 150 222 204 168 Q 150 196 100 168 Z" fill="#ff2e88" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>
        <path d="M120 180 Q 150 200 182 180" fill="none" stroke="#fff8ef" stroke-width="4" stroke-linecap="round"/>
        <rect x="168" y="182" width="26" height="12" rx="5" transform="rotate(32 181 188)" fill="#ffe600" stroke="${INK}" stroke-width="4"/>
        <circle cx="150" cy="146" r="17" fill="#ff1a3c" stroke="${INK}" stroke-width="5"/>
        <circle cx="144" cy="140" r="5" fill="#fff" opacity=".85"/>
        <g class="smoke-mouth" transform="translate(112 186)">${smoke}</g>
      </g>
    </svg>`;
  }

  function wordmark() {
    return `<span class="wm">${'CHICHALATRO'.split('').map((ch, i) => `<i style="--k:${i}">${ch}</i>`).join('')}</span>`;
  }

  function logo(size) {
    return `<div class="logo ${size || ''}">${clown()}${wordmark()}</div>`;
  }

  // ---------- playing cards ----------
  const PIPS = {
    2: [[50, 20], [50, 80, 1]],
    3: [[50, 20], [50, 50], [50, 80, 1]],
    4: [[30, 20], [70, 20], [30, 80, 1], [70, 80, 1]],
    5: [[30, 20], [70, 20], [50, 50], [30, 80, 1], [70, 80, 1]],
    6: [[30, 20], [70, 20], [30, 50], [70, 50], [30, 80, 1], [70, 80, 1]],
    7: [[30, 20], [70, 20], [50, 35], [30, 50], [70, 50], [30, 80, 1], [70, 80, 1]],
    8: [[30, 20], [70, 20], [50, 35], [30, 50], [70, 50], [50, 65, 1], [30, 80, 1], [70, 80, 1]],
    9: [[30, 18], [70, 18], [30, 39], [70, 39], [50, 50], [30, 61, 1], [70, 61, 1], [30, 82, 1], [70, 82, 1]],
    10: [[30, 18], [70, 18], [50, 29], [30, 39], [70, 39], [30, 61, 1], [70, 61, 1], [50, 71, 1], [30, 82, 1], [70, 82, 1]]
  };

  // Face cards: top half figure, mirrored like a real court card.
  // J = Valet with an Andean chullo hat, Q = Dame with a flower, K = Roi with crown and sunglasses.
  function courtSVG(rank, suit) {
    const c = SUIT_INK[suit], s = SUIT_SYM[suit];
    const zig = `<path d="M0 34 l5 -5 l5 5 l5 -5 l5 5 l5 -5 l5 5 l5 -5 l5 5 l5 -5 l5 5 l5 -5 l5 5 V42 H0 Z" fill="${c}" stroke="${INK}" stroke-width="1.2"/>`;
    const face = `<circle cx="30" cy="20" r="8.5" fill="#f4c7a1" stroke="${INK}" stroke-width="1.6"/>`;
    let top = '';
    if (rank === 'J') {
      top = `${zig}<path d="M14 42 Q30 22 46 42 Z" fill="#ffe600" stroke="${INK}" stroke-width="1.4"/>${face}
        <path d="M20 19 Q20 6 30 5 Q40 6 40 19 Z" fill="${c}" stroke="${INK}" stroke-width="1.6"/>
        <path d="M21 13 H39 M21 16.5 H39" stroke="#ffe600" stroke-width="1.6"/>
        <path d="M20.5 18 L19 28 M39.5 18 L41 28" stroke="${c}" stroke-width="2.4" stroke-linecap="round"/>
        <circle cx="30" cy="4" r="2.4" fill="#ffe600" stroke="${INK}" stroke-width="1"/>
        <circle cx="27" cy="20" r="1.1" fill="${INK}"/><circle cx="33" cy="20" r="1.1" fill="${INK}"/>
        <path d="M27 24 Q30 26.5 33 24" fill="none" stroke="${INK}" stroke-width="1.2" stroke-linecap="round"/>`;
    } else if (rank === 'Q') {
      top = `${zig}<path d="M12 42 Q30 24 48 42 Z" fill="#a43bff" stroke="${INK}" stroke-width="1.4"/>
        <path d="M19 30 Q17 10 30 9 Q43 10 41 30 Q36 24 30 24 Q24 24 19 30 Z" fill="${INK}"/>${face}
        <path d="M22 17 Q26 9 34 11 Q38 13 39 18 Q33 12 22 17 Z" fill="${INK}"/>
        <circle cx="39" cy="12" r="3.4" fill="${c}" stroke="${INK}" stroke-width="1"/><circle cx="39" cy="12" r="1.2" fill="#ffe600"/>
        <circle cx="27" cy="20" r="1.1" fill="${INK}"/><circle cx="33" cy="20" r="1.1" fill="${INK}"/>
        <path d="M27.5 24.5 Q30 26 32.5 24.5" fill="${c}" stroke="${c}" stroke-width="1.4" stroke-linecap="round"/>
        <circle cx="21.5" cy="23" r="1.3" fill="#ffe600" stroke="${INK}" stroke-width=".6"/><circle cx="38.5" cy="23" r="1.3" fill="#ffe600" stroke="${INK}" stroke-width=".6"/>`;
    } else {
      top = `${zig}<path d="M10 42 Q30 22 50 42 Z" fill="${c}" stroke="${INK}" stroke-width="1.4"/>
        <path d="M24 42 L30 30 L36 42" fill="#ffe600" stroke="${INK}" stroke-width="1.2"/>${face}
        <path d="M21 12 L22 3 L26 8 L30 1 L34 8 L38 3 L39 12 Z" fill="#ffe600" stroke="${INK}" stroke-width="1.4" stroke-linejoin="round"/>
        <rect x="23.5" y="17.5" width="5.5" height="3.6" rx="1.2" fill="${INK}"/><rect x="31" y="17.5" width="5.5" height="3.6" rx="1.2" fill="${INK}"/>
        <path d="M29 19 H31" stroke="${INK}" stroke-width="1"/>
        <path d="M25 24.5 Q30 22.5 35 24.5 Q30 26.5 25 24.5 Z" fill="${INK}"/>`;
    }
    return `<svg class="court" viewBox="0 0 60 84" aria-hidden="true">
      <rect x="1" y="1" width="58" height="82" rx="4" fill="color-mix(in srgb, ${c} 12%, #fff6e6)" stroke="${c}" stroke-width="1.6"/>
      <clipPath id="cc-${rank}${suit}"><rect x="1" y="1" width="58" height="41"/></clipPath>
      <g id="h-${rank}${suit}" clip-path="url(#cc-${rank}${suit})">${top}</g>
      <use href="#h-${rank}${suit}" transform="rotate(180 30 42)"/>
      <line x1="2" y1="42" x2="58" y2="42" stroke="${INK}" stroke-width="1.2"/>
      <text x="8" y="40" font-size="9" fill="${c}" font-family="serif">${s}</text>
      <text x="52" y="50" font-size="9" fill="${c}" font-family="serif" transform="rotate(180 52 46)">${s}</text>
    </svg>`;
  }

  function cardFace(card) {
    const E = card.enh && window.Items && Items.ENH[card.enh];
    if (card.enh === 'pierre') return `<span class="stone"></span><span class="enhb" title="${E.n}">${E.ico}</span>`;
    return cardFaceBase(card) + (E ? `<span class="enhb" title="${E.n} : ${E.d}">${E.ico}</span>` : '');
  }
  function cardFaceBase(card) {
    const lb = Poker.label(card), s = SUIT_SYM[card.suit];
    const corner = `<span class="cn">${lb}<b>${s}</b></span>`;
    let mid;
    if (card.rank === 'A') mid = `<span class="ace"><i class="sun"></i><b>${s}</b></span>`;
    else if (PIPS[card.v]) mid = `<span class="pips">${PIPS[card.v].map(p => `<b style="left:${p[0]}%;top:${p[1]}%${p[2] ? ';transform:translate(-50%,-50%) rotate(180deg)' : ''}">${s}</b>`).join('')}</span>`;
    else mid = `<span class="courtw">${courtSVG(card.rank, card.suit)}</span>`;
    return `${corner}${mid}<span class="cn cn2">${lb}<b>${s}</b></span>`;
  }

  // ---------- card backs (deck color) ----------
  function cardBack(color) {
    const rays = Array.from({ length: 12 }, (_, i) => `<path d="M30 42 L${30 + 40 * Math.cos(i * Math.PI / 6)} ${42 + 40 * Math.sin(i * Math.PI / 6)} L${30 + 40 * Math.cos((i + .5) * Math.PI / 6)} ${42 + 40 * Math.sin((i + .5) * Math.PI / 6)} Z" fill="${i % 2 ? '#ffe600' : color}" opacity=".9"/>`).join('');
    return `<svg class="cback" viewBox="0 0 60 84" aria-hidden="true">
      <rect width="60" height="84" rx="5" fill="${INK}"/>
      <clipPath id="cb-${color.slice(1)}"><rect x="5" y="5" width="50" height="74" rx="3"/></clipPath>
      <g clip-path="url(#cb-${color.slice(1)})">${rays}
        <rect x="5" y="5" width="50" height="7" fill="#ff2e88"/><rect x="5" y="12" width="50" height="4" fill="#ff7a00"/>
        <rect x="5" y="68" width="50" height="4" fill="#ff7a00"/><rect x="5" y="72" width="50" height="7" fill="#ff2e88"/>
      </g>
      <rect x="5" y="5" width="50" height="74" rx="3" fill="none" stroke="#fff6e6" stroke-width="1.6"/>
      <circle cx="30" cy="42" r="11" fill="${INK}" stroke="#fff6e6" stroke-width="1.6"/>
      <text x="30" y="47" text-anchor="middle" font-size="13" font-family="Bungee, sans-serif" fill="${color}">C</text>
    </svg>`;
  }

  window.Art = { logo, clown, wordmark, cardFace, cardBack, SUIT_INK };
})();
