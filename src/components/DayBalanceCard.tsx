import React from 'react';
import { fmt, localDateKey } from '../lib/time';
import { TimeEntry } from '../types';
import { trackedSec, untrackedSec, byCategory, mattersScore } from '../analytics/ledger';
import { ConcentricRings } from './OuraRing';
import { ArrowUpRight } from 'lucide-react';
import { RhythmRingsIcon, ShieldCapIcon, MoonRestIcon, ClockAuraIcon, SparkleAuraIcon } from './OrganicIcons';

interface DayBalanceCardProps {
  dateKey: string;
  entries: TimeEntry[];
  onOpenQuickAdd: () => void;
  onOpenCloseout: () => void;
}

export const DayBalanceCard: React.FC<DayBalanceCardProps> = ({
  dateKey,
  entries,
  onOpenQuickAdd,
  onOpenCloseout,
}) => {
  const isToday = dateKey === localDateKey();
  const tracked = trackedSec(entries);
  const untracked = untrackedSec(entries, tracked);
  const categories = byCategory(entries);
  const matters = mattersScore(entries);

  // 24 hours in seconds = 86400
  const trackedPercentage = Math.min(100, Math.round((tracked / 86400) * 100));

  // Rest & Recovery calculation (Sleep + Rest kind)
  const restSec = entries
    .filter((e) => e.categoryKind === 'rest' || e.categoryName.toLowerCase().includes('sleep'))
    .reduce((t, e) => t + e.durationSec, 0);
  const restPct = Math.min(100, Math.round((restSec / (8 * 3600)) * 100));

  // Overall Oura-style daily balance readiness index
  const balanceIndex = Math.round((trackedPercentage * 0.4) + (matters.score * 0.4) + (Math.min(100, restPct) * 0.2));

  return (
    <div className="relative glass-card rounded-3xl p-6 sm:p-8 overflow-hidden transition-all duration-500">
      {/* Dynamic ambient glowing light spheres */}
      <div className="ambient-glow -top-24 -left-24 w-72 h-72 bg-sky-500/20" />
      <div className="ambient-glow -bottom-24 -right-24 w-72 h-72 bg-blue-600/20" />
      <div className="ambient-glow top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10" />

      <div className="relative z-10 space-y-6">
        {/* Top Header & Concentric Rings Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Left: Day info & Balance Index */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold tracking-widest uppercase text-sky-400 dark:text-sky-400 light:text-sky-600 flex items-center gap-1.5">
                <ClockAuraIcon size={14} />
                <span>{isToday ? "TODAY'S 24-HOUR BALANCE" : "24-HOUR BALANCE"}</span>
              </span>
              <span className="w-1 h-1 rounded-full bg-slate-400" />
              <span className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-500 font-mono">
                {dateKey}
              </span>
            </div>

            <div className="flex items-baseline gap-3">
              <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-white dark:text-white light:text-slate-900 font-sans">
                {fmt(tracked)}
              </h2>
              <span className="text-sm font-medium text-slate-400 dark:text-slate-400 light:text-slate-500">
                accounted for
              </span>
            </div>

            <p className="text-xs text-slate-300 dark:text-slate-300 light:text-slate-600 max-w-sm leading-relaxed">
              <span className="font-semibold text-white dark:text-white light:text-slate-900">{fmt(untracked)}</span> of your 24 hours remains to be accounted for. Every minute records your intentional rhythm.
            </p>
          </div>

          {/* Center / Right: Oura Multi-Ring Readiness & Alignment Widget */}
          <div className="flex items-center gap-5 p-4 rounded-2xl glass-card-subtle self-start md:self-center shadow-xs border border-white/10 dark:border-white/10 light:border-black/5">
            <ConcentricRings
              size={146}
              gap={3}
              strokeWidth={7}
              rings={[
                {
                  value: trackedPercentage,
                  color: '#38BDF8', // 24h accounted ring (Luminous Sky Blue)
                  strokeWidth: 7,
                },
                {
                  value: matters.score,
                  color: '#60A5FA', // Time That Matters priority ring (Mineral Blue)
                  strokeWidth: 7,
                },
                {
                  value: restPct,
                  color: '#818CF8', // Rest & Recovery ring (Indigo Lavender)
                  strokeWidth: 7,
                },
              ]}
              centerContent={
                <div className="flex flex-col items-center justify-center text-center select-none">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-400 light:text-slate-500 leading-none mb-1">
                    Readiness
                  </span>
                  <span className="text-2xl font-black tracking-tight text-white dark:text-white light:text-slate-900 leading-none font-mono">
                    {balanceIndex}
                  </span>
                  <span className="text-[10px] text-sky-400 dark:text-sky-400 light:text-sky-600 font-bold leading-none mt-1 tracking-tight">
                    {balanceIndex >= 70 ? 'Harmonious' : balanceIndex >= 40 ? 'Balanced' : 'Gentle'}
                  </span>
                </div>
              }
            />

            {/* Ring Legend */}
            <div className="space-y-2 pr-1 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-400 shrink-0" />
                <span className="text-slate-200 dark:text-slate-200 light:text-slate-800 font-medium">
                  {trackedPercentage}% Tracked
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-400 shrink-0" />
                <span className="text-slate-200 dark:text-slate-200 light:text-slate-800 font-medium">
                  {matters.score}% Priority Ratio
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 shrink-0" />
                <span className="text-slate-200 dark:text-slate-200 light:text-slate-800 font-medium">
                  {fmt(restSec)} Rest & Sleep
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 24-Hour Continuous Segment Bar */}
        <div className="space-y-1.5 pt-1">
          <div className="h-3.5 w-full bg-black/20 dark:bg-black/40 light:bg-black/5 rounded-full overflow-hidden flex border border-white/10 dark:border-white/10 light:border-black/10 shadow-inner">
            {categories.map((c) => {
              const widthPct = (c.sec / 86400) * 100;
              if (widthPct <= 0) return null;
              return (
                <div
                  key={c.name}
                  style={{ width: `${widthPct}%`, backgroundColor: c.color }}
                  className="h-full transition-all duration-300 hover:opacity-90 relative group"
                  title={`${c.name}: ${fmt(c.sec)} (${Math.round(widthPct)}% of 24h)`}
                />
              );
            })}
          </div>
          <div className="flex justify-between items-center text-[10px] text-slate-400 dark:text-slate-400 light:text-slate-500 font-medium px-0.5">
            <span>00:00 (Midnight)</span>
            <span className="text-sky-300 dark:text-sky-300 light:text-sky-600 font-semibold">{trackedPercentage}% allocated</span>
            <span>24:00 (End of Day)</span>
          </div>
        </div>

        {/* Category breakdown pills & Quick Actions */}
        <div className="pt-4 border-t border-white/[0.08] dark:border-white/[0.08] light:border-black/[0.08] flex flex-wrap items-center justify-between gap-3">
          {/* Category Chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {categories.slice(0, 5).map((c) => (
              <span
                key={c.name}
                className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full glass-pill text-slate-200 dark:text-slate-200 light:text-slate-800 shadow-2xs"
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
                <span>{c.name}</span>
                <span className="text-slate-400 dark:text-slate-400 light:text-slate-500 font-mono font-semibold">{fmt(c.sec)}</span>
              </span>
            ))}
            {categories.length === 0 && (
              <span className="text-xs text-slate-400 italic">No time recorded for this date yet.</span>
            )}
          </div>

          {/* Quick buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenCloseout}
              className="text-xs font-semibold text-sky-400 dark:text-sky-400 light:text-sky-600 hover:text-sky-300 flex items-center gap-1 px-3 py-1.5 rounded-xl glass-pill shadow-2xs transition-all cursor-pointer"
            >
              <MoonRestIcon size={14} />
              <span>Evening Closeout</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
