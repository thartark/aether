/* ============================================================
   Aether - Content Script v2.0
   Text selection, floating toolbar, inline results, field
   detection, form analysis, character limits, smart insert
   ============================================================ */

(function () {
  'use strict';
  if (window.__aetherInjected) return;
  window.__aetherInjected = true;

  let selectedText = '';
  let activeElement = null;
  let currentAnswer = '';
  let extensionValid = true;

  // ── SVG Icons ──────────────────────────────────────────────
  const ICONS = {
    sparkle: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.912 5.813a2 2 0 001.275 1.275L21 12l-5.813 1.912a2 2 0 00-1.275 1.275L12 21l-1.912-5.813a2 2 0 00-1.275-1.275L3 12l5.813-1.912a2 2 0 001.275-1.275L12 3z"/></svg>',
    copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>',
    paste: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H9a1 1 0 00-1 1v2c0 .6.4 1 1 1h6c.6 0 1-.4 1-1V3c0-.6-.4-1-1-1z"/><path d="M8 4H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-2"/></svg>',
    compare: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="9" rx="1"/><path d="M3 16h7v5H3z"/><path d="M14 16h7v5h-7z"/></svg>',
    summarize: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="21" y1="10" x2="7" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="21" y1="18" x2="7" y2="18"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
    improve: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>',
    translate: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 8l6 6"/><path d="M4 14l6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="M22 22l-5-10-5 10"/><path d="M14 18h6"/></svg>',
    star: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
    bullets: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>',
  };

  // ── Create Floating Toolbar ────────────────────────────────
  const toolbar = document.createElement('div');
  toolbar.id = 'aether-toolbar';
  toolbar.innerHTML = `
    <button class="aether-primary" data-action="generate" title="Generate Answer (Ctrl+Shift+A)">${ICONS.sparkle} Answer</button>
    <div class="aether-divider"></div>
    <button data-action="summarize" title="Summarize">${ICONS.summarize}</button>
    <button data-action="improve" title="Improve writing">${ICONS.improve}</button>
    <button data-action="star-method" title="STAR Method">${ICONS.star}</button>
    <button data-action="bullet-points" title="Bullet Points">${ICONS.bullets}</button>
    <button data-action="translate" title="Translate">${ICONS.translate}</button>
    <button data-action="compare" title="Compare AI models">${ICONS.compare}</button>
    <button data-action="copy-text" title="Copy">${ICONS.copy}</button>
  `;
  document.documentElement.appendChild(toolbar);

  // ── Create Result Panel ────────────────────────────────────
  const panel = document.createElement('div');
  panel.id = 'aether-result-panel';
  panel.innerHTML = `
    <div class="aether-panel-header">
      <h3>${ICONS.sparkle} Aether</h3>
      <span class="aether-badge" id="aether-provider-badge">-</span>
      <button class="aether-panel-close" id="aether-panel-close">${ICONS.close}</button>
    </div>
    <div class="aether-panel-body" id="aether-panel-body"></div>
    <div class="aether-panel-actions" id="aether-panel-actions" style="display:none;">
      <button data-panel-action="copy">${ICONS.copy} Copy</button>
      <button data-panel-action="insert" class="aether-btn-primary">${ICONS.paste} Insert</button>
    </div>
  `;
  document.documentElement.appendChild(panel);

  // ── Create Toast ───────────────────────────────────────────
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

  // ── Safe Chrome Messaging ──────────────────────────────────
  function sendMsg(msg) {
    return new Promise((resolve, reject) => {
      if (!extensionValid) { reject(new Error('Extension reloaded. Refresh this page.')); return; }
      try {
        if (!chrome.runtime?.id) { extensionValid = false; reject(new Error('Extension reloaded. Refresh this page.')); return; }
        chrome.runtime.sendMessage(msg, (response) => {
          if (chrome.runtime.lastError) {
            if (chrome.runtime.lastError.message?.includes('invalidated')) extensionValid = false;
            reject(new Error(chrome.runtime.lastError.message || 'Message failed'));
          } else resolve(response);
        });
      } catch { extensionValid = false; reject(new Error('Extension reloaded. Refresh this page.')); }
    });
  }

  // ── Character Limit Detection ──────────────────────────────
  function getFieldCharLimit(element) {
    if (!element) return 0;
    if (element.maxLength && element.maxLength > 0 && element.maxLength < 100000) return element.maxLength;
    // Check for nearby counter text like "0/500"
    const parent = element.closest('.field, .form-group, .question, [class*="field"], [class*="input"]') || element.parentElement;
    if (parent) {
      const text = parent.textContent;
      const match = text.match(/(\d+)\s*\/\s*(\d+)/);
      if (match) return parseInt(match[2]);
      const charMatch = text.match(/(?:max|limit|maximum)\s*(?:of\s*)?(\d+)\s*(?:char|character|letter)/i);
      if (charMatch) return parseInt(charMatch[1]);
    }
    return 0;
  }

  // ── Required Field Detection ───────────────────────────────
  function isRequiredField(element) {
    if (!element) return false;
    if (element.required) return true;
    if (element.getAttribute('aria-required') === 'true') return true;
    const label = element.closest('label') || document.querySelector(`label[for="${element.id}"]`);
    if (label && /\*/.test(label.textContent)) return true;
    return false;
  }

  // ── Get Field Context (label/placeholder) ──────────────────
  function getFieldContext(element) {
    if (!element) return '';
    const parts = [];
    if (element.placeholder) parts.push(element.placeholder);
    if (element.name) parts.push(element.name.replace(/[_-]/g, ' '));
    const label = document.querySelector(`label[for="${element.id}"]`);
    if (label) parts.push(label.textContent.trim());
    const ariaLabel = element.getAttribute('aria-label');
    if (ariaLabel) parts.push(ariaLabel);
    return parts.join(' | ');
  }

  // ── Text Selection Handler ─────────────────────────────────
  document.addEventListener('mouseup', (e) => {
    if (e.target.closest('#aether-toolbar') || e.target.closest('#aether-result-panel')) return;
    setTimeout(() => {
      const selection = window.getSelection();
      const text = selection?.toString().trim();
      if (text && text.length > 2) {
        selectedText = text;
        activeElement = document.activeElement;
        positionToolbar(selection);
      } else {
        hideToolbar();
      }
    }, 10);
  });

  document.addEventListener('mousedown', (e) => {
    if (!e.target.closest('#aether-toolbar') && !e.target.closest('#aether-result-panel')) hideToolbar();
  });

  // ── Keyboard Shortcuts ─────────────────────────────────────
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'A') {
      e.preventDefault();
      const sel = window.getSelection()?.toString().trim();
      if (sel && sel.length > 2) { selectedText = sel; activeElement = document.activeElement; generateInline(sel, 'general'); }
    }
    // Escape to close panel
    if (e.key === 'Escape') { hidePanel(); hideToolbar(); }
  });

  // ── Position Toolbar ───────────────────────────────────────
  function positionToolbar(selection) {
    if (!selection.rangeCount) return;
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    toolbar.classList.add('aether-visible');
    const tbW = toolbar.offsetWidth || 320;
    const tbH = toolbar.offsetHeight || 38;
    let top = window.scrollY + rect.top - tbH - 10;
    let left = window.scrollX + rect.left + (rect.width / 2) - (tbW / 2);
    if (rect.top - tbH - 10 < 0) top = window.scrollY + rect.bottom + 10;
    if (left < window.scrollX + 8) left = window.scrollX + 8;
    if (left + tbW > window.scrollX + window.innerWidth - 8) left = window.scrollX + window.innerWidth - tbW - 8;
    toolbar.style.top = `${top}px`;
    toolbar.style.left = `${left}px`;
  }

  function hideToolbar() { toolbar.classList.remove('aether-visible'); }

  // ── Toolbar Actions ────────────────────────────────────────
  toolbar.addEventListener('click', async (e) => {
    const btn = e.target.closest('button');
    if (!btn || !selectedText) return;
    const action = btn.dataset.action;
    if (!action) return;
    hideToolbar();

    switch (action) {
      case 'generate': await generateInline(selectedText, 'general'); break;
      case 'compare': await compareInline(selectedText); break;
      case 'summarize': await generateInline(selectedText, 'summarize'); break;
      case 'improve': await generateInline(selectedText, 'fix-grammar'); break;
      case 'star-method': await generateInline(selectedText, 'star-method'); break;
      case 'bullet-points': await generateInline(selectedText, 'bullet-points'); break;
      case 'translate': await generateInline(selectedText, 'translate'); break;
      case 'copy-text': await copyToClipboard(selectedText); showToast('Copied'); break;
    }
  });

  // ── Panel Actions ──────────────────────────────────────────
  panel.addEventListener('click', async (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    if (btn.id === 'aether-panel-close') { hidePanel(); return; }
    const action = btn.dataset.panelAction;
    if (!action) return;
    switch (action) {
      case 'copy':
        if (currentAnswer) { await copyToClipboard(currentAnswer); showToast('Answer copied'); }
        break;
      case 'insert':
        if (currentAnswer && activeElement) {
          const charLimit = getFieldCharLimit(activeElement);
          const textToInsert = (charLimit > 0 && currentAnswer.length > charLimit) ? currentAnswer.substring(0, charLimit) : currentAnswer;
          insertIntoField(activeElement, textToInsert);
          hidePanel();
          showToast(charLimit > 0 && currentAnswer.length > charLimit ? `Inserted (trimmed to ${charLimit} chars)` : 'Inserted');
        } else { showToast('No active text field found', 'error'); }
        break;
      case 'copy-compare':
        if (btn.dataset.answerText) { await copyToClipboard(btn.dataset.answerText); showToast('Copied'); }
        break;
    }
  });

  // ── Generate Inline Answer ─────────────────────────────────
  async function generateInline(text, template) {
    showPanel();
    setPanelLoading();

    // Detect char limit from active field
    const charLimit = activeElement ? getFieldCharLimit(activeElement) : 0;
    const fieldContext = activeElement ? getFieldContext(activeElement) : '';

    // Append field context to text if it provides useful info
    let fullText = text;
    if (fieldContext && fieldContext.length > 3 && template === 'general') {
      fullText = `[Field: ${fieldContext}]\n\n${text}`;
    }

    try {
      const result = await sendMsg({
        action: 'generateAnswer',
        text: fullText,
        template,
        charLimit: charLimit || 0,
        url: window.location.href,
      });
      if (result.error) { setPanelError(result.error); }
      else if (result.sensitive) { setPanelError(result.answer); }
      else {
        currentAnswer = result.answer;
        setPanelContent(result.answer, result.provider, result.model, result.elapsed, result.wordCount, result.charCount, charLimit);
      }
    } catch (err) {
      setPanelError(err.message || 'Failed. Try reloading the page.');
    }
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
        card.style.cssText = 'margin-bottom:14px; padding:12px; background:rgba(99,102,241,0.06); border-radius:10px; border:1px solid rgba(99,102,241,0.12);';

        if (r.success) {
          const header = document.createElement('div');
          header.style.cssText = 'display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;';
          header.innerHTML = `<strong style="color:#a5b4fc; font-size:12px;">${escapeHtml(r.providerName || r.provider)}</strong><span style="color:#666; font-size:11px;">${escapeHtml(r.model)} | ${(r.elapsed / 1000).toFixed(1)}s | ${r.wordCount}w</span>`;
          card.appendChild(header);

          const content = document.createElement('div');
          content.style.cssText = 'color:#d0d0ee; font-size:13px; line-height:1.6; white-space:pre-wrap; max-height:120px; overflow-y:auto;';
          content.textContent = r.answer;
          card.appendChild(content);

          const copyBtn = document.createElement('button');
          copyBtn.style.cssText = 'margin-top:8px; padding:4px 10px; border:1px solid rgba(99,102,241,0.2); border-radius:6px; background:transparent; color:#a5b4fc; font-size:11px; cursor:pointer;';
          copyBtn.textContent = 'Copy this answer';
          copyBtn.dataset.panelAction = 'copy-compare';
          copyBtn.dataset.answerText = r.answer;
          card.appendChild(copyBtn);
        } else {
          card.style.borderColor = 'rgba(239,68,68,0.12)';
          card.style.background = 'rgba(239,68,68,0.06)';
          card.innerHTML = `<strong style="color:#fca5a5; font-size:12px;">${escapeHtml(r.provider || 'Unknown')}</strong><div style="color:#fca5a5; font-size:13px; margin-top:4px;">${escapeHtml(r.error)}</div>`;
        }
        body.appendChild(card);
      });

      document.getElementById('aether-provider-badge').textContent = `${results.length} providers`;
      document.getElementById('aether-panel-actions').style.display = 'none';
      currentAnswer = results.find(r => r.success)?.answer || '';
    } catch (err) { setPanelError(err.message); }
  }

  // ── Panel Helpers ──────────────────────────────────────────
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
    content.style.cssText = 'white-space:pre-wrap; line-height:1.6;';
    content.textContent = answer;
    body.appendChild(content);

    const meta = document.createElement('div');
    meta.style.cssText = 'margin-top:12px; font-size:11px; color:#666; display:flex; gap:8px; flex-wrap:wrap;';
    let metaText = `${(elapsed / 1000).toFixed(1)}s | ${wordCount}w | ${charCount} chars`;
    if (charLimit > 0) {
      const over = charCount > charLimit;
      metaText += over ? ` | OVER LIMIT (${charLimit})` : ` | within ${charLimit} limit`;
    }
    meta.textContent = metaText;
    body.appendChild(meta);

    document.getElementById('aether-provider-badge').textContent = `${provider} / ${model}`;
    document.getElementById('aether-panel-actions').style.display = 'flex';
  }

  function setPanelError(msg) {
    const body = document.getElementById('aether-panel-body');
    body.innerHTML = '';
    const errDiv = document.createElement('div');
    errDiv.className = 'aether-error';
    errDiv.textContent = msg;
    body.appendChild(errDiv);
    document.getElementById('aether-panel-actions').style.display = 'none';
    document.getElementById('aether-provider-badge').textContent = 'Error';
  }

  // ── Insert Into Field ──────────────────────────────────────
  function insertIntoField(element, text) {
    if (!element) return;
    if (element.tagName === 'TEXTAREA' || (element.tagName === 'INPUT' && ['text', 'search', 'url', 'email'].includes(element.type))) {
      const start = element.selectionStart || 0;
      const end = element.selectionEnd || 0;
      const before = element.value.substring(0, start);
      const after = element.value.substring(end);
      element.value = before + text + after;
      element.selectionStart = element.selectionEnd = start + text.length;
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
      // Also dispatch for React controlled inputs
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement?.prototype || window.HTMLInputElement?.prototype, 'value')?.set;
      if (nativeInputValueSetter) {
        nativeInputValueSetter.call(element, before + text + after);
        element.dispatchEvent(new Event('input', { bubbles: true }));
      }
      return;
    }
    if (element.isContentEditable) { document.execCommand('insertText', false, text); return; }
    // Fallback: find any focused editable
    const editable = document.querySelector('textarea:focus, input[type="text"]:focus, [contenteditable="true"]:focus');
    if (editable) insertIntoField(editable, text);
  }

  // ── Clipboard ──────────────────────────────────────────────
  async function copyToClipboard(text) {
    try { await navigator.clipboard.writeText(text); }
    catch { const ta = document.createElement('textarea'); ta.value = text; ta.style.cssText = 'position:fixed;left:-9999px;'; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta); }
  }

  function escapeHtml(str) { const d = document.createElement('div'); d.textContent = str; return d.innerHTML; }

  // ── Per-Site Permission Check ─────────────────────────────
  const siteHost = window.location.hostname;
  (async () => {
    try {
      const result = await sendMsg({ action: 'getSitePermission', site: siteHost });
      if (result && result.allowed === false) {
        toolbar.remove();
        panel.remove();
        toast.remove();
        return; // Aether disabled for this site
      }
    } catch {}
  })();

  // ── Auto-Save Drafts ─────────────────────────────────────
  const siteKey = window.location.hostname + window.location.pathname;
  let draftSaveTimer;

  function setupDraftAutoSave() {
    document.querySelectorAll('textarea, input[type="text"], input[type="email"], input[type="url"]').forEach(field => {
      // Restore saved draft
      const fieldKey = field.name || field.id || field.placeholder || '';
      if (!fieldKey) return;
      sendMsg({ action: 'getDraft', siteKey, fieldKey }).then(draft => {
        if (draft && draft.text && !field.value) {
          field.value = draft.text;
          field.dispatchEvent(new Event('input', { bubbles: true }));
          // Subtle indicator
          field.style.borderColor = 'rgba(99,102,241,0.3)';
          setTimeout(() => { field.style.borderColor = ''; }, 2000);
        }
      }).catch(() => {});

      // Save on input (debounced)
      field.addEventListener('input', () => {
        clearTimeout(draftSaveTimer);
        draftSaveTimer = setTimeout(() => {
          if (field.value.trim().length > 10) {
            sendMsg({ action: 'saveDraft', siteKey, fieldKey, text: field.value }).catch(() => {});
          }
        }, 3000);
      });
    });
  }

  // Run after page settles
  setTimeout(setupDraftAutoSave, 2000);

  // ── Duplicate Detection (form resubmission warning) ────────
  function checkForDuplicate() {
    const pageText = document.title + ' ' + window.location.href;
    sendMsg({ action: 'getApplications' }).then(apps => {
      if (!apps?.length) return;
      const currentUrl = window.location.href.toLowerCase();
      const currentTitle = document.title.toLowerCase();
      const match = apps.find(app => {
        if (app.url && currentUrl.includes(app.url.toLowerCase().replace(/https?:\/\//, '').split('/')[0])) return true;
        if (app.company && currentTitle.includes(app.company.toLowerCase())) return true;
        return false;
      });
      if (match) {
        showToast(`You may have already applied: ${match.company} (${match.status})`, 'error');
      }
    }).catch(() => {});
  }

  // Check for duplicates on job sites
  const jobSitePatterns = ['careers', 'jobs', 'apply', 'workday', 'greenhouse', 'lever.co', 'icims'];
  if (jobSitePatterns.some(p => window.location.href.toLowerCase().includes(p))) {
    setTimeout(checkForDuplicate, 3000);
  }

  // ── Question Difficulty Badge ─────────────────────────────
  function addDifficultyBadges() {
    document.querySelectorAll('textarea, input[type="text"]').forEach(field => {
      const context = getFieldContext(field);
      if (!context || context.length < 10) return;
      sendMsg({ action: 'questionDifficulty', text: context }).then(result => {
        if (!result || result.difficulty === 'easy') return;
        const badge = document.createElement('span');
        badge.style.cssText = `display:inline-block; padding:2px 8px; border-radius:4px; font-size:10px; font-weight:600; margin-left:6px; ${result.difficulty === 'hard' ? 'background:rgba(239,68,68,0.1);color:#ef4444;' : 'background:rgba(245,158,11,0.1);color:#f59e0b;'}`;
        badge.textContent = result.difficulty.toUpperCase();
        badge.title = result.tips?.join('. ') || '';
        const label = field.closest('label') || document.querySelector(`label[for="${field.id}"]`);
        if (label && !label.querySelector('[data-aether-difficulty]')) {
          badge.setAttribute('data-aether-difficulty', '1');
          label.appendChild(badge);
        }
      }).catch(() => {});
    });
  }

  // Add difficulty badges on job application sites
  if (jobSitePatterns.some(p => window.location.href.toLowerCase().includes(p))) {
    setTimeout(addDifficultyBadges, 4000);
  }

  // ── Message Listener ───────────────────────────────────────
  try {
    chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
      try {
        if (msg.action === 'getSelectedText') {
          const sel = selectedText || window.getSelection()?.toString().trim() || '';
          const charLimit = activeElement ? getFieldCharLimit(activeElement) : 0;
          const fieldCtx = activeElement ? getFieldContext(activeElement) : '';
          sendResponse({ text: sel, charLimit, fieldContext: fieldCtx });
        }
        if (msg.action === 'generate-answer') {
          const text = selectedText || window.getSelection()?.toString().trim();
          if (text) generateInline(text, 'general');
          sendResponse({ ok: true });
        }
        if (msg.action === 'toggle-toolbar') {
          if (toolbar.classList.contains('aether-visible')) hideToolbar();
          else { const sel = window.getSelection(); if (sel?.toString().trim()) positionToolbar(sel); }
          sendResponse({ ok: true });
        }
        if (msg.action === 'showInlineResult') {
          selectedText = msg.text;
          generateInline(msg.text, msg.template || 'general');
          sendResponse({ ok: true });
        }
        if (msg.action === 'showCompareResult') {
          selectedText = msg.text;
          compareInline(msg.text);
          sendResponse({ ok: true });
        }
        if (msg.action === 'showPersonasResult') {
          selectedText = msg.text;
          generateInline(msg.text, 'general'); // fallback to inline for now
          sendResponse({ ok: true });
        }
        if (msg.action === 'insertAnswer') {
          const target = document.activeElement;
          if (target) { insertIntoField(target, msg.answer); showToast('Inserted'); }
          sendResponse({ ok: true });
        }
      } catch {}
    });
  } catch { extensionValid = false; }
})();
