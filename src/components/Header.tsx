import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Volume2, VolumeX } from 'lucide-react';
import { formatDateNice, shiftDateKey, localDateKey } from '../lib/time';
import { TimerState, Activity, Category } from '../types';
import { elapsedMs } from '../timer/engine';
import { fmtClock } from '../lib/time';
import { soundEngine } from '../lib/sound';
import { ZenLotusIcon, MoonRestIcon, SunRadianceIcon, SparkleAuraIcon, LayersBalanceIcon } from './OrganicIcons';
import { MoodVibeKey, MOOD_VIBES, ThemeMode } from '../theme/moodTheme';

interface HeaderProps {
  currentDateKey: string;
  onSelectDate: (key: string) => void;
  timerState: TimerState | null;
  activities: Activity[];
  categories: Category[];
  themeMode: ThemeMode;
  onToggleTheme: () => void;
  currentMoodVibe: MoodVibeKey;
  onSelectMoodVibe: (vibe: MoodVibeKey) => void;
  onOpenQuickAdd: () => void;
  onOpenAddActivity: () => void;
  onOpenCategoryEditor: () => void;
  onJumpToTimer: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentDateKey,
  onSelectDate,
  timerState,
  activities,
  categories,
  themeMode,
  onToggleTheme,
  currentMoodVibe,
  onSelectMoodVibe,
  onOpenQuickAdd,
  onOpenAddActivity,
  onOpenCategoryEditor,
  onJumpToTimer,
}) => {
  const [nowTick, setNowTick] = useState(Date.now());
  const [soundOn, setSoundOn] = useState(soundEngine.enabled);
  const [showMoodMenu, setShowMoodMenu] = useState(false);
  const moodMenuRef = useRef<HTMLDivElement>(null);
  const isToday = currentDateKey === localDateKey();

  useEffect(() => {
    if (!timerState) return;
    const interval = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [timerState]);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (moodMenuRef.current && !moodMenuRef.current.contains(e.target as Node)) {
        setShowMoodMenu(false);
      }
    };
    if (showMoodMenu) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [showMoodMenu]);

  const activeActivity = timerState
    ? activities.find((a) => a.id === timerState.activityId)
    : null;
  const activeCategory = activeActivity
    ? categories.find((c) => c.id === activeActivity.categoryId)
    : null;

  const currentElapsed = timerState ? elapsedMs(timerState, nowTick) : 0;
  const activeVibe = MOOD_VIBES[currentMoodVibe] || MOOD_VIBES['serene-navy'];

  const handleToggleSound = () => {
    const next = soundEngine.toggleSound();
    setSoundOn(next);
  };

  const handlePickMood = (key: MoodVibeKey) => {
    onSelectMoodVibe(key);
    setShowMoodMenu(false);
    soundEngine.playChime('mood');
    soundEngine.vibrate('light');
  };

  return (
    <header className="sticky top-0 z-30 transition-colors duration-400 glass-header px-4 py-3 sm:px-8">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Brand & Active session pill */}
        <div className="flex items-center justify-between w-full sm:w-auto gap-3">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-500 shadow-sm"
              style={{
                backgroundColor: `${activeVibe.accentColor}25`,
                color: activeVibe.accentColor,
                border: `1px solid ${activeVibe.accentColor}50`,
              }}
            >
              <ZenLotusIcon size={18} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-sm tracking-tight text-white dark:text-white light:text-slate-900 font-sans">
                  Twentyfour
                </span>
                <span className="hidden md:inline-block text-[11px] font-medium text-slate-400 dark:text-slate-400 light:text-slate-500 italic">
                  Wellness Ledger
                </span>
              </div>
            </div>
          </div>

          {/* Running Timer Quick Badge */}
          {timerState && activeActivity && (
            <button
              id="header-active-timer-btn"
              onClick={onJumpToTimer}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-btn-active text-xs font-medium hover:scale-105 transition-all cursor-pointer shadow-sm animate-pulse"
            >
              <span className="w-2 h-2 rounded-full bg-sky-400 shadow-[0_0_8px_#38BDF8]" />
              <span className="font-semibold text-white dark:text-white light:text-slate-900 truncate max-w-[120px]">
                {activeCategory?.emoji || '⏱️'} {activeActivity.name}
              </span>
              <span className="font-mono font-bold text-sky-300 dark:text-sky-300 light:text-sky-600">
                {fmtClock(currentElapsed)}
              </span>
            </button>
          )}
        </div>

        {/* Date Selector Navigation */}
        <div className="flex items-center gap-1.5 glass-pill rounded-2xl px-2 py-0.5 shadow-2xs">
          <button
            id="prev-date-btn"
            onClick={() => onSelectDate(shiftDateKey(currentDateKey, -1))}
            className="p-1.5 hover:bg-white/10 dark:hover:bg-white/10 light:hover:bg-black/5 rounded-xl text-slate-400 dark:text-slate-400 light:text-slate-600 hover:text-white dark:hover:text-white light:hover:text-black transition-colors"
            title="Previous Day"
            aria-label="Previous Day"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            id="current-date-title-btn"
            onClick={() => onSelectDate(localDateKey())}
            className="px-3 py-1 text-xs font-semibold text-slate-200 dark:text-slate-200 light:text-slate-800 hover:bg-white/10 dark:hover:bg-white/10 light:hover:bg-black/5 rounded-xl transition-colors flex items-center gap-1.5"
          >
            <span>{formatDateNice(currentDateKey)}</span>
            {!isToday && (
              <span
                className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-md"
                style={{
                  backgroundColor: `${activeVibe.accentColor}20`,
                  color: activeVibe.accentColor,
                }}
              >
                Today
              </span>
            )}
          </button>

          <button
            id="next-date-btn"
            onClick={() => onSelectDate(shiftDateKey(currentDateKey, 1))}
            className="p-1.5 hover:bg-white/10 dark:hover:bg-white/10 light:hover:bg-black/5 rounded-xl text-slate-400 dark:text-slate-400 light:text-slate-600 hover:text-white dark:hover:text-white light:hover:text-black transition-colors"
            title="Next Day"
            aria-label="Next Day"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Header Sensory & Action Tools */}
        <div className="flex items-center gap-2">
          {/* Living Mood Atmosphere Aura Selector */}
          <div className="relative" ref={moodMenuRef}>
            <button
              onClick={() => setShowMoodMenu(!showMoodMenu)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl glass-pill text-xs font-semibold hover:scale-105 transition-all cursor-pointer"
              style={{
                borderColor: `${activeVibe.accentColor}40`,
              }}
              title="Living Mood Atmosphere: Select your energy vibe"
            >
              <span className="text-sm">{activeVibe.emoji}</span>
              <span className="hidden md:inline font-medium text-slate-300 dark:text-slate-300 light:text-slate-700">
                {activeVibe.name}
              </span>
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: activeVibe.accentColor }}
              />
            </button>

            {/* Mood Atmosphere Dropdown Modal */}
            {showMoodMenu && (
              <div className="absolute right-0 mt-2 w-64 glass-card rounded-2xl p-2.5 shadow-2xl border border-white/15 z-50 animate-fadeIn space-y-1">
                <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 light:text-slate-500 flex items-center gap-1.5">
                  <SparkleAuraIcon size={12} className="text-sky-400" />
                  <span>Living Atmosphere Vibe</span>
                </div>
                <div className="space-y-1">
                  {(Object.keys(MOOD_VIBES) as MoodVibeKey[]).map((key) => {
                    const v = MOOD_VIBES[key];
                    const isSelected = key === currentMoodVibe;
                    return (
                      <button
                        key={key}
                        onClick={() => handlePickMood(key)}
                        className={`w-full flex items-center justify-between p-2 rounded-xl text-xs transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-white/15 dark:bg-white/15 light:bg-black/10 font-bold text-white dark:text-white light:text-slate-900'
                            : 'hover:bg-white/5 text-slate-300 dark:text-slate-300 light:text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-base">{v.emoji}</span>
                          <div className="text-left">
                            <div className="leading-tight">{v.name}</div>
                            <div className="text-[10px] opacity-70 font-normal">{v.tagline}</div>
                          </div>
                        </div>
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: v.accentColor }}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Theme Mode Toggle (Dark Flagship / Light Warm Sanctuary) */}
          <button
            onClick={onToggleTheme}
            className="p-2 rounded-xl glass-pill text-slate-300 dark:text-slate-300 light:text-slate-700 hover:text-white dark:hover:text-white light:hover:text-black transition-all cursor-pointer"
            title={themeMode === 'dark' ? 'Switch to Light Sanctuary' : 'Switch to Dark Sanctuary'}
          >
            {themeMode === 'dark' ? (
              <MoonRestIcon size={16} className="text-sky-300" />
            ) : (
              <SunRadianceIcon size={16} className="text-amber-500" />
            )}
          </button>

          {/* Sound toggle */}
          <button
            onClick={handleToggleSound}
            className="p-2 rounded-xl glass-pill text-slate-300 dark:text-slate-300 light:text-slate-700 hover:text-white transition-colors cursor-pointer"
            title={soundOn ? 'Harmonic chime audio on' : 'Audio muted'}
          >
            {soundOn ? (
              <Volume2 className="w-4 h-4" style={{ color: activeVibe.accentColor }} />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-500" />
            )}
          </button>

          {/* Categories Button */}
          <button
            onClick={onOpenCategoryEditor}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl glass-pill text-xs font-semibold text-slate-200 dark:text-slate-200 light:text-slate-800 hover:bg-white/15 transition-colors cursor-pointer"
            title="Categories & classifications"
          >
            <LayersBalanceIcon size={14} style={{ color: activeVibe.accentColor }} />
            <span className="hidden sm:inline">Categories</span>
          </button>

          {/* Quick Add Time - Glassy Display Style */}
          <button
            id="quick-add-time-btn"
            onClick={onOpenQuickAdd}
            className="flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-bold glass-btn-display cursor-pointer"
          >
            <Plus className="w-4 h-4 text-sky-300 drop-shadow-[0_0_6px_rgba(56,189,248,0.6)]" />
            <span className="tracking-tight">Log Time</span>
          </button>
        </div>
      </div>
    </header>
  );
};
