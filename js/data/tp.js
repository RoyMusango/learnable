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
<tr><td><code>web.DataReader("XOM", "yahoo", ...)</code> (pandas_datareader)</td><td>La source Yahoo n’existe plus dans pandas_datareader : l’appel lève <code>NotImplementedError: data_source='yahoo' is not implemented</code> (constaté avec le paquet installé sur ce PC). Le CSV fourni <code>BIS-RE_QBE221200.csv</code> (colonnes Date, Value) sert à pratiquer les mêmes manipulations ; sinon le paquet <code>yfinance</code>.</td></tr>
<tr><td><code>export_graphviz</code> + <code>Source</code> (graphviz)</td><td>Demande le logiciel graphviz en plus du paquet. Plus simple : <code>from sklearn.tree import plot_tree</code> puis <code>plot_tree(clf, filled=True)</code>.</td></tr></table>
<p>Autre détail : dans l’ACP, <code>plt.scatter(..., label=target_name)</code> avec une liste ne crée pas de légende par classe ; la version qui boucle sur les 10 chiffres (point (g)) est la bonne.</p>
<h4>Le fichier BIS fourni</h4>
<p>168 valeurs trimestrielles, du 31/03/1973 au 31/12/2014, rangées <b>de la plus récente à la plus ancienne</b> (vérifié). Sans tri, <code>.plot()</code> trace la série à l’envers dans le temps et tout calcul de variation d’un trimestre au suivant change de signe : d’où le <code>sort_values("Date")</code> ci-dessous. Une série temporelle trimestrielle, le type de données du chapitre Séries temporelles ; le fichier ne dit pas ce que mesure la série (seul le code BIS figure dans son nom).</p>
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
<div class="thm"><b>Le XOR et la dimension VC.</b> Les 4 points $(0,0),(1,1)$ (étiquette 1) et $(1,0),(0,1)$ (étiquette −1) forment justement l’étiquetage que les classifieurs linéaires du plan <b>ne peuvent pas</b> réaliser : c’est pourquoi $m_{\mathcal H}(4)=14<16$ et $d_{VC}=3$ (${course('slt-growth', 'fiche « Dichotomies »')}). Le SVM à noyau linéaire échoue donc forcément ; le noyau gaussien (RBF) travaille dans un espace de dimension bien plus grande et sépare le XOR.</div>
<h4>Résultats obtenus en exécutant l’énoncé tel quel</h4>
<table><tr><th>Problème</th><th>Ce que tu dois retrouver</th></tr>
<tr><td>1. ACP</td><td>1797 images de 64 pixels. Les 2 premières composantes expliquent 14,9 % et 13,6 % de la variance, soit 28,5 % : le nuage 2D mélange plusieurs chiffres. Il faut 21 composantes pour 90 % et 29 pour 95 %.</td></tr>
<tr><td>3. Régression</td><td>Paramètres affichés : <code>4.98, 4.83</code> ($\theta_0$, $\theta_1$), $R^2=0{,}847$.</td></tr>
<tr><td>4. Perceptron</td><td>Exactitude d’entraînement 0,96. Attention : la fonction <code>heaviside</code> de l’énoncé renvoie $-\mathrm{sgn}(\theta_0+\theta_1x_1+\theta_2x_2)$, donc $+1$ là où le perceptron prédit la classe 0. La frontière est juste, seules les couleurs du fond sont inversées par rapport à <code>predict</code>.</td></tr>
<tr><td>5. kNN ($k=10$)</td><td>Erreur de test 0,0244 : 11 erreurs sur 450 images. La confusion la plus fréquente : un 8 lu comme un 3 (2 fois).</td></tr>
<tr><td>6. SVM sur XOR</td><td>Noyau linéaire : il prédit 1 pour les 4 points (exactitude 0,5) et <code>predict_proba</code> vaut 0,5 partout. Noyau RBF : 4 points sur 4. Les deux gardent les 4 points comme vecteurs de support. Sur les demi-lunes, le RBF fait 0,94 en entraînement avec 51 vecteurs de support.</td></tr>
<tr><td>7. Arbre</td><td>Profondeur réelle 7 (la limite de 10 n’est pas atteinte, c’est <code>min_samples_leaf=4</code> qui arrête), 13 feuilles, 0,98 en entraînement et 0,9555 sur 2000 nouveaux points tirés de la même loi.</td></tr></table>
<p class="small">Exécution : <code>verif_tp/tp0_prerequis.py</code> (scikit-learn 1.7.2). Les graines de l’énoncé (<code>random_state=2016</code>, <code>3216</code>, <code>11</code>, <code>np.random.seed(0)</code>) rendent ces chiffres reproductibles ; le SVM avec <code>probability=True</code> a aussi besoin de <code>random_state</code> pour que <code>predict_proba</code> le soit.</p>`,
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
<p><b>Choisir les classifieurs</b> : pour voir les deux allures de la figure, il faut au moins un modèle de faible capacité. Piège constaté : la régression logistique par défaut n’en est pas un ici. Avec 64 pixels et au plus 1198 images, les classes sont séparables et elle obtient $E_{in}=0$ pour tous les $N$, comme le kNN à 1 voisin et l’arbre profond. Un arbre limité à 3 niveaux (8 feuilles au plus pour 10 chiffres) donne la courbe « simple ».</p>
${sol('Voir une solution (après avoir essayé)', code(R`
import numpy as np
import matplotlib.pyplot as plt
from sklearn.datasets import load_digits
from sklearn.model_selection import train_test_split
from sklearn.neighbors import KNeighborsClassifier
from sklearn.tree import DecisionTreeClassifier

