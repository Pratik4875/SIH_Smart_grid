import React, { useState } from 'react';
import { Edit3, Save, HeartPulse, Lightbulb, Droplets, Check, X } from 'lucide-react';
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
        return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
      case 'HIGH':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      case 'MEDIUM':
        return 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30';
      case 'LOW':
      default:
        return 'bg-blue-500/15 text-blue-300 border-blue-500/30';
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
    setTimeout(() => setSavedSuccess(null), 2500);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div>
          <h2 className="text-base font-bold text-white tracking-tight">
            Actuator Matrix & Dynamic Load Prioritization
          </h2>
          <p className="text-xs text-slate-400">
            Configure appliance names, wattage ratings, and shedding hierarchy for all 3 edge relays
          </p>
        </div>
        <span className="text-xs font-mono text-slate-400 bg-[#0e1320] px-3.5 py-1.5 rounded-xl border border-slate-800">
          3 Physical Edge Actuators (GPIO 26, 25, 27)
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {loads.map((load) => {
          const cfg = configs[load.id] || {
            id: load.id,
            name: load.id === 'RLY-001' ? 'Hospital ICU Ventilator' : load.id === 'RLY-002' ? 'Emergency Streetlights' : 'Agricultural Water Pump',
            priority: load.id === 'RLY-001' ? 'CRITICAL' : load.id === 'RLY-002' ? 'MEDIUM' : 'LOW',
            nominalWatts: load.id === 'RLY-001' ? 0.25 : load.id === 'RLY-002' ? 0.15 : 0.20,
            description: load.id === 'RLY-001' ? 'Pin 26 MOSFET (Active LOW)' : load.id === 'RLY-002' ? 'Pin 25 Relay (Active LOW)' : 'Pin 27 Relay (Active LOW)',
            icon: load.id === 'RLY-001' ? 'hospital' : load.id === 'RLY-002' ? 'lightbulb' : 'droplet'
          };

          const isEditing = editingId === load.id;
          const isOn = isConnected && load.physicalState === 'ON';

          return (
            <div
              key={load.id}
              className={`p-6 rounded-2xl bg-[#0e1320] border transition-all shadow-xl flex flex-col justify-between ${
                isOn
                  ? 'border-emerald-500/40 shadow-emerald-500/5'
                  : 'border-slate-800/80'
              }`}
            >
              <div>
                {/* Top Bar */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-xl border ${
                      isOn ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-900 border-slate-800'
                    }`}>
                      {getLoadIcon(cfg.priority)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-white">
                          {load.id}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border uppercase ${getPriorityBadge(cfg.priority)}`}>
                          {cfg.priority}
                        </span>
                      </div>
                      <span className="block text-[11px] text-slate-400 font-mono mt-0.5">
                        GPIO {load.gpioPin} {load.id === 'RLY-001' ? '(MOSFET / Active-LOW)' : '(Relay / Active-LOW)'}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => (isEditing ? setEditingId(null) : handleStartEdit(load.id))}
                    className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 text-xs transition"
                    title="Configure Label & Priority"
                  >
                    {isEditing ? <X className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                  </button>
                </div>

                {/* Edit Form or Normal Content */}
                {isEditing ? (
                  <div className="space-y-3 pt-3 border-t border-slate-800 text-xs">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Appliance Label</label>
                      <input
                        type="text"
                        value={tempConfigs[load.id]?.name || ''}
                        onChange={(e) =>
                          setTempConfigs({
                            ...tempConfigs,
                            [load.id]: { ...tempConfigs[load.id], name: e.target.value }
                          })
                        }
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-xs font-medium"
                        placeholder="e.g. Hospital Ventilator"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">Criticality</label>
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
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-xs font-bold"
                        >
                          <option value="CRITICAL">CRITICAL (Preserve)</option>
                          <option value="MEDIUM">MEDIUM (Shed 2nd)</option>
                          <option value="LOW">LOW (Shed 1st)</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">Rating (Watts)</label>
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
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-xs font-mono"
                        />
                      </div>
                    </div>

                    <button
                      onClick={() => handleSaveItem(load.id)}
                      className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition mt-2 shadow-md shadow-emerald-500/20"
                    >
                      <Save className="w-4 h-4" />
                      Save Changes
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2 py-2">
                    <h3 className="text-base font-bold text-white truncate">{cfg.name}</h3>
                    <div className="flex justify-between items-center text-xs text-slate-400">
                      <span>Rated Power Draw:</span>
                      <span className="font-mono text-white font-bold">{cfg.nominalWatts} W</span>
                    </div>
                    {savedSuccess === load.id && (
                      <span className="text-xs text-emerald-400 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Saved to Firebase
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Intuitive Sliding Switch */}
              <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${
                      isOn ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'
                    }`} />
                    <span className={`text-xs font-mono font-bold ${
                      isOn ? 'text-emerald-400' : 'text-slate-500'
                    }`}>
                      {isConnected ? (isOn ? 'ENERGIZED (ON)' : 'DE-ENERGIZED (OFF)') : 'STANDBY'}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    Click switch to toggle physical relay
                  </span>
                </div>

                {/* Sliding Switch Control */}
                <button
                  type="button"
                  onClick={() => onToggleLoad(load.id, isOn ? 'OFF' : 'ON')}
                  disabled={isSendingCommand}
                  className={`relative inline-flex h-7 w-13 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    isOn ? 'bg-emerald-500 shadow-md shadow-emerald-500/30' : 'bg-slate-800'
                  } disabled:opacity-50`}
                  title={isOn ? 'Click to Turn OFF' : 'Click to Turn ON'}
                >
                  <span
                    className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      isOn ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
