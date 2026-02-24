/* ============================================================
   Aether - Popup Script v2.0
   ============================================================ */

let providers = {};
let tones = {};
let personas = {};
let currentAnswer = '';
let currentTemplate = 'general';
let currentLength = 'medium';
let lastCompareResults = [];
let lastInputText = '';

// ── Initialize ──────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  await loadTheme();
  await loadProviders();
  await loadTones();
  await loadPersonas();
  await loadSettings();
  await checkOnboarding();
  await getSelectedText();
  await loadStats();
  loadHistory();
  setupListeners();
});

// ── Theme ───────────────────────────────────────────────────
async function loadTheme() {
  const { settings } = await chrome.storage.local.get(['settings']);
  applyTheme(settings?.theme || 'system');
}
function applyTheme(t) {
  if (t === 'light') document.body.setAttribute('data-theme', 'light');
  else if (t === 'dark') document.body.removeAttribute('data-theme');
  else {
    if (window.matchMedia('(prefers-color-scheme: light)').matches) document.body.setAttribute('data-theme', 'light');
    else document.body.removeAttribute('data-theme');
  }
}

// ── Load Data ───────────────────────────────────────────────
async function loadProviders() {
  try { providers = await sendMsg({ action: 'getProviders' }); } catch { providers = {}; }
  const sel = document.getElementById('select-provider');
  sel.innerHTML = '';
  for (const [k, p] of Object.entries(providers)) {
    const o = document.createElement('option'); o.value = k; o.textContent = p.name; sel.appendChild(o);
  }
  sel.addEventListener('change', updateModels);
  updateModels();
  // Also fill history filter
  const hf = document.getElementById('history-filter-provider');
  for (const [k, p] of Object.entries(providers)) {
    const o = document.createElement('option'); o.value = k; o.textContent = p.name.split('(')[0].trim(); hf.appendChild(o);
  }
}
function updateModels() {
  const pk = document.getElementById('select-provider').value;
  const p = providers[pk];
  const ms = document.getElementById('select-model');
  ms.innerHTML = '';
  if (p) p.models.forEach(m => { const o = document.createElement('option'); o.value = m; o.textContent = m; if (m === p.defaultModel) o.selected = true; ms.appendChild(o); });
}
async function loadTones() {
  try { tones = await sendMsg({ action: 'getTones' }); } catch { tones = {}; }
  const sel = document.getElementById('select-tone');
  sel.innerHTML = '';
  for (const [k] of Object.entries(tones)) {
    const o = document.createElement('option'); o.value = k; o.textContent = k.charAt(0).toUpperCase() + k.slice(1); sel.appendChild(o);
  }
}
async function loadPersonas() {
  try { personas = await sendMsg({ action: 'getPersonas' }); } catch { personas = {}; }
  const sel = document.getElementById('select-persona');
  sel.innerHTML = '';
  for (const [k, p] of Object.entries(personas)) {
    const o = document.createElement('option'); o.value = k; o.textContent = p.name; sel.appendChild(o);
  }
}
async function loadStats() {
  try {
    const stats = await sendMsg({ action: 'getStats' });
    document.getElementById('stat-generated').textContent = stats.totalGenerated || 0;
    const mins = Math.round((stats.totalTimeSaved || 0) / 60);
    document.getElementById('stat-time-saved').textContent = mins > 60 ? `${Math.round(mins/60)}h` : `${mins}m`;
    const words = stats.totalWords || 0;
    document.getElementById('stat-words').textContent = words > 1000 ? `${(words/1000).toFixed(1)}k` : words;
    document.getElementById('stat-streak').textContent = stats.streak || 0;
  } catch {}
}

