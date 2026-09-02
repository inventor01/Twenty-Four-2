import {
  Category,
  Activity,
  TimeEntry,
  TimerState,
  Budget,
  DailyReflection,
  TimerMode,
  UserSettings,
  EntryNote,
  CreateCategoryInput,
  UpdateCategoryInput,
  CategoryDeleteStrategy,
  CategoryDeleteSummary,
  DataEnvelope,
} from '../types';
import {
  localDateKey,
  dayBounds,
  shiftDateKey,
  formatClock,
  hhmm,
  fmt,
  DEFAULT_TIME_ZONE,
} from '../lib/time';
import { startTimer, pauseTimer, resumeTimer, finishToEntries } from '../timer/engine';
import { migrateToV4, entryNoteSchema } from './schema';
import { mirrorToIndexedDb, loadFromIndexedDb } from './indexedDb';

const STORAGE_KEYS = {
  CATEGORIES: 'twentyfour_categories_v1',
  ACTIVITIES: 'twentyfour_activities_v1',
  TIMER: 'twentyfour_timer_v1',
  ENTRIES: 'twentyfour_entries_v1',
  BUDGETS: 'twentyfour_budgets_v1',
  REFLECTIONS: 'twentyfour_reflections_v1',
  SETTINGS: 'twentyfour_settings_v1',
};

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-sleep', name: 'Rest & Sleep', emoji: '😴', color: '#818CF8', kind: 'rest' },
  { id: 'cat-work', name: 'Deep Focus & Flow', emoji: '💼', color: '#38BDF8', kind: 'flexible' },
  { id: 'cat-family', name: 'Presence & Loved Ones', emoji: '🏡', color: '#34D399', kind: 'rest' },
  { id: 'cat-health', name: 'Movement & Vitality', emoji: '💪', color: '#F59E0B', kind: 'rest' },
  { id: 'cat-learning', name: 'Reading & Wisdom', emoji: '📚', color: '#60A5FA', kind: 'flexible' },
  { id: 'cat-entertainment', name: 'Leisure & Unwind', emoji: '🎬', color: '#A78BFA', kind: 'flexible' },
  { id: 'cat-social', name: 'Social & Feeds', emoji: '📱', color: '#FB7185', kind: 'flexible' },
  { id: 'cat-chores', name: 'Chores & Upkeep', emoji: '🧺', color: '#94A3B8', kind: 'fixed' },
];

const DEFAULT_ACTIVITIES: Activity[] = [
  { id: 'act-sleep', categoryId: 'cat-sleep', name: 'Restful Sleep', isFavorite: true, isArchived: false },
  { id: 'act-work', categoryId: 'cat-work', name: 'Work & Projects', isFavorite: true, isArchived: false },
  { id: 'act-deep-work', categoryId: 'cat-work', name: 'Deep Flow Session', isFavorite: true, isArchived: false },
  { id: 'act-family', categoryId: 'cat-family', name: 'Family & Friends', isFavorite: true, isArchived: false },
  { id: 'act-health', categoryId: 'cat-health', name: 'Exercise & Movement', isFavorite: true, isArchived: false },
  { id: 'act-walk', categoryId: 'cat-health', name: 'Mindful Walk Outdoors', isFavorite: false, isArchived: false },
  { id: 'act-learning', categoryId: 'cat-learning', name: 'Reading & Growth', isFavorite: false, isArchived: false },
  { id: 'act-entertainment', categoryId: 'cat-entertainment', name: 'Leisure & Streaming', isFavorite: false, isArchived: false },
  { id: 'act-social', categoryId: 'cat-social', name: 'Social Feeds & Browsing', isFavorite: false, isArchived: false },
  { id: 'act-chores', categoryId: 'cat-chores', name: 'Home Care & Meals', isFavorite: false, isArchived: false },
];

const DEFAULT_BUDGETS: Budget[] = [
  { id: 'b-social-weekly', categoryId: 'cat-social', period: 'weekly', targetSec: 5 * 3600, type: 'max', direction: 'max' },
  { id: 'b-health-weekly', categoryId: 'cat-health', period: 'weekly', targetSec: 5 * 3600, type: 'min', direction: 'min' },
  { id: 'b-work-daily', categoryId: 'cat-work', period: 'daily', targetSec: 8 * 3600, type: 'max', direction: 'max' },
];

const DEFAULT_SETTINGS: UserSettings = {
  soundEnabled: true,
  hapticsEnabled: true,
  defaultFocusMinutes: 25,
  timeZone: 'America/New_York',
  hourFormat: 12,
  priorityCategoryIds: ['cat-sleep', 'cat-work', 'cat-family', 'cat-health'],
};

type ChangeListener = () => void;
const listeners = new Set<ChangeListener>();

