// Chapitre : Active Learning (X. Siebert, slides activeLearning_en, 76 slides).
(function () {
  const R = String.raw;
  const { pick, rnd, f } = COURSE.u;

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
<p>Applications modernes : d’énormes bases de données, dont seule une petite fraction peut être annotée par des experts humains.</p>
<div class="def"><b>Apprentissage actif</b> (query learning, optimal experimental design) : apprentissage <b>interactif</b> où l’algorithme demande à un <b>oracle</b> l’étiquette des points qu’il juge les plus <b>informatifs</b>.</div>
<table><tr><th>Passif</th><th>Actif</th></tr>
<tr><td>échantillon i.i.d. $(x_1,y_1),\dots,(x_m,y_m)\sim P^m$, entièrement étiqueté</td><td>on dispose de $(x_1,\dots,x_m)$ et on <b>demande</b> l’étiquette $y_i$ de certains $x_i$</td></tr>
<tr><td colspan="2">Objectif de l’actif : <b>moins de demandes d’étiquettes</b> que le passif pour la même précision.</td></tr></table>
<p>Utile pour <b>localiser l’information</b> : l’essentiel se joue près de la frontière de décision.</p>
<p><b>Exemples</b> (Settles 08) : 400 points gaussiens, 30 étiquettes. Passif (30 points au hasard) : 70 % de précision ; actif (30 points bien choisis) : 90 %. Classification de 20 000 textes baseball/hockey : la courbe d’apprentissage de l’actif monte plus vite.</p>`,
      },
      {
        id: 'al-scen', title: 'Trois scénarios', slides: '15-22',
        summary: 'Synthèse de requêtes (MQS), flux (stream-based) ou réservoir (pool-based, celui du cours).',
        fiche: R`
<ol><li><b>Membership Query Synthesis (MQS)</b> : l’algorithme peut demander l’étiquette de n’importe quel point, y compris de points <b>synthétiques</b> qu’il fabrique. Problème : un chiffre manuscrit synthétique peut être illisible, donc impossible à étiqueter pour un humain.</li>
<li><b>Stream-based (séquentiel)</b> : les points arrivent un par un, et pour chacun on décide de demander l’étiquette ou non. Pas besoin de tout stocker (utile en embarqué).</li>
<li><b>Pool-based</b> : un grand réservoir de points non étiquetés est disponible dès le départ ; on choisit lesquels faire étiqueter. Demande souvent de garder toute la base en mémoire. <b>C’est le scénario étudié dans le cours.</b></li></ol>
<div class="def"><b>Principe général (pool-based)</b> : $D=D_l\cup D_u$ (étiquetés / non étiquetés). À chaque étape : choisir $x^*\in D_u$, demander $y^*$ à l’oracle, ajouter $(x^*,y^*)$ à $D_l$, réentraîner. L’informativité est mesurée avec le classifieur courant $\hat h_k$.</div>
<p><b>Démarrage à froid</b> : au début, impossible de savoir ce qui est informatif. On commence toujours par un peu d’apprentissage <b>passif</b>.</p>`,
      },
      {
        id: 'al-1d', title: 'Le gain théorique : rayons et intervalles', slides: '24-31',
        summary: 'Seuil sur R (réalisable) : passif O(1/ε) étiquettes, actif O(log 1/ε) par dichotomie, gain exponentiel. Mais pour les intervalles, l’actif ne gagne pas toujours.',
        fiche: R`
<p>Cadre : $(X,Y)\sim P_{XY}$ inconnue, on cherche $h\in\mathcal H$ minimisant $R(h)=\mathbb E[\ell(Y,h(X))]$ ; en binaire avec perte 0/1, $R(h)=\mathbb P(Y\neq h(X))$. Cas <b>réalisable</b> (sans bruit) : $R(h^*)=0$ ; <b>agnostique</b> : en général non. La théorie de l’actif a d’abord été développée dans le cas réalisable.</p>
<div class="def"><b>Rayons positifs</b> $h_w(x)=\mathrm{sgn}(x-w)$, données séparables.
<ul><li><b>Passif</b> (pire cas, points régulièrement espacés) : $|\hat w_n-w^*|\sim O(1/n)$, beaucoup de points inutiles.</li>
<li><b>Actif</b> (recherche dichotomique) : $|\hat w_n-w^*|\sim O(2^{-n})$, chaque étiquette apporte <b>1 bit</b> de l’écriture binaire de $w^*$.</li></ul>
Pour une erreur $\epsilon$ : passif $O(1/\epsilon)$ étiquettes, actif $O(\log(1/\epsilon))$ : <b>gain exponentiel</b>.</div>
<p><b>Intervalles positifs</b> $h_{a,b}(x)=\mathrm{sgn}(x-a)-\mathrm{sgn}(x-b)$ : même dans ce cas simple, si l’intervalle est minuscule, aucune étiquette ne donne d’indice sur sa position avant de tomber dedans : il faut parfois demander <b>toutes</b> les étiquettes. <b>L’apprentissage actif n’aide pas toujours.</b></p>`,
      },
      {
        id: 'al-uncert', title: 'Échantillonnage par incertitude', slides: '34-45',
        summary: 'Moins confiant (1 − P(ŷ|x)), plus petite marge (P(ŷ1|x) − P(ŷ2|x)), entropie maximale. En binaire, les trois coïncident.',
        fiche: R`
<p>Un seul classifieur $\theta$ donne les probabilités a posteriori $P_\theta(y\mid x)$.</p>
<div class="def"><b>Moins confiant</b> (Lewis et Gale 94) : $\hat y=\arg\max_y P_\theta(y|x)$, puis $x^*_{LC}=\arg\max_x\,[1-P_\theta(\hat y\mid x)]$.</div>
<p>Défaut : ne regarde que la classe la plus probable. Avec 5 classes, $(0, 0, 0{,}45, 0{,}5, 0{,}05)$ et $(0{,}11, 0{,}12, 0{,}14, 0{,}5, 0{,}13)$ sont traités pareil, alors que dans le premier cas C3 et C4 sont presque indiscernables (point informatif) et dans le second C4 domine nettement.</p>
<div class="def"><b>Marge</b> (Scheffer 01) : $x^*_M=\arg\min_x\,[P_\theta(\hat y_1|x)-P_\theta(\hat y_2|x)]$ avec $\hat y_1,\hat y_2$ les deux classes les plus probables. Mieux, mais seulement deux classes.</div>
<div class="def"><b>Entropie</b> (Settles et Craven 08) : $x^*_E=\arg\max_x\Big[-\sum_{i=1}^{N_c}P_\theta(y_i|x)\log P_\theta(y_i|x)\Big]$ : toutes les classes comptent.</div>
<p><b>Lien avec la théorie de l’information</b> (Shannon 1948) : l’information d’une étiquette est $I(Y)=-\log P(Y)$ ; la réponse de l’oracle étant inconnue, on prend son espérance : c’est l’entropie (aussi utilisée pour construire les arbres de décision).</p>
<p>En <b>binaire</b>, les trois critères choisissent le même point : celui où $P_\theta(1|x)$ est le plus proche de 1/2.</p>`,
      },
      {
        id: 'al-incons', title: 'Myopie et inconsistance statistique', slides: '46-50',
        summary: 'Un algorithme consistant converge vers h* avec une infinité de données. L’échantillonnage par incertitude ne l’est pas en général : il reste collé à sa première frontière.',
        fiche: R`
<div class="def"><b>Consistance statistique</b> : avec un ensemble d’entraînement infini, l’algorithme converge vers la meilleure hypothèse $h^*$.</div>
<p>Les méthodes par incertitude <b>ne sont pas consistantes</b> en général dans le cas agnostique : c’est la « myopie » ou le <b>biais d’échantillonnage</b>.</p>
<p><b>Exemple 1D</b> : après le démarrage à froid, l’estimation initiale est $w$ ; on échantillonne autour de $w$ et on ne découvre jamais la zone où se trouve $w^*$ : on reste à $R(w)=5\,\%$ alors que $R(w^*)=2{,}5\,\%$.</p>
<p><b>Exemple 2D</b> (Cohn 94) : classe 1 à l’intérieur de deux triangles ; si le démarrage n’a rien vu près du triangle de droite, on risque de le manquer pour toujours.</p>
<p><b>Explication</b> : on échantillonne autour de la frontière estimée au début ; le classifieur devient trop sûr de lui sur des régions qu’il n’a jamais vues. <b>Changement de paradigme</b> : modéliser l’incertitude sur le classifieur lui-même, avec plusieurs classifieurs (un comité).</p>`,
      },
      {
        id: 'al-qbc', title: 'Comités : version space et Query-By-Committee', slides: '51-64',
        summary: 'Version space V(Z) = hypothèses compatibles avec les données ; région de désaccord ; CAL en flux ; entropie de vote et KL en pool ; pondération par densité contre les points isolés.',
        fiche: R`
<div class="def"><b>Version space</b> : $\mathcal V(Z)=\{h\in\mathcal H: h(x)=y\ \forall (x,y)\in Z\}$, les hypothèses compatibles avec les données. Nouveau but : choisir les points qui <b>réduisent</b> $\mathcal V(Z)$.<br>
<b>Région de désaccord</b> : $\mathcal R(\mathcal H)=\{x: \exists h,h'\in\mathcal H,\ h(x)\neq h'(x)\}$.</div>
<p><b>QBC en flux</b> : chaque membre du comité prédit l’étiquette de $x_t$ ; s’ils sont en désaccord, on demande l’étiquette.</p>
<div class="thm"><b>Algorithme CAL</b> (Cohn, Atlas, Ladner 94). $H_1\leftarrow\mathcal H$. Pour chaque $x_t$ : si $\exists h,h'\in H_t$ avec $h(x_t)\neq h'(x_t)$, demander $y_t$ et poser $H_{t+1}=\{h\in H_t: h(x_t)=y_t\}$ ; sinon $H_{t+1}=H_t$ (l’étiquette est déjà connue).</div>
<p>CAL est simple mais coûteux (mémoriser $H_t$, parfois énorme). Idéal : couper $\mathcal V$ en deux. En pratique, description implicite : entraîner avec $(x_t,0)$ puis avec $(x_t,1)$ ; si les deux sont possibles, $x_t$ est dans la région de désaccord.</p>
<p><b>QBC en pool</b> : on choisit le point de plus grand désaccord.</p>
$$x^*_{VE}=\arg\max_x\Big[-\sum_i\frac{V(y_i)}C\log\frac{V(y_i)}C\Big]\qquad x^*_{KL}=\arg\max_x\frac1C\sum_{c=1}^C D\big(P_{\theta^{(c)}}\,\|\,P_{\mathcal C}\big)$$
<p>$V(y_i)$ = nombre de votes pour $y_i$ ; $P_{\mathcal C}=\frac1C\sum_c P_{\theta^{(c)}}$ = consensus ; $D$ = divergence de Kullback-Leibler.</p>
<p><b>Limite commune</b> : les points isolés ou bruités paraissent informatifs. On pondère par l’<b>influence</b> sur les voisins (méthodes pondérées par la densité, réduction d’erreur) : $x^*_{ID}=\arg\max_x|LIG(x)|\times|LIF(x)|^\beta$. Lien avec le semi-supervisé : exploiter la structure des données non étiquetées.</p>`,
      },
      {
        id: 'al-theory', title: 'Complexité en étiquettes et bruit', slides: '66-76',
        summary: 'Réalisable : passif d/ε, actif θ d log(1/ε). Coefficient de désaccord θ. Le bruit attire les méthodes par incertitude.',
        fiche: R`
<p>Questions : l’actif bat-il le passif ? de combien (vitesse, complexité d’échantillon) ? dans quelles conditions ? est-il consistant, optimal, calculable ?</p>
<table><tr><th>Cas</th><th>Passif</th><th>Actif (CAL)</th></tr>
<tr><td>Séparable</td><td>$n\sim d_{VC}/\epsilon$</td><td>$n\sim\theta\,d_{VC}\log(1/\epsilon)$</td></tr>
<tr><td>Agnostique (meilleur taux $\nu$)</td><td>$n\sim d_{VC}/\epsilon^2$</td><td>$n\sim\theta\big(d_{VC}\log^2\frac1\epsilon+d_{VC}\frac{\nu^2}{\epsilon^2}\big)$</td></tr></table>
<p>La dimension VC ne suffit plus : on introduit le splitting index (Dasgupta 2005) et le <b>coefficient de désaccord</b> (Hanneke 2007).</p>
<div class="def">Distance de désaccord : $d(h,h')=\mathbb P[h(X)\neq h'(X)]$ ; boule $B(h,r)=\{h': d(h,h')\le r\}$.<br>
<b>Coefficient de désaccord</b> : $\theta=\sup_{r>0}\dfrac{\mathbb P[\mathcal R(B(h,r))]}{r}$ : vitesse à laquelle la région de désaccord grandit avec $r$.</div>
<p>Exemples : seuils sur $\mathbb R$, $\theta=2$ (complexité $2d_{VC}\log\frac1\epsilon$) ; linéaires dans $\mathbb R^d$, $\theta\le\sqrt d$.</p>
<p><b>Bruit</b> : les méthodes par incertitude ont tendance à « chercher le bruit » ; inutile de demander les étiquettes des régions bruitées. Bruit borné : $|\mathbb P[Y=1|X=x]-\frac12|>b>0$ pour tout $x$.</p>`,
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
      ],
      'al-1d': [
        () => {
          const k = rnd(5, 20);
          return { q: R`Seuil sur $[0,1]$, cas réalisable. Combien d’étiquettes faut-il en actif (dichotomie) pour localiser $w^*$ à $2^{-${k}}$ près ? Et combien de points régulièrement espacés en passif ? Donne le nombre passif.`, a: 2 ** k, tol: 2,
            expl: R`Actif : ${k} étiquettes. Passif : environ $1/\epsilon=2^{${k}}=${2 ** k}$ points. Gain exponentiel.` };
        },
      ],
    },
  });
})();
