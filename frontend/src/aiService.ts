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
        throw new Error(`Gemini API Error: ${res.status}`);
      }
      
      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return { text: `✨ (Gemini)\n${text}` };
      
    } catch (e) {
      console.warn("Gemini request failed, falling back to Groq...", e);
    }
  }

  // 2. Try Groq Fallback
  if (config.groqApiKey) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.groqApiKey}`
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
          ]
        })
      });
      
      if (!res.ok) {
        throw new Error(`Groq API Error: ${res.status}`);
      }
      
      const data = await res.json();
      const text = data.choices?.[0]?.message?.content;
      if (text) return { text: `⚡ (Groq)\n${text}` };
      
    } catch (e) {
      console.warn("Groq request failed...", e);
    }
  }

  return { text: "Cloud AI APIs are not configured or both failed to respond. Please check your API keys in the settings and ensure you have not hit rate limits." };
}