// ── Onboarding ──────────────────────────────────────────────
async function checkOnboarding() {
  const { apiKeys } = await chrome.storage.local.get(['apiKeys']);
  const keys = apiKeys || {};
  const hasAny = Object.values(keys).some(v => !!v);
  document.getElementById('onboarding').style.display = hasAny ? 'none' : 'block';
  renderProviderBar(keys);
}
function renderProviderBar(keys) {
  const bar = document.getElementById('provider-bar');
  bar.innerHTML = '';
  for (const [k, p] of Object.entries(providers)) {
    const has = !!keys?.[k];
    bar.innerHTML += `<div class="prov-chip ${has ? 'active' : ''}"><span class="dot ${has ? 'on' : 'off'}"></span>${p.name.split('(')[0].trim()}</div>`;
  }
}

// ── Settings ────────────────────────────────────────────────
async function loadSettings() {
  const { settings } = await chrome.storage.local.get(['settings']);
  if (!settings) return;
  if (settings.defaultProvider) { document.getElementById('select-provider').value = settings.defaultProvider; updateModels(); }
  if (settings.defaultPersona) document.getElementById('select-persona').value = settings.defaultPersona;
  if (settings.defaultTone) document.getElementById('select-tone').value = settings.defaultTone;
  if (settings.readingLevel) document.getElementById('select-reading-level').value = settings.readingLevel;
  if (settings.creativityLevel !== undefined) {
    document.getElementById('creativity-slider').value = settings.creativityLevel;
    document.getElementById('creativity-val').textContent = settings.creativityLevel + '%';
  }
  // Load custom templates
  try {
    const customs = await sendMsg({ action: 'getCustomTemplates' });
    const group = document.getElementById('template-chips');
    customs.forEach(ct => {
      const btn = document.createElement('button');
      btn.className = 'chip'; btn.dataset.template = ct.id; btn.textContent = ct.name;
      group.appendChild(btn);
    });
  } catch {}
  // Fill history template filter
  const hf = document.getElementById('history-filter-template');
  ['general','summarize','expand','simplify','fix-grammar','explain','email','job-application','star-method','ats-optimize','bullet-points','rewrite'].forEach(t => {
    const o = document.createElement('option'); o.value = t; o.textContent = t; hf.appendChild(o);
  });
}

// ── Get Selected Text ───────────────────────────────────────
async function getSelectedText() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      const r = await chrome.tabs.sendMessage(tab.id, { action: 'getSelectedText' });
      if (r?.text) {
        document.getElementById('input-text').value = r.text;
        updateCharCount();
        // Auto-detect context
        try {
          const ctx = await sendMsg({ action: 'detectContext', text: r.text, url: tab.url });
          if (ctx?.confidence >= 20 && ctx.detectedType !== 'general') {
            const badge = document.getElementById('context-badge');
            badge.textContent = `Auto-detected: ${ctx.detectedType.replace(/-/g, ' ')}`;
            badge.style.display = 'block';
            // Auto-select template
            document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
            const match = document.querySelector(`.chip[data-template="${ctx.suggestedTemplate}"]`);
            if (match) { match.classList.add('active'); currentTemplate = ctx.suggestedTemplate; }
          }
        } catch {}
      }
    }
  } catch {}
}

