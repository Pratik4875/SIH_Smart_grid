import { initializeApp, getApps, getApp } from 'firebase/app';
import type { FirebaseApp } from 'firebase/app';
import { getDatabase, ref, onValue, set, get, off } from 'firebase/database';
import type { Database } from 'firebase/database';
import type { TelemetryData, AIJustificationLog, LoadConfig, CommandMessage, CommandAck } from './types';

export const DEFAULT_FIREBASE_CONFIG = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCDKm6jQR5gvKCpfWH70Bi6NaxOCCNMfHA",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "micro-grid-sih-default-rtdb.firebaseapp.com",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://micro-grid-sih-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "micro-grid-sih-default-rtdb",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "micro-grid-sih-default-rtdb.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1029384756",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1029384756:web:abcd1234efgh"
};

export const DEFAULT_DEVICE_ID = "ESP32-MG-001";

// Cache in localStorage if user edits settings
export function getSavedFirebaseConfig() {
  const saved = localStorage.getItem('sih_custom_firebase_config');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      // fallback
    }
  }
  return DEFAULT_FIREBASE_CONFIG;
}

export function saveFirebaseConfig(config: typeof DEFAULT_FIREBASE_CONFIG) {
  localStorage.setItem('sih_custom_firebase_config', JSON.stringify(config));
  window.location.reload();
}

let app: FirebaseApp;
let rtdb: Database;

try {
  const cfg = getSavedFirebaseConfig();
  app = getApps().length > 0 ? getApp() : initializeApp(cfg);
  rtdb = getDatabase(app);
} catch (e) {
  console.warn('[FIREBASE_INIT_FALLBACK]', e);
  app = initializeApp(DEFAULT_FIREBASE_CONFIG, 'default-app');
  rtdb = getDatabase(app);
}

export { app, rtdb };

// Helper service functions to interact with Firebase RTDB matching ESP32 firmware
export const microgridService = {
  // Listen to live telemetry published every 3 seconds by ESP32
  subscribeTelemetry: (
    deviceId: string = DEFAULT_DEVICE_ID,
    callback: (data: TelemetryData | null) => void
  ) => {
    const telemetryRef = ref(rtdb, `devices/${deviceId}/telemetry`);
    const unsubscribe = onValue(
      telemetryRef,
      (snapshot) => {
        if (snapshot.exists()) {
          callback(snapshot.val() as TelemetryData);
        } else {
          callback(null);
        }
      },
      (error) => {
        console.error('[RTDB_TELEMETRY_SUB_ERROR]', error);
        callback(null);
      }
    );
    return () => off(telemetryRef, 'value', unsubscribe);
  },

  // Send Remote ON/OFF Command to ESP32 stream listener
  sendCommand: async (
    target: 'RLY-001' | 'RLY-002' | 'RLY-003',
    action: 'ON' | 'OFF',
    deviceId: string = DEFAULT_DEVICE_ID
  ): Promise<string> => {
    const commandId = `cmd-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const commandRef = ref(rtdb, `devices/${deviceId}/command`);
    const payload: CommandMessage = {
      commandId,
      target,
      action,
      timestamp: Math.floor(Date.now() / 1000)
    };
    await set(commandRef, payload);
    return commandId;
  },

  // Listen to Command Acknowledgment from ESP32
  subscribeCommandAck: (
    deviceId: string = DEFAULT_DEVICE_ID,
    callback: (ack: CommandAck | null) => void
  ) => {
    const ackRef = ref(rtdb, `devices/${deviceId}/commandAck`);
    const unsubscribe = onValue(ackRef, (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.val() as CommandAck);
      } else {
        callback(null);
      }
    });
    return () => off(ackRef, 'value', unsubscribe);
  },

  // Append AI Decision Log
  logDecision: async (
    log: AIJustificationLog,
    deviceId: string = DEFAULT_DEVICE_ID
  ) => {
    const logRef = ref(rtdb, `devices/${deviceId}/decisionLogs/${log.id}`);
    await set(logRef, log);
  },

  // Listen to historical Decision Logs
  subscribeDecisionLogs: (
    deviceId: string = DEFAULT_DEVICE_ID,
    callback: (logs: AIJustificationLog[]) => void
  ) => {
    const logsRef = ref(rtdb, `devices/${deviceId}/decisionLogs`);
    const unsubscribe = onValue(logsRef, (snapshot) => {
      if (snapshot.exists()) {
        const val = snapshot.val();
        const list: AIJustificationLog[] = Object.values(val);
        list.sort((a, b) => b.timestamp - a.timestamp);
        callback(list.slice(0, 30));
      } else {
        callback([]);
      }
    });
    return () => off(logsRef, 'value', unsubscribe);
  },

  // Save Load Configuration
  saveLoadConfigs: async (
    configs: Record<string, LoadConfig>,
    deviceId: string = DEFAULT_DEVICE_ID
  ) => {
    const configRef = ref(rtdb, `devices/${deviceId}/config/loads`);
    await set(configRef, configs);
  },

  // Get Load Configuration
  getLoadConfigs: async (
    deviceId: string = DEFAULT_DEVICE_ID
  ): Promise<Record<string, LoadConfig> | null> => {
    const configRef = ref(rtdb, `devices/${deviceId}/config/loads`);
    const snapshot = await get(configRef);
    if (snapshot.exists()) {
      return snapshot.val();
    }
    return null;
  }
};
