import React from 'react';
import { Battery, Sun, Activity, Thermometer, Droplets } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import type { TelemetryData } from '../types';

interface TelemetryGaugesProps {
  telemetry: TelemetryData | null;
  failureRisk: number;
  isConnected: boolean;
}

export const TelemetryGauges: React.FC<TelemetryGaugesProps> = ({ telemetry, failureRisk, isConnected }) => {
  const { colors } = useTheme();
  const hasData = isConnected && telemetry !== null;

  const batteryV = hasData ? telemetry.battery.voltage : null;
  const batteryPct = hasData ? telemetry.battery.percentage : null;
  const solarV = hasData ? telemetry.solar.voltage : null;
  const solarW = hasData ? telemetry.solar.estimatedPower : null;
  const temp = hasData ? telemetry.environment.temperature : null;
  const humidity = hasData ? telemetry.environment.humidity : null;

  const GaugeCard = ({ title, value, unit, icon, color, sub, pct }: any) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      style={{
        padding: '24px', borderRadius: '16px', background: colors.bgCard,
        border: `1px solid ${colors.border}`, position: 'relative', overflow: 'hidden',
        boxShadow: `0 8px 32px rgba(0,0,0,0.1)`, display: 'flex', flexDirection: 'column'
      }}
    >
      <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '100px', height: '100px', background: `radial-gradient(circle, ${color}20 0%, transparent 70%)` }} />
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', zIndex: 1 }}>
        <span style={{ fontSize: '13px', fontWeight: 700, color: colors.textSecondary }}>{title}</span>
        <div style={{ padding: '8px', borderRadius: '10px', background: `${color}15`, color: color, border: `1px solid ${color}30` }}>
          {icon}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', zIndex: 1, flex: 1 }}>
        <span style={{ fontSize: '36px', fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: colors.text }}>
          {value !== null ? value : '--'}
        </span>
        <span style={{ fontSize: '14px', fontWeight: 600, color: colors.textMuted }}>{unit}</span>
      </div>

      {pct !== undefined && (
        <div style={{ width: '100%', height: '4px', background: colors.bgInput, borderRadius: '9999px', marginTop: '16px', overflow: 'hidden', zIndex: 1 }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            style={{ height: '100%', background: color, borderRadius: '9999px' }}
          />
        </div>
      )}

      {sub && (
        <div style={{ fontSize: '11px', color: colors.textMuted, marginTop: pct !== undefined ? '8px' : '16px', fontFamily: "'JetBrains Mono', monospace", zIndex: 1 }}>
          {sub}
        </div>
      )}
    </motion.div>
  );

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
      <GaugeCard
        title="Battery SoC"
        value={batteryPct}
        unit="%"
        pct={batteryPct || 0}
        icon={<Battery style={{ width: '18px', height: '18px' }} />}
        color="#34d399"
        sub={batteryV !== null ? `${batteryV.toFixed(2)}V (18650 Cell)` : 'Offline'}
      />
      <GaugeCard
        title="Solar Harvesting"
        value={solarW !== null ? solarW.toFixed(2) : null}
        unit="W"
        pct={(solarW || 0) / 0.6 * 100} // Assuming 0.6W max
        icon={<Sun style={{ width: '18px', height: '18px' }} />}
        color="#fbbf24"
        sub={solarV !== null ? `${solarV.toFixed(2)}V PV Output` : 'Offline'}
      />
      <GaugeCard
        title="Grid Temperature"
        value={temp !== null ? temp.toFixed(1) : null}
        unit="°C"
        pct={(temp || 0) / 50 * 100} // Assuming 50C max
        icon={<Thermometer style={{ width: '18px', height: '18px' }} />}
        color="#fb7185"
        sub="DHT11 Edge Sensor"
      />
      <GaugeCard
        title="Relative Humidity"
        value={humidity !== null ? humidity.toFixed(0) : null}
        unit="%"
        pct={humidity || 0}
        icon={<Droplets style={{ width: '18px', height: '18px' }} />}
        color="#60a5fa"
        sub="DHT11 Edge Sensor"
      />
    </div>
  );
};
