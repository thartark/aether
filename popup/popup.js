document.getElementById('open-side').addEventListener('click', () => {
  chrome.sidePanel.open({ windowId: chrome.windows.WINDOW_ID_CURRENT });
});

document.getElementById('theme-toggle').addEventListener('click', () => {
  let cur = localStorage.getItem('aetherTheme') || 'system';
  const next = cur === 'system' ? 'dark' : cur === 'dark' ? 'light' : 'system';
  localStorage.setItem('aetherTheme', next);
  location.reload(); // crude but works for popup
});

document.getElementById('tone-select').addEventListener('change', e => {
  chrome.storage.local.set({ 'profile.tone': e.target.value });
});

chrome.storage.local.get('profile', data => {
  const tone = data.profile?.tone || 'professional';
  document.getElementById('tone-select').value = tone;
});
