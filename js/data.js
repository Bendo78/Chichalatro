/* Loads the cards from Supabase.
   Two possible sources, tried in this order:
   1. the clean game database (tables `cards` and `series`, created by supabase/schema.sql)
   2. the old CHICHA TCG data (table `game`, row id 1), kept for compatibility
   Without either one, the game falls back to the base set bundled in data/base-cards.js.
   The project address and public key are in js/config.js. */
(function () {
  const CFG = window.CHICHA_CONFIG || {};
  const SB_URL = CFG.url;
  const SB_KEY = CFG.key; // publishable key: safe in the browser
  const STORAGE = SB_URL + '/storage/v1/object/public/cards/';

  const base = window.CHICHA_BASE || { series: [], cards: [] };
  let sb = null;
  try { if (window.supabase && SB_URL && SB_KEY) sb = window.supabase.createClient(SB_URL, SB_KEY); } catch (e) { sb = null; }

  // Old TCG format: base set (minus removed, with overrides) + cards added by the admin.
  function mergeOld(d) {
    d = d || {};
    const rm = d.rm || [], ov = d.ov || {}, mv = d.mv || {};
    const cards = base.cards.filter(c => !rm.includes(c.id)).map(c => {
      let r = ov[c.id] ? Object.assign({}, ov[c.id], { id: c.id }) : c;
      if (mv[c.id]) r = Object.assign({}, r, { s: mv[c.id] });
      return r;
    }).concat(d.cards || []);
    const series = base.series.concat(d.series || []);
    return { cards, series, backs: d.back || {} };
  }

  // Clean format (tables cards + series) -> the internal card shape used by the game.
  function fromClean(rows, srows) {
    const series = srows.map(s => ({ id: s.id, code: s.code, n: s.name, c1: s.color1, c2: s.color2 }));
    const backs = {};
    srows.forEach(s => { if (s.back_image) backs[s.id] = photo({ img: s.back_image }); });
    const cards = rows.map(r => ({
      id: r.id, s: r.series_id, n: r.name, r: r.rarity, t: r.type, pv: r.hp, an: r.attack_name, a: r.attack,
      f: r.description, img: r.image, img2: r.image2, fx: r.frame_x, fy: r.frame_y, fz: r.frame_zoom,
      lim: r.card_limit, n2: r.name2, duo: r.duo
    }));
    return { cards, series, backs };
  }

  // Cards kept in the game:
  // - they need a name and an illustration (photo or video)
  // - in the "Legendary Pokemon" series, only the unique cards (limit 1, like "Giratina de Hoshi")
  function usable(c, series) {
    if (!c || !c.id || !c.n || !c.img) return false;
    const s = series.find(x => x.id === c.s);
    if (s && /legendary pok/i.test(s.n || '') && +c.lim !== 1) return false;
    return true;
  }

  async function fetchClean() {
    if (!sb) return null;
    const [c, s] = await Promise.all([
      sb.from('cards').select('*').order('sort', { ascending: true }),
      sb.from('series').select('*')
    ]);
    if (c.error || s.error || !c.data || !c.data.length) return null;
    return fromClean(c.data, s.data || []);
  }
  async function fetchOld() {
    if (!sb) return null;
    const r = await sb.from('game').select('data').eq('id', 1).maybeSingle();
    if (r.error || !r.data || !r.data.data) return null;
    return mergeOld(r.data.data);
  }

  async function load() {
    let source = 'base', m = null, user = null;
    try {
      if (sb) {
        const s = await sb.auth.getSession();
        user = s.data && s.data.session ? s.data.session.user : null;
      }
      m = await fetchClean();
      if (m) source = 'supabase';
      else { m = await fetchOld(); if (m) source = 'supabase'; }
    } catch (e) { console.warn('Supabase indisponible', e); }
    if (!m) m = mergeOld(null);
    m.cards = m.cards.filter(c => usable(c, m.series));
    return { source, user, online: !!sb, ...m };
  }

  async function signIn(email, password) {
    if (!sb) throw new Error('Supabase non chargé');
    const r = await sb.auth.signInWithPassword({ email, password });
    if (r.error) throw r.error;
    return r.data.user;
  }
  async function signOut() { if (sb) await sb.auth.signOut(); }

  // Photo for a card: a full URL, a data URL, or a file name in the "cards" bucket.
  function photo(c) {
    if (!c || !c.img) return '';
    return c.img.startsWith('http') || c.img.startsWith('data:') ? c.img : STORAGE + encodeURIComponent(c.img);
  }

  window.ChichaData = { load, signIn, signOut, photo, STORAGE, client: () => sb };
})();
