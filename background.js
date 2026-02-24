console.log('✅ Aether background service worker running');

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getApiKey") {
    chrome.storage.local.get('groqApiKey', data => sendResponse({ key: data.groqApiKey }));
    return true; // async
  }
});
