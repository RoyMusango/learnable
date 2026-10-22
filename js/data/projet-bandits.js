// Espace Projet · Bandits pour la vérification sous budget.
// Source : cours Advanced Machine Learning, chapitre Bandit problems (X. Siebert, bandits_en_V2.pdf, 98 slides).
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
<tr><td>horizon $n$</td><td>le budget de vérifications $B$</td></tr>
<tr><td>historique $H_t$</td><td>la liste des files vérifiées et des résultats obtenus jusqu’au jour $t$</td></tr>
<tr><td>politique $\pi:H_t\mapsto A_{t+1}$</td><td>la règle qui choisit la file du lien suivant à partir de cet historique</td></tr></table>
<p>Avec des récompenses 0 ou 1, c’est le « casino de Bernoulli » du cours (slide 16). Le cours cherche à maximiser l’espérance du gain cumulé $\mathbb E[S_n]=\mathbb E\big[\sum_{t=1}^n X_t\big]$ (slide 18) : $S_n$ est aléatoire, la même stratégie rejouée sur les mêmes files ne trouve pas deux fois le même nombre de liens.</p>
<p><b>Exemple calculé</b> (chiffres construits pour l’exercice). Prenons quatre files de proportions $\mu=(0{,}20 ; 0{,}12 ; 0{,}05 ; 0{,}08)$ et $B=200$. Une stratégie qui vérifie $N_a$ liens dans la file $a$ trouve en moyenne $\sum_a\mu_a N_a$ liens falsifiés.</p>
<ul><li>Répartition uniforme, 50 par file : $50\times(0{,}20+0{,}12+0{,}05+0{,}08)=22{,}5$ liens.</li>
<li>Tout sur la meilleure file, si on la connaissait : $200\times0{,}20=40$ liens.</li></ul>
<p>L’écart de 17,5 liens est exactement le regret de la stratégie uniforme (section pb-2). Toute la difficulté vient de ce qu’on ne connaît pas $\mu$ au départ.</p>
<h4 class="pj-formel">Version précise</h4>
<p>Le cours suppose un bandit <b>stochastique stationnaire</b> : la récompense du bras $a$ suit une loi $\nu_a$ fixe, i.i.d., indépendante du passé (slide 13). Il ajoute trois hypothèses (slide 15) : on n’observe que la récompense du bras tiré, les récompenses de chaque bras sont i.i.d., elles sont bornées. Dans le projet, la première se traduit simplement : vérifier un lien de la file A ne dit rien du taux de la file B. L’hypothèse i.i.d. stationnaire, elle, est violée de deux façons, à déclarer :</p>
<ul><li>le pool est <b>fini</b> : chaque lien falsifié trouvé est retiré, donc $\mu_a$ baisse au fil des vérifications (tirage sans remise) ;</li>
<li>un falsificateur <b>adaptatif</b> peut réagir à la stratégie de vérification (section pb-7).</li></ul>
<p>Différence avec l’apprentissage actif : l’actif cherche le meilleur <b>modèle</b> après le budget, le bandit cherche la meilleure <b>somme de récompenses</b> pendant le budget. Le cours cite aussi un troisième objectif, identifier le meilleur bras (slide 11, section pb-6).</p>
<p><b>Piège</b> : un bras est une file, pas un lien. On ne vérifie jamais deux fois le même lien ; on tire plusieurs fois la même file. C’est ce qui permet d’estimer $\mu_a$ à partir des vérifications passées.</p>
<h4 class="pj-tfe">Banque et TFE</h4>
<p>Une banque répartit son effort de revue entre des files d’alertes (montants inhabituels, pays à risque, changements d’actionnariat). Décider combien d’analystes affecter à chaque file, en apprenant laquelle rapporte le plus, se formule comme un problème de bandit. Pour le TFE, c’est une proposition d’extension de RQ2, à faire valider par le promoteur ; rien n’est mesuré à ce stade.</p>
<div class="def"><b>À retenir</b><ul><li>Bras = file de liens suspects ; récompense = lien falsifié trouvé ; horizon = budget.</li><li>Trouvailles attendues d’une répartition : $\sum_a\mu_a N_a$.</li><li>Actif : apprendre un modèle. Bandit : maximiser les trouvailles pendant le budget.</li><li>Pool fini et adversaire violent l’hypothèse stochastique stationnaire.</li></ul></div>`,
      },
      {
        id: 'pb-2', title: 'Le regret, et pourquoi l’exploitation pure échoue', slides: '18 à 35, 50 à 60', minutes: 14,
        summary: 'Le regret compte ce qu’on a perdu par rapport à la meilleure file. Suivre le meneur ou ε-greedy à ε fixe donne un regret linéaire.',
        fiche: R`
<h4 class="pj-idee">L’idée</h4>
<p>Le regret, c’est le nombre de liens falsifiés que tu n’as pas trouvés parce que tu ne vérifiais pas dans la meilleure file. Une bonne stratégie fait croître ce regret de plus en plus lentement ; une mauvaise le fait croître proportionnellement au budget.</p>
<h4 class="pj-methode">Savoir-faire</h4>
<p>Regret espéré après $n$ tirages (slide 21) : $R_n=n\mu^*-\mathbb E\big[\sum_{t=1}^n X_t\big]$, avec $\mu^*=\max_a\mu_a$. Écart du bras $a$ (slide 20) : $\Delta_a=\mu^*-\mu_a$. Décomposition du regret (lemme des slides 25 à 29) :</p>
<p>$$R_n=\sum_{a=1}^{K}\Delta_a\,\mathbb E[N_a(n)]$$</p>
<p>où $N_a(n)$ est le nombre de tirages du bras $a$. Le meilleur bras ne contribue pas ($\Delta=0$) : pour réduire le regret, il faut tirer peu les bras sous-optimaux.</p>
<p><b>Exemple calculé.</b> Trois files, $\mu=(0{,}20 ; 0{,}12 ; 0{,}05)$, budget 100, la stratégie a tiré 60, 25 et 15 fois. Regret : $0\times60+0{,}08\times25+0{,}15\times15=2+2{,}25=4{,}25$ liens falsifiés manqués en moyenne.</p>
<p><b>Exploration pure</b> (slide 32) : tirer chaque bras $n/K$ fois. Regret $R_n=\frac nK\sum_a\Delta_a$, linéaire en $n$. Avec les quatre files de la section pb-1 et $n=200$ : $50\times(0+0{,}08+0{,}15+0{,}12)=17{,}5$.</p>
<p><b>Exploitation pure</b> (« follow the leader », slides 33 à 35) : si le premier tirage du meilleur bras donne 0 et celui d’un autre bras donne 1, on reste sur le mauvais bras. Dans un casino de Bernoulli à deux bras, le regret croît comme $(1-\mu_1)\,\mu_2\,(\mu_1-\mu_2)\,n$ : linéairement ($\mu_1$ est le meilleur bras). Par exemple $\mu_1=0{,}20$, $\mu_2=0{,}10$, $n=1\,000$ : $0{,}8\times0{,}1\times0{,}1\times1\,000=8$ liens. La slide écrit $(\mu_2-\mu_1)$, ce qui donnerait un regret négatif : il s’agit vraisemblablement d’une inversion, le facteur à retenir est l’écart $\Delta=\mu_1-\mu_2>0$. À confirmer avec le Prof. Siebert (slide 34).</p>
<p><b>ε-greedy</b> (slides 58 à 60) : avec probabilité $\varepsilon$ on explore au hasard, sinon on exploite. À $\varepsilon$ fixe, on explore une fraction fixe du temps, donc le regret reste linéaire. Un $\varepsilon$ décroissant aide, mais son calendrier est difficile à régler (slide 60).</p>
<h4 class="pj-formel">Version précise</h4>
<p>Un algorithme est dit « efficace » s’il a un regret sous-linéaire pour tout problème de bandit (slide 37). Le théorème de Lai et Robbins (1985, slides 50 à 57) donne une borne inférieure asymptotique : pour tout algorithme efficace et tout bras sous-optimal,</p>
<p>$$\liminf_{n\to\infty}\frac{\mathbb E[N_a(n)]}{\log n}\ge\frac{1}{D_{KL}(\nu_a\,\|\,\nu^*)}$$</p>
<p>Pour des bras de Bernoulli (slide 55), $D_{KL}$ devient $d(\mu_a;\mu_1)=(1-\mu_a)\log\frac{1-\mu_a}{1-\mu_1}+\mu_a\log\frac{\mu_a}{\mu_1}$. Lecture : deux files de taux proches ont un $d$ petit, il faut beaucoup de vérifications pour les distinguer. Avec $\mu_1=0{,}20$ et $n=1\,000$ (logarithme naturel), $\mu_a=0{,}10$ donne $d=0{,}0367$ et $\log n/d\approx188$ ; $\mu_a=0{,}19$ donne $d=0{,}00032$ et $\log n/d\approx21\,800$, plus que le budget : en pratique on ne les distinguera pas, mais tirer la seconde coûte peu. On ne peut donc pas faire mieux qu’un regret logarithmique sur tous les problèmes : c’est la référence que visent UCB et Thompson. La slide 56 écrit un facteur 4 devant $\frac{1}{d(\mu_2,\mu_1)}\log n$, que la slide 55 ne contient pas : à confirmer avec le Prof. Siebert (slide 56).</p>
<p><b>Pièges</b> : le regret se calcule avec les vrais $\mu_a$, inconnus en pratique ; dans une expérience, il n’est mesurable que parce que la vérité terrain est construite. Et un regret faible ne dit rien de la qualité du modèle appris (objectif de l’apprentissage actif).</p>
<h4 class="pj-tfe">Banque et TFE</h4>
<p>Dans le projet, le regret se traduit directement en langage métier : « avec la stratégie X, on rate en moyenne N liens falsifiés de plus qu’avec la meilleure file connue après coup ». C’est un chiffre qu’un responsable conformité comprend.</p>
<div class="def"><b>À retenir</b><ul><li>$R_n=\sum_a\Delta_a\,\mathbb E[N_a(n)]$.</li><li>Exploration pure, exploitation pure et ε-greedy à ε fixe : regret linéaire.</li><li>Lai et Robbins : au moins de l’ordre de $\log n/d(\mu_a;\mu_1)$ tirages de chaque bras sous-optimal ; objectif, un regret logarithmique.</li></ul></div>`,
      },
      {
        id: 'pb-3', title: 'Explore-Then-Commit : une phase pilote', slides: '37 à 49', minutes: 14,
        summary: 'Vérifier m liens dans chaque file, puis ne plus vérifier que dans la meilleure. Simple, mais m dépend d’un écart Δ inconnu.',
        fiche: R`
