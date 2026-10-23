/* CHICHA POKER — game flow, scoring, shop and screens. */
(function () {
  const $ = s => document.querySelector(s);
  const app = () => $('#app');
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const fmt = n => Math.floor(n).toLocaleString('fr-FR');
  const wait = ms => new Promise(r => setTimeout(r, ms / SPEED));
  let SPEED = 1;

  // ---------- constants ----------
  const NOCHES = 8;
  const BASE_TARGET = [300, 800, 2000, 5000, 11000, 20000, 35000, 50000];
  const TANDAS = [
    { n: 'Tanda chica', mul: 1, reward: 3 },
    { n: 'Tanda grande', mul: 1.5, reward: 4 },
    { n: 'El Jefe', mul: 2, reward: 5 }
  ];
  const BOSSES = [
    { id: 'suit', n: 'El Cobrador', d: s => `Les ${s} ne rapportent rien` },
    { id: 'hands', n: 'La Tacaña', d: () => 'Une main de moins' },
    { id: 'nodisc', n: 'El Apagón', d: () => 'Aucune défausse' },
    { id: 'size', n: 'El Estrecho', d: () => 'Une carte de moins en main' },
    { id: 'five', n: 'La Exigente', d: () => 'Chaque main doit avoir 5 cartes' }
  ];
  const HUES = { feu: 14, eau: 200, nature: 130, foudre: 50, psy: 290, ombre: 255 };

  let DB = { cards: [], series: [], backs: {}, source: 'base' };
  let st = null;

  // ---------- helpers ----------
  function best() { try { return +localStorage.getItem('chicha-best') || 0; } catch (e) { return 0; } }
  function saveBest(n) { try { if (n > best()) localStorage.setItem('chicha-best', n); } catch (e) { } }
  const seriesOf = c => DB.series.find(s => s.id === c.s);
  const targetFor = (noche, t) => Math.round(BASE_TARGET[Math.min(noche, NOCHES) - 1] * TANDAS[t].mul);
  const levelOf = id => st.levels[id] || 1;
  function handValue(h) { const L = levelOf(h.id); return { chips: h.c + (L - 1) * h.lc, mult: h.m + (L - 1) * h.lm }; }

  function noArt(c) {
    const ini = (c.n || '?').replace(/^(L'|Le |La |Les )/i, '').split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();
    return `<div class="noart" style="--h:${HUES[c.t] || 330}"><span>${esc(ini)}</span></div>`;
  }

  // Photo framing saved by the TCG editor: fx/fy = focus point in %, fz = zoom.
  function frame(c) {
    const x = isFinite(+c.fx) ? +c.fx : 50, y = isFinite(+c.fy) ? +c.fy : 50, z = +c.fz > 0 ? +c.fz : 1;
    return `object-position:${x}% ${y}%;transform-origin:${x}% ${y}%${z !== 1 ? `;transform:scale(${z})` : ''}`;
  }

  // ---------- rendering pieces ----------
  function playingCardHTML(c, extra) {
    const s = Poker.suitOf(c.suit), lb = Poker.label(c);
    const off = st && st.boss && st.boss.id === 'suit' && st.tanda === 2 && st.boss.suit === c.suit;
    return `<button class="pc s-${s.col}${off ? ' off' : ''} ${extra || ''}" data-uid="${c.uid}" aria-label="${lb} de ${s.n}">
      <span class="pc-r">${lb}<i>${s.s}</i></span><span class="pc-s">${s.s}</span><span class="pc-r pc-r2">${lb}<i>${s.s}</i></span></button>`;
  }

  function superHTML(sc, o) {
    o = o || {};
    const c = sc.card, ph = ChichaData.photo(c), back = DB.backs[c.s], tier = Supers.TIERS[sc.tier];
    const ser = seriesOf(c);
    return `<div class="sc ${tier.cls} fam-${sc.fam}${o.flip ? ' flip' : ''}" data-uid="${sc.uid}" tabindex="0" role="button" aria-label="${esc(c.n)} — ${esc(Supers.liveText(sc))}">
      <div class="sc-in">
        <div class="sc-f">
          ${ph && /^data:video|\.(mp4|webm|mov)(\?|$)/i.test(ph) ? `<video src="${esc(ph)}" autoplay muted loop playsinline preload="metadata" style="${frame(c)}"></video>` : ph ? `<img src="${esc(ph)}" alt="" loading="lazy" style="${frame(c)}" onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'noart',innerHTML:'<span>?</span>'}))">` : noArt(c)}
          <div class="sc-tier">${tier.n}</div>
          <div class="sc-name">${esc(c.n)}</div>
        </div>
        <div class="sc-b"${back ? ` style="--back:url('${esc(back)}')"` : ''}>
          <div class="sc-bn">${esc(c.n)}</div>
          ${c.an ? `<p class="sc-atk">${esc(c.an)}</p>` : ''}
          ${c.f ? `<p class="sc-desc">« ${esc(c.f)} »</p>` : ''}
          <div class="sc-eff">${esc(Supers.liveText(sc))}</div>
          <div class="sc-meta">${esc(sc.famName)} · ${tier.n}${ser ? ' · ' + esc(ser.code || ser.n) : ''}</div>
          ${o.actions || ''}
        </div>
      </div>
      ${o.caption ? `<div class="sc-cap">${esc(Supers.liveText(sc))}</div>` : ''}
    </div>`;
  }

  function wireFlip(root) {
    root.querySelectorAll('.sc').forEach(el => {
      const toggle = e => { if (e.target.closest('button')) return; el.classList.toggle('flip'); };
      el.addEventListener('click', toggle);
      el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(e); } });
    });
  }

  function toast(msg) {
    const t = document.createElement('div');
    t.className = 'toast'; t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2600);
  }

  function logo(big) {
    return `<h1 class="logo${big ? ' big' : ''}"><span class="l1">CHICHA</span><span class="l2">POKER</span></h1>`;
  }

  // ---------- title ----------
  function title() {
    const n = DB.cards.length;
    const src = DB.source === 'supabase'
      ? `<b class="ok">●</b> ${n} super cartes chargées depuis Supabase`
      : `<b class="warn">●</b> ${n} super cartes (set de base). Connecte-toi avec ton compte CHICHA TCG pour charger toutes tes cartes.`;
    app().innerHTML = `<section class="screen title">
      <div class="stripes" aria-hidden="true"></div>
      ${logo(true)}
      <p class="tag">Joue des mains de poker · bats la noche · recrute des super cartes</p>
      <div class="fan">${DB.cards.slice().sort((a, b) => (Supers.TIER_OF[b.r] || 1) - (Supers.TIER_OF[a.r] || 1)).slice(0, 5).map((c, i) => `<div style="--i:${i - 2}">${superHTML(Supers.make(c, seriesOf(c)))}</div>`).join('')}</div>
      <div class="acts">
        <button class="btn big rosa" id="b-play">¡JUGAR!</button>
        <button class="btn" id="b-col">Collection</button>
        <button class="btn" id="b-login">${DB.user ? 'Déconnexion' : 'Connexion TCG'}</button>
      </div>
      <p class="src">${src}</p>
      ${best() ? `<p class="src">Meilleure noche : <b>${best()}</b></p>` : ''}
      <details class="rules"><summary>Comment jouer</summary>
        <p>Sélectionne jusqu'à 5 cartes et joue une main de poker. Score = <b>Jetons × Mult</b>. Atteins l'objectif de chaque tanda avant d'épuiser tes mains. Chaque noche a 3 tandas, la dernière est un Jefe avec une règle spéciale. Entre les tandas, dépense tes Soles pour recruter des super cartes (tes cartes CHICHA TCG) qui changent le score. Clique une super carte pour la retourner et lire son effet. Survis à 8 noches.</p>
      </details>
    </section>`;
    $('#b-play').onclick = newRun;
    $('#b-col').onclick = collection;
    $('#b-login').onclick = DB.user ? async () => { await ChichaData.signOut(); await boot(); } : loginForm;
    wireFlip(app());
  }

  function loginForm() {
    const ov = document.createElement('div');
    ov.className = 'ov';
    ov.innerHTML = `<form class="modal" id="lf">
      <h2>Compte CHICHA TCG</h2>
      <p class="mute">Utilise le même compte que sur CHICHA TCG pour charger toutes les cartes.</p>
      <label>E-mail<input type="email" name="e" required autocomplete="email"></label>
      <label>Mot de passe<input type="password" name="p" required autocomplete="current-password"></label>
      <p class="err" hidden></p>
      <div class="acts"><button class="btn rosa" type="submit">Connexion</button><button class="btn" type="button" id="lf-x">Annuler</button></div>
    </form>`;
    document.body.appendChild(ov);
    ov.querySelector('#lf-x').onclick = () => ov.remove();
    ov.querySelector('#lf').onsubmit = async e => {
      e.preventDefault();
      const f = e.target, err = f.querySelector('.err');
      try {
        await ChichaData.signIn(f.e.value.trim(), f.p.value);
        ov.remove();
        await boot();
        toast(DB.source === 'supabase' ? `${DB.cards.length} cartes chargées` : 'Connecté, mais les cartes n\'ont pas pu être lues');
      } catch (x) { err.hidden = false; err.textContent = x.message || 'Connexion impossible'; }
    };
  }

  // ---------- collection ----------
  function collection() {
    const order = ['feu', 'eau', 'foudre', 'nature', 'psy', 'ombre'];
    const all = DB.cards.map(c => Supers.make(c, seriesOf(c)))
      .sort((a, b) => b.tier - a.tier || order.indexOf(a.fam) - order.indexOf(b.fam));
    app().innerHTML = `<section class="screen col">
      <header class="bar"><button class="btn" id="b-back">← Retour</button>${logo()}<span class="mute">${all.length} cartes · clique pour retourner</span></header>
      <div class="grid">${all.map(sc => superHTML(sc)).join('')}</div>
    </section>`;
    $('#b-back').onclick = title;
    wireFlip(app());
  }

  // ---------- run ----------
  function newRun() {
    st = {
      noche: 1, tanda: 0, soles: 4, supers: [], maxSupers: 5,
      handSizeBase: 8, handsBase: 4, discardsBase: 3,
      levels: {}, deck: Poker.newDeck(), bossBag: [], sort: 'rank', rerollCost: 5
    };
    pickBoss();
    map();
  }

  function pickBoss() {
    if (!st.bossBag.length) st.bossBag = Poker.shuffle(BOSSES.slice());
    const b = Object.assign({}, st.bossBag.pop());
    if (b.id === 'suit') { const s = Poker.SUITS[Math.floor(Math.random() * 4)]; b.suit = s.k; b.desc = b.d(s.s); }
    else b.desc = b.d();
    st.boss = b;
  }

  function hud() {
    return `<aside class="hud">
      ${logo()}
      <div class="blind t${st.tanda}"><small>Noche ${st.noche}/${NOCHES}</small><b>${TANDAS[st.tanda].n}</b>${st.tanda === 2 ? `<em>${esc(st.boss.n)} : ${esc(st.boss.desc)}</em>` : ''}</div>
      <div class="goal"><small>Objectif</small><b>${fmt(st.target || 0)}</b></div>
      <div class="score"><small>Score</small><b id="h-score">${fmt(st.score || 0)}</b></div>
      <div class="calc"><div id="h-name">&nbsp;</div><div class="cm"><span class="chips" id="h-chips">0</span><i>×</i><span class="mult" id="h-mult">0</span></div></div>
      <div class="stats">
        <div><small>Mains</small><b class="azul" id="h-hands">${st.hands ?? st.handsBase}</b></div>
        <div><small>Défausses</small><b class="rosa" id="h-disc">${st.discards ?? st.discardsBase}</b></div>
        <div><small>Soles</small><b class="amarillo" id="h-soles">S/ ${st.soles}</b></div>
      </div>
      <button class="btn sm" id="h-levels">Niveaux des mains</button>
    </aside>`;
  }

  function levelsModal() {
    const ov = document.createElement('div');
    ov.className = 'ov';
    ov.innerHTML = `<div class="modal"><h2>Niveaux des mains</h2><table>${Poker.HANDS.slice().reverse().map(h => {
      const v = handValue(h); return `<tr><td>${h.n}</td><td>niv. ${levelOf(h.id)}</td><td><span class="chips">${v.chips}</span> × <span class="mult">${v.mult}</span></td></tr>`;
    }).join('')}</table><div class="acts"><button class="btn rosa">Fermer</button></div></div>`;
    document.body.appendChild(ov);
    ov.querySelector('button').onclick = () => ov.remove();
  }

  function map() {
    app().innerHTML = `<section class="screen map">
      ${hud()}
      <div class="main">
        <h2 class="h">Noche ${st.noche}</h2>
        <div class="tandas">${TANDAS.map((t, i) => `<div class="tanda t${i}${i === st.tanda ? ' cur' : i < st.tanda ? ' done' : ''}">
          <b>${t.n}</b>
          ${i === 2 ? `<p class="boss"><span>${esc(st.boss.n)}</span>${esc(st.boss.desc)}</p>` : '<p class="boss">&nbsp;</p>'}
          <small>Objectif</small><strong>${fmt(targetFor(st.noche, i))}</strong>
          <small>Récompense</small><em>S/ ${t.reward}</em>
          ${i === st.tanda ? '<button class="btn rosa" id="b-go">¡Vamos!</button>' : i < st.tanda ? '<span class="stamp">Pasó</span>' : ''}
        </div>`).join('')}</div>
        ${supersRow()}
      </div>
    </section>`;
    $('#b-go').onclick = startRound;
    $('#h-levels').onclick = levelsModal;
    wireSupers();
  }

  function supersRow() {
    return `<div class="supers"><div class="supers-h"><b>Super cartes</b><span>${st.supers.length}/${st.maxSupers}</span></div>
      <div class="supers-list">${st.supers.map((sc, i) => superHTML(sc, {
        caption: true,
        actions: `<div class="sc-act"><button class="mini" data-mv="-1" data-i="${i}" aria-label="Déplacer à gauche">◀</button><button class="mini sell" data-sell="${i}">Vendre S/ ${Math.max(1, Math.floor(sc.price / 2))}</button><button class="mini" data-mv="1" data-i="${i}" aria-label="Déplacer à droite">▶</button></div>`
      })).join('') || '<p class="empty">Aucune super carte. Recrute-les dans la Bodega.</p>'}</div></div>`;
  }

  function wireSupers() {
    const root = document.querySelector('.supers');
    if (!root) return;
    wireFlip(root);
    root.querySelectorAll('[data-sell]').forEach(b => b.onclick = () => {
      const i = +b.dataset.sell, sc = st.supers[i];
      st.soles += Math.max(1, Math.floor(sc.price / 2));
      st.supers.splice(i, 1);
      refreshSupers();
    });
    root.querySelectorAll('[data-mv]').forEach(b => b.onclick = () => {
      const i = +b.dataset.i, j = i + +b.dataset.mv;
      if (j < 0 || j >= st.supers.length) return;
      [st.supers[i], st.supers[j]] = [st.supers[j], st.supers[i]];
      refreshSupers(st.supers[j].uid);
    });
  }

  function refreshSupers(keepFlipped) {
    const root = document.querySelector('.supers');
    if (!root) return;
    root.outerHTML = supersRow();
    if (keepFlipped) { const el = document.querySelector(`.supers .sc[data-uid="${keepFlipped}"]`); if (el) el.classList.add('flip'); }
    wireSupers();
    const s = $('#h-soles'); if (s) s.textContent = 'S/ ' + st.soles;
  }

  // ---------- round ----------
  function startRound() {
    const boss = st.tanda === 2 ? st.boss.id : null;
    st.target = targetFor(st.noche, st.tanda);
    st.score = 0;
    st.hands = st.handsBase - (boss === 'hands' ? 1 : 0);
    st.discards = boss === 'nodisc' ? 0 : st.discardsBase;
    st.handSize = st.handSizeBase - (boss === 'size' ? 1 : 0);
    st.draw = Poker.shuffle(st.deck.slice());
    st.hand = [];
    st.sel = new Set();
    st.busy = false;
    draw();
    roundScreen();
  }

  function draw() {
    while (st.hand.length < st.handSize && st.draw.length) st.hand.push(st.draw.pop());
    sortHand();
  }
  function sortHand() {
    const so = 'CKTP';
    st.hand.sort(st.sort === 'rank' ? (a, b) => b.v - a.v || so.indexOf(a.suit) - so.indexOf(b.suit)
      : (a, b) => so.indexOf(a.suit) - so.indexOf(b.suit) || b.v - a.v);
  }

  function roundScreen() {
    app().innerHTML = `<section class="screen round">
      ${hud()}
      <div class="main">
        ${supersRow()}
        <div class="table"><div class="played" id="played"></div></div>
        <div class="hand" id="hand"></div>
        <div class="controls">
          <button class="btn rosa" id="b-playhand">Jouer la main</button>
          <div class="sortb"><small>Trier</small><button class="btn sm" id="b-sr">Valeur</button><button class="btn sm" id="b-ss">Couleur</button></div>
          <button class="btn verde" id="b-disc">Défausser</button>
        </div>
        <div class="deckc"><span>${st.draw.length}</span>/${st.deck.length}</div>
      </div>
    </section>`;
    $('#b-playhand').onclick = playHand;
    $('#b-disc').onclick = discard;
    $('#b-sr').onclick = () => { st.sort = 'rank'; sortHand(); renderHand(); };
    $('#b-ss').onclick = () => { st.sort = 'suit'; sortHand(); renderHand(); };
    $('#h-levels').onclick = levelsModal;
    wireSupers();
    renderHand();
  }

  function renderHand() {
    const h = $('#hand');
    const n = st.hand.length;
    h.innerHTML = st.hand.map((c, i) => playingCardHTML(c, st.sel.has(c.uid) ? 'sel' : '').replace('class="pc', `style="--i:${i - (n - 1) / 2}" class="pc`)).join('');
    h.querySelectorAll('.pc').forEach(b => b.onclick = () => {
      if (st.busy) return;
      const u = +b.dataset.uid;
      if (st.sel.has(u)) st.sel.delete(u);
      else if (st.sel.size < 5) st.sel.add(u);
      b.classList.toggle('sel', st.sel.has(u));
      preview();
    });
    const dc = document.querySelector('.deckc span'); if (dc) dc.textContent = st.draw.length;
    preview();
  }

  function selected() { return st.hand.filter(c => st.sel.has(c.uid)); }

  function preview() {
    const sel = selected();
    const five = st.tanda === 2 && st.boss.id === 'five';
    $('#b-playhand').disabled = st.busy || !sel.length || st.hands <= 0 || (five && sel.length !== 5);
    $('#b-disc').disabled = st.busy || !sel.length || st.discards <= 0;
    if (st.busy) return;
    if (!sel.length) { setCalc('&nbsp;', 0, 0); return; }
    const ev = Poker.evaluate(sel), v = handValue(ev.hand);
    setCalc(`${ev.hand.n} <small>niv. ${levelOf(ev.hand.id)}</small>`, v.chips, v.mult);
  }

  function setCalc(name, chips, mult) {
    if (name != null) $('#h-name').innerHTML = name;
    $('#h-chips').textContent = fmt(chips);
    $('#h-mult').textContent = Math.round(mult * 100) / 100;
  }

  function pop(el, text, cls) {
    if (!el) return;
    const r = el.getBoundingClientRect();
    const p = document.createElement('div');
    p.className = 'pop ' + (cls || '');
    p.textContent = text;
    p.style.left = r.left + r.width / 2 + 'px';
    p.style.top = r.top + 'px';
    document.body.appendChild(p);
    el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump');
    setTimeout(() => p.remove(), 900 / SPEED);
  }

  async function playHand() {
    const sel = selected();
    if (!sel.length || st.busy) return;
    st.busy = true;
    preview();
    st.hand = st.hand.filter(c => !st.sel.has(c.uid));
    st.sel.clear();
    st.hands--;
    $('#h-hands').textContent = st.hands;
    renderHand();

    const ev = Poker.evaluate(sel);
    const v = handValue(ev.hand);
    let chips = v.chips, mult = v.mult;
    const ctx = { hand: ev.hand, played: sel, scoring: ev.scoring, discardsLeft: st.discards, handsLeft: st.hands, isLastHand: st.hands === 0 };
    const debuff = st.tanda === 2 && st.boss.id === 'suit' ? st.boss.suit : null;

    // played cards on the table, scoring ones raised
    const table = $('#played');
    table.innerHTML = sel.map(c => playingCardHTML(c, ev.scoring.includes(c) ? 'up' : 'dim')).join('');
    setCalc(`${ev.hand.n} <small>niv. ${levelOf(ev.hand.id)}</small>`, chips, mult);
    await wait(450);

    st.supers.forEach(sc => sc.onPlayed && sc.onPlayed(ctx, sc));

    const apply = (res, el) => {
      if (!res) return false;
      if (res.chips) { chips += res.chips; pop(el, '+' + res.chips, 'chips'); }
      if (res.mult) { mult += res.mult; pop(el, '+' + res.mult + ' Mult', 'mult'); }
      if (res.xmult) { mult *= res.xmult; pop(el, '×' + Math.round(res.xmult * 100) / 100 + ' Mult', 'xmult'); }
      if (res.money) { st.soles += res.money; pop(el, '+S/ ' + res.money, 'money'); $('#h-soles').textContent = 'S/ ' + st.soles; }
      setCalc(null, chips, mult);
      return true;
    };
    const scEl = sc => document.querySelector(`.supers .sc[data-uid="${sc.uid}"]`);

    for (let i = 0; i < ev.scoring.length; i++) {
      const card = ev.scoring[i];
      const el = table.querySelector(`.pc[data-uid="${card.uid}"]`);
      if (debuff && card.suit === debuff) { pop(el, 'Bloqué', 'off'); await wait(350); continue; }
      const times = 1 + st.supers.reduce((n, sc) => n + (sc.retrigger ? sc.retrigger(card, i, ctx, sc) : 0), 0);
      for (let t = 0; t < times; t++) {
        if (t > 0) { pop(el, '¡Otra vez!', 'again'); await wait(260); }
        apply({ chips: Poker.chipsOf(card) }, el);
        await wait(300);
        for (const sc of st.supers) {
          if (sc.perCard && apply(sc.perCard(card, ctx, sc), scEl(sc))) await wait(300);
        }
      }
    }
    for (const sc of st.supers) {
      if (sc.afterHand && apply(sc.afterHand(ctx, sc), scEl(sc))) await wait(380);
    }

    const total = Math.floor(chips * mult);
    $('#h-name').innerHTML = `<b class="total">${fmt(total)}</b>`;
    await wait(500);
    st.score += total;
    const sEl = $('#h-score');
    sEl.textContent = fmt(st.score);
    sEl.classList.remove('bump'); void sEl.offsetWidth; sEl.classList.add('bump');
    await wait(500);
    table.innerHTML = '';
    refreshSupers();

    if (st.score >= st.target) return roundWon();
    if (st.hands <= 0) return gameOver();
    draw();
    st.busy = false;
    renderHand();
  }

  function discard() {
    const sel = selected();
    if (!sel.length || st.discards <= 0 || st.busy) return;
    st.hand = st.hand.filter(c => !st.sel.has(c.uid));
    st.sel.clear();
    st.discards--;
    st.supers.forEach(sc => sc.onDiscard && sc.onDiscard(sel.length, sc));
    $('#h-disc').textContent = st.discards;
    draw();
    renderHand();
    refreshSupers();
  }

  // ---------- end of round ----------
  function roundWon() {
    const t = TANDAS[st.tanda];
    const lines = [[`${t.n} gagnée`, t.reward]];
    if (st.hands) lines.push([`Mains restantes (${st.hands})`, st.hands]);
    const interest = Math.min(5, Math.floor(st.soles / 5));
    if (interest) lines.push(['Intérêts (1 par 5 Soles, max 5)', interest]);
    st.supers.forEach(sc => { const m = sc.endRound && sc.endRound(st, sc); if (m) lines.push([sc.card.n, m]); });
    const sum = lines.reduce((s, l) => s + l[1], 0);
    saveBest(st.noche);
    app().querySelector('.main').innerHTML = `<div class="cash">
      <h2 class="h">¡Ganaste!</h2>
      <p class="mute">Score ${fmt(st.score)} / ${fmt(st.target)}</p>
      <ul>${lines.map(l => `<li><span>${esc(l[0])}</span><b>S/ ${l[1]}</b></li>`).join('')}</ul>
      <button class="btn big amarillo" id="b-cash">Cobrar S/ ${sum}</button>
    </div>`;
    $('#b-cash').onclick = () => {
      st.soles += sum;
      if (st.tanda === 2 && st.noche === NOCHES) return victory();
      shop();
    };
  }

  function advance() {
    st.tanda++;
    if (st.tanda > 2) { st.tanda = 0; st.noche++; pickBoss(); }
    st.hands = undefined; st.discards = undefined; st.score = 0; st.target = 0;
    map();
  }

  // ---------- shop ----------
  function shop() {
    st.rerollCost = 5;
    st.offers = rollOffers();
    st.cumbias = Poker.shuffle(Poker.HANDS.slice()).slice(0, 2).map(h => ({ h, sold: false }));
    shopScreen();
  }
  function rollOffers() {
    const owned = new Set(st.supers.map(sc => sc.card.id));
    const out = [];
    for (let i = 0; i < 3; i++) {
      const c = Supers.rollCard(DB.cards, new Set([...owned, ...out.map(o => o.card.id)]));
      out.push(Supers.make(c, seriesOf(c)));
    }
    return out;
  }

  function shopScreen() {
    app().innerHTML = `<section class="screen shop">
      ${hud()}
      <div class="main">
        ${supersRow()}
        <div class="bodega">
          <div class="bodega-h"><h2 class="h">La Bodega</h2>
            <div class="acts"><button class="btn verde" id="b-reroll">Relancer S/ ${st.rerollCost}</button><button class="btn rosa" id="b-next">Tanda suivante →</button></div></div>
          <div class="offers">${st.offers.map((sc, i) => sc ? `<div class="offer">${superHTML(sc)}
              <button class="btn sm amarillo" data-buy="${i}">Recruter S/ ${sc.price}</button></div>` : '<div class="offer sold">Vendu</div>').join('')}</div>
          <div class="cumbias">${st.cumbias.map((o, i) => {
            const v = handValue(o.h);
            return `<div class="cumbia${o.sold ? ' sold' : ''}"><small>Cumbia</small><b>${o.h.n}</b><span>niv. ${levelOf(o.h.id)} → ${levelOf(o.h.id) + 1}</span>
              <span><i class="chips">+${o.h.lc}</i> <i class="mult">+${o.h.lm} Mult</i></span>
              <em>actuel ${v.chips} × ${v.mult}</em>
              ${o.sold ? '<span class="stamp">Pasó</span>' : `<button class="btn sm amarillo" data-cum="${i}">S/ 3</button>`}</div>`;
          }).join('')}</div>
        </div>
      </div>
    </section>`;
    $('#h-levels').onclick = levelsModal;
    $('#b-next').onclick = advance;
    $('#b-reroll').disabled = st.soles < st.rerollCost;
    $('#b-reroll').onclick = () => {
      if (st.soles < st.rerollCost) return;
      st.soles -= st.rerollCost; st.rerollCost++;
      st.offers = rollOffers();
      shopScreen();
    };
    app().querySelectorAll('[data-buy]').forEach(b => {
      const sc = st.offers[+b.dataset.buy];
      b.disabled = st.soles < sc.price || st.supers.length >= st.maxSupers;
      if (st.supers.length >= st.maxSupers) b.textContent = 'Plus de place';
      b.onclick = () => {
        st.soles -= sc.price;
        st.supers.push(sc);
        st.offers[+b.dataset.buy] = null;
        toast(`${sc.card.n} rejoint ta bande`);
        shopScreen();
      };
    });
    app().querySelectorAll('[data-cum]').forEach(b => {
      const o = st.cumbias[+b.dataset.cum];
      b.disabled = st.soles < 3;
      b.onclick = () => {
        st.soles -= 3;
        st.levels[o.h.id] = levelOf(o.h.id) + 1;
        o.sold = true;
        toast(`${o.h.n} passe au niveau ${levelOf(o.h.id)}`);
        shopScreen();
      };
    });
    wireFlip(app().querySelector('.offers'));
    wireSupers();
  }

  // ---------- end screens ----------
  function gameOver() {
    saveBest(st.noche - (st.tanda === 0 ? 1 : 0));
    app().querySelector('.main').innerHTML = `<div class="cash over">
      <h2 class="h">Se acabó la fiesta</h2>
      <p>Score ${fmt(st.score)} / ${fmt(st.target)} · Noche ${st.noche}, ${TANDAS[st.tanda].n}</p>
      <div class="acts"><button class="btn big rosa" id="b-again">Rejouer</button><button class="btn" id="b-home">Accueil</button></div>
    </div>`;
    $('#b-again').onclick = newRun;
    $('#b-home').onclick = title;
  }

  function victory() {
    saveBest(NOCHES);
    app().innerHTML = `<section class="screen title win">
      <div class="stripes" aria-hidden="true"></div>
      ${logo(true)}
      <h2 class="h">¡Campeón de la noche!</h2>
      <p class="tag">Tu as survécu aux ${NOCHES} noches avec ta bande :</p>
      <div class="fan">${st.supers.map((sc, i) => `<div style="--i:${i - (st.supers.length - 1) / 2}">${superHTML(sc)}</div>`).join('')}</div>
      <div class="acts"><button class="btn big rosa" id="b-again">Rejouer</button><button class="btn" id="b-home">Accueil</button></div>
    </section>`;
    $('#b-again').onclick = newRun;
    $('#b-home').onclick = title;
    wireFlip(app());
  }

  // ---------- boot ----------
  async function boot() {
    app().innerHTML = `<section class="screen title">${logo(true)}<p class="tag">Chargement des cartes…</p></section>`;
    const d = await ChichaData.load();
    DB = d;
    if (!DB.cards.length) DB.cards = (window.CHICHA_BASE || {}).cards || [];
    title();
  }

  document.addEventListener('keydown', e => {
    if (e.key === 'f' && e.altKey) { SPEED = SPEED === 1 ? 2.5 : 1; toast(SPEED > 1 ? 'Animations rapides' : 'Animations normales'); }
  });

  // Debug from the console: ChichaGame.state(), ChichaGame.give(soles)
  window.ChichaGame = { boot, state: () => st, give: n => { if (st) { st.soles += n; refreshSupers(); } } };
  boot();
})();
