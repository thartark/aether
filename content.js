// ... (keep previous floating toolbar + panel logic)

let suggestBox = null;

function showToast(msg, duration = 1800) {
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.classList.add('show'), 100);
  setTimeout(() => {
    t.classList.remove('show');
    setTimeout(() => t.remove(), 400);
  }, duration);
}

// Improved insert with char limit check
function smartInsert(text) {
  const el = document.activeElement;
  if (!el || !['TEXTAREA','INPUT'].includes(el.tagName)) return false;

  const max = el.maxLength > 0 ? el.maxLength : Infinity;
  let current = el.value || '';
  let toAdd = text;

  if (current.length + text.length > max) {
    toAdd = text.slice(0, max - current.length - 3) + '...';
    showToast(`Truncated to fit ${max} char limit`);
  }

  el.value = current + '\n\n' + toAdd;
  el.dispatchEvent(new Event('input', {bubbles:true}));
  el.focus();
  return true;
}

// Inline suggestion on focus (very basic — expand later with debounce)
document.addEventListener('focusin', e => {
  const el = e.target;
  if (el.tagName !== 'TEXTAREA' && !(el.tagName === 'INPUT' && ['text','email'].includes(el.type))) return;

  if (suggestBox) suggestBox.remove();
  suggestBox = document.createElement('div');
  suggestBox.className = 'inline-suggest';
  suggestBox.textContent = 'Aether hint: Start typing your intent... (Ctrl+Shift+A to generate)';
  const rect = el.getBoundingClientRect();
  suggestBox.style.left = `${rect.left + window.scrollX}px`;
  suggestBox.style.top = `${rect.bottom + window.scrollY + 6}px`;
  document.body.appendChild(suggestBox);
});

document.addEventListener('focusout', () => {
  if (suggestBox) suggestBox.remove();
});

// Update insert button logic (in panel)
 // ... in showAetherPanel() after AI call:
document.getElementById('insert-btn').addEventListener('click', () => {
  if (smartInsert(result.best || '')) {
    showToast('✅ Inserted successfully');
  } else {
    showToast('Click into a text field first');
  }
});

// Add side panel open from toolbar or shortcut
toolbar?.addEventListener('contextmenu', e => {
  e.preventDefault();
  chrome.sidePanel.open({ windowId: chrome.windows.WINDOW_ID_CURRENT });
  showToast('Side panel opened');
});

// ... rest remains similar
// In showAetherPanel() after result:
result.justification += "<br><br><em>Predicted next question:</em> What is your availability? (stub)";

// ARIA for panel
panel.setAttribute('role', 'dialog');
panel.setAttribute('aria-labelledby', 'aether-title');
