import React from 'react';
import { Activity, Category, TimerState } from '../types';
import { elapsedMs } from '../timer/engine';
import { fmtClock } from '../lib/time';
import { AlertCircle, Check, Trash2 } from 'lucide-react';
import { soundEngine } from '../lib/sound';

interface ConflictModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTimer: TimerState | null;
  targetActivityId: string | null;
  activities: Activity[];
  categories: Category[];
  onFinishAndStart: () => void;
  onDiscardAndStart: () => void;
}

export const ConflictModal: React.FC<ConflictModalProps> = ({
  isOpen,
  onClose,
  currentTimer,
  targetActivityId,
  activities,
  categories,
  onFinishAndStart,
  onDiscardAndStart,
}) => {
  if (!isOpen || !currentTimer || !targetActivityId) return null;

  const currentAct = activities.find((a) => a.id === currentTimer.activityId);
  const targetAct = activities.find((a) => a.id === targetActivityId);
  const elapsed = elapsedMs(currentTimer, Date.now());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
      <div className="glass-card w-full max-w-md rounded-3xl p-6 sm:p-7 shadow-2xl border border-white/15 space-y-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400 shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-white dark:text-white light:text-slate-900">
              A session is currently in progress
            </h3>
            <p className="text-xs text-slate-300 dark:text-slate-300 light:text-slate-600 mt-1 leading-relaxed">
              Currently tracking <strong className="text-white dark:text-white light:text-slate-900">{currentAct?.name}</strong> for{' '}
              <span className="font-mono font-bold text-sky-400">{fmtClock(elapsed)}</span>.
              How would you like to transition before starting <strong className="text-white dark:text-white light:text-slate-900">{targetAct?.name}</strong>?
            </p>
          </div>
        </div>

        <div className="space-y-2 pt-2">
          <button
            onClick={() => {
              soundEngine.playChime('finish');
              soundEngine.vibrate('success');
              onFinishAndStart();
            }}
            className="w-full py-3 px-4 glass-btn-display text-white rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer"
          >
            <Check className="w-4 h-4 text-sky-300" />
            <span>Finish current & start {targetAct?.name}</span>
          </button>

          <button
            onClick={() => {
              soundEngine.vibrate('light');
              onDiscardAndStart();
            }}
            className="w-full py-2.5 px-4 glass-card-subtle text-rose-400 border border-white/10 rounded-2xl text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Discard current & start {targetAct?.name}</span>
          </button>

          <button
            onClick={onClose}
            className="w-full py-2 px-4 text-slate-400 hover:text-white text-xs font-medium text-center cursor-pointer"
          >
            Keep current timer running
          </button>
        </div>
      </div>
    </div>
  );
};
