export const DEFAULT_AI_CONFIG = {
  geminiApiKey: import.meta.env.VITE_GEMINI_API_KEY || "",
  grokApiKey: import.meta.env.VITE_GROK_API_KEY || "",
};

export function getSavedAiConfig() {
  const saved = localStorage.getItem('sih_ai_config');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      // fallback
    }
  }
  return DEFAULT_AI_CONFIG;
}

export function saveAiConfig(config: typeof DEFAULT_AI_CONFIG) {
  localStorage.setItem('sih_ai_config', JSON.stringify(config));
}
