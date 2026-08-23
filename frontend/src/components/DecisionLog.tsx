import React from 'react';
import { ShieldCheck, Clock, Brain } from 'lucide-react';
import type { AIJustificationLog } from '../types';

interface DecisionLogProps {
  logs: AIJustificationLog[];
  featureImportances?: { temperature: number; humidity: number };
  weatherForecast?: string;
  confidence?: number;
  failureRisk?: number;
}

export const DecisionLog: React.FC<DecisionLogProps> = ({
  logs,
  featureImportances = { temperature: 0.48, humidity: 0.52 },
  weatherForecast = 'Sunny',
  confidence = 0.85,
  failureRisk = 15
}) => {
  const getActionBadge = (action: AIJustificationLog['actionTaken']) => {
    switch (action) {
      case 'EMERGENCY_SHED_ALL_EXCEPT_CRITICAL':
      case 'SHED_MEDIUM_AND_LOW':
        return 'bg-rose-500/15 text-rose-300 border border-rose-500/30';
      case 'SHED_LOW':
        return 'bg-amber-500/15 text-amber-300 border border-amber-500/30';
      case 'NO_ACTION':
      default:
        return 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div>
          <h2 className="text-sm font-bold text-white tracking-tight">
            Explainable AI (XAI) Decision Logs & Justification Stream
          </h2>
          <p className="text-xs text-slate-400">
            Real-time algorithmic explanations proving why specific circuits were shed or energized
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="text-slate-400">Gini Feature Split:</span>
          <span className="text-cyan-400">Temp: {(featureImportances.temperature * 100).toFixed(0)}%</span>
          <span className="text-indigo-400">Humidity: {(featureImportances.humidity * 100).toFixed(0)}%</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ML Status Card */}
        <div className="p-6 rounded-2xl bg-[#0e1320] border border-slate-800/80 shadow-lg space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <Brain className="w-5 h-5 text-emerald-400" />
            Random Forest Ensemble Status
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-2 border-b border-slate-800/80">
              <span className="text-slate-400">Model Structure:</span>
              <span className="font-mono text-white font-medium">10-Tree Classifier</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-800/80">
              <span className="text-slate-400">Predicted Condition:</span>
              <span className="font-bold text-amber-300">{weatherForecast}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-800/80">
              <span className="text-slate-400">Tree Vote Agreement:</span>
              <span className="font-mono text-emerald-400 font-bold">{(confidence * 100).toFixed(0)}%</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-400">Calculated Grid Risk:</span>
              <span className={`font-mono font-bold ${failureRisk >= 60 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {failureRisk}% Risk
              </span>
            </div>
          </div>
        </div>

        {/* Audit Log Stream (2 columns) */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-[#0e1320] border border-slate-800/80 shadow-lg flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Live Decision Audit Trail</h3>
            <span className="text-[11px] text-slate-500 font-mono">{logs.length} Recorded Events</span>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[320px] space-y-3 pr-1 text-xs">
            {logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center text-slate-500 space-y-2">
                <ShieldCheck className="w-8 h-8 text-emerald-500/40" />
                <p className="text-xs text-slate-300 font-medium">No shedding events triggered yet.</p>
                <p className="text-[11px] text-slate-500">The microgrid is running within normal safety parameters.</p>
              </div>
            ) : (
              logs.map((log) => {
                const isCritical = log.failureRiskPercent >= 60;
                return (
                  <div
                    key={log.id}
                    className={`p-4 rounded-xl border text-xs space-y-2 ${
                      isCritical
                        ? 'bg-rose-950/20 border-rose-500/30'
                        : 'bg-slate-950 border-slate-800/80'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-[11px] text-slate-400 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        {new Date(log.timestamp * 1000).toLocaleTimeString()}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${getActionBadge(log.actionTaken)}`}>
                        {log.actionTaken.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <p className="text-slate-300 text-xs leading-relaxed">
                      {log.justificationReason}
                    </p>

                    {log.shedLoads && log.shedLoads.length > 0 && (
                      <div className="pt-1 text-[11px] text-rose-300 font-mono">
                        Shed Circuits: {log.shedLoads.join(', ')}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
