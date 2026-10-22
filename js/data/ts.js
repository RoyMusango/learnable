// Chapitre : Méthodes de prévision / Streaming Data Analysis (X. Siebert, slides 01 à 05).
// Les exemples chiffrés « prenons… » sont construits pour l'exercice et vérifiés en Python.
// L'exemple réel (série BIS-RE_QBE221200.csv du TP0) vient d'une vraie exécution du script BIS_PY ci-dessous
// (Python 3.14, numpy, pandas, scipy ; statsmodels n'était pas installé le 22/10/2026).
(function () {
  const R = String.raw;
  const { pick, rnd, f } = COURSE.u;
  const escHtml = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const code = (src, lang = 'python') => `<pre class="code" data-lang="${lang}"><code>${escHtml(src.replace(/^\n/, ''))}</code></pre>`;

  const BIS_PY = `
import numpy as np, pandas as pd
from scipy.stats import chi2

df = pd.read_csv("BIS-RE_QBE221200.csv", parse_dates=["Date"]).sort_values("Date")
x = df.set_index("Date")["Value"]

def acf(y, K):
    y = np.asarray(y, float); d = y - y.mean(); c0 = d @ d
    return np.array([d[:-k] @ d[k:] / c0 for k in range(1, K + 1)])

print("N =", len(x), "| ACF du niveau :", acf(x, 4).round(3))
g = np.log(x[:"2004-12-31"]).diff().dropna().to_numpy()   # croissance trimestrielle
print("n =", len(g), "| bande :", round(2 / np.sqrt(len(g)), 3))
print("ACF de g :", acf(g, 8).round(3))
def pacf(r):                              # Durbin-Levinson à partir des r_k
    out, phi = [r[0]], [r[0]]
    for k in range(2, len(r) + 1):
        a = (r[k - 1] - sum(phi[j] * r[k - 2 - j] for j in range(k - 1))) / (1 - sum(phi[j] * r[j] for j in range(k - 1)))
        phi = [phi[j] - a * phi[k - 2 - j] for j in range(k - 1)] + [a]; out.append(a)
    return np.array(out)
print("PACF de g :", pacf(acf(g, 8)).round(3))
mois = x[:"2004-12-31"].index.month[1:]
print("croissance moyenne par trimestre :", pd.Series(g).groupby(mois).mean().round(4).to_dict())

def ar_mco(g, p, K=8):                    # AR(p) par moindres carrés + Ljung-Box
    y = g[p:]
    A = np.column_stack([np.ones(len(y))] + [g[p - l:len(g) - l] for l in range(1, p + 1)])
    c = np.linalg.lstsq(A, y, rcond=None)[0]; r = y - A @ c; n = len(r)
    R = acf(r, K); Q = n * (n + 2) * np.sum(R**2 / (n - np.arange(1, K + 1)))
    s = np.sqrt(r @ r / (n - p - 1))
    print(f"AR({p}) coef {c.round(4)} sigma {s:.4f} Q* {Q:.2f} p-value {1 - chi2.cdf(Q, K - p):.4f}")
    return c, s

ar_mco(g, 1)
c, s = ar_mco(g, 4)
f = c[0] + sum(c[l] * g[-l] for l in range(1, 5))
print("prévision 2005-T1 :", round(70 * np.exp(f), 2),
      "IC 95 % :", round(70 * np.exp(f - 1.96 * s), 2), "à", round(70 * np.exp(f + 1.96 * s), 2),
      "| observé :", x["2005-03-31"])`;

  const BIS_OUT = `
N = 168 | ACF du niveau : [0.98  0.961 0.943 0.927]
n = 127 | bande : 0.177
ACF de g : [-0.293 -0.019  0.125  0.279 -0.217  0.037  0.033  0.093]
PACF de g : [-0.293 -0.114  0.094  0.385  0.006 -0.057 -0.117  0.023]
croissance moyenne par trimestre : {3: 0.002, 6: 0.0127, 9: 0.0459, 12: -0.0053}
AR(1) coef [ 0.018  -0.2934] sigma 0.0504 Q* 25.79 p-value 0.0005
AR(4) coef [ 0.0098 -0.3351 -0.0286  0.2215  0.3919] sigma 0.0451 Q* 3.96 p-value 0.4114
prévision 2005-T1 : 68.98 IC 95 % : 63.14 à 75.36 | observé : 97.0`;

  COURSE.add({
    id: 'ts',
    title: 'Séries temporelles et prévision',
    short: 'Séries temporelles',
    source: '01 à 05 (Streaming Data Analysis) · 292 slides',
    seen: null,
    pitch: 'Décrire, modéliser et prévoir une série : tendance, saisonnalité, autocorrélation, stationnarité, AR, MA, ARMA, ARIMA, SARIMA, estimation, méthodologie de Box-Jenkins, intervalles de prévision. Exemple réel : un indice trimestriel de la BRI (1973-2014).',
    sections: [
      {
        id: 'ts-intro', title: 'Séries chronologiques : données et objectifs', slides: '01 · 3-21',
        summary: 'Données indicées par le temps et autocorrélées. Modéliser le passé pour prévoir à court terme. Chronogramme et lag-plot.',
        fiche: R`
<p><b>L’idée.</b> Une série chronologique est une suite de mesures prises au fil du temps. Chaque valeur dépend des précédentes ; on décrit cette dépendance pour prévoir les prochaines valeurs, à court terme.</p>
<h4>1. Définitions</h4>
<div class="def"><b>Série chronologique</b> (ou chronique) : $\{x_t\}$, $t=1,\dots,N$. On lit : $x_t$ est la valeur observée à l’instant $t$ (un mois, un trimestre…), $N$ le nombre d’observations, les accolades désignent toute la suite. Le cours étudie surtout des séries <b>univariées</b> (une seule variable) à <b>temps discret</b> ($t$ entier).<br>
Deux propriétés la séparent d’un échantillon i.i.d. (indépendant et identiquement distribué) : <b>l’ordre compte</b>, et les données sont <b>autocorrélées</b> : $x_t$ n’est pas indépendant de $x_{t-1},x_{t-2},\dots$</div>
<p><b>Exemples du cours</b> : séries économiques (ventes, indice des prix), financières (valeurs, indices boursiers), météorologiques (températures, précipitations), démographiques (naissances, immigration), processus ponctuels (arrivées dans une file d’attente par tranche horaire, pages web consultées par jour). Exemple historique : l’inclinaison des orbites des planètes au cours du temps (manuscrit du X<sup>e</sup> siècle) ; des données de ce genre ont permis à Kepler d’énoncer ses lois. Fil rouge : <b>AirPassengers</b>, passagers aériens mensuels (en centaines de milliers), de janvier 1949 à décembre 1960 (144 mois ; l’axe du graphique du cours va jusqu’à 1961).</p>
<p><b>Objectifs</b> : modéliser (description compacte), interpréter, <b>prévoir</b>, contrôler, simuler, tester des hypothèses.</p>
<div class="def"><b>Principe général</b> : modéliser la partie connue de la série (le passé), en supposant que le modèle qui explique le passé explique aussi l’avenir (pas de changement de structure). La prévision n’est donc valable qu’<b>à court terme</b>.</div>
<p><b>Univariée</b> : (1) choisir un modèle et ajuster ses paramètres sur les données ; (2) le valider ; (3) prédire $x_{t+h}$ connaissant $x_s$ pour $s\le t$ ($h$ : l’horizon). <b>Multivariée</b> $\{x_{t1},\dots,x_{tk}\}$ : modéliser aussi les interdépendances (variables d’entrée, de sortie, retards).</p>
<p><b>Disciplines connexes</b> : la théorie du signal (séries continues sous-jacentes, analyse de Fourier) et l’automatique (contrôle optimal). <b>Deux approches</b> : fréquentielle (le signal comme superposition de cycles ; transformée de Fourier, spectre ; historiquement les astronomes, aux périodes régulières) et temporelle (fonctions d’autocorrélation), celle du cours.</p>
<h4>2. Visualiser</h4>
<div class="def"><b>Chronogramme</b> : le tracé des points $(t,x_t)$ sur l’intervalle d’observation (en R : <code>plot.ts(AirPassengers)</code>, puis <code>window(...)</code> pour zoomer sur 1958-1960).<br>
<b>Lag-plot</b> (diagramme retardé) au délai $k$ : le nuage des points $(x_{t-k},x_t)$. Il montre si la valeur d’aujourd’hui ressemble à celle d’il y a $k$ pas (le cours regarde $k=1,2,5,12$). Pour un bruit blanc, le nuage est informe.</div>
<p><b>Exemple calculé</b> (données réelles : les six premiers trimestres de l’indice BRI du TP0, 1973-T1 à 1974-T2) : $x=12,12,14,13,13,13$. Le lag-plot au délai 1 contient les points $(12,12)$, $(12,14)$, $(14,13)$, $(13,13)$, $(13,13)$ : ils restent près de la diagonale. Sur les 168 trimestres, ce nuage est une droite presque parfaite (corrélation au délai 1 : 0,98, voir « Autocorrélogramme empirique »).</p>
<h4>3. Pièges</h4>
<ul><li>Un lag-plot aligné sur la diagonale peut venir d’une simple <b>tendance</b> : une marche aléatoire, dont les accroissements sont indépendants, donne aussi un nuage allongé. Il faut d’abord retirer la tendance.</li>
<li>« Court terme » se juge à l’échelle de la dépendance : prévoir à 10 ans un indice trimestriel avec un modèle ajusté sur sa dynamique de quelques trimestres n’a pas de sens.</li></ul>
<h4>4. Lien finance</h4>
<p>Prix d’actions, taux d’intérêt, indices de prix immobiliers et encours de crédit sont des séries chronologiques. On n’observe qu’une seule histoire du marché, et l’hypothèse « pas de changement de structure » est exactement ce que cassent une crise ou un changement de politique monétaire. Le projet du cours (50 % de la note, 50 % pour la théorie) demande de proposer une série et d’en faire l’analyse complète : une série financière s’y prête.</p>
<h4>À retenir</h4>
<ul><li>Série = données ordonnées et autocorrélées, à l’opposé de l’hypothèse i.i.d.</li>
<li>On modélise le passé en supposant la structure stable : prévision à court terme.</li>
<li>Chronogramme $(t,x_t)$ et lag-plot $(x_{t-k},x_t)$ sont les deux premiers graphiques à faire.</li>
<li>Le cours suit l’approche temporelle (autocorrélations), pas fréquentielle.</li></ul>`,
      },
      {
        id: 'ts-decomp', title: 'Décomposition : tendance, saison, cycle, résidu', slides: '01 · 23-35',
        summary: 'Additif x = T + S + C + R, ou multiplicatif x = T × S × C × R (le log le rend additif). Isoler les parties déterministes et vérifier que le résidu est stationnaire.',
        fiche: R`
<p><b>L’idée.</b> On sépare la série en morceaux qu’on sait expliquer (une pente de fond, un motif qui revient chaque année, des cycles plus longs) et un reste aléatoire. C’est ce reste que les modèles des sections suivantes décrivent.</p>
<h4>1. Définitions</h4>
<div class="def"><b>Modèle additif</b> : $x_t=\underbrace{T_t+S_t+C_t}_{\text{signal}}+\underbrace{R_t}_{\text{bruit}}$, composantes supposées indépendantes.<br>
$T_t$ : la <b>tendance</b> (moyenne locale) ; $S_t$ : la <b>saisonnalité</b>, motif de période fixe et courte (12 mois, 4 trimestres) ; $C_t$ : les <b>cycles</b>, oscillations de moyen ou long terme sans période fixe ; $R_t$ : le <b>résidu</b>, partie aléatoire.<br>
<b>Modèle multiplicatif</b> : $x_t=T_t\times S_t\times C_t\times R_t$ (composantes dépendantes : l’amplitude de la saison grandit avec le niveau). Le <b>logarithme</b> le rend additif : $\ln x_t=\ln T_t+\ln S_t+\ln C_t+\ln R_t$.</div>
<p>Illustrations du cours : tendance (cours de l’or, fixing de Londres), saisonnalité (température de l’air à Berlin), cycles (cas de rougeole déclarés à New York). Additif : ventes de boissons et de tabac ; multiplicatif : passagers aériens. Lecture du chronogramme de la série M : tendance croissante, saisonnalité annuelle multiplicative (amplitude croissante), pas de cycle apparent.</p>
<div class="thm"><b>Tactique d’analyse</b> : supposer un modèle additif ; identifier et éliminer les composantes déterministes ; analyser le résidu, qui doit être <b>stationnaire</b> (ni sa moyenne ni sa variance n’évoluent systématiquement). Sinon, transformer les données, par exemple $\log x_t$.</div>
<h4>2. Savoir-faire : pourquoi le log</h4>
<p>Prenons une série multiplicative sans bruit : tendance $T=100$ la première année et $200$ la seconde, facteur saisonnier $1{,}2$ en été et $0{,}8$ en hiver. Les valeurs sont $120,80$ puis $240,160$. L’écart été-hiver vaut $40$ puis $80$ : il double avec le niveau. En log : $\ln120-\ln80=\ln240-\ln160=\ln1{,}5=0{,}405$, identique les deux années. Après le log, la saison est additive et d’amplitude constante.</p>
<p><b>Précision du cours</b> : le log rend la saison additive dans le modèle A $x_t=T_tS_tR_t$ et dans le modèle B $x_t=T_tS_t+R_t$, mais il ne stabilise la variance dans le modèle B que si $R_t$ est petit devant $S_t$ (le bruit reste additif avant le log).</p>
<h4>3. Estimer la tendance par ajustement de courbe</h4>
<p>Sur une série éventuellement transformée (log) et <b>désaisonnalisée</b> (par exemple par une moyenne mobile annuelle), on ajuste une courbe par moindres carrés : polynôme, exponentielle (droite après log), <b>Gompertz</b> $\log x_t=a-br^t$ ($0<r<1$, soit $x_t=\exp(a-br^t)$), <b>logistique</b> $x_t=\dfrac a{1-be^{-ct}}$ (formule du slide 33). La fonction ajustée évalue la tendance (et le cycle).</p>
<p>Exemple du cours (série M, en log) : $y=4{,}814+0{,}010\,t$. Les résidus $\ln x_t-(4{,}814+0{,}010\,t)$ servent à étudier la saison. Calcul : à $t=100$, la tendance vaut $5{,}814$ en log, soit $e^{5{,}814}\approx335$. Si l’on observait $\ln x_{100}=6{,}0$ (valeur prise pour l’exercice), le résidu serait $0{,}186$, soit un facteur $e^{0{,}186}\approx1{,}20$ : 20 % au-dessus de la tendance, l’effet d’un mois de haute saison.</p>
<h4>4. Pièges</h4>
<ul><li>Saison et cycle : la saison a une période fixe et connue, le cycle non. Une différence saisonnière $\nabla_{12}$ ne traite pas un cycle économique.</li>
<li>Le log exige $x_t>0$ (taux négatifs, soldes : il faut une autre transformation).</li>
<li>Le résidu d’une courbe ajustée contient encore la saison si la série n’a pas été désaisonnalisée d’abord.</li></ul>
<h4>5. Lien finance</h4>
<p>Les flux (ventes, production de crédits, dépôts) ont souvent une saison ; les prix se traitent presque toujours en log, car leurs variations sont proportionnelles au niveau. Sur l’indice BRI du TP0 (données réelles, 1973-2004, calcul détaillé dans « Méthodologie de Box-Jenkins »), la croissance trimestrielle moyenne en log vaut $0{,}2$ % au 1<sup>er</sup> trimestre, $1{,}27$ % au 2<sup>e</sup>, $4{,}59$ % au 3<sup>e</sup> et $-0{,}53$ % au 4<sup>e</sup> : une saisonnalité trimestrielle nette dans un indice de prix.</p>
<h4>À retenir</h4>
<ul><li>Additif $T+S+C+R$ ; multiplicatif $T\times S\times C\times R$, rendu additif par le log.</li>
<li>Amplitude saisonnière qui grandit avec le niveau : multiplicatif.</li>
<li>Retirer les parties déterministes, puis vérifier que le résidu est stationnaire.</li>
<li>Tendance : courbe ajustée par moindres carrés (polynôme, exponentielle, Gompertz, logistique) sur la série désaisonnalisée.</li></ul>`,
      },
      {
        id: 'ts-filters', title: 'Filtres : différences et moyennes mobiles', slides: '01 · 36-49',
        summary: '∇ = 1 − B enlève une tendance linéaire, ∇² une quadratique, ∇s la saison. Moyenne mobile d’ordre = période : enlève une saison additive. Lissage exponentiel yt = αxt + (1−α)yt−1.',
        fiche: R`
<p><b>L’idée.</b> Un filtre remplace chaque valeur par une combinaison de valeurs voisines. Une <b>différence</b> retire une tendance ; une <b>moyenne mobile</b> lisse le bruit et efface une saison. Les deux ont un prix : ils fabriquent des corrélations qui n’existaient pas.</p>
<h4>1. Définitions</h4>
<div class="def"><b>Filtre linéaire</b> : $y_t=\sum_{r=-q}^{s}\Pi_r\,x_{t+r}$, où $\Pi_r$ est le <b>poids</b> de l’observation $x_{t+r}$ dans la série filtrée à l’instant $t$ ($q$ valeurs passées, $s$ valeurs futures). Attention : ce $\Pi_r$ n’a rien à voir avec les poids $\Pi_j$ de la forme AR(∞) vue plus loin.</div>
<div class="def"><b>Différence première</b> (notée D(−1) dans les slides) $\nabla x_t=x_t-x_{t-1}$, asymétrique : élimine une tendance linéaire $T_t=a+bt$ d’un modèle additif. Inconvénient : si $x_t=a+bt+R_t$, alors $y_t=b+R_t-R_{t-1}$, et $y_t$, $y_{t-1}$ partagent $R_{t-1}$ : <b>dépendance fictive</b> (corrélation $-1/2$ si $R_t$ est un bruit blanc).<br>
<b>Différence seconde</b> $\nabla^2x_t=x_t-2x_{t-1}+x_{t-2}$ : élimine une tendance quadratique $a+bt+ct^2$ (utilisée occasionnellement).<br>
<b>Différence saisonnière</b> D(−s) : $\nabla_sx_t=x_t-x_{t-s}$ ($s=12$ en mensuel) : élimine une tendance linéaire entre valeurs séparées de $s$.</div>
<p>Série M (cours) : $\nabla$ sur la série brute enlève la tendance mais la saison reste et sa variance augmente ; sur le log, la saison semble plus stationnaire ; $\nabla_{12}$ du log laisse de l’autocorrélation ; $\nabla$ puis $\nabla_{12}$ du log élimine la saison (« à nuancer ») et la variance semble diminuer au milieu de la série.</p>
<div class="def"><b>Moyenne mobile</b> (lissage) : poids qui somment à 1, $\sum_r\Pi_r=1$. Symétrique ($\Pi_r=\Pi_{-r}$, $s=q$), la plus courante : $y_t=\frac1{2q+1}\sum_{r=-q}^qx_{t+r}$.
<ul><li>élimine une saison <b>additive</b> de période $2q+1$ et invariante ($\sum_{r=-q}^qS_{t+r}=0$ pour tout $t$) ;</li>
<li>laisse passer une tendance linéaire (avec un biais constant si le filtre n’est pas symétrique) ;</li>
<li>atténue le bruit : $\frac{a_{t+q}+\dots+a_{t-q}}{2q+1}$ est de moyenne nulle et de variance $\frac{\mathrm{var}}{2q+1}$ ; mais $q$ observations sont perdues à chaque bord, et les dernières valeurs (le présent) ne sont pas estimées ;</li>
<li>crée des dépendances fictives et une périodicité artificielle (<b>effet Yule-Slutsky</b>).</li></ul></div>
<p>Série M, MA(12) sur le log : la saison disparaît alors qu’elle est multiplicative, probablement parce qu’elle est très régulière et que son amplitude croît lentement. (Remarque hors slides : une période paire n’a pas de moyenne centrée de longueur $2q+1$ ; on utilise en pratique une moyenne « 2×12 » centrée.)</p>
<div class="def"><b>Filtre asymétrique</b> $y_t=\sum_{j=0}^{q}\Pi_jx_{t-j}$ : effet de bord d’un seul côté, permet d’estimer le présent.<br>
<b>Lissage exponentiel</b> : $\Pi_j=\alpha(1-\alpha)^j$, $0<\alpha<1$, $q=\infty$, ce qui revient à $y_t=\alpha x_t+(1-\alpha)y_{t-1}$ : on met à jour l’ancien lissage $y_{t-1}$ dès que $x_t$ arrive. $\alpha$ : le poids de la nouvelle observation.</div>
<h4>2. Savoir-faire : un exemple complet</h4>
<p>Prenons $x_t=10+0{,}5t+S_t$, avec une saison additive de période 3, $S=(2,-1,-1)$ qui se répète, pour $t=1..9$ : $x=12{,}5;\ 10;\ 10{,}5;\ 14;\ 11{,}5;\ 12;\ 15{,}5;\ 13;\ 13{,}5$.</p>
<table><tr><th>Filtre</th><th>Résultat</th><th>Lecture</th></tr>
<tr><td>MA d’ordre 3 ($q=1$)</td><td>$11;\ 11{,}5;\ 12;\ \dots;\ 14$ ($t=2..8$)</td><td>exactement la tendance $10+0{,}5t$ : saison effacée, 2 points perdus</td></tr>
<tr><td>$\nabla$</td><td>$-2{,}5;\ 0{,}5;\ 3{,}5;\ -2{,}5;\dots$</td><td>tendance partie, saison toujours là</td></tr>
<tr><td>$\nabla_3$</td><td>$1{,}5$ partout</td><td>saison et tendance parties ; il reste la constante $3b=1{,}5$</td></tr>
<tr><td>$\nabla^2$</td><td>$3;\ 3;\ -6;\ 3;\dots$</td><td>la saison reste</td></tr></table>
<p>Lissage exponentiel avec $\alpha=0{,}3$ et $y_1=x_1$ : $y_2=0{,}3\times10+0{,}7\times12{,}5=11{,}75$ ; $y_3=0{,}3\times10{,}5+0{,}7\times11{,}75=11{,}375$ ; $y_4=12{,}16$.</p>
<p><b>Yule-Slutsky calculé</b> : moyenne de 3 bruits blancs successifs $y_t=\frac13(W_{t-1}+W_t+W_{t+1})$. Alors $y_t$ et $y_{t+1}$ partagent deux chocs sur trois : corrélation $2/3$ au délai 1, $1/3$ au délai 2, alors que les $W_t$ sont non corrélés.</p>
<h4>3. Pièges</h4>
<ul><li>$\nabla_{12}$ (une différence à 12 pas) et $\nabla^{12}$ (douze différences premières) sont deux opérations différentes.</li>
<li>Une moyenne mobile symétrique ne donne rien sur les $q$ dernières dates : sur des données en flux, c’est justement le présent qui manque.</li>
<li>Une oscillation visible après lissage peut être créée par le lissage lui-même (Yule-Slutsky).</li></ul>
<h4>4. Lien finance</h4>
<p>Les moyennes mobiles de cours (50 ou 200 jours) sont courantes en analyse technique. Le lissage exponentiel sert à estimer la volatilité : le modèle EWMA de RiskMetrics (J.P. Morgan, 1996) met à jour la variance par $\sigma_t^2=\lambda\sigma_{t-1}^2+(1-\lambda)r_{t-1}^2$ avec $\lambda=0{,}94$ en données journalières ; c’est le lissage du cours appliqué aux rendements au carré, avec $\alpha=1-\lambda=0{,}06$.</p>
<h4>À retenir</h4>
<ul><li>$\nabla$ : tendance linéaire ; $\nabla^2$ : quadratique ; $\nabla_s$ : tendance entre valeurs distantes de $s$.</li>
<li>Moyenne mobile d’ordre égal à la période : efface une saison additive, garde une tendance linéaire, perd les bords.</li>
<li>Tout filtre crée des corrélations artificielles ($-1/2$ pour $\nabla$ d’un bruit blanc, $2/3$ pour une MA d’ordre 3).</li>
<li>Lissage exponentiel : $y_t=\alpha x_t+(1-\alpha)y_{t-1}$.</li></ul>`,
      },
      {
        id: 'ts-acf', title: 'Autocorrélogramme empirique', slides: '01 · 50-66',
        summary: 'rk = Σ(xt − x̄)(xt+k − x̄) / Σ(xt − x̄)². Bruit blanc : 95 % des rk dans ±2/√N. Décroissance lente = non-stationnaire ; bâtonnets à 12, 24 = saison.',
        fiche: R`
<p><b>L’idée.</b> On mesure à quel point la série ressemble à elle-même décalée de $k$ pas. Le graphe de ces corrélations en fonction de $k$ (le corrélogramme) est l’outil principal du cours : il révèle tendance, saison et mémoire de la série.</p>
<h4>1. Définitions</h4>
<p>Rappel : pour un échantillon $(x_i,y_i)_{i=1..N}$, le coefficient de corrélation vaut $r=\dfrac{\sum(x_i-\bar x)(y_i-\bar y)}{\sqrt{\sum(x_i-\bar x)^2\sum(y_i-\bar y)^2}}$ ($\bar x$ : moyenne des $x_i$). On parle d’<b>autocorrélation</b> quand $x$ et $y$ sont la même série, décalée.</p>
<div class="def"><b>Coefficient d’autocorrélation de délai $k$</b> :
$$r_k=\frac{\sum_{t=1}^{N-k}(x_t-\bar x)(x_{t+k}-\bar x)}{\sum_{t=1}^N(x_t-\bar x)^2}.$$
Le numérateur additionne les $N-k$ produits des écarts à la moyenne de valeurs distantes de $k$ ; le dénominateur est la somme des carrés des écarts. Si la série est stationnaire, $r_k$ estime $\rho_k=\mathrm{cov}(x_t,x_{t+k})/\mathrm{var}(x_t)$. Le graphe de $r_k$ en fonction de $k$ est l’<b>autocorrélogramme</b>.</div>
<h4>2. Savoir-faire : $r_k$ à la main</h4>
<p>Prenons $x=1,3,2,4,3,5$ ($N=6$).</p>
<ol><li>Moyenne : $\bar x=18/6=3$. Écarts : $-2,\ 0,\ -1,\ 1,\ 0,\ 2$.</li>
<li>Dénominateur : $4+0+1+1+0+4=10$.</li>
<li>Délai 1 : $(-2)(0)+(0)(-1)+(-1)(1)+(1)(0)+(0)(2)=-1$, donc $r_1=-0{,}1$.</li>
<li>Délai 2 : $(-2)(-1)+(0)(1)+(-1)(0)+(1)(2)=4$, donc $r_2=0{,}4$.</li>
<li>Bande du bruit blanc : $2/\sqrt6=0{,}82$. Aucun coefficient n’est significatif : avec 6 points, on ne peut rien conclure.</li></ol>
<h4>3. Le cas du bruit blanc</h4>
<div class="thm">Pour une série complètement aléatoire ($W_t=GWN(0,1)$, bruit blanc gaussien) et $N$ assez grand, $r_k\approx0$ ; plus précisément $r_k\overset{\mathcal L}{\approx}\mathcal N(0,1/N)$ (loi normale d’écart type $1/\sqrt N$). Environ 95 % des coefficients, soit 19 sur 20, tombent dans $[-2/\sqrt N,\,2/\sqrt N]$.</div>
<p>Conséquence : sur les 20 premiers coefficients d’un bruit blanc, un en moyenne sort de la bande par hasard. D’où la difficulté de lire un corrélogramme. Illustrations du cours : $N=169$ (bande $\pm0{,}154$) et $N=49$ (bande $\pm0{,}286$).</p>
<h4>4. Lire un corrélogramme</h4>
<ul><li><b>Stationnaire</b> : corrélations à court terme ; $r_1$ grand, puis $|r_k|$ décroît vite vers 0.</li>
<li><b>Non stationnaire</b> : les $r_k$ ne décroissent pas vite. Avec une tendance, ce qui est tracé n’est pas une vraie autocorrélation ($r_k$ n’estime aucun $\rho_k$, qui n’existe pas).</li>
<li><b>Saison</b> : grands bâtonnets aux délais 12, 24, … (série encore non stationnaire) ; l’écart entre deux grands bâtonnets successifs donne la période.</li>
<li><b>Série stationnarisée</b> (log de M, $\nabla$ puis $\nabla_{12}$) : les bâtonnets rentrent rapidement dans la bande.</li></ul>
<p><b>Donnée réelle</b> (indice BRI du TP0, 168 trimestres) : $r_1=0{,}980$, $r_2=0{,}961$, $r_3=0{,}943$, $r_4=0{,}927$ ; la décroissance lente signale la tendance. Sur la croissance trimestrielle $\nabla\ln x_t$ (1973-2004, 127 valeurs, bande $\pm0{,}177$) : $r_1=-0{,}293$, $r_4=0{,}279$, $r_5=-0{,}217$ sortent de la bande, les autres non.</p>
<h4>5. Pièges</h4>
<ul><li>Un coefficient isolé hors bande, à un délai sans interprétation, est souvent le hasard (1 sur 20).</li>
<li>Une décroissance lente ne mesure pas une « forte mémoire » : elle signale une tendance à retirer d’abord.</li>
<li>Avec $N$ petit, la bande est large : l’absence de bâtonnet significatif ne prouve pas l’indépendance.</li></ul>
<h4>6. Lien finance</h4>
<p>Le corrélogramme des rendements d’actions est en général proche de zéro (peu de prévisibilité linéaire), alors que celui des rendements au carré ou en valeur absolue est positif sur de nombreux délais : les périodes agitées se regroupent (regroupement de volatilité). Le premier est un test rapide d’efficience, le second justifie les modèles de volatilité.</p>
<p class="muted">Bilan de la leçon (slide 65) : définition, visualisation, décomposition, outils (ajustement, filtrage, autocorrélation) pour une première analyse ; mise en pratique dans le TP Python (slide 66).</p>
<h4>À retenir</h4>
<ul><li>$r_k$ : covariance empirique au délai $k$ divisée par la variance empirique.</li>
<li>Bruit blanc : $r_k\approx\mathcal N(0,1/N)$, bande $\pm2/\sqrt N$, un dépassement sur 20 attendu.</li>
<li>Décroissance lente : tendance ; bâtonnets à 12, 24 : saison ; retour rapide dans la bande : stationnaire.</li></ul>`,
      },
      {
        id: 'ts-stat', title: 'Processus stochastiques et stationnarité', slides: '02 · 3-30',
        summary: 'Une série observée = une réalisation finie d’un processus {Xt}. Stationnarité stricte (lois jointes invariantes) ou faible (moyenne, variance, covariances indépendantes de t). Bruit blanc ; la marche aléatoire n’est pas stationnaire.',
        fiche: R`
<p><b>L’idée.</b> On imagine que la série observée est un tirage parmi toutes les histoires possibles d’un phénomène aléatoire. Pour apprendre quelque chose à partir d’une seule histoire, il faut que ce phénomène garde les mêmes propriétés au cours du temps : c’est la stationnarité.</p>
<h4>1. Définitions</h4>
<p>Définition informelle : un phénomène statistique qui évolue dans le temps selon des lois de probabilité (longueur d’une file d’attente, taille d’une colonie de bactéries, température de jours successifs). Synonymes : processus aléatoire, fonction aléatoire. Il généralise la variable aléatoire.</p>
<div class="def"><b>Processus stochastique</b> : famille de variables aléatoires $X_t$ définies sur un même espace probabilisé $(\Omega,\mathcal A,\mathbb P)$ (l’univers des issues possibles $\Omega$, les événements $\mathcal A$, la probabilité $\mathbb P$), indexées par $t\in T\subset\mathbb R$, l’espace des temps : discret ($T\subset\mathbb Z$) ou continu.<br>
Notations : $\{X_t\}$ le processus, $\{x_t\}$ une réalisation particulière. Une série observée $(x_1,\dots,x_N)$ est <b>une</b> réalisation de longueur finie $N$ d’un processus discret $\{X_t,t\in\mathbb Z\}$, et c’est généralement la seule information disponible.</div>
<p>Exemples : mouvement brownien (Robert Brown, 1827, pollen en suspension ; diffusion, flux financiers) ; processus à accroissements indépendants $Y_t=\sum_{s=1}^tX_s$ ($X_s$ indépendants, $Y_t$ dépendants) ; chaîne de Markov stationnaire $\mathbb P(X_{t+1}=j\mid X_t=i)=p_{ij}$.</p>
<p><b>Rappels</b> : fonction de répartition $F_X(x)=\mathbb P(X\le x)$ ; densité $f_X$ avec $\mathbb P(a\le X\le b)=\int_a^bf_X$ ; moments $\mathbb E[X^k]=\int x^kf_X(x)dx$ ; variance $\mathbb E[(X-\mathbb E X)^2]$. <b>Égalité en loi</b> $X\overset{\mathcal L}=Y$ : même fonction de répartition. Elle n’implique pas $X=Y$ : pile/face ($X$) et son inverse ($Y=1-X$) ont la même loi mais ne sont jamais égaux.</p>
<p>Connaître un processus, c’est connaître toutes ses <b>lois fini-dimensionnelles</b> $F_{t_1..t_h}(x_1..x_h)=\mathbb P(X_{t_1}\le x_1,\dots,X_{t_h}\le x_h)$ pour tous $h$, $t_i$, $x_i$. Impossible à estimer quand $h$ grandit : on résume par les moments d’ordre 1 et 2.</p>
<div class="def"><b>Stationnarité stricte</b> : les densités jointes sont invariantes par translation, $f_{t_1..t_h}=f_{t_1+k..t_h+k}$ pour tous $h,t_i,k$ (ex. : processus qui tendent vers l’équilibre ; difficile à utiliser).<br>
<b>Stationnarité faible</b> (du second ordre) : $\mathbb E(X_t)=\mu$, $\mathrm{Var}(X_t)=\sigma_x^2$, $\mathrm{Cov}(X_t,X_{t+k})=\gamma_k$, <b>indépendants de $t$</b>. Aucune hypothèse au-delà de l’ordre 2 ; $\gamma_0=\sigma_x^2$.<br>
Stricte ⇒ faible (si les moments d’ordre 2 existent) ; la réciproque est fausse, sauf pour un processus <b>gaussien</b>, entièrement décrit par ses moments d’ordre 1 et 2.</div>
<p>Intérêt : beaucoup moins de paramètres à estimer.</p>
<div class="def"><b>Bruit blanc faible</b> $\{W_t\}$ : $\mathbb E(W_t)=0$, $\mathrm{Var}(W_t)=\sigma_w^2$, $\mathrm{Cov}(W_t,W_{t+k})=0$ pour $k\neq0$. <b>Fort</b> si les $W_t$ sont en plus indépendants. Gaussien : $GWN(0,\sigma^2)$, $W_t\overset{\mathcal L}=\mathcal N(0,\sigma_w^2)$ ; i.i.d. : $IWN(0,\sigma^2)$. Le nom vient de la lumière blanche : même intensité à toutes les fréquences.</div>
<h4>2. La marche aléatoire</h4>
<div class="def">$X_t=X_{t-1}+Z_t$, $X_0=0$, où $\{Z_t\}$ est de moyenne $\mu$ et de variance $\sigma_Z^2$ ; donc $X_t=\sum_{i=1}^tZ_i$ (« centrée » si $\mu=0$).</div>
<p><b>Calcul</b> (exercice du cours) : $\mathbb E(X_t)=t\mu$ et $\mathrm{Var}(X_t)=t\sigma_Z^2$ (somme de $t$ termes non corrélés). Pour la covariance, on écrit $X_{t+h}=X_t+(X_{t+h}-X_t)$, où $X_{t+h}-X_t=Z_{t+1}+\dots+Z_{t+h}$ ne partage aucun terme avec $X_t$ :
$$\mathrm{Cov}(X_t,X_{t+h})=\mathrm{Cov}(X_t,X_{t+h}-X_t)+\mathrm{Var}(X_t)=t\sigma_Z^2.$$
Tout dépend de $t$ : la variance augmente avec le temps, le processus <b>n’est pas stationnaire</b>. Mouvement brownien, chemin d’une molécule dans un gaz, « marche de l’ivrogne ». Le cours la simule en Python avec des pas $\pm1$ équiprobables (1000 pas, <code>seed(1)</code>).</p>
<p><b>Exemple chiffré</b> : la corrélation vaut $\dfrac{t\sigma_Z^2}{\sqrt{t\sigma_Z^2\,(t+h)\sigma_Z^2}}=\sqrt{\dfrac t{t+h}}$. À $t=100$, $h=1$ : $\sqrt{100/101}=0{,}995$. Le slide 02·24 écrit « $X_t$ pas corrélé avec $X_{t-1}$ » : le calcul montre l’inverse ; c’est sans doute le pas $Z_t$ qui n’est pas corrélé avec $X_{t-1}$. <i>À confirmer avec le Prof. Siebert (slide 02·24).</i> Avec une dérive $\mu=0{,}1$ et $\sigma_Z=2$, à $t=25$ : moyenne $2{,}5$, écart type $2\sqrt{25}=10$ : la dispersion domine largement la dérive.</p>
<h4>3. Vérifier la stationnarité</h4>
<ol><li>Inspection visuelle (cas simples seulement).</li>
<li>Test de <b>Dickey-Fuller augmenté</b> : <code>from statsmodels.tsa.stattools import adfuller</code> puis <code>adfuller(timeseries, autolag='AIC')</code>. Hypothèse nulle : non-stationnarité (racine unitaire). Si p-value &lt; 0,05, on rejette la non-stationnarité. (statsmodels n’est pas installé dans l’environnement Python actuel : <code>pip install statsmodels</code>.)</li>
<li>Fonctions d’autocovariance et d’autocorrélation (section suivante).</li></ol>
<h4>4. Pièges</h4>
<ul><li>Bruit blanc faible n’implique pas indépendance : des $W_t$ non corrélés peuvent avoir des carrés corrélés.</li>
<li>Stricte ⇒ faible exige des moments d’ordre 2 finis.</li>
<li>Une p-value ADF supérieure à 0,05 ne prouve pas la non-stationnarité : on ne rejette simplement pas l’hypothèse nulle.</li></ul>
<h4>5. Lien finance</h4>
<p>Le log d’un prix se modélise classiquement comme une marche aléatoire (avec dérive) : non stationnaire, variance qui croît avec l’horizon (le risque à 10 jours est environ $\sqrt{10}$ fois le risque à 1 jour quand les pas sont non corrélés). Ses accroissements, les rendements en log, sont proches d’un bruit blanc <b>faible</b> mais pas fort, car la volatilité varie : exactement la distinction faible/fort du cours.</p>
<h4>À retenir</h4>
<ul><li>Une série = une réalisation finie d’un processus ; on n’en a qu’une.</li>
<li>Stationnarité faible : $\mu$, $\sigma^2$, $\gamma_k$ ne dépendent pas de $t$. Stricte ⇒ faible ; égalité pour un gaussien.</li>
<li>Bruit blanc : moyenne nulle, variance constante, non corrélé (fort : indépendant).</li>
<li>Marche aléatoire : $\mathrm{Var}(X_t)=t\sigma_Z^2$, corrélation $\sqrt{t/(t+h)}$ : non stationnaire.</li></ul>`,
      },
      {
        id: 'ts-acvf', title: 'Autocovariance, ACF et PACF théoriques', slides: '02 · 31-46',
        summary: 'γk = Cov(Xt, Xt+k), ρk = γk/γ0, |ρk| ≤ 1. PACF φkk : corrélation entre Xt et Xt+k une fois retirée l’influence des valeurs intermédiaires.',
        fiche: R`
<p><b>L’idée.</b> Pour un processus stationnaire, toute la dépendance d’ordre 2 tient dans une suite de nombres : la covariance entre deux valeurs séparées de $k$ pas. On la normalise pour obtenir l’ACF ; la PACF y ajoute une question plus fine : reste-t-il un lien direct une fois les valeurs intermédiaires prises en compte ?</p>
<h4>1. Définitions</h4>
<div class="def"><b>Autocovariance</b> (processus stationnaire) : $\gamma_k=\mathrm{Cov}(X_t,X_{t+k})=\mathbb E[(X_t-\mu)(X_{t+k}-\mu)]$, la même pour tout $t$. Elle étend la matrice de covariance à une famille infinie de variables.<br>
Propriétés : bilinéarité $\mathrm{Cov}(aX+bY,Z)=a\,\mathrm{Cov}(X,Z)+b\,\mathrm{Cov}(Y,Z)$ ; $\gamma_0=\sigma_x^2\ge0$ ; $\gamma_k=\gamma_{-k}$ ; $|\gamma_k|\le\gamma_0$.<br>
<b>Autocorrélation</b> (ACF, <i>auto-correlation function</i>) : $\rho_k=\gamma_k/\gamma_0=\gamma_k/\sigma_x^2$ ; $\rho_0=1$, $-1\le\rho_k\le1$, $\rho_k=\rho_{-k}$. La parité permet de ne tracer que $k\ge0$.</div>
<p><b>Preuve de $|\gamma_k|\le\gamma_0$</b> (à savoir refaire) : une variance est positive, donc pour tous $\lambda_1,\lambda_2$, $\mathrm{Var}[\lambda_1X_t+\lambda_2X_{t+k}]=(\lambda_1^2+\lambda_2^2)\sigma^2+2\lambda_1\lambda_2\gamma_k\ge0$. Avec $\lambda_1=\lambda_2=1$ : $\gamma_k\ge-\sigma^2$ ; avec $\lambda_1=1,\lambda_2=-1$ : $\gamma_k\le\sigma^2$.</p>
<p><b>Non-unicité</b> : plusieurs processus peuvent avoir la même ACF (voir l’inversibilité), ce qui complique l’interprétation.</p>
<p><b>Estimateurs</b> (série $\{x_1..x_N\}$ supposée stationnaire) : $\hat\mu=\frac1N\sum x_t$, $s_x^2=\frac1N\sum(x_t-\hat\mu)^2$, $c_k=\hat\gamma_k=\frac1N\sum_{t=1}^{N-k}(x_t-\hat\mu)(x_{t+k}-\hat\mu)$, $r_k=\hat\rho_k=c_k/c_0$. Bruit blanc : $\rho_k=0$ pour $k\neq0$ et $\hat\rho_k\approx\mathcal N(0,1/N)$, donc $\mathbb P(|\hat\rho_k|>1{,}96/\sqrt N)\approx0{,}05$.</p>
<h4>2. Savoir-faire : l’exemple 2 du cours</h4>
<p>$X_t=2+W_t-W_{t-1}$, $W$ bruit blanc de variance $\sigma^2$. La constante 2 ne change aucune covariance.</p>
<ol><li>$\gamma_0=\mathrm{Var}(W_t)+\mathrm{Var}(W_{t-1})=2\sigma^2$ (termes non corrélés).</li>
<li>$\gamma_1=\mathrm{Cov}(W_t-W_{t-1},W_{t+1}-W_t)$ : seul le terme commun $W_t$ compte, avec les signes $(+1)(-1)$ : $\gamma_1=-\sigma^2$.</li>
<li>$\gamma_k=0$ pour $|k|\ge2$ (aucun choc commun).</li>
<li>$\rho_1=-\sigma^2/2\sigma^2=-1/2$, $\rho_k=0$ ensuite. Les $r_k$ calculés sur une simulation en diffèrent légèrement.</li></ol>
<p>Le corrélogramme sert à détecter une <b>tendance</b> (décroissance légère de $r_k$), la <b>stationnarité</b> (décroissance rapide, bornée par une exponentielle négative) et des <b>phénomènes périodiques</b>.</p>
<h4>3. Autocorrélation partielle (PACF)</h4>
<div class="def">$\phi_{kk}$ : corrélation partielle entre $X_t$ et $X_{t+k}$ <b>étant donné</b> $X_{t+1},\dots,X_{t+k-1}$. On régresse $X_{t+k}$ et $X_t$ sur les valeurs intermédiaires :
$X_{t+k}=\alpha_1X_{t+1}+\dots+\alpha_{k-1}X_{t+k-1}+U$, $X_t=\beta_1X_{t+1}+\dots+\beta_{k-1}X_{t+k-1}+V$, puis $\phi_{kk}$ mesure le lien entre les résidus $U$ et $V$ (le slide écrit $\mathrm{Cov}(U,V)$ ; normalisé, c’est leur corrélation). Si $X_t$ et $X_{t+k}$ ne sont liés qu’au travers des valeurs intermédiaires, $\phi_{kk}=0$. Estimation itérative à partir des $r_k$ : algorithme de <b>Durbin-Levinson</b>.</div>
<p><b>Les deux premiers termes</b> (Durbin-Levinson) : $\phi_{11}=\rho_1$ et $\phi_{22}=\dfrac{\rho_2-\rho_1^2}{1-\rho_1^2}$.</p>
<ul><li>AR(1) avec $\phi=0{,}6$ : $\rho_1=0{,}6$, $\rho_2=0{,}36$, donc $\phi_{22}=(0{,}36-0{,}36)/0{,}64=0$ : tout le lien à 2 pas passe par la valeur intermédiaire.</li>
<li>MA(1) avec $\rho_1=-0{,}4$, $\rho_2=0$ : $\phi_{22}=-0{,}16/0{,}84=-0{,}190$ : la PACF ne s’annule pas.</li>
<li>Donnée réelle (croissance de l’indice BRI, 1973-2004) : PACF $-0{,}293$ ; $-0{,}114$ ; $0{,}094$ ; $0{,}385$ ; puis petite. Le pic au délai 4 (un an en trimestriel) sera exploité dans Box-Jenkins.</li></ul>
<h4>4. Pièges</h4>
<ul><li>$\gamma_k$ dépend de l’unité de mesure, $\rho_k$ non.</li>
<li>Le cours divise $c_k$ par $N$, même s’il n’y a que $N-k$ produits.</li>
<li>ACF et PACF répondent à deux questions différentes : lien total, lien direct.</li></ul>
<h4>5. Lien finance</h4>
<p>Pour un rendement mensuel, la PACF dit combien de mois passés apportent une information <b>propre</b> : c’est elle qui fixe le nombre de retards d’un modèle autorégressif de taux ou de spreads.</p>
<h4>À retenir</h4>
<ul><li>$\gamma_k=\mathrm{Cov}(X_t,X_{t+k})$, $\rho_k=\gamma_k/\gamma_0$, $|\rho_k|\le1$, fonctions paires.</li>
<li>$X_t=c+W_t-W_{t-1}$ : $\rho_1=-1/2$, puis 0.</li>
<li>PACF : $\phi_{11}=\rho_1$, $\phi_{22}=(\rho_2-\rho_1^2)/(1-\rho_1^2)$ ; Durbin-Levinson pour la suite.</li></ul>`,
      },
      {
        id: 'ts-linear', title: 'Processus linéaires, Wold, inversibilité', slides: '02 · 48-74',
        summary: 'Xt = μ + Σ ψj Wt−j, stationnaire si Σψj² < ∞. Wold : tout stationnaire = linéaire + déterministe. Inversible si Wt s’écrit avec les Xt passés (Σ|Πj| < ∞). MA(1) inversible ⇔ |θ| < 1 ; AR(1) stationnaire ⇔ |φ| < 1.',
        fiche: R`
<p><b>L’idée.</b> Presque tout processus stationnaire s’écrit comme une somme pondérée de chocs passés. Les poids $\psi_j$ disent combien un choc d’il y a $j$ périodes pèse encore aujourd’hui. Inversement, on veut pouvoir retrouver les chocs à partir des observations : c’est l’inversibilité.</p>
<h4>1. Processus linéaires</h4>
<div class="def"><b>Processus linéaire</b> : $X_t=\mu+W_t+\psi_1W_{t-1}+\psi_2W_{t-2}+\dots=\mu+\sum_{i\ge0}\psi_iW_{t-i}$, $\psi_0=1$, $\mu,\psi_j\in\mathbb R$. $W_t$ : bruit blanc de variance $\sigma_w^2$ ; $\psi_j$ : poids du choc d’il y a $j$ pas. Cette forme, qui n’utilise que le passé, est <b>causale</b> ; une somme sur $i$ de $-\infty$ à $+\infty$ dépendrait de chocs futurs (non causale, moins naturelle). Elle inclut les ARMA.</div>
<div class="thm"><b>Propriété</b> : si $\sum_j\psi_j^2<\infty$, le processus a des moments d’ordre 2 finis et est <b>faiblement stationnaire</b>, avec
$\mathbb E(X_t)=\mu$, $\mathrm{Var}(X_t)=\sigma_w^2\sum_j\psi_j^2$, $\gamma_k=\sigma_w^2\sum_j\psi_j\psi_{j+k}$.<br>
<b>Justification</b> (les « justifier » du slide 51) : l’espérance vient de $\mathbb E(W_t)=0$ ; dans la variance, les doubles produits $\mathbb E(W_{t-i}W_{t-j})$, $i\neq j$, sont nuls ; dans $\mathrm{Cov}(X_t,X_{t+k})$, seuls les couples qui portent le même choc ($W_{t-j}$ dans $X_t$ avec le poids $\psi_j$, dans $X_{t+k}$ avec le poids $\psi_{j+k}$) contribuent. Rien ne dépend de $t$.</div>
<p>On supposera souvent $\mu=0$ (processus centré), ce qui ne restreint rien.</p>
<p><b>Exemple</b> : $\psi_j=0{,}5^j$, $\sigma_w=1$. $\mathrm{Var}=\sum0{,}25^j=1/(1-0{,}25)=1{,}333$ ; $\gamma_1=\sum0{,}5^j0{,}5^{j+1}=0{,}5/0{,}75=0{,}667$ ; $\rho_1=0{,}5$. (C’est l’AR(1) de paramètre 0,5, voir plus bas.)</p>
<h4>2. Wold</h4>
<p><b>Déterministe ou non</b> : soit $X_{t,q}$ la régression linéaire de $X_t$ sur $X_{t-q},X_{t-q-1},\dots$ et $\sigma_q^2=\mathrm{var}(X_t-X_{t,q})\le\mathrm{var}(X_t)$, qui augmente avec $q$ et a donc une limite. Si cette limite vaut $\mathrm{var}(X_t)$, le passé lointain n’apprend rien : $X_t$ est <b>purement non déterministe</b>. Si elle est plus petite, $X_t$ contient une composante <b>purement déterministe</b>. Exemple : $X_t=K\cos(\omega t+\theta)$ avec $\theta$ uniforme sur $[0,2\pi]$ mais fixé pour une réalisation : $\mathbb E(X_t)=0$, et une fois $\theta$ estimé, la suite est entièrement prévisible.</p>
<div class="thm"><b>Théorème de Wold (1938).</b> Version 1 : tout processus faiblement stationnaire s’écrit $X_t=R_t+D_t$, avec $D_t$ purement déterministe, $R_t$ purement non déterministe, non corrélés. Version 2 : $X_t=\sum_{i\ge0}\psi_iW_{t-i}+\kappa_t$, avec $\psi_0=1$, $\sum\psi_j^2<\infty$, $\kappa_t$ déterministe et $W_t$ l’<b>innovation</b> (« choc aléatoire »). Le slide 56 le prend gaussien ; l’énoncé général ne demande qu’un bruit blanc non corrélé. <i>À confirmer avec le Prof. Siebert (slide 02·56).</i></div>
<p>Wold n’est jamais applicable tel quel (somme infinie) ; mais pour tout processus stationnaire, une somme tronquée à un ordre fini l’approche (décomposition de Wold tronquée). C’est la justification des modèles linéaires.</p>
<h4>3. Inversibilité</h4>
<div class="def">Dans $X_t=W_t+\psi_1W_{t-1}+\dots$, on isole $W_t=X_t-\psi_1W_{t-1}-\dots$, on remplace $W_{t-1}$ par la même relation, et ainsi de suite. Par récurrence : $X_t=W_t+\Pi_1X_{t-1}+\Pi_2X_{t-2}+\dots$, avec $\Pi_1=\psi_1$, $\Pi_2=\psi_2-\psi_1^2$… ($\Pi_j$ : le poids de $X_{t-j}$). Le processus est <b>inversible</b> si $\sum_{j\ge1}|\Pi_j|<\infty$.<br>
<b>Propriété</b> : la correspondance entre processus linéaires inversibles et fonctions d’autocorrélation est bijective : un processus inversible est entièrement déterminé par son ACF.</div>
<p><b>MA(1)</b> $X_t=W_t-\theta W_{t-1}$ : linéaire avec $\psi_1=-\theta$, $\psi_j=0$ ensuite, donc toujours stationnaire. En substituant $W_{t-1}=X_{t-1}+\theta W_{t-2}$ : $X_t=W_t-\theta X_{t-1}-\theta^2X_{t-2}-\dots=W_t-\sum_j\theta^jX_{t-j}$. Inversible ssi $\sum|\theta|^j<\infty$, soit $|\theta|<1$. ACF : $\gamma_0=\sigma_w^2(1+\theta^2)$, $\gamma_1=-\theta\sigma_w^2$, $\rho_1=-\theta/(1+\theta^2)$, $\rho_k=0$ pour $k>1$.</p>
<ul><li>$\theta=0{,}5$ : $X_t=W_t-0{,}5X_{t-1}-0{,}25X_{t-2}-\dots$, poids qui s’éteignent. $\theta=2$ : poids $-2^j$ qui explosent.</li>
<li>Exemples du cours : $X_t=W_t+0{,}4W_{t-1}$ donne $\rho_1=0{,}4/1{,}16=0{,}345$ ; $X_t=W_t-0{,}9W_{t-1}$ donne $\rho_1=-0{,}9/1{,}81=-0{,}497$.</li>
<li>$\theta$ et $1/\theta$ donnent le même $\rho_1$ : $\frac{-1/\theta}{1+1/\theta^2}=\frac{-\theta}{\theta^2+1}$. Comme un processus inversible est caractérisé par son ACF, un seul des deux est inversible.</li></ul>
<p><b>AR(1)</b> (processus de Markov) $X_t=W_t+\phi X_{t-1}$ : toujours inversible (il est déjà écrit en fonction du passé). Par récursion $X_t=\sum_j\phi^jW_{t-j}$ : stationnaire ssi $\sum\phi^{2j}<\infty$, soit $|\phi|<1$. Exemple du cours $\phi=0{,}7$ : $\rho_k=0{,}7^k$, soit $0{,}7$ ; $0{,}49$ ; $0{,}343$.</p>
<p>AR(p), MA(q) et ARMA(p,q) sont linéaires mais pas nécessairement stationnaires ni inversibles : les sections suivantes donnent les conditions.</p>
<h4>4. Pièges</h4>
<ul><li>Stationnarité et inversibilité sont deux conditions distinctes : un MA est toujours stationnaire, pas toujours inversible ; un AR l’inverse.</li>
<li>Un MA non inversible ne permet pas de reconstruire les chocs à partir des données, donc ni les résidus ni les prévisions : les logiciels imposent la version inversible.</li></ul>
<h4>5. Lien finance</h4>
<p>Les $\psi_j$ forment la <b>fonction de réponse impulsionnelle</b> : avec $\phi=0{,}7$, une surprise de 1 % sur un rendement pèse encore $0{,}343$ % trois périodes plus tard. Les innovations $W_t$ sont les nouvelles que le passé ne permettait pas de prévoir.</p>
<h4>À retenir</h4>
<ul><li>Linéaire causal $X_t=\mu+\sum\psi_jW_{t-j}$ ; stationnaire si $\sum\psi_j^2<\infty$ ; $\gamma_k=\sigma_w^2\sum\psi_j\psi_{j+k}$.</li>
<li>Wold : stationnaire = linéaire en innovations + déterministe.</li>
<li>Inversible si $\sum|\Pi_j|<\infty$ ; alors l’ACF détermine le processus.</li>
<li>MA(1) inversible ssi $|\theta|<1$ ; AR(1) stationnaire ssi $|\phi|<1$.</li></ul>`,
      },
      {
        id: 'ts-ar', title: 'Processus autorégressifs AR(p)', slides: '02 · 76-98',
        summary: 'Φp(B)Xt = Wt. Stationnaire ⇔ racines de Φp(z) hors du cercle unité. Yule-Walker ρk = Σ φi ρk−i. ACF qui décroît (exponentielles, sinusoïdes amorties), PACF nulle après p.',
        fiche: R`
<p><b>L’idée.</b> La valeur d’aujourd’hui est une combinaison linéaire des $p$ valeurs précédentes plus un choc. Toute la théorie se ramène à un polynôme : ses racines disent si le processus est stationnaire, et ses coefficients donnent l’ACF par une récurrence simple.</p>
<h4>1. Origine</h4>
<p>Yule (1927) étudie la périodicité des taches solaires avec $X_t=\alpha X_{t-1}+\beta X_{t-2}$, une équation aux différences (l’équivalent discret d’une équation différentielle ; la transformée en $Z$ joue le rôle de Laplace). Ses solutions dépendent des racines $r_1,r_2$ de l’équation caractéristique $z^2-\alpha z-\beta=0$, de discriminant $\Delta=\alpha^2+4\beta$ :</p>
<ul><li>$\Delta>0$ : $Ar_1^t+Br_2^t$ ;</li><li>$\Delta=0$ : $(A+Bt)r^t$ ;</li>
<li>$\Delta<0$ : $\rho^t(A\cos\theta t+B\sin\theta t)$ avec $\rho=\sqrt{-\beta}$, oscillations amorties si $0<\rho<1$. C’est ce cas qui intéresse Yule : une équation linéaire simple génère des oscillations.</li></ul>
<p>Le slide 78 donne l’exemple $Y_t=1{,}8Y_{t-1}-0{,}8Y_{t-2}$ écrit $Y_t=-2\times0{,}9^t\cos(4t-\frac12)$. Les deux ne concordent pas : $z^2-1{,}8z+0{,}8=(z-1)(z-0{,}8)$ a des racines réelles ($\Delta=0{,}04>0$), d’où des solutions $A+B\,0{,}8^t$ sans oscillation. La formule en cosinus correspond à $\rho=0{,}9$, $\theta=4$, soit $\beta=-\rho^2=-0{,}81$ et $\alpha=2\rho\cos\theta\approx-1{,}177$ (vérifié numériquement). <i>À confirmer avec le Prof. Siebert (slide 02·78).</i></p>
<h4>2. Définition et opérateur retard</h4>
<div class="def"><b>AR(p)</b> : $X_t=W_t+\phi_1X_{t-1}+\dots+\phi_pX_{t-p}$, $\phi_j\in\mathbb R$, $\phi_p\neq0$, $W_t$ bruit blanc de moyenne nulle et de variance $\sigma_w^2$. L’observation s’explique linéairement par les précédentes (« mémoire longue »). Tout AR(p) est inversible ; sa stationnarité n’est pas automatique.</div>
<div class="def"><b>Opérateur retard</b> $B$ (<i>backwards</i>) : $BX_t=X_{t-1}$, $B^jX_t=X_{t-j}$, $B^0=I$ (identité) ; sa norme vaut $\sup_{\|X\|=1}\|B(X)\|=1$. Alors $\big(1-\sum_{j=1}^p\phi_jB^j\big)X_t=W_t$, soit $\Phi_p(B)X_t=W_t$ avec le polynôme $\Phi_p(z)=1-\phi_1z-\dots-\phi_pz^p$.<br>
<b>Filtre</b> : opérateur $A$ linéaire ($A(X+Y)=A(X)+A(Y)$) et invariant dans le temps ($A\circ B=B\circ A$) ; $B$ en est l’exemple de base. Lecture de $\Phi_p(B)X_t=W_t$ : une fois filtré par $\Phi_p(B)$, il ne reste de $X_t$ que le choc $W_t$ (on régresse la série sur ses retards et les résidus forment un bruit blanc).</div>
<p><b>AR(1) avec $B$</b> : $(1-\phi B)X_t=W_t$, donc $X_t=(1-\phi B)^{-1}W_t=(1+\phi B+\phi^2B^2+\dots)W_t$, $\mathbb E(X_t)=0$, $\mathrm{Var}(X_t)=\sigma_w^2(1+\phi^2+\phi^4+\dots)=\sigma_w^2/(1-\phi^2)$. La série géométrique $1/(1-\phi z)$ converge pour $|\phi z|<1$ ; $B$ étant de norme 1, la condition est $|\phi|<1$.</p>
<div class="thm"><b>Stationnarité.</b> L’AR(p) est stationnaire s’il s’écrit $X_t=\Phi_p(B)^{-1}W_t$ (série en $B$ inverse de $\Phi_p$) ; c’est le cas <b>si et seulement si toutes les racines complexes de $\Phi_p(z)$ sont de module $>1$</b> (hors du cercle unité). AR(1) : $1-\phi z=0\Rightarrow z=1/\phi$, et $|z|>1\Leftrightarrow|\phi|<1$.</div>
<p><b>Exemple du cours (processus de Yule)</b> : $X_t=W_t+\frac14X_{t-1}+\frac18X_{t-2}$. $\Phi_2(z)=1-\frac14z-\frac18z^2=-\frac18(z^2+2z-8)=-\frac18(z+4)(z-2)$ : racines $-4$ et $2$, hors du cercle, stationnaire. Pour l’inverser, fractions simples :
$$\frac{-8}{(z+4)(z-2)}=\frac43\Big(\frac1{z+4}-\frac1{z-2}\Big)=\frac13\cdot\frac1{1-(-\frac z4)}+\frac23\cdot\frac1{1-\frac z2},$$
donc $X_t=\sum_k\big[\frac13(-\frac14)^k+\frac23(\frac12)^k\big]W_{t-k}$. Contrôle : $\psi_0=\frac13+\frac23=1$, $\psi_1=-\frac1{12}+\frac13=\frac14=\phi_1$. Le slide 89 écrit $-\frac23$ devant la seconde série, ce qui donnerait $\psi_0=-\frac13$. <i>À confirmer avec le Prof. Siebert (slide 02·89).</i></p>
<h4>3. Autocorrélation : Yule-Walker</h4>
<p>Pour un AR(p) stationnaire centré, $\gamma_k=\mathbb E(X_tX_{t-k})$. On multiplie la définition par $X_{t-k}$ ($k\ge1$) et on prend l’espérance ; $\mathbb E(W_tX_{t-k})=0$ car $X_{t-k}$ ne dépend que de chocs antérieurs à $t$ :</p>
<div class="thm"><b>Équations de Yule-Walker</b> : $\gamma_k=\phi_1\gamma_{k-1}+\dots+\phi_p\gamma_{k-p}$, et en divisant par $\gamma_0$ : $\rho_k=\phi_1\rho_{k-1}+\dots+\phi_p\rho_{k-p}$ pour $k\ge1$ (avec $\rho_{k-i}=\rho_{i-k}$).<br>
<b>Propriété</b> : le corrélogramme est dominé par des <b>exponentielles décroissantes ou des sinusoïdes amorties</b>. Preuve : la récurrence admet des solutions $\rho_k=\omega^k$ ; en divisant par $\omega^{k-p}$, on obtient l’équation caractéristique $\omega^p=\phi_1\omega^{p-1}+\dots+\phi_p$, de racines $\omega_i\in\mathbb C$. Donc $\rho_k=\sum_iC_i\omega_i^k$, les $C_i$ fixés par $\rho_0=1$ et les premières équations. Comme $\rho_k\to0$, il faut $|\omega_i|<1$ (les $\omega_i$ sont les inverses des racines de $\Phi_p$). AR(1) : $\rho_k=\phi^k$.<br>
<b>Variance</b> : $\sigma_x^2=\mathbb E[(\phi_1X_{t-1}+\dots+\phi_pX_{t-p}+W_t)X_t]=\phi_1\gamma_1+\dots+\phi_p\gamma_p+\sigma_w^2$ ; en divisant par $\sigma_x^2$ : $\sigma_x^2=\dfrac{\sigma_w^2}{1-\phi_1\rho_1-\dots-\phi_p\rho_p}$.<br>
<b>PACF</b> : $\phi_{kk}=0$ pour tout $k>p$ ; sa forme révèle l’ordre $p$.</div>
<h4>4. Savoir-faire : un AR(2) de bout en bout</h4>
<p>Prenons $X_t=0{,}5X_{t-1}+0{,}3X_{t-2}+W_t$.</p>
<ol><li><b>Stationnarité</b> : $\Phi_2(z)=1-0{,}5z-0{,}3z^2$ a pour racines $1{,}174$ et $-2{,}840$, toutes deux de module $>1$ : stationnaire.</li>
<li><b>$\rho_1$</b> : Yule-Walker à $k=1$, $\rho_1=\phi_1\rho_0+\phi_2\rho_{-1}=0{,}5+0{,}3\rho_1$, donc $\rho_1=\phi_1/(1-\phi_2)=0{,}5/0{,}7=0{,}714$.</li>
<li><b>Suite</b> : $\rho_2=0{,}5\times0{,}714+0{,}3=0{,}657$ ; $\rho_3=0{,}5\times0{,}657+0{,}3\times0{,}714=0{,}543$ : décroissance lente, sans coupure.</li>
<li><b>Variance</b> : $\sigma_x^2=\sigma_w^2/(1-0{,}5\times0{,}714-0{,}3\times0{,}657)=2{,}244\,\sigma_w^2$.</li>
<li><b>PACF</b> : $\phi_{11}=0{,}714$, $\phi_{22}=\phi_2=0{,}3$, puis 0.</li></ol>
<h4>5. Pièges</h4>
<ul><li>Racines de $\Phi_p(z)$ <b>hors</b> du cercle, racines $\omega_i$ de l’équation caractéristique <b>dans</b> le cercle : ce sont les inverses l’une de l’autre.</li>
<li>Des coefficients tous inférieurs à 1 ne suffisent pas : $\phi_1=0{,}6$, $\phi_2=0{,}4$ a la racine $z=1$, non stationnaire.</li>
<li>L’ordre d’un AR se lit sur la PACF ; son ACF ne s’annule jamais.</li></ul>
<h4>6. Lien finance</h4>
<p>Un taux d’intérêt ou un spread de crédit qui revient vers une moyenne se modélise souvent par un AR(1) (c’est la version discrète du modèle de Vasicek). La <b>demi-vie</b> d’un écart, le nombre de périodes pour qu’il soit divisé par deux, vaut $\ln0{,}5/\ln\phi$ : avec $\phi=0{,}95$ en mensuel, $13{,}5$ mois ; avec $\phi=0{,}7$, $1{,}9$ période.</p>
<h4>À retenir</h4>
<ul><li>$\Phi_p(B)X_t=W_t$ ; toujours inversible.</li>
<li>Stationnaire ssi toutes les racines de $\Phi_p(z)$ sont de module $>1$.</li>
<li>Yule-Walker $\rho_k=\sum\phi_i\rho_{k-i}$ ; AR(2) : $\rho_1=\phi_1/(1-\phi_2)$.</li>
<li>ACF : exponentielles ou sinusoïdes amorties ; PACF nulle après $p$ ; $\sigma_x^2=\sigma_w^2/(1-\sum\phi_i\rho_i)$.</li></ul>`,
      },
      {
        id: 'ts-ma', title: 'Processus moyenne mobile MA(q) et dualité AR-MA', slides: '02 · 100-110 ; 03 · 3-6',
        summary: 'Xt = Θq(B)Wt, toujours stationnaire, inversible ⇔ racines de Θq hors du cercle. ACF nulle après q (mémoire courte), PACF qui décroît. AR(p) se lit sur la PACF, MA(q) sur l’ACF.',
        fiche: R`
<p><b>L’idée.</b> La valeur d’aujourd’hui est une somme pondérée des $q$ derniers chocs. Un choc n’agit donc que pendant $q$ périodes, puis disparaît : la corrélation est exactement nulle au-delà de $q$. C’est la mémoire courte, miroir de l’AR.</p>
<h4>1. Origine et définition</h4>
<p>Slutsky (1927, la même année que Yule) génère avec les nombres de la loterie officielle une série qui reproduit le cycle économique anglais de 1855 à 1877, sous la forme $X_t=W_t-\theta_1W_{t-1}-\dots-\theta_qW_{t-q}$, les $W_t$ étant indépendants entre eux et du cycle. Interprétation économétrique : un indicateur subit des événements aléatoires (grèves, décisions gouvernementales) dont l’effet dure quelques périodes.</p>
<div class="def"><b>MA(q)</b> : $X_t=W_t-\theta_1W_{t-1}-\dots-\theta_qW_{t-q}=\Theta_q(B)W_t$, $\theta_q\neq0$, avec $\Theta_q(z)=1-\theta_1z-\dots-\theta_qz^q$. Attention au signe : le cours met des <b>moins</b> devant les $\theta$.<br>
Linéaire avec $\psi_j=-\theta_j$ ($j\le q$), 0 ensuite ; toujours <b>stationnaire</b> ($\sum\psi_j^2$ fini). <b>Inversible</b> ssi toutes les racines de $\Theta_q(z)$ sont de module $>1$ (MA(1) : $|\theta|<1$).</div>
<h4>2. Moments</h4>
<div class="thm">$\mathbb E(X_t)=0$ ; $\mathrm{Var}(X_t)=\sigma_w^2(1+\theta_1^2+\dots+\theta_q^2)$ (les chocs sont non corrélés).<br>
<b>Autocovariance</b> : $\gamma_k=\mathbb E(X_tX_{t+k})$ est nulle si $k>q$ (aucun choc commun : « mémoire courte »). Pour $1\le k\le q$, dans le produit $(W_t-\theta_1W_{t-1}-\dots)(W_{t+k}-\theta_1W_{t+k-1}-\dots)$ seuls les termes portant le même $W$ comptent :
$\gamma_k=\sigma_w^2(-\theta_k+\theta_1\theta_{k+1}+\dots+\theta_{q-k}\theta_q)$, d’où
$$\rho_k=\frac{-\theta_k+\theta_1\theta_{k+1}+\dots+\theta_{q-k}\theta_q}{1+\theta_1^2+\dots+\theta_q^2}\ (1\le k\le q),\qquad\rho_k=0\ (k>q).$$
<b>PACF</b> : dominée par des exponentielles décroissantes ou des sinusoïdes amorties. MA(1) : $\phi_{kk}=-\dfrac{\theta^k(1-\theta^2)}{1-\theta^{2(k+1)}}$.</div>
<h4>3. Savoir-faire</h4>
<p><b>MA(2)</b>, prenons $\theta_1=0{,}5$, $\theta_2=-0{,}3$, soit $X_t=W_t-0{,}5W_{t-1}+0{,}3W_{t-2}$.</p>
<ol><li>Dénominateur : $1+0{,}25+0{,}09=1{,}34$ (c’est aussi $\mathrm{Var}/\sigma_w^2$).</li>
<li>$\rho_1=\dfrac{-0{,}5+0{,}5\times(-0{,}3)}{1{,}34}=\dfrac{-0{,}65}{1{,}34}=-0{,}485$.</li>
<li>$\rho_2=\dfrac{-\theta_2}{1{,}34}=\dfrac{0{,}3}{1{,}34}=0{,}224$ ; $\rho_3=0$.</li>
<li>Inversibilité : $\Theta_2(z)=1-0{,}5z+0{,}3z^2$ a deux racines complexes de module $\sqrt{1/0{,}3}=1{,}826>1$ : inversible.</li></ol>
<p><b>PACF d’un MA(1)</b>, $\theta=0{,}5$ : $\phi_{11}=-0{,}5\times0{,}75/(1-0{,}5^4)=-0{,}4$ (c’est $\rho_1$), $\phi_{22}=-0{,}25\times0{,}75/(1-0{,}5^6)=-0{,}190$, $\phi_{33}=-0{,}094$ : décroissance géométrique, jamais nulle.</p>
<h4>4. Dualité AR-MA</h4>
<table><tr><th></th><th>AR(p)</th><th>MA(q)</th></tr>
<tr><td>Écriture</td><td>$\Phi_p(B)X_t=W_t$</td><td>$X_t=\Theta_q(B)W_t$</td></tr>
<tr><td>Stationnarité</td><td>racines de $\Phi_p$ de module $>1$</td><td>toujours</td></tr>
<tr><td>Inversibilité</td><td>toujours</td><td>racines de $\Theta_q$ de module $>1$</td></tr>
<tr><td>ACF</td><td>exponentielles / sinusoïdes amorties</td><td><b>nulle après $q$</b></td></tr>
<tr><td>PACF</td><td><b>nulle après $p$</b></td><td>exponentielles / sinusoïdes amorties</td></tr></table>
<p>Mnémotechnique : AR = mémoire longue, MA = mémoire courte. Un AR(p) stationnaire est un MA(∞), un MA(q) inversible un AR(∞). <b>Identifier l’ordre</b> (03 · 4-6) : $q$ d’un MA sur l’ACF (support borné) ; $p$ d’un AR sur la PACF, car son ACF a un support infini.</p>
<h4>5. Pièges</h4>
<ul><li>Convention de signe : statsmodels écrit $X_t=W_t+\theta_1W_{t-1}+\dots$ ; un $\hat\theta$ logiciel de $+0{,}4$ correspond à $\theta=-0{,}4$ dans le cours.</li>
<li>Pour un MA(1), $|\rho_1|\le0{,}5$ : un $r_1$ de 0,8 suivi de zéros n’est pas un MA(1).</li>
<li>Après la coupure de l’ACF, des $r_k$ isolés hors bande restent possibles par hasard (et la bande doit être élargie, voir Bartlett dans « Estimateurs »).</li></ul>
<h4>6. Lien finance</h4>
<p>Le rebond entre prix acheteur et vendeur (Roll, 1984) donne aux variations de prix une autocovariance d’ordre 1 négative, égale à $-s^2/4$ ($s$ : l’écart acheteur-vendeur), et nulle ensuite : une signature de MA(1). Un mécanisme voisin pourrait expliquer le $r_1=-0{,}293$ de la croissance de l’indice BRI : l’indice est arrondi à l’unité (12 à 70 sur 1973-2004), et l’erreur d’arrondi $e_t$ entre dans la croissance comme $e_t-e_{t-1}$, la « dépendance fictive » d’une différence. Cette explication est plausible, non vérifiée.</p>
<h4>À retenir</h4>
<ul><li>$X_t=\Theta_q(B)W_t$ : toujours stationnaire, inversible ssi racines de $\Theta_q$ de module $>1$.</li>
<li>$\mathrm{Var}=\sigma_w^2(1+\sum\theta_i^2)$ ; ACF nulle après $q$ ; PACF qui décroît.</li>
<li>AR(p) se lit sur la PACF, MA(q) sur l’ACF.</li></ul>`,
      },
      {
        id: 'ts-arma', title: 'Modèles ARMA(p, q)', slides: '03 · 8-15',
        summary: 'Φp(B)Xt = Θq(B)Wt, sans facteur commun. Stationnaire et inversible selon les racines. Parcimonie : moins de paramètres qu’un AR ou MA pur. Formes MA(∞) et AR(∞).',
        fiche: R`
<p><b>L’idée.</b> On combine une partie autorégressive et une partie moyenne mobile. Un ARMA à 2 ou 3 paramètres décrit souvent ce qu’un AR ou un MA pur ne décrirait qu’avec beaucoup plus de coefficients.</p>
<h4>1. Définition</h4>
<div class="def"><b>ARMA(p, q)</b> : $X_t=\underbrace{\phi_1X_{t-1}+\dots+\phi_pX_{t-p}}_{\text{AR(p)}}+\underbrace{W_t-\theta_1W_{t-1}-\dots-\theta_qW_{t-q}}_{\text{MA(q)}}$, soit $\Phi_p(B)X_t=\Theta_q(B)W_t$.<br>
<b>Hypothèse</b> : pas de facteur commun entre $\Phi_p(B)$ et $\Theta_q(B)$. Exemple : ARMA(1,1) $X_t-\phi X_{t-1}=W_t-\theta W_{t-1}$ exige $\phi\neq\theta$ ; si $\phi=\theta$, $(1-\phi B)$ se simplifie des deux côtés et $X_t=W_t$.</div>
<p><b>Intérêt</b> : modéliser beaucoup de séries différentes ; décrire une série avec <b>moins de paramètres</b> ; lors de la détection de l’ordre, choisir le modèle le plus simple évite le sur-apprentissage. Vocabulaire : <b>markovien</b> si $(p,q)=(1,0)$ ; <b>mémoire longue</b> quand $p\to\infty$.</p>
<div class="thm">En général un ARMA n’est ni stationnaire ni inversible. <b>Stationnaire</b> si les racines de $\Phi_p(z)$ sont de module $>1$, <b>inversible</b> si celles de $\Theta_q(z)$ le sont. Alors ACF et PACF sont dominées par des exponentielles négatives : aucune ne s’annule nettement (calcul exact possible mais long).</div>
<h4>2. Formes pures</h4>
<div class="thm">MA pur : $X_t=\Psi(B)W_t$ avec $\Psi(B)\Phi(B)=\Theta(B)$. AR pur : $\Pi(B)X_t=W_t$ avec $\Phi(B)=\Pi(B)\Theta(B)$.</div>
<p><b>Exemple du cours</b> : $X_t=0{,}5X_{t-1}+W_t-0{,}3W_{t-1}$, donc $\Phi(B)=1-0{,}5B$, $\Theta(B)=1-0{,}3B$.</p>
<ul><li><b>MA(∞)</b> : $\Psi(B)=(1-0{,}3B)(1+0{,}5B+0{,}5^2B^2+\dots)=1+0{,}2B+0{,}1B^2+0{,}05B^3+\dots$ Le slide 14 écrit $0{,}005B^3$ : le calcul donne $0{,}125-0{,}075=0{,}05$. <i>À confirmer avec le Prof. Siebert (slide 03·14).</i></li>
<li><b>AR(∞)</b> : $\Pi(B)=(1-0{,}5B)(1-0{,}3B)^{-1}=(1-0{,}5B)(1+0{,}3B+0{,}3^2B^2+\dots)=1-0{,}2B-0{,}06B^2-0{,}018B^3-\dots$ (le slide 15 écrit $(1-0{,}2B)$ au lieu de $(1-0{,}5B)$ dans l’étape intermédiaire ; le résultat final est juste), soit $X_t=W_t+0{,}2X_{t-1}+0{,}06X_{t-2}+0{,}018X_{t-3}+\dots$</li>
<li>Les poids décroissent vite dans les deux formes : stationnaire et inversible.</li></ul>
<p><b>Formule générale de l’ARMA(1,1)</b> (développement du produit) : $\psi_j=(\phi-\theta)\phi^{j-1}$ et, dans $X_t=W_t+\sum_j\pi_jX_{t-j}$, $\pi_j=(\phi-\theta)\theta^{j-1}$ pour $j\ge1$. Contrôle : $\phi=0{,}5$, $\theta=0{,}3$ donne $\psi=0{,}2;\,0{,}1;\,0{,}05$ et $\pi=0{,}2;\,0{,}06;\,0{,}018$. Variance : $\sigma_w^2\big(1+\frac{(\phi-\theta)^2}{1-\phi^2}\big)=1{,}053\,\sigma_w^2$.</p>
<h4>3. Savoir-faire : mesurer la parcimonie</h4>
<p>Avec ces valeurs, combien de termes faudrait-il à un MA pur pour garder tous les poids $\psi_j\ge0{,}01$ ? $\psi_5=0{,}2\times0{,}5^4=0{,}0125$ et $\psi_6=0{,}00625$ : un MA(5), soit 5 coefficients, contre 2 pour l’ARMA(1,1).</p>
<h4>4. Pièges</h4>
<ul><li>ACF et PACF décroissent toutes les deux : on ne lit pas $(p,q)$ directement. On essaie de petits modèles et on compare (AIC, BIC, résidus), voir Box-Jenkins.</li>
<li>Un $\hat\phi$ presque égal à $\hat\theta$ signale un facteur quasi commun : le modèle est sur-paramétré et ses estimations instables.</li></ul>
<h4>5. Lien finance</h4>
<p>Une série de rendements ou de variations de taux dont ni l’ACF ni la PACF ne se coupe nettement est un candidat ARMA(1,1) : 2 paramètres au lieu d’un AR long, donc des estimations plus stables sur les quelques centaines de points disponibles.</p>
<h4>À retenir</h4>
<ul><li>$\Phi_p(B)X_t=\Theta_q(B)W_t$, sans facteur commun.</li>
<li>Stationnarité par $\Phi$, inversibilité par $\Theta$.</li>
<li>$\Psi=\Theta/\Phi$, $\Pi=\Phi/\Theta$ ; ARMA(1,1) : $\psi_j=(\phi-\theta)\phi^{j-1}$.</li>
<li>Intérêt : la parcimonie.</li></ul>`,
      },
      {
        id: 'ts-arima', title: 'ARIMA, Box-Cox, SARIMA', slides: '03 · 17-44',
        summary: 'ARIMA(p,d,q) : ∇^d Xt est un ARMA(p,q). Box-Cox contre la non-stationnarité en variance. ∇s pour les bâtonnets saisonniers. SARIMA(p,d,q)(P,D,Q)s.',
        fiche: R`
<p><b>L’idée.</b> La plupart des séries réelles ne sont pas stationnaires. On les rend stationnaires par des transformations simples (log, différences, différences saisonnières), on modélise le résultat par un ARMA, et l’on « intègre » pour revenir à la série d’origine.</p>
<h4>1. Non-stationnarité en moyenne : ARIMA</h4>
<p>Deux types : en <b>moyenne</b> ($\mu_t$ qui évolue) et en <b>variance</b> ($\sigma_t^2$ qui évolue).</p>
<div class="def"><b>Opérateur de différenciation</b> (« nabla ») $\nabla=1-B$ : $\nabla X_t=X_t-X_{t-1}$, élimine une tendance linéaire ($X_t=b_0+b_1t+W_t$). En Python : <code>np.diff(data, n=1)</code> ou <code>data - data.shift(1)</code>. $\nabla^2=(1-B)^2$ : $\nabla^2X_t=X_t-2X_{t-1}+X_{t-2}$, élimine une tendance quadratique (<code>np.diff(data, n=2)</code>).<br>
<b>ARIMA(p, d, q)</b> (<i>Auto-Regressive Integrated Moving Average</i>) : $\{X_t\}$ est ARIMA si $\{\nabla^dX_t\}$ est un ARMA(p,q) : $\Phi_p(B)\nabla^dX_t=\Theta_q(B)W_t$. Un processus non stationnaire est <b>intégré d’ordre $d$</b> si $d$ différenciations le rendent stationnaire ; on retrouve la série en « intégrant » (sommant). En pratique $d=1$, 2, rarement 3. Très présent en économie : indices boursiers, de production, de prix.</div>
<p><b>Exemple</b> : la marche aléatoire $X_t=X_{t-1}+W_t$ donne $(1-B)X_t=W_t$, un bruit blanc : c’est un ARIMA(0,1,0).</p>
<p><b>Remarques</b> : un ARIMA commence à une date ($t=0$) avec des valeurs initiales ($q$ pour $W$, $p+d$ pour $X$). Pour la marche aléatoire, $X_t=X_0+\sum_{k=0}^tW_k$ a un sens, mais pas $\sum_{k=-\infty}^tW_k$, qui ne converge pas dans $L^2$ (sa variance serait infinie). Exercice du cours : simuler deux AR(1) et deux ARIMA(1,1,0) avec des conditions initiales différentes (les AR(1) oublient leur départ, les ARIMA non). Rappel : différencier peut introduire des autocorrélations.</p>
<h4>2. Non-stationnarité en variance : Box-Cox</h4>
<div class="def"><b>Transformation de Box-Cox</b> de paramètre $\lambda$ : $g_\lambda(X_t)=\dfrac{X_t^\lambda-1}\lambda$ si $\lambda\neq0$, $\ln X_t$ si $\lambda=0$ (le slide 05·5 précise : $X_t\ge0$ pour $\lambda\neq0$, $X_t>0$ pour $\lambda=0$). $\lambda$ se choisit par tâtonnements.</div>
<p><b>Calcul</b> : $x=100$. $\lambda=0{,}5$ : $(10-1)/0{,}5=18$ ; $\lambda=0$ : $\ln100=4{,}605$ ; $\lambda=1$ : $99$ (simple translation, aucune correction). Plus $\lambda$ est petit, plus les grandes valeurs sont comprimées.</p>
<h4>3. Différenciation saisonnière</h4>
<div class="def">$S$ : la période. Les <b>bâtonnets saisonniers</b> sont ceux des délais multiples de $S$. $\nabla_S=1-B^S$ : $\nabla_SX_t=X_t-X_{t-S}$ (<code>data - data.shift(S)</code>) ; $\nabla_S^2=(1-B^S)^2=1-2B^S+B^{2S}$ : $\nabla_S^2X_t=X_t-2X_{t-S}+X_{t-2S}$.<br>
<b>Quand</b> : quand la non-stationnarité se voit sur les bâtonnets saisonniers du corrélogramme (ou du corrélogramme partiel), c’est-à-dire une décroissance trop lente de $r_S,r_{2S},r_{3S},\dots$ On enlève une tendance (linéaire pour $\nabla_S$, quadratique pour $\nabla_S^2$) entre valeurs séparées de $S$.<br>
<b>Attention</b> : cela n’élimine pas la saisonnalité proprement dite ; $\nabla_{12}$ (<code>data - data.shift(12)</code>) diffère de $\nabla^{12}$ (<code>np.diff(data, n=12)</code>) ; $\nabla$ et $\nabla_S$ commutent : $\nabla\nabla_SX_t=\nabla_S\nabla X_t$.</div>
<p><b>Calcul</b> : prenons des valeurs mensuelles $x_t=130$, $x_{t-1}=120$, $x_{t-12}=118$, $x_{t-13}=110$. $\nabla_{12}x_t=12$, $\nabla_{12}x_{t-1}=10$, donc $\nabla\nabla_{12}x_t=12-10=2$.</p>
<p><b>Exemples du cours</b>. Série M : le corrélogramme du log garde de grands bâtonnets à 12, 24, 36 ; après différenciation saisonnière, ils sont fortement atténués au-delà de 2 périodes. « Monthly Accidental Deaths » (morts accidentelles aux USA, 1973-1979, maximum en juillet, minimum en février, tendance peu apparente) : $\nabla_{12}x_t$ enlève la saison mais laisse une tendance croissante ; $\nabla\nabla_{12}x_t$ enlève les deux.</p>
<h4>4. SARIMA</h4>
<div class="def"><b>SARIMA(p,d,q)(P,D,Q)$_S$</b> : $\Phi_p(B)\tilde\Phi_P(B^S)\nabla^d\nabla_S^DX_t=\Theta_q(B)\tilde\Theta_Q(B^S)W_t$. Deux polynômes AR ($\Phi_p$ en $B$, $\tilde\Phi_P$ en $B^S$) et deux MA, en général de degrés et de coefficients différents.<br>
<b>SAR(P)</b> $\tilde\Phi_P(B^S)X_t=W_t$ : bâtonnets saisonniers de la PACF nuls à partir du délai $(P+1)S$ ; ceux de l’ACF bornés par des exponentielles négatives (ex. $X_t-0{,}7X_{t-S}=W_t$ : $\rho_S=0{,}7$, $\rho_{2S}=0{,}49$…).<br>
<b>SMA(Q)</b> $X_t=\tilde\Theta_Q(B^S)W_t$ : bâtonnets saisonniers de l’ACF nuls à partir de $(Q+1)S$ ; ceux de la PACF décroissent (ex. $X_t=W_t+0{,}4W_{t-S}$ : $\rho_S=0{,}4/1{,}16=0{,}345$, 0 ensuite).<br>
Dualité SAR-SMA : même tableau que AR-MA, avec $B^S$ et les racines de $\tilde\Phi_P$, $\tilde\Theta_Q$.</div>
<p><b>Accidental Deaths</b> : sur $\nabla\nabla_{12}x_t$, $\hat\rho_{12}=-0{,}333$, $\hat\rho_{24}=-0{,}099$, $\hat\rho_{36}=0{,}013$ suggèrent un SMA(1) ($P=0$, $Q=1$), et parmi $\hat\rho_1..\hat\rho_{11}$ seul $\hat\rho_1$ est non nul : $(1-B^{12})(1-B)X_t=28{,}831+(1+\theta_1B)(1+\Theta_1B^{12})W_t$ (ici avec des signes $+$).</p>
<p><b>Application sur la série M</b> (slides 40-41, $\nabla\nabla_{12}$ du log) : le slide conclut à un SAR(2) « car $r_{12}\neq0$ et $r_{24}$ ne diffère pas significativement de 0 ». Avec la règle des slides 35-36, une ACF dont le bâtonnet saisonnier s’arrête après $12$ indique plutôt un <b>SMA(1)</b> ; c’est aussi le modèle classique de Box et Jenkins pour ces données, le « modèle airline » SARIMA(0,1,1)(0,1,1)$_{12}$. <i>À confirmer avec le Prof. Siebert (slide 03·41).</i></p>
<p><b>Développer un SARIMA</b> (exemple du cours, (1,0,1)(2,0,1)$_{12}$) : $(1-0{,}4B)(1+0{,}3B^{12}+0{,}4B^{24})=1-0{,}4B+0{,}3B^{12}-0{,}12B^{13}+0{,}4B^{24}-0{,}16B^{25}$ et $(1+0{,}25B)(1-0{,}1B^{12})=1+0{,}25B-0{,}1B^{12}-0{,}025B^{13}$, soit
$X_t-0{,}4X_{t-1}+0{,}3X_{t-12}-0{,}12X_{t-13}+0{,}4X_{t-24}-0{,}16X_{t-25}=W_t+0{,}25W_{t-1}-0{,}1W_{t-12}-0{,}025W_{t-13}$. Les termes croisés ($B^{13}$, $B^{25}$) viennent du produit.</p>
<p><b>Hors programme</b> : ARCH (1982) et GARCH (modèles conditionnellement hétéroscédastiques, pour une variance qui change), saisonnalité irrégulière (Pâques change de date chaque année mais influence les ventes). Les ARMA restent utilisés, au moins comme référence de comparaison.</p>
<h4>5. Donnée réelle</h4>
<p>Indice BRI du TP0 : le niveau passe de 12 (1973) à 152 (2014) et son ACF décroît lentement ; on prend $\ln x_t$ (variations proportionnelles au niveau) puis $\nabla$ : $g_t=\nabla\ln x_t$ est la croissance trimestrielle. Sur 1973-2004, $r_4=0{,}279$ signale une saison de période $S=4$. Modèle candidat : ARIMA sur $\ln x_t$ avec $d=1$, plus une composante saisonnière (détails dans Box-Jenkins).</p>
<h4>6. Pièges</h4>
<ul><li><b>Sur-différencier</b> : $\nabla$ d’un bruit blanc donne $W_t-W_{t-1}$, un MA(1) non inversible ($\theta=1$, $\rho_1=-0{,}5$). Un $r_1$ proche de $-0{,}5$ après différenciation est un signal d’alerte.</li>
<li>$\nabla_S$ n’enlève qu’une tendance entre saisons, pas le motif saisonnier.</li>
<li>Vérifier la convention de signe des $\theta$ avant de lire un modèle publié.</li></ul>
<h4>7. Lien finance</h4>
<p>Log-prix et indices de prix sont typiquement intégrés d’ordre 1 : on modélise leurs rendements. GARCH (Bollerslev, 1986), extension de l’ARCH d’Engle (1982), est l’outil standard de la volatilité en risque de marché ; il prolonge directement ce chapitre.</p>
<h4>À retenir</h4>
<ul><li>ARIMA(p,d,q) : $\Phi_p(B)(1-B)^dX_t=\Theta_q(B)W_t$ ; marche aléatoire = ARIMA(0,1,0).</li>
<li>Box-Cox ($\lambda=0$ : log) contre la non-stationnarité en variance.</li>
<li>$\nabla_S$ quand $r_S,r_{2S},\dots$ décroissent lentement ; $\nabla_S\neq\nabla^S$.</li>
<li>SAR(P) : PACF saisonnière nulle à partir de $(P+1)S$ ; SMA(Q) : ACF saisonnière nulle à partir de $(Q+1)S$.</li></ul>`,
      },
      {
        id: 'ts-estim', title: 'Estimateurs : moyenne, autocovariance, autocorrélation', slides: '04 · 3-12',
        summary: 'Une seule réalisation : la stationnarité est cruciale. X̄ sans biais ; Ck biaisé mais asymptotiquement sans biais ; jackknife ; bruit blanc : E(Rk) ≈ −1/N, Var(Rk) ≈ 1/N.',
        fiche: R`
<p><b>L’idée.</b> ACF et PACF théoriques sont inaccessibles ; on les estime à partir d’une seule série. Ces estimations ont un biais et une variance qu’il faut connaître pour lire un corrélogramme sans s’emballer sur un bâtonnet.</p>
<h4>1. Le problème</h4>
<div class="def"><b>Estimateur</b> : fonction mesurable de $\{X_1,\dots,X_N\}$ qui approche une quantité d’intérêt, étudiée quand $N\gg1$. On doit estimer le vecteur moyenne et la matrice de covariance d’un vecteur aléatoire de dimension $N$ à partir d’un échantillon de taille 1 (une réalisation). La <b>stationnarité</b> réduit les paramètres : $\mathbb E(X_t)=\mu$ (1 au lieu de $N$), $\mathrm{Var}(X_t)=\sigma_x^2$, $\mathrm{Cov}(X_t,X_{t+k})=\gamma_k$ ($N$ au lieu de $N(N-1)/2$).</div>
<p>On distingue l’<b>estimation</b> (le nombre calculé sur les données, $\bar x=\frac1N\sum x_t$) de l’<b>estimateur</b> (la variable aléatoire $\bar X_N=\frac1N\sum X_t$, souvent noté $\bar X$).</p>
<p><b>Biais-variance</b> : $\mathbb E[(\hat\theta_n-\theta)^2]=\mathrm{Var}(\hat\theta_n)+\mathbb E[\hat\theta_n-\theta]^2$ : erreur quadratique = erreur statistique + carré de l’erreur systématique. $\bar X$ est <b>sans biais</b> : $\mathbb E(X_1)=\dots=\mathbb E(X_N)=\mu$ par stationnarité, puis linéarité de l’espérance.</p>
<h4>2. Autocovariance</h4>
<div class="def">$C_k=\frac1N\sum_{t=1}^{N-k}(X_t-\bar X)(X_{t+k}-\bar X)$.
<ol><li><b>Biaisé</b> : $\mathbb E(C_k)=(1-\frac kN)[\gamma_k-\mathrm{Var}(\bar X)]$ ;</li>
<li><b>asymptotiquement sans biais</b> : $\lim_{N\to\infty}\mathbb E(C_k)=\gamma_k$ ;</li>
<li>$\mathrm{Cov}(C_k,C_m)\approx\frac1N\sum_{r=-\infty}^{\infty}[\gamma_r\gamma_{r+m-k}+\gamma_{r+m}\gamma_{r-k}]$ (avec $k=m$ : la variance). Les $C_k$ sont fortement corrélés entre eux : si $\gamma_k$ est mal estimé, $\gamma_m$ l’est souvent aussi.</li></ol></div>
<p><b>Calcul du biais</b> : $N=50$, $k=5$, $\gamma_5=0{,}4$ et $\mathrm{Var}(\bar X)$ négligeable : $\mathbb E(C_5)\approx0{,}9\times0{,}4=0{,}36$, un biais de 10 % vers zéro.</p>
<div class="def"><b>Jackknife</b> (canif) : $\tilde C_k=2C_k-\frac12(C_{k1}+C_{k2})$, où $C_{k1}$, $C_{k2}$ sont calculés chacun sur une moitié des observations. Avantages : biais en $1/N^2$ au lieu de $1/N$ ; test de stationnarité ($C_{k1}\approx C_{k2}$ ?). Inconvénients : plus de calculs ; sensibilité à une tendance résiduelle.</div>
<p><b>Calcul</b> : $C_k=0{,}50$, $C_{k1}=0{,}46$, $C_{k2}=0{,}50$ : $\tilde C_k=1{,}00-0{,}48=0{,}52$.</p>
<h4>3. Autocorrélation</h4>
<div class="def">$R_k=C_k/C_0$ : biaisé en général ; biais réduit par $\tilde R_k=2R_k-\frac12(R_{k1}+R_{k2})$.<br>
<b>Variance</b> (formule de Bartlett) : si $\rho_k=0$ pour $k>q$, alors pour $k>q$
$$\mathrm{Var}(R_k)\approx\frac1N\Big(1+2\sum_{i=1}^q\rho_i^2\Big).$$
Le slide 10 l’écrit $\frac1N(1+2\sum_{i=1}^k\rho_i)$ « pour $k\le q$ » (sans les carrés, somme jusqu’à $k$). La forme ci-dessus est celle de Bartlett. <i>À confirmer avec le Prof. Siebert (slide 04·10).</i><br>
<b>Processus non corrélé</b> ($\gamma_k=0$, $k\neq0$), $X_t$ i.i.d. : $\mathbb E(R_k)\approx-\frac1N$, $\mathrm{Var}(R_k)\approx\frac1N$, $R_k$ asymptotiquement normal. Il y a 95 % de chances que $r_k$ tombe dans $[-\frac1N\pm\frac2{\sqrt N}]$, souvent approché par $[0\pm\frac2{\sqrt N}]$. Cela permet de tester l’hypothèse « $\{X_t\}$ est un bruit blanc ».</div>
<p><b>Calcul (Bartlett)</b> : un MA(1) avec $\rho_1=0{,}4$, $N=100$. Pour $k\ge2$ : $\mathrm{Var}(R_k)\approx(1+2\times0{,}16)/100=0{,}0132$, écart type $0{,}115$, bande $\pm0{,}230$ au lieu de $\pm0{,}2$. Exemple du cours : ACF d’un bruit blanc, bande $\pm2/\sqrt{100}=\pm0{,}2$, les coefficients 9 et 11 en sortent par hasard. (Le code R du slide 12 simule <code>n=200</code> alors que le texte annonce $N=100$ ; les lignes tracées semblent correspondre à $\pm2/\sqrt{200}\approx\pm0{,}14$. <i>À confirmer avec le Prof. Siebert (slide 04·12).</i>)</p>
<h4>4. Pièges</h4>
<ul><li>Les $R_k$ voisins sont corrélés : une « vague » dans un corrélogramme peut être un artefact d’estimation.</li>
<li>La bande $\pm2/\sqrt N$ ne vaut que pour un bruit blanc ; après un pic réel, utiliser Bartlett.</li>
<li>Une tendance résiduelle gonfle tous les $C_k$.</li></ul>
<h4>5. Lien finance</h4>
<p>Cinq ans de données mensuelles donnent $N=60$ et une bande $\pm0{,}258$ : une autocorrélation réelle de 0,2 sur un rendement mensuel est indétectable sur cet historique. Allonger l’historique coûte de l’autre côté : la stationnarité devient moins crédible.</p>
<h4>À retenir</h4>
<ul><li>Une seule réalisation : la stationnarité rend l’estimation possible.</li>
<li>$\bar X$ sans biais ; $C_k$ biaisé (facteur $1-k/N$) mais asymptotiquement sans biais ; jackknife : biais en $1/N^2$.</li>
<li>Bruit blanc : $\mathbb E(R_k)\approx-1/N$, $\mathrm{Var}(R_k)\approx1/N$ ; Bartlett au-delà de $q$.</li></ul>`,
      },
      {
        id: 'ts-fit', title: 'Ajustement des paramètres AR, MA, ARMA', slides: '04 · 14-35',
        summary: 'AR : moindres carrés ou Yule-Walker (φ = Rp⁻¹ρ). MA : pas d’estimateur explicite, résidus récursifs depuis W0 = 0 puis optimisation (grille, Marquardt). Maximum de vraisemblance : exact, asymptotiquement efficace.',
        fiche: R`
<p><b>L’idée.</b> Une fois l’ordre choisi, on cherche les coefficients qui rendent les résidus aussi petits que possible. Pour un AR, c’est une régression linéaire. Pour un MA, les résidus dépendent d’eux-mêmes et il faut les calculer de proche en proche, puis optimiser numériquement.</p>
<h4>1. AR(p)</h4>
<div class="def">$p$ fixé (après examen du corrélogramme partiel). Modèle : $X_t-\mu=W_t+\phi_1(X_{t-1}-\mu)+\dots+\phi_p(X_{t-p}-\mu)$, une régression linéaire. On choisit $\hat\phi_1..\hat\phi_p,\hat\mu$ qui minimisent la somme des carrés résiduelle (<i>Residual Sum of Squares</i>) :
$$RSS=\sum_{t=p+1}^N\big[X_t-\mu-\phi_1(X_{t-1}-\mu)-\dots-\phi_p(X_{t-p}-\mu)\big]^2.$$
Si $W_t$ est un bruit blanc gaussien, ce sont les estimateurs du maximum de vraisemblance (conditionnel).</div>
<p><b>AR(1), à savoir refaire</b> : $RSS=\sum_{t=2}^N[(X_t-\mu)-\phi_1(X_{t-1}-\mu)]^2$.</p>
<ol><li>$\partial RSS/\partial\mu=0$ donne $\hat\mu=\dfrac{\sum_{t=2}^NX_t-\phi_1\sum_{t=2}^NX_{t-1}}{(N-1)(1-\phi_1)}$.</li>
<li>$\partial RSS/\partial\phi_1=0$ donne $\hat\phi_1=\dfrac{\sum_{t=1}^{N-1}(X_t-\mu)(X_{t+1}-\mu)}{\sum_{t=1}^{N-1}(X_t-\mu)^2}$.</li>
<li>Si les moyennes des $N-1$ premières et des $N-1$ dernières valeurs valent $\bar X$ ($N$ grand) : $\hat\mu\approx\bar X$ et $\hat\phi_1\approx r_1$.</li>
<li>Comme $\rho_1=\phi_1$ pour un AR(1) (première équation de Yule-Walker : $\rho_1=\phi_1\rho_0$), tester $\phi_1=0$ à 95 % revient à regarder si $\hat\phi_1\in[\pm2/\sqrt N]$.</li></ol>
<p><b>AR(2) par Yule-Walker</b> : $\hat\mu\approx\bar X$ et, avec $\rho_{-1}=\rho_1$ : $\rho_1=\phi_1\rho_0+\phi_2\rho_{-1}$, $\rho_2=\phi_1\rho_1+\phi_2$. En remplaçant $\rho_i$ par $R_i$ et en résolvant ce système $2\times2$ :
$\hat\phi_1=\dfrac{R_1(1-R_2)}{1-R_1^2}$, $\hat\phi_2=\dfrac{R_2-R_1^2}{1-R_1^2}$. Exemple : $R_1=0{,}6$, $R_2=0{,}5$ donnent $\hat\phi_1=0{,}469$, $\hat\phi_2=0{,}219$.</p>
<div class="thm"><b>Cas général</b>, deux méthodes : (1) régression ordinaire de $x_t-\bar x$ sur $x_{t-1}-\bar x,\dots,x_{t-p}-\bar x$ (traités comme des variables indépendantes) ; (2) les $p$ premières équations de Yule-Walker avec $\hat\rho_i=R_i$. Pour $N$ grand, les deux approchent l’optimum.<br>
<b>Forme matricielle</b> : $\rho=(\rho_1..\rho_p)^\top=R_p\phi$ avec $R_p$ la matrice de Toeplitz d’éléments $\rho_{|i-j|}$ (des 1 sur la diagonale), donc $\hat\phi=R_p^{-1}\hat\rho$.</div>
<h4>2. MA(q)</h4>
<p>Modèle $X_t=\mu+W_t-\theta_1W_{t-1}-\dots-\theta_qW_{t-q}$, $q$ fixé. Plus difficile : pas d’estimateur efficace explicite, méthode itérative.</p>
<p><b>Pourquoi pas les moments</b> : pour un MA(1), écrire $R_1=-\hat\theta/(1+\hat\theta^2)$ donne $R_1\hat\theta^2+\hat\theta+R_1=0$, $\hat\theta=\dfrac{-1\pm\sqrt{1-4R_1^2}}{2R_1}$. Si $|R_1|>0{,}5$ : pas de racine réelle ; sinon, on montre que l’estimateur n’est pas efficace. Exemple : $R_1=-0{,}4$ donne $\hat\theta=0{,}5$ ou $2$ ; on garde la racine inversible $0{,}5$.</p>
<div class="def"><b>Résidus récursifs</b> : $W_t=X_t-\mu+\theta W_{t-1}$. En fixant $W_0=0$ : $W_1=X_1-\mu$, $W_2=X_2-\mu+\theta W_1$, …, $W_N=X_N-\mu+\theta W_{N-1}$. $\sum W_t^2$ est alors une fonction connue de $(\mu,\theta)$, conditionnellement à $W_0=0$. On la minimise par <b>recherche sur grille</b> (évaluer une grille de couples et garder le meilleur) ou par l’algorithme de <b>Marquardt</b> (1963), avec des valeurs initiales qui influent peu : $\mu_0=\bar X$, $\theta_0$ tiré de $R_1=-\theta_0/(1+\theta_0^2)$. La dépendance au départ devient plus critique quand $|\theta_0|\approx1$.</div>
<p><b>Calcul</b> : prenons $\mu=0$, $\theta=0{,}5$, $X=1;\ -0{,}5;\ 0{,}8$. $W_1=1$, $W_2=-0{,}5+0{,}5\times1=0$, $W_3=0{,}8+0{,}5\times0=0{,}8$ : $RSS=1+0+0{,}64=1{,}64$. On recommence pour d’autres $\theta$ et on garde le minimum.</p>
<p><b>MA(2)</b> : $W_t=X_t-\mu+\theta_1W_{t-1}+\theta_2W_{t-2}$ ; conditionnellement à $W_0=W_1=0$, $W_2=X_2-\mu$, $W_3=X_3-\mu+\theta_1W_2$, … puis Marquardt sur $(\mu,\theta_1,\theta_2)$ (le slide 26 écrit les termes avec des moins ; le signe suit la convention $X_t=\mu+W_t-\theta_1W_{t-1}-\theta_2W_{t-2}$). <b>ARMA(1,1)</b> : $W_t=(X_t-\mu)-\phi(X_{t-1}-\mu)+\theta W_{t-1}$ ; soit on fixe $W_0=0$ et $X_0=\mu$, soit on part de $t=2$ avec $W_1=0$.</p>
<h4>3. Maximum de vraisemblance</h4>
<div class="def">Les méthodes précédentes sont des <b>moindres carrés conditionnels</b> (valeurs initiales fixées). Pour un modèle inversible et une longue série, les valeurs de départ influent peu. Pour une série de longueur modérée ou un modèle non inversible : minimiser la RSS inconditionnelle, avec des estimations par maximum de vraisemblance des valeurs initiales.<br>
<b>Vraisemblance</b> $L(x_1..x_N;\phi,\theta,\mu,\sigma^2)$ : la densité des valeurs observées vue comme fonction des paramètres ; on la maximise (difficile à écrire pour un ARMA quelconque : logiciels).<br>
Avantages : toute l’information (pas seulement les moments d’ordre 2) ; estimateurs <b>asymptotiquement efficaces</b> (sans biais et de variance minimale). Inconvénients : il faut travailler avec les lois jointes des $X_t$ et faire des hypothèses sur elles.</div>
<p><b>AR(1) gaussien</b> $X_t=\mu+\phi(X_{t-1}-\mu)+W_t$, $W_t\sim\mathcal N(0,a^2)$ indépendants.</p>
<ol><li>Conditionnellement à $X_1=x_1$, le changement de variable linéaire $W_t=X_t-\mu-\phi(X_{t-1}-\mu)$ donne $f(x_2..x_N\mid x_1)=(\sqrt{2\pi}a)^{-(N-1)}\exp\big[-\frac1{2a^2}\sum_{t=2}^N((x_t-\mu)-\phi(x_{t-1}-\mu))^2\big]$.</li>
<li>$f(x_1)$ : par stationnarité $X_1$ est normal, de variance $\mathrm{Var}(X_1)=\phi^2\mathrm{Var}(X_1)+a^2$, soit $a^2/(1-\phi^2)$.</li>
<li>$L=f(x_2..x_N\mid x_1)f(x_1)\propto a^{-N}\sqrt{1-\phi^2}\exp[-S(\phi,\mu)/(2a^2)]$ avec $S=S^*+(1-\phi^2)(X_1-\mu)^2$, $S^*$ étant la somme conditionnelle (RSS).</li>
<li>$\ell=\ln L=-\frac N2\ln(2\pi)-\frac N2\ln a^2+\frac12\ln(1-\phi^2)-\frac1{2a^2}S$ ; $\partial\ell/\partial a^2=0$ donne $\hat a^2=S(\hat\phi,\hat\mu)/N$.</li>
<li>$S$ a $N$ termes du même ordre que le terme ajouté : $S\approx S^*$ sauf si $N$ est petit, et les estimations diffèrent peu. Problème numérique si $\hat\phi\approx\pm1$.</li></ol>
<h4>4. Donnée réelle</h4>
<p>Croissance trimestrielle de l’indice BRI (1973-2004, 127 valeurs) : $r_1=-0{,}293$ et, par moindres carrés, $\hat\phi_1=-0{,}2934$ (constante $0{,}018$, $\hat\sigma=0{,}0504$). $|\hat\phi_1|>2/\sqrt{127}=0{,}177$ : significatif. L’AR(1) ne suffit pas pour autant (voir Box-Jenkins).</p>
<h4>5. Pièges</h4>
<ul><li>$|R_1|>0{,}5$ : aucun MA(1) ne convient.</li>
<li>Deux racines $\hat\theta$ et $1/\hat\theta$ : prendre l’inversible.</li>
<li>Comparer des estimations conditionnelles et exactes sur une série courte peut donner des écarts réels ; ce n’est pas une erreur de code.</li></ul>
<h4>6. Lien finance</h4>
<p>Estimer un AR(1) sur un taux, c’est régresser le taux sur sa valeur précédente : $\hat\phi$ donne la vitesse de retour à la moyenne, $\hat\sigma$ la taille des chocs. Avec $\hat\phi$ proche de 1, l’estimation devient instable (le cours le signale pour la vraisemblance) et un test de racine unitaire s’impose avant de conclure.</p>
<h4>À retenir</h4>
<ul><li>AR : moindres carrés ≈ Yule-Walker $\hat\phi=R_p^{-1}\hat\rho$ ; AR(1) : $\hat\phi_1\approx r_1$, $\hat\mu\approx\bar X$.</li>
<li>MA : résidus récursifs depuis $W_0=0$, puis grille ou Marquardt.</li>
<li>Vraisemblance exacte : efficace, utile pour les séries courtes ; $\hat\sigma^2=S/N$.</li></ul>`,
      },
      {
        id: 'ts-bj', title: 'Méthodologie de Box-Jenkins', slides: '05 · 3-15',
        summary: 'Stationnariser (Box-Cox, ∇, ∇s), identifier p, q sur ACF/PACF (parcimonie, AIC/BIC), ajuster, diagnostiquer les résidus (bruit blanc ? Ljung-Box), éviter le sur-ajustement.',
        fiche: R`
<p><b>L’idée.</b> Une recette en boucle pour construire un modèle : rendre la série stationnaire, proposer le plus petit modèle compatible avec l’ACF et la PACF, l’ajuster, puis vérifier que les résidus ne contiennent plus rien de prévisible. Si ce n’est pas le cas, on recommence.</p>
<h4>1. Le cadre</h4>
<p>George Box et Gwilym Jenkins, <i>Time Series Analysis: Forecasting and Control</i> (1970) : méthode empirique de choix et de construction d’un SARIMA. Entrée : une série ; classe de modèles : SARIMA(p,d,q)(P,D,Q) ; outil externe : Box-Cox. « All models are wrong but some are useful » (Box, 1978).</p>
<div class="thm"><b>Étapes</b>
<ol><li><b>Analyse préliminaire</b> : vérifier la stationnarité (visuellement, Dickey-Fuller) ; éventuellement stationnariser : Box-Cox, différencier (degré $d$) ; plus tard, lors de l’ajustement d’un modèle saisonnier, différencier saisonnièrement (degré $D$).</li>
<li><b>Sélection</b> (principe de <b>parcimonie</b>) : commencer par les modèles les plus simples compatibles avec le corrélogramme et le corrélogramme partiel : AR ou MA de petit ordre ($p=1$ ou $q=1$), puis petits ARMA. Critères de complexité : AIC (<i>Akaike Information Criterion</i>), BIC (<i>Bayes Information Criterion</i>) : <code>results.aic</code>, <code>results.bic</code> ; plus petit = meilleur.</li>
<li><b>Ajustement</b> : <code>model.fit()</code>.</li>
<li><b>Examen critique</b> : analyse des résidus, dangers (sur-ajustement).</li></ol></div>
<h4>2. Diagnostic des résidus</h4>
<p>AR(1) : $W_t=X_t-\phi X_{t-1}$. Si $\phi$ était connu, $x_t-\phi x_{t-1}$ donnerait le bruit exact ; avec $\hat\phi$, le résidu $\hat W_t=x_t-\hat\phi x_{t-1}$ n’en est qu’une estimation, et les $\hat W_t$ sont en général un peu corrélés même si les $W_t$ ne le sont pas. Cas général (ARMA inversible) : $\hat W_t=X_t-\sum\hat\Pi_jX_{t-j}$. Les résidus devraient être approximativement indépendants et de loi $\mathcal N(0,\sigma)$ : ne plus contenir d’information.</p>
<ol><li>Résidus en fonction de $t$ : ni tendance ni variance qui change.</li>
<li>Résidus en fonction des valeurs prévues : pas de dépendance systématique, erreurs additives de variance constante.</li>
<li>Normalité : graphique quantile-quantile (droite de Henry), test de Shapiro-Wilk.</li>
<li>Non-corrélation : test de Durbin-Watson.</li>
<li>ACF et PACF des résidus : $R_k(\hat W)\approx0$ pour $k\ge1$. Si les paramètres étaient connus, $R_k$ suivrait asymptotiquement $\mathcal N(0,1/N)$. Comme ils sont estimés, $\sigma^2[R_k(\hat W)]<1/N$ pour $k$ petit (et $\approx1/N$ pour $k$ grand) : le test $\pm2/\sqrt N$ surestime la variance aux petits délais et peut accepter à tort le bruit blanc. On l’utilise quand même, en tolérant quelques bâtonnets hors limites.</li>
<li>Tester simultanément la nullité de tous les $R_k$ : tests du portemanteau.</li></ol>
<div class="def"><b>Test du portemanteau</b> (« fourre-tout ») : $H_0$ (« les résidus sont un bruit blanc ») est précise, l’alternative ne l’est pas. Peu puissant, mais il détecte plusieurs types d’écart.<br>
<b>Box-Pierce</b> : pour un ARIMA(p,d,q) correct et $K$ assez grand, $Q_{BP}=n\sum_{k=1}^KR_k^2(\hat W)\overset{\mathcal L}\to\chi^2_{K-p-q}$, avec $n=N-d$ ($N$ : longueur de la série, $d$ : degré de différenciation).<br>
<b>Ljung-Box</b> (Box-Pierce modifié) : $Q^*=n(n+2)\sum_{k=1}^K\dfrac{R_k^2}{n-k}\overset{\mathcal L}\to\chi^2_{K-p-q}$, converge plus vite : préféré pour $n$ petit. Ce sont plutôt des tests de <b>rejet</b> que d’acceptation.</div>
<p><b>Calcul</b> : prenons $n=100$, $K=3$, $R_1=0{,}15$, $R_2=-0{,}10$, $R_3=0{,}05$ pour un AR(1). $Q^*=100\times102\times\big(\frac{0{,}0225}{99}+\frac{0{,}01}{98}+\frac{0{,}0025}{97}\big)=3{,}62$, à comparer à $\chi^2_2$ (quantile 95 % : 5,99) : on ne rejette pas. $Q_{BP}=100\times0{,}035=3{,}5$, un peu plus petit.</p>
<h4>3. Sur-ajustement (overfitting)</h4>
<p>Plus de paramètres = meilleur ajustement. Un ARMA(100,100) finirait par prédire le bruit, imprévisible par définition, et dégraderait les prévisions. <b>Détection</b> : quand un AR(2) semble convenir, ajuster un AR(3) et se demander (1) si $\hat\phi_3$ diffère significativement de 0, (2) si $\hat\phi_1,\hat\phi_2$ ont beaucoup changé. Overfitting si les réponses sont « non » puis « oui ». La redondance traduit un manque d’identifiabilité. Ne pas augmenter AR et MA en même temps (instable si $\theta_i\approx\phi_i$) : partir des plus petits ordres, ajouter une unité à la fois.</p>
<h4>4. Exemple réel complet : l’indice BRI du TP0</h4>
<p><b>Ce que contient le fichier</b> : <code>BIS-RE_QBE221200.csv</code>, colonnes <code>Date</code> et <code>Value</code>, 168 valeurs trimestrielles du 31/03/1973 au 31/12/2014, triées de la plus récente à la plus ancienne, arrondies à l’unité, de 12 à 152. Le fichier ne documente ni le pays ni la base de l’indice ; le nom suggère une série de prix immobiliers de la BRI (préfixe RE, <i>real estate</i>), sans confirmation dans le fichier ni dans l’énoncé du TP0.</p>
<ol><li><b>Regarder</b> : le niveau passe de 70 au 31/12/2004 à 97 au 31/03/2005, un saut de $\ln(97/70)=0{,}326$ en log, de loin le plus grand de la série. Il ressemble à une rupture de série (changement de source ou de base) plutôt qu’à un mouvement de marché ; on le vérifierait auprès de la BRI. On travaille sur 1973-T1 à 2004-T4.</li>
<li><b>Stationnariser</b> : ACF du niveau $0{,}980$ ; $0{,}961$ ; $0{,}943$ ; $0{,}927$ (lente) ; on prend $g_t=\nabla\ln x_t$ (127 valeurs, bande $\pm0{,}177$).</li>
<li><b>Identifier</b> : ACF de $g$ : $-0{,}293$ ; $-0{,}019$ ; $0{,}125$ ; $0{,}279$ ; $-0{,}217$ ; … PACF : $-0{,}293$ ; $-0{,}114$ ; $0{,}094$ ; $0{,}385$ ; puis dans la bande. Croissance moyenne par trimestre : $0{,}2$ % (T1), $1{,}27$ % (T2), $4{,}59$ % (T3), $-0{,}53$ % (T4) : saison de période 4.</li>
<li><b>Premier modèle (parcimonie)</b> : AR(1), $\hat\phi_1=-0{,}2934$, $\hat\sigma=0{,}0504$. Ljung-Box sur les résidus avec $K=8$ : $Q^*=25{,}79$, 7 degrés de liberté, p-value $0{,}0005$ : <b>rejeté</b> ; il reste de la structure au délai 4 (ACF des résidus : $0{,}302$).</li>
<li><b>Deuxième modèle</b> : AR(4), coefficients (constante puis $\hat\phi_1..\hat\phi_4$) $0{,}0098$ ; $-0{,}3351$ ; $-0{,}0286$ ; $0{,}2215$ ; $0{,}3919$, $\hat\sigma=0{,}0451$. $Q^*=3{,}96$, 4 degrés de liberté, p-value $0{,}41$ : non rejeté.</li>
<li><b>Critique</b> : $\hat\phi_2$ est très petit ; la parcimonie invite à essayer un modèle saisonnier ($S=4$) avec moins de paramètres. Ne pas rejeter un modèle ne prouve pas qu’il est juste.</li></ol>
<p>Le script (numpy, pandas, scipy ; rangé dans <code>Learnable\verif_ts\bis_ts.py</code>, à lancer depuis le dossier du TP0 avec <code>python ..\Learnable\verif_ts\bis_ts.py</code>) :</p>
${code(BIS_PY)}
<p>Sortie obtenue :</p>
${code(BIS_OUT, 'text')}
<p>La dernière ligne est commentée dans « Prévisions et intervalles de confiance ».</p>
<h4>5. Pièges</h4>
<ul><li>Degrés de liberté : $K-p-q$ (les paramètres saisonniers comptent aussi), et $n=N-d$.</li>
<li>Comparer des AIC n’a de sens que sur la même série et le même nombre d’observations.</li>
<li>Des résidus « blancs » sur l’échantillon d’ajustement ne garantissent rien hors échantillon.</li></ul>
<h4>6. Lien finance</h4>
<p>En gestion des risques, un modèle de prévision se valide comme ici : résidus sans structure, puis comparaison des prévisions avec les réalisations hors échantillon. L’exemple BRI montre aussi le premier réflexe face à une donnée réelle : chercher les ruptures avant de modéliser.</p>
<h4>À retenir</h4>
<ul><li>Stationnariser, identifier (ACF/PACF, parcimonie, AIC/BIC), ajuster, diagnostiquer ; boucler.</li>
<li>Résidus : pas de tendance, variance constante, normaux, non corrélés.</li>
<li>Ljung-Box $Q^*=n(n+2)\sum R_k^2/(n-k)\sim\chi^2_{K-p-q}$ : test de rejet.</li>
<li>Overfitting : nouveau coefficient non significatif et anciens coefficients qui bougent.</li></ul>`,
      },
      {
        id: 'ts-forecast', title: 'Prévisions et intervalles de confiance', slides: '05 · 17-37',
        summary: 'X̂t(l) = Et(Xt+l), calculé récursivement. Erreur de variance V(l) = σ²(1 + ψ1² + … + ψ²l−1), croissante avec l. AR(1) : X̂t(l) = μ + φ^l (xt − μ). Intervalle X̂t(l) ± u√V(l).',
        fiche: R`
<p><b>L’idée.</b> La meilleure prévision est l’espérance de la valeur future sachant tout le passé. Elle se calcule en remplaçant les chocs futurs par zéro. L’incertitude vient précisément de ces chocs : plus l’horizon est lointain, plus ils sont nombreux, plus l’intervalle s’élargit.</p>
<p>« Forecasting is difficult, especially the future. » Le cours rappelle des prévisions célèbres et fausses : « un marché mondial pour peut-être cinq ordinateurs » (attribuée au président d’IBM, 1943), « les actions ont atteint un plateau permanent » (un professeur d’économie de Yale, 1929).</p>
<h4>1. Le cadre</h4>
<div class="def">$X_t$ ARIMA(p,d,q), passé $X_i$, $i\le t$, connu. Connaître $X_t,X_{t-1},\dots$ revient à connaître $W_t,W_{t-1},\dots$ (inversibilité). On suppose la série (éventuellement différenciée) stationnaire et inversible. Notation : $\hat X_t(l)$, la prévision faite à l’instant $t$ (présent) pour l’horizon $l$, c’est-à-dire pour $X_{t+l}$. $\mathbb E_t(\cdot)$ : espérance conditionnelle au passé jusqu’à $t$ inclus.</div>
<p><b>Un ARIMA(p,d,q) est un ARMA(p+d,q)</b> non stationnaire : $\varphi_{p+d}(B)=\Phi_p(B)(1-B)^d$, de coefficients $\varphi_1..\varphi_{p+d}$. Trois écritures de $X_{t+l}$ :</p>
<ol><li>ARMA(p+d,q) : $X_{t+l}=\varphi_1X_{t+l-1}+\dots+\varphi_{p+d}X_{t+l-p-d}+W_{t+l}-\theta_1W_{t+l-1}-\dots-\theta_qW_{t+l-q}$ ;</li>
<li>MA(∞) : $X_{t+l}=W_{t+l}+\psi_1W_{t+l-1}+\psi_2W_{t+l-2}+\dots$ ;</li>
<li>AR(∞) : $X_{t+l}=W_{t+l}+\Pi_1X_{t+l-1}+\Pi_2X_{t+l-2}+\dots$</li></ol>
<h4>2. Le prédicteur optimal</h4>
<p>On cherche un prédicteur linéaire $\hat X_t(l)=\eta_lW_t+\eta_{l+1}W_{t-1}+\dots$ qui minimise $\mathbb E[(X_{t+l}-\hat X_t(l))^2]$. L’erreur vaut $W_{t+l}+\psi_1W_{t+l-1}+\dots+\psi_{l-1}W_{t+1}+(\psi_l-\eta_l)W_t+(\psi_{l+1}-\eta_{l+1})W_{t-1}+\dots$, d’espérance quadratique $\sigma^2(1+\psi_1^2+\dots+\psi_{l-1}^2)+\sigma^2\sum_j(\psi_{l+j}-\eta_{l+j})^2$, minimale pour $\eta_{l+j}=\psi_{l+j}$.</p>
<div class="thm">$X_{t+l}=\underbrace{W_{t+l}+\psi_1W_{t+l-1}+\dots+\psi_{l-1}W_{t+1}}_{E_t(l)\text{ : erreur}}+\hat X_t(l)$, et
<ol><li>$\hat X_t(l)=\mathbb E_t(X_{t+l})$ ;</li>
<li>prévisions non biaisées : $\mathbb E_t(E_t(l))=0$ ;</li>
<li>$V(l)=\mathrm{Var}_t(E_t(l))=\sigma^2(1+\psi_1^2+\dots+\psi_{l-1}^2)$, qui <b>augmente avec l’horizon</b> $l$.</li></ol></div>
<p><b>Calcul récursif sans les $\psi$</b> : on prend $\mathbb E_t$ de la forme 1 :
$$\hat X_t(l)=\sum_{j=1}^{p+d}\varphi_j\hat X_t(l-j)-\sum_{i=1}^q\theta_i[W_{t+l-i}],$$
avec $[W_{t+l-i}]=0$ si $i<l$ (choc futur), $=W_{t+l-i}$ si $i\ge l$ (choc passé, estimé par le résidu), et $\hat X_t(l-j)=X_{t+l-j}$ si $l\le j$ (valeur déjà observée).</p>
<div class="def"><b>Intervalle de prévision</b> : si $W_t\overset{\mathcal L}=\mathcal N(0,\sigma^2)$, $\hat X_t(l)$ est fixé par le passé et $E_t(l)\sim\mathcal N(0,V(l))$, donc $X_{t+l}\mid\text{passé}\sim\mathcal N(\hat X_t(l),V(l))$ et
$$\mathbb P\big[X_{t+l}\in\hat X_t(l)\pm u_{\varepsilon/2}\sqrt{V(l)}\big]=1-\varepsilon$$
($u_{\varepsilon/2}$ : quantile de la loi normale, 1,96 à 95 %). Approximatif, car $\sigma^2$ et les $\psi_i$ sont estimés ; d’autant meilleur que $N$ est grand. Les prévisions sont peu sensibles aux erreurs d’estimation des paramètres, <b>si le modèle est correct</b>.</div>
<p>Exemple du cours : AR(2) sur la série « Recruitment », prévision sur 24 mois : elle converge vers la moyenne de la série et l’intervalle se stabilise.</p>
<h4>3. Cas particuliers</h4>
<p><b>MA(1)</b> $X_t=\mu+W_t-\theta W_{t-1}$ : $\hat X_t(1)=\mu-\theta W_t$ et $\hat X_t(l)=\mu$ pour $l>1$ ; variance d’erreur $\sigma^2$ ($l=1$) puis $\sigma^2(1+\theta^2)$ ($l>1$). Après $q$ pas, un MA(q) ne prévoit plus que sa moyenne.</p>
<p><b>AR(1)</b> $X_t=\mu+\phi(X_{t-1}-\mu)+W_t$ : $\hat X_t(l)=\mu+\phi[\hat X_t(l-1)-\mu]$, donc par récurrence $\hat X_t(l)=\mu+\phi^l(X_t-\mu)\to\mu$ ; $\mathrm{var}(E_t(l))=\sigma^2(1+\phi^2+\dots+\phi^{2(l-1)})=\sigma^2\frac{1-\phi^{2l}}{1-\phi^2}\to\frac{\sigma^2}{1-\phi^2}$, la variance de la série. Il faut d’abord estimer $\phi$.</p>
<p><b>ARI(p,d) et IMA(d,q)</b> : la prévision tend vers un polynôme en $l$ : une constante pour $d=0$ et $d=1$, une droite pour $d=2$, une parabole pour $d=3$.</p>
<h4>4. Savoir-faire</h4>
<p><b>AR(1)</b> sur une croissance trimestrielle : prenons $\mu=0{,}02$, $\phi=0{,}5$, $\sigma=0{,}04$, dernière valeur $X_t=0{,}05$.</p>
<table><tr><th>$l$</th><th>$\hat X_t(l)$</th><th>$V(l)$</th><th>demi-largeur à 95 %</th></tr>
<tr><td>1</td><td>$0{,}02+0{,}5\times0{,}03=0{,}035$</td><td>$0{,}0016$</td><td>$0{,}0784$</td></tr>
<tr><td>2</td><td>$0{,}0275$</td><td>$0{,}0016\times1{,}25=0{,}002$</td><td>$0{,}0877$</td></tr>
<tr><td>3</td><td>$0{,}02375$</td><td>$0{,}0021$</td><td>$0{,}0898$</td></tr>
<tr><td>$\infty$</td><td>$0{,}02$</td><td>$0{,}0016/0{,}75=0{,}00213$</td><td>$0{,}0905$</td></tr></table>
<p><b>MA(1)</b> : prenons $\mu=0$, $\theta=0{,}6$, dernier résidu $\hat W_t=1{,}5$, $\sigma=1$. $\hat X_t(1)=-0{,}9$, intervalle $\pm1{,}96$ ; $\hat X_t(2)=0$, intervalle $\pm1{,}96\sqrt{1{,}36}=\pm2{,}29$.</p>
<h4>5. Série transformée et mises à jour</h4>
<p>Pour une transformation non linéaire, la prévision optimale de la série transformée ne l’est pas pour la série initiale. Log : la prévision optimale de $x_{t+l}$ est $\exp[\hat X_t(l)+\frac12\mathrm{var}(E_t(l))]$, pas $\exp[\hat X_t(l)]$. Exemple : $\hat X_t(l)=4{,}6$ et $\mathrm{var}=0{,}01$ donnent $99{,}98$ au lieu de $99{,}48$.</p>
<div class="def"><b>Mise à jour</b> de $t$ à $t+1$ : $\hat X_t(l+1)=\psi_{l+1}W_t+\psi_{l+2}W_{t-1}+\dots$ et $\hat X_{t+1}(l)=\psi_lW_{t+1}+\psi_{l+1}W_t+\dots$, donc $\hat X_{t+1}(l)=\hat X_t(l+1)+\psi_l\hat W_{t+1}$, avec $\hat W_{t+1}=X_{t+1}-\hat X_t(1)$ (l’erreur de prévision à un pas). Des prévisions faites en $t$ sur $[t+1,t+h]$ donnent celles faites en $t+1$ sur $[t+2,t+h]$, à condition de connaître les $\psi_i$ (calculables à partir des $\phi$ et des $\theta$).</div>
<p>Suite de l’exemple AR(1) ($\psi_1=\phi=0{,}5$) : on observe $X_{t+1}=0{,}01$. Surprise $\hat W_{t+1}=0{,}01-0{,}035=-0{,}025$, d’où $\hat X_{t+1}(1)=0{,}0275+0{,}5\times(-0{,}025)=0{,}015$, ce que donne aussi directement $0{,}02+0{,}5\times(0{,}01-0{,}02)$.</p>
<h4>6. Donnée réelle : quand la structure change</h4>
<p>Avec l’AR(4) ajusté sur la croissance de l’indice BRI jusqu’à 2004-T4 (voir Box-Jenkins), la prévision pour 2005-T1 est $68{,}98$ (le niveau était 70), intervalle à 95 % de $63{,}14$ à $75{,}36$. La valeur publiée est $97$ : l’écart vaut $7{,}6$ écarts types en log. Le modèle n’est pas en cause ; l’hypothèse « pas de changement de structure » du principe général est violée par ce qui ressemble à une rupture de série. Remarque : $68{,}98=70\,e^{\hat g}$ est la médiane ; la correction du log donne une moyenne de $69{,}05$.</p>
<h4>7. Pièges</h4>
<ul><li>L’intervalle ne couvre que l’aléa du modèle, ni l’erreur sur les paramètres, ni une rupture.</li>
<li>$\exp$ de la prévision du log donne la médiane, pas la moyenne.</li>
<li>Aucune donnée postérieure à $t$ ne doit entrer dans $\hat X_t(l)$ (pas de « look-ahead »), y compris dans l’estimation des paramètres quand on évalue des prévisions passées.</li></ul>
<h4>8. Lien finance</h4>
<p>L’intervalle $\hat X_t(l)\pm u\sqrt{V(l)}$ est la même logique qu’une valeur en risque paramétrique, et la croissance de $V(l)$ avec $l$ explique pourquoi le risque d’un horizon long dépasse celui d’un horizon court. La discipline $\mathbb E_t$ (n’utiliser que l’information disponible en $t$) est aussi celle du TFE de Roy, qui analyse un risque de crédit à une date $t$ (aucun résultat n’y est encore mesuré).</p>
<h4>À retenir</h4>
<ul><li>$\hat X_t(l)=\mathbb E_t(X_{t+l})$ : chocs futurs à 0, valeurs passées connues.</li>
<li>$V(l)=\sigma^2(1+\psi_1^2+\dots+\psi_{l-1}^2)$ croît avec $l$ ; intervalle $\hat X_t(l)\pm1{,}96\sqrt{V(l)}$.</li>
<li>AR(1) : $\mu+\phi^l(X_t-\mu)\to\mu$ ; MA(1) : $\mu-\theta W_t$ puis $\mu$.</li>
<li>Log : $\exp[\hat X+\frac12\mathrm{var}]$ ; mise à jour $\hat X_{t+1}(l)=\hat X_t(l+1)+\psi_l\hat W_{t+1}$.</li></ul>`,
      },
    ],

    cards: [
      ['ts-intro', 'def', R`Qu’est-ce qui distingue une série chronologique de données i.i.d. ?`, R`L’ordre compte et les données sont autocorrélées : $x_t$ dépend des valeurs passées.`],
      ['ts-intro', 'principe', R`Principe général de la prévision ?`, R`Modéliser le passé en supposant que la structure ne change pas ; valable à court terme.`],
      ['ts-intro', 'lagplot', R`Qu’est-ce qu’un lag-plot et à quoi sert-il ?`, R`Le nuage $(x_{t-k},x_t)$ : il révèle la dépendance de la série à son passé au délai $k$ (informe pour un bruit blanc).`],
      ['ts-decomp', 'additif', R`Modèle additif de décomposition ?`, R`$x_t=T_t+S_t+C_t+R_t$ : tendance, saison, cycle, résidu (composantes indépendantes).`],
      ['ts-decomp', 'multi', R`Modèle multiplicatif et comment le traiter ?`, R`$x_t=T_tS_tC_tR_t$ (amplitude saisonnière proportionnelle au niveau) ; le logarithme le rend additif.`],
      ['ts-decomp', 'tactique', R`Tactique d’analyse d’une série ?`, R`Supposer un modèle additif, retirer les composantes déterministes, vérifier que le résidu est stationnaire (sinon transformer, par ex. log).`],
      ['ts-filters', 'diff', R`Que fait la différence première $\nabla x_t$ et quel est son défaut ?`, R`Elle enlève une tendance linéaire, mais crée une dépendance fictive : $y_t=b+R_t-R_{t-1}$.`],
      ['ts-filters', 'diff2', R`Différence seconde et différence saisonnière ?`, R`$\nabla^2x_t=x_t-2x_{t-1}+x_{t-2}$ enlève une tendance quadratique ; $\nabla_sx_t=x_t-x_{t-s}$ enlève une tendance entre valeurs distantes de $s$.`],
      ['ts-filters', 'ma', R`Effets d’une moyenne mobile symétrique d’ordre $2q+1$ ?`, R`Élimine une saison additive de période $2q+1$, laisse passer une tendance linéaire, réduit la variance du bruit, perd des points aux bords, crée des corrélations et une périodicité artificielles (Yule-Slutsky).`],
      ['ts-filters', 'expo', R`Lissage exponentiel ?`, R`$y_t=\alpha x_t+(1-\alpha)y_{t-1}$, soit des poids $\alpha(1-\alpha)^j$ sur le passé.`],
      ['ts-acf', 'rk', R`Formule du coefficient d’autocorrélation empirique $r_k$ ?`, R`$r_k=\sum_{t=1}^{N-k}(x_t-\bar x)(x_{t+k}-\bar x)/\sum_{t=1}^N(x_t-\bar x)^2$.`],
      ['ts-acf', 'bande', R`Bande de confiance d’un corrélogramme de bruit blanc ?`, R`$\pm2/\sqrt N$ : environ 95 % des $r_k$ y tombent ($r_k\approx\mathcal N(0,1/N)$).`],
      ['ts-acf', 'lecture', R`Comment repérer non-stationnarité et saisonnalité sur un corrélogramme ?`, R`Non-stationnarité : décroissance lente des $r_k$. Saison : grands bâtonnets aux délais multiples de la période (12, 24…).`],
      ['ts-stat', 'faible', R`Stationnarité faible ?`, R`$\mathbb E(X_t)=\mu$, $\mathrm{Var}(X_t)=\sigma^2$, $\mathrm{Cov}(X_t,X_{t+k})=\gamma_k$, tous indépendants de $t$.`],
      ['ts-stat', 'strict', R`Lien entre stationnarité stricte et faible ?`, R`Stricte ⇒ faible (si les moments existent), pas l’inverse, sauf pour un processus gaussien où elles sont équivalentes.`],
      ['ts-stat', 'bb', R`Bruit blanc faible vs fort ?`, R`Faible : moyenne nulle, variance constante, non corrélé. Fort : en plus indépendant.`],
      ['ts-stat', 'marche', R`Moments de la marche aléatoire $X_t=\sum_{i\le t}Z_i$ et conclusion ?`, R`$\mathbb E=t\mu$, $\mathrm{Var}=t\sigma^2$, $\mathrm{Cov}(X_t,X_{t+h})=t\sigma^2$ : dépend de $t$, non stationnaire.`],
      ['ts-stat', 'adf', R`Test de Dickey-Fuller augmenté : comment lire la p-value ?`, R`Si p-value < 0,05, on rejette l’hypothèse de non-stationnarité (racine unitaire).`],
      ['ts-acvf', 'props', R`Propriétés de $\gamma_k$ et $\rho_k$ ?`, R`$\gamma_0=\sigma^2$, $\gamma_k=\gamma_{-k}$, $|\gamma_k|\le\gamma_0$ ; $\rho_0=1$, $|\rho_k|\le1$, $\rho_k=\rho_{-k}$.`],
      ['ts-acvf', 'pacf', R`Autocorrélation partielle $\phi_{kk}$ ?`, R`Corrélation entre $X_t$ et $X_{t+k}$ une fois retirée leur explication linéaire par $X_{t+1..t+k-1}$ ; estimée par Durbin-Levinson.`],
      ['ts-linear', 'lin', R`Processus linéaire et condition de stationnarité ?`, R`$X_t=\mu+\sum_{j\ge0}\psi_jW_{t-j}$ ($\psi_0=1$), faiblement stationnaire si $\sum\psi_j^2<\infty$.`],
      ['ts-linear', 'wold', R`Théorème de Wold ?`, R`Tout processus faiblement stationnaire = partie linéaire en un bruit blanc d’innovations $\sum\psi_iW_{t-i}$ + partie purement déterministe, non corrélées.`],
      ['ts-linear', 'inv', R`Inversibilité ?`, R`Pouvoir écrire $X_t=W_t+\sum\Pi_jX_{t-j}$ avec $\sum|\Pi_j|<\infty$. Un processus inversible est entièrement déterminé par son ACF.`],
      ['ts-linear', 'ma1', R`MA(1) $X_t=W_t-\theta W_{t-1}$ : ACF et condition d’inversibilité ?`, R`$\rho_1=-\theta/(1+\theta^2)$, $\rho_k=0$ pour $k>1$ ; inversible ssi $|\theta|<1$.`],
      ['ts-linear', 'ar1', R`AR(1) $X_t=\phi X_{t-1}+W_t$ : condition de stationnarité et ACF ?`, R`Stationnaire ssi $|\phi|<1$ ; $\rho_k=\phi^k$.`],
      ['ts-ar', 'B', R`Opérateur retard et écriture d’un AR(p) ?`, R`$BX_t=X_{t-1}$ ; $\Phi_p(B)X_t=W_t$ avec $\Phi_p(z)=1-\phi_1z-\dots-\phi_pz^p$.`],
      ['ts-ar', 'stat', R`Condition de stationnarité d’un AR(p) ?`, R`Toutes les racines de $\Phi_p(z)$ sont de module $>1$ (hors du cercle unité).`],
      ['ts-ar', 'yw', R`Équations de Yule-Walker ?`, R`$\rho_k=\phi_1\rho_{k-1}+\dots+\phi_p\rho_{k-p}$ pour $k\ge1$.`],
      ['ts-ar', 'var', R`Variance d’un AR(p) stationnaire ?`, R`$\sigma_x^2=\sigma_w^2/(1-\phi_1\rho_1-\dots-\phi_p\rho_p)$.`],
      ['ts-ar', 'pacf', R`Signature ACF / PACF d’un AR(p) ?`, R`ACF : décroissance exponentielle ou sinusoïde amortie. PACF : nulle après $p$.`],
      ['ts-ma', 'def', R`Définition d’un MA(q) et ses propriétés de stationnarité / inversibilité ?`, R`$X_t=\Theta_q(B)W_t$ : toujours stationnaire, inversible ssi racines de $\Theta_q$ hors du cercle unité.`],
      ['ts-ma', 'acf', R`Signature ACF / PACF d’un MA(q) ?`, R`ACF nulle après $q$ (mémoire courte) ; PACF qui décroît (exponentielle ou sinusoïde amortie).`],
      ['ts-ma', 'var', R`Variance d’un MA(q) ?`, R`$\sigma_w^2(1+\theta_1^2+\dots+\theta_q^2)$.`],
      ['ts-ma', 'ordre', R`Comment identifier l’ordre d’un AR et d’un MA ?`, R`MA(q) : sur l’ACF (nulle après $q$). AR(p) : sur la PACF (nulle après $p$).`],
      ['ts-arma', 'def', R`Modèle ARMA(p,q) et hypothèse ?`, R`$\Phi_p(B)X_t=\Theta_q(B)W_t$, sans facteur commun entre $\Phi_p$ et $\Theta_q$.`],
      ['ts-arma', 'interet', R`Intérêt d’un ARMA par rapport à un AR ou MA pur ?`, R`Parcimonie : décrire la série avec moins de paramètres, donc moins de sur-apprentissage.`],
      ['ts-arma', 'acf', R`ACF et PACF d’un ARMA stationnaire inversible ?`, R`Toutes deux dominées par des exponentielles décroissantes ; aucune ne s’annule nettement.`],
      ['ts-arima', 'arima', R`Définition d’un ARIMA(p,d,q) ?`, R`$\nabla^dX_t$ est un ARMA(p,q) : $\Phi_p(B)(1-B)^dX_t=\Theta_q(B)W_t$.`],
      ['ts-arima', 'rw', R`Quel ARIMA est la marche aléatoire ?`, R`ARIMA(0,1,0) : $\nabla X_t=W_t$.`],
      ['ts-arima', 'boxcox', R`Transformation de Box-Cox ?`, R`$g_\lambda(x)=(x^\lambda-1)/\lambda$ si $\lambda\neq0$, $\ln x$ si $\lambda=0$ : contre la non-stationnarité en variance.`],
      ['ts-arima', 'nablaS', R`$\nabla_{12}$ vs $\nabla^{12}$ ?`, R`$\nabla_{12}x_t=x_t-x_{t-12}$ (saisonnier, <code>data - data.shift(12)</code>) ; $\nabla^{12}$ = 12 différences premières successives (<code>np.diff(data, n=12)</code>).`],
      ['ts-arima', 'sarima', R`Écriture d’un SARIMA(p,d,q)(P,D,Q)$_S$ ?`, R`$\Phi_p(B)\tilde\Phi_P(B^S)\nabla^d\nabla_S^DX_t=\Theta_q(B)\tilde\Theta_Q(B^S)W_t$.`],
      ['ts-arima', 'sar-sma', R`Signatures d’un SAR(P) et d’un SMA(Q) ?`, R`SAR(P) : bâtonnets saisonniers de la PACF nuls à partir de $(P+1)S$. SMA(Q) : bâtonnets saisonniers de l’ACF nuls à partir de $(Q+1)S$.`],
      ['ts-estim', 'mean', R`La moyenne empirique d’une série stationnaire est-elle biaisée ?`, R`Non : $\mathbb E(\bar X)=\mu$ par linéarité et stationnarité.`],
      ['ts-estim', 'Ck', R`Propriétés de l’estimateur $C_k$ de l’autocovariance ?`, R`Biaisé, $\mathbb E(C_k)=(1-k/N)[\gamma_k-\mathrm{Var}\bar X]$, asymptotiquement sans biais ; les $C_k$ sont fortement corrélés entre eux.`],
      ['ts-estim', 'jack', R`Jackknife pour l’autocovariance ?`, R`$\tilde C_k=2C_k-\frac12(C_{k1}+C_{k2})$ sur les deux moitiés : biais en $1/N^2$ et test de stationnarité.`],
      ['ts-estim', 'Rk-bb', R`Moments de $R_k$ pour un bruit blanc ?`, R`$\mathbb E(R_k)\approx-1/N$, $\mathrm{Var}(R_k)\approx1/N$, asymptotiquement normal.`],
      ['ts-fit', 'ar1', R`Estimateur de $\phi_1$ dans un AR(1) ?`, R`$\hat\phi_1\approx r_1=\sum(X_t-\bar X)(X_{t+1}-\bar X)/\sum(X_t-\bar X)^2$.`],
      ['ts-fit', 'ar2', R`Estimateurs de Yule-Walker d’un AR(2) ?`, R`$\hat\phi_1=R_1(1-R_2)/(1-R_1^2)$, $\hat\phi_2=(R_2-R_1^2)/(1-R_1^2)$.`],
      ['ts-fit', 'ywmat', R`Yule-Walker sous forme matricielle ?`, R`$\hat\phi=R_p^{-1}\hat\rho$, $R_p$ = matrice de Toeplitz des autocorrélations.`],
      ['ts-fit', 'ma', R`Pourquoi l’ajustement d’un MA est-il plus difficile, et comment fait-on ?`, R`Pas d’estimateur explicite efficace ; on fixe $W_0=0$, on calcule récursivement les résidus et on minimise $\sum W_t^2$ (grille ou Marquardt).`],
      ['ts-fit', 'mle', R`Avantages et inconvénients du maximum de vraisemblance ?`, R`Toute l’information, estimateurs asymptotiquement efficaces ; mais hypothèses sur les lois jointes et calculs lourds.`],
      ['ts-bj', 'etapes', R`Étapes de Box-Jenkins ?`, R`Stationnariser, identifier (ACF/PACF, parcimonie, AIC/BIC), ajuster, diagnostiquer les résidus ; recommencer si besoin.`],
      ['ts-bj', 'residus', R`Que doit-on vérifier sur les résidus ?`, R`Bruit blanc : pas de tendance ni de variance changeante, normalité (QQ-plot, Shapiro-Wilk), non-corrélation (ACF/PACF dans $\pm2/\sqrt N$, Durbin-Watson, portemanteau).`],
      ['ts-bj', 'ljung', R`Statistique de Ljung-Box et sa loi ?`, R`$Q^*=n(n+2)\sum_{k=1}^K\hat R_k^2/(n-k)\sim\chi^2_{K-p-q}$ (préférée à Box-Pierce pour $n$ petit).`],
      ['ts-bj', 'overfit', R`Comment détecter le sur-ajustement en passant d’AR(2) à AR(3) ?`, R`Overfitting si $\phi_3$ n’est pas significatif ET si $\hat\phi_1,\hat\phi_2$ changent beaucoup.`],
      ['ts-forecast', 'pred', R`Prédicteur optimal et variance de l’erreur de prévision ?`, R`$\hat X_t(l)=\mathbb E_t(X_{t+l})$ ; $V(l)=\sigma^2(1+\psi_1^2+\dots+\psi_{l-1}^2)$, croissante avec $l$.`],
      ['ts-forecast', 'ar1', R`Prévision d’un AR(1) à l’horizon $l$ ?`, R`$\hat X_t(l)=\mu+\phi^l(X_t-\mu)\to\mu$, variance $\sigma^2(1-\phi^{2l})/(1-\phi^2)\to\sigma^2/(1-\phi^2)$.`],
      ['ts-forecast', 'ma1', R`Prévision d’un MA(1) ?`, R`$\hat X_t(1)=\mu-\theta W_t$, puis $\mu$ pour $l>1$ ; variance $\sigma^2$ puis $\sigma^2(1+\theta^2)$.`],
      ['ts-forecast', 'ic', R`Intervalle de prévision ?`, R`$\hat X_t(l)\pm u_{\varepsilon/2}\sqrt{V(l)}$ (1,96 à 95 %), sous hypothèse de bruit gaussien.`],
      ['ts-forecast', 'log', R`Prévision de $x_t$ quand on a modélisé $\log x_t$ ?`, R`$\exp[\hat X_t(l)+\frac12\mathrm{var}(E_t(l))]$, pas simplement $\exp[\hat X_t(l)]$.`],
      ['ts-forecast', 'maj', R`Mise à jour des prévisions de $t$ à $t+1$ ?`, R`$\hat X_{t+1}(l)=\hat X_t(l+1)+\psi_l\hat W_{t+1}$ avec $\hat W_{t+1}=X_{t+1}-\hat X_t(1)$.`],

      // ----- Ajouts (22/10/2026) -----
      ['ts-intro', 'objectifs', R`Quels sont les objectifs de l’analyse d’une série chronologique ?`, R`Modéliser (description compacte), interpréter, prévoir, contrôler ; accessoirement simuler et tester des hypothèses.`],
      ['ts-intro', 'approches', R`Quelles sont les deux grandes approches d’analyse, et laquelle suit le cours ?`, R`Fréquentielle (Fourier, spectre, superposition de cycles) et temporelle (fonctions d’autocorrélation). Le cours suit l’approche temporelle.`],
      ['ts-intro', 'univ-multi', R`Série univariée et multivariée : quelle différence de modélisation ?`, R`Univariée : un modèle pour une variable, ajusté, validé, puis utilisé pour prédire $x_{t+h}$ à partir de $x_s$, $s\le t$. Multivariée : on modélise aussi les interdépendances (entrées, sorties, retards).`],
      ['ts-decomp', 'logAB', R`Modèles A $x_t=T_tS_tR_t$ et B $x_t=T_tS_t+R_t$ : que fait le log ?`, R`Il rend la saison additive dans les deux ; il ne stabilise la variance dans B que si $R_t$ est petit devant $S_t$.`],
      ['ts-decomp', 'courbes', R`Quelles courbes ajuste-t-on à une tendance, et sur quelle série ?`, R`Polynôme, exponentielle (droite après log), Gompertz $\log x_t=a-br^t$, logistique ; par moindres carrés sur la série transformée et désaisonnalisée.`],
      ['ts-decomp', 'cycle-saison', R`Différence entre saisonnalité et cycle ?`, R`La saison a une période fixe et courte (12 mois, 4 trimestres) ; le cycle est une oscillation de moyen ou long terme sans période fixe.`],
      ['ts-filters', 'yule-slutsky', R`Effet Yule-Slutsky : exemple chiffré ?`, R`La moyenne de 3 bruits blancs successifs a une corrélation $2/3$ au délai 1 et $1/3$ au délai 2 : le lissage crée des corrélations et des oscillations qui n’existent pas dans les données.`],
      ['ts-filters', 'bords', R`Défaut pratique d’une moyenne mobile symétrique sur des données en flux ?`, R`Elle perd $q$ points à chaque bord, dont les plus récents : elle n’estime pas le présent. Un filtre asymétrique (lissage exponentiel) n’a d’effet de bord que du côté passé.`],
      ['ts-filters', 'nabla-s-ex', R`$x_t=a+bt+S_t$ avec une saison additive de période $s$ : que donne $\nabla_sx_t$ ?`, R`La constante $sb$ : la saison ($S_t=S_{t-s}$) et la pente disparaissent.`],
      ['ts-acf', 'calcul', R`Étapes du calcul de $r_1$ à la main ?`, R`Moyenne, écarts à la moyenne, somme des carrés des écarts (dénominateur), somme des produits des écarts consécutifs (numérateur, $N-1$ termes), quotient.`],
      ['ts-acf', 'tendance', R`Pourquoi le corrélogramme d’une série à tendance n’est-il pas une vraie autocorrélation ?`, R`$r_k$ n’estime $\rho_k$ que si la série est stationnaire ; avec une tendance, $\rho_k$ n’existe pas et la décroissance lente reflète seulement la tendance.`],
      ['ts-acf', 'hasard', R`Combien de coefficients d’un bruit blanc sortent de la bande $\pm2/\sqrt N$ sur les 20 premiers ?`, R`Un en moyenne (5 %) : un bâtonnet isolé hors bande n’est pas une preuve de dépendance.`],
      ['ts-stat', 'lois', R`Que faut-il connaître pour connaître un processus, et pourquoi se limite-t-on aux moments d’ordre 1 et 2 ?`, R`Toutes ses lois fini-dimensionnelles $F_{t_1..t_h}$ ; impossible à estimer quand $h$ grandit, d’où la stationnarité faible.`],
      ['ts-stat', 'rw-corr', R`Corrélation entre $X_t$ et $X_{t+h}$ pour une marche aléatoire ?`, R`$\sqrt{t/(t+h)}$, proche de 1 quand $t$ est grand ($0{,}995$ pour $t=100$, $h=1$) : elle dépend de $t$.`],
      ['ts-acvf', 'ex2', R`ACF de $X_t=2+W_t-W_{t-1}$ ?`, R`$\gamma_0=2\sigma^2$, $\gamma_1=-\sigma^2$, donc $\rho_1=-1/2$, puis $\rho_k=0$ ; la constante ne joue aucun rôle.`],
      ['ts-acvf', 'phi22', R`$\phi_{11}$ et $\phi_{22}$ en fonction des $\rho_k$ ?`, R`$\phi_{11}=\rho_1$, $\phi_{22}=(\rho_2-\rho_1^2)/(1-\rho_1^2)$ (Durbin-Levinson).`],
      ['ts-acvf', 'usages', R`Que permet de détecter l’autocorrélogramme ?`, R`Une tendance (décroissance lente), la stationnarité (décroissance rapide, bornée par une exponentielle) et des phénomènes périodiques.`],
      ['ts-linear', 'determ', R`Processus purement déterministe : définition et exemple ?`, R`La régression sur le passé lointain réduit la variance ($\lim\sigma_q^2<\mathrm{var}X_t$). Ex. $K\cos(\omega t+\theta)$, $\theta$ aléatoire fixé par réalisation : prévisible une fois $\theta$ estimé.`],
      ['ts-linear', 'impulse', R`Que représentent les poids $\psi_j$ ?`, R`L’effet sur $X_t$ d’un choc survenu $j$ périodes plus tôt (réponse impulsionnelle) ; AR(1) : $\psi_j=\phi^j$.`],
      ['ts-ar', 'filtre', R`Qu’est-ce qu’un filtre et comment lire $\Phi_p(B)X_t=W_t$ ?`, R`Un opérateur linéaire qui commute avec $B$. Filtrée par $\Phi_p(B)$, la série se réduit au choc $W_t$.`],
      ['ts-ar', 'demi-vie', R`Demi-vie d’un écart dans un AR(1) ?`, R`$\ln0{,}5/\ln\phi$ périodes : avec $\phi=0{,}95$ en mensuel, environ 13,5 mois.`],
      ['ts-ar', 'yw-r1', R`$\rho_1$ d’un AR(2) en fonction de $\phi_1,\phi_2$ ?`, R`$\rho_1=\phi_1/(1-\phi_2)$ (Yule-Walker à $k=1$ avec $\rho_{-1}=\rho_1$), puis $\rho_2=\phi_1\rho_1+\phi_2$.`],
      ['ts-ma', 'pacf-ma1', R`PACF d’un MA(1) $X_t=W_t-\theta W_{t-1}$ ?`, R`$\phi_{kk}=-\theta^k(1-\theta^2)/(1-\theta^{2(k+1)})$ : décroissance géométrique, jamais nulle.`],
      ['ts-ma', 'signe', R`Piège de signe entre le cours et statsmodels pour un MA ?`, R`Le cours écrit $W_t-\theta W_{t-1}$, statsmodels $W_t+\theta W_{t-1}$ : un $\hat\theta=0{,}4$ logiciel correspond à $\theta=-0{,}4$ dans le cours.`],
      ['ts-arma', 'formes', R`Relations entre $\Phi,\Theta$ et les formes pures $\Psi$, $\Pi$ d’un ARMA ?`, R`$\Psi(B)\Phi(B)=\Theta(B)$ (MA(∞)) et $\Phi(B)=\Pi(B)\Theta(B)$ (AR(∞)).`],
      ['ts-arma', 'psi11', R`Poids $\psi_j$ d’un ARMA(1,1) $X_t-\phi X_{t-1}=W_t-\theta W_{t-1}$ ?`, R`$\psi_0=1$, $\psi_j=(\phi-\theta)\phi^{j-1}$ ; ex. $\phi=0{,}5$, $\theta=0{,}3$ : $0{,}2$ ; $0{,}1$ ; $0{,}05$.`],
      ['ts-arma', 'pi11', R`Forme AR(∞) d’un ARMA(1,1) ?`, R`$X_t=W_t+\sum_{j\ge1}(\phi-\theta)\theta^{j-1}X_{t-j}$ ; ex. $0{,}5$ / $0{,}3$ : poids $0{,}2$ ; $0{,}06$ ; $0{,}018$.`],
      ['ts-arima', 'init', R`Pourquoi un ARIMA doit-il commencer à une date avec des valeurs initiales ?`, R`$\sum_{k=-\infty}^tW_k$ ne converge pas (variance infinie) : on écrit $X_t=X_0+\sum_{k=0}^tW_k$, avec $q$ valeurs initiales pour $W$ et $p+d$ pour $X$.`],
      ['ts-arima', 'sar-ex', R`ACF de $X_t=W_t+0{,}4W_{t-12}$ et de $X_t-0{,}7X_{t-12}=W_t$ ?`, R`SMA(1) : $\rho_{12}=0{,}4/1{,}16=0{,}345$, 0 ailleurs. SAR(1) : $\rho_{12}=0{,}7$, $\rho_{24}=0{,}49$, … décroissance aux multiples de 12.`],
      ['ts-arima', 'surdiff', R`Signe d’une sur-différenciation ?`, R`$\nabla$ d’un bruit blanc donne un MA(1) non inversible ($\theta=1$) : $r_1$ proche de $-0{,}5$ et variance qui augmente.`],
      ['ts-estim', 'bartlett', R`Formule de Bartlett et usage ?`, R`Si $\rho_k=0$ pour $k>q$ : $\mathrm{Var}(R_k)\approx\frac1N(1+2\sum_{i=1}^q\rho_i^2)$ pour $k>q$ ; elle élargit la bande après les premiers pics (slide 04·10 écrit sans carrés, à confirmer).`],
      ['ts-estim', 'band-N', R`Intervalle exact à 95 % de $r_k$ pour un bruit blanc ?`, R`$-\frac1N\pm\frac2{\sqrt N}$, souvent approché par $\pm\frac2{\sqrt N}$.`],
      ['ts-fit', 'ma1-mom', R`Pourquoi ne pas estimer un MA(1) en inversant $R_1=-\theta/(1+\theta^2)$ ?`, R`Pas de racine réelle si $|R_1|>0{,}5$, et l’estimateur n’est pas efficace sinon ; deux racines $\theta$ et $1/\theta$ (garder l’inversible).`],
      ['ts-fit', 'test-phi', R`Comment tester $\phi_1=0$ dans un AR(1) ?`, R`$\rho_1=\phi_1$, donc on regarde si $\hat\phi_1\approx r_1$ tombe dans $\pm2/\sqrt N$ (95 %).`],
      ['ts-fit', 'cond-exact', R`Moindres carrés conditionnels et vraisemblance exacte : différence pour un AR(1) ?`, R`$S=S^*+(1-\phi^2)(X_1-\mu)^2$ : la vraisemblance exacte ajoute la loi de $X_1$ ; différence négligeable sauf si $N$ est petit ; $\hat\sigma^2=S/N$.`],
      ['ts-bj', 'parcimonie', R`Principe de parcimonie et critères associés ?`, R`Commencer par les plus petits modèles compatibles avec l’ACF/PACF (AR(1), MA(1), puis petits ARMA) ; comparer avec AIC, BIC (plus petit = meilleur).`],
      ['ts-bj', 'portemanteau', R`Pourquoi dit-on que les tests du portemanteau sont des tests de rejet ?`, R`$H_0$ (bruit blanc) est précise mais l’alternative vague et la puissance faible : un rejet est informatif, une absence de rejet ne prouve pas que le modèle est bon.`],
      ['ts-bj', 'reel', R`Sur l’indice BRI (croissance 1973-2004), pourquoi l’AR(1) est-il rejeté ?`, R`Ljung-Box $K=8$ : $Q^*=25{,}79$, 7 ddl, p-value $0{,}0005$ ; les résidus gardent une corrélation au délai 4 (saison trimestrielle). L’AR(4) donne $Q^*=3{,}96$, p-value $0{,}41$.`],
      ['ts-forecast', 'recursif', R`Comment calculer $\hat X_t(l)$ sans les $\psi_j$ ?`, R`Prendre $\mathbb E_t$ de la forme ARMA : chocs futurs remplacés par 0, chocs passés par les résidus, valeurs passées connues, valeurs futures par leurs prévisions.`],
      ['ts-forecast', 'rupture', R`Que couvre l’intervalle de prévision, et que ne couvre-t-il pas ?`, R`L’aléa des chocs futurs du modèle ; ni l’erreur sur les paramètres, ni un changement de structure (ex. BRI 2005-T1 : 97 observé, intervalle 63,14 à 75,36).`],
    ],

    quiz: [
      ['ts-intro', R`Pourquoi ne peut-on pas traiter une série temporelle comme un échantillon i.i.d. ?`, ['les observations sont autocorrélées et leur ordre compte', 'elles sont trop nombreuses', 'elles sont toujours gaussiennes', 'elles n’ont pas de moyenne'], 0, R`$x_t$ dépend de $x_{t-1},x_{t-2},\dots$`],
      ['ts-intro', R`Sur quelle hypothèse repose toute prévision par modèle ?`, ['la structure qui a généré le passé reste la même dans le futur proche', 'le futur est indépendant du passé', 'la série est un bruit blanc', 'la série est déterministe'], 0, R`D’où une prévision valable à court terme seulement.`],
      ['ts-acvf', R`Pour un processus stationnaire, $\gamma_3=-2$ et $\gamma_0=8$. $\rho_{-3}$ vaut :`, ['−0,25', '0,25', '−2', '4'], 0, R`$\rho_{-3}=\rho_3=\gamma_3/\gamma_0=-0{,}25$.`],
      ['ts-acvf', R`Lequel de ces nombres ne peut PAS être une autocovariance $\gamma_k$ si $\gamma_0=4$ ?`, ['5', '−4', '0', '3,9'], 0, R`$|\gamma_k|\le\gamma_0$.`],
      ['ts-acvf', R`$X_t=2+W_t-W_{t-1}$. Que vaut $\rho_1$ ?`, ['−0,5', '0,5', '−1', '0'], 0, R`$\gamma_0=2\sigma^2$, $\gamma_1=-\sigma^2$.`],
      ['ts-decomp', R`L’amplitude saisonnière d’AirPassengers grandit avec le niveau. Quel modèle et quelle transformation ?`, ['multiplicatif, logarithme', 'additif, aucune', 'multiplicatif, différence saisonnière', 'additif, Box-Cox λ = 1'], 0, R`Le log rend la saison multiplicative additive et stabilise la variance.`],
      ['ts-filters', R`Quel filtre élimine une tendance quadratique ?`, [R`$\nabla^2$`, R`$\nabla$`, R`$\nabla_{12}$`, 'moyenne mobile d’ordre 3'], 0, R`$\nabla$ enlève le linéaire, $\nabla^2$ le quadratique.`],
      ['ts-acf', R`$N=400$. Au-delà de quelle valeur absolue un $r_k$ est-il « significatif » à 95 % pour un bruit blanc ?`, ['0,1', '0,05', '0,2', '0,02'], 0, R`$2/\sqrt{400}=0{,}1$.`],
      ['ts-acf', R`Un corrélogramme décroît très lentement de 0,98 à 0,6 sur 30 délais. Cela suggère :`, ['une non-stationnarité (tendance)', 'un bruit blanc', 'un MA(1)', 'une saison de période 30'], 0, R`Décroissance lente = série non stationnaire en moyenne.`],
      ['ts-stat', R`La marche aléatoire n’est pas stationnaire parce que :`, ['sa variance croît avec t', 'sa moyenne est nulle', 'ses accroissements sont indépendants', 'elle est gaussienne'], 0, R`$\mathrm{Var}(X_t)=t\sigma^2$.`],
      ['ts-linear', R`MA(1) avec $\theta=2$ et MA(1) avec $\theta=0{,}5$ :`, ['même ACF, seul le second est inversible', 'ACF différentes', 'tous deux inversibles', 'aucun n’est stationnaire'], 0, R`$-\frac\theta{1+\theta^2}$ est identique pour $\theta$ et $1/\theta$ ; inversible ssi $|\theta|<1$.`],
      ['ts-ar', R`AR(1) avec $\phi=1$ :`, ['n’est pas stationnaire (marche aléatoire)', 'est stationnaire', 'n’est pas inversible', 'est un bruit blanc'], 0, R`Racine $z=1$ sur le cercle unité.`],
      ['ts-ar', R`$\Phi_2(z)=1-1{,}5z+0{,}5z^2=(1-z)(1-0{,}5z)$. L’AR(2) associé est :`, ['non stationnaire (racine z = 1)', 'stationnaire', 'un MA(2)', 'non inversible'], 0, R`Racines 1 et 2 : la racine 1 n’est pas hors du cercle unité. C’est un ARIMA(1,1,0).`],
      ['ts-ma', R`ACF : pics significatifs aux délais 1 et 2, puis rien. PACF : décroissance progressive. Modèle ?`, ['MA(2)', 'AR(2)', 'ARMA(1,1)', 'bruit blanc'], 0, R`ACF nulle après 2 : MA(2).`],
      ['ts-ma', R`PACF : un seul pic significatif au délai 1. ACF : décroissance géométrique. Modèle ?`, ['AR(1)', 'MA(1)', 'ARMA(1,1)', 'ARIMA(0,1,0)'], 0, R`PACF nulle après 1 : AR(1).`],
      ['ts-arma', R`Pourquoi exige-t-on que $\Phi_p$ et $\Theta_q$ n’aient pas de facteur commun ?`, ['sinon le modèle se simplifie : les paramètres ne sont pas identifiables', 'pour que le modèle soit stationnaire', 'pour que W soit gaussien', 'pour pouvoir différencier'], 0, R`Ex. $\phi=\theta$ dans un ARMA(1,1) donne $X_t=W_t$.`],
      ['ts-arima', R`Grands bâtonnets aux délais 12, 24, 36 qui décroissent très lentement. On applique :`, [R`$\nabla_{12}$`, R`$\nabla^{12}$`, 'une moyenne mobile d’ordre 3', 'Box-Cox seulement'], 0, R`Non-stationnarité au niveau saisonnier : différenciation saisonnière.`],
      ['ts-estim', R`Pourquoi la stationnarité est-elle indispensable pour estimer $\gamma_k$ à partir d’une seule série ?`, ['elle permet de moyenner sur t des quantités qui ne dépendent pas de t', 'elle rend les données indépendantes', 'elle rend la série gaussienne', 'elle supprime le bruit'], 0, R`Une seule réalisation : on remplace la moyenne sur des copies par une moyenne dans le temps.`],
      ['ts-bj', R`Le test de Ljung-Box sur les résidus d’un ARMA(1,1) avec K = 20 se compare à :`, [R`$\chi^2_{18}$`, R`$\chi^2_{20}$`, R`$\chi^2_{2}$`, R`$\mathcal N(0,1)$`], 0, R`$K-p-q=20-1-1=18$ degrés de liberté.`],
      ['ts-bj', R`Principe de parcimonie dans Box-Jenkins :`, ['commencer par les modèles les plus simples compatibles avec les données', 'prendre le modèle avec le plus de paramètres', 'augmenter p et q simultanément', 'toujours prendre un ARMA(2,2)'], 0, R`Pour éviter le sur-ajustement ; un ordre à la fois.`],
      ['ts-forecast', R`À long terme, la prévision d’un ARMA stationnaire tend vers :`, ['la moyenne de la série', 'la dernière observation', '0 toujours', 'une droite'], 0, R`Ex. AR(1) : $\mu+\phi^l(X_t-\mu)\to\mu$.`],
      ['ts-forecast', R`La largeur de l’intervalle de prévision quand l’horizon augmente :`, ['augmente', 'diminue', 'reste constante', 'dépend seulement de N'], 0, R`$V(l)=\sigma^2(1+\psi_1^2+\dots+\psi_{l-1}^2)$ croît avec $l$.`],

      // ----- Ajouts (22/10/2026), à la fin pour préserver les rangs -----
      ['ts-intro', R`Le lag-plot au délai 1 d’une marche aléatoire est presque une droite. On en conclut :`, ['rien sur les accroissements : la tendance suffit à aligner les points', 'que les accroissements sont fortement corrélés', 'que la série est stationnaire', 'que c’est un bruit blanc'], 0, R`Les pas d’une marche aléatoire sont indépendants ; l’alignement vient de ce que $X_t=X_{t-1}+Z_t$ reste proche de $X_{t-1}$. On lit le lag-plot de la série différenciée.`],
      ['ts-intro', R`Un modèle ajusté sur l’indice BRI jusqu’à 2004 prévoit environ 69 pour 2005-T1 ; on observe 97. L’explication la plus probable :`, ['un changement de structure (rupture de série), qui viole l’hypothèse de base de la prévision', 'un intervalle de prévision mal calculé', 'un nombre de retards trop faible', 'une erreur d’arrondi'], 0, R`La prévision suppose que la structure du passé reste valable ; un saut de $0{,}326$ en log, 7,6 écarts types, signale une rupture.`],
      ['ts-decomp', R`Une série trimestrielle a un écart été-hiver de 20 quand le niveau vaut 100 et de 20 quand il vaut 300. Modèle le plus naturel ?`, ['additif, sans transformation', 'multiplicatif, logarithme', 'multiplicatif, Box-Cox λ = 0', 'aucun : la série est un bruit blanc'], 0, R`Amplitude constante quel que soit le niveau : saison additive. Le log rendrait au contraire l’amplitude décroissante.`],
      ['ts-decomp', R`Série $x_t=T_tS_t+R_t$ avec un bruit $R_t$ grand devant la saison. Après le log :`, ['la saison devient additive mais la variance n’est pas forcément stabilisée', 'tout devient additif et homoscédastique', 'la tendance disparaît', 'la série devient stationnaire'], 0, R`Modèle B du cours : le log ne stabilise la variance que si $R_t$ est petit devant $S_t$.`],
      ['ts-filters', R`Lissage exponentiel avec $\alpha=0{,}2$, lissage précédent $y_{t-1}=100$, nouvelle observation $x_t=110$. $y_t$ vaut :`, ['102', '108', '110', '105'], 0, R`$0{,}2\times110+0{,}8\times100=22+80=102$.`],
      ['ts-filters', R`Après $\nabla$ d’une série $a+bt+R_t$ ($R_t$ bruit blanc), on observe $r_1\approx-0{,}5$. C’est :`, ['la dépendance fictive créée par la différence', 'la preuve d’un MA(1) dans les données', 'une saison de période 2', 'une erreur de calcul'], 0, R`$y_t=b+R_t-R_{t-1}$ : $\mathrm{Cov}(y_t,y_{t-1})=-\sigma^2$, $\mathrm{Var}=2\sigma^2$, d’où $-0{,}5$.`],
      ['ts-acf', R`$x=1,3,2,4,3,5$. Que vaut $r_1$ ?`, ['−0,1', '0,4', '0,1', '−0,4'], 0, R`Écarts $-2,0,-1,1,0,2$ ; somme des carrés 10 ; produits consécutifs $0+0-1+0+0=-1$ ; $r_1=-0{,}1$. ($0{,}4$ est $r_2$.)`],
      ['ts-acf', R`Sur 40 coefficients d’un bruit blanc, 2 sortent de la bande $\pm2/\sqrt N$. Conclusion :`, ['compatible avec un bruit blanc (2 attendus en moyenne)', 'la série est un AR(2)', 'la série n’est pas stationnaire', 'il faut différencier'], 0, R`5 % de 40 = 2 dépassements attendus par hasard.`],
      ['ts-stat', R`Des rendements journaliers ont une ACF nulle mais des rendements au carré corrélés. Ce sont :`, ['un bruit blanc faible, pas fort', 'un bruit blanc fort', 'une marche aléatoire', 'un processus non stationnaire'], 0, R`Non corrélés (faible) mais pas indépendants, puisque leurs carrés sont corrélés.`],
      ['ts-stat', R`Marche aléatoire centrée, $\sigma_Z=1$. Corrélation entre $X_{100}$ et $X_{101}$ ?`, ['0,995', '0', '0,5', '1'], 0, R`$\sqrt{t/(t+h)}=\sqrt{100/101}=0{,}995$. Très corrélés, contrairement à ce qu’écrit le slide 02·24 (à confirmer).`],
      ['ts-acvf', R`$\rho_1=0{,}6$ et $\rho_2=0{,}36$. Que vaut $\phi_{22}$ et que suggère-t-il ?`, ['0, compatible avec un AR(1)', '0,36, un AR(2)', '0,6, un MA(1)', '−0,19, un MA(1)'], 0, R`$\phi_{22}=(0{,}36-0{,}36)/(1-0{,}36)=0$ : le lien à 2 pas passe tout entier par la valeur intermédiaire.`],
      ['ts-linear', R`Processus linéaire avec $\psi_j=0{,}5^j$ et $\sigma_w=1$. Sa variance vaut :`, ['4/3', '2', '1', '0,75'], 0, R`$\sum0{,}25^j=1/(1-0{,}25)=4/3$.`],
      ['ts-linear', R`Pourquoi impose-t-on l’inversibilité d’un MA ajusté ?`, ['pour pouvoir reconstruire les chocs (résidus) à partir des observations passées', 'pour qu’il soit stationnaire', 'pour que son ACF soit nulle après q', 'pour qu’il soit gaussien'], 0, R`Inversible : $W_t=X_t-\sum\Pi_jX_{t-j}$ converge ; c’est ce qui donne les résidus et les prévisions. La stationnarité d’un MA est automatique.`],
      ['ts-ar', R`AR(2) $X_t=0{,}5X_{t-1}+0{,}3X_{t-2}+W_t$. Que vaut $\rho_1$ ?`, ['0,714', '0,5', '0,8', '0,3'], 0, R`$\rho_1=\phi_1/(1-\phi_2)=0{,}5/0{,}7=0{,}714$.`],
      ['ts-ar', R`Pour un AR(p) stationnaire, les racines $\omega_i$ de l’équation caractéristique $\omega^p=\phi_1\omega^{p-1}+\dots+\phi_p$ sont :`, ['de module < 1 (inverses des racines de Φp)', 'de module > 1', 'toujours réelles', 'égales aux φi'], 0, R`$\rho_k=\sum C_i\omega_i^k\to0$ exige $|\omega_i|<1$ ; les racines de $\Phi_p(z)$, elles, sont hors du cercle.`],
      ['ts-ma', R`Un $r_1=0{,}8$ suivi de coefficients nuls peut-il venir d’un MA(1) ?`, ['non : pour un MA(1), |ρ1| ≤ 0,5', 'oui, avec θ = −0,8', 'oui, avec θ = 0,8', 'oui, si la série est longue'], 0, R`$|\theta/(1+\theta^2)|\le0{,}5$ pour tout $\theta$ (maximum en $|\theta|=1$).`],
      ['ts-ma', R`MA(2) $X_t=W_t-0{,}5W_{t-1}+0{,}3W_{t-2}$. Que vaut $\rho_2$ ?`, ['0,224', '−0,485', '0,3', '0'], 0, R`$\rho_2=-\theta_2/(1+\theta_1^2+\theta_2^2)$ avec $\theta_2=-0{,}3$ : $0{,}3/1{,}34=0{,}224$.`],
      ['ts-arma', R`ARMA(1,1) avec $\phi=0{,}8$ et $\theta=0{,}3$. Que vaut $\psi_2$ ?`, ['0,4', '0,5', '0,64', '0,15'], 0, R`$\psi_j=(\phi-\theta)\phi^{j-1}$ : $\psi_2=0{,}5\times0{,}8=0{,}4$.`],
      ['ts-arma', R`ACF et PACF décroissent toutes deux progressivement, sans coupure nette. Démarche Box-Jenkins :`, ['essayer de petits ARMA et comparer AIC/BIC et résidus', 'prendre un AR d’ordre égal au dernier délai significatif de l’ACF', 'conclure à un bruit blanc', 'différencier jusqu’à ce que l’une se coupe'], 0, R`Pour un ARMA, aucune des deux fonctions ne s’annule : on teste ARMA(1,1), puis on ajoute un ordre à la fois.`],
      ['ts-arima', R`Après une différenciation, $r_1=-0{,}48$ et la variance a augmenté. On soupçonne :`, ['une sur-différenciation', 'une saison de période 2', 'un AR(1) très persistant', 'une rupture'], 0, R`$\nabla$ d’une série déjà stationnaire crée un MA(1) proche de $\theta=1$, de $\rho_1\approx-0{,}5$.`],
      ['ts-arima', R`Box-Cox de $x=100$ avec $\lambda=0{,}5$ :`, ['18', '10', '4,605', '99'], 0, R`$(100^{0{,}5}-1)/0{,}5=9/0{,}5=18$. $4{,}605$ correspond à $\lambda=0$, $99$ à $\lambda=1$.`],
      ['ts-arima', R`$\nabla\nabla_{12}x_t$ avec $x_t=130$, $x_{t-1}=120$, $x_{t-12}=118$, $x_{t-13}=110$ :`, ['2', '22', '10', '12'], 0, R`$(130-118)-(120-110)=12-10=2$.`],
      ['ts-estim', R`MA(1) avec $\rho_1=0{,}4$, $N=100$. Demi-largeur de la bande à 95 % pour $r_k$, $k\ge2$ :`, ['0,230', '0,200', '0,115', '0,280'], 0, R`Bartlett : $\mathrm{Var}=(1+2\times0{,}16)/100=0{,}0132$, écart type $0{,}115$, bande $\pm0{,}230$.`],
      ['ts-estim', R`$C_k=0{,}50$ sur toute la série, $0{,}46$ et $0{,}50$ sur chaque moitié. Estimation jackknife :`, ['0,52', '0,48', '0,50', '0,46'], 0, R`$2\times0{,}50-\frac12(0{,}46+0{,}50)=1-0{,}48=0{,}52$.`],
      ['ts-fit', R`On estime un MA(1) et on trouve $R_1=-0{,}4$. Valeur de $\hat\theta$ à retenir par la méthode des moments ?`, ['0,5', '2', '−0,5', '0,4'], 0, R`$\hat\theta=\frac{-1\pm\sqrt{1-0{,}64}}{-0{,}8}$ donne $0{,}5$ ou $2$ ; seule $0{,}5$ est inversible.`],
      ['ts-fit', R`Yule-Walker pour un AR(2) avec $R_1=0{,}6$ et $R_2=0{,}5$. $\hat\phi_2$ vaut :`, ['0,219', '0,469', '0,5', '0,14'], 0, R`$(R_2-R_1^2)/(1-R_1^2)=0{,}14/0{,}64=0{,}219$ ; $0{,}469$ est $\hat\phi_1$.`],
      ['ts-fit', R`MA(1) avec $\mu=0$, $\theta=0{,}5$, $W_0=0$ et $X=1;\ -0{,}5;\ 0{,}8$. La RSS conditionnelle vaut :`, ['1,64', '1,89', '0,64', '2,14'], 0, R`$W_t=X_t+\theta W_{t-1}$ : $1$ ; $0$ ; $0{,}8$, d’où $1+0+0{,}64$.`],
      ['ts-bj', R`On passe d’un AR(2) à un AR(3) : $\hat\phi_3$ non significatif, $\hat\phi_1$ passe de 0,6 à 0,2. Diagnostic :`, ['sur-ajustement : garder l’AR(2)', 'l’AR(3) est meilleur', 'il faut un AR(4)', 'la série n’est pas stationnaire'], 0, R`Nouveau coefficient inutile et anciens instables : les deux critères du sur-ajustement.`],
      ['ts-bj', R`Ljung-Box avec $n=100$, $K=3$, $R_1=0{,}15$, $R_2=-0{,}10$, $R_3=0{,}05$ sur un AR(1). Conclusion à 5 % (quantile $\chi^2_2$ : 5,99) ?`, ['Q* ≈ 3,62 : on ne rejette pas la blancheur', 'Q* ≈ 3,62 : on rejette', 'Q* ≈ 36,2 : on rejette', 'test impossible avec K = 3'], 0, R`$Q^*=100\times102\times(0{,}0225/99+0{,}01/98+0{,}0025/97)=3{,}62<5{,}99$, avec $K-p=2$ ddl.`],
      ['ts-forecast', R`MA(1) $X_t=10+W_t-0{,}6W_{t-1}$, dernier résidu $\hat W_t=2$. Prévisions à 1 et 3 pas ?`, ['8,8 et 10', '10 et 10', '8,8 et 8,8', '11,2 et 10'], 0, R`$\hat X_t(1)=\mu-\theta W_t=10-1{,}2=8{,}8$ ; au-delà de $q=1$ pas, la prévision vaut $\mu=10$.`],
      ['ts-forecast', R`On a modélisé $\ln x_t$ ; prévision $4{,}6$, variance d’erreur $0{,}01$. Prévision optimale de $x$ ?`, [R`$e^{4{,}605}\approx99{,}98$`, R`$e^{4{,}6}\approx99{,}48$`, R`$e^{4{,}61}$`, R`$4{,}6$`], 0, R`$\exp[\hat X+\frac12\mathrm{var}]=\exp(4{,}605)$ ; $e^{4{,}6}$ est la médiane.`],
    ],

    gens: {
      'ts-decomp': [
        () => {
          const T = pick([100, 150, 200, 400]), sh = pick([1.1, 1.2, 1.25, 1.3]), sl = pick([0.7, 0.75, 0.8, 0.9]), a = Math.log(sh / sl);
          return { q: R`Série multiplicative $x_t=T_tS_t$ : tendance $T=${T}$, facteur saisonnier $${f(sh, 2)}$ en haute saison et $${f(sl, 2)}$ en basse saison. Écart $\ln x_{\text{haut}}-\ln x_{\text{bas}}$ ? (3 décimales)`, a, tol: 0.002,
            expl: R`$\ln(TS_h)-\ln(TS_b)=\ln S_h-\ln S_b=\ln(${f(sh, 2)}/${f(sl, 2)})=${f(a)}$ : $T$ disparaît, l’écart est le même à tout niveau. En niveau, l’écart vaut $${f(T * (sh - sl), 1)}$ et doublerait avec $T$.` };
        },
        () => {
          const t = rnd(10, 140), e = pick([-0.15, -0.08, 0.05, 0.12, 0.2]);
          const lx = Math.round((4.814 + 0.01 * t + e) * 1000) / 1000, a = lx - (4.814 + 0.01 * t);
          return { q: R`Série M, tendance en log $y=4{,}814+0{,}010\,t$. À $t=${t}$, on observe $\ln x_t=${f(lx)}$. Résidu $\ln x_t-y_t$ ? (3 décimales)`, a, tol: 0.0015,
            expl: R`$y_{${t}}=4{,}814+0{,}010\times${t}=${f(4.814 + 0.01 * t)}$ ; résidu $${f(lx)}-${f(4.814 + 0.01 * t)}=${f(a)}$, soit un facteur $e^{${f(a)}}=${f(Math.exp(a))}$ par rapport à la tendance.` };
        },
      ],
      'ts-filters': [
        () => {
          const a = rnd(80, 120), b = rnd(80, 120), c = rnd(80, 120), m = (a + b + c) / 3;
          return { q: R`Moyenne mobile symétrique d’ordre 3 : $x_{t-1}=${a}$, $x_t=${b}$, $x_{t+1}=${c}$. Valeur lissée $y_t$ ? (2 décimales)`, a: m, tol: 0.006,
            expl: R`$y_t=\frac13(${a}+${b}+${c})=\frac{${a + b + c}}3=${f(m, 2)}$.` };
        },
        () => {
          const al = pick([0.1, 0.2, 0.3, 0.5]), yp = rnd(90, 110), x = rnd(80, 130), y = al * x + (1 - al) * yp;
          return { q: R`Lissage exponentiel, $\alpha=${f(al, 1)}$ : lissage précédent $y_{t-1}=${yp}$, nouvelle observation $x_t=${x}$. $y_t$ ? (2 décimales)`, a: y, tol: 0.006,
            expl: R`$y_t=\alpha x_t+(1-\alpha)y_{t-1}=${f(al, 1)}\times${x}+${f(1 - al, 1)}\times${yp}=${f(y, 2)}$.` };
        },
        () => {
          const x0 = rnd(100, 140), x1 = rnd(100, 140), x2 = rnd(100, 140);
          return { q: R`$x_t=${x0}$, $x_{t-1}=${x1}$, $x_{t-2}=${x2}$. Différence seconde $\nabla^2x_t$ ?`, a: x0 - 2 * x1 + x2, tol: 0,
            expl: R`$\nabla^2x_t=x_t-2x_{t-1}+x_{t-2}=${x0}-${2 * x1}+${x2}=${x0 - 2 * x1 + x2}$ (c’est aussi $\nabla x_t-\nabla x_{t-1}=${x0 - x1}-(${x1 - x2})$).` };
        },
        () => {
          const a = rnd(110, 150), b = rnd(100, 140), c = rnd(100, 140), d = rnd(95, 135);
          return { q: R`Données mensuelles : $x_t=${a}$, $x_{t-1}=${b}$, $x_{t-12}=${c}$, $x_{t-13}=${d}$. Que vaut $\nabla\nabla_{12}x_t$ ?`, a: (a - c) - (b - d), tol: 0,
            expl: R`$\nabla_{12}x_t=${a}-${c}=${a - c}$, $\nabla_{12}x_{t-1}=${b}-${d}=${b - d}$, donc $\nabla\nabla_{12}x_t=${a - c}-(${b - d})=${(a - c) - (b - d)}$.` };
        },
      ],
      'ts-acf': [
        () => { const N = pick([25, 49, 100, 144, 169, 400, 900]); return { q: R`Corrélogramme d’une série de $N=${N}$ points : demi-largeur de la bande à 95 % pour un bruit blanc ? (3 décimales)`, a: 2 / Math.sqrt(N), tol: 0.002, expl: R`$2/\sqrt{${N}}=${f(2 / Math.sqrt(N))}$.` }; },
        () => {
          let x; do { x = Array.from({ length: 5 }, () => rnd(1, 9)); } while (new Set(x).size < 2);
          const m = x.reduce((s, v) => s + v, 0) / 5, d = x.map(v => v - m);
          const c0 = d.reduce((s, v) => s + v * v, 0), c1 = d.slice(0, 4).reduce((s, v, i) => s + v * d[i + 1], 0), r = c1 / c0;
          return { q: R`Série $x=${x.join(';\\ ')}$. Calculer $r_1$. (3 décimales)`, a: r, tol: 0.002,
            expl: R`$\bar x=${f(m, 2)}$ ; écarts $${d.map(v => f(v, 2)).join(';\\ ')}$ ; $\sum(x_t-\bar x)^2=${f(c0, 2)}$ ; $\sum_{t=1}^{4}(x_t-\bar x)(x_{t+1}-\bar x)=${f(c1, 2)}$ ; $r_1=${f(r)}$. Bande $2/\sqrt5=0{,}894$ : rien de significatif avec 5 points.` };
        },
        () => { const K = pick([20, 30, 40, 60]); return { q: R`On trace les $${K}$ premiers coefficients du corrélogramme d’un bruit blanc. Nombre moyen de coefficients hors de la bande $\pm2/\sqrt N$ ?`, a: 0.05 * K, tol: 0.01, expl: R`Chaque coefficient sort avec probabilité 5 % environ : $0{,}05\times${K}=${f(0.05 * K, 1)}$.` }; },
      ],
      'ts-stat': [
        () => {
          const mu = pick([0, 0.1, 0.2, -0.1]), s = pick([1, 2, 3]), t = pick([16, 25, 36, 100]);
          return { q: R`Marche aléatoire $X_t=X_{t-1}+Z_t$, $X_0=0$, pas de moyenne $\mu=${f(mu, 1)}$ et d’écart type $\sigma_Z=${s}$. Écart type de $X_{${t}}$ ?`, a: s * Math.sqrt(t), tol: 0.001,
            expl: R`$\mathrm{Var}(X_t)=t\sigma_Z^2=${t}\times${s * s}=${t * s * s}$, écart type $${s}\sqrt{${t}}=${s * Math.sqrt(t)}$ (la moyenne $t\mu=${f(t * mu, 1)}$ ne change pas la dispersion).` };
        },
        () => {
          const t = pick([10, 50, 100, 400]), h = pick([1, 5, 10, 50]), r = Math.sqrt(t / (t + h));
          return { q: R`Marche aléatoire centrée : corrélation entre $X_{${t}}$ et $X_{${t + h}}$ ? (3 décimales)`, a: r, tol: 0.001,
            expl: R`$\mathrm{Cov}=t\sigma^2$, $\mathrm{Var}(X_t)=t\sigma^2$, $\mathrm{Var}(X_{t+h})=(t+h)\sigma^2$ ; corrélation $\sqrt{t/(t+h)}=\sqrt{${t}/${t + h}}=${f(r)}$.` };
        },
      ],
      'ts-acvf': [
        () => {
          const [r1, r2] = pick([[0.6, 0.36], [0.5, 0.4], [0.8, 0.5], [-0.4, 0], [0.7, 0.3], [0.5, 0.1], [-0.5, 0.3]]), p = (r2 - r1 * r1) / (1 - r1 * r1);
          return { q: R`Processus stationnaire avec $\rho_1=${f(r1, 2)}$ et $\rho_2=${f(r2, 2)}$. Autocorrélation partielle $\phi_{22}$ ? (3 décimales)`, a: p, tol: 0.002,
            expl: R`$\phi_{22}=\frac{\rho_2-\rho_1^2}{1-\rho_1^2}=\frac{${f(r2, 2)}-${f(r1 * r1, 4)}}{${f(1 - r1 * r1, 4)}}=${f(p)}$.` };
        },
        () => {
          const c = pick([2, 5, -3, 10]), a = pick([0.3, 0.5, -0.5, 0.8, -0.8, 1]), r = a / (1 + a * a);
          return { q: R`$X_t=${c}+W_t${a < 0 ? '' : '+'}${f(a, 1)}W_{t-1}$, $W$ bruit blanc. Que vaut $\rho_1$ ? (3 décimales)`, a: r, tol: 0.001,
            expl: R`La constante ne change pas les covariances. $\gamma_0=(1+${f(a * a, 2)})\sigma^2$, $\gamma_1=${f(a, 1)}\sigma^2$, $\rho_1=${f(a, 1)}/${f(1 + a * a, 2)}=${f(r)}$.` };
        },
      ],
      'ts-linear': [
        () => { const th = pick([0.2, 0.4, 0.5, 0.6, 0.8, -0.4, -0.7]); const r = -th / (1 + th * th); return { q: R`MA(1) $X_t=W_t-\theta W_{t-1}$ avec $\theta=${f(th, 1)}$ : que vaut $\rho_1$ ? (3 décimales)`, a: r, tol: 0.001, expl: R`$\rho_1=-\frac\theta{1+\theta^2}=-\frac{${f(th, 1)}}{${f(1 + th * th, 2)}}=${f(r)}$. Remarque : $|\rho_1|\le0{,}5$ pour tout MA(1).` }; },
        () => { const ph = pick([0.3, 0.5, 0.7, 0.9, -0.6]), k = rnd(2, 5); return { q: R`AR(1) avec $\phi=${f(ph, 1)}$ : que vaut $\rho_{${k}}$ ? (4 décimales)`, a: ph ** k, tol: 0.0002, expl: R`$\rho_k=\phi^k=(${f(ph, 1)})^{${k}}=${f(ph ** k, 4)}$.` }; },
        () => {
          const a = pick([0.3, 0.5, 0.6, 0.8, -0.5]), s = pick([1, 2]), g = s * s * a / (1 - a * a);
          return { q: R`Processus linéaire $X_t=\sum_{j\ge0}\psi_jW_{t-j}$ avec $\psi_j=(${f(a, 1)})^j$ et $\sigma_w=${s}$. Autocovariance $\gamma_1$ ? (3 décimales)`, a: g, tol: 0.002,
            expl: R`$\gamma_1=\sigma_w^2\sum_j\psi_j\psi_{j+1}=\sigma_w^2\,a\sum_ja^{2j}=\frac{${s * s}\times${f(a, 1)}}{1-${f(a * a, 2)}}=${f(g)}$.` };
        },
        () => {
          const th = pick([0.3, 0.8, 1.25, 2, -0.5, -1.5, 3, -0.9]), ok = Math.abs(th) < 1;
          return { q: R`MA(1) $X_t=W_t-\theta W_{t-1}$ avec $\theta=${f(th, 2)}$. Est-il inversible ?`, opts: ['oui', 'non'], a: ok ? 0 : 1, keepOrder: true,
            expl: R`Inversible ssi $|\theta|<1$ (les poids $-\theta^j$ de la forme AR(∞) doivent s’éteindre). Ici $|\theta|=${f(Math.abs(th), 2)}$ : ${ok ? 'inversible' : 'non inversible'}. Le MA(1) de paramètre $1/\theta=${f(1 / th, 3)}$ a la même ACF.` };
        },
      ],
      'ts-ar': [
        () => {
          const [a, b] = pick([[0.5, 0.3], [0.25, 0.125], [1.2, -0.5], [0.6, 0.4], [1.5, -0.5], [0.4, 0.5], [0.8, -0.15]]);
          // Racines de 1 − a z − b z² = 0
          const disc = a * a + 4 * b;
          let mods;
          if (disc >= 0) { const r1 = (-a + Math.sqrt(disc)) / (2 * b), r2 = (-a - Math.sqrt(disc)) / (2 * b); mods = [Math.abs(r1), Math.abs(r2)]; }
          else { const m = Math.sqrt(-1 / b); mods = [m, m]; }
          const ok = mods.every(m => m > 1 + 1e-9);
          return { q: R`AR(2) $X_t=${f(a, 3)}X_{t-1}${b < 0 ? '' : '+'}${f(b, 3)}X_{t-2}+W_t$. Stationnaire ?`, opts: ['oui', 'non'], a: ok ? 0 : 1, keepOrder: true,
            expl: R`$\Phi_2(z)=1-${f(a, 3)}z${b < 0 ? '+' : '-'}${f(Math.abs(b), 3)}z^2$ ; modules des racines : $${mods.map(m => f(m, 3)).join(' ; ')}$. ${ok ? 'Tous > 1 : stationnaire.' : 'Une racine de module ≤ 1 : non stationnaire.'}` };
        },
        () => {
          const ph = pick([0.5, 0.8, 0.9]), s = pick([1, 2]);
          const v = s * s / (1 - ph * ph);
          return { q: R`AR(1), $\phi=${f(ph, 1)}$, $\sigma_w=${s}$. Variance $\sigma_x^2$ ? (3 décimales)`, a: v, tol: 0.002, expl: R`$\sigma_x^2=\frac{\sigma_w^2}{1-\phi\rho_1}=\frac{\sigma_w^2}{1-\phi^2}=\frac{${s * s}}{${f(1 - ph * ph, 2)}}=${f(v)}$.` };
        },
        () => {
          const [a, b] = pick([[0.5, 0.3], [0.6, 0.2], [0.4, 0.4], [1.2, -0.5], [0.8, -0.15], [0.3, 0.5]]);
          const r1 = a / (1 - b), r2 = a * r1 + b;
          return { q: R`AR(2) stationnaire $X_t=${f(a, 2)}X_{t-1}${b < 0 ? '' : '+'}${f(b, 2)}X_{t-2}+W_t$. Que vaut $\rho_2$ ? (3 décimales)`, a: r2, tol: 0.002,
            expl: R`Yule-Walker : $\rho_1=\frac{\phi_1}{1-\phi_2}=\frac{${f(a, 2)}}{${f(1 - b, 2)}}=${f(r1)}$, puis $\rho_2=\phi_1\rho_1+\phi_2=${f(a, 2)}\times${f(r1)}${b < 0 ? '' : '+'}${f(b, 2)}=${f(r2)}$.` };
        },
        () => {
          const ph = pick([0.5, 0.7, 0.8, 0.9, 0.95, 0.98]), h = Math.log(0.5) / Math.log(ph);
          return { q: R`Un spread suit un AR(1) autour de sa moyenne avec $\phi=${f(ph, 2)}$ par mois. Demi-vie d’un écart, en mois ? (2 décimales)`, a: h, tol: 0.01,
            expl: R`L’écart attendu après $h$ mois vaut $\phi^h$ fois l’écart initial ; $\phi^h=0{,}5$ donne $h=\ln0{,}5/\ln${f(ph, 2)}=${f(h, 2)}$.` };
        },
      ],
      'ts-ma': [
        () => {
          const [t1, t2] = pick([[0.5, -0.3], [0.4, 0.2], [-0.6, 0.3], [0.8, -0.4], [0.3, 0.3]]);
          const den = 1 + t1 * t1 + t2 * t2, r1 = (-t1 + t1 * t2) / den, r2 = -t2 / den;
          return { q: R`MA(2) $X_t=W_t-\theta_1W_{t-1}-\theta_2W_{t-2}$ avec $\theta_1=${f(t1, 1)}$, $\theta_2=${f(t2, 1)}$. Que vaut $\rho_1$ ? (3 décimales)`, a: r1, tol: 0.002,
            expl: R`$\rho_1=\frac{-\theta_1+\theta_1\theta_2}{1+\theta_1^2+\theta_2^2}=\frac{${f(-t1 + t1 * t2, 2)}}{${f(den, 2)}}=${f(r1)}$ ; et $\rho_2=-\theta_2/${f(den, 2)}=${f(r2)}$, $\rho_k=0$ pour $k>2$.` };
        },
        () => {
          const th = pick([0.3, 0.5, 0.6, 0.8, -0.5, -0.7]), p = -(th ** 2) * (1 - th * th) / (1 - th ** 6);
          return { q: R`MA(1) $X_t=W_t-\theta W_{t-1}$ avec $\theta=${f(th, 1)}$. Autocorrélation partielle $\phi_{22}$ ? (3 décimales)`, a: p, tol: 0.002,
            expl: R`$\phi_{kk}=-\frac{\theta^k(1-\theta^2)}{1-\theta^{2(k+1)}}$, avec $k=2$ : $-\frac{${f(th * th, 2)}\times${f(1 - th * th, 2)}}{${f(1 - th ** 6, 4)}}=${f(p)}$.` };
        },
        () => {
          const ths = Array.from({ length: rnd(1, 3) }, () => pick([0.2, 0.4, 0.5, -0.3, 0.6, -0.5])), s = pick([1, 2]);
          const v = s * s * (1 + ths.reduce((a, t) => a + t * t, 0));
          return { q: R`MA(${ths.length}) de coefficients $\theta=(${ths.map(t => f(t, 1)).join(';\\ ')})$ et $\sigma_w=${s}$. Variance de $X_t$ ? (3 décimales)`, a: v, tol: 0.002,
            expl: R`$\sigma_w^2(1+\sum\theta_i^2)=${s * s}\times(1+${ths.map(t => f(t * t, 2)).join('+')})=${f(v)}$ (le signe des $\theta$ n’intervient pas).` };
        },
      ],
      'ts-arma': [
        () => {
          const ph = pick([0.5, 0.6, 0.8, 0.9]), th = pick([0.2, 0.3, -0.3, 0.4]), j = rnd(1, 4), p = (ph - th) * ph ** (j - 1);
          return { q: R`ARMA(1,1) $X_t-${f(ph, 1)}X_{t-1}=W_t${th < 0 ? '+' : '-'}${f(Math.abs(th), 1)}W_{t-1}$. Poids $\psi_{${j}}$ de la forme MA(∞) ? (4 décimales)`, a: p, tol: 0.0003,
            expl: R`$\psi_j=(\phi-\theta)\phi^{j-1}=(${f(ph, 1)}-(${f(th, 1)}))\times${f(ph, 1)}^{${j - 1}}=${f(p, 4)}$.` };
        },
        () => {
          const ph = pick([0.5, 0.7, 0.9]), th = pick([0.2, 0.3, 0.4, -0.4]), j = rnd(1, 3), p = (ph - th) * th ** (j - 1);
          return { q: R`ARMA(1,1) avec $\phi=${f(ph, 1)}$, $\theta=${f(th, 1)}$, écrit $X_t=W_t+\sum_{j\ge1}\pi_jX_{t-j}$. Que vaut $\pi_{${j}}$ ? (4 décimales)`, a: p, tol: 0.0003,
            expl: R`$\Pi(B)=\frac{1-\phi B}{1-\theta B}$ donne $\pi_j=(\phi-\theta)\theta^{j-1}=${f(ph - th, 1)}\times(${f(th, 1)})^{${j - 1}}=${f(p, 4)}$.` };
        },
      ],
      'ts-arima': [
        () => {
          const x = pick([4, 9, 25, 50, 100, 200]), l = pick([0, 0.5, 1, -1, 2]), g = l === 0 ? Math.log(x) : (x ** l - 1) / l;
          return { q: R`Box-Cox de $x=${x}$ avec $\lambda=${f(l, 1)}$ ? (3 décimales)`, a: g, tol: 0.002,
            expl: l === 0 ? R`$\lambda=0$ : $g(x)=\ln${x}=${f(g)}$.` : R`$g_\lambda(x)=\frac{x^\lambda-1}\lambda=\frac{${f(x ** l, 4)}-1}{${f(l, 1)}}=${f(g)}$.` };
        },
        () => {
          const th = pick([0.3, 0.4, 0.5, 0.7, -0.4]), S = pick([4, 12]), r = th / (1 + th * th);
          return { q: R`SMA(1) $X_t=W_t${th < 0 ? '' : '+'}${f(th, 1)}W_{t-${S}}$. Que vaut $\rho_{${S}}$ ? (3 décimales)`, a: r, tol: 0.001,
            expl: R`Comme un MA(1) en $B^{${S}}$ : $\rho_{${S}}=\frac{${f(th, 1)}}{1+${f(th * th, 2)}}=${f(r)}$, et $\rho_k=0$ pour tous les autres $k>0$.` };
        },
        () => {
          const ph = pick([0.3, 0.4, 0.5, -0.4]), P = pick([0.2, 0.3, 0.6, -0.5]), c = ph * P;
          return { q: R`$(1-${f(ph, 1)}B)(1-${f(P, 1)}B^{12})$ : coefficient de $B^{13}$ dans le produit ? (3 décimales)`, a: c, tol: 0.0005,
            expl: R`$(1-\phi B)(1-\Phi B^{12})=1-\phi B-\Phi B^{12}+\phi\Phi B^{13}$ : coefficient $(${f(ph, 1)})\times(${f(P, 1)})=${f(c)}$. Dans le modèle explicite, $X_t=\phi X_{t-1}+\Phi X_{t-12}-\phi\Phi X_{t-13}+W_t$.` };
        },
      ],
      'ts-estim': [
        () => {
          const r1 = pick([0.3, 0.4, 0.5, -0.4]), N = pick([50, 100, 200, 400]), w = 2 * Math.sqrt((1 + 2 * r1 * r1) / N);
          return { q: R`MA(1) avec $\rho_1=${f(r1, 1)}$, série de $N=${N}$ points. Demi-largeur de la bande à 95 % pour $r_k$, $k\ge2$ (Bartlett) ? (3 décimales)`, a: w, tol: 0.002,
            expl: R`$\mathrm{Var}(R_k)\approx\frac1N(1+2\rho_1^2)=\frac{${f(1 + 2 * r1 * r1, 2)}}{${N}}$ ; bande $2\sqrt{\cdot}=${f(w)}$, contre $2/\sqrt N=${f(2 / Math.sqrt(N))}$ pour un bruit blanc.` };
        },
        () => {
          const N = pick([20, 50, 100]), k = pick([2, 5, 10]), g = pick([0.4, 0.6, 1.2]), e = (1 - k / N) * g;
          return { q: R`$N=${N}$, $\gamma_{${k}}=${f(g, 1)}$, $\mathrm{Var}(\bar X)$ négligeable. Espérance de l’estimateur $C_{${k}}$ ? (3 décimales)`, a: e, tol: 0.002,
            expl: R`$\mathbb E(C_k)\approx(1-\frac kN)\gamma_k=${f(1 - k / N, 2)}\times${f(g, 1)}=${f(e)}$ : biais vers 0 de $${f(100 * k / N, 0)}$ %.` };
        },
        () => {
          const c = pick([0.4, 0.5, 0.6]), c1 = c + pick([-0.06, -0.04, 0.02]), c2 = c + pick([-0.02, 0, 0.04]), j = 2 * c - (c1 + c2) / 2;
          return { q: R`Jackknife : $C_k=${f(c, 2)}$ sur toute la série, $C_{k1}=${f(c1, 2)}$ et $C_{k2}=${f(c2, 2)}$ sur les moitiés. $\tilde C_k$ ? (3 décimales)`, a: j, tol: 0.0005,
            expl: R`$\tilde C_k=2C_k-\frac12(C_{k1}+C_{k2})=${f(2 * c, 2)}-${f((c1 + c2) / 2, 3)}=${f(j)}$.` };
        },
        () => {
          const N = pick([25, 50, 100, 400]), lo = -1 / N - 2 / Math.sqrt(N);
          return { q: R`Bruit blanc, $N=${N}$ : borne inférieure de l’intervalle à 95 % de $r_k$ (version avec le biais $-1/N$) ? (3 décimales)`, a: lo, tol: 0.002,
            expl: R`$-\frac1N-\frac2{\sqrt N}=-${f(1 / N, 4)}-${f(2 / Math.sqrt(N), 3)}=${f(lo)}$ ; la borne supérieure vaut $${f(-1 / N + 2 / Math.sqrt(N))}$.` };
        },
      ],
      'ts-fit': [
        () => {
          const r1 = pick([0.5, 0.6, 0.7, 0.8]), r2 = pick([0.2, 0.3, 0.4, 0.5]);
          const p1 = r1 * (1 - r2) / (1 - r1 * r1), p2 = (r2 - r1 * r1) / (1 - r1 * r1);
          return { q: R`AR(2) par Yule-Walker avec $R_1=${f(r1, 1)}$ et $R_2=${f(r2, 1)}$ : $\hat\phi_2$ ? (3 décimales)`, a: p2, tol: 0.002,
            expl: R`$\hat\phi_2=\frac{R_2-R_1^2}{1-R_1^2}=\frac{${f(r2, 1)}-${f(r1 * r1, 2)}}{${f(1 - r1 * r1, 2)}}=${f(p2)}$ (et $\hat\phi_1=${f(p1)}$).` };
        },
        () => {
          const R1 = pick([-0.45, -0.4, -0.3, -0.2, 0.2, 0.3, 0.4, 0.45]), th = (-1 + Math.sqrt(1 - 4 * R1 * R1)) / (2 * R1);
          return { q: R`MA(1) $X_t=W_t-\theta W_{t-1}$, $R_1=${f(R1, 2)}$. Estimation de $\theta$ par les moments (racine inversible) ? (3 décimales)`, a: th, tol: 0.002,
            expl: R`$R_1\theta^2+\theta+R_1=0$ : $\theta=\frac{-1\pm\sqrt{1-4R_1^2}}{2R_1}$, racines $${f(th)}$ et $${f(1 / th)}$ (inverses l’une de l’autre). On garde $|\theta|<1$ : $${f(th)}$.` };
        },
        () => {
          const th = pick([0.2, 0.4, 0.5, 0.6, -0.5]), X = [pick([1, 0.5, -1, 2]), pick([-0.5, 0.3, 1, -1]), pick([0.8, -0.2, 0.5, 1.5])];
          const W = []; let w = 0; for (const x of X) { w = x + th * w; W.push(w); }
          const rss = W.reduce((s, v) => s + v * v, 0);
          return { q: R`MA(1) conditionnel, $\mu=0$, $\theta=${f(th, 1)}$, $W_0=0$, observations $X_1=${f(X[0], 1)}$, $X_2=${f(X[1], 1)}$, $X_3=${f(X[2], 1)}$. Somme $\sum_{t=1}^3W_t^2$ ? (3 décimales)`, a: rss, tol: 0.002,
            expl: R`$W_t=X_t+\theta W_{t-1}$ : $W_1=${f(W[0], 3)}$, $W_2=${f(W[1], 3)}$, $W_3=${f(W[2], 3)}$ ; somme des carrés $${f(rss)}$.` };
        },
        () => {
          const N = pick([50, 100, 150, 400]), r1 = pick([0.12, 0.18, 0.25, -0.15, -0.3, 0.08]), b = 2 / Math.sqrt(N), sig = Math.abs(r1) > b;
          return { q: R`AR(1) ajusté sur $N=${N}$ points : $\hat\phi_1\approx r_1=${f(r1, 2)}$. $\phi_1$ est-il significativement non nul à 95 % ?`, opts: ['oui', 'non'], a: sig ? 0 : 1, keepOrder: true,
            expl: R`Seuil $2/\sqrt{${N}}=${f(b)}$ ; $|${f(r1, 2)}|${sig ? '>' : '\\le'}${f(b)}$ : ${sig ? 'significatif' : 'non significatif'}.` };
        },
      ],
      'ts-bj': [
        () => { const K = pick([10, 15, 20, 24]), p = rnd(0, 2), q = rnd(0, 2); return { q: R`Ljung-Box sur les résidus d’un ARMA(${p},${q}) avec $K=${K}$ délais : nombre de degrés de liberté du $\chi^2$ ?`, a: K - p - q, tol: 0, expl: R`$K-p-q=${K - p - q}$.` }; },
        () => {
          const n = pick([50, 100, 200]), Rk = [pick([0.1, 0.15, -0.12, 0.2]), pick([-0.1, 0.05, 0.08, -0.15]), pick([0.05, -0.05, 0.1, 0.12])];
          const Q = n * (n + 2) * Rk.reduce((s, r, i) => s + r * r / (n - i - 1), 0);
          return { q: R`Résidus d’un modèle ajusté sur $n=${n}$ valeurs : $R_1=${f(Rk[0], 2)}$, $R_2=${f(Rk[1], 2)}$, $R_3=${f(Rk[2], 2)}$. Statistique de Ljung-Box $Q^*$ avec $K=3$ ? (2 décimales)`, a: Q, tol: 0.011,
            expl: R`$Q^*=n(n+2)\sum_{k=1}^3\frac{R_k^2}{n-k}=${n}\times${n + 2}\times\big(\frac{${f(Rk[0] ** 2, 4)}}{${n - 1}}+\frac{${f(Rk[1] ** 2, 4)}}{${n - 2}}+\frac{${f(Rk[2] ** 2, 4)}}{${n - 3}}\big)=${f(Q, 2)}$.` };
        },
        () => {
          const N = pick([60, 100, 120]), d = pick([0, 1, 2]), n = N - d, Rk = [pick([0.1, -0.12, 0.2]), pick([0.05, -0.1, 0.15])];
          const Q = n * (Rk[0] ** 2 + Rk[1] ** 2);
          return { q: R`ARIMA avec $d=${d}$ ajusté sur une série de $N=${N}$ points ; résidus $R_1=${f(Rk[0], 2)}$, $R_2=${f(Rk[1], 2)}$. Statistique de Box-Pierce avec $K=2$ ? (2 décimales)`, a: Q, tol: 0.011,
            expl: R`$n=N-d=${n}$ ; $Q_{BP}=n\sum R_k^2=${n}\times(${f(Rk[0] ** 2, 4)}+${f(Rk[1] ** 2, 4)})=${f(Q, 2)}$.` };
        },
      ],
      'ts-forecast': [
        () => {
          const mu = pick([10, 50, 100]), ph = pick([0.5, 0.7, 0.9]), x = mu + pick([-8, -5, 4, 10]), l = rnd(1, 4);
          return { q: R`AR(1) : $\mu=${mu}$, $\phi=${f(ph, 1)}$, dernière observation $X_t=${x}$. Prévision $\hat X_t(${l})$ ? (3 décimales)`, a: mu + ph ** l * (x - mu), tol: 0.002,
            expl: R`$\mu+\phi^l(X_t-\mu)=${mu}+${f(ph, 1)}^{${l}}\times(${x - mu})=${f(mu + ph ** l * (x - mu))}$.` };
        },
        () => {
          const ph = pick([0.5, 0.8]), s = 1, l = rnd(1, 4);
          const v = s * (1 - ph ** (2 * l)) / (1 - ph * ph), w = 1.96 * Math.sqrt(v);
          return { q: R`AR(1), $\phi=${f(ph, 1)}$, $\sigma=1$. Demi-largeur de l’intervalle de prévision à 95 % à l’horizon $l=${l}$ ? (3 décimales)`, a: w, tol: 0.003,
            expl: R`$V(l)=\sigma^2\frac{1-\phi^{2l}}{1-\phi^2}=${f(v)}$, donc $1{,}96\sqrt{V(l)}=${f(w)}$.` };
        },
        () => {
          const mu = pick([0, 5, 10]), th = pick([0.3, 0.6, -0.4, 0.8]), w = pick([1.5, -2, 0.5, 2.5]), x = mu - th * w;
          return { q: R`MA(1) $X_t=${mu}+W_t-\theta W_{t-1}$ avec $\theta=${f(th, 1)}$ ; dernier résidu $\hat W_t=${f(w, 1)}$. Prévision $\hat X_t(1)$ ? (3 décimales)`, a: x, tol: 0.001,
            expl: R`$\hat X_t(1)=\mu-\theta W_t=${mu}-(${f(th, 1)})(${f(w, 1)})=${f(x)}$ ; pour $l\ge2$, la prévision vaut $\mu=${mu}$.` };
        },
        () => {
          const m = pick([4.6, 3.2, 5.0, 2.3]), v = pick([0.01, 0.04, 0.09]), e = Math.exp(m + v / 2);
          return { q: R`On a modélisé $\ln x_t$ : prévision $\hat X_t(l)=${f(m, 1)}$, variance d’erreur $${f(v, 2)}$. Prévision optimale de $x_{t+l}$ ? (2 décimales)`, a: e, tol: 0.011,
            expl: R`$\exp[\hat X_t(l)+\frac12\mathrm{var}]=\exp(${f(m + v / 2, 3)})=${f(e, 2)}$, au lieu de $e^{${f(m, 1)}}=${f(Math.exp(m), 2)}$ (la médiane).` };
        },
        () => {
          const mu = pick([0.02, 0.01, 1]), ph = pick([0.5, 0.6, 0.8]), xt = mu + pick([0.03, -0.02, 0.05]), xn = mu + pick([-0.01, 0.02, 0.04]);
          const f1 = mu + ph * (xt - mu), f2 = mu + ph * ph * (xt - mu), up = f2 + ph * (xn - f1);
          return { q: R`AR(1), $\mu=${f(mu, 2)}$, $\phi=${f(ph, 1)}$. En $t$ : $\hat X_t(1)=${f(f1, 4)}$, $\hat X_t(2)=${f(f2, 4)}$. On observe $X_{t+1}=${f(xn, 2)}$. Mise à jour $\hat X_{t+1}(1)$ ? (4 décimales)`, a: up, tol: 0.0002,
            expl: R`$\hat W_{t+1}=X_{t+1}-\hat X_t(1)=${f(xn - f1, 4)}$ ; $\hat X_{t+1}(1)=\hat X_t(2)+\psi_1\hat W_{t+1}=${f(f2, 4)}+${f(ph, 1)}\times(${f(xn - f1, 4)})=${f(up, 4)}$, identique à $\mu+\phi(X_{t+1}-\mu)$.` };
        },
      ],
    },
  });
})();
