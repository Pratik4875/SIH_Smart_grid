import React from 'react';
import { Zap, Settings, Radio, Cpu, RefreshCw } from 'lucide-react';

interface HeaderProps {
  isConnected: boolean;
  deviceId: string;
  autoAiEnabled: boolean;
  onToggleAutoAi: () => void;
  onOpenSettings: () => void;
  onManualAiEval: () => void;
  isEvaluating: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  isConnected,
  deviceId,
  autoAiEnabled,
  onToggleAutoAi,
  onOpenSettings,
  onManualAiEval,
  isEvaluating
}) => {
  return (
    <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-6 border-b border-slate-800/80">
      <div className="flex items-center gap-3.5">
        <div className="relative p-3 bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400 shadow-lg shadow-emerald-950/40">
          <Zap className="w-7 h-7 animate-pulse" />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-ping" />
        </div>
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl lg:text-3xl font-black tracking-tight bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-300 bg-clip-text text-transparent">
              SolarGrid Microgrid OS
            </h1>
            <span className="hidden sm:inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 uppercase">
              SIH 2026 Edition
            </span>
          </div>
          <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
            <span>Predictive Renewable Energy & Autonomous Load-Shedding Matrix</span>
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {/* Edge Node Connection Status */}
        <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-xs shadow-inner">
          <Radio className={`w-4 h-4 ${isConnected ? 'text-emerald-400 animate-pulse' : 'text-rose-500'}`} />
          <span className="text-slate-300 font-medium">{isConnected ? 'ESP32 Streaming' : 'Searching RTDB...'}</span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono border border-slate-700">
            {deviceId}
          </span>
        </div>

        {/* Autonomous AI Toggle */}
        <button
          onClick={onToggleAutoAi}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-semibold transition-all ${
            autoAiEnabled
              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 shadow-lg shadow-emerald-950/30'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
          title="Toggle automatic AI load shedding when critical thresholds are crossed"
        >
          <Cpu className="w-4 h-4" />
          <span>Auto AI: {autoAiEnabled ? 'ENGAGED' : 'STANDBY'}</span>
        </button>

        {/* Manual AI Evaluation Trigger */}
        <button
          onClick={onManualAiEval}
          disabled={isEvaluating}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-bold text-xs shadow-md transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isEvaluating ? 'animate-spin' : ''}`} />
          <span>Run AI Audit</span>
        </button>

        {/* Firebase Config Modal Button */}
        <button
          onClick={onOpenSettings}
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
          title="Firebase RTDB Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
