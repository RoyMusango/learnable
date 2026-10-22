// Glossaire des notations. Chaque entrée dit comment lire un symbole et ce qu'il désigne, dans les chapitres où il a ce sens
// (un même symbole change de sens d'un chapitre à l'autre : ε est une précision en théorie de l'apprentissage, un taux
// d'exploration en RL). `re` repère le symbole dans le texte source (LaTeX) d'une fiche, d'une carte ou d'un exercice.
// L'app en tire l'encadré « Notations » en tête de chaque fiche et le bouton « Notations » des cartes et exercices.
(function () {
  const R = String.raw;
  // Groupes de chapitres (les chapitres de l'espace Projet reprennent les notations du cours)
  const SLT = ['slt', 'al', 'pj-al', 'pj-tfe', 'tp1', 'tp2'], AL = ['al', 'pj-al', 'pj-tfe', 'tp2'], BD = ['bd', 'pj-bd', 'pj-tfe', 'tp3'], RL = ['rl', 'tp4'], TS = ['ts'];
  const ALL = null;
  const E = (sym, name, def, re, chs = ALL) => ({ sym, name, def, re: new RegExp(re), chs });

  COURSE.glossary = [
    // ---------- Probabilités : la boîte à outils commune ----------
    E(R`\text{i.i.d.}`, 'indépendants et identiquement distribués', R`Des tirages qui suivent tous la <b>même loi</b> et dont aucun ne renseigne sur les autres, comme des lancers de dé successifs.`, R`i\.i\.d`),
    E(R`X,\ Y\ \ /\ \ x,\ y`, 'variable aléatoire / valeur observée', R`Majuscule : une quantité aléatoire (le dossier du prochain client $X$, son issue $Y$). Minuscule : une valeur précise observée.`, R`\(X,\s?Y\)|[XYZxyz]_\{?(i|1|n|m|k)\b|X=x|p_k`, [...SLT, 'ts']),
    E(R`P,\ \ X\sim P`, 'la loi (distribution)', R`La description complète du hasard qui génère les données. « $X\sim P$ » : $X$ suit la loi $P$. En apprentissage, $P$ est <b>inconnue</b>.`, R`loi \$P\$|\\sim P|P\^n|P\^m|\$P\$`, SLT),
    E(R`P^n`, 'loi de n tirages i.i.d.', R`La loi de l’échantillon entier : $n$ tirages indépendants de la même loi $P$.`, R`P\^n|P\^m`, SLT),
    E(R`\mathbb P[A]`, 'probabilité', R`La probabilité de l’événement $A$, entre 0 et 1.`, R`\\mathbb P`),
    E(R`\mathbb P(A\mid B)`, 'probabilité conditionnelle', R`Probabilité de $A$ <b>sachant</b> que $B$ est vrai : on ne regarde que les cas où $B$ se produit.`, R`\\mid`),
    E(R`\mathbb E[Z]`, 'espérance', R`La moyenne théorique de $Z$ (sur une infinité de tirages) : $\sum_kp_kz_k$. $\mathbb E_{X\sim P}$ précise la loi selon laquelle on moyenne.`, R`\\mathbb E`),
    E(R`\mathrm{Var}(Z)`, 'variance', R`La dispersion autour de la moyenne : $\mathbb E[(Z-\mathbb E Z)^2]$. Sa racine carrée est l’écart type $\sigma$.`, R`\\mathrm\{Var\}|Var\(`),
    E(R`\mathbb 1[A]`, 'indicatrice', R`Vaut 1 si $A$ est vrai, 0 sinon. Moyenne d’indicatrices = proportion ; $\mathbb E[\mathbb 1[A]]=\mathbb P[A]$.`, R`\\mathbb 1|I \\\{`),
    E(R`\hat{\ \ }`, 'le chapeau', R`Signale une quantité <b>estimée</b> à partir des données ($\hat\mu_n$, $\hat g_n$, $\hat\phi$), par opposition à la vraie valeur inconnue.`, R`\\hat`),
    E(R`\sum_{i=1}^n`, 'somme', R`Somme des termes pour $i$ allant de 1 à $n$. $\frac1n\sum_{i=1}^n$ est une moyenne sur les $n$ exemples.`, R`\\sum`),
    E(R`\forall,\ \exists`, 'pour tout, il existe', R`$\forall\epsilon>0$ : « quelle que soit la valeur positive de $\epsilon$ ». $\exists h$ : « il existe au moins un $h$ ».`, R`\\forall|\\exists`),
    E(R`\arg\min,\ \arg\max`, 'argmin, argmax', R`L’élément qui rend une quantité la plus petite (la plus grande). $\min$ donne la valeur, $\arg\min$ donne le gagnant.`, R`\\arg`),
    E(R`\sim`, 'suit la loi / de l’ordre de', R`Deux sens selon le contexte : « $X\sim P$ » se lit « $X$ suit la loi $P$ » ; entre deux expressions, « $\epsilon\sim1/\sqrt n$ » signifie « du même ordre de grandeur que ».`, R`\\sim`),
    E(R`O(\cdot)`, 'grand O', R`Croissance à une constante près : $O(1/\sqrt n)$ est divisé par 2 quand $n$ est multiplié par 4 ; $O(n^d)$ croît au plus comme $n^d$.`, R`(^|[^\\a-zA-Z])O\(`),
    E(R`\ln,\ \log,\ e^{x}`, 'logarithme, exponentielle', R`$\ln$ : logarithme népérien ($\ln e^x=x$). $e^{-x}$ décroît très vite : c’est ce qui rend les bornes exponentielles puissantes.`, R`\\ln|\\log|e\^\{|\\exp`),
    E(R`\lim_{n\to\infty},\ \liminf`, 'limite', R`Ce que devient une quantité quand $n$ grandit sans fin. $\liminf$ : la plus petite valeur dont la suite s’approche indéfiniment.`, R`\\lim`),
    E(R`\sup,\ \|\cdot\|_\infty`, 'supremum, norme infinie', R`$\sup$ : le plus petit majorant (un « max » qui n’est pas forcément atteint). $\|v\|_\infty=\max_s|v(s)|$ : le plus grand écart, état par état.`, R`\\sup|_\\infty`),
    E(R`\binom ni`, 'i parmi n', R`Nombre de façons de choisir $i$ objets parmi $n$ : $\frac{n!}{i!\,(n-i)!}$.`, R`\\binom`),
    E(R`|A|,\ |x|`, 'cardinal, valeur absolue', R`Nombre d’éléments d’un ensemble ; pour un nombre, sa distance à 0.`, R`\|\\mathcal H\||\|\\hat|\|R\(`),
    E(R`\mathcal N(\mu,\sigma^2)`, 'loi normale (gaussienne)', R`La courbe en cloche de moyenne $\mu$ et de variance $\sigma^2$.`, R`\\mathcal N`),
    E(R`\mathcal B(\mu)`, 'loi de Bernoulli', R`Vaut 1 avec probabilité $\mu$, 0 sinon (un clic, une guérison, un succès).`, R`\\mathcal B\(|Bernoulli`),
    E(R`D_{KL}(P\|Q)`, 'divergence de Kullback-Leibler', R`Mesure à quel point la loi $P$ diffère de $Q$ : $\int p\log\frac pq$. Nulle si $P=Q$, non symétrique.`, R`D_\{KL\}|D\(P|d\(\\mu|\bKL\b`, [...AL, ...BD]),

    // ---------- Théorie statistique de l'apprentissage ----------
    E(R`\mathcal X,\ \mathcal Y`, 'espaces des entrées et des étiquettes', R`$\mathcal X$ : toutes les entrées possibles (les dossiers, par ex. $\mathbb R^2$). $\mathcal Y$ : les étiquettes possibles (par ex. $\{0,1\}$).`, R`\\mathcal X|\\mathcal Y`, SLT),
    E(R`S_n`, 'l’échantillon', R`Les $n$ exemples étiquetés $\{(X_1,Y_1),\dots,(X_n,Y_n)\}$ tirés i.i.d. selon $P$ (S pour <i>sample</i>).`, R`S_n`, SLT),
    E(R`n`, 'taille de l’échantillon', R`Le nombre d’exemples dont on dispose.`, R`\$n\$|\$n=|n\\ge|n\\to`, SLT),
    E(R`h`, 'le vrai classifieur', R`Celui qui donne les vraies étiquettes : inconnu, c’est ce qu’on cherche à imiter.`, R`h\(X\)|h\(x`, ['slt', 'tp1']),
    E(R`f,\ g`, 'une hypothèse (classifieur candidat)', R`Une fonction $\mathcal X\to\mathcal Y$ qui prédit une étiquette ; on la choisit dans la classe $\mathcal H$.`, R`g\(x|g\(X|f:\\mathcal|g_[m1M]`, ['slt', 'tp1']),
    E(R`\mathcal H`, 'classe d’hypothèses', R`L’ensemble des classifieurs parmi lesquels on cherche (tous les linéaires, tous les réseaux d’une architecture…).`, R`\\mathcal H`, SLT),
    E(R`\mathcal A`, 'l’algorithme d’apprentissage', R`La procédure qui transforme un échantillon en classifieur : $S_n\mapsto\hat g_n$.`, R`\\mathcal A`, ['slt', 'tp1']),
    E(R`\hat g_n`, 'le classifieur appris', R`Le classifieur construit (chapeau) par l’algorithme à partir des $n$ exemples (indice $n$).`, R`\\hat g_n`, ['slt', 'tp1']),
    E(R`\ell`, 'fonction de perte', R`Le coût d’une prédiction. Perte 0/1 : 1 en cas d’erreur, 0 sinon.`, R`\\ell`, SLT),
    E(R`R(g)`, 'risque théorique', R`La probabilité d’erreur de $g$ sur un nouveau cas (perte moyenne sous la vraie loi) : inconnue.`, R`R\(g|R\(h`, SLT),
    E(R`R_n(g)`, 'risque empirique', R`La fraction d’erreurs de $g$ sur l’échantillon : calculable, mais dépend du tirage.`, R`R_n\(g|R_n\$|R_n\(`, ['slt', 'tp1']),
    E(R`g^*,\ g^*_{\mathcal H},\ g^*_n`, 'les trois optimums', R`$g^*$ : le classifieur de Bayes (meilleur possible, toutes fonctions). $g^*_{\mathcal H}$ : le meilleur de la classe. $g^*_n$ : le meilleur sur les données (ERM). L’étoile marque un optimum.`, R`g\^\*`, ['slt', 'tp1']),
    E(R`\eta(x)`, 'fonction de régression', R`$\mathbb P(Y=1\mid X=x)$ : la probabilité que l’étiquette soit 1 pour l’entrée $x$.`, R`\\eta`, SLT),
    E(R`\epsilon,\ \epsilon(n)`, 'précision', R`L’écart toléré entre l’estimation et la vérité. $\epsilon(n)$ : l’erreur que l’on peut garantir avec $n$ exemples ; elle diminue quand $n$ grandit.`, R`\\epsilon|ϵ`, SLT),
    E(R`\delta,\ 1-\delta`, 'risque, confiance', R`$\delta$ : probabilité que la garantie échoue (échantillon malchanceux). $1-\delta$ : la confiance ($\delta=0{,}05$ donne 95 %).`, R`\\delta`, [...SLT, ...BD]),
    E(R`\mu,\ \hat\mu_n,\ \nu`, 'moyenne vraie / empirique', R`$\mu$ : la vraie moyenne (inconnue). $\hat\mu_n$, aussi notée $\nu$ : la moyenne des $n$ observations.`, R`\\mu|\\nu`, ['slt', 'tp1']),
    E(R`M=|\mathcal H|`, 'nombre d’hypothèses', R`Quand la classe est finie, son nombre d’éléments : la mesure de complexité la plus simple.`, R`\$M\$|2M|\|=M`, ['slt', 'tp1']),
    E(R`\mathcal H(x_1,\dots,x_n)`, 'les dichotomies', R`L’ensemble des étiquetages différents que $\mathcal H$ produit sur les points $x_1..x_n$ (au plus $2^n$).`, R`\\mathcal H\(x_1`, ['slt', 'tp1']),
    E(R`m_{\mathcal H}(n)`, 'fonction de croissance', R`Le nombre maximal de dichotomies que $\mathcal H$ réalise sur $n$ points : remplace $M$ quand la classe est infinie.`, R`m_\{\\mathcal H\}`, ['slt', 'tp1']),
    E(R`k`, 'point de rupture', R`Un nombre de points qu’aucun ensemble ne permet de pulvériser : $m_{\mathcal H}(k)<2^k$.`, R`rupture`, ['slt', 'tp1']),
    E(R`B(n,k)`, 'B(n, k)', R`Le nombre maximal d’étiquetages de $n$ points sans pulvériser $k$ points : une borne purement combinatoire sur $m_{\mathcal H}(n)$.`, R`B\(n,\s?k\)|B\(n-1`, ['slt', 'tp1']),
    E(R`d_{VC}`, 'dimension VC', R`La taille du plus grand ensemble de points que $\mathcal H$ peut pulvériser : la complexité de la classe.`, R`d_\{VC\}`, SLT),

    // ---------- Apprentissage actif ----------
    E(R`D_l,\ D_u`, 'données étiquetées / non étiquetées', R`$D_l$ : les points dont on connaît l’étiquette ; $D_u$ : le réservoir de points sans étiquette.`, R`D_l|D_u`, AL),
    E(R`P_\theta(y\mid x)`, 'probabilité prédite', R`La probabilité que le classifieur courant (de paramètres $\theta$) attribue à la classe $y$ pour le point $x$.`, R`P_\\theta|P_\{\\theta`, AL),
    E(R`\hat y,\ \hat y_1,\ \hat y_2`, 'classes prédites', R`$\hat y$ : la classe la plus probable selon le classifieur ; $\hat y_1,\hat y_2$ : la première et la deuxième.`, R`\\hat y`, AL),
    E(R`x^*`, 'le point choisi', R`Le point dont on va demander l’étiquette (celui qui maximise le critère d’informativité).`, R`x\^\*`, AL),
    E(R`N_c`, 'nombre de classes', R`Le nombre d’étiquettes possibles.`, R`N_c`, AL),
    E(R`\mathcal V(Z)`, 'version space', R`Les hypothèses encore compatibles avec toutes les données étiquetées $Z$.`, R`\\mathcal V`, AL),
    E(R`\mathcal R(\mathcal H),\ DIS`, 'région de désaccord', R`Les points sur lesquels au moins deux hypothèses de $\mathcal H$ prédisent des étiquettes différentes.`, R`\\mathcal R\(|DIS`, AL),
    E(R`C,\ V(y_i)`, 'comité, votes', R`$C$ : le nombre de classifieurs du comité ; $V(y_i)$ : le nombre de membres qui votent pour l’étiquette $y_i$.`, R`V\(y_i\)|\\mathcal C`, AL),
    E(R`\theta,\ \theta^{(c)}`, 'classifieur (paramètres) / coefficient de désaccord', R`Deux usages : dans $P_\theta(y\mid x)$, $\theta$ désigne le classifieur courant (ses paramètres), et $\theta^{(c)}$ le $c$-ième membre du comité ; dans les bornes de complexité, $\theta$ est le coefficient de désaccord (vitesse à laquelle la région de désaccord grandit).`, R`\\theta`, AL),
    E(R`H_t`, 'hypothèses encore en lice', R`Dans CAL : l’ensemble des hypothèses compatibles avec toutes les étiquettes demandées jusqu’à l’étape $t$ ($H_1=\mathcal H$ au départ).`, R`H_\{?[t1]`, AL),
    E(R`x_t,\ y_t`, 'point du flux et son étiquette', R`Le point reçu à l’étape $t$ (scénario en flux) et l’étiquette qu’on demande éventuellement à l’oracle.`, R`[xy]_\{?t`, AL),
    E(R`P_{XY}`, 'loi jointe', R`La loi des couples (entrée, étiquette), inconnue, comme $P$ en théorie de l’apprentissage.`, R`P_\{XY\}`, AL),
    E(R`\nu`, 'meilleur taux d’erreur', R`Dans les bornes agnostiques : l’erreur du meilleur classifieur de la classe.`, R`\\nu\^2|\\nu\$`, AL),

    // ---------- Bandits ----------
    E(R`K,\ a`, 'nombre de bras, un bras', R`$K$ : le nombre de machines (actions possibles) ; $a\in\{1,\dots,K\}$ : l’une d’elles.`, R`K bras|\\\{1\.\.K\\\}|\\\{1,\\dots,K\\\}|\$K\$`, BD),
    E(R`A_t,\ X_t`, 'action et gain à l’instant t', R`$A_t$ : le bras tiré au tour $t$ ; $X_t$ : le gain observé.`, R`A_\{?[t1]|X_\{?[t1]`, BD),
    E(R`n`, 'horizon', R`Le nombre total de tirages (parfois inconnu).`, R`horizon`, BD),
    E(R`\nu_a,\ \mu_a`, 'loi et moyenne d’un bras', R`$\nu_a$ : la loi des gains du bras $a$ ; $\mu_a$ : son gain moyen (inconnu).`, R`\\nu_a|\\mu_a|\\nu_\{A|\\nu\^\*|\\nu_\{`, BD),
    E(R`\mu^*,\ a^*`, 'meilleur bras', R`$a^*$ : le bras de plus grand gain moyen ; $\mu^*=\max_a\mu_a$ : ce gain.`, R`\\mu\^\*|a\^\*`, BD),
    E(R`\Delta_a`, 'écart du bras a', R`$\mu^*-\mu_a$ : ce que coûte en moyenne un tirage du bras $a$ au lieu du meilleur.`, R`\\Delta`, BD),
    E(R`N_a(n)`, 'nombre de tirages', R`Combien de fois le bras $a$ a été tiré pendant les $n$ premiers tours (aléatoire).`, R`N_a`, BD),
    E(R`R_n`, 'regret', R`$n\mu^*-\mathbb E[\sum_tX_t]$ : le gain perdu par rapport à quelqu’un qui aurait connu le meilleur bras dès le départ.`, R`R_n|R\(n\)`, BD),
    E(R`S_n`, 'gain cumulé', R`La somme des gains obtenus après $n$ tirages (aléatoire). (En théorie de l’apprentissage, $S_n$ désigne l’échantillon.)`, R`S_n`, ['bd', 'tp3']),
    E(R`H_t,\ \pi`, 'historique, politique', R`$H_t$ : toutes les actions et tous les gains jusqu’à $t$ ; $\pi$ : la règle qui choisit le prochain bras à partir de l’historique.`, R`H_t|\\pi`, BD),
    E(R`\hat\mu_a(t)`, 'moyenne empirique d’un bras', R`La moyenne des gains observés sur le bras $a$ jusqu’au tour $t$.`, R`\\hat\\mu_a|\\hat\\mu_1`, BD),
    E(R`m`, 'durée d’exploration (ETC)', R`Le nombre de tirages de chaque bras pendant la phase d’exploration d’Explore-Then-Commit.`, R`m\$ fois|\$m=|m\\le`, BD),
    E(R`UCB,\ LCB`, 'bornes de confiance', R`Borne supérieure (Upper) et inférieure (Lower) de l’intervalle dans lequel la vraie moyenne $\mu_a$ se trouve avec grande probabilité.`, R`UCB|LCB`, BD),
    E(R`\mathrm{Beta}(\alpha,\beta)`, 'loi Beta', R`Loi sur $[0,1]$ qui décrit ce qu’on croit de $\mu_a$ ; $\alpha-1$ succès et $\beta-1$ échecs observés (a priori uniforme), moyenne $\frac\alpha{\alpha+\beta}$.`, R`Beta`, BD),
    E(R`S_a(t),\ \theta_a(t)`, 'succès, tirage a posteriori', R`$S_a(t)$ : nombre de succès du bras $a$ ; $\theta_a(t)$ : la valeur tirée au hasard dans la loi a posteriori de ce bras (Thompson).`, R`S_a|\\theta_a`, BD),
    E(R`\epsilon`, 'taux d’exploration', R`Dans ε-greedy : la proportion des tours où l’on choisit un bras au hasard.`, R`\\epsilon`, ['bd', 'tp3']),
    E(R`\tau`, 'temps d’arrêt', R`L’instant où l’on cesse d’explorer (ETC séquentiel) ou de tirer (identification du meilleur bras).`, R`\\tau`, BD),

    // ---------- Apprentissage par renforcement ----------
    E(R`S,\ A,\ s,\ a,\ s'`, 'états, actions', R`$S$ : l’ensemble des états, $A$ celui des actions ; $s$ l’état courant, $a$ l’action choisie, $s'$ l’état d’arrivée.`, R`s'|[sSaA]_\{?[t0]|\\\{S,\s?A|\\mathcal T`, RL),
    E(R`T(s,a,s')`, 'fonction de transition', R`La probabilité d’arriver en $s'$ quand on fait l’action $a$ dans l’état $s$.`, R`T\(s`, RL),
    E(R`R(s,a,s')`, 'récompense', R`Le gain immédiat reçu lors de la transition $s\xrightarrow{a}s'$. $R_{\max}$ : la plus grande récompense possible.`, R`R\(s|R_\{\\max\}|R_\{?[t12]|r_\{?t`, RL),
    E(R`\pi`, 'politique', R`La règle de décision : $\pi(s)$ = l’action choisie en $s$, ou $\pi(a\mid s)$ = la probabilité de choisir $a$.`, R`\\pi`, RL),
    E(R`\gamma`, 'facteur d’actualisation', R`Entre 0 et 1 : le poids d’une récompense future ($\gamma$ proche de 0 : agent myope ; proche de 1 : prévoyant).`, R`\\gamma`, RL),
    E(R`G_t`, 'retour', R`La somme actualisée des récompenses futures : $\sum_i\gamma^iR_{t+i+1}$.`, R`G_`, RL),
    E(R`v_\pi(s),\ q_\pi(s,a)`, 'valeur, q-valeur', R`$v_\pi(s)$ : le retour moyen en partant de $s$ et en suivant $\pi$. $q_\pi(s,a)$ : idem, en commençant par l’action $a$.`, R`v_\\pi|q_\\pi|v\^\{\\pi|v\(s|q\(s`, RL),
    E(R`v^*,\ q^*,\ \pi^*`, 'optimums', R`La meilleure valeur, la meilleure q-valeur et la politique optimale.`, R`v\^\*|q\^\*|\\pi\^\*`, RL),
    E(R`\mathcal L`, 'opérateur de Bellman', R`L’opération « appliquer une fois l’équation de Bellman » : $v\mapsto\max_a\sum_{s'}T[R+\gamma v(s')]$. $v^*$ en est le point fixe.`, R`\\mathcal L`, RL),
    E(R`\alpha`, 'taux d’apprentissage', R`La part de nouvelle information injectée à chaque mise à jour : ancien $+\ \alpha\,($cible $-$ ancien$)$.`, R`\\alpha`, RL),
    E(R`\delta,\ \Delta`, 'erreur TD', R`L’écart entre la cible ($r+\gamma\,v(s')$ ou $r+\gamma\max q$) et l’estimation actuelle ; on corrige d’une fraction $\alpha$ de cet écart.`, R`\\delta|\\Delta`, RL),
    E(R`\epsilon`, 'tolérance ou taux d’exploration', R`Deux usages : dans value iteration, l’erreur visée (on s’arrête quand on est à moins de $\epsilon$ de $v^*$) ; dans ε-greedy, la probabilité de jouer une action au hasard plutôt que la meilleure connue.`, R`\\epsilon`, RL),
    E(R`\beta,\ \tau`, 'inverse de la température, température', R`Dans la politique softmax : $\tau=1/\beta$ ; température élevée = choix presque uniforme, faible = glouton.`, R`\\beta|\\tau`, RL),
    E(R`w,\ f_i(s,a)`, 'poids, features', R`Les caractéristiques $f_i$ décrivent un état (distance au fantôme…) ; les poids $w_i$ disent leur importance dans $q\approx\sum_iw_if_i$.`, R`w_|f_|w\^`, RL),

    // ---------- Séries temporelles ----------
    E(R`x_t,\ X_t`, 'la série', R`$x_t$ : la valeur observée à l’instant $t$ ; $X_t$ : la variable aléatoire correspondante (le processus).`, R`[xX]_|[yY]_\{?t`, TS),
    E(R`W_t`, 'bruit blanc (innovation)', R`Des chocs aléatoires de moyenne nulle, de variance constante $\sigma_w^2$, non corrélés entre eux.`, R`W_`, TS),
    E(R`T_t,\ S_t,\ C_t,\ R_t`, 'composantes', R`Tendance, saisonnalité, cycle et résidu dans la décomposition d’une série.`, R`[TSCR]_\{?t`, TS),
    E(R`B`, 'opérateur retard', R`Décale d’un pas dans le passé : $BX_t=X_{t-1}$, $B^jX_t=X_{t-j}$.`, R`B\^|\(B\)|BX_t`, TS),
    E(R`\nabla,\ \nabla_s`, 'différenciation', R`$\nabla X_t=X_t-X_{t-1}$ (enlève une tendance) ; $\nabla_sX_t=X_t-X_{t-s}$ (différence saisonnière, période $s$).`, R`\\nabla`, TS),
    E(R`\gamma_k,\ \rho_k`, 'autocovariance, autocorrélation', R`$\gamma_k=\mathrm{Cov}(X_t,X_{t+k})$ ; $\rho_k=\gamma_k/\gamma_0$, la corrélation entre la série et elle-même décalée de $k$.`, R`\\gamma_|\\rho`, TS),
    E(R`r_k,\ c_k`, 'estimations', R`Les versions calculées sur les données de $\rho_k$ et $\gamma_k$.`, R`[rcRC]_\{?[kp0-9S]`, TS),
    E(R`\phi_{kk}`, 'autocorrélation partielle', R`La corrélation entre $X_t$ et $X_{t+k}$ une fois retirée l’influence des valeurs intermédiaires.`, R`\\phi_\{kk\}`, TS),
    E(R`\phi_j,\ \Phi_p(B)`, 'coefficients AR', R`Les poids des valeurs passées dans un AR(p) ; $\Phi_p(z)=1-\phi_1z-\dots-\phi_pz^p$.`, R`\\phi|\\Phi`, TS),
    E(R`\theta_j,\ \Theta_q(B)`, 'coefficients MA', R`Les poids des chocs passés dans un MA(q) ; $\Theta_q(z)=1-\theta_1z-\dots-\theta_qz^q$.`, R`\\theta|\\Theta`, TS),
    E(R`\psi_j,\ \Pi_j`, 'poids MA(∞), AR(∞)', R`Les coefficients quand on réécrit le processus comme somme infinie de chocs passés ($\psi_j$) ou de valeurs passées ($\Pi_j$).`, R`\\psi|\\Pi|\\Psi`, TS),
    E(R`p,\ d,\ q\ \ (P,D,Q)_S`, 'ordres du modèle', R`$p$ : ordre AR, $d$ : nombre de différenciations, $q$ : ordre MA ; en majuscules, les mêmes pour la partie saisonnière de période $S$.`, R`ARIMA|ARMA\(p`, TS),
    E(R`\sigma^2,\ \sigma_w^2`, 'variance de la série, du bruit', R`$\sigma_x^2$ : variance de la série ; $\sigma_w^2$ : variance du bruit blanc.`, R`\\sigma`, TS),
    E(R`N`, 'longueur de la série', R`Le nombre d’observations.`, R`\\sqrt N|1/N|\$N\$`, TS),
    E(R`\hat X_t(l),\ E_t(l),\ V(l)`, 'prévision', R`$\hat X_t(l)$ : prévision faite en $t$ pour $t+l$ ; $E_t(l)$ : l’erreur de cette prévision ; $V(l)$ : sa variance.`, R`\\hat X_t|E_t\(l|V\(l`, TS),
    E(R`\lambda`, 'paramètre de Box-Cox', R`L’exposant de la transformation $\frac{x^\lambda-1}\lambda$ ($\lambda=0$ : logarithme).`, R`\\lambda`, TS),
    E(R`\chi^2_{K-p-q}`, 'loi du khi-deux', R`La loi de référence des tests du portemanteau ; $K-p-q$ est son nombre de degrés de liberté.`, R`\\chi`, TS),

    // ---------- Ajouts du 23/10 (chapitres complétés) ----------
    E(R`d(h,h')`, 'distance de désaccord', R`La probabilité que $h$ et $h'$ donnent des étiquettes différentes à un point tiré au hasard.`, R`d\(h,\s?h'|d\(h,h`, AL),
    E(R`B(h,r)`, 'boule de désaccord', R`Les hypothèses à distance de désaccord au plus $r$ de $h$.`, R`B\(h`, AL),
    E(R`P_{\mathcal C}`, 'consensus du comité', R`La moyenne des probabilités prédites par les membres du comité (QBC).`, R`P_\{?\\mathcal C`, AL),
    E(R`b`, 'niveau de bruit borné', R`Bruit borné : $|\eta(x)-\frac12|>b$ pour tout $x$ ; plus $b$ est grand, moins le bruit est fort.`, R`\|\\eta\(x\)`, AL),
    E(R`\tau,\ \delta`, 'temps d’arrêt, risque', R`Identification du meilleur bras : $\tau$ est l’instant où l’on s’arrête, $\delta$ la probabilité tolérée de recommander un mauvais bras.`, R`\\tau|\\delta`, ['bd', 'pj-bd']),
    E(R`\hat T,\ \hat R`, 'modèle estimé', R`RL model-based : les fréquences de transition et les récompenses moyennes observées dans les épisodes.`, R`\\hat T|\\hat R`, RL),
    E(R`A(s,a)`, 'avantage', R`$q(s,a)-v(s)$ : ce que l’action $a$ apporte par rapport à la valeur de l’état (dueling DQN). À ne pas confondre avec $A$, l’ensemble des actions.`, R`A\(s,\s?a\)`, RL),
    E(R`D`, 'mémoire de rejeu', R`DQN : la mémoire des transitions $(s,a,r,s')$ où l’on tire les mini-lots d’apprentissage.`, R`rejeu|replay`, RL),
    E(R`Q^*,\ Q_{BP}`, 'statistiques du portemanteau', R`Ljung-Box ($Q^*$) et Box-Pierce ($Q_{BP}$) : testent si les résidus sont un bruit blanc ; on les compare à un $\chi^2$ à $K-p-q$ degrés de liberté.`, R`Q\^\*|Q_\{BP\}|Ljung`, TS),
    E(R`\mathbb E_t(\cdot)`, 'espérance conditionnelle au passé', R`L’espérance sachant toutes les valeurs observées jusqu’à la date $t$ : la base des prévisions.`, R`\\mathbb E_t`, TS),
    E(R`u_{\varepsilon/2}`, 'quantile de la loi normale', R`La valeur qu’une loi normale centrée réduite dépasse avec probabilité $\varepsilon/2$ ; 1,96 pour un intervalle à 95 %.`, R`u_\{\\varepsilon`, TS),
    E(R`\omega_i`, 'racines caractéristiques', R`Les racines de l’équation caractéristique d’un AR ; il est stationnaire quand toutes sont de module $<1$.`, R`\\omega`, TS),
    // ---------- Compléments (repérés par la vérification de couverture) ----------
    E(R`\mathbb R,\ \mathbb R^d`, 'nombres réels', R`L’ensemble des nombres réels ; $\mathbb R^d$ : les vecteurs de $d$ nombres (un point du plan pour $d=2$).`, R`\\mathbb R`),
    E(R`H_0`, 'hypothèse nulle', R`Dans un test statistique, l’hypothèse qu’on cherche à rejeter (par ex. « les résidus sont un bruit blanc »).`, R`H_0`, TS),
    E(R`\mu`, 'moyenne du processus', R`$\mathbb E(X_t)$, constante pour un processus stationnaire.`, R`\\mu`, TS),
    E(R`U_{a,t}`, 'indice UCB', R`L’indice du bras $a$ au tour $t$ : moyenne empirique + bonus d’exploration ; UCB joue le bras d’indice maximal.`, R`U_\{`, BD),
    E(R`Y_a(s)`, 's-ième gain du bras a', R`Le gain obtenu la $s$-ième fois que le bras $a$ a été tiré.`, R`Y_a|Y_1\(s|Y_\{`, BD),
    E(R`\alpha`, 'exposant de confiance (UCB)', R`Dans UCB : on vise une confiance $1-1/t^\alpha$ avec $\alpha>1$ ; plus $\alpha$ est grand, plus le bonus d’exploration est large. (Dans Thompson, $\alpha,\beta$ sont les paramètres de la loi Beta.)`, R`\\alpha`, BD),
    E(R`\mathcal U([0,1]),\ \mathcal L(\cdot)`, 'loi uniforme, loi de', R`$\mathcal U([0,1])$ : toutes les valeurs entre 0 et 1 également probables (a priori « je ne sais rien »). $\mathcal L(\mu_a\mid\dots)$ : la loi de $\mu_a$ sachant les observations.`, R`\\mathcal U|\\mathcal L\(`, BD),
    E(R`\Gamma`, 'fonction Gamma', R`Généralise la factorielle : $\Gamma(k)=(k-1)!$ ; sert à normaliser la densité Beta.`, R`\\Gamma`, BD),
    E(R`v_k,\ q_k`, 'estimation à l’itération k', R`La valeur (ou q-valeur) calculée après $k$ mises à jour ; elle s’approche de $v^*$ (ou $q^*$) quand $k$ grandit.`, R`[vq]_\{?[kKt0-9]`, RL),
    E(R`\lambda`, 'paramètre de TD(λ)', R`Entre 0 et 1 : le poids donné aux erreurs TD des pas suivants (0 : TD(0), proche de 1 : proche de Monte-Carlo).`, R`\\lambda`, RL),
    E(R`\theta,\ u`, 'paramètres de la politique', R`Les poids du réseau qui représente directement la politique $\pi_\theta$ (méthodes de policy gradient).`, R`\\theta|\\pi\(s,\s?u`, RL),
  ];

  // Notations présentes dans un texte, pour un chapitre donné, dans l'ordre de première apparition
  COURSE.notationsIn = (text, ch) => {
    const out = [];
    for (const g of COURSE.glossary) {
      if (g.chs && !g.chs.includes(ch)) continue;
      const m = g.re.exec(text);
      if (m) out.push({ g, at: m.index });
    }
    // Un même symbole peut avoir une entrée générale et une entrée propre au chapitre : on garde la plus spécifique
    const seen = new Set();
    return out.sort((a, b) => (a.g.chs ? 0 : 1) - (b.g.chs ? 0 : 1)).filter(x => { const k = x.g.sym; if (seen.has(k)) return false; seen.add(k); return true; })
      .sort((a, b) => a.at - b.at).map(x => x.g);
  };
  // Première notion (dans l'ordre du cours, chapitre de la notion) où une notation apparaît
  COURSE.firstUse = (g, ch) => COURSE.chapter(ch).sections.find(id => g.re.test(COURSE.sections[id].fiche + COURSE.sections[id].summary));
})();
