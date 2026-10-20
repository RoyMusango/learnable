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
      (ch.cards || []).forEach(([sec, id, q, a]) => this.cards.push({ id: `${sec}:${id}`, sec, q, a }));
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

  global.COURSE = COURSE;
})(window);
