import { describe, it, expect } from 'vitest';
import {
  startTimer,
  pauseTimer,
  resumeTimer,
  elapsedMs,
  finishToEntries,
} from './engine';

describe('Timer Engine', () => {
  it('initializes timer with empty notes', () => {
    const timer = startTimer('act-1', 1000000);
    expect(timer.activityId).toBe('act-1');
    expect(timer.startedAtMs).toBe(1000000);
    expect(timer.notes).toEqual([]);
    expect(timer.pausedAtMs).toBeNull();
  });

  it('calculates elapsed time including pauses accurately', () => {
    const t0 = 1000000;
    let timer = startTimer('act-1', t0);

    // 10s elapsed
    expect(elapsedMs(timer, t0 + 10000)).toBe(10000);

    // Pause at +10s
    timer = pauseTimer(timer, t0 + 10000);
    expect(elapsedMs(timer, t0 + 15000)).toBe(10000); // clock paused

    // Resume at +20s (paused for 10s total)
    timer = resumeTimer(timer, t0 + 20000);
    expect(timer.accumulatedPauseMs).toBe(10000);

    // Check at +30s (total elapsed active work is 20s)
    expect(elapsedMs(timer, t0 + 30000)).toBe(20000);
  });
});
