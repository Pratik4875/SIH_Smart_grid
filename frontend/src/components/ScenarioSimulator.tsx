import React, { useState } from 'react';
import { Play, CloudRain, Sun, Moon, CheckCircle2 } from 'lucide-react';
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
  const [simBattV, setSimBattV] = useState(3.35); // ~2 hours of battery left
  const [simSolarV, setSimSolarV] = useState(0.2); // heavy cloud cover
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
    <section className="space-y-4">
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          3. Scenario Simulation & Stress Testing Form
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Input hypothetical edge conditions (e.g. storm forecast, severe solar drop, low battery reserve) to test AI load-shedding response
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form Controls */}
        <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-xl space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-2">Preset Hypothetical Scenarios</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleSelectPreset('storm')}
                className={`p-2.5 rounded-lg border text-left text-xs transition ${
                  scenarioName === 'storm'
                    ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 font-bold'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <CloudRain className="w-4 h-4 mb-1" />
                <span className="block font-semibold">Impending Storm</span>
                <span className="text-[10px] opacity-70">Humidity 90%, Batt 3.35V</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectPreset('night')}
                className={`p-2.5 rounded-lg border text-left text-xs transition ${
                  scenarioName === 'night'
                    ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300 font-bold'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Moon className="w-4 h-4 mb-1" />
                <span className="block font-semibold">Night Grid Deficit</span>
                <span className="text-[10px] opacity-70">Solar 0V, Batt 3.40V</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectPreset('peak')}
                className={`p-2.5 rounded-lg border text-left text-xs transition ${
                  scenarioName === 'peak'
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 font-bold'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Sun className="w-4 h-4 mb-1" />
                <span className="block font-semibold">Peak Solar Surge</span>
                <span className="text-[10px] opacity-70">Solar 5.2V, Batt 4.15V</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectPreset('normal')}
                className={`p-2.5 rounded-lg border text-left text-xs transition ${
                  scenarioName === 'normal'
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 font-bold'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 mb-1" />
                <span className="block font-semibold">Nominal Baseline</span>
                <span className="text-[10px] opacity-70">Solar 4.2V, Batt 3.85V</span>
              </button>
            </div>
          </div>

          {/* Sliders */}
          <div className="space-y-3 pt-2 border-t border-slate-800 text-xs">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-slate-400">Hypothetical Battery Cell Voltage:</span>
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
                <span className="text-slate-400">Hypothetical Solar PV Voltage:</span>
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
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white font-mono text-xs"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">DHT11 Humidity (%)</label>
                <input
                  type="number"
                  value={simHumidity}
                  onChange={(e) => setSimHumidity(parseFloat(e.target.value) || 50)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white font-mono text-xs"
                />
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRun}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition"
          >
            <Play className="w-4 h-4 fill-current" />
            Evaluate Scenario with Random Forest
          </button>
        </div>

        {/* Output Justification */}
        <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-xl flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Simulation Results & AI Inference
            </h3>

            {simResult ? (
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Random Forest Forecast:</span>
                    <span className="font-bold text-amber-300">{simResult.weather} ({(simResult.confidence * 100).toFixed(0)}% Vote)</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Grid Failure Risk Index:</span>
                    <span className={`font-mono font-bold ${
                      simResult.failureRiskPercent >= 60 ? 'text-rose-400' :
                      simResult.failureRiskPercent >= 30 ? 'text-amber-400' : 'text-emerald-400'
                    }`}>
                      {simResult.failureRiskPercent}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Est. Time to Depletion:</span>
                    <span className="font-mono text-white font-bold">{simResult.timeToDepletionMins} minutes</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <strong className="text-cyan-300 block mb-1 text-[11px]">Judge-Facing AI Explanation:</strong>
                  <p className="text-slate-300 text-xs leading-relaxed">
                    {simResult.justificationLog.justificationReason}
                  </p>
                </div>

                {simResult.commandsToDispatch.length > 0 && (
                  <div className="p-2.5 bg-rose-950/20 border border-rose-500/30 rounded-lg text-rose-300 text-xs">
                    <strong className="block mb-1">Autonomous Shedding Action:</strong>
                    {simResult.commandsToDispatch.map((cmd) => (
                      <div key={cmd.target} className="font-mono text-[11px]">
                        • {cmd.target} ➔ {cmd.action} ({cmd.reason})
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="py-16 text-center text-slate-500 text-xs">
                Select a scenario or adjust parameters and click "Evaluate Scenario" to see how the Random Forest makes decisions.
              </div>
            )}
          </div>

          {simResult && simResult.commandsToDispatch.length > 0 && onApplyToHardware && (
            <button
              onClick={handleApply}
              disabled={isApplying || !isConnected}
              className="mt-4 w-full py-2 rounded-lg bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold text-xs transition disabled:opacity-50"
            >
              {isApplying ? 'Dispatching to ESP32...' : (isConnected ? 'Dispatch Commands to Physical ESP32' : 'Connect ESP32 to Dispatch')}
            </button>
          )}
        </div>
      </div>
    </section>
  );
};
