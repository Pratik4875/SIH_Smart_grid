// @ts-nocheck
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Building2, Lightbulb, Droplets, ShieldCheck, Zap, Settings2, Save, X } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import type { LoadState, LoadConfig } from '../types';

interface LoadControlPanelProps {
  loads: LoadState[];
  configs: Record<string, LoadConfig>;
  isConnected: boolean;
  onToggleLoad: (id: 'RLY-001' | 'RLY-002' | 'RLY-003', action: 'ON' | 'OFF') => Promise<void>;
  onUpdateConfig?: (configs: Record<string, LoadConfig>) => Promise<void>;
}

export const LoadControlPanel: React.FC<LoadControlPanelProps> = ({ loads, configs, isConnected, onToggleLoad, onUpdateConfig }) => {
  const { colors } = useTheme();
  const [editingLoadId, setEditingLoadId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<LoadConfig | null>(null);

  // If disconnected or no telemetry, provide dummy states for UI rendering
  const activeLoads = loads.length > 0 ? loads : [
    { id: 'RLY-001', gpioPin: 26, physicalState: 'OFF' },
    { id: 'RLY-002', gpioPin: 25, physicalState: 'OFF' },
    { id: 'RLY-003', gpioPin: 27, physicalState: 'OFF' }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL': return '#f43f5e'; // Rose
      case 'HIGH': return '#f97316'; // Orange
      case 'MEDIUM': return '#eab308'; // Yellow
      case 'LOW': return '#3b82f6'; // Blue
      default: return colors.textSecondary;
    }
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'hospital': return Building2;
      case 'lightbulb': return Lightbulb;
      case 'droplet': return Droplets;
      default: return Zap;
    }
  };

  const handleEditClick = (config: LoadConfig) => {
    setEditForm({ ...config });
    setEditingLoadId(config.id);
  };

  const handleSaveClick = async () => {
    if (editForm && onUpdateConfig) {
      const updatedConfigs = { ...configs, [editForm.id]: editForm };
      await onUpdateConfig(updatedConfigs);
      setEditingLoadId(null);
      setEditForm(null);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
      {activeLoads.map((load, index) => {
        const config = configs[load.id] || {
          name: `Unknown Load (${load.id})`,
          priority: 'LOW',
          nominalWatts: 0,
          description: `GPIO ${load.gpioPin}`,
          icon: 'zap'
        };

        const Icon = getIcon(config.icon);
        const pColor = getPriorityColor(config.priority);
        const isOn = isConnected && load.physicalState === 'ON';
        const isEditing = editingLoadId === load.id;

        return (
          <motion.div
            key={load.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            style={{
              padding: '24px', borderRadius: '16px',
              background: isOn ? `${colors.accent}08` : colors.bgCard,
              border: `1px solid ${isOn ? colors.accentGlow : colors.border}`,
              position: 'relative', overflow: 'hidden',
              boxShadow: isOn ? `0 8px 32px ${colors.accentBg}` : '0 8px 32px rgba(0,0,0,0.1)',
              transition: 'all 0.3s'
            }}
          >
            {/* Background Priority Glow */}
            <div style={{ position: 'absolute', top: 0, right: 0, width: '150px', height: '150px', background: `radial-gradient(circle at top right, ${pColor}15 0%, transparent 70%)`, pointerEvents: 'none' }} />

            {isEditing && editForm ? (
              // EDIT MODE
              <div style={{ position: 'relative', zIndex: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, color: colors.text, margin: 0 }}>Edit Device Configuration</h3>
                  <button onClick={() => setEditingLoadId(null)} style={{ background: 'none', border: 'none', color: colors.textSecondary, cursor: 'pointer' }}><X size={18} /></button>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <input 
                    type="text" 
                    value={editForm.name} 
                    onChange={e => setEditForm({...editForm, name: e.target.value})}
                    placeholder="Device Name"
                    style={{ padding: '8px 12px', borderRadius: '8px', border: `1px solid ${colors.border}`, background: colors.bgInput, color: colors.text, fontSize: '14px' }} 
                  />
                  
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '11px', color: colors.textSecondary, marginBottom: '4px', display: 'block' }}>Priority</label>
                      <select 
                        value={editForm.priority} 
                        onChange={e => setEditForm({...editForm, priority: e.target.value as any})}
                        style={{ width: '100%', padding: '8px', borderRadius: '8px', border: `1px solid ${colors.border}`, background: colors.bgInput, color: colors.text, fontSize: '14px' }}
                      >
                        <option value="CRITICAL">Critical</option>
                        <option value="HIGH">High</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="LOW">Low</option>
                      </select>
                    </div>
                    
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '11px', color: colors.textSecondary, marginBottom: '4px', display: 'block' }}>Power (W)</label>
                      <input 
                        type="number" 
                        value={editForm.nominalWatts} 
                        onChange={e => setEditForm({...editForm, nominalWatts: parseFloat(e.target.value) || 0})}
                        style={{ width: '100%', padding: '8px', borderRadius: '8px', border: `1px solid ${colors.border}`, background: colors.bgInput, color: colors.text, fontSize: '14px' }} 
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                    <button 
                      onClick={handleSaveClick}
                      style={{ flex: 1, padding: '10px', borderRadius: '8px', background: colors.accent, color: '#fff', border: 'none', fontWeight: 700, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                    >
                      <Save size={16} /> Save Device
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              // DISPLAY MODE
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', position: 'relative', zIndex: 10 }}>
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: `${pColor}15`, border: `1px solid ${pColor}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: pColor }}>
                      <Icon style={{ width: '24px', height: '24px' }} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '15px', fontWeight: 700, color: colors.text, margin: '0 0 4px 0' }}>{config.name}</h3>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '6px', background: `${pColor}20`, color: pColor, border: `1px solid ${pColor}40`, fontFamily: "'JetBrains Mono', monospace" }}>
                          {config.priority}
                        </span>
                        <span style={{ fontSize: '11px', color: colors.textMuted, fontFamily: "'JetBrains Mono', monospace" }}>
                          {load.id}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {onUpdateConfig && (
                    <button 
                      onClick={() => handleEditClick(config)}
                      style={{ background: 'none', border: 'none', color: colors.textSecondary, cursor: 'pointer', padding: '4px' }}
                      title="Edit Device Configuration"
                    >
                      <Settings2 size={16} />
                    </button>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px', position: 'relative', zIndex: 10 }}>
                  <div style={{ padding: '12px', borderRadius: '10px', background: colors.bgInput, border: `1px solid ${colors.border}` }}>
                    <div style={{ fontSize: '11px', color: colors.textSecondary, marginBottom: '4px' }}>Power Draw</div>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: colors.text, fontFamily: "'JetBrains Mono', monospace" }}>{config.nominalWatts} W</div>
                  </div>
                  <div style={{ padding: '12px', borderRadius: '10px', background: colors.bgInput, border: `1px solid ${colors.border}` }}>
                    <div style={{ fontSize: '11px', color: colors.textSecondary, marginBottom: '4px' }}>Hardware</div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: colors.text, fontFamily: "'JetBrains Mono', monospace" }}>GPIO {load.gpioPin}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: `1px solid ${colors.border}`, position: 'relative', zIndex: 10 }}>
                  <div>
                    <div style={{ fontSize: '11px', color: colors.textSecondary, marginBottom: '4px' }}>Status</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {isOn ? (
                        <>
                          <Zap style={{ width: '14px', height: '14px', color: colors.accent }} />
                          <span style={{ fontSize: '14px', fontWeight: 700, color: colors.accent }}>ACTIVE</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck style={{ width: '14px', height: '14px', color: '#f43f5e' }} />
                          <span style={{ fontSize: '14px', fontWeight: 700, color: '#f43f5e' }}>SHED</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Gaming style toggle switch */}
                  <button
                    onClick={() => onToggleLoad(load.id as 'RLY-001' | 'RLY-002' | 'RLY-003', isOn ? 'OFF' : 'ON')}
                    style={{
                      position: 'relative', width: '56px', height: '32px', borderRadius: '9999px',
                      background: isOn ? colors.accent : colors.bgInput,
                      border: `2px solid ${isOn ? colors.accent : colors.border}`,
                      cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: isOn ? `0 0 20px ${colors.accentGlow}` : 'none'
                    }}
                  >
                    <span style={{
                      position: 'absolute', top: '2px', left: isOn ? '26px' : '2px',
                      width: '24px', height: '24px', borderRadius: '50%', background: '#fff',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.3)', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                    }} />
                  </button>
                </div>
              </>
            )}
          </motion.div>
        );
      })}
    </div>
  );
};
