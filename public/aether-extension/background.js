/* ============================================================
   Aether - Background Service Worker (AI Orchestrator)
   v2.0 - Full Feature Upgrade
   ============================================================ */

// ── Provider Configurations ──────────────────────────────────
const PROVIDERS = {
  openai: {
    name: 'OpenAI (ChatGPT)',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo'],
    defaultModel: 'gpt-4o-mini',
    keyUrl: 'https://platform.openai.com/api-keys',
    strengths: ['general', 'code', 'creative', 'analysis'],
  },
  anthropic: {
    name: 'Anthropic (Claude)',
    endpoint: 'https://api.anthropic.com/v1/messages',
    models: ['claude-sonnet-4-20250514', 'claude-3-5-haiku-20241022'],
    defaultModel: 'claude-sonnet-4-20250514',
    keyUrl: 'https://console.anthropic.com/settings/keys',
    strengths: ['writing', 'analysis', 'safety', 'long-form'],
  },
  groq: {
    name: 'Groq',
    endpoint: 'https://api.groq.com/openai/v1/chat/completions',
    models: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'gemma2-9b-it'],
    defaultModel: 'llama-3.3-70b-versatile',
    keyUrl: 'https://console.groq.com/keys',
    strengths: ['speed', 'general', 'code'],
  },
  google: {
    name: 'Google (Gemini)',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/',
    models: ['gemini-1.5-flash', 'gemini-1.5-pro'],
    defaultModel: 'gemini-1.5-flash',
    keyUrl: 'https://aistudio.google.com/app/apikey',
    strengths: ['research', 'factual', 'multimodal'],
  },
};

// ── Persona Definitions ──────────────────────────────────────
const PERSONAS = {
  professional: {
    name: 'Professional',
    icon: 'briefcase',
    prompt: 'You are a professional expert. Respond in a clear, authoritative, and polished manner. Use industry-standard terminology and maintain a formal tone.',
  },
  creative: {
    name: 'Creative Maverick',
    icon: 'palette',
    prompt: 'You are a creative thinker and innovator. Respond with originality, vivid language, and unique perspectives. Offer unexpected angles and memorable phrasing while staying relevant.',
  },
  concise: {
    name: 'Concise',
    icon: 'zap',
    prompt: 'You are extremely concise. Give the shortest possible answer that fully addresses the question. No fluff, no filler. Every word must earn its place.',
  },
  technical: {
    name: 'Technical Expert',
    icon: 'code',
    prompt: 'You are a technical expert. Respond with precision, use specific terminology, include data points or references where relevant. Be thorough but structured.',
  },
  friendly: {
    name: 'Friendly Helper',
    icon: 'heart',
    prompt: 'You are warm and approachable. Respond in a conversational, supportive tone. Make complex topics accessible and relatable.',
  },
  leader: {
    name: 'The Leader',
    icon: 'star',
    prompt: 'You are a confident, visionary leader. Speak with authority and conviction. Frame responses in terms of strategy, vision, impact, and results. Use commanding yet inspiring language.',
  },
  analyst: {
    name: 'The Analyst',
    icon: 'bar-chart',
    prompt: 'You are a meticulous analyst. Break everything down into data, evidence, and logical reasoning. Present findings systematically. Use numbers, comparisons, and structured frameworks.',
  },
  empath: {
    name: 'The Empath',
    icon: 'users',
    prompt: 'You are deeply empathetic and emotionally intelligent. Focus on the human element, relationships, and emotional nuance. Show understanding, active listening cues, and emotional awareness.',
  },
};

// ── Tone Definitions ─────────────────────────────────────────
const TONES = {
  casual: 'Use a relaxed, conversational tone. Write like you\'re talking to a friend.',
  friendly: 'Use a warm, approachable tone. Be helpful and encouraging.',
  professional: 'Use a polished, business-appropriate tone. Be clear and authoritative.',
  formal: 'Use a formal, dignified tone. Sophisticated vocabulary, proper structure.',
  academic: 'Use an academic, scholarly tone. Precise, cite reasoning, field-appropriate terminology.',
  enthusiastic: 'Use an energetic, enthusiastic tone. Show passion and excitement about the topic.',
  diplomatic: 'Use a careful, diplomatic tone. Consider multiple perspectives. Be balanced and tactful.',
};

// ── Length Guidelines ────────────────────────────────────────
const LENGTHS = {
  short: 'Keep your response very brief - 1-3 sentences maximum.',
  medium: 'Provide a moderately detailed response - a solid paragraph or two.',
  long: 'Give a comprehensive, detailed response with examples and thorough explanations.',
};

// ── Reading Levels ───────────────────────────────────────────
const READING_LEVELS = {
  simple: 'Write at a 6th grade reading level. Use short sentences, simple words, and clear explanations. Avoid jargon.',
  standard: 'Write at a standard professional reading level. Clear and accessible to most adults.',
  advanced: 'Write at an advanced level. Use sophisticated vocabulary, complex sentence structures, and domain-specific terminology.',
  executive: 'Write for C-suite executives. Be strategic, high-level, results-focused. Lead with insights, skip basic explanations.',
};