function notifyListeners() {
  listeners.forEach((fn) => {
    try {
      fn();
    } catch (err) {
      console.error('Store listener error:', err);
    }
  });
  // Async mirror to IndexedDB
  try {
    mirrorToIndexedDb(getDataEnvelope());
  } catch (err) {
    console.warn('IndexedDB auto-mirror failed:', err);
  }
}

export function subscribeToStore(fn: ChangeListener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function getItem<T>(key: string, fallback: T): T {
  try {
    if (typeof localStorage === 'undefined') return fallback;
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Error reading ${key} from storage:`, err);
    return fallback;
  }
}

function setItem<T>(key: string, val: T): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(val));
    }
    notifyListeners();
  } catch (err) {
    console.error(`Error saving ${key} to storage:`, err);
  }
}

// Initial bootstrap
export function initStore(): void {
  if (typeof localStorage === 'undefined') return;

  const hasCategories = Boolean(localStorage.getItem(STORAGE_KEYS.CATEGORIES));
  const hasEntries = Boolean(localStorage.getItem(STORAGE_KEYS.ENTRIES));

  if (!hasCategories && !hasEntries) {
    // Attempt cold-start recovery from IndexedDB
    loadFromIndexedDb().then((recovered) => {
      if (recovered && recovered.categories && recovered.categories.length > 0) {
        if (recovered.categories) localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(recovered.categories));
        if (recovered.activities) localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(recovered.activities));
        if (recovered.budgets) localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(recovered.budgets));
        if (recovered.entries) localStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(recovered.entries));
        if (recovered.reflections) localStorage.setItem(STORAGE_KEYS.REFLECTIONS, JSON.stringify(recovered.reflections));
        if (recovered.settings) localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(recovered.settings));
        if (recovered.timer) localStorage.setItem(STORAGE_KEYS.TIMER, JSON.stringify(recovered.timer));
        notifyListeners();
        return;
      }
      // If no IndexedDB data found, seed defaults
      bootstrapDefaults();
    }).catch(() => {
      bootstrapDefaults();
    });
  } else {
    bootstrapDefaults();
  }
}

function bootstrapDefaults(): void {
  if (typeof localStorage === 'undefined') return;

  if (!localStorage.getItem(STORAGE_KEYS.CATEGORIES)) {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(DEFAULT_CATEGORIES));
  }
  if (!localStorage.getItem(STORAGE_KEYS.ACTIVITIES)) {
    localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(DEFAULT_ACTIVITIES));
  }
  if (!localStorage.getItem(STORAGE_KEYS.BUDGETS)) {
    localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(DEFAULT_BUDGETS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.ENTRIES)) {
    seedSampleLedgerData();
  }
}

// Settings methods
export function getStoredSettings(): UserSettings {
  const current = getItem<UserSettings>(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
  return {
    soundEnabled: current.soundEnabled ?? true,
    hapticsEnabled: current.hapticsEnabled ?? true,
    defaultFocusMinutes: current.defaultFocusMinutes ?? 25,
    timeZone: current.timeZone || 'America/New_York',
    hourFormat: current.hourFormat === 24 ? 24 : 12,
    priorityCategoryIds: current.priorityCategoryIds || DEFAULT_SETTINGS.priorityCategoryIds,
  };
}

export function saveStoredSettings(settings: UserSettings): void {
  setItem(STORAGE_KEYS.SETTINGS, settings);
}

/**
 * Re-derives localDate for all existing entries and re-splits overnight entries at new midnights
 */
export function recomputeLocalDates(zone: string): void {
  const settings = getStoredSettings();
  settings.timeZone = zone;

  const entries = getAllEntries();
  const acts = getAllActivities();
  const cats = getCategories();
  const newEntries: TimeEntry[] = [];

  for (const entry of entries) {
    const splits = finishToEntries(
      {
        activityId: entry.activityId,
        startedAtMs: entry.startedAtMs,
        accumulatedPauseMs: 0,
        pausedAtMs: null,
        notes: entry.notes || [],
      },
      entry.endedAtMs,
      (k) => dayBounds(k, zone),
      (ms) => localDateKey(ms, zone)
    );

    if (splits.length <= 1) {
      newEntries.push({
        ...entry,
        localDate: localDateKey(entry.startedAtMs, zone),
      });
    } else {
      // Re-split across multiple days in the new timezone
      splits.forEach((sp, idx) => {
        newEntries.push({
          id: idx === 0 ? entry.id : `entry-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          activityId: entry.activityId,
          activityName: entry.activityName,
          categoryName: entry.categoryName,
          categoryKind: entry.categoryKind,
          categoryColor: entry.categoryColor,
          emoji: entry.emoji,
          startedAtMs: sp.startedAtMs,
          endedAtMs: sp.endedAtMs,
          durationSec: sp.durationSec,
          localDate: sp.localDate,
          notes: idx === 0 ? entry.notes : [],
          valueRating: entry.valueRating,
        });
      });
    }
  }

  // Atomically update settings and entries
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    localStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(newEntries));
  }
  notifyListeners();
}

