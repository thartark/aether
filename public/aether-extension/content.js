/* ============================================================
   Aether Content Script v3.0
   Fully reworked toolbar with labeled buttons, instant tooltips,
   2-row layout, richer panel actions, and all features.
   ============================================================ */

(function () {
  'use strict';
  if (window.__aetherInjected) return;
  window.__aetherInjected = true;

  let selectedText = '';
  let activeElement = null;
  let currentAnswer = '';
  let extensionValid = true;

  // ── Inline SVG Icons (replace with Feather from icons/svg/) ──
  const I = {
    sparkle: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.912 5.813a2 2 0 001.275 1.275L21 12l-5.813 1.912a2 2 0 00-1.275 1.275L12 21l-1.912-5.813a2 2 0 00-1.275-1.275L3 12l5.813-1.912a2 2 0 001.275-1.275L12 3z"/></svg>',
    copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>',
    paste: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H9a1 1 0 00-1 1v2c0 .6.4 1 1 1h6c.6 0 1-.4 1-1V3c0-.6-.4-1-1-1z"/><path d="M8 4H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-2"/></svg>',
    columns: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="18" rx="1"/><rect x="14" y="3" width="7" height="18" rx="1"/></svg>',
    summarize: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="21" y1="10" x2="7" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="21" y1="18" x2="7" y2="18"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
    edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>',
    globe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>',
    star: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
    list: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>',
    expand: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>',
    shrink: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="14" y1="10" x2="21" y2="3"/><line x1="3" y1="21" x2="10" y2="14"/></svg>',
    refresh: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
    msg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>',
    shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
    zap: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
    eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',
  };

  // Helper: make a button with instant tooltip
  function btn(action, icon, label, tip, cls) {
    return `<button data-action="${action}" ${cls ? `class="${cls}"` : ''}>${icon}<span class="aether-lbl">${label}</span><span class="aether-tip">${tip}</span></button>`;
  }

  // ── Create Floating Toolbar (2 rows) ──────────────────────
  const toolbar = document.createElement('div');
  toolbar.id = 'aether-toolbar';
  toolbar.innerHTML = `
    <div class="aether-row">
      ${btn('generate', I.sparkle, 'Answer', 'AI-powered answer (Ctrl+Shift+A)', 'aether-primary')}
      <span class="aether-sep"></span>
      ${btn('summarize', I.summarize, 'Summarize', 'Condense into key points')}
      ${btn('improve', I.edit, 'Fix', 'Fix grammar & polish')}
      ${btn('expand', I.expand, 'Expand', 'Add more detail & depth')}
      ${btn('simplify', I.shrink, 'Simplify', 'Make easier to read')}
      ${btn('explain', I.msg, 'Explain', 'Break down & explain clearly')}
    </div>
    <div class="aether-row">
      ${btn('star-method', I.star, 'Story Mode', 'Structure as Situation-Task-Action-Result')}
      ${btn('bullet-points', I.list, 'Bullets', 'Reformat as bullet points')}
      ${btn('translate', I.globe, 'Translate', 'Translate to another language')}
      ${btn('compare', I.columns, 'AI Battle', 'Send to all AIs & compare answers')}
      ${btn('tone-check', I.shield, 'Tone', 'Analyze writing tone & formality')}
      <span class="aether-sep"></span>
      ${btn('copy-text', I.copy, 'Copy', 'Copy selected text to clipboard')}
    </div>
  `;
  document.documentElement.appendChild(toolbar);

  // Add label styling inline (tiny, under icons on secondary buttons)
  const lblStyle = document.createElement('style');
  lblStyle.textContent = `
    #aether-toolbar .aether-lbl { font-size: 10px; opacity: 0.85; }
    #aether-toolbar button.aether-primary .aether-lbl { font-size: 11px; opacity: 1; }
  `;
  document.documentElement.appendChild(lblStyle);

  // ── Create Result Panel ───────────────────────────────────
  const panel = document.createElement('div');
  panel.id = 'aether-result-panel';
  panel.innerHTML = `
    <div class="aether-panel-header">
      <h3>${I.sparkle} Aether</h3>
      <span class="aether-badge" id="aether-provider-badge">-</span>
      <button class="aether-panel-close" id="aether-panel-close">${I.close}</button>
    </div>
    <div class="aether-quick-bar" id="aether-quick-bar">
      <button data-quick="generate" class="aq-active" title="AI Answer">Answer</button>
      <button data-quick="summarize" title="Summarize">Sum</button>
      <button data-quick="improve" title="Fix grammar">Fix</button>
      <button data-quick="expand" title="Expand">Expand</button>
      <button data-quick="simplify" title="Simplify">Simple</button>
      <button data-quick="explain" title="Explain">Explain</button>
      <button data-quick="star-method" title="Story Mode (STAR)">Story</button>
      <button data-quick="bullet-points" title="Bullet points">Bullets</button>
      <button data-quick="translate" title="Translate">Translate</button>
      <button data-quick="compare" title="AI Battle">Battle</button>
      <button data-quick="tone-check" title="Tone analysis">Tone</button>
    </div>
    <div class="aether-panel-body" id="aether-panel-body"></div>
    <div class="aether-panel-actions" id="aether-panel-actions" style="display:none;">
      <button data-panel-action="copy">${I.copy} Copy</button>
      <button data-panel-action="insert" class="aether-btn-primary">${I.paste} Insert</button>
      <button data-panel-action="regenerate">${I.refresh} Redo</button>
      <button data-panel-action="expand-answer">${I.expand} More</button>
      <button data-panel-action="simplify-answer">${I.shrink} Less</button>
      <button data-panel-action="critique">${I.eye} Critique</button>
    </div>
  `;
  document.documentElement.appendChild(panel);

  // ── Create Toast ──────────────────────────────────────────
  const toast = document.createElement('div');
  toast.id = 'aether-toast';
  document.documentElement.appendChild(toast);

  let toastTimer;
  function showToast(message, type = 'success') {
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.className = `aether-visible aether-${type}`;
    toastTimer = setTimeout(() => { toast.className = ''; }, 2500);
  }

  // ── Safe Chrome Messaging ─────────────────────────────────
  function sendMsg(msg) {
    return new Promise((resolve, reject) => {
      if (!extensionValid) { reject(new Error('Extension reloaded. Refresh this page.')); return; }
      try {
        if (!chrome.runtime?.id) { extensionValid = false; reject(new Error('Extension reloaded. Refresh page.')); return; }
        chrome.runtime.sendMessage(msg, (resp) => {
          if (chrome.runtime.lastError) {
            if (chrome.runtime.lastError.message?.includes('invalidated')) extensionValid = false;
            reject(new Error(chrome.runtime.lastError.message || 'Message failed'));
          } else resolve(resp);
        });
      } catch { extensionValid = false; reject(new Error('Extension reloaded. Refresh page.')); }
    });
  }

  // ── Field Helpers ─────────────────────────────────────────
  function getFieldCharLimit(el) {
    if (!el) return 0;
    if (el.maxLength > 0 && el.maxLength < 100000) return el.maxLength;
    const parent = el.closest('.field, .form-group, .question, [class*="field"], [class*="input"]') || el.parentElement;
    if (parent) {
      const txt = parent.textContent;
      const m1 = txt.match(/(\d+)\s*\/\s*(\d+)/); if (m1) return parseInt(m1[2]);
      const m2 = txt.match(/(?:max|limit|maximum)\s*(?:of\s*)?(\d+)\s*(?:char|character|letter)/i); if (m2) return parseInt(m2[1]);
    }
    return 0;
  }

  function getFieldContext(el) {
    if (!el) return '';
    const parts = [];
    if (el.placeholder) parts.push(el.placeholder);
    if (el.name) parts.push(el.name.replace(/[_-]/g, ' '));
    const lbl = document.querySelector(`label[for="${el.id}"]`);
    if (lbl) parts.push(lbl.textContent.trim());
    const aria = el.getAttribute('aria-label');
    if (aria) parts.push(aria);
    return parts.join(' | ');
  }

  function isRequiredField(el) {
    if (!el) return false;
    if (el.required || el.getAttribute('aria-required') === 'true') return true;
    const lbl = el.closest('label') || document.querySelector(`label[for="${el.id}"]`);
    return lbl ? /\*/.test(lbl.textContent) : false;
  }

  // ── Text Selection Handler ────────────────────────────────
  let selectionTimeout;
  document.addEventListener('mouseup', (e) => {
    if (e.target.closest('#aether-toolbar') || e.target.closest('#aether-result-panel')) return;
    clearTimeout(selectionTimeout);
    selectionTimeout = setTimeout(() => {
      const sel = window.getSelection();
      const text = sel?.toString().trim();
      if (text && text.length > 2) {
        selectedText = text;
        activeElement = document.activeElement;
        positionToolbar(sel);
      } else {
        hideToolbar();
      }
    }, 10);
  });

  document.addEventListener('mousedown', (e) => {
    if (!e.target.closest('#aether-toolbar') && !e.target.closest('#aether-result-panel')) hideToolbar();
  });

  // ── Keyboard Shortcuts ────────────────────────────────────
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'A') {
      e.preventDefault();
      const sel = window.getSelection()?.toString().trim();
      if (sel && sel.length > 2) { selectedText = sel; activeElement = document.activeElement; generateInline(sel, 'general'); }
    }
    if (e.key === 'Escape') { hidePanel(); hideToolbar(); }
  });

  // ── Position & Show Toolbar ───────────────────────────────
  function positionToolbar(selection) {
    if (!selection.rangeCount) return;
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    toolbar.classList.add('aether-visible');
    const tbW = toolbar.offsetWidth || 380;
    const tbH = toolbar.offsetHeight || 64;
    let top = window.scrollY + rect.top - tbH - 10;
    let left = window.scrollX + rect.left + (rect.width / 2) - (tbW / 2);
    if (rect.top - tbH - 10 < 0) top = window.scrollY + rect.bottom + 10;
    if (left < window.scrollX + 8) left = window.scrollX + 8;
    if (left + tbW > window.scrollX + window.innerWidth - 8) left = window.scrollX + window.innerWidth - tbW - 8;
    toolbar.style.top = `${top}px`;
    toolbar.style.left = `${left}px`;
  }

  function hideToolbar() { toolbar.classList.remove('aether-visible'); }

  // ── Track last template used for regenerate ───────────────
  let lastTemplate = 'general';
  let lastText = '';

  // ── Toolbar Click Handler ─────────────────────────────────
  toolbar.addEventListener('click', async (e) => {
    const b = e.target.closest('button');
    if (!b || !selectedText) return;
    const action = b.dataset.action;
    if (!action) return;
    hideToolbar();

    switch (action) {
      case 'generate': await generateInline(selectedText, 'general'); break;
      case 'compare': await compareInline(selectedText); break;
      case 'summarize': await generateInline(selectedText, 'summarize'); break;
      case 'improve': await generateInline(selectedText, 'fix-grammar'); break;
      case 'expand': await generateInline(selectedText, 'expand'); break;
      case 'simplify': await generateInline(selectedText, 'simplify'); break;
      case 'explain': await generateInline(selectedText, 'explain'); break;
      case 'star-method': await generateInline(selectedText, 'star-method'); break;
      case 'bullet-points': await generateInline(selectedText, 'bullet-points'); break;
      case 'translate': await generateInline(selectedText, 'translate'); break;
      case 'copy-text': await copyToClipboard(selectedText); showToast('Copied to clipboard'); break;
      case 'tone-check': await toneCheckInline(selectedText); break;
    }
  });

  // ── Quick Bar (in-panel action switcher) ──────────────────
  document.getElementById('aether-quick-bar').addEventListener('click', async (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    const action = b.dataset.quick;
    if (!action) return;
    // Use lastText (the originally selected text) so we can re-run actions
    const text = lastText || selectedText;
    if (!text) { showToast('Select some text first', 'error'); return; }

    // Highlight active button
    document.querySelectorAll('#aether-quick-bar button').forEach(x => x.classList.remove('aq-active'));
    b.classList.add('aq-active');

    switch (action) {
      case 'generate': await generateInline(text, 'general'); break;
      case 'compare': await compareInline(text); break;
      case 'summarize': await generateInline(text, 'summarize'); break;
      case 'improve': await generateInline(text, 'fix-grammar'); break;
      case 'expand': await generateInline(text, 'expand'); break;
      case 'simplify': await generateInline(text, 'simplify'); break;
      case 'explain': await generateInline(text, 'explain'); break;
      case 'star-method': await generateInline(text, 'star-method'); break;
      case 'bullet-points': await generateInline(text, 'bullet-points'); break;
      case 'translate': await generateInline(text, 'translate'); break;
      case 'tone-check': await toneCheckInline(text); break;
    }
  });

  // Also update active quick-bar button when toolbar is used
  function setActiveQuickButton(template) {
    const map = { 'general': 'generate', 'summarize': 'summarize', 'fix-grammar': 'improve', 'expand': 'expand', 'simplify': 'simplify', 'explain': 'explain', 'star-method': 'star-method', 'bullet-points': 'bullet-points', 'translate': 'translate' };
    const qAction = map[template] || 'generate';
    document.querySelectorAll('#aether-quick-bar button').forEach(x => x.classList.remove('aq-active'));
    const target = document.querySelector(`#aether-quick-bar [data-quick="${qAction}"]`);
    if (target) target.classList.add('aq-active');
  }

  // ── Tone Check Inline ────────────────────────────────────
  async function toneCheckInline(text) {
    showPanel();
    setPanelLoading('Analyzing tone...');
    try {
      const result = await sendMsg({ action: 'toneAnalysis', text: text.substring(0, 2000) });
      if (result.error) { setPanelError(result.error); return; }
      const body = document.getElementById('aether-panel-body');
      const fLabel = result.formality >= 7 ? 'Formal' : result.formality >= 4 ? 'Balanced' : 'Casual';
      let html = `<div style="text-align:center;margin-bottom:14px;"><div style="font-size:24px;font-weight:700;color:#a5b4fc;text-transform:capitalize;">${esc(result.primaryTone || 'Unknown')}</div><div style="font-size:12px;color:#777;margin-top:2px;">Primary Tone | ${fLabel} (${result.formality || '?'}/10) | ${esc(result.readability || '?')} readability</div></div>`;
      if (result.tones?.length) {
        html += '<div style="margin-bottom:12px;">';
        result.tones.forEach(t => {
          const w = Math.max(8, Math.min(100, t.score));
          html += `<div style="display:flex;align-items:center;gap:8px;margin-bottom:5px;font-size:12px;"><span style="width:65px;color:#b0b0d0;text-transform:capitalize;">${esc(t.name)}</span><div style="flex:1;height:6px;background:rgba(99,102,241,0.1);border-radius:3px;overflow:hidden;"><div style="height:100%;width:${w}%;background:linear-gradient(90deg,#6366f1,#818cf8);border-radius:3px;"></div></div><span style="color:#777;width:30px;text-align:right;">${t.score}</span></div>`;
        });
        html += '</div>';
      }
      if (result.suggestions?.length) {
        html += '<div style="border-top:1px solid rgba(99,102,241,0.1);padding-top:10px;margin-top:6px;">';
        result.suggestions.forEach(s => { html += `<div style="font-size:12px;color:#a5b4fc;margin-bottom:4px;">&#8226; ${esc(s)}</div>`; });
        html += '</div>';
      }
      body.innerHTML = html;
      document.getElementById('aether-provider-badge').textContent = 'Tone Analysis';
      document.getElementById('aether-panel-actions').style.display = 'none';
    } catch (err) { setPanelError(err.message); }
  }

  // ── Panel Action Bar Handler ──────────────────────────────
  panel.addEventListener('click', async (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.id === 'aether-panel-close') { hidePanel(); return; }
    const action = b.dataset.panelAction;
    if (!action) return;

    switch (action) {
      case 'copy':
        if (currentAnswer) { await copyToClipboard(currentAnswer); showToast('Answer copied'); }
        break;
      case 'insert': {
        if (currentAnswer && activeElement) {
          const limit = getFieldCharLimit(activeElement);
          const text = (limit > 0 && currentAnswer.length > limit) ? currentAnswer.substring(0, limit) : currentAnswer;
          insertIntoField(activeElement, text);
          hidePanel();
          showToast(limit > 0 && currentAnswer.length > limit ? `Inserted (trimmed to ${limit} chars)` : 'Inserted into field');
        } else { showToast('No active text field found', 'error'); }
        break;
      }
      case 'regenerate':
        if (lastText) { await generateInline(lastText, lastTemplate); }
        break;
      case 'expand-answer':
        if (currentAnswer) { await generateInline(currentAnswer, 'expand'); }
        break;
      case 'simplify-answer':
        if (currentAnswer) { await generateInline(currentAnswer, 'simplify'); }
        break;
      case 'critique':
        if (currentAnswer && lastText) { await critiqueInline(lastText, currentAnswer); }
        break;
      case 'copy-compare':
        if (b.dataset.answerText) { await copyToClipboard(b.dataset.answerText); showToast('Copied'); }
        break;
    }
  });

  // ── Generate Inline Answer ────────────────────────────────
  async function generateInline(text, template) {
    showPanel();
    setPanelLoading();
    lastTemplate = template;
    lastText = text;
    setActiveQuickButton(template);

    // Only send charLimit for form fill contexts (general template on a form field),
    // and only when the limit is reasonable (> 100). Never constrain toolbar actions
    // like expand/summarize/etc with a field's maxLength.
    const isFormFill = template === 'general' && activeElement && (activeElement.tagName === 'TEXTAREA' || activeElement.tagName === 'INPUT');
    const rawCharLimit = activeElement ? getFieldCharLimit(activeElement) : 0;
    const charLimit = (isFormFill && rawCharLimit > 100) ? rawCharLimit : 0;

    const fieldCtx = activeElement ? getFieldContext(activeElement) : '';
    let fullText = text;
    if (fieldCtx && fieldCtx.length > 3 && template === 'general') fullText = `[Field: ${fieldCtx}]\n\n${text}`;

    try {
      const result = await sendMsg({ action: 'generateAnswer', text: fullText, template, charLimit, url: window.location.href });
      if (result.error) { setPanelError(result.error); }
      else if (result.sensitive) { setPanelError(result.answer); }
      else {
        currentAnswer = result.answer;
        setPanelContent(result.answer, result.provider, result.model, result.elapsed, result.wordCount, result.charCount, charLimit);
      }
    } catch (err) { setPanelError(err.message || 'Failed. Try reloading the page.'); }
  }

  // ── Compare Inline ────────────────────────────────────────
  async function compareInline(text) {
    showPanel();
    setPanelLoading('Querying all configured AIs...');
    try {
      const results = await sendMsg({ action: 'compareProviders', text, url: window.location.href });
      if (results.error) { setPanelError(results.error); return; }
      const body = document.getElementById('aether-panel-body');
      body.innerHTML = '';
      results.forEach((r) => {
        const card = document.createElement('div');
        card.className = 'aether-compare-card';
        if (r.success) {
          card.innerHTML = `<div class="aether-compare-header"><strong>${esc(r.providerName || r.provider)}</strong><span>${esc(r.model)} | ${(r.elapsed/1000).toFixed(1)}s | ${r.wordCount}w</span></div><div class="aether-compare-body">${esc(r.answer)}</div>`;
          const copyBtn = document.createElement('button');
          copyBtn.className = 'aether-compare-copy';
          copyBtn.textContent = 'Copy';
          copyBtn.dataset.panelAction = 'copy-compare';
          copyBtn.dataset.answerText = r.answer;
          card.appendChild(copyBtn);
        } else {
          card.style.borderColor = 'rgba(239,68,68,0.15)';
          card.innerHTML = `<div class="aether-compare-header"><strong style="color:#fca5a5;">${esc(r.provider || '?')}</strong></div><div style="color:#fca5a5;font-size:12px;">${esc(r.error)}</div>`;
        }
        body.appendChild(card);
      });
      document.getElementById('aether-provider-badge').textContent = `${results.length} AIs`;
      document.getElementById('aether-panel-actions').style.display = 'none';
      currentAnswer = results.find(r => r.success)?.answer || '';
    } catch (err) { setPanelError(err.message); }
  }

  // ── Devil's Advocate Critique ─────────────────────────────
  async function critiqueInline(text, answer) {
    const body = document.getElementById('aether-panel-body');
    const existing = body.innerHTML;
    body.innerHTML += `<div style="margin-top:14px;padding:12px;background:rgba(245,158,11,0.06);border:1px solid rgba(245,158,11,0.15);border-radius:10px;"><div style="color:#fbbf24;font-size:11px;font-weight:600;margin-bottom:6px;">${I.eye} DEVIL'S ADVOCATE</div><div class="aether-loading"><div class="aether-spinner"></div> Analyzing...</div></div>`;
    try {
      const result = await sendMsg({ action: 'devilsAdvocate', text, answer });
      if (result.error) throw new Error(result.error);
      // Replace loading with critique
      const critiqueBox = body.lastElementChild;
      critiqueBox.innerHTML = `<div style="color:#fbbf24;font-size:11px;font-weight:600;margin-bottom:6px;">${I.eye} DEVIL'S ADVOCATE</div><div style="color:#d4d0c8;font-size:13px;line-height:1.6;white-space:pre-wrap;">${esc(result.critique)}</div>`;
    } catch (err) {
      body.lastElementChild.innerHTML = `<div style="color:#fca5a5;font-size:12px;">Critique failed: ${esc(err.message)}</div>`;
    }
  }

  // ── Panel Helpers ─────────────────────────────────────────
  function showPanel() { panel.classList.add('aether-visible'); }
  function hidePanel() { panel.classList.remove('aether-visible'); }

  function setPanelLoading(msg = 'Generating answer...') {
    document.getElementById('aether-panel-body').innerHTML = `<div class="aether-loading"><div class="aether-spinner"></div><span>${msg}</span></div>`;
    document.getElementById('aether-panel-actions').style.display = 'none';
    document.getElementById('aether-provider-badge').textContent = '...';
  }

  function setPanelContent(answer, provider, model, elapsed, wordCount, charCount, charLimit) {
    const body = document.getElementById('aether-panel-body');
    body.innerHTML = '';
    const content = document.createElement('div');
    content.style.cssText = 'white-space:pre-wrap;line-height:1.65;';
    content.textContent = answer;
    body.appendChild(content);

    const meta = document.createElement('div');
    meta.className = 'aether-meta';
    let metaHtml = `<span>${(elapsed/1000).toFixed(1)}s</span><span>${wordCount}w</span><span>${charCount} chars</span>`;
    if (charLimit > 0) {
      metaHtml += charCount > charLimit
        ? `<span class="over">OVER LIMIT (${charLimit})</span>`
        : `<span class="within">within ${charLimit} limit</span>`;
    }
    meta.innerHTML = metaHtml;
    body.appendChild(meta);

    document.getElementById('aether-provider-badge').textContent = `${provider} / ${model}`;
    document.getElementById('aether-panel-actions').style.display = 'flex';
  }

  function setPanelError(msg) {
    document.getElementById('aether-panel-body').innerHTML = `<div class="aether-error">${esc(msg)}</div>`;
    document.getElementById('aether-panel-actions').style.display = 'none';
    document.getElementById('aether-provider-badge').textContent = 'Error';
  }

  // ── Insert Into Field ─────────────────────────────────────
  function insertIntoField(el, text) {
    if (!el) return;
    if (el.tagName === 'TEXTAREA' || (el.tagName === 'INPUT' && ['text','search','url','email'].includes(el.type))) {
      const s = el.selectionStart || 0, e = el.selectionEnd || 0;
      const before = el.value.substring(0, s), after = el.value.substring(e);
      // React-compatible setter
      const setter = Object.getOwnPropertyDescriptor(
        el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype, 'value'
      )?.set;
      if (setter) { setter.call(el, before + text + after); }
      else { el.value = before + text + after; }
      el.selectionStart = el.selectionEnd = s + text.length;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      return;
    }
    if (el.isContentEditable) { document.execCommand('insertText', false, text); return; }
    const editable = document.querySelector('textarea:focus, input[type="text"]:focus, [contenteditable="true"]:focus');
    if (editable) insertIntoField(editable, text);
  }

  // ── Clipboard ─────────────────────────────────────────────
  async function copyToClipboard(text) {
    try { await navigator.clipboard.writeText(text); }
    catch { const ta = document.createElement('textarea'); ta.value = text; ta.style.cssText = 'position:fixed;left:-9999px;'; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta); }
  }

  function esc(str) { const d = document.createElement('div'); d.textContent = str; return d.innerHTML; }

  // ── Per-Site Permission Check ─────────────────────────────
  const siteHost = window.location.hostname;
  (async () => {
    try {
      const r = await sendMsg({ action: 'getSitePermission', site: siteHost });
      if (r && r.allowed === false) { toolbar.remove(); panel.remove(); toast.remove(); return; }
    } catch {}
  })();

  // ── Auto-Save Drafts ─────────────────────────────────────
  const siteKey = siteHost + window.location.pathname;
  let draftTimer;
  function setupDraftAutoSave() {
    document.querySelectorAll('textarea, input[type="text"], input[type="email"], input[type="url"]').forEach(f => {
      const fk = f.name || f.id || f.placeholder || '';
      if (!fk) return;
      sendMsg({ action: 'getDraft', siteKey, fieldKey: fk }).then(d => {
        if (d && d.text && !f.value) {
          f.value = d.text;
          f.dispatchEvent(new Event('input', { bubbles: true }));
          f.style.borderColor = 'rgba(99,102,241,0.3)';
          setTimeout(() => { f.style.borderColor = ''; }, 2000);
        }
      }).catch(() => {});
      f.addEventListener('input', () => {
        clearTimeout(draftTimer);
        draftTimer = setTimeout(() => {
          if (f.value.trim().length > 10) sendMsg({ action: 'saveDraft', siteKey, fieldKey: fk, text: f.value }).catch(() => {});
        }, 3000);
      });
    });
  }
  setTimeout(setupDraftAutoSave, 2000);

  // ── Duplicate Detection ───────────────────────────────────
  const jobPatterns = ['careers','jobs','apply','workday','greenhouse','lever.co','icims'];
  function checkForDuplicate() {
    sendMsg({ action: 'getApplications' }).then(apps => {
      if (!apps?.length) return;
      const url = window.location.href.toLowerCase(), title = document.title.toLowerCase();
      const match = apps.find(a => {
        if (a.url && url.includes(a.url.toLowerCase().replace(/https?:\/\//, '').split('/')[0])) return true;
        return a.company && title.includes(a.company.toLowerCase());
      });
      if (match) showToast(`You may have already applied: ${match.company} (${match.status})`, 'error');
    }).catch(() => {});
  }
  if (jobPatterns.some(p => window.location.href.toLowerCase().includes(p))) {
    setTimeout(checkForDuplicate, 3000);
  }

  // ── Question Difficulty Badges ────────────────────────────
  function addDifficultyBadges() {
    document.querySelectorAll('textarea, input[type="text"]').forEach(f => {
      const ctx = getFieldContext(f);
      if (!ctx || ctx.length < 10) return;
      sendMsg({ action: 'questionDifficulty', text: ctx }).then(r => {
        if (!r || r.difficulty === 'easy') return;
        const badge = document.createElement('span');
        badge.style.cssText = `display:inline-block;padding:2px 7px;border-radius:4px;font-size:10px;font-weight:600;margin-left:6px;${r.difficulty === 'hard' ? 'background:rgba(239,68,68,0.1);color:#ef4444;' : 'background:rgba(245,158,11,0.1);color:#f59e0b;'}`;
        badge.textContent = r.difficulty.toUpperCase();
        badge.title = r.tips?.join('. ') || '';
        const lbl = f.closest('label') || document.querySelector(`label[for="${f.id}"]`);
        if (lbl && !lbl.querySelector('[data-aether-d]')) { badge.setAttribute('data-aether-d', '1'); lbl.appendChild(badge); }
      }).catch(() => {});
    });
  }
  if (jobPatterns.some(p => window.location.href.toLowerCase().includes(p))) setTimeout(addDifficultyBadges, 4000);

  // ── Message Listener ──────────────────────────────────────
  try {
    chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
      try {
        if (msg.action === 'getSelectedText') {
          sendResponse({ text: selectedText || window.getSelection()?.toString().trim() || '', charLimit: activeElement ? getFieldCharLimit(activeElement) : 0, fieldContext: activeElement ? getFieldContext(activeElement) : '' });
        }
        if (msg.action === 'generate-answer') { const t = selectedText || window.getSelection()?.toString().trim(); if (t) generateInline(t, 'general'); sendResponse({ ok: true }); }
        if (msg.action === 'toggle-toolbar') { if (toolbar.classList.contains('aether-visible')) hideToolbar(); else { const s = window.getSelection(); if (s?.toString().trim()) positionToolbar(s); } sendResponse({ ok: true }); }
        if (msg.action === 'showInlineResult') { selectedText = msg.text; generateInline(msg.text, msg.template || 'general'); sendResponse({ ok: true }); }
        if (msg.action === 'showCompareResult') { selectedText = msg.text; compareInline(msg.text); sendResponse({ ok: true }); }
        if (msg.action === 'showPersonasResult') { selectedText = msg.text; generateInline(msg.text, 'general'); sendResponse({ ok: true }); }
        if (msg.action === 'insertAnswer') { const t = document.activeElement; if (t) { insertIntoField(t, msg.answer); showToast('Inserted'); } sendResponse({ ok: true }); }
      } catch {}
    });
  } catch { extensionValid = false; }
})();
