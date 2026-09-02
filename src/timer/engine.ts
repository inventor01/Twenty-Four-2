import { TimerState, TimerMode } from '../types';

export type SplitEntry = {
  localDate: string;
  startedAtMs: number;
  endedAtMs: number;
  durationSec: number;
};

/** Pure. Survives app kill, reboot, TZ change, DST. */
export function elapsedMs(s: TimerState, nowMs: number): number {
  const pausedDelta = s.pausedAtMs != null ? Math.max(0, nowMs - s.pausedAtMs) : 0;
  return Math.max(0, nowMs - s.startedAtMs - s.accumulatedPauseMs - pausedDelta);
}

export function startTimer(
  activityId: string,
  nowMs: number,
  mode: TimerMode = 'continuous',
  targetIntervalSec: number = 25 * 60
): TimerState {
  return {
    activityId,
    startedAtMs: nowMs,
    accumulatedPauseMs: 0,
    pausedAtMs: null,
    mode,
    targetIntervalSec,
    intervalState: 'focus',
    completedIntervals: 0,
    notes: [],
  };
}

export function pauseTimer(s: TimerState, nowMs: number): TimerState {
  return s.pausedAtMs != null ? s : { ...s, pausedAtMs: nowMs };
}

export function resumeTimer(s: TimerState, nowMs: number): TimerState {
  if (s.pausedAtMs == null) return s;
  return {
    ...s,
    accumulatedPauseMs: s.accumulatedPauseMs + (nowMs - s.pausedAtMs),
    pausedAtMs: null,
  };
}

/** Split a finished session at local midnights into per-day entries. */
export function finishToEntries(
  s: TimerState,
  endedMs: number,
  boundsFor: (key: string) => { startMs: number; endMs: number },
  dateKeyOf: (ms: number) => string
): SplitEntry[] {
  const out: SplitEntry[] = [];
  let cursor = s.startedAtMs;
  let guard = 0;
  while (cursor < endedMs && guard++ < 400) {
    const key = dateKeyOf(cursor);
    const { endMs } = boundsFor(key);
    const chunkEnd = Math.min(endMs, endedMs);
    if (chunkEnd > cursor) {
      out.push({
        localDate: key,
        startedAtMs: cursor,
        endedAtMs: chunkEnd,
        durationSec: Math.max(1, Math.round((chunkEnd - cursor) / 1000)),
      });
      cursor = chunkEnd;
    } else {
      cursor += 1; // DST anomaly guard: never loop forever
    }
  }
  return out;
}
