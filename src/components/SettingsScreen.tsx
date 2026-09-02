import React, { useState } from 'react';
import { UserSettings, Category } from '../types';
import { exportLedgerJson, exportLedgerCsv, importLedgerJson, clearEntireStore } from '../db/store';
import { useAuth } from '../context/AuthContext';

interface SettingsScreenProps {
  settings: UserSettings;
  categories: Category[];
  isLightMode: boolean;
  onToggleTheme: () => void;
  onUpdateSettings: (settings: Partial<UserSettings>) => void;
  onOpenCategoryEditor: (category?: Category) => void;
  onDataImported: () => void;
  onShowToast: (msg: string) => void;
  onSeedDay?: () => void;
  onFirstRun?: () => void;
  onOpenAuth: () => void;
  onOpenOnboarding: () => void;
}

const TIME_ZONES = [
  { id: 'America/New_York', label: 'New York (ET)' },
  { id: 'America/Los_Angeles', label: 'Los Angeles (PT)' },
  { id: 'Europe/London', label: 'London (GMT/BST)' },
  { id: 'Europe/Berlin', label: 'Berlin (CET/CEST)' },
  { id: 'Asia/Tokyo', label: 'Tokyo (JST)' },
];

const FOCUS_LENGTHS = [15, 25, 45, 90];

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  settings,
  categories,
  isLightMode,
  onToggleTheme,
  onUpdateSettings,
  onOpenCategoryEditor,
  onDataImported,
  onShowToast,
  onSeedDay,
  onFirstRun,
  onOpenAuth,
  onOpenOnboarding,
}) => {
  const { user, profile, signOut } = useAuth();
  const [weekStartsMonday, setWeekStartsMonday] = useState(true);

  const handleExportJson = () => {
    exportLedgerJson();
    onShowToast('Exported backup as JSON');
  };

  const handleExportCsv = () => {
    exportLedgerCsv();
    onShowToast('Exported ledger as CSV');
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      if (content) {
        const ok = importLedgerJson(content);
        if (ok) {
          onDataImported();
          onShowToast('Restored backup successfully');
        } else {
          onShowToast('Failed to import backup');
        }
      }
    };
    reader.readAsText(file);
  };

  const handleResetData = () => {
    if (window.confirm('Reset all ledger data and restore defaults? This cannot be undone.')) {
      clearEntireStore();
      onDataImported();
      onShowToast('Ledger reset to defaults');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      onShowToast('Signed out of sanctuary');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex flex-col gap-5 pb-8 tf-rise">
      {/* Header */}
      <div>
        <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--tf-ink)] opacity-40">
          Preferences
        </span>
        <h2 className="text-xl font-bold text-[var(--tf-ink)] tracking-tight mt-0.5">
          Settings & Account
        </h2>
      </div>

      {/* Account & Profile Card */}
      <div
        className="flex flex-col p-4 rounded-2xl gap-3.5 relative overflow-hidden"
        style={{
          background: 'radial-gradient(120% 120% at 50% 10%, #102636 0%, #0c1c28 45%, #08131d 100%)',
          border: '1px solid rgba(56, 189, 248, 0.2)',
          boxShadow: '0 12px 30px -10px rgba(0, 0, 0, 0.5)',
          color: '#FFFFFF',
        }}
      >
        <div className="flex items-center justify-between">
          <span className="text-[10.5px] font-mono tracking-wider uppercase text-[#38BDF8]">
            {user ? 'SANCTUARY PROFILE' : 'GUEST SESSION'}
          </span>
          {user && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#2DD4BF]/20 text-[#2DD4BF] border border-[#2DD4BF]/30">
              Cloud Synced ✓
            </span>
          )}
        </div>

        {user ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[#38BDF8]/20 border border-[#38BDF8]/40 flex items-center justify-center text-lg font-bold text-[#38BDF8]">
                {profile?.displayName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'P'}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-bold text-white truncate">
                  {profile?.displayName || 'Practitioner'}
                </span>
                <span className="text-xs font-mono text-white/50 truncate">{user.email}</span>
                {profile?.primaryFocus && (
                  <span className="text-[11px] text-[#2DD4BF] mt-0.5">
                    Focus: {profile.primaryFocus}
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-1">
              <button
                onClick={onOpenOnboarding}
                className="py-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-semibold text-white cursor-pointer text-center"
              >
                Retake Questionnaire
              </button>
              <button
                onClick={handleSignOut}
                className="py-2 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-xs font-semibold text-rose-300 cursor-pointer text-center"
              >
                Sign Out
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            <p className="text-xs text-white/70 leading-relaxed">
              Create your profile or sign in to synchronize your 24-hour balance ledger and daily reflections across devices with private data isolation.
            </p>
            <button
              onClick={onOpenAuth}
              className="w-full py-3 rounded-xl font-bold text-xs bg-[#38BDF8] text-black shadow-lg hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              Sign In / Create Profile ✦
            </button>
          </div>
        )}
      </div>

      {/* Toggles Card */}
      <div
        className="flex flex-col p-4 rounded-2xl gap-3.5"
        style={{
          background: 'var(--tf-card-solid)',
          border: '1px solid rgba(var(--tf-surf-rgb), 0.08)',
        }}
      >
        <h3 className="text-xs font-semibold uppercase tracking-wider opacity-70">
          Appearance & Sensory
        </h3>

        {/* Light Mode Switch */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs font-medium text-[var(--tf-ink)]">Light Mode</span>
            <span className="text-[10.5px] opacity-50">High-contrast daytime sanctuary</span>
          </div>
          <button
            onClick={onToggleTheme}
            className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-300 relative cursor-pointer ${
              isLightMode ? 'bg-[var(--tf-accent-ink)]' : 'bg-white/20'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform duration-300 shadow-md ${
                isLightMode ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Chimes Switch */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs font-medium text-[var(--tf-ink)]">Chimes & Audio</span>
            <span className="text-[10.5px] opacity-50">Calm acoustic chimes on timer actions</span>
          </div>
          <button
            onClick={() => onUpdateSettings({ soundEnabled: !settings.soundEnabled })}
            className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-300 relative cursor-pointer ${
              settings.soundEnabled ? 'bg-[var(--tf-accent-ink)]' : 'bg-white/20'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform duration-300 shadow-md ${
                settings.soundEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Haptics Switch */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs font-medium text-[var(--tf-ink)]">Haptic Feedback</span>
            <span className="text-[10.5px] opacity-50">Tactile taps on device</span>
          </div>
          <button
            onClick={() => onUpdateSettings({ hapticsEnabled: !settings.hapticsEnabled })}
            className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-300 relative cursor-pointer ${
              settings.hapticsEnabled ? 'bg-[var(--tf-accent-ink)]' : 'bg-white/20'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform duration-300 shadow-md ${
                settings.hapticsEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Week starts Monday */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs font-medium text-[var(--tf-ink)]">Week starts Monday</span>
            <span className="text-[10.5px] opacity-50">Calendar alignment for weekly flow</span>
          </div>
          <button
            onClick={() => setWeekStartsMonday(!weekStartsMonday)}
            className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-300 relative cursor-pointer ${
              weekStartsMonday ? 'bg-[var(--tf-accent-ink)]' : 'bg-white/20'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform duration-300 shadow-md ${
                weekStartsMonday ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Time & Clock Settings */}
      <div
        className="flex flex-col p-4 rounded-2xl gap-3.5"
        style={{
          background: 'var(--tf-card-solid)',
          border: '1px solid rgba(var(--tf-surf-rgb), 0.08)',
        }}
      >
        <h3 className="text-xs font-semibold uppercase tracking-wider opacity-70">
          Time Format & Focus
        </h3>

        {/* 12h vs 24h format */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-[var(--tf-ink)]">Clock Display</span>
          <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
            <button
              onClick={() => onUpdateSettings({ hourFormat: 12 })}
              className={`px-3 py-1 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                settings.hourFormat === 12
                  ? 'bg-[var(--tf-accent-ink)] text-black font-bold'
                  : 'opacity-60 text-[var(--tf-ink)]'
              }`}
            >
              12h
            </button>
            <button
              onClick={() => onUpdateSettings({ hourFormat: 24 })}
              className={`px-3 py-1 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                settings.hourFormat === 24
                  ? 'bg-[var(--tf-accent-ink)] text-black font-bold'
                  : 'opacity-60 text-[var(--tf-ink)]'
              }`}
            >
              24h
            </button>
          </div>
        </div>

        {/* Time Zone */}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-[var(--tf-ink)]">Time Zone</span>
          <select
            value={settings.timeZone || 'America/New_York'}
            onChange={(e) => onUpdateSettings({ timeZone: e.target.value })}
            className="w-full px-3 py-2 rounded-xl text-xs bg-white/5 border border-white/10 text-[var(--tf-ink)] focus:border-[var(--tf-accent-ink)] cursor-pointer"
          >
            {TIME_ZONES.map((tz) => (
              <option key={tz.id} value={tz.id} className="bg-neutral-900 text-white">
                {tz.label}
              </option>
            ))}
          </select>
        </div>

        {/* Default Focus Length */}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-[var(--tf-ink)]">Default Focus Length</span>
          <div className="grid grid-cols-4 gap-1.5">
            {FOCUS_LENGTHS.map((mins) => (
              <button
                key={mins}
                onClick={() => onUpdateSettings({ defaultFocusMinutes: mins })}
                className={`py-1.5 rounded-xl text-xs font-mono font-medium transition-all cursor-pointer ${
                  settings.defaultFocusMinutes === mins
                    ? 'bg-[var(--tf-accent-ink)] text-black font-bold shadow-sm'
                    : 'bg-white/5 border border-white/10 opacity-70 hover:opacity-100'
                }`}
              >
                {mins}m
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Category Management */}
      <div
        className="flex flex-col p-4 rounded-2xl gap-3"
        style={{
          background: 'var(--tf-card-solid)',
          border: '1px solid rgba(var(--tf-surf-rgb), 0.08)',
        }}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider opacity-70">
            Life Categories ({categories.length})
          </h3>
          <button
            onClick={() => onOpenCategoryEditor()}
            className="text-xs font-medium text-[var(--tf-accent-ink)] hover:underline cursor-pointer"
          >
            + Add New
          </button>
        </div>

        <div className="flex flex-col gap-1.5">
          {categories.map((cat) => (
            <div
              key={cat.id}
              onClick={() => onOpenCategoryEditor(cat)}
              className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm">{cat.emoji}</span>
                <span className="text-xs font-medium text-[var(--tf-ink)]">{cat.name}</span>
              </div>
              <span className="text-[10px] uppercase font-mono opacity-40 px-1.5 py-0.5 rounded bg-white/5">
                {cat.kind}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Demo & Preset Data Seeding */}
      {(onSeedDay || onFirstRun) && (
        <div
          className="flex flex-col p-4 rounded-2xl gap-2.5"
          style={{
            background: 'var(--tf-card-solid)',
            border: '1px solid rgba(var(--tf-surf-rgb), 0.08)',
          }}
        >
          <h3 className="text-xs font-semibold uppercase tracking-wider opacity-70">
            Demo & Exploration
          </h3>
          <p className="text-[11px] opacity-60">
            Easily load a rich, curated schedule or reset back to an empty initial state.
          </p>
          <div className="grid grid-cols-2 gap-2 mt-1">
            {onSeedDay && (
              <button
                onClick={onSeedDay}
                className="py-2 px-3 rounded-xl transition-all font-semibold text-xs cursor-pointer text-center select-none"
                style={{
                  background: 'rgba(56,189,248,0.16)',
                  border: '1px solid rgba(56,189,248,0.35)',
                  color: 'var(--tf-accent-ink)',
                }}
              >
                Load Seeded Day
              </button>
            )}
            {onFirstRun && (
              <button
                onClick={onFirstRun}
                className="py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-[var(--tf-ink)] cursor-pointer text-center select-none"
              >
                Clear to First Run
              </button>
            )}
          </div>
        </div>
      )}

      {/* Data Sovereignty */}
      <div
        className="flex flex-col p-4 rounded-2xl gap-2.5"
        style={{
          background: 'var(--tf-card-solid)',
          border: '1px solid rgba(var(--tf-surf-rgb), 0.08)',
        }}
      >
        <h3 className="text-xs font-semibold uppercase tracking-wider opacity-70">
          Data Sovereignty
        </h3>
        <p className="text-[11px] opacity-60">
          All data is stored purely in your secure private sanctuary with offline fallback.
        </p>

        <div className="grid grid-cols-2 gap-2 mt-1">
          <button
            onClick={handleExportJson}
            className="py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-[var(--tf-ink)] cursor-pointer text-center"
          >
            Back up as JSON
          </button>
          <button
            onClick={handleExportCsv}
            className="py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-[var(--tf-ink)] cursor-pointer text-center"
          >
            Export CSV
          </button>
        </div>

        <div className="flex items-center gap-2 mt-1">
          <label className="flex-1 py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-[var(--tf-ink)] cursor-pointer text-center">
            Restore from file
            <input type="file" accept=".json" onChange={handleFileInput} className="hidden" />
          </label>
          <button
            onClick={handleResetData}
            className="flex-1 py-2 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-xs font-medium text-rose-300 cursor-pointer text-center"
          >
            Reset all data
          </button>
        </div>
      </div>
    </div>
  );
};