<h4 class="pj-idee">L’idée</h4>
<p>C’est la démarche d’un pilote : on teste chaque file sur quelques dizaines de liens, on garde la meilleure, et on y consacre tout le reste du budget. Toute la difficulté est de choisir la taille du pilote.</p>
<h4 class="pj-methode">Savoir-faire</h4>
<ol><li>Exploration : tirer chacun des $K$ bras $m$ fois ($Km\le n$).</li>
<li>Engagement : choisir $\hat a=\arg\max_a\hat\mu_a(m)$ et ne plus tirer que lui.</li></ol>
<p>Un bras sous-optimal est tiré $m$ fois, plus $n-Km$ fois s’il gagne le pilote par erreur (slide 39). La probabilité de cette erreur se borne par l’inégalité de Hoeffding (slides 42 et 43), d’où $\mathbb E[N_a(n)]\le m+n\,e^{-\Delta_a^2 m/2}$ (slide 44). En optimisant $m$ (deux bras, écart $\Delta$, slides 45 et 46) :</p>
<p>$$m^*=\frac{2}{\Delta^2}\log\!\left(\frac{n\Delta^2}{2}\right),\qquad R(n)\le\frac{2}{\Delta}\left(\log\frac{n\Delta^2}{2}+1\right)$$</p>
<p><b>Exemple calculé</b> (chiffres construits pour l’exercice). $\Delta=0{,}10$, $n=1\,000$ : $n\Delta^2/2=5$, $m^*=200\times\ln 5\approx322$ vérifications par file. Avec deux files, le pilote consomme environ 644 vérifications sur 1 000 : l’écart est petit, il faut beaucoup de données pour le voir. La probabilité de garder la mauvaise file est alors bornée par $e^{-0{,}01\times322/2}=0{,}20$, et la borne de regret vaut $20\times(\ln5+1)=52{,}2$ liens, à comparer au pire cas $n\Delta=100$ : à ce budget, la garantie reste modeste.</p>
<p><b>Pilote trop court.</b> Avec $m=20$ et $\Delta=0{,}10$, la borne vaut $e^{-0{,}1}=0{,}90$ : elle ne garantit presque rien. Vingt dossiers par file ne départagent pas deux files dont les taux diffèrent de 10 points.</p>
<h4 class="pj-formel">Version précise</h4>
<p>Le regret devient logarithmique en $n$, mais <b>il faut connaître $\Delta$</b> à l’avance pour régler $m$, ce qui n’est pas réaliste (slide 46). La version séquentielle (slide 47) explore uniformément jusqu’au premier instant $\tau$ où $|\hat\mu_1(t)-\hat\mu_2(t)|>\sqrt{4\log(n/t)/t}$, puis s’engage sur le meilleur. Son regret vérifie $R(n)\le\frac{2}{\Delta}\log n+C\sqrt{\log n}$ (slide 49, preuve omise dans le cours) : toujours logarithmique, sans connaître $\Delta$. Exemple : à $t=100$ et $n=1\,000$, le seuil vaut $\sqrt{4\ln10/100}=0{,}30$ ; deux files à 0,20 et 0,10 ne le franchissent pas encore.</p>
<p><b>Pièges</b> : la formule de $m^*$ n’a de sens que si $n\Delta^2/2>1$, et elle n’est pas monotone en $\Delta$ à petit budget. Pour $n=1\,000$, $\Delta=0{,}05$ donne $m^*\approx179$, moins que pour $\Delta=0{,}10$ : quand l’écart est très petit devant le budget, se tromper de file coûte peu ($n\Delta$), et un long pilote ne se rentabilise pas. Le facteur $1/\Delta^2$ ne domine qu’à grand $n$.</p>
<h4 class="pj-tfe">Banque et TFE</h4>
<p>ETC est la stratégie la plus facile à défendre devant un comité : « pilote de m dossiers par file, puis on industrialise ». Le calcul de $m^*$ montre aussi pourquoi un pilote trop court (20 dossiers) départage mal deux files de qualités proches. Dans le projet, ETC servirait de ligne de base intermédiaire entre le hasard et UCB ou Thompson.</p>
<div class="def"><b>À retenir</b><ul><li>Explorer $m$ fois chaque bras, puis s’engager.</li><li>$\mathbb E[N_a(n)]\le m+n\,e^{-\Delta_a^2m/2}$ (Hoeffding).</li><li>$m^*$ grandit comme $1/\Delta^2$ à grand $n$ : deux files proches demandent un long pilote.</li><li>Limite : $\Delta$ inconnu ; la version séquentielle s’en passe.</li></ul></div>`,
      },
      {
        id: 'pb-4', title: 'UCB : l’optimisme face à l’incertitude', slides: '61 à 80', minutes: 16,
        summary: 'Vérifier dans la file dont la borne supérieure de confiance est la plus haute : une file peu testée garde le bénéfice du doute.',
        fiche: R`
