import React, { useState, useEffect } from 'react';
import { Play, Pause, Check, Trash2, MessageSquare, Star, Volume2, VolumeX } from 'lucide-react';
import { TimerState, Activity, Category, TimerMode } from '../types';
import { elapsedMs } from '../timer/engine';
import { fmtClock, hhmm, fmt } from '../lib/time';
import { soundEngine } from '../lib/sound';
import { ClockAuraIcon, FlameFocusIcon, DropBreathIcon, SoundChimeIcon } from './OrganicIcons';

interface RunningTimerCardProps {
  timer: TimerState;
  activities: Activity[];
  categories: Category[];
  onPause: () => void;
  onResume: () => void;
  onFinish: (note?: string, rating?: number) => void;
  onDiscard: () => void;
  onUpdateTimerState?: (updated: Partial<TimerState>) => void;
}

export const RunningTimerCard: React.FC<RunningTimerCardProps> = ({
  timer,
  activities,
  categories,
  onPause,
  onResume,
  onFinish,
  onDiscard,
  onUpdateTimerState,
}) => {
  const [tick, setTick] = useState(Date.now());
  const [note, setNote] = useState('');
  const [rating, setRating] = useState<number | undefined>(undefined);
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [soundOn, setSoundOn] = useState(soundEngine.enabled);

  useEffect(() => {
    const interval = setInterval(() => setTick(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const activity = activities.find((a) => a.id === timer.activityId);
  const category = activity ? categories.find((c) => c.id === activity.categoryId) : null;
  const elapsed = elapsedMs(timer, tick);
  const elapsedSec = Math.floor(elapsed / 1000);
  const isPaused = timer.pausedAtMs != null;

  const mode: TimerMode = timer.mode || 'continuous';
  const targetIntervalSec = timer.targetIntervalSec || 25 * 60;

  // For Pomodoro / Structured Interval Mode:
  const isPomodoro = mode === 'pomodoro';
  const currentIntervalProgress = targetIntervalSec > 0 ? (elapsedSec % targetIntervalSec) : 0;
  const intervalRemainingSec = Math.max(0, targetIntervalSec - currentIntervalProgress);
  const intervalPct = targetIntervalSec > 0 ? Math.min(100, Math.round((currentIntervalProgress / targetIntervalSec) * 100)) : 0;

  // Check if interval just hit a cycle
  useEffect(() => {
    if (isPomodoro && !isPaused && elapsedSec > 0 && elapsedSec % targetIntervalSec === 0) {
      soundEngine.playChime('interval');
      soundEngine.vibrate('interval');
    }
  }, [elapsedSec, isPomodoro, isPaused, targetIntervalSec]);

  const handlePause = () => {
    soundEngine.playChime('pause');
    soundEngine.vibrate('light');
    onPause();
  };

  const handleResume = () => {
    soundEngine.playChime('resume');
    soundEngine.vibrate('light');
    onResume();
  };

  const handleFinish = () => {
    soundEngine.playChime('finish');
    soundEngine.vibrate('success');
    onFinish(note.trim() || undefined, rating);
    setNote('');
    setRating(undefined);
    setShowNoteInput(false);
  };

  const toggleSound = () => {
    const next = soundEngine.toggleSound();
    setSoundOn(next);
  };

  const switchMode = (newMode: TimerMode, intervalSec: number = 25 * 60) => {
    if (onUpdateTimerState) {
      onUpdateTimerState({
        mode: newMode,
        targetIntervalSec: intervalSec,
      });
      soundEngine.vibrate('light');
    }
  };

  const accentColor = category?.color || '#38BDF8';

  return (
    <div
      id="active-running-timer-card"
      className="relative glass-card rounded-3xl p-6 sm:p-7 overflow-hidden transition-all duration-500"
    >
      {/* Soft atmospheric glow inside card */}
      <div
        className="ambient-glow -top-20 -right-20 w-64 h-64 animate-breathe"
        style={{ backgroundColor: `${accentColor}30` }}
      />
      <div
        className="ambient-glow -bottom-20 -left-20 w-64 h-64"
        style={{ backgroundColor: `${accentColor}18` }}
      />

      <div className="relative z-10 space-y-5">
        {/* Top Header Row: Status, Category, Audio Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span
              className="inline-flex items-center gap-2 text-xs font-semibold px-3.5 py-1.5 rounded-full border glass-card-subtle backdrop-blur-md"
              style={{
                borderColor: `${accentColor}45`,
              }}
            >
              <span
                className={`w-2 h-2 rounded-full ${isPaused ? 'bg-amber-400' : 'animate-ping'}`}
                style={{ backgroundColor: isPaused ? '#F59E0B' : accentColor, boxShadow: `0 0 8px ${accentColor}` }}
              />
              <span className="text-white dark:text-white light:text-slate-900">{isPaused ? 'Session Paused' : isPomodoro ? 'Focus Interval Flowing' : 'Conscious Block Active'}</span>
            </span>

            <span className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-500 font-mono">
              started {hhmm(timer.startedAtMs)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Mode switch pills */}
            <div className="flex items-center p-0.5 rounded-2xl glass-pill text-xs">
              <button
                type="button"
                onClick={() => switchMode('continuous')}
                className={`px-3 py-1.5 rounded-xl font-medium transition-all cursor-pointer ${
                  mode === 'continuous'
                    ? 'glass-btn-active font-bold shadow-xs'
                    : 'text-slate-400 dark:text-slate-400 light:text-slate-600 hover:text-white'
                }`}
              >
                Flow
              </button>
              <button
                type="button"
                onClick={() => switchMode('pomodoro', 25 * 60)}
                className={`px-3 py-1.5 rounded-xl font-medium transition-all cursor-pointer ${
                  mode === 'pomodoro' && targetIntervalSec === 25 * 60
                    ? 'glass-btn-active font-bold shadow-xs'
                    : 'text-slate-400 dark:text-slate-400 light:text-slate-600 hover:text-white'
                }`}
              >
                25m Focus
              </button>
              <button
                type="button"
                onClick={() => switchMode('pomodoro', 50 * 60)}
                className={`px-3 py-1.5 rounded-xl font-medium transition-all cursor-pointer ${
                  mode === 'pomodoro' && targetIntervalSec === 50 * 60
                    ? 'glass-btn-active font-bold shadow-xs'
                    : 'text-slate-400 dark:text-slate-400 light:text-slate-600 hover:text-white'
                }`}
              >
                50m Deep
              </button>
            </div>

            {/* Sound toggle */}
            <button
              onClick={toggleSound}
              className="p-2.5 rounded-2xl glass-pill text-slate-300 dark:text-slate-300 light:text-slate-700 hover:text-white transition-colors cursor-pointer"
              title={soundOn ? 'Harmonic chime audio on' : 'Chimes muted'}
            >
              {soundOn ? <Volume2 className="w-4 h-4 text-sky-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
            </button>
          </div>
        </div>

        {/* Main Display: Activity Info & Big Clock Display */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 pt-1">
          <div className="flex items-center gap-3.5">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-sm border border-white/10 dark:border-white/10 light:border-black/10"
              style={{ backgroundColor: `${accentColor}25` }}
            >
              {category?.emoji || '⏱️'}
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white dark:text-white light:text-slate-900 tracking-tight font-sans">
                {activity?.name || 'Active Session'}
              </h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs font-semibold" style={{ color: accentColor }}>
                  {category?.name || 'General'}
                </span>
                <span className="text-xs text-slate-500">·</span>
                <span className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-500 capitalize">{category?.kind || 'flexible'}</span>
              </div>
            </div>
          </div>

          {/* Big Time Display */}
          <div className="flex items-center gap-4 sm:text-right">
            {isPomodoro && (
              <div className="text-right hidden sm:block">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 light:text-slate-500 uppercase tracking-wider block">
                  Interval Target
                </span>
                <span className="font-mono text-xl font-bold text-sky-400">
                  {fmtClock(intervalRemainingSec * 1000)}
                </span>
              </div>
            )}

            <div>
              <div className="font-mono text-4xl sm:text-5xl font-black tracking-tight text-white dark:text-white light:text-slate-900 tabular-nums">
                {fmtClock(elapsed)}
              </div>
              <span className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-500 font-medium block mt-0.5">
                {isPaused
                  ? 'Paused. Tap Resume to continue tracking.'
                  : isPomodoro
                  ? `Cycle: ${fmt(targetIntervalSec)} interval (${intervalPct}%)`
                  : 'Drift-proof ledger tracking in real-time'}
              </span>
            </div>
          </div>
        </div>

        {/* Pomodoro Progress Bar */}
        {isPomodoro && (
          <div className="space-y-1.5 pt-1">
            <div className="w-full h-2 bg-black/30 dark:bg-black/40 light:bg-black/5 rounded-full overflow-hidden border border-white/10">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${intervalPct}%`,
                  backgroundColor: accentColor,
                }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-slate-400 dark:text-slate-400 light:text-slate-500 font-medium">
              <span>Interval progress: {fmt(currentIntervalProgress)}</span>
              <span>{fmt(intervalRemainingSec)} remaining in interval</span>
            </div>
          </div>
        )}

        {/* Optional Reflection Note & Star Rating */}
        {showNoteInput && (
          <div className="pt-3 border-t border-white/10 dark:border-white/10 light:border-black/10 flex flex-col gap-2.5 animate-fadeIn">
            <label className="text-xs font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700">
              Session Reflection Note
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What was completed or felt restorative? (optional)"
              className="w-full px-4 py-2.5 text-xs glass-input rounded-xl placeholder:text-slate-500 focus:outline-none focus:border-sky-400"
            />
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 font-medium">Energy & Focus Score:</span>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((val) => {
                  const isFilled = rating != null && val <= rating;
                  return (
                    <button
                      key={val}
                      type="button"
                      onClick={() => {
                        setRating(rating === val ? undefined : val);
                        soundEngine.vibrate('light');
                      }}
                      className={`p-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-xl transition-all cursor-pointer ${
                        isFilled
                          ? 'text-amber-400 bg-amber-400/15 scale-105'
                          : 'text-slate-400 dark:text-slate-400 light:text-slate-500 hover:text-amber-300'
                      }`}
                      title={`${val} star`}
                    >
                      <Star className={`w-4 h-4 ${isFilled ? 'fill-current' : ''}`} />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Action Controls */}
        <div className="pt-4 border-t border-white/[0.08] dark:border-white/[0.08] light:border-black/[0.08] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            {isPaused ? (
              <button
                id="timer-resume-btn"
                onClick={handleResume}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl glass-btn-display text-xs font-bold shadow-md cursor-pointer"
              >
                <Play className="w-4 h-4 fill-sky-300 text-sky-300 drop-shadow-[0_0_8px_rgba(56,189,248,0.7)]" />
                <span>Resume</span>
              </button>
            ) : (
              <button
                id="timer-pause-btn"
                onClick={handlePause}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl glass-pill text-white dark:text-white light:text-slate-900 text-xs font-semibold shadow-xs hover:border-white/20 transition-all cursor-pointer"
              >
                <Pause className="w-4 h-4 text-amber-300" />
                <span>Pause</span>
              </button>
            )}

            <button
              id="timer-finish-btn"
              onClick={handleFinish}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl glass-btn-display text-xs font-bold shadow-md cursor-pointer"
            >
              <Check className="w-4 h-4 text-emerald-300 drop-shadow-[0_0_8px_rgba(52,211,153,0.7)]" />
              <span>Finish & Record</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setShowNoteInput(!showNoteInput);
                soundEngine.vibrate('light');
              }}
              className={`p-2.5 rounded-2xl transition-all cursor-pointer ${
                showNoteInput ? 'glass-btn-active' : 'glass-pill text-slate-400 hover:text-white'
              }`}
              title="Add reflection note & rating"
            >
              <MessageSquare className="w-4 h-4 text-sky-300" />
            </button>
          </div>

          {/* Discard Session */}
          {confirmDiscard ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-rose-400 font-semibold">Discard time?</span>
              <button
                id="confirm-discard-btn"
                onClick={() => {
                  soundEngine.vibrate('light');
                  onDiscard();
                }}
                className="px-3 py-1.5 rounded-xl bg-rose-500 text-white text-xs font-semibold hover:bg-rose-600 cursor-pointer"
              >
                Yes, discard
              </button>
              <button
                onClick={() => setConfirmDiscard(false)}
                className="px-3 py-1.5 rounded-xl glass-pill text-xs font-medium text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              id="timer-discard-btn"
              onClick={() => setConfirmDiscard(true)}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-rose-400 transition-colors p-2 cursor-pointer"
              title="Discard this session"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Discard</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
