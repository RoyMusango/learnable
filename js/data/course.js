// Registre du cours : chaque fichier de chapitre (slt.js, al.js…) s'y ajoute avec COURSE.add().
// Un chapitre apporte ses sections (fiches), ses cartes de révision, ses QCM et ses générateurs d'exercices chiffrés.
(function (global) {
  const COURSE = {
    chapters: [],   // dans l'ordre du cours
    sections: {},   // id -> section (avec .ch)
    order: [],      // ids des sections, dans l'ordre du parcours
    cards: [],      // { id, sec, q, a }
    quiz: [],       // { id, sec, q, opts, a, expl }
    gens: {},       // sec -> [fonctions qui renvoient un exercice chiffré]

    add(ch) {
      const chapter = { ...ch, sections: ch.sections.map(s => s.id) };
      delete chapter.cards; delete chapter.quiz; delete chapter.gens;
      this.chapters.push(chapter);
      ch.sections.forEach((s, i) => { this.sections[s.id] = { ...s, ch: ch.id, num: i + 1 }; this.order.push(s.id); });
      // Un id qui contient déjà « : » est gardé tel quel : une carte déplacée vers une autre section conserve sa progression
      (ch.cards || []).forEach(([sec, id, q, a]) => this.cards.push({ id: id.includes(':') ? id : `${sec}:${id}`, sec, q, a }));
      (ch.quiz || []).forEach(([sec, q, opts, a, expl], i) => this.quiz.push({ id: `${ch.id}:q${i + 1}`, sec, q, opts, a, expl }));
      for (const [sec, list] of Object.entries(ch.gens || {})) this.gens[sec] = (this.gens[sec] || []).concat(list);
    },
    chapter(id) { return this.chapters.find(c => c.id === id); },
    secOf(id) { return this.sections[id]; },
    // Texte brut d'une section (contexte pour le tuteur IA)
    plain(secId) {
      const s = this.sections[secId]; if (!s) return '';
      const notes = (s.notes || []).map(n => `Note de l'étudiant (slide ${n.p}) : ${n.t}${n.fix ? ` [Relecture : ${n.fix}]` : ''}`).join('\n');
      return `## ${s.title}\n${s.fiche.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()}${notes ? '\n' + notes : ''}`;
    },
  };

  // Petits outils pour les générateurs d'exercices
  COURSE.u = {
    pick: a => a[Math.floor(Math.random() * a.length)],
    rnd: (a, b) => a + Math.floor(Math.random() * (b - a + 1)),
    binom(n, k) { if (k < 0 || k > n) return 0; let r = 1; for (let i = 1; i <= k; i++) r = r * (n - k + i) / i; return Math.round(r); },
    // Nombre arrondi, à placer dans une formule : virgule décimale à la belge, écrite {,} pour que KaTeX n'ajoute pas d'espace
    f(x, d = 3) { return (Math.round(x * 10 ** d) / 10 ** d).toString().replace('.', '{,}'); },
  };

  // Code commenté pas à pas (TP et algorithmes) : chaque morceau de code, ce qu'il affiche, puis l'explication de chaque fonction appelée.
  // Le script complet (tous les morceaux bout à bout) est gardé dans COURSE.scripts pour le bouton « Copier » et les tests.
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const trimSrc = s => s.replace(/^\n+/, '').replace(/\s+$/, '');
  COURSE.scripts = {};
  Object.assign(COURSE.u, {
    esc,
    code: (src, lang = 'python') => `<pre class="code" data-lang="${lang}"><code>${esc(trimSrc(src))}</code></pre>`,
    // Liste des fonctions d'un morceau de code : [appel, explication]
    fns: rows => `<div class="fns">${rows.map(([sig, desc]) => `<div class="fn"><code>${esc(sig)}</code><div>${desc}</div></div>`).join('')}</div>`,
    // w = { id, title, intro, steps: [[titre, code, explication, sortie?], …], lang, after }
    walk(w) {
      const lang = w.lang || 'python';
      if (w.id) COURSE.scripts[w.id] = { lang, src: w.steps.filter(s => s[1]).map(s => trimSrc(s[1])).join('\n\n'),
        steps: w.steps.map(s => [s[1] ? trimSrc(s[1]) : '', s[3] ? trimSrc(s[3]) : '']) };
      const steps = w.steps.map(([t, src, expl, out], i) => `<li class="walk-step">
<div class="walk-step-head"><span class="walk-num">${i + 1}</span><b>${t}</b></div>
${src ? COURSE.u.code(src, lang) : ''}${out ? `<div class="walk-out"><span>Ce qui s’affiche</span><pre>${esc(trimSrc(out))}</pre></div>` : ''}
<div class="walk-expl">${expl}</div></li>`).join('');
      return `<section class="walk"${w.id ? ` data-walk="${w.id}"` : ''}>
<div class="walk-head"><span class="walk-tag">${lang === 'texte' ? 'Pseudo-code commenté' : 'Code commenté pas à pas'}</span><h4>${w.title}</h4>${lang === 'python' ? '<button class="walk-copy" type="button">Copier le script complet</button>' : ''}</div>
${w.intro ? `<div class="walk-intro">${w.intro}</div>` : ''}<ol class="walk-steps">${steps}</ol>${w.after ? `<div class="walk-after">${w.after}</div>` : ''}</section>`;
    },
  });

  global.COURSE = COURSE;
})(window);
