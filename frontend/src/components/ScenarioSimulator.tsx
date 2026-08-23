import React, { useState } from 'react';
import { Play, CloudRain, Sun, Moon, CheckCircle2, ShieldAlert } from 'lucide-react';
import type { OptimizationResult } from '../utils/aiEngine';
import type { TelemetryData } from '../types';

interface ScenarioSimulatorProps {
  onRunSimulation: (simTelemetry: TelemetryData) => OptimizationResult;
  onApplyToHardware?: (commands: { target: 'RLY-001' | 'RLY-002' | 'RLY-003'; action: 'ON' | 'OFF' }[]) => Promise<void>;
  isConnected: boolean;
}

export const ScenarioSimulator: React.FC<ScenarioSimulatorProps> = ({
  onRunSimulation,
  onApplyToHardware,
  isConnected
}) => {
  const [scenarioName, setScenarioName] = useState<'storm' | 'night' | 'peak' | 'normal'>('storm');
  const [simBattV, setSimBattV] = useState(3.35); // ~2 hours remaining
  const [simSolarV, setSimSolarV] = useState(0.2);
  const [simTemp, setSimTemp] = useState(19.5);
  const [simHumidity, setSimHumidity] = useState(90);
  const [simResult, setSimResult] = useState<OptimizationResult | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  const handleSelectPreset = (name: 'storm' | 'night' | 'peak' | 'normal') => {
    setScenarioName(name);
    switch (name) {
      case 'storm':
        setSimBattV(3.35);
        setSimSolarV(0.2);
        setSimTemp(19.5);
        setSimHumidity(90);
        break;
      case 'night':
        setSimBattV(3.40);
        setSimSolarV(0.0);
        setSimTemp(24.0);
        setSimHumidity(60);
        break;
      case 'peak':
        setSimBattV(4.15);
        setSimSolarV(5.2);
        setSimTemp(34.0);
        setSimHumidity(35);
        break;
      case 'normal':
        setSimBattV(3.85);
        setSimSolarV(4.2);
        setSimTemp(28.0);
        setSimHumidity(50);
        break;
    }
    setSimResult(null);
  };

  const handleRun = () => {
    const battPercentage = Math.max(0, Math.min(100, Math.round(((simBattV - 3.2) / 1.0) * 100)));
    const estimatedPower = simSolarV > 1.5 ? Math.min(simSolarV * 0.12, 0.6) : 0.0;

    const mockTelemetry: TelemetryData = {
      timestamp: Math.floor(Date.now() / 1000),
      deviceId: 'ESP32-MG-001 (SIMULATOR)',
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

  const handleApply = async () => {
    if (!simResult || !onApplyToHardware) return;
    setIsApplying(true);
    try {
      await onApplyToHardware(simResult.commandsToDispatch);
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-sm font-bold text-white tracking-tight">
          Scenario Simulator & Stress Testing Form
        </h2>
        <p className="text-xs text-slate-400">
          Inject hypothetical edge grid anomalies to force AI load-shedding and evaluate jury demonstrations
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form Controls */}
        <div className="p-6 rounded-2xl bg-[#0e1320] border border-slate-800/80 shadow-lg space-y-5">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-2.5">Select Preset Scenario</label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleSelectPreset('storm')}
                className={`p-3 rounded-xl border text-left text-xs transition-all ${
                  scenarioName === 'storm'
                    ? 'bg-rose-500/15 border-rose-500/40 text-rose-200 font-semibold shadow-md'
                    : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <CloudRain className="w-4 h-4 text-rose-400" />
                  <span className="font-bold text-white">Impending Storm</span>
                </div>
                <span className="text-[11px] opacity-70">Humidity 90% • Batt 3.35V</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectPreset('night')}
                className={`p-3 rounded-xl border text-left text-xs transition-all ${
                  scenarioName === 'night'
                    ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-200 font-semibold shadow-md'
                    : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Moon className="w-4 h-4 text-indigo-400" />
                  <span className="font-bold text-white">Night Deficit</span>
                </div>
                <span className="text-[11px] opacity-70">Solar 0V • Batt 3.40V</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectPreset('peak')}
                className={`p-3 rounded-xl border text-left text-xs transition-all ${
                  scenarioName === 'peak'
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-200 font-semibold shadow-md'
                    : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span className="font-bold text-white">Peak Solar Surge</span>
                </div>
                <span className="text-[11px] opacity-70">Solar 5.2V • Batt 4.15V</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectPreset('normal')}
                className={`p-3 rounded-xl border text-left text-xs transition-all ${
                  scenarioName === 'normal'
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-200 font-semibold shadow-md'
                    : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold text-white">Nominal Baseline</span>
                </div>
                <span className="text-[11px] opacity-70">Solar 4.2V • Batt 3.85V</span>
              </button>
            </div>
          </div>

          {/* Sliders */}
          <div className="space-y-4 pt-3 border-t border-slate-800/80 text-xs">
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-slate-400 font-medium">Hypothetical Battery Cell:</span>
                <span className="font-mono font-bold text-emerald-400 text-sm">{simBattV.toFixed(2)} V</span>
              </div>
              <input
                type="range"
                min="3.15"
                max="4.20"
                step="0.01"
                value={simBattV}
                onChange={(e) => setSimBattV(parseFloat(e.target.value))}
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-slate-400 font-medium">Hypothetical Solar PV:</span>
                <span className="font-mono font-bold text-amber-400 text-sm">{simSolarV.toFixed(2)} V</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="5.5"
                step="0.1"
                value={simSolarV}
                onChange={(e) => setSimSolarV(parseFloat(e.target.value))}
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">DHT11 Temp (°C)</label>
                <input
                  type="number"
                  value={simTemp}
                  onChange={(e) => setSimTemp(parseFloat(e.target.value) || 20)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-mono text-xs"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">DHT11 Humidity (%)</label>
                <input
                  type="number"
                  value={simHumidity}
                  onChange={(e) => setSimHumidity(parseFloat(e.target.value) || 50)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-mono text-xs"
                />
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRun}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition active:scale-[0.99]"
          >
            <Play className="w-4 h-4 fill-current" />
            Evaluate Scenario with Random Forest
          </button>
        </div>

        {/* Output Justification */}
        <div className="p-6 rounded-2xl bg-[#0e1320] border border-slate-800/80 shadow-lg flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
              AI Prediction & Load-Shedding Decision
            </h3>

            {simResult ? (
              <div className="space-y-4 text-xs">
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2.5">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Random Forest Forecast:</span>
                    <span className="font-bold text-amber-300 text-sm">
                      {simResult.weather} ({(simResult.confidence * 100).toFixed(0)}% Vote)
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Grid Failure Risk Index:</span>
                    <span className={`font-mono font-bold text-sm ${
                      simResult.failureRiskPercent >= 60 ? 'text-rose-400' :
                      simResult.failureRiskPercent >= 30 ? 'text-amber-400' : 'text-emerald-400'
                    }`}>
                      {simResult.failureRiskPercent}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Time to Depletion (TTD):</span>
                    <span className="font-mono text-white font-bold">{simResult.timeToDepletionMins} minutes</span>
                  </div>
                </div>

                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                  <strong className="text-cyan-300 block mb-1.5 text-xs">Explainable AI Justification:</strong>
                  <p className="text-slate-300 text-xs leading-relaxed">
                    {simResult.justificationLog.justificationReason}
                  </p>
                </div>

                {simResult.commandsToDispatch.length > 0 && (
                  <div className="p-3 bg-rose-950/20 border border-rose-500/30 rounded-xl text-rose-300 text-xs space-y-1">
                    <strong className="block text-rose-200">Autonomous Actions Dispatched:</strong>
                    {simResult.commandsToDispatch.map((cmd) => (
                      <div key={cmd.target} className="font-mono text-[11px]">
                        • {cmd.target} ➔ {cmd.action} ({cmd.reason})
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="py-20 text-center text-slate-500 text-xs flex flex-col items-center justify-center gap-2">
                <ShieldAlert className="w-8 h-8 text-slate-700" />
                <p>Select a scenario or customize parameters to test how the AI algorithm responds.</p>
              </div>
            )}
          </div>

          {simResult && simResult.commandsToDispatch.length > 0 && onApplyToHardware && (
            <button
              onClick={handleApply}
              disabled={isApplying || !isConnected}
              className="mt-4 w-full py-2.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold text-xs transition disabled:opacity-50"
            >
              {isApplying ? 'Dispatching to ESP32...' : (isConnected ? 'Dispatch Decision to Physical Hardware' : 'Connect ESP32 to Dispatch')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
