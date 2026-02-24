/* ============================================================
   Aether - Theme Manager
   Handles dark/light/system theme detection and switching
   ============================================================ */

const AetherTheme = (() => {
  const THEMES = ['dark', 'light', 'system'];
  let current = 'system';

  function apply(theme) {
    current = theme || 'system';
    if (current === 'light') document.body.setAttribute('data-theme', 'light');
    else if (current === 'dark') document.body.removeAttribute('data-theme');
    else {
      if (window.matchMedia('(prefers-color-scheme: light)').matches) document.body.setAttribute('data-theme', 'light');
      else document.body.removeAttribute('data-theme');
    }
  }

  function cycle() {
    const idx = THEMES.indexOf(current);
    const next = THEMES[(idx + 1) % THEMES.length];
    return next;
  }

  async function load() {
    try {
      const { settings } = await chrome.storage.local.get(['settings']);
      apply(settings?.theme || 'system');
    } catch { apply('system'); }
  }

  async function save(theme) {
    const { settings } = await chrome.storage.local.get(['settings']);
    const s = settings || {};
    s.theme = theme;
    await chrome.storage.local.set({ settings: s });
    apply(theme);
    return theme;
  }

  // Auto-update on system theme change
  if (typeof window !== 'undefined') {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (current === 'system') apply('system');
    });
  }

  return { apply, cycle, load, save, get: () => current, THEMES };
})();
