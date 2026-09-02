import { z } from 'zod';
import {
  Category,
  Activity,
  TimeEntry,
  TimerState,
  Budget,
  DailyReflection,
  UserSettings,
  DataEnvelope,
  EntryNote,
} from '../types';

export const categoryKindSchema = z.enum(['fixed', 'flexible', 'rest']);

export const categorySchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  emoji: z.string(),
  color: z.string(),
  kind: categoryKindSchema,
  description: z.string().optional(),
  isCustom: z.boolean().optional(),
});

export const activitySchema = z.object({
  id: z.string(),
  categoryId: z.string(),
  name: z.string().min(1),
  isFavorite: z.boolean(),
  isArchived: z.boolean(),
});

export const entryNoteSchema = z.object({
  id: z.string(),
  text: z.string().max(1000),
  createdAtMs: z.number(),
});

export const timeEntrySchema = z.object({
  id: z.string(),
  activityId: z.string(),
  activityName: z.string(),
  categoryName: z.string(),
  categoryKind: categoryKindSchema,
  categoryColor: z.string(),
  emoji: z.string(),
  startedAtMs: z.number(),
  endedAtMs: z.number(),
  durationSec: z.number(),
  localDate: z.string(),
  note: z.string().optional(),
  notes: z.array(entryNoteSchema).max(50).default([]),
  valueRating: z.number().optional(),
});

export const timerStateSchema = z.object({
  activityId: z.string(),
  startedAtMs: z.number(),
  accumulatedPauseMs: z.number().default(0),
  pausedAtMs: z.number().nullable().default(null),
  mode: z.enum(['continuous', 'pomodoro']).optional(),
  targetIntervalSec: z.number().optional(),
  intervalState: z.enum(['focus', 'rest']).optional(),
  completedIntervals: z.number().optional(),
  notes: z.array(entryNoteSchema).max(50).default([]),
});

export const budgetSchema = z.object({
  id: z.string(),
  categoryId: z.string(),
  period: z.enum(['daily', 'weekly']),
  targetSec: z.number(),
  direction: z.enum(['max', 'min']).optional(),
  type: z.enum(['min', 'max', 'target']).optional(),
});

export const dailyReflectionSchema = z.object({
  dateKey: z.string(),
  question: z.string(),
  answer: z.string(),
  closedAtMs: z.number(),
  moodRating: z.number().optional(),
});

export const userSettingsSchema = z.object({
  soundEnabled: z.boolean().default(true),
  hapticsEnabled: z.boolean().default(true),
  defaultFocusMinutes: z.number().default(25),
  timeZone: z.string().default('America/New_York'),
  hourFormat: z.union([z.literal(12), z.literal(24)]).default(12),
  priorityCategoryIds: z.array(z.string()).optional(),
});

export const dataEnvelopeSchema = z.object({
  version: z.literal(4),
  exportedAt: z.string(),
  categories: z.array(categorySchema),
  activities: z.array(activitySchema),
  budgets: z.array(budgetSchema),
  entries: z.array(timeEntrySchema),
  reflections: z.array(dailyReflectionSchema),
  settings: userSettingsSchema,
  timer: timerStateSchema.nullable().optional(),
});

/**
 * Backup schema with passthrough and lenient defaults so older or future backups parse cleanly
 */
export const backupSchema = z
  .object({
    version: z.union([z.string(), z.number()]).optional(),
    exportedAt: z.string().optional(),
    categories: z.array(z.record(z.string(), z.any())).default([]),
    activities: z.array(z.record(z.string(), z.any())).default([]),
    budgets: z.array(z.record(z.string(), z.any())).default([]),
    entries: z.array(z.record(z.string(), z.any())).default([]),
    reflections: z.array(z.record(z.string(), z.any())).default([]),
    settings: z.record(z.string(), z.any()).optional(),
    timer: z.record(z.string(), z.any()).nullable().optional(),
  })
  .passthrough();

/**
 * Migrate raw or older version payload (twentyfour_v2, v3, etc.) to pure v4 DataEnvelope
 */
