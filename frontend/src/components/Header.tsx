import React from 'react';
import { Zap, Settings, Cpu } from 'lucide-react';

interface HeaderProps {
  isConnected: boolean;
  deviceId: string;
  autoAiEnabled: boolean;
  onToggleAutoAi: () => void;
  onOpenSettings: () => void;
  activeTab: 'all' | 'telemetry' | 'config' | 'simulator' | 'ai';
  setActiveTab: (tab: 'all' | 'telemetry' | 'config' | 'simulator' | 'ai') => void;
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
  return (
    <header className="space-y-4 pb-4 border-b border-slate-800">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Predictive Renewable Energy Microgrid Controller
            </h1>
            <p className="text-xs text-slate-400">
              Smart India Hackathon 2026 • Edge Node: <span className="font-mono text-emerald-400">{deviceId}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Connection Status */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
            <div className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
            <span className={isConnected ? 'text-emerald-300 font-medium' : 'text-slate-400'}>
              {isConnected ? 'ESP32 Streaming (Live)' : 'ESP32 Offline (Awaiting RTDB)'}
            </span>
          </div>

          {/* Auto AI Mode */}
          <button
            onClick={onToggleAutoAi}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition ${
              autoAiEnabled
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>AI Autonomous: {autoAiEnabled ? 'ON' : 'OFF'}</span>
          </button>

          {/* Settings */}
          <button
            onClick={onOpenSettings}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition"
            title="Firebase Database Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <nav className="flex flex-wrap gap-2 text-xs">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-3 py-1.5 rounded-lg font-medium transition ${
            activeTab === 'all'
              ? 'bg-slate-800 text-white font-bold border border-slate-700'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          All Overview
        </button>
        <button
          onClick={() => setActiveTab('telemetry')}
          className={`px-3 py-1.5 rounded-lg font-medium transition ${
            activeTab === 'telemetry'
              ? 'bg-slate-800 text-white font-bold border border-slate-700'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          1. Live Telemetry
        </button>
        <button
          onClick={() => setActiveTab('config')}
          className={`px-3 py-1.5 rounded-lg font-medium transition ${
            activeTab === 'config'
              ? 'bg-slate-800 text-white font-bold border border-slate-700'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          2. Device Configuration Form
        </button>
        <button
          onClick={() => setActiveTab('simulator')}
          className={`px-3 py-1.5 rounded-lg font-medium transition ${
            activeTab === 'simulator'
              ? 'bg-slate-800 text-white font-bold border border-slate-700'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          3. Scenario Simulation
        </button>
        <button
          onClick={() => setActiveTab('ai')}
          className={`px-3 py-1.5 rounded-lg font-medium transition ${
            activeTab === 'ai'
              ? 'bg-slate-800 text-white font-bold border border-slate-700'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          4. AI Decision Logs & Justification
        </button>
      </nav>
    </header>
  );
};
