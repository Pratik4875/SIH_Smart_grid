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
        return 'bg-rose-500/20 text-rose-300 border border-rose-500/40';
      case 'SHED_LOW':
        return 'bg-amber-500/20 text-amber-300 border border-amber-500/40';
      case 'NO_ACTION':
      default:
        return 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40';
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            4. AI Justification Engine & Decision Logs
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Transparent Random Forest reasoning showing why circuits are energized or shed
          </p>
        </div>
        <div className="flex items-center gap-3 text-[11px] font-mono">
          <span className="text-slate-400">Gini Split:</span>
          <span className="text-cyan-400">Temp: {(featureImportances.temperature * 100).toFixed(0)}%</span>
          <span className="text-indigo-400">Humidity: {(featureImportances.humidity * 100).toFixed(0)}%</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* ML Status Card */}
        <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-xl space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-white">
            <Brain className="w-4 h-4 text-emerald-400" />
            Random Forest Ensemble Status
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-800">
              <span className="text-slate-400">Model Architecture:</span>
              <span className="font-mono text-slate-200">10-Tree Classifier</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800">
              <span className="text-slate-400">Predicted Condition:</span>
              <span className="font-bold text-amber-300">{weatherForecast}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800">
              <span className="text-slate-400">Tree Vote Confidence:</span>
              <span className="font-mono text-emerald-400">{(confidence * 100).toFixed(0)}%</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-400">Grid Strain Assessment:</span>
              <span className={`font-mono font-bold ${failureRisk >= 60 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {failureRisk}% Risk
              </span>
            </div>
          </div>
        </div>

        {/* Audit Log Stream (2 columns) */}
        <div className="lg:col-span-2 p-5 bg-slate-900/90 border border-slate-800 rounded-xl flex flex-col">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-xs font-bold text-slate-300">Live Decision Audit Trail</h3>
            <span className="text-[10px] text-slate-500 font-mono">{logs.length} Logged Events</span>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[300px] space-y-2.5 pr-1 text-xs">
            {logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-slate-500 space-y-1">
                <ShieldCheck className="w-6 h-6 text-emerald-500/50" />
                <p className="text-xs text-slate-400">No shedding events triggered yet.</p>
                <p className="text-[11px] text-slate-600">The microgrid is running normally within safe battery & solar margins.</p>
              </div>
            ) : (
              logs.map((log) => {
                const isCritical = log.failureRiskPercent >= 60;
                return (
                  <div
                    key={log.id}
                    className={`p-3 rounded-lg border text-xs space-y-1.5 ${
                      isCritical ? 'bg-rose-950/20 border-rose-500/30' : 'bg-slate-950 border-slate-800'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-[10px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        {new Date(log.timestamp * 1000).toLocaleTimeString()}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${getActionBadge(log.actionTaken)}`}>
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
    </section>
  );
};
