// Synchronisation PC / téléphone via un fichier progress.json dans un dépôt GitHub privé.
// Chaque appareil garde ses propres compteurs de temps (additionnés à l'affichage) ;
// cartes, points faibles et erreurs sont fusionnés en gardant la version la plus récente.
(function (global) {
  // Jeton et identifiant d'appareil communs aux apps de langues ; un fichier de progression par langue
  const CFG_KEY = 'applangues-sync';
  const DEV_KEY = 'applangues-device';
  const FILE = LANG.syncFile;
  // Reprise des réglages de la première version (app d'espagnol seule)
  for (const [oldK, newK] of [['hablemos-sync', CFG_KEY], ['hablemos-device', DEV_KEY]]) {
    const old = localStorage.getItem(oldK);
    if (old && !localStorage.getItem(newK)) localStorage.setItem(newK, old);
  }
  const API = 'https://api.github.com';

  function cfg() { try { return JSON.parse(localStorage.getItem(CFG_KEY)) || {}; } catch (e) { return {}; } }
  function setCfg(c) { localStorage.setItem(CFG_KEY, JSON.stringify(c)); }
  function deviceId() {
    let id = localStorage.getItem(DEV_KEY);
    if (!id) { id = Math.random().toString(36).slice(2, 10); localStorage.setItem(DEV_KEY, id); }
    return id;
  }
  function deviceName() {
    const ua = navigator.userAgent;
    return /iPhone|iPad/.test(ua) ? 'iPhone' : /Android/.test(ua) ? 'Android' : /Windows/.test(ua) ? 'PC Windows' : /Mac/.test(ua) ? 'Mac' : 'Appareil';
  }

  // ---------- Fusion (fonctions pures, testables) ----------
  const newer = (a, b, k) => ((b && b[k]) || 0) > ((a && a[k]) || 0) ? b : a;
  function mergeMap(a = {}, b = {}, k) {
    const out = { ...a };
    for (const [id, v] of Object.entries(b)) out[id] = out[id] ? newer(out[id], v, k) : v;
    return out;
  }
  function maxDay(a, b) {
    if (!a) return b; if (!b) return a;
    const m = structuredClone(a);
    for (const k of ['vocab', 'gram', 'conv']) m.min[k] = Math.max(a.min[k] || 0, (b.min && b.min[k]) || 0);
    for (const k of ['speakSec', 'requests', 'cards', 'exercises', 'msgs', 'newCards']) m[k] = Math.max(a[k] || 0, b[k] || 0);
    m.skip = !!(a.skip || b.skip);
    return m;
  }
  function mergeDays(a = {}, b = {}) {
    const out = { ...a };
    for (const [d, v] of Object.entries(b)) out[d] = maxDay(out[d], v);
    return out;
  }

  // Applique le contenu distant à l'état local
  function mergeInto(local, remote, myId, sharedPrefs) {
    const s = structuredClone(local);
    const sh = remote.shared || {};
    s.cards = mergeMap(s.cards, sh.cards, 't');
    s.topics = mergeMap(s.topics, sh.topics, 'ts');
    s.conj = { tenses: mergeMap(s.conj.tenses, sh.conj && sh.conj.tenses, 'ts'), verbs: mergeMap(s.conj.verbs, sh.conj && sh.conj.verbs, 'ts') };
    const ids = new Set(s.custom.map(c => c.id));
    (sh.custom || []).forEach(c => { if (!ids.has(c.id)) { s.custom.push(c); ids.add(c.id); } });
    const ekey = e => `${e.date}|${e.original}|${e.corrected}`;
    const seen = new Set(s.errors.map(ekey));
    (sh.errors || []).forEach(e => { if (!seen.has(ekey(e))) { s.errors.push(e); seen.add(ekey(e)); } });
    s.errors.sort((x, y) => (x.date < y.date ? -1 : x.date > y.date ? 1 : 0));
    if (s.errors.length > 500) s.errors = s.errors.slice(-500);
    if ((sh.prefsTs || 0) > (s.prefsTs || 0)) {
      s.prefsTs = sh.prefsTs;
      s.weakSelf = sh.weakSelf || [];
      for (const k of sharedPrefs) if (sh.prefs && sh.prefs[k] !== undefined) s.settings[k] = sh.prefs[k];
    }
    // Compteurs : ceux des autres appareils sont rangés à part, les miens fusionnés (cas d'un navigateur réinitialisé)
    s.peers = s.peers || {};
    for (const [id, dev] of Object.entries(remote.devices || {})) {
      if (id === myId) s.days = mergeDays(s.days, dev.days);
      else s.peers[id] = { name: dev.name, days: mergeDays((s.peers[id] || {}).days, dev.days) };
    }
    return s;
  }

  function buildRemote(state, prevRemote, myId, sharedPrefs, status) {
    const devices = { ...((prevRemote && prevRemote.devices) || {}) };
    for (const [id, p] of Object.entries(state.peers || {})) devices[id] = { name: p.name, days: mergeDays((devices[id] || {}).days, p.days) };
    devices[myId] = { name: deviceName(), days: state.days, ts: Date.now() };
    const prefs = {};
    for (const k of sharedPrefs) prefs[k] = state.settings[k];
    return {
      version: 1, updated: new Date().toISOString(), status,
      devices,
      shared: { cards: state.cards, topics: state.topics, conj: state.conj, custom: state.custom, errors: state.errors, weakSelf: state.weakSelf, prefs, prefsTs: state.prefsTs || 0 },
    };
  }

  // ---------- GitHub ----------
  function b64encode(str) {
    const bytes = new TextEncoder().encode(str);
    let bin = '';
    for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(bin);
  }
  function b64decode(b64) {
    const bin = atob(b64.replace(/\s/g, ''));
    return new TextDecoder().decode(Uint8Array.from(bin, c => c.charCodeAt(0)));
  }
  async function gh(path, opts = {}) {
    const c = cfg();
    const res = await fetch(`${API}/repos/${c.repo}/contents/${path}`, {
      ...opts,
      headers: { Authorization: 'Bearer ' + c.token, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', ...(opts.body ? { 'Content-Type': 'application/json' } : {}) },
      cache: 'no-store',
    });
    if (res.status === 404 && !opts.method) return null;
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { const e = new Error(data.message || res.statusText); e.status = res.status; throw e; }
    return data;
  }

  // ---------- Cycle de synchronisation ----------
  const st = { state: 'off', last: null, error: null, sha: null, remote: null, busy: false };
  const emit = () => global.dispatchEvent(new Event('sync-status'));
  function enabled() { const c = cfg(); return !!(c.token && c.repo); }

  async function pull() {
    const f = await gh(FILE);
    if (!f) { st.sha = null; st.remote = null; return false; }
    st.sha = f.sha;
    st.remote = JSON.parse(b64decode(f.content));
    const before = JSON.stringify(Store.state);
    const merged = mergeInto(Store.state, st.remote, deviceId(), Store.SHARED_PREFS);
    if (JSON.stringify(merged) !== before) { Store.replaceState(merged); return true; }
    return false;
  }

  async function push() {
    const body = buildRemote(Store.state, st.remote, deviceId(), Store.SHARED_PREFS, Store.statusObj());
    const res = await gh(FILE, { method: 'PUT', body: JSON.stringify({ message: `Progression ${Store.today()} (${deviceName()})`, content: b64encode(JSON.stringify(body)), ...(st.sha ? { sha: st.sha } : {}) }) });
    st.sha = res.content.sha; st.remote = body;
  }

  async function syncNow() {
    if (!enabled() || st.busy) return;
    st.busy = true; st.state = 'syncing'; emit();
    try {
      const changed = await pull();
      try { await push(); }
      catch (e) {
        // Un autre appareil a écrit entre-temps : on refusionne puis on réessaie une fois
        if (e.status === 409 || e.status === 422) { await pull(); await push(); } else throw e;
      }
      st.state = 'ok'; st.error = null; st.last = new Date(); lastPush = Date.now();
      if (changed) global.dispatchEvent(new Event('sync-updated'));
    } catch (e) {
      st.state = 'error'; st.error = e.status === 401 ? 'Jeton GitHub invalide ou expiré.' : e.status === 404 ? 'Dépôt introuvable ou jeton sans accès à ce dépôt.' : (e.message || 'Erreur réseau');
    } finally { st.busy = false; emit(); }
  }

  // Envoi groupé : au plus une écriture toutes les 90 s pendant l'activité
  let timer = null, lastPush = 0;
  function schedule() {
    if (!enabled()) return;
    clearTimeout(timer);
    const wait = Math.max(15000, 90000 - (Date.now() - lastPush));
    timer = setTimeout(syncNow, wait);
  }

  document.addEventListener('visibilitychange', () => {
    if (!enabled()) return;
    if (document.visibilityState === 'hidden') { clearTimeout(timer); syncNow(); }
    else syncNow(); // en revenant sur l'app : récupérer ce qui a été fait sur l'autre appareil
  });
  setInterval(() => { if (enabled() && document.visibilityState === 'visible') syncNow(); }, 5 * 60000);

  async function readJson(path) { const f = await gh(path); return f ? JSON.parse(b64decode(f.content)) : null; }

  global.Sync = {
    cfg, setCfg, readJson, enabled, syncNow, schedule, deviceId, deviceName,
    get status() { return st; },
    _merge: { mergeInto, buildRemote, mergeDays },
  };
})(window);
