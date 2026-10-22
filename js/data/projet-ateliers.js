// Espace Projet · Ateliers : du code au livrable.
// Six ateliers pratiques qui font écrire et exécuter le code des étapes p2 à p13 de la feuille de route (projet-tfe.js).
// Scripts : Espace_Projet_TFE/ateliers/atelierN_*.py ; sorties archivées : Espace_Projet_TFE/ateliers/sorties/.
// Les chiffres des tableaux viennent des exécutions du 22/10/2026 (Python 3.14, numpy 2.5.2, scikit-learn 1.7.2, scipy 1.16.3),
// relus dans les journaux sorties/atelierN_journal.txt. Les ateliers 4 et 6 reposent sur des simulations, déclarées comme telles.
// Le cadrage du projet (vérifier des liens de propriété sous budget) est une proposition, pas encore validée par les professeurs.
(function () {
  const R = String.raw;
  const { pick, rnd, f } = COURSE.u;
  const escHtml = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const code = (src, lang = 'python') => `<pre class="code" data-lang="${lang}"><code>${escHtml(src.replace(/^\n/, ''))}</code></pre>`;
  const sol = (title, html) => `<details class="sol-box"><summary>${title}</summary>${html}</details>`;
  const course = (id, label) => `<a class="link" href="#course/${id}">${label}</a>`;
  const DOSSIER = 'Espace_Projet_TFE\\ateliers';

  COURSE.add({
    id: 'pj-lab',
    space: 'projet',
    title: 'Ateliers : du code au livrable',
    short: 'Ateliers',
    source: 'Scripts Python exécutés le 22/10/2026 · données du TP0, du TP2 et de l’API GLEIF',
    seen: null,
    pitch: 'Six ateliers qui font écrire, exécuter et lire le code de chaque étape de la feuille de route : boucle pool-based, critères d’incertitude, QBC, densité, bandits, graphe GLEIF réel et premier pas vers le TFE.',
    sections: [
      // ================================================================ ATELIER 1
      {
        id: 'pl-1', title: 'Atelier 1 · La boucle pool-based et sa ligne de base aléatoire', slides: 'Atelier', minutes: 25,
        summary: 'Écrire la boucle entraîner, mesurer, interroger, ajouter, la faire tourner avec un tirage aléatoire sur les données du TP2 et lire une courbe d’apprentissage avec son écart type sur 20 graines.',
        fiche: R`
<p><b>Avant de commencer.</b> Ces ateliers servent une proposition de projet (vérifier des liens de propriété sous un budget d’étiquettes, avec à terme un comité GraphRAG, RAG vectoriel et GNMF). Ce cadrage n’est pas encore validé par le Prof. Siebert ni par le Prof. Mahmoudi : les ateliers 1 à 4 restent utiles quel que soit le sujet retenu, les ateliers 5 et 6 en dépendent.</p>
<h4 class="pj-idee">Objectif</h4>
<p>Écrire une fois, proprement, la boucle d’apprentissage actif sur un pool, avec la stratégie de sélection en paramètre. La première stratégie branchée est le tirage aléatoire : c’est le plancher que toutes les autres devront battre. Si ce plancher est faux, toutes les comparaisons suivantes le sont aussi.</p>
<p><b>Étapes de la feuille de route :</b> p2 (découpage pool et test à graines fixées, ici sur les données réelles du TP2 au lieu de gaussiennes régénérées), p3 (boucle avec tirage aléatoire), début de p6 (courbes sur plusieurs graines).</p>
<h4>Théorie à relire</h4>
<p>${course('pa-u5', 'La boucle et le démarrage à froid')} et ${course('pa-u1', 'Pourquoi choisir ses exemples')} (lecture d’une courbe d’apprentissage).</p>
<h4 class="pj-methode">Le code</h4>
<p>Script complet : <code>${DOSSIER}\atelier1_boucle_aleatoire.py</code>. Lancement dans PowerShell, depuis ce dossier : <code>python atelier1_boucle_aleatoire.py</code> (environ 10 s, imports compris). Le cœur :</p>
${code(R`
def boucle(X, y, Xte, yte, init, n_max, choisir, rng):
    lab = list(init)                       # indices déjà étiquetés (D_l)
    scores = []
    while True:
        modele = LogisticRegression().fit(X[lab], y[lab])
        scores.append(modele.score(Xte, yte))   # le test ne sert qu'à mesurer
        if len(lab) >= n_max:
            return np.array(scores), lab
        pool = np.setdiff1d(np.arange(len(X)), lab)  # D_u
        lab.append(int(pool[choisir(modele, X[pool], rng)]))

def aleatoire(modele, Xp, rng):
    return int(rng.integers(len(Xp)))
`)}
<p>Protocole : pool = <code>XYtrain.dat</code> (100 points, 50 par classe), test = <code>XYtest.dat</code> (1000 points, 500 par classe). Lot initial de 4 étiquettes : un point de chaque classe tiré au hasard, plus deux points au hasard (sans les deux classes, la régression logistique refuse de s’entraîner). Une étiquette par itération jusqu’à 60, 20 graines. Le classifieur est une régression logistique et non le kNN à 7 voisins du TP2, parce que ses probabilités sont continues ; c’est un écart assumé avec l’énoncé du TP.</p>
<p><b>Aire sous la courbe d’apprentissage (ALC)</b> : pour résumer une courbe en un nombre sans choisir un budget particulier, on prend la moyenne de l’exactitude sur toute la plage d’étiquettes, par la règle des trapèzes : $\text{ALC}=\frac{1}{n_{\max}-n_0}\int_{n_0}^{n_{\max}}\text{exactitude}(n)\,dn$.</p>
<h4>Résultats obtenus</h4>
<p>Plafond (les 100 points étiquetés) : 0,923. Plancher trivial (toujours prédire la même classe) : 0,500.</p>
<table><tr><th>étiquettes</th><th>moyenne</th><th>écart type</th><th>min</th><th>max</th></tr>
<tr><td>4</td><td>0,815</td><td>0,129</td><td>0,500</td><td>0,927</td></tr>
<tr><td>6</td><td>0,859</td><td>0,090</td><td>0,524</td><td>0,927</td></tr>
<tr><td>10</td><td>0,894</td><td>0,030</td><td>0,829</td><td>0,926</td></tr>
<tr><td>15</td><td>0,901</td><td>0,032</td><td>0,798</td><td>0,926</td></tr>
<tr><td>20</td><td>0,912</td><td>0,016</td><td>0,867</td><td>0,927</td></tr>
<tr><td>30</td><td>0,915</td><td>0,010</td><td>0,894</td><td>0,926</td></tr>
<tr><td>40</td><td>0,919</td><td>0,005</td><td>0,906</td><td>0,926</td></tr>
<tr><td>60</td><td>0,922</td><td>0,003</td><td>0,916</td><td>0,926</td></tr></table>
<p>ALC entre 4 et 60 étiquettes : 0,911 ± 0,008. Nombre d’étiquettes pour arriver à 0,01 du plafond, par graine : médiane 6,5 ; 6 graines sur 20 y sont dès 4 étiquettes, la plus lente à 38. Contrôle de reproductibilité : la graine 0 rejouée donne exactement la même courbe. Figure : <code>sorties\atelier1_courbe.png</code>.</p>
${sol('Lecture des résultats', R`<ul>
<li><b>Le problème est facile.</b> Avec 10 étiquettes au hasard, on est en moyenne à 0,894, à 0,03 du plafond. Une stratégie active n’a presque rien à gagner ici : c’est pour cela que l’atelier 2 passe à MNIST.</li>
<li><b>La variabilité compte plus que la moyenne au début.</b> À 4 étiquettes, l’écart type vaut 0,129 et le minimum 0,500 : une graine a produit un classifieur qui prédit partout la même classe. Une seule courbe aurait pu montrer 0,927 ou 0,500 selon la graine.</li>
<li><b>Le maximum dépasse le plafond</b> (0,927 contre 0,923). Un petit sous-ensemble bien placé peut donner une frontière un peu meilleure sur ce test que les 100 points : le « plafond » n’est pas une borne stricte, seulement la référence sur données complètes.</li>
<li><b>Prévisible ?</b> Oui : le TP2 obtenait déjà 0,917 avec le kNN sur tout le train, et deux nuages gaussiens bien séparés se coupent avec très peu de points.</li></ul>`)}
<h4 class="pj-formel">Pièges</h4>
<ul><li>Mesurer sur le pool au lieu du test : le score monte artificiellement, puisque le modèle a vu une partie de ces points.</li>
<li>Changer le lot initial d’une stratégie à l’autre : on compare alors des départs différents. Ici le lot dépend seulement de la graine.</li>
<li>Rapporter une seule graine : à 4 étiquettes, l’écart entre graines (0,500 à 0,927) est plus grand que n’importe quel effet de stratégie attendu.</li></ul>
<h4 class="pj-tfe">Pour aller plus loin</h4>
<p>Remplace la régression logistique par le kNN à 7 voisins du TP2 et compare ton tableau à celui de la fiche TP2 (0,882 ± 0,034 à 20 étiquettes en passif). Les écarts viennent-ils du classifieur, du lot initial (8 contre 2 dans le TP, 2 contre 2 ici) ou du nombre de répétitions ?</p>
<div class="def"><b>À retenir</b><ul><li>La boucle prend la stratégie en paramètre ; l’aléatoire est le premier branché.</li><li>Toujours un plafond, un plancher, plusieurs graines et l’écart type.</li><li>L’ALC résume une courbe sans choisir de budget.</li></ul></div>`,
      },
      // ================================================================ ATELIER 2
      {
        id: 'pl-2', title: 'Atelier 2 · Moins confiant, marge, entropie et QBC sur MNIST', slides: 'Atelier', minutes: 35,
        summary: 'Brancher les trois critères d’incertitude et deux variantes de QBC sur MNIST, puis mesurer honnêtement : ALC, écart apparié à l’aléatoire, Wilcoxon. Seule la marge bat l’aléatoire sur les 10 graines ; l’entropie et la KL font moins bien que le hasard.',
        fiche: R`
<h4 class="pj-idee">Objectif</h4>
<p>Comparer les critères du cours sur un problème où l’apprentissage actif a de la marge pour gagner (10 classes, 2000 images), et apprendre à conclure seulement ce que les données permettent : un critère peut perdre contre le hasard, et ce résultat se rapporte tel quel.</p>
<p><b>Étapes de la feuille de route :</b> p4 (LC, marge, entropie et contrôle d’équivalence en binaire), p5 (QBC bootstrap, entropie de vote et KL), p6 (courbes sur 10 graines avec écart type).</p>
<h4>Théorie à relire</h4>
<p>${course('pa-u6', 'Moins confiant, marge, entropie')}, ${course('pa-u7', 'L’entropie, mesure d’information')}, ${course('pa-u11', 'QBC : entropie de vote et KL')} et ${course('pa-u8', 'Myopie et inconsistance')}.</p>
<h4 class="pj-methode">Le code</h4>
<p>Script : <code>${DOSSIER}\atelier2_incertitude_qbc.py</code> (environ 3 min). Les critères, à partir de <code>P = predict_proba(...)</code> :</p>
${code(R`
def score_incertitude(P, critere):          # plus grand = plus demandé
    s = np.sort(P, axis=1)
    if critere == "moins_confiant": return 1 - s[:, -1]
    if critere == "marge":          return -(s[:, -1] - s[:, -2])
    if critere == "entropie":       return -np.sum(P * np.log2(P + 1e-12), axis=1)

# QBC : 5 régressions logistiques sur des échantillons bootstrap de D_l
Ps = np.array([proba_alignee(modele_bootstrap(), Xp, classes) for _ in range(5)])
votes = ...                                  # comptage des décisions dures
VE = -np.sum(f * np.log2(f + 1e-12), axis=1) # f = votes / 5
Pc = Ps.mean(0)                              # consensus
KL = np.mean(np.sum(Ps * np.log2((Ps + 1e-12) / (Pc + 1e-12)), axis=2), axis=0)
`)}
<p>Protocole : pool de 2000 images de <code>mnist_train.csv.gz</code> (200 par chiffre), test de 2000 images de <code>mnist_test.csv</code> (200 par chiffre), pixels divisés par 255 puis ACP à 50 composantes ajustée sur le pool seul (données non étiquetées, donc permises ; le test n’y entre pas). Régression logistique multinomiale. Lot initial de 20 images au hasard, sans stratification : selon la graine, il contient 7 à 10 chiffres distincts. Requêtes par lots de 10 jusqu’à 300 étiquettes, 10 graines, même lot initial pour toutes les stratégies d’une graine.</p>
<h4>Résultats obtenus</h4>
<p><b>Partie A, contrôle positif</b> (données binaires du TP2, 10 étiquettes) : les trois critères choisissent le même point dans 20 cas sur 20, comme le prévoit le cours.</p>
<p><b>Partie B, MNIST.</b> Plafond (les 2000 images étiquetées) : 0,893. Exactitude de test, moyenne ± écart type sur 10 graines :</p>
<table><tr><th>stratégie</th><th>n = 50</th><th>n = 100</th><th>n = 200</th><th>n = 300</th><th>ALC</th></tr>
<tr><td>aléatoire</td><td>0,627 ± 0,037</td><td>0,722 ± 0,024</td><td>0,799 ± 0,011</td><td>0,820 ± 0,011</td><td>0,747 ± 0,014</td></tr>
<tr><td>moins confiant</td><td>0,608 ± 0,044</td><td>0,702 ± 0,044</td><td>0,790 ± 0,012</td><td>0,829 ± 0,009</td><td>0,733 ± 0,020</td></tr>
<tr><td>marge</td><td>0,652 ± 0,026</td><td>0,760 ± 0,023</td><td>0,829 ± 0,007</td><td>0,851 ± 0,013</td><td><b>0,775 ± 0,010</b></td></tr>
<tr><td>entropie</td><td>0,580 ± 0,046</td><td>0,679 ± 0,049</td><td>0,749 ± 0,036</td><td>0,811 ± 0,018</td><td>0,707 ± 0,032</td></tr>
<tr><td>QBC, entropie de vote</td><td>0,636 ± 0,033</td><td>0,742 ± 0,018</td><td>0,801 ± 0,015</td><td>0,827 ± 0,007</td><td>0,754 ± 0,012</td></tr>
<tr><td>QBC, KL</td><td>0,516 ± 0,040</td><td>0,601 ± 0,051</td><td>0,725 ± 0,030</td><td>0,791 ± 0,013</td><td>0,667 ± 0,021</td></tr></table>
<p>À 20 étiquettes, toutes valent 0,459 ± 0,038 (même lot initial). Écart d’ALC à l’aléatoire, apparié par graine, et test de Wilcoxon signé exact sur les 10 différences :</p>
<table><tr><th>stratégie</th><th>écart d’ALC</th><th>graines gagnées</th><th>Wilcoxon p</th></tr>
<tr><td>moins confiant</td><td>−0,0140 ± 0,0179</td><td>2 sur 10</td><td>0,084</td></tr>
<tr><td>marge</td><td>+0,0281 ± 0,0159</td><td>10 sur 10</td><td>0,002</td></tr>
<tr><td>entropie</td><td>−0,0400 ± 0,0279</td><td>0 sur 10</td><td>0,002</td></tr>
<tr><td>QBC, entropie de vote</td><td>+0,0071 ± 0,0162</td><td>6 sur 10</td><td>0,275</td></tr>
<tr><td>QBC, KL</td><td>−0,0798 ± 0,0207</td><td>0 sur 10</td><td>0,002</td></tr></table>
<p>Pour atteindre l’exactitude de l’aléatoire à 300 étiquettes (0,820), la marge en demande 180 en moyenne ; l’entropie et la KL ne l’atteignent pas dans le budget.</p>
<p><b>Partie C, diagnostic.</b> Hypothèse testée : la KL échoue parce qu’un membre bootstrap qui n’a vu aucun exemple d’un chiffre lui donne une probabilité nulle. Avec un bootstrap stratifié (chaque membre voit toutes les classes), la KL reste à −0,0780 ± 0,0345 d’ALC (0 graine sur 10) et l’entropie de vote à +0,0050 ± 0,0143 (7 sur 10, p = 0,275). L’hypothèse est démentie : l’échec de la KL a une autre cause, non identifiée à ce stade. Figure : <code>sorties\atelier2_courbes.png</code>.</p>
${sol('Lecture des résultats', R`<ul>
<li><b>La marge gagne, nettement et sur chaque graine</b> : 10 graines sur 10, et elle atteint en 180 étiquettes ce que l’aléatoire atteint en 300. Avec 10 classes, la marge vise les images à la frontière entre deux chiffres (un 4 qui ressemble à un 9), qui déplacent effectivement cette frontière.</li>
<li><b>L’entropie perd contre le hasard</b> sur les 10 graines. Une explication plausible, non vérifiée ici : l’entropie favorise les images dont la probabilité est étalée sur beaucoup de chiffres (tracés atypiques, mal écrits), qui renseignent peu sur les frontières utiles ; et les 10 images d’un lot, prises en tête du même classement, se ressemblent souvent. L’atelier 3 teste une partie de cette explication.</li>
<li><b>QBC à l’entropie de vote ne se distingue pas de l’aléatoire</b> (p = 0,275, 6 graines sur 10) : écrire « QBC aide » serait faux sur cette mesure.</li>
<li><b>La KL est la pire</b>, et la correction qui semblait évidente (bootstrap stratifié) n’y change rien. Un résultat négatif qui résiste à une correction plausible se publie avec son démenti.</li>
<li><b>Prévisible ?</b> Que les critères divergent avec 10 classes, oui (exemple de la slide 39 du cours). Que l’entropie fasse moins bien que le hasard, non : c’est le cas où l’actif ne bat pas l’aléatoire que demandait l’atelier.</li></ul>`)}
<h4 class="pj-formel">Pièges</h4>
<ul><li>Un comité bootstrap peut ignorer une classe : il faut réaligner les colonnes de <code>predict_proba</code> sur la liste des classes (<code>proba_alignee</code> dans le script), sinon les probabilités sont attribuées au mauvais chiffre sans aucun message d’erreur.</li>
<li>Comparer deux stratégies sur des graines différentes : l’écart se mesure apparié, même lot initial, même graine.</li>
<li>Conclure sur un seul budget : à n = 300, le moins confiant devance l’aléatoire (0,829 contre 0,820) alors que son ALC est plus basse. L’ALC et la courbe entière évitent de choisir le budget qui arrange.</li>
<li>Ajuster l’ACP sur le pool et le test : le test fuit dans la représentation.</li></ul>
<h4 class="pj-tfe">Pour aller plus loin</h4>
<p>Pour comprendre l’échec de l’entropie et de la KL, affiche les 10 premières images choisies à la première requête par chaque critère (avec <code>matplotlib</code>, dans <code>sorties</code>) et compte leurs chiffres : sont-elles atypiques, ou toutes du même chiffre ? Refais ensuite la mesure avec des lots de 1 au lieu de 10 sur 3 graines pour séparer l’effet du lot de celui du critère.</p>
<div class="def"><b>À retenir</b><ul><li>Contrôle positif d’abord : en binaire, les trois critères coïncident (20 sur 20).</li><li>Sur MNIST, seule la marge bat l’aléatoire sur chaque graine ; entropie et KL perdent.</li><li>Une hypothèse plausible se teste : le bootstrap stratifié ne sauve pas la KL.</li></ul></div>`,
      },
      // ================================================================ ATELIER 3
      {
        id: 'pl-3', title: 'Atelier 3 · Densité, démarrage à froid et oracle bruité', slides: 'Atelier', minutes: 30,
        summary: 'Pondérer l’entropie par la densité ne la sauve pas (plus β est grand, plus elle perd) ; un lot initial choisi par k-means relève le départ de 0,459 à 0,641 ; avec un oracle bruité, la marge garde son avance, contrairement à la prédiction écrite avant la mesure.',
        fiche: R`
<h4 class="pj-idee">Objectif</h4>
<p>Tester trois idées du cours sur le même banc que l’atelier 2 : la pondération par la densité corrige-t-elle l’échec de l’entropie ? un lot initial représentatif aide-t-il au démarrage à froid ? le gain de l’actif fond-il quand l’oracle se trompe ? La troisième question est posée sous forme de prédiction écrite avant la mesure.</p>
<p><b>Étapes de la feuille de route :</b> p6 (variabilité), p7 (bruit d’étiquette et gain qui fond), et la question du démarrage à froid de p3.</p>
<h4>Théorie à relire</h4>
<p>${course('pa-u12', 'Points isolés, bruit et densité')}, ${course('pa-u5', 'La boucle et le démarrage à froid')}, ${course('pa-u13', 'Complexité en étiquettes')} et ${course('pa-u15', 'Les types de bruit')}.</p>
<h4 class="pj-methode">Le code</h4>
<p>Script : <code>${DOSSIER}\atelier3_densite_froid_bruit.py</code>. Il importe la boucle et les données de l’atelier 2 (même pool, même test, mêmes lots initiaux). Les trois ajouts :</p>
${code(R`
# A. densité : 1 / distance moyenne aux 20 plus proches voisins dans le pool
d, _ = NearestNeighbors(n_neighbors=21).fit(X).kneighbors(X)
dens = 1.0 / d[:, 1:].mean(1)
score = entropie * dens ** beta          # beta = 0 redonne l'entropie seule

# B. lot initial : l'image la plus proche de chaque centre d'un k-means à 20 groupes
km = KMeans(n_clusters=20, n_init=1, random_state=g).fit(X)

# C. oracle bruité : avec probabilité eta, un autre chiffre tiré au hasard
bruit = rb.random(len(y)) < eta
oracle = np.where(bruit, (y + rb.integers(1, 10, len(y))) % 10, y)
`)}
<p>Prédiction écrite dans le script avant la partie C : « l’écart d’ALC entre la marge et l’aléatoire diminue quand η augmente » (unité 13 : le terme en $\nu^2/\varepsilon^2$ efface le gain).</p>
<h4>Résultats obtenus</h4>
<p><b>A. Entropie × densité$^\beta$</b> (10 graines ; aléatoire : ALC 0,747 ± 0,014)</p>
<table><tr><th>β</th><th>n = 50</th><th>n = 100</th><th>n = 300</th><th>ALC</th><th>écart à l’aléatoire</th></tr>
<tr><td>0 (entropie seule)</td><td>0,580</td><td>0,679</td><td>0,811</td><td>0,707 ± 0,032</td><td>−0,0400</td></tr>
<tr><td>0,5</td><td>0,577</td><td>0,688</td><td>0,808</td><td>0,708 ± 0,022</td><td>−0,0387</td></tr>
<tr><td>1</td><td>0,552</td><td>0,680</td><td>0,802</td><td>0,698 ± 0,022</td><td>−0,0486</td></tr>
<tr><td>2</td><td>0,507</td><td>0,657</td><td>0,784</td><td>0,676 ± 0,017</td><td>−0,0706</td></tr>
<tr><td>4</td><td>0,484</td><td>0,576</td><td>0,738</td><td>0,627 ± 0,015</td><td>−0,1194</td></tr></table>
<p>Pour chaque β : 0 graine sur 10 au-dessus de l’aléatoire, Wilcoxon p = 0,002.</p>
<p><b>B. Démarrage à froid</b> (20 images au départ). Chiffres distincts dans le lot : 7 à 10 au hasard (10 pour 3 graines sur 10) ; avec k-means, 10 pour 9 graines sur 10 et 9 pour la dernière.</p>
<table><tr><th>lot initial</th><th>puis</th><th>départ</th><th>n = 50</th><th>n = 100</th><th>n = 300</th><th>ALC</th></tr>
<tr><td>hasard</td><td>aléatoire</td><td>0,459</td><td>0,627</td><td>0,722</td><td>0,820</td><td>0,747 ± 0,014</td></tr>
<tr><td>hasard</td><td>marge</td><td>0,459</td><td>0,652</td><td>0,760</td><td>0,851</td><td>0,775 ± 0,010</td></tr>
<tr><td>hasard</td><td>entropie</td><td>0,459</td><td>0,580</td><td>0,679</td><td>0,811</td><td>0,707 ± 0,032</td></tr>
<tr><td>k-means</td><td>aléatoire</td><td>0,641</td><td>0,687</td><td>0,734</td><td>0,821</td><td>0,763 ± 0,016</td></tr>
<tr><td>k-means</td><td>marge</td><td>0,641</td><td>0,696</td><td>0,759</td><td>0,846</td><td>0,782 ± 0,010</td></tr>
<tr><td>k-means</td><td>entropie</td><td>0,641</td><td>0,664</td><td>0,703</td><td>0,807</td><td>0,737 ± 0,007</td></tr></table>
<p><b>C. Oracle bruité</b> (test propre)</p>
<table><tr><th>η</th><th>ALC aléatoire</th><th>ALC marge</th><th>écart marge moins aléatoire</th><th>graines gagnées</th><th>Wilcoxon p</th></tr>
<tr><td>0</td><td>0,747 ± 0,014</td><td>0,775 ± 0,010</td><td>+0,0281 ± 0,0159</td><td>10 sur 10</td><td>0,002</td></tr>
<tr><td>0,2</td><td>0,580 ± 0,024</td><td>0,634 ± 0,020</td><td>+0,0535 ± 0,0278</td><td>10 sur 10</td><td>0,002</td></tr>
<tr><td>0,4</td><td>0,435 ± 0,038</td><td>0,474 ± 0,028</td><td>+0,0387 ± 0,0463</td><td>8 sur 10</td><td>0,020</td></tr></table>
${sol('Lecture des résultats', R`<ul>
<li><b>A. La densité ne sauve pas l’entropie, elle l’enfonce</b> : l’ALC baisse quand β augmente (0,707 à β = 0, 0,627 à β = 4). L’explication « l’entropie choisit des images isolées » de l’atelier 2 n’est donc pas soutenue par cette mesure. Une lecture possible : avec β grand, on interroge le cœur des amas denses, où les images d’un même chiffre se ressemblent et apprennent peu au modèle. La cause de l’échec de l’entropie reste ouverte.</li>
<li><b>B. Le k-means aide surtout au début</b> : départ à 0,641 contre 0,459, parce que presque tous les chiffres sont représentés. L’avantage se dissout ensuite (0,821 contre 0,820 à 300 étiquettes en aléatoire). Il améliore aussi l’entropie (ALC 0,737 contre 0,707) sans la faire passer devant l’aléatoire partant du même lot (0,763).</li>
<li><b>C. La prédiction est démentie</b> sur cette plage : l’écart de la marge sur l’aléatoire passe de +0,028 (η = 0) à +0,054 (η = 0,2) puis +0,039 (η = 0,4), et la dispersion grandit. Il ne diminue pas de façon monotone. La théorie du cours parle de complexité en étiquettes pour une précision ε visée, quand le bruit devient comparable à ε ; ici on mesure une ALC sur un budget fixe de 300, et le bruit pénalise d’abord l’aléatoire, qui apprend aussi sur des étiquettes fausses. La prédiction était mal posée pour cette mesure : il faut l’écrire en termes d’étiquettes nécessaires pour une exactitude donnée.</li>
<li>Dans les trois parties, les écarts de moins de 0,01 d’ALC restent sous l’écart type entre graines : on ne les commente pas.</li></ul>`)}
<h4 class="pj-formel">Pièges</h4>
<ul><li>Multiplier un score négatif par une densité : la marge du script est négative (on maximise −marge), le produit inverse alors le classement. La partie A n’utilise donc que l’entropie, toujours positive.</li>
<li>Bruiter aussi le test : on ne mesurerait plus la qualité du modèle mais sa ressemblance avec l’oracle bruité.</li>
<li>Un k-means peut renvoyer deux centres proches de la même image ; le script prend alors la suivante pour garder exactement 20 images (sinon les courbes n’ont plus la même abscisse).</li></ul>
<h4 class="pj-tfe">Pour aller plus loin</h4>
<p>Reformule la prédiction de la partie C : « le nombre d’étiquettes que la marge économise pour atteindre 0,60 d’exactitude diminue quand η augmente », puis mesure-le avec les courbes archivées dans <code>sorties\atelier3_resultats.json</code> (à compléter par les courbes complètes si besoin). Écris ta prédiction avant de lancer le calcul.</p>
<div class="def"><b>À retenir</b><ul><li>Densité × entropie : plus β grandit, plus l’ALC baisse sur MNIST.</li><li>Un départ k-means relève le début de courbe (0,459 à 0,641), pas la fin.</li><li>Prédiction « le gain fond avec le bruit » démentie sur l’ALC à budget fixe : un démenti se rapporte et se reformule.</li></ul></div>`,
      },
      // ================================================================ ATELIER 4
      {
        id: 'pl-4', title: 'Atelier 4 · Répartir un budget de vérifications : ETC, UCB1, Thompson', slides: 'Atelier', minutes: 25,
        summary: 'Simulation déclarée : quatre files de liens suspects aux taux de liens falsifiés fixés (0,15 ; 0,10 ; 0,05 ; 0,02). Sur 2000 vérifications, Thompson a le regret moyen le plus faible (24,1) ; avec quatre files, le pilote m* de la formule d’ETC dépasse le budget.',
        fiche: R`
<h4 class="pj-idee">Objectif</h4>
<p>Passer de l’objectif « apprendre » à l’objectif « trouver » : un analyste répartit ses vérifications entre quatre files de liens suspects et veut trouver le plus de liens falsifiés pendant son budget. On implémente les stratégies du cours et on mesure leur regret <b>par simulation</b> : les taux des files sont choisis pour l’exercice, aucun n’est mesuré sur des données réelles.</p>
<p><b>Étapes de la feuille de route :</b> aucune étape n’y est consacrée. L’atelier prépare p1 (dire dans la fiche du projet si l’on vise « apprendre », « trouver » ou « identifier ») et p11 (le choix des stratégies comparées).</p>
<h4>Théorie à relire</h4>
<p>${course('pb-2', 'Le regret')}, ${course('pb-3', 'Explore-Then-Commit')}, ${course('pb-4', 'UCB')}, ${course('pb-5', 'Thompson sampling')} et ${course('pb-7', 'Les limites : pool fini')}.</p>
<h4 class="pj-methode">Le code</h4>
<p>Script : <code>${DOSSIER}\atelier4_bandits_files.py</code> (environ 10 s). Les 500 répétitions tournent en parallèle dans des tableaux numpy de forme (répétitions, files) :</p>
${code(R`
moy = np.where(N > 0, S / np.maximum(N, 1), 0.0)            # moyennes observées
ucb = moy + np.sqrt(2 * np.log(t) / N)                      # UCB1, après un tirage par file
theta = rng.beta(S + 1, N - S + 1)                          # Thompson, a priori Bêta(1, 1)
a = argmax_alea(ucb, rng)                                   # ex aequo départagés au hasard
x = rng.random(N_REP) < MU[a]                               # vérification simulée
N[lignes, a] += 1; S[lignes, a] += x
regret[:, t] = (N * (MU.max() - MU)).sum(1)                 # somme des Delta_a N_a
`)}
<p>Réglages : $\mu=(0{,}15 ; 0{,}10 ; 0{,}05 ; 0{,}02)$, budget $n=2000$, 500 répétitions. ε-greedy avec $\varepsilon=0{,}1$. ETC avec $m=20$, $m=100$ et $m^*=\frac{2}{\Delta^2}\ln\frac{n\Delta^2}{2}$ calculé avec le vrai plus petit écart $\Delta=0{,}05$, ce qui donne $m^*=733$ (repère irréaliste, puisqu’il suppose $\Delta$ connu).</p>
<h4>Résultats obtenus</h4>
<p><b>Partie A, bandit stationnaire</b> (cadre du cours). Regret $\sum_a\Delta_a N_a$ en liens falsifiés manqués, moyenne ± écart type sur 500 répétitions :</p>
<table><tr><th>stratégie</th><th>n = 100</th><th>n = 500</th><th>n = 2000</th><th>95e centile à 2000</th><th>part du budget sur la meilleure file</th></tr>
<tr><td>au hasard</td><td>7,03 ± 0,49</td><td>35,01 ± 1,13</td><td>140,05 ± 2,23</td><td>143,8</td><td>0,250</td></tr>
<tr><td>exploitation pure</td><td>4,35 ± 3,91</td><td>20,21 ± 21,56</td><td>79,61 ± 87,91</td><td>259,0</td><td>0,476</td></tr>
<tr><td>ε-greedy</td><td>4,25 ± 3,10</td><td>14,15 ± 12,08</td><td>34,78 ± 30,88</td><td>104,2</td><td>0,747</td></tr>
<tr><td>ETC, m = 20</td><td>6,02 ± 0,58</td><td>12,04 ± 10,69</td><td>31,42 ± 47,36</td><td>102,7</td><td>0,742</td></tr>
<tr><td>ETC, m = 100</td><td>7,00 ± 0</td><td>28,58 ± 1,42</td><td>33,43 ± 18,64</td><td>106,8</td><td>0,796</td></tr>
<tr><td>ETC, m* = 733</td><td>7,00 ± 0</td><td>35,00 ± 0</td><td>140,00 ± 0</td><td>140,0</td><td>0,250</td></tr>
<tr><td>UCB1</td><td>6,22 ± 0,46</td><td>27,17 ± 1,84</td><td>85,37 ± 6,51</td><td>96,5</td><td>0,486</td></tr>
<tr><td>Thompson</td><td>5,23 ± 1,13</td><td>14,41 ± 5,20</td><td><b>24,05 ± 10,90</b></td><td>44,3</td><td>0,831</td></tr></table>
<p>Repère de Lai et Robbins : $\sum_a\Delta_a/\mathrm{kl}(\mu_a,\mu^*)=7{,}9$, soit 59,8 à $n=2000$. Exploitation pure : 261 répétitions sur 500 ont passé moins de la moitié du budget sur la meilleure file.</p>
<p><b>Partie B, pool fini</b> (hypothèse du cours violée) : quatre files de 500 liens contenant 75, 50, 25 et 10 liens falsifiés, tirage sans remise, budget 1000, une file épuisée n’est plus proposée. Liens falsifiés trouvés sur 160 :</p>
<table><tr><th>stratégie</th><th>trouvés</th><th>vérifications par file</th></tr>
<tr><td>oracle informé (connaît les comptes restants)</td><td>125,5 ± 1,3</td><td>490 ; 478 ; 32 ; 0</td></tr>
<tr><td>au hasard</td><td>80,3 ± 6,0</td><td>250 ; 250 ; 250 ; 250</td></tr>
<tr><td>exploitation pure</td><td>102,8 ± 22,8</td><td>393 ; 334 ; 196 ; 78</td></tr>
<tr><td>ETC, m = 20</td><td>114,1 ± 13,6</td><td>475 ; 371 ; 114 ; 40</td></tr>
<tr><td>ETC, m = 100</td><td>110,7 ± 5,4</td><td>494 ; 298 ; 109 ; 100</td></tr>
<tr><td>UCB1</td><td>99,6 ± 5,4</td><td>420 ; 258 ; 177 ; 145</td></tr>
<tr><td>Thompson</td><td><b>115,3 ± 5,1</b></td><td>497 ; 354 ; 96 ; 54</td></tr></table>
<p>Figure : <code>sorties\atelier4_regret.png</code>.</p>
${sol('Lecture des résultats', R`<ul>
<li><b>Thompson domine</b> en moyenne et en pire cas (95e centile 44,3) : il concentre 83 % du budget sur la meilleure file.</li>
<li><b>UCB1 est lent ici</b> (85,4) : son bonus $\sqrt{2\ln t/N_a}$ est grand devant des taux de 0,02 à 0,15, donc il explore longtemps. Sa garantie est asymptotique ; à 2000 vérifications, il n’a fait que 49 % de ses tirages sur la meilleure file.</li>
<li><b>Thompson passe sous le repère de Lai et Robbins</b> (24,1 contre 59,8) : ce n’est pas une contradiction, la borne porte sur la limite de $R_n/\ln n$ quand $n\to\infty$ et ne s’applique pas à un $n$ fini donné.</li>
<li><b>La formule de m* ne sert à rien ici</b> : elle est établie pour deux bras ; avec quatre files, $4\times733=2932$ dépasse le budget de 2000, et ETC explore jusqu’au bout (regret identique au hasard). Un pilote calculé sur le plus petit écart peut être irréalisable.</li>
<li><b>L’exploitation pure a un regret moyen trompeur</b> : 79,6 en moyenne, mais un écart type de 87,9. Elle réussit souvent et échoue parfois très mal, ce que la moyenne seule cache.</li>
<li><b>Pool fini</b> : Thompson et ETC restent proches de l’oracle (115 sur 125,5), UCB1 recule derrière l’exploitation pure en moyenne. Le classement de la partie A ne se transpose pas tel quel quand les files s’épuisent.</li></ul>`)}
<h4 class="pj-formel">Pièges</h4>
<ul><li>Laisser une stratégie tirer dans une file vide : la première version du script le faisait (plus de 500 vérifications dans une file de 500) sans aucune erreur. Le masque des files épuisées a été ajouté après lecture des comptes de tirages.</li>
<li>Départager les ex aequo par <code>np.argmax</code> seul : il choisit toujours la première file, ce qui biaise l’exploitation pure vers la file 1, ici la meilleure.</li>
<li>Présenter ces taux comme ceux d’une banque : ils sont choisis pour l’exercice.</li></ul>
<h4 class="pj-tfe">Pour aller plus loin</h4>
<p>Ajoute un falsificateur adaptatif (fiche ${course('pb-7', 'pb-7')}) : tous les 200 pas, il déplace 5 liens falsifiés de la file la plus vérifiée vers la moins vérifiée. Prédis d’abord quelle stratégie souffre le plus, puis mesure.</p>
<div class="def"><b>À retenir</b><ul><li>Regret $=\sum_a\Delta_a N_a$ ; on rapporte moyenne, écart type et un centile élevé.</li><li>Thompson : 24,1 ± 10,9 à 2000 ; UCB1 : 85,4 ± 6,5 dans cette simulation.</li><li>Le m* d’ETC peut dépasser le budget ; un pool fini change le classement.</li></ul></div>`,
      },
      // ================================================================ ATELIER 5
      {
        id: 'pl-5', title: 'Atelier 5 · Le graphe de propriété réel d’un groupe bancaire (GLEIF)', slides: 'Atelier', minutes: 30,
        summary: 'Télécharger depuis l’API publique du GLEIF les relations de consolidation du groupe BNP Paribas (copie du 22/10/2026), construire le graphe et décrire ce qu’on observe : 519 entités, 518 relations directes, profondeur jusqu’à 6, 14 filles ultimes non rattachées par une chaîne directe.',
        fiche: R`
<h4 class="pj-idee">Objectif</h4>
<p>Passer des données de cours aux données du TFE : récupérer les relations « qui consolide qui » (niveau 2 du GLEIF) d’un groupe bancaire réel, construire le graphe, et le décrire avec les seuls chiffres sortis de l’appel. On ne dit rien de la santé du groupe : on décrit ce que ses entités ont déclaré.</p>
<p><b>Étape de la feuille de route :</b> p8 (télécharger les relations GLEIF Level 2 et noter la date).</p>
<h4>Théorie à relire</h4>
<p>${course('pt-u16', 'Vérifier des liens de propriété sous budget')} (le pool est l’ensemble des liens à la date $t$) et ${course('pt-u18', 'Concevoir l’expérience')} (look-ahead).</p>
<h4 class="pj-methode">Le code</h4>
<p>Script : <code>${DOSSIER}\atelier5_gleif_graphe.py</code>. API publique <code>https://api.gleif.org/api/v1/</code>, sans clé, en lecture seule. Groupe retenu : BNP PARIBAS, LEI <code>R0MUWSFPU8MPRO8K5P83</code>, choisi pour sa taille (plus de 500 entités le déclarent comme mère ultime, assez pour l’atelier 6). Les appels :</p>
${code(R`
GET /lei-records/{racine}
GET /lei-records/{racine}/direct-parent-reporting-exception     (et ultimate-parent-...)
GET /lei-records/{racine}/ultimate-children?page[size]=200       (toutes les pages)
GET /lei-records/{racine}/ultimate-child-relationships?page[size]=200
GET /lei-records/{lei}/direct-child-relationships               (parcours en largeur)
GET /lei-records/{lei}/direct-parent-relationship               (filles ultimes non atteintes)
GET /lei-records/{lei}/direct-parent-reporting-exception        (à défaut de mère déclarée)
`, 'text')}
${code(R`
def get(url):
    fichier = BRUT / (hashlib.sha1(url.encode()).hexdigest()[:20] + ".json")
    if fichier.exists() and not RAFRAICHIR:            # relecture de l'archive
        return json.loads(fichier.read_text(encoding="utf-8"))["reponse"]
    time.sleep(...)                                    # 60 requêtes par minute au plus
    r = requests.get(url, timeout=60)
    ...                                                # archive : URL, heure, réponse
`)}
<p>Une relation directe va de la fille (<code>startNode</code>) à la mère (<code>endNode</code>), de type <code>IS_DIRECTLY_CONSOLIDATED_BY</code>. Chaque réponse est archivée dans <code>sorties\gleif_brut\</code> avec son URL et son heure : un second lancement relit l’archive sans réseau, <code>--rafraichir</code> rappelle tout.</p>
<h4>Résultats obtenus</h4>
<p>Exécution du 22/10/2026 à 08:43 UTC, 552 appels, 587 s. Copie de référence GLEIF : 2026-10-22T00:00:00Z pour les 543 réponses non vides (les 9 autres sont des 404, ressource absente).</p>
<table><tr><th>observation</th><th>valeur</th></tr>
<tr><td>filles ultimes déclarées (BNP Paribas mère ultime)</td><td>524</td></tr>
<tr><td>entités atteintes par les relations directes depuis la racine</td><td>519 (racine comprise)</td></tr>
<tr><td>relations directes (arêtes)</td><td>518, toutes de statut ACTIVE</td></tr>
<tr><td>filles directes de la racine</td><td>139</td></tr>
<tr><td>entités qui ont au moins une fille / feuilles</td><td>54 / 465</td></tr>
<tr><td>mères qui consolident le plus</td><td>BNP PARIBAS 139, FINANCIERE DU MARCHE ST HONORE 95, BNP PARIBAS CARDIF 68, BNP Paribas Fortis 33, BGL BNP Paribas 25</td></tr>
<tr><td>profondeur (relations depuis la racine)</td><td>1 : 139 ; 2 : 287 ; 3 : 66 ; 4 : 18 ; 5 : 7 ; 6 : 1</td></tr>
<tr><td>networkx</td><td>519 nœuds, 518 arêtes, acyclique, une seule composante : un arbre</td></tr>
<tr><td>pays distincts</td><td>56 ; FR 212, LU 26, GB 26, US 23, IT 23, BE 19</td></tr>
<tr><td>fille et mère dans le même pays</td><td>294 relations sur 518</td></tr>
<tr><td>enregistrement de la relation</td><td>PUBLISHED 438, LAPSED 80</td></tr>
<tr><td>corroboration</td><td>FULLY_CORROBORATED 290, ENTITY_SUPPLIED_ONLY 213, PARTIALLY_CORROBORATED 15</td></tr>
<tr><td>statut du LEI des entités</td><td>ISSUED 440, LAPSED 78, RETIRED 1</td></tr></table>
<p><b>Ce qui ne se raccorde pas.</b> 14 filles ultimes ne sont pas atteintes en suivant les relations directes. Pour 5 d’entre elles, la mère directe déclarée est hors du parcours (par exemple « Veterans Park Fund L.P. » et « LINC-PCH LP », rattachées à une même entité extérieure à l’arbre). Les 9 autres n’ont pas de mère directe déclarée, avec un motif d’exception : NON_PUBLIC 5, NO_LEI 3, NON_CONSOLIDATING 1. À l’inverse, 8 entités sont atteintes par les relations directes sans figurer parmi les filles ultimes, et leurs 8 LEI sont au statut LAPSED. La racine elle-même déclare l’exception NO_KNOWN_PERSON pour sa mère directe et pour sa mère ultime.</p>
${sol('Lecture des résultats', R`<ul>
<li><b>Le graphe est un arbre</b> : aucune entité n’a deux mères directes. Le GLEIF niveau 2 décrit la consolidation comptable (une mère qui consolide), pas tout l’actionnariat : une coentreprise détenue à 50/50 n’y apparaît pas comme un lien double. C’est une limite de la source pour le TFE, qui parle de groupe et d’exposition.</li>
<li><b>Les deux vues du groupe ne coïncident pas</b> : 524 filles ultimes déclarées, 518 rattachées par une chaîne directe. Les écarts ont des motifs déclarés (mère sans LEI, information non publique) ou des chaînes qui passent par une entité extérieure. Ce sont exactement les zones où un lien caché ou faux est le plus difficile à contrôler.</li>
<li><b>Les 8 entités atteintes mais absentes des filles ultimes ont toutes un LEI LAPSED</b> (non renouvelé). Observation, pas explication : il faudrait vérifier dans la documentation du GLEIF comment une entité au LEI expiré figure dans les listes de filles ultimes.</li>
<li><b>Plus d’un tiers des relations reposent sur la seule déclaration de l’entité</b> (213 ENTITY_SUPPLIED_ONLY sur 518) : c’est une caractéristique candidate pour prioriser les vérifications.</li>
<li><b>Prévisible ?</b> La taille, oui (ordre de grandeur annoncé par <code>ultimate-children</code>) ; la forme en arbre et les 80 relations LAPSED, je ne l’avais pas anticipé.</li></ul>`)}
<h4 class="pj-formel">Pièges</h4>
<ul><li><b>Instantané mélangé.</b> Une première exécution a été interrompue par la mise en veille du PC : ses réponses mêlaient deux copies de référence (2026-10-21T16:00 et 2026-10-22T00:00). Le script compte désormais les réponses par copie et signale le mélange ; l’instantané retenu a été rappelé d’une traite avec <code>--rafraichir</code>. Pour le TFE, une date $t$ correspond à une seule copie (règle du look-ahead).</li>
<li>Le DNS a échoué au réveil de la machine : le script s’est arrêté en le disant, sans écrire de chiffres. Ne jamais compléter un résultat manquant à la main.</li>
<li>Trois LEI s’appellent « BNP PARIBAS » dans le GLEIF : la racine se vérifie par son LEI et son nombre de filles, pas par son nom.</li>
<li>Ne rien affirmer sur la situation du groupe à partir de ce graphe : il dit qui consolide qui, rien sur la détresse.</li></ul>
<h4 class="pj-tfe">Pour aller plus loin</h4>
<p>Lance le script sur KBC Groep (LEI <code>213800X3Q9LSAKRUWY91</code>, à changer dans <code>RACINE</code>) et compare la forme des deux arbres : nombre d’entités, profondeur, part des relations ENTITY_SUPPLIED_ONLY. Puis écris en trois lignes ce que la vue « niveau 2 » ne montre pas d’un groupe, en vue du chapitre données du TFE.</p>
<div class="def"><b>À retenir</b><ul><li>BNP Paribas au 22/10/2026 : 519 entités, 518 relations directes, un arbre de profondeur 6.</li><li>14 filles ultimes sans chaîne directe ; 9 exceptions déclarées (NON_PUBLIC 5, NO_LEI 3, NON_CONSOLIDATING 1).</li><li>Une date, une copie de référence : archiver chaque réponse avec son heure.</li></ul></div>`,
      },
      // ================================================================ ATELIER 6
      {
        id: 'pl-6', title: 'Atelier 6 · Retrouver des liens falsifiés sous budget (expérience jouet)', slides: 'Atelier', minutes: 35,
        summary: 'Sur l’arbre GLEIF réel, 10 liens sur 518 sont falsifiés par simulation. Contre une falsification naïve, l’incertitude et l’exploitation trouvent 72 % et 80 % des faux en 100 vérifications contre 21 % au hasard, mais le jeu est presque trivial (AUC 0,964). Contre une falsification qui imite la structure, l’avantage tombe à 31 % et 33 %.',
        fiche: R`
<h4 class="pj-idee">Objectif</h4>
<p>Faire un premier pas concret vers la proposition de TFE : chaque lien du graphe réel devient un exemple à vérifier, quelques liens sont falsifiés <b>par simulation</b>, et l’on compare le tirage aléatoire à un critère d’incertitude simple pour les retrouver sous un budget de vérifications. Cette proposition n’est pas encore validée par les professeurs ; l’atelier sert à la rendre discutable sur pièces.</p>
<p><b>Étapes de la feuille de route :</b> p9 (injection par construction, deux familles), p10 (caractéristiques d’un lien), p11 (courbes de rappel par famille), p12 (McNemar et lecture des cas). Il fournit la matière de p13.</p>
<h4>Théorie à relire</h4>
<p>${course('pt-u16', 'Vérifier des liens de propriété sous budget')}, ${course('pt-u18', 'Concevoir l’expérience')}, ${course('pa-u15', 'Les types de bruit')} (un adversaire n’est pas du bruit) et ${course('pb-1', 'Trouver ou apprendre')}.</p>
<h4 class="pj-methode">Le code</h4>
<p>Script : <code>${DOSSIER}\atelier6_liens_falsifies.py</code> (environ 3 min, après l’atelier 5).</p>
${code(R`
# Falsification : la fille garde sa place, sa mère est remplacée
interdits = descendants(enfants, f) | {f, vraie_mere}         # pas de cycle
candidats = [n for n in noeuds if n not in interdits]
if famille == "imitation":                                     # mères qui ont déjà >= 2 filles,
    candidats = meme_pays or candidats                         # dans le pays de la fille si possible
faux[i]["mere"] = candidats[rng.integers(len(candidats))]     # métadonnées recopiées

# Une vérification : modèle sur les liens déjà vérifiés, puis choix du suivant
if len(set(y[verifies])) < 2:          # aucun faux trouvé : démarrage à froid, au hasard
    choix = rng.choice(restants)
else:
    p = LogisticRegression(class_weight="balanced").fit(X[verifies], y[verifies]).predict_proba(X[restants])[:, 1]
    choix = restants[np.argmax(-np.abs(p - 0.5))]   # incertitude ; exploitation : np.argmax(p)
`)}
<p>Caractéristiques d’un lien (fille, mère), calculées sur le graphe falsifié : même pays, similarité des noms (indice de Jaccard sur les mots de plus de deux lettres), log(1 + nombre de filles de la mère), profondeur de la mère, mère = racine, et trois métadonnées recopiées par le faussaire (corroboration complète, enregistrement publié, ancienneté). 518 liens, 10 falsifiés par graine, 50 graines, budget jusqu’à 200. Deux familles, rapportées séparément : <b>naïve</b> (nouvelle mère tirée parmi toutes les entités) et <b>imitation</b> (parmi les entités qui ont déjà au moins deux filles, dans le pays de la fille quand c’est possible).</p>
<h4>Résultats obtenus</h4>
<p><b>Contrôle de trivialité</b> (régression logistique, toutes les étiquettes, validation croisée à 5 plis) : AUC 0,964 ± 0,036 en famille naïve, 0,732 ± 0,105 en imitation. Rappel de détection (part des 10 faux trouvés), moyenne ± écart type sur 50 graines :</p>
<table><tr><th>famille</th><th>stratégie</th><th>B = 20</th><th>B = 50</th><th>B = 100</th><th>B = 200</th></tr>
<tr><td>les deux</td><td>aléatoire</td><td>0,040 ± 0,067</td><td>0,110 ± 0,099</td><td>0,210 ± 0,130</td><td>0,410 ± 0,137</td></tr>
<tr><td>naïve</td><td>incertitude</td><td>0,072 ± 0,114</td><td>0,350 ± 0,336</td><td>0,718 ± 0,340</td><td>0,958 ± 0,139</td></tr>
<tr><td>naïve</td><td>exploitation</td><td>0,160 ± 0,278</td><td>0,490 ± 0,410</td><td>0,796 ± 0,349</td><td>0,968 ± 0,130</td></tr>
<tr><td>imitation</td><td>incertitude</td><td>0,046 ± 0,079</td><td>0,150 ± 0,159</td><td>0,312 ± 0,191</td><td>0,570 ± 0,234</td></tr>
<tr><td>imitation</td><td>exploitation</td><td>0,056 ± 0,095</td><td>0,164 ± 0,145</td><td>0,330 ± 0,207</td><td>0,578 ± 0,226</td></tr>
<tr><td>les deux</td><td>oracle (plafond)</td><td>1</td><td>1</td><td>1</td><td>1</td></tr></table>
<p>Valeur attendue de l’aléatoire, $B/|E|$ : 0,039 ; 0,097 ; 0,193 ; 0,386. McNemar exact par lien falsifié (500 = 50 graines × 10), à B = 100 : naïve, incertitude seule 264 contre aléatoire seul 10 ($p=3{,}8\times10^{-65}$) ; imitation, 85 contre 34 ($p=3{,}3\times10^{-6}$). À B = 20 en imitation : 7 contre 4, $p=0{,}55$. Médiane du nombre de vérifications avant le premier faux trouvé : 31,5 pour les trois stratégies. Figures : <code>sorties\atelier6_rappel_naive.png</code> et <code>atelier6_rappel_imitation.png</code>.</p>
${sol('Lecture des résultats', R`<ul>
<li><b>Contre la famille naïve, le jeu est presque trivial</b> (AUC 0,964). Le coefficient dominant est le nombre de filles de la mère (−3,88) : 465 entités sur 519 sont des feuilles, donc une mère tirée au hasard est presque toujours une entité qui ne consolide rien d’autre. Le score de 72 % à 80 % mesure surtout cet artefact de construction.</li>
<li><b>Contre l’imitation, l’avantage fond</b> : 31 % à 33 % en 100 vérifications contre 21 % au hasard. Il reste significatif à partir de B = 50, porté surtout par la similarité des noms (−1,74) : une filiale « BNP Paribas X » rattachée à « Cardif Y » détonne. Un faussaire qui choisit une mère au nom proche effacerait probablement ce signal ; c’est la famille adaptative à construire.</li>
<li><b>Incertitude et exploitation font jeu égal</b> dans les deux familles. Avec 10 faux sur 518, le modèle ne voit que quelques positifs et les deux critères choisissent souvent les mêmes liens.</li>
<li><b>Le démarrage à froid coûte cher et identique</b> : tant qu’aucun faux n’est trouvé, les trois stratégies tirent au hasard avec le même générateur, d’où la même médiane de 31,5. L’espérance théorique pour un tirage au hasard, $\frac{|E|+1}{k+1}=\frac{519}{11}\approx47{,}2$, est plus grande que la médiane parce que la loi du premier succès est asymétrique.</li>
<li><b>Les métadonnées recopiées ne devraient rien dire</b> ; leurs coefficients (« publié » +0,71 en naïve) viennent de 10 positifs par graine et ne s’interprètent pas.</li></ul>`)}
<h4 class="pj-formel">Ce que l’expérience mesure, et ce qu’elle ne mesure pas</h4>
<ul><li><b>Elle mesure</b> si des caractéristiques structurelles simples, apprises au fil des vérifications, retrouvent plus vite que le hasard des rattachements fabriqués par deux procédés précis, sur un arbre réel de 518 liens.</li>
<li><b>Elle ne mesure pas</b> : de vraies falsifications (aucune n’est connue ici) ; un faussaire adaptatif ; l’effet d’un lien faux sur un verdict de détresse (aucun verdict n’est calculé, le contrôle d’ancrage de p9 reste à faire) ; GraphRAG, le RAG vectoriel ou la GNMF (le comité du TFE n’existe pas encore) ; un oracle humain qui se trompe ou qui coûte plus cher pour certains liens.</li>
<li><b>Pièges</b> : rapporter un taux global des deux familles (il mélangerait 72 % et 31 %) ; lire 0,964 d’AUC comme une performance alors que c’est une alerte de jeu trivial ; injecter un lien qui crée un cycle (exclu par construction).</li></ul>
<h4 class="pj-tfe">Pour aller plus loin</h4>
<p>Construis une troisième famille, « adaptative » : le faussaire choisit, parmi les mères qui ont au moins deux filles, celle dont le nom est le plus proche de celui de la fille. Écris d’abord ta prédiction (l’avantage de l’incertitude sur le hasard disparaît-il ?), puis mesure. Ensuite, remplace le modèle unique par un comité de trois modèles simples (régression logistique, forêt aléatoire, règle sur le nombre de filles) et compare l’entropie de vote à l’incertitude : c’est la maquette du comité GraphRAG, RAG vectoriel, GNMF.</p>
<div class="def"><b>À retenir</b><ul><li>Falsifications simulées, rapportées par famille ; aucun lien réel n’est déclaré faux.</li><li>Naïve : 72 % (incertitude) contre 21 % (hasard) à B = 100, mais AUC 0,964 : jeu presque trivial.</li><li>Imitation : 31 % contre 21 %, significatif à partir de B = 50 ; le vrai test sera un faussaire adaptatif.</li></ul></div>`,
      },
    ],
    cards: [
      ['pl-1', 'plancher', R`Pourquoi brancher le tirage aléatoire en premier dans la boucle pool-based ?`, R`C’est le plancher que toute stratégie active doit battre ; s’il est faux, toutes les comparaisons suivantes le sont aussi.`],
      ['pl-1', 'alc', R`Qu’est-ce que l’aire sous la courbe d’apprentissage (ALC) et pourquoi l’utiliser ?`, R`La moyenne de l’exactitude de test sur toute la plage d’étiquettes (règle des trapèzes, divisée par la largeur de la plage). Elle résume une courbe sans choisir le budget qui arrange.`],
      ['pl-1', 'variabilite', R`Atelier 1 (TP2, 4 étiquettes au hasard) : que montrent les 20 graines ?`, R`Moyenne 0,815 mais écart type 0,129, de 0,500 à 0,927 : une seule graine aurait pu montrer n’importe quoi entre les deux.`],
      ['pl-2', 'controle', R`Quel contrôle positif lancer avant de comparer LC, marge et entropie ?`, R`Vérifier qu’en binaire les trois critères choisissent le même point (20 cas sur 20 dans l’atelier 2).`],
      ['pl-2', 'mnist', R`Atelier 2 (MNIST, 10 graines) : quels critères battent l’aléatoire en ALC ?`, R`Seule la marge, sur les 10 graines (+0,028, Wilcoxon p = 0,002). L’entropie (−0,040) et la KL (−0,080) perdent sur toutes les graines ; l’entropie de vote ne se distingue pas (p = 0,275).`],
      ['pl-2', 'aligner', R`Pourquoi réaligner les colonnes de predict_proba dans un comité bootstrap ?`, R`Un membre peut ne pas avoir vu une classe : ses colonnes sont décalées et les probabilités attribuées au mauvais chiffre, sans message d’erreur.`],
      ['pl-3', 'densite', R`Atelier 3 : effet de la pondération entropie × densité^β sur MNIST ?`, R`Plus β grandit, plus l’ALC baisse (0,707 à β = 0, 0,627 à β = 4) : la densité ne corrige pas l’échec de l’entropie sur ce banc.`],
      ['pl-3', 'kmeans', R`Que gagne un lot initial choisi par k-means (atelier 3) ?`, R`Un meilleur départ (0,641 contre 0,459, presque tous les chiffres représentés) ; l’avantage disparaît vers 300 étiquettes.`],
      ['pl-3', 'bruit', R`Prédiction « le gain de la marge fond avec le bruit » : verdict de l’atelier 3 ?`, R`Démentie sur l’ALC à budget fixe : +0,028 (η = 0), +0,054 (η = 0,2), +0,039 (η = 0,4). La prédiction est à reformuler en étiquettes nécessaires pour une exactitude donnée.`],
      ['pl-4', 'thompson', R`Atelier 4 (simulation, 4 files, n = 2000) : regret de Thompson et d’UCB1 ?`, R`Thompson 24,1 ± 10,9 ; UCB1 85,4 ± 6,5. Le bonus d’UCB1 est grand devant des taux de 0,02 à 0,15, il explore longtemps.`],
      ['pl-4', 'metoile', R`Pourquoi ETC avec m* = 733 a-t-il le regret du hasard dans l’atelier 4 ?`, R`Avec 4 files, le pilote demande 4 × 733 = 2932 vérifications, plus que le budget de 2000 : ETC n’atteint jamais la phase d’engagement.`],
      ['pl-4', 'laibound', R`Thompson a un regret (24,1) sous le repère de Lai et Robbins (59,8). Contradiction ?`, R`Non : la borne porte sur la limite de R_n / ln n quand n tend vers l’infini, pas sur un n fini.`],
      ['pl-5', 'arbre', R`Graphe GLEIF niveau 2 de BNP Paribas (copie du 22/10/2026) : taille et forme ?`, R`519 entités, 518 relations directes, profondeur maximale 6, aucune entité à deux mères : un arbre (consolidation comptable, pas tout l’actionnariat).`],
      ['pl-5', 'exceptions', R`Que deviennent les 14 filles ultimes non atteintes par les relations directes ?`, R`5 ont une mère directe hors du parcours ; 9 n’en déclarent pas, avec un motif d’exception : NON_PUBLIC 5, NO_LEI 3, NON_CONSOLIDATING 1.`],
      ['pl-5', 'copie', R`Pourquoi compter les réponses GLEIF par copie de référence (goldenCopy) ?`, R`La copie change plusieurs fois par jour ; une collecte interrompue peut mêler deux dates, ce qui viole la règle « une date t, une copie » (look-ahead).`],
      ['pl-6', 'trivial', R`Atelier 6, famille naïve : pourquoi l’AUC de 0,964 est-elle une alerte ?`, R`465 entités sur 519 sont des feuilles : une mère tirée au hasard ne consolide presque jamais rien d’autre, et le nombre de filles de la mère trahit le faux lien.`],
      ['pl-6', 'imitation', R`Rappel à B = 100 contre une falsification qui imite la structure ?`, R`Incertitude 0,312, exploitation 0,330, hasard 0,210 (50 graines, 10 faux sur 518) : l’avantage fond mais reste significatif dès B = 50.`],
      ['pl-6', 'pasmesure', R`Trois choses que l’atelier 6 ne mesure pas ?`, R`De vraies falsifications, un faussaire adaptatif, l’effet d’un lien faux sur un verdict de détresse (et ni GraphRAG, ni le RAG vectoriel, ni la GNMF).`],
    ],
    quiz: [
      ['pl-1', R`À 4 étiquettes, une graine donne 0,500 d’exactitude sur un test équilibré. Explication la plus probable ?`, ['le modèle prédit la même classe partout', 'le test est mal chargé', 'la régression logistique n’a pas convergé', 'le pool est trop petit'], 0, R`0,500 est exactement le score d’un classifieur constant sur un test à 500 contre 500 ; avec 4 points, une frontière mal placée laisse tout le test du même côté.`],
      ['pl-1', R`Un sous-ensemble de 20 points donne 0,927, le pool entier 0,923. Que conclure ?`, ['le plafond est une référence sur données complètes, pas une borne stricte', 'le code a une fuite du test', 'il faut garder ce sous-ensemble', 'l’apprentissage actif est inutile'], 0, R`Un petit ensemble peut, par chance, placer la frontière un peu mieux pour ce test ; l’écart (0,004) est d’ailleurs sous la variabilité entre graines.`],
      ['pl-2', R`À 300 étiquettes, le moins confiant devance l’aléatoire (0,829 contre 0,820) mais son ALC est plus basse (0,733 contre 0,747). Que rapporter ?`, ['l’ALC et la courbe : il est en retard sur presque toute la plage', 'seulement le score à 300', 'que le moins confiant gagne', 'la moyenne des deux'], 0, R`Choisir le budget où une méthode passe devant revient à calibrer la conclusion sur la mesure ; l’ALC résume toute la courbe.`],
      ['pl-2', R`La KL du comité perd contre l’aléatoire. Le bootstrap stratifié donne −0,078 au lieu de −0,080. Que conclure ?`, ['l’hypothèse des classes manquantes est démentie, la cause reste à trouver', 'la stratification a corrigé le problème', 'la KL est fausse dans le cours', 'il faut plus de graines pour conclure quoi que ce soit'], 0, R`L’écart entre les deux variantes est minuscule devant l’écart type (0,02 à 0,03) : la correction supposée ne change rien, il faut chercher ailleurs.`],
      ['pl-3', R`Pourquoi la partie densité de l’atelier 3 n’utilise-t-elle pas la marge ?`, ['le score de marge est négatif : le multiplier par une densité inverse le classement', 'la marge est déjà pondérée par la densité', 'la marge ne s’applique pas à 10 classes', 'la densité n’existe qu’en binaire'], 0, R`On maximise −(P₁ − P₂) ≤ 0 ; multiplier par une densité plus grande rend le score plus négatif, donc moins choisi : l’effet est inversé.`],
      ['pl-3', R`Avec η = 0,4 d’erreurs de l’oracle, l’ALC de l’aléatoire tombe de 0,747 à 0,435. Pourquoi le test reste-t-il propre ?`, ['pour mesurer la qualité du modèle, pas sa ressemblance avec un oracle bruité', 'pour gagner du temps', 'parce que MNIST n’a pas d’erreurs', 'pour avantager la marge'], 0, R`Le test représente la vérité ; un test bruité mesurerait l’accord avec les erreurs de l’oracle.`],
      ['pl-4', R`Exploitation pure : regret moyen 79,6 mais écart type 87,9 et 95e centile 259. Que retenir ?`, ['elle réussit souvent et échoue parfois très mal : la moyenne seule cache ce risque', 'elle vaut UCB1', 'l’écart type est une erreur de calcul', 'elle est la plus sûre'], 0, R`261 répétitions sur 500 ont passé moins de la moitié du budget sur la meilleure file : un mauvais début la bloque.`],
      ['pl-4', R`Dans le pool fini, UCB1 trouve 99,6 liens, l’exploitation pure 102,8, Thompson 115,3. Que montre ce changement de classement ?`, ['les garanties stationnaires ne se transposent pas telles quelles à un pool qui s’épuise', 'UCB1 est faux', 'le pool fini favorise toujours le hasard', 'Thompson connaît les comptes'], 0, R`Quand on trouve les faux liens d’une file, son taux baisse : l’hypothèse i.i.d. stationnaire du cours ne tient plus.`],
      ['pl-5', R`8 entités sont atteintes par les relations directes mais absentes des filles ultimes ; leurs LEI sont tous LAPSED. Que peut-on écrire ?`, ['l’observation, en signalant que le mécanisme est à vérifier dans la documentation du GLEIF', 'que ces entités ont quitté le groupe', 'qu’il s’agit de liens falsifiés', 'rien, ce sont des erreurs du script'], 0, R`Une coïncidence observée n’est pas une explication : on la rapporte et on dit ce qu’il faut vérifier.`],
      ['pl-5', R`Une collecte GLEIF interrompue mêle les copies du 21/10 16:00 et du 22/10 00:00. Que faire ?`, ['tout rappeler d’une traite pour obtenir une seule copie', 'garder la copie la plus récente pour les seules réponses manquantes', 'ignorer : l’écart est de 8 heures', 'moyenner les deux'], 0, R`Une analyse à la date t s’appuie sur une seule copie ; un mélange crée une incohérence silencieuse.`],
      ['pl-6', R`Naïve : 72 % des faux trouvés à B = 100 ; imitation : 31 %. Quel chiffre annoncer ?`, ['les deux, séparément, avec l’AUC de contrôle', 'leur moyenne, 51 %', 'le meilleur, 72 %', 'aucun, la simulation ne vaut rien'], 0, R`Un taux global mélangerait deux attaques de difficulté très différente ; le 72 % se lit avec l’alerte de trivialité.`],
      ['pl-6', R`Les trois stratégies ont la même médiane (31,5) de vérifications avant le premier faux trouvé. Pourquoi ?`, ['avant le premier faux, toutes tirent au hasard avec le même générateur', 'c’est un bug', 'l’incertitude vaut le hasard', 'le graphe est un arbre'], 0, R`Sans exemple positif, le modèle n’a qu’une classe : démarrage à froid, identique par construction (appariement).`],
    ],
    gens: {
      'pl-1': [
        () => {
          const s = [rnd(50, 70), rnd(71, 82), rnd(83, 88), rnd(88, 92)].map(x => x / 100);
          const a = (s[0] / 2 + s[1] + s[2] + s[3] / 2) / 3;
          return { q: R`Exactitudes de test à 10, 20, 30 et 40 étiquettes : $${s.map(x => f(x, 2)).join(' ; ')}$. ALC normalisée par la règle des trapèzes entre 10 et 40 ? (3 décimales)`, a, tol: 0.002,
            expl: R`Trapèzes de largeur 10 : $10\left(\frac{${f(s[0], 2)}}{2}+${f(s[1], 2)}+${f(s[2], 2)}+\frac{${f(s[3], 2)}}{2}\right)$, divisé par la largeur $40-10=30$ : $${f(a)}$.` };
        },
      ],
      'pl-2': [
        () => {
          const raw = [rnd(5, 60), rnd(5, 60), rnd(5, 60)], tot = raw.reduce((x, y) => x + y, 0);
          const p = raw.map(x => Math.round(x / tot * 100) / 100); p[2] = Math.round((1 - p[0] - p[1]) * 100) / 100;
          if (p.some(x => x <= 0)) return { q: R`Probabilités $(0{,}5 ; 0{,}3 ; 0{,}2)$. Marge $P_1-P_2$ ? (2 décimales)`, a: 0.2, tol: 0.005, expl: R`$0{,}5-0{,}3=0{,}2$.` };
          const s = [...p].sort((x, y) => y - x);
          const kind = pick(['marge', 'entropie']);
          if (kind === 'marge') return { q: R`Un modèle donne $P=(${p.map(x => f(x, 2)).join(' ; ')})$ pour une image. Marge $P(\hat y_1)-P(\hat y_2)$ ? (2 décimales)`, a: s[0] - s[1], tol: 0.005,
            expl: R`On trie : $${f(s[0], 2)}$ et $${f(s[1], 2)}$ sont les deux plus grandes, marge $=${f(s[0] - s[1], 2)}$. Plus elle est petite, plus l’image est demandée.` };
          const h = -p.reduce((acc, x) => acc + x * Math.log2(x), 0);
          return { q: R`Un modèle donne $P=(${p.map(x => f(x, 2)).join(' ; ')})$ pour une image. Entropie en bits ? (3 décimales)`, a: h, tol: 0.003,
            expl: R`$H=-\sum_i P_i\log_2 P_i=${f(h)}$ bit (maximum $\log_2 3=1{,}585$ pour trois classes).` };
        },
      ],
      'pl-3': [
        () => {
          const beta = pick([0.5, 1, 2]);
          const A = [rnd(120, 200) / 100, rnd(10, 40) / 100], B = [rnd(60, 110) / 100, rnd(60, 100) / 100];
          const sA = A[0] * A[1] ** beta, sB = B[0] * B[1] ** beta;
          return { q: R`Entropie et densité normalisée : image A $(${f(A[0], 2)} ; ${f(A[1], 2)})$, image B $(${f(B[0], 2)} ; ${f(B[1], 2)})$, $\beta=${f(beta, 1)}$. Laquelle est demandée ?`, opts: ['A', 'B'], a: sA > sB ? 0 : 1, keepOrder: true,
            expl: R`Scores $H\times d^\beta$ : A $${f(sA)}$, B $${f(sB)}$. Le plus grand est choisi : ${sA > sB ? 'A' : 'B'}. Avec $\beta=0$, l’entropie seule aurait choisi ${A[0] > B[0] ? 'A' : 'B'}.` };
        },
      ],
      'pl-4': [
        () => {
          const N = pick([[1200, 400, 250, 150], [1700, 150, 100, 50], [900, 500, 400, 200]]);
          const mu = [0.15, 0.10, 0.05, 0.02], r = N.reduce((s, n, i) => s + (0.15 - mu[i]) * n, 0);
          return { q: R`Simulation de l’atelier 4, $\mu=(0{,}15 ; 0{,}10 ; 0{,}05 ; 0{,}02)$. Une stratégie a vérifié $(${N.join(' ; ')})$ liens par file sur 2000. Regret $\sum_a\Delta_a N_a$ ? (1 décimale)`, a: r, tol: 0.05,
            expl: R`$\Delta=(0 ; 0{,}05 ; 0{,}10 ; 0{,}13)$ : $0{,}05\times${N[1]}+0{,}10\times${N[2]}+0{,}13\times${N[3]}=${f(r, 1)}$ liens falsifiés manqués en moyenne.` };
        },
        () => {
          const N = rnd(5, 60), S = rnd(0, Math.min(N, 10));
          return { q: R`Thompson, a priori $\text{Bêta}(1,1)$ : une file a été vérifiée ${N} fois, ${S} liens falsifiés trouvés. Moyenne a posteriori ? (3 décimales)`, a: (S + 1) / (N + 2), tol: 0.002,
            expl: R`$\text{Bêta}(${S + 1}, ${N - S + 1})$, moyenne $\frac{${S + 1}}{${N + 2}}=${f((S + 1) / (N + 2))}$. C’est ce que fait <code>rng.beta(S + 1, N - S + 1)</code> dans le script, en tirant une valeur au lieu de la moyenne.` };
        },
      ],
      'pl-5': [
        () => {
          const n = pick([300, 552, 800, 1200]), pause = pick([1.05, 1.5, 2]);
          const m = n * pause / 60;
          return { q: R`L’API GLEIF accepte 60 requêtes par minute. Avec une pause de ${f(pause, 2)} s entre deux appels, combien de minutes au moins pour ${n} appels ? (1 décimale)`, a: m, tol: 0.1,
            expl: R`$${n}\times${f(pause, 2)}/60=${f(m, 1)}$ min, sans compter le temps de réponse du serveur. L’exécution de l’atelier 5 (552 appels) a duré 587 s.` };
        },
      ],
      'pl-6': [
        () => {
          const E = pick([200, 518, 1000]), k = pick([5, 10, 20]);
          return { q: R`${E} liens dont ${k} falsifiés, vérifiés dans un ordre aléatoire. Espérance du rang du premier lien falsifié trouvé ? (1 décimale)`, a: (E + 1) / (k + 1), tol: 0.1,
            expl: R`Les $k$ faux découpent l’ordre en $k+1$ intervalles de même longueur moyenne : $\frac{|E|+1}{k+1}=\frac{${E + 1}}{${k + 1}}=${f((E + 1) / (k + 1), 1)}$. Tant qu’aucun faux n’est trouvé, une stratégie active ne fait pas mieux.` };
        },
        () => {
          const E = 518, B = pick([20, 50, 100, 200]);
          return { q: R`Atelier 6 : ${E} liens, 10 falsifiés. Rappel de détection attendu d’un tirage aléatoire à B = ${B} ? (3 décimales)`, a: B / E, tol: 0.001,
            expl: R`Chaque lien a la probabilité $B/|E|=${f(B / E)}$ d’être vérifié ; c’est le plancher (mesuré : 0,040 ; 0,110 ; 0,210 ; 0,410 pour B = 20, 50, 100, 200).` };
        },
      ],
    },
  });
})();
