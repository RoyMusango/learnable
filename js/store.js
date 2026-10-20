// État persistant (localStorage) : réglages, points faibles, cartes, historique.
(function (global) {
  const KEY = LANG.storageKey;
  // Clés IA communes aux apps de langues (même adresse GitHub Pages) : une seule configuration pour toutes
  const SHARED_KEYS = 'applangues-keys';
  const KEY_FIELDS = ['geminiKey', 'oaBase', 'oaKey', 'oaModel'];
  const INTERVALS = [0, 1, 2, 4, 7, 15, 30, 60]; // jours, par boîte de Leitner

  const DEFAULT = {
    settings: {
      provider: 'gemini',
      geminiKey: '', geminiModel: 'gemini-flash-latest',
      oaBase: 'https://api.groq.com/openai/v1', oaKey: '', oaModel: 'llama-3.3-70b-versatile',
      dailyMinutes: 30, dailyRequests: 300, newPerDay: 12,
      ttsVoice: '', ttsRate: 0.9, autoSpeak: true, handsFree: false,
      level: 'A1-A2', showTranslation: false, voiceByRole: true, voiceVariant: '',
      ...LANG.defaults,
    },
    topics: {},   // id -> { n, ok, score, last }
    cards: {},    // id -> { box, due, lapses }
    custom: [],   // cartes ajoutées (erreurs, mots de conversation)
    days: {},     // 'YYYY-MM-DD' -> { min: {vocab, gram, conv}, speakSec, requests, cards, exercises, msgs }
    errors: [],   // corrections reçues
    weakSelf: [], // points faibles déclarés
    conj: { tenses: {}, verbs: {} }, // maîtrise de la conjugaison par temps et par verbe
    prefsTs: 0,   // date de la dernière modification des préférences partagées entre appareils
    peers: {},    // compteurs des autres appareils (remplis par la synchro)
  };
  // Réglages communs à tous les appareils (synchronisés). Les clés, la voix, etc. restent propres à chaque appareil.
  const SHARED_PREFS = ['dailyMinutes', 'dailyRequests', 'newPerDay', 'level', 'vocabThemes'];

  function today(offset = 0) {
    const d = new Date(Date.now() + offset * 86400000);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  let state;
  function load() {
    try { state = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { state = {}; }
    for (const k of Object.keys(DEFAULT)) if (state[k] === undefined) state[k] = structuredClone(DEFAULT[k]);
    state.settings = Object.assign(structuredClone(DEFAULT.settings), state.settings);
    // Clés partagées : celles déjà saisies dans une autre app de langues l'emportent
    let shared = {};
    try { shared = JSON.parse(localStorage.getItem(SHARED_KEYS)) || {}; } catch (e) { }
    let changed = false;
    for (const k of KEY_FIELDS) {
      if (shared[k]) state.settings[k] = shared[k];
      else if (state.settings[k] && k !== 'oaBase' && k !== 'oaModel') { shared[k] = state.settings[k]; changed = true; }
    }
    if (changed) localStorage.setItem(SHARED_KEYS, JSON.stringify(shared));
  }
  function setSharedKey(k, v) {
    let shared = {};
    try { shared = JSON.parse(localStorage.getItem(SHARED_KEYS)) || {}; } catch (e) { }
    shared[k] = v; localStorage.setItem(SHARED_KEYS, JSON.stringify(shared));
    state.settings[k] = v; save();
  }
  // Une clé saisie dans une autre app (autre onglet) s'applique tout de suite ici
  window.addEventListener('storage', e => {
    if (e.key !== SHARED_KEYS || !state) return;
    let shared = {};
    try { shared = JSON.parse(e.newValue) || {}; } catch (err) { }
    for (const k of KEY_FIELDS) if (shared[k]) state.settings[k] = shared[k];
  });
  let saveTimer = null;
  function save() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { console.error('Sauvegarde impossible', e); }
      sync();
      if (global.Sync) global.Sync.schedule();
    }, 200);
  }

  // Transmet l'avancement au serveur local (pour le rappel Windows) + sauvegarde fichier
  let lastSync = 0, lastBackup = 0;
  function sync(force = false) {
    if (!location.protocol.startsWith('http')) return;
    const now = Date.now();
    if (!force && now - lastSync < 10000) return;
    lastSync = now;
    const status = statusObj();
    const post = (url, body) => fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).catch(() => { });
    post('/api/status', status);
    if (force || now - lastBackup > 120000) {
      lastBackup = now;
      // La clé API reste dans le navigateur, elle n'est pas écrite dans le fichier de sauvegarde
      const copy = structuredClone(state);
      copy.settings.geminiKey = ''; copy.settings.oaKey = '';
      post('/api/backup', copy);
    }
  }

  function statusObj() {
    const d = today(), minutes = totalMin(d), goal = state.settings.dailyMinutes, x = dayAgg(d);
    return { date: d, minutes: Math.floor(minutes), goal, done: minutes >= goal, skip: !!x.skip, requests: x.requests, budget: state.settings.dailyRequests, updated: new Date().toISOString() };
  }

  function day(d = today()) {
    if (!state.days[d]) state.days[d] = { min: { vocab: 0, gram: 0, conv: 0 }, speakSec: 0, requests: 0, cards: 0, exercises: 0, msgs: 0 };
    return state.days[d];
  }
  // Journée tous appareils confondus (lecture seule) ; day() ne concerne que cet appareil
  function dayAgg(d = today()) {
    const out = { min: { vocab: 0, gram: 0, conv: 0 }, speakSec: 0, requests: 0, cards: 0, exercises: 0, msgs: 0, newCards: 0, skip: false };
    const add = x => {
      if (!x) return;
      for (const k of ['vocab', 'gram', 'conv']) out.min[k] += (x.min && x.min[k]) || 0;
      for (const k of ['speakSec', 'requests', 'cards', 'exercises', 'msgs', 'newCards']) out[k] += x[k] || 0;
      out.skip = out.skip || !!x.skip;
    };
    add(state.days[d]);
    for (const p of Object.values(state.peers || {})) add(p.days && p.days[d]);
    return out;
  }
  function totalMin(d) { const x = dayAgg(d); return x.min.vocab + x.min.gram + x.min.conv; }

  // --- Points faibles ---
  function topic(id) {
    if (!state.topics[id]) state.topics[id] = { n: 0, ok: 0, score: state.weakSelf.includes(id) ? 0.3 : 0.5, last: null };
    return state.topics[id];
  }
  function recordTopic(id, correct, weight = 0.15) {
    if (!id) return;
    const t = topic(id);
    t.n++; if (correct) t.ok++;
    t.score = t.score * (1 - weight) + (correct ? 1 : 0) * weight;
    t.last = today(); t.ts = Date.now();
    save();
  }
  // Classement : score bas + pas vu récemment = prioritaire
  function weakest(ids) {
    return ids.map(id => {
      const t = topic(id);
      const daysSince = t.last ? (Date.parse(today()) - Date.parse(t.last)) / 86400000 : 5;
      return { id, prio: (1 - t.score) + Math.min(daysSince, 7) * 0.04 };
    }).sort((a, b) => b.prio - a.prio).map(x => x.id);
  }

  // --- Conjugaison : score par temps, erreurs par verbe ---
  function conjTense(t) { return state.conj.tenses[t] || (state.conj.tenses[t] = { n: 0, ok: 0, score: 0.5 }); }
  function recordConj(tense, inf, ok) {
    const t = conjTense(tense);
    t.n++; if (ok) t.ok++;
    t.score = t.score * 0.85 + (ok ? 0.15 : 0);
    t.ts = Date.now();
    const v = state.conj.verbs[inf] || (state.conj.verbs[inf] = { fail: 0, ok: 0 });
    if (ok) v.ok++; else v.fail++;
    v.ts = Date.now();
    // Verbe « à revoir » tant que les échecs dominent les réussites récentes
    if (ok && v.fail > 0 && v.ok >= v.fail * 2) { v.fail = 0; v.ok = 0; }
    save();
  }
  function troubleVerbs() {
    return Object.entries(state.conj.verbs).filter(([, v]) => v.fail > 0).sort((a, b) => b[1].fail - a[1].fail).map(([k]) => k);
  }

  // Thèmes de vocabulaire où tu échoues le plus (oublis cumulés / cartes vues)
  function themeStats(words) {
    const stats = {};
    for (const w of words) {
      const c = state.cards[w.id];
      const s = stats[w.theme] || (stats[w.theme] = { seen: 0, lapses: 0, learned: 0, total: 0 });
      s.total++;
      if (c && c.box > 0) { s.seen++; s.lapses += c.lapses; if (c.box >= 3) s.learned++; }
    }
    return stats;
  }

  // --- Cartes (Leitner) ---
  function card(id) { return state.cards[id]; }
  function gradeCard(id, ok) {
    const c = state.cards[id] || (state.cards[id] = { box: 0, due: today(), lapses: 0 });
    if (ok) c.box = Math.min(c.box + 1, INTERVALS.length - 1);
    else { c.box = 1; c.lapses++; }
    c.due = today(ok ? INTERVALS[c.box] : 0);
    c.t = Date.now();
    day().cards++;
    save();
  }
  function addCustom(c) {
    if (state.custom.some(x => x.id === c.id)) return false;
    state.custom.push(c);
    state.cards[c.id] = { box: 0, due: today(), lapses: 0, t: Date.now() };
    save();
    return true;
  }

  function touchPrefs() { state.prefsTs = Date.now(); save(); }
  function replaceState(s) { state = s; localStorage.setItem(KEY, JSON.stringify(state)); }

  function exportData() { return JSON.stringify(state, null, 1); }
  function importData(json) {
    const s = JSON.parse(json);
    if (!s.settings || !s.days) throw new Error('format');
    // Garde les clés API actuelles si le fichier importé n'en contient pas
    for (const k of ['geminiKey', 'oaKey']) if (!s.settings[k]) s.settings[k] = state.settings[k];
    localStorage.setItem(KEY, JSON.stringify(s)); load();
  }

  load();
  global.Store = {
    get state() { return state; }, get settings() { return state.settings; },
    save, sync, statusObj, dayAgg, touchPrefs, setSharedKey, replaceState, KEY, SHARED_PREFS, today, day, conjTense, recordConj, troubleVerbs, themeStats, totalMin, topic, recordTopic, weakest, card, gradeCard, addCustom, exportData, importData, INTERVALS,
  };
})(window);