<h4 class="pj-idee">L’idée</h4>
<p>On donne à chaque file une note optimiste : sa moyenne observée, plus un bonus d’autant plus grand qu’on l’a peu testée. On vérifie dans la file la mieux notée. Une file négligée voit son bonus grandir avec le temps et finit par être retestée ; une file souvent testée a un bonus faible et n’est choisie que si elle est vraiment bonne.</p>
<h4 class="pj-methode">Savoir-faire</h4>
<p>Principe (slide 63) : supposer l’environnement aussi favorable que les données le permettent, et tirer le bras dont la borne supérieure de confiance est la plus haute. UCB1 (Auer et al., 2002, slide 71) :</p>
<p>$$A_{t+1}=\arg\max_a\ \underbrace{\hat\mu_a(t)}_{\text{exploitation}}+\underbrace{\sqrt{\frac{2\log t}{N_a(t)}}}_{\text{bonus d’exploration}}$$</p>
<p>$\hat\mu_a(t)$ : la proportion de liens falsifiés observée dans la file $a$ ; $N_a(t)$ : le nombre de liens de cette file déjà vérifiés.</p>
<p><b>Exemple calculé.</b> $t=100$, $\ln 100=4{,}605$. File A : 60 tirages, $\hat\mu=0{,}20$, bonus $\sqrt{9{,}21/60}=0{,}392$, indice $0{,}592$. File B : 10 tirages, $\hat\mu=0{,}10$, bonus $\sqrt{9{,}21/10}=0{,}960$, indice $1{,}060$. UCB choisit B, bien que sa moyenne soit plus basse : elle est trop peu testée pour être écartée. Un indice supérieur à 1 n’est pas une probabilité : c’est une note de priorité.</p>
<p>Construction (slides 64 à 70) : par Hoeffding, $\mathbb P\big(\mu_a\le\hat\mu_a(t)+\sqrt{\log t/N_a(t)}\big)\ge1-1/t$. Avec $\delta=1/t^\alpha$, $\alpha>1$, l’indice devient $\hat\mu_a(t)+\sqrt{\alpha\log t/(2N_a(t))}$ (slide 73). Avec $\alpha=3$ et la file A : $0{,}20+\sqrt{3\times4{,}605/120}=0{,}539$.</p>
<p>Une file que l’on ne tire plus garde $\hat\mu_a$ et $N_a$ constants, mais $\log t$ continue de croître : son indice remonte et tous les bras finissent par être tirés (slide 72).</p>
<h4 class="pj-formel">Version précise</h4>
<p>Pour tout bras sous-optimal, le cours donne $\mathbb E[N_a(n)]\le\frac{\log n}{2\Delta_a^2}+C$ (slide 75) et, dans la preuve, $N_a(t)<\frac{2\alpha\log n}{\Delta_a^2}$ (slide 79). Le regret moyen est donc en $O(\log n)$. Les constantes des slides 75 et 79 diffèrent (facteur $4\alpha$) ; seule la forme $\log n/\Delta_a^2$ compte pour l’ordre de grandeur. À confirmer avec le Prof. Siebert (slides 75 et 79). La pénalité $1/\Delta_a^2$ devient très grande quand deux bras sont proches, mais tirer le second meilleur bras coûte alors peu (slide 79) : sa contribution au regret est $\Delta_a\,\mathbb E[N_a(n)]$, de l’ordre de $\log n/\Delta_a$.</p>
<p>Variante (slide 80) : pour des récompenses de Bernoulli, l’inégalité de Chernoff donne un meilleur algorithme, KL-UCB.</p>
<p><b>Pièges</b> : $\log$ est le logarithme naturel dans les calculs ; $t$ est le nombre total de tirages, $N_a$ celui du bras ; un bras jamais tiré ($N_a=0$) a un bonus infini, on tire donc chaque bras une fois au départ.</p>
<h4 class="pj-tfe">Banque et TFE</h4>
<p>UCB est une règle explicable : « on vérifie la file B parce qu’elle n’a été testée que 10 fois ; on ne peut pas encore exclure qu’elle soit la meilleure ». Ce type de justification est précieux face à un auditeur ou à un régulateur qui demande pourquoi tel dossier a été revu plutôt qu’un autre. Revers de la médaille : UCB est déterministe, donc prévisible pour un falsificateur (section pb-7).</p>
<div class="def"><b>À retenir</b><ul><li>Indice UCB1 : $\hat\mu_a+\sqrt{2\log t/N_a}$.</li><li>$\mathbb E[N_a(n)]=O(\log n/\Delta_a^2)$, regret $O(\log n)$.</li><li>Une file peu testée garde le bénéfice du doute ; une file délaissée voit son indice remonter.</li><li>Déterministe : explicable, mais prévisible.</li></ul></div>`,
      },
      {
        id: 'pb-5', title: 'Thompson sampling : la fiabilité d’une file comme loi Bêta', slides: '82 à 94', minutes: 16,
        summary: 'Garder pour chaque file une loi Bêta sur sa proportion de liens falsifiés, tirer une valeur dans chaque loi et vérifier dans la file au plus grand tirage.',
        fiche: R`
