import React, { useMemo } from 'react';
import { Activity, Category, TimeEntry } from '../types';

interface TwoTapFavoritesProps {
  activities?: Activity[];
  categories?: Category[];
  todayEntries?: TimeEntry[];
  onSelectActivity: (activity: Activity) => void;
  onStartDirectTimer?: (activity: Activity) => void;
}

export const TwoTapFavorites: React.FC<TwoTapFavoritesProps> = ({
  activities = [],
  categories = [],
  todayEntries = [],
  onSelectActivity,
  onStartDirectTimer,
}) => {
  const safeActivities = activities || [];
  const safeCategories = categories || [];
  const safeTodayEntries = todayEntries || [];

  // Favorite activities or top active ones (up to 4 for clean 2x2 grid)
  const favoriteActivities = useMemo(() => {
    const favs = safeActivities.filter((a) => a.isFavorite && !a.isArchived);
    if (favs.length >= 4) return favs.slice(0, 4);
    // Fill up to 4 with unarchived activities
    const remaining = safeActivities.filter((a) => !a.isArchived && !favs.some((f) => f.id === a.id));
    return [...favs, ...remaining].slice(0, 4);
  }, [safeActivities]);

  // Calculate today's logged time per activity
  const activityTimeMap = useMemo(() => {
    const map = new Map<string, number>();
    safeTodayEntries.forEach((e) => {
      const current = map.get(e.activityId) || 0;
      map.set(e.activityId, current + e.durationSec);
    });
    return map;
  }, [safeTodayEntries]);

  if (favoriteActivities.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 pt-1">
      {/* Eyebrow Header */}
      <div className="flex items-center justify-between pb-0.5">
        <span
          style={{
            font: "600 10px/1 'JetBrains Mono', monospace",
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'rgba(var(--tf-ink-rgb), 0.42)',
          }}
        >
          TWO TAPS
        </span>
        <span
          style={{
            font: '400 11px/1 Archivo, sans-serif',
            color: 'rgba(var(--tf-ink-rgb), 0.38)',
          }}
        >
          hold order = your favourites
        </span>
      </div>

      {/* 2-Column Grid */}
      <div className="grid grid-cols-2 gap-[9px]">
        {favoriteActivities.map((act) => {
          const cat = categories.find((c) => c.id === act.categoryId);
          const loggedSec = activityTimeMap.get(act.id) || 0;
          const h = Math.floor(loggedSec / 3600);
          const m = Math.floor((loggedSec % 3600) / 60);

          return (
            <button
              key={act.id}
              onClick={() => onSelectActivity(act)}
              className="flex items-center gap-2.5 p-[13px] rounded-[18px] text-left transition-all hover:bg-white/[0.08] active:scale-[0.98] cursor-pointer group select-none"
              style={{
                background: 'rgba(var(--tf-surf-rgb), 0.045)',
                border: '1px solid rgba(var(--tf-surf-rgb), 0.11)',
              }}
            >
              <span className="text-[17px] flex-shrink-0 leading-none">{cat?.emoji || '⏳'}</span>
              <div className="flex flex-col min-w-0 flex-1">
                <span
                  style={{
                    font: '600 13px/1.2 Archivo, sans-serif',
                    color: 'var(--tf-ink)',
                  }}
                  className="truncate"
                >
                  {act.name}
                </span>
                <span
                  style={{
                    font: "400 10px/1 'JetBrains Mono', monospace",
                    color: 'rgba(var(--tf-ink-rgb), 0.45)',
                    marginTop: '3px',
                  }}
                  className="truncate"
                >
                  {loggedSec > 0 ? `${h > 0 ? `${h}h ` : ''}${m}m today` : 'not yet today'}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
