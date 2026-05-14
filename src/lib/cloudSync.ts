import { createClient, SupabaseClient } from "@supabase/supabase-js";
import {
  FocusMode,
  FocusSession,
  FocusStatus,
  MoodEntry,
  StarPosition,
  Task,
  TaskNote,
  UserSettings
} from "../types";
import {
  getAllMoodEntries,
  getAllTaskNotes,
  getSessions,
  getSettings,
  getTasks,
  saveMoodEntry,
  saveSession,
  saveSettings,
  saveTask,
  saveTaskNote,
  deleteMoodEntry,
  deleteSession,
  deleteTask,
  deleteTaskNote
} from "./storage";

// ── Config ─────────────────────────────────────────────────────────────────

const rawUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const userId = import.meta.env.VITE_USER_ID as string | undefined;

// Strip trailing /rest/v1/ if user copied REST endpoint URL from Supabase dashboard
const url = rawUrl?.replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");

export const supabase: SupabaseClient | null =
  url && anonKey ? createClient(url, anonKey) : null;

export function isCloudSyncAvailable(): boolean {
  return Boolean(supabase && userId);
}

export function getUserId(): string | null {
  return userId ?? null;
}

function assertReady(): { client: SupabaseClient; uid: string } {
  if (!supabase || !userId) {
    throw new Error("Cloud sync is not configured (missing env vars)");
  }
  return { client: supabase, uid: userId };
}

// ── Cloud row types ────────────────────────────────────────────────────────

interface CloudSession {
  id: string;
  user_id: string;
  device_id: string;
  task_id: string | null;
  title: string;
  tag: string;
  mode: string;
  start_time: string;
  end_time: string | null;
  planned_minutes: number;
  actual_minutes: number;
  status: string;
  focus_score: number | null;
  note: string | null;
  created_at: string;
  updated_at: string;
  synced_at: string | null;
  deleted_at: string | null;
}

interface CloudTask {
  id: string;
  user_id: string;
  title: string;
  icon: string;
  description: string;
  tag: string;
  planned_minutes: number | null;
  updated_at: string;
  deleted_at: string | null;
}

