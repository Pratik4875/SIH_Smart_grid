import React from 'react';
import { Battery, Sun, Activity, CloudRain } from 'lucide-react';
import type { TelemetryData } from '../types';

interface TelemetryGaugesProps {
  telemetry: TelemetryData | null;
  failureRisk: number;
  isConnected: boolean;
}

export const TelemetryGauges: React.FC<TelemetryGaugesProps> = ({ telemetry, failureRisk, isConnected }) => {
  const hasData = isConnected && telemetry !== null;

  const batteryV = hasData ? telemetry.battery.voltage : null;
  const batteryPct = hasData ? telemetry.battery.percentage : null;
  const solarV = hasData ? telemetry.solar.voltage : null;
  const solarW = hasData ? telemetry.solar.estimatedPower : null;
  const temp = hasData ? telemetry.environment.temperature : null;
  const humidity = hasData ? telemetry.environment.humidity : null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Battery Storage */}
      <div className="p-5 rounded-2xl bg-[#0e1320] border border-slate-800/80 shadow-lg relative overflow-hidden group hover:border-slate-700 transition">
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs font-semibold text-slate-400">18650 Battery Cell</span>
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Battery className="w-4 h-4" />
          </div>
        </div>

        <div className="flex items-baseline justify-between">
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-extrabold font-mono text-white tracking-tight">
              {batteryV !== null ? batteryV.toFixed(2) : '--'}
            </span>
            <span className="text-xs font-semibold text-slate-400">V</span>
          </div>
          <span className="px-2 py-0.5 rounded-full text-xs font-bold font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            {batteryPct !== null ? `${batteryPct}%` : '--%'}
          </span>
        </div>

        <div className="mt-4 w-full bg-slate-900 rounded-full h-2 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-700"
            style={{ width: `${Math.min(Math.max(batteryPct ?? 0, 5), 100)}%` }}
          />
        </div>

        <div className="mt-3 flex justify-between text-[11px] text-slate-500 font-mono">
          <span>Min: 3.2V (Cutoff)</span>
          <span>Max: 4.2V (Full)</span>
        </div>
      </div>

      {/* 2. Solar PV Input */}
      <div className="p-5 rounded-2xl bg-[#0e1320] border border-slate-800/80 shadow-lg relative overflow-hidden group hover:border-slate-700 transition">
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs font-semibold text-slate-400">Solar PV Panel</span>
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Sun className="w-4 h-4" />
          </div>
        </div>

        <div className="flex items-baseline justify-between">
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-extrabold font-mono text-white tracking-tight">
              {solarV !== null ? solarV.toFixed(2) : '--'}
            </span>
            <span className="text-xs font-semibold text-slate-400">V</span>
          </div>
          <span className="px-2 py-0.5 rounded-full text-xs font-bold font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20">
            {solarW !== null ? `${solarW.toFixed(2)} W` : '-- W'}
          </span>
        </div>

        <div className="mt-4 w-full bg-slate-900 rounded-full h-2 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-yellow-300 rounded-full transition-all duration-700"
            style={{ width: `${Math.min(((solarV ?? 0) / 6.0) * 100, 100)}%` }}
          />
        </div>

        <div className="mt-3 flex justify-between text-[11px] text-slate-500 font-mono">
          <span>0.6W Peak Rating</span>
          <span>33k/10k Divider</span>
        </div>
      </div>

      {/* 3. DHT11 Temperature */}
      <div className="p-5 rounded-2xl bg-[#0e1320] border border-slate-800/80 shadow-lg relative overflow-hidden group hover:border-slate-700 transition">
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs font-semibold text-slate-400">Ambient Temperature</span>
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Activity className="w-4 h-4" />
          </div>
        </div>

        <div className="flex items-baseline justify-between">
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-extrabold font-mono text-white tracking-tight">
              {temp !== null ? temp.toFixed(1) : '--'}
            </span>
            <span className="text-xs font-semibold text-slate-400">°C</span>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {temp !== null ? `${(temp * 1.8 + 32).toFixed(1)} °F` : '--'}
          </span>
        </div>

        <div className="mt-4 w-full bg-slate-900 rounded-full h-2 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-teal-400 rounded-full transition-all duration-700"
            style={{ width: `${Math.min(((temp ?? 0) / 50) * 100, 100)}%` }}
          />
        </div>

        <div className="mt-3 flex justify-between text-[11px] text-slate-500 font-mono">
          <span>DHT11 Sensor</span>
          <span>GPIO 4 Data</span>
        </div>
      </div>

      {/* 4. DHT11 Humidity & Risk */}
      <div className="p-5 rounded-2xl bg-[#0e1320] border border-slate-800/80 shadow-lg relative overflow-hidden group hover:border-slate-700 transition">
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs font-semibold text-slate-400">Relative Humidity</span>
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <CloudRain className="w-4 h-4" />
          </div>
        </div>

        <div className="flex items-baseline justify-between">
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-extrabold font-mono text-white tracking-tight">
              {humidity !== null ? humidity.toFixed(0) : '--'}
            </span>
            <span className="text-xs font-semibold text-slate-400">%</span>
          </div>
          <span className={`px-2 py-0.5 rounded-full text-xs font-bold font-mono border ${
            !hasData ? 'bg-slate-800 text-slate-500 border-slate-700' :
            failureRisk >= 60 ? 'bg-rose-500/15 text-rose-300 border-rose-500/30' :
            failureRisk >= 30 ? 'bg-amber-500/15 text-amber-300 border-amber-500/30' :
            'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
          }`}>
            Risk: {hasData ? `${failureRisk}%` : '--'}
          </span>
        </div>

        <div className="mt-4 w-full bg-slate-900 rounded-full h-2 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-400 rounded-full transition-all duration-700"
            style={{ width: `${Math.min(humidity ?? 0, 100)}%` }}
          />
        </div>

        <div className="mt-3 flex justify-between text-[11px] text-slate-500 font-mono">
          <span>Weather ML Input</span>
          <span>{hasData ? (humidity! > 75 ? 'Rain Warning' : 'Stable Air') : '--'}</span>
        </div>
      </div>
    </div>
  );
};