// Category methods
export function getCategories(): Category[] {
  return getItem<Category[]>(STORAGE_KEYS.CATEGORIES, DEFAULT_CATEGORIES);
}

export function createCategory(input: CreateCategoryInput): Category {
  const id = 'cat-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
  const newCategory: Category = {
    id,
    name: input.name.trim(),
    emoji: input.emoji.trim() || '📁',
    color: input.color || '#38BDF8',
    kind: input.kind,
    description: input.description?.trim(),
    isCustom: true,
  };

  const cats = getCategories();
  cats.push(newCategory);

  // Automatically create one default activity so it is immediately loggable
  const newActivity: Activity = {
    id: 'act-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    categoryId: id,
    name: input.name.trim(),
    isFavorite: true,
    isArchived: false,
  };

  const acts = getAllActivities();
  acts.push(newActivity);

  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(cats));
    localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(acts));
  }
  notifyListeners();
  return newCategory;
}

export function saveCategory(category: Category): void {
  const cats = getCategories();
  const index = cats.findIndex((c) => c.id === category.id);
  if (index >= 0) {
    cats[index] = category;
  } else {
    cats.push(category);
  }
  setItem(STORAGE_KEYS.CATEGORIES, cats);
}

export function updateCategory(id: string, patch: UpdateCategoryInput): Category | null {
  const cats = getCategories();
  const cat = cats.find((c) => c.id === id);
  if (!cat) return null;

  const oldName = cat.name;
  if (patch.name !== undefined) cat.name = patch.name.trim();
  if (patch.emoji !== undefined) cat.emoji = patch.emoji.trim();
  if (patch.color !== undefined) cat.color = patch.color;
  if (patch.kind !== undefined) cat.kind = patch.kind;
  if (patch.description !== undefined) cat.description = patch.description.trim();

  // Propagate category changes (name, color, emoji, kind) to existing TimeEntry snapshots
  const activities = getAllActivities();
  const categoryActivityIds = new Set(
    activities.filter((a) => a.categoryId === id).map((a) => a.id)
  );

  const entries = getAllEntries();
  let entriesModified = false;
  for (const entry of entries) {
    if (categoryActivityIds.has(entry.activityId) || entry.categoryName === oldName) {
      entry.categoryName = cat.name;
      entry.categoryColor = cat.color;
      entry.emoji = cat.emoji;
      entry.categoryKind = cat.kind;
      entriesModified = true;
    }
  }

  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(cats));
    if (entriesModified) {
      localStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(entries));
    }
  }
  notifyListeners();
  return cat;
}

export function deleteCategory(id: string, strategy: CategoryDeleteStrategy = { mode: 'delete-entries' }): CategoryDeleteSummary {
  const cats = getCategories().filter((c) => c.id !== id);
  const activities = getAllActivities();
  const entries = getAllEntries();
  const budgets = getBudgets();
  const settings = getStoredSettings();

  const targetCategory = strategy.mode === 'reassign' ? cats.find((c) => c.id === strategy.toCategoryId) : null;
  const affectedActivityIds = new Set(
    activities.filter((a) => a.categoryId === id).map((a) => a.id)
  );

  let modifiedEntriesCount = 0;
  let deletedEntriesCount = 0;
  let modifiedActivitiesCount = 0;
  let deletedActivitiesCount = 0;
  let modifiedBudgetsCount = 0;
  let deletedBudgetsCount = 0;

  let newActivities: Activity[] = [];
  let newEntries: TimeEntry[] = [];
  let newBudgets: Budget[] = [];

  if (strategy.mode === 'reassign' && targetCategory) {
    // Reassign activities to target category
    newActivities = activities.map((a) => {
      if (a.categoryId === id) {
        modifiedActivitiesCount++;
        return { ...a, categoryId: targetCategory.id };
      }
      return a;
    });

    // Reassign entries snapshots to target category
    newEntries = entries.map((e) => {
      if (affectedActivityIds.has(e.activityId)) {
        modifiedEntriesCount++;
        return {
          ...e,
          categoryName: targetCategory.name,
          categoryColor: targetCategory.color,
          emoji: targetCategory.emoji,
          categoryKind: targetCategory.kind,
        };
      }
      return e;
    });

    // Reassign budgets to target category
    newBudgets = budgets.map((b) => {
      if (b.categoryId === id) {
        modifiedBudgetsCount++;
        return { ...b, categoryId: targetCategory.id };
      }
      return b;
    });
  } else {
    // Delete all activities, entries, and budgets in this category
    newActivities = activities.filter((a) => {
      if (a.categoryId === id) {
        deletedActivitiesCount++;
        return false;
      }
      return true;
    });

    newEntries = entries.filter((e) => {
      if (affectedActivityIds.has(e.activityId)) {
        deletedEntriesCount++;
        return false;
      }
      return true;
    });

    newBudgets = budgets.filter((b) => {
      if (b.categoryId === id) {
        deletedBudgetsCount++;
        return false;
      }
      return true;
    });
  }

  // Clean up priorityCategoryIds in settings
  if (settings.priorityCategoryIds) {
    settings.priorityCategoryIds = settings.priorityCategoryIds.filter((cid) => cid !== id);
    if (strategy.mode === 'reassign' && targetCategory && !settings.priorityCategoryIds.includes(targetCategory.id)) {
      settings.priorityCategoryIds.push(targetCategory.id);
    }
  }

  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(cats));
    localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(newActivities));
    localStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(newEntries));
    localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(newBudgets));
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }

  notifyListeners();

  return {
    deletedCategoryId: id,
    strategy,
    modifiedEntriesCount,
    deletedEntriesCount,
    modifiedActivitiesCount,
    deletedActivitiesCount,
    modifiedBudgetsCount,
    deletedBudgetsCount,
  };
}

