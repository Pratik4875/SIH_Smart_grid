export interface LoadState {
  id: 'RLY-001' | 'RLY-002' | 'RLY-003';
  gpioPin: number;
  physicalState: 'ON' | 'OFF';
}

export interface TelemetryData {
  timestamp: number;
  deviceId: string;
  firmwareVersion: string;
  battery: {
    voltage: number;
    percentage: number;
  };
  solar: {
    voltage: number;
    estimatedPower: number; // in Watts (max 0.6W panel)
  };
  environment: {
    temperature: number; // DHT11 °C
    humidity: number;    // DHT11 %
  };
  loads: LoadState[];
}

export type PriorityLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type WeatherPredictionType = 'Sunny' | 'Cloudy' | 'Rainy' | 'Storm / Rain';

export interface LoadConfig {
  id: 'RLY-001' | 'RLY-002' | 'RLY-003';
  name: string;
  priority: PriorityLevel;
  nominalWatts: number;
  description: string;
  icon: 'hospital' | 'lightbulb' | 'droplet' | 'zap';
}

export interface AIJustificationLog {
  id: string;
  timestamp: number;
  weatherPrediction: WeatherPredictionType;
  failureRiskPercent: number;
  batteryDrainRateVPerMin: number;
  estimatedTimeToDepletionMins: number;
  actionTaken: 'NO_ACTION' | 'SHED_LOW' | 'SHED_MEDIUM_AND_LOW' | 'EMERGENCY_SHED_ALL_EXCEPT_CRITICAL';
  shedLoads: string[];
  justificationReason: string;
  treeConfidence: number;
  isSimulated?: boolean;
}

export interface CommandMessage {
  commandId: string;
  target: 'RLY-001' | 'RLY-002' | 'RLY-003';
  action: 'ON' | 'OFF';
  timestamp?: number;
}

export interface CommandAck {
  commandId: string;
  status: 'acknowledged' | 'failed';
  physicalState: 'ON' | 'OFF';
  timestamp: number;
}
