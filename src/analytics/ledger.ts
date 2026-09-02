import { TimeEntry } from '../types';

export function trackedSec(entries: TimeEntry[]): number {
  return entries.reduce((t, e) => t + e.durationSec, 0);
}

export function untrackedSec(entries: TimeEntry[], trackedSeconds?: number): number {
  const actualTracked = trackedSeconds !== undefined ? trackedSeconds : trackedSec(entries);
  return Math.max(0, 24 * 3600 - actualTracked);
}

export function byCategory(entries: TimeEntry[]): { name: string; sec: number; color: string; emoji: string; kind: string; percentage: number }[] {
  const map = new Map<string, { sec: number; color: string; emoji: string; kind: string }>();
  const total = trackedSec(entries);

  for (const e of entries) {
    const key = e.categoryName;
    const curr = map.get(key) || { sec: 0, color: e.categoryColor, emoji: e.emoji, kind: e.categoryKind };
    curr.sec += e.durationSec;
    map.set(key, curr);
  }

  return [...map.entries()]
    .map(([name, val]) => ({
      name,
      sec: val.sec,
      color: val.color,
      emoji: val.emoji,
      kind: val.kind,
      percentage: total > 0 ? Math.round((val.sec / total) * 100) : 0,
    }))
    .sort((a, b) => b.sec - a.sec);
}

/** Time That Matters: priority time / discretionary tracked time. Fixed time excluded. */
export function mattersScore(
  entries: TimeEntry[],
  priorityCategories: string[] = ['Health', 'Learning', 'Family', 'Work']
): {
  score: number;
  prioritySec: number;
  discretionarySec: number;
  fixedSec: number;
  restSec: number;
} {
  const prios = new Set(priorityCategories);
  const prioritySec = entries
    .filter((e) => prios.has(e.categoryName))
    .reduce((t, e) => t + e.durationSec, 0);

  const discretionarySec = entries
    .filter((e) => e.categoryKind !== 'fixed')
    .reduce((t, e) => t + e.durationSec, 0);

  const fixedSec = entries
    .filter((e) => e.categoryKind === 'fixed')
    .reduce((t, e) => t + e.durationSec, 0);

  const restSec = entries
    .filter((e) => e.categoryKind === 'rest')
    .reduce((t, e) => t + e.durationSec, 0);

  const score = discretionarySec === 0 ? 0 : Math.min(100, Math.round((prioritySec / discretionarySec) * 100));

  return { score, prioritySec, discretionarySec, fixedSec, restSec };
}
