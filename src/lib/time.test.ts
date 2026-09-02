import { describe, it, expect } from 'vitest';
import {
  localDateKey,
  dayBounds,
  formatClock,
  shiftDateKey,
  fmt,
  fmtClock,
  startOfWeek,
} from './time';
import { finishToEntries } from '../timer/engine';

describe('Time Library & Timezone Support', () => {
  it('formats clock in 12-hour and 24-hour modes', () => {
    // 2026-06-15T19:42:00Z in America/New_York is 15:42 (3:42 pm) EDT
    const epochMs = new Date('2026-06-15T19:42:00Z').getTime();

    const formatted12 = formatClock(epochMs, {
      timeZone: 'America/New_York',
      hourFormat: 12,
    });
    expect(formatted12).toBe('3:42 pm');

    const formatted24 = formatClock(epochMs, {
      timeZone: 'America/New_York',
      hourFormat: 24,
    });
    expect(formatted24).toBe('15:42');

    // In UTC: 19:42 (7:42 pm)
    const formattedUtc12 = formatClock(epochMs, {
      timeZone: 'UTC',
      hourFormat: 12,
    });
    expect(formattedUtc12).toBe('7:42 pm');

    const formattedUtc24 = formatClock(epochMs, {
      timeZone: 'UTC',
      hourFormat: 24,
    });
    expect(formattedUtc24).toBe('19:42');
  });

  it('computes correct localDateKey across different timezones', () => {
    // 2026-01-01 02:00:00 UTC
    // In America/New_York: 2025-12-31 (prev day 21:00 EST)
    // In Asia/Tokyo: 2026-01-01 (same day 11:00 JST)
    const ms = new Date('2026-01-01T02:00:00Z').getTime();

    expect(localDateKey(ms, 'America/New_York')).toBe('2025-12-31');
    expect(localDateKey(ms, 'Asia/Tokyo')).toBe('2026-01-01');
    expect(localDateKey(ms, 'UTC')).toBe('2026-01-01');
  });

  it('computes dayBounds accurately including DST spring-forward', () => {
    // In US (America/New_York), spring-forward occurred on 2026-03-08 (23 hours day)
    const bounds = dayBounds('2026-03-08', 'America/New_York');
    const dayDurationHours = (bounds.endMs - bounds.startMs) / 3600000;
    expect(dayDurationHours).toBe(23);

    // Standard day is 24 hours
    const standardBounds = dayBounds('2026-06-15', 'America/New_York');
    const standardDurationHours = (standardBounds.endMs - standardBounds.startMs) / 3600000;
    expect(standardDurationHours).toBe(24);
  });

  it('splits overnight entries correctly in America/New_York and Asia/Tokyo', () => {
    // Session runs from 2026-05-10 22:30 EDT to 2026-05-11 02:30 EDT
    // Started at 2026-05-11 02:30 UTC, ended at 2026-05-11 06:30 UTC
    const startMs = new Date('2026-05-11T02:30:00Z').getTime();
    const endMs = new Date('2026-05-11T06:30:00Z').getTime();

    const timer = {
      activityId: 'act-sleep',
      startedAtMs: startMs,
      accumulatedPauseMs: 0,
      pausedAtMs: null,
      notes: [],
    };

    // In America/New_York: crosses midnight between 2026-05-10 and 2026-05-11
    const nySplits = finishToEntries(
      timer,
      endMs,
      (k) => dayBounds(k, 'America/New_York'),
      (ms) => localDateKey(ms, 'America/New_York')
    );
    expect(nySplits).toHaveLength(2);
    expect(nySplits[0].localDate).toBe('2026-05-10');
    expect(nySplits[1].localDate).toBe('2026-05-11');
    expect(nySplits[0].durationSec + nySplits[1].durationSec).toBe(4 * 3600);

    // In Asia/Tokyo: 2026-05-11 11:30 JST to 15:30 JST (all on 2026-05-11)
    const tokyoSplits = finishToEntries(
      timer,
      endMs,
      (k) => dayBounds(k, 'Asia/Tokyo'),
      (ms) => localDateKey(ms, 'Asia/Tokyo')
    );
    expect(tokyoSplits).toHaveLength(1);
    expect(tokyoSplits[0].localDate).toBe('2026-05-11');
    expect(tokyoSplits[0].durationSec).toBe(4 * 3600);
  });

  it('shifts date keys and calculates week starts properly', () => {
    expect(shiftDateKey('2026-01-01', 5)).toBe('2026-01-06');
    expect(shiftDateKey('2026-03-01', -1)).toBe('2026-02-28');
    // Monday of a known date
    const monday = startOfWeek('2026-09-02'); // Sep 2, 2026 is Wednesday -> Mon is Aug 31
    expect(monday).toBe('2026-08-31');
  });
});
