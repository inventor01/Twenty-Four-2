import React, { useState } from 'react';
import { TimeEntry, DailyReflection, Activity, Category } from '../types';
import { fmt } from '../lib/time';
import { trackedSec, untrackedSec } from '../analytics/ledger';
import { Check, Star } from 'lucide-react';
import { soundEngine } from '../lib/sound';
import { MoonRestIcon, JournalBookIcon, SparkleAuraIcon, DropBreathIcon } from './OrganicIcons';
import { MoodVibeKey, MOOD_VIBES, moodVibeFromRating } from '../theme/moodTheme';

interface CloseoutViewProps {
  dateKey: string;
  entries: TimeEntry[];
  reflection: DailyReflection | null;
  activities: Activity[];
  categories: Category[];
  onSaveReflection: (r: DailyReflection) => void;
  onAddSleepBlock: (hours: number) => void;
  onSetMoodVibe?: (vibe: MoodVibeKey) => void;
}

const DAILY_QUESTIONS = [
  'What single moment today felt most deeply restorative or meaningful?',
  'Where did your attention flow most effortlessly today?',
  'What is one boundary you respected or wish you held today?',
  'How did your balance of deep focus versus conscious rest feel?',
  'What are you grateful to let go of before resting tonight?',
];

export const CloseoutView: React.FC<CloseoutViewProps> = ({
  dateKey,
  entries,
  reflection,
  activities,
  categories,
  onSaveReflection,
  onAddSleepBlock,
  onSetMoodVibe,
}) => {
  const tracked = trackedSec(entries);
  const untracked = untrackedSec(entries, tracked);

  // Pick question based on day
  const questionIndex = Math.abs(
    dateKey.split('-').reduce((acc, part) => acc + parseInt(part, 10), 0) % DAILY_QUESTIONS.length
  );
  const activeQuestion = DAILY_QUESTIONS[questionIndex];

  const [answer, setAnswer] = useState(reflection?.answer || '');
  const [moodRating, setMoodRating] = useState<number | undefined>(reflection?.moodRating || 5);
  const [sleepLogged, setSleepLogged] = useState(false);
  const [isSaved, setIsSaved] = useState(!!reflection);

  const hasSleep = entries.some((e) => e.categoryName.toLowerCase().includes('sleep'));

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim()) return;

    onSaveReflection({
      dateKey,
      question: activeQuestion,
      answer: answer.trim(),
      closedAtMs: Date.now(),
      moodRating,
    });
    setIsSaved(true);

    // If mood rating was chosen, update mood aura vibe!
    if (moodRating && onSetMoodVibe) {
      const vibeKey = moodVibeFromRating(moodRating);
      onSetMoodVibe(vibeKey);
    }

    soundEngine.playChime('reflect');
    soundEngine.vibrate('success');
  };

  const handleQuickSleep = (hours: number) => {
    onAddSleepBlock(hours);
    setSleepLogged(true);
    soundEngine.playChime('start');
    soundEngine.vibrate('light');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn">
      <div className="glass-card rounded-3xl p-6 sm:p-9 space-y-6 relative overflow-hidden transition-all duration-500">
        {/* Soft atmospheric ambient glow */}
        <div className="ambient-glow -top-20 -right-20 w-72 h-72 bg-indigo-600/25" />
        <div className="ambient-glow -bottom-20 -left-20 w-72 h-72 bg-sky-500/20" />

        <div className="relative z-10 space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl glass-pill text-sky-400 mx-auto flex items-center justify-center shadow-sm">
              <MoonRestIcon size={24} />
            </div>
            <h2 className="text-2xl font-bold text-white dark:text-white light:text-slate-900 font-sans tracking-tight">
              Evening Balance & Closeout
            </h2>
            <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 max-w-md mx-auto">
              Close your 24-hour ledger with a mindful reflection before resting tonight.
            </p>
          </div>

          {/* Quick sleep prompt if untracked & no sleep */}
          {!hasSleep && !sleepLogged && (
            <div className="p-4 rounded-2xl glass-card-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs border border-indigo-400/30">
              <div className="space-y-0.5">
                <span className="font-semibold text-xs text-white dark:text-white light:text-slate-900 flex items-center gap-1.5">
                  <DropBreathIcon size={14} className="text-indigo-400" />
                  <span>Did you get restorative sleep last night?</span>
                </span>
                <p className="text-[11px] text-slate-400">
                  Quickly log your baseline sleep to fill untracked baseline hours.
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => handleQuickSleep(7.5)}
                  className="px-3 py-1.5 rounded-xl glass-pill text-xs font-semibold text-white dark:text-white light:text-slate-900 hover:bg-white/20 transition-colors cursor-pointer"
                >
                  7.5h Sleep
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickSleep(8)}
                  className="px-3 py-1.5 rounded-xl glass-pill text-xs font-semibold text-white dark:text-white light:text-slate-900 hover:bg-white/20 transition-colors cursor-pointer"
                >
                  8h Sleep
                </button>
              </div>
            </div>
          )}

          {/* Daily 24h Summary Glance */}
          <div className="grid grid-cols-2 gap-3 glass-card-subtle p-4 rounded-2xl text-center">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Total Accounted</span>
              <span className="text-xl font-bold text-white dark:text-white light:text-slate-900 block font-mono mt-0.5">{fmt(tracked)}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Remaining Untracked</span>
              <span className="text-xl font-bold text-slate-400 block font-mono mt-0.5">{fmt(untracked)}</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSave} className="space-y-5">
            {/* Contemplation prompt */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-sky-200 dark:text-sky-200 light:text-slate-800 font-serif italic text-center text-base">
                "{activeQuestion}"
              </label>
              <textarea
                rows={3}
                required
                value={answer}
                onChange={(e) => {
                  setAnswer(e.target.value);
                  setIsSaved(false);
                }}
                placeholder="Write your evening thoughts here..."
                className="w-full text-xs p-3.5 glass-input rounded-2xl placeholder:text-slate-500 focus:outline-none focus:border-sky-400 shadow-inner resize-none leading-relaxed"
              />
            </div>

            {/* Daily Harmony Mood Rating */}
            <div className="flex flex-col items-center gap-2">
              <span className="text-xs font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700 flex items-center gap-1.5">
                <SparkleAuraIcon size={13} className="text-amber-400" />
                <span>Daily Well-being & Mood Energy State</span>
              </span>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((val) => {
                  const isFilled = moodRating != null && val <= moodRating;
                  return (
                    <button
                      key={val}
                      type="button"
                      onClick={() => {
                        // If user clicks the currently selected rating, toggle or set
                        setMoodRating(moodRating === val ? undefined : val);
                        setIsSaved(false);
                        soundEngine.vibrate('light');
                      }}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center ${
                        isFilled
                          ? 'bg-amber-400/20 border-amber-400 text-amber-400 scale-105 shadow-xs'
                          : 'glass-pill text-slate-400 dark:text-slate-400 light:text-slate-500 border-white/10 hover:text-amber-300'
                      }`}
                      title={`Rate ${val} star${val > 1 ? 's' : ''}`}
                    >
                      <Star className={`w-5 h-5 ${isFilled ? 'fill-current' : ''}`} />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Submit */}
            <div className="text-center pt-2">
              <button
                type="submit"
                className={`w-full py-3.5 rounded-2xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer ${
                  isSaved
                    ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/20'
                    : 'glass-btn-display'
                }`}
              >
                <Check className={`w-4 h-4 ${isSaved ? '' : 'text-sky-300'}`} />
                <span>{isSaved ? 'Ledger Closed & Recorded' : 'Complete Reflection & Close Books'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
