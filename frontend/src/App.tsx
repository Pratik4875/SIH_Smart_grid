import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Header } from './components/Header';
import type { PageTab } from './components/Header';
import { PowerFlowDiagram } from './components/PowerFlowDiagram';
import { TelemetryGauges } from './components/TelemetryGauges';
import { LoadControlPanel } from './components/LoadControlPanel';
import { GridBotChat } from './components/GridBotChat';
import { LandingPage } from './components/LandingPage';
import { FirebaseSetupModal } from './components/FirebaseSetupModal';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { setLoadState, updateDeviceConfig } from './utils/hardwareControl';
import { getDatabase, ref, onValue } from 'firebase/database';
import { DEFAULT_DEVICE_ID } from './firebase';
import type { TelemetryData, LoadConfig } from './types';

const AppContent: React.FC = () => {
  const { user } = useAuth();
  const { colors } = useTheme();
  
  const [activeTab, setActiveTab] = useState<PageTab>('command');
  const [isConnected, setIsConnected] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [autoAiEnabled, setAutoAiEnabled] = useState(false);
  
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);
  const [batteryHistory] = useState<{ timestamp: number; voltage: number }[]>([{ timestamp: Date.now(), voltage: 3.7 }]);
  const [failureRisk] = useState<number>(0);
  
  const [loadConfigs, setLoadConfigs] = useState<Record<string, LoadConfig>>({
    'RLY-001': { id: 'RLY-001', name: 'Hospital ICU / Ventilator', priority: 'CRITICAL', nominalWatts: 0.25, description: 'Pin 26', icon: 'hospital' },
    'RLY-002': { id: 'RLY-002', name: 'Emergency Streetlights', priority: 'MEDIUM', nominalWatts: 0.15, description: 'Pin 25', icon: 'lightbulb' },
    'RLY-003': { id: 'RLY-003', name: 'Agricultural Water Pump', priority: 'LOW', nominalWatts: 0.20, description: 'Pin 27', icon: 'droplet' }
  });

  useEffect(() => {
    if (!user) return;
    
    // Connect to RTDB for live telemetry
    let unsubscribeTelemetry = () => {};
    let unsubscribeConfigs = () => {};
    try {
      const db = getDatabase();
      const telemetryRef = ref(db, `devices/${DEFAULT_DEVICE_ID}/telemetry`);
      const configRef = ref(db, `devices/${DEFAULT_DEVICE_ID}/config/loads`);
      
      const unsubT = onValue(telemetryRef, (snapshot) => {
        if (snapshot.exists()) {
          setIsConnected(true);
          setTelemetry(snapshot.val());
        }
      });
      
      const unsubC = onValue(configRef, (snapshot) => {
        if (snapshot.exists()) {
          setLoadConfigs(snapshot.val());
        }
      });
      
      unsubscribeTelemetry = unsubT;
      unsubscribeConfigs = unsubC;
    } catch (e) {
      console.warn("RTDB Connection failed", e);
    }
    
    return () => {
      unsubscribeTelemetry();
      unsubscribeConfigs();
    };
  }, [user]);

  const handleToggleLoad = async (id: 'RLY-001' | 'RLY-002' | 'RLY-003', action: 'ON' | 'OFF') => {
    await setLoadState(id, action);
  };

  const handleApplySimToHardware = async (commands: { target: 'RLY-001' | 'RLY-002' | 'RLY-003'; action: 'ON' | 'OFF' }[]) => {
    for (const cmd of commands) {
      await handleToggleLoad(cmd.target, cmd.action);
    }
  };

  // Auth Gate
  if (!user) {
    return <LandingPage />;
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}
      style={{ minHeight: '100vh', background: colors.bg, color: colors.text, padding: 'clamp(12px, 3vw, 24px)', fontFamily: "'Inter', system-ui, sans-serif", position: 'relative', overflowX: 'hidden' } as React.CSSProperties}
    >
      {/* Cyberpunk Grid Background */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(${colors.border} 1px, transparent 1px), linear-gradient(90deg, ${colors.border} 1px, transparent 1px)`, backgroundSize: '50px 50px', opacity: 0.3, zIndex: 0, pointerEvents: 'none', transform: 'perspective(1000px) rotateX(60deg) scale(2.5) translateY(-20%)', transformOrigin: 'top' }} />

      {/* GenZ Animated Mesh Gradient Background */}
      <div style={{ position: 'absolute', top: '-50%', left: '-20%', width: '140%', height: '140%', background: `radial-gradient(circle at 50% 50%, ${colors.accentBg} 0%, transparent 60%)`, filter: 'blur(100px)', opacity: 0.8, pointerEvents: 'none', animation: 'spin 20s linear infinite', zIndex: 0 }} />
      <style>{`@keyframes spin { 0% { transform: rotate(0deg) scale(1); } 50% { transform: rotate(180deg) scale(1.2); } 100% { transform: rotate(360deg) scale(1); } }`}</style>

      {/* Left/Right Decorative HUD Elements */}
      <div style={{ position: 'absolute', left: '20px', top: '100px', bottom: '20px', width: '20px', borderLeft: `1px solid ${colors.borderAccent}`, opacity: 0.5, zIndex: 0, pointerEvents: 'none', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div style={{ width: '4px', height: '40px', background: colors.accent, marginLeft: '-2.5px', boxShadow: `0 0 10px ${colors.accentGlow}` }} />
        <div style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', fontSize: '10px', color: colors.accent, letterSpacing: '0.2em', fontFamily: 'monospace' }}>SYS_NOMINAL</div>
      </div>
      <div style={{ position: 'absolute', right: '20px', top: '100px', bottom: '20px', width: '20px', borderRight: `1px solid ${colors.borderAccent}`, opacity: 0.5, zIndex: 0, pointerEvents: 'none', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div style={{ width: '4px', height: '100px', background: '#ec4899', marginRight: '-2.5px', boxShadow: '0 0 10px rgba(236,72,153,0.5)' }} />
        <div style={{ writingMode: 'vertical-rl', fontSize: '10px', color: '#ec4899', letterSpacing: '0.2em', fontFamily: 'monospace' }}>NET_SECURE</div>
      </div>

      <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column' as const, gap: '20px', width: '100%', position: 'relative', zIndex: 1 }}>
        
        <Header
          isConnected={isConnected}
          deviceId={DEFAULT_DEVICE_ID}
          autoAiEnabled={autoAiEnabled}
          onToggleAutoAi={() => setAutoAiEnabled(!autoAiEnabled)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />

        <AnimatePresence mode="wait">
          {activeTab === 'command' && (
            <motion.div key="command" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
              <PowerFlowDiagram
                telemetry={telemetry}
                configs={loadConfigs}
                failureRisk={failureRisk}
                isConnected={isConnected}
                onToggleLoad={handleToggleLoad}
              />
            </motion.div>
          )}

          {activeTab === 'telemetry' && (
            <motion.div key="telemetry" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
              <TelemetryGauges telemetry={telemetry} isConnected={isConnected} />
            </motion.div>
          )}

          {activeTab === 'loads' && (
            <motion.div key="loads" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
              <LoadControlPanel
                loads={telemetry?.loads || []}
                configs={loadConfigs}
                isConnected={isConnected}
                onToggleLoad={handleToggleLoad}
                onUpdateConfig={updateDeviceConfig}
              />
            </motion.div>
          )}

          {activeTab === 'gridbot' && (
            <motion.div key="gridbot" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
              <GridBotChat 
                loadConfigs={loadConfigs}
                batteryHistory={batteryHistory}
                isConnected={isConnected}
                onApplyToHardware={handleApplySimToHardware}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <footer style={{ paddingTop: '20px', borderTop: `1px solid ${colors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: colors.textMuted }}>
          <span>Smart India Hackathon 2026 • Predictive Renewable Energy Microgrid Controller</span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", color: colors.accent }}>sih.synthrobotics.dev</span>
        </footer>
      </div>

      <FirebaseSetupModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </motion.div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
