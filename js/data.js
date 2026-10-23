/* Loads the CHICHA TCG cards from Supabase.
   The cards live in table `game` (row id 1, column `data`), the same way the TCG stores them:
   all cards = base set (minus removed, with overrides) + cards added by the admin.
   Reading that row needs either a public read policy or a signed-in TCG account.
   Without either, the game falls back to the base set bundled in data/base-cards.js. */
(function () {
  const SB_URL = 'https://spqzemkmgjwmrrqpxzvh.supabase.co';
  const SB_KEY = 'sb_publishable_4WCnVSnLD42uiH8iXsUe8A_X43xpJat'; // publishable key: safe in the browser
  const STORAGE = SB_URL + '/storage/v1/object/public/cards/';

  const base = window.CHICHA_BASE || { series: [], cards: [] };
  let sb = null;
  try { if (window.supabase) sb = window.supabase.createClient(SB_URL, SB_KEY); } catch (e) { sb = null; }

  // Same merge rule as the TCG.
  function merge(d) {
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

  // Cards kept in the game:
  // - they need a name and an illustration (photo or video)
  // - in the "Legendary Pokemon" series, only the unique cards (limit 1, like "Giratina de Hoshi")
  function usable(c, series) {
    if (!c || !c.id || !c.n || !c.img) return false;
    const s = series.find(x => x.id === c.s);
    if (s && /legendary pok/i.test(s.n || '') && +c.lim !== 1) return false;
    return true;
  }

  async function fetchGame() {
    if (!sb) return null;
    const r = await sb.from('game').select('data').eq('id', 1).maybeSingle();
    if (r.error || !r.data || !r.data.data) return null;
    return r.data.data;
  }

  async function load() {
    let source = 'base', data = null, user = null;
    try {
      if (sb) {
        const s = await sb.auth.getSession();
        user = s.data && s.data.session ? s.data.session.user : null;
      }
      data = await fetchGame();
      if (data) source = 'supabase';
    } catch (e) { console.warn('Supabase indisponible', e); }
    const m = merge(data);
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

  // Photo for a card: the TCG stores a URL (or data URL) in `img`.
  function photo(c) {
    if (!c) return '';
    if (c.img) return c.img.startsWith('http') || c.img.startsWith('data:') ? c.img : STORAGE + c.img;
    return '';
  }

  window.ChichaData = { load, signIn, signOut, photo, STORAGE };
})();
