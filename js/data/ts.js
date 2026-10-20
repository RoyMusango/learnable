// Chapitre : Méthodes de prévision / Streaming Data Analysis (X. Siebert, slides 01 à 05).
(function () {
  const R = String.raw;
  const { pick, rnd, f } = COURSE.u;

  COURSE.add({
    id: 'ts',
    title: 'Séries temporelles et prévision',
    short: 'Séries temporelles',
    source: '01 à 05 (Streaming Data Analysis) · 292 slides',
    seen: null,
    pitch: 'Décrire, modéliser et prévoir une série : tendance, saisonnalité, autocorrélation, stationnarité, AR, MA, ARMA, ARIMA, SARIMA, estimation, méthodologie de Box-Jenkins, intervalles de prévision.',
    sections: [
      {
        id: 'ts-intro', title: 'Séries chronologiques : données et objectifs', slides: '01 · 3-21',
        summary: 'Données indicées par le temps et autocorrélées. Modéliser le passé pour prévoir à court terme. Chronogramme et lag-plot.',
        fiche: R`
<p><b>Série chronologique</b> : $\{x_t\}$, $t=1..N$, des données indicées par le temps. L’ordre compte, et les données sont typiquement <b>autocorrélées</b> : $x_t$ dépend de $x_{t-1},x_{t-2},\dots$ (c’est l’opposé de l’hypothèse i.i.d.). Exemples : ventes, indices boursiers, températures, naissances, arrivées dans une file. Exemple fil rouge : <b>AirPassengers</b> (passagers mensuels 1949-1961).</p>
<p><b>Objectifs</b> : description compacte (modèle), interprétation, <b>prévision</b>, contrôle (simulations), tests d’hypothèse.</p>
<div class="def"><b>Principe général</b> : modéliser la partie connue (le passé), en supposant que le modèle qui explique le passé explique aussi l’avenir (pas de changement de structure). La prévision est valable <b>à court terme</b>.</div>
<p><b>Univariée</b> : choisir un modèle et ajuster ses paramètres, le valider, prédire $x_{t+h}$ à partir de $x_s,\ s\le t$. <b>Multivariée</b> : modéliser aussi les interdépendances (entrées, sorties, retards).</p>
<p>Deux approches : <b>fréquentielle</b> (Fourier, spectre, périodes régulières, historiquement les astronomes) et <b>temporelle</b> (fonctions d’autocorrélation, celle du cours).</p>
<p><b>Visualisation</b> : le <b>chronogramme</b> $(t,x_t)$ ; le <b>lag-plot</b> $(x_{t-k},x_t)$ pour $k=1,2,5,12$ révèle la dépendance au passé (nuage informe pour un bruit blanc).</p>
<p class="muted">Ce cours (50 % projet, 50 % théorie) demande de proposer une série et d’en faire une analyse complète.</p>`,
      },
      {
        id: 'ts-decomp', title: 'Décomposition : tendance, saison, cycle, résidu', slides: '01 · 23-35',
        summary: 'Additif x = T + S + C + R, ou multiplicatif x = T × S × C × R (le log le rend additif). Isoler les parties déterministes et vérifier que le résidu est stationnaire.',
        fiche: R`
<div class="def"><b>Modèle additif</b> : $x_t=\underbrace{T_t+S_t+C_t}_{\text{signal}}+\underbrace{R_t}_{\text{bruit}}$ (composantes indépendantes).<br>
$T_t$ tendance (moyenne locale) ; $S_t$ saisonnalité (court terme) ; $C_t$ cycles (moyen, long terme) ; $R_t$ résidu aléatoire.<br>
<b>Modèle multiplicatif</b> : $x_t=T_t\times S_t\times C_t\times R_t$ (composantes dépendantes), rendu additif par le <b>logarithme</b>.</div>
<p>Exemples : tendance (or), saisonnalité (température à Berlin), cycles (rougeole à New York). AirPassengers est multiplicative : l’amplitude saisonnière grandit avec le niveau.</p>
<p><b>Tactique</b> : supposer un modèle additif, identifier et éliminer les composantes déterministes, analyser le résidu, qui doit être <b>stationnaire</b> (ni moyenne ni variance qui évoluent). Sinon, transformer (par ex. $\log x_t$).</p>
<p><b>Log</b> : stabilise la variance et rend la saison multiplicative additive. Attention : pour $x_t=T_tS_tR_t$ le log rend tout additif, mais pour $x_t=T_tS_t+R_t$ la variance ne se stabilise que si $R_t$ est petit devant $S_t$.</p>
<p><b>Estimer la tendance par ajustement de courbe</b> (moindres carrés, sur une série désaisonnalisée) : polynôme, exponentielle, Gompertz $\log x_t=a-br^t$, logistique $x_t=\frac a{1-be^{-ct}}$. Exemple : série M, $y=4{,}814+0{,}010t$ ; les résidus $\ln x_t-(4{,}814+0{,}010t)$ servent à étudier la saison.</p>`,
      },
      {
        id: 'ts-filters', title: 'Filtres : différences et moyennes mobiles', slides: '01 · 36-49',
        summary: '∇ = 1 − B enlève une tendance linéaire, ∇² une quadratique, ∇s la saison. Moyenne mobile d’ordre = période : enlève une saison additive. Lissage exponentiel yt = αxt + (1−α)yt−1.',
        fiche: R`
<p><b>Filtre linéaire</b> : $y_t=\sum_{r=-q}^{s}\Pi_rx_{t+r}$.</p>
<div class="def"><b>Différence première</b> $\nabla x_t=x_t-x_{t-1}$ : élimine une tendance linéaire $a+bt$. Mais crée une dépendance fictive : si $x_t=a+bt+R_t$, $y_t=b+R_t-R_{t-1}$.<br>
<b>Différence seconde</b> $\nabla^2x_t=x_t-2x_{t-1}+x_{t-2}$ : élimine une tendance quadratique.<br>
<b>Différence saisonnière</b> $\nabla_sx_t=x_t-x_{t-s}$ ($s=12$ en mensuel) : élimine une tendance linéaire entre valeurs distantes de $s$.</div>
<p>Série M : $\nabla$ sur la série brute enlève la tendance mais la saison reste et sa variance grandit ; sur le log, c’est plus stationnaire. $\nabla$ puis $\nabla_{12}$ sur le log enlève tendance et saison.</p>
<div class="def"><b>Moyenne mobile (lissage)</b> : $\sum\Pi_r=1$ ; symétrique, $y_t=\frac1{2q+1}\sum_{r=-q}^qx_{t+r}$.
<ul><li>élimine une saison <b>additive</b> de période $2q+1$ et invariante ($\sum_{r}S_{t+r}=0$) ;</li><li>laisse passer une tendance linéaire ;</li><li>atténue le bruit (variance divisée par $2q+1$) mais perd $q$ points à chaque bord ;</li><li>crée des dépendances fictives et une périodicité artificielle (<b>effet Yule-Slutsky</b>).</li></ul></div>
<p><b>Filtre asymétrique</b> $y_t=\sum_{j\ge0}\Pi_jx_{t-j}$ : un seul effet de bord, permet d’estimer le présent. <b>Lissage exponentiel</b> : $\Pi_j=\alpha(1-\alpha)^j$, soit $y_t=\alpha x_t+(1-\alpha)y_{t-1}$ : mise à jour à chaque nouvelle observation.</p>`,
      },
      {
        id: 'ts-acf', title: 'Autocorrélogramme empirique', slides: '01 · 50-64',
        summary: 'rk = Σ(xt − x̄)(xt+k − x̄) / Σ(xt − x̄)². Bruit blanc : 95 % des rk dans ±2/√N. Décroissance lente = non-stationnaire ; bâtonnets à 12, 24 = saison.',
        fiche: R`
<div class="def"><b>Coefficient d’autocorrélation de délai $k$</b> :
$$r_k=\frac{\sum_{t=1}^{N-k}(x_t-\bar x)(x_{t+k}-\bar x)}{\sum_{t=1}^N(x_t-\bar x)^2}.$$
Si la série est stationnaire, $r_k$ estime $\rho_k=\mathrm{cov}(x_t,x_{t+k})/\mathrm{var}(x_t)$. Le graphe de $r_k$ en fonction de $k$ est l’<b>autocorrélogramme</b>.</div>
<p><b>Bruit blanc</b> : $r_k\approx0$, plus précisément $r_k\approx\mathcal N(0,1/N)$ (écart type $1/\sqrt N$), donc environ 95 % des coefficients dans $[-2/\sqrt N,2/\sqrt N]$. Sur 20 coefficients, un en moyenne sort de la bande par hasard : d’où la difficulté de lire un corrélogramme.</p>
<ul><li><b>Stationnaire</b> : corrélations à court terme, $r_1$ grand puis décroissance rapide vers 0.</li>
<li><b>Non stationnaire</b> (tendance) : $r_k$ décroît lentement ; ce n’est alors pas une vraie autocorrélation.</li>
<li><b>Saison</b> : grands bâtonnets aux délais 12, 24, … ; l’écart entre deux pics donne la période.</li>
<li>Série stationnarisée : les bâtonnets rentrent vite dans la bande.</li></ul>`,
      },
      {
        id: 'ts-stat', title: 'Processus stochastiques et stationnarité', slides: '02 · 3-30',
        summary: 'Une série observée = une réalisation finie d’un processus {Xt}. Stationnarité stricte (lois jointes invariantes) ou faible (moyenne, variance, covariances indépendantes de t). Bruit blanc ; la marche aléatoire n’est pas stationnaire.',
        fiche: R`
<div class="def"><b>Processus stochastique</b> : famille de variables aléatoires $X_t$ sur un même espace $(\Omega,\mathcal A,\mathbb P)$, indexées par le temps. On observe <b>une seule réalisation</b> $\{x_t\}$, de durée finie : c’est toute la difficulté.</div>
<p>Rappels : fonction de répartition $F_X(x)=\mathbb P(X\le x)$, densité, moments $\mathbb E[X^k]$. Égalité en loi $X\overset{\mathcal L}=Y$ n’implique pas $X=Y$ (pile/face et son inverse). Connaître un processus, c’est connaître toutes ses lois fini-dimensionnelles : trop dur, on se limite aux moments d’ordre 1 et 2.</p>
<div class="def"><b>Stationnarité stricte</b> : les lois jointes sont invariantes par translation dans le temps.<br>
<b>Stationnarité faible</b> (second ordre) : $\mathbb E(X_t)=\mu$, $\mathrm{Var}(X_t)=\sigma^2$, $\mathrm{Cov}(X_t,X_{t+k})=\gamma_k$, <b>indépendants de $t$</b>.<br>
Stricte ⇒ faible (moments finis) ; la réciproque est fausse, sauf pour un processus <b>gaussien</b>.</div>
<p>Intérêt : moins de paramètres à estimer.</p>
<div class="def"><b>Bruit blanc faible</b> : $\mathbb E(W_t)=0$, $\mathrm{Var}(W_t)=\sigma_w^2$, $\mathrm{Cov}(W_t,W_{t+k})=0$ pour $k\neq0$ (non corrélé, pas forcément indépendant). <b>Fort</b> si indépendant. Gaussien : $GWN(0,\sigma^2)$ ; i.i.d. : $IWN$. Nom : même intensité à toutes les fréquences, comme la lumière blanche.</div>
<div class="def"><b>Marche aléatoire</b> : $X_t=X_{t-1}+Z_t$, $X_0=0$, donc $X_t=\sum_{i\le t}Z_i$. $\mathbb E(X_t)=t\mu$, $\mathrm{Var}(X_t)=t\sigma_Z^2$, $\mathrm{Cov}(X_t,X_{t+h})=t\sigma_Z^2$ : ça dépend de $t$, <b>non stationnaire</b>. (Mouvement brownien, « marche de l’ivrogne ».)</div>
<p><b>Vérifier la stationnarité</b> : visuellement, test de <b>Dickey-Fuller augmenté</b> (<code>adfuller</code> : si p-value &lt; 0,05, on rejette la non-stationnarité), et fonctions d’autocorrélation.</p>`,
      },
      {
        id: 'ts-acvf', title: 'Autocovariance, ACF et PACF théoriques', slides: '02 · 31-46',
        summary: 'γk = Cov(Xt, Xt+k), ρk = γk/γ0, |ρk| ≤ 1. PACF φkk : corrélation entre Xt et Xt+k une fois retirée l’influence des valeurs intermédiaires.',
        fiche: R`
<div class="def"><b>Autocovariance</b> (processus stationnaire) : $\gamma_k=\mathrm{Cov}(X_t,X_{t+k})=\mathbb E[(X_t-\mu)(X_{t+k}-\mu)]$, avec $\gamma_0=\sigma^2\ge0$, $\gamma_k=\gamma_{-k}$, $|\gamma_k|\le\gamma_0$.<br>
<b>Autocorrélation</b> : $\rho_k=\gamma_k/\gamma_0$, avec $\rho_0=1$, $-1\le\rho_k\le1$, $\rho_k=\rho_{-k}$.</div>
<p><b>Preuve de $|\gamma_k|\le\gamma_0$</b> : $\mathrm{Var}[\lambda_1X_t+\lambda_2X_{t+k}]=(\lambda_1^2+\lambda_2^2)\sigma^2+2\lambda_1\lambda_2\gamma_k\ge0$ ; avec $(1,1)$ puis $(1,-1)$, $-\sigma^2\le\gamma_k\le\sigma^2$.</p>
<p><b>Estimateurs</b> : $\hat\mu=\frac1N\sum x_t$, $c_k=\frac1N\sum_{t=1}^{N-k}(x_t-\hat\mu)(x_{t+k}-\hat\mu)$, $r_k=c_k/c_0$. Pour un bruit blanc, $\mathbb P(|\hat\rho_k|>1{,}96/\sqrt N)\approx0{,}05$.</p>
<p>Exemple : $X_t=2+W_t-W_{t-1}$ a $\rho_1=-1/2$ et $\rho_k=0$ pour $k\ge2$. Plusieurs processus peuvent avoir la même ACF (voir l’inversibilité).</p>
<div class="def"><b>Autocorrélation partielle</b> $\phi_{kk}$ : corrélation entre $X_t$ et $X_{t+k}$ après avoir retiré leur meilleure explication linéaire par $X_{t+1},\dots,X_{t+k-1}$ (covariance des résidus de ces deux régressions). Si $X_t$ et $X_{t+k}$ ne sont liés qu’à travers les valeurs intermédiaires, $\phi_{kk}=0$. Estimée par l’algorithme de <b>Durbin-Levinson</b>.</div>`,
      },
      {
        id: 'ts-linear', title: 'Processus linéaires, Wold, inversibilité', slides: '02 · 48-74',
        summary: 'Xt = μ + Σ ψj Wt−j, stationnaire si Σψj² < ∞. Wold : tout stationnaire = linéaire + déterministe. Inversible si Wt s’écrit avec les Xt passés (Σ|Πj| < ∞). MA(1) inversible ⇔ |θ| < 1 ; AR(1) stationnaire ⇔ |φ| < 1.',
        fiche: R`
<div class="def"><b>Processus linéaire</b> : $X_t=\mu+W_t+\psi_1W_{t-1}+\psi_2W_{t-2}+\dots$ (causal : seulement le passé). Si $\sum_j\psi_j^2<\infty$ ($\psi_0=1$), il est <b>faiblement stationnaire</b> avec $\mathrm{Var}(X_t)=\sigma_w^2\sum\psi_j^2$ et $\gamma_k=\sigma_w^2\sum_j\psi_j\psi_{j+k}$.</div>
<div class="thm"><b>Théorème de Wold (1938).</b> Tout processus faiblement stationnaire s’écrit $X_t=\sum_{i\ge0}\psi_iW_{t-i}+\kappa_t$ : une partie <b>purement non déterministe</b> (linéaire en un bruit blanc d’« innovations ») et une partie <b>purement déterministe</b> $\kappa_t$, non corrélées. En pratique on tronque la somme à un ordre fini.</div>
<p>Déterministe : $X_t=K\cos(\omega t+\phi)$ avec $\phi$ aléatoire mais fixée pour une réalisation : entièrement prévisible une fois $\phi$ estimée. Purement non déterministe : régresser sur le passé lointain n’apporte rien.</p>
<div class="def"><b>Inversibilité</b> : on réécrit $X_t=W_t+\Pi_1X_{t-1}+\Pi_2X_{t-2}+\dots$ ($\Pi_1=\psi_1$, $\Pi_2=\psi_2-\psi_1^2$…). Le processus est <b>inversible</b> si $\sum_j|\Pi_j|<\infty$. Un processus linéaire inversible est <b>entièrement déterminé par son ACF</b> (correspondance bijective).</div>
<p><b>MA(1)</b> $X_t=W_t-\theta W_{t-1}$ : toujours stationnaire ; $X_t=W_t-\sum_j\theta^jX_{t-j}$, donc inversible ssi $|\theta|<1$. $\rho_1=-\frac\theta{1+\theta^2}$, $\rho_k=0$ pour $k>1$. $\theta$ et $1/\theta$ donnent la même ACF : un seul des deux est inversible.</p>
<p><b>AR(1)</b> $X_t=\phi X_{t-1}+W_t$ : toujours inversible ; $X_t=\sum_j\phi^jW_{t-j}$, donc stationnaire ssi $\sum\phi^{2j}<\infty$, soit $|\phi|<1$.</p>`,
      },
      {
        id: 'ts-ar', title: 'Processus autorégressifs AR(p)', slides: '02 · 76-98',
        summary: 'Φp(B)Xt = Wt. Stationnaire ⇔ racines de Φp(z) hors du cercle unité. Yule-Walker ρk = Σ φi ρk−i. ACF qui décroît (exponentielles, sinusoïdes amorties), PACF nulle après p.',
        fiche: R`
<p>Origine : Yule (1927), $X_t=\alpha X_{t-1}+\beta X_{t-2}$ pour les taches solaires ; si l’équation caractéristique $z^2-\alpha z-\beta=0$ a des racines complexes, la solution oscille de façon amortie (ex. $Y_t=1{,}8Y_{t-1}-0{,}8Y_{t-2}$).</p>
<div class="def"><b>AR(p)</b> : $X_t=W_t+\phi_1X_{t-1}+\dots+\phi_pX_{t-p}$, $\phi_p\neq0$. L’observation s’explique linéairement par les précédentes (« mémoire longue »). Tout AR(p) est inversible ; la stationnarité n’est pas automatique.</div>
<p><b>Opérateur retard</b> $BX_t=X_{t-1}$, $B^jX_t=X_{t-j}$ (de norme 1). Alors $\Phi_p(B)X_t=W_t$ avec $\Phi_p(z)=1-\sum_j\phi_jz^j$ : une fois filtré par $\Phi_p(B)$, il ne reste que le choc $W_t$. Un <b>filtre</b> est linéaire et commute avec $B$.</p>
<div class="thm"><b>Stationnarité</b> : un AR(p) est stationnaire ssi toutes les racines de $\Phi_p(z)$ sont de module $>1$ (hors du cercle unité). AR(1) : $1-\phi z=0\Rightarrow z=1/\phi$, condition $|\phi|<1$ ; alors $(1-\phi B)^{-1}=\sum\phi^jB^j$.</div>
<p>Exemple (Yule) : $X_t=W_t+\frac14X_{t-1}+\frac18X_{t-2}$, $\Phi_2(z)=-\frac18(z+4)(z-2)$, racines $-4$ et $2$ : stationnaire. On l’inverse par fractions simples et séries géométriques.</p>
<div class="thm"><b>Équations de Yule-Walker</b> : $\gamma_k=\phi_1\gamma_{k-1}+\dots+\phi_p\gamma_{k-p}$, donc $\rho_k=\phi_1\rho_{k-1}+\dots+\phi_p\rho_{k-p}$ ($k\ge1$).<br>
Solutions $\rho_k=\sum_iC_i\omega_i^k$ (racines de l’équation caractéristique, $|\omega_i|<1$) : l’ACF est dominée par des <b>exponentielles décroissantes ou des sinusoïdes amorties</b>. AR(1) : $\rho_k=\phi^k$.<br>
<b>Variance</b> : $\sigma_x^2=\dfrac{\sigma_w^2}{1-\phi_1\rho_1-\dots-\phi_p\rho_p}$. <b>PACF</b> : $\phi_{kk}=0$ pour $k>p$.</div>`,
      },
      {
        id: 'ts-ma', title: 'Processus moyenne mobile MA(q) et dualité AR-MA', slides: '02 · 100-110 ; 03 · 3-6',
        summary: 'Xt = Θq(B)Wt, toujours stationnaire, inversible ⇔ racines de Θq hors du cercle. ACF nulle après q (mémoire courte), PACF qui décroît. AR(p) se lit sur la PACF, MA(q) sur l’ACF.',
        fiche: R`
<p>Origine : Slutsky (1927) génère un cycle économique anglais avec des nombres de la loterie : $X_t=W_t-\theta_1W_{t-1}-\dots$ Interprétation : les indicateurs économiques subissent des chocs aléatoires (grèves, décisions politiques) qui se répercutent quelques périodes.</p>
<div class="def"><b>MA(q)</b> : $X_t=W_t-\theta_1W_{t-1}-\dots-\theta_qW_{t-q}=\Theta_q(B)W_t$, $\theta_q\neq0$. Toujours linéaire et <b>stationnaire</b> ; <b>inversible</b> ssi les racines de $\Theta_q(z)$ sont de module $>1$.</div>
<div class="thm">$\mathbb E(X_t)=0$, $\mathrm{Var}(X_t)=\sigma_w^2(1+\sum\theta_i^2)$, et
$$\rho_k=\frac{-\theta_k+\theta_1\theta_{k+1}+\dots+\theta_{q-k}\theta_q}{1+\theta_1^2+\dots+\theta_q^2}\ (1\le k\le q),\qquad\rho_k=0\ (k>q).$$
L’ACF d’un MA(q) est <b>nulle après $q$</b> (mémoire courte). Sa PACF est dominée par des exponentielles ou sinusoïdes amorties (MA(1) : $\phi_{kk}=-\theta^k(1-\theta^2)/(1-\theta^{2(k+1)})$).</div>
<table><tr><th></th><th>AR(p)</th><th>MA(q)</th></tr>
<tr><td>Écriture</td><td>$\Phi_p(B)X_t=W_t$</td><td>$X_t=\Theta_q(B)W_t$</td></tr>
<tr><td>Stationnarité</td><td>racines de $\Phi_p$ hors du cercle</td><td>toujours</td></tr>
<tr><td>Inversibilité</td><td>toujours</td><td>racines de $\Theta_q$ hors du cercle</td></tr>
<tr><td>ACF</td><td>décroissance exponentielle / sinusoïde amortie</td><td><b>nulle après $q$</b></td></tr>
<tr><td>PACF</td><td><b>nulle après $p$</b></td><td>décroissance exponentielle / sinusoïde amortie</td></tr></table>
<p>Mnémotechnique : AR = mémoire longue, MA = mémoire courte. Un AR(p) est un MA(∞) et un MA(q) inversible un AR(∞). <b>Pour identifier l’ordre</b> : $q$ d’un MA sur l’ACF ; $p$ d’un AR sur la PACF (l’ACF ne suffit pas, son support est infini).</p>`,
      },
      {
        id: 'ts-arma', title: 'Modèles ARMA(p, q)', slides: '03 · 8-15',
        summary: 'Φp(B)Xt = Θq(B)Wt, sans facteur commun. Stationnaire et inversible selon les racines. Parcimonie : moins de paramètres qu’un AR ou MA pur. Formes MA(∞) et AR(∞).',
        fiche: R`
<div class="def"><b>ARMA(p, q)</b> : $X_t=\phi_1X_{t-1}+\dots+\phi_pX_{t-p}+W_t-\theta_1W_{t-1}-\dots-\theta_qW_{t-q}$, soit $\Phi_p(B)X_t=\Theta_q(B)W_t$, <b>sans facteur commun</b> entre $\Phi_p$ et $\Theta_q$.</div>
<p>Exemple : ARMA(1,1) $X_t-\phi X_{t-1}=W_t-\theta W_{t-1}$ avec $\phi\neq\theta$ ; si $\phi=\theta$, les facteurs se simplifient et $X_t=W_t$.</p>
<p><b>Intérêt</b> : décrire une série avec <b>moins de paramètres</b> qu’un AR ou MA pur, donc éviter le sur-apprentissage en choisissant le modèle le plus simple. Markovien si $(p,q)=(1,0)$ ; mémoire longue si $p\to\infty$.</p>
<p>Stationnaire si les racines de $\Phi_p$ sont hors du cercle unité, inversible si celles de $\Theta_q$ le sont. Alors ACF et PACF sont dominées par des exponentielles décroissantes (aucune ne s’annule nettement).</p>
<div class="thm"><b>Formes pures</b> : $X_t=\Psi(B)W_t$ avec $\Psi(B)\Phi(B)=\Theta(B)$ ; $\Pi(B)X_t=W_t$ avec $\Phi(B)=\Pi(B)\Theta(B)$.<br>
Exemple $X_t=0{,}5X_{t-1}+W_t-0{,}3W_{t-1}$ : $\Psi(B)=(1-0{,}3B)(1+0{,}5B+0{,}25B^2+\dots)=1+0{,}2B+0{,}1B^2+0{,}05B^3+\dots$ (poids $\psi_j=0{,}2\times0{,}5^{j-1}$, qui décroissent vite : stationnaire et inversible).</div>`,
      },
      {
        id: 'ts-arima', title: 'ARIMA, Box-Cox, SARIMA', slides: '03 · 17-44',
        summary: 'ARIMA(p,d,q) : ∇^d Xt est un ARMA(p,q). Box-Cox contre la non-stationnarité en variance. ∇s pour les bâtonnets saisonniers. SARIMA(p,d,q)(P,D,Q)s.',
        fiche: R`
<p>Beaucoup de séries sont non stationnaires, en <b>moyenne</b> ($\mu_t$) ou en <b>variance</b> ($\sigma_t^2$).</p>
<div class="def"><b>ARIMA(p, d, q)</b> : $\{X_t\}$ est ARIMA si $\nabla^dX_t$ est un ARMA(p,q) : $\Phi_p(B)\nabla^dX_t=\Theta_q(B)W_t$, avec $\nabla=1-B$. Processus <b>intégré d’ordre $d$</b> : $d$ différenciations le rendent stationnaire. En pratique $d=1$ ou $2$, rarement 3. Très fréquent en économie (indices boursiers, prix, production).</div>
<p>La marche aléatoire est un ARIMA(0,1,0) : $\nabla X_t=W_t$. Un ARIMA démarre à une date (t = 0) avec des valeurs initiales ($q$ pour $W$, $p+d$ pour $X$) : $\sum_{k=-\infty}^tW_k$ ne converge pas. Rappel : différencier peut créer des autocorrélations artificielles. En Python : <code>np.diff(data, n=1)</code> ou <code>data - data.shift(1)</code>.</p>
<div class="def"><b>Box-Cox</b> (non-stationnarité en variance) : $g_\lambda(X_t)=\frac{X_t^\lambda-1}\lambda$ si $\lambda\neq0$, $\ln X_t$ si $\lambda=0$ ; $\lambda$ choisi par tâtonnement.</div>
<div class="def"><b>Différenciation saisonnière</b> $\nabla_S=1-B^S$ : $\nabla_SX_t=X_t-X_{t-S}$ ; $\nabla_S^2X_t=X_t-2X_{t-S}+X_{t-2S}$. À utiliser quand les <b>bâtonnets saisonniers</b> ($r_S,r_{2S},\dots$) décroissent trop lentement. Elle enlève une tendance entre valeurs distantes de $S$, <b>pas la saisonnalité elle-même</b>. Attention : $\nabla_{12}$ (saisonnier) ≠ $\nabla^{12}$ (12 différences : <code>np.diff(data, n=12)</code>) ; $\nabla$ et $\nabla_S$ commutent.</div>
<p>Exemple « Monthly Accidental Deaths » (USA 1973-79) : $\nabla_{12}$ enlève la saison, il reste une tendance ; $\nabla\nabla_{12}$ enlève les deux.</p>
<div class="def"><b>SARIMA(p,d,q)(P,D,Q)$_S$</b> : $\Phi_p(B)\tilde\Phi_P(B^S)\nabla^d\nabla_S^DX_t=\Theta_q(B)\tilde\Theta_Q(B^S)W_t$.<br>
<b>SAR(P)</b> : bâtonnets saisonniers de la PACF nuls à partir de $(P+1)S$, ceux de l’ACF décroissent. <b>SMA(Q)</b> : bâtonnets saisonniers de l’ACF nuls à partir de $(Q+1)S$.</div>
<p>Accidental Deaths : sur $\nabla\nabla_{12}x_t$, $\hat\rho_{12}=-0{,}333$, $\hat\rho_{24}=-0{,}099$, $\hat\rho_{36}=0{,}013$ suggèrent un SMA(1), et seul $\hat\rho_1$ est significatif à court terme : $(1-B^{12})(1-B)X_t=28{,}831+(1+\theta_1B)(1+\Theta_1B^{12})W_t$. Hors programme : ARCH, GARCH.</p>`,
      },
      {
        id: 'ts-estim', title: 'Estimateurs : moyenne, autocovariance, autocorrélation', slides: '04 · 3-12',
        summary: 'Une seule réalisation : la stationnarité est cruciale. X̄ sans biais ; Ck biaisé mais asymptotiquement sans biais ; jackknife ; bruit blanc : E(Rk) ≈ −1/N, Var(Rk) ≈ 1/N.',
        fiche: R`
<p>On n’a qu’<b>une</b> réalisation $\{x_t\}$, pas des copies i.i.d. La stationnarité réduit les paramètres : $\mu$ (1 au lieu de $N$), $\sigma^2$, $\gamma_k$ ($N$ au lieu de $N(N-1)/2$).</p>
<p><b>Biais-variance</b> : $\mathbb E[(\hat\theta-\theta)^2]=\mathrm{Var}(\hat\theta)+\mathrm{biais}^2$. La moyenne empirique $\bar X$ est <b>sans biais</b> pour $\mu$ (linéarité de l’espérance et stationnarité).</p>
<div class="def"><b>Autocovariance</b> $C_k=\frac1N\sum_{t=1}^{N-k}(X_t-\bar X)(X_{t+k}-\bar X)$ : <b>biaisé</b>, $\mathbb E(C_k)=(1-\frac kN)[\gamma_k-\mathrm{Var}(\bar X)]$, mais asymptotiquement sans biais. Les $C_k$ sont fortement corrélés entre eux : si $\gamma_k$ est mal estimé, $\gamma_m$ aussi.</div>
<p><b>Jackknife</b> : $\tilde C_k=2C_k-\frac12(C_{k1}+C_{k2})$ ($C_{k1},C_{k2}$ calculés sur chaque moitié) : biais en $1/N^2$ au lieu de $1/N$, et test de stationnarité ($C_{k1}\approx C_{k2}$) ; mais plus de calculs et sensible à une tendance résiduelle.</p>
<div class="def"><b>Autocorrélation</b> $R_k=C_k/C_0$, biaisé. Si $\rho_k=0$ pour $k>q$ : $\mathrm{Var}(R_k)\approx\frac1N(1+2\sum_{i=1}^{q}\rho_i^2)$ pour $k>q$ (formule de Bartlett ; le slide l’écrit sans les carrés). Bruit blanc : $\mathbb E(R_k)\approx-\frac1N$, $\mathrm{Var}(R_k)\approx\frac1N$, asymptotiquement normal : 95 % des $r_k$ dans $-\frac1N\pm\frac2{\sqrt N}$, souvent approché par $\pm\frac2{\sqrt N}$.</div>
<p>Exemple : $N=100$, bande $\pm0{,}2$ ; quelques coefficients peuvent sortir par hasard.</p>`,
      },
      {
        id: 'ts-fit', title: 'Ajustement des paramètres AR, MA, ARMA', slides: '04 · 14-35',
        summary: 'AR : moindres carrés ou Yule-Walker (φ = Rp⁻¹ρ). MA : pas d’estimateur explicite, résidus récursifs depuis W0 = 0 puis optimisation (grille, Marquardt). Maximum de vraisemblance : exact, asymptotiquement efficace.',
        fiche: R`
<div class="def"><b>AR(p)</b>, $p$ fixé (vu sur la PACF) : minimiser la somme des carrés des résidus $\sum_{t>p}[X_t-\mu-\phi_1(X_{t-1}-\mu)-\dots]^2$ (≈ régression linéaire ; maximum de vraisemblance si $W_t$ gaussien).<br>
AR(1) : $\hat\mu\approx\bar X$ et $\hat\phi_1\approx\frac{\sum(X_t-\bar X)(X_{t+1}-\bar X)}{\sum(X_t-\bar X)^2}=r_1$. Test $\phi_1=0$ à 95 % : $\hat\phi_1\in\pm2/\sqrt N$ ?<br>
AR(2) par Yule-Walker : $\hat\phi_1=\dfrac{R_1(1-R_2)}{1-R_1^2}$, $\hat\phi_2=\dfrac{R_2-R_1^2}{1-R_1^2}$.</div>
<div class="thm"><b>Yule-Walker général</b> : $\rho=R_p\phi$ avec $R_p$ la matrice de Toeplitz $(\rho_{|i-j|})$, donc $\hat\phi=R_p^{-1}\hat\rho$. Pour $N$ grand, proche des moindres carrés.</div>
<p><b>MA(q)</b> : plus difficile, pas d’estimateur efficace explicite. MA(1) : inverser $R_1=-\frac{\hat\theta}{1+\hat\theta^2}$ donne $\hat\theta=\frac{-1\pm\sqrt{1-4R_1^2}}{2R_1}$, sans racine réelle si $|R_1|>0{,}5$ et inefficace sinon. Méthode : fixer $W_0=0$ et calculer récursivement $W_t=X_t-\mu+\theta W_{t-1}$, d’où $\sum W_t^2$ en fonction de $(\mu,\theta)$ ; minimiser par recherche sur grille ou algorithme de <b>Marquardt</b> (départ $\mu_0=\bar X$, $\theta_0$ tiré de $R_1$ ; plus sensible si $|\theta|\approx1$). Même idée pour MA(2), ARMA(1,1) (fixer aussi $X_0=\hat\mu$, ou partir de $t=2$).</p>
<div class="def"><b>Maximum de vraisemblance</b> : les méthodes précédentes sont des <b>moindres carrés conditionnels</b> (valeurs initiales fixées). Pour les séries courtes ou non inversibles : maximiser la vraisemblance exacte $L(x_1..x_N;\phi,\theta,\mu,\sigma^2)$. Avantages : toute l’information, estimateurs <b>asymptotiquement efficaces</b>. Inconvénients : hypothèses sur les lois jointes, calcul lourd (logiciels).</div>
<p>AR(1) gaussien : $L\propto\sigma^{-N}\sqrt{1-\phi^2}\exp[-S(\phi,\mu)/(2\sigma^2)]$ avec $S=S^*+(1-\phi^2)(X_1-\mu)^2$, où $S^*$ est la somme conditionnelle ; $\hat\sigma^2=S(\hat\phi,\hat\mu)/N$. Pour $N$ grand, $S\approx S^*$ : les estimations diffèrent peu. Problème numérique si $\hat\phi\approx\pm1$.</p>`,
      },
      {
        id: 'ts-bj', title: 'Méthodologie de Box-Jenkins', slides: '05 · 3-15',
        summary: 'Stationnariser (Box-Cox, ∇, ∇s), identifier p, q sur ACF/PACF (parcimonie, AIC/BIC), ajuster, diagnostiquer les résidus (bruit blanc ? Ljung-Box), éviter le sur-ajustement.',
        fiche: R`
<p>Box et Jenkins (1970) : méthode empirique pour choisir et construire un SARIMA. « All models are wrong but some are useful » (Box 1978).</p>
<div class="thm"><b>Étapes</b>
<ol><li><b>Stationnarité</b> : vérifier (visuel, Dickey-Fuller) ; si besoin Box-Cox, différencier ($d$), différencier saisonnièrement ($D$).</li>
<li><b>Sélection</b> (principe de <b>parcimonie</b>) : commencer par les modèles les plus simples compatibles avec l’ACF et la PACF : AR(1), MA(1), puis petits ARMA. Critères de complexité : AIC, BIC.</li>
<li><b>Ajustement</b> des paramètres (<code>model.fit()</code>).</li>
<li><b>Diagnostic</b> : le modèle est-il adéquat ?</li></ol></div>
<p><b>Analyse des résidus</b> $\hat W_t$ : ils doivent ressembler à un bruit blanc $\mathcal N(0,\sigma)$ (ils sont un peu corrélés même si le modèle est juste, car les paramètres sont estimés). Vérifier : pas de tendance ni de variance qui change dans le temps ; pas de dépendance aux valeurs prévues ; normalité (QQ-plot / droite de Henry, Shapiro-Wilk) ; non-corrélation (Durbin-Watson) ; ACF et PACF des résidus dans $\pm2/\sqrt N$ (on tolère quelques dépassements : avec des paramètres estimés, la vraie variance est $<1/N$ aux petits délais).</p>
<div class="def"><b>Tests du portemanteau</b> (blancheur des résidus, $H_0$ précise, alternative vague, peu puissants) :<br>
Box-Pierce $Q_{BP}=n\sum_{k=1}^KR_k^2(\hat W)\sim\chi^2_{K-p-q}$, avec $n=N-d$.<br>
Ljung-Box $Q^*=n(n+2)\sum_{k=1}^K\frac{\hat R_k^2}{n-k}\sim\chi^2_{K-p-q}$, converge plus vite : préféré pour $n$ petit. Plutôt des tests de <b>rejet</b> que d’acceptation.</div>
<p><b>Sur-ajustement</b> : plus de paramètres = meilleur ajustement, mais un ARMA(100,100) prédit le bruit, imprévisible par définition, et dégrade les prévisions. Test : passer d’AR(2) à AR(3) ; il y a overfitting si $\phi_3$ n’est <b>pas</b> significatif et si $\hat\phi_1,\hat\phi_2$ <b>changent</b> beaucoup. Ne pas augmenter AR et MA en même temps (instable si $\theta_i\approx\phi_i$) : un ordre à la fois.</p>`,
      },
      {
        id: 'ts-forecast', title: 'Prévisions et intervalles de confiance', slides: '05 · 17-37',
        summary: 'X̂t(l) = Et(Xt+l), calculé récursivement. Erreur de variance V(l) = σ²(1 + ψ1² + … + ψ²l−1), croissante avec l. AR(1) : X̂t(l) = μ + φ^l (xt − μ). Intervalle X̂t(l) ± u√V(l).',
        fiche: R`
<p>« Forecasting is difficult, especially the future. » ARIMA(p,d,q) est un ARMA(p+d,q) non stationnaire : $\varphi_{p+d}(B)=\Phi_p(B)(1-B)^d$. On suppose la série (différenciée) stationnaire et inversible ; connaître $X_t,X_{t-1},\dots$ équivaut à connaître $W_t,W_{t-1},\dots$</p>
<p>Trois écritures de $X_{t+l}$ : ARMA(p+d,q) explicite ; MA(∞) $X_{t+l}=W_{t+l}+\psi_1W_{t+l-1}+\dots$ ; AR(∞).</p>
<div class="thm"><b>Prédicteur optimal</b> (erreur quadratique moyenne minimale parmi les prédicteurs linéaires) : $\hat X_t(l)=\psi_lW_t+\psi_{l+1}W_{t-1}+\dots=\mathbb E_t(X_{t+l})$.<br>
Erreur $E_t(l)=W_{t+l}+\psi_1W_{t+l-1}+\dots+\psi_{l-1}W_{t+1}$ : sans biais, de variance
$$V(l)=\sigma^2\big(1+\psi_1^2+\dots+\psi_{l-1}^2\big),$$
qui <b>augmente avec l’horizon</b> $l$.</div>
<p><b>Calcul récursif</b> sans connaître les $\psi$ : prendre $\mathbb E_t$ de la forme ARMA : $\hat X_t(l)=\sum_j\varphi_j\hat X_t(l-j)-\sum_i\theta_i[W_{t+l-i}]$, avec $[W_s]=0$ pour un instant futur et $\hat X_t(l-j)=X_{t+l-j}$ si $l\le j$ (valeur connue).</p>
<div class="def"><b>Intervalle de confiance</b> (bruit gaussien) : $X_{t+l}\mid\text{passé}\sim\mathcal N(\hat X_t(l),V(l))$, donc $\mathbb P[X_{t+l}\in\hat X_t(l)\pm u_{\varepsilon/2}\sqrt{V(l)}]=1-\varepsilon$ ($u=1{,}96$ à 95 %). Approché car $V(l)$ est estimé ; les prévisions sont peu sensibles aux erreurs sur les paramètres <b>si le modèle est correct</b>.</div>
<p><b>Cas particuliers</b> : MA(1) $X_t=\mu+W_t-\theta W_{t-1}$ : $\hat X_t(1)=\mu-\theta W_t$, $\hat X_t(l)=\mu$ pour $l>1$ ; variance $\sigma^2$ puis $\sigma^2(1+\theta^2)$. AR(1) : $\hat X_t(l)=\mu+\phi^l(X_t-\mu)\to\mu$ et $\mathrm{Var}=\sigma^2\frac{1-\phi^{2l}}{1-\phi^2}\to\frac{\sigma^2}{1-\phi^2}$ : à long terme, on prévoit la moyenne. ARI(p,d) / IMA(d,q) : la prévision tend vers une constante ($d=0,1$), une droite ($d=2$), une parabole ($d=3$).</p>
<p><b>Série transformée</b> : la prévision optimale de $x_t$ quand on a modélisé $\log x_t$ n’est pas $e^{\hat X_t(l)}$ mais $e^{\hat X_t(l)+\frac12\mathrm{var}(E_t(l))}$.</p>
<p><b>Mise à jour</b> : $\hat X_{t+1}(l)=\hat X_t(l+1)+\psi_l\hat W_{t+1}$, avec $\hat W_{t+1}=X_{t+1}-\hat X_t(1)$ : on corrige la prévision d’hier par la surprise d’aujourd’hui.</p>`,
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
    ],

    gens: {
      'ts-acf': [
        () => { const N = pick([25, 49, 100, 144, 169, 400, 900]); return { q: R`Corrélogramme d’une série de $N=${N}$ points : demi-largeur de la bande à 95 % pour un bruit blanc ? (3 décimales)`, a: 2 / Math.sqrt(N), tol: 0.002, expl: R`$2/\sqrt{${N}}=${f(2 / Math.sqrt(N))}$.` }; },
      ],
      'ts-linear': [
        () => { const th = pick([0.2, 0.4, 0.5, 0.6, 0.8, -0.4, -0.7]); const r = -th / (1 + th * th); return { q: R`MA(1) $X_t=W_t-\theta W_{t-1}$ avec $\theta=${f(th, 1)}$ : que vaut $\rho_1$ ? (3 décimales)`, a: r, tol: 0.001, expl: R`$\rho_1=-\frac\theta{1+\theta^2}=-\frac{${f(th, 1)}}{${f(1 + th * th, 2)}}=${f(r)}$. Remarque : $|\rho_1|\le0{,}5$ pour tout MA(1).` }; },
        () => { const ph = pick([0.3, 0.5, 0.7, 0.9, -0.6]), k = rnd(2, 5); return { q: R`AR(1) avec $\phi=${f(ph, 1)}$ : que vaut $\rho_{${k}}$ ? (4 décimales)`, a: ph ** k, tol: 0.0002, expl: R`$\rho_k=\phi^k=(${f(ph, 1)})^{${k}}=${f(ph ** k, 4)}$.` }; },
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
      ],
      'ts-fit': [
        () => {
          const r1 = pick([0.5, 0.6, 0.7, 0.8]), r2 = pick([0.2, 0.3, 0.4, 0.5]);
          const p1 = r1 * (1 - r2) / (1 - r1 * r1), p2 = (r2 - r1 * r1) / (1 - r1 * r1);
          return { q: R`AR(2) par Yule-Walker avec $R_1=${f(r1, 1)}$ et $R_2=${f(r2, 1)}$ : $\hat\phi_2$ ? (3 décimales)`, a: p2, tol: 0.002,
            expl: R`$\hat\phi_2=\frac{R_2-R_1^2}{1-R_1^2}=\frac{${f(r2, 1)}-${f(r1 * r1, 2)}}{${f(1 - r1 * r1, 2)}}=${f(p2)}$ (et $\hat\phi_1=${f(p1)}$).` };
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
      ],
      'ts-bj': [
        () => { const K = pick([10, 15, 20, 24]), p = rnd(0, 2), q = rnd(0, 2); return { q: R`Ljung-Box sur les résidus d’un ARMA(${p},${q}) avec $K=${K}$ délais : nombre de degrés de liberté du $\chi^2$ ?`, a: K - p - q, tol: 0, expl: R`$K-p-q=${K - p - q}$.` }; },
      ],
    },
  });
})();
