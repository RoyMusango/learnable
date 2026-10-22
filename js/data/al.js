// Chapitre : Active Learning (X. Siebert, slides activeLearning_en, 76 slides).
// Les exemples chiffrés « prenons… » sont construits pour l'exercice ; les exemples « du cours » sont ceux des slides.
(function () {
  const R = String.raw;
  const { pick, rnd, f } = COURSE.u;
  const log2 = x => Math.log(x) / Math.LN2;
  const ent2 = p => -p.reduce((s, x) => s + (x > 0 ? x * log2(x) : 0), 0);

  COURSE.add({
    id: 'al',
    title: 'Apprentissage actif',
    short: 'Apprentissage actif',
    source: 'activeLearning_en.pdf · 76 slides',
    seen: null,
    pitch: 'Quand les étiquettes coûtent cher, l’algorithme choisit lui-même quels points faire étiqueter. Incertitude, marge, entropie, comité, version space, gain exponentiel… et ses limites.',
    sections: [
      {
        id: 'al-intro', title: 'Pourquoi l’apprentissage actif ?', slides: '3-13',
        summary: 'Beaucoup de données, peu d’étiquettes (chères). Si l’algorithme choisit ses exemples (« être curieux »), il peut apprendre avec bien moins d’étiquettes.',
        fiche: R`
<p><b>L’idée.</b> Dans beaucoup d’applications, les données brutes abondent mais leur étiquette coûte : il faut un expert humain pour dire si un texte parle de baseball ou de hockey, si une image montre un 3 ou un 5, si une alerte de transaction est une fraude. Si l’algorithme choisit lui-même quels points faire étiqueter (le slide 5 dit « être curieux »), il peut atteindre la même précision avec beaucoup moins d’étiquettes.</p>

<h4>1. Le vocabulaire</h4>
<div class="def"><b>Apprentissage actif</b> (synonymes : <i>query learning</i>, <i>optimal experimental design</i>) : apprentissage <b>interactif</b> dans lequel l’algorithme choisit les points dont il veut l’étiquette et les soumet à un <b>oracle</b>.<br>
<b>Oracle</b> : celui qui connaît la bonne étiquette et la donne à la demande (un expert humain, un test de laboratoire). Chaque question posée à l’oracle a un coût.<br>
<b>Point informatif</b> : un point dont l’étiquette ferait le plus progresser le classifieur. Toute la suite du chapitre consiste à donner un sens mesurable à ce mot.</div>
<p>Le slide 5 illustre l’idée par le jeu « Qui est-ce ? » : une bonne question (« porte-t-il des lunettes ? ») élimine environ la moitié des personnages restants, une mauvaise (« est-ce Bernard ? ») n’en élimine qu’un. L’apprentissage actif cherche les bonnes questions.</p>
<p>Le slide 6 situe l’actif parmi les cadres d’apprentissage :</p>
<table><tr><th>Cadre</th><th>Ce dont on dispose</th></tr>
<tr><td>Non supervisé</td><td>des points sans aucune étiquette</td></tr>
<tr><td>Semi-supervisé</td><td>quelques points étiquetés et beaucoup de points non étiquetés</td></tr>
<tr><td>Supervisé</td><td>tous les points sont étiquetés</td></tr>
<tr><td>Actif</td><td>des points non étiquetés, et le droit de demander l’étiquette de ceux que l’on choisit (les « ? » du schéma)</td></tr></table>

<h4>2. Passif contre actif (slides 7 à 9)</h4>
<table><tr><th>Passif</th><th>Actif</th></tr>
<tr><td>On tire un échantillon i.i.d. $(x_1,y_1),\dots,(x_m,y_m)\sim P^m$ : $m$ couples (point, étiquette), indépendants et de même loi $P$. L’apprenant reçoit <b>tout l’échantillon étiqueté</b>.</td><td>Même tirage, mais l’apprenant ne voit que les points $(x_1,\dots,x_m)$. Il peut <b>demander</b> l’étiquette $y_i$ du point $x_i$ de son choix.</td></tr>
<tr><td>Schéma du slide 8 : un échantillon aléatoire des données non annotées part chez l’oracle, qui renvoie les couples $\langle x_i,y_i\rangle$ au classifieur.</td><td>Schéma du slide 9 : le classifieur inspecte les données, envoie $\langle x_i,?\rangle$ à l’oracle, reçoit $\langle x_i,y_i\rangle$, et recommence.</td></tr>
<tr><td colspan="2"><b>Objectif de l’actif</b> : demander <b>moins d’étiquettes</b> que le passif pour la même précision.</td></tr></table>

<h4>3. Quand est-ce utile ? Pour localiser l’information (slide 10)</h4>
<p>L’actif aide quand la réponse cherchée tient dans une petite région de l’espace, qu’il faut trouver :</p>
<table><tr><th>Problème</th><th>Ce qu’on veut savoir</th><th>Où est l’information</th></tr>
<tr><td>Classification</td><td>où $p(y\mid x)>\frac12$ ?</td><td>près des points où $p(y\mid x)$ franchit $\frac12$ (la frontière)</td></tr>
<tr><td>Clustering</td><td>où $p(x)>\epsilon$ ?</td><td>au bord des zones denses</td></tr>
<tr><td>Optimisation de bandit</td><td>où est $\max_x\mathbb E[y\mid x]$ ?</td><td>autour du maximum (lien avec le chapitre sur les bandits)</td></tr></table>
<p>Loin de la frontière, une étiquette de plus confirme ce qu’on sait déjà. C’est là que le passif gaspille ses étiquettes.</p>

<h4>4. Ce que montrent les exemples du cours (Settles 08)</h4>
<ul><li><b>Données synthétiques</b> (slide 12) : 400 points tirés d’une loi gaussienne multivariée, deux classes. But : le meilleur classifieur linéaire avec 30 étiquettes seulement. Passif (30 points tirés au hasard) : précision de 70 %. Actif (30 points « bien choisis ») : 90 %.</li>
<li><b>Classification de textes</b> (slide 13) : 20 000 documents de sites sportifs, deux catégories (baseball, hockey). La <b>courbe d’apprentissage</b> donne la précision en fonction du nombre d’étiquettes demandées ; celle de l’échantillonnage par incertitude reste au-dessus de celle du tirage aléatoire sur toute la plage de 0 à 100 requêtes.</li>
<li><b>Outils commerciaux</b> (slide 4) : Amazon SageMaker Ground Truth n’envoie un point à un annotateur humain que si le modèle ne sait pas l’étiqueter avec confiance, et annonce « jusqu’à 70 % » de réduction du coût d’étiquetage (affirmation commerciale reproduite sur le slide, non mesurée dans le cours). L’outil d’annotation Prodigy se présente comme « powered by active learning ».</li></ul>

<h4>5. Savoir-faire : lire une courbe d’apprentissage</h4>
<p>On lit la courbe <b>horizontalement</b> : pour une précision visée, combien d’étiquettes chaque méthode demande-t-elle ? Prenons des chiffres fictifs : si le passif atteint 85 % avec 80 étiquettes et l’actif avec 40, l’actif économise $1-\frac{40}{80}=50\,\%$ des étiquettes. La lecture verticale (précision à budget fixé, comme 70 % contre 90 % pour 30 étiquettes) dit la même chose sous un autre angle.</p>

<h4>6. Pièges</h4>
<ul><li>L’actif réduit le nombre d’<b>étiquettes</b>, pas le nombre de <b>données</b> : il lui faut au contraire un grand réservoir de points non étiquetés où choisir.</li>
<li>Les points étiquetés par l’actif ne sont plus un échantillon i.i.d. de $P$ : ils ont été choisis. Cette perte de l’hypothèse i.i.d. (centrale dans le chapitre de théorie de l’apprentissage) aura un prix (section « Myopie »).</li>
<li>Les 70 % et 90 % valent pour un jeu de données : ce n’est pas une garantie générale. La section sur les intervalles montre des cas où l’actif ne gagne rien.</li></ul>

<h4>7. Lien banque</h4>
<p>Une équipe de conformité reçoit chaque jour bien plus d’alertes de transactions qu’elle ne peut en examiner. Chaque alerte revue est une étiquette chère (le temps d’un analyste). L’apprentissage actif sert à choisir quelles alertes faire revoir <b>pour améliorer le modèle</b>. Ce n’est pas le même objectif que revoir les alertes les plus suspectes pour <b>arrêter la fraude</b> : une alerte notée 0,99 est presque sûrement frauduleuse, et son étiquette n’apprend presque rien au modèle. Les deux objectifs se partagent le même budget, comme exploration et exploitation dans le chapitre sur les bandits.</p>

<h4>À retenir</h4>
<ul><li>Actif : l’algorithme voit les points sans étiquette et demande à un oracle l’étiquette des plus informatifs.</li>
<li>Objectif : moins d’étiquettes que le passif pour la même précision ; utile quand l’étiquette coûte et que l’information est localisée (près de la frontière).</li>
<li>Exemple de Settles : 30 étiquettes, 70 % en passif contre 90 % en actif.</li>
<li>Le prix à payer : l’échantillon étiqueté n’est plus i.i.d.</li></ul>`,
      },
      {
        id: 'al-scen', title: 'Trois scénarios et la boucle pool-based', slides: '15-22, 32-33',
        summary: 'Synthèse de requêtes (MQS), flux (stream-based) ou réservoir (pool-based, celui du cours). En pool-based : choisir un point, le faire étiqueter, réentraîner, après un démarrage passif.',
        fiche: R`
<p><b>L’idée.</b> Avant de mesurer l’informativité, il faut savoir d’où viennent les points que l’on peut faire étiqueter. Le cours distingue trois scénarios (schéma du slide 15) et étudie le troisième, le réservoir.</p>

<h4>1. Les trois scénarios</h4>
<table><tr><th>Scénario</th><th>Ce que reçoit l’algorithme</th><th>Ce qu’il décide</th><th>Contrainte</th></tr>
<tr><td><b>MQS</b> (<i>Membership Query Synthesis</i>, synthèse de requêtes d’appartenance)</td><td>le jeu $(x_1,\dots,x_n)$, et le droit de fabriquer des points synthétiques $\{x_{n+i},\ i\in\mathbb N_0\}$</td><td>quel point, réel ou fabriqué, envoyer à l’oracle</td><td>un point fabriqué peut être impossible à étiqueter</td></tr>
<tr><td><b>Stream-based</b> (flux, séquentiel)</td><td>les points $x_1,\dots,x_n$ <b>un par un</b></td><td>pour chaque $x_i$ : demander $y_i$ ou ignorer le point</td><td>décision immédiate, sans revoir les points passés ; rien à stocker</td></tr>
<tr><td><b>Pool-based</b> (réservoir)</td><td>un grand réservoir $x_1,\dots,x_n$ <b>dès le départ</b></td><td>quel $y_i$ du réservoir est le plus intéressant à demander</td><td>il faut en général garder toute la base en mémoire</td></tr></table>
<p><b>MQS sur les chiffres manuscrits</b> (slides 17 à 19). (A) L’algorithme demande l’étiquette des chiffres incertains : sur la matrice de confusion du slide 18 (classe prédite en colonne, vraie classe en ligne), ce sont les cases <b>hors de la diagonale</b>, où prédiction et vérité diffèrent. (B) Il peut aussi en synthétiser. Le slide 19 montre le problème : des images fabriquées « entre » un 7 et un 3, ou entre un 3 et un 5, qu’un humain ne sait pas étiqueter.</p>
<p><b>Flux</b> (slide 20) : utile quand on ne peut pas tout stocker, par exemple sur un système embarqué. <b>Réservoir</b> (slide 21) : on choisit « le meilleur » point du réservoir à chaque tour. <b>Le cours se concentre sur le scénario 3, pool-based</b> (slide 22).</p>

<h4>2. La boucle pool-based (slide 32)</h4>
<div class="def">On part d’un jeu $D=\{x_1,\dots,x_n\}$, coupé en deux : $D_l$ (<i>labeled</i>, les points déjà étiquetés) et $D_u$ (<i>unlabeled</i>, le réservoir sans étiquette). À chaque étape $k$ :
<ol><li>choisir un point $x_i^*\in D_u$ et demander son étiquette $y_i^*$ à l’oracle ;</li>
<li>ajouter $(x_i^*,y_i^*)$ à $D_l$ (et retirer $x_i^*$ de $D_u$) ;</li>
<li>réentraîner le classifieur sur $D_l$ : on obtient $\hat h_k$ (le chapeau dit « estimé à partir des données », l’indice $k$ « à l’étape $k$ »).</li></ol>
Le point $x_i^*$ doit être <b>informatif</b>, et l’informativité se mesure <b>avec le classifieur courant $\hat h_k$</b>.</div>
<div class="def"><b>Démarrage à froid</b> (<i>cold start</i>, slide 33) : à l’étape $k=0$, il n’y a pas encore de classifieur, donc aucun moyen de savoir quel point est informatif. On commence <b>toujours</b> par un peu d’apprentissage <b>passif</b> (quelques points tirés au hasard).</div>
<p>La figure du slide 33 (Cohn 94) trace l’erreur en fonction du nombre d’exemples d’entraînement : la courbe passive (en pointillés) et plusieurs courbes actives qui s’en détachent après un nombre variable de points passifs, puis descendent plus vite qu’elle.</p>

<h4>3. Savoir-faire : dérouler la boucle à la main</h4>
<p>Prenons un réservoir de 10 points sur une droite, $0{,}05;\ 0{,}15;\ \dots;\ 0{,}95$, des seuils $h(x)=\mathbb 1[x\ge w]$ (étiquette 1 à droite du seuil), et un vrai seuil $w^*=0{,}62$ inconnu. Règle de choix : le point non étiqueté le plus proche de la frontière courante, placée au milieu entre le plus grand 0 connu et le plus petit 1 connu.</p>
<table><tr><th>Étape</th><th>Frontière courante</th><th>Point demandé</th><th>Réponse</th></tr>
<tr><td>Démarrage passif</td><td>aucune</td><td>0,05 et 0,95 (au hasard)</td><td>0 et 1</td></tr>
<tr><td>1</td><td>$\frac{0{,}05+0{,}95}2=0{,}5$</td><td>0,55 (0,45 est aussi à 0,05 ; on prend 0,55)</td><td>0</td></tr>
<tr><td>2</td><td>$\frac{0{,}55+0{,}95}2=0{,}75$</td><td>0,75</td><td>1</td></tr>
<tr><td>3</td><td>$\frac{0{,}55+0{,}75}2=0{,}65$</td><td>0,65</td><td>1</td></tr>
<tr><td>Fin</td><td>entre 0,55 et 0,65</td><td>plus aucun point du réservoir entre 0,55 et 0,65</td><td>les 5 autres étiquettes se déduisent</td></tr></table>
<p>Bilan : 5 étiquettes demandées (2 passives, 3 actives) pour connaître les 10. C’est une recherche par dichotomie, étudiée en détail dans la section suivante.</p>

<h4>4. Pièges</h4>
<ul><li>Flux ou réservoir, ce n’est pas une question de taille des données : c’est le moment où l’on décide (au passage du point, ou en voyant tout le réservoir).</li>
<li>En MQS, un point synthétique peut tomber hors de la loi des données réelles : l’oracle ne sait pas répondre, ou sa réponse n’apprend rien d’utile.</li>
<li>Un démarrage passif trop court donne un premier classifieur qui n’a pas vu certaines régions ; la boucle risque de ne jamais y retourner (section « Myopie »).</li></ul>

<h4>5. Lien banque</h4>
<p>Flux : les transactions arrivent en temps réel, et il faut décider tout de suite d’en envoyer une à un analyste ou non. Réservoir : une campagne de revue KYC (<i>Know Your Customer</i>, la vérification de l’identité et du profil des clients) dispose du stock entier des dossiers et choisit lesquels faire revoir. MQS n’a guère de sens ici : un dossier client fabriqué de toutes pièces ne peut pas être jugé par un analyste, comme le chiffre illisible du slide 19.</p>

<h4>À retenir</h4>
<ul><li>MQS : points synthétiques, parfois impossibles à étiqueter. Flux : décision point par point. Réservoir : choix dans un stock disponible d’emblée (le cadre du cours).</li>
<li>Boucle : choisir $x^*\in D_u$ avec $\hat h_k$, demander $y^*$, ajouter à $D_l$, réentraîner.</li>
<li>Démarrage à froid : toujours un peu de passif au début.</li></ul>`,
      },
      {
        id: 'al-1d', title: 'Le gain théorique : rayons et intervalles', slides: '24-31',
        summary: 'Seuil sur R (réalisable) : passif O(1/ε) étiquettes, actif O(log 1/ε) par dichotomie, gain exponentiel. Mais pour les intervalles, l’actif ne gagne pas toujours.',
        fiche: R`
<p><b>L’idée.</b> Sur le problème le plus simple, un seuil sur une droite, l’actif est exponentiellement meilleur que le passif : chaque étiquette coupe en deux l’intervalle où se trouve le seuil. Mais il suffit de passer à un intervalle pour trouver des cas où l’actif doit demander toutes les étiquettes.</p>

<h4>1. Le cadre (slides 24 à 26)</h4>
<div class="def">$\mathcal X$ : l’espace des caractéristiques (les entrées) ; $\mathcal Y$ : l’espace des étiquettes. Le couple aléatoire $(X,Y)\in\mathcal X\times\mathcal Y$ suit une loi $P_{XY}$, en général <b>inconnue</b>, qui se factorise en
$$P(x,y)=P(X=x)\,P(Y=y\mid X=x)$$
(« quels points se présentent » fois « comment l’étiquette dépend du point »).<br>
$\mathcal H$ : la classe d’hypothèses (par exemple tous les classifieurs linéaires). <b>But</b> : trouver $h\in\mathcal H$, $h:\mathcal X\to\mathcal Y$, qui minimise le <b>risque théorique</b> $R(h)=\mathbb E[\ell(Y,h(X))]$, où $\ell$ est la fonction de perte.</div>
<p><b>Cas binaire</b> (slide 25) : $\mathcal Y=\{0,1\}$ et perte 0/1, $\ell(y,f(x))=0$ si $y=f(x)$, 1 sinon. Le risque devient
$$\int\ell(y,f(x))\,dP(x,y)=\int\mathbb 1_{y\neq f(x)}\,dP(x,y)=\mathbb P(Y\neq f(X)),$$
la probabilité de se tromper sur un nouveau point (c’est le cadre du chapitre de théorie de l’apprentissage).</p>
<div class="def">Soit $h^*$ le meilleur classifieur possible (« bayésien »), qui peut ne pas appartenir à $\mathcal H$.<br>
<b>Cas réalisable</b> (sans bruit) : $R(h^*)=0$. <b>Cas agnostique</b> (le cas général) : $R(h^*)$ est inconnu et peut être positif.<br>
La théorie de l’actif a d’abord été développée dans le cas réalisable, puis étendue au cas agnostique. Le but : <b>quantifier</b> l’avantage de l’actif sur le passif.</div>

<h4>2. Rayons positifs : le cas favorable (slides 27 à 29)</h4>
<div class="def">$\mathcal H=\{h_w;\ w\in\mathbb R\}$, les fonctions seuil : $h_w(x)=1$ si $x\ge w$, 0 si $x<w$. Les données sont séparables (cas réalisable) : un vrai seuil $w^*$ donne toutes les étiquettes. $\hat w_n$ est le seuil estimé après $n$ étiquettes.</div>
<p class="muted">Le slide 27 écrit $h_w(x)=\mathrm{sgn}(x-w)$ avec des valeurs dans $\{0,1\}$ ; or $\mathrm{sgn}$ vaut $-1$ ou $+1$. La lecture voulue est celle du slide 28, $h_w(x)=\mathbb 1[x\ge w]$ (ou la convention $\{-1,+1\}$). À confirmer avec le Prof. Siebert (slide 27).</p>
<ul><li><b>Passif</b> : avec $n$ points régulièrement espacés (le slide parle de pire cas), on sait seulement que $w^*$ est entre deux points voisins : $|\hat w_n-w^*|\sim O(1/n)$. Presque tous les points sont loin de $w^*$ et inutiles.</li>
<li><b>Actif</b> (≈ recherche dichotomique) : on demande l’étiquette du milieu de l’intervalle qui contient encore $w^*$, puis on garde la moitié compatible. $|\hat w_n-w^*|\sim O(1/2^n)$ : <b>chaque étiquette fournit un bit</b> de l’écriture binaire de $w^*$.</li></ul>
<div class="thm">Pour localiser $w^*$ à $\epsilon$ près ($|\hat w_n-w^*|\sim\epsilon$), il faut
$$\text{passif : }O\Big(\frac1\epsilon\Big)\text{ étiquettes},\qquad\text{actif : }O\Big(\log\frac1\epsilon\Big)\text{ étiquettes.}$$
Gain <b>exponentiel</b> dans ce cas simple. Sur $[0,1]$, après $n$ requêtes l’intervalle restant a une largeur $2^{-n}$, donc $n=\lceil\log_2(1/\epsilon)\rceil$ suffit.</div>

<h4>3. Savoir-faire : une dichotomie pas à pas</h4>
<p>Prenons $w^*=0{,}37$ sur $[0,1]$. L’intervalle de départ est $[0,1]$.</p>
<table><tr><th>Requête</th><th>Point demandé</th><th>Réponse $h_{w^*}(x)$</th><th>Intervalle restant</th><th>Bit de $w^*$</th></tr>
<tr><td>1</td><td>0,5</td><td>1 (car $0{,}5\ge0{,}37$)</td><td>$[0;\ 0{,}5]$</td><td>0</td></tr>
<tr><td>2</td><td>0,25</td><td>0</td><td>$[0{,}25;\ 0{,}5]$</td><td>1</td></tr>
<tr><td>3</td><td>0,375</td><td>1</td><td>$[0{,}25;\ 0{,}375]$</td><td>0</td></tr>
<tr><td>4</td><td>0,3125</td><td>0</td><td>$[0{,}3125;\ 0{,}375]$</td><td>1</td></tr></table>
<p>Après 4 requêtes, la largeur vaut $2^{-4}=1/16$ et les bits lus donnent $w^*=0{,}0101\ldots$ en binaire, soit au moins $0{,}3125$. Le passif, avec des points régulièrement espacés, aurait besoin d’environ 16 points pour la même précision.</p>
<p>Ordres de grandeur : pour $\epsilon=10^{-3}$, l’actif demande $\lceil\log_2 1000\rceil=10$ étiquettes, le passif environ 1000 ; pour $\epsilon=10^{-6}$, 20 contre un million.</p>
<p><b>Version pool-based</b> : sur un réservoir de $m$ points triés, la frontière se trouve dans l’un des $m+1$ intervalles entre points ; une dichotomie la trouve en $\lceil\log_2(m+1)\rceil$ requêtes, et toutes les autres étiquettes du réservoir s’en déduisent (1000 points : 10 requêtes).</p>

<h4>4. Intervalles positifs : l’actif n’aide pas toujours (slides 30-31)</h4>
<div class="def">$h_{a,b}(x)=1$ si $a\le x\le b$, 0 sinon : étiquette 1 à l’intérieur de l’intervalle $[a,b]$. Données séparables : il existe $a^*,b^*$ tels que $R(h_{a^*,b^*})=0$.</div>
<p class="muted">Le slide 30 écrit $h_{a,b}(x)=\mathrm{sgn}(x-a)-\mathrm{sgn}(x-b)$. Avec $\mathrm{sgn}\in\{-1,+1\}$, cette expression vaut 2 dans l’intervalle et 0 dehors : la lecture voulue est $\mathbb 1[a\le x\le b]$. À confirmer avec le Prof. Siebert (slide 30).</p>
<p><b>Le contre-exemple</b> (slide 31, Hsu 2010) : si l’intervalle positif est minuscule, toutes les étiquettes demandées hors de lui valent 0, et une réponse 0 ne dit pas de quel côté chercher. Il faut distinguer $h_{a,b}$ et $h_{a',b'}$, deux intervalles qui ne contiennent chacun qu’un point du réservoir : seule la question posée exactement sur ce point les sépare.</p>
<p>Prenons un réservoir de 8 points, dont au plus un est positif (on ne sait pas lequel, ni s’il y en a un). Chaque réponse 0 élimine une seule possibilité, comme « est-ce Bernard ? » dans « Qui est-ce ? ». Dans le pire cas, il faut les <b>8 étiquettes</b>, autant que le passif.</p>
<p>La classe des intervalles a pourtant une dimension VC de 2 seulement (chapitre de théorie de l’apprentissage) : le passif s’en accommode très bien. C’est un premier signe que la dimension VC ne suffit pas à décrire la difficulté de l’actif (section « Complexité en étiquettes »).</p>

<h4>5. Pièges</h4>
<ul><li>Le gain exponentiel suppose le cas réalisable et une classe très simple ; ce n’est pas une propriété générale de l’actif.</li>
<li>On compte des <b>étiquettes</b>. En pool-based, il faut quand même un réservoir assez dense : pour localiser $w^*$ à $\epsilon$ près, il faut des points non étiquetés à moins de $\epsilon$ de lui, soit de l’ordre de $1/\epsilon$ points non étiquetés.</li>
<li>Avec du bruit (une étiquette fausse), la dichotomie part du mauvais côté et ne revient jamais : elle suppose $R(h^*)=0$.</li></ul>

<h4>6. Lien banque</h4>
<p>Prenons 1000 dossiers classés par score de crédit, et supposons que l’avis d’un expert (« accepter » ou « refuser ») soit monotone en score : il existe un seuil au-dessus duquel il accepte toujours. Pour retrouver ce seuil, 10 avis d’expert demandés par dichotomie suffisent au lieu de 1000. Si l’avis n’est pas monotone (un expert peut refuser un bon score pour une autre raison), on sort du cas réalisable et cette garantie tombe.</p>

<h4>À retenir</h4>
<ul><li>Réalisable : $R(h^*)=0$ ; agnostique : $R(h^*)$ inconnu, en général positif.</li>
<li>Seuil sur $\mathbb R$ : passif $O(1/\epsilon)$, actif $O(\log(1/\epsilon))$ par dichotomie ; chaque étiquette donne un bit de $w^*$.</li>
<li>Sur un réservoir de $m$ points triés : $\lceil\log_2(m+1)\rceil$ requêtes suffisent.</li>
<li>Intervalles : un intervalle minuscule peut obliger à demander toutes les étiquettes. L’actif n’aide pas toujours.</li></ul>`,
      },
      {
        id: 'al-uncert', title: 'Échantillonnage par incertitude', slides: '34-45',
        summary: 'Moins confiant (1 − P(ŷ|x)), plus petite marge (P(ŷ1|x) − P(ŷ2|x)), entropie maximale. En binaire, les trois coïncident.',
        fiche: R`
<p><b>L’idée.</b> On demande l’étiquette du point sur lequel le classifieur courant hésite le plus. Toute la question est de mesurer cette hésitation à partir des probabilités qu’il prédit : regarder la classe la plus probable, les deux premières, ou toutes.</p>

<h4>1. La carte des méthodes (slide 34)</h4>
<ul><li>Méthodes fondées sur l’<b>incertitude</b> :
<ul><li>un <b>seul classifieur</b> : point le moins confiant, plus petite marge, entropie maximale (cette section) ;</li>
<li>un <b>comité</b> de classifieurs : le vote (section « Comités »).</li></ul></li>
<li>Méthodes fondées sur l’incertitude <b>et l’influence</b> : pondération par la densité, réduction de l’erreur (section « Points isolés »).</li></ul>
<p>Jeu synthétique des slides 35 à 44 : 5 groupes de points tirés de gaussiennes en 2D, un groupe central (rouge) entouré de quatre autres qui le chevauchent.</p>

<h4>2. Les notations</h4>
<div class="def">$\theta$ : le classifieur courant (ses paramètres). $P_\theta(y\mid x)$ : la probabilité <b>a posteriori</b> que ce classifieur attribue à la classe $y$ pour le point $x$. $N_c$ : le nombre de classes.<br>
$\hat y=\arg\max_y P_\theta(y\mid x)$ : la classe la plus probable selon $\theta$ ($\arg\max$ renvoie la classe gagnante, $\max$ renverrait sa probabilité). $\hat y_1,\hat y_2$ : la première et la deuxième classe les plus probables.</div>

<h4>3. Les trois critères</h4>
<div class="def"><b>Moins confiant</b> (<i>least confident</i>, Lewis et Gale 94) : choisir le point dont la probabilité d’appartenir à sa classe la plus probable est la plus faible :
$$x^*_{LC}=\arg\max_x\big[1-P_\theta(\hat y\mid x)\big].$$
Sur la figure du slide 37 : un point au milieu d’un groupe a $P_\theta(\hat y\mid x)\approx1$ (inutile), un point entre deux groupes a $P_\theta(\hat y\mid x)\approx0{,}5$ (à demander).</div>
<p><b>Défaut</b> (slide 39) : ne regarder que la classe la plus probable laisse de côté beaucoup d’information. Les deux situations suivantes sont traitées pareil :</p>
<table><tr><th>Classe</th><th>C1</th><th>C2</th><th>C3</th><th>C4</th><th>C5</th></tr>
<tr><td>cas 1</td><td>0</td><td>0</td><td>0,45</td><td><b>0,5</b></td><td>0,05</td></tr>
<tr><td>cas 2</td><td>0,11</td><td>0,12</td><td>0,14</td><td><b>0,5</b></td><td>0,13</td></tr></table>
<p>Dans les deux cas $1-P_\theta(\hat y\mid x)=1-0{,}5=0{,}5$. Pourtant, dans le cas 1, C4 est presque indiscernable de C3 : le point est informatif. Dans le cas 2, C4 domine nettement chacune des autres : le point l’est moins.</p>
<div class="def"><b>Marge</b> (Scheffer 01) : l’écart entre les deux classes les plus probables ; les points de plus petite marge sont les plus ambigus :
$$x^*_M=\arg\min_x\big[P_\theta(\hat y_1\mid x)-P_\theta(\hat y_2\mid x)\big].$$
Mieux que le moins confiant, mais ne regarde encore que deux classes. Sur l’exemple : marge $0{,}5-0{,}45=0{,}05$ pour le cas 1, $0{,}5-0{,}14=0{,}36$ pour le cas 2 : la marge choisit le cas 1.</div>
<div class="def"><b>Entropie</b> (Settles et Craven 08) : tenir compte de <b>toutes</b> les classes et prendre le point d’entropie maximale :
$$x^*_E=\arg\max_x\Big[-\sum_{i=1}^{N_c}P_\theta(y_i\mid x)\log P_\theta(y_i\mid x)\Big],$$
où $y_1,\dots,y_{N_c}$ sont les étiquettes possibles.</div>
<p><b>Pourquoi l’entropie</b> (slide 43, Shannon 1948) : l’information apportée par l’observation d’une valeur $Y$ est $I(Y)=-\log P(Y)$ (en bits avec $\log_2$) : une réponse improbable apprend beaucoup. La réponse de l’oracle n’est pas connue d’avance, donc on prend l’espérance sur toutes les étiquettes possibles :
$$\mathbb E[I(Y)]=\mathbb E[-\log P(Y)]=-\sum_{i=1}^{N_c}P_\theta(y_i\mid x)\log P_\theta(y_i\mid x).$$
C’est l’information attendue de la réponse ; la même mesure sert à construire les arbres de décision.</p>

<h4>4. Savoir-faire : comparer trois points</h4>
<p>Prenons trois points et trois classes ; entropie en bits.</p>
<table><tr><th>Point</th><th>Probabilités</th><th>$1-P(\hat y\mid x)$</th><th>Marge</th><th>Entropie</th></tr>
<tr><td>A</td><td>(0,5 ; 0,3 ; 0,2)</td><td>0,5</td><td>0,2</td><td>1,485</td></tr>
<tr><td>B</td><td>(0,45 ; 0,45 ; 0,1)</td><td>0,55</td><td><b>0</b></td><td>1,369</td></tr>
<tr><td>C</td><td>(0,4 ; 0,3 ; 0,3)</td><td><b>0,6</b></td><td>0,1</td><td><b>1,571</b></td></tr></table>
<p>Calcul de l’entropie de A : $-(0{,}5\log_20{,}5+0{,}3\log_20{,}3+0{,}2\log_20{,}2)=0{,}5+0{,}521+0{,}464=1{,}485$ bits. Le moins confiant et l’entropie choisissent C ; la marge choisit B, où les deux premières classes sont à égalité parfaite. L’entropie maximale possible avec 3 classes est $\log_23\approx1{,}585$ bits (probabilités uniformes).</p>

<h4>5. Version précise : en binaire, les trois critères coïncident (slide 42)</h4>
<div class="thm">Avec deux classes, $x^*_{LC}=x^*_M=x^*_E$ : tous choisissent le point où $p=P_\theta(1\mid x)$ est le plus proche de $\frac12$.</div>
<p><b>Preuve</b> (à savoir refaire). Posons $u=|p-\frac12|$, l’écart à l’indécision.</p>
<ol><li>Moins confiant : $1-\max(p,1-p)=\min(p,1-p)=\frac12-u$, décroissant en $u$.</li>
<li>Marge : $|p-(1-p)|=|2p-1|=2u$, croissant en $u$, et on la <b>minimise</b>.</li>
<li>Entropie : $H(p)=-p\log p-(1-p)\log(1-p)$ est symétrique autour de $\frac12$ et décroît quand $p$ s’en éloigne, donc décroissante en $u$.</li></ol>
<p>Les trois critères sont des fonctions monotones de $u$ ; maximiser l’incertitude revient chaque fois à minimiser $u$. Exemple : $p=0{,}8;\ 0{,}6;\ 0{,}3$ donnent des entropies $0{,}722;\ 0{,}971;\ 0{,}881$ bits, des marges $0{,}6;\ 0{,}2;\ 0{,}4$, et les trois critères choisissent $p=0{,}6$.</p>

<h4>6. Ce que montrent les figures</h4>
<ul><li>Slides 38 et 41 (moins confiant, marge) : les points choisis s’alignent sur les frontières entre le groupe central et ses voisins, en forme de losange.</li>
<li>Slide 44 (entropie) : les points choisis sont plus dispersés, et plusieurs sont tout au bord du nuage, isolés.</li>
<li>Slide 45 (Settles 08) : 3 classes dont les centres forment un triangle ; carte des points les plus informatifs. Moins confiant et marge éclairent les trois frontières entre paires de classes (une forme en Y) ; l’entropie éclaire le centre, où les trois classes sont équiprobables.</li></ul>

<h4>7. Pièges</h4>
<ul><li>Marge et entropie peuvent se contredire, et l’exemple même du cours le montre : l’entropie du cas 1 vaut 1,234 bit, celle du cas 2 vaut 1,997 bits. L’entropie choisit donc le cas 2, que le slide 39 juge peu informatif. Les deux critères ne posent pas la même question : la marge demande « laquelle des deux premières classes ? », l’entropie mesure la dispersion sur toutes les classes.</li>
<li>La base du logarithme change la valeur de l’entropie, pas le point choisi.</li>
<li>$P_\theta$ est l’estimation du classifieur, construite sur les quelques étiquettes de $D_l$ : si elle est mal calibrée, la mesure d’incertitude l’est aussi.</li>
<li>La marge se <b>minimise</b>, les deux autres critères se <b>maximisent</b>.</li></ul>

<h4>8. Lien banque</h4>
<p>Prenons un modèle qui classe des dossiers de crédit en cinq catégories de risque. Un dossier à $(0;\ 0;\ 0{,}45;\ 0{,}5;\ 0{,}05)$ hésite entre deux catégories voisines : c’est celui qu’un analyste devrait trancher en priorité selon la marge. En détection de fraude (binaire), les trois critères reviennent à faire revoir les alertes dont le score est le plus proche de 0,5.</p>

<h4>À retenir</h4>
<ul><li>Moins confiant : $\arg\max_x[1-P_\theta(\hat y\mid x)]$ ; marge : $\arg\min_x[P_\theta(\hat y_1\mid x)-P_\theta(\hat y_2\mid x)]$ ; entropie : $\arg\max_x[-\sum_iP_\theta(y_i\mid x)\log P_\theta(y_i\mid x)]$.</li>
<li>Le moins confiant ignore toutes les classes sauf une ; la marge en regarde deux ; l’entropie toutes.</li>
<li>L’entropie est l’information attendue de la réponse de l’oracle.</li>
<li>En binaire, les trois critères choisissent le point où $P_\theta(1\mid x)$ est le plus proche de $\frac12$.</li></ul>`,
      },
      {
        id: 'al-incons', title: 'Myopie et inconsistance statistique', slides: '46-50',
        summary: 'Un algorithme consistant converge vers h* avec une infinité de données. L’échantillonnage par incertitude ne l’est pas en général : il reste collé à sa première frontière.',
        fiche: R`
<p><b>L’idée.</b> L’échantillonnage par incertitude ne demande des étiquettes qu’autour de la frontière qu’il croit connaître. S’il s’est trompé au départ sur une région qu’il n’a jamais vue, il n’y retourne jamais : même avec une infinité de points, il converge vers un mauvais classifieur. On parle de <b>myopie</b>, de <b>biais d’échantillonnage</b>, ou d’<b>inconsistance statistique</b> (les trois mots désignent le même défaut).</p>

<h4>1. La définition</h4>
<div class="def"><b>Consistance statistique</b> : un algorithme d’apprentissage est statistiquement consistant si, avec un ensemble d’entraînement infini, il converge vers la meilleure hypothèse $h^*$.</div>
<p>En général, les méthodes par incertitude <b>ne sont pas consistantes</b> quand $h^*\notin\mathcal H$ (cas agnostique).</p>

<h4>2. Savoir-faire : l’exemple 1D du cours (slides 47-48)</h4>
<p>Quatre blocs de points sur une droite, de masses 45 %, 5 %, 5 %, 45 %. Lecture de la figure (convention retenue ici : hachuré = classe 0, noir = classe 1) :</p>
<table><tr><th>Bloc</th><th>A (gauche)</th><th>B</th><th>C</th><th>D (droite)</th></tr>
<tr><td>Masse</td><td>45 %</td><td>5 %</td><td>5 %</td><td>45 %</td></tr>
<tr><td>Classe</td><td>0</td><td>1</td><td>moitié 0 (2,5 %), moitié 1 (2,5 %)</td><td>1</td></tr></table>
<p>On cherche un seuil (0 à gauche, 1 à droite). Deux candidats :</p>
<ul><li>$w^*$, entre A et B : il classe A en 0 et tout le reste en 1. Seule la moitié 0 du bloc C est mal classée : $R(w^*)=2{,}5\,\%$. C’est le meilleur seuil.</li>
<li>$w$, au milieu de C : il classe A, B et la moitié gauche de C en 0. Le bloc B entier est mal classé : $R(w)=5\,\%$.</li></ul>
<p><b>Pourquoi l’algorithme reste à $w$.</b> Le démarrage à froid tire quelques points au hasard, qui tombent très probablement dans les blocs de 45 %. Avec 10 points, la probabilité qu’aucun ne tombe dans B vaut $0{,}95^{10}\approx0{,}60$. Le premier classifieur $\hat h_0$ place donc son seuil quelque part entre A et D, et l’échantillonnage par incertitude interroge les points proches de ce seuil. Il est attiré par le bloc C, où les étiquettes se mélangent, et se stabilise en $w$ (les traits verticaux du slide 48 montrent les seuils successifs, tous près de $w$). Le bloc B est classé 0 avec assurance, loin de la frontière : il n’est jamais interrogé, et l’algorithme ne découvre jamais qu’il est de classe 1. Il converge vers une erreur de 5 %, le double de l’optimum.</p>

<h4>3. L’exemple 2D (slide 49, Cohn 1994)</h4>
<p>La classe 1 est l’intérieur de deux triangles, la classe 0 l’extérieur. Si le démarrage à froid n’a mis aucun point dans le triangle de droite, le classifieur croit qu’il n’y a qu’un triangle : toutes les requêtes se concentrent sur le bord du triangle de gauche (figure de droite), et celui de droite risque d’être manqué pour toujours.</p>

<h4>4. Version précise : pourquoi (slide 50)</h4>
<ul><li>On échantillonne autour de l’estimation de la frontière faite aux premières itérations.</li>
<li>Le classifieur devient <b>trop sûr de lui</b> sur des parties de la distribution qu’il n’a <b>jamais vues</b>.</li></ul>
<p>Rapprochement avec le chapitre de théorie de l’apprentissage : les garanties de l’ERM supposent un échantillon i.i.d. tiré de $P$. Ici, $D_l$ est choisi en fonction du classifieur courant, donc le risque empirique calculé sur $D_l$ ne converge pas vers $R$ : il mesure l’erreur près de la frontière supposée, pas partout.</p>
<div class="def"><b>Changement de paradigme</b> : modéliser l’incertitude <b>sur le classifieur lui-même</b> (et pas seulement sur l’étiquette d’un point), en entretenant plusieurs classifieurs à la fois : un <b>comité</b>.</div>

<h4>5. Pièges</h4>
<ul><li>L’inconsistance n’est pas une lenteur : l’algorithme converge, mais vers la mauvaise limite (5 % au lieu de 2,5 %).</li>
<li>Elle concerne le cas agnostique. Dans le cas réalisable du seuil (section précédente), la dichotomie trouve bien $w^*$.</li>
<li>Ajouter des étiquettes avec la même règle ne corrige rien : elles tombent toutes près de $w$.</li></ul>

<h4>6. Lien banque</h4>
<p>Un modèle de fraude démarré sur un historique où un certain schéma de fraude n’apparaît pas classe ces transactions comme sûres, avec confiance. L’échantillonnage par incertitude n’enverra jamais ces cas à un analyste, et le modèle ne les apprendra jamais : c’est exactement le bloc B de l’exemple.</p>

<h4>À retenir</h4>
<ul><li>Consistant : converge vers $h^*$ avec une infinité de données.</li>
<li>L’échantillonnage par incertitude ne l’est pas en général (cas agnostique) : myopie, biais d’échantillonnage.</li>
<li>Exemple 1D : bloqué à $R(w)=5\,\%$ alors que $R(w^*)=2{,}5\,\%$.</li>
<li>Remède du cours : représenter l’incertitude sur le classifieur par un comité.</li></ul>`,
      },
      {
        id: 'al-qbc', title: 'Comités : version space et Query-By-Committee', slides: '51-61',
        summary: 'Version space V(Z) = hypothèses compatibles avec les données ; région de désaccord ; CAL en flux (explicite ou implicite) ; entropie de vote et divergence KL en pool.',
        fiche: R`
<p><b>L’idée.</b> Au lieu de faire confiance à un seul classifieur, on en garde plusieurs, tous compatibles avec les étiquettes déjà connues. Là où ils sont d’accord, l’étiquette est déjà connue ; là où ils divergent, une étiquette en élimine une partie. On demande donc les points de désaccord.</p>

<h4>1. Comité, version space, région de désaccord (slides 51 à 54)</h4>
<div class="def"><b>Comité</b> : $C$ classifieurs $\theta^{(i)}$, $i=1,\dots,C$, rassemblés dans $\mathcal C=\{\theta^{(1)},\dots,\theta^{(C)}\}$. Slide 52 : plusieurs droites qui séparent toutes correctement les « + » et les « − » déjà étiquetés.</div>
<div class="def"><b>Version space</b> : pour un ensemble d’exemples étiquetés $Z\subset\mathcal X\times\mathcal Y$,
$$\mathcal V(Z)=\{h\in\mathcal H:\ h(x)=y,\ \forall(x,y)\in Z\},$$
les hypothèses de $\mathcal H$ compatibles avec <b>toutes</b> les données de $Z$. <b>But revisité de l’actif</b> : trouver les exemples à ajouter à $Z$ qui <b>réduisent</b> $\mathcal V(Z)$.</div>
<div class="def"><b>Région de désaccord</b> d’un ensemble d’hypothèses $\mathcal H$ :
$$\mathcal R(\mathcal H)=\{x\in\mathcal X:\ \exists h,h'\in\mathcal H,\ h(x)\neq h'(x)\},$$
les points non étiquetés sur lesquels au moins deux hypothèses de $\mathcal H$ prédisent des étiquettes différentes (zone colorée du slide 54, là où les droites se croisent).</div>
<p>Hors de la région de désaccord, toutes les hypothèses encore en lice donnent la même étiquette : la demander n’apprendrait rien.</p>

<h4>2. QBC en flux et l’algorithme CAL (slides 55-56)</h4>
<p><b>QBC</b> (<i>Query-By-Committee</i>) en flux : à l’étape $t$, chaque membre prédit l’étiquette $\hat y_t^{(i)}$ du point $x_t$ ; s’ils sont en désaccord, on demande l’étiquette, sinon non.</p>
<div class="thm"><b>Algorithme CAL</b> (Cohn, Atlas et Ladner, 1994), scénario en flux.
<ol><li>$\mathcal H_1\leftarrow\mathcal H$.</li>
<li>Pour $t=1,\dots,T$ : recevoir le point non étiqueté $x_t$.
<ul><li>Si $\exists h,h'\in\mathcal H_t$ avec $h(x_t)\neq h'(x_t)$ (c’est-à-dire $x_t\in\mathcal R(\mathcal H_t)$) : $y_t\leftarrow$ QUERYLABEL$(x_t)$ et $\mathcal H_{t+1}\leftarrow\{h\in\mathcal H_t:\ h(x_t)=y_t\}$.</li>
<li>Sinon : $\mathcal H_{t+1}\leftarrow\mathcal H_t$.</li></ul></li>
<li>Renvoyer $\mathcal H_{T+1}$.</li></ol>
$\mathcal H_t$ est le version space des étiquettes reçues avant l’étape $t$.</div>

<h4>3. Savoir-faire : CAL à la main</h4>
<p>Prenons 11 seuils $h_w(x)=\mathbb 1[x\ge w]$ avec $w\in\{0;\ 0{,}1;\ \dots;\ 1\}$, et un vrai seuil $w^*=0{,}6$ (cas réalisable).</p>
<table><tr><th>$t$</th><th>$x_t$</th><th>$\mathcal H_t$ (valeurs de $w$)</th><th>Désaccord ?</th><th>$y_t$</th><th>$\mathcal H_{t+1}$</th></tr>
<tr><td>1</td><td>0,45</td><td>0 à 1 (11)</td><td>oui ($w\le0{,}4$ dit 1, $w\ge0{,}5$ dit 0)</td><td>0</td><td>0,5 à 1 (6)</td></tr>
<tr><td>2</td><td>0,8</td><td>0,5 à 1</td><td>oui</td><td>1</td><td>0,5 à 0,8 (4)</td></tr>
<tr><td>3</td><td>0,2</td><td>0,5 à 0,8</td><td>non : tous disent 0</td><td>pas demandé</td><td>inchangé</td></tr>
<tr><td>4</td><td>0,62</td><td>0,5 à 0,8</td><td>oui</td><td>1</td><td>0,5 et 0,6</td></tr>
<tr><td>5</td><td>0,5</td><td>0,5 et 0,6</td><td>oui</td><td>0</td><td>0,6 seul</td></tr></table>
<p>4 étiquettes pour 5 points reçus, et l’hypothèse est identifiée. Au tour 3, la région de désaccord de $\mathcal H_3$ était $[0{,}5;\ 0{,}8[$ : le point 0,2 en était sorti.</p>

<h4>4. Le coût de CAL et la version implicite (slides 57-58)</h4>
<ul><li>CAL est simple mais coûteux : il faut mémoriser $\mathcal H_t$, et le version space peut être très grand (infini pour des droites).</li>
<li>Cas idéal : trouver le point qui coupe $\mathcal V(Z)$ <b>en deux</b>, comme la dichotomie du seuil. Problèmes : un tel point peut ne pas exister, on ne sait pas toujours le trouver, et les données ne sont pas toujours séparables par une hypothèse de $\mathcal H$.</li></ul>
<div class="def"><b>Version implicite</b> : décrire $\mathcal V(Z)$ sans l’énumérer, avec un algorithme d’apprentissage <i>learn</i> qui renvoie un classifieur compatible avec un jeu de données s’il en existe un. $S$ = les points vus jusqu’ici (au départ vide). Pour chaque $x_t$ :
<ul><li>si <i>learn</i>$(S\cup\{(x_t,1)\})$ et <i>learn</i>$(S\cup\{(x_t,0)\})$ réussissent tous les deux, les deux étiquettes restent possibles : demander $y_t$ ;</li>
<li>sinon, poser $y_t$ égal à l’étiquette qui a réussi (sans rien demander) ;</li>
<li>dans les deux cas, $S\leftarrow S\cup\{(x_t,y_t)\}$.</li></ul></div>
<p>Les points non demandés entrent quand même dans $S$, avec l’étiquette déduite : rien n’est perdu.</p>

<h4>5. QBC en pool : mesurer le désaccord (slides 59 à 61)</h4>
<p>Chaque membre prédit l’étiquette $\hat y_u^{(i)}$ de chaque point non étiqueté $x_u$ ; on choisit le point où le comité est <b>le plus</b> en désaccord. Deux mesures :</p>
<div class="def"><b>Entropie de vote</b> (comité de $C$ classifieurs, $N_c$ classes) :
$$x^*_{VE}=\arg\max_x\Big[-\sum_{i=1}^{N_c}\frac{V(y_i)}C\log\frac{V(y_i)}C\Big],$$
où $V(y_i)$ est le nombre de membres qui votent pour l’étiquette $y_i$ ; $V(y_i)/C$ est la part des votes.</div>
<div class="def"><b>Divergence de Kullback-Leibler</b> (McCallum et Nigam 98) :
$$x^*_{KL}=\arg\max_x\Big[\frac1C\sum_{c=1}^CD\big(P_{\theta^{(c)}}\,\|\,P_{\mathcal C}\big)\Big],\qquad D\big(P_{\theta^{(c)}}\,\|\,P_{\mathcal C}\big)=\sum_{i=1}^{N_c}P_{\theta^{(c)}}(y_i\mid x)\log\frac{P_{\theta^{(c)}}(y_i\mid x)}{P_{\mathcal C}(y_i\mid x)},$$
où $P_{\mathcal C}(y_i\mid x)=\frac1C\sum_{c=1}^CP_{\theta^{(c)}}(y_i\mid x)$ est la probabilité <b>de consensus</b> que $y_i$ soit la bonne étiquette. On mesure l’écart moyen de chaque membre au consensus.</div>

<h4>6. Savoir-faire : entropie de vote et KL</h4>
<p><b>Entropie de vote</b>, comité de 5 membres, 3 classes, en bits :</p>
<ul><li>votes $(5,0,0)$ : unanimité, entropie 0 : point inutile ;</li>
<li>votes $(3,2,0)$ : $-(0{,}6\log_20{,}6+0{,}4\log_20{,}4)=0{,}971$ ;</li>
<li>votes $(2,2,1)$ : $-(2\times0{,}4\log_20{,}4+0{,}2\log_20{,}2)=1{,}522$ : le plus grand désaccord, c’est lui qu’on demande.</li></ul>
<p><b>KL</b>, deux membres, deux classes, logarithme népérien : $P_{\theta^{(1)}}=(0{,}9;\ 0{,}1)$, $P_{\theta^{(2)}}=(0{,}3;\ 0{,}7)$. Consensus : $P_{\mathcal C}=(0{,}6;\ 0{,}4)$.</p>
<ul><li>$D(P_{\theta^{(1)}}\|P_{\mathcal C})=0{,}9\ln\frac{0{,}9}{0{,}6}+0{,}1\ln\frac{0{,}1}{0{,}4}=0{,}365-0{,}139=0{,}226$ ;</li>
<li>$D(P_{\theta^{(2)}}\|P_{\mathcal C})=0{,}3\ln\frac{0{,}3}{0{,}6}+0{,}7\ln\frac{0{,}7}{0{,}4}=-0{,}208+0{,}392=0{,}184$ ;</li>
<li>moyenne : $\frac{0{,}226+0{,}184}2=0{,}205$.</li></ul>
<p>Si les deux membres disaient tous les deux $(0{,}5;\ 0{,}5)$, la KL vaudrait 0 : ils sont incertains, mais d’accord. La KL mesure le <b>désaccord</b> entre membres, pas l’incertitude de chacun.</p>

<h4>7. Pièges</h4>
<ul><li>Un point peut être très incertain pour chaque membre et pourtant sans désaccord (KL nulle) ; l’entropie de vote, elle, ne voit que les votes et ignore les probabilités.</li>
<li>Avec $C$ membres, l’entropie de vote ne prend qu’un petit nombre de valeurs : les égalités entre points sont fréquentes.</li>
<li>Dans CAL, « pas de désaccord » ne veut pas dire « point inutile pour toujours » : cela veut dire que son étiquette est déjà déterminée par les données.</li>
<li>Les slides ne disent pas comment construire le comité en pratique : seule la règle de requête est donnée.</li></ul>

<h4>8. Lien banque</h4>
<p>Un comité, ce peut être plusieurs modèles de scoring entraînés sur les mêmes dossiers (régression logistique, arbre, réseau). Les dossiers sur lesquels ils divergent sont ceux où l’avis d’un analyste départage le plus de modèles à la fois.</p>

<h4>À retenir</h4>
<ul><li>$\mathcal V(Z)$ : hypothèses compatibles avec toutes les données ; l’actif cherche à le réduire.</li>
<li>$\mathcal R(\mathcal H)$ : points où deux hypothèses au moins divergent ; on ne demande que là.</li>
<li>CAL : demander si $x_t\in\mathcal R(\mathcal H_t)$, puis garder les hypothèses compatibles ; version implicite par deux appels à <i>learn</i>.</li>
<li>En pool : entropie de vote (votes) ou KL moyenne au consensus (probabilités).</li></ul>`,
      },
      {
        id: 'al-dens', title: 'Points isolés et pondération par la densité', slides: '62-64',
        summary: 'Incertitude = ignorance sur l’étiquette ; il faut aussi l’influence sur les voisins. Score |LIG(x)| × |LIF(x)|^β : β règle l’équilibre entre les deux.',
        fiche: R`
<p><b>L’idée.</b> Un point isolé ou bruité peut paraître très incertain, mais son étiquette ne renseigne sur aucun autre point. Mieux vaut un point un peu moins incertain, situé au milieu de beaucoup d’autres : son étiquette se propage à ses voisins.</p>

<h4>1. Le problème (slide 62)</h4>
<p>Pour un seul classifieur comme pour un comité, des points <b>isolés</b> (ou bruités) sont parfois jugés informatifs. Sur le jeu synthétique, un point choisi tout au bord gauche du nuage, en $(-3;\ -0{,}5)$ environ, est annoté « pas très utile » : aucun autre point ne lui ressemble.</p>

<h4>2. Ignorance et influence (slide 63)</h4>
<ul><li>L’incertitude reflète le <b>niveau d’ignorance</b> sur l’étiquette du point.</li>
<li>Il faut aussi considérer le <b>niveau d’influence</b> du point sur ses voisins. Deux familles : les méthodes <b>pondérées par la densité</b> (DWM, <i>density weighted methods</i>) et les méthodes de <b>réduction de l’erreur</b> (seulement nommées sur le slide).</li></ul>
<div class="def">$$x^*_{ID}=\arg\max_x\Big[|LIG(x)|\times|LIF(x)|^\beta\Big]$$
Les sigles ne sont pas développés sur le slide ; la lecture naturelle des deux puces qui précèdent est $LIG$ = niveau d’ignorance (<i>level of ignorance</i> : une mesure d’incertitude, comme l’entropie ou la marge) et $LIF$ = niveau d’influence (<i>level of influence</i> : à quel point le point est entouré d’autres points). $\beta\ge0$ règle l’importance relative des deux termes.</div>
<p><b>Lien avec le semi-supervisé</b> : la densité se calcule sur les points <b>non étiquetés</b>. On exploite l’information qu’ils donnent sur la structure de $\mathcal X$, sans demander aucune étiquette.</p>

<h4>3. Savoir-faire : l’effet de β</h4>
<p>Prenons trois points candidats, avec $LIG$ = entropie (en bits, deux classes) et $LIF$ = similarité moyenne aux autres points du réservoir (entre 0 et 1) :</p>
<table><tr><th>Point</th><th>$LIG$</th><th>$LIF$</th><th>$\beta=0$</th><th>$\beta=1$</th><th>$\beta=3$</th></tr>
<tr><td>A (isolé, très incertain)</td><td>0,95</td><td>0,05</td><td><b>0,95</b></td><td>0,048</td><td>0,0001</td></tr>
<tr><td>B (incertain, entouré)</td><td>0,80</td><td>0,60</td><td>0,80</td><td><b>0,48</b></td><td>0,173</td></tr>
<tr><td>C (assez sûr, très entouré)</td><td>0,30</td><td>0,90</td><td>0,30</td><td>0,27</td><td><b>0,219</b></td></tr></table>
<p>Calcul pour B avec $\beta=1$ : $0{,}80\times0{,}60^1=0{,}48$ ; avec $\beta=3$ : $0{,}80\times0{,}60^3=0{,}80\times0{,}216=0{,}173$. Avec $\beta=0$, la densité ne compte pas ($0{,}05^0=1$) : on retrouve l’incertitude pure, qui choisit le point isolé A. Avec $\beta=1$, on choisit B. Avec $\beta=3$, la densité écrase tout et l’on choisit C, un point dense mais peu incertain.</p>

<h4>4. Ce que montre le slide 64</h4>
<p>Quatre panneaux sur le jeu synthétique : (a) marge, (b) DWM + marge, (c) QBC, (d) DWM + QBC. Avec la pondération par la densité, les points choisis se resserrent sur les portions de frontière situées dans les zones denses, et les points isolés au bord du nuage disparaissent de la sélection.</p>

<h4>5. Pièges</h4>
<ul><li>$\beta$ trop grand : on choisit des points denses mais déjà sûrs, l’actif perd son intérêt. $\beta=0$ : retour aux défauts de l’incertitude pure.</li>
<li>Un point isolé n’est pas forcément du bruit ; il peut appartenir à une petite région réelle (le bloc B de la section « Myopie »). La pondération par la densité ne règle pas la myopie, elle traite un autre défaut.</li>
<li>Bruit (étiquettes intrinsèquement incertaines, section « Bruit ») et point isolé (peu de voisins) sont deux problèmes distincts.</li></ul>

<h4>6. Lien banque</h4>
<p>Une transaction unique et atypique (une erreur de saisie, par exemple) peut obtenir un score très incertain : la faire revoir n’apprend rien sur les autres. Un groupe de transactions semblables et ambiguës vaut mieux : l’avis de l’analyste sur l’une d’elles renseigne le modèle sur tout le groupe.</p>

<h4>À retenir</h4>
<ul><li>L’incertitude seule attire les points isolés ou bruités.</li>
<li>Score $|LIG(x)|\times|LIF(x)|^\beta$ : ignorance fois influence.</li>
<li>$\beta=0$ : incertitude pure ; $\beta$ grand : densité pure.</li>
<li>La densité vient des points non étiquetés : lien avec le semi-supervisé.</li></ul>`,
      },
      {
        id: 'al-theory', title: 'Complexité en étiquettes et coefficient de désaccord', slides: '66-73',
        summary: 'Réalisable : passif d/ε, actif θ d log(1/ε). Agnostique : le terme en ν²/ε² limite le gain. La dimension VC ne suffit plus : coefficient de désaccord θ (2 pour les seuils, ≤ √d pour les linéaires).',
        fiche: R`
<p><b>L’idée.</b> La théorie cherche à chiffrer le gain de l’actif : combien d’étiquettes faut-il pour atteindre une erreur $\epsilon$ ? La dimension VC, qui suffisait en passif, ne suffit plus ; il faut mesurer à quelle vitesse la région de désaccord rétrécit autour de la bonne hypothèse. C’est le coefficient de désaccord $\theta$.</p>

<h4>1. Les questions (slide 66)</h4>
<p>L’actif peut-il faire mieux que le passif ? Si oui, de combien, en vitesse de décroissance de l’erreur ou en complexité d’échantillon ? Dans quelles conditions ? Quelles sont ses limites ? Un algorithme actif est-il consistant, optimal ? Quelle est sa complexité de calcul ?</p>

<h4>2. Les bornes (slides 67-68)</h4>
<div class="def">$n$ : le nombre d’étiquettes nécessaires (<b>complexité en étiquettes</b>) ; $d_{VC}$ : la dimension VC de $\mathcal H$ ; $\epsilon$ : l’erreur visée ; $\theta$ : le coefficient de désaccord (défini plus bas) ; $\nu$ : le meilleur taux d’erreur atteignable dans $\mathcal H$ (cas agnostique). Le signe $\sim$ se lit « de l’ordre de » : constantes et facteurs logarithmiques secondaires sont omis.</div>
<table><tr><th>Cas</th><th>Passif</th><th>Actif (par exemple CAL)</th></tr>
<tr><td>Séparable (réalisable)</td><td>$n\sim\dfrac{d_{VC}}\epsilon$</td><td>$n\sim\theta\,d_{VC}\log\dfrac1\epsilon$</td></tr>
<tr><td>Agnostique, meilleur taux $\nu$</td><td>$n\sim\dfrac{d_{VC}}{\epsilon^2}$</td><td>$n\sim\theta\Big(d_{VC}\log^2\dfrac1\epsilon\Big)+\dfrac{d_{VC}\,\nu^2}{\epsilon^2}$</td></tr></table>
<p class="muted">La formule agnostique est recopiée du slide 68, où $\theta$ ne multiplie que le premier terme. Une version antérieure de cette fiche plaçait $\theta$ devant les deux termes. À confirmer avec le Prof. Siebert (slide 68). La lecture qui suit ne dépend pas de ce point.</p>

<h4>3. Savoir-faire : chiffrer le gain</h4>
<p>Prenons $d_{VC}=10$, $\epsilon=0{,}01$, $\theta=2$, logarithme népérien (ce sont des ordres de grandeur).</p>
<ul><li>Séparable : passif $\frac{10}{0{,}01}=1000$ ; actif $2\times10\times\ln100=2\times10\times4{,}61\approx92$. Environ 11 fois moins d’étiquettes, et l’écart se creuse quand $\epsilon$ diminue.</li>
<li>Agnostique avec $\nu=0{,}05$ : passif $\frac{10}{0{,}0001}=100\,000$ ; actif $2\times10\times(\ln100)^2+\frac{10\times0{,}0025}{0{,}0001}\approx424+250=674$.</li>
<li>Agnostique avec $\nu=0{,}1$ : le second terme vaut $\frac{10\times0{,}01}{0{,}0001}=1000$.</li></ul>
<p>Le second terme agnostique vaut le terme passif multiplié par $\nu^2$ : $\frac{d_{VC}\nu^2}{\epsilon^2}=\nu^2\times\frac{d_{VC}}{\epsilon^2}$. Dès que $\epsilon$ devient petit devant $\nu$, il domine : le gain n’est plus exponentiel, seulement un facteur constant $\nu^2$.</p>

<h4>4. Pourquoi la dimension VC ne suffit pas (slide 69)</h4>
<p>Les intervalles ont une dimension VC de 2, et pourtant l’actif doit parfois demander toutes les étiquettes (section « Le gain théorique »). D’autres notions ont été proposées : le <i>splitting index</i> (Dasgupta et al. 2005) et le <b>coefficient de désaccord</b> (Hanneke 2007), seul développé dans le cours.</p>

<h4>5. Distance, boule et coefficient de désaccord (slides 70 à 72)</h4>
<div class="def"><b>Pseudo-distance de désaccord</b> sur $\mathcal H$ : $d(h,h')=\mathbb P[h(X)\neq h'(X)]$, la probabilité qu’un point tiré au hasard reçoive des étiquettes différentes de $h$ et $h'$ (« pseudo » car deux hypothèses différentes peuvent être à distance 0 si elles ne diffèrent que sur une zone de probabilité nulle).<br>
<b>Boule de désaccord</b> : $B(h,r)=\{h'\in\mathcal H:\ d(h,h')\le r\}$, les hypothèses qui diffèrent de $h$ sur une masse au plus $r$.<br>
<b>Région de désaccord</b> (déjà vue) : $\mathrm{DIS}(\mathcal H)=\mathcal R(\mathcal H)=\{x\in\mathcal X:\ \exists h,h'\in\mathcal H,\ h(x)\neq h'(x)\}$.</div>
<div class="thm"><b>Coefficient de désaccord</b> pour $h\in\mathcal H$ :
$$\theta=\sup_{r>0}\frac{\mathbb P\big[\mathcal R(B(h,r))\big]}{r}.$$
Il mesure comment la région de désaccord grandit avec $r$ : quand on garde toutes les hypothèses à distance au plus $r$ de $h$, la zone où elles divergent a une masse au plus $\theta\,r$.</div>
<p>Slide 72, de gauche à droite : $d(h^*,h)$ est la probabilité de la zone colorée entre deux droites ; quelques éléments de $B(h^*,r)$, des droites proches de $h^*$ ; $\mathrm{DIS}(B(h^*,r))$, la bande couverte par toutes ces droites.</p>
<p><b>Pourquoi $\theta$ apparaît dans la borne</b> (intuition) : CAL ne demande que les points de la région de désaccord. Quand les hypothèses restantes sont à distance au plus $r$ de $h^*$, la probabilité de devoir demander une étiquette est au plus $\theta r$. Un $\theta$ petit veut dire que l’on demande de moins en moins à mesure que l’on progresse.</p>

<h4>6. Savoir-faire : θ pour les seuils (slide 73)</h4>
<p>Prenons $X$ uniforme sur $[0,1]$ et des seuils $h_w(x)=\mathbb 1[x\ge w]$, avec $h^*=h_{0{,}5}$. Deux seuils $w$ et $w'$ diffèrent exactement entre $w$ et $w'$, donc $d(h_w,h_{w'})=|w-w'|$.</p>
<ol><li>$B(h^*,r)$ = les seuils $w\in[0{,}5-r;\ 0{,}5+r]$.</li>
<li>Ces seuils divergent sur l’intervalle $[0{,}5-r;\ 0{,}5+r[$, de masse $2r$ : $\mathbb P[\mathcal R(B(h^*,r))]=2r$.</li>
<li>Le rapport vaut $\frac{2r}r=2$ pour tout $r$ assez petit : $\theta=2$.</li></ol>
<p>Avec $d_{VC}=1$, la borne séparable donne $2\,d_{VC}\log\frac1\epsilon=2\log\frac1\epsilon$, le même ordre que la dichotomie. Près d’un bord, par exemple $h^*=h_{0{,}05}$ et $r=0{,}1$, la région est $[0;\ 0{,}15[$ et le rapport vaut $1{,}5$ ; le supremum sur $r$ reste 2 (atteint pour $r\le0{,}05$).</p>
<p><b>Classifieurs linéaires dans $\mathbb R^d$</b> : $\theta\le\sqrt d$, d’où une complexité en étiquettes de l’ordre de $d_{VC}^{3/2}\log\frac1\epsilon$. Exemple : $d=100$ donne $\theta\le10$.</p>
<p class="muted">$\theta$ dépend de la loi des points $P_X$ (sa définition contient $\mathbb P$). Le slide 73 ne précise pas la loi pour laquelle $\theta\le\sqrt d$ est établi : à confirmer avec le Prof. Siebert (slide 73).</p>

<h4>7. Pièges</h4>
<ul><li>Trois $\theta$ différents dans le chapitre : les paramètres du classifieur dans $P_\theta(y\mid x)$, le coefficient de désaccord ici, et la position de la frontière $\theta^*$ sur le slide 76.</li>
<li>Les bornes sont des ordres de grandeur : elles comparent des vitesses, elles ne donnent pas un budget d’étiquettes exact.</li>
<li>Un $\theta$ borné donne le gain exponentiel en cas séparable ; un $\theta$ qui grandit comme $1/\epsilon$ l’annule.</li></ul>

<h4>À retenir</h4>
<ul><li>Séparable : passif $d_{VC}/\epsilon$, actif $\theta\,d_{VC}\log(1/\epsilon)$.</li>
<li>Agnostique : passif $d_{VC}/\epsilon^2$ ; en actif, le terme $d_{VC}\nu^2/\epsilon^2$ limite le gain à un facteur $\nu^2$ quand $\epsilon\ll\nu$.</li>
<li>$d(h,h')=\mathbb P[h(X)\neq h'(X)]$, $B(h,r)$, $\theta=\sup_r\mathbb P[\mathcal R(B(h,r))]/r$.</li>
<li>Seuils : $\theta=2$ ; linéaires dans $\mathbb R^d$ : $\theta\le\sqrt d$.</li></ul>`,
      },
      {
        id: 'al-noise', title: 'Bruit : là où il ne sert à rien de demander', slides: '75-76',
        summary: 'Les méthodes par incertitude « cherchent le bruit » : elles interrogent les régions où η(x) ≈ 1/2, que nulle étiquette ne tranche. Bruit borné : |η(x) − 1/2| > b > 0 partout.',
        fiche: R`
<p><b>L’idée.</b> Dans certaines régions, l’étiquette est vraiment aléatoire : même un oracle parfait se tromperait une fois sur deux. Une méthode par incertitude y voit un classifieur à 50 % et continue d’y demander des étiquettes, sans jamais rien apprendre.</p>

<h4>1. Les notations</h4>
<div class="def">$\eta(x)=\mathbb P[Y=1\mid X=x]$ : la probabilité que l’étiquette soit 1 pour l’entrée $x$ (la fonction de régression du chapitre de théorie de l’apprentissage). Le classifieur de Bayes prédit 1 là où $\eta(x)>\frac12$ ; son erreur au point $x$ vaut $\min(\eta(x),1-\eta(x))$.</div>

<h4>2. L’influence du bruit (slide 75, Nowak et Castro)</h4>
<p>Exemple du slide : risque de maladie cardiaque selon l’IMC et le cholestérol. Un point prédit avec une confiance de 50 % se trouve peut-être dans une région où le risque réel est de 50/50. Les méthodes par incertitude ont tendance à « <b>chercher le bruit</b> » : elles reviennent sans cesse dans ces régions, alors qu’il est inutile d’y demander des étiquettes.</p>

<h4>3. Trois types de bruit (slide 76)</h4>
<table><tr><th>Type</th><th>Allure de $\eta$ autour de la frontière $\theta^*$</th><th>Conséquence</th></tr>
<tr><td>Sans bruit</td><td>saut de 0 à 1 en $\theta^*$</td><td>cas réalisable, la dichotomie marche</td></tr>
<tr><td>Bruit borné</td><td>saut en $\theta^*$, mais $\eta$ reste à distance au moins $b$ de $\frac12$</td><td>chaque étiquette garde un indice sur le côté de la frontière</td></tr>
<tr><td>Bruit non borné</td><td>$\eta$ traverse $\frac12$ de façon continue</td><td>« pas d’indice fort sur la position de la frontière »</td></tr></table>
<p>Sur ce slide, $\theta^*$ désigne la position de la frontière et $G^*$ la région où le classifieur de Bayes prédit 1.</p>
<div class="def"><b>Bruit borné</b> : il existe $b>0$ tel que
$$\Big|\mathbb P[Y=1\mid X=x]-\frac12\Big|>b\qquad\forall x.$$
En mots : nulle part l’étiquette n’est un pile ou face parfait ; elle penche toujours d’au moins $b$ d’un côté.</div>

<h4>4. Savoir-faire : lire b et en tirer les conséquences</h4>
<p>Prenons $\eta$ qui ne prend que les valeurs $0{,}1;\ 0{,}3;\ 0{,}8;\ 0{,}9$. Les écarts à $\frac12$ valent $0{,}4;\ 0{,}2;\ 0{,}3;\ 0{,}4$ ; le plus petit est $0{,}2$. La condition tient pour tout $b<0{,}2$. Conséquence : l’erreur de Bayes en chaque point vaut $\frac12-|\eta(x)-\frac12|<\frac12-b$, donc ici moins de $0{,}3$ partout.</p>
<p><b>Combien d’étiquettes pour trancher un point ?</b> (rapprochement avec l’inégalité de Hoeffding du chapitre de théorie de l’apprentissage, qui n’est pas sur les slides). Pour savoir de quel côté de $\frac12$ se trouve $\eta(x)$, il faut l’estimer à $b$ près. Avec des étiquettes répétées au même point, Hoeffding demande $n\ge\frac1{2b^2}\ln\frac2\delta$. Pour $b=0{,}1$ et $\delta=0{,}05$ : $n\ge\frac{\ln40}{0{,}02}\approx184{,}4$, soit 185 étiquettes. Plus $b$ est petit, plus ce nombre explose ; en bruit non borné, $b$ tend vers 0 près de la frontière et aucun budget fini ne suffit.</p>

<h4>5. Pièges</h4>
<ul><li>Bruit et point isolé sont deux défauts distincts : le bruit est une étiquette intrinsèquement aléatoire ($\eta\approx\frac12$), le point isolé a seulement peu de voisins (section précédente).</li>
<li>Avec du bruit, $R(h^*)>0$ : on est dans le cas agnostique, et la dichotomie du cas réalisable ne s’applique plus.</li>
<li>Une confiance de 50 % du classifieur peut venir d’un manque de données (utile à corriger) ou d’un vrai 50/50 (inutile) : les méthodes par incertitude ne savent pas les distinguer.</li></ul>

<h4>6. Lien banque</h4>
<p>Certains profils de crédit sont réellement ambigus : des dossiers presque identiques ont des issues opposées. Envoyer encore et encore ces dossiers en revue n’améliore pas le modèle, car l’incertitude est dans la réalité et non dans le modèle. Le budget de revue est mieux employé ailleurs.</p>

<h4>À retenir</h4>
<ul><li>Les méthodes par incertitude cherchent le bruit : elles interrogent les régions où $\eta(x)\approx\frac12$.</li>
<li>Bruit borné : $|\eta(x)-\frac12|>b>0$ pour tout $x$ ; erreur de Bayes inférieure à $\frac12-b$ partout.</li>
<li>Sans bruit, bruit borné, bruit non borné : l’indice sur la frontière s’affaiblit dans cet ordre.</li></ul>`,
      },
    ],

    cards: [
      ['al-intro', 'def', R`Qu’est-ce que l’apprentissage actif, et son objectif ?`, R`Apprentissage interactif où l’algorithme demande à un oracle les étiquettes des points les plus informatifs. Objectif : moins de demandes d’étiquettes que le passif.`],
      ['al-intro', 'quand', R`Quand l’apprentissage actif est-il utile ?`, R`Quand les données non étiquetées abondent et que les étiquettes coûtent cher (experts humains).`],
      ['al-intro', 'settles', R`Exemple de Settles : 30 étiquettes sur 400 points gaussiens ?`, R`Passif : 70 % de précision. Actif : 90 %.`],
      ['al-scen', 'trois', R`Les trois scénarios d’apprentissage actif ?`, R`Membership Query Synthesis (points synthétiques), stream-based (flux, décision point par point), pool-based (réservoir disponible d’emblée, celui du cours).`],
      ['al-scen', 'mqs', R`Principal problème de la synthèse de requêtes (MQS) ?`, R`Les points synthétiques peuvent être impossibles à étiqueter pour un humain (chiffre manuscrit illisible).`],
      ['al-scen', 'boucle', R`Boucle générale en pool-based ?`, R`Choisir $x^*\in D_u$ informatif selon $\hat h_k$, demander $y^*$, ajouter à $D_l$, réentraîner.`],
      ['al-scen', 'froid', R`Démarrage à froid ?`, R`Au début on ne sait pas ce qui est informatif : on commence par un peu d’apprentissage passif.`],
      ['al-1d', 'rayons', R`Rayons positifs, cas réalisable : erreur après $n$ étiquettes en passif et en actif ?`, R`Passif : $O(1/n)$. Actif (dichotomie) : $O(2^{-n})$, chaque étiquette donne un bit de $w^*$.`],
      ['al-1d', 'gain', R`Nombre d’étiquettes pour une erreur $\epsilon$ (rayons) ?`, R`Passif $O(1/\epsilon)$, actif $O(\log(1/\epsilon))$ : gain exponentiel.`],
      ['al-1d', 'intervalles', R`Pourquoi l’actif peut-il échouer pour les intervalles positifs ?`, R`Un intervalle minuscule ne laisse aucun indice tant qu’on n’est pas tombé dedans : il faut parfois demander toutes les étiquettes.`],
      ['al-uncert', 'lc', R`Critère du moins confiant ?`, R`$x^*_{LC}=\arg\max_x[1-P_\theta(\hat y|x)]$ avec $\hat y$ la classe la plus probable.`],
      ['al-uncert', 'marge', R`Critère de marge ?`, R`$x^*_M=\arg\min_x[P_\theta(\hat y_1|x)-P_\theta(\hat y_2|x)]$ (deux classes les plus probables).`],
      ['al-uncert', 'entropie', R`Critère d’entropie ?`, R`$x^*_E=\arg\max_x-\sum_iP_\theta(y_i|x)\log P_\theta(y_i|x)$ : tient compte de toutes les classes.`],
      ['al-uncert', 'binaire', R`En classification binaire, que deviennent les trois critères d’incertitude ?`, R`Ils sont équivalents : ils choisissent le point où $P_\theta(1|x)$ est le plus proche de 1/2.`],
      ['al-uncert', 'info', R`Pourquoi l’entropie mesure-t-elle l’information attendue d’une étiquette ?`, R`L’information d’une réponse $y$ est $-\log P(y)$ ; la réponse étant inconnue, on prend l’espérance : l’entropie.`],
      ['al-incons', 'consistance', R`Définition de la consistance statistique ?`, R`Avec un ensemble d’entraînement infini, l’algorithme converge vers la meilleure hypothèse $h^*$.`],
      ['al-incons', 'myopie', R`Qu’est-ce que la myopie de l’échantillonnage par incertitude ?`, R`Il échantillonne autour de la frontière estimée au début et devient trop sûr sur des régions jamais vues : biais d’échantillonnage, inconsistance (ex. reste à 5 % d’erreur au lieu de 2,5 %).`],
      ['al-incons', 'remede', R`Quel changement de paradigme corrige la myopie ?`, R`Modéliser l’incertitude sur le classifieur lui-même avec un comité de classifieurs.`],
      ['al-qbc', 'vs', R`Version space ?`, R`$\mathcal V(Z)=\{h\in\mathcal H:h(x)=y\ \forall(x,y)\in Z\}$ : hypothèses compatibles avec les données.`],
      ['al-qbc', 'desaccord', R`Région de désaccord ?`, R`$\{x:\exists h,h'\in\mathcal H,\ h(x)\neq h'(x)\}$.`],
      ['al-qbc', 'cal', R`Algorithme CAL ?`, R`Pour chaque $x_t$ du flux : si deux hypothèses de $H_t$ sont en désaccord, demander $y_t$ et garder les $h$ compatibles ; sinon ne rien demander.`],
      ['al-qbc', 've', R`Entropie de vote ?`, R`$x^*_{VE}=\arg\max_x-\sum_i\frac{V(y_i)}C\log\frac{V(y_i)}C$, $V(y_i)$ = votes pour $y_i$ parmi $C$ membres.`],
      ['al-qbc', 'kl', R`Critère KL du QBC ?`, R`$x^*_{KL}=\arg\max_x\frac1C\sum_cD(P_{\theta^{(c)}}\|P_{\mathcal C})$, avec $P_{\mathcal C}$ la moyenne (consensus) des membres.`],
      ['al-qbc', 'densite', R`Pourquoi pondérer par la densité ?`, R`Les points isolés ou bruités paraissent incertains mais n’aident pas : on favorise les points incertains ET influents sur leurs voisins.`],
      ['al-theory', 'separable', R`Complexité en étiquettes, cas séparable : passif vs actif ?`, R`Passif $d_{VC}/\epsilon$ ; actif (CAL) $\theta\,d_{VC}\log(1/\epsilon)$.`],
      ['al-theory', 'theta', R`Coefficient de désaccord ?`, R`$\theta=\sup_{r>0}\mathbb P[\mathcal R(B(h,r))]/r$ : croissance de la région de désaccord autour de $h$. Seuils sur $\mathbb R$ : 2 ; linéaires de $\mathbb R^d$ : $\le\sqrt d$.`],
      ['al-theory', 'bruit', R`Effet du bruit sur les méthodes par incertitude ?`, R`Elles « cherchent le bruit » : elles demandent des étiquettes dans des régions bruitées, ce qui est inutile.`],
      // Ajouts (version approfondie)
      ['al-intro', 'oracle', R`Qu’est-ce que l’oracle, et que coûte une requête ?`, R`Celui qui connaît la bonne étiquette et la donne à la demande (expert humain, test de laboratoire). Chaque requête coûte (temps d’expert) : c’est ce coût qu’on cherche à réduire.`],
      ['al-intro', 'localiser', R`Slide 10 : en classification, où se trouve l’information utile ?`, R`Près de la frontière, là où $p(y\mid x)$ franchit $\frac12$. Loin d’elle, une étiquette de plus confirme ce qu’on sait déjà.`],
      ['al-intro', 'courbe', R`Comment lire une courbe d’apprentissage pour juger l’actif ?`, R`Précision en fonction du nombre d’étiquettes. Horizontalement : combien d’étiquettes pour une précision visée. L’actif est meilleur si sa courbe atteint cette précision avec moins d’étiquettes.`],
      ['al-scen', 'flux-pool', R`Flux ou réservoir : quelle différence au moment de décider ?`, R`Flux : on décide pour chaque point à son passage (demander ou ignorer), sans le revoir ni tout stocker. Réservoir : on voit tout le stock d’emblée et on choisit le meilleur point.`],
      ['al-scen', 'diag', R`MQS sur les chiffres manuscrits : où sont les exemples incertains dans la matrice de confusion ?`, R`Hors de la diagonale : là où la classe prédite diffère de la vraie classe.`],
      ['al-1d', 'reel-agn', R`Cas réalisable et cas agnostique ?`, R`Réalisable (sans bruit) : $R(h^*)=0$, un classifieur fait zéro erreur. Agnostique (cas général) : $R(h^*)$ inconnu, en général positif, et $h^*$ peut ne pas être dans $\mathcal H$.`],
      ['al-1d', 'bit', R`Pourquoi dit-on qu’en dichotomie chaque étiquette donne un bit de $w^*$ ?`, R`Chaque réponse dit si $w^*$ est dans la moitié gauche ou droite de l’intervalle restant : c’est le chiffre binaire suivant de $w^*$. Après $n$ réponses, $w^*$ est connu à $2^{-n}$ près.`],
      ['al-1d', 'pool-log', R`Réservoir de $m$ points triés, seuil réalisable : combien de requêtes pour connaître toutes les étiquettes ?`, R`$\lceil\log_2(m+1)\rceil$ par dichotomie (la frontière est dans l’un des $m+1$ intervalles) ; 1000 points : 10 requêtes.`],
      ['al-uncert', 'contre-ex', R`Exemple du cours (5 classes) : cas 1 $(0;0;0{,}45;0{,}5;0{,}05)$, cas 2 $(0{,}11;0{,}12;0{,}14;0{,}5;0{,}13)$. Que choisissent moins confiant, marge et entropie ?`, R`Moins confiant : égalité (0,5 et 0,5). Marge : cas 1 (0,05 contre 0,36). Entropie : cas 2 (1,997 bits contre 1,234) ; elle mesure la dispersion sur toutes les classes, pas l’hésitation entre les deux premières.`],
      ['al-uncert', 'preuve', R`Idée de la preuve de l’équivalence des trois critères en binaire ?`, R`Avec $u=|p-\frac12|$ : moins confiant $=\frac12-u$, marge $=2u$ (à minimiser), entropie décroissante en $u$. Les trois choisissent le point de plus petit $u$.`],
      ['al-incons', 'calcul-1d', R`Exemple 1D (blocs 45 %, 5 %, 5 %, 45 %) : d’où viennent $R(w^*)=2{,}5\,\%$ et $R(w)=5\,\%$ ?`, R`$w^*$ (entre A et B) ne se trompe que sur la moitié 0 du bloc C mélangé : 2,5 %. $w$ (au milieu de C) classe 0 tout le bloc B, qui est de classe 1 : 5 %.`],
      ['al-incons', 'iid', R`Pourquoi le risque empirique sur $D_l$ est-il trompeur en actif ?`, R`$D_l$ n’est pas un échantillon i.i.d. de $P$ : il est choisi près de la frontière supposée. Son erreur moyenne ne converge pas vers le vrai risque $R$.`],
      ['al-qbc', 'implicite', R`Version implicite de CAL ?`, R`Si $learn(S\cup\{(x_t,1)\})$ et $learn(S\cup\{(x_t,0)\})$ réussissent tous deux, demander $y_t$ ; sinon prendre l’étiquette qui a réussi. Dans les deux cas, ajouter $(x_t,y_t)$ à $S$.`],
      ['al-qbc', 'kl-zero', R`Tous les membres du comité prédisent $(0{,}5;0{,}5)$ pour un point. Que valent la KL au consensus et l’incertitude de chacun ?`, R`KL nulle : tous égaux au consensus, aucun désaccord. Pourtant chacun est au maximum d’incertitude. La KL mesure le désaccord, pas l’incertitude.`],
      ['al-dens', 'isoles', R`Pourquoi un point isolé est-il un mauvais choix même s’il est très incertain ?`, R`Son étiquette ne renseigne sur aucun autre point : elle n’améliore le classifieur que sur une zone presque vide (« pas très utile », slide 62).`],
      ['al-dens', 'lig-lif', R`Formule de pondération par la densité du slide 63 ?`, R`$x^*_{ID}=\arg\max_x|LIG(x)|\times|LIF(x)|^\beta$ : niveau d’ignorance (incertitude) fois niveau d’influence (densité) à la puissance $\beta$.`],
      ['al-dens', 'beta', R`Effet de $\beta$ dans $|LIG|\times|LIF|^\beta$ ?`, R`$\beta=0$ : incertitude pure (attire les points isolés). $\beta$ grand : la densité domine (points denses mais déjà sûrs). Entre les deux : points incertains et entourés.`],
      ['al-dens', 'semi', R`Quel lien entre pondération par la densité et apprentissage semi-supervisé ?`, R`La densité se calcule sur les points non étiquetés : on exploite leur information sur la structure de $\mathcal X$ sans demander d’étiquette.`],
      ['al-theory', 'metrique', R`Distance de désaccord et boule de désaccord ?`, R`$d(h,h')=\mathbb P[h(X)\neq h'(X)]$ ; $B(h,r)=\{h'\in\mathcal H:d(h,h')\le r\}$.`],
      ['al-theory', 'agnostique', R`Cas agnostique : pourquoi le gain de l’actif n’est-il plus exponentiel ?`, R`Le terme $d_{VC}\nu^2/\epsilon^2$ vaut $\nu^2$ fois la complexité passive $d_{VC}/\epsilon^2$ ; quand $\epsilon\ll\nu$ il domine, et le gain se réduit à un facteur $\nu^2$.`],
      ['al-theory', 'vc-insuffisant', R`Pourquoi la dimension VC ne suffit-elle pas à décrire l’actif ?`, R`Les intervalles ont $d_{VC}=2$, et l’actif doit pourtant parfois demander toutes les étiquettes. D’où le splitting index (Dasgupta 2005) et le coefficient de désaccord (Hanneke 2007).`],
      ['al-noise', 'chercher', R`Que veut dire « les méthodes par incertitude cherchent le bruit » ?`, R`Elles interrogent les régions où le classifieur est à 50 %, qui sont souvent des régions où $\eta(x)\approx\frac12$ : nulle étiquette ne les tranche, les requêtes y sont gaspillées.`],
      ['al-noise', 'borne', R`Définition du bruit borné ?`, R`Il existe $b>0$ tel que $|\mathbb P[Y=1\mid X=x]-\frac12|>b$ pour tout $x$ : l’étiquette penche toujours d’au moins $b$ d’un côté.`],
      ['al-noise', 'types', R`Les trois types de bruit du slide 76 ?`, R`Sans bruit : $\eta$ saute de 0 à 1 à la frontière. Bruit borné : saut, mais $\eta$ reste à au moins $b$ de $\frac12$. Bruit non borné : $\eta$ traverse $\frac12$ continûment, aucun indice fort sur la frontière.`],
      ['al-noise', 'bayes-b', R`Sous bruit borné de niveau $b$, que dire de l’erreur de Bayes en chaque point ?`, R`$\min(\eta,1-\eta)=\frac12-|\eta-\frac12|<\frac12-b$.`],
    ],

    quiz: [
      ['al-intro', R`Dans quelle situation l’apprentissage actif est-il le plus intéressant ?`, ['millions de documents, annotation par des juristes coûteuse', 'quelques centaines de points déjà tous étiquetés', 'étiquettes gratuites et instantanées', 'aucune donnée non étiquetée disponible'], 0, R`Beaucoup de données non étiquetées, étiquettes chères : c’est exactement son domaine.`],
      ['al-intro', R`En apprentissage actif, l’algorithme a accès au départ à :`, ['les entrées x, et il demande certaines étiquettes y', 'tous les couples (x, y)', 'seulement les étiquettes', 'la loi P'], 0, R`Il connaît $(x_1,\dots,x_m)$ et interroge l’oracle.`],
      ['al-scen', R`Un capteur embarqué reçoit des mesures une par une et ne peut pas tout stocker. Quel scénario ?`, ['stream-based', 'pool-based', 'MQS', 'passif'], 0, R`Décision point par point, sans mémoire de tout le réservoir.`],
      ['al-uncert', R`Point A : probabilités (0,05 ; 0,48 ; 0,47). Point B : (0,50 ; 0,30 ; 0,20). Lequel l’échantillonnage par marge choisit-il ?`, ['A', 'B', 'les deux sont équivalents', 'aucun'], 0, R`Marges : A $0{,}48-0{,}47=0{,}01$, B $0{,}50-0{,}30=0{,}20$. Le moins confiant, lui, les jugerait presque pareils ($1-0{,}48$ contre $1-0{,}50$) : c’est tout l’intérêt de la marge.`],
      ['al-uncert', R`En binaire, $P_\theta(1|x)$ vaut 0,9 ; 0,55 ; 0,2 pour trois points. Lequel choisit l’échantillonnage par incertitude ?`, ['0,55', '0,9', '0,2', 'aucun'], 0, R`Le plus proche de 1/2.`],
      ['al-1d', R`Seuil sur [0,1], réalisable, précision voulue $2^{-10}$. Combien d’étiquettes en actif (dichotomie) ?`, ['environ 10', 'environ 1024', 'environ 100', 'environ 32'], 0, R`Chaque étiquette divise l’intervalle par 2 : $\log_2(1/\epsilon)=10$.`],
      ['al-incons', R`Pourquoi l’échantillonnage par incertitude peut-il rester bloqué loin de $h^*$ ?`, ['il n’explore que près de sa frontière initiale', 'il demande trop d’étiquettes', 'il utilise un comité', 'il est trop lent à calculer'], 0, R`Biais d’échantillonnage : les régions jamais vues ne sont jamais remises en cause.`],
      ['al-qbc', R`Dans CAL, que se passe-t-il si toutes les hypothèses de $H_t$ prédisent la même étiquette pour $x_t$ ?`, ['on ne demande pas l’étiquette', 'on demande l’étiquette', 'on vide H_t', 'on arrête'], 0, R`L’étiquette est déjà déterminée par le version space : la demander n’apporterait rien.`],
      ['al-qbc', R`Comité de 4 classifieurs, votes 2 / 2 entre deux classes. Entropie de vote (log base 2) ?`, ['1', '0', '0,5', '2'], 0, R`$-2\times\frac12\log_2\frac12=1$ : désaccord maximal.`],
      ['al-theory', R`Dans le cas séparable, avec $\theta$ borné, la dépendance en $\epsilon$ de la complexité passe de :`, [R`$1/\epsilon$ à $\log(1/\epsilon)$`, R`$1/\epsilon^2$ à $1/\epsilon$`, R`$\log(1/\epsilon)$ à $1/\epsilon$`, 'aucun gain'], 0, R`Passif $d/\epsilon$, actif $\theta d\log(1/\epsilon)$.`],
      // Ajouts (version approfondie) : toujours à la fin du tableau
      ['al-intro', R`Une équipe de conformité ne peut revoir que 200 alertes par jour sur 10 000. Pour <b>améliorer le modèle</b> de détection, l’apprentissage actif fait revoir en priorité :`, ['les alertes sur lesquelles le modèle hésite le plus', 'les alertes au score le plus élevé', 'les plus anciennes', 'aucune : le modèle apprend seul'], 0, R`Une alerte notée 0,99 est presque sûrement une fraude : son étiquette confirme ce que le modèle sait déjà. Les alertes incertaines sont celles dont l’étiquette fait bouger le modèle. Revoir les plus suspectes sert un autre objectif (arrêter la fraude), qui se partage le même budget.`],
      ['al-intro', R`Une courbe d’apprentissage montre que le passif atteint 85 % de précision avec 80 étiquettes et l’actif avec 40 (chiffres fictifs). Quelle économie d’étiquettes l’actif apporte-t-il à cette précision ?`, ['50 %', '40 %', '2 %', 'aucune, la précision est la même'], 0, R`On lit la courbe horizontalement : $1-\frac{40}{80}=50\,\%$ d’étiquettes en moins pour la même précision.`],
      ['al-scen', R`Une banque lance une campagne de revue KYC sur son stock de 50 000 dossiers clients existants. Quel scénario d’apprentissage actif ?`, ['pool-based', 'stream-based', 'MQS', 'aucun, c’est du passif'], 0, R`Tout le stock est disponible dès le départ et l’on choisit lesquels faire revoir : c’est un réservoir.`],
      ['al-scen', R`Réservoir $0{,}05;\ 0{,}15;\ \dots;\ 0{,}95$, seuil $\mathbb 1[x\ge w]$. On connaît : 0,55 vaut 0 et 0,95 vaut 1. Quel point demande-t-on ensuite si l’on vise le milieu entre le plus grand 0 et le plus petit 1 ?`, ['0,75', '0,65', '0,85', '0,05'], 0, R`La frontière estimée est $\frac{0{,}55+0{,}95}2=0{,}75$, et 0,75 est dans le réservoir : c’est le point le plus incertain.`],
      ['al-scen', R`Pourquoi commence-t-on toujours par un peu d’apprentissage passif ?`, ['sans classifieur initial, on ne peut pas mesurer l’informativité', 'le passif est plus précis que l’actif', 'l’oracle refuse les premières requêtes', 'pour réduire la mémoire utilisée'], 0, R`L’informativité se mesure avec le classifieur courant $\hat h_k$ ; à l’étape 0 il n’existe pas encore : c’est le démarrage à froid.`],
      ['al-1d', R`Seuil $w^*=0{,}37$ sur $[0,1]$, dichotomie. La première requête en 0,5 répond 1. Quelle est la deuxième requête ?`, ['0,25', '0,75', '0,375', '0,125'], 0, R`La réponse 1 en 0,5 dit que $w^*\le0{,}5$ : il reste $[0;\ 0{,}5]$, dont le milieu est 0,25.`],
      ['al-1d', R`Réservoir de 1000 points triés sur une droite, seuil réalisable. Combien de requêtes suffisent pour connaître les 1000 étiquettes ?`, ['10', '1000', '100', '500'], 0, R`La frontière est dans l’un des 1001 intervalles entre points : $\lceil\log_2 1001\rceil=10$ requêtes par dichotomie, les autres étiquettes se déduisent.`],
      ['al-1d', R`Pourquoi la dichotomie n’aide-t-elle pas pour un intervalle positif minuscule ?`, ['une réponse 0 ne dit pas de quel côté se trouve l’intervalle', 'la dimension VC des intervalles est infinie', 'le problème n’est pas réalisable', 'il faudrait deux oracles'], 0, R`Hors de l’intervalle toutes les réponses valent 0 : chaque requête n’élimine que le point demandé. La dimension VC des intervalles vaut pourtant 2.`],
      ['al-uncert', R`Exemple du cours : cas 1 $(0;\ 0;\ 0{,}45;\ 0{,}5;\ 0{,}05)$ et cas 2 $(0{,}11;\ 0{,}12;\ 0{,}14;\ 0{,}5;\ 0{,}13)$. Lequel l’entropie choisit-elle ?`, ['le cas 2', 'le cas 1', 'égalité, comme pour le moins confiant', 'aucun des deux'], 0, R`Entropies : 1,234 bit (cas 1) contre 1,997 bits (cas 2). L’entropie mesure la dispersion sur les 5 classes, et le cas 2 est plus dispersé. La marge, elle, choisit le cas 1 (0,05 contre 0,36).`],
      ['al-uncert', R`Points A $(0{,}5;\ 0{,}3;\ 0{,}2)$, B $(0{,}45;\ 0{,}45;\ 0{,}1)$, C $(0{,}4;\ 0{,}3;\ 0{,}3)$. Que choisit le critère du moins confiant ?`, ['C', 'B', 'A', 'B et C à égalité'], 0, R`$1-P(\hat y\mid x)$ vaut 0,5 ; 0,55 ; 0,6 : le maximum est C. La marge, elle, choisirait B (marge nulle).`],
      ['al-uncert', R`On calcule l’entropie en base $e$ au lieu de la base 2. Que change ce choix pour le point choisi ?`, ['rien : toutes les entropies sont multipliées par la même constante', 'on choisit le point le moins incertain', 'on choisit le point de plus petite marge', 'le critère n’est plus défini'], 0, R`$\ln p=\ln2\times\log_2p$ : toutes les valeurs sont multipliées par $\ln2$, l’ordre des points ne change pas.`],
      ['al-incons', R`Exemple 1D du cours : quelle est la probabilité que 10 points tirés au hasard au démarrage ne tombent jamais dans le bloc de 5 % ?`, ['environ 0,60', 'environ 0,05', 'environ 0,40', 'environ 0,95'], 0, R`$(1-0{,}05)^{10}=0{,}95^{10}\approx0{,}599$ : dans plus de la moitié des cas, le démarrage ne voit pas ce bloc.`],
      ['al-incons', R`L’échantillonnage par incertitude sur des seuils, cas réalisable (sans bruit). Est-il bloqué comme dans l’exemple 1D du cours ?`, ['non : il fait une dichotomie et trouve le vrai seuil', 'oui, toujours', 'oui, si le démarrage a plus de 10 points', 'on ne peut pas savoir'], 0, R`L’inconsistance concerne le cas agnostique. Sans bruit, interroger près de la frontière revient à la dichotomie, qui converge vers $w^*$.`],
      ['al-incons', R`Exemple 1D du cours : l’algorithme converge vers $w$, au milieu du bloc mélangé. Quelle erreur garde-t-il ?`, ['5 %, le double de l’optimum 2,5 %', '2,5 %, l’optimum', '0 %', '45 %'], 0, R`$w$ classe 0 tout le bloc B (5 %), qui est de classe 1 ; le meilleur seuil $w^*$ ne se trompe que sur 2,5 %.`],
      ['al-qbc', R`Seuils $\mathbb 1[x\ge w]$, version space $\{0{,}5;\ 0{,}6;\ 0{,}7;\ 0{,}8\}$. CAL reçoit $x_t=0{,}2$. Que fait-il ?`, ['il ne demande pas : tous prédisent 0', 'il demande l’étiquette', 'il retire 0,5 du version space', 'il recommence avec tout $\mathcal H$'], 0, R`Pour tout $w\ge0{,}5$, $0{,}2<w$ donc $h_w(0{,}2)=0$ : 0,2 est hors de la région de désaccord $[0{,}5;\ 0{,}8[$.`],
      ['al-qbc', R`Version implicite de CAL : $learn(S\cup\{(x_t,1)\})$ réussit, $learn(S\cup\{(x_t,0)\})$ échoue. Que fait-on ?`, [R`on ne demande rien et on ajoute $(x_t,1)$ à $S$`, 'on demande l’étiquette', R`on ignore $x_t$ sans l’ajouter à $S$`, R`on ajoute $(x_t,0)$ à $S$`], 0, R`Une seule étiquette est compatible avec les données : elle est déduite, et le point entre dans $S$ avec elle.`],
      ['al-qbc', R`Deux membres prédisent $(0{,}9;\ 0{,}1)$ et $(0{,}3;\ 0{,}7)$. Quel est le consensus $P_{\mathcal C}$ ?`, [R`$(0{,}6;\ 0{,}4)$`, R`$(0{,}9;\ 0{,}7)$`, R`$(0{,}5;\ 0{,}5)$`, R`$(0{,}27;\ 0{,}07)$`], 0, R`$P_{\mathcal C}(y_i\mid x)=\frac1C\sum_cP_{\theta^{(c)}}(y_i\mid x)$ : $\frac{0{,}9+0{,}3}2=0{,}6$ et $\frac{0{,}1+0{,}7}2=0{,}4$.`],
      ['al-dens', R`Avec $|LIG|\times|LIF|^\beta$ et $\beta=0$, on retrouve :`, ['l’échantillonnage par incertitude pur', 'le tirage au hasard', 'la sélection des points les plus denses', 'la dichotomie'], 0, R`$|LIF|^0=1$ : seule l’incertitude compte, avec son défaut (les points isolés).`],
      ['al-dens', R`Point A : $LIG=0{,}95$, $LIF=0{,}05$. Point B : $LIG=0{,}8$, $LIF=0{,}6$. Avec $\beta=1$, lequel est choisi ?`, ['B', 'A', 'égalité', 'aucun'], 0, R`A : $0{,}95\times0{,}05=0{,}048$ ; B : $0{,}8\times0{,}6=0{,}48$. Le point isolé A, très incertain, est écarté.`],
      ['al-dens', R`D’où vient l’information de densité utilisée par les méthodes DWM ?`, ['des points non étiquetés du réservoir', 'des étiquettes demandées à l’oracle', 'de la loi $P_{XY}$, supposée connue', 'du comité de classifieurs'], 0, R`La densité se mesure sur les points sans étiquette : c’est le lien avec l’apprentissage semi-supervisé.`],
      ['al-theory', R`$X$ uniforme sur $[0,1]$, seuils, $h^*=h_{0{,}5}$, $r=0{,}1$. Que vaut $\mathbb P[\mathcal R(B(h^*,r))]$ ?`, ['0,2', '0,1', '0,05', '1'], 0, R`$B(h^*,0{,}1)$ contient les seuils de $[0{,}4;\ 0{,}6]$, qui divergent sur $[0{,}4;\ 0{,}6[$, de masse 0,2. Le rapport $0{,}2/0{,}1=2$ donne $\theta=2$.`],
      ['al-theory', R`Cas agnostique avec $\epsilon$ très petit devant $\nu$. Que devient le gain de l’actif ?`, [R`un facteur constant de l’ordre de $\nu^2$`, 'toujours exponentiel', 'nul : l’actif est pire que le passif', R`un facteur $\theta$`], 0, R`Le terme $d_{VC}\nu^2/\epsilon^2$ domine ; c’est $\nu^2$ fois la complexité passive $d_{VC}/\epsilon^2$.`],
      ['al-theory', R`Classifieurs linéaires dans $\mathbb R^{100}$. Quelle borne sur le coefficient de désaccord donne le slide 73 ?`, [R`$\theta\le10$`, R`$\theta\le100$`, R`$\theta=2$`, R`$\theta\le1000$`], 0, R`$\theta\le\sqrt d=\sqrt{100}=10$, d’où une complexité de l’ordre de $d^{3/2}\log\frac1\epsilon=1000\log\frac1\epsilon$.`],
      ['al-noise', R`Le classifieur donne 50 % de confiance pour un point situé dans une région où le vrai risque est 50/50. Faut-il demander d’autres étiquettes dans cette région ?`, ['non : aucune étiquette ne la tranchera', 'oui, c’est la région la plus informative', 'oui, jusqu’à ce que la confiance atteigne 100 %', 'seulement avec un comité'], 0, R`Si $\eta(x)\approx\frac12$, même le classifieur de Bayes s’y trompe une fois sur deux : les requêtes y sont gaspillées. C’est le sens de « chercher le bruit ».`],
      ['al-noise', R`$\eta$ prend les valeurs $0{,}1;\ 0{,}3;\ 0{,}8;\ 0{,}9$. Pour quels $b$ la condition de bruit borné est-elle vérifiée ?`, [R`tout $b<0{,}2$`, R`tout $b<0{,}4$`, R`tout $b<0{,}1$`, 'aucun'], 0, R`Les écarts $|\eta-\frac12|$ valent $0{,}4;\ 0{,}2;\ 0{,}3;\ 0{,}4$ ; la condition $>b$ doit valoir partout, donc $b<0{,}2$.`],
      ['al-noise', R`$\eta$ traverse $\frac12$ de façon continue autour de la frontière. De quel type de bruit s’agit-il ?`, ['bruit non borné', 'bruit borné', 'sans bruit', 'bruit uniforme'], 0, R`Près de la frontière, $|\eta-\frac12|$ devient aussi petit qu’on veut : aucun $b>0$ ne convient, et les étiquettes ne donnent pas d’indice fort sur la position de la frontière.`],
    ],

    gens: {
      'al-uncert': [
        () => {
          const p = pick([[0.5, 0.3, 0.2], [0.6, 0.3, 0.1], [0.4, 0.4, 0.2], [0.7, 0.2, 0.1], [0.34, 0.33, 0.33]]);
          const h = -p.reduce((s, x) => s + x * Math.log2(x), 0);
          return { q: R`Probabilités a posteriori $(${p.map(x => f(x, 2)).join(' ; ')})$. Entropie en bits ? (3 décimales)`, a: h, tol: 0.003,
            expl: R`$-\sum p\log_2p=${f(h)}$ bits (maximum $\log_23\approx1{,}585$ pour 3 classes uniformes).` };
        },
        () => {
          const p = pick([[0.45, 0.4, 0.15], [0.5, 0.3, 0.2], [0.6, 0.35, 0.05], [0.38, 0.32, 0.3]]);
          return { q: R`Probabilités $(${p.map(x => f(x, 2)).join(' ; ')})$. Marge $P(\hat y_1|x)-P(\hat y_2|x)$ ?`, a: p[0] - p[1], tol: 0.001, expl: R`$${f(p[0], 2)}-${f(p[1], 2)}=${f(p[0] - p[1], 2)}$.` };
        },
        () => {
          const p = pick([[0.2, 0.5, 0.3], [0.1, 0.25, 0.65], [0.4, 0.35, 0.25], [0.05, 0.9, 0.05], [0.3, 0.3, 0.4], [0.15, 0.55, 0.3]]);
          const m = Math.max(...p);
          return { q: R`Probabilités a posteriori $(${p.map(x => f(x, 2)).join(' ; ')})$. Score du moins confiant $1-P_\theta(\hat y\mid x)$ ?`, a: 1 - m, tol: 0.001,
            expl: R`La classe la plus probable a $P_\theta(\hat y\mid x)=${f(m, 2)}$, donc $1-${f(m, 2)}=${f(1 - m, 2)}$. Les autres classes n’interviennent pas.` };
        },
        () => {
          const sets = [
            [[0.5, 0.3, 0.2], [0.45, 0.45, 0.1], [0.4, 0.3, 0.3]],
            [[0.6, 0.2, 0.2], [0.48, 0.47, 0.05], [0.4, 0.35, 0.25]],
            [[0.7, 0.15, 0.15], [0.5, 0.45, 0.05], [0.55, 0.25, 0.2]],
            [[0.34, 0.33, 0.33], [0.5, 0.5, 0], [0.6, 0.4, 0]],
          ];
          const top2 = p => { const s = [...p].sort((a, b) => b - a); return [s[0], s[1]]; };
          const crit = [
            { name: 'du moins confiant', score: p => 1 - Math.max(...p), show: p => f(1 - Math.max(...p), 2), word: '$1-P(\\hat y\\mid x)$', best: 'le plus grand' },
            { name: 'de la marge', score: p => -(top2(p)[0] - top2(p)[1]), show: p => f(top2(p)[0] - top2(p)[1], 2), word: 'la marge', best: 'la plus petite' },
            { name: 'de l’entropie', score: p => ent2(p), show: p => f(ent2(p)), word: 'l’entropie (bits)', best: 'la plus grande' },
          ];
          for (;;) {
            const S = pick(sets), c = pick(crit), sc = S.map(c.score), best = Math.max(...sc);
            if (sc.filter(v => Math.abs(v - best) < 1e-9).length !== 1) continue;
            const i = sc.indexOf(best), L = ['A', 'B', 'C'];
            return { q: R`Trois points, trois classes : A $(${S[0].map(x => f(x, 2)).join(' ; ')})$, B $(${S[1].map(x => f(x, 2)).join(' ; ')})$, C $(${S[2].map(x => f(x, 2)).join(' ; ')})$. Quel point choisit le critère ${c.name} ?`,
              opts: L, a: i, keepOrder: true,
              expl: R`Valeurs de ${c.word} : ${S.map((p, j) => `${L[j]} $${c.show(p)}$`).join(', ')}. On prend ${c.best} : ${L[i]}.` };
          }
        },
      ],
      'al-1d': [
        () => {
          const k = rnd(5, 20);
          return { q: R`Seuil sur $[0,1]$, cas réalisable. Combien d’étiquettes faut-il en actif (dichotomie) pour localiser $w^*$ à $2^{-${k}}$ près ? Et combien de points régulièrement espacés en passif ? Donne le nombre passif.`, a: 2 ** k, tol: 2,
            expl: R`Actif : ${k} étiquettes. Passif : environ $1/\epsilon=2^{${k}}=${2 ** k}$ points. Gain exponentiel.` };
        },
        () => {
          const ws = rnd(3, 97) / 100, k = rnd(3, 5);
          let lo = 0, hi = 1; const steps = [];
          for (let i = 0; i < k; i++) {
            const m = (lo + hi) / 2, y = m >= ws ? 1 : 0;
            if (y) hi = m; else lo = m;
            steps.push(R`$x=${f(m, 5)}\Rightarrow y=${y}\Rightarrow[${f(lo, 5)};\ ${f(hi, 5)}]$`);
          }
          return { q: R`Seuil $h_{w^*}(x)=\mathbb 1[x\ge w^*]$ sur $[0,1]$, avec $w^*=${f(ws, 2)}$ (inconnu de l’algorithme). On fait ${k} requêtes par dichotomie, la première en $x=0{,}5$. Quelle est la borne inférieure de l’intervalle qui contient encore $w^*$ ? (5 décimales)`,
            a: lo, tol: 0.00001,
            expl: R`À chaque requête on interroge le milieu ; réponse 1 : $w^*$ est à gauche, réponse 0 : à droite. ${steps.join(' ; ')}. Largeur finale $2^{-${k}}=${f(2 ** -k, 5)}$.` };
        },
        () => {
          const m = rnd(2, 7), n = Math.ceil(m * Math.log2(10));
          return { q: R`Seuil sur $[0,1]$, cas réalisable. Combien d’étiquettes la dichotomie demande-t-elle pour localiser $w^*$ à $\epsilon=10^{-${m}}$ près ?`, a: n, tol: 0, unit: 'étiquettes',
            expl: R`Il faut $2^{-n}\le10^{-${m}}$, soit $n\ge${m}\log_210\approx${f(m * Math.log2(10), 2)}$, donc $n=${n}$. Le passif en demanderait de l’ordre de $10^{${m}}$.` };
        },
      ],
      'al-incons': [
        () => {
          let p2, p3;
          do { p2 = pick([0.04, 0.05, 0.06, 0.08, 0.1]); p3 = pick([0.04, 0.05, 0.06, 0.08, 0.1]); } while (!(p3 / 2 < p2));
          const p1 = (1 - p2 - p3) / 2, which = pick(['w*', 'w']);
          const a = which === 'w*' ? 100 * p3 / 2 : 100 * p2;
          return { q: R`Quatre blocs sur une droite : A (masse $${f(100 * p1, 1)}\,\%$, classe 0), B ($${f(100 * p2, 1)}\,\%$, classe 1), C ($${f(100 * p3, 1)}\,\%$, moitié classe 0 à gauche, moitié classe 1 à droite), D ($${f(100 * p1, 1)}\,\%$, classe 1). Seuil : 0 à gauche, 1 à droite. Risque (en %) du seuil ${which === 'w*' ? '$w^*$ placé entre A et B' : '$w$ placé au milieu de C'} ?`,
            a, tol: 0.01, unit: '%',
            expl: which === 'w*'
              ? R`$w^*$ classe 1 tout ce qui est à sa droite : seule la moitié 0 de C est fausse, $\frac{${f(100 * p3, 1)}}2=${f(a, 2)}\,\%$.`
              : R`$w$ classe 0 tout le bloc B, qui est de classe 1 ; C est bien coupé. Risque $${f(a, 2)}\,\%$, contre $${f(100 * p3 / 2, 2)}\,\%$ pour $w^*$.` };
        },
        () => {
          const p = pick([0.02, 0.05, 0.1]), n = pick([5, 10, 20, 30]), v = (1 - p) ** n;
          return { q: R`Un bloc de masse $${f(100 * p, 0)}\,\%$ porte une partie de la classe 1. Probabilité qu’aucun des $${n}$ points tirés au hasard au démarrage à froid ne tombe dedans ? (3 décimales)`, a: v, tol: 0.002,
            expl: R`Les tirages sont indépendants : $(1-${f(p, 2)})^{${n}}=${f(v)}$. Si aucun point n’y tombe, le premier classifieur ignore ce bloc et l’échantillonnage par incertitude risque de ne jamais y revenir.` };
        },
      ],
      'al-qbc': [
        () => {
          const C = pick([4, 5, 6, 8, 10]);
          const v1 = rnd(0, C), v2 = rnd(0, C - v1), v = [v1, v2, C - v1 - v2].sort((a, b) => b - a);
          const h = ent2(v.map(x => x / C));
          return { q: R`Comité de $C=${C}$ classifieurs, 3 classes. Votes $V(y_i)$ : $(${v.join(' ; ')})$. Entropie de vote en bits ? (3 décimales)`, a: h, tol: 0.002,
            expl: R`Parts des votes $V(y_i)/C$ : $(${v.map(x => f(x / C, 3)).join(' ; ')})$. $-\sum\frac{V(y_i)}C\log_2\frac{V(y_i)}C=${f(h)}$ bits (une classe sans vote ne compte pas ; unanimité : 0).` };
        },
        () => {
          const a1 = pick([0.9, 0.8, 0.7, 0.6]), a2 = pick([0.1, 0.2, 0.3, 0.4, 0.5]);
          const P1 = [a1, 1 - a1], P2 = [a2, 1 - a2], Pc = [(a1 + a2) / 2, 1 - (a1 + a2) / 2];
          const kl = (p, q) => p.reduce((s, x, i) => s + (x > 0 ? x * Math.log(x / q[i]) : 0), 0);
          const d1 = kl(P1, Pc), d2 = kl(P2, Pc), m = (d1 + d2) / 2;
          return { q: R`Deux membres, deux classes : $P_{\theta^{(1)}}=(${f(a1, 2)};\ ${f(1 - a1, 2)})$, $P_{\theta^{(2)}}=(${f(a2, 2)};\ ${f(1 - a2, 2)})$. Moyenne des divergences KL au consensus (logarithme népérien, 3 décimales) ?`, a: m, tol: 0.002,
            expl: R`Consensus $P_{\mathcal C}=(${f(Pc[0], 2)};\ ${f(Pc[1], 2)})$. $D(P_{\theta^{(1)}}\|P_{\mathcal C})=${f(d1)}$, $D(P_{\theta^{(2)}}\|P_{\mathcal C})=${f(d2)}$, moyenne $${f(m)}$.` };
        },
        () => {
          const W = rnd(3, 8), a = rnd(0, 2), b = rnd(0, 2);
          const x0 = 2 * W - 1 - 2 * a, x1 = 2 * W + 1 + 2 * b;
          const lo = (x0 + 1) / 2, hi = (x1 - 1) / 2, n = hi - lo + 1;
          return { q: R`Seuils $h_w(x)=\mathbb 1[x\ge w]$ avec $w\in\{0;\ 0{,}1;\ \dots;\ 1\}$. Étiquettes connues : $x=${f(x0 / 20, 2)}$ a l’étiquette 0, $x=${f(x1 / 20, 2)}$ a l’étiquette 1. Combien d’hypothèses contient le version space ?`, a: n, tol: 0, unit: 'hypothèses',
            expl: R`Compatible avec 0 en $${f(x0 / 20, 2)}$ : $w>${f(x0 / 20, 2)}$. Compatible avec 1 en $${f(x1 / 20, 2)}$ : $w\le${f(x1 / 20, 2)}$. Restent $w\in\{${Array.from({ length: n }, (_, j) => f((lo + j) / 10, 1)).join(';\\ ')}\}$ : ${n} hypothèse${n > 1 ? 's' : ''}.` };
        },
        () => {
          const lo = rnd(2, 5), hi = lo + rnd(1, 3), xt = rnd(1, 19) / 20;
          const vs = Array.from({ length: hi - lo + 1 }, (_, j) => (lo + j) / 10);
          const ask = vs.some(w => xt >= w) && vs.some(w => xt < w);
          return { q: R`CAL avec des seuils $h_w(x)=\mathbb 1[x\ge w]$. Version space courant : $w\in\{${vs.map(w => f(w, 1)).join(';\\ ')}\}$. Le point $x_t=${f(xt, 2)}$ arrive. Que fait CAL ?`,
            opts: ['demander l’étiquette', 'ne pas demander'], a: ask ? 0 : 1, keepOrder: true,
            expl: ask
              ? R`Les seuils $w\le${f(xt, 2)}$ prédisent 1, les autres 0 : $x_t$ est dans la région de désaccord $[${f(vs[0], 1)};\ ${f(vs[vs.length - 1], 1)}[$, on demande.`
              : R`Tous les seuils prédisent ${xt >= vs[vs.length - 1] ? 1 : 0} : $x_t$ est hors de la région de désaccord $[${f(vs[0], 1)};\ ${f(vs[vs.length - 1], 1)}[$, son étiquette est déjà connue.` };
        },
      ],
      'al-dens': [
        () => {
          const lig = pick([0.5, 0.7, 0.8, 0.9, 0.95]), lif = pick([0.1, 0.3, 0.5, 0.6, 0.9]), beta = pick([0, 1, 2, 3]);
          const s = lig * lif ** beta;
          return { q: R`Un point a $LIG(x)=${f(lig, 2)}$ (incertitude) et $LIF(x)=${f(lif, 2)}$ (densité). Score $|LIG|\times|LIF|^\beta$ pour $\beta=${beta}$ ? (4 décimales)`, a: s, tol: 0.0001,
            expl: R`$${f(lig, 2)}\times${f(lif, 2)}^{${beta}}=${f(lig, 2)}\times${f(lif ** beta, 4)}=${f(s, 4)}$.${beta === 0 ? ' Avec $\\beta=0$, la densité ne compte pas.' : ''}` };
        },
        () => {
          const P = [['A', 0.95, 0.05], ['B', 0.8, 0.6], ['C', 0.3, 0.9]];
          for (;;) {
            const beta = pick([0, 1, 2, 3, 4]);
            const sc = P.map(([, l, d]) => l * d ** beta), best = Math.max(...sc);
            if (sc.filter(v => Math.abs(v - best) < 1e-9).length !== 1) continue;
            const i = sc.indexOf(best);
            return { q: R`Trois points ($LIG$ ; $LIF$) : A $(0{,}95;\ 0{,}05)$ isolé, B $(0{,}8;\ 0{,}6)$, C $(0{,}3;\ 0{,}9)$ très entouré. Lequel maximise $|LIG|\times|LIF|^\beta$ pour $\beta=${beta}$ ?`,
              opts: ['A', 'B', 'C'], a: i, keepOrder: true,
              expl: R`Scores : ${P.map(([n], j) => `${n} $${f(sc[j], 4)}$`).join(', ')}. ${beta === 0 ? 'Incertitude pure : le point isolé gagne.' : beta >= 3 ? 'La densité domine : le point dense mais peu incertain gagne.' : 'Équilibre : le point incertain et entouré gagne.'}` };
          }
        },
      ],
      'al-theory': [
        () => {
          const d = pick([1, 2, 5, 10, 20]), eps = pick([0.1, 0.01, 0.001]), th = pick([1, 2, 5]);
          const act = th * d * Math.log(1 / eps);
          return { q: R`Cas séparable : $d_{VC}=${d}$, $\epsilon=${f(eps)}$, $\theta=${th}$. Ordre de grandeur de la complexité en étiquettes de l’actif, $\theta\,d_{VC}\ln\frac1\epsilon$ ? (1 décimale)`, a: act, tol: 0.15,
            expl: R`$${th}\times${d}\times\ln${f(1 / eps, 0)}=${th * d}\times${f(Math.log(1 / eps), 3)}\approx${f(act, 1)}$, contre $d_{VC}/\epsilon=${f(d / eps, 0)}$ en passif.` };
        },
        () => {
          const w = pick([0.05, 0.1, 0.3, 0.5, 0.7, 0.9, 0.95]), r = pick([0.05, 0.1, 0.2]);
          const L = Math.max(w - r, 0), U = Math.min(w + r, 1), m = U - L;
          return { q: R`$X$ uniforme sur $[0,1]$, seuils $h_w(x)=\mathbb 1[x\ge w]$, $h^*=h_{${f(w, 2)}}$, $r=${f(r, 2)}$. Que vaut $\mathbb P[\mathcal R(B(h^*,r))]$ ? (3 décimales)`, a: m, tol: 0.001,
            expl: R`$d(h_w,h_{w'})=|w-w'|$, donc $B(h^*,r)$ contient les seuils de $[${f(L, 2)};\ ${f(U, 2)}]$ (intersection avec $[0,1]$). Ils divergent sur cet intervalle, de masse $${f(m, 3)}$. Rapport $${f(m, 3)}/${f(r, 2)}=${f(m / r, 2)}$${Math.abs(m / r - 2) > 1e-9 ? ' : effet de bord ; le supremum sur $r$ reste 2' : ' : $\\theta=2$'}.` };
        },
        () => {
          const d = pick([5, 10, 20]), eps = pick([0.01, 0.02, 0.05]), nu = pick([0.05, 0.1, 0.2]);
          const t2 = d * nu * nu / (eps * eps);
          return { q: R`Cas agnostique : $d_{VC}=${d}$, $\epsilon=${f(eps)}$, meilleur taux $\nu=${f(nu)}$. Que vaut le terme $\frac{d_{VC}\nu^2}{\epsilon^2}$ de la borne active ? (1 décimale)`, a: t2, tol: 0.15,
            expl: R`$\frac{${d}\times${f(nu * nu, 4)}}{${f(eps * eps, 4)}}=${f(t2, 1)}$. C’est $\nu^2=${f(nu * nu, 4)}$ fois la complexité passive $d_{VC}/\epsilon^2=${f(d / (eps * eps), 0)}$ : un gain d’un facteur constant, pas exponentiel.` };
        },
      ],
      'al-noise': [
        () => {
          const pool = [0.05, 0.1, 0.15, 0.2, 0.3, 0.35, 0.4, 0.6, 0.65, 0.7, 0.8, 0.85, 0.9, 0.95];
          const e = []; while (e.length < 4) { const v = pick(pool); if (!e.includes(v)) e.push(v); }
          e.sort((a, b) => a - b);
          const gaps = e.map(x => Math.abs(x - 0.5)), b = Math.min(...gaps);
          return { q: R`$\eta(x)$ ne prend que les valeurs $${e.map(x => f(x, 2)).join(';\\ ')}$. Quelle est la plus grande valeur $b^\circ$ telle que le bruit borné $|\eta(x)-\frac12|>b$ soit vrai pour tout $b<b^\circ$ ?`, a: b, tol: 0.001,
            expl: R`Écarts $|\eta-\frac12|$ : $${gaps.map(x => f(x, 2)).join(';\\ ')}$. Le plus petit est $${f(b, 2)}$ : la condition tient pour tout $b<${f(b, 2)}$, et l’erreur de Bayes reste partout sous $\frac12-${f(b, 2)}=${f(0.5 - b, 2)}$.` };
        },
        () => {
          const b = pick([0.05, 0.1, 0.2, 0.25]), delta = pick([0.01, 0.05, 0.1]);
          const n = Math.ceil(Math.log(2 / delta) / (2 * b * b));
          return { q: R`Bruit borné de niveau $b=${f(b, 2)}$. Avec Hoeffding, combien d’étiquettes répétées en un même point faut-il pour estimer $\eta(x)$ à $b$ près avec confiance $${f(1 - delta, 2)}$ (et donc savoir de quel côté de $\frac12$ il se trouve) ?`, a: n, tol: 0, unit: 'étiquettes',
            expl: R`$n\ge\frac1{2b^2}\ln\frac2\delta=\frac{\ln${f(2 / delta, 0)}}{${f(2 * b * b, 4)}}\approx${f(Math.log(2 / delta) / (2 * b * b), 1)}$, donc $n=${n}$. Quand $b\to0$ (bruit non borné), ce nombre explose.` };
        },
      ],
    },
  });
})();
