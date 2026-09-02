import React, { useMemo } from 'react';
import { TimeEntry, Category, DailyReflection } from '../types';
import { shiftDateKey, localDateKey, DEFAULT_TIME_ZONE } from '../lib/time';

interface InsightsScreenProps {
  entries?: TimeEntry[];
  allEntries?: TimeEntry[];
  categories?: Category[];
  reflections?: DailyReflection[];
  timeZone?: string;
}

export const InsightsScreen: React.FC<InsightsScreenProps> = ({
  entries = [],
  allEntries = [],
  categories = [],
  reflections = [],
  timeZone = DEFAULT_TIME_ZONE,
}) => {
  const safeAllEntries = allEntries || [];
  const safeEntries = entries || [];
  const safeCategories = categories || [];
  const safeReflections = reflections || [];

  // Aggregate statistics over the past 7 days
  const todayKey = localDateKey(Date.now(), timeZone);

  // Group entries into 7 days
  const last7Days = useMemo(() => {
    const days: { dateKey: string; label: string; shortDate: string; entries: TimeEntry[]; totalSec: number }[] = [];
    const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

    for (let i = 6; i >= 0; i--) {
      const k = shiftDateKey(todayKey, -i);
      const d = new Date(k + 'T12:00:00');
      const dayLabel = dayNames[d.getDay()];
      const dayEntries = safeAllEntries.filter((e) => e.localDate === k);
      const totalSec = dayEntries.reduce((sum, e) => sum + e.durationSec, 0);
      days.push({
        dateKey: k,
        label: dayLabel,
        shortDate: `${d.getDate()} ${d.toLocaleString('default', { month: 'short' })}`,
        entries: dayEntries,
        totalSec,
      });
    }
    return days;
  }, [safeAllEntries, todayKey]);

  // Overall 7-day category breakdown
  const weekCategoryStats = useMemo(() => {
    const past7Entries = safeAllEntries.filter((e) => {
      const diff = Math.floor((new Date(todayKey).getTime() - new Date(e.localDate).getTime()) / (86400 * 1000));
      return diff >= 0 && diff < 7;
    });

    const map = new Map<string, { category: Category; totalSec: number }>();
    let grandTotalSec = 0;
    let mattersTotalSec = 0;

    past7Entries.forEach((entry) => {
      grandTotalSec += entry.durationSec;
      const cat = safeCategories.find((c) => c.name === entry.categoryName) || {
        id: 'other',
        name: entry.categoryName,
        emoji: entry.emoji || '✨',
        color: entry.categoryColor || '#818CF8',
        kind: entry.categoryKind || 'flexible',
      };

      // "Time that matters" includes rest, deep work, family, health
      const nameLower = cat.name.toLowerCase();
      if (
        cat.kind === 'rest' ||
        nameLower.includes('focus') ||
        nameLower.includes('work') ||
        nameLower.includes('family') ||
        nameLower.includes('health') ||
        nameLower.includes('exercise') ||
        nameLower.includes('read')
      ) {
        mattersTotalSec += entry.durationSec;
      }

      const prev = map.get(cat.id) || { category: cat, totalSec: 0 };
      prev.totalSec += entry.durationSec;
      map.set(cat.id, prev);
    });

    const list = Array.from(map.values()).sort((a, b) => b.totalSec - a.totalSec);
    const pctMatters = grandTotalSec > 0 ? Math.round((mattersTotalSec / grandTotalSec) * 100) : 68;

    return { list, grandTotalSec, pctMatters, mattersTotalSec };
  }, [safeAllEntries, safeCategories, todayKey]);

  // Total distinct logged days
  const loggedDayCount = useMemo(() => {
    const set = new Set(safeAllEntries.map((e) => e.localDate));
    return set.size;
  }, [safeAllEntries]);

  // Latest reflection
  const latestReflection = useMemo(() => {
    if (safeReflections.length === 0) return null;
    return [...safeReflections].sort((a, b) => (b.closedAtMs || 0) - (a.closedAtMs || 0))[0];
  }, [safeReflections]);

  const maxDaySec = Math.max(1, ...last7Days.map((d) => d.totalSec), 18 * 3600);

  return (
    <div className="flex flex-col gap-5 pb-8 tf-rise select-none">
      {/* Header */}
      <div className="flex items-center justify-between pt-0.5">
        <div className="flex flex-col">
          <span
            style={{
              font: "600 10.5px/1 'JetBrains Mono', monospace",
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: 'var(--tf-accent-ink)',
            }}
          >
            THIS WEEK
          </span>
          <h2
            style={{
              font: '700 24px/1.1 Archivo, sans-serif',
              letterSpacing: '-0.02em',
              color: 'var(--tf-ink)',
              marginTop: '3px',
            }}
          >
            Insights & Rhythm
          </h2>
        </div>

        <span
          className="px-2.5 py-1 rounded-full text-[11px] font-mono select-none"
          style={{
            background: 'rgba(var(--tf-surf-rgb), 0.05)',
            border: '1px solid rgba(var(--tf-surf-rgb), 0.11)',
            color: 'rgba(var(--tf-ink-rgb), 0.65)',
          }}
        >
          {timeZone.split('/')[1]?.replace('_', ' ') || timeZone}
        </span>
      </div>

      {loggedDayCount < 1 && allEntries.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center p-8 rounded-[28px] border border-dashed text-center gap-3"
          style={{
            background: 'radial-gradient(120% 120% at 50% 10%, #102636 0%, #0c1c28 45%, #08131d 100%)',
            borderColor: 'rgba(56, 189, 248, 0.20)',
          }}
        >
          <span className="text-3xl opacity-80">◫</span>
          <h4
            style={{
              font: '700 18px Archivo, sans-serif',
              color: '#FFFFFF',
            }}
          >
            Gathering Weekly Rhythms
          </h4>
          <p
            className="italic max-w-[280px] leading-relaxed"
            style={{
              fontFamily: "'Instrument Serif', Georgia, serif",
              fontSize: '16px',
              color: 'rgba(226, 241, 255, 0.75)',
            }}
          >
            Insights arrive after a few blocks of mindful logging. Keep logging today to build your weekly balance portrait.
          </p>
        </div>
      ) : (
        <>
          {/* Hero Intentional Balance Card */}
          <div
            className="relative w-full rounded-[28px] overflow-hidden p-5 sm:p-6 select-none shadow-2xl flex flex-col sm:flex-row items-center gap-5 sm:gap-6"
            style={{
              background: 'radial-gradient(120% 120% at 50% 10%, #102636 0%, #0c1c28 45%, #08131d 100%)',
              border: '1px solid rgba(56, 189, 248, 0.16)',
              boxShadow: '0 16px 40px -10px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
            }}
          >
            {/* 96px Donut Ring */}
            <div
              className="relative w-[96px] h-[96px] rounded-full flex items-center justify-center flex-shrink-0"
              style={{
                background: `conic-gradient(#2DD4BF 0% ${weekCategoryStats.pctMatters}%, rgba(255, 255, 255, 0.08) ${weekCategoryStats.pctMatters}% 100%)`,
                boxShadow: '0 0 24px rgba(45, 212, 191, 0.35)',
              }}
            >
              <div
                className="w-[72px] h-[72px] rounded-full flex flex-col items-center justify-center text-center p-1"
                style={{
                  background: '#091620',
                  boxShadow: 'inset 0 2px 6px rgba(0, 0, 0, 0.6)',
                }}
              >
                <span
                  style={{
                    font: "700 17px/1 'JetBrains Mono', monospace",
                    color: '#2DD4BF',
                  }}
                >
                  {weekCategoryStats.pctMatters}%
                </span>
                <span
                  style={{
                    font: "600 7.5px/1 'JetBrains Mono', monospace",
                    letterSpacing: '0.16em',
                    color: 'rgba(226, 241, 255, 0.50)',
                    marginTop: '3px',
                  }}
                >
                  MATTERS
                </span>
              </div>
            </div>

            {/* Description Text */}
            <div className="flex flex-col text-center sm:text-left min-w-0">
              <span
                style={{
                  font: "600 10.5px/1 'JetBrains Mono', monospace",
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: 'rgba(226, 241, 255, 0.55)',
                }}
              >
                INTENTIONAL BALANCE
              </span>
              <h3
                style={{
                  font: '700 19px/1.2 Archivo, sans-serif',
                  color: '#FFFFFF',
                  marginTop: '4px',
                }}
              >
                {weekCategoryStats.pctMatters >= 60
                  ? 'Substantial Focus & Rest'
                  : 'Rhythm in Emergence'}
              </h3>
              <p
                className="italic leading-relaxed mt-1"
                style={{
                  fontFamily: "'Instrument Serif', Georgia, serif",
                  fontSize: '15.5px',
                  color: 'rgba(226, 241, 255, 0.72)',
                }}
              >
                {weekCategoryStats.pctMatters >= 60
                  ? 'Over half of your hours were dedicated to what you consciously chose.'
                  : 'Rhythms are taking form. Protect unhurried rest and deep focus blocks.'}
              </p>
            </div>
          </div>

          {/* Seven Days Multi-Segment Bar Chart */}
          <div
            className="flex flex-col gap-3.5 p-4 sm:p-5 rounded-[24px]"
            style={{
              background: 'rgba(var(--tf-surf-rgb), 0.04)',
              border: '1px solid rgba(var(--tf-surf-rgb), 0.10)',
            }}
          >
            <div className="flex items-center justify-between">
              <span
                style={{
                  font: "600 10px/1 'JetBrains Mono', monospace",
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  color: 'rgba(var(--tf-ink-rgb), 0.45)',
                }}
              >
                SEVEN DAYS
              </span>
              <span
                style={{
                  font: "400 11px/1 'JetBrains Mono', monospace",
                  color: 'rgba(var(--tf-ink-rgb), 0.45)',
                }}
              >
                daily logged volume
              </span>
            </div>

            <div className="flex items-end justify-between h-[120px] pt-4 px-1 gap-2">
              {last7Days.map((day) => {
                const isToday = day.dateKey === todayKey;
                const hours = (day.totalSec / 3600).toFixed(1);
                const fillPct = Math.min(100, Math.max(8, Math.round((day.totalSec / maxDaySec) * 100)));

                return (
                  <div key={day.dateKey} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                    <span
                      className="text-[9.5px] font-mono opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap"
                      style={{ color: 'var(--tf-accent-ink)' }}
                    >
                      {hours}h
                    </span>
                    <div
                      className="w-full rounded-t-lg relative flex items-end overflow-hidden h-[75px]"
                      style={{
                        background: 'rgba(var(--tf-surf-rgb), 0.06)',
                      }}
                    >
                      <div
                        className="w-full rounded-t-lg transition-all duration-700"
                        style={{
                          height: `${day.totalSec > 0 ? fillPct : 0}%`,
                          background: isToday
                            ? 'linear-gradient(to top, #0ea5e9, #2dd4bf)'
                            : 'linear-gradient(to top, rgba(var(--tf-surf-rgb), 0.2), rgba(var(--tf-surf-rgb), 0.4))',
                          boxShadow: isToday ? '0 0 10px rgba(45, 212, 191, 0.4)' : 'none',
                        }}
                      />
                    </div>
                    <span
                      style={{
                        font: "600 10.5px/1 'JetBrains Mono', monospace",
                        color: isToday ? 'var(--tf-accent-ink)' : 'rgba(var(--tf-ink-rgb), 0.45)',
                      }}
                    >
                      {day.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Where the week went - Category Progress Bars */}
          <div
            className="flex flex-col gap-3.5 p-4 sm:p-5 rounded-[24px]"
            style={{
              background: 'rgba(var(--tf-surf-rgb), 0.04)',
              border: '1px solid rgba(var(--tf-surf-rgb), 0.10)',
            }}
          >
            <div className="flex items-center justify-between">
              <span
                style={{
                  font: "600 10px/1 'JetBrains Mono', monospace",
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  color: 'rgba(var(--tf-ink-rgb), 0.45)',
                }}
              >
                WHERE THE WEEK WENT
              </span>
              <span
                style={{
                  font: "500 11px/1 'JetBrains Mono', monospace",
                  color: 'rgba(var(--tf-ink-rgb), 0.50)',
                }}
              >
                {Math.floor(weekCategoryStats.grandTotalSec / 3600)}h {(Math.floor(weekCategoryStats.grandTotalSec % 3600) / 60).toFixed(0)}m total
              </span>
            </div>

            <div className="flex flex-col gap-3 mt-1">
              {weekCategoryStats.list.slice(0, 6).map(({ category, totalSec }) => {
                const pct =
                  weekCategoryStats.grandTotalSec > 0
                    ? Math.round((totalSec / weekCategoryStats.grandTotalSec) * 100)
                    : 0;
                const h = Math.floor(totalSec / 3600);
                const m = Math.floor((totalSec % 3600) / 60);

                return (
                  <div key={category.id} className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{
                            background: category.color,
                            boxShadow: `0 0 6px ${category.color}`,
                          }}
                        />
                        <span
                          style={{
                            font: '600 13px/1.2 Archivo, sans-serif',
                            color: 'var(--tf-ink)',
                          }}
                          className="truncate max-w-[150px]"
                        >
                          {category.name}
                        </span>
                      </div>
                      <span
                        style={{
                          font: "500 11px/1 'JetBrains Mono', monospace",
                          color: 'rgba(var(--tf-ink-rgb), 0.65)',
                        }}
                      >
                        {h > 0 ? `${h}h ` : ''}{m}m <span style={{ color: 'rgba(var(--tf-ink-rgb), 0.35)' }}>({pct}%)</span>
                      </span>
                    </div>

                    <div
                      className="w-full h-[6px] rounded-full overflow-hidden"
                      style={{ background: 'rgba(var(--tf-surf-rgb), 0.08)' }}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${pct}%`,
                          background: category.color,
                          boxShadow: `0 0 8px ${category.color}88`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Latest Evening Reflection Card */}
          {latestReflection && (
            <div
              className="flex flex-col gap-2.5 p-4 sm:p-5 rounded-[24px]"
              style={{
                background: 'rgba(var(--tf-surf-rgb), 0.04)',
                border: '1px solid rgba(var(--tf-surf-rgb), 0.10)',
              }}
            >
              <div className="flex items-center justify-between">
                <span
                  style={{
                    font: "600 10px/1 'JetBrains Mono', monospace",
                    letterSpacing: '0.16em',
                    textTransform: 'uppercase',
                    color: 'rgba(var(--tf-ink-rgb), 0.45)',
                  }}
                >
                  EVENING REFLECTION
                </span>
                {/* 5 Mood glow dots */}
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <span
                      key={i}
                      className="w-1.5 h-1.5 rounded-full transition-all"
                      style={{
                        background:
                          i <= (latestReflection.moodRating || 4)
                            ? 'var(--tf-accent-ink)'
                            : 'rgba(var(--tf-surf-rgb), 0.15)',
                        boxShadow:
                          i <= (latestReflection.moodRating || 4)
                            ? '0 0 6px var(--tf-accent-ink)'
                            : 'none',
                      }}
                    />
                  ))}
                </div>
              </div>

              <p
                className="italic leading-relaxed mt-0.5"
                style={{
                  fontFamily: "'Instrument Serif', Georgia, serif",
                  fontSize: '16px',
                  color: 'rgba(var(--tf-ink-rgb), 0.78)',
                }}
              >
                "{latestReflection.answer}"
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

