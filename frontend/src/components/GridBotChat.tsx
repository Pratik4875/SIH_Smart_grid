// @ts-nocheck
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { askGridBot } from '../aiService';
import type { TelemetryData, LoadConfig } from '../types';
import type { OptimizationResult } from '../utils/aiEngine';

interface ChatMessage {
  id: string;
  role: 'user' | 'bot';
  text: string;
  timestamp: number;
  relayPlan?: OptimizationResult;
}

interface GridBotChatProps {
  loadConfigs: Record<string, LoadConfig>;
  batteryHistory: { timestamp: number; voltage: number }[];
  isConnected: boolean;
  onApplyToHardware?: (commands: { target: 'RLY-001' | 'RLY-002' | 'RLY-003'; action: 'ON' | 'OFF' }[]) => Promise<void>;
}

const ENERGY_KEYWORDS = ['battery', 'solar', 'relay', 'power', 'load', 'shed', 'storm', 'night', 'rain', 'energy', 'grid', 'voltage', 'watt', 'charge', 'discharge', 'icu', 'hospital', 'pump', 'light', 'street', 'emergency', 'critical', 'brownout', 'blackout', 'outage', 'panel', 'esp32', 'microgrid', 'renewable', 'actuator', 'mosfet', 'temperature', 'humidity', 'cloudy', 'sunny', 'peak'];

function isOnTopic(text: string): boolean {
  const lower = text.toLowerCase();
  return ENERGY_KEYWORDS.some(kw => lower.includes(kw));
}

function parseScenario(text: string): { battV: number; solarV: number; temp: number; humidity: number } {
  const lower = text.toLowerCase();
  let battV = 3.7, solarV = 3.0, temp = 28, humidity = 50;

  if (lower.includes('low battery') || lower.includes('battery is low') || lower.includes('dying') || lower.includes('20%') || lower.includes('30%')) battV = 3.25;
  else if (lower.includes('critical') || lower.includes('almost dead') || lower.includes('10%') || lower.includes('5%')) battV = 3.1;
  else if (lower.includes('full') || lower.includes('100%') || lower.includes('90%')) battV = 4.15;

  if (lower.includes('storm') || lower.includes('heavy rain') || lower.includes('thunder')) { solarV = 0.1; humidity = 95; temp = 18; }
  else if (lower.includes('rain') || lower.includes('cloudy') || lower.includes('overcast')) { solarV = 0.8; humidity = 80; temp = 22; }
  else if (lower.includes('night') || lower.includes('dark') || lower.includes('no sun') || lower.includes('midnight')) { solarV = 0.0; humidity = 55; temp = 20; }
  else if (lower.includes('peak') || lower.includes('sunny') || lower.includes('bright') || lower.includes('noon') || lower.includes('afternoon')) { solarV = 4.5; humidity = 35; temp = 38; }

  const battMatch = lower.match(/battery.*?(\d+)%/);
  if (battMatch) {
    const pct = parseInt(battMatch[1]);
    battV = 3.0 + (pct / 100) * 1.2;
  }

  return { battV, solarV, temp, humidity };
}

function buildSimTelemetry(params: { battV: number; solarV: number; temp: number; humidity: number }): TelemetryData {
  const solarPower = params.solarV > 1.5 ? (params.solarV * 0.12) : 0;
  const battPct = Math.round(Math.min(100, Math.max(0, ((params.battV - 3.0) / 1.2) * 100)));
  return {
    timestamp: Math.floor(Date.now() / 1000),
    deviceId: 'GRIDBOT-SIM',
    firmwareVersion: 'v2.0-sim',
    battery: { voltage: params.battV, percentage: battPct },
    solar: { voltage: params.solarV, estimatedPower: solarPower },
    environment: { temperature: params.temp, humidity: params.humidity },
    loads: [
      { id: 'RLY-001', gpioPin: 26, physicalState: 'ON' },
      { id: 'RLY-002', gpioPin: 25, physicalState: 'ON' },
      { id: 'RLY-003', gpioPin: 27, physicalState: 'ON' },
    ]
  };
}