// ── Prompt Templates ─────────────────────────────────────────
const TEMPLATES = {
  general: 'Answer the following question or respond to the following text:\n\n{text}',
  'job-application': 'I am filling out a job application. The following is a question from the application form. Write a strong, relevant answer using the STAR method if appropriate.\n\nQuestion: {text}\n\n{profile}',
  'cover-letter': 'Write a compelling cover letter paragraph addressing the following:\n\n{text}\n\n{profile}',
  email: 'Draft a professional email response to the following:\n\n{text}',
  summarize: 'Summarize the following text concisely, capturing the key points:\n\n{text}',
  expand: 'Expand on the following text with more detail, examples, and depth:\n\n{text}',
  simplify: 'Rewrite the following text in simpler, easier-to-understand language:\n\n{text}',
  'fix-grammar': 'Fix the grammar and improve the writing quality of the following text. Return only the corrected text:\n\n{text}',
  explain: 'Explain the following concept or text clearly:\n\n{text}',
  'pros-cons': 'List the pros and cons of the following:\n\n{text}',
  'star-method': 'Rewrite this answer using the STAR method (Situation, Task, Action, Result). Make it specific, quantified, and compelling:\n\n{text}\n\n{profile}',
  'ats-optimize': 'Optimize this text for ATS (Applicant Tracking Systems). Include relevant keywords, use standard formatting, and ensure it passes automated screening:\n\n{text}\n\n{profile}',
  'counter-argument': 'Present a thoughtful counter-argument or alternative perspective to the following. Be respectful but thorough:\n\n{text}',
  translate: 'Translate the following text to {targetLang}. Maintain the tone and meaning:\n\n{text}',
  'bullet-points': 'Convert the following text into clear, organized bullet points:\n\n{text}',
  'action-items': 'Extract clear action items from the following text. Format as a numbered checklist:\n\n{text}',
  'elevator-pitch': 'Create a compelling 30-second elevator pitch based on:\n\n{text}\n\n{profile}',
  'linkedin-post': 'Write a professional LinkedIn post based on the following:\n\n{text}\n\n{profile}',
  rewrite: 'Rewrite the following text to improve clarity, flow, and impact while keeping the same meaning:\n\n{text}',
};

// ── Context Detection Patterns ───────────────────────────────
const CONTEXT_PATTERNS = {
  'job-application': {
    patterns: [
      /why.*(want|interested|apply|join)/i,
      /tell.*about.*yourself/i,
      /what.*bring.*to/i,
      /greatest.*strength/i,
      /greatest.*weakness/i,
      /salary.*expect/i,
      /experience.*with/i,
      /describe.*time.*when/i,
      /where.*see.*yourself/i,
      /why.*should.*hire/i,
      /work.*experience/i,
      /career.*goals/i,
      /cover.*letter/i,
      /years.*experience/i,
    ],
    formIndicators: ['workday.com', 'greenhouse.io', 'lever.co', 'icims.com', 'taleo', 'apply', 'application', 'careers', 'jobs'],
  },
  'email': {
    patterns: [/reply.*to/i, /respond.*to.*email/i, /draft.*email/i, /follow.*up/i, /thank.*you.*note/i],
  },
  'technical': {
    patterns: [/code.*review/i, /implement/i, /algorithm/i, /debug/i, /function.*that/i, /write.*code/i, /api.*endpoint/i],
  },
  'academic': {
    patterns: [/essay.*about/i, /research.*paper/i, /thesis/i, /analyze.*the/i, /compare.*and.*contrast/i, /discuss.*the.*impact/i],
  },
  'creative': {
    patterns: [/write.*story/i, /creative.*writing/i, /poem.*about/i, /slogan/i, /tagline/i, /brainstorm/i],
  },
};

// ── Sensitive Field Patterns ─────────────────────────────────
const SENSITIVE_PATTERNS = [
  /ssn|social.?security/i,
  /credit.?card|card.?number/i,
  /cvv|cvc|security.?code/i,
  /bank.?account|routing.?number/i,
  /passport.?number/i,
  /driver.?license/i,
  /\bpassword\b/i,
  /pin.?number/i,
  /tax.?id|ein|itin/i,
  /date.?of.?birth|dob/i,
  /mother.?maiden/i,
];

// ── Form Type Detection ──────────────────────────────────────
const FORM_TYPES = {
  job: { keywords: ['apply', 'resume', 'cover letter', 'experience', 'qualification', 'salary'], label: 'Job Application' },
  tax: { keywords: ['tax', 'filing', 'deduction', 'income', 'W-2', '1099'], label: 'Tax Form' },
  medical: { keywords: ['patient', 'medical', 'health', 'symptom', 'medication', 'allergy', 'insurance'], label: 'Medical Form' },
  visa: { keywords: ['visa', 'immigration', 'passport', 'travel', 'embassy', 'petition'], label: 'Visa/Immigration' },
  academic: { keywords: ['essay', 'thesis', 'research', 'citation', 'student', 'university'], label: 'Academic' },
  legal: { keywords: ['agreement', 'contract', 'liability', 'terms', 'plaintiff', 'defendant'], label: 'Legal' },
  survey: { keywords: ['rate', 'satisfy', 'feedback', 'experience', 'recommend', 'scale of'], label: 'Survey/Feedback' },
};

// ── Analytics Tracking ───────────────────────────────────────
async function trackUsage(type, data = {}) {
  const { stats } = await chrome.storage.local.get(['stats']);
  const s = stats || {
    totalGenerated: 0,
    totalCompared: 0,
    totalTimeSaved: 0,
    totalWords: 0,
    totalChars: 0,
    providerUsage: {},
    templateUsage: {},
    dailyUsage: {},
    streak: 0,
    lastUsedDate: null,
    firstUsedDate: null,
  };

  const today = new Date().toISOString().split('T')[0];
  if (!s.firstUsedDate) s.firstUsedDate = today;

  // Track streak
  if (s.lastUsedDate !== today) {
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    s.streak = (s.lastUsedDate === yesterday) ? s.streak + 1 : 1;
    s.lastUsedDate = today;
  }

  // Daily
  s.dailyUsage[today] = (s.dailyUsage[today] || 0) + 1;

  if (type === 'generate') {
    s.totalGenerated++;
    s.totalWords += (data.wordCount || 0);
    s.totalChars += (data.charCount || 0);
    s.totalTimeSaved += (data.estimatedTimeSaved || 30); // seconds
    s.providerUsage[data.provider] = (s.providerUsage[data.provider] || 0) + 1;
    s.templateUsage[data.template] = (s.templateUsage[data.template] || 0) + 1;
  } else if (type === 'compare') {
    s.totalCompared++;
    s.totalTimeSaved += (data.estimatedTimeSaved || 60);
  }

  await chrome.storage.local.set({ stats: s });
}

