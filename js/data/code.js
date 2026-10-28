// Code commenté des algorithmes du cours : à la fin de chaque fiche d'algorithme, un script court qui le met en œuvre pas à pas,
// avec ce qu'il affiche (vérifié en l'exécutant) et l'explication de chaque fonction appelée. Chargé après les chapitres.
// Value iteration et q-learning restent en pseudo-code : ils sont à programmer dans le TP4, qui est évalué.
(function () {
  const R = String.raw;
  const { walk, fns } = COURSE.u;
  const course = (id, label) => `<a class="link" href="#course/${id}">${label}</a>`;
  const add = (sec, html) => { const s = COURSE.sections[sec]; if (s) s.fiche += `\n<h4 class="code-h">En code</h4>\n` + html; };

  // =====================================================================
  // Théorie statistique de l'apprentissage
  // =====================================================================
  add('slt-lln', walk({
    id: 'c-slt-lln', title: 'La fréquence ν se rapproche de μ… mais à quelle vitesse ?',
    intro: R`<p>Une urne contient une proportion $\mu=0{,}4$ de billes rouges. On tire $n$ billes et on calcule la fréquence $\nu$. La loi des grands nombres dit que $\nu\to\mu$ ; la simulation montre aussi à quelle vitesse l’écart diminue.</p>`,
    steps: [
      ['Tirer des billes et suivre la fréquence', R`
import numpy as np
rng = np.random.default_rng(0)
mu = 0.4
billes = rng.random(10000) < mu                  # True = bille rouge
nu = np.cumsum(billes) / np.arange(1, 10001)     # fréquence après 1, 2, ..., 10 000 tirages
for n in [10, 100, 1000, 10000]:
    print(f"n = {n:5d} : nu = {nu[n - 1]:.4f}, écart {abs(nu[n - 1] - mu):.4f}")
`, fns([
        ['rng.random(10000) < mu', R`10 000 nombres uniformes sur $[0,1)$ ; chacun est inférieur à $\mu$ avec probabilité $\mu$ : True avec probabilité 0,4, c’est un tirage de bille.`],
        ['np.cumsum(billes) / np.arange(1, 10001)', R`le nombre de rouges parmi les $n$ premières (somme cumulée, True compte 1), divisé par $n$ : la fréquence $\nu$ pour tous les $n$ d’un coup.`],
      ]), `
n =    10 : nu = 0.3000, écart 0.1000
n =   100 : nu = 0.3400, écart 0.0600
n =  1000 : nu = 0.3730, écart 0.0270
n = 10000 : nu = 0.3996, écart 0.0004
`],
      ['Répéter l’expérience pour voir la dispersion', R`
for n in [10, 100, 1000]:
    nus = (rng.random((5000, n)) < mu).mean(axis=1)    # 5000 urnes, n billes chacune
    print(f"n = {n:4d} : écart type de nu {nus.std():.4f}, théorie sqrt(mu(1-mu)/n) = {np.sqrt(mu * (1 - mu) / n):.4f}, "
          f"P(|nu - mu| > 0,05) = {np.mean(np.abs(nus - mu) > 0.05):.3f}")
`, fns([
        ['rng.random((5000, n)) < mu', R`une matrice : 5000 expériences indépendantes de $n$ tirages.`],
        ['.mean(axis=1)', R`la fréquence de chaque expérience (moyenne de chaque ligne).`],
      ]) + R`<p><b>Lecture</b> : l’écart type de $\nu$ est divisé par $\sqrt{10}$ quand $n$ est multiplié par 10 : la vitesse $1/\sqrt n$. La probabilité d’un écart de plus de 0,05 chute vite, c’est ce que l’inégalité de Hoeffding garantit sans connaître $\mu$ (${course('slt-hoeffding', 'fiche suivante')} ; simulation complète dans le ${course('tp1-p1', 'TP1')}).</p>`, `
n =   10 : écart type de nu 0.1547, théorie sqrt(mu(1-mu)/n) = 0.1549, P(|nu - mu| > 0,05) = 0.742
n =  100 : écart type de nu 0.0492, théorie sqrt(mu(1-mu)/n) = 0.0490, P(|nu - mu| > 0,05) = 0.312
n = 1000 : écart type de nu 0.0155, théorie sqrt(mu(1-mu)/n) = 0.0155, P(|nu - mu| > 0,05) = 0.001
`],
    ],
  }));

  add('slt-risk', walk({
    id: 'c-slt-erm', title: 'La minimisation du risque empirique sur des seuils',
    intro: R`<p>Données 1D : $X$ uniforme sur $[0,1]$, la vraie règle est $h(x)=\mathbb 1[x>0{,}3]$, mais 10 % des étiquettes sont inversées (bruit). La classe $\mathcal H$ contient 101 classifieurs à seuil $g_t(x)=\mathbb 1[x>t]$, $t=0;\ 0{,}01;\ \dots;\ 1$. On calcule $R_n(g_t)$ pour chacun, on garde le minimum (ERM) et on compare à son vrai risque, connu ici : $R(g_t)=0{,}1+0{,}8\,|t-0{,}3|$.</p>`,
    steps: [
      ['Un échantillon S_n', R`
import numpy as np
rng = np.random.default_rng(1)
n = 50
x = rng.random(n)
y = (x > 0.3).astype(int)
bruit = rng.random(n) < 0.1
y[bruit] = 1 - y[bruit]                          # 10 % d'étiquettes inversées
print(y[:10], bruit.sum(), "étiquettes inversées")
`, fns([
        ['(x > 0.3).astype(int)', R`l’étiquette de la vraie règle, 0 ou 1.`],
        ['y[bruit] = 1 - y[bruit]', R`inverse l’étiquette des points tirés pour être bruités (indexation par masque).`],
      ]), `
[1 1 0 1 1 0 1 1 1 0] 5 étiquettes inversées
`],
      ['Le risque empirique d’un classifieur', R`
def Rn(t, x, y):
    return np.mean((x > t).astype(int) != y)      # fraction d'erreurs de g_t sur l'échantillon

print(Rn(0.3, x, y), Rn(0.5, x, y))
`, fns([
        ['np.mean(prédictions != y)', R`$R_n(g)=\frac1n\sum_i\mathbb 1[g(x_i)\ne y_i]$ : la perte 0-1 moyenne.`],
      ]) + R`<p>Même le seuil parfait $t=0{,}3$ a un risque empirique non nul : il ne peut rien contre le bruit.</p>`, `
0.1 0.24
`],
      ['ERM : essayer tous les seuils, garder le meilleur', R`
ts = np.linspace(0, 1, 101)
risques = np.array([Rn(t, x, y) for t in ts])
t_hat = ts[np.argmin(risques)]
R = lambda t: 0.1 + 0.8 * abs(t - 0.3)          # vrai risque, calculable ici car on connaît P
print(f"seuil choisi {t_hat:.2f} : R_n = {risques.min():.3f}, vrai risque R = {R(t_hat):.3f} (meilleur possible : 0,100)")
`, fns([
        ['np.argmin(risques)', R`la position du plus petit risque empirique : l’ERM, $\hat g=\arg\min_{g\in\mathcal H}R_n(g)$ (le premier en cas d’égalité).`],
        ['R(t_hat)', R`ce qu’on paie vraiment sur de nouvelles données. $R_n(\hat g)$ est optimiste : $\hat g$ a été choisi précisément parce qu’il colle à cet échantillon.`],
      ]), `
seuil choisi 0.29 : R_n = 0.100, vrai risque R = 0.108 (meilleur possible : 0,100)
`],
      ['Répéter pour plusieurs tailles d’échantillon', R`
for n in [20, 200, 2000]:
    ecarts = []
    for _ in range(200):
        x = rng.random(n); y = (x > 0.3).astype(int)
        b = rng.random(n) < 0.1; y[b] = 1 - y[b]
        r = np.array([Rn(t, x, y) for t in ts])
        ecarts.append(R(ts[np.argmin(r)]) - 0.1)
    print(f"n = {n:4d} : excès de risque moyen R(g_hat) - R* = {np.mean(ecarts):.4f}")
`, R`<p>L’<b>excès de risque</b> $R(\hat g)-\min_{g}R(g)$ (l’erreur d’estimation du ${course('slt-decomp', 'cours')}) diminue quand $n$ grandit : l’ERM se rapproche du meilleur classifieur de $\mathcal H$.</p>`, `
n =   20 : excès de risque moyen R(g_hat) - R* = 0.0453
n =  200 : excès de risque moyen R(g_hat) - R* = 0.0025
n = 2000 : excès de risque moyen R(g_hat) - R* = 0.0000
`],
    ],
  }));

  add('slt-bayes', walk({
    id: 'c-slt-bayes', title: 'Le classifieur de Bayes sur deux gaussiennes',
    intro: R`<p>$\mathbb P(Y=1)=\frac12$, $X\mid Y=0\sim\mathcal N(0,1)$, $X\mid Y=1\sim\mathcal N(2,1)$. On connaît la loi : on peut calculer $\eta(x)=\mathbb P(Y=1\mid X=x)$, donc le classifieur de Bayes et son risque.</p>`,
    steps: [
      ['η(x) par la formule de Bayes', R`
import numpy as np
from scipy.stats import norm

def eta(x):
    p1 = 0.5 * norm.pdf(x, loc=2)                 # P(Y=1) * densité de X sachant Y=1
    p0 = 0.5 * norm.pdf(x, loc=0)
    return p1 / (p0 + p1)

for x in [-1, 0.5, 1, 1.5, 3]:
    print(f"eta({x}) = {eta(x):.3f}")
`, fns([
        ['norm.pdf(x, loc=2)', R`la densité de la loi normale de moyenne 2 et d’écart type 1 au point $x$ (module <code>scipy.stats</code>).`],
        ['p1 / (p0 + p1)', R`la formule de Bayes : $\eta(x)=\frac{\mathbb P(Y=1)f_1(x)}{\mathbb P(Y=0)f_0(x)+\mathbb P(Y=1)f_1(x)}$.`],
      ]) + R`<p>$\eta(1)=0{,}5$ : par symétrie, le seuil de Bayes est au milieu des deux moyennes, $g^*(x)=\mathbb 1[x>1]$.</p>`, `
eta(-1) = 0.018
eta(0.5) = 0.269
eta(1) = 0.500
eta(1.5) = 0.731
eta(3) = 0.982
`],
      ['Le risque de Bayes, de trois façons', R`
print("formule  : R* = Phi(-1) =", round(norm.cdf(-1), 4))
rng = np.random.default_rng(0)
Y = rng.random(10**6) < 0.5
X = rng.normal(loc=2 * Y, scale=1)               # moyenne 2 si Y = 1, 0 sinon
print("E[min(eta, 1 - eta)] :", round(np.mean(np.minimum(eta(X), 1 - eta(X))), 4))
print("erreur de 1[x > 1]   :", round(np.mean((X > 1) != Y), 4))
print("erreur de 1[x > 0,5] :", round(np.mean((X > 0.5) != Y), 4))
`, fns([
        ['norm.cdf(-1)', R`$\Phi(-1)=\mathbb P(\mathcal N(0,1)<-1)$ : un point de la classe 0 dépasse 1 avec cette probabilité, et symétriquement pour la classe 1.`],
        ['rng.normal(loc=2 * Y, scale=1)', R`un tirage par point, de moyenne 2 si $Y=1$ et 0 sinon (<code>2 * Y</code> transforme True/False en 2/0).`],
        ['np.minimum(eta(X), 1 - eta(X))', R`l’erreur de $g^*$ au point $x$ : la probabilité de la classe qu’il ne choisit pas. Sa moyenne est $R(g^*)$.`],
      ]) + R`<p>Les trois valeurs coïncident ; tout autre seuil (0,5 ici) fait pire. Aucun classifieur ne descend sous $R^*\approx0{,}159$ : c’est le bruit intrinsèque du problème.</p>`, `
formule  : R* = Phi(-1) = 0.1587
E[min(eta, 1 - eta)] : 0.1586
erreur de 1[x > 1]   : 0.1574
erreur de 1[x > 0,5] : 0.1868
`],
    ],
  }));

  add('slt-growth', walk({
    id: 'c-slt-growth', title: 'Compter les dichotomies des droites du plan',
    intro: R`<p>On vérifie par la force brute que les classifieurs linéaires du plan réalisent les $2^3=8$ étiquetages de 3 points, mais seulement 14 des 16 étiquetages de 4 points. Pour chaque étiquetage, on teste s’il existe $(w,b)$ avec $y_i(\langle w,x_i\rangle+b)\ge1$ pour tout $i$ : un petit programme linéaire.</p>`,
    steps: [
      ['Tester si un étiquetage est réalisable par une droite', R`
import itertools
import numpy as np
from scipy.optimize import linprog

def separable(X, y):
    # inconnues (w1, w2, b) ; contraintes -y_i (w . x_i + b) <= -1
    A = -y[:, None] * np.c_[X, np.ones(len(X))]
    res = linprog(c=np.zeros(3), A_ub=A, b_ub=-np.ones(len(X)), bounds=[(None, None)] * 3)
    return res.status == 0                         # 0 = une solution existe
`, fns([
        ['np.c_[X, np.ones(len(X))]', R`ajoute une colonne de 1 : la ligne $i$ devient $(x_{i1},x_{i2},1)$, et son produit avec $(w_1,w_2,b)$ vaut $\langle w,x_i\rangle+b$.`],
        ['-y[:, None] * …', R`multiplie chaque ligne par $-y_i$ : la contrainte $y_i(\langle w,x_i\rangle+b)\ge1$ s’écrit $-y_i(\dots)\le-1$, la forme qu’attend <code>linprog</code>.`],
        ['linprog(c=np.zeros(3), A_ub=…, b_ub=…, bounds=…)', R`résout un programme linéaire ; avec un objectif nul, on demande seulement s’il existe un point qui respecte toutes les contraintes. <code>bounds=[(None, None)] * 3</code> autorise des valeurs négatives (par défaut, <code>linprog</code> impose $\ge0$).`],
      ])],
      ['Compter, pour plusieurs configurations de points', R`
def dichotomies(X):
    return sum(separable(X, np.array(lab)) for lab in itertools.product([-1, 1], repeat=len(X)))

configs = {"3 points en triangle": [[0, 0], [1, 0], [0, 1]],
           "3 points alignés": [[0, 0], [1, 0], [2, 0]],
           "4 points en carré": [[0, 0], [1, 0], [0, 1], [1, 1]],
           "4 points, un au milieu d'un triangle": [[0, 0], [4, 0], [0, 4], [1, 1]]}
for nom, X in configs.items():
    print(f"{nom:38s} {dichotomies(np.array(X, dtype=float))} dichotomies sur {2 ** len(X)}")
`, fns([
        ['itertools.product([-1, 1], repeat=n)', R`tous les $n$-uplets de ±1 : les $2^n$ étiquetages possibles.`],
        ['sum(separable(…) for lab in …)', R`compte les étiquetages réalisables (True vaut 1).`],
      ]) + R`<p><b>Lecture</b> : 3 points en triangle sont <b>pulvérisés</b> (8 sur 8) ; alignés, non (le milieu ne peut pas être seul de son côté). Aucune configuration de 4 points ne l’est : le carré bloque les deux étiquetages XOR, d’où $m_{\mathcal H}(4)=14$ et $d_{VC}=3$ (${course('slt-shatter', 'fiche suivante')}). Le SVM linéaire du ${course('tp0-classif', 'TP0')} échoue sur le XOR pour cette raison.</p>`, `
3 points en triangle                   8 dichotomies sur 8
3 points alignés                       6 dichotomies sur 8
4 points en carré                      14 dichotomies sur 16
4 points, un au milieu d'un triangle   14 dichotomies sur 16
`],
    ],
  }));

  // =====================================================================
  // Apprentissage actif
  // =====================================================================
  add('al-1d', walk({
    id: 'c-al-1d', title: 'Trouver un seuil par dichotomie : log₂ au lieu de 1/ε',
    intro: R`<p>Un réservoir de 1000 points sur $[0,1]$, étiquetés par un seuil inconnu $w^*=0{,}537$ (sans bruit). Le passif paie des étiquettes au hasard ; l’actif demande toujours le point du milieu de la zone encore incertaine.</p>`,
    steps: [
      ['Le réservoir et l’oracle', R`
import numpy as np
rng = np.random.default_rng(0)
pool = np.sort(rng.random(1000))
w_star = 0.537
oracle = lambda i: int(pool[i] > w_star)          # l'étiquette coûte une question
`, fns([
        ['np.sort(rng.random(1000))', R`1000 points triés : les étiquettes valent 0 puis 1, avec un seul changement.`],
        ['oracle', R`la fonction qu’on « paie » à chaque appel : elle révèle l’étiquette d’un point.`],
      ])],
      ['Actif : la dichotomie', R`
lo, hi, questions = 0, len(pool) - 1, 0
while hi - lo > 1:
    mid = (lo + hi) // 2
    questions += 1
    if oracle(mid) == 1:
        hi = mid                                  # le seuil est à gauche de mid
    else:
        lo = mid
print(f"{questions} questions ; seuil situé entre {pool[lo]:.4f} et {pool[hi]:.4f}")
`, fns([
        ['(lo + hi) // 2', R`le milieu, en division entière.`],
        ['hi = mid / lo = mid', R`chaque réponse élimine la moitié des points restants. Après $k$ questions, il en reste environ $1000/2^k$.`],
      ]) + R`<p>10 questions situent le seuil entre deux points consécutifs : aucune étiquette des 1000 points n’est plus incertaine. C’est $\log_2(1000)\approx10$.</p>`, `
10 questions ; seuil situé entre 0.5359 et 0.5389
`],
      ['Passif : 10 questions au hasard', R`
for budget in [10, 100]:
    largeurs = []
    for _ in range(1000):
        idx = rng.choice(len(pool), budget, replace=False)
        lab = np.array([oracle(i) for i in idx])
        gauche = pool[idx][lab == 0].max(initial=0.0)   # plus grand point étiqueté 0
        droite = pool[idx][lab == 1].min(initial=1.0)   # plus petit point étiqueté 1
        largeurs.append(droite - gauche)
    print(f"passif, {budget} étiquettes : zone incertaine de largeur moyenne {np.mean(largeurs):.3f}")
`, fns([
        ['.max(initial=0.0)', R`le maximum, avec 0 comme valeur si aucun point n’est étiqueté 0 (sinon <code>max</code> d’un tableau vide plante).`],
        ['droite - gauche', R`la zone où le seuil peut encore être : tout point qui y tombe a une étiquette inconnue.`],
      ]) + R`<p>Avec 10 étiquettes au hasard, la zone incertaine fait environ $2/(n+1)$ ; il en faut de l’ordre de $1/\epsilon$ pour une précision $\epsilon$, contre $\log_2(1/\epsilon)$ en actif : le gain exponentiel du cours.</p>`, `
passif, 10 étiquettes : zone incertaine de largeur moyenne 0.173
passif, 100 étiquettes : zone incertaine de largeur moyenne 0.023
`],
    ],
  }));

  add('al-uncert', R`<p>Les trois critères (moins confiant, marge, entropie) et la boucle complète d’apprentissage actif sont écrits et commentés ligne par ligne dans le ${course('tp2-avant', 'TP2, fiche « Ce qu’il faut savoir »')}, puis appliqués à un kNN (${course('tp2-binaire', 'partie 1')}), un SVC (${course('tp2-3classes', 'partie 2')}) et une forêt sur MNIST (${course('tp2-mnist', 'partie 3')}).</p>`);
  add('al-incons', R`<p>La myopie de l’échantillonnage par incertitude est reproduite en code, avec les données 1D de la figure du cours, dans le ${course('tp2-mnist', 'TP2, partie 4')} : on y voit l’incertitude rester bloquée au mauvais seuil dans une répétition sur deux.</p>`);

  add('al-qbc', walk({
    id: 'c-al-qbc', title: 'Query-By-Committee : entropie de vote et divergence KL',
    intro: R`<p>Un comité de 5 régressions logistiques, chacune entraînée sur un rééchantillonnage des points étiquetés. On demande le point du réservoir sur lequel le comité est le plus en désaccord.</p>`,
    steps: [
      ['Données, points étiquetés, comité', R`
import numpy as np
from sklearn.datasets import make_classification
from sklearn.linear_model import LogisticRegression

X, y = make_classification(n_samples=300, n_features=2, n_redundant=0, n_clusters_per_class=1, random_state=3)
rng = np.random.default_rng(0)
lab = list(rng.choice(np.where(y == 0)[0], 5, replace=False)) + list(rng.choice(np.where(y == 1)[0], 5, replace=False))
pool = np.setdiff1d(np.arange(len(X)), lab)

comite = []
for _ in range(5):
    b = rng.choice(lab, len(lab), replace=True)
    while len(set(y[b])) < 2:                     # chaque membre doit voir les deux classes
        b = rng.choice(lab, len(lab), replace=True)
    comite.append(LogisticRegression().fit(X[b], y[b]))
`, fns([
        ['rng.choice(lab, len(lab), replace=True)', R`un échantillon <b>bootstrap</b> : autant de points que d’étiquetés, tirés avec remise. Des membres entraînés sur des données un peu différentes approchent des hypothèses différentes du <i>version space</i>.`],
        ['comite.append(LogisticRegression().fit(…))', R`chaque membre est un modèle entraîné, gardé dans une liste.`],
      ])],
      ['Entropie de vote', R`
votes = np.array([m.predict(X[pool]) for m in comite])     # (5 membres, nombre de points)
p1 = votes.mean(axis=0)                                    # fraction des membres qui votent 1
VE = -(p1 * np.log(p1 + 1e-12) + (1 - p1) * np.log(1 - p1 + 1e-12))
print("points où le comité est partagé :", np.sum((p1 > 0) & (p1 < 1)), "sur", len(pool))
print("demande le point", pool[np.argmax(VE)], "votes", votes[:, np.argmax(VE)])
`, fns([
        ['votes.mean(axis=0)', R`pour chaque point, la part $V(1)/C$ des $C=5$ membres qui votent 1.`],
        ['VE', R`l’entropie de vote $-\sum_y\frac{V(y)}C\ln\frac{V(y)}C$ : nulle si tous les membres sont d’accord, maximale quand le vote est le plus partagé (2 contre 3 avec 5 membres).`],
      ]) + R`<p>Seuls les points de la <b>région de désaccord</b> ont une entropie non nulle : partout ailleurs, interroger l’oracle n’apprendrait rien au comité.</p>`, `
points où le comité est partagé : 100 sur 290
demande le point 7 votes [1 1 0 0 1]
`],
      ['Divergence KL moyenne au consensus', R`
P = np.array([m.predict_proba(X[pool]) for m in comite])   # (5, points, 2 classes)
cons = P.mean(axis=0)                                      # le consensus
KL = np.mean(np.sum(P * np.log((P + 1e-12) / (cons + 1e-12)), axis=2), axis=0)
print("KL : demande le point", pool[np.argmax(KL)], "; même choix que l'entropie de vote :", pool[np.argmax(KL)] == pool[np.argmax(VE)])
`, fns([
        ['P.mean(axis=0)', R`la loi moyenne du comité, $P_C(y\mid x)$.`],
        ['np.sum(P * np.log(P / cons), axis=2)', R`pour chaque membre et chaque point, $D(P_\theta\,\|\,P_C)=\sum_yP_\theta(y\mid x)\ln\frac{P_\theta(y\mid x)}{P_C(y\mid x)}$ ; on fait ensuite la moyenne sur les membres.`],
      ]) + R`<p>La KL utilise les probabilités, pas seulement les votes : elle distingue un désaccord net d’un désaccord timide, et peut choisir un autre point.</p>`, `
KL : demande le point 29 ; même choix que l'entropie de vote : False
`],
    ],
  }));

  add('al-dens', walk({
    id: 'c-al-dens', title: 'Pondérer l’incertitude par la densité',
    intro: R`<p>Deux paquets de points et un point isolé, placé exprès sur la frontière du modèle, loin de tout. Le critère d’incertitude seul le demande en premier ; multiplié par la similarité moyenne avec le réservoir (puissance $\beta$), il passe derrière les points représentatifs.</p>`,
    steps: [
      ['Données, modèle, incertitude', R`
import numpy as np
from sklearn.datasets import make_blobs
from sklearn.linear_model import LogisticRegression

X, y = make_blobs(n_samples=200, centers=[[-2, 0], [2, 0]], cluster_std=1.0, random_state=0)
lab = [0, 1, 2, 3, 4, 5]
clf = LogisticRegression().fit(X[lab], y[lab])
w, b = clf.coef_[0], clf.intercept_[0]
u = np.array([-w[1], w[0]]) / np.linalg.norm(w)   # direction de la frontière
x0 = -b * w / (w @ w) + 6 * u                     # un point de la frontière, à 6 unités du reste
X = np.vstack([X, x0])                            # le point isolé, en position 200
pool = np.setdiff1d(np.arange(len(X)), lab)
P = clf.predict_proba(X[pool])
incert = -np.sum(P * np.log(P + 1e-12), axis=1)   # entropie
print("rang du point isolé selon l'incertitude seule :", 1 + np.where(pool[np.argsort(-incert)] == 200)[0][0])
`, fns([
        ['make_blobs(centers=…, cluster_std=1.0)', R`des paquets gaussiens autour des centres donnés.`],
        ['clf.coef_[0], clf.intercept_[0]', R`$w$ et $b$ de la frontière $\langle w,x\rangle+b=0$, là où le modèle hésite à 50/50.`],
        ['-b * w / (w @ w) + 6 * u', R`le point de la frontière le plus proche de l’origine, puis 6 unités le long de la frontière (<code>u</code> est perpendiculaire à $w$) : sur la frontière, loin des deux paquets.`],
        ['np.vstack([X, x0])', R`ajoute ce point en dernière ligne, à la position 200.`],
        ['np.argsort(-incert)', R`l’ordre de demande, du plus incertain au moins incertain ; on cherche où tombe le point 200.`],
      ]), `
rang du point isolé selon l'incertitude seule : 1
`],
      ['La densité : similarité moyenne avec le réservoir', R`
d2 = ((X[pool][:, None, :] - X[pool][None, :, :]) ** 2).sum(axis=2)    # distances au carré, deux à deux
sim = np.exp(-d2 / 2)                                                  # similarité gaussienne
densite = sim.mean(axis=1)
for beta in [0, 1, 2]:
    score = incert * densite ** beta
    print(f"beta = {beta} : rang du point isolé {1 + np.where(pool[np.argsort(-score)] == 200)[0][0]}")
`, fns([
        ['X[pool][:, None, :] - X[pool][None, :, :]', R`la diffusion de numpy fabrique toutes les différences $x_i-x_j$ d’un coup : un tableau (points, points, 2).`],
        ['np.exp(-d2 / 2)', R`une similarité qui vaut 1 pour deux points confondus et tend vers 0 quand ils s’éloignent.`],
        ['incert * densite ** beta', R`le score « information × densité » du cours : $\beta=0$ redonne l’incertitude seule, un $\beta$ plus grand favorise les zones denses.`],
      ]) + R`<p>Le point isolé est très incertain, mais l’étiqueter n’aide presque aucun autre point : la densité le fait reculer.</p>`, `
beta = 0 : rang du point isolé 1
beta = 1 : rang du point isolé 193
beta = 2 : rang du point isolé 195
`],
    ],
  }));

  // =====================================================================
  // Bandits
  // =====================================================================
  add('bd-naive', walk({
    id: 'c-bd-naive', title: 'Simuler un bandit : exploration pure contre exploitation pure',
    intro: R`<p>Les 4 bras de Bernoulli du TP3, $\mu=(0{,}1;\ 0{,}05;\ 0{,}02;\ 0{,}01)$, sur 2000 tours. Le regret cumulé mesure ce qu’on a perdu par rapport à toujours jouer le meilleur bras.</p>`,
    steps: [
      ['L’environnement et le regret', R`
import numpy as np
rng = np.random.default_rng(0)
mu = np.array([0.1, 0.05, 0.02, 0.01])
K, n = len(mu), 2000

def jouer(strategie):
    N = np.zeros(K); S = np.zeros(K); regret = 0.0
    for t in range(n):
        a = strategie(N, S)
        r = float(rng.random() < mu[a])           # gain de Bernoulli
        N[a] += 1; S[a] += r
        regret += mu.max() - mu[a]                # regret espéré du tour : Delta_a
    return regret
`, fns([
        ['N, S', R`$N_a(t)$ et $S_a(t)$ : nombre de tirages et somme des gains de chaque bras ; $\hat\mu_a=S_a/N_a$.`],
        ['strategie(N, S)', R`une fonction qui ne voit que ces statistiques et renvoie un bras : c’est exactement l’interface du TP3.`],
        ['mu.max() - mu[a]', R`$\Delta_a$ ; leur somme est le regret $R_n=\sum_a\Delta_a\,\mathbb E[N_a(n)]$ du ${course('bd-regret', 'cours')}.`],
      ])],
      ['Deux stratégies naïves', R`
uniforme = lambda N, S: rng.integers(K)                         # exploration pure
def glouton(N, S):                                              # exploitation pure (après un tirage par bras)
    if np.any(N == 0):
        return int(np.argmin(N))
    m = S / N
    return int(rng.choice(np.flatnonzero(m == m.max())))       # meilleur empirique, ex aequo au hasard

for nom, st in [("uniforme", uniforme), ("glouton", glouton)]:
    regs = [jouer(st) for _ in range(100)]
    print(f"{nom:9s} regret moyen {np.mean(regs):6.1f}, min {np.min(regs):5.1f}, max {np.max(regs):6.1f}")
`, fns([
        ['rng.integers(K)', R`un bras au hasard : on n’utilise jamais ce qu’on a appris, regret $\bar\Delta\,n=0{,}055\times2000=110$.`],
        ['rng.choice(np.flatnonzero(m == m.max()))', R`le meilleur bras <b>empirique</b>, tiré au hasard parmi les ex aequo : on n’explore jamais plus. Sans ce tirage, <code>np.argmax</code> prendrait toujours le premier ex aequo… qui est ici le meilleur bras : le glouton paraîtrait bon par pur hasard d’ordre.`],
      ]) + R`<p>Le glouton est parfois parfait, parfois catastrophique : si le meilleur bras ne gagne pas à son premier tirage (probabilité 0,9), il peut être abandonné pour toujours. Les deux regrets sont <b>linéaires</b> en $n$ ; les stratégies suivantes (${course('bd-etc', 'ETC')}, ${course('bd-ucb', 'UCB')}…) dosent les deux.</p>`, `
uniforme  regret moyen  110.2, min 106.2, max  113.1
glouton   regret moyen   45.3, min   0.2, max  179.9
`],
    ],
  }));
  const tp3 = R`<p>Cet algorithme est programmé et commenté ligne par ligne dans le ${course('tp3-avant', 'TP3')}, avec la boucle de <code>main.py</code> qui l’appelle, un essai à la main et la comparaison de toutes les stratégies sur un même graphique.</p>`;
  for (const sec of ['bd-etc', 'bd-egreedy', 'bd-ucb', 'bd-thompson', 'bd-lower']) add(sec, tp3);

  add('bd-bai', walk({
    id: 'c-bd-bai', title: 'LUCB : identifier le meilleur bras avec une confiance 1 − δ',
    intro: R`<p>À chaque tour, LUCB tire deux bras : le meilleur empirique et son challenger le plus dangereux (borne supérieure la plus haute parmi les autres). Il s’arrête quand la borne inférieure du premier dépasse la borne supérieure du second.</p>`,
    steps: [
      ['Les intervalles de confiance', R`
import numpy as np
rng = np.random.default_rng(0)
mu = np.array([0.5, 0.4, 0.3, 0.2])
K, delta = len(mu), 0.1

def rayon(N, t):
    return np.sqrt(np.log(5 * K * t**4 / (4 * delta)) / (2 * N))
`, fns([
        ['rayon(N, t)', R`la demi-largeur de l’intervalle de Hoeffding de chaque bras, $\sqrt{\frac{\ln(5Kt^4/4\delta)}{2N_a}}$. Le $t^4$ et le $5K/4$ paient l’union sur tous les bras et tous les instants : la garantie $\mathbb P(\hat a=a^*)\ge1-\delta$ tient quel que soit le moment de l’arrêt.`],
      ])],
      ['L’algorithme', R`
def lucb():
    N = np.ones(K); S = (rng.random(K) < mu).astype(float)      # un tirage par bras
    t = K
    while True:
        m, r = S / N, rayon(N, t)
        h = int(np.argmax(m))                                    # meilleur empirique
        autres = [a for a in range(K) if a != h]
        l = autres[int(np.argmax((m + r)[autres]))]              # challenger : plus haute borne supérieure
        if m[h] - r[h] > m[l] + r[l]:                            # règle d'arrêt
            return h, int(N.sum())
        for a in (h, l):                                         # règle d'échantillonnage
            S[a] += rng.random() < mu[a]; N[a] += 1; t += 1
`, fns([
        ['h', R`la <b>recommandation</b> courante : le bras de meilleure moyenne empirique.`],
        ['l', R`le challenger : parmi les autres, celui qui pourrait encore être meilleur (borne supérieure $\hat\mu_a+r_a$ la plus haute).`],
        ['m[h] - r[h] > m[l] + r[l]', R`les intervalles de $h$ et de $l$ sont disjoints : avec la confiance demandée, $h$ bat tous les autres.`],
      ])],
      ['Combien de tirages, et combien d’erreurs ?', R`
res = [lucb() for _ in range(50)]
print("bras recommandé correct :", np.mean([h == 0 for h, _ in res]))
print("tirages : moyenne", np.mean([tau for _, tau in res]), ", min", min(tau for _, tau in res), ", max", max(tau for _, tau in res))
`, R`<p><b>Pourquoi tant de tirages ?</b> L’écart entre les deux meilleurs bras, $\Delta=0{,}1$, dicte presque tout : les deux intervalles doivent descendre sous $\Delta/2=0{,}05$, soit $N\ge\frac{\ln(5Kt^4/4\delta)}{2\cdot0{,}05^2}=200\,\ln(5Kt^4/4\delta)$ tirages chacun. Avec $t$ de l’ordre de $10^4$, ce logarithme vaut près de 40 : le terme $t^4$, prix d’une garantie valable à tout instant, coûte bien plus que $\ln\frac1\delta$. Le taux d’erreur observé est bien sous $\delta=0{,}1$ : les intervalles de Hoeffding sont prudents. Essaie $\Delta=0{,}05$ (bras à 0,45) : environ 4 fois plus de tirages.</p>`, `
bras recommandé correct : 1.0
tirages : moyenne 18201.36 , min 13204 , max 23636
`],
    ],
  }));

  // =====================================================================
  // Apprentissage par renforcement
  // =====================================================================
  const tp4 = (what) => R`<p>${what} est à programmer dans le ${course('tp4-avant', 'TP4')}, qui est <b>évalué</b> : la fiche du TP en donne le pseudo-code commenté ligne par ligne et un script pour explorer le MDP fourni, sans le code à rendre.</p>`;
  add('rl-mdp', R`<p>Un MDP réel, en code : le script ${course('tp4-avant', '« Explorer le MDP fourni »')} du TP4 interroge les états, les actions, les transitions $T(s,a,s')$ et les récompenses de la grille du cours.</p>`);
  add('rl-vi', tp4('Value iteration'));
  add('rl-q', tp4('Le q-learning'));
  add('rl-approx', tp4('Le q-learning approché'));

  add('rl-pi', walk({
    id: 'c-rl-pi', title: 'Policy iteration sous forme matricielle, sur un MDP à 3 états',
    intro: R`<p>Un petit MDP écrit avec des matrices : on évalue une politique en résolvant un système linéaire (les équations de Bellman sont linéaires quand la politique est fixée), puis on l’améliore, jusqu’à ce qu’elle ne change plus.</p>`,
    steps: [
      ['Le MDP en tableaux', R`
import numpy as np
gamma = 0.9
# T[a, s, s'] : probabilité d'aller de s à s' avec l'action a ; Rw[a, s] : récompense espérée
T = np.array([[[0.9, 0.1, 0.0], [0.0, 0.9, 0.1], [0.0, 0.0, 1.0]],     # action 0 : "avancer prudemment"
              [[0.2, 0.8, 0.0], [0.0, 0.2, 0.8], [0.0, 0.0, 1.0]]])    # action 1 : "foncer"
Rw = np.array([[0.0, 0.0, 1.0],
               [-0.2, -0.2, 1.0]])
print(T.sum(axis=2))                              # chaque ligne de chaque matrice somme à 1
`, fns([
        ['T[a, s, s2]', R`la fonction de transition $T(s,a,s')$ en tableau 3D : une matrice de transition par action.`],
        ['Rw[a, s]', R`la récompense espérée en jouant $a$ dans $s$ : foncer coûte 0,2 par pas, l’état 2 rapporte 1 à chaque tour.`],
        ['T.sum(axis=2)', R`vérification : chaque ligne est une loi de probabilité.`],
      ]), `
[[1. 1. 1.]
 [1. 1. 1.]]
`],
      ['Évaluer une politique : un système linéaire', R`
def evaluer(pi):
    P = T[pi, np.arange(3)]                       # P[s, s'] = T(s, pi(s), s')
    r = Rw[pi, np.arange(3)]
    return np.linalg.solve(np.eye(3) - gamma * P, r)

print(evaluer(np.array([0, 0, 0])).round(3))
`, fns([
        ['T[pi, np.arange(3)]', R`pour chaque état $s$, la ligne de la matrice de l’action $\pi(s)$ : la matrice de transition $P_\pi$ de la politique.`],
        ['np.linalg.solve(np.eye(3) - gamma * P, r)', R`résout $v=r_\pi+\gamma P_\pi v$, soit $(I-\gamma P_\pi)\,v=r_\pi$ : l’évaluation exacte, sans itérer.`],
      ]), `
[ 2.244  4.737 10.   ]
`],
      ['Améliorer, recommencer', R`
pi = np.array([0, 0, 0])
for k in range(10):
    v = evaluer(pi)
    q = Rw + gamma * T @ v                        # q[a, s] = R(s, a) + gamma * somme_s' T(s, a, s') v(s')
    nouvelle = q.argmax(axis=0)
    print(f"itération {k} : pi = {pi}, v = {v.round(3)}")
    if np.array_equal(nouvelle, pi):
        break
    pi = nouvelle
`, fns([
        ['T @ v', R`produit matriciel par action : la valeur espérée de l’état suivant, $\sum_{s'}T(s,a,s')v(s')$, pour tout $(a,s)$.`],
        ['q.argmax(axis=0)', R`dans chaque état, l’action de meilleure q-valeur : la politique gloutonne par rapport à $v_\pi$.`],
        ['np.array_equal(nouvelle, pi)', R`si la politique ne change plus, elle est optimale (théorème d’amélioration de la politique).`],
      ]) + R`<p>Policy iteration converge en très peu d’itérations, chacune coûtant une résolution de système. Value iteration (TP4) fait l’inverse : beaucoup d’itérations bon marché.</p>`, `
itération 0 : pi = [0 0 0], v = [ 2.244  4.737 10.   ]
itération 1 : pi = [1 1 0], v = [ 7.252  8.537 10.   ]
`],
    ],
  }));

  const MARCHE = R`
import numpy as np
rng = np.random.default_rng(0)
# Marche aléatoire : états 1 à 5 (A à E), départ en 3 ; on va à gauche ou à droite avec probabilité 1/2.
# Sortir à droite (après E) rapporte 1, à gauche 0. Valeurs vraies (gamma = 1) : 1/6, 2/6, ..., 5/6.
v_vrai = np.arange(1, 6) / 6

def episode():
    s, traj = 3, []
    while 1 <= s <= 5:
        s2 = s + rng.choice([-1, 1])
        r = 1.0 if s2 == 6 else 0.0
        traj.append((s, r, s2))
        s = s2
    return traj
`;
  add('rl-mc', walk({
    id: 'c-rl-mc', title: 'Monte-Carlo first-visit sur une marche aléatoire',
    intro: R`<p>L’exemple classique de Sutton et Barto : on évalue la politique « au hasard » sans connaître le modèle, uniquement à partir d’épisodes complets.</p>`,
    steps: [
      ['L’environnement', MARCHE, fns([
        ['episode()', R`joue un épisode et renvoie la liste des transitions $(s, r, s')$ jusqu’à la sortie (état 0 ou 6).`],
        ['v_vrai', R`les vraies valeurs, connues ici, pour mesurer l’erreur des estimations.`],
      ])],
      ['La mise à jour Monte-Carlo', R`
def mc(n_episodes, alpha):
    v = np.full(7, 0.5); v[0] = v[6] = 0.0
    for _ in range(n_episodes):
        traj = episode()
        G = 0.0
        retours = {}
        for s, r, _ in reversed(traj):            # en remontant : G = r + G (gamma = 1)
            G = r + G
            retours[s] = G                        # la dernière affectation est celle de la 1re visite
        for s, G in retours.items():
            v[s] += alpha * (G - v[s])            # v <- v + alpha (G - v)
    return v[1:6]

v = mc(100, 0.05)
print("estimé :", v.round(3), "\nvrai   :", v_vrai.round(3), "\nerreur RMS :", round(float(np.sqrt(np.mean((v - v_vrai) ** 2))), 3))
`, fns([
        ['reversed(traj)', R`parcourt l’épisode à l’envers : le retour $G_t=r_{t+1}+\gamma G_{t+1}$ se calcule alors en une passe.`],
        ['retours[s] = G', R`en remontant, chaque nouvelle visite de $s$ écrase la précédente : il reste le retour de la <b>première</b> visite (first-visit, sans biais).`],
        ['v[s] += alpha * (G - v[s])', R`la moyenne incrémentale du cours : on rapproche $v(s)$ du retour observé d’une fraction $\alpha$.`],
      ]) + R`<p>Il faut attendre la <b>fin</b> de chaque épisode pour mettre à jour : c’est la limite que TD lève (${course('rl-td', 'fiche suivante')}).</p>`, `
estimé : [0.23  0.395 0.589 0.743 0.854] 
vrai   : [0.167 0.333 0.5   0.667 0.833] 
erreur RMS : 0.066
`],
    ],
  }));

  add('rl-td', walk({
    id: 'c-rl-td', title: 'TD(0) contre Monte-Carlo sur la même marche aléatoire',
    intro: R`<p>Même environnement que la fiche Monte-Carlo ; TD(0) met à jour après <b>chaque transition</b>, en s’appuyant sur l’estimation de l’état suivant.</p>`,
    steps: [
      ['L’environnement', MARCHE, R`<p>La marche aléatoire de la ${course('rl-mc', 'fiche Monte-Carlo')}.</p>`],
      ['TD(0)', R`
def td(n_episodes, alpha):
    v = np.full(7, 0.5); v[0] = v[6] = 0.0          # les états terminaux valent 0
    for _ in range(n_episodes):
        for s, r, s2 in episode():
            v[s] += alpha * (r + v[s2] - v[s])        # cible r + gamma v(s'), gamma = 1
    return v[1:6]
`, fns([
        ['r + v[s2] - v[s]', R`l’<b>erreur TD</b> $\delta=r+\gamma v(s')-v(s)$ : la différence entre ce qu’on croyait et ce qu’on croit maintenant, un pas plus tard (bootstrap).`],
        ['v[0] = v[6] = 0', R`un état terminal vaut 0 : à la sortie, la cible se réduit à la récompense.`],
      ])],
      ['Comparer à Monte-Carlo, en moyenne sur 100 essais', R`
def mc(n_episodes, alpha):
    v = np.full(7, 0.5); v[0] = v[6] = 0.0
    for _ in range(n_episodes):
        G, retours = 0.0, {}
        for s, r, _ in reversed(episode()):
            G = r + G; retours[s] = G
        for s, G in retours.items():
            v[s] += alpha * (G - v[s])
    return v[1:6]

rms = lambda v: np.sqrt(np.mean((v - v_vrai) ** 2))
for n in [10, 50, 100]:
    print(f"{n:3d} épisodes : TD(0) {np.mean([rms(td(n, 0.1)) for _ in range(100)]):.3f}   MC {np.mean([rms(mc(n, 0.05)) for _ in range(100)]):.3f}")
`, fns([
        ['td(n, 0.1), mc(n, 0.05)', R`chaque méthode avec un pas qui lui convient (Monte-Carlo, plus bruité, demande un $\alpha$ plus petit).`],
        ['np.mean([rms(…) for _ in range(100)])', R`l’erreur moyenne sur 100 essais indépendants : une seule exécution serait trop bruitée pour comparer.`],
      ]) + R`<p>Sur cet exemple, TD(0) apprend plus vite que Monte-Carlo : sa cible $r+v(s')$ varie beaucoup moins que le retour complet $G$, au prix d’un biais qui disparaît à mesure que $v$ s’améliore.</p>`, `
 10 épisodes : TD(0) 0.129   MC 0.178
 50 épisodes : TD(0) 0.052   MC 0.075
100 épisodes : TD(0) 0.053   MC 0.066
`],
    ],
  }));

  add('rl-explore', walk({
    id: 'c-rl-explore', title: 'ε-greedy et softmax : les probabilités d’action',
    intro: R`<p>Trois actions de q-valeurs $q=(1;\ 0{,}8;\ 0{,}2)$ dans un état. Quelle probabilité chaque règle donne-t-elle à chaque action ?</p>`,
    steps: [
      ['Les deux règles', R`
import numpy as np
q = np.array([1.0, 0.8, 0.2])
m = len(q)

def eps_greedy(q, eps):
    p = np.full(len(q), eps / len(q))             # eps réparti sur toutes les actions...
    p[np.argmax(q)] += 1 - eps                    # ... et 1 - eps en plus sur la meilleure
    return p

def softmax(q, tau):
    z = np.exp((q - q.max()) / tau)               # soustraire le max évite les débordements
    return z / z.sum()

print("eps-greedy 0,1 :", eps_greedy(q, 0.1).round(3))
for tau in [0.05, 0.2, 1, 10]:
    print(f"softmax tau = {tau:<4} :", softmax(q, tau).round(3))
`, fns([
        ['eps_greedy', R`$\pi(a^*\mid s)=1-\epsilon+\epsilon/m$, $\pi(a\mid s)=\epsilon/m$ sinon : les mauvaises actions sont explorées autant que les presque bonnes.`],
        ['np.exp((q - q.max()) / tau)', R`$p(a)\propto e^{q(a)/\tau}$. Soustraire $\max q$ ne change rien après normalisation (le facteur commun se simplifie) mais évite que <code>exp</code> déborde pour un petit $\tau$.`],
        ['tau', R`la température : petite, softmax devient glouton ; grande, il devient uniforme.`],
      ]) + R`<p>Contrairement à ε-greedy, softmax explore surtout l’action à 0,8 et presque jamais celle à 0,2 : l’exploration suit les valeurs.</p>`, `
eps-greedy 0,1 : [0.933 0.033 0.033]
softmax tau = 0.05 : [0.982 0.018 0.   ]
softmax tau = 0.2  : [0.721 0.265 0.013]
softmax tau = 1    : [0.441 0.361 0.198]
softmax tau = 10   : [0.344 0.338 0.318]
`],
      ['Tirer une action selon ces probabilités', R`
rng = np.random.default_rng(0)
choix = rng.choice(m, size=10000, p=softmax(q, 0.2))
print(np.bincount(choix) / 10000)
`, fns([
        ['rng.choice(m, size=…, p=…)', R`tire des actions selon la loi donnée : c’est ainsi qu’un agent softmax agit.`],
      ]), `
[0.7241 0.2625 0.0134]
`],
    ],
  }));

  // =====================================================================
  // Séries chronologiques (numpy seulement : statsmodels n'est pas nécessaire pour comprendre)
  // =====================================================================
  const SERIE = R`
import numpy as np
rng = np.random.default_rng(0)
t = np.arange(120)                                    # 10 ans de données mensuelles
x = 50 + 0.5 * t + 10 * np.sin(2 * np.pi * t / 12) + rng.normal(0, 2, 120)
`;
  add('ts-filters', walk({
    id: 'c-ts-filters', title: 'Différences, moyenne mobile et lissage exponentiel',
    intro: R`<p>Une série mensuelle fabriquée : tendance linéaire (+0,5 par mois), saison de période 12 (amplitude 10) et bruit. On vérifie ce que chaque filtre enlève.</p>`,
    steps: [
      ['La série', SERIE, fns([
        ['50 + 0.5 * t', R`la tendance $m_t$.`],
        ['10 * np.sin(2 * np.pi * t / 12)', R`la saison $s_t$, de période 12 et de somme nulle sur une période.`],
        ['rng.normal(0, 2, 120)', R`le bruit $W_t$, d’écart type 2.`],
      ])],
      ['La différence ∇ et la différence saisonnière ∇₁₂', R`
d1 = np.diff(x)                                       # x_t - x_{t-1}
d12 = x[12:] - x[:-12]                                # x_t - x_{t-12}
print(f"moyenne de ∇x : {d1.mean():.3f} (pente 0,5) ; écart type {d1.std():.2f}")
print(f"moyenne de ∇12 x : {d12.mean():.3f} (12 x 0,5 = 6) ; écart type {d12.std():.2f}")
`, fns([
        ['np.diff(x)', R`$\nabla x_t=(1-B)x_t=x_t-x_{t-1}$ : une tendance linéaire devient la constante 0,5. La saison, elle, reste (sa différence est encore périodique), d’où un grand écart type.`],
        ['x[12:] - x[:-12]', R`$\nabla_{12}x_t=x_t-x_{t-12}$ : la saison de période 12 disparaît, la tendance devient la constante 6 ; il reste du bruit.`],
      ]), `
moyenne de ∇x : 0.475 (pente 0,5) ; écart type 4.46
moyenne de ∇12 x : 6.030 (12 x 0,5 = 6) ; écart type 2.83
`],
      ['La moyenne mobile d’ordre 12', R`
w = np.r_[0.5, np.ones(11), 0.5] / 12                 # moyenne mobile centrée 2 x 12
tendance = np.convolve(x, w, mode="valid")            # 108 valeurs (6 perdues à chaque bout)
vraie = 50 + 0.5 * t[6:-6]
print(f"écart moyen à la vraie tendance : {np.abs(tendance - vraie).mean():.2f}")
`, fns([
        ['np.r_[0.5, np.ones(11), 0.5] / 12', R`13 poids : moyenne sur exactement une période (les deux extrémités comptent pour moitié, ce qui centre le filtre sur un mois). Une moyenne sur une période entière annule une saison additive.`],
        ['np.convolve(x, w, mode="valid")', R`applique les poids en glissant le long de la série ; <code>valid</code> ne garde que les positions où la fenêtre est complète.`],
      ]) + R`<p>Il reste un écart de l’ordre du bruit moyenné : la moyenne mobile récupère la tendance.</p>`, `
écart moyen à la vraie tendance : 0.48
`],
      ['Le lissage exponentiel', R`
def lissage(x, alpha):
    y = np.empty(len(x)); y[0] = x[0]
    for i in range(1, len(x)):
        y[i] = alpha * x[i] + (1 - alpha) * y[i - 1]
    return y

for alpha in [0.1, 0.5, 0.9]:
    y = lissage(x, alpha)
    print(f"alpha = {alpha} : écart type de (x - lissé) {np.std(x - y):.2f}")
`, fns([
        ['y[i] = alpha * x[i] + (1 - alpha) * y[i - 1]', R`$y_t=\alpha x_t+(1-\alpha)y_{t-1}$ : une moyenne pondérée de tout le passé, à poids qui décroissent géométriquement.`],
      ]) + R`<p>Petit $\alpha$ : courbe très lisse mais en retard (elle s’écarte de la série, d’où un grand écart) ; grand $\alpha$ : elle colle à la série, bruit compris.</p>`, `
alpha = 0.1 : écart type de (x - lissé) 6.68
alpha = 0.5 : écart type de (x - lissé) 3.07
alpha = 0.9 : écart type de (x - lissé) 0.46
`],
    ],
  }));

  add('ts-acf', walk({
    id: 'c-ts-acf', title: 'L’autocorrélogramme, calculé à la main',
    steps: [
      ['La fonction', R`
import numpy as np
rng = np.random.default_rng(0)

def acf(x, K):
    x = np.asarray(x, float) - np.mean(x)
    return np.array([np.sum(x[:len(x) - k] * x[k:]) / np.sum(x * x) for k in range(K + 1)])
`, fns([
        ['x - np.mean(x)', R`on centre une fois pour toutes : $x_t-\bar x$.`],
        ['np.sum(x[:N - k] * x[k:])', R`$\sum_{t=1}^{N-k}(x_t-\bar x)(x_{t+k}-\bar x)$ : on multiplie la série par elle-même décalée de $k$.`],
        ['/ np.sum(x * x)', R`divise par $\sum_t(x_t-\bar x)^2$ : $r_k$, avec $r_0=1$.`],
      ])],
      ['Trois séries, trois signatures', R`
N = 240
bruit = rng.normal(size=N)
marche = np.cumsum(rng.normal(size=N))                 # marche aléatoire : non stationnaire
saison = 10 * np.sin(2 * np.pi * np.arange(N) / 12) + rng.normal(size=N)
print("bande ±2/sqrt(N) :", round(2 / np.sqrt(N), 3))
print("bruit blanc, part des r_k (k = 1..20) dans la bande :", np.mean(np.abs(acf(bruit, 20)[1:]) < 2 / np.sqrt(N)))
print("marche aléatoire, r_1, r_5, r_10 :", acf(marche, 10)[[1, 5, 10]].round(2))
print("série saisonnière, r_6, r_12, r_24 :", acf(saison, 24)[[6, 12, 24]].round(2))
`, fns([
        ['2 / np.sqrt(N)', R`pour un bruit blanc, chaque $r_k$ ($k\ge1$) suit à peu près $\mathcal N(0,1/N)$ : environ 95 % tombent dans $\pm2/\sqrt N$.`],
        ['np.cumsum(rng.normal(size=N))', R`une marche aléatoire $X_t=X_{t-1}+W_t$.`],
      ]) + R`<p><b>Lecture</b> : le bruit blanc reste dans la bande ; la marche aléatoire a des $r_k$ proches de 1 qui décroissent lentement (non-stationnarité : différencier) ; la série saisonnière a des pics en 12 et 24 et des creux en 6.</p>`, `
bande ±2/sqrt(N) : 0.129
bruit blanc, part des r_k (k = 1..20) dans la bande : 0.95
marche aléatoire, r_1, r_5, r_10 : [0.98 0.91 0.8 ]
série saisonnière, r_6, r_12, r_24 : [-0.96  0.94  0.89]
`],
    ],
  }));

  add('ts-ar', walk({
    id: 'c-ts-ar', title: 'Un AR(2) : stationnarité, ACF et PACF',
    intro: R`<p>$X_t=0{,}5X_{t-1}+0{,}3X_{t-2}+W_t$. On vérifie qu’il est stationnaire, on le simule et on lit sa signature : ACF qui décroît, PACF nulle après 2.</p>`,
    steps: [
      ['Stationnarité : les racines de Φ', R`
import numpy as np
rng = np.random.default_rng(0)
phi = np.array([0.5, 0.3])
racines = np.roots([-phi[1], -phi[0], 1])            # Phi(z) = 1 - 0,5 z - 0,3 z^2, coefficients du degré 2 au degré 0
print("racines :", racines.round(3), "modules :", np.abs(racines).round(3))
`, fns([
        ['np.roots([a2, a1, a0])', R`les racines du polynôme $a_2z^2+a_1z+a_0$ (coefficients du plus haut degré au plus bas).`],
      ]) + R`<p>Les deux racines sont hors du cercle unité (module > 1) : le processus est stationnaire (${course('ts-ar', 'condition du cours')}).</p>`, `
racines : [-2.84   1.174] modules : [2.84  1.174]
`],
      ['Simuler', R`
N = 2000
x = np.zeros(N + 100)
w = rng.normal(size=N + 100)
for t in range(2, N + 100):
    x[t] = phi[0] * x[t - 1] + phi[1] * x[t - 2] + w[t]
x = x[100:]                                            # on jette le début, encore influencé par x_0 = x_1 = 0
`, fns([
        ['x[100:]', R`le « temps de chauffe » : les 100 premières valeurs dépendent du départ arbitraire à 0.`],
      ])],
      ['ACF et PACF', R`
def acf(x, K):
    x = x - x.mean()
    return np.array([np.sum(x[:len(x) - k] * x[k:]) / np.sum(x * x) for k in range(K + 1)])

def pacf(x, K):                                       # Durbin-Levinson : phi_kk à partir des r_k
    r = acf(x, K); res = [1.0]; prev = np.array([])
    for k in range(1, K + 1):
        a = (r[k] - np.sum(prev * r[k - 1:0:-1])) / (1 - np.sum(prev * r[1:k]))
        prev = np.r_[prev - a * prev[::-1], a]
        res.append(a)
    return np.array(res)

print("ACF  r_1..r_5     :", acf(x, 5)[1:].round(3))
print("PACF phi_11..phi_55 :", pacf(x, 5)[1:].round(3))
print("théorie : rho_1 = phi1 / (1 - phi2) =", round(phi[0] / (1 - phi[1]), 3))
`, fns([
        ['pacf', R`l’algorithme de Durbin-Levinson : il calcule les coefficients $\phi_{k1},\dots,\phi_{kk}$ du meilleur AR($k$) à partir de ceux de l’AR($k-1$). Le dernier, $\phi_{kk}$, est l’autocorrélation partielle.`],
        ['r[k - 1:0:-1]', R`$r_{k-1},\dots,r_1$ (tranche à l’envers).`],
        ['phi[0] / (1 - phi[1])', R`la première équation de Yule-Walker, $\rho_1=\phi_1+\phi_2\rho_1$.`],
      ]) + R`<p><b>Lecture</b> : l’ACF décroît doucement ; la PACF vaut environ 0,71 puis 0,3 (proche de $\phi_2$), puis tombe dans le bruit ($\pm2/\sqrt N\approx0{,}045$) : on lit $p=2$.</p>`, `
ACF  r_1..r_5     : [0.708 0.654 0.547 0.468 0.388]
PACF phi_11..phi_55 : [ 0.708  0.306  0.02  -0.013 -0.024]
théorie : rho_1 = phi1 / (1 - phi2) = 0.714
`],
    ],
  }));

  add('ts-ma', walk({
    id: 'c-ts-ma', title: 'Un MA(1) : l’ACF s’arrête après q',
    intro: R`<p>$X_t=W_t+0{,}6\,W_{t-1}$. Théorie : $\rho_1=\theta/(1+\theta^2)=0{,}441$ et $\rho_k=0$ pour $k\ge2$.</p>`,
    steps: [
      ['Simuler et mesurer', R`
import numpy as np
rng = np.random.default_rng(1)
theta, N = 0.6, 2000
w = rng.normal(size=N + 1)
x = w[1:] + theta * w[:-1]

def acf(x, K):
    x = x - x.mean()
    return np.array([np.sum(x[:len(x) - k] * x[k:]) / np.sum(x * x) for k in range(K + 1)])

print("ACF r_1..r_5 :", acf(x, 5)[1:].round(3), "; théorie rho_1 =", round(theta / (1 + theta**2), 3))
print("inversible : racine de Theta(z) = 1 + 0,6 z en z =", round(-1 / theta, 3))
`, fns([
        ['w[1:] + theta * w[:-1]', R`$W_t+\theta W_{t-1}$ pour tous les $t$ d’un coup : la même suite de bruits, décalée d’un cran.`],
        ['-1 / theta', R`la racine de $\Theta(z)=1+\theta z$ ; son module est $1/0{,}6>1$ : le MA(1) est inversible, il s’écrit comme un AR($\infty$).`],
      ]) + R`<p>$r_1$ est proche de 0,441, et tous les suivants sont dans le bruit : la mémoire d’un MA($q$) ne dépasse pas $q$ pas.</p>`, `
ACF r_1..r_5 : [ 0.436 -0.002  0.018 -0.006 -0.04 ] ; théorie rho_1 = 0.441
inversible : racine de Theta(z) = 1 + 0,6 z en z = -1.667
`],
    ],
  }));

  add('ts-fit', walk({
    id: 'c-ts-fit', title: 'Estimer un AR(2) : Yule-Walker et moindres carrés',
    steps: [
      ['Les données', R`
import numpy as np
rng = np.random.default_rng(0)
phi_vrai = np.array([0.5, 0.3]); N = 1000
x = np.zeros(N + 100); w = rng.normal(0, 1.5, N + 100)
for t in range(2, N + 100):
    x[t] = phi_vrai[0] * x[t - 1] + phi_vrai[1] * x[t - 2] + w[t]
x = x[100:]
`, R`<p>Le même AR(2) que dans la ${course('ts-ar', 'fiche AR')}, avec un bruit d’écart type 1,5.</p>`],
      ['Yule-Walker : φ = R_p⁻¹ ρ', R`
xc = x - x.mean()
r = np.array([np.sum(xc[:N - k] * xc[k:]) / np.sum(xc * xc) for k in range(3)])
Rp = np.array([[1, r[1]], [r[1], 1]])                 # matrice des autocorrélations
phi_yw = np.linalg.solve(Rp, r[1:3])
sigma2 = np.var(xc) * (1 - phi_yw @ r[1:3])          # variance du bruit
print("Yule-Walker :", phi_yw.round(3), " sigma^2 :", round(sigma2, 3), "(vrai 2,25)")
`, fns([
        ['Rp', R`$R_p=\begin{pmatrix}1&r_1\\r_1&1\end{pmatrix}$ ; les équations de Yule-Walker s’écrivent $R_p\,\phi=(r_1,r_2)$.`],
        ['np.linalg.solve(Rp, r[1:3])', R`$\hat\phi=R_p^{-1}\hat\rho$, sans calculer l’inverse explicitement.`],
        ['np.var(xc) * (1 - phi_yw @ r[1:3])', R`$\hat\sigma^2=\hat\gamma_0\,(1-\hat\phi_1r_1-\hat\phi_2r_2)$.`],
      ]), `
Yule-Walker : [0.502 0.29 ]  sigma^2 : 2.213 (vrai 2,25)
`],
      ['Moindres carrés : régresser x_t sur son passé', R`
A = np.c_[x[1:-1], x[:-2]]                             # colonnes x_{t-1} et x_{t-2}
phi_mc = np.linalg.lstsq(A, x[2:], rcond=None)[0]
print("moindres carrés :", phi_mc.round(3))
`, fns([
        ['np.c_[x[1:-1], x[:-2]]', R`la matrice des régresseurs : pour chaque $t\ge2$, la ligne $(x_{t-1},x_{t-2})$.`],
        ['np.linalg.lstsq(A, b)[0]', R`la solution des moindres carrés de $A\phi\approx b$, ici $b=(x_2,\dots,x_{N-1})$.`],
      ]) + R`<p>Les deux méthodes donnent presque le même résultat sur 1000 points. Pour un MA, il n’y a pas de telle formule : les résidus dépendent des paramètres de façon non linéaire (${course('ts-fit', 'cours')}).</p>`, `
moindres carrés : [0.506 0.303]
`],
    ],
  }));

  add('ts-forecast', walk({
    id: 'c-ts-forecast', title: 'Prévoir un AR(1) et vérifier ses intervalles',
    intro: R`<p>$X_t-\mu=\phi(X_{t-1}-\mu)+W_t$ avec $\mu=10$, $\phi=0{,}8$, $\sigma=1$. Prévision $\hat X_t(l)=\mu+\phi^l(x_t-\mu)$ et variance d’erreur $V(l)=\sigma^2(1+\phi^2+\dots+\phi^{2(l-1)})$.</p>`,
    steps: [
      ['La prévision et son intervalle', R`
import numpy as np
mu, phi, sigma = 10.0, 0.8, 1.0
x_t = 14.0                                            # dernière valeur observée
for l in [1, 2, 5, 20]:
    prev = mu + phi**l * (x_t - mu)
    V = sigma**2 * np.sum(phi ** (2 * np.arange(l)))
    print(f"l = {l:2d} : prévision {prev:6.3f}, intervalle à 95 % [{prev - 1.96 * np.sqrt(V):.2f} ; {prev + 1.96 * np.sqrt(V):.2f}]")
`, fns([
        ['mu + phi**l * (x_t - mu)', R`l’écart à la moyenne est multiplié par $\phi$ à chaque pas : la prévision revient vers $\mu$.`],
        ['np.sum(phi ** (2 * np.arange(l)))', R`$1+\phi^2+\dots+\phi^{2(l-1)}$ : pour un AR(1), $\psi_j=\phi^j$.`],
        ['± 1.96 * np.sqrt(V)', R`l’intervalle $\hat X_t(l)\pm u\sqrt{V(l)}$ avec $u=1{,}96$ pour 95 %.`],
      ]) + R`<p>Loin dans le futur, la prévision tend vers $\mu$ et l’intervalle vers $\mu\pm1{,}96\,\sigma/\sqrt{1-\phi^2}$ : on ne prévoit plus que la loi stationnaire.</p>`, `
l =  1 : prévision 13.200, intervalle à 95 % [11.24 ; 15.16]
l =  2 : prévision 12.560, intervalle à 95 % [10.05 ; 15.07]
l =  5 : prévision 11.311, intervalle à 95 % [8.22 ; 14.40]
l = 20 : prévision 10.046, intervalle à 95 % [6.78 ; 13.31]
`],
      ['Les intervalles couvrent-ils 95 % des cas ?', R`
rng = np.random.default_rng(0)
for l in [1, 5]:
    futurs = np.full(100000, x_t)
    for _ in range(l):
        futurs = mu + phi * (futurs - mu) + rng.normal(0, sigma, futurs.size)
    prev = mu + phi**l * (x_t - mu); V = np.sum(phi ** (2 * np.arange(l)))
    print(f"l = {l} : couverture {np.mean(np.abs(futurs - prev) <= 1.96 * np.sqrt(V)):.3f}")
`, fns([
        ['futurs', R`100 000 avenirs possibles simulés à partir de la même dernière valeur : la vraie loi de $X_{t+l}$ sachant $x_t$.`],
      ]) + R`<p>La couverture est bien de 95 % : la formule de $V(l)$ est exacte quand le modèle est le bon. En pratique, $\phi$ et $\sigma$ sont estimés, et les intervalles sont un peu trop étroits.</p>`, `
l = 1 : couverture 0.950
l = 5 : couverture 0.952
`],
    ],
  }));
})();