// Activity methods
export function getActivities(): Activity[] {
  const acts = getItem<Activity[]>(STORAGE_KEYS.ACTIVITIES, DEFAULT_ACTIVITIES);
  return acts.filter((a) => !a.isArchived);
}

export function getAllActivities(): Activity[] {
  return getItem<Activity[]>(STORAGE_KEYS.ACTIVITIES, DEFAULT_ACTIVITIES);
}

export function createActivity(input: { categoryId: string; name: string; isFavorite?: boolean }): Activity {
  const newActivity: Activity = {
    id: 'act-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    categoryId: input.categoryId,
    name: input.name.trim(),
    isFavorite: input.isFavorite ?? false,
    isArchived: false,
  };

  const acts = getAllActivities();
  acts.push(newActivity);
  setItem(STORAGE_KEYS.ACTIVITIES, acts);
  return newActivity;
}

export function updateActivity(id: string, patch: Partial<Omit<Activity, 'id'>>): Activity | null {
  const acts = getAllActivities();
  const act = acts.find((a) => a.id === id);
  if (!act) return null;

  if (patch.name !== undefined) act.name = patch.name.trim();
  if (patch.categoryId !== undefined) act.categoryId = patch.categoryId;
  if (patch.isFavorite !== undefined) act.isFavorite = patch.isFavorite;
  if (patch.isArchived !== undefined) act.isArchived = patch.isArchived;

  // Propagate name change to existing TimeEntry snapshots
  if (patch.name !== undefined) {
    const entries = getAllEntries();
    let entriesModified = false;
    for (const e of entries) {
      if (e.activityId === id) {
        e.activityName = act.name;
        entriesModified = true;
      }
    }
    if (entriesModified && typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(entries));
    }
  }

  setItem(STORAGE_KEYS.ACTIVITIES, acts);
  return act;
}

export function saveActivity(act: Activity): void {
  const acts = getAllActivities();
  const index = acts.findIndex((a) => a.id === act.id);
  if (index >= 0) {
    acts[index] = act;
  } else {
    acts.push(act);
  }
  setItem(STORAGE_KEYS.ACTIVITIES, acts);
}

export function toggleFavoriteActivity(id: string): void {
  const acts = getAllActivities();
  const act = acts.find((a) => a.id === id);
  if (act) {
    act.isFavorite = !act.isFavorite;
    setItem(STORAGE_KEYS.ACTIVITIES, acts);
  }
}

export function archiveActivity(id: string): void {
  const acts = getAllActivities();
  const act = acts.find((a) => a.id === id);
  if (act) {
    act.isArchived = true;
    setItem(STORAGE_KEYS.ACTIVITIES, acts);
  }
}

// Timer methods
export function getTimerState(): TimerState | null {
  return getItem<TimerState | null>(STORAGE_KEYS.TIMER, null);
}

export function persistTimer(s: TimerState | null): void {
  if (typeof localStorage === 'undefined') return;
  if (!s) {
    localStorage.removeItem(STORAGE_KEYS.TIMER);
    notifyListeners();
  } else {
    setItem(STORAGE_KEYS.TIMER, s);
  }
}

export function startTimerFor(
  activityId: string,
  mode: TimerMode = 'continuous',
  targetIntervalSec: number = 25 * 60
): { conflict: boolean; currentTimer: TimerState | null } {
  const existing = getTimerState();
  if (existing) {
    return { conflict: true, currentTimer: existing };
  }
  persistTimer(startTimer(activityId, Date.now(), mode, targetIntervalSec));
  return { conflict: false, currentTimer: null };
}

export function pauseStoredTimer(): void {
  const current = getTimerState();
  if (!current) return;
  persistTimer(pauseTimer(current, Date.now()));
}

export function resumeStoredTimer(): void {
  const current = getTimerState();
  if (!current) return;
  persistTimer(resumeTimer(current, Date.now()));
}

