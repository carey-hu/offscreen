import { FocusSession, MoodEntry, Task, TaskNote, UserSettings } from "../types";

const DB_NAME = "openfocus_db";
const DB_VERSION = 4;
const SESSION_STORE = "focus_sessions";
const SETTINGS_STORE = "settings";
const TASK_STORE = "tasks";
const TASK_NOTE_STORE = "task_notes";
const MOOD_STORE = "mood_entries";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = request.result;
      const upgradeTx = request.transaction;
      const oldVersion = event.oldVersion;

      if (!db.objectStoreNames.contains(SESSION_STORE)) {
        const store = db.createObjectStore(SESSION_STORE, { keyPath: "id" });
        store.createIndex("updatedAt", "updatedAt");
        store.createIndex("startTime", "startTime");
        store.createIndex("status", "status");
      }

      if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
        db.createObjectStore(SETTINGS_STORE, { keyPath: "id" });
      }

      if (!db.objectStoreNames.contains(TASK_STORE)) {
        const store = db.createObjectStore(TASK_STORE, { keyPath: "id" });
        store.createIndex("tag", "tag");
      }

      if (!db.objectStoreNames.contains(TASK_NOTE_STORE)) {
        const store = db.createObjectStore(TASK_NOTE_STORE, { keyPath: "id" });
        store.createIndex("taskId", "taskId");
        store.createIndex("date", "date");
      }

      if (!db.objectStoreNames.contains(MOOD_STORE)) {
        const store = db.createObjectStore(MOOD_STORE, { keyPath: "id" });
        store.createIndex("date", "date");
      }

      // v3: clear previously seeded default tasks
      if (oldVersion < 3 && upgradeTx && db.objectStoreNames.contains(TASK_STORE)) {
        const store = upgradeTx.objectStore(TASK_STORE);
        const cursorReq = store.openCursor();
        cursorReq.onsuccess = () => {
          const cursor = cursorReq.result;
          if (!cursor) return;
          const id = String(cursor.primaryKey);
          if (id.startsWith("seed-")) cursor.delete();
          cursor.continue();
        };
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

export async function saveTask(task: Task): Promise<void> {
  await tx(TASK_STORE, "readwrite", (store) => store.put(task));
}

export async function getTasks(): Promise<Task[]> {
  const result = await tx<Task[]>(TASK_STORE, "readonly", (store) => store.getAll());
  return result ?? [];
}

export async function deleteTask(id: string): Promise<void> {
  await tx(TASK_STORE, "readwrite", (store) => store.delete(id));
}

export async function saveTaskNote(note: TaskNote): Promise<void> {
  await tx(TASK_NOTE_STORE, "readwrite", (store) => store.put(note));
}

export async function getTaskNotes(taskId: string): Promise<TaskNote[]> {
  const result = await tx<TaskNote[]>(TASK_NOTE_STORE, "readonly", (store) => {
    const index = store.index("taskId");
    return index.getAll(taskId);
  });
  return (result ?? []).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getAllTaskNotes(): Promise<TaskNote[]> {
  const result = await tx<TaskNote[]>(TASK_NOTE_STORE, "readonly", (store) => store.getAll());
  return result ?? [];
}

export async function getNotesByDate(date: string): Promise<TaskNote[]> {
  const result = await tx<TaskNote[]>(TASK_NOTE_STORE, "readonly", (store) => {
    const index = store.index("date");
    return index.getAll(date);
  });
  return (result ?? []).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function deleteTaskNote(id: string): Promise<void> {
  await tx(TASK_NOTE_STORE, "readwrite", (store) => store.delete(id));
}

export async function saveMoodEntry(entry: MoodEntry): Promise<void> {
  await tx(MOOD_STORE, "readwrite", (store) => store.put(entry));
}

export async function getAllMoodEntries(): Promise<MoodEntry[]> {
  const result = await tx<MoodEntry[]>(MOOD_STORE, "readonly", (store) => store.getAll());
  return (result ?? []).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getMoodEntriesByDate(date: string): Promise<MoodEntry[]> {
  const result = await tx<MoodEntry[]>(MOOD_STORE, "readonly", (store) => {
    const index = store.index("date");
    return index.getAll(date);
  });
  return (result ?? []).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function deleteMoodEntry(id: string): Promise<void> {
  await tx(MOOD_STORE, "readwrite", (store) => store.delete(id));
}
