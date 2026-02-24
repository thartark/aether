const Profile = {
  async get() {
    const data = await chrome.storage.local.get('profile');
    return data.profile || { tone: 'professional', history: [], vault: [] };
  },
  async save(profile) {
    await chrome.storage.local.set({ profile });
  },
  async addAnswer(answer, variants = []) {
    const p = await this.get();
    p.history.unshift({ text: answer.slice(0,200)+'...', variants, timestamp: Date.now(), rating: 0 });
    if (p.history.length > 50) p.history.pop();
    await this.save(p);
  }
};
window.Profile = Profile;
