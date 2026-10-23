/* Sound effects and a small cumbia loop, all synthesized with Web Audio (no audio files). */
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
    musBus = ctx.createGain(); musBus.gain.value = prefs.music ? 0.32 : 0; musBus.connect(master);
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
    if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t + (o.dur || .1));
    const v = o.vol == null ? .15 : o.vol, dur = o.dur || .1;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(v, t + (o.attack || .004));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    let node = osc;
    if (o.lp) { const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = o.lp; osc.connect(f); node = f; }
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
    const f = ctx.createBiquadFilter(); f.type = o.ft || 'bandpass'; f.frequency.value = o.f || 3000; f.Q.value = o.q || 1;
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

  // ---------- music: a simple chicha-style cumbia loop (Am · G · F · E) ----------
  const Music = (function () {
    const BPM = 96, STEP = 60 / BPM / 4; // 16th notes
    const CHORDS = [[57, 60, 64], [55, 59, 62], [53, 57, 60], [52, 56, 59]]; // Am G F E (MIDI)
    const BASS = [45, 43, 41, 40];
    const LEAD = [76, 74, 72, 71, 72, 74, 76, 79, 77, 76, 74, 72, 71, 68, 69, 71];
    let timer = null, next = 0, step = 0;
    const mf = m => 440 * Math.pow(2, (m - 69) / 12);
    function schedule() {
      while (next < ctx.currentTime + .12) {
        const bar = Math.floor(step / 16) % 4, s = step % 16, d = next - ctx.currentTime;
        // güiro: long scrape on beats, short scrapes on the "and"
        if (s % 4 === 0) noise({ f: 5200, q: 2, dur: STEP * 1.6, vol: .1, delay: d, bus: musBus });
        if (s % 4 === 2 || s % 4 === 3) noise({ f: 5600, q: 2, dur: STEP * .5, vol: .07, delay: d, bus: musBus });
        // bass: root on 1, fifth on 3
        if (s === 0 || s === 8) tone({ f: mf(BASS[bar] + (s === 8 ? 7 : 0)), type: 'triangle', dur: STEP * 3, vol: .28, delay: d, bus: musBus });
        if (s === 6 || s === 14) tone({ f: mf(BASS[bar] + 12), type: 'triangle', dur: STEP * 1.2, vol: .14, delay: d, bus: musBus });
        // organ stabs on the off-beats
        if (s % 4 === 2) CHORDS[bar].forEach(m => tone({ f: mf(m + 12), type: 'square', dur: STEP * .9, vol: .03, lp: 1800, delay: d, bus: musBus }));
        // conga
        if (s === 4 || s === 12) tone({ f: 180, to: 120, type: 'sine', dur: .12, vol: .22, delay: d, bus: musBus });
        if (s === 7 || s === 15) tone({ f: 260, to: 200, type: 'sine', dur: .08, vol: .14, delay: d, bus: musBus });
        // surf-guitar style lead every other loop
        if (Math.floor(step / 64) % 2 === 1 && s % 2 === 0) {
          const m = LEAD[(bar * 4 + s / 2) % LEAD.length];
          if ((s / 2) % 4 !== 3) tone({ f: mf(m), type: 'sawtooth', dur: STEP * 1.8, vol: .035, lp: 2200, delay: d, bus: musBus });
        }
        next += STEP; step++;
      }
    }
    return {
      start() { if (!ctx || timer) return; next = ctx.currentTime + .05; timer = setInterval(schedule, 25); },
      stop() { clearInterval(timer); timer = null; }
    };
  })();

  function set(k, v) {
    prefs[k] = v; save();
    if (!ctx) return;
    if (k === 'vol') master.gain.value = v;
    if (k === 'sfx') sfxBus.gain.value = v ? 1 : 0;
    if (k === 'music') { musBus.gain.value = v ? .32 : 0; v ? Music.start() : Music.stop(); }
  }

  window.Sfx = { play, set, prefs, ensure };
})();
