import { db, doc, setDoc, getDoc, collection, onSnapshot, query, orderBy, deleteDoc } from './firebase';
import { TimeEntry, Category, Activity, DailyReflection, UserSettings } from '../types';
import {
  getCategories,
  getAllActivities,
  getAllEntries,
  getReflections,
  getStoredSettings,
  saveCategory,
  saveActivity,
  updateEntry,
  deleteEntry,
  saveReflection,
  updateStoredSettings,
} from '../db/store';

let activeSyncUnsubscribes: Array<() => void> = [];

/**
 * Attaches real-time cloud sync to Firestore for the currently logged-in user.
 * Guarantees zero leak between users: every user reads and writes only to /users/{userId}/...
 */
export function syncFirestoreForUser(userId: string): () => void {
  // Clear any existing syncs
  stopFirestoreSync();

  // 1. Sync User Time Entries
  const entriesColRef = collection(db, 'users', userId, 'entries');
  const unsubEntries = onSnapshot(
    entriesColRef,
    (snapshot) => {
      if (snapshot && typeof snapshot.docChanges === 'function') {
        (snapshot.docChanges() || []).forEach((change) => {
          const entry = change.doc?.data() as TimeEntry;
          if (entry) {
            if (change.type === 'added' || change.type === 'modified') {
              updateEntry(entry);
            } else if (change.type === 'removed') {
              deleteEntry(entry.id);
            }
          }
        });
      }
    },
    (err) => console.warn('Entries cloud sync error:', err)
  );
  activeSyncUnsubscribes.push(unsubEntries);

  // 2. Sync User Custom Categories
  const categoriesColRef = collection(db, 'users', userId, 'categories');
  const unsubCategories = onSnapshot(
    categoriesColRef,
    (snapshot) => {
      if (snapshot && typeof snapshot.docChanges === 'function') {
        (snapshot.docChanges() || []).forEach((change) => {
          const cat = change.doc?.data() as Category;
          if (cat && (change.type === 'added' || change.type === 'modified')) {
            saveCategory(cat);
          }
        });
      }
    },
    (err) => console.warn('Categories cloud sync error:', err)
  );
  activeSyncUnsubscribes.push(unsubCategories);

  // 3. Sync User Activities
  const activitiesColRef = collection(db, 'users', userId, 'activities');
  const unsubActivities = onSnapshot(
    activitiesColRef,
    (snapshot) => {
      if (snapshot && typeof snapshot.docChanges === 'function') {
        (snapshot.docChanges() || []).forEach((change) => {
          const act = change.doc?.data() as Activity;
          if (act && (change.type === 'added' || change.type === 'modified')) {
            saveActivity(act);
          }
        });
      }
    },
    (err) => console.warn('Activities cloud sync error:', err)
  );
  activeSyncUnsubscribes.push(unsubActivities);

  // 4. Sync User Reflections
  const reflectionsColRef = collection(db, 'users', userId, 'reflections');
  const unsubReflections = onSnapshot(
    reflectionsColRef,
    (snapshot) => {
      if (snapshot && typeof snapshot.docChanges === 'function') {
        (snapshot.docChanges() || []).forEach((change) => {
          const ref = change.doc?.data() as DailyReflection;
          if (ref && (change.type === 'added' || change.type === 'modified')) {
            saveReflection(ref.dateKey, ref.question, ref.answer, ref.moodRating);
          }
        });
      }
    },
    (err) => console.warn('Reflections cloud sync error:', err)
  );
  activeSyncUnsubscribes.push(unsubReflections);

  return stopFirestoreSync;
}

export function stopFirestoreSync(): void {
  (activeSyncUnsubscribes || []).forEach((unsub) => {
    try {
      if (typeof unsub === 'function') unsub();
    } catch (e) {}
  });
  activeSyncUnsubscribes = [];
}

/**
 * Persists an entry to the user's private Firestore subcollection
 */
export async function persistEntryToCloud(userId: string, entry: TimeEntry): Promise<void> {
  try {
    const entryDocRef = doc(db, 'users', userId, 'entries', entry.id);
    await setDoc(entryDocRef, { ...entry, userId }, { merge: true });
  } catch (err) {
    console.warn('Failed to sync entry to cloud:', err);
  }
}

/**
 * Removes an entry from the user's private Firestore subcollection
 */
export async function removeEntryFromCloud(userId: string, entryId: string): Promise<void> {
  try {
    const entryDocRef = doc(db, 'users', userId, 'entries', entryId);
    await deleteDoc(entryDocRef);
  } catch (err) {
    console.warn('Failed to delete entry from cloud:', err);
  }
}

/**
 * Persists a daily reflection to the user's private Firestore subcollection
 */
export async function persistReflectionToCloud(userId: string, reflection: DailyReflection): Promise<void> {
  try {
    const refDocRef = doc(db, 'users', userId, 'reflections', reflection.dateKey);
    await setDoc(refDocRef, { ...reflection, userId }, { merge: true });
  } catch (err) {
    console.warn('Failed to sync reflection to cloud:', err);
  }
}
