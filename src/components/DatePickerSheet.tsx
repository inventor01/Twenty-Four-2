import React, { useState, useMemo } from 'react';
import { shiftDateKey, formatDateDetails, localDateKey, DEFAULT_TIME_ZONE } from '../lib/time';
import { TimeEntry } from '../types';

interface DatePickerSheetProps {
  selectedDateKey: string;
  todayKey: string;
  allEntries?: TimeEntry[];
  timeZone?: string;
  onSelectDate: (dateKey: string) => void;
  onClose: () => void;
}

export const DatePickerSheet: React.FC<DatePickerSheetProps> = ({
  selectedDateKey,
  todayKey,
  allEntries = [],
  timeZone = DEFAULT_TIME_ZONE,
  onSelectDate,
  onClose,
}) => {
  const safeAllEntries = allEntries || [];
  const [draftDateKey, setDraftDateKey] = useState<string>(selectedDateKey);

  // Group entries by date key for activity indicators
  const entriesByDate = useMemo(() => {
    const map = new Map<string, { count: number; totalSec: number }>();
    safeAllEntries.forEach((entry) => {
      const prev = map.get(entry.localDate) || { count: 0, totalSec: 0 };
      prev.count += 1;
      prev.totalSec += entry.durationSec;
      map.set(entry.localDate, prev);
    });
    return map;
  }, [safeAllEntries]);

  // Generate a list of recent 7 days around the draft/selected date
  const quickDays = useMemo(() => {
    const list: { key: string; details: ReturnType<typeof formatDateDetails>; hours: number; count: number }[] = [];
    // 4 days before today, today, yesterday, tomorrow
    for (let i = -5; i <= 1; i++) {
      const k = shiftDateKey(todayKey, i);
      const details = formatDateDetails(k, timeZone);
      const data = entriesByDate.get(k);
      const hours = data ? Math.round((data.totalSec / 3600) * 10) / 10 : 0;
      list.push({
        key: k,
        details,
        hours,
        count: data?.count || 0,
      });
    }
    return list;
  }, [todayKey, timeZone, entriesByDate]);

  const activeDetails = useMemo(() => {
    return formatDateDetails(draftDateKey, timeZone);
  }, [draftDateKey, timeZone]);

  const handleApply = (key: string) => {
    onSelectDate(key);
    onClose();
  };

  const handlePrevDay = () => {
    setDraftDateKey((prev) => shiftDateKey(prev, -1));
  };

  const handleNextDay = () => {
    setDraftDateKey((prev) => shiftDateKey(prev, 1));
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-black/60 backdrop-blur-sm select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[420px] rounded-t-[34px] p-5 flex flex-col gap-4.5 tf-sheet max-h-[90vh] overflow-y-auto tf-scroll shadow-2xl"
        style={{
          background: 'linear-gradient(180deg, var(--tf-sheet1) 0%, var(--tf-sheet2) 100%)',
          borderTop: '1px solid rgba(var(--tf-surf-rgb), 0.16)',
          boxShadow: '0 -24px 60px -20px rgba(var(--tf-shadow-rgb), 0.95)',
          color: 'var(--tf-ink)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Grabber bar */}
        <div className="w-11 h-1.5 rounded-full bg-white/20 mx-auto -mt-1 mb-1" />

        {/* Sheet Top Header */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span
              style={{
                font: "600 10px/1 'JetBrains Mono', monospace",
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: 'rgba(var(--tf-ink-rgb), 0.45)',
              }}
            >
              Dashboard Date
            </span>
            <h3
              style={{
                font: '700 20px/1.2 Archivo, sans-serif',
                letterSpacing: '-0.02em',
                color: 'var(--tf-ink)',
              }}
            >
              Choose Day
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-xs opacity-70 hover:opacity-100 transition-all cursor-pointer"
            style={{ color: 'var(--tf-ink)' }}
          >
            ✕
          </button>
        </div>

        {/* Active Selected Day Hero Display & Stepper */}
        <div
          className="flex items-center justify-between p-3 rounded-[20px]"
          style={{
            background: 'rgba(var(--tf-surf-rgb), 0.04)',
            border: '1px solid rgba(var(--tf-surf-rgb), 0.11)',
          }}
        >
          <button
            onClick={handlePrevDay}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 active:scale-90 transition-all cursor-pointer select-none"
            style={{
              background: 'rgba(var(--tf-surf-rgb), 0.06)',
              border: '1px solid rgba(var(--tf-surf-rgb), 0.10)',
              color: 'rgba(var(--tf-ink-rgb), 0.65)',
              font: "500 13px 'JetBrains Mono', monospace",
            }}
            title="Previous Day"
          >
            ‹
          </button>

          <div className="flex flex-col items-center text-center px-2">
            <div className="flex items-center gap-1.5">
              <span
                style={{
                  font: "600 10.5px/1 'JetBrains Mono', monospace",
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: 'var(--tf-accent-ink)',
                }}
              >
                {activeDetails.relativeLabel}
              </span>
              {activeDetails.isToday && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              )}
            </div>
            <span
              style={{
                font: '700 20px/1.2 Archivo, sans-serif',
                letterSpacing: '-0.02em',
                color: 'var(--tf-ink)',
                marginTop: '2px',
              }}
            >
              {activeDetails.fullDate} {activeDetails.year}
            </span>
            <span
              style={{
                font: '400 11px/1 Archivo, sans-serif',
                color: 'rgba(var(--tf-ink-rgb), 0.48)',
                marginTop: '3px',
              }}
            >
              {entriesByDate.get(draftDateKey)
                ? `${entriesByDate.get(draftDateKey)?.count} entries logged · ${(entriesByDate.get(draftDateKey)!.totalSec / 3600).toFixed(1)}h`
                : 'No entries logged yet'}
            </span>
          </div>

          <button
            onClick={handleNextDay}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 active:scale-90 transition-all cursor-pointer select-none"
            style={{
              background: 'rgba(var(--tf-surf-rgb), 0.06)',
              border: '1px solid rgba(var(--tf-surf-rgb), 0.10)',
              color: 'rgba(var(--tf-ink-rgb), 0.65)',
              font: "500 13px 'JetBrains Mono', monospace",
            }}
            title="Next Day"
          >
            ›
          </button>
        </div>

        {/* Quick Date Shortcuts */}
        <div className="flex flex-col gap-1.5">
          <span
            style={{
              font: "600 10px/1 'JetBrains Mono', monospace",
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'rgba(var(--tf-ink-rgb), 0.45)',
            }}
          >
            Recent Days
          </span>
          <div className="grid grid-cols-2 gap-2">
            {quickDays.map((item) => {
              const isSelected = item.key === draftDateKey;
              return (
                <button
                  key={item.key}
                  onClick={() => setDraftDateKey(item.key)}
                  className="p-2.5 rounded-[18px] flex flex-col gap-1 text-left transition-all cursor-pointer"
                  style={{
                    background: isSelected
                      ? 'linear-gradient(135deg, rgba(56,189,248,.22), rgba(37,99,235,.14))'
                      : 'rgba(var(--tf-surf-rgb), 0.045)',
                    border: `1px solid ${isSelected ? 'rgba(56,189,248,.55)' : 'rgba(var(--tf-surf-rgb), 0.10)'}`,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span
                      style={{
                        font: '600 12.5px/1 Archivo, sans-serif',
                        color: isSelected ? 'var(--tf-accent-ink)' : 'var(--tf-ink)',
                      }}
                    >
                      {item.details.relativeLabel}
                    </span>
                    {item.details.isToday && (
                      <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-emerald-400/15 text-emerald-400">
                        Today
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-[11px] opacity-60">
                    <span>{item.details.shortDate}</span>
                    <span className="font-mono">{item.hours > 0 ? `${item.hours}h` : '0h'}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Direct Calendar Picker Input */}
        <div className="flex flex-col gap-1.5">
          <span
            style={{
              font: "600 10px/1 'JetBrains Mono', monospace",
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'rgba(var(--tf-ink-rgb), 0.45)',
            }}
          >
            Jump to Specific Date
          </span>
          <div
            className="flex items-center gap-2 p-2.5 rounded-[18px]"
            style={{
              background: 'rgba(var(--tf-surf-rgb), 0.05)',
              border: '1px solid rgba(var(--tf-surf-rgb), 0.12)',
            }}
          >
            <input
              type="date"
              value={draftDateKey}
              onChange={(e) => {
                if (e.target.value) {
                  setDraftDateKey(e.target.value);
                }
              }}
              className="flex-1 bg-transparent text-sm font-medium outline-none cursor-pointer"
              style={{
                color: 'var(--tf-ink)',
                colorScheme: 'dark',
              }}
            />
            {draftDateKey !== todayKey && (
              <button
                onClick={() => setDraftDateKey(todayKey)}
                className="px-2.5 py-1 rounded-full text-xs font-semibold hover:bg-white/10 transition-all cursor-pointer"
                style={{
                  background: 'rgba(56,189,248,.15)',
                  color: 'var(--tf-accent-ink)',
                  border: '1px solid rgba(56,189,248,.3)',
                }}
              >
                Today
              </button>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 mt-2">
          <button
            onClick={() => handleApply(draftDateKey)}
            className="flex-1 h-[50px] rounded-full text-white font-bold transition-all hover:brightness-110 active:scale-[0.98] cursor-pointer flex items-center justify-center shadow-lg"
            style={{
              font: '700 15px/1 Archivo, sans-serif',
              background: 'linear-gradient(135deg, rgba(56,189,248, 0.8), rgba(37,99,235, 0.8))',
              border: '1px solid rgba(56,189,248, 0.9)',
              boxShadow: '0 8px 24px -10px rgba(56,189,248, 0.5)',
            }}
          >
            View Dashboard for {activeDetails.shortDate}
          </button>
        </div>
      </div>
    </div>
  );
};
