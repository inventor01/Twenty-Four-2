import React, { useState, useMemo } from 'react';
import { TimeEntry, Category } from '../types';
import { fmtTime12, fmtTime24 } from '../lib/time';

interface ChronologicalFlowProps {
  entries?: TimeEntry[];
  categories?: Category[];
  runningTimer?: any;
  hourFormat?: 12 | 24;
  timeZone?: string;
  onAddNote?: (entry: TimeEntry) => void;
  onSelectEntry?: (entry: TimeEntry) => void;
}

interface FlowItem {
  id: string;
  type: 'entry' | 'gap';
  entry?: TimeEntry;
  startedAtMs: number;
  endedAtMs: number;
  durationSec: number;
}

export const ChronologicalFlow: React.FC<ChronologicalFlowProps> = ({
  entries = [],
  categories = [],
  runningTimer,
  hourFormat = 12,
  timeZone,
  onAddNote,
  onSelectEntry,
}) => {
  const safeEntries = entries || [];
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);

  // Format time helper
  const formatTime = (ms: number): string => {
    return hourFormat === 24 ? fmtTime24(ms, timeZone) : fmtTime12(ms, timeZone);
  };

  // Build sorted timeline items with gap calculation
  const flowItems = useMemo<FlowItem[]>(() => {
    if (safeEntries.length === 0) return [];

    // Sort ascending by startedAtMs
    const sorted = [...safeEntries].sort((a, b) => a.startedAtMs - b.startedAtMs);
    const items: FlowItem[] = [];

    for (let i = 0; i < sorted.length; i++) {
      const curr = sorted[i];

      // Check gap before this entry
      if (i > 0) {
        const prev = sorted[i - 1];
        const gapSec = Math.floor((curr.startedAtMs - prev.endedAtMs) / 1000);
        // Only show unaccounted row for gaps >= 15 min (900s)
        if (gapSec >= 900) {
          items.push({
            id: `gap-${prev.id}-${curr.id}`,
            type: 'gap',
            startedAtMs: prev.endedAtMs,
            endedAtMs: curr.startedAtMs,
            durationSec: gapSec,
          });
        }
      }

      items.push({
        id: `entry-${curr.id}`,
        type: 'entry',
        entry: curr,
        startedAtMs: curr.startedAtMs,
        endedAtMs: curr.endedAtMs,
        durationSec: curr.durationSec,
      });
    }

    // Return newest first (descending)
    return items.reverse();
  }, [entries]);

  // Default to showing 4 newest rows
  const visibleItems = isExpanded ? flowItems : flowItems.slice(0, 4);

  if (entries.length === 0) {
    return null;
  }

  const nowMs = Date.now();

  return (
    <div
      className="p-[18px] pb-4 rounded-[26px] relative overflow-hidden transition-all flex flex-col gap-3"
      style={{
        background: 'rgba(var(--tf-surf-rgb), 0.04)',
        border: '1px solid rgba(var(--tf-surf-rgb), 0.12)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <span
          style={{
            font: "600 10px/1 'JetBrains Mono', monospace",
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'rgba(var(--tf-ink-rgb), 0.42)',
          }}
        >
          CHRONOLOGICAL FLOW
        </span>
        <span
          style={{
            font: "400 10px/1 'JetBrains Mono', monospace",
            color: 'rgba(var(--tf-ink-rgb), 0.42)',
          }}
        >
          {isExpanded ? 'newest first · whole day' : 'newest first'}
        </span>
      </div>

      {/* Now Divider Line */}
      <div className="flex items-center gap-2 py-0.5">
        <span
          className="w-[52px] flex-shrink-0"
          style={{
            font: "400 10px/1 'JetBrains Mono', monospace",
            color: 'rgba(var(--tf-ink-rgb), 0.45)',
          }}
        >
          {formatTime(nowMs)}
        </span>
        <div
          className="flex-1 h-[1px]"
          style={{
            background: 'linear-gradient(90deg, rgba(56,189,248,.6) 0%, rgba(56,189,248,.1) 70%, transparent 100%)',
          }}
        />
        <span
          style={{
            font: "600 10px/1 'JetBrains Mono', monospace",
            letterSpacing: '0.08em',
            color: 'var(--tf-accent-ink)',
          }}
        >
          NOW
        </span>
      </div>

      {/* Flow Items List */}
      <div className="flex flex-col gap-2">
        {visibleItems.map((item) => {
          const durationMins = Math.round(item.durationSec / 60);

          if (item.type === 'gap') {
            const m = Math.floor((item.durationSec % 3600) / 60);
            const h = Math.floor(item.durationSec / 3600);

            return (
              <div
                key={item.id}
                className="flex items-center justify-between h-[26px] opacity-70"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-[52px] flex-shrink-0"
                    style={{
                      font: "400 10px/1 'JetBrains Mono', monospace",
                      color: 'rgba(var(--tf-ink-rgb), 0.40)',
                    }}
                  >
                    {formatTime(item.startedAtMs)}
                  </span>
                  <div
                    className="w-[5px] h-[20px] rounded-full"
                    style={{
                      background: 'repeating-linear-gradient(180deg, rgba(var(--tf-surf-rgb), 0.25) 0 3px, transparent 3px 6px)',
                    }}
                  />
                  <span
                    style={{
                      font: '400 11px/1 Archivo, sans-serif',
                      color: 'rgba(var(--tf-ink-rgb), 0.50)',
                    }}
                  >
                    unaccounted
                  </span>
                </div>

                <span
                  style={{
                    font: "600 11px/1 'JetBrains Mono', monospace",
                    color: 'rgba(var(--tf-ink-rgb), 0.50)',
                  }}
                >
                  {h > 0 ? `${h}h ` : ''}{m}m
                </span>
              </div>
            );
          }

          const entry = item.entry!;
          const h = Math.floor(entry.durationSec / 3600);
          const m = Math.floor((entry.durationSec % 3600) / 60);
          const color = entry.categoryColor || '#818CF8';
          // Block height: clamp(34, minutes * 0.42, 112)
          const blockHeight = Math.max(34, Math.min(112, Math.round(durationMins * 0.42)));
          const isSelected = selectedEntryId === entry.id;

          return (
            <div
              key={entry.id}
              onClick={() => {
                setSelectedEntryId(isSelected ? null : entry.id);
                if (onSelectEntry) onSelectEntry(entry);
              }}
              className="flex items-center justify-between px-3 rounded-[12px] transition-all cursor-pointer select-none"
              style={{
                height: `${blockHeight}px`,
                background: `linear-gradient(90deg, ${color}2e 0%, ${color}10 100%)`,
                border: isSelected ? `1px solid ${color}` : '1px solid rgba(var(--tf-surf-rgb), 0.08)',
                boxShadow: isSelected ? `0 0 0 3px ${color}22` : 'none',
              }}
            >
              <div className="flex items-center gap-2.5 min-w-0 pr-2">
                <span
                  className="w-[52px] flex-shrink-0"
                  style={{
                    font: "400 10px/1 'JetBrains Mono', monospace",
                    color: 'rgba(var(--tf-ink-rgb), 0.45)',
                  }}
                >
                  {formatTime(entry.startedAtMs)}
                </span>
                <div
                  className="w-[5px] h-full rounded-full flex-shrink-0 my-1"
                  style={{
                    background: color,
                  }}
                />
                <div className="flex flex-col min-w-0">
                  <span
                    style={{
                      font: '700 13px/1.2 Archivo, sans-serif',
                      color: 'var(--tf-ink)',
                    }}
                    className="truncate"
                  >
                    {entry.activityName}
                  </span>
                  {blockHeight >= 44 && (
                    <span
                      style={{
                        font: "400 10px/1 'JetBrains Mono', monospace",
                        color: 'rgba(var(--tf-ink-rgb), 0.45)',
                        marginTop: '2px',
                      }}
                      className="truncate"
                    >
                      {formatTime(entry.startedAtMs)}–{formatTime(entry.endedAtMs)} · {entry.categoryName}
                    </span>
                  )}
                </div>
              </div>

              <div
                className="flex-shrink-0"
                style={{
                  font: "600 12px/1 'JetBrains Mono', monospace",
                  color: 'rgba(var(--tf-ink-rgb), 0.75)',
                }}
              >
                {h > 0 ? `${h}h ` : ''}{m}m
              </div>
            </div>
          );
        })}
      </div>

      {/* Expand / Collapse Button */}
      {flowItems.length > 4 && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full h-[42px] rounded-[14px] flex items-center justify-center transition-all hover:bg-[rgba(var(--tf-surf-rgb),0.1)] active:scale-[0.99] cursor-pointer mt-1 select-none"
          style={{
            background: 'rgba(var(--tf-surf-rgb), 0.05)',
            border: '1px solid rgba(var(--tf-surf-rgb), 0.14)',
            color: 'var(--tf-ink)',
            font: '600 12px/1 Archivo, sans-serif',
          }}
        >
          {isExpanded
            ? 'Collapse to recent'
            : `Expand the whole day · ${entries.length} blocks`}
        </button>
      )}
    </div>
  );
};
