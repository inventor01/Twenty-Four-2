import React, { useState } from 'react';
import { Activity, Category, CategoryKind } from '../types';
import { Plus, Star } from 'lucide-react';
import { soundEngine } from '../lib/sound';
import { LayersBalanceIcon, DropBreathIcon, FlameFocusIcon, MoonRestIcon } from './OrganicIcons';

interface ActivityGridProps {
  activities: Activity[];
  categories: Category[];
  activeActivityId: string | null;
  onSelectActivity: (activityId: string) => void;
  onToggleFavorite: (activityId: string) => void;
  onOpenAddActivity: () => void;
  onOpenCategoryEditor: () => void;
}

export const ActivityGrid: React.FC<ActivityGridProps> = ({
  activities,
  categories,
  activeActivityId,
  onSelectActivity,
  onToggleFavorite,
  onOpenAddActivity,
  onOpenCategoryEditor,
}) => {
  const [selectedKind, setSelectedKind] = useState<CategoryKind | 'all'>('all');
  const categoryMap = new Map<string, Category>(categories.map((c) => [c.id, c]));

  // Filter activities based on selected category kind
  const filteredActivities = activities.filter((act) => {
    if (selectedKind === 'all') return true;
    const cat = categoryMap.get(act.categoryId);
    return cat?.kind === selectedKind;
  });

  const favorites = filteredActivities.filter((a) => a.isFavorite);
  const others = filteredActivities.filter((a) => !a.isFavorite);

  const handleStart = (actId: string) => {
    soundEngine.playChime('start');
    soundEngine.vibrate('light');
    onSelectActivity(actId);
  };

  return (
    <div className="glass-card rounded-3xl p-6 sm:p-7 space-y-5">
      {/* Header & Filter pills */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-[11px] font-bold tracking-widest text-slate-400 dark:text-slate-400 light:text-slate-500 uppercase flex items-center gap-1.5">
            <LayersBalanceIcon size={14} className="text-sky-400" />
            <span>CHOOSE OR START AN ACTIVITY</span>
          </h3>
          <p className="text-xs text-slate-300 dark:text-slate-300 light:text-slate-600 mt-0.5">
            Two taps to launch. Every minute is accounted for in your 24 hours.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenCategoryEditor}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl glass-pill text-xs font-semibold text-slate-200 dark:text-slate-200 light:text-slate-800 hover:bg-white/10 transition-colors cursor-pointer"
            title="Add or edit categories"
          >
            <LayersBalanceIcon size={13} className="text-sky-400" />
            <span>Categories</span>
          </button>

          <button
            id="create-new-activity-btn"
            onClick={onOpenAddActivity}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl glass-btn-display text-xs font-bold cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-sky-300" />
            <span>New Activity</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs by Kind */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => {
            setSelectedKind('all');
            soundEngine.vibrate('light');
          }}
          className={`px-3.5 py-1.5 rounded-2xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
            selectedKind === 'all'
              ? 'glass-btn-active font-bold shadow-xs'
              : 'glass-pill text-slate-400 dark:text-slate-400 light:text-slate-600 hover:text-white'
          }`}
        >
          All Routines
        </button>
        <button
          type="button"
          onClick={() => {
            setSelectedKind('rest');
            soundEngine.vibrate('light');
          }}
          className={`px-3.5 py-1.5 rounded-2xl text-xs font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
            selectedKind === 'rest'
              ? 'glass-btn-active font-bold shadow-xs'
              : 'glass-pill text-slate-400 dark:text-slate-400 light:text-slate-600 hover:text-white'
          }`}
        >
          <DropBreathIcon size={13} color={selectedKind === 'rest' ? '#38BDF8' : '#64748B'} />
          <span>Rest & Recovery</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setSelectedKind('flexible');
            soundEngine.vibrate('light');
          }}
          className={`px-3.5 py-1.5 rounded-2xl text-xs font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
            selectedKind === 'flexible'
              ? 'glass-btn-active font-bold shadow-xs'
              : 'glass-pill text-slate-400 dark:text-slate-400 light:text-slate-600 hover:text-white'
          }`}
        >
          <FlameFocusIcon size={13} color={selectedKind === 'flexible' ? '#38BDF8' : '#64748B'} />
          <span>Focus & Work</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setSelectedKind('fixed');
            soundEngine.vibrate('light');
          }}
          className={`px-3.5 py-1.5 rounded-2xl text-xs font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
            selectedKind === 'fixed'
              ? 'glass-btn-active font-bold shadow-xs'
              : 'glass-pill text-slate-400 dark:text-slate-400 light:text-slate-600 hover:text-white'
          }`}
        >
          <MoonRestIcon size={13} color={selectedKind === 'fixed' ? '#38BDF8' : '#64748B'} />
          <span>Fixed Baseline</span>
        </button>
      </div>

      {/* Favorite quick-start chips */}
      {favorites.length > 0 && (
        <div className="space-y-2.5">
          <div className="text-[10px] font-bold text-slate-400 dark:text-slate-400 light:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Star className="w-3.5 h-3.5 text-amber-400 fill-current" />
            <span>Favorites & Essentials</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
            {favorites.map((act) => {
              const cat = categoryMap.get(act.categoryId);
              const isActive = activeActivityId === act.id;
              const accent = cat?.color || '#38BDF8';

              return (
                <div
                  key={act.id}
                  className={`group relative flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer ${
                    isActive
                      ? 'glass-btn-active scale-102 shadow-md'
                      : 'glass-card-subtle hover:scale-102 hover:border-white/20'
                  }`}
                  onClick={() => handleStart(act.id)}
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-1">
                    <span className="text-xl flex items-center justify-center w-8 h-8 rounded-xl bg-black/20 dark:bg-black/40 light:bg-black/5 shrink-0">
                      {cat?.emoji || '⏱️'}
                    </span>
                    <div className="min-w-0">
                      <div className="font-semibold text-xs text-white dark:text-white light:text-slate-900 truncate">
                        {act.name}
                      </div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-400 light:text-slate-500 truncate flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: accent }} />
                        <span>{cat?.name || 'General'}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      soundEngine.vibrate('light');
                      onToggleFavorite(act.id);
                    }}
                    className="text-amber-400 hover:scale-110 transition-transform p-1 shrink-0"
                    title="Toggle Favorite"
                  >
                    <Star className="w-3.5 h-3.5 fill-current" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* All activities list */}
      <div className="space-y-2.5">
        <div className="text-[10px] font-bold text-slate-400 dark:text-slate-400 light:text-slate-500 uppercase tracking-wider">
          {favorites.length > 0 ? 'More Activities' : 'Activities'}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
          {others.map((act) => {
            const cat = categoryMap.get(act.categoryId);
            const isActive = activeActivityId === act.id;
            const accent = cat?.color || '#38BDF8';

            return (
              <div
                key={act.id}
                className={`group relative flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer ${
                  isActive
                    ? 'glass-btn-active scale-102 shadow-md'
                    : 'glass-card-subtle hover:scale-102 hover:border-white/20'
                }`}
                onClick={() => handleStart(act.id)}
              >
                <div className="flex items-center gap-2.5 min-w-0 pr-1">
                  <span className="text-xl flex items-center justify-center w-8 h-8 rounded-xl bg-black/20 dark:bg-black/40 light:bg-black/5 shrink-0">
                    {cat?.emoji || '⏱️'}
                  </span>
                  <div className="min-w-0">
                    <div className="font-semibold text-xs text-white dark:text-white light:text-slate-900 truncate">
                      {act.name}
                    </div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-400 light:text-slate-500 truncate flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: accent }} />
                      <span>{cat?.name || 'General'}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    soundEngine.vibrate('light');
                    onToggleFavorite(act.id);
                  }}
                  className="text-slate-600 group-hover:text-amber-400 hover:scale-110 transition-all p-1 shrink-0"
                  title="Add to favorites"
                >
                  <Star className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
