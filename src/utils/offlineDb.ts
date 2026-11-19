import { StudyFlowState } from '../types/studyflow';

const DB_NAME = 'studyflo_offline_db';
const DB_VERSION = 1;
const STORE_NAME = 'app_state';
const RECORD_KEY = 'primary_state';

function openOfflineDb(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !('indexedDB' in window)) {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export async function saveStateToIndexedDb(state: StudyFlowState): Promise<void> {
  const db = await openOfflineDb();
  if (!db) return;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put({ state, savedAt: Date.now() }, RECORD_KEY);
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        resolve();
      };
    } catch {
      db.close();
      resolve();
    }
  });
}

export async function loadStateFromIndexedDb(): Promise<StudyFlowState | null> {
  const db = await openOfflineDb();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(RECORD_KEY);
      req.onsuccess = () => {
        const record = req.result as { state?: StudyFlowState } | undefined;
        db.close();
        resolve(record?.state ?? null);
      };
      req.onerror = () => {
        db.close();
        resolve(null);
      };
    } catch {
      db.close();
      resolve(null);
    }
  });
}

export function getOfflineStorageSizeKb(state: StudyFlowState): number {
  try {
    const bytes = new Blob([JSON.stringify(state)]).size;
    return Math.max(1, Math.round((bytes / 1024) * 10) / 10);
  } catch {
    return 1;
  }
}
