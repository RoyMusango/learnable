// Chapitre : Bandit problems I (X. Siebert, slides bandits_en_V2, 98 slides).
// Les exemples chiffrés construits pour l'exercice (stratégies de relance, tests A/B) sont présentés comme tels : aucune donnée réelle.
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
<p><b>L’idée.</b> On doit choisir, encore et encore, entre plusieurs options dont on ne connaît pas le rendement, et on n’observe que le résultat de l’option choisie. Chaque choix sert donc à la fois à <b>gagner</b> et à <b>s’informer</b> : c’est le dilemme <b>exploitation</b> (jouer le meilleur bras trouvé jusqu’ici) contre <b>exploration</b> (essayer un autre bras qui pourrait être meilleur).</p>
<h4>1. Du bandit manchot au bandit à K bras (slides 3 à 9)</h4>
<p>Le <b>bandit manchot</b> (<i>one-armed bandit</i>) est la machine à sous ; avec une seule machine, la seule question est de savoir quand arrêter de jouer (slide 3). Avec <b>K machines</b>, chacune a sa propre loi de gains : c’est le <b>bandit à K bras</b> (slide 4). Il faut une stratégie pour choisir le bras, en sachant que même une stratégie habile ne devine pas le meilleur bras tout de suite (slide 5).</p>
<p>Le concept vient des <b>essais cliniques</b> (Thompson, 1933) ; le surnom apparaît dans les années 1950 (Bush et Mosteller, 1953), où une souris dans un labyrinthe en T est un bandit à 2 bras (slide 6). Le bandit est le <b>prototype de l’apprentissage par renforcement</b> : un seul état (les choix disponibles et les gains futurs ne dépendent pas du choix présent) et aucune planification (une action à la fois).</p>
<p><b>Essai clinique</b> (slide 7) : 1000 patients, deux traitements A et B. La solution naïve traite 500 patients avec A, 500 avec B, puis compare les efficacités moyennes. Si l’un des traitements est mortel, 500 personnes en meurent. Mieux : choisir séquentiellement entre A et B et adapter le choix avec un algorithme de bandit.</p>
<p>Autres applications (slides 8 et 9) : publicité en ligne (A/B testing, gain = clic), optimisation d’une fonction dont chaque point coûte cher (expérience industrielle), IA pour les jeux (AlphaGo, Monte-Carlo Tree Search : quelle partie évaluer ensuite), routage réseau (quel canal radio parmi K, selon la qualité des communications passées), systèmes de recommandation, et plus généralement l’allocation séquentielle de ressources en environnement incertain.</p>
<h4>2. Le formalisme, symbole par symbole (slides 10 à 18)</h4>
<div class="def"><b>Problème de bandit</b> : un jeu séquentiel entre un <b>agent</b> qui apprend et son <b>environnement</b> $E$. L’agent effectue $n$ actions au total ; $n$ est l’<b>horizon</b>, parfois fixé, souvent inconnu. À chaque instant $t\le n$, l’agent choisit une action $A_t$ (un bras) et l’environnement révèle un gain $X_t\in\mathbb R$.</div>
<table><tr><th>Symbole</th><th>Se lit</th><th>Sens</th></tr>
<tr><td>$K$</td><td>« K »</td><td>le nombre de bras</td></tr>
<tr><td>$A_t\in\{1,\dots,K\}$</td><td>« A indice t »</td><td>le bras tiré à l’instant $t$</td></tr>
<tr><td>$X_t$</td><td>« X indice t »</td><td>le gain observé à l’instant $t$ (celui du bras $A_t$ seulement)</td></tr>
<tr><td>$H_t=\{A_1,X_1,\dots,A_t,X_t\}$</td><td>« historique au temps t »</td><td>tout ce que l’agent a fait et vu jusqu’à $t$</td></tr>
<tr><td>$\pi:H_t\mapsto A_{t+1}$</td><td>« politique pi »</td><td>la règle qui choisit le prochain bras à partir de l’historique</td></tr>
<tr><td>$\nu_a$</td><td>« nu indice a »</td><td>la loi (inconnue) des gains du bras $a$</td></tr>
<tr><td>$\mu_a$</td><td>« mu indice a »</td><td>le gain moyen théorique du bras $a$</td></tr>
<tr><td>$\mu^*$, $a^*$</td><td>« mu étoile », « a étoile »</td><td>le meilleur gain moyen et le bras qui l’atteint</td></tr>
<tr><td>$S_n=\sum_{t=1}^nX_t$</td><td>« S indice n »</td><td>le gain cumulé après $n$ tirages</td></tr></table>
<p>La <b>politique</b> (ou stratégie séquentielle) est une application des historiques vers les actions : $A_{t+1}=F_t(A_1,X_1,\dots,A_t,X_t)$ (slides 11 et 17). L’agent cherche une stratégie optimale pour un objectif : le plus souvent maximiser les gains, parfois identifier le meilleur bras (dernière section). Symétriquement, l’environnement est une application des historiques (terminés par une action) vers les gains, inconnue de l’agent (slide 12).</p>
<div class="def"><b>Bandit stochastique</b> (slide 13) : l’environnement donne à l’instant $t$ un gain $X_t$ qui suit une loi $\nu_{A_t}$ propre au bras joué, <b>indépendamment</b> des actions et gains précédents : $X_t\sim\nu_{A_t}$ (i.i.d.).<br>
<b>Stationnaire</b> : les lois $\nu_a$ ne changent pas avec le temps. Elles sont a priori inconnues de l’agent.</div>
<div class="def"><b>Gain moyen</b> (slide 14) : $\mu_a=\int t\,d\nu_a(t)$, l’espérance de la loi $\nu_a$ (si l’intégrale existe). <b>Gain maximal</b> : $\mu^*=\max_a\mu_a$, atteint par le <b>meilleur bras</b> $a^*=\arg\max_a\mu_a$. Ces définitions sont théoriques : elles supposent les lois connues.</div>
<p><b>Hypothèses</b> (slide 15) : (1) l’algorithme n’observe que le gain du bras choisi, pas celui des autres ; (2) les gains de chaque bras sont i.i.d. ; (3) les gains sont bornés.</p>
<p><b>Casino de Bernoulli</b> (slide 16) : le bras $a$ suit la loi de Bernoulli $\mathcal B(\mu_a)$, gain 1 avec probabilité $\mathbb P(X_t=1\mid A_t=a)=\mu_a$, gain 0 avec probabilité $1-\mu_a$. Ici $\mu_a$ est à la fois le paramètre et la moyenne du bras. C’est l’exemple de tout le chapitre.</p>
<p><b>Que maximiser ?</b> (slide 18) $S_n$ est une variable aléatoire : rejouer avec les mêmes bras donnerait un autre résultat. On maximise donc son <b>espérance</b> $\mathbb E[S_n]=\mathbb E\big[\sum_{t=1}^nX_t\big]$.</p>
<h4>3. Exemple calculé</h4>
<p>Prenons (valeurs construites pour l’exercice) trois stratégies de relance d’un client en retard de paiement : bras 1 = appel, bras 2 = SMS, bras 3 = courrier. Gain $X_t=1$ si le client paie dans les 30 jours, 0 sinon. Supposons $\mu=(0{,}30\,;\,0{,}25\,;\,0{,}10)$, inconnu de l’agent.</p>
<ol><li>$\mu^*=\max(0{,}30\,;0{,}25\,;0{,}10)=0{,}30$ et $a^*=1$.</li>
<li>Historique après deux relances : SMS sans paiement, puis appel avec paiement : $H_2=\{A_1=2,X_1=0,A_2=1,X_2=1\}$. Une politique choisit $A_3$ à partir de ce seul $H_2$.</li>
<li>Si l’on relance 1000 clients toujours par SMS : $\mathbb E[S_{1000}]=1000\times0{,}25=250$, contre $300$ en appelant toujours. Une politique qui appelle 900 fois, envoie 70 SMS et 30 courriers (en moyenne) : $\mathbb E[S_{1000}]=0{,}30\times900+0{,}25\times70+0{,}10\times30=290{,}5$.</li></ol>
<h4>4. Pièges</h4>
<ul><li>$\mu_a$ n’est jamais observé : on observe des gains $X_t$, et l’on calcule une moyenne empirique $\hat\mu_a$ (chapeau = estimé à partir des données).</li>
<li>On ne voit <b>que</b> le gain du bras joué : on ne sait pas ce qu’aurait donné un appel au client à qui l’on a envoyé un SMS. C’est ce qui sépare le bandit de l’apprentissage supervisé.</li>
<li>La stationnarité est une hypothèse forte : un taux de recouvrement change avec la conjoncture. Le cours traite le cas stationnaire seulement.</li></ul>
<p><b>Lien finance.</b> Un test A/B d’offres (deux courriers, deux parcours d’ouverture de compte) ou le choix d’une stratégie de relance se modélise comme un bandit de Bernoulli : chaque client est un tirage, et le budget de clients disponible est l’horizon $n$.</p>
<p><b>À retenir</b></p>
<ul><li>K bras de lois inconnues ; on n’observe que le gain du bras tiré.</li>
<li>Une politique associe à l’historique $H_t$ le prochain bras $A_{t+1}$.</li>
<li>Bandit stochastique stationnaire : $X_t\sim\nu_{A_t}$ i.i.d., lois fixes dans le temps, gains bornés.</li>
<li>$S_n$ est aléatoire : on maximise $\mathbb E[S_n]$.</li></ul>`,
      },
      {
        id: 'bd-regret', title: 'Le regret et sa décomposition', slides: '19-29',
        summary: 'Rn = nμ* − E[ΣXt] = Σa Δa E[Na(n)]. Un bon algorithme tire rarement les bras de grand écart Δa. On veut Rn/n → 0.',
        fiche: R`
<p><b>L’idée.</b> Même un agent qui finit par trouver le meilleur bras gagne moins que s’il l’avait connu dès le départ. Le <b>regret</b> mesure ce manque à gagner, et il se ramène à une question simple : combien de fois a-t-on tiré chaque mauvais bras, et combien coûte chaque tirage.</p>
<h4>1. Définitions (slides 19 à 22)</h4>
<p>Définition générale (slide 19) : le regret est la différence entre le gain de la stratégie optimale et le gain obtenu avec la stratégie courante. Le cours mentionne plusieurs variantes (regret instantané, moyen, dans le pire cas) ; on s’en sert pour concevoir les algorithmes.</p>
<div class="def"><b>Regret instantané</b> (slide 20) : $\Delta_a=\mu^*-\mu_a\ge0$, l’écart entre la meilleure moyenne et celle du bras $a$. C’est la « pénalité » pour ne pas avoir tiré le meilleur bras : $\Delta_a>0$ si $a$ n’est pas le meilleur, $\Delta_{a^*}=0$. On l’appelle aussi <b>écart de sous-optimalité</b> (<i>suboptimality gap</i>, <i>action gap</i>).</div>
<div class="def"><b>Regret espéré</b> (slide 21) de la stratégie $\pi$ après $n$ tirages :
$$R_n(\pi)=n\mu^*-\mathbb E_\pi\Big[\sum_{t=1}^nX_t\Big].$$
En mots : ce qu’aurait rapporté en moyenne le meilleur bras joué $n$ fois, moins ce que rapporte en moyenne la stratégie. On écrit souvent $R_n$ et $\mathbb E$.</div>
<p><b>Croissance</b> (slide 22) : $R_n$ est une fonction croissante de $n$ (chaque tour ajoute un manque à gagner moyen $\mu^*-\mu_{A_t}\ge0$). La question est sa vitesse. On regarde $\frac{R_n}n=\mu^*-\frac{\mathbb E[\sum_{t=1}^nX_t]}n$, l’écart entre le meilleur gain moyen et le gain moyen par tour. On veut que la stratégie finisse par identifier le meilleur bras, donc
$$\lim_{n\to\infty}\frac{R_n}n=0\qquad\text{(regret <b>sous-linéaire</b>)}.$$
Un regret linéaire $R_n\approx cn$ signifie qu’on perd une fraction fixe $c$ à chaque tour, pour toujours.</p>
<p><b>Illustration</b> (slide 23) : le gain instantané moyen de l’algorithme (courbe) monte vers la ligne pointillée $\mu^*$ (meilleure action inconnue) ; le regret cumulé est l’aire entre les deux.</p>
<div class="def"><b>Regret optimal</b> (slide 24) : $R^*=\min_\pi\mathbb E[R_n(\pi)]=\min_\pi\sum_{t=1}^n\big(\mu^*-\mu_{\pi(t)}\big)$, où $\pi(t)$ est la décision au temps $t$ et $\pi^*(t)$ la décision optimale.</div>
<p>Lecture : si le minimum portait sur toutes les suites de décisions, y compris « toujours $a^*$ », il vaudrait 0 ; il n’a de sens que pour des stratégies qui ignorent les lois et doivent apprendre. À confirmer avec le Prof. Siebert (slide 24).</p>
<h4>2. La décomposition du regret (slides 25 à 29)</h4>
<div class="def"><b>Indicatrice</b> (slide 26) : $\mathbb 1\{A_t=a\}$ vaut 1 si le bras $a$ est choisi au temps $t$, 0 sinon. Pour un événement $A$, $\mathbb E[\mathbb 1\{A\}]=\mathbb P[A]$.<br>
<b>Nombre de tirages</b> du bras $a$ après $n$ tours : $N_a(n)=\sum_{t=1}^n\mathbb 1\{A_t=a\}$.</div>
<div class="thm"><b>Lemme (décomposition du regret).</b>
$$R_n=\sum_{a=1}^K\Delta_a\,\mathbb E[N_a(n)].$$
On réécrit le regret par bras (la contribution de chaque bras) au lieu de l’écrire par instant.</div>
<p><b>Preuve</b> (à savoir refaire, slides 27 à 29).</p>
<ol><li>À chaque instant l’agent tire exactement un bras : $\sum_{a=1}^K\mathbb 1\{A_t=a\}=1$. Donc $S_n=\sum_{t=1}^nX_t=\sum_{t=1}^n\sum_{a=1}^KX_t\,\mathbb 1\{A_t=a\}$ et, par linéarité, $\mathbb E[S_n]=\sum_a\sum_t\mathbb E[X_t\mathbb 1\{A_t=a\}]$.</li>
<li>De même $n\mu^*=\sum_{t=1}^n\mu^*=\sum_a\sum_t\mathbb E[\mu^*\mathbb 1\{A_t=a\}]$.</li>
<li>En soustrayant : $R_n=n\mu^*-\mathbb E[S_n]=\sum_a\sum_t\mathbb E\big[(\mu^*-X_t)\mathbb 1\{A_t=a\}\big]$.</li>
<li>Sachant $A_t$, le gain moyen du tour est $\mu_{A_t}$ : $\mathbb E[(\mu^*-X_t)\mathbb 1\{A_t=a\}\mid A_t]=\mathbb 1\{A_t=a\}(\mu^*-\mu_{A_t})=\mathbb 1\{A_t=a\}\Delta_a$.</li>
<li>On prend l’espérance et on somme sur $t$ : $\sum_t\mathbb E[\mathbb 1\{A_t=a\}]\Delta_a=\Delta_a\mathbb E[N_a(n)]$.</li></ol>
<p>$N_a(n)$ est une <b>variable aléatoire</b>, même si la stratégie est déterministe, car $A_t$ dépend des gains observés, qui sont aléatoires ; $\Delta_a$, lui, est un nombre fixe. Le meilleur bras ne contribue pas au regret. Message (slide 25) : un agent doit tirer <b>moins souvent</b> les bras de grand $\Delta_a$, tout en essayant assez les bras peu tirés (exploration) et en faisant confiance au bras jugé optimal (exploitation).</p>
<h4>3. Exemple calculé</h4>
<p>Reprenons les trois stratégies de relance, $\mu=(0{,}30\,;\,0{,}25\,;\,0{,}10)$, $n=1000$, et une politique qui tire en moyenne $\mathbb E[N]=(900\,;\,70\,;\,30)$.</p>
<ol><li>Écarts : $\Delta_1=0$, $\Delta_2=0{,}30-0{,}25=0{,}05$, $\Delta_3=0{,}30-0{,}10=0{,}20$.</li>
<li>Décomposition : $R_{1000}=0\times900+0{,}05\times70+0{,}20\times30=3{,}5+6=9{,}5$.</li>
<li>Vérification par la définition : $n\mu^*=300$, $\mathbb E[S_n]=290{,}5$, donc $R_{1000}=9{,}5$.</li>
<li>Par tour : $R_n/n=0{,}0095$, soit environ un paiement perdu tous les 105 clients.</li></ol>
<p>Le bras 3, tiré moins souvent que le bras 2 (30 contre 70), coûte pourtant plus (6 contre 3,5), parce que son écart est quatre fois plus grand.</p>
<h4>4. Pièges</h4>
<ul><li>Ne pas confondre $\Delta_a=\mu^*-\mu_a$ (fixe) et $\mu^*-X_t$ (aléatoire, parfois négatif quand un mauvais bras a de la chance).</li>
<li>$R_n$ est un regret <b>espéré</b> : sur une exécution donnée, le manque à gagner réalisé varie.</li>
<li>Multiplier par $\mu_a$ au lieu de $\Delta_a$ donne le gain des mauvais bras, pas le regret.</li></ul>
<p><b>Lien finance.</b> Dans un test A/B d’offres, le regret compte les conversions perdues en envoyant des clients vers la moins bonne variante pendant le test ; la décomposition dit que ce coût est (nombre de clients envoyés sur la variante) × (écart de taux de conversion).</p>
<p><b>À retenir</b></p>
<ul><li>$\Delta_a=\mu^*-\mu_a$ : coût moyen d’un tirage du bras $a$.</li>
<li>$R_n=n\mu^*-\mathbb E[S_n]=\sum_a\Delta_a\mathbb E[N_a(n)]$.</li>
<li>On veut $R_n/n\to0$ ; les bons algorithmes atteignent $R_n=O(\log n)$.</li>
<li>Preuve : $\sum_a\mathbb 1\{A_t=a\}=1$, linéarité, conditionnement sur $A_t$.</li></ul>`,
      },
      {
        id: 'bd-naive', title: 'Stratégies élémentaires : exploration pure, exploitation pure', slides: '31-35',
        summary: 'Exploration uniforme : regret linéaire (n/K)ΣΔa. Follow the Leader : excellent ou catastrophique, regret linéaire aussi.',
        fiche: R`