interface CloudTaskNote {
  id: string;
  user_id: string;
  task_id: string;
  date: string;
  content: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

interface CloudMoodEntry {
  id: string;
  user_id: string;
  date: string;
  content: string;
  position: StarPosition | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

interface CloudUserSettings {
  user_id: string;
  default_mode: string;
  pomodoro_minutes: number;
  short_break_minutes: number;
  long_focus_minutes: number;
  theme: string;
  notification_enabled: boolean;
  updated_at: string;
}

// ── Mappers ────────────────────────────────────────────────────────────────

// NOTE: deleted_at is intentionally omitted from all toCloud payloads.
// Including it would let a concurrent sync-push overwrite a tombstone another
// device just wrote, resurrecting the row. Upsert only updates columns present
// in the payload, so omitting deleted_at preserves whatever the DB already has.
function sessionToCloud(s: FocusSession, uid: string): Omit<CloudSession, "deleted_at"> {
  return {
    id: s.id,
    user_id: uid,
    device_id: s.deviceId,
    task_id: s.taskId ?? null,
    title: s.title,
    tag: s.tag,
    mode: s.mode,
    start_time: s.startTime,
    end_time: s.endTime ?? null,
    planned_minutes: s.plannedMinutes,
    actual_minutes: s.actualMinutes,
    status: s.status,
    focus_score: s.focusScore ?? null,
    note: s.note ?? null,
    created_at: s.createdAt,
    updated_at: s.updatedAt,
    synced_at: new Date().toISOString()
  };
}

function sessionFromCloud(c: CloudSession): FocusSession {
  return {
    id: c.id,
    deviceId: c.device_id,
    taskId: c.task_id ?? undefined,
    title: c.title,
    tag: c.tag,
    mode: c.mode as FocusMode,
    startTime: c.start_time,
    endTime: c.end_time ?? undefined,
    plannedMinutes: c.planned_minutes,
    actualMinutes: c.actual_minutes,
    status: c.status as FocusStatus,
    focusScore: c.focus_score ?? undefined,
    note: c.note ?? undefined,
    createdAt: c.created_at,
    updatedAt: c.updated_at,
    syncedAt: c.synced_at ?? undefined
  };
}

function taskToCloud(t: Task, uid: string): Omit<CloudTask, "deleted_at"> {
  return {
    id: t.id,
    user_id: uid,
    title: t.title,
    icon: t.icon,
    description: t.description,
    tag: t.tag,
    planned_minutes: t.plannedMinutes ?? null,
    updated_at: t.updatedAt ?? new Date().toISOString()
  };
}

function taskFromCloud(c: CloudTask): Task {
  return {
    id: c.id,
    title: c.title,
    icon: c.icon,
    description: c.description,
    tag: c.tag,
    plannedMinutes: c.planned_minutes ?? undefined,
    updatedAt: c.updated_at
  };
}

function noteToCloud(n: TaskNote, uid: string): Omit<CloudTaskNote, "deleted_at"> {
  return {
    id: n.id,
    user_id: uid,
    task_id: n.taskId,
    date: n.date,
    content: n.content,
    created_at: n.createdAt,
    updated_at: n.updatedAt
  };
}

function noteFromCloud(c: CloudTaskNote): TaskNote {
  return {
    id: c.id,
    taskId: c.task_id,
    date: c.date,
    content: c.content,
    createdAt: c.created_at,
    updatedAt: c.updated_at
  };
}

function moodToCloud(m: MoodEntry, uid: string): Omit<CloudMoodEntry, "deleted_at"> {
  return {
    id: m.id,
    user_id: uid,
    date: m.date,
    content: m.content,
    position: m.position ?? null,
    created_at: m.createdAt,
    updated_at: m.updatedAt
  };
}

function moodFromCloud(c: CloudMoodEntry): MoodEntry {
  return {
    id: c.id,
    date: c.date,
    content: c.content,
    position: c.position ?? undefined,
    createdAt: c.created_at,
    updatedAt: c.updated_at
  };
}

function settingsToCloud(s: UserSettings, uid: string): CloudUserSettings {
  return {
    user_id: uid,
    default_mode: s.defaultMode,
    pomodoro_minutes: s.pomodoroMinutes,
    short_break_minutes: s.shortBreakMinutes,
    long_focus_minutes: s.longFocusMinutes,
    theme: s.theme,
    notification_enabled: s.notificationEnabled,
    updated_at: s.updatedAt ?? new Date().toISOString()
  };
}

function settingsFromCloud(c: CloudUserSettings): UserSettings {
  return {
    defaultMode: c.default_mode as FocusMode,
    pomodoroMinutes: c.pomodoro_minutes,
    shortBreakMinutes: c.short_break_minutes,
    longFocusMinutes: c.long_focus_minutes,
    theme: c.theme as UserSettings["theme"],
    notificationEnabled: c.notification_enabled,
    updatedAt: c.updated_at
  };
}

// ── Settings push (single-row, no conflict with deletes) ──────────────────

function logPushErr(table: string, err: unknown) {
  // eslint-disable-next-line no-console
  console.error(`[sync] push ${table} failed:`, err);
}

export function pushSettings(s: UserSettings): void {
  if (!supabase || !userId) return;
  supabase
    .from("user_settings")
    .upsert(settingsToCloud(s, userId))
    .then(({ error }) => { if (error) logPushErr("user_settings", error.message); });
}

// Per-record push for the 4 deletable tables was removed deliberately —
// a fire-and-forget upsert that runs after a concurrent delete from another
// device would silently resurrect a deleted row. All writes flow through
// scheduleSync() instead, which runs syncAll() that pulls-then-pushes with
// soft-delete awareness.

// ── Per-record soft-delete (awaitable, tombstone queue on failure) ────────
//
// We use UPDATE deleted_at = now() instead of a real DELETE so other devices
// can see the deletion via their next pull. The tombstone queue retries on
// transient failures, and pull-time we skip records the user just deleted
// (so they aren't pulled back before the cloud knows about the delete).
//
// IMPORTANT: this requires the cloud tables to have a `deleted_at timestamptz`
// column. Without it the UPDATE errors out (PostgREST "column does not exist")
// and softDeleteOne throws — see supabase/schema.sql.

const TOMBSTONE_KEY = "openfocus_pending_deletes";

interface Tombstone {
  table: string;
  id: string;
}

function readTombstones(): Tombstone[] {
  try {
    const raw = localStorage.getItem(TOMBSTONE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Tombstone[];
  } catch {
    return [];
  }
}

function writeTombstones(items: Tombstone[]): void {
  try {
    localStorage.setItem(TOMBSTONE_KEY, JSON.stringify(items));
  } catch {
    /* ignore */
  }
}

function queueTombstone(table: string, id: string): void {
  const list = readTombstones();
  if (!list.some((t) => t.table === table && t.id === id)) {
    list.push({ table, id });
    writeTombstones(list);
  }
}

function clearTombstone(table: string, id: string): void {
  const list = readTombstones().filter((t) => !(t.table === table && t.id === id));
  writeTombstones(list);
}

async function drainTombstones(client: SupabaseClient, uid: string): Promise<void> {
  const list = readTombstones();
  if (list.length === 0) return;
  const now = new Date().toISOString();
  for (const t of list) {
    const { error } = await client
      .from(t.table)
      .update({ deleted_at: now, updated_at: now })
      .eq("id", t.id)
      .eq("user_id", uid);
    if (!error) {
      clearTombstone(t.table, t.id);
    } else {
      // eslint-disable-next-line no-console
      console.error(`[sync] tombstone retry ${t.table}/${t.id}:`, error.message);
    }
  }
}

async function softDeleteOne(table: string, id: string): Promise<void> {
  if (!supabase || !userId) {
    queueTombstone(table, id);
    return;
  }
  const now = new Date().toISOString();
  const { error } = await supabase
    .from(table)
    .update({ deleted_at: now, updated_at: now })
    .eq("id", id)
    .eq("user_id", userId);
  if (error) {
    // Queue for retry, then throw so the caller (and unhandled-rejection
    // surfaces in browsers) can see the failure. Schema mismatches and RLS
    // misconfigs would otherwise be invisible — every prior bug here was
    // "I deleted but it came back" caused by a swallowed error.
    queueTombstone(table, id);
    throw new Error(`[sync] ${table} soft-delete failed: ${error.message}`);
  }
  clearTombstone(table, id);
}

export function deleteCloudSession(id: string): Promise<void> {
  return softDeleteOne("focus_sessions", id);
}

export function deleteCloudTask(id: string): Promise<void> {
  return softDeleteOne("tasks", id);
}

export function deleteCloudTaskNote(id: string): Promise<void> {
  return softDeleteOne("task_notes", id);
}

export function deleteCloudMoodEntry(id: string): Promise<void> {
  return softDeleteOne("mood_entries", id);
}

// ── Debounced auto-sync trigger ────────────────────────────────────────────
//
// Hooks call scheduleSync() after every local write. The registered callback
// (from useSync) runs syncAll(), which pulls fresh changes + reconciles, and
// updates the visible "last synced" timestamp.

let scheduledTimer: ReturnType<typeof setTimeout> | null = null;
let syncCallback: (() => Promise<void>) | null = null;

export function registerSyncCallback(cb: () => Promise<void>): void {
  syncCallback = cb;
}

export function scheduleSync(delayMs = 1500): void {
  if (!isCloudSyncAvailable() || !syncCallback) return;
  if (scheduledTimer) clearTimeout(scheduledTimer);
  scheduledTimer = setTimeout(() => {
    scheduledTimer = null;
    const cb = syncCallback;
    if (cb) cb().catch((e) => {
      // eslint-disable-next-line no-console
      console.error("[sync] scheduled sync failed:", e);
    });
  }, delayMs);
}

// ── Generic per-table sync ─────────────────────────────────────────────────

interface SyncTableOpts<L, C> {
  table: string;
  client: SupabaseClient;
  uid: string;
  toCloud: (l: L, uid: string) => Omit<C, "deleted_at">;
  fromCloud: (c: C) => L;
  getLocalId: (l: L) => string;
  getLocalUpdatedAt: (l: L) => string;
  getCloudUpdatedAt: (c: C) => string;
  getCloudDeletedAt: (c: C) => string | null;
  fetchLocal: () => Promise<L[]>;
  saveLocal: (l: L) => Promise<void>;
  deleteLocal: (id: string) => Promise<void>;
}

async function syncTable<L, C extends { id: string }>(opts: SyncTableOpts<L, C>): Promise<void> {
  const { client, uid, table } = opts;

  // IDs the user deleted locally but whose cloud soft-delete is still queued.
  // Skip pulling them so they don't reappear before the tombstone drains.
  const tombstoneIds = new Set(
    readTombstones().filter((t) => t.table === table).map((t) => t.id)
  );

  const [{ data: cloudRows, error: pullErr }, localRows] = await Promise.all([
    client.from(table).select("*").eq("user_id", uid),
    opts.fetchLocal()
  ]);
  if (pullErr) throw new Error(`[sync] pull ${table}: ${pullErr.message}`);

  const cloudById = new Map<string, C>();
  for (const row of (cloudRows ?? []) as C[]) cloudById.set(row.id, row);

  const localById = new Map<string, L>();
  for (const l of localRows) localById.set(opts.getLocalId(l), l);

  // Cloud → local
  for (const [id, cloud] of cloudById) {
    if (tombstoneIds.has(id)) continue;

    const cloudDeletedAt = opts.getCloudDeletedAt(cloud);
    if (cloudDeletedAt) {
      // Another device soft-deleted this row. Hard-delete it locally if present.
      if (localById.has(id)) {
        await opts.deleteLocal(id);
      }
      continue;
    }

    const local = localById.get(id);
    const cloudUpdatedAt = opts.getCloudUpdatedAt(cloud);
    if (!local || opts.getLocalUpdatedAt(local) < cloudUpdatedAt) {
      await opts.saveLocal(opts.fromCloud(cloud));
    }
  }

  // Local → cloud (skip rows the cloud has soft-deleted — don't resurrect)
  const toPush: Omit<C, "deleted_at">[] = [];
  for (const [id, local] of localById) {
    const cloud = cloudById.get(id);
    if (cloud && opts.getCloudDeletedAt(cloud)) continue;
    if (!cloud || opts.getCloudUpdatedAt(cloud) < opts.getLocalUpdatedAt(local)) {
      toPush.push(opts.toCloud(local, uid));
    }
  }
  if (toPush.length > 0) {
    // Cast: upsert expects full C, but omitting deleted_at is intentional —
    // Postgres won't update columns absent from the payload, preserving any
    // tombstone written between our pull and push.
    const { error: pushErr } = await client.from(table).upsert(toPush as unknown as C[]);
    if (pushErr) throw new Error(`[sync] push ${table}: ${pushErr.message}`);
  }
}

// ── Full sync ──────────────────────────────────────────────────────────────

export async function syncAll(): Promise<void> {
  const { client, uid } = assertReady();

  // Drain any queued soft-deletes first so we don't pull deleted rows back.
  await drainTombstones(client, uid);

  await Promise.all([
    syncTable<FocusSession, CloudSession>({
      table: "focus_sessions",
      client, uid,
      toCloud: sessionToCloud,
      fromCloud: sessionFromCloud,
      getLocalId: (s) => s.id,
      getLocalUpdatedAt: (s) => s.updatedAt,
      getCloudUpdatedAt: (c) => c.updated_at,
      getCloudDeletedAt: (c) => c.deleted_at,
      fetchLocal: getSessions,
      saveLocal: saveSession,
      deleteLocal: deleteSession
    }),
    syncTable<Task, CloudTask>({
      table: "tasks",
      client, uid,
      toCloud: taskToCloud,
      fromCloud: taskFromCloud,
      getLocalId: (t) => t.id,
      getLocalUpdatedAt: (t) => t.updatedAt ?? "1970-01-01T00:00:00.000Z",
      getCloudUpdatedAt: (c) => c.updated_at,
      getCloudDeletedAt: (c) => c.deleted_at,
      fetchLocal: getTasks,
      saveLocal: saveTask,
      deleteLocal: deleteTask
    }),
    syncTable<TaskNote, CloudTaskNote>({
      table: "task_notes",
      client, uid,
      toCloud: noteToCloud,
      fromCloud: noteFromCloud,
      getLocalId: (n) => n.id,
      getLocalUpdatedAt: (n) => n.updatedAt,
      getCloudUpdatedAt: (c) => c.updated_at,
      getCloudDeletedAt: (c) => c.deleted_at,
      fetchLocal: getAllTaskNotes,
      saveLocal: saveTaskNote,
      deleteLocal: deleteTaskNote
    }),
    syncTable<MoodEntry, CloudMoodEntry>({
      table: "mood_entries",
      client, uid,
      toCloud: moodToCloud,
      fromCloud: moodFromCloud,
      getLocalId: (m) => m.id,
      getLocalUpdatedAt: (m) => m.updatedAt,
      getCloudUpdatedAt: (c) => c.updated_at,
      getCloudDeletedAt: (c) => c.deleted_at,
      fetchLocal: getAllMoodEntries,
      saveLocal: saveMoodEntry,
      deleteLocal: deleteMoodEntry
    }),
    syncSettings(client, uid)
  ]);
}

async function syncSettings(client: SupabaseClient, uid: string): Promise<void> {
  const [{ data: cloudRow, error }, localSettings] = await Promise.all([
    client.from("user_settings").select("*").eq("user_id", uid).maybeSingle(),
    getSettings()
  ]);
  if (error) throw new Error(`[sync] pull user_settings: ${error.message}`);

  const localUpdatedAt = localSettings.updatedAt ?? "1970-01-01T00:00:00.000Z";
  const cloudUpdatedAt = (cloudRow as CloudUserSettings | null)?.updated_at;

  if (cloudRow && (!cloudUpdatedAt || cloudUpdatedAt > localUpdatedAt)) {
    await saveSettings(settingsFromCloud(cloudRow as CloudUserSettings));
  } else if (!cloudRow || (cloudUpdatedAt && localUpdatedAt > cloudUpdatedAt)) {
    const { error: pushErr } = await client
      .from("user_settings")
      .upsert(settingsToCloud(localSettings, uid));
    if (pushErr) throw new Error(`[sync] push user_settings: ${pushErr.message}`);
  }
}