X, y = load_digits(return_X_y=True)
Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=1/3, random_state=0)
models = {"arbre de profondeur 3": DecisionTreeClassifier(max_depth=3, random_state=0),
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
`) + R`<p><b>Résultats obtenus</b> (<code>verif_tp/tp0_courbes.py</code>, même découpage, 1198 images d’entraînement au plus) :</p>
<table><tr><th>modèle</th><th>$N$</th><th>50</th><th>258</th><th>571</th><th>1198</th></tr>
<tr><td rowspan="2">arbre de profondeur 3</td><td>$E_{in}$</td><td>0,320</td><td>0,442</td><td>0,496</td><td>0,509</td></tr>
<tr><td>$E_{out}$</td><td>0,603</td><td>0,564</td><td>0,581</td><td>0,556</td></tr>
<tr><td rowspan="2">kNN ($k=1$)</td><td>$E_{in}$</td><td>0</td><td>0</td><td>0</td><td>0</td></tr>
<tr><td>$E_{out}$</td><td>0,139</td><td>0,040</td><td>0,023</td><td>0,015</td></tr>
<tr><td rowspan="2">arbre profond</td><td>$E_{in}$</td><td>0</td><td>0</td><td>0</td><td>0</td></tr>
<tr><td>$E_{out}$</td><td>0,496</td><td>0,254</td><td>0,205</td><td>0,144</td></tr></table>
<ul><li><b>Arbre de profondeur 3 : modèle simple.</b> $E_{in}$ monte avec $N$ (plus il y a d’images, moins 8 feuilles suffisent), $E_{out}$ descend un peu, et les deux se rejoignent vers 0,5 : le biais d’approximation domine, ajouter des données n’y change rien.</li>
<li><b>Arbre profond : modèle complexe.</b> $E_{in}=0$ partout, $E_{out}$ part de 0,50 et se referme lentement (0,14 à $N=1198$).</li>
<li><b>kNN à 1 voisin</b> : signature complexe ($E_{in}=0$), mais $E_{out}$ tombe vite à 0,015. Ce jeu est facile pour une distance entre images ; un modèle complexe n’est pas forcément mauvais, son écart dépend aussi des données.</li></ul>`)}`,
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
<p><b>Résultats obtenus</b> (<code>verif_tp/tp0_prerequis.py</code>, sur ce PC) : kNN avec $k=3$, <b>97,15 %</b> sur les 2000 premières images de test, en 6 s au total dont 0,2 s pour <code>fit</code> : l’apprentissage ne fait que stocker, c’est la prédiction qui coûte (chaque image est comparée aux 60 000). Forêt aléatoire de 100 arbres : <b>97,05 %</b> sur les 10 000 images en 15 s. Sur les 2000 images, 57 erreurs ; les paires les plus confondues (dans les deux sens) sont 5 et 8, 4 et 9, 1 et 7 (5 erreurs chacune), puis 1 et 2 (4). Avec si peu d’erreurs par paire, ce classement change d’un sous-échantillon à l’autre : ne pas le surinterpréter.</p>
<p><b>Plus performant ?</b> Sur ces données brutes, la forêt n’est pas meilleure que le kNN (97,05 % sur 10 000 images contre 97,15 % sur 2000 : pas le même ensemble de test, l’écart ne se commente pas). Les modèles qui exploitent la structure 2D de l’image (réseaux convolutifs) sont la piste habituelle pour MNIST ; non mesuré ici.</p>
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
<p><b>À commenter</b> (constaté en exécutant) : les coordonnées du fichier ne correspondent pas aux vraies positions (latitudes autour de 48,9 au lieu de 48,86 pour le centre) et les nuages des arrondissements <b>se chevauchent</b>. Un restaurant « étranger » est donc souvent tout près du barycentre : rayons minuscules (0,0012 à 0,0113 degré), densités qui varient d’un facteur 175. Le classement obtenu (<code>verif_tp/tp0_prerequis.py</code>) le montre : le plus « dense » est le 18e (366 restaurants, rayon 0,0012), puis le 1er (315, rayon 0,0018) ; le moins dense est le 19e (186, rayon 0,0113). Le 18e passe devant parce qu’un restaurant d’un autre arrondissement est collé à son barycentre, pas parce qu’il a plus de restaurants par unité de surface. C’est la méthode qui est fragile : le rayon dépend d’un <b>seul</b> point, le plus proche, donc d’une valeur extrême. Une alternative plus robuste : un quantile des distances, ou l’enveloppe convexe de l’arrondissement.</p>`,
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
      ['tp0-setup', 'yahoo', R`Que se passe-t-il avec <code>web.DataReader("XOM", "yahoo", ...)</code> aujourd’hui ?`, R`<code>NotImplementedError</code> : la source Yahoo n’existe plus dans pandas_datareader. Utiliser le CSV fourni (ou <code>yfinance</code>).`],
      ['tp0-setup', 'bis-ordre', R`Piège du fichier <code>BIS-RE_QBE221200.csv</code> ?`, R`Les 168 trimestres sont rangés du plus récent (2014) au plus ancien (1973) : trier par date avant de tracer ou de calculer des variations.`],
      ['tp0-setup', 'plot-tree', R`Comment afficher l’arbre de décision sans installer graphviz ?`, R`<code>from sklearn.tree import plot_tree</code> puis <code>plot_tree(clf, filled=True)</code>.`],
      ['tp0-resolus', 'acp', R`ACP sur <code>load_digits</code> : part de variance des 2 premières composantes ?`, R`14,9 % + 13,6 % = 28,5 % : le plan des 2 composantes mélange plusieurs chiffres (21 composantes pour 90 %).`],
      ['tp0-resolus', 'heaviside', R`Piège de la fonction <code>heaviside</code> du perceptron de l’énoncé ?`, R`Elle renvoie $-\mathrm{sgn}(\theta_0+\theta_1x_1+\theta_2x_2)$ : $+1$ là où <code>predict</code> donne 0. Frontière juste, couleurs inversées.`],
      ['tp0-ex1', 'logistique', R`Pourquoi la régression logistique ne donne-t-elle pas une courbe « simple » sur <code>load_digits</code> ?`, R`64 pixels pour au plus 1198 images : les classes sont séparables, $E_{in}=0$ pour tout $N$. Un arbre de profondeur 3 donne la courbe simple.`],
      ['tp0-ex1', 'profondeur3', R`Pourquoi l’erreur d’entraînement d’un arbre de profondeur 3 <b>augmente</b>-t-elle avec $N$ ?`, R`8 feuilles au plus pour 10 chiffres : plus il y a d’images, moins ces 8 feuilles peuvent toutes les ajuster. $E_{in}$ passe de 0,32 à 0,51.`],
      ['tp0-ex2', 'resultats', R`Exactitudes obtenues sur MNIST (fichiers du TP0) ?`, R`kNN $k=3$ : 97,15 % sur 2000 images de test ; forêt de 100 arbres : 97,05 % sur les 10 000.`],
      ['tp0-ex3', 'classement', R`Quel arrondissement sort le plus « dense » avec la méthode de l’énoncé, et pourquoi est-ce suspect ?`, R`Le 18e (rayon 0,0012) : un restaurant d’un autre arrondissement est collé à son barycentre. Les densités varient d’un facteur 175.`],
      ['tp0-ex3', 'robuste', R`Deux alternatives plus robustes au rayon « premier restaurant étranger » ?`, R`Un quantile des distances au barycentre (par ex. la médiane) ou l’aire de l’enveloppe convexe des restaurants de l’arrondissement.`],
    ],
    quiz: [
      ['tp0-ex2', R`Ton kNN sur MNIST obtient exactement 10 % de réussite. Le plus probable ?`, ['un problème de données (mauvaise colonne d’étiquette)', 'k est trop petit', 'il faut plus de données', 'le kNN ne marche pas sur des images'], 0, R`10 % = le hasard sur 10 classes : le modèle n’apprend rien de lié aux vraies étiquettes.`],
      ['tp0-ex1', R`$E_{in}=0$ pour tout $N$, $E_{out}$ qui baisse lentement de 0,20 à 0,05. Le modèle est :`, ['complexe (il mémorise)', 'simple', 'sous-ajusté', 'le classifieur de Bayes'], 0, R`Erreur d’entraînement nulle et grand écart : forte capacité, comme kNN avec k=1.`],
      ['tp0-resolus', R`Que renvoie <code>model.score(X_test, y_test)</code> pour un classifieur ?`, ['l’exactitude (fraction de bonnes réponses)', 'l’erreur', 'le nombre d’erreurs', 'la probabilité moyenne'], 0, R`L’erreur de test vaut <code>1 - score</code>.`],
      ['tp0-resolus', R`Sur XOR, le SVM à noyau linéaire :`, ['ne peut pas séparer les 4 points', 'sépare parfaitement', 'dépend de C', 'a besoin de plus de points'], 0, R`Aucun hyperplan du plan ne réalise cet étiquetage.`],
      ['tp0-setup', R`<code>from sklearn.cross_validation import train_test_split</code> lève <code>ModuleNotFoundError</code>. La bonne correction :`, [R`importer depuis <code>sklearn.model_selection</code>`, 'réinstaller scikit-learn', 'installer pandas_datareader', 'passer à Python 2'], 0, R`Le module a été renommé ; la fonction est la même.`],
      ['tp0-setup', R`Tu traces la série BIS sans la trier par date. Que vois-tu ?`, ['la série parcourue à l’envers dans le temps', 'une erreur de lecture', 'une série vide', 'exactement la bonne courbe'], 0, R`Le fichier commence en 2014 et finit en 1973 ; un index de dates trié remet l’axe dans le bon sens.`],
      ['tp0-ex1', R`Un modèle a $E_{in}$ qui monte de 0,32 à 0,51 et $E_{out}$ qui reste vers 0,56 quand $N$ grandit. Ajouter des données :`, ['n’aidera presque pas : le biais domine', 'fera tomber $E_{out}$ à 0', 'augmentera l’écart', 'est indispensable'], 0, R`Les deux courbes se rejoignent à un niveau élevé : c’est la capacité du modèle qui limite (arbre de profondeur 3).`],
      ['tp0-ex2', R`Le kNN met 0,2 s à « s’entraîner » et 6 s à prédire 2000 images. Pourquoi ?`, ['fit ne fait que stocker ; predict calcule les distances aux 60 000 images', 'le fit est mal codé', 'la prédiction réentraîne le modèle', 'pandas est lent'], 0, R`$2000\times60\,000$ distances en dimension 784.`],
      ['tp0-ex3', R`Le rayon d’un arrondissement est la distance du barycentre au premier restaurant étranger. Si ce rayon est divisé par 2, la densité estimée est :`, ['multipliée par 4', 'multipliée par 2', 'divisée par 2', 'inchangée'], 0, R`$n/(\pi r^2)$ : la densité varie en $1/r^2$, d’où sa sensibilité à un seul point proche.`],
      ['tp0-ex3', R`Pour mesurer la densité de façon plus robuste que la méthode de l’énoncé, on peut prendre comme rayon :`, ['la médiane des distances des restaurants de l’arrondissement à leur barycentre', 'le minimum de ces distances', 'la distance au restaurant le plus proche, de n’importe quel arrondissement', 'la distance entre deux barycentres voisins au hasard'], 0, R`Une médiane ne dépend pas d’un seul point extrême.`],
      ['tp0-resolus', R`<code>explained_variance_ratio_</code> commence par 0,149 puis 0,136. Les 2 premières composantes :`, ['expliquent 28,5 % de la variance', 'expliquent 13,6 %', 'séparent parfaitement les 10 chiffres', 'expliquent 100 % car on garde tout'], 0, R`On additionne les parts : $0{,}149+0{,}136=0{,}285$.`],
    ],
    gens: {
      'tp0-resolus': [
        () => {
          const n = pick([300, 450, 500, 1000]), err = rnd(5, 40);
          return { q: R`Un classifieur se trompe sur ${err} images de test sur ${n}. Que renvoie <code>score</code> ? (4 décimales)`, a: 1 - err / n, tol: 0.0001,
            expl: R`score = exactitude $=1-\frac{${err}}{${n}}=${f(1 - err / n, 4)}$ ; l’erreur vaut <code>1 - score</code> $=${f(err / n, 4)}$.` };
        },
        () => {
          const r = [pick([0.15, 0.2, 0.25]), pick([0.1, 0.12, 0.14]), pick([0.08, 0.09]), pick([0.05, 0.06, 0.07])];
          const s = r[0] + r[1] + r[2];
          return { q: R`<code>explained_variance_ratio_</code> commence par $(${r.map(x => f(x, 2)).join(' ; ')})$. Part de variance (en %) gardée par les 3 premières composantes ?`, a: 100 * s, tol: 0.05, unit: '%',
            expl: R`$${r.slice(0, 3).map(x => f(x, 2)).join('+')}=${f(s, 2)}$, soit $${f(100 * s, 1)}\,\%$.` };
        },
      ],
      'tp0-ex2': [
        () => {
          const nt = pick([1000, 2000, 5000, 10000]), ntr = pick([10000, 30000, 60000]);
          const d = nt * ntr;
          return { q: R`kNN « force brute » : combien de distances entre images faut-il calculer pour classer ${nt} images de test avec ${ntr} images d’entraînement ? (en millions)`, a: d / 1e6, tol: 0.5, unit: 'millions',
            expl: R`Chaque image de test est comparée à chaque image d’entraînement : $${nt}\times${ntr}=${f(d / 1e6, 0)}$ millions de distances, chacune sur 784 pixels.` };
        },
        () => {
          const n = pick([2000, 10000]), acc = pick([0.9715, 0.9705, 0.95, 0.968]);
          return { q: R`Exactitude ${f(acc * 100, 2)} % sur ${n} images de test. Combien d’erreurs ?`, a: Math.round(n * (1 - acc)), tol: 0,
            expl: R`$${n}\times(1-${f(acc, 4)})=${Math.round(n * (1 - acc))}$ erreurs.` };
        },
      ],
      'tp0-ex3': [
        () => {
          const n = rnd(140, 450), r = pick([0.0012, 0.002, 0.003, 0.005, 0.008, 0.011]);
          const d = n / (Math.PI * r * r);
          return { q: R`Un arrondissement compte ${n} restaurants et son rayon vaut $r=${f(r, 4)}$ degré. Densité $n/(\pi r^2)$ en millions de restaurants par degré carré ? (2 décimales)`, a: d / 1e6, tol: 0.01, unit: 'millions',
            expl: R`$\pi r^2=\pi\times${f(r, 4)}^2=${f(Math.PI * r * r * 1e6, 3)}\cdot10^{-6}$, donc $${n}/(\pi r^2)\approx${f(d / 1e6, 2)}$ millions. Le chiffre n’a de sens qu’en comparaison entre arrondissements.` };
        },
        () => {
          const k = pick([2, 3, 4, 5]);
          return { q: R`Le rayon d’un arrondissement est divisé par ${k} (un restaurant étranger plus proche du barycentre). Par combien la densité estimée est-elle multipliée ?`, a: k * k, tol: 0,
            expl: R`La densité est en $1/r^2$ : facteur $${k}^2=${k * k}$, sans que le nombre de restaurants change.` };
        },
      ],
    },
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
        { id: 'tp1-p25', group: 'Partie 2 : ensemble fini', title: 'Répéter pour n = 500 et n = 5000', hint: 'Bornes 0,073 et 0,023 pour δ = 0,5.', sec: 'tp1-p2' },
        { id: 'tp1-e1', group: 'Exercices', title: 'n pour M = 1, 100, 10 000 (δ = 0,03, ε = 0,05)', hint: 'Réponses : 840, 1761, 2683.', sec: 'tp1-ex' },
        { id: 'tp1-e2', group: 'Exercices', title: 'Taille d’échantillon pour d_VC = 10', hint: 'Équation implicite en n : itérer.', sec: 'tp1-ex' },
        { id: 'tp1-e2b', group: 'Exercices', title: 'Problèmes 2.20, 2.21, 2.24 de Learning From Data', hint: 'Énoncés absents du dossier : les lire dans le livre.', sec: 'tp1-ex' },
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
<p>Avec ε = 0,25, la borne vaut $2e^{-12{,}5}\approx7\cdot10^{-6}$ dès $n=100$ et la simulation ne voit plus aucun écart. Avec ε = 0,05, la borne ne descend sous 1 qu’à partir de $n=139$ ($n>\ln2/(2\epsilon^2)$) : avant, elle ne dit rien. Chiffres de <code>verif_tp/tp1_hoeffding.py</code> (2000 répétitions, graine 0) ; avec 2000 répétitions, une fréquence de 0,0005 correspond à un seul écart observé.</p>
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
<h4>Résultats obtenus (1000 répétitions, <code>verif_tp/tp1_hoeffding.py</code>)</h4>
<p>Avec ces 50 droites, $R(g)$ va de 0 à 1 (médiane 0,337) : 18 classifieurs ont $R(g)<0{,}1$ et 16 ont $R(g)>0{,}9$. Le mélange de bons et de mauvais demandé par l’énoncé est bien là.</p>
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
<p>Avec la borne du cours, $n\ge\frac1{2\epsilon^2}\ln\frac{2(en/d)^d}{\delta}$ : $n$ apparaît des deux côtés, on <b>itère</b> ($n\leftarrow$ membre de droite, en partant de 1000) jusqu’à stabilité : <b>$n\approx17\,700$</b>. Le livre <i>Learning From Data</i> (section 2.2, à vérifier dans ton exemplaire) utilise la borne VC $n\ge\frac8{\epsilon^2}\ln\frac{4((2n)^{d}+1)}\delta$, qui donne <b>$n\approx452\,957$</b>. La différence de constantes est énorme ; en pratique on retient la règle « $n\approx10\,d_{VC}$ », bien plus optimiste que les deux bornes.</p>
${code(R`
import math
d, eps, delta, n = 10, 0.05, 0.05, 1000
for _ in range(100):
    n = math.log(2 * (math.e * n / d) ** d / delta) / (2 * eps**2)
print(math.ceil(n))     # 17695
`)}
<h4>2 bis. Problèmes 2.20, 2.21 et 2.24 du livre <i>Learning From Data</i></h4>
<p>L’énoncé les cite sans les reproduire, et le livre n’est pas dans le dossier du cours. Les énoncés ci-dessous sont reconstitués de mémoire : <b>vérifie-les dans le livre</b> avant de t’en servir. Les chiffres, eux, viennent d’une exécution réelle des formules écrites (<code>verif_tp/tp1_lfd.py</code>).</p>
${sol('2.20 : comparer quatre bornes de généralisation (d_VC = 50, δ = 0,05)', R`<p>Bornes sur $\epsilon=E_{out}-E_{in}$, avec $m_{\mathcal H}(N)\le N^{d_{VC}}$ : VC d’origine $\sqrt{\frac8N\ln\frac{4m_{\mathcal H}(2N)}\delta}$ ; Rademacher $\sqrt{\frac{2\ln(2Nm_{\mathcal H}(N))}N}+\sqrt{\frac2N\ln\frac1\delta}+\frac1N$ ; Parrondo et Van den Broek $\epsilon\le\sqrt{\frac1N\big(2\epsilon+\ln\frac{6m_{\mathcal H}(2N)}\delta\big)}$ ; Devroye $\epsilon\le\sqrt{\frac1{2N}\big(4\epsilon(1+\epsilon)+\ln\frac{4m_{\mathcal H}(N^2)}\delta\big)}$. Les deux dernières sont implicites en $\epsilon$ : on itère, comme pour l’exercice 2.</p>
<table><tr><th>N</th><th>VC</th><th>Rademacher</th><th>Parrondo-Van den Broek</th><th>Devroye</th></tr>
<tr><td>5</td><td>13,83</td><td>7,05</td><td><b>5,10</b></td><td>5,59</td></tr>
<tr><td>100</td><td>4,64</td><td>2,43</td><td>1,65</td><td><b>1,55</b></td></tr>
<tr><td>1000</td><td>1,75</td><td>0,92</td><td>0,62</td><td><b>0,59</b></td></tr>
<tr><td>10 000</td><td>0,63</td><td>0,33</td><td>0,22</td><td><b>0,22</b></td></tr></table>
<p>Lecture : pour $N$ petit, toutes les bornes dépassent 1 et ne disent rien ; Parrondo-Van den Broek est la plus serrée à $N=5$, Devroye dès $N=100$. La borne VC d’origine est environ trois fois plus large que les deux dernières : ses constantes (8 et $4m_{\mathcal H}(2N)$) viennent de la preuve.</p>`)}
${sol('2.24 : biais et variance pour f(x) = x², deux points, droites', R`<p>$x$ uniforme sur $[-1,1]$, deux points $(x_1,x_1^2)$ et $(x_2,x_2^2)$, $g$ = la droite qui passe par les deux : pente $a=x_1+x_2$, ordonnée $b=-x_1x_2$. En moyenne sur les jeux de données, $\bar g(x)=\mathbb E[a]\,x+\mathbb E[b]=0$. Calcul exact : biais $=\mathbb E_x[x^4]=\frac15$, variance $=\mathbb E_x\big[\mathbb E[a^2]x^2+\mathbb E[b^2]\big]=\frac23\cdot\frac13+\frac19=\frac13$, donc $E_{out}=\frac15+\frac13=\frac8{15}\approx0{,}533$.</p>
<p>Simulation (20 000 jeux de deux points, $x$ sur une grille régulière) : $\bar g(x)=0{,}005\,x+0{,}003$, biais 0,199, variance 0,329, $E_{out}=0{,}528$ = biais + variance. La variance dépasse le biais : avec 2 points, la droite change beaucoup d’un jeu de données à l’autre.</p>`)}
<p><b>2.21</b> : énoncé non reconstitué ici faute de source sûre ; à lire dans le livre.</p>
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
      ['tp1-avant', 'erreur-sim', R`Écart type de la fréquence simulée d’un événement de probabilité $p$ sur $R$ répétitions ?`, R`$\sqrt{p(1-p)/R}$ : avec $p=0{,}1$ et $R=2000$, environ 0,0067.`],
      ['tp1-p1', 'n139', R`À partir de quel $n$ la borne $2e^{-2n\epsilon^2}$ passe-t-elle sous 1 pour $\epsilon=0{,}05$ ?`, R`$n>\frac{\ln2}{2\epsilon^2}\approx138{,}6$, donc $n=139$. Avant, la borne ne dit rien.`],
      ['tp1-ex', 'lfd224', R`Problème 2.24 ($f(x)=x^2$, droite par 2 points) : biais, variance, $E_{out}$ ?`, R`$\bar g=0$, biais $\frac15$, variance $\frac13$, $E_{out}=\frac8{15}\approx0{,}533$ (simulation : 0,199 ; 0,329 ; 0,528). Énoncé à vérifier dans le livre.`],
      ['tp1-preuve', 'lambda', R`Valeur de $\lambda$ qui optimise la borne de Chernoff dans la preuve de Hoeffding ?`, R`$\lambda=\frac{4t}{(b-a)^2}$, qui donne $e^{-2nt^2/(b-a)^2}$.`],
    ],
    quiz: [
      ['tp1-p1', R`ε = 0,05, n = 100 : la borne de Hoeffding vaut :`, ['plus de 1 : elle n’apprend rien', 'environ 0,16', 'environ 0,6', 'environ 0,01'], 0, R`$2e^{-2\cdot100\cdot0{,}0025}=2e^{-0{,}5}\approx1{,}21$.`],
      ['tp1-p1', R`Pour p = 0,9 et n = 500, la simulation donne une probabilité d’écart quasi nulle alors que la borne vaut 0,16. C’est parce que :`, ['la variance 0,09 est bien plus faible que le pire cas 0,25', 'la simulation est fausse', 'n est trop petit', 'ε est trop grand'], 0, R`La borne doit couvrir la loi de variance maximale.`],
      ['tp1-p2', R`Quand n passe de 50 à 5000, la déviation maximale médiane est divisée par environ :`, ['10', '100', '3', '1000'], 0, R`$\sqrt{100}=10$ : vitesse $1/\sqrt n$ (0,093 → 0,009 dans notre exécution).`],
      ['tp1-ex', R`Pour la borne VC du cours, n apparaît des deux côtés de l’inégalité. On :`, ['itère jusqu’à stabilité', 'prend n = d_VC', 'utilise n = 1/ε', 'résout une équation du second degré'], 0, R`Point fixe : $n\leftarrow\frac1{2\epsilon^2}\ln\frac{2(en/d)^d}\delta$.`],
      ['tp1-preuve', R`L’inégalité de Chebyshev s’obtient en appliquant Markov à :`, [R`$(Z-\mathbb E Z)^2$`, R`$e^{\lambda Z}$`, R`$|Z|$`, R`$\mathbb 1[Z\ge t]$`], 0, R`Puis on divise par $t^2$.`],
      ['tp1-avant', R`Tu estimes $\mathbb P[|\hat\mu_n-p|\ge\epsilon]$ avec $R=100$ répétitions et obtiens 0. Conclusion correcte :`, ['la probabilité est probablement inférieure à quelques centièmes, pas forcément nulle', 'la probabilité est exactement nulle', 'la borne de Hoeffding est fausse', 'il faut augmenter $\\epsilon$'], 0, R`Avec 100 répétitions, on ne distingue pas 0 de 0,01 : il faut plus de répétitions pour lire les petites probabilités.`],
      ['tp1-avant', R`Dans la partie 2, la borne $\sqrt{\frac1{2n}\ln\frac{2|\mathcal H|}\delta}$ se compare à :`, [R`$\max_g|R(g)-R_n(g)|$ sur les 50 classifieurs`, R`la moyenne des $|R(g)-R_n(g)|$`, R`$|R(g)-R_n(g)|$ du meilleur classifieur seulement`, R`$R_n(g)$`], 0, R`La garantie est simultanée pour tous les $g$, donc pour le pire.`],
      ['tp1-p2', R`La médiane observée de $\max_g|R-R_n|$ correspond à quelle valeur de $\delta$ dans la borne ?`, [R`$\delta=0{,}5$`, R`$\delta=0{,}05$`, R`$\delta=0{,}95$`, R`$\delta=1/|\mathcal H|$`], 0, R`La moitié des jeux dévient plus que la médiane : probabilité 0,5 de dépasser.`],
      ['tp1-ex', R`Pièce biaisée de $\epsilon=0{,}1$, $n=100$ lancers de chaque pièce. La borne $e^{-n\epsilon^2}$ vaut 0,368 et la simulation donne 0,087. On en conclut :`, ['la borne est valide mais pessimiste', 'la borne est fausse', 'la simulation est fausse', 'il faut $n\\epsilon^2>1$ pour que la borne soit valide'], 0, R`Une borne supérieure doit dépasser la vraie probabilité ; ici d’un facteur 4 (chiffres de <code>verif_tp/tp1_hoeffding.py</code>).`],
      ['tp1-preuve', R`Pour des $Z_i\in[a,b]$, la borne de Hoeffding devient :`, [R`$e^{-2nt^2/(b-a)^2}$`, R`$e^{-2nt^2(b-a)^2}$`, R`$e^{-2nt^2}$ quel que soit l’intervalle`, R`$e^{-nt/(b-a)}$`], 0, R`Le lemme de Hoeffding fait apparaître $(b-a)^2/8$ dans l’exposant de la fonction génératrice.`],
    ],
    gens: {
      'tp1-ex': [...(COURSE.gens['slt-finite'] || []),
        () => {
          const eps = pick([0.02, 0.05, 0.1]), delta = pick([0.01, 0.05, 0.1]);
          const n = Math.ceil(Math.log(1 / delta) / (eps * eps));
          return { q: R`Pièce biaisée : $P(\text{face})=\frac12-${f(eps)}$. Combien de lancers de chaque pièce suffisent pour que la règle « moins de faces = biaisée » se trompe avec probabilité au plus $${f(delta)}$ (borne $e^{-n\epsilon^2}$) ?`, a: n, tol: 1, unit: 'lancers',
            expl: R`$e^{-n\epsilon^2}\le\delta\iff n\ge\frac{\ln(1/\delta)}{\epsilon^2}=\frac{${f(Math.log(1 / delta), 3)}}{${f(eps * eps, 4)}}$, donc $n=${n}$.` };
        },
      ],
      'tp1-p1': [...(COURSE.gens['slt-hoeffding'] || [])],
      'tp1-avant': [
        () => {
          const p = pick([0.01, 0.05, 0.1, 0.3, 0.5]), R0 = pick([100, 500, 1000, 2000, 10000]);
          const se = Math.sqrt(p * (1 - p) / R0);
          return { q: R`On simule un événement de probabilité $p=${f(p)}$ avec $R=${R0}$ répétitions. Écart type de la fréquence obtenue ? (4 décimales)`, a: se, tol: 0.0001,
            expl: R`La fréquence est une moyenne de $R$ Bernoulli : $\sqrt{p(1-p)/R}=\sqrt{${f(p * (1 - p), 4)}/${R0}}=${f(se, 4)}$.` };
        },
      ],
      'tp1-p2': [
        () => {
          const n = pick([50, 100, 500, 1000, 5000]), H = pick([10, 50, 100, 1000]), delta = pick([0.5, 0.1, 0.05]);
          const b = Math.sqrt(Math.log(2 * H / delta) / (2 * n));
          return { q: R`$|\mathcal H|=${H}$ classifieurs fixés, $n=${n}$, $\delta=${f(delta)}$. Borne sur $\max_g|R(g)-R_n(g)|$ ? (3 décimales)`, a: b, tol: 0.001,
            expl: R`$\sqrt{\frac1{2n}\ln\frac{2|\mathcal H|}\delta}=\sqrt{\frac{\ln ${f(2 * H / delta, 1)}}{${2 * n}}}=${f(b)}$.` };
        },
        () => {
          const k = pick([10, 100, 4, 25]);
          return { q: R`Si $n$ est multiplié par ${k}, par combien la borne $\sqrt{\frac1{2n}\ln\frac{2|\mathcal H|}\delta}$ est-elle divisée ? (2 décimales)`, a: Math.sqrt(k), tol: 0.01,
            expl: R`Par $\sqrt{${k}}=${f(Math.sqrt(k), 2)}$ : la vitesse $1/\sqrt n$ (0,230 à $n=50$, 0,073 à $n=500$).` };
        },
      ],
      'tp1-preuve': [
        () => {
          const a = pick([0, -1, 0, -2]), b = pick([1, 2, 3]), n = pick([50, 100, 200]), t = pick([0.1, 0.2, 0.3]);
          const v = Math.exp(-2 * n * t * t / ((b - a) ** 2));
          return { q: R`$Z_i\in[${a},${b}]$ i.i.d., $n=${n}$. Borne de Hoeffding (un côté) sur $\mathbb P\big(\frac1n\sum(Z_i-\mathbb EZ_i)\ge${f(t)}\big)$ ? (4 décimales)`, a: v, tol: 0.0001,
            expl: R`$e^{-2nt^2/(b-a)^2}=e^{-2\times${n}\times${f(t * t, 2)}/${(b - a) ** 2}}=${f(v, 4)}$, atteint pour $\lambda=4t/(b-a)^2=${f(4 * t / ((b - a) ** 2), 3)}$.` };
        },
      ],
    },
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
        { id: 'tp2-t5', group: '2. Trois classes (SVC)', title: '(Optionnel) Même comparaison en dimension 3, 4, 5, 10, 20', hint: 'Énoncé ambigu sur le nombre de classes : préciser sa lecture.', sec: 'tp2-3classes' },
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
            crit = crit + 1e-9 * rng.random(len(crit))   # départage au hasard les ex aequo
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
        summary: 'Score sur les 100 points : 0,917. Départ (8 points de classe 0, 2 de classe 1) : 0,50, car le kNN à 7 voisins prédit partout la classe 0. L’actif gagne nettement entre 12 et 20 points (0,889 contre 0,739 à n = 15), puis passif et actif se rejoignent vers 0,92 dès n ≈ 30.',
        fiche: R`
<p><code>XYtrain.dat</code> : 100 points (50 par classe) ; <code>XYtest.dat</code> : 1000 points ; colonnes x₁, x₂, classe. Chargement : <code>np.loadtxt("XYtrain.dat")</code>.</p>
<p><b>Piège d’ordre</b> : le fichier commence par les 50 points de classe 1 (lignes 0 à 49), puis les 50 de classe 0. « Les 8 premiers points de la classe 0 » sont donc les lignes 50 à 57, et « les 2 premiers de la classe 1 » les lignes 0 et 1 : sélectionne par <code>np.where(y == c)</code>, pas par position.</p>
<h4>Résultats obtenus (<code>verif_tp/tp2_binaire_3classes.py</code>)</h4>
<table><tr><th></th><th>score de test</th></tr>
<tr><td>kNN sur les 100 points</td><td>0,917</td></tr>
<tr><td>10 points au hasard (moyenne de 50 tirages)</td><td>0,762 ± 0,165 (minimum 0,500)</td></tr></table>
<table><tr><th>n</th><th>passif (50 répétitions)</th><th>actif, ex aequo au hasard (50)</th><th>actif, <code>argmax</code> (1 exécution)</th></tr>
<tr><td>10</td><td>0,500 ± 0</td><td>0,500 ± 0</td><td>0,500</td></tr>
<tr><td>12</td><td>0,568 ± 0,120</td><td>0,780 ± 0,057</td><td>0,800</td></tr>
<tr><td>15</td><td>0,739 ± 0,146</td><td>0,889 ± 0,019</td><td>0,850</td></tr>
<tr><td>20</td><td>0,862 ± 0,069</td><td>0,912 ± 0,013</td><td>0,896</td></tr>
<tr><td>30</td><td>0,911 ± 0,015</td><td>0,909 ± 0,011</td><td>0,914</td></tr>
<tr><td>60</td><td>0,918 ± 0,005</td><td>0,917 ± 0,001</td><td>0,917</td></tr></table>
<p>Moyenne de chaque courbe sur $n=10$ à 60 (aire sous la courbe divisée par la longueur) : passif 0,868, actif 0,892 (ex aequo au hasard), 0,886 (<code>argmax</code>).</p>
${sol('Ce qu’il faut comprendre de ces chiffres', R`<ul><li><b>0,50 au départ</b> : avec 8 points de classe 0 et 2 de classe 1, les 7 plus proches voisins de n’importe quel point contiennent au moins 5 points de classe 0. Le classifieur répond toujours 0. C’est le démarrage à froid du cours, en pire.</li>
<li><b>Réponse à « l’actif est-il utile ? »</b> : oui, sur les tout petits budgets. Entre 12 et 20 points, il est nettement au-dessus du passif et bien moins variable (écart type 0,019 contre 0,146 à $n=15$). À partir de $n\approx30$, les deux plafonnent à 0,92 : le problème 2D est facile et quelques dizaines de points au hasard suffisent.</li>
<li><b>Piège des ex aequo</b> : avec $k=7$, <code>predict_proba</code> ne prend que les valeurs $0,\frac17,\dots,1$ ; au départ, sur le réservoir, seulement 0, 1/7 et 2/7. Énormément d’ex aequo, et <code>np.argmax</code> prend le premier dans l’ordre du fichier : l’actif devient déterministe (une seule courbe, écart type nul) et dépend de l’ordre des lignes. En départageant au hasard, on obtient une vraie moyenne sur 50 exécutions.</li>
<li><b>Le score de 0,917 n’est pas dépassé</b> : la limite vient du classifieur et du recouvrement des classes, pas du nombre de points.</li></ul>`)}`,
      },
      {
        id: 'tp2-3classes', title: 'Partie 2 : trois classes gaussiennes, SVC', slides: 'énoncé p. 3',
        summary: 'L’ensemble initial ne contient aucun point de la classe 2 : l’actif la découvre plus vite (0,90 contre 0,86 à n = 30 pour une covariance 0,1, 50 répétitions). Plus les classes se chevauchent (0,2 ; 0,4 ; 0,6), plus le gain fond ; à 150 points, toutes les méthodes se rejoignent.',
        fiche: R`
<p>Classes 0, 1, 2 centrées en $(1,0)$, $(0,1)$, $(1,1)$, covariance $C_1=0{,}1\,I$ ; train 150 points (50 par classe), test 900. Ensemble initial : 10 premiers points de la classe 0 et 5 de la classe 1, puis ajout par pas de 5 jusqu’à 150.</p>
${code(R`
def gen(rng, per, var):
    centres = np.array([[1, 0], [0, 1], [1, 1]])
    X = np.vstack([rng.multivariate_normal(c, var * np.eye(2), per) for c in centres])
    return X, np.repeat([0, 1, 2], per)
`)}
<h4>Résultats obtenus (50 répétitions, données regénérées à chaque répétition, <code>verif_tp/tp2_binaire_3classes.py</code>)</h4>
<p>Moyenne (écart type) de l’exactitude de test :</p>
<table><tr><th>variance</th><th>n</th><th>passif</th><th>moins confiant</th><th>marge</th><th>entropie</th></tr>
<tr><td>0,1</td><td>15</td><td>0,650</td><td>0,650</td><td>0,650</td><td>0,650</td></tr>
<tr><td>0,1</td><td>20</td><td>0,725 (0,098)</td><td>0,836 (0,062)</td><td>0,836 (0,062)</td><td>0,836 (0,062)</td></tr>
<tr><td>0,1</td><td>30</td><td>0,859 (0,075)</td><td>0,899 (0,017)</td><td>0,900 (0,016)</td><td>0,893 (0,020)</td></tr>
<tr><td>0,1</td><td>50</td><td>0,903</td><td>0,909</td><td>0,910</td><td>0,909</td></tr>
<tr><td>0,1</td><td>150</td><td>0,915</td><td>0,915</td><td>0,915</td><td>0,915</td></tr>
<tr><td>0,2</td><td>30</td><td>0,720 (0,068)</td><td>0,764 (0,036)</td><td>0,761 (0,035)</td><td>0,760 (0,042)</td></tr>
<tr><td>0,2</td><td>150</td><td>0,807</td><td>0,807</td><td>0,807</td><td>0,807</td></tr>
<tr><td>0,4</td><td>30</td><td>0,591 (0,055)</td><td>0,616 (0,054)</td><td>0,613 (0,064)</td><td>0,614 (0,063)</td></tr>
<tr><td>0,4</td><td>150</td><td>0,686</td><td>0,686</td><td>0,686</td><td>0,686</td></tr>
<tr><td>0,6</td><td>30</td><td>0,535 (0,050)</td><td>0,555 (0,043)</td><td>0,550 (0,038)</td><td>0,546 (0,053)</td></tr>
<tr><td>0,6</td><td>150</td><td>0,619</td><td>0,619</td><td>0,619</td><td>0,619</td></tr></table>
<p>Moyenne de chaque courbe sur $n=15$ à 150 (passif / moins confiant) : 0,888 / 0,899 pour 0,1 ; 0,778 / 0,786 pour 0,2 ; 0,654 / 0,661 pour 0,4 ; 0,589 / 0,597 pour 0,6. Marge et entropie restent à 0,004 près du moins confiant : avec 3 classes, les trois critères choisissent presque les mêmes points.</p>
${sol('Ce qu’il faut comprendre', R`<ul><li><b>Départ à 0,650</b> : l’ensemble initial n’a <b>aucun point de la classe 2</b> ; le SVC ne peut pas la prédire, il perd presque un tiers du test.</li>
<li>Les points de la classe 2, centrés en $(1,1)$, tombent entre les deux autres : ils sont incertains, donc l’actif les demande vite et « découvre » la classe 2 plus tôt.</li>
<li><b>Plus de chevauchement, moins de gain</b> : à $n=30$, l’écart actif moins passif vaut 0,040 (variance 0,1), 0,044 (0,2), 0,025 (0,4), 0,020 (0,6), alors que les écarts types d’une répétition sont de 0,04 à 0,06. Quand la variance augmente, l’incertitude est partout ; le critère ne sait plus quels points sont informatifs et choisit souvent des points bruités (le défaut « chercher le bruit » du cours). Le plafond lui-même baisse (0,915 puis 0,807, 0,686, 0,619) : c’est le recouvrement des classes, aucune stratégie n’y peut rien.</li>
<li><b>À 150 points</b>, toutes les stratégies ont étiqueté le réservoir entier : mêmes données, même score. Le gain de l’actif se lit au milieu de la courbe, pas à la fin.</li>
<li><code>SVC(probability=True)</code> utilise une validation croisée interne aléatoire (calibration de Platt) : fixer <code>random_state</code> pour la reproductibilité, et répéter pour moyenner.</li></ul>`)}
<h4>Question 2.5 (optionnelle) : en dimension $d$</h4>
<p>L’énoncé est ambigu (« centrées aux extrémités des vecteurs unitaires des axes de $\mathbb R^n$ »). Lecture retenue ici, à confirmer en séance : $d$ classes centrées en $e_1,\dots,e_d$, covariance $0{,}1\,I$, 50 points par classe, même départ (10 points de la classe 0, 5 de la classe 1), pas de 5, budget de 115 points, 10 répétitions (<code>verif_tp/tp2_rn.py</code>).</p>
<table><tr><th>$d$</th><th>n</th><th>passif</th><th>marge</th><th>entropie</th></tr>
<tr><td>3</td><td>30</td><td>0,953</td><td>0,965</td><td>0,968</td></tr>
<tr><td>5</td><td>30</td><td>0,858</td><td>0,877</td><td>0,806</td></tr>
<tr><td>10</td><td>50</td><td>0,618</td><td>0,748</td><td>0,395</td></tr>
<tr><td>10</td><td>115</td><td>0,860</td><td>0,880</td><td>0,868</td></tr>
<tr><td>20</td><td>115</td><td>0,527</td><td>0,620</td><td>0,436</td></tr></table>
<p>Constat : avec beaucoup de classes, la <b>marge</b> garde l’avantage sur le passif, mais l’<b>entropie</b> fait <b>moins bien</b> que le passif ($d=10$ à $n=50$ : 0,395 contre 0,618). Le mécanisme n’est pas établi par cette exécution : pour le trouver, compter à chaque étape les classes des points demandés par chaque critère (l’entropie mesure l’incertitude sur toutes les classes à la fois, la marge seulement entre les deux plus probables). Seulement 10 répétitions : écarts types de 0,03 à 0,09, à lire comme une tendance.</p>`,
      },
      {
        id: 'tp2-mnist', title: 'Parties 3 et 4 : MNIST avec forêts, et l’inconsistance', slides: 'énoncé p. 4-5',
        summary: 'MNIST, forêt, 500 images : la marge bat le passif (0,615 contre 0,554 à n = 50). Partie 4 (figure 1D) : l’incertitude reste bloquée à 5 % dans 8 répétitions sur 20 (et s’inverse dans 2), le comité de 5 atteint 2,5 % dans 14 sur 20.',
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
reste = np.setdiff1d(np.arange(len(y)), idx_tr)          # test : 1000 par classe, hors des 500 images d'entraînement
idx_te = np.concatenate([rng.choice(reste[y[reste] == c], 1000, replace=False) for c in range(10)])
Xtr, ytr = X[idx_tr], y[idx_tr]
Xte, yte = X[idx_te], y[idx_te]
init = [np.where(ytr == c)[0][0] for c in range(10)]      # une image par chiffre
`)}
<p>Puis la boucle de la fiche « Ce qu’il faut savoir » avec <code>make=lambda: RandomForestClassifier(n_estimators=100)</code>, <code>pas=10</code>, <code>n_max=500</code>, au moins 10 répétitions. Avec 10 classes, les trois critères ne sont plus équivalents : c’est la partie où marge et entropie peuvent se distinguer du simple moins confiant.</p>
<p><b>Pièges</b> : l’énoncé demande de <i>créer</i> des fichiers <code>XYtrain.dat</code> et <code>XYtest.dat</code> ; ne les écris pas dans le dossier du TP2, tu écraserais les données de la partie 1. Et <code>mnist_test.csv</code> n’a pas 1000 images par classe (892 « 5 », 1135 « 1 ») : le code ci-dessus tire le test équilibré dans le reste du fichier d’entraînement.</p>
<p><b>Résultats obtenus</b> (10 répétitions, <code>verif_tp/tp2_mnist.py</code>), exactitude moyenne sur les 10 000 images de test :</p>
<table><tr><th>n</th><th>passif</th><th>moins confiant</th><th>marge</th><th>entropie</th></tr>
<tr><td>10</td><td>0,355</td><td>0,352</td><td>0,354</td><td>0,356</td></tr>
<tr><td>50</td><td>0,554</td><td>0,569</td><td>0,615</td><td>0,555</td></tr>
<tr><td>100</td><td>0,703</td><td>0,699</td><td>0,746</td><td>0,690</td></tr>
<tr><td>200</td><td>0,791</td><td>0,827</td><td>0,838</td><td>0,811</td></tr>
<tr><td>300</td><td>0,832</td><td>0,864</td><td>0,865</td><td>0,854</td></tr>
<tr><td>500</td><td>0,867</td><td>0,869</td><td>0,870</td><td>0,869</td></tr></table>
<p>Lecture : la <b>marge</b> est la meilleure tout du long (moyenne de la courbe 0,798 contre 0,767 en passif) ; elle atteint dès $n=260$ le score que le passif n’obtient qu’avec les 500 images. Moins confiant et entropie ne décollent du passif qu’après $n\approx150$. Écarts types de 0,002 à 0,05 selon $n$ : les écarts de moins de 0,01 ne se commentent pas.</p>
<h4>Partie 4 (*) : inconsistance statistique</h4>
<p>La figure de l’énoncé (p. 5) est la situation 1D du cours (${course('al-incons', 'fiche « Myopie »')}) : de gauche à droite, un bloc de 45 % de classe 0, un bloc de 5 % de classe 1, un bloc de 5 % moitié classe 0 moitié classe 1, et un bloc de 45 % de classe 1. Le meilleur seuil $w^*$ (entre les deux premiers blocs) se trompe sur 2,5 % ; le seuil $w$ (au milieu du troisième bloc) sur 5 %.</p>
<p><b>Résultats obtenus</b> ($10^4$ points, SVC linéaire, départ à 10 points au hasard, 300 étiquettes, 20 répétitions, <code>verif_tp/tp2_inconsistance.py</code>) : erreur finale par répétition</p>
<ul><li><b>Passif</b> : environ 0,03 dans 8 répétitions sur 20, de 0,048 à 0,072 dans les autres (moyenne 0,051). Même avec 300 points, le SVC linéaire n’atteint pas toujours 2,5 % : il minimise la perte charnière, pas le taux d’erreur, et son seuil reste souvent dans le bloc de 5 %.</li>
<li><b>Incertitude</b> : 0,024 à 0,028 dans 10 répétitions, 0,048 à 0,053 dans 8 (bloqué en $w$, la myopie du cours), et 0,48 dans 2 (pente négative : classifieur inversé). Moyenne 0,081, médiane 0,038.</li>
<li><b>Comité de 5</b> (SVC entraînés sur des rééchantillonnages bootstrap, on demande le point de plus grande entropie de vote) : 0,023 à 0,028 dans 14 répétitions, 0,050 à 0,054 dans 6 ; moyenne 0,033. Le meilleur des trois, sans garantie : 6 répétitions sur 20 restent bloquées.</li></ul>
<p>Ces chiffres dépendent de la position des blocs choisie pour reproduire la figure : une illustration, pas une mesure générale.</p>`,
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
      ['tp2-mnist', 'marge-mnist', R`Quel critère gagne sur MNIST (forêt, 500 images) ?`, R`La marge : 0,615 contre 0,554 en passif à $n=50$, et dès $n=260$ le score final du passif (0,867).`],
      ['tp2-mnist', 'figure-1d', R`Erreurs des seuils $w^*$ et $w$ dans la figure 1D de la partie 4 ?`, R`$w^*$ : 2,5 % (moitié classe 0 du troisième bloc) ; $w$ : 5 % (le bloc de 5 % de classe 1 à gauche).`],
      ['tp2-binaire', 'ordre-fichier', R`Piège d’ordre de <code>XYtrain.dat</code> ?`, R`Les 50 points de classe 1 viennent d’abord : sélectionner les « premiers points de la classe 0 » avec <code>np.where(y == 0)</code>, pas par position.`],
      ['tp2-3classes', 'plafond', R`Score final (150 points) selon la covariance 0,1 ; 0,2 ; 0,4 ; 0,6 ?`, R`0,915 ; 0,807 ; 0,686 ; 0,619 pour toutes les stratégies : le plafond vient du recouvrement des classes.`],
    ],
    quiz: [
      ['tp2-binaire', R`L’actif avec kNN a un écart type nul sur 50 répétitions. Pourquoi ?`, ['le départ et le critère sont déterministes', 'le kNN est mal entraîné', 'le passif a été utilisé par erreur', 'le test est trop petit'], 0, R`Rien d’aléatoire : mêmes choix à chaque exécution.`],
      ['tp2-3classes', R`À 150 points, passif et actif ont exactement le même score. C’est :`, ['normal : les deux ont étiqueté tout le réservoir', 'un bug', 'la preuve que l’actif est inutile', 'dû à SVC'], 0, R`Le gain de l’actif se lit au milieu de la courbe.`],
      ['tp2-avant', R`En classification binaire, moins confiant, marge et entropie :`, ['choisissent le même point', 'donnent des points différents', 'sont aléatoires', 'ne s’appliquent pas'], 0, R`Tous choisissent la probabilité la plus proche de 1/2.`],
      ['tp2-3classes', R`Pour rendre SVC(probability=True) reproductible, il faut :`, ['fixer random_state', 'augmenter C', 'désactiver probability', 'normaliser les données'], 0, R`La calibration des probabilités utilise une validation croisée interne aléatoire.`],
      ['tp2-avant', R`Probabilités prédites pour 3 points : A $(0{,}5 ; 0{,}49 ; 0{,}01)$, B $(0{,}4 ; 0{,}3 ; 0{,}3)$. Le critère de marge choisit :`, ['A (marge 0,01 contre 0,10)', 'B', 'les deux à égalité', 'aucun des deux'], 0, R`Marge = écart entre les deux plus grandes probabilités ; A hésite entre deux classes, ce que le moins confiant ($1-0{,}5$ contre $1-0{,}4$) ne verrait pas : il choisirait B.`],
      ['tp2-binaire', R`Au départ (8 points de classe 0, 2 de classe 1), <code>predict_proba</code> du kNN à 7 voisins ne prend que 3 valeurs sur le réservoir. Lesquelles ?`, ['0, 1/7 et 2/7', '0 et 1', '1/2 seulement', 'toutes les valeurs de 0 à 1'], 0, R`Au plus 2 des 7 voisins sont de classe 1 : $P(1)\in\{0,\frac17,\frac27\}$ (constaté dans <code>verif_tp/tp2_binaire_3classes.py</code>).`],
      ['tp2-binaire', R`À $n=15$ : passif 0,739 ± 0,146, actif 0,889 ± 0,019 (50 répétitions). Que retenir ?`, ['l’actif est meilleur et bien plus stable sur ce petit budget', 'les deux se valent', 'l’actif est moins bon', 'l’écart type de l’actif prouve un bug'], 0, R`L’écart (0,150) dépasse l’écart type du passif ; à $n=30$ les deux se rejoignent vers 0,91.`],
      ['tp2-mnist', R`Partie 4 : l’échantillonnage par incertitude finit à 5 % d’erreur dans 8 répétitions sur 20. Ce n’est pas un manque de données parce que :`, ['il continue de demander des points autour de son seuil et ne voit jamais le bloc qui ferait bouger ce seuil', 'le SVC est mal entraîné', '300 étiquettes ne suffisent jamais', 'le test est trop petit'], 0, R`C’est la myopie, ou biais d’échantillonnage, du cours : plus d’étiquettes au même endroit ne changent rien.`],
      ['tp2-mnist', R`Pourquoi le comité de 5 explore-t-il mieux que l’incertitude d’un seul SVC ?`, ['les SVC entraînés sur des rééchantillonnages différents sont en désaccord ailleurs qu’autour d’un seul seuil', 'il utilise plus d’étiquettes', 'il est déterministe', 'il ignore les données'], 0, R`Le désaccord mesure l’incertitude sur le classifieur lui-même ; résultat : 14 répétitions sur 20 à environ 2,5 %, contre 10 pour l’incertitude.`],
      ['tp2-3classes', R`Quand la covariance passe de 0,1 à 0,6, le score final (150 points) passe de 0,915 à 0,619. Cette baisse vient :`, ['du recouvrement des classes, quelle que soit la stratégie', 'de l’actif', 'du SVC mal réglé', 'du nombre de répétitions'], 0, R`Toutes les stratégies finissent au même score : c’est le plafond fixé par les données.`],
    ],
    gens: {
      'tp2-avant': [
        () => {
          const P = pick([[0.5, 0.3, 0.2], [0.6, 0.3, 0.1], [0.4, 0.4, 0.2], [0.7, 0.2, 0.1], [0.45, 0.45, 0.1], [0.8, 0.15, 0.05]]);
          const s = [...P].sort((a, b) => b - a);
          const k = pick([0, 1, 2]);
          const names = ['moins confiant $1-P_{\\max}$', 'marge $P_{(1)}-P_{(2)}$', 'entropie $-\\sum_kP_k\\ln P_k$ (logarithme népérien)'];
          const vals = [1 - s[0], s[0] - s[1], -P.reduce((t, p) => t + p * Math.log(p), 0)];
          return { q: R`Probabilités prédites $(${P.map(x => f(x, 2)).join(' ; ')})$. Valeur du critère ${names[k]} ? (3 décimales)`, a: vals[k], tol: 0.001,
            expl: k === 2 ? R`$-(${P.map(p => `${f(p, 2)}\ln ${f(p, 2)}`).join('+')})=${f(vals[2])}$ (maximum $\ln3\approx1{,}099$ pour 3 classes équiprobables).` : k === 1 ? R`$${f(s[0], 2)}-${f(s[1], 2)}=${f(vals[1], 2)}$ : plus elle est petite, plus le point est incertain.` : R`$1-${f(s[0], 2)}=${f(vals[0], 2)}$ : plus il est grand, plus le point est incertain.` };
        },
        () => {
          const K = pick([2, 3, 4, 10]);
          return { q: R`Entropie maximale (logarithme népérien) d’un vecteur de probabilités sur ${K} classes ? (3 décimales)`, a: Math.log(K), tol: 0.001,
            expl: R`Atteinte pour la loi uniforme : $-\sum_k\frac1K\ln\frac1K=\ln ${K}=${f(Math.log(K))}$. En bits (base 2, comme au cours) : $\log_2${K}=${f(Math.log2(K))}$.` };
        },
      ],
      'tp2-binaire': [
        () => {
          const j = rnd(0, 7);
          const p = j / 7, u = 1 - Math.max(p, 1 - p);
          return { q: R`kNN à 7 voisins, binaire : ${j} des 7 voisins d’un point sont de classe 1. Critère du moins confiant $1-\max(P_0,P_1)$ ? (3 décimales)`, a: u, tol: 0.001,
            expl: R`$P_1=${j}/7=${f(p)}$, $P_0=${f(1 - p)}$ ; $1-\max=${f(u)}$. Maximum $3/7\approx0{,}429$ pour 3 ou 4 voisins de classe 1 : avec $k$ impair, jamais exactement 1/2.` };
        },
      ],
      'tp2-3classes': [
        () => {
          const n0 = 15, step = pick([5, 10]), nmax = pick([150, 100]), R0 = pick([10, 50]);
          const fits = Math.floor((nmax - n0) / step) + 1;
          return { q: R`Départ à ${n0} points, ajout par pas de ${step} jusqu’à ${nmax}, ${R0} répétitions, 4 stratégies. Combien d’entraînements de SVC au total ?`, a: fits * R0 * 4, tol: 0,
            expl: R`$\frac{${nmax}-${n0}}{${step}}+1=${fits}$ entraînements par courbe, fois ${R0} répétitions et 4 stratégies : $${fits * R0 * 4}$. Avec <code>probability=True</code>, chacun lance en plus une validation croisée interne : d’où les minutes de calcul annoncées par l’énoncé.` };
        },
      ],
    },
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
        summary: 'ETC : m = 10 donne environ 43 (mauvais bras dans un tiers des cas), m = 50 environ 19, m = 100 de 23 à 27, m = 400 donne 88 (trop d’exploration). ε-greedy : ε = 0,1 donne 26 à 31, ε = 0,5 donne 58, ε = 0,8 donne 89 ; le regret reste linéaire à long terme.',
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
<h4>Résultats obtenus (100 répétitions, n = 2000, <code>verif_tp/tp3_bandits.py</code>, deux graines)</h4>
<table><tr><th>stratégie</th><th>regret moyen, graine 0</th><th>graine 1</th><th>erreur-type</th><th>part des exécutions où le bras le plus tiré n’est pas le meilleur</th></tr>
<tr><td>uniforme (ε = 0,9999)</td><td>109,8</td><td>109,8</td><td>0,2</td><td>0,71 / 0,66</td></tr>
<tr><td>ETC m = 10</td><td>43,3</td><td>42,3</td><td>5 à 6</td><td>0,39 / 0,34</td></tr>
<tr><td>ETC m = 50</td><td>17,9</td><td>20,0</td><td>2 à 3</td><td>0,07 / 0,09</td></tr>
<tr><td>ETC m = 100</td><td>22,6</td><td>26,8</td><td>0,2 à 1,8</td><td>0,00 / 0,06</td></tr>
<tr><td>ETC m = 200</td><td>44,2</td><td>44,0</td><td>0,1</td><td>0</td></tr>
<tr><td>ETC m = 400</td><td>88,0</td><td>88,2</td><td>0,1</td><td>0</td></tr>
<tr><td>ETC m = 1000</td><td>50,0</td><td>50,0</td><td>0</td><td>0</td></tr>
<tr><td>ε-greedy 0,1</td><td>25,8</td><td>30,5</td><td>2 à 3</td><td>0,10 / 0,14</td></tr>
<tr><td>ε-greedy 0,5</td><td>58,5</td><td>58,0</td><td>0,5</td><td>0,02 / 0,01</td></tr>
<tr><td>ε-greedy 0,8</td><td>89,5</td><td>89,3</td><td>0,3</td><td>0 / 0,01</td></tr></table>
<p>Lecture : un écart de moins de deux erreurs-types ne se commente pas. ETC $m=10$ (43) contre ε-greedy 0,1 (26 à 31) est un vrai écart ; ETC $m=50$ contre $m=100$ n’en est pas un. Une ancienne version de cette fiche donnait 33,8 pour ETC $m=10$ : relancé deux fois, on obtient 43,3 et 42,3, la valeur 33,8 n’est pas reproduite.</p>
${sol('Discussion attendue', R`<ul><li><b>ETC, choix de m</b> : $m=10$ est trop court, avec des gains aussi rares (au plus 1 succès sur 10 attendu), on se trompe souvent de bras et on le paie jusqu’au bout. $m=400$ explore trop longtemps : déjà $400\times(0{,}05+0{,}08+0{,}09)=88$ de regret dans l’exploration seule, le même chiffre que la simulation. De même $m=200$ coûte $200\times0{,}22=44$ et $m=100$ coûte 22 : au-delà de $m\approx50$, le regret d’ETC est presque entièrement celui de l’exploration. Le $m$ optimal du cours dépend de $\Delta$, inconnu.</li>
<li><b>Le cas $m=1000$ de l’énoncé</b> : l’exploration demanderait $4\times1000=4000$ tours, plus que l’horizon. Avec le code ci-dessus (bras 1 tiré 1000 fois, puis bras 2), on n’atteint jamais l’engagement et le regret vaut exactement $1000\times0{,}05=50$. Avec une exploration à tour de rôle (1, 2, 3, 4, 1, 2…), on obtiendrait la stratégie uniforme, 110. Le résultat dépend donc de l’ordre d’exploration : à dire dans le compte rendu.</li>
<li><b>ε et le compromis</b> : ε est la fraction de tours passés à explorer. Grand ε : on trouve vite le meilleur bras mais on continue à perdre $\epsilon\,\bar\Delta$ par tour, pour toujours. Petit ε : peu de perte d’exploration mais risque de rester bloqué sur un mauvais bras. Dans les deux cas le regret finit <b>linéaire</b>. Vérification chiffrée : une fois le bon bras trouvé, ε-greedy perd environ $\epsilon\bar\Delta=\epsilon\times0{,}055$ par tour, soit $0{,}8\times0{,}055\times2000=88$ pour ε = 0,8 (simulation 89,5) et 55 pour ε = 0,5 (simulation 58,5, l’écart venant du début). Pour ε = 0,1, ce terme ne vaut que 11 : le reste du regret (26 à 31) vient surtout des exécutions bloquées sur un mauvais bras (10 à 14 %).</li></ul>`)}`,
      },
      {
        id: 'tp3-ucb-ts', title: 'UCB, Thompson sampling et comparaison', slides: 'énoncé p. 5-7',
        summary: 'UCB avec α = 1,5 : 60 (il sur-explore car les moyennes sont minuscules et Hoeffding ignore la variance ; 51 avec α = 1, 36 avec α = 0,5). Thompson : 20, au niveau du meilleur ETC sans aucun réglage. Plusieurs stratégies passent sous la « borne » de 44 : elle est asymptotique.',
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
`) + R`<p class="small">Pas besoin de tirer chaque bras d’abord : avec 0 tirage, la loi Beta(1, 1) est uniforme. Piège de l’algorithme 3 de l’énoncé : il initialise $\alpha(0)=\beta(0)=0$, or $\mathrm{Beta}(0,0)$ n’existe pas (<code>np.random.beta(0, 0)</code> lève <code>ValueError: a &lt;= 0</code>). Avec l’a priori uniforme de l’équation (1), il faut partir de 1 et 1, d’où les « + 1 ».</p>`)}
<h4>Comparaison (100 répétitions, n = 2000)</h4>
<table><tr><th>stratégie</th><th>regret (graine 0 / graine 1)</th></tr><tr><td>Thompson</td><td><b>20,0 / 20,2</b></td></tr><tr><td>ETC m = 50</td><td>17,9 / 20,0</td></tr><tr><td>ETC m = 100</td><td>22,6 / 26,8</td></tr><tr><td>ε-greedy 0,1</td><td>25,8 / 30,5</td></tr><tr><td>UCB α = 0,5</td><td>36,7 / 36,2</td></tr><tr><td>UCB α = 1</td><td>51,2 / 50,8</td></tr><tr><td>UCB α = 1,5</td><td>60,1 / 60,5</td></tr><tr><td>borne de Lai-Robbins à n = 2000</td><td>44,2</td></tr><tr><td>uniforme</td><td>109,8 / 109,8</td></tr></table>
<p>Thompson ne bat pas ETC avec $m=50$ à cet horizon (écart sous les erreurs-types), mais il n’a aucun paramètre à régler, alors que le bon $m$ d’ETC dépend des écarts $\Delta$ inconnus. À $n=500$, Thompson est à 12,7 et UCB α = 1,5 à 21,0.</p>
${sol('Les deux points à expliquer dans le compte rendu', R`<ul><li><b>Passer sous la « borne inférieure » n’est pas une contradiction</b> : Lai-Robbins porte sur $\liminf_{n\to\infty}$, c’est un résultat <b>asymptotique</b>, pas une borne valable à $n=2000$. Et ETC avec $m$ bien choisi ou ε-greedy à ε fixe ont un regret qui finit linéaire : sur un horizon plus long, ils repasseraient au-dessus. Thompson, lui, est asymptotiquement optimal.</li>
<li><b>Pourquoi UCB est décevant ici</b> : le bonus vient de Hoeffding, qui raisonne comme si la variance était maximale (1/4). Or les gains ont une moyenne d’au plus 0,1, donc une variance d’au plus 0,09 : l’intervalle de confiance est bien trop large, UCB continue de tirer les mauvais bras. C’est la motivation de KL-UCB (borne de Chernoff) vue au cours. Réduire α l’améliore (60 pour α = 1,5, 51 pour α = 1, 36 pour α = 0,5), mais l’énoncé demande α > 1 : en dessous, la garantie théorique du cours ne s’applique plus.</li></ul>`)}`,
      },
    ],
    cards: [
      ['tp3-avant', 'vars', R`Dans main.py, que représentent <code>draws</code>, <code>rewards</code> et <code>regret[t]</code> ?`, R`$N_a(t)$, $S_a(t)$ (somme des gains), et $\Delta_{a}$ du bras joué (regret espéré).`],
      ['tp3-avant', 'bug', R`Quel est le bug de départage dans le code fourni ?`, R`<code>np.random.choice(winners[0])</code> ne garde que le premier gagnant (argwhere renvoie un tableau (k, 1)). Utiliser <code>np.flatnonzero</code>.`],
      ['tp3-bornes', 'lb', R`Que renvoie <code>computeLowerBound</code> et combien vaut-il ici ?`, R`$\sum_{a:\mu_a<\mu^*}\Delta_a/kl(\mu_a,\mu^*)$ = 5,82 ; la borne vaut $5{,}82\log n$ (44 à n = 2000).`],
      ['tp3-bornes', 'aveugle', R`Regret de la stratégie uniforme sur les bras (0,1 ; 0,05 ; 0,02 ; 0,01) ?`, R`$0{,}055\,n$ (moyenne des écarts 0 ; 0,05 ; 0,08 ; 0,09), soit 110 à n = 2000.`],
      ['tp3-strategies', 'etc-m', R`Pourquoi ETC avec m = 10 puis m = 400 sont-ils tous deux mauvais ici ?`, R`m = 10 : trop peu de succès pour distinguer les bras, on s’engage sur un mauvais bras dans environ un tiers des exécutions (regret 43). m = 400 : l’exploration seule coûte $400\times0{,}22=88$.`],
      ['tp3-strategies', 'eps', R`Effet de ε sur le compromis exploration / exploitation ?`, R`ε = fraction de tours d’exploration ; grand ε : perte $\epsilon\bar\Delta$ par tour pour toujours ; petit ε : risque de rester bloqué. Regret linéaire dans les deux cas.`],
      ['tp3-ucb-ts', 'ucb', R`Indice UCB du TP avec $\delta=1/t^\alpha$ ?`, R`$\hat\mu_k(t)+\sqrt{\alpha\ln t/(2N_k(t))}$.`],
      ['tp3-ucb-ts', 'ts', R`Une ligne numpy pour le tirage de Thompson ?`, R`<code>np.random.beta(rewards + 1, draws - rewards + 1)</code>, puis jouer l’argmax.`],
      ['tp3-ucb-ts', 'sous-borne', R`Pourquoi Thompson (20) peut-il être sous la borne de Lai-Robbins (44) à n = 2000 ?`, R`La borne est asymptotique ($\liminf$), elle ne contraint pas un horizon fini.`],
      ['tp3-ucb-ts', 'ucb-mauvais', R`Pourquoi UCB (α = 1,5) fait-il 60 ici ?`, R`Bonus de Hoeffding calculé pour la variance maximale alors que les moyennes sont ≤ 0,1 : intervalles trop larges, sur-exploration (d’où KL-UCB).`],
      ['tp3-avant', 'div0', R`Pourquoi toutes les stratégies commencent-elles par tirer chaque bras une fois ?`, R`<code>rewards / draws</code> divise par zéro tant qu’un bras n’a jamais été tiré (sauf Thompson, qui part de Beta(1, 1)).`],
      ['tp3-bornes', 'kl-terme', R`Contribution de chaque bras sous-optimal au coefficient 5,82 de Lai-Robbins ?`, R`$\Delta_a/d(\mu_a;\mu^*)$ : 2,99 pour le bras à 0,05 ; 1,56 pour 0,02 ; 1,26 pour 0,01. Le bras le plus proche du meilleur coûte le plus cher.`],
      ['tp3-strategies', 'etc1000', R`Que donne ETC avec m = 1000 sur un horizon de 2000 ?`, R`L’exploration ($4\times1000$ tours) ne finit jamais. Avec une exploration bras par bras : $1000\times0{,}05=50$ exactement ; à tour de rôle, ce serait l’uniforme (110).`],
      ['tp3-ucb-ts', 'beta00', R`Piège de l’initialisation $\alpha(0)=\beta(0)=0$ de l’algorithme 3 de l’énoncé ?`, R`$\mathrm{Beta}(0,0)$ n’existe pas (<code>ValueError</code>) ; l’a priori uniforme correspond à $\mathrm{Beta}(1,1)$, d’où $\mathrm{Beta}(S_a+1,N_a-S_a+1)$.`],
    ],
    quiz: [
      ['tp3-bornes', R`Pourquoi exclure le meilleur bras de la somme dans computeLowerBound ?`, ['Δ = 0 et kl(μ*, μ*) = 0 : division par zéro', 'il a le plus grand regret', 'il n’est jamais tiré', 'pour gagner du temps'], 0, R`Son terme vaut 0/0.`],
      ['tp3-strategies', R`ε-greedy avec ε = 0,9999 reproduit :`, ['la stratégie uniforme', 'Thompson', 'ETC avec m = 1', 'la stratégie gloutonne'], 0, R`On explore presque toujours, uniformément.`],
      ['tp3-ucb-ts', R`Thompson sans tirage préalable de chaque bras : est-ce un problème ?`, ['non, Beta(1, 1) est uniforme', 'oui, division par zéro', 'oui, il ne tirera jamais certains bras', 'oui, il faut m tirages'], 0, R`Pas de moyenne empirique à calculer.`],
      ['tp3-ucb-ts', R`Pour améliorer UCB sur ces bras de faible moyenne, le cours propose :`, ['KL-UCB (borne de Chernoff)', 'augmenter α', 'ETC', 'supprimer le bonus'], 0, R`Des intervalles adaptés aux Bernoulli.`],
      ['tp3-avant', R`Dans main.py, <code>regret[t] = max(true_means) - true_means[arm_chosen]</code>. Ce regret est :`, [R`le regret espéré $\Delta_a$ du bras joué, sans le bruit du tirage`, 'le gain observé', 'la différence entre deux tirages', 'le regret du meilleur bras'], 0, R`Il utilise les vraies moyennes : la courbe moyenne est moins bruitée qu’avec les gains observés.`],
      ['tp3-avant', R`<code>winners = np.argwhere(indices == np.max(indices))</code> renvoie un tableau de forme (k, 1). <code>np.random.choice(winners[0])</code> :`, ['choisit toujours le premier gagnant', 'choisit au hasard parmi les k gagnants', 'lève une erreur', 'choisit le dernier gagnant'], 0, R`<code>winners[0]</code> est la première ligne, un seul indice. Corriger avec <code>np.flatnonzero</code>.`],
      ['tp3-bornes', R`Le regret de la stratégie à l’aveugle sur ces 4 bras croît :`, [R`linéairement, $0{,}055$ par tour`, R`en $\log n$`, R`en $\sqrt n$`, 'puis se stabilise'], 0, R`Chaque tour coûte en moyenne $\bar\Delta=0{,}055$, sans jamais apprendre : 109,8 à $n=2000$ en simulation.`],
      ['tp3-strategies', R`ETC avec m = 200 donne un regret de 44,2 sur 100 exécutions, presque sans variance. D’où vient ce chiffre ?`, [R`de l’exploration seule : $200\times(0{,}05+0{,}08+0{,}09)=44$`, 'des engagements sur un mauvais bras', 'de la borne de Lai-Robbins', 'd’un bug de départage'], 0, R`Avec 200 tirages par bras, le meilleur est toujours identifié ; tout le regret est payé pendant l’exploration.`],
      ['tp3-ucb-ts', R`Thompson (20) et ETC m = 50 (18 à 20) ont le même regret à n = 2000. Pourquoi préférer Thompson ?`, ['il n’a aucun paramètre à régler', 'il a un regret plus faible', 'il est déterministe', 'il n’explore jamais'], 0, R`Le bon $m$ d’ETC dépend des écarts $\Delta$, inconnus en pratique ; avec $m=10$ ETC monte à 43.`],
    ],
    gens: {
      'tp3-avant': [
        () => {
          const mus = [0.1, 0.05, 0.02, 0.01], n = pick([200, 500, 1000, 2000]);
          const w0 = pick([0.4, 0.5, 0.6, 0.7]), w2 = pick([0.05, 0.1]), w3 = pick([0.05, 0.1]);
          const N = [Math.round(w0 * n), 0, Math.round(w2 * n), Math.round(w3 * n)]; N[1] = n - N[0] - N[2] - N[3];
          const r = N.reduce((s, x, i) => s + x * (0.1 - mus[i]), 0);
          return { q: R`Bras de moyennes $(0{,}1 ; 0{,}05 ; 0{,}02 ; 0{,}01)$, $n=${n}$ tours. Une exécution a tiré les bras $(${N.join(' ; ')})$ fois. Regret (au sens de main.py) ? (2 décimales)`, a: r, tol: 0.01,
            expl: R`$\sum_a\Delta_aN_a=0\times${N[0]}+0{,}05\times${N[1]}+0{,}08\times${N[2]}+0{,}09\times${N[3]}=${f(r, 2)}$.` };
        },
        () => {
          const N = rnd(5, 60), S = rnd(0, Math.max(1, Math.floor(N / 5)));
          return { q: R`<code>draws[a] = ${N}</code>, <code>rewards[a] = ${S}</code>. Que vaut $\hat\mu_a$ ? (4 décimales)`, a: S / N, tol: 0.0001,
            expl: R`$\hat\mu_a=S_a/N_a=${S}/${N}=${f(S / N, 4)}$.` };
        },
      ],
      'tp3-bornes': [...(COURSE.gens['bd-lower'] || []), ...(COURSE.gens['bd-regret'] || []),
        () => {
          const sets = [[0.1, 0.05, 0.02, 0.01], [0.5, 0.4, 0.3], [0.9, 0.8, 0.5, 0.1], [0.3, 0.2, 0.2, 0.1, 0.05]];
          const mu = pick(sets), n = pick([1000, 2000, 5000]);
          const d = mu.reduce((s, m) => s + (Math.max(...mu) - m), 0) / mu.length;
          return { q: R`Stratégie à l’aveugle (bras uniforme) sur des Bernoulli de moyennes $(${mu.map(x => f(x, 2)).join(' ; ')})$. Regret espéré à $n=${n}$ ? (1 décimale)`, a: d * n, tol: 0.1,
            expl: R`$\bar\Delta=\frac1K\sum_a(\mu^*-\mu_a)=${f(d, 4)}$ par tour, donc $${f(d, 4)}\times${n}=${f(d * n, 1)}$.` };
        },
      ],
      'tp3-strategies': [
        () => {
          const m = pick([20, 50, 100, 150, 200, 300, 400]);
          return { q: R`ETC sur les bras $(0{,}1 ; 0{,}05 ; 0{,}02 ; 0{,}01)$, $m=${m}$ tirages par bras. Regret payé pendant la seule phase d’exploration ? (1 décimale)`, a: m * 0.22, tol: 0.1,
            expl: R`$m\sum_a\Delta_a=${m}\times(0+0{,}05+0{,}08+0{,}09)=${f(m * 0.22, 1)}$.` };
        },
        () => {
          const e = pick([0.05, 0.1, 0.2, 0.5, 0.8]), n = pick([1000, 2000, 5000]);
          return { q: R`ε-greedy, $\epsilon=${f(e, 2)}$, bras $(0{,}1 ; 0{,}05 ; 0{,}02 ; 0{,}01)$, le meilleur bras étant identifié. Regret accumulé sur $n=${n}$ tours par la seule exploration ? (1 décimale)`, a: e * 0.055 * n, tol: 0.1,
            expl: R`À chaque tour, avec probabilité $\epsilon$ on tire un bras uniforme, de regret moyen $\bar\Delta=0{,}055$ : $\epsilon\bar\Delta n=${f(e, 2)}\times0{,}055\times${n}=${f(e * 0.055 * n, 1)}$. Linéaire en $n$.` };
        },
      ],
      'tp3-ucb-ts': [...(COURSE.gens['bd-ucb'] || []), ...(COURSE.gens['bd-thompson'] || []),
        () => {
          const t = pick([100, 500, 1000, 2000]), N = rnd(5, 200), mu = pick([0, 0.02, 0.05, 0.1]), al = pick([0.5, 1, 1.5, 2]);
          const v = mu + Math.sqrt(al * Math.log(t) / (2 * N));
          return { q: R`UCB du TP, $\delta=1/t^\alpha$ : $t=${t}$, $\alpha=${f(al, 1)}$, $\hat\mu_k=${f(mu, 2)}$, $N_k=${N}$. Indice ? (3 décimales)`, a: v, tol: 0.001,
            expl: R`$\hat\mu_k+\sqrt{\frac{\alpha\ln t}{2N_k}}=${f(mu, 2)}+\sqrt{\frac{${f(al, 1)}\times${f(Math.log(t), 3)}}{${2 * N}}}=${f(v)}$.` };
        },
      ],
    },
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
        { id: 'tp4-0b', group: 'Avant la séance', title: '1.1 Agent aléatoire sur BookGrid, puis MazeGrid', hint: 'python gridworld.py -g MazeGrid.', sec: 'tp4-avant' },
        { id: 'tp4-1', group: 'RL1', title: '1.2 Value iteration (__init__, getValue, getPolicy, getQValue)', hint: 'Deux tableaux v_k et v_{k+1}.', sec: 'tp4-vi' },
        { id: 'tp4-1b', group: 'RL1', title: '1.2.3 Politique après 100 itérations sur 10 épisodes : commenter', hint: '-a value -i 100 -k 10.', sec: 'tp4-vi' },
        { id: 'tp4-2', group: 'RL1', title: '1.3 BridgeGrid : changer un seul paramètre', hint: 'Lequel rend la traversée sûre ?', sec: 'tp4-analyse' },
        { id: 'tp4-3', group: 'RL1', title: '1.4 DiscountGrid : rôle des paramètres, cas (a) à (d)', hint: 'Raisonner sur γ, bruit, living reward.', sec: 'tp4-analyse' },
        { id: 'tp4-4', group: 'RL1', title: '1.5 q-learning (update, getValue, getQValue, getPolicy)', hint: 'Toujours passer par getQValue.', sec: 'tp4-ql' },
        { id: 'tp4-4b', group: 'RL1', title: '1.5.2 Contrôle manuel (-a q -k 5 -m), bruit 0, chemin N,N,N,E,E,E,E quatre fois', hint: 'Comparer à la Fig. 7 de l’énoncé.', sec: 'tp4-ql' },
        { id: 'tp4-5', group: 'RL1', title: '1.6 ε-greedy dans getAction ; BridgeGrid avec ε et α', hint: 'util.flipCoin(p).', sec: 'tp4-ql' },
        { id: 'tp4-5b', group: 'RL1', title: '1.6.2-1.6.3 -k 100, puis ε = 0,1 et ε = 0,9 sans bruit', hint: 'Récompenses moyennes plus basses que les q-valeurs : pourquoi ?', sec: 'tp4-ql' },
        { id: 'tp4-6', group: 'RL1', title: '1.7 Crawler sans modifier le code', hint: 'Si ça casse : code trop spécifique à la grille.', sec: 'tp4-ql' },
        { id: 'tp4-7', group: 'RL2', title: '2.1 PacmanQAgent sur smallGrid (≥ 80 % de victoires)', hint: '-x 2000 -n 2010.', sec: 'tp4-pacman' },
        { id: 'tp4-7b', group: 'RL2', title: '2.1.2-2.1.5 Voir 10 parties, nombre de parties nécessaires, mediumGrid', hint: 'Énoncé : 1000 à 1400 parties sur smallGrid.', sec: 'tp4-pacman' },
        { id: 'tp4-8', group: 'RL2', title: '2.2 ApproximateQAgent (Identity puis SimpleExtractor)', hint: 'w ← w + α Δ f.', sec: 'tp4-pacman' },
        { id: 'tp4-8b', group: 'RL2', title: '2.2.4 SimpleExtractor sur mediumClassic (50 parties)', hint: 'Quelques minutes de calcul.', sec: 'tp4-pacman' },
        { id: 'tp4-9', group: 'RL2', title: '2.2.5 Ajouter une caractéristique (fantômes mangeables)', hint: 'featureExtractors.py.', sec: 'tp4-pacman' },
        { id: 'tp4-10', group: 'Rapport', title: 'Rapport : démarche, résultats, réponses aux questions d’analyse', hint: 'Voir la fiche « Rapport ».', sec: 'tp4-rapport' },
        { id: 'tp4-11', group: 'Option RL3', title: 'Deep q-learning (PacmanDQN ou keras-rl)', hint: 'Replay memory + réseau cible.', sec: 'tp4-rapport' },
        { id: 'tp4-12', group: 'Option', title: 'Pour aller plus loin : first-visit MC, SARSA, TD(0), Gymnasium', hint: 'API gymnasium : reset() et step() ont changé.', sec: 'tp4-rapport' },
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
<p>Le bruit (<code>--noise 0.2</code>) signifie : l’action voulue réussit 80 % du temps, sinon l’agent part de côté. C’est la fonction $T(s,a,s')$ du cours (${course('rl-mdp', 'fiche MDP')}). Les cases +1 et −1 sont « pré-terminales » : leur seule action (exit) mène à l’état terminal invisible.</p>
<h4>Ce que dit le code fourni (lu dans <code>gridworld.py</code> et <code>pacman.py</code>)</h4>
<ul><li><b>Le bruit en détail</b> : pour l’action « nord », <code>getTransitionStatesAndProbs</code> renvoie le nord avec probabilité $1-\text{bruit}$, et l’ouest et l’est avec $\text{bruit}/2$ chacun ; jamais le sud. Si la case visée est un mur, l’agent reste sur place, et les probabilités qui mènent à la même case s’additionnent.</li>
<li><b>Valeurs par défaut de gridworld.py</b> : $\gamma=0{,}9$ (<code>-d</code>), bruit 0,2 (<code>-n</code>), living reward 0 (<code>-r</code>), $\epsilon=0{,}3$ (<code>-e</code>), $\alpha=0{,}5$ (<code>-l</code>), <b>10</b> itérations de value iteration (<code>-i</code>) : sans <code>-i 100</code>, tu ne vois pas les valeurs de l’énoncé.</li>
<li><b>Mêmes lettres, sens différents</b> : dans <code>gridworld.py</code>, <code>-n</code> est le bruit et <code>-l</code> le taux d’apprentissage ; dans <code>pacman.py</code>, <code>-n</code> est le nombre de parties et <code>-l</code> la grille (layout). La commande de l’énoncé <code>gridworld.py ... -n 0 ...</code> met donc le bruit à 0.</li>
<li><b>Fichiers résiduels</b> : <code>analysis.py</code> est écrit en Python 2 (<code>print</code> sans parenthèses) et ne se lance pas sous Python 3 ; l’énoncé ne le demande pas et il ne fait pas partie du dépôt. Les <code>.pyc</code> et <code>util-old.py</code> sont aussi des restes.</li>
<li><b>Python 3.14</b> : le squelette fourni se lance (testé en mode texte : <code>python gridworld.py -t -k 1</code> fait un épisode de l’agent aléatoire ; avec <code>-a value</code>, il affiche « Method not implemented », normal avant ton code). Tkinter 8.6 est présent pour l’interface graphique.</li></ul>
<p>Avant d’implémenter quoi que ce soit, lance aussi l’agent aléatoire par défaut (<code>python gridworld.py -g BookGrid</code>) et une autre grille (<code>-g MazeGrid</code>), comme au point 1.1 de l’énoncé.</p>`,
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
<p><b>Contrôle</b> : avec <code>-i 0</code> toutes les valeurs valent 0 ; avec <code>-i 1</code> (et living reward nul), seules les deux cases de sortie +1 et −1 ont une valeur non nulle, puisque la récompense n’est reçue qu’à l’action exit ; avec <code>-i 2</code>, leurs voisines s’y ajoutent ; les valeurs se « propagent » d’une case par itération depuis les sorties (la rétropropagation de Bellman).</p>`,
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
      ['tp4-avant', 'options', R`Que signifient <code>-n</code> et <code>-l</code> dans <code>gridworld.py</code>, et dans <code>pacman.py</code> ?`, R`gridworld.py : bruit et taux d’apprentissage. pacman.py : nombre de parties et grille (layout).`],
      ['tp4-avant', 'defauts', R`Valeurs par défaut de gridworld.py à connaître ?`, R`$\gamma=0{,}9$, bruit 0,2, living reward 0, $\epsilon=0{,}3$, $\alpha=0{,}5$, et seulement 10 itérations de value iteration.`],
      ['tp4-analyse', 'recompense-depart', R`Dans gridworld.py, quand la récompense +1 ou +10 est-elle reçue ?`, R`En quittant la case de sortie par l’action exit : la récompense dépend de l’état quitté (docstring de <code>getReward</code>).`],
      ['tp4-analyse', 'actualise', R`Valeur actualisée d’une récompense $R$ obtenue après $k$ pas ?`, R`$\gamma^kR$ : avec $\gamma=0{,}9$ et $k=10$, $0{,}9^{10}\approx0{,}35$ fois $R$. Les living rewards s’ajoutent, chacun actualisé à son pas.`],
      ['tp4-pacman', 'simple-features', R`Caractéristiques de SimpleExtractor (lues dans featureExtractors.py) ?`, R`bias, nombre de fantômes à un pas, mange une pastille, distance à la pastille la plus proche divisée par la taille de la grille ; le tout divisé par 10.`],
      ['tp4-rapport', 'cible', R`Rôle du réseau cible (target network) dans un DQN ?`, R`Calculer la cible $r+\gamma\max_{a'}q(s',a')$ avec des poids figés, recopiés périodiquement, pour que la cible ne bouge pas à chaque mise à jour.`],
      ['tp4-rapport', 'depot', R`Que déposer pour RL1 et RL2, et pour RL3 ?`, R`RL1-RL2 : valueIterationAgents.py, qlearningAgents.py et un rapport (deux personnes au plus). RL3 : tous les fichiers du deep q-learning et un rapport sur les choix explorés.`],
    ],
    quiz: [
      ['tp4-vi', R`Après 1 itération de value iteration depuis v₀ = 0 sur BookGrid, quelles cases ont une valeur non nulle ?`, ['seulement les cases de sortie (+1 et −1), via l’action exit', 'toutes les cases', 'aucune', 'seulement la case de départ'], 0, R`Les valeurs se propagent d’un pas par itération depuis les récompenses.`],
      ['tp4-analyse', R`Un living reward très négatif pousse l’agent à :`, ['finir vite, quitte à prendre des risques', 'ne jamais finir', 'éviter toutes les sorties', 'ignorer le bruit'], 0, R`Chaque pas coûte : le chemin court devient préférable.`],
      ['tp4-analyse', R`Sans bruit (noise = 0), longer une rangée de cases −10 :`, ['ne présente aucun risque', 'est toujours fatal', 'dépend de γ uniquement', 'est interdit'], 0, R`L’action réussit toujours : on ne glisse jamais.`],
      ['tp4-ql', R`Dans getAction avec ε-greedy, l’action « aléatoire » doit être tirée parmi :`, ['toutes les actions légales, meilleure comprise', 'les actions sous-optimales uniquement', 'les actions déjà vues', 'les actions de valeur positive'], 0, R`C’est la définition d’ε-greedy du cours.`],
      ['tp4-pacman', R`Avec IdentityExtractor, l’agent approché doit :`, ['se comporter exactement comme PacmanQAgent', 'gagner plus souvent', 'apprendre plus vite', 'ne pas apprendre'], 0, R`Une caractéristique indicatrice par paire = une table.`],
      ['tp4-avant', R`GridWorld, bruit 0,2, action « nord », aucun mur autour. Probabilité d’aller au sud ?`, ['0', '0,1', '0,2', '0,05'], 0, R`<code>getTransitionStatesAndProbs</code> donne nord 0,8, ouest 0,1, est 0,1 : jamais la direction opposée.`],
      ['tp4-avant', R`<code>python gridworld.py -a value -k 10</code> sans option <code>-i</code> calcule :`, ['10 itérations de value iteration (valeur par défaut)', '100 itérations', 'les valeurs jusqu’à convergence', 'aucune itération'], 0, R`Le défaut de <code>-i</code> est 10 : l’énoncé ajoute <code>-i 100</code>.`],
      ['tp4-vi', R`Dans gridworld.py, de quoi dépend la récompense <code>getReward(s, a, s')</code> ?`, ['seulement de l’état quitté $s$ : la valeur de la case de sortie, sinon le living reward', 'seulement de l’état d’arrivée $s\'$', 'de l’action seulement', 'du nombre d’itérations'], 0, R`Le code le dit dans sa docstring (convention du livre de Russell et Norvig) : c’est pourquoi la valeur apparaît d’abord sur les cases +1 et −1 elles-mêmes.`],
      ['tp4-ql', R`Avec <code>-a q -k 100</code>, la récompense moyenne affichée est plus basse que les q-valeurs apprises. Pourquoi ?`, ['les actions aléatoires (ε) et la phase d’apprentissage initiale abaissent les retours observés', 'le code est faux', 'γ vaut 1', 'les q-valeurs sont sous-estimées'], 0, R`C’est ce que l’énoncé annonce au point 1.6.2 : la politique suivie n’est pas la politique gloutonne.`],
      ['tp4-pacman', R`Pendant l’entraînement de PacmanQAgent, les scores restent parfois mauvais même après avoir appris une bonne politique. Pourquoi ?`, ['ε > 0 : des actions aléatoires peuvent l’envoyer sur un fantôme', 'α est trop petit', 'la grille change', 'les poids divergent'], 0, R`En test, <code>alpha</code> et <code>epsilon</code> sont mis à 0 (learningAgents.py) : plus d’exploration.`],
      ['tp4-rapport', R`Dans un DQN, à quoi sert la mémoire de rejeu (replay memory) ?`, ['casser la corrélation entre transitions successives en tirant des mini-lots au hasard', 'stocker les poids du réseau cible', 'mémoriser la meilleure partie', 'remplacer γ'], 0, R`Des transitions consécutives se ressemblent ; les tirer au hasard parmi $N$ tuples $(s,a,r,s')$ stabilise la descente de gradient.`],
      ['tp4-rapport', R`Pour le rapport de RL1 et RL2, une question d’analyse jugée « impossible » :`, ['se justifie par le raisonnement, c’est une réponse acceptable', 'doit être omise', 'doit recevoir des paramètres au hasard', 'invalide le TP'], 0, R`L’énoncé demande les réglages « si c’est possible » : expliquer pourquoi ils n’existent pas fait partie de la réponse.`],
    ],
    gens: {
      'tp4-avant': [
        () => {
          const p = pick([0.1, 0.2, 0.3, 0.5, 0.7]);
          const cas = pick([
            { t: 'aucun mur autour', v: 0, e: 'aucune direction n’est bloquée' },
            { t: 'un mur à l’ouest', v: p / 2, e: 'la déviation vers l’ouest ($\\text{bruit}/2$) laisse l’agent sur place' },
            { t: 'un mur au nord', v: 1 - p, e: 'l’action voulue ($1-\\text{bruit}$) bute sur le mur' },
            { t: 'des murs à l’ouest et à l’est', v: p, e: 'les deux déviations ($\\text{bruit}/2$ chacune) butent sur un mur' },
            { t: 'des murs au nord et à l’ouest', v: 1 - p / 2, e: 'l’action voulue et la déviation ouest butent sur un mur' },
          ]);
          return { q: R`GridWorld, bruit $${f(p, 1)}$, action « nord », ${cas.t}. Probabilité que l’agent reste sur place ? (2 décimales)`, a: cas.v, tol: 0.001,
            expl: R`Nord avec $1-\text{bruit}=${f(1 - p, 2)}$, ouest et est avec $\text{bruit}/2=${f(p / 2, 2)}$ chacun, jamais sud ; ici ${cas.e} : $${f(cas.v, 2)}$.` };
        },
      ],
      'tp4-vi': [...(COURSE.gens['rl-vi'] || [])],
      'tp4-analyse': [...(COURSE.gens['rl-return'] || [])],
      'tp4-ql': [...(COURSE.gens['rl-q'] || []), ...(COURSE.gens['rl-explore'] || [])],
      'tp4-pacman': [...(COURSE.gens['rl-approx'] || [])],
      'tp4-rapport': [...(COURSE.gens['rl-td'] || [])],
    },
  });
})();
