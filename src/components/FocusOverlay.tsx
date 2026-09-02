import React, { useState, useEffect, useMemo } from 'react';
import { TimerState, Activity, Category, EntryNote } from '../types';
import { pointsForFocus } from '../lib/plant';
import { soundEngine } from '../lib/sound';
import { fmtTime12, fmtTime24 } from '../lib/time';

interface FocusOverlayProps {
  timer: TimerState;
  activity?: Activity;
  category?: Category;
  hourFormat: 12 | 24;
  onPause: () => void;
  onResume: () => void;
  onFinish: (notes: EntryNote[]) => void;
  onDiscard: () => void;
  onClose: () => void;
  onNotesChange?: (notes: EntryNote[]) => void;
}

export const FocusOverlay: React.FC<FocusOverlayProps> = ({
  timer,
  activity,
  category,
  hourFormat,
  onPause,
  onResume,
  onFinish,
  onDiscard,
  onClose,
  onNotesChange,
}) => {
  const [elapsedSec, setElapsedSec] = useState<number>(0);
  const [noteDraft, setNoteDraft] = useState<string>('');
  const [sessionNotes, setSessionNotes] = useState<EntryNote[]>(timer.notes || []);

  const isPaused = timer.pausedAtMs !== null;

  useEffect(() => {
    const updateTime = () => {
      const now = Date.now();
      let totalMs = 0;
      if (timer.pausedAtMs !== null) {
        totalMs = timer.pausedAtMs - timer.startedAtMs - timer.accumulatedPauseMs;
      } else {
        totalMs = now - timer.startedAtMs - timer.accumulatedPauseMs;
      }
      setElapsedSec(Math.max(0, Math.floor(totalMs / 1000)));
    };

    updateTime();
    const interval = setInterval(updateTime, 500);
    return () => clearInterval(interval);
  }, [timer]);

  const mins = Math.floor(elapsedSec / 60);
  const secs = elapsedSec % 60;
  const hours = Math.floor(mins / 60);
  const displayMins = mins % 60;

  const timerClock = hours > 0
    ? `${hours}:${displayMins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    : `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

  const focusPoints = useMemo(() => {
    return pointsForFocus(mins);
  }, [mins]);

  const targetSec = timer.targetIntervalSec || 25 * 60;
  const focusPct = Math.min(100, Math.round((elapsedSec / targetSec) * 100));
  const targetMins = Math.round(targetSec / 60);

  const handleAddNote = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!noteDraft.trim()) return;
    const newNote: EntryNote = {
      id: `note-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      text: noteDraft.trim(),
      createdAtMs: Date.now(),
    };
    setSessionNotes((prev) => {
      const next = [...prev, newNote];
      onNotesChange?.(next);
      return next;
    });
    setNoteDraft('');
  };

  const handleFinish = () => {
    soundEngine.playChime('finish');
    onFinish(sessionNotes);
  };

  const accentColor = category?.color || '#38BDF8';
  const activityName = activity?.name || 'Deep Work';
  const activityEmoji = category?.emoji || '⚡';

  return (
    <div
      className="tf-focus-overlay fixed top-0 bottom-0 left-1/2 z-[90] flex w-full max-w-md -translate-x-1/2 flex-col items-center select-none tf-rise tf-scroll"
      style={{
        background: 'radial-gradient(600px 520px at 50% 34%, rgba(56,189,248,.2), transparent 66%), linear-gradient(180deg, var(--tf-foc1), var(--tf-foc2))',
        color: 'var(--tf-ink)',
      }}
    >
      {/* Top Header Row */}
      <div className="flex items-center justify-between w-full flex-shrink-0">
        <button
          onClick={onClose}
          className="transition-all hover:opacity-100 cursor-pointer"
          style={{
            background: 'rgba(var(--tf-surf-rgb), 0.07)',
            border: '1px solid rgba(var(--tf-surf-rgb), 0.14)',
            borderRadius: '999px',
            color: 'rgba(var(--tf-ink-rgb), 0.75)',
            font: '500 13px/1 Archivo, sans-serif',
            padding: '11px 15px',
          }}
        >
          Minimise
        </button>

        <span
          style={{
            font: "600 10px/1 'JetBrains Mono', monospace",
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'rgba(var(--tf-ink-rgb), 0.45)',
          }}
        >
          {isPaused ? 'PAUSED' : 'RUNNING NOW'}
        </span>
      </div>

      {/* Center 290px Breathing Focus Ring & Clock */}
      <div className="tf-focus-ring relative flex items-center justify-center flex-shrink-0">
        {/* Pulsing ambient radial glow */}
        <div
          className="tf-breathe absolute inset-0 rounded-full pointer-events-none"
          style={{
            background: `radial-gradient(circle, ${accentColor}44, transparent 68%)`,
          }}
        />

        {/* Subtle inner track border */}
        <div
          className="absolute inset-[22px] rounded-full pointer-events-none"
          style={{
            border: '1px solid rgba(var(--tf-surf-rgb), 0.10)',
          }}
        />

        {/* Conic progress arc */}
        <div
          className="absolute inset-[22px] rounded-full pointer-events-none transition-all duration-300"
          style={{
            background: `conic-gradient(${accentColor} ${focusPct}%, rgba(var(--tf-surf-rgb), 0.07) 0)`,
            mask: 'radial-gradient(farthest-side, transparent calc(100% - 5px), #000 calc(100% - 4px))',
            WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 5px), #000 calc(100% - 4px))',
          }}
        />

        {/* Center Clock and Label Content */}
        <div className="relative flex flex-col items-center gap-1.5 text-center">
          <span
            className="tf-focus-clock"
            style={{
              font: "300 62px/1 'JetBrains Mono', monospace",
              letterSpacing: '-0.04em',
              color: 'var(--tf-ink)',
            }}
          >
            {timerClock}
          </span>

          <span
            className="flex items-center gap-1.5"
            style={{
              font: '600 15px/1.2 Archivo, sans-serif',
              letterSpacing: '-0.01em',
              color: 'var(--tf-ink)',
            }}
          >
            <span>{activityEmoji}</span>
            <span>{activityName}</span>
          </span>

          <span
            style={{
              font: "400 11px/1 'JetBrains Mono', monospace",
              color: 'rgba(var(--tf-ink-rgb), 0.45)',
            }}
          >
            target {targetMins}:00 · {focusPct}%
          </span>
        </div>
      </div>

      {/* Italic poetic line below the ring */}
      <p
        className="tf-focus-poem max-w-[280px] text-center italic"
        style={{
          font: "italic 400 19px/1.35 'Instrument Serif', serif",
          color: 'rgba(var(--tf-ink-rgb), 0.62)',
          margin: '0 0 16px 0',
        }}
      >
        {isPaused
          ? '“Paused time is never counted.”'
          : 'Nothing else is being asked of you right now.'}
      </p>

      {/* Note this moment section */}
      <div className="tf-focus-notes w-full max-w-[340px] flex flex-col gap-2 mb-2">
        <form onSubmit={handleAddNote} className="flex items-center gap-2">
          <input
            type="text"
            value={noteDraft}
            onChange={(e) => setNoteDraft(e.target.value)}
            placeholder="Note this moment…"
            className="tf-input flex-1 px-4 h-[44px] rounded-full text-sm text-[var(--tf-ink)]"
            style={{
              background: 'rgba(var(--tf-surf-rgb), 0.07)',
              border: '1px solid rgba(var(--tf-surf-rgb), 0.16)',
            }}
          />
          <button
            type="submit"
            className="w-[44px] h-[44px] flex-none rounded-full flex items-center justify-center text-lg transition-all hover:scale-105 active:scale-95 cursor-pointer"
            style={{
              background: 'rgba(var(--tf-surf-rgb), 0.10)',
              border: '1px solid rgba(var(--tf-surf-rgb), 0.18)',
              color: 'var(--tf-ink)',
            }}
          >
            ＋
          </button>
        </form>

        {sessionNotes.length > 0 && (
          <div className="flex flex-col gap-1.5 max-h-[80px] overflow-y-auto tf-scroll px-1">
            {sessionNotes.map((n) => {
              const timeStr = hourFormat === 12
                ? fmtTime12(n.createdAtMs)
                : fmtTime24(n.createdAtMs);
              return (
                <div
                  key={n.id}
                  className="flex items-baseline gap-2 px-3 py-1.5 rounded-xl text-xs"
                  style={{
                    background: 'rgba(var(--tf-surf-rgb), 0.05)',
                    border: '1px solid rgba(var(--tf-surf-rgb), 0.10)',
                  }}
                >
                  <span
                    className="font-mono text-[9.5px] opacity-45 flex-shrink-0"
                  >
                    {timeStr}
                  </span>
                  <span
                    className="italic text-[14px] text-[var(--tf-ink)] opacity-85"
                    style={{ fontFamily: 'var(--font-serif)' }}
                  >
                    {n.text}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom Action Controls */}
      <div className="flex flex-col gap-2.5 w-full max-w-[340px] flex-shrink-0">
        {/* Finish · waters the plant +N button */}
        <button
          onClick={handleFinish}
          className="w-full h-[54px] rounded-full text-white font-bold transition-all hover:brightness-110 active:scale-[0.98] cursor-pointer flex items-center justify-center shadow-lg"
          style={{
            font: '700 15.5px/1 Archivo, sans-serif',
            background: 'linear-gradient(135deg, rgba(127,211,194, 0.36), rgba(59,142,138, 0.24))',
            border: '1px solid rgba(127,211,194, 0.55)',
            boxShadow: '0 8px 24px -10px rgba(127,211,194, 0.4)',
          }}
        >
          Finish · waters the plant +{focusPoints}
        </button>

        {/* Pause / Resume and Discard row */}
        <div className="flex items-center gap-2.5 w-full">
          <button
            onClick={isPaused ? onResume : onPause}
            className="flex-1 h-[48px] rounded-full transition-all hover:bg-white/10 active:scale-[0.98] cursor-pointer flex items-center justify-center"
            style={{
              font: '600 14px/1 Archivo, sans-serif',
              background: 'rgba(var(--tf-surf-rgb), 0.06)',
              border: '1px solid rgba(var(--tf-surf-rgb), 0.16)',
              color: 'var(--tf-ink)',
            }}
          >
            {isPaused ? 'Resume' : 'Pause'}
          </button>

          <button
            onClick={onDiscard}
            className="flex-1 h-[48px] rounded-full transition-all hover:bg-red-500/20 active:scale-[0.98] cursor-pointer flex items-center justify-center"
            style={{
              font: '600 14px/1 Archivo, sans-serif',
              background: 'rgba(213,108,104, 0.12)',
              border: '1px solid rgba(213,108,104, 0.4)',
              color: 'var(--tf-danger)',
            }}
          >
            Discard
          </button>
        </div>
      </div>
    </div>
  );
};
