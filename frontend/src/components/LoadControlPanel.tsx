import React, { useState } from 'react';
import { Power, Edit3, Save, HeartPulse, Lightbulb, Droplets, Check } from 'lucide-react';
import type { LoadState, LoadConfig, PriorityLevel } from '../types';

interface LoadControlPanelProps {
  loads: LoadState[];
  configs: Record<string, LoadConfig>;
  onToggleLoad: (id: 'RLY-001' | 'RLY-002' | 'RLY-003', action: 'ON' | 'OFF') => Promise<void>;
  onSaveConfigs: (configs: Record<string, LoadConfig>) => Promise<void>;
  isSendingCommand: boolean;
  isConnected: boolean;
}

export const LoadControlPanel: React.FC<LoadControlPanelProps> = ({
  loads,
  configs,
  onToggleLoad,
  onSaveConfigs,
  isSendingCommand,
  isConnected
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempConfigs, setTempConfigs] = useState<Record<string, LoadConfig>>(configs);
  const [savedSuccess, setSavedSuccess] = useState<string | null>(null);

  const getPriorityBadge = (priority: PriorityLevel) => {
    switch (priority) {
      case 'CRITICAL':
        return 'bg-rose-500/20 text-rose-300 border border-rose-500/40';
      case 'HIGH':
        return 'bg-amber-500/20 text-amber-300 border border-amber-500/40';
      case 'MEDIUM':
        return 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40';
      case 'LOW':
      default:
        return 'bg-blue-500/20 text-blue-300 border border-blue-500/40';
    }
  };

  const getLoadIcon = (priority: PriorityLevel) => {
    switch (priority) {
      case 'CRITICAL':
        return <HeartPulse className="w-5 h-5 text-rose-400" />;
      case 'MEDIUM':
      case 'HIGH':
        return <Lightbulb className="w-5 h-5 text-amber-400" />;
      case 'LOW':
      default:
        return <Droplets className="w-5 h-5 text-blue-400" />;
    }
  };

  const handleStartEdit = (id: string) => {
    setEditingId(id);
    setTempConfigs({ ...configs });
  };

  const handleSaveItem = async (id: string) => {
    await onSaveConfigs(tempConfigs);
    setEditingId(null);
    setSavedSuccess(id);
    setTimeout(() => setSavedSuccess(null), 2000);
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            2. Device Configuration & Actuator Form
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Dynamically configure hardware labels, power ratings, and AI load-shedding criticality levels
          </p>
        </div>
        <span className="text-[11px] font-mono text-slate-500">
          3 Physical Edge Actuators (GPIO 26, 25, 27)
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {loads.map((load) => {
          const cfg = configs[load.id] || {
            id: load.id,
            name: load.id === 'RLY-001' ? 'Hospital ICU Ventilator' : load.id === 'RLY-002' ? 'Emergency Streetlights' : 'Agricultural Water Pump',
            priority: load.id === 'RLY-001' ? 'CRITICAL' : load.id === 'RLY-002' ? 'MEDIUM' : 'LOW',
            nominalWatts: load.id === 'RLY-001' ? 0.25 : load.id === 'RLY-002' ? 0.15 : 0.20,
            description: load.id === 'RLY-001' ? 'Pin 26 MOSFET (Active LOW)' : load.id === 'RLY-002' ? 'Pin 25 Relay (Active HIGH)' : 'Pin 27 Relay (Active HIGH)',
            icon: load.id === 'RLY-001' ? 'hospital' : load.id === 'RLY-002' ? 'lightbulb' : 'droplet'
          };

          const isEditing = editingId === load.id;
          const isOn = load.physicalState === 'ON';

          return (
            <div
              key={load.id}
              className={`p-5 rounded-xl border transition-all ${
                isOn && isConnected
                  ? 'bg-slate-900 border-emerald-500/40 shadow-md'
                  : 'bg-slate-900/80 border-slate-800'
              }`}
            >
              {/* Header */}
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                    {getLoadIcon(cfg.priority)}
                  </div>
                  <div>
                    <span className="font-mono text-xs font-bold text-white">
                      {load.id}
                    </span>
                    <span className="block text-[10px] text-slate-500 font-mono">
                      GPIO {load.gpioPin} {load.id === 'RLY-001' ? '(Active-LOW MOSFET)' : '(Active-HIGH Relay)'}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => (isEditing ? setEditingId(null) : handleStartEdit(load.id))}
                  className="p-1.5 rounded bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 text-xs transition"
                  title="Edit Configuration"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Dynamic Edit Form or View */}
              {isEditing ? (
                <div className="mt-4 space-y-3 pt-3 border-t border-slate-800 text-xs">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Attached Appliance / Load Name</label>
                    <input
                      type="text"
                      value={tempConfigs[load.id]?.name || ''}
                      onChange={(e) =>
                        setTempConfigs({
                          ...tempConfigs,
                          [load.id]: { ...tempConfigs[load.id], name: e.target.value }
                        })
                      }
                      className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-xs font-medium"
                      placeholder="e.g., Hospital Ventilator"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Criticality</label>
                      <select
                        value={tempConfigs[load.id]?.priority || 'LOW'}
                        onChange={(e) =>
                          setTempConfigs({
                            ...tempConfigs,
                            [load.id]: {
                              ...tempConfigs[load.id],
                              priority: e.target.value as PriorityLevel
                            }
                          })
                        }
                        className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-xs font-bold"
                      >
                        <option value="CRITICAL">CRITICAL (Preserve)</option>
                        <option value="MEDIUM">MEDIUM (Shed 2nd)</option>
                        <option value="LOW">LOW (Shed 1st)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Load Power (Watts)</label>
                      <input
                        type="number"
                        step="0.05"
                        value={tempConfigs[load.id]?.nominalWatts || 0.2}
                        onChange={(e) =>
                          setTempConfigs({
                            ...tempConfigs,
                            [load.id]: {
                              ...tempConfigs[load.id],
                              nominalWatts: parseFloat(e.target.value) || 0.1
                            }
                          })
                        }
                        className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => handleSaveItem(load.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition"
                    >
                      <Save className="w-3.5 h-3.5" />
                      Save Configuration
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-3 py-1.5 rounded bg-slate-800 text-slate-300 text-xs hover:bg-slate-700"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-4 pt-3 border-t border-slate-800/80">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-bold text-white truncate">{cfg.name}</h3>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${getPriorityBadge(cfg.priority)}`}>
                      {cfg.priority}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Nominal Rating: <span className="font-mono text-slate-200">{cfg.nominalWatts} W</span>
                  </p>
                  {savedSuccess === load.id && (
                    <span className="text-[11px] text-emerald-400 flex items-center gap-1 mt-1">
                      <Check className="w-3 h-3" /> Saved to Firebase
                    </span>
                  )}
                </div>
              )}

              {/* Physical Actuator Status & Toggle */}
              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-mono">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isOn && isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'
                    }`}
                  />
                  <span className={isOn && isConnected ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                    {isConnected ? (isOn ? 'ENERGIZED' : 'OFF / SHED') : 'STATE UNKNOWN'}
                  </span>
                </div>

                <button
                  onClick={() => onToggleLoad(load.id, isOn ? 'OFF' : 'ON')}
                  disabled={isSendingCommand}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition ${
                    isOn
                      ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30'
                      : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30'
                  } disabled:opacity-50`}
                >
                  <Power className="w-3.5 h-3.5" />
                  <span>{isOn ? 'FORCE OFF' : 'FORCE ON'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
