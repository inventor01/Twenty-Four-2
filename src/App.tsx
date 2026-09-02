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
  deleteEntries,
  updateStoredTimer,
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
import { syncFirestoreForUser, persistEntryToCloud, removeEntryFromCloud } from './lib/cloudSync';

type NavTab = 'today' | 'insights' | 'plant' | 'settings';

const NAV_TABS: { id: NavTab; glyph: string; label: string }[] = [
  { id: 'today', glyph: '◔', label: 'Today' },
  { id: 'insights', glyph: '◫', label: 'Insights' },
  { id: 'plant', glyph: '❧', label: 'Plant' },
  { id: 'settings', glyph: '⚙', label: 'Settings' },
];

const tabStyle = (on: boolean): React.CSSProperties => ({
  height: 54,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 5,
  borderRadius: 18,
  cursor: 'pointer',
  border: on ? '1px solid rgba(56,189,248,.45)' : '1px solid transparent',
  background: on ? 'linear-gradient(135deg,rgba(56,189,248,.22),rgba(37,99,235,.12))' : 'transparent',
  color: on ? 'var(--tf-accent-ink)' : 'rgba(var(--tf-ink-rgb),.55)',
  fontFamily: 'Archivo,sans-serif',
});

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
    const result = startTimerFor(activity.id, 'continuous', settings.defaultFocusMinutes * 60);
    if (result.conflict) {
      setIsFocusOpen(true);
      showToast('A focus session is already running');
      return;
    }
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

  const handleUpdateLedgerEntry = (entry: TimeEntry) => {
    updateEntry(entry);
    if (user) void persistEntryToCloud(user.uid, entry);
    showToast('Entry updated');
  };

  const handleDeleteLedgerEntries = (ids: string[]) => {
    const deletedCount = deleteEntries(ids);
    if (user) ids.forEach((id) => void removeEntryFromCloud(user.uid, id));
    if (deletedCount > 0) showToast(`${deletedCount} ${deletedCount === 1 ? 'entry' : 'entries'} deleted`);
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

  // Wordmark ring — 19x19 conic gradient of today's blocks, masked to a 5px band
  const wordmarkRingStyle = useMemo((): React.CSSProperties => {
    const mask =
      'radial-gradient(farthest-side, transparent calc(100% - 5px), #000 calc(100% - 4px))';

    const totals = new Map<string, number>();
    todayEntries.forEach((e) => {
      const color = e.categoryColor || '#818CF8';
      totals.set(color, (totals.get(color) || 0) + Math.max(0, e.durationSec));
    });

    const totalSec = Array.from(totals.values()).reduce((a, b) => a + b, 0);

    let background: string;
    if (totalSec <= 0) {
      background = 'conic-gradient(from -90deg, rgba(var(--tf-surf-rgb),.16) 0 100%)';
    } else {
      const stops: string[] = [];
      let deg = 0;
      Array.from(totals.entries())
        .sort((a, b) => b[1] - a[1])
        .forEach(([color, sec]) => {
          const end = deg + (sec / totalSec) * 360;
          stops.push(`${color} ${deg.toFixed(1)}deg ${end.toFixed(1)}deg`);
          deg = end;
        });
      background = `conic-gradient(from -90deg, ${stops.join(', ')})`;
    }

    return {
      width: 19,
      height: 19,
      borderRadius: '50%',
      flex: 'none',
      margin: '0 1px',
      background,
      mask,
      WebkitMask: mask,
    };
  }, [todayEntries]);

  return (
    <div className="w-full min-h-screen bg-[var(--tf-bg)] text-[var(--tf-ink)] flex flex-col items-center justify-start transition-colors duration-300 antialiased font-sans">
      {/* Mobile Shell Wrapper — 402px frame, spec background stack */}
      <div
        className="w-full max-w-[402px] min-h-screen relative flex flex-col overflow-x-hidden"
        style={{
          background: [
            'radial-gradient(520px 340px at 50% -6%, rgba(56,189,248,.16), transparent 68%)',
            'radial-gradient(420px 380px at 96% 44%, rgba(129,140,248,.13), transparent 66%)',
            'linear-gradient(180deg,var(--tf-scr1) 0%,var(--tf-scr2) 52%,var(--tf-scr3) 100%)',
          ].join(','),
        }}
      >
        {/* Four floating gradient blobs */}
        <div
          className="tf-blob tf-blob-a"
          style={{
            top: -90,
            left: -70,
            width: 320,
            height: 320,
            background: 'radial-gradient(circle,var(--tf-b1),transparent 68%)',
            filter: 'blur(42px)',
          }}
        />
        <div
          className="tf-blob tf-blob-b"
          style={{
            top: '36%',
            right: -110,
            width: 300,
            height: 300,
            background: 'radial-gradient(circle,var(--tf-b2),transparent 68%)',
            filter: 'blur(42px)',
          }}
        />
        <div
          className="tf-blob tf-blob-a"
          style={{
            bottom: -110,
            left: -60,
            width: 340,
            height: 340,
            background: 'radial-gradient(circle,var(--tf-b3),transparent 70%)',
            filter: 'blur(46px)',
            animationDuration: '29s',
          }}
        />
        <div
          className="tf-blob tf-blob-b"
          style={{
            bottom: '16%',
            right: -90,
            width: 240,
            height: 240,
            background: 'radial-gradient(circle,var(--tf-b4),transparent 70%)',
            filter: 'blur(40px)',
            animationDuration: '37s',
          }}
        />

        {/* Noise overlay */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 'var(--tf-noise)' as unknown as number,
            pointerEvents: 'none',
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='140' height='140'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/><feColorMatrix type='saturate' values='0'/></filter><rect width='140' height='140' filter='url(%23n)' opacity='0.35'/></svg>\")",
          }}
        />

        {/* Wordmark — non-sticky, centred, on every screen */}
        <div
          className="relative flex items-center justify-center cursor-pointer select-none"
          style={{ gap: 1, padding: '66px 20px 18px' }}
          onClick={() => setActiveTab('today')}
        >
          <span
            style={{
              font: '700 21px/1 Archivo, sans-serif',
              letterSpacing: '-.045em',
              color: 'var(--tf-ink)',
            }}
          >
            twentyf
          </span>
          <span style={wordmarkRingStyle} />
          <span
            style={{
              font: '700 21px/1 Archivo, sans-serif',
              letterSpacing: '-.045em',
              color: 'var(--tf-ink)',
            }}
          >
            ur
          </span>
        </div>

        {/* Running Timer Bar (Sticky if active) */}
        {timerState && !isFocusOpen && (
          <div
            onClick={() => setIsFocusOpen(true)}
            className="tf-running-timer sticky top-[58px] z-30 mx-4 my-2 p-3 rounded-2xl flex items-center justify-between shadow-lg cursor-pointer"
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') setIsFocusOpen(true);
            }}
            aria-label="Open active focus timer"
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
        <div className="tf-scroll relative flex-1" style={{ padding: '0 20px 132px' }}>
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
                todayEntries={todayEntries}
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
                activities={activities}
                selectedDateKey={selectedDateKey}
                hourFormat={settings.hourFormat}
                timeZone={timeZone}
                onAddNote={(entry) => setNoteTargetEntry(entry)}
                onOpenLogModal={() => {
                  setLogSheetInitialActivity(null);
                  setIsLogSheetOpen(true);
                }}
                onUpdateEntry={handleUpdateLedgerEntry}
                onDeleteEntries={handleDeleteLedgerEntries}
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

        {/* Tab bar — spec grid 1fr 1fr 62px 1fr 1fr */}
        <div
          className="absolute"
          style={{
            left: 12,
            right: 12,
            bottom: 20,
            zIndex: 60,
            height: 62,
            borderRadius: 23,
            background: 'var(--tf-glass)',
            backdropFilter: 'blur(26px) saturate(150%)',
            WebkitBackdropFilter: 'blur(26px) saturate(150%)',
            border: '1px solid rgba(var(--tf-surf-rgb),.14)',
            boxShadow:
              '0 20px 44px -26px rgba(var(--tf-shadow-rgb),.95), inset 0 1px rgba(var(--tf-surf-rgb),.14)',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 62px 1fr 1fr',
            alignItems: 'center',
            gap: 2,
            padding: '0 6px',
          }}
        >
          {NAV_TABS.slice(0, 2).map((t) => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={tabStyle(activeTab === t.id)}>
              <span style={{ fontSize: 13, lineHeight: 1 }}>{t.glyph}</span>
              <span style={{ font: '600 9.5px/1 Archivo, sans-serif' }}>{t.label}</span>
            </button>
          ))}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <button
              onClick={() => {
                setLogSheetInitialActivity(null);
                setIsLogSheetOpen(true);
              }}
              title="Log block"
              style={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                border: '1px solid rgba(56,189,248,.6)',
                background: 'linear-gradient(140deg,rgba(56,189,248,.55),rgba(37,99,235,.4))',
                boxShadow:
                  '0 14px 30px -12px rgba(56,189,248,.8), inset 0 1px 2px rgba(var(--tf-surf-rgb),.6)',
                color: '#fff',
                font: '300 26px/1 Archivo, sans-serif',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 0 2px 0',
              }}
            >
              ＋
            </button>
          </div>

          {NAV_TABS.slice(2).map((t) => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={tabStyle(activeTab === t.id)}>
              <span style={{ fontSize: 13, lineHeight: 1 }}>{t.glyph}</span>
              <span style={{ font: '600 9.5px/1 Archivo, sans-serif' }}>{t.label}</span>
            </button>
          ))}
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
            onNotesChange={(notes) => updateStoredTimer({ notes })}
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