// ── Listeners ───────────────────────────────────────────────
function setupListeners() {
  // Tabs
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(`tab-${tab.dataset.tab}`).classList.add('active');
      if (tab.dataset.tab === 'history') loadHistory();
      if (tab.dataset.tab === 'apps') loadApplications();
      if (tab.dataset.tab === 'badges') loadBadges();
    });
  });

  // Theme
  document.getElementById('btn-theme').addEventListener('click', async () => {
    const { settings } = await chrome.storage.local.get(['settings']);
    const s = settings || {};
    const next = s.theme === 'dark' ? 'light' : s.theme === 'light' ? 'system' : 'dark';
    s.theme = next; await chrome.storage.local.set({ settings: s }); applyTheme(next); notify(`Theme: ${next}`);
  });

  // Settings
  document.getElementById('btn-settings').addEventListener('click', () => chrome.runtime.openOptionsPage());

  // Template chips
  document.getElementById('template-chips').addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    document.querySelectorAll('#template-chips .chip').forEach(x => x.classList.remove('active'));
    chip.classList.add('active');
    currentTemplate = chip.dataset.template;
  });

  // Length pills
  document.querySelectorAll('.pill').forEach(p => {
    p.addEventListener('click', () => {
      document.querySelectorAll('.pill').forEach(x => x.classList.remove('active'));
      p.classList.add('active'); currentLength = p.dataset.length;
    });
  });

  // Creativity slider
  document.getElementById('creativity-slider').addEventListener('input', (e) => {
    document.getElementById('creativity-val').textContent = e.target.value + '%';
  });

  // Char count
  document.getElementById('input-text').addEventListener('input', updateCharCount);

  // Generate
  document.getElementById('btn-generate').addEventListener('click', generate);
  document.getElementById('btn-regenerate').addEventListener('click', generate);

  // Quick compare & personas
  document.getElementById('btn-compare-quick').addEventListener('click', () => {
    const text = document.getElementById('input-text').value.trim();
    if (!text) return notify('Enter text first', 'error');
    document.getElementById('compare-text').value = text;
    switchTab('compare'); runCompare();
  });
  document.getElementById('btn-personas-quick').addEventListener('click', () => {
    const text = document.getElementById('input-text').value.trim();
    if (!text) return notify('Enter text first', 'error');
    document.getElementById('personas-text').value = text;
    switchTab('personas'); runPersonas();
  });

  // Compare tab
  document.getElementById('btn-run-compare').addEventListener('click', runCompare);
  document.getElementById('btn-fuse-answers').addEventListener('click', fuseAnswers);

  // Personas tab
  document.getElementById('btn-run-personas').addEventListener('click', runPersonas);
  document.getElementById('persona-selector').addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (chip) chip.classList.toggle('active');
  });

  // Copy answer
  document.getElementById('btn-copy-answer').addEventListener('click', async () => {
    if (currentAnswer) { await copyClip(currentAnswer); notify('Copied!'); }
  });

  // Insert answer
  document.getElementById('btn-insert-answer').addEventListener('click', async () => {
    if (!currentAnswer) return;
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.id) { await chrome.tabs.sendMessage(tab.id, { action: 'insertAnswer', answer: currentAnswer }); notify('Inserted'); }
    } catch { notify('Focus a text field first', 'error'); }
  });

  // Devil's Advocate
  document.getElementById('btn-devils-advocate').addEventListener('click', runDevilsAdvocate);

  // Copy fused
  document.getElementById('btn-copy-fused').addEventListener('click', async () => {
    const text = document.getElementById('fused-content').textContent;
    if (text) { await copyClip(text); notify('Copied!'); }
  });

  // History
  document.getElementById('history-search').addEventListener('input', loadHistory);
  document.getElementById('history-filter-provider').addEventListener('change', loadHistory);
  document.getElementById('history-filter-template').addEventListener('change', loadHistory);
  document.getElementById('btn-export-history').addEventListener('click', exportHistory);

  // App tracker
  document.getElementById('btn-add-app')?.addEventListener('click', async () => {
    const company = document.getElementById('app-company').value.trim();
    const role = document.getElementById('app-role').value.trim();
    if (!company) return notify('Enter company name', 'error');
    await sendMsg({ action: 'saveApplication', app: { company, role, url: document.getElementById('app-url').value.trim(), status: document.getElementById('app-status').value } });
    ['app-company', 'app-role', 'app-url'].forEach(id => document.getElementById(id).value = '');
    loadApplications(); notify('Application tracked');
  });
  document.getElementById('btn-fit-score')?.addEventListener('click', runFitScore);

  // Onboarding keys
  document.querySelectorAll('.key-save').forEach(btn => {
    btn.addEventListener('click', async () => {
      const prov = btn.dataset.provider;
      const val = document.getElementById(`onboard-${prov}`).value.trim();
      if (!val) return notify('Enter a key first', 'error');
      const { apiKeys } = await chrome.storage.local.get(['apiKeys']);
      const keys = apiKeys || {}; keys[prov] = val;
      await chrome.storage.local.set({ apiKeys: keys });
      notify(`${prov.charAt(0).toUpperCase() + prov.slice(1)} key saved!`);
      await checkOnboarding();
    });
  });
}

