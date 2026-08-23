import { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { TelemetryGauges } from './components/TelemetryGauges';
import { PowerChart } from './components/PowerChart';
import type { ChartDataPoint } from './components/PowerChart';
import { LoadControlPanel } from './components/LoadControlPanel';
import { ScenarioSimulator } from './components/ScenarioSimulator';
import { DecisionLog } from './components/DecisionLog';
import { FirebaseSetupModal } from './components/FirebaseSetupModal';
import { microgridService, DEFAULT_DEVICE_ID } from './firebase';
import { evaluateMicrogrid, defaultLoadConfigs } from './utils/aiEngine';
import type { OptimizationResult } from './utils/aiEngine';
import type { TelemetryData, LoadConfig, AIJustificationLog } from './types';

export default function App() {
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);
  const [logs, setLogs] = useState<AIJustificationLog[]>([]);
  const [loadConfigs, setLoadConfigs] = useState<Record<string, LoadConfig>>(defaultLoadConfigs);
  const [chartHistory, setChartHistory] = useState<ChartDataPoint[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [autoAiEnabled, setAutoAiEnabled] = useState<boolean>(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isSendingCommand, setIsSendingCommand] = useState<boolean>(false);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [currentRisk, setCurrentRisk] = useState<number>(15);

  const batteryHistoryRef = useRef<{ timestamp: number; voltage: number }[]>([]);
  const lastActionTimeRef = useRef<number>(0);

  // 1. Subscribe to Firebase Realtime Database
  useEffect(() => {
    // A. Telemetry Stream
    const unsubTelemetry = microgridService.subscribeTelemetry(DEFAULT_DEVICE_ID, (data) => {
      if (data) {
        setTelemetry(data);
        setIsConnected(true);

        // Update Chart History (rolling 30 points)
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const newPoint: ChartDataPoint = {
          time: timeStr,
          batteryV: Number(data.battery.voltage.toFixed(2)),
          solarV: Number(data.solar.voltage.toFixed(2)),
          powerW: Number(data.solar.estimatedPower.toFixed(2)),
          temp: Number(data.environment.temperature.toFixed(1))
        };

        setChartHistory((prev) => [...prev.slice(-25), newPoint]);

        // Track voltage history for dV/dt calculation
        batteryHistoryRef.current.push({
          timestamp: Math.floor(Date.now() / 1000),
          voltage: data.battery.voltage
        });
        if (batteryHistoryRef.current.length > 20) {
          batteryHistoryRef.current.shift();
        }

        // B. Run Microgrid Health Evaluation
        const opt = evaluateMicrogrid(data, loadConfigs, batteryHistoryRef.current);
        setCurrentRisk(opt.failureRiskPercent);

        // Autonomous Load-Shedding Trigger
        const nowSec = Math.floor(Date.now() / 1000);
        if (
          autoAiEnabled &&
          opt.commandsToDispatch.length > 0 &&
          nowSec - lastActionTimeRef.current > 10 // debounce 10s
        ) {
          lastActionTimeRef.current = nowSec;
          // Execute commands down to ESP32
          opt.commandsToDispatch.forEach((cmd) => {
            microgridService.sendCommand(cmd.target, cmd.action, DEFAULT_DEVICE_ID);
          });
          // Log justification
          microgridService.logDecision(opt.justificationLog, DEFAULT_DEVICE_ID);
        }
      } else {
        setIsConnected(false);
      }
    });

    // B. Decision Logs Stream
    const unsubLogs = microgridService.subscribeDecisionLogs(DEFAULT_DEVICE_ID, (fetchedLogs) => {
      setLogs(fetchedLogs);
    });

    // C. Load Configs from RTDB
    microgridService.getLoadConfigs(DEFAULT_DEVICE_ID).then((saved) => {
      if (saved) {
        setLoadConfigs((prev) => ({ ...prev, ...saved }));
      }
    });

    return () => {
      unsubTelemetry();
      unsubLogs();
    };
  }, [autoAiEnabled, loadConfigs]);

  // Fallback demo simulation data if ESP32 is offline during initial frontend test
  const activeTelemetry: TelemetryData = telemetry || {
    timestamp: Math.floor(Date.now() / 1000),
    deviceId: DEFAULT_DEVICE_ID,
    firmwareVersion: 'v1.0.2',
    battery: { voltage: 3.84, percentage: 64 },
    solar: { voltage: 4.35, estimatedPower: 0.52 },
    environment: { temperature: 28.5, humidity: 54 },
    loads: [
      { id: 'RLY-001', gpioPin: 26, physicalState: 'ON' },
      { id: 'RLY-002', gpioPin: 25, physicalState: 'ON' },
      { id: 'RLY-003', gpioPin: 27, physicalState: 'OFF' }
    ]
  };

  // 2. Manual Load Toggle Handler
  const handleToggleLoad = async (id: 'RLY-001' | 'RLY-002' | 'RLY-003', action: 'ON' | 'OFF') => {
    setIsSendingCommand(true);
    try {
      await microgridService.sendCommand(id, action, DEFAULT_DEVICE_ID);
      // Optimistic local state update
      setTelemetry((prev) => {
        if (!prev) return prev;
        const updatedLoads = prev.loads.map((l) => (l.id === id ? { ...l, physicalState: action } : l));
        return { ...prev, loads: updatedLoads };
      });
    } catch (e) {
      console.error('[MANUAL_TOGGLE_ERR]', e);
    } finally {
      setIsSendingCommand(false);
    }
  };

  // 3. Save Configuration Handler
  const handleSaveConfigs = async (newConfigs: Record<string, LoadConfig>) => {
    setLoadConfigs(newConfigs);
    await microgridService.saveLoadConfigs(newConfigs, DEFAULT_DEVICE_ID);
  };

  // 4. Manual AI Audit Trigger
  const handleManualAiAudit = async () => {
    setIsEvaluating(true);
    try {
      const opt = evaluateMicrogrid(activeTelemetry, loadConfigs, batteryHistoryRef.current);
      setCurrentRisk(opt.failureRiskPercent);
      if (opt.commandsToDispatch.length > 0) {
        for (const cmd of opt.commandsToDispatch) {
          await microgridService.sendCommand(cmd.target, cmd.action, DEFAULT_DEVICE_ID);
        }
      }
      await microgridService.logDecision(opt.justificationLog, DEFAULT_DEVICE_ID);
    } finally {
      setIsEvaluating(false);
    }
  };

  // 5. Scenario Simulation Trigger
  const handleRunSimulation = (simTelemetry: TelemetryData): OptimizationResult => {
    return evaluateMicrogrid(simTelemetry, loadConfigs, batteryHistoryRef.current);
  };

  // 6. Apply Simulation Output to Physical Hardware
  const handleApplySimToHardware = async (
    commands: { target: 'RLY-001' | 'RLY-002' | 'RLY-003'; action: 'ON' | 'OFF' }[]
  ) => {
    for (const cmd of commands) {
      await microgridService.sendCommand(cmd.target, cmd.action, DEFAULT_DEVICE_ID);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 font-sans selection:bg-emerald-500 selection:text-black">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* App Header */}
        <Header
          isConnected={isConnected}
          deviceId={DEFAULT_DEVICE_ID}
          autoAiEnabled={autoAiEnabled}
          onToggleAutoAi={() => setAutoAiEnabled(!autoAiEnabled)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onManualAiEval={handleManualAiAudit}
          isEvaluating={isEvaluating}
        />

        {/* Live Telemetry KPI Gauges */}
        <TelemetryGauges telemetry={activeTelemetry} failureRisk={currentRisk} />

        {/* Load Control & Actuator Configuration Panel */}
        <LoadControlPanel
          loads={activeTelemetry.loads}
          configs={loadConfigs}
          onToggleLoad={handleToggleLoad}
          onSaveConfigs={handleSaveConfigs}
          isSendingCommand={isSendingCommand}
        />

        {/* Power Flow Graph & Jury Scenario Simulator */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PowerChart data={chartHistory} />
          <ScenarioSimulator
            onRunSimulation={handleRunSimulation}
            onApplyToHardware={handleApplySimToHardware}
          />
        </div>

        {/* Explainable AI Decision Log Stream */}
        <div className="grid grid-cols-1 gap-6">
          <DecisionLog logs={logs} />
        </div>

        {/* Footer */}
        <footer className="pt-6 border-t border-slate-800/60 text-center text-xs text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-2">
          <span>Smart India Hackathon 2026 • SIH Smart Grid System</span>
          <span className="font-mono text-emerald-400/80">Deployed on sih.synthrobotics.dev</span>
        </footer>
      </div>

      {/* Settings Modal */}
      <FirebaseSetupModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
}
