// Espace Projet · Du cours au TFE (vérification de liens de propriété sous budget).
// Fichier généré par outils/convertir.js à partir de source/course.js : modifier la source, pas ce fichier.
(function () {
  const R = String.raw;
  const { pick, rnd, f } = COURSE.u;

  COURSE.add({
    id: "pj-tfe",
    space: 'projet',
    title: "Du cours au TFE",
    short: "Cas TFE",
    source: "Proposition de projet (pas un résultat mesuré)",
    seen: null,
    pitch: "Vérifier des liens de propriété sous budget : cadrage, comité GraphRAG, RAG vectoriel et GNMF, conception de l’expérience, feuille de route.",
    levels: [{"n":5,"title":"Du cours au TFE","lead":"Vérifier des liens de propriété sous budget : un projet qui sert le cours, le TFE et la banque."}],
    sections: [
  {
    "id": "pt-u16",
    "title": "Vérifier des liens de propriété sous budget",
    "slides": "TFE",
    "minutes": 15,
    "skills": [
      "tfecase"
    ],
    "summary": "Pour juger le risque d’un client, une banque regarde tout son groupe : sa mère, ses filiales, les filiales de ses filiales.",
    "fiche": "<h4 class=\"pj-idee\">L’idée</h4>\n<p>Pour juger le risque d’un client, une banque regarde tout son groupe : sa mère, ses filiales, les filiales de ses filiales. Ce groupe se reconstruit à partir de sources publiques : le GLEIF (registre mondial des identifiants d’entités juridiques, dont le niveau 2 dit qui possède qui) et les rapports annuels américains (l’Exhibit 21 d’un 10-K liste les filiales).</p>\n<p>Si quelqu’un falsifie un lien, par exemple en cachant qu’une filiale en détresse appartient au groupe, le verdict sur le client change. Un analyste peut vérifier un lien contre la source primaire, mais pas tous. <b>Quels liens vérifier en premier ?</b> C’est un problème d’apprentissage actif sur un pool.</p>\n<h4 class=\"pj-methode\">Cadrer le problème</h4>\n<table><tr><th>Notion du cours</th><th>Dans le TFE</th></tr>\n<tr><td>Pool <i>D<sub>u</sub></i></td><td>les liens du graphe de propriété à la date <i>t</i></td></tr>\n<tr><td>Étiquette <i>y</i></td><td>lien vrai (0) ou falsifié (1)</td></tr>\n<tr><td>Oracle</td><td>vérification contre la source primaire, par un analyste</td></tr>\n<tr><td>Budget</td><td><i>B</i> vérifications</td></tr>\n<tr><td>Caractéristiques <i>x</i></td><td>à définir : source unique ou corroborée, ancienneté du lien, cohérence des pourcentages, scores des trois approches…</td></tr>\n<tr><td>Comité</td><td>GraphRAG, RAG vectoriel, GNMF (unité 17)</td></tr></table>\n<p><b>Ce que l’apprentissage actif ne fait pas ici</b> : il n’étiquette pas la détresse. Celle-ci est calculée par des règles explicites sur les données publiques ; elle ne coûte rien et n’a pas besoin d’oracle.</p>\n<p><b>Une distinction à poser dès le départ</b> : deux objectifs coexistent.</p>\n<ul><li><b>Apprendre</b> : obtenir un bon modèle de détection après <i>B</i> vérifications (l’objectif du cours).</li>\n<li><b>Trouver</b> : débusquer le plus de liens falsifiés possible pendant les <i>B</i> vérifications (l’objectif d’un analyste).</li></ul>\n<p>Le premier pousse à vérifier les cas incertains, le second les cas les plus suspects. Ce dilemme entre exploration et exploitation est celui du chapitre sur les bandits : c’est le pont naturel vers le chapitre suivant du cours.</p>\n<h4 class=\"pj-formel\">Formulation</h4>\n<p>Graphe <i>G<sub>t</sub></i> = (<i>V</i>, <i>E</i>) à la date <i>t</i>, <i>E</i> = <i>E</i><sub>vrais</sub> ∪ <i>E</i><sub>falsifiés</sub>, les falsifications étant injectées par construction (vérité terrain connue, jamais montrée au système). Une stratégie π choisit séquentiellement <i>e</i><sub>1</sub>, …, <i>e<sub>B</sub></i> ∈ <i>E</i>. Deux métriques, rapportées séparément :</p>\n<ul><li>Rappel de détection : |{<i>e<sub>k</sub></i>} ∩ <i>E</i><sub>falsifiés</sub>| / |<i>E</i><sub>falsifiés</sub>| en fonction de <i>B</i>.</li>\n<li>Qualité du modèle après <i>B</i> vérifications sur les liens non vérifiés (par exemple AUC ou rappel à précision fixée).</li></ul>\n<p>Et une métrique métier : la proportion de verdicts de groupe corrigés après les <i>B</i> vérifications.</p>\n<h4 class=\"pj-tfe\">Pourquoi ce projet est utile</h4>\n<ul><li><b>Pour le cours</b> : il applique le pool-based, les mesures d’incertitude, QBC et le rôle du bruit.</li>\n<li><b>Pour le TFE</b> : il répond à la seconde moitié de RQ2 (« laquelle permet de détecter la manipulation ? ») avec une mesure chiffrée.</li>\n<li><b>Pour la banque</b> : il formalise un problème réel de priorisation de la revue KYC (connaissance du client) et de la revue des bénéficiaires effectifs.</li></ul>\n<p>À faire valider : ajouter un budget de vérification élargit le périmètre du TFE. Il faut le proposer au promoteur, avec ce qu’on y gagne et ce que ça coûte en temps.</p>\n<div class=\"def\"><b>À retenir</b><ul><li>Pool = liens ; oracle = vérification à la source ; budget = <i>B</i>.</li><li>L’actif ne sert pas à étiqueter la détresse (calculée par des règles).</li><li>Apprendre et trouver sont deux objectifs différents.</li></ul></div>"
  },
  {
    "id": "pt-u17",
    "title": "Un comité GraphRAG, RAG vectoriel, GNMF",
    "slides": "TFE",
    "minutes": 15,
    "skills": [
      "tfecase"
    ],
    "summary": "Tes trois approches analysent le même groupe de manières très différentes : en suivant les liens du graphe (GraphRAG), en cherchant des passages de texte proches (RAG vectoriel), ou en décomposant une matrice régularisée par le graphe (GNMF).",
    "fiche": "<h4 class=\"pj-idee\">L’idée</h4>\n<p>Tes trois approches analysent le même groupe de manières très différentes : en suivant les liens du graphe (GraphRAG), en cherchant des passages de texte proches (RAG vectoriel), ou en décomposant une matrice régularisée par le graphe (GNMF). Quand elles rendent le même verdict, c’est rassurant. Quand elles divergent, c’est souvent que les données sont incomplètes ou manipulées. Ce désaccord peut guider la vérification.</p>\n<h4 class=\"pj-methode\">Construire le score</h4>\n<ol>\n<li>Pour chaque entité (ou chaque lien), récupérer le verdict de chaque approche : en détresse ou non, et si possible un score.</li>\n<li>Calculer l’entropie de vote sur 3 membres : 3 contre 0 donne 0 ; 2 contre 1 donne 0,918 bit.</li>\n<li>Départager les égalités (nombreuses avec 3 membres) par la KL au consensus si les scores sont comparables, ou par l’exposition en jeu.</li>\n<li>Vérifier en priorité les liens qui touchent les entités au plus fort désaccord.</li>\n</ol>\n<p><b>Les limites à déclarer d’emblée :</b></p>\n<ul>\n<li>Ce comité n’est pas celui du cours : ses membres ne sont pas tirés de l’espace des versions d’une même famille <i>H</i>. Les garanties de CAL et du coefficient de désaccord ne s’y appliquent pas : il faut mesurer.</li>\n<li>Si les trois approches lisent le même graphe falsifié, elles peuvent se tromper <b>ensemble</b>. Le désaccord ne détecte alors rien. C’est une prédiction à tester, et un résultat intéressant dans les deux sens.</li>\n<li>Les scores des trois méthodes ne sont pas calibrés de la même façon ; la KL n’a de sens qu’après calibration.</li>\n</ul>\n<h4 class=\"pj-formel\">Formulation</h4>\n<p>Comité <i>C</i> = {π<sub>GraphRAG</sub>, π<sub>RAG</sub>, π<sub>GNMF</sub>}, verdicts <i>v<sub>c</sub></i>(<i>u</i>) ∈ {0, 1} pour l’entité <i>u</i>. Score de désaccord <i>s</i>(<i>u</i>) = VE(<i>u</i>) = − Σ<sub><i>k</i></sub> (<i>V<sub>k</sub></i>/3) log<sub>2</sub>(<i>V<sub>k</sub></i>/3). Score d’un lien <i>e</i> = (<i>a</i>, <i>b</i>) : par exemple max(<i>s</i>(<i>a</i>), <i>s</i>(<i>b</i>)), ou le désaccord sur le verdict du groupe qui contient <i>e</i>.</p>\n<p>Lignes de base obligatoires : tirage aléatoire (plancher), « liens les plus suspects selon une seule approche » (exploitation pure), et l’oracle complet (plafond : toutes les falsifications trouvées en |<i>E</i><sub>falsifiés</sub>| vérifications).</p>\n<h4 class=\"pj-tfe\">Ce que ça apporte au TFE</h4>\n<p>Ce score relie RQ1 et RQ2 : la qualité des verdicts de chaque approche (RQ1) et leur capacité collective à signaler une manipulation (RQ2). Il réutilise des sorties que le TFE produit de toute façon : son coût marginal est faible.</p>\n<div class=\"def\"><b>À retenir</b><ul><li>Désaccord des trois approches = candidat à la vérification.</li><li>Pas de garantie théorique : comité hétérogène, erreurs possiblement corrélées.</li><li>Toujours comparer au hasard, à l’exploitation pure et à l’oracle.</li></ul></div>"
  },
  {
    "id": "pt-u18",
    "title": "Concevoir l’expérience",
    "slides": "TFE",
    "minutes": 18,
    "skills": [
      "tfedesign"
    ],
    "summary": "Une expérience convaincante se prépare avant de mesurer : quelle question, quelles méthodes comparées, contre quoi, avec quelle métrique, et ce qu’on prédit.",
    "fiche": "<h4 class=\"pj-idee\">L’idée</h4>\n<p>Une expérience convaincante se prépare avant de mesurer : quelle question, quelles méthodes comparées, contre quoi, avec quelle métrique, et ce qu’on prédit. Écrire la prédiction d’abord donne du poids au résultat, même s’il la dément.</p>\n<h4 class=\"pj-methode\">La check-list</h4>\n<ol>\n<li><b>Vérité terrain par construction</b> : on injecte soi-même <i>k</i> liens falsifiés dans un graphe réel ; le système ne voit jamais lesquels.</li>\n<li><b>Deux familles d’attaque</b> : naïve (lien ajouté au hasard) et ciblée (lien vers une filiale en détresse, construit pour ressembler aux liens vrais).</li>\n<li><b>Stratégies comparées</b> : aléatoire, incertitude d’un modèle, désaccord du comité, exploitation pure, plus l’oracle comme plafond.</li>\n<li><b>Courbes</b> : rappel de détection en fonction de <i>B</i>, sur tout l’intervalle de budget plutôt qu’à un seul <i>B</i>.</li>\n<li><b>Variabilité</b> : plusieurs graines (lot initial, choix des liens falsifiés) ; rapporter des intervalles, pas une seule courbe.</li>\n<li><b>Calage séparé de l’épreuve</b> : tout seuil ou hyperparamètre se fixe sur une partie des groupes, la mesure se fait sur les autres.</li>\n<li><b>Tests appariés</b> : à même graphe et même graine, comparer deux stratégies cas par cas (McNemar exact sur « falsification trouvée ou non à budget <i>B</i> »).</li>\n<li><b>Prédictions écrites avant</b> : par exemple « face à l’attaque ciblée, l’incertitude fait moins bien que le hasard » (unité 15) et « le gain de toute stratégie active diminue quand la vérification est bruitée » (unité 13).</li>\n</ol>\n<h4 class=\"pj-formel\">Pièges connus</h4>\n<ul>\n<li><b>Jeu trivial</b> : si les liens falsifiés ont une caractéristique évidente (par exemple une source absente), toutes les méthodes les trouvent ; un score de 100 % est d’abord une alerte.</li>\n<li><b>Circularité</b> : la détresse étant calculée par des règles, une falsification qui ne touche aucune entité en détresse ne change aucun verdict. Il faut vérifier, avant de mesurer, que chaque falsification injectée change bien quelque chose.</li>\n<li><b>Look-ahead</b> : n’utiliser à la date <i>t</i> que des données publiées avant <i>t</i>.</li>\n<li><b>Agrégats trompeurs</b> : rapporter séparément les deux familles d’attaque, jamais un taux global seul.</li>\n</ul>\n<h4 class=\"pj-tfe\">Lien avec ton stage</h4>\n<p>Le harnais du stage s’adapte directement : simulateur d’attaque adaptatif (E3), ablation par couche, verdicts déterministes, journal de reprise et plafond de dépense. Tu peux le dire tel quel au promoteur : la méthode d’évaluation est déjà rodée, seul le substrat change.</p>\n<div class=\"def\"><b>À retenir</b><ul><li>Vérité par construction, plancher, plafond, contrôles.</li><li>Courbes sur tout le budget, plusieurs graines, tests appariés.</li><li>Prédictions écrites avant la mesure.</li></ul></div>"
  },
  {
    "id": "pt-u19",
    "title": "Le projet, étape par étape",
    "slides": "TFE",
    "minutes": 10,
    "skills": [
      "tfedesign"
    ],
    "summary": "Le projet se mène en trois paliers.",
    "fiche": "<h4 class=\"pj-idee\">L’idée</h4>\n<p>Le projet se mène en trois paliers. Chaque palier produit un livrable montrable : le premier suffit pour le cours, les deux suivants préparent le TFE et le portfolio. L’onglet <b>Projet</b> suit ton avancement étape par étape.</p>\n<h4 class=\"pj-methode\">Les trois paliers</h4>\n<p><b>Palier 1, reproduire le cours (1 à 2 semaines).</b> Un notebook Python qui reproduit l’exemple des gaussiennes (pool-based, LC, marge, entropie, QBC, aléatoire) avec des courbes d’apprentissage sur plusieurs graines. Il valide ta chaîne avant tout résultat nouveau, comme la reproduction d’EnronQA l’avait fait pendant le stage.</p>\n<p><b>Palier 2, le cas TFE sur un vrai graphe (2 à 3 semaines).</b> Télécharger les relations de niveau 2 du GLEIF pour quelques groupes réels, injecter des falsifications par construction, comparer aléatoire, incertitude et un comité simple. À ce stade, le comité peut être fait de modèles classiques (régression logistique, forêt aléatoire, règle) : les trois approches du TFE viendront à Barcelone.</p>\n<p><b>Palier 3, le pont vers le TFE.</b> Une page de synthèse pour le promoteur et le co-superviseur : la question, la méthode, les courbes, les limites, et la proposition d’intégrer la vérification sous budget à RQ2.</p>\n<h4 class=\"pj-formel\">Avant de commencer</h4>\n<ul><li>Demander au Prof. Siebert si le sujet du projet est libre et quel format est attendu.</li><li>Proposer l’extension au Prof. Mahmoudi avant d’y investir du temps de TFE.</li><li>Ne publier dans un dépôt public aucune donnée qui n’est pas déjà publique.</li></ul>\n<h4 class=\"pj-tfe\">Pour ton portfolio</h4>\n<p>Un projet bien présenté pour un recruteur bancaire montre trois choses : un problème métier réel (priorisation de la revue KYC), une méthode rigoureuse (lignes de base, variabilité, tests), et une limite honnête (par exemple « l’incertitude échoue face à une falsification ciblée »). Le troisième point fait souvent la différence en entretien.</p>\n<div class=\"def\"><b>À retenir</b><ul><li>Palier 1 : reproduire le cours. Palier 2 : vrai graphe GLEIF. Palier 3 : synthèse pour les encadrants.</li><li>Valider le sujet avec le Prof. Siebert et l’extension avec le promoteur.</li></ul></div>"
  }
],
    cards: [
  [
    "pt-u16",
    "u16c1",
    "Dans le TFE, quelle étiquette est coûteuse et laquelle ne l’est pas ?",
    "Coûteuse : la véracité d’un lien de propriété (vérification à la source primaire). Gratuite : la détresse d’une entité, calculée par des règles sur données publiques."
  ],
  [
    "pt-u16",
    "u16c2",
    "Quelles sont les deux sources publiques de liens de propriété du TFE ?",
    "GLEIF Level 2 (qui possède qui, relations de consolidation) et l’Exhibit 21 des 10-K déposés à la SEC (liste des filiales)."
  ],
  [
    "pt-u16",
    "u16c3",
    "Les deux objectifs distincts d’une campagne de vérification ?",
    "Apprendre (bon modèle après B vérifications) et trouver (le plus de liens falsifiés pendant les B vérifications). Le dilemme relève de l’exploration et de l’exploitation (bandits)."
  ],
  [
    "pt-u17",
    "u17c1",
    "Entropie de vote d’un comité de 3 membres à 2 contre 1 ?",
    "0,918 bit (log2). À 3 contre 0 : 0."
  ],
  [
    "pt-u17",
    "u17c2",
    "Pourquoi les garanties de CAL ne s’appliquent-elles pas au comité GraphRAG, RAG, GNMF ?",
    "Ses membres ne sont pas des hypothèses d’une même famille H tirées de l’espace des versions : il faut mesurer l’efficacité, pas la déduire."
  ],
  [
    "pt-u17",
    "u17c3",
    "Dans quel cas le désaccord du comité ne détecte-t-il rien ?",
    "Quand les trois approches lisent le même graphe falsifié et se trompent ensemble : erreurs corrélées."
  ],
  [
    "pt-u18",
    "u18c1",
    "Plancher et plafond d’une expérience de vérification sous budget ?",
    "Plancher : tirage aléatoire des liens à vérifier. Plafond : oracle qui vérifie directement les liens falsifiés."
  ],
  [
    "pt-u18",
    "u18c2",
    "Pourquoi tracer une courbe sur tout le budget plutôt qu’un seul B ?",
    "Un seul B peut être choisi (même involontairement) là où la méthode brille ; la courbe montre l’arbitrage complet et répond à l’objection de calibration."
  ],
  [
    "pt-u18",
    "u18c3",
    "Quel test pour comparer deux stratégies sur les mêmes cas ?",
    "Un test apparié, par exemple McNemar exact sur « falsification trouvée ou non à budget B »."
  ],
  [
    "pt-u19",
    "u19c1",
    "Pourquoi commencer le projet par la reproduction de l’exemple du cours ?",
    "Pour valider sa propre chaîne de mesure sur un résultat connu avant de mesurer quoi que ce soit de nouveau."
  ]
],
    quiz: [
      ['pt-u16', R`Pourquoi distinguer « apprendre » et « trouver » dans une campagne de vérification ?`, ['les deux objectifs poussent à vérifier des liens différents (incertains contre suspects)', 'ils donnent toujours le même classement', 'trouver est impossible', 'apprendre ne demande pas d’oracle'], 0, R`Apprendre favorise les cas incertains, trouver favorise les cas les plus suspects : c’est le dilemme exploration et exploitation.`],
      ['pt-u16', R`Quelle source publique liste les filiales d’une société cotée américaine ?`, ['l’Exhibit 21 du 10-K (SEC EDGAR)', 'le GLEIF Level 1', 'le bilan simplifié', 'le registre IBAN'], 0, R`GLEIF Level 2 donne les relations mère et filiale ; l’Exhibit 21 du 10-K liste les filiales.`],
      ['pt-u17', R`Les trois approches lisent le même graphe falsifié et rendent toutes un verdict faux. Que vaut l’entropie de vote ?`, ['0 : le comité est d’accord, il ne signale rien', '1,585 bit', '0,918 bit', 'elle n’est pas définie'], 0, R`Erreurs corrélées : le désaccord ne détecte que ce qui divise les membres.`],
      ['pt-u17', R`Quelle ligne de base donne le plafond d’une expérience de vérification ?`, ['l’oracle qui vérifie directement les liens falsifiés', 'le tirage aléatoire', 'l’incertitude', 'l’entropie de vote'], 0, R`Il trouve toutes les falsifications en autant de vérifications qu’il y en a.`],
      ['pt-u18', R`Toutes les stratégies trouvent 100 % des liens falsifiés avec 10 vérifications. Première réaction ?`, ['suspecter un jeu trivial (une caractéristique trahit les faux liens)', 'publier le résultat', 'augmenter le budget', 'retirer le hasard'], 0, R`Un score de 100 % est d’abord une alerte.`],
      ['pt-u18', R`Une falsification injectée ne touche aucune entité en détresse. Que mesure-t-elle ?`, ['rien sur le verdict : elle ne change aucune conclusion, il faut la contrôler avant la mesure', 'la robustesse de GraphRAG', 'le bruit de l’oracle', 'la myopie'], 0, R`Contrôle d’ancrage : chaque cas doit mettre en jeu ce qu’on prétend mesurer.`],
      ['pt-u18', R`Quel test pour comparer deux stratégies sur les mêmes graphes et les mêmes graines ?`, ['McNemar exact (données appariées)', 'test t non apparié', 'aucun test', 'khi-deux d’indépendance sur les totaux'], 0, R`Les cas sont appariés : on compare cas par cas.`],
      ['pt-u19', R`Pourquoi le palier 1 reproduit-il l’exemple des gaussiennes du cours ?`, ['pour valider la chaîne de mesure sur un résultat connu', 'pour gagner du temps', 'parce que le GLEIF est payant', 'pour éviter les graines'], 0, R`Même logique que la reproduction d’EnronQA pendant le stage.`],
    ],
    gens: {
      'pt-u17': [
        () => {
          const v = pick([[3, 0], [2, 1]]);
          const h = -v.filter(x => x).reduce((s, x) => s + x / 3 * Math.log2(x / 3), 0);
          return { q: R`GraphRAG, RAG vectoriel et GNMF votent « en détresse » ${v[0]} fois sur 3. Entropie de vote en bits ? (3 décimales)`, a: h, tol: 0.003,
            expl: R`${v[1] ? R`$-\left(\tfrac23\log_2\tfrac23+\tfrac13\log_2\tfrac13\right)=0{,}918$ bit.` : 'Accord total : 0 bit.'} Avec 3 membres, seules ces deux valeurs existent : beaucoup d’égalités à départager.` };
        },
      ],
      'pt-u18': [
        () => {
          const F = pick([10, 20, 40]), E = pick([500, 1000, 2000]), B = pick([50, 100, 200]);
          const r = B / E;
          return { q: R`${E} liens dont ${F} falsifiés. Une stratégie aléatoire vérifie ${B} liens. Rappel de détection attendu (proportion des falsifiés trouvés) ? (3 décimales)`, a: r, tol: 0.001,
            expl: R`Chaque lien a une probabilité $B/|E|=${f(r)}$ d’être vérifié, donc le rappel attendu vaut $${f(r)}$ quel que soit le nombre de falsifiés. C’est le plancher à battre.` };
        },
      ],
    },
    project: [
  {
    "id": "p0",
    "step": "Cadrage",
    "title": "Demander au Prof. Siebert si le sujet du projet est libre et le format attendu",
    "hint": "Une question par courriel suffit. Joindre trois lignes de description du sujet."
  },
  {
    "id": "p1",
    "step": "Cadrage",
    "title": "Rédiger la fiche du projet (question, métriques, lignes de base, prédictions)",
    "hint": "Une page. Les prédictions s’écrivent avant toute mesure (unité 18)."
  },
  {
    "id": "p2",
    "step": "Palier 1",
    "title": "Générer le jeu des gaussiennes et le découpage pool / test",
    "hint": "Graines fixées. Garder le test à part du pool."
  },
  {
    "id": "p3",
    "step": "Palier 1",
    "title": "Implémenter la boucle pool-based avec tirage aléatoire",
    "hint": "C’est le plancher : il doit être correct avant tout le reste."
  },
  {
    "id": "p4",
    "step": "Palier 1",
    "title": "Ajouter LC, marge, entropie (et vérifier leur équivalence en binaire)",
    "hint": "Contrôle positif : en binaire, les trois doivent choisir le même point."
  },
  {
    "id": "p5",
    "step": "Palier 1",
    "title": "Ajouter QBC (bootstrap) avec entropie de vote et KL",
    "hint": "Comité de 5 à 10 modèles."
  },
  {
    "id": "p6",
    "step": "Palier 1",
    "title": "Courbes d’apprentissage sur au moins 10 graines, avec intervalles",
    "hint": "Axe des ordonnées de 0 à 1, sans troncature."
  },
  {
    "id": "p7",
    "step": "Palier 1",
    "title": "Ajouter du bruit d’étiquette et observer le gain qui fond",
    "hint": "Prédiction de l’unité 13 à vérifier."
  },
  {
    "id": "p8",
    "step": "Palier 2",
    "title": "Télécharger les relations GLEIF Level 2 de quelques groupes réels",
    "hint": "API publique du GLEIF. Noter la date de téléchargement (look-ahead)."
  },
  {
    "id": "p9",
    "step": "Palier 2",
    "title": "Injecter des falsifications par construction (naïves et ciblées)",
    "hint": "Vérifier que chaque falsification change bien un verdict (contrôle d’ancrage)."
  },
  {
    "id": "p10",
    "step": "Palier 2",
    "title": "Définir les caractéristiques d’un lien et un comité de modèles simples",
    "hint": "Source unique ou corroborée, ancienneté, cohérence des pourcentages…"
  },
  {
    "id": "p11",
    "step": "Palier 2",
    "title": "Courbes de rappel de détection selon le budget, par famille d’attaque",
    "hint": "Aléatoire, incertitude, comité, exploitation pure, oracle."
  },
  {
    "id": "p12",
    "step": "Palier 2",
    "title": "Tests appariés (McNemar) et lecture des cas d’échec",
    "hint": "Lire les liens ratés un par un, pas seulement les taux."
  },
  {
    "id": "p13",
    "step": "Palier 3",
    "title": "Rédiger la synthèse d’une page pour les encadrants",
    "hint": "Question, méthode, une figure, limites, proposition pour RQ2."
  },
  {
    "id": "p14",
    "step": "Palier 3",
    "title": "Préparer la présentation du projet au cours",
    "hint": "Une seule expérience montrée, les autres en annexe."
  }
],
  });
})();
