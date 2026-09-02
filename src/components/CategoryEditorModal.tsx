import React, { useState } from 'react';
import { Category, Activity, CategoryKind } from '../types';
import { X, Plus, Trash2, Check, Star, ChevronRight } from 'lucide-react';
import { soundEngine } from '../lib/sound';
import { LayersBalanceIcon, DropBreathIcon, FlameFocusIcon, MoonRestIcon, SparkleAuraIcon } from './OrganicIcons';

interface CategoryEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  activities: Activity[];
  onSaveCategory: (category: Category) => void;
  onDeleteCategory: (id: string) => void;
  onSaveActivity: (activity: Activity) => void;
  onArchiveActivity: (id: string) => void;
}

const WELLNESS_PALETTE = [
  { name: 'Sky Azure', color: '#38BDF8' },
  { name: 'Mineral Navy', color: '#3B82F6' },
  { name: 'Indigo Aura', color: '#6366F1' },
  { name: 'Sage Blossom', color: '#10B981' },
  { name: 'Warm Amber', color: '#F59E0B' },
  { name: 'Dusk Lavender', color: '#8B5CF6' },
  { name: 'Coral Rose', color: '#F43F5E' },
  { name: 'Teal Oasis', color: '#14B8A6' },
  { name: 'Emerald Forest', color: '#059669' },
  { name: 'Deep Royal', color: '#1E40AF' },
  { name: 'Golden Sand', color: '#EAB308' },
  { name: 'Muted Slate', color: '#64748B' },
];

const EMOJI_PRESETS = ['😴', '💼', '🏡', '💪', '📚', '🎬', '📱', '🧺', '🧘', '🌱', '☕', '🎨', '🚶', '🎧', '🥑', '✨', '🌊', '🕯️'];

