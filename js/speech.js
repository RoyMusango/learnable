// Voix : synthèse (voix natives de la langue uniquement) et reconnaissance vocale.
// La configuration vient de LANG.voice : langues acceptées, variante préférée, prénoms des voix.
(function (global) {
  const synth = global.speechSynthesis;
  const V = LANG.voice;

  let voices = [];
  function quality(v) {
    return (/natural|neural/i.test(v.name) ? 10 : 0) + (/online/i.test(v.name) ? 3 : 0) + (/google/i.test(v.name) ? 5 : 0);
  }
  // Variante choisie (ex. en-GB ou en-US), sinon la variante par défaut de la langue
  function preferredRe() {
    const variant = Store.settings.voiceVariant || V.defaultVariant;
    return new RegExp('^' + variant.replace('-', '[-_]') + '$', 'i');
  }
  const isPreferred = v => preferredRe().test(v.lang);
  function loadVoices() {
    const all = synth ? synth.getVoices() : [];
    // Uniquement des voix de la langue cible ; jamais une voix d'une autre langue
    voices = all.filter(v => V.accept.test(v.lang))
      .sort((a, b) => (isPreferred(b) - isPreferred(a)) || (quality(b) - quality(a)));
    global.dispatchEvent(new Event('voiceschanged-app'));
  }
  if (synth) { loadVoices(); synth.onvoiceschanged = loadVoices; }

  const mainVoices = () => voices.filter(isPreferred);
  function genderOf(v) { return V.female.test(v.name) ? 'f' : V.male.test(v.name) ? 'm' : '?'; }

  // Voix choisie dans les réglages, ou la meilleure voix de la variante préférée. `gender` varie selon le personnage.
  function pickVoice(gender) {
    const pool = mainVoices().length ? mainVoices() : voices;
    if (gender && pool.length > 1) {
      const g = pool.filter(v => genderOf(v) === gender).sort((a, b) => quality(b) - quality(a));
      if (g.length) return g[0];
    }
    return pool.find(v => v.voiceURI === Store.settings.ttsVoice) || pool[0] || null;
  }

  function status() {
    if (!synth) return { ok: false, msg: 'Ce navigateur ne sait pas lire à voix haute.' };
    if (!voices.length) return { ok: false, msg: V.missing };
    if (!mainVoices().length) return { ok: true, warn: true, msg: V.onlyOther };
    const best = mainVoices()[0];
    if (!quality(best)) return { ok: true, warn: true, msg: V.robotic };
    return { ok: true, msg: best.name };
  }

  let warned = false, last = null, speakId = 0, watchdog = null;
  function speak(text, { rate, onend, gender } = {}) {
    // onend n'est appelé qu'une fois, et pas si une autre lecture a pris la place (sinon le micro s'ouvrirait pendant qu'on parle)
    const id = ++speakId; let fired = false;
    clearInterval(watchdog);
    const done = () => { if (fired || id !== speakId) return; fired = true; clearInterval(watchdog); onend && onend(); };
    // Les indications entre parenthèses (verbe à conjuguer, « zij (elle) »…) ne font pas partie de la phrase
    text = String(text || '').replace(/\s*\([^)]*\)/g, '').replace(/\s+([.,!?;:])/g, '$1').trim();
    if (!synth || !text) return done();
    last = { text, gender };
    const voice = pickVoice(gender);
    if (!voice) {
      if (!warned) { warned = true; global.dispatchEvent(new CustomEvent('tts-missing', { detail: status().msg })); }
      return done(); // ne jamais lire avec une voix étrangère
    }
    synth.cancel();
    // Chrome coupe les longs textes : lecture phrase par phrase.
    const parts = text.replace(/\s+/g, ' ').split(/(?<=[.!?…])\s+/).filter(p => p.trim());
    parts.forEach((p, i) => {
      const u = new SpeechSynthesisUtterance(p.trim());
      u.voice = voice; u.lang = voice.lang;
      u.rate = rate || Store.settings.ttsRate;
      if (i === parts.length - 1) { u.onend = done; u.onerror = done; }
      synth.speak(u);
    });
    // Chrome (surtout Android) oublie parfois l'événement de fin : on vérifie nous-mêmes que la voix s'est tue
    if (onend) {
      const t0 = Date.now();
      watchdog = setInterval(() => { if (Date.now() - t0 > 800 && !synth.speaking && !synth.pending) done(); }, 400);
    }
  }
  function stopSpeaking() { speakId++; clearInterval(watchdog); synth && synth.cancel(); }
  // Relit la dernière phrase (après un changement de vitesse)
  function repeat() { if (last) speak(last.text, { gender: last.gender }); }

  // --- Reconnaissance vocale ---
  const SR = global.SpeechRecognition || global.webkitSpeechRecognition;
  const ANDROID = /Android/i.test(navigator.userAgent);
  // Filet de sécurité : un même mot répété 3 fois ou plus d'affilée (« no no no no ») est un bégaiement du moteur
  const cleanRepeats = s => s.replace(/(^|\s)(\S+)(?:\s+\2){2,}(?=\s|$)/gi, '$1$2');

  class Listener {
    constructor({ onText, onState, onAutoStop }) {
      this.onText = onText; this.onState = onState; this.onAutoStop = onAutoStop;
      this.active = false; this.finalText = ''; this.silenceTimer = null;
    }
    start({ autoStopAfterSilence = 0 } = {}) {
      if (!SR) { alert('La reconnaissance vocale n’est pas disponible dans ce navigateur. Utilise Chrome ou Edge.'); return; }
      stopSpeaking();
      this.finalText = ''; this.baseText = ''; this.active = true; this.autoStop = autoStopAfterSilence;
      this.startedAt = Date.now();
      this._open();
      this.onState && this.onState(true);
    }
    _open() {
      const r = new SR();
      // Chrome Android gère mal le mode continu (résultats répétés) : on écoute phrase par phrase et on relance
      r.lang = Store.settings.voiceVariant || V.defaultVariant; r.continuous = !ANDROID; r.interimResults = true;
      this.baseText = this.finalText; // texte des écoutes précédentes (avant relance)
      r.onresult = (e) => {
        // On reconstruit tout le texte à chaque fois au lieu d'ajouter des morceaux :
        // Android renvoie des résultats « finaux » cumulés (« No », « No pienso », « No pienso que »…)
        const finals = []; let interim = '';
        for (let i = 0; i < e.results.length; i++) {
          const t = e.results[i][0].transcript.trim();
          if (!t) continue;
          if (e.results[i].isFinal) finals.push(t); else interim += (interim ? ' ' : '') + t;
        }
        const merged = [];
        for (const t of finals) {
          const last = merged[merged.length - 1], lt = last && last.toLowerCase(), tt = t.toLowerCase();
          if (last && tt.startsWith(lt)) merged[merged.length - 1] = t;
          else if (!(last && lt.startsWith(tt))) merged.push(t);
        }
        const session = merged.join(' ');
        if (interim && session && interim.toLowerCase().startsWith(session.toLowerCase())) interim = interim.slice(session.length).trim();
        this.finalText = cleanRepeats([this.baseText, session].filter(Boolean).join(' '));
        this.onText && this.onText(this.finalText, cleanRepeats(interim));
        if (this.autoStop) {
          clearTimeout(this.silenceTimer);
          this.silenceTimer = setTimeout(() => { if (this.active && this.finalText) this.stop(true); }, this.autoStop);
        }
      };
      r.onerror = (e) => {
        if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
          alert('Accès au micro refusé. Autorise le micro pour cette page (icône à gauche de l’adresse).');
          this.active = false;
          this.onState && this.onState(false);
        }
      };
      // Chrome coupe après un silence : on relance tant que l'utilisateur n'a pas arrêté.
      r.onend = () => { if (this.active) { try { this._open(); } catch (e) { } } };
      this.rec = r;
      r.start();
    }
    stop(auto = false) {
      if (!this.active) return this.finalText;
      this.active = false;
      clearTimeout(this.silenceTimer);
      try { this.rec && this.rec.stop(); } catch (e) { }
      Store.day().speakSec += Math.min((Date.now() - this.startedAt) / 1000, 300);
      Store.save();
      this.onState && this.onState(false);
      if (auto && this.onAutoStop) this.onAutoStop(this.finalText);
      return this.finalText;
    }
  }

  global.Speech = { speak, stopSpeaking, repeat, Listener, status, genderOf, isPreferred, get voices() { return voices; }, supported: !!SR, loadVoices };
})(window);
