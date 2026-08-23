import React, { useState } from 'react';
import { Power, Edit3, Save, HeartPulse, Lightbulb, Droplets, Cpu } from 'lucide-react';
import type { LoadState, LoadConfig, PriorityLevel } from '../types';

interface LoadControlPanelProps {
  loads: LoadState[];
  configs: Record<string, LoadConfig>;
  onToggleLoad: (id: 'RLY-001' | 'RLY-002' | 'RLY-003', action: 'ON' | 'OFF') => Promise<void>;
  onSaveConfigs: (configs: Record<string, LoadConfig>) => Promise<void>;
  isSendingCommand: boolean;
}

export const LoadControlPanel: React.FC<LoadControlPanelProps> = ({
  loads,
  configs,
  onToggleLoad,
  onSaveConfigs,
  isSendingCommand
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempConfigs, setTempConfigs] = useState<Record<string, LoadConfig>>(configs);
  const [isSaving, setIsSaving] = useState(false);

  const getLoadIcon = (priority: PriorityLevel) => {
    switch (priority) {
      case 'CRITICAL':
        return <HeartPulse className="w-5 h-5 text-rose-400" />;
      case 'HIGH':
      case 'MEDIUM':
        return <Lightbulb className="w-5 h-5 text-amber-400" />;
      case 'LOW':
      default:
        return <Droplets className="w-5 h-5 text-blue-400" />;
    }
  };

  const getPriorityBadge = (priority: PriorityLevel) => {
    switch (priority) {
      case 'CRITICAL':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      case 'HIGH':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'MEDIUM':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40';
      case 'LOW':
      default:
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
    }
  };

  const handleStartEdit = (id: string) => {
    setEditingId(id);
    setTempConfigs({ ...configs });
  };

  const handleSaveItem = async () => {
    setIsSaving(true);
    try {
      await onSaveConfigs(tempConfigs);
      setEditingId(null);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setTempConfigs({ ...configs });
  };

  return (
    <section className="p-5 bg-slate-900/80 border border-slate-800/80 rounded-2xl backdrop-blur-md shadow-xl mb-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-emerald-400" />
            Hardware Actuator Matrix & Load Configuration
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Physical ESP32 GPIOs with dynamic priority tags for AI load shedding
          </p>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-slate-400">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400" />
          <span>Active-Low & Transistor Driven</span>
        </div>
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
              className={`p-4 rounded-xl border transition-all ${
                isOn
                  ? 'bg-slate-950/90 border-emerald-500/40 shadow-lg shadow-emerald-950/20'
                  : 'bg-slate-950/60 border-slate-800 opacity-80'
              }`}
            >
              {/* Header with Icon, ID and Edit button */}
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                    {getLoadIcon(cfg.priority)}
                  </div>
                  <div>
                    <span className="font-mono text-xs font-bold text-white tracking-wider">
                      {load.id}
                    </span>
                    <span className="block text-[10px] text-slate-500 font-mono">
                      GPIO {load.gpioPin} {load.id === 'RLY-001' ? '(Active-LOW)' : '(Active-HIGH)'}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => (isEditing ? handleCancelEdit() : handleStartEdit(load.id))}
                  className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition"
                  title="Configure Load Parameters"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Editable or Display View */}
              {isEditing ? (
                <div className="mt-3 space-y-2 text-xs">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Device Label</label>
                    <input
                      type="text"
                      value={tempConfigs[load.id]?.name || ''}
                      onChange={(e) =>
                        setTempConfigs({
                          ...tempConfigs,
                          [load.id]: { ...tempConfigs[load.id], name: e.target.value }
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-white text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5">Priority</label>
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
                        className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-white text-xs font-bold"
                      >
                        <option value="CRITICAL">CRITICAL</option>
                        <option value="HIGH">HIGH</option>
                        <option value="MEDIUM">MEDIUM</option>
                        <option value="LOW">LOW</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5">Nominal (W)</label>
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
                        className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-white text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => handleSaveItem()}
                      disabled={isSaving}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-[11px] transition"
                    >
                      <Save className="w-3 h-3" />
                      Save
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="flex-1 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px]"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-3">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold text-slate-100 truncate">{cfg.name}</h4>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-extrabold border uppercase tracking-wider ${getPriorityBadge(
                        cfg.priority
                      )}`}
                    >
                      {cfg.priority}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Power: <span className="font-mono text-slate-200">{cfg.nominalWatts} W</span>
                  </p>
                </div>
              )}

              {/* Physical ON/OFF Control Button */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[11px] font-mono">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isOn ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'
                    }`}
                  />
                  <span className={isOn ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                    {isOn ? 'ENERGIZED' : 'SHED / OFF'}
                  </span>
                </div>

                <button
                  onClick={() => onToggleLoad(load.id, isOn ? 'OFF' : 'ON')}
                  disabled={isSendingCommand}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all ${
                    isOn
                      ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40'
                      : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
                  } disabled:opacity-50`}
                >
                  <Power className="w-3.5 h-3.5" />
                  <span>{isOn ? 'TURN OFF' : 'TURN ON'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
