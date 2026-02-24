/* ============================================================
   Aether - Options Page Script v2.0
   ============================================================ */

const PROVIDERS = {
  groq: { name: 'Groq (FREE)', keyUrl: 'https://console.groq.com/keys', placeholder: 'gsk_...' },
  openai: { name: 'OpenAI (ChatGPT)', keyUrl: 'https://platform.openai.com/api-keys', placeholder: 'sk-...' },
  anthropic: { name: 'Anthropic (Claude)', keyUrl: 'https://console.anthropic.com/settings/keys', placeholder: 'sk-ant-...' },
  google: { name: 'Google (Gemini)', keyUrl: 'https://aistudio.google.com/app/apikey', placeholder: 'AIza...' },
};

document.addEventListener('DOMContentLoaded', async () => {
  await loadTheme();
  renderAPIKeyCards();
  renderProviderSelect();
  await loadSettings();
  await loadProfile();
  await loadStarExamples();
  await loadCustomTemplates();
  await loadHistory();
  await loadStats();
  setupEventListeners();
});

// ── Theme ────────────────────────────────────────────────────
async function loadTheme() {
  const { settings } = await chrome.storage.local.get(['settings']);
  applyTheme(settings?.theme || 'system');
  updateThemeButtons(settings?.theme || 'system');
}
function applyTheme(t) {
  if (t === 'light') document.body.setAttribute('data-theme', 'light');
  else if (t === 'dark') document.body.removeAttribute('data-theme');
  else { if (window.matchMedia('(prefers-color-scheme: light)').matches) document.body.setAttribute('data-theme', 'light'); else document.body.removeAttribute('data-theme'); }
}
function updateThemeButtons(t) { document.querySelectorAll('.theme-option').forEach(b => b.classList.toggle('active', b.dataset.theme === t)); }

// ── Stats Dashboard ──────────────────────────────────────────
async function loadStats() {
  const { stats } = await chrome.storage.local.get(['stats']);
  if (!stats) return;
  document.getElementById('stat-total-gen').textContent = stats.totalGenerated || 0;
  document.getElementById('stat-total-compare').textContent = stats.totalCompared || 0;
  const mins = Math.round((stats.totalTimeSaved || 0) / 60);
  document.getElementById('stat-total-time').textContent = mins > 60 ? `${(mins / 60).toFixed(1)}h` : `${mins}m`;
  const words = stats.totalWords || 0;
  document.getElementById('stat-total-words').textContent = words > 1000 ? `${(words / 1000).toFixed(1)}k` : words;
  document.getElementById('stat-current-streak').textContent = stats.streak || 0;
  document.getElementById('stat-first-used').textContent = stats.firstUsedDate ? new Date(stats.firstUsedDate).toLocaleDateString() : '-';
}

// ── API Key Cards ────────────────────────────────────────────
async function renderAPIKeyCards() {
  const { apiKeys } = await chrome.storage.local.get(['apiKeys']);
  const keys = apiKeys || {};
  const container = document.getElementById('api-keys-container');
  container.innerHTML = '';
  for (const [provKey, prov] of Object.entries(PROVIDERS)) {
    const hasKey = !!keys[provKey];
    const card = document.createElement('div'); card.className = 'api-key-card';
    card.innerHTML = `
      <div class="api-key-header"><span class="api-key-name">${prov.name}</span><span class="api-key-status ${hasKey ? 'active' : 'missing'}">${hasKey ? 'Configured' : 'Not Set'}</span></div>
      <div class="api-key-input-row"><input type="password" id="key-${provKey}" value="${keys[provKey] || ''}" placeholder="${prov.placeholder}" /><button class="btn btn-sm btn-secondary toggle-visibility" data-target="key-${provKey}">Show</button><button class="btn btn-sm btn-primary save-key-btn" data-provider="${provKey}">Save</button></div>
      <a href="${prov.keyUrl}" target="_blank" class="api-key-link">Get your ${prov.name.split('(')[0].trim()} API key</a>`;
    container.appendChild(card);
  }
  container.querySelectorAll('.toggle-visibility').forEach(btn => {
    btn.addEventListener('click', () => { const inp = document.getElementById(btn.dataset.target); inp.type = inp.type === 'password' ? 'text' : 'password'; btn.textContent = inp.type === 'password' ? 'Show' : 'Hide'; });
  });
  container.querySelectorAll('.save-key-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const prov = btn.dataset.provider;
      const val = document.getElementById(`key-${prov}`).value.trim();
      const { apiKeys } = await chrome.storage.local.get(['apiKeys']);
      const keys = apiKeys || {};
      if (val) keys[prov] = val; else delete keys[prov];
      await chrome.storage.local.set({ apiKeys: keys });
      renderAPIKeyCards(); notify('API key saved');
    });
  });
}