export const CategoryEditorModal: React.FC<CategoryEditorModalProps> = ({
  isOpen,
  onClose,
  categories,
  activities,
  onSaveCategory,
  onDeleteCategory,
  onSaveActivity,
  onArchiveActivity,
}) => {
  const [selectedCatId, setSelectedCatId] = useState<string | null>(categories[0]?.id || null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // Form states for Category
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('✨');
  const [color, setColor] = useState(WELLNESS_PALETTE[0].color);
  const [kind, setKind] = useState<CategoryKind>('flexible');
  const [description, setDescription] = useState('');

  // New activity form inside selected category
  const [newActivityName, setNewActivityName] = useState('');

  if (!isOpen) return null;

  const activeCategory = categories.find((c) => c.id === selectedCatId);
  const catActivities = activities.filter((a) => a.categoryId === selectedCatId);

  const startEditCategory = (cat: Category) => {
    setIsCreatingNew(false);
    setSelectedCatId(cat.id);
    setName(cat.name);
    setEmoji(cat.emoji);
    setColor(cat.color);
    setKind(cat.kind);
    setDescription(cat.description || '');
  };

  const startNewCategory = () => {
    setIsCreatingNew(true);
    setSelectedCatId(null);
    setName('');
    setEmoji('🌱');
    setColor(WELLNESS_PALETTE[Math.floor(Math.random() * WELLNESS_PALETTE.length)].color);
    setKind('flexible');
    setDescription('');
  };

  const handleSaveCat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const catId = isCreatingNew
      ? 'cat-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6)
      : selectedCatId!;

    const saved: Category = {
      id: catId,
      name: name.trim(),
      emoji: emoji.trim() || '⏱️',
      color,
      kind,
      description: description.trim() || undefined,
      isCustom: true,
    };

    onSaveCategory(saved);
    soundEngine.playChime('start');
    soundEngine.vibrate('medium');
    setIsCreatingNew(false);
    setSelectedCatId(catId);
  };

  const handleAddActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActivityName.trim() || !selectedCatId) return;

    onSaveActivity({
      id: 'act-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      categoryId: selectedCatId,
      name: newActivityName.trim(),
      isFavorite: false,
      isArchived: false,
    });
    setNewActivityName('');
    soundEngine.vibrate('light');
  };

  const handleDelete = (id: string) => {
    if (categories.length <= 1) {
      alert('You must keep at least one category.');
      return;
    }
    if (confirm('Are you sure you want to delete this category? Associated activities will be archived.')) {
      onDeleteCategory(id);
      const remaining = categories.filter((c) => c.id !== id);
      setSelectedCatId(remaining[0]?.id || null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col glass-card rounded-3xl overflow-hidden shadow-2xl border border-white/15">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 glass-card-subtle">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
              <LayersBalanceIcon size={18} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white dark:text-white light:text-slate-900">
                Category & Classification Architecture
              </h2>
              <p className="text-xs text-slate-400">
                Tailor your 24-hour balance ledger categories, luminous colors, and Oura types
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white glass-pill transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body: Left sidebar (Categories list) + Right pane (Edit form & activities) */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12">
          {/* Left list */}
          <div className="md:col-span-5 p-4 border-r border-white/10 overflow-y-auto max-h-[70vh] space-y-3 glass-card-subtle">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Categories ({categories.length})
              </span>
              <button
                onClick={startNewCategory}
                className="flex items-center gap-1 text-xs font-semibold text-sky-400 hover:text-sky-300 px-2.5 py-1 rounded-xl glass-pill cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Category</span>
              </button>
            </div>

            <div className="space-y-1.5">
              {categories.map((cat) => {
                const isSelected = !isCreatingNew && selectedCatId === cat.id;
                const actCount = activities.filter((a) => a.categoryId === cat.id && !a.isArchived).length;

                return (
                  <button
                    key={cat.id}
                    onClick={() => startEditCategory(cat)}
                    className={`w-full text-left p-3 rounded-2xl transition-all flex items-center justify-between border cursor-pointer ${
                      isSelected
                        ? 'glass-card border-sky-400 ring-2 ring-sky-400/30'
                        : 'glass-card-subtle border-transparent hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xl flex items-center justify-center w-8 h-8 rounded-xl bg-black/20 shrink-0">
                        {cat.emoji}
                      </span>
                      <div className="min-w-0">
                        <div className="font-semibold text-sm text-white dark:text-white light:text-slate-900 truncate flex items-center gap-1.5">
                          <span>{cat.name}</span>
                          <span
                            className="w-2 h-2 rounded-full inline-block shrink-0"
                            style={{ backgroundColor: cat.color }}
                          />
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-2">
                          <span className="capitalize">{cat.kind}</span>
                          <span>·</span>
                          <span>{actCount} {actCount === 1 ? 'activity' : 'activities'}</span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className={`w-4 h-4 ${isSelected ? 'text-sky-400' : 'text-slate-600'}`} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right edit pane */}
          <div className="md:col-span-7 p-6 overflow-y-auto max-h-[70vh] space-y-6">
            {isCreatingNew || activeCategory ? (
              <form onSubmit={handleSaveCat} className="space-y-5">
                <div>
                  <h3 className="text-sm font-semibold text-white dark:text-white light:text-slate-900">
                    {isCreatingNew ? 'Create New Category' : `Edit Category: ${activeCategory?.name}`}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Define how this category factors into your daily 24-hour balance ledger
                  </p>
                </div>

                {/* Name & Emoji row */}
                <div className="grid grid-cols-4 gap-3">
                  <div className="col-span-1">
                    <label className="text-xs font-semibold text-slate-400 block mb-1">Emoji</label>
                    <input
                      type="text"
                      maxLength={4}
                      value={emoji}
                      onChange={(e) => setEmoji(e.target.value)}
                      className="w-full text-center text-xl py-2 px-2 rounded-xl glass-input text-white focus:outline-none focus:border-sky-400"
                    />
                  </div>
                  <div className="col-span-3">
                    <label className="text-xs font-semibold text-slate-400 block mb-1">Category Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Meditation, Writing, Deep Focus"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full text-sm py-2.5 px-3.5 rounded-xl glass-input text-white focus:outline-none focus:border-sky-400"
                    />
                  </div>
                </div>

                {/* Emoji quick presets */}
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">Quick Emojis</span>
                  <div className="flex flex-wrap gap-1.5">
                    {EMOJI_PRESETS.map((em) => (
                      <button
                        key={em}
                        type="button"
                        onClick={() => setEmoji(em)}
                        className={`w-8 h-8 rounded-xl text-sm flex items-center justify-center border transition-all cursor-pointer ${
                          emoji === em
                            ? 'bg-sky-500/25 border-sky-400 scale-110'
                            : 'glass-pill text-white hover:scale-105'
                        }`}
                      >
                        {em}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Category Kind / Balance Classification */}
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1.5">
                    Balance Classification (Oura Semantic Meaning)
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <label
                      onClick={() => setKind('rest')}
                      className={`p-3 rounded-2xl border cursor-pointer transition-all flex flex-col gap-1 ${
                        kind === 'rest'
                          ? 'bg-emerald-500/20 border-emerald-400 text-white'
                          : 'glass-card-subtle border-white/5 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span className="font-semibold text-xs text-emerald-400 flex items-center gap-1">
                        <DropBreathIcon size={14} />
                        <span>Rest & Recovery</span>
                      </span>
                      <span className="text-[10px] leading-tight">
                        Sleep, mindfulness & restorative downtime. High wellness factor.
                      </span>
                    </label>

                    <label
                      onClick={() => setKind('flexible')}
                      className={`p-3 rounded-2xl border cursor-pointer transition-all flex flex-col gap-1 ${
                        kind === 'flexible'
                          ? 'bg-sky-500/20 border-sky-400 text-white'
                          : 'glass-card-subtle border-white/5 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span className="font-semibold text-xs text-sky-400 flex items-center gap-1">
                        <FlameFocusIcon size={14} />
                        <span>Focus / Flow</span>
                      </span>
                      <span className="text-[10px] leading-tight">
                        Deep work, creative projects & discretionary time.
                      </span>
                    </label>

                    <label
                      onClick={() => setKind('fixed')}
                      className={`p-3 rounded-2xl border cursor-pointer transition-all flex flex-col gap-1 ${
                        kind === 'fixed'
                          ? 'bg-indigo-500/20 border-indigo-400 text-white'
                          : 'glass-card-subtle border-white/5 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span className="font-semibold text-xs text-indigo-400 flex items-center gap-1">
                        <MoonRestIcon size={14} />
                        <span>Fixed Baseline</span>
                      </span>
                      <span className="text-[10px] leading-tight">
                        Essential chores & baseline routines. Non-penalized baseline.
                      </span>
                    </label>
                  </div>
                </div>

                {/* Color selection */}
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1.5">Luminous Accent Color</label>
                  <div className="grid grid-cols-6 gap-2">
                    {WELLNESS_PALETTE.map((pal) => {
                      const isChosen = color.toLowerCase() === pal.color.toLowerCase();
                      return (
                        <button
                          key={pal.color}
                          type="button"
                          onClick={() => setColor(pal.color)}
                          className={`h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                            isChosen ? 'ring-2 ring-white scale-105 shadow-md' : 'hover:scale-102 opacity-80 hover:opacity-100'
                          }`}
                          style={{ backgroundColor: pal.color }}
                          title={pal.name}
                        >
                          {isChosen && <Check className="w-4 h-4 text-slate-950 drop-shadow-xs" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center justify-between pt-3 border-t border-white/10">
                  {!isCreatingNew && activeCategory ? (
                    <button
                      type="button"
                      onClick={() => handleDelete(activeCategory.id)}
                      className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 font-semibold py-1.5 px-2.5 rounded-xl hover:bg-rose-500/15 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Category</span>
                    </button>
                  ) : (
                    <div />
                  )}

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreatingNew(false);
                        setSelectedCatId(categories[0]?.id || null);
                      }}
                      className="px-4 py-2 rounded-2xl text-xs font-semibold text-slate-400 glass-pill cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-2xl text-xs font-bold glass-btn-display transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5 text-sky-300" />
                      <span>{isCreatingNew ? 'Create Category' : 'Save Changes'}</span>
                    </button>
                  </div>
                </div>
              </form>
            ) : null}

            {/* Activities within this category */}
            {!isCreatingNew && activeCategory && (
              <div className="pt-6 border-t border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Activities in {activeCategory.name} ({catActivities.length})
                  </h4>
                </div>

                {/* Add new activity input */}
                <form onSubmit={handleAddActivity} className="flex gap-2">
                  <input
                    type="text"
                    placeholder={`Add routine in ${activeCategory.name}...`}
                    value={newActivityName}
                    onChange={(e) => setNewActivityName(e.target.value)}
                    className="flex-1 text-xs py-2 px-3 rounded-xl glass-input focus:outline-none focus:border-sky-400"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-2xl glass-btn-display text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-sky-300" />
                    <span>Add</span>
                  </button>
                </form>

                {/* Activity items list */}
                <div className="space-y-1.5">
                  {catActivities.map((act) => (
                    <div
                      key={act.id}
                      className="flex items-center justify-between p-2.5 rounded-xl glass-card-subtle text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span>{activeCategory.emoji}</span>
                        <span className="font-semibold text-white dark:text-white light:text-slate-900">{act.name}</span>
                        {act.isFavorite && (
                          <Star className="w-3 h-3 text-amber-400 fill-current" />
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => onArchiveActivity(act.id)}
                        className="text-[11px] text-slate-500 hover:text-rose-400 p-1 rounded-md cursor-pointer"
                        title="Archive routine"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  {catActivities.length === 0 && (
                    <p className="text-xs text-slate-500 italic py-2">
                      No routines in this category yet. Type a name above to add one.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
