import { describe, it, expect } from 'vitest';
import {
  categorySchema,
  timeEntrySchema,
  timerStateSchema,
  dataEnvelopeSchema,
  migrateToV4,
} from './schema';
import { DataEnvelope } from '../types';

describe('Schema & Migrations v4', () => {
  it('validates a correct TimeEntry with notes array', () => {
    const validEntry = {
      id: 'entry-1',
      activityId: 'act-1',
      activityName: 'Focus Code',
      categoryName: 'Deep Work',
      categoryKind: 'flexible',
      categoryColor: '#38BDF8',
      emoji: '💼',
      startedAtMs: 1700000000000,
      endedAtMs: 1700003600000,
      durationSec: 3600,
      localDate: '2023-11-14',
      notes: [
        {
          id: 'note-1',
          text: 'Architecting persistence layer',
          createdAtMs: 1700001000000,
        },
      ],
      valueRating: 5,
    };

    const parsed = timeEntrySchema.parse(validEntry);
    expect(parsed.notes).toHaveLength(1);
    expect(parsed.notes[0].text).toBe('Architecting persistence layer');
  });

  it('enforces notes cap and text length', () => {
    const tooLongText = 'a'.repeat(1001);
    expect(() =>
      timeEntrySchema.parse({
        id: 'entry-1',
        activityId: 'act-1',
        activityName: 'Focus',
        categoryName: 'Work',
        categoryKind: 'flexible',
        categoryColor: '#38BDF8',
        emoji: '💼',
        startedAtMs: 1700000000000,
        endedAtMs: 1700003600000,
        durationSec: 3600,
        localDate: '2023-11-14',
        notes: [{ id: 'n1', text: tooLongText, createdAtMs: 1700000000000 }],
      })
    ).toThrow();
  });

  it('migrates twentyfour_v2 single note string into notes[0]', () => {
    const v2Payload = {
      version: 'twentyfour_v2',
      exportedAt: '2023-11-14T12:00:00.000Z',
      categories: [
        { id: 'cat-1', name: 'Work', emoji: '💼', color: '#38BDF8', kind: 'flexible' },
      ],
      activities: [
        { id: 'act-1', categoryId: 'cat-1', name: 'Coding', isFavorite: true, isArchived: false },
      ],
      budgets: [],
      entries: [
        {
          id: 'e-1',
          activityId: 'act-1',
          activityName: 'Coding',
          categoryName: 'Work',
          categoryKind: 'flexible',
          categoryColor: '#38BDF8',
          emoji: '💼',
          startedAtMs: 1700000000000,
          endedAtMs: 1700003600000,
          durationSec: 3600,
          localDate: '2023-11-14',
          note: 'Completed database indexing',
        },
      ],
      reflections: [],
      settings: {
        soundEnabled: true,
        hapticsEnabled: true,
        defaultFocusMinutes: 25,
      },
    };

    const envelope = migrateToV4(v2Payload);
    expect(envelope.version).toBe(4);
    expect(envelope.settings.timeZone).toBe('America/New_York');
    expect(envelope.settings.hourFormat).toBe(12);
    expect(envelope.entries[0].notes).toHaveLength(1);
    expect(envelope.entries[0].notes[0].text).toBe('Completed database indexing');
    expect(envelope.entries[0].notes[0].createdAtMs).toBe(1700003600000);
  });

  it('is pure and idempotent', () => {
    const v2Payload = {
      version: 'twentyfour_v2',
      categories: [{ id: 'cat-1', name: 'Work', emoji: '💼', color: '#38BDF8', kind: 'flexible' }],
      activities: [{ id: 'act-1', categoryId: 'cat-1', name: 'Coding', isFavorite: true, isArchived: false }],
      budgets: [],
      entries: [
        {
          id: 'e-1',
          activityId: 'act-1',
          activityName: 'Coding',
          categoryName: 'Work',
          categoryKind: 'flexible',
          categoryColor: '#38BDF8',
          emoji: '💼',
          startedAtMs: 1700000000000,
          endedAtMs: 1700003600000,
          durationSec: 3600,
          localDate: '2023-11-14',
          note: 'First note',
        },
      ],
      reflections: [],
      settings: {},
    };

    const firstRun = migrateToV4(v2Payload);
    const secondRun = migrateToV4(firstRun);
    expect(secondRun).toEqual(firstRun);
  });

  it('allows unknown future fields without throwing', () => {
    const futurePayload = {
      version: 5,
      futureMeta: { cloudSync: false },
      categories: [{ id: 'cat-1', name: 'Work', emoji: '💼', color: '#38BDF8', kind: 'flexible', futureFlag: true }],
      activities: [],
      budgets: [],
      entries: [],
      reflections: [],
      settings: { extraThemeConfig: 'dark-glass' },
    };

    const envelope = migrateToV4(futurePayload);
    expect(envelope.version).toBe(4);
    expect(envelope.categories[0].name).toBe('Work');
  });
});
