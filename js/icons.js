/* Original icon set drawn in SVG (24×24), used on enhanced cards, Voyance cards, Tickets VIP and Pochettes. */
(function () {
  const K = '#1d1022';
  const S = `stroke="${K}" stroke-width="1.3" stroke-linejoin="round" stroke-linecap="round"`;

  function gear(fill) {
    const teeth = Array.from({ length: 8 }, (_, i) => `<rect x="10.4" y="1.6" width="3.2" height="4.4" rx=".8" fill="${fill}" ${S} transform="rotate(${i * 45} 12 12)"/>`).join('');
    return `${teeth}<circle cx="12" cy="12" r="7" fill="${fill}" ${S}/><circle cx="12" cy="12" r="2.6" fill="#5a6273" ${S}/>`;
  }
  const star4 = (x, y, r, f) => `<path d="M${x} ${y - r} Q${x + r * .22} ${y - r * .22} ${x + r} ${y} Q${x + r * .22} ${y + r * .22} ${x} ${y + r} Q${x - r * .22} ${y + r * .22} ${x - r} ${y} Q${x - r * .22} ${y - r * .22} ${x} ${y - r} Z" fill="${f}" ${S}/>`;

  const ICONS = {
    // card enhancements
    bonus: `<circle cx="12" cy="12" r="10" fill="#0f9be8" ${S}/><path d="M10 6.5h4v3.5h3.5v4H14v3.5h-4V14H6.5v-4H10z" fill="#fff6e6" ${S}/>`,
    piment: `<path d="M8.2 7.6c-3 5-.8 12.4 8.6 14.2 1.8.3 2.4-1.2.8-1.9-5-2.3-6.6-6.8-6.4-11.6z" fill="#ff3355" ${S}/><path d="M9.6 9c1 2.6 2.6 5.2 5 6.8" fill="none" stroke="#ff9aa9" stroke-width="1.2" stroke-linecap="round"/><path d="M8.2 7.6c.8-1.6 2.4-1.8 3-.2.3 1 .1 1.6.2 2.4" fill="#13b86b" ${S}/><path d="M10 6.6c.3-2 1.6-3.6 3.4-4" fill="none" ${S}/>`,
    joker: `<path d="M12 3.2c1.6-2 4.6-.6 3.8 1.9L12 9.6 8.2 5.1C7.4 2.6 10.4 1.2 12 3.2z" fill="#e5126a" ${S}/><path d="M20.8 12 16.4 15.8 12 12l4.4-3.8z" fill="#f26100" ${S}/><circle cx="12" cy="17.6" r="2.2" fill="#0c9a4a" ${S}/><circle cx="9.9" cy="19.8" r="2.2" fill="#0c9a4a" ${S}/><circle cx="14.1" cy="19.8" r="2.2" fill="#0c9a4a" ${S}/><path d="M3.2 12c0-2.4 3-4.6 4.4-4.6S12 9.6 12 12c0 1.8-1.6 2.2-2.6 1.4l.8 2.4H5.4l.8-2.4c-1 .8-3 .4-3-1.4z" fill="#3a2fd1" ${S}/>`,
    verre: `<path d="M4 4h16l-8 8.6z" fill="#bff6ff" ${S}/><path d="M12 12.6V19M8 20.6h8" fill="none" ${S}/><path d="M6.6 6.6h10.8l-5.4 5.8z" fill="#ff7ab0" opacity=".85"/><circle cx="15.8" cy="5.4" r="1.6" fill="#13b86b" ${S}/><path d="M15.8 5.4 19 1.8" ${S}/>`,
    acier: gear('#c3cad6'),
    or: `<circle cx="12" cy="12" r="10" fill="#ffc93c" ${S}/><circle cx="12" cy="12" r="7.4" fill="#ffe08a" stroke="#c98a00" stroke-width="1.2"/><path d="M15 8.6a4 4 0 1 0 0 6.8M7.6 11h5.6M7.6 13.2h5.6" fill="none" stroke="#9a6400" stroke-width="1.6" stroke-linecap="round"/>`,
    chance: `<circle cx="9" cy="8.6" r="4" fill="#2bff6e" ${S}/><circle cx="15" cy="8.6" r="4" fill="#2bff6e" ${S}/><circle cx="9" cy="14.4" r="4" fill="#2bff6e" ${S}/><circle cx="15" cy="14.4" r="4" fill="#2bff6e" ${S}/><circle cx="12" cy="11.5" r="1.6" fill="#0c9a4a"/><path d="M12 13c.6 3.4 2 6 4.6 8" fill="none" ${S}/>`,
    pierre: `<path d="M5 9.4 9 4.6l7.4.6 3.6 5.2-1.4 7.4-6.6 2.6-6.8-3z" fill="#a39888" ${S}/><path d="M9 4.6l1.6 5.4 5.8-4.8M10.6 10l-5.6-.6M10.6 10l1.4 9.8M10.6 10l9.4.4" fill="none" stroke="#6e655b" stroke-width="1"/>`,
    // voyance and tickets
    boule: `<circle cx="12" cy="10" r="7.6" fill="#a43bff" ${S}/><circle cx="9.4" cy="7.4" r="2.2" fill="#e8c8ff" opacity=".8"/><path d="M6.4 17.4h11.2l1.6 4H4.8z" fill="#ffc93c" ${S}/>${star4(14.6, 11.6, 2, '#fff6e6')}`,
    pinceau: `<path d="M14.6 3.4 20.6 9.4 12 18l-6-6z" fill="#ff7a00" ${S}/><path d="M6 12 12 18c-1 2.6-3.4 3.6-7.6 3.6.6-3.6 1-6.6 1.6-9.6z" fill="#18d6ff" ${S}/><path d="M14.6 3.4 20.6 9.4" stroke="#ffe600" stroke-width="2.4"/>`,
    fleche: `<path d="M3 20h18" ${S}/><rect x="4" y="13" width="3.6" height="7" fill="#18d6ff" ${S}/><rect x="10.2" y="9" width="3.6" height="11" fill="#2bff6e" ${S}/><path d="M16.4 20V8.6h-2.4L18.2 3l4.2 5.6H20V20z" fill="#ffe600" ${S}/>`,
    broyeuse: `<rect x="3.6" y="6" width="16.8" height="7" rx="1.6" fill="#ff3355" ${S}/><path d="M7 2.6h10V6H7z" fill="#fff6e6" ${S}/>${[6, 9, 12, 15, 18].map((x, i) => `<path d="M${x} 13v${4 + (i % 2) * 3}" stroke="#fff6e6" stroke-width="1.6" stroke-linecap="round"/><path d="M${x} 13v${4 + (i % 2) * 3}" stroke="${K}" stroke-width=".5"/>`).join('')}`,
    copie: `<rect x="3.4" y="3.4" width="11" height="14" rx="1.6" fill="#fff6e6" ${S}/><rect x="9.6" y="6.6" width="11" height="14" rx="1.6" fill="#18d6ff" ${S}/><path d="M12.4 11h5.4M12.4 14h5.4M12.4 17h3.4" stroke="${K}" stroke-width="1.1"/>`,
    cochon: `<ellipse cx="12" cy="13" rx="8.6" ry="6.6" fill="#ff86de" ${S}/><path d="M6.4 8.4 5.4 4.6l3.6 2.2" fill="#ff86de" ${S}/><ellipse cx="17.2" cy="13.4" rx="2.4" ry="1.8" fill="#ffb3ec" ${S}/><circle cx="16.6" cy="13.4" r=".5" fill="${K}"/><circle cx="17.8" cy="13.4" r=".5" fill="${K}"/><circle cx="13.6" cy="10.4" r=".9" fill="${K}"/><path d="M9.6 6.8h4" stroke="${K}" stroke-width="1.6" stroke-linecap="round"/><path d="M8 18.8v2.4M15 18.8v2.4" ${S}/>`,
    megaphone: `<path d="M4 9.4h3.6L17.4 4v15.6L7.6 14.2H4z" fill="#ff2e88" ${S}/><path d="M6 14.2l1.6 6h2.6l-1.2-5.6" fill="#fff6e6" ${S}/><path d="M19.6 8.4c1.6 1.6 1.6 5 0 6.6" fill="none" ${S}/>`,
    casque: `<path d="M4 15v-3a8 8 0 0 1 16 0v3" fill="none" stroke="${K}" stroke-width="2.4"/><path d="M4 15v-3a8 8 0 0 1 16 0v3" fill="none" stroke="#a43bff" stroke-width="1.2"/><rect x="2.6" y="13" width="5" height="8" rx="2" fill="#2bff6e" ${S}/><rect x="16.4" y="13" width="5" height="8" rx="2" fill="#2bff6e" ${S}/>`,
    roue: `<circle cx="12" cy="12" r="9.6" fill="#fff6e6" ${S}/>${['#ff2e88', '#ffe600', '#18d6ff', '#2bff6e', '#ff7a00', '#a43bff'].map((c, i) => { const a = i * 60 * Math.PI / 180, b = (i + 1) * 60 * Math.PI / 180; return `<path d="M12 12 L${(12 + 9 * Math.cos(a)).toFixed(2)} ${(12 + 9 * Math.sin(a)).toFixed(2)} A9 9 0 0 1 ${(12 + 9 * Math.cos(b)).toFixed(2)} ${(12 + 9 * Math.sin(b)).toFixed(2)} Z" fill="${c}"/>`; }).join('')}<circle cx="12" cy="12" r="2.2" fill="${K}"/><path d="M12 .8 10.4 4h3.2z" fill="${K}"/>`,
    cadeau: `<rect x="3.4" y="9" width="17.2" height="12" rx="1.4" fill="#ff2e88" ${S}/><rect x="2.4" y="6.4" width="19.2" height="4" rx="1" fill="#ff7ab0" ${S}/><path d="M12 6.4V21" stroke="#ffe600" stroke-width="2.6"/><path d="M12 6.4c-2-4-6-4-5-1.2.6 1.4 3 1.2 5 1.2zM12 6.4c2-4 6-4 5-1.2-.6 1.4-3 1.2-5 1.2z" fill="#ffe600" ${S}/>`,
    lezard: `<path d="M5 15c0-5 4-9 9-9 4 0 6 2.6 6 5 0 2-1.6 3-3.4 3H13l-2 3.4c2 .4 3 1.6 2.6 3-1.6.6-4.8.2-6.6-1.4C5.6 18 5 16.6 5 15z" fill="#13b86b" ${S}/><circle cx="16.4" cy="9.6" r="1.4" fill="#fff6e6" ${S}/><circle cx="16.6" cy="9.6" r=".6" fill="${K}"/><path d="M5 15c-2 .4-3.2 2-2.6 3.8 1 1.4 3 1 3.6-.4" fill="none" ${S}/>`,
    marteau: `<rect x="3" y="4" width="11" height="6" rx="1.2" fill="#c3cad6" ${S}/><path d="M9.6 10 17.8 21l2.4-1.8L12 8.6" fill="#b5651d" ${S}/>`,
    bague: `<circle cx="12" cy="15" r="6.4" fill="none" stroke="${K}" stroke-width="3.6"/><circle cx="12" cy="15" r="6.4" fill="none" stroke="#ffc93c" stroke-width="2"/><path d="M8.6 4.6 12 2l3.4 2.6L12 9z" fill="#18d6ff" ${S}/>`,
    brique: `<rect x="2.6" y="5" width="9" height="5" fill="#e0703a" ${S}/><rect x="12.4" y="5" width="9" height="5" fill="#e0703a" ${S}/><rect x="7.4" y="10.6" width="9" height="5" fill="#e0703a" ${S}/><rect x="2.6" y="16.2" width="9" height="5" fill="#e0703a" ${S}/><rect x="12.4" y="16.2" width="9" height="5" fill="#e0703a" ${S}/>`,
    main: `<path d="M7.4 21c-2-2-3.4-4.6-3.6-7.6l-.2-3c0-1.4 2-1.6 2.4 0l.6 3V5c0-1.6 2.4-1.6 2.4 0v6V3.6c0-1.6 2.4-1.6 2.4 0V11V4.6c0-1.6 2.4-1.6 2.4 0V11V7c0-1.6 2.4-1.6 2.4 0v7.6c0 3-1 4.8-2.4 6.4z" fill="#18d6ff" ${S}/>`,
    poubelle: `<path d="M5 7h14l-1.4 14H6.4z" fill="#ff3355" ${S}/><rect x="3.6" y="4" width="16.8" height="3" rx="1" fill="#ff7ab0" ${S}/><path d="M10 4V2.6h4V4M9.4 10v8M12 10v8M14.6 10v8" fill="none" ${S}/>`,
    eventail: `<rect x="5" y="6" width="8" height="12" rx="1.4" fill="#fff6e6" ${S} transform="rotate(-18 9 18)"/><rect x="8" y="5" width="8" height="12" rx="1.4" fill="#ffe600" ${S}/><rect x="11" y="6" width="8" height="12" rx="1.4" fill="#ff7a00" ${S} transform="rotate(18 15 18)"/>`,
    etoile: `<path d="M12 2.4l2.8 6 6.6.6-5 4.4 1.5 6.5L12 16.4 6.1 19.9l1.5-6.5-5-4.4 6.6-.6z" fill="#ffc93c" ${S}/><path d="M9.4 11.4h5.2" stroke="${K}" stroke-width="1"/><text x="12" y="14.2" text-anchor="middle" font-family="Bungee, sans-serif" font-size="4.2" fill="${K}">VIP</text>`,
    etiquette: `<path d="M3 11.6V4h7.6L21 14.4 13.4 22z" fill="#2bff6e" ${S}/><circle cx="7.4" cy="8.4" r="1.6" fill="#fff6e6" ${S}/><text x="13.4" y="16.4" text-anchor="middle" font-family="Bungee, sans-serif" font-size="5" fill="${K}" transform="rotate(45 13.4 14)">%</text>`,
    relance: `<path d="M19 9a7.6 7.6 0 0 0-13.8-1.4" fill="none" stroke="${K}" stroke-width="3.4" stroke-linecap="round"/><path d="M19 9a7.6 7.6 0 0 0-13.8-1.4" fill="none" stroke="#a43bff" stroke-width="1.8" stroke-linecap="round"/><path d="M5 15a7.6 7.6 0 0 0 13.8 1.4" fill="none" stroke="${K}" stroke-width="3.4" stroke-linecap="round"/><path d="M5 15a7.6 7.6 0 0 0 13.8 1.4" fill="none" stroke="#ff2e88" stroke-width="1.8" stroke-linecap="round"/><path d="M20.4 3.6 20 9.6l-5.6-1.4z" fill="#a43bff" ${S}/><path d="M3.6 20.4 4 14.4l5.6 1.4z" fill="#ff2e88" ${S}/>`,
    banane: `<path d="M3 11c3 2.4 15 2.4 18 0" fill="none" stroke="${K}" stroke-width="2.6"/><rect x="5" y="10" width="14" height="8.4" rx="4.2" fill="#ff2e88" ${S}/><path d="M7 13.6h10" stroke="#ffe600" stroke-width="1.4" stroke-dasharray="1.6 1.2"/><rect x="10.4" y="12.4" width="3.2" height="2.4" rx=".6" fill="#ffe600" ${S}/>`,
    disque: `<circle cx="12" cy="12" r="10" fill="#1a0f22" ${S}/><circle cx="12" cy="12" r="7.4" fill="none" stroke="#3a2a4a" stroke-width=".8"/><circle cx="12" cy="12" r="5.4" fill="none" stroke="#3a2a4a" stroke-width=".8"/><circle cx="12" cy="12" r="3.4" fill="#2bff6e" ${S}/><circle cx="12" cy="12" r=".9" fill="${K}"/><path d="M6 5.4a9 9 0 0 1 4.4-2" fill="none" stroke="#fff" stroke-width="1" opacity=".5" stroke-linecap="round"/>`,
    paillettes: `${star4(9, 10, 6.4, '#ffe600')}${star4(17.4, 5.4, 3.2, '#ff86de')}${star4(17, 17, 3.6, '#18d6ff')}`,
    chariot: `<path d="M2 4h3l2.6 11h10.8L21 7.4H6.4" fill="none" stroke="${K}" stroke-width="2.4" stroke-linejoin="round"/><path d="M2 4h3l2.6 11h10.8L21 7.4H6.4" fill="none" stroke="#ff7a00" stroke-width="1.2" stroke-linejoin="round"/><path d="M7 8.6h12.6l-1.6 4.8H8.2z" fill="#ffe600" ${S}/><circle cx="9" cy="19" r="1.8" fill="#fff6e6" ${S}/><circle cx="17" cy="19" r="1.8" fill="#fff6e6" ${S}/>`
  };

  function svg(name, cls) {
    const body = ICONS[name] || ICONS.boule;
    return `<svg class="ic ${cls || ''}" viewBox="0 0 24 24" aria-hidden="true">${body}</svg>`;
  }

  window.Icons = { svg, ICONS };
})();
