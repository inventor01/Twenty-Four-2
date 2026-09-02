import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  initStore,
  subscribeToStore,
  getCategories,
  createCategory,
  saveCategory,
  deleteCategory,
  getAllActivities,
  getTimerState,
  startTimerFor,
  pauseStoredTimer,
  resumeStoredTimer,
  finishStoredTimer,
  discardStoredTimer,
  getEntriesForDate,
  getAllEntries,
  addManualEntry,
  updateEntry,
  getReflections,
  getStoredSettings,
  updateStoredSettings,
  seedSampleLedgerData,
  clearToFirstRun,
} from './db/store';
import {
  Category,
  Activity,
  TimeEntry,
  TimerState,
  DailyReflection,
  UserSettings,
  EntryNote,
  CategoryKind,
} from './types';
import {
  localDateKey,
  DEFAULT_TIME_ZONE,
  fmtTime12,
  fmtTime24,
  formatDateDetails,
  shiftDateKey,
  getMidnightMs,
} from './lib/time';
import { DayOrb } from './components/DayOrb';
import { ChronologicalFlow } from './components/ChronologicalFlow';
import { TwoTapFavorites } from './components/TwoTapFavorites';
import { LedgerSection } from './components/LedgerSection';
import { InsightsScreen } from './components/InsightsScreen';
import { PlantScreen } from './components/PlantScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { FocusOverlay } from './components/FocusOverlay';
import { LogSheet } from './components/LogSheet';
import { CategoryEditorSheet } from './components/CategoryEditorSheet';
import { AddNoteSheet } from './components/AddNoteSheet';
import { DatePickerSheet } from './components/DatePickerSheet';
import { AuthModal } from './components/AuthModal';
import { OnboardingModal } from './components/OnboardingModal';
import { soundEngine } from './lib/sound';
import { AuthProvider, useAuth } from './context/AuthContext';
import { syncFirestoreForUser, persistEntryToCloud } from './lib/cloudSync';

type NavTab = 'today' | 'insights' | 'plant' | 'settings';

