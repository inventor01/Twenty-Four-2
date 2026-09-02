import React, { useState } from 'react';
import { TimeEntry } from '../types';
import { hhmm, fmt } from '../lib/time';
import { ClockAuraIcon } from './OrganicIcons';

interface DayTimelineBarProps {
  entries: TimeEntry[];
  dateKey: string;
}

export const DayTimelineBar: React.FC<DayTimelineBarProps> = ({ entries, dateKey }) => {
  const [y, m, d] = dateKey.split('-').map(Number);
  const dayStartMs = new Date(y, m - 1, d, 0, 0, 0).getTime();
  const dayEndMs = dayStartMs + 24 * 3600 * 1000;

  const [hoveredEntry, setHoveredEntry] = useState<TimeEntry | null>(null);

  // Time markers: 0, 3, 6, 9, 12, 15, 18, 21, 24
  const markers = [0, 3, 6, 9, 12, 15, 18, 21, 24];

  return (
    <div className="glass-card rounded-3xl p-5 sm:p-6 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-[11px] font-bold tracking-widest text-slate-400 dark:text-slate-400 light:text-slate-500 uppercase flex items-center gap-1.5">
          <ClockAuraIcon size={14} className="text-sky-400" />
          <span>24-HOUR CHRONOLOGICAL FLOW</span>
        </h3>
        {hoveredEntry ? (
          <div className="text-xs font-medium text-white dark:text-white light:text-slate-900 glass-pill px-3 py-1 rounded-xl shadow-xs animate-fadeIn flex items-center gap-1.5 border border-sky-400/40">
            <span>{hoveredEntry.emoji}</span>
            <span className="font-semibold">{hoveredEntry.activityName}</span>
            <span className="text-slate-400 dark:text-slate-400 light:text-slate-500 font-mono text-[11px]">
              ({hhmm(hoveredEntry.startedAtMs)}–{hhmm(hoveredEntry.endedAtMs)})
            </span>
            <span className="font-semibold text-sky-400">· {fmt(hoveredEntry.durationSec)}</span>
          </div>
        ) : (
          <span className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-500">
            Hover blocks to inspect chronology
          </span>
        )}
      </div>

      {/* Visual Timeline Track */}
      <div className="relative h-11 w-full bg-black/25 dark:bg-black/40 light:bg-black/5 rounded-2xl border border-white/10 dark:border-white/10 light:border-black/10 overflow-hidden shadow-inner p-1">
        {/* Hour grid lines */}
        {markers.map((hour) => (
          <div
            key={hour}
            style={{ left: `${(hour / 24) * 100}%` }}
            className="absolute top-0 bottom-0 border-l border-white/10 dark:border-white/10 light:border-black/10 pointer-events-none"
          />
        ))}

        {/* Render Time Blocks */}
        {entries.map((entry) => {
          const clampedStart = Math.max(dayStartMs, entry.startedAtMs);
          const clampedEnd = Math.min(dayEndMs, entry.endedAtMs);
          if (clampedEnd <= clampedStart) return null;

          const leftPct = ((clampedStart - dayStartMs) / (24 * 3600 * 1000)) * 100;
          const widthPct = Math.max(0.7, ((clampedEnd - clampedStart) / (24 * 3600 * 1000)) * 100);

          return (
            <div
              key={entry.id}
              onMouseEnter={() => setHoveredEntry(entry)}
              onMouseLeave={() => setHoveredEntry(null)}
              style={{
                left: `${leftPct}%`,
                width: `${widthPct}%`,
                backgroundColor: entry.categoryColor,
              }}
              className="absolute top-1 bottom-1 rounded-lg transition-transform hover:scale-y-105 cursor-pointer shadow-xs flex items-center justify-center overflow-hidden border border-white/30"
              title={`${entry.activityName} (${entry.categoryName}): ${hhmm(entry.startedAtMs)}–${hhmm(entry.endedAtMs)} (${fmt(entry.durationSec)})`}
            >
              {widthPct > 5 && (
                <span className="text-[10px] text-white font-semibold truncate px-1 drop-shadow-xs select-none">
                  {entry.activityName}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Hour ticks labels */}
      <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-400 light:text-slate-500 font-mono px-1">
        {markers.map((h) => (
          <span key={h} className="transform -translate-x-1/2 first:translate-x-0 last:translate-x-[-100%]">
            {h === 0 || h === 24 ? (h === 0 ? '00:00' : '24:00') : `${String(h).padStart(2, '0')}:00`}
          </span>
        ))}
      </div>
    </div>
  );
};