<p><b>L’idée.</b> Les deux extrêmes échouent : n’explorer que gaspille des tirages sur les mauvais bras pour toujours, n’exploiter que peut s’enfermer sur un mauvais bras après un départ malchanceux. Les deux donnent un regret <b>linéaire</b>.</p>
<p>Cadre (slide 31) : casino de Bernoulli ; objectif : apprendre la stratégie optimale en perdant le moins possible en chemin. Stratégies étudiées dans le chapitre : exploration pure, exploitation pure, Explore-Then-Commit, ε-greedy, UCB. Convention : le meilleur bras est le bras 1 et les autres sont triés, $\mu^*=\mu_1\ge\mu_2\ge\dots\ge\mu_K$ (sans perte de généralité, puisque l’agent ne le sait pas). Le bras 1 ne contribue pas au regret.</p>
<h4>1. Exploration pure (slide 32)</h4>
<div class="def">Connaissant le budget $n$, tirer chaque bras $n/K$ fois (si $n/K$ n’est pas entier, les derniers bras sont choisis au hasard). Alors $\mathbb E[N_a(n)]=n/K$ pour tout $a$ et
$$R_n=\sum_{a=1}^K\Delta_a\,\frac nK=\frac nK\sum_{a=2}^K\Delta_a.$$</div>
<p>Le regret est <b>linéaire</b> en $n$ : $R_n/n=\frac1K\sum_a\Delta_a$ ne tend pas vers 0, le gain moyen par tour ne converge pas vers $\mu^*$.</p>
<h4>2. Exploitation pure, « Follow the Leader » (slides 33 à 35)</h4>
<div class="def">Tirer chaque bras au moins une fois, puis toujours faire confiance au meilleur empirique, le « leader » : $A_{t+1}=\arg\max_a\hat\mu_a(t)$, avec
$$\hat\mu_a(t)=\frac{\text{somme des gains du bras }a}{\text{nombre de tirages du bras }a}=\frac1{N_a(t)}\sum_{s=1}^{N_a(t)}Y_a(s),$$
où $Y_a(s)$ est le gain de la $s$-ième observation du bras $a$. $\hat\mu_a(t)$ estime la moyenne inconnue $\mu_a$ ; $N_a(t)$ est aléatoire.</div>
<p>Excellent si le premier tirage a désigné le bon bras, très mauvais sinon. <b>Pire cas</b> (Bernoulli, 2 bras) : (1) le premier tirage du bras 1 donne 0, probabilité $\mathbb P(X_t=0\mid A_t=1)=1-\mu_1$ ; (2) le premier tirage du bras 2 donne 1, probabilité $\mu_2$. Alors $\hat\mu_1=0$ et $\hat\mu_2=1$ : le bras 2 devient leader, et il le reste <b>pour toujours</b>, car $\hat\mu_1$ n’est plus jamais mis à jour (il reste à 0) alors que $\hat\mu_2\ge1/N_2>0$ (il contient au moins le succès initial). On tire donc le bras 2 de l’ordre de $n$ fois, et ce scénario seul contribue au regret pour</p>
$$R(n)\approx(1-\mu_1)\times\mu_2\times(\mu_1-\mu_2)\,n.$$
<p>La slide 34 (et la slide 35) écrit $(\mu_2-\mu_1)\,n$, négatif puisque le bras 1 est le meilleur : il s’agit vraisemblablement d’une inversion, le facteur à retenir est l’écart $\Delta=\mu_1-\mu_2>0$. À confirmer avec le Prof. Siebert (slides 34 et 35).</p>
<p>La simulation du cours (slide 35, source Csaba Szepesvári) montre un regret espéré qui croît en ligne droite avec $n$ : la stratégie n’est pas efficace.</p>
<h4>3. Exemples calculés</h4>
<p>Prenons deux bras, $\mu_1=0{,}6$, $\mu_2=0{,}5$, $n=1000$.</p>
<ul><li><b>Exploration pure</b> : $R_{1000}=\frac{1000}2\times0{,}1=50$.</li>
<li><b>Follow the Leader</b>, contribution du pire cas : probabilité $(1-0{,}6)\times0{,}5=0{,}2$ de s’enfermer, coût $0{,}1$ par tour, donc $0{,}2\times0{,}1\times1000=20$. Avec $n=10\,000$ : 200, toujours proportionnel à $n$.</li>
<li>Trois bras $\mu=(0{,}30\,;0{,}25\,;0{,}10)$, exploration pure sur $n=1000$ : $R=\frac{1000}3(0{,}05+0{,}20)\approx83{,}3$.</li></ul>
<h4>4. Pièges</h4>
<ul><li>Follow the Leader n’est pas toujours mauvais : il réussit souvent. Son regret <b>espéré</b> est linéaire parce qu’il existe une probabilité <b>fixe</b> (indépendante de $n$) de s’enfermer.</li>
<li>Le regret de l’exploration pure ne dépend pas de la chance : il est exactement $\frac nK\sum\Delta_a$.</li>
<li>Le signe : un regret est toujours $\ge0$ ; un facteur $\mu_2-\mu_1$ négatif signale une inversion.</li></ul>
<p><b>Lien finance.</b> Choisir une stratégie de relance après un seul essai de chacune, puis l’appliquer à tout le portefeuille, c’est Follow the Leader ; répartir les clients à parts égales entre stratégies pendant toute l’année, c’est l’exploration pure.</p>
<p><b>À retenir</b></p>
<ul><li>Exploration pure : $R_n=\frac nK\sum_a\Delta_a$, linéaire.</li>
<li>Follow the Leader : $A_{t+1}=\arg\max_a\hat\mu_a(t)$ ; un premier tirage malchanceux l’enferme sur un mauvais bras.</li>
<li>Pire cas Bernoulli : regret $\approx(1-\mu_1)\mu_2(\mu_1-\mu_2)n$, linéaire.</li>
<li>Il faut doser l’exploration : c’est l’objet des stratégies suivantes.</li></ul>`,
      },
      {
        id: 'bd-etc', title: 'Explore-Then-Commit (ETC)', slides: '37-49',
        summary: 'Tirer m fois chaque bras puis s’engager sur le meilleur. Hoeffding : E[Na] ≤ m + n e^{−mΔ²/2}. m optimal → regret logarithmique, mais il faut connaître Δ ; version séquentielle sans Δ.',
        fiche: R`
<p><b>L’idée.</b> Explorer d’abord, uniformément, pendant une phase de longueur fixée, puis s’engager définitivement sur le bras qui a le mieux réussi. Tout repose sur le choix de la longueur $m$ : trop court, on s’engage sur le mauvais bras ; trop long, on gaspille des tirages.</p>
<div class="def"><b>Algorithme efficace</b> (slide 37) : algorithme dont le regret est <b>sous-linéaire pour tout</b> problème de bandit. On espère $R_n=O(\sqrt n)$, voire $R_n=O(\ln n)$, et l’on s’attend à de moins bonnes performances quand l’environnement est grand (beaucoup de bras).</div>
<h4>1. L’algorithme (slide 38)</h4>
<ol><li><b>Exploration</b> : tirer chacun des $K$ bras $m$ fois ($m\le n/K$).</li>
<li><b>Engagement</b> (<i>commit</i>) : $\hat a=\arg\max_a\hat\mu_a(m)$, le meilleur bras empirique après exploration, puis $A_{t+1}=\hat a$ pour tout $t\ge Km$.</li></ol>
<h4>2. Calcul du regret (slides 39 à 45, à savoir refaire)</h4>
<ol><li><b>Compter les tirages.</b> Chaque bras est tiré $m$ fois ; le bras $\hat a$ est tiré encore $n-Km$ fois. Donc $N_a(n)=m+(n-Km)\mathbb 1\{\hat a=a\}\le m+n\,\mathbb 1\{\hat a=a\}$.</li>
<li><b>Quand $\hat a=a$ ?</b> Si la moyenne du bras $a$ dépasse celle du bras 1 après exploration : $N_a(n)\le m+n\,\mathbb 1\{\hat\mu_a(m)\ge\hat\mu_1(m)\}$, et comme $\mathbb E[\mathbb 1\{A\}]=\mathbb P[A]$ :
$$\mathbb E[N_a(n)]\le m+n\,\mathbb P\big[\hat\mu_a(m)\ge\hat\mu_1(m)\big].$$</li>
<li><b>Se ramener à une moyenne.</b> Avec $Z(s)=Y_a(s)-Y_1(s)$, l’événement s’écrit $\frac1m\sum_{s=1}^mZ(s)\ge0$. Or $\mathbb E[Z(s)]=\mu_a-\mu_1<0$ : la moyenne des $Z$ tend vers une valeur négative, l’événement est donc peu probable pour $m$ grand. Pour le quantifier à $m$ fini, on utilise une inégalité de concentration.</li>
<li><b>Hoeffding</b> (rappel du cours SLT, slide 42) : pour $X_i$ i.i.d. à valeurs dans $[0,1]$ de moyenne $\mu$, $\mathbb P[|\hat\mu_n-\mu|>\epsilon]\le2e^{-2n\epsilon^2}$, sans hypothèse sur la loi. Version unilatérale (slide 43) : si $Z_i\in[-1,1]$ sont i.i.d. de moyenne $\mu$ et $x>\mu$,
$$\mathbb P\Big[\frac1m\sum_{i=1}^mZ_i\ge x\Big]\le e^{-\frac{(x-\mu)^2m}2}.$$
Le $/2$ dans l’exposant vient de la largeur 2 de l’intervalle $[-1,1]$ (la forme générale de Hoeffding divise par le carré de la largeur, ici 4, et multiplie par 2).</li>
<li><b>Appliquer</b> avec $x=0$ et $\mu=\mu_a-\mu_1$ : $\mathbb P[\frac1m\sum Z(s)\ge0]\le e^{-\frac{(\mu_a-\mu_1)^2m}2}$. La slide 43 écrit $\mu=\mu_1-\mu_a$ ; la moyenne de $Z$ est $\mu_a-\mu_1<0$ (slide 40), ce qui ne change rien au résultat puisque l’écart est élevé au carré. À confirmer avec le Prof. Siebert (slide 43).</li>
<li><b>Simplifier</b> (slide 44) avec le plus petit écart $\Delta=\mu_1-\mu_2\le\mu_1-\mu_a$ : $e^{-(\mu_a-\mu_1)^2m/2}\le e^{-\Delta^2m/2}$, d’où
$$\mathbb E[N_a(n)]\le m+n\,e^{-\frac{\Delta^2m}2},\qquad R(n)\le\sum_{a=2}^K(\mu_1-\mu_a)\Big[m+n\,e^{-\frac{\Delta^2m}2}\Big].$$</li>
<li><b>Choisir $m$</b> (slide 45) en annulant $\partial R/\partial m$ : $1-\frac{n\Delta^2}2e^{-\Delta^2m/2}=0$, soit $e^{-\Delta^2m/2}=\frac2{n\Delta^2}$ et
$$m^*=\frac2{\Delta^2}\log\frac{n\Delta^2}2.$$
En ce point $n\,e^{-\Delta^2m^*/2}=\frac2{\Delta^2}$, et le regret vaut au plus
$$R(n)\le\frac{2\sum_{a=2}^K(\mu_1-\mu_a)}{\Delta^2}\Big[\log\frac{n\Delta^2}2+1\Big].$$</li></ol>
<p>La croissance est <b>logarithmique</b> en $n$. Cas de 2 bras (slide 46) : $R(n)\le\frac2\Delta\big[\log\frac{n\Delta^2}2+1\big]$. Ici $\log$ est le logarithme népérien. Mais ce choix de $m$ suppose qu’on <b>connaît $\Delta=\mu_1-\mu_2$</b> à l’avance, ce qui n’est pas réaliste.</p>
<h4>3. Exemple calculé</h4>
<p>Prenons 2 bras, $\mu_1=0{,}6$, $\mu_2=0{,}5$ (donc $\Delta=0{,}1$), $n=10\,000$.</p>
<ol><li>$\frac{n\Delta^2}2=\frac{10\,000\times0{,}01}2=50$, $\ln50\approx3{,}912$.</li>
<li>$m^*=\frac2{0{,}01}\times3{,}912\approx782$ tirages par bras (bien sous $n/K=5000$).</li>
<li>Probabilité de s’engager sur le mauvais bras : $\le e^{-\Delta^2m^*/2}=\frac2{n\Delta^2}=0{,}02$.</li>
<li>$\mathbb E[N_2(n)]\le782{,}4+10\,000\times0{,}02=982{,}4$, et $R(n)\le0{,}1\times982{,}4\approx98{,}2$.</li>
<li>Comparaison : exploration pure $\frac{10\,000}2\times0{,}1=500$ ; Follow the Leader, pire cas seul : $0{,}4\times0{,}5\times0{,}1\times10\,000=200$.</li></ol>
<p><b>Hoeffding appliqué à un seul bras</b> : un bras de moyenne $\mu=0{,}6$ tiré $s=50$ fois. Probabilité que sa moyenne observée tombe à $0{,}5$ ou moins : $\mathbb P[\hat\mu(50)\le0{,}5]\le e^{-2\times50\times0{,}1^2}=e^{-1}\approx0{,}37$. La borne est lâche à 50 tirages ; elle décroît exponentiellement avec $s$.</p>
<h4>4. ETC séquentiel (slides 47 à 49)</h4>
<div class="def">Explorer uniformément (2 bras) jusqu’au premier instant où l’écart observé est assez grand :
$$\tau=\inf\Big\{t\in\mathbb N:\ |\hat\mu_1(t)-\hat\mu_2(t)|>\sqrt{\tfrac{4\log(n/t)}t}\Big\},$$
puis s’engager sur $\hat a=\arg\max_{a\in\{1,2\}}\hat\mu_a(\tau)$ et le garder jusqu’au bout ($A_{t+1}=\hat a$ pour $t\ge\tau$).</div>
<p>La slide 48 montre $\hat\mu_1(t)-\hat\mu_2(t)$ en fonction de $t$ entre deux courbes $\pm\sqrt{4\log(n/t)/t}$ qui se resserrent ; l’exploration s’arrête quand la différence touche la borne, si possible tôt. La durée d’exploration $\tau$ est aléatoire et s’adapte à l’écart réel : grand écart, arrêt rapide.</p>
<div class="thm"><b>Regret d’ETC séquentiel</b> (slide 49, preuve omise dans le cours). Il existe une constante $C>0$ telle que $R(n)\le\frac2\Delta\log n+C\sqrt{\log n}$.</div>
<p>Même terme principal $\frac2\Delta\log n$ que lorsque $\Delta$ est connu, sans avoir à le connaître : un algorithme simple, avec des fondements théoriques.</p>
<h4>5. Pièges</h4>
<ul><li>Surestimer $\Delta$ donne un $m$ trop court : la probabilité de s’engager sur le mauvais bras grandit, et le regret se rapproche d’un regret linéaire. Le sous-estimer allonge inutilement l’exploration.</li>
<li>La formule de $m^*$ n’a de sens que si $n\Delta^2>2$ (sinon le logarithme est négatif) et si $m^*\le n/K$.</li>
<li>$\Delta$ est le plus petit écart ; la borne de regret somme, elle, tous les écarts $\mu_1-\mu_a$.</li></ul>
<p><b>Lien finance.</b> Un test A/B classique à taille fixée (une phase de test, puis le déploiement de la variante gagnante) est un ETC. La formule $m^*$ dit que la taille du test doit croître avec le nombre de clients concernés ensuite ($n$) et décroître avec l’écart attendu entre variantes ($\Delta$).</p>
<p><b>À retenir</b></p>
<ul><li>ETC : $m$ tirages par bras, puis engagement sur $\arg\max_a\hat\mu_a(m)$.</li>
<li>Hoeffding : $\mathbb E[N_a(n)]\le m+n\,e^{-m\Delta^2/2}$.</li>
<li>$m^*=\frac2{\Delta^2}\log\frac{n\Delta^2}2$ donne un regret logarithmique, mais exige $\Delta$.</li>
<li>ETC séquentiel : règle d’arrêt sur $|\hat\mu_1-\hat\mu_2|$, regret $\frac2\Delta\log n+C\sqrt{\log n}$ sans connaître $\Delta$.</li></ul>`,
      },
      {
        id: 'bd-lower', title: 'Borne inférieure de Lai et Robbins', slides: '50-57',
        summary: 'Aucun algorithme efficace ne fait mieux que logarithmique : E[Na(n)] ≥ log n / KL(νa, ν*). Plus les bras se ressemblent, plus c’est dur.',
        fiche: R`
