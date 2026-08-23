import React, { useState } from 'react';
import { X, Database, Check, RefreshCw } from 'lucide-react';
import { getSavedFirebaseConfig, saveFirebaseConfig, DEFAULT_DEVICE_ID } from '../firebase';

interface FirebaseSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FirebaseSetupModal: React.FC<FirebaseSetupModalProps> = ({ isOpen, onClose }) => {
  const [config, setConfig] = useState(getSavedFirebaseConfig());
  const [deviceId, setDeviceId] = useState(DEFAULT_DEVICE_ID);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveFirebaseConfig(config);
    setSavedSuccess(true);
    setTimeout(() => {
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2.5 mb-4">
          <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Firebase Realtime DB Configuration</h3>
            <p className="text-xs text-slate-400">Configure connection strings for the ESP32 bridge</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-3.5 text-xs">
          <div>
            <label className="text-slate-300 font-semibold block mb-1">Database URL (RTDB)</label>
            <input
              type="text"
              value={config.databaseURL || ''}
              onChange={(e) => setConfig({ ...config, databaseURL: e.target.value })}
              placeholder="https://micro-grid-sih-default-rtdb.asia-southeast1.firebasedatabase.app"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100 font-mono"
              required
            />
          </div>

          <div>
            <label className="text-slate-300 font-semibold block mb-1">Web API Key</label>
            <input
              type="text"
              value={config.apiKey || ''}
              onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
              placeholder="AIzaSyCDKm6jQR5gvKCpfWH70Bi6NaxOCCNMfHA"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100 font-mono"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Project ID</label>
              <input
                type="text"
                value={config.projectId || ''}
                onChange={(e) => setConfig({ ...config, projectId: e.target.value })}
                placeholder="micro-grid-sih-default-rtdb"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100 font-mono"
              />
            </div>
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Device ID Target</label>
              <input
                type="text"
                value={deviceId}
                onChange={(e) => setDeviceId(e.target.value)}
                placeholder="ESP32-MG-001"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100 font-mono"
              />
            </div>
          </div>

          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] text-amber-300/90 leading-relaxed">
            <strong className="text-amber-200">Firebase Rules Note:</strong> Ensure your Realtime Database Rules allow read/write in test mode during hackathon demos:
            <code className="block mt-1 p-1 bg-slate-950 rounded text-[10px] text-emerald-400 font-mono">
              {'{ ".read": true, ".write": true }'}
            </code>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black transition"
            >
              {savedSuccess ? <Check className="w-4 h-4" /> : <RefreshCw className="w-4 h-4" />}
              {savedSuccess ? 'Saved! Reloading...' : 'Save & Reconnect'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
