import React, { useState } from 'react';
import { ShieldAlert, Play, CloudRain, Sun, Moon, CheckCircle2 } from 'lucide-react';
import type { OptimizationResult } from '../utils/aiEngine';
import type { TelemetryData } from '../types';

interface ScenarioSimulatorProps {
  onRunSimulation: (simTelemetry: TelemetryData) => OptimizationResult;
  onApplyToHardware?: (commands: { target: 'RLY-001' | 'RLY-002' | 'RLY-003'; action: 'ON' | 'OFF' }[]) => Promise<void>;
}

export const ScenarioSimulator: React.FC<ScenarioSimulatorProps> = ({
  onRunSimulation,
  onApplyToHardware
}) => {
  const [simBattV, setSimBattV] = useState(3.38);
  const [simSolarV, setSimSolarV] = useState(0.2);
  const [simTemp, setSimTemp] = useState(21.0);
  const [simHumidity, setSimHumidity] = useState(88);
  const [simResult, setSimResult] = useState<OptimizationResult | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  // Presets
  const applyPreset = (name: 'storm' | 'night' | 'peak' | 'normal') => {
    switch (name) {
      case 'storm':
        setSimBattV(3.35);
        setSimSolarV(0.15);
        setSimTemp(19.5);
        setSimHumidity(92);
        break;
      case 'night':
        setSimBattV(3.42);
        setSimSolarV(0.0);
        setSimTemp(24.0);
        setSimHumidity(65);
        break;
      case 'peak':
        setSimBattV(4.15);
        setSimSolarV(5.2);
        setSimTemp(34.0);
        setSimHumidity(32);
        break;
      case 'normal':
      default:
        setSimBattV(3.85);
        setSimSolarV(4.3);
        setSimTemp(28.0);
        setSimHumidity(55);
        break;
    }
    setSimResult(null);
  };

  const handleExecute = () => {
    const battPercentage = Math.max(0, Math.min(100, Math.round(((simBattV - 3.2) / 1.0) * 100)));
    const estimatedPower = simSolarV > 1.5 ? Math.min(simSolarV * 0.12, 0.6) : 0.0;

    const mockTelemetry: TelemetryData = {
      timestamp: Math.floor(Date.now() / 1000),
      deviceId: 'ESP32-MG-001 (SIM)',
      firmwareVersion: 'v1.0.2',
      battery: {
        voltage: simBattV,
        percentage: battPercentage
      },
      solar: {
        voltage: simSolarV,
        estimatedPower
      },
      environment: {
        temperature: simTemp,
        humidity: simHumidity
      },
      loads: [
        { id: 'RLY-001', gpioPin: 26, physicalState: 'ON' },
        { id: 'RLY-002', gpioPin: 25, physicalState: 'ON' },
        { id: 'RLY-003', gpioPin: 27, physicalState: 'ON' }
      ]
    };

    const result = onRunSimulation(mockTelemetry);
    setSimResult(result);
  };

  const handleSendToHardware = async () => {
    if (!simResult || !onApplyToHardware) return;
    setIsApplying(true);
    try {
      await onApplyToHardware(simResult.commandsToDispatch);
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="p-5 bg-slate-900/80 border border-slate-800/80 rounded-2xl backdrop-blur-md shadow-xl flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-amber-500/10 text-amber-400 rounded-lg border border-amber-500/20">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">SIH 2026 Jury Grid Scenario Simulator</h3>
              <p className="text-[11px] text-slate-400">Stress-test Random Forest load-shedding response</p>
            </div>
          </div>
        </div>

        {/* Quick Scenario Presets */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
          <button
            onClick={() => applyPreset('storm')}
            className="flex items-center justify-center gap-1.5 p-2 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[11px] text-rose-300 font-semibold transition"
          >
            <CloudRain className="w-3.5 h-3.5" />
            Impending Storm
          </button>
          <button
            onClick={() => applyPreset('night')}
            className="flex items-center justify-center gap-1.5 p-2 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[11px] text-indigo-300 font-semibold transition"
          >
            <Moon className="w-3.5 h-3.5" />
            Night Deficit
          </button>
          <button
            onClick={() => applyPreset('peak')}
            className="flex items-center justify-center gap-1.5 p-2 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[11px] text-amber-300 font-semibold transition"
          >
            <Sun className="w-3.5 h-3.5" />
            Peak Sun
          </button>
          <button
            onClick={() => applyPreset('normal')}
            className="flex items-center justify-center gap-1.5 p-2 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[11px] text-emerald-300 font-semibold transition"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Nominal Grid
          </button>
        </div>

        {/* Interactive Sliders */}
        <div className="space-y-3 text-xs bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80 mb-4">
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-slate-400">Battery Cell Voltage:</span>
              <span className="font-mono font-bold text-emerald-400">{simBattV.toFixed(2)} V</span>
            </div>
            <input
              type="range"
              min="3.15"
              max="4.20"
              step="0.01"
              value={simBattV}
              onChange={(e) => setSimBattV(parseFloat(e.target.value))}
              className="w-full accent-emerald-400 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-slate-400">Solar PV Voltage:</span>
              <span className="font-mono font-bold text-amber-400">{simSolarV.toFixed(2)} V</span>
            </div>
            <input
              type="range"
              min="0.0"
              max="5.5"
              step="0.1"
              value={simSolarV}
              onChange={(e) => setSimSolarV(parseFloat(e.target.value))}
              className="w-full accent-amber-400 cursor-pointer"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">DHT11 Temp (°C)</label>
              <input
                type="number"
                value={simTemp}
                onChange={(e) => setSimTemp(parseFloat(e.target.value) || 20)}
                className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-white font-mono text-xs"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">DHT11 Humidity (%)</label>
              <input
                type="number"
                value={simHumidity}
                onChange={(e) => setSimHumidity(parseFloat(e.target.value) || 50)}
                className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-white font-mono text-xs"
              />
            </div>
          </div>
        </div>

        {/* Simulation Output Card */}
        {simResult && (
          <div className="p-3.5 bg-slate-950 border border-slate-700/80 rounded-xl space-y-2 mb-4 animate-in fade-in">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Random Forest Forecast:</span>
              <span className="font-bold text-amber-300">
                {simResult.weather} ({(simResult.confidence * 100).toFixed(0)}% Tree Vote)
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Grid Failure Risk Index:</span>
              <span
                className={`font-bold font-mono ${
                  simResult.failureRiskPercent > 60
                    ? 'text-rose-400'
                    : simResult.failureRiskPercent > 30
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                }`}
              >
                {simResult.failureRiskPercent}%
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Est. Time to Depletion:</span>
              <span className="font-mono text-white font-bold">{simResult.timeToDepletionMins} minutes</span>
            </div>

            <div className="p-2 bg-slate-900/90 rounded border border-slate-800 text-[11px] text-slate-300 leading-relaxed">
              <strong className="text-cyan-300 block mb-0.5">Autonomous Decision:</strong>
              {simResult.justificationLog.justificationReason}
            </div>

            {simResult.commandsToDispatch.length > 0 && onApplyToHardware && (
              <button
                onClick={handleSendToHardware}
                disabled={isApplying}
                className="w-full mt-2 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-bold font-mono transition"
              >
                {isApplying ? 'Dispatching...' : `Dispatch Shedding Commands (${simResult.commandsToDispatch.length}) to ESP32`}
              </button>
            )}
          </div>
        )}
      </div>

      <button
        onClick={handleExecute}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-slate-950 font-extrabold text-xs shadow-lg shadow-amber-950/40 hover:opacity-95 transition active:scale-[0.99]"
      >
        <Play className="w-3.5 h-3.5 fill-current" />
        Simulate AI Load-Shedding Decision
      </button>
    </div>
  );
};
