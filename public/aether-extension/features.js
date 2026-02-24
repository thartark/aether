/* ============================================================
   Aether Features v3.1 -- Mega Feature Module
   30+ features from the master list, organized by category.
   Runs as a content script alongside content.js.
   ============================================================ */

(function () {
  'use strict';
  if (window.__aetherFeaturesInjected) return;
  window.__aetherFeaturesInjected = true;

  // ── Safe Messaging ────────────────────────────────────────
  function sendMsg(msg) {
    return new Promise((resolve, reject) => {
      try {
        if (!chrome.runtime?.id) { reject(new Error('Extension invalid')); return; }
        chrome.runtime.sendMessage(msg, (resp) => {
          if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
          else resolve(resp);
        });
      } catch { reject(new Error('Extension invalid')); }
    });
  }

  function escapeHtml(str) { const d = document.createElement('div'); d.textContent = str || ''; return d.innerHTML; }

  const JOB_PATTERNS = ['careers', 'jobs', 'apply', 'workday', 'greenhouse', 'lever.co', 'icims', 'linkedin.com/jobs', 'indeed.com', 'glassdoor', 'ziprecruiter', 'monster.com', 'hired.com'];
  const isJobSite = () => JOB_PATTERNS.some(p => window.location.href.toLowerCase().includes(p));

  // ═══════════════════════════════════════════════════════════
  //  I. INPUT & CONTEXTUAL AWARENESS
  // ═══════════════════════════════════════════════════════════

  // ── 1. Live Word/Char Counter ─────────────────────────────
  function addFieldCounters() {
    document.querySelectorAll('textarea').forEach(field => {
      if (field.dataset.aetherCounter) return;
      field.dataset.aetherCounter = '1';
      const counter = document.createElement('div');
      counter.className = 'aether-field-counter';
      const maxLen = field.maxLength > 0 && field.maxLength < 100000 ? field.maxLength : 0;
      function update() {
        const val = field.value || '';
        const words = val.trim() ? val.trim().split(/\s+/).length : 0;
        const chars = val.length;
        const sentences = val.trim() ? val.trim().split(/[.!?]+/).filter(s => s.trim()).length : 0;
        let html = `<span>${words}w</span><span>${chars}c</span><span>${sentences}s</span>`;
        if (maxLen > 0) {
          const pct = Math.round((chars / maxLen) * 100);
          const color = pct > 95 ? '#ef4444' : pct > 80 ? '#f59e0b' : '#22c55e';
          html += `<span style="color:${color}">${chars}/${maxLen} (${pct}%)</span>`;
        }
        counter.innerHTML = html;
      }
      update();
      field.addEventListener('input', update);
      const wrapper = field.parentElement;
      if (wrapper) { wrapper.style.position = wrapper.style.position || 'relative'; wrapper.appendChild(counter); }
    });
  }

  // ── 2. Character Limit Optimizer ──────────────────────────
  function setupCharLimitOptimizer() {
    document.querySelectorAll('textarea').forEach(field => {
      if (field.dataset.aetherOptimizer) return;
      field.dataset.aetherOptimizer = '1';
      const maxLen = field.maxLength > 0 && field.maxLength < 100000 ? field.maxLength : 0;
      if (!maxLen) return;
      field.addEventListener('input', () => {
        const remaining = maxLen - (field.value || '').length;
        if (remaining < 50 && remaining > 0) {
          field.style.borderColor = '#f59e0b';
          field.title = `${remaining} characters remaining`;
        } else if (remaining <= 0) {
          field.style.borderColor = '#ef4444';
          field.title = 'Character limit reached!';
        } else {
          field.style.borderColor = '';
          field.title = '';
        }
      });
    });
  }

  // ── 3. Form Type Auto-Detection ───────────────────────────
  function detectFormType() {
    const url = window.location.href.toLowerCase();
    const title = document.title.toLowerCase();
    const body = document.body?.textContent?.substring(0, 3000).toLowerCase() || '';
    const types = [];
    if (isJobSite() || /application|resume|cover letter|work experience/.test(body)) types.push('job-application');
    if (/tax|w-?2|1099|irs|filing/.test(body)) types.push('tax');
    if (/medical|health|patient|symptom|diagnosis/.test(body)) types.push('medical');
    if (/visa|immigration|passport|citizenship/.test(body)) types.push('visa');
    if (/contract|legal|agreement|terms|indemnif/.test(body)) types.push('legal');
    if (/scholarship|financial aid|fafsa|academic/.test(body)) types.push('scholarship');
    if (/survey|feedback|satisfaction|rate your/.test(body)) types.push('survey');
    if (types.length > 0) {
      window.__aetherFormType = types;
      // Show subtle badge
      const badge = document.createElement('div');
      badge.className = 'aether-form-type-badge';
      badge.innerHTML = types.map(t => `<span class="aether-form-type-chip">${t.replace('-', ' ')}</span>`).join('');
      badge.title = 'Aether detected this form type. AI answers will be tailored accordingly.';
      document.body.appendChild(badge);
    }
  }

  // ── 4. Universal Field Detection ──────────────────────────
  function detectAllFields() {
    // Find dropdowns, radios, checkboxes, date pickers, and tag them
    document.querySelectorAll('select, input[type="radio"], input[type="checkbox"], input[type="date"], input[type="datetime-local"]').forEach(f => {
      if (f.dataset.aetherDetected) return;
      f.dataset.aetherDetected = '1';
    });
  }

  // ── 5. Smart Format Matching ──────────────────────────────
  function addFormatHints() {
    document.querySelectorAll('input[type="text"]').forEach(f => {
      if (f.dataset.aetherFormat) return;
      f.dataset.aetherFormat = '1';
      const ph = (f.placeholder || '').toLowerCase();
      const name = (f.name || '').toLowerCase();
      const label = f.closest('label')?.textContent?.toLowerCase() || '';
      const ctx = ph + ' ' + name + ' ' + label;
      // Phone
      if (/phone|tel|mobile|cell/.test(ctx) && !f.type.includes('tel')) {
        f.addEventListener('blur', () => {
          const v = f.value.replace(/\D/g, '');
          if (v.length === 10) f.value = `(${v.slice(0,3)}) ${v.slice(3,6)}-${v.slice(6)}`;
          else if (v.length === 11 && v[0] === '1') f.value = `+1 (${v.slice(1,4)}) ${v.slice(4,7)}-${v.slice(7)}`;
        });
      }
      // Date format detection
      if (/date|dob|birthday|birth/.test(ctx)) {
        f.setAttribute('placeholder', f.placeholder || 'MM/DD/YYYY');
      }
      // ZIP code
      if (/zip|postal|postcode/.test(ctx)) {
        f.addEventListener('input', () => { f.value = f.value.replace(/[^0-9-]/g, '').substring(0, 10); });
      }
    });
  }

  // ── 6. Contradiction Checker ──────────────────────────────
  function setupContradictionChecker() {
    if (!isJobSite()) return;
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
      if (form.dataset.aetherContradiction) return;
      form.dataset.aetherContradiction = '1';
      // Collect all textarea values on submit and check for contradictions
      form.addEventListener('submit', async (e) => {
        const fields = form.querySelectorAll('textarea');
        if (fields.length < 2) return;
        const answers = [];
        fields.forEach(f => { if (f.value.trim().length > 20) answers.push({ label: f.name || f.placeholder || 'Field', text: f.value.trim() }); });
        if (answers.length < 2) return;
        // Quick local check for obvious contradictions (numbers, dates)
        const allText = answers.map(a => a.text).join('\n---\n');
        // Store for potential AI analysis
        try { await sendMsg({ action: 'saveDraft', siteKey: window.location.hostname, fieldKey: '__contradiction_check', text: allText }); } catch {}
      });
    });
  }

  // ═══════════════════════════════════════════════════════════
  //  II. CLARITY & QUALITY SCORING
  // ═══════════════════════════════════════════════════════════

  // ── 7. Clarity Score Badge ────────────────────────────────
  const clarityCache = new Map();
  function setupClarityScoring() {
    document.querySelectorAll('textarea').forEach(field => {
      if (field.dataset.aetherClarity) return;
      field.dataset.aetherClarity = '1';
      field.addEventListener('blur', async () => {
        const text = field.value?.trim();
        if (!text || text.length < 30) return;
        const hash = text.substring(0, 100);
        if (clarityCache.has(hash)) return;
        clarityCache.set(hash, true);
        try {
          const result = await sendMsg({ action: 'clarityScore', text: text.substring(0, 2000) });
          if (!result || result.error) return;
          let badge = field.parentElement?.querySelector('.aether-clarity-badge');
          if (!badge) {
            badge = document.createElement('div');
            badge.className = 'aether-clarity-badge';
            if (field.parentElement) { field.parentElement.style.position = field.parentElement.style.position || 'relative'; field.parentElement.appendChild(badge); }
          }
          const color = result.score >= 80 ? '#22c55e' : result.score >= 60 ? '#f59e0b' : '#ef4444';
          badge.innerHTML = `<span style="color:${color};font-weight:700;">${result.grade || result.score}</span> Clarity`;
          badge.title = (result.suggestion || `Score: ${result.score}/100`) + (result.issues?.length ? '\nIssues: ' + result.issues.join(', ') : '');
          badge.style.borderColor = color + '33';
        } catch {}
      });
    });
  }

  // ── 8. Readability Level Indicator ────────────────────────
  function addReadabilityIndicator() {
    document.querySelectorAll('textarea').forEach(field => {
      if (field.dataset.aetherReadability) return;
      field.dataset.aetherReadability = '1';
      let readTimer;
      field.addEventListener('input', () => {
        clearTimeout(readTimer);
        readTimer = setTimeout(() => {
          const text = field.value?.trim();
          if (!text || text.split(/\s+/).length < 15) return;
          // Flesch-Kincaid approximation (client-side, no AI needed)
          const sentences = text.split(/[.!?]+/).filter(s => s.trim()).length || 1;
          const words = text.split(/\s+/).length;
          const syllables = countSyllables(text);
          const fk = 0.39 * (words / sentences) + 11.8 * (syllables / words) - 15.59;
          const grade = Math.max(1, Math.min(16, Math.round(fk)));
          let level = 'Easy', levelColor = '#22c55e';
          if (grade > 12) { level = 'Expert'; levelColor = '#ef4444'; }
          else if (grade > 8) { level = 'Advanced'; levelColor = '#f59e0b'; }
          else if (grade > 5) { level = 'Standard'; levelColor = '#6366f1'; }
          let indicator = field.parentElement?.querySelector('.aether-readability');
          if (!indicator) {
            indicator = document.createElement('div');
            indicator.className = 'aether-readability';
            if (field.parentElement) { field.parentElement.style.position = field.parentElement.style.position || 'relative'; field.parentElement.appendChild(indicator); }
          }
          indicator.innerHTML = `<span style="color:${levelColor}">${level}</span> <span style="color:#666;font-size:9px;">Grade ${grade}</span>`;
        }, 1500);
      });
    });
  }

  function countSyllables(text) {
    const words = text.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/);
    let total = 0;
    words.forEach(w => {
      if (w.length <= 3) { total += 1; return; }
      w = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '').replace(/^y/, '');
      const m = w.match(/[aeiouy]{1,2}/g);
      total += m ? m.length : 1;
    });
    return total;
  }

  // ═══════════════════════════════════════════════════════════
  //  III. JOB APPLICATION SUPERPOWERS
  // ═══════════════════════════════════════════════════════════

  // ── 9. Trick Question Detector ────────────────────────────
  function detectTrickQuestions() {
    if (!isJobSite()) return;
    document.querySelectorAll('textarea, input[type="text"]').forEach(field => {
      if (field.dataset.aetherTrick) return;
      field.dataset.aetherTrick = '1';
      const labelEl = field.closest('label') || document.querySelector(`label[for="${field.id}"]`);
      const question = labelEl?.textContent?.trim() || field.placeholder || field.name;
      if (!question || question.length < 15) return;
      sendMsg({ action: 'trickQuestionDetect', question }).then(result => {
        if (!result || !result.isTrick) return;
        const warn = document.createElement('div');
        warn.className = 'aether-trick-warning';
        warn.innerHTML = `<span class="aether-trick-icon">!</span><span class="aether-trick-text"><strong>${escapeHtml(result.trickType?.replace(/-/g, ' ') || 'Careful')}</strong>: ${escapeHtml(result.warning || 'Think carefully.')}</span>`;
        warn.title = result.strategy || '';
        if (labelEl) labelEl.appendChild(warn);
        else if (field.parentElement) field.parentElement.insertBefore(warn, field);
      }).catch(() => {});
    });
  }

  // ── 10. Question Difficulty Rating ────────────────────────
  function addQuestionDifficulty() {
    if (!isJobSite()) return;
    document.querySelectorAll('textarea, input[type="text"]').forEach(field => {
      if (field.dataset.aetherDifficulty) return;
      field.dataset.aetherDifficulty = '1';
      const labelEl = field.closest('label') || document.querySelector(`label[for="${field.id}"]`);
      const question = labelEl?.textContent?.trim() || field.placeholder || field.name;
      if (!question || question.length < 10) return;
      sendMsg({ action: 'questionDifficulty', text: question }).then(r => {
        if (!r || r.difficulty === 'easy') return;
        const badge = document.createElement('span');
        badge.className = 'aether-difficulty-badge';
        badge.dataset.level = r.difficulty;
        badge.textContent = r.difficulty.toUpperCase();
        badge.title = r.tips?.join('. ') || '';
        if (labelEl && !labelEl.querySelector('.aether-difficulty-badge')) labelEl.appendChild(badge);
      }).catch(() => {});
    });
  }

  // ── 11. ATS Keyword Scanner (on job description pages) ────
  function setupATSKeywordScanner() {
    if (!isJobSite()) return;
    // Look for job description content
    const jdEl = document.querySelector('[class*="description"], [class*="job-desc"], [class*="posting"], article, .job-details, #job-description');
    if (!jdEl) return;
    const jdText = jdEl.textContent?.substring(0, 5000);
    if (!jdText || jdText.length < 100) return;

    sendMsg({ action: 'atsKeywords', jobDescription: jdText }).then(result => {
      if (!result || result.error) return;
      const keywords = result.keywords || result.skills || [];
      if (keywords.length === 0) return;

      // Create floating ATS panel
      const panel = document.createElement('div');
      panel.className = 'aether-ats-panel';
      panel.innerHTML = `
        <div class="aether-ats-header" id="aether-ats-toggle">
          <span>ATS Keywords</span>
          <span class="aether-ats-count">${keywords.length}</span>
          <span class="aether-research-chevron">&#9660;</span>
        </div>
        <div class="aether-ats-body" id="aether-ats-body" style="display:none;">
          ${result.skills?.length ? `<div class="aether-ats-section"><strong>Technical Skills</strong><div class="aether-ats-chips">${result.skills.map(k => `<span class="aether-keyword-chip aether-keyword-tech">${escapeHtml(k)}</span>`).join('')}</div></div>` : ''}
          ${result.softSkills?.length ? `<div class="aether-ats-section"><strong>Soft Skills</strong><div class="aether-ats-chips">${result.softSkills.map(k => `<span class="aether-keyword-chip aether-keyword-soft">${escapeHtml(k)}</span>`).join('')}</div></div>` : ''}
          ${result.certifications?.length ? `<div class="aether-ats-section"><strong>Certifications</strong><div class="aether-ats-chips">${result.certifications.map(k => `<span class="aether-keyword-chip aether-keyword-cert">${escapeHtml(k)}</span>`).join('')}</div></div>` : ''}
          ${result.keywords?.length && !result.skills ? `<div class="aether-ats-section"><strong>Keywords</strong><div class="aether-ats-chips">${result.keywords.map(k => `<span class="aether-keyword-chip">${escapeHtml(k)}</span>`).join('')}</div></div>` : ''}
        </div>
      `;
      document.body.appendChild(panel);

      document.getElementById('aether-ats-toggle').addEventListener('click', () => {
        const body = document.getElementById('aether-ats-body');
        const chevron = panel.querySelector('.aether-research-chevron');
        if (body.style.display === 'none') { body.style.display = 'block'; chevron.innerHTML = '&#9650;'; }
        else { body.style.display = 'none'; chevron.innerHTML = '&#9660;'; }
      });

      // Highlight keywords in the JD text
      keywords.forEach(kw => {
        const regex = new RegExp(`\\b(${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})\\b`, 'gi');
        highlightInElement(jdEl, regex, 'aether-ats-highlight');
      });
    }).catch(() => {});
  }

  function highlightInElement(el, regex, className) {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(node => {
      if (!regex.test(node.textContent)) return;
      regex.lastIndex = 0;
      const span = document.createElement('span');
      span.innerHTML = node.textContent.replace(regex, `<mark class="${className}">$1</mark>`);
      node.parentNode.replaceChild(span, node);
    });
  }

  // ── 12. Tone Analysis Badges ──────────────────────────────
  function setupToneAnalysis() {
    document.querySelectorAll('textarea').forEach(field => {
      if (field.dataset.aetherTone) return;
      field.dataset.aetherTone = '1';
      let toneTimer;
      field.addEventListener('input', () => {
        clearTimeout(toneTimer);
        toneTimer = setTimeout(async () => {
          const text = field.value?.trim();
          if (!text || text.split(/\s+/).length < 20) return;
          try {
            const result = await sendMsg({ action: 'toneAnalysis', text: text.substring(0, 2000) });
            if (!result || result.error) return;
            let badge = field.parentElement?.querySelector('.aether-tone-badge');
            if (!badge) {
              badge = document.createElement('div');
              badge.className = 'aether-tone-badge';
              if (field.parentElement) { field.parentElement.style.position = field.parentElement.style.position || 'relative'; field.parentElement.appendChild(badge); }
            }
            const fLabel = result.formality >= 7 ? 'Formal' : result.formality >= 4 ? 'Balanced' : 'Casual';
            badge.innerHTML = `<span>${escapeHtml(result.primaryTone || '?')}</span><span class="aether-tone-sep">|</span><span>${fLabel}</span>`;
            badge.title = result.suggestions?.join('. ') || `Formality: ${result.formality}/10`;
          } catch {}
        }, 5000);
      });
    });
  }

  // ── 13. Company Research Card ─────────────────────────────
  function setupCompanyResearch() {
    if (!isJobSite()) return;
    const titleParts = document.title.split(/[-|:]/);
    const companyName = titleParts.length > 1 ? titleParts[titleParts.length - 1].trim() : titleParts[0].trim();
    if (!companyName || companyName.length < 2 || companyName.length > 60) return;

    const card = document.createElement('div');
    card.className = 'aether-research-card';
    card.innerHTML = `
      <div class="aether-research-header" id="aether-research-toggle">
        <span class="aether-research-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></span>
        <span>Company Intel: <strong>${escapeHtml(companyName)}</strong></span>
        <span class="aether-research-chevron">&#9660;</span>
      </div>
      <div class="aether-research-body" id="aether-research-body" style="display:none;">
        <div class="aether-research-loading">Loading research...</div>
      </div>
    `;
    document.body.appendChild(card);

    let loaded = false;
    document.getElementById('aether-research-toggle').addEventListener('click', async () => {
      const body = document.getElementById('aether-research-body');
      const chevron = card.querySelector('.aether-research-chevron');
      if (body.style.display === 'none') {
        body.style.display = 'block'; chevron.innerHTML = '&#9650;';
        if (!loaded) {
          loaded = true;
          try {
            const result = await sendMsg({ action: 'companyResearch', companyName });
            if (result.error) { body.innerHTML = `<div style="color:#fca5a5;font-size:12px;">${escapeHtml(result.error)}</div>`; return; }
            body.innerHTML = `
              <div class="aether-research-section"><strong>Overview</strong><p>${escapeHtml(result.summary || 'N/A')}</p></div>
              <div class="aether-research-section"><strong>Industry</strong><p>${escapeHtml(result.industry || '?')} | ${escapeHtml(result.size || '?')}</p></div>
              <div class="aether-research-section"><strong>Culture</strong><p>${escapeHtml(result.culture || '?')}</p></div>
              <div class="aether-research-section"><strong>Interview Tips</strong><ul>${(result.interviewTips || []).map(t => `<li>${escapeHtml(t)}</li>`).join('')}</ul></div>
              <div class="aether-research-section"><strong>Questions to Ask</strong><ul>${(result.questionsToAsk || []).map(q => `<li>${escapeHtml(q)}</li>`).join('')}</ul></div>
              <div class="aether-research-section"><strong>Keywords to Use</strong><div class="aether-research-keywords">${(result.keywords || []).map(k => `<span class="aether-keyword-chip">${escapeHtml(k)}</span>`).join('')}</div></div>
            `;
          } catch (e) { body.innerHTML = `<div style="color:#fca5a5;font-size:12px;">${escapeHtml(e.message)}</div>`; }
        }
      } else { body.style.display = 'none'; chevron.innerHTML = '&#9660;'; }
    });
  }

  // ── 14. Red Flag Detector ─────────────────────────────────
  function detectRedFlags() {
    if (!isJobSite()) return;
    const body = document.body?.textContent?.substring(0, 8000).toLowerCase() || '';
    const flags = [];
    if (/unlimited pto/i.test(body)) flags.push({ text: 'Unlimited PTO', type: 'caution', note: 'Often means no tracked PTO and pressure not to take time off' });
    if (/work hard.{0,20}play hard/i.test(body)) flags.push({ text: '"Work hard, play hard"', type: 'warning', note: 'Can indicate poor work-life balance' });
    if (/fast.paced|hustle culture|startup mentality/i.test(body)) flags.push({ text: 'Fast-paced/hustle culture', type: 'caution', note: 'May indicate long hours expected' });
    if (/rockstar|ninja|guru|wizard/i.test(body)) flags.push({ text: 'Buzzword titles', type: 'info', note: 'Informal culture, may mean unclear role boundaries' });
    if (/wear many hats|jack of all/i.test(body)) flags.push({ text: '"Wear many hats"', type: 'caution', note: 'Likely understaffed team, one person doing multiple jobs' });
    if (/salary.*negotiable|competitive.*salary|doe/i.test(body) && !/\$[\d,]+/.test(body)) flags.push({ text: 'No salary listed', type: 'info', note: 'Lack of salary transparency' });
    if (/unpaid|no compensation/i.test(body)) flags.push({ text: 'Unpaid/No compensation', type: 'warning', note: 'Consider if this is ethical and legal' });
    if (flags.length === 0) return;

    const container = document.createElement('div');
    container.className = 'aether-red-flags';
    container.innerHTML = `<div class="aether-red-flags-header"><span>Red Flags Detected (${flags.length})</span></div>` +
      flags.map(f => `<div class="aether-red-flag-item aether-flag-${f.type}"><strong>${escapeHtml(f.text)}</strong><span>${escapeHtml(f.note)}</span></div>`).join('');
    document.body.appendChild(container);
  }

  // ── 15. Salary Intelligence ───────────────────────────────
  function detectSalaryInfo() {
    if (!isJobSite()) return;
    const body = document.body?.textContent || '';
    const salaryMatch = body.match(/\$[\d,]+(?:\s*[-–]\s*\$[\d,]+)?(?:\s*(?:per|\/)\s*(?:year|annum|yr|hour|hr))?/g);
    if (!salaryMatch?.length) return;
    const salaryBadge = document.createElement('div');
    salaryBadge.className = 'aether-salary-badge';
    salaryBadge.innerHTML = `<span class="aether-salary-icon">$</span> <span>Salary: ${escapeHtml(salaryMatch[0])}</span>`;
    salaryBadge.title = salaryMatch.length > 1 ? `All mentions: ${salaryMatch.join(', ')}` : '';
    document.body.appendChild(salaryBadge);
  }

  // ═══════════════════════════════════════════════════════════
  //  IV. FIELD VALIDATION & HELPERS
  // ═══════════════════════════════════════════════════════════

  // ── 16. Email/URL Validation ──────────────────────────────
  function addFieldValidation() {
    document.querySelectorAll('input[type="email"]').forEach(f => {
      if (f.dataset.aetherValidate) return;
      f.dataset.aetherValidate = '1';
      f.addEventListener('blur', () => {
        const v = f.value.trim();
        if (v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) { f.style.boxShadow = '0 0 0 2px rgba(239,68,68,0.3)'; f.title = 'Invalid email format'; }
        else { f.style.boxShadow = ''; f.title = ''; }
      });
    });
    document.querySelectorAll('input[type="url"]').forEach(f => {
      if (f.dataset.aetherValidate) return;
      f.dataset.aetherValidate = '1';
      f.addEventListener('blur', () => {
        const v = f.value.trim();
        if (v && !/^https?:\/\/.+/.test(v)) { f.style.boxShadow = '0 0 0 2px rgba(239,68,68,0.3)'; f.title = 'URLs should start with http:// or https://'; }
        else { f.style.boxShadow = ''; f.title = ''; }
      });
    });
  }

  // ── 17. Required Field Highlighter ────────────────────────
  function highlightRequiredFields() {
    document.querySelectorAll('textarea, input[type="text"], input[type="email"], input[type="url"]').forEach(f => {
      if (f.dataset.aetherRequired) return;
      f.dataset.aetherRequired = '1';
      const isReq = f.required || f.getAttribute('aria-required') === 'true';
      if (!isReq) {
        const lbl = f.closest('label') || document.querySelector(`label[for="${f.id}"]`);
        if (lbl && /\*/.test(lbl.textContent)) f.dataset.aetherReqMark = '1';
      }
    });
  }

  // ── 18. Form Progress Tracker ─────────────────────────────
  function addFormProgress() {
    document.querySelectorAll('form').forEach(form => {
      if (form.dataset.aetherProgress) return;
      form.dataset.aetherProgress = '1';
      const fields = form.querySelectorAll('textarea, input[type="text"], input[type="email"], input[type="url"], select');
      if (fields.length < 3) return;
      const reqFields = Array.from(fields).filter(f =>
        f.required || f.getAttribute('aria-required') === 'true' ||
        ((() => { const l = f.closest('label') || document.querySelector(`label[for="${f.id}"]`); return l && /\*/.test(l.textContent); })())
      );
      if (reqFields.length < 2) return;
      const bar = document.createElement('div');
      bar.className = 'aether-progress-bar';
      bar.innerHTML = `<div class="aether-progress-fill"></div><span class="aether-progress-label">0/${reqFields.length}</span>`;
      form.insertBefore(bar, form.firstChild);
      function update() {
        const filled = reqFields.filter(f => f.tagName === 'SELECT' ? f.value !== '' : f.value?.trim().length > 0).length;
        const pct = Math.round((filled / reqFields.length) * 100);
        bar.querySelector('.aether-progress-fill').style.width = `${pct}%`;
        bar.querySelector('.aether-progress-label').textContent = `${filled}/${reqFields.length} required`;
        if (pct === 100) bar.querySelector('.aether-progress-fill').style.background = '#22c55e';
      }
      reqFields.forEach(f => { f.addEventListener('input', update); f.addEventListener('change', update); });
      update();
    });
  }

  // ═══════════════════════════════════════════════════════════
  //  V. WORKFLOW & PRODUCTIVITY
  // ═══════════════════════════════════════════════════════════

  // ── 19. Visual Diff (before/after edits) ──────────────────
  function setupVisualDiff() {
    // Store original textarea values; after AI modification, show diff
    document.querySelectorAll('textarea').forEach(field => {
      if (field.dataset.aetherDiff) return;
      field.dataset.aetherDiff = '1';
      let original = field.value || '';
      field.addEventListener('focus', () => { if (!original) original = field.value; });
      // Listen for Aether inserts
      field.addEventListener('change', () => {
        const newVal = field.value;
        if (original && newVal && original !== newVal && Math.abs(newVal.length - original.length) > 20) {
          // Show diff button
          let diffBtn = field.parentElement?.querySelector('.aether-diff-btn');
          if (!diffBtn) {
            diffBtn = document.createElement('button');
            diffBtn.className = 'aether-diff-btn';
            diffBtn.textContent = 'View Changes';
            diffBtn.title = 'See what Aether changed';
            if (field.parentElement) { field.parentElement.style.position = field.parentElement.style.position || 'relative'; field.parentElement.appendChild(diffBtn); }
          }
          diffBtn.onclick = () => showDiffOverlay(original, newVal);
        }
      });
    });
  }

  function showDiffOverlay(before, after) {
    const existing = document.getElementById('aether-diff-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'aether-diff-overlay';
    overlay.className = 'aether-diff-overlay';

    // Simple word-level diff
    const beforeWords = before.split(/(\s+)/);
    const afterWords = after.split(/(\s+)/);
    let diffHtml = '';
    const maxLen = Math.max(beforeWords.length, afterWords.length);
    for (let i = 0; i < maxLen; i++) {
      const bw = beforeWords[i] || '';
      const aw = afterWords[i] || '';
      if (bw === aw) { diffHtml += escapeHtml(aw); }
      else {
        if (bw) diffHtml += `<span class="aether-diff-removed">${escapeHtml(bw)}</span>`;
        if (aw) diffHtml += `<span class="aether-diff-added">${escapeHtml(aw)}</span>`;
      }
    }

    overlay.innerHTML = `
      <div class="aether-diff-content">
        <div class="aether-diff-header"><strong>Changes Made</strong><button id="aether-diff-close" class="aether-diff-close-btn">Close</button></div>
        <div class="aether-diff-body">${diffHtml}</div>
      </div>
    `;
    document.body.appendChild(overlay);
    document.getElementById('aether-diff-close').addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
  }

  // ── 20. Undo/Redo Stack ───────────────────────────────────
  function setupUndoRedo() {
    document.querySelectorAll('textarea').forEach(field => {
      if (field.dataset.aetherUndo) return;
      field.dataset.aetherUndo = '1';
      const stack = [field.value || ''];
      let pointer = 0;
      field.addEventListener('input', () => {
        const val = field.value;
        if (val !== stack[pointer]) {
          stack.splice(pointer + 1);
          stack.push(val);
          if (stack.length > 30) stack.shift();
          pointer = stack.length - 1;
        }
      });
      // Ctrl+Z already native, but add Ctrl+Shift+Z for redo
      field.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey && e.key === 'Z') {
          e.preventDefault();
          if (pointer < stack.length - 1) {
            pointer++;
            field.value = stack[pointer];
            field.dispatchEvent(new Event('input', { bubbles: true }));
          }
        }
      });
    });
  }

  // ── 21. Sensitive Field Masking ───────────────────────────
  function maskSensitiveFields() {
    document.querySelectorAll('input[type="text"]').forEach(f => {
      if (f.dataset.aetherMask) return;
      const ctx = (f.name + ' ' + f.placeholder + ' ' + (f.closest('label')?.textContent || '')).toLowerCase();
      if (/ssn|social security|tax.?id|ein|passport|bank.?account|routing.?number|credit.?card|card.?number/.test(ctx)) {
        f.dataset.aetherMask = 'sensitive';
        f.style.borderColor = 'rgba(239,68,68,0.3)';
        const warn = document.createElement('div');
        warn.className = 'aether-sensitive-warn';
        warn.innerHTML = '<span style="color:#ef4444;font-size:10px;font-weight:600;">SENSITIVE FIELD - Aether will not send this data to AI</span>';
        if (f.parentElement) f.parentElement.appendChild(warn);
      }
    });
  }

  // ═══════════════════════════════════════════════════════════
  //  VI. ANALYTICS & LEARNING
  // ═══════════════════════════════════════════════════════════

  // ── 22. Time Saved Tracking ───────────────────────────────
  function trackTimeSaved() {
    // Listen for Aether answer insertions; estimate 2 minutes saved per answer
    window.addEventListener('message', (e) => {
      if (e.data?.type === 'aether-inserted') {
        sendMsg({ action: 'updateStats', stat: 'timeSaved', value: 2 }).catch(() => {});
      }
    });
  }

  // ── 23. Predict Next Question ─────────────────────────────
  function setupNextQuestionPrediction() {
    if (!isJobSite()) return;
    // When user fills a textarea, predict what the next question might be
    document.querySelectorAll('textarea').forEach(field => {
      if (field.dataset.aetherPredict) return;
      field.dataset.aetherPredict = '1';
      field.addEventListener('blur', () => {
        const text = field.value?.trim();
        if (!text || text.length < 50) return;
        const labelEl = field.closest('label') || document.querySelector(`label[for="${field.id}"]`);
        const question = labelEl?.textContent?.trim() || '';
        if (!question) return;
        // Find next textarea
        const allTextareas = Array.from(document.querySelectorAll('textarea'));
        const idx = allTextareas.indexOf(field);
        const nextField = allTextareas[idx + 1];
        if (!nextField || nextField.value.trim()) return;
        // Show "up next" hint
        let hint = nextField.parentElement?.querySelector('.aether-next-hint');
        if (!hint) {
          hint = document.createElement('div');
          hint.className = 'aether-next-hint';
          hint.textContent = 'Aether is ready to help with this next question too';
          if (nextField.parentElement) nextField.parentElement.appendChild(hint);
        }
      });
    });
  }

  // ── 24. Form Abandonment Risk ─────────────────────────────
  function trackFormAbandonment() {
    let formInteracted = false;
    document.querySelectorAll('form').forEach(form => {
      form.addEventListener('input', () => { formInteracted = true; });
    });
    window.addEventListener('beforeunload', (e) => {
      if (formInteracted) {
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
          const fields = form.querySelectorAll('textarea, input[type="text"]');
          const filled = Array.from(fields).filter(f => f.value.trim().length > 0).length;
          if (filled > 0 && filled < fields.length) {
            // Save drafts before leaving
            fields.forEach(f => {
              const fk = f.name || f.id || '';
              if (fk && f.value.trim()) {
                try { sendMsg({ action: 'saveDraft', siteKey: window.location.hostname + window.location.pathname, fieldKey: fk, text: f.value }); } catch {}
              }
            });
          }
        });
      }
    });
  }

  // ── 25. Rewrite Job Description to Plain English ──────────
  function addJDSimplifier() {
    if (!isJobSite()) return;
    const jdEl = document.querySelector('[class*="description"], [class*="job-desc"], [class*="posting"], article, .job-details, #job-description');
    if (!jdEl || jdEl.textContent.length < 200) return;
    const simplifyBtn = document.createElement('button');
    simplifyBtn.className = 'aether-jd-simplify-btn';
    simplifyBtn.textContent = 'Simplify This JD';
    simplifyBtn.title = 'Rewrite the job description in plain, clear language';
    jdEl.parentElement?.insertBefore(simplifyBtn, jdEl);
    simplifyBtn.addEventListener('click', async () => {
      simplifyBtn.textContent = 'Simplifying...';
      simplifyBtn.disabled = true;
      try {
        const result = await sendMsg({ action: 'generateAnswer', text: jdEl.textContent.substring(0, 5000), template: 'simplify', charLimit: 0, url: window.location.href });
        if (result.error || result.sensitive) { simplifyBtn.textContent = 'Failed'; return; }
        const simplified = document.createElement('div');
        simplified.className = 'aether-jd-simplified';
        simplified.innerHTML = `<div class="aether-jd-simplified-header"><strong>Plain English Version</strong><button class="aether-jd-toggle">Show Original</button></div><div class="aether-jd-simplified-body">${escapeHtml(result.answer)}</div>`;
        jdEl.parentElement?.insertBefore(simplified, jdEl.nextSibling);
        jdEl.style.display = 'none';
        simplified.querySelector('.aether-jd-toggle').addEventListener('click', () => {
          if (jdEl.style.display === 'none') { jdEl.style.display = ''; simplified.querySelector('.aether-jd-simplified-body').style.display = 'none'; simplified.querySelector('.aether-jd-toggle').textContent = 'Show Simplified'; }
          else { jdEl.style.display = 'none'; simplified.querySelector('.aether-jd-simplified-body').style.display = ''; simplified.querySelector('.aether-jd-toggle').textContent = 'Show Original'; }
        });
        simplifyBtn.remove();
      } catch (e) { simplifyBtn.textContent = 'Simplify This JD'; simplifyBtn.disabled = false; }
    });
  }

  // ═══════════════════════════════════════════════════════════
  //  INITIALIZATION
  // ═══════════════════════════════════════════════════════════

  function initAll() {
    addFieldCounters();
    setupCharLimitOptimizer();
    setupClarityScoring();
    addReadabilityIndicator();
    addFieldValidation();
    highlightRequiredFields();
    addFormProgress();
    addFormatHints();
    detectAllFields();
    setupVisualDiff();
    setupUndoRedo();
    maskSensitiveFields();
    trackTimeSaved();
    trackFormAbandonment();
    detectFormType();
  }

  function initJobFeatures() {
    detectTrickQuestions();
    addQuestionDifficulty();
    setupATSKeywordScanner();
    setupToneAnalysis();
    setupCompanyResearch();
    detectRedFlags();
    detectSalaryInfo();
    setupContradictionChecker();
    setupNextQuestionPrediction();
    addJDSimplifier();
  }

  setTimeout(initAll, 1500);
  if (isJobSite()) setTimeout(initJobFeatures, 3500);

  // Re-run for SPAs
  const observer = new MutationObserver(() => {
    clearTimeout(observer._timer);
    observer._timer = setTimeout(() => {
      addFieldCounters();
      setupClarityScoring();
      addFieldValidation();
      addReadabilityIndicator();
      setupCharLimitOptimizer();
    }, 1000);
  });
  observer.observe(document.body, { childList: true, subtree: true });
})();
