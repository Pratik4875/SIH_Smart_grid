import { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { PowerFlowDiagram } from './components/PowerFlowDiagram';
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
import type { TelemetryData, LoadConfig, AIJustificationLog, LoadState } from './types';

export default function App() {
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);
  const [logs, setLogs] = useState<AIJustificationLog[]>([]);
  const [loadConfigs, setLoadConfigs] = useState<Record<string, LoadConfig>>(defaultLoadConfigs);
  const [chartHistory, setChartHistory] = useState<ChartDataPoint[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [autoAiEnabled, setAutoAiEnabled] = useState<boolean>(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isSendingCommand, setIsSendingCommand] = useState<boolean>(false);
  const [currentRisk, setCurrentRisk] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'overview' | 'telemetry' | 'config' | 'simulator' | 'ai'>('overview');
  const [currentWeather, setCurrentWeather] = useState<string>('Sunny');
  const [currentConfidence, setCurrentConfidence] = useState<number>(0.85);

  const batteryHistoryRef = useRef<{ timestamp: number; voltage: number }[]>([]);
  const lastActionTimeRef = useRef<number>(0);

  // 1. Realtime Database Subscription
  useEffect(() => {
    // Telemetry Stream
    const unsubTelemetry = microgridService.subscribeTelemetry(DEFAULT_DEVICE_ID, (data) => {
      if (data) {
        setTelemetry(data);
        setIsConnected(true);

        // Update Power Chart
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

        // Track voltage history
        batteryHistoryRef.current.push({
          timestamp: Math.floor(Date.now() / 1000),
          voltage: data.battery.voltage
        });
        if (batteryHistoryRef.current.length > 20) {
          batteryHistoryRef.current.shift();
        }

        // Run AI Microgrid Evaluation
        const opt = evaluateMicrogrid(data, loadConfigs, batteryHistoryRef.current);
        setCurrentRisk(opt.failureRiskPercent);
        setCurrentWeather(opt.weather);
        setCurrentConfidence(opt.confidence);

        // Autonomous Load Shedding
        const nowSec = Math.floor(Date.now() / 1000);
        if (
          autoAiEnabled &&
          opt.commandsToDispatch.length > 0 &&
          nowSec - lastActionTimeRef.current > 8
        ) {
          lastActionTimeRef.current = nowSec;
          opt.commandsToDispatch.forEach((cmd) => {
            microgridService.sendCommand(cmd.target, cmd.action, DEFAULT_DEVICE_ID);
          });
          microgridService.logDecision(opt.justificationLog, DEFAULT_DEVICE_ID);
        }
      } else {
        setIsConnected(false);
      }
    });

    // Decision Logs Stream
    const unsubLogs = microgridService.subscribeDecisionLogs(DEFAULT_DEVICE_ID, (fetchedLogs) => {
      setLogs(fetchedLogs);
    });

    // Load Configs
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

  // Default loads layout matching ESP32 firmware
  const currentLoads: LoadState[] = telemetry?.loads || [
    { id: 'RLY-001', gpioPin: 26, physicalState: 'OFF' },
    { id: 'RLY-002', gpioPin: 25, physicalState: 'OFF' },
    { id: 'RLY-003', gpioPin: 27, physicalState: 'OFF' }
  ];

  // Manual Toggle
  const handleToggleLoad = async (id: 'RLY-001' | 'RLY-002' | 'RLY-003', action: 'ON' | 'OFF') => {
    setIsSendingCommand(true);
    try {
      await microgridService.sendCommand(id, action, DEFAULT_DEVICE_ID);
      if (telemetry) {
        setTelemetry({
          ...telemetry,
          loads: telemetry.loads.map((l) => (l.id === id ? { ...l, physicalState: action } : l))
        });
      }
    } finally {
      setIsSendingCommand(false);
    }
  };

  // Save Configs
  const handleSaveConfigs = async (newConfigs: Record<string, LoadConfig>) => {
    setLoadConfigs(newConfigs);
    await microgridService.saveLoadConfigs(newConfigs, DEFAULT_DEVICE_ID);
  };

  // Scenario Simulation
  const handleRunSimulation = (simTelemetry: TelemetryData): OptimizationResult => {
    return evaluateMicrogrid(simTelemetry, loadConfigs, batteryHistoryRef.current);
  };

  const handleApplySimToHardware = async (
    commands: { target: 'RLY-001' | 'RLY-002' | 'RLY-003'; action: 'ON' | 'OFF' }[]
  ) => {
    for (const cmd of commands) {
      await microgridService.sendCommand(cmd.target, cmd.action, DEFAULT_DEVICE_ID);
    }
  };

  return (
    <div className="min-h-screen text-slate-100 p-4 sm:p-6 lg:p-8 font-sans selection:bg-emerald-500 selection:text-black">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <Header
          isConnected={isConnected}
          deviceId={DEFAULT_DEVICE_ID}
          autoAiEnabled={autoAiEnabled}
          onToggleAutoAi={() => setAutoAiEnabled(!autoAiEnabled)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />

        {/* 1. DASHBOARD OVERVIEW PAGE */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Live Interactive Power Flow Diagram */}
            <PowerFlowDiagram
              telemetry={telemetry}
              configs={loadConfigs}
              failureRisk={currentRisk}
              isConnected={isConnected}
            />

            {/* Primary KPI Gauges */}
            <TelemetryGauges
              telemetry={telemetry}
              failureRisk={currentRisk}
              isConnected={isConnected}
            />

            {/* Power Curves & AI Stream */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PowerChart data={chartHistory} />
              <DecisionLog
                logs={logs}
                weatherForecast={currentWeather}
                confidence={currentConfidence}
                failureRisk={currentRisk}
              />
            </div>

            {/* Actuators with Tactile Toggle Switches */}
            <LoadControlPanel
              loads={currentLoads}
              configs={loadConfigs}
              onToggleLoad={handleToggleLoad}
              onSaveConfigs={handleSaveConfigs}
              isSendingCommand={isSendingCommand}
              isConnected={isConnected}
            />
          </div>
        )}

        {/* 2. TELEMETRY & CURVES PAGE */}
        {activeTab === 'telemetry' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <TelemetryGauges
              telemetry={telemetry}
              failureRisk={currentRisk}
              isConnected={isConnected}
            />
            <PowerChart data={chartHistory} />
            <PowerFlowDiagram
              telemetry={telemetry}
              configs={loadConfigs}
              failureRisk={currentRisk}
              isConnected={isConnected}
            />
          </div>
        )}

        {/* 3. LOAD CONFIGURATION PAGE */}
        {activeTab === 'config' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <LoadControlPanel
              loads={currentLoads}
              configs={loadConfigs}
              onToggleLoad={handleToggleLoad}
              onSaveConfigs={handleSaveConfigs}
              isSendingCommand={isSendingCommand}
              isConnected={isConnected}
            />
            <PowerFlowDiagram
              telemetry={telemetry}
              configs={loadConfigs}
              failureRisk={currentRisk}
              isConnected={isConnected}
            />
          </div>
        )}

        {/* 4. SCENARIO SIMULATOR PAGE */}
        {activeTab === 'simulator' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <ScenarioSimulator
              onRunSimulation={handleRunSimulation}
              onApplyToHardware={handleApplySimToHardware}
              isConnected={isConnected}
            />
          </div>
        )}

        {/* 5. AI JUSTIFICATION LOG PAGE */}
        {activeTab === 'ai' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <DecisionLog
              logs={logs}
              weatherForecast={currentWeather}
              confidence={currentConfidence}
              failureRisk={currentRisk}
            />
            <PowerFlowDiagram
              telemetry={telemetry}
              configs={loadConfigs}
              failureRisk={currentRisk}
              isConnected={isConnected}
            />
          </div>
        )}

        {/* Footer */}
        <footer className="pt-6 border-t border-slate-800/80 text-center text-xs text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-2">
          <span>Smart India Hackathon 2026 • Predictive Renewable Energy Microgrid Controller</span>
          <span className="font-mono text-emerald-400">sih.synthrobotics.dev</span>
        </footer>
      </div>

      {/* Settings Modal */}
      <FirebaseSetupModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
}
