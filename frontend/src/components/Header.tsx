import React from 'react';
import { Zap, Settings, Cpu, Activity, Sliders, Bot, Moon, SunMedium, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

export type PageTab = 'command' | 'telemetry' | 'loads' | 'gridbot';

interface HeaderProps {
  isConnected: boolean;
  deviceId: string;
  autoAiEnabled: boolean;
  onToggleAutoAi: () => void;
  onOpenSettings: () => void;
  activeTab: PageTab;
  setActiveTab: (tab: PageTab) => void;
}

export const Header: React.FC<HeaderProps> = ({
  isConnected,
  deviceId,
  autoAiEnabled,
  onToggleAutoAi,
  onOpenSettings,
  activeTab,
  setActiveTab
}) => {
  const { colors, theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();

  const pages: { id: PageTab; label: string; emoji: string; icon: React.FC<{ style?: React.CSSProperties }> }[] = [
    { id: 'command', label: 'Command Center', emoji: '⚡', icon: Zap },
    { id: 'telemetry', label: 'Live Grid', emoji: '📊', icon: Activity },
    { id: 'loads', label: 'Relay Control', emoji: '🎮', icon: Sliders },
    { id: 'gridbot', label: 'GridBot AI', emoji: '🤖', icon: Bot },
  ];

  return (
    <header style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingBottom: '12px', borderBottom: `1px solid ${colors.border}` }}>
      {/* Top Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        {/* Brand */}
        {/* GenZ Cyberpunk Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ 
            width: '44px', height: '44px', borderRadius: '14px', 
            background: `linear-gradient(135deg, ${colors.accent}, #ec4899)`, 
            padding: '2px', 
            boxShadow: `0 0 20px ${colors.accentGlow}`,
            animation: 'pulse 2s infinite'
          }}>
            <div style={{ width: '100%', height: '100%', background: colors.bgCard, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap style={{ width: '22px', height: '22px', color: colors.accent }} />
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '16px', fontWeight: 700, color: colors.text, letterSpacing: '-0.02em', margin: 0 }}>
                SolarGrid
              </h1>
              <span style={{ padding: '2px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 700, background: colors.accentBg, border: `1px solid ${colors.borderAccent}`, color: colors.accent, fontFamily: "'JetBrains Mono', monospace" }}>
                SIH 2026
              </span>
            </div>
            <p style={{ fontSize: '11px', color: colors.textSecondary, margin: 0 }}>
              Edge: <span style={{ fontFamily: "'JetBrains Mono', monospace", color: colors.accent }}>{deviceId}</span>
            </p>
          </div>
        </div>

        {/* Right Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {/* Connection Badge */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '5px 10px', borderRadius: '9999px', fontSize: '11px', fontWeight: 500,
            background: isConnected ? 'rgba(16,185,129,0.1)' : 'rgba(244,63,94,0.1)',
            border: `1px solid ${isConnected ? 'rgba(16,185,129,0.3)' : 'rgba(244,63,94,0.3)'}`,
            color: isConnected ? '#6ee7b7' : '#fda4af'
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: isConnected ? '#10b981' : '#f43f5e', boxShadow: isConnected ? '0 0 6px rgba(16,185,129,0.6)' : 'none' }} />
            <span>{isConnected ? 'Live' : 'Offline'}</span>
          </div>

          {/* AI Toggle */}
          <button onClick={onToggleAutoAi} style={{
            display: 'flex', alignItems: 'center', gap: '5px',
            padding: '5px 10px', borderRadius: '9999px', fontSize: '11px', fontWeight: 500,
            background: autoAiEnabled ? 'rgba(20,184,166,0.12)' : colors.bgCard,
            border: `1px solid ${autoAiEnabled ? 'rgba(20,184,166,0.35)' : colors.border}`,
            color: autoAiEnabled ? '#5eead4' : colors.textSecondary, cursor: 'pointer'
          }}>
            <Cpu style={{ width: '12px', height: '12px' }} />
            <span>AI: {autoAiEnabled ? 'Auto' : 'Manual'}</span>
          </button>

          {/* Theme Toggle */}
          <button onClick={toggleTheme} style={{
            padding: '7px', borderRadius: '9999px', background: colors.bgCard,
            border: `1px solid ${colors.border}`, color: colors.textSecondary, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }} title={theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}>
            {theme === 'dark' ? <SunMedium style={{ width: '14px', height: '14px' }} /> : <Moon style={{ width: '14px', height: '14px' }} />}
          </button>

          {/* Settings */}
          <button onClick={onOpenSettings} style={{
            padding: '7px', borderRadius: '9999px', background: colors.bgCard,
            border: `1px solid ${colors.border}`, color: colors.textSecondary, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }} title="Firebase Settings">
            <Settings style={{ width: '14px', height: '14px' }} />
          </button>

          {/* User Avatar */}
          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '4px' }}>
              <img
                src={user.photoURL || ''}
                alt={user.displayName || 'User'}
                style={{ width: '28px', height: '28px', borderRadius: '50%', border: `2px solid ${colors.borderAccent}` }}
              />
              <button onClick={logout} style={{
                padding: '5px 8px', borderRadius: '8px', background: 'rgba(244,63,94,0.1)',
                border: '1px solid rgba(244,63,94,0.2)', color: '#fda4af', cursor: 'pointer',
                fontSize: '10px', display: 'flex', alignItems: 'center', gap: '4px'
              }}>
                <LogOut style={{ width: '10px', height: '10px' }} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <nav style={{
        display: 'flex', alignItems: 'center', gap: '4px',
        padding: '4px', background: colors.bgCard,
        border: `1px solid ${colors.border}`, borderRadius: '14px',
        overflowX: 'auto'
      }}>
        {pages.map((p) => {
          const isActive = activeTab === p.id;
          return (
            <button
              key={p.id}
              onClick={() => setActiveTab(p.id)}
              style={{
                position: 'relative', display: 'flex', alignItems: 'center', gap: '6px',
                padding: '9px 16px', borderRadius: '10px', fontSize: '12px', fontWeight: isActive ? 700 : 500,
                color: isActive ? colors.accent : colors.textSecondary,
                background: 'transparent', border: 'none', cursor: 'pointer',
                whiteSpace: 'nowrap', transition: 'color 0.2s', flex: '1 1 0%', justifyContent: 'center'
              }}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTabBg"
                  style={{
                    position: 'absolute', inset: 0,
                    background: colors.accentBg,
                    border: `1px solid ${colors.borderAccent}`,
                    borderRadius: '10px',
                    boxShadow: `0 0 12px ${colors.accentGlow}`
                  }}
                  initial={false}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
              <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>{p.emoji}</span>
                <span>{p.label}</span>
              </span>
            </button>
          );
        })}
      </nav>
    </header>
  );
};
