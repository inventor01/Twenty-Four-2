import { describe, it, expect } from 'vitest';
import { trackedSec, untrackedSec, byCategory, mattersScore } from './ledger';
import { TimeEntry } from '../types';

describe('Ledger Analytics Engine', () => {
  const sampleEntries: TimeEntry[] = [
    {
      id: 'e1',
      activityId: 'act-1',
      activityName: 'Coding',
      categoryName: 'Work',
      categoryKind: 'flexible',
      categoryColor: '#38BDF8',
      emoji: '💼',
      startedAtMs: 1000,
      endedAtMs: 5000,
      durationSec: 4 * 3600, // 4 hours
      localDate: '2026-09-02',
      notes: [],
    },
    {
      id: 'e2',
      activityId: 'act-2',
      activityName: 'Running',
      categoryName: 'Health',
      categoryKind: 'rest',
      categoryColor: '#F59E0B',
      emoji: '💪',
      startedAtMs: 6000,
      endedAtMs: 8000,
      durationSec: 2 * 3600, // 2 hours
      localDate: '2026-09-02',
      notes: [{ id: 'n1', text: '5k morning run', createdAtMs: 8000 }],
    },
    {
      id: 'e3',
      activityId: 'act-3',
      activityName: 'Cleaning',
      categoryName: 'Chores',
      categoryKind: 'fixed',
      categoryColor: '#94A3B8',
      emoji: '🧺',
      startedAtMs: 9000,
      endedAtMs: 10000,
      durationSec: 1 * 3600, // 1 hour
      localDate: '2026-09-02',
      notes: [],
    },
  ];

  it('calculates total tracked and untracked seconds accurately', () => {
    const total = trackedSec(sampleEntries);
    expect(total).toBe(7 * 3600); // 7 hours
    expect(untrackedSec(sampleEntries)).toBe(17 * 3600); // 24 - 7 = 17 hours
  });

  it('aggregates breakdown by category', () => {
    const breakdown = byCategory(sampleEntries);
    expect(breakdown).toHaveLength(3);
    expect(breakdown[0].name).toBe('Work');
    expect(breakdown[0].sec).toBe(4 * 3600);
    expect(breakdown[1].name).toBe('Health');
    expect(breakdown[1].sec).toBe(2 * 3600);
    expect(breakdown[2].name).toBe('Chores');
    expect(breakdown[2].sec).toBe(1 * 3600);
  });

  it('computes Matters Score accurately excluding fixed time', () => {
    const res = mattersScore(sampleEntries, ['Work', 'Health']);
    // Priority: Work (4h) + Health (2h) = 6h = 21600s
    // Discretionary (non-fixed): Work (4h) + Health (2h) = 6h = 21600s
    // Fixed: Chores (1h) = 3600s
    expect(res.prioritySec).toBe(6 * 3600);
    expect(res.discretionarySec).toBe(6 * 3600);
    expect(res.fixedSec).toBe(1 * 3600);
    expect(res.score).toBe(100);
  });
});
