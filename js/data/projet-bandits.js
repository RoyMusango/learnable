// Espace Projet · Bandits pour la vérification sous budget.
// Source : cours Advanced Machine Learning, chapitre Bandit problems (X. Siebert, bandits_en_V2.pdf, 97 slides).
// Les fiches de révision du chapitre sont dans bandits.js ; ici, chaque notion est reprise sous l'angle du projet :
// répartir un budget de vérifications entre plusieurs files de liens suspects.
// Le cadrage TFE est une proposition, aucun chiffre de ce fichier n'est un résultat mesuré.
(function () {
  const R = String.raw;
  const { pick, rnd, f } = COURSE.u;

  COURSE.add({
    id: 'pj-bd',
    space: 'projet',
    title: 'Bandits pour la vérification',
    short: 'Bandits (projet)',
    source: 'bandits_en_V2.pdf (X. Siebert) · appliqué au projet',
    seen: null,
    pitch: 'Apprendre ou trouver ? Quand chaque vérification doit à la fois rapporter et informer, l’apprentissage actif rejoint le problème du bandit.',
    sections: [
      {
        id: 'pb-1', title: 'Trouver ou apprendre : le pont avec l’apprentissage actif', slides: '3 à 21', minutes: 12,
        summary: 'Un analyste qui vérifie des liens veut en trouver de faux maintenant (exploiter) et apprendre où chercher (explorer) : c’est un bandit.',
        fiche: R`
<h4 class="pj-idee">L’idée</h4>
<p>Imagine quatre piles de liens suspects : les liens déclarés par une seule source, les liens récents, les liens vers une entité en détresse, et ceux sur lesquels tes trois approches se contredisent. Chaque jour, l’analyste peut vérifier un lien. Il veut trouver le plus de liens falsifiés possible, mais il ne sait pas quelle pile en contient le plus. S’il ne pioche que dans la pile qui a marché hier, il ne découvrira jamais qu’une autre est meilleure. S’il pioche partout au hasard, il gaspille ses vérifications. C’est le dilemme du <b>bandit manchot</b> : choisir entre plusieurs machines à sous dont on ne connaît pas les gains.</p>
<h4 class="pj-methode">Savoir-faire : traduire le problème</h4>
<table><tr><th>Bandit (cours)</th><th>Projet</th></tr>
<tr><td>bras $a\in\{1,\dots,K\}$</td><td>une file de liens suspects (une heuristique de priorisation)</td></tr>
<tr><td>tirer le bras $A_t$</td><td>vérifier un lien pris dans la file $A_t$</td></tr>
<tr><td>récompense $X_t\in\{0,1\}$</td><td>1 si le lien vérifié est falsifié</td></tr>
<tr><td>moyenne $\mu_a$</td><td>proportion de liens falsifiés dans la file $a$</td></tr>
<tr><td>horizon $n$</td><td>le budget de vérifications $B$</td></tr></table>
<p>Avec des récompenses 0 ou 1, c’est le « casino de Bernoulli » du cours (slide 16).</p>
<h4 class="pj-formel">Version précise</h4>
<p>Le cours suppose un bandit <b>stochastique stationnaire</b> : la récompense du bras $a$ suit une loi $\nu_a$ fixe, i.i.d., indépendante du passé (slide 13). Le projet viole cette hypothèse de deux façons, à déclarer :</p>
<ul><li>le pool est <b>fini</b> : chaque lien falsifié trouvé est retiré, donc $\mu_a$ baisse au fil des vérifications (tirage sans remise) ;</li>
<li>un falsificateur <b>adaptatif</b> peut réagir à la stratégie de vérification (section pb-7).</li></ul>
<p>Différence avec l’apprentissage actif : l’actif cherche le meilleur <b>modèle</b> après le budget, le bandit cherche la meilleure <b>somme de récompenses</b> pendant le budget. La section pb-6 montre un troisième objectif, identifier la meilleure file.</p>
<h4 class="pj-tfe">Banque et TFE</h4>
<p>Une banque répartit déjà son effort de revue entre des files d’alertes (montants inhabituels, pays à risque, changements d’actionnariat). Décider combien d’analystes affecter à chaque file, en apprenant laquelle rapporte le plus, est un problème de bandit réel.</p>
<div class="def"><b>À retenir</b><ul><li>Bras = file de liens suspects ; récompense = lien falsifié trouvé ; horizon = budget.</li><li>Actif : apprendre un modèle. Bandit : maximiser les trouvailles pendant le budget.</li><li>Pool fini et adversaire violent l’hypothèse stochastique stationnaire.</li></ul></div>`,
      },
      {
        id: 'pb-2', title: 'Le regret, et pourquoi l’exploitation pure échoue', slides: '18 à 35, 57 à 60', minutes: 14,
        summary: 'Le regret compte ce qu’on a perdu par rapport à la meilleure file. Suivre le meneur ou ε-greedy à ε fixe donne un regret linéaire.',
        fiche: R`
<h4 class="pj-idee">L’idée</h4>
<p>Le regret, c’est le nombre de liens falsifiés que tu n’as pas trouvés parce que tu ne vérifiais pas dans la meilleure file. Une bonne stratégie fait croître ce regret de plus en plus lentement ; une mauvaise le fait croître proportionnellement au budget.</p>
<h4 class="pj-methode">Savoir-faire</h4>
<p>Écart du bras $a$ : $\Delta_a=\mu^*-\mu_a$. Décomposition du regret (slide 74) :</p>
<p>$$R_n=\sum_{a=1}^{K}\Delta_a\,\mathbb E[N_a(n)]$$</p>
<p>où $N_a(n)$ est le nombre de tirages du bras $a$. Pour réduire le regret, il faut tirer peu les bras sous-optimaux.</p>
<p><b>Exemple calculé.</b> Trois files, $\mu=(0{,}20 ; 0{,}12 ; 0{,}05)$, budget 100, la stratégie a tiré 60, 25 et 15 fois. Regret : $0\times60+0{,}08\times25+0{,}15\times15=2+2{,}25=4{,}25$ liens falsifiés manqués en moyenne.</p>
<p><b>Exploitation pure</b> (« follow the leader ») : si le premier tirage du meilleur bras donne 0 et celui d’un autre bras donne 1, on reste sur le mauvais bras. Dans un casino de Bernoulli à deux bras, le regret croît comme $(1-\mu_1)\,\mu_2\,(\mu_1-\mu_2)\,n$ : linéairement (slides 34 et 35, où $\mu_1$ est le meilleur bras). La slide écrit $(\mu_2-\mu_1)$, ce qui donnerait un regret négatif : il s’agit vraisemblablement d’une inversion, le facteur à retenir est l’écart $\Delta=\mu_1-\mu_2>0$. À confirmer avec le Prof. Siebert.</p>
<p><b>ε-greedy</b> : avec probabilité $\varepsilon$ on explore au hasard, sinon on exploite. À $\varepsilon$ fixe, on explore une fraction fixe du temps, donc le regret reste linéaire. Un $\varepsilon$ décroissant aide, mais son calendrier est difficile à régler (slide 60).</p>
<h4 class="pj-formel">Version précise</h4>
<p>Un algorithme est dit « efficace » s’il a un regret sous-linéaire pour tout problème de bandit (slide 35). La borne inférieure de Lai et Robbins (1985) montre qu’on ne peut pas faire mieux qu’un regret logarithmique en $n$ sur tous les problèmes (slides 49 à 56) : c’est la référence que visent UCB et Thompson.</p>
<h4 class="pj-tfe">Banque et TFE</h4>
<p>Dans le projet, le regret se traduit directement en langage métier : « avec la stratégie X, on rate en moyenne N liens falsifiés de plus qu’avec la meilleure file connue après coup ». C’est un chiffre qu’un responsable conformité comprend.</p>
<div class="def"><b>À retenir</b><ul><li>$R_n=\sum_a\Delta_a\,\mathbb E[N_a(n)]$.</li><li>Exploitation pure et ε-greedy à ε fixe : regret linéaire.</li><li>Objectif : regret logarithmique (Lai et Robbins).</li></ul></div>`,
      },
      {
        id: 'pb-3', title: 'Explore-Then-Commit : une phase pilote', slides: '37 à 48', minutes: 14,
        summary: 'Vérifier m liens dans chaque file, puis ne plus vérifier que dans la meilleure. Simple, mais m dépend d’un écart Δ inconnu.',
        fiche: R`
<h4 class="pj-idee">L’idée</h4>
<p>C’est la démarche d’un pilote : on teste chaque file sur quelques dizaines de liens, on garde la meilleure, et on y consacre tout le reste du budget. Toute la difficulté est de choisir la taille du pilote.</p>
<h4 class="pj-methode">Savoir-faire</h4>
<ol><li>Exploration : tirer chacun des $K$ bras $m$ fois ($Km\le n$).</li>
<li>Engagement : choisir $\hat a=\arg\max_a\hat\mu_a(m)$ et ne plus tirer que lui.</li></ol>
<p>Le nombre de tirages d’un bras sous-optimal vérifie $\mathbb E[N_a(n)]\le m+n\,e^{-\Delta_a^2 m/2}$ (Hoeffding, slides 41 à 44). En optimisant $m$ (deux bras, écart $\Delta$) :</p>
<p>$$m^*=\frac{2}{\Delta^2}\log\!\left(\frac{n\Delta^2}{2}\right),\qquad R(n)\le\frac{2}{\Delta}\left(\log\frac{n\Delta^2}{2}+1\right)$$</p>
<p><b>Exemple calculé.</b> $\Delta=0{,}10$, $n=1\,000$ : $n\Delta^2/2=5$, $m^*=200\times\ln 5\approx322$ vérifications par file. Avec deux files, le pilote consomme environ 644 vérifications sur 1 000 : l’écart est petit, il faut beaucoup de données pour le voir.</p>
<h4 class="pj-formel">Version précise</h4>
<p>Le regret devient logarithmique en $n$, mais <b>il faut connaître $\Delta$</b> à l’avance pour régler $m$, ce qui n’est pas réaliste (slide 46). La version séquentielle explore jusqu’à ce que l’écart empirique dépasse un seuil, de l’ordre de $\sqrt{4\log(n/t)/t}$ (slide 47), puis s’engage.</p>
<h4 class="pj-tfe">Banque et TFE</h4>
<p>ETC est la stratégie la plus facile à défendre devant un comité : « pilote de m dossiers par file, puis on industrialise ». Le calcul de $m^*$ montre aussi pourquoi un pilote trop court (20 dossiers) départage mal deux files de qualités proches.</p>
<div class="def"><b>À retenir</b><ul><li>Explorer $m$ fois chaque bras, puis s’engager.</li><li>$m^*$ grandit comme $1/\Delta^2$ : deux files proches demandent un long pilote.</li><li>Limite : $\Delta$ inconnu.</li></ul></div>`,
      },
      {
        id: 'pb-4', title: 'UCB : l’optimisme face à l’incertitude', slides: '61 à 79', minutes: 16,
        summary: 'Vérifier dans la file dont la borne supérieure de confiance est la plus haute : une file peu testée garde le bénéfice du doute.',
        fiche: R`
<h4 class="pj-idee">L’idée</h4>
<p>On donne à chaque file une note optimiste : sa moyenne observée, plus un bonus d’autant plus grand qu’on l’a peu testée. On vérifie dans la file la mieux notée. Une file négligée voit son bonus grandir avec le temps et finit par être retestée ; une file souvent testée a un bonus faible et n’est choisie que si elle est vraiment bonne.</p>
<h4 class="pj-methode">Savoir-faire</h4>
<p>UCB1 (Auer et al., 2002, slide 71) :</p>
<p>$$A_{t+1}=\arg\max_a\ \underbrace{\hat\mu_a(t)}_{\text{exploitation}}+\underbrace{\sqrt{\frac{2\log t}{N_a(t)}}}_{\text{bonus d’exploration}}$$</p>
<p><b>Exemple calculé.</b> $t=100$, $\ln 100=4{,}605$. File A : 60 tirages, $\hat\mu=0{,}20$, bonus $\sqrt{9{,}21/60}=0{,}392$, indice $0{,}592$. File B : 10 tirages, $\hat\mu=0{,}10$, bonus $\sqrt{9{,}21/10}=0{,}960$, indice $1{,}060$. UCB choisit B, bien que sa moyenne soit plus basse : elle est trop peu testée pour être écartée.</p>
<p>Construction (slides 64 à 70) : par Hoeffding, $\mathbb P\big(\mu_a\le\hat\mu_a(t)+\sqrt{\log t/N_a(t)}\big)\ge1-1/t$. Avec $\delta=1/t^\alpha$, l’indice devient $\hat\mu_a(t)+\sqrt{\alpha\log t/(2N_a(t))}$ (slide 73).</p>
<h4 class="pj-formel">Version précise</h4>
<p>Pour tout bras sous-optimal, le cours donne $\mathbb E[N_a(n)]\le\frac{\log n}{2\Delta_a^2}+C$ (slide 75) et, dans la preuve, $N_a(t)<\frac{2\alpha\log n}{\Delta_a^2}$ (slide 79). Le regret moyen est donc en $O(\log n)$. La pénalité $1/\Delta_a^2$ devient très grande quand deux bras sont proches, mais tirer le second meilleur bras coûte alors peu (slide 79).</p>
<h4 class="pj-tfe">Banque et TFE</h4>
<p>UCB est une règle explicable : « on vérifie la file B parce qu’elle n’a été testée que 10 fois ; on ne peut pas encore exclure qu’elle soit la meilleure ». Ce type de justification est précieux face à un auditeur ou à un régulateur qui demande pourquoi tel dossier a été revu plutôt qu’un autre.</p>
<div class="def"><b>À retenir</b><ul><li>Indice UCB1 : $\hat\mu_a+\sqrt{2\log t/N_a}$.</li><li>$\mathbb E[N_a(n)]=O(\log n/\Delta_a^2)$, regret $O(\log n)$.</li><li>Une file peu testée garde le bénéfice du doute.</li></ul></div>`,
      },
      {
        id: 'pb-5', title: 'Thompson sampling : la fiabilité d’une file comme loi Bêta', slides: '80 à 94', minutes: 16,
        summary: 'Garder pour chaque file une loi Bêta sur sa proportion de liens falsifiés, tirer une valeur dans chaque loi et vérifier dans la file au plus grand tirage.',
        fiche: R`
<h4 class="pj-idee">L’idée</h4>
<p>Au lieu d’une note unique, on garde pour chaque file une croyance : « la proportion de liens falsifiés dans cette file est probablement autour de 15 %, mais je n’en suis pas sûr ». À chaque vérification, on imagine une valeur plausible pour chaque file, on choisit celle qui a la meilleure valeur imaginée, et on met à jour la croyance avec le résultat.</p>
<h4 class="pj-methode">Savoir-faire</h4>
<p>Pour des récompenses 0/1, la loi Bêta est conjuguée à la loi de Bernoulli (slides 93 et 94). Avec un a priori $\text{Bêta}(1,1)$ (uniforme), après $N_a$ tirages dont $S_a$ succès :</p>
<p>$$\pi_a(t)=\text{Bêta}\big(S_a(t)+1,\ N_a(t)-S_a(t)+1\big)$$</p>
<p>Algorithme (slide 90) : tirer $\theta_a(t)\sim\pi_a(t)$ pour chaque bras, jouer $A_{t+1}=\arg\max_a\theta_a(t)$, observer $X$, puis $\text{Bêta}(\alpha,\beta)\to\text{Bêta}(\alpha+X,\ \beta+1-X)$.</p>
<p><b>Exemple calculé.</b> File A : 40 vérifications, 8 falsifiés : $\text{Bêta}(9, 33)$, moyenne $9/42=0{,}214$. File B : 5 vérifications, 1 falsifié : $\text{Bêta}(2, 5)$, moyenne $2/7=0{,}286$, mais très étalée. Thompson choisira souvent B tant que sa loi reste large ; si la vérification suivante de B ne trouve rien, B passe à $\text{Bêta}(2, 6)$, moyenne $0{,}25$.</p>
<h4 class="pj-formel">Version précise</h4>
<p>Moyenne d’une $\text{Bêta}(\alpha,\beta)$ : $\alpha/(\alpha+\beta)$. Plus le bras est tiré, plus sa loi a posteriori est concentrée (slides 87 et 88). Thompson sampling atteint la borne inférieure de Lai et Robbins pour des récompenses binaires, quel que soit l’a priori (Kaufmann et al., 2012, cité slide 94). Sa philosophie est plus « pessimiste » qu’UCB : on tire un modèle plausible au lieu du meilleur modèle possible (slide 91).</p>
<h4 class="pj-tfe">Banque et TFE</h4>
<p>La loi Bêta donne au banquier ce qu’il demande souvent : une estimation <b>avec son incertitude</b> (« cette file contient entre 10 % et 30 % de liens falsifiés »). C’est aussi une façon propre d’intégrer un avis d’expert comme a priori, par exemple $\text{Bêta}(2, 8)$ si les analystes estiment qu’environ un lien sur cinq de telle file est douteux.</p>
<div class="def"><b>À retenir</b><ul><li>A priori Bêta, vraisemblance Bernoulli : a posteriori $\text{Bêta}(S+1, N-S+1)$.</li><li>Tirer $\theta_a\sim\pi_a$, jouer le maximum, mettre à jour.</li><li>Atteint la borne de Lai et Robbins (récompenses binaires).</li></ul></div>`,
      },
      {
        id: 'pb-6', title: 'Identifier la meilleure stratégie de vérification', slides: '96 et 97', minutes: 12,
        summary: 'Parfois le but n’est pas de trouver des liens pendant le test, mais de désigner avec confiance la meilleure file à industrialiser.',
        fiche: R`
<h4 class="pj-idee">L’idée</h4>
<p>Avant de déployer une stratégie de revue sur toute la banque, on fait une étude : on ne cherche pas à trouver le maximum de fraudes pendant l’étude, on cherche à <b>désigner la meilleure stratégie</b> avec une confiance donnée, en le moins de vérifications possible. C’est l’analogue de l’essai clinique qui cherche le meilleur traitement plutôt qu’à soigner le maximum de patients pendant l’essai (slide 96).</p>
<h4 class="pj-methode">Savoir-faire</h4>
<p>Choisir un risque $\delta\in]0,1[$ proche de 0, puis définir trois règles (slide 97) :</p>
<ol><li><b>échantillonnage</b> : quel bras $A_t$ tirer à l’instant $t$ ;</li>
<li><b>arrêt</b> : à quel instant $\tau$ on s’arrête, parce qu’on pense avoir trouvé le meilleur bras ;</li>
<li><b>recommandation</b> : $\hat a_\tau=\arg\max_a\hat\mu_a(\tau)$.</li></ol>
<p>Objectif : $\mathbb P(\hat a_\tau=a^*)\ge1-\delta$ avec $\mathbb E[\tau]$ petit.</p>
<h4 class="pj-formel">Version précise</h4>
<p>Ressemble à de l’exploration pure, mais le critère n’est plus le gain cumulé : c’est la probabilité de bonne recommandation et le coût de l’étude. Trois objectifs sont donc à distinguer dans le projet : apprendre un modèle (apprentissage actif), maximiser les trouvailles pendant le budget (regret), identifier la meilleure stratégie (meilleur bras). Les mélanger rend une expérience illisible.</p>
<h4 class="pj-tfe">Banque et TFE</h4>
<p>Pour le TFE, la question RQ2 (« laquelle permet de détecter la manipulation ? ») est une question d’identification du meilleur bras : on compare des stratégies pour en recommander une. Le $\delta$ choisi et le nombre de vérifications nécessaires sont des chiffres à donner au promoteur.</p>
<div class="def"><b>À retenir</b><ul><li>Règles d’échantillonnage, d’arrêt et de recommandation.</li><li>$\mathbb P(\hat a_\tau=a^*)\ge1-\delta$ avec $\mathbb E[\tau]$ petit.</li><li>Trois objectifs distincts : apprendre, trouver, identifier.</li></ul></div>`,
      },
      {
        id: 'pb-7', title: 'Les limites : pool fini et falsificateur adaptatif', slides: '13', minutes: 10,
        summary: 'Les garanties du cours supposent des récompenses i.i.d. stationnaires ; un pool fini et un adversaire qui s’adapte cassent cette hypothèse.',
        fiche: R`
<h4 class="pj-idee">L’idée</h4>
<p>Toutes les garanties vues (ETC, UCB, Thompson) supposent que chaque file garde la même qualité au fil du temps. Dans le projet, ce n’est pas vrai : quand tu as trouvé les liens falsifiés d’une file, il en reste moins ; et un falsificateur qui comprend ta stratégie déplacera ses faux liens vers la file que tu vérifies le moins.</p>
<h4 class="pj-methode">Savoir-faire : que faire en pratique</h4>
<ul><li><b>Pool fini</b> : mesurer le regret par rapport à la meilleure stratégie <b>a posteriori</b> sur le même pool, et vérifier empiriquement si UCB et Thompson gardent leur avantage sur le hasard.</li>
<li><b>Adversaire</b> : simuler deux attaquants, l’un qui place ses faux liens au hasard, l’autre qui les place dans la file la moins vérifiée. Comparer les stratégies face aux deux, séparément.</li>
<li>Garder une part d’exploration aléatoire : une stratégie déterministe est la plus facile à contourner.</li></ul>
<h4 class="pj-formel">Version précise</h4>
<p>Le cours traite le bandit stochastique stationnaire (slide 13). La littérature étudie aussi un cadre dit adversarial, où les récompenses peuvent être choisies par un adversaire (par exemple l’algorithme EXP3). Ce cadre est hors du cours : il faut lire la source primaire avant de s’en servir ou de le citer.</p>
<h4 class="pj-tfe">Banque et TFE</h4>
<p>Le simulateur d’attaque adaptatif du stage (E3) se transpose ici : il réécrivait des charges pour tromper le système ; il déplacerait désormais des liens falsifiés vers les files les moins surveillées. Montrer qu’une stratégie résiste (ou non) à cet attaquant est un résultat qui intéressera autant le promoteur qu’une équipe de lutte contre la fraude.</p>
<div class="def"><b>À retenir</b><ul><li>Pool fini : les $\mu_a$ baissent, les garanties ne s’appliquent plus telles quelles.</li><li>Adversaire adaptatif : hors du cadre stochastique du cours.</li><li>Toujours tester contre un attaquant naïf et un attaquant adaptatif, séparément.</li></ul></div>`,
      },
    ],
    cards: [
      ['pb-1', 'traduction', R`Dans le projet, que représentent un bras, une récompense et l’horizon ?`, R`Bras : une file de liens suspects. Récompense : 1 si le lien vérifié est falsifié. Horizon : le budget de vérifications.`],
      ['pb-1', 'actif-vs-bandit', R`Différence d’objectif entre apprentissage actif et bandit ?`, R`Actif : le meilleur modèle après le budget. Bandit : la meilleure somme de récompenses pendant le budget.`],
      ['pb-2', 'regret', R`Décomposition du regret ?`, R`$R_n=\sum_a\Delta_a\,\mathbb E[N_a(n)]$, avec $\Delta_a=\mu^*-\mu_a$.`],
      ['pb-2', 'ftl', R`Pourquoi l’exploitation pure a-t-elle un regret linéaire ?`, R`Un mauvais premier tirage du meilleur bras peut la fixer définitivement sur un bras sous-optimal.`],
      ['pb-2', 'egreedy', R`Regret d’ε-greedy à ε fixe ?`, R`Linéaire : on explore une fraction ε du temps, même quand le meilleur bras est connu.`],
      ['pb-3', 'etc', R`Principe d’Explore-Then-Commit et sa limite ?`, R`Tirer chaque bras m fois puis ne jouer que le meilleur empirique. Le m optimal, $\frac{2}{\Delta^2}\log\frac{n\Delta^2}{2}$, dépend de l’écart Δ inconnu.`],
      ['pb-4', 'ucb1', R`Indice UCB1 ?`, R`$\hat\mu_a(t)+\sqrt{2\log t/N_a(t)}$ : moyenne empirique plus bonus d’exploration.`],
      ['pb-4', 'ucb-na', R`Borne du cours sur le nombre de tirages d’un bras sous-optimal avec UCB ?`, R`$\mathbb E[N_a(n)]\le\frac{\log n}{2\Delta_a^2}+C$ (slide 75), d’où un regret en $O(\log n)$.`],
      ['pb-5', 'beta', R`A posteriori de Thompson pour un bras de Bernoulli avec a priori Bêta(1,1) ?`, R`$\text{Bêta}(S_a+1,\ N_a-S_a+1)$, $S_a$ succès sur $N_a$ tirages.`],
      ['pb-5', 'ts', R`Étapes de Thompson sampling ?`, R`Tirer $\theta_a\sim\pi_a$ pour chaque bras, jouer $\arg\max_a\theta_a$, mettre à jour la loi du bras joué.`],
      ['pb-6', 'bai', R`Les trois règles d’un algorithme d’identification du meilleur bras ?`, R`Échantillonnage (quel bras tirer), arrêt (quand s’arrêter), recommandation (quel bras désigner). But : $\mathbb P(\hat a_\tau=a^*)\ge1-\delta$ avec $\mathbb E[\tau]$ petit.`],
      ['pb-7', 'limites', R`Deux raisons pour lesquelles les garanties du cours ne s’appliquent pas telles quelles au projet ?`, R`Le pool est fini (les μ baissent quand on trouve les faux liens) et un falsificateur adaptatif viole l’hypothèse stochastique stationnaire.`],
    ],
    quiz: [
      ['pb-1', R`Un analyste veut maximiser le nombre de liens falsifiés trouvés pendant son budget. Quel cadre ?`, ['bandit (minimiser le regret)', 'apprentissage actif', 'identification du meilleur bras', 'apprentissage passif'], 0, R`Le gain se compte pendant le budget : c’est le regret.`],
      ['pb-2', R`ε-greedy avec ε = 0,1 fixe, sur un très long horizon : le regret est…`, ['linéaire', 'logarithmique', 'borné', 'nul'], 0, R`On explore 10 % du temps pour toujours.`],
      ['pb-3', R`Deux files dont les taux diffèrent de Δ = 0,05. Par rapport à Δ = 0,10, le pilote optimal d’ETC est…`, ['environ 4 fois plus long (un peu moins, à cause du log)', '2 fois plus court', 'identique', '2 fois plus long exactement'], 0, R`$m^*\propto\frac{1}{\Delta^2}\log(\cdot)$ : diviser Δ par 2 multiplie le facteur principal par 4, le log diminue légèrement.`],
      ['pb-4', R`File A : 60 tirages, moyenne 0,20. File B : 10 tirages, moyenne 0,10. $t=100$. UCB1 choisit…`, ['B', 'A', 'les deux à égalité', 'aucune'], 0, R`Indices : A $0{,}592$, B $1{,}060$. B est trop peu testée pour être écartée.`],
      ['pb-5', R`File en $\text{Bêta}(3, 7)$. On vérifie un lien : il est falsifié. Nouvelle loi ?`, ['Bêta(4, 7)', 'Bêta(3, 8)', 'Bêta(4, 8)', 'Bêta(3, 7)'], 0, R`Succès : $\alpha+1$.`],
      ['pb-6', R`RQ2 demande quelle approche détecte le mieux la manipulation. Quel objectif de bandit ?`, ['identifier le meilleur bras', 'minimiser le regret', 'maximiser l’entropie', 'apprentissage passif'], 0, R`On veut recommander une stratégie avec confiance, pas maximiser un gain pendant l’étude.`],
      ['pb-7', R`Un falsificateur place ses faux liens dans la file la moins vérifiée. Quelle hypothèse du cours est violée ?`, ['récompenses stochastiques stationnaires', 'récompenses bornées', 'horizon fini', 'K bras'], 0, R`Les récompenses dépendent alors des choix passés de l’agent.`],
    ],
    gens: {
      'pb-2': [
        () => {
          const mu = pick([[0.2, 0.12, 0.05], [0.3, 0.25, 0.1], [0.15, 0.1, 0.02]]), N = pick([[60, 25, 15], [50, 30, 20], [80, 10, 10]]);
          const best = Math.max(...mu), r = mu.reduce((s, m, i) => s + (best - m) * N[i], 0);
          return { q: R`Trois files, $\mu=(${mu.map(x => f(x, 2)).join(' ; ')})$, tirées $(${N.join(' ; ')})$ fois. Regret $\sum_a\Delta_a N_a$ ?`, a: r, tol: 0.01,
            expl: R`$\Delta=(${mu.map(m => f(best - m, 2)).join(' ; ')})$, regret $=${f(r, 2)}$ liens falsifiés manqués en moyenne.` };
        },
      ],
      'pb-3': [
        () => {
          const D = pick([0.05, 0.1, 0.2]), n = pick([1000, 5000, 10000]);
          const m = 2 / D ** 2 * Math.log(n * D ** 2 / 2);
          return { q: R`ETC à deux bras, $\Delta=${f(D, 2)}$, $n=${n}$. Pilote optimal $m^*=\frac{2}{\Delta^2}\ln\frac{n\Delta^2}{2}$ ? (entier le plus proche)`, a: Math.round(m), tol: 1,
            expl: R`$\frac{2}{${f(D * D, 4)}}\ln(${f(n * D * D / 2, 2)})=${f(m, 1)}$ tirages par bras.` };
        },
      ],
      'pb-4': [
        () => {
          const t = pick([50, 100, 200, 500]), N = rnd(5, 40), mu = rnd(5, 40) / 100;
          const u = mu + Math.sqrt(2 * Math.log(t) / N);
          return { q: R`UCB1 : $t=${t}$, $N_a=${N}$, $\hat\mu_a=${f(mu, 2)}$. Indice $\hat\mu_a+\sqrt{2\ln t/N_a}$ ? (3 décimales)`, a: u, tol: 0.003,
            expl: R`Bonus $\sqrt{2\ln ${t}/${N}}=${f(u - mu)}$, indice $${f(u)}$.` };
        },
      ],
      'pb-5': [
        () => {
          const N = rnd(3, 40), S = rnd(0, Math.min(N, 12));
          return { q: R`A priori $\text{Bêta}(1,1)$, ${N} vérifications dont ${S} liens falsifiés. Moyenne a posteriori ? (3 décimales)`, a: (S + 1) / (N + 2), tol: 0.002,
            expl: R`$\text{Bêta}(${S + 1}, ${N - S + 1})$, moyenne $\frac{${S + 1}}{${N + 2}}=${f((S + 1) / (N + 2))}$.` };
        },
      ],
    },
  });
})();
