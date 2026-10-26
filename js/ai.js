// Appels IA : Gemini (gratuit via Google AI Studio), Claude (Anthropic) ou API compatible OpenAI (OpenAI, Groq, OpenRouter, Mistral…).
// Le cœur (appels, modèles de secours, réglage de réflexion) est celui d'AppLangues ; la fin du fichier est propre au tuteur de cours.
(function (global) {
  const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta';
  // Modèles essayés si le modèle choisi est épuisé (429) ou introuvable (404)
  const GEMINI_FALLBACKS = ['gemini-flash-latest', 'gemini-flash-lite-latest', 'gemini-3.5-flash-lite'];

  // Profil de l'étudiant, utilisé par toutes les consignes
  const PROFILE = `Profil de l'étudiant : étudiant ingénieur belge (UMONS) spécialisé en intelligence artificielle et aide à la décision. Il suit le cours « Advanced Machine Learning » de Xavier Siebert (théorie statistique de l'apprentissage, apprentissage actif, bandits, apprentissage par renforcement, séries temporelles). Il a fait un stage de recherche sur un RAG souverain appliqué à la banque, vise une carrière en banque ou en finance, et prépare un TFE sur le secteur bancaire. Il devra réaliser un projet sur le chapitre qui l'intéresse le plus : il veut une compréhension profonde, pas du par cœur.`;

  // Formules en LaTeX entre $...$ (rendu KaTeX dans l'app), pas de tirets longs
  const TYPO = '\n\nTypographie : réponds en français. Écris toute formule en LaTeX entre $...$ (ou $$...$$ pour une formule isolée). N’utilise jamais de tiret long ni de tiret moyen comme ponctuation : utilise virgules, deux-points ou parenthèses. Pas de titres markdown (#) ; tu peux utiliser **gras** et des listes à puces.';

  function hasKey() {
    const s = Store.settings;
    return s.provider === 'gemini' ? !!s.geminiKey : s.provider === 'anthropic' ? !!s.anKey : !!(s.oaKey && s.oaBase);
  }

  // Reconnaît le fournisseur d'après la forme de la clé collée dans les réglages
  function detectKey(k) {
    k = (k || '').trim();
    if (/^sk-ant-/.test(k)) return { provider: 'anthropic', label: 'Claude (Anthropic)' };
    if (/^(AIza|AQ\.)/.test(k)) return { provider: 'gemini', label: 'Google Gemini' };
    if (/^gsk_/.test(k)) return { provider: 'openai', base: 'https://api.groq.com/openai/v1', model: 'llama-3.3-70b-versatile', label: 'Groq' };
    if (/^sk-or-/.test(k)) return { provider: 'openai', base: 'https://openrouter.ai/api/v1', model: 'openrouter/auto', label: 'OpenRouter' };
    if (/^sk-/.test(k)) return { provider: 'openai', base: 'https://api.openai.com/v1', model: 'gpt-4o-mini', label: 'OpenAI' };
    if (/^[A-Za-z0-9]{32}$/.test(k)) return { provider: 'openai', base: 'https://api.mistral.ai/v1', model: 'mistral-small-latest', label: 'Mistral' };
    return null;
  }
  function providerLabel() {
    const s = Store.settings;
    if (s.provider === 'gemini') return 'Google Gemini';
    if (s.provider === 'anthropic') return 'Claude (Anthropic)';
    const d = detectKey(s.oaKey);
    return d ? d.label : 'API compatible OpenAI';
  }

  function countRequest() { Store.day().requests++; Store.save(); }

  class AIError extends Error { constructor(msg, status) { super(msg); this.status = status; } }

  async function gemini(model, body) {
    let res;
    try {
      res = await fetch(`${GEMINI_URL}/models/${encodeURIComponent(model)}:generateContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': Store.settings.geminiKey },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(40000),
      });
    } catch (e) {
      // Pas de réponse (serveur surchargé, réseau) : on passe au modèle suivant au lieu d'attendre sans fin
      throw new AIError(e.name === 'TimeoutError' ? `${model} ne répond pas (délai dépassé)` : `Réseau : ${e.message}`, 503);
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new AIError(`${(data.error && data.error.message) || res.statusText} (${model}, ${res.status})`, res.status);
    const parts = data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts;
    if (!parts) throw new AIError('Réponse vide (contenu bloqué ?)', 500);
    return parts.filter(p => !p.thought).map(p => p.text || '').join('');
  }

  // Réglages de réflexion essayés dans l'ordre : Gemini 3 veut « thinkingLevel », Gemini 2.5 « thinkingBudget ».
  // Sans réflexion minimale, le modèle réfléchit longuement et répond en 10 à 30 s.
  const THINK = [{ thinkingLevel: 'minimal' }, { thinkingLevel: 'low' }, { thinkingBudget: 0 }, null];
  const THINK_KEY = 'applangues-think';
  let thinkMemo = {};
  try { thinkMemo = JSON.parse(localStorage.getItem(THINK_KEY)) || {}; } catch (e) { }
  const deadModels = new Set(); // modèles retirés par Google (404) : on ne les réessaie plus dans la session

  async function geminiModel(model, base) {
    let start = Math.max(0, THINK.findIndex(t => JSON.stringify(t) === JSON.stringify(thinkMemo[model] === undefined ? THINK[0] : thinkMemo[model])));
    for (let k = start; k < THINK.length; k++) {
      const body = structuredClone(base);
      if (THINK[k]) body.generationConfig.thinkingConfig = THINK[k];
      countRequest();
      try {
        const out = await gemini(model, body);
        if (JSON.stringify(thinkMemo[model]) !== JSON.stringify(THINK[k])) { thinkMemo[model] = THINK[k]; try { localStorage.setItem(THINK_KEY, JSON.stringify(thinkMemo)); } catch (e) { } }
        return out;
      } catch (e) {
        // Réglage de réflexion refusé (souvent un simple « invalid argument ») : réglage suivant
        if (e.status === 400 && !/API key/i.test(e.message) && k < THINK.length - 1) continue;
        throw e;
      }
    }
  }

  async function callGemini(system, messages, schema) {
    const contents = messages.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }));
    const gen = { temperature: 0.8 };
    if (schema) { gen.responseMimeType = 'application/json'; gen.responseSchema = schema; }
    const body = { systemInstruction: { parts: [{ text: system }] }, contents, generationConfig: gen };

    const chosen = Store.settings.geminiModel || GEMINI_FALLBACKS[0];
    const models = [chosen, ...GEMINI_FALLBACKS.filter(m => m !== chosen)].filter(m => !deadModels.has(m));
    const errors = [];
    for (const model of models) {
      try { return await geminiModel(model, body); }
      catch (e) {
        errors.push(e);
        if (e.status === 404) deadModels.add(model);
        if (e.status === 429 || e.status === 404 || e.status === 503) { console.warn(`Modèle ${model} indisponible (${e.status}), essai suivant`); continue; }
        throw e;
      }
    }
    // Message le plus utile : quota épuisé ou surcharge plutôt qu'un vieux modèle introuvable
    const main = errors.find(e => e.status === 429) || errors.find(e => e.status === 503) || errors[0];
    if (main && main.status === 429) throw new AIError('Quota gratuit atteint pour le moment sur tous les modèles. Réessaie dans une minute (ou demain si la limite du jour est atteinte).', 429);
    throw main || new AIError('Aucun modèle disponible', 503);
  }

  async function callOpenAI(system, messages, schema) {
    const s = Store.settings;
    countRequest();
    const sys = schema ? system + '\n\nRespond ONLY with a JSON object with this structure: ' + JSON.stringify(schemaToExample(schema)) : system;
    const res = await fetch(s.oaBase.replace(/\/$/, '') + '/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + s.oaKey },
      body: JSON.stringify({
        model: s.oaModel, temperature: 0.8,
        messages: [{ role: 'system', content: sys }, ...messages],
        ...(schema ? { response_format: { type: 'json_object' } } : {}),
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new AIError((data.error && (data.error.message || data.error)) || res.statusText, res.status);
    return data.choices[0].message.content;
  }

  // Claude, appelé directement depuis le navigateur (en-tête d'accès direct requis par Anthropic)
  const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
  const ANTHROPIC_FALLBACKS = ['claude-sonnet-5-5', 'claude-haiku-5-5', 'claude-sonnet-4-5'];
  async function callAnthropic(system, messages, schema) {
    const s = Store.settings;
    const sys = schema ? system + '\n\nRéponds UNIQUEMENT par un objet JSON de cette forme, sans texte autour : ' + JSON.stringify(schemaToExample(schema)) : system;
    // L'API veut une conversation qui commence par l'étudiant et alterne les rôles
    const msgs = [];
    for (const m of messages) {
      const role = m.role === 'assistant' ? 'assistant' : 'user';
      if (msgs.length && msgs[msgs.length - 1].role === role) msgs[msgs.length - 1].content += '\n\n' + m.content;
      else msgs.push({ role, content: m.content });
    }
    if (!msgs.length || msgs[0].role !== 'user') msgs.unshift({ role: 'user', content: 'Bonjour.' });
    const chosen = s.anModel || ANTHROPIC_FALLBACKS[0];
    const models = [chosen, ...ANTHROPIC_FALLBACKS.filter(m => m !== chosen)].filter(m => !deadModels.has(m));
    let last = null;
    for (const model of models) {
      countRequest();
      let res;
      try {
        res = await fetch(ANTHROPIC_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': s.anKey, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
          body: JSON.stringify({ model, max_tokens: 2048, system: sys, messages: msgs }),
          signal: AbortSignal.timeout(60000),
        });
      } catch (e) { last = new AIError(e.name === 'TimeoutError' ? `${model} ne répond pas (délai dépassé)` : `Réseau : ${e.message}`, 503); continue; }
      const data = await res.json().catch(() => ({}));
      if (res.ok) return (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
      last = new AIError(`${(data.error && data.error.message) || res.statusText} (${model}, ${res.status})`, res.status);
      if (res.status === 404) { deadModels.add(model); continue; }
      if (res.status === 429 || res.status === 529 || res.status === 503) continue;
      throw last;
    }
    throw last || new AIError('Aucun modèle Claude disponible', 503);
  }

  function schemaToExample(s) {
    if (s.type === 'OBJECT') return Object.fromEntries(Object.entries(s.properties).map(([k, v]) => [k, schemaToExample(v)]));
    if (s.type === 'ARRAY') return [schemaToExample(s.items)];
    if (s.type === 'BOOLEAN') return true;
    return s.enum ? s.enum.join('|') : (s.description || 'string');
  }

  // Retire les tirets longs si le modèle en produit quand même
  function clean(x) {
    if (typeof x === 'string') return x.replace(/\s*[—–]\s*/g, ', ').replace(/,\s*,/g, ',').replace(/^,\s*/gm, '');
    if (Array.isArray(x)) return x.map(clean);
    if (x && typeof x === 'object') return Object.fromEntries(Object.entries(x).map(([k, v]) => [k, clean(v)]));
    return x;
  }

  async function chat(system, messages, schema) {
    if (!hasKey()) throw new AIError('Aucune clé API : va dans Réglages.', 401);
    const p = Store.settings.provider, fn = p === 'gemini' ? callGemini : p === 'anthropic' ? callAnthropic : callOpenAI;
    const text = await fn(system + TYPO, messages, schema);
    return clean(schema ? parseJSON(text) : text);
  }

  function parseJSON(text) {
    try { return JSON.parse(text); } catch (e) { }
    const m = text.match(/\{[\s\S]*\}/);
    if (m) { try { return JSON.parse(m[0]); } catch (e) { } }
    throw new AIError('Réponse IA illisible : ' + text.slice(0, 200), 500);
  }

  async function listGeminiModels() {
    const res = await fetch(`${GEMINI_URL}/models?pageSize=200`, { headers: { 'x-goog-api-key': Store.settings.geminiKey } });
    const data = await res.json();
    if (!res.ok) throw new AIError((data.error && data.error.message) || res.statusText, res.status);
    return (data.models || [])
      .filter(m => (m.supportedGenerationMethods || []).includes('generateContent') && /gemini/.test(m.name) && !/image|tts|embedding|audio|live/i.test(m.name))
      .map(m => ({ id: m.name.replace('models/', ''), label: m.displayName }));
  }


  // ---------- Tuteur de cours ----------
  const LEVEL = {
    Intuition: 'Privilégie l’intuition, les images mentales et les exemples concrets ; formules seulement quand elles éclairent.',
    Examen: 'Niveau examen écrit et oral de master : définitions exactes, énoncés précis, étapes de preuve, hypothèses explicites.',
    Recherche: 'Niveau recherche : rigueur maximale, liens avec la littérature (Shalev-Shwartz et Ben-David, Sutton et Barto, Lattimore et Szepesvári, Box et Jenkins), limites des résultats et questions ouvertes.',
  };
  const levelRule = () => LEVEL[Store.settings.level] || LEVEL.Examen;

  // Conversation libre avec le tuteur, ancrée dans les fiches du cours
  async function tutor(context, history, mode) {
    const modes = {
      explain: 'Explique la notion demandée de façon progressive : d’abord l’idée en une phrase, puis l’intuition, puis la version formelle, puis un exemple chiffré.',
      socratic: 'Mode socratique : ne donne PAS la réponse tout de suite. Pose une question à la fois pour que l’étudiant construise lui-même le raisonnement ; corrige-le avec bienveillance ; conclus par une synthèse quand il y est arrivé.',
      examiner: 'Tu es l’examinateur d’un oral. Pose une question d’examen sur la notion (définition, énoncé, preuve ou application), attends sa réponse, évalue-la honnêtement (ce qui est juste, ce qui manque, ce qui est faux), puis pose la question suivante, un cran plus difficile.',
      link: 'Aide l’étudiant à relier cette notion au reste du cours et à des applications réelles (banque, finance, RAG, données industrielles). Montre les dépendances : ce qu’il faut savoir avant, ce que cette notion permet ensuite.',
    };
    const sys = `Tu es le tuteur personnel d’un étudiant pour le cours Advanced Machine Learning.
${PROFILE}
${levelRule()}
${modes[mode] || modes.explain}
Appuie-toi d’abord sur le contenu du cours ci-dessous (ce sont les fiches de l’étudiant, avec ses propres notes) ; signale clairement quand tu vas au-delà du cours. Si une note de l’étudiant contient une erreur, corrige-la. N’invente jamais de résultat : si tu n’es pas sûr d’une constante ou d’une référence, dis-le.
Définis chaque notation la première fois que tu l’utilises (ce que désigne le symbole, en mots), et ne suppose jamais connu un symbole que l’étudiant n’a pas vu.
Réponses courtes et denses (150 mots au plus sauf demande explicite), une idée par paragraphe.

CONTENU DU COURS :
${context}`;
    return chat(sys, history);
  }

  // Évaluation d'une explication (méthode Feynman) ou d'une réponse d'oral
  const EVAL_SCHEMA = {
    type: 'OBJECT', properties: {
      score: { type: 'INTEGER', description: 'note de 0 à 100 sur la justesse et la complétude' },
      verdict: { type: 'STRING', description: 'une phrase de synthèse en français' },
      good: { type: 'ARRAY', items: { type: 'STRING' }, description: 'points justes et bien expliqués' },
      missing: { type: 'ARRAY', items: { type: 'STRING' }, description: 'éléments importants absents' },
      errors: { type: 'ARRAY', items: { type: 'STRING' }, description: 'erreurs ou imprécisions, chacune avec la correction' },
      model: { type: 'STRING', description: 'une réponse modèle concise (LaTeX entre $...$)' },
      next: { type: 'STRING', description: 'une question de suivi pour approfondir' },
    }, required: ['score', 'verdict', 'good', 'missing', 'errors', 'model', 'next'],
  };
  async function evaluate(context, question, answer) {
    const sys = `Tu évalues la réponse d’un étudiant à une question du cours Advanced Machine Learning.
${PROFILE}
${levelRule()}
Sois exigeant mais juste : une réponse orale transcrite peut être maladroite (reconnaissance vocale, pas de symboles) ; juge le fond. Une réponse vide ou hors sujet vaut 0. Chaque erreur doit être accompagnée de sa correction.

RÉFÉRENCE (fiche du cours) :
${context}`;
    return chat(sys, [{ role: 'user', content: `QUESTION : ${question}\n\nRÉPONSE DE L’ÉTUDIANT : ${answer || '(aucune réponse)'}` }], EVAL_SCHEMA);
  }

  // Nouvelles questions d'entraînement, générées à partir d'une fiche
  const QCM_SCHEMA = {
    type: 'OBJECT', properties: {
      items: {
        type: 'ARRAY', items: {
          type: 'OBJECT', properties: {
            q: { type: 'STRING', description: 'énoncé (LaTeX entre $...$)' },
            opts: { type: 'ARRAY', items: { type: 'STRING' }, description: '4 propositions, la bonne en PREMIER' },
            expl: { type: 'STRING', description: 'explication de la bonne réponse et du piège principal' },
          }, required: ['q', 'opts', 'expl'],
        },
      },
    }, required: ['items'],
  };
  async function makeQuiz(context, n = 4) {
    const sys = `Tu rédiges des QCM de compréhension (pas de simple restitution) pour le cours Advanced Machine Learning.
${levelRule()}
Chaque notation utilisée doit figurer dans le contenu fourni ou être définie dans l’énoncé. Chaque question teste un raisonnement : application chiffrée, cas limite, interprétation, piège classique. 4 propositions plausibles, la bonne en premier (elles seront mélangées). Uniquement à partir du contenu fourni.

CONTENU :
${context}`;
    return chat(sys, [{ role: 'user', content: `Rédige ${n} questions.` }], QCM_SCHEMA);
  }

  // Idées de projet pour un chapitre
  async function projectIdeas(context, interests) {
    const sys = `Tu aides un étudiant à choisir et cadrer son projet de cours (Advanced Machine Learning).
${PROFILE}
Propose 3 idées de projet réalistes en quelques semaines, sur le chapitre fourni, en lien avec ses intérêts. Pour chacune : **titre**, la question étudiée, les données (jeu de données public précis ou simulation), la méthode et ce qu’on compare, le résultat attendu à montrer, la difficulté (1 à 3), et le lien avec la théorie du cours. Termine par la notion du cours qu’il doit maîtriser en premier.

CHAPITRE :
${context}`;
    return chat(sys, [{ role: 'user', content: `Mes intérêts : ${interests || 'banque, finance, IA appliquée'}.` }]);
  }

  // ---------- Correction intelligente et compléments ----------
  // Réponse écrite à une carte, comparée à la réponse de référence
  const RECALL_SCHEMA = {
    type: 'OBJECT', properties: {
      verdict: { type: 'STRING', enum: ['juste', 'partiel', 'faux'], description: 'juste|partiel|faux' },
      summary: { type: 'STRING', description: 'une phrase de bilan, en tutoyant l’étudiant' },
      ok: { type: 'ARRAY', items: { type: 'STRING' }, description: 'ce qui est juste dans sa réponse' },
      missing: { type: 'ARRAY', items: { type: 'STRING' }, description: 'éléments de la référence absents de sa réponse' },
      errors: { type: 'ARRAY', items: { type: 'STRING' }, description: 'erreurs ou confusions, chacune suivie de sa correction' },
      tip: { type: 'STRING', description: 'un moyen concret de retenir ou de ne plus confondre' },
    }, required: ['verdict', 'summary', 'ok', 'missing', 'errors', 'tip'],
  };
  async function gradeRecall(context, question, reference, answer) {
    const sys = `Tu corriges la réponse écrite d’un étudiant à une carte de révision du cours Advanced Machine Learning.
${PROFILE}
${levelRule()}
Compare sa réponse à la RÉFÉRENCE : juge le fond, pas la forme (fautes de frappe, formules écrites en texte, ordre différent, synonymes sont acceptés). « juste » : l’essentiel de la référence y est, sans erreur. « partiel » : idée juste mais incomplète ou imprécise. « faux » : erreur de fond, confusion ou hors sujet. Listes courtes (3 éléments au plus chacune, vides si rien à dire). Tutoie l’étudiant.

FICHE DU COURS :
${context}`;
    return chat(sys, [{ role: 'user', content: `QUESTION : ${question}\n\nRÉFÉRENCE : ${reference}\n\nRÉPONSE DE L’ÉTUDIANT : ${answer}` }], RECALL_SCHEMA);
  }

  // Exercice raté : pourquoi sa réponse est fausse, et d'où vient probablement l'erreur
  async function explainMistake(context, question, given, correct, expl) {
    const sys = `Tu es le tuteur d’un étudiant du cours Advanced Machine Learning. Il vient de rater un exercice.
${PROFILE}
${levelRule()}
En 150 mots au plus, tutoie-le et :
1. dis précisément pourquoi SA réponse est fausse (pour un calcul, devine l’erreur la plus probable qui mène à sa valeur : facteur oublié, mauvais logarithme, borne inversée, confusion de notions… et dis-le si tu n’en es pas sûr) ;
2. montre le raisonnement correct pas à pas ;
3. termine par une règle courte pour ne plus se tromper, en **gras**.
Appuie-toi sur la fiche ci-dessous.

FICHE DU COURS :
${context}`;
    return chat(sys, [{ role: 'user', content: `EXERCICE : ${question}\n\nMA RÉPONSE : ${given}\n\nBONNE RÉPONSE : ${correct}${expl ? `\n\nEXPLICATION DONNÉE PAR L’APP : ${expl}` : ''}` }]);
  }

  // « Plus de détails » sur une question : explication progressive, plus fouillée que la réponse courte
  async function deepen(context, question, answer) {
    const sys = `Tu complètes une question du cours Advanced Machine Learning pour un étudiant qui veut la comprendre en profondeur.
${PROFILE}
${levelRule()}
La réponse courte est déjà connue de lui : ne la répète pas telle quelle, enrichis-la. Structure (250 mots au plus), avec ces amorces en **gras** :
**L’idée** (une phrase), **Pourquoi c’est vrai** (l’intuition puis l’argument formel, notations définies au passage), **Exemple** (chiffré si possible), **Piège classique**, **Lien** (avec une autre notion du cours, ou une application en banque ou finance).
Reste fidèle à la fiche ; signale ce qui va au-delà du cours.

FICHE DU COURS :
${context}`;
    return chat(sys, [{ role: 'user', content: `QUESTION : ${question}\n\nRÉPONSE COURTE : ${answer}` }]);
  }

  // Note d'une question de TP : le résultat noté est-il cohérent ? (sans donner la solution d'un TP évalué)
  async function checkStep(context, step, hint, note, graded) {
    const sys = `Tu aides un étudiant à préparer une séance de TP du cours Advanced Machine Learning.
${PROFILE}
Il a noté sa démarche ou son résultat pour une question de l’énoncé. Dis s’il est cohérent avec ce qu’on attend (ordre de grandeur, signe, comportement quand n grandit, conditions de la théorie), ce qui est bien, ce qu’il doit revérifier et comment le vérifier lui-même. 120 mots au plus, tutoiement.
${graded ? 'IMPORTANT : ce TP est ÉVALUÉ. Ne donne ni la réponse, ni le code, ni la valeur attendue, ni l’analyse à rendre : seulement des questions de vérification et des pistes de méthode.' : 'Tu peux donner la valeur attendue si la fiche la contient.'}

FICHE ET CONSIGNES :
${context}`;
    return chat(sys, [{ role: 'user', content: `QUESTION DU TP : ${step}\nCONSIGNE : ${hint}\n\nMA NOTE : ${note}` }]);
  }

  global.AI = { hasKey, detectKey, providerLabel, chat, tutor, evaluate, makeQuiz, projectIdeas, listGeminiModels, gradeRecall, explainMistake, deepen, checkStep, AIError };
})(window);