<p><b>L’idée.</b> Jusqu’ici, on a montré qu’un algorithme fait <b>au plus</b> tant de regret. Lai et Robbins montrent l’inverse : tout algorithme raisonnable doit tirer chaque mauvais bras <b>au moins</b> de l’ordre de $\log n$ fois, d’autant plus que ce bras ressemble au meilleur. On ne peut pas faire mieux que logarithmique.</p>
<div class="def"><b>Algorithme efficace</b> : regret <b>sous-linéaire</b> pour <b>tout</b> problème de bandit (slide 37).</div>
<p>Bornes supérieures $R(n)\le\dots$ et bornes inférieures $R(n)\ge\dots$ (slide 50). Les lois étant inconnues, même un algorithme optimal a un regret non nul. Le théorème de Lai et Robbins (1985) donne une borne inférieure asymptotique, pour une classe riche de lois.</p>
<div class="thm"><b>Théorème de Lai et Robbins</b> (slide 51). Pour tout algorithme efficace et tout bras sous-optimal $a$ :
$$\liminf_{n\to\infty}\frac{\mathbb E[N_a(n)]}{\log n}\ge\frac1{D_{KL}(\nu_a\|\nu^*)},\qquad N_a(n)=\sum_{t=1}^n\mathbb 1\{A_t=a\}.$$</div>
<p>Lecture : $\liminf$ (limite inférieure) dit qu’à partir d’un certain $n$, $\mathbb E[N_a(n)]$ ne peut pas rester nettement sous $\frac{\log n}{D_{KL}(\nu_a\|\nu^*)}$. $\nu^*$ est la loi du meilleur bras.</p>
<div class="def"><b>Divergence de Kullback-Leibler</b> (slide 52) entre deux lois $P$ et $Q$ de densités $p$ et $q$ :
$$D_{KL}(P\|Q)=\int_{-\infty}^{\infty}p(x)\log\frac{p(x)}{q(x)}\,dx.$$
Mesure de dissimilarité, nulle si $P=Q$, positive sinon, et <b>non symétrique</b> : $D_{KL}(P\|Q)\ne D_{KL}(Q\|P)$ en général.</div>
<p>La slide 53 compare deux gaussiennes $p$ et $q$ : quand elles s’écartent, l’aire sous $p\log(p/q)$ (la divergence) augmente. L’intégrande peut être négatif par endroits, l’intégrale reste positive.</p>
<p><b>Interprétation</b> (slide 54). Avec la décomposition $R_n=\sum_a\Delta_a\mathbb E[N_a(n)]$ :</p>
$$\liminf_{n\to\infty}\frac{R_n}{\log n}\ge\sum_{a=1}^K\frac{\Delta_a}{D_{KL}(\nu_a\|\nu^*)}.$$
<p>Le problème est plus difficile si les bras ont des moyennes proches ($\Delta_a$ petit) : il faut alors davantage de tirages pour les distinguer. La difficulté diminue quand la dissimilarité $D_{KL}$ augmente.</p>
<div class="def"><b>Cas de Bernoulli</b> (slide 55) :
$$d(\mu_a;\mu_b)=D_{KL}(\mathcal B_{\mu_a}\|\mathcal B_{\mu_b})=(1-\mu_a)\log\frac{1-\mu_a}{1-\mu_b}+\mu_a\log\frac{\mu_a}{\mu_b},$$
et le théorème devient $\liminf_{n\to\infty}\frac{\mathbb E[N_a(n)]}{\log n}\ge\frac1{d(\mu_a;\mu_1)}$.</div>
<p>La slide 55 écrit $\liminf\mathbb E[N_a(n)]\ge\frac{\log n}{d(\mu_a;\mu_1)}$ : c’est un raccourci d’écriture, le $\log n$ doit rester dans le quotient sous la $\liminf$ (sinon le membre de droite dépend de $n$ après le passage à la limite).</p>
<h4>Exemple calculé</h4>
<p>Prenons $\mu_1=0{,}6$, $\mu_2=0{,}5$, $n=10\,000$ ($\ln n\approx9{,}21$).</p>
<ol><li>$d(0{,}5;0{,}6)=0{,}5\ln\frac{0{,}5}{0{,}6}+0{,}5\ln\frac{0{,}5}{0{,}4}=0{,}5\times(-0{,}1823)+0{,}5\times0{,}2231\approx0{,}0204$.</li>
<li>Ordre de grandeur imposé : $\mathbb E[N_2(n)]\gtrsim\frac{9{,}21}{0{,}0204}\approx451$ tirages du bras 2, donc un regret d’environ $0{,}1\times451\approx45$.</li>
<li>ETC avec $\Delta$ connu (section précédente) : $\mathbb E[N_2]\le982{,}4$ et $R\le98{,}2$, soit un peu plus du double, à cet horizon.</li>
<li>Asymétrie : $d(0{,}6;0{,}5)\approx0{,}0201\ne0{,}0204$. L’ordre compte : c’est $d(\mu_a;\mu_1)$, mauvais bras en premier.</li></ol>
<p>Même écart, difficulté différente : $d(0{,}05;0{,}15)\approx0{,}0507$, plus du double de $d(0{,}5;0{,}6)$. Distinguer 5 % de 15 % demande moins de tirages que distinguer 50 % de 60 %, car les Bernoulli proches de 0 ont une faible variance.</p>
<h4>Comparaison avec ETC (slide 56)</h4>
<p>Le cours admet $d(\mu_a;\mu_1)\ge(\mu_a-\mu_1)^2=\Delta^2$. Pour 2 bras : ETC donne $\mathbb E[N_a(n)]\le\frac2{\Delta^2}\big[\log\frac{n\Delta^2}2+1\big]\approx\frac2{\Delta^2}\log n$, et Lai et Robbins imposent au moins $\frac1{d(\mu_2;\mu_1)}\log n$ asymptotiquement. L’inégalité de Pinsker (hors slides) donne même $d\ge2\Delta^2$, donc $\frac1d\le\frac1{2\Delta^2}$ : le coefficient $\frac2{\Delta^2}$ d’ETC vaut au moins 4 fois celui de la borne. Sur la slide 56, un « 4 » figure devant la fraction de Lai et Robbins ; cette lecture (un facteur 4 entre ETC et la borne) est une hypothèse. À confirmer avec le Prof. Siebert (slide 56).</p>
<p>Deux questions ouvertes en fin de slide 56 : peut-on faire mieux qu’ETC adaptatif, et atteindre la borne ?</p>
<p><b>Conclusion</b> (slide 57) : rien ne garantit qu’une stratégie atteigne la borne. Lai et Robbins en proposent une, mais elle est incalculable en pratique. D’où la recherche de stratégies à regret logarithmique (UCB), puis la preuve de leur optimalité (Thompson sampling, KL-UCB).</p>
<h4>Pièges</h4>
<ul><li>La borne est <b>asymptotique</b> ($\liminf$) : à $n$ fini, elle donne un ordre de grandeur, pas une garantie chiffrée.</li>
<li>Elle ne vaut que pour les algorithmes <b>efficaces</b>. « Toujours jouer le bras 1 » a un regret nul quand le bras 1 est le meilleur, mais un regret linéaire sur le problème où les bras sont échangés : il n’est pas efficace et ne contredit pas le théorème.</li>
<li>La difficulté se lit dans la KL, pas seulement dans l’écart $\Delta_a$.</li></ul>
<p><b>Lien finance.</b> Deux stratégies de recouvrement aux taux voisins (50 % et 60 %) sont coûteuses à départager : tout procédé d’apprentissage, quel qu’il soit, doit consacrer de l’ordre de $\log n/d$ dossiers à la moins bonne.</p>
<p><b>À retenir</b></p>
<ul><li>$\liminf\frac{\mathbb E[N_a(n)]}{\log n}\ge\frac1{D_{KL}(\nu_a\|\nu^*)}$ pour tout algorithme efficace.</li>
<li>Donc $R_n\gtrsim\sum_a\frac{\Delta_a}{D_{KL}(\nu_a\|\nu^*)}\log n$ : pas mieux que logarithmique.</li>
<li>Bernoulli : $d(\mu_a;\mu_b)=\mu_a\log\frac{\mu_a}{\mu_b}+(1-\mu_a)\log\frac{1-\mu_a}{1-\mu_b}$, non symétrique.</li>
<li>ETC est logarithmique mais avec une constante plus grande que la borne.</li></ul>`,
      },
      {
        id: 'bd-egreedy', title: 'ε-greedy', slides: '58-60',
        summary: 'Avec probabilité 1 − ε le meilleur bras empirique, sinon un bras au hasard. ε fixe : regret linéaire. ε décroissant : mieux, mais calendrier difficile à régler.',
        fiche: R`
<p><b>L’idée.</b> Jouer presque toujours le leader, mais lancer de temps en temps une pièce truquée qui envoie vers un bras au hasard. L’exploration ne s’arrête jamais, ce qui empêche de s’enfermer sur un mauvais bras, mais coûte à chaque tour.</p>
<h4>1. L’algorithme (slide 58)</h4>
<p>Lié à ETC, mais l’exploration est <b>aléatoire</b> et répartie dans le temps. Après avoir tiré chaque bras une fois, à chaque itération :</p>
<ul><li>avec probabilité $1-\epsilon$ : le meilleur bras empirique, $A_{t+1}=\arg\max_{a\in\{1,\dots,K\}}\hat\mu_a(t)$ ;</li>
<li>avec probabilité $\epsilon$ : un bras choisi uniformément au hasard parmi les $K$ bras (le leader compris).</li></ul>
<p>$\epsilon$ (epsilon) est la <b>proportion d’exploration</b>, le seul paramètre, qu’on peut adapter. L’exploration est indépendante de ce qu’on sait déjà : un bras manifestement mauvais est exploré aussi souvent qu’un bras prometteur.</p>
<h4>2. Illustration et regret (slides 59 et 60)</h4>
<p>Slide 59 (source Yuejie Chi) : au début, tous les bras sont choisis assez souvent ; l’algorithme repère que le bras 5 a le meilleur gain moyen, le joue la plupart du temps (fraction $1-\epsilon$, plus sa part du tirage uniforme), et continue d’explorer les autres une fraction $\epsilon$ du temps.</p>
<p>Slide 60 (source David Silver), regret de trois politiques :</p>
<ul><li><b>greedy</b> ($\epsilon=0$, c’est Follow the Leader) : regret linéaire, car il peut se bloquer sur un bras sous-optimal ;</li>
<li><b>ε-greedy à ε fixe</b> : regret encore linéaire, car il explore une fraction $\epsilon$ du temps pour toujours ;</li>
<li><b>ε décroissant</b> : aide, mais le calendrier de décroissance est difficile à concevoir.</li></ul>
<p>Pourquoi linéaire : même quand le leader est le bon bras, chaque tour tire le bras $a$ avec probabilité au moins $\epsilon/K$. Par la décomposition du regret, chaque tour coûte au moins $\frac\epsilon K\sum_a\Delta_a$, donc $R_n\ge n\,\frac\epsilon K\sum_a\Delta_a$ (à peu près) : $\epsilon$ fois le regret de l’exploration pure.</p>
<h4>3. Exemple calculé</h4>
<p>Prenons $K=3$, $\epsilon=0{,}1$, $\mu=(0{,}30\,;0{,}25\,;0{,}10)$, et supposons que le leader empirique soit le bon bras 1.</p>
<ol><li>$\mathbb P(A_{t+1}=1)=0{,}9+\frac{0{,}1}3\approx0{,}933$ ; $\mathbb P(A_{t+1}=2)=\mathbb P(A_{t+1}=3)=\frac{0{,}1}3\approx0{,}033$.</li>
<li>Coût moyen par tour : $0{,}033\times0{,}05+0{,}033\times0{,}20=\frac{0{,}1}3\times0{,}25\approx0{,}0083$.</li>
<li>Sur $n=10\,000$ tours : environ $83$, et deux fois plus sur $20\,000$ tours. Linéaire.</li></ol>
<h4>4. Pièges</h4>
<ul><li>Le tirage uniforme se fait parmi les $K$ bras, leader compris : la probabilité de jouer le leader est $1-\epsilon+\epsilon/K$, pas $1-\epsilon$.</li>
<li>« ε-greedy explore » ne suffit pas à le rendre efficace : à ε fixe, l’exploration ne diminue jamais.</li>
<li>Contrairement à UCB, ε-greedy n’explore pas en priorité les bras incertains.</li></ul>
<p><b>Lien finance.</b> Réserver en permanence 10 % des clients à une offre tirée au hasard, pour « continuer d’apprendre », a un coût proportionnel au nombre de clients : c’est l’ε-greedy à ε fixe.</p>
<p><b>À retenir</b></p>
<ul><li>Probabilité $1-\epsilon$ : leader empirique ; probabilité $\epsilon$ : bras uniforme parmi $K$.</li>
<li>$\epsilon=0$ : Follow the Leader ; $\epsilon$ fixe : regret linéaire $\approx n\frac\epsilon K\sum_a\Delta_a$.</li>
<li>$\epsilon$ décroissant : meilleur, mais calendrier délicat.</li></ul>`,
      },
      {
        id: 'bd-ucb', title: 'UCB : l’optimisme face à l’incertitude', slides: '61-80',
        summary: 'Tirer le bras de plus grand indice μ̂a + √(2 log t / Na). Construit à partir de Hoeffding + union bound. E[Na(n)] = O(log n / Δa²) : regret logarithmique.',
        fiche: R`
