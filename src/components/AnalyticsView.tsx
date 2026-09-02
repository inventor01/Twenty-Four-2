import React, { useState } from 'react';
import { TimeEntry, DailyReflection, Category } from '../types';
import { fmt, formatDateNice, shiftDateKey } from '../lib/time';
import { trackedSec, byCategory, mattersScore } from '../analytics/ledger';
import { ShieldCapIcon, CalendarRhythmIcon, RhythmRingsIcon, JournalBookIcon } from './OrganicIcons';

interface AnalyticsViewProps {
  entries: TimeEntry[];
  allEntries: TimeEntry[];
  reflections: DailyReflection[];
  currentDateKey: string;
  onSelectDateKey?: (dateKey: string) => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  entries,
  allEntries,
  reflections,
  currentDateKey,
  onSelectDateKey,
}) => {
  const [viewMode, setViewMode] = useState<'7days' | 'month'>('7days');
  const catSummary = byCategory(entries);
  const matters = mattersScore(entries);

  // 7-day trailing data
  const last7Days: { key: string; label: string; trackedSec: number; matters: ReturnType<typeof mattersScore>; entries: TimeEntry[] }[] = [];
  for (let i = 6; i >= 0; i--) {
    const key = shiftDateKey(currentDateKey, -i);
    const dayEntries = allEntries.filter((e) => e.localDate === key);
    last7Days.push({
      key,
      label: formatDateNice(key),
      trackedSec: trackedSec(dayEntries),
      matters: mattersScore(dayEntries),
      entries: dayEntries,
    });
  }

  // 30-day monthly heatmap data
  const last30Days: { key: string; dayNum: number; trackedSec: number; pct: number; isSelected: boolean }[] = [];
  for (let i = 29; i >= 0; i--) {
    const key = shiftDateKey(currentDateKey, -i);
    const dayEntries = allEntries.filter((e) => e.localDate === key);
    const sec = trackedSec(dayEntries);
    const [, , d] = key.split('-').map(Number);
    last30Days.push({
      key,
      dayNum: d,
      trackedSec: sec,
      pct: Math.min(100, Math.round((sec / 86400) * 100)),
      isSelected: key === currentDateKey,
    });
  }

  // Kind grouping for today
  const restSec = entries
    .filter((e) => e.categoryKind === 'rest' || e.categoryName.toLowerCase().includes('sleep'))
    .reduce((t, e) => t + e.durationSec, 0);

  const fixedSec = entries
    .filter((e) => e.categoryKind === 'fixed' && !e.categoryName.toLowerCase().includes('sleep'))
    .reduce((t, e) => t + e.durationSec, 0);

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fadeIn">
      {/* View Switcher Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white dark:text-white light:text-slate-900 font-sans tracking-tight">
            Long-Term Balance & Trends
          </h2>
          <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600">
            Inspect your 24-hour balance consistency across days and weeks
          </p>
        </div>

        <div className="flex items-center p-1 rounded-2xl glass-pill shadow-2xs">
          <button
            onClick={() => setViewMode('7days')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              viewMode === '7days' ? 'bg-sky-500 text-slate-950 font-bold shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            7-Day Rhythm
          </button>
          <button
            onClick={() => setViewMode('month')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              viewMode === 'month' ? 'bg-sky-500 text-slate-950 font-bold shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            30-Day Heatmap
          </button>
        </div>
      </div>

      {/* Time That Matters Oura Score Banner */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 relative overflow-hidden transition-all duration-500">
        <div className="ambient-glow -top-16 -right-16 w-64 h-64 bg-sky-500/20" />
        <div className="ambient-glow -bottom-16 -left-16 w-64 h-64 bg-blue-600/20" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <ShieldCapIcon size={16} className="text-sky-400" />
              <span className="text-[11px] font-bold tracking-widest text-sky-400 uppercase">
                TIME THAT MATTERS ALIGNMENT
              </span>
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-5xl font-black text-white dark:text-white light:text-slate-900 font-sans">{matters.score}%</span>
              <span className="text-sm font-semibold text-sky-400">
                {matters.score >= 70 ? 'High Intentionality' : matters.score >= 40 ? 'Balanced Flow' : 'Gentle Baseline'}
              </span>
            </div>
            <p className="text-xs text-slate-300 dark:text-slate-300 light:text-slate-600 max-w-md leading-relaxed">
              Ratio of <strong>Priority Tracked Time</strong> to total discretionary time. Essential sleep and baseline routines are protected and never penalize your score.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 glass-card-subtle p-4 rounded-2xl text-xs shadow-2xs border border-white/10">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Priority Focus</span>
              <span className="font-bold text-white dark:text-white light:text-slate-900 text-sm">{fmt(matters.prioritySec)}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Discretionary</span>
              <span className="font-bold text-white dark:text-white light:text-slate-900 text-sm">{fmt(matters.discretionarySec)}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Rest & Recovery</span>
              <span className="font-bold text-white dark:text-white light:text-slate-900 text-sm">{fmt(restSec)}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Fixed Baseline</span>
              <span className="font-bold text-white dark:text-white light:text-slate-900 text-sm">{fmt(fixedSec)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 30-Day Monthly Heatmap Grid */}
      {viewMode === 'month' && (
        <div className="glass-card rounded-3xl p-6 sm:p-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[11px] font-bold tracking-widest text-slate-400 dark:text-slate-400 light:text-slate-500 uppercase flex items-center gap-1.5">
              <CalendarRhythmIcon size={14} className="text-sky-400" />
              <span>30-DAY 24-HOUR BALANCE HEATMAP</span>
            </h3>
            <span className="text-xs text-slate-400">Tap any day to inspect</span>
          </div>

          <div className="grid grid-cols-6 sm:grid-cols-10 gap-2.5 pt-2">
            {last30Days.map((d) => {
              // Heatmap intensity
              let bg = 'bg-black/20 text-slate-500';
              if (d.pct >= 80) bg = 'bg-sky-500 text-slate-950 font-bold shadow-xs';
              else if (d.pct >= 50) bg = 'bg-sky-600/80 text-white';
              else if (d.pct >= 25) bg = 'bg-sky-700/50 text-slate-200';
              else if (d.pct > 0) bg = 'bg-sky-900/30 text-slate-300';

              return (
                <button
                  key={d.key}
                  onClick={() => onSelectDateKey && onSelectDateKey(d.key)}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-2xl border transition-all cursor-pointer ${
                    d.isSelected
                      ? 'ring-2 ring-sky-400 border-white shadow-md scale-105'
                      : 'border-white/5 hover:scale-105'
                  } ${bg}`}
                  title={`${d.key}: ${fmt(d.trackedSec)} (${d.pct}% of 24h)`}
                >
                  <span className="text-xs font-bold">{d.dayNum}</span>
                  <span className="text-[10px] opacity-80 font-mono mt-0.5">
                    {d.trackedSec > 0 ? `${Math.round(d.trackedSec / 3600)}h` : '0h'}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Heatmap intensity legend */}
          <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-white/10">
            <span>Less tracked</span>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-md bg-black/20" />
              <span className="w-3.5 h-3.5 rounded-md bg-sky-900/30" />
              <span className="w-3.5 h-3.5 rounded-md bg-sky-700/50" />
              <span className="w-3.5 h-3.5 rounded-md bg-sky-500" />
            </div>
            <span>24h Fully Accounted</span>
          </div>
        </div>
      )}

      {/* 7-Day Consistency Bars */}
      {viewMode === '7days' && (
        <div className="glass-card rounded-3xl p-6 sm:p-7 space-y-4">
          <h3 className="text-[11px] font-bold tracking-widest text-slate-400 dark:text-slate-400 light:text-slate-500 uppercase flex items-center gap-1.5">
            <RhythmRingsIcon size={14} className="text-sky-400" />
            <span>7-DAY LEDGER RHYTHM</span>
          </h3>
          <div className="grid grid-cols-7 gap-2 items-end h-44 pt-4">
            {last7Days.map((d) => {
              const heightPct = Math.min(100, Math.round((d.trackedSec / 86400) * 100));
              const isSelected = d.key === currentDateKey;

              return (
                <div
                  key={d.key}
                  onClick={() => onSelectDateKey && onSelectDateKey(d.key)}
                  className="flex flex-col items-center h-full justify-end group cursor-pointer"
                >
                  <span className="text-[10px] font-mono text-slate-400 mb-1.5 font-medium">
                    {fmt(d.trackedSec)}
                  </span>
                  <div className="w-full glass-card-subtle rounded-2xl h-32 flex items-end p-1 border border-white/10 group-hover:border-sky-400/50 transition-all">
                    <div
                      style={{ height: `${Math.max(6, heightPct)}%` }}
                      className={`w-full rounded-xl transition-all ${
                        isSelected
                          ? 'bg-sky-400 shadow-sm'
                          : 'bg-sky-500/40 group-hover:bg-sky-500/70'
                      }`}
                    />
                  </div>
                  <span
                    className={`text-[10px] mt-2 truncate max-w-full font-medium ${
                      isSelected ? 'font-bold text-sky-400' : 'text-slate-400'
                    }`}
                  >
                    {d.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Category Breakdown */}
      <div className="glass-card rounded-3xl p-6 sm:p-7 space-y-4">
        <h3 className="text-[11px] font-bold tracking-widest text-slate-400 dark:text-slate-400 light:text-slate-500 uppercase">
          CATEGORY PROPORTIONS FOR {formatDateNice(currentDateKey).toUpperCase()}
        </h3>
        {catSummary.length === 0 ? (
          <p className="text-xs text-slate-400 italic">No time recorded for this date yet.</p>
        ) : (
          <div className="space-y-3 pt-1">
            {catSummary.map((c) => (
              <div key={c.name} className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-white dark:text-white light:text-slate-900 flex items-center gap-2">
                    <span className="text-base">{c.emoji}</span>
                    <span>{c.name}</span>
                    <span className="text-[10px] text-slate-400 font-normal uppercase">({c.kind})</span>
                  </span>
                  <span className="font-mono text-slate-400">
                    {fmt(c.sec)} ({c.percentage}%)
                  </span>
                </div>
                <div className="w-full h-2.5 bg-black/20 dark:bg-black/40 light:bg-black/5 rounded-full overflow-hidden border border-white/10">
                  <div
                    style={{ width: `${c.percentage}%`, backgroundColor: c.color }}
                    className="h-full rounded-full transition-all duration-500"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Past Reflections Log */}
      {reflections.length > 0 && (
        <div className="glass-card rounded-3xl p-6 sm:p-7 space-y-4">
          <h3 className="text-[11px] font-bold tracking-widest text-slate-400 dark:text-slate-400 light:text-slate-500 uppercase flex items-center gap-1.5">
            <JournalBookIcon size={14} className="text-sky-400" />
            <span>REFLECTIONS & INTENTIONS ARCHIVE</span>
          </h3>
          <div className="divide-y divide-white/10 dark:divide-white/10 light:divide-black/10">
            {reflections.map((r) => (
              <div key={r.dateKey} className="py-3.5 first:pt-0 last:pb-0 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white dark:text-white light:text-slate-900">{formatDateNice(r.dateKey)}</span>
                  <span className="text-[11px] text-slate-400 font-mono">{r.dateKey}</span>
                </div>
                <div className="text-xs text-sky-300 dark:text-sky-300 light:text-slate-700 font-medium">{r.question}</div>
                <p className="text-xs text-slate-300 dark:text-slate-300 light:text-slate-700 italic glass-card-subtle p-3 rounded-2xl border border-white/5 font-serif leading-relaxed">
                  "{r.answer}"
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
