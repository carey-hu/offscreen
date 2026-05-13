import { FocusSession, Task, UserSettings } from "../types";

const DB_NAME = "openfocus_db";
const DB_VERSION = 2;
const SESSION_STORE = "focus_sessions";
const SETTINGS_STORE = "settings";
const TASK_STORE = "tasks";

const DEFAULT_TASKS: Task[] = [
  { id: "seed-1", title: "模考复盘",            icon: "🧘", description: "--", tag: "学习", plannedMinutes: 25 },
  { id: "seed-2", title: "模考送小黄上岸",       icon: "🎓", description: "--", tag: "考试", plannedMinutes: 50 },
  { id: "seed-3", title: "申论带来好消息",       icon: "💌", description: "--", tag: "写作", plannedMinutes: 30 },
  { id: "seed-4", title: "数量",                icon: "💯", description: "--", tag: "练习", plannedMinutes: 25 },
  { id: "seed-5", title: "fulltime 认知·思维",   icon: "❤️", description: "--", tag: "工作", plannedMinutes: 50 },
  { id: "seed-6", title: "full time 注册会计",   icon: "🍦", description: "--", tag: "专业", plannedMinutes: 50 }
];

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = request.result;
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
        if (oldVersion < 2) {
          DEFAULT_TASKS.forEach((task) => store.add(task));
        }
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
