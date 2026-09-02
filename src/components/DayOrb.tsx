import React, { useState, useMemo } from 'react';
import { TimeEntry, Category } from '../types';

interface DayOrbProps {
  entries?: TimeEntry[];
  categories?: Category[];
  runningTimer?: any;
  hourFormat?: 12 | 24;
  activeDateKey?: string;
  todayDateKey?: string;
  timeZone?: string;
  onOpenLogSheet?: () => void;
  onSelectCategory?: (category: Category | null) => void;
}

export const DayOrb: React.FC<DayOrbProps> = ({
  entries = [],
  categories = [],
  runningTimer,
  hourFormat = 12,
  activeDateKey,
  todayDateKey,
  timeZone,
  onOpenLogSheet,
  onSelectCategory,
}) => {
  const safeEntries = entries || [];
  const safeCategories = categories || [];
  const [inspectedIndex, setInspectedIndex] = useState<number>(-1);

  // Group today's entries by category
  const categoryTotals = useMemo(() => {
    const map = new Map<string, { category: Category; totalSec: number }>();
    safeEntries.forEach((entry) => {
      const cat = safeCategories.find((c) => c.name === entry.categoryName) || {
        id: 'other',
        name: entry.categoryName,
        emoji: entry.emoji || '✨',
        color: entry.categoryColor || '#818CF8',
        kind: entry.categoryKind || 'flexible',
      };
      const prev = map.get(cat.id) || { category: cat, totalSec: 0 };
      prev.totalSec += entry.durationSec;
      map.set(cat.id, prev);
    });
    return Array.from(map.values()).sort((a, b) => b.totalSec - a.totalSec);
  }, [safeEntries, safeCategories]);

  const totalAccountedSec = useMemo(() => {
    return safeEntries.reduce((acc, e) => acc + e.durationSec, 0);
  }, [safeEntries]);

  const totalMinutes = Math.floor(totalAccountedSec / 60);
  const totalHours = Math.floor(totalMinutes / 60);
  const remMinutes = totalMinutes % 60;

  // Current minutes of day for unaccounted calculation
  const nowMinutes = useMemo(() => {
    const d = new Date();
    try {
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: timeZone || undefined,
        hour: 'numeric',
        minute: 'numeric',
        hour12: false,
      }).formatToParts(d);
      const h = parseInt(parts.find((p) => p.type === 'hour')?.value || '0', 10);
      const m = parseInt(parts.find((p) => p.type === 'minute')?.value || '0', 10);
      return (h % 24) * 60 + m;
    } catch {
      return d.getHours() * 60 + d.getMinutes();
    }
  }, [timeZone]);

  const unaccountedMinutes = Math.max(0, nowMinutes - totalMinutes);
  const unaccHours = Math.floor(unaccountedMinutes / 60);
  const unaccRemMins = unaccountedMinutes % 60;
  const unaccountedLabel = unaccHours > 0
    ? `${unaccHours}h ${unaccRemMins}m`
    : `${unaccRemMins}m`;

  // Time that matters (flexible & creative & high substance)
  const prioritySec = useMemo(() => {
    const priorityCategories = ['Deep Focus & Flow', 'Presence & Loved Ones', 'Movement & Vitality', 'Reading & Wisdom'];
    return safeEntries
      .filter((e) => priorityCategories.includes(e.categoryName) || e.categoryKind === 'flexible')
      .reduce((acc, e) => acc + e.durationSec, 0);
  }, [safeEntries]);

  const mattersPct = totalAccountedSec > 0
    ? Math.min(100, Math.round((prioritySec / totalAccountedSec) * 100))
    : 0;

  // Calculate conic gradient slices across the 24-hour day (00:00 to 24:00)
  const conicGradient = useMemo(() => {
    if (safeEntries.length === 0) {
      return 'conic-gradient(from -90deg, rgba(var(--tf-surf-rgb), 0.08) 0deg, rgba(var(--tf-surf-rgb), 0.08) 360deg)';
    }

    const sorted = [...safeEntries].sort((a, b) => a.startedAtMs - b.startedAtMs);
    const slices: string[] = [];

    const getMinFromMidnight = (ms: number): number => {
      try {
        const d = new Date(ms);
        const parts = new Intl.DateTimeFormat('en-US', {
          timeZone: timeZone || undefined,
          hour: 'numeric',
          minute: 'numeric',
          hour12: false,
        }).formatToParts(d);
        const hour = parseInt(parts.find((p) => p.type === 'hour')?.value || '0', 10);
        const minute = parseInt(parts.find((p) => p.type === 'minute')?.value || '0', 10);
        return (hour % 24) * 60 + minute;
      } catch {
        const d = new Date(ms);
        return d.getHours() * 60 + d.getMinutes();
      }
    };

    let lastDeg = 0;
    const isFiltered = inspectedIndex >= 0 && inspectedIndex < categoryTotals.length;
    const activeCatId = isFiltered ? categoryTotals[inspectedIndex].category.id : null;

    sorted.forEach((e) => {
      const startMin = getMinFromMidnight(e.startedAtMs);
      const durMin = Math.max(1, Math.round(e.durationSec / 60));
      const startDeg = (startMin / 1440) * 360;
      const endDeg = Math.min(360, startDeg + (durMin / 1440) * 360);

      if (startDeg > lastDeg) {
        slices.push(`rgba(var(--tf-surf-rgb), 0.07) ${lastDeg.toFixed(1)}deg ${startDeg.toFixed(1)}deg`);
      }

      const cat = safeCategories.find((c) => c.name === e.categoryName);
      const isMatch = !activeCatId || (cat && cat.id === activeCatId);
      const color = isMatch ? (e.categoryColor || '#818CF8') : 'rgba(var(--tf-surf-rgb), 0.12)';

      slices.push(`${color} ${startDeg.toFixed(1)}deg ${endDeg.toFixed(1)}deg`);
      lastDeg = Math.max(lastDeg, endDeg);
    });

    if (lastDeg < 360) {
      slices.push(`rgba(var(--tf-surf-rgb), 0.07) ${lastDeg.toFixed(1)}deg 360deg`);
    }

    return `conic-gradient(from -90deg, ${slices.join(', ')})`;
  }, [safeEntries, safeCategories, inspectedIndex, categoryTotals, timeZone]);

  // Current time pointer angle
  const nowDeg = useMemo(() => {
    return (nowMinutes / 1440) * 360;
  }, [nowMinutes]);

  const activeCategoryItem = inspectedIndex >= 0 && inspectedIndex < categoryTotals.length
    ? categoryTotals[inspectedIndex]
    : null;

  const handleOrbClick = () => {
    if (categoryTotals.length === 0) return;
    const nextIdx = (inspectedIndex + 1) % (categoryTotals.length + 1);
    const newIdx = nextIdx === categoryTotals.length ? -1 : nextIdx;
    setInspectedIndex(newIdx);
    if (onSelectCategory) {
      onSelectCategory(newIdx >= 0 ? categoryTotals[newIdx].category : null);
    }
  };

  // Poetic text below ring
  const poeticSentence = useMemo(() => {
    if (entries.length === 0) {
      return '“An empty ring is still a whole day.”';
    }
    if (activeCategoryItem) {
      const h = Math.floor(activeCategoryItem.totalSec / 3600);
      const m = Math.floor((activeCategoryItem.totalSec % 3600) / 60);
      const pct = Math.round((activeCategoryItem.totalSec / totalAccountedSec) * 100);
      return `“${activeCategoryItem.category.name} took ${h}h ${m}m — that is ${pct}% of everything you logged.”`;
    }
    const topCat = categoryTotals[0];
    if (topCat) {
      const h = Math.floor(topCat.totalSec / 3600);
      const m = Math.floor((topCat.totalSec % 3600) / 60);
      return `“The biggest colour today is ${topCat.category.name}, at ${h}h ${m}m. Tap the ring to walk through the rest.”`;
    }
    return '“A day cannot be stretched, only lived with calm intentionality.”';
  }, [entries.length, activeCategoryItem, categoryTotals, totalAccountedSec]);

  const activeGlowColor = activeCategoryItem?.category.color || (categoryTotals[0]?.category.color ?? '#38BDF8');

  return (
    <div
      className="relative p-5 rounded-[26px] overflow-hidden flex flex-col gap-1 transition-all"
      style={{
        background: 'linear-gradient(150deg, rgba(var(--tf-surf-rgb), 0.10), rgba(var(--tf-surf-rgb), 0.035))',
        border: '1px solid rgba(var(--tf-surf-rgb), 0.14)',
        boxShadow: '0 26px 54px -30px rgba(var(--tf-shadow-rgb), 0.95), inset 0 1px rgba(var(--tf-surf-rgb), 0.16)',
      }}
    >
      {/* Accounted Today Header */}
      <span
        style={{
          font: "600 10px/1 'JetBrains Mono', monospace",
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'rgba(var(--tf-ink-rgb), 0.45)',
        }}
      >
        Accounted today
      </span>

      {/* Big Numbers */}
      <div className="flex items-baseline gap-2 mt-1">
        <span
          style={{
            font: '800 56px/0.9 Archivo, sans-serif',
            letterSpacing: '-0.045em',
            color: 'var(--tf-ink)',
          }}
        >
          {totalHours}h
        </span>
        {remMinutes > 0 && (
          <span
            style={{
              font: '600 22px/1 Archivo, sans-serif',
              color: 'rgba(var(--tf-ink-rgb), 0.55)',
            }}
          >
            {remMinutes}m
          </span>
        )}
      </div>

      {/* Subtitle stats */}
      <div className="flex items-center gap-3 mt-2 text-[13px]">
        <span style={{ color: 'rgba(var(--tf-ink-rgb), 0.6)', fontWeight: 500 }}>
          {unaccountedLabel} unaccounted
        </span>
        <span className="w-[1px] h-[14px]" style={{ background: 'rgba(var(--tf-surf-rgb), 0.16)' }} />
        <span style={{ color: 'var(--tf-accent-ink)', fontWeight: 600 }}>
          {mattersPct}% time that matters
        </span>
      </div>

      {/* 250px Living Day Orb Ring */}
      <div
        onClick={handleOrbClick}
        className="relative my-4 h-[280px] flex items-center justify-center cursor-pointer select-none"
      >
        {/* Breathing aura behind */}
        <div
          className="tf-breathe absolute w-[240px] h-[240px] rounded-full pointer-events-none"
          style={{
            background: `radial-gradient(circle, ${activeGlowColor}3a, transparent 66%)`,
            filter: 'blur(28px)',
          }}
        />

        {/* The 250px Conic Ring Container */}
        <div className="relative w-[250px] h-[250px] flex items-center justify-center">
          {/* Ambient rotation glow */}
          <div
            className="tf-orb-spin absolute inset-[-6px] rounded-full pointer-events-none"
            style={{
              background: 'conic-gradient(from 0deg, transparent 0 62%, rgba(var(--tf-surf-rgb), 0.16) 78%, transparent 92%)',
              filter: 'blur(6px)',
            }}
          />

          {/* Masked Conic Gradient Ring */}
          <div
            className="absolute inset-0 rounded-full transition-all duration-300"
            style={{
              background: conicGradient,
              mask: 'radial-gradient(farthest-side, transparent calc(100% - 34px), #000 calc(100% - 33px))',
              WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 34px), #000 calc(100% - 33px))',
              filter: 'saturate(1.15)',
            }}
          />

          {/* Inner radial gradient aura */}
          <div
            className="absolute inset-[42px] rounded-full"
            style={{
              background: `radial-gradient(circle at 42% 34%, ${activeGlowColor}2e, transparent 68%), radial-gradient(circle at 68% 74%, #38BDF824, transparent 66%)`,
              boxShadow: 'inset 0 1px 0 rgba(var(--tf-surf-rgb), 0.10)',
            }}
          />

          {/* Live "Now" rotating clock hand */}
          <div
            className="absolute w-full h-full pointer-events-none flex items-center justify-center"
            style={{
              transform: `rotate(${nowDeg}deg)`,
            }}
          >
            <div
              className="absolute top-0 w-[2.5px] h-[34px] rounded-full"
              style={{
                background: 'linear-gradient(180deg, #ffffff 0%, rgba(255,255,255,0.6) 100%)',
                boxShadow: '0 0 8px #ffffff',
              }}
            />
          </div>

          {/* Center Disk Content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 pointer-events-none text-center p-3">
            {activeCategoryItem ? (
              <>
                <span
                  style={{
                    font: '800 48px/0.9 Archivo, sans-serif',
                    letterSpacing: '-0.045em',
                    color: 'var(--tf-ink)',
                  }}
                >
                  {Math.floor(activeCategoryItem.totalSec / 3600)}h
                </span>
                <span
                  className="truncate max-w-[140px]"
                  style={{
                    font: '600 12px/1.2 Archivo, sans-serif',
                    color: 'rgba(var(--tf-ink-rgb), 0.75)',
                  }}
                >
                  {activeCategoryItem.category.emoji} {activeCategoryItem.category.name}
                </span>
              </>
            ) : (
              <>
                <span
                  style={{
                    font: '800 50px/0.9 Archivo, sans-serif',
                    letterSpacing: '-0.045em',
                    color: 'var(--tf-ink)',
                  }}
                >
                  {totalHours}h
                </span>
                <span
                  style={{
                    font: '600 12px/1.2 Archivo, sans-serif',
                    color: 'rgba(var(--tf-ink-rgb), 0.6)',
                    maxWidth: '150px',
                  }}
                >
                  {totalAccountedSec > 0 ? 'accounted of 24 hours' : 'nothing logged yet'}
                </span>
              </>
            )}
          </div>

          {/* Hour tick marks */}
          <span
            className="absolute top-[-20px] left-1/2 -translate-x-1/2"
            style={{ font: "500 9.5px/1 'JetBrains Mono', monospace", color: 'rgba(var(--tf-ink-rgb), 0.55)' }}
          >
            24
          </span>
          <span
            className="absolute top-1/2 right-[-22px] -translate-y-1/2"
            style={{ font: "500 9.5px/1 'JetBrains Mono', monospace", color: 'rgba(var(--tf-ink-rgb), 0.55)' }}
          >
            06
          </span>
          <span
            className="absolute bottom-[-20px] left-1/2 -translate-x-1/2"
            style={{ font: "500 9.5px/1 'JetBrains Mono', monospace", color: 'rgba(var(--tf-ink-rgb), 0.55)' }}
          >
            12
          </span>
          <span
            className="absolute top-1/2 left-[-22px] -translate-y-1/2"
            style={{ font: "500 9.5px/1 'JetBrains Mono', monospace", color: 'rgba(var(--tf-ink-rgb), 0.55)' }}
          >
            18
          </span>
        </div>
      </div>

      {/* Italic poetic sentence */}
      <p
        className="mt-1 text-center italic"
        style={{
          font: "italic 400 18px/1.35 'Instrument Serif', serif",
          color: 'rgba(var(--tf-ink-rgb), 0.72)',
        }}
      >
        {poeticSentence}
      </p>

      {/* Category legend pills */}
      {categoryTotals.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3 justify-center">
          {categoryTotals.slice(0, 6).map(({ category, totalSec }, i) => {
            const isSelected = inspectedIndex === i;
            const h = Math.floor(totalSec / 3600);
            const m = Math.floor((totalSec % 3600) / 60);
            return (
              <span
                key={category.id}
                onClick={(e) => {
                  e.stopPropagation();
                  const newIdx = inspectedIndex === i ? -1 : i;
                  setInspectedIndex(newIdx);
                  if (onSelectCategory) {
                    onSelectCategory(newIdx >= 0 ? category : null);
                  }
                }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full cursor-pointer transition-all"
                style={{
                  background: isSelected ? `${category.color}33` : 'rgba(var(--tf-surf-rgb), 0.05)',
                  border: `1px solid ${isSelected ? category.color : 'rgba(var(--tf-surf-rgb), 0.10)'}`,
                }}
              >
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: category.color }}
                />
                <span
                  style={{
                    font: '600 11px/1 Archivo, sans-serif',
                    color: 'rgba(var(--tf-ink-rgb), 0.85)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {category.name.split(' & ')[0]}
                </span>
                <span
                  style={{
                    font: "400 10.5px/1 'JetBrains Mono', monospace",
                    color: 'rgba(var(--tf-ink-rgb), 0.5)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {h > 0 ? `${h}h` : ''}{m > 0 ? `${m}m` : ''}
                </span>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
};
