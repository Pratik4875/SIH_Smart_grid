import React from 'react';
import { Activity, ShieldCheck, Clock } from 'lucide-react';
import type { AIJustificationLog } from '../types';

interface DecisionLogProps {
  logs: AIJustificationLog[];
  featureImportances?: { temperature: number; humidity: number };
}

export const DecisionLog: React.FC<DecisionLogProps> = ({
  logs,
  featureImportances = { temperature: 0.48, humidity: 0.52 }
}) => {
  const getActionBadge = (action: AIJustificationLog['actionTaken']) => {
    switch (action) {
      case 'EMERGENCY_SHED_ALL_EXCEPT_CRITICAL':
      case 'SHED_MEDIUM_AND_LOW':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      case 'SHED_LOW':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'NO_ACTION':
      default:
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
    }
  };

  return (
    <div className="p-5 bg-slate-900/80 border border-slate-800/80 rounded-2xl backdrop-blur-md shadow-xl flex flex-col h-full">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-500/10 text-indigo-400 rounded-lg border border-indigo-500/20">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100">Explainable AI (XAI) Decision Audit Log</h3>
            <p className="text-[11px] text-slate-400">Jury Verification Trail & Algorithmic Justifications</p>
          </div>
        </div>

        {/* Feature Importance Indicators */}
        <div className="hidden sm:flex items-center gap-3 text-[10px] font-mono bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
          <span className="text-slate-400">Feature Gini Split:</span>
          <span className="text-cyan-300">Temp: {(featureImportances.temperature * 100).toFixed(0)}%</span>
          <span className="text-indigo-300">Humidity: {(featureImportances.humidity * 100).toFixed(0)}%</span>
        </div>
      </div>

      {/* Decision Log List */}
      <div className="flex-1 overflow-y-auto max-h-[380px] space-y-2.5 pr-1 text-xs">
        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-slate-500 space-y-2">
            <ShieldCheck className="w-8 h-8 text-emerald-500/40" />
            <p className="text-xs">No autonomous load-shedding incidents logged yet.</p>
            <p className="text-[10px] text-slate-600">The microgrid is running within nominal safety margins.</p>
          </div>
        ) : (
          logs.map((log) => {
            const isCritical = log.failureRiskPercent >= 70;
            const isWarning = log.failureRiskPercent >= 40 && log.failureRiskPercent < 70;

            return (
              <div
                key={log.id}
                className={`p-3.5 rounded-xl border transition-all ${
                  isCritical
                    ? 'bg-rose-950/20 border-rose-500/40'
                    : isWarning
                    ? 'bg-amber-950/20 border-amber-500/30'
                    : 'bg-slate-950/80 border-slate-800/80'
                }`}
              >
                <div className="flex flex-wrap justify-between items-center gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      {new Date(log.timestamp * 1000).toLocaleTimeString()}
                    </span>
                    <span className="font-mono text-[10px] text-cyan-300 bg-cyan-950/50 px-1.5 py-0.5 rounded border border-cyan-800/40">
                      Forecast: {log.weatherPrediction} ({(log.treeConfidence * 100).toFixed(0)}%)
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-slate-400">
                      Risk: <strong className={isCritical ? 'text-rose-400' : isWarning ? 'text-amber-400' : 'text-emerald-400'}>
                        {log.failureRiskPercent}%
                      </strong>
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-extrabold border uppercase tracking-wider ${getActionBadge(
                        log.actionTaken
                      )}`}
                    >
                      {log.actionTaken.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>

                <p className="text-slate-300 text-[11px] leading-relaxed mt-1">
                  {log.justificationReason}
                </p>

                {log.shedLoads && log.shedLoads.length > 0 && (
                  <div className="mt-2 pt-1.5 border-t border-slate-800/60 flex items-center gap-1.5 text-[10px]">
                    <span className="text-rose-400 font-bold">Autonomous Shed:</span>
                    <span className="text-slate-300 font-mono">{log.shedLoads.join(', ')}</span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
