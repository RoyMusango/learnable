// Configuration propre à l'app : textes de l'interface, voix, IA, synchro.
// store.js, sync.js et speech.js sont repris tels quels du moteur d'AppLangues (ils lisent ce même objet LANG).
window.LANG = {
  id: 'aml',
  appName: 'Learnable',
  title: 'Learnable · Advanced Machine Learning',
  locale: 'fr-BE',
  storageKey: 'learnable-aml-v1',
  syncFile: 'progress-aml.json',
  dataRepo: 'RoyMusango/hablemos-data',
  pagesUrl: 'https://roymusango.github.io/learnable/',
  siblings: [['Espagnol', 'https://roymusango.github.io/hablemos/'], ['Anglais', 'https://roymusango.github.io/letstalk/'], ['Néerlandais', 'https://roymusango.github.io/praten/']],

  // vocabThemes (réglage partagé du moteur) = chapitres actifs : leurs notions arrivent dans la séance du jour
  defaults: { dailyMinutes: 20, level: 'Examen', newPerDay: 10, notionsPerDay: 1, vocabThemes: ['slt'], ttsRate: 1, autoSpeak: false },
  levels: ['Intuition', 'Examen', 'Recherche'],

  nav: { today: 'Aujourd’hui', cards: 'Cartes', quiz: 'Exercices', course: 'Fiches', tutor: 'Tuteur', project: 'Projet', progress: 'Progrès', settings: 'Réglages' },

  voice: {
    accept: /^fr([-_]|$)/i, defaultVariant: 'fr-BE',
    variants: [['fr-BE', 'Français de Belgique'], ['fr-FR', 'Français de France']],
    title: 'Voix française', preferLabel: 'Accent choisi', otherLabel: 'Autres voix françaises',
    female: /charline|denise|eloise|vivienne|brigitte|celeste|coralie|jacqueline|josephine|yvette|julie|hortense|amelie|audrey|female/i,
    male: /gerard|henri|remy|alain|claude|jerome|maurice|yves|paul|antoine|male/i,
    help: 'La voix lit les questions et les corrigés. Les plus naturelles sont celles de <b>Microsoft Edge</b> (Charline, Gérard pour le belge ; Denise, Henri pour la France).',
    missing: 'Aucune voix française disponible. Ouvre l’app dans Microsoft Edge ou Chrome.',
    onlyOther: 'L’accent choisi n’est pas disponible : une autre voix française est utilisée.',
    robotic: 'Voix française disponible mais synthétique. Edge propose des voix neuronales bien plus naturelles.',
  },
};
