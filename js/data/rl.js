// Chapitre : Reinforcement Learning 1, 2 et 3 (X. Siebert, slides RL1, RL2, RL3).
(function () {
  const R = String.raw;
  const { pick, rnd, f } = COURSE.u;

  // MDP de la voiture du cours : états c (cool), w (warm), o (overheated, absorbant)
  function carStep(v, g) {
    const c = Math.max(1 * (1 + g * v.c), 0.5 * (2 + g * v.c) + 0.5 * (2 + g * v.w));
    const w = Math.max(0.5 * (1 + g * v.c) + 0.5 * (1 + g * v.w), 1 * (-10 + g * 0));
    return { c, w, o: 0 };
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
        id: 'rl-mdp', title: 'Processus de décision markoviens (MDP)', slides: 'RL1 9-33',
        summary: 'Agent, environnement, état, action, récompense. MDP = (S, A, T, T, R). Propriété de Markov. Politique déterministe ou stochastique.',
        fiche: R`
<p><b>Schéma</b> : l’agent choisit une action $a_t$, l’environnement renvoie un nouvel état $s_{t+1}$ et une récompense $r_{t+1}$. Une <b>politique</b> $\pi$ est la procédure de choix des actions ; objectif : maximiser la <b>récompense cumulée</b>. Racines : psychologie expérimentale (Pavlov, conditionnement) et neurosciences computationnelles. Deep Blue (1997) = ingénierie de la connaissance + calcul ; AlphaGo Zero (2017) = deep RL sans connaissance experte.</p>
<div class="def"><b>Chaîne de Markov</b> : graphe orienté d’états pondéré par les probabilités de transition, sans actions ni récompenses.<br>
<b>Propriété de Markov</b> : $T(s,s')=\mathbb P(S_{t+1}=s'\mid S_t=s)$ ne dépend que de l’état présent : sachant le présent, futur et passé sont indépendants.</div>
<div class="def"><b>MDP</b> : quintuplet $\{S,A,\mathcal T,T,R\}$ : états, actions, transitions possibles, fonction de transition $T(s,a,s')=\mathbb P(S_{t+1}=s'\mid S_t=s,A_t=a)$, récompense $R(s,a,s')$. Les transitions sont <b>stochastiques</b>.</div>
<p><b>Exemple de la voiture</b> : états Cool, Warm, Overheated ; actions Slow, Fast. Slow rapporte +1 ; Fast +2, mais −10 si l’on surchauffe. Depuis Warm, Slow mène à Cool ou Warm avec probabilité 1/2 ; Fast depuis Warm mène à Overheated. Overheated est <b>absorbant</b> : $T(s,a,s)=1$ pour tout $a$.</p>
<div class="def"><b>Règle de décision</b> à l’instant $t$ : déterministe $\pi_t(s)=a$, ou stochastique $\pi_t(s,a)=\mathbb P[A_t=a\mid S_t=s]$. Une <b>politique</b> est une suite de règles $(\pi_0,\pi_1,\dots)$, <b>stationnaire</b> si $\pi_t=\pi$.</div>
<p>Tâches <b>épisodiques</b> (un état terminal, on repart de $s_0$) ou <b>continues</b> (jamais de fin). « Résoudre » un MDP = trouver la politique optimale $\pi^*$.</p>`,
      },
      {
        id: 'rl-return', title: 'Retour actualisé, valeurs et q-valeurs', slides: 'RL1 34-43',
        summary: 'Gt = Σ γ^i R_{t+i+1}, borné par Rmax/(1−γ). vπ(s) = Eπ[Gt | s], qπ(s,a) = Eπ[Gt | s, a]. Évaluer une politique vs l’optimiser.',
        fiche: R`
<p><b>Hypothèse de la récompense</b> : tout objectif peut s’écrire comme l’espérance d’une somme cumulée d’un signal scalaire. Horizon fini : $\mathbb E[R_{t+1}+\dots+R_{t+N}]$ ; horizon infini : la somme peut diverger.</p>
<div class="def"><b>Retour actualisé</b> : $G_t=\sum_{i\ge0}\gamma^iR_{t+i+1}$ avec $\gamma\in[0,1[$, et $\mathbb E[G_t]\le\dfrac{R_{\max}}{1-\gamma}$.
<ul><li>$\gamma\to0$ : seul l’immédiat compte (agent myope).</li><li>$\gamma\to1$ : tout compte autant (agent prévoyant).</li></ul></div>
<p><b>Cart-pole</b> : en épisodique ($R_t=1$ tant que le bâton tient), la somme récompense les bonnes politiques ; en continu ($R_t=-1$ quand il tombe, 0 sinon), la somme non actualisée est la même pour toutes les politiques, mais avec $\gamma<1$ tomber plus tard coûte moins : l’actualisation rend les deux formulations utilisables.</p>
<div class="def"><b>Valeur</b> : $v_\pi(s)=\mathbb E_\pi[G_t\mid S_t=s]$. <b>q-valeur</b> : $q_\pi(s,a)=\mathbb E_\pi[G_t\mid S_t=s,A_t=a]$ (q-état : action choisie mais pas encore exécutée).</div>
<p><b>Évaluation</b> d’une politique : calculer $v_\pi(s)$ pour tout $s$. <b>Optimisation</b> : trouver $\pi^*$, via $q^*(s,a)$. Les espérances se calculent avec la formule des probabilités totales $\mathbb P(E)=\sum_i\mathbb P(E\mid B_i)\mathbb P(B_i)$.</p>`,
      },
      {
        id: 'rl-bellman', title: 'Équations de Bellman', slides: 'RL1 45-59',
        summary: 'vπ(s) = Σa π(a,s) Σs′ T [R + γ vπ(s′)] ; v*(s) = maxa Σs′ T [R + γ v*(s′)] ; q*(s,a) = Σs′ T [R + γ maxa′ q*(s′,a′)]. Point fixe d’un opérateur contractant.',
        fiche: R`
<p>De $G_t=R_{t+1}+\gamma G_{t+1}$ on tire $v_\pi(s)=\mathbb E_\pi[R_{t+1}\mid s]+\gamma\mathbb E_\pi[G_{t+1}\mid s]$, puis en développant sur une transition $(s,a,s')$ :</p>
<div class="thm"><b>Bellman (évaluation de $\pi$, 1957)</b>
$$v_\pi(s)=\sum_a\pi(a,s)\sum_{s'}T(s,a,s')\big[R(s,a,s')+\gamma v_\pi(s')\big].$$
La valeur des successeurs est « rétropropagée » vers $s$.</div>
<p><b>Ordre partiel</b> : $\pi$ domine $\pi'$ si $v_\pi\ge v_{\pi'}$ partout et $>$ quelque part. $\pi^*$ est optimale si aucune politique ne la domine. Plusieurs politiques optimales peuvent exister, mais elles ont toutes la même valeur $v^*(s)=\max_\pi v_\pi(s)$ ; de même $q^*(s,a)=\max_\pi q_\pi(s,a)$ et $v^*(s)=\max_aq^*(s,a)$.</p>
<div class="thm"><b>Bellman (optimalité)</b>
$$v^*(s)=\max_a\sum_{s'}T(s,a,s')\big[R(s,a,s')+\gamma v^*(s')\big]$$
$$q^*(s,a)=\sum_{s'}T(s,a,s')\big[R(s,a,s')+\gamma\max_{a'}q^*(s',a')\big]$$</div>
<p>Avec l’opérateur de programmation dynamique $\mathcal Lv(s)=\max_a\sum_{s'}T[R+\gamma v(s')]$, $v^*$ est le <b>point fixe</b> $v=\mathcal Lv$ ($\mathcal L$ est contractant).</p>
<p><b>Comment calculer $v^*$ ?</b> Pour $v_\pi$ d’un MDP fini à $n$ états : $V^\pi=R^\pi+\gamma T^\pi V^\pi$, donc $V^\pi=(I-\gamma T^\pi)^{-1}R^\pi$, coût $O(n^3)$, réservé aux petits MDP. Programmation linéaire : minimiser $\sum_sv(s)$ sous $v\ge\mathcal Lv$ (lent). Ou programmation dynamique : <b>value iteration</b> et <b>policy iteration</b>.</p>`,
      },
      {
        id: 'rl-vi', title: 'Value iteration', slides: 'RL1 61-76',
        summary: 'v_{k+1} = L v_k converge vers v* (Banach, L est γ-contractant). Erreur ≤ γ^K 2Rmax/(1−γ). Coût O(S²A) par itération.',
        fiche: R`
<div class="thm"><b>Value iteration</b> : partir de $v_0$ quelconque et itérer
$$v_{k+1}(s)\leftarrow\max_a\sum_{s'}T(s,a,s')\big[R(s,a,s')+\gamma v_k(s')\big],$$
jusqu’à $\|v_{k+1}-v_k\|<\epsilon$. Chaque itération essaie toutes les actions de tous les états vers tous les états : $O(S^2A)$.</div>
<div class="def"><b>Contraction</b> : $T$ est contractante sur $(X,d)$ s’il existe $\alpha\in[0,1[$ tel que $d(T(x),T(y))\le\alpha\,d(x,y)$.<br>
<b>Théorème du point fixe de Banach</b> : sur un espace complet, une contraction a un unique point fixe, atteint par itération depuis n’importe quel point.</div>
<p><b>$\mathcal L$ est $\gamma$-contractant</b> pour $\|\cdot\|_\infty$ : avec $|\max f-\max g|\le\max|f-g|$, on obtient $\|\mathcal Lu-\mathcal Lv\|_\infty\le\gamma\max_a\|\sum_{s'}T(s,a,s')(u-v)(s')\|\le\gamma\|u-v\|_\infty$ car $\sum_{s'}T=1$.</p>
<p><b>Vitesse</b> : $\|v_0-v^*\|_\infty\le\frac{2R_{\max}}{1-\gamma}$, donc $\|v_K-v^*\|_\infty\le\gamma^K\frac{2R_{\max}}{1-\gamma}$. Pour une erreur $\epsilon$ : $K=\Big\lceil\dfrac{\log\frac{2R_{\max}}{\epsilon(1-\gamma)}}{\log\frac1\gamma}\Big\rceil$. Faiblesse : $K$ explose quand $\gamma\to1$.</p>
<p><b>Arrêt</b> : si $\|v_{k+1}-v_k\|_\infty<\epsilon\frac{1-\gamma}\gamma$, alors $\|v_{k+1}-v^*\|_\infty<\epsilon$. Ce qui compte pour l’agent, c’est la politique : si $\|v_k-v^*\|<\epsilon$, la politique gloutonne $\pi_k$ vérifie $\|v_{\pi_k}-v^*\|<\frac{2\gamma}{1-\gamma}\epsilon$.</p>
<p><b>Exemple</b> (voiture, $\gamma=0{,}5$, $v_0=0$) : $v_1(c)=\max\{1,\ 0{,}5(2)+0{,}5(2)\}=2$, $v_1(w)=\max\{1,-10\}=1$ ; puis $v_2(c)=\max\{1+0{,}5\cdot2,\ 0{,}5(2+1)+0{,}5(2+0{,}5)\}=2{,}75$, $v_2(w)=\max\{0{,}5(1+1)+0{,}5(1+0{,}5),-10\}=1{,}75$.</p>`,
      },
      {
        id: 'rl-pi', title: 'Policy iteration', slides: 'RL1 78-90',
        summary: 'Alterner évaluation (résoudre vπk, sans max) et amélioration gloutonne. Théorème d’amélioration : suite monotone, convergence souvent en très peu d’itérations.',
        fiche: R`
<p>Bellman définit aussi la politique optimale : $\pi^*(s)=\arg\max_a\sum_{s'}T[R+\gamma v^*(s')]$. Pour itérer sur les politiques, il faut la valeur de chacune, d’où deux étapes :</p>
<div class="thm"><b>Policy iteration</b>
<ol><li><b>Évaluation</b> : résoudre $v^{\pi_k}(s)=\sum_{s'}T(s,\pi_k(s),s')[R(s,\pi_k(s),s')+\gamma v^{\pi_k}(s')]$ (système linéaire, pas de max).</li>
<li><b>Amélioration</b> (gloutonne) : $\pi_{k+1}(s)=\arg\max_a\sum_{s'}T(s,a,s')[R(s,a,s')+\gamma v^{\pi_k}(s')]$.</li></ol>
Arrêt quand $\pi_{k+1}=\pi_k$.</div>
<div class="thm"><b>Théorème d’amélioration de politique</b> : si $q_\pi(s,\pi'(s))\ge v_\pi(s)$ pour tout $s$, alors $v_{\pi'}(s)\ge v_\pi(s)$ pour tout $s$. La suite des valeurs est monotone et bornée par $v^*$ : elle converge.</div>
<p>La politique converge souvent avant les valeurs, mais chaque tour demande une évaluation complète, parfois longue.</p>
<p><b>Exemple</b> (voiture, $\gamma=0{,}5$, $\pi_0$ = toujours Slow) : $v(c)=1+0{,}5v(c)\Rightarrow v(c)=2$ ; $v(w)=0{,}5(1+0{,}5\cdot2)+0{,}5(1+0{,}5v(w))\Rightarrow v(w)=2$. Amélioration : en c, Slow vaut 2 et Fast $0{,}5(2+1)+0{,}5(2+1)=3$ : Fast ; en w, Slow vaut 3, Fast $-10$ : Slow. $\pi_1=\pi_2$ = (Fast, Slow) : convergé.</p>
<p><b>Programmation dynamique asynchrone</b> : mises à jour en place, sans balayer systématiquement tous les états, en se concentrant sur les états pertinents. <b>Living reward</b> (TP GridWorld) : une petite récompense négative par pas (−0,01 tranquille, −2 « dépêche-toi ») pousse l’agent à sortir vite.</p>`,
      },
      {
        id: 'rl-model', title: 'Du MDP au RL : model-based', slides: 'RL2 7-18',
        summary: 'En RL, T et R sont inconnus. Model-based : estimer T̂ et R̂ à partir d’épisodes puis résoudre le MDP. Model-free : apprendre v ou q directement.',
        fiche: R`
<p><b>RL ≠ MDP</b> : la dynamique est inconnue, $T(s,a,s')=?$ et $R(s,a,s')=?$. On ne peut pas appliquer Bellman tel quel.</p>
<table><tr><th>Model-based (indirect, offline)</th><th>Model-free (direct, online)</th></tr>
<tr><td>construire $\hat T,\hat R$ à partir de l’expérience, puis « résoudre le MDP » (planification)</td><td>pas de modèle ; apprendre progressivement $v$ ou $q$ depuis l’expérience</td></tr></table>
<p><b>Analogie de l’âge moyen</b> $\mathbb E[A]=\sum_aP(a)\,a$ avec $P$ inconnue. Model-based : estimer $\hat P(a)=n(a)/N$ puis $\sum_a\hat P(a)a$. Model-free : $\frac1N\sum_ia_i$ directement ; les âges fréquents apparaissent naturellement plus souvent.</p>
<p><b>Model-based avec value iteration</b> : $S$ et $A$ connus ; à partir d’épisodes (état, action, état d’arrivée, récompense) suivant une politique, compter les fréquences pour obtenir $\hat T$ et moyenner les récompenses pour $\hat R$ ; puis $v_{k+1}(s)\leftarrow\max_a\sum_{s'}\hat T[\hat R+\gamma v_k(s')]$. Même chose avec policy iteration.</p>
<p><b>Bilan</b> : un modèle peut être compact, s’apprend par apprentissage supervisé, permet de raisonner sur son incertitude. Mais deux sources d’erreur (le modèle, puis la politique tirée du modèle) et la question « quand le modèle est-il assez bon ? ».</p>`,
      },
      {
        id: 'rl-mc', title: 'Model-free : Monte-Carlo', slides: 'RL2 20-28',
        summary: 'Estimer vπ(s) par la moyenne des retours observés à la fin des épisodes ; mise à jour incrémentale v ← v + α(G − v). First-visit sans biais.',
        fiche: R`
<p>Motivations du model-free : ce qui compte est l’action, pas la valeur exacte ; la politique peut converger avant $v^*$ ; l’agent peut influencer l’expérience qu’il collecte (dilemme exploration / exploitation).</p>
<div class="def"><b>On-policy</b> : apprendre sur $\pi$ à partir d’expérience générée par $\pi$ (« apprendre sur le tas » : Monte-Carlo, TD(0), SARSA). <b>Off-policy</b> : apprendre sur $\pi$ avec l’expérience d’une autre politique (« regarder par-dessus l’épaule » : q-learning).</div>
<p><b>Monte-Carlo</b> (Los Alamos, années 1940) : calculer des espérances par échantillonnage, $\mathbb E_{x\sim p}[f(x)]\approx\frac1N\sum_if(x_i)$, estimateur sans biais et consistant (erreur $\sim\mathcal N(0,1/N)$).</p>
<p>En RL : simuler des épisodes de longueur $T$ avec $\pi$, observer les retours $G_t=\sum_i\gamma^iR_{t+i+1}$ en fin d’épisode, et moyenner pour chaque état : $\hat v^\pi(s)=\frac1{n}\sum_iG_i(s)$.</p>
<div class="thm"><b>Moyenne incrémentale</b> : $\hat v_n=\hat v_{n-1}+\frac1n(G_n-\hat v_{n-1})$ ; avec un taux $\alpha(s)$ : $v_\pi(s)\leftarrow v_\pi(s)+\alpha(s)\big(G_t-v_\pi(s)\big)$.</div>
<p>$\alpha$ trop petit : lent ; trop grand : oscille autour de la moyenne. Cette forme « ancien + α(cible − ancien) » est partout en RL.</p>
<p><b>Every-visit</b> (chaque passage en $s$ compte, erreurs non indépendantes : biais) vs <b>first-visit</b> (premier passage seulement : sans biais). Limites : épisodes finis obligatoires, on attend la fin de l’épisode pour apprendre, évalue seulement $\pi$, l’exploration est un problème.</p>`,
      },
      {
        id: 'rl-td', title: 'Différences temporelles TD(0) et TD(λ)', slides: 'RL2 29-36',
        summary: 'Après chaque transition : v(s) ← v(s) + α[r + γ v(s′) − v(s)]. On met à jour une estimation à partir d’une estimation (bootstrap). Pas besoin d’attendre la fin de l’épisode.',
        fiche: R`
<p>But (Sutton 1988) : ne pas attendre la fin de l’épisode. Après chaque transition $(s,a,s',r)$ sous $\pi$ fixée, moyenne glissante :</p>
<div class="thm"><b>TD(0)</b>
$$v_\pi(s)\leftarrow v_\pi(s)+\alpha\Big[\underbrace{R(s,\pi(s),s')+\gamma v_\pi(s')}_{\text{cible TD}}-\underbrace{v_\pi(s)}_{\text{estimation}}\Big]=v_\pi(s)+\alpha\,\delta.$$</div>
<p>Pourquoi « différence temporelle » : si les estimations étaient exactes, $v_t=r_t+\gamma v_{t+1}$ ; TD corrige l’écart $\delta$ entre ces deux termes. C’est un estimateur <b>bootstrap</b> : on met à jour une estimation vers une autre estimation. $\alpha\approx0{,}1$ injecte un peu d’information à chaque pas, généralement décroissant. Convergence prouvée (Dayan et Sejnowski 1994).</p>
<p><b>TD(λ)</b> : $v_{k+1}(s)=v_k(s)+\alpha\sum_{m=k}^{N-1}\lambda^{m-k}\delta_m(s)$, qui mélange les erreurs TD des pas suivants (TD(0) d’un côté, Monte-Carlo de l’autre).</p>
<p><b>Bilan</b> : TD apprend avant le résultat final, et même sans résultat final (séquences incomplètes, tâches continues) ; il exploite la propriété de Markov (MC non) ; il converge. Mais il évalue $\pi$ seulement : pour trouver $\pi^*$ il faut estimer la valeur de <b>chaque action</b>.</p>`,
      },
      {
        id: 'rl-q', title: 'SARSA et q-learning', slides: 'RL2 37-49',
        summary: 'Apprendre q(s,a) plutôt que v(s). SARSA (on-policy) : cible r + γ q(s′,a′). q-learning (off-policy) : cible r + γ max q(s′,·). Convergence sous Σα = ∞, Σα² < ∞, visites infinies.',
        fiche: R`
<p>Avec TD(0) on ne connaît que $q(s,\pi(s))$ : impossible d’en déduire $\pi^*(s)=\arg\max_aq(s,a)$. <b>Idée</b> : apprendre $q(s,a)$.</p>
<div class="thm"><b>SARSA</b> (on-policy) : $q(s,a)\leftarrow q(s,a)+\alpha\big[r+\gamma q(s',a')-q(s,a)\big]$. Il faut le quintuplet $(s,a,r,s',a')$ (d’où le nom), avec $a'$ choisie par la politique suivie : un pas d’anticipation, l’exploration est contrainte, preuves de convergence plus difficiles.</div>
<div class="thm"><b>q-learning</b> (Watkins 1989, off-policy) : version stochastique de la q-value iteration
$q_{k+1}(s,a)\leftarrow\sum_{s'}T[R+\gamma\max_{a'}q_k(s',a')]$ où l’on remplace la moyenne sur $T$ par une moyenne glissante sur les échantillons :
$$q(s,a)\leftarrow(1-\alpha)q(s,a)+\alpha\big[r+\gamma\max_{a'}q(s',a')\big]=q(s,a)+\alpha\Delta(s,a).$$</div>
<p>Pas besoin de connaître $a'$ ; peu importe la politique utilisée pour collecter les échantillons : on apprend $\pi^*$ <b>sans la suivre</b>.</p>
<div class="def"><b>Convergence</b> $q_k\to q^*$ si : $S$ et $A$ finis ; chaque $(s,a)$ visité une infinité de fois ; $\sum_k\alpha_k=\infty$ et $\sum_k\alpha_k^2<\infty$ (conditions de Robbins-Monro ; le slide n’affiche que la seconde) ; $\gamma<1$, ou un état absorbant de récompense nulle si $\gamma=1$.</div>
<p>Convergence lente : au début, marche au hasard ; les valeurs non nulles ne se propagent qu’une fois une récompense atteinte, et de voisin en voisin. $\alpha$ petit mais pas trop.</p>
<p><b>Actor-critic</b> : la valeur seule ne dit pas quelle action prendre. On maintient un <b>acteur</b> (la politique) et un <b>critique</b> (la valeur) : $\delta_t=R_{t+1}+\gamma v(s_{t+1})-v(s_t)>0$ encourage l’action, $<0$ la décourage.</p>`,
      },
      {
        id: 'rl-explore', title: 'Exploration vs exploitation : ε-greedy, softmax', slides: 'RL2 50-57',
        summary: 'Glouton : n’explore jamais. ε-greedy : π(a*|s) = ε/m + 1 − ε. Softmax (Boltzmann) : p(a) ∝ exp(β q(a)), température τ = 1/β.',
        fiche: R`
<p><b>Glouton</b> : $a^*=\arg\max_aq_t(s,a)$, pure exploitation : on peut manquer des actions précieuses.</p>
<div class="def"><b>ε-greedy</b> parmi $m$ actions :
$$\pi(a\mid s)=\begin{cases}\frac\epsilon m+1-\epsilon&\text{si }a=a^*\\\frac\epsilon m&\text{sinon}\end{cases}$$
Simple, et avec des garanties d’amélioration de la politique.</div>
<p>Bandit à 10 bras sur 2000 tâches : le glouton ne trouve l’action optimale que dans environ 1/3 des cas (ses premiers essais de la bonne action ont déçu et il ne la retente plus) ; ε-greedy fait mieux car il continue d’explorer. Ça dépend de la variance : forte variance, ε-greedy meilleur ; variance nulle, le glouton trouve plus vite ; récompenses non stationnaires, le glouton échoue.</p>
<p>Défauts d’ε-greedy : explore toutes les actions avec la même probabilité, y compris les très mauvaises. Remèdes : diminuer $\epsilon$ au cours du temps, ou une fonction d’exploration.</p>
<div class="def"><b>Softmax (Boltzmann)</b> : $p(a)=\dfrac{e^{\beta q_t(a)}}{\sum_be^{\beta q_t(b)}}$, température $\tau=1/\beta$. $\tau\to0$ : glouton ; $\tau\to\infty$ : uniforme. Difficile de choisir $\tau$ sans connaissance supplémentaire.</div>`,
      },
      {
        id: 'rl-approx', title: 'q-learning approché', slides: 'RL3 6-23',
        summary: 'Trop d’états pour une table : q̂(s,a,w) = Σ wi fi(s,a). Mise à jour wi ← wi + α Δ fi(s,a) : on « blâme » les features actives. C’est une descente de gradient sur l’erreur au carré.',
        fiche: R`
<p>Si la table $(s,a)$ est trop grande : impossible de visiter tous les états, presque chaque état est nouveau, et la mémoire ne suit pas. Tic-tac-toe 5478 états, backgammon $\approx10^{20}$, échecs $\approx10^{120}$, go $10^{170}$ à $10^{360}$, robots : continu. PacMan « MediumClassic » : bien plus de $10^{73}$ états. En q-learning naïf, trois états quasi identiques sont appris séparément : il faut <b>généraliser</b>.</p>
<div class="def"><b>Approximation de fonction</b> : $\hat v(s,w)\approx v_\pi(s)$ avec $w\in\mathbb R^d$, $d\ll|S|$ ; par exemple $\hat q(s,a,w)=\sum_iw_if_i(s,a)$ (combinaison linéaire de features), ou un réseau de neurones.</div>
<p>Features PacMan : distance au fantôme le plus proche, au point le plus proche, nombre de fantômes, dans un tunnel ?, $1/d^2$… Demande une <b>expertise</b> du problème. Défaut : des états aux mêmes features peuvent avoir des valeurs très différentes (fantôme mangeable ou non). Et les données ne sont ni stationnaires (la politique change) ni i.i.d. ($S_t$ et $S_{t+1}$ corrélés).</p>
<div class="thm"><b>q-learning approché</b> (Gordon 1996) : $\Delta=\big[r+\gamma\max_{a'}q(s',a')\big]-q(s,a)$, puis pour chaque feature $w_i\leftarrow w_i+\alpha\,\Delta\,f_i(s,a)$. Si la q-valeur baisse, on blâme les features actives.</div>
<p><b>Exemple</b> : $q=4f_{DOT}-1f_{GST}$. Action Nord : point à distance 2 ($f_{DOT}=1/2$), fantôme à distance 1 ($f_{GST}=1$), donc $q=1$. PacMan meurt : $r=-500$, $q(s',\cdot)=0$, $\Delta=-501$, d’où $w_{DOT}\leftarrow4-501\alpha\cdot\frac12$ et $w_{GST}\leftarrow-1-501\alpha$.</p>
<p><b>Lien avec la régression</b> : pour $\hat y=w_0+w_1f_1(x)$ et l’erreur $\sum(y-\hat y)^2$, la descente de gradient donne $w_1\leftarrow w_1+\alpha(y-\hat y)f_1(x)$ : même forme, avec cible $=r+\gamma\max q(s',\cdot)$ et prédiction $=q(s,a)$.</p>`,
      },
      {
        id: 'rl-dqn', title: 'Deep Q-Network et ses astuces', slides: 'RL3 25-60',
        summary: 'Un réseau approxime q(s,a,w). Instable car la cible bouge et les données sont corrélées : experience replay, réseau cible gelé, clipping des récompenses ; puis double DQN, dueling, replay priorisé, noisy nets.',
        fiche: R`
<p><b>Deep RL</b> : un réseau profond apprend lui-même les features. Atari (Mnih et al. 2013, Nature 2015) : apprendre à jouer à partir des <b>pixels</b>, même architecture pour tous les jeux. Entrée : les 4 dernières images 84×84 ($256^{84\cdot84\cdot4}$ états possibles), sortie : $q(s,a_i)$ pour les 18 positions du joystick, réseau convolutif. Off-policy, model-free, des semaines d’entraînement. Justification : <b>approximateur universel</b> (Hornik 1989). TD-Gammon (Tesauro 1992) : une couche cachée, 1,5 million de parties contre soi-même, bat le champion.</p>
<div class="def"><b>Perte du q-learning profond</b> :
$$L(w)=\mathbb E\Big[\big(\underbrace{r+\gamma\max_{a'}q(s',a',w)}_{\text{cible}}-\underbrace{q(s,a,w)}_{\text{réseau}}\big)^2\Big],$$
minimisée par descente de gradient stochastique. NFQ (Riedmiller 2005) : une sortie par action, le max en une seule passe (actions discrètes).</div>
<p><b>Pourquoi c’est instable</b> : en supervisé la cible est fixe, ici elle <b>bouge</b> (le réseau produit ses propres cibles et ses actions décident des données) ; échantillons successifs corrélés ; la politique change brutalement avec de petites variations de $q$ ; échelle des récompenses inconnue (gradients énormes) ; le max surestime.</p>
<div class="thm"><b>Les trois astuces du DQN</b>
<ol><li><b>Experience replay</b> : stocker les transitions $(s_t,a_t,r_{t+1},s_{t+1})$ dans une mémoire $D$ et entraîner sur des mini-lots tirés au hasard : casse les corrélations, réutilise les échantillons.</li>
<li><b>Réseau cible gelé</b> : cible calculée avec des poids $w^A$ figés pendant une période, réseau en ligne $w^B$ mis à jour ; puis $w^A\leftarrow w^B$.</li>
<li><b>Clipping</b> des récompenses dans $[-1,1]$ : gradients bien conditionnés, mais on ne distingue plus petites et grandes récompenses.</li></ol></div>
<p><b>Plus d’astuces</b> : <b>Double DQN</b> (le réseau en ligne choisit l’action, le réseau cible l’évalue : cible $r+\gamma q(s',\arg\max_aq(s',a,w^B),w^A)$, contre la surestimation) ; <b>Dueling</b> ($q=v(s)+A(s,a)-\max_{a'}A(s,a')$, avec l’avantage $A=q-v$, réduit la variance) ; <b>replay priorisé</b> (échantillonner selon l’erreur TD) ; <b>noisy networks</b> (bruit dans les poids pour explorer).</p>`,
      },
      {
        id: 'rl-pg', title: 'Policy gradient et actor-critic', slides: 'RL3 61-65',
        summary: 'Paramétrer directement la politique πθ(s,a) = P[a|s,θ] (politiques stochastiques, actions continues). Actor-critic : l’acteur agit, le critique note avec δt. A2C, A3C.',
        fiche: R`
<p>Jusqu’ici on approchait $v_\theta$ ou $q_\theta$ et on en déduisait une politique (ε-greedy) : impossible d’apprendre explicitement une politique <b>stochastique</b>, et peu adapté aux actions <b>continues</b>.</p>
<div class="def"><b>Policy gradient</b> : paramétrer directement $\pi_\theta(s,a)=\mathbb P[a\mid s,\theta]$ (par ex. un réseau) et maximiser $\mathbb E[R_1+\gamma R_2+\gamma^2R_3+\dots]$ par gradient stochastique. Le gradient demande généralement une estimation de la q-valeur de la politique courante.</div>
<div class="thm"><b>Actor-critic</b> (Mnih et al. 2016) : deux réseaux. L’<b>acteur</b> $\pi(s,u)$ choisit les actions ; le <b>critique</b> $q(s,a,w)$ les évalue avec
$$\delta_t=R_{t+1}+\gamma q(s_{t+1},a,w)-q(s_t,a,w).$$
$\delta_t>0$ : encourager l’action ; $\delta_t<0$ : la décourager. Le gradient remonte du critique vers l’acteur.</div>
<p><b>A2C</b> (Advantage Actor-Critic) et <b>A3C</b> (asynchrone) : policy gradient on-policy sans replay buffer ; plusieurs agents en parallèle explorent différentes parties de l’environnement et entraînent les paramètres de façon asynchrone.</p>
<p class="muted">Références : Sutton et Barto ; Kaelbling, Littman, Moore 1996 ; Mnih et al. 2013, 2015 ; Silver et al. 2017 ; cours Berkeley CS188 et Stanford CS234.</p>`,
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
    ],

    gens: {
      'rl-return': [
        () => {
          const g = pick([0.5, 0.8, 0.9]), rs = Array.from({ length: 4 }, () => pick([0, 1, 2, -1, 5]));
          const G = rs.reduce((s, r, i) => s + r * g ** i, 0);
          return { q: R`Récompenses $R_{t+1..t+4}=(${rs.join(' ; ')})$ puis 0. Retour $G_t$ avec $\gamma=${f(g, 1)}$ ? (3 décimales)`, a: G, tol: 0.001,
            expl: R`$G_t=${rs.map((r, i) => `${r}\times${f(g, 1)}^{${i}}`).join('+')}=${f(G)}$.` };
        },
        () => { const g = pick([0.5, 0.8, 0.9, 0.95, 0.99]), r = pick([1, 2, 10]); return { q: R`$R_{\max}=${r}$, $\gamma=${f(g, 2)}$. Borne supérieure de $v_\pi(s)$ ?`, a: r / (1 - g), tol: 0.01, expl: R`$R_{\max}/(1-\gamma)=${r}/${f(1 - g, 2)}=${f(r / (1 - g), 2)}$.` }; },
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
      ],
      'rl-pi': [
        () => {
          const g = pick([0.5, 0.6, 0.8]);
          const vc = 1 / (1 - g), vw = (1 + 0.5 * g * vc) / (1 - 0.5 * g);
          return { q: R`Voiture du cours, politique « toujours Slow », $\gamma=${f(g, 1)}$. Valeur $v^{\pi}(w)$ ? (évaluation exacte, 3 décimales)`, a: vw, tol: 0.002,
            expl: R`$v(c)=1+\gamma v(c)\Rightarrow v(c)=${f(vc)}$ ; $v(w)=0{,}5(1+\gamma v(c))+0{,}5(1+\gamma v(w))\Rightarrow v(w)=\frac{1+0{,}5\gamma v(c)}{1-0{,}5\gamma}=${f(vw)}$.` };
        },
      ],
      'rl-td': [
        () => {
          const v = pick([0, 1, 2, 3]), vn = pick([0, 2, 4, 5]), r = pick([-1, 0, 1, 2]), a = pick([0.1, 0.5]), g = pick([0.9, 1]);
          const nv = v + a * (r + g * vn - v);
          return { q: R`TD(0) : $v(s)=${v}$, transition vers $s'$ avec $r=${r}$, $v(s')=${vn}$, $\alpha=${f(a, 1)}$, $\gamma=${f(g, 1)}$. Nouvelle valeur $v(s)$ ?`, a: nv, tol: 0.001,
            expl: R`$v(s)+\alpha[r+\gamma v(s')-v(s)]=${v}+${f(a, 1)}\times(${f(r + g * vn - v, 2)})=${f(nv)}$.` };
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
      ],
      'rl-explore': [
        () => { const e = pick([0.05, 0.1, 0.2, 0.3]), m = rnd(2, 6); return { q: R`ε-greedy avec $\epsilon=${f(e, 2)}$ et ${m} actions : probabilité de choisir l’action gloutonne ? (3 décimales)`, a: e / m + 1 - e, tol: 0.001, expl: R`$\frac\epsilon m+1-\epsilon=${f(e / m + 1 - e)}$.` }; },
        () => {
          const qs = [1, 2, 3].map(() => pick([0, 1, 2])), b = pick([0.5, 1, 2]);
          const z = qs.reduce((s, x) => s + Math.exp(b * x), 0), p = Math.exp(b * qs[0]) / z;
          return { q: R`Softmax, $\beta=${f(b, 1)}$, $q=(${qs.join(' ; ')})$. Probabilité de la première action ? (3 décimales)`, a: p, tol: 0.002, expl: R`$\frac{e^{${f(b * qs[0], 1)}}}{${qs.map(x => `e^{${f(b * x, 1)}}`).join('+')}}=${f(p)}$.` };
        },
      ],
      'rl-approx': [
        () => {
          const wd = pick([2, 4]), wg = pick([-1, -2]), dd = pick([1, 2, 4]), dg = pick([1, 2]), r = pick([-500, -100, 10]), a = pick([0.001, 0.01]);
          const fd = 1 / dd, fg = 1 / dg, q = wd * fd + wg * fg, delta = r - q;
          return { q: R`$q(s,a)=w_{DOT}f_{DOT}+w_{GST}f_{GST}$ avec $w=(${wd} ; ${wg})$, $f_{DOT}=1/${dd}$, $f_{GST}=1/${dg}$. Transition terminale ($q(s',\cdot)=0$) avec $r=${r}$, $\alpha=${a}$. Nouveau $w_{DOT}$ ? (4 décimales)`, a: wd + a * delta * fd, tol: 0.0002,
            expl: R`$q=${f(q)}$, $\Delta=${r}-${f(q)}=${f(delta)}$ ; $w_{DOT}\leftarrow${wd}+${a}\times${f(delta)}\times${f(fd)}=${f(wd + a * delta * fd, 4)}$.` };
        },
      ],
    },
  });
})();
