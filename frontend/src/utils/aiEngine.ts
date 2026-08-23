import { defaultForest } from './randomForest';
import type { WeatherClass } from './randomForest';
import type { TelemetryData, LoadConfig, AIJustificationLog } from '../types';

export interface OptimizationResult {
  weather: WeatherClass;
  confidence: number;
  votes: { Sunny: number; Cloudy: number; Rainy: number };
  treePaths: string[][];
  batteryDrainRateVPerMin: number;
  timeToDepletionMins: number;
  failureRiskPercent: number;
  commandsToDispatch: {
    target: 'RLY-001' | 'RLY-002' | 'RLY-003';
    action: 'ON' | 'OFF';
    reason: string;
  }[];
  justificationLog: AIJustificationLog;
  featureImportances: { temperature: number; humidity: number };
}

export const defaultLoadConfigs: Record<string, LoadConfig> = {
  'RLY-001': {
    id: 'RLY-001',
    name: 'Hospital ICU / Ventilator',
    priority: 'CRITICAL',
    nominalWatts: 0.25,
    description: 'MOSFET on GPIO 26 (Active LOW) - Uninterruptible Critical Medical Load',
    icon: 'hospital'
  },
  'RLY-002': {
    id: 'RLY-002',
    name: 'Emergency Streetlights',
    priority: 'MEDIUM',
    nominalWatts: 0.15,
    description: 'Relay 1 on GPIO 25 (Active HIGH) - Municipal Transit Lighting',
    icon: 'lightbulb'
  },
  'RLY-003': {
    id: 'RLY-003',
    name: 'Agricultural Water Pump',
    priority: 'LOW',
    nominalWatts: 0.20,
    description: 'Relay 2 on GPIO 27 (Active HIGH) - Non-critical Farm Irrigation',
    icon: 'droplet'
  }
};

