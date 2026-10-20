// Espace TP : préparation des séances de travaux pratiques (énoncés Moodle du 21 octobre 2026).
// Les résultats chiffrés viennent de vraies exécutions des scripts proposés (Python 3.14, scikit-learn 1.7, numpy 2.5).
// Le TP4 est évalué (dépôt des fichiers et d'un rapport) : il est préparé par la théorie, le pseudo-code et les pièges,
// sans le code à rendre ni les réponses aux questions d'analyse.
(function () {
  const R = String.raw;
  const { pick, rnd, f } = COURSE.u;
  const escHtml = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const code = (src, lang = 'python') => `<pre class="code" data-lang="${lang}"><code>${escHtml(src.replace(/^\n/, ''))}</code></pre>`;
  const sol = (title, html) => `<details class="sol-box"><summary>${title}</summary>${html}</details>`;
  const course = (id, label) => `<a class="link" href="#course/${id}">${label}</a>`;

  // =====================================================================
  // TP0 : prérequis Python / scikit-learn
  // =====================================================================
  COURSE.add({
    id: 'tp0', space: 'tp',
    title: 'TP0 · Prérequis Python et scikit-learn',
    short: 'TP0 · Prérequis',
    source: 'labo_ADM1_python.pdf · 9 pages',
    pitch: 'Prendre en main Python, pandas, matplotlib et scikit-learn sur des problèmes résolus (ACP, régression, perceptron, kNN, SVM, arbre), puis trois exercices : courbes d’apprentissage, MNIST, restaurants parisiens.',
    lab: {
      folder: 'TP0 - Prérequis Prerequisites',
      files: ['labo_ADM1_python.pdf', 'mnist_train.csv.gz', 'mnist_test.csv', 'restaurant_paris.txt', 'BIS-RE_QBE221200.csv'],
      graded: false,
      before: 'Installe l’environnement et lance un premier script avant la séance : la moitié des problèmes du TP0 sont des incompatibilités de versions, autant les régler chez soi.',
      checklist: [
        { id: 'tp0-env', group: 'Avant la séance', title: 'Environnement installé et testé', hint: 'numpy, pandas, matplotlib, scikit-learn importés sans erreur.', sec: 'tp0-setup' },
        { id: 'tp0-r1', group: 'Problèmes résolus', title: 'ACP sur les chiffres manuscrits', hint: 'Que montre la courbe de variance expliquée ?', sec: 'tp0-resolus' },
        { id: 'tp0-r2', group: 'Problèmes résolus', title: 'Pandas (sans Yahoo Finance)', hint: 'Utiliser le CSV fourni BIS-RE_QBE221200.csv.', sec: 'tp0-resolus' },
        { id: 'tp0-r3', group: 'Problèmes résolus', title: 'Régression linéaire et perceptron', hint: 'Lire coef_ et intercept_, tracer la frontière.', sec: 'tp0-resolus' },
        { id: 'tp0-r4', group: 'Problèmes résolus', title: 'kNN et matrice de confusion', hint: 'train_test_split vient de sklearn.model_selection.', sec: 'tp0-resolus' },
        { id: 'tp0-r5', group: 'Problèmes résolus', title: 'SVM sur XOR : linéaire contre RBF', hint: 'Pourquoi le noyau linéaire échoue (lien avec la dimension VC).', sec: 'tp0-resolus' },
        { id: 'tp0-r6', group: 'Problèmes résolus', title: 'Arbre de décision sur les demi-lunes', hint: 'plot_tree remplace graphviz si besoin.', sec: 'tp0-resolus' },
        { id: 'tp0-e1', group: 'Exercices', title: 'Courbes d’apprentissage de 3 classifieurs', hint: 'Simple ou complexe ? Lire l’écart entre E_in et E_out.', sec: 'tp0-ex1' },
        { id: 'tp0-e2', group: 'Exercices', title: 'MNIST avec pandas : kNN, temps, confusion', hint: 'Attention : l’étiquette n’est pas dans la même colonne dans les deux fichiers.', sec: 'tp0-ex2' },
        { id: 'tp0-e3', group: 'Exercices', title: 'Densité des restaurants par arrondissement', hint: 'Barycentre, rayon jusqu’au premier restaurant extérieur, n / (π r²).', sec: 'tp0-ex3' },
      ],
    },
    sections: [
      {
        id: 'tp0-setup', title: 'Installer l’environnement et éviter les pièges de version', slides: 'énoncé p. 1-7',
        summary: 'L’énoncé date de 2023 : trois instructions ne marchent plus telles quelles (sklearn.cross_validation, pandas_datareader avec Yahoo, export_graphviz sans graphviz). Les corrections sont simples.',
        fiche: R`
<h4>Ce que demande la séance</h4>
<p>Se familiariser avec Python et <b>scikit-learn</b> : une partie de problèmes résolus (on exécute et on comprend), puis des exercices. Attention à l’indentation, qui fait partie de la syntaxe en Python.</p>
<h4>Installer</h4>
<p>Anaconda (avec l’éditeur Spyder) ou Python + pip. Vérifie ton installation avant la séance :</p>
${code(R`
import numpy, pandas, matplotlib, sklearn
print(numpy.__version__, pandas.__version__, matplotlib.__version__, sklearn.__version__)
`)}
<h4>Les trois pièges de version (vérifiés)</h4>
<table><tr><th>Dans l’énoncé</th><th>Aujourd’hui</th></tr>
<tr><td><code>from sklearn.cross_validation import train_test_split</code></td><td>Le module n’existe plus (<code>ModuleNotFoundError</code>). Utiliser <code>from sklearn.model_selection import train_test_split</code>.</td></tr>
<tr><td><code>web.DataReader("XOM", "yahoo", ...)</code> (pandas_datareader)</td><td>Yahoo a fermé cette interface et pandas_datareader n’est plus maintenu. Le CSV fourni <code>BIS-RE_QBE221200.csv</code> (colonnes Date, Value) sert à pratiquer les mêmes manipulations ; sinon le paquet <code>yfinance</code>.</td></tr>
<tr><td><code>export_graphviz</code> + <code>Source</code> (graphviz)</td><td>Demande le logiciel graphviz en plus du paquet. Plus simple : <code>from sklearn.tree import plot_tree</code> puis <code>plot_tree(clf, filled=True)</code>.</td></tr></table>
<p>Autre détail : dans l’ACP, <code>plt.scatter(..., label=target_name)</code> avec une liste ne crée pas de légende par classe ; la version qui boucle sur les 10 chiffres (point (g)) est la bonne.</p>
${code(R`
import pandas as pd
import matplotlib.pyplot as plt
df = pd.read_csv("BIS-RE_QBE221200.csv", parse_dates=["Date"]).sort_values("Date")
df = df.set_index("Date")
print(df.head())
df["Value"].plot(title="Série BIS (fichier fourni)")
plt.show()
`)}`,
      },
      {
        id: 'tp0-resolus', title: 'Les problèmes résolus : ce qu’il faut en retenir', slides: 'énoncé p. 1-8',
        summary: 'Sept mini-démonstrations. L’essentiel : la même interface fit / predict / score pour tous les modèles, et le SVM sur XOR, qui illustre en direct la dimension VC du cours.',
        fiche: R`
<p>Tous les modèles de scikit-learn partagent la même interface : <code>model.fit(X, y)</code> apprend, <code>model.predict(X)</code> prédit, <code>model.score(X, y)</code> donne l’exactitude (classification) ou le $R^2$ (régression), <code>predict_proba</code> donne les probabilités par classe. $X$ est un tableau (n exemples × d caractéristiques), $y$ le vecteur des étiquettes.</p>
<table><tr><th>Problème</th><th>À comprendre</th></tr>
<tr><td>1. ACP sur <code>load_digits</code> (images 8×8 = 64 pixels)</td><td><code>explained_variance_ratio_</code> : la part de variance de chaque composante. Les 2 premières composantes ne séparent qu’en partie les 10 chiffres.</td></tr>
<tr><td>2. Pandas</td><td>Un DataFrame est une table indexée ; <code>set_index</code>, <code>to_csv</code>, tracés directs avec <code>.plot()</code>.</td></tr>
<tr><td>3. Régression linéaire</td><td><code>intercept_</code> et <code>coef_</code> sont les paramètres $\theta_0,\theta_1$ de la droite des moindres carrés.</td></tr>
<tr><td>4. Perceptron</td><td>Un classifieur <b>linéaire</b> : frontière $\theta_0+\theta_1x_1+\theta_2x_2=0$.</td></tr>
<tr><td>5. kNN</td><td>Erreur de test = <code>1 - score</code> ; la matrice de confusion (<code>pd.crosstab</code>) montre quels chiffres sont confondus.</td></tr>
<tr><td>6. SVM sur XOR</td><td>Voir ci-dessous : le lien le plus direct avec la théorie.</td></tr>
<tr><td>7. Arbre de décision</td><td>Frontière en escalier ; <code>max_depth</code> et <code>min_samples_leaf</code> contrôlent la complexité (donc le sur-apprentissage).</td></tr></table>
<div class="thm"><b>Le XOR et la dimension VC.</b> Les 4 points $(0,0),(1,1)$ (étiquette 1) et $(1,0),(0,1)$ (étiquette −1) forment justement l’étiquetage que les classifieurs linéaires du plan <b>ne peuvent pas</b> réaliser : c’est pourquoi $m_{\mathcal H}(4)=14<16$ et $d_{VC}=3$ (${course('slt-growth', 'fiche « Dichotomies »')}). Le SVM à noyau linéaire échoue donc forcément ; le noyau gaussien (RBF) travaille dans un espace de dimension bien plus grande et sépare le XOR.</div>`,
      },
      {
        id: 'tp0-ex1', title: 'Exercice 1 : courbes d’apprentissage', slides: 'énoncé p. 8',
        summary: 'Tracer l’erreur d’entraînement et l’erreur de test en fonction du nombre d’exemples : un modèle simple a deux courbes proches mais hautes, un modèle complexe un grand écart qui se resserre lentement.',
        fiche: R`
<p>Choisir un jeu d’au moins 1000 exemples, garder 1/3 pour le test, et pour 3 classifieurs tracer $E_{in}$ (erreur d’entraînement) et $E_{out}$ (erreur de test) en fonction du nombre $N$ d’exemples d’entraînement.</p>
<div class="def"><b>Lien avec le cours.</b> $E_{in}$ est le risque empirique $R_n$, $E_{out}$ approche le risque théorique $R$. L’écart $E_{out}-E_{in}$ est ce que bornent Hoeffding et la dimension VC : il se réduit quand $N$ grandit, d’autant plus lentement que la classe est complexe (${course('slt-summary', 'fiche « Synthèse »')}).
<ul><li><b>Modèle simple</b> (courbe de gauche de l’énoncé) : les deux courbes se rejoignent vite, mais à un niveau élevé (biais d’approximation).</li>
<li><b>Modèle complexe</b> (droite) : $E_{in}$ très bas (proche de 0), $E_{out}$ plus haut ; l’écart se referme lentement (variance d’estimation).</li></ul></div>
<p>Le jeu <code>load_digits</code> (1797 images) suffit. <code>learning_curve</code> de scikit-learn fait les découpages pour toi.</p>
${sol('Voir une solution (après avoir essayé)', code(R`
import numpy as np
import matplotlib.pyplot as plt
from sklearn.datasets import load_digits
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.neighbors import KNeighborsClassifier
from sklearn.tree import DecisionTreeClassifier

X, y = load_digits(return_X_y=True)
Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=1/3, random_state=0)
models = {"régression logistique": LogisticRegression(max_iter=2000),
          "kNN (k=1)": KNeighborsClassifier(n_neighbors=1),
          "arbre profond": DecisionTreeClassifier(random_state=0)}
Ns = np.linspace(50, len(Xtr), 12).astype(int)
fig, axes = plt.subplots(1, 3, figsize=(14, 4), sharey=True)
for ax, (name, m) in zip(axes, models.items()):
    Ein, Eout = [], []
    for N in Ns:
        m.fit(Xtr[:N], ytr[:N])
        Ein.append(1 - m.score(Xtr[:N], ytr[:N]))
        Eout.append(1 - m.score(Xte, yte))
    ax.plot(Ns, Ein, label="E_in (entraînement)")
    ax.plot(Ns, Eout, label="E_out (test)")
    ax.set_title(name); ax.set_xlabel("N")
axes[0].set_ylabel("erreur"); axes[0].legend(); plt.show()
`) + '<p class="small">Lecture attendue : kNN avec k=1 et l’arbre profond ont $E_{in}=0$ (ils mémorisent) et un écart important au début : modèles complexes. La régression logistique a un petit écart : plutôt simple.</p>')}`,
      },
      {
        id: 'tp0-ex2', title: 'Exercice 2 : MNIST avec pandas', slides: 'énoncé p. 9',
        summary: 'Piège vérifié : dans mnist_train.csv.gz l’étiquette est la première colonne, dans mnist_test.csv la dernière. Avec le bon découpage, kNN atteint environ 97 %.',
        fiche: R`
<p>Charger <code>mnist_train.csv.gz</code> (60 000 images) et <code>mnist_test.csv</code> (10 000 images) avec <code>pd.read_csv</code>, afficher un chiffre, classer avec kNN, lire la matrice de confusion, mesurer le temps, puis essayer un classifieur plus performant.</p>
<div class="thm"><b>Le piège (vérifié sur tes fichiers).</b> Les deux fichiers ont 785 colonnes mais pas dans le même ordre :
<ul><li><code>mnist_train.csv.gz</code> : étiquette en <b>première</b> colonne, puis 784 pixels ;</li>
<li><code>mnist_test.csv</code> : 784 pixels, puis l’étiquette en <b>dernière</b> colonne (la première colonne est un pixel de coin, toujours 0).</li></ul>
Si on prend la première colonne comme étiquette du test, le kNN obtient <b>10 %</b> : le hasard. C’est un bon réflexe à garder : un score au niveau du hasard signale presque toujours un problème de données, pas de modèle.</div>
${code(R`
import time
import pandas as pd
import matplotlib.pyplot as plt
tr = pd.read_csv("mnist_train.csv.gz", header=None)
te = pd.read_csv("mnist_test.csv", header=None)
Xtr, ytr = tr.iloc[:, 1:].values, tr.iloc[:, 0].values     # train : étiquette en première colonne
Xte, yte = te.iloc[:, :-1].values, te.iloc[:, -1].values   # test : étiquette en dernière colonne

plt.imshow(Xtr[0].reshape(28, 28), cmap="gray_r"); plt.title(f"étiquette {ytr[0]}"); plt.show()
`)}
<p><b>Résultats obtenus</b> (sur ce PC) : kNN avec $k=3$, <b>97,2 %</b> sur 2000 images de test en 4 s (l’apprentissage est instantané, c’est la prédiction qui coûte : chaque image est comparée aux 60 000). Forêt aléatoire de 100 arbres : <b>97,1 %</b> sur les 10 000 images en 11 s. Les confusions typiques : 4 et 9, 3 et 5, 7 et 9.</p>
${sol('Voir la suite de la solution', code(R`
from sklearn.neighbors import KNeighborsClassifier
from sklearn.ensemble import RandomForestClassifier
t = time.time()
knn = KNeighborsClassifier(n_neighbors=3).fit(Xtr, ytr)
pred = knn.predict(Xte[:2000])
print("kNN :", (pred == yte[:2000]).mean(), round(time.time() - t, 1), "s")
print(pd.crosstab(yte[:2000], pred, rownames=["vrai"], colnames=["prédit"]))

t = time.time()
rf = RandomForestClassifier(n_estimators=100, n_jobs=-1, random_state=0).fit(Xtr, ytr)
print("forêt :", rf.score(Xte, yte), round(time.time() - t, 1), "s")
`))}`,
      },
      {
        id: 'tp0-ex3', title: 'Exercice 3 : densité des restaurants parisiens', slides: 'énoncé p. 9',
        summary: 'Pour chaque arrondissement : barycentre des restaurants, rayon = distance au premier restaurant d’un autre arrondissement, densité = nombre / (π r²). Les données ont des coordonnées décalées : discuter la fragilité de la méthode.',
        fiche: R`
<p>Le fichier <code>restaurant_paris.txt</code> a 3 colonnes séparées par des tabulations, sans en-tête : arrondissement (75001…), longitude, latitude ; 5753 restaurants sur 20 arrondissements. On traite longitude et latitude comme des coordonnées cartésiennes.</p>
<div class="def"><b>Méthode</b> (hypothèses de l’énoncé) : pour chaque arrondissement $a$,
<ol><li>barycentre $c_a$ = moyenne des coordonnées de ses restaurants ;</li>
<li>rayon $r_a$ = distance de $c_a$ au restaurant le plus proche qui n’est <b>pas</b> dans $a$ ;</li>
<li>densité $= n_a/(\pi r_a^2)$.</li></ol></div>
${sol('Voir une solution', code(R`
import numpy as np
import pandas as pd
r = pd.read_csv("restaurant_paris.txt", sep="\t", header=None, names=["arr", "lon", "lat"])
rows = []
for arr, g in r.groupby("arr"):
    c = g[["lon", "lat"]].mean().values
    autres = r.loc[r.arr != arr, ["lon", "lat"]].values
    rayon = np.min(np.linalg.norm(autres - c, axis=1))
    rows.append((arr, len(g), rayon, len(g) / (np.pi * rayon**2)))
dens = pd.DataFrame(rows, columns=["arrondissement", "n", "rayon", "densité"])
print(dens.sort_values("densité", ascending=False).to_string(index=False))
`))}
<p><b>À commenter</b> (constaté en exécutant) : les coordonnées du fichier ne correspondent pas aux vraies positions (latitudes autour de 48,9 au lieu de 48,86 pour le centre) et les nuages des arrondissements <b>se chevauchent</b>. Un restaurant « étranger » est donc souvent tout près du barycentre : rayons minuscules (0,001 à 0,011 degré), densités qui varient d’un facteur 100. C’est la méthode qui est fragile : le rayon dépend d’un <b>seul</b> point, le plus proche, donc d’une valeur extrême. Une alternative plus robuste : un quantile des distances, ou l’enveloppe convexe de l’arrondissement.</p>`,
      },
    ],
    cards: [
      ['tp0-setup', 'tts', R`Par quoi remplacer <code>sklearn.cross_validation</code> ?`, R`<code>sklearn.model_selection</code> (par ex. <code>from sklearn.model_selection import train_test_split</code>).`],
      ['tp0-resolus', 'api', R`Les quatre méthodes communes aux modèles scikit-learn ?`, R`<code>fit</code> (apprendre), <code>predict</code> (prédire), <code>score</code> (exactitude ou $R^2$), <code>predict_proba</code> (probabilités par classe).`],
      ['tp0-resolus', 'xor', R`Pourquoi un SVM linéaire ne peut-il pas résoudre XOR ?`, R`L’étiquetage XOR de 4 points n’est réalisable par aucun séparateur linéaire du plan ($m_{\mathcal H}(4)=14<16$, $d_{VC}=3$). Le noyau RBF le peut.`],
      ['tp0-ex1', 'lecture', R`Courbes d’apprentissage : signature d’un modèle simple, d’un modèle complexe ?`, R`Simple : $E_{in}$ et $E_{out}$ proches mais hauts. Complexe : $E_{in}$ très bas, grand écart avec $E_{out}$ qui se referme lentement quand $N$ grandit.`],
      ['tp0-ex2', 'piege', R`Le piège des fichiers MNIST du TP0 ?`, R`Étiquette en première colonne dans <code>mnist_train.csv.gz</code>, en dernière colonne dans <code>mnist_test.csv</code>. Un score de 10 % trahit l’erreur.`],
      ['tp0-ex2', 'knn-temps', R`Pourquoi le kNN est-il rapide à entraîner et lent à prédire ?`, R`L’« entraînement » ne fait que stocker les données ; chaque prédiction compare l’image aux 60 000 exemples stockés.`],
      ['tp0-ex3', 'methode', R`Méthode de densité des restaurants et sa faiblesse ?`, R`Barycentre, rayon jusqu’au restaurant étranger le plus proche, $n/(\pi r^2)$. Faiblesse : le rayon dépend d’un seul point extrême.`],
    ],
    quiz: [
      ['tp0-ex2', R`Ton kNN sur MNIST obtient exactement 10 % de réussite. Le plus probable ?`, ['un problème de données (mauvaise colonne d’étiquette)', 'k est trop petit', 'il faut plus de données', 'le kNN ne marche pas sur des images'], 0, R`10 % = le hasard sur 10 classes : le modèle n’apprend rien de lié aux vraies étiquettes.`],
      ['tp0-ex1', R`$E_{in}=0$ pour tout $N$, $E_{out}$ qui baisse lentement de 0,20 à 0,05. Le modèle est :`, ['complexe (il mémorise)', 'simple', 'sous-ajusté', 'le classifieur de Bayes'], 0, R`Erreur d’entraînement nulle et grand écart : forte capacité, comme kNN avec k=1.`],
      ['tp0-resolus', R`Que renvoie <code>model.score(X_test, y_test)</code> pour un classifieur ?`, ['l’exactitude (fraction de bonnes réponses)', 'l’erreur', 'le nombre d’erreurs', 'la probabilité moyenne'], 0, R`L’erreur de test vaut <code>1 - score</code>.`],
      ['tp0-resolus', R`Sur XOR, le SVM à noyau linéaire :`, ['ne peut pas séparer les 4 points', 'sépare parfaitement', 'dépend de C', 'a besoin de plus de points'], 0, R`Aucun hyperplan du plan ne réalise cet étiquetage.`],
    ],
  });

  // =====================================================================
  // TP1 : Hoeffding par la simulation
  // =====================================================================
  COURSE.add({
    id: 'tp1', space: 'tp',
    title: 'TP1 · Théorie statistique de l’apprentissage : Hoeffding en simulation',
    short: 'TP1 · Hoeffding',
    source: 'labo_SLT.pdf · 9 pages (+ hoeffding.pdf, notes de J. Duchi)',
    pitch: 'Vérifier par la simulation ce que garantit l’inégalité de Hoeffding : d’abord pour des variables de Bernoulli, puis pour un ensemble fini de 50 classifieurs linéaires. Comparer la borne aux déviations observées, puis exercices.',
    lab: {
      folder: 'TP1 - Théorie de l’apprentissage statistique',
      files: ['labo_SLT.pdf', 'labo_SLT_en.pdf', 'hoeffding.pdf (dossier du cours)'],
      graded: false,
      before: 'Relis les fiches Hoeffding et « Ensemble fini d’hypothèses » du chapitre 1 : le TP les met en équations puis en code. Prépare la partie 1 chez toi, elle tient en 20 lignes.',
      checklist: [
        { id: 'tp1-a', group: 'Avant la séance', title: 'Revoir Hoeffding (3 versions) et l’union bound', hint: 'Fiches du chapitre 1 et fiche « Ce qu’il faut savoir ».', sec: 'tp1-avant' },
        { id: 'tp1-p11', group: 'Partie 1 : variables bornées', title: 'Générer des Bernoulli (p = 0,1 ; 0,5 ; 0,9), n de 1 à 1000', hint: 'np.random.binomial(1, p, n).', sec: 'tp1-p1' },
        { id: 'tp1-p12', group: 'Partie 1 : variables bornées', title: 'Probabilité d’erreur empirique (ε = 0,05 et 0,25)', hint: 'Fréquence de |μ̂n − p| ≥ ε sur de nombreuses répétitions.', sec: 'tp1-p1' },
        { id: 'tp1-p13', group: 'Partie 1 : variables bornées', title: 'Courbes théoriques 2 exp(−2nε²)', hint: 'Plafonner à 1 pour lire le graphique.', sec: 'tp1-p1' },
        { id: 'tp1-p14', group: 'Partie 1 : variables bornées', title: 'Commenter : quand la borne est précise, pourquoi elle surestime', hint: 'Rôle de la variance p(1 − p).', sec: 'tp1-p1' },
        { id: 'tp1-p21', group: 'Partie 2 : ensemble fini', title: 'Deux nuages gaussiens (n = 50) et 50 classifieurs linéaires choisis à la main', hint: 'Bons et mauvais : ne pas les entraîner.', sec: 'tp1-p2' },
        { id: 'tp1-p22', group: 'Partie 2 : ensemble fini', title: 'R_n(g) sur 50 jeux, pour n = 50, 500, 5000', hint: 'Les points se resserrent autour de R(g).', sec: 'tp1-p2' },
        { id: 'tp1-p23', group: 'Partie 2 : ensemble fini', title: 'R(g) approché sur 10⁶ points par nuage', hint: 'La « population ».', sec: 'tp1-p2' },
        { id: 'tp1-p24', group: 'Partie 2 : ensemble fini', title: 'Histogramme de max|R − R_n|, médiane contre borne (0,230)', hint: 'Puis déviation en fonction de δ.', sec: 'tp1-p2' },
        { id: 'tp1-e1', group: 'Exercices', title: 'n pour M = 1, 100, 10 000 (δ = 0,03, ε = 0,05)', hint: 'Réponses : 840, 1761, 2683.', sec: 'tp1-ex' },
        { id: 'tp1-e2', group: 'Exercices', title: 'Taille d’échantillon pour d_VC = 10', hint: 'Équation implicite en n : itérer.', sec: 'tp1-ex' },
        { id: 'tp1-e3', group: 'Exercices', title: 'Dimension VC des rectangles (4) et de sgn(ax² + bx + c) (3)', hint: 'Exhiber un ensemble pulvérisé, puis montrer qu’un de plus est impossible.', sec: 'tp1-ex' },
        { id: 'tp1-e4', group: 'Exercices', title: 'Pièce biaisée : borne sur la probabilité d’erreur', hint: 'Somme de 2n variables bornées, non identiquement distribuées.', sec: 'tp1-ex' },
      ],
    },
    sections: [
      {
        id: 'tp1-avant', title: 'Ce qu’il faut savoir avant la séance', slides: 'énoncé p. 1 et 3',
        summary: 'Le TP met en code deux résultats du chapitre 1 : Hoeffding pour une moyenne (partie 1) et pour un ensemble fini de classifieurs (partie 2). Simuler une probabilité, c’est compter une fréquence sur beaucoup de répétitions.',
        fiche: R`
<div class="thm"><b>Partie 1 : une moyenne.</b> $Z_1,\dots,Z_n$ i.i.d. dans $[0,1]$ :
$$\mathbb P\Big[\Big|\frac1n\sum_{i=1}^nZ_i-\mathbb E[Z]\Big|\ge\epsilon\Big]\le\delta=2e^{-2n\epsilon^2}.$$
(${course('slt-hoeffding', 'fiche Hoeffding')})</div>
<div class="thm"><b>Partie 2 : un ensemble fini</b> de $|\mathcal H|$ classifieurs. Avec probabilité au moins $1-\delta$, <b>simultanément</b> pour tous les $g\in\mathcal H$ :
$$|R_n(g)-R(g)|\le\sqrt{\frac1{2n}\ln\frac{2|\mathcal H|}\delta}.$$
Comme c’est vrai pour tous, c’est vrai pour le pire : on comparera la borne au <b>maximum</b> des déviations sur les 50 classifieurs. (${course('slt-finite', 'fiche union bound')})</div>
<h4>Simuler une probabilité</h4>
<p>On ne calcule pas $\mathbb P[A]$ : on répète l’expérience $R$ fois et on prend la <b>fréquence</b> de $A$ (c’est encore la loi des grands nombres, et l’erreur de cette estimation est elle-même de l’ordre de $1/\sqrt R$). Avec $R=2000$ répétitions, on distingue des probabilités jusqu’à environ 0,001.</p>
<h4>Le rappel de notations de l’énoncé</h4>
<p>$R_n(g)=\frac1n\sum_i\ell(h(x_i),g(x_i))$ : fraction d’erreurs de $g$ sur l’échantillon ; $R(g)$ : la même chose sur toute la population, qu’on approchera par $10^6$ points par nuage. L’énoncé appelle « inégalité de Vapnik-Chervonenkis pour un classifieur » ce que le cours appelle Hoeffding pour un classifieur fixé.</p>`,
      },
      {
        id: 'tp1-p1', title: 'Partie 1 : la borne de Hoeffding face à la simulation', slides: 'énoncé p. 1-2',
        summary: 'La borne est la plus proche de la réalité pour p = 0,5 (variance maximale) et très pessimiste pour p = 0,1 ou 0,9 : elle ignore la variance. Avec ε = 0,25, tout est presque nul dès n ≈ 50.',
        fiche: R`
<h4>Démarche</h4>
<ol><li>Pour chaque $p$ et chaque $n$, tirer $R$ échantillons de taille $n$, calculer $\hat\mu_n$ pour chacun, et compter la fraction des fois où $|\hat\mu_n-p|\ge\epsilon$.</li>
<li>Tracer cette fréquence et la borne $\min(1,\,2e^{-2n\epsilon^2})$ en fonction de $n$.</li></ol>
<p><b>Astuce de vectorisation</b> : au lieu de refaire un tirage pour chaque $n$, on tire une fois $R$ suites de 1000 valeurs ; la moyenne cumulée <code>np.cumsum(Z, axis=1) / n</code> donne $\hat\mu_n$ pour tous les $n$ d’un coup. Tout le TP tourne en 2 secondes.</p>
${sol('Voir une solution (après avoir essayé)', code(R`
import numpy as np
import matplotlib.pyplot as plt

rng = np.random.default_rng(0)
ns = np.arange(1, 1001)
R = 2000                                        # répétitions pour estimer chaque probabilité
fig, axes = plt.subplots(2, 3, figsize=(14, 7), sharey=True)
for row, eps in enumerate([0.05, 0.25]):
    for col, p in enumerate([0.1, 0.5, 0.9]):
        Z = rng.binomial(1, p, size=(R, ns[-1]))
        means = np.cumsum(Z, axis=1) / ns       # mu_hat_n pour tous les n
        p_emp = np.mean(np.abs(means - p) >= eps, axis=0)
        bound = np.minimum(1, 2 * np.exp(-2 * ns * eps**2))
        ax = axes[row, col]
        ax.plot(ns, bound, "b", label="borne de Hoeffding")
        ax.plot(ns, p_emp, "k", lw=.8, label="simulation")
        ax.set_title(f"p = {p}, eps = {eps}")
axes[0, 0].legend(); plt.tight_layout(); plt.show()
`))}
<h4>Résultats obtenus (ε = 0,05)</h4>
<table><tr><th></th><th>n = 100 : simulation</th><th>borne</th><th>n = 500 : simulation</th><th>borne</th></tr>
<tr><td>p = 0,1</td><td>0,092</td><td>1 (inutile)</td><td>0,0005</td><td>0,164</td></tr>
<tr><td>p = 0,5</td><td>0,319</td><td>1 (inutile)</td><td>0,025</td><td>0,164</td></tr>
<tr><td>p = 0,9</td><td>0,092</td><td>1 (inutile)</td><td>0,0000</td><td>0,164</td></tr></table>
<p>Avec ε = 0,25, la borne vaut $2e^{-12{,}5}\approx7\cdot10^{-6}$ dès $n=100$ et la simulation ne voit plus aucun écart.</p>
<h4>Les deux questions à commenter</h4>
${sol('Mes éléments de réponse', R`<ul><li><b>Quand la borne est-elle la plus précise ?</b> Pour $p=0{,}5$ : c’est la loi de Bernoulli de <b>variance maximale</b> ($p(1-p)=0{,}25$), le pire cas que Hoeffding doit couvrir. Et pour les grandes valeurs de $n\epsilon^2$, où les deux courbes deviennent toutes deux très petites.</li>
<li><b>Pourquoi surestime-t-elle ?</b> Elle ne dépend que de $n$ et $\epsilon$, jamais de la loi : elle doit être vraie pour <b>toutes</b> les variables dans $[0,1]$, y compris la pire. Pour $p=0{,}1$, la variance vaut $0{,}09$ (presque 3 fois moins), la moyenne se concentre bien plus vite que garanti. De plus, la preuve passe par des majorations successives (Markov, Chernoff, lemme de Hoeffding), chacune avec un peu de jeu. L’inégalité de Bernstein, qui tient compte de la variance, serait plus serrée.</li></ul>`)}`,
      },
      {
        id: 'tp1-p2', title: 'Partie 2 : 50 classifieurs, et la borne pour le pire d’entre eux', slides: 'énoncé p. 3-7',
        summary: 'On fixe 50 classifieurs linéaires à la main, on mesure R_n(g) sur beaucoup d’échantillons et R(g) sur 10⁶ points. La déviation maximale médiane observée (≈ 0,09 avec n = 50) est bien sous la borne théorique (0,230).',
        fiche: R`
<h4>Les données</h4>
<p>Deux nuages gaussiens de 25 points ($n=50$) : moyennes $\mu_1=(10,0)$ et $\mu_2=(0,10)$, covariance $\Sigma=3I$ (variance 3 sur chaque axe, pas de corrélation) : <code>np.random.multivariate_normal(mu, 3*np.eye(2), m)</code>.</p>
<h4>Les 50 classifieurs</h4>
<p>$g(x)=\mathbb 1[\langle w,x\rangle+b>0]$, avec $w\in\mathbb R^2$ (orientation de la frontière) et $b\in\mathbb R$ (décalage). L’énoncé insiste : <b>ne pas les entraîner</b>, sinon ils seraient tous bons. Une façon simple d’obtenir un mélange de bons et de mauvais : des droites passant près du point médian $(5,5)$ avec des orientations aléatoires.</p>
${code(R`
angles = rng.uniform(0, 2 * np.pi, 50)
W = np.c_[np.cos(angles), np.sin(angles)]            # 50 directions w
centres = np.array([5, 5]) + rng.normal(0, 3, (50, 2))
B = -np.sum(W * centres, axis=1)                     # chaque droite passe par son centre
def risques(X, y):                                   # R_n de chaque classifieur, d'un coup
    pred = (X @ W.T + B > 0).astype(float)           # (N points, 50 classifieurs)
    return np.mean(pred != y[:, None], axis=0)
`)}
<h4>Ce que le TP fait mesurer</h4>
<ol><li>$R_n(g)$ pour chaque classifieur, sur 50 jeux différents, avec $n=50$, $500$, $5000$ : les points se resserrent autour de $R(g)$ quand $n$ grandit.</li>
<li>$R(g)$ approché sur $2\times10^6$ points.</li>
<li>Pour chaque jeu de taille 50 : $\max_g|R(g)-R_n(g)|$. Histogramme, puis comparaison de la médiane (qui correspond à $\delta=0{,}5$) avec $\sqrt{\frac1{2n}\ln\frac{2|\mathcal H|}\delta}$.</li></ol>
<h4>Résultats obtenus (1000 répétitions)</h4>
<table><tr><th>n</th><th>médiane de max|R − R_n|</th><th>borne (δ = 0,5)</th><th>quantile 95 %</th><th>borne (δ = 0,05)</th></tr>
<tr><td>50</td><td>0,093</td><td>0,230</td><td>0,152</td><td>0,276</td></tr>
<tr><td>500</td><td>0,030</td><td>0,073</td><td>0,050</td><td>0,087</td></tr>
<tr><td>5000</td><td>0,009</td><td>0,023</td><td>0,016</td><td>0,028</td></tr></table>
<p>La borne théorique 0,230 est exactement celle de l’énoncé (qui trouve une médiane observée de 0,138 avec ses propres classifieurs : la valeur observée dépend des 50 droites choisies, la borne non). Chaque fois que $n$ est multiplié par 10, tout est divisé par $\sqrt{10}\approx3{,}2$ : la vitesse $1/\sqrt n$ du cours.</p>
${sol('Pourquoi la borne surestime ici (à mettre dans le compte rendu)', R`<ul><li>L’<b>union bound</b> additionne les 50 probabilités comme si les événements « $g$ dévie » étaient disjoints. Or beaucoup de nos droites se ressemblent : leurs déviations sont fortement corrélées, l’union réelle est bien plus petite.</li>
<li>Hoeffding pour chaque classifieur est déjà pessimiste (partie 1) : les classifieurs très bons ou très mauvais ont $R(g)$ proche de 0 ou 1, donc une variance $R(1-R)$ faible.</li>
<li>Comme le dit l’énoncé, la borne est relativement plus précise pour les petites valeurs de $\delta$ (comparer 0,152 à 0,276 contre 0,093 à 0,230) : c’est le régime utile en pratique.</li></ul>`)}`,
      },
      {
        id: 'tp1-ex', title: 'Exercices : complexité d’échantillon, dimension VC, pièce biaisée', slides: 'énoncé p. 8-9',
        summary: 'n = 840 / 1761 / 2683 pour M = 1 / 100 / 10 000. Pour d_VC = 10 : environ 17 700 exemples avec la borne du cours (452 957 avec celle du livre). Rectangles : d_VC = 4 ; sgn(ax² + bx + c) : d_VC = 3. Pièce : erreur ≤ exp(−nε²).',
        fiche: R`
<h4>1. Combien d’exemples ? ($\delta=0{,}03$, $\epsilon=0{,}05$)</h4>
<p>$n\ge\frac1{2\epsilon^2}\ln\frac{2M}\delta=200\,\ln\frac{2M}{0{,}03}$ :</p>
<table><tr><th>M</th><th>calcul</th><th>n</th></tr><tr><td>1</td><td>$200\ln66{,}7=839{,}9$</td><td>840</td></tr><tr><td>100</td><td>$200\ln6667=1760{,}9$</td><td>1761</td></tr><tr><td>10 000</td><td>$200\ln666\,667=2682{,}1$</td><td>2683</td></tr></table>
<p>Multiplier le nombre d’hypothèses par 10 000 ne multiplie même pas $n$ par 4 : la dépendance en $\ln M$.</p>
<h4>2. Dimension VC 10, confiance 95 %, erreur 0,05</h4>
<p>Avec la borne du cours, $n\ge\frac1{2\epsilon^2}\ln\frac{2(en/d)^d}{\delta}$ : $n$ apparaît des deux côtés, on <b>itère</b> ($n\leftarrow$ membre de droite, en partant de 1000) jusqu’à stabilité : <b>$n\approx17\,700$</b>. Le livre <i>Learning From Data</i> (problèmes 2.20 à 2.24) utilise la borne VC rigoureuse $n\ge\frac8{\epsilon^2}\ln\frac{4((2n)^{d}+1)}\delta$, qui donne <b>$n\approx452\,957$</b>. La différence de constantes est énorme ; en pratique on retient la règle « $n\approx10\,d_{VC}$ », bien plus optimiste que les deux bornes.</p>
${code(R`
import math
d, eps, delta, n = 10, 0.05, 0.05, 1000
for _ in range(100):
    n = math.log(2 * (math.e * n / d) ** d / delta) / (2 * eps**2)
print(math.ceil(n))     # 17695
`)}
<h4>3. Dimension VC</h4>
${sol('Rectangles parallèles aux axes : d_VC = 4', R`<p><b>≥ 4</b> : 4 points en losange (haut, bas, gauche, droite). Pour tout sous-ensemble à étiqueter 1, le plus petit rectangle qui le contient n’attrape aucun des autres points : les 16 étiquetages sont réalisables.<br><b>≤ 4</b> : parmi 5 points, prends le plus à gauche, le plus à droite, le plus haut, le plus bas (au plus 4 points). Le 5e est dans leur boîte englobante : l’étiquetage « ces 4 extrêmes à 1, le 5e à 0 » est impossible, puisque tout rectangle contenant les extrêmes contient la boîte entière.</p>`)}
${sol('sgn(ax² + bx + c) sur ℝ : d_VC = 3', R`<p>Le signe d’un polynôme de degré au plus 2 change au plus <b>2 fois</b> le long de l’axe.<br><b>≥ 3</b> : 3 points $x_1\lt x_2\lt x_3$. Tout étiquetage a au plus 2 changements de signe ; on place les racines entre les points concernés (par ex. $+,-,+$ : parabole tournée vers le haut, racines de part et d’autre de $x_2$ ; avec $a=0$ on obtient les cas à 0 ou 1 changement).<br><b>≤ 3</b> : sur 4 points, l’étiquetage $+,-,+,-$ demande 3 changements de signe : impossible.</p>`)}
<h4>4. La pièce biaisée</h4>
${sol('Voir le raisonnement', R`<p>Disons que A est la pièce biaisée : $p_A=\mathbb P(\text{face})=\frac12-\epsilon$, $p_B=\frac12$. On se trompe si $\hat p_A-\hat p_B\ge0$. Notons $A_i,B_i\in\{0,1\}$ les indicatrices de face. Alors
$$n(\hat p_A-\hat p_B)=\sum_{i=1}^n A_i+\sum_{i=1}^n(-B_i)=S,$$
une somme de $2n$ variables indépendantes, chacune dans un intervalle de longueur 1 ($[0,1]$ ou $[-1,0]$), d’espérance totale $\mathbb E[S]=n(p_A-p_B)=-n\epsilon$. La version générale de Hoeffding (notes de Duchi, théorème 4, pour des variables non identiquement distribuées) donne $\mathbb P(S-\mathbb E S\ge t)\le\exp\big(-2t^2/\sum_i(b_i-a_i)^2\big)$. Avec $t=n\epsilon$ et $\sum_i(b_i-a_i)^2=2n$ :
$$\mathbb P[\hat p_A-\hat p_B\ge0]\le\exp\Big(-\frac{2n^2\epsilon^2}{2n}\Big)=e^{-n\epsilon^2}.$$
Pour se tromper avec probabilité au plus $\delta$, il suffit de $n\ge\frac1{\epsilon^2}\ln\frac1\delta$ lancers de chaque pièce. C’est déjà l’idée de l’identification du meilleur bras (chapitre Bandits).</p>`)}`,
      },
      {
        id: 'tp1-preuve', title: 'Pour aller plus loin : d’où vient Hoeffding', slides: 'hoeffding.pdf (Duchi)',
        summary: 'Markov, puis Chebyshev, puis Chernoff (exponentielle + Markov, optimisée en λ), puis le lemme de Hoeffding qui borne la fonction génératrice d’une variable bornée : on obtient exp(−2nt²/(b−a)²).',
        fiche: R`
<p>Le fichier <code>hoeffding.pdf</code> (notes de John Duchi, Stanford CS229) démontre l’inégalité en quatre marches. Comprendre cette chaîne, c’est savoir d’où vient chaque constante.</p>
<div class="thm"><b>1. Markov.</b> $Z\ge0$ : $\mathbb P(Z\ge t)\le\frac{\mathbb E[Z]}t$. Preuve en une ligne : $\mathbb 1[Z\ge t]\le Z/t$, puis on prend l’espérance.</div>
<div class="thm"><b>2. Chebyshev.</b> Markov appliqué à $(Z-\mathbb E Z)^2$ : $\mathbb P(|Z-\mathbb E Z|\ge t)\le\frac{\mathrm{Var}(Z)}{t^2}$. Pour une moyenne de $n$ variables i.i.d., la variance est divisée par $n$ : on retrouve la loi des grands nombres, mais avec une décroissance seulement en $1/n$.</div>
<div class="thm"><b>3. Chernoff.</b> Markov appliqué à $e^{\lambda(Z-\mathbb E Z)}$ pour $\lambda\ge0$ : $\mathbb P(Z-\mathbb E Z\ge t)\le\mathbb E\big[e^{\lambda(Z-\mathbb E Z)}\big]e^{-\lambda t}$, puis on choisit le meilleur $\lambda$. La <b>fonction génératrice des moments</b> $M_Z(\lambda)=\mathbb E[e^{\lambda Z}]$ se factorise pour une somme de variables indépendantes : $M_{Z_1+\dots+Z_n}=\prod_iM_{Z_i}$. C’est là que l’indépendance sert.</div>
<div class="thm"><b>4. Lemme de Hoeffding.</b> Si $Z\in[a,b]$ : $\mathbb E\big[e^{\lambda(Z-\mathbb E Z)}\big]\le e^{\lambda^2(b-a)^2/8}$. Avec Chernoff : $\mathbb P\big(\frac1n\sum_i(Z_i-\mathbb E Z_i)\ge t\big)\le\min_\lambda e^{n\lambda^2(b-a)^2/8-\lambda nt}=e^{-2nt^2/(b-a)^2}$, le minimum étant atteint en $\lambda=4t/(b-a)^2$.</div>
<p>Pour $Z\in[0,1]$, $(b-a)^2=1$ : on retrouve $e^{-2nt^2}$, et le facteur 2 du cours vient de l’union des deux côtés ($\ge t$ et $\le-t$). Les notes prouvent une version affaiblie du lemme (facteur 2 au lieu de 8) par <b>symétrisation</b> : une copie indépendante $Z'$, l’inégalité de Jensen, et le fait que $Z-Z'$ a la même loi que $S(Z-Z')$ avec $S$ un signe aléatoire (variable de Rademacher, dont $\mathbb E[e^{\lambda S}]\le e^{\lambda^2/2}$).</p>`,
      },
    ],
    cards: [
      ['tp1-avant', 'simuler', R`Comment estime-t-on une probabilité par simulation ?`, R`On répète l’expérience $R$ fois et on prend la fréquence de l’événement ; l’erreur de cette estimation est de l’ordre de $1/\sqrt R$.`],
      ['tp1-avant', 'max', R`Pourquoi compare-t-on la borne de la partie 2 au <b>maximum</b> des déviations ?`, R`La borne vaut simultanément pour tous les $g\in\mathcal H$, donc en particulier pour le pire : $\max_g|R(g)-R_n(g)|\le\sqrt{\frac1{2n}\ln\frac{2|\mathcal H|}\delta}$.`],
      ['tp1-p1', 'precise', R`Pour quel $p$ la borne de Hoeffding est-elle la plus serrée sur des Bernoulli, et pourquoi ?`, R`$p=0{,}5$, variance maximale $p(1-p)=0{,}25$ : c’est le pire cas que la borne doit couvrir.`],
      ['tp1-p1', 'surestime', R`Deux raisons pour lesquelles Hoeffding surestime la probabilité d’erreur ?`, R`Elle ignore la variance (doit valoir pour toute loi dans $[0,1]$) ; la preuve enchaîne des majorations (Markov, Chernoff, lemme de Hoeffding).`],
      ['tp1-p1', 'vecto', R`Astuce pour obtenir $\hat\mu_n$ pour tous les $n$ d’un coup ?`, R`Tirer une matrice $R\times1000$ et diviser <code>np.cumsum(Z, axis=1)</code> par $n$.`],
      ['tp1-p2', 'pas-entrainer', R`Pourquoi l’énoncé interdit-il d’entraîner les 50 classifieurs ?`, R`Ils deviendraient tous bons ; on veut un ensemble varié (bons et mauvais) fixé avant de voir les données, comme dans l’hypothèse de Hoeffding.`],
      ['tp1-p2', 'resultat', R`Médiane observée de max|R − R_n| et borne théorique pour n = 50, |H| = 50 ?`, R`Environ 0,09 à 0,14 selon les classifieurs choisis ; borne $\sqrt{\frac1{100}\ln\frac{100}{0{,}5}}\approx0{,}230$.`],
      ['tp1-p2', 'union', R`Pourquoi l’union bound surestime-t-elle dans la partie 2 ?`, R`Les 50 droites se ressemblent : leurs déviations sont corrélées, alors que l’union bound les additionne comme si elles étaient disjointes.`],
      ['tp1-ex', 'nM', R`n nécessaire pour M = 1, 100, 10 000 avec δ = 0,03 et ε = 0,05 ?`, R`840, 1761 et 2683 ($n\ge200\ln\frac{2M}{0{,}03}$).`],
      ['tp1-ex', 'rect', R`Dimension VC des rectangles parallèles aux axes, et l’argument du « ≤ » ?`, R`4. Sur 5 points, les 4 extrêmes définissent une boîte qui contient le 5e : « extrêmes à 1, 5e à 0 » est impossible.`],
      ['tp1-ex', 'parab', R`Dimension VC de $\mathrm{sgn}(ax^2+bx+c)$ sur $\mathbb R$ ?`, R`3 : au plus 2 changements de signe ; $+,-,+,-$ sur 4 points est impossible.`],
      ['tp1-ex', 'piece', R`Borne sur l’erreur de la stratégie « la pièce avec le moins de faces est biaisée » ?`, R`$e^{-n\epsilon^2}$ : Hoeffding sur $2n$ variables bornées (non identiquement distribuées), avec $t=n\epsilon$.`],
      ['tp1-preuve', 'chaine', R`Les quatre étapes de la preuve de Hoeffding ?`, R`Markov → Chebyshev (variance) → Chernoff (exponentielle + Markov, optimiser $\lambda$) → lemme de Hoeffding ($\mathbb E e^{\lambda(Z-\mathbb EZ)}\le e^{\lambda^2(b-a)^2/8}$).`],
      ['tp1-preuve', 'indep', R`Où l’indépendance sert-elle dans la preuve ?`, R`Pour factoriser la fonction génératrice d’une somme : $\mathbb E[e^{\lambda\sum Z_i}]=\prod_i\mathbb E[e^{\lambda Z_i}]$.`],
    ],
    quiz: [
      ['tp1-p1', R`ε = 0,05, n = 100 : la borne de Hoeffding vaut :`, ['plus de 1 : elle n’apprend rien', 'environ 0,16', 'environ 0,6', 'environ 0,01'], 0, R`$2e^{-2\cdot100\cdot0{,}0025}=2e^{-0{,}5}\approx1{,}21$.`],
      ['tp1-p1', R`Pour p = 0,9 et n = 500, la simulation donne une probabilité d’écart quasi nulle alors que la borne vaut 0,16. C’est parce que :`, ['la variance 0,09 est bien plus faible que le pire cas 0,25', 'la simulation est fausse', 'n est trop petit', 'ε est trop grand'], 0, R`La borne doit couvrir la loi de variance maximale.`],
      ['tp1-p2', R`Quand n passe de 50 à 5000, la déviation maximale médiane est divisée par environ :`, ['10', '100', '3', '1000'], 0, R`$\sqrt{100}=10$ : vitesse $1/\sqrt n$ (0,093 → 0,009 dans notre exécution).`],
      ['tp1-ex', R`Pour la borne VC du cours, n apparaît des deux côtés de l’inégalité. On :`, ['itère jusqu’à stabilité', 'prend n = d_VC', 'utilise n = 1/ε', 'résout une équation du second degré'], 0, R`Point fixe : $n\leftarrow\frac1{2\epsilon^2}\ln\frac{2(en/d)^d}\delta$.`],
      ['tp1-preuve', R`L’inégalité de Chebyshev s’obtient en appliquant Markov à :`, [R`$(Z-\mathbb E Z)^2$`, R`$e^{\lambda Z}$`, R`$|Z|$`, R`$\mathbb 1[Z\ge t]$`], 0, R`Puis on divise par $t^2$.`],
    ],
    gens: { 'tp1-ex': [...(COURSE.gens['slt-finite'] || [])], 'tp1-p1': [...(COURSE.gens['slt-hoeffding'] || [])] },
  });

  // =====================================================================
  // TP2 : apprentissage actif
  // =====================================================================
  COURSE.add({
    id: 'tp2', space: 'tp',
    title: 'TP2 · Apprentissage actif contre passif',
    short: 'TP2 · Actif',
    source: 'AML-active_learning_TP.pdf · 5 pages, XYtrain.dat, XYtest.dat',
    pitch: 'Comparer l’apprentissage passif (ajout aléatoire) et actif (moins confiant, marge, entropie) en traçant des courbes d’exactitude en fonction de la taille de l’ensemble d’entraînement : binaire avec kNN, 3 classes avec SVC, MNIST avec forêts aléatoires.',
    lab: {
      folder: 'TP2 - Apprentissage actif',
      files: ['AML-active_learning_TP.pdf', 'XYtrain.dat (100 points)', 'XYtest.dat (1000 points)'],
      graded: false,
      before: 'Le cœur du TP est une seule boucle (entraîner, mesurer, choisir le point suivant) qu’on réutilise partout. Écris-la proprement une fois, avec la stratégie de sélection en paramètre.',
      checklist: [
        { id: 'tp2-a', group: 'Avant la séance', title: 'Revoir les trois critères d’incertitude', hint: 'Moins confiant, marge, entropie ; identiques en binaire.', sec: 'tp2-avant' },
        { id: 'tp2-b1', group: '1. Binaire (kNN, k = 7)', title: 'Tracer les points et le score sur tout le train', hint: 'Obtenu : 0,917.', sec: 'tp2-binaire' },
        { id: 'tp2-b2', group: '1. Binaire (kNN, k = 7)', title: '10 points aléatoires, moyenne sur 50', hint: 'Obtenu : 0,76 ± 0,17.', sec: 'tp2-binaire' },
        { id: 'tp2-b3', group: '1. Binaire (kNN, k = 7)', title: 'Passif de 10 à 60 points, moyenne et écart type sur 50', hint: 'Ensemble initial identique d’une exécution à l’autre.', sec: 'tp2-binaire' },
        { id: 'tp2-b4', group: '1. Binaire (kNN, k = 7)', title: 'Actif de 10 à 60 points, comparaison', hint: 'L’actif est-il utile ici ?', sec: 'tp2-binaire' },
        { id: 'tp2-t1', group: '2. Trois classes (SVC)', title: 'Générer train (150) et test (900) gaussiens', hint: 'Centres (1,0), (0,1), (1,1), covariance 0,1·I.', sec: 'tp2-3classes' },
        { id: 'tp2-t2', group: '2. Trois classes (SVC)', title: 'Passif par pas de 5 jusqu’à 150, 50 répétitions', hint: 'SVC(probability=True) est aléatoire.', sec: 'tp2-3classes' },
        { id: 'tp2-t3', group: '2. Trois classes (SVC)', title: 'Les trois critères actifs, comparaison', hint: 'Qui découvre la classe 2 en premier ?', sec: 'tp2-3classes' },
        { id: 'tp2-t4', group: '2. Trois classes (SVC)', title: 'Covariances 0,2 ; 0,4 ; 0,6', hint: 'Le gain de l’actif diminue avec le chevauchement.', sec: 'tp2-3classes' },
        { id: 'tp2-m', group: '3. MNIST (forêt aléatoire)', title: '500 / 10 000 images, actif contre passif par pas de 10', hint: 'Les fichiers MNIST du TP0 évitent le téléchargement.', sec: 'tp2-mnist' },
        { id: 'tp2-c', group: '4. (*) Inconsistance', title: 'Données 1D, actif contre passif, comité de 5', hint: 'Reproduire la myopie du cours.', sec: 'tp2-mnist' },
      ],
    },
    sections: [
      {
        id: 'tp2-avant', title: 'Ce qu’il faut savoir avant la séance', slides: 'énoncé p. 1',
        summary: 'Une boucle : entraîner sur les points étiquetés, mesurer le score de test, choisir le point suivant (au hasard en passif, le plus incertain en actif), recommencer. Les critères se calculent depuis predict_proba.',
        fiche: R`
<h4>Les trois critères, en numpy</h4>
<p>Pour un classifieur qui fournit <code>P = clf.predict_proba(X_pool)</code> (une ligne par point candidat, une colonne par classe), on choisit le point qui maximise (${course('al-uncert', 'fiche du cours')}) :</p>
${code(R`
s = np.sort(P, axis=1)
moins_confiant = 1 - s[:, -1]                    # 1 - P(classe la plus probable)
marge = -(s[:, -1] - s[:, -2])                   # plus la marge est petite, plus c'est incertain
entropie = -np.sum(P * np.log(P + 1e-12), axis=1)
x_choisi = pool[np.argmax(critere)]
`)}
<p>En <b>binaire</b>, les trois sont équivalents : ils choisissent le point dont la probabilité est la plus proche de 1/2.</p>
<h4>La boucle commune à tout le TP</h4>
${code(R`
def courbe(strategie, X, y, Xte, yte, init, n_max, pas, make, rng):
    lab = list(init); scores = []
    while True:
        clf = make().fit(X[lab], y[lab])
        scores.append(clf.score(Xte, yte))
        if len(lab) >= n_max: return np.array(scores)
        pool = np.setdiff1d(np.arange(len(X)), lab)
        if strategie == "passif":
            new = rng.choice(pool, pas, replace=False)
        else:
            crit = critere(clf.predict_proba(X[pool]), strategie)
            new = pool[np.argsort(-crit)[:pas]]          # les « pas » plus incertains
        lab += list(new)
`)}
<h4>Le protocole</h4>
<ul><li>L’<b>ensemble initial</b> doit être le même d’une exécution à l’autre (l’énoncé y insiste) : sinon on compare des départs différents.</li>
<li>Répéter (50 fois) et tracer la <b>moyenne</b> et l’<b>écart type</b> : une seule courbe aléatoire ne prouve rien.</li>
<li>Démarrage à froid : au début, le classifieur est mauvais, donc son incertitude aussi.</li></ul>`,
      },
      {
        id: 'tp2-binaire', title: 'Partie 1 : binaire, kNN avec k = 7', slides: 'énoncé p. 2',
        summary: 'Score sur les 100 points : 0,917. Départ (8 points de classe 0, 2 de classe 1) : 0,50, car le kNN à 7 voisins prédit partout la classe 0. L’actif gagne un peu au début (0,896 contre 0,882 à n = 20), puis passif et actif se rejoignent.',
        fiche: R`
<p><code>XYtrain.dat</code> : 100 points (50 par classe) ; <code>XYtest.dat</code> : 1000 points ; colonnes x₁, x₂, classe. Chargement : <code>np.loadtxt("XYtrain.dat")</code>.</p>
<h4>Résultats obtenus</h4>
<table><tr><th></th><th>score de test</th></tr>
<tr><td>kNN sur les 100 points</td><td>0,917</td></tr>
<tr><td>10 points au hasard (moyenne de 50)</td><td>0,762 ± 0,165</td></tr></table>
<table><tr><th>n</th><th>passif (50 répétitions)</th><th>actif</th></tr>
<tr><td>10</td><td>0,500 ± 0</td><td>0,500</td></tr><tr><td>20</td><td>0,882 ± 0,034</td><td>0,896</td></tr><tr><td>30</td><td>0,914 ± 0,011</td><td>0,914</td></tr><tr><td>40</td><td>0,919 ± 0,007</td><td>0,910</td></tr><tr><td>60</td><td>0,917 ± 0,006</td><td>0,917</td></tr></table>
${sol('Ce qu’il faut comprendre de ces chiffres', R`<ul><li><b>0,50 au départ</b> : avec 8 points de classe 0 et 2 de classe 1, les 7 plus proches voisins de n’importe quel point contiennent au moins 5 points de classe 0. Le classifieur répond toujours 0. C’est le démarrage à froid du cours, en pire.</li>
<li><b>L’actif est déterministe</b> pour le kNN (écart type nul) : même départ, même critère, mêmes choix. Le passif varie d’un tirage à l’autre.</li>
<li><b>Gain modeste</b> : ce problème 2D est facile, les classes sont bien séparées ; quelques points au hasard suffisent déjà. L’actif aide surtout quand la frontière est délicate et le budget petit.</li>
<li><b>Piège</b> : avec $k=7$, <code>predict_proba</code> ne prend que les valeurs $0,\frac17,\dots,1$ : énormément d’ex aequo dans le critère, et <code>np.argmax</code> prend le premier. Mieux vaut départager au hasard parmi les ex aequo.</li>
<li><b>Le score de 0,917 n’est pas dépassé</b> : la limite vient du classifieur et du bruit des données, pas du nombre de points.</li></ul>`)}`,
      },
      {
        id: 'tp2-3classes', title: 'Partie 2 : trois classes gaussiennes, SVC', slides: 'énoncé p. 3',
        summary: 'L’ensemble initial ne contient aucun point de la classe 2 : l’actif la découvre plus vite (≈ 0,90 contre 0,88 à n = 30 pour une covariance 0,1). Quand les classes se chevauchent (0,4), le gain fond ; à 150 points, toutes les méthodes se rejoignent.',
        fiche: R`
<p>Classes 0, 1, 2 centrées en $(1,0)$, $(0,1)$, $(1,1)$, covariance $C_1=0{,}1\,I$ ; train 150 points (50 par classe), test 900. Ensemble initial : 10 premiers points de la classe 0 et 5 de la classe 1, puis ajout par pas de 5 jusqu’à 150.</p>
${code(R`
def gen(rng, per, var):
    centres = np.array([[1, 0], [0, 1], [1, 1]])
    X = np.vstack([rng.multivariate_normal(c, var * np.eye(2), per) for c in centres])
    return X, np.repeat([0, 1, 2], per)
`)}
<h4>Résultats obtenus (moyenne de 10 répétitions)</h4>
<table><tr><th>variance</th><th>n</th><th>passif</th><th>moins confiant</th><th>marge</th><th>entropie</th></tr>
<tr><td>0,1</td><td>15</td><td>0,654</td><td>0,654</td><td>0,654</td><td>0,654</td></tr>
<tr><td>0,1</td><td>30</td><td>0,878</td><td>0,904</td><td>0,893</td><td>0,902</td></tr>
<tr><td>0,1</td><td>50</td><td>0,905</td><td>0,915</td><td>0,913</td><td>0,913</td></tr>
<tr><td>0,1</td><td>150</td><td>0,917</td><td>0,917</td><td>0,917</td><td>0,917</td></tr>
<tr><td>0,4</td><td>30</td><td>0,597</td><td>0,597</td><td>0,610</td><td>0,586</td></tr>
<tr><td>0,4</td><td>50</td><td>0,644</td><td>0,656</td><td>0,661</td><td>0,671</td></tr>
<tr><td>0,4</td><td>150</td><td>0,681</td><td>0,681</td><td>0,681</td><td>0,681</td></tr></table>
${sol('Ce qu’il faut comprendre', R`<ul><li><b>Départ à 0,654</b> : l’ensemble initial n’a <b>aucun point de la classe 2</b> ; le SVC ne peut pas la prédire, il perd presque un tiers du test.</li>
<li>Les points de la classe 2, centrés en $(1,1)$, tombent entre les deux autres : ils sont incertains, donc l’actif les demande vite et « découvre » la classe 2 plus tôt.</li>
<li><b>Plus de chevauchement, moins de gain</b> : quand la variance augmente, l’incertitude est partout ; le critère ne sait plus quels points sont informatifs, et il choisit souvent des points bruités (le défaut « chercher le bruit » du cours).</li>
<li><b>À 150 points</b>, toutes les stratégies ont étiqueté le réservoir entier : mêmes données, même score. Le gain de l’actif se lit au milieu de la courbe, pas à la fin.</li>
<li><code>SVC(probability=True)</code> utilise une validation croisée interne aléatoire (calibration de Platt) : fixer <code>random_state</code> pour la reproductibilité, et répéter pour moyenner.</li></ul>`)}`,
      },
      {
        id: 'tp2-mnist', title: 'Parties 3 et 4 : MNIST avec forêts, et l’inconsistance', slides: 'énoncé p. 4-5',
        summary: 'Même boucle avec RandomForestClassifier, 500 images d’entraînement (50 par classe), départ à 10 images (une par chiffre), pas de 10. Astuce : réutiliser les fichiers MNIST du TP0 plutôt que fetch_openml. Partie 4 : reproduire la myopie de l’échantillonnage par incertitude.',
        fiche: R`
<h4>Partie 3 : MNIST</h4>
<p><code>fetch_openml('mnist_784')</code> télécharge 55 Mo et peut échouer sur un réseau lent. Tu as déjà les données dans le dossier du TP0 (attention au format, voir ${course('tp0-ex2', 'fiche MNIST du TP0')}) :</p>
${code(R`
tr = pd.read_csv("mnist_train.csv.gz", header=None)
te = pd.read_csv("mnist_test.csv", header=None)
X, y = tr.iloc[:, 1:].values, tr.iloc[:, 0].values
Xte_all, yte_all = te.iloc[:, :-1].values, te.iloc[:, -1].values
rng = np.random.default_rng(0)
idx_tr = np.concatenate([rng.choice(np.where(y == c)[0], 50, replace=False) for c in range(10)])
idx_te = np.concatenate([np.where(yte_all == c)[0][:1000] for c in range(10)])   # jusqu'à 1000 par classe
Xtr, ytr = X[idx_tr], y[idx_tr]
Xte, yte = Xte_all[idx_te], yte_all[idx_te]
init = [np.where(ytr == c)[0][0] for c in range(10)]      # une image par chiffre
`)}
<p>Puis la boucle de la fiche « Ce qu’il faut savoir » avec <code>make=lambda: RandomForestClassifier(n_estimators=100)</code>, <code>pas=10</code>, <code>n_max=500</code>, au moins 10 répétitions. Avec 10 classes, les trois critères ne sont plus équivalents : c’est la partie où marge et entropie peuvent se distinguer du simple moins confiant.</p>
<h4>Partie 4 (*) : inconsistance statistique</h4>
<p>L’énoncé renvoie à une figure (non lisible dans le texte) : c’est la situation 1D du cours (${course('al-incons', 'fiche « Myopie »')}). Une distribution où la classe change plusieurs fois le long de l’axe, avec une petite zone éloignée que le départ ne voit pas. Attendu : l’échantillonnage par incertitude reste collé à la première frontière et n’atteint pas le meilleur risque, le passif finit par y arriver ; un <b>comité de 5 classifieurs</b> (entraînés sur des sous-échantillons différents, on demande le point où ils sont le plus en désaccord) explore mieux.</p>`,
      },
    ],
    cards: [
      ['tp2-avant', 'boucle', R`Les trois étapes de la boucle d’apprentissage actif du TP ?`, R`Entraîner sur les points étiquetés, mesurer le score de test, ajouter le(s) point(s) le(s) plus incertain(s) (ou au hasard en passif).`],
      ['tp2-avant', 'numpy', R`Critère de marge en numpy à partir de <code>P = predict_proba(...)</code> ?`, R`<code>s = np.sort(P, axis=1); marge = s[:, -1] - s[:, -2]</code>, choisir le point de plus petite marge.`],
      ['tp2-avant', 'protocole', R`Deux règles de protocole pour comparer passif et actif ?`, R`Même ensemble initial à chaque exécution ; répéter (50 fois) et tracer moyenne et écart type.`],
      ['tp2-binaire', 'depart', R`Pourquoi le score de départ vaut-il 0,50 dans la partie binaire ?`, R`8 points de classe 0 et 2 de classe 1 : les 7 voisins sont majoritairement de classe 0, le kNN prédit toujours 0.`],
      ['tp2-binaire', 'exaequo', R`Piège du kNN (k = 7) dans le critère d’incertitude ?`, R`Les probabilités sont des multiples de 1/7 : beaucoup d’ex aequo, et <code>argmax</code> prend le premier. Départager au hasard.`],
      ['tp2-3classes', 'classe2', R`Pourquoi l’actif gagne-t-il au début de la partie 3 classes ?`, R`L’ensemble initial ne contient aucun point de la classe 2 ; ses points, entre les deux autres, sont incertains et vite demandés.`],
      ['tp2-3classes', 'variance', R`Effet d’une covariance plus grande sur l’intérêt de l’actif ?`, R`Les classes se chevauchent : l’incertitude est partout, le critère choisit du bruit, le gain disparaît.`],
      ['tp2-mnist', 'local', R`Comment éviter le téléchargement de MNIST dans le TP2 ?`, R`Réutiliser <code>mnist_train.csv.gz</code> et <code>mnist_test.csv</code> du TP0 (étiquette en première colonne pour le train, en dernière pour le test).`],
    ],
    quiz: [
      ['tp2-binaire', R`L’actif avec kNN a un écart type nul sur 50 répétitions. Pourquoi ?`, ['le départ et le critère sont déterministes', 'le kNN est mal entraîné', 'le passif a été utilisé par erreur', 'le test est trop petit'], 0, R`Rien d’aléatoire : mêmes choix à chaque exécution.`],
      ['tp2-3classes', R`À 150 points, passif et actif ont exactement le même score. C’est :`, ['normal : les deux ont étiqueté tout le réservoir', 'un bug', 'la preuve que l’actif est inutile', 'dû à SVC'], 0, R`Le gain de l’actif se lit au milieu de la courbe.`],
      ['tp2-avant', R`En classification binaire, moins confiant, marge et entropie :`, ['choisissent le même point', 'donnent des points différents', 'sont aléatoires', 'ne s’appliquent pas'], 0, R`Tous choisissent la probabilité la plus proche de 1/2.`],
      ['tp2-3classes', R`Pour rendre SVC(probability=True) reproductible, il faut :`, ['fixer random_state', 'augmenter C', 'désactiver probability', 'normaliser les données'], 0, R`La calibration des probabilités utilise une validation croisée interne aléatoire.`],
    ],
  });

  // =====================================================================
  // TP3 : bandits
  // =====================================================================
  COURSE.add({
    id: 'tp3', space: 'tp',
    title: 'TP3 · Bandits : borne de Lai-Robbins, ETC, ε-greedy, UCB, Thompson',
    short: 'TP3 · Bandits',
    source: 'labo_bandits.pdf · 7 pages, main.py, source.py',
    pitch: 'Compléter source.py (eGreedy, ETC, UCB, Thompson, computeLowerBound) et comparer les regrets sur 4 bras de Bernoulli (0,1 ; 0,05 ; 0,02 ; 0,01), horizon 2000.',
    lab: {
      folder: 'TP3 - Problèmes de bandits',
      files: ['labo_bandits.pdf', 'main.py', 'source.py'],
      graded: false,
      before: 'Lis main.py une fois en entier : il gère les tirages et le regret, tu n’écris que les fonctions de choix du bras dans source.py. Corrige d’abord le petit bug de départage des ex aequo.',
      checklist: [
        { id: 'tp3-a', group: 'Avant la séance', title: 'Comprendre main.py et source.py', hint: 'draws = N_a, rewards = S_a.', sec: 'tp3-avant' },
        { id: 'tp3-1', group: '1. Bornes', title: 'computeLowerBound avec kl', hint: 'Somme des Δa / kl(μa, μ*) : 5,82 · log n.', sec: 'tp3-bornes' },
        { id: 'tp3-2', group: '2. À l’aveugle', title: 'Regret de la stratégie uniforme, à la main et dans main.py', hint: 'coeff = 0,055 ; 110 à n = 2000.', sec: 'tp3-bornes' },
        { id: 'tp3-3', group: '3. ETC', title: 'Implémenter ETC, essayer m = 10, 100, 1000', hint: 'm trop petit : mauvais choix ; trop grand : exploration coûteuse.', sec: 'tp3-strategies' },
        { id: 'tp3-4', group: '4. ε-greedy', title: 'Implémenter, tester ε = 0,1 ; 0,5 ; 0,8 ; vérifier ε = 0,9999', hint: 'ε = 0,9999 ≈ uniforme.', sec: 'tp3-strategies' },
        { id: 'tp3-5', group: '5. UCB', title: 'Corriger UCB avec δ = 1/t^α', hint: 'Bonus √(α ln t / (2 N_a)).', sec: 'tp3-ucb-ts' },
        { id: 'tp3-6', group: '6. Thompson', title: 'Corriger Thompson (lois Beta)', hint: 'np.random.beta(S + 1, N − S + 1).', sec: 'tp3-ucb-ts' },
        { id: 'tp3-7', group: 'Comparaison', title: 'Comparer toutes les stratégies sur un même graphique', hint: 'Et expliquer pourquoi certaines passent sous la borne.', sec: 'tp3-ucb-ts' },
      ],
    },
    sections: [
      {
        id: 'tp3-avant', title: 'Lire le code fourni (et son petit bug)', slides: 'main.py, source.py',
        summary: 'main.py simule les tirages et cumule le regret ; source.py contient les fonctions de choix à compléter. draws[a] = N_a, rewards[a] = S_a. Le départage des ex aequo du code fourni ne garde que le premier gagnant.',
        fiche: R`
<h4>Ce que fait main.py</h4>
<p>4 bras de Bernoulli de moyennes $(0{,}1;\ 0{,}05;\ 0{,}02;\ 0{,}01)$, horizon 2000, <code>nMC</code> répétitions (20 dans le fichier, 100 dans l’énoncé). À chaque tour : appeler la stratégie, tirer le bras, mettre à jour</p>
<ul><li><code>draws[a]</code> : nombre de tirages du bras $a$, c’est $N_a(t)$ ;</li>
<li><code>rewards[a]</code> : somme des gains du bras $a$, c’est $S_a(t)$ ; donc <code>rewards / draws</code> $=\hat\mu_a(t)$ ;</li>
<li><code>regret[t] = max(true_means) - true_means[a]</code> : le regret <b>espéré</b> $\Delta_a$ (pas le gain observé), puis cumulé.</li></ul>
<h4>Le bug de départage</h4>
${code(R`
winners = np.argwhere(indices == np.max(indices))   # tableau de forme (k, 1)
c = np.random.choice(winners[0])                    # winners[0] = UN seul gagnant : pas de hasard
`)}
<p>Correction : <code>winners = np.flatnonzero(indices == np.max(indices))</code> puis <code>np.random.choice(winners)</code>. Ça compte au début, quand plusieurs bras ont la même moyenne empirique (souvent 0 ici, les gains étant rares).</p>
<p><b>Attention aussi</b> : <code>rewards / draws</code> divise par zéro tant qu’un bras n’a jamais été tiré. Toutes les stratégies commencent donc par tirer chaque bras au moins une fois (le code UCB fourni le fait déjà).</p>`,
      },
      {
        id: 'tp3-bornes', title: 'La borne de Lai-Robbins et la stratégie à l’aveugle', slides: 'énoncé p. 2-3',
        summary: 'Borne : R_n ≥ Σ_a Δ_a / kl(μ_a, μ*) · log n = 5,82 log n, soit 44 à n = 2000. À l’aveugle : regret moyen Δ̄ = 0,055 par tour, soit 110 à n = 2000 (vérifié : 109,8).',
        fiche: R`
<h4>1. computeLowerBound</h4>
<p>Lai et Robbins : $\mathbb E[N_a(n)]\gtrsim\frac{\log n}{d(\mu_a;\mu^*)}$ pour chaque bras sous-optimal, et $R_n=\sum_a\Delta_a\mathbb E[N_a(n)]$ (${course('bd-lower', 'fiche du cours')}). main.py multiplie lui-même par $\log n$ : la fonction renvoie le <b>coefficient</b> $\sum_{a:\mu_a<\mu^*}\frac{\Delta_a}{d(\mu_a;\mu^*)}$.</p>
${sol('Voir une solution', code(R`
def computeLowerBound(n_arms, true_means):
    best = np.max(true_means)
    return sum((best - m) / kl(m, best) for m in true_means if m < best)
`) + '<p>Valeur obtenue : <b>5,82</b>, soit une borne de $5{,}82\ln2000\approx44$ à la fin. Attention : ne pas inclure le meilleur bras ($\Delta=0$ et $kl=0$, division par zéro).</p>')}
<h4>2. À l’aveugle</h4>
<p>Chaque tour, chaque bras a probabilité 1/4 : le regret espéré par tour est la moyenne des écarts</p>
$$\bar\Delta=\frac14(0+0{,}05+0{,}08+0{,}09)=0{,}055,\qquad R_n=0{,}055\,n\ (=110\text{ à }n=2000).$$
<p>Donc <code>coeff = 0.055</code> dans main.py (ou <code>np.mean(np.max(true_means) - true_means)</code>). Vérifié par simulation avec ε-greedy à $\epsilon=0{,}9999$ : 109,8.</p>`,
      },
      {
        id: 'tp3-strategies', title: 'ETC et ε-greedy', slides: 'énoncé p. 3-5',
        summary: 'ETC : m = 10 donne 34 (souvent le mauvais bras), m = 100 donne 23, m = 400 donne 88 (trop d’exploration). ε-greedy : ε = 0,1 donne 26, ε = 0,5 donne 58 ; le regret reste linéaire à long terme.',
        fiche: R`
<h4>ETC</h4>
<p>Explorer : tirer chaque bras $m$ fois ; puis s’engager sur le meilleur empirique (${course('bd-etc', 'fiche du cours')}).</p>
${sol('Voir une solution', code(R`
def ETC(n_arms, m, rewards, draws):
    if np.any(draws < m):                        # phase d'exploration : chaque bras m fois
        return int(np.flatnonzero(draws < m)[0])
    return _argmax_random(rewards / draws)       # engagement sur le meilleur empirique

def _argmax_random(indices):                     # départage aléatoire des ex aequo
    winners = np.flatnonzero(indices == np.max(indices))
    return int(np.random.choice(winners))
`) + '<p class="small">main.py n’appelle pas ETC : ajoute une boucle sur le modèle de celle d’ε-greedy, avec <code>arm_chosen = ETC(n_arms, m, rewards, draws)</code>.</p>')}
<h4>ε-greedy</h4>
${sol('Voir une solution', code(R`
def eGreedy(n_arms, epsilon, rewards, draws):
    if np.any(draws == 0):
        return int(np.flatnonzero(draws == 0)[0])
    if random() < epsilon:                       # exploration : n'importe quel bras, y compris le meilleur
        return randint(0, n_arms - 1)
    return _argmax_random(rewards / draws)
`))}
<h4>Résultats obtenus (100 répétitions, n = 2000)</h4>
<table><tr><th>stratégie</th><th>regret moyen</th></tr>
<tr><td>uniforme (ε = 0,9999)</td><td>109,8</td></tr><tr><td>ETC m = 10</td><td>33,8</td></tr><tr><td>ETC m = 100</td><td>22,7</td></tr><tr><td>ETC m = 400</td><td>88,0</td></tr><tr><td>ε-greedy 0,1</td><td>25,5</td></tr><tr><td>ε-greedy 0,5</td><td>58,2</td></tr></table>
${sol('Discussion attendue', R`<ul><li><b>ETC, choix de m</b> : $m=10$ est trop court, avec des gains aussi rares (au plus 1 succès sur 10 attendu), on se trompe souvent de bras et on le paie jusqu’au bout. $m=400$ (et a fortiori 1000, qui dure $4\times1000\ge$ l’horizon) explore trop longtemps : déjà $400\times(0{,}05+0{,}08+0{,}09)=88$ de regret dans l’exploration seule. Le $m$ optimal du cours dépend de $\Delta$, inconnu.</li>
<li><b>ε et le compromis</b> : ε est la fraction de tours passés à explorer. Grand ε : on trouve vite le meilleur bras mais on continue à perdre $\epsilon\,\bar\Delta$ par tour, pour toujours. Petit ε : peu de perte d’exploration mais risque de rester bloqué sur un mauvais bras. Dans les deux cas le regret finit <b>linéaire</b>.</li></ul>`)}`,
      },
      {
        id: 'tp3-ucb-ts', title: 'UCB, Thompson sampling et comparaison', slides: 'énoncé p. 5-7',
        summary: 'UCB avec α = 1,5 : 59 (il sur-explore car les moyennes sont minuscules et Hoeffding ignore la variance). Thompson : 21, le meilleur. Plusieurs stratégies passent sous la « borne » de 44 : elle est asymptotique.',
        fiche: R`
<h4>UCB</h4>
<p>Avec $\delta=1/t^\alpha$ : $\ln(1/\delta)=\alpha\ln t$, d’où l’indice $\hat\mu_k(t)+\sqrt{\frac{\alpha\ln t}{2N_k(t)}}$ (${course('bd-ucb', 'fiche du cours')}).</p>
${sol('Voir une solution', code(R`
def UCB(t, alpha, rewards, draws):
    if np.any(draws == 0):
        return int(np.flatnonzero(draws == 0)[0])
    indices = rewards / draws + np.sqrt(alpha * np.log(t + 1) / (2 * draws))   # t commence à 0 dans main.py
    return _argmax_random(indices)
`))}
<h4>Thompson sampling</h4>
<p>A priori uniforme, donc a posteriori $\mathrm{Beta}(S_a+1,\ N_a-S_a+1)$ : on tire une valeur par bras et on joue le plus grand tirage (${course('bd-thompson', 'fiche du cours')}).</p>
${sol('Voir une solution', code(R`
def Thompson(n_arms, rewards, draws):
    samples = np.random.beta(rewards + 1, draws - rewards + 1)   # un tirage par bras, vectorisé
    return _argmax_random(samples)
`) + '<p class="small">Pas besoin de tirer chaque bras d’abord : avec 0 tirage, la loi Beta(1, 1) est uniforme.</p>')}
<h4>Comparaison (100 répétitions, n = 2000)</h4>
<table><tr><th>stratégie</th><th>regret</th></tr><tr><td>Thompson</td><td><b>21,1</b></td></tr><tr><td>ETC m = 100</td><td>22,7</td></tr><tr><td>ε-greedy 0,1</td><td>25,5</td></tr><tr><td>UCB α = 1,5</td><td>59,4</td></tr><tr><td>borne de Lai-Robbins</td><td>44,2</td></tr><tr><td>uniforme</td><td>109,8</td></tr></table>
${sol('Les deux points à expliquer dans le compte rendu', R`<ul><li><b>Passer sous la « borne inférieure » n’est pas une contradiction</b> : Lai-Robbins porte sur $\liminf_{n\to\infty}$, c’est un résultat <b>asymptotique</b>, pas une borne valable à $n=2000$. Et ETC avec $m$ bien choisi ou ε-greedy à ε fixe ont un regret qui finit linéaire : sur un horizon plus long, ils repasseraient au-dessus. Thompson, lui, est asymptotiquement optimal.</li>
<li><b>Pourquoi UCB est décevant ici</b> : le bonus vient de Hoeffding, qui raisonne comme si la variance était maximale (1/4). Or les gains ont une moyenne d’au plus 0,1, donc une variance d’au plus 0,09 : l’intervalle de confiance est bien trop large, UCB continue de tirer les mauvais bras. C’est la motivation de KL-UCB (borne de Chernoff) vue au cours. Réduire α (par ex. 0,5) l’améliore, au prix de la garantie théorique.</li></ul>`)}`,
      },
    ],
    cards: [
      ['tp3-avant', 'vars', R`Dans main.py, que représentent <code>draws</code>, <code>rewards</code> et <code>regret[t]</code> ?`, R`$N_a(t)$, $S_a(t)$ (somme des gains), et $\Delta_{a}$ du bras joué (regret espéré).`],
      ['tp3-avant', 'bug', R`Quel est le bug de départage dans le code fourni ?`, R`<code>np.random.choice(winners[0])</code> ne garde que le premier gagnant (argwhere renvoie un tableau (k, 1)). Utiliser <code>np.flatnonzero</code>.`],
      ['tp3-bornes', 'lb', R`Que renvoie <code>computeLowerBound</code> et combien vaut-il ici ?`, R`$\sum_{a:\mu_a<\mu^*}\Delta_a/kl(\mu_a,\mu^*)$ = 5,82 ; la borne vaut $5{,}82\log n$ (44 à n = 2000).`],
      ['tp3-bornes', 'aveugle', R`Regret de la stratégie uniforme sur les bras (0,1 ; 0,05 ; 0,02 ; 0,01) ?`, R`$0{,}055\,n$ (moyenne des écarts 0 ; 0,05 ; 0,08 ; 0,09), soit 110 à n = 2000.`],
      ['tp3-strategies', 'etc-m', R`Pourquoi ETC avec m = 10 puis m = 400 sont-ils tous deux mauvais ici ?`, R`m = 10 : trop peu de succès pour distinguer les bras, on s’engage souvent sur le mauvais. m = 400 : l’exploration seule coûte 88.`],
      ['tp3-strategies', 'eps', R`Effet de ε sur le compromis exploration / exploitation ?`, R`ε = fraction de tours d’exploration ; grand ε : perte $\epsilon\bar\Delta$ par tour pour toujours ; petit ε : risque de rester bloqué. Regret linéaire dans les deux cas.`],
      ['tp3-ucb-ts', 'ucb', R`Indice UCB du TP avec $\delta=1/t^\alpha$ ?`, R`$\hat\mu_k(t)+\sqrt{\alpha\ln t/(2N_k(t))}$.`],
      ['tp3-ucb-ts', 'ts', R`Une ligne numpy pour le tirage de Thompson ?`, R`<code>np.random.beta(rewards + 1, draws - rewards + 1)</code>, puis jouer l’argmax.`],
      ['tp3-ucb-ts', 'sous-borne', R`Pourquoi Thompson (21) peut-il être sous la borne de Lai-Robbins (44) à n = 2000 ?`, R`La borne est asymptotique ($\liminf$), elle ne contraint pas un horizon fini.`],
      ['tp3-ucb-ts', 'ucb-mauvais', R`Pourquoi UCB (α = 1,5) fait-il 59 ici ?`, R`Bonus de Hoeffding calculé pour la variance maximale alors que les moyennes sont ≤ 0,1 : intervalles trop larges, sur-exploration (d’où KL-UCB).`],
    ],
    quiz: [
      ['tp3-bornes', R`Pourquoi exclure le meilleur bras de la somme dans computeLowerBound ?`, ['Δ = 0 et kl(μ*, μ*) = 0 : division par zéro', 'il a le plus grand regret', 'il n’est jamais tiré', 'pour gagner du temps'], 0, R`Son terme vaut 0/0.`],
      ['tp3-strategies', R`ε-greedy avec ε = 0,9999 reproduit :`, ['la stratégie uniforme', 'Thompson', 'ETC avec m = 1', 'la stratégie gloutonne'], 0, R`On explore presque toujours, uniformément.`],
      ['tp3-ucb-ts', R`Thompson sans tirage préalable de chaque bras : est-ce un problème ?`, ['non, Beta(1, 1) est uniforme', 'oui, division par zéro', 'oui, il ne tirera jamais certains bras', 'oui, il faut m tirages'], 0, R`Pas de moyenne empirique à calculer.`],
      ['tp3-ucb-ts', R`Pour améliorer UCB sur ces bras de faible moyenne, le cours propose :`, ['KL-UCB (borne de Chernoff)', 'augmenter α', 'ETC', 'supprimer le bonus'], 0, R`Des intervalles adaptés aux Bernoulli.`],
    ],
    gens: { 'tp3-bornes': [...(COURSE.gens['bd-lower'] || []), ...(COURSE.gens['bd-regret'] || [])], 'tp3-ucb-ts': [...(COURSE.gens['bd-ucb'] || []), ...(COURSE.gens['bd-thompson'] || [])] },
  });

  // =====================================================================
  // TP4 : apprentissage par renforcement (évalué)
  // =====================================================================
  COURSE.add({
    id: 'tp4', space: 'tp',
    title: 'TP4 · Apprentissage par renforcement : GridWorld et PacMan',
    short: 'TP4 · RL',
    source: 'RL_defi_TP.pdf · 21 pages, reinforcement_Python3.zip',
    pitch: 'Projet Berkeley CS188 : value iteration et analyse de paramètres sur GridWorld, q-learning et ε-greedy, crawler, PacMan avec q-learning puis q-learning approché ; DQN en option. Évalué : fichiers et rapport à déposer.',
    lab: {
      folder: 'TP4 - Reinforcement learning',
      files: ['RL_defi_TP.pdf', 'reinforcement_Python3.zip', 'old/ (anciennes versions, à ignorer)'],
      graded: true,
      before: 'TP évalué (dépôt de valueIterationAgents.py, qlearningAgents.py et d’un rapport, groupes de deux au plus). Ici : la théorie, la carte du code, le pseudo-code et les pièges, pas le code à rendre. Décompresse le zip et lance la commande manuelle avant la séance.',
      checklist: [
        { id: 'tp4-0', group: 'Avant la séance', title: 'Décompresser reinforcement_Python3.zip et lancer gridworld.py -m', hint: 'Ignorer le dossier __MACOSX et le dossier old/.', sec: 'tp4-avant' },
        { id: 'tp4-1', group: 'RL1', title: '1.2 Value iteration (__init__, getValue, getPolicy, getQValue)', hint: 'Deux tableaux v_k et v_{k+1}.', sec: 'tp4-vi' },
        { id: 'tp4-2', group: 'RL1', title: '1.3 BridgeGrid : changer un seul paramètre', hint: 'Lequel rend la traversée sûre ?', sec: 'tp4-analyse' },
        { id: 'tp4-3', group: 'RL1', title: '1.4 DiscountGrid : rôle des paramètres, cas (a) à (d)', hint: 'Raisonner sur γ, bruit, living reward.', sec: 'tp4-analyse' },
        { id: 'tp4-4', group: 'RL1', title: '1.5 q-learning (update, getValue, getQValue, getPolicy)', hint: 'Toujours passer par getQValue.', sec: 'tp4-ql' },
        { id: 'tp4-5', group: 'RL1', title: '1.6 ε-greedy dans getAction ; BridgeGrid avec ε et α', hint: 'util.flipCoin(p).', sec: 'tp4-ql' },
        { id: 'tp4-6', group: 'RL1', title: '1.7 Crawler sans modifier le code', hint: 'Si ça casse : code trop spécifique à la grille.', sec: 'tp4-ql' },
        { id: 'tp4-7', group: 'RL2', title: '2.1 PacmanQAgent sur smallGrid (≥ 80 % de victoires)', hint: '-x 2000 -n 2010.', sec: 'tp4-pacman' },
        { id: 'tp4-8', group: 'RL2', title: '2.2 ApproximateQAgent (Identity puis SimpleExtractor)', hint: 'w ← w + α Δ f.', sec: 'tp4-pacman' },
        { id: 'tp4-9', group: 'RL2', title: '2.2.5 Ajouter une caractéristique (fantômes mangeables)', hint: 'featureExtractors.py.', sec: 'tp4-pacman' },
        { id: 'tp4-10', group: 'Rapport', title: 'Rapport : démarche, résultats, réponses aux questions d’analyse', hint: 'Voir la fiche « Rapport ».', sec: 'tp4-rapport' },
        { id: 'tp4-11', group: 'Option RL3', title: 'Deep q-learning (PacmanDQN ou keras-rl)', hint: 'Replay memory + réseau cible.', sec: 'tp4-rapport' },
      ],
    },
    sections: [
      {
        id: 'tp4-avant', title: 'Installer et lire la carte du code', slides: 'énoncé p. 1-4',
        summary: 'Seuls valueIterationAgents.py et qlearningAgents.py se modifient, aux endroits « *** YOUR CODE HERE *** ». Le MDP fournit états, actions, transitions et récompenses ; util.Counter est un dictionnaire qui vaut 0 par défaut.',
        fiche: R`
<h4>Démarrer</h4>
<p>Décompresse <code>reinforcement_Python3.zip</code> (le dossier <code>__MACOSX</code> est un résidu de Mac, à ignorer ; <code>old/</code> contient d’anciennes versions). Les interfaces utilisent Tkinter, inclus dans Python sous Windows.</p>
${code(R`
python gridworld.py -m -g BookGrid            # contrôle manuel au clavier
python gridworld.py -m -g BookGrid --noise=0.7  # le bruit rend l'agent stochastique
python gridworld.py -h                        # toutes les options
`, 'shell')}
<h4>La carte code ↔ théorie</h4>
<table><tr><th>Dans le code</th><th>Dans le cours</th></tr>
<tr><td><code>mdp.getStates()</code>, <code>mdp.getPossibleActions(s)</code></td><td>$S$, les actions disponibles en $s$ (aucune dans l’état terminal)</td></tr>
<tr><td><code>mdp.getTransitionStatesAndProbs(s, a)</code></td><td>la liste des couples $(s', T(s,a,s'))$</td></tr>
<tr><td><code>mdp.getReward(s, a, s')</code></td><td>$R(s,a,s')$</td></tr>
<tr><td><code>self.discount</code>, <code>self.alpha</code>, <code>self.epsilon</code></td><td>$\gamma$, $\alpha$, $\epsilon$</td></tr>
<tr><td><code>util.Counter()</code></td><td>un dictionnaire dont les clés absentes valent 0 : parfait pour $v_0=0$ et $q_0=0$</td></tr>
<tr><td><code>-i 100</code>, <code>-k 10</code></td><td>nombre d’itérations de value iteration, nombre d’épisodes</td></tr></table>
<p>Le bruit (<code>--noise 0.2</code>) signifie : l’action voulue réussit 80 % du temps, sinon l’agent part de côté. C’est la fonction $T(s,a,s')$ du cours (${course('rl-mdp', 'fiche MDP')}). Les cases +1 et −1 sont « pré-terminales » : leur seule action (exit) mène à l’état terminal invisible.</p>`,
      },
      {
        id: 'tp4-vi', title: 'RL1 · Value iteration : pseudo-code et pièges', slides: 'énoncé p. 4-6',
        summary: 'Itérer v_{k+1}(s) = max_a Σ T [R + γ v_k(s′)] avec deux tableaux (mise à jour « par lots »). getQValue calcule la somme pour une action, getValue lit v, getPolicy renvoie l’argmax des q-valeurs (None sans action).',
        fiche: R`
<div class="thm"><b>À implémenter</b> (${course('rl-vi', 'fiche value iteration')}) :
$$v_{k+1}(s)\leftarrow\max_a\sum_{s'}T(s,a,s')\big[R(s,a,s')+\gamma\,v_k(s')\big].$$</div>
<h4>Pseudo-code (à traduire toi-même dans le constructeur)</h4>
${code(R`
v ← compteur vide (toutes les valeurs à 0)
répéter « iterations » fois :
    v_nouveau ← compteur vide
    pour chaque état s :
        si s n'a aucune action : v_nouveau[s] reste 0 (état terminal)
        sinon : v_nouveau[s] ← max sur a de Q(s, a), calculé AVEC v (l'ancien)
    v ← v_nouveau
Q(s, a) = somme sur (s', p) des transitions de p × (R(s, a, s') + γ × v[s'])
politique(s) = l'action a qui maximise Q(s, a) ; None s'il n'y en a pas
`, 'texte')}
<h4>Les pièges classiques</h4>
<ul><li><b>Une mise à jour par lots</b> : chaque $v_{k+1}(s)$ doit utiliser les $v_k$ de l’itération précédente. Si tu écris directement dans le tableau que tu lis, tu fais une version « en place » (Gauss-Seidel) : elle converge aussi, mais ne donne pas les mêmes valeurs intermédiaires que l’énoncé.</li>
<li><b>États sans action</b> : <code>max</code> d’une liste vide plante ; leur valeur reste 0.</li>
<li><b>Un seul endroit pour la formule de Q</b> : écris la somme dans <code>getQValue</code> et réutilise-la dans la boucle et dans <code>getPolicy</code>. Une seule formule = une seule source d’erreur.</li>
<li><b>Toutes les itérations dans le constructeur</b>, avant que l’agent n’agisse : la value iteration <b>planifie</b> avec le modèle, elle n’apprend pas de l’expérience.</li></ul>
${code(R`
python gridworld.py -a value -i 100 -s 0.5     # valeurs (gauche) et q-valeurs (droite)
python gridworld.py -a value -i 100 -k 10      # 10 épisodes avec la politique calculée
`, 'shell')}
<p><b>Contrôle</b> : avec <code>-i 0</code> toutes les valeurs valent 0 ; avec <code>-i 1</code> seules les cases voisines des sorties deviennent non nulles ; les valeurs se « propagent » d’une case par itération depuis les sorties (la rétropropagation de Bellman).</p>`,
      },
      {
        id: 'tp4-analyse', title: 'RL1 · Questions d’analyse : BridgeGrid et DiscountGrid', slides: 'énoncé p. 6-9',
        summary: 'Trois leviers : γ (patience), bruit (risque de glisser), living reward (prix ou cadeau de chaque pas). Trouver les réglages, c’est raisonner sur ce qui rend un chemin court et risqué plus ou moins intéressant qu’un chemin long et sûr.',
        fiche: R`
<p>Ces questions font partie du <b>rapport évalué</b> : voici les outils pour raisonner, pas les réglages. Teste chaque hypothèse avec la commande de l’énoncé.</p>
<div class="def"><b>Les trois leviers</b>
<ul><li><b>γ (discount)</b> : une récompense obtenue dans $k$ pas vaut $\gamma^k$ fois sa valeur. $\gamma$ petit : on préfère une petite récompense proche à une grande lointaine. $\gamma$ proche de 1 : la distance compte peu.</li>
<li><b>Bruit (noise)</b> : probabilité que l’action dévie. C’est lui qui rend dangereux un chemin qui longe les cases −10 ou la rivière. Sans bruit, longer un précipice ne coûte rien.</li>
<li><b>Living reward</b> : récompense reçue à chaque pas. Négative : chaque pas coûte, on veut finir vite (quitte à prendre des risques). Positive : rester en vie rapporte, l’agent peut préférer ne jamais terminer.</li></ul></div>
<h4>Questions pour te guider</h4>
<ul><li><b>BridgeGrid</b> (γ = 0,9, bruit 0,2) : l’agent refuse de traverser. Qu’est-ce qui rend la traversée dangereuse ? Lequel des deux paramètres, modifié seul, supprime ce danger ou en change le prix ?</li>
<li><b>DiscountGrid (a)</b> sortie proche en risquant les −10 : il faut que le proche soit très préféré (quel levier ?) <b>et</b> que longer les −10 soit sans danger (quel levier ?).</li>
<li><b>(b)</b> sortie proche en évitant les −10 : préférence pour le proche, mais le chemin du bas doit rester risqué.</li>
<li><b>(c)</b> sortie lointaine en risquant : la distance doit peu compter et le chemin du bas être sûr.</li>
<li><b>(d)</b> éviter les deux sorties pour toujours : qu’est-ce qui rendrait « ne jamais finir » plus rentable que toute sortie ?</li></ul>
<p>Pour chaque cas, explique dans le rapport le <b>mécanisme</b> (comparaison de valeurs actualisées des deux chemins), pas seulement les nombres. Un calcul approché suffit : par exemple, la valeur d’atteindre +10 en $k$ pas est environ $\gamma^k\cdot10$ plus la somme des living rewards.</p>`,
      },
      {
        id: 'tp4-ql', title: 'RL1 · q-learning, ε-greedy et crawler', slides: 'énoncé p. 9-12',
        summary: 'update applique q(s,a) ← (1−α) q(s,a) + α [r + γ max q(s′,·)] ; getValue et getPolicy passent toujours par getQValue ; ex aequo départagés au hasard ; une action jamais vue vaut 0. getAction : avec probabilité ε une action légale au hasard.',
        fiche: R`
<div class="thm"><b>La mise à jour</b> (${course('rl-q', 'fiche q-learning')}) après une transition $(s,a,s',r)$ :
$$q(s,a)\leftarrow(1-\alpha)\,q(s,a)+\alpha\big[r+\gamma\max_{a'}q(s',a')\big],$$
avec $\max_{a'}q(s',a')=0$ si $s'$ est terminal (aucune action légale).</div>
<h4>Ce que fait chaque méthode (sans le code)</h4>
<table><tr><th>Méthode</th><th>Rôle</th></tr>
<tr><td><code>getQValue(s, a)</code></td><td>lire la table (0 si jamais vue : <code>util.Counter</code> le fait)</td></tr>
<tr><td><code>getValue(s)</code></td><td>$\max_aq(s,a)$ sur les actions <b>légales</b> ; 0 s’il n’y en a pas</td></tr>
<tr><td><code>getPolicy(s)</code></td><td>une action qui atteint ce max, au hasard parmi les ex aequo (<code>random.choice</code>) ; None sans action</td></tr>
<tr><td><code>update(s, a, s', r)</code></td><td>la formule ci-dessus</td></tr>
<tr><td><code>getAction(s)</code></td><td>ε-greedy : <code>util.flipCoin(self.epsilon)</code> → action légale au hasard (peut être la meilleure), sinon <code>getPolicy(s)</code></td></tr></table>
<h4>Les pièges</h4>
<ul><li><b>Toujours appeler getQValue</b> dans getValue et getPolicy, jamais la table directement : en RL2, l’agent approché redéfinit getQValue et tout le reste doit en profiter sans changement.</li>
<li><b>Une action non vue vaut 0</b> : si toutes les actions vues sont négatives, une action jamais essayée est la meilleure. Il faut donc prendre le max sur les actions <b>légales</b>, pas seulement sur celles présentes dans la table.</li>
<li><b>L’agent met à jour l’état qu’il quitte</b> ($s$), pas celui où il arrive : le contrôle manuel (<code>-a q -k 5 -m</code>, bruit 0) le montre.</li>
<li><b>Crawler</b> : si <code>python crawler.py</code> plante, ton code suppose une grille (coordonnées, noms d’actions) : il doit rester générique.</li></ul>
<p><b>BridgeGrid avec q-learning</b> (<code>-k 50 -n 0 -e …</code>) : demande-toi si 50 épisodes suffisent, avec une exploration au hasard, pour découvrir par chance la grande récompense au bout du pont. La réponse « ce n’est pas possible » est une réponse acceptable si tu la justifies.</p>`,
      },
      {
        id: 'tp4-pacman', title: 'RL2 · PacMan : q-learning puis q-learning approché', slides: 'énoncé p. 13-17',
        summary: 'Le q-learning tabulaire gagne sur smallGrid après ~1000-1400 parties mais échoue sur mediumGrid (trop d’états). L’approché apprend des poids w pour des caractéristiques f(s,a) : w_i ← w_i + α Δ f_i(s,a), et gagne mediumClassic en ~50 parties.',
        fiche: R`
<h4>2.1 Le tabulaire et sa limite</h4>
<p><code>PacmanQAgent</code> réutilise ton agent (ε = 0,05, α = 0,2, γ = 0,8). Récompenses : +10 par pastille, +500 victoire, −500 fantôme, +200 fantôme mangeable, −1 par pas.</p>
${code(R`
python pacman.py -p PacmanQAgent -x 2000 -n 2010 -l smallGrid      # ≥ 80 % de victoires attendues
python pacman.py -p PacmanQAgent -n 10 -l smallGrid -a numTraining=10
`, 'shell')}
<p>Sur <code>mediumGrid</code> ça échoue : chaque configuration (position de PacMan, des fantômes, pastilles restantes) est un état distinct, l’agent ne <b>généralise</b> pas ce qu’il apprend d’un fantôme à une situation voisine (${course('rl-approx', 'fiche q-learning approché')}).</p>
<h4>2.2 Le q-learning approché</h4>
<div class="thm">$q(s,a)=\sum_iw_if_i(s,a)$, et après chaque transition :
$$\Delta=\big[r+\gamma\max_{a'}q(s',a')\big]-q(s,a),\qquad w_i\leftarrow w_i+\alpha\,\Delta\,f_i(s,a).$$</div>
<ul><li>Les caractéristiques viennent de <code>self.featExtractor.getFeatures(state, action)</code>, un <code>util.Counter</code> {nom : valeur} ; les poids aussi sont un <code>util.Counter</code>.</li>
<li><code>getQValue</code> devient le produit scalaire poids · caractéristiques ; <code>update</code> applique la règle sur chaque caractéristique présente.</li>
<li><b>Test de non-régression</b> : avec <code>IdentityExtractor</code> (une seule caractéristique par paire état-action), l’agent approché doit se comporter exactement comme le tabulaire.</li></ul>
${code(R`
python pacman.py -p ApproximateQAgent -x 2000 -n 2010 -l smallGrid
python pacman.py -p ApproximateQAgent -a extractor=SimpleExtractor -x 50 -n 60 -l mediumGrid
python pacman.py -p ApproximateQAgent -a extractor=SimpleExtractor -x 50 -n 60 -l mediumClassic
`, 'shell')}
<p><b>2.2.5, améliorer les caractéristiques</b> : <code>SimpleExtractor</code> sait s’il y a un fantôme à un pas et la distance à la pastille la plus proche, mais ne distingue pas un fantôme effrayé (mangeable). Piste : une caractéristique « fantôme mangeable à proximité » (l’état du jeu donne le minuteur <code>scaredTimer</code> de chaque fantôme). Pense à <b>normaliser</b> les caractéristiques (diviser les distances par la taille de la grille), sinon les poids divergent.</p>`,
      },
      {
        id: 'tp4-rapport', title: 'Le rapport évalué et l’option deep q-learning', slides: 'énoncé p. 18-21',
        summary: 'Déposer valueIterationAgents.py, qlearningAgents.py et un rapport (groupes de deux au plus). Le rapport explique la démarche et répond aux questions d’analyse en justifiant. RL3 (option) : DQN avec replay memory et réseau cible.',
        fiche: R`
<h4>Ce qu’un bon rapport contient</h4>
<ol><li>Pour chaque méthode implémentée : l’équation du cours, comment elle se traduit dans le code (en mots), et un test qui montre que ça marche (capture des valeurs, taux de victoire).</li>
<li>Pour chaque question d’analyse (pont, DiscountGrid, BridgeGrid en q-learning) : les réglages trouvés <b>et</b> le raisonnement (valeurs actualisées comparées), y compris les cas jugés impossibles.</li>
<li>Les difficultés rencontrées et ce qu’elles t’ont appris (ex. pourquoi passer par getQValue a servi en RL2).</li>
<li>Si travail à deux : les noms clairement indiqués.</li></ol>
<h4>RL3 (optionnel) : deep q-learning</h4>
<p>Remplacer les caractéristiques faites main par un réseau convolutif qui prend l’image du jeu et sort une q-valeur par action (${course('rl-dqn', 'fiche DQN')}). Indispensables : une <b>mémoire de rejeu</b> de tuples $(s,a,r,s')$ échantillonnés par mini-lots, et un <b>réseau cible</b> figé périodiquement. Point de départ suggéré : le code PacmanDQN de T. van der Ouderaa, ou keras-rl. Le rapport de cette partie discute les hyperparamètres (architecture, α, γ, ε), le temps de calcul, et les situations rares où l’agent échoue (fins de partie).</p>
<h4>Pour aller plus loin</h4>
<p>Implémenter first-visit Monte-Carlo, SARSA et TD(0) (${course('rl-mc', 'fiches Monte-Carlo, TD, SARSA')}), ou d’autres environnements avec Gymnasium (CartPole). Attention : l’exemple de l’énoncé utilise l’ancienne API <code>gym</code> ; avec <code>gymnasium</code>, <code>reset()</code> renvoie <code>(observation, info)</code> et <code>step()</code> renvoie cinq valeurs (<code>terminated</code> et <code>truncated</code> au lieu de <code>done</code>).</p>`,
      },
    ],
    cards: [
      ['tp4-avant', 'fichiers', R`Quels fichiers modifier et déposer pour le TP4 ?`, R`<code>valueIterationAgents.py</code> et <code>qlearningAgents.py</code>, plus un rapport.`],
      ['tp4-avant', 'counter', R`Pourquoi <code>util.Counter</code> est-il pratique pour $v_0$ et $q_0$ ?`, R`Une clé absente vaut 0 : toutes les valeurs et q-valeurs initiales sont nulles sans initialisation explicite.`],
      ['tp4-avant', 'bruit', R`Que signifie <code>--noise 0.2</code> dans GridWorld ?`, R`L’action voulue réussit 80 % du temps, sinon l’agent dévie : la fonction de transition $T(s,a,s')$.`],
      ['tp4-vi', 'lots', R`Pourquoi deux tableaux en value iteration ?`, R`Chaque $v_{k+1}(s)$ doit utiliser les $v_k$ de l’itération précédente (mise à jour par lots) ; écrire en place change les valeurs intermédiaires.`],
      ['tp4-vi', 'terminal', R`Valeur d’un état sans action dans value iteration ?`, R`0 : le max sur une liste vide n’existe pas, il faut traiter ce cas.`],
      ['tp4-vi', 'planifie', R`Value iteration apprend-elle de l’expérience ?`, R`Non : elle planifie avec le modèle ($T$, $R$ connus) avant d’agir ; le q-learning, lui, apprend par essais et erreurs.`],
      ['tp4-analyse', 'leviers', R`Les trois leviers des questions d’analyse et leur effet ?`, R`γ : préférence pour le proche ; bruit : danger de longer les cases négatives ; living reward : prix (ou gain) de chaque pas.`],
      ['tp4-ql', 'getq', R`Pourquoi getValue et getPolicy doivent-elles appeler getQValue ?`, R`L’agent approché de RL2 redéfinit getQValue ; le reste du code en profite sans modification.`],
      ['tp4-ql', 'non-vue', R`Pourquoi prendre le max sur les actions légales et pas seulement sur les actions vues ?`, R`Une action jamais vue vaut 0 ; si toutes les actions vues sont négatives, elle est la meilleure.`],
      ['tp4-ql', 'qmaj', R`Mise à jour du q-learning à implémenter ?`, R`$q(s,a)\leftarrow(1-\alpha)q(s,a)+\alpha[r+\gamma\max_{a'}q(s',a')]$, le max valant 0 si $s'$ est terminal.`],
      ['tp4-pacman', 'approx', R`Mise à jour du q-learning approché ?`, R`$\Delta=[r+\gamma\max_{a'}q(s',a')]-q(s,a)$ ; $w_i\leftarrow w_i+\alpha\Delta f_i(s,a)$ pour chaque caractéristique.`],
      ['tp4-pacman', 'identity', R`À quoi sert IdentityExtractor ?`, R`Test de non-régression : une caractéristique par paire (état, action), l’agent approché doit se comporter comme le tabulaire.`],
      ['tp4-pacman', 'medium', R`Pourquoi le q-learning tabulaire échoue-t-il sur mediumGrid ?`, R`Trop d’états distincts : il ne généralise pas d’une configuration à une configuration voisine.`],
      ['tp4-rapport', 'gymnasium', R`Différence d’API entre l’exemple gym de l’énoncé et gymnasium ?`, R`<code>reset()</code> renvoie (observation, info) ; <code>step()</code> renvoie 5 valeurs (terminated, truncated au lieu de done).`],
    ],
    quiz: [
      ['tp4-vi', R`Après 1 itération de value iteration depuis v₀ = 0 sur BookGrid, quelles cases ont une valeur non nulle ?`, ['seulement les cases de sortie (+1 et −1), via l’action exit', 'toutes les cases', 'aucune', 'seulement la case de départ'], 0, R`Les valeurs se propagent d’un pas par itération depuis les récompenses.`],
      ['tp4-analyse', R`Un living reward très négatif pousse l’agent à :`, ['finir vite, quitte à prendre des risques', 'ne jamais finir', 'éviter toutes les sorties', 'ignorer le bruit'], 0, R`Chaque pas coûte : le chemin court devient préférable.`],
      ['tp4-analyse', R`Sans bruit (noise = 0), longer une rangée de cases −10 :`, ['ne présente aucun risque', 'est toujours fatal', 'dépend de γ uniquement', 'est interdit'], 0, R`L’action réussit toujours : on ne glisse jamais.`],
      ['tp4-ql', R`Dans getAction avec ε-greedy, l’action « aléatoire » doit être tirée parmi :`, ['toutes les actions légales, meilleure comprise', 'les actions sous-optimales uniquement', 'les actions déjà vues', 'les actions de valeur positive'], 0, R`C’est la définition d’ε-greedy du cours.`],
      ['tp4-pacman', R`Avec IdentityExtractor, l’agent approché doit :`, ['se comporter exactement comme PacmanQAgent', 'gagner plus souvent', 'apprendre plus vite', 'ne pas apprendre'], 0, R`Une caractéristique indicatrice par paire = une table.`],
    ],
    gens: { 'tp4-vi': [...(COURSE.gens['rl-vi'] || [])], 'tp4-ql': [...(COURSE.gens['rl-q'] || []), ...(COURSE.gens['rl-explore'] || [])], 'tp4-pacman': [...(COURSE.gens['rl-approx'] || [])] },
  });
})();
