import React, { useState } from 'react';
import { TimeEntry } from '../types';
import { hhmm, fmt } from '../lib/time';
import { Trash2, Edit2, Plus, Star } from 'lucide-react';
import { soundEngine } from '../lib/sound';
import { ClockAuraIcon, JournalBookIcon } from './OrganicIcons';

interface TimelineEntriesProps {
  entries: TimeEntry[];
  onDeleteEntry: (id: string) => void;
  onUpdateEntry: (entry: TimeEntry) => void;
  onOpenQuickAdd: () => void;
}

export const TimelineEntries: React.FC<TimelineEntriesProps> = ({
  entries,
  onDeleteEntry,
  onUpdateEntry,
  onOpenQuickAdd,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNote, setEditNote] = useState('');
  const [editRating, setEditRating] = useState<number | undefined>(undefined);

  const startEdit = (entry: TimeEntry) => {
    setEditingId(entry.id);
    setEditNote(entry.note || '');
    setEditRating(entry.valueRating);
    soundEngine.vibrate('light');
  };

  const saveEdit = (entry: TimeEntry) => {
    onUpdateEntry({
      ...entry,
      note: editNote.trim() || undefined,
      valueRating: editRating,
    });
    setEditingId(null);
    soundEngine.playChime('resume');
    soundEngine.vibrate('light');
  };

  return (
    <div className="glass-card rounded-3xl p-6 sm:p-7 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-[11px] font-bold tracking-widest text-slate-400 dark:text-slate-400 light:text-slate-500 uppercase flex items-center gap-1.5">
            <ClockAuraIcon size={14} className="text-sky-400" />
            <span>CHRONOLOGICAL LEDGER ENTRIES</span>
          </h3>
          <p className="text-xs text-slate-300 dark:text-slate-300 light:text-slate-600 mt-0.5">
            {entries.length} {entries.length === 1 ? 'logged block' : 'logged blocks'} recorded in today's ledger
          </p>
        </div>
        {entries.length > 0 && (
          <button
            onClick={onOpenQuickAdd}
            className="flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-2xl glass-btn-display cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-sky-300" />
            <span>Add Past Time</span>
          </button>
        )}
      </div>

      {entries.length === 0 ? (
        <div className="text-center py-12 px-4 rounded-3xl border border-dashed border-white/10 dark:border-white/10 light:border-black/10 glass-card-subtle">
          <ClockAuraIcon size={32} className="text-sky-400 mx-auto mb-2 opacity-80 drop-shadow-[0_0_8px_rgba(56,189,248,0.4)]" />
          <p className="text-sm font-semibold text-white dark:text-white light:text-slate-900">Your 24-hour ledger is clear.</p>
          <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 mt-1 max-w-sm mx-auto">
            Start a routine timer or log a past block of time to record your day's conscious balance.
          </p>
          <button
            onClick={onOpenQuickAdd}
            className="mt-4 px-4 py-2 glass-btn-display text-xs font-bold rounded-2xl shadow-sm inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-sky-300" />
            <span>+ Log Past Time</span>
          </button>
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-white/[0.08] dark:divide-white/[0.08] light:divide-black/[0.08]">
          {entries.map((entry) => {
            const isEditing = editingId === entry.id;

            return (
              <div
                key={entry.id}
                className="py-4 first:pt-1 last:pb-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
              >
                {/* Left: Emoji, Activity & Details */}
                <div className="flex items-start gap-3.5 min-w-0">
                  <span className="text-2xl pt-0.5 shrink-0 flex items-center justify-center w-9 h-9 rounded-xl bg-black/20 dark:bg-black/40 light:bg-black/5">
                    {entry.emoji}
                  </span>
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-white dark:text-white light:text-slate-900">
                        {entry.activityName}
                      </span>
                      <span
                        className="text-[11px] font-medium px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: `${entry.categoryColor}25`,
                          color: '#FFFFFF',
                          border: `1px solid ${entry.categoryColor}40`,
                        }}
                      >
                        {entry.categoryName}
                      </span>
                      {entry.valueRating && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-amber-400 font-semibold glass-pill px-2 py-0.5 rounded-md">
                          <Star className="w-3 h-3 fill-current" />
                          <span>{entry.valueRating}/5</span>
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-500 font-mono">
                      {hhmm(entry.startedAtMs)} – {hhmm(entry.endedAtMs)}
                    </div>

                    {/* Note */}
                    {!isEditing && entry.note && (
                      <p className="text-xs text-slate-300 dark:text-slate-300 light:text-slate-700 mt-1 glass-card-subtle p-2 rounded-xl italic font-serif leading-relaxed">
                        "{entry.note}"
                      </p>
                    )}

                    {/* Inline Edit Form */}
                    {isEditing && (
                      <div className="mt-2 flex flex-col gap-2 glass-card p-3 rounded-2xl border border-sky-400/40 shadow-xs">
                        <input
                          type="text"
                          value={editNote}
                          onChange={(e) => setEditNote(e.target.value)}
                          placeholder="Session note or reflection..."
                          className="w-full text-xs px-3 py-2 glass-input rounded-xl focus:outline-none focus:border-sky-400"
                        />
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1">
                            <span className="text-[11px] text-slate-400 dark:text-slate-400 light:text-slate-600">Rating:</span>
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((num) => {
                                const isFilled = editRating != null && num <= editRating;
                                return (
                                  <button
                                    key={num}
                                    type="button"
                                    onClick={() => setEditRating(editRating === num ? undefined : num)}
                                    className={`p-1 rounded-md cursor-pointer transition-colors ${
                                      isFilled ? 'text-amber-400' : 'text-slate-400 dark:text-slate-500 light:text-slate-400 hover:text-amber-300'
                                    }`}
                                  >
                                    <Star className={`w-4 h-4 ${isFilled ? 'fill-current' : ''}`} />
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => saveEdit(entry)}
                              className="px-3 py-1.5 rounded-xl bg-sky-500 text-slate-950 text-xs font-bold hover:bg-sky-400 cursor-pointer shadow-xs"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="px-2.5 py-1.5 rounded-xl glass-pill text-slate-400 dark:text-slate-400 light:text-slate-700 text-xs font-semibold cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Duration & Actions */}
                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                  <div className="font-mono font-bold text-sm text-white dark:text-white light:text-slate-900 glass-pill px-3 py-1.5 rounded-xl shadow-2xs">
                    {fmt(entry.durationSec)}
                  </div>

                  {!isEditing && (
                    <div className="flex items-center gap-1 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => startEdit(entry)}
                        className="p-1.5 text-slate-400 hover:text-white glass-pill rounded-xl transition-colors cursor-pointer"
                        title="Edit note & rating"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          soundEngine.vibrate('light');
                          onDeleteEntry(entry.id);
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-400 glass-pill rounded-xl transition-colors cursor-pointer"
                        title="Delete entry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