function updateCharCount() {
  const text = document.getElementById('input-text').value;
  document.getElementById('input-char-count').textContent = `${text.length} chars`;
}

// ── Generate ────────────────────────────────────────────────
async function generate() {
  const text = document.getElementById('input-text').value.trim();
  if (!text) return notify('Enter or select text first', 'error');
  lastInputText = text;

  const box = document.getElementById('answer-box');
  const content = document.getElementById('answer-content');
  const meta = document.getElementById('answer-meta');
  const footer = document.getElementById('answer-footer');
  const btn = document.getElementById('btn-generate');
  const critique = document.getElementById('critique-box');
  critique.style.display = 'none';

  btn.disabled = true; btn.textContent = 'Generating...';
  box.classList.add('visible');
  content.innerHTML = '<div class="loading"><div class="spinner"></div> Thinking...</div>';
  meta.textContent = ''; footer.textContent = '';

  try {
    const result = await sendMsg({
      action: 'generateAnswer', text,
      provider: document.getElementById('select-provider').value,
      model: document.getElementById('select-model').value,
      template: currentTemplate,
      persona: document.getElementById('select-persona').value,
      tone: document.getElementById('select-tone').value,
      length: currentLength,
      readingLevel: document.getElementById('select-reading-level').value,
      creativity: parseInt(document.getElementById('creativity-slider').value),
      charLimit: parseInt(document.getElementById('input-char-limit').value) || 0,
    });
    if (result.error) {
      content.textContent = result.error; content.style.color = 'var(--red)';
    } else if (result.sensitive) {
      content.textContent = result.answer; content.style.color = 'var(--amber)';
    } else {
      currentAnswer = result.answer;
      pushToStack(currentAnswer);
      content.textContent = result.answer; content.style.color = '';
      meta.textContent = `${providers[result.provider]?.name?.split('(')[0]?.trim() || result.provider} / ${result.model} - ${(result.elapsed / 1000).toFixed(1)}s`;
      footer.textContent = `${result.wordCount} words | ${result.charCount} chars${result.detectedTemplate !== currentTemplate ? ' | Auto: ' + result.detectedTemplate : ''}`;
      loadStats();
    }
  } catch (err) {
    content.textContent = err.message; content.style.color = 'var(--red)';
  } finally {
    btn.disabled = false; btn.textContent = 'Generate Answer';
  }
}

