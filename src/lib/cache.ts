import { LANGUAGE_CACHE_PREFIX } from '../ocr/engine';
import { DATA_KEY, NOTICE_KEY, THEME_KEY } from './storage';

export const OWN_STORAGE_KEYS = [THEME_KEY, DATA_KEY, NOTICE_KEY];

export function clearOwnStorage(storage: Storage): void {
  for (const key of OWN_STORAGE_KEYS) storage.removeItem(key);
}

/**
 * Deletes only this app's traineddata keys inside the shared idb-keyval database.
 * GitHub Pages projects on one account share an origin, so the whole database is left alone.
 */
export async function clearLanguageCache(): Promise<void> {
  if (typeof indexedDB === 'undefined' || !indexedDB.databases) return;
  const databases = await indexedDB.databases();
  if (!databases.some((entry) => entry.name === 'keyval-store')) return;

  await new Promise<void>((resolve) => {
    const request = indexedDB.open('keyval-store');
    request.onerror = () => resolve();
    request.onsuccess = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains('keyval')) {
        database.close();
        resolve();
        return;
      }
      const transaction = database.transaction('keyval', 'readwrite');
      const store = transaction.objectStore('keyval');
      const keys = store.getAllKeys();
      keys.onsuccess = () => {
        for (const key of keys.result) {
          if (typeof key === 'string' && key.startsWith(LANGUAGE_CACHE_PREFIX)) store.delete(key);
        }
      };
      transaction.oncomplete = () => {
        database.close();
        resolve();
      };
      transaction.onerror = () => {
        database.close();
        resolve();
      };
    };
  });
}