// ── Initialize ───────────────────────────────────────────────
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(['settings'], (result) => {
    if (!result.settings) {
      chrome.storage.local.set({
        settings: {
          theme: 'system',
          defaultProvider: 'groq',
          defaultPersona: 'professional',
          defaultTemplate: 'general',
          defaultTone: 'professional',
          answerLength: 'medium',
          readingLevel: 'standard',
          creativityLevel: 50,
          showFloatingToolbar: true,
          enableKeyboardShortcuts: true,
          maxHistoryItems: 100,
          enableContextDetection: true,
          enableSensitiveMasking: true,
          enableAnswerFusion: true,
          enableAutoSTAR: true,
          privateMode: false,
        },
        apiKeys: {},
        profile: {
          name: '', title: '', skills: '', experience: '',
          education: '', achievements: '', bio: '',
          starExamples: [], writingSamples: [], certifications: '',
          linkedinUrl: '', portfolioUrl: '', industries: '',
        },
        history: [],
        customTemplates: [],
        answerVersions: {},
        stats: null,
      });
    }
  });

  // Context menus
  const menus = [
    { id: 'aether-generate', title: 'Aether: Generate Answer' },
    { id: 'aether-summarize', title: 'Aether: Summarize' },
    { id: 'aether-simplify', title: 'Aether: Simplify' },
    { id: 'aether-expand', title: 'Aether: Expand' },
    { id: 'aether-star', title: 'Aether: STAR Method' },
    { id: 'aether-fix-grammar', title: 'Aether: Fix Grammar' },
    { id: 'aether-bullet-points', title: 'Aether: Bullet Points' },
    { id: 'aether-counter', title: 'Aether: Counter-Argument' },
    { id: 'aether-compare', title: 'Aether: Compare All AIs' },
    { id: 'aether-personas', title: 'Aether: Multi-Persona View' },
  ];
  menus.forEach(m => chrome.contextMenus.create({ ...m, contexts: ['selection'] }));
});

// ── Context Menu Handler ─────────────────────────────────────
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!info.selectionText) return;
  const templateMap = {
    'aether-generate': 'general',
    'aether-summarize': 'summarize',
    'aether-simplify': 'simplify',
    'aether-expand': 'expand',
    'aether-star': 'star-method',
    'aether-fix-grammar': 'fix-grammar',
    'aether-bullet-points': 'bullet-points',
    'aether-counter': 'counter-argument',
  };

  if (info.menuItemId === 'aether-compare') {
    chrome.tabs.sendMessage(tab.id, { action: 'showCompareResult', text: info.selectionText });
    return;
  }
  if (info.menuItemId === 'aether-personas') {
    chrome.tabs.sendMessage(tab.id, { action: 'showPersonasResult', text: info.selectionText });
    return;
  }

  const template = templateMap[info.menuItemId] || 'general';
  chrome.tabs.sendMessage(tab.id, { action: 'showInlineResult', text: info.selectionText, template });
});

// ── Keyboard Shortcut Handler ────────────────────────────────
chrome.commands.onCommand.addListener((command) => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) chrome.tabs.sendMessage(tabs[0].id, { action: command });
  });
});

// ── Message Router ───────────────────────────────────────────
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const handlers = {
    generateAnswer: () => handleGenerate(message),
    compareProviders: () => handleCompare(message),
    multiPersona: () => handleMultiPersona(message),
    devilsAdvocate: () => handleDevilsAdvocate(message),
    answerFusion: () => handleAnswerFusion(message),
    detectContext: () => handleDetectContext(message),
    detectFormType: () => handleDetectFormType(message),
    getProviders: () => Promise.resolve(PROVIDERS),
    getPersonas: () => Promise.resolve(PERSONAS),
    getTemplates: () => Promise.resolve(TEMPLATES),
    getTones: () => Promise.resolve(TONES),
    getReadingLevels: () => Promise.resolve(READING_LEVELS),
    getStats: () => chrome.storage.local.get(['stats']).then(r => r.stats || {}),
    checkSensitive: () => Promise.resolve({ sensitive: SENSITIVE_PATTERNS.some(p => p.test(message.text)) }),
    saveHistory: () => { saveToHistory(message.entry); return Promise.resolve({ success: true }); },
    getHistory: () => chrome.storage.local.get(['history']).then(r => r.history || []),
    clearHistory: () => chrome.storage.local.set({ history: [] }).then(() => ({ success: true })),
    saveAnswerVersion: () => saveAnswerVersion(message.id, message.version).then(() => ({ success: true })),
    getAnswerVersions: () => chrome.storage.local.get(['answerVersions']).then(r => r.answerVersions?.[message.id] || []),
    getCustomTemplates: () => chrome.storage.local.get(['customTemplates']).then(r => r.customTemplates || []),
    saveCustomTemplate: () => saveCustomTemplate(message.template).then(() => ({ success: true })),
    deleteCustomTemplate: () => deleteCustomTemplate(message.templateId).then(() => ({ success: true })),
    // ── New Feature Handlers ──
    fitScore: () => handleFitScore(message),
    predictNextQuestion: () => handlePredictNextQuestion(message),
    questionDifficulty: () => handleQuestionDifficulty(message),
    batchGenerate: () => handleBatchGenerate(message),
    contradictionCheck: () => handleContradictionCheck(message),
    getApplications: () => chrome.storage.local.get(['applications']).then(r => r.applications || []),
    saveApplication: () => saveApplication(message.app).then(() => ({ success: true })),
    deleteApplication: () => deleteApplication(message.appId).then(() => ({ success: true })),
    getGamification: () => getGamification(),
    saveDraft: () => saveDraft(message.siteKey, message.fieldKey, message.text).then(() => ({ success: true })),
    getDraft: () => getDraft(message.siteKey, message.fieldKey),
    getSitePermission: () => getSitePermission(message.site),
    setSitePermission: () => setSitePermission(message.site, message.allowed).then(() => ({ success: true })),
  };

  const handler = handlers[message.action];
  if (!handler) return false;

  const result = handler();
  if (result && typeof result.then === 'function') {
    result.then(sendResponse).catch(err => sendResponse({ error: err.message || 'Unknown error' }));
    return true;
  }
  return false;
});

