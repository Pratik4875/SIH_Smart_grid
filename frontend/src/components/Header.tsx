import React from 'react';
import { Zap, Settings, Cpu, Activity, Sliders, Brain, LayoutGrid } from 'lucide-react';

interface HeaderProps {
  isConnected: boolean;
  deviceId: string;
  autoAiEnabled: boolean;
  onToggleAutoAi: () => void;
  onOpenSettings: () => void;
  activeTab: 'overview' | 'telemetry' | 'config' | 'simulator' | 'ai';
  setActiveTab: (tab: 'overview' | 'telemetry' | 'config' | 'simulator' | 'ai') => void;
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
  const tabs = [
    { id: 'overview', label: 'Dashboard Overview', icon: LayoutGrid },
    { id: 'telemetry', label: 'Telemetry & Curves', icon: Activity },
    { id: 'config', label: 'Load Configuration', icon: Sliders },
    { id: 'simulator', label: 'Scenario Simulator', icon: Zap },
    { id: 'ai', label: 'AI Justification Log', icon: Brain }
  ] as const;

  return (
    <header className="space-y-4">
      {/* Top Navbar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 py-2">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/20">
            <div className="w-full h-full bg-[#0b0f19] rounded-[10px] flex items-center justify-center">
              <Zap className="w-5 h-5 text-emerald-400 fill-emerald-400/20" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-lg font-bold text-white tracking-tight">
                SolarGrid Microgrid OS
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                SIH 2026
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Predictive Renewable Energy & Autonomous Load-Shedding Matrix
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Node Connection Badge */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium backdrop-blur-md ${
            isConnected
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}>
            <span className="relative flex h-2 w-2">
              {isConnected && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              )}
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isConnected ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
            </span>
            <span>{isConnected ? 'ESP32 Streaming' : 'Awaiting ESP32'}</span>
            <span className="font-mono opacity-60 text-[10px] border-l border-current/20 pl-2">
              {deviceId}
            </span>
          </div>

          {/* AI Mode Button */}
          <button
            onClick={onToggleAutoAi}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all ${
              autoAiEnabled
                ? 'bg-teal-500/15 border-teal-500/40 text-teal-300 shadow-sm shadow-teal-900/30'
                : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Auto AI: {autoAiEnabled ? 'Active' : 'Standby'}</span>
          </button>

          {/* Settings */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-100 transition"
            title="Firebase RTDB Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Segmented Tab Navigation */}
      <div className="flex items-center gap-1.5 p-1 bg-[#0e1320] border border-slate-800/80 rounded-xl overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-emerald-500/15 text-emerald-300 font-semibold border border-emerald-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