// ── Compare ─────────────────────────────────────────────────
async function runCompare() {
  const text = document.getElementById('compare-text').value.trim();
  if (!text) return notify('Enter text first', 'error');
  const div = document.getElementById('compare-results');
  const btn = document.getElementById('btn-run-compare');
  const fuseBtn = document.getElementById('btn-fuse-answers');
  btn.disabled = true; btn.textContent = 'Comparing...';
  div.innerHTML = '<div class="loading"><div class="spinner"></div> Querying all providers...</div>';
  fuseBtn.style.display = 'none';
  document.getElementById('fused-box').style.display = 'none';

  try {
    const results = await sendMsg({ action: 'compareProviders', text, template: currentTemplate, tone: document.getElementById('select-tone').value, length: currentLength });
    if (results.error) { div.innerHTML = `<div class="compare-card"><div class="compare-error">${esc(results.error)}</div></div>`; return; }
    lastCompareResults = results;
    div.innerHTML = '';
    const successCount = results.filter(r => r.success).length;

    results.forEach((r, i) => {
      const card = document.createElement('div'); card.className = 'compare-card';
      if (r.success) {
        card.innerHTML = `
          <div class="compare-head"><span class="compare-provider">${esc(r.providerName || r.provider)}</span><span class="compare-meta">${esc(r.model)} - ${(r.elapsed/1000).toFixed(1)}s | ${r.wordCount}w</span></div>
          <div class="compare-body">${esc(r.answer)}</div>
          <div class="compare-actions"><button data-idx="${i}">Copy</button><button class="use-btn" data-idx="${i}">Use This</button></div>`;
      } else {
        card.innerHTML = `<div class="compare-head"><span class="compare-provider">${esc(r.provider || '?')}</span></div><div class="compare-error">${esc(r.error)}</div>`;
      }
      div.appendChild(card);
    });

    if (successCount >= 2) fuseBtn.style.display = 'block';

    div.querySelectorAll('.compare-actions button:not(.use-btn)').forEach(b => {
      b.addEventListener('click', async () => { const idx = parseInt(b.dataset.idx); if (results[idx]?.answer) { await copyClip(results[idx].answer); notify('Copied!'); } });
    });
    div.querySelectorAll('.use-btn').forEach(b => {
      b.addEventListener('click', () => {
        const idx = parseInt(b.dataset.idx);
        if (results[idx]?.answer) { currentAnswer = results[idx].answer; document.getElementById('answer-content').textContent = currentAnswer; document.getElementById('answer-meta').textContent = `${results[idx].providerName} / ${results[idx].model}`; document.getElementById('answer-box').classList.add('visible'); switchTab('generate'); notify('Answer selected'); }
      });
    });
    loadStats();
  } catch (err) {
    div.innerHTML = `<div class="compare-card"><div class="compare-error">${esc(err.message)}</div></div>`;
  } finally { btn.disabled = false; btn.textContent = 'Battle All AIs'; }
}

// ── Fuse Answers ────────────────────────────────────────────
async function fuseAnswers() {
  const text = document.getElementById('compare-text').value.trim();
  const successful = lastCompareResults.filter(r => r.success);
  if (successful.length < 2) return notify('Need at least 2 answers to fuse', 'error');

  const fuseBtn = document.getElementById('btn-fuse-answers');
  fuseBtn.disabled = true; fuseBtn.textContent = 'Fusing...';

  try {
    const result = await sendMsg({ action: 'answerFusion', text, answers: successful });
    if (result.error) { notify(result.error, 'error'); return; }
    document.getElementById('fused-content').textContent = result.answer;
    document.getElementById('fused-box').style.display = 'block';
    document.getElementById('fused-box').classList.add('visible');
  } catch (err) { notify(err.message, 'error'); }
  finally { fuseBtn.disabled = false; fuseBtn.textContent = 'Fuse'; }
}

// ── Multi-Persona ───────────────────────────────────────────
async function runPersonas() {
  const text = document.getElementById('personas-text').value.trim();
  if (!text) return notify('Enter text first', 'error');

  const selected = [...document.querySelectorAll('#persona-selector .chip.active')].map(c => c.dataset.persona);
  if (selected.length === 0) return notify('Select at least one persona', 'error');

  const div = document.getElementById('personas-results');
  const btn = document.getElementById('btn-run-personas');
  btn.disabled = true; btn.textContent = 'Running...';
  div.innerHTML = '<div class="loading"><div class="spinner"></div> Generating from each persona...</div>';

  try {
    const results = await sendMsg({ action: 'multiPersona', text, template: currentTemplate, personas: selected });
    if (results.error) { div.innerHTML = `<div class="compare-error">${esc(results.error)}</div>`; return; }
    div.innerHTML = '';
    results.forEach(r => {
      const card = document.createElement('div'); card.className = 'compare-card persona-card';
      if (r.success) {
        card.innerHTML = `<div class="compare-head"><span class="compare-provider">${esc(r.personaName)}</span><span class="compare-meta">${r.wordCount}w</span></div><div class="compare-body">${esc(r.answer)}</div><div class="compare-actions"><button class="copy-persona">Copy</button><button class="use-btn use-persona">Use This</button></div>`;
        card.querySelector('.copy-persona').addEventListener('click', async () => { await copyClip(r.answer); notify('Copied!'); });
        card.querySelector('.use-persona').addEventListener('click', () => { currentAnswer = r.answer; document.getElementById('answer-content').textContent = currentAnswer; document.getElementById('answer-meta').textContent = `Persona: ${r.personaName}`; document.getElementById('answer-box').classList.add('visible'); switchTab('generate'); notify('Answer selected'); });
      } else {
        card.innerHTML = `<div class="compare-head"><span class="compare-provider">${esc(r.persona)}</span></div><div class="compare-error">${esc(r.error)}</div>`;
      }
      div.appendChild(card);
    });
    loadStats();
  } catch (err) { div.innerHTML = `<div class="compare-error">${esc(err.message)}</div>`; }
  finally { btn.disabled = false; btn.textContent = 'Run Multi-Persona'; }
}