// ── AI API Callers ───────────────────────────────────────────

async function callOpenAI(apiKey, model, messages, temperature = 0.7) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model, messages, max_tokens: 2048, temperature }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `OpenAI error: ${res.status}`);
  }
  const data = await res.json();
  return data.choices[0].message.content;
}

async function callAnthropic(apiKey, model, messages, temperature = 0.7) {
  const systemMsg = messages.find(m => m.role === 'system');
  const userMsgs = messages.filter(m => m.role !== 'system');
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model, max_tokens: 2048, temperature,
      system: systemMsg?.content || '',
      messages: userMsgs.map(m => ({ role: m.role, content: m.content })),
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Claude error: ${res.status}`);
  }
  const data = await res.json();
  return data.content[0].text;
}

async function callGroq(apiKey, model, messages, temperature = 0.7) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model, messages, max_tokens: 2048, temperature }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Groq error: ${res.status}`);
  }
  const data = await res.json();
  return data.choices[0].message.content;
}

async function callGoogle(apiKey, model, messages, temperature = 0.7) {
  const systemMsg = messages.find(m => m.role === 'system');
  const userMsgs = messages.filter(m => m.role !== 'system');
  const contents = userMsgs.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents,
      systemInstruction: systemMsg ? { parts: [{ text: systemMsg.content }] } : undefined,
      generationConfig: { maxOutputTokens: 2048, temperature },
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Gemini error: ${res.status}`);
  }
  const data = await res.json();
  return data.candidates[0].content.parts[0].text;
}

const CALLERS = { openai: callOpenAI, anthropic: callAnthropic, groq: callGroq, google: callGoogle };

// ── Build Messages ───────────────────────────────────────────

async function buildMessages(text, template, persona, profileData, tone, length, readingLevel, creativity, charLimit) {
  const personaPrompt = PERSONAS[persona]?.prompt || PERSONAS.professional.prompt;
  const tonePrompt = TONES[tone] || TONES.professional;
  const lengthPrompt = LENGTHS[length] || LENGTHS.medium;
  const levelPrompt = READING_LEVELS[readingLevel] || '';
  const templateStr = TEMPLATES[template] || TEMPLATES.general;

  let profileContext = '';
  if (profileData && (profileData.name || profileData.skills || profileData.experience)) {
    profileContext = '\n\nAbout me (use this as context):';
    if (profileData.name) profileContext += `\nName: ${profileData.name}`;
    if (profileData.title) profileContext += `\nTitle: ${profileData.title}`;
    if (profileData.skills) profileContext += `\nSkills: ${profileData.skills}`;
    if (profileData.experience) profileContext += `\nExperience: ${profileData.experience}`;
    if (profileData.education) profileContext += `\nEducation: ${profileData.education}`;
    if (profileData.achievements) profileContext += `\nAchievements: ${profileData.achievements}`;
    if (profileData.bio) profileContext += `\nBio: ${profileData.bio}`;
    if (profileData.industries) profileContext += `\nIndustries: ${profileData.industries}`;
    if (profileData.certifications) profileContext += `\nCertifications: ${profileData.certifications}`;

    // Include STAR examples if answering job questions
    if ((template === 'job-application' || template === 'star-method') && profileData.starExamples?.length) {
      profileContext += '\n\nMy STAR Examples:';
      profileData.starExamples.forEach((ex, i) => {
        profileContext += `\n${i + 1}. [${ex.category}] ${ex.situation} | Task: ${ex.task} | Action: ${ex.action} | Result: ${ex.result}`;
      });
    }
  }

  let charLimitNote = '';
  if (charLimit && charLimit > 0) {
    charLimitNote = `\n\nIMPORTANT: The response MUST be under ${charLimit} characters. Do not exceed this limit.`;
  }

  const systemParts = [personaPrompt, tonePrompt, lengthPrompt, levelPrompt, charLimitNote].filter(Boolean);
  const systemContent = systemParts.join('\n\n') + (profileContext || '');

  const userContent = templateStr
    .replace('{text}', text)
    .replace('{profile}', profileContext)
    .replace('{targetLang}', 'Spanish'); // default, can be overridden

  return [
    { role: 'system', content: systemContent },
    { role: 'user', content: userContent },
  ];
}

// ── Detect Context (auto-detect question type) ───────────────

function handleDetectContext(msg) {
  const { text, url } = msg;
  let bestMatch = 'general';
  let confidence = 0;

  for (const [type, config] of Object.entries(CONTEXT_PATTERNS)) {
    let score = 0;
    config.patterns.forEach(p => { if (p.test(text)) score += 10; });
    if (config.formIndicators && url) {
      config.formIndicators.forEach(ind => { if (url.toLowerCase().includes(ind)) score += 5; });
    }
    if (score > confidence) { confidence = score; bestMatch = type; }
  }

  // Map detected context to template
  const contextToTemplate = {
    'job-application': 'job-application',
    'email': 'email',
    'technical': 'general',
    'academic': 'general',
    'creative': 'general',
  };

  return Promise.resolve({
    detectedType: bestMatch,
    suggestedTemplate: contextToTemplate[bestMatch] || 'general',
    confidence: Math.min(confidence, 100),
  });
}

// ── Detect Form Type ─────────────────────────────────────────

function handleDetectFormType(msg) {
  const { pageText, url } = msg;
  const combined = (pageText || '') + ' ' + (url || '');
  let bestMatch = null;
  let bestScore = 0;

  for (const [type, config] of Object.entries(FORM_TYPES)) {
    const score = config.keywords.filter(kw => combined.toLowerCase().includes(kw)).length;
    if (score > bestScore) { bestScore = score; bestMatch = { type, ...config, score }; }
  }

  return Promise.resolve(bestMatch || { type: 'general', label: 'General', score: 0 });
}

// ── Generate Answer (single provider) ────────────────────────

async function handleGenerate(msg) {
  const { text, provider, model, template, persona, tone, length, readingLevel, creativity, charLimit, targetLang } = msg;

  const stored = await chrome.storage.local.get(['apiKeys', 'profile', 'settings', 'customTemplates']);
  const apiKeys = stored.apiKeys || {};
  const profile = stored.profile || {};
  const settings = stored.settings || {};
  const customTemplates = stored.customTemplates || [];

  const activeProvider = provider || settings.defaultProvider || 'groq';
  const activeModel = model || PROVIDERS[activeProvider]?.defaultModel;
  let activeTemplate = template || settings.defaultTemplate || 'general';
  const activePersona = persona || settings.defaultPersona || 'professional';
  const activeTone = tone || settings.defaultTone || 'professional';
  const activeLength = length || settings.answerLength || 'medium';
  const activeLevel = readingLevel || settings.readingLevel || 'standard';
  const activeCreativity = creativity ?? settings.creativityLevel ?? 50;

  // Check for custom template
  const customT = customTemplates.find(t => t.id === activeTemplate);
  if (customT) {
    TEMPLATES[customT.id] = customT.prompt;
  }

  // Auto-detect context if enabled
  if (settings.enableContextDetection && activeTemplate === 'general') {
    const detected = await handleDetectContext({ text, url: msg.url });
    if (detected.confidence >= 20) {
      activeTemplate = detected.suggestedTemplate;
    }
  }

  // Sensitive field check
  if (settings.enableSensitiveMasking && SENSITIVE_PATTERNS.some(p => p.test(text))) {
    return { answer: '[SENSITIVE FIELD DETECTED] This appears to contain sensitive personal information (SSN, credit card, etc.). Aether will not send this to any AI provider for your security. Please fill in sensitive fields manually.', provider: 'local', model: 'security-filter', elapsed: 0, sensitive: true };
  }

  const apiKey = apiKeys[activeProvider];
  if (!apiKey) {
    throw new Error(`No API key for ${PROVIDERS[activeProvider]?.name || activeProvider}. Open Settings to add one.`);
  }

  const caller = CALLERS[activeProvider];
  if (!caller) throw new Error(`Unsupported provider: ${activeProvider}`);

  // Map creativity (0-100) to temperature (0.0-1.0)
  const temperature = Math.max(0, Math.min(1, activeCreativity / 100));

  const messages = await buildMessages(text, activeTemplate, activePersona, profile, activeTone, activeLength, activeLevel, activeCreativity, charLimit);

  if (targetLang) {
    messages[1].content = messages[1].content.replace('{targetLang}', targetLang);
  }

  const startTime = Date.now();
  const answer = await caller(apiKey, activeModel, messages, temperature);
  const elapsed = Date.now() - startTime;

  const wordCount = answer.split(/\s+/).length;
  const charCount = answer.length;

  // Track usage
  if (!settings.privateMode) {
    trackUsage('generate', {
      provider: activeProvider, template: activeTemplate,
      wordCount, charCount, estimatedTimeSaved: Math.max(30, wordCount * 2),
    });
  }

  // Save to history (unless private mode)
  if (!settings.privateMode) {
    const entry = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
      timestamp: Date.now(),
      text: text.substring(0, 300),
      answer: answer.substring(0, 3000),
      provider: activeProvider, model: activeModel,
      persona: activePersona, template: activeTemplate,
      tone: activeTone, elapsed, wordCount, charCount,
    };
    saveToHistory(entry);
  }

  return { answer, provider: activeProvider, model: activeModel, elapsed, wordCount, charCount, detectedTemplate: activeTemplate };
}

// ── Compare Providers (multi-AI) ─────────────────────────────

async function handleCompare(msg) {
  const { text, providers, template, persona, tone, length, readingLevel, creativity, charLimit } = msg;

  const stored = await chrome.storage.local.get(['apiKeys', 'profile', 'settings']);
  const apiKeys = stored.apiKeys || {};
  const profile = stored.profile || {};
  const settings = stored.settings || {};

  const activeTemplate = template || settings.defaultTemplate || 'general';
  const activePersona = persona || settings.defaultPersona || 'professional';
  const activeTone = tone || settings.defaultTone || 'professional';
  const activeLength = length || settings.answerLength || 'medium';
  const activeLevel = readingLevel || settings.readingLevel || 'standard';
  const temperature = Math.max(0, Math.min(1, (creativity ?? settings.creativityLevel ?? 50) / 100));

  const availableProviders = (providers || Object.keys(PROVIDERS)).filter(p => apiKeys[p] && CALLERS[p]);
  if (availableProviders.length === 0) throw new Error('No API keys configured. Go to Settings to add at least one.');

  const messages = await buildMessages(text, activeTemplate, activePersona, profile, activeTone, activeLength, activeLevel, null, charLimit);

  const results = await Promise.allSettled(
    availableProviders.map(async (prov) => {
      const model = PROVIDERS[prov].defaultModel;
      const startTime = Date.now();
      const answer = await CALLERS[prov](apiKeys[prov], model, messages, temperature);
      return {
        provider: prov, providerName: PROVIDERS[prov].name, model, answer,
        elapsed: Date.now() - startTime,
        wordCount: answer.split(/\s+/).length,
        charCount: answer.length,
      };
    })
  );

  if (!settings.privateMode) trackUsage('compare', { estimatedTimeSaved: 90 });

  return results.map(r => {
    if (r.status === 'fulfilled') return { ...r.value, success: true };
    return { success: false, error: r.reason?.message || 'Failed', provider: r.reason?.provider };
  });
}

// ── Multi-Persona View ───────────────────────────────────────

async function handleMultiPersona(msg) {
  const { text, template, personas: requestedPersonas } = msg;
  const personaKeys = requestedPersonas || ['leader', 'analyst', 'creative', 'empath'];

  const stored = await chrome.storage.local.get(['apiKeys', 'profile', 'settings']);
  const apiKeys = stored.apiKeys || {};
  const profile = stored.profile || {};
  const settings = stored.settings || {};

  const provider = settings.defaultProvider || 'groq';
  const apiKey = apiKeys[provider];
  if (!apiKey) throw new Error(`No API key for ${PROVIDERS[provider]?.name}. Add one in Settings.`);

  const caller = CALLERS[provider];
  const model = PROVIDERS[provider].defaultModel;
  const temperature = Math.max(0, Math.min(1, (settings.creativityLevel ?? 50) / 100));

  const results = await Promise.allSettled(
    personaKeys.map(async (personaKey) => {
      const messages = await buildMessages(text, template || 'general', personaKey, profile, settings.defaultTone || 'professional', settings.answerLength || 'medium', settings.readingLevel || 'standard');
      const answer = await caller(apiKey, model, messages, temperature);
      return {
        persona: personaKey,
        personaName: PERSONAS[personaKey]?.name || personaKey,
        answer,
        wordCount: answer.split(/\s+/).length,
      };
    })
  );

  return results.map(r => {
    if (r.status === 'fulfilled') return { ...r.value, success: true };
    return { success: false, error: r.reason?.message, persona: r.value?.persona };
  });
}

// ── Devil's Advocate ─────────────────────────────────────────

async function handleDevilsAdvocate(msg) {
  const { text, answer } = msg;

  const stored = await chrome.storage.local.get(['apiKeys', 'settings']);
  const apiKeys = stored.apiKeys || {};
  const settings = stored.settings || {};

  const provider = settings.defaultProvider || 'groq';
  const apiKey = apiKeys[provider];
  if (!apiKey) throw new Error(`No API key for ${PROVIDERS[provider]?.name}.`);

  const caller = CALLERS[provider];
  const model = PROVIDERS[provider].defaultModel;

  const messages = [
    {
      role: 'system',
      content: `You are a Devil's Advocate reviewer. Your job is to find weaknesses, gaps, and potential improvements in the given answer. Be constructive but thorough. Structure your critique as:

1. **Strengths**: What's good about this answer (2-3 points)
2. **Weaknesses**: What could be improved (2-3 points)
3. **Missing Elements**: What's not addressed (1-2 points)
4. **Suggested Revision**: A brief improved version or key changes
5. **Confidence Score**: Rate the answer quality 1-10`,
    },
    {
      role: 'user',
      content: `Original question/context:\n${text}\n\nAnswer to review:\n${answer}`,
    },
  ];

  const critique = await caller(apiKey, model, messages, 0.3);
  return { critique, provider, model };
}

// ── Answer Fusion (combine best parts from multiple AIs) ─────

async function handleAnswerFusion(msg) {
  const { text, answers } = msg;

  const stored = await chrome.storage.local.get(['apiKeys', 'settings']);
  const apiKeys = stored.apiKeys || {};
  const settings = stored.settings || {};

  const provider = settings.defaultProvider || 'groq';
  const apiKey = apiKeys[provider];
  if (!apiKey) throw new Error(`No API key for ${PROVIDERS[provider]?.name}.`);

  const caller = CALLERS[provider];
  const model = PROVIDERS[provider].defaultModel;

  let answersText = '';
  answers.forEach((a, i) => {
    answersText += `\n--- Answer ${i + 1} (${a.providerName || a.provider}) ---\n${a.answer}\n`;
  });

  const messages = [
    {
      role: 'system',
      content: `You are an expert answer synthesizer. Given multiple AI-generated answers to the same question, create a single "best-of" answer that:
1. Takes the strongest points from each answer
2. Removes redundancy
3. Fills any gaps one answer covers that others miss
4. Maintains a consistent voice and tone
5. Is better than any individual answer

Do NOT mention that you are combining answers. Just write the best possible unified answer.`,
    },
    {
      role: 'user',
      content: `Question/context:\n${text}\n\nAnswers to synthesize:\n${answersText}`,
    },
  ];

  const fusedAnswer = await caller(apiKey, model, messages, 0.4);
  return { answer: fusedAnswer, provider, model, wordCount: fusedAnswer.split(/\s+/).length };
}

// ── Custom Template Management ───────────────────────────────

async function saveCustomTemplate(template) {
  const { customTemplates } = await chrome.storage.local.get(['customTemplates']);
  const templates = customTemplates || [];
  const existing = templates.findIndex(t => t.id === template.id);
  if (existing >= 0) templates[existing] = template;
  else templates.push({ ...template, id: template.id || ('custom-' + Date.now().toString(36)) });
  await chrome.storage.local.set({ customTemplates: templates });
}

async function deleteCustomTemplate(templateId) {
  const { customTemplates } = await chrome.storage.local.get(['customTemplates']);
  await chrome.storage.local.set({ customTemplates: (customTemplates || []).filter(t => t.id !== templateId) });
}

// ── Answer Version Management ────────────────────────────────

async function saveAnswerVersion(answerId, version) {
  const { answerVersions } = await chrome.storage.local.get(['answerVersions']);
  const versions = answerVersions || {};
  if (!versions[answerId]) versions[answerId] = [];
  versions[answerId].push({ ...version, savedAt: Date.now() });
  if (versions[answerId].length > 10) versions[answerId] = versions[answerId].slice(-10);
  await chrome.storage.local.set({ answerVersions: versions });
}

// ── Fit Score (job match %) ──────────────────────────────────

async function handleFitScore(msg) {
  const { jobDescription } = msg;
  const stored = await chrome.storage.local.get(['apiKeys', 'profile', 'settings']);
  const apiKeys = stored.apiKeys || {};
  const profile = stored.profile || {};
  const settings = stored.settings || {};
  const provider = settings.defaultProvider || 'groq';
  const apiKey = apiKeys[provider];
  if (!apiKey) throw new Error('No API key configured.');
  const caller = CALLERS[provider];
  const model = PROVIDERS[provider].defaultModel;

  let profileText = '';
  if (profile.skills) profileText += `Skills: ${profile.skills}\n`;
  if (profile.experience) profileText += `Experience: ${profile.experience}\n`;
  if (profile.education) profileText += `Education: ${profile.education}\n`;
  if (profile.certifications) profileText += `Certifications: ${profile.certifications}\n`;

  const messages = [
    { role: 'system', content: 'You are a career advisor. Analyze the match between a candidate and job description. Return a JSON object with: { "score": <number 0-100>, "matchedSkills": [<skills that match>], "missingSkills": [<skills candidate lacks>], "tips": [<3 tips to improve match>] }. Return ONLY valid JSON, no markdown.' },
    { role: 'user', content: `Job Description:\n${jobDescription}\n\nCandidate Profile:\n${profileText}` },
  ];
  const answer = await caller(apiKey, model, messages, 0.2);
  try { return JSON.parse(answer); } catch { return { score: 0, matchedSkills: [], missingSkills: [], tips: ['Could not parse fit score response.'], raw: answer }; }
}

// ── Predict Next Question ───────────────────────────────────

async function handlePredictNextQuestion(msg) {
  const { currentQuestion, formContext } = msg;
  const stored = await chrome.storage.local.get(['apiKeys', 'settings']);
  const provider = stored.settings?.defaultProvider || 'groq';
  const apiKey = stored.apiKeys?.[provider];
  if (!apiKey) throw new Error('No API key configured.');
  const caller = CALLERS[provider];
  const model = PROVIDERS[provider].defaultModel;

  const messages = [
    { role: 'system', content: 'Based on the current form question and any context, predict the next 3 most likely questions that will follow. Return a JSON array of strings. Return ONLY the JSON array.' },
    { role: 'user', content: `Current question: ${currentQuestion}\nForm context: ${formContext || 'Unknown form'}` },
  ];
  const answer = await caller(apiKey, model, messages, 0.3);
  try { return { predictions: JSON.parse(answer) }; } catch { return { predictions: [answer.trim()] }; }
}

// ── Question Difficulty Rating ──────────────────────────────

function handleQuestionDifficulty(msg) {
  const { text } = msg;
  const lower = text.toLowerCase();
  let difficulty = 'easy';
  let score = 1;

  const hardPatterns = [/describe.*time.*when/i, /tell.*about.*challenge/i, /what.*would.*you.*do.*if/i, /how.*do.*you.*handle/i, /greatest.*weakness/i, /where.*see.*yourself/i, /why.*should.*hire/i, /salary.*expectation/i, /ethical.*dilemma/i, /disagree.*with.*manager/i];
  const mediumPatterns = [/experience.*with/i, /skills.*in/i, /tell.*about/i, /what.*is.*your/i, /how.*long/i, /why.*do.*you.*want/i];

  const hardMatches = hardPatterns.filter(p => p.test(lower)).length;
  const mediumMatches = mediumPatterns.filter(p => p.test(lower)).length;
  const wordCount = text.split(/\s+/).length;

  if (hardMatches >= 2 || (hardMatches >= 1 && wordCount > 15)) { difficulty = 'hard'; score = 3; }
  else if (hardMatches >= 1 || mediumMatches >= 2 || wordCount > 20) { difficulty = 'medium'; score = 2; }

  const tips = [];
  if (difficulty === 'hard') tips.push('Use STAR method', 'Include specific metrics', 'Prepare 2 examples');
  else if (difficulty === 'medium') tips.push('Be specific with examples', 'Keep it concise');
  else tips.push('Keep it simple and direct');

  return Promise.resolve({ difficulty, score, tips, wordCount });
}

// ── Batch Generate (multiple questions at once) ─────────────

async function handleBatchGenerate(msg) {
  const { questions, template, persona, tone, length } = msg;
  const stored = await chrome.storage.local.get(['apiKeys', 'profile', 'settings']);
  const apiKeys = stored.apiKeys || {};
  const profile = stored.profile || {};
  const settings = stored.settings || {};
  const provider = settings.defaultProvider || 'groq';
  const apiKey = apiKeys[provider];
  if (!apiKey) throw new Error('No API key configured.');
  const caller = CALLERS[provider];
  const model = PROVIDERS[provider].defaultModel;
  const temperature = Math.max(0, Math.min(1, (settings.creativityLevel ?? 50) / 100));

  const results = await Promise.allSettled(
    questions.map(async (q) => {
      const messages = await buildMessages(q.text, template || 'general', persona || 'professional', profile, tone || 'professional', length || 'medium');
      const startTime = Date.now();
      const answer = await caller(apiKey, model, messages, temperature);
      return { text: q.text, fieldId: q.fieldId, answer, elapsed: Date.now() - startTime, wordCount: answer.split(/\s+/).length };
    })
  );

  return results.map(r => r.status === 'fulfilled' ? { ...r.value, success: true } : { success: false, error: r.reason?.message });
}

// ── Contradiction Checker ───────────────────────────────────

async function handleContradictionCheck(msg) {
  const { answers } = msg; // Array of { fieldLabel, answer }
  const stored = await chrome.storage.local.get(['apiKeys', 'settings']);
  const provider = stored.settings?.defaultProvider || 'groq';
  const apiKey = stored.apiKeys?.[provider];
  if (!apiKey) throw new Error('No API key configured.');
  const caller = CALLERS[provider];
  const model = PROVIDERS[provider].defaultModel;

  let answersText = '';
  answers.forEach((a, i) => { answersText += `${i + 1}. [${a.fieldLabel}]: ${a.answer}\n`; });

  const messages = [
    { role: 'system', content: 'Analyze these form answers for contradictions, inconsistencies, or conflicting information. Return a JSON object: { "hasContradictions": <boolean>, "issues": [{ "fields": [<field numbers>], "description": "<what conflicts>" }], "suggestions": [<how to fix>] }. Return ONLY valid JSON.' },
    { role: 'user', content: answersText },
  ];
  const answer = await caller(apiKey, model, messages, 0.2);
  try { return JSON.parse(answer); } catch { return { hasContradictions: false, issues: [], suggestions: [], raw: answer }; }
}

// ── Application Tracker ─────────────────────────────────────

async function saveApplication(app) {
  const { applications } = await chrome.storage.local.get(['applications']);
  const apps = applications || [];
  const existing = apps.findIndex(a => a.id === app.id);
  if (existing >= 0) apps[existing] = { ...apps[existing], ...app, updatedAt: Date.now() };
  else apps.unshift({ ...app, id: app.id || Date.now().toString(36), createdAt: Date.now(), updatedAt: Date.now(), status: app.status || 'applied' });
  await chrome.storage.local.set({ applications: apps });
}

async function deleteApplication(appId) {
  const { applications } = await chrome.storage.local.get(['applications']);
  await chrome.storage.local.set({ applications: (applications || []).filter(a => a.id !== appId) });
}

// ── Gamification (Badges) ───────────────────────────────────

async function getGamification() {
  const { stats, history, profile } = await chrome.storage.local.get(['stats', 'history', 'profile']);
  const s = stats || {};
  const h = history || [];
  const p = profile || {};

  const badges = [];
  if (s.totalGenerated >= 1) badges.push({ id: 'first-answer', name: 'First Answer', desc: 'Generated your first AI answer', earned: true });
  if (s.totalGenerated >= 10) badges.push({ id: 'ten-answers', name: 'Power User', desc: 'Generated 10+ answers', earned: true });
  if (s.totalGenerated >= 50) badges.push({ id: 'fifty-answers', name: 'Answer Machine', desc: 'Generated 50+ answers', earned: true });
  if (s.totalGenerated >= 100) badges.push({ id: 'centurion', name: 'Centurion', desc: '100+ answers generated', earned: true });
  if (s.totalCompared >= 1) badges.push({ id: 'first-compare', name: 'Comparative Thinker', desc: 'First multi-AI comparison', earned: true });
  if (s.totalCompared >= 10) badges.push({ id: 'ten-compares', name: 'AI Connoisseur', desc: '10+ comparisons', earned: true });
  if (s.streak >= 3) badges.push({ id: 'streak-3', name: 'On a Roll', desc: '3-day streak', earned: true });
  if (s.streak >= 7) badges.push({ id: 'streak-7', name: 'Weekly Warrior', desc: '7-day streak', earned: true });
  if (s.streak >= 30) badges.push({ id: 'streak-30', name: 'Monthly Master', desc: '30-day streak', earned: true });
  if (p.name && p.skills && p.experience) badges.push({ id: 'profile-complete', name: 'Identity Set', desc: 'Filled out your profile', earned: true });
  if (p.starExamples?.length >= 3) badges.push({ id: 'star-collector', name: 'STAR Collector', desc: '3+ STAR examples in bank', earned: true });
  if (s.totalWords >= 5000) badges.push({ id: 'word-smith', name: 'Wordsmith', desc: '5,000+ words generated', earned: true });
  if (s.totalWords >= 25000) badges.push({ id: 'novelist', name: 'Novelist', desc: '25,000+ words generated', earned: true });

  // Add unearned badges
  const allBadges = [
    { id: 'first-answer', name: 'First Answer', desc: 'Generate your first AI answer' },
    { id: 'ten-answers', name: 'Power User', desc: 'Generate 10+ answers' },
    { id: 'fifty-answers', name: 'Answer Machine', desc: 'Generate 50+ answers' },
    { id: 'centurion', name: 'Centurion', desc: '100+ answers generated' },
    { id: 'first-compare', name: 'Comparative Thinker', desc: 'First multi-AI comparison' },
    { id: 'ten-compares', name: 'AI Connoisseur', desc: '10+ comparisons' },
    { id: 'streak-3', name: 'On a Roll', desc: '3-day streak' },
    { id: 'streak-7', name: 'Weekly Warrior', desc: '7-day streak' },
    { id: 'streak-30', name: 'Monthly Master', desc: '30-day streak' },
    { id: 'profile-complete', name: 'Identity Set', desc: 'Fill out your profile' },
    { id: 'star-collector', name: 'STAR Collector', desc: '3+ STAR examples' },
    { id: 'word-smith', name: 'Wordsmith', desc: '5,000+ words generated' },
    { id: 'novelist', name: 'Novelist', desc: '25,000+ words generated' },
  ];

  const earnedIds = new Set(badges.map(b => b.id));
  const result = allBadges.map(b => ({ ...b, earned: earnedIds.has(b.id) }));
  return { badges: result, totalEarned: earnedIds.size, totalPossible: allBadges.length };
}

// ── Draft Auto-save ─────────────────────────────────────────

async function saveDraft(siteKey, fieldKey, text) {
  const { drafts } = await chrome.storage.local.get(['drafts']);
  const d = drafts || {};
  if (!d[siteKey]) d[siteKey] = {};
  d[siteKey][fieldKey] = { text, savedAt: Date.now() };
  // Limit total sites to 50
  const keys = Object.keys(d);
  if (keys.length > 50) delete d[keys[0]];
  await chrome.storage.local.set({ drafts: d });
}

async function getDraft(siteKey, fieldKey) {
  const { drafts } = await chrome.storage.local.get(['drafts']);
  return drafts?.[siteKey]?.[fieldKey] || null;
}

// ── Per-Site Permissions ────────────────────────────────────

async function getSitePermission(site) {
  const { sitePermissions } = await chrome.storage.local.get(['sitePermissions']);
  return { allowed: sitePermissions?.[site] !== false }; // default allowed
}

async function setSitePermission(site, allowed) {
  const { sitePermissions } = await chrome.storage.local.get(['sitePermissions']);
  const perms = sitePermissions || {};
  perms[site] = allowed;
  await chrome.storage.local.set({ sitePermissions: perms });
}

// ── History Management ───────────────────────────────────────

function saveToHistory(entry) {
  chrome.storage.local.get(['history', 'settings'], (result) => {
    const history = result.history || [];
    const maxItems = result.settings?.maxHistoryItems || 100;
    history.unshift(entry);
    if (history.length > maxItems) history.length = maxItems;
    chrome.storage.local.set({ history });
  });
}