function renderProviderSelect() {
  const sel = document.getElementById('setting-default-provider');
  sel.innerHTML = '';
  for (const [key, prov] of Object.entries(PROVIDERS)) {
    const opt = document.createElement('option'); opt.value = key; opt.textContent = prov.name; sel.appendChild(opt);
  }
}

// ── Load Settings ────────────────────────────────────────────
async function loadSettings() {
  const { settings } = await chrome.storage.local.get(['settings']);
  if (!settings) return;
  if (settings.defaultProvider) document.getElementById('setting-default-provider').value = settings.defaultProvider;
  if (settings.defaultPersona) document.getElementById('setting-default-persona').value = settings.defaultPersona;
  if (settings.defaultTone) document.getElementById('setting-default-tone').value = settings.defaultTone;
  if (settings.defaultTemplate) document.getElementById('setting-default-template').value = settings.defaultTemplate;
  if (settings.readingLevel) document.getElementById('setting-reading-level').value = settings.readingLevel;
  if (settings.creativityLevel !== undefined) {
    document.getElementById('setting-creativity').value = settings.creativityLevel;
    document.getElementById('creativity-display').textContent = settings.creativityLevel + '%';
  }
  if (settings.maxHistoryItems) document.getElementById('setting-max-history').value = settings.maxHistoryItems.toString();
  document.getElementById('setting-floating-toolbar').checked = settings.showFloatingToolbar !== false;
  document.getElementById('setting-keyboard-shortcuts').checked = settings.enableKeyboardShortcuts !== false;
  document.getElementById('setting-context-detection').checked = settings.enableContextDetection !== false;
  document.getElementById('setting-sensitive-masking').checked = settings.enableSensitiveMasking !== false;
  document.getElementById('setting-auto-star').checked = settings.enableAutoSTAR !== false;
  document.getElementById('setting-private-mode').checked = settings.privateMode === true;
  updateThemeButtons(settings.theme || 'system');
}

// ── Load Profile ─────────────────────────────────────────────
async function loadProfile() {
  const { profile } = await chrome.storage.local.get(['profile']);
  if (!profile) return;
  const fields = ['name', 'title', 'skills', 'experience', 'education', 'achievements', 'bio', 'industries', 'certifications'];
  fields.forEach(f => { const el = document.getElementById(`profile-${f}`); if (el) el.value = profile[f] || ''; });
  if (profile.linkedinUrl) document.getElementById('profile-linkedin').value = profile.linkedinUrl;
  if (profile.portfolioUrl) document.getElementById('profile-portfolio').value = profile.portfolioUrl;
}

// ── STAR Examples ────────────────────────────────────────────
async function loadStarExamples() {
  const { profile } = await chrome.storage.local.get(['profile']);
  const examples = profile?.starExamples || [];
  const container = document.getElementById('star-examples-list');
  container.innerHTML = '';
  if (!examples.length) { container.innerHTML = '<p style="color:var(--text-muted);font-size:13px;margin-bottom:12px;">No STAR examples yet. Add one below!</p>'; return; }
  examples.forEach((ex, i) => {
    const card = document.createElement('div'); card.className = 'star-card';
    card.innerHTML = `
      <div class="star-card-header"><span class="star-badge">${esc(ex.category)}</span><button class="btn btn-danger btn-xs" data-delete-star="${i}">Delete</button></div>
      <div class="star-grid">
        <div><strong>S:</strong> ${esc(ex.situation)}</div>
        <div><strong>T:</strong> ${esc(ex.task)}</div>
        <div><strong>A:</strong> ${esc(ex.action)}</div>
        <div><strong>R:</strong> ${esc(ex.result)}</div>
      </div>`;
    container.appendChild(card);
  });
  container.querySelectorAll('[data-delete-star]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const idx = parseInt(btn.dataset.deleteStar);
      const { profile } = await chrome.storage.local.get(['profile']);
      profile.starExamples.splice(idx, 1);
      await chrome.storage.local.set({ profile });
      loadStarExamples(); notify('STAR example deleted');
    });
  });
}