<p><b>L’idée.</b> Pour chaque bras, on calcule la meilleure moyenne encore plausible au vu des données, et on joue le bras dont ce plafond est le plus haut. Un bras peu tiré a un plafond haut parce qu’on le connaît mal ; le tirer, c’est soit gagner, soit apprendre qu’il est mauvais et voir son plafond baisser.</p>
<h4>1. Principe (slides 61 à 63)</h4>
<p><b>Optimisme face à l’incertitude</b> (Auer et al., 2002) : toujours jouer le « meilleur » bras, où « meilleur » inclut exploration et exploitation. Avec l’estimateur $\hat\mu_a(t)=\frac1{N_a(t)}\sum_{s=1}^{N_a(t)}Y_a(s)$, on suppose pour chaque bras un intervalle de confiance $\mu_a\in[LCB_a(t),UCB_a(t)]$ (<i>Lower / Upper Confidence Bound</i>, bornes inférieure et supérieure de confiance). On suppose l’environnement aussi favorable que possible et on tire $A_{t+1}=\arg\max_aUCB_a(t)$. Chaque tirage d’un bras sous-optimal apporte de l’information, et l’incertitude sur ce bras diminue.</p>
<h4>2. Construire la borne supérieure (slides 64 à 73)</h4>
<p>On cherche $UCB_a(t)$ tel que $\mathbb P(\mu_a\le UCB_a(t))$ soit grande.</p>
<p><b>Première idée, le TCL</b> (théorème central limite, slides 64 à 66). Pour $Z_i\sim\mathcal B(\mu)$ i.i.d., $\sqrt{\frac s{\mu(1-\mu)}}\big(\mu-\hat\mu(s)\big)$ tend en loi vers $X\sim\mathcal N(0,1)$ : $\hat\mu(s)$ approche $\mu$ à la vitesse $\sqrt{\mu(1-\mu)/s}$, où $\mu(1-\mu)$ est la variance d’une Bernoulli. Avec $\mathbb P(X\ge\sqrt{2\log(1/\delta)})\lesssim\delta$, et en bornant la variance par $1/4$, on obtient asymptotiquement $\mathbb P\big(\mu_a\le\hat\mu_a(s)+\sqrt{\log(1/\delta)/(2s)}\big)\gtrsim1-\delta$. Deux défauts : c’est <b>asymptotique</b>, et on ne peut pas remplacer le nombre fixe $s$ par le nombre aléatoire $N_a(t)$ sans en payer le prix.</p>
<p><b>Deuxième idée, Hoeffding</b> (non asymptotique, slides 67 et 68). Pour $Z_i\in[0,1]$ i.i.d. de moyenne $\mu$ : $\mathbb P[\hat\mu(s)\le\mu-\epsilon]\le e^{-2s\epsilon^2}$. On pose $\delta=e^{-2s\epsilon^2}$, soit $\epsilon=\sqrt{\log(1/\delta)/(2s)}$, puis $t=1/\sqrt\delta$ (c’est-à-dire $\delta=1/t^2$, et $\log(1/\delta)=2\log t$) :</p>
$$\mathbb P\Big[\hat\mu_a(s)\le\mu_a-\sqrt{\tfrac{\log t}s}\Big]\le\frac1{t^2}\qquad\text{pour tout }s\ge1.$$
<p><b>Union bound</b> (slides 69 et 70). $N_a(t)$ est aléatoire : on considère toutes ses valeurs possibles $s\in\{1,\dots,t\}$,</p>
$$\mathbb P\Big[\mu_a\ge\hat\mu_a(t)+\sqrt{\tfrac{\log t}{N_a(t)}}\Big]\le\mathbb P\Big[\exists s\le t:\ \mu_a\ge\hat\mu_a(s)+\sqrt{\tfrac{\log t}s}\Big]\le\sum_{s=1}^t\frac1{t^2}=\frac1t,$$
<p>d’où $\mathbb P\big[\mu_a\le\hat\mu_a(t)+\sqrt{\log t/N_a(t)}\big]\ge1-\frac1t$. La somme de $t$ termes coûte un facteur $t$ : la confiance passe de $1-1/t^2$ à $1-1/t$. La slide 69 écrit l’événement avec $\mu_a\le\dots$ ; l’événement d’échec à borner est $\mu_a\ge\dots$, comme sur la slide 70. À confirmer avec le Prof. Siebert (slide 69).</p>
<div class="thm"><b>UCB1</b> (Auer et al., 2002, slide 71) :
$$A_{t+1}=\arg\max_a\Big[\underbrace{\hat\mu_a(t)}_{\text{exploitation}}+\underbrace{\sqrt{\tfrac{2\log t}{N_a(t)}}}_{\text{bonus d’exploration}}\Big].$$
Le facteur 2 diffère du candidat $\sqrt{\log t/N_a(t)}$ à cause d’une autre technique de preuve.</div>
<p><b>Tous les bras finissent par être tirés</b> (slide 72) : pour un bras délaissé, $\hat\mu_a(t)$ et $N_a(t)$ restent constants, mais $\log t$ augmente, donc son indice aussi, jusqu’à dépasser les autres.</p>
<p><b>Confiance variable</b> (slide 73) : avec $\delta=1/t^\alpha$, $\alpha>1$, le candidat devient $\hat\mu_a(t)+\sqrt{\frac{\alpha\log t}{2N_a(t)}}$, valable avec probabilité $\ge1-\frac1{t^\alpha}$. Avec $\alpha=4$, on retrouve exactement le bonus d’UCB1 $\sqrt{2\log t/N_a(t)}$.</p>
<h4>3. Exemple calculé</h4>
<p>Prenons $t=20$ ($\ln20\approx2{,}996$) et trois bras : bras 1, $\hat\mu=0{,}6$, $N=10$ ; bras 2, $\hat\mu=0{,}5$, $N=6$ ; bras 3, $\hat\mu=0{,}2$, $N=4$.</p>
<table><tr><th>Bras</th><th>Bonus $\sqrt{2\ln20/N}$</th><th>Indice</th></tr>
<tr><td>1</td><td>$\sqrt{5{,}99/10}\approx0{,}774$</td><td>$1{,}374$</td></tr>
<tr><td>2</td><td>$\sqrt{5{,}99/6}\approx0{,}999$</td><td>$1{,}499$</td></tr>
<tr><td>3</td><td>$\sqrt{5{,}99/4}\approx1{,}224$</td><td>$1{,}424$</td></tr></table>
<p>UCB1 joue le bras 2, qui n’a pas la meilleure moyenne observée. Le bras 3, pourtant à 0,2, passe devant le bras 1 grâce à son incertitude. Le bonus est divisé par 2 quand $N$ est multiplié par 4 : à $t=100$, il vaut environ 1,52, 0,76 et 0,38 pour $N=4$, 16 et 64.</p>
<h4>4. Regret logarithmique (slides 74 à 79)</h4>
<div class="thm"><b>Théorème</b> (slide 75). Pour tout bras sous-optimal $a\ne a^*$, il existe une constante $C$ indépendante des paramètres du problème telle que $\mathbb E[N_a(n)]\le\frac{\log n}{2\Delta_a^2}+C$. Avec la décomposition $R_n=\sum_a\Delta_a\mathbb E[N_a(n)]$ : $\mathbb E[R(n)]=O(\log n)$ (slide 74).</div>
<p><b>Esquisse de preuve</b> (slides 75 à 78, à savoir expliquer). Le « mauvais » événement est de tirer un bras sous-optimal $a$, ce qui n’arrive que si son indice dépasse celui du bras 1 : $U_{a,t}\ge U_{1,t}$. Deux cas :</p>
<ol><li><b>Le bras 1 est fortement sous-estimé</b> : $\hat\mu_1(t-1)+UCB_1(t-1)<\mu_1$. Avec le niveau de confiance $\delta=1/t^\alpha$, cet événement a une probabilité inférieure à $1/t^\alpha$. Comme $\alpha>1$, la somme de ces probabilités sur $t$ reste finie : ce cas ne contribue qu’une constante.</li>
<li><b>$\hat\mu_1$ est dans son intervalle, mais le bras $a$ est surestimé.</b> Avec probabilité au moins $1-1/t^\alpha$, on a aussi $\hat\mu_a\le\mu_a+UCB_a$, donc $\mu_a+2\,UCB_a(t-1)>U_{a,t}\ge U_{1,t}>\mu_1$. D’où $UCB_a(t-1)>\frac{\mu_1-\mu_a}2=\frac{\Delta_a}2$, et avec le candidat $\sqrt{\frac{\alpha\log(t-1)}{2N_a(t-1)}}>\frac{\Delta_a}2$, c’est-à-dire
$$N_a(t-1)<\frac{2\alpha\log(t-1)}{\Delta_a^2}.$$</li></ol>
<p>Conclusion (slide 79) : un bras sous-optimal n’est rejoué, hors événements rares, que tant que $N_a(t)<\frac{2\alpha\log t}{\Delta_a^2}<\frac{2\alpha\log n}{\Delta_a^2}$.</p>
<p>Le théorème (slide 75) annonce le coefficient $\frac1{2\Delta_a^2}$ devant $\log n$ ; l’esquisse (slides 78 et 79) aboutit à $\frac{2\alpha}{\Delta_a^2}$. Les deux donnent l’ordre $O(\log n/\Delta_a^2)$, mais pas la même constante. À confirmer avec le Prof. Siebert (slides 75 et 79).</p>
<p>Exemple : $\Delta_a=0{,}1$, $\alpha=2$, $n=10\,000$ : $\frac{2\times2\times9{,}21}{0{,}01}\approx3684$ tirages au plus (hors événements rares). Une borne en $\log n$, mais avec une constante élevée.</p>
<p><b>Commentaires</b> (slide 79) : si l’écart entre les deux meilleurs bras est très petit, la pénalité $1/\Delta_a^2$ devient très grande ; mais alors jouer le deuxième bras coûte peu. On sait aussi construire des bornes « pire cas », indépendantes de $\Delta_a$.</p>
<p><b>Variantes</b> (slide 80) : le principe UCB donne une famille d’algorithmes, selon la construction des bornes et les hypothèses sur le bruit. Pour des Bernoulli, l’inégalité de Chernoff remplace Hoeffding et donne un algorithme différent et meilleur, <b>KL-UCB</b>.</p>
<h4>5. Pièges</h4>
<ul><li>Le bonus contient $\log t$ (le temps total), pas $\log N_a$ : c’est ce qui fait remonter un bras délaissé.</li>
<li>L’indice n’est pas une probabilité : il peut dépasser 1.</li>
<li>Il faut $N_a\ge1$ : on tire chaque bras une fois avant d’appliquer la formule.</li>
<li>UCB est déterministe sachant l’historique ; l’aléa vient seulement des gains.</li></ul>
<p><b>Lien finance.</b> Allocation d’un budget de revue : chaque jour, des analystes vérifient un nombre limité d’alertes, issues de plusieurs règles de détection (les bras) ; gain 1 si l’alerte est une fraude confirmée. UCB oriente les revues vers les règles les plus productives, tout en revenant périodiquement vers les règles peu examinées (exemple construit, pas un retour d’expérience).</p>
<p><b>À retenir</b></p>
<ul><li>UCB1 : $\arg\max_a\big[\hat\mu_a(t)+\sqrt{2\log t/N_a(t)}\big]$.</li>
<li>Construction : Hoeffding avec $\delta=1/t^2$, puis union bound sur $N_a(t)\in\{1,\dots,t\}$ : confiance $1-1/t$.</li>
<li>Variante $\delta=1/t^\alpha$ : bonus $\sqrt{\alpha\log t/(2N_a)}$ ; $\alpha=4$ redonne UCB1.</li>
<li>$\mathbb E[N_a(n)]=O(\log n/\Delta_a^2)$, donc regret $O(\log n)$.</li></ul>`,
      },
      {
        id: 'bd-thompson', title: 'Approche bayésienne : Thompson sampling', slides: '82-94',
        summary: 'Loi a priori uniforme sur μa, a posteriori Beta(Sa+1, Na−Sa+1). À chaque tour, tirer θa selon chaque a posteriori et jouer le plus grand. Atteint la borne de Lai-Robbins.',
        fiche: R`
<p><b>L’idée.</b> On tient pour chaque bras une loi de probabilité sur sa moyenne, qui résume ce qu’on en sait. À chaque tour, on tire au hasard une valeur plausible pour chaque bras et on joue celui qui sort le plus haut. Un bras mal connu a une loi étalée et sort parfois très haut : c’est ainsi qu’il est exploré.</p>
<h4>1. Fréquentiste ou bayésien (slides 82 et 83)</h4>
<p><b>Fréquentiste</b> : $\mu_1,\dots,\mu_K$ sont des paramètres inconnus ; on utilise des estimateurs (moyennes empiriques) et des intervalles de confiance (UCB). <b>Bayésien</b> : chaque $\mu_a$ est vu comme la réalisation d’une variable aléatoire dont on cherche la loi. Sans information initiale, on prend une loi <b>a priori</b> uniforme : $\mu_a\sim\mathcal U([0,1])$.</p>
<p>Notations : $N_a(t)$ = nombre d’observations du bras $a$ au temps $t$ ; $S_a(t)$ = somme de ses gains (pour une Bernoulli, le nombre de succès).</p>
<p>On construit peu à peu une loi <b>a posteriori</b>, conditionnée par les observations du bras $a$. Pour un a priori uniforme et des gains de Bernoulli :</p>
$$\pi_a(t)=\mathcal L\big(\mu_a\mid Y_a(1),\dots,Y_a(N_a(t))\big)=\mathrm{Beta}\big(\underbrace{S_a(t)+1}_{=:\alpha},\ \underbrace{N_a(t)-S_a(t)+1}_{=:\beta}\big).$$
<p>En mots : $\alpha$ = succès + 1, $\beta$ = échecs + 1. $\mathcal L(\cdot\mid\cdot)$ se lit « loi de … sachant … ».</p>
<h4>2. La loi Bêta (slides 84 à 88)</h4>
<div class="def"><b>Densité</b> de $\mathrm{Beta}(\alpha,\beta)$ sur $[0,1]$ (nulle ailleurs) :
$$f(x;\alpha,\beta)=\frac{x^{\alpha-1}(1-x)^{\beta-1}}{\int_0^1u^{\alpha-1}(1-u)^{\beta-1}du}=\frac{\Gamma(\alpha+\beta)}{\Gamma(\alpha)\Gamma(\beta)}x^{\alpha-1}(1-x)^{\beta-1}=\frac1{B(\alpha,\beta)}x^{\alpha-1}(1-x)^{\beta-1}.$$
$\Gamma$ est la fonction Gamma ($\Gamma(k)=(k-1)!$ pour un entier) et $B(\alpha,\beta)$ la constante de normalisation. Moyenne : $\frac\alpha{\alpha+\beta}$ ; $\mathrm{Beta}(1,1)$ est la loi uniforme.</div>
<p>Slide 85 : la forme dépend de $\alpha$ et $\beta$ (en U pour $\alpha=\beta=0{,}5$, en cloche pour $\alpha=\beta=2$, etc.). Slide 86 : pour un bandit, $\alpha$ est lié aux succès $S_a(t)$, $\beta$ au nombre de tirages $N_a(t)$ (via les échecs). Si les tirages du bras sont mauvais, $\alpha<\beta$ et la masse se concentre vers les petites valeurs ; s’ils sont bons, $\alpha>\beta$ et elle se concentre vers les grandes valeurs. La slide 86 écrit « right shift » pour $\alpha<\beta$ et « left shift » pour $\alpha>\beta$, ce qui correspond au sens de la queue de la distribution (asymétrie à droite quand la masse est à gauche) ; la slide 87 dit bien qu’un 1 observé déplace la courbe vers la droite. À confirmer avec le Prof. Siebert (slide 86).</p>
<p>Slide 87 : un 1 observé déplace la densité a posteriori vers la droite, un 0 vers la gauche. Slide 88 : après 500 itérations, un bras peu tiré a une a posteriori <b>plate</b> (on le connaît mal), un bras souvent tiré une a posteriori <b>pointue</b> (bonne estimation de $\mu_a$). Un algorithme bayésien exploite ces lois, au lieu des bornes de confiance d’UCB, pour choisir le bras.</p>
<h4>3. Thompson sampling (slides 89 à 91)</h4>
<div class="thm"><b>Thompson sampling</b> (Thompson, 1933, l’une des premières publications sur les bandits, en essais cliniques ; redécouvert en 2011 pour la publicité en ligne). À chaque tour :
<ol><li>pour chaque bras, tirer une réalisation de l’a posteriori : $\forall a\in\{1,\dots,K\},\ \theta_a(t)\sim\pi_a(t)$ ;</li>
<li>jouer le bras qui donne le plus grand échantillon : $A_{t+1}=\arg\max_a\theta_a(t)$ ;</li>
<li>mettre à jour l’a posteriori du bras joué avec le gain observé.</li></ol></div>
<p>Exemple du cours (slide 90), 2 bras avec $\mu_1>\mu_2$ : on tire $\theta_1(t)\sim\pi_1(t)$ et $\theta_2(t)\sim\pi_2(t)$ ; il arrive que $\theta_2(t)\ge\theta_1(t)$, et l’algorithme choisit alors le bras 2. C’est une exploration.</p>
<p>Philosophie (slide 91) : plus « pessimiste » qu’UCB, qui retient le meilleur modèle possible ; ici on joue selon <b>un</b> modèle plausible a posteriori. L’exploration est rendue aléatoire en suivant l’a posteriori : le hasard peut donner $\theta_a(t)<\mu_a$ ou $\theta_a(t)>\mu_a$, avec des écarts larges pour un bras peu tiré. On peut montrer que cet algorithme atteint la borne de Lai et Robbins.</p>
<h4>4. Bandits de Bernoulli et conjugaison (slides 92 à 94)</h4>
<p>Chaque bras suit $\mathcal B(\theta_a)$, paramètres inconnus mais stationnaires. On met un a priori $\mathrm{Beta}(\alpha_a,\beta_a)$ sur chaque $\theta_a$ : $p(\theta_a\mid\alpha_a,\beta_a)=\frac{\Gamma(\alpha_a+\beta_a)}{\Gamma(\alpha_a)\Gamma(\beta_a)}\theta_a^{\alpha_a-1}(1-\theta_a)^{\beta_a-1}$, et on met à jour par la <b>formule de Bayes</b> :</p>
$$\underbrace{P(\theta_a\mid X)}_{\text{a posteriori}}\cdot\underbrace{P(X)}_{\text{évidence}}=\underbrace{P(X\mid\theta_a)}_{\text{vraisemblance}}\cdot\underbrace{P(\theta_a)}_{\text{a priori}}.$$
<div class="def"><b>Conjugaison Bêta-Bernoulli</b> (à savoir refaire). Vraisemblance d’une observation $x\in\{0,1\}$ : $P(X\mid\theta)=\theta^x(1-\theta)^{1-x}$. A priori : $P(\theta\mid\alpha,\beta)\propto\theta^{\alpha-1}(1-\theta)^{\beta-1}$. Donc
$$P(\theta\mid x)\propto\theta^x(1-\theta)^{1-x}\,\theta^{\alpha-1}(1-\theta)^{\beta-1}=\theta^{\alpha+x-1}(1-\theta)^{\beta+(1-x)-1},$$
c’est-à-dire $\mathrm{Beta}(\alpha+x,\ \beta+1-x)$ : un succès ajoute 1 à $\alpha$, un échec ajoute 1 à $\beta$. L’a posteriori reste une Bêta : la Bêta est l’<b>a priori conjugué</b> de la Bernoulli.</div>
<p>Kaufmann et al. (2012) ont prouvé que Thompson sampling a un regret logarithmique <b>optimal</b> pour les gains binaires, quels que soient les paramètres initiaux $(\alpha,\beta)$.</p>
<h4>5. Exemples calculés</h4>
<p><b>Mise à jour.</b> A priori $\mathrm{Beta}(1,1)$, on observe 1, 0, 1 : $\mathrm{Beta}(2,1)$, puis $\mathrm{Beta}(2,2)$, puis $\mathrm{Beta}(3,2)$. Moyenne a posteriori $\frac3{5}=0{,}6$, alors que la moyenne empirique vaut $\frac23$ : l’a priori tire vers $\frac12$, d’autant moins qu’on a de données.</p>
<p><b>L’exploration en chiffres.</b> Bras A : 60 succès en 100 tirages, a posteriori $\mathrm{Beta}(61,41)$, moyenne $\approx0{,}598$, très pointue. Bras B : 1 succès en 3 tirages, $\mathrm{Beta}(2,3)$, moyenne $0{,}4$, plate. Probabilité que Thompson joue B : $\mathbb P(\theta_B>\theta_A)\approx0{,}19$ (calcul numérique de l’intégrale). Si B donne alors un succès, il passe à $\mathrm{Beta}(3,2)$ et cette probabilité monte à environ $0{,}53$.</p>
<h4>6. Pièges</h4>
<ul><li>$\mathrm{Beta}(S+1,N-S+1)$ et non $\mathrm{Beta}(S,N)$ : le second paramètre compte les <b>échecs</b> (plus 1), pas les tirages.</li>
<li>On tire un échantillon $\theta_a$ par bras ; on ne compare pas les moyennes a posteriori (ce serait de l’exploitation pure).</li>
<li>Les formules $\mathrm{Beta}(S+1,\dots)$ supposent l’a priori uniforme ; avec $\mathrm{Beta}(\alpha_0,\beta_0)$, on obtient $\mathrm{Beta}(\alpha_0+S,\ \beta_0+N-S)$.</li></ul>
<p><b>Lien finance.</b> Dans un test A/B d’offres, l’a posteriori de chaque taux de conversion donne directement la probabilité que la variante B soit meilleure que A ; Thompson sampling envoie à chaque variante une part des clients égale (en moyenne) à cette probabilité d’être la meilleure.</p>
<p><b>À retenir</b></p>
<ul><li>A priori uniforme, gains de Bernoulli : a posteriori $\mathrm{Beta}(S_a+1,\ N_a-S_a+1)$, moyenne $\frac{S_a+1}{N_a+2}$.</li>
<li>Conjugaison : une observation $x$ fait passer de $\mathrm{Beta}(\alpha,\beta)$ à $\mathrm{Beta}(\alpha+x,\beta+1-x)$.</li>
<li>Thompson : $\theta_a\sim\pi_a(t)$ pour chaque bras, jouer $\arg\max_a\theta_a$, mettre à jour.</li>
<li>Exploration par le hasard de l’a posteriori ; regret optimal pour les gains binaires (Kaufmann et al., 2012).</li></ul>`,
      },
      {
        id: 'bd-bai', title: 'Identifier le meilleur bras', slides: '96-98',
        summary: 'Autre objectif : trouver le meilleur bras vite et sûrement (P(âτ = a*) ≥ 1 − δ, E[τ] petit). Règles d’échantillonnage, d’arrêt, de recommandation ; algorithme LUCB.',
        fiche: R`
