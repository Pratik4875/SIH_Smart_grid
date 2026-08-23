// @ts-nocheck
import React from 'react';
import { Sun, Battery, HeartPulse, Lightbulb, Droplets, Zap, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import type { TelemetryData, LoadConfig } from '../types';

interface PowerFlowDiagramProps {
  telemetry: TelemetryData | null;
  configs: Record<string, LoadConfig>;
  failureRisk: number;
  isConnected: boolean;
  onToggleLoad?: (id: 'RLY-001' | 'RLY-002' | 'RLY-003', action: 'ON' | 'OFF') => Promise<void>;
}

export const PowerFlowDiagram: React.FC<PowerFlowDiagramProps> = ({
  telemetry,
  configs,
  failureRisk,
  isConnected,
  onToggleLoad
}) => {
  const { colors } = useTheme();

  const solarV = telemetry?.solar.voltage ?? 0;
  const solarW = telemetry?.solar.estimatedPower ?? 0;
  const batteryV = telemetry?.battery.voltage ?? 0;
  const batteryPct = telemetry?.battery.percentage ?? 0;
  const isSolarGenerating = isConnected && solarV > 1.5;

  const loads = telemetry?.loads || [
    { id: 'RLY-001', gpioPin: 26, physicalState: 'OFF' },
    { id: 'RLY-002', gpioPin: 25, physicalState: 'OFF' },
    { id: 'RLY-003', gpioPin: 27, physicalState: 'OFF' }
  ];

  const isLoad1On = isConnected && loads.find((l) => l.id === 'RLY-001')?.physicalState === 'ON';
  const isLoad2On = isConnected && loads.find((l) => l.id === 'RLY-002')?.physicalState === 'ON';
  const isLoad3On = isConnected && loads.find((l) => l.id === 'RLY-003')?.physicalState === 'ON';

  const cfg1 = configs['RLY-001'] || { name: 'Hospital ICU Ventilator', priority: 'CRITICAL', nominalWatts: 0.25 };
  const cfg2 = configs['RLY-002'] || { name: 'Emergency Streetlights', priority: 'MEDIUM', nominalWatts: 0.15 };
  const cfg3 = configs['RLY-003'] || { name: 'Agricultural Water Pump', priority: 'LOW', nominalWatts: 0.20 };

  const totalLoadW = (isLoad1On ? cfg1.nominalWatts : 0) + (isLoad2On ? cfg2.nominalWatts : 0) + (isLoad3On ? cfg3.nominalWatts : 0);
  const netPowerW = solarW - totalLoadW;

  const cardStyle: React.CSSProperties = {
    padding: '24px',
    borderRadius: '16px',
    background: colors.bgCard,
    border: `1px solid ${colors.border}`,
    boxShadow: `0 8px 32px rgba(0,0,0,0.1)`,
    position: 'relative',
    overflow: 'hidden'
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* 1. Top Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
        {[
          { label: 'Generation (PV)', val: solarW.toFixed(2), unit: 'W', icon: Sun, color: '#fbbf24', sub: `${(0.6).toFixed(1)}W Panel @ ${solarV.toFixed(2)}V` },
          { label: 'Battery SoC', val: batteryPct.toString(), unit: '%', icon: Battery, color: '#34d399', sub: `18650 @ ${batteryV.toFixed(2)}V` },
          { label: 'Active Load', val: totalLoadW.toFixed(2), unit: 'W', icon: Activity, color: '#60a5fa', sub: `${[isLoad1On, isLoad2On, isLoad3On].filter(Boolean).length} of 3 ON` },
          { label: 'Net Power', val: (netPowerW > 0 ? '+' : '') + netPowerW.toFixed(2), unit: 'W', icon: Zap, color: netPowerW >= 0 ? '#34d399' : '#f43f5e', sub: netPowerW >= 0 ? 'Charging' : 'Discharging' },
        ].map((m, i) => (
          <div key={i} style={{ padding: '20px', borderRadius: '12px', background: colors.bgCard, border: `1px solid ${colors.border}`, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, right: 0, width: '100px', height: '100px', background: `radial-gradient(circle at top right, ${m.color}15 0%, transparent 70%)` }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: colors.textSecondary }}>{m.label}</span>
              <m.icon style={{ width: '14px', height: '14px', color: m.color }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
              <span style={{ fontSize: '24px', fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: m.color }}>{isConnected ? m.val : '--'}</span>
              <span style={{ fontSize: '12px', fontWeight: 600, color: colors.textMuted }}>{m.unit}</span>
            </div>
            <div style={{ fontSize: '10px', color: colors.textMuted, marginTop: '8px', fontFamily: "'JetBrains Mono', monospace" }}>
              {isConnected ? m.sub : 'Offline'}
            </div>
          </div>
        ))}
      </div>

      {/* 2. Topology Diagram */}
      <div style={{ ...cardStyle }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: colors.text, margin: '0 0 4px 0' }}>Power Flow & Energy Routing</h3>
            <p style={{ fontSize: '11px', color: colors.textSecondary, margin: 0 }}>Real-time energy routing between Solar PV, Battery, and Edge Actuators</p>
          </div>
          <div style={{ padding: '4px 10px', borderRadius: '9999px', background: failureRisk > 50 ? 'rgba(244,63,94,0.1)' : 'rgba(16,185,129,0.1)', border: `1px solid ${failureRisk > 50 ? 'rgba(244,63,94,0.3)' : 'rgba(16,185,129,0.3)'}`, color: failureRisk > 50 ? '#f43f5e' : '#10b981', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: failureRisk > 50 ? '#f43f5e' : '#10b981', animation: 'pulse 2s infinite' }} />
            Grid Strain: {failureRisk}%
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1.2fr)', gap: '24px' }}>
          
          {/* SOURCE */}
          <div style={{ padding: '20px', borderRadius: '12px', background: colors.bgInput, border: `1px solid ${colors.border}`, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <span style={{ fontSize: '10px', fontWeight: 700, color: '#fbbf24', letterSpacing: '0.05em' }}>SOURCE (PV)</span>
              <span style={{ fontSize: '10px', color: colors.textMuted, fontFamily: "'JetBrains Mono', monospace", background: colors.bgCard, padding: '2px 6px', borderRadius: '4px' }}>GPIO 34</span>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <motion.div
                animate={isSolarGenerating ? { boxShadow: ['0 0 0px rgba(251,191,36,0)', '0 0 20px rgba(251,191,36,0.3)', '0 0 0px rgba(251,191,36,0)'] } : {}}
                transition={{ duration: 2, repeat: Infinity }}
                style={{ width: '64px', height: '64px', borderRadius: '16px', background: isSolarGenerating ? 'rgba(251,191,36,0.1)' : colors.bgCardHover, border: `1px solid ${isSolarGenerating ? 'rgba(251,191,36,0.4)' : colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}
              >
                <Sun style={{ width: '32px', height: '32px', color: isSolarGenerating ? '#fbbf24' : colors.textMuted }} />
              </motion.div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: colors.text }}>0.6W Solar Panel</div>
              <div style={{ fontSize: '10px', color: colors.textMuted, marginTop: '4px' }}>33k / 10k Divider (4.3x)</div>
            </div>

            <div style={{ marginTop: '24px', borderTop: `1px solid ${colors.border}`, paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                <span style={{ color: colors.textSecondary }}>Voltage:</span>
                <span style={{ color: colors.text, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>{solarV.toFixed(2)} V</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                <span style={{ color: colors.textSecondary }}>Power:</span>
                <span style={{ color: '#fbbf24', fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>{solarW.toFixed(2)} W</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                <span style={{ color: colors.textSecondary }}>Status:</span>
                <span style={{ color: isSolarGenerating ? '#10b981' : colors.textMuted, fontWeight: 600 }}>{isSolarGenerating ? 'Generating' : 'No Sunlight'}</span>
              </div>
            </div>
          </div>

          {/* STORAGE */}
          <div style={{ padding: '20px', borderRadius: '12px', background: colors.bgInput, border: `1px solid ${colors.border}`, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <span style={{ fontSize: '10px', fontWeight: 700, color: '#34d399', letterSpacing: '0.05em' }}>STORAGE</span>
              <span style={{ fontSize: '10px', color: colors.textMuted, fontFamily: "'JetBrains Mono', monospace", background: colors.bgCard, padding: '2px 6px', borderRadius: '4px' }}>GPIO 35</span>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                <Battery style={{ width: '32px', height: '32px', color: '#34d399' }} />
              </div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: colors.text }}>18650 Battery</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#34d399', fontFamily: "'JetBrains Mono', monospace", margin: '8px 0' }}>{batteryV.toFixed(2)} V</div>
              
              <div style={{ width: '100%', height: '6px', background: colors.bgCardHover, borderRadius: '9999px', overflow: 'hidden', margin: '8px 0' }}>
                <div style={{ width: `${batteryPct}%`, height: '100%', background: '#34d399', borderRadius: '9999px' }} />
              </div>
              <div style={{ fontSize: '10px', color: colors.textMuted }}>SoC: {batteryPct}%</div>
            </div>

            <div style={{ marginTop: '24px', borderTop: `1px solid ${colors.border}`, paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                <span style={{ color: colors.textSecondary }}>Safe Range:</span>
                <span style={{ color: colors.text, fontFamily: "'JetBrains Mono', monospace" }}>3.20V - 4.20V</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                <span style={{ color: colors.textSecondary }}>Loop Time:</span>
                <span style={{ color: '#10b981', fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>3000 ms</span>
              </div>
            </div>
          </div>

          {/* ACTUATORS */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ fontSize: '10px', fontWeight: 700, color: '#60a5fa', letterSpacing: '0.05em', marginBottom: '4px' }}>ACTUATORS</div>
            
            {[
              { id: 'RLY-001', icon: HeartPulse, cfg: cfg1, isOn: isLoad1On, gpio: 26 },
              { id: 'RLY-002', icon: Lightbulb, cfg: cfg2, isOn: isLoad2On, gpio: 25 },
              { id: 'RLY-003', icon: Droplets, cfg: cfg3, isOn: isLoad3On, gpio: 27 },
            ].map((load) => (
              <div key={load.id} style={{ padding: '16px', borderRadius: '12px', background: colors.bgInput, border: `1px solid ${load.isOn ? colors.accentGlow : colors.border}`, display: 'flex', alignItems: 'center', gap: '16px', transition: 'all 0.2s', boxShadow: load.isOn ? `0 0 16px ${colors.accentBg}` : 'none' }}>
                <div style={{ padding: '8px', borderRadius: '8px', background: load.isOn ? 'rgba(16,185,129,0.1)' : 'rgba(244,63,94,0.1)', color: load.isOn ? '#10b981' : '#f43f5e', flexShrink: 0 }}>
                  <load.icon style={{ width: '16px', height: '16px' }} />
                </div>
                
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: colors.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{load.cfg.name}</div>
                  <div style={{ fontSize: '9px', color: colors.textMuted, fontFamily: "'JetBrains Mono', monospace", marginTop: '2px' }}>
                    {load.id} (GPIO {load.gpio})
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                  <span style={{ fontSize: '9px', fontWeight: 700, color: load.isOn ? '#10b981' : colors.textMuted, padding: '2px 6px', borderRadius: '4px', background: colors.bgCard }}>
                    {load.isOn ? 'ACTIVE' : 'SHED'}
                  </span>
                  {onToggleLoad && (
                    <button
                      onClick={() => onToggleLoad(load.id as 'RLY-001'|'RLY-002'|'RLY-003', load.isOn ? 'OFF' : 'ON')}
                      style={{
                        position: 'relative', width: '36px', height: '20px', borderRadius: '9999px',
                        background: load.isOn ? colors.accent : colors.bgCard,
                        border: `1px solid ${load.isOn ? colors.accent : colors.border}`,
                        cursor: 'pointer', transition: 'all 0.2s'
                      }}
                    >
                      <span style={{
                        position: 'absolute', top: '1px', left: load.isOn ? '17px' : '1px',
                        width: '16px', height: '16px', borderRadius: '50%', background: '#fff',
                        transition: 'all 0.2s'
                      }} />
                    </button>
                  )}
                </div>
              </div>
            ))}

            <div style={{ marginTop: 'auto', padding: '16px', borderRadius: '12px', background: colors.bgInput, border: `1px solid ${colors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', color: colors.textSecondary }}>Total Load:</span>
              <span style={{ fontSize: '14px', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: colors.text }}>{totalLoadW.toFixed(2)} W</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