export function evaluateMicrogrid(
  telemetry: TelemetryData,
  loadConfigs: Record<string, LoadConfig> = defaultLoadConfigs,
  historicalBatteryVoltages: { timestamp: number; voltage: number }[] = []
): OptimizationResult {
  const { battery, solar, environment, loads } = telemetry;

  // 1. Run Random Forest Classifier on DHT11 Sensor Data
  const rfResult = defaultForest.predictDetailed([environment.temperature, environment.humidity]);
  const weather = rfResult.prediction;
  const confidence = rfResult.confidence;

  // 2. Calculate Battery Drain Rate (dV/dt)
  let drainRateVPerMin = 0.006; // Baseline nominal rate
  if (historicalBatteryVoltages.length >= 2) {
    const oldest = historicalBatteryVoltages[0];
    const newest = historicalBatteryVoltages[historicalBatteryVoltages.length - 1];
    const dtMins = Math.max((newest.timestamp - oldest.timestamp) / 60, 0.05);
    const dV = oldest.voltage - newest.voltage;
    if (dV > 0) {
      drainRateVPerMin = Math.max(dV / dtMins, 0.001);
    }
  }

  // 3. Compute Estimated Time to Depletion (Cell cutoff 3.2V)
  const usableHeadroom = Math.max(battery.voltage - 3.2, 0);
  const timeToDepletionMins = drainRateVPerMin > 0 ? Math.round(usableHeadroom / drainRateVPerMin) : 999;

  // 4. Calculate Failure Risk Score (0 to 100%)
  let riskScore = 0;

  // Factor A: Battery Voltage (3.2V to 4.2V)
  if (battery.voltage <= 3.35) riskScore += 55;
  else if (battery.voltage <= 3.6) riskScore += 35;
  else if (battery.voltage <= 3.8) riskScore += 15;

  // Factor B: Solar Generation Inflow (0.6W peak PV)
  if (solar.voltage < 1.0) riskScore += 30; // Zero solar / nighttime
  else if (solar.voltage < 2.5) riskScore += 15; // Heavy cloud cover / shading

  // Factor C: Weather Risk multiplier from Random Forest
  if (weather === 'Rainy') riskScore += 20;
  else if (weather === 'Cloudy') riskScore += 10;

  riskScore = Math.min(Math.max(riskScore, 0), 100);

  // 5. Load-Shedding Matrix based on Actuator Priorities
  const commandsToDispatch: {
    target: 'RLY-001' | 'RLY-002' | 'RLY-003';
    action: 'ON' | 'OFF';
    reason: string;
  }[] = [];
  const shedLoads: string[] = [];
  let actionTaken: AIJustificationLog['actionTaken'] = 'NO_ACTION';
  let justificationReason = `Microgrid operating stably. Battery is at ${battery.voltage.toFixed(2)}V (${battery.percentage}%), Solar PV supplying ${solar.voltage.toFixed(2)}V (${solar.estimatedPower.toFixed(2)}W). AI Random Forest predicts ${weather} weather (${(confidence * 100).toFixed(0)}% confidence). All circuits safely energized.`;

  const activeLoads = loads.filter((l) => l.physicalState === 'ON');

  if (riskScore >= 70 || battery.voltage <= 3.4) {
    // Critical Deficit: Shed LOW & MEDIUM priority loads
    actionTaken = 'SHED_MEDIUM_AND_LOW';
    for (const load of activeLoads) {
      const cfg = loadConfigs[load.id] || defaultLoadConfigs[load.id];
      if (cfg.priority === 'LOW' || cfg.priority === 'MEDIUM') {
        commandsToDispatch.push({
          target: load.id,
          action: 'OFF',
          reason: `CRITICAL GRID DEFICIT (${riskScore}% failure risk). Autonomous load-shed of ${cfg.priority} load "${cfg.name}".`
        });
        shedLoads.push(`${cfg.name} (${load.id})`);
      }
    }
    justificationReason = `CRITICAL ALERT: Microgrid failure risk surged to ${riskScore}%. Battery at ${battery.voltage.toFixed(2)}V with ~${timeToDepletionMins} mins estimated before cell exhaustion. Random Forest confirmed ${weather} condition (${(confidence * 100).toFixed(0)}% tree vote). Executing autonomous shedding of non-essential and medium-priority loads to preserve Hospital ICU Ventilator (CRITICAL).`;
  } else if (riskScore >= 40 || battery.voltage <= 3.65) {
    // Moderate Deficit: Shed LOW priority loads
    actionTaken = 'SHED_LOW';
    for (const load of activeLoads) {
      const cfg = loadConfigs[load.id] || defaultLoadConfigs[load.id];
      if (cfg.priority === 'LOW') {
        commandsToDispatch.push({
          target: load.id,
          action: 'OFF',
          reason: `GRID STRAIN DETECTED (${riskScore}% risk). Shedding LOW priority load "${cfg.name}".`
        });
        shedLoads.push(`${cfg.name} (${load.id})`);
      }
    }
    justificationReason = `WARNING: Microgrid strain detected (Risk: ${riskScore}%). Solar voltage reduced to ${solar.voltage.toFixed(2)}V. Battery voltage at ${battery.voltage.toFixed(2)}V. Shedding lowest-priority circuit ("${shedLoads.join(', ') || 'Agricultural Water Pump'}") to prevent brownout.`;
  }

  const justificationLog: AIJustificationLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: Math.floor(Date.now() / 1000),
    weatherPrediction: weather,
    failureRiskPercent: riskScore,
    batteryDrainRateVPerMin: Number(drainRateVPerMin.toFixed(4)),
    estimatedTimeToDepletionMins: timeToDepletionMins,
    actionTaken,
    shedLoads,
    justificationReason,
    treeConfidence: confidence,
  };

  return {
    weather,
    confidence,
    votes: rfResult.votes,
    treePaths: rfResult.paths,
    batteryDrainRateVPerMin: drainRateVPerMin,
    timeToDepletionMins,
    failureRiskPercent: riskScore,
    commandsToDispatch,
    justificationLog,
    featureImportances: defaultForest.featureImportances,
  };
}
