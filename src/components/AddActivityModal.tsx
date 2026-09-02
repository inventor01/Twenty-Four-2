import React, { useState } from 'react';
import { Category, Activity } from '../types';
import { X, Plus, Check } from 'lucide-react';
import { soundEngine } from '../lib/sound';

interface AddActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onAddActivity: (activity: Activity) => void;
}

export const AddActivityModal: React.FC<AddActivityModalProps> = ({
  isOpen,
  onClose,
  categories,
  onAddActivity,
}) => {
  const [name, setName] = useState('');
  const [selectedCatId, setSelectedCatId] = useState(categories[0]?.id || '');
  const [isFavorite, setIsFavorite] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !selectedCatId) return;

    onAddActivity({
      id: 'act-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      categoryId: selectedCatId,
      name: name.trim(),
      isFavorite,
      isArchived: false,
    });
    soundEngine.playChime('start');
    soundEngine.vibrate('light');
    setName('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
      <div className="glass-card w-full max-w-md rounded-3xl p-6 sm:p-7 shadow-2xl border border-white/15 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
              <Plus className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-white dark:text-white light:text-slate-900">
              Create New Routine / Activity
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
            <label className="text-xs font-semibold text-slate-400 block mb-1">Activity Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Deep Writing, Mindful Meditation, Stroll"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-xs py-2.5 px-3 rounded-xl glass-input text-white focus:outline-none focus:border-sky-400"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">Parent Category</label>
            <select
              value={selectedCatId}
              onChange={(e) => setSelectedCatId(e.target.value)}
              className="w-full text-xs py-2.5 px-3 rounded-xl glass-input text-white focus:outline-none focus:border-sky-400"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id} className="bg-slate-900 text-white">
                  {c.emoji} {c.name} ({c.kind})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="fav-check"
              checked={isFavorite}
              onChange={(e) => setIsFavorite(e.target.checked)}
              className="w-4 h-4 rounded text-sky-500 accent-sky-500 cursor-pointer"
            />
            <label htmlFor="fav-check" className="text-xs text-slate-300 font-medium cursor-pointer">
              Add to Quick-Launch Favorites
            </label>
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
              <span>Create Activity</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
