/* Sound effects and music, synthesized with Web Audio.
   Music: two original funk / breakbeat tracks (menu and game). If audio files exist at
   music/menu.mp3 and music/game.mp3 (your own files), they are played instead. */
(function () {
  let ctx = null, master = null, sfxBus = null, musBus = null;
  const prefs = load();
  function load() {
    try { return Object.assign({ sfx: true, music: true, vol: 0.7 }, JSON.parse(localStorage.getItem('chichalatro-audio') || '{}')); }
    catch (e) { return { sfx: true, music: true, vol: 0.7 }; }
  }
  function save() { try { localStorage.setItem('chichalatro-audio', JSON.stringify(prefs)); } catch (e) { } }

  // Audio can only start after a click or key press.
  function ensure() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return true; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = prefs.vol; master.connect(ctx.destination);
    sfxBus = ctx.createGain(); sfxBus.gain.value = prefs.sfx ? 1 : 0; sfxBus.connect(master);
    musBus = ctx.createGain(); musBus.gain.value = prefs.music ? 0.34 : 0; musBus.connect(master);
    if (prefs.music) Music.start();
    return true;
  }
  ['pointerdown', 'keydown'].forEach(ev => window.addEventListener(ev, ensure, { capture: true }));

  // ---------- building blocks ----------
  function tone(o) {
    if (!ctx) return;
    const t = ctx.currentTime + (o.delay || 0);
    const osc = ctx.createOscillator(), g = ctx.createGain();
    osc.type = o.type || 'square';
    osc.frequency.setValueAtTime(o.f || 440, t);
    if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t + (o.slide || o.dur || .1));
    const v = o.vol == null ? .15 : o.vol, dur = o.dur || .1;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(v, t + (o.attack || .004));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    let node = osc;
    if (o.lp) {
      const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.Q.value = o.q || 1;
      f.frequency.setValueAtTime(o.lp, t);
      if (o.lpTo) f.frequency.exponentialRampToValueAtTime(o.lpTo, t + dur);
      osc.connect(f); node = f;
    }
    node.connect(g); g.connect(o.bus || sfxBus);
    osc.start(t); osc.stop(t + dur + .02);
  }
  let noiseBuf = null;
  function noise(o) {
    if (!ctx) return;
    if (!noiseBuf) {
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    const t = ctx.currentTime + (o.delay || 0), dur = o.dur || .06;
    const src = ctx.createBufferSource(); src.buffer = noiseBuf;
    const f = ctx.createBiquadFilter(); f.type = o.ft || 'bandpass'; f.Q.value = o.q || 1;
    f.frequency.setValueAtTime(o.f || 3000, t);
    if (o.sweep) o.sweep.forEach(([fr, at]) => f.frequency.exponentialRampToValueAtTime(fr, t + at));
    const g = ctx.createGain();
    g.gain.setValueAtTime(o.vol || .2, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(o.bus || sfxBus);
    src.start(t, Math.random() * .5); src.stop(t + dur + .02);
  }
  const semi = (f, n) => f * Math.pow(2, n / 12);
  const PENTA = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24, 26, 28, 31];

  // ---------- named sounds ----------
  let lastHover = 0;
  const S = {
    click: () => { tone({ f: 660, dur: .05, vol: .12 }); tone({ f: 990, dur: .04, vol: .08, delay: .03 }); },
    hover: () => { const n = performance.now(); if (n - lastHover < 60) return; lastHover = n; tone({ f: 1500, type: 'sine', dur: .025, vol: .04 }); },
    select: () => tone({ f: 520, to: 820, type: 'triangle', dur: .08, vol: .16 }),
    deselect: () => tone({ f: 620, to: 400, type: 'triangle', dur: .07, vol: .12 }),
    deal: () => { noise({ f: 4200, q: .8, dur: .045, vol: .22 }); tone({ f: 1800, type: 'sine', dur: .02, vol: .03 }); },
    slide: () => noise({ f: 2200, q: .6, dur: .09, vol: .14 }),
    flip: () => { noise({ f: 6000, ft: 'highpass', dur: .05, vol: .12 }); tone({ f: 900, type: 'sine', dur: .04, vol: .05 }); },
    chip: n => tone({ f: semi(392, PENTA[Math.min(n || 0, PENTA.length - 1)]), type: 'square', dur: .07, vol: .1, lp: 3000 }),
    mult: n => { tone({ f: semi(196, PENTA[Math.min(n || 0, PENTA.length - 1)]), type: 'sawtooth', dur: .12, vol: .12, lp: 1800 }); noise({ f: 1500, dur: .05, vol: .06 }); },
    xmult: () => { [0, 4, 7, 12].forEach((s, i) => tone({ f: semi(220, s), type: 'sawtooth', dur: .35, vol: .07, lp: 2600, delay: i * .025 })); noise({ f: 800, q: .5, dur: .25, vol: .12 }); },
    money: () => { tone({ f: 1318, type: 'sine', dur: .07, vol: .12 }); tone({ f: 1760, type: 'sine', dur: .12, vol: .12, delay: .06 }); },
    total: () => { tone({ f: 220, to: 880, type: 'sawtooth', dur: .3, vol: .08, lp: 2000 }); noise({ f: 1200, q: .4, dur: .3, vol: .08 }); },
    score: () => { tone({ f: 523, type: 'square', dur: .06, vol: .07, lp: 2500 }); },
    win: () => [0, 4, 7, 12, 16].forEach((s, i) => { tone({ f: semi(523, s), type: 'triangle', dur: .22, vol: .14, delay: i * .08 }); tone({ f: semi(1046, s), type: 'sine', dur: .1, vol: .05, delay: i * .08 }); }),
    lose: () => [0, -3, -6, -10].forEach((s, i) => tone({ f: semi(330, s), type: 'sawtooth', dur: .3, vol: .1, lp: 1200, delay: i * .18 })),
    buy: () => { S.money(); tone({ f: 300, to: 900, type: 'square', dur: .1, vol: .07, delay: .05, lp: 2000 }); },
    sell: () => { tone({ f: 900, to: 400, type: 'square', dur: .12, vol: .07, lp: 2000 }); S.money(); },
    shuffle: () => { for (let i = 0; i < 7; i++) noise({ f: 3500 + Math.random() * 1500, q: .8, dur: .04, vol: .14, delay: i * .045 }); },
    boss: () => { tone({ f: 70, to: 45, type: 'sine', dur: .6, vol: .4 }); noise({ f: 300, q: .3, dur: .5, vol: .15 }); tone({ f: 233, type: 'sawtooth', dur: .8, vol: .05, lp: 900, delay: .05 }); },
    achieve: () => [0, 7, 12, 16, 19, 24].forEach((s, i) => tone({ f: semi(659, s), type: 'square', dur: .12, vol: .07, lp: 3500, delay: i * .06 })),
    level: () => [0, 5, 9, 12].forEach((s, i) => tone({ f: semi(440, s), type: 'triangle', dur: .15, vol: .12, delay: i * .05 })),
    again: () => tone({ f: 700, to: 1400, type: 'triangle', dur: .12, vol: .1 })
  };
  function play(name, arg) { if (!ctx || !prefs.sfx) return; try { S[name] && S[name](arg); } catch (e) { } }

  // ---------- music ----------
  const mf = m => 440 * Math.pow(2, (m - 69) / 12);
  const at = (arr, s) => arr.indexOf(s) >= 0;

  // Drum kit
  const kick = (d, v) => { tone({ f: 130, to: 42, slide: .12, type: 'sine', dur: .28, vol: .55 * (v || 1), delay: d, bus: musBus }); noise({ f: 900, q: .7, dur: .02, vol: .12, delay: d, bus: musBus }); };
  const snare = (d, v) => { noise({ f: 1900, q: .6, dur: .16, vol: .32 * (v || 1), delay: d, bus: musBus }); tone({ f: 200, to: 160, type: 'triangle', dur: .08, vol: .16 * (v || 1), delay: d, bus: musBus }); };
  const hat = (d, v, open) => noise({ f: 8500, ft: 'highpass', dur: open ? .18 : .035, vol: .1 * (v || 1), delay: d, bus: musBus });
  const scratch = (d, len) => noise({ f: 500, q: 4, dur: len, vol: .26, delay: d, bus: musBus, sweep: [[3200, len * .3], [600, len * .55], [2600, len * .8], [400, len]] });

  // Two original grooves, 32 sixteenth-steps each (2 bars).
  const TRACKS = {
    // Menu: punchy funk breakbeat in E dorian, slap bass, chord stabs, scratches, a hook every other loop.
    menu: {
      bpm: 106, root: 40, swing: 0,
      kick: [0, 3, 8, 10, 16, 22, 24, 27], snare: [4, 12, 20, 28], ghost: [7, 15, 23, 26, 31],
      hatOpen: [14, 30], hat16: [5, 13, 21, 29],
      bass: { 0: 0, 2: 12, 5: 10, 7: 0, 9: 3, 11: 5, 12: 7, 14: 5, 15: 3, 16: 0, 18: 12, 21: 10, 23: 7, 26: 5, 28: 3, 30: 2 },
      stabs: { 6: [24, 27, 31, 34, 38], 14: [24, 27, 31, 34, 38], 22: [29, 33, 36, 39, 43], 26: [29, 33, 36, 39, 43] },
      lead: { 0: 24, 3: 22, 6: 19, 8: 17, 10: 19, 14: 15, 16: 12, 19: 15, 22: 17, 24: 19, 27: 22, 30: 24 },
      scratchAt: [28]
    },
    // Game: laid-back groove in A minor, swung hats, warm electric-piano chords, softer bass.
    game: {
      bpm: 94, root: 33, swing: .16,
      kick: [0, 7, 10, 16, 23, 26], snare: [4, 12, 20, 28], ghost: [15, 31],
      hatOpen: [30], hat16: [],
      bass: { 0: 12, 3: 19, 6: 22, 8: 24, 11: 22, 13: 19, 16: 17, 19: 24, 22: 22, 24: 19, 26: 17, 28: 15, 30: 14 },
      pads: { 0: [36, 39, 43, 46, 50], 16: [41, 44, 48, 51, 55] },
      lead: null,
      scratchAt: []
    }
  };

  const Music = (function () {
    let timer = null, next = 0, step = 0, cur = 'menu', loop = 0;
    let audioEl = null, fileFor = {};

    function schedule() {
      const T = TRACKS[cur], STEP = 60 / T.bpm / 4;
      while (next < ctx.currentTime + .12) {
        const s = step % 32, d = Math.max(0, next - ctx.currentTime) + (s % 2 ? T.swing * STEP : 0);
        if (s === 0) loop++;
        if (at(T.kick, s)) kick(d);
        if (at(T.snare, s)) snare(d);
        if (at(T.ghost, s)) snare(d, .28);
        if (s % 2 === 0) hat(d, s % 4 === 2 ? 1 : .6, at(T.hatOpen, s));
        else if (at(T.hat16, s)) hat(d, .45);
        if (T.bass[s] != null) {
          const f = mf(T.root + T.bass[s]);
          tone({ f, type: 'sawtooth', dur: STEP * 1.7, vol: .22, lp: 1700, lpTo: 260, q: 6, delay: d, bus: musBus });
          tone({ f: f / 2, type: 'sine', dur: STEP * 1.7, vol: .2, delay: d, bus: musBus });
        }
        if (T.stabs && T.stabs[s]) T.stabs[s].forEach(n => tone({ f: mf(T.root + n), type: 'square', dur: STEP * 1.1, vol: .028, lp: 2400, lpTo: 900, delay: d, bus: musBus }));
        if (T.pads && T.pads[s]) T.pads[s].forEach(n => {
          tone({ f: mf(T.root + n), type: 'sine', dur: STEP * 14, vol: .05, attack: .02, delay: d, bus: musBus });
          tone({ f: mf(T.root + n + 12), type: 'triangle', dur: STEP * 3, vol: .015, delay: d, bus: musBus });
        });
        if (T.lead && loop % 2 === 0 && T.lead[s] != null) tone({ f: mf(T.root + 24 + T.lead[s]), type: 'square', dur: STEP * 1.6, vol: .035, lp: 3000, delay: d, bus: musBus });
        if (loop % 4 === 3 && at(T.scratchAt, s)) { scratch(d, STEP * 1.6); scratch(d + STEP * 2, STEP * 1.2); }
        if (cur === 'game' && s % 8 === 0) noise({ f: 3000, q: .3, dur: .05, vol: .015, delay: d + Math.random() * STEP * 4, bus: musBus });
        next += STEP; step++;
      }
    }

    // Your own files. music/playlist.json lists them: { "menu": [...], "game": [...] }.
    // Without a playlist, music/menu.mp3 and music/game.mp3 are tried. Without files, the synth plays.
    let playlist = null, queue = { menu: [], game: [] }, lastPlayed = { menu: null, game: null };
    async function loadPlaylist() {
      if (playlist) return playlist;
      playlist = { menu: [], game: [] };
      try {
        const r = await fetch('music/playlist.json', { cache: 'no-store' });
        if (r.ok) { const j = await r.json(); ['menu', 'game'].forEach(k => { if (Array.isArray(j[k])) playlist[k] = j[k].map(f => 'music/' + f); }); }
      } catch (e) { }
      for (const name of ['menu', 'game']) {
        if (playlist[name].length) continue;
        for (const ext of ['mp3', 'ogg', 'm4a']) {
          try {
            const r = await fetch(`music/${name}.${ext}`, { method: 'HEAD', cache: 'no-store' });
            if (r.ok && !(r.headers.get('content-type') || '').includes('text/html')) { playlist[name] = [`music/${name}.${ext}`]; break; }
          } catch (e) { }
        }
      }
      return playlist;
    }
    // Menu: plays its songs in order. Game: shuffled, never the same song twice in a row.
    function nextSong(name) {
      const list = playlist[name];
      if (!list.length) return null;
      if (!queue[name].length) {
        queue[name] = name === 'menu' ? list.slice() : list.slice().sort(() => Math.random() - .5);
        if (queue[name].length > 1 && queue[name][0] === lastPlayed[name]) queue[name].push(queue[name].shift());
      }
      lastPlayed[name] = queue[name].shift();
      return lastPlayed[name];
    }
    function stopSynth() { clearInterval(timer); timer = null; }
    function stopFile() { if (audioEl) { audioEl.onended = null; audioEl.pause(); audioEl = null; } }
    function fileVolume() { return prefs.music ? Math.min(1, prefs.vol * .7) : 0; }
    function playFile(name) {
      const file = nextSong(name);
      if (!file) return false;
      stopFile();
      audioEl = new Audio(file);
      audioEl.dataset.track = name;
      audioEl.volume = fileVolume();
      audioEl.onended = () => { if (cur === name && prefs.music) playFile(name); };
      audioEl.play().catch(() => { });
      return true;
    }

    async function start() {
      if (!ctx || !prefs.music) return;
      const want = cur;
      await loadPlaylist();
      if (want !== cur || !prefs.music) return;
      if (playlist[want].length) {
        stopSynth();
        if (audioEl && audioEl.dataset.track === want && !audioEl.paused) return;
        playFile(want);
      } else {
        stopFile();
        if (timer) return;
        next = ctx.currentTime + .08; step = 0; loop = 0;
        timer = setInterval(schedule, 25);
      }
    }
    return {
      start,
      stop() { stopSynth(); stopFile(); },
      track(name) {
        if (!TRACKS[name] || name === cur) return;
        cur = name;
        stopSynth();
        if (ctx && prefs.music) start();
      },
      volume() { if (audioEl) audioEl.volume = fileVolume(); }
    };
  })();

  function set(k, v) {
    prefs[k] = v; save();
    if (!ctx) return;
    if (k === 'vol') { master.gain.value = v; Music.volume(); }
    if (k === 'sfx') sfxBus.gain.value = v ? 1 : 0;
    if (k === 'music') { musBus.gain.value = v ? .34 : 0; v ? Music.start() : Music.stop(); }
  }

  window.Sfx = { play, set, prefs, ensure, track: n => Music.track(n) };
})();
