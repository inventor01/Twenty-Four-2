import React, { useState } from 'react';
import { Category, CategoryKind } from '../types';

interface CategoryEditorSheetProps {
  category?: Category | null;
  onSave: (categoryData: { name: string; emoji: string; color: string; kind: CategoryKind }) => void;
  onDelete?: (categoryId: string) => void;
  onClose: () => void;
}

const COLOR_PALETTE = [
  '#38BDF8', // Sky Blue
  '#818CF8', // Indigo
  '#34D399', // Emerald
  '#F59E0B', // Amber
  '#FB7185', // Rose
  '#A78BFA', // Purple
  '#60A5FA', // Blue
  '#F472B6', // Pink
  '#2DD4BF', // Teal
  '#94A3B8', // Slate
];

const EMOJI_PRESETS = ['💼', '😴', '🏡', '💪', '📚', '🎬', '📱', '🧺', '🎨', '🧘', '🍵', '🌱'];

export const CategoryEditorSheet: React.FC<CategoryEditorSheetProps> = ({
  category,
  onSave,
  onDelete,
  onClose,
}) => {
  const [name, setName] = useState(category?.name || '');
  const [emoji, setEmoji] = useState(category?.emoji || '✨');
  const [color, setColor] = useState(category?.color || '#38BDF8');
  const [kind, setKind] = useState<CategoryKind>(category?.kind || 'flexible');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      emoji: emoji.trim() || '✨',
      color,
      kind,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm select-none">
      <div
        className="w-full max-w-[420px] rounded-t-3xl p-5 flex flex-col gap-4 tf-sheet shadow-2xl"
        style={{
          background: 'linear-gradient(180deg, var(--tf-sheet1) 0%, var(--tf-sheet2) 100%)',
          borderTop: '1px solid rgba(var(--tf-surf-rgb), 0.15)',
          color: 'var(--tf-ink)',
        }}
      >
        <div className="w-10 h-1 rounded-full bg-white/20 mx-auto -mt-1 mb-1" />

        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-[var(--tf-ink)] tracking-tight">
            {category ? 'Edit Category' : 'New Category'}
          </h3>
          <button
            onClick={onClose}
            className="text-xs px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-[var(--tf-ink)] opacity-70 cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Emoji & Name row */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
              maxLength={2}
              className="tf-input w-12 h-11 text-center text-xl rounded-xl bg-white/5 border border-white/10 text-[var(--tf-ink)] focus:border-[var(--tf-accent-ink)]"
            />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Category Name"
              required
              className="tf-input flex-1 h-11 px-3 rounded-xl text-sm bg-white/5 border border-white/10 text-[var(--tf-ink)] focus:border-[var(--tf-accent-ink)]"
            />
          </div>

          {/* Quick emoji presets */}
          <div className="flex items-center gap-1 overflow-x-auto tf-scroll py-1">
            {EMOJI_PRESETS.map((em) => (
              <button
                type="button"
                key={em}
                onClick={() => setEmoji(em)}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-sm flex items-center justify-center flex-shrink-0 cursor-pointer"
              >
                {em}
              </button>
            ))}
          </div>

          {/* 10-Color Palette Swatches */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium opacity-70">Theme Color</span>
            <div className="grid grid-cols-5 gap-2">
              {COLOR_PALETTE.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setColor(c)}
                  className={`h-8 rounded-xl transition-all cursor-pointer flex items-center justify-center ${
                    color === c ? 'ring-2 ring-white scale-105 shadow-md' : 'opacity-70 hover:opacity-100'
                  }`}
                  style={{ background: c }}
                >
                  {color === c && <span className="text-black text-xs font-bold">✓</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Kind Selector */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium opacity-70">Category Nature</span>
            <div className="grid grid-cols-3 gap-2">
              {(['flexible', 'fixed', 'rest'] as CategoryKind[]).map((k) => (
                <button
                  type="button"
                  key={k}
                  onClick={() => setKind(k)}
                  className={`py-2 rounded-xl text-xs font-medium capitalize transition-all cursor-pointer ${
                    kind === k
                      ? 'bg-[var(--tf-accent-ink)] text-black font-bold'
                      : 'bg-white/5 border border-white/10 opacity-70 hover:opacity-100'
                  }`}
                >
                  {k}
                </button>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 mt-2">
            {category && onDelete && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`Delete category "${category.name}"?`)) {
                    onDelete(category.id);
                    onClose();
                  }
                }}
                className="py-3 px-4 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 font-semibold text-xs cursor-pointer"
              >
                Delete
              </button>
            )}
            <button
              type="submit"
              className="flex-1 py-3 rounded-2xl font-bold text-sm bg-[var(--tf-accent-ink)] text-black shadow-lg hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer text-center"
            >
              {category ? 'Save Changes' : 'Create Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