export const GridBotChat: React.FC<GridBotChatProps> = ({ loadConfigs, batteryHistory, isConnected, onApplyToHardware }) => {
  const { colors } = useTheme();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'bot',
      text: "⚡ Hi! I'm **GridBot**, your microgrid AI assistant powered by Gemini. Describe a scenario (e.g. storm, night, low battery) and I'll analyze how the microgrid should respond.",
      timestamp: Date.now()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const presets = [
    { label: '🌩️ Storm approaching', prompt: 'A severe storm is approaching with heavy rain. Battery is at 40% and dropping.' },
    { label: '🌙 Midnight', prompt: 'It\'s midnight with zero solar input. Battery is at 55%.' },
    { label: '🔋 Critical Battery', prompt: 'Battery is critically low at 15%. Which loads should be shed?' },
  ];

  const handleSend = async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg) return;

    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: 'user', text: msg, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    let botResponse: ChatMessage;

    const params = parseScenario(msg);
    const simTelemetry = buildSimTelemetry(params);
    
    const { text: responseText, relayPlan } = await askGridBot(msg, simTelemetry, loadConfigs, batteryHistory);

      let actionText = '';
      let shedText = '';

      if (relayPlan) {
        actionText = relayPlan.commandsToDispatch.length > 0
          ? `\n\n**🔌 Relay Actions:**\n${relayPlan.commandsToDispatch.map(c => `• **${c.target}** → ${c.action}`).join('\n')}`
          : '\n\n**✅ No relay changes needed** — all loads can continue safely.';

        const shedNames = relayPlan.commandsToDispatch
          .filter(c => c.action === 'OFF')
          .map(c => loadConfigs[c.target]?.name || c.target);

        shedText = shedNames.length > 0 ? `\n\nLoads being shed: ${shedNames.join(', ')}` : '';
      }

      botResponse = {
        id: `b-${Date.now()}`,
        role: 'bot',
        text: responseText + actionText,
        timestamp: Date.now(),
        relayPlan: relayPlan
      };

    setMessages(prev => [...prev, botResponse]);
    setIsTyping(false);
  };

  const formatMessage = (text: string) => {
    return text.split('\n').map((line, i) => {
      const parts = line.split(/(\*\*.*?\*\*)/g);
      return (
        <div key={i} style={{ marginBottom: line === '' ? '8px' : '2px' }}>
          {parts.map((part, j) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={j} style={{ color: colors.text, fontWeight: 700 }}>{part.slice(2, -2)}</strong>;
            }
            return <span key={j}>{part}</span>;
          })}
        </div>
      );
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 200px)', minHeight: '500px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h2 style={{ fontSize: '15px', fontWeight: 700, color: colors.text, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bot style={{ width: '20px', height: '20px', color: colors.accent }} />
            GridBot AI — Scenario Advisor
          </h2>
          <p style={{ fontSize: '11px', color: colors.textSecondary, margin: '4px 0 0 0' }}>
            Powered by Gemini & Grok with local edge-fallback
          </p>
        </div>
      </div>

      {/* Preset Chips */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
        {presets.map((p, i) => (
          <button
            key={i}
            onClick={() => handleSend(p.prompt)}
            style={{
              padding: '6px 14px', borderRadius: '9999px', fontSize: '12px', fontWeight: 600,
              background: colors.bgCard, border: `1px solid ${colors.border}`, color: colors.textSecondary,
              cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = colors.accent; e.currentTarget.style.color = colors.accent; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = colors.border; e.currentTarget.style.color = colors.textSecondary; }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Chat Area */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '16px',
        background: colors.bgCard, borderRadius: '14px',
        border: `1px solid ${colors.border}`,
        display: 'flex', flexDirection: 'column', gap: '12px'
      }}>
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              style={{ display: 'flex', gap: '10px', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}
            >
              {msg.role === 'bot' && (
                <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: colors.accentBg, border: `1px solid ${colors.borderAccent}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Bot style={{ width: '14px', height: '14px', color: colors.accent }} />
                </div>
              )}
              <div style={{
                maxWidth: '75%', padding: '12px 16px', borderRadius: '12px',
                fontSize: '13px', lineHeight: 1.6, color: colors.textSecondary,
                background: msg.role === 'user' ? colors.accent + '18' : colors.bgCardHover,
                border: `1px solid ${msg.role === 'user' ? colors.borderAccent : colors.border}`
              }}>
                {formatMessage(msg.text)}

                {msg.relayPlan && msg.relayPlan.commandsToDispatch.length > 0 && onApplyToHardware && isConnected && (
                  <button
                    onClick={() => onApplyToHardware(msg.relayPlan!.commandsToDispatch)}
                    style={{
                      marginTop: '12px', padding: '8px 16px', borderRadius: '8px',
                      background: colors.accent, color: '#000', fontSize: '12px', fontWeight: 700,
                      border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                      boxShadow: `0 0 20px ${colors.accentGlow}`
                    }}
                  >
                    <Zap style={{ width: '14px', height: '14px' }} />
                    Apply to Hardware
                  </button>
                )}
              </div>
              {msg.role === 'user' && (
                <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <User style={{ width: '14px', height: '14px', color: '#818cf8' }} />
                </div>
              )}
            </motion.div>
          ))}
          {isTyping && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', gap: '10px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: colors.accentBg, border: `1px solid ${colors.borderAccent}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bot style={{ width: '14px', height: '14px', color: colors.accent }} />
              </div>
              <div style={{ padding: '12px 16px', borderRadius: '12px', background: colors.bgCardHover, border: `1px solid ${colors.border}`, color: colors.textMuted, fontSize: '13px' }}>
                GridBot is thinking...
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !isTyping && handleSend()}
          placeholder="Describe a scenario..."
          disabled={isTyping}
          style={{
            flex: 1, padding: '12px 16px', borderRadius: '12px', fontSize: '13px',
            background: colors.bgInput, border: `1px solid ${colors.border}`, color: colors.text,
            outline: 'none', fontFamily: "'Inter', system-ui, sans-serif",
            opacity: isTyping ? 0.5 : 1
          }}
        />
        <button
          onClick={() => handleSend()}
          disabled={isTyping || !input.trim()}
          style={{
            padding: '12px 20px', borderRadius: '12px',
            background: (isTyping || !input.trim()) ? colors.bgCard : colors.accent,
            color: (isTyping || !input.trim()) ? colors.textMuted : '#000',
            fontWeight: 700, fontSize: '13px', border: `1px solid ${(isTyping || !input.trim()) ? colors.border : 'transparent'}`,
            cursor: (isTyping || !input.trim()) ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', gap: '6px',
            boxShadow: (isTyping || !input.trim()) ? 'none' : `0 0 16px ${colors.accentGlow}`
          }}
        >
          <Send style={{ width: '14px', height: '14px' }} />
        </button>
      </div>
    </div>
  );
};
