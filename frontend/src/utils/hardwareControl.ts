import { getDatabase, ref, set } from 'firebase/database';
import { DEFAULT_DEVICE_ID } from '../firebase';
import type { CommandMessage, LoadConfig } from '../types';

export async function setLoadState(target: 'RLY-001' | 'RLY-002' | 'RLY-003', action: 'ON' | 'OFF'): Promise<void> {
  const db = getDatabase();
  const commandRef = ref(db, `devices/${DEFAULT_DEVICE_ID}/command`);
  
  const command: CommandMessage = {
    commandId: `cmd_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    target,
    action,
    timestamp: Date.now()
  };

  try {
    await set(commandRef, command);
    console.log(`Dispatched command to ${target}: ${action}`);
  } catch (error) {
    console.error("Failed to send command to Firebase:", error);
    throw error;
  }
}

export async function updateDeviceConfig(config: Record<string, LoadConfig>): Promise<void> {
  const db = getDatabase();
  const configRef = ref(db, `devices/${DEFAULT_DEVICE_ID}/config/loads`);
  
  try {
    await set(configRef, config);
    console.log(`Updated device config in Firebase`);
  } catch (error) {
    console.error("Failed to update config in Firebase:", error);
    throw error;
  }
}