export function updateStoredTimer(updates: Partial<TimerState>): void {
  const current = getTimerState();
  if (!current) return;
  persistTimer({ ...current, ...updates });
}

export function addTimerNote(text: string): EntryNote | null {
  const trimmed = text.trim().slice(0, 1000);
  if (!trimmed) return null;

  const current = getTimerState();
  if (!current) return null;

  const note: EntryNote = {
    id: 'timer-note-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    text: trimmed,
    createdAtMs: Date.now(),
  };

  const notes = current.notes || [];
  if (notes.length >= 50) return null;

  current.notes = [...notes, note];
  persistTimer(current);
  return note;
}

export function finishStoredTimer(notesOrText?: string | EntryNote[], valueRating?: number): TimeEntry[] {
  const s = getTimerState();
  if (!s) return [];
  const now = Math.max(Date.now(), s.startedAtMs + 1000);
  const settings = getStoredSettings();
  const zone = settings.timeZone || DEFAULT_TIME_ZONE;

  let splits = finishToEntries(s, now, (k) => dayBounds(k, zone), (ms) => localDateKey(ms, zone));
  if (splits.length === 0) {
    splits = [
      {
        localDate: localDateKey(s.startedAtMs, zone),
        startedAtMs: s.startedAtMs,
        endedAtMs: now,
        durationSec: Math.max(1, Math.round((now - s.startedAtMs) / 1000)),
      },
    ];
  }
  const acts = getAllActivities();
  const cats = getCategories();
  const activity = acts.find((a) => a.id === s.activityId);

  if (!activity) {
    persistTimer(null);
    return [];
  }

  const category = cats.find((c) => c.id === activity.categoryId) || {
    id: 'unknown',
    name: 'General',
    emoji: '⏱️',
    color: '#38BDF8',
    kind: 'flexible' as const,
  };

  // Collect notes from running timer + passed notes or single note
  let collectedNotes: EntryNote[] = [...(s.notes || [])];
  if (Array.isArray(notesOrText)) {
    collectedNotes = notesOrText;
  } else if (typeof notesOrText === 'string' && notesOrText.trim().length > 0 && collectedNotes.length < 50) {
    collectedNotes.push({
      id: 'note-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      text: notesOrText.trim().slice(0, 1000),
      createdAtMs: now,
    });
  }

  const newEntries: TimeEntry[] = splits.map((sp, idx) => ({
    id: 'entry-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7) + (idx > 0 ? `-${idx}` : ''),
    activityId: activity.id,
    activityName: activity.name,
    categoryName: category.name,
    categoryKind: category.kind,
    categoryColor: category.color,
    emoji: category.emoji,
    startedAtMs: sp.startedAtMs,
    endedAtMs: sp.endedAtMs,
    durationSec: sp.durationSec,
    localDate: sp.localDate,
    notes: idx === 0 ? collectedNotes : [],
    valueRating,
  }));

  const all = getAllEntries();
  all.push(...newEntries);
  setItem(STORAGE_KEYS.ENTRIES, all);

  persistTimer(null);
  return newEntries;
}

export function discardStoredTimer(): void {
  persistTimer(null);
}

// Entries methods
export function getAllEntries(): TimeEntry[] {
  const raw = getItem<any[]>(STORAGE_KEYS.ENTRIES, []);
  return raw.map((e) => {
    let notes: EntryNote[] = [];
    if (Array.isArray(e.notes)) {
      notes = e.notes;
    } else if (typeof e.note === 'string' && e.note.trim()) {
      notes = [{ id: `note-${e.id}-0`, text: e.note.trim(), createdAtMs: e.endedAtMs || e.startedAtMs }];
    }
    return {
      ...e,
      notes,
    };
  });
}

export function getEntriesForDate(dateKey: string): TimeEntry[] {
  const all = getAllEntries();
  return all
    .filter((e) => e.localDate === dateKey)
    .sort((a, b) => a.startedAtMs - b.startedAtMs);
}

export function addManualEntry(
  activityId: string,
  startedAtMs: number,
  endedAtMs: number,
  noteText?: string,
  valueRating?: number
): TimeEntry | null {
  const activities = getAllActivities();
  const categories = getCategories();
  const activity = activities.find((a) => a.id === activityId);
  if (!activity) return null;

  const category = categories.find((c) => c.id === activity.categoryId) || {
    id: 'unknown',
    name: 'General',
    emoji: '⏱️',
    color: '#38BDF8',
    kind: 'flexible' as const,
  };

  const settings = getStoredSettings();
  const zone = settings.timeZone || DEFAULT_TIME_ZONE;

  const durationSec = Math.max(1, Math.round((endedAtMs - startedAtMs) / 1000));
  const notes: EntryNote[] = [];
  if (noteText && noteText.trim().length > 0) {
    notes.push({
      id: 'note-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      text: noteText.trim().slice(0, 1000),
      createdAtMs: endedAtMs,
    });
  }

  const newEntry: TimeEntry = {
    id: 'entry-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
    activityId: activity.id,
    activityName: activity.name,
    categoryName: category.name,
    categoryKind: category.kind,
    categoryColor: category.color,
    emoji: category.emoji,
    startedAtMs,
    endedAtMs,
    durationSec,
    localDate: localDateKey(startedAtMs, zone),
    notes,
    valueRating,
  };

  const all = getAllEntries();
  all.push(newEntry);
  setItem(STORAGE_KEYS.ENTRIES, all);
  return newEntry;
}

