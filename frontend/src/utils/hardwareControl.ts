import { getDatabase, ref, set, onValue, off } from 'firebase/database';
import { DEFAULT_DEVICE_ID } from '../firebase';
import type { CommandMessage, LoadConfig } from '../types';

class CommandQueue {
  private queue: CommandMessage[] = [];
  private isProcessing = false;

  async enqueue(target: 'RLY-001' | 'RLY-002' | 'RLY-003', action: 'ON' | 'OFF'): Promise<void> {
    const command: CommandMessage = {
      commandId: `cmd_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      target,
      action,
      timestamp: Date.now()
    };
    
    this.queue.push(command);
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  private async processQueue() {
    if (this.queue.length === 0) {
      this.isProcessing = false;
      return;
    }
    
    this.isProcessing = true;
    const command = this.queue.shift()!;
    const db = getDatabase();
    const commandRef = ref(db, `devices/${DEFAULT_DEVICE_ID}/command`);
    const ackRef = ref(db, `devices/${DEFAULT_DEVICE_ID}/commandAck`);

    try {
      // Setup a one-time listener for the Ack
      const ackPromise = new Promise<void>((resolve) => {
        const timeout = setTimeout(() => {
          off(ackRef, 'value', listener);
          console.warn(`[CommandQueue] Ack timeout for ${command.commandId}. Proceeding anyway.`);
          resolve(); // Resolve anyway to unblock the queue
        }, 5000); // 5 second timeout

        const listener = onValue(ackRef, (snapshot) => {
          if (snapshot.exists()) {
            const ack = snapshot.val();
            if (ack.commandId === command.commandId) {
              clearTimeout(timeout);
              off(ackRef, 'value', listener);
              console.log(`[CommandQueue] Acknowledged: ${command.commandId}`);
              resolve();
            }
          }
        });
      });

      // Dispatch the command
      await set(commandRef, command);
      console.log(`[CommandQueue] Dispatched command to ${command.target}: ${command.action}`);
      
      // Wait for ack or timeout
      await ackPromise;

      // Small 200ms debounce before next command to ensure ESP32 stream reset
      await new Promise(r => setTimeout(r, 200));

    } catch (error) {
      console.error("[CommandQueue] Failed to process command:", error);
    } finally {
      // Process next command in queue
      this.processQueue();
    }
  }
}

const globalCommandQueue = new CommandQueue();

export async function setLoadState(target: 'RLY-001' | 'RLY-002' | 'RLY-003', action: 'ON' | 'OFF'): Promise<void> {
  return globalCommandQueue.enqueue(target, action);
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
