import React from 'react';
import { Sun, Battery, Cpu, HeartPulse, Lightbulb, Droplets, Zap } from 'lucide-react';
import type { TelemetryData, LoadConfig } from '../types';

interface PowerFlowDiagramProps {
  telemetry: TelemetryData | null;
  configs: Record<string, LoadConfig>;
  failureRisk: number;
  isConnected: boolean;
}

export const PowerFlowDiagram: React.FC<PowerFlowDiagramProps> = ({
  telemetry,
  configs,
  failureRisk,
  isConnected
}) => {
  const solarV = telemetry?.solar.voltage ?? 0;
  const solarW = telemetry?.solar.estimatedPower ?? 0;
  const batteryV = telemetry?.battery.voltage ?? 0;
  const batteryPct = telemetry?.battery.percentage ?? 0;
  const isSolarGenerating = isConnected && solarV > 1.5;

  const loads = telemetry?.loads || [
    { id: 'RLY-001', gpioPin: 26, physicalState: 'OFF' },
    { id: 'RLY-002', gpioPin: 25, physicalState: 'OFF' },
    { id: 'RLY-003', gpioPin: 27, physicalState: 'OFF' }
  ];

  const isLoad1On = isConnected && loads.find((l) => l.id === 'RLY-001')?.physicalState === 'ON';
  const isLoad2On = isConnected && loads.find((l) => l.id === 'RLY-002')?.physicalState === 'ON';
  const isLoad3On = isConnected && loads.find((l) => l.id === 'RLY-003')?.physicalState === 'ON';

  const cfg1 = configs['RLY-001'] || { name: 'Hospital ICU Ventilator', priority: 'CRITICAL', nominalWatts: 0.25 };
  const cfg2 = configs['RLY-002'] || { name: 'Emergency Streetlights', priority: 'MEDIUM', nominalWatts: 0.15 };
  const cfg3 = configs['RLY-003'] || { name: 'Agricultural Water Pump', priority: 'LOW', nominalWatts: 0.20 };

  const totalLoadW = (isLoad1On ? cfg1.nominalWatts : 0) + (isLoad2On ? cfg2.nominalWatts : 0) + (isLoad3On ? cfg3.nominalWatts : 0);
  const netPowerW = solarW - totalLoadW;

  return (
    <div className="p-6 rounded-2xl bg-[#0e1320] border border-slate-800/80 shadow-xl relative overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Zap className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Interactive Microgrid Power Flow Topology
            </h3>
            <p className="text-xs text-slate-400">
              Live energy distribution from Photovoltaic generation to Battery storage and prioritized circuits
            </p>
          </div>
        </div>

        {/* Power Balance Badge */}
        <div className="flex items-center gap-3 bg-slate-950 px-4 py-2 rounded-xl border border-slate-800 text-xs font-mono">
          <span className="text-slate-400">Grid Net Inflow:</span>
          <span className={`font-bold ${netPowerW >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {isConnected ? `${netPowerW >= 0 ? '+' : ''}${netPowerW.toFixed(2)} W` : '-- W'}
          </span>
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
            failureRisk >= 60 ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'
          }`}>
            Risk: {isConnected ? `${failureRisk}%` : '--'}
          </span>
        </div>
      </div>

      {/* Interactive Schematic Diagram */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center relative py-4">
        {/* Node 1: Sources (Solar PV & Grid) */}
        <div className="space-y-4">
          <div className={`p-4 rounded-2xl border transition-all ${
            isSolarGenerating ? 'bg-amber-950/20 border-amber-500/40 shadow-lg shadow-amber-500/5' : 'bg-slate-950/60 border-slate-800/80'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Sun className={`w-5 h-5 ${isSolarGenerating ? 'text-amber-400 animate-spin' : 'text-slate-500'}`} style={{ animationDuration: '12s' }} />
                <span className="text-xs font-bold text-white">0.6W Solar PV Array</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-amber-300 border border-slate-800">
                GPIO 34
              </span>
            </div>
            <div className="flex justify-between items-baseline text-xs font-mono">
              <span className="text-slate-400">Voltage: <strong className="text-white">{isConnected ? `${solarV.toFixed(2)}V` : '--'}</strong></span>
              <span className="text-slate-400">Generation: <strong className="text-amber-400">{isConnected ? `${solarW.toFixed(2)}W` : '--'}</strong></span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/60 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span className="text-slate-300 font-semibold">ESP32 Core Controller</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400">RTDB Sync 3s</span>
          </div>
        </div>

        {/* Node 2: Central Storage & Power Bus */}
        <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-emerald-500/30 shadow-xl relative group">
          <div className="absolute -top-3 px-3 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold tracking-wider uppercase font-mono">
            DC Microgrid Bus
          </div>

          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 my-2">
            <Battery className="w-8 h-8" />
          </div>

          <h4 className="text-sm font-bold text-white mt-1">18650 Storage Cell</h4>
          <div className="text-2xl font-black font-mono text-emerald-400 mt-0.5">
            {isConnected ? `${batteryV.toFixed(2)} V` : '--'}
          </div>
          <span className="text-xs font-mono text-slate-400 mt-0.5">
            State of Charge: <strong className="text-white">{isConnected ? `${batteryPct}%` : '--%'}</strong>
          </span>

          <div className="w-full bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
              style={{ width: `${Math.min(Math.max(batteryPct, 5), 100)}%` }}
            />
          </div>
        </div>

        {/* Node 3: Actuator Load Matrix */}
        <div className="space-y-3">
          {/* Load 1 */}
          <div className={`p-3.5 rounded-xl border transition-all ${
            isLoad1On
              ? 'bg-rose-950/20 border-rose-500/40 shadow-sm'
              : 'bg-slate-950/50 border-slate-800 opacity-60'
          }`}>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <HeartPulse className="w-4 h-4 text-rose-400" />
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-white truncate max-w-[140px]">{cfg1.name}</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 font-bold">CRITICAL</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">RLY-001 (GPIO 26 MOSFET)</span>
                </div>
              </div>
              <span className={`text-[11px] font-bold font-mono px-2 py-0.5 rounded ${
                isLoad1On ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
              }`}>
                {isLoad1On ? `${cfg1.nominalWatts}W` : 'SHED'}
              </span>
            </div>
          </div>

          {/* Load 2 */}
          <div className={`p-3.5 rounded-xl border transition-all ${
            isLoad2On
              ? 'bg-amber-950/20 border-amber-500/40 shadow-sm'
              : 'bg-slate-950/50 border-slate-800 opacity-60'
          }`}>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-400" />
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-white truncate max-w-[140px]">{cfg2.name}</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold">MEDIUM</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">RLY-002 (GPIO 25 Relay)</span>
                </div>
              </div>
              <span className={`text-[11px] font-bold font-mono px-2 py-0.5 rounded ${
                isLoad2On ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
              }`}>
                {isLoad2On ? `${cfg2.nominalWatts}W` : 'SHED'}
              </span>
            </div>
          </div>

          {/* Load 3 */}
          <div className={`p-3.5 rounded-xl border transition-all ${
            isLoad3On
              ? 'bg-blue-950/20 border-blue-500/40 shadow-sm'
              : 'bg-slate-950/50 border-slate-800 opacity-60'
          }`}>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Droplets className="w-4 h-4 text-blue-400" />
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-white truncate max-w-[140px]">{cfg3.name}</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 font-bold">LOW</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">RLY-003 (GPIO 27 Relay)</span>
                </div>
              </div>
              <span className={`text-[11px] font-bold font-mono px-2 py-0.5 rounded ${
                isLoad3On ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
              }`}>
                {isLoad3On ? `${cfg3.nominalWatts}W` : 'SHED'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