// ── Devil's Advocate ────────────────────────────────────────
async function runDevilsAdvocate() {
  if (!currentAnswer || !lastInputText) return notify('Generate an answer first', 'error');
  const box = document.getElementById('critique-box');
  const content = document.getElementById('critique-content');
  box.style.display = 'block';
  content.innerHTML = '<div class="loading"><div class="spinner"></div> Analyzing...</div>';

  try {
    const result = await sendMsg({ action: 'devilsAdvocate', text: lastInputText, answer: currentAnswer });
    if (result.error) { content.textContent = result.error; return; }
    content.style.whiteSpace = 'pre-wrap';
    content.textContent = result.critique;
  } catch (err) { content.textContent = err.message; }
}

// ── History ─────────────────────────────────────────────────
async function loadHistory() {
  const search = document.getElementById('history-search')?.value?.toLowerCase() || '';
  const provFilter = document.getElementById('history-filter-provider')?.value || '';
  const templFilter = document.getElementById('history-filter-template')?.value || '';
  const list = document.getElementById('history-list');

  try {
    const history = await sendMsg({ action: 'getHistory' });
    if (!history?.length) { list.innerHTML = '<div class="hist-empty">No history yet</div>'; return; }

    let filtered = history;
    if (search) filtered = filtered.filter(h => h.text?.toLowerCase().includes(search) || h.answer?.toLowerCase().includes(search));
    if (provFilter) filtered = filtered.filter(h => h.provider === provFilter);
    if (templFilter) filtered = filtered.filter(h => h.template === templFilter);

    if (!filtered.length) { list.innerHTML = '<div class="hist-empty">No matches</div>'; return; }
    list.innerHTML = '';
    filtered.slice(0, 50).forEach(item => {
      const d = document.createElement('div'); d.className = 'hist-item';
      d.innerHTML = `<div class="hist-q">${esc(item.text || '')}</div><div class="hist-a">${esc((item.answer || '').substring(0, 100))}</div><div class="hist-foot"><span>${item.provider || '-'} / ${item.template || '-'}</span><span>${item.wordCount || '?'}w | ${fmtTime(item.timestamp)}</span></div>`;
      d.addEventListener('click', () => {
        document.getElementById('input-text').value = item.text || '';
        currentAnswer = item.answer || '';
        document.getElementById('answer-content').textContent = currentAnswer;
        document.getElementById('answer-meta').textContent = `${item.provider} / ${item.model} (history)`;
        document.getElementById('answer-footer').textContent = `${item.wordCount || '?'} words | ${item.tone || '-'} tone`;
        document.getElementById('answer-box').classList.add('visible');
        switchTab('generate');
      });
      list.appendChild(d);
    });
  } catch { list.innerHTML = '<div class="hist-empty">Could not load history</div>'; }
}

