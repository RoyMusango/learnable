// Chapitre : Reinforcement Learning 1, 2 et 3 (X. Siebert, slides RL1, RL2, RL3).
(function () {
  const R = String.raw;
  const { pick, rnd, f } = COURSE.u;
  // Nombre entre parenthèses s'il est négatif (pour écrire « 3 + (−2) » proprement)
  const par = (x, d = 3) => (x < 0 ? `(${f(x, d)})` : f(x, d));

  // MDP de la voiture du cours : états c (cool), w (warm), o (overheated, absorbant)
  function carStep(v, g) {
    const c = Math.max(1 * (1 + g * v.c), 0.5 * (2 + g * v.c) + 0.5 * (2 + g * v.w));
    const w = Math.max(0.5 * (1 + g * v.c) + 0.5 * (1 + g * v.w), 1 * (-10 + g * 0));
    return { c, w, o: 0 };
  }
  // Évaluation exacte de la politique « Fast avec probabilité p en Cool, Slow en Warm » (système 2 × 2, règle de Cramer)
  function carEval(p, g) {
    const a11 = 1 - g * (1 - 0.5 * p), a12 = -g * 0.5 * p, a21 = -0.5 * g, a22 = 1 - 0.5 * g;
    const b1 = 1 + p, b2 = 1, det = a11 * a22 - a12 * a21;
    return { c: (b1 * a22 - a12 * b2) / det, w: (a11 * b2 - a21 * b1) / det };
  }

  COURSE.add({
    id: 'rl',
    title: 'Apprentissage par renforcement',
    short: 'Renforcement',
    source: 'RL1.pdf, RL2.pdf, RL3.pdf · 216 slides',
    seen: null,
    pitch: 'Un agent apprend à décider en interagissant : MDP, équations de Bellman, value et policy iteration, Monte-Carlo, TD, SARSA, q-learning, q-learning approché, Deep Q-Network et ses astuces, policy gradient, actor-critic.',
    sections: [
      {
        id: 'rl-mdp', title: 'Processus de décision markoviens (MDP)', slides: 'RL1 1-33',
        summary: 'Agent, environnement, état, action, récompense. MDP = (S, A, T, T, R). Propriété de Markov. Politique déterministe ou stochastique.',
        fiche: R`
<p><b>L’idée</b> : un agent apprend à décider en agissant. À chaque pas, il observe une situation, choisit une action, reçoit une récompense et se retrouve dans une nouvelle situation. Il cherche la règle de choix qui rapporte le plus <b>sur la durée</b>, pas seulement au pas suivant. Le MDP (<i>Markov Decision Process</i>) est le modèle mathématique de ce problème quand on connaît les règles du jeu.</p>
<h4>1. Pourquoi ce chapitre</h4>
<p>Deep Blue bat Kasparov aux échecs en 1997 grâce à l’ingénierie de la connaissance (fonction d’évaluation écrite par des experts, bibliothèques de coups) et à la puissance de calcul. AlphaGo Zero (2017) apprend le go par <b>deep reinforcement learning</b> sans connaissance experte. La puissance de calcul compte, mais ne suffit pas : le tic-tac-toe a 255 168 parties distinctes (5478 états), les échecs environ $10^{120}$ nœuds pour 80 coups, le go $10^{170}$ à $10^{360}$ nœuds pour 150 coups, alors que l’univers compte environ $10^{80}$ atomes. On ne peut pas tout énumérer.</p>
<p class="muted">Le slide 3 montre Ke Jie face à « AlphaGo Zero ». Le match de mai 2017 contre Ke Jie a été joué par la version AlphaGo Master ; AlphaGo Zero est la version sans connaissance experte publiée en octobre 2017 (Silver et al., Nature 2017, cité en référence du cours). À confirmer avec le Prof. Siebert (RL1 slide 3).</p>
<p><b>Deep RL = RL + deep learning</b> : une approche computationnelle de l’apprentissage par interaction, qui résout des tâches de décision séquentielle jusque-là hors de portée. Le cours ne traite pas la théorie des jeux classique (le <b>minimax</b> minimise le pire cas à chaque coup, ce qui interdit tout coup risqué).</p>
<p><b>Origines</b> (années 1960) : la psychologie expérimentale (conditionnement animal de Pavlov, 1904 ; le mot « renforcement » est employé par Pavlov en 1927) et les neurosciences computationnelles. <b>Applications</b> : les jeux (Atari Breakout : actions gauche ou droite, retour occasionnel = le score ; dames de Samuel en 1952, TD-Gammon en 1992) et les robots (observations = positions et angles des pièces, actions = forces et couples, renforcement = garder l’équilibre, se déplacer). Les deux exemples jouets du <a class="link" href="#course/tp4-avant">TP4</a> sont GridWorld (MDP, RL de base, q-learning) et PacMan (q-learning, q-learning approché, deep q-learning).</p>
<h4>2. Le schéma agent / environnement</h4>
<div class="def">À l’instant $t$ :
<ul><li>$s_t$ : l’<b>état</b>, l’information (parfois partielle) dont l’agent dispose sur l’environnement ;</li>
<li>$a_t$ : l’<b>action</b> choisie par l’agent ;</li>
<li>$r_{t+1}$ : la <b>récompense</b> reçue en retour, indicée $t+1$ parce qu’elle arrive avec le nouvel état $s_{t+1}$.</li></ul>
La <b>politique</b> $\pi$ (ou stratégie) est la procédure qui choisit les actions. L’objectif : maximiser la <b>récompense cumulée</b>.</div>
<h4>3. Chaîne de Markov et propriété de Markov</h4>
<div class="def"><b>Chaîne de Markov</b> : un graphe orienté dont les nœuds sont les états ($\in S$) et dont les arêtes portent les probabilités de transition ($\in\mathcal T$) d’un état à l’autre. Ni actions, ni récompenses.<br>
$S_t$ (majuscule) est l’état aléatoire à l’instant $t$, $s_t$ (minuscule) sa valeur observée. $T(s,s')=\mathbb P(S_{t+1}=s'\mid S_t=s)$ se lit « probabilité d’être en $s'$ au pas suivant sachant qu’on est en $s$ ».<br>
<b>Propriété de Markov</b> (sans mémoire) : $T(s,s')$ ne dépend que de $S_t$, pas de l’histoire $S_{t-1},S_{t-2},\dots$ Autrement dit, sachant le présent, futur et passé sont indépendants.</div>
<p><b>Exemple du cours (météo)</b> : Soleil reste Soleil avec probabilité 0,4 et passe à Pluie avec 0,6 ; Pluie passe à Soleil avec 0,7 et reste Pluie avec 0,3. Chaque ligne somme à 1. Il fait soleil aujourd’hui : probabilité de pluie dans deux jours ? Deux chemins, $S\to S\to P$ et $S\to P\to P$ :
$$0{,}4\times0{,}6+0{,}6\times0{,}3=0{,}24+0{,}18=0{,}42.$$</p>
<h4>4. Le MDP</h4>
<div class="def"><b>MDP</b> : processus de contrôle stochastique à temps discret, décrit par le quintuplet $\{S,A,\mathcal T,T,R\}$ :
<ul><li>$S$ : l’ensemble des états ; $A$ : l’ensemble des actions ;</li>
<li>$\mathcal T$ (T calligraphique) : l’ensemble des transitions possibles, des triplets $(s,a,s')$, par exemple (Warm, Slow, Warm) ;</li>
<li>$T:\mathcal T\to[0,1]$, $T(s,a,s')=\mathbb P(S_{t+1}=s'\mid S_t=s,A_t=a)$ : la probabilité d’arriver en $s'$ en jouant $a$ dans $s$ ;</li>
<li>$R:\mathcal T\to\mathbb R$, $R(s,a,s')$ : la récompense de cette transition.</li></ul>
Les transitions sont <b>stochastiques</b> : la même action dans le même état ne mène pas toujours au même endroit. Le cours suppose le système <b>totalement observable</b>.</div>
<p><b>Exemple de la voiture</b> (le MDP fil rouge du chapitre) :</p>
<table><tr><th>État, action</th><th>Arrivée (probabilité)</th><th>Récompense</th></tr>
<tr><td>Cool, Slow</td><td>Cool (1)</td><td>+1</td></tr>
<tr><td>Cool, Fast</td><td>Cool (0,5), Warm (0,5)</td><td>+2</td></tr>
<tr><td>Warm, Slow</td><td>Cool (0,5), Warm (0,5)</td><td>+1</td></tr>
<tr><td>Warm, Fast</td><td>Overheated (1)</td><td>−10</td></tr></table>
<p>Le cours écrit $R(s,\text{Fast},s')=-10$ si $s'$ = Overheated, $+2$ sinon : la récompense dépend bien de l’arrivée. Overheated est <b>absorbant</b> : $T(s,a,s)=1$ pour toute action $a$, on n’en sort plus.</p>
<p><b>Savoir-faire</b> : depuis Cool, on joue Fast deux fois. Après le premier pas (+2), on est en Cool ou en Warm avec probabilité 0,5. Le second Fast rapporte +2 depuis Cool et −10 depuis Warm (surchauffe). Probabilité de surchauffe : 0,5. Récompense totale espérée : $2+0{,}5\times2+0{,}5\times(-10)=2+1-5=-2$. Jouer vite deux fois est donc mauvais en moyenne, alors que le premier pas seul rapporte +2.</p>
<div class="def"><b>Markov pour un MDP</b> : en général, les conséquences d’une action pourraient dépendre de tout le passé, $\mathbb P(S_{t+1}=s',R_{t+1}=r\mid S_t,R_t,A_t,\dots,S_0,R_0,A_0)$. La propriété de Markov dit qu’elles ne dépendent que du dernier pas : $\mathbb P(S_{t+1}=s',R_{t+1}=r\mid S_t=s_t,A_t=a_t)$. L’agent n’a donc aucun intérêt à regarder tout l’historique.<br>
<b>MDP fini</b> : $S$, $A$ et $\mathcal T$ ont un nombre fini d’éléments. On peut aussi dessiner un MDP comme un <b>arbre</b> (état, puis action, puis états d’arrivée avec leurs probabilités).</div>
<h4>5. Politiques</h4>
<div class="def"><b>Règle de décision</b> à l’instant $t$ :
<ul><li>déterministe : $\pi_t:S\to A$, $s\mapsto a=\pi_t(s)$, l’action à jouer en $s$ ;</li>
<li>stochastique : $\pi_t:S\times A\to\mathbb R$, $(s,a)\mapsto\pi_t(s,a)$, la probabilité de jouer $a$ en $s$.</li></ul>
Une <b>politique</b> est une suite de règles $\pi=(\pi_0,\pi_1,\pi_2,\dots)$ : elle définit le comportement de l’agent. Notation stochastique du cours : $\pi(a,s)=\pi(a\mid s)=\mathbb P[A_t=a\mid S_t=s]$. Elle est <b>stationnaire</b> si $\pi_t=\pi$ pour tout $t$.</div>
<p><b>Tâche épisodique</b> : l’agent agit un nombre fini de pas, d’un état de départ $s_0$ jusqu’à un état terminal, puis on remet l’état à $s_0$ (une partie de PacMan). <b>Tâche continue</b> : pas d’état terminal, elle ne finit jamais. <b>Résoudre</b> un MDP, c’est trouver la politique optimale $\pi^*$, celle qui maximise une récompense cumulée (définie à la notion suivante).</p>
<h4>Pièges</h4>
<ul><li>Une chaîne de Markov n’a ni actions ni récompenses ; un MDP ajoute les deux.</li>
<li>Les probabilités somment à 1 <b>sur les arrivées</b> $s'$, pour chaque couple $(s,a)$ fixé : $\sum_{s'}T(s,a,s')=1$. Pas sur les actions.</li>
<li>La propriété de Markov porte sur la <b>description de l’état</b>. Si l’état est incomplet, elle tombe : une seule image de Breakout ne dit pas dans quelle direction va la balle. C’est pourquoi le DQN prend en entrée les 4 dernières images (voir la fiche DQN).</li>
<li>Le cours écrit $\pi(a,s)$ : l’action d’abord, l’état ensuite. Ne pas confondre avec $T(s,a,s')$, où l’état vient d’abord.</li></ul>
<h4>Lien finance</h4>
<p>Exécuter un gros ordre est une décision séquentielle de ce type. Prenons un gérant qui doit vendre 10 000 titres en 4 périodes. L’état est (titres restant à vendre, période, prix courant), l’action la quantité vendue à cette période, la récompense le produit de la vente diminué du coût d’impact sur le prix ; la transition est stochastique parce que le prix bouge. Tout vendre d’un coup déplace le prix, vendre trop lentement expose au risque de marché : c’est l’arbitrage entre gain immédiat et gain futur que le MDP formalise. Pour que la propriété de Markov tienne, l’état doit contenir tout ce qui influence la suite.</p>
<div class="def"><b>À retenir</b><ul>
<li>MDP $=\{S,A,\mathcal T,T,R\}$ : $T(s,a,s')$ est une probabilité d’arrivée, $R(s,a,s')$ la récompense de la transition.</li>
<li>Propriété de Markov : la suite ne dépend que de l’état et de l’action présents.</li>
<li>Politique déterministe $\pi(s)$ ou stochastique $\pi(a\mid s)$ ; stationnaire si elle ne dépend pas de $t$.</li>
<li>Résoudre un MDP = trouver $\pi^*$ ; la voiture (Cool, Warm, Overheated ; Slow, Fast) sert d’exemple dans tout le chapitre.</li></ul></div>`,
      },
      {
        id: 'rl-return', title: 'Retour actualisé, valeurs et q-valeurs', slides: 'RL1 34-43',
        summary: 'Gt = Σ γ^i R_{t+i+1}, borné par Rmax/(1−γ). vπ(s) = Eπ[Gt | s], qπ(s,a) = Eπ[Gt | s, a]. Évaluer une politique vs l’optimiser.',
        fiche: R`
<p><b>L’idée</b> : pour comparer des politiques, il faut résumer une trajectoire par un seul nombre. On additionne les récompenses futures en donnant moins de poids aux plus lointaines : c’est le <b>retour actualisé</b>. La <b>valeur</b> d’un état est le retour moyen qu’on peut en attendre en suivant une politique.</p>
<h4>1. L’hypothèse de la récompense</h4>
<p>Tout objectif peut s’écrire comme l’espérance de la somme cumulée d’un signal scalaire (le retour) que l’agent cherche à maximiser. Depuis $S_t=s$ :</p>
<ul><li>horizon fini de $N$ pas : $\mathbb E[R_{t+1}+R_{t+2}+\dots+R_{t+N}\mid S_t=s]$ ;</li>
<li>horizon infini : $\mathbb E\big[\sum_{i\ge0}R_{t+i+1}\mid S_t=s\big]$, qui peut diverger (une récompense +1 à chaque pas donne $+\infty$ pour toutes les bonnes politiques, qu’on ne peut plus comparer). Il faut une autre définition.</li></ul>
<h4>2. Le retour actualisé</h4>
<div class="def"><b>Retour</b> : $$G_t=\sum_{i\ge0}\gamma^iR_{t+i+1}=R_{t+1}+\gamma R_{t+2}+\gamma^2R_{t+3}+\dots$$
<ul><li>$R_{t+i+1}$ : la récompense reçue $i$ pas après la première ;</li>
<li>$\gamma\in[0,1[$ (gamma) : le <b>facteur d’actualisation</b>, qui pondère une récompense lointaine par $\gamma^i$.</li></ul>
Si toute récompense vaut au plus $R_{\max}$ (la plus grande récompense sur tous les états et instants), la série géométrique donne $\mathbb E[G_t]\le R_{\max}(1+\gamma+\gamma^2+\dots)=\dfrac{R_{\max}}{1-\gamma}$ : $\gamma$ est l’astuce qui fait converger la somme.<br>
$\gamma\to0$ : seule la récompense immédiate compte (agent <b>myope</b>). $\gamma\to1$ : toutes comptent autant (agent <b>prévoyant</b>).</div>
<p><b>Récurrence</b> (elle donnera Bellman) : $G_t=R_{t+1}+\gamma G_{t+1}$, le retour d’aujourd’hui est la récompense immédiate plus le retour de demain actualisé.</p>
<h4>3. Savoir-faire : calculer un retour</h4>
<p>Prenons $\gamma=0{,}9$ et les récompenses $R_{t+1},\dots,R_{t+4}=(1;\ 0;\ 0;\ 10)$, puis 0.</p>
<ul><li>Directement : $G_t=1+0{,}9\times0+0{,}81\times0+0{,}729\times10=8{,}29$.</li>
<li>Par la récurrence, en partant de la fin : $G_{t+3}=10$ ; $G_{t+2}=0+0{,}9\times10=9$ ; $G_{t+1}=0+0{,}9\times9=8{,}1$ ; $G_t=1+0{,}9\times8{,}1=8{,}29$.</li>
<li>Avec $\gamma=0{,}5$ : $G_t=1+0{,}125\times10=2{,}25$. Le +10 lointain pèse beaucoup moins pour un agent plus myope.</li>
<li>Borne : avec $R_{\max}=10$ et $\gamma=0{,}9$, aucun retour espéré ne dépasse $10/0{,}1=100$.</li></ul>
<h4>4. L’exemple du cart-pole</h4>
<p>But : garder un bâton en équilibre le plus longtemps possible. Deux façons de définir la récompense :</p>
<ul><li><b>épisodique</b> : $R_t=1$ tant que le bâton tient, 0 quand il tombe. La somme croît avec la durée : elle récompense les bonnes politiques.</li>
<li><b>continue</b> : $R_t=-1$ quand il tombe, 0 sinon. Sans actualisation, la somme vaut $-1$ pour toute politique : elle ne distingue rien.</li></ul>
<p>Avec $\gamma<1$, les deux formulations marchent. Prenons la version continue, $\gamma=0{,}9$, chute au pas $T$ : $G_0=-\gamma^{T-1}$. Chute au pas 10 : $-0{,}9^9\approx-0{,}387$ ; au pas 100 : $-0{,}9^{99}\approx-0{,}00003$. Tomber plus tard coûte moins.</p>
<h4>5. Valeur et q-valeur</h4>
<div class="def"><b>Valeur</b> d’un état sous $\pi$ : $v_\pi(s)=\mathbb E_\pi[G_t\mid S_t=s]=\mathbb E_\pi\big[\sum_{i\ge0}\gamma^iR_{t+i+1}\mid S_t=s\big]$. L’espérance porte sur les trajectoires aléatoires engendrées par la politique $\pi$ et par les transitions $T$.<br>
<b>q-valeur</b> : $q_\pi(s,a)=\mathbb E_\pi[G_t\mid S_t=s,A_t=a]$, le retour moyen si l’on commence par l’action $a$ puis suit $\pi$. Le couple $(s,a)$ est un <b>q-état</b> : l’action est choisie mais pas encore exécutée.</div>
<p><b>Évaluer</b> une politique : calculer $v_\pi(s)$ pour tout $s$. <b>Optimiser</b> : trouver la meilleure politique, via $q^*(s,a)$.</p>
<p>Les espérances se calculent avec la <b>formule des probabilités totales</b> : si $\{B_1,B_2,\dots\}$ partitionne l’espace, $\mathbb P(E)=\sum_i\mathbb P(E\cap B_i)=\sum_i\mathbb P(E\mid B_i)\mathbb P(B_i)$. En partitionnant selon l’action jouée : $v_\pi(s)=\sum_a\pi(a\mid s)\,q_\pi(s,a)$. Prenons $\pi(a_1\mid s)=0{,}7$, $q_\pi(s,a_1)=4$, $\pi(a_2\mid s)=0{,}3$, $q_\pi(s,a_2)=1$ : $v_\pi(s)=2{,}8+0{,}3=3{,}1$.</p>
<h4>Pièges</h4>
<ul><li>$G_t$ est aléatoire (il dépend de la trajectoire) ; $v_\pi(s)$ est un nombre, son espérance.</li>
<li>La première récompense de $G_t$ est $R_{t+1}$, avec le poids $\gamma^0=1$.</li>
<li>$\gamma=1$ reste permis dans une tâche épisodique (le cours le fait en RL2) : la somme est finie parce que l’épisode s’arrête.</li>
<li>$v_\pi$ dépend de $\pi$ : la même case vaut beaucoup sous une bonne politique et peu sous une mauvaise.</li></ul>
<h4>Lien finance</h4>
<p>$G_t$ a la forme d’une valeur actualisée : chaque flux futur est pondéré par $\gamma^i$, comme un flux financier par $1/(1+r)^i$. Avec un taux de 5 %, $\gamma=1/1{,}05\approx0{,}952$. En RL, $\gamma$ est souvent un choix de modélisation (il fixe jusqu’où l’agent regarde) plutôt qu’un taux de marché.</p>
<div class="def"><b>À retenir</b><ul>
<li>$G_t=\sum_i\gamma^iR_{t+i+1}=R_{t+1}+\gamma G_{t+1}$, borné par $R_{\max}/(1-\gamma)$.</li>
<li>$\gamma$ petit : myope ; $\gamma$ proche de 1 : prévoyant.</li>
<li>$v_\pi(s)=\mathbb E_\pi[G_t\mid S_t=s]$, $q_\pi(s,a)=\mathbb E_\pi[G_t\mid S_t=s,A_t=a]$, et $v_\pi(s)=\sum_a\pi(a\mid s)q_\pi(s,a)$.</li>
<li>Évaluer = calculer $v_\pi$ ; optimiser = trouver $\pi^*$.</li></ul></div>`,
      },
      {
        id: 'rl-bellman', title: 'Équations de Bellman', slides: 'RL1 45-59',
        summary: 'vπ(s) = Σa π(a,s) Σs′ T [R + γ vπ(s′)] ; v*(s) = maxa Σs′ T [R + γ v*(s′)] ; q*(s,a) = Σs′ T [R + γ maxa′ q*(s′,a′)]. Point fixe d’un opérateur contractant.',
        fiche: R`
<p><b>L’idée</b> : la valeur d’un état est la récompense immédiate plus la valeur actualisée de l’état où l’on arrive, le tout moyenné sur les actions et les arrivées. On obtient une équation par état, donc un système d’équations.</p>
<h4>1. Dérivation (slides 45 à 49)</h4>
<p>De $G_t=R_{t+1}+\gamma G_{t+1}$ on tire $v_\pi(s)=\mathbb E_\pi[R_{t+1}\mid S_t=s]+\gamma\,\mathbb E_\pi[G_{t+1}\mid S_t=s]$.</p>
<ol><li>Premier terme, par les probabilités totales sur l’action puis sur l’arrivée : $\mathbb E_\pi[R_{t+1}\mid S_t=s]=\sum_a\pi(a,s)\sum_{s'}T(s,a,s')R(s,a,s')$.</li>
<li>Second terme : on décompose selon la première transition $(s,a,s')$ ; une fois en $s'$, le retour qui suit a pour espérance $v_\pi(s')$ (par définition, et par la propriété de Markov). D’où $\sum_a\pi(a,s)\sum_{s'}T(s,a,s')\,v_\pi(s')$.</li></ol>
<div class="thm"><b>Équation de Bellman pour évaluer $\pi$</b> (1957)
$$v_\pi(s)=\sum_a\pi(a,s)\sum_{s'}T(s,a,s')\big[R(s,a,s')+\gamma v_\pi(s')\big]\qquad\forall s\in S.$$
Entre crochets : la récompense immédiate de la transition et la valeur actualisée du successeur. La valeur des successeurs $s'$ est « rétropropagée » vers $s$.</div>
<h4>2. Savoir-faire : évaluer une politique sur la voiture ($\gamma=0{,}5$)</h4>
<p><b>Politique « toujours Slow »</b> : $v(c)=1+0{,}5\,v(c)$ donne $v(c)=2$ ; $v(w)=0{,}5(1+0{,}5\times2)+0{,}5(1+0{,}5\,v(w))=1{,}5+0{,}25\,v(w)$ donne $v(w)=2$.</p>
<p><b>Politique stochastique</b> : en Cool, Slow ou Fast avec probabilité 1/2 ; en Warm, Slow. Écrivons-la sous forme matricielle $V^\pi=R^\pi+\gamma T^\pi V^\pi$, où $R^\pi(s)$ est la récompense immédiate moyenne et $T^\pi(s,s')$ la probabilité de passer de $s$ à $s'$ sous $\pi$ :</p>
<ul><li>$R^\pi(c)=0{,}5\times1+0{,}5\times2=1{,}5$ ; $R^\pi(w)=1$ ;</li>
<li>$T^\pi(c,c)=0{,}5\times1+0{,}5\times0{,}5=0{,}75$, $T^\pi(c,w)=0{,}25$ ; $T^\pi(w,c)=T^\pi(w,w)=0{,}5$ (Overheated n’est jamais atteint).</li></ul>
<p>Système : $v(c)=1{,}5+0{,}5(0{,}75\,v(c)+0{,}25\,v(w))$ et $v(w)=1+0{,}5(0{,}5\,v(c)+0{,}5\,v(w))$. Solution : $v(c)=20/7\approx2{,}857$, $v(w)=16/7\approx2{,}286$. Vérification : $1+0{,}25\times\frac{20}7+0{,}25\times\frac{16}7=1+\frac57+\frac47=\frac{16}7$. Cette politique fait mieux que « toujours Slow » (2 ; 2).</p>
<h4>3. Politiques et valeurs optimales</h4>
<div class="def"><b>Ordre partiel</b> : $\pi$ domine $\pi'$ si $v_\pi(s)\ge v_{\pi'}(s)$ pour tout $s$ et $v_\pi(s)>v_{\pi'}(s)$ pour au moins un $s$. Deux politiques peuvent être incomparables (chacune meilleure ailleurs).<br>
<b>Politique optimale</b> $\pi^*$ : aucune autre ne la domine. Il peut y en avoir plusieurs, mais elles ont toutes la même <b>valeur optimale</b> $v^*(s)=\max_\pi v_\pi(s)$. De même $q^*(s,a)=\max_\pi q_\pi(s,a)$, et $v^*(s)=\max_aq^*(s,a)$.</div>
<div class="thm"><b>Équations d’optimalité de Bellman</b>
$$v^*(s)=\max_a\sum_{s'}T(s,a,s')\big[R(s,a,s')+\gamma v^*(s')\big]$$
$$q^*(s,a)=\sum_{s'}T(s,a,s')\big[R(s,a,s')+\gamma\max_{a'}q^*(s',a')\big]$$
<b>Esquisse de preuve</b> (slide 54) : $q^*(s,a)=\mathbb E[R_{t+1}+\gamma G_{t+1}\mid s,a]$, et le même raisonnement qu’au §1 donne $q^*(s,a)=\sum_{s'}T(s,a,s')[R(s,a,s')+\gamma v^*(s')]$ ; on conclut avec $v^*(s)=\max_aq^*(s,a)$. La seconde équation est une somme de valeurs pondérées par leur probabilité $T$ : l’espérance du gain si l’on agit optimalement à partir du q-état $(s,a)$.</div>
<p><b>Savoir-faire : vérifier une équation d’optimalité.</b> Pour la voiture avec $\gamma=0{,}5$, value iteration (notion suivante) donne $v^*=(3{,}5;\ 2{,}5;\ 0)$. En Cool : Slow vaut $1+0{,}5\times3{,}5=2{,}75$, Fast vaut $0{,}5(2+0{,}5\times3{,}5)+0{,}5(2+0{,}5\times2{,}5)=1{,}875+1{,}625=3{,}5$ ; le max est 3,5 = $v^*(c)$. En Warm : Slow vaut $0{,}5(1+1{,}75)+0{,}5(1+1{,}25)=2{,}5$, Fast vaut $-10$ ; le max est 2,5 = $v^*(w)$. Les q-valeurs optimales sont donc $q^*(c,\text{Slow})=2{,}75$, $q^*(c,\text{Fast})=3{,}5$, $q^*(w,\text{Slow})=2{,}5$, $q^*(w,\text{Fast})=-10$, et $\pi^*$ = (Fast en Cool, Slow en Warm).</p>
<h4>4. Opérateur et méthodes de calcul</h4>
<p>Avec l’opérateur de programmation dynamique $\mathcal Lv(s)=\max_a\sum_{s'}T(s,a,s')[R(s,a,s')+\gamma v(s')]$, $v^*$ est solution de $v^*=\mathcal Lv^*$ : un <b>point fixe</b>. $\mathcal L$ est contractant, ce qui permet d’utiliser les théorèmes de point fixe (fiche value iteration).</p>
<ul><li><b>Résolution explicite</b> (MDP fini à $n$ états, pour $v_\pi$) : $V^\pi=R^\pi+\gamma T^\pi V^\pi$, donc $V^\pi=(I-\gamma T^\pi)^{-1}R^\pi$. Coût $O(n^3)$ : seulement pour de petits MDP, sinon méthodes approchées.</li>
<li><b>Programmation linéaire</b> : si $v$ minimise $\sum_{s\in S}v(s)$ sous les contraintes $v\ge\mathcal Lv$, alors $v=v^*$. N’importe quel solveur convient, mais c’est lent en pratique.</li>
<li><b>Programmation dynamique</b> : méthodes itératives qui organisent la recherche de bonnes politiques à l’aide des fonctions de valeur : <b>value iteration</b> et <b>policy iteration</b>.</li></ul>
<h4>Pièges</h4>
<ul><li>L’équation d’évaluation est <b>linéaire</b> (pas de max) : un système. L’équation d’optimalité contient un max : on ne la résout pas par une seule inversion de matrice.</li>
<li>La somme sur $s'$ est une <b>moyenne</b> pondérée par $T$, pas le meilleur successeur.</li>
<li>Tirer $\pi^*$ de $v^*$ demande $T$ et $R$ (un pas d’anticipation) ; tirer $\pi^*$ de $q^*$ demande seulement un argmax. C’est pourquoi le RL sans modèle apprend $q$.</li>
<li>$v^*$ est unique, $\pi^*$ ne l’est pas forcément (deux actions de même q-valeur).</li></ul>
<div class="def"><b>À retenir</b><ul>
<li>Évaluation : $v_\pi(s)=\sum_a\pi(a,s)\sum_{s'}T[R+\gamma v_\pi(s')]$, linéaire, $V^\pi=(I-\gamma T^\pi)^{-1}R^\pi$ en $O(n^3)$.</li>
<li>Optimalité : $v^*(s)=\max_a\sum_{s'}T[R+\gamma v^*(s')]$ et $q^*(s,a)=\sum_{s'}T[R+\gamma\max_{a'}q^*(s',a')]$.</li>
<li>$v^*=\max_aq^*$ et $\pi^*(s)=\arg\max_aq^*(s,a)$.</li>
<li>Voiture, $\gamma=0{,}5$ : $v^*=(3{,}5;\ 2{,}5;\ 0)$, $\pi^*$ = (Fast, Slow).</li></ul></div>`,
      },
      {
        id: 'rl-vi', title: 'Value iteration', slides: 'RL1 61-76, RL2 3-5',
        summary: 'v_{k+1} = L v_k converge vers v* (Banach, L est γ-contractant). Erreur ≤ γ^K 2Rmax/(1−γ). Coût O(S²A) par itération.',
        fiche: R`
<p><b>L’idée</b> : partir de valeurs quelconques et appliquer l’équation d’optimalité de Bellman comme une règle de mise à jour, encore et encore. Chaque passage rapproche les valeurs de $v^*$ d’un facteur au moins $\gamma$.</p>
<div class="thm"><b>Value iteration</b> : construire la suite $v_0,v_1,\dots$ avec $v_{k+1}=\mathcal Lv_k$, c’est-à-dire
$$v_{k+1}(s)\leftarrow\max_a\sum_{s'}T(s,a,s')\big[R(s,a,s')+\gamma v_k(s')\big]\quad\forall s,$$
jusqu’à $\|v_{k+1}-v_k\|_\infty<\epsilon$. $v_k$ : l’estimation après $k$ itérations ; $\epsilon$ : la tolérance. Chaque itération essaie toutes les actions $a$ de tous les états $s$ vers tous les états $s'$ : $O(S^2A)$.</div>
<p>Intuition : en partant de $v_0=0$, $v_k(s)$ est le meilleur gain espéré quand il reste $k$ pas à jouer. Par exemple $v_1(c)=2$ : avec un seul pas, Fast rapporte +2.</p>
<h4>1. Savoir-faire : l’exemple du cours (voiture, $\gamma=0{,}5$, $v_0=0$)</h4>
<ul><li>$v_1(c)=\max\{1(1+0{,}5\times0),\ 0{,}5(2+0)+0{,}5(2+0)\}=\max\{1,2\}=2$ ; $v_1(w)=\max\{0{,}5(1+0)+0{,}5(1+0),\ 1(-10+0)\}=\max\{1,-10\}=1$ ; $v_1(o)=0$.</li>
<li>$v_2(c)=\max\{1+0{,}5\times2,\ 0{,}5(2+0{,}5\times2)+0{,}5(2+0{,}5\times1)\}=\max\{2,\ 2{,}75\}=2{,}75$ ; $v_2(w)=\max\{0{,}5(1+1)+0{,}5(1+0{,}5),\ -10\}=1{,}75$.</li></ul>
<table><tr><th>$k$</th><th>$v_k(c)$</th><th>$v_k(w)$</th><th>$v^*(c)-v_k(c)$</th></tr>
<tr><td>0</td><td>0</td><td>0</td><td>3,5</td></tr>
<tr><td>1</td><td>2</td><td>1</td><td>1,5</td></tr>
<tr><td>2</td><td>2,75</td><td>1,75</td><td>0,75</td></tr>
<tr><td>3</td><td>3,125</td><td>2,125</td><td>0,375</td></tr>
<tr><td>4</td><td>3,3125</td><td>2,3125</td><td>0,1875</td></tr>
<tr><td>$\infty$</td><td>3,5</td><td>2,5</td><td>0</td></tr></table>
<p>Les lignes 0 à 2 sont celles du cours ; la suite est calculée avec la même règle. À partir de $k=1$, l’erreur est divisée par 2 à chaque itération, exactement le facteur $\gamma=0{,}5$ (avec $\gamma=0{,}8$, le même calcul donne un facteur 0,8 et $v^*=(8;\ 7)$).</p>
<h4>2. Pourquoi ça converge : contraction et point fixe</h4>
<div class="def"><b>Contraction</b> : sur un espace métrique $(X,d)$, $T:X\to X$ est contractante s’il existe $\alpha\in[0,1[$ tel que $d(T(x),T(y))\le\alpha\,d(x,y)$ pour tous $x,y$ : l’application rapproche deux points d’au moins un facteur $\alpha$.<br>
<b>Théorème du point fixe de Banach</b> : si $X$ est un espace de Banach (métrique complet) et $T$ une contraction, $T$ a un <b>unique</b> point fixe $x^*=T(x^*)$, et la suite $x_{k+1}=T(x_k)$ y converge depuis n’importe quel $x_0$. Appliqué ici : $v^*(s)=\lim_{k\to\infty}v_k(s)$ pour tout $s$, et à convergence $v_k=v_{k+1}=v^*$ vérifie Bellman.</div>
<div class="thm"><b>$\mathcal L$ est $\gamma$-contractant pour la norme sup</b> $\|u\|_\infty=\max_s|u(s)|$ (à savoir refaire, slides 64 à 66). Pour deux fonctions $u,v$ et un état $s$ :
<ol><li>avec $|\max_xf(x)-\max_xg(x)|\le\max_x|f(x)-g(x)|$ : $|\mathcal Lu(s)-\mathcal Lv(s)|\le\max_a\big|\sum_{s'}T(s,a,s')[R+\gamma u(s')]-\sum_{s'}T(s,a,s')[R+\gamma v(s')]\big|$ ;</li>
<li>les récompenses s’annulent : $=\gamma\max_a\big|\sum_{s'}T(s,a,s')(u(s')-v(s'))\big|$ ;</li>
<li>on majore chaque écart par le plus grand : $\le\gamma\max_{s'}|u(s')-v(s')|\cdot\max_a\sum_{s'}T(s,a,s')$ ;</li>
<li>et $\sum_{s'}T(s,a,s')=1$ : $\le\gamma\|u-v\|_\infty$.</li></ol></div>
<h4>3. Vitesse et critère d’arrêt</h4>
<p>Comme $|v^*(s)|\le\frac{R_{\max}}{1-\gamma}$ (et de même pour un $v_0$ raisonnable), $\|v_0-v^*\|_\infty\le\frac{2R_{\max}}{1-\gamma}$. Chaque itération multiplie l’erreur par au plus $\gamma$ :
$$\|v_K-v^*\|_\infty\le\gamma^K\frac{2R_{\max}}{1-\gamma}.$$
Pour garantir une erreur $\epsilon$, il faut $K=\Big\lceil\dfrac{\log\frac{2R_{\max}}{\epsilon(1-\gamma)}}{\log\frac1\gamma}\Big\rceil$. Avec $R_{\max}=1$ et $\epsilon=0{,}01$ : $\gamma=0{,}9$ donne $\lceil7{,}601/0{,}1054\rceil=\lceil72{,}14\rceil=73$ itérations, $\gamma=0{,}99$ en donne 986. <b>Faiblesse</b> : $K$ explose quand $\gamma\to1$.</p>
<div class="thm"><b>Critère d’arrêt</b> : si $\|v_{k+1}-v_k\|_\infty<\epsilon\frac{1-\gamma}\gamma$, alors $\|v_{k+1}-v^*\|_\infty<\epsilon$. Avec $\gamma=0{,}9$ et $\epsilon=0{,}01$, on s’arrête quand deux itérations diffèrent de moins de $0{,}01\times0{,}1/0{,}9\approx0{,}0011$.<br>
<b>Ce qui compte, c’est la politique</b> : si $\|v_k-v^*\|<\epsilon$, la politique gloutonne $\pi_k$ tirée de $v_k$ vérifie $\|v_{\pi_k}-v^*\|<\frac{2\gamma\epsilon}{1-\gamma}$ (preuve par l’inégalité triangulaire, laissée en exercice dans le cours). Avec $\gamma=0{,}9$, $\epsilon=0{,}01$ : perte au plus 0,18. Même faiblesse quand $\gamma\to1$.</div>
<h4>4. Algorithme et implémentation (RL2, slides 3 à 5)</h4>
<p>Initialiser $v_0(s)$ ; $T$ et $R$ sont connus. Répéter : pour chaque $s$, $v_{k+1}(s)=\max_a\sum_{s'}T(s,a,s')[R(s,a,s')+\gamma v_k(s')]$ ; jusqu’à $\|v_{k+1}-v_k\|<\epsilon$ ; renvoyer $v_k$. L’implémentation du cours garde <b>deux tables</b> ($v_k$ et $v_{k+1}$, via <code>nextvalues = self.values.copy()</code>), calcule chaque q-valeur par <code>getQValue</code> ($\sum_{s'}T\,[R+\gamma v(s')]$ sur les paires renvoyées par <code>getTransitionStatesAndProbs</code>) et mémorise la meilleure action de chaque état. Un état sans action légale (terminal) garde sa valeur. Le code complet se fait au <a class="link" href="#course/tp4-vi">TP4</a>.</p>
<h4>Pièges</h4>
<ul><li>Mettre à jour $v_{k+1}$ en lisant des valeurs déjà modifiées pendant la même itération donne une autre méthode (programmation dynamique asynchrone, en place). La version du cours lit uniquement $v_k$.</li>
<li>La borne $\gamma^K\frac{2R_{\max}}{1-\gamma}$ est très pessimiste : pour la voiture ($R_{\max}=10$ en valeur absolue), elle vaut $40\times0{,}5^K$ alors que l’erreur réelle vaut $3\times0{,}5^K$.</li>
<li>Le critère d’arrêt compare deux itérations successives, pas $v_k$ à $v^*$ (inconnu) : d’où le facteur $\frac{1-\gamma}\gamma$.</li>
<li>Les valeurs peuvent continuer à bouger alors que la politique gloutonne ne change plus.</li></ul>
<div class="def"><b>À retenir</b><ul>
<li>$v_{k+1}=\mathcal Lv_k$, coût $O(S^2A)$ par itération.</li>
<li>$\mathcal L$ est $\gamma$-contractant pour $\|\cdot\|_\infty$ : convergence vers l’unique point fixe $v^*$ depuis tout $v_0$ (Banach).</li>
<li>$\|v_K-v^*\|_\infty\le\gamma^K\frac{2R_{\max}}{1-\gamma}$ : lent quand $\gamma\to1$.</li>
<li>Arrêt : $\|v_{k+1}-v_k\|<\epsilon\frac{1-\gamma}\gamma$ garantit $\|v_{k+1}-v^*\|<\epsilon$.</li></ul></div>`,
      },
      {
        id: 'rl-pi', title: 'Policy iteration', slides: 'RL1 78-90',
        summary: 'Alterner évaluation (résoudre vπk, sans max) et amélioration gloutonne. Théorème d’amélioration : suite monotone, convergence souvent en très peu d’itérations.',
        fiche: R`
<p><b>L’idée</b> : au lieu d’itérer sur les valeurs, on itère sur les <b>politiques</b>. On calcule exactement ce que vaut la politique actuelle, puis on la remplace par celle qui choisit partout la meilleure action selon ces valeurs. On recommence jusqu’à ce que plus rien ne change.</p>
<p>L’équation d’optimalité définit aussi la politique optimale : $\pi^*(s)=\arg\max_a\sum_{s'}T(s,a,s')[R(s,a,s')+\gamma v^*(s')]$, une équation de point fixe sur l’espace des politiques stationnaires. Pour itérer $\pi_0\to\pi_1\to\dots\to\pi_k$, il faut la valeur $v^{\pi_k}$ de chaque politique : d’où deux étapes.</p>
<div class="thm"><b>Policy iteration</b> (ou <i>strategy iteration</i>)
<ol><li><b>Évaluation</b> : résoudre (sans max) $v^{\pi_k}=\mathcal L_{\pi_k}v^{\pi_k}$, c’est-à-dire $v^{\pi_k}(s)=\sum_{s'}T(s,\pi_k(s),s')[R(s,\pi_k(s),s')+\gamma v^{\pi_k}(s')]$ pour tout $s$ : un système linéaire, ou l’itération de cette équation jusqu’à convergence.</li>
<li><b>Amélioration</b> (gloutonne) : $\pi_{k+1}(s)=\arg\max_a\sum_{s'}T(s,a,s')[R(s,a,s')+\gamma v^{\pi_k}(s')]$ pour tout $s$.</li></ol>
Arrêt quand $\pi_{k+1}=\pi_k$ ; on renvoie $v^{\pi_k}$ et $\pi_k$.</div>
<div class="thm"><b>Théorème d’amélioration de politique</b> : soient $\pi$ et $\pi'$ deux politiques déterministes telles que $q_\pi(s,\pi'(s))\ge v_\pi(s)$ pour tout $s$. Alors $\pi'$ domine $\pi$ : $v_{\pi'}(s)\ge v_\pi(s)$ pour tout $s$.<br>
La politique gloutonne vérifie l’hypothèse par construction ($q_\pi(s,\pi'(s))=\max_aq_\pi(s,a)\ge q_\pi(s,\pi(s))=v_\pi(s)$). La suite $v^{\pi_k}$ est donc <b>monotone</b> et bornée par $v^*$ : elle converge.<br>
<span class="muted">Esquisse (Sutton et Barto, non détaillée dans le slide) : $v_\pi(s)\le q_\pi(s,\pi'(s))=\mathbb E[R_{t+1}+\gamma v_\pi(S_{t+1})]$ en jouant $\pi'$ au premier pas ; on réapplique l’hypothèse en $S_{t+1}$, puis aux pas suivants, et la limite est $v_{\pi'}(s)$.</span></div>
<h4>Savoir-faire : l’exemple du cours (voiture, $\gamma=0{,}5$, $\pi_0$ = toujours Slow)</h4>
<ol><li><b>Évaluation de $\pi_0$</b> : $v(c)=1(1+0{,}5\,v(c))$ et $v(w)=0{,}5(1+0{,}5\,v(c))+0{,}5(1+0{,}5\,v(w))$, d’où $v^{\pi_0}=(2;\ 2)$.</li>
<li><b>Amélioration</b> : en Cool, Slow vaut $1+0{,}5\times2=2$ et Fast $0{,}5(2+0{,}5\times2)+0{,}5(2+0{,}5\times2)=3$ : Fast. En Warm, Slow vaut $0{,}5(1+0{,}5\times2)+0{,}5(1+0{,}5\times2)=2$ et Fast $1\times(-10+0{,}5\times0)=-10$ : Slow. Donc $\pi_1$ = (Fast, Slow).</li>
<li><b>Évaluation de $\pi_1$</b> : $v(c)=0{,}5(2+0{,}5\,v(c))+0{,}5(2+0{,}5\,v(w))$, $v(w)=0{,}5(1+0{,}5\,v(c))+0{,}5(1+0{,}5\,v(w))$, d’où $v^{\pi_1}=(3{,}5;\ 2{,}5)$.</li>
<li><b>Amélioration</b> : en Cool, Slow $1+1{,}75=2{,}75$ contre Fast $3{,}5$ ; en Warm, Slow $2{,}5$ contre Fast $-10$. $\pi_2=\pi_1$ : convergé en deux tours, avec $v^{\pi_1}=v^*$, la limite que value iteration n’atteint qu’asymptotiquement.</li></ol>
<p class="muted">Le slide 85 écrit « slow : 0.5(1 + 0.5·2) + 0.5(1 + 0.5·2) = 3 » pour Warm : le calcul donne 2, qui est d’ailleurs $v^{\pi_0}(w)$. Il écrit aussi « fast : 0.5(−10 + 0.5·0) » puis −10 : avec $T(w,\text{Fast},o)=1$, le coefficient est 1. La décision (Slow) n’en est pas changée. À confirmer avec le Prof. Siebert (RL1 slide 85).</p>
<h4>Propriétés et variantes</h4>
<ul><li>La politique compte souvent plus que la valeur exacte ; policy iteration peut converger alors que les valeurs ne l’ont pas fait.</li>
<li>Mais chaque tour demande une évaluation complète, parfois longue.</li>
<li>Sur un MDP fini, il y a un nombre fini de politiques déterministes et chaque tour améliore strictement tant que la politique change : l’algorithme s’arrête en un nombre fini de tours.</li>
<li><b>Programmation dynamique asynchrone</b> : value et policy iteration balaient tout l’ensemble des états. Les méthodes asynchrones mettent à jour en place, sans balayage systématique, en ordonnant les mises à jour pour propager l’information efficacement et en se concentrant sur les états utiles à l’agent.</li>
<li><b>Living reward</b> (TP GridWorld) : si l’agent met trop de temps à sortir, on ajoute à chaque transition sans récompense une petite récompense négative : −0,01 (il a tout son temps) ou −2 (« dépêche-toi »). Le <a class="link" href="#course/tp4-analyse">TP4</a> étudie l’effet de ces paramètres.</li></ul>
<h4>Pièges</h4>
<ul><li>L’évaluation n’a <b>pas de max</b> : on suit l’action imposée par $\pi_k$.</li>
<li>En cas d’égalité dans l’argmax, garder l’action actuelle, sinon la politique peut osciller entre deux actions équivalentes et l’arrêt $\pi_{k+1}=\pi_k$ n’arrive jamais.</li>
<li>Peu de tours ne veut pas dire peu de calcul : un tour coûte une résolution de système ($O(n^3)$) ou une évaluation itérative.</li></ul>
<div class="def"><b>À retenir</b><ul>
<li>Évaluation (Bellman sans max) puis amélioration gloutonne, jusqu’à $\pi_{k+1}=\pi_k$.</li>
<li>Théorème d’amélioration : si $q_\pi(s,\pi'(s))\ge v_\pi(s)$ partout, alors $v_{\pi'}\ge v_\pi$ partout.</li>
<li>Peu de tours, chacun coûteux ; value iteration : beaucoup de tours bon marché.</li>
<li>Voiture : (Slow, Slow) puis (Fast, Slow), optimale dès le premier tour.</li></ul></div>`,
      },
      {
        id: 'rl-model', title: 'Du MDP au RL : model-based', slides: 'RL2 7-18',
        summary: 'En RL, T et R sont inconnus. Model-based : estimer T̂ et R̂ à partir d’épisodes puis résoudre le MDP. Model-free : apprendre v ou q directement.',
        fiche: R`
<p><b>L’idée</b> : en apprentissage par renforcement, on ne connaît plus les règles du jeu. Soit on les estime en observant (on compte les transitions) puis on planifie comme dans un MDP : c’est le RL <b>model-based</b>. Soit on apprend directement les valeurs sans modèle : c’est le RL <b>model-free</b>, objet des notions suivantes.</p>
<p><b>RL ≠ MDP</b> : la dynamique est inconnue, $T(s,a,s')=?$ et $R(s,a,s')=?$. On ne peut pas appliquer tel quel $v^*(s)=\max_a\sum_{s'}T[R+\gamma v^*(s')]$.</p>
<table><tr><th>Model-based (« indirect », « offline »)</th><th>Model-free (« direct », « online »)</th></tr>
<tr><td>construire $\hat T(s,a,s')$ et $\hat R(s,a,s')$ à partir de l’expérience passée (le chapeau marque une estimation), puis « résoudre le MDP » par value ou policy iteration : c’est la planification</td><td>aucun modèle de $T$ ni de $R$ ; apprendre progressivement $v$ ou $q$ depuis l’expérience</td></tr></table>
<h4>1. L’analogie de l’âge moyen</h4>
<p>On veut l’âge moyen $\mathbb E[A]=\sum_aP(a)\,a$ des personnes d’une salle, avec $P$ inconnue. On interroge $N$ personnes.</p>
<ul><li>Model-based : estimer la loi, $\hat P(a)=n(a)/N$ ($n(a)$ : le nombre de personnes d’âge $a$), puis $\mathbb E[A]\approx\sum_a\hat P(a)\,a$.</li>
<li>Model-free : $\mathbb E[A]\approx\frac1N\sum_ia_i$ directement ; les âges fréquents apparaissent naturellement plus souvent.</li></ul>
<p>Prenons les âges (20, 20, 22, 25) : $\hat P(20)=0{,}5$, $\hat P(22)=\hat P(25)=0{,}25$, et les deux méthodes donnent 21,75. Pour une simple moyenne elles coïncident ; en RL elles diffèrent parce que le modèle sert ensuite à <b>planifier</b> des situations jamais vécues telles quelles.</p>
<h4>2. Savoir-faire : construire un modèle (exemple du cours)</h4>
<p>Grille à cinq cases : A en haut, B, C, D au milieu, E en bas. D (+10) et A (−10) sont terminales (action <i>exit</i>, vers un état final noté x). Politique d’entrée $\pi$ : depuis B et C, aller à l’est ; depuis E, aller au nord. $\gamma=1$. Quatre épisodes observés (état, action, arrivée, récompense) :</p>
<table><tr><th>Épisode 1</th><th>Épisode 2</th><th>Épisode 3</th><th>Épisode 4</th></tr>
<tr><td>B, east, C, −1</td><td>B, east, C, −1</td><td>E, north, C, −1</td><td>E, north, C, −1</td></tr>
<tr><td>C, east, D, −1</td><td>C, east, D, −1</td><td>C, east, D, −1</td><td>C, east, A, −1</td></tr>
<tr><td>D, exit, x, +10</td><td>D, exit, x, +10</td><td>D, exit, x, +10</td><td>A, exit, x, −10</td></tr></table>
<p><b>Compter</b> : (C, east) apparaît 4 fois, dont 3 vers D et 1 vers A, d’où $\hat T(C,\text{east},D)=3/4=0{,}75$ et $\hat T(C,\text{east},A)=0{,}25$ ; (B, east) mène toujours en C, $\hat T(B,\text{east},C)=1$. <b>Moyenner les récompenses</b> : $\hat R(B,\text{east},C)=-1$, $\hat R(C,\text{east},D)=-1$, $\hat R(D,\text{exit},x)=+10$.</p>
<p><b>Planifier</b> sur ce modèle (évaluation de $\pi$, $\gamma=1$) : $v(D)=10$, $v(A)=-10$, $v(C)=0{,}75(-1+10)+0{,}25(-1-10)=6{,}75-2{,}75=4$, puis $v(B)=-1+4=3$ et $v(E)=-1+4=3$.</p>
<div class="thm"><b>Model-based avec value iteration</b> : (1) supposer $S$ et $A$ connus ; (2) construire $\hat T$ et $\hat R$ ; (3) itérer $v_{k+1}(s)\leftarrow\max_a\sum_{s'}\hat T(s,a,s')[\hat R(s,a,s')+\gamma v_k(s')]$ depuis par exemple $v_0=0$.<br>
<b>Avec policy iteration</b> : évaluation $v^{\pi_k}_{k+1}(s)\leftarrow\sum_{s'}\hat T(s,\pi_k(s),s')[\hat R(s,\pi_k(s),s')+\gamma v^{\pi_k}_k(s')]$, puis amélioration gloutonne avec le modèle estimé.</div>
<h4>3. Bilan</h4>
<ul><li><b>Avantages</b> : un modèle peut être une représentation plus compacte ou plus utile ; il s’apprend efficacement par apprentissage supervisé ; on peut raisonner sur son incertitude.</li>
<li><b>Inconvénients</b> : deux sources d’erreur d’approximation (apprendre le modèle, puis en tirer une valeur ou une politique) ; et quand juge-t-on le modèle assez bon ?</li>
<li>Certaines méthodes combinent les deux approches (par exemple Dyna).</li></ul>
<h4>Pièges</h4>
<ul><li>Le modèle n’existe que là où l’on a de l’expérience : avec la politique fixe ci-dessus, l’action north n’est jamais jouée en C, donc $\hat T(C,\text{north},\cdot)$ n’a aucune estimation. Planifier un max sur des actions jamais essayées n’a pas de sens.</li>
<li>Quatre épisodes donnent 0,75 ; la vraie probabilité peut être 0,8 ou 0,6. L’erreur du modèle se propage à la politique.</li>
<li>L’étiquette « offline » du slide signifie qu’on apprend le modèle puis qu’on planifie ; elle ne veut pas dire que les données ne viennent pas d’interactions.</li></ul>
<div class="def"><b>À retenir</b><ul>
<li>RL : $T$ et $R$ inconnus.</li>
<li>Model-based : $\hat T$ = fréquences observées, $\hat R$ = moyennes observées, puis value ou policy iteration.</li>
<li>Exemple du cours : $\hat T(C,\text{east},D)=0{,}75$, d’où $v(C)=4$ et $v(B)=v(E)=3$.</li>
<li>Deux sources d’erreur ; model-free = apprendre $v$ ou $q$ sans modèle.</li></ul></div>`,
      },
      {
        id: 'rl-mc', title: 'Model-free : Monte-Carlo', slides: 'RL2 20-28',
        summary: 'Estimer vπ(s) par la moyenne des retours observés à la fin des épisodes ; mise à jour incrémentale v ← v + α(G − v). First-visit sans biais.',
        fiche: R`
<p><b>L’idée</b> : pour savoir ce que vaut un état sous une politique, on joue des épisodes complets avec cette politique, on note le retour obtenu après chaque passage dans l’état, et on fait la moyenne. Aucun modèle n’est nécessaire.</p>
<h4>1. Pourquoi se passer du modèle</h4>
<ul><li>Ce qui intéresse l’agent est l’action, pas la valeur exacte $v(s)$ ; la politique peut converger avant $v^*$.</li>
<li>On ne cherche plus à modéliser $R$ et $T$, on calcule $v$ ou $q$ directement.</li>
<li>L’agent peut influencer la façon dont il collecte l’expérience, pour qu’elle soit la plus utile : c’est le dilemme exploration / exploitation.</li></ul>
<div class="def"><b>On-policy</b> (« apprendre sur le tas ») : apprendre la valeur de $\pi$ à partir d’expérience générée par $\pi$, en évaluant $\pi$ au fur et à mesure (Monte-Carlo, TD(0), SARSA).<br>
<b>Off-policy</b> (« regarder par-dessus l’épaule de quelqu’un ») : apprendre sur $\pi$ à partir d’expérience générée par une autre politique (q-learning).</div>
<h4>2. Le principe de Monte-Carlo</h4>
<p>Les méthodes de Monte-Carlo, nées dans les années 1940 à Los Alamos (jeux de hasard simulés pour étudier des phénomènes physiques liés à la bombe atomique, d’où le nom de code tiré du casino), calculent des espérances par échantillonnage :
$$\mathbb E_{x\sim p}[f(x)]=\int f(x)p(x)\,dx\approx\frac1N\sum_{i=1}^Nf(x_i),\qquad x_i\sim p.$$
Cet estimateur est <b>sans biais</b> et <b>consistant</b> : l’écart à l’espérance est aléatoire, de moyenne nulle et de variance proportionnelle à $1/N$ (le slide écrit $\mathcal N(0,1/N)$ ; la variance exacte est $\mathrm{Var}(f(x))/N$).</p>
<div class="def"><b>Monte-Carlo en RL</b> : $v_\pi(s)=\mathbb E[G_t\mid S_t=s]$. On découpe l’apprentissage en <b>épisodes</b> de longueur $T$ simulés avec $\pi$ fixée ; on observe en fin d’épisode les retours $G_t=\sum_{i=0}^{T}\gamma^iR_{t+i+1}$ ; si l’état $s$ a été atteint $n_T$ fois au total,
$$\hat v_{n_T}(s)=\frac1{n_T}\sum_{i=1}^{n_T}G_i(s),$$
la moyenne des retours observés après $s$.</div>
<div class="thm"><b>Moyenne incrémentale</b> (pas besoin de stocker tous les retours, seulement le compteur $n_T$) :
$$\hat v_{n}=\frac1n\big(G_n+(n-1)\hat v_{n-1}\big)=\hat v_{n-1}+\frac1n\big(G_n-\hat v_{n-1}\big).$$
Avec un taux d’apprentissage $\alpha(s)$ à la place de $1/n$, décroissant vers 0 :
$$v_\pi(s)\leftarrow v_\pi(s)+\alpha(s)\big(G_t-v_\pi(s)\big).$$
Plus besoin de $n_T$, et utile si l’environnement change (non stationnaire). Convergence vers la vraie moyenne par la loi des grands nombres. $\alpha$ trop petit : convergence lente ; trop grand : oscillation autour de la moyenne. Cette forme « ancien + $\alpha$ (cible − ancien) » revient partout en RL.</div>
<h4>3. Savoir-faire</h4>
<p><b>Moyenne incrémentale (exemple des portes, RL2 slide 51)</b> : la porte de droite rapporte successivement +1, +3, +2. $\hat v_1=1$ ; $\hat v_2=1+\frac12(3-1)=2$ ; $\hat v_3=2+\frac13(2-2)=2$. On retrouve les valeurs du slide.</p>
<p><b>Les épisodes du cours</b> (fiche précédente, $\gamma=1$) : retours observés après chaque état.</p>
<ul><li>B : épisodes 1 et 2, $-1-1+10=8$ chaque fois, donc $\hat v(B)=8$.</li>
<li>C : $9,\ 9,\ 9$ puis $-1-10=-11$, donc $\hat v(C)=(9+9+9-11)/4=4$.</li>
<li>E : épisode 3, $8$ ; épisode 4, $-1-1-10=-12$ ; donc $\hat v(E)=-2$.</li>
<li>D : $10$ ; A : $-10$.</li></ul>
<p>Le modèle estimé donnait $v(B)=v(E)=3$. Monte-Carlo donne 8 et −2 : il ignore que B et E passent tous deux par C. E a simplement eu un épisode malchanceux sur deux. Il faudrait beaucoup plus d’épisodes pour corriger cette variance.</p>
<h4>4. Every-visit ou first-visit</h4>
<div class="def"><b>Every-visit</b> : $s$ est mis à jour à chaque passage dans la trajectoire (un agent peut repasser au même endroit d’un labyrinthe) ; les erreurs ne sont pas indépendantes, d’où un <b>biais</b>.<br>
<b>First-visit</b> : seule la moyenne des retours qui suivent le <b>premier</b> passage par $s$ dans chaque épisode compte ; estimateur <b>sans biais</b>.</div>
<p>Prenons un épisode A → A → fin, récompenses 1 puis 2, $\gamma=1$. Retour après le premier passage : $1+2=3$ ; après le second : $2$. First-visit : $\hat v(A)=3$. Every-visit : $(3+2)/2=2{,}5$.</p>
<h4>5. Limites</h4>
<ul><li>L’apprentissage doit être découpé en épisodes <b>finis</b>.</li>
<li>Il faut attendre la fin de l’épisode pour apprendre.</li>
<li>On n’obtient qu’une évaluation de $\pi$ (on-policy).</li>
<li>Maintenir assez d’exploration est un problème ; pour trouver la meilleure politique, il faudrait estimer la valeur de <b>chaque action</b>.</li></ul>
<h4>Pièges</h4>
<ul><li>Le retour se calcule à partir de l’instant du passage, pas depuis le début de l’épisode.</li>
<li>Avec $\alpha$ constant, l’estimation pondère davantage les retours récents : elle ne converge pas exactement vers la moyenne, elle fluctue autour.</li>
<li>Monte-Carlo n’exploite pas la propriété de Markov : c’est sa force (pas d’hypothèse) et sa faiblesse (variance, exemple de E).</li></ul>
<div class="def"><b>À retenir</b><ul>
<li>$\hat v(s)$ = moyenne des retours observés après $s$, en fin d’épisode.</li>
<li>Incrémental : $v\leftarrow v+\alpha(G-v)$, avec $\alpha=1/n$ pour la moyenne exacte.</li>
<li>First-visit sans biais, every-visit biaisé.</li>
<li>Épisodes finis obligatoires ; on attend la fin pour apprendre ; on évalue seulement $\pi$.</li></ul></div>`,
      },
      {
        id: 'rl-td', title: 'Différences temporelles TD(0) et TD(λ)', slides: 'RL2 29-36',
        summary: 'Après chaque transition : v(s) ← v(s) + α[r + γ v(s′) − v(s)]. On met à jour une estimation à partir d’une estimation (bootstrap). Pas besoin d’attendre la fin de l’épisode.',
        fiche: R`
<p><b>L’idée</b> : au lieu d’attendre la fin de l’épisode pour connaître le retour, on l’estime dès le pas suivant : récompense reçue + valeur estimée de l’état d’arrivée. On corrige la valeur de l’état quitté d’une fraction de l’écart. On apprend ainsi après chaque transition.</p>
<p>But (Rich Sutton, 1988) : ne pas attendre la fin de l’épisode ; la politique $\pi$ est fixée. Comment calculer une moyenne en ne voyant qu’une valeur à la fois ? Par une <b>moyenne glissante</b>.</p>
<div class="thm"><b>TD(0)</b> : après chaque transition $(s,a,s',r)$ jouée avec $\pi$,
$$v_\pi(s)\leftarrow(1-\alpha)v_\pi(s)+\alpha\big[R(s,\pi(s),s')+\gamma v_\pi(s')\big],$$
ce qui se réécrit
$$v_\pi(s)\leftarrow v_\pi(s)+\alpha\Big[\underbrace{R(s,\pi(s),s')+\gamma v_\pi(s')}_{\text{cible TD (nouvelle observation)}}-\underbrace{v_\pi(s)}_{\text{estimation actuelle}}\Big]=v_\pi(s)+\alpha\,\delta.$$
$\alpha$ : le taux d’apprentissage ; petit ($\approx0{,}1$), il injecte un peu d’information nouvelle à chaque pas ; on le fait généralement décroître. $\delta$ : l’<b>erreur TD</b>. TD(0) est le TD « à un pas ». Convergence prouvée (Dayan et Sejnowski, 1994).</div>
<h4>1. Pourquoi « différence temporelle »</h4>
<p>Par définition $v_\pi(s)=\mathbb E[R_{t+1}+\gamma G_{t+1}\mid S_t=s]$. Si les estimations étaient exactes, on aurait $v_t=r_t+\gamma r_{t+1}+\gamma^2r_{t+2}+\dots$ et $v_{t+1}=r_{t+1}+\gamma r_{t+2}+\dots$, donc exactement $v_t=r_t+\gamma v_{t+1}$. TD(0) corrige l’écart entre ces deux termes, pris à deux instants successifs. C’est un estimateur <b>bootstrap</b> : il met à jour une estimation vers une autre estimation ($v(s')$). Écriture indicée du cours : $v_{k+1}(s)=v_k(s)+\alpha[R(s,\pi(s),s')+\gamma v_k(s')-v_k(s)]=v_k(s)+\alpha\,\delta_k(s)$.</p>
<h4>2. Savoir-faire : TD(0) sur les épisodes du cours</h4>
<p>Reprenons les épisodes de la fiche model-based, $\gamma=1$, toutes les valeurs à 0 au départ, et prenons $\alpha=0{,}5$.</p>
<ul><li>Épisode 1. $(B,C,-1)$ : $\delta=-1+0-0=-1$, $v(B)=-0{,}5$. $(C,D,-1)$ : $v(C)=-0{,}5$. $(D,x,+10)$ : $\delta=10$, $v(D)=5$.</li>
<li>Épisode 2. $(B,C,-1)$ : $\delta=-1+(-0{,}5)-(-0{,}5)=-1$, $v(B)=-1$. $(C,D,-1)$ : $\delta=-1+5-(-0{,}5)=4{,}5$, $v(C)=-0{,}5+2{,}25=1{,}75$. $(D,x,+10)$ : $\delta=10-5=5$, $v(D)=7{,}5$.</li></ul>
<p>L’information du +10 remonte d’un état à chaque passage : $D$ d’abord, puis $C$, et $B$ profitera de la nouvelle valeur de $C$ au prochain épisode. Sur la même trajectoire, Monte-Carlo aurait mis $v(B)$ vers 8 dès le premier épisode ; TD, lui, réutilise la valeur de $C$ apprise aussi grâce aux épisodes qui partent de E.</p>
<p><b>Illustration du cours</b> (slide 35, GridWorld, living reward 0, $\alpha=0{,}5$) : après quelques épisodes, les valeurs décroissent en s’éloignant de la sortie +1 (1,00 ; 0,98 ; 0,91 ; 0,75 ; 0,50 ; 0,13) et restent à 0 dans les cases jamais atteintes.</p>
<h4>3. TD(λ)</h4>
<div class="def">TD(0) : $v_{k+1}(s)=v_k(s)+\alpha\,\delta_k(s)$. <b>TD(λ)</b> l’étend en sommant les erreurs TD des pas suivants, pondérées par $\lambda^{m-k}$ ($\lambda\in[0,1]$) :
$$v_{k+1}(s)=v_k(s)+\alpha\sum_{m=k}^{N-1}\lambda^{m-k}\delta_m(s).$$
$\lambda=0$ redonne TD(0) ; $\lambda$ proche de 1 se rapproche de Monte-Carlo (on utilise toute la suite de l’épisode).</div>
<h4>4. Bilan</h4>
<ul><li>TD apprend <b>avant</b> le résultat final, et même <b>sans</b> résultat final : séquences incomplètes, environnements continus sans fin.</li>
<li>TD exploite la propriété de Markov (Monte-Carlo non).</li>
<li>TD(0) donne une évaluation de $\pi$ (on-policy) ; maintenir assez d’exploration reste un problème, et pour trouver $\pi^*$ il faut estimer la valeur de <b>chaque action</b> (notion suivante).</li></ul>
<p class="muted">Le slide 36 dit que « TD converge vers les valeurs optimales ». Pour une politique $\pi$ fixée, TD(0) converge vers $v_\pi$, qui n’est $v^*$ que si $\pi$ est optimale. À confirmer avec le Prof. Siebert (RL2 slide 36).</p>
<h4>Pièges</h4>
<ul><li>La cible TD contient une estimation : au début, elle est fausse, et l’apprentissage se propage de proche en proche.</li>
<li>Pour un état terminal, $v(s')=0$ : la cible vaut $r$.</li>
<li>Complément (Sutton et Barto, hors slides) : la cible TD a moins de variance que le retour complet de Monte-Carlo (une seule récompense aléatoire), mais elle est biaisée tant que $v(s')$ est faux.</li></ul>
<div class="def"><b>À retenir</b><ul>
<li>$v(s)\leftarrow v(s)+\alpha[r+\gamma v(s')-v(s)]$ après chaque transition.</li>
<li>Cible TD $r+\gamma v(s')$ ; erreur TD $\delta$ = cible − estimation ; bootstrap.</li>
<li>Marche sans fin d’épisode, exploite Markov ; évalue seulement $\pi$ (converge vers $v_\pi$).</li>
<li>TD(λ) : entre TD(0) ($\lambda=0$) et Monte-Carlo ($\lambda\to1$).</li></ul></div>`,
      },
      {
        id: 'rl-q', title: 'SARSA et q-learning', slides: 'RL2 37-49, RL3 3-4',
        summary: 'Apprendre q(s,a) plutôt que v(s). SARSA (on-policy) : cible r + γ q(s′,a′). q-learning (off-policy) : cible r + γ max q(s′,·). Convergence sous Σα = ∞, Σα² < ∞, visites infinies.',
        fiche: R`
<p><b>L’idée</b> : connaître la valeur d’un état ne dit pas quelle action jouer sans modèle. On apprend donc directement la valeur de chaque couple (état, action) ; il suffit ensuite de choisir l’action de plus grande q-valeur. SARSA apprend la valeur de la politique qu’il suit ; le q-learning apprend celle de la politique optimale, quelle que soit la politique suivie.</p>
<p><b>TD(0) revisité</b> : on n’apprend que sur la politique suivie, on ne choisit pas vraiment les actions. On calcule $q(s,\pi(s))$ mais pas $q(s,a)$ pour tout $a$, donc impossible de calculer $\pi^*(s)=\arg\max_aq(s,a)$. <b>Idée</b> : apprendre $q(s,a)$ au lieu de $v(s)$. Rappel : $v^*(s)=\max_aq^*(s,a)$ et $q^*(s,a)=\sum_{s'}T(s,a,s')[R(s,a,s')+\gamma v^*(s')]$.</p>
<div class="thm"><b>SARSA</b> (on-policy) : comme TD(0), mais sur $q$ :
$$q_{k+1}(s,a)\leftarrow q_k(s,a)+\alpha\big[r_k+\gamma q_k(s',a')-q_k(s,a)\big].$$
Une mise à jour demande le quintuplet $(s,a,r,s',a')$, d’où le nom. $a'$ est l’action que la politique suivie choisit réellement en $s'$ : il faut un pas d’anticipation. Les actions viennent de la politique suivie, ce qui contraint l’exploration et l’apprentissage ; les preuves de convergence sont plus difficiles (Singh et al., 2000).</div>
<div class="thm"><b>q-learning</b> (Watkins, 1989 ; off-policy). On part de la <b>q-value iteration</b> (depuis $q_0=0$), qui évite le max difficile à estimer hors de l’espérance :
$$q_{k+1}(s,a)\leftarrow\sum_{s'}T(s,a,s')\big[R(s,a,s')+\gamma\max_{a'}q_k(s',a')\big],$$
et l’on remplace la moyenne pondérée par $T$ (inconnue) par une moyenne glissante sur les échantillons. Algorithme : (1) estimation courante $q(s,a)$ ; (2) échantillon $(s,a,s',r)$, quelle que soit la politique qui a choisi $a$ ; (3) nouvelle estimation $R(s,a,s')+\gamma\max_{a'}q(s',a')$ ; (4) mise à jour
$$q(s,a)\leftarrow(1-\alpha)q(s,a)+\alpha\big[R(s,a,s')+\gamma\max_{a'}q(s',a')\big]=q(s,a)+\alpha\Delta(s,a),$$
avec $\Delta(s,a)=[R(s,a,s')+\gamma\max_{a'}q(s',a')]-q(s,a)$. C’est une simplification de SARSA : pas besoin de connaître $a'$. Sa convergence a été prouvée avant celle de SARSA.</div>
<h4>1. Savoir-faire : SARSA et q-learning sur la même transition</h4>
<p>Prenons $q(s,a)=2$, $r=1$, $\gamma=0{,}9$, $\alpha=0{,}5$, et en $s'$ deux actions avec $q(s',a'_1)=4$, $q(s',a'_2)=1$. La politique ε-greedy explore et choisit $a'_2$.</p>
<ul><li><b>SARSA</b> utilise l’action jouée : cible $1+0{,}9\times1=1{,}9$, $q\leftarrow2+0{,}5(1{,}9-2)=1{,}95$.</li>
<li><b>q-learning</b> utilise le max : cible $1+0{,}9\times4=4{,}6$, $q\leftarrow2+0{,}5(4{,}6-2)=3{,}3$.</li></ul>
<p>SARSA intègre le fait que la politique suivie explore parfois mal ; le q-learning évalue ce que ferait la politique gloutonne, même si l’agent ne l’a pas suivie. D’où « on apprend $\pi^*$ sans la suivre ».</p>
<h4>2. Convergence et caractéristiques</h4>
<div class="def"><b>Convergence du q-learning</b> : $\lim_{k\to\infty}q_k(s,a)=q^*(s,a)$ si
<ul><li>$S$ et $A$ sont finis ;</li>
<li>chaque couple $(s,a)$ est visité une infinité de fois ;</li>
<li>les taux $\alpha_k(s,a)$ vérifient $\sum_k\alpha_k=\infty$ et $\sum_k\alpha_k^2<\infty$ (conditions de Robbins-Monro ; le slide 47 n’affiche que la seconde). Exemple : $\alpha_k=1/k$ ;</li>
<li>$\gamma<1$, ou, si $\gamma=1$, il existe un état absorbant de récompense nulle pour toute politique.</li></ul></div>
<ul><li>La convergence peut être lente : avec $q_0=0$, le début ressemble à une marche au hasard ; les valeurs non nulles n’apparaissent qu’une fois une source de récompense atteinte, et ne se propagent qu’aux états voisins.</li>
<li>On apprend $\pi^*$ sans la suivre ; la politique utilisée compte peu, mais il faut <b>explorer</b> assez (on n’apprend que sur les états visités).</li>
<li>$\alpha$ petit mais pas trop : $\alpha\to0$, on n’apprend rien.</li>
<li>Illustration du cours (slide 46) : table des q-valeurs de GridWorld après 100 itérations (bruit 0,2, $\gamma=0{,}9$, living reward 0) ; on apprend le max case par case.</li></ul>
<p><b>Implémentation du cours</b> (RL3, slides 3 et 4) : une table <code>qVals</code> indexée par (état, action) ; <code>getValue</code> renvoie le max des q-valeurs, ou 0 s’il n’y a aucune action légale (état terminal) ; <code>update</code> calcule <code>sample = reward + discount * getValue(nextState)</code> puis <code>(1 - alpha) * qSa + alpha * sample</code> ; <code>getPolicy</code> départage les ex aequo au hasard. Le code se fait au <a class="link" href="#course/tp4-ql">TP4</a>.</p>
<h4>3. Actor-critic (RL2 slide 49)</h4>
<div class="def">Problème de Monte-Carlo et de TD(0) : la fonction de valeur ne dit pas quelle action prendre. On maintient en même temps un <b>acteur</b> (la politique, qui choisit les actions) et un <b>critique</b> (la fonction de valeur, qui les évalue) avec $\delta_t=R_{t+1}+\gamma v(s_{t+1})-v(s_t)$ : $\delta_t>0$, l’action a fait mieux que prévu, l’encourager ; $\delta_t<0$, la décourager. Hybride entre méthodes fondées sur la politique et sur la valeur, cadre très flexible repris en deep RL (fiche policy gradient).</div>
<h4>Pièges</h4>
<ul><li>SARSA : $a'$ est l’action <b>réellement</b> choisie, y compris quand elle est exploratoire. q-learning : le max, même si l’action suivante sera exploratoire.</li>
<li>Si $s'$ est terminal, $\max_{a'}q(s',a')=0$ : la cible vaut $r$.</li>
<li>$\alpha$ constant viole $\sum\alpha^2<\infty$ : en pratique on l’utilise quand même, mais la garantie théorique ne s’applique plus.</li>
<li>« Off-policy » ne veut pas dire « sans politique » : il faut une politique d’exploration pour générer les échantillons.</li></ul>
<div class="def"><b>À retenir</b><ul>
<li>SARSA : $q\leftarrow q+\alpha[r+\gamma q(s',a')-q]$, on-policy.</li>
<li>q-learning : $q\leftarrow q+\alpha[r+\gamma\max_{a'}q(s',a')-q]$, off-policy, version stochastique de la q-value iteration.</li>
<li>Convergence : $S,A$ finis, visites infinies, $\sum\alpha=\infty$, $\sum\alpha^2<\infty$, $\gamma<1$.</li>
<li>Exemple : même transition, SARSA 1,95, q-learning 3,3.</li></ul></div>`,
      },
      {
        id: 'rl-explore', title: 'Exploration vs exploitation : ε-greedy, softmax', slides: 'RL2 50-58, RL3 5',
        summary: 'Glouton : n’explore jamais. ε-greedy : π(a*|s) = ε/m + 1 − ε. Softmax (Boltzmann) : p(a) ∝ exp(β q(a)), température τ = 1/β.',
        fiche: R`
<p><b>L’idée</b> : jouer toujours l’action qui paraît la meilleure empêche de découvrir qu’une autre est meilleure. Il faut parfois essayer autre chose. ε-greedy le fait au hasard avec une petite probabilité ; softmax le fait en donnant plus de chances aux actions qui paraissent bonnes.</p>
<div class="def"><b>Politique gloutonne</b> : à l’instant $t$, dans l’état $s$, choisir $a^*$ tel que $q_t(s,a^*)=\max_aq_t(s,a)$. Pure <b>exploitation</b> de ce qu’on sait sur $q$, aucune <b>exploration</b> : on peut manquer des actions précieuses.</div>
<p><b>L’exemple des deux portes</b> (slide 51, D. Silver) : on ouvre la porte de gauche, récompense 0, $V(\text{gauche})=0$. On ouvre la droite : +1, $V(\text{droite})=1$ ; puis +3, $V=2$ ; puis +2, $V=2$. Le glouton choisira toujours la droite et ne retestera jamais la gauche, sur la foi d’un seul essai. Est-on sûr d’avoir choisi la meilleure porte ?</p>
<div class="def"><b>ε-greedy</b> : avec probabilité $\epsilon$, explorer une action au hasard (y compris éventuellement $a^*$) ; avec probabilité $1-\epsilon$, exploiter $a^*$. Parmi $m$ actions :
$$\pi(a\mid s)=\begin{cases}\dfrac\epsilon m+1-\epsilon&\text{si }a=\arg\max_{a'}q(s,a')\\[2mm]\dfrac\epsilon m&\text{sinon}\end{cases}$$
$\epsilon$ doit être une petite probabilité. L’idée semble naïve, mais elle a des garanties théoriques d’amélioration de la politique.</div>
<p><b>Savoir-faire</b> : $\epsilon=0{,}1$, $m=4$ actions. L’action gloutonne est jouée avec probabilité $0{,}1/4+0{,}9=0{,}925$, chacune des trois autres avec $0{,}025$. Vérification : $0{,}925+3\times0{,}025=1$. Le même mécanisme est étudié pour les bandits dans la fiche <a class="link" href="#course/bd-egreedy">ε-greedy des bandits</a>.</p>
<h4>1. Glouton contre ε-greedy (slides 53 et 54)</h4>
<p>Sur un bandit à plusieurs bras, performance moyenne sur 2000 tâches : le glouton ne trouve l’action optimale que dans environ 1/3 des cas. Dans les autres, ses premiers essais de l’action optimale l’ont déçu et il ne l’a plus explorée. ε-greedy fait mieux parce qu’il continue d’explorer. En général, cela dépend de la variance des récompenses :</p>
<ul><li>forte variance : ε-greedy meilleur ;</li>
<li>variance nulle : le glouton est meilleur, il essaie chaque action une fois et trouve la solution plus vite ;</li>
<li>récompenses non stationnaires : le glouton ne trouvera pas la solution.</li></ul>
<p><b>Défauts d’ε-greedy</b> : il explore trop d’actions de façon non structurée (toutes avec la même probabilité) et peut passer beaucoup de temps sur de mauvaises actions en manquant des actions quasi optimales. Remèdes : diminuer $\epsilon$ au cours du temps, ou donner plus de poids aux actions prometteuses avec une <b>fonction d’exploration</b>.</p>
<div class="def"><b>Softmax</b> (distribution de Boltzmann ou de Gibbs) : à l’instant $t$, choisir $a$ avec probabilité
$$p(a)=\frac{\exp(\beta q_t(a))}{\sum_{b=1}^n\exp(\beta q_t(b))},\qquad\tau=\frac1\beta.$$
$\tau$ s’appelle la « température ».
$\tau\to0$ ($\beta\to\infty$) : glouton, pure exploitation. $\tau\to\infty$ ($\beta\to0$) : uniforme, pure exploration. Difficile de choisir $\tau$ sans connaissance supplémentaire.</div>
<p><b>Savoir-faire</b> : trois actions de q-valeurs $(1;\ 2;\ 3)$.</p>
<table><tr><th>$\beta$</th><th>$p(a_1)$</th><th>$p(a_2)$</th><th>$p(a_3)$</th></tr>
<tr><td>0,1</td><td>0,301</td><td>0,332</td><td>0,367</td></tr>
<tr><td>1</td><td>0,090</td><td>0,245</td><td>0,665</td></tr>
<tr><td>10</td><td>≈ 0</td><td>≈ 0</td><td>≈ 1</td></tr></table>
<p>Pour $\beta=1$ : $e^1+e^2+e^3=2{,}718+7{,}389+20{,}086=30{,}193$, et $p(a_3)=20{,}086/30{,}193=0{,}665$. Contrairement à ε-greedy, la mauvaise action $a_1$ est moins explorée que la moyenne $a_2$.</p>
<p><b>Implémentation du cours</b> (RL3 slide 5) : <code>getAction</code> tire une pièce <code>util.flipCoin(epsilon)</code> ; si elle tombe, action légale au hasard, sinon <code>getPolicy(state)</code> ; aucune action dans un état terminal (<code>None</code>). Voir le <a class="link" href="#course/tp4-ql">TP4</a>.</p>
<h4>Pièges</h4>
<ul><li>L’action gloutonne a probabilité $\epsilon/m+1-\epsilon$, pas $1-\epsilon$ : le tirage aléatoire peut aussi tomber sur elle.</li>
<li>Softmax dépend de l’échelle des q-valeurs : multiplier toutes les q-valeurs par 10 revient à multiplier $\beta$ par 10.</li>
<li>La figure du slide 57 écrit $\exp(-Q(a)\beta)$, une convention où $Q$ est un coût à minimiser ; avec des récompenses (convention du slide 56), le signe est $+$. À confirmer avec le Prof. Siebert (RL2 slide 57).</li></ul>
<div class="def"><b>À retenir</b><ul>
<li>Glouton : jamais d’exploration, peut se fixer sur une mauvaise action après un essai malchanceux.</li>
<li>ε-greedy : $\frac\epsilon m+1-\epsilon$ pour l’action gloutonne, $\frac\epsilon m$ pour les autres ; diminuer $\epsilon$ avec le temps.</li>
<li>Softmax : $p(a)\propto e^{\beta q(a)}$, $\tau=1/\beta$ ; $\tau\to0$ glouton, $\tau\to\infty$ uniforme.</li>
<li>Le meilleur choix dépend de la variance et de la stationnarité des récompenses.</li></ul></div>`,
      },
      {
        id: 'rl-approx', title: 'q-learning approché', slides: 'RL3 7-23',
        summary: 'Trop d’états pour une table : q̂(s,a,w) = Σ wi fi(s,a). Mise à jour wi ← wi + α Δ fi(s,a) : on « blâme » les features actives. C’est une descente de gradient sur l’erreur au carré.',
        fiche: R`
<p><b>L’idée</b> : quand il y a trop d’états pour une table, on décrit chaque situation par quelques caractéristiques chiffrées (distance au fantôme, au point le plus proche) et on approche la q-valeur par une combinaison pondérée de ces caractéristiques. Apprendre revient alors à ajuster quelques poids, et ce qui est appris dans une situation sert dans toutes les situations semblables.</p>
<h4>1. Motivations</h4>
<p>Si la table $(s,a)$ est trop grande : impossible de visiter tous les états, presque chaque état rencontré est nouveau, et tout ne tient pas en mémoire. Il faut une méthode qui passe à l’échelle et qui <b>généralise</b>. Ordres de grandeur : tic-tac-toe 5478 états (255 168 parties distinctes), backgammon $\approx10^{20}$, échecs $\approx10^{120}$, go $10^{170}$ à $10^{360}$, robots : espace d’états continu.</p>
<p><b>PacMan « MediumClassic »</b> (slide 9) : position de PacMan (107 possibilités), position de chaque fantôme ($107^2$ pour deux fantômes), pilules restantes ($2^2$), cases encore pleines ($2^{104}$ combinaisons). Le slide conclut $|S|\gg107^3=1\,225\,043$. Le produit de toutes ces possibilités vaut $107^3\times2^2\times2^{104}\approx10^{38}$, une borne haute puisque toutes les combinaisons ne sont pas atteignables (PacMan ne saute pas).</p>
<p>Avec un q-learning « naïf », trois positions presque identiques (PacMan et deux fantômes dans le même coin, ou le même schéma ailleurs) sont trois états différents, appris séparément. Il faut transférer la connaissance : le RL approché est de l’<b>approximation de fonction</b>.</p>
<h4>2. Approximation de la fonction de valeur</h4>
<div class="def">On approche $v_\pi(s)$, pour une politique connue $\pi$, par une forme paramétrée $\hat v(s,w)$, avec $w\in\mathbb R^d$ un vecteur de $d$ poids et $d\ll|S|$.
<ul><li>Combinaison linéaire de <b>features</b> : $\hat v(s,w)=\sum_{i=1}^dw_if_i(s)$, où $f_i(s)$ est la $i$-ème caractéristique de l’état et $w_i$ son poids.</li>
<li>Ou un réseau de neurones (profond).</li>
<li>Même principe pour les q-valeurs : $\hat q(s,a,w)=\sum_{i=1}^dw_if_i(s,a)$.</li></ul>
<b>Avantage</b> : l’expérience est résumée par quelques nombres $w_i$. <b>Inconvénient</b> : des états aux features semblables peuvent avoir des valeurs très différentes ($f$ = nombre de fantômes proches : deux fantômes du même côté ou non ? un fantôme proche mangeable ou non ?).</div>
<p>Cela ressemble à de l’apprentissage supervisé, mais les données sont <b>non stationnaires</b> (la politique change au cours du temps) et <b>non i.i.d.</b> ($S_t$ et $S_{t+1}$ sont corrélés).</p>
<p><b>Features pour PacMan</b> : pour les états, distance $d_f$ au fantôme le plus proche, distance $d_p$ au point le plus proche, nombre $n_f$ de fantômes, PacMan dans un tunnel (0/1), $1/d_p^2$… ; pour les q-états, « l’action $a$ rapproche PacMan d’un fantôme », « de la nourriture »… Il faut une <b>expertise</b> du problème.</p>
<h4>3. L’algorithme</h4>
<div class="thm"><b>q-learning exact</b> (Watkins, 1989) : échantillon $(s,a,s',r)$, différence $\Delta(s,a)=[R(s,a,s')+\gamma\max_{a'}q(s',a')]-q(s,a)$, puis $q(s,a)\leftarrow q(s,a)+\alpha\Delta(s,a)$.<br>
<b>q-learning approché</b> (« fitted », Gordon, 1996) : même $\Delta$, calculé avec $\hat q$, puis pour chaque feature
$$w_i\leftarrow w_i+\alpha\,\Delta(s,a)\,f_i(s,a).$$
Intuition : si la q-valeur était trop haute ($\Delta<0$), on blâme les features qui étaient actives, d’autant plus qu’elles l’étaient fortement.</div>
<h4>4. Savoir-faire : l’exemple PacMan du cours</h4>
<p>$\hat q(s,a)=w_{DOT}f_{DOT}(s,a)+w_{GST}f_{GST}(s,a)$ avec $f_{DOT}$ = 1/(distance au point le plus proche) et $f_{GST}$ = 1/(distance au fantôme le plus proche). Poids de départ : $w_{DOT}=4$, $w_{GST}=-1$.</p>
<ol><li>Action NORTH (q-état : les fantômes n’ont pas encore bougé) : point à distance 2, $f_{DOT}=1/2$ ; fantôme à distance 1, $f_{GST}=1$. Donc $\hat q(s,\text{NORTH})=4\times\frac12-1\times1=1$.</li>
<li>Après la transition, PacMan est mort : $q(s',a')=0$ pour tout $a'$, récompense $R=-500$. $\Delta=[-500+\gamma\times0]-1=-501$.</li>
<li>Mise à jour : $w_{DOT}\leftarrow4+\alpha(-501)\frac12$ et $w_{GST}\leftarrow-1+\alpha(-501)\times1$. Prenons $\alpha=0{,}004$ (le cours laisse $\alpha$ symbolique) : $w_{DOT}=4-1{,}002=2{,}998$ et $w_{GST}=-1-2{,}004=-3{,}004$.</li></ol>
<p>Le poids du fantôme baisse deux fois plus que celui du point, parce que sa feature valait 1 contre 1/2. Désormais, toute situation avec un fantôme proche sera jugée plus dangereuse, même jamais vue : c’est la généralisation.</p>
<h4>5. Le lien avec la régression linéaire</h4>
<div class="thm">Pour une régression $\hat y=w_0+w_1f_1(x)$ et l’erreur $\sum_i(y_i-\hat y_i)^2=\sum_i(y_i-w_0-w_1f_1(x_i))^2$, la dérivée pour un exemple vaut $\frac{\partial\,\text{erreur}}{\partial w_1}=-2\big(y_i-w_0-w_1f_1(x_i)\big)f_1(x_i)$. En corrigeant dans la direction opposée au gradient :
$$w_1\leftarrow w_1+\alpha\big(\underbrace{y_i}_{\text{cible}}-\underbrace{(w_0+w_1f_1(x_i))}_{\text{prédiction}}\big)f_1(x_i).$$
C’est exactement la mise à jour du q-learning approché, avec cible $=R(s,a,s')+\gamma\max_{a'}q(s',a')$ et prédiction $=q(s,a)$ (le facteur 2 est absorbé dans $\alpha$).</div>
<h4>Pièges</h4>
<ul><li>La cible dépend elle-même des poids : ce n’est pas une vraie régression à cible fixe (source d’instabilité, fiche DQN).</li>
<li>Avec une feature indicatrice par couple $(s,a)$ (1 pour ce couple, 0 ailleurs), la mise à jour ne touche qu’un poids, de $\alpha\Delta$ : on retrouve exactement le q-learning tabulaire, sans aucune généralisation.</li>
<li>Des features d’échelles très différentes déséquilibrent les mises à jour (elles sont proportionnelles à $f_i$).</li>
<li>Le slide 9 se lit « $|S|\gg107^3$ », et non $10^{73}$.</li></ul>
<div class="def"><b>À retenir</b><ul>
<li>$\hat q(s,a,w)=\sum_iw_if_i(s,a)$, $d\ll|S|$ : généraliser à des états jamais vus.</li>
<li>$\Delta=r+\gamma\max_{a'}\hat q(s',a')-\hat q(s,a)$, puis $w_i\leftarrow w_i+\alpha\Delta f_i(s,a)$.</li>
<li>C’est une descente de gradient sur (cible − prédiction)², comme en régression linéaire.</li>
<li>Données non stationnaires et non i.i.d. ; les features demandent une expertise. Mise en œuvre au <a class="link" href="#course/tp4-pacman">TP4</a>.</li></ul></div>`,
      },
      {
        id: 'rl-dqn', title: 'Deep Q-Network et ses astuces', slides: 'RL3 25-60',
        summary: 'Un réseau approxime q(s,a,w). Instable car la cible bouge et les données sont corrélées : experience replay, réseau cible gelé, clipping des récompenses ; puis double DQN, dueling, replay priorisé, noisy nets.',
        fiche: R`
<p><b>L’idée</b> : au lieu d’écrire les features à la main, on laisse un réseau de neurones profond les apprendre, directement à partir des pixels. On l’entraîne comme le q-learning approché, mais il faut plusieurs astuces pour que l’apprentissage reste stable, parce que le réseau fabrique lui-même ses cibles.</p>
<h4>1. Deep RL</h4>
<p>On va plus loin que l’approximation de fonction : plus besoin de fabriquer les features, un réseau profond les apprend. <b>Atari</b> : « Playing Atari with Deep Reinforcement Learning » (NIPS 2013, premiers succès sur des jeux Atari) puis « Human-level control through deep reinforcement learning » (Nature 2015). Un agent apprend en regardant seulement les pixels, off-policy et model-free ; le même modèle joue à tous les jeux. Apprendre Atari a pris des semaines d’entraînement.</p>
<p><b>Complexité</b> : avec les 4 dernières images de $84\times84$ pixels et 256 niveaux de gris, il y a $256^{84\times84\times4}\approx10^{67970}$ états possibles ($84\times84\times4\times\log_{10}256\approx67970$). La plupart ne seront jamais visités : le deep RL est surtout utile quand l’espace d’états est de grande dimension.</p>
<div class="thm"><b>Approximateurs universels</b> (Hornik, 1989) : tout réseau feedforward à $n\ge1$ couches cachées peut approcher toute fonction mesurable de $\mathbb R^d$ ($d$ fini) avec une précision arbitraire $\epsilon>0$. Fonctions à approcher : politiques $\pi(s)$, valeurs $v(s)$, q-valeurs $q(s,a)$, modèles.</div>
<p><b>TD-Gammon</b> (Gerald Tesauro, IBM, 1992), du RL « pas si profond » : une seule couche cachée ; le réseau construit ses propres features, sans connaissance experte ; il joue contre lui-même 1,5 million de fois, avec des récompenses rares (+100 en cas de victoire, −100 en cas de défaite, 0 sinon) ; amélioration gloutonne de la politique, sans exploration.</p>
<p class="muted">Le slide 32 indique que TD-Gammon « a battu le champion du monde Luigi Villa 7-1 ». Ce score est celui du programme BKG 9.8 de Hans Berliner, à Monte-Carlo le 15 juillet 1979 (Berliner, <i>Artificial Intelligence</i>, 1980) ; TD-Gammon, plus tardif, a atteint le niveau des meilleurs joueurs humains sans qu’un tel match soit documenté. À confirmer avec le Prof. Siebert (RL3 slide 32).</p>
<h4>2. Le q-learning avec un réseau</h4>
<div class="def">On représente $q(s,a)$ par un réseau de poids $w$ : $q(s,a,w)\approx q(s,a)$, et l’on minimise l’erreur quadratique
$$L(w)=\mathbb E\Big[\big(\underbrace{R(s,a,s')+\gamma\max_{a'}q(s',a',w)}_{\text{cible}}-\underbrace{q(s,a,w)}_{\text{réseau}}\big)^2\Big]$$
par rétropropagation et descente de gradient stochastique, avec (cible traitée comme une constante)
$$\nabla_wL\propto-\mathbb E\Big[\big(R(s,a,s')+\gamma\max_{a'}q(s',a',w)-q(s,a,w)\big)\nabla_wq(s,a,w)\Big]$$
(le slide 34 omet la constante $-2$).<br>
<b>NFQ</b> (<i>Neural-fitted q-learning</i>, Riedmiller 2005) : au lieu d’un réseau qui prend $(s,a)$ en entrée (approche naïve), un réseau qui prend $s$ et sort toutes les $q(s,a_i)$ : le max s’obtient en <b>une seule passe</b>. Cela ne marche que pour des actions discrètes.</div>
<p><b>Problèmes potentiels</b> : mettre à jour $w$ change aussi la cible (les erreurs se propagent, convergence lente, instabilité, aucune garantie théorique) ; le max <b>surestime</b> les q-valeurs ; la descente de gradient stochastique est peu économe en échantillons (d’où l’apprentissage par lots, qui réutilise les échantillons au lieu de les jeter).</p>
<p><b>DQN</b> (Mnih et al., 2015) pour Atari : apprend à jouer à partir des pixels seuls, même architecture pour tous les jeux ; entrée = les pixels des 4 dernières images $84\times84$ ; sortie = $q(s,a_i)$ pour les 18 positions du joystick ; réseau convolutif, adapté à la connectivité locale des images. Le slide 42 compare ses scores au niveau humain sur de nombreux jeux.</p>
<h4>3. Pourquoi c’est instable</h4>
<p>En supervisé, la cible est connue ; en RL elle <b>bouge</b> : le RL crée son propre jeu de données, toujours changeant. Le réseau génère ses propres cibles, et ses choix d’actions décident des états qu’il atteindra, donc de ce qu’il devra apprendre. L’entraînement est long (de l’ordre de 100 millions d’images pour PacMan). Le q-learning profond peut osciller ou diverger parce que :</p>
<ol><li>les données sont <b>séquentielles</b> : échantillons successifs corrélés (non i.i.d.), et la cible dépend de $q$, si bien que $q$ peut s’emballer ;</li>
<li>la politique change brutalement pour une petite variation des q-valeurs : les échantillons deviennent inutiles à chaque changement, la politique peut osciller ;</li>
<li>l’échelle des récompenses et des q-valeurs est inconnue : gradients grands et instables.</li></ol>
<div class="thm"><b>Les trois astuces du DQN</b>
<ol><li><b>Experience replay</b> : jouer avec une politique ε-greedy, stocker les $N$ dernières transitions $(s_t,a_t,r_{t+1},s_{t+1})$ dans une mémoire $D$, entraîner sur des mini-lots tirés au hasard dans $D$, qui couvrent des états variés et moins corrélés. Perte : $L(w)=\mathbb E_{(s,a,r,s')\sim D}\big[(R+\gamma\max_{a'}q(s',a',w)-q(s,a,w))^2\big]$. La taille de la mémoire se règle ; les mini-lots se calculent en parallèle.</li>
<li><b>Réseau cible gelé</b> : deux réseaux, $A$ figé pendant une période $T$ et $B$ mis à jour en continu. Les cibles sont calculées avec les anciens poids $w^A$ :
$$L(w^B)=\mathbb E_{(s,a,r,s')\sim D}\Big[\big(R+\gamma\max_{a'}q(s',a',w^A)-q(s,a,w^B)\big)^2\Big],$$
puis périodiquement $w^A\leftarrow w^B$. Cela casse la corrélation entre le réseau et sa cible et évite les oscillations : des « périodes d’apprentissage supervisé », comme NFQ.</li>
<li><b>Clipping</b> des récompenses dans $[-1,+1]$ (ou normalisation adaptative) : les q-valeurs restent raisonnables et les gradients bien conditionnés, mais on ne distingue plus petites et grandes récompenses.</li></ol></div>
<p><b>Effet mesuré</b> (slide 52, D. Silver, scores Atari) :</p>
<table><tr><th>Jeu</th><th>q-learning</th><th>+ cible</th><th>+ replay</th><th>+ replay + cible</th></tr>
<tr><td>Breakout</td><td>3</td><td>10</td><td>241</td><td>317</td></tr>
<tr><td>Enduro</td><td>29</td><td>142</td><td>831</td><td>1006</td></tr>
<tr><td>River Raid</td><td>1453</td><td>2868</td><td>4103</td><td>7447</td></tr>
<tr><td>Seaquest</td><td>276</td><td>1003</td><td>823</td><td>2894</td></tr>
<tr><td>Space Invaders</td><td>302</td><td>373</td><td>826</td><td>1089</td></tr></table>
<p>Lecture : les deux astuces ensemble donnent le meilleur score sur les cinq jeux ; le replay seul apporte plus que la cible seule sur quatre jeux sur cinq (Seaquest fait exception).</p>
<h4>4. Savoir-faire : calculer une cible</h4>
<p>Prenons $r=1$, $\gamma=0{,}99$, le réseau cible donne $q(s',\cdot,w^A)=(2;\ 3{,}5;\ 1)$, le réseau en ligne donne $q(s,a,w^B)=2{,}8$.</p>
<ul><li><b>DQN</b> : cible $1+0{,}99\times3{,}5=4{,}465$ ; erreur $4{,}465-2{,}8=1{,}665$ ; perte sur cet échantillon $1{,}665^2\approx2{,}772$. Le gradient pousse $q(s,a,w^B)$ vers le haut.</li>
<li><b>Double DQN</b> : le réseau en ligne donne $q(s',\cdot,w^B)=(2{,}5;\ 1{,}8;\ 3)$, il choisit donc l’action 3 ; le réseau cible l’évalue : cible $1+0{,}99\times q(s',a_3,w^A)=1+0{,}99\times1=1{,}99$. Les deux réseaux sont en désaccord sur la meilleure action, et la cible est beaucoup plus prudente.</li>
<li>Si $s'$ est terminal : cible $=r$ (après clipping : une récompense +500 devient +1).</li></ul>
<h4>5. Plus d’astuces</h4>
<ul><li><b>Double q-learning</b> (Van Hasselt et al., 2015) : dans le DQN, le réseau cible sert à la fois à calculer les q-valeurs et à choisir le max, ce qui peut surestimer $q$. On lui retire le choix : le réseau en ligne choisit, le réseau cible évalue, cible $R+\gamma\,q\big(s',\arg\max_{a'}q(s',a',w^B),w^A\big)$.</li>
<li><b>Dueling</b> (Wang et al., 2015) : l’avantage $A(s,a)=q(s,a)-v(s)$ mesure ce que l’action apporte par rapport à la valeur de l’état ; il est plus petit en amplitude que $q$. On sépare $q$ en deux têtes : $Q(s,a;w^{(1)},w^{(2)},w^{(3)})=V(s;w^{(1)},w^{(3)})+A(s,a;w^{(1)},w^{(2)})-\max_{a'}A(s,a';w^{(1)},w^{(2)})$ ($w^{(1)}$ : couches communes). Réduit la variance de l’estimateur du gradient. Prenons $V(s)=5$ et $A=(1;\ -0{,}5;\ 0{,}3)$ : $q=(5;\ 3{,}5;\ 4{,}3)$, et l’action gloutonne a bien $q=V$.</li>
<li><b>Replay priorisé</b> (Schaul et al., 2016) : au lieu de tirer uniformément dans la mémoire, tirer chaque transition proportionnellement à une priorité, par exemple son erreur TD : apprendre là où l’on se trompe le plus.</li>
<li><b>Noisy networks</b> (Fortunato et al., 2017) : injecter du bruit dans les poids du réseau pour explorer, au lieu d’ε-greedy.</li></ul>
<h4>Pièges</h4>
<ul><li>On ne rétropropage pas à travers la cible : elle est traitée comme une constante (calculée par le réseau gelé).</li>
<li>Le réseau cible gelé et l’experience replay répondent à deux problèmes différents : la cible mobile et la corrélation des données.</li>
<li>Dans le dueling, sans le terme $-\max A$, on ne peut pas séparer $V$ et $A$ (ajouter $c$ à $V$ et retirer $c$ à $A$ donne le même $q$).</li></ul>
<div class="def"><b>À retenir</b><ul>
<li>$L(w)=\mathbb E[(r+\gamma\max_{a'}q(s',a',w^A)-q(s,a,w^B))^2]$ ; une sortie par action (NFQ).</li>
<li>Instable : cible mobile, données corrélées, échelle inconnue.</li>
<li>Replay (décorréler), réseau cible gelé (cible stable), clipping $[-1,1]$ (gradients).</li>
<li>Double DQN (surestimation), dueling ($q=V+A-\max A$), replay priorisé (erreur TD), noisy nets (exploration). Option deep q-learning du <a class="link" href="#course/tp4-rapport">TP4</a>.</li></ul></div>`,
      },
      {
        id: 'rl-pg', title: 'Policy gradient et actor-critic', slides: 'RL3 61-68',
        summary: 'Paramétrer directement la politique πθ(s,a) = P[a|s,θ] (politiques stochastiques, actions continues). Actor-critic : l’acteur agit, le critique note avec δt. A2C, A3C.',
        fiche: R`
<p><b>L’idée</b> : jusqu’ici on apprenait des valeurs et on en déduisait une politique. On peut aussi apprendre directement la politique, une fonction qui donne la probabilité de chaque action, en ajustant ses paramètres pour augmenter le gain espéré. L’actor-critic combine les deux : un réseau agit, un autre juge ses actions.</p>
<h4>1. Policy gradient</h4>
<p>Jusqu’ici, on approchait la (q-)valeur avec des paramètres $\theta$ : $v_\theta(s)\approx v^\pi(s)$, $q_\theta(s,a)\approx q^\pi(s,a)$, et la politique était tirée de la valeur (par exemple ε-greedy). Cela ne permet pas d’apprendre <b>explicitement</b> une politique stochastique.</p>
<div class="def"><b>Paramétrer directement la politique</b> : $\pi_\theta(s,a)=\mathbb P[a\mid s,\theta]$, la probabilité de jouer $a$ en $s$ selon les paramètres $\theta$ (par exemple les poids d’un réseau).<br>
<b>Actions continues</b> : on pourrait construire la politique par $\pi_{k+1}(s)=\arg\max_aq_k(s,a)$, mais l’argmax sur un continuum d’actions est un problème d’optimisation à chaque pas. On prend plutôt une classe de politiques $\pi(s,u)$ paramétrées par $u\in\mathbb R^m$ (par exemple un réseau profond), avec pour objectif
$$q(s,u)=\mathbb E\big[R_1+\gamma R_2+\gamma^2R_3+\dots\mid\pi(s,u)\big],$$
optimisé par gradient stochastique : $u^*=\arg\max_uq(s,u)$ (le slide dit « descente » : c’est une montée de gradient sur $q$, ou une descente sur $-q$). Le gradient de la politique demande généralement une estimation de la q-valeur de la politique courante.</div>
<p><b>Pourquoi une politique stochastique</b> (exemple classique, hors slides) : à pierre-feuille-ciseaux contre un adversaire qui s’adapte, toute politique déterministe est exploitée ; la meilleure joue chaque coup avec probabilité 1/3. Une politique paramétrée $\pi_\theta$ peut la représenter directement.</p>
<h4>2. Actor-critic en deep RL</h4>
<div class="thm"><b>Actor-critic</b> (Mnih et al., 2016) : hybride entre méthodes fondées sur la politique et méthodes fondées sur la valeur, avec deux réseaux :
<ul><li>l’<b>acteur</b> = la politique $\pi(s,u)$, qui choisit les actions ;</li>
<li>le <b>critique</b> = la fonction de valeur $q(s,a,w)$, qui les évalue.</li></ul>
Le critique évalue l’acteur avec la différence
$$\delta_t=\underbrace{R_{t+1}+\gamma q(s_{t+1},a,w)}_{\text{récompense reçue}}-\underbrace{q(s_t,a,w)}_{\text{récompense prédite}}.$$
$\delta_t>0$ : l’action doit être encouragée ; $\delta_t<0$ : découragée. Le gradient se propage du critique vers l’acteur.</div>
<p><b>Savoir-faire</b> : prenons $R_{t+1}=1$, $\gamma=0{,}9$, $q(s_{t+1},a,w)=2$, $q(s_t,a,w)=3$. $\delta_t=1+0{,}9\times2-3=-0{,}2<0$ : l’action a rapporté un peu moins que prévu, l’acteur diminue sa probabilité. Avec $R_{t+1}=2$ : $\delta_t=0{,}8>0$, il l’augmente.</p>
<p>Cadre très général, utilisable avec toute représentation de l’acteur et du critique ; en deep learning, $\delta_t$ modifie les poids des réseaux.</p>
<div class="def"><b>A2C</b> (<i>Advantage Actor-Critic</i>) et <b>A3C</b> (<i>Asynchronous Advantage Actor-Critic</i>) :
<ul><li>policy gradient on-policy <b>sans experience replay</b> (pas de mémoire de transitions à maintenir) ;</li>
<li>plusieurs agents s’exécutent en parallèle et vivent des parties différentes de l’environnement, ce qui décorrèle les données ;</li>
<li>les acteurs-apprenants sont entraînés de façon asynchrone (A3C).</li></ul></div>
<h4>Pièges</h4>
<ul><li>Le cours note le critique $q(s_{t+1},a,w)$ et $q(s_t,a,w)$ avec la même lettre $a$ ; il s’agit de l’action jouée à chaque instant. La version de RL2 (slide 49) utilise $v(s_{t+1})-v(s_t)$.</li>
<li>Policy gradient on-policy : les données doivent venir de la politique courante, d’où l’absence de replay dans A2C/A3C (contrairement au DQN, off-policy).</li>
<li>$\delta_t<0$ ne veut pas dire que la récompense était négative, seulement qu’elle était inférieure à la prédiction.</li></ul>
<p class="muted">Pratique (slide 65) : finir la section 2 du TP (q-learning approché) et avancer autant que possible dans la section 3 (deep q-learning). Références : Sutton et Barto ; Kaelbling, Littman et Moore 1996 ; Mnih et al. 2013 et 2015 ; Silver et al. 2017 ; cours Berkeley CS 188 et Stanford CS 234 ; gym ; DeepTraffic du MIT ; T. Kulkarni, Deep Q Learning in Tensorflow for ATARI.</p>
<div class="def"><b>À retenir</b><ul>
<li>Policy gradient : paramétrer $\pi_\theta(s,a)=\mathbb P[a\mid s,\theta]$ ; politiques stochastiques et actions continues.</li>
<li>Objectif : maximiser $\mathbb E[R_1+\gamma R_2+\dots]$ par gradient stochastique ; il faut une estimation de $q$.</li>
<li>Actor-critic : acteur = politique, critique = valeur, $\delta_t>0$ encourager, $<0$ décourager.</li>
<li>A2C/A3C : on-policy, sans replay, agents parallèles asynchrones.</li></ul></div>`,
      },
    ],

    cards: [
      ['rl-mdp', 'schema', R`Boucle agent / environnement en RL ?`, R`L’agent choisit $a_t$ dans l’état $s_t$, l’environnement renvoie $s_{t+1}$ et $r_{t+1}$ ; objectif : maximiser la récompense cumulée.`],
      ['rl-mdp', 'markov', R`Propriété de Markov ?`, R`La loi de l’état suivant ne dépend que de l’état (et de l’action) présents : sachant le présent, futur et passé sont indépendants.`],
      ['rl-mdp', 'mdp', R`Définition d’un MDP ?`, R`Quintuplet $\{S,A,\mathcal T,T,R\}$ : états, actions, transitions, $T(s,a,s')=\mathbb P(s'|s,a)$, récompense $R(s,a,s')$.`],
      ['rl-mdp', 'absorbant', R`État absorbant ?`, R`$T(s,a,s)=1$ pour toute action $a$ : on n’en sort plus (ex. Overheated).`],
      ['rl-mdp', 'politique', R`Politique déterministe, stochastique, stationnaire ?`, R`Déterministe $\pi(s)=a$ ; stochastique $\pi(a|s)=\mathbb P[A_t=a|S_t=s]$ ; stationnaire si la règle ne dépend pas de $t$.`],
      ['rl-mdp', 'episodique', R`Tâche épisodique vs continue ?`, R`Épisodique : un état terminal, on repart de $s_0$. Continue : jamais de fin.`],
      ['rl-return', 'Gt', R`Retour actualisé et sa borne ?`, R`$G_t=\sum_{i\ge0}\gamma^iR_{t+i+1}$, $\gamma\in[0,1[$, et $\mathbb E[G_t]\le R_{\max}/(1-\gamma)$.`],
      ['rl-return', 'gamma', R`Effet de $\gamma$ ?`, R`$\gamma\to0$ : agent myope (immédiat) ; $\gamma\to1$ : agent prévoyant (toutes les récompenses comptent).`],
      ['rl-return', 'v-q', R`Définitions de $v_\pi(s)$ et $q_\pi(s,a)$ ?`, R`$v_\pi(s)=\mathbb E_\pi[G_t|S_t=s]$ ; $q_\pi(s,a)=\mathbb E_\pi[G_t|S_t=s,A_t=a]$.`],
      ['rl-return', 'eval-opt', R`Évaluation vs optimisation d’une politique ?`, R`Évaluation : calculer $v_\pi$ pour une $\pi$ donnée. Optimisation : trouver $\pi^*$ (via $q^*$).`],
      ['rl-bellman', 'eval', R`Équation de Bellman pour évaluer $\pi$ ?`, R`$v_\pi(s)=\sum_a\pi(a,s)\sum_{s'}T(s,a,s')[R(s,a,s')+\gamma v_\pi(s')]$.`],
      ['rl-bellman', 'opt-v', R`Équation d’optimalité de Bellman pour $v^*$ ?`, R`$v^*(s)=\max_a\sum_{s'}T(s,a,s')[R(s,a,s')+\gamma v^*(s')]$.`],
      ['rl-bellman', 'opt-q', R`Équation d’optimalité de Bellman pour $q^*$ ?`, R`$q^*(s,a)=\sum_{s'}T(s,a,s')[R(s,a,s')+\gamma\max_{a'}q^*(s',a')]$.`],
      ['rl-bellman', 'v-q', R`Lien entre $v^*$ et $q^*$ ?`, R`$v^*(s)=\max_aq^*(s,a)$ et $q^*(s,a)=\sum_{s'}T[R+\gamma v^*(s')]$.`],
      ['rl-bellman', 'matrice', R`Résolution directe pour un MDP fini et son coût ?`, R`$V^\pi=(I-\gamma T^\pi)^{-1}R^\pi$, en $O(n^3)$ : seulement pour de petits MDP.`],
      ['rl-bellman', 'lp', R`Formulation en programmation linéaire ?`, R`Minimiser $\sum_sv(s)$ sous la contrainte $v\ge\mathcal Lv$ : la solution est $v^*$ (mais c’est lent).`],
      ['rl-vi', 'algo', R`Value iteration ?`, R`$v_{k+1}(s)\leftarrow\max_a\sum_{s'}T(s,a,s')[R+\gamma v_k(s')]$ jusqu’à stabilité ; coût $O(S^2A)$ par itération.`],
      ['rl-vi', 'banach', R`Pourquoi value iteration converge-t-elle ?`, R`L’opérateur de Bellman est $\gamma$-contractant pour $\|\cdot\|_\infty$ ; par le théorème du point fixe de Banach, l’itération converge vers l’unique point fixe $v^*$ depuis tout $v_0$.`],
      ['rl-vi', 'contraction', R`Définition d’une contraction ?`, R`$\exists\alpha\in[0,1[$ : $d(T(x),T(y))\le\alpha\,d(x,y)$ pour tous $x,y$.`],
      ['rl-vi', 'vitesse', R`Erreur de value iteration après $K$ itérations ?`, R`$\|v_K-v^*\|_\infty\le\gamma^K\frac{2R_{\max}}{1-\gamma}$ ; il faut $K\approx\log\frac{2R_{\max}}{\epsilon(1-\gamma)}/\log\frac1\gamma$, qui explose si $\gamma\to1$.`],
      ['rl-vi', 'arret', R`Critère d’arrêt de value iteration et garantie ?`, R`Si $\|v_{k+1}-v_k\|_\infty<\epsilon\frac{1-\gamma}\gamma$, alors $\|v_{k+1}-v^*\|_\infty<\epsilon$.`],
      ['rl-vi', 'politique', R`Qualité de la politique gloutonne tirée de $v_k$ ?`, R`Si $\|v_k-v^*\|<\epsilon$, alors $\|v_{\pi_k}-v^*\|<\frac{2\gamma}{1-\gamma}\epsilon$.`],
      ['rl-pi', 'algo', R`Les deux étapes de policy iteration ?`, R`Évaluation : résoudre $v^{\pi_k}$ (Bellman sans max). Amélioration : $\pi_{k+1}(s)=\arg\max_a\sum_{s'}T[R+\gamma v^{\pi_k}(s')]$. Arrêt quand la politique ne change plus.`],
      ['rl-pi', 'theoreme', R`Théorème d’amélioration de politique ?`, R`Si $q_\pi(s,\pi'(s))\ge v_\pi(s)$ pour tout $s$, alors $v_{\pi'}\ge v_\pi$ partout.`],
      ['rl-pi', 'vi-vs-pi', R`Value iteration vs policy iteration ?`, R`VI : itérations bon marché, beaucoup d’itérations. PI : chaque itération demande une évaluation complète (coûteuse) mais converge en peu d’itérations, la politique se stabilisant avant les valeurs.`],
      ['rl-model', 'rl-mdp', R`Différence fondamentale entre RL et MDP ?`, R`En RL, $T$ et $R$ sont inconnus : on ne peut pas appliquer Bellman directement.`],
      ['rl-model', 'based-free', R`Model-based vs model-free ?`, R`Model-based : estimer $\hat T,\hat R$ puis résoudre le MDP. Model-free : apprendre $v$ ou $q$ directement depuis l’expérience.`],
      ['rl-model', 'age', R`Analogie de l’âge moyen ?`, R`Model-based : estimer $\hat P(a)=n(a)/N$ puis $\sum\hat P(a)a$. Model-free : $\frac1N\sum a_i$ directement.`],
      ['rl-mc', 'on-off', R`On-policy vs off-policy ?`, R`On-policy : apprendre sur $\pi$ avec l’expérience de $\pi$ (MC, TD, SARSA). Off-policy : avec l’expérience d’une autre politique (q-learning).`],
      ['rl-mc', 'mc', R`Principe de Monte-Carlo en RL ?`, R`Simuler des épisodes avec $\pi$ et estimer $v_\pi(s)$ par la moyenne des retours observés après $s$.`],
      ['rl-mc', 'incr', R`Mise à jour Monte-Carlo incrémentale ?`, R`$v(s)\leftarrow v(s)+\alpha(G_t-v(s))$ (avec $\alpha=1/n$ : moyenne exacte).`],
      ['rl-mc', 'first', R`First-visit vs every-visit ?`, R`First-visit : seul le premier passage par $s$ dans l’épisode compte, estimateur sans biais. Every-visit : chaque passage, erreurs dépendantes, biais.`],
      ['rl-td', 'td0', R`Mise à jour TD(0) ?`, R`$v(s)\leftarrow v(s)+\alpha[r+\gamma v(s')-v(s)]$ ; $r+\gamma v(s')$ = cible TD, l’écart $\delta$ = erreur TD.`],
      ['rl-td', 'bootstrap', R`Pourquoi dit-on que TD « bootstrap » ?`, R`Il met à jour une estimation à partir d’une autre estimation ($v(s')$), sans attendre le retour réel.`],
      ['rl-td', 'td-mc', R`Avantages de TD sur Monte-Carlo ?`, R`Apprend après chaque pas, sans attendre la fin ; marche sur des séquences incomplètes et des tâches continues ; exploite la propriété de Markov.`],
      ['rl-q', 'pourquoi-q', R`Pourquoi apprendre $q(s,a)$ plutôt que $v(s)$ ?`, R`Avec $v$ seul, il faut un modèle pour choisir l’action ; avec $q$, $\pi^*(s)=\arg\max_aq(s,a)$ directement.`],
      ['rl-q', 'sarsa', R`Mise à jour SARSA ?`, R`$q(s,a)\leftarrow q(s,a)+\alpha[r+\gamma q(s',a')-q(s,a)]$, avec $a'$ l’action réellement choisie par la politique (on-policy).`],
      ['rl-q', 'qlearning', R`Mise à jour du q-learning ?`, R`$q(s,a)\leftarrow q(s,a)+\alpha[r+\gamma\max_{a'}q(s',a')-q(s,a)]$ (off-policy).`],
      ['rl-q', 'conv', R`Conditions de convergence du q-learning ?`, R`$S,A$ finis ; chaque $(s,a)$ visité infiniment souvent ; $\sum\alpha_k=\infty$, $\sum\alpha_k^2<\infty$ ; $\gamma<1$ (ou état absorbant de récompense nulle).`],
      ['rl-q', 'actor', R`Architecture actor-critic ?`, R`Un acteur (politique) choisit les actions, un critique (valeur) les juge via $\delta_t=R_{t+1}+\gamma v(s_{t+1})-v(s_t)$ : $>0$ encourager, $<0$ décourager.`],
      ['rl-explore', 'egreedy', R`Probabilités d’ε-greedy avec $m$ actions ?`, R`$\frac\epsilon m+1-\epsilon$ pour l’action gloutonne, $\frac\epsilon m$ pour chacune des autres.`],
      ['rl-explore', 'softmax', R`Politique softmax et rôle de la température ?`, R`$p(a)\propto e^{\beta q(a)}$, $\tau=1/\beta$ : $\tau\to0$ glouton, $\tau\to\infty$ uniforme.`],
      ['rl-explore', 'variance', R`Quand le glouton bat-il ε-greedy ?`, R`Quand la variance des récompenses est nulle : il essaie chaque action une fois et trouve directement la meilleure.`],
      ['rl-approx', 'pourquoi', R`Pourquoi approcher la fonction de valeur ?`, R`Trop d’états pour une table : impossible de tout visiter et stocker ; il faut généraliser d’états vus à des états semblables.`],
      ['rl-approx', 'maj', R`Mise à jour du q-learning approché linéaire ?`, R`$\Delta=r+\gamma\max_{a'}q(s',a')-q(s,a)$, puis $w_i\leftarrow w_i+\alpha\Delta f_i(s,a)$.`],
      ['rl-approx', 'regression', R`Lien entre q-learning approché et régression linéaire ?`, R`C’est une descente de gradient sur (cible − prédiction)², avec cible $r+\gamma\max q(s',\cdot)$ et prédiction $q(s,a)$.`],
      ['rl-approx', 'non-iid', R`En quoi les données du RL diffèrent-elles du supervisé ?`, R`Non stationnaires (la politique change) et non i.i.d. ($S_t$ et $S_{t+1}$ corrélés).`],
      ['rl-dqn', 'perte', R`Perte du deep q-learning ?`, R`$L(w)=\mathbb E[(r+\gamma\max_{a'}q(s',a',w)-q(s,a,w))^2]$.`],
      ['rl-dqn', 'instable', R`Trois sources d’instabilité du deep q-learning ?`, R`Données séquentielles corrélées et cible qui dépend de $q$ ; politique qui change brutalement ; échelle des récompenses inconnue (gradients instables).`],
      ['rl-dqn', 'replay', R`Experience replay ?`, R`Stocker les transitions dans une mémoire et entraîner sur des mini-lots tirés au hasard : casse les corrélations et réutilise l’expérience.`],
      ['rl-dqn', 'cible', R`Réseau cible gelé ?`, R`La cible est calculée avec des poids $w^A$ figés pendant une période, le réseau en ligne $w^B$ apprend ; puis $w^A\leftarrow w^B$. Évite les oscillations.`],
      ['rl-dqn', 'double', R`Double DQN ?`, R`Le réseau en ligne choisit l’action, le réseau cible l’évalue : $r+\gamma q(s',\arg\max_aq(s',a,w^B),w^A)$. Corrige la surestimation due au max.`],
      ['rl-dqn', 'dueling', R`Architecture dueling ?`, R`$q(s,a)=v(s)+A(s,a)-\max_{a'}A(s,a')$ avec l’avantage $A=q-v$ : réduit la variance.`],
      ['rl-dqn', 'prio', R`Replay priorisé ?`, R`Tirer les transitions proportionnellement à leur priorité, par exemple leur erreur TD : apprendre là où l’on se trompe le plus.`],
      ['rl-pg', 'pg', R`Pourquoi les méthodes de policy gradient ?`, R`Paramétrer directement $\pi_\theta(a|s)$ permet des politiques stochastiques et des actions continues, impossibles avec un simple ε-greedy sur $q$.`],
      ['rl-pg', 'a3c', R`A2C / A3C ?`, R`Advantage Actor-Critic (asynchrone pour A3C) : policy gradient on-policy sans replay buffer, plusieurs agents en parallèle entraînés de façon asynchrone.`],
      // Cartes ajoutées
      ['rl-mdp', 'chaine', R`Chaîne de Markov météo : Soleil → Soleil 0,4, Pluie → Soleil 0,7. Soleil aujourd’hui : probabilité de pluie dans deux jours ?`, R`Deux chemins : $0{,}4\times0{,}6+0{,}6\times0{,}3=0{,}42$ (chaque ligne somme à 1).`],
      ['rl-mdp', 'voiture', R`MDP de la voiture : transitions et récompenses ?`, R`Cool, Slow → Cool (+1) ; Cool, Fast → Cool ou Warm à 1/2 (+2) ; Warm, Slow → Cool ou Warm à 1/2 (+1) ; Warm, Fast → Overheated (−10), absorbant.`],
      ['rl-mdp', 'observable', R`Pourquoi le DQN prend-il les 4 dernières images d’Atari en entrée ?`, R`Une seule image ne donne pas la vitesse ni la direction de la balle : l’état serait incomplet et la propriété de Markov ne tiendrait pas.`],
      ['rl-return', 'recurrence', R`Récurrence du retour et exemple ?`, R`$G_t=R_{t+1}+\gamma G_{t+1}$. Avec $\gamma=0{,}9$ et $(1;0;0;10)$ : $G=10,\ 9,\ 8{,}1,\ 8{,}29$ en remontant.`],
      ['rl-return', 'cartpole', R`Cart-pole continu ($R=-1$ à la chute) : pourquoi faut-il $\gamma<1$ ?`, R`Sans actualisation, toute politique a un retour de $-1$. Avec $\gamma<1$, chuter au pas $T$ donne $-\gamma^{T-1}$ : tomber plus tard coûte moins.`],
      ['rl-return', 'proba-totales', R`Lien entre $v_\pi$ et $q_\pi$ (probabilités totales) ?`, R`$v_\pi(s)=\sum_a\pi(a|s)\,q_\pi(s,a)$ : la valeur est la moyenne des q-valeurs pondérée par la politique.`],
      ['rl-bellman', 'vstar-voiture', R`$v^*$, $q^*$ et $\pi^*$ de la voiture pour $\gamma=0{,}5$ ?`, R`$v^*=(3{,}5;\ 2{,}5;\ 0)$ ; $q^*(c)$ : Slow 2,75, Fast 3,5 ; $q^*(w)$ : Slow 2,5, Fast −10 ; $\pi^*$ = Fast en Cool, Slow en Warm.`],
      ['rl-bellman', 'lineaire', R`Pourquoi $v_\pi$ se calcule-t-il par un système linéaire et pas $v^*$ ?`, R`L’équation d’évaluation n’a pas de max (linéaire en $v_\pi$) ; celle d’optimalité contient un max (non linéaire) : on itère (value ou policy iteration).`],
      ['rl-vi', 'contraction-preuve', R`Les étapes de la preuve que $\mathcal L$ est $\gamma$-contractant ?`, R`$|\max f-\max g|\le\max|f-g|$ ; les $R$ s’annulent ; majorer $|u(s')-v(s')|$ par $\|u-v\|_\infty$ ; $\sum_{s'}T=1$ ; d’où $\|\mathcal Lu-\mathcal Lv\|_\infty\le\gamma\|u-v\|_\infty$.`],
      ['rl-vi', 'exemple', R`Value iteration sur la voiture ($\gamma=0{,}5$, $v_0=0$) : $v_1$, $v_2$ et la limite ?`, R`$v_1=(2;1;0)$, $v_2=(2{,}75;1{,}75;0)$, limite $(3{,}5;2{,}5;0)$ ; l’erreur est divisée par $\gamma=2$ à chaque itération.`],
      ['rl-pi', 'exemple', R`Policy iteration sur la voiture ($\gamma=0{,}5$, $\pi_0$ = toujours Slow) ?`, R`$v^{\pi_0}=(2;2)$ ; amélioration : Fast en Cool (3 contre 2), Slow en Warm (2 contre −10) ; $v^{\pi_1}=(3{,}5;2{,}5)=v^*$ ; $\pi_2=\pi_1$.`],
      ['rl-pi', 'egalite', R`Policy iteration : que faire en cas d’égalité dans l’argmax ?`, R`Garder l’action actuelle ; sinon la politique peut osciller entre deux actions équivalentes et le critère $\pi_{k+1}=\pi_k$ n’est jamais atteint.`],
      ['rl-pi', 'async', R`Programmation dynamique asynchrone ?`, R`Mises à jour en place, sans balayer systématiquement tous les états, ordonnées pour propager l’information efficacement et concentrées sur les états utiles.`],
      ['rl-model', 'compter', R`Comment estime-t-on $\hat T$ et $\hat R$ à partir d’épisodes ?`, R`$\hat T(s,a,s')$ = part des passages par $(s,a)$ qui arrivent en $s'$ ; $\hat R(s,a,s')$ = moyenne des récompenses observées pour cette transition. Ex. du cours : $\hat T(C,\text{east},D)=3/4$.`],
      ['rl-model', 'bilan', R`Avantages et inconvénients du model-based ?`, R`Pour : modèle compact, appris par supervisé, incertitude exploitable. Contre : deux sources d’erreur (modèle puis politique) ; quand le modèle est-il assez bon ?`],
      ['rl-mc', 'episodes', R`Épisodes du cours ($\gamma=1$) : estimations Monte-Carlo de $v(B)$, $v(C)$, $v(E)$ ?`, R`$v(B)=8$, $v(C)=4$, $v(E)=-2$ ; le modèle estimé donnait $v(B)=v(E)=3$ : MC ignore que B et E passent par C.`],
      ['rl-mc', 'limites', R`Limites de Monte-Carlo en RL ?`, R`Épisodes finis obligatoires ; attendre la fin de l’épisode ; évalue seulement $\pi$ ; exploration difficile ; il faudrait la valeur de chaque action.`],
      ['rl-td', 'td-lambda', R`TD(λ) ?`, R`$v_{k+1}(s)=v_k(s)+\alpha\sum_{m=k}^{N-1}\lambda^{m-k}\delta_m(s)$ : $\lambda=0$ redonne TD(0), $\lambda\to1$ se rapproche de Monte-Carlo.`],
      ['rl-td', 'limite', R`Vers quoi converge TD(0) à politique fixée ?`, R`Vers $v_\pi$, la valeur de la politique suivie ; ce n’est $v^*$ que si $\pi$ est optimale.`],
      ['rl-q', 'qvi', R`q-value iteration et lien avec le q-learning ?`, R`$q_{k+1}(s,a)\leftarrow\sum_{s'}T[R+\gamma\max_{a'}q_k(s',a')]$ ; le q-learning remplace la moyenne pondérée par $T$ (inconnu) par une moyenne glissante sur les échantillons.`],
      ['rl-q', 'terminal', R`Cible du q-learning quand $s'$ est terminal ?`, R`$r$ seul : il n’y a aucune action en $s'$, donc $\max_{a'}q(s',a')=0$ (le code renvoie 0 sans action légale).`],
      ['rl-explore', 'portes', R`L’exemple des deux portes (glouton) ?`, R`Gauche : 0 après un essai ; droite : +1, +3, +2, moyenne 2. Le glouton ne retestera jamais la gauche : il peut manquer la meilleure porte.`],
      ['rl-explore', 'defauts', R`Défauts d’ε-greedy et remèdes ?`, R`Il explore toutes les actions avec la même probabilité, y compris les très mauvaises. Remèdes : diminuer $\epsilon$ au cours du temps, fonction d’exploration (softmax).`],
      ['rl-approx', 'pacman', R`Exemple PacMan du cours : $q$, $\Delta$ et mises à jour ?`, R`$q=4\cdot\frac12-1\cdot1=1$ ; mort, $r=-500$ : $\Delta=-501$ ; $w_{DOT}\leftarrow4-501\alpha\cdot\frac12$, $w_{GST}\leftarrow-1-501\alpha$.`],
      ['rl-approx', 'onehot', R`q-learning approché avec une feature indicatrice par couple $(s,a)$ ?`, R`Un seul poids bouge, de $\alpha\Delta$ : c’est exactement le q-learning tabulaire, sans généralisation.`],
      ['rl-dqn', 'atari', R`Architecture du DQN pour Atari ?`, R`Entrée : 4 dernières images $84\times84$ ; réseau convolutif ; sortie : $q(s,a_i)$ pour les 18 positions du joystick (le max en une passe, comme NFQ).`],
      ['rl-dqn', 'clip', R`Clipping des récompenses : gain et prix ?`, R`Récompenses ramenées dans $[-1,1]$ : q-valeurs bornées, gradients bien conditionnés ; mais +1 et +500 deviennent identiques.`],
      ['rl-pg', 'delta', R`Critique en deep actor-critic ?`, R`$\delta_t=R_{t+1}+\gamma q(s_{t+1},a,w)-q(s_t,a,w)$ = récompense reçue − récompense prédite ; le gradient remonte du critique vers l’acteur.`],
      ['rl-pg', 'continu', R`Pourquoi l’argmax sur $q$ pose-t-il problème pour des actions continues ?`, R`Il faudrait maximiser $q(s,a)$ sur un continuum d’actions à chaque pas ; on paramètre plutôt la politique $\pi(s,u)$ et on optimise $u$ par gradient.`],
      ['rl-pg', 'stochastique', R`Pourquoi vouloir une politique stochastique explicite ?`, R`Certaines situations l’exigent (pierre-feuille-ciseaux : uniforme 1/3) ; une politique tirée de $q$ par ε-greedy ne l’apprend pas explicitement.`],
    ],

    quiz: [
      ['rl-mdp', R`Quel élément NE fait PAS partie d’une chaîne de Markov simple ?`, ['les actions', 'les états', 'les probabilités de transition', 'la propriété de Markov'], 0, R`Une chaîne de Markov n’a ni actions ni récompenses.`],
      ['rl-return', R`$\gamma=0{,}9$, récompense constante 1. Valeur maximale du retour ?`, ['10', '9', '1', '∞'], 0, R`$\sum0{,}9^i=1/(1-0{,}9)=10$.`],
      ['rl-bellman', R`Qu’est-ce qui distingue l’équation d’optimalité de l’équation d’évaluation ?`, [R`un $\max_a$ remplace la moyenne $\sum_a\pi(a,s)$`, 'le facteur γ disparaît', 'la récompense disparaît', 'T est remplacé par R'], 0, R`Optimalité : on prend la meilleure action au lieu de suivre $\pi$.`],
      ['rl-vi', R`Value iteration avec $\gamma=0{,}99$ plutôt que $0{,}5$ :`, ['converge beaucoup plus lentement', 'converge plus vite', 'ne converge plus', 'donne la même vitesse'], 0, R`L’erreur décroît en $\gamma^K$ : $K\propto1/\log(1/\gamma)$ explose quand $\gamma\to1$.`],
      ['rl-pi', R`Policy iteration s’arrête quand :`, ['la politique ne change plus', 'les valeurs valent 0', 'γ vaut 1', 'toutes les actions ont été essayées'], 0, R`$\pi_{k+1}=\pi_k$.`],
      ['rl-model', R`Un robot construit des tables de fréquences de transitions puis lance value iteration. C’est :`, ['du RL model-based', 'du RL model-free', 'du q-learning', 'du Monte-Carlo'], 0, R`Il estime $\hat T$ et $\hat R$ puis planifie.`],
      ['rl-mc', R`Monte-Carlo ne peut pas être utilisé directement sur :`, ['une tâche continue sans fin', 'un jeu d’échecs', 'un labyrinthe', 'un épisode de cart-pole'], 0, R`Il faut des épisodes finis pour observer les retours.`],
      ['rl-td', R`TD(0) met à jour $v(s)$ vers :`, [R`$r+\gamma v(s')$`, R`$G_t$ observé en fin d’épisode`, R`$\max_aq(s,a)$`, R`$R_{\max}/(1-\gamma)$`], 0, R`La cible TD, sur une seule transition.`],
      ['rl-q', R`Pourquoi le q-learning est-il off-policy ?`, [R`sa cible utilise $\max_{a'}q(s',a')$, pas l’action réellement jouée`, 'il n’utilise pas de politique', 'il suit toujours la politique optimale', 'il n’a pas de taux d’apprentissage'], 0, R`Il apprend la valeur de la politique gloutonne quelle que soit la politique d’exploration.`],
      ['rl-q', R`Quelle suite de taux respecte $\sum\alpha_k=\infty$ et $\sum\alpha_k^2<\infty$ ?`, [R`$\alpha_k=1/k$`, R`$\alpha_k=1/k^2$`, R`$\alpha_k=0{,}1$`, R`$\alpha_k=1/\sqrt k$`], 0, R`Avec $1/k$ : $\sum1/k$ diverge et $\sum1/k^2$ converge. $1/k^2$ : la somme converge, on cesse d’apprendre trop tôt. $0{,}1$ : $\sum\alpha^2$ diverge, le bruit ne s’éteint pas. $1/\sqrt k$ : les carrés donnent $\sum1/k$, qui diverge.`],
      ['rl-explore', R`ε-greedy, $\epsilon=0{,}2$, 4 actions. Probabilité de l’action gloutonne ?`, ['0,85', '0,8', '0,2', '0,05'], 0, R`$0{,}2/4+0{,}8=0{,}85$.`],
      ['rl-explore', R`Softmax à très haute température :`, ['choisit presque uniformément', 'est glouton', 'choisit toujours la pire action', 'ne dépend que de γ'], 0, R`$\tau\to\infty$ : toutes les actions deviennent équiprobables.`],
      ['rl-dqn', R`Quelle astuce vise d’abord à casser la corrélation entre échantillons successifs ?`, ['experience replay', 'clipping des récompenses', 'dueling', 'noisy networks'], 0, R`Mini-lots tirés au hasard dans la mémoire.`],
      ['rl-dqn', R`Contre quel défaut le double DQN est-il conçu ?`, ['la surestimation des q-valeurs due au max', 'la corrélation des données', 'l’explosion des gradients', 'le manque d’exploration'], 0, R`Découpler choix et évaluation de l’action.`],
      ['rl-pg', R`Dans un actor-critic, $\delta_t<0$ signifie :`, ['l’action a fait moins bien que prévu : la décourager', 'l’action est optimale', 'il faut augmenter γ', 'le critique doit être réinitialisé'], 0, R`Récompense reçue < récompense prédite.`],
      // QCM ajoutés (toujours à la fin du tableau)
      ['rl-mdp', R`Météo du cours : Soleil → Soleil 0,4, Soleil → Pluie 0,6, Pluie → Soleil 0,7. Il fait soleil aujourd’hui. Probabilité qu’il fasse soleil dans deux jours ?`, ['0,58', '0,42', '0,4', '0,16'], 0, R`Chemins $S\to S\to S$ : $0{,}4\times0{,}4=0{,}16$, et $S\to P\to S$ : $0{,}6\times0{,}7=0{,}42$. Total $0{,}58$ (le complément de la probabilité de pluie, 0,42). 0,16 oublie le second chemin ; 0,4 est la probabilité à un jour.`],
      ['rl-mdp', R`Breakout, avec un état = une seule image. Qu’est-ce qui met en défaut la propriété de Markov, et comment le DQN y remédie-t-il ?`, ['une image ne donne pas la direction de la balle ; on empile les 4 dernières images', 'les récompenses sont rares ; on les écrête', 'les actions sont continues ; on les discrétise', 'il y a trop d’états ; on utilise une table'], 0, R`La position seule ne dit pas où va la balle : l’avenir dépend aussi du passé. Avec 4 images, l’état contient la vitesse et redevient (approximativement) markovien.`],
      ['rl-mdp', R`Voiture du cours : depuis Cool, on joue Fast deux fois de suite. Récompense totale espérée (sans actualisation) ?`, ['−2', '4', '−8', '2'], 0, R`Premier pas : +2, puis Cool ou Warm à 1/2. Second Fast : +2 depuis Cool, −10 depuis Warm, soit $0{,}5\times2+0{,}5\times(-10)=-4$. Total $2-4=-2$. 4 oublie la surchauffe ; 2 ne compte que le premier pas.`],
      ['rl-return', R`$\gamma=0{,}5$ et récompenses $R_{t+1},R_{t+2},R_{t+3}=(0;\ 0;\ 8)$ puis 0. Que vaut $G_t$ ?`, ['2', '4', '8', '1'], 0, R`La récompense 8 arrive au troisième pas, avec le poids $\gamma^2=0{,}25$ : $G_t=0{,}25\times8=2$. 4 utilise $\gamma^1$ (erreur d’indice), 1 utilise $\gamma^3$.`],
      ['rl-return', R`Cart-pole continu ($R_t=-1$ à la chute, 0 sinon), sans actualisation ($\gamma=1$). Retour d’une politique qui tient 10 pas et d’une qui en tient 1000 ?`, ['−1 dans les deux cas : la somme ne les distingue pas', '−10 et −1000', '10 et 1000', '0 dans les deux cas'], 0, R`Une seule récompense non nulle, −1, quelle que soit la durée. Avec $\gamma<1$, elle est pondérée par $\gamma^{T-1}$ et tomber tard devient préférable.`],
      ['rl-return', R`$\pi(a_1|s)=0{,}7$, $q_\pi(s,a_1)=4$ ; $\pi(a_2|s)=0{,}3$, $q_\pi(s,a_2)=1$. Que vaut $v_\pi(s)$ ?`, ['3,1', '4', '2,5', '1,9'], 0, R`Probabilités totales : $v_\pi(s)=\sum_a\pi(a|s)q_\pi(s,a)=0{,}7\times4+0{,}3\times1=3{,}1$. 4 est le max (ce serait $v^*$ si $q_\pi=q^*$), 2,5 la moyenne non pondérée.`],
      ['rl-bellman', R`Voiture, $\gamma=0{,}5$, $v^*=(3{,}5;\ 2{,}5;\ 0)$. Que vaut $q^*(\text{Cool},\text{Slow})$ ?`, ['2,75', '3,5', '1', '2,5'], 0, R`Slow depuis Cool reste en Cool avec +1 : $q^*=1+0{,}5\times3{,}5=2{,}75$. 3,5 est $v^*(c)=q^*(c,\text{Fast})$ ; 1 oublie la valeur du successeur.`],
      ['rl-bellman', R`Pourquoi peut-on obtenir $v_\pi$ par $(I-\gamma T^\pi)^{-1}R^\pi$ mais pas $v^*$ par une formule analogue ?`, ['l’équation d’optimalité contient un max, elle n’est pas linéaire', 'v* n’existe pas toujours', 'T est inconnue pour v*', 'il faudrait γ = 1'], 0, R`Pour $\pi$ fixée, l’équation est linéaire en $v_\pi$. Le max rend l’équation de $v^*$ non linéaire : on la résout par itération (value, policy iteration) ou par programmation linéaire.`],
      ['rl-bellman', R`On connaît $q^*$ mais ni $T$ ni $R$. Peut-on agir optimalement ?`, [R`oui : $\pi^*(s)=\arg\max_aq^*(s,a)$`, R`non : il faut $T$ pour un pas d’anticipation`, R`seulement si $\gamma=0$`, 'seulement avec une politique stochastique'], 0, R`$q^*$ contient déjà l’espérance sur $T$ et $R$. C’est avec $v^*$ seul qu’il faudrait le modèle pour calculer $\sum_{s'}T[R+\gamma v^*(s')]$.`],
      ['rl-vi', R`Voiture, $\gamma=0{,}5$, $v_2=(2{,}75;\ 1{,}75;\ 0)$. Que vaut $v_3(c)$ ?`, ['3,125', '2,375', '2,75', '3,5'], 0, R`Slow : $1+0{,}5\times2{,}75=2{,}375$. Fast : $0{,}5(2+1{,}375)+0{,}5(2+0{,}875)=1{,}6875+1{,}4375=3{,}125$. Le max est 3,125. 2,375 est la valeur de Slow, 3,5 la limite.`],
      ['rl-vi', R`Voiture, $\gamma=0{,}5$ : l’erreur $v^*(c)-v_k(c)$ vaut 1,5, puis 0,75, puis 0,375. D’où vient ce facteur 1/2 ?`, ['de la contraction de facteur γ = 0,5', 'des probabilités de transition 0,5', 'du nombre d’actions (2)', 'du hasard de l’initialisation'], 0, R`Le même calcul avec $\gamma=0{,}8$ donne un facteur 0,8 à chaque itération, alors que les probabilités restent 0,5 : c’est bien $\gamma$, le facteur de contraction de $\mathcal L$.`],
      ['rl-vi', R`$\gamma=0{,}9$, $\epsilon=0{,}01$. Quel seuil sur $\|v_{k+1}-v_k\|_\infty$ garantit $\|v_{k+1}-v^*\|_\infty<0{,}01$ ?`, ['environ 0,0011', '0,01', '0,09', '0,1'], 0, R`Seuil $\epsilon\frac{1-\gamma}\gamma=0{,}01\times0{,}1/0{,}9\approx0{,}0011$. S’arrêter à 0,01 laisserait une erreur jusqu’à 0,09.`],
      ['rl-pi', R`Policy iteration, voiture, $\gamma=0{,}5$, $v^{\pi_0}=(2;\ 2)$. Valeur de l’action Slow en Warm lors de l’amélioration ?`, ['2', '3', '1,5', '−10'], 0, R`$0{,}5(1+0{,}5\times2)+0{,}5(1+0{,}5\times2)=1+1=2$. Le slide 85 écrit 3, ce qui est une erreur de calcul (à confirmer avec le Prof. Siebert) ; la décision Slow est la même.`],
      ['rl-pi', R`Pourquoi policy iteration s’arrête-t-elle en un nombre fini de tours sur un MDP fini ?`, ['chaque tour améliore strictement tant que la politique change, et il y a un nombre fini de politiques déterministes', 'parce que γ < 1', 'parce que l’évaluation est approchée', 'elle ne s’arrête jamais exactement'], 0, R`Par le théorème d’amélioration, aucune politique ne peut revenir ; avec $|A|^{|S|}$ politiques déterministes, la suite s’arrête.`],
      ['rl-pi', R`Sur la voiture ($\gamma=0{,}5$), policy iteration trouve $v^*$ en deux tours. Value iteration, elle :`, ['s’en approche géométriquement sans l’atteindre exactement', 'l’atteint en deux itérations aussi', 'diverge', 'trouve une autre politique'], 0, R`VI : erreur $3\times0{,}5^k$, jamais nulle. PI résout exactement $v^{\pi}$ à chaque tour, donc $v^{\pi_1}=v^*$ exactement.`],
      ['rl-model', R`Épisodes du cours : (C, east) mène 3 fois en D et 1 fois en A. Avec $\gamma=1$, $\hat R=-1$ par pas, $+10$ en D et $-10$ en A, que vaut $v(C)$ sous le modèle estimé ?`, ['4', '9', '−1', '−2'], 0, R`$0{,}75(-1+10)+0{,}25(-1-10)=6{,}75-2{,}75=4$. 9 ignore le risque d’aller en A.`],
      ['rl-model', R`Même expérience, politique fixe (east en B et C, north en E). Que vaut l’estimation $\hat T(C,\text{north},A)$ ?`, ['aucune : l’action north n’a jamais été jouée en C', '0,25', '0', '1'], 0, R`Le modèle n’existe que pour les couples $(s,a)$ observés. Écrire 0 serait affirmer une transition impossible sans aucune donnée.`],
      ['rl-mc', R`Épisodes du cours ($\gamma=1$) : E apparaît dans deux épisodes, de retours 8 et −12. Estimation Monte-Carlo de $v(E)$ ?`, ['−2', '3', '8', '−12'], 0, R`Moyenne $(8-12)/2=-2$. Le modèle donnait 3 : MC n’exploite pas le fait que E mène en C, dont la valeur est connue par d’autres épisodes.`],
      ['rl-mc', R`$\hat v_3(s)=2$ après trois retours. Le quatrième retour vaut 6. Nouvelle moyenne exacte ?`, ['3', '4', '6', '2,5'], 0, R`$\hat v_4=\hat v_3+\frac14(6-2)=3$. 4 utilise $\alpha=1/2$ ; 6 remplace la moyenne par le dernier retour.`],
      ['rl-mc', R`Un épisode passe deux fois par A : récompenses 1 (A → A) puis 2 (A → fin), $\gamma=1$. Estimation every-visit de $v(A)$ sur cet épisode ?`, ['2,5', '3', '2', '1,5'], 0, R`Retours après chaque passage : 3 et 2, moyenne 2,5. First-visit donnerait 3.`],
      ['rl-td', R`TD(0) : $v(s)=5$, $r=0$, $\gamma=1$, $v(s')=3$. Que fait la mise à jour ?`, ['v(s) baisse', 'v(s) monte', 'v(s) ne change pas', 'cela dépend uniquement de α'], 0, R`$\delta=0+3-5=-2<0$ : on retire $2\alpha$ à $v(s)$. $\alpha$ règle l’ampleur, pas le sens.`],
      ['rl-td', R`Épisodes du cours : B et E mènent tous deux en C. Quelle méthode utilise la valeur de C pour estimer B et E ?`, ['TD, via v(C) dans la cible (comme le model-based)', 'Monte-Carlo first-visit', 'Monte-Carlo every-visit', 'aucune'], 0, R`La cible TD $r+\gamma v(C)$ réutilise ce qui a été appris sur C par tous les épisodes : TD exploite la propriété de Markov, Monte-Carlo moyenne seulement les retours de chaque état.`],
      ['rl-td', R`À politique $\pi$ fixée, TD(0) converge vers :`, [R`$v_\pi$`, R`$v^*$`, R`$q^*$`, R`$R_{\max}/(1-\gamma)$`], 0, R`TD(0) évalue la politique suivie. Le slide 36 parle de « valeurs optimales », ce qui n’est vrai que si $\pi$ est optimale (à confirmer avec le Prof. Siebert).`],
      ['rl-q', R`$q(s,a)=2$, $r=1$, $\gamma=0{,}9$, $\alpha=0{,}5$, $q(s',\cdot)=(4;\ 1)$, et la politique ε-greedy joue en $s'$ l’action de valeur 1. Nouvelle $q(s,a)$ avec SARSA ?`, ['1,95', '3,3', '2', '2,45'], 0, R`SARSA prend l’action jouée : $2+0{,}5(1+0{,}9\times1-2)=1{,}95$. 3,3 est la réponse du q-learning (max = 4).`],
      ['rl-q', R`q-learning, transition vers un état terminal avec $r=10$, $\gamma=0{,}9$. Quelle est la cible ?`, ['10', R`$10/(1-\gamma)=100$`, '0', '9'], 0, R`Aucune action en $s'$ : $\max_{a'}q(s',a')=0$, la cible est $r=10$. $10/(1-\gamma)$ supposerait la récompense répétée indéfiniment.`],
      ['rl-explore', R`ε-greedy, $\epsilon=0{,}1$, 4 actions. Probabilité d’une action non gloutonne précise ?`, ['0,025', '0,1', '0,033', '0,075'], 0, R`$\epsilon/m=0{,}1/4=0{,}025$. 0,033 répartit $\epsilon$ sur 3 actions en oubliant que le tirage aléatoire peut aussi tomber sur l’action gloutonne.`],
      ['rl-explore', R`Portes du cours : gauche 0 (un essai), droite +1, +3, +2. Que fait le glouton ensuite ?`, ['il joue toujours à droite et ne reteste jamais la gauche', 'il alterne les portes', 'il joue à gauche une fois sur deux', 'il choisit au hasard'], 0, R`$V(\text{droite})=2>V(\text{gauche})=0$ et le glouton n’explore pas : un seul essai malchanceux peut condamner une porte.`],
      ['rl-explore', R`Softmax : on multiplie toutes les q-valeurs par 10 sans changer $\beta$. Effet ?`, ['même effet que multiplier β par 10 : choix plus glouton', 'aucun', 'choix plus uniforme', 'les probabilités ne somment plus à 1'], 0, R`$e^{\beta\cdot10q}=e^{(10\beta)q}$ : softmax dépend de l’échelle des q-valeurs, d’où la difficulté à fixer $\tau$.`],
      ['rl-approx', R`Exemple PacMan : $w_{DOT}=4$, $w_{GST}=-1$, point à distance 2, fantôme à distance 1. Que vaut $\hat q(s,\text{NORTH})$ ?`, ['1', '3', '7', '−1'], 0, R`$f_{DOT}=1/2$, $f_{GST}=1$ : $4\times\frac12-1\times1=1$. 7 utilise les distances au lieu de leurs inverses.`],
      ['rl-approx', R`Même exemple, $\Delta=-501$. Quel poids baisse le plus ?`, [R`$w_{GST}$, parce que $f_{GST}=1>f_{DOT}=1/2$`, R`$w_{DOT}$, parce qu’il est plus grand`, 'les deux baissent autant', 'aucun, Δ ne touche que la table'], 0, R`$w_i$ varie de $\alpha\Delta f_i$ : $-501\alpha$ pour le fantôme, $-250{,}5\alpha$ pour le point. On blâme d’abord la feature la plus active.`],
      ['rl-approx', R`Avec une feature indicatrice par couple $(s,a)$, le q-learning approché devient :`, ['le q-learning tabulaire', 'Monte-Carlo', 'value iteration', 'un DQN'], 0, R`Seul le poids du couple visité bouge, de $\alpha\Delta$ : c’est la mise à jour de la table, sans généralisation.`],
      ['rl-approx', R`PacMan MediumClassic : 107 positions, $107^2$ pour les fantômes, $2^2$ pilules, $2^{104}$ cases pleines. Ordre de grandeur du produit ?`, [R`$10^{38}$`, R`$10^{73}$`, R`$10^{6}$`, R`$10^{120}$`], 0, R`$107^3\approx1{,}2\times10^6$, $2^{106}\approx8{,}1\times10^{31}$ : produit $\approx10^{38}$, une borne haute (toutes les combinaisons ne sont pas atteignables). Le slide écrit $|S|\gg107^3$, à ne pas lire $10^{73}$.`],
      ['rl-dqn', R`$r=1$, $\gamma=0{,}99$, $q(s',\cdot,w^A)=(2;\ 3{,}5;\ 1)$, $q(s,a,w^B)=2{,}8$. Cible du DQN ?`, ['4,465', '4,5', '1,665', '3,8'], 0, R`$1+0{,}99\times3{,}5=4{,}465$. 4,5 oublie $\gamma$ ; 1,665 est l’erreur cible − prédiction.`],
      ['rl-dqn', R`Même cas, mais le réseau en ligne donne $q(s',\cdot,w^B)=(2{,}5;\ 1{,}8;\ 3)$. Cible du double DQN ?`, ['1,99', '4,465', '3,97', '3,475'], 0, R`Le réseau en ligne choisit l’action 3, le réseau cible l’évalue : $1+0{,}99\times1=1{,}99$. 3,97 utiliserait $q(s',a_3,w^B)=3$.`],
      ['rl-dqn', R`Tableau du cours (Breakout) : q-learning 3, + cible 10, + replay 241, les deux 317. Quelle astuce apporte le plus ?`, ['experience replay', 'le réseau cible', 'les deux autant', 'aucune'], 0, R`Le replay seul passe de 3 à 241, la cible seule de 3 à 10 ; les deux ensemble font mieux encore (317).`],
      ['rl-dqn', R`Après clipping dans $[-1,1]$, une récompense de +500 et une de +1 :`, ['deviennent identiques (+1)', 'gardent leur rapport 500', 'deviennent 0', 'sont normalisées par leur somme'], 0, R`C’est le prix du clipping : des gradients bien conditionnés, mais l’agent ne distingue plus une petite et une grande récompense.`],
      ['rl-pg', R`Actor-critic : $R_{t+1}=1$, $\gamma=0{,}9$, $q(s_{t+1},a,w)=2$, $q(s_t,a,w)=3$. Que fait l’acteur ?`, ['il décourage l’action (δ = −0,2)', 'il encourage l’action (δ = 0,2)', 'rien (δ = 0)', 'il encourage l’action (δ = 2,8)'], 0, R`$\delta_t=1+0{,}9\times2-3=-0{,}2<0$ : récompense reçue inférieure à la prédiction.`],
      ['rl-pg', R`Commande d’un bras robotique (force continue). Pourquoi préférer une politique paramétrée à un argmax sur $q$ ?`, ['l’argmax sur un continuum d’actions est un problème d’optimisation à chaque pas', 'q n’existe pas pour des actions continues', 'les récompenses sont toujours nulles', 'γ doit valoir 1'], 0, R`Avec 18 actions discrètes, une passe suffit (NFQ). Avec une force réelle, il faudrait optimiser $q(s,\cdot)$ à chaque décision ; $\pi(s,u)$ donne directement l’action.`],
      ['rl-pg', R`Pourquoi A3C peut-il se passer d’experience replay ?`, ['plusieurs agents parallèles vivent des parties différentes de l’environnement, ce qui décorrèle les données', 'il est off-policy', 'il n’utilise pas de réseau de neurones', 'il écrête les récompenses'], 0, R`Le replay sert à décorréler ; ici les agents parallèles le font, et une méthode on-policy ne peut de toute façon pas réutiliser des données d’anciennes politiques.`],
    ],

    gens: {
      'rl-mdp': [
        () => {
          const pss = pick([0.2, 0.4, 0.5, 0.7, 0.8]), prs = pick([0.3, 0.5, 0.6, 0.7]);
          const psr = 1 - pss, prr = 1 - prs, a = pss * psr + psr * prr;
          return { q: R`Chaîne de Markov météo : $\mathbb P(S\to S)=${f(pss, 1)}$ et $\mathbb P(P\to S)=${f(prs, 1)}$ ($S$ : soleil, $P$ : pluie). Il fait soleil aujourd’hui. Probabilité de pluie dans deux jours ? (3 décimales)`, a, tol: 0.001,
            expl: R`Chaque ligne somme à 1 : $\mathbb P(S\to P)=${f(psr, 1)}$, $\mathbb P(P\to P)=${f(prr, 1)}$. Deux chemins, $S\to S\to P$ et $S\to P\to P$ : $${f(pss, 1)}\times${f(psr, 1)}+${f(psr, 1)}\times${f(prr, 1)}=${f(a)}$.` };
        },
        () => {
          const p = pick([0.1, 0.2, 0.25, 0.5, 0.75]), a = p * -10 + (1 - p) * 1;
          return { q: R`Voiture du cours, état Warm : la politique joue Fast avec probabilité $${f(p, 2)}$, Slow sinon. Récompense immédiate espérée ?`, a, tol: 0.001,
            expl: R`Fast depuis Warm mène toujours en Overheated ($-10$) ; Slow rapporte $+1$ quelle que soit l’arrivée. $${f(p, 2)}\times(-10)+${f(1 - p, 2)}\times1=${f(a)}$.` };
        },
      ],
      'rl-return': [
        () => {
          const g = pick([0.5, 0.8, 0.9]), rs = Array.from({ length: 4 }, () => pick([0, 1, 2, -1, 5]));
          const G = rs.reduce((s, r, i) => s + r * g ** i, 0);
          return { q: R`Récompenses $R_{t+1..t+4}=(${rs.join(' ; ')})$ puis 0. Retour $G_t$ avec $\gamma=${f(g, 1)}$ ? (3 décimales)`, a: G, tol: 0.001,
            expl: R`$G_t=${rs.map((r, i) => `${r}\times${f(g, 1)}^{${i}}`).join('+')}=${f(G)}$.` };
        },
        () => { const g = pick([0.5, 0.8, 0.9, 0.95, 0.99]), r = pick([1, 2, 10]); return { q: R`$R_{\max}=${r}$, $\gamma=${f(g, 2)}$. Borne supérieure de $v_\pi(s)$ ?`, a: r / (1 - g), tol: 0.01, expl: R`$R_{\max}/(1-\gamma)=${r}/${f(1 - g, 2)}=${f(r / (1 - g), 2)}$.` }; },
        () => {
          const T = pick([5, 10, 20, 50]), g = pick([0.9, 0.95, 0.99]), a = -(g ** (T - 1));
          return { q: R`Cart-pole continu : $R=-1$ quand le bâton tombe, 0 sinon. Il tombe au pas $T=${T}$ (récompense $R_{${T}}=-1$). Retour $G_0$ avec $\gamma=${f(g, 2)}$ ? (4 décimales)`, a, tol: 0.0001,
            expl: R`Une seule récompense non nulle, $R_{${T}}=R_{0+i+1}$ avec $i=${T - 1}$ : $G_0=-\gamma^{${T - 1}}=-${f(g, 2)}^{${T - 1}}=${f(a, 4)}$. Tomber plus tard rapproche $G_0$ de 0.` };
        },
        () => {
          const ps = pick([[0.5, 0.3, 0.2], [0.6, 0.2, 0.2], [0.7, 0.2, 0.1], [0.4, 0.4, 0.2]]), qs = ps.map(() => rnd(-2, 6));
          const v = ps.reduce((s, p, i) => s + p * qs[i], 0);
          return { q: R`Politique $\pi(\cdot|s)=(${ps.map(p => f(p, 1)).join(' ; ')})$ sur trois actions de q-valeurs $q_\pi(s,\cdot)=(${qs.join(' ; ')})$. Que vaut $v_\pi(s)$ ?`, a: v, tol: 0.001,
            expl: R`Probabilités totales : $v_\pi(s)=\sum_a\pi(a|s)q_\pi(s,a)=${ps.map((p, i) => `${f(p, 1)}\times${par(qs[i])}`).join('+')}=${f(v)}$.` };
        },
      ],
      'rl-bellman': [
        () => {
          const vc = pick([1, 2, 2.5, 3, 3.5]), vw = pick([1, 1.5, 2, 2.5]), g = pick([0.5, 0.8, 0.9]);
          const a = 0.5 * (2 + g * vc) + 0.5 * (2 + g * vw);
          return { q: R`Voiture du cours, $\gamma=${f(g, 1)}$, $v(c)=${f(vc, 1)}$, $v(w)=${f(vw, 1)}$. Que vaut $q(c,\text{Fast})=\sum_{s'}T(c,\text{Fast},s')[R+\gamma v(s')]$ ?`, a, tol: 0.001,
            expl: R`Fast depuis Cool : Cool ou Warm à 1/2, récompense $+2$. $0{,}5(2+${f(g, 1)}\times${f(vc, 1)})+0{,}5(2+${f(g, 1)}\times${f(vw, 1)})=${f(a)}$.` };
        },
        () => {
          const p = pick([0.25, 0.5, 0.75, 1]), g = pick([0.5, 0.8]), v = carEval(p, g);
          return { q: R`Voiture du cours, $\gamma=${f(g, 1)}$. Politique : en Cool, Fast avec probabilité $${f(p, 2)}$ (Slow sinon) ; en Warm, Slow. Valeur exacte $v^\pi(c)$ ? (3 décimales)`, a: v.c, tol: 0.002,
            expl: R`$R^\pi(c)=${f(1 - p, 2)}\times1+${f(p, 2)}\times2=${f(1 + p, 2)}$, $T^\pi(c,c)=${f(1 - p / 2, 3)}$, $T^\pi(c,w)=${f(p / 2, 3)}$ ; $R^\pi(w)=1$, $T^\pi(w,c)=T^\pi(w,w)=0{,}5$. Système $v(c)=${f(1 + p, 2)}+${f(g, 1)}(${f(1 - p / 2, 3)}v(c)+${f(p / 2, 3)}v(w))$, $v(w)=1+${f(g, 1)}(0{,}5v(c)+0{,}5v(w))$ : $v(c)=${f(v.c)}$, $v(w)=${f(v.w)}$.` };
        },
        () => {
          let vc, vw, slow, fast;
          do { vc = pick([2, 4, 6, 8]); vw = pick([-8, -4, 0, 2]); slow = 1 + 0.9 * vc; fast = 0.5 * (2 + 0.9 * vc) + 0.5 * (2 + 0.9 * vw); } while (Math.abs(slow - fast) < 0.05);
          return { q: R`Voiture du cours, $\gamma=0{,}9$, valeurs courantes $v(c)=${vc}$, $v(w)=${vw}$. Quelle action est gloutonne en Cool ?`, opts: ['Slow', 'Fast'], a: fast > slow ? 1 : 0, keepOrder: true,
            expl: R`Slow : $1+0{,}9\times${vc}=${f(slow)}$. Fast : $0{,}5(2+0{,}9\times${vc})+0{,}5(2+0{,}9\times${par(vw)})=${f(fast)}$. On prend la plus grande : ${fast > slow ? 'Fast' : 'Slow'}.` };
        },
      ],
      'rl-vi': [
        () => {
          const g = pick([0.5, 0.8, 0.9]);
          let v = { c: 0, w: 0, o: 0 }; const k = rnd(1, 2);
          for (let i = 0; i < k; i++) v = carStep(v, g);
          const nv = carStep(v, g);
          return { q: R`Voiture du cours (Slow : +1 ; Fast : +2, ou −10 si surchauffe ; depuis c, Fast mène à c ou w avec proba 1/2 ; depuis w, Slow mène à c ou w avec proba 1/2, Fast mène à o). $\gamma=${f(g, 1)}$, $v_{${k}}=(c:${f(v.c)},\ w:${f(v.w)},\ o:0)$. Que vaut $v_{${k + 1}}(c)$ ?`, a: nv.c, tol: 0.002,
            expl: R`$v_{${k + 1}}(c)=\max\{1+${f(g, 1)}v(c),\ 0{,}5(2+${f(g, 1)}v(c))+0{,}5(2+${f(g, 1)}v(w))\}=\max\{${f(1 + g * v.c)},\ ${f(0.5 * (2 + g * v.c) + 0.5 * (2 + g * v.w))}\}=${f(nv.c)}$.` };
        },
        () => {
          const g = pick([0.5, 0.9, 0.99]), eps = pick([0.01, 0.1]), rmax = pick([1, 10]);
          const K = Math.ceil(Math.log(2 * rmax / (eps * (1 - g))) / Math.log(1 / g));
          return { q: R`Nombre d’itérations de value iteration garantissant $\|v_K-v^*\|_\infty\le${f(eps, 2)}$ si $R_{\max}=${rmax}$ et $\gamma=${f(g, 2)}$ ?`, a: K, tol: 0,
            expl: R`$K=\Big\lceil\log\frac{2R_{\max}}{\epsilon(1-\gamma)}\big/\log\frac1\gamma\Big\rceil=\lceil${f(Math.log(2 * rmax / (eps * (1 - g))), 3)}/${f(Math.log(1 / g), 4)}\rceil=${K}$.` };
        },
        () => {
          const g = pick([0.5, 0.8, 0.9]);
          let v = { c: 0, w: 0, o: 0 }; const k = rnd(1, 3);
          for (let i = 0; i < k; i++) v = carStep(v, g);
          const nv = carStep(v, g), slow = 0.5 * (1 + g * v.c) + 0.5 * (1 + g * v.w);
          return { q: R`Voiture du cours, $\gamma=${f(g, 1)}$, $v_{${k}}=(c:${f(v.c)},\ w:${f(v.w)},\ o:0)$. Que vaut $v_{${k + 1}}(w)$ ?`, a: nv.w, tol: 0.002,
            expl: R`En Warm : Slow vaut $0{,}5(1+${f(g, 1)}\times${f(v.c)})+0{,}5(1+${f(g, 1)}\times${f(v.w)})=${f(slow)}$ ; Fast vaut $1\times(-10+${f(g, 1)}\times0)=-10$. Max : $${f(nv.w)}$.` };
        },
        () => {
          const g = pick([0.5, 0.8, 0.9, 0.99]), eps = pick([0.01, 0.1]), th = eps * (1 - g) / g;
          return { q: R`Value iteration, $\gamma=${f(g, 2)}$. Quel seuil sur $\|v_{k+1}-v_k\|_\infty$ garantit $\|v_{k+1}-v^*\|_\infty<${f(eps, 2)}$ ? (6 décimales)`, a: th, tol: 0.000002,
            expl: R`Seuil $\epsilon\frac{1-\gamma}\gamma=${f(eps, 2)}\times\frac{${f(1 - g, 2)}}{${f(g, 2)}}=${f(th, 6)}$. Plus $\gamma$ est proche de 1, plus il faut être exigeant.` };
        },
        () => {
          const g = pick([0.5, 0.8, 0.9, 0.95]), eps = pick([0.01, 0.05, 0.1]), b = 2 * g * eps / (1 - g);
          return { q: R`$\|v_k-v^*\|_\infty<${f(eps, 2)}$ avec $\gamma=${f(g, 2)}$. Borne sur la perte $\|v_{\pi_k}-v^*\|_\infty$ de la politique gloutonne tirée de $v_k$ ? (4 décimales)`, a: b, tol: 0.0002,
            expl: R`$\frac{2\gamma\epsilon}{1-\gamma}=\frac{2\times${f(g, 2)}\times${f(eps, 2)}}{${f(1 - g, 2)}}=${f(b, 4)}$.` };
        },
      ],
      'rl-pi': [
        () => {
          const g = pick([0.5, 0.6, 0.8]);
          const vc = 1 / (1 - g), vw = (1 + 0.5 * g * vc) / (1 - 0.5 * g);
          return { q: R`Voiture du cours, politique « toujours Slow », $\gamma=${f(g, 1)}$. Valeur $v^{\pi}(w)$ ? (évaluation exacte, 3 décimales)`, a: vw, tol: 0.002,
            expl: R`$v(c)=1+\gamma v(c)\Rightarrow v(c)=${f(vc)}$ ; $v(w)=0{,}5(1+\gamma v(c))+0{,}5(1+\gamma v(w))\Rightarrow v(w)=\frac{1+0{,}5\gamma v(c)}{1-0{,}5\gamma}=${f(vw)}$.` };
        },
        () => {
          const g = pick([0.5, 0.6, 0.8, 0.9]), v = carEval(1, g);
          return { q: R`Voiture du cours, politique (Fast en Cool, Slow en Warm), $\gamma=${f(g, 1)}$. Évaluation exacte : $v^\pi(c)$ ? (3 décimales)`, a: v.c, tol: 0.002,
            expl: R`$v(c)=0{,}5(2+\gamma v(c))+0{,}5(2+\gamma v(w))$ et $v(w)=0{,}5(1+\gamma v(c))+0{,}5(1+\gamma v(w))$. Résolution du système $2\times2$ : $v(c)=${f(v.c)}$, $v(w)=${f(v.w)}$.` };
        },
        () => {
          const g = pick([0.5, 0.8, 0.9]), vc = pick([0, 1, 2]), vw = pick([0, 1, 1.5]);
          const a = 0.5 * (1 + g * vc) + 0.5 * (1 + g * vw);
          return { q: R`Évaluation itérative de « toujours Slow », $\gamma=${f(g, 1)}$, $v_k(c)=${f(vc, 1)}$, $v_k(w)=${f(vw, 1)}$. Que vaut $v_{k+1}(w)$ ?`, a, tol: 0.001,
            expl: R`Sans max, on suit Slow : $v_{k+1}(w)=0{,}5(1+${f(g, 1)}\times${f(vc, 1)})+0{,}5(1+${f(g, 1)}\times${f(vw, 1)})=${f(a)}$.` };
        },
      ],
      'rl-model': [
        () => {
          const nd = rnd(1, 9), na = rnd(1, 9), p = nd / (nd + na);
          return { q: R`Sur ${nd + na} passages par (C, east), ${nd} arrivent en D et ${na} en A. Estimation $\hat T(C,\text{east},D)$ ? (3 décimales)`, a: p, tol: 0.001,
            expl: R`Fréquence observée : $\hat T=\frac{${nd}}{${nd + na}}=${f(p)}$.` };
        },
        () => {
          const nd = rnd(1, 9), na = rnd(1, 9), p = nd / (nd + na), v = p * 9 + (1 - p) * -11;
          return { q: R`Grille du cours, $\gamma=1$ : depuis C (action east) on arrive en D (sortie $+10$) ${nd} fois et en A (sortie $-10$) ${na} fois, avec $\hat R=-1$ pour le pas C → D ou C → A. Valeur de C sous le modèle estimé ? (3 décimales)`, a: v, tol: 0.002,
            expl: R`$\hat T(C,\text{east},D)=${f(p)}$. $v(C)=${f(p)}(-1+10)+${f(1 - p)}(-1-10)=${f(v)}$.` };
        },
        () => {
          const rs = Array.from({ length: rnd(3, 5) }, () => pick([-2, -1, 0, 1, 3])), m = rs.reduce((s, x) => s + x, 0) / rs.length;
          return { q: R`La transition $(s,a,s')$ a été observée ${rs.length} fois avec les récompenses $(${rs.join(' ; ')})$. Estimation $\hat R(s,a,s')$ ?`, a: m, tol: 0.001,
            expl: R`Moyenne des récompenses observées : $\frac{${rs.map(par).join('+')}}{${rs.length}}=${f(m)}$.` };
        },
      ],
      'rl-mc': [
        () => {
          const n = rnd(2, 10), vp = pick([0, 1, 2, 4, 5]), G = pick([-2, 0, 3, 6, 10]), v = vp + (G - vp) / n;
          return { q: R`Monte-Carlo : $\hat v_{${n - 1}}(s)=${vp}$ après ${n - 1} retours. Le retour suivant vaut $G_{${n}}=${G}$. Nouvelle moyenne exacte $\hat v_{${n}}(s)$ ? (3 décimales)`, a: v, tol: 0.001,
            expl: R`$\hat v_n=\hat v_{n-1}+\frac1n(G_n-\hat v_{n-1})=${vp}+\frac1{${n}}(${G}-${vp})=${f(v)}$.` };
        },
        () => {
          const v = pick([0, 2, 5]), G = pick([-4, 1, 8, 12]), a = pick([0.05, 0.1, 0.2, 0.5]), nv = v + a * (G - v);
          return { q: R`Monte-Carlo à taux constant : $v(s)=${v}$, retour observé $G_t=${G}$, $\alpha=${f(a, 2)}$. Nouvelle valeur ?`, a: nv, tol: 0.001,
            expl: R`$v(s)+\alpha(G_t-v(s))=${v}+${f(a, 2)}\times(${G - v})=${f(nv)}$.` };
        },
        () => {
          const r1 = rnd(-2, 3), r2 = rnd(-2, 3), r3 = rnd(0, 5), first = Math.random() < 0.5;
          // Épisode : s → s → u → fin, récompenses r1, r2, r3, γ = 1
          const G0 = r1 + r2 + r3, G1 = r2 + r3, a = first ? G0 : (G0 + G1) / 2;
          return { q: R`Épisode $s\to s\to u\to$ fin, récompenses $${r1}$, $${r2}$, $${r3}$, $\gamma=1$. Estimation ${first ? 'first-visit' : 'every-visit'} de $v(s)$ sur cet épisode ?`, a, tol: 0.001,
            expl: R`Retour après le premier passage : $${r1}+${par(r2)}+${par(r3)}=${G0}$ ; après le second : $${r2}+${par(r3)}=${G1}$. ${first ? R`First-visit : seul le premier compte, $${G0}$.` : R`Every-visit : moyenne $(${G0}+${par(G1)})/2=${f(a)}$.`}` };
        },
      ],
      'rl-td': [
        () => {
          const v = pick([0, 1, 2, 3]), vn = pick([0, 2, 4, 5]), r = pick([-1, 0, 1, 2]), a = pick([0.1, 0.5]), g = pick([0.9, 1]);
          const nv = v + a * (r + g * vn - v);
          return { q: R`TD(0) : $v(s)=${v}$, transition vers $s'$ avec $r=${r}$, $v(s')=${vn}$, $\alpha=${f(a, 1)}$, $\gamma=${f(g, 1)}$. Nouvelle valeur $v(s)$ ?`, a: nv, tol: 0.001,
            expl: R`$v(s)+\alpha[r+\gamma v(s')-v(s)]=${v}+${f(a, 1)}\times(${f(r + g * vn - v, 2)})=${f(nv)}$.` };
        },
        () => {
          const v = pick([1, 3, 5, 8]), vn = pick([0, 2, 4, 6]), r = pick([-1, 0, 1, 2]), g = pick([0.5, 0.9, 1]);
          const d = r + g * vn - v;
          return { q: R`Erreur TD $\delta$ pour $v(s)=${v}$, $r=${r}$, $v(s')=${vn}$, $\gamma=${f(g, 1)}$ ? (le signe dit si $v(s)$ monte ou baisse)`, a: d, tol: 0.001,
            expl: R`$\delta=r+\gamma v(s')-v(s)=${r}+${f(g, 1)}\times${vn}-${v}=${f(d)}$ : $v(s)$ ${d > 0 ? 'monte' : d < 0 ? 'baisse' : 'ne bouge pas'}.` };
        },
        () => {
          const a = pick([0.1, 0.2, 0.5]), k = rnd(1, 4), v = 10 * (1 - (1 - a) ** k);
          return { q: R`Grille du cours : D est quitté par l’action exit vers l’état final ($v=0$) avec $r=+10$, $\gamma=1$. TD(0) depuis $v(D)=0$ avec $\alpha=${f(a, 1)}$ : que vaut $v(D)$ après ${k} passage(s) par D ? (3 décimales)`, a: v, tol: 0.002,
            expl: R`Chaque passage : $v(D)\leftarrow v(D)+\alpha(10-v(D))$, donc l’écart à 10 est multiplié par $1-\alpha$ : $v(D)=10(1-${f(1 - a, 1)}^{${k}})=${f(v)}$.` };
        },
      ],
      'rl-q': [
        () => {
          const q = pick([0, 1, 2]), qs = [pick([0, 1, 3]), pick([2, 4, 5])], r = pick([-1, 0, 1, 10]), a = pick([0.1, 0.5]), g = pick([0.9, 0.5]);
          const nq = q + a * (r + g * Math.max(...qs) - q);
          return { q: R`q-learning : $q(s,a)=${q}$, on observe $r=${r}$ et $s'$ avec $q(s',\cdot)=(${qs.join(' ; ')})$. $\alpha=${f(a, 1)}$, $\gamma=${f(g, 1)}$. Nouvelle $q(s,a)$ ?`, a: nq, tol: 0.001,
            expl: R`$\Delta=r+\gamma\max_{a'}q(s',a')-q(s,a)=${r}+${f(g, 1)}\times${Math.max(...qs)}-${q}=${f(r + g * Math.max(...qs) - q, 2)}$ ; $q\leftarrow${q}+${f(a, 1)}\Delta=${f(nq)}$.` };
        },
        () => {
          const q = pick([0, 1, 2]), qs = [pick([0, 1, 3]), pick([2, 4, 5])], ai = pick([0, 1]), r = pick([0, 1]), a = 0.5, g = 0.9;
          const nq = q + a * (r + g * qs[ai] - q);
          return { q: R`SARSA : $q(s,a)=${q}$, $r=${r}$, puis la politique choisit en $s'$ l’action $a'_${ai + 1}$, avec $q(s',\cdot)=(${qs.join(' ; ')})$. $\alpha=0{,}5$, $\gamma=0{,}9$. Nouvelle $q(s,a)$ ?`, a: nq, tol: 0.001,
            expl: R`SARSA utilise $q(s',a')=${qs[ai]}$ (l’action jouée, pas le max) : $${q}+0{,}5(${r}+0{,}9\times${qs[ai]}-${q})=${f(nq)}$.` };
        },
        () => {
          const qs = [pick([3, 4, 5]), pick([0, 1, 2])], a = pick([0.1, 0.5]), g = pick([0.5, 0.9]), gap = a * g * (qs[0] - qs[1]);
          return { q: R`Même transition $(s,a,r,s')$ traitée par q-learning et par SARSA, avec $q(s',\cdot)=(${qs.join(' ; ')})$ et une action suivante exploratoire $a'_2$. $\alpha=${f(a, 1)}$, $\gamma=${f(g, 1)}$. De combien la nouvelle $q(s,a)$ du q-learning dépasse-t-elle celle de SARSA ?`, a: gap, tol: 0.001,
            expl: R`Seule la cible diffère : $\gamma\max_{a'}q(s',a')$ contre $\gamma q(s',a'_2)$. Écart $\alpha\gamma(${qs[0]}-${qs[1]})=${f(a, 1)}\times${f(g, 1)}\times${qs[0] - qs[1]}=${f(gap)}$.` };
        },
        () => {
          const good = pick([R`$\alpha_k=1/k$`, R`$\alpha_k=1/k^{0{,}6}$`, R`$\alpha_k=1/k^{0{,}8}$`, R`$\alpha_k=1/(k+10)$`]);
          const bads = [R`$\alpha_k=1/k^2$`, R`$\alpha_k=0{,}1$`, R`$\alpha_k=1/\sqrt k$`, R`$\alpha_k=1/k^{1{,}5}$`, R`$\alpha_k=0{,}01$`].sort(() => Math.random() - 0.5).slice(0, 3);
          return { q: R`Quelle suite de taux respecte les conditions de convergence du q-learning, $\sum_k\alpha_k=\infty$ et $\sum_k\alpha_k^2<\infty$ ?`, opts: [good, ...bads], a: 0,
            expl: R`${good} : $\sum\alpha_k$ diverge (exposant $\le1$) et $\sum\alpha_k^2$ converge (exposant du carré $>1$). Une constante fait diverger $\sum\alpha^2$ ; $1/\sqrt k$ donne $\sum\alpha^2=\sum1/k=\infty$ ; $1/k^2$ et $1/k^{1{,}5}$ font converger $\sum\alpha$, on cesse d’apprendre trop tôt.` };
        },
      ],
      'rl-explore': [
        () => { const e = pick([0.05, 0.1, 0.2, 0.3]), m = rnd(2, 6); return { q: R`ε-greedy avec $\epsilon=${f(e, 2)}$ et ${m} actions : probabilité de choisir l’action gloutonne ? (3 décimales)`, a: e / m + 1 - e, tol: 0.001, expl: R`$\frac\epsilon m+1-\epsilon=${f(e / m + 1 - e)}$.` }; },
        () => {
          const qs = [1, 2, 3].map(() => pick([0, 1, 2])), b = pick([0.5, 1, 2]);
          const z = qs.reduce((s, x) => s + Math.exp(b * x), 0), p = Math.exp(b * qs[0]) / z;
          return { q: R`Softmax, $\beta=${f(b, 1)}$, $q=(${qs.join(' ; ')})$. Probabilité de la première action ? (3 décimales)`, a: p, tol: 0.002, expl: R`$\frac{e^{${f(b * qs[0], 1)}}}{${qs.map(x => `e^{${f(b * x, 1)}}`).join('+')}}=${f(p)}$.` };
        },
        () => { const e = pick([0.05, 0.1, 0.2, 0.3]), m = rnd(3, 8); return { q: R`ε-greedy avec $\epsilon=${f(e, 2)}$ et ${m} actions : probabilité de jouer une action non gloutonne donnée ? (4 décimales)`, a: e / m, tol: 0.0001, expl: R`Chaque action, gloutonne comprise, reçoit $\epsilon/m$ par le tirage aléatoire : $${f(e, 2)}/${m}=${f(e / m, 4)}$.` }; },
        () => {
          const tau = pick([0.5, 1, 2, 5]), qs = [pick([1, 2]), pick([3, 4]), pick([0, 1])];
          const z = qs.reduce((s, x) => s + Math.exp(x / tau), 0), p = Math.exp(qs[1] / tau) / z;
          return { q: R`Softmax à température $\tau=${f(tau, 1)}$, $q=(${qs.join(' ; ')})$. Probabilité de l’action de q-valeur ${qs[1]} ? (3 décimales)`, a: p, tol: 0.002,
            expl: R`$\beta=1/\tau=${f(1 / tau, 2)}$. $p=\frac{e^{${qs[1]}/${f(tau, 1)}}}{${qs.map(x => `e^{${x}/${f(tau, 1)}}`).join('+')}}=${f(p)}$. Plus $\tau$ est grand, plus on se rapproche de $1/3$.` };
        },
      ],
      'rl-approx': [
        () => {
          const wd = pick([2, 4]), wg = pick([-1, -2]), dd = pick([1, 2, 4]), dg = pick([1, 2]), r = pick([-500, -100, 10]), a = pick([0.001, 0.01]);
          const fd = 1 / dd, fg = 1 / dg, q = wd * fd + wg * fg, delta = r - q;
          return { q: R`$q(s,a)=w_{DOT}f_{DOT}+w_{GST}f_{GST}$ avec $w=(${wd} ; ${wg})$, $f_{DOT}=1/${dd}$, $f_{GST}=1/${dg}$. Transition terminale ($q(s',\cdot)=0$) avec $r=${r}$, $\alpha=${a}$. Nouveau $w_{DOT}$ ? (4 décimales)`, a: wd + a * delta * fd, tol: 0.0002,
            expl: R`$q=${f(q)}$, $\Delta=${r}-${f(q)}=${f(delta)}$ ; $w_{DOT}\leftarrow${wd}+${a}\times${f(delta)}\times${f(fd)}=${f(wd + a * delta * fd, 4)}$.` };
        },
        () => {
          const w = [pick([1, 2, 4]), pick([-1, -3]), pick([0.5, 2])], fs = [pick([0.25, 0.5, 1]), pick([0.5, 1]), pick([0, 1])];
          const q = w.reduce((s, x, i) => s + x * fs[i], 0);
          return { q: R`Trois features : $w=(${w.map(x => f(x, 2)).join(' ; ')})$, $f(s,a)=(${fs.map(x => f(x, 2)).join(' ; ')})$. Que vaut $\hat q(s,a)$ ?`, a: q, tol: 0.001,
            expl: R`$\hat q=\sum_iw_if_i=${w.map((x, i) => `${par(x, 2)}\times${f(fs[i], 2)}`).join('+')}=${f(q)}$.` };
        },
        () => {
          const wg = pick([-1, -2]), dg = pick([1, 2, 3]), r = pick([-500, -100]), a = pick([0.001, 0.004, 0.01]), q = pick([1, 0.5, 2]);
          const fg = 1 / dg, delta = r - q, nw = wg + a * delta * fg;
          return { q: R`PacMan : $\hat q(s,a)=${f(q, 1)}$, fantôme à distance ${dg} ($f_{GST}=1/${dg}$), $w_{GST}=${wg}$. PacMan meurt : $r=${r}$, $q(s',\cdot)=0$, $\alpha=${a}$. Nouveau $w_{GST}$ ? (4 décimales)`, a: nw, tol: 0.0002,
            expl: R`$\Delta=${r}+0-${f(q, 1)}=${f(delta, 1)}$ ; $w_{GST}\leftarrow${wg}+${a}\times(${f(delta, 1)})\times${f(fg)}=${f(nw, 4)}$.` };
        },
        () => {
          const q = pick([1, 2, 3]), qn = [pick([1, 2, 4]), pick([0, 3])], r = pick([-1, 0, 1]), g = 0.9, a = pick([0.01, 0.05, 0.1]), fi = pick([0.5, 1, 2]), wi = pick([1, -1, 0.5]);
          const delta = r + g * Math.max(...qn) - q, nw = wi + a * delta * fi;
          return { q: R`q-learning approché : $\hat q(s,a)=${q}$, $r=${r}$, $\hat q(s',\cdot)=(${qn.join(' ; ')})$, $\gamma=0{,}9$, $\alpha=${f(a, 2)}$. Feature $f_i(s,a)=${f(fi, 1)}$ de poids $w_i=${f(wi, 1)}$. Nouveau $w_i$ ? (4 décimales)`, a: nw, tol: 0.0002,
            expl: R`$\Delta=${r}+0{,}9\times${Math.max(...qn)}-${q}=${f(delta)}$ ; $w_i\leftarrow${f(wi, 1)}+${f(a, 2)}\times${par(delta)}\times${f(fi, 1)}=${f(nw, 4)}$.` };
        },
      ],
      'rl-dqn': [
        () => {
          const r = pick([0, 1, -1]), g = pick([0.9, 0.99]), qa = [pick([1, 2]), pick([2.5, 3.5, 4]), pick([0, 1.5])].map(x => x), t = r + g * Math.max(...qa);
          return { q: R`DQN : $r=${r}$, $\gamma=${f(g, 2)}$, réseau cible $q(s',\cdot,w^A)=(${qa.map(x => f(x, 1)).join(' ; ')})$. Valeur de la cible ?`, a: t, tol: 0.001,
            expl: R`$r+\gamma\max_{a'}q(s',a',w^A)=${r}+${f(g, 2)}\times${f(Math.max(...qa), 1)}=${f(t)}$.` };
        },
        () => {
          const r = pick([0, 1]), g = 0.99, qA = [pick([2, 3]), pick([3.5, 4]), pick([0.5, 1])], qB = [pick([2, 2.5]), pick([1, 1.8]), pick([3, 3.2])];
          const j = qB.indexOf(Math.max(...qB)), t = r + g * qA[j];
          return { q: R`Double DQN : $r=${r}$, $\gamma=0{,}99$, réseau en ligne $q(s',\cdot,w^B)=(${qB.map(x => f(x, 1)).join(' ; ')})$, réseau cible $q(s',\cdot,w^A)=(${qA.map(x => f(x, 1)).join(' ; ')})$. Valeur de la cible ?`, a: t, tol: 0.001,
            expl: R`Le réseau en ligne choisit l’action ${j + 1} (max de $w^B$), le réseau cible l’évalue : $${r}+0{,}99\times${f(qA[j], 1)}=${f(t)}$. Le DQN simple aurait pris $\max q(s',\cdot,w^A)=${f(Math.max(...qA), 1)}$.` };
        },
        () => {
          const V = pick([2, 5, 10]), A = [pick([1, 2]), pick([-1, -0.5]), pick([0, 0.3])], k = rnd(0, 2), q = V + A[k] - Math.max(...A);
          return { q: R`Dueling : $V(s)=${V}$, avantages $A(s,\cdot)=(${A.map(x => f(x, 1)).join(' ; ')})$. Que vaut $q(s,a_${k + 1})=V+A(s,a_${k + 1})-\max_{a'}A(s,a')$ ?`, a: q, tol: 0.001,
            expl: R`$${V}+${par(A[k], 1)}-${f(Math.max(...A), 1)}=${f(q)}$. L’action de plus grand avantage a $q=V$.` };
        },
        () => {
          const k = rnd(1, 4), side = pick([84, 64]), e = side * side * k * Math.log10(256);
          return { q: R`Atari : on prend les ${k} dernières images de $${side}\times${side}$ pixels, 256 niveaux de gris. Le nombre d’états est $10^x$ : que vaut $x$ ? (à l’unité près)`, a: e, tol: 1,
            expl: R`$256^{${side}\times${side}\times${k}}=10^{${side * side * k}\times\log_{10}256}$, avec $\log_{10}256\approx2{,}408$ : $x\approx${f(e, 0)}$.` };
        },
      ],
      'rl-pg': [
        () => {
          const R1 = pick([-1, 0, 1, 2]), g = pick([0.9, 0.99]), qn = pick([1, 2, 3]), qc = pick([1, 2, 3, 4]), d = R1 + g * qn - qc;
          return { q: R`Actor-critic : $R_{t+1}=${R1}$, $\gamma=${f(g, 2)}$, $q(s_{t+1},a,w)=${qn}$, $q(s_t,a,w)=${qc}$. Que vaut $\delta_t$ ?`, a: d, tol: 0.001,
            expl: R`$\delta_t=${R1}+${f(g, 2)}\times${qn}-${qc}=${f(d)}$ : l’action est ${d > 0 ? 'encouragée' : d < 0 ? 'découragée' : 'ni encouragée ni découragée'}.` };
        },
        () => {
          let R1, qn, qc, d;
          do { R1 = pick([-1, 0, 1, 2]); qn = pick([0, 1, 2, 3]); qc = pick([1, 2, 3]); d = R1 + 0.9 * qn - qc; } while (Math.abs(d) < 0.05);
          return { q: R`Critique : $R_{t+1}=${R1}$, $\gamma=0{,}9$, $q(s_{t+1},a,w)=${qn}$, $q(s_t,a,w)=${qc}$. Que fait l’acteur ?`, opts: ['il encourage l’action', 'il décourage l’action'], a: d > 0 ? 0 : 1, keepOrder: true,
            expl: R`$\delta_t=${R1}+0{,}9\times${qn}-${qc}=${f(d)}$ ${d > 0 ? '> 0 : récompense reçue supérieure à la prédiction' : '< 0 : récompense reçue inférieure à la prédiction'}.` };
        },
      ],
    },
  });
})();