export function migrateToV4(raw: unknown): DataEnvelope {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Invalid backup payload: expected an object');
  }

  const parsed = backupSchema.parse(raw);

  // Settings migration
  const rawSettings = parsed.settings || {};
  const settings: UserSettings = {
    soundEnabled: typeof rawSettings.soundEnabled === 'boolean' ? rawSettings.soundEnabled : true,
    hapticsEnabled: typeof rawSettings.hapticsEnabled === 'boolean' ? rawSettings.hapticsEnabled : true,
    defaultFocusMinutes: typeof rawSettings.defaultFocusMinutes === 'number' ? rawSettings.defaultFocusMinutes : 25,
    timeZone: typeof rawSettings.timeZone === 'string' && rawSettings.timeZone.trim() ? rawSettings.timeZone.trim() : 'America/New_York',
    hourFormat: rawSettings.hourFormat === 24 ? 24 : 12,
    priorityCategoryIds: Array.isArray(rawSettings.priorityCategoryIds) ? rawSettings.priorityCategoryIds : undefined,
  };

  // Categories migration
  const categories: Category[] = parsed.categories.map((c: any) => ({
    id: String(c.id || 'cat-' + Math.random().toString(36).substring(2, 7)),
    name: String(c.name || 'Untitled Category'),
    emoji: String(c.emoji || '📁'),
    color: String(c.color || '#38BDF8'),
    kind: (c.kind === 'fixed' || c.kind === 'rest' || c.kind === 'flexible') ? c.kind : 'flexible',
    description: c.description ? String(c.description) : undefined,
    isCustom: Boolean(c.isCustom),
  }));

  // Activities migration
  const activities: Activity[] = parsed.activities.map((a: any) => ({
    id: String(a.id || 'act-' + Math.random().toString(36).substring(2, 7)),
    categoryId: String(a.categoryId || (categories[0]?.id ?? 'cat-work')),
    name: String(a.name || 'Untitled Activity'),
    isFavorite: Boolean(a.isFavorite),
    isArchived: Boolean(a.isArchived),
  }));

  // Entries migration (convert single note to notes array)
  const entries: TimeEntry[] = parsed.entries.map((e: any) => {
    let notes: EntryNote[] = [];
    if (Array.isArray(e.notes) && e.notes.length > 0) {
      notes = e.notes
        .slice(0, 50)
        .map((n: any, idx: number) => ({
          id: String(n.id || `note-${e.id || 'e'}-${idx}`),
          text: String(n.text || '').slice(0, 1000),
          createdAtMs: typeof n.createdAtMs === 'number' ? n.createdAtMs : Number(e.endedAtMs || e.startedAtMs || Date.now()),
        }));
    } else if (typeof e.note === 'string' && e.note.trim().length > 0) {
      notes = [
        {
          id: `note-${e.id || 'e'}-0`,
          text: e.note.trim().slice(0, 1000),
          createdAtMs: typeof e.endedAtMs === 'number' ? e.endedAtMs : Number(e.startedAtMs || Date.now()),
        },
      ];
    }

    return {
      id: String(e.id || 'entry-' + Math.random().toString(36).substring(2, 7)),
      activityId: String(e.activityId || ''),
      activityName: String(e.activityName || 'Activity'),
      categoryName: String(e.categoryName || 'General'),
      categoryKind: (e.categoryKind === 'fixed' || e.categoryKind === 'rest' || e.categoryKind === 'flexible') ? e.categoryKind : 'flexible',
      categoryColor: String(e.categoryColor || '#38BDF8'),
      emoji: String(e.emoji || '⏱️'),
      startedAtMs: Number(e.startedAtMs || Date.now()),
      endedAtMs: Number(e.endedAtMs || Date.now()),
      durationSec: typeof e.durationSec === 'number' ? e.durationSec : Math.max(1, Math.round(((e.endedAtMs || Date.now()) - (e.startedAtMs || Date.now())) / 1000)),
      localDate: String(e.localDate || new Date(Number(e.startedAtMs || Date.now())).toISOString().slice(0, 10)),
      notes,
      valueRating: typeof e.valueRating === 'number' ? e.valueRating : undefined,
    };
  });

  // Budgets migration
  const budgets: Budget[] = parsed.budgets.map((b: any) => ({
    id: String(b.id || 'budget-' + Math.random().toString(36).substring(2, 7)),
    categoryId: String(b.categoryId || ''),
    period: b.period === 'weekly' ? 'weekly' : 'daily',
    targetSec: Number(b.targetSec || 0),
    direction: b.direction === 'min' ? 'min' : 'max',
    type: b.type === 'min' ? 'min' : b.type === 'target' ? 'target' : 'max',
  }));

  // Reflections migration
  const reflections: DailyReflection[] = parsed.reflections.map((r: any) => ({
    dateKey: String(r.dateKey || ''),
    question: String(r.question || ''),
    answer: String(r.answer || ''),
    closedAtMs: Number(r.closedAtMs || Date.now()),
    moodRating: typeof r.moodRating === 'number' ? r.moodRating : undefined,
  }));

  // Timer migration
  let timer: TimerState | null = null;
  if (parsed.timer && typeof parsed.timer === 'object' && parsed.timer.activityId) {
    const rawTimer = parsed.timer;
    const timerNotes: EntryNote[] = Array.isArray(rawTimer.notes)
      ? rawTimer.notes.slice(0, 50).map((n: any, idx: number) => ({
          id: String(n.id || `timer-note-${idx}`),
          text: String(n.text || '').slice(0, 1000),
          createdAtMs: typeof n.createdAtMs === 'number' ? n.createdAtMs : Date.now(),
        }))
      : [];

    timer = {
      activityId: String(rawTimer.activityId),
      startedAtMs: Number(rawTimer.startedAtMs || Date.now()),
      accumulatedPauseMs: Number(rawTimer.accumulatedPauseMs || 0),
      pausedAtMs: typeof rawTimer.pausedAtMs === 'number' ? rawTimer.pausedAtMs : null,
      mode: rawTimer.mode === 'pomodoro' ? 'pomodoro' : 'continuous',
      targetIntervalSec: typeof rawTimer.targetIntervalSec === 'number' ? rawTimer.targetIntervalSec : undefined,
      intervalState: rawTimer.intervalState === 'rest' ? 'rest' : 'focus',
      completedIntervals: typeof rawTimer.completedIntervals === 'number' ? rawTimer.completedIntervals : 0,
      notes: timerNotes,
    };
  }

  const envelope: DataEnvelope = {
    version: 4,
    exportedAt: parsed.exportedAt || new Date().toISOString(),
    categories,
    activities,
    budgets,
    entries,
    reflections,
    settings,
    timer,
  };

  // Validate the resulting envelope through the strict schema
  return dataEnvelopeSchema.parse(envelope) as DataEnvelope;
}