async function exportHistory() {
  try {
    const history = await sendMsg({ action: 'getHistory' });
    const blob = new Blob([JSON.stringify(history, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `aether-history-${new Date().toISOString().split('T')[0]}.json`;
    a.click(); URL.revokeObjectURL(url); notify('History exported');
  } catch { notify('Export failed', 'error'); }
}

// ── Helpers ─────────────────────────────────────────────────
function switchTab(name) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  document.querySelector(`[data-tab="${name}"]`)?.classList.add('active');
  document.getElementById(`tab-${name}`)?.classList.add('active');
}
function sendMsg(msg) {
  return new Promise((resolve, reject) => {
    try { chrome.runtime.sendMessage(msg, r => { if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message)); else resolve(r); }); } catch (e) { reject(e); }
  });
}
async function copyClip(text) {
  try { await navigator.clipboard.writeText(text); } catch { const t = document.createElement('textarea'); t.value = text; t.style.cssText = 'position:fixed;left:-9999px'; document.body.appendChild(t); t.select(); document.execCommand('copy'); document.body.removeChild(t); }
}
function esc(s) { const d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML; }
function fmtTime(ts) {
  if (!ts) return '';
  const diff = Date.now() - ts;
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return new Date(ts).toLocaleDateString();
}
// ── Undo/Redo Stack ────────────────────────────────────────
const answerStack = [];
let answerStackIdx = -1;
function pushToStack(answer) {
  answerStack.splice(answerStackIdx + 1);
  answerStack.push(answer);
  answerStackIdx = answerStack.length - 1;
  if (answerStack.length > 20) { answerStack.shift(); answerStackIdx--; }
}
function undoAnswer() {
  if (answerStackIdx > 0) { answerStackIdx--; currentAnswer = answerStack[answerStackIdx]; document.getElementById('answer-content').textContent = currentAnswer; notify('Undo'); }
}
function redoAnswer() {
  if (answerStackIdx < answerStack.length - 1) { answerStackIdx++; currentAnswer = answerStack[answerStackIdx]; document.getElementById('answer-content').textContent = currentAnswer; notify('Redo'); }
}

// ── Application Tracker ────────────────────────────────────
async function loadApplications() {
  const list = document.getElementById('apps-list');
  if (!list) return;
  try {
    const apps = await sendMsg({ action: 'getApplications' });
    if (!apps?.length) { list.innerHTML = '<div class="hist-empty">No tracked applications yet</div>'; return; }
    list.innerHTML = '';
    const statusColors = { saved: 'var(--text-3)', applied: 'var(--accent)', interview: 'var(--amber)', offer: 'var(--green)', rejected: 'var(--red)' };
    apps.forEach(app => {
      const d = document.createElement('div'); d.className = 'hist-item';
      d.innerHTML = `<div class="hist-q">${esc(app.company)} - ${esc(app.role)}</div><div class="hist-a"><span style="color:${statusColors[app.status] || 'var(--text-3)'}; font-weight:600; text-transform:uppercase; font-size:10px;">${esc(app.status)}</span>${app.url ? ` | <a href="${esc(app.url)}" target="_blank" style="color:var(--accent-hover);font-size:11px;">Link</a>` : ''}</div><div class="hist-foot"><span>${fmtTime(app.createdAt)}</span><button class="btn-outline btn-sm del-app-btn" data-app-id="${app.id}" style="padding:2px 8px;font-size:10px;">Delete</button></div>`;
      list.appendChild(d);
    });
    list.querySelectorAll('.del-app-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => { e.stopPropagation(); await sendMsg({ action: 'deleteApplication', appId: btn.dataset.appId }); loadApplications(); notify('Deleted'); });
    });
  } catch { list.innerHTML = '<div class="hist-empty">Could not load applications</div>'; }
}