<p><b>L’idée.</b> Parfois, ce qui compte n’est pas ce qu’on gagne pendant l’expérience, mais la décision prise à la fin : quel traitement adopter, quelle stratégie déployer. On cherche alors à désigner le meilleur bras avec une confiance fixée, en aussi peu de tirages que possible.</p>
<h4>1. Deux objectifs (slide 96)</h4>
<p>Pour le $t$-ième patient d’un essai clinique, le médecin choisit un traitement $A_t$ et observe $X_t\in\{0,1\}$ avec $P(X_t=1)=\mu_{A_t}$ (cinq traitements $\mathcal B(\mu_1),\dots,\mathcal B(\mu_5)$ sur la slide).</p>
<ul><li><b>Minimiser le regret</b> : maximiser le nombre de patients guéris <b>pendant</b> l’étude.</li>
<li><b>Objectif alternatif</b> : <b>identifier</b> le meilleur traitement le plus vite possible, sans objectif thérapeutique immédiat pour les patients de l’étude.</li></ul>
<h4>2. Le problème d’identification du meilleur bras (slide 97)</h4>
<div class="def">On choisit un <b>risque</b> $\delta\in\,]0,1[$, plutôt proche de 0. La stratégie de l’agent a trois composantes :
<ol><li><b>règle d’échantillonnage</b> : quel bras $A_t$ tirer au temps $t$ ;</li>
<li><b>règle d’arrêt</b> : à l’instant $\tau$, arrêter de tirer (on pense avoir trouvé le meilleur bras) ;</li>
<li><b>règle de recommandation</b> : le bras de meilleure moyenne empirique à l’arrêt, $\hat a_\tau=\arg\max_a\hat\mu_a(\tau)$.</li></ol>
Objectifs : $\mathbb P(\hat a_\tau=a^*)\ge1-\delta$, et $\mathbb E[\tau]$ petit (par exemple le nombre de patients exposés à un mauvais traitement).</div>
<p>Cela ressemble à de l’exploration pure, mais le but n’est plus de maximiser le gain ; et contrairement à l’exploration pure du début du chapitre, la durée $\tau$ n’est pas fixée à l’avance : elle dépend des données.</p>
<h4>3. L’algorithme LUCB (slide 98)</h4>
<p>LUCB utilise les deux bornes de l’intervalle de confiance de chaque $\mu_a$, $LCB_a$ (inférieure) et $UCB_a$ (supérieure). À chaque tour :</p>
<ol><li>tirer <b>deux</b> bras bien choisis : $u_t$ (« best upper ») et $\ell_t$ (« best lower among the others ») ;</li>
<li>s’arrêter quand les intervalles du bras optimal et des bras sous-optimaux sont bien séparés : la <b>LCB du meilleur dépasse les UCB de tous les autres</b>.</li></ol>
<p>Lecture usuelle de la règle de tirage : $u_t$ est le leader empirique (celui qu’on s’apprête à recommander, dont il faut remonter la LCB), $\ell_t$ est, parmi les autres, le bras de plus grande UCB (le concurrent le plus menaçant, dont il faut abaisser l’UCB). Le libellé de la slide est elliptique ; à confirmer avec le Prof. Siebert (slide 98). La figure (source Emilie Kaufmann) montre les intervalles de cinq bras : les deux premiers, souvent tirés, ont des intervalles courts ; les autres, peu tirés, ont des intervalles longs mais nettement sous le meilleur.</p>
<h4>4. Exemple calculé</h4>
<p>Pour l’exercice, prenons des intervalles de Hoeffding à $\delta=0{,}05$, de demi-largeur $\sqrt{\ln(1/\delta)/(2N)}$ ($\ln20\approx2{,}996$). Le cours ne fixe pas la largeur exacte de LUCB, qui doit en pratique tenir compte du nombre de bras et du temps.</p>
<ol><li>Leader : $\hat\mu_1=0{,}70$, $N_1=200$ : demi-largeur $\sqrt{2{,}996/400}\approx0{,}087$, $LCB_1\approx0{,}613$.</li>
<li>Concurrent : $\hat\mu_2=0{,}55$, $N_2=150$ : demi-largeur $\sqrt{2{,}996/300}\approx0{,}100$, $UCB_2\approx0{,}650$.</li>
<li>$0{,}613<0{,}650$ : les intervalles se chevauchent, on continue en tirant ces deux bras.</li></ol>
<h4>5. Pièges</h4>
<ul><li>$\delta$ est la probabilité tolérée de recommander un mauvais bras, pas un écart entre moyennes ni une proportion d’exploration.</li>
<li>Un bon algorithme de regret n’est pas forcément un bon algorithme d’identification : il tire très peu les bras sous-optimaux, donc les connaît mal.</li>
<li>La recommandation se fait sur la moyenne empirique au temps $\tau$, pas sur le bras le plus tiré.</li></ul>
<p><b>Lien finance.</b> Choisir, après un pilote, la stratégie de recouvrement à déployer sur tout le portefeuille, quand le résultat du pilote lui-même compte peu : c’est de l’identification du meilleur bras. Si au contraire chaque dossier du pilote compte (les montants récupérés pendant le test), c’est la minimisation du regret.</p>
<p><b>À retenir</b></p>
<ul><li>Objectif : $\mathbb P(\hat a_\tau=a^*)\ge1-\delta$ avec $\mathbb E[\tau]$ petit.</li>
<li>Trois règles : échantillonnage, arrêt, recommandation $\hat a_\tau=\arg\max_a\hat\mu_a(\tau)$.</li>
<li>LUCB : tirer le leader et son concurrent le plus menaçant ; arrêt quand $LCB$ du meilleur $>$ $UCB$ de tous les autres.</li></ul>`,
      },
    ],

    cards: [
      ['bd-setting', 'dilemme', R`Quel est le dilemme fondamental du bandit ?`, R`Exploiter le meilleur bras connu ou explorer d’autres bras qui pourraient être meilleurs.`],
      ['bd-setting', 'rl', R`En quoi le bandit est-il un prototype de l’apprentissage par renforcement ?`, R`Il n’y a qu’un seul état : le choix présent ne modifie ni les choix ni les gains futurs ; une action à la fois, sans planification.`],
      ['bd-setting', 'clinique', R`Pourquoi l’approche « 500 patients A, 500 patients B » est-elle dangereuse ?`, R`Si un traitement est mortel, 500 patients en meurent. Un bandit choisit séquentiellement et délaisse vite le mauvais traitement.`],
      ['bd-setting', 'politique', R`Qu’est-ce qu’une politique dans un problème de bandit ?`, R`Une fonction qui associe à l’historique $H_t=\{A_1,X_1,\dots,A_t,X_t\}$ le prochain bras $A_{t+1}$.`],
      ['bd-setting', 'stochastique', R`Bandit stochastique stationnaire ?`, R`$X_t\sim\nu_{A_t}$ indépendamment du passé (stochastique), avec des lois $\nu_a$ qui ne changent pas dans le temps (stationnaire).`],
      ['bd-setting', 'hyp', R`Trois hypothèses du bandit stochastique ?`, R`On n’observe que le gain du bras tiré ; gains i.i.d. ; gains bornés.`],
      ['bd-setting', 'mu-vs-muhat', R`Différence entre $\mu_a$ et $\hat\mu_a(t)$ ?`, R`$\mu_a=\int t\,d\nu_a(t)$ est la moyenne théorique, inconnue ; $\hat\mu_a(t)$ est la moyenne des gains observés du bras $a$ jusqu’au temps $t$, qui l’estime.`],
      ['bd-setting', 'bernoulli', R`Casino de Bernoulli : loi du gain du bras $a$ ?`, R`$X_t\sim\mathcal B(\mu_a)$ : gain 1 avec probabilité $\mu_a$, 0 avec probabilité $1-\mu_a$. $\mu_a$ est à la fois le paramètre et la moyenne.`],
      ['bd-setting', 'esperance', R`Une politique tire en moyenne les bras $N=(900\,;70\,;30)$ fois, de moyennes $\mu=(0{,}30\,;0{,}25\,;0{,}10)$. $\mathbb E[S_n]$ ?`, R`$0{,}30\times900+0{,}25\times70+0{,}10\times30=290{,}5$.`],
      ['bd-regret', 'regret', R`Définition du regret espéré ?`, R`$R_n(\pi)=n\mu^*-\mathbb E_\pi[\sum_{t=1}^nX_t]$.`],
      ['bd-regret', 'decomp', R`Décomposition du regret ?`, R`$R_n=\sum_a\Delta_a\mathbb E[N_a(n)]$, avec $\Delta_a=\mu^*-\mu_a$ et $N_a(n)$ le nombre de tirages du bras $a$.`],
      ['bd-regret', 'sublin', R`Que veut-on pour $R_n/n$, et pourquoi ?`, R`$R_n/n\to0$ : le gain moyen par tour converge vers $\mu^*$, donc la stratégie finit par identifier le meilleur bras.`],
      ['bd-regret', 'Na-alea', R`Pourquoi $N_a(n)$ est-il aléatoire même pour une politique déterministe ?`, R`Parce que les choix dépendent des gains observés, qui sont aléatoires.`],
      ['bd-regret', 'gap', R`Que désigne $\Delta_a$ et comment l’appelle-t-on ?`, R`$\Delta_a=\mu^*-\mu_a\ge0$ : le regret instantané, ou écart de sous-optimalité (<i>suboptimality gap</i>). C’est le coût moyen d’un tirage du bras $a$ ; nul pour le meilleur bras.`],
      ['bd-regret', 'preuve', R`Les trois ingrédients de la preuve de $R_n=\sum_a\Delta_a\mathbb E[N_a(n)]$ ?`, R`(1) $\sum_a\mathbb 1\{A_t=a\}=1$ ; (2) linéarité de l’espérance ; (3) conditionner sur $A_t$ : $\mathbb E[(\mu^*-X_t)\mathbb 1\{A_t=a\}\mid A_t]=\mathbb 1\{A_t=a\}\Delta_a$.`],
      ['bd-regret', 'croissant', R`Pourquoi $R_n$ est-il croissant en $n$ ?`, R`Chaque tour ajoute un manque à gagner moyen $\mu^*-\mu_{A_t}\ge0$. La question est sa vitesse de croissance (linéaire, $\sqrt n$, $\log n$).`],
      ['bd-regret', 'optimal', R`Regret optimal (slide 24) ?`, R`$R^*=\min_\pi\mathbb E[R_n(\pi)]=\min_\pi\sum_{t=1}^n(\mu^*-\mu_{\pi(t)})$ : le plus petit regret espéré atteignable à l’horizon $n$.`],
      ['bd-naive', 'pure-explo', R`Regret de l’exploration pure ?`, R`$\frac nK\sum_a\Delta_a$ : linéaire.`],
      ['bd-naive', 'ftl', R`Pourquoi Follow the Leader a-t-il un regret linéaire ?`, R`Il peut se bloquer sur un mauvais bras après un premier tirage malchanceux : regret $\approx(1-\mu_1)\mu_2(\mu_1-\mu_2)n$ dans le cas Bernoulli à 2 bras.`],
      ['bd-naive', 'verrou', R`Follow the Leader, Bernoulli : le bras 1 donne 0 puis le bras 2 donne 1. Pourquoi ne revient-on jamais au bras 1 ?`, R`$\hat\mu_1=0$ n’est plus mis à jour, alors que $\hat\mu_2\ge1/N_2>0$ contient toujours le succès initial : le bras 2 reste leader pour toujours.`],
      ['bd-naive', 'signe', R`La slide 34 écrit le regret de l’exploitation pure avec $(\mu_2-\mu_1)n$. Que retenir ?`, R`Avec le bras 1 meilleur, ce facteur est négatif : on retient l’écart $\Delta=\mu_1-\mu_2>0$, soit $(1-\mu_1)\mu_2(\mu_1-\mu_2)n$. À confirmer avec le Prof. Siebert.`],
      ['bd-naive', 'convention', R`Quelle convention le cours adopte-t-il pour les bras, et pourquoi est-elle sans perte de généralité ?`, R`$\mu^*=\mu_1\ge\mu_2\ge\dots\ge\mu_K$ : on renumérote les bras, ce qui ne change rien puisque l’agent ignore cet ordre.`],
      ['bd-etc', 'algo', R`Algorithme Explore-Then-Commit ?`, R`Tirer $m$ fois chaque bras, puis jouer jusqu’au bout le meilleur bras empirique $\hat a=\arg\max\hat\mu_a(m)$.`],
      ['bd-etc', 'ENa', R`Borne sur $\mathbb E[N_a(n)]$ pour ETC ?`, R`$\mathbb E[N_a(n)]\le m+n\,e^{-m\Delta^2/2}$ (Hoeffding unilatéral sur $Z=Y_a-Y_1\in[-1,1]$).`],
      ['bd-etc', 'm-opt', R`Valeur optimale de $m$ pour ETC et regret obtenu ?`, R`$m=\frac2{\Delta^2}\log\frac{n\Delta^2}2$ ; regret logarithmique, pour 2 bras $R(n)\le\frac2\Delta(\log\frac{n\Delta^2}2+1)$.`],
      ['bd-etc', 'limite', R`Limite principale d’ETC et la parade ?`, R`Il faut connaître $\Delta$. ETC séquentiel : explorer jusqu’à ce que $|\hat\mu_1-\hat\mu_2|>\sqrt{4\log(n/t)/t}$, regret $\frac2\Delta\log n+C\sqrt{\log n}$.`],
      ['bd-etc', 'derive', R`Comment obtient-on $m^*$ pour ETC à 2 bras ?`, R`$R(m)\approx\Delta(m+n\,e^{-m\Delta^2/2})$ ; $\partial R/\partial m=0$ donne $e^{-m\Delta^2/2}=\frac2{n\Delta^2}$, donc $m^*=\frac2{\Delta^2}\log\frac{n\Delta^2}2$ et $R\le\frac2\Delta(\log\frac{n\Delta^2}2+1)$.`],
      ['bd-etc', 'hoeff-bras', R`Hoeffding pour un bras : un bras de moyenne $\mu$ tiré $s$ fois. Borne sur $\mathbb P[\hat\mu(s)\le\mu-\epsilon]$ ?`, R`$e^{-2s\epsilon^2}$ (gains dans $[0,1]$). Exemple : $s=50$, $\epsilon=0{,}1$ donne $e^{-1}\approx0{,}37$.`],
      ['bd-etc', 'efficace', R`Qu’attend-on d’un algorithme « efficace » (slide 37) ?`, R`Un regret sous-linéaire pour tout problème de bandit, idéalement $O(\sqrt n)$ ou $O(\ln n)$.`],
      ['bd-lower', 'efficace', R`Définition d’un algorithme de bandit « efficace » ?`, R`Il a un regret sous-linéaire pour tout problème de bandit.`],
      ['bd-lower', 'lai', R`Théorème de Lai et Robbins ?`, R`Pour tout algorithme efficace et tout bras sous-optimal : $\liminf\frac{\mathbb E[N_a(n)]}{\log n}\ge\frac1{D_{KL}(\nu_a\|\nu^*)}$. Le regret est au moins logarithmique.`],
      ['bd-lower', 'kl-bern', R`Divergence KL entre deux Bernoulli ?`, R`$d(\mu_a;\mu_b)=\mu_a\log\frac{\mu_a}{\mu_b}+(1-\mu_a)\log\frac{1-\mu_a}{1-\mu_b}$.`],
      ['bd-lower', 'interp', R`Que dit intuitivement la borne de Lai-Robbins ?`, R`Plus deux bras se ressemblent (KL petite), plus il faut de tirages pour les distinguer.`],
      ['bd-lower', 'regret-lb', R`Borne de Lai et Robbins écrite sur le regret ?`, R`$\liminf_{n\to\infty}\frac{R_n}{\log n}\ge\sum_a\frac{\Delta_a}{D_{KL}(\nu_a\|\nu^*)}$, par la décomposition $R_n=\sum_a\Delta_a\mathbb E[N_a(n)]$.`],
      ['bd-lower', 'asym', R`La KL est-elle symétrique ? Dans quel ordre l’écrit-on dans Lai-Robbins ?`, R`Non. On écrit $d(\mu_a;\mu_1)$, mauvais bras en premier. Exemple : $d(0{,}5;0{,}6)\approx0{,}0204$ mais $d(0{,}6;0{,}5)\approx0{,}0201$.`],
      ['bd-lower', 'vs-etc', R`Comparer ETC et Lai-Robbins pour 2 bras de Bernoulli.`, R`ETC : $\mathbb E[N_a]\approx\frac2{\Delta^2}\log n$. Lai-Robbins : au moins $\frac1{d(\mu_2;\mu_1)}\log n$, avec $d\ge\Delta^2$ (cours) et même $d\ge2\Delta^2$ (Pinsker). ETC est logarithmique mais avec une constante plus grande.`],
      ['bd-lower', 'conclusion', R`La borne de Lai et Robbins est-elle atteinte ?`, R`Lai et Robbins proposent une stratégie qui l’atteint, mais incalculable en pratique. Thompson sampling l’atteint pour les gains binaires.`],
      ['bd-egreedy', 'algo', R`ε-greedy ?`, R`Avec probabilité $1-\epsilon$, le meilleur bras empirique ; avec probabilité $\epsilon$, un bras uniforme parmi les $K$.`],
      ['bd-egreedy', 'regret', R`Regret de ε-greedy à ε fixe ?`, R`Linéaire : on explore une fraction $\epsilon$ du temps pour toujours. Un ε décroissant aide mais est difficile à régler.`],
      ['bd-egreedy', 'p-leader', R`ε-greedy : probabilité de jouer le leader empirique ?`, R`$1-\epsilon+\frac\epsilon K$ : le tirage uniforme peut aussi tomber sur le leader.`],
      ['bd-egreedy', 'cout', R`Coût par tour de ε-greedy quand le leader est le bon bras ?`, R`$\frac\epsilon K\sum_a\Delta_a$ : chaque mauvais bras est tiré avec probabilité $\epsilon/K$. Sur $n$ tours, environ $n\frac\epsilon K\sum_a\Delta_a$.`],
      ['bd-egreedy', 'greedy', R`Que devient ε-greedy avec $\epsilon=0$ ?`, R`La politique greedy, c’est-à-dire Follow the Leader : regret linéaire, car elle peut se bloquer sur un bras sous-optimal.`],
      ['bd-ucb', 'principe', R`Principe d’optimisme face à l’incertitude ?`, R`Supposer l’environnement aussi favorable que possible : jouer le bras de plus grande borne supérieure de confiance.`],
      ['bd-ucb', 'ucb1', R`Indice UCB1 ?`, R`$\hat\mu_a(t)+\sqrt{\frac{2\log t}{N_a(t)}}$ : exploitation + bonus d’exploration.`],
      ['bd-ucb', 'tous', R`Pourquoi UCB finit-il par tirer tous les bras ?`, R`Pour un bras non tiré, $\hat\mu_a$ et $N_a$ restent fixes mais $\log t$ croît : son indice augmente jusqu’à devenir le plus grand.`],
      ['bd-ucb', 'union', R`Pourquoi la construction d’UCB passe-t-elle par une union bound ?`, R`$N_a(t)$ est aléatoire : on borne sur toutes ses valeurs possibles $s=1..t$, ce qui transforme $1/t^2$ en $1/t$.`],
      ['bd-ucb', 'regret', R`Regret d’UCB ?`, R`$\mathbb E[N_a(n)]=O(\log n/\Delta_a^2)$ pour tout bras sous-optimal, donc $\mathbb E[R(n)]=O(\log n)$.`],
      ['bd-ucb', 'preuve', R`Deux cas de « mauvais tirage » dans la preuve d’UCB ?`, R`(1) le meilleur bras est fortement sous-estimé (probabilité $<1/t^\alpha$) ; (2) le bras $a$ est surestimé, ce qui impose $N_a<2\alpha\log t/\Delta_a^2$.`],
      ['bd-ucb', 'hoeff-delta', R`Comment passe-t-on de Hoeffding à $\sqrt{\log t/s}$ ?`, R`$\delta=e^{-2s\epsilon^2}$ donne $\epsilon=\sqrt{\log(1/\delta)/(2s)}$ ; avec $\delta=1/t^2$, $\log(1/\delta)=2\log t$ et $\epsilon=\sqrt{\log t/s}$.`],
      ['bd-ucb', 'tcl', R`Deux défauts de l’intervalle de confiance issu du TCL pour UCB ?`, R`Il est asymptotique, et on ne peut pas remplacer le nombre fixe $s$ de tirages par le nombre aléatoire $N_a(t)$ sans en payer le prix.`],
      ['bd-ucb', 'alpha', R`Candidat UCB avec $\delta=1/t^\alpha$ ? Quel $\alpha$ redonne UCB1 ?`, R`$\hat\mu_a(t)+\sqrt{\frac{\alpha\log t}{2N_a(t)}}$, vrai avec probabilité $\ge1-1/t^\alpha$ ($\alpha>1$). $\alpha=4$ donne $\sqrt{2\log t/N_a(t)}$.`],
      ['bd-ucb', 'klucb', R`Qu’est-ce que KL-UCB ?`, R`Une variante d’UCB pour les Bernoulli qui construit la borne avec l’inégalité de Chernoff au lieu de Hoeffding ; meilleure (slide 80).`],
      ['bd-thompson', 'post', R`Loi a posteriori d’un bras de Bernoulli avec a priori uniforme ?`, R`$\mathrm{Beta}(S_a+1,\ N_a-S_a+1)$ avec $S_a$ succès en $N_a$ tirages.`],
      ['bd-thompson', 'conj', R`Pourquoi dit-on que la Beta est conjuguée de la Bernoulli ?`, R`A priori Beta × vraisemblance Bernoulli = a posteriori Beta : une observation $x$ donne $\mathrm{Beta}(\alpha+x,\beta+1-x)$.`],
      ['bd-thompson', 'algo', R`Thompson sampling ?`, R`À chaque tour, tirer $\theta_a\sim\pi_a(t)$ pour chaque bras, jouer $\arg\max_a\theta_a$, mettre à jour l’a posteriori.`],
      ['bd-thompson', 'vs-ucb', R`Thompson vs UCB : différence de philosophie ?`, R`UCB joue le modèle le plus optimiste ; Thompson joue un modèle plausible tiré au hasard dans l’a posteriori. Thompson atteint la borne de Lai-Robbins (gains binaires).`],
      ['bd-thompson', 'moyenne', R`Moyenne de l’a posteriori après $S$ succès en $N$ tirages (a priori uniforme) ?`, R`$\frac{S+1}{N+2}$, la moyenne de $\mathrm{Beta}(S+1,N-S+1)$. Exemple : 7 succès sur 10 donnent $8/12\approx0{,}667$.`],
      ['bd-thompson', 'plat', R`Que signifie une a posteriori plate, une a posteriori pointue ?`, R`Plate : bras peu tiré, $\mu_a$ mal connu, $\theta_a$ peut sortir très haut ou très bas. Pointue : bras souvent tiré, $\mu_a$ bien estimé.`],
      ['bd-thompson', 'freq-bayes', R`Fréquentiste ou bayésien : comment chacun voit-il $\mu_a$ ?`, R`Fréquentiste : paramètre inconnu fixe, estimé par moyenne empirique et intervalle de confiance. Bayésien : réalisation d’une variable aléatoire dont on met à jour la loi.`],
      ['bd-bai', 'obj', R`Objectif de l’identification du meilleur bras ?`, R`$\mathbb P(\hat a_\tau=a^*)\ge1-\delta$ avec un nombre de tirages $\mathbb E[\tau]$ le plus petit possible.`],
      ['bd-bai', 'regles', R`Les trois règles d’un algorithme d’identification du meilleur bras ?`, R`Règle d’échantillonnage, règle d’arrêt, règle de recommandation.`],
      ['bd-bai', 'lucb', R`Critère d’arrêt de LUCB ?`, R`La borne inférieure du meilleur bras dépasse les bornes supérieures de tous les autres.`],
      ['bd-bai', 'vs-regret', R`Essai clinique : regret ou identification du meilleur bras ?`, R`Regret : guérir le plus de patients pendant l’étude. Identification : trouver le meilleur traitement le plus vite possible, sans objectif thérapeutique immédiat pour les patients de l’étude.`],
      ['bd-bai', 'reco', R`Règle de recommandation à l’arrêt $\tau$ ?`, R`$\hat a_\tau=\arg\max_a\hat\mu_a(\tau)$ : le bras de meilleure moyenne empirique au moment de l’arrêt.`],
      ['bd-bai', 'lucb-tirage', R`Quels bras LUCB tire-t-il à chaque tour ?`, R`Deux bras : $u_t$, le leader empirique, et $\ell_t$, parmi les autres, le concurrent de plus grande borne supérieure (lecture usuelle de la slide 98).`],
    ],

    quiz: [
      ['bd-setting', R`Dans un bandit, après avoir tiré le bras 2, l’agent observe :`, ['uniquement le gain du bras 2', 'les gains de tous les bras', 'les moyennes μa', 'le meilleur bras'], 0, R`Information partielle : c’est ce qui crée le dilemme exploration / exploitation.`],
      ['bd-setting', R`Un A/B test de deux bannières publicitaires, récompense = clic, est un bandit :`, ['stochastique à 2 bras de Bernoulli', 'à un seul bras', 'déterministe', 'à espace d’états continu'], 0, R`Chaque bannière a une probabilité de clic inconnue $\mu_a$.`],
      ['bd-setting', R`Pourquoi maximise-t-on $\mathbb E[S_n]$ et pas $S_n$ ?`, ['S_n est aléatoire : rejouer donnerait un autre résultat', 'S_n est toujours nul', 'E[S_n] est connu', 'pour simplifier les calculs seulement'], 0, R`On ne peut maximiser qu’une quantité déterministe : l’espérance.`],
      ['bd-egreedy', R`ε-greedy avec ε = 0,1 et 5 bras. Probabilité de tirer un bras sous-optimal donné ?`, ['0,02', '0,1', '0,08', '0,9'], 0, R`Si ce bras n’est pas le leader empirique, il n’est tiré que par l’exploration, qui choisit uniformément parmi les 5 bras : $0{,}1/5=0{,}02$.`],
      ['bd-egreedy', R`Pourquoi ε-greedy à ε fixe a-t-il un regret linéaire ?`, ['il explore une fraction ε du temps, pour toujours', 'il ne tire jamais le meilleur bras', 'il ne tire chaque bras qu’une fois', 'il dépend de Δ'], 0, R`À chaque tour, une perte moyenne d’au moins $\frac\epsilon K\sum_a\Delta_a$.`],
      ['bd-regret', R`Bras de moyennes 0,9 ; 0,8 ; 0,5. Lequel contribue le plus au regret par tirage ?`, ['celui à 0,5', 'celui à 0,8', 'celui à 0,9', 'tous pareil'], 0, R`$\Delta=0{,}4$ contre $0{,}1$ ; le meilleur bras ne contribue pas.`],
      ['bd-naive', R`Quelle stratégie a un regret sous-linéaire ?`, ['UCB', 'exploration pure', 'Follow the Leader', 'ε-greedy avec ε fixe'], 0, R`Les trois autres ont un regret linéaire.`],
      ['bd-etc', R`Pourquoi ETC classique est-il peu réaliste ?`, ['le m optimal dépend de Δ, inconnu', 'il ne tire jamais le meilleur bras', 'son regret est linéaire', 'il exige des gains gaussiens'], 0, R`$m=\frac2{\Delta^2}\log\frac{n\Delta^2}2$ demande de connaître l’écart.`],
      ['bd-lower', R`Le théorème de Lai-Robbins est :`, ['une borne inférieure asymptotique sur le regret', 'une borne supérieure du regret d’UCB', 'une inégalité de concentration', 'une loi a posteriori'], 0, R`Aucun algorithme efficace ne fait mieux que $\log n$ (avec la constante en KL).`],
      ['bd-ucb', R`Bras A : $\hat\mu=0{,}6$, $N=50$. Bras B : $\hat\mu=0{,}5$, $N=5$. $t=55$. UCB1 joue :`, ['B', 'A', 'indifférent', 'aucun'], 0, R`A : $0{,}6+\sqrt{2\ln55/50}\approx0{,}6+0{,}40=1{,}00$. B : $0{,}5+\sqrt{2\ln55/5}\approx0{,}5+1{,}27=1{,}77$. B est trop peu connu.`],
      ['bd-thompson', R`Un bras a donné 7 succès sur 10 tirages (a priori uniforme). Son a posteriori ?`, ['Beta(8, 4)', 'Beta(7, 3)', 'Beta(7, 10)', 'Beta(11, 8)'], 0, R`$\mathrm{Beta}(S+1,N-S+1)=\mathrm{Beta}(8,4)$.`],
      ['bd-thompson', R`D’où vient l’exploration dans Thompson sampling ?`, ['du tirage aléatoire dans les a posteriori', 'd’un bonus en √(log t / N)', 'd’un paramètre ε', 'd’une phase d’exploration initiale'], 0, R`Un bras incertain (a posteriori plate) peut tirer un grand $\theta_a$.`],
      ['bd-bai', R`Dans l’identification du meilleur bras, on cherche avant tout à :`, ['trouver a* avec confiance 1 − δ en peu de tirages', 'maximiser le gain cumulé', 'minimiser le regret', 'tirer chaque bras autant de fois'], 0, R`L’objectif n’est plus le gain pendant l’expérience.`],
      // Ajouts (à la fin du tableau : les QCM se repèrent par leur rang)
      ['bd-setting', R`Le taux de réponse d’une même campagne de relance baisse nettement en période de crise. Quelle hypothèse du cours est mise en défaut ?`, ['la stationnarité des lois $\nu_a$', 'l’observation du seul bras tiré', 'le caractère borné des gains', 'l’existence d’un horizon $n$'], 0, R`Stationnaire signifie que les lois $\nu_a$ ne changent pas avec le temps. Un taux qui dépend de la conjoncture viole cette hypothèse ; les gains restent bornés (0 ou 1) et l’on n’observe toujours que le bras joué.`],
      ['bd-setting', R`Sur quelles informations une politique peut-elle fonder le choix de $A_{t+1}$ ?`, ['l’historique $H_t$ des bras tirés et des gains observés', 'les vraies moyennes $\mu_a$', 'les gains qu’auraient donnés les bras non tirés', 'le gain futur $X_{t+1}$'], 0, R`$\pi:H_t\mapsto A_{t+1}$. Les $\mu_a$ sont inconnues, les gains des bras non tirés ne sont jamais observés, et $X_{t+1}$ n’est révélé qu’après le choix.`],
      ['bd-regret', R`$\mu=(0{,}30\,;0{,}25\,;0{,}10)$, $\mathbb E[N]=(900\,;70\,;30)$. Regret $R_{1000}$ ?`, ['9,5', '20,5', '290,5', '0,0095'], 0, R`$\Delta=(0\,;0{,}05\,;0{,}20)$, $R=0{,}05\times70+0{,}20\times30=9{,}5$. 20,5 multiplie par $\mu_a$ au lieu de $\Delta_a$ ; 290,5 est $\mathbb E[S_n]$ ; 0,0095 est $R_n/n$.`],
      ['bd-regret', R`Une stratégie a un regret $R_n=3\sqrt n$. Que peut-on dire ?`, ['$R_n/n\to0$ : regret sous-linéaire', 'son regret est linéaire', '$R_n$ décroît avec $n$', 'elle ne tire jamais le meilleur bras'], 0, R`$R_n/n=3/\sqrt n\to0$ : le gain moyen par tour tend vers $\mu^*$. $R_n$ reste croissant, mais moins vite que $n$.`],
      ['bd-regret', R`Dans la preuve de $R_n=\sum_a\Delta_a\mathbb E[N_a(n)]$, pourquoi conditionner sur $A_t$ ?`, ['sachant $A_t=a$, le gain moyen du tour vaut $\mu_a$', 'parce que $A_t$ est indépendant de $X_t$', 'parce que $N_a(n)$ est déterministe', 'parce que $\Delta_a$ est aléatoire'], 0, R`$\mathbb E[(\mu^*-X_t)\mathbb 1\{A_t=a\}\mid A_t]=\mathbb 1\{A_t=a\}(\mu^*-\mu_a)$. $X_t$ dépend justement de $A_t$, $N_a(n)$ est aléatoire et $\Delta_a$ est fixe.`],
      ['bd-naive', R`Exploration pure, $K=4$, $n=4000$, écarts $\Delta=(0\,;0{,}1\,;0{,}1\,;0{,}2)$. Regret ?`, ['400', '1600', '100', '0,4'], 0, R`Chaque bras est tiré $4000/4=1000$ fois : $R=1000\times(0+0{,}1+0{,}1+0{,}2)=400$. 1600 oublie de diviser par $K$ ; 0,4 est la somme des écarts seule.`],
      ['bd-naive', R`Follow the Leader, Bernoulli : le premier tirage du bras 1 donne 0, celui du bras 2 donne 1. Pourquoi l’algorithme ne revient-il jamais au bras 1 ?`, ['$\hat\mu_1=0$ reste figé et $\hat\mu_2>0$ pour toujours', 'une règle élimine le bras 1', '$\hat\mu_2$ ne fait que croître', 'Hoeffding interdit de revenir au bras 1'], 0, R`Le bras 1 n’étant plus tiré, $\hat\mu_1$ reste à 0 ; $\hat\mu_2$ peut baisser, mais reste $\ge1/N_2>0$ grâce au succès initial.`],
      ['bd-naive', R`Follow the Leader, $\mu_1=0{,}6$, $\mu_2=0{,}5$, $n=1000$. Contribution du scénario d’enfermement au regret ?`, ['20', '−20', '100', '50'], 0, R`$(1-0{,}6)\times0{,}5\times(0{,}6-0{,}5)\times1000=20$. −20 recopie le facteur $(\mu_2-\mu_1)$ de la slide 34, négatif (à confirmer avec le Prof. Siebert) ; 50 est le regret de l’exploration pure.`],
      ['bd-etc', R`ETC à 2 bras, $\Delta=0{,}1$, $n=10\,000$, $m=m^*\approx782$. Borne sur la probabilité de s’engager sur le mauvais bras ?`, ['0,02', '0,37', '0,5', '2'], 0, R`En $m^*$, $e^{-\Delta^2m^*/2}=\frac2{n\Delta^2}=\frac2{100}=0{,}02$. 0,37 est $e^{-1}$, sans lien ici ; 2 n’est pas une probabilité.`],
      ['bd-etc', R`Dans ETC, la borne de Hoeffding s’écrit $e^{-mx^2/2}$ et non $e^{-2mx^2}$. Pourquoi ?`, ['$Z=Y_a-Y_1$ vit dans $[-1,1]$, intervalle de largeur 2', 'on utilise le TCL au lieu de Hoeffding', 'parce que $K=2$', 'parce que les gains sont gaussiens'], 0, R`Hoeffding divise l’exposant par le carré de la largeur de l’intervalle : $e^{-2mx^2/2^2}=e^{-mx^2/2}$. Pour des variables dans $[0,1]$, largeur 1, on retrouve $e^{-2mx^2}$.`],
      ['bd-etc', R`On applique ETC avec $\Delta=0{,}3$ alors que le vrai écart est $0{,}1$. Conséquence ?`, ['$m$ trop court : risque élevé de s’engager sur le mauvais bras, regret proche du linéaire', '$m$ trop long : exploration gaspillée', 'aucun effet, ETC ne dépend pas de $\Delta$', 'le regret devient nul'], 0, R`$m^*\propto1/\Delta^2$ : surestimer l’écart raccourcit l’exploration. La probabilité d’erreur $e^{-m\Delta_{vrai}^2/2}$ reste grande, et chaque erreur coûte $\Delta$ par tour jusqu’à $n$.`],
      ['bd-etc', R`Qu’est-ce qui remplace la connaissance de $\Delta$ dans ETC séquentiel ?`, ['une règle d’arrêt sur l’écart observé $|\hat\mu_1-\hat\mu_2|$', 'un tirage aléatoire de bras', 'une loi a priori sur $\Delta$', 'un paramètre $\epsilon$'], 0, R`On explore jusqu’à $|\hat\mu_1(t)-\hat\mu_2(t)|>\sqrt{4\log(n/t)/t}$ : la durée s’adapte à l’écart réel, et le regret reste $\frac2\Delta\log n+C\sqrt{\log n}$.`],
      ['bd-lower', R`$\mu_1=0{,}6$, $\mu_2=0{,}5$, $d(0{,}5;0{,}6)\approx0{,}0204$, $n=10\,000$. Ordre de grandeur imposé à $\mathbb E[N_2(n)]$ par Lai et Robbins ?`, ['environ 451', 'environ 0,19', 'environ 204', 'environ 49'], 0, R`$\ln n/d\approx9{,}21/0{,}0204\approx451$ (asymptotique). 0,19 multiplie au lieu de diviser ; 204 vaut $n\times d$ ; 49 oublie $\log n$.`],
      ['bd-lower', R`L’algorithme « toujours jouer le bras 1 » a un regret nul quand le bras 1 est le meilleur. Contredit-il Lai et Robbins ?`, ['non : il n’est pas efficace, son regret est linéaire si le bras 2 est meilleur', 'oui, la borne est donc fausse', 'non, car la KL est nulle', 'oui, sauf pour les Bernoulli'], 0, R`La borne vaut pour les algorithmes efficaces, sous-linéaires sur <b>tout</b> problème. Cet algorithme échoue sur le problème où les bras sont échangés.`],
      ['bd-lower', R`Deux paires de bras de Bernoulli de même écart 0,1 : (0,5 ; 0,6) et (0,05 ; 0,15). Laquelle est la plus difficile selon Lai et Robbins ?`, ['(0,5 ; 0,6), car sa KL est plus petite', '(0,05 ; 0,15), car ses moyennes sont plus petites', 'les deux, car l’écart est le même', 'aucune, la borne ne dépend que de $n$'], 0, R`$d(0{,}5;0{,}6)\approx0{,}0204<d(0{,}05;0{,}15)\approx0{,}0507$. La difficulté se lit dans la KL, pas dans l’écart seul : près de 0, une Bernoulli varie peu et se distingue plus vite.`],
      ['bd-egreedy', R`ε-greedy, $K=4$, $\epsilon=0{,}2$, le leader empirique est le bras 1. Probabilité de jouer le bras 1 ?`, ['0,85', '0,8', '0,95', '0,05'], 0, R`$1-\epsilon+\epsilon/K=0{,}8+0{,}2/4=0{,}85$. 0,8 oublie que le tirage uniforme peut retomber sur le leader ; 0,05 est la probabilité d’un autre bras donné.`],
      ['bd-egreedy', R`Avec $\epsilon=0$, ε-greedy devient :`, ['Follow the Leader (exploitation pure)', 'l’exploration pure', 'UCB1', 'Thompson sampling'], 0, R`Sans exploration, on joue toujours le leader empirique : regret linéaire par enfermement possible sur un mauvais bras (slide 60, « greedy »).`],
      ['bd-ucb', R`Dans UCB1, un bras n’est pas tiré entre $t=100$ et $t=10\,000$. Son bonus est multiplié par :`, ['$\sqrt2\approx1{,}41$', '1 (il reste constant)', '100', '0,5'], 0, R`$N_a$ ne change pas et $\ln10\,000/\ln100=2$, donc le bonus $\sqrt{2\ln t/N_a}$ est multiplié par $\sqrt2$. Il croît lentement, mais sans limite.`],
      ['bd-ucb', R`Le candidat UCB $\sqrt{\alpha\log t/(2N_a(t))}$ avec $\alpha=4$ :`, ['coïncide avec le bonus d’UCB1 $\sqrt{2\log t/N_a(t)}$', 'vaut le double du bonus d’UCB1', 'ne dépend plus de $t$', 'donne ε-greedy'], 0, R`$\frac{4\log t}{2N_a}=\frac{2\log t}{N_a}$.`],
      ['bd-ucb', R`Pourquoi l’intervalle de confiance issu du TCL ne suffit-il pas pour UCB ?`, ['il est asymptotique et ne tient pas tel quel avec un nombre aléatoire de tirages $N_a(t)$', 'il exige des gains gaussiens', 'il donne une borne inférieure', 'il dépend du nombre de bras $K$'], 0, R`Slide 66 : le TCL ne vaut que pour $s$ grand et fixe. Hoeffding est non asymptotique, et l’union bound traite le caractère aléatoire de $N_a(t)$.`],
      ['bd-ucb', R`Dans l’esquisse de preuve, hors événements rares, un bras sous-optimal n’est rejoué que si :`, ['$N_a<2\alpha\log t/\Delta_a^2$', '$N_a>2\alpha\log t/\Delta_a^2$', '$\Delta_a=0$', '$\hat\mu_a=\mu_a$ exactement'], 0, R`Le tirage impose $UCB_a>\Delta_a/2$, soit $\sqrt{\alpha\log t/(2N_a)}>\Delta_a/2$, d’où $N_a<2\alpha\log t/\Delta_a^2$ : au-delà, le bras n’est plus joué.`],
      ['bd-thompson', R`Bras A : 60 succès en 100 tirages ; bras B : 1 succès en 3 (a priori uniformes). Que fait Thompson sampling au tour suivant ?`, ['il joue B environ une fois sur cinq, car $\mathrm{Beta}(2,3)$ est plate', 'il joue toujours A, de plus grande moyenne a posteriori', 'il joue toujours B, le moins tiré', 'il joue A et B une fois sur deux'], 0, R`$\mathbb P(\theta_B>\theta_A)\approx0{,}19$ pour $\theta_A\sim\mathrm{Beta}(61,41)$ et $\theta_B\sim\mathrm{Beta}(2,3)$ (calcul numérique). Le choix est aléatoire, pondéré par la probabilité d’être le meilleur.`],
      ['bd-thompson', R`A priori $\mathrm{Beta}(2,2)$, on observe 1, 1, 0. A posteriori ?`, ['Beta(4, 3)', 'Beta(3, 2)', 'Beta(2, 1)', 'Beta(5, 4)'], 0, R`Chaque succès ajoute 1 à $\alpha$, chaque échec 1 à $\beta$ : $\mathrm{Beta}(2+2,\ 2+1)$. Beta(3, 2) correspond à l’a priori uniforme.`],
      ['bd-bai', R`LUCB : $LCB$ du leader $\approx0{,}61$, $UCB$ du concurrent le plus menaçant $\approx0{,}65$. Que fait l’algorithme ?`, ['il continue : les intervalles se chevauchent', 'il s’arrête et recommande le leader', 'il s’arrête et recommande le concurrent', 'il élimine le leader'], 0, R`L’arrêt exige $LCB$ du meilleur $>$ $UCB$ de tous les autres. $0{,}61<0{,}65$ : on tire encore ces deux bras pour resserrer leurs intervalles.`],
      ['bd-bai', R`Une banque veut choisir, après un pilote, la stratégie de recouvrement à déployer sur tout son portefeuille ; les montants récupérés pendant le pilote importent peu. Quel objectif ?`, ['identification du meilleur bras', 'minimisation du regret', 'exploitation pure', 'ε-greedy à ε fixe'], 0, R`Seule compte la décision finale, avec une confiance $1-\delta$ et un pilote court. Si chaque dossier du pilote comptait, ce serait la minimisation du regret.`],
      ['bd-bai', R`En identification du meilleur bras, le paramètre $\delta$ est :`, ['la probabilité tolérée de recommander un mauvais bras', 'l’écart entre les deux meilleurs bras', 'la proportion d’exploration', 'le regret toléré'], 0, R`On exige $\mathbb P(\hat a_\tau=a^*)\ge1-\delta$. L’écart se note $\Delta$, la proportion d’exploration $\epsilon$.`],
    ],

    gens: {
      'bd-setting': [
        () => {
          const mus = [pick([0.3, 0.35, 0.4]), pick([0.2, 0.25]), pick([0.1, 0.15])], n = pick([500, 1000, 2000]);
          const N2 = rnd(5, 15) * n / 100, N3 = rnd(1, 5) * n / 100, N1 = n - N2 - N3, Ns = [N1, N2, N3];
          const e = mus.reduce((s, m, i) => s + m * Ns[i], 0);
          return { q: R`Trois stratégies de relance de taux de paiement $\mu=(${mus.map(m => f(m, 2)).join('\\,;')})$ (valeurs d’exercice). Une politique les utilise en moyenne $N=(${Ns.join('\\,;')})$ fois sur $n=${n}$ clients. Gain cumulé espéré $\mathbb E[S_n]$ ?`, a: e, tol: 0.05,
            expl: R`$\mathbb E[S_n]=\sum_a\mu_a\mathbb E[N_a]=${mus.map((m, i) => `${f(m, 2)}\\times${Ns[i]}`).join('+')}=${f(e, 2)}$. Le meilleur possible serait $n\mu^*=${f(n * mus[0], 2)}$.` };
        },
      ],
      'bd-regret': [
        () => {
          const mus = [0.9, pick([0.8, 0.7]), pick([0.6, 0.5, 0.4])], Ns = [rnd(500, 900), rnd(20, 80), rnd(5, 30)];
          const r = mus.reduce((s, m, i) => s + (mus[0] - m) * Ns[i], 0);
          return { q: R`Moyennes $\mu=(${mus.map(m => f(m, 1)).join(' ; ')})$, nombres moyens de tirages $\mathbb E[N_a]=(${Ns.join(' ; ')})$. Regret espéré ?`, a: r, tol: 0.05,
            expl: R`$R_n=\sum_a\Delta_a\mathbb E[N_a]=0\times${Ns[0]}+${f(mus[0] - mus[1], 1)}\times${Ns[1]}+${f(mus[0] - mus[2], 1)}\times${Ns[2]}=${f(r, 1)}$.` };
        },
        () => {
          const m1 = pick([0.5, 0.6, 0.7]), m2 = m1 - pick([0.05, 0.1, 0.2]), n = pick([1000, 5000, 10000]), N2 = rnd(2, 20) * n / 100;
          const es = m1 * (n - N2) + m2 * N2, r = n * m1 - es;
          return { q: R`Deux variantes d’une offre, taux de conversion $\mu_1=${f(m1, 2)}$ et $\mu_2=${f(m2, 2)}$ (valeurs d’exercice). Sur $n=${n}$ clients, une politique envoie en moyenne $${N2}$ clients vers la variante 2. Regret par client $R_n/n$ ? (4 décimales)`, a: r / n, tol: 0.0001,
            expl: R`$R_n=n\mu^*-\mathbb E[S_n]=${n}\times${f(m1, 2)}-${f(es, 2)}=${f(r, 2)}$, ou directement $\Delta_2\,\mathbb E[N_2]=${f(m1 - m2, 2)}\times${N2}$. Par client : $${f(r, 2)}/${n}=${f(r / n, 4)}$.` };
        },
      ],
      'bd-naive': [
        () => {
          const K = pick([2, 3, 4]);
          const gaps = [0]; for (let i = 1; i < K; i++) gaps.push(pick([0.05, 0.1, 0.15, 0.2]));
          const n = K * pick([250, 500, 1000]), sum = gaps.reduce((s, g) => s + g, 0), r = n / K * sum;
          return { q: R`Exploration pure : $K=${K}$ bras d’écarts $\Delta=(${gaps.map(g => f(g, 2)).join('\\,;')})$, budget $n=${n}$. Regret $R_n$ ?`, a: r, tol: 0.05,
            expl: R`Chaque bras est tiré $n/K=${n / K}$ fois : $R_n=\frac nK\sum_a\Delta_a=${n / K}\times${f(sum, 2)}=${f(r, 2)}$. Linéaire en $n$ : seuls les écarts comptent, pas les moyennes elles-mêmes.` };
        },
        () => {
          const m1 = pick([0.5, 0.6, 0.7, 0.8]), m2 = m1 - pick([0.1, 0.2]), n = pick([1000, 5000, 10000]);
          const r = (1 - m1) * m2 * (m1 - m2) * n;
          return { q: R`Follow the Leader, Bernoulli à 2 bras : $\mu_1=${f(m1, 1)}$, $\mu_2=${f(m2, 1)}$, $n=${n}$. Contribution au regret du scénario « premier tirage du bras 1 = 0, premier tirage du bras 2 = 1 » ?`, a: r, tol: 0.5,
            expl: R`Probabilité du scénario $(1-\mu_1)\mu_2=${f(1 - m1, 1)}\times${f(m2, 1)}=${f((1 - m1) * m2, 2)}$ ; ensuite le bras 2 est joué de l’ordre de $n$ fois, à un coût $\Delta=${f(m1 - m2, 1)}$ par tour : $${f((1 - m1) * m2, 2)}\times${f(m1 - m2, 1)}\times${n}\approx${f(r, 1)}$.` };
        },
      ],
      'bd-etc': [
        () => {
          const d = pick([0.1, 0.2, 0.3]), n = pick([1000, 10000, 100000]);
          const m = 2 / (d * d) * Math.log(n * d * d / 2);
          return { q: R`ETC à 2 bras, $\Delta=${f(d, 1)}$, horizon $n=${n}$. Durée d’exploration optimale $m=\frac2{\Delta^2}\log\frac{n\Delta^2}2$ ? (arrondi à l’unité)`, a: m, tol: 1,
            expl: R`$\frac2{${f(d * d, 2)}}\ln(${f(n * d * d / 2, 1)})\approx${f(m, 0)}$ tirages par bras.` };
        },
        () => {
          const d = pick([0.05, 0.1, 0.2]), n = pick([10000, 100000]);
          const L = Math.log(n * d * d / 2), r = 2 / d * (L + 1);
          return { q: R`ETC à 2 bras avec $m=m^*$, $\Delta=${f(d, 2)}$, $n=${n}$. Borne sur le regret $\frac2\Delta\big[\log\frac{n\Delta^2}2+1\big]$ ? (1 décimale)`, a: r, tol: 0.1,
            expl: R`$\frac{n\Delta^2}2=${f(n * d * d / 2, 2)}$, $\ln(\cdot)\approx${f(L, 3)}$ ; $\frac2{${f(d, 2)}}\times(${f(L, 3)}+1)\approx${f(r, 1)}$. L’exploration pure coûterait $\frac n2\Delta=${f(n / 2 * d, 1)}$.` };
        },
        () => {
          const mu = pick([0.4, 0.5, 0.6, 0.7]), s = pick([20, 50, 100, 200]), e = pick([0.05, 0.1, 0.15]);
          const p = Math.exp(-2 * s * e * e);
          return { q: R`Un bras de gains dans $[0,1]$, de moyenne $\mu=${f(mu, 1)}$, est tiré $s=${s}$ fois. Borne de Hoeffding sur $\mathbb P[\hat\mu(s)\le${f(mu - e, 2)}]$ ? (3 décimales)`, a: p, tol: 0.001,
            expl: R`$\epsilon=${f(mu, 1)}-${f(mu - e, 2)}=${f(e, 2)}$ et $\mathbb P[\hat\mu(s)\le\mu-\epsilon]\le e^{-2s\epsilon^2}=e^{-2\times${s}\times${f(e * e, 4)}}=e^{-${f(2 * s * e * e, 3)}}\approx${f(p)}$.` };
        },
        () => {
          const d = pick([0.1, 0.2]), n = pick([1000, 10000]), m = pick([50, 100, 200, 400]);
          const b = m + n * Math.exp(-m * d * d / 2);
          return { q: R`ETC à 2 bras, $\Delta=${f(d, 1)}$, $n=${n}$, $m=${m}$ tirages par bras. Borne $\mathbb E[N_2(n)]\le m+n\,e^{-m\Delta^2/2}$ ? (1 décimale)`, a: b, tol: 0.1,
            expl: R`$\frac{m\Delta^2}2=\frac{${m}\times${f(d * d, 2)}}2=${f(m * d * d / 2, 2)}$, $e^{-${f(m * d * d / 2, 2)}}\approx${f(Math.exp(-m * d * d / 2), 4)}$ ; $${m}+${n}\times${f(Math.exp(-m * d * d / 2), 4)}\approx${f(b, 1)}$. Regret correspondant : $\Delta\times${f(b, 1)}\approx${f(d * b, 1)}$.` };
        },
      ],
      'bd-thompson': [
        () => {
          const N = rnd(5, 40), S = rnd(0, N);
          return { q: R`A priori uniforme, ${S} succès en ${N} tirages. Moyenne de l’a posteriori $\mathrm{Beta}(\alpha,\beta)$, soit $\frac{\alpha}{\alpha+\beta}$ ? (3 décimales)`, a: (S + 1) / (N + 2), tol: 0.001,
            expl: R`$\mathrm{Beta}(${S + 1},${N - S + 1})$, moyenne $\frac{${S + 1}}{${N + 2}}=${f((S + 1) / (N + 2))}$ (règle de succession de Laplace).` };
        },
        () => {
          const a0 = rnd(1, 4), b0 = rnd(1, 4), k = rnd(3, 6), xs = Array.from({ length: k }, () => rnd(0, 1));
          const s = xs.reduce((u, v) => u + v, 0), a = a0 + s, b = b0 + k - s;
          const good = R`$\mathrm{Beta}(${a},${b})$`;
          const cands = [R`$\mathrm{Beta}(${s + 1},${k - s + 1})$`, R`$\mathrm{Beta}(${a0 + k - s},${b0 + s})$`, R`$\mathrm{Beta}(${a},${b0 + k})$`, R`$\mathrm{Beta}(${a + 1},${b + 1})$`];
          const opts = [good]; for (const c of cands) if (!opts.includes(c) && opts.length < 4) opts.push(c);
          return { q: R`A priori $\mathrm{Beta}(${a0},${b0})$ sur un bras de Bernoulli. On observe les gains ${xs.join(', ')}. Loi a posteriori ?`, opts, a: 0,
            expl: R`Conjugaison : chaque 1 ajoute 1 à $\alpha$, chaque 0 ajoute 1 à $\beta$. ${s} succès et ${k - s} échecs : $\mathrm{Beta}(${a0}+${s},\ ${b0}+${k - s})=\mathrm{Beta}(${a},${b})$, de moyenne $${f(a / (a + b))}$.` };
        },
      ],
      'bd-lower': [
        () => {
          const a = pick([0.3, 0.4, 0.5]), b = pick([0.6, 0.7, 0.8]);
          const d = a * Math.log(a / b) + (1 - a) * Math.log((1 - a) / (1 - b));
          return { q: R`KL entre Bernoulli : $d(${f(a, 1)};${f(b, 1)})$ en nats ? (3 décimales)`, a: d, tol: 0.002,
            expl: R`$${f(a, 1)}\ln\frac{${f(a, 1)}}{${f(b, 1)}}+${f(1 - a, 1)}\ln\frac{${f(1 - a, 1)}}{${f(1 - b, 1)}}=${f(d)}$. Lai-Robbins : au moins $\log n/${f(d)}$ tirages du mauvais bras.` };
        },
        () => {
          const m1 = pick([0.6, 0.7, 0.8]), ma = m1 - pick([0.1, 0.2, 0.3]), n = pick([1000, 10000, 100000]);
          const d = ma * Math.log(ma / m1) + (1 - ma) * Math.log((1 - ma) / (1 - m1)), N = Math.log(n) / d;
          return { q: R`Bernoulli, meilleur bras $\mu_1=${f(m1, 1)}$, bras sous-optimal $\mu_a=${f(ma, 1)}$, $n=${n}$. Ordre de grandeur de Lai et Robbins pour $\mathbb E[N_a(n)]$, soit $\frac{\ln n}{d(\mu_a;\mu_1)}$ ? (arrondi à l’unité)`, a: N, tol: 1,
            expl: R`$d(${f(ma, 1)};${f(m1, 1)})=${f(ma, 1)}\ln\frac{${f(ma, 1)}}{${f(m1, 1)}}+${f(1 - ma, 1)}\ln\frac{${f(1 - ma, 1)}}{${f(1 - m1, 1)}}\approx${f(d, 4)}$ ; $\ln${n}\approx${f(Math.log(n), 2)}$ ; $\frac{${f(Math.log(n), 2)}}{${f(d, 4)}}\approx${f(N, 0)}$. Regret correspondant $\approx\Delta_a\times${f(N, 0)}=${f((m1 - ma) * N, 1)}$ (asymptotique, ordre de grandeur).` };
        },
      ],
      'bd-egreedy': [
        () => {
          const K = pick([3, 4, 5, 10]), e = pick([0.05, 0.1, 0.2]), leader = pick([true, false]);
          const p = leader ? 1 - e + e / K : e / K;
          return { q: R`ε-greedy, $K=${K}$ bras, $\epsilon=${f(e, 2)}$. Probabilité de jouer au prochain tour un bras donné qui ${leader ? 'est' : 'n’est pas'} le leader empirique ? (4 décimales)`, a: p, tol: 0.0001,
            expl: leader ? R`Le leader est joué par exploitation (probabilité $1-\epsilon$) ou par le tirage uniforme ($\epsilon/K$) : $1-${f(e, 2)}+\frac{${f(e, 2)}}{${K}}=${f(p, 4)}$.` : R`Un bras qui n’est pas leader n’est joué que par l’exploration uniforme : $\frac\epsilon K=\frac{${f(e, 2)}}{${K}}=${f(p, 4)}$.` };
        },
        () => {
          const K = 3, e = pick([0.05, 0.1, 0.2]), g2 = pick([0.05, 0.1]), g3 = pick([0.2, 0.3]), n = pick([10000, 50000, 100000]);
          const r = n * e / K * (g2 + g3);
          return { q: R`ε-greedy, $K=3$, $\epsilon=${f(e, 2)}$, écarts $\Delta=(0\,;${f(g2, 2)}\,;${f(g3, 2)})$. Le leader est le bon bras dès le début. Regret dû à l’exploration sur $n=${n}$ tours ? (arrondi à l’unité)`, a: r, tol: 1,
            expl: R`Chaque mauvais bras est tiré avec probabilité $\epsilon/K$ par tour : coût $\frac{${f(e, 2)}}3\times(${f(g2, 2)}+${f(g3, 2)})=${f(e / K * (g2 + g3), 5)}$ par tour, soit $\approx${f(r, 0)}$ sur ${n} tours. Linéaire en $n$.` };
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
        () => {
          const t = pick([100, 1000, 10000]), b = pick([0.1, 0.2, 0.3, 0.5]);
          const N = Math.ceil(2 * Math.log(t) / (b * b));
          return { q: R`UCB1 à $t=${t}$. Combien de tirages $N_a$ faut-il au minimum pour que le bonus $\sqrt{2\ln t/N_a}$ soit au plus $${f(b, 1)}$ ? (entier)`, a: N, tol: 0,
            expl: R`$\sqrt{2\ln t/N}\le${f(b, 1)}\iff N\ge\frac{2\ln t}{${f(b, 1)}^2}=\frac{2\times${f(Math.log(t), 3)}}{${f(b * b, 2)}}\approx${f(2 * Math.log(t) / (b * b), 2)}$, donc $N=${N}$. Diviser le bonus par 2 demande 4 fois plus de tirages.` };
        },
        () => {
          const al = pick([2, 3, 4]), d = pick([0.1, 0.2, 0.3]), n = pick([1000, 10000, 100000]);
          const B = 2 * al * Math.log(n) / (d * d);
          return { q: R`Esquisse de preuve d’UCB avec $\delta=1/t^\alpha$, $\alpha=${al}$, $\Delta_a=${f(d, 1)}$, $n=${n}$. Au-delà de combien de tirages $\frac{2\alpha\ln n}{\Delta_a^2}$ le bras $a$ n’est-il plus rejoué (hors événements rares) ? (arrondi à l’unité)`, a: B, tol: 1,
            expl: R`$\frac{2\times${al}\times\ln${n}}{${f(d, 1)}^2}=\frac{${2 * al}\times${f(Math.log(n), 3)}}{${f(d * d, 2)}}\approx${f(B, 0)}$. Contribution au regret au plus $\Delta_a\times${f(B, 0)}\approx${f(d * B, 0)}$, plus une constante.` };
        },
      ],
      'bd-bai': [
        () => {
          const dl = pick([0.01, 0.05, 0.1]), m1 = pick([0.6, 0.65, 0.7, 0.75]), m2 = m1 - pick([0.1, 0.15, 0.2, 0.25]);
          const n1 = rnd(5, 40) * 10, n2 = rnd(5, 40) * 10, L = Math.log(1 / dl);
          const w1 = Math.sqrt(L / (2 * n1)), w2 = Math.sqrt(L / (2 * n2)), lcb = m1 - w1, ucb = m2 + w2, stop = lcb > ucb;
          return { q: R`Pour l’exercice, intervalles de Hoeffding de demi-largeur $\sqrt{\ln(1/\delta)/(2N)}$ avec $\delta=${f(dl, 2)}$. Leader : $\hat\mu_1=${f(m1, 2)}$, $N_1=${n1}$. Concurrent de plus grande UCB : $\hat\mu_2=${f(m2, 2)}$, $N_2=${n2}$. Que fait LUCB ?`,
            opts: [R`On s’arrête et on recommande le bras 1`, R`On continue en tirant les bras 1 et 2`], a: stop ? 0 : 1, keepOrder: true,
            expl: R`$LCB_1=${f(m1, 2)}-\sqrt{${f(L, 3)}/${2 * n1}}\approx${f(lcb, 3)}$ ; $UCB_2=${f(m2, 2)}+\sqrt{${f(L, 3)}/${2 * n2}}\approx${f(ucb, 3)}$. ${stop ? R`$LCB_1>UCB_2$ : intervalles séparés, arrêt.` : R`$LCB_1\le UCB_2$ : les intervalles se chevauchent, on continue.`}` };
        },
        () => {
          const dl = pick([0.01, 0.05, 0.1]), N = pick([50, 100, 200, 400, 1000]);
          const w = Math.sqrt(Math.log(1 / dl) / (2 * N));
          return { q: R`Demi-largeur de Hoeffding $\sqrt{\ln(1/\delta)/(2N)}$ d’un intervalle de confiance pour un bras tiré $N=${N}$ fois, $\delta=${f(dl, 2)}$ ? (3 décimales)`, a: w, tol: 0.001,
            expl: R`$\ln(1/${f(dl, 2)})\approx${f(Math.log(1 / dl), 3)}$ ; $\sqrt{${f(Math.log(1 / dl), 3)}/${2 * N}}\approx${f(w)}$. Elle vient de $\mathbb P[\hat\mu\le\mu-\epsilon]\le e^{-2N\epsilon^2}=\delta$.` };
        },
      ],
    },
  });
})();
