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
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Live Telemetry (Realtime Stream)
        </h2>
        <span className="text-[11px] font-mono text-slate-500">
          {hasData ? `Updated: ${new Date(telemetry.timestamp * 1000).toLocaleTimeString()}` : 'No edge packet received yet'}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Battery Cell Card */}
        <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-xl">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-semibold text-slate-400">18650 Battery Cell</span>
              <p className="text-[10px] text-slate-500 font-mono mt-0.5">GPIO 35 (10k/33k)</p>
            </div>
            <div className={`p-2 rounded-lg ${
              !hasData ? 'bg-slate-800 text-slate-500' :
              (batteryV ?? 0) <= 3.35 ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
              (batteryV ?? 0) <= 3.6 ? 'bg-amber-500/20 text-amber-400' :
              'bg-emerald-500/15 text-emerald-400'
            }`}>
              <Battery className="w-5 h-5" />
            </div>
          </div>

          <div className="mt-3 flex items-baseline justify-between">
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-bold font-mono tracking-tight text-white">
                {batteryV !== null ? batteryV.toFixed(2) : '--'}
              </span>
              <span className="text-sm text-slate-400">V</span>
            </div>
            <span className={`text-base font-bold font-mono ${
              !hasData ? 'text-slate-500' : (batteryV ?? 0) <= 3.4 ? 'text-rose-400' : 'text-emerald-400'
            }`}>
              {batteryPct !== null ? `${batteryPct}%` : '--'}
            </span>
          </div>

          <div className="mt-3 w-full bg-slate-950 rounded-full h-2">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                !hasData ? 'bg-slate-800' :
                (batteryV ?? 0) <= 3.35 ? 'bg-rose-500' :
                (batteryV ?? 0) <= 3.6 ? 'bg-amber-500' :
                'bg-emerald-500'
              }`}
              style={{ width: hasData && batteryPct !== null ? `${Math.min(Math.max(batteryPct, 5), 100)}%` : '0%' }}
            />
          </div>

          <div className="mt-3 flex justify-between items-center text-[10px] text-slate-500 font-mono pt-2 border-t border-slate-800/60">
            <span>Range: 3.2V - 4.2V</span>
            <span>{hasData ? ((batteryV ?? 0) > 3.4 ? 'Operating' : 'Low Reserve') : 'Standby'}</span>
          </div>
        </div>

        {/* 2. Solar PV Card */}
        <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-xl">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-semibold text-slate-400">Solar PV Panel</span>
              <p className="text-[10px] text-slate-500 font-mono mt-0.5">GPIO 34 (33k/10k)</p>
            </div>
            <div className="p-2 rounded-lg bg-amber-500/15 text-amber-400">
              <Sun className="w-5 h-5" />
            </div>
          </div>

          <div className="mt-3 flex items-baseline justify-between">
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-bold font-mono tracking-tight text-white">
                {solarV !== null ? solarV.toFixed(2) : '--'}
              </span>
              <span className="text-sm text-slate-400">V</span>
            </div>
            <span className="text-base font-bold font-mono text-amber-400">
              {solarW !== null ? `${solarW.toFixed(2)} W` : '--'}
            </span>
          </div>

          <div className="mt-3 w-full bg-slate-950 rounded-full h-2">
            <div
              className="h-full rounded-full bg-amber-500 transition-all duration-500"
              style={{ width: hasData && solarV !== null ? `${Math.min((solarV / 6.0) * 100, 100)}%` : '0%' }}
            />
          </div>

          <div className="mt-3 flex justify-between items-center text-[10px] text-slate-500 font-mono pt-2 border-t border-slate-800/60">
            <span>0.6W Peak Panel</span>
            <span>{hasData ? ((solarV ?? 0) > 1.5 ? 'Harvesting' : 'No Sunlight') : 'Standby'}</span>
          </div>
        </div>

        {/* 3. DHT11 Temperature Card */}
        <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-xl">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-semibold text-slate-400">DHT11 Temperature</span>
              <p className="text-[10px] text-slate-500 font-mono mt-0.5">Pin 4 Data</p>
            </div>
            <div className="p-2 rounded-lg bg-cyan-500/15 text-cyan-400">
              <Activity className="w-5 h-5" />
            </div>
          </div>

          <div className="mt-3 flex items-baseline justify-between">
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-bold font-mono tracking-tight text-white">
                {temp !== null ? temp.toFixed(1) : '--'}
              </span>
              <span className="text-sm text-slate-400">°C</span>
            </div>
            <span className="text-xs font-mono text-slate-400">
              {temp !== null ? `${(temp * 1.8 + 32).toFixed(1)} °F` : ''}
            </span>
          </div>

          <div className="mt-3 w-full bg-slate-950 rounded-full h-2">
            <div
              className="h-full rounded-full bg-cyan-500 transition-all duration-500"
              style={{ width: hasData && temp !== null ? `${Math.min((temp / 50) * 100, 100)}%` : '0%' }}
            />
          </div>

          <div className="mt-3 flex justify-between items-center text-[10px] text-slate-500 font-mono pt-2 border-t border-slate-800/60">
            <span>Thermal Input for AI</span>
            <span>{hasData ? 'Valid' : 'Waiting...'}</span>
          </div>
        </div>

        {/* 4. DHT11 Humidity Card */}
        <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-xl">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-semibold text-slate-400">DHT11 Humidity</span>
              <p className="text-[10px] text-slate-500 font-mono mt-0.5">Rain / Cloud Predictor</p>
            </div>
            <div className="p-2 rounded-lg bg-indigo-500/15 text-indigo-400">
              <CloudRain className="w-5 h-5" />
            </div>
          </div>

          <div className="mt-3 flex items-baseline justify-between">
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-bold font-mono tracking-tight text-white">
                {humidity !== null ? humidity.toFixed(0) : '--'}
              </span>
              <span className="text-sm text-slate-400">%</span>
            </div>
            <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded ${
              !hasData ? 'text-slate-500' :
              failureRisk >= 60 ? 'bg-rose-500/20 text-rose-300' :
              failureRisk >= 30 ? 'bg-amber-500/20 text-amber-300' :
              'bg-emerald-500/20 text-emerald-300'
            }`}>
              {hasData ? `Grid Risk: ${failureRisk}%` : 'Risk: --'}
            </span>
          </div>

          <div className="mt-3 w-full bg-slate-950 rounded-full h-2">
            <div
              className="h-full rounded-full bg-indigo-500 transition-all duration-500"
              style={{ width: hasData && humidity !== null ? `${Math.min(humidity, 100)}%` : '0%' }}
            />
          </div>

          <div className="mt-3 flex justify-between items-center text-[10px] text-slate-500 font-mono pt-2 border-t border-slate-800/60">
            <span>Weather Classifier Input</span>
            <span>{hasData ? (humidity! > 75 ? 'Rain Prob High' : 'Clear Sky') : 'Waiting...'}</span>
          </div>
        </div>
      </div>
    </section>
  );
};
