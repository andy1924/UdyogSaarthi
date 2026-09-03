/**
 * Minimal raw-IndexedDB queue (`saarthi-queue`).
 *
 * No `idb`/Dexie dependency — tiny promise wrapper around the native API.
 * `queuePush` stores form JSON while offline; `queueFlush` returns all queued
 * payloads and clears the store (caller POSTs them on `online`).
 * `queueCount` backs the `#queueN` badge (C18).
 */

const DB_NAME = "saarthi-db";
const STORE_NAME = "saarthi-queue";

export interface QueuedForm {
  id?: number;
  payload: unknown;
  queuedAt: string;
}

function dbSupported(): boolean {
  return typeof window !== "undefined" && typeof window.indexedDB !== "undefined";
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!dbSupported()) {
      reject(new Error("IndexedDB is unavailable on this device."));
      return;
    }
    const req = window.indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: true });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("Could not open local queue."));
  });
}

function run<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, mode);
        const store = tx.objectStore(STORE_NAME);
        let value: T;
        try {
          const req = fn(store);
          req.onsuccess = () => {
            value = req.result;
          };
          req.onerror = () => reject(req.error ?? new Error("Queue operation failed."));
        } catch (err) {
          reject(err instanceof Error ? err : new Error("Queue operation failed."));
          return;
        }
        tx.oncomplete = () => {
          db.close();
          resolve(value);
        };
        tx.onerror = () => {
          db.close();
          reject(tx.error ?? new Error("Queue transaction failed."));
        };
      }),
  );
}

/** Store form JSON in `saarthi-queue` for later flush. */
export async function queuePush(formJson: unknown): Promise<void> {
  const entry: QueuedForm = { payload: formJson, queuedAt: new Date().toISOString() };
  await run("readwrite", (store) => store.add(entry));
}

/** Number of payloads waiting in `saarthi-queue`. 0 when IndexedDB is missing. */
export async function queueCount(): Promise<number> {
  try {
    return await run<number>("readonly", (store) => store.count());
  } catch {
    return 0;
  }
}

/**
 * Return all queued payloads and clear the store.
 * The caller is responsible for POSTing each payload on `online`.
 */
export async function queueFlush(): Promise<unknown[]> {
  const all = await run<QueuedForm[]>("readonly", (store) => store.getAll());
  await run("readwrite", (store) => store.clear());
  return all.map((entry) => entry.payload);
}
