import React from 'react';
import { Battery, Sun, Activity, CloudRain } from 'lucide-react';
import type { TelemetryData } from '../types';

interface TelemetryGaugesProps {
  telemetry: TelemetryData | null;
  failureRisk: number;
}

export const TelemetryGauges: React.FC<TelemetryGaugesProps> = ({ telemetry, failureRisk }) => {
  const battery = telemetry?.battery || { voltage: 3.82, percentage: 62 };
  const solar = telemetry?.solar || { voltage: 4.35, estimatedPower: 0.52 };
  const env = telemetry?.environment || { temperature: 28.6, humidity: 55 };

  // Battery health category
  const isBatteryLow = battery.voltage <= 3.4;
  const isBatteryCritical = battery.voltage <= 3.25;

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 my-6">
      {/* 1. 18650 Battery Cell Card */}
      <div className="relative p-5 bg-slate-900/90 border border-slate-800/80 rounded-2xl overflow-hidden backdrop-blur-md shadow-xl transition hover:border-slate-700">
        <div className="flex justify-between items-start">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">18650 Storage Cell</span>
            <p className="text-[10px] text-slate-500 font-mono mt-0.5">GPIO 35 • 10k/33k Divider (1.303x)</p>
          </div>
          <div className={`p-2 rounded-xl border ${
            isBatteryCritical ? 'bg-rose-500/20 text-rose-400 border-rose-500/30 animate-bounce' :
            isBatteryLow ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
            'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
          }`}>
            <Battery className="w-5 h-5" />
          </div>
        </div>

        <div className="mt-4 flex items-baseline justify-between">
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-black font-mono tracking-tight text-white">
              {battery.voltage.toFixed(2)}
            </span>
            <span className="text-sm font-semibold text-slate-400">V</span>
          </div>
          <div className={`text-base font-extrabold font-mono ${
            isBatteryLow ? 'text-amber-400' : 'text-emerald-400'
          }`}>
            {battery.percentage}%
          </div>
        </div>

        {/* Dynamic Battery Level Bar */}
        <div className="mt-3 w-full bg-slate-950 rounded-full h-2.5 p-0.5 border border-slate-800">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              isBatteryCritical ? 'bg-gradient-to-r from-rose-600 to-rose-400' :
              isBatteryLow ? 'bg-gradient-to-r from-amber-600 to-yellow-400' :
              'bg-gradient-to-r from-emerald-600 via-teal-400 to-cyan-300'
            }`}
            style={{ width: `${Math.min(Math.max(battery.percentage, 5), 100)}%` }}
          />
        </div>

        <div className="mt-3 flex justify-between items-center text-[10px] text-slate-400 pt-2 border-t border-slate-800/60 font-mono">
          <span>Min: 3.20V (0%)</span>
          <span className={isBatteryLow ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
            {isBatteryLow ? 'DRAIN STRAIN' : 'HEALTHY'}
          </span>
          <span>Max: 4.20V (100%)</span>
        </div>
      </div>

      {/* 2. Solar PV Inflow Card */}
      <div className="relative p-5 bg-slate-900/90 border border-slate-800/80 rounded-2xl overflow-hidden backdrop-blur-md shadow-xl transition hover:border-slate-700">
        <div className="flex justify-between items-start">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Solar PV Panel</span>
            <p className="text-[10px] text-slate-500 font-mono mt-0.5">GPIO 34 • 33k/10k Divider (4.30x)</p>
          </div>
          <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <Sun className="w-5 h-5 animate-[spin_12s_linear_infinite]" />
          </div>
        </div>

        <div className="mt-4 flex items-baseline justify-between">
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-black font-mono tracking-tight text-white">
              {solar.voltage.toFixed(2)}
            </span>
            <span className="text-sm font-semibold text-slate-400">V</span>
          </div>
          <div className="text-base font-extrabold font-mono text-amber-400">
            {solar.estimatedPower.toFixed(2)} <span className="text-xs font-normal text-amber-300/80">W</span>
          </div>
        </div>

        {/* Solar Voltage Progress */}
        <div className="mt-3 w-full bg-slate-950 rounded-full h-2.5 p-0.5 border border-slate-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-600 via-amber-400 to-yellow-300 transition-all duration-700"
            style={{ width: `${Math.min((solar.voltage / 6.0) * 100, 100)}%` }}
          />
        </div>

        <div className="mt-3 flex justify-between items-center text-[10px] text-slate-400 pt-2 border-t border-slate-800/60 font-mono">
          <span>0.6W Peak Rating</span>
          <span className="text-amber-400 font-semibold">
            {solar.voltage > 2.0 ? 'GENERATING' : 'INACTIVE'}
          </span>
          <span>Max: ~6.0V</span>
        </div>
      </div>

      {/* 3. DHT11 Temperature Card */}
      <div className="relative p-5 bg-slate-900/90 border border-slate-800/80 rounded-2xl overflow-hidden backdrop-blur-md shadow-xl transition hover:border-slate-700">
        <div className="flex justify-between items-start">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Thermal Gradient</span>
            <p className="text-[10px] text-slate-500 font-mono mt-0.5">GPIO 4 • DHT11 Environment Sensor</p>
          </div>
          <div className="p-2 rounded-xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
            <Activity className="w-5 h-5" />
          </div>
        </div>

        <div className="mt-4 flex items-baseline justify-between">
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-black font-mono tracking-tight text-white">
              {env.temperature.toFixed(1)}
            </span>
            <span className="text-sm font-semibold text-slate-400">°C</span>
          </div>
          <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
            {(env.temperature * 1.8 + 32).toFixed(1)} °F
          </span>
        </div>

        <div className="mt-3 w-full bg-slate-950 rounded-full h-2.5 p-0.5 border border-slate-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 transition-all duration-700"
            style={{ width: `${Math.min(Math.max((env.temperature / 50) * 100, 5), 100)}%` }}
          />
        </div>

        <div className="mt-3 flex justify-between items-center text-[10px] text-slate-400 pt-2 border-t border-slate-800/60 font-mono">
          <span>Optimal: 22-32°C</span>
          <span className="text-cyan-400 font-medium">Ambient Normal</span>
          <span>Max: 50°C</span>
        </div>
      </div>

      {/* 4. DHT11 Humidity & Weather Risk Card */}
      <div className="relative p-5 bg-slate-900/90 border border-slate-800/80 rounded-2xl overflow-hidden backdrop-blur-md shadow-xl transition hover:border-slate-700">
        <div className="flex justify-between items-start">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Relative Humidity</span>
            <p className="text-[10px] text-slate-500 font-mono mt-0.5">GPIO 4 • Cloud/Rain Inflow Index</p>
          </div>
          <div className="p-2 rounded-xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
            <CloudRain className="w-5 h-5" />
          </div>
        </div>

        <div className="mt-4 flex items-baseline justify-between">
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-black font-mono tracking-tight text-white">
              {env.humidity.toFixed(0)}
            </span>
            <span className="text-sm font-semibold text-slate-400">%</span>
          </div>
          <div className={`text-xs font-bold font-mono px-2 py-0.5 rounded border ${
            failureRisk > 60 ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' :
            failureRisk > 30 ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
            'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
          }`}>
            Risk: {failureRisk}%
          </div>
        </div>

        <div className="mt-3 w-full bg-slate-950 rounded-full h-2.5 p-0.5 border border-slate-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-400 to-pink-400 transition-all duration-700"
            style={{ width: `${Math.min(Math.max(env.humidity, 5), 100)}%` }}
          />
        </div>

        <div className="mt-3 flex justify-between items-center text-[10px] text-slate-400 pt-2 border-t border-slate-800/60 font-mono">
          <span>0% (Dry)</span>
          <span className={env.humidity > 75 ? 'text-indigo-300 font-bold' : 'text-slate-400'}>
            {env.humidity > 75 ? 'RAIN IMMINENT' : 'STABLE AIR'}
          </span>
          <span>100% (Sat)</span>
        </div>
      </div>
    </section>
  );
};
