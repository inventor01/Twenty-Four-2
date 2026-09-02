import React, { useState } from 'react';
import { UserSettings } from '../types';
import { Download, Upload, Volume2, VolumeX, Trash2, Check } from 'lucide-react';
import { soundEngine } from '../lib/sound';
import { SoundChimeIcon, ShieldCapIcon, TargetRhythmIcon } from './OrganicIcons';

interface SettingsViewProps {
  settings: UserSettings;
  onUpdateSettings: (settings: UserSettings) => void;
  onExportJSON: () => void;
  onExportCSV: () => void;
  onImportData: (data: string) => void;
  onResetAllData: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  onExportJSON,
  onExportCSV,
  onImportData,
  onResetAllData,
}) => {
  const [importText, setImportText] = useState('');
  const [showImport, setShowImport] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleToggleSound = (enabled: boolean) => {
    soundEngine.setEnabled(enabled);
    onUpdateSettings({ ...settings, soundEnabled: enabled });
    if (enabled) {
      soundEngine.playChime('chime');
    }
    soundEngine.vibrate('light');
  };

  const handleToggleHaptics = (enabled: boolean) => {
    onUpdateSettings({ ...settings, hapticsEnabled: enabled });
    soundEngine.vibrate('success');
  };

  const handleTestChime = () => {
    soundEngine.playChime('interval');
    soundEngine.vibrate('interval');
  };

  const handleImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!importText.trim()) return;
    onImportData(importText.trim());
    setShowImport(false);
    setImportText('');
    soundEngine.playChime('finish');
    soundEngine.vibrate('success');
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto animate-fadeIn">
      <div>
        <h2 className="text-xl font-bold text-white dark:text-white light:text-slate-900 font-sans tracking-tight">
          App Settings & Data Sovereignty
        </h2>
        <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600">
          Your balance ledger is strictly private and stored client-side in your browser
        </p>
      </div>

      {/* Audio & Haptic Sensory Preferences */}
      <div className="glass-card rounded-3xl p-6 sm:p-7 space-y-4">
        <h3 className="text-[11px] font-bold tracking-widest text-slate-400 dark:text-slate-400 light:text-slate-500 uppercase flex items-center gap-1.5">
          <SoundChimeIcon size={14} className="text-sky-400" />
          <span>SENSORY HARMONY & AUDIO CUES</span>
        </h3>

        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between p-3 rounded-2xl glass-card-subtle">
            <div>
              <div className="text-xs font-semibold text-white dark:text-white light:text-slate-900">
                Meditative Chimes & Sound FX
              </div>
              <div className="text-[11px] text-slate-400">
                Gentle Tibetan bowl and harmonic crystal tones on start, pause, interval, and evening closeout
              </div>
            </div>
            <button
              onClick={() => handleToggleSound(!settings.soundEnabled)}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                settings.soundEnabled
                  ? 'bg-sky-500 text-slate-950 font-bold border-sky-400'
                  : 'glass-pill text-slate-500'
              }`}
            >
              {settings.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex items-center justify-between p-3 rounded-2xl glass-card-subtle">
            <div>
              <div className="text-xs font-semibold text-white dark:text-white light:text-slate-900">
                Test Audio Chime
              </div>
              <div className="text-[11px] text-slate-400">
                Hear sample focus interval sound wave
              </div>
            </div>
            <button
              onClick={handleTestChime}
              className="px-3 py-1.5 rounded-xl glass-pill text-xs font-semibold text-sky-400 hover:bg-white/10 cursor-pointer"
            >
              Play Chime
            </button>
          </div>

          <div className="flex items-center justify-between p-3 rounded-2xl glass-card-subtle">
            <div>
              <div className="text-xs font-semibold text-white dark:text-white light:text-slate-900">
                Haptic Vibration Feedback
              </div>
              <div className="text-[11px] text-slate-400">
                Subtle tactile pulses on compatible mobile devices and trackpads
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.hapticsEnabled}
              onChange={(e) => handleToggleHaptics(e.target.checked)}
              className="w-4 h-4 accent-sky-500 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Focus Timer Presets */}
      <div className="glass-card rounded-3xl p-6 sm:p-7 space-y-4">
        <h3 className="text-[11px] font-bold tracking-widest text-slate-400 dark:text-slate-400 light:text-slate-500 uppercase flex items-center gap-1.5">
          <TargetRhythmIcon size={14} className="text-sky-400" />
          <span>DEFAULT FOCUS INTERVAL PRESET</span>
        </h3>

        <div className="grid grid-cols-3 gap-2.5 pt-1">
          {[25, 50, 90].map((mins) => (
            <button
              key={mins}
              onClick={() => {
                onUpdateSettings({ ...settings, defaultFocusMinutes: mins });
                soundEngine.vibrate('light');
              }}
              className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                settings.defaultFocusMinutes === mins
                  ? 'bg-sky-500 text-slate-950 font-bold border-sky-400 shadow-xs'
                  : 'glass-card-subtle text-slate-300 hover:text-white'
              }`}
            >
              <div className="text-base font-bold font-mono">{mins}m</div>
              <div className="text-[10px] opacity-80 uppercase tracking-wider">
                {mins === 25 ? 'Pomodoro' : mins === 50 ? 'Deep Flow' : 'Ultradian'}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Export & Import Data */}
      <div className="glass-card rounded-3xl p-6 sm:p-7 space-y-4">
        <h3 className="text-[11px] font-bold tracking-widest text-slate-400 dark:text-slate-400 light:text-slate-500 uppercase flex items-center gap-1.5">
          <Download className="w-3.5 h-3.5 text-sky-400" />
          <span>BACKUP & DATA SOVEREIGNTY</span>
        </h3>

        <div className="flex flex-wrap items-center gap-2.5 pt-1">
          <button
            onClick={() => {
              onExportJSON();
              soundEngine.vibrate('light');
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl glass-pill text-xs font-semibold text-white hover:bg-white/15 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-sky-400" />
            <span>Export JSON Backup</span>
          </button>

          <button
            onClick={() => {
              onExportCSV();
              soundEngine.vibrate('light');
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl glass-pill text-xs font-semibold text-white hover:bg-white/15 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-sky-400" />
            <span>Export CSV Spreadsheet</span>
          </button>

          <button
            onClick={() => {
              setShowImport(!showImport);
              soundEngine.vibrate('light');
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl glass-pill text-xs font-semibold text-white hover:bg-white/15 transition-colors cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-sky-400" />
            <span>Restore JSON</span>
          </button>
        </div>

        {showImport && (
          <form onSubmit={handleImportSubmit} className="space-y-3 pt-3 border-t border-white/10 animate-fadeIn">
            <textarea
              rows={4}
              required
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="Paste raw Twentyfour JSON backup payload here..."
              className="w-full text-xs p-3 glass-input rounded-2xl placeholder:text-slate-500 focus:outline-none focus:border-sky-400 font-mono"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowImport(false)}
                className="px-3 py-1.5 rounded-xl glass-pill text-xs font-semibold text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3.5 py-1.5 rounded-xl bg-sky-500 text-slate-950 text-xs font-bold hover:bg-sky-400 cursor-pointer"
              >
                Import & Restore
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Danger Zone: Reset Data */}
      <div className="glass-card rounded-3xl p-6 sm:p-7 space-y-4 border border-rose-500/20">
        <h3 className="text-[11px] font-bold tracking-widest text-rose-400 uppercase flex items-center gap-1.5">
          <Trash2 className="w-3.5 h-3.5" />
          <span>RESET ALL APPLICATION DATA</span>
        </h3>
        <p className="text-xs text-slate-400">
          Permanently clear all ledger entries, categories, and reflections to restore factory default balance.
        </p>

        {confirmReset ? (
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => {
                onResetAllData();
                setConfirmReset(false);
                soundEngine.vibrate('interval');
              }}
              className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold cursor-pointer"
            >
              Yes, delete all data permanently
            </button>
            <button
              onClick={() => setConfirmReset(false)}
              className="px-4 py-2 rounded-xl glass-pill text-xs font-semibold text-slate-300 cursor-pointer"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmReset(true)}
            className="px-3.5 py-2 rounded-xl glass-pill text-xs font-semibold text-rose-400 hover:bg-rose-500/20 transition-colors cursor-pointer"
          >
            Reset to Default State
          </button>
        )}
      </div>
    </div>
  );
};