export function updateEntry(updated: TimeEntry): void {
  const all = getAllEntries();
  const index = all.findIndex((e) => e.id === updated.id);
  if (index >= 0) {
    all[index] = updated;
    setItem(STORAGE_KEYS.ENTRIES, all);
  }
}

export function deleteEntry(id: string): void {
  const all = getAllEntries().filter((e) => e.id !== id);
  setItem(STORAGE_KEYS.ENTRIES, all);
}

/** Delete a group of ledger entries in one atomic store update. */
export function deleteEntries(ids: string[]): number {
  const idSet = new Set(ids);
  if (idSet.size === 0) return 0;

  const all = getAllEntries();
  const remaining = all.filter((entry) => !idSet.has(entry.id));
  const deletedCount = all.length - remaining.length;
  if (deletedCount > 0) setItem(STORAGE_KEYS.ENTRIES, remaining);
  return deletedCount;
}

// Note management on past or existing TimeEntry
export function addNoteToEntry(entryId: string, text: string): EntryNote | null {
  const trimmed = text.trim().slice(0, 1000);
  if (!trimmed) return null;

  const all = getAllEntries();
  const entry = all.find((e) => e.id === entryId);
  if (!entry) return null;

  if (entry.notes.length >= 50) return null;

  const note: EntryNote = {
    id: 'note-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    text: trimmed,
    createdAtMs: Date.now(),
  };

  entry.notes.push(note);
  setItem(STORAGE_KEYS.ENTRIES, all);
  return note;
}

export function updateNote(entryId: string, noteId: string, text: string): boolean {
  const trimmed = text.trim().slice(0, 1000);
  if (!trimmed) return false;

  const all = getAllEntries();
  const entry = all.find((e) => e.id === entryId);
  if (!entry) return false;

  const note = entry.notes.find((n) => n.id === noteId);
  if (!note) return false;

  note.text = trimmed;
  setItem(STORAGE_KEYS.ENTRIES, all);
  return true;
}

export function deleteNote(entryId: string, noteId: string): boolean {
  const all = getAllEntries();
  const entry = all.find((e) => e.id === entryId);
  if (!entry) return false;

  const initialLen = entry.notes.length;
  entry.notes = entry.notes.filter((n) => n.id !== noteId);
  if (entry.notes.length === initialLen) return false;

  setItem(STORAGE_KEYS.ENTRIES, all);
  return true;
}

// Budgets methods
export function getBudgets(): Budget[] {
  return getItem<Budget[]>(STORAGE_KEYS.BUDGETS, DEFAULT_BUDGETS);
}

export function saveBudget(budget: Budget): void {
  const budgets = getBudgets();
  const index = budgets.findIndex((b) => b.id === budget.id);
  if (index >= 0) {
    budgets[index] = budget;
  } else {
    budgets.push(budget);
  }
  setItem(STORAGE_KEYS.BUDGETS, budgets);
}

export function deleteBudget(id: string): void {
  const budgets = getBudgets().filter((b) => b.id !== id);
  setItem(STORAGE_KEYS.BUDGETS, budgets);
}

// Daily Reflections
export function getReflections(): DailyReflection[] {
  return getItem<DailyReflection[]>(STORAGE_KEYS.REFLECTIONS, []);
}

export function getReflectionForDate(dateKey: string): DailyReflection | undefined {
  return getReflections().find((r) => r.dateKey === dateKey);
}

export function saveReflection(
  dateKey: string,
  question: string,
  answer: string,
  moodRating?: number
): DailyReflection {
  const all = getReflections();
  const existingIndex = all.findIndex((r) => r.dateKey === dateKey);
  const item: DailyReflection = {
    dateKey,
    question,
    answer,
    closedAtMs: Date.now(),
    moodRating,
  };

  if (existingIndex >= 0) {
    all[existingIndex] = item;
  } else {
    all.push(item);
  }
  setItem(STORAGE_KEYS.REFLECTIONS, all);
  return item;
}

export function getDataEnvelope(): DataEnvelope {
  return {
    version: 4,
    exportedAt: new Date().toISOString(),
    categories: getCategories(),
    activities: getAllActivities(),
    budgets: getBudgets(),
    entries: getAllEntries(),
    reflections: getReflections(),
    settings: getStoredSettings(),
    timer: getTimerState(),
  };
}

