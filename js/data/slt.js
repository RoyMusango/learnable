// Chapitre 1 : Statistical Learning Theory I (X. Siebert, slides SLT1-NEW, cours du 19 octobre 2026).
// Les notes « Tes notes » reprennent les annotations du PDF ; « Relecture » corrige ou précise quand c'est utile.
(function () {
  const R = String.raw;
  const { pick, rnd, binom, f } = COURSE.u;

  COURSE.add({
    id: 'slt',
    title: 'Théorie statistique de l’apprentissage (I)',
    short: 'Théorie de l’apprentissage',
    source: 'SLT1-NEW.pdf · 109 slides',
    seen: '2026-10-19',
    pitch: 'Peut-on apprendre à partir d’un nombre fini d’exemples, et avec quelle garantie ? Risque, classifieur de Bayes, PAC-learning, Hoeffding, fonction de croissance, dimension VC.',
    sections: [
      {
        id: 'slt-prereq', title: 'Rappels et notations : la boîte à outils', slides: 'prérequis',
        summary: 'Variable aléatoire, loi, probabilité, espérance, indicatrice, échantillon i.i.d., estimation, ε et δ : le vocabulaire probabiliste sur lequel tout le chapitre est construit.',
        fiche: R`
<p>Ce chapitre parle de probabilités du début à la fin. Avant les théorèmes, voici chaque objet et chaque symbole, dans l’ordre où ils serviront, avec un exemple fil rouge : <b>une banque qui veut prédire si un client remboursera son crédit</b>.</p>
<h4>1. Variable aléatoire et loi</h4>
<div class="def"><b>Variable aléatoire</b> : une quantité dont la valeur dépend du hasard. On la note en <b>majuscule</b> ($X$, $Y$) ; une valeur observée se note en <b>minuscule</b> ($x$, $y$).<br>
Exemple : $X$ = le dossier du prochain client (revenu, âge, dettes…), $Y$ = 1 s’il fera défaut, 0 s’il rembourse.</div>
<div class="def"><b>Loi</b> (ou distribution) : la description complète du hasard, c’est-à-dire quelles valeurs sont possibles et avec quelles probabilités. On la note $P$. « $X\sim P$ » se lit « $X$ suit la loi $P$ ».</div>
<h4>2. Probabilité et probabilité conditionnelle</h4>
<p>$\mathbb P[A]$ : la probabilité de l’événement $A$, un nombre entre 0 et 1. Exemple : $\mathbb P[Y=1]=0{,}08$ si 8 % des clients font défaut.</p>
<p>$\mathbb P(A\mid B)$ se lit « probabilité de $A$ <b>sachant</b> $B$ » : on ne regarde que les cas où $B$ est vrai. Exemple : $\mathbb P(Y=1\mid X=x)$ est la probabilité de défaut <b>pour un client qui a exactement le dossier $x$</b> : 0,02 pour un dossier solide, 0,6 pour un dossier fragile.</p>
<h4>3. Espérance et variance</h4>
<div class="def"><b>Espérance</b> $\mathbb E[Z]$ : la moyenne théorique de $Z$, celle qu’on obtiendrait en moyennant une infinité de tirages. Si $Z$ vaut $z_k$ avec probabilité $p_k$ : $\mathbb E[Z]=\sum_kp_kz_k$, une somme pondérée (avec une densité, la somme devient une intégrale $\int z\,dP$). On écrit $\mathbb E_{X\sim P}[\cdot]$ pour préciser selon quelle loi on moyenne.<br>
<b>Variance</b> : $\mathrm{Var}(Z)=\mathbb E\big[(Z-\mathbb E[Z])^2\big]$, l’écart moyen au carré à la moyenne, c’est-à-dire la dispersion.</div>
<p>Exemple : pour un dé équilibré, $\mathbb E[Z]=\frac{1+2+3+4+5+6}{6}=3{,}5$, alors qu’aucun lancer ne donne 3,5.</p>
<h4>4. L’indicatrice : transformer un événement en nombre</h4>
<div class="def">$\mathbb 1[A]$ vaut 1 si $A$ est vrai, 0 sinon. Exemple : $\mathbb 1[g(x)\neq y]$ vaut 1 quand le classifieur $g$ se trompe sur l’exemple $(x,y)$.<br>
Deux propriétés qui reviendront sans cesse : la <b>moyenne</b> de plusieurs indicatrices est une <b>proportion</b> (la fraction d’erreurs), et l’<b>espérance</b> d’une indicatrice est une <b>probabilité</b> : $\mathbb E\big[\mathbb 1[A]\big]=\mathbb P[A]$.</div>
<h4>5. Échantillon i.i.d.</h4>
<div class="def"><b>i.i.d.</b> signifie <b>indépendants et identiquement distribués</b>. Des tirages $Z_1,\dots,Z_n$ sont i.i.d. s’ils sont
<ul><li><b>identiquement distribués</b> : chacun suit la même loi $P$ (les clients viennent de la même population) ;</li>
<li><b>indépendants</b> : connaître l’un n’apprend rien sur les autres (comme des lancers de dé successifs).</li></ul>
La loi de l’ensemble des $n$ tirages se note $P^n$.</div>
<div class="def"><b>L’échantillon</b> $S_n=\{(X_1,Y_1),\dots,(X_n,Y_n)\}$ : les $n$ exemples étiquetés dont on dispose pour apprendre (S pour <i>sample</i>, $n$ pour leur nombre). Exemple : les 5000 anciens crédits dont on connaît l’issue. L’indice $i$ numérote les exemples : $(X_i,Y_i)$ est le $i$-ème.</div>
<p>Pourquoi c’est crucial : toute la théorie suppose que les données d’entraînement et les futurs cas viennent de la <b>même</b> loi $P$, tirés indépendamment. Si la population change (crise, nouvelle clientèle), les garanties ne tiennent plus.</p>
<h4>6. Estimer : le chapeau</h4>
<p>Une quantité théorique inconnue s’écrit sans chapeau ($\mu$ : la vraie moyenne) ; son estimation calculée sur les données porte un chapeau et souvent l’indice $n$ : $\hat\mu_n=\frac1n\sum_{i=1}^nZ_i$, la <b>moyenne empirique</b>. Le symbole $\sum_{i=1}^n$ se lit « somme pour $i$ allant de 1 à $n$ ».</p>
<h4>7. Les deux paramètres de toute garantie : ε et δ</h4>
<div class="def"><b>$\epsilon$ (epsilon), la précision</b> : l’écart toléré entre l’estimation et la vérité ; « à 2 points de pourcentage près » donne $\epsilon=0{,}02$.<br>
<b>$\delta$ (delta), le risque</b> : la probabilité que la garantie échoue (échantillon malchanceux) ; $1-\delta$ est la <b>confiance</b>, et $\delta=0{,}05$ donne 95 %.<br>
Une garantie se lit alors : « avec probabilité au moins $1-\delta$, l’erreur est au plus $\epsilon$ ». On écrit $\epsilon(n)$ pour souligner que cette erreur garantie <b>dépend du nombre d’exemples $n$</b> : elle diminue quand on ajoute des données.</div>
<h4>8. Les petits symboles</h4>
<table><tr><th>Symbole</th><th>Se lit</th><th>Sens</th></tr>
<tr><td>$\forall\epsilon>0$</td><td>« pour tout epsilon positif »</td><td>l’énoncé vaut quelle que soit la précision choisie</td></tr>
<tr><td>$\arg\min_{g\in\mathcal H}f(g)$</td><td>« argmin »</td><td>l’élément $g$ de $\mathcal H$ qui rend $f$ la plus petite ($\min$ donne la valeur, $\arg\min$ donne le gagnant)</td></tr>
<tr><td>$O(\cdot)$, $\sim$</td><td>« grand O », « de l’ordre de »</td><td>croissance à une constante près : $O(1/\sqrt n)$ est divisé par 2 quand $n$ est multiplié par 4</td></tr>
<tr><td>$\ln$, $e^{x}$</td><td>logarithme népérien, exponentielle</td><td>$\ln(e^x)=x$ ; $e^{-2n\epsilon^2}$ devient vite minuscule quand $n$ grandit</td></tr>
<tr><td>$\lim_{n\to\infty}$</td><td>« limite quand $n$ tend vers l’infini »</td><td>ce qui se passe avec une quantité illimitée de données</td></tr>
<tr><td>$\binom ni$</td><td>« $i$ parmi $n$ »</td><td>nombre de façons de choisir $i$ objets parmi $n$</td></tr>
<tr><td>$|A|$</td><td>cardinal, ou valeur absolue</td><td>nombre d’éléments d’un ensemble ; pour un nombre, sa distance à 0</td></tr></table>`,
        notes: [],
      },
      {
        id: 'slt-intro', title: 'Apprendre : le cadre supervisé', slides: '3-13',
        summary: 'Un échantillon de n exemples tirés au hasard (i.i.d.) d’une loi P inconnue, une classe H de classifieurs candidats, un algorithme qui en choisit un, une perte qui compte les erreurs. Bon sur les données mais mauvais ailleurs : sur-apprentissage.',
        fiche: R`
<p><b>Apprendre</b>, c’est utiliser l’expérience passée pour décider dans le futur. Le <b>machine learning</b> remplace la connaissance d’un expert par des données et des exemples.</p>
<p>Valiant (1984, <i>A theory of the learnable</i>) pose trois exigences : une machine doit pouvoir apprendre des <b>classes entières</b> de concepts (que l’on sait caractériser), ces classes doivent être utiles et non triviales, et l’apprentissage doit prendre un nombre <b>polynomial</b> d’étapes (pas un temps qui explose).</p>
<p>Le cadre se construit en six pièces. On garde l’exemple de la banque qui prédit le remboursement d’un crédit (les notations de base sont dans la première notion, « Rappels et notations »).</p>
<div class="def"><b>Le cadre supervisé, pièce par pièce</b>
<ol><li><b>Les espaces.</b> $\mathcal X$ (« X cursif ») est l’ensemble de toutes les entrées possibles : tous les dossiers imaginables, par exemple $\mathbb R^2$ si un dossier se résume au couple (revenu, dette). $\mathcal Y$ est l’ensemble des étiquettes possibles : $\{0,1\}$ (rembourse, fait défaut).</li>
<li><b>La loi inconnue</b> $P$ sur $\mathcal X\times\mathcal Y$, l’ensemble des couples (dossier, issue). Elle dit à la fois quels dossiers se présentent et comment l’issue en dépend. On ne la connaît <b>jamais</b> : c’est tout le problème.</li>
<li><b>L’échantillon</b> $S_n=\{(X_1,Y_1),\dots,(X_n,Y_n)\}$ : $n$ couples tirés <b>i.i.d.</b> selon $P$ (indépendants, de même loi), ce qui s’écrit $S_n\sim P^n$. Ce sont nos $n$ anciens crédits dont on connaît l’issue.</li>
<li><b>Les hypothèses.</b> Une hypothèse (ou classifieur, ou concept) est une fonction $f:\mathcal X\to\mathcal Y$ qui prédit une étiquette pour chaque entrée. On la cherche dans une <b>classe</b> $\mathcal H$ (« H cursif ») fixée à l’avance : tous les classifieurs linéaires, tous les réseaux d’une architecture donnée… Dans la suite, $h$ désigne le <b>vrai</b> classifieur (celui qui donne les vraies étiquettes, inconnu) et $g$ un classifieur <b>candidat</b>.</li>
<li><b>L’algorithme</b> $\mathcal A$ prend l’échantillon et renvoie un classifieur : $\mathcal A:S_n\mapsto\hat g_n\in\mathcal H$. Le chapeau signifie « construit à partir des données », l’indice $n$ « avec $n$ exemples ». (Écriture complète : $\mathcal A:(\mathcal X\times\mathcal Y)^n\to\mathcal H$, l’ensemble de départ étant tous les échantillons possibles de taille $n$.)</li>
<li><b>La perte</b> $\ell$ (« ell ») mesure le coût d’une prédiction. La plus simple est la <b>perte 0/1</b> : $\ell(\hat g_n(x),h(x))=\mathbb 1[\hat g_n(x)\neq h(x)]$, qui vaut 1 en cas d’erreur et 0 sinon.</li></ol></div>
<p><b>But</b> : construire $\hat g_n$ qui marche bien <b>sur l’échantillon</b> (in-sample) <b>et sur les nouveaux cas</b> (out-of-sample). Bon sur $S_n$ mais mauvais ailleurs : c’est le <b>sur-apprentissage</b>.</p>
<p><b>Exemple extrême</b> : le « mémoriseur » $\hat g_n(x)=y_i$ si $x$ est exactement le dossier $x_i$ d’un exemple de l’échantillon, et $0$ sinon. Zéro erreur sur les données, aucune généralisation : face à un nouveau client, il répond toujours 0. Il faut donc restreindre la classe $\mathcal H$ à des fonctions « raisonnables » pour le problème ; ce choix fait a priori s’appelle le <b>biais inductif</b>.</p>`,
        notes: [
          { p: 8, t: 'Distribution de prob inconnue = on ne sait pas comment sont distribués (labellisés) nos points.', fix: 'Exact, et plus précisément : P est une loi jointe sur (X, Y). On ne connaît ni la répartition des points x, ni la façon dont les étiquettes y en dépendent (η(x) = P(Y=1|X=x)).' },
          { p: 9, t: 'Le but du jeu est de trouver une fonction d’hypothèse H qui à partir des données nous donne le label d’un point. Il y en a de plusieurs types : plus proches voisins, réseaux de neurones, etc. Ce choix de type dépend de plusieurs points.', fix: 'Attention à la notation : H est la classe (l’ensemble) d’hypothèses ; la fonction que l’on cherche est un élément f (ou g) de H.' },
          { p: 11, t: 'On utilise un algorithme d’apprentissage (pas que les SVMs) pour déterminer notre meilleur classifier/hypothèse possible, en faisant intervenir les fonctions de loss.' },
        ],
      },
      {
        id: 'slt-risk', title: 'Risque théorique, risque empirique, ERM', slides: '14-18, 26',
        summary: 'R(g) est une espérance sous P (inconnue) ; Rn(g) en est la moyenne empirique sur Sn. On minimise ce qu’on peut calculer : Rn.',
        fiche: R`
<p><b>Comment juger un classifieur candidat $g$ ?</b> En moyennant sa perte sur <b>tous</b> les cas possibles, chacun pondéré par sa probabilité. C’est l’<b>espérance de la perte</b>, appelée <b>risque théorique</b> :
$$R(g)=\mathbb E_{X\sim P}\big[\ell(h(X),g(X))\big]\qquad(h\text{ : le vrai classifieur}).$$
Avec la perte 0/1, c’est tout simplement la <b>probabilité que $g$ se trompe</b> sur un nouveau client.</p>
<p>Deux obstacles : la loi $P$ est inconnue, et on n’a qu’un échantillon fini $S_n$. On approche donc $R$ par le <b>risque empirique</b>, la perte moyenne sur les $n$ exemples de l’échantillon :</p>
$$R_n(g)=\frac1n\sum_{i=1}^n \ell(h(x_i),g(x_i)).$$
<p>C’est exactement le passage de la moyenne théorique à la moyenne empirique : pour une fonction quelconque $f$, $\mu=\mathbb E[f(X)]=\int f\,dP$ est estimée par $\hat\mu_n=\frac1n\sum_{i=1}^n f(x_i)$.</p>
<div class="def"><b>Classification binaire, perte 0/1</b> ($\mathcal Y=\{0,1\}$)
$$R(g)=\mathbb P[Y\neq g(X)],\qquad R_n(g)=\frac1n\sum_{i=1}^n \mathbb 1[g(X_i)\neq Y_i].$$
En mots : $R(g)$ est la probabilité d’erreur sur un nouveau cas, $R_n(g)$ la <b>fraction d’erreurs</b> sur l’échantillon.</div>
<p>$R_n$ <b>dépend de l’échantillon</b> : un autre tirage donnerait une autre valeur, c’est une variable aléatoire. $R$, lui, est un nombre fixe (mais inconnu). Notons $g_{\mathcal H}$ le meilleur classifieur de la classe. Si le vrai classifieur est dans $\mathcal H$, alors $R(g_{\mathcal H})=0$ : apprentissage <b>réalisable</b>. En général $R(g_{\mathcal H})\ge 0$ : apprentissage <b>agnostique</b> (« sans croyance » sur la forme de la vérité).</p>
<div class="def"><b>Trois classifieurs à ne pas confondre</b> (l’étoile $^*$ marque un optimum ; $\arg\min$ renvoie le classifieur qui atteint le minimum)
<ul><li>$g^*_{\mathcal H}=\arg\min_{g\in\mathcal H} R(g)$ : le meilleur de la classe, au sens du vrai risque (inconnu).</li>
<li>$g^*_n=\arg\min_{g\in\mathcal H} R_n(g)$ : le meilleur sur les données. Le choisir, c’est la <b>minimisation du risque empirique</b> (ERM, <i>Empirical Risk Minimization</i>).</li>
<li>$g^*=\arg\min_{g} R(g)$ sur <b>toutes</b> les fonctions possibles : le classifieur de <b>Bayes</b>, un oracle théorique, pas forcément dans $\mathcal H$.</li></ul></div>`,
        notes: [
          { p: 14, t: 'On suppose que le jeu de données a été généré par une distrib de prob. L’espérance entre le vrai classifier h(X) et celui calculé par l’algo g(X) donne ce qu’on appelle le risque théorique. On ne connaît pas la vraie distrib statistique donc on ne peut pas calculer le vrai risque théorique. On calcule donc le risque empirique.', fix: 'Précision : c’est l’espérance de la perte ℓ(h(X), g(X)), pas l’espérance « entre » h et g.' },
          { p: 17, t: 'R = risque théorique (inconnu donc minimum théorique est inconnu mais pas forcément à 0).' },
        ],
      },
      {
        id: 'slt-bayes', title: 'Classifieur de Bayes et fonction de régression', slides: '19-23',
        summary: 'η(x) = P(Y=1|X=x). Le classifieur de Bayes 1[η(x) > 1/2] minimise le risque, et R(g*) = E[min(η, 1−η)].',
        fiche: R`
<div class="def"><b>Fonction de régression</b> (cas binaire) : $\eta(x)=\mathbb P(Y=1\mid X=x)$.<br>
<b>Classifieur de Bayes</b> : $g^*(x)=\mathbb 1[\eta(x)>\tfrac12]$ (prédire 1 si la classe 1 est la plus probable).</div>
<div class="thm"><b>Théorème.</b> $g^*$ minimise le risque théorique $R(g)=\mathbb P[Y\neq g(X)]$.</div>
<p><b>Preuve</b> (à savoir refaire). Il suffit de montrer, pour tout $x$ et tout $g$, que $\mathbb P(Y\neq g(X)\mid X=x)\ge \mathbb P(Y\neq g^*(X)\mid X=x)$, puis d’intégrer en $x$.</p>
<ol><li>$\mathbb P(Y\neq g(X)\mid X=x)=1-\mathbb 1[g(x)=1]\,\eta(x)-\mathbb 1[g(x)=0]\,(1-\eta(x))$.</li>
<li>On fait la différence avec la même expression pour $g^*$ :
$$\eta(x)\big(\mathbb 1[g^*(x)=1]-\mathbb 1[g(x)=1]\big)+(1-\eta(x))\big(\mathbb 1[g^*(x)=0]-\mathbb 1[g(x)=0]\big)$$</li>
<li>Comme $\mathbb 1[\cdot=0]=1-\mathbb 1[\cdot=1]$, cela vaut $(2\eta(x)-1)\big(\mathbb 1[g^*(x)=1]-\mathbb 1[g(x)=1]\big)$.</li>
<li>Ce produit est $\ge 0$ : si $\eta(x)>\frac12$, $g^*(x)=1$ et la parenthèse vaut 0 ou 1 ; sinon les deux facteurs sont $\le 0$.</li></ol>
<p>La preuve donne aussi le <b>risque de Bayes</b> :</p>
$$R(g^*)=1-\mathbb E\big[\mathbb 1[\eta>\tfrac12]\,\eta+\mathbb 1[\eta\le\tfrac12](1-\eta)\big]=\mathbb E\big[\min(\eta(X),1-\eta(X))\big].$$
<p class="muted">Intuition : là où $\eta(x)$ est proche de $1/2$, même l’oracle se trompe souvent. $R(g^*)=0$ seulement si $\eta\in\{0,1\}$ presque partout (pas de bruit).</p>`,
        notes: [
          { p: 19, t: 'Probabilité d’avoir la classe Y=1 quand on connaît l’état de X (cas où on n’a que 2 classes).' },
          { p: 21, t: 'g* minimise si on montre que pour tout g ≠ g*, la prob que g se trompe est ≥ celle que g* se trompe.', fix: 'Oui, et on le montre point par point (conditionnellement à X = x), puis on prend l’espérance.' },
          { p: 22, t: 'Fonctions indicatrices (annotation de la preuve).' },
        ],
      },
      {
        id: 'slt-decomp', title: 'Approximation et estimation : les questions de la théorie', slides: '24-25',
        summary: 'L’excès de risque = approximation (biais, dépend de H) + estimation (variance, dépend de n et de la taille de H).',
        fiche: R`
<p>$P$ étant inconnue, on ne peut pas calculer $g^*$. On voudrait une garantie <b>avec grande probabilité</b> du type $R(g^*_n)\le R(g^*)+\epsilon$ : « le classifieur appris ne se trompe pas plus que l’oracle, à $\epsilon$ près ». Cet écart $R(g^*_n)-R(g^*)$ s’appelle l’<b>excès de risque</b>, et il se coupe en deux :</p>
$$R(g^*_n)-R(g^*)=\underbrace{R(g^*_{\mathcal H})-R(g^*)}_{\text{approximation}\ \approx\ \text{biais}}+\underbrace{R(g^*_n)-R(g^*_{\mathcal H})}_{\text{estimation}\ \approx\ \text{variance}}$$
<ul><li><b>Approximation</b> : ce que l’on perd en se limitant à la classe $\mathcal H$ (même le meilleur de la classe n’est pas l’oracle). Diminue quand $\mathcal H$ grandit.</li>
<li><b>Estimation</b> : ce que l’on perd parce que $n$ est fini (on choisit sur l’échantillon, pas sur la vraie loi). Augmente quand $\mathcal H$ grandit : plus de candidats pour « coller » au hasard de l’échantillon.</li></ul>
<p>C’est le compromis biais-variance vu sous l’angle du risque.</p>
<div class="def"><b>Les quatre questions de la théorie statistique de l’apprentissage</b>
<ol><li>Apprendre à partir d’un échantillon fini, est-ce <b>faisable</b> ?</li><li>Quels concepts (quelles classes $\mathcal H$) peut-on apprendre ?</li><li>Combien de données $n$ faut-il ?</li><li>Quelles garanties sur l’erreur $\epsilon(n)$, c’est-à-dire l’erreur que l’on peut garantir <b>en fonction du nombre d’exemples $n$</b> : à quelle vitesse baisse-t-elle quand on ajoute des données ?</li></ol>
Outil : le <b>PAC-learning</b> (<i>Probably Approximately Correct</i>) : avec probabilité au moins $1-\delta$ (« probably »), l’erreur est au plus $\epsilon$ (« approximately correct »).</div>`,
        notes: [
          { p: 24, t: 'Tout l’enjeu c’est que epsilon soit petit, et qu’ainsi gn soit très proche de g*. Pour les réseaux de neurones c’est certes bien moins biaisé mais la variance est grande (difficile de déterminer le meilleur).' },
          { p: 25, t: 'Pour répondre à ces questions on va utiliser la théorie du PAC-Learning (PAC = Probably Approximately Correct).' },
        ],
      },
      {
        id: 'slt-lln', title: 'Billes, dés et lois des grands nombres', slides: '28-31',
        summary: 'Estimer μ par ν = μ̂n : la LGN dit que ça converge quand n → ∞, mais on veut une garantie pour n fini.',
        fiche: R`
<p><b>Analogie de l’urne</b> : une urne (infinie) contient une proportion $\mu$ (« mu ») inconnue de billes rouges. On tire $n$ billes et on observe la fraction de rouges, notée $\nu$ (« nu ») ou $\hat\mu_n$. Peut-on « apprendre » $\mu$ à partir de $\nu$ ? C’est la même question que d’estimer le taux d’erreur d’un classifieur à partir d’un échantillon.</p>
<p><b>Dé</b> : la moyenne cumulée des lancers tend vers $\mu=3{,}5$. Mais à quelle vitesse ?</p>
<div class="thm"><b>Loi faible des grands nombres</b> (convergence en probabilité). $X_1,\dots,X_n$ i.i.d. de moyenne $\mathbb E[X_i]=\mu$ : pour tout $\epsilon>0$, $\lim_{n\to\infty}\mathbb P[|\hat\mu_n-\mu|\le\epsilon]=1$.<br>
En mots : quelle que soit la précision $\epsilon$ demandée, la probabilité que la moyenne empirique soit à moins de $\epsilon$ de $\mu$ tend vers 1.<br>
<b>Loi forte</b> (convergence presque sûre) : $\mathbb P[\lim_{n\to\infty}\hat\mu_n=\mu]=1$. En mots : la suite des moyennes finit par converger vers $\mu$, sauf sur des tirages de probabilité nulle.</div>
<p>Ces résultats sont <b>asymptotiques</b> : ils décrivent $n\to\infty$, pas ce qui se passe avec 200 exemples. Le théorème central limite donne en plus l’ordre de grandeur de l’écart, $\mu\pm\sqrt{\mathrm{Var}(X)/n}$, mais toujours pour $n\to\infty$ et en dépendant de la variance (inconnue).</p>
<p>On veut des garanties <b>non asymptotiques</b> (pour $n$ fini) et <b>indépendantes de la loi</b> : ce sont les inégalités de concentration.</p>`,
        notes: [
          { p: 28, t: 'Il faut imaginer que l’urne est infinie et qu’on n’a jamais accès à toutes les billes de l’urne.' },
          { p: 30, t: 'Théorème central limite = Loi des grands nombres. Il nous dit ce qui se passe quand n tend vers l’infini.', fix: 'À corriger : ce sont deux théorèmes différents. La LGN dit que μ̂n → μ. Le TCL dit comment l’écart se comporte : √n (μ̂n − μ) tend vers une loi normale N(0, Var X). Les deux sont asymptotiques, d’où l’intérêt de Hoeffding.' },
        ],
      },
      {
        id: 'slt-hoeffding', title: 'Inégalité de Hoeffding (3 versions)', slides: '32-38',
        summary: 'P[|μ̂n − μ| > ε] ≤ 2 exp(−2nε²), puis n ≥ ln(2/δ)/(2ε²) et ε = √(ln(2/δ)/(2n)). La précision coûte cher, la confiance non.',
        fiche: R`
<p><b>La situation</b> : on observe $n$ valeurs i.i.d. $X_1,\dots,X_n$ comprises entre 0 et 1 (par exemple des indicatrices d’erreur), de vraie moyenne $\mu$ inconnue, et on calcule leur moyenne empirique $\hat\mu_n$. Question : quelle est la probabilité que $\hat\mu_n$ tombe <b>à plus de $\epsilon$</b> de $\mu$ ?</p>
<div class="thm"><b>Hoeffding, version 1 (PAC).</b> $X_1,\dots,X_n$ i.i.d. à valeurs dans $[0,1]$, $\mathbb E[X_i]=\mu$. Pour tout $\epsilon>0$ :
$$\mathbb P\big[|\hat\mu_n-\mu|>\epsilon\big]\le 2e^{-2n\epsilon^2}.$$</div>
<ul><li>$\mu\approx\hat\mu_n$ est « probablement approximativement correct ».</li>
<li>La borne ne dépend que de $n$ et $\epsilon$, <b>pas de la loi</b> des $X_i$ (ni de $\mu$, ni de la variance).</li>
<li>Inégalité de <b>concentration</b> : la masse se concentre autour de la moyenne, avec une décroissance exponentielle.</li>
<li>Compromis : plus d’exemples, borne plus petite ($n\uparrow\Rightarrow e^{-2n\epsilon^2}\downarrow$) ; plus de précision exigée, borne bien plus grande ($\epsilon\downarrow\Rightarrow e^{-2n\epsilon^2}\uparrow\uparrow$, car $\epsilon$ est au carré).</li></ul>
<p>On appelle $\delta=2e^{-2n\epsilon^2}$ le <b>risque</b> (probabilité que la garantie échoue ; $1-\delta$ est la confiance). En isolant $n$ ou $\epsilon$ dans cette égalité, on obtient deux autres lectures du même résultat :</p>
<div class="thm"><b>Version 2 (complexité d’échantillon).</b> Si $n\ge\dfrac{1}{2\epsilon^2}\ln\dfrac2\delta$, alors avec probabilité $\ge 1-\delta$ : $|\hat\mu_n-\mu|\le\epsilon$.</div>
<div class="thm"><b>Version 3 (borne d’erreur).</b> Pour $n$ fixé, avec probabilité $\ge 1-\delta$ : $|\hat\mu_n-\mu|\le\epsilon$ avec $\epsilon=\sqrt{\dfrac{1}{2n}\ln\dfrac2\delta}\sim\dfrac1{\sqrt n}$.</div>
<p><b>La précision coûte cher, la confiance ne coûte presque rien</b> :</p>
<ul><li>10 fois plus de confiance ($\delta'=\delta/10$) : $n'=n+\frac{1}{2\epsilon^2}\ln 10$, on ajoute seulement une constante $C(\epsilon)$.</li>
<li>10 fois plus de précision ($\epsilon'=\epsilon/10$) : $n'=100\,n$.</li></ul>
<p class="muted">Hoeffding est souvent pessimiste : pour une Bernoulli de paramètre 0,1, la moyenne converge bien plus vite que ce que la borne garantit (elle ignore la variance ; Bernstein en tient compte).</p>`,
        notes: [
          { p: 32, t: 'Les inégalités de concentration disent de quelle manière les valeurs sont concentrées autour de la valeur théorique, permettant donc de savoir à quel point une valeur empirique s’éloigne de la théorique. [La borne = ] prob de commettre une erreur : c’est logique que ça décroisse en n, plus on répète l’expérience plus on rentre dans les stats et plus l’empirique se rapproche du théorique.' },
        ],
      },
      {
        id: 'slt-oneclf', title: 'Retour à l’apprentissage : un classifieur fixé', slides: '39-44',
        summary: 'Pour g fixé avant de voir les données, P[|R(g) − Rn(g)| > ε] ≤ 2 exp(−2nε²). Ce n’est pas encore de l’apprentissage : c’est une vérification.',
        fiche: R`
<p>L’urne devient l’espace $\mathcal X$. Chaque bille est un point $x$ : <span class="g">verte</span> si $g$ le classe bien, <span class="r">rouge</span> sinon. La proportion de rouges est $R(g)$ ; la fraction de rouges dans l’échantillon est $R_n(g)$.</p>
<div class="thm"><b>Hoeffding pour un classifieur $g\in\mathcal H$ donné</b> :
$$\mathbb P\big[|R(g)-R_n(g)|>\epsilon\big]\le 2e^{-2n\epsilon^2}\quad\forall\epsilon>0.$$</div>
<p>Ce n’est <b>pas de l’apprentissage</b> : $g$ est fixé à l’avance, on <b>vérifie</b> seulement à quel point il approche le vrai $h$ (c’est le principe d’un ensemble de test).</p>
<p><b>Données réelles (Breast Cancer)</b> : 100 répétitions de $|R(g)-R_n(g)|$ avec $n=205, 137, 68, 20$. Quand $n$ diminue, l’écart moyen change peu mais sa <b>variance augmente</b>. La queue de l’histogramme correspond à des échantillons <b>non représentatifs</b>.</p>`,
        notes: [
          { p: 39, t: 'On va faire une analogie entre notre problème de classifier et le PAC-learning, dans l’exemple de billes rouges et vertes : vert = bien classifié, rouge = mal classifié. (Croquis : points x et o, frontières g et h.)' },
        ],
      },
      {
        id: 'slt-finite', title: 'Ensemble fini d’hypothèses : union bound', slides: '46-53',
        summary: 'L’algorithme choisit g après avoir vu les données : il faut contrôler les M hypothèses à la fois. P ≤ 2M exp(−2nε²), n ≥ ln(2M/δ)/(2ε²).',
        fiche: R`
<p>Jusqu’ici $g$ était fixé. Mais l’algorithme <b>choisit</b> $g$ parmi $\mathcal H=\{g_1,\dots,g_M\}$ <b>après</b> avoir vu les données. Hoeffding s’applique à chaque $g_m$ séparément, pas au $g$ choisi.</p>
<p><b>Pièce de monnaie</b> : 10 piles sur 10 lancers d’une pièce équilibrée, probabilité $2^{-10}\approx 0{,}1\,\%$. Avec 1000 pièces, la probabilité qu’<b>au moins une</b> fasse 10 piles est $1-(1-2^{-10})^{1000}\approx 63\,\%$. Choisir le meilleur parmi beaucoup, c’est s’exposer à un « gagnant » par pur hasard.</p>
<p>Implication d’événements : $|R(g)-R_n(g)|>\epsilon\Rightarrow$ au moins un $m$ vérifie $|R(g_m)-R_n(g_m)|>\epsilon$. Avec $A\Rightarrow B\Rightarrow\mathbb P[A]\le\mathbb P[B]$ et l’<b>union bound</b> :</p>
<div class="thm"><b>Hoeffding pour $|\mathcal H|=M$ (version 1)</b>
$$\mathbb P\big[|R(g)-R_n(g)|>\epsilon\big]\le\sum_{m=1}^M\mathbb P\big[|R(g_m)-R_n(g_m)|>\epsilon\big]\le 2Me^{-2n\epsilon^2}.$$</div>
<p>C’est une <b>convergence uniforme</b> : avec probabilité $\ge 1-2Me^{-2n\epsilon^2}$, <b>tous</b> les $g_m$ vérifient $|R(g_m)-R_n(g_m)|\le\epsilon$.</p>
<div class="thm"><b>Version 2</b> : $n\ge\dfrac1{2\epsilon^2}\ln\dfrac{2M}\delta$. &nbsp; <b>Version 3</b> : $\epsilon=\sqrt{\dfrac1{2n}\ln\dfrac{2M}\delta}=O\Big(\sqrt{\dfrac{\ln M}n}\Big)$.</div>
<ul><li>Mauvaises situations : $M$ grand (trop d’hypothèses), $n$ petit (trop peu de données).</li>
<li>$M$ mesure la <b>complexité</b> de $\mathcal H$ ; le résultat ne dépend toujours pas de $P$.</li>
<li>L’union bound est un pire cas : si les $g_m$ font les mêmes erreurs, elle surestime (si tous classent pareil, on devrait compter $M=1$).</li></ul>
<p class="muted">Coquille du slide 51 : la ligne « ∀g, |R − Rn| &gt; ε » doit se lire « ∀g, |R − Rn| ≤ ε ».</p>`,
        notes: [
          { p: 47, t: 'Si ton erreur est > epsilon ça veut dire que la proba d’au moins 1 classifier gi soit > epsilon.', fix: 'Formulation exacte : si l’écart |R(g) − Rn(g)| du g choisi dépasse ε, alors au moins un g_m de H a un écart |R(g_m) − Rn(g_m)| > ε. On borne donc par la probabilité de cette union d’événements.' },
          { p: 52, t: 'n = #samples, c’est-à-dire pour nous # points.' },
        ],
      },
      {
        id: 'slt-growth', title: 'Dichotomies et fonction de croissance', slides: '55-66',
        summary: 'Sur n points, H ne produit qu’au plus 2^n étiquetages. mH(n) remplace M : P ≤ 2 mH(n) exp(−2nε²).',
        fiche: R`
<p>Si $M\to\infty$ (classifieurs linéaires…), l’union bound explose alors que beaucoup de classifieurs font les mêmes erreurs. Idée de Vapnik-Chervonenkis : compter les comportements <b>distincts sur les données</b>.</p>
<div class="def"><b>Dichotomies</b> : les étiquetages $(h(x_1),\dots,h(x_n))$ réalisables par $h\in\mathcal H$. On a $|\mathcal H(x_1,\dots,x_n)|\le 2^n$ même si $|\mathcal H|=\infty$.<br>
<b>Fonction de croissance</b> : $m_{\mathcal H}(n)=\max_{x_1,\dots,x_n\in\mathcal X}|\mathcal H(x_1,\dots,x_n)|\le 2^n$.</div>
<p>Classifieurs linéaires dans $\mathbb R^2$ : $m_{\mathcal H}(3)=8=2^3$ (3 points non alignés) mais $m_{\mathcal H}(4)=14<2^4$ (les deux étiquetages « en XOR » sont impossibles).</p>
<div class="thm"><b>Hoeffding pour $\mathcal H$ infini (version 1)</b> : $\mathbb P[|R(g)-R_n(g)|>\epsilon]\le 2\,m_{\mathcal H}(n)\,e^{-2n\epsilon^2}$.<br>
Version 3 : $\epsilon\sim\sqrt{\ln m_{\mathcal H}(n)/n}$.</div>
<p class="muted">(Le résultat rigoureux, l’inégalité VC, a des constantes différentes, par ex. $4\,m_{\mathcal H}(2n)e^{-n\epsilon^2/8}$ ; le cours garde la forme simplifiée.)</p>
<p><b>Ce qui compte : $m_{\mathcal H}(n)$ est-il polynomial ou exponentiel ?</b> Polynomial : $e^{-2n\epsilon^2}$ l’emporte et la borne tend vers 0. Exponentiel ($2^n$) : pas de garantie.</p>
<table><tr><th>Classe</th><th>$m_{\mathcal H}(n)$</th></tr>
<tr><td>Rayons positifs $h(x)=\mathrm{sgn}(x-a)$ sur $\mathbb R$</td><td>$n+1$ (positions possibles de $a$)</td></tr>
<tr><td>Intervalles positifs $[a,b]$ sur $\mathbb R$</td><td>$\binom{n+1}{2}+1=\frac12(n^2+n+2)$</td></tr>
<tr><td>Ensembles convexes de $\mathbb R^2$</td><td>$2^n$ (points sur un cercle)</td></tr>
<tr><td>Réseaux de neurones</td><td>difficile à compter : on le borne</td></tr></table>`,
        notes: [
          { p: 55, t: 'Il existe une infinité de classifiers possibles, l’idée ici est de se poser la question : étant donné cet ensemble de points, combien de configurations différentes existe-t-il ? 2 points : soit ils sont tous « x », soit tous « o », soit l’un est « x » et l’autre « o » (2 configurations pour ce cas, x-o et o-x). Au total 2² = 4 configurations différentes.' },
          { p: 56, t: 'Dichotomies = # de configurations.', fix: 'Une dichotomie est une configuration (un étiquetage) ; le nombre de dichotomies est |H(x1, …, xn)|.' },
          { p: 58, t: '4 points c’est très peu et même pour si peu, les classifieurs linéaires sont déjà incapables de classifier sans erreur, ça montre à quel point ils sont limités.', fix: 'Nuance : ils ne peuvent pas réaliser TOUS les étiquetages (14 sur 16). C’est justement cette limite qui les rend apprenables : moins de capacité, meilleure généralisation.' },
          { p: 63, t: 'La growth function est très difficile à estimer.' },
        ],
      },
      {
        id: 'slt-shatter', title: 'Pulvérisation et point de rupture', slides: '67-71',
        summary: 'H pulvérise k points s’il réalise les 2^k étiquetages. k est un point de rupture si aucun ensemble de k points n’est pulvérisé. Point de rupture ⇒ apprentissage possible.',
        fiche: R`
<div class="def"><b>Pulvérisation (shattering)</b> : un ensemble $S$ de $k$ points est pulvérisé par $\mathcal H$ si $\mathcal H$ réalise <b>toutes</b> les $2^k$ combinaisons d’étiquettes sur $S$.<br>
<b>Point de rupture (breakpoint)</b> : $k$ est un point de rupture si <b>aucun</b> ensemble de $k$ points n’est pulvérisé, autrement dit $m_{\mathcal H}(k)<2^k$.</div>
<p>Classifieurs linéaires du plan : 3 points (en position générale) sont pulvérisés, 4 ne le sont jamais. Point de rupture $k=4$ ($m(4)=14<16$) ; $5, 6,\dots$ sont aussi des points de rupture (on retient le plus petit).</p>
<p>Attention au quantificateur : pour pulvériser, il suffit d’<b>un</b> ensemble de $k$ points qui marche ; pour un point de rupture, il faut que <b>tous</b> les ensembles de $k$ points échouent (on exclut les cas pathologiques comme des points alignés).</p>
<div class="thm"><b>Point de rupture et apprentissage</b>
<ul><li>Pas de point de rupture : $m_{\mathcal H}(k)=2^k$ pour tout $k$.</li>
<li>Un point de rupture existe : $m_{\mathcal H}(k)<2^k$, et on va montrer que $m_{\mathcal H}(n)$ devient <b>polynomial</b> : l’apprentissage est possible.</li></ul></div>
<p>Le point de rupture est un <b>seul nombre</b> qui caractérise $\mathcal H$, plus facile à manipuler que $m_{\mathcal H}$.</p>`,
        notes: [
          { p: 67, t: 'n points can be shattered if we can generate all the different configurations with linear classifiers.', fix: 'Vrai pour n’importe quelle classe H, pas seulement les linéaires : n points sont pulvérisés si H génère toutes les configurations sur ces n points.' },
        ],
      },
      {
        id: 'slt-bnk', title: 'B(n, k) et lemme de Sauer', slides: '72-90',
        summary: 'B(n,k) = nombre max de dichotomies sur n points sans pulvériser k points. B(n,k) ≤ B(n−1,k) + B(n−1,k−1) ≤ Σ_{i<k} C(n,i) = O(n^{k−1}).',
        fiche: R`
<div class="def"><b>B(n, k)</b> : nombre maximal de dichotomies (lignes distinctes) que l’on peut écrire sur $n$ points <b>sans qu’aucun groupe de $k$ points ne soit pulvérisé</b>. Purement combinatoire : ne dépend ni de $\mathcal H$ ni de $\mathcal X$. Si $\mathcal H$ a le point de rupture $k$, alors $m_{\mathcal H}(n)\le B(n,k)$.</div>
<p>Exemples : $B(3,2)=4$, $B(4,2)=5$, $B(4,3)=11$ (sur 8 et 16 possibles).</p>
<p><b>Récurrence</b> (on isole le dernier point $x_n$) : les lignes se rangent en $S_1$ ($\alpha$ lignes dont le préfixe $x_1..x_{n-1}$ n’apparaît qu’une fois) et $S_2$ ($2\beta$ lignes : chaque préfixe apparaît avec $x_n=+1$ et $x_n=-1$). Donc $B(n,k)=\alpha+2\beta$.</p>
<ul><li>Sur les $n-1$ premières colonnes, les $\alpha+\beta$ préfixes distincts ne pulvérisent pas $k$ points : $\alpha+\beta\le B(n-1,k)$.</li>
<li>Les $\beta$ préfixes de $S_2$ ne peuvent pas pulvériser $k-1$ points (sinon, en ajoutant $x_n$ qui prend les deux valeurs, on pulvériserait $k$ points) : $\beta\le B(n-1,k-1)$.</li></ul>
$$B(n,k)\le B(n-1,k)+B(n-1,k-1),\qquad B(n,1)=1,\quad B(1,k)=2\ (k\ge2).$$
<div class="thm"><b>Lemme de Sauer (1972)</b>. Si $\mathcal H$ a un point de rupture $k<\infty$ :
$$m_{\mathcal H}(n)\le B(n,k)\le\sum_{i=0}^{k-1}\binom ni=O(n^{k-1}).$$</div>
<p><b>Preuve par récurrence</b> : vrai pour $n=1$ ; on suppose vrai en $n-1$, on injecte dans la récurrence, on sort le terme $i=0$, on décale l’indice de la seconde somme et on utilise Pascal $\binom ni=\binom{n-1}i+\binom{n-1}{i-1}$.</p>
<p class="muted">Pascal « avec ou sans moi » : choisir $i$ personnes parmi $n$, c’est soit me prendre ($\binom{n-1}{i-1}$ façons), soit pas ($\binom{n-1}{i}$).</p>`,
        notes: [],
      },
      {
        id: 'slt-vc', title: 'Dimension VC et borne finale', slides: '91-100',
        summary: 'dVC = taille du plus grand ensemble pulvérisé, k = dVC + 1. mH(n) ≤ (en/dVC)^dVC, d’où ε ~ √(dVC ln n / n). Linéaire dans R^d : dVC = d + 1.',
        fiche: R`
<div class="def"><b>Dimension VC</b> : $d_{VC}(\mathcal H)$ est le cardinal du plus grand ensemble de points de $\mathcal X$ que $\mathcal H$ peut pulvériser.
<ul><li>$n\le d_{VC}$ : $\mathcal H$ <b>peut</b> pulvériser $n$ points.</li><li>tout $k>d_{VC}$ est un point de rupture ; le plus petit est $k=d_{VC}+1$.</li></ul></div>
<p><b>Le jeu</b> : tu choisis $k$ points, l’adversaire les étiquette comme il veut, tu dois produire $h\in\mathcal H$ qui colle. Si tu gagnes, $d_{VC}\ge k$. Pour montrer $d_{VC}\le k$, il faut prouver que pour <b>tout</b> ensemble de $k+1$ points, l’adversaire trouve un étiquetage impossible.</p>
<table><tr><th>Classe</th><th>$d_{VC}$</th></tr>
<tr><td>Linéaires dans $\mathbb R^2$</td><td>3</td></tr><tr><td>Linéaires dans $\mathbb R^d$</td><td>$d+1$</td></tr>
<tr><td>Rayons positifs / intervalles</td><td>1 / 2</td></tr>
<tr><td>Réseau à $\omega$ paramètres, activation booléenne</td><td>$\le 2\omega\log_2(e\omega)$</td></tr>
<tr><td>$\mathrm{sgn}[\sin(\theta x)]$</td><td>$\infty$ avec un seul paramètre !</td></tr></table>
<p>$d_{VC}$ ressemble souvent au nombre (effectif) de degrés de liberté, mais pas toujours (redondance d’une cascade de perceptrons, ou le sinus ci-dessus).</p>
<div class="thm"><b>Sauer-Shelah</b> : pour $n\ge d_{VC}$, $m_{\mathcal H}(n)\le\Big(\dfrac{en}{d_{VC}}\Big)^{d_{VC}}=O(n^{d_{VC}})$.<br>
Preuve : $\sum_{i\le d}\binom ni\le\sum_{i\le d}\binom ni(\frac nd)^{d-i}\le(\frac nd)^d\sum_{i=0}^n\binom ni(\frac dn)^i=(\frac nd)^d(1+\frac dn)^n\le(\frac nd)^de^d$.</div>
<div class="thm"><b>Hoeffding pour $\mathcal H$ infini avec la dimension VC</b>
$$\mathbb P\big[\exists g\in\mathcal H,\ |R(g)-R_n(g)|>\epsilon\big]\le 2\Big(\frac{en}{d_{VC}}\Big)^{d_{VC}}e^{-2n\epsilon^2}=\delta,$$
$$\epsilon=\sqrt{\frac1{2n}\ln\frac{2(en/d_{VC})^{d_{VC}}}{\delta}}\sim\sqrt{\frac{d_{VC}\ln n}{n}}.$$</div>
<p>Le terme $n^{d_{VC}}e^{-n}$ finit toujours par décroître, mais d’autant plus tard que $d_{VC}$ est grand ; tant que la borne dépasse 1 elle ne dit rien. Tant que $d_{VC}$ est <b>fini</b>, l’apprentissage est possible.</p>`,
        notes: [],
      },
      {
        id: 'slt-summary', title: 'Synthèse, limites et suites', slides: '102-109',
        summary: 'Oui, apprendre est faisable au sens PAC. H complexe : Rn ↓ mais ε ↑ ; H simple : l’inverse. Agnostique O(1/√n), réalisable O(1/n).',
        fiche: R`
<ul><li><b>Faisable ?</b> Oui, au sens probabiliste (PAC).</li>
<li><b>Quelle classe ?</b> $\mathcal H$ complexe : $R_n(g)\downarrow$ mais $\epsilon\uparrow$ (sur-apprentissage). $\mathcal H$ simple : $R_n(g)\uparrow$ mais $\epsilon\downarrow$.</li>
<li><b>Combien de données ?</b> Des bornes supérieures (souvent lâches) sur $n$.</li>
<li>On n’a <b>pas</b> parlé de complexité de calcul (troisième exigence de Valiant).</li></ul>
<div class="def"><b>Les deux ingrédients</b>
<ol><li>Inégalités de concentration : Hoeffding, Bernstein (tient compte de la variance)…</li>
<li>Mesure de complexité de $\mathcal H$ : dimension VC (indépendante de la loi), entropie VC (dépend de la loi), moyennes de Rademacher (capacité à classer du bruit), nombres de recouvrement…</li></ol></div>
<p>Vitesses : apprentissage <b>agnostique</b> ($R(g_{\mathcal H})\ge0$) : $\epsilon=O(1/\sqrt n)$ (à un $\ln n$ près avec la VC) ; <b>réalisable</b> ($R(g_{\mathcal H})=0$) : $\epsilon=O(1/n)$.</p>
<p>Développements récents : hypothèses de régularité sur la fonction de régression (Lipschitz), conditions sur la densité et le bruit, bornes <b>inférieures</b>, autres cadres comme l’<b>apprentissage actif</b>.</p>
<p><b>Choix de la perte</b> : il dépend de l’application. Empreintes digitales : au supermarché, un faux rejet (client fidèle refusé) coûte cher et un faux accepté peu ; à la CIA, c’est l’inverse. La perte 0/1 symétrique n’est pas toujours la bonne.</p>
<p class="muted">Références : Valiant 1984 ; Bousquet, Boucheron, Lugosi 2004 ; Abu-Mostafa, <i>Learning from Data</i> 2012 ; Vapnik 2013 ; Shalev-Shwartz et Ben-David 2014.</p>`,
        notes: [],
      },
    ],

    cards: [
      ['slt-prereq', 'iid', R`Que signifie « i.i.d. » et pourquoi est-ce essentiel ?`, R`Indépendants (connaître un tirage n’apprend rien sur les autres) et identiquement distribués (tous suivent la même loi $P$). Toute la théorie suppose que l’entraînement et les futurs cas viennent de la même loi, tirés indépendamment.`],
      ['slt-prereq', 'Sn', R`Que désigne $S_n$ ?`, R`L’échantillon d’entraînement : les $n$ exemples étiquetés $\{(X_1,Y_1),\dots,(X_n,Y_n)\}$, tirés i.i.d. selon $P$ (S pour <i>sample</i>).`],
      ['slt-prereq', 'esperance', R`Qu’est-ce que l’espérance $\mathbb E[Z]$ ? Donne un exemple.`, R`La moyenne théorique (sur une infinité de tirages) : $\sum_kp_kz_k$. Dé équilibré : $\mathbb E[Z]=3{,}5$.`],
      ['slt-prereq', 'cond', R`Comment se lit $\mathbb P(Y=1\mid X=x)$ ?`, R`« Probabilité que $Y=1$ sachant que $X=x$ » : la probabilité de défaut pour un client qui a exactement le dossier $x$.`],
      ['slt-prereq', 'indic', R`Indicatrice $\mathbb 1[A]$ : définition et deux propriétés clés ?`, R`Vaut 1 si $A$ est vrai, 0 sinon. Une moyenne d’indicatrices est une proportion ; $\mathbb E[\mathbb 1[A]]=\mathbb P[A]$.`],
      ['slt-prereq', 'chapeau', R`Que signifie le chapeau, comme dans $\hat\mu_n$ ?`, R`Une estimation calculée sur les données (ici la moyenne empirique $\frac1n\sum_iZ_i$), par opposition à la vraie valeur inconnue $\mu$.`],
      ['slt-prereq', 'eps-delta', R`Rôles de $\epsilon$, $\delta$ et $\epsilon(n)$ dans une garantie ?`, R`$\epsilon$ : précision (écart toléré). $\delta$ : risque que la garantie échoue, $1-\delta$ = confiance. $\epsilon(n)$ : l’erreur garantie en fonction du nombre d’exemples, qui diminue quand $n$ grandit.`],
      ['slt-prereq', 'argmin', R`Différence entre $\min_{g}f(g)$ et $\arg\min_{g}f(g)$ ?`, R`$\min$ donne la plus petite valeur de $f$ ; $\arg\min$ donne l’élément $g$ qui l’atteint.`],
      ['slt-intro', 'valiant', R`Quelles sont les trois exigences de Valiant (1984) pour qu’une machine « apprenne » ?`, R`1) Apprendre des classes entières de concepts, que l’on sait caractériser. 2) Ces classes sont utiles et non triviales. 3) Un nombre polynomial d’étapes de calcul.`],
      ['slt-intro', 'cadre', R`Décris le cadre de l’apprentissage supervisé (5 ingrédients).`, R`$\mathcal X,\mathcal Y$ ; une loi $P$ inconnue sur $\mathcal X\times\mathcal Y$ ; un échantillon i.i.d. $S_n\sim P^n$ ; une classe $\mathcal H$ d’hypothèses $f:\mathcal X\to\mathcal Y$ ; un algorithme $\mathcal A:S_n\mapsto\hat g_n\in\mathcal H$ évalué par une perte $\ell$.`],
      ['slt-intro', 'overfit', R`Définition du sur-apprentissage, et l’exemple extrême du cours ?`, R`Bon sur l’échantillon, mauvais ailleurs. Exemple : $\hat g_n(x)=y_i$ si $x=x_i$, sinon 0 : zéro erreur sur les données, aucune généralisation (mémorisation).`],
      ['slt-intro', 'biais-inductif', R`Qu’est-ce que le biais inductif ?`, R`Le choix d’une classe $\mathcal H$ « adaptée au problème » (hypothèses a priori sur la forme de la solution). Sans lui, pas de généralisation possible.`],
      ['slt-intro', 'loss01', R`Perte 0/1 ?`, R`$\ell(\hat g(x),h(x))=1$ si $\hat g(x)\neq h(x)$, 0 sinon.`],
      ['slt-risk', 'risque-th', R`Risque théorique $R(g)$ : définition générale et cas binaire 0/1 ?`, R`$R(g)=\mathbb E_{X\sim P}[\ell(h(X),g(X))]$. En binaire avec la perte 0/1 : $R(g)=\mathbb P[Y\neq g(X)]$.`],
      ['slt-risk', 'risque-emp', R`Risque empirique $R_n(g)$ ?`, R`$R_n(g)=\frac1n\sum_{i=1}^n\ell(y_i,g(x_i))$, en binaire la fraction d’erreurs sur $S_n$. C’est une variable aléatoire (dépend de l’échantillon).`],
      ['slt-risk', 'obstacles', R`Pourquoi ne peut-on pas calculer $R(g)$ ?`, R`Deux limites : la loi $P$ est inconnue, et on n’a accès qu’à un échantillon fini de taille $n$.`],
      ['slt-risk', 'erm', R`Que désignent $g^*_{\mathcal H}$, $g^*_n$ et $g^*$ ?`, R`$g^*_{\mathcal H}=\arg\min_{\mathcal H}R$ (meilleur de la classe), $g^*_n=\arg\min_{\mathcal H}R_n$ (ERM, meilleur sur les données), $g^*=\arg\min_{\text{toutes }g}R$ (Bayes, oracle).`],
      ['slt-risk', 'realisable', R`Apprentissage réalisable vs agnostique ?`, R`Réalisable : le vrai classifieur est dans $\mathcal H$, donc $R(g_{\mathcal H})=0$. Agnostique (cas général) : $R(g_{\mathcal H})\ge0$.`],
      ['slt-bayes', 'eta', R`Fonction de régression $\eta(x)$ ?`, R`$\eta(x)=\mathbb P(Y=1\mid X=x)$ : probabilité de la classe 1 sachant $x$.`],
      ['slt-bayes', 'bayes', R`Classifieur de Bayes ?`, R`$g^*(x)=\mathbb 1[\eta(x)>\tfrac12]$. Il minimise $R(g)=\mathbb P[Y\neq g(X)]$ sur toutes les fonctions.`],
      ['slt-bayes', 'preuve', R`Étapes clés de la preuve d’optimalité du classifieur de Bayes ?`, R`Conditionner sur $X=x$ ; écrire $\mathbb P(Y\neq g(X)|x)=1-\mathbb 1[g=1]\eta-\mathbb 1[g=0](1-\eta)$ ; la différence avec $g^*$ vaut $(2\eta(x)-1)(\mathbb 1[g^*(x)=1]-\mathbb 1[g(x)=1])\ge0$ ; intégrer.`],
      ['slt-bayes', 'risque-bayes', R`Risque de Bayes $R(g^*)$ ?`, R`$R(g^*)=\mathbb E[\min(\eta(X),1-\eta(X))]$. Nul seulement sans bruit ($\eta\in\{0,1\}$).`],
      ['slt-decomp', 'decomp', R`Décomposition de l’excès de risque $R(g^*_n)-R(g^*)$ ?`, R`$\underbrace{R(g^*_{\mathcal H})-R(g^*)}_{\text{approximation}\approx\text{biais}}+\underbrace{R(g^*_n)-R(g^*_{\mathcal H})}_{\text{estimation}\approx\text{variance}}$.`],
      ['slt-decomp', 'questions', R`Les 4 questions de la théorie statistique de l’apprentissage ?`, R`Apprendre est-il faisable ? Quels $\mathcal H$ ? Combien de données $n$ ? Quelles garanties sur $\epsilon(n)$ ?`],
      ['slt-decomp', 'pac', R`Que veut dire PAC ?`, R`Probably Approximately Correct : avec probabilité au moins $1-\delta$ (probably), l’erreur est au plus $\epsilon$ (approximately correct).`],
      ['slt-lln', 'lgn-faible', R`Loi faible des grands nombres ?`, R`$X_i$ i.i.d. de moyenne $\mu$ : $\forall\epsilon>0,\ \lim_{n\to\infty}\mathbb P[|\hat\mu_n-\mu|\le\epsilon]=1$ (convergence en probabilité).`],
      ['slt-lln', 'lgn-forte', R`Loi forte des grands nombres ?`, R`$\mathbb P[\lim_{n\to\infty}\hat\mu_n=\mu]=1$ (convergence presque sûre).`],
      ['slt-lln', 'tcl-lgn', R`LGN et TCL : quelle différence ?`, R`LGN : $\hat\mu_n\to\mu$. TCL : $\sqrt n(\hat\mu_n-\mu)\to\mathcal N(0,\mathrm{Var}X)$, donc un écart de l’ordre de $\sqrt{\mathrm{Var}X/n}$. Les deux sont asymptotiques et le TCL dépend de la variance.`],
      ['slt-hoeffding', 'v1', R`Hoeffding version 1 (PAC) : énoncé complet ?`, R`$X_i$ i.i.d. dans $[0,1]$, moyenne $\mu$ : $\forall\epsilon>0$, $\mathbb P[|\hat\mu_n-\mu|>\epsilon]\le2e^{-2n\epsilon^2}$.`],
      ['slt-hoeffding', 'v2', R`Hoeffding version 2 (complexité d’échantillon) ?`, R`Si $n\ge\frac1{2\epsilon^2}\ln\frac2\delta$, alors avec probabilité $\ge1-\delta$, $|\hat\mu_n-\mu|\le\epsilon$.`],
      ['slt-hoeffding', 'v3', R`Hoeffding version 3 (borne d’erreur) ?`, R`À $n$ fixé, avec probabilité $\ge1-\delta$ : $|\hat\mu_n-\mu|\le\sqrt{\frac1{2n}\ln\frac2\delta}\sim\frac1{\sqrt n}$.`],
      ['slt-hoeffding', 'indep', R`De quoi la borne de Hoeffding ne dépend-elle pas ? Pourquoi est-ce important ?`, R`De la loi des $X_i$ (ni $\mu$, ni la variance) : la garantie vaut pour une loi $P$ inconnue. Contrepartie : elle est souvent pessimiste.`],
      ['slt-hoeffding', 'cout', R`« La précision coûte cher, la confiance non » : explique avec les formules.`, R`$\delta\to\delta/10$ : $n'=n+\frac1{2\epsilon^2}\ln10$ (on ajoute une constante). $\epsilon\to\epsilon/10$ : $n'=100n$ (car $n\propto1/\epsilon^2$).`],
      ['slt-hoeffding', 'concentration', R`Qu’est-ce qu’une inégalité de concentration ?`, R`Une borne sur la probabilité qu’une moyenne empirique s’écarte de sa moyenne théorique, avec une décroissance exponentielle quand l’écart grandit.`],
      ['slt-oneclf', 'billes', R`Dans l’analogie des billes pour un classifieur $g$, que représentent l’urne, une bille rouge, $\mu$ et $\nu$ ?`, R`L’urne = $\mathcal X$ ; bille rouge = point mal classé par $g$ ; $\mu=R(g)$ ; $\nu=R_n(g)$.`],
      ['slt-oneclf', 'hoeff-g', R`Hoeffding pour un classifieur donné ?`, R`Pour $g\in\mathcal H$ fixé avant les données : $\mathbb P[|R(g)-R_n(g)|>\epsilon]\le2e^{-2n\epsilon^2}$.`],
      ['slt-oneclf', 'verif', R`Pourquoi « Hoeffding pour un $g$ fixé » n’est-il pas encore de l’apprentissage ?`, R`Parce que $g$ est choisi avant de voir les données : on vérifie seulement sa qualité (comme un jeu de test). Apprendre, c’est choisir $g$ à partir des données.`],
      ['slt-oneclf', 'cancer', R`Que montre l’expérience Breast Cancer ($n=205,137,68,20$) ?`, R`L’écart moyen $|R-R_n|$ change peu mais sa variance augmente quand $n$ diminue ; la queue de l’histogramme = échantillons non représentatifs.`],
      ['slt-finite', 'probleme', R`Pourquoi Hoeffding ne s’applique-t-il pas directement au $g$ choisi par l’algorithme ?`, R`Hoeffding suppose $g$ connu avant de tirer l’échantillon. Ici $g$ est choisi après, parmi $M$ hypothèses, en fonction des données.`],
      ['slt-finite', 'pieces', R`Exemple des pièces : 1 pièce et 1000 pièces, probabilité de 10 piles sur 10 ?`, R`Une pièce : $2^{-10}\approx0{,}1\%$. Au moins une sur 1000 : $1-(1-2^{-10})^{1000}\approx63\%$.`],
      ['slt-finite', 'union', R`Union bound pour $|\mathcal H|=M$ ?`, R`$\mathbb P[|R(g)-R_n(g)|>\epsilon]\le\sum_m\mathbb P[|R(g_m)-R_n(g_m)|>\epsilon]\le2Me^{-2n\epsilon^2}$.`],
      ['slt-finite', 'v2M', R`Complexité d’échantillon pour $|\mathcal H|=M$ ?`, R`$n\ge\frac1{2\epsilon^2}\ln\frac{2M}\delta$.`],
      ['slt-finite', 'v3M', R`Borne d’erreur pour $|\mathcal H|=M$ ?`, R`$\epsilon=\sqrt{\frac1{2n}\ln\frac{2M}\delta}=O\big(\sqrt{\ln M/n}\big)$.`],
      ['slt-finite', 'uniforme', R`Que signifie « convergence uniforme » ici ?`, R`Avec probabilité $\ge1-2Me^{-2n\epsilon^2}$, tous les $g_m\in\mathcal H$ vérifient simultanément $|R(g_m)-R_n(g_m)|\le\epsilon$.`],
      ['slt-finite', 'pessimiste', R`Pourquoi l’union bound surestime-t-elle souvent ?`, R`Elle traite les événements comme disjoints (pire cas). Si les hypothèses font les mêmes erreurs, les événements se recouvrent : si toutes classent pareil, il faudrait compter $M=1$.`],
      ['slt-growth', 'dichotomie', R`Qu’est-ce qu’une dichotomie ?`, R`Un étiquetage $(h(x_1),\dots,h(x_n))$ des $n$ points réalisé par un $h\in\mathcal H$ : la « projection » de $\mathcal H$ sur les données.`],
      ['slt-growth', 'mH', R`Fonction de croissance $m_{\mathcal H}(n)$ ?`, R`Le nombre maximal de dichotomies sur $n$ points : $m_{\mathcal H}(n)=\max_{x_1..x_n}|\mathcal H(x_1,\dots,x_n)|\le2^n$.`],
      ['slt-growth', 'lin2', R`$m_{\mathcal H}(3)$ et $m_{\mathcal H}(4)$ pour les classifieurs linéaires du plan ?`, R`$m(3)=8=2^3$, $m(4)=14<16$ (les 2 configurations « XOR » sont impossibles).`],
      ['slt-growth', 'exemples', R`$m_{\mathcal H}(n)$ pour les rayons positifs, les intervalles positifs, les convexes du plan ?`, R`$n+1$ ; $\binom{n+1}2+1=\frac12(n^2+n+2)$ ; $2^n$.`],
      ['slt-growth', 'hoeff-inf', R`Hoeffding pour $\mathcal H$ infini avec la fonction de croissance ?`, R`$\mathbb P[|R(g)-R_n(g)|>\epsilon]\le2\,m_{\mathcal H}(n)e^{-2n\epsilon^2}$, et $\epsilon\sim\sqrt{\ln m_{\mathcal H}(n)/n}$.`],
      ['slt-growth', 'poly', R`Pourquoi veut-on $m_{\mathcal H}(n)$ polynomial ?`, R`Alors $m_{\mathcal H}(n)e^{-2n\epsilon^2}\to0$ : la borne garantit la généralisation. Si $m_{\mathcal H}(n)=2^n$, aucune garantie.`],
      ['slt-shatter', 'shatter', R`Définition de la pulvérisation (shattering) ?`, R`Un ensemble de $k$ points est pulvérisé par $\mathcal H$ si $\mathcal H$ réalise les $2^k$ étiquetages possibles sur ces points.`],
      ['slt-shatter', 'breakpoint', R`Définition d’un point de rupture ?`, R`$k$ est un point de rupture si aucun ensemble de $k$ points n’est pulvérisé, c’est-à-dire $m_{\mathcal H}(k)<2^k$.`],
      ['slt-shatter', 'bp-lin', R`Point de rupture des classifieurs linéaires du plan ?`, R`$k=4$ ($m(4)=14<16$). Tout $k\ge4$ en est aussi un.`],
      ['slt-shatter', 'bp-learn', R`Lien entre point de rupture et apprenabilité ?`, R`Pas de point de rupture : $m_{\mathcal H}(k)=2^k$ pour tout $k$. Un point de rupture existe : $m_{\mathcal H}$ est polynomial (Sauer), donc l’apprentissage est possible.`],
      ['slt-bnk', 'def', R`Définition de $B(n,k)$ ?`, R`Nombre maximal de dichotomies sur $n$ points sans qu’aucun groupe de $k$ points soit pulvérisé. Ne dépend ni de $\mathcal H$ ni de $\mathcal X$.`],
      ['slt-bnk', 'valeurs', R`$B(3,2)$, $B(4,2)$, $B(4,3)$ ?`, R`4, 5 et 11.`],
      ['slt-bnk', 'recurrence', R`Récurrence sur $B(n,k)$ et conditions aux bords ?`, R`$B(n,k)\le B(n-1,k)+B(n-1,k-1)$ ; $B(n,1)=1$ ; $B(1,k)=2$ pour $k\ge2$ ; $B(n,k)=2^n$ si $k>n$.`],
      ['slt-bnk', 'alpha-beta', R`Dans la preuve de la récurrence, d’où viennent $\alpha+\beta\le B(n-1,k)$ et $\beta\le B(n-1,k-1)$ ?`, R`Les $\alpha+\beta$ préfixes distincts ne pulvérisent pas $k$ points. Les $\beta$ préfixes doublés ne pulvérisent pas $k-1$ points, sinon avec $x_n$ (qui prend les deux valeurs) on en pulvériserait $k$.`],
      ['slt-bnk', 'sauer', R`Lemme de Sauer ?`, R`Si $\mathcal H$ a un point de rupture $k$ : $m_{\mathcal H}(n)\le B(n,k)\le\sum_{i=0}^{k-1}\binom ni=O(n^{k-1})$.`],
      ['slt-bnk', 'pascal', R`Argument « avec ou sans moi » ?`, R`$\binom ni=\binom{n-1}{i-1}+\binom{n-1}i$ : groupes de $i$ personnes parmi $n$ qui me contiennent, ou pas.`],
      ['slt-vc', 'dvc', R`Définition de la dimension VC ?`, R`$d_{VC}(\mathcal H)$ = cardinal du plus grand ensemble de points pulvérisé par $\mathcal H$. Le plus petit point de rupture est $k=d_{VC}+1$.`],
      ['slt-vc', 'jeu', R`Comment prouve-t-on $d_{VC}\ge k$ et $d_{VC}\le k$ ?`, R`$\ge k$ : exhiber UN ensemble de $k$ points et réaliser tous ses étiquetages. $\le k$ : montrer que POUR TOUT ensemble de $k+1$ points, un étiquetage est impossible.`],
      ['slt-vc', 'lineaire', R`$d_{VC}$ des classifieurs linéaires dans $\mathbb R^d$ ?`, R`$d+1$ (donc 3 dans le plan).`],
      ['slt-vc', 'sinus', R`Pourquoi $\mathrm{sgn}[\sin(\theta x)]$ est-il un contre-exemple célèbre ?`, R`Un seul paramètre mais $d_{VC}=\infty$ : la dimension VC n’est pas toujours le nombre de paramètres.`],
      ['slt-vc', 'nn', R`Borne sur la dimension VC d’un réseau à $\omega$ paramètres (activation booléenne) ?`, R`$d_{VC}\le2\omega\log_2(e\omega)$.`],
      ['slt-vc', 'sauer-shelah', R`Lemme de Sauer-Shelah ?`, R`Pour $n\ge d_{VC}$ : $m_{\mathcal H}(n)\le(en/d_{VC})^{d_{VC}}=O(n^{d_{VC}})$.`],
      ['slt-vc', 'borne-vc', R`Borne de généralisation finale avec la dimension VC ?`, R`$\mathbb P[\exists g,|R(g)-R_n(g)|>\epsilon]\le2(en/d_{VC})^{d_{VC}}e^{-2n\epsilon^2}$, donc $\epsilon\sim\sqrt{d_{VC}\ln n/n}$.`],
      ['slt-summary', 'compromis', R`Compromis complexité de $\mathcal H$ / généralisation ?`, R`$\mathcal H$ complexe : $R_n\downarrow$, $\epsilon\uparrow$ (sur-apprentissage). $\mathcal H$ simple : $R_n\uparrow$, $\epsilon\downarrow$.`],
      ['slt-summary', 'vitesses', R`Vitesses de convergence agnostique vs réalisable ?`, R`Agnostique : $\epsilon=O(1/\sqrt n)$. Réalisable : $\epsilon=O(1/n)$.`],
      ['slt-summary', 'complexites', R`Cite 4 mesures de complexité d’une classe d’hypothèses.`, R`Dimension VC (indépendante de la loi), entropie VC (dépend de la loi), moyennes de Rademacher (capacité à classer du bruit), nombres de recouvrement.`],
      ['slt-summary', 'perte', R`Exemple des empreintes digitales : que montre-t-il ?`, R`Le coût des erreurs dépend de l’application : au supermarché un faux rejet coûte cher, à la CIA c’est un faux accepté. La perte doit refléter ces coûts.`],
    ],

    quiz: [
      ['slt-prereq', R`Une banque entraîne son modèle sur les clients de 2019 et l’applique en pleine crise de 2020. Quelle hypothèse de la théorie est menacée ?`, ['les données ne sont plus identiquement distribuées (la loi a changé)', 'la perte n’est plus 0/1', 'l’échantillon est trop grand', 'la classe H est infinie'], 0, R`Les garanties supposent que les futurs cas suivent la même loi $P$ que l’échantillon.`],
      ['slt-prereq', R`Sur 200 dossiers, un classifieur se trompe 14 fois. Que vaut la moyenne des indicatrices d’erreur $\frac1n\sum_i\mathbb 1[g(x_i)\neq y_i]$ ?`, ['0,07', '14', '0,14', '186'], 0, R`$14/200=0{,}07$ : la moyenne d’indicatrices est une proportion.`],
      ['slt-prereq', R`$\delta=0{,}01$ dans une garantie PAC signifie :`, ['la garantie est vraie avec probabilité au moins 99 %', 'l’erreur est au plus 1 %', 'on a 1 % des données', 'la précision vaut 0,01'], 0, R`$\delta$ est le risque d’échec ; la confiance vaut $1-\delta=0{,}99$. La précision, c’est $\epsilon$.`],
      ['slt-prereq', R`Une pièce donne 1 (pile) avec probabilité 0,3 et 0 sinon. $\mathbb E[Z]$ vaut :`, ['0,3', '0,5', '0,7', '1'], 0, R`$0{,}3\times1+0{,}7\times0=0{,}3$.`],
      ['slt-intro', R`Un classifieur a 0 % d’erreur sur ses données d’entraînement et 45 % sur de nouvelles données. C’est :`, ['du sur-apprentissage', 'du sous-apprentissage', 'le classifieur de Bayes', 'un apprentissage réalisable'], 0, R`Bon in-sample, mauvais out-of-sample : la définition même du sur-apprentissage.`],
      ['slt-intro', R`Dans le cadre supervisé, qu’est-ce qui est inconnu ?`, ['la loi P qui génère les données', 'l’échantillon S_n', 'la classe H', 'la fonction de perte'], 0, R`On choisit $\mathcal H$ et $\ell$, on observe $S_n$ ; seule $P$ reste inconnue.`],
      ['slt-intro', R`Pourquoi le « mémoriseur » $\hat g_n(x)=y_i$ si $x=x_i$ (sinon 0) ne généralise-t-il pas ?`, ['il n’impose aucune structure : sa classe est trop riche (pas de biais inductif)', 'il fait trop d’erreurs sur les données', 'il est trop lent', 'il suppose P connue'], 0, R`Il peut coller à n’importe quel échantillon : il n’apprend rien de la structure du problème.`],
      ['slt-risk', R`Lequel de ces objets est une variable aléatoire ?`, [R`$R_n(g)$ pour un $g$ fixé`, R`$R(g)$ pour un $g$ fixé`, R`$R(g^*)$`, R`$\eta(x)$ pour un $x$ fixé`], 0, R`$R_n$ dépend de l’échantillon tiré ; $R$, $R(g^*)$ et $\eta(x)$ sont des quantités déterministes (inconnues).`],
      ['slt-risk', R`L’ERM renvoie :`, [R`$\arg\min_{g\in\mathcal H}R_n(g)$`, R`$\arg\min_{g\in\mathcal H}R(g)$`, R`$\arg\min_{g}R(g)$`, R`le classifieur de Bayes`], 0, R`Empirical Risk Minimization : on minimise ce qu’on sait calculer, le risque empirique, dans la classe $\mathcal H$.`],
      ['slt-risk', R`Si le vrai classifieur appartient à $\mathcal H$, on parle d’apprentissage :`, ['réalisable', 'agnostique', 'actif', 'non supervisé'], 0, R`Réalisable : $R(g_{\mathcal H})=0$.`],
      ['slt-bayes', R`$\eta(x)=0{,}7$. Que prédit le classifieur de Bayes, et quelle est sa probabilité d’erreur en $x$ ?`, ['1, erreur 0,3', '1, erreur 0,7', '0, erreur 0,3', '0, erreur 0,7'], 0, R`$\eta>1/2$ donc on prédit 1 ; on se trompe quand $Y=0$, probabilité $1-\eta=0{,}3=\min(\eta,1-\eta)$.`],
      ['slt-bayes', R`Le risque de Bayes vaut 0 si et seulement si (presque partout) :`, [R`$\eta(x)\in\{0,1\}$`, R`$\eta(x)=1/2$`, R`$\mathcal H$ est fini`, R`$n\to\infty$`], 0, R`$R(g^*)=\mathbb E[\min(\eta,1-\eta)]=0$ exige $\min(\eta,1-\eta)=0$ : aucune ambiguïté sur l’étiquette.`],
      ['slt-bayes', R`Dans la preuve, la différence des probabilités d’erreur vaut :`, [R`$(2\eta(x)-1)(\mathbb 1[g^*(x)=1]-\mathbb 1[g(x)=1])$`, R`$(1-2\eta(x))(\mathbb 1[g^*(x)=1]-\mathbb 1[g(x)=1])$`, R`$\eta(x)-\tfrac12$`, R`$\min(\eta,1-\eta)$`], 0, R`Ce produit est toujours $\ge0$ par définition de $g^*$.`],
      ['slt-decomp', R`On remplace un modèle linéaire par un réseau de neurones profond, à $n$ fixé. En général :`, ['l’approximation baisse, l’estimation monte', 'l’approximation monte, l’estimation baisse', 'les deux baissent', 'les deux montent'], 0, R`Classe plus riche : on approche mieux $g^*$ (biais ↓) mais on choisit parmi plus de candidats avec les mêmes données (variance ↑). C’est ta note du slide 24.`],
      ['slt-lln', R`Pourquoi la loi des grands nombres ne suffit-elle pas pour la théorie de l’apprentissage ?`, ['Elle est asymptotique : aucune garantie pour un n fini', 'Elle suppose des variables gaussiennes', 'Elle ne vaut que pour les dés', 'Elle demande de connaître μ'], 0, R`On veut des garanties pour $n$ fini et indépendantes de la loi : inégalités de concentration.`],
      ['slt-hoeffding', R`Hoeffding exige des $X_i$ :`, ['i.i.d. et bornées (dans [0,1])', 'gaussiennes', 'de variance connue', 'indépendantes mais pas forcément bornées'], 0, R`Hypothèses : i.i.d. et bornées. Rien sur la forme de la loi.`],
      ['slt-hoeffding', R`On veut 10 fois plus de confiance ($\delta\to\delta/10$). Le nombre d’exemples :`, [R`augmente de $\frac{\ln10}{2\epsilon^2}$`, 'est multiplié par 10', 'est multiplié par 100', 'ne change pas'], 0, R`$n=\frac1{2\epsilon^2}\ln\frac2\delta$ : diviser $\delta$ par 10 ajoute $\frac1{2\epsilon^2}\ln10$.`],
      ['slt-hoeffding', R`On veut 10 fois plus de précision ($\epsilon\to\epsilon/10$). Le nombre d’exemples :`, ['est multiplié par 100', 'est multiplié par 10', R`augmente de $\ln 10$`, 'est multiplié par √10'], 0, R`$n\propto1/\epsilon^2$.`],
      ['slt-hoeffding', R`À $\delta$ fixé, la borne d’erreur de Hoeffding décroît comme :`, [R`$1/\sqrt n$`, R`$1/n$`, R`$e^{-n}$`, R`$\ln n/n$`], 0, R`$\epsilon=\sqrt{\ln(2/\delta)/(2n)}$.`],
      ['slt-oneclf', R`On évalue un classifieur déjà entraîné sur un jeu de test indépendant de 1000 exemples. Quelle borne s’applique ?`, [R`Hoeffding simple : $2e^{-2n\epsilon^2}$`, R`l’union bound $2Me^{-2n\epsilon^2}$`, R`la borne VC`, 'aucune'], 0, R`Le classifieur est fixé avant de voir le jeu de test : c’est exactement le cas « un classifieur donné ».`],
      ['slt-finite', R`Pourquoi l’union bound fait-elle apparaître le facteur $M$ ?`, ['On borne la probabilité qu’au moins un des M classifieurs ait un écart > ε', 'Car chaque classifieur a M fois plus d’erreurs', 'Car on tire M échantillons', 'Car la variance est multipliée par M'], 0, R`$\mathbb P[\cup_m A_m]\le\sum_m\mathbb P[A_m]\le M\cdot2e^{-2n\epsilon^2}$.`],
      ['slt-finite', R`À $n$ et $\delta$ fixés, si $M$ est multiplié par 1000, la borne d’erreur $\epsilon$ :`, [R`augmente doucement, comme $\sqrt{\ln M}$`, 'est multipliée par 1000', 'est multipliée par √1000', 'ne change pas'], 0, R`$\epsilon=\sqrt{\ln(2M/\delta)/(2n)}$ : la dépendance en $M$ est logarithmique.`],
      ['slt-growth', R`Pour une classe $\mathcal H$ quelconque et $n$ points :`, [R`$m_{\mathcal H}(n)\le2^n$`, R`$m_{\mathcal H}(n)\le n$`, R`$m_{\mathcal H}(n)=|\mathcal H|$`, R`$m_{\mathcal H}(n)\ge2^n$`], 0, R`Il n’existe que $2^n$ étiquetages binaires de $n$ points.`],
      ['slt-growth', R`Combien de dichotomies les classifieurs linéaires du plan réalisent-ils sur 4 points en position générale ?`, ['14', '16', '8', '12'], 0, R`Toutes sauf les 2 configurations XOR.`],
      ['slt-growth', R`Quelle classe a $m_{\mathcal H}(n)=2^n$ pour tout $n$ ?`, ['les ensembles convexes du plan', 'les rayons positifs', 'les intervalles positifs', 'les classifieurs linéaires du plan'], 0, R`Avec des points sur un cercle, tout sous-ensemble est l’intersection du cercle avec un polygone convexe.`],
      ['slt-shatter', R`Pour montrer que $k$ est un point de rupture, il faut montrer que :`, ['aucun ensemble de k points n’est pulvérisé', 'un ensemble de k points n’est pas pulvérisé', 'tous les ensembles de k points sont pulvérisés', 'm(k) = 2^k'], 0, R`Point de rupture : $m_{\mathcal H}(k)<2^k$, donc aucun ensemble de taille $k$ n’est pulvérisé.`],
      ['slt-shatter', R`3 points ALIGNÉS du plan avec étiquettes +, −, + :`, ['ne peuvent pas être séparés linéairement, mais d_VC vaut quand même 3', 'prouvent que d_VC < 3', 'prouvent que d_VC = 2', 'sont pulvérisés'], 0, R`Pour $d_{VC}\ge3$ il suffit d’UN ensemble de 3 points pulvérisé (3 points non alignés).`],
      ['slt-bnk', R`D’après Sauer, si le point de rupture est $k=4$, $m_{\mathcal H}(n)$ est au plus de l’ordre de :`, [R`$n^3$`, R`$n^4$`, R`$2^n$`, R`$n$`], 0, R`$\sum_{i=0}^{k-1}\binom ni=O(n^{k-1})$.`],
      ['slt-bnk', R`Que vaut $B(n,1)$ ?`, ['1', 'n', '2', R`$2^n$`], 0, R`Ne pas pulvériser 1 point : chaque point garde une seule valeur, donc une seule ligne possible.`],
      ['slt-vc', R`Dimension VC des classifieurs linéaires de $\mathbb R^5$ ?`, ['6', '5', '25', '32'], 0, R`$d_{VC}=d+1$.`],
      ['slt-vc', R`Une classe a $d_{VC}=3$. Son plus petit point de rupture est :`, ['4', '3', '2', '8'], 0, R`$k=d_{VC}+1$.`],
      ['slt-vc', R`Avec la dimension VC, la borne d’erreur décroît comme :`, [R`$\sqrt{d_{VC}\ln n/n}$`, R`$d_{VC}/n$`, R`$e^{-n/d_{VC}}$`, R`$1/\ln n$`], 0, R`$\epsilon\sim\sqrt{\ln m_{\mathcal H}(n)/n}$ avec $\ln m_{\mathcal H}(n)\le d_{VC}\ln(en/d_{VC})$.`],
      ['slt-summary', R`Dans le cadre réalisable, l’erreur décroît typiquement en :`, [R`$O(1/n)$`, R`$O(1/\sqrt n)$`, R`$O(\ln n)$`, R`$O(1)$`], 0, R`Réalisable : $O(1/n)$ ; agnostique : $O(1/\sqrt n)$.`],
      ['slt-summary', R`Quelle mesure de complexité s’interprète comme « la capacité de la classe à classer du bruit » ?`, ['les moyennes de Rademacher', 'la dimension VC', 'les nombres de recouvrement', 'le point de rupture'], 0, R`Rademacher : corrélation maximale avec des étiquettes aléatoires ±1.`],
    ],

    gens: {
      'slt-hoeffding': [
        () => {
          const eps = pick([0.01, 0.02, 0.05, 0.1]), delta = pick([0.01, 0.05, 0.1]);
          const n = Math.ceil(Math.log(2 / delta) / (2 * eps * eps));
          return { q: R`Combien d’exemples faut-il au minimum pour garantir $|\hat\mu_n-\mu|\le${f(eps)}$ avec probabilité au moins $${f(1 - delta)}$ (Hoeffding, $X_i\in[0,1]$) ?`, a: n, tol: 1, unit: 'exemples',
            expl: R`$n\ge\frac1{2\epsilon^2}\ln\frac2\delta=\frac{\ln(${f(2 / delta)})}{2\times${f(eps * eps, 4)}}\approx${f(Math.log(2 / delta) / (2 * eps * eps), 1)}$, donc $n=${n}$.` };
        },
        () => {
          const n = pick([100, 200, 500, 1000, 2000, 10000]), delta = pick([0.01, 0.05, 0.1]);
          const eps = Math.sqrt(Math.log(2 / delta) / (2 * n));
          return { q: R`Avec $n=${n}$ observations dans $[0,1]$, quelle précision $\epsilon$ Hoeffding garantit-il avec confiance $${f(1 - delta)}$ ? (3 décimales)`, a: eps, tol: 0.002,
            expl: R`$\epsilon=\sqrt{\frac{1}{2n}\ln\frac2\delta}=\sqrt{\frac{\ln ${f(2 / delta)}}{${2 * n}}}\approx${f(eps)}$.` };
        },
        () => {
          const n = pick([50, 100, 200, 300]), eps = pick([0.05, 0.1, 0.15]);
          const b = 2 * Math.exp(-2 * n * eps * eps);
          return { q: R`Hoeffding version 1 : borne sur $\mathbb P[|\hat\mu_n-\mu|>${f(eps)}]$ pour $n=${n}$ ? (3 décimales ; une borne > 1 ne dit rien)`, a: b, tol: 0.002,
            expl: R`$2e^{-2n\epsilon^2}=2e^{-${f(2 * n * eps * eps, 2)}}\approx${f(b)}$.${b > 1 ? ' Ici la borne dépasse 1 : elle n’apporte aucune information.' : ''}` };
        },
        () => {
          const eps = pick([0.02, 0.05, 0.1]);
          const add = Math.log(10) / (2 * eps * eps);
          return { q: R`Pour $\epsilon=${f(eps)}$, combien d’exemples supplémentaires faut-il pour passer de $\delta$ à $\delta/10$ (10 fois plus de confiance) ? (arrondi à l’unité)`, a: add, tol: 1,
            expl: R`$\Delta n=\frac{\ln10}{2\epsilon^2}=\frac{2{,}303}{${f(2 * eps * eps, 4)}}\approx${f(add, 0)}$. Une constante : la confiance est bon marché.` };
        },
      ],
      'slt-finite': [
        () => {
          const M = pick([10, 100, 1000, 1e6]), eps = pick([0.05, 0.1]), delta = pick([0.01, 0.05]);
          const n = Math.ceil(Math.log(2 * M / delta) / (2 * eps * eps));
          return { q: R`$|\mathcal H|=${M >= 1e6 ? '10^6' : M}$, $\epsilon=${f(eps)}$, $\delta=${f(delta)}$. Combien d’exemples suffisent pour que $|R(g)-R_n(g)|\le\epsilon$ avec probabilité $\ge1-\delta$ ?`, a: n, tol: 1, unit: 'exemples',
            expl: R`$n\ge\frac1{2\epsilon^2}\ln\frac{2M}\delta=\frac{${f(Math.log(2 * M / delta), 2)}}{${f(2 * eps * eps, 4)}}$, donc $n=${n}$.` };
        },
        () => {
          const M = pick([50, 100, 1000]), n = pick([500, 1000, 5000]), delta = 0.05;
          const eps = Math.sqrt(Math.log(2 * M / delta) / (2 * n));
          return { q: R`$|\mathcal H|=${M}$, $n=${n}$, $\delta=0{,}05$. Borne d’erreur $\epsilon$ garantie pour le classifieur choisi ? (3 décimales)`, a: eps, tol: 0.002,
            expl: R`$\epsilon=\sqrt{\frac1{2n}\ln\frac{2M}\delta}=\sqrt{\frac{${f(Math.log(2 * M / delta), 3)}}{${2 * n}}}\approx${f(eps)}$.` };
        },
        () => {
          const M = pick([100, 500, 1000, 5000]), p = 2 ** -10;
          const r = 1 - (1 - p) ** M;
          return { q: R`On lance ${M} pièces équilibrées 10 fois chacune. Probabilité (en %) qu’au moins une fasse 10 piles ? (1 décimale)`, a: r * 100, tol: 0.15, unit: '%',
            expl: R`$1-(1-2^{-10})^{${M}}\approx${f(r * 100, 1)}\,\%$. Voilà pourquoi choisir parmi beaucoup d’hypothèses favorise les « gagnants » chanceux.` };
        },
      ],
      'slt-bayes': [
        () => {
          const ps = pick([[0.5, 0.3, 0.2], [0.4, 0.4, 0.2], [0.25, 0.25, 0.5], [0.6, 0.3, 0.1]]);
          const etas = [pick([0.9, 0.8, 0.2, 0.1]), pick([0.6, 0.4, 0.7, 0.3]), pick([0.5, 0.95, 0.05, 0.65])];
          const r = ps.reduce((s, p, i) => s + p * Math.min(etas[i], 1 - etas[i]), 0);
          return { q: R`$\mathcal X=\{a,b,c\}$ avec $P(a)=${f(ps[0])}$, $P(b)=${f(ps[1])}$, $P(c)=${f(ps[2])}$ et $\eta(a)=${f(etas[0])}$, $\eta(b)=${f(etas[1])}$, $\eta(c)=${f(etas[2])}$. Risque de Bayes $R(g^*)$ ? (3 décimales)`, a: r, tol: 0.001,
            expl: R`$R(g^*)=\sum_x P(x)\min(\eta(x),1-\eta(x))=${ps.map((p, i) => `${f(p)}\times${f(Math.min(etas[i], 1 - etas[i]))}`).join('+')}=${f(r)}$.` };
        },
      ],
      'slt-growth': [
        () => { const n = rnd(3, 12); return { q: R`Rayons positifs sur $\mathbb R$ ($h(x)=\mathrm{sgn}(x-a)$) : que vaut $m_{\mathcal H}(${n})$ ?`, a: n + 1, tol: 0, expl: R`$m_{\mathcal H}(n)=n+1$ : $a$ peut se placer dans $n+1$ intervalles.` }; },
        () => { const n = rnd(3, 12), v = binom(n + 1, 2) + 1; return { q: R`Intervalles positifs sur $\mathbb R$ : que vaut $m_{\mathcal H}(${n})$ ?`, a: v, tol: 0, expl: R`$\binom{n+1}2+1=\binom{${n + 1}}2+1=${v}$ (choisir 2 des $n+1$ emplacements pour $a<b$, plus le cas « tout négatif »).` }; },
        () => { const n = rnd(3, 10); return { q: R`Ensembles convexes du plan : que vaut $m_{\mathcal H}(${n})$ ?`, a: 2 ** n, tol: 0, expl: R`Points sur un cercle : tous les étiquetages sont réalisables, $2^{${n}}=${2 ** n}$.` }; },
      ],
      'slt-bnk': [
        () => {
          const k = rnd(2, 5), n = rnd(k + 1, 10);
          let s = 0; for (let i = 0; i < k; i++) s += binom(n, i);
          return { q: R`Borne de Sauer : que vaut $\sum_{i=0}^{k-1}\binom ni$ pour $n=${n}$ et $k=${k}$ ?`, a: s, tol: 0,
            expl: R`$${Array.from({ length: k }, (_, i) => R`\binom{${n}}{${i}}`).join('+')}=${Array.from({ length: k }, (_, i) => binom(n, i)).join('+')}=${s}$, à comparer à $2^{${n}}=${2 ** n}$.` };
        },
        () => {
          const [n, k, v] = pick([[3, 2, 4], [4, 2, 5], [4, 3, 11], [5, 2, 6], [5, 3, 16], [3, 3, 7]]);
          return { q: R`Que vaut $B(${n},${k})$ ?`, a: v, tol: 0, expl: R`Le lemme de Sauer est atteint : $B(n,k)=\sum_{i=0}^{k-1}\binom ni=${v}$.` };
        },
      ],
      'slt-vc': [
        () => { const d = rnd(2, 20); return { q: R`Dimension VC des classifieurs linéaires (hyperplans affines) de $\mathbb R^{${d}}$ ?`, a: d + 1, tol: 0, expl: R`$d_{VC}=d+1=${d + 1}$.` }; },
        () => {
          const d = pick([3, 5, 10]), n = pick([100, 1000, 10000]);
          const m = (Math.E * n / d) ** d;
          return { q: R`Sauer-Shelah : borne $(en/d_{VC})^{d_{VC}}$ pour $d_{VC}=${d}$, $n=${n}$, en ordre de grandeur : $\log_{10}$ de la borne ? (1 décimale)`, a: Math.log10(m), tol: 0.15,
            expl: R`$d\log_{10}(en/d)=${d}\times\log_{10}(${f(Math.E * n / d, 1)})\approx${f(Math.log10(m), 1)}$, bien moins que $\log_{10}2^{${n}}\approx${f(n * Math.log10(2), 0)}$.` };
        },
      ],
    },
  });
})();
