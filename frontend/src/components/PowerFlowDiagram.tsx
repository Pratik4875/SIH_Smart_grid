import React from 'react';
import { Sun, Battery, HeartPulse, Lightbulb, Droplets, Zap, Activity } from 'lucide-react';
import type { TelemetryData, LoadConfig } from '../types';

interface PowerFlowDiagramProps {
  telemetry: TelemetryData | null;
  configs: Record<string, LoadConfig>;
  failureRisk: number;
  isConnected: boolean;
  onToggleLoad?: (id: 'RLY-001' | 'RLY-002' | 'RLY-003', action: 'ON' | 'OFF') => Promise<void>;
}

export const PowerFlowDiagram: React.FC<PowerFlowDiagramProps> = ({
  telemetry,
  configs,
  failureRisk,
  isConnected,
  onToggleLoad
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
    <div className="space-y-6">
      {/* Top Banner KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#0e1320] border border-slate-800/80 shadow-lg">
          <div className="flex justify-between items-center text-xs text-slate-400 mb-2">
            <span>Total Generation (PV)</span>
            <Sun className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold font-mono text-amber-400">
            {isConnected ? `${solarW.toFixed(2)} W` : '-- W'}
          </div>
          <span className="text-[11px] text-slate-500 font-mono">0.6W Peak Panel @ {isConnected ? `${solarV.toFixed(2)}V` : '--'}</span>
        </div>

        <div className="p-5 rounded-2xl bg-[#0e1320] border border-slate-800/80 shadow-lg">
          <div className="flex justify-between items-center text-xs text-slate-400 mb-2">
            <span>Battery State of Charge</span>
            <Battery className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold font-mono text-emerald-400">
            {isConnected ? `${batteryPct}%` : '--%'}
          </div>
          <span className="text-[11px] text-slate-500 font-mono">18650 Cell @ {isConnected ? `${batteryV.toFixed(2)}V` : '--'}</span>
        </div>

        <div className="p-5 rounded-2xl bg-[#0e1320] border border-slate-800/80 shadow-lg">
          <div className="flex justify-between items-center text-xs text-slate-400 mb-2">
            <span>Active Circuit Load</span>
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-extrabold font-mono text-cyan-400">
            {isConnected ? `${totalLoadW.toFixed(2)} W` : '-- W'}
          </div>
          <span className="text-[11px] text-slate-500 font-mono">{(isLoad1On ? 1 : 0) + (isLoad2On ? 1 : 0) + (isLoad3On ? 1 : 0)} of 3 Actuators ON</span>
        </div>

        <div className="p-5 rounded-2xl bg-[#0e1320] border border-slate-800/80 shadow-lg">
          <div className="flex justify-between items-center text-xs text-slate-400 mb-2">
            <span>Net Power Balance</span>
            <Zap className="w-4 h-4 text-emerald-400" />
          </div>
          <div className={`text-2xl font-extrabold font-mono ${netPowerW >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {isConnected ? `${netPowerW >= 0 ? '+' : ''}${netPowerW.toFixed(2)} W` : '-- W'}
          </div>
          <span className="text-[11px] text-slate-500 font-mono">{netPowerW >= 0 ? 'Battery Charging' : 'Battery Discharging'}</span>
        </div>
      </div>

      {/* Main Interactive Diagram Card */}
      <div className="p-6 sm:p-8 rounded-2xl bg-[#0e1320] border border-slate-800/80 shadow-2xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-8">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              Microgrid Power Flow & Energy Routing Topology
            </h2>
            <p className="text-xs text-slate-400">
              Real-time energy routing between Generation, 18650 Battery, and the 3 Priority Edge Actuators
            </p>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-950 border border-slate-800 text-xs font-mono">
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-ping' : 'bg-rose-500'}`} />
            <span className="text-slate-300">Live Grid Strain:</span>
            <span className={`font-bold ${failureRisk >= 60 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {isConnected ? `${failureRisk}%` : '--'}
            </span>
          </div>
        </div>

        {/* 3-Column Diagram Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {/* Column 1: Power Generation Source */}
          <div className="flex flex-col justify-between p-6 rounded-2xl bg-gradient-to-b from-[#0b0f19] to-[#070a12] border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 font-mono">
                Source Node (PV)
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                GPIO 34
              </span>
            </div>

            <div className="py-4 text-center">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-3 shadow-lg shadow-amber-500/10">
                <Sun className={`w-8 h-8 ${isSolarGenerating ? 'animate-spin' : ''}`} style={{ animationDuration: '16s' }} />
              </div>
              <h3 className="text-base font-bold text-white">0.6W Solar Panel</h3>
              <p className="text-xs text-slate-400 mt-0.5">33k / 10k Voltage Divider (4.3x)</p>
            </div>

            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 text-xs font-mono space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">PV Voltage:</span>
                <span className="font-bold text-white">{isConnected ? `${solarV.toFixed(2)} V` : '--'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">PV Power:</span>
                <span className="font-bold text-amber-400">{isConnected ? `${solarW.toFixed(2)} W` : '--'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Harvest Status:</span>
                <span className={isSolarGenerating ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                  {isSolarGenerating ? 'Active' : 'No Sunlight'}
                </span>
              </div>
            </div>
          </div>

          {/* Column 2: Storage & Brain Node */}
          <div className="flex flex-col justify-between p-6 rounded-2xl bg-gradient-to-b from-[#0b0f19] to-[#070a12] border border-emerald-500/30 shadow-xl space-y-4 relative">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 font-mono">
                Storage & Controller
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                GPIO 35 & Pin 4
              </span>
            </div>

            <div className="py-2 text-center">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-3 shadow-lg shadow-emerald-500/10">
                <Battery className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-white">18650 Battery Cell</h3>
              <div className="text-3xl font-black font-mono text-emerald-400 my-1">
                {isConnected ? `${batteryV.toFixed(2)} V` : '--'}
              </div>
              <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden my-2">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                  style={{ width: `${Math.min(Math.max(batteryPct, 5), 100)}%` }}
                />
              </div>
              <span className="text-xs font-mono text-slate-400">SoC: <strong className="text-white">{isConnected ? `${batteryPct}%` : '--%'}</strong></span>
            </div>

            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 text-xs font-mono space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Safe Operating Range:</span>
                <span className="text-white">3.20V – 4.20V</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">ESP32 Loop Time:</span>
                <span className="text-emerald-400 font-bold">3000 ms</span>
              </div>
            </div>
          </div>

          {/* Column 3: Prioritized Actuators */}
          <div className="flex flex-col justify-between p-6 rounded-2xl bg-gradient-to-b from-[#0b0f19] to-[#070a12] border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 font-mono">
                Actuator Circuits
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                Active-LOW
              </span>
            </div>

            <div className="space-y-3">
              {/* Load 1 */}
              <div className={`p-3 rounded-xl border transition-all ${
                isLoad1On ? 'bg-rose-950/20 border-rose-500/40 shadow-sm' : 'bg-slate-950/60 border-slate-800'
              }`}>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <HeartPulse className="w-4 h-4 text-rose-400" />
                    <div>
                      <h4 className="text-xs font-bold text-white truncate max-w-[130px]">{cfg1.name}</h4>
                      <span className="text-[10px] text-slate-400 font-mono">RLY-001 (GPIO 26)</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded ${
                      isLoad1On ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {isLoad1On ? `${cfg1.nominalWatts}W` : 'SHED'}
                    </span>
                    {onToggleLoad && (
                      <button
                        onClick={() => onToggleLoad('RLY-001', isLoad1On ? 'OFF' : 'ON')}
                        className={`w-10 h-5 rounded-full relative transition-colors ${
                          isLoad1On ? 'bg-emerald-500' : 'bg-slate-800'
                        }`}
                      >
                        <span className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                          isLoad1On ? 'translate-x-5' : 'translate-x-0.5'
                        }`} />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Load 2 */}
              <div className={`p-3 rounded-xl border transition-all ${
                isLoad2On ? 'bg-amber-950/20 border-amber-500/40 shadow-sm' : 'bg-slate-950/60 border-slate-800'
              }`}>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-amber-400" />
                    <div>
                      <h4 className="text-xs font-bold text-white truncate max-w-[130px]">{cfg2.name}</h4>
                      <span className="text-[10px] text-slate-400 font-mono">RLY-002 (GPIO 25)</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded ${
                      isLoad2On ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {isLoad2On ? `${cfg2.nominalWatts}W` : 'SHED'}
                    </span>
                    {onToggleLoad && (
                      <button
                        onClick={() => onToggleLoad('RLY-002', isLoad2On ? 'OFF' : 'ON')}
                        className={`w-10 h-5 rounded-full relative transition-colors ${
                          isLoad2On ? 'bg-emerald-500' : 'bg-slate-800'
                        }`}
                      >
                        <span className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                          isLoad2On ? 'translate-x-5' : 'translate-x-0.5'
                        }`} />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Load 3 */}
              <div className={`p-3 rounded-xl border transition-all ${
                isLoad3On ? 'bg-blue-950/20 border-blue-500/40 shadow-sm' : 'bg-slate-950/60 border-slate-800'
              }`}>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Droplets className="w-4 h-4 text-blue-400" />
                    <div>
                      <h4 className="text-xs font-bold text-white truncate max-w-[130px]">{cfg3.name}</h4>
                      <span className="text-[10px] text-slate-400 font-mono">RLY-003 (GPIO 27)</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded ${
                      isLoad3On ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {isLoad3On ? `${cfg3.nominalWatts}W` : 'SHED'}
                    </span>
                    {onToggleLoad && (
                      <button
                        onClick={() => onToggleLoad('RLY-003', isLoad3On ? 'OFF' : 'ON')}
                        className={`w-10 h-5 rounded-full relative transition-colors ${
                          isLoad3On ? 'bg-emerald-500' : 'bg-slate-800'
                        }`}
                      >
                        <span className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                          isLoad3On ? 'translate-x-5' : 'translate-x-0.5'
                        }`} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 text-xs font-mono flex justify-between items-center">
              <span className="text-slate-400">Total Consumption:</span>
              <span className="text-white font-bold">{totalLoadW.toFixed(2)} W</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
