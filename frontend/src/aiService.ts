import { getSavedAiConfig } from './aiConfig';
import type { TelemetryData } from './types';

export async function askGridBot(
  prompt: string,
  telemetry: TelemetryData | null
): Promise<{ text: string }> {
  const config = getSavedAiConfig();

  const systemPrompt = `You are GridBot, an intelligent microgrid management AI for the "SolarGrid Microgrid OS" project (SIH 2026).
Your job is to advise the user on microgrid operations, load shedding, and respond to their scenarios (e.g., storms, night time, low battery). 
You control 3 hardware relays. 

Current Telemetry:
${telemetry ? `- Battery: ${telemetry.battery.voltage}V (${telemetry.battery.percentage}%)
- Solar PV: ${telemetry.solar.voltage}V
- Environment: ${telemetry.environment.temperature}°C, ${telemetry.environment.humidity}% Humidity` : 'No live telemetry connected.'}

Answer concisely, act as a helpful AI assistant, and provide recommendations based on the scenario. If the user just says hello or asks non-energy questions, politely redirect them or answer briefly if appropriate.`;

  let geminiError = "Key not configured";
  let groqError = "Key not configured";

  // 1. Try Gemini First
  if (config.geminiApiKey) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${config.geminiApiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${systemPrompt}\n\nUser: ${prompt}` }] }]
        })
      });
      
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`HTTP ${res.status}: ${errText}`);
      }
      
      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return { text: `✨ (Gemini)\n${text}` };
      
    } catch (e: any) {
      console.warn("Gemini request failed, falling back to Groq...", e);
      geminiError = e.message || String(e);
    }
  }

  // 2. Try Groq Fallback (support old grokApiKey from localStorage if present)
  const groqKey = config.groqApiKey || (config as any).grokApiKey;
  if (groqKey) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${groqKey}`
        },
        body: JSON.stringify({
          model: 'openai/gpt-oss-20b',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
          ]
        })
      });
      
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`HTTP ${res.status}: ${errText}`);
      }
      
      const data = await res.json();
      const text = data.choices?.[0]?.message?.content;
      if (text) return { text: `⚡ (Groq)\n${text}` };
      
    } catch (e: any) {
      console.warn("Groq request failed...", e);
      groqError = e.message || String(e);
    }
  }

  return { 
    text: `❌ **API Failure Diagnostics:**\n\n**Gemini Error:** ${geminiError}\n\n**Groq Error:** ${groqError}\n\nPlease check your browser console or ensure you have entered valid API keys in the settings.` 
  };
}
