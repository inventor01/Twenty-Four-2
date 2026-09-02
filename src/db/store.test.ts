import { describe, it, expect, beforeEach } from 'vitest';
import {
  initStore,
  clearEntireStore,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getAllActivities,
  createActivity,
  updateActivity,
  getAllEntries,
  addManualEntry,
  deleteEntries,
  addNoteToEntry,
  updateNote,
  deleteNote,
  startTimerFor,
  addTimerNote,
  finishStoredTimer,
  getStoredSettings,
  saveStoredSettings,
  recomputeLocalDates,
  getBudgets,
  saveBudget,
  getDataEnvelope,
} from './store';

describe('Store v4 Persistence API', () => {
  beforeEach(() => {
    // Mock localStorage
    const store: Record<string, string> = {};
    global.localStorage = {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, val: string) => {
        store[key] = val;
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        for (const k of Object.keys(store)) delete store[k];
      },
      length: Object.keys(store).length,
      key: (i: number) => Object.keys(store)[i] || null,
    };
    clearEntireStore();
  });

  describe('1. Multiple Notes per Time Entry & Running Timer', () => {
    it('adds, updates, and deletes notes on existing entries', () => {
      const cats = getCategories();
      const acts = getAllActivities();
      const entry = addManualEntry(acts[0].id, 1000000, 2000000, 'Initial note')!;
      expect(entry).toBeDefined();
      expect(entry.notes).toHaveLength(1);
      expect(entry.notes[0].text).toBe('Initial note');

      // Add second note
      const note2 = addNoteToEntry(entry.id, 'Second insight during review');
      expect(note2).toBeDefined();

      const updatedEntries = getAllEntries();
      const reloadedEntry = updatedEntries.find((e) => e.id === entry.id)!;
      expect(reloadedEntry.notes).toHaveLength(2);
      expect(reloadedEntry.notes[1].text).toBe('Second insight during review');

      // Update second note
      const updateOk = updateNote(entry.id, note2!.id, 'Updated second insight');
      expect(updateOk).toBe(true);
      const afterUpdate = getAllEntries().find((e) => e.id === entry.id)!;
      expect(afterUpdate.notes[1].text).toBe('Updated second insight');

      // Delete first note
      const deleteOk = deleteNote(entry.id, reloadedEntry.notes[0].id);
      expect(deleteOk).toBe(true);
      const afterDelete = getAllEntries().find((e) => e.id === entry.id)!;
      expect(afterDelete.notes).toHaveLength(1);
      expect(afterDelete.notes[0].text).toBe('Updated second insight');
    });

    it('captures notes during running timer and flushes onto created TimeEntry', () => {
      const acts = getAllActivities();
      startTimerFor(acts[0].id);

      addTimerNote('Timer note 1: started deep work');
      addTimerNote('Timer note 2: completed draft');

      const createdEntries = finishStoredTimer('Final summary note');
      expect(createdEntries).toHaveLength(1);
      expect(createdEntries[0].notes).toHaveLength(3);
      expect(createdEntries[0].notes[0].text).toBe('Timer note 1: started deep work');
      expect(createdEntries[0].notes[1].text).toBe('Timer note 2: completed draft');
      expect(createdEntries[0].notes[2].text).toBe('Final summary note');
    });
  });

  describe('2. Time Zone & Format Settings', () => {
    it('persists timeZone and hourFormat settings', () => {
      saveStoredSettings({
        soundEnabled: false,
        hapticsEnabled: true,
        defaultFocusMinutes: 50,
        timeZone: 'Asia/Tokyo',
        hourFormat: 24,
      });

      const settings = getStoredSettings();
      expect(settings.timeZone).toBe('Asia/Tokyo');
      expect(settings.hourFormat).toBe(24);
      expect(settings.defaultFocusMinutes).toBe(50);
    });

    it('recomputes localDates across timezone changes', () => {
      // Create an entry around 2026-01-01 02:00:00 UTC
      // In America/New_York: 2025-12-31
      // In Asia/Tokyo: 2026-01-01
      const startMs = new Date('2026-01-01T02:00:00Z').getTime();
      const endMs = new Date('2026-01-01T04:00:00Z').getTime();

      const acts = getAllActivities();
      addManualEntry(acts[0].id, startMs, endMs);

      recomputeLocalDates('America/New_York');
      let entry = getAllEntries().find((e) => e.startedAtMs === startMs)!;
      expect(entry.localDate).toBe('2025-12-31');

      recomputeLocalDates('Asia/Tokyo');
      entry = getAllEntries().find((e) => e.startedAtMs === startMs)!;
      expect(entry.localDate).toBe('2026-01-01');
    });
  });

  describe('3. Category & Activity CRUD', () => {
    it('creates category with default activity immediately loggable', () => {
      const created = createCategory({
        name: 'Mindfulness & Meditation',
        emoji: '🧘',
        color: '#10B981',
        kind: 'rest',
      });

      expect(created.id).toBeDefined();
      expect(created.name).toBe('Mindfulness & Meditation');

      const acts = getAllActivities();
      const defaultAct = acts.find((a) => a.categoryId === created.id);
      expect(defaultAct).toBeDefined();
      expect(defaultAct?.name).toBe('Mindfulness & Meditation');
    });

    it('propagates category and activity renames to existing entry snapshots', () => {
      const cat = createCategory({
        name: 'Writing',
        emoji: '✍️',
        color: '#EC4899',
        kind: 'flexible',
      });
      const act = getAllActivities().find((a) => a.categoryId === cat.id)!;

      const entry = addManualEntry(act.id, 1000, 5000, 'Writing chapter 1')!;
      expect(entry.categoryName).toBe('Writing');
      expect(entry.activityName).toBe('Writing');

      // Update category name & color
      updateCategory(cat.id, { name: 'Authoring & Books', color: '#F43F5E' });
      let updatedEntry = getAllEntries().find((e) => e.id === entry.id)!;
      expect(updatedEntry.categoryName).toBe('Authoring & Books');
      expect(updatedEntry.categoryColor).toBe('#F43F5E');

      // Update activity name
      updateActivity(act.id, { name: 'Book Manuscript' });
      updatedEntry = getAllEntries().find((e) => e.id === entry.id)!;
      expect(updatedEntry.activityName).toBe('Book Manuscript');
    });

    it('deleteCategory with reassign keeps total minutes constant and updates snapshots', () => {
      const cat1 = createCategory({ name: 'Old Writing', emoji: '📝', color: '#999', kind: 'flexible' });
      const cat2 = createCategory({ name: 'Creative Flow', emoji: '✨', color: '#8B5CF6', kind: 'flexible' });
      const act1 = getAllActivities().find((a) => a.categoryId === cat1.id)!;

      saveBudget({ id: 'b-cat1', categoryId: cat1.id, period: 'daily', targetSec: 3600 });
      addManualEntry(act1.id, 1000, 4600, 'Session 1'); // 3600s duration

      const entriesBefore = getAllEntries();
      const totalSecBefore = entriesBefore.reduce((acc, e) => acc + e.durationSec, 0);

      const summary = deleteCategory(cat1.id, { mode: 'reassign', toCategoryId: cat2.id });
      expect(summary.modifiedEntriesCount).toBe(1);

      const entriesAfter = getAllEntries();
      const totalSecAfter = entriesAfter.reduce((acc, e) => acc + e.durationSec, 0);
      expect(totalSecAfter).toBe(totalSecBefore);

      const modifiedEntry = entriesAfter.find((e) => e.activityId === act1.id)!;
      expect(modifiedEntry.categoryName).toBe('Creative Flow');
      expect(modifiedEntry.categoryColor).toBe('#8B5CF6');

      // Budget reassigned
      const budgets = getBudgets();
      expect(budgets.find((b) => b.id === 'b-cat1')?.categoryId).toBe(cat2.id);
    });

    it('deleteCategory with delete-entries removes exactly that category minutes and budgets', () => {
      const cat = createCategory({ name: 'Temporary Chores', emoji: '🧹', color: '#64748B', kind: 'fixed' });
      const act = getAllActivities().find((a) => a.categoryId === cat.id)!;

      saveBudget({ id: 'b-temp', categoryId: cat.id, period: 'weekly', targetSec: 7200 });
      addManualEntry(act.id, 1000000, 1000000 + 3600 * 1000, 'Cleaning session'); // 3600s duration

      const entriesBefore = getAllEntries();
      const totalSecBefore = entriesBefore.reduce((acc, e) => acc + e.durationSec, 0);

      const summary = deleteCategory(cat.id, { mode: 'delete-entries' });
      expect(summary.deletedEntriesCount).toBe(1);

      const entriesAfter = getAllEntries();
      const totalSecAfter = entriesAfter.reduce((acc, e) => acc + e.durationSec, 0);
      expect(totalSecAfter).toBe(totalSecBefore - 3600);

      expect(getBudgets().find((b) => b.id === 'b-temp')).toBeUndefined();
    });
  });

  describe('4. Data Envelope & Sovereignty', () => {
    it('produces valid v4 DataEnvelope', () => {
      const envelope = getDataEnvelope();
      expect(envelope.version).toBe(4);
      expect(envelope.categories.length).toBeGreaterThan(0);
      expect(envelope.settings.timeZone).toBeDefined();
    });
  });

  describe('5. Bulk ledger operations', () => {
    it('deletes only the selected entries in one operation', () => {
      const activity = getAllActivities()[0];
      const first = addManualEntry(activity.id, 1_000_000, 1_060_000)!;
      const second = addManualEntry(activity.id, 2_000_000, 2_060_000)!;
      const keep = addManualEntry(activity.id, 3_000_000, 3_060_000)!;
      const countBefore = getAllEntries().length;

      expect(deleteEntries([first.id, second.id])).toBe(2);
      const remainingIds = getAllEntries().map((entry) => entry.id);
      expect(remainingIds).not.toContain(first.id);
      expect(remainingIds).not.toContain(second.id);
      expect(remainingIds).toContain(keep.id);
      expect(remainingIds).toHaveLength(countBefore - 2);
    });
  });
});
