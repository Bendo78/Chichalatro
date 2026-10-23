/* CHICHALATRO — screens, run flow, animated table, scoring, shop. */
(function () {
  const $ = s => document.querySelector(s);
  const app = () => $('#app');
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const fmt = n => Math.floor(n).toLocaleString('fr-FR');
  const rnd = a => a[Math.floor(Math.random() * a.length)];

  // ---------- options ----------
  const OPTS = (() => { try { return Object.assign({ speed: 1, reduced: false }, JSON.parse(localStorage.getItem('chichalatro-opts') || '{}')); } catch (e) { return { speed: 1, reduced: false }; } })();
  function saveOpts() { try { localStorage.setItem('chichalatro-opts', JSON.stringify(OPTS)); } catch (e) { } applyOpts(); }
  function applyOpts() {
    document.documentElement.style.setProperty('--spd', OPTS.speed);
    document.body.classList.toggle('reduced', !!OPTS.reduced);
    Bg.enable(!OPTS.reduced);
  }
  const wait = ms => new Promise(r => setTimeout(r, ms / OPTS.speed));

  // ---------- rules ----------
  const NOCHES = 8;
  const BASE_TARGET = [300, 800, 2000, 5000, 11000, 20000, 35000, 50000];
  const TANDAS = [
    { n: "L'Apéro", short: 'AP', reward: 3, mul: 1, col: '#18d6ff' },
    { n: 'La Soirée', short: 'SO', reward: 4, mul: 1.5, col: '#ff7a00' },
    { n: 'Le Boss', short: 'BS', reward: 5, mul: 2, col: '#ff2e88' }
  ];
  const BOSSES = [
    { id: 'suit', n: 'Le Contrôleur RATP', q: "Titre de transport, s'il vous plaît.", d: s => `Les ${s} ne rapportent rien` },
    { id: 'hands', n: 'La Grève Surprise', q: 'Préavis déposé ce matin.', d: () => 'Une main de moins' },
    { id: 'nodisc', n: 'La Coupure EDF', q: 'Facture impayée, plus de courant.', d: () => 'Aucune défausse' },
    { id: 'size', n: 'Le RER B', q: 'Incident voyageur, serrez-vous.', d: () => 'Une carte de moins en main' },
    { id: 'five', n: 'La CAF', q: 'Dossier incomplet : il manque des pièces.', d: () => 'Chaque main doit avoir 5 cartes' },
    { id: 'face', n: 'Le Videur', q: 'Pas ce soir, les gars.', d: () => 'Les figures ne rapportent rien' },
    { id: 'pricey', n: 'Les Impôts', q: 'Prélèvement à la source.', d: () => 'Chaque main jouée coûte 1 €' }
  ];
  const EXAMPLES = {
    high: 'A♠ seul', pair: '7♥ 7♣', two: '7♥ 7♣ · 4♦ 4♠', three: 'D♥ D♣ D♦', straight: '5 6 7 8 9',
    flush: '5 cartes ♥', full: 'R R R · 3 3', four: '9 9 9 9', sflush: '5♠ 6♠ 7♠ 8♠ 9♠'
  };
  const HUES = { feu: 14, eau: 200, nature: 130, foudre: 50, psy: 290, ombre: 255 };

  let DB = { cards: [], series: [], backs: {}, source: 'base' };
  let st = null;
  const cardEls = new Map();

  const seriesOf = c => DB.series.find(s => s.id === c.s);
  const levelOf = id => st.levels[id] || 1;
  function handValue(h) { const L = levelOf(h.id); return { chips: h.c + (L - 1) * h.lc, mult: h.m + (L - 1) * h.lm }; }
  function targetFor(noche, t) {
    const mul = t === 2 && st.stake >= 4 ? 2.5 : TANDAS[t].mul;
    const v = BASE_TARGET[Math.min(noche, NOCHES) - 1] * mul * (st.stake >= 2 ? 1.25 : 1);
    return Math.round(v / 50) * 50;
  }
  const rewardFor = t => (t === 0 && st.stake >= 1 ? 0 : TANDAS[t].reward);
  const isBoss = () => st.tanda === 2;
  function debuffed(card) {
    if (!isBoss()) return false;
    if (st.boss.id === 'suit') return card.suit === st.boss.suit;
    if (st.boss.id === 'face') return Poker.isFace(card);
    return false;
  }

  // ---------- small UI helpers ----------
  function toast(msg) {
    const t = document.createElement('div');
    t.className = 'toast'; t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2600);
  }
  function modal(html, cls) {
    const ov = document.createElement('div');
    ov.className = 'ov';
    ov.innerHTML = `<div class="panel ${cls || ''}">${html}</div>`;
    document.body.appendChild(ov);
    const close = () => { ov.classList.add('out'); setTimeout(() => ov.remove(), 200); document.removeEventListener('keydown', onKey); };
    const onKey = e => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    ov.addEventListener('click', e => { if (e.target === ov) close(); });
    ov.close = close;
    return ov;
  }
  function bump(el) { if (!el) return; el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }
  function setStat(id, val) { const el = document.getElementById(id); if (el) { el.textContent = val; bump(el); } }
  function pop(el, text, cls) {
    if (!el) return;
    const r = el.getBoundingClientRect();
    const p = document.createElement('div');
    p.className = 'pop ' + (cls || '');
    p.textContent = text;
    p.style.left = r.left + r.width / 2 + 'px';
    p.style.top = r.top + 'px';
    document.body.appendChild(p);
    bump(el);
    setTimeout(() => p.remove(), 1000 / OPTS.speed);
  }
  function shake() { if (OPTS.reduced) return; const r = $('#run'); if (!r) return; r.classList.remove('shake'); void r.offsetWidth; r.classList.add('shake'); }
  function countTo(el, from, to, ms) {
    return new Promise(res => {
      const t0 = performance.now(), d = ms / OPTS.speed; let tick = 0;
      // setTimeout instead of requestAnimationFrame: keeps going even if the tab is in the background
      const f = () => {
        const now = performance.now(), k = Math.min(1, (now - t0) / d), v = from + (to - from) * (1 - Math.pow(1 - k, 3));
        el.textContent = fmt(v);
        if (now - tick > 70) { Sfx.play('score'); tick = now; }
        k < 1 ? setTimeout(f, 16) : res();
      };
      f();
    });
  }
  function richEffect(t) {
    return esc(t)
      .replace(/(×[\d.,]+ Mult)/g, '<b class="fx-x">$1</b>')
      .replace(/(\+\d+ Mult)/g, '<b class="fx-m">$1</b>')
      .replace(/(\+\d+ Jetons)/g, '<b class="fx-c">$1</b>')
      .replace(/(\d+ Soles?)/g, '<b class="fx-s">$1</b>');
  }
  const chipIcon = (t, label) => `<span class="chipico" style="--bc:${t.col}"><b>${label || t.short}</b></span>`;

  // ---------- super cards ----------
  function frame(c) {
    const x = isFinite(+c.fx) ? +c.fx : 50, y = isFinite(+c.fy) ? +c.fy : 50, z = +c.fz > 0 ? +c.fz : 1;
    return `object-position:${x}% ${y}%;transform-origin:${x}% ${y}%${z !== 1 ? `;transform:scale(${z})` : ''}`;
  }
  function media(c) {
    const ph = ChichaData.photo(c);
    if (ph && /^data:video|\.(mp4|webm|mov)(\?|$)/i.test(ph)) return `<video src="${esc(ph)}" autoplay muted loop playsinline preload="metadata" style="${frame(c)}"></video>`;
    if (ph) return `<img src="${esc(ph)}" alt="" loading="lazy" style="${frame(c)}">`;
    const ini = (c.n || '?').replace(/^(L'|Le |La |Les )/i, '').split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();
    return `<div class="noart" style="--h:${HUES[c.t] || 330}"><span>${esc(ini)}</span></div>`;
  }
  function superHTML(sc, o) {
    o = o || {};
    const c = sc.card, back = DB.backs[c.s], tier = Supers.TIERS[sc.tier], ser = seriesOf(c);
    return `<div class="sc ${tier.cls} fam-${sc.fam}${o.flip ? ' flip' : ''}${o.isNew ? ' new' : ''}" data-uid="${sc.uid}" tabindex="0" role="button" aria-label="${esc(c.n)} : ${esc(Supers.liveText(sc))}">
      <div class="sway" style="--d:${(-Math.random() * 4).toFixed(2)}s"><div class="sc-in">
        <div class="sc-f">${media(c)}<span class="sc-tier">${tier.n}</span><span class="sc-name">${esc(c.n)}</span><i class="glare"></i></div>
        <div class="sc-b"${back ? ` style="--back:url('${esc(back)}')"` : ''}>
          <span class="sc-bn">${esc(c.n)}</span>
          ${c.an ? `<span class="sc-atk">${esc(c.an)}</span>` : ''}
          ${c.f ? `<p class="sc-desc">« ${esc(c.f)} »</p>` : ''}
          <span class="sc-eff">${richEffect(Supers.liveText(sc))}</span>
          <span class="sc-meta">${esc(sc.famName)} · ${tier.n}${ser ? ' · ' + esc(ser.code || ser.n) : ''}</span>
          ${o.actions || ''}
        </div>
      </div></div>
    </div>`;
  }
  function wireSuper(el, sc) {
    const toggle = e => { if (e.target.closest('button')) return; el.classList.toggle('flip'); Sfx.play('flip'); hideTip(); };
    el.addEventListener('click', toggle);
    el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(e); } });
    if (sc) {
      el.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse' && !el.classList.contains('flip')) showTip(el, sc); Sfx.play('hover'); });
      el.addEventListener('pointerleave', hideTip);
    }
    const g = el.querySelector('.sc-f');
    el.addEventListener('pointermove', e => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--tx', ((0.5 - (e.clientY - r.top) / r.height) * 18).toFixed(1) + 'deg');
      el.style.setProperty('--ty', (((e.clientX - r.left) / r.width - 0.5) * 18).toFixed(1) + 'deg');
      g && g.style.setProperty('--gx', ((e.clientX - r.left) / r.width * 100).toFixed(0) + '%');
    });
    el.addEventListener('pointerleave', () => { el.style.setProperty('--tx', '0deg'); el.style.setProperty('--ty', '0deg'); });
  }
  function wireSupersIn(root, list) {
    root.querySelectorAll('.sc').forEach(el => wireSuper(el, list && list.find(s => s.uid === el.dataset.uid)));
  }
  function showTip(el, sc) {
    hideTip();
    const t = document.createElement('div'), tier = Supers.TIERS[sc.tier];
    t.className = 'tip ' + tier.cls; t.id = 'tip';
    t.innerHTML = `<b>${esc(sc.card.n)}</b><span class="eff">${richEffect(Supers.liveText(sc))}</span>${sc.card.f ? `<em>« ${esc(sc.card.f)} »</em>` : ''}<small><i>${tier.n}</i> ${esc(sc.famName)}</small>`;
    document.body.appendChild(t);
    const r = el.getBoundingClientRect(), tr = t.getBoundingClientRect();
    let x = r.left + r.width / 2 - tr.width / 2, y = r.bottom + 10;
    if (y + tr.height > innerHeight - 8) y = r.top - tr.height - 10;
    t.style.left = Math.max(8, Math.min(innerWidth - tr.width - 8, x)) + 'px';
    t.style.top = Math.max(8, y) + 'px';
  }
  function hideTip() { const t = $('#tip'); if (t) t.remove(); }

  // ---------- title ----------
  function title() {
    st = null; cardEls.clear(); hideTip();
    Bg.set('menu');
    Sfx.track('menu');
    const n = DB.cards.length;
    app().innerHTML = `<section class="title">
      ${Art.logo('big')}
      <div class="menu-btns">
        <button class="btn xl blue" id="b-play">Jouer</button>
        <button class="btn xl orange" id="b-opt">Options</button>
        <button class="btn xl rosa" id="b-col">Collection</button>
        <button class="btn xl green" id="b-ach">Succès</button>
      </div>
      <p class="src">${DB.source === 'supabase' ? `<b class="ok">●</b> ${n} super cartes CHICHA TCG chargées` : `<b class="warn">●</b> ${n} super cartes (set de base)`}
        · <button class="link" id="b-login">${DB.user ? 'Déconnexion' : 'Connexion TCG'}</button></p>
    </section>`;
    $('#b-play').onclick = () => { Sfx.play('click'); newRunModal(); };
    $('#b-opt').onclick = () => { Sfx.play('click'); optionsModal(); };
    $('#b-col').onclick = () => { Sfx.play('click'); collection(); };
    $('#b-ach').onclick = () => { Sfx.play('click'); achievementsModal(); };
    $('#b-login').onclick = DB.user ? async () => { await ChichaData.signOut(); boot(); } : loginForm;
  }

  function loginForm() {
    const ov = modal(`<form id="lf" class="form">
      <h2>Compte CHICHA TCG</h2>
      <label>E-mail<input type="email" name="e" required autocomplete="email"></label>
      <label>Mot de passe<input type="password" name="p" required autocomplete="current-password"></label>
      <p class="err" hidden></p>
      <div class="acts"><button class="btn blue" type="submit">Connexion</button><button class="btn" type="button" id="lf-x">Annuler</button></div>
    </form>`);
    ov.querySelector('#lf-x').onclick = ov.close;
    ov.querySelector('#lf').onsubmit = async e => {
      e.preventDefault();
      const f = e.target, err = f.querySelector('.err');
      try { await ChichaData.signIn(f.e.value.trim(), f.p.value); ov.close(); boot(); }
      catch (x) { err.hidden = false; err.textContent = x.message || 'Connexion impossible'; }
    };
  }

  // ---------- new run: deck and difficulty ----------
  function newRunModal() {
    const M = Meta.data;
    let di = Math.max(0, Meta.DECKS.findIndex(d => d.id === M.last.deck));
    let stake = Math.min(M.last.stake || 0, M.stake);
    const ov = modal(`<div class="nr">
      <div class="tabs"><button class="on">Nouvelle partie</button><button id="nr-ach">Succès</button></div>
      <div class="deckpick"><button class="arrow" id="dp-l" aria-label="Deck précédent">◀</button><div class="dp" id="dp"></div><button class="arrow" id="dp-r" aria-label="Deck suivant">▶</button></div>
      <div class="dots" id="dots"></div>
      <h3>Mise</h3>
      <div class="stakes" id="sk"></div>
      <div class="stake-d" id="skd"></div>
      <div class="acts"><button class="btn xl blue" id="nr-go">Jouer</button><button class="btn" id="nr-x">Retour</button></div>
    </div>`, 'wide');
    const draw = () => {
      const d = Meta.DECKS[di], open = Meta.deckUnlocked(d), a = d.ach && Meta.ACHIEVEMENTS.find(x => x.id === d.ach);
      const won = M.deckWins[d.id];
      ov.querySelector('#dp').innerHTML = `<div class="deckcard${open ? '' : ' locked'}">${Art.cardBack(d.color)}${open ? '' : '<span class="lock">🔒</span>'}</div>
        <div class="deckinfo"><b style="color:${d.color}">${d.n}</b>
          <p>${open ? esc(d.d) : `Verrouillé. Succès requis : <b>${esc(a.n)}</b><br><small>${esc(a.d)}</small>`}</p>
          ${open && won != null ? `<small class="won">Gagné en Mise <i style="--c:${Meta.STAKES[won].c}">${Meta.STAKES[won].n}</i></small>` : ''}</div>`;
      ov.querySelector('#dots').innerHTML = Meta.DECKS.map((x, i) => `<i class="${i === di ? 'on' : ''}${Meta.deckUnlocked(x) ? '' : ' lk'}"></i>`).join('');
      ov.querySelector('#sk').innerHTML = Meta.STAKES.map((s, i) => `<button class="stake${i === stake ? ' on' : ''}${i > M.stake ? ' locked' : ''}" data-i="${i}" style="--c:${s.c}" ${i > M.stake ? 'disabled' : ''} aria-label="Mise ${s.n}"><i></i><span>${s.n}</span></button>`).join('');
      ov.querySelector('#skd').innerHTML = `<b style="color:${Meta.STAKES[stake].c}">Mise ${Meta.STAKES[stake].n}</b>` + Meta.STAKES.slice(0, stake + 1).map(s => `<span>${esc(s.d)}</span>`).join('') + (M.stake < Meta.STAKES.length - 1 ? `<small>Gagne une partie en Mise ${Meta.STAKES[M.stake].n} pour débloquer la suivante.</small>` : '');
      ov.querySelector('#nr-go').disabled = !open;
      ov.querySelectorAll('.stake:not(.locked)').forEach(b => b.onclick = () => { stake = +b.dataset.i; Sfx.play('select'); draw(); });
    };
    ov.querySelector('#dp-l').onclick = () => { di = (di + Meta.DECKS.length - 1) % Meta.DECKS.length; Sfx.play('flip'); draw(); };
    ov.querySelector('#dp-r').onclick = () => { di = (di + 1) % Meta.DECKS.length; Sfx.play('flip'); draw(); };
    ov.querySelector('#nr-x').onclick = ov.close;
    ov.querySelector('#nr-ach').onclick = () => { ov.close(); achievementsModal(); };
    ov.querySelector('#nr-go').onclick = () => {
      const d = Meta.DECKS[di];
      if (!Meta.deckUnlocked(d)) return;
      M.last = { deck: d.id, stake }; Meta.save();
      ov.close(); Sfx.play('shuffle');
      newRun(d.id, stake);
    };
    draw();
  }

  function achievementsModal() {
    const M = Meta.data;
    const got = Meta.ACHIEVEMENTS.filter(a => M.ach[a.id]).length;
    const ov = modal(`<h2>Succès <small>${got}/${Meta.ACHIEVEMENTS.length}</small></h2>
      <div class="achs">${Meta.ACHIEVEMENTS.map(a => {
        const deck = Meta.DECKS.find(d => d.ach === a.id), ok = !!M.ach[a.id];
        return `<div class="ach${ok ? ' ok' : ''}"><span class="trophy">${ok ? '🏆' : '🔒'}</span><span><b>${esc(a.n)}</b><small>${esc(a.d)}</small>${deck ? `<em style="--c:${deck.color}">Débloque : ${deck.n}</em>` : ''}</span></div>`;
      }).join('')}</div>
      <p class="mute">Parties gagnées : ${M.stats.wins} · Boss battus : ${M.stats.bosses} · Meilleure main : ${fmt(M.stats.bestHand)}</p>
      <div class="acts"><button class="btn blue" id="ac-x">Fermer</button></div>`, 'wide');
    ov.querySelector('#ac-x').onclick = ov.close;
  }

  function optionsModal() {
    const P = Sfx.prefs;
    const ov = modal(`<h2>Options</h2>
      <div class="opts">
        <label class="tg"><input type="checkbox" id="o-sfx" ${P.sfx ? 'checked' : ''}><span>Effets sonores</span></label>
        <label class="tg"><input type="checkbox" id="o-mus" ${P.music ? 'checked' : ''}><span>Musique</span></label>
        <p class="opt-hint">Pour jouer ta propre musique, mets tes fichiers dans le dossier <b>music</b> du jeu : <b>menu.mp3</b> pour le menu et <b>game.mp3</b> pour la partie.</p>
        <label>Volume<input type="range" id="o-vol" min="0" max="1" step="0.05" value="${P.vol}"></label>
        <div class="seg"><span>Vitesse du jeu</span>${[1, 2, 4].map(v => `<button class="${OPTS.speed === v ? 'on' : ''}" data-sp="${v}">${v}×</button>`).join('')}</div>
        <label class="tg"><input type="checkbox" id="o-red" ${OPTS.reduced ? 'checked' : ''}><span>Effets réduits (pas de fond animé ni de secousses)</span></label>
      </div>
      <div class="acts">${st ? '<button class="btn rosa" id="o-quit">Abandonner la partie</button>' : ''}<button class="btn blue" id="o-x">Fermer</button></div>`);
    ov.querySelector('#o-sfx').onchange = e => { Sfx.set('sfx', e.target.checked); Sfx.play('click'); };
    ov.querySelector('#o-mus').onchange = e => Sfx.set('music', e.target.checked);
    ov.querySelector('#o-vol').oninput = e => Sfx.set('vol', +e.target.value);
    ov.querySelectorAll('[data-sp]').forEach(b => b.onclick = () => { OPTS.speed = +b.dataset.sp; saveOpts(); ov.querySelectorAll('[data-sp]').forEach(x => x.classList.toggle('on', x === b)); Sfx.play('click'); });
    ov.querySelector('#o-red').onchange = e => { OPTS.reduced = e.target.checked; saveOpts(); };
    ov.querySelector('#o-x').onclick = ov.close;
    const q = ov.querySelector('#o-quit');
    if (q) q.onclick = () => { ov.close(); title(); };
  }

  // ---------- collection ----------
  function collection() {
    Bg.set('shop');
    const order = ['feu', 'eau', 'foudre', 'nature', 'psy', 'ombre'];
    const all = DB.cards.map(c => Supers.make(c, seriesOf(c))).sort((a, b) => b.tier - a.tier || order.indexOf(a.fam) - order.indexOf(b.fam));
    let filter = 'all';
    const opened = all.filter(sc => Unlocks.isOpen(sc.card)).length;
    app().innerHTML = `<section class="col">
      <header class="colbar"><button class="btn" id="b-back">← Menu</button><h2 class="ttl">Collection <small>${opened}/${all.length} débloquées</small></h2>
        <div class="filters">${[['all', 'Toutes'], ['open', 'Débloquées'], ['locked', 'Verrouillées'], ...order.map(k => [k, Supers.TYPE_FAM[k]])].map(([k, n]) => `<button class="chip${k === 'all' ? ' on' : ''}" data-f="${k}">${n}</button>`).join('')}</div></header>
      <p class="colhint">Clique une carte pour la retourner. Une carte verrouillée montre comment la débloquer.</p>
      <div class="grid" id="grid"></div>
    </section>`;
    const lockedHTML = sc => {
      const p = Unlocks.progress(sc.card), tier = Supers.TIERS[sc.tier];
      const pct = p ? Math.round(p.have / p.need * 100) : 0;
      return `<div class="sc locked ${tier.cls}" tabindex="0" role="button" aria-label="Carte verrouillée : ${p ? esc(p.text) : ''}">
        <div class="sway"><div class="sc-in"><div class="sc-f">${Art.cardBack('#3a2a4a')}<span class="lockico">🔒</span><span class="sc-tier">${tier.n}</span><span class="sc-name">???</span></div></div></div>
        <div class="bubble"><b>Comment la débloquer</b><span>${p ? esc(p.text) : 'Bientôt'}</span>${p ? `<i class="bar"><i style="width:${pct}%"></i></i><small>${fmt(p.have)} / ${fmt(p.need)}</small>` : ''}</div>
      </div>`;
    };
    const draw = () => {
      const list = all.filter(s => {
        const open = Unlocks.isOpen(s.card);
        if (filter === 'open') return open;
        if (filter === 'locked') return !open;
        return filter === 'all' || s.fam === filter;
      });
      $('#grid').innerHTML = list.map(sc => Unlocks.isOpen(sc.card) ? superHTML(sc) : lockedHTML(sc)).join('');
      wireSupersIn($('#grid'), list.filter(sc => Unlocks.isOpen(sc.card)));
      $('#grid').querySelectorAll('.sc.locked').forEach(el => {
        const t = () => { const on = !el.classList.contains('show'); $('#grid').querySelectorAll('.sc.locked.show').forEach(x => x.classList.remove('show')); el.classList.toggle('show', on); Sfx.play('flip'); };
        el.addEventListener('click', t);
        el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); t(); } });
      });
    };
    app().querySelectorAll('[data-f]').forEach(b => b.onclick = () => { filter = b.dataset.f; app().querySelectorAll('[data-f]').forEach(x => x.classList.toggle('on', x === b)); Sfx.play('click'); draw(); });
    $('#b-back').onclick = () => { Sfx.play('click'); title(); };
    draw();
  }

  // ---------- run setup ----------
  function newRun(deckId, stake) {
    const deck = Meta.DECKS.find(d => d.id === deckId) || Meta.DECKS[0];
    st = {
      deck, stake, noche: 1, tanda: 0, round: 0, soles: 4, supers: [], maxSupers: 5,
      handSizeBase: 8, handsBase: 4, discardsBase: 3, interestMax: 5,
      levels: {}, handCounts: {}, cards: Poker.newDeck(), bossBag: [], sort: 'rank', rerollCost: 5,
      hand: [], draw: [], sel: new Set(), busy: false, phase: 'select', score: 0, target: 0, bestHand: 0, recruited: 0
    };
    if (deck.id === 'fiesta') st.discardsBase++;
    if (deck.id === 'soles') { st.soles = 14; st.interestMax = 7; }
    if (deck.id === 'neon') st.maxSupers = 6;
    if (deck.id === 'cumbia') ['pair', 'two', 'three'].forEach(h => st.levels[h] = 2);
    if (deck.id === 'jefe') { st.handsBase++; st.handSizeBase--; }
    if (deck.id === 'escalera') ['straight', 'flush', 'sflush'].forEach(h => st.levels[h] = 3);
    if (deck.id === 'leyenda') {
      const open = Unlocks.open(), legs = open.filter(c => Supers.TIER_OF[c.r] === 4);
      if (legs.length) { const c = rnd(legs); st.supers.push(Supers.make(c, seriesOf(c))); }
    }
    if (stake >= 3) st.discardsBase--;
    if (stake >= 5) st.handsBase--;
    st.hands = st.handsBase; st.discards = st.discardsBase;
    Meta.add('runs');
    pickBoss();
    runShell();
    selectPhase();
  }

  function pickBoss() {
    if (!st.bossBag.length) st.bossBag = Poker.shuffle(BOSSES.slice());
    const b = Object.assign({}, st.bossBag.pop());
    if (b.id === 'suit') { const s = rnd(Poker.SUITS); b.suit = s.k; b.desc = b.d(s.s); } else b.desc = b.d();
    st.boss = b;
    st.skipHands = [rnd(Poker.HANDS), rnd(Poker.HANDS)];
  }

  // ---------- run layout ----------
  function runShell() {
    Sfx.track('game');
    app().innerHTML = `<section class="run" id="run">
      <aside class="side" id="side"></aside>
      <button class="combo-tab" id="combo-tab" aria-label="Voir les combos"><span>COMBOS</span></button>
      <div class="drawer" id="drawer"></div>
      <section class="stage" id="stage">
        <div class="topbar"><div class="supers" id="supers"></div></div>
        <div class="playzone" id="playzone"><div class="handname" id="handname"></div></div>
        <div class="handzone" id="handzone"><div class="deck" id="deck"><div class="deckstack">${Art.cardBack(st.deck.color)}</div><span id="deckn"></span></div></div>
        <div class="ctrl" id="ctrl">
          <button class="btn blue" id="b-playhand">Jouer la main</button>
          <div class="sortb"><small>Trier</small><div><button class="btn sm orange" id="b-sr">Valeur</button><button class="btn sm orange" id="b-ss">Couleur</button></div></div>
          <button class="btn rosa" id="b-disc">Défausser</button>
        </div>
        <div class="cards" id="cards"></div>
        <div class="center" id="center"></div>
      </section>
    </section>`;
    $('#combo-tab').onclick = toggleDrawer;
    $('#b-playhand').onclick = playHand;
    $('#b-disc').onclick = discard;
    $('#b-sr').onclick = () => { st.sort = 'rank'; sortHand(); layoutHand(); Sfx.play('slide'); };
    $('#b-ss').onclick = () => { st.sort = 'suit'; sortHand(); layoutHand(); Sfx.play('slide'); };
    sizeStage();
    renderSide();
    renderSupers();
  }

  function sizeStage() {
    const s = $('#stage'); if (!s) return;
    const w = s.clientWidth, h = s.clientHeight || innerHeight;
    const cw = Math.round(Math.max(48, Math.min(112, w / 10.2, h / 5.6)));
    s.style.setProperty('--cw', cw + 'px');
  }
  const cwPx = () => parseFloat(getComputedStyle($('#stage')).getPropertyValue('--cw')) || 90;
  function rel(el) { const s = $('#stage').getBoundingClientRect(), r = el.getBoundingClientRect(); return { x: r.left - s.left, y: r.top - s.top, w: r.width, h: r.height }; }

  function renderSide() {
    const t = TANDAS[st.tanda];
    let head;
    if (st.phase === 'shop') head = `<div class="sign"><span class="bulbs"></span><b>CHICHACLUB</b><small>Recrute ta bande !</small></div>`;
    else if (st.phase === 'select') head = `<div class="sign pick"><b>Choisis</b><small>ta prochaine manche</small></div>`;
    else head = `<div class="blindbar" style="--bc:${t.col}">${isBoss() ? esc(st.boss.n) : t.n}</div>
      <div class="blindbox" style="--bc:${t.col}">${chipIcon(t)}<div><small>Objectif minimum</small><b class="tgt">${fmt(st.target)}</b><em>Récompense : <span>${rewardFor(st.tanda) + ' €'}</span></em></div></div>
      ${isBoss() ? `<p class="bossrule"><i>« ${esc(st.boss.q)} »</i>${esc(st.boss.desc)}</p>` : ''}`;
    $('#side').innerHTML = `<div class="head">${head}</div>
      <div class="rs"><small>Score<br>de la manche</small><b id="s-score">${fmt(st.score)}</b></div>
      <div class="calc" id="calc"><div class="hn" id="s-hand">&nbsp;</div><div class="cm"><span class="chips" id="s-chips">0</span><i>×</i><span class="mult" id="s-mult">0</span></div></div>
      <div class="sgrid">
        <button class="btn rosa sq info" id="s-info">Infos<br>run</button>
        <div class="stbox hands"><small>Mains</small><b class="c-blue" id="s-hands">${st.hands}</b></div>
        <div class="stbox disc"><small>Défausses</small><b class="c-red" id="s-disc">${st.discards}</b></div>
        <div class="stbox soles"><b class="c-gold" id="s-soles">${st.soles} €</b></div>
        <button class="btn orange sq opt" id="s-opt">Options</button>
        <div class="stbox noche"><small>Nuit</small><b><span class="c-gold">${st.noche}</span>/${NOCHES}</b></div>
        <div class="stbox round"><small>Manche</small><b class="c-gold">${st.round}</b></div>
      </div>`;
    $('#s-info').onclick = toggleDrawer;
    $('#s-opt').onclick = () => { Sfx.play('click'); optionsModal(); };
  }
  function setCalc(name, chips, mult) {
    if (name != null) $('#s-hand').innerHTML = name;
    $('#s-chips').textContent = fmt(chips);
    $('#s-mult').textContent = Math.round(mult * 100) / 100;
    const calc = $('#calc');
    const hot = st.target && chips * mult >= Math.max(1, st.target - st.score);
    calc.classList.toggle('fire', !!hot && chips > 0);
  }
  function setSoles(v) { st.soles = v; setStat('s-soles', st.soles + ' €'); Meta.max('maxSoles', st.soles); if (st.soles >= 40) Meta.unlock('rich'); }

  function renderDrawer() {
    $('#drawer').innerHTML = `<h3>Combos de poker</h3><p class="mute">Niveau, valeur de base et nombre de fois jouée cette partie.</p>
      <div class="combos">${Poker.HANDS.slice().reverse().map(h => {
        const v = handValue(h), L = levelOf(h.id);
        return `<div class="combo"><span class="lvl l${Math.min(L, 6)}">niv.${L}</span><span class="cbn"><b>${h.n}</b><small>${EXAMPLES[h.id]}</small></span><span class="cmx"><i class="c">${v.chips}</i>×<i class="m">${v.mult}</i></span><em>#${st.handCounts[h.id] || 0}</em></div>`;
      }).join('')}</div>
      <div class="runinfo"><b>${esc(st.deck.n)}</b> · Mise <i style="color:${Meta.STAKES[st.stake].c}">${Meta.STAKES[st.stake].n}</i></div>`;
  }
  function toggleDrawer() {
    const d = $('#drawer'), open = !d.classList.contains('open');
    if (open) renderDrawer();
    d.classList.toggle('open', open);
    $('#combo-tab').classList.toggle('open', open);
    Sfx.play('slide');
  }

  function renderSupers(newUid) {
    const box = $('#supers'); if (!box) return;
    box.innerHTML = `<div class="sl">${st.supers.map((sc, i) => superHTML(sc, {
      isNew: sc.uid === newUid,
      actions: `<span class="sc-act"><button class="mini" data-mv="-1" data-i="${i}" aria-label="Déplacer à gauche">◀</button><button class="mini sell" data-sell="${i}">Vendre ${Math.max(1, Math.floor(sc.price / 2))} €</button><button class="mini" data-mv="1" data-i="${i}" aria-label="Déplacer à droite">▶</button></span>`
    })).join('')}${Array.from({ length: Math.max(0, st.maxSupers - st.supers.length) }, () => '<span class="slot"></span>').join('')}</div>
      <span class="cnt">${st.supers.length}/${st.maxSupers}</span>`;
    wireSupersIn(box, st.supers);
    box.querySelectorAll('[data-sell]').forEach(b => b.onclick = () => {
      if (st.busy) return;
      const i = +b.dataset.sell, sc = st.supers[i];
      st.supers.splice(i, 1);
      setSoles(st.soles + Math.max(1, Math.floor(sc.price / 2)));
      Sfx.play('sell'); hideTip(); renderSupers();
    });
    box.querySelectorAll('[data-mv]').forEach(b => b.onclick = () => {
      const i = +b.dataset.i, j = i + +b.dataset.mv;
      if (j < 0 || j >= st.supers.length) return;
      [st.supers[i], st.supers[j]] = [st.supers[j], st.supers[i]];
      Sfx.play('slide'); renderSupers();
      const el = box.querySelector(`.sc[data-uid="${st.supers[j].uid}"]`); if (el) el.classList.add('flip');
    });
    if (st.supers.length >= 5) Meta.unlock('band');
  }

  // ---------- center panels (tanda choice, cash out, shop, end) ----------
  // Each new panel gets a number, so a hide that finishes late never erases a newer panel.
  let centerId = 0;
  function showCenter(html, cls) {
    const c = $('#center');
    centerId++;
    c.className = 'center show ' + (cls || '');
    c.innerHTML = `<div class="cpanel">${html}</div>`;
    return c;
  }
  function hideCenter() {
    const c = $('#center'), id = centerId;
    c.classList.add('hide');
    return new Promise(res => setTimeout(() => {
      if (id === centerId && c.isConnected) { c.className = 'center'; c.innerHTML = ''; }
      res();
    }, 250 / OPTS.speed));
  }
  function showPlay(v) { $('#run').classList.toggle('playing', v); }

  // ---------- tanda choice ----------
  function selectPhase() {
    st.phase = 'select';
    Bg.set('table');
    showPlay(false);
    renderSide();
    const cols = TANDAS.map((t, i) => {
      const cur = i === st.tanda, done = i < st.tanda;
      const skipH = i < 2 ? st.skipHands[i] : null;
      return `<div class="bl${cur ? ' cur' : ''}${done ? ' done' : ''}${i > st.tanda ? ' next' : ''}" style="--bc:${t.col}">
        <div class="bl-h">${cur ? '<button class="btn sm orange" id="b-go">Jouer</button>' : done ? '<span class="tag">Passée</span>' : '<span class="tag">À venir</span>'}</div>
        <div class="bl-n">${i === 2 ? esc(st.boss.n) : t.n}</div>
        ${chipIcon(t)}
        ${i === 2 ? `<p class="bl-rule"><i>« ${esc(st.boss.q)} »</i>${esc(st.boss.desc)}</p>` : ''}
        <div class="bl-t"><small>Objectif minimum</small><b>${fmt(targetFor(st.noche, i))}</b><em>Récompense : ${rewardFor(i)} €</em></div>
        ${skipH && cur ? `<div class="bl-skip"><small>ou</small><button class="btn sm rosa" id="b-skip">Sauter la manche</button><span>Bonus : <b>${skipH.n}</b> +1 niveau</span></div>` : skipH ? `<div class="bl-skip dim"><small>Sauter : ${skipH.n} +1 niv.</small></div>` : ''}
      </div>`;
    }).join('');
    showCenter(`<div class="bls">${cols}</div>`, 'select');
    $('#b-go').onclick = () => { Sfx.play('click'); startRound(); };
    const sk = $('#b-skip');
    if (sk) sk.onclick = () => {
      const h = st.skipHands[st.tanda];
      st.levels[h.id] = levelOf(h.id) + 1;
      Sfx.play('level'); toast(`${h.n} passe au niveau ${levelOf(h.id)}`);
      if (levelOf(h.id) >= 4) Meta.unlock('cumbia4');
      st.tanda++; selectPhase();
    };
  }

  // ---------- round ----------
  function startRound() {
    const b = isBoss() ? st.boss.id : null;
    st.round++;
    st.target = targetFor(st.noche, st.tanda);
    st.score = 0;
    st.hands = st.handsBase - (b === 'hands' ? 1 : 0);
    st.discards = b === 'nodisc' ? 0 : st.discardsBase;
    st.handSize = st.handSizeBase - (b === 'size' ? 1 : 0);
    st.draw = Poker.shuffle(st.cards.slice());
    st.draw.forEach(c => c.where = 'deck');
    st.hand = []; st.sel = new Set(); st.busy = false;
    st.phase = 'play';
    Bg.set(isBoss() ? 'boss' : 'table');
    if (isBoss()) Sfx.play('boss');
    hideCenter();
    showPlay(true);
    renderSide();
    setCalc('&nbsp;', 0, 0);
    updateDeckCount();
    setTimeout(() => drawCards(), 200 / OPTS.speed);
  }

  function updateDeckCount() { const d = $('#deckn'); if (d) d.textContent = `${st.draw.length}/${st.cards.length}`; }
  function sortHand() {
    const so = 'CKTP';
    st.hand.sort(st.sort === 'rank' ? (a, b) => b.v - a.v || so.indexOf(a.suit) - so.indexOf(b.suit)
      : (a, b) => so.indexOf(a.suit) - so.indexOf(b.suit) || b.v - a.v);
  }

  function cardEl(card) {
    let el = cardEls.get(card.uid);
    if (el) return el;
    el = document.createElement('div');
    el.className = 'pc s-' + card.suit + (debuffed(card) ? ' off' : '');
    el.dataset.uid = card.uid;
    el.innerHTML = `<div class="sway" style="--d:${(-Math.random() * 3).toFixed(2)}s"><div class="c3d"><div class="face">${Art.cardFace(card)}</div><div class="bk">${Art.cardBack(st.deck.color)}</div></div></div>`;
    el.addEventListener('click', () => toggleSel(card));
    el.addEventListener('pointerenter', () => { if (card.where === 'hand' && !st.busy) Sfx.play('hover'); });
    el.addEventListener('pointermove', e => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--tx', ((0.5 - (e.clientY - r.top) / r.height) * 20).toFixed(1) + 'deg');
      el.style.setProperty('--ty', (((e.clientX - r.left) / r.width - 0.5) * 20).toFixed(1) + 'deg');
    });
    el.addEventListener('pointerleave', () => { el.style.setProperty('--tx', '0deg'); el.style.setProperty('--ty', '0deg'); });
    $('#cards').appendChild(el);
    cardEls.set(card.uid, el);
    return el;
  }
  function place(el, x, y, r, s, z) {
    el.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px) rotate(${(r || 0).toFixed(2)}deg) scale(${s || 1})`;
    if (z != null) el.style.zIndex = z;
  }
  function deckPos() { const d = rel($('#deck')), w = cwPx(); return { x: d.x + (d.w - w) / 2, y: d.y + (d.h - w * 1.4) / 2 - 6 }; }

  function layoutHand() {
    if (!st || st.phase !== 'play') return;
    const z = rel($('#handzone')), w = cwPx(), h = w * 1.4, n = st.hand.length;
    if (!n) return;
    const deckW = w * 1.5;
    const avail = Math.max(w, z.w - deckW - 24);
    const step = Math.min(w * 1.06, (avail - w) / Math.max(1, n - 1));
    const total = step * (n - 1) + w;
    const x0 = z.x + 12 + (avail - total) / 2;
    st.hand.forEach((c, i) => {
      const el = cardEl(c), k = i - (n - 1) / 2, sel = st.sel.has(c.uid);
      el.classList.toggle('sel', sel);
      place(el, x0 + i * step, z.y + (z.h - h) / 2 + k * k * (w / 60) - (sel ? h * 0.22 : 0), k * 2.2 * (sel ? 0.4 : 1), 1, 10 + i);
    });
  }
  function layoutPlayed(cards, scoring) {
    const z = rel($('#playzone')), w = cwPx(), h = w * 1.4, n = cards.length;
    const step = Math.min(w * 1.12, (z.w - w) / Math.max(1, n - 1));
    const x0 = z.x + (z.w - (step * (n - 1) + w)) / 2;
    cards.forEach((c, i) => {
      const el = cardEl(c), up = scoring.includes(c);
      el.classList.remove('sel');
      el.classList.toggle('dim', !up);
      place(el, x0 + i * step, z.y + (z.h - h) / 2 + (up ? -h * 0.08 : h * 0.06), 0, up ? 1.04 : .96, 100 + i);
    });
  }

  async function drawCards() {
    const need = st.handSize - st.hand.length, fresh = [];
    for (let i = 0; i < need && st.draw.length; i++) { const c = st.draw.pop(); c.where = 'hand'; st.hand.push(c); fresh.push(c); }
    sortHand();
    const d = deckPos();
    fresh.forEach(c => { const el = cardEl(c); el.classList.add('down', 'notrans'); place(el, d.x, d.y, 0, 1, 300); });
    void $('#cards').offsetWidth;
    fresh.forEach((c, i) => {
      const el = cardEls.get(c.uid);
      el.classList.remove('notrans');
      el.style.transitionDelay = (i * 70 / OPTS.speed) + 'ms';
      setTimeout(() => { Sfx.play('deal'); el.classList.remove('down'); }, (i * 70 + 120) / OPTS.speed);
    });
    layoutHand();
    updateDeckCount();
    await wait(fresh.length * 70 + 420);
    fresh.forEach(c => { const el = cardEls.get(c.uid); if (el) el.style.transitionDelay = ''; });
    preview();
  }

  function flyAway(cards, toDeck) {
    const s = $('#stage').getBoundingClientRect(), d = deckPos();
    cards.forEach((c, i) => {
      const el = cardEls.get(c.uid); if (!el) return;
      c.where = 'gone';
      el.style.transitionDelay = (i * 50 / OPTS.speed) + 'ms';
      if (toDeck) { el.classList.add('down'); place(el, d.x, d.y, 0, 1, 300); }
      else place(el, s.width + 140, rel(el).y - 80 - Math.random() * 60, 30 + Math.random() * 40, 1, 300);
      cardEls.delete(c.uid);
      setTimeout(() => el.remove(), (600 + i * 50) / OPTS.speed);
    });
  }

  function selected() { return st.hand.filter(c => st.sel.has(c.uid)); }
  function toggleSel(card) {
    if (!st || st.busy || st.phase !== 'play' || card.where !== 'hand') return;
    if (st.sel.has(card.uid)) { st.sel.delete(card.uid); Sfx.play('deselect'); }
    else if (st.sel.size < 5) { st.sel.add(card.uid); Sfx.play('select'); }
    else return;
    layoutHand();
    preview();
  }
  function preview() {
    if (!st || st.phase !== 'play') return;
    const sel = selected(), five = isBoss() && st.boss.id === 'five';
    $('#b-playhand').disabled = st.busy || !sel.length || st.hands <= 0 || (five && sel.length !== 5);
    $('#b-disc').disabled = st.busy || !sel.length || st.discards <= 0;
    if (st.busy) return;
    if (!sel.length) { setCalc('&nbsp;', 0, 0); return; }
    const ev = Poker.evaluate(sel), v = handValue(ev.hand);
    setCalc(`${ev.hand.n} <small>niv.${levelOf(ev.hand.id)}</small>`, v.chips, v.mult);
  }

  async function playHand() {
    const sel = selected();
    if (!sel.length || st.busy || $('#b-playhand').disabled) return;
    st.busy = true;
    preview();
    // keep the order the cards had in hand
    st.hand = st.hand.filter(c => !st.sel.has(c.uid));
    st.sel.clear();
    st.hands--;
    setStat('s-hands', st.hands);
    const ev = Poker.evaluate(sel);
    st.handCounts[ev.hand.id] = (st.handCounts[ev.hand.id] || 0) + 1;
    Meta.addHand(ev.hand.id);
    if (ev.hand.id === 'sflush') Meta.unlock('sflush');
    sel.forEach(c => c.where = 'played');
    Sfx.play('slide');
    layoutPlayed(sel, ev.scoring);
    layoutHand();
    const v = handValue(ev.hand);
    let chips = v.chips, mult = v.mult;
    setCalc(`${ev.hand.n} <small>niv.${levelOf(ev.hand.id)}</small>`, chips, mult);
    const hn = $('#handname'); hn.innerHTML = `<b>${ev.hand.n}</b>`; bump(hn);
    await wait(520);

    if (isBoss() && st.boss.id === 'pricey') { setSoles(Math.max(0, st.soles - 1)); pop($('#s-soles'), '-1 €', 'off'); }
    const ctx = { hand: ev.hand, played: sel, scoring: ev.scoring, discardsLeft: st.discards, handsLeft: st.hands, isLastHand: st.hands === 0 };
    st.supers.forEach(sc => sc.onPlayed && sc.onPlayed(ctx, sc));

    let nc = 0, nm = 0;
    const apply = (res, el) => {
      if (!res) return false;
      if (res.chips) { chips += res.chips; pop(el, '+' + res.chips, 'chips'); Sfx.play('chip', nc++); bump($('#s-chips')); }
      if (res.mult) { mult += res.mult; pop(el, '+' + res.mult + ' Mult', 'mult'); Sfx.play('mult', nm++); bump($('#s-mult')); }
      if (res.xmult) { mult *= res.xmult; pop(el, '×' + Math.round(res.xmult * 100) / 100 + ' Mult', 'xmult'); Sfx.play('xmult'); bump($('#s-mult')); shake(); }
      if (res.money) { setSoles(st.soles + res.money); pop(el, '+' + res.money + ' €', 'money'); Sfx.play('money'); }
      setCalc(null, chips, mult);
      return true;
    };
    const scEl = sc => document.querySelector(`#supers .sc[data-uid="${sc.uid}"]`);

    for (let i = 0; i < ev.scoring.length; i++) {
      const card = ev.scoring[i], el = cardEls.get(card.uid);
      if (debuffed(card)) { pop(el, 'Bloqué', 'off'); Sfx.play('deselect'); await wait(380); continue; }
      const times = 1 + st.supers.reduce((n, sc) => n + (sc.retrigger ? sc.retrigger(card, i, ctx, sc) : 0), 0);
      for (let t = 0; t < times; t++) {
        if (t > 0) { pop(el, 'Encore !', 'again'); Sfx.play('again'); await wait(300); }
        apply({ chips: Poker.chipsOf(card) }, el);
        await wait(330);
        for (const sc of st.supers) if (sc.perCard && apply(sc.perCard(card, ctx, sc), scEl(sc))) await wait(330);
      }
    }
    for (const sc of st.supers) if (sc.afterHand && apply(sc.afterHand(ctx, sc), scEl(sc))) await wait(420);

    const total = Math.floor(chips * mult);
    st.bestHand = Math.max(st.bestHand, total);
    Meta.max('bestHand', total);
    if (total >= 100000) Meta.unlock('big');
    Sfx.play('total');
    $('#s-hand').innerHTML = `<b class="total">${fmt(total)}</b>`;
    bump($('#s-hand'));
    if (total >= st.target) shake();
    await wait(600);
    const from = st.score;
    st.score += total;
    await countTo($('#s-score'), from, st.score, 650);
    bump($('#s-score'));
    hn.innerHTML = '';
    flyAway(sel);
    renderSupers();
    await wait(380);

    if (st.score >= st.target) return roundWon();
    if (st.hands <= 0) return gameOver();
    setCalc('&nbsp;', 0, 0);
    await drawCards();
    st.busy = false;
    preview();
  }

  async function discard() {
    const sel = selected();
    if (!sel.length || st.discards <= 0 || st.busy) return;
    st.busy = true;
    st.hand = st.hand.filter(c => !st.sel.has(c.uid));
    st.sel.clear();
    st.discards--;
    setStat('s-disc', st.discards);
    Meta.add('discards', sel.length);
    st.supers.forEach(sc => sc.onDiscard && sc.onDiscard(sel.length, sc));
    Sfx.play('slide');
    flyAway(sel);
    layoutHand();
    renderSupers();
    await wait(260);
    await drawCards();
    st.busy = false;
    preview();
  }

  // ---------- end of round ----------
  async function roundWon() {
    Sfx.play('win');
    flyAway(st.hand, true);
    st.hand = [];
    showPlay(false);
    Meta.add('rounds');
    if (isBoss()) { Meta.add('bosses'); if (Meta.data.stats.bosses >= 10) Meta.unlock('jefes'); }
    Meta.unlock('tanda1');
    const t = TANDAS[st.tanda];
    const lines = [];
    if (rewardFor(st.tanda)) lines.push([`${isBoss() ? st.boss.n : t.n} battu`, rewardFor(st.tanda), 'gold']);
    if (st.hands) lines.push([`${st.hands} main${st.hands > 1 ? 's' : ''} restante${st.hands > 1 ? 's' : ''} (1 € chacune)`, st.hands, 'blue']);
    const interest = Math.min(st.interestMax, Math.floor(st.soles / 5));
    if (interest) lines.push([`1 d'intérêt par tranche de 5 € (max ${st.interestMax} €)`, interest, 'gold']);
    st.supers.forEach(sc => { const m = sc.endRound && sc.endRound(st, sc); if (m) lines.push([sc.card.n, m, 'rosa']); });
    const sum = lines.reduce((s, l) => s + l[1], 0);
    await wait(500);
    showCenter(`<div class="cash">
      <button class="btn xl orange" id="b-cash" disabled>Encaisser ${sum} €</button>
      <div class="cash-h">${chipIcon(t)}<div><small>Objectif ${fmt(st.target)}</small><b>Score ${fmt(st.score)}</b></div><span class="dots"></span><em>${rewardFor(st.tanda)} €</em></div>
      <ul id="cash-l"></ul>
    </div>`, 'cashout');
    const ul = $('#cash-l');
    for (const l of lines) {
      await wait(330);
      const li = document.createElement('li');
      li.innerHTML = `<span>${esc(l[0])}</span><b class="c-${l[2]}">${l[1] + ' €'}</b>`;
      ul.appendChild(li);
      Sfx.play('money');
    }
    const b = $('#b-cash');
    b.disabled = false;
    b.onclick = () => {
      setSoles(st.soles + sum);
      Sfx.play('buy');
      if (st.tanda === 2 && st.noche === NOCHES) return victory();
      shop();
    };
  }

  function nextTanda() {
    st.tanda++;
    if (st.tanda > 2) { st.tanda = 0; st.noche++; pickBoss(); Meta.max('best', st.noche); if (st.noche >= 4) Meta.unlock('noche4'); }
    st.score = 0; st.target = 0;
    st.hands = st.handsBase; st.discards = st.discardsBase;
    selectPhase();
  }

  // ---------- shop ----------
  function shop() {
    st.phase = 'shop';
    st.rerollCost = 5;
    st.offers = rollOffers();
    st.cumbias = Poker.shuffle(Poker.HANDS.slice()).slice(0, 2).map(h => ({ h, sold: false }));
    Bg.set('shop');
    renderSide();
    shopScreen(true);
  }
  function rollOffers() {
    const owned = new Set(st.supers.map(sc => sc.card.id)), out = [];
    for (let i = 0; i < 3; i++) {
      const pool = Unlocks.open();
      const c = Supers.rollCard(pool.length ? pool : DB.cards, new Set([...owned, ...out.map(o => o.card.id)]));
      out.push(Supers.make(c, seriesOf(c)));
    }
    return out;
  }
  function vinyl(h) {
    return `<div class="vinyl"><svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="48" fill="#120a18" stroke="#000" stroke-width="3"/>
      ${[40, 33, 26].map(r => `<circle cx="50" cy="50" r="${r}" fill="none" stroke="#2a1d33" stroke-width="2"/>`).join('')}
      <circle cx="50" cy="50" r="17" fill="#ff2e88" stroke="#000" stroke-width="2"/><circle cx="50" cy="50" r="3" fill="#000"/>
      <path d="M50 33 A17 17 0 0 1 67 50 L50 50 Z" fill="#ffe600"/></svg></div>`;
  }
  function shopScreen(anim) {
    showCenter(`<div class="shop">
      <div class="shop-btns">
        <button class="btn xl rosa" id="b-next">Manche<br>suivante</button>
        <button class="btn lg green" id="b-reroll">Relancer<br><b>${st.rerollCost} €</b></button>
      </div>
      <div class="offers">${st.offers.map((sc, i) => sc ? `<div class="offer"><span class="price">${sc.price} €</span>${superHTML(sc)}<button class="btn sm blue buy" data-buy="${i}">Recruter</button></div>` : '<div class="offer sold"><span>Vendu</span></div>').join('')}</div>
      <div class="cumbias">${st.cumbias.map((o, i) => {
        const v = handValue(o.h);
        return `<div class="cumbia${o.sold ? ' sold' : ''}"><span class="price">3 €</span>${vinyl(o.h)}<b>${o.h.n}</b><small>niv.${levelOf(o.h.id)} → ${levelOf(o.h.id) + 1}</small><span class="cmx"><i class="c">+${o.h.lc}</i><i class="m">+${o.h.lm}</i></span>
          ${o.sold ? '<span class="tag">Écouté</span>' : `<button class="btn sm blue" data-cum="${i}">Écouter</button>`}</div>`;
      }).join('')}</div>
    </div>`, 'shopc' + (anim ? '' : ' still'));
    $('#b-next').onclick = async e => {
      e.currentTarget.disabled = true;
      Sfx.play('click');
      await hideCenter();
      nextTanda();
    };
    const rr = $('#b-reroll');
    rr.disabled = st.soles < st.rerollCost;
    rr.onclick = () => { if (st.soles < st.rerollCost) return; setSoles(st.soles - st.rerollCost); st.rerollCost++; st.offers = rollOffers(); Sfx.play('shuffle'); shopScreen(); };
    $('#center').querySelectorAll('[data-buy]').forEach(b => {
      const sc = st.offers[+b.dataset.buy], full = st.supers.length >= st.maxSupers;
      b.disabled = st.soles < sc.price || full;
      if (full) b.textContent = 'Plus de place';
      b.onclick = () => {
        setSoles(st.soles - sc.price);
        st.supers.push(sc);
        st.offers[+b.dataset.buy] = null;
        st.recruited++;
        Meta.add('recruited');
        Sfx.play('buy');
        renderSupers(sc.uid);
        shopScreen();
      };
    });
    $('#center').querySelectorAll('[data-cum]').forEach(b => {
      const o = st.cumbias[+b.dataset.cum];
      b.disabled = st.soles < 3;
      b.onclick = () => {
        setSoles(st.soles - 3);
        st.levels[o.h.id] = levelOf(o.h.id) + 1;
        o.sold = true;
        Meta.add('cumbias');
        Sfx.play('level');
        toast(`${o.h.n} passe au niveau ${levelOf(o.h.id)}`);
        if (levelOf(o.h.id) >= 4) Meta.unlock('cumbia4');
        shopScreen();
      };
    });
    wireSupersIn($('#center').querySelector('.offers'), st.offers.filter(Boolean));
  }

  // ---------- end screens ----------
  function runStats() {
    const most = Object.entries(st.handCounts).sort((a, b) => b[1] - a[1])[0];
    return `<div class="rstats">
      <div><small>Meilleure main</small><b>${fmt(st.bestHand)}</b></div>
      <div><small>Main la plus jouée</small><b>${most ? Poker.HAND_BY_ID[most[0]].n + ' ×' + most[1] : '—'}</b></div>
      <div><small>Nuit atteinte</small><b>${st.noche}/${NOCHES}</b></div>
      <div><small>Super cartes recrutées</small><b>${st.recruited}</b></div>
      <div><small>Deck · Mise</small><b>${esc(st.deck.n)} · ${Meta.STAKES[st.stake].n}</b></div>
    </div>`;
  }
  function gameOver() {
    Sfx.play('lose');
    Bg.set('lose');
    flyAway(st.hand, true);
    st.hand = [];
    showPlay(false);
    Meta.max('best', st.noche);
    showCenter(`<div class="end lose"><h2>Fin de soirée</h2><p>Score ${fmt(st.score)} / ${fmt(st.target)}</p>${runStats()}
      <div class="acts"><button class="btn xl blue" id="b-again">Nouvelle partie</button><button class="btn lg orange" id="b-home">Menu</button></div></div>`, 'endc');
    $('#b-again').onclick = () => { Sfx.play('click'); newRunModal(); };
    $('#b-home').onclick = () => { Sfx.play('click'); title(); };
  }
  function victory() {
    const before = Meta.data.stake;
    Meta.winRun(st.deck.id, st.stake);
    Sfx.play('achieve');
    Bg.set('win');
    confetti();
    const newStake = Meta.data.stake > before ? `<p class="unl">Nouvelle mise débloquée : <b style="color:${Meta.STAKES[Meta.data.stake].c}">${Meta.STAKES[Meta.data.stake].n}</b></p>` : '';
    showCenter(`<div class="end win"><h2>Roi de la nuit !</h2>${newStake}
      <div class="band">${st.supers.map(sc => superHTML(sc)).join('')}</div>${runStats()}
      <div class="acts"><button class="btn xl blue" id="b-again">Nouvelle partie</button><button class="btn lg orange" id="b-home">Menu</button></div></div>`, 'endc');
    wireSupersIn($('#center'), st.supers);
    $('#b-again').onclick = () => { Sfx.play('click'); newRunModal(); };
    $('#b-home').onclick = () => { Sfx.play('click'); title(); };
  }
  function confetti() {
    if (OPTS.reduced) return;
    const box = document.createElement('div');
    box.className = 'confetti';
    const cols = ['#ff2e88', '#ff7a00', '#ffe600', '#2bff6e', '#18d6ff', '#a43bff'];
    box.innerHTML = Array.from({ length: 90 }, () => `<i style="left:${Math.random() * 100}%;background:${rnd(cols)};animation-delay:${(Math.random() * 1.5).toFixed(2)}s;animation-duration:${(2.5 + Math.random() * 2).toFixed(2)}s;--r:${Math.round(Math.random() * 720 - 360)}deg"></i>`).join('');
    document.body.appendChild(box);
    setTimeout(() => box.remove(), 5500);
  }

  // ---------- achievement banner ----------
  const achQueue = [];
  let achBusy = false;
  Meta.onUnlock((a, deck) => {
    achQueue.push(`<span class="trophy">🏆</span><span><small>Succès débloqué</small><b>${esc(a.n)}</b>${deck ? `<em style="--c:${deck.color}">Nouveau deck : ${deck.n}</em>` : `<i>${esc(a.d)}</i>`}</span>`);
    runAch();
  });
  // A stat changed: unlock the cards whose condition is now met.
  Meta.onStats(() => {
    if (!DB.cards.length) return;
    const fresh = Unlocks.check();
    if (fresh.length > 3) {
      achQueue.push(`<span class="trophy">🃏</span><span><small>Nouvelles cartes</small><b>${fresh.length} super cartes débloquées</b><i>Elles peuvent maintenant sortir dans la ChichaClub.</i></span>`);
    } else fresh.forEach(c => {
      achQueue.push(`<span class="unlk-art">${media(c)}</span><span><small>Carte débloquée</small><b>${esc(c.n)}</b><i>${Supers.TIERS[Supers.TIER_OF[c.r] || 1].n} · peut sortir dans la ChichaClub</i></span>`);
    });
    if (fresh.length) runAch();
  });
  function runAch() {
    if (achBusy || !achQueue.length) return;
    achBusy = true;
    const html = achQueue.shift();
    const b = document.createElement('div');
    b.className = 'achpop';
    b.innerHTML = html;
    document.body.appendChild(b);
    Sfx.play('achieve');
    setTimeout(() => { b.classList.add('out'); setTimeout(() => { b.remove(); achBusy = false; runAch(); }, 400); }, 3200);
  }

  // ---------- boot ----------
  async function boot() {
    applyOpts();
    app().innerHTML = `<section class="title">${Art.logo('big')}<p class="src">Chargement des cartes…</p></section>`;
    const d = await ChichaData.load();
    DB = d;
    if (!DB.cards.length) DB.cards = (window.CHICHA_BASE || {}).cards || [];
    Unlocks.init(DB.cards);
    Unlocks.check();
    title();
  }

  window.addEventListener('resize', () => {
    if (!st || !$('#stage')) return;
    sizeStage();
    layoutHand();
  });
  document.addEventListener('keydown', e => {
    if (!st || st.phase !== 'play' || e.target.closest('input,textarea') || document.querySelector('.ov')) return;
    if (e.key === 'Enter') playHand();
    if (e.key === 'd' || e.key === 'D') discard();
  });

  // Debug from the console: ChichaGame.state(), ChichaGame.give(soles)
  window.ChichaGame = { boot, state: () => st, give: n => { if (st) setSoles(st.soles + n); } };
  Bg.init();
  boot();
})();
