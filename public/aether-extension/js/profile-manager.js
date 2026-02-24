/* ============================================================
   Aether - Profile Manager
   Manages personal knowledge vault, STAR examples, writing
   samples, and passive profile learning.
   ============================================================ */

const AetherProfile = (() => {
  const DEFAULT_PROFILE = {
    name: '', title: '', skills: '', experience: '', education: '',
    achievements: '', bio: '', industries: '', certifications: '',
    linkedinUrl: '', portfolioUrl: '',
    starExamples: [], writingSamples: [],
    learnedPatterns: { toneFrequencies: {}, topicExpertise: {}, vocabularyLevel: 'standard' },
  };

  async function get() {
    const { profile } = await chrome.storage.local.get(['profile']);
    return { ...DEFAULT_PROFILE, ...(profile || {}) };
  }

  async function save(data) {
    const existing = await get();
    const merged = { ...existing, ...data };
    await chrome.storage.local.set({ profile: merged });
    return merged;
  }

  async function addStarExample(example) {
    const profile = await get();
    if (!profile.starExamples) profile.starExamples = [];
    profile.starExamples.push({ ...example, addedAt: Date.now() });
    await chrome.storage.local.set({ profile });
    return profile.starExamples;
  }

  async function removeStarExample(index) {
    const profile = await get();
    if (profile.starExamples) {
      profile.starExamples.splice(index, 1);
      await chrome.storage.local.set({ profile });
    }
    return profile.starExamples || [];
  }

  async function addWritingSample(sample) {
    const profile = await get();
    if (!profile.writingSamples) profile.writingSamples = [];
    profile.writingSamples.push({ text: sample, addedAt: Date.now() });
    if (profile.writingSamples.length > 10) profile.writingSamples = profile.writingSamples.slice(-10);
    await chrome.storage.local.set({ profile });
    return profile.writingSamples;
  }

  // Passive learning: track what tone/topics the user edits toward
  async function learnFromEdit(original, edited) {
    const profile = await get();
    const patterns = profile.learnedPatterns || { toneFrequencies: {}, topicExpertise: {}, vocabularyLevel: 'standard' };

    // Simple heuristics for tone detection
    const formalWords = ['furthermore', 'consequently', 'pursuant', 'notwithstanding', 'heretofore'];
    const casualWords = ['yeah', 'gonna', 'kinda', 'tbh', 'lol', 'btw'];
    const editLower = edited.toLowerCase();
    const hasFormal = formalWords.some(w => editLower.includes(w));
    const hasCasual = casualWords.some(w => editLower.includes(w));
    if (hasFormal) patterns.toneFrequencies.formal = (patterns.toneFrequencies.formal || 0) + 1;
    if (hasCasual) patterns.toneFrequencies.casual = (patterns.toneFrequencies.casual || 0) + 1;
    if (!hasFormal && !hasCasual) patterns.toneFrequencies.professional = (patterns.toneFrequencies.professional || 0) + 1;

    // Vocabulary level based on average word length
    const avgWordLen = edited.split(/\s+/).reduce((a, w) => a + w.length, 0) / Math.max(1, edited.split(/\s+/).length);
    if (avgWordLen > 6) patterns.vocabularyLevel = 'advanced';
    else if (avgWordLen > 4.5) patterns.vocabularyLevel = 'standard';
    else patterns.vocabularyLevel = 'simple';

    profile.learnedPatterns = patterns;
    await chrome.storage.local.set({ profile });
  }

  // Get the user's preferred tone based on learning
  function getPreferredTone(patterns) {
    if (!patterns?.toneFrequencies) return 'professional';
    const entries = Object.entries(patterns.toneFrequencies);
    if (!entries.length) return 'professional';
    entries.sort((a, b) => b[1] - a[1]);
    return entries[0][0];
  }

  // Build a context string from the profile for AI prompts
  async function buildContext(template) {
    const profile = await get();
    let ctx = '';
    if (profile.name) ctx += `Name: ${profile.name}\n`;
    if (profile.title) ctx += `Title: ${profile.title}\n`;
    if (profile.industries) ctx += `Industries: ${profile.industries}\n`;
    if (profile.skills) ctx += `Skills: ${profile.skills}\n`;
    if (profile.experience) ctx += `Experience: ${profile.experience}\n`;
    if (profile.education) ctx += `Education: ${profile.education}\n`;
    if (profile.certifications) ctx += `Certifications: ${profile.certifications}\n`;
    if (profile.achievements) ctx += `Achievements: ${profile.achievements}\n`;
    if (profile.bio) ctx += `Bio: ${profile.bio}\n`;

    // Include STAR examples for job-related templates
    if (['job-application', 'star-method', 'cover-letter'].includes(template) && profile.starExamples?.length) {
      ctx += '\nSTAR Examples:\n';
      profile.starExamples.forEach((ex, i) => {
        ctx += `${i + 1}. [${ex.category}] S: ${ex.situation} | T: ${ex.task} | A: ${ex.action} | R: ${ex.result}\n`;
      });
    }

    return ctx || '';
  }

  // Calculate profile completeness (for gamification)
  async function getCompleteness() {
    const profile = await get();
    const fields = ['name', 'title', 'skills', 'experience', 'education', 'achievements', 'bio'];
    const filled = fields.filter(f => profile[f] && profile[f].trim().length > 0).length;
    const hasStar = profile.starExamples?.length > 0 ? 1 : 0;
    return Math.round(((filled + hasStar) / (fields.length + 1)) * 100);
  }

  return { get, save, addStarExample, removeStarExample, addWritingSample, learnFromEdit, getPreferredTone, buildContext, getCompleteness };
})();
