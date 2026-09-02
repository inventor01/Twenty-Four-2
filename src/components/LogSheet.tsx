import React, { useState } from 'react';
import { Activity, Category } from '../types';
import { pointsForTimeLog } from '../lib/plant';
import { fmtTime12, fmtTime24 } from '../lib/time';

interface LogSheetProps {
  activities: Activity[];
  categories: Category[];
  initialActivity?: Activity | null;
  timeZone: string;
  hourFormat: 12 | 24;
  onSaveEntry: (
    activity: Activity,
    durationMins: number,
    note?: string,
    customStartMs?: number,
    customEndMs?: number
  ) => void;
  onStartTimer: (activity: Activity) => void;
  onClose: () => void;
}

const DURATION_PRESETS = [
  { label: '15m', mins: 15 },
  { label: '30m', mins: 30 },
  { label: '45m', mins: 45 },
  { label: '1h', mins: 60 },
  { label: '1h 30m', mins: 90 },
];

export const LogSheet: React.FC<LogSheetProps> = ({
  activities,
  categories,
  initialActivity,
  timeZone,
  hourFormat,
  onSaveEntry,
  onStartTimer,
  onClose,
}) => {
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(initialActivity || null);
  const [durationMins, setDurationMins] = useState<number>(45);
  const [noteText, setNoteText] = useState<string>('');

  // Mode: 'just-finished' (default ending now), 'custom-time' (set exact start/end time)
  const [entryTimingMode, setEntryTimingMode] = useState<'just-finished' | 'custom-time'>('just-finished');

  // Time setting helpers
  const now = new Date();
  const defaultStartTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(
    Math.max(0, now.getMinutes() - 45)
  ).padStart(2, '0')}`;
  const defaultEndTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const [startTimeStr, setStartTimeStr] = useState<string>(defaultStartTimeStr);
  const [endTimeStr, setEndTimeStr] = useState<string>(defaultEndTimeStr);
  const [entryDateStr, setEntryDateStr] = useState<string>(now.toISOString().split('T')[0]);

  const activeCategory = selectedActivity
    ? categories.find((c) => c.id === selectedActivity.categoryId)
    : null;

  const pointsEarned = pointsForTimeLog(durationMins);

  const handleSave = () => {
    if (!selectedActivity) return;

    if (entryTimingMode === 'custom-time') {
      const [sh, sm] = startTimeStr.split(':').map(Number);
      const [eh, em] = endTimeStr.split(':').map(Number);
      const [yr, mo, dy] = entryDateStr.split('-').map(Number);

      const startDate = new Date(yr, mo - 1, dy, sh, sm, 0, 0);
      let endDate = new Date(yr, mo - 1, dy, eh, em, 0, 0);

      // If end time is earlier than start time, assume it ended on the following day
      if (endDate.getTime() <= startDate.getTime()) {
        endDate = new Date(endDate.getTime() + 24 * 3600 * 1000);
      }

      const diffMins = Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / (60 * 1000)));
      onSaveEntry(
        selectedActivity,
        diffMins,
        noteText.trim() || undefined,
        startDate.getTime(),
        endDate.getTime()
      );
    } else {
      onSaveEntry(selectedActivity, durationMins, noteText.trim() || undefined);
    }
    onClose();
  };

  const handleStart = () => {
    if (!selectedActivity) return;
    onStartTimer(selectedActivity);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/60 backdrop-blur-sm select-none">
      <div
        className="w-full max-w-[440px] rounded-t-3xl p-5 flex flex-col gap-4 tf-sheet max-h-[90vh] overflow-y-auto tf-scroll shadow-2xl"
        style={{
          background: 'linear-gradient(180deg, var(--tf-sheet1) 0%, var(--tf-sheet2) 100%)',
          borderTop: '1px solid rgba(var(--tf-surf-rgb), 0.15)',
          color: 'var(--tf-ink)',
        }}
      >
        {/* Handle bar */}
        <div className="w-10 h-1 rounded-full bg-white/20 mx-auto -mt-1 mb-1" />

        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-[var(--tf-ink)] tracking-tight">
            {selectedActivity ? 'Log Time Block' : 'Choose Activity'}
          </h3>
          <button
            onClick={onClose}
            className="text-xs px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-[var(--tf-ink)] opacity-70 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Step 1: Select Activity if none selected */}
        {!selectedActivity ? (
          <div className="flex flex-col gap-2">
            <span className="text-xs opacity-60 font-mono">Step 1 of 2: Pick what you spent time on</span>
            <div className="grid grid-cols-2 gap-2 max-h-[360px] overflow-y-auto tf-scroll">
              {activities
                .filter((a) => !a.isArchived)
                .map((act) => {
                  const cat = categories.find((c) => c.id === act.categoryId);
                  return (
                    <button
                      key={act.id}
                      onClick={() => setSelectedActivity(act)}
                      className="flex items-center gap-2.5 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-left transition-all cursor-pointer"
                    >
                      <span className="text-lg">{cat?.emoji || '⏳'}</span>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-medium text-[var(--tf-ink)] truncate">{act.name}</span>
                        <span className="text-[10px] opacity-40 truncate">{cat?.name}</span>
                      </div>
                    </button>
                  );
                })}
            </div>
          </div>
        ) : (
          /* Step 2: Configure Timing & Duration */
          <div className="flex flex-col gap-4">
            {/* Selected activity card with change button */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-2xl">{activeCategory?.emoji || '⏳'}</span>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-semibold text-[var(--tf-ink)] truncate">{selectedActivity.name}</span>
                  <span className="text-xs opacity-50 truncate">{activeCategory?.name}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedActivity(null)}
                className="text-xs text-[var(--tf-accent-ink)] hover:underline cursor-pointer flex-shrink-0 ml-2"
              >
                Change
              </button>
            </div>

            {/* Timing Mode Segmented Tabs: Just Finished vs Custom Time / Plan */}
            <div className="flex p-1 rounded-xl bg-white/5 border border-white/10">
              <button
                onClick={() => setEntryTimingMode('just-finished')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  entryTimingMode === 'just-finished'
                    ? 'bg-[var(--tf-accent-ink)] text-black font-bold shadow-sm'
                    : 'text-[var(--tf-ink)] opacity-60 hover:opacity-100'
                }`}
              >
                Just Finished
              </button>
              <button
                onClick={() => setEntryTimingMode('custom-time')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  entryTimingMode === 'custom-time'
                    ? 'bg-[var(--tf-accent-ink)] text-black font-bold shadow-sm'
                    : 'text-[var(--tf-ink)] opacity-60 hover:opacity-100'
                }`}
              >
                Set Exact Time / Plan
              </button>
            </div>

            {entryTimingMode === 'just-finished' ? (
              /* Duration presets for Just Finished */
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium opacity-70">Duration</span>
                  <span className="font-mono text-xs font-bold text-[var(--tf-accent-ink)]">
                    {durationMins >= 60 ? `${Math.floor(durationMins / 60)}h ` : ''}
                    {durationMins % 60 > 0 ? `${durationMins % 60}m` : ''}
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {DURATION_PRESETS.map((preset) => (
                    <button
                      key={preset.mins}
                      onClick={() => setDurationMins(preset.mins)}
                      className={`py-2 rounded-xl text-xs font-mono font-medium transition-all cursor-pointer ${
                        durationMins === preset.mins
                          ? 'bg-[var(--tf-accent-ink)] text-black font-bold shadow-md'
                          : 'bg-white/5 border border-white/10 opacity-70 hover:opacity-100'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* Custom Date & Start/End Times */
              <div className="flex flex-col gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-mono opacity-60 uppercase">Date</span>
                  <input
                    type="date"
                    value={entryDateStr}
                    onChange={(e) => setEntryDateStr(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-black/20 border border-white/10 text-[var(--tf-ink)] focus:border-[var(--tf-accent-ink)] font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] font-mono opacity-60 uppercase">Start Time</span>
                    <input
                      type="time"
                      value={startTimeStr}
                      onChange={(e) => setStartTimeStr(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl text-xs bg-black/20 border border-white/10 text-[var(--tf-ink)] focus:border-[var(--tf-accent-ink)] font-mono"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] font-mono opacity-60 uppercase">End Time</span>
                    <input
                      type="time"
                      value={endTimeStr}
                      onChange={(e) => setEndTimeStr(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl text-xs bg-black/20 border border-white/10 text-[var(--tf-ink)] focus:border-[var(--tf-accent-ink)] font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Optional Note */}
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium opacity-70">Note (optional)</span>
              <input
                type="text"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="What made this block meaningful?"
                className="tf-input w-full px-3 py-2.5 rounded-xl text-xs bg-white/5 border border-white/10 text-[var(--tf-ink)] focus:border-[var(--tf-accent-ink)]"
              />
            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-2 mt-1">
              <button
                onClick={handleSave}
                className="w-full py-3 rounded-2xl font-bold text-sm bg-[var(--tf-accent-ink)] text-black shadow-lg hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>{entryTimingMode === 'custom-time' ? 'Save Scheduled Block' : 'Save Block'}</span>
                <span className="text-xs font-mono opacity-70">· +{pointsEarned} plant pts</span>
              </button>

              {entryTimingMode === 'just-finished' && (
                <button
                  onClick={handleStart}
                  className="w-full py-2.5 rounded-2xl font-medium text-xs bg-white/10 hover:bg-white/15 text-[var(--tf-ink)] transition-all cursor-pointer text-center"
                >
                  ▶ Or start live timer for this
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
