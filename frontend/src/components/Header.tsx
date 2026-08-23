import React from 'react';
import { Zap, Settings, Cpu, Activity, Sliders, Brain, GitFork } from 'lucide-react';

export type PageTab = 'flow' | 'telemetry' | 'loads' | 'ai' | 'simulator';

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
  const pages: { id: PageTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'flow', label: '1. Power Grid Topology', icon: GitFork },
    { id: 'telemetry', label: '2. Live Telemetry & Curves', icon: Activity },
    { id: 'loads', label: '3. Actuator Matrix & Loads', icon: Sliders },
    { id: 'ai', label: '4. AI Decisions & Audit Log', icon: Brain },
    { id: 'simulator', label: '5. Scenario Stress Simulator', icon: Zap }
  ];

  return (
    <header className="space-y-4 pb-2 border-b border-slate-800/80">
      {/* Top Navbar */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/20">
            <div className="w-full h-full bg-[#0b0f19] rounded-[10px] flex items-center justify-center">
              <Zap className="w-5 h-5 text-emerald-400 fill-emerald-400/20" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-lg font-bold text-white tracking-tight">
                SolarGrid Microgrid Controller
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono">
                SIH 2026
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Autonomous Renewable Energy Management • Edge Node: <span className="font-mono text-emerald-400">{deviceId}</span>
            </p>
          </div>
        </div>

        {/* Right Status Controls */}
        <div className="flex items-center gap-3">
          {/* Connection Badge */}
          <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-medium backdrop-blur-md transition-all ${
            isConnected
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 shadow-sm shadow-emerald-500/10'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}>
            <span className="relative flex h-2 w-2">
              {isConnected && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              )}
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isConnected ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
            </span>
            <span>{isConnected ? 'ESP32 Streaming (Live)' : 'ESP32 Offline (Awaiting RTDB)'}</span>
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
            <span>Autonomous AI: {autoAiEnabled ? 'Active' : 'Manual'}</span>
          </button>

          {/* Settings */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-100 transition"
            title="Firebase Realtime Database Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Modern Segmented Navigation Tabs */}
      <nav className="flex items-center gap-2 p-1.5 bg-[#0b0f19] border border-slate-800/80 rounded-2xl overflow-x-auto shadow-inner">
        {pages.map((p) => {
          const Icon = p.icon;
          const isActive = activeTab === p.id;
          return (
            <button
              key={p.id}
              onClick={() => setActiveTab(p.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 font-bold border border-emerald-500/40 shadow-md shadow-emerald-500/5'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
              <span>{p.label}</span>
            </button>
          );
        })}
      </nav>
    </header>
  );
};