function AppContent() {
  const { user, profile, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<NavTab>('today');
  const [themeMode, setThemeMode] = useState<'dark' | 'light'>('dark');

  // Store data states
  const [categories, setCategories] = useState<Category[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [timerState, setTimerState] = useState<TimerState | null>(null);
  const [todayEntries, setTodayEntries] = useState<TimeEntry[]>([]);
  const [allEntries, setAllEntries] = useState<TimeEntry[]>([]);
  const [reflections, setReflections] = useState<DailyReflection[]>([]);
  const [settings, setSettings] = useState<UserSettings>(getStoredSettings());

  const timeZone = settings.timeZone || DEFAULT_TIME_ZONE;
  const todayKey = useMemo(() => localDateKey(Date.now(), timeZone), [timeZone]);
  const [selectedDateKey, setSelectedDateKey] = useState<string>(todayKey);

  // UI / Modal states
  const [isFocusOpen, setIsFocusOpen] = useState(false);
  const [isLogSheetOpen, setIsLogSheetOpen] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [logSheetInitialActivity, setLogSheetInitialActivity] = useState<Activity | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null | undefined>(undefined);
  const [noteTargetEntry, setNoteTargetEntry] = useState<TimeEntry | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Reload data from store
  const reloadData = useCallback(() => {
    setCategories(getCategories());
    setActivities(getAllActivities());
    const timer = getTimerState();
    setTimerState(timer);
    setTodayEntries(getEntriesForDate(selectedDateKey));
    setAllEntries(getAllEntries());
    setReflections(getReflections());
    setSettings(getStoredSettings());
  }, [selectedDateKey]);

  useEffect(() => {
    initStore();
    reloadData();
    const unsub = subscribeToStore(reloadData);
    return unsub;
  }, [reloadData]);

  // Real-time Cloud Sync attachment when user is logged in
  useEffect(() => {
    if (user?.uid) {
      const stopSync = syncFirestoreForUser(user.uid);
      return () => stopSync();
    }
  }, [user?.uid]);

  // Show onboarding if signed in and not yet completed
  useEffect(() => {
    if (user && profile && profile.onboardingComplete === false) {
      setIsOnboardingOpen(true);
    }
  }, [user, profile]);

  // Apply theme class to document
  useEffect(() => {
    document.documentElement.setAttribute('data-tf-theme', themeMode);
    if (themeMode === 'light') {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    }
  }, [themeMode]);

  // Toast helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  // Switch between Seeded Day and First Run demo states
  const handleSeedDay = () => {
    seedSampleLedgerData();
    reloadData();
    showToast('Loaded seeded 24-hour balance ledger');
  };

  const handleFirstRun = () => {
    clearToFirstRun();
    reloadData();
    showToast('Switched to clean first-run day');
  };

  // Timer actions
  const handleStartTimer = (activity: Activity) => {
    startTimerFor(activity.id, 'continuous');
    soundEngine.playChime();
    setIsFocusOpen(true);
    showToast(`Focus session started: ${activity.name}`);
  };

  const handlePauseTimer = () => {
    pauseStoredTimer();
  };

  const handleResumeTimer = () => {
    resumeStoredTimer();
  };

  const handleFinishTimer = (notes: EntryNote[]) => {
    const entries = finishStoredTimer(notes);
    setIsFocusOpen(false);
    reloadData();
    if (user && entries.length > 0) {
      entries.forEach((e) => persistEntryToCloud(user.uid, e));
    }
    showToast('Focus session logged to ledger and watered plant!');
  };

  const handleDiscardTimer = () => {
    discardStoredTimer();
    setIsFocusOpen(false);
    showToast('Discarded focus session');
  };

  // Manual block logging with timing support (planned or past exact times)
  const handleSaveManualEntry = (
    activity: Activity,
    durationMins: number,
    note?: string,
    customStartMs?: number,
    customEndMs?: number
  ) => {
    let startMs = 0;
    let endMs = 0;

    if (customStartMs && customEndMs) {
      startMs = customStartMs;
      endMs = customEndMs;
    } else if (selectedDateKey === todayKey) {
      const now = Date.now();
      startMs = now - durationMins * 60_000;
      endMs = now;
    } else {
      const midnight = getMidnightMs(selectedDateKey, timeZone);
      startMs = midnight + 14 * 3600_000;
      endMs = startMs + durationMins * 60_000;
    }

    const created = addManualEntry(activity.id, startMs, endMs, note);
    if (user && created) {
      persistEntryToCloud(user.uid, created);
    }

    soundEngine.playChime('finish');
    reloadData();
    const entryDate = localDateKey(startMs, timeZone);
    const dateDetail = formatDateDetails(entryDate, timeZone);
    showToast(`Logged ${durationMins}m for ${activity.name} on ${dateDetail.shortDate}`);
  };

  // Add note to past entry
  const handleSaveNoteToEntry = (entryId: string, text: string) => {
    const entry = allEntries.find((e) => e.id === entryId);
    if (!entry) return;
    const newNotes = [
      ...(entry.notes || []),
      { id: `note-${Date.now()}`, text, createdAtMs: Date.now() },
    ];
    const updated = { ...entry, notes: newNotes };
    updateEntry(updated);
    if (user) {
      persistEntryToCloud(user.uid, updated);
    }
    reloadData();
    showToast('Saved note to entry');
  };

  // Category editor actions
  const handleSaveCategory = (catData: { name: string; emoji: string; color: string; kind: CategoryKind }) => {
    if (editingCategory) {
      saveCategory({
        ...editingCategory,
        ...catData,
      });
      showToast(`Updated category: ${catData.name}`);
    } else {
      createCategory({
        name: catData.name,
        emoji: catData.emoji,
        color: catData.color,
        kind: catData.kind,
        isCustom: true,
      });
      showToast(`Created category: ${catData.name}`);
    }
    setEditingCategory(undefined);
    reloadData();
  };

  const handleDeleteCategory = (catId: string) => {
    deleteCategory(catId, { mode: 'delete-entries' });
    setEditingCategory(undefined);
    reloadData();
    showToast('Category deleted');
  };

  // Format selected date details for dashboard header
  const selectedDateDetails = useMemo(() => {
    return formatDateDetails(selectedDateKey, timeZone);
  }, [selectedDateKey, timeZone]);

  const activeTimerActivity = useMemo(() => {
    if (!timerState) return null;
    return activities.find((a) => a.id === timerState.activityId);
  }, [timerState, activities]);

  const activeTimerCategory = useMemo(() => {
    if (!activeTimerActivity) return null;
    return categories.find((c) => c.id === activeTimerActivity.categoryId);
  }, [activeTimerActivity, categories]);

  // Live timer tick for homepage running card
  const [timerTick, setTimerTick] = useState(0);

  useEffect(() => {
    if (!timerState || timerState.pausedAtMs !== null) return;
    const iv = setInterval(() => {
      setTimerTick((t) => t + 1);
    }, 1000);
    return () => clearInterval(iv);
  }, [timerState]);

  const currentTimerDurationSec = useMemo(() => {
    if (!timerState) return 0;
    const now = Date.now();
    const pauseDur = timerState.accumulatedPauseMs + (timerState.pausedAtMs ? now - timerState.pausedAtMs : 0);
    return Math.max(0, Math.floor((now - timerState.startedAtMs - pauseDur) / 1000));
  }, [timerState, timerTick]);

  const formatTimerDuration = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) {
      return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="w-full min-h-screen bg-[var(--tf-bg)] text-[var(--tf-ink)] flex flex-col items-center justify-start transition-colors duration-300 antialiased font-sans">
      {/* Mobile Shell Wrapper */}
      <div className="w-full max-w-md min-h-screen relative flex flex-col justify-between pb-24 shadow-2xl bg-[var(--tf-bg)] overflow-x-hidden">
        {/* Top Floating App Bar */}
        <div className="sticky top-0 z-40 relative flex items-center justify-center px-5 pt-4 pb-3 bg-[var(--tf-bg)]/85 backdrop-blur-xl border-b border-white/5 select-none min-h-[58px]">
          {/* Brand Wordmark (Centered) */}
          <div className="flex items-center gap-1 cursor-pointer" onClick={() => setActiveTab('today')}>
            <span
              style={{
                font: '700 20px/1 Archivo, sans-serif',
                letterSpacing: '-0.04em',
                color: 'var(--tf-ink)',
              }}
            >
              twenty<span style={{ color: 'var(--tf-accent-ink)' }}>four</span>
            </span>
          </div>

          {/* User Account / Sign In Pill (Pinned to Right) */}
          <div className="absolute right-4 flex items-center gap-2">
            <button
              onClick={() => {
                if (user) {
                  setActiveTab('settings');
                } else {
                  setIsAuthModalOpen(true);
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all cursor-pointer select-none"
            >
              <div
                className={`w-2 h-2 rounded-full ${user ? 'bg-[#2DD4BF] animate-pulse' : 'bg-white/40'}`}
              />
              <span className="text-xs font-medium text-[var(--tf-ink)] truncate max-w-[110px]">
                {user ? profile?.displayName || 'My Profile' : 'Sign In'}
              </span>
            </button>
          </div>
        </div>

        {/* Running Timer Bar (Sticky if active) */}
        {timerState && activeTab !== 'today' && (
          <div
            onClick={() => setIsFocusOpen(true)}
            className="sticky top-[58px] z-30 mx-4 my-2 p-3 rounded-2xl bg-[#38BDF8]/15 border border-[#38BDF8]/30 flex items-center justify-between shadow-lg cursor-pointer backdrop-blur-md"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-[#38BDF8] animate-ping" />
              <span className="text-xs font-semibold truncate text-[var(--tf-ink)]">
                Focus: {activeTimerActivity?.name || 'Active Session'}
              </span>
            </div>
            <span className="font-mono text-xs font-bold text-[#38BDF8]">
              {formatTimerDuration(currentTimerDurationSec)}
            </span>
          </div>
        )}

        {/* Main View Router */}
        <div className="flex-1 px-4 pt-2">
          {activeTab === 'today' && (
            <div className="flex flex-col gap-5">
              {/* Date Selector Header Bar */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedDateKey((k) => shiftDateKey(k, -1))}
                    className="w-7 h-7 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-xs cursor-pointer opacity-70 hover:opacity-100"
                    title="Previous Day"
                  >
                    ◀
                  </button>
                  <div
                    onClick={() => setIsDatePickerOpen(true)}
                    className="flex flex-col cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    <span className="text-xs font-bold text-[var(--tf-ink)] tracking-tight">
                      {selectedDateDetails.relativeLabel}
                    </span>
                    <span className="text-[10px] font-mono opacity-50">
                      {selectedDateDetails.shortDate}
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedDateKey((k) => shiftDateKey(k, 1))}
                    className="w-7 h-7 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-xs cursor-pointer opacity-70 hover:opacity-100"
                    title="Next Day"
                  >
                    ▶
                  </button>
                </div>

                {selectedDateKey !== todayKey && (
                  <button
                    onClick={() => setSelectedDateKey(todayKey)}
                    className="text-[10.5px] font-mono font-semibold px-2 py-1 rounded-lg bg-[var(--tf-accent-ink)] text-black cursor-pointer shadow-sm"
                  >
                    Jump to Today
                  </button>
                )}
              </div>

              {/* 24-Hour Solar Balance DayOrb */}
              <DayOrb
                entries={todayEntries}
                runningTimer={timerState}
                timeZone={timeZone}
                hourFormat={settings.hourFormat}
                activeDateKey={selectedDateKey}
                todayDateKey={todayKey}
                onOpenLogSheet={() => {
                  setLogSheetInitialActivity(null);
                  setIsLogSheetOpen(true);
                }}
              />

              {/* Two-Tap Quick Activity Shortcuts */}
              <TwoTapFavorites
                activities={activities}
                categories={categories}
                onSelectActivity={(act) => {
                  setLogSheetInitialActivity(act);
                  setIsLogSheetOpen(true);
                }}
                onStartDirectTimer={handleStartTimer}
              />

              {/* Chronological Day Stream */}
              <ChronologicalFlow
                entries={todayEntries}
                runningTimer={timerState}
                hourFormat={settings.hourFormat}
                timeZone={timeZone}
                onAddNote={(entry) => setNoteTargetEntry(entry)}
              />

              {/* Ledger Summary */}
              <LedgerSection
                entries={todayEntries}
                categories={categories}
                selectedDateKey={selectedDateKey}
              />
            </div>
          )}

          {activeTab === 'insights' && (
            <InsightsScreen
              entries={allEntries}
              categories={categories}
              reflections={reflections}
              timeZone={timeZone}
            />
          )}

          {activeTab === 'plant' && (
            <PlantScreen
              entries={allEntries}
              todayKey={todayKey}
              timeZone={timeZone}
              onLogActivity={() => {
                setLogSheetInitialActivity(null);
                setIsLogSheetOpen(true);
              }}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsScreen
              settings={settings}
              categories={categories}
              isLightMode={themeMode === 'light'}
              onToggleTheme={() => setThemeMode((m) => (m === 'dark' ? 'light' : 'dark'))}
              onUpdateSettings={(patch) => {
                updateStoredSettings(patch);
                reloadData();
              }}
              onOpenCategoryEditor={(cat) => setEditingCategory(cat || null)}
              onDataImported={reloadData}
              onShowToast={showToast}
              onSeedDay={handleSeedDay}
              onFirstRun={handleFirstRun}
              onOpenAuth={() => setIsAuthModalOpen(true)}
              onOpenOnboarding={() => setIsOnboardingOpen(true)}
            />
          )}
        </div>

        {/* Sticky Floating Bottom Navigation Bar */}
        <div
          className="absolute bottom-4 left-4 right-4 z-40 flex items-center justify-between px-4 py-2 rounded-[23px] backdrop-blur-xl border border-white/10 shadow-2xl"
          style={{
            background: 'var(--tf-glass)',
          }}
        >
          {/* Today Tab (◔) */}
          <button
            onClick={() => setActiveTab('today')}
            className={`flex flex-col items-center gap-0.5 transition-all cursor-pointer ${
              activeTab === 'today'
                ? 'text-[var(--tf-accent-ink)] font-bold scale-105'
                : 'text-[var(--tf-ink)] opacity-50 hover:opacity-100'
            }`}
          >
            <span className="text-lg leading-none">◔</span>
            <span className="text-[9.5px] font-medium tracking-tight">Today</span>
          </button>

          {/* Insights Tab (◫) */}
          <button
            onClick={() => setActiveTab('insights')}
            className={`flex flex-col items-center gap-0.5 transition-all cursor-pointer ${
              activeTab === 'insights'
                ? 'text-[var(--tf-accent-ink)] font-bold scale-105'
                : 'text-[var(--tf-ink)] opacity-50 hover:opacity-100'
            }`}
          >
            <span className="text-lg leading-none">◫</span>
            <span className="text-[9.5px] font-medium tracking-tight">Insights</span>
          </button>

          {/* Center Elevated 52px Add Block Button (＋) */}
          <button
            onClick={() => {
              setLogSheetInitialActivity(null);
              setIsLogSheetOpen(true);
            }}
            className="w-[48px] h-[48px] -mt-5 rounded-full flex items-center justify-center font-bold text-2xl text-black transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-xl"
            style={{
              background: 'linear-gradient(135deg, #7DD3FC 0%, #38BDF8 100%)',
              boxShadow: '0 4px 18px rgba(56, 189, 248, 0.45)',
            }}
            title="Log block"
          >
            ＋
          </button>

          {/* Plant Tab (❧) */}
          <button
            onClick={() => setActiveTab('plant')}
            className={`flex flex-col items-center gap-0.5 transition-all cursor-pointer ${
              activeTab === 'plant'
                ? 'text-emerald-400 font-bold scale-105'
                : 'text-[var(--tf-ink)] opacity-50 hover:opacity-100'
            }`}
          >
            <span className="text-lg leading-none">❧</span>
            <span className="text-[9.5px] font-medium tracking-tight">Plant</span>
          </button>

          {/* Settings Tab (⚙) */}
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex flex-col items-center gap-0.5 transition-all cursor-pointer ${
              activeTab === 'settings'
                ? 'text-[var(--tf-accent-ink)] font-bold scale-105'
                : 'text-[var(--tf-ink)] opacity-50 hover:opacity-100'
            }`}
          >
            <span className="text-lg leading-none">⚙</span>
            <span className="text-[9.5px] font-medium tracking-tight">Settings</span>
          </button>
        </div>

        {/* Full-Screen Focus Mode Overlay */}
        {isFocusOpen && timerState && (
          <FocusOverlay
            timer={timerState}
            activity={activeTimerActivity || undefined}
            category={activeTimerCategory || undefined}
            hourFormat={settings.hourFormat}
            onPause={handlePauseTimer}
            onResume={handleResumeTimer}
            onFinish={handleFinishTimer}
            onDiscard={handleDiscardTimer}
            onClose={() => setIsFocusOpen(false)}
          />
        )}

        {/* Two-Tap Quick Log Sheet */}
        {isLogSheetOpen && (
          <LogSheet
            activities={activities}
            categories={categories}
            initialActivity={logSheetInitialActivity}
            timeZone={timeZone}
            hourFormat={settings.hourFormat}
            onSaveEntry={handleSaveManualEntry}
            onStartTimer={handleStartTimer}
            onClose={() => {
              setIsLogSheetOpen(false);
              setLogSheetInitialActivity(null);
            }}
          />
        )}

        {/* Category Editor Sheet */}
        {editingCategory !== undefined && (
          <CategoryEditorSheet
            category={editingCategory}
            onSave={handleSaveCategory}
            onDelete={handleDeleteCategory}
            onClose={() => setEditingCategory(undefined)}
          />
        )}

        {/* Add Note to Past Entry Sheet */}
        {noteTargetEntry && (
          <AddNoteSheet
            entry={noteTargetEntry}
            onSaveNote={handleSaveNoteToEntry}
            onClose={() => setNoteTargetEntry(null)}
          />
        )}

        {/* Date Picker Sheet */}
        {isDatePickerOpen && (
          <DatePickerSheet
            selectedDateKey={selectedDateKey}
            todayKey={todayKey}
            allEntries={allEntries}
            timeZone={timeZone}
            onSelectDate={(newDateKey) => {
              setSelectedDateKey(newDateKey);
              const d = formatDateDetails(newDateKey, timeZone);
              showToast(`Dashboard date set to ${d.relativeLabel} (${d.shortDate})`);
            }}
            onClose={() => setIsDatePickerOpen(false)}
          />
        )}

        {/* Auth Modal */}
        {isAuthModalOpen && (
          <AuthModal
            onClose={() => setIsAuthModalOpen(false)}
            onSuccess={() => {
              showToast('Welcome to your private sanctuary');
              reloadData();
            }}
          />
        )}

        {/* Onboarding Modal */}
        {isOnboardingOpen && (
          <OnboardingModal
            onComplete={() => {
              setIsOnboardingOpen(false);
              showToast('Onboarding complete! Your intentions are active 🌿');
              reloadData();
            }}
          />
        )}

        {/* Toast notification pill */}
        {toastMessage && (
          <div className="absolute top-16 left-6 right-6 z-50 py-2 px-3 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-center text-xs text-[var(--tf-ink)] shadow-lg tf-rise">
            {toastMessage}
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
