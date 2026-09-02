import React, { useState } from 'react';
import { IntentionalityBudget, Category, TimeEntry } from '../types';
import { fmt } from '../lib/time';
import { Plus, Trash2, Edit2, Check } from 'lucide-react';
import { soundEngine } from '../lib/sound';
import { ShieldCapIcon, TargetRhythmIcon } from './OrganicIcons';

interface BudgetsViewProps {
  budgets: IntentionalityBudget[];
  categories: Category[];
  entries: TimeEntry[];
  onSaveBudget: (budget: IntentionalityBudget) => void;
  onDeleteBudget: (id: string) => void;
}

export const BudgetsView: React.FC<BudgetsViewProps> = ({
  budgets,
  categories,
  entries,
  onSaveBudget,
  onDeleteBudget,
}) => {
  const [showAdd, setShowAdd] = useState(false);
  const [editingBudget, setEditingBudget] = useState<IntentionalityBudget | null>(null);

  // Form State
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');
  const [type, setType] = useState<'min' | 'max' | 'target'>('target');
  const [targetHours, setTargetHours] = useState(2);
  const [period, setPeriod] = useState<'daily' | 'weekly'>('daily');

  const handleOpenAdd = () => {
    setEditingBudget(null);
    setCategoryId(categories[0]?.id || '');
    setType('target');
    setTargetHours(2);
    setPeriod('daily');
    setShowAdd(true);
    soundEngine.vibrate('light');
  };

  const handleEdit = (b: IntentionalityBudget) => {
    setEditingBudget(b);
    setCategoryId(b.categoryId);
    setType(b.type);
    setTargetHours(b.targetSec / 3600);
    setPeriod(b.period);
    setShowAdd(true);
    soundEngine.vibrate('light');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newBudget: IntentionalityBudget = {
      id: editingBudget ? editingBudget.id : `bgt_${Date.now()}`,
      categoryId,
      type,
      targetSec: Math.round(targetHours * 3600),
      period,
    };
    onSaveBudget(newBudget);
    setShowAdd(false);
    setEditingBudget(null);
    soundEngine.playChime('goal');
    soundEngine.vibrate('success');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white dark:text-white light:text-slate-900 font-sans tracking-tight">
            Intentionality Budgets & Targets
          </h2>
          <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600">
            Design conscious daily or weekly minimums and maximums for each facet of your life
          </p>
        </div>

        <button
          id="add-budget-btn"
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-4 py-2 rounded-2xl glass-btn-display text-xs font-bold shadow-sm transition-all cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 text-sky-300" />
          <span>New Budget Target</span>
        </button>
      </div>

      {/* Add / Edit Budget Modal/Card */}
      {showAdd && (
        <form
          onSubmit={handleSubmit}
          className="glass-card rounded-3xl p-6 sm:p-7 space-y-4 border border-sky-400/30 shadow-lg animate-fadeIn"
        >
          <h3 className="text-sm font-bold text-white dark:text-white light:text-slate-900 flex items-center gap-2">
            <TargetRhythmIcon size={16} className="text-sky-400" />
            <span>{editingBudget ? 'Edit Intentionality Budget' : 'Create Intentionality Budget'}</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-300">Category</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full text-xs px-3 py-2.5 glass-input rounded-xl focus:outline-none"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id} className="bg-slate-900 text-white">
                    {c.emoji} {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-300">Target Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full text-xs px-3 py-2.5 glass-input rounded-xl focus:outline-none"
              >
                <option value="min" className="bg-slate-900 text-white">At least (Minimum)</option>
                <option value="max" className="bg-slate-900 text-white">At most (Cap)</option>
                <option value="target" className="bg-slate-900 text-white">Exact Target</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-300">Target Hours</label>
              <input
                type="number"
                step="0.25"
                min="0.25"
                max="24"
                value={targetHours}
                onChange={(e) => setTargetHours(parseFloat(e.target.value) || 0)}
                className="w-full text-xs px-3 py-2.5 glass-input rounded-xl focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="px-4 py-2 rounded-xl glass-pill text-xs font-semibold text-slate-300 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-2xl glass-btn-display text-xs font-bold cursor-pointer"
            >
              Save Intentional Target
            </button>
          </div>
        </form>
      )}

      {/* Budgets List */}
      {budgets.length === 0 ? (
        <div className="text-center py-12 px-4 rounded-3xl glass-card border border-dashed border-white/10">
          <TargetRhythmIcon size={32} className="text-sky-400 mx-auto mb-2 opacity-80" />
          <p className="text-sm font-semibold text-white">No intentionality budgets defined yet.</p>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Set a daily target like "At least 2 hours of Deep Work" or "At least 8 hours of Rest & Sleep".
          </p>
          <button
            onClick={handleOpenAdd}
            className="mt-4 px-4 py-2 glass-btn-display text-xs font-bold rounded-2xl shadow-sm transition-all inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-sky-300" />
            <span>Create First Budget</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {budgets.map((b) => {
            const cat = categories.find((c) => c.id === b.categoryId);
            const actualSec = entries
              .filter((e) => e.categoryId === b.categoryId)
              .reduce((sum, e) => sum + e.durationSec, 0);

            const pct = Math.min(150, Math.round((actualSec / b.targetSec) * 100));
            const isMet = b.type === 'min' ? actualSec >= b.targetSec : b.type === 'max' ? actualSec <= b.targetSec : Math.abs(actualSec - b.targetSec) <= 1800;

            return (
              <div
                key={b.id}
                className="glass-card rounded-3xl p-5 space-y-3.5 relative overflow-hidden transition-all duration-300 hover:scale-101 border border-white/10"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl flex items-center justify-center w-10 h-10 rounded-2xl bg-black/20 shrink-0">
                      {cat?.emoji || '🎯'}
                    </span>
                    <div>
                      <h4 className="font-semibold text-sm text-white dark:text-white light:text-slate-900">
                        {cat?.name || 'Category'}
                      </h4>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">
                        {b.type === 'min' ? 'Minimum target' : b.type === 'max' ? 'Upper limit' : 'Target'} · {b.period}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEdit(b)}
                      className="p-1.5 text-slate-400 hover:text-white glass-pill rounded-xl transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        soundEngine.vibrate('light');
                        onDeleteBudget(b.id);
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-400 glass-pill rounded-xl transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300 font-mono font-medium">{fmt(actualSec)} logged</span>
                    <span className="text-slate-400 font-mono">Target: {fmt(b.targetSec)}</span>
                  </div>
                  <div className="w-full h-2.5 bg-black/30 rounded-full overflow-hidden border border-white/10">
                    <div
                      style={{
                        width: `${Math.min(100, pct)}%`,
                        backgroundColor: cat?.color || '#38BDF8',
                      }}
                      className="h-full rounded-full transition-all duration-500"
                    />
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-slate-400">
                    <span>{pct}% of target</span>
                    <span className={`font-semibold ${isMet ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {isMet ? 'Aligned' : 'In Progress'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
