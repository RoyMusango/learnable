// Chapitre : Bandit problems I (X. Siebert, slides bandits_en_V2, 98 slides).
(function () {
  const R = String.raw;
  const { pick, rnd, f } = COURSE.u;

  COURSE.add({
    id: 'bd',
    title: 'Problèmes de bandits',
    short: 'Bandits',
    source: 'bandits_en_V2.pdf · 98 slides',
    seen: null,
    pitch: 'Explorer ou exploiter ? Regret, Explore-Then-Commit, borne de Lai-Robbins, ε-greedy, UCB, Thompson sampling, identification du meilleur bras. Très appliqué : essais cliniques, A/B testing, recommandation.',
    sections: [
      {
        id: 'bd-setting', title: 'Le problème du bandit manchot', slides: '3-18',
        summary: 'K bras aux lois de gains inconnues ; à chaque instant on tire un bras et on observe son seul gain. Politique = fonction de l’historique. Bandit stochastique stationnaire.',
        fiche: R`
<p>Une machine à sous (bandit manchot) ; avec <b>K bras</b>, chacun a sa propre loi de gains. Dilemme : <b>exploiter</b> le meilleur bras trouvé jusqu’ici, ou <b>explorer</b> un autre bras. Même une bonne stratégie ne devine pas le meilleur bras tout de suite.</p>
<p>Origine : essais cliniques (Thompson 1933) ; le nom date des années 1950 (souris dans un labyrinthe en T = bandit à 2 bras). C’est le <b>prototype de l’apprentissage par renforcement</b> avec un seul état : le choix présent ne change pas les choix et gains futurs.</p>
<p><b>Essai clinique</b> : traiter 500 patients avec A et 500 avec B, puis comparer, est dangereux si l’un des traitements est mortel. Mieux : choisir séquentiellement et s’adapter. Autres applications : A/B testing de publicités, AlphaGo (Monte-Carlo Tree Search), choix de canal radio, recommandation…</p>
<div class="def"><b>Formalisme</b> : jeu séquentiel entre un agent et un environnement $E$, sur un horizon $n$ (souvent inconnu). À chaque $t$ : action $A_t\in\{1..K\}$, gain $X_t\in\mathbb R$. Historique $H_t=\{A_1,X_1,\dots,A_t,X_t\}$. <b>Politique</b> $\pi:H_t\mapsto A_{t+1}$.</div>
<div class="def"><b>Bandit stochastique</b> : $X_t\sim\nu_{A_t}$ i.i.d., indépendamment du passé. <b>Stationnaire</b> si les lois $\nu_a$ ne changent pas dans le temps.<br>
Gain moyen du bras $a$ : $\mu_a=\int t\,d\nu_a(t)$ ; meilleur gain $\mu^*=\max_a\mu_a$, meilleur bras $a^*=\arg\max_a\mu_a$.</div>
<p>Hypothèses : on n’observe que le gain du bras tiré ; gains i.i.d. ; gains bornés. Exemple type : le <b>casino de Bernoulli</b>, $X_t\sim\mathcal B(\mu_{A_t})$, gain 1 avec probabilité $\mu_a$.</p>
<p>Le gain cumulé $S_n=\sum_tX_t$ est aléatoire : on maximise son <b>espérance</b> $\mathbb E[S_n]$.</p>`,
      },
      {
        id: 'bd-regret', title: 'Le regret et sa décomposition', slides: '19-29',
        summary: 'Rn = nμ* − E[ΣXt] = Σa Δa E[Na(n)]. Un bon algorithme tire rarement les bras de grand écart Δa. On veut Rn/n → 0.',
        fiche: R`
<div class="def"><b>Écart (regret instantané)</b> : $\Delta_a=\mu^*-\mu_a\ge0$, la pénalité pour ne pas avoir tiré le meilleur bras.<br>
<b>Regret espéré</b> : $R_n(\pi)=n\mu^*-\mathbb E_\pi\big[\sum_{t=1}^nX_t\big]$.</div>
<p>$R_n$ croît avec $n$. On veut que la stratégie finisse par identifier le meilleur bras : $\lim_{n\to\infty}R_n/n=0$ (regret <b>sous-linéaire</b>).</p>
<div class="thm"><b>Décomposition du regret.</b> Si $N_a(n)=\sum_{t=1}^n\mathbb 1\{A_t=a\}$ est le nombre de tirages du bras $a$ :
$$R_n=\sum_{a=1}^K\Delta_a\,\mathbb E[N_a(n)].$$</div>
<p><b>Preuve</b> : $\sum_a\mathbb 1\{A_t=a\}=1$, donc $S_n=\sum_t\sum_aX_t\mathbb 1\{A_t=a\}$ et $n\mu^*=\sum_a\sum_t\mathbb E[\mu^*\mathbb 1\{A_t=a\}]$. D’où $R_n=\sum_a\sum_t\mathbb E[(\mu^*-X_t)\mathbb 1\{A_t=a\}]$. En conditionnant sur $A_t$ : $\mathbb E[(\mu^*-X_t)\mathbb 1\{A_t=a\}\mid A_t]=\mathbb 1\{A_t=a\}\Delta_a$, puis on somme sur $t$.</p>
<p>$N_a(n)$ est aléatoire même pour une politique déterministe (les choix dépendent des gains observés). Le meilleur bras ne contribue pas ($\Delta_{a^*}=0$). Message : tirer <b>moins souvent</b> les bras de grand $\Delta_a$.</p>`,
      },
      {
        id: 'bd-naive', title: 'Stratégies élémentaires : exploration pure, exploitation pure', slides: '31-35',
        summary: 'Exploration uniforme : regret linéaire (n/K)ΣΔa. Follow the Leader : excellent ou catastrophique, regret linéaire aussi.',
        fiche: R`
<p>Convention : le meilleur bras est le bras 1, $\mu^*=\mu_1\ge\mu_2\ge\dots\ge\mu_K$ (l’agent ne le sait pas).</p>
<div class="def"><b>Exploration pure</b> : tirer chaque bras $n/K$ fois. $R_n=\frac nK\sum_a\Delta_a$ : <b>linéaire</b> en $n$, le gain moyen ne converge pas vers $\mu^*$.</div>
<div class="def"><b>Exploitation pure (Follow the Leader)</b> : tirer chaque bras une fois, puis toujours $A_{t+1}=\arg\max_a\hat\mu_a(t)$, avec $\hat\mu_a(t)=\frac1{N_a(t)}\sum_{s}Y_a(s)$.</div>
<p>Excellent si le premier tirage a désigné le bon bras, désastreux sinon. Pire cas (Bernoulli, 2 bras) : le premier tirage du bras 1 donne 0 (probabilité $1-\mu_1$) et celui du bras 2 donne 1 (probabilité $\mu_2$) ; on tire ensuite le bras 2 de l’ordre de $n$ fois. Regret $\approx(1-\mu_1)\mu_2(\mu_1-\mu_2)\,n$ : <b>linéaire</b>.</p>`,
      },
      {
        id: 'bd-etc', title: 'Explore-Then-Commit (ETC)', slides: '37-49',
        summary: 'Tirer m fois chaque bras puis s’engager sur le meilleur. Hoeffding : E[Na] ≤ m + n e^{−mΔ²/2}. m optimal → regret logarithmique, mais il faut connaître Δ ; version séquentielle sans Δ.',
        fiche: R`
<p><b>Algorithme</b> : (1) exploration : tirer chacun des $K$ bras $m$ fois ($m\le n/K$) ; (2) engagement : $\hat a=\arg\max_a\hat\mu_a(m)$, et $A_{t+1}=\hat a$ pour $t\ge Km$.</p>
<p><b>Regret</b> : $N_a(n)=m+(n-Km)\mathbb 1\{\hat a=a\}\le m+n\,\mathbb 1\{\hat\mu_a(m)\ge\hat\mu_1(m)\}$, donc $\mathbb E[N_a(n)]\le m+n\,\mathbb P[\hat\mu_a(m)\ge\hat\mu_1(m)]$.</p>
<p>Avec $Z(s)=Y_a(s)-Y_1(s)\in[-1,1]$ de moyenne $\mu_a-\mu_1<0$, la probabilité que la moyenne empirique des $Z$ soit $\ge0$ est petite. <b>Hoeffding unilatéral</b> : $\mathbb P[\frac1m\sum Z_i\ge x]\le e^{-(x-\mu)^2m/2}$, d’où</p>
$$\mathbb E[N_a(n)]\le m+n\,e^{-m\Delta^2/2},\qquad R(n)\le\sum_{a\ge2}(\mu_1-\mu_a)\big(m+n\,e^{-m\Delta^2/2}\big),$$
<p>avec $\Delta=\mu_1-\mu_2$ le plus petit écart. En annulant $\partial R/\partial m$ :</p>
$$m=\frac2{\Delta^2}\log\frac{n\Delta^2}2,\qquad R(n)\le\frac{2\sum_{a\ge2}(\mu_1-\mu_a)}{\Delta^2}\Big(\log\frac{n\Delta^2}2+1\Big).$$
<p>Regret <b>logarithmique</b> ; pour 2 bras $R(n)\le\frac2\Delta(\log\frac{n\Delta^2}2+1)$. Mais il faut <b>connaître $\Delta$</b> à l’avance : irréaliste.</p>
<div class="def"><b>ETC séquentiel</b> : explorer uniformément jusqu’à $\tau=\inf\{t: |\hat\mu_1(t)-\hat\mu_2(t)|>\sqrt{4\log(n/t)/t}\}$, puis s’engager. Regret $R(n)\le\frac2\Delta\log n+C\sqrt{\log n}$, sans connaître $\Delta$.</div>`,
      },
      {
        id: 'bd-lower', title: 'Borne inférieure de Lai et Robbins', slides: '50-57',
        summary: 'Aucun algorithme efficace ne fait mieux que logarithmique : E[Na(n)] ≥ log n / KL(νa, ν*). Plus les bras se ressemblent, plus c’est dur.',
        fiche: R`
<div class="def"><b>Algorithme efficace</b> : regret <b>sous-linéaire</b> pour <b>tout</b> problème de bandit.</div>
<p>Jusqu’ici, des bornes supérieures. Mais même un algorithme optimal a un regret non nul, puisque les lois sont inconnues.</p>
<div class="thm"><b>Théorème de Lai et Robbins (1985).</b> Pour tout algorithme efficace et tout bras sous-optimal $a$ :
$$\liminf_{n\to\infty}\frac{\mathbb E[N_a(n)]}{\log n}\ge\frac1{D_{KL}(\nu_a\|\nu^*)},\qquad\text{donc}\quad\liminf_{n\to\infty}\frac{R_n}{\log n}\ge\sum_a\frac{\Delta_a}{D_{KL}(\nu_a\|\nu^*)}.$$</div>
<p>$D_{KL}(P\|Q)=\int p\log\frac pq$ mesure la dissimilarité des lois. Bernoulli : $d(\mu_a;\mu_b)=(1-\mu_a)\log\frac{1-\mu_a}{1-\mu_b}+\mu_a\log\frac{\mu_a}{\mu_b}$.</p>
<p>Interprétation : plus les moyennes sont proches ($\Delta_a\downarrow$), plus il faut de tirages pour distinguer les bras ; la difficulté diminue quand la divergence KL augmente. On ne peut pas faire mieux que <b>logarithmique</b>.</p>
<p>Comme $d(\mu_a;\mu_1)\ge(\mu_a-\mu_1)^2$ (cours ; Pinsker donne même $2(\cdot)^2$), on compare ETC ($\approx\frac2{\Delta^2}\log n$) à la borne. Lai et Robbins proposent une stratégie qui l’atteint mais elle est incalculable : d’où la recherche d’algorithmes simples à regret logarithmique, idéalement optimaux.</p>`,
      },
      {
        id: 'bd-egreedy', title: 'ε-greedy', slides: '58-60',
        summary: 'Avec probabilité 1 − ε le meilleur bras empirique, sinon un bras au hasard. ε fixe : regret linéaire. ε décroissant : mieux, mais calendrier difficile à régler.',
        fiche: R`
<p>Cousin d’ETC, mais l’exploration est <b>aléatoire et permanente</b>. Après un tirage de chaque bras, à chaque itération :</p>
<ul><li>avec probabilité $1-\epsilon$ : le meilleur bras empirique $\arg\max_a\hat\mu_a(t)$ ;</li>
<li>avec probabilité $\epsilon$ : un bras tiré uniformément parmi les $K$.</li></ul>
<p>Un seul paramètre $\epsilon$, exploration indépendante de ce que l’on sait déjà.</p>
<p><b>Regret</b> (Silver) : greedy, linéaire (peut se bloquer sur un mauvais bras) ; ε-greedy à $\epsilon$ fixe, encore linéaire car on explore une fraction $\epsilon$ du temps pour toujours (environ $\frac\epsilon K\sum_a\Delta_a$ par tour) ; ε <b>décroissant</b> : bien mieux, mais le calendrier est difficile à concevoir.</p>`,
      },
      {
        id: 'bd-ucb', title: 'UCB : l’optimisme face à l’incertitude', slides: '61-80',
        summary: 'Tirer le bras de plus grand indice μ̂a + √(2 log t / Na). Construit à partir de Hoeffding + union bound. E[Na(n)] = O(log n / Δa²) : regret logarithmique.',
        fiche: R`
<p><b>Principe</b> (Auer et al. 2002) : supposer l’environnement aussi favorable que possible. Pour chaque bras, un intervalle de confiance $\mu_a\in[LCB_a(t),UCB_a(t)]$ ; on tire le bras de plus grande <b>borne supérieure</b>. Chaque fois qu’on tire un bras sous-optimal, on apprend et son incertitude diminue.</p>
<p><b>Construction</b>. Première idée, le TCL : asymptotique, et on ne peut pas remplacer $s$ fixe par l’aléatoire $N_a(t)$ gratuitement. Seconde idée, <b>Hoeffding</b> (non asymptotique) : $\mathbb P[\hat\mu(s)\le\mu-\epsilon]\le e^{-2s\epsilon^2}$. Avec $\delta=e^{-2s\epsilon^2}$ puis $\delta=1/t^2$ :</p>
$$\mathbb P\Big[\hat\mu_a(s)\le\mu_a-\sqrt{\tfrac{\log t}{s}}\Big]\le\frac1{t^2}.$$
<p>$N_a(t)$ est aléatoire : on borne par l’union sur toutes ses valeurs possibles $s=1..t$, ce qui coûte un facteur $t$ :</p>
$$\mathbb P\Big[\mu_a\le\hat\mu_a(t)+\sqrt{\tfrac{\log t}{N_a(t)}}\Big]\ge1-\frac1t.$$
<div class="thm"><b>UCB1</b> : $A_{t+1}=\arg\max_a\Big[\underbrace{\hat\mu_a(t)}_{\text{exploitation}}+\underbrace{\sqrt{\tfrac{2\log t}{N_a(t)}}}_{\text{bonus d’exploration}}\Big]$.</div>
<p>Un bras délaissé voit $\log t$ grandir alors que $\hat\mu_a$ et $N_a$ restent fixes : son indice remonte, <b>tous les bras finissent par être tirés</b>. Variante : confiance $\delta=1/t^\alpha$ ($\alpha>1$), bonus $\sqrt{\alpha\log t/(2N_a(t))}$.</p>
<div class="thm"><b>Regret logarithmique.</b> Pour tout bras sous-optimal, $\mathbb E[N_a(n)]\le\frac{\log n}{2\Delta_a^2}+C$ (constantes selon la preuve), donc $\mathbb E[R(n)]=O(\log n)$.</div>
<p><b>Idée de preuve</b> : un mauvais tirage ($U_{a,t}\ge U_{1,t}$) n’arrive que si (1) le bras 1 est fortement sous-estimé (probabilité $<1/t^\alpha$), ou (2) le bras $a$ est surestimé : $\mu_a+2\,UCB_a>\mu_1$, soit $UCB_a>\Delta_a/2$, ce qui impose $N_a<\frac{2\alpha\log t}{\Delta_a^2}$.</p>
<p>Le facteur $1/\Delta_a^2$ explose si deux bras sont très proches (mais alors tirer le second coûte peu) ; il existe aussi des bornes « pire cas » indépendantes de $\Delta_a$. Variante <b>KL-UCB</b> (inégalité de Chernoff) : meilleure pour les Bernoulli.</p>`,
      },
      {
        id: 'bd-thompson', title: 'Approche bayésienne : Thompson sampling', slides: '82-94',
        summary: 'Loi a priori uniforme sur μa, a posteriori Beta(Sa+1, Na−Sa+1). À chaque tour, tirer θa selon chaque a posteriori et jouer le plus grand. Atteint la borne de Lai-Robbins.',
        fiche: R`
<p><b>Fréquentiste</b> : $\mu_a$ sont des paramètres inconnus (estimateurs, intervalles de confiance). <b>Bayésien</b> : chaque $\mu_a$ est la réalisation d’une variable aléatoire dont on estime la loi.</p>
<p>Sans information, a priori <b>uniforme</b> $\mu_a\sim\mathcal U([0,1])=\mathrm{Beta}(1,1)$. Avec $N_a(t)$ tirages et $S_a(t)$ succès :</p>
$$\pi_a(t)=\mathcal L(\mu_a\mid\text{observations})=\mathrm{Beta}\big(\underbrace{S_a(t)+1}_{\alpha},\ \underbrace{N_a(t)-S_a(t)+1}_{\beta}\big).$$
<p>Densité : $f(x;\alpha,\beta)=\frac{\Gamma(\alpha+\beta)}{\Gamma(\alpha)\Gamma(\beta)}x^{\alpha-1}(1-x)^{\beta-1}$ sur $[0,1]$, moyenne $\frac\alpha{\alpha+\beta}$. Un 1 observé pousse la densité vers la droite, un 0 vers la gauche ; un bras peu tiré a une a posteriori <b>plate</b>, un bras souvent tiré une a posteriori <b>pointue</b>.</p>
<div class="def"><b>Conjugaison Beta-Bernoulli</b> : vraisemblance $\theta^x(1-\theta)^{1-x}$, a priori $\propto\theta^{\alpha-1}(1-\theta)^{\beta-1}$, donc a posteriori $\propto\theta^{\alpha+x-1}(1-\theta)^{\beta+(1-x)-1}=\mathrm{Beta}(\alpha+x,\beta+1-x)$.</div>
<div class="thm"><b>Thompson sampling</b> (1933, redécouvert en 2011 pour la publicité en ligne). À chaque tour : pour chaque bras, tirer $\theta_a(t)\sim\pi_a(t)$ ; jouer $A_{t+1}=\arg\max_a\theta_a(t)$ ; mettre à jour l’a posteriori du bras joué.</div>
<p>Philosophie différente d’UCB : au lieu du modèle le plus optimiste, on joue selon <b>un modèle plausible</b> tiré au hasard. L’exploration vient du hasard du tirage : un bras peu connu peut sortir un grand $\theta_a$. Très efficace en pratique ; regret logarithmique et <b>optimal</b> pour les gains binaires (Kaufmann et al. 2012) : atteint la borne de Lai-Robbins.</p>`,
      },
      {
        id: 'bd-bai', title: 'Identifier le meilleur bras', slides: '96-98',
        summary: 'Autre objectif : trouver le meilleur bras vite et sûrement (P(âτ = a*) ≥ 1 − δ, E[τ] petit). Règles d’échantillonnage, d’arrêt, de recommandation ; algorithme LUCB.',
        fiche: R`
<p>Minimiser le regret = guérir le plus de patients <b>pendant</b> l’étude. Objectif alternatif : <b>identifier le meilleur traitement</b> le plus vite possible, sans objectif thérapeutique immédiat.</p>
<div class="def"><b>Identification du meilleur bras</b> (risque $\delta\in]0,1[$ proche de 0) :
<ol><li>règle d’échantillonnage : quel bras $A_t$ tirer ;</li><li>règle d’arrêt : à quel instant $\tau$ s’arrêter ;</li><li>recommandation : $\hat a_\tau=\arg\max_a\hat\mu_a(\tau)$.</li></ol>
Objectifs : $\mathbb P(\hat a_\tau=a^*)\ge1-\delta$ et $\mathbb E[\tau]$ petit.</div>
<p>Cela ressemble à de l’exploration pure, mais le but n’est plus le gain.</p>
<p><b>LUCB</b> : à chaque tour, tirer deux bras bien choisis : $u_t$ le meilleur empirique et $\ell_t$, parmi les autres, celui de plus grande borne supérieure. S’arrêter quand les intervalles sont séparés : la LCB du meilleur dépasse les UCB de tous les autres.</p>`,
      },
    ],

    cards: [
      ['bd-setting', 'dilemme', R`Quel est le dilemme fondamental du bandit ?`, R`Exploiter le meilleur bras connu ou explorer d’autres bras qui pourraient être meilleurs.`],
      ['bd-setting', 'rl', R`En quoi le bandit est-il un prototype de l’apprentissage par renforcement ?`, R`Il n’y a qu’un seul état : le choix présent ne modifie ni les choix ni les gains futurs ; une action à la fois, sans planification.`],
      ['bd-setting', 'clinique', R`Pourquoi l’approche « 500 patients A, 500 patients B » est-elle dangereuse ?`, R`Si un traitement est mortel, 500 patients en meurent. Un bandit choisit séquentiellement et délaisse vite le mauvais traitement.`],
      ['bd-setting', 'politique', R`Qu’est-ce qu’une politique dans un problème de bandit ?`, R`Une fonction qui associe à l’historique $H_t=\{A_1,X_1,\dots,A_t,X_t\}$ le prochain bras $A_{t+1}$.`],
      ['bd-setting', 'stochastique', R`Bandit stochastique stationnaire ?`, R`$X_t\sim\nu_{A_t}$ indépendamment du passé (stochastique), avec des lois $\nu_a$ qui ne changent pas dans le temps (stationnaire).`],
      ['bd-setting', 'hyp', R`Trois hypothèses du bandit stochastique ?`, R`On n’observe que le gain du bras tiré ; gains i.i.d. ; gains bornés.`],
      ['bd-regret', 'regret', R`Définition du regret espéré ?`, R`$R_n(\pi)=n\mu^*-\mathbb E_\pi[\sum_{t=1}^nX_t]$.`],
      ['bd-regret', 'decomp', R`Décomposition du regret ?`, R`$R_n=\sum_a\Delta_a\mathbb E[N_a(n)]$, avec $\Delta_a=\mu^*-\mu_a$ et $N_a(n)$ le nombre de tirages du bras $a$.`],
      ['bd-regret', 'sublin', R`Que veut-on pour $R_n/n$, et pourquoi ?`, R`$R_n/n\to0$ : le gain moyen par tour converge vers $\mu^*$, donc la stratégie finit par identifier le meilleur bras.`],
      ['bd-regret', 'Na-alea', R`Pourquoi $N_a(n)$ est-il aléatoire même pour une politique déterministe ?`, R`Parce que les choix dépendent des gains observés, qui sont aléatoires.`],
      ['bd-naive', 'pure-explo', R`Regret de l’exploration pure ?`, R`$\frac nK\sum_a\Delta_a$ : linéaire.`],
      ['bd-naive', 'ftl', R`Pourquoi Follow the Leader a-t-il un regret linéaire ?`, R`Il peut se bloquer sur un mauvais bras après un premier tirage malchanceux : regret $\approx(1-\mu_1)\mu_2(\mu_1-\mu_2)n$ dans le cas Bernoulli à 2 bras.`],
      ['bd-etc', 'algo', R`Algorithme Explore-Then-Commit ?`, R`Tirer $m$ fois chaque bras, puis jouer jusqu’au bout le meilleur bras empirique $\hat a=\arg\max\hat\mu_a(m)$.`],
      ['bd-etc', 'ENa', R`Borne sur $\mathbb E[N_a(n)]$ pour ETC ?`, R`$\mathbb E[N_a(n)]\le m+n\,e^{-m\Delta^2/2}$ (Hoeffding unilatéral sur $Z=Y_a-Y_1\in[-1,1]$).`],
      ['bd-etc', 'm-opt', R`Valeur optimale de $m$ pour ETC et regret obtenu ?`, R`$m=\frac2{\Delta^2}\log\frac{n\Delta^2}2$ ; regret logarithmique, pour 2 bras $R(n)\le\frac2\Delta(\log\frac{n\Delta^2}2+1)$.`],
      ['bd-etc', 'limite', R`Limite principale d’ETC et la parade ?`, R`Il faut connaître $\Delta$. ETC séquentiel : explorer jusqu’à ce que $|\hat\mu_1-\hat\mu_2|>\sqrt{4\log(n/t)/t}$, regret $\frac2\Delta\log n+C\sqrt{\log n}$.`],
      ['bd-lower', 'efficace', R`Définition d’un algorithme de bandit « efficace » ?`, R`Il a un regret sous-linéaire pour tout problème de bandit.`],
      ['bd-lower', 'lai', R`Théorème de Lai et Robbins ?`, R`Pour tout algorithme efficace et tout bras sous-optimal : $\liminf\frac{\mathbb E[N_a(n)]}{\log n}\ge\frac1{D_{KL}(\nu_a\|\nu^*)}$. Le regret est au moins logarithmique.`],
      ['bd-lower', 'kl-bern', R`Divergence KL entre deux Bernoulli ?`, R`$d(\mu_a;\mu_b)=\mu_a\log\frac{\mu_a}{\mu_b}+(1-\mu_a)\log\frac{1-\mu_a}{1-\mu_b}$.`],
      ['bd-lower', 'interp', R`Que dit intuitivement la borne de Lai-Robbins ?`, R`Plus deux bras se ressemblent (KL petite), plus il faut de tirages pour les distinguer.`],
      ['bd-egreedy', 'algo', R`ε-greedy ?`, R`Avec probabilité $1-\epsilon$, le meilleur bras empirique ; avec probabilité $\epsilon$, un bras uniforme parmi les $K$.`],
      ['bd-egreedy', 'regret', R`Regret de ε-greedy à ε fixe ?`, R`Linéaire : on explore une fraction $\epsilon$ du temps pour toujours. Un ε décroissant aide mais est difficile à régler.`],
      ['bd-ucb', 'principe', R`Principe d’optimisme face à l’incertitude ?`, R`Supposer l’environnement aussi favorable que possible : jouer le bras de plus grande borne supérieure de confiance.`],
      ['bd-ucb', 'ucb1', R`Indice UCB1 ?`, R`$\hat\mu_a(t)+\sqrt{\frac{2\log t}{N_a(t)}}$ : exploitation + bonus d’exploration.`],
      ['bd-ucb', 'tous', R`Pourquoi UCB finit-il par tirer tous les bras ?`, R`Pour un bras non tiré, $\hat\mu_a$ et $N_a$ restent fixes mais $\log t$ croît : son indice augmente jusqu’à devenir le plus grand.`],
      ['bd-ucb', 'union', R`Pourquoi la construction d’UCB passe-t-elle par une union bound ?`, R`$N_a(t)$ est aléatoire : on borne sur toutes ses valeurs possibles $s=1..t$, ce qui transforme $1/t^2$ en $1/t$.`],
      ['bd-ucb', 'regret', R`Regret d’UCB ?`, R`$\mathbb E[N_a(n)]=O(\log n/\Delta_a^2)$ pour tout bras sous-optimal, donc $\mathbb E[R(n)]=O(\log n)$.`],
      ['bd-ucb', 'preuve', R`Deux cas de « mauvais tirage » dans la preuve d’UCB ?`, R`(1) le meilleur bras est fortement sous-estimé (probabilité $<1/t^\alpha$) ; (2) le bras $a$ est surestimé, ce qui impose $N_a<2\alpha\log t/\Delta_a^2$.`],
      ['bd-thompson', 'post', R`Loi a posteriori d’un bras de Bernoulli avec a priori uniforme ?`, R`$\mathrm{Beta}(S_a+1,\ N_a-S_a+1)$ avec $S_a$ succès en $N_a$ tirages.`],
      ['bd-thompson', 'conj', R`Pourquoi dit-on que la Beta est conjuguée de la Bernoulli ?`, R`A priori Beta × vraisemblance Bernoulli = a posteriori Beta : une observation $x$ donne $\mathrm{Beta}(\alpha+x,\beta+1-x)$.`],
      ['bd-thompson', 'algo', R`Thompson sampling ?`, R`À chaque tour, tirer $\theta_a\sim\pi_a(t)$ pour chaque bras, jouer $\arg\max_a\theta_a$, mettre à jour l’a posteriori.`],
      ['bd-thompson', 'vs-ucb', R`Thompson vs UCB : différence de philosophie ?`, R`UCB joue le modèle le plus optimiste ; Thompson joue un modèle plausible tiré au hasard dans l’a posteriori. Thompson atteint la borne de Lai-Robbins (gains binaires).`],
      ['bd-bai', 'obj', R`Objectif de l’identification du meilleur bras ?`, R`$\mathbb P(\hat a_\tau=a^*)\ge1-\delta$ avec un nombre de tirages $\mathbb E[\tau]$ le plus petit possible.`],
      ['bd-bai', 'regles', R`Les trois règles d’un algorithme d’identification du meilleur bras ?`, R`Règle d’échantillonnage, règle d’arrêt, règle de recommandation.`],
      ['bd-bai', 'lucb', R`Critère d’arrêt de LUCB ?`, R`La borne inférieure du meilleur bras dépasse les bornes supérieures de tous les autres.`],
    ],

    quiz: [
      ['bd-setting', R`Dans un bandit, après avoir tiré le bras 2, l’agent observe :`, ['uniquement le gain du bras 2', 'les gains de tous les bras', 'les moyennes μa', 'le meilleur bras'], 0, R`Information partielle : c’est ce qui crée le dilemme exploration / exploitation.`],
      ['bd-setting', R`Un A/B test de deux bannières publicitaires, récompense = clic, est un bandit :`, ['stochastique à 2 bras de Bernoulli', 'à un seul bras', 'déterministe', 'à espace d’états continu'], 0, R`Chaque bannière a une probabilité de clic inconnue $\mu_a$.`],
      ['bd-setting', R`Pourquoi maximise-t-on $\mathbb E[S_n]$ et pas $S_n$ ?`, ['S_n est aléatoire : rejouer donnerait un autre résultat', 'S_n est toujours nul', 'E[S_n] est connu', 'pour simplifier les calculs seulement'], 0, R`On ne peut maximiser qu’une quantité déterministe : l’espérance.`],
      ['bd-egreedy', R`ε-greedy avec ε = 0,1 et 5 bras. Probabilité de tirer un bras sous-optimal donné ?`, ['0,02', '0,1', '0,08', '0,9'], 0, R`L’exploration choisit uniformément parmi les 5 bras : $0{,}1/5=0{,}02$.`],
      ['bd-egreedy', R`Pourquoi ε-greedy à ε fixe a-t-il un regret linéaire ?`, ['il explore une fraction ε du temps, pour toujours', 'il ne tire jamais le meilleur bras', 'il ne tire chaque bras qu’une fois', 'il dépend de Δ'], 0, R`À chaque tour, une perte moyenne d’au moins $\frac\epsilon K\sum_a\Delta_a$.`],
      ['bd-regret', R`Bras de moyennes 0,9 ; 0,8 ; 0,5. Lequel contribue le plus au regret par tirage ?`, ['celui à 0,5', 'celui à 0,8', 'celui à 0,9', 'tous pareil'], 0, R`$\Delta=0{,}4$ contre $0{,}1$ ; le meilleur bras ne contribue pas.`],
      ['bd-naive', R`Quelle stratégie a un regret sous-linéaire ?`, ['UCB', 'exploration pure', 'Follow the Leader', 'ε-greedy avec ε fixe'], 0, R`Les trois autres ont un regret linéaire.`],
      ['bd-etc', R`Pourquoi ETC classique est-il peu réaliste ?`, ['le m optimal dépend de Δ, inconnu', 'il ne tire jamais le meilleur bras', 'son regret est linéaire', 'il exige des gains gaussiens'], 0, R`$m=\frac2{\Delta^2}\log\frac{n\Delta^2}2$ demande de connaître l’écart.`],
      ['bd-lower', R`Le théorème de Lai-Robbins est :`, ['une borne inférieure asymptotique sur le regret', 'une borne supérieure du regret d’UCB', 'une inégalité de concentration', 'une loi a posteriori'], 0, R`Aucun algorithme efficace ne fait mieux que $\log n$ (avec la constante en KL).`],
      ['bd-ucb', R`Bras A : $\hat\mu=0{,}6$, $N=50$. Bras B : $\hat\mu=0{,}5$, $N=5$. $t=55$. UCB1 joue :`, ['B', 'A', 'indifférent', 'aucun'], 0, R`A : $0{,}6+\sqrt{2\ln55/50}\approx0{,}6+0{,}40=1{,}00$. B : $0{,}5+\sqrt{2\ln55/5}\approx0{,}5+1{,}27=1{,}77$. B est trop peu connu.`],
      ['bd-thompson', R`Un bras a donné 7 succès sur 10 tirages (a priori uniforme). Son a posteriori ?`, ['Beta(8, 4)', 'Beta(7, 3)', 'Beta(7, 10)', 'Beta(11, 8)'], 0, R`$\mathrm{Beta}(S+1,N-S+1)=\mathrm{Beta}(8,4)$.`],
      ['bd-thompson', R`D’où vient l’exploration dans Thompson sampling ?`, ['du tirage aléatoire dans les a posteriori', 'd’un bonus en √(log t / N)', 'd’un paramètre ε', 'd’une phase d’exploration initiale'], 0, R`Un bras incertain (a posteriori plate) peut tirer un grand $\theta_a$.`],
      ['bd-bai', R`Dans l’identification du meilleur bras, on cherche avant tout à :`, ['trouver a* avec confiance 1 − δ en peu de tirages', 'maximiser le gain cumulé', 'minimiser le regret', 'tirer chaque bras autant de fois'], 0, R`L’objectif n’est plus le gain pendant l’expérience.`],
    ],

    gens: {
      'bd-regret': [
        () => {
          const mus = [0.9, pick([0.8, 0.7]), pick([0.6, 0.5, 0.4])], Ns = [rnd(500, 900), rnd(20, 80), rnd(5, 30)];
          const r = mus.reduce((s, m, i) => s + (mus[0] - m) * Ns[i], 0);
          return { q: R`Moyennes $\mu=(${mus.map(m => f(m, 1)).join(' ; ')})$, nombres moyens de tirages $\mathbb E[N_a]=(${Ns.join(' ; ')})$. Regret espéré ?`, a: r, tol: 0.05,
            expl: R`$R_n=\sum_a\Delta_a\mathbb E[N_a]=0\times${Ns[0]}+${f(mus[0] - mus[1], 1)}\times${Ns[1]}+${f(mus[0] - mus[2], 1)}\times${Ns[2]}=${f(r, 1)}$.` };
        },
      ],
      'bd-ucb': [
        () => {
          const t = rnd(50, 500), a = { m: pick([0.55, 0.6, 0.65, 0.7]), n: rnd(20, Math.floor(t * 0.7)) };
          const b = { m: pick([0.4, 0.45, 0.5]), n: rnd(3, 25) };
          const ia = a.m + Math.sqrt(2 * Math.log(t) / a.n), ib = b.m + Math.sqrt(2 * Math.log(t) / b.n);
          return { q: R`$t=${t}$. Bras A : $\hat\mu=${f(a.m, 2)}$, $N=${a.n}$. Bras B : $\hat\mu=${f(b.m, 2)}$, $N=${b.n}$. Indice UCB1 du bras que l’algorithme joue ? (2 décimales)`, a: Math.max(ia, ib), tol: 0.01,
            expl: R`A : $${f(a.m, 2)}+\sqrt{2\ln${t}/${a.n}}=${f(ia, 2)}$ ; B : $${f(b.m, 2)}+\sqrt{2\ln${t}/${b.n}}=${f(ib, 2)}$. UCB joue ${ia >= ib ? 'A' : 'B'}.` };
        },
      ],
      'bd-etc': [
        () => {
          const d = pick([0.1, 0.2, 0.3]), n = pick([1000, 10000, 100000]);
          const m = 2 / (d * d) * Math.log(n * d * d / 2);
          return { q: R`ETC à 2 bras, $\Delta=${f(d, 1)}$, horizon $n=${n}$. Durée d’exploration optimale $m=\frac2{\Delta^2}\log\frac{n\Delta^2}2$ ? (arrondi à l’unité)`, a: m, tol: 1,
            expl: R`$\frac2{${f(d * d, 2)}}\ln(${f(n * d * d / 2, 1)})\approx${f(m, 0)}$ tirages par bras.` };
        },
      ],
      'bd-thompson': [
        () => {
          const N = rnd(5, 40), S = rnd(0, N);
          return { q: R`A priori uniforme, ${S} succès en ${N} tirages. Moyenne de l’a posteriori $\mathrm{Beta}(\alpha,\beta)$, soit $\frac{\alpha}{\alpha+\beta}$ ? (3 décimales)`, a: (S + 1) / (N + 2), tol: 0.001,
            expl: R`$\mathrm{Beta}(${S + 1},${N - S + 1})$, moyenne $\frac{${S + 1}}{${N + 2}}=${f((S + 1) / (N + 2))}$ (règle de succession de Laplace).` };
        },
      ],
      'bd-lower': [
        () => {
          const a = pick([0.3, 0.4, 0.5]), b = pick([0.6, 0.7, 0.8]);
          const d = a * Math.log(a / b) + (1 - a) * Math.log((1 - a) / (1 - b));
          return { q: R`KL entre Bernoulli : $d(${f(a, 1)};${f(b, 1)})$ en nats ? (3 décimales)`, a: d, tol: 0.002,
            expl: R`$${f(a, 1)}\ln\frac{${f(a, 1)}}{${f(b, 1)}}+${f(1 - a, 1)}\ln\frac{${f(1 - a, 1)}}{${f(1 - b, 1)}}=${f(d)}$. Lai-Robbins : au moins $\log n/${f(d)}$ tirages du mauvais bras.` };
        },
      ],
    },
  });
})();
