// Espace Projet · Active learning approfondi (unités 1 à 15, avec exemples calculés et liens TFE).
// Fichier généré par outils/convertir.js à partir de source/course.js : modifier la source, pas ce fichier.
(function () {
  const R = String.raw;
  const { pick, rnd, f } = COURSE.u;

  COURSE.add({
    id: "pj-al",
    space: 'projet',
    title: "Active learning, en profondeur",
    short: "Active learning (projet)",
    source: "activeLearning_en.pdf (X. Siebert) · approfondi pour le projet",
    seen: null,
    pitch: "Les notions du chapitre travaillées jusqu’au savoir-faire : chaque critère se calcule à la main, chaque limite se relie au cas du TFE.",
    levels: [{"n":1,"title":"Comprendre le problème","lead":"Pourquoi choisir ses exemples, dans quel cadre, et combien on peut y gagner."},{"n":2,"title":"Choisir avec un seul modèle","lead":"La boucle d’apprentissage actif et les trois mesures d’incertitude, avec leurs pièges."},{"n":3,"title":"Choisir avec un comité","lead":"Espace des versions, désaccord, CAL et Query-By-Committee."},{"n":4,"title":"Ce que la théorie garantit","lead":"Complexité en étiquettes, coefficient de désaccord et rôle du bruit."}],
    sections: [
  {
    "id": "pa-u1",
    "title": "Pourquoi choisir ses exemples",
    "slides": "3 à 13",
    "minutes": 12,
    "skills": [
      "vocab"
    ],
    "summary": "Une banque possède des dizaines de milliers de dossiers clients.",
    "fiche": "<h4 class=\"pj-idee\">L’idée</h4>\n<p>Une banque possède des dizaines de milliers de dossiers clients. Pour entraîner un modèle qui repère les dossiers à risque, il faut des <b>étiquettes</b> : pour chaque dossier, un analyste doit dire « à risque » ou « sain ». Un analyste coûte cher et traite peu de dossiers par jour. On ne pourra donc en étiqueter qu’une petite partie.</p>\n<p>La question de l’apprentissage actif est simple : <b>si on ne peut faire étiqueter que 30 dossiers, lesquels choisir ?</b> Les tirer au hasard gaspille des étiquettes sur des cas évidents. Laisser le modèle choisir les cas qui l’embarrassent le plus lui apprend davantage pour le même prix.</p>\n<p>Le cours le résume par une formule : un algorithme autorisé à choisir ses données, c’est-à-dire à être « curieux », peut apprendre plus vite (slide 5).</p>\n<h4 class=\"pj-methode\">Le vocabulaire à maîtriser</h4>\n<ul>\n<li><b>Oracle</b> : celui qui donne l’étiquette (un expert humain, une expérience, une vérification). Il est fiable mais coûteux.</li>\n<li><b>Requête</b> : la demande d’étiquette pour un exemple précis.</li>\n<li><b>Budget</b> : le nombre d’étiquettes qu’on peut se payer.</li>\n<li><b>Apprentissage passif</b> : on reçoit un échantillon déjà étiqueté, tiré au hasard, sans rien choisir.</li>\n<li><b>Apprentissage actif</b> : on voit tous les exemples sans étiquette et on choisit ceux dont on demande l’étiquette. Objectif : moins de requêtes que le passif pour la même qualité (slide 7).</li>\n</ul>\n<p><b>Les deux exemples du cours</b> (slides 12 et 13, d’après Settles, 2008) :</p>\n<ul>\n<li>400 points tirés de gaussiennes, un classifieur linéaire appris avec 30 étiquettes seulement : environ 70 % de bonnes classifications avec 30 points tirés au hasard, environ 90 % avec 30 points bien choisis.</li>\n<li>20 000 documents de sites sportifs à classer en baseball ou hockey : la courbe d’apprentissage (exactitude selon le nombre d’étiquettes) monte plus vite en actif qu’en passif.</li>\n</ul>\n<p>Lire une <b>courbe d’apprentissage</b> : en abscisse le nombre d’étiquettes achetées, en ordonnée la qualité du modèle sur des données de test. La méthode active gagne si sa courbe est au-dessus, c’est-à-dire si elle atteint la même qualité avec moins d’étiquettes.</p>\n<h4 class=\"pj-formel\">Le formel</h4>\n<p>Passif : on observe un échantillon i.i.d. (<i>x</i><sub>1</sub>, <i>y</i><sub>1</sub>), …, (<i>x<sub>m</sub></i>, <i>y<sub>m</sub></i>) tiré de <i>P</i><sup><i>m</i></sup>, entièrement étiqueté.</p>\n<p>Actif : on a accès à (<i>x</i><sub>1</sub>, …, <i>x<sub>m</sub></i>) et on peut demander <i>y<sub>i</sub></i> pour certains <i>i</i>. La mesure de performance n’est plus le nombre d’exemples mais le <b>nombre d’étiquettes demandées</b> pour atteindre une erreur donnée : la <i>complexité en étiquettes</i> (unité 13).</p>\n<p>Synonymes rencontrés dans la littérature : <i>query learning</i>, <i>optimal experimental design</i> (slide 5).</p>\n<h4 class=\"pj-tfe\">Banque et TFE</h4>\n<p>En banque, l’oracle est presque toujours un humain : l’analyste crédit, l’équipe KYC (connaissance du client) qui vérifie l’identité et les bénéficiaires effectifs, l’analyste conformité qui instruit une alerte. Leur temps est le budget.</p>\n<p>Dans ton TFE, l’étiquette coûteuse n’est pas la détresse d’une entité : celle-ci se calcule par des règles explicites sur les données publiques, elle ne coûte rien. L’étiquette coûteuse est la <b>véracité d’un lien de propriété</b> : vérifier qu’une société A détient bien une filiale B demande de remonter à une source primaire (registre, Exhibit 21 d’un 10-K). C’est là que l’apprentissage actif a un rôle (unités 16 à 19).</p>\n<div class=\"def\"><b>À retenir</b><ul><li>Actif = le modèle choisit les exemples à faire étiqueter ; passif = il les reçoit au hasard.</li>\n<li>On mesure en <b>étiquettes</b>, pas en exemples.</li>\n<li>Utile quand les données non étiquetées abondent et que l’étiquette coûte cher.</li></ul></div>"
  },
  {
    "id": "pa-u2",
    "title": "Trois scénarios",
    "slides": "14 à 22",
    "minutes": 10,
    "skills": [
      "scenario"
    ],
    "summary": "Selon la façon dont les exemples arrivent, on ne choisit pas de la même manière : on peut fabriquer l’exemple à poser à l’oracle ; les exemples défilent un par un et il faut décider tout de suite ; on dispose d’un réservoir entier et on choisit dedans.",
    "fiche": "<h4 class=\"pj-idee\">L’idée</h4>\n<p>Selon la façon dont les exemples arrivent, on ne choisit pas de la même manière :</p>\n<ul>\n<li>on peut <b>fabriquer</b> l’exemple à poser à l’oracle ;</li>\n<li>les exemples <b>défilent</b> un par un et il faut décider tout de suite ;</li>\n<li>on dispose d’un <b>réservoir</b> entier et on choisit dedans.</li>\n</ul>\n<h4 class=\"pj-methode\">Les reconnaître</h4>\n<p><b>1. Membership Query Synthesis (MQS)</b> : l’algorithme peut demander l’étiquette de n’importe quel point, y compris un point qu’il synthétise. Problème (slide 19) : un chiffre manuscrit synthétique peut ne ressembler à rien et être impossible à étiqueter pour un humain.</p>\n<p><b>2. Stream-based (flux)</b> : les <i>x<sub>i</sub></i> arrivent un à un ; pour chacun on décide de demander l’étiquette ou non. Pas besoin de tout stocker (utile sur un système embarqué).</p>\n<p><b>3. Pool-based (réservoir)</b> : un grand ensemble <i>x</i><sub>1</sub>, …, <i>x<sub>n</sub></i> est disponible dès le départ, on choisit le plus intéressant. Il faut souvent tout garder en mémoire. <b>C’est le cadre du cours</b> (slide 22) et celui de ton projet.</p>\n<p><b>Méthode pour reconnaître</b> : pose-toi deux questions. Peut-on inventer l’exemple ? Si oui, MQS. Sinon, voit-on tous les exemples en même temps ? Si oui, pool ; si on doit décider au passage, flux.</p>\n<h4 class=\"pj-formel\">Précisions</h4>\n<p>Le flux correspond à l’algorithme CAL (unité 10) : décision séquentielle, une requête si le comité est en désaccord sur <i>x<sub>t</sub></i>. Le pool permet de classer tous les candidats par un score d’informativité et de prendre le maximum : arg max<sub><i>x</i> ∈ <i>D<sub>u</sub></i></sub> score(<i>x</i>).</p>\n<p>En pratique, le pool permet aussi des requêtes par lots (choisir <i>b</i> exemples à la fois), ce qui compte quand l’oracle est une équipe qui travaille en parallèle.</p>\n<h4 class=\"pj-tfe\">Banque et TFE</h4>\n<ul>\n<li><b>Flux</b> : des transactions arrivent en continu et il faut décider pour chacune de lever une alerte vers un analyste ou non.</li>\n<li><b>Pool</b> : un portefeuille de clients existants, ou l’ensemble des liens d’un graphe de propriété, dans lequel on choisit les dossiers à revoir ce trimestre.</li>\n<li><b>MQS</b> : peu réaliste en banque, on ne demande pas à un analyste de juger une société qui n’existe pas. Il reste utile pour tester un système avec des cas construits.</li>\n</ul>\n<p>Pour le TFE, l’analyse se fait à une date <i>t</i> sur un graphe donné : c’est un <b>pool</b>.</p>\n<div class=\"def\"><b>À retenir</b><ul><li>MQS : on synthétise la question, au risque qu’elle soit inétiquetable.</li><li>Flux : décision immédiate, exemple par exemple.</li><li>Pool : on choisit dans un réservoir connu ; c’est le cadre du cours et du TFE.</li></ul></div>"
  },
  {
    "id": "pa-u3",
    "title": "Le cadre formel",
    "slides": "24 à 26",
    "minutes": 12,
    "skills": [
      "risk"
    ],
    "summary": "Pour parler de « bon » classifieur, il faut une mesure.",
    "fiche": "<h4 class=\"pj-idee\">L’idée</h4>\n<p>Pour parler de « bon » classifieur, il faut une mesure. On imagine que les couples (dossier, étiquette) sont tirés d’une loi inconnue. Le <b>risque</b> d’un classifieur est son erreur moyenne sur cette loi : la probabilité qu’il se trompe sur un nouveau dossier.</p>\n<p>Deux mondes : dans le monde <b>réalisable</b>, un classifieur de notre famille ne se trompe jamais ; dans le monde <b>agnostique</b>, même le meilleur se trompe parfois, parce que les données sont bruitées ou que notre famille de modèles est trop simple.</p>\n<h4 class=\"pj-methode\">Calculer un risque</h4>\n<p>Avec la perte 0/1, le risque est simplement la probabilité d’erreur : <span class=\"f\"><i>R</i>(<i>h</i>) = P(<i>Y</i> ≠ <i>h</i>(<i>X</i>))</span></p>\n<p><b>Exemple calculé.</b> Sur [0, 1] uniforme, la vraie frontière est à <i>w</i>* = 0,40 (étiquette 1 à droite), sans bruit. Un classifieur à seuil placé en <i>w</i> = 0,46 se trompe exactement sur l’intervalle [0,40 ; 0,46[. Son risque vaut donc la longueur de cet intervalle : <i>R</i> = 0,06.</p>\n<p>Règle générale pour les seuils sous loi uniforme sans bruit : <i>R</i>(<i>h<sub>w</sub></i>) = |<i>w</i> − <i>w</i>*|.</p>\n<h4 class=\"pj-formel\">Le formel</h4>\n<ul>\n<li>Espace des caractéristiques <i>X</i>, des étiquettes <i>Y</i>, couple aléatoire (<i>X</i>, <i>Y</i>) ~ <i>P<sub>XY</sub></i> inconnue, avec <i>P</i>(<i>x</i>, <i>y</i>) = <i>P</i>(<i>X</i> = <i>x</i>) <i>P</i>(<i>Y</i> = <i>y</i> | <i>X</i> = <i>x</i>).</li>\n<li>Espace d’hypothèses <i>H</i> (ex. classifieurs linéaires). But : <i>h</i> ∈ <i>H</i> qui minimise le risque théorique <i>R</i>(<i>h</i>) = E[ℓ(<i>Y</i>, <i>h</i>(<i>X</i>))].</li>\n<li>Perte 0/1 : ℓ = 0 si <i>y</i> = <i>h</i>(<i>x</i>), 1 sinon, d’où <i>R</i>(<i>h</i>) = ∫ 1<sub><i>y</i> ≠ <i>h</i>(<i>x</i>)</sub> d<i>P</i>(<i>x</i>, <i>y</i>) = P(<i>Y</i> ≠ <i>h</i>(<i>X</i>)).</li>\n<li>Soit <i>h</i>* le meilleur classifieur possible (bayésien), éventuellement hors de <i>H</i>. Cas <b>réalisable</b> : <i>R</i>(<i>h</i>*) = 0. Cas <b>agnostique</b> : <i>R</i>(<i>h</i>*) inconnu, en général non nul.</li>\n</ul>\n<p>La théorie de l’apprentissage actif a d’abord été développée dans le cas réalisable, puis étendue au cas agnostique (slide 26). Ce lien avec la théorie statistique de l’apprentissage (chapitre 1, dimension VC) revient à l’unité 13.</p>\n<h4 class=\"pj-tfe\">Banque et TFE</h4>\n<p>Les données bancaires sont presque toujours dans le cas <b>agnostique</b> : deux entreprises aux ratios identiques peuvent connaître des sorts différents. Dans le TFE, la vérification d’un lien de propriété est elle aussi imparfaite (registres en retard, filiales mal nommées). Il faut donc se méfier des résultats démontrés seulement dans le cas réalisable, comme le gain exponentiel de l’unité suivante.</p>\n<div class=\"def\"><b>À retenir</b><ul><li><i>R</i>(<i>h</i>) = E[ℓ(<i>Y</i>, <i>h</i>(<i>X</i>))] ; avec la perte 0/1, c’est P(<i>Y</i> ≠ <i>h</i>(<i>X</i>)).</li><li>Réalisable : <i>R</i>(<i>h</i>*) = 0. Agnostique : le meilleur classifieur se trompe aussi.</li></ul></div>"
  },
  {
    "id": "pa-u4",
    "title": "Le gain exponentiel et ses limites",
    "slides": "27 à 31",
    "minutes": 15,
    "skills": [
      "bisection"
    ],
    "summary": "Jeu du nombre mystère : je pense à un nombre entre 1 et 1 000.",
    "fiche": "<h4 class=\"pj-idee\">L’idée</h4>\n<p>Jeu du nombre mystère : je pense à un nombre entre 1 et 1 000. Si tu proposes des nombres au hasard, il te faudra des centaines d’essais. Si tu coupes en deux à chaque fois (« plus grand ou plus petit ? »), il en faut 10. Chaque réponse t’apporte un bit d’information.</p>\n<p>L’apprentissage actif d’un seuil, c’est exactement ce jeu : demander l’étiquette du point au milieu de la zone d’incertitude. Le gain est alors <b>exponentiel</b>. Mais ce cas est très favorable, et le cours montre aussitôt un exemple où l’apprentissage actif ne gagne rien.</p>\n<h4 class=\"pj-methode\">Compter les étiquettes</h4>\n<p><b>Positive rays</b> (slide 27) : <i>h<sub>w</sub></i>(<i>x</i>) = 1 si <i>x</i> ≥ <i>w</i>, 0 sinon, données séparables.</p>\n<ul>\n<li><b>Passif</b> (pire cas, points régulièrement espacés) : avec <i>n</i> étiquettes, l’erreur |<i>ŵ<sub>n</sub></i> − <i>w</i>*| est en O(1/<i>n</i>). Pour atteindre une précision ε, il faut O(1/ε) étiquettes.</li>\n<li><b>Actif</b> (dichotomie) : après <i>n</i> requêtes l’intervalle restant a une longueur 1/2<sup><i>n</i></sup>. Pour ε, il faut O(log(1/ε)) étiquettes.</li>\n</ul>\n<p><b>Exemple calculé.</b> ε = 0,001 : la dichotomie demande ⌈log<sub>2</sub>(1/0,001)⌉ = ⌈9,97⌉ = 10 étiquettes ; le passif sur une grille régulière en demande de l’ordre de 1 000. Rapport : environ 100.</p>\n<p><b>Positive intervals</b> (slides 30 et 31) : <i>h<sub>a,b</sub></i>(<i>x</i>) = 1 si <i>a</i> ≤ <i>x</i> &lt; <i>b</i>. Si l’intervalle positif est minuscule, aucune étiquette ne dit où il se trouve tant qu’on ne tombe pas dessus : pour distinguer deux petits intervalles placés à des endroits différents, il peut falloir demander toutes les étiquettes. <b>L’apprentissage actif n’aide pas toujours.</b></p>\n<h4 class=\"pj-formel\">Le formel</h4>\n<p>Seuils dans ℝ, cas réalisable : passif O(1/ε), actif O(log(1/ε)). Chaque observation contribue un bit dans l’écriture binaire de <i>w</i>* (slide 28).</p>\n<p>Le contre-exemple des intervalles annonce le thème de l’unité 14 : la dimension VC ne suffit pas à décrire l’apprentissage actif. La difficulté dépend de la loi des données et de la cible <i>h</i>*, ce que capte le coefficient de désaccord θ.</p>\n<h4 class=\"pj-tfe\">Banque et TFE</h4>\n<p>La dichotomie a un usage bancaire direct : chercher un seuil de décision (par exemple le niveau d’un ratio à partir duquel un analyste juge une entreprise en difficulté) en lui présentant des cas choisis plutôt qu’au hasard.</p>\n<p>Le contre-exemple des intervalles a un équivalent dans le TFE : un lien falsifié est un événement rare et local. Si rien dans les données ne signale sa présence, aucune stratégie de requête ne le trouvera plus vite que le hasard. Il faut donc toujours garder l’échantillonnage aléatoire comme ligne de base.</p>\n<div class=\"def\"><b>À retenir</b><ul><li>Seuils, cas réalisable : passif O(1/ε), actif O(log 1/ε), soit un gain exponentiel.</li><li>Intervalles : on peut devoir tout étiqueter. Le gain n’est pas garanti.</li></ul></div>"
  },
  {
    "id": "pa-u5",
    "title": "La boucle et le démarrage à froid",
    "slides": "32 et 33",
    "minutes": 10,
    "skills": [
      "loop"
    ],
    "summary": "L’apprentissage actif est une boucle : on entraîne, on regarde ce qui embarrasse le modèle, on demande une étiquette, on réentraîne.",
    "fiche": "<h4 class=\"pj-idee\">L’idée</h4>\n<p>L’apprentissage actif est une boucle : on entraîne, on regarde ce qui embarrasse le modèle, on demande une étiquette, on réentraîne. Au tout début, le modèle n’a rien vu : il ne sait pas ce qui est embarrassant. On commence donc toujours par quelques exemples tirés <b>au hasard</b>.</p>\n<h4 class=\"pj-methode\">La boucle pas à pas</h4>\n<ol>\n<li>Partager <i>D</i> = {<i>x</i><sub>1</sub>, …, <i>x<sub>n</sub></i>} en données étiquetées <i>D<sub>l</sub></i> (au départ un petit lot aléatoire) et non étiquetées <i>D<sub>u</sub></i>.</li>\n<li>Entraîner le classifieur <i>ĥ<sub>k</sub></i> sur <i>D<sub>l</sub></i>.</li>\n<li>Calculer un score d’informativité pour chaque <i>x</i> de <i>D<sub>u</sub></i> avec <i>ĥ<sub>k</sub></i>.</li>\n<li>Demander à l’oracle l’étiquette du meilleur <i>x<sub>i</sub></i>, ajouter (<i>x<sub>i</sub></i>, <i>y<sub>i</sub></i>) à <i>D<sub>l</sub></i>, le retirer de <i>D<sub>u</sub></i>.</li>\n<li>Recommencer jusqu’à épuisement du budget.</li>\n</ol>\n<p>Le score dépend de l’étape <i>k</i> : un point peu informatif hier peut le devenir aujourd’hui. Tout le reste du cours porte sur l’étape 3 : comment mesurer l’informativité.</p>\n<h4 class=\"pj-formel\">Précisions</h4>\n<p>Le démarrage à froid (<i>cold start</i>, slide 33, d’après Cohn, 1994) est plus qu’un détail technique : le premier lot aléatoire détermine où le modèle regarde ensuite. Un mauvais départ peut enfermer la méthode dans une mauvaise région (unité 8). Bonnes pratiques d’évaluation : faire plusieurs graines pour ce premier lot et rapporter la dispersion des courbes, pas une seule courbe.</p>\n<h4 class=\"pj-tfe\">Banque et TFE</h4>\n<p>Dans une expérience de TFE, la taille du lot aléatoire initial et la graine sont des paramètres de l’expérience. Ils se fixent avant la mesure, se rapportent avec les résultats et ne se choisissent pas en regardant les scores de test.</p>\n<div class=\"def\"><b>À retenir</b><ul><li>Boucle : entraîner, scorer <i>D<sub>u</sub></i>, interroger l’oracle, ajouter à <i>D<sub>l</sub></i>.</li><li>On commence toujours par un peu d’apprentissage passif (démarrage à froid).</li></ul></div>"
  },
  {
    "id": "pa-u6",
    "title": "Moins confiant, marge, entropie",
    "slides": "34 à 45",
    "minutes": 18,
    "skills": [
      "lc",
      "margin",
      "entropy",
      "choose"
    ],
    "summary": "Un modèle probabiliste donne, pour chaque exemple, une probabilité par classe.",
    "fiche": "<h4 class=\"pj-idee\">L’idée</h4>\n<p>Un modèle probabiliste donne, pour chaque exemple, une probabilité par classe. Un exemple est intéressant quand le modèle hésite. Il y a trois façons de mesurer l’hésitation :</p>\n<ul>\n<li><b>moins confiant</b> : la classe préférée a une probabilité faible ;</li>\n<li><b>marge</b> : les deux classes préférées sont au coude à coude ;</li>\n<li><b>entropie</b> : la probabilité est étalée sur toutes les classes.</li>\n</ul>\n<h4 class=\"pj-methode\">Les calculer</h4>\n<p>Notations : <i>P</i>(<i>y</i> | <i>x</i>) la probabilité donnée par le modèle, <i>ŷ</i><sub>1</sub> et <i>ŷ</i><sub>2</sub> les deux classes les plus probables.</p>\n<ul>\n<li><b>Moins confiant</b> (Lewis et Gale, 1994) : <span class=\"f\"><i>x</i><sub>LC</sub> = arg max<sub><i>x</i></sub> [1 − <i>P</i>(<i>ŷ</i><sub>1</sub> | <i>x</i>)]</span></li>\n<li><b>Marge</b> (Scheffer, 2001) : <span class=\"f\"><i>x</i><sub>M</sub> = arg min<sub><i>x</i></sub> [<i>P</i>(<i>ŷ</i><sub>1</sub> | <i>x</i>) − <i>P</i>(<i>ŷ</i><sub>2</sub> | <i>x</i>)]</span></li>\n<li><b>Entropie</b> (Settles et Craven, 2008) : <span class=\"f\"><i>x</i><sub>E</sub> = arg max<sub><i>x</i></sub> [− Σ<sub><i>i</i></sub> <i>P</i>(<i>y<sub>i</sub></i> | <i>x</i>) log <i>P</i>(<i>y<sub>i</sub></i> | <i>x</i>)]</span></li>\n</ul>\n<p><b>Exemple calculé, celui du cours</b> (slide 39), cinq classes :</p>\n<table><tr><th></th><th>C1</th><th>C2</th><th>C3</th><th>C4</th><th>C5</th></tr>\n<tr><td>cas 1</td><td>0</td><td>0</td><td>0,45</td><td>0,50</td><td>0,05</td></tr>\n<tr><td>cas 2</td><td>0,11</td><td>0,12</td><td>0,14</td><td>0,50</td><td>0,13</td></tr></table>\n<ul>\n<li>Moins confiant : 1 − 0,50 = 0,50 dans les deux cas. Le critère ne les distingue pas.</li>\n<li>Marge : cas 1 : 0,50 − 0,45 = <b>0,05</b> ; cas 2 : 0,50 − 0,14 = 0,36. La marge choisit le cas 1, où C4 et C3 sont presque indiscernables. C’est la conclusion du cours.</li>\n<li>Entropie (en bits) : cas 1 : 1,234 ; cas 2 : <b>1,997</b>. L’entropie choisit le cas 2, parce que la masse y est étalée sur cinq classes.</li>\n</ul>\n<p>Les deux critères les plus fins ne choisissent donc pas le même exemple. La marge cherche une frontière précise entre deux classes, l’entropie cherche le désordre global. Le bon choix dépend de la tâche.</p>\n<p><b>Cas binaire</b> (slide 42) : avec deux classes, les trois critères choisissent le même point, celui dont <i>P</i>(1 | <i>x</i>) est le plus proche de 0,5.</p>\n<h4 class=\"pj-formel\">Le formel</h4>\n<p>Les trois critères sont des fonctions de la loi a posteriori <i>P</i><sub>θ</sub>(· | <i>x</i>) du modèle courant. Ils mesurent l’incertitude du modèle <b>sur l’étiquette</b>, à modèle fixé. Ils ne mesurent pas l’incertitude <b>sur le modèle</b> lui-même : un modèle très sûr de lui dans une région qu’il n’a jamais vue ne la signalera pas. C’est l’origine de la myopie (unité 8) et la raison d’être des comités (niveau 3).</p>\n<p>Comparaison visuelle du cours (slide 45, trois classes aux sommets d’un triangle) : moins confiant et marge concentrent les requêtes près des frontières entre paires de classes, l’entropie les tire vers le centre où les trois classes se mêlent.</p>\n<p>Pour l’entropie, la base du logarithme ne change pas le point choisi (elle multiplie tous les scores par la même constante).</p>\n<h4 class=\"pj-tfe\">Banque et TFE</h4>\n<p>Pour un modèle de vérification de liens à deux classes (lien vrai ou falsifié), les trois critères coïncident : on vérifie les liens dont la probabilité estimée d’être falsifié est proche de 0,5.</p>\n<p>Avec plusieurs classes (par exemple un verdict de groupe « sain », « sous surveillance », « en détresse »), il faut choisir. La marge vise les dossiers à la frontière entre deux verdicts, ce qui correspond à la question qu’on pose à un comité de crédit : « surveillance ou détresse ? ».</p>\n<div class=\"def\"><b>À retenir</b><ul><li>LC : 1 − max <i>P</i> ; marge : <i>P</i><sub>1</sub> − <i>P</i><sub>2</sub> (on prend le minimum) ; entropie : − Σ <i>P</i> log <i>P</i>.</li><li>En binaire, les trois coïncident.</li><li>La marge et l’entropie peuvent choisir des exemples différents (slide 39 : 0,05 contre 0,36 en marge, 1,234 contre 1,997 bits en entropie).</li></ul></div>"
  },
  {
    "id": "pa-u7",
    "title": "L’entropie, mesure d’information",
    "slides": "43",
    "minutes": 10,
    "skills": [
      "entropy"
    ],
    "summary": "Une nouvelle surprenante apporte beaucoup d’information, une nouvelle attendue presque rien.",
    "fiche": "<h4 class=\"pj-idee\">L’idée</h4>\n<p>Une nouvelle surprenante apporte beaucoup d’information, une nouvelle attendue presque rien. Si un modèle est sûr à 99 % qu’un dossier est sain, la réponse de l’analyste n’apprendra presque rien. S’il hésite à 50/50, la réponse vaut un bit entier. L’entropie mesure l’information <b>qu’on s’attend</b> à recevoir de l’oracle.</p>\n<h4 class=\"pj-methode\">Calculer</h4>\n<p>Contenu d’information d’une réponse <i>y</i> : <i>I</i>(<i>y</i>) = − log <i>P</i>(<i>y</i>). Comme on ne connaît pas la réponse à l’avance, on prend l’espérance sur les réponses possibles (Shannon, 1948, slide 43) :</p>\n<p class=\"f\">E[<i>I</i>(<i>Y</i>)] = − Σ<sub><i>i</i></sub> <i>P</i>(<i>y<sub>i</sub></i> | <i>x</i>) log <i>P</i>(<i>y<sub>i</sub></i> | <i>x</i>)</p>\n<p><b>Repères en bits</b> (log en base 2) : deux classes à 50/50 donnent 1 bit ; 90/10 donne 0,469 bit ; une classe certaine donne 0. Avec <i>K</i> classes équiprobables, l’entropie vaut log<sub>2</sub> <i>K</i> (2 bits pour 4 classes).</p>\n<p><b>Méthode de calcul à la main</b> : pour chaque classe, multiplier <i>p</i> par log<sub>2</sub>(1/<i>p</i>), puis additionner. Les termes où <i>p</i> = 0 valent 0.</p>\n<h4 class=\"pj-formel\">Précisions</h4>\n<p>L’entropie est maximale pour la loi uniforme et nulle pour une loi concentrée. Elle sert aussi à construire les arbres de décision (gain d’information), ce que rappelle le cours. Elle réapparaît dans l’entropie de vote d’un comité (unité 11) et, sous forme de divergence de Kullback-Leibler, dans la mesure de désaccord.</p>\n<h4 class=\"pj-tfe\">Banque et TFE</h4>\n<p>Formulation utile devant un jury : « je vérifie en priorité le lien dont la vérification m’apprendra le plus, au sens de l’information attendue ». C’est défendable, chiffrable, et ça se compare à un tirage aléatoire.</p>\n<div class=\"def\"><b>À retenir</b><ul><li><i>I</i>(<i>y</i>) = − log <i>P</i>(<i>y</i>) ; entropie = information attendue.</li><li>1 bit pour 50/50 en binaire, log<sub>2</sub> <i>K</i> pour <i>K</i> classes équiprobables.</li></ul></div>"
  },
  {
    "id": "pa-u8",
    "title": "Myopie et inconsistance",
    "slides": "46 à 50",
    "minutes": 14,
    "skills": [
      "myopia"
    ],
    "summary": "Un modèle qui ne regarde que là où il hésite peut passer à côté d’une région entière.",
    "fiche": "<h4 class=\"pj-idee\">L’idée</h4>\n<p>Un modèle qui ne regarde que là où il hésite peut passer à côté d’une région entière. S’il croit la frontière ici, il interroge autour d’ici, apprend que c’est bien flou ici, et ne va jamais voir ailleurs, là où se trouve la vraie frontière. Il devient sûr de lui sur des régions qu’il n’a jamais vues.</p>\n<h4 class=\"pj-methode\">L’exemple du cours</h4>\n<p>Slide 47 : sur une droite, 45 % des données sont d’un côté, 45 % de l’autre, et deux petites zones de quelques pourcents se trouvent entre les deux. Le démarrage à froid tire presque sûrement ses points dans les deux grosses zones et place une première frontière en <i>w</i>. L’échantillonnage par incertitude interroge alors autour de <i>w</i> et n’atteint jamais <i>w</i>*. Risque obtenu : <i>R</i>(<i>w</i>) = 5 %, alors que le meilleur seuil donne <i>R</i>(<i>w</i>*) = 2,5 %.</p>\n<p>Slide 49 (Cohn, 1994) : la classe 1 est à l’intérieur de deux triangles ; si le premier lot ne touche pas le triangle de droite, la méthode ne le trouve jamais.</p>\n<p><b>Comment le repérer en pratique</b> : la courbe d’apprentissage plafonne sous celle de l’échantillonnage aléatoire après un certain budget, et l’écart dépend fortement de la graine du lot initial.</p>\n<h4 class=\"pj-formel\">Le formel</h4>\n<p><b>Consistance statistique</b> : un algorithme est consistant si, avec un échantillon infini, il converge vers la meilleure hypothèse <i>h</i>*. En général, les méthodes fondées sur l’incertitude d’un seul classifieur <b>ne sont pas consistantes</b> dans le cas agnostique (<i>h</i>* ∉ <i>H</i>) (slide 46).</p>\n<p>Cause : un biais d’échantillonnage. Les étiquettes demandées ne sont plus un échantillon i.i.d. de <i>P<sub>XY</sub></i> ; elles sont concentrées autour de la frontière estimée aux premières itérations.</p>\n<p>Le remède du cours est de changer de paradigme : modéliser l’incertitude <b>sur le classifieur</b> avec plusieurs classifieurs, c’est-à-dire un comité (slide 50). Une autre parade courante consiste à mélanger une part de tirage aléatoire aux requêtes ciblées.</p>\n<h4 class=\"pj-tfe\">Banque et TFE</h4>\n<p>Risque concret : un modèle de vérification entraîné surtout sur des liens entre sociétés américaines (Exhibit 21) peut être sûr de lui sur des liens européens qu’il n’a jamais vus. Il ne les proposera jamais à la vérification. Pour le TFE, il faut au minimum comparer chaque stratégie à l’échantillonnage aléatoire et rapporter la variabilité entre graines.</p>\n<div class=\"def\"><b>À retenir</b><ul><li>Myopie = biais d’échantillonnage : on n’interroge qu’autour de la frontière estimée au début.</li><li>Les méthodes à un seul classifieur ne sont en général pas consistantes dans le cas agnostique.</li><li>Remède : modéliser l’incertitude sur le modèle (comité), ou garder une part de hasard.</li></ul></div>"
  },
  {
    "id": "pa-u9",
    "title": "Espace des versions et désaccord",
    "slides": "51 à 54",
    "minutes": 12,
    "skills": [
      "version"
    ],
    "summary": "Au lieu d’un seul modèle, on garde tous les modèles encore compatibles avec ce qu’on a appris.",
    "fiche": "<h4 class=\"pj-idee\">L’idée</h4>\n<p>Au lieu d’un seul modèle, on garde tous les modèles encore compatibles avec ce qu’on a appris. Tant qu’ils sont d’accord sur un exemple, son étiquette ne nous apprendrait rien. Là où ils se contredisent, l’étiquette élimine une partie d’entre eux : c’est là qu’il faut interroger.</p>\n<h4 class=\"pj-methode\">Raisonner sur les seuils</h4>\n<p><b>Exemple calculé.</b> Seuils sur [0, 1], étiquette 1 à droite du seuil. On sait que <i>y</i>(0,2) = 0 et <i>y</i>(0,7) = 1. Les seuils compatibles sont ceux de ]0,2 ; 0,7] : c’est l’espace des versions. Pour un nouveau point :</p>\n<ul>\n<li><i>x</i> = 0,1 : tous les seuils compatibles disent 0. Pas de désaccord, inutile de demander.</li>\n<li><i>x</i> = 0,9 : tous disent 1. Inutile.</li>\n<li><i>x</i> = 0,45 : certains disent 0, d’autres 1. Ce point est dans la région de désaccord, sa réponse coupera l’espace des versions.</li>\n</ul>\n<p>La région de désaccord est ici l’intervalle ]0,2 ; 0,7[ : les points entre le plus grand 0 connu et le plus petit 1 connu.</p>\n<h4 class=\"pj-formel\">Le formel</h4>\n<p><b>Espace des versions</b> pour un ensemble d’exemples étiquetés <i>Z</i> ⊂ <i>X</i> × <i>Y</i> : <span class=\"f\"><i>V</i>(<i>Z</i>) = {<i>h</i> ∈ <i>H</i> : <i>h</i>(<i>x</i>) = <i>y</i>, ∀(<i>x</i>, <i>y</i>) ∈ <i>Z</i>}</span></p>\n<p><b>Région de désaccord</b> d’un ensemble d’hypothèses <i>H</i> : <span class=\"f\"><i>R</i>(<i>H</i>) = DIS(<i>H</i>) = {<i>x</i> ∈ <i>X</i> : ∃ <i>h</i>, <i>h</i>′ ∈ <i>H</i>, <i>h</i>(<i>x</i>) ≠ <i>h</i>′(<i>x</i>)}</span></p>\n<p>Le but de l’apprentissage actif se reformule : choisir les instances à ajouter à <i>Z</i> qui réduisent le plus <i>V</i>(<i>Z</i>) (slide 53). Ces deux notions sont définies dans le cas réalisable (l’espace des versions suppose qu’une hypothèse ne commet aucune erreur).</p>\n<h4 class=\"pj-tfe\">Banque et TFE</h4>\n<p>L’analogie bancaire est le comité de crédit : si tous les analystes votent pareil, une contre-expertise est inutile ; s’ils se contredisent, c’est le dossier à instruire. Dans le TFE, les « membres du comité » peuvent être tes trois approches (GraphRAG, RAG vectoriel, GNMF) : les entités sur lesquelles leurs verdicts divergent sont des candidates naturelles à la vérification (unité 17).</p>\n<div class=\"def\"><b>À retenir</b><ul><li><i>V</i>(<i>Z</i>) : hypothèses compatibles avec les données.</li><li>DIS(<i>H</i>) : points où au moins deux hypothèses de <i>H</i> se contredisent.</li><li>Interroger hors de la région de désaccord ne sert à rien (cas réalisable).</li></ul></div>"
  },
  {
    "id": "pa-u10",
    "title": "L’algorithme CAL",
    "slides": "55 à 58",
    "minutes": 12,
    "skills": [
      "cal"
    ],
    "summary": "CAL (Cohn, Atlas et Ladner, 1994) applique l’idée précédente à un flux : pour chaque nouveau point, si les modèles encore possibles sont d’accord, on déduit l’étiquette gratuitement ; sinon, on la demande et on élimine les modèles contredits.",
    "fiche": "<h4 class=\"pj-idee\">L’idée</h4>\n<p>CAL (Cohn, Atlas et Ladner, 1994) applique l’idée précédente à un flux : pour chaque nouveau point, si les modèles encore possibles sont d’accord, on déduit l’étiquette gratuitement ; sinon, on la demande et on élimine les modèles contredits.</p>\n<h4 class=\"pj-methode\">Exécuter CAL à la main</h4>\n<pre class=\"algo\">H₁ ← H\npour t = 1 … T :\n  recevoir x_t\n  si ∃ h, h′ ∈ H_t : h(x_t) ≠ h′(x_t) :\n     y_t ← QUERYLABEL(x_t)\n     H_{t+1} ← {h ∈ H_t : h(x_t) = y_t}\n  sinon :\n     H_{t+1} ← H_t\nrenvoyer H_{T+1}</pre>\n<p><b>Exemple calculé</b> (seuils, vrai seuil 0,55). Espace initial : tous les seuils de [0, 1].</p>\n<ol>\n<li><i>x</i> = 0,30 : désaccord, on demande : 0. Seuils restants : ]0,30 ; 1].</li>\n<li><i>x</i> = 0,80 : désaccord, on demande : 1. Restants : ]0,30 ; 0,80].</li>\n<li><i>x</i> = 0,20 : tous disent 0, <b>pas de requête</b>.</li>\n<li><i>x</i> = 0,60 : désaccord, on demande : 1. Restants : ]0,30 ; 0,60].</li>\n<li><i>x</i> = 0,95 : tous disent 1, pas de requête.</li>\n</ol>\n<p>Bilan : 3 requêtes pour 5 points ; les points hors de la région de désaccord sont étiquetés gratuitement.</p>\n<h4 class=\"pj-formel\">Le formel</h4>\n<p>CAL est simple mais coûteux : il faut mémoriser <i>H<sub>t</sub></i>, qui peut être très grand. Idéalement, chaque requête couperait <i>V</i>(<i>Z</i>) en deux, mais un tel point n’existe pas toujours, il est difficile à trouver, et les données ne sont pas toujours séparables par <i>H</i> (slide 57).</p>\n<p><b>Description implicite</b> de l’espace des versions : on entraîne le classifieur sur les données actuelles plus (<i>x<sub>t</sub></i>, 0), puis sur les données actuelles plus (<i>x<sub>t</sub></i>, 1). Si les deux entraînements réussissent (sans erreur), les deux étiquettes restent possibles : <i>x<sub>t</sub></i> est dans la région de désaccord et on demande son étiquette.</p>\n<p>La complexité en étiquettes de CAL est étudiée à l’unité 13.</p>\n<h4 class=\"pj-tfe\">Banque et TFE</h4>\n<p>Le test implicite de CAL a une traduction directe : « si je suppose ce lien vrai, puis faux, est-ce que les deux mondes restent cohérents avec tout ce que je sais du groupe ? ». Si l’un des deux mondes devient incohérent (par exemple une société qui détiendrait plus de 100 % d’une filiale), le lien se déduit sans vérification. Sinon, il faut vérifier.</p>\n<div class=\"def\"><b>À retenir</b><ul><li>CAL : requête seulement si les hypothèses restantes se contredisent sur <i>x<sub>t</sub></i>, puis élimination des incompatibles.</li><li>Coûteux en mémoire ; version implicite : entraîner avec (<i>x</i>, 0) puis (<i>x</i>, 1).</li></ul></div>"
  },
  {
    "id": "pa-u11",
    "title": "QBC : entropie de vote et KL",
    "slides": "59 à 61",
    "minutes": 18,
    "skills": [
      "voteent",
      "kl"
    ],
    "summary": "Sur un pool, on ne peut pas garder tous les modèles possibles.",
    "fiche": "<h4 class=\"pj-idee\">L’idée</h4>\n<p>Sur un pool, on ne peut pas garder tous les modèles possibles. On en garde quelques-uns, un comité, et on mesure à quel point ils se disputent sur chaque exemple. Deux mesures : compter les votes (entropie de vote), ou comparer les probabilités de chacun à l’avis moyen (divergence de Kullback-Leibler).</p>\n<h4 class=\"pj-methode\">Les calculer</h4>\n<p>Comité <i>C</i> = {θ<sup>(1)</sup>, …, θ<sup>(<i>C</i>)</sup>}, <i>V</i>(<i>y<sub>i</sub></i>) le nombre de votes pour la classe <i>y<sub>i</sub></i>.</p>\n<p><b>Entropie de vote</b> : <span class=\"f\"><i>x</i><sub>VE</sub> = arg max<sub><i>x</i></sub> [− Σ<sub><i>i</i></sub> (<i>V</i>(<i>y<sub>i</sub></i>)/<i>C</i>) log (<i>V</i>(<i>y<sub>i</sub></i>)/<i>C</i>)]</span></p>\n<p>Exemple, 5 membres, 2 classes (log<sub>2</sub>) : votes 3 contre 2 : 0,971 bit ; 4 contre 1 : 0,722 bit ; 5 contre 0 : 0. Trois classes, votes 2, 2, 1 : 1,522 bit.</p>\n<p><b>Divergence KL moyenne au consensus</b> (McCallum et Nigam, 1998) :</p>\n<p class=\"f\"><i>x</i><sub>KL</sub> = arg max<sub><i>x</i></sub> (1/<i>C</i>) Σ<sub><i>c</i></sub> <i>D</i>(<i>P</i><sub>θ(<i>c</i>)</sub> ‖ <i>P<sub>C</sub></i>), avec <i>D</i>(<i>P</i> ‖ <i>Q</i>) = Σ<sub><i>i</i></sub> <i>P</i>(<i>y<sub>i</sub></i>|<i>x</i>) log [<i>P</i>(<i>y<sub>i</sub></i>|<i>x</i>) / <i>Q</i>(<i>y<sub>i</sub></i>|<i>x</i>)]</p>\n<p>et <i>P<sub>C</sub></i>(<i>y<sub>i</sub></i>|<i>x</i>) = (1/<i>C</i>) Σ<sub><i>c</i></sub> <i>P</i><sub>θ(<i>c</i>)</sub>(<i>y<sub>i</sub></i>|<i>x</i>), la probabilité de consensus.</p>\n<p><b>Exemple calculé</b>, 3 membres, binaire, probabilités (classe 0, classe 1) :</p>\n<ul>\n<li>(0,9 ; 0,1), (0,1 ; 0,9), (0,5 ; 0,5) : consensus (0,5 ; 0,5), KL moyenne <b>0,354 bit</b>. Fort désaccord.</li>\n<li>(0,5 ; 0,5) trois fois : consensus (0,5 ; 0,5), KL moyenne <b>0</b>. Tous hésitent, mais ils sont d’accord pour hésiter.</li>\n</ul>\n<p>Le consensus est le même dans les deux cas. La KL distingue donc le désaccord entre modèles de l’incertitude partagée, ce que l’entropie du consensus seule ne fait pas.</p>\n<h4 class=\"pj-formel\">Le formel</h4>\n<p>L’entropie de vote n’utilise que les décisions dures ; la KL utilise les probabilités de chaque membre. La KL mesure l’incertitude <b>sur le modèle</b> (dispersion du comité), là où l’entropie d’un seul modèle mesure l’incertitude <b>sur l’étiquette</b>. Ce sont deux grandeurs différentes, et un bon jury peut te demander laquelle tu utilises et pourquoi.</p>\n<p>Un comité se construit en pratique par rééchantillonnage (bootstrap des données étiquetées), par plusieurs initialisations, ou avec des familles de modèles différentes. Plus les membres sont variés, plus le désaccord est informatif ; s’ils se trompent tous de la même façon, le comité ne voit rien.</p>\n<h4 class=\"pj-tfe\">Banque et TFE</h4>\n<p>Deux usages possibles dans le TFE :</p>\n<ul>\n<li><b>Entropie de vote</b> sur les verdicts des trois approches (GraphRAG, RAG vectoriel, GNMF) : simple, lisible par un banquier (« deux méthodes contre une »).</li>\n<li><b>KL</b> si chaque approche fournit un score probabiliste : plus fin, mais il faut que les scores soient comparables (calibrés), ce qui n’est pas acquis pour trois méthodes aussi différentes.</li>\n</ul>\n<p>Limite à déclarer : trois membres seulement donnent peu de niveaux de vote (3 contre 0 ou 2 contre 1), donc beaucoup d’égalités à départager.</p>\n<div class=\"def\"><b>À retenir</b><ul><li>Entropie de vote : désaccord des décisions.</li><li>KL au consensus : désaccord des probabilités ; nulle si tous donnent la même loi, même incertaine.</li><li>Un comité est utile s’il est varié.</li></ul></div>"
  },
  {
    "id": "pa-u12",
    "title": "Points isolés, bruit et densité",
    "slides": "62 à 64",
    "minutes": 12,
    "skills": [
      "density"
    ],
    "summary": "Un point isolé, loin de tout, peut sembler très incertain.",
    "fiche": "<h4 class=\"pj-idee\">L’idée</h4>\n<p>Un point isolé, loin de tout, peut sembler très incertain. Mais connaître son étiquette n’aide pour aucun autre point. Mieux vaut un point à la fois incertain et représentatif d’une foule de voisins : sa réponse se propage à toute la région.</p>\n<h4 class=\"pj-methode\">Pondérer par la densité</h4>\n<p>Le cours combine deux termes (slide 63) : un niveau d’<b>ignorance</b> (l’incertitude, LIG) et un niveau d’<b>influence</b> sur les voisins (LIF) :</p>\n<p class=\"f\"><i>x</i><sub>ID</sub> = arg max<sub><i>x</i></sub> [ |LIG(<i>x</i>)| × |LIF(<i>x</i>)|<sup>β</sup> ]</p>\n<p>β règle l’importance de l’influence : β = 0 redonne l’incertitude seule.</p>\n<p><b>Exemple calculé</b>, β = 1, incertitude et densité normalisées entre 0 et 1 :</p>\n<table><tr><th>point</th><th>incertitude</th><th>densité</th><th>score</th></tr>\n<tr><td>A, isolé</td><td>0,95</td><td>0,10</td><td>0,095</td></tr>\n<tr><td>B, au cœur d’un amas</td><td>0,70</td><td>0,80</td><td><b>0,560</b></td></tr>\n<tr><td>C, sûr</td><td>0,20</td><td>0,90</td><td>0,180</td></tr></table>\n<p>L’incertitude seule choisirait A ; la pondération par densité choisit B.</p>\n<h4 class=\"pj-formel\">Précisions</h4>\n<p>Deux familles (slides 63 et 64) : les méthodes pondérées par la densité (<i>density weighted methods</i>, DWM), et les méthodes de réduction d’erreur, qui estiment l’effet de chaque étiquette candidate sur l’erreur future. Le cours montre DWM combiné à la marge et à QBC.</p>\n<p>Lien avec l’apprentissage semi-supervisé : on exploite les données non étiquetées pour connaître la structure de <i>X</i>. La densité se mesure par exemple par la similarité moyenne d’un point à ses voisins dans le pool.</p>\n<h4 class=\"pj-tfe\">Banque et TFE</h4>\n<p>Dans un graphe de propriété, l’« influence » a une traduction naturelle : un lien vers une société mère qui contrôle trente filiales pèse plus qu’un lien entre deux coquilles isolées. Vérifier un lien central peut changer le verdict de tout un groupe. Une pondération par centralité dans le graphe serait l’équivalent de la pondération par densité. C’est une piste, pas un résultat établi.</p>\n<div class=\"def\"><b>À retenir</b><ul><li>Les points isolés ou bruités paraissent informatifs à tort.</li><li>Score = incertitude × densité<sup>β</sup>.</li></ul></div>"
  },
  {
    "id": "pa-u13",
    "title": "Complexité en étiquettes",
    "slides": "66 à 69",
    "minutes": 15,
    "skills": [
      "labelcx"
    ],
    "summary": "Combien d’étiquettes faut-il pour garantir une erreur d’au plus ε ? En passif, ce nombre grandit comme 1/ε (ou 1/ε² s’il y a du bruit).",
    "fiche": "<h4 class=\"pj-idee\">L’idée</h4>\n<p>Combien d’étiquettes faut-il pour garantir une erreur d’au plus ε ? En passif, ce nombre grandit comme 1/ε (ou 1/ε² s’il y a du bruit). En actif, dans les bons cas, il grandit comme log(1/ε). Mais dès qu’il y a du bruit, un terme apparaît qui efface une grande partie du gain.</p>\n<h4 class=\"pj-methode\">Lire et utiliser les formules</h4>\n<p>Notations : <i>d</i><sub>VC</sub> dimension VC de <i>H</i> (chapitre de théorie), θ coefficient de désaccord (unité 14), ν meilleur taux d’erreur atteignable (bruit).</p>\n<table><tr><th></th><th>passif</th><th>actif (ex. CAL)</th></tr>\n<tr><td>séparable</td><td><i>d</i><sub>VC</sub> / ε</td><td>θ <i>d</i><sub>VC</sub> log(1/ε)</td></tr>\n<tr><td>agnostique</td><td><i>d</i><sub>VC</sub> / ε²</td><td>θ (<i>d</i><sub>VC</sub> log²(1/ε)) + <i>d</i><sub>VC</sub> ν² / ε²</td></tr></table>\n<p>(ordres de grandeur, notés ~ dans le cours, slides 67 et 68).</p>\n<p><b>Exemple calculé, cas séparable</b> : <i>d</i><sub>VC</sub> = 10, θ = 2, ε = 0,01. Passif : 10/0,01 = 1 000. Actif : 2 × 10 × ln(100) ≈ 92. Rapport environ 11. (Avec un log en base 2 on trouverait 133 ; l’ordre de grandeur est le même, la base n’est pas fixée par une formule en ~.)</p>\n<p><b>Exemple calculé, cas agnostique</b> : <i>d</i><sub>VC</sub> = 10, ε = 0,01, ν = 0,05. Le terme <i>d</i><sub>VC</sub> ν²/ε² = 10 × 25 = 250 ; le passif vaut 10/0,0001 = 100 000. Quand ν devient comparable à ε, ce terme rejoint l’ordre du passif : <b>plus le problème est bruité par rapport à la précision visée, plus le gain de l’actif fond.</b></p>\n<h4 class=\"pj-formel\">Le formel</h4>\n<p>La dimension VC suffit à caractériser l’apprentissage passif, pas l’actif (slide 69). Deux notions ont été proposées : le <i>splitting index</i> (Dasgupta et al., 2005) et le <b>coefficient de désaccord</b> (Hanneke, 2007), retenu par le cours.</p>\n<p>Questions de fond que pose le cours (slide 66), à savoir répondre : l’actif peut-il battre le passif ? de combien, en vitesse de décroissance de l’erreur ? dans quelles conditions ? un algorithme actif est-il consistant, optimal ? quelle est sa complexité de calcul ?</p>\n<h4 class=\"pj-tfe\">Banque et TFE</h4>\n<p>Ce résultat donne une prédiction à écrire <b>avant</b> l’expérience du TFE : si la vérification des liens est elle-même bruitée (un registre en retard, une filiale mal identifiée), le gain d’une stratégie active sur le tirage aléatoire doit diminuer quand le bruit augmente. Une expérience qui fait varier ce bruit et observe ce déclin vérifie une prédiction théorique : c’est exactement le genre de résultat qui rassure un jury.</p>\n<div class=\"def\"><b>À retenir</b><ul><li>Séparable : <i>d</i>/ε contre θ <i>d</i> log(1/ε).</li><li>Agnostique : <i>d</i>/ε² contre θ <i>d</i> log²(1/ε) + <i>d</i> ν²/ε².</li><li>Le bruit ν réduit le gain ; la dimension VC ne suffit pas, il faut θ.</li></ul></div>"
  },
  {
    "id": "pa-u14",
    "title": "Le coefficient de désaccord",
    "slides": "70 à 73",
    "minutes": 15,
    "skills": [
      "theta"
    ],
    "summary": "Prenons tous les modèles « presque aussi bons » que le meilleur, à une distance r de lui.",
    "fiche": "<h4 class=\"pj-idee\">L’idée</h4>\n<p>Prenons tous les modèles « presque aussi bons » que le meilleur, à une distance <i>r</i> de lui. Sur combien de points se contredisent-ils ? Si cette zone de désaccord rétrécit vite quand <i>r</i> diminue, l’apprentissage actif peut concentrer ses requêtes sur une zone de plus en plus petite : il gagne beaucoup. Le coefficient θ mesure ce rapport.</p>\n<h4 class=\"pj-methode\">Le calculer sur les seuils</h4>\n<p>Seuils sur [0, 1], loi uniforme, meilleur seuil <i>w</i>*. Deux seuils <i>w</i> et <i>w</i>′ sont en désaccord exactement entre eux, donc <i>d</i>(<i>h<sub>w</sub></i>, <i>h<sub>w′</sub></i>) = |<i>w</i> − <i>w</i>′|.</p>\n<ol>\n<li>La boule <i>B</i>(<i>h</i>*, <i>r</i>) contient les seuils de [<i>w</i>* − <i>r</i>, <i>w</i>* + <i>r</i>].</li>\n<li>Sa région de désaccord est cet intervalle, de probabilité 2<i>r</i>.</li>\n<li>θ = sup<sub><i>r</i></sub> 2<i>r</i>/<i>r</i> = <b>2</b>.</li>\n</ol>\n<p>Complexité en étiquettes : 2 <i>d</i><sub>VC</sub> log(1/ε) (slide 73). Pour des classifieurs linéaires dans ℝ<sup><i>d</i></sup> (sous des hypothèses de loi données dans la littérature, par exemple uniforme sur la sphère), θ ≤ √<i>d</i>, d’où une complexité en <i>d</i><sub>VC</sub><sup>3/2</sup> log(1/ε).</p>\n<p><b>Exemple calculé</b> : linéaire en dimension 16 : θ ≤ 4 ; en dimension 100 : θ ≤ 10. Le gain se dégrade avec la dimension.</p>\n<h4 class=\"pj-formel\">Le formel</h4>\n<p><b>Pseudo-métrique de désaccord</b> : <i>d</i>(<i>h</i>, <i>h</i>′) = P[<i>h</i>(<i>X</i>) ≠ <i>h</i>′(<i>X</i>)].</p>\n<p><b>Boule de désaccord</b> : <i>B</i>(<i>h</i>, <i>r</i>) = {<i>h</i>′ ∈ <i>H</i> : <i>d</i>(<i>h</i>, <i>h</i>′) ≤ <i>r</i>}.</p>\n<p><b>Coefficient de désaccord</b> pour <i>h</i> ∈ <i>H</i> : <span class=\"f\">θ = sup<sub><i>r</i> &gt; 0</sub> P[DIS(<i>B</i>(<i>h</i>, <i>r</i>))] / <i>r</i></span></p>\n<p>Il mesure la vitesse à laquelle la région de désaccord grandit avec <i>r</i> (slide 71). Comme DIS(<i>B</i>(<i>h</i>, <i>r</i>)) contient toujours les points où <i>h</i> diffère d’un voisin à distance <i>r</i>, on a θ ≥ 1 dès que la boule contient d’autres hypothèses ; θ grand signifie qu’il faut interroger une large zone même près de l’optimum.</p>\n<h4 class=\"pj-tfe\">Banque et TFE</h4>\n<p>Interprétation pour un banquier : θ dit si les « bons modèles » sont d’accord sur la plupart des dossiers (petit θ, on n’aura que quelques cas limites à faire revoir) ou s’ils se contredisent sur une large part du portefeuille (grand θ, la revue humaine restera lourde quelle que soit la stratégie).</p>\n<div class=\"def\"><b>À retenir</b><ul><li>θ = sup<sub><i>r</i></sub> P[DIS(<i>B</i>(<i>h</i>*, <i>r</i>))]/<i>r</i>.</li><li>Seuils : θ = 2. Linéaire dans ℝ<sup><i>d</i></sup> : θ ≤ √<i>d</i>.</li></ul></div>"
  },
  {
    "id": "pa-u15",
    "title": "Les types de bruit",
    "slides": "75 et 76",
    "minutes": 12,
    "skills": [
      "noise"
    ],
    "summary": "Dans certaines zones, même un expert parfait ne peut pas prédire l’étiquette : chez certains patients du cours, le risque cardiaque est à 50/50.",
    "fiche": "<h4 class=\"pj-idee\">L’idée</h4>\n<p>Dans certaines zones, même un expert parfait ne peut pas prédire l’étiquette : chez certains patients du cours, le risque cardiaque est à 50/50. Une méthode fondée sur l’incertitude adore ces zones, puisque le modèle y hésite. Elle y dépense son budget pour rien : l’hésitation vient des données, pas d’un manque d’apprentissage.</p>\n<h4 class=\"pj-methode\">Reconnaître le type de bruit</h4>\n<p>On note η(<i>x</i>) = P[<i>Y</i> = 1 | <i>X</i> = <i>x</i>].</p>\n<ul>\n<li><b>Sans bruit</b> : η vaut 0 ou 1, avec un saut net à la frontière.</li>\n<li><b>Bruit borné</b> : η ne s’approche jamais de 1/2. Formellement, |η(<i>x</i>) − 1/2| &gt; <i>b</i> &gt; 0 pour tout <i>x</i>. Il y a du bruit, mais la frontière reste nettement signalée.</li>\n<li><b>Bruit non borné</b> : η traverse 1/2 en douceur. Près de la frontière, rien n’indique clairement où elle passe, et l’apprentissage devient difficile pour toute méthode.</li>\n</ul>\n<p><b>Exercice type</b> : η(<i>x</i>) vaut 0,2 à gauche et 0,85 à droite de la frontière. Il s’agit de bruit borné, avec <i>b</i> &lt; min(|0,2 − 0,5|, |0,85 − 0,5|) = 0,30. Si η vaut 0,48 dans une zone, aucun <i>b</i> &gt; 0,02 ne convient : on se rapproche du cas non borné.</p>\n<h4 class=\"pj-formel\">Précisions</h4>\n<p>Le bruit borné conserve une partie des gains de l’apprentissage actif, car la frontière reste repérable. Sans borne, le terme en ν²/ε² de l’unité 13 et la recherche du bruit par l’échantillonnage d’incertitude (slide 75, d’après Nowak et Castro) réduisent fortement l’intérêt de l’actif. Ne pas demander les étiquettes des régions bruitées est une recommandation explicite du cours.</p>\n<h4 class=\"pj-tfe\">Banque et TFE</h4>\n<p>Un point clé pour ton projet : un lien falsifié par un adversaire <b>n’est pas du bruit aléatoire</b>. Un falsificateur habile fabrique un lien qui ressemble aux liens vrais, donc un lien sur lequel le modèle est <b>sûr</b> et non incertain. Une stratégie fondée sur l’incertitude risque alors de ne jamais le proposer à la vérification.</p>\n<p>C’est une hypothèse de recherche à tester, pas un résultat : comparer, à budget égal, l’incertitude, le désaccord d’un comité et le tirage aléatoire face à des falsifications naïves puis adaptatives. Le harnais d’attaque adaptatif de ton stage (E3) est réutilisable ici.</p>\n<div class=\"def\"><b>À retenir</b><ul><li>Bruit borné : |η(<i>x</i>) − 1/2| &gt; <i>b</i> &gt; 0 partout.</li><li>L’incertitude « cherche le bruit » : inutile de demander les étiquettes des zones bruitées.</li><li>Un adversaire n’est pas du bruit : il peut se cacher là où le modèle est sûr.</li></ul></div>"
  }
],
    cards: [
  [
    "pa-u1",
    "u1c1",
    "Qu’est-ce que l’oracle en apprentissage actif ?",
    "Celui qui fournit l’étiquette d’un exemple sur demande (expert, expérience, vérification) : fiable mais coûteux."
  ],
  [
    "pa-u1",
    "u1c2",
    "Différence entre apprentissage passif et actif ?",
    "Passif : on reçoit un échantillon déjà étiqueté, tiré au hasard. Actif : on voit les exemples sans étiquette et on choisit ceux dont on demande l’étiquette."
  ],
  [
    "pa-u1",
    "u1c3",
    "Objectif de l’apprentissage actif ?",
    "Atteindre la même qualité qu’en passif avec moins de requêtes d’étiquettes."
  ],
  [
    "pa-u1",
    "u1c4",
    "Que montre une courbe d’apprentissage ?",
    "La qualité du modèle sur le test (ordonnée) selon le nombre d’étiquettes utilisées (abscisse). La méthode dont la courbe est au-dessus apprend plus avec le même budget."
  ],
  [
    "pa-u2",
    "u2c1",
    "Les trois scénarios d’apprentissage actif ?",
    "Membership Query Synthesis (on synthétise l’exemple), stream-based (flux, décision au passage), pool-based (choix dans un réservoir connu)."
  ],
  [
    "pa-u2",
    "u2c2",
    "Limite principale du scénario MQS ?",
    "Les exemples synthétisés peuvent être impossibles à étiqueter pour un humain (ex. chiffres manuscrits artificiels)."
  ],
  [
    "pa-u2",
    "u2c3",
    "Quel scénario le cours étudie-t-il ?",
    "Le pool-based : un grand réservoir disponible dès le départ."
  ],
  [
    "pa-u3",
    "u3c1",
    "Définition du risque théorique R(h) ?",
    "R(h) = E[ℓ(Y, h(X))], l’espérance de la perte sur la loi inconnue P_XY."
  ],
  [
    "pa-u3",
    "u3c2",
    "Que devient R(h) avec la perte 0/1 ?",
    "La probabilité d’erreur : R(h) = P(Y ≠ h(X))."
  ],
  [
    "pa-u3",
    "u3c3",
    "Cas réalisable et cas agnostique ?",
    "Réalisable : le meilleur classifieur a un risque nul, R(h*) = 0. Agnostique : R(h*) est en général non nul (bruit, modèle trop simple)."
  ],
  [
    "pa-u4",
    "u4c1",
    "Nombre d’étiquettes pour apprendre un seuil à ε près (cas réalisable), passif et actif ?",
    "Passif : O(1/ε). Actif (dichotomie) : O(log(1/ε)). Gain exponentiel."
  ],
  [
    "pa-u4",
    "u4c2",
    "Pourquoi la dichotomie est-elle si efficace sur les seuils ?",
    "Chaque requête coupe en deux la zone où peut se trouver le seuil : un bit d’information par étiquette."
  ],
  [
    "pa-u4",
    "u4c3",
    "Pourquoi l’apprentissage actif n’aide-t-il pas toujours (exemple des intervalles) ?",
    "Si l’intervalle positif est très petit, aucune étiquette ne renseigne sur sa position tant qu’on ne tombe pas dessus : il peut falloir demander toutes les étiquettes."
  ],
  [
    "pa-u5",
    "u5c1",
    "Les étapes de la boucle pool-based ?",
    "Entraîner sur D_l, scorer chaque x de D_u, demander l’étiquette du meilleur x, l’ajouter à D_l, recommencer jusqu’au budget."
  ],
  [
    "pa-u5",
    "u5c2",
    "Qu’est-ce que le démarrage à froid et comment le traite-t-on ?",
    "Au départ le modèle n’a rien appris et ne peut pas juger l’informativité : on commence par un petit lot tiré au hasard."
  ],
  [
    "pa-u6",
    "u6c1",
    "Formule du critère « moins confiant » ?",
    "x_LC = arg max_x [1 − P(ŷ | x)], ŷ étant la classe la plus probable."
  ],
  [
    "pa-u6",
    "u6c2",
    "Formule du critère de marge ?",
    "x_M = arg min_x [P(ŷ1 | x) − P(ŷ2 | x)], avec ŷ1 et ŷ2 les deux classes les plus probables."
  ],
  [
    "pa-u6",
    "u6c3",
    "Formule du critère d’entropie ?",
    "x_E = arg max_x [− Σ_i P(y_i | x) log P(y_i | x)]."
  ],
  [
    "pa-u6",
    "u6c4",
    "Que se passe-t-il pour les trois critères en classification binaire ?",
    "Ils sont équivalents : ils choisissent le point dont P(1 | x) est le plus proche de 0,5."
  ],
  [
    "pa-u6",
    "u6c5",
    "Limite commune aux trois critères d’incertitude ?",
    "Ils mesurent l’incertitude sur l’étiquette à modèle fixé, pas l’incertitude sur le modèle : d’où la myopie."
  ],
  [
    "pa-u7",
    "u7c1",
    "Contenu d’information d’une réponse y de probabilité P(y) ?",
    "I(y) = − log P(y)."
  ],
  [
    "pa-u7",
    "u7c2",
    "Pourquoi prend-on l’espérance de l’information ?",
    "On ne connaît pas la réponse de l’oracle à l’avance : on moyenne sur les réponses possibles, ce qui donne l’entropie."
  ],
  [
    "pa-u7",
    "u7c3",
    "Entropie de K classes équiprobables, en bits ?",
    "log2 K (1 bit pour 2 classes, 2 bits pour 4)."
  ],
  [
    "pa-u8",
    "u8c1",
    "Qu’est-ce qu’un algorithme statistiquement consistant ?",
    "Un algorithme qui, avec un échantillon d’apprentissage infini, converge vers la meilleure hypothèse h*."
  ],
  [
    "pa-u8",
    "u8c2",
    "Pourquoi l’échantillonnage par incertitude est-il myope ?",
    "Il interroge autour de la frontière estimée aux premières itérations : les étiquettes ne sont plus i.i.d., et le modèle devient trop sûr de lui sur des régions jamais vues."
  ],
  [
    "pa-u8",
    "u8c3",
    "Quel remède le cours propose-t-il à la myopie ?",
    "Modéliser l’incertitude sur le classifieur lui-même avec plusieurs classifieurs (un comité)."
  ],
  [
    "pa-u9",
    "u9c1",
    "Définition de l’espace des versions V(Z) ?",
    "L’ensemble des hypothèses de H compatibles avec toutes les données étiquetées de Z : V(Z) = {h ∈ H : h(x) = y pour tout (x, y) ∈ Z}."
  ],
  [
    "pa-u9",
    "u9c2",
    "Définition de la région de désaccord R(H) ?",
    "L’ensemble des points x pour lesquels deux hypothèses de H donnent des étiquettes différentes."
  ],
  [
    "pa-u9",
    "u9c3",
    "Pourquoi n’interroge-t-on pas hors de la région de désaccord (cas réalisable) ?",
    "Toutes les hypothèses compatibles y donnent la même étiquette : la réponse n’éliminerait aucune hypothèse."
  ],
  [
    "pa-u10",
    "u10c1",
    "Règle de décision de CAL pour un point x_t ?",
    "Demander l’étiquette s’il existe h, h′ dans H_t qui ne sont pas d’accord sur x_t, puis garder seulement les hypothèses compatibles ; sinon ne rien demander."
  ],
  [
    "pa-u10",
    "u10c2",
    "Principal inconvénient de CAL ?",
    "Il faut mémoriser l’espace des versions H_t, qui peut être très grand."
  ],
  [
    "pa-u10",
    "u10c3",
    "Comment tester implicitement si x est dans la région de désaccord ?",
    "Entraîner le classifieur avec (x, 0) puis avec (x, 1) ajouté aux données : si les deux réussissent, les deux étiquettes restent possibles."
  ],
  [
    "pa-u11",
    "u11c1",
    "Formule de l’entropie de vote ?",
    "x_VE = arg max_x [− Σ_i (V(y_i)/C) log (V(y_i)/C)], V(y_i) votes pour y_i parmi C membres."
  ],
  [
    "pa-u11",
    "u11c2",
    "Définition de la probabilité de consensus P_C ?",
    "La moyenne des probabilités des membres : P_C(y|x) = (1/C) Σ_c P_θ(c)(y|x)."
  ],
  [
    "pa-u11",
    "u11c3",
    "Que vaut la KL moyenne au consensus si tous les membres donnent (0,5 ; 0,5) ?",
    "0 : ils sont d’accord (pour hésiter). La KL mesure le désaccord, pas l’incertitude."
  ],
  [
    "pa-u11",
    "u11c4",
    "Différence entre incertitude sur l’étiquette et sur le modèle ?",
    "Sur l’étiquette : un modèle hésite (entropie de sa loi). Sur le modèle : plusieurs modèles plausibles se contredisent (désaccord du comité, KL)."
  ],
  [
    "pa-u12",
    "u12c1",
    "Pourquoi un point isolé est-il un mauvais choix de requête malgré une forte incertitude ?",
    "Son étiquette n’aide à classer aucun autre point : il n’a pas d’influence sur ses voisins."
  ],
  [
    "pa-u12",
    "u12c2",
    "Formule de sélection incertitude × influence ?",
    "x_ID = arg max_x [|LIG(x)| × |LIF(x)|^β], β réglant le poids de l’influence (densité)."
  ],
  [
    "pa-u13",
    "u13c1",
    "Complexité en étiquettes, cas séparable, passif et actif ?",
    "Passif ~ d_VC/ε. Actif (CAL) ~ θ d_VC log(1/ε)."
  ],
  [
    "pa-u13",
    "u13c2",
    "Complexité en étiquettes, cas agnostique ?",
    "Passif ~ d_VC/ε². Actif ~ θ(d_VC log²(1/ε)) + d_VC ν²/ε², ν étant le meilleur taux d’erreur."
  ],
  [
    "pa-u13",
    "u13c3",
    "Pourquoi la dimension VC ne suffit-elle pas en actif ?",
    "Le gain dépend aussi de la loi des données et de la cible : deux problèmes de même d_VC peuvent avoir des gains très différents. D’où le coefficient de désaccord et le splitting index."
  ],
  [
    "pa-u13",
    "u13c4",
    "Effet du bruit ν sur le gain de l’actif ?",
    "Le terme d_VC ν²/ε² domine quand ν est grand devant ε : le gain fond."
  ],
  [
    "pa-u14",
    "u14c1",
    "Définition de la pseudo-métrique de désaccord ?",
    "d(h, h′) = P[h(X) ≠ h′(X)]."
  ],
  [
    "pa-u14",
    "u14c2",
    "Définition du coefficient de désaccord θ ?",
    "θ = sup_{r>0} P[DIS(B(h, r))] / r : vitesse de croissance de la région de désaccord avec le rayon de la boule."
  ],
  [
    "pa-u14",
    "u14c3",
    "Valeur de θ pour les seuils sur ℝ (loi uniforme) et pourquoi ?",
    "θ = 2 : la boule de rayon r contient les seuils dans [w* − r, w* + r], dont la région de désaccord a une probabilité 2r."
  ],
  [
    "pa-u14",
    "u14c4",
    "Borne de θ pour les classifieurs linéaires dans ℝ^d ?",
    "θ ≤ √d, d’où une complexité en étiquettes en d_VC^{3/2} log(1/ε)."
  ],
  [
    "pa-u15",
    "u15c1",
    "Définition du bruit borné ?",
    "|P[Y = 1 | X = x] − 1/2| > b > 0 pour tout x : η ne s’approche jamais de 1/2."
  ],
  [
    "pa-u15",
    "u15c2",
    "Pourquoi l’échantillonnage par incertitude « cherche le bruit » ?",
    "Dans une zone bruitée, le modèle hésite toujours (η proche de 1/2) : il y place ses requêtes alors que l’étiquette n’y apprend rien."
  ],
  [
    "pa-u15",
    "u15c3",
    "Différence entre bruit non borné et bruit borné pour l’actif ?",
    "Borné : la frontière reste nettement signalée, une partie du gain subsiste. Non borné : η traverse 1/2 en douceur, aucun indice net de la frontière."
  ]
],
    quiz: [
      ['pa-u1', R`Dans le TFE, quelle étiquette justifie l’apprentissage actif ?`, ['la véracité d’un lien de propriété', 'la détresse d’une entité', 'le montant d’exposition', 'le secteur d’activité'], 0, R`La détresse se calcule par des règles sur données publiques, sans coût. Vérifier un lien demande de remonter à une source primaire : c’est l’oracle coûteux.`],
      ['pa-u2', R`Une équipe KYC choisit chaque trimestre 50 dossiers à revoir parmi les 12 000 clients existants. Quel scénario ?`, ['pool-based', 'stream-based', 'MQS', 'passif'], 0, R`Le réservoir est connu en entier au moment du choix.`],
      ['pa-u2', R`Chaque transaction entrante doit être envoyée ou non à un analyste, sans attendre les suivantes. Quel scénario ?`, ['stream-based', 'pool-based', 'MQS', 'semi-supervisé'], 0, R`Décision immédiate, exemple par exemple.`],
      ['pa-u4', R`Pourquoi l’exemple des intervalles positifs est-il important pour un projet appliqué ?`, ['il montre qu’une stratégie active peut ne rien gagner sur le hasard', 'il prouve que l’actif gagne toujours', 'il montre que le passif est inutile', 'il fixe la valeur de θ'], 0, R`Quand rien ne signale la zone d’intérêt (un petit intervalle, un lien falsifié rare), il faut tout interroger. D’où le tirage aléatoire comme ligne de base obligatoire.`],
      ['pa-u5', R`Pourquoi rapporter plusieurs graines du lot aléatoire initial ?`, ['le premier lot conditionne la suite (myopie) et la variabilité doit se voir', 'pour accélérer le calcul', 'parce que la marge l’exige', 'pour augmenter le budget'], 0, R`Une seule courbe peut refléter un départ chanceux ou malchanceux.`],
      ['pa-u6', R`Point A $(0{,}48 ; 0{,}46 ; 0{,}06)$, point B $(0{,}40 ; 0{,}31 ; 0{,}29)$. Lequel la marge choisit-elle ?`, ['A', 'B', 'les deux', 'aucun'], 0, R`Marge A $0{,}02$, B $0{,}09$. L’entropie, elle, préfère B (masse plus étalée).`],
      ['pa-u6', R`Que mesurent LC, marge et entropie ?`, ['l’incertitude du modèle courant sur l’étiquette', 'l’incertitude sur le modèle lui-même', 'la densité des données', 'le bruit de l’oracle'], 0, R`À modèle fixé. L’incertitude sur le modèle demande un comité.`],
      ['pa-u8', R`Signe pratique de myopie dans une expérience ?`, ['la courbe plafonne sous celle du hasard et dépend fortement de la graine initiale', 'la courbe monte plus vite que le hasard', 'le budget est épuisé', 'l’entropie vaut 0'], 0, R`Biais d’échantillonnage : on n’interroge qu’autour de la première frontière.`],
      ['pa-u9', R`Seuils, connus : $y(0{,}3)=0$, $y(0{,}6)=1$. Région de désaccord ?`, ['$]0{,}3 ; 0{,}6[$', '$[0 ; 0{,}3]$', '$[0{,}6 ; 1]$', '$[0 ; 1]$'], 0, R`Entre le plus grand 0 connu et le plus petit 1 connu.`],
      ['pa-u11', R`Trois membres donnent tous $(0{,}5 ; 0{,}5)$. Que valent l’entropie du consensus et la KL moyenne ?`, ['1 bit et 0', '0 et 1 bit', '1 bit et 1 bit', '0 et 0'], 0, R`Ils hésitent tous (entropie maximale) mais sont d’accord entre eux (KL nulle).`],
      ['pa-u11', R`Pourquoi un comité de modèles presque identiques est-il peu utile ?`, ['ils se trompent ensemble, leur désaccord ne signale rien', 'il coûte trop cher', 'la KL n’est pas définie', 'il viole le cas réalisable'], 0, R`Le désaccord n’informe que si les membres sont variés.`],
      ['pa-u12', R`Incertitude seule : A (isolé) 0,95, B (au cœur d’un amas, densité 0,8) 0,70. Avec $\beta=1$ et densité de A 0,1, qui est choisi ?`, ['B', 'A', 'égalité', 'aucun'], 0, R`A : $0{,}095$, B : $0{,}56$.`],
      ['pa-u13', R`Quel terme efface le gain de l’actif quand le bruit grandit ?`, ['$d_{VC}\nu^2/\epsilon^2$', '$\theta d_{VC}\log(1/\epsilon)$', '$d_{VC}/\epsilon$', '$\log^2(1/\epsilon)$'], 0, R`Il est du même ordre que le passif agnostique quand $\nu$ approche $\epsilon$.`],
      ['pa-u14', R`Que signifie un grand coefficient de désaccord pour une banque ?`, ['même les bons modèles se contredisent sur une large part du portefeuille : la revue humaine restera lourde', 'le modèle est parfait', 'les données sont séparables', 'le budget est infini'], 0, R`θ mesure la taille de la zone de désaccord près de l’optimum.`],
      ['pa-u15', R`Un falsificateur fabrique un lien qui ressemble aux liens vrais. Quelle stratégie risque le plus de le rater ?`, ['l’échantillonnage par incertitude', 'le tirage aléatoire', 'l’oracle complet', 'aucune'], 0, R`Le modèle est sûr de lui sur ce lien : il ne le propose pas. Un adversaire n’est pas du bruit. C’est une hypothèse à tester dans le projet.`],
    ],
    gens: {
      // Risque d'un seuil, loi uniforme, sans bruit : R = |w - w*|
      'pa-u3': [
        () => {
          const ws = rnd(20, 70) / 100, w = Math.min(0.95, Math.max(0.05, ws + pick([-1, 1]) * rnd(2, 15) / 100));
          return { q: R`Sur $[0,1]$ uniforme, sans bruit, la vraie frontière est $w^*=${f(ws, 2)}$ (étiquette 1 à droite). Risque 0/1 du seuil $w=${f(w, 2)}$ ?`, a: Math.abs(w - ws), tol: 0.001,
            expl: R`Le seuil se trompe exactement entre $w$ et $w^*$ : $R=|w-w^*|=${f(Math.abs(w - ws), 2)}$.` };
        },
      ],
      'pa-u4': [
        () => {
          const eps = pick([0.01, 0.005, 0.002, 0.001, 0.0005, 0.0001]);
          const n = Math.ceil(Math.log2(1 / eps));
          return { q: R`Seuil sur $[0,1]$, cas réalisable, précision voulue $\epsilon=${f(eps, 4)}$. Nombre d’étiquettes de la dichotomie ?`, a: n, tol: 0,
            expl: R`$\lceil\log_2(1/\epsilon)\rceil=\lceil${f(Math.log2(1 / eps), 2)}\rceil=${n}$. Le passif en demanderait de l’ordre de $1/\epsilon=${Math.round(1 / eps)}$.` };
        },
      ],
      // Les trois critères d'incertitude, sur des lois tirées au hasard
      'pa-u6': [
        () => {
          const p = pick([[0.42, 0.40, 0.10, 0.08], [0.55, 0.25, 0.15, 0.05], [0.35, 0.30, 0.20, 0.15], [0.60, 0.38, 0.01, 0.01]]);
          return { q: R`Probabilités a posteriori $(${p.map(x => f(x, 2)).join(' ; ')})$. Score « moins confiant » $1-P(\hat y_1|x)$ ?`, a: 1 - p[0], tol: 0.001, expl: R`$1-${f(p[0], 2)}=${f(1 - p[0], 2)}$.` };
        },
        () => {
          const p = pick([[0.42, 0.40, 0.10, 0.08], [0.55, 0.25, 0.15, 0.05], [0.35, 0.30, 0.20, 0.15], [0.60, 0.38, 0.01, 0.01]]);
          return { q: R`Probabilités a posteriori $(${p.map(x => f(x, 2)).join(' ; ')})$. Marge $P(\hat y_1|x)-P(\hat y_2|x)$ ?`, a: p[0] - p[1], tol: 0.001, expl: R`$${f(p[0], 2)}-${f(p[1], 2)}=${f(p[0] - p[1], 2)}$. Plus la marge est petite, plus le point est informatif.` };
        },
        () => {
          const p = pick([[0.42, 0.40, 0.10, 0.08], [0.55, 0.25, 0.15, 0.05], [0.35, 0.30, 0.20, 0.15], [0.60, 0.38, 0.01, 0.01], [0.25, 0.25, 0.25, 0.25]]);
          const h = -p.reduce((s, x) => s + (x > 0 ? x * Math.log2(x) : 0), 0);
          return { q: R`Probabilités $(${p.map(x => f(x, 2)).join(' ; ')})$. Entropie en bits ? (3 décimales)`, a: h, tol: 0.003,
            expl: R`$-\sum p\log_2 p=${f(h)}$ bits. Maximum pour 4 classes : $\log_2 4=2$.` };
        },
        // Les deux critères fins ne choisissent pas toujours le même point
        () => {
          const A = [0.48, 0.46, 0.06], B = [0.40, 0.31, 0.29];
          const H = p => -p.reduce((s, x) => s + x * Math.log2(x), 0);
          return { q: R`Point A : $(${A.map(x => f(x, 2)).join(' ; ')})$, point B : $(${B.map(x => f(x, 2)).join(' ; ')})$. Réponds 1 si marge et entropie choisissent le même point, 0 sinon.`, a: 0, tol: 0,
            expl: R`Marge : A $${f(A[0] - A[1], 2)}$, B $${f(B[0] - B[1], 2)}$, donc la marge choisit A. Entropie : A $${f(H(A))}$, B $${f(H(B))}$ bits, donc l’entropie choisit B. Même phénomène que la slide 39.` };
        },
      ],
      'pa-u7': [
        () => {
          const p = pick([0.5, 0.6, 0.7, 0.8, 0.9, 0.95, 0.99]);
          const h = -(p * Math.log2(p) + (1 - p) * Math.log2(1 - p));
          return { q: R`Classification binaire, $P(1|x)=${f(p, 2)}$. Information attendue de la réponse de l’oracle, en bits ? (3 décimales)`, a: h, tol: 0.003,
            expl: R`$-[${f(p, 2)}\log_2 ${f(p, 2)}+${f(1 - p, 2)}\log_2 ${f(1 - p, 2)}]=${f(h)}$ bit.` };
        },
      ],
      // CAL sur des seuils : y a-t-il désaccord ?
      'pa-u10': [
        () => {
          const lo = rnd(10, 40) / 100, hi = rnd(55, 85) / 100, x = pick([rnd(2, 9) / 100, rnd(Math.round(lo * 100) + 2, Math.round(hi * 100) - 2) / 100, rnd(88, 98) / 100]);
          const q = x > lo && x < hi ? 1 : 0;
          return { q: R`Seuils sur $[0,1]$ (1 à droite). Déjà connus : $y(${f(lo, 2)})=0$ et $y(${f(hi, 2)})=1$. Nouveau point $x=${f(x, 2)}$. Réponds 1 si CAL demande l’étiquette, 0 sinon.`, a: q, tol: 0,
            expl: q ? R`$x$ est dans la région de désaccord $]${f(lo, 2)} ; ${f(hi, 2)}[$ : certains seuils compatibles disent 0, d’autres 1. On demande.` : R`$x$ est hors de $]${f(lo, 2)} ; ${f(hi, 2)}[$ : tous les seuils compatibles donnent la même étiquette, on la déduit gratuitement.` };
        },
      ],
      'pa-u11': [
        () => {
          const v = pick([[3, 2], [4, 1], [5, 0], [2, 2, 1], [3, 1, 1], [6, 1], [4, 3]]);
          const C = v.reduce((a, b) => a + b);
          const h = -v.filter(x => x).reduce((s, x) => s + x / C * Math.log2(x / C), 0);
          return { q: R`Comité de ${C} membres, votes par classe : $(${v.join(' ; ')})$. Entropie de vote en bits ? (3 décimales)`, a: h, tol: 0.003,
            expl: R`$-\sum_i \frac{V(y_i)}{C}\log_2\frac{V(y_i)}{C}=${f(h)}$ bit.` };
        },
        () => {
          const P = pick([[[0.9, 0.1], [0.1, 0.9], [0.5, 0.5]], [[0.8, 0.2], [0.6, 0.4], [0.7, 0.3]], [[0.5, 0.5], [0.5, 0.5], [0.5, 0.5]], [[0.95, 0.05], [0.05, 0.95], [0.95, 0.05]]]);
          const cons = [0, 1].map(i => P.reduce((a, p) => a + p[i], 0) / P.length);
          const kl = P.reduce((a, p) => a + p.reduce((b, x, i) => b + (x > 0 ? x * Math.log2(x / cons[i]) : 0), 0), 0) / P.length;
          return { q: R`Trois membres, probabilités (classe 0 ; classe 1) : ${P.map(p => `$(${f(p[0], 2)} ; ${f(p[1], 2)})$`).join(', ')}. KL moyenne au consensus, en bits ? (3 décimales)`, a: kl, tol: 0.003,
            expl: R`Consensus $P_C=(${f(cons[0])} ; ${f(cons[1])})$. Moyenne des $D(P_c\|P_C)$ : $${f(kl)}$ bit. Nulle seulement si tous les membres donnent la même loi.` };
        },
      ],
      'pa-u12': [
        () => {
          const u = rnd(20, 95) / 100, d = rnd(10, 90) / 100, b = pick([0, 0.5, 1, 2]);
          const s = u * d ** b;
          return { q: R`Incertitude $${f(u, 2)}$, densité $${f(d, 2)}$, $\beta=${f(b, 1)}$. Score $\text{incertitude}\times\text{densité}^\beta$ ? (3 décimales)`, a: s, tol: 0.002,
            expl: R`$${f(u, 2)}\times${f(d, 2)}^{${f(b, 1)}}=${f(s)}$.${b === 0 ? ' Avec $\\beta=0$ on retrouve l’incertitude seule.' : ''}` };
        },
      ],
      'pa-u13': [
        () => {
          const d = pick([5, 10, 20, 50]), eps = pick([0.1, 0.05, 0.01]);
          const pas = d / eps, act = 2 * d * Math.log(1 / eps);
          return { q: R`Seuils généralisés, cas séparable : $d_{VC}=${d}$, $\theta=2$, $\epsilon=${f(eps, 2)}$. Rapport passif / actif, avec $d/\epsilon$ contre $\theta d\ln(1/\epsilon)$ ? (1 décimale)`, a: pas / act, tol: 0.06,
            expl: R`Passif $${f(pas, 0)}$, actif $2\times${d}\times\ln(${f(1 / eps, 0)})=${f(act, 1)}$, rapport $${f(pas / act, 1)}$. Ce sont des ordres de grandeur (notation $\sim$).` };
        },
        () => {
          const d = 10, eps = pick([0.05, 0.02, 0.01]), nu = pick([0.01, 0.05, 0.1]);
          const t = d * nu * nu / (eps * eps);
          return { q: R`Cas agnostique, $d_{VC}=10$, $\epsilon=${f(eps, 2)}$, $\nu=${f(nu, 2)}$. Valeur du terme $d_{VC}\,\nu^2/\epsilon^2$ ?`, a: t, tol: 0.5,
            expl: R`$10\times${f(nu, 2)}^2/${f(eps, 2)}^2=${f(t, 1)}$. À comparer au passif $d/\epsilon^2=${f(d / eps / eps, 0)}$ : plus $\nu$ approche $\epsilon$, plus le gain de l’actif fond.` };
        },
      ],
      'pa-u14': [
        () => {
          const r = rnd(1, 20) / 100;
          return { q: R`Seuils, loi uniforme sur $[0,1]$, $w^*=0{,}5$. Probabilité de la région de désaccord de la boule $B(h^*, ${f(r, 2)})$ ?`, a: 2 * r, tol: 0.001,
            expl: R`La boule contient les seuils de $[0{,}5-r ; 0{,}5+r]$, en désaccord sur tout cet intervalle : $2r=${f(2 * r, 2)}$. D’où $\theta=2r/r=2$.` };
        },
        () => {
          const d = pick([4, 9, 16, 25, 49, 100]);
          return { q: R`Classifieurs linéaires dans $\mathbb R^{${d}}$. Borne supérieure du coefficient de désaccord donnée par le cours ?`, a: Math.sqrt(d), tol: 0.01,
            expl: R`$\theta\le\sqrt d=${f(Math.sqrt(d), 2)}$, d’où une complexité en $d_{VC}^{3/2}\log(1/\epsilon)$.` };
        },
      ],
      'pa-u15': [
        () => {
          const a = rnd(5, 40) / 100, b = rnd(60, 95) / 100;
          const m = Math.min(Math.abs(a - 0.5), Math.abs(b - 0.5));
          return { q: R`$\eta(x)=${f(a, 2)}$ à gauche de la frontière et $${f(b, 2)}$ à droite. Plus grande valeur de $b$ telle que $|\eta(x)-\tfrac12|>b$ soit vraie, à la limite ? (2 décimales)`, a: m, tol: 0.001,
            expl: R`$\min(|${f(a, 2)}-0{,}5|, |${f(b, 2)}-0{,}5|)=${f(m, 2)}$ : tout $b$ strictement inférieur convient. Bruit borné.` };
        },
      ],
    },
  });
})();