// ── Fit Score ──────────────────────────────────────────────
async function runFitScore() {
  const text = document.getElementById('input-text')?.value?.trim() || document.getElementById('compare-text')?.value?.trim();
  if (!text) return notify('Enter a job description in the Generate tab first', 'error');
  const box = document.getElementById('fit-score-box');
  const content = document.getElementById('fit-score-content');
  box.style.display = 'block'; box.classList.add('visible');
  content.innerHTML = '<div class="loading"><div class="spinner"></div> Calculating fit...</div>';
  try {
    const result = await sendMsg({ action: 'fitScore', jobDescription: text });
    if (result.error) { content.textContent = result.error; return; }
    let html = `<div style="text-align:center;margin-bottom:12px;"><span style="font-size:32px;font-weight:700;color:${result.score >= 70 ? 'var(--green)' : result.score >= 40 ? 'var(--amber)' : 'var(--red)'};">${result.score}%</span><div style="font-size:11px;color:var(--text-3);">Match Score</div></div>`;
    if (result.matchedSkills?.length) html += `<div style="margin-bottom:8px;"><strong style="font-size:11px;color:var(--green);">Matched:</strong><span style="font-size:12px;color:var(--text-2);"> ${result.matchedSkills.join(', ')}</span></div>`;
    if (result.missingSkills?.length) html += `<div style="margin-bottom:8px;"><strong style="font-size:11px;color:var(--red);">Missing:</strong><span style="font-size:12px;color:var(--text-2);"> ${result.missingSkills.join(', ')}</span></div>`;
    if (result.tips?.length) html += `<div><strong style="font-size:11px;color:var(--accent-hover);">Tips:</strong><ul style="padding-left:16px;margin-top:4px;">${result.tips.map(t => `<li style="font-size:12px;color:var(--text-2);margin-bottom:2px;">${esc(t)}</li>`).join('')}</ul></div>`;
    content.innerHTML = html;
  } catch (err) { content.textContent = err.message; }
}

// ── Gamification Badges ────────────────────────────────────
async function loadBadges() {
  try {
    const data = await sendMsg({ action: 'getGamification' });
    const summary = document.getElementById('badge-summary');
    const grid = document.getElementById('badge-grid');
    if (!summary || !grid) return;
    summary.innerHTML = `<div style="text-align:center;padding:12px 0;"><span style="font-size:28px;font-weight:700;color:var(--accent-hover);">${data.totalEarned}</span><span style="font-size:14px;color:var(--text-3);"> / ${data.totalPossible} badges earned</span><div style="height:4px;background:var(--bg-3);border-radius:2px;margin-top:8px;"><div style="height:100%;background:var(--accent);border-radius:2px;width:${Math.round((data.totalEarned/data.totalPossible)*100)}%;transition:width 0.3s;"></div></div></div>`;
    grid.innerHTML = '';
    data.badges.forEach(b => {
      const card = document.createElement('div');
      card.style.cssText = `display:flex;align-items:center;gap:10px;padding:10px 12px;border:1px solid ${b.earned ? 'var(--accent-border)' : 'var(--border)'};border-radius:var(--radius-sm);margin-bottom:6px;background:${b.earned ? 'var(--accent-dim)' : 'var(--bg-2)'};opacity:${b.earned ? '1' : '0.5'};`;
      card.innerHTML = `<div style="width:32px;height:32px;border-radius:50%;background:${b.earned ? 'linear-gradient(135deg,#6366f1,#4f46e5)' : 'var(--bg-3)'};display:flex;align-items:center;justify-content:center;flex-shrink:0;"><svg viewBox="0 0 24 24" fill="none" stroke="${b.earned ? '#fff' : 'var(--text-3)'}" stroke-width="2" width="16" height="16"><path d="M6 9H4.5a2.5 2.5 0 010-5H6"/><path d="M18 9h1.5a2.5 2.5 0 000-5H18"/><path d="M4 22h16"/><path d="M18 2H6v7a6 6 0 1012 0V2z"/></svg></div><div><div style="font-size:12px;font-weight:600;color:${b.earned ? 'var(--text-1)' : 'var(--text-3)'};">${esc(b.name)}</div><div style="font-size:10px;color:var(--text-3);">${esc(b.desc)}</div></div>`;
      grid.appendChild(card);
    });
  } catch {}
}

let _nt;
function notify(msg, type = 'success') {
  clearTimeout(_nt);
  const el = document.getElementById('notification');
  el.textContent = msg; el.className = `toast visible ${type}`;
  _nt = setTimeout(() => { el.className = 'toast'; }, 2500);
}
