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
  saveTaskNote
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
}

interface CloudTaskNote {
  id: string;
  user_id: string;
  task_id: string;
  date: string;
  content: string;
  created_at: string;
  updated_at: string;
}

interface CloudMoodEntry {
  id: string;
  user_id: string;
  date: string;
  content: string;
  position: StarPosition | null;
  created_at: string;
  updated_at: string;
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

function sessionToCloud(s: FocusSession, uid: string): CloudSession {
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

function taskToCloud(t: Task, uid: string): CloudTask {
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

function noteToCloud(n: TaskNote, uid: string): CloudTaskNote {
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

function moodToCloud(m: MoodEntry, uid: string): CloudMoodEntry {
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

// ── Per-record push (fire-and-forget) ──────────────────────────────────────
//
// Each local write triggers an immediate non-blocking upsert to cloud.
// On network failure we log and move on; the next full syncAll() will catch it
// (because local.updated_at > cloud.updated_at).

function logPushErr(table: string, err: unknown) {
  // eslint-disable-next-line no-console
  console.warn(`[sync] push ${table} failed:`, err);
}

export function pushSession(s: FocusSession): void {
  if (!supabase || !userId) return;
  supabase
    .from("focus_sessions")
    .upsert(sessionToCloud(s, userId))
    .then(({ error }) => { if (error) logPushErr("focus_sessions", error.message); });
}

export function pushTask(t: Task): void {
  if (!supabase || !userId) return;
  supabase
    .from("tasks")
    .upsert(taskToCloud(t, userId))
    .then(({ error }) => { if (error) logPushErr("tasks", error.message); });
}

export function pushTaskNote(n: TaskNote): void {
  if (!supabase || !userId) return;
  supabase
    .from("task_notes")
    .upsert(noteToCloud(n, userId))
    .then(({ error }) => { if (error) logPushErr("task_notes", error.message); });
}

export function pushMoodEntry(m: MoodEntry): void {
  if (!supabase || !userId) return;
  supabase
    .from("mood_entries")
    .upsert(moodToCloud(m, userId))
    .then(({ error }) => { if (error) logPushErr("mood_entries", error.message); });
}

export function pushSettings(s: UserSettings): void {
  if (!supabase || !userId) return;
  supabase
    .from("user_settings")
    .upsert(settingsToCloud(s, userId))
    .then(({ error }) => { if (error) logPushErr("user_settings", error.message); });
}

// ── Per-record delete ──────────────────────────────────────────────────────

export function deleteCloudSession(id: string): void {
  if (!supabase || !userId) return;
  supabase
    .from("focus_sessions")
    .delete()
    .eq("id", id)
    .eq("user_id", userId)
    .then(({ error }) => { if (error) logPushErr("focus_sessions delete", error.message); });
}

export function deleteCloudTask(id: string): void {
  if (!supabase || !userId) return;
  supabase
    .from("tasks")
    .delete()
    .eq("id", id)
    .eq("user_id", userId)
    .then(({ error }) => { if (error) logPushErr("tasks delete", error.message); });
}

export function deleteCloudTaskNote(id: string): void {
  if (!supabase || !userId) return;
  supabase
    .from("task_notes")
    .delete()
    .eq("id", id)
    .eq("user_id", userId)
    .then(({ error }) => { if (error) logPushErr("task_notes delete", error.message); });
}

export function deleteCloudMoodEntry(id: string): void {
  if (!supabase || !userId) return;
  supabase
    .from("mood_entries")
    .delete()
    .eq("id", id)
    .eq("user_id", userId)
    .then(({ error }) => { if (error) logPushErr("mood_entries delete", error.message); });
}

// ── Generic per-table sync ─────────────────────────────────────────────────

interface SyncTableOpts<L, C> {
  table: string;
  client: SupabaseClient;
  uid: string;
  toCloud: (l: L, uid: string) => C;
  fromCloud: (c: C) => L;
  getLocalId: (l: L) => string;
  getLocalUpdatedAt: (l: L) => string;
  getCloudUpdatedAt: (c: C) => string;
  fetchLocal: () => Promise<L[]>;
  saveLocal: (l: L) => Promise<void>;
}

async function syncTable<L, C extends { id: string }>(opts: SyncTableOpts<L, C>): Promise<void> {
  const { client, uid, table } = opts;

  const [{ data: cloudRows, error: pullErr }, localRows] = await Promise.all([
    client.from(table).select("*").eq("user_id", uid),
    opts.fetchLocal()
  ]);
  if (pullErr) throw new Error(`[sync] pull ${table}: ${pullErr.message}`);

  const cloudById = new Map<string, C>();
  for (const row of (cloudRows ?? []) as C[]) cloudById.set(row.id, row);

  const localById = new Map<string, L>();
  for (const l of localRows) localById.set(opts.getLocalId(l), l);

  // Cloud → local: pull rows where cloud is newer (or local missing)
  for (const [id, cloud] of cloudById) {
    const local = localById.get(id);
    const cloudUpdatedAt = opts.getCloudUpdatedAt(cloud);
    if (!local || opts.getLocalUpdatedAt(local) < cloudUpdatedAt) {
      await opts.saveLocal(opts.fromCloud(cloud));
    }
  }

  // Local → cloud: batch-upsert rows where local is newer (or cloud missing)
  const toPush: C[] = [];
  for (const [id, local] of localById) {
    const cloud = cloudById.get(id);
    if (!cloud || opts.getCloudUpdatedAt(cloud) < opts.getLocalUpdatedAt(local)) {
      toPush.push(opts.toCloud(local, uid));
    }
  }
  if (toPush.length > 0) {
    const { error: pushErr } = await client.from(table).upsert(toPush);
    if (pushErr) throw new Error(`[sync] push ${table}: ${pushErr.message}`);
  }
}

// ── Full sync ──────────────────────────────────────────────────────────────

export async function syncAll(): Promise<void> {
  const { client, uid } = assertReady();

  await Promise.all([
    syncTable<FocusSession, CloudSession>({
      table: "focus_sessions",
      client, uid,
      toCloud: sessionToCloud,
      fromCloud: sessionFromCloud,
      getLocalId: (s) => s.id,
      getLocalUpdatedAt: (s) => s.updatedAt,
      getCloudUpdatedAt: (c) => c.updated_at,
      fetchLocal: getSessions,
      saveLocal: saveSession
    }),
    syncTable<Task, CloudTask>({
      table: "tasks",
      client, uid,
      toCloud: taskToCloud,
      fromCloud: taskFromCloud,
      getLocalId: (t) => t.id,
      getLocalUpdatedAt: (t) => t.updatedAt ?? "1970-01-01T00:00:00.000Z",
      getCloudUpdatedAt: (c) => c.updated_at,
      fetchLocal: getTasks,
      saveLocal: saveTask
    }),
    syncTable<TaskNote, CloudTaskNote>({
      table: "task_notes",
      client, uid,
      toCloud: noteToCloud,
      fromCloud: noteFromCloud,
      getLocalId: (n) => n.id,
      getLocalUpdatedAt: (n) => n.updatedAt,
      getCloudUpdatedAt: (c) => c.updated_at,
      fetchLocal: getAllTaskNotes,
      saveLocal: saveTaskNote
    }),
    syncTable<MoodEntry, CloudMoodEntry>({
      table: "mood_entries",
      client, uid,
      toCloud: moodToCloud,
      fromCloud: moodFromCloud,
      getLocalId: (m) => m.id,
      getLocalUpdatedAt: (m) => m.updatedAt,
      getCloudUpdatedAt: (c) => c.updated_at,
      fetchLocal: getAllMoodEntries,
      saveLocal: saveMoodEntry
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
