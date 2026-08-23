import { getSavedAiConfig } from './aiConfig';
import { evaluateMicrogrid } from './utils/aiEngine';
import type { OptimizationResult } from './utils/aiEngine';
import type { TelemetryData, LoadConfig } from './types';

export async function askGridBot(
  prompt: string,
  telemetry: TelemetryData | null,
  loadConfigs: Record<string, LoadConfig>,
  batteryHistory: { timestamp: number; voltage: number }[]
): Promise<{ text: string; relayPlan?: OptimizationResult }> {
  
  const config = getSavedAiConfig();
  const fallbackPlan = telemetry ? evaluateMicrogrid(telemetry, loadConfigs, batteryHistory) : undefined;
  
  const systemPrompt = `You are GridBot, an AI specialized in microgrid management and project explanation.
You control 3 hardware relays for load shedding to prevent battery depletion in a solar microgrid.
You represent the "SolarGrid Microgrid OS" project for SIH 2026. If the user asks you to explain the project or the UI, act as a helpful guide outlining how we use ESP32, Firebase RTDB, and AI (Gemini/Grok) to build a robust microgrid controller.
Current state:
${telemetry ? `Battery: ${telemetry.battery.voltage}V (${telemetry.battery.percentage}%)
Solar: ${telemetry.solar.voltage}V
Temperature: ${telemetry.environment.temperature}°C, Humidity: ${telemetry.environment.humidity}%` : 'No live data.'}

Answer the user's scenario. Be concise but highly knowledgeable.
Fallback AI suggests: ${fallbackPlan?.justificationLog.actionTaken} - ${fallbackPlan?.justificationLog.justificationReason}`;

  // 1. Try Gemini
  if (config.geminiApiKey) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${config.geminiApiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${systemPrompt}\n\nUser: ${prompt}` }] }]
        })
      });
      if (res.ok) {
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return { text: `✨ (Gemini)\n${text}`, relayPlan: fallbackPlan };
      }
    } catch (e) {
      console.warn("Gemini failed, trying Grok...", e);
    }
  }

  // 2. Try Grok
  if (config.grokApiKey) {
    try {
      const res = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.grokApiKey}`
        },
        body: JSON.stringify({
          model: 'grok-beta',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
          ]
        })
      });
      if (res.ok) {
        const data = await res.json();
        const text = data.choices?.[0]?.message?.content;
        if (text) return { text: `🦊 (Grok)\n${text}`, relayPlan: fallbackPlan };
      }
    } catch (e) {
      console.warn("Grok failed, using local fallback...", e);
    }
  }

  // 3. Local Fallback
  if (fallbackPlan) {
    return {
      text: `⚡ (Local AI)\n**Fallback Analysis:**\n${fallbackPlan.justificationLog.justificationReason}\nFailure Risk: ${fallbackPlan.failureRiskPercent}%\nEst. Time to Depletion: ${fallbackPlan.justificationLog.estimatedTimeToDepletionMins} mins.`,
      relayPlan: fallbackPlan
    };
  }

  return { text: "I'm offline and have no telemetry data to perform a local fallback analysis." };
}
