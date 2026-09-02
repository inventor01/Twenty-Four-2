import React from 'react';
import { TimeEntry, Category } from '../types';
import { fmtTime12, fmtTime24 } from '../lib/time';

interface LedgerSectionProps {
  entries?: TimeEntry[];
  categories?: Category[];
  selectedDateKey?: string;
  hourFormat?: 12 | 24;
  timeZone?: string;
  onAddNote?: (entry: TimeEntry) => void;
  onOpenLogModal?: () => void;
}

export const LedgerSection: React.FC<LedgerSectionProps> = ({
  entries = [],
  categories = [],
  selectedDateKey,
  hourFormat = 12,
  timeZone,
  onAddNote,
  onOpenLogModal,
}) => {
  const safeEntries = entries || [];

  const formatTimeParts = (ms: number): { time: string; period: string } => {
    const formatted = hourFormat === 24 ? fmtTime24(ms, timeZone) : fmtTime12(ms, timeZone);
    if (hourFormat === 12) {
      const match = formatted.match(/^(\d+:\d+)\s*(am|pm)$/i);
      if (match) {
        return { time: match[1], period: match[2].toLowerCase() };
      }
    }
    return { time: formatted, period: '' };
  };

  const formatNoteTime = (ms: number): string => {
    return hourFormat === 24 ? fmtTime24(ms, timeZone) : fmtTime12(ms, timeZone);
  };

  // Sort newest first
  const sortedEntries = [...safeEntries].sort((a, b) => b.startedAtMs - a.startedAtMs);

  return (
    <div className="flex flex-col gap-2 pt-1">
      {/* Eyebrow Header */}
      <div className="flex items-center justify-between pb-1">
        <span
          style={{
            font: "600 10px/1 'JetBrains Mono', monospace",
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'rgba(var(--tf-ink-rgb), 0.42)',
          }}
        >
          THE LEDGER
        </span>
        <span
          style={{
            font: "400 10px/1 'JetBrains Mono', monospace",
            color: 'rgba(var(--tf-ink-rgb), 0.35)',
          }}
        >
          {entries.length} {entries.length === 1 ? 'block' : 'blocks'}
        </span>
      </div>

      {sortedEntries.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center p-8 rounded-[26px] border border-dashed border-white/15 text-center gap-3 mt-1"
          style={{
            background: 'rgba(var(--tf-surf-rgb), 0.03)',
            borderColor: 'rgba(var(--tf-surf-rgb), 0.14)',
          }}
        >
          <span
            style={{
              font: '700 15px/1.3 Archivo, sans-serif',
              letterSpacing: '-0.01em',
              color: 'var(--tf-ink)',
            }}
          >
            Nothing on the ledger yet.
          </span>
          <p
            style={{
              font: "italic 400 17px/1.4 'Instrument Serif', serif",
              color: 'rgba(var(--tf-ink-rgb), 0.70)',
            }}
            className="max-w-[260px]"
          >
            An empty ring is still a whole day.
          </p>
          <button
            onClick={onOpenLogModal}
            className="mt-2 h-[46px] px-6 rounded-full text-white font-semibold transition-all hover:brightness-110 active:scale-95 cursor-pointer flex items-center justify-center shadow-lg"
            style={{
              font: '600 13.5px/1 Archivo, sans-serif',
              background: 'linear-gradient(135deg, rgba(56,189,248, 0.85), rgba(37,99,235, 0.85))',
              border: '1px solid rgba(56,189,248, 0.9)',
              boxShadow: '0 8px 24px -10px rgba(56,189,248, 0.6)',
            }}
          >
            Log your first block
          </button>
        </div>
      ) : (
        <div className="flex flex-col">
          {sortedEntries.map((entry, idx) => {
            const h = Math.floor(entry.durationSec / 3600);
            const m = Math.floor((entry.durationSec % 3600) / 60);
            const timeParts = formatTimeParts(entry.startedAtMs);
            const color = entry.categoryColor || '#818CF8';

            return (
              <div
                key={entry.id}
                className="flex items-start justify-between py-[13px] transition-colors"
                style={{
                  borderBottom: idx === sortedEntries.length - 1 ? 'none' : '1px solid rgba(var(--tf-surf-rgb), 0.07)',
                }}
              >
                {/* Left Time Column */}
                <div
                  className="w-[46px] flex-shrink-0 flex flex-col pt-0.5"
                  style={{
                    font: "400 11px/1.1 'JetBrains Mono', monospace",
                    color: 'rgba(var(--tf-ink-rgb), 0.55)',
                  }}
                >
                  <span>{timeParts.time}</span>
                  {timeParts.period && (
                    <span className="text-[9.5px] opacity-70 mt-0.5">{timeParts.period}</span>
                  )}
                </div>

                {/* Category Dot */}
                <div className="pt-1.5 px-2 flex-shrink-0">
                  <span
                    className="block w-[10px] h-[10px] rounded-full"
                    style={{
                      background: color,
                      boxShadow: `0 0 12px ${color}88`,
                    }}
                  />
                </div>

                {/* Middle Content Column */}
                <div className="flex-1 min-w-0 pr-2">
                  <div
                    style={{
                      font: '600 15px/1.2 Archivo, sans-serif',
                      letterSpacing: '-0.01em',
                      color: 'var(--tf-ink)',
                    }}
                    className="truncate"
                  >
                    {entry.activityName}
                  </div>
                  <div
                    style={{
                      font: '400 11px/1.2 Archivo, sans-serif',
                      color: 'rgba(var(--tf-ink-rgb), 0.42)',
                      marginTop: '2px',
                    }}
                    className="truncate"
                  >
                    {entry.categoryName}
                  </div>

                  {/* Notes List */}
                  {entry.notes && entry.notes.length > 0 && (
                    <div className="mt-2 flex flex-col gap-1.5">
                      {entry.notes.map((note) => (
                        <div key={note.id} className="flex items-baseline gap-2">
                          <span
                            style={{
                              font: "400 9px/1.2 'JetBrains Mono', monospace",
                              color: 'rgba(var(--tf-ink-rgb), 0.38)',
                            }}
                            className="flex-shrink-0"
                          >
                            {formatNoteTime(note.createdAtMs)}
                          </span>
                          <span
                            style={{
                              font: "italic 400 14px/1.35 'Instrument Serif', serif",
                              color: 'rgba(var(--tf-ink-rgb), 0.72)',
                            }}
                          >
                            {note.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Note Pill Button */}
                  <button
                    onClick={() => onAddNote(entry)}
                    className="mt-2 inline-flex items-center justify-center transition-all hover:bg-white/10 active:scale-95 cursor-pointer select-none"
                    style={{
                      height: '28px',
                      padding: '0 11px',
                      borderRadius: '999px',
                      border: '1px solid rgba(var(--tf-surf-rgb), 0.14)',
                      background: 'rgba(var(--tf-surf-rgb), 0.05)',
                      color: 'rgba(var(--tf-ink-rgb), 0.65)',
                      font: '500 10.5px/1 Archivo, sans-serif',
                    }}
                  >
                    {entry.notes && entry.notes.length > 0
                      ? `＋ ${entry.notes.length} note${entry.notes.length === 1 ? '' : 's'}`
                      : '＋ add a note'}
                  </button>
                </div>

                {/* Right Duration Column */}
                <div
                  className="flex-shrink-0 text-right pt-0.5"
                  style={{
                    font: '600 13px/1.4 Archivo, sans-serif',
                    color: 'rgba(var(--tf-ink-rgb), 0.75)',
                  }}
                >
                  {h > 0 ? `${h}h ` : ''}{m}m
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