// Export / Import data sovereignty functions
export function exportDataAsJSON(): void {
  const data = getDataEnvelope();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `twentyfour-backup-${localDateKey(Date.now(), data.settings.timeZone)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportDataAsCSV(): void {
  const entries = getAllEntries();
  const settings = getStoredSettings();
  const headers = [
    'ID',
    'Date',
    'Activity',
    'Category',
    'Category Kind',
    'Start Time',
    'End Time',
    'Duration (Minutes)',
    'Notes',
    'Rating',
  ];

  const rows = entries.map((e) => {
    const notesJoined = (e.notes || []).map((n) => n.text).join(' | ');
    return [
      e.id,
      e.localDate,
      `"${e.activityName.replace(/"/g, '""')}"`,
      `"${e.categoryName.replace(/"/g, '""')}"`,
      e.categoryKind,
      formatClock(e.startedAtMs, settings),
      formatClock(e.endedAtMs, settings),
      (e.durationSec / 60).toFixed(1),
      `"${notesJoined.replace(/"/g, '""')}"`,
      e.valueRating || '',
    ];
  });

  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `twentyfour-ledger-${localDateKey(Date.now(), settings.timeZone)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importDataFromJSON(rawJson: string): boolean {
  try {
    const raw = JSON.parse(rawJson);
    const envelope = migrateToV4(raw);

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(envelope.categories));
      localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(envelope.activities));
      localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(envelope.budgets));
      localStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(envelope.entries));
      localStorage.setItem(STORAGE_KEYS.REFLECTIONS, JSON.stringify(envelope.reflections));
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(envelope.settings));
      if (envelope.timer) {
        localStorage.setItem(STORAGE_KEYS.TIMER, JSON.stringify(envelope.timer));
      } else {
        localStorage.removeItem(STORAGE_KEYS.TIMER);
      }
    }
    notifyListeners();
    return true;
  } catch (err) {
    console.error('Import failure:', err);
    return false;
  }
}

// Sample demo data seeder
export function seedSampleLedgerData(): void {
  const categories = getCategories();
  const activities = getAllActivities();
  const settings = getStoredSettings();
  const zone = settings.timeZone || DEFAULT_TIME_ZONE;

  const entries: TimeEntry[] = [];
  const reflections: DailyReflection[] = [];

  const sleepAct = activities.find((a) => a.name.toLowerCase().includes('sleep')) || activities[0];
  const workAct = activities.find((a) => a.name.toLowerCase().includes('work')) || activities[1];
  const healthAct = activities.find((a) => a.name.toLowerCase().includes('exercise') || a.name.toLowerCase().includes('movement')) || activities[2];
  const familyAct = activities.find((a) => a.name.toLowerCase().includes('family')) || activities[3];
  const learningAct = activities.find((a) => a.name.toLowerCase().includes('reading')) || activities[4];

  const now = Date.now();
  const todayKey = localDateKey(now, zone);

  for (let i = 0; i < 7; i++) {
    const dateKey = shiftDateKey(todayKey, -i);
    const dayStart = dayBounds(dateKey, zone).startMs;

    const makeMs = (hours: number, minutes: number = 0) =>
      dayStart + hours * 3600_000 + minutes * 60_000;

    // Sleep (00:00 to 07:30) = 7.5 hours
    if (sleepAct) {
      const cat = categories.find((c) => c.id === sleepAct.categoryId)!;
      entries.push({
        id: `demo-sleep-${i}`,
        activityId: sleepAct.id,
        activityName: sleepAct.name,
        categoryName: cat?.name || 'Rest & Sleep',
        categoryKind: 'rest',
        categoryColor: cat?.color || '#818CF8',
        emoji: cat?.emoji || '😴',
        startedAtMs: makeMs(0, 0),
        endedAtMs: makeMs(7, 30),
        durationSec: 7.5 * 3600,
        localDate: dateKey,
        notes: [{ id: `note-sleep-${i}`, text: 'Deep restorative sleep cycle', createdAtMs: makeMs(7, 30) }],
        valueRating: 5,
      });
    }

    // Health / Morning Walk (08:00 to 08:45)
    if (healthAct) {
      const cat = categories.find((c) => c.id === healthAct.categoryId)!;
      entries.push({
        id: `demo-health-${i}`,
        activityId: healthAct.id,
        activityName: healthAct.name,
        categoryName: cat?.name || 'Movement & Vitality',
        categoryKind: 'rest',
        categoryColor: cat?.color || '#F59E0B',
        emoji: cat?.emoji || '💪',
        startedAtMs: makeMs(8, 0),
        endedAtMs: makeMs(8, 45),
        durationSec: 45 * 60,
        localDate: dateKey,
        notes: [{ id: `note-health-${i}`, text: 'Outdoor morning sunlight and stretch', createdAtMs: makeMs(8, 45) }],
        valueRating: 5,
      });
    }

    // Deep Work (09:15 to 12:45)
    if (workAct) {
      const cat = categories.find((c) => c.id === workAct.categoryId)!;
      entries.push({
        id: `demo-work1-${i}`,
        activityId: workAct.id,
        activityName: workAct.name,
        categoryName: cat?.name || 'Deep Focus & Flow',
        categoryKind: 'flexible',
        categoryColor: cat?.color || '#38BDF8',
        emoji: cat?.emoji || '💼',
        startedAtMs: makeMs(9, 15),
        endedAtMs: makeMs(12, 45),
        durationSec: 3.5 * 3600,
        localDate: dateKey,
        notes: [{ id: `note-work1-${i}`, text: 'Focused flow on key architectural objectives', createdAtMs: makeMs(12, 45) }],
        valueRating: 5,
      });
    }

    // Afternoon Work (14:00 to 17:30)
    if (workAct) {
      const cat = categories.find((c) => c.id === workAct.categoryId)!;
      entries.push({
        id: `demo-work2-${i}`,
        activityId: workAct.id,
        activityName: workAct.name,
        categoryName: cat?.name || 'Deep Focus & Flow',
        categoryKind: 'flexible',
        categoryColor: cat?.color || '#38BDF8',
        emoji: cat?.emoji || '💼',
        startedAtMs: makeMs(14, 0),
        endedAtMs: makeMs(17, 30),
        durationSec: 3.5 * 3600,
        localDate: dateKey,
        notes: [{ id: `note-work2-${i}`, text: 'Collaborative code reviews and planning', createdAtMs: makeMs(17, 30) }],
        valueRating: 4,
      });
    }

    // Presence / Family (18:00 to 20:30)
    if (familyAct) {
      const cat = categories.find((c) => c.id === familyAct.categoryId)!;
      entries.push({
        id: `demo-family-${i}`,
        activityId: familyAct.id,
        activityName: familyAct.name,
        categoryName: cat?.name || 'Presence & Loved Ones',
        categoryKind: 'rest',
        categoryColor: cat?.color || '#34D399',
        emoji: cat?.emoji || '🏡',
        startedAtMs: makeMs(18, 0),
        endedAtMs: makeMs(20, 30),
        durationSec: 2.5 * 3600,
        localDate: dateKey,
        notes: [{ id: `note-family-${i}`, text: 'Dinner together with family and calm stroll', createdAtMs: makeMs(20, 30) }],
        valueRating: 5,
      });
    }

    // Reading (21:00 to 22:00)
    if (learningAct) {
      const cat = categories.find((c) => c.id === learningAct.categoryId)!;
      entries.push({
        id: `demo-read-${i}`,
        activityId: learningAct.id,
        activityName: learningAct.name,
        categoryName: cat?.name || 'Reading & Wisdom',
        categoryKind: 'flexible',
        categoryColor: cat?.color || '#60A5FA',
        emoji: cat?.emoji || '📚',
        startedAtMs: makeMs(21, 0),
        endedAtMs: makeMs(22, 0),
        durationSec: 3600,
        localDate: dateKey,
        notes: [{ id: `note-read-${i}`, text: 'Calm reading before evening wind down', createdAtMs: makeMs(22, 0) }],
        valueRating: 5,
      });
    }

    // Reflection for this day
    reflections.push({
      dateKey,
      question: 'What single moment today felt most deeply restorative or meaningful?',
      answer: 'The unhurried evening walk and mindful conversation brought genuine peace and clarity.',
      closedAtMs: makeMs(22, 30),
      moodRating: 5,
    });
  }

  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(entries));
    localStorage.setItem(STORAGE_KEYS.REFLECTIONS, JSON.stringify(reflections));
  }
  notifyListeners();
}

// Export aliases for data sovereignty
export const exportLedgerJson = exportDataAsJSON;
export const exportLedgerCsv = exportDataAsCSV;
export const importLedgerJson = importDataFromJSON;

export function updateStoredSettings(updates: Partial<UserSettings>): UserSettings {
  const curr = getStoredSettings();
  const next = { ...curr, ...updates };
  saveStoredSettings(next);
  return next;
}

export function clearToFirstRun(): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.REFLECTIONS, JSON.stringify([]));
    localStorage.removeItem(STORAGE_KEYS.TIMER);
  }
  notifyListeners();
}

export function clearEntireStore(): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(STORAGE_KEYS.ENTRIES);
    localStorage.removeItem(STORAGE_KEYS.TIMER);
    localStorage.removeItem(STORAGE_KEYS.BUDGETS);
    localStorage.removeItem(STORAGE_KEYS.REFLECTIONS);
    localStorage.removeItem(STORAGE_KEYS.CATEGORIES);
    localStorage.removeItem(STORAGE_KEYS.ACTIVITIES);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
  }
  initStore();
  notifyListeners();
}
