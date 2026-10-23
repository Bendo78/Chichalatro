/* Online save: progress (achievements, unlocked cards and decks, stats, skin…) is stored in Supabase,
   table chichalatro_players, under the player's pseudo. No password: typing the same pseudo on any
   device brings the same progress back. The last pseudo used is remembered on this device. */
(function () {
  const TABLE = 'chichalatro_players';
  const LAST = 'chichalatro-pseudo';
  let pseudo = null, timer = null, pending = false, status = 'off';
  const listeners = [];
  const setStatus = s => { status = s; listeners.forEach(fn => fn(s)); };

  // "Jean Dupont!" -> "jean-dupont"
  function normalize(p) {
    return String(p || '').trim().toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/\s+/g, '-').replace(/[^a-z0-9_-]/g, '').slice(0, 20);
  }
  const valid = p => /^[a-z0-9_-]{3,20}$/.test(p);
  const db = () => ChichaData.client && ChichaData.client();

  async function fetchSave(p) {
    const r = await db().from(TABLE).select('data').eq('pseudo', p).maybeSingle();
    if (r.error) throw r.error;
    return r.data ? r.data.data : null;
  }
  async function push() {
    if (!pseudo || !db()) return;
    pending = false;
    setStatus('saving');
    const r = await db().from(TABLE).upsert({ pseudo, data: Meta.data, updated_at: new Date().toISOString() });
    setStatus(r.error ? 'error' : 'ok');
    if (r.error) console.warn('Sauvegarde en ligne impossible', r.error);
  }
  function schedule() {
    if (!pseudo) return;
    pending = true;
    clearTimeout(timer);
    timer = setTimeout(push, 1500);
  }

  /** Link this device to a pseudo. Returns 'loaded' (existing save) or 'created' (new save with the current progress). */
  async function login(raw) {
    const p = normalize(raw);
    if (!valid(p)) throw new Error('Le pseudo doit faire 3 à 20 caractères : lettres, chiffres, - ou _');
    if (!db()) throw new Error('Connexion au serveur impossible');
    setStatus('saving');
    let remote;
    try { remote = await fetchSave(p); }
    catch (e) {
      setStatus(pseudo ? 'error' : 'off');
      const missing = /schema cache|does not exist|relation/i.test(e.message || '');
      throw new Error(missing ? 'La sauvegarde en ligne n\'est pas encore activée sur le serveur (table chichalatro_players manquante).' : 'Serveur injoignable, réessaie plus tard.');
    }
    pseudo = p;
    try { localStorage.setItem(LAST, p); } catch (e) { }
    if (remote) { Meta.load(remote); setStatus('ok'); return 'loaded'; }
    await push();
    return 'created';
  }
  function logout() {
    clearTimeout(timer);
    pseudo = null;
    try { localStorage.removeItem(LAST); } catch (e) { }
    setStatus('off');
  }
  // Called at start: reconnects the last pseudo used on this device.
  async function resume() {
    let p = null;
    try { p = localStorage.getItem(LAST); } catch (e) { }
    if (!p) return null;
    try { await login(p); return p; } catch (e) { setStatus('error'); pseudo = p; return p; }
  }

  Meta.onSave(schedule);
  // Save right away when the page is hidden or closed.
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden' && pending) push(); });
  window.addEventListener('pagehide', () => { if (pending) push(); });

  window.Cloud = {
    login, logout, resume, normalize,
    get pseudo() { return pseudo; },
    get status() { return status; },
    onStatus: fn => listeners.push(fn),
    saveNow: push
  };
})();