// ── Custom Templates ─────────────────────────────────────────
async function loadCustomTemplates() {
  const { customTemplates } = await chrome.storage.local.get(['customTemplates']);
  const templates = customTemplates || [];
  const container = document.getElementById('custom-templates-list');
  container.innerHTML = '';
  if (!templates.length) { container.innerHTML = '<p style="color:var(--text-muted);font-size:13px;margin-bottom:12px;">No custom templates yet.</p>'; return; }
  templates.forEach(t => {
    const card = document.createElement('div'); card.className = 'template-card';
    card.innerHTML = `<div class="template-card-header"><strong>${esc(t.name)}</strong><button class="btn btn-danger btn-xs" data-delete-tmpl="${t.id}">Delete</button></div><div class="template-preview">${esc(t.prompt.substring(0, 120))}...</div>`;
    container.appendChild(card);
  });
  container.querySelectorAll('[data-delete-tmpl]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.deleteTmpl;
      const { customTemplates } = await chrome.storage.local.get(['customTemplates']);
      await chrome.storage.local.set({ customTemplates: customTemplates.filter(t => t.id !== id) });
      loadCustomTemplates(); notify('Template deleted');
    });
  });
}

// ── History ──────────────────────────────────────────────────
async function loadHistory() {
  const container = document.getElementById('history-container');
  try {
    const { history } = await chrome.storage.local.get(['history']);
    if (!history?.length) { container.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:20px;">No history yet</p>'; return; }
    let html = '<table class="history-table"><thead><tr><th>Question</th><th>Provider</th><th>Template</th><th>Words</th><th>Time</th></tr></thead><tbody>';
    history.slice(0, 50).forEach(item => {
      html += `<tr><td class="truncate" title="${escAttr(item.text || '')}">${esc((item.text || '').substring(0, 50))}</td><td>${esc(item.provider || '-')}</td><td>${esc(item.template || '-')}</td><td>${item.wordCount || '-'}</td><td>${fmtTime(item.timestamp)}</td></tr>`;
    });
    html += '</tbody></table>';
    container.innerHTML = html;
  } catch { container.innerHTML = '<p style="color:var(--text-muted);">Could not load history</p>'; }
}

// ── Event Listeners ──────────────────────────────────────────
function setupEventListeners() {
  document.getElementById('btn-theme-toggle').addEventListener('click', async () => {
    const { settings } = await chrome.storage.local.get(['settings']);
    const s = settings || {};
    const next = s.theme === 'dark' ? 'light' : s.theme === 'light' ? 'system' : 'dark';
    s.theme = next; await chrome.storage.local.set({ settings: s }); applyTheme(next); updateThemeButtons(next); notify(`Theme: ${next}`);
  });
  document.querySelectorAll('.theme-option').forEach(btn => {
    btn.addEventListener('click', async () => {
      const { settings } = await chrome.storage.local.get(['settings']);
      const s = settings || {}; s.theme = btn.dataset.theme;
      await chrome.storage.local.set({ settings: s }); applyTheme(s.theme); updateThemeButtons(s.theme);
    });
  });
  document.getElementById('setting-creativity').addEventListener('input', (e) => {
    document.getElementById('creativity-display').textContent = e.target.value + '%';
  });

  // Save settings
  document.getElementById('btn-save-settings').addEventListener('click', async () => {
    const { settings } = await chrome.storage.local.get(['settings']);
    const s = settings || {};
    s.defaultProvider = document.getElementById('setting-default-provider').value;
    s.defaultPersona = document.getElementById('setting-default-persona').value;
    s.defaultTone = document.getElementById('setting-default-tone').value;
    s.defaultTemplate = document.getElementById('setting-default-template').value;
    s.readingLevel = document.getElementById('setting-reading-level').value;
    s.creativityLevel = parseInt(document.getElementById('setting-creativity').value);
    s.maxHistoryItems = parseInt(document.getElementById('setting-max-history').value);
    s.showFloatingToolbar = document.getElementById('setting-floating-toolbar').checked;
    s.enableKeyboardShortcuts = document.getElementById('setting-keyboard-shortcuts').checked;
    s.enableContextDetection = document.getElementById('setting-context-detection').checked;
    s.enableSensitiveMasking = document.getElementById('setting-sensitive-masking').checked;
    s.enableAutoSTAR = document.getElementById('setting-auto-star').checked;
    s.privateMode = document.getElementById('setting-private-mode').checked;
    const active = document.querySelector('.theme-option.active');
    if (active) s.theme = active.dataset.theme;
    await chrome.storage.local.set({ settings: s }); notify('Settings saved');
  });

  // Save profile
  document.getElementById('btn-save-profile').addEventListener('click', async () => {
    const { profile: existing } = await chrome.storage.local.get(['profile']);
    const profile = {
      ...(existing || {}),
      name: document.getElementById('profile-name').value.trim(),
      title: document.getElementById('profile-title').value.trim(),
      industries: document.getElementById('profile-industries').value.trim(),
      skills: document.getElementById('profile-skills').value.trim(),
      experience: document.getElementById('profile-experience').value.trim(),
      education: document.getElementById('profile-education').value.trim(),
      certifications: document.getElementById('profile-certifications').value.trim(),
      achievements: document.getElementById('profile-achievements').value.trim(),
      bio: document.getElementById('profile-bio').value.trim(),
      linkedinUrl: document.getElementById('profile-linkedin').value.trim(),
      portfolioUrl: document.getElementById('profile-portfolio').value.trim(),
    };
    await chrome.storage.local.set({ profile }); notify('Profile saved');
  });

  // Add STAR example
  document.getElementById('btn-add-star').addEventListener('click', async () => {
    const cat = document.getElementById('star-category').value.trim();
    const sit = document.getElementById('star-situation').value.trim();
    const task = document.getElementById('star-task').value.trim();
    const act = document.getElementById('star-action').value.trim();
    const res = document.getElementById('star-result').value.trim();
    if (!cat || !sit || !task || !act || !res) return notify('Fill in all STAR fields', 'error');
    const { profile } = await chrome.storage.local.get(['profile']);
    const p = profile || {};
    if (!p.starExamples) p.starExamples = [];
    p.starExamples.push({ category: cat, situation: sit, task, action: act, result: res });
    await chrome.storage.local.set({ profile: p });
    ['star-category', 'star-situation', 'star-task', 'star-action', 'star-result'].forEach(id => document.getElementById(id).value = '');
    loadStarExamples(); notify('STAR example added');
  });

  // Add custom template
  document.getElementById('btn-add-template').addEventListener('click', async () => {
    const name = document.getElementById('tmpl-name').value.trim();
    const prompt = document.getElementById('tmpl-prompt').value.trim();
    if (!name || !prompt) return notify('Fill in template name and prompt', 'error');
    const { customTemplates } = await chrome.storage.local.get(['customTemplates']);
    const templates = customTemplates || [];
    templates.push({ id: 'custom-' + Date.now().toString(36), name, prompt });
    await chrome.storage.local.set({ customTemplates: templates });
    document.getElementById('tmpl-name').value = '';
    document.getElementById('tmpl-prompt').value = '';
    loadCustomTemplates(); notify('Template added');
  });

  // Clear history
  document.getElementById('btn-clear-history').addEventListener('click', async () => {
    if (confirm('Clear all history?')) { await chrome.storage.local.set({ history: [] }); loadHistory(); notify('History cleared'); }
  });

  // Export
  document.getElementById('btn-export-data').addEventListener('click', async () => {
    const data = await chrome.storage.local.get(null);
    const exportData = { ...data }; delete exportData.apiKeys;
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `aether-backup-${new Date().toISOString().split('T')[0]}.json`; a.click();
    URL.revokeObjectURL(url); notify('Exported (API keys excluded)');
  });

  // Import
  document.getElementById('btn-import-data').addEventListener('change', async (e) => {
    const file = e.target.files[0]; if (!file) return;
    try { const data = JSON.parse(await file.text()); await chrome.storage.local.set(data); notify('Imported. Reloading...'); setTimeout(() => location.reload(), 1000); }
    catch { notify('Invalid file', 'error'); }
  });

  // Reset
  document.getElementById('btn-reset-all').addEventListener('click', async () => {
    if (confirm('Delete ALL data including API keys, profile, and history?')) {
      await chrome.storage.local.clear(); notify('Reset. Reloading...'); setTimeout(() => location.reload(), 1000);
    }
  });
}

// ── Helpers ──────────────────────────────────────────────────
function esc(s) { const d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML; }
function escAttr(s) { return (s || '').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); }
function fmtTime(ts) { return ts ? new Date(ts).toLocaleString() : ''; }
let _nt;
function notify(msg, type = 'success') {
  clearTimeout(_nt);
  const el = document.getElementById('notification');
  el.textContent = msg; el.className = `notification visible ${type}`;
  _nt = setTimeout(() => { el.className = 'notification'; }, 3000);
}
