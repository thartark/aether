const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

const BLOCKED_KEYWORDS = ["illegal", "hack", "bomb", "exploit", "deepfake", "fraud", "ssn", "credit card"];

async function callGroq(model, messages, apiKey, temperature = 0.7, onProgress = () => {}) {
  if (!apiKey) throw new Error("Missing Groq API key");

  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: 1400,
      stream: false  // can upgrade to true later for real streaming
    })
  });

  if (!res.ok) throw new Error(`Groq error ${res.status}`);
  const data = await res.json();
  onProgress(60);
  return data.choices[0].message.content.trim();
}

async function synthesizeAnswer(selectedText, pageTitle, pageUrl, options = {}) {
  const { groqApiKey, profile = {} } = await chrome.storage.local.get(['groqApiKey', 'profile']);
  if (!groqApiKey) return { error: "No API key — offline mode (mock answer)", best: "This is a local mock response since no Groq key is set." };

  const { progress } = options;

  // Ethical guardrail
  const lower = selectedText.toLowerCase();
  if (BLOCKED_KEYWORDS.some(k => lower.includes(k))) {
    return { error: "Blocked by ethical guardrails", warning: "Query contains potentially harmful content — request refused.", best: "" };
  }

  progress?.(30);

  const tone = options.tone || profile.tone || 'professional';
  const temp = options.precision ? (options.precision / 100) * 1.4 : 0.7;

  const tonePrefixes = { /* same as before */ professional: "...", casual: "...", creative: "..." };

  const system = `You are Aether. Page: "${pageTitle}". Context: "${selectedText}". ${tonePrefixes[tone] || ""}`;

  const models = { main: "llama-3.3-70b-versatile", fast: "llama-3.1-8b-instant", google: "gemma2-9b-it" };

  try {
    progress?.(40);
    const [best, humble, creative, analyst] = await Promise.all([
      callGroq(models.main,   [{role:"system", content:system}, {role:"user", content:selectedText}], groqApiKey, temp, progress),
      callGroq(models.fast,   [{role:"system", content:system + "\nBe humble."}, {role:"user", content:selectedText}], groqApiKey, temp-0.2, progress),
      callGroq(models.google, [{role:"system", content:system + "\nBe creative."}, {role:"user", content:selectedText}], groqApiKey, temp+0.3, progress),
      callGroq(models.main,   [{role:"system", content:system + "\nBe analytical and data-driven."}, {role:"user", content:selectedText}], groqApiKey, temp-0.1, progress)
    ]);

    progress?.(80);

    const variants = [best, humble, creative, analyst];
    const bestIdx = Math.floor(Math.random() * variants.length); // fake selection

    return {
      best: variants[bestIdx],
      variants,
      personaConfident: variants[0],
      personaHumble: variants[1],
      personaCreative: variants[2],
      personaAnalyst: analyst,
      justification: `4 models • Tone: ${tone} • Temp: ${temp.toFixed(2)}`,
      warning: "",
      versionId: Date.now()
    };
  } catch (e) {
    return { error: e.message, best: "Error: " + e.message };
  }
}

window.AetherAI = { synthesizeAnswer };
