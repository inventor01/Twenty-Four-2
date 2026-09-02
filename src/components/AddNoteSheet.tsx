import React, { useState } from 'react';
import { TimeEntry } from '../types';

interface AddNoteSheetProps {
  entry: TimeEntry;
  onSaveNote: (entryId: string, noteText: string) => void;
  onClose: () => void;
}

export const AddNoteSheet: React.FC<AddNoteSheetProps> = ({
  entry,
  onSaveNote,
  onClose,
}) => {
  const [text, setText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSaveNote(entry.id, text.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/60 backdrop-blur-sm select-none">
      <div
        className="w-full max-w-[420px] rounded-t-3xl p-5 flex flex-col gap-4 tf-sheet shadow-2xl"
        style={{
          background: 'linear-gradient(180deg, var(--tf-sheet1) 0%, var(--tf-sheet2) 100%)',
          borderTop: '1px solid rgba(var(--tf-surf-rgb), 0.15)',
          color: 'var(--tf-ink)',
        }}
      >
        <div className="w-10 h-1 rounded-full bg-[rgba(var(--tf-surf-rgb),0.2)] mx-auto -mt-1 mb-1" />

        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10.5px] uppercase font-mono text-[var(--tf-ink)] opacity-40">
              Add Note
            </span>
            <h3 className="text-sm font-semibold text-[var(--tf-ink)] truncate max-w-[260px]">
              {entry.activityName}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-xs px-2.5 py-1 rounded-full bg-[rgba(var(--tf-surf-rgb),0.1)] hover:bg-[rgba(var(--tf-surf-rgb),0.2)] text-[var(--tf-ink)] opacity-70 cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <textarea
            rows={3}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Record what was notable, insightful, or memorable..."
            required
            autoFocus
            className="tf-input w-full p-3 rounded-xl text-xs bg-[rgba(var(--tf-surf-rgb),0.05)] border border-[rgba(var(--tf-surf-rgb),0.1)] text-[var(--tf-ink)] focus:border-[var(--tf-accent-ink)] resize-none"
          />

          <button
            type="submit"
            className="w-full py-3 rounded-2xl font-bold text-sm bg-[var(--tf-accent-ink)] text-[var(--tf-on-accent)] shadow-lg hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer text-center"
          >
            Save Note to Ledger
          </button>
        </form>
      </div>
    </div>
  );
};
