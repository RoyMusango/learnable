// Thème mémorisé, puis niveau de rendu : « fx » (ordinateur : animations et effets) ou version légère (téléphone, tablette, animations réduites).
// Fichier séparé (et non script dans la page) pour que la politique de sécurité interdise tout script inline.
(function () {
  var d = document.documentElement;
  try { var t = localStorage.getItem('applangues-theme'); if (t) d.dataset.theme = t; } catch (e) { }
  var q = matchMedia('(max-width: 860px), (pointer: coarse), (prefers-reduced-motion: reduce)');
  var set = function () { d.classList.toggle('fx', !q.matches); };
  set(); if (q.addEventListener) q.addEventListener('change', set);
})();
