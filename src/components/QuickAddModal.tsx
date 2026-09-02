import React, { useState } from 'react';
import { Activity, Category } from '../types';
import { X, Check } from 'lucide-react';
import { soundEngine } from '../lib/sound';
import { ClockAuraIcon } from './OrganicIcons';

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  dateKey: string;
  activities: Activity[];
  categories: Category[];
  onAddEntry: (activityId: string, startMs: number, endMs: number, note?: string) => void;
}

export const QuickAddModal: React.FC<QuickAddModalProps> = ({
  isOpen,
  onClose,
  dateKey,
  activities,
  categories,
  onAddEntry,
}) => {
  const [selectedActId, setSelectedActId] = useState<string>(activities[0]?.id || '');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [note, setNote] = useState('');

  if (!isOpen) return null;

  const categoryMap = new Map<string, Category>(categories.map((c) => [c.id, c]));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedActId) return;

    const [y, m, d] = dateKey.split('-').map(Number);
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);

    const startMs = new Date(y, m - 1, d, sh, sm).getTime();
    let endMs = new Date(y, m - 1, d, eh, em).getTime();

    if (endMs <= startMs) {
      // Overnight wrap
      endMs += 24 * 3600 * 1000;
    }

    onAddEntry(selectedActId, startMs, endMs, note.trim() || undefined);
    soundEngine.playChime('start');
    soundEngine.vibrate('light');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
      <div className="glass-card w-full max-w-md rounded-3xl p-6 sm:p-7 shadow-2xl border border-white/15 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
              <ClockAuraIcon size={18} />
            </div>
            <h3 className="text-base font-bold text-white dark:text-white light:text-slate-900">
              Log Past Balance Block
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white glass-pill transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">Routine Activity</label>
            <select
              value={selectedActId}
              onChange={(e) => setSelectedActId(e.target.value)}
              className="w-full text-xs py-2.5 px-3 rounded-xl glass-input text-white focus:outline-none focus:border-sky-400"
            >
              {activities.map((act) => {
                const cat = categoryMap.get(act.categoryId);
                return (
                  <option key={act.id} value={act.id} className="bg-slate-900 text-white">
                    {cat?.emoji} {act.name} ({cat?.name})
                  </option>
                );
              })}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">Start Time</label>
              <input
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full text-xs py-2 px-3 rounded-xl glass-input text-white focus:outline-none focus:border-sky-400 font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">End Time</label>
              <input
                type="time"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full text-xs py-2 px-3 rounded-xl glass-input text-white focus:outline-none focus:border-sky-400 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">Reflection Note (optional)</label>
            <input
              type="text"
              placeholder="e.g. Deep focus sprint, mindful walk in park"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full text-xs py-2.5 px-3 rounded-xl glass-input placeholder:text-slate-500 focus:outline-none focus:border-sky-400"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-2xl text-xs font-semibold text-slate-400 glass-pill cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-2xl text-xs font-bold glass-btn-display cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5 text-sky-300" />
              <span>Record Block</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
