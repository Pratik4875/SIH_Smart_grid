import React, { useState } from 'react';
import { X, Database, Check, RefreshCw, Key, Bot } from 'lucide-react';
import { getSavedFirebaseConfig, saveFirebaseConfig, DEFAULT_DEVICE_ID } from '../firebase';
import { getSavedAiConfig, saveAiConfig } from '../aiConfig';
import { useTheme } from '../context/ThemeContext';

interface FirebaseSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FirebaseSetupModal: React.FC<FirebaseSetupModalProps> = ({ isOpen, onClose }) => {
  const { colors } = useTheme();
  const [config, setConfig] = useState(getSavedFirebaseConfig());
  const [aiConfig, setAiConfig] = useState(getSavedAiConfig());
  const [deviceId, setDeviceId] = useState(DEFAULT_DEVICE_ID);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveAiConfig(aiConfig);
    saveFirebaseConfig(config); // This reloads the page
    setSavedSuccess(true);
    setTimeout(() => {
      onClose();
    }, 1000);
  };

  const inputStyle = {
    width: '100%', padding: '10px 14px', borderRadius: '10px',
    background: colors.bgInput, border: `1px solid ${colors.border}`,
    color: colors.text, fontSize: '13px', fontFamily: "'JetBrains Mono', monospace",
    outline: 'none', transition: 'border-color 0.2s', marginTop: '4px'
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)' }}>
      <div style={{ position: 'relative', width: '100%', maxWidth: '600px', background: colors.bgCard, border: `1px solid ${colors.border}`, borderRadius: '20px', padding: '24px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
        
        <button onClick={onClose} style={{ position: 'absolute', top: '20px', right: '20px', padding: '6px', borderRadius: '10px', background: colors.bgInput, border: 'none', color: colors.textSecondary, cursor: 'pointer' }}>
          <X style={{ width: '16px', height: '16px' }} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <div style={{ padding: '10px', borderRadius: '12px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', color: '#f59e0b' }}>
            <Database style={{ width: '20px', height: '20px' }} />
          </div>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: colors.text, margin: 0 }}>System Configuration</h3>
            <p style={{ fontSize: '12px', color: colors.textSecondary, margin: '4px 0 0 0' }}>Configure Firebase connection & AI API Keys</p>
          </div>
        </div>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Firebase Section */}
          <div style={{ padding: '16px', borderRadius: '12px', border: `1px solid ${colors.border}`, background: colors.bg }}>
            <h4 style={{ fontSize: '12px', fontWeight: 700, color: colors.textSecondary, marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Database style={{ width: '14px', height: '14px' }} /> Firebase RTDB
            </h4>
            
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: colors.textSecondary }}>Database URL</label>
              <input type="text" value={config.databaseURL || ''} onChange={(e) => setConfig({ ...config, databaseURL: e.target.value })} required style={inputStyle} />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: colors.textSecondary }}>Web API Key</label>
              <input type="text" value={config.apiKey || ''} onChange={(e) => setConfig({ ...config, apiKey: e.target.value })} required style={inputStyle} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: colors.textSecondary }}>Project ID</label>
                <input type="text" value={config.projectId || ''} onChange={(e) => setConfig({ ...config, projectId: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: colors.textSecondary }}>Device Target</label>
                <input type="text" value={deviceId} onChange={(e) => setDeviceId(e.target.value)} style={inputStyle} />
              </div>
            </div>
          </div>

          {/* AI APIs Section */}
          <div style={{ padding: '16px', borderRadius: '12px', border: `1px solid ${colors.border}`, background: colors.bg }}>
            <h4 style={{ fontSize: '12px', fontWeight: 700, color: colors.textSecondary, marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Bot style={{ width: '14px', height: '14px' }} /> AI Models (GridBot)
            </h4>
            
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: colors.textSecondary, display: 'flex', justifyContent: 'space-between' }}>
                <span>Gemini API Key (Primary)</span>
                <span style={{ color: colors.textMuted, fontWeight: 400 }}>Optional</span>
              </label>
              <div style={{ position: 'relative' }}>
                <Key style={{ position: 'absolute', left: '12px', top: '16px', width: '14px', height: '14px', color: colors.textMuted }} />
                <input type="password" value={aiConfig.geminiApiKey} onChange={(e) => setAiConfig({ ...aiConfig, geminiApiKey: e.target.value })} placeholder="AIzaSy..." style={{ ...inputStyle, paddingLeft: '36px' }} />
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: colors.textSecondary }}>
                Groq API Key (Fallback AI)
              </label>
              <div style={{ position: 'relative' }}>
                <Zap style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: colors.accent }} />
                <input type="password" value={aiConfig.groqApiKey} onChange={(e) => setAiConfig({ ...aiConfig, groqApiKey: e.target.value })} placeholder="gsk_..." style={{ ...inputStyle, paddingLeft: '36px' }} />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '14px', borderRadius: '12px', background: colors.bgInput, border: 'none', color: colors.text, fontWeight: 700, fontSize: '14px', cursor: 'pointer', transition: 'background 0.2s' }}>
              Cancel
            </button>
            <button type="submit" style={{ flex: 1, padding: '14px', borderRadius: '12px', background: colors.accent, color: '#000', fontWeight: 800, fontSize: '14px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: `0 0 20px ${colors.accentGlow}`, transition: 'all 0.2s' }}>
              {savedSuccess ? <Check style={{ width: '16px', height: '16px' }} /> : <RefreshCw style={{ width: '16px', height: '16px' }} />}
              {savedSuccess ? 'Saved! Reloading...' : 'Save & Reconnect'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
