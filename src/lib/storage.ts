import { FocusSession, UserSettings } from "../types";

const DB_NAME = "openfocus_db";
const DB_VERSION = 1;
const SESSION_STORE = "focus_sessions";
const SETTINGS_STORE = "settings";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(SESSION_STORE)) {
        const store = db.createObjectStore(SESSION_STORE, { keyPath: "id" });
        store.createIndex("updatedAt", "updatedAt");
        store.createIndex("startTime", "startTime");
        store.createIndex("status", "status");
      }

      if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
        db.createObjectStore(SETTINGS_STORE, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function tx<T>(
  storeName: string,
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest<T> | void
): Promise<T | void> {
  const db = await openDb();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, mode);
    const store = transaction.objectStore(storeName);
    const request = action(store);

    transaction.oncomplete = () => resolve(request ? (request as IDBRequest<T>).result : undefined);
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function saveSession(session: FocusSession): Promise<void> {
  await tx(SESSION_STORE, "readwrite", (store) => store.put(session));
}

export async function getSessions(): Promise<FocusSession[]> {
  const result = await tx<FocusSession[]>(SESSION_STORE, "readonly", (store) => store.getAll());
  return (result ?? []).sort((a, b) => b.startTime.localeCompare(a.startTime));
}

export async function deleteSession(id: string): Promise<void> {
  await tx(SESSION_STORE, "readwrite", (store) => store.delete(id));
}

export async function clearSessions(): Promise<void> {
  await tx(SESSION_STORE, "readwrite", (store) => store.clear());
}

export async function getSettings(): Promise<UserSettings> {
  const result = await tx<{ id: string; value: UserSettings }>(
    SETTINGS_STORE,
    "readonly",
    (store) => store.get("settings")
  );

  return (
    result?.value ?? {
      defaultMode: "pomodoro",
      pomodoroMinutes: 25,
      shortBreakMinutes: 5,
      longFocusMinutes: 50,
      theme: "system",
      notificationEnabled: false
    }
  );
}

export async function saveSettings(settings: UserSettings): Promise<void> {
  await tx(SETTINGS_STORE, "readwrite", (store) =>
    store.put({
      id: "settings",
      value: settings
    })
  );
}