<h4 class="pj-idee">L’idée</h4>
<p>Au lieu d’une note unique, on garde pour chaque file une croyance : « la proportion de liens falsifiés dans cette file est probablement autour de 15 %, mais je n’en suis pas sûr ». À chaque vérification, on imagine une valeur plausible pour chaque file, on choisit celle qui a la meilleure valeur imaginée, et on met à jour la croyance avec le résultat.</p>
<h4 class="pj-methode">Savoir-faire</h4>
<p>Cadre bayésien (slide 82) : $\mu_a$ est vu comme la réalisation d’une variable aléatoire. Pour des récompenses 0/1, la loi Bêta est conjuguée à la loi de Bernoulli (slides 93 et 94). Avec un a priori $\text{Bêta}(1,1)$ (uniforme), après $N_a$ tirages dont $S_a$ succès (slide 83) :</p>
<p>$$\pi_a(t)=\text{Bêta}\big(S_a(t)+1,\ N_a(t)-S_a(t)+1\big)$$</p>
<p>Algorithme (slide 90) : tirer $\theta_a(t)\sim\pi_a(t)$ pour chaque bras, jouer $A_{t+1}=\arg\max_a\theta_a(t)$, observer $X$, puis $\text{Bêta}(\alpha,\beta)\to\text{Bêta}(\alpha+X,\ \beta+1-X)$. Un lien falsifié ajoute 1 à $\alpha$, un lien vrai ajoute 1 à $\beta$.</p>
<p><b>Exemple calculé.</b> File A : 40 vérifications, 8 falsifiés : $\text{Bêta}(9, 33)$, moyenne $9/42=0{,}214$. File B : 5 vérifications, 1 falsifié : $\text{Bêta}(2, 5)$, moyenne $2/7=0{,}286$, mais très étalée. Thompson choisira souvent B tant que sa loi reste large ; si la vérification suivante de B ne trouve rien, B passe à $\text{Bêta}(2, 6)$, moyenne $0{,}25$.</p>
<p><b>A priori d’expert</b> (exemple construit). Si les analystes estiment qu’environ un lien sur cinq d’une file est douteux, on peut partir de $\text{Bêta}(2, 8)$, de moyenne $0{,}2$, qui pèse comme 10 vérifications fictives. Après 20 vérifications dont 6 falsifiés : $\text{Bêta}(8, 22)$, moyenne $8/30=0{,}267$.</p>
<h4 class="pj-formel">Version précise</h4>
<p>Moyenne d’une $\text{Bêta}(\alpha,\beta)$ : $\alpha/(\alpha+\beta)$. Plus le bras est tiré, plus sa loi a posteriori est concentrée (slides 87 et 88) : une file peu vérifiée garde une loi plate, et ses tirages $\theta_a$ dépassent souvent ceux d’une file mieux connue. Thompson explore ainsi par le hasard du tirage plutôt que par un bonus. Proposé par Thompson (1933) pour les essais cliniques (slide 89), il atteint la borne inférieure de Lai et Robbins pour des récompenses binaires, quel que soit l’a priori Bêta (Kaufmann et al., 2012, cité slide 94). Sa philosophie est plus « pessimiste » qu’UCB : on tire un modèle plausible au lieu du meilleur modèle possible (slide 91).</p>
<p><b>Pièges</b> : un a priori trop fort (par exemple $\text{Bêta}(20, 80)$, qui pèse comme 100 vérifications) écrase les premières observations ; et la mise à jour suppose des vérifications indépendantes et de même loi dans une file, ce que le pool fini contredit à la longue (section pb-7).</p>
<h4 class="pj-tfe">Banque et TFE</h4>
<p>La loi Bêta donne au banquier ce qu’il demande souvent : une estimation <b>avec son incertitude</b> (« cette file contient entre 10 % et 30 % de liens falsifiés »). C’est aussi une façon propre d’intégrer un avis d’expert comme a priori. Le tirage aléatoire rend en outre la stratégie moins prévisible qu’UCB pour un falsificateur.</p>
<div class="def"><b>À retenir</b><ul><li>A priori $\text{Bêta}(\alpha,\beta)$, vraisemblance Bernoulli : a posteriori $\text{Bêta}(\alpha+S, \beta+N-S)$, soit $\text{Bêta}(S+1, N-S+1)$ depuis l’uniforme.</li><li>Moyenne $\alpha/(\alpha+\beta)$ ; un a priori $\text{Bêta}(a,b)$ pèse comme $a+b$ observations.</li><li>Tirer $\theta_a\sim\pi_a$, jouer le maximum, mettre à jour.</li><li>Atteint la borne de Lai et Robbins (récompenses binaires).</li></ul></div>`,
      },
      {
        id: 'pb-6', title: 'Identifier la meilleure stratégie de vérification', slides: '96 à 98', minutes: 12,
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
<p><b>Un ordre de grandeur de taille d’échantillon.</b> L’inégalité de Hoeffding (slide 42) donne $\mathbb P(|\hat\mu_n-\mu|>\varepsilon)\le2e^{-2n\varepsilon^2}$ pour des récompenses dans $[0,1]$. Pour estimer le taux d’une file à $\varepsilon$ près avec un risque $\delta$, il suffit donc de</p>
<p>$$n\ge\frac{\ln(2/\delta)}{2\varepsilon^2}$$</p>
<p>vérifications. Exemple : $\varepsilon=0{,}05$, $\delta=0{,}05$ : $\ln 40/0{,}005=737{,}8$, soit 738 vérifications par file. Cette taille ne dépend pas du vrai taux : Hoeffding est prudent, souvent pessimiste pour des taux proches de 0.</p>
<p><b>Règle d’arrêt de LUCB</b> (slide 98) : l’algorithme LUCB suit pour chaque bras une borne inférieure (LCB) et une borne supérieure (UCB) de l’intervalle de confiance de $\mu_a$, tire à chaque tour deux bras choisis à partir de ces bornes, et s’arrête quand la LCB du meilleur bras empirique dépasse la UCB de tous les autres. Exemple construit : file A dans $[0{,}18 ; 0{,}30]$, file B dans $[0{,}05 ; 0{,}20]$. Comme $0{,}18<0{,}20$, les intervalles se chevauchent : on continue.</p>
<h4 class="pj-formel">Version précise</h4>
<p>Ressemble à de l’exploration pure, mais le critère n’est plus le gain cumulé : c’est la probabilité de bonne recommandation et le coût de l’étude (slide 97). Trois objectifs sont donc à distinguer dans le projet : apprendre un modèle (apprentissage actif), maximiser les trouvailles pendant le budget (regret), identifier la meilleure stratégie (meilleur bras). Les mélanger rend une expérience illisible.</p>
<p><b>Pièges</b> : avec $K$ files, garantir $\varepsilon$ pour toutes à la fois demande de répartir le risque, par exemple $\delta/K$ par file (borne de l’union) ; et s’arrêter dès que le meilleur bras « semble » en tête, sans règle d’arrêt fixée d’avance, fait perdre la garantie $1-\delta$.</p>
<h4 class="pj-tfe">Banque et TFE</h4>
<p>Pour le TFE, la seconde moitié de RQ2 (« laquelle permet de détecter la manipulation ? ») se lit comme une question d’identification du meilleur bras : on compare des stratégies pour en recommander une. Le $\delta$ choisi et le nombre de vérifications nécessaires sont des chiffres à donner au promoteur, avec la réserve qu’ils restent à mesurer.</p>
<div class="def"><b>À retenir</b><ul><li>Règles d’échantillonnage, d’arrêt et de recommandation.</li><li>$\mathbb P(\hat a_\tau=a^*)\ge1-\delta$ avec $\mathbb E[\tau]$ petit.</li><li>Taille d’échantillon par Hoeffding : $n\ge\ln(2/\delta)/(2\varepsilon^2)$.</li><li>LUCB s’arrête quand la LCB du meilleur dépasse la UCB des autres.</li><li>Trois objectifs distincts : apprendre, trouver, identifier.</li></ul></div>`,
      },
      {
        id: 'pb-7', title: 'Les limites : pool fini et falsificateur adaptatif', slides: '13 et 15', minutes: 10,
        summary: 'Les garanties du cours supposent des récompenses i.i.d. stationnaires ; un pool fini et un adversaire qui s’adapte cassent cette hypothèse.',
        fiche: R`
<h4 class="pj-idee">L’idée</h4>
<p>Toutes les garanties vues (ETC, UCB, Thompson) supposent que chaque file garde la même qualité au fil du temps. Dans le projet, ce n’est pas vrai : quand tu as trouvé les liens falsifiés d’une file, il en reste moins ; et un falsificateur qui comprend ta stratégie déplacera ses faux liens vers la file que tu vérifies le moins.</p>
<h4 class="pj-methode">Savoir-faire : que faire en pratique</h4>
<ul><li><b>Pool fini</b> : mesurer le regret par rapport à la meilleure stratégie <b>a posteriori</b> sur le même pool, et vérifier empiriquement si UCB et Thompson gardent leur avantage sur le hasard.</li>
<li><b>Adversaire</b> : simuler deux attaquants, l’un qui place ses faux liens au hasard, l’autre qui les place dans la file la moins vérifiée. Comparer les stratégies face aux deux, séparément.</li>
<li>Garder une part d’exploration aléatoire : une stratégie déterministe est la plus facile à contourner.</li></ul>
<p><b>Exemple calculé : le pool qui s’épuise</b> (chiffres construits). Une file de 100 liens contient 10 liens falsifiés, $\mu=0{,}10$. Après 30 vérifications qui en ont trouvé 6, il reste 4 falsifiés parmi 70 liens : le taux de la file tombe à $4/70=0{,}057$. Une stratégie qui raisonne avec la moyenne observée $6/30=0{,}20$ surestime la file au moment même où elle s’épuise.</p>
<p><b>Exemple calculé : l’attaquant adaptatif</b> (chiffres construits). Quatre files de 500 liens, 200 vérifications réparties à 50 %, 30 %, 15 % et 5 % (100, 60, 30 et 10). L’attaquant cache 20 faux liens. Placés au hasard dans les 2 000 liens, chacun a une chance $200/2\,000$ d’être vérifié : on en trouve 2 en moyenne. Placés tous dans la file la moins vérifiée, chacun a une chance $10/500$ : on en trouve $20\times10/500=0{,}4$. La stratégie perd 80 % de ses trouvailles.</p>
<h4 class="pj-formel">Version précise</h4>
<p>Le cours traite le bandit stochastique stationnaire (slide 13) avec récompenses i.i.d. et bornées (slide 15). Le pool fini viole l’indépendance (tirage sans remise) et la stationnarité ($\mu_a$ dépend de ce qui a déjà été trouvé). L’adversaire viole l’hypothèse que la loi des récompenses ne dépend pas des actions passées. La littérature étudie aussi un cadre dit adversarial, où les récompenses peuvent être choisies par un adversaire (par exemple l’algorithme EXP3). Ce cadre est hors du cours : il faut lire la source primaire avant de s’en servir ou de le citer.</p>
<p><b>Pièges</b> : un résultat obtenu contre l’attaquant naïf seul ne dit rien de la robustesse ; et un taux de détection agrégé sur les deux attaquants cache la faiblesse face au second. Les deux se rapportent séparément.</p>
<h4 class="pj-tfe">Banque et TFE</h4>
<p>Le simulateur d’attaque adaptatif du stage (E3) se transpose ici : il faisait réécrire des charges adverses pour tromper le système ; il déplacerait désormais des liens falsifiés vers les files les moins surveillées. Cette transposition est une proposition : aucune mesure n’existe encore. Montrer qu’une stratégie résiste (ou non) à cet attaquant intéresserait autant le promoteur qu’une équipe de lutte contre la fraude.</p>
<div class="def"><b>À retenir</b><ul><li>Pool fini : les $\mu_a$ baissent, les garanties ne s’appliquent plus telles quelles.</li><li>Attaquant adaptatif : il vise la file la moins vérifiée ; trouvailles attendues = faux liens $\times$ vérifications de cette file / taille de la file.</li><li>Ce cadre adversarial est hors du cours.</li><li>Toujours tester contre un attaquant naïf et un attaquant adaptatif, séparément.</li></ul></div>`,
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
      // Ajouts du 22/10/2026
      ['pb-1', 'trouvailles', R`Combien de liens falsifiés trouve en moyenne une stratégie qui vérifie $N_a$ liens dans chaque file $a$ ?`, R`$\sum_a\mu_a N_a$, où $\mu_a$ est la proportion de liens falsifiés de la file $a$.`],
      ['pb-1', 'politique', R`Qu’est-ce qu’une politique de bandit, dans le projet ?`, R`Une règle $\pi:H_t\mapsto A_{t+1}$ qui choisit la file du prochain lien à vérifier à partir de l’historique des files vérifiées et des résultats (slide 11).`],
      ['pb-1', 'hypotheses', R`Les trois hypothèses du bandit stochastique du cours (slide 15) ?`, R`On n’observe que la récompense du bras tiré ; les récompenses de chaque bras sont i.i.d. ; elles sont bornées.`],
      ['pb-2', 'exploration-pure', R`Regret de l’exploration pure (chaque bras tiré $n/K$ fois) ?`, R`$R_n=\frac nK\sum_a\Delta_a$ : linéaire en $n$ (slide 32).`],
      ['pb-2', 'lai-robbins', R`Que dit le théorème de Lai et Robbins pour des bras de Bernoulli ?`, R`Pour tout algorithme efficace, $\liminf_n \mathbb E[N_a(n)]/\log n\ge 1/d(\mu_a;\mu_1)$, avec $d$ la divergence KL entre lois de Bernoulli : on ne fait pas mieux qu’un regret logarithmique.`],
      ['pb-3', 'etc-hoeffding', R`Borne de Hoeffding sur le nombre de tirages d’un bras sous-optimal avec ETC ?`, R`$\mathbb E[N_a(n)]\le m+n\,e^{-\Delta_a^2m/2}$ : les m tirages du pilote, plus n fois la probabilité de gagner le pilote par erreur.`],
      ['pb-3', 'etc-regret', R`Borne de regret d’ETC à deux bras avec le pilote optimal ?`, R`$R(n)\le\frac{2}{\Delta}\left(\log\frac{n\Delta^2}{2}+1\right)$ : logarithmique en $n$, mais elle suppose Δ connu.`],
      ['pb-3', 'etc-seq', R`Comment la version séquentielle d’ETC se passe-t-elle de Δ ?`, R`Elle explore jusqu’à ce que $|\hat\mu_1(t)-\hat\mu_2(t)|>\sqrt{4\log(n/t)/t}$, puis s’engage. Regret $\le\frac{2}{\Delta}\log n+C\sqrt{\log n}$ (slide 49).`],
      ['pb-4', 'optimisme', R`Principe de l’optimisme face à l’incertitude ?`, R`Supposer l’environnement aussi favorable que les données le permettent : tirer le bras dont la borne supérieure de confiance est la plus haute.`],
      ['pb-4', 'ucb-alpha', R`Indice UCB avec un niveau de confiance $\delta=1/t^\alpha$ ?`, R`$\hat\mu_a(t)+\sqrt{\alpha\log t/(2N_a(t))}$, avec $\alpha>1$ (slide 73).`],
      ['pb-4', 'ucb-delaisse', R`Que devient l’indice UCB d’une file qu’on ne tire plus ?`, R`Il remonte : $\hat\mu_a$ et $N_a$ restent constants mais $\log t$ croît. Tous les bras finissent par être tirés (slide 72).`],
      ['pb-5', 'beta-moyenne', R`Moyenne d’une loi $\text{Bêta}(\alpha,\beta)$, et effet d’une vérification ?`, R`$\alpha/(\alpha+\beta)$. Un lien falsifié ajoute 1 à α, un lien vrai ajoute 1 à β.`],
      ['pb-5', 'prior-expert', R`Que signifie un a priori $\text{Bêta}(2,8)$ sur une file ?`, R`Une croyance initiale centrée sur 0,2 (deux liens douteux sur dix), qui pèse comme 10 vérifications fictives.`],
      ['pb-5', 'ts-exploration', R`Comment Thompson sampling explore-t-il sans bonus ?`, R`Une file peu vérifiée a une loi a posteriori plate : ses tirages $\theta_a$ dépassent souvent ceux d’une file mieux connue, et elle est retestée.`],
      ['pb-6', 'hoeffding-n', R`Taille d’échantillon pour estimer le taux d’une file à ε près avec un risque δ (Hoeffding) ?`, R`$n\ge\ln(2/\delta)/(2\varepsilon^2)$. Exemple : ε = δ = 0,05 donne 738 vérifications.`],
      ['pb-6', 'lucb', R`Règle d’arrêt de LUCB ?`, R`S’arrêter quand la borne inférieure (LCB) du meilleur bras empirique dépasse la borne supérieure (UCB) de tous les autres (slide 98).`],
      ['pb-6', 'trois-objectifs', R`Les trois objectifs à ne pas mélanger dans le projet ?`, R`Apprendre un modèle (actif), trouver le plus de liens falsifiés pendant le budget (regret), désigner la meilleure stratégie avec confiance (meilleur bras).`],
      ['pb-7', 'pool-fini', R`Une file de M liens dont F falsifiés ; après k vérifications, j falsifiés trouvés. Taux restant ?`, R`$(F-j)/(M-k)$. Il baisse quand on a trouvé plus que la moyenne : la file s’épuise.`],
      ['pb-7', 'attaquant-adaptatif', R`Que fait un attaquant adaptatif face à une stratégie de vérification connue ?`, R`Il place ses faux liens dans la file la moins vérifiée, ce qui réduit les trouvailles attendues à (faux liens) × (vérifications de cette file) / (taille de la file).`],
      ['pb-7', 'deux-attaquants', R`Pourquoi rapporter séparément les résultats face à l’attaquant naïf et à l’attaquant adaptatif ?`, R`Un taux agrégé cache la faiblesse face à l’adaptatif ; les deux situations n’ont ni le même sens ni le même coût.`],
    ],
    quiz: [
      ['pb-1', R`Un analyste veut maximiser le nombre de liens falsifiés trouvés pendant son budget. Quel cadre ?`, ['bandit (minimiser le regret)', 'apprentissage actif', 'identification du meilleur bras', 'apprentissage passif'], 0, R`Le gain se compte pendant le budget : c’est le regret.`],
      ['pb-2', R`ε-greedy avec ε = 0,1 fixe, sur un très long horizon : le regret est…`, ['linéaire', 'logarithmique', 'borné', 'nul'], 0, R`On explore 10 % du temps pour toujours.`],
      ['pb-3', R`Deux files dont les taux diffèrent de Δ = 0,05, horizon $n=10^6$. Par rapport à Δ = 0,10, le pilote optimal d’ETC est…`, ['environ 3,3 fois plus long (un peu moins de 4, à cause du log)', '2 fois plus court', 'identique', '2 fois plus long exactement'], 0, R`$m^*=\frac{2}{\Delta^2}\ln\frac{n\Delta^2}{2}$ : $800\ln1\,250=5\,705$ contre $200\ln5\,000=1\,703$, rapport $3{,}35$. Le facteur $1/\Delta^2$ multiplie par 4, le log réduit un peu. À petit $n$ (par exemple $n=1\,000$), le rapport s’inverse : voir les pièges de la fiche.`],
      ['pb-4', R`File A : 60 tirages, moyenne 0,20. File B : 10 tirages, moyenne 0,10. $t=100$. UCB1 choisit…`, ['B', 'A', 'les deux à égalité', 'aucune'], 0, R`Indices : A $0{,}592$, B $1{,}060$. B est trop peu testée pour être écartée.`],
      ['pb-5', R`File en $\text{Bêta}(3, 7)$. On vérifie un lien : il est falsifié. Nouvelle loi ?`, ['Bêta(4, 7)', 'Bêta(3, 8)', 'Bêta(4, 8)', 'Bêta(3, 7)'], 0, R`Succès : $\alpha+1$.`],
      ['pb-6', R`RQ2 demande quelle approche détecte le mieux la manipulation. Quel objectif de bandit ?`, ['identifier le meilleur bras', 'minimiser le regret', 'maximiser l’entropie', 'apprentissage passif'], 0, R`On veut recommander une stratégie avec confiance, pas maximiser un gain pendant l’étude.`],
      ['pb-7', R`Un falsificateur place ses faux liens dans la file la moins vérifiée. Quelle hypothèse du cours est violée ?`, ['récompenses stochastiques stationnaires', 'récompenses bornées', 'horizon fini', 'K bras'], 0, R`Les récompenses dépendent alors des choix passés de l’agent.`],
      // Ajouts du 22/10/2026 (à la fin, pour garder le rang des QCM existants)
      ['pb-1', R`Quatre files, $\mu=(0{,}20 ; 0{,}12 ; 0{,}05 ; 0{,}08)$, 200 vérifications réparties à parts égales. Nombre moyen de liens falsifiés trouvés ?`, ['22,5', '40', '17,5', '50'], 0, R`$50\times(0{,}20+0{,}12+0{,}05+0{,}08)=22{,}5$. 40 serait le gain en connaissant la meilleure file ; 17,5 est l’écart entre les deux, c’est-à-dire le regret.`],
      ['pb-1', R`L’analyste vérifie un lien de la file A. Qu’apprend-il directement sur le taux de la file B ?`, ['rien : on n’observe que la récompense du bras tiré', 'autant que sur la file A', 'le taux de B se déduit de celui de A', 'le regret exact de B'], 0, R`Première hypothèse de la slide 15 : seul le bras tiré révèle sa récompense. C’est ce qui oblige à explorer.`],
      ['pb-2', R`Exploration pure sur quatre files, $\mu=(0{,}20 ; 0{,}12 ; 0{,}05 ; 0{,}08)$, $n=200$. Regret ?`, ['17,5', '22,5', '0', '35'], 0, R`$\frac nK\sum_a\Delta_a=50\times(0+0{,}08+0{,}15+0{,}12)=17{,}5$. 35 divise par 2 au lieu de 4 ; 22,5 est le gain, pas le regret.`],
      ['pb-2', R`Meilleure file à 0,20. Quelle file sous-optimale demande le plus de vérifications pour être écartée, selon Lai et Robbins ?`, ['une file à 0,19', 'une file à 0,10', 'une file à 0,02', 'toutes autant'], 0, R`La borne est en $\log n/d(\mu_a;\mu_1)$ : $d$ est minuscule quand les taux sont proches ($0{,}00032$ pour 0,19 contre $0{,}0367$ pour 0,10). En revanche, chaque tirage de cette file ne coûte que $\Delta=0{,}01$.`],
      ['pb-3', R`ETC avec un pilote de $m=20$ vérifications par file, $\Delta=0{,}10$. Que vaut la borne $e^{-\Delta^2m/2}$ sur la probabilité de s’engager sur la mauvaise file ?`, ['0,90 : elle ne garantit presque rien', '0,10', '0,01', '0,50 exactement'], 0, R`$e^{-0{,}01\times20/2}=e^{-0{,}1}=0{,}905$. Il faudrait $m$ de l’ordre de plusieurs centaines pour que la borne devienne utile.`],
      ['pb-3', R`Quel est l’avantage principal de la version séquentielle d’ETC sur la version à $m$ fixe ?`, ['elle n’a pas besoin de connaître Δ', 'son regret est nul', 'elle n’explore jamais', 'elle tire chaque bras exactement une fois'], 0, R`Elle s’arrête quand l’écart empirique dépasse $\sqrt{4\log(n/t)/t}$ et garde un regret logarithmique (slide 49).`],
      ['pb-4', R`Une file n’a plus été vérifiée depuis longtemps ($\hat\mu_a$ et $N_a$ fixes). Son indice UCB1…`, ['augmente lentement, car $\log t$ croît', 'reste constant', 'diminue', 'devient nul'], 0, R`Le bonus $\sqrt{2\log t/N_a}$ croît avec $t$ : la file finit par être retestée (slide 72).`],
      ['pb-4', R`Deux files de taux très proches ($\Delta_a$ petit). La borne sur $\mathbb E[N_a(n)]$ explose en $1/\Delta_a^2$. Est-ce grave pour le regret ?`, ['peu : chaque tirage de la seconde file ne coûte que $\Delta_a$', 'oui, le regret devient linéaire', 'oui, UCB cesse de fonctionner', 'non, car $N_a$ reste nul'], 0, R`La contribution au regret est $\Delta_a\,\mathbb E[N_a(n)]$, de l’ordre de $\log n/\Delta_a$ : tirer le second meilleur bras est alors une stratégie correcte (slide 79).`],
      ['pb-5', R`A priori d’expert $\text{Bêta}(2, 8)$. 20 vérifications, dont 6 liens falsifiés. Moyenne a posteriori ?`, ['0,267', '0,300', '0,200', '0,250'], 0, R`$\text{Bêta}(2+6, 8+14)=\text{Bêta}(8, 22)$, moyenne $8/30=0{,}267$. 0,300 ignore l’a priori ; 0,200 ignore les données.`],
      ['pb-5', R`File A en $\text{Bêta}(41, 161)$, file B en $\text{Bêta}(2, 6)$, de moyennes proches (0,20 et 0,25). Laquelle donne le plus souvent un tirage $\theta$ au-dessus de 0,4 ?`, ['B, car sa loi est plate', 'A, car elle a plus de données', 'les deux autant', 'aucune des deux, jamais'], 0, R`B a peu d’observations : sa loi est étalée, un tirage dépasse 0,4 environ une fois sur six. A est concentrée autour de 0,20 et ne dépasse pratiquement jamais 0,4. C’est le mécanisme d’exploration de Thompson.`],
      ['pb-6', R`Estimer le taux d’une file à $\varepsilon=0{,}05$ près avec un risque $\delta=0{,}05$ (Hoeffding). Combien de vérifications ?`, ['738', '400', '20', '74'], 0, R`$n\ge\ln(2/\delta)/(2\varepsilon^2)=\ln40/0{,}005=737{,}8$, arrondi au-dessus.`],
      ['pb-6', R`LUCB : file A dans $[0{,}18 ; 0{,}30]$, file B dans $[0{,}05 ; 0{,}20]$. On s’arrête ?`, ['non : la LCB de A (0,18) est sous la UCB de B (0,20)', 'oui : la moyenne de A est plus haute', 'oui : la UCB de A dépasse celle de B', 'non : il faut que les deux intervalles aient la même largeur'], 0, R`La règle d’arrêt exige LCB du meilleur > UCB de tous les autres. Ici les intervalles se chevauchent encore.`],
      ['pb-7', R`Une file de 100 liens contient 10 liens falsifiés. Après 30 vérifications, 6 ont été trouvés. Taux de la file pour la prochaine vérification ?`, ['4/70, soit 0,057', '6/30, soit 0,20', '10/100, soit 0,10', '4/100, soit 0,04'], 0, R`Il reste $10-6=4$ falsifiés parmi $100-30=70$ liens. La moyenne observée (0,20) surestime une file qui s’épuise.`],
      ['pb-7', R`Face à un falsificateur qui observe la stratégie, quelle stratégie est la plus facile à contourner ?`, ['une règle déterministe connue, comme UCB', 'Thompson sampling', 'un tirage aléatoire uniforme', 'ε-greedy avec ε grand'], 0, R`Une règle déterministe permet de prévoir les files les moins vérifiées ; le hasard du tirage rend ce calcul plus difficile.`],
    ],
    gens: {
      'pb-1': [
        () => {
          const mu = pick([[0.2, 0.12, 0.05, 0.08], [0.3, 0.1, 0.15, 0.05], [0.25, 0.2, 0.04, 0.1]]);
          const N = mu.map(() => 5 * rnd(2, 16)), B = N.reduce((s, x) => s + x, 0);
          const g = mu.reduce((s, m, i) => s + m * N[i], 0);
          return { q: R`Quatre files, $\mu=(${mu.map(x => f(x, 2)).join(' ; ')})$. Sur un budget de ${B} vérifications, la stratégie en a fait $(${N.join(' ; ')})$. Nombre moyen de liens falsifiés trouvés $\sum_a\mu_aN_a$ ? (2 décimales)`, a: g, tol: 0.01,
            expl: R`$${mu.map((m, i) => R`${f(m, 2)}\times${N[i]}`).join('+')}=${f(g, 2)}$. Avec tout le budget sur la meilleure file : $${f(Math.max(...mu) * B, 2)}$.` };
        },
      ],
      'pb-2': [
        () => {
          const mu = pick([[0.2, 0.12, 0.05], [0.3, 0.25, 0.1], [0.15, 0.1, 0.02]]), N = pick([[60, 25, 15], [50, 30, 20], [80, 10, 10]]);
          const best = Math.max(...mu), r = mu.reduce((s, m, i) => s + (best - m) * N[i], 0);
          return { q: R`Trois files, $\mu=(${mu.map(x => f(x, 2)).join(' ; ')})$, tirées $(${N.join(' ; ')})$ fois. Regret $\sum_a\Delta_a N_a$ ?`, a: r, tol: 0.01,
            expl: R`$\Delta=(${mu.map(m => f(best - m, 2)).join(' ; ')})$, regret $=${f(r, 2)}$ liens falsifiés manqués en moyenne.` };
        },
        () => {
          const mu = pick([[0.2, 0.12, 0.05, 0.08], [0.3, 0.1, 0.15, 0.05], [0.25, 0.2, 0.04, 0.1]]), n = 4 * pick([50, 100, 250]);
          const best = Math.max(...mu), sd = mu.reduce((s, m) => s + best - m, 0), r = n / 4 * sd;
          return { q: R`Exploration pure sur quatre files, $\mu=(${mu.map(x => f(x, 2)).join(' ; ')})$, $n=${n}$. Regret $\frac nK\sum_a\Delta_a$ ? (2 décimales)`, a: r, tol: 0.01,
            expl: R`$\Delta=(${mu.map(m => f(best - m, 2)).join(' ; ')})$, somme $${f(sd, 2)}$ ; regret $=${n / 4}\times${f(sd, 2)}=${f(r, 2)}$. Linéaire en $n$ : doubler le budget double le regret.` };
        },
        () => {
          const m1 = pick([0.2, 0.25, 0.3]), D = pick([0.05, 0.1, 0.15]), ma = m1 - D, n = pick([1000, 10000]);
          const d = (1 - ma) * Math.log((1 - ma) / (1 - m1)) + ma * Math.log(ma / m1), b = Math.log(n) / d;
          return { q: R`Bernoulli, meilleure file $\mu_1=${f(m1, 2)}$, file $a$ à $\mu_a=${f(ma, 2)}$, $n=${n}$. Ordre de grandeur de Lai et Robbins $\ln n/d(\mu_a;\mu_1)$ ? (entier le plus proche, à 1 % près)`, a: Math.round(b), tol: Math.max(1, 0.01 * b),
            expl: R`$d=${f(1 - ma, 2)}\ln\frac{${f(1 - ma, 2)}}{${f(1 - m1, 2)}}+${f(ma, 2)}\ln\frac{${f(ma, 2)}}{${f(m1, 2)}}=${f(d, 4)}$ ; $\ln ${n}=${f(Math.log(n), 3)}$ ; rapport $${f(b, 1)}$ tirages de la file $a$, au minimum, asymptotiquement.` };
        },
      ],
      'pb-3': [
        () => {
          const D = pick([0.05, 0.1, 0.2]), n = pick([1000, 5000, 10000]);
          const m = 2 / D ** 2 * Math.log(n * D ** 2 / 2);
          return { q: R`ETC à deux bras, $\Delta=${f(D, 2)}$, $n=${n}$. Pilote optimal $m^*=\frac{2}{\Delta^2}\ln\frac{n\Delta^2}{2}$ ? (entier le plus proche)`, a: Math.round(m), tol: 1,
            expl: R`$\frac{2}{${f(D * D, 4)}}\ln(${f(n * D * D / 2, 2)})=${f(m, 1)}$ tirages par bras.` };
        },
        () => {
          const D = pick([0.1, 0.2]), n = pick([1000, 5000, 10000]);
          const r = 2 / D * (Math.log(n * D * D / 2) + 1);
          return { q: R`ETC à deux bras avec le pilote optimal, $\Delta=${f(D, 2)}$, $n=${n}$. Borne de regret $\frac{2}{\Delta}\left(\ln\frac{n\Delta^2}{2}+1\right)$ ? (1 décimale)`, a: r, tol: 0.1,
            expl: R`$${f(2 / D, 0)}\times(\ln ${f(n * D * D / 2, 2)}+1)=${f(r, 1)}$ liens, à comparer au pire cas $n\Delta=${f(n * D, 0)}$.` };
        },
        () => {
          const D = pick([0.05, 0.1, 0.2]), m = pick([20, 50, 100, 200, 400]);
          const p = Math.exp(-D * D * m / 2);
          return { q: R`ETC, pilote de $m=${m}$ vérifications par file, $\Delta=${f(D, 2)}$. Borne de Hoeffding $e^{-\Delta^2m/2}$ sur la probabilité de garder la mauvaise file ? (3 décimales)`, a: p, tol: 0.002,
            expl: R`$e^{-${f(D * D, 4)}\times${m}/2}=e^{-${f(D * D * m / 2, 3)}}=${f(p)}$. ${p > 0.5 ? 'La borne ne garantit presque rien : le pilote est trop court pour cet écart.' : 'La borne devient informative.'}` };
        },
      ],
      'pb-4': [
        () => {
          const t = pick([50, 100, 200, 500]), N = rnd(5, 40), mu = rnd(5, 40) / 100;
          const u = mu + Math.sqrt(2 * Math.log(t) / N);
          return { q: R`UCB1 : $t=${t}$, $N_a=${N}$, $\hat\mu_a=${f(mu, 2)}$. Indice $\hat\mu_a+\sqrt{2\ln t/N_a}$ ? (3 décimales)`, a: u, tol: 0.003,
            expl: R`Bonus $\sqrt{2\ln ${t}/${N}}=${f(u - mu)}$, indice $${f(u)}$.` };
        },
        () => {
          let t, NA, NB, mA, mB, uA, uB;
          do {
            t = pick([100, 200, 500]); NA = rnd(30, 120); NB = rnd(5, 40); mA = rnd(10, 35) / 100; mB = rnd(2, 30) / 100;
            uA = mA + Math.sqrt(2 * Math.log(t) / NA); uB = mB + Math.sqrt(2 * Math.log(t) / NB);
          } while (Math.abs(uA - uB) < 0.01);
          return { q: R`UCB1, $t=${t}$. File A : $N=${NA}$, $\hat\mu=${f(mA, 2)}$. File B : $N=${NB}$, $\hat\mu=${f(mB, 2)}$. Quelle file vérifier ?`, opts: ['A', 'B'], a: uA > uB ? 0 : 1, keepOrder: true,
            expl: R`Indices : A $${f(mA, 2)}+\sqrt{2\ln${t}/${NA}}=${f(uA)}$, B $${f(mB, 2)}+\sqrt{2\ln${t}/${NB}}=${f(uB)}$. On vérifie ${uA > uB ? 'A' : 'B'}.` };
        },
        () => {
          const t = pick([100, 200, 500]), N = rnd(5, 60), mu = rnd(5, 40) / 100, al = pick([2, 3, 4]);
          const u = mu + Math.sqrt(al * Math.log(t) / (2 * N));
          return { q: R`Indice UCB à niveau $\delta=1/t^\alpha$ : $\hat\mu_a+\sqrt{\alpha\ln t/(2N_a)}$, avec $\alpha=${al}$, $t=${t}$, $N_a=${N}$, $\hat\mu_a=${f(mu, 2)}$ ? (3 décimales)`, a: u, tol: 0.003,
            expl: R`$\sqrt{${al}\times${f(Math.log(t), 3)}/${2 * N}}=${f(u - mu)}$, indice $${f(u)}$.` };
        },
      ],
      'pb-5': [
        () => {
          const N = rnd(3, 40), S = rnd(0, Math.min(N, 12));
          return { q: R`A priori $\text{Bêta}(1,1)$, ${N} vérifications dont ${S} liens falsifiés. Moyenne a posteriori ? (3 décimales)`, a: (S + 1) / (N + 2), tol: 0.002,
            expl: R`$\text{Bêta}(${S + 1}, ${N - S + 1})$, moyenne $\frac{${S + 1}}{${N + 2}}=${f((S + 1) / (N + 2))}$.` };
        },
        () => {
          const a = rnd(1, 4), b = rnd(2, 12), k = rnd(4, 8), obs = Array.from({ length: k }, () => (Math.random() < 0.3 ? 1 : 0));
          const S = obs.reduce((s, x) => s + x, 0), A = a + S, Bt = b + k - S;
          return { q: R`File en $\text{Bêta}(${a}, ${b})$. On vérifie ${k} liens, résultats successifs ${obs.join(', ')} (1 = falsifié). Moyenne de la loi a posteriori ? (3 décimales)`, a: A / (A + Bt), tol: 0.002,
            expl: R`${S} lien(s) falsifié(s) et ${k - S} vrai(s) : $\text{Bêta}(${a}+${S}, ${b}+${k - S})=\text{Bêta}(${A}, ${Bt})$, moyenne $\frac{${A}}{${A + Bt}}=${f(A / (A + Bt))}$. L’ordre des résultats ne change rien.` };
        },
      ],
      'pb-6': [
        () => {
          const e = pick([0.02, 0.05, 0.1]), d = pick([0.01, 0.05, 0.1]);
          const n = Math.log(2 / d) / (2 * e * e);
          return { q: R`Hoeffding : combien de vérifications pour estimer le taux d’une file à $\varepsilon=${f(e, 2)}$ près avec un risque $\delta=${f(d, 2)}$ ? (entier, arrondi au-dessus)`, a: Math.ceil(n), tol: 1,
            expl: R`$n\ge\frac{\ln(2/\delta)}{2\varepsilon^2}=\frac{\ln ${f(2 / d, 0)}}{${f(2 * e * e, 4)}}=${f(n, 1)}$, soit ${Math.ceil(n)} vérifications.` };
        },
        () => {
          let mA, mB, wA, wB, lA, uB;
          do {
            mA = rnd(15, 35) / 100; mB = rnd(3, 14) / 100; wA = rnd(2, 10) / 100; wB = rnd(2, 10) / 100;
            lA = mA - wA; uB = mB + wB;
          } while (Math.abs(lA - uB) < 0.005);
          const stop = lA > uB;
          return { q: R`LUCB, deux files. A : $\hat\mu=${f(mA, 2)}$, demi-largeur de l’intervalle $${f(wA, 2)}$. B : $\hat\mu=${f(mB, 2)}$, demi-largeur $${f(wB, 2)}$. Peut-on s’arrêter et recommander A ?`, opts: ['oui, s’arrêter', 'non, continuer'], a: stop ? 0 : 1, keepOrder: true,
            expl: R`LCB de A $=${f(lA, 2)}$, UCB de B $=${f(uB, 2)}$. ${stop ? 'La LCB de A dépasse la UCB de B : on s’arrête.' : 'Les intervalles se chevauchent : on continue.'}` };
        },
      ],
      'pb-7': [
        () => {
          const M = pick([100, 200, 500]), F = rnd(5, 20), k = rnd(20, 60), j = rnd(0, Math.min(F, Math.floor(k / 3)));
          const r = (F - j) / (M - k);
          return { q: R`File de ${M} liens dont ${F} falsifiés. Après ${k} vérifications, ${j} falsifiés trouvés. Taux de la file pour la prochaine vérification ? (3 décimales)`, a: r, tol: 0.001,
            expl: R`Restent $${F}-${j}=${F - j}$ falsifiés parmi $${M}-${k}=${M - k}$ liens : $${f(r)}$, contre $${f(F / M)}$ au départ.` };
        },
        () => {
          const M = pick([250, 500, 1000]), B = pick([100, 200, 400]), F = pick([10, 20, 40]);
          const sh = pick([[0.5, 0.3, 0.15, 0.05], [0.4, 0.3, 0.2, 0.1], [0.6, 0.2, 0.1, 0.1]]);
          const Ba = sh.map(s => Math.round(s * B)), bmin = Math.min(...Ba), g = F * bmin / M, naive = F * B / (4 * M);
          return { q: R`Quatre files de ${M} liens. ${B} vérifications réparties $(${Ba.join(' ; ')})$. L’attaquant cache ${F} faux liens dans la file la moins vérifiée. Nombre moyen de faux liens trouvés ? (2 décimales)`, a: g, tol: 0.01,
            expl: R`Chaque faux lien a une chance $${bmin}/${M}$ d’être vérifié : $${F}\times${bmin}/${M}=${f(g, 2)}$. Placés au hasard dans les $${4 * M}$ liens : $${F}\times${B}/${4 * M}=${f(naive, 2)}$.` };
        },
      ],
    },
  });
})();
