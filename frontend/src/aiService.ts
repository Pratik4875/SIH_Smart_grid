import { getSavedAiConfig } from './aiConfig';
import type { TelemetryData } from './types';

export async function askGridBot(
  prompt: string,
  telemetry: TelemetryData | null,
  history: any[] = []
): Promise<{ text: string }> {
  const config = getSavedAiConfig();

  const systemPrompt = `You are GridBot, an intelligent microgrid management AI for the "SolarGrid Microgrid OS" project (SIH 2026).
Your job is to advise the user on microgrid operations, load shedding, and respond to their scenarios (e.g., storms, night time, low battery). 
You control 3 hardware relays. 

If the user asks you to assign appliances or relays (e.g. Fridge, AC, Monitor), you MUST append a JSON block at the very end of your response exactly like this:
\`\`\`json
{
  "configUpdate": {
    "RLY-001": { "name": "Appliance 1", "priority": "CRITICAL", "nominalWatts": 150 },
    "RLY-002": { "name": "Appliance 2", "priority": "LOW", "nominalWatts": 1000 },
    "RLY-003": { "name": "Appliance 3", "priority": "MEDIUM", "nominalWatts": 50 }
  }
}
\`\`\`

If you recommend turning any relays ON or OFF to manage load, you MUST append a JSON block exactly like this:
\`\`\`json
{
  "relayPlan": {
    "commandsToDispatch": [
      { "target": "RLY-001", "action": "OFF" },
      { "target": "RLY-002", "action": "ON" }
    ]
  }
}
\`\`\`
(You can output both configUpdate and relayPlan in the same JSON object if needed).

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
      const geminiHistory = history.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
      }));
      
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${config.geminiApiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [
            ...geminiHistory,
            { role: 'user', parts: [{ text: prompt }] }
          ]
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
      const groqHistory = history.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.text
      }));

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
            ...groqHistory,
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
