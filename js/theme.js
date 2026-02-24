function applyTheme() {
  const root = document.documentElement;
  const saved = localStorage.getItem('aetherTheme') || 'system';
  
  if (saved === 'dark' || (saved === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

window.addEventListener('load', applyTheme);
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme);
