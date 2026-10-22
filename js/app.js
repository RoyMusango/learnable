// Interface de Learnable. Le squelette (en-tête, thème, suivi du temps, routeur, synchro, réglages, QR code)
// reprend celui d'AppLangues ; les rubriques sont propres au cours : fiches, cartes, exercices, tuteur, projet.
//
// Chaque notion (section du cours) se travaille en quatre paliers, dans l'ordre :
//   1. Comprendre  : lire la fiche (l'idée en une phrase d'abord, puis le détail et tes notes)
//   2. Retenir     : ses cartes entrent dans la révision espacée
//   3. Appliquer   : réussir des exercices (QCM de raisonnement, calculs générés)
//   4. Approfondir : l'expliquer sans notes (méthode Feynman, évaluée par le tuteur)
// Une nouvelle notion n'est proposée que lorsque les précédentes ont été appliquées au moins une fois.
(function () {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const view = $('#view');
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const S = () => Store.settings;
  const L = LANG, N = LANG.nav, C = COURSE;
  const pct = x => Math.round(x * 100);
  const meterCls = p => p < 45 ? 'low' : p < 70 ? 'mid' : 'high';
  const chOf = sec => C.chapter(C.sections[sec].ch);

  // Deux espaces : « Révisions » (les chapitres du cours, pour garder la matière fraîche et prendre de l'avance)
  // et « Projet » (chapitres marqués space: 'projet', approfondis pour le projet du cours et le TFE).
  // Toutes les vues ne montrent que l'espace courant. Il est rangé dans les topics (clé 'ui:space') pour
  // suivre d'un appareil à l'autre sans toucher à store.js, repris tel quel d'AppLangues.
  const SPACES = [['revision', 'Révisions'], ['projet', 'Projet'], ['tp', 'TP']];
  // Libellé de l'espace courant (en-têtes) ; 'ui:space' range l'indice de l'espace dans SPACES
  const SPACE_LABEL = { revision: 'Révisions', projet: 'espace Projet', tp: 'espace TP' };
  const spaceOfCh = ch => ch.space || 'revision';
  const curSpace = () => { const t = Store.state.topics['ui:space']; return (SPACES[t ? Math.round(t.score) : 0] || SPACES[0])[0]; };
  const spaceChs = () => C.chapters.filter(ch => spaceOfCh(ch) === curSpace());
  const spaceOrder = () => C.order.filter(id => spaceOfCh(chOf(id)) === curSpace());
  function setSpace(sp) {
    if (sp === curSpace()) return;
    setT('ui:space', { score: Math.max(0, SPACES.findIndex(x => x[0] === sp)) });
    paintSpace();
  }
  // Une notion ouverte depuis un lien (carte, tuteur, rappel) fait basculer dans son espace
  function followSpace(sec) { if (sec && C.sections[sec]) setSpace(spaceOfCh(chOf(sec))); }

  // ---------- Icônes ----------
  const ICONS = {
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
    mic: '<path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3z"/><path d="M19 11a7 7 0 0 1-14 0M12 18v3"/>',
    stop: '<rect x="7" y="7" width="10" height="10" rx="1.5"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    back: '<path d="M19 12H5M11 18l-6-6 6-6"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    bulb: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>',
    flame: '<path d="M12 3c1 3 4 5 4 9a4 4 0 0 1-8 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-5 0-8z"/>',
    chat: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-4.6A8 8 0 1 1 21 12z"/>',
    star: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3l-5.6 2.9 1.1-6.2L3 9.6l6.2-.9z"/>',
    flip: '<path d="M4 12a8 8 0 0 1 13.7-5.7L20 8.5M20 4v4.5h-4.5M20 12a8 8 0 0 1-13.7 5.7L4 15.5M4 20v-4.5h4.5"/>',
  };
  const icon = (n, cls = '') => `<svg class="i ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${ICONS[n]}</svg>`;

  // ---------- Formules : rendu KaTeX automatique de tout ce qui s'affiche ----------
  const MATH = { delimiters: [{ left: '$$', right: '$$', display: true }, { left: '$', right: '$', display: false }], throwOnError: false, strict: 'ignore' };
  let mathQueued = false;
  const mathObs = new MutationObserver(() => { if (!mathQueued) { mathQueued = true; requestAnimationFrame(typeset); } });
  function watchMath() { [view, $('#modalBox')].forEach(el => mathObs.observe(el, { childList: true, subtree: true })); }
  function typeset() {
    mathQueued = false;
    if (!window.renderMathInElement) return;
    mathObs.disconnect(); // le rendu modifie lui-même le DOM
    [view, $('#modalBox')].forEach(el => { try { renderMathInElement(el, MATH); } catch (e) { console.warn(e); } });
    watchMath();
  }
  watchMath();

  // Texte produit par l'IA : on échappe le HTML, on garde les formules $…$ et un markdown minimal (gras, listes, paragraphes)
  function richText(t) {
    const blocks = esc(t).replace(/\r/g, '').split(/\n{2,}/);
    return blocks.map(b => {
      const lines = b.split('\n');
      if (lines.every(l => /^\s*([-*•]|\d+[.)])\s+/.test(l))) return `<ul>${lines.map(l => `<li>${l.replace(/^\s*([-*•]|\d+[.)])\s+/, '')}</li>`).join('')}</ul>`;
      return `<p>${lines.join('<br>')}</p>`;
    }).join('').replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
  }

  // ---------- En-tête : marque, navigation, thème ----------
  document.title = L.title;
  $('.brand').innerHTML = `<span class="brand-mark"></span>${esc(L.appName)}`;
  const NAV = ['today', 'cards', 'quiz', 'course', 'tutor', 'project', 'progress'];
  $('#nav').innerHTML = NAV.map(k => `<a href="#${k}" data-view="${k}">${esc(N[k])}</a>`).join('');
  $('#gearLink').href = '#settings';
  $('#gearLink').innerHTML = icon('gear');
  // Sélecteur d'espace, juste après la marque (sur téléphone, il prend une ligne entière)
  $('.brand').insertAdjacentHTML('afterend', '<div class="space-switch" id="spaceSw" role="group" aria-label="Espace"></div>');
  function paintSpace() {
    $('#spaceSw').innerHTML = SPACES.map(([k, l]) => `<button type="button" data-space="${k}" class="${k === curSpace() ? 'on' : ''}" aria-pressed="${k === curSpace()}">${l}</button>`).join('');
  }
  $('#spaceSw').onclick = e => {
    const b = e.target.closest('[data-space]'); if (!b || b.dataset.space === curSpace()) return;
    setSpace(b.dataset.space);
    // Une notion de l'autre espace n'a plus sa place à l'écran : retour à la séance du jour
    if (location.hash.slice(1).split('/')[1]) location.hash = '#today'; else go();
  };
  paintSpace();
  const THEME_KEY = 'applangues-theme'; // partagé avec les apps de langues (même adresse)
  const darkNow = () => (document.documentElement.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')) === 'dark';
  function paintThemeBtn() { const d = darkNow(); $('#themeBtn').innerHTML = icon(d ? 'sun' : 'moon'); $('#themeBtn').title = d ? 'Passer en mode clair' : 'Passer en mode sombre'; }
  $('#themeBtn').onclick = () => {
    const t = darkNow() ? 'light' : 'dark';
    document.documentElement.dataset.theme = t;
    try { localStorage.setItem(THEME_KEY, t); } catch (e) { }
    paintThemeBtn();
  };
  window.addEventListener('storage', e => { if (e.key === THEME_KEY && e.newValue) { document.documentElement.dataset.theme = e.newValue; paintThemeBtn(); } });
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', paintThemeBtn);
  paintThemeBtn();
  $('#fabAsk').innerHTML = icon('chat') + '<span>Une question ?</span>';

  // ---------- Suivi du temps : cartes (vocab), exercices (gram), comprendre (conv) ----------
  let area = null, lastActivity = 0, currentListener = null, currentSec = null;
  ['pointerdown', 'keydown', 'input', 'scroll'].forEach(ev => document.addEventListener(ev, () => { lastActivity = Date.now(); }, true));
  setInterval(() => {
    const listening = currentListener && currentListener.active;
    if (area && document.visibilityState === 'visible' && (listening || Date.now() - lastActivity < 90000)) {
      Store.day().min[area] += 0.25; Store.save(); updateChip();
    }
  }, 15000);
  function updateChip() {
    const m = Math.floor(Store.totalMin(Store.today())), goal = S().dailyMinutes;
    const chip = $('#todayChip');
    chip.classList.toggle('done', m >= goal);
    const ss = Sync.enabled() ? Sync.status.state : 'off';
    const sTitle = { ok: 'Synchronisé', syncing: 'Synchronisation…', error: 'Synchro en erreur : ' + (Sync.status.error || ''), off: 'Synchro désactivée' }[ss];
    chip.innerHTML = `<span>${m} / ${goal} min</span><span class="mini"><i style="width:${Math.min(100, m / goal * 100)}%"></i></span>${ss !== 'off' ? `<span class="sync-dot ${ss}" title="${esc(sTitle)}"></span>` : ''}`;
  }
  window.addEventListener('sync-status', () => updateChip());
  window.addEventListener('sync-updated', () => { if (['today', 'progress', 'course', 'project'].includes(currentRoute())) go(); else updateChip(); });
  function streak() {
    let n = 0, i = Store.totalMin(Store.today()) >= 10 ? 0 : -1;
    while (Store.totalMin(Store.today(i)) >= 10) { n++; i--; }
    return n;
  }
  function planTargets() {
    const D = S().dailyMinutes;
    const vocab = Math.max(3, Math.round(D * 0.25)), gram = Math.max(4, Math.round(D * 0.35));
    return { vocab, gram, conv: Math.max(4, D - vocab - gram) };
  }

  // =====================================================================
  // ÉTAT PÉDAGOGIQUE D'UNE NOTION
  // Rangé dans Store.state.topics (synchronisé entre appareils, fusion par horodatage ts) :
  //   'read:<sec>' notion comprise · '<sec>' maîtrise des exercices · 'oral:<sec>' explication évaluée
  //   'int:<ch>' intérêt pour le chapitre (projet) · 'proj:<ch>' chapitre choisi pour le projet
  // =====================================================================
  const T = id => Store.state.topics[id];
  function setT(id, v) { Store.state.topics[id] = { n: 1, ok: 1, last: Store.today(), ...v, ts: Date.now() }; Store.save(); }
  const isRead = sec => !!(T('read:' + sec) && T('read:' + sec).score > 0);
  const secCards = sec => C.cards.filter(c => c.sec === sec);
  function cardsLevel(sec) {
    const cs = secCards(sec); if (!cs.length) return 1;
    return cs.reduce((s, c) => { const k = Store.card(c.id); return s + Math.min(k ? k.box : 0, 3) / 3; }, 0) / cs.length;
  }
  function exLevel(sec) { const t = T(sec); return t && t.n ? { n: t.n, score: t.score } : { n: 0, score: 0 }; }
  const oralLevel = sec => { const t = T('oral:' + sec); return t && t.n ? t.score : 0; };
  const hasEx = sec => C.quiz.some(q => q.sec === sec) || !!C.gens[sec];
  function stages(sec) {
    const read = isRead(sec), cl = cardsLevel(sec), ex = exLevel(sec), or = oralLevel(sec);
    return [
      { k: 'read', label: 'Comprendre', p: read ? 1 : 0, done: read, info: read ? 'Fiche lue' : 'À lire' },
      { k: 'cards', label: 'Retenir', p: read ? cl : 0, done: read && cl >= 0.66, info: `${secCards(sec).filter(c => (Store.card(c.id) || {}).box >= 2).length} / ${secCards(sec).length} cartes solides` },
      { k: 'ex', label: 'Appliquer', p: ex.n ? Math.min(1, ex.n / 4) * ex.score : 0, done: ex.n >= 4 && ex.score >= 0.7, info: ex.n ? `${pct(ex.score)} % sur ${ex.n} réponses` : 'Pas encore d’exercice' },
      { k: 'oral', label: 'Approfondir', p: or, done: or >= 0.7, info: or ? `Explication notée ${pct(or)} %` : 'L’expliquer sans notes' },
    ];
  }
  const mastery = sec => { const s = stages(sec); return s[0].p * 0.15 + s[1].p * 0.3 + s[2].p * 0.35 + s[3].p * 0.2; };
  const level = sec => { const i = stages(sec).findIndex(x => !x.done); return i < 0 ? 4 : i; }; // nombre de paliers franchis
  const LEVEL_NAMES = ['À découvrir', 'Comprise', 'Retenue', 'Appliquée', 'Maîtrisée'];
  const chMastery = ch => { const ids = C.chapter(ch).sections; return ids.reduce((s, id) => s + mastery(id), 0) / ids.length; };

  // Chapitres actifs de l'espace courant : leurs notions entrent dans la séance du jour
  // (réglage partagé du moteur « vocabThemes », qui garde ensemble les chapitres actifs des deux espaces)
  function activeChs() {
    const ids = spaceChs().map(c => c.id);
    let a = (S().vocabThemes || []).filter(x => ids.includes(x));
    if (!a.length) a = [ids[0]];
    return a;
  }
  function setActive(ch, on) {
    const a = new Set([...(S().vocabThemes || []).filter(x => C.chapter(x)), ...activeChs()]);
    on ? a.add(ch) : a.delete(ch);
    S().vocabThemes = C.chapters.map(c => c.id).filter(id => a.has(id));
    Store.touchPrefs();
  }
  // Dans l'espace TP, les notions de la prochaine séance choisie passent avant celles des autres TP actifs
  const activeSecs = () => {
    const ids = C.order.filter(id => activeChs().includes(C.sections[id].ch));
    const nx = curSpace() === 'tp' && Store.state.topics['tp:next'];
    return nx ? [...ids.filter(id => C.sections[id].ch === nx.note), ...ids.filter(id => C.sections[id].ch !== nx.note)] : ids;
  };
  const readSecs = () => spaceOrder().filter(isRead);

  // Plan du jour : une nouvelle notion seulement si les précédentes ont été appliquées (quota propre à chaque espace)
  function notionPlan() {
    const next = activeSecs().find(id => !isRead(id));
    const pending = readSecs().filter(id => hasEx(id) && exLevel(id).n < 3);
    const readToday = spaceOrder().filter(id => { const t = T('read:' + id); return t && t.score > 0 && t.last === Store.today(); }).length;
    const quota = Math.max(0, (S().notionsPerDay || 1) - readToday);
    return { next, pending, readToday, quota, open: !!next && !pending.length && quota > 0 };
  }
  // Prochaine notion à approfondir : appliquée mais pas encore expliquée
  const toDeepen = () => readSecs().find(id => level(id) === 3) || readSecs().find(id => level(id) === 2);

  // Message du rappel téléphone : ce qui t'attend aujourd'hui
  function statusHint() {
    const p = notionPlan(), due = cardQueue().length;
    if (p.open) return `Notion du jour : ${C.sections[p.next].title}${due ? ` (et ${due} carte${due > 1 ? 's' : ''} à revoir)` : ''}.`;
    if (p.pending.length) return `À appliquer : ${C.sections[p.pending[0]].title}${due ? `, ${due} carte${due > 1 ? 's' : ''} à revoir` : ''}.`;
    if (due) return `${due} carte${due > 1 ? 's' : ''} à revoir aujourd’hui.`;
    return 'Ta séance du jour t’attend.';
  }
  const baseStatus = Store.statusObj;
  Store.statusObj = () => ({ ...baseStatus(), hint: statusHint() });

  // ---------- Configuration d'un appareil par lien (QR code), commune aux apps ----------
  const PAGES_URL = location.hostname.endsWith('github.io') ? location.origin + location.pathname : L.pagesUrl;
  const b64url = str => btoa(unescape(encodeURIComponent(str))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const fromB64url = str => decodeURIComponent(escape(atob(str.replace(/-/g, '+').replace(/_/g, '/'))));
  function loadScript(src) {
    return new Promise((ok, ko) => {
      if (window.QRCode && /qrcode/.test(src)) return ok();
      const el = document.createElement('script'); el.src = src; el.onload = ok; el.onerror = ko; document.head.appendChild(el);
    });
  }
  function importSetupFromHash() {
    const m = location.hash.match(/^#setup=([\w-]+)/);
    if (!m) return;
    try {
      const p = JSON.parse(fromB64url(m[1]));
      if (p.g) { Store.setSharedKey('geminiKey', p.g); S().provider = 'gemini'; }
      if (p.t && p.r) Sync.setCfg({ token: p.t, repo: p.r });
      Store.save();
      setTimeout(() => toast('Appareil configuré : clé IA et synchro activées.', 5000), 300);
    } catch (e) { }
    history.replaceState(null, '', location.pathname + '#today');
  }

  function toast(html, ms = 6000) {
    const t = document.createElement('div');
    t.className = 'notice warn toast';
    t.innerHTML = html;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), ms);
  }

  // ---------- Routeur ----------
  const routes = {};
  const currentRoute = () => (location.hash.slice(1) || 'today').split('/')[0];
  // Blocs de code des fiches de TP : un bouton pour copier le code dans Spyder ou un notebook
  function addCopyButtons(root = view) {
    $$('pre.code', root).forEach(pre => {
      if (pre.querySelector('.copy')) return;
      const b = document.createElement('button'); b.className = 'copy'; b.type = 'button'; b.textContent = 'Copier';
      b.onclick = async () => {
        const code = pre.querySelector('code').innerText;
        try { await navigator.clipboard.writeText(code); b.textContent = 'Copié'; } catch (e) { prompt('Copie ce code :', code); }
        setTimeout(() => { b.textContent = 'Copier'; }, 1500);
      };
      pre.appendChild(b);
    });
  }
  function go() {
    if (currentListener) currentListener.stop();
    Speech.stopSpeaking();
    document.onkeydown = null;
    document.body.classList.remove('in-chat');
    const parts = location.hash.slice(1).split('/').map(decodeURIComponent);
    const r = routes[currentRoute()] ? currentRoute() : 'today';
    $$('#nav a').forEach(a => a.classList.toggle('active', a.dataset.view === (r === 'glossary' ? 'course' : r)));
    const pj = $('#nav a[data-view="project"]'); if (pj) pj.textContent = curSpace() === 'tp' ? 'Séances' : N.project;
    area = null; currentSec = null;
    // Couleur propre à l'espace et à la page (vivid.css), puis entrée en douceur de la vue
    document.body.dataset.space = curSpace(); document.body.dataset.route = r;
    routes[r](parts[1], parts[2]);
    addCopyButtons();
    const v = $('#view'); v.classList.remove('enter'); void v.offsetWidth; v.classList.add('enter');
    window.scrollTo(0, 0);
    updateChip();
  }
  window.addEventListener('hashchange', go);

  function modal(html) {
    $('#modalBox').innerHTML = `<button class="icon-btn close" data-close title="Fermer">${icon('x')}</button>` + html;
    $('#modal').classList.remove('hidden');
    return $('#modalBox');
  }
  function closeModal() { $('#modal').classList.add('hidden'); }
  $('#modal').addEventListener('click', e => { if (e.target.id === 'modal' || e.target.closest('[data-close]')) closeModal(); });

  const head = (eyebrow, title, lead = '') => `<div class="page-head"><span class="eyebrow">${eyebrow}</span><h1>${title}</h1>${lead ? `<p class="lead">${lead}</p>` : ''}</div>`;
  const backLink = (href, label) => `<a href="${href}" class="link small back">${icon('back')} ${esc(label)}</a>`;
  const noKey = what => `<div class="notice">${what} demande une clé IA gratuite. <a class="link" href="#settings">Ajoute ta clé Gemini</a> (la même que pour tes apps de langues).</div>`;

  // Bouton micro branché sur un champ texte (reconnaissance vocale en français)
  function micFor(btn, input) {
    btn.innerHTML = icon('mic');
    if (!Speech.supported) { btn.title = 'Micro indisponible : utilise Chrome ou Edge'; btn.disabled = true; return null; }
    let base = '';
    const l = new Speech.Listener({
      onText: (fin, interim) => { input.value = (base + ' ' + fin + ' ' + interim).trim(); },
      onState: on => { btn.classList.toggle('rec', on); btn.innerHTML = icon(on ? 'stop' : 'mic'); },
    });
    btn.addEventListener('click', () => {
      if (l.active) l.stop();
      else { currentListener = l; base = input.value; l.start(); }
    });
    return l;
  }

  // Les quatre paliers d'une notion, sous forme de petite frise
  function stageBar(sec, big = false) {
    return `<div class="stages ${big ? 'big' : ''}">${stages(sec).map((s, i) => `<div class="stage ${s.done ? 'done' : s.p > 0 ? 'part' : ''}" title="${esc(s.label)} : ${esc(s.info)}">
      <span class="n">${s.done ? icon('check') : i + 1}</span>${big ? `<b>${esc(s.label)}</b><span class="muted small">${esc(s.info)}</span>` : ''}<i style="width:${pct(s.p)}%"></i></div>`).join('')}</div>`;
  }
  // ---------- Notations : chaque symbole défini avant d'être utilisé (glossaire dans js/data/glossary.js) ----------
  function notationList(text, sec, { full = false, only = null } = {}) {
    const ch = C.sections[sec].ch, list = C.notationsIn(text, ch);
    return list.map(g => {
      const f = C.firstUse(g, ch), isNew = !f || f === sec;
      if (only && (only === 'new') !== isNew) return '';
      const where = !full ? '' : isNew ? ' <span class="tag new">nouveau ici</span>' : ` <a class="link small" href="#course/${f}">introduit dans « ${esc(C.sections[f].title)} »</a>`;
      return `<div class="nt"><dt>$${g.sym}$</dt><dd><b>${esc(g.name)}</b>${where}<br>${g.def}</dd></div>`;
    }).join('');
  }
  // Encadré d'une fiche : les symboles nouveaux en détail, les rappels repliés sur une ligne
  function notationsBox(sec, open) {
    const s = C.sections[sec], text = s.fiche + ' ' + s.summary, ch = s.ch;
    const all = C.notationsIn(text, ch), isNew = g => { const f = C.firstUse(g, ch); return !f || f === sec; };
    if (!all.length) return '';
    const olds = all.filter(g => !isNew(g)), news = all.length - olds.length;
    const fresh = notationList(text, sec, { full: true, only: 'new' }), rec = notationList(text, sec, { full: true, only: 'old' });
    return `<details class="notations" ${open ? 'open' : ''}><summary><span class="eyebrow">Les notations de cette fiche</span><span class="muted small">${news ? `${news} nouvelle${news > 1 ? 's' : ''}` : 'aucune nouvelle'}${olds.length ? `, ${olds.length} déjà vue${olds.length > 1 ? 's' : ''}` : ''} · <a class="link" href="#glossary">tout le glossaire</a></span></summary>
      ${fresh ? `<dl>${fresh}</dl>` : '<p class="small muted" style="margin:10px 0 0">Aucun nouveau symbole : tout ce qui sert ici a été défini dans les notions précédentes.</p>'}
      ${rec ? `<details class="nt-old"><summary><b>Rappels</b> <span class="muted">(déjà vus)</span> : ${olds.map(g => `$${g.sym}$`).join(' · ')}</summary><dl>${rec}</dl></details>` : ''}</details>`;
  }
  // Bouton repliable « Notations » sous une question de carte ou d'exercice
  function notationsToggle(text, sec) {
    const html = notationList(text, sec);
    return html ? `<details class="nt-inline"><summary>${icon('bulb')} Notations utilisées</summary><dl>${html}</dl></details>` : '';
  }
  const secLink = (id, extra = '') => `<a class="link" href="#course/${id}">${esc(C.sections[id].title)}</a>${extra}`;

  // =====================================================================
  // AUJOURD'HUI
  // =====================================================================
  routes.today = () => {
    const d = Store.dayAgg(), t = planTargets(), D = S().dailyMinutes;
    const total = Store.totalMin(Store.today()), left = Math.max(0, D - total);
    const plan = notionPlan(), queue = cardQueue(), reads = readSecs(), deep = toDeepen();
    const date = new Date().toLocaleDateString('fr-BE', { weekday: 'long', day: 'numeric', month: 'long' });

    const step = (n, key, title, desc, href, btn, disabled = false) => {
      const done = d.min[key], target = t[key], p = Math.min(100, done / target * 100);
      return `<div class="step ${p >= 100 ? 'done' : ''}"><span class="num">${p >= 100 ? icon('check') : n}</span>
        <h3>${title}</h3><span class="time">${Math.floor(done)} / ${target} min</span>
        <div class="meter"><i style="width:${p}%"></i></div><div class="desc">${desc}</div>
        ${disabled ? '' : `<a class="btn ${p >= 100 ? 'quiet' : ''}" href="${href}">${btn} ${icon('arrow')}</a>`}</div>`;
    };

    // Étape 2 : la notion du jour, ou ce qu'il faut consolider avant
    let s2;
    if (plan.open) {
      const s = C.sections[plan.next];
      s2 = { title: 'Comprendre', desc: `<span class="eyebrow accent">Notion du jour · ${esc(chOf(plan.next).short)}</span><b>${esc(s.title)}</b><p class="muted small" style="margin-top:6px">${esc(s.summary)}</p>`, href: '#course/' + plan.next, btn: 'Lire la fiche' };
    } else if (plan.pending.length) {
      const id = plan.pending[0];
      s2 = { title: 'Consolider', desc: `Avant une nouvelle notion, applique d’abord <b>${esc(C.sections[id].title)}</b> : une notion comprise mais jamais utilisée s’oublie vite.${plan.next ? ` <a class="link small" href="#course/${plan.next}">Lire quand même la suivante</a>` : ''}`, href: '#quiz/' + id, btn: 'S’entraîner' };
    } else if (plan.next) {
      s2 = deep
        ? { title: 'Approfondir', desc: `Notion du jour comprise. Ancre-la : explique <b>${esc(C.sections[deep].title)}</b> sans tes notes, le tuteur te corrige.<br><a class="link small" href="#course/${plan.next}">Prendre de l’avance : notion suivante</a>`, href: '#tutor/oral/' + deep, btn: 'L’expliquer' }
        : { title: 'Comprendre', desc: `Notion du jour faite. Tu peux prendre de l’avance avec <b>${esc(C.sections[plan.next].title)}</b>.`, href: '#course/' + plan.next, btn: 'Prendre de l’avance' };
    } else {
      s2 = { title: 'Approfondir', desc: `Tous les chapitres actifs sont lus. ${deep ? `Explique <b>${esc(C.sections[deep].title)}</b> sans notes, ou ` : ''}<a class="link" href="#course">active un autre chapitre</a> pour prendre de l’avance.`, href: deep ? '#tutor/oral/' + deep : '#course', btn: deep ? 'L’expliquer' : 'Voir les chapitres' };
    }

    const segs = ['vocab', 'gram', 'conv'].map(k => `<i class="${k}" style="width:${Math.min(100, d.min[k] / D * 100)}%"></i>`).join('');
    view.innerHTML = `
      <div class="today-head">
        <div><span class="eyebrow">Aujourd’hui · ${SPACE_LABEL[curSpace()]}${streak() ? ` · ${icon('flame')} ${streak()} jour${streak() > 1 ? 's' : ''} d’affilée` : ''}</span>
          <h1>${esc(date.charAt(0).toUpperCase() + date.slice(1))}</h1>
          <p class="lead">${total >= D ? 'Séance du jour terminée. Ce que tu fais maintenant, c’est de l’avance.' : `Encore <b>${Math.ceil(left)} min</b>. Réviser, comprendre une notion, l’appliquer : dans cet ordre, chaque jour.`}</p></div>
        <div class="big-num"><b>${Math.floor(total)}</b><span> / ${D} min</span></div>
      </div>
      <div class="day-meter">${segs}</div>
      ${total < D && d.skip ? `<div class="notice" style="margin-top:24px">Rappels coupés pour aujourd’hui. <button class="link" id="unskip">Les réactiver</button></div>` : ''}
      ${!reads.length ? `<div class="notice" style="margin-top:24px">Bienvenue. Le parcours commence par la première notion du chapitre ${esc(chOf(activeSecs()[0]).short)}. Une notion à la fois : tu la comprends, ses cartes entrent dans tes révisions, puis tu l’appliques.</div>` : ''}

      <section class="section">
        <div class="section-head"><h2>Ta séance</h2><span class="muted small">${D} minutes</span></div>
        <div class="steps">
          ${step('01', 'vocab', 'Réviser', queue.length ? `<b>${queue.length}</b> carte${queue.length > 1 ? 's' : ''} : celles qui allaient s’oublier, puis celles des notions lues. Formule chaque réponse avant de retourner la carte.` : reads.length ? 'Rien à revoir pour l’instant : la mémoire travaille. Reviens demain.' : 'Les cartes d’une notion arrivent dès que tu l’as comprise.', '#cards', 'Réviser', !queue.length)}
          ${step('02', 'conv', s2.title, s2.desc, s2.href, s2.btn)}
          ${step('03', 'gram', 'Appliquer', reads.length ? `Une série de 8 exercices sur tes ${reads.length} notion${reads.length > 1 ? 's' : ''}, les plus fragiles d’abord : raisonnements et calculs, jamais du par cœur.` : 'Les exercices se débloquent avec ta première notion.', '#quiz', 'S’entraîner', !reads.length)}
        </div>
      </section>

      <section class="section">
        <div class="section-head"><h2>Ton parcours</h2><a class="link small" href="#course">Tous les chapitres</a></div>
        ${activeChs().map(ch => courseMap(ch)).join('')}
        <div class="legend">${LEVEL_NAMES.map((n, i) => `<span><i class="lv lv${i}"></i>${n}</span>`).join('')}</div>
      </section>

      <div class="footer-meta">${total < D && !d.skip ? '<button class="link" id="skipToday">Pas aujourd’hui : couper les rappels</button>' : ''}<span>Requêtes IA : ${d.requests} / ${S().dailyRequests}</span>${AI.hasKey() ? '' : '<a class="link" href="#settings">Activer le tuteur IA</a>'}</div>`;
    const setSkip = v => { Store.day().skip = v; Store.save(); Store.sync(true); if (Sync.enabled()) Sync.syncNow(); go(); };
    const sk = $('#skipToday'); if (sk) sk.onclick = () => setSkip(true);
    const us = $('#unskip'); if (us) us.onclick = () => setSkip(false);
  };

  // Carte d'un chapitre : une case par notion, colorée selon le palier atteint
  function courseMap(ch) {
    const c = C.chapter(ch);
    return `<div class="map"><div class="map-head"><b>${esc(c.title)}</b><span class="muted small">${pct(chMastery(ch))} % maîtrisé</span></div>
      <div class="map-cells">${c.sections.map((id, i) => `<a class="cell lv${level(id)}" href="#course/${id}" title="${esc(C.sections[id].title)} : ${LEVEL_NAMES[level(id)]}"><span>${i + 1}</span><em>${esc(C.sections[id].title)}</em></a>`).join('')}</div></div>`;
  }

  // =====================================================================
  // CARTES : révision espacée (boîtes de Leitner du moteur)
  // =====================================================================
  function cardQueue(onlySec) {
    const today = Store.today(), read = new Set(onlySec ? [onlySec] : readSecs());
    const due = [], fresh = [];
    for (const c of C.cards) {
      if (!read.has(c.sec)) continue;
      const k = Store.card(c.id);
      if (k && k.box > 0) { if (k.due <= today || onlySec) due.push(c); } else fresh.push(c);
    }
    due.sort((a, b) => Store.card(a.id).box - Store.card(b.id).box || Math.random() - .5);
    fresh.sort((a, b) => C.order.indexOf(a.sec) - C.order.indexOf(b.sec));
    // Une notion étudiée exprès (depuis sa fiche) apporte toutes ses cartes, sinon on respecte le quota du jour
    const newLeft = onlySec ? fresh.length : Math.max(0, S().newPerDay - (Store.dayAgg().newCards || 0));
    return [...(onlySec ? fresh.concat(due) : due.slice(0, 60).concat(fresh.slice(0, newLeft)))];
  }

  routes.cards = (tab, arg) => {
    area = 'vocab';
    if (tab === 'all') return allCards();
    const onlySec = tab === 's' && C.sections[arg] ? arg : null;
    followSpace(onlySec);
    let queue = cardQueue(onlySec);
    const total = queue.length, retry = new Set(), seen = {};
    let cur = null, flipped = false, good = 0;
    view.innerHTML = (onlySec ? backLink('#course/' + onlySec, C.sections[onlySec].title) : '') + head('Retenir', esc(N.cards), 'Avant de retourner une carte, formule la réponse : dans ta tête, à voix haute ou par écrit. C’est l’effort de rappel qui ancre la connaissance, pas la relecture.')
      + `<div class="tabs"><a class="active" href="#cards">Révision</a><a href="#cards/all">Toutes les cartes</a></div><div class="flash" id="flash"></div>`;
    const box = $('#flash');
    function next() {
      cur = queue.shift(); flipped = false;
      if (!cur) {
        box.innerHTML = total ? `<div class="done-box"><span class="eyebrow">Terminé</span><h2>${good} / ${total} du premier coup</h2><p class="muted" style="margin-top:12px">Les cartes ratées reviendront demain, les autres plus tard. Passe maintenant à l’<a class="link" href="#quiz">application</a> : c’est là que la connaissance devient compétence.</p></div>`
          : `<div class="done-box"><span class="eyebrow">Rien à revoir</span><h2>Ta mémoire est à jour</h2><p class="muted" style="margin-top:12px">${readSecs().length ? 'Les prochaines cartes arrivent quand leur intervalle expire, ou avec ta prochaine notion.' : 'Lis ta première notion dans les <a class="link" href="#course">fiches</a> : ses cartes arriveront ici.'}</p></div>`;
        return;
      }
      const k = Store.card(cur.id), isNew = !k || !k.box, s = C.sections[cur.sec];
      const doneN = total - queue.length - 1;
      box.innerHTML = `
        <div class="meta"><span>${esc(chOf(cur.sec).short)}</span><div class="meter"><i style="width:${Math.min(100, doneN / Math.max(1, total) * 100)}%"></i></div><span>${isNew ? '<span class="tag new">Nouvelle</span>' : `${queue.length} restante${queue.length > 1 ? 's' : ''}`}</span></div>
        <div class="card-face"><span class="eyebrow">${esc(s.title)}</span><div class="card-q">${cur.q}</div><div id="cNot">${notationsToggle(cur.q, cur.sec)}</div>
          <div class="recall"><textarea id="cIn" rows="2" placeholder="Ta réponse (facultatif) : écrire force à préciser"></textarea><button class="mic small-mic" id="cMic" title="Répondre à voix haute"></button></div>
          <div id="cBack"></div>
          <div class="row" id="cBtns"><button class="btn" id="cFlip">${icon('flip')} Retourner la carte</button></div></div>
        <p class="muted small center">Espace : retourner · 1 : à revoir · 2 : je savais</p>`;
      micFor($('#cMic'), $('#cIn'));
      $('#cFlip').onclick = flip;
      document.onkeydown = e => {
        if (e.target.tagName === 'TEXTAREA') return;
        if (e.key === ' ') { e.preventDefault(); if (!flipped) flip(); }
        if (flipped && (e.key === '1' || e.key === '2')) grade(e.key === '2');
      };
    }
    function flip() {
      flipped = true;
      if (currentListener) currentListener.stop();
      $('#cNot').innerHTML = notationsToggle(cur.q + ' ' + cur.a, cur.sec);
      $('#cBack').innerHTML = `<div class="card-a">${cur.a}</div><a class="link small" href="#course/${cur.sec}">Revoir la fiche</a>`;
      $('#cBtns').innerHTML = `<button class="btn bad" id="cBad">${icon('x')} À revoir</button><button class="btn good" id="cGood">${icon('check')} Je savais</button>`;
      $('#cBad').onclick = () => grade(false);
      $('#cGood').onclick = () => grade(true);
    }
    function grade(ok) {
      if (!(cur.id in seen)) {
        seen[cur.id] = ok; if (ok) good++;
        const k = Store.card(cur.id);
        if (!k || !k.box) Store.day().newCards = (Store.day().newCards || 0) + 1;
        Store.gradeCard(cur.id, ok);
      }
      if (!ok && !retry.has(cur.id)) { retry.add(cur.id); queue.push(cur); }
      next();
    }
    next();
  };

  function allCards() {
    view.innerHTML = head('Retenir', esc(N.cards), 'Toutes les cartes du cours. Celles des notions pas encore lues attendent leur tour.')
      + `<div class="tabs"><a href="#cards">Révision</a><a class="active" href="#cards/all">Toutes les cartes</a></div>`
      + spaceChs().map(ch => `<details class="theme" ${activeChs().includes(ch.id) ? 'open' : ''}><summary><span class="name">${esc(ch.title)}</span><span class="muted small">${C.cards.filter(c => C.sections[c.sec].ch === ch.id && (Store.card(c.id) || {}).box >= 3).length} / ${C.cards.filter(c => C.sections[c.sec].ch === ch.id).length} acquises</span></summary>
        ${ch.sections.map(sec => `<div class="card-list"><h4>${secLink(sec)} ${isRead(sec) ? '' : '<span class="tag">à lire</span>'}</h4>
          ${secCards(sec).map(c => { const k = Store.card(c.id); return `<details class="mini-card"><summary><span class="box-tag b${k ? Math.min(k.box, 4) : 0}" title="Boîte ${k ? k.box : 0}"></span>${c.q}</summary><div class="card-a">${c.a}</div></details>`; }).join('')}</div>`).join('')}</details>`).join('');
  }

  // =====================================================================
  // EXERCICES : QCM de raisonnement et calculs générés, sur les notions lues
  // =====================================================================
  const aiPool = {}; // questions générées par l'IA pendant la session, par notion
  function buildItem(sec, used) {
    const gens = C.gens[sec] || [];
    const bank = C.quiz.filter(q => q.sec === sec && !used.has(q.id)).concat((aiPool[sec] || []).filter(q => !used.has(q.id)));
    if (gens.length && (!bank.length || Math.random() < 0.5)) {
      const g = pick(gens)();
      return { ...g, sec, id: 'gen:' + sec + Math.random() };
    }
    if (!bank.length) return null;
    const q = pick(bank); used.add(q.id);
    return { ...q };
  }
  function pickWeighted(list, w) { const tot = list.reduce((a, x) => a + w(x), 0); let r = Math.random() * tot; for (const x of list) { r -= w(x); if (r <= 0) return x; } return list[list.length - 1]; }
  function buildQuiz(pool, n) {
    const ranked = Store.weakest(pool.filter(hasEx));
    if (!ranked.length) return [];
    const items = [], used = new Set();
    for (let tries = 0; items.length < n && tries < n * 6; tries++) {
      const sec = pickWeighted(ranked, x => 1 / (1 + ranked.indexOf(x) * 0.6));
      const it = buildItem(sec, used); if (it) items.push(it);
    }
    return items;
  }
  // Nombre de décimales à afficher selon la tolérance
  const decimalsFor = tol => tol >= 1 || tol === 0 ? 0 : Math.min(4, Math.ceil(-Math.log10(tol)));
  const parseNum = s => { const x = parseFloat(String(s).replace(/\s/g, '').replace(',', '.').replace(/[%a-zA-Z]+$/, '')); return isNaN(x) ? null : x; };

  routes.quiz = (sec) => {
    area = 'gram';
    const one = sec && C.sections[sec] ? sec : null;
    if (one) { currentSec = one; followSpace(one); }
    const pool = one ? [one] : readSecs();
    view.innerHTML = (one ? backLink('#course/' + one, C.sections[one].title) : '') + head('Appliquer', one ? esc(C.sections[one].title) : esc(N.quiz), one ? 'Six exercices sur cette notion. Le calcul et le raisonnement révèlent ce que la lecture laisse croire acquis.' : 'Une série sur tes notions lues, en priorité les plus fragiles. Chaque réponse ajuste ta maîtrise.')
      + `<div class="quiz-tools">${one && AI.hasKey() ? '<button class="btn quiet small" id="aiQ">' + icon('bulb') + ' Nouvelles questions IA</button>' : ''}</div><div class="trainer" id="qz"></div>`;
    const box = $('#qz');
    if (!pool.length) { box.innerHTML = `<div class="done-box"><h2>Aucune notion lue pour l’instant</h2><p class="muted">Commence par la <a class="link" href="#today">notion du jour</a> : les exercices porteront sur ce que tu as compris.</p></div>`; return; }
    let items = buildQuiz(pool, one ? 6 : 8), i = 0, score = 0, answered = false;
    const per = {};
    if (!items.length) { box.innerHTML = `<div class="done-box"><p class="muted">Pas encore d’exercice pour cette notion. ${AI.hasKey() ? 'Génère des questions avec l’IA ci-dessus.' : ''}</p></div>`; }
    const aiBtn = $('#aiQ');
    if (aiBtn) aiBtn.onclick = async () => {
      aiBtn.disabled = true; aiBtn.textContent = 'Génération…';
      try {
        const r = await AI.makeQuiz(C.plain(one), 4);
        const fresh = (r.items || []).filter(x => x.opts && x.opts.length >= 2).map((x, k) => ({ id: `ai:${one}:${Date.now()}:${k}`, sec: one, q: esc(x.q), opts: x.opts.map(esc), a: 0, expl: esc(x.expl), ai: true }));
        aiPool[one] = (aiPool[one] || []).concat(fresh);
        // Série terminée (ou vide) : on repart sur les nouvelles questions ; sinon elles viennent juste après la question en cours
        if (i >= items.length) { items = fresh; i = 0; score = 0; Object.keys(per).forEach(k => delete per[k]); show(); }
        else items.splice(i + 1, 0, ...fresh);
        aiBtn.disabled = false; aiBtn.innerHTML = `${icon('bulb')} ${fresh.length} questions ajoutées, encore ?`;
      } catch (e) { toast(esc(e.message)); aiBtn.disabled = false; aiBtn.innerHTML = icon('bulb') + ' Nouvelles questions IA'; }
    };
    function show() {
      answered = false;
      if (i >= items.length) return finish();
      const it = items[i], s = C.sections[it.sec];
      const order = it.opts ? (it.keepOrder ? it.opts.map((_, k) => k) : shuffle(it.opts.map((_, k) => k))) : null;
      box.innerHTML = `<div class="meta"><span>Exercice</span><div class="meter"><i style="width:${i / items.length * 100}%"></i></div><span>${i + 1} / ${items.length}</span></div>
        <span class="eyebrow accent">${esc(chOf(it.sec).short)} · ${esc(s.title)}${it.ai ? ' · IA' : ''}</span>
        <div class="q-text">${it.q}</div>${notationsToggle(it.q + ' ' + (it.opts || []).join(' '), it.sec)}
        ${order ? `<div class="opts-col">${order.map(k => `<button class="opt" data-k="${k}">${it.opts[k]}</button>`).join('')}</div>` : `
        <div class="answer-row"><input id="qIn" inputmode="decimal" autocomplete="off" placeholder="Ta réponse${it.unit ? ' (' + esc(it.unit) + ')' : ''}"><button class="btn" id="qCheck">Vérifier</button></div>
        <p class="muted small">Virgule ou point acceptés. Calculatrice autorisée, comme à l’examen.</p>`}
        <div id="qRes"></div>`;
      if (order) $$('.opt', box).forEach(b => b.onclick = () => check(+b.dataset.k, b));
      else {
        const inp = $('#qIn'); inp.focus();
        $('#qCheck').onclick = () => check(inp.value);
        inp.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); answered ? (i++, show()) : check(inp.value); } };
      }
    }
    function check(val, btn) {
      if (answered) return;
      const it = items[i];
      let ok, shown;
      if (it.opts) { ok = val === it.a; shown = it.opts[it.a]; }
      else {
        const x = parseNum(val); if (x === null) { $('#qRes').innerHTML = '<p class="err small">Entre un nombre.</p>'; return; }
        ok = Math.abs(x - it.a) <= Math.max(it.tol, 1e-9) + 1e-12;
        shown = `$${C.u.f(it.a, decimalsFor(it.tol))}$${it.unit ? ' ' + esc(it.unit) : ''}`;
      }
      answered = true;
      if (ok) score++;
      (per[it.sec] = per[it.sec] || { n: 0, ok: 0 }).n++; if (ok) per[it.sec].ok++;
      Store.recordTopic(it.sec, ok);
      if (btn) { btn.classList.add(ok ? 'good' : 'bad'); if (!ok) $$('.opt', box).find(b => +b.dataset.k === it.a).classList.add('good'); }
      $$('.opt', box).forEach(b => b.disabled = true);
      $('#qRes').innerHTML = `<div class="feedback"><span class="verdict ${ok ? 'good' : 'bad'}">${icon(ok ? 'check' : 'x')} ${ok ? 'Correct' : 'Pas tout à fait'}</span>
        ${it.opts ? '' : `<div class="solution">${shown}</div>`}
        ${it.expl ? `<div class="expl">${it.expl}</div>` : ''}
        <div class="row">${!ok ? `<a class="btn quiet small" href="#course/${it.sec}">Revoir la fiche</a>` : ''}<button class="btn" id="qNext">Suivant ${icon('arrow')}</button></div></div>`;
      $('#qNext').onclick = () => { i++; show(); };
      $('#qNext').focus();
    }
    function finish() {
      Store.day().exercises++; Store.save();
      const rows = Object.entries(per).map(([sec, r]) => `<tr><td>${secLink(sec)}</td><td>${r.ok} / ${r.n}</td><td>${LEVEL_NAMES[level(sec)]}</td></tr>`).join('');
      const weak = Object.entries(per).filter(([, r]) => r.ok < r.n).map(([sec]) => sec);
      box.innerHTML = `<div class="done-box"><span class="eyebrow">Résultat</span><div class="score">${score}<span class="muted" style="font-size:1.4rem"> / ${items.length}</span></div>
        <p class="muted" style="margin-top:14px">${score >= items.length * 0.8 ? 'Solide. Pour aller au fond, explique une de ces notions au tuteur sans regarder tes notes.' : score >= items.length * 0.5 ? 'En bonne voie. Relis la fiche des notions ratées, puis refais une série.' : 'Reprends les fiches ci-dessous : relis l’idée en une phrase, puis les définitions, et recommence.'}</p>
        <table class="left"><tr><th>Notion</th><th>Score</th><th>Palier</th></tr>${rows}</table>
        <div class="row"><button class="btn" id="again">Nouvelle série</button>${weak.length ? `<a class="btn ghost" href="#course/${weak[0]}">Revoir : ${esc(C.sections[weak[0]].title)}</a>` : ''}${AI.hasKey() && (one || weak[0]) ? `<a class="btn ghost" href="#tutor/oral/${one || weak[0]}">L’expliquer au tuteur</a>` : ''}</div></div>`;
      $('#again').onclick = () => { items = buildQuiz(pool, one ? 6 : 8); i = 0; score = 0; Object.keys(per).forEach(k => delete per[k]); show(); };
    }
    if (items.length) show();
  };

  // =====================================================================
  // FICHES : chapitres, notions, et la page d'une notion
  // =====================================================================
  const courseTabs = active => `<div class="tabs"><a class="${active === 'ch' ? 'active' : ''}" href="#course">Chapitres</a><a class="${active === 'gl' ? 'active' : ''}" href="#glossary">Glossaire des notations</a></div>`;
  routes.glossary = () => {
    area = 'conv';
    view.innerHTML = head('Cours', 'Glossaire des notations', 'Chaque symbole du cours, comment le lire et ce qu’il désigne. Un même symbole peut changer de sens d’un chapitre à l’autre : le glossaire est donc rangé par chapitre, et chaque entrée renvoie à la notion où le symbole apparaît pour la première fois.')
      + courseTabs('gl') + `<label class="field"><span>Chercher</span><input id="glQ" placeholder="ex. epsilon, i.i.d., regret, ACF"></label>`
      + spaceChs().map(ch => {
        const text = ch.sections.map(id => C.sections[id].fiche + ' ' + C.sections[id].summary).join(' ');
        const list = C.notationsIn(text, ch.id).sort((a, b) => ch.sections.indexOf(C.firstUse(a, ch.id)) - ch.sections.indexOf(C.firstUse(b, ch.id)));
        return list.length ? `<section class="section gl-ch"><div class="section-head"><h2>${esc(ch.short)}</h2><span class="muted small">${list.length} notations</span></div><dl class="gl">${list.map(g => {
          const f = C.firstUse(g, ch.id);
          return `<div class="nt" data-s="${esc((g.name + ' ' + g.sym).toLowerCase())}"><dt>$${g.sym}$</dt><dd><b>${esc(g.name)}</b>${f ? ` <a class="link small" href="#course/${f}">${esc(C.sections[f].title)}</a>` : ''}<br>${g.def}</dd></div>`;
        }).join('')}</dl></section>` : '';
      }).join('');
    // Recherche : aussi par nom LaTeX (« epsilon » trouve \epsilon)
    $('#glQ').oninput = e => {
      const q = e.target.value.trim().toLowerCase();
      $$('.gl .nt').forEach(el => el.style.display = !q || el.dataset.s.includes(q) ? '' : 'none');
      $$('.gl-ch').forEach(sct => sct.style.display = $$('.nt', sct).some(el => el.style.display !== 'none') ? '' : 'none');
    };
  };

  routes.course = (sec) => {
    area = 'conv';
    if (sec && C.sections[sec]) return secView(sec);
    const proj = curSpace() === 'projet';
    const tpHead = ['Espace TP', 'Les séances de TP', 'Une fiche par étape de chaque TP : ce qu’il faut savoir avant, la démarche, le code, les résultats attendus (tirés de vraies exécutions) et les questions à préparer. Les solutions sont repliées : essaie d’abord. Coche « Dans ma séance » pour le TP qui arrive.'];
    view.innerHTML = (curSpace() === 'tp' ? head(...tpHead) : head(proj ? 'Espace Projet' : 'Cours', 'Les chapitres', proj ? 'Ce qu’il faut maîtriser à fond pour le projet et le TFE : Active learning, puis Bandits, puis le cas TFE. Chaque notion va de l’idée au savoir-faire chiffré, puis à la version précise et au lien avec la banque.' : 'Les chapitres actifs alimentent ta séance du jour, notion par notion, dans l’ordre du cours. Active un chapitre pas encore vu pour prendre de l’avance.'))
      + courseTabs('ch') + spaceChs().map(ch => {
        const on = activeChs().includes(ch.id), nRead = ch.sections.filter(isRead).length;
        return `<div class="chapter ${on ? 'on' : ''}">
          <div class="chapter-head"><div><span class="eyebrow">${ch.space === 'tp' ? `Séance de TP${ch.lab && ch.lab.graded ? ' · évaluée' : ''}` : ch.space === 'projet' ? 'Espace Projet' : ch.seen ? `Vu en cours le ${new Date(ch.seen).toLocaleDateString('fr-BE', { day: 'numeric', month: 'long' })}` : 'Pas encore vu en cours'} · ${esc(ch.source)}</span>
            <h2>${esc(ch.title)}</h2><p class="muted">${esc(ch.pitch)}</p></div>
            <label class="check toggle"><input type="checkbox" data-ch="${ch.id}" ${on ? 'checked' : ''}> Dans ma séance</label></div>
          <div class="meter ${meterCls(pct(chMastery(ch.id)))}"><i style="width:${pct(chMastery(ch.id))}%"></i></div>
          <p class="small muted">${nRead} / ${ch.sections.length} notions comprises · maîtrise ${pct(chMastery(ch.id))} %</p>
          <ol class="sec-list">${ch.sections.map(id => `<li><a href="#course/${id}"><span class="dot lv${level(id)}"></span><span class="t">${esc(C.sections[id].title)}</span><span class="muted small">${LEVEL_NAMES[level(id)]}</span></a></li>`).join('')}</ol></div>`;
      }).join('');
    $$('[data-ch]').forEach(cb => cb.onchange = () => {
      if (!cb.checked && activeChs().length === 1) { cb.checked = true; toast('Garde au moins un chapitre actif.'); return; }
      setActive(cb.dataset.ch, cb.checked); go();
    });
  };

  function secView(sec) {
    currentSec = sec;
    followSpace(sec);
    const s = C.sections[sec], ch = chOf(sec), idx = ch.sections.indexOf(sec);
    const prev = ch.sections[idx - 1], next = ch.sections[idx + 1], lv = level(sec), read = isRead(sec);
    const nextStep = [
      { href: null, label: '' },
      { href: '#cards/s/' + sec, label: `Apprendre ses ${secCards(sec).length} cartes maintenant` },
      { href: '#quiz/' + sec, label: 'S’entraîner sur cette notion' },
      { href: '#tutor/oral/' + sec, label: 'L’expliquer sans notes' },
      { href: '#tutor/ask/' + sec, label: 'Approfondir avec le tuteur' },
    ][lv];
    view.innerHTML = `<div class="sec-page">` + backLink('#course', ch.title) + `
      <div class="page-head"><span class="eyebrow">${esc(ch.short)} · notion ${idx + 1} / ${ch.sections.length}${s.slides ? ` · slides ${esc(s.slides)}` : ''}</span><h1>${esc(s.title)}</h1></div>
      ${stageBar(sec, true)}
      <div class="idea"><span class="eyebrow">L’idée en une phrase</span><p>${esc(s.summary)}</p></div>
      ${notationsBox(sec, !read)}
      <article class="panel fiche">${s.fiche}</article>
      ${(s.notes || []).length ? `<section class="notes"><div class="section-head"><h2>Tes notes de cours</h2><span class="muted small">reprises de ton PDF annoté</span></div>
        ${s.notes.map(n => `<div class="note"><span class="eyebrow">Slide ${n.p}</span><p>« ${esc(n.t)} »</p>${n.fix ? `<p class="fix-note">${icon('bulb')} <b>Relecture :</b> ${esc(n.fix)}</p>` : ''}</div>`).join('')}</section>` : ''}
      <div class="sec-actions">
        ${read ? `<span class="ok-mark">${icon('check')} Comprise</span>${nextStep.href ? `<a class="btn" href="${nextStep.href}">${esc(nextStep.label)} ${icon('arrow')}</a>` : ''}`
        : `<button class="btn" id="markRead">${icon('check')} J’ai compris l’idée : ajouter ses ${secCards(sec).length} cartes à mes révisions</button>`}
        ${hasEx(sec) ? `<a class="btn quiet" href="#quiz/${sec}">Exercices</a>` : ''}
        <a class="btn quiet" href="#tutor/ask/${sec}">${icon('chat')} Demander au tuteur</a>
      </div>
      ${read ? '' : '<p class="muted small">Prends le temps de pouvoir redire l’idée en une phrase et les définitions encadrées. Ensuite seulement, valide : les cartes et les exercices vérifieront.</p>'}
      <div class="pager">${prev ? `<a href="#course/${prev}">${icon('back')} ${esc(C.sections[prev].title)}</a>` : '<span></span>'}${next ? `<a href="#course/${next}">${esc(C.sections[next].title)} ${icon('arrow')}</a>` : ''}</div></div>`;
    const mr = $('#markRead');
    if (mr) mr.onclick = () => { setT('read:' + sec, { score: 1 }); toast(`Notion ajoutée : ${secCards(sec).length} cartes arrivent dans tes révisions.`, 3500); go(); };
  }

  // =====================================================================
  // TUTEUR : explications, mode socratique, oral d'examen, et méthode Feynman
  // =====================================================================
  const MODES = [['explain', 'Explique-moi'], ['socratic', 'Fais-moi trouver'], ['examiner', 'Oral d’examen'], ['link', 'Relier au reste']];
  routes.tutor = (mode, sec) => {
    area = 'conv';
    followSpace(sec);
    if (mode === 'oral' && C.sections[sec]) return feynman(sec);
    const chosen = C.sections[sec] ? sec : (currentSec || readSecs().slice(-1)[0] || activeSecs()[0]);
    const m = MODES.some(x => x[0] === mode) ? mode : mode === 'ask' ? 'explain' : 'explain';
    const options = spaceChs().map(ch => `<optgroup label="${esc(ch.short)}">${ch.sections.map(id => `<option value="${id}" ${id === chosen ? 'selected' : ''}>${isRead(id) ? '' : '○ '}${esc(C.sections[id].title)}</option>`).join('')}</optgroup>`).join('');
    view.innerHTML = head('Tuteur', esc(N.tutor), 'Un tuteur qui connaît tes fiches et tes notes. Pose tes questions, fais-toi interroger comme à l’oral, ou laisse-le te guider sans donner la réponse.')
      + (AI.hasKey() ? '' : noKey('Le tuteur'))
      + `<div class="tutor-bar"><label class="field"><span>Notion</span><select id="tSec">${options}</select></label>
        <div class="chips" id="tModes">${MODES.map(([k, l]) => `<button class="chip ${k === m ? 'on' : ''}" data-m="${k}">${esc(l)}</button>`).join('')}</div>
        <a class="btn quiet small" id="tOral" href="#tutor/oral/${chosen}">${icon('mic')} L’expliquer sans notes</a></div>
        <div class="chat-page tutor"><div class="chat" id="chat"></div>
        <div class="composer"><button class="mic" id="tMic" title="Parler"></button><textarea id="tIn" rows="2" placeholder="Ta question (Entrée pour envoyer, Maj+Entrée pour aller à la ligne)"></textarea>
          <div class="composer-side"><button class="btn small" id="tSend">Envoyer</button></div></div>
        <p class="small err" id="tErr"></p></div>`;
    let curSec = chosen, curMode = m, history = [], busy = false;
    const chat = $('#chat'), input = $('#tIn');
    const ctx = () => `${C.plain(curSec)}\n\n(Chapitre : ${chOf(curSec).title}. ${chOf(curSec).pitch})`;
    function intro() {
      history = []; chat.innerHTML = '';
      const s = C.sections[curSec];
      const hello = {
        explain: `Notion : **${s.title}**. Que veux-tu que je t’explique ? Par exemple : « pourquoi cette hypothèse ? », « un exemple chiffré », « la preuve étape par étape ».`,
        socratic: `On travaille **${s.title}** sans que je te donne la réponse. Dis-moi ce que tu veux comprendre, je te guiderai par questions.`,
        examiner: `Oral d’examen sur **${s.title}**. Dis « prêt » et je pose la première question.`,
        link: `Relions **${s.title}** au reste du cours et à des applications. Par quoi veux-tu commencer ?`,
      }[curMode];
      addMsg('ai', hello, false);
    }
    function addMsg(who, text, push = true) {
      if (push) history.push({ role: who === 'ai' ? 'assistant' : 'user', content: text });
      const el = document.createElement('div');
      el.className = 'msg ' + (who === 'ai' ? 'ai' : 'me');
      el.innerHTML = `<span class="name">${who === 'ai' ? 'Tuteur' : 'Toi'}</span><div class="bubble">${who === 'ai' ? richText(text) : esc(text)}</div>`;
      chat.appendChild(el); el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
    async function send() {
      const txt = input.value.trim(); if (!txt || busy) return;
      if (!AI.hasKey()) { $('#tErr').innerHTML = 'Ajoute d’abord ta clé IA dans les <a class="link" href="#settings">réglages</a>.'; return; }
      if (currentListener) currentListener.stop();
      input.value = ''; addMsg('me', txt); busy = true;
      const wait = document.createElement('div'); wait.className = 'thinking'; wait.textContent = 'Le tuteur réfléchit…'; chat.appendChild(wait);
      try { const r = await AI.tutor(ctx(), history, curMode); wait.remove(); addMsg('ai', r); $('#tErr').textContent = ''; }
      catch (e) { wait.remove(); $('#tErr').textContent = e.message; history.pop(); }
      busy = false;
    }
    $('#tSec').onchange = e => { curSec = e.target.value; currentSec = curSec; $('#tOral').href = '#tutor/oral/' + curSec; intro(); };
    $('#tModes').onclick = e => { const b = e.target.closest('[data-m]'); if (!b) return; curMode = b.dataset.m; $$('#tModes .chip').forEach(x => x.classList.toggle('on', x === b)); intro(); };
    $('#tSend').onclick = send;
    input.onkeydown = e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } };
    micFor($('#tMic'), input);
    intro();
  }

  // Méthode Feynman : expliquer une notion sans notes ; l'IA évalue (sinon auto-évaluation sur les points clés)
  function feynman(sec) {
    currentSec = sec;
    const s = C.sections[sec], cards = secCards(sec);
    const prompts = [`Explique « ${s.title} » à un camarade qui n’a pas suivi le cours : l’idée, les définitions ou l’énoncé précis, et pourquoi c’est important.`, ...cards.map(c => c.q)];
    let qi = 0;
    view.innerHTML = backLink('#course/' + sec, s.title) + head('Approfondir', 'L’expliquer sans notes', 'Ferme tes fiches. Explique à voix haute ou par écrit, comme à l’oral. Ce que tu n’arrives pas à formuler, tu ne le maîtrises pas encore : c’est exactement ce qu’on cherche.')
      + `<div class="panel"><span class="eyebrow accent">${esc(chOf(sec).short)} · ${esc(s.title)}</span>
        <div class="q-text" id="fQ"></div><button class="link small" id="fOther">Autre question</button>
        <div class="composer static"><button class="mic" id="fMic" title="Parler"></button><textarea id="fIn" rows="6" placeholder="Ton explication…"></textarea></div>
        <div class="row"><button class="btn" id="fGo">${AI.hasKey() ? 'Faire évaluer' : 'Comparer aux points clés'}</button></div></div>
        <div id="fRes"></div>`;
    const setQ = () => { $('#fQ').innerHTML = qi === 0 ? esc(prompts[0]) : prompts[qi]; };
    setQ();
    $('#fOther').onclick = () => { qi = (qi + 1) % prompts.length; setQ(); $('#fRes').innerHTML = ''; };
    micFor($('#fMic'), $('#fIn'));
    const record = score => {
      const t = T('oral:' + sec);
      setT('oral:' + sec, { n: (t ? t.n : 0) + 1, ok: (t ? t.ok : 0) + (score >= 0.7 ? 1 : 0), score: t && t.n ? 0.4 * t.score + 0.6 * score : score });
    };
    $('#fGo').onclick = async () => {
      const ans = $('#fIn').value.trim(), q = qi === 0 ? prompts[0] : prompts[qi].replace(/<[^>]+>/g, '');
      if (currentListener) currentListener.stop();
      if (!ans) { $('#fRes').innerHTML = '<p class="err small">Écris ou dis d’abord ton explication.</p>'; return; }
      if (!AI.hasKey()) {
        $('#fRes').innerHTML = `<div class="panel"><span class="eyebrow">Auto-évaluation</span><p class="small muted">Coche honnêtement les points que ton explication contenait.</p>
          ${cards.map((c, k) => `<label class="check keypoint"><input type="checkbox" data-kp="${k}"><span><b>${c.q}</b><br>${c.a}</span></label>`).join('')}
          <div class="row"><button class="btn" id="fSelf">Valider</button></div></div>`;
        $('#fSelf').onclick = () => { const k = $$('[data-kp]:checked').length; record(k / Math.max(1, cards.length)); toast(`Couverture : ${k} / ${cards.length} points clés.`, 3000); go(); };
        return;
      }
      $('#fGo').disabled = true; $('#fRes').innerHTML = '<p class="thinking">Évaluation…</p>';
      try {
        const r = await AI.evaluate(C.plain(sec), q, ans);
        const sc = Math.max(0, Math.min(100, +r.score || 0));
        record(sc / 100);
        const list = (title, arr, cls) => arr && arr.length ? `<div class="eval-block ${cls}"><span class="eyebrow">${title}</span><ul>${arr.map(x => `<li>${richText(x).replace(/^<p>|<\/p>$/g, '')}</li>`).join('')}</ul></div>` : '';
        $('#fRes').innerHTML = `<div class="panel eval"><div class="eval-head"><div class="score">${sc}<span class="muted"> / 100</span></div><p>${richText(r.verdict)}</p></div>
          ${list('Juste', r.good, 'good')}${list('Manquant', r.missing, 'mid')}${list('À corriger', r.errors, 'bad')}
          <details ${sc < 70 ? 'open' : ''}><summary>Réponse modèle</summary><div class="model">${richText(r.model)}</div></details>
          ${r.next ? `<div class="tip"><b>Pour aller plus loin :</b> ${richText(r.next).replace(/^<p>|<\/p>$/g, '')}</div>` : ''}
          <div class="row"><button class="btn" id="fAgain">Réessayer</button><a class="btn ghost" href="#tutor/ask/${sec}">En discuter avec le tuteur</a></div></div>`;
        $('#fAgain').onclick = () => { $('#fIn').value = ''; $('#fRes').innerHTML = ''; $('#fGo').disabled = false; $('#fIn').focus(); };
      } catch (e) { $('#fRes').innerHTML = `<p class="err">${esc(e.message)}</p>`; }
      $('#fGo').disabled = false;
    };
  }

  // Bouton flottant : une question rapide au tuteur, sur la notion affichée
  $('#fabAsk').onclick = () => {
    const sec = currentSec || readSecs().slice(-1)[0] || activeSecs()[0];
    const box = modal(`<span class="eyebrow">Question rapide · ${esc(C.sections[sec].title)}</span><h2 style="margin-bottom:16px">Une question ?</h2>
      ${AI.hasKey() ? '' : noKey('Le tuteur')}
      <textarea id="mQ" rows="3" placeholder="ex. : pourquoi le facteur 2 dans Hoeffding ?"></textarea>
      <div class="row"><button class="btn" id="mGo">Demander</button><a class="link small" href="#tutor/ask/${sec}" data-close>Ouvrir le tuteur complet</a></div><div id="mA"></div>`);
    $('#mQ', box).focus();
    $('#mGo', box).onclick = async () => {
      const q = $('#mQ', box).value.trim(); if (!q || !AI.hasKey()) return;
      $('#mA', box).innerHTML = '<p class="thinking">Le tuteur réfléchit…</p>';
      try { const r = await AI.tutor(C.plain(sec), [{ role: 'user', content: q }], 'explain'); $('#mA', box).innerHTML = `<div class="review">${richText(r)}</div>`; }
      catch (e) { $('#mA', box).innerHTML = `<p class="err">${esc(e.message)}</p>`; }
    };
  };

  // =====================================================================
  // PROJET : choisir le chapitre qui t'intéresse le plus, et s'y préparer
  // =====================================================================
  const PROJECTS = {
    slt: [
      ['Les bornes face au réel', 'Comparer les garanties de Hoeffding, de l’union bound et de la borne VC à l’erreur de test réellement observée, en faisant varier n et la complexité (arbres de profondeur croissante, modèles linéaires) sur un jeu de crédit (German Credit, Give Me Some Credit).', 2],
      ['Excès de risque sur données synthétiques', 'Générer des données dont on connaît η(x), donc le classifieur et le risque de Bayes, et mesurer séparément l’erreur d’approximation et l’erreur d’estimation quand H et n changent.', 2],
      ['Mesurer la capacité', 'Vérifier par simulation des fonctions de croissance connues, estimer empiriquement la dimension VC ou la complexité de Rademacher de petits réseaux, et confronter au nombre de paramètres.', 3],
    ],
    al: [
      ['Réduire le coût d’annotation', 'Classer des réclamations bancaires (base publique CFPB) en n’étiquetant qu’une fraction des textes : moins confiant, marge, entropie, QBC contre tirage aléatoire, courbes d’apprentissage.', 2],
      ['La myopie en images', 'Reproduire l’inconsistance de l’échantillonnage par incertitude sur des données 1D et 2D, puis la corriger (pondération par densité, mélange avec du hasard).', 1],
      ['Actif pour un RAG', 'Choisir quelles paires question-passage faire juger par un expert pour entraîner un reranker : lien direct avec ton stage sur le RAG souverain.', 3],
    ],
    bd: [
      ['Le grand comparatif', 'ETC, ε-greedy, UCB1, KL-UCB et Thompson sur des bandits de Bernoulli : courbes de regret moyennées, comparaison à la borne de Lai-Robbins, sensibilité à Δ.', 1],
      ['A/B testing bancaire', 'Utiliser UCI Bank Marketing comme simulateur d’offres commerciales : bandit contre A/B test classique, gains perdus pendant l’expérience, extension contextuelle (LinUCB).', 2],
      ['Identifier le meilleur bras', 'LUCB contre échantillonnage uniforme : nombre de tirages nécessaires en fonction de δ et de l’écart entre bras (cadre essai clinique).', 2],
    ],
    rl: [
      ['De Bellman au q-learning', 'Sur GridWorld ou FrozenLake : value iteration, policy iteration et q-learning, effet de γ, ε et α, vitesse de convergence comparée aux bornes du cours.', 1],
      ['Démonter le DQN', 'DQN sur CartPole avec et sans experience replay, réseau cible, double DQN : une étude d’ablation qui montre à quoi sert chaque astuce.', 2],
      ['RL et finance', 'Un environnement jouet d’allocation ou d’exécution d’ordres, q-learning approché, et une discussion honnête de la non-stationnarité des marchés.', 3],
    ],
    ts: [
      ['Box-Jenkins de bout en bout', 'Analyse complète d’une série économique belge ou européenne (inflation Statbel, taux BCE, EUR/USD) : stationnarisation, identification ACF/PACF, SARIMA, diagnostic Ljung-Box, prévisions avec intervalles.', 2],
      ['SARIMA contre lissage', 'Sur AirPassengers ou une série de ventes : SARIMA, lissage exponentiel et prévision naïve, évalués par origine glissante.', 2],
      ['Demande de cash aux distributeurs', 'Prévoir les retraits aux distributeurs (jeu NN5) : saisonnalité hebdomadaire, valeurs manquantes, intervalles de prévision utiles à la gestion de trésorerie.', 3],
    ],
  };
  routes.project = () => {
    area = 'conv';
    if (curSpace() === 'projet') return roadmap();
    if (curSpace() === 'tp') return tpBoard();
    const interest = ch => { const t = T('int:' + ch); return t ? Math.round(t.score * 5) : 0; };
    const chosen = spaceChs().find(ch => (T('proj:' + ch.id) || {}).score > 0);
    const ranked = spaceChs().sort((a, b) => interest(b.id) - interest(a.id) || chMastery(b.id) - chMastery(a.id));
    const lead = chosen ? `Projet sur <b>${esc(chosen.title)}</b>. Objectif : en maîtriser chaque notion jusqu’au palier « Approfondir ».` : 'Note ton intérêt pour chaque chapitre au fil des cours. Quand tu choisis, ce chapitre devient prioritaire dans ta séance.';
    view.innerHTML = head('Projet', 'Choisir et préparer ton projet', lead)
      + (chosen ? (() => {
        const ids = chosen.sections, nDone = ids.filter(id => level(id) >= 4).length, nextUp = ids.find(id => level(id) < 4);
        return `<div class="panel surface"><span class="eyebrow accent">Préparation du projet</span><h3>${nDone} / ${ids.length} notions maîtrisées</h3>
          <div class="meter ${meterCls(pct(chMastery(chosen.id)))}" style="margin:12px 0"><i style="width:${pct(chMastery(chosen.id))}%"></i></div>
          ${nextUp ? `<p>Prochaine étape : ${secLink(nextUp)} (${LEVEL_NAMES[level(nextUp)].toLowerCase()}).</p>` : '<p>Toutes les notions sont maîtrisées : tu es prêt à défendre ton projet.</p>'}</div>`;
      })() : '')
      + `<div class="proj-grid">${ranked.map(ch => {
        const it = interest(ch.id), isChosen = chosen && chosen.id === ch.id;
        return `<div class="proj ${isChosen ? 'chosen' : ''}"><span class="eyebrow">${ch.seen ? 'Vu en cours' : 'Pas encore vu'} · maîtrise ${pct(chMastery(ch.id))} %</span><h3>${esc(ch.title)}</h3>
          <div class="stars" data-ch="${ch.id}" title="Ton intérêt">${[1, 2, 3, 4, 5].map(k => `<button data-v="${k}" class="${k <= it ? 'on' : ''}" aria-label="${k} sur 5">${icon('star')}</button>`).join('')}</div>
          <ul class="ideas">${(PROJECTS[ch.id] || []).map(([t, d, lvl]) => `<li><b>${esc(t)}</b> <span class="muted small">${'●'.repeat(lvl)}${'○'.repeat(3 - lvl)}</span><br><span class="small">${esc(d)}</span></li>`).join('')}</ul>
          <div class="row">${isChosen ? `<span class="ok-mark">${icon('check')} Chapitre du projet</span><button class="link small" data-unchoose="${ch.id}">Changer</button>` : `<button class="btn small ${chosen ? 'quiet' : ''}" data-choose="${ch.id}">Choisir ce chapitre</button>`}</div></div>`;
      }).join('')}</div>
      <section class="section"><div class="section-head"><h2>Idées sur mesure</h2></div>
        ${AI.hasKey() ? '' : noKey('La génération d’idées')}
        <div class="two-col"><div><label class="field"><span>Chapitre</span><select id="pCh">${spaceChs().map(ch => `<option value="${ch.id}" ${(chosen ? chosen.id : ranked[0].id) === ch.id ? 'selected' : ''}>${esc(ch.title)}</option>`).join('')}</select></label>
          <label class="field"><span>Tes intérêts</span><input id="pInt" value="banque, finance, RAG, aide à la décision"></label>
          <button class="btn" id="pGo" ${AI.hasKey() ? '' : 'disabled'}>Proposer 3 projets</button></div><div id="pOut" class="review" style="display:none"></div></div></section>`;
    $$('.stars').forEach(st => st.onclick = e => { const b = e.target.closest('[data-v]'); if (!b) return; setT('int:' + st.dataset.ch, { score: +b.dataset.v / 5 }); go(); });
    $$('[data-choose]').forEach(b => b.onclick = () => {
      spaceChs().forEach(ch => { if ((T('proj:' + ch.id) || {}).score) setT('proj:' + ch.id, { score: 0 }); });
      setT('proj:' + b.dataset.choose, { score: 1 });
      setActive(b.dataset.choose, true);
      toast('Chapitre choisi : il est maintenant actif dans ta séance du jour.', 4000); go();
    });
    $$('[data-unchoose]').forEach(b => b.onclick = () => { setT('proj:' + b.dataset.unchoose, { score: 0 }); go(); });
    $('#pGo').onclick = async () => {
      const ch = C.chapter($('#pCh').value), out = $('#pOut');
      out.style.display = ''; out.innerHTML = '<p class="thinking">Réflexion…</p>';
      const ctx = `${ch.title}\n${ch.pitch}\n` + ch.sections.map(id => `- ${C.sections[id].title} : ${C.sections[id].summary}`).join('\n');
      try { out.innerHTML = richText(await AI.projectIdeas(ctx, $('#pInt').value)); } catch (e) { out.innerHTML = `<p class="err">${esc(e.message)}</p>`; }
    };
  };

  // Séances de TP (espace TP) : choisir la prochaine séance, et cocher les questions de chaque énoncé
  // (rangées dans les topics 'step:<id>' comme la feuille de route du projet, donc synchronisées).
  function tpBoard() {
    const chs = spaceChs(), st = id => T('step:' + id) || {};
    const nx = T('tp:next'), nextCh = chs.find(c => nx && nx.note === c.id);
    const doneOf = ch => (ch.lab.checklist || []).filter(x => st(x.id).score > 0).length;
    const block = ch => {
      const list = ch.lab.checklist || [], d = doneOf(ch), p = list.length ? pct(d / list.length) : 0;
      const firstOpen = ch.sections.find(id => level(id) < 1);
      return `<section class="section" id="tp-${ch.id}"><div class="section-head"><h2>${esc(ch.title)}</h2><span class="muted small">${d} / ${list.length} questions préparées${ch.lab.graded ? ' · <b>évalué</b>' : ''}</span></div>
        <div class="meter ${meterCls(p)}" style="margin-bottom:12px"><i style="width:${p}%"></i></div>
        <p class="small muted">Dossier Moodle : « ${esc(ch.lab.folder)} » · fichiers : ${ch.lab.files.map(f => `<code>${esc(f)}</code>`).join(', ')}</p>
        <p class="small">${firstOpen ? `Fiche à lire ensuite : ${secLink(firstOpen)}` : `<span class="ok-mark">${icon('check')} Toutes les fiches lues</span>`} · <a class="link" href="#course/${ch.sections[0]}">toutes les fiches de ce TP</a></p>
        <div class="road">${[...new Set(list.map(x => x.group))].map(g => `<h4 class="road-group">${esc(g)}</h4>` + list.filter(x => x.group === g).map(x => `<div class="road-step ${st(x.id).score > 0 ? 'done' : ''}">
          <label class="check"><input type="checkbox" data-step="${x.id}" ${st(x.id).score > 0 ? 'checked' : ''}><span><b>${esc(x.title)}</b>${x.sec ? ` · <a class="link small" href="#course/${x.sec}">fiche</a>` : ''}<br><span class="muted small">${esc(x.hint)}</span></span></label>
          <textarea data-note="${x.id}" rows="1" placeholder="Note : résultat obtenu, valeur, commentaire…">${esc(st(x.id).note || '')}</textarea></div>`).join('')).join('')}</div></section>`;
    };
    view.innerHTML = head('TP', 'Préparer tes séances', 'Chaque TP est découpé en fiches (onglet Fiches) et en questions de l’énoncé à cocher ici. Choisis ta prochaine séance : ses fiches passent en priorité dans ta séance du jour.')
      + `<div class="panel surface"><span class="eyebrow accent">Prochaine séance</span>
        <label class="field"><span>Quel TP ?</span><select id="tpNext"><option value="">Choisir…</option>${chs.map(c => `<option value="${c.id}" ${nextCh && nextCh.id === c.id ? 'selected' : ''}>${esc(c.title)}</option>`).join('')}</select></label>
        ${nextCh ? `<p>${doneOf(nextCh)} / ${(nextCh.lab.checklist || []).length} questions préparées. ${(() => { const nq = (nextCh.lab.checklist || []).find(x => !(st(x.id).score > 0)); return nq ? `Prochaine : <b>${esc(nq.title)}</b>.` : 'Tout est prêt.'; })()}</p>
          <p class="small muted">${esc(nextCh.lab.before)}</p><div class="row"><a class="btn" href="#course/${nextCh.sections.find(id => level(id) < 1) || nextCh.sections[0]}">Ouvrir la fiche suivante ${icon('arrow')}</a><a class="btn ghost" href="#tp-${nextCh.id}" id="goBlock">Voir les questions</a></div>` : '<p class="small muted">Indique quel TP a lieu à la prochaine séance.</p>'}</div>`
      + (nextCh ? [nextCh, ...chs.filter(c => c !== nextCh)] : chs).map(block).join('');
    $('#tpNext').onchange = e => { const id = e.target.value; if (!id) return; setT('tp:next', { score: 1, note: id }); setActive(id, true); go(); };
    const gb = $('#goBlock'); if (gb) gb.onclick = e => { e.preventDefault(); $('#tp-' + nextCh.id).scrollIntoView({ behavior: 'smooth' }); };
    $$('[data-step]').forEach(cb => cb.onchange = () => { setT('step:' + cb.dataset.step, { score: cb.checked ? 1 : 0, note: st(cb.dataset.step).note || '' }); go(); });
    $$('[data-note]').forEach(ta => ta.onchange = () => { const s0 = st(ta.dataset.note); setT('step:' + ta.dataset.note, { score: s0.score || 0, note: ta.value.trim() }); });
  }

  // Feuille de route du projet (espace Projet) : les étapes viennent du chapitre qui porte « project »
  // (projet-tfe.js). Chaque étape cochée et sa note sont rangées dans les topics ('step:<id>'), donc synchronisées.
  function roadmap() {
    const host = spaceChs().find(ch => ch.project), steps = host ? host.project : [];
    const st = id => T('step:' + id) || {};
    const nDone = steps.filter(x => st(x.id).score > 0).length, next = steps.find(x => !(st(x.id).score > 0));
    const p = steps.length ? pct(nDone / steps.length) : 0;
    view.innerHTML = head('Projet', 'Feuille de route', 'Le projet du cours, conçu pour servir le TFE : vérifier des liens de propriété sous budget. Trois paliers, chacun avec un livrable montrable. Ce cadrage est une proposition à valider avec le Prof. Siebert et le promoteur.')
      + `<div class="panel surface"><span class="eyebrow accent">Avancement</span><h3>${nDone} / ${steps.length} étapes</h3>
        <div class="meter ${meterCls(p)}" style="margin:12px 0"><i style="width:${p}%"></i></div>
        ${next ? `<p>Prochaine étape : <b>${esc(next.title)}</b></p>` : '<p>Toutes les étapes sont faites.</p>'}
        <p class="small muted">${host ? `Le chapitre <a class="link" href="#course/${host.sections[host.sections.length - 1]}">${esc(host.title)}</a> détaille chaque palier. ` : ''}Les chapitres Active learning et Bandits de l’espace Projet donnent les savoir-faire à maîtriser d’abord.</p></div>`
      + [...new Set(steps.map(x => x.step))].map(g => `<section class="section"><div class="section-head"><h2>${esc(g)}</h2></div><div class="road">
        ${steps.filter(x => x.step === g).map(x => `<div class="road-step ${st(x.id).score > 0 ? 'done' : ''}">
          <label class="check"><input type="checkbox" data-step="${x.id}" ${st(x.id).score > 0 ? 'checked' : ''}><span><b>${esc(x.title)}</b><br><span class="muted small">${esc(x.hint)}</span></span></label>
          <textarea data-note="${x.id}" rows="1" placeholder="Note : décision, lien, résultat…">${esc(st(x.id).note || '')}</textarea></div>`).join('')}</div></section>`).join('');
    $$('[data-step]').forEach(cb => cb.onchange = () => { setT('step:' + cb.dataset.step, { score: cb.checked ? 1 : 0, note: st(cb.dataset.step).note || '' }); go(); });
    $$('[data-note]').forEach(ta => ta.onchange = () => { const s0 = st(ta.dataset.note); setT('step:' + ta.dataset.note, { score: s0.score || 0, note: ta.value.trim() }); });
  }

  // =====================================================================
  // PROGRÈS
  // =====================================================================
  routes.progress = () => {
    const days = Array.from({ length: 14 }, (_, k) => Store.today(k - 13));
    const goal = S().dailyMinutes;
    const max = Math.max(goal * 1.2, ...days.map(d => Store.totalMin(d)));
    const week = days.slice(-7).reduce((a, d) => a + Store.totalMin(d), 0);
    const order = spaceOrder(), secSet = new Set(order), cards = C.cards.filter(c => secSet.has(c.sec));
    const learned = cards.filter(c => (Store.card(c.id) || {}).box >= 3).length;
    const mastered = order.filter(id => level(id) >= 4).length;
    view.innerHTML = head('Progrès · ' + SPACE_LABEL[curSpace()], esc(N.progress), 'Le temps compte les deux espaces ensemble ; cartes et notions ne comptent que l’espace affiché.') + `
      <div class="stat-row"><div><b>${streak()}</b><span>jours d’affilée</span></div><div><b>${Math.round(week)}</b><span>min cette semaine</span></div><div><b>${learned}</b><span>cartes acquises / ${cards.length}</span></div><div><b>${mastered}</b><span>notions maîtrisées / ${order.length}</span></div></div>
      <div class="panel"><span class="eyebrow">14 derniers jours</span>
        <div class="chart" style="margin-top:16px">${days.map(d => {
      const x = Store.dayAgg(d), v = Store.totalMin(d);
      return `<div class="col" title="${d} : ${Math.round(v)} min"><div class="stack" style="height:${v / max * 100}%">${['vocab', 'gram', 'conv'].map(k => `<div class="seg ${k}" style="flex:${x.min[k]}"></div>`).join('')}</div><span>${d.slice(8)}</span></div>`;
    }).join('')}<div class="goal-line" style="bottom:${goal / max * 100}%"></div></div>
        <div class="legend"><span><i class="seg vocab"></i>Cartes</span><span><i class="seg gram"></i>Exercices</span><span><i class="seg conv"></i>Fiches et tuteur</span><span>Pointillés : objectif</span></div></div>
      ${spaceChs().map(ch => `<div class="panel"><div class="map-head"><b>${esc(ch.title)}</b><span class="muted small">${pct(chMastery(ch.id))} %</span></div>
        <table class="prog"><tr><th>Notion</th><th>Paliers</th><th>Maîtrise</th></tr>${ch.sections.map(id => `<tr><td>${secLink(id)}</td><td>${stageBar(id)}</td><td><span class="meter ${meterCls(pct(mastery(id)))}"><i style="width:${pct(mastery(id))}%"></i></span></td></tr>`).join('')}</table></div>`).join('')}
      <div class="panel"><span class="eyebrow">Sauvegarde</span><p class="muted small">Tes progrès sont stockés dans ce navigateur${Sync.enabled() ? ' et synchronisés avec ton dépôt privé' : ''}. Tu peux aussi les exporter.</p>
        <div class="row"><button class="btn ghost small" id="exp">Exporter</button><label class="btn ghost small">Importer<input type="file" id="imp" accept=".json" hidden></label></div></div>`;
    $('#exp').onclick = () => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([Store.exportData()], { type: 'application/json' }));
      a.download = `${L.id}-progres-${Store.today()}.json`; a.click();
    };
    $('#imp').onchange = async e => {
      const f = e.target.files[0]; if (!f) return;
      try { Store.importData(await f.text()); toast('Import réussi.'); go(); } catch (err) { toast('Fichier invalide.'); }
    };
  };

  // =====================================================================
  // RÉGLAGES
  // =====================================================================
  routes.settings = () => {
    const s = S();
    view.innerHTML = head('Réglages', esc(N.settings)) + `
      <div class="panel"><span class="eyebrow">Séance</span><h3 style="margin-bottom:18px">Rythme quotidien</h3>
        <label class="field"><span>Durée visée par jour (minutes)</span><input id="dMin" type="number" min="5" max="180" value="${s.dailyMinutes}"></label>
        <label class="field"><span>Nouvelles notions par jour</span><select id="nNot">${[1, 2, 3].map(n => `<option ${n === (s.notionsPerDay || 1) ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
        <p class="muted small">Une notion par jour suffit pour couvrir un chapitre en deux semaines tout en l’ancrant. Les jours où un sujet te passionne, « prendre de l’avance » reste toujours possible.</p>
        <label class="field"><span>Nouvelles cartes par jour (maximum)</span><input id="nNew" type="number" min="0" max="50" value="${s.newPerDay}"></label>
        <label class="field"><span>Niveau du tuteur</span><select id="level">${L.levels.map(l => `<option ${l === s.level ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
      </div>
      <div class="panel"><span class="eyebrow">Intelligence artificielle</span><h3 style="margin-bottom:18px">Tuteur, oral et questions générées</h3>
        <label class="field"><span>Fournisseur</span><select id="provider"><option value="gemini">Google Gemini, gratuit (recommandé)</option><option value="openai">Compatible OpenAI : Groq, OpenRouter…</option></select></label>
        <div id="pGemini">
          <ol class="small" style="padding-left:18px;color:var(--ink-2)"><li>Ouvre <a class="link" href="https://aistudio.google.com/apikey" target="_blank" rel="noopener">aistudio.google.com/apikey</a> avec ton compte Google.</li><li>« Create API key », copie la clé.</li><li>Colle-la ci-dessous. Elle reste dans ce navigateur et est partagée avec tes apps de langues.</li></ol>
          <label class="field"><span>Clé API Gemini</span><input id="gKey" type="password" value="${esc(s.geminiKey)}" placeholder="AIza… ou AQ.…"></label>
          <label class="field"><span>Modèle</span><div style="display:flex;gap:10px"><select id="gModel"><option value="${esc(s.geminiModel)}">${esc(s.geminiModel)}</option></select><button class="btn quiet small" id="gList">Charger la liste</button></div></label>
        </div>
        <div id="pOA">
          <label class="field"><span>URL de base</span><input id="oBase" value="${esc(s.oaBase)}"></label>
          <label class="field"><span>Clé API</span><input id="oKey" type="password" value="${esc(s.oaKey)}"></label>
          <label class="field"><span>Modèle</span><input id="oModel" value="${esc(s.oaModel)}"></label>
        </div>
        <label class="field"><span>Budget de requêtes IA par jour</span><input id="dReq" type="number" min="20" max="5000" value="${s.dailyRequests}"></label>
        <div class="row"><button class="btn" id="test">Tester la connexion</button><span id="testOut" class="small"></span></div>
      </div>
      <div class="panel" id="syncPanel"><span class="eyebrow">Téléphone, synchronisation et rappels</span><h3 style="margin-bottom:14px">Même progression sur le PC et le téléphone</h3>
        <div class="notice" id="syncState"></div>
        <p class="small muted">Le même jeton GitHub que pour tes apps de langues (dépôt privé <b>hablemos-data</b>). S’il est déjà saisi dans une de ces apps, il est repris automatiquement.</p>
        <label class="field"><span>Jeton GitHub</span><input id="ghToken" type="password" value="${esc(Sync.cfg().token || '')}" placeholder="github_pat_…"></label>
        <label class="field"><span>Dépôt de progression</span><input id="ghRepo" value="${esc(Sync.cfg().repo || L.dataRepo)}"></label>
        <div class="row"><button class="btn" id="syncGo">Synchroniser maintenant</button></div>
        <div id="phoneBox" style="margin-top:28px;border-top:1px solid var(--line);padding-top:24px"></div>
      </div>`;
    const set = (k, v) => { s[k] = v; if (Store.SHARED_PREFS.includes(k)) Store.touchPrefs(); else Store.save(); };
    $('#provider').value = s.provider;
    const toggleP = () => { $('#pGemini').style.display = s.provider === 'gemini' ? '' : 'none'; $('#pOA').style.display = s.provider === 'gemini' ? 'none' : ''; };
    toggleP();
    $('#provider').onchange = e => { set('provider', e.target.value); toggleP(); };
    $('#gKey').onchange = e => { Store.setSharedKey('geminiKey', e.target.value.trim()); renderPhone(); };
    $('#gModel').onchange = e => set('geminiModel', e.target.value);
    $('#oBase').onchange = e => Store.setSharedKey('oaBase', e.target.value.trim());
    $('#oKey').onchange = e => Store.setSharedKey('oaKey', e.target.value.trim());
    $('#oModel').onchange = e => Store.setSharedKey('oaModel', e.target.value.trim());
    $('#dMin').onchange = e => set('dailyMinutes', Math.max(5, +e.target.value || L.defaults.dailyMinutes));
    $('#dReq').onchange = e => set('dailyRequests', Math.max(20, +e.target.value || 300));
    $('#nNew').onchange = e => set('newPerDay', Math.max(0, +e.target.value || 0));
    $('#nNot').onchange = e => set('notionsPerDay', +e.target.value || 1);
    $('#level').onchange = e => set('level', e.target.value);

    const syncState = () => {
      const st = Sync.status, el = $('#syncState'); if (!el) return;
      el.className = 'notice ' + (!Sync.enabled() ? '' : st.state === 'error' ? 'warn' : 'done');
      el.innerHTML = !Sync.enabled() ? 'Synchro désactivée : colle ton jeton GitHub ci-dessous.'
        : st.state === 'error' ? 'Erreur : ' + esc(st.error)
        : st.state === 'syncing' ? 'Synchronisation en cours…'
        : st.last ? `Synchronisé à ${st.last.toLocaleTimeString('fr-BE', { hour: '2-digit', minute: '2-digit' })}. Appareils : ${esc([Sync.deviceName() + ' (celui-ci)', ...Object.values(Store.state.peers || {}).map(p => p.name)].join(', '))}.`
        : 'Synchro activée.';
    };
    syncState();
    window.addEventListener('sync-status', function onS() { if ($('#syncState')) syncState(); else window.removeEventListener('sync-status', onS); });
    const saveCfg = () => Sync.setCfg({ token: $('#ghToken').value.trim(), repo: $('#ghRepo').value.trim() });
    $('#ghToken').onchange = () => { saveCfg(); renderPhone(); };
    $('#ghRepo').onchange = saveCfg;
    $('#syncGo').onclick = async () => { saveCfg(); await Sync.syncNow(); renderPhone(); };

    async function renderPhone() {
      const box = $('#phoneBox'); if (!box) return;
      const c = Sync.cfg();
      const link = PAGES_URL + '#setup=' + b64url(JSON.stringify({ g: s.geminiKey || '', t: c.token || '', r: c.repo || '' }));
      let ntfy = null;
      if (Sync.enabled()) { try { ntfy = await Sync.readJson('ntfy.json'); } catch (e) { } }
      if (!$('#phoneBox')) return;
      box.innerHTML = `<span class="eyebrow">Sur ton téléphone</span>
        <ol class="small" style="padding-left:18px;color:var(--ink-2)">
          <li>Scanne ce QR code avec l’appareil photo : l’app s’ouvre déjà configurée.</li>
          <li>Ajoute-la à l’écran d’accueil (Android : menu ⋮ puis « Ajouter à l’écran d’accueil » ; iPhone : Partager puis « Sur l’écran d’accueil »).</li></ol>
        <div style="display:flex;gap:24px;align-items:center;flex-wrap:wrap;margin-top:12px"><div id="qr" style="background:#fff;padding:12px;line-height:0"></div>
          <div class="small" style="max-width:340px"><p>Ce QR code contient tes clés : ne le montre à personne.</p><button class="btn quiet small" id="copyLink">Copier le lien</button>
          <p class="muted" style="margin-top:10px">Adresse : <a class="link" href="${PAGES_URL}" target="_blank" rel="noopener">${PAGES_URL.replace('https://', '')}</a></p></div></div>
        <div style="margin-top:24px"><span class="eyebrow">Rappels sur le téléphone (ntfy)</span>
          <p class="small">${ntfy && ntfy.topic ? `Tu es déjà abonné au sujet <b style="user-select:all">${esc(ntfy.topic)}</b> pour tes langues : rien à faire, le Machine Learning y arrive aussi, avec la notion du jour dans le message.` : 'Les rappels passent par l’app ntfy, comme pour tes langues : abonne-toi au même sujet (voir AppLangues).'} Un rappel toutes les 2 h entre 8 h et 20 h tant que la séance du jour n’est pas faite.</p></div>`;
      try {
        await loadScript('js/vendor/qrcode.min.js');
        new QRCode($('#qr'), { text: link, width: 208, height: 208, correctLevel: QRCode.CorrectLevel.M });
      } catch (e) { $('#qr').textContent = 'QR code indisponible'; }
      $('#copyLink').onclick = async () => { try { await navigator.clipboard.writeText(link); $('#copyLink').textContent = 'Lien copié'; } catch (e) { prompt('Copie ce lien :', link); } };
    }
    renderPhone();

    $('#gList').onclick = async () => {
      try {
        const models = await AI.listGeminiModels();
        const ids = ['gemini-flash-latest', 'gemini-flash-lite-latest', ...models.map(m => m.id)];
        $('#gModel').innerHTML = [...new Set(ids)].map(id => `<option value="${esc(id)}" ${id === s.geminiModel ? 'selected' : ''}>${esc(id)}</option>`).join('');
      } catch (e) { toast('Impossible de lister les modèles : ' + esc(e.message)); }
    };
    $('#test').onclick = async () => {
      $('#testOut').textContent = '…';
      try { const r = await AI.chat('Réponds en une phrase courte, en français.', [{ role: 'user', content: 'Donne en une phrase l’intuition de l’inégalité de Hoeffding.' }]); $('#testOut').innerHTML = `${icon('check')} ${esc(r)}`; }
      catch (e) { $('#testOut').innerHTML = `<span class="err">${esc(e.message)}</span>`; }
    };
  };

  importSetupFromHash();
  go();
  Store.sync(true);
  if (Sync.enabled()) Sync.syncNow();
  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => { });
})();
