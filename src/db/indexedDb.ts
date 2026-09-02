import { DataEnvelope } from '../types';

const DB_NAME = 'twentyfour_db';
const DB_VERSION = 4;

const STORES = [
  'categories',
  'activities',
  'budgets',
  'entries',
  'reflections',
  'settings',
  'timer',
  'meta',
] as const;

function openDb(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        for (const storeName of STORES) {
          if (!db.objectStoreNames.contains(storeName)) {
            db.createObjectStore(storeName, { keyPath: 'id' });
          }
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        console.warn('IndexedDB open error:', request.error);
        resolve(null);
      };
    } catch (err) {
      console.warn('IndexedDB unavailable:', err);
      resolve(null);
    }
  });
}

/**
 * Mirrors the entire DataEnvelope to IndexedDB asynchronously
 */
export async function mirrorToIndexedDb(envelope: DataEnvelope): Promise<void> {
  const db = await openDb();
  if (!db) return;

  try {
    const tx = db.transaction(
      ['categories', 'activities', 'budgets', 'entries', 'reflections', 'settings', 'timer', 'meta'],
      'readwrite'
    );

    // Categories
    const catStore = tx.objectStore('categories');
    catStore.clear();
    for (const c of envelope.categories) {
      catStore.put(c);
    }

    // Activities
    const actStore = tx.objectStore('activities');
    actStore.clear();
    for (const a of envelope.activities) {
      actStore.put(a);
    }

    // Budgets
    const bStore = tx.objectStore('budgets');
    bStore.clear();
    for (const b of envelope.budgets) {
      bStore.put(b);
    }

    // Entries
    const eStore = tx.objectStore('entries');
    eStore.clear();
    for (const e of envelope.entries) {
      eStore.put(e);
    }

    // Reflections
    const rStore = tx.objectStore('reflections');
    rStore.clear();
    for (const r of envelope.reflections) {
      rStore.put({ id: r.dateKey, ...r });
    }

    // Settings
    const sStore = tx.objectStore('settings');
    sStore.clear();
    sStore.put({ id: 'user_settings', ...envelope.settings });

    // Timer
    const tStore = tx.objectStore('timer');
    tStore.clear();
    if (envelope.timer) {
      tStore.put({ id: 'active_timer', ...envelope.timer });
    }

    // Meta
    const mStore = tx.objectStore('meta');
    mStore.put({
      id: 'envelope_meta',
      version: envelope.version,
      exportedAt: envelope.exportedAt,
    });

    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('IndexedDB mirror error:', err);
  }
}

/**
 * Loads all data from IndexedDB if available, returns null if empty or unavailable
 */
export async function loadFromIndexedDb(): Promise<Partial<DataEnvelope> | null> {
  const db = await openDb();
  if (!db) return null;

  try {
    const tx = db.transaction(
      ['categories', 'activities', 'budgets', 'entries', 'reflections', 'settings', 'timer'],
      'readonly'
    );

    const getAll = <T>(storeName: string): Promise<T[]> => {
      return new Promise((resolve) => {
        const store = tx.objectStore(storeName);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
      });
    };

    const [categories, activities, budgets, entries, rawReflections, rawSettings, rawTimer] =
      await Promise.all([
        getAll<any>('categories'),
        getAll<any>('activities'),
        getAll<any>('budgets'),
        getAll<any>('entries'),
        getAll<any>('reflections'),
        getAll<any>('settings'),
        getAll<any>('timer'),
      ]);

    if (
      categories.length === 0 &&
      activities.length === 0 &&
      entries.length === 0
    ) {
      return null;
    }

    const reflections = rawReflections.map((r) => {
      const { id, ...rest } = r;
      return rest;
    });

    let settings = undefined;
    if (rawSettings.length > 0) {
      const { id, ...rest } = rawSettings[0];
      settings = rest;
    }

    let timer = null;
    if (rawTimer.length > 0) {
      const { id, ...rest } = rawTimer[0];
      timer = rest;
    }

    return {
      categories,
      activities,
      budgets,
      entries,
      reflections,
      settings,
      timer,
    };
  } catch (err) {
    console.warn('IndexedDB read error:', err);
    return null;
  }
}
