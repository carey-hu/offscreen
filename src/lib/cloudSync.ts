import { createClient } from "@supabase/supabase-js";
import { FocusSession } from "../types";
import { getSessions, saveSession } from "./storage";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase =
  url && anonKey ? createClient(url, anonKey) : null;

export function isCloudSyncAvailable() {
  return Boolean(supabase);
}

export async function pushLocalSessionsToCloud(userId: string) {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const sessions = await getSessions();

  const rows = sessions.map((s) => ({
    id: s.id,
    user_id: userId,
    device_id: s.deviceId,
    title: s.title,
    tag: s.tag,
    mode: s.mode,
    start_time: s.startTime,
    end_time: s.endTime ?? null,
    planned_minutes: s.plannedMinutes,
    actual_minutes: s.actualMinutes,
    status: s.status,
    created_at: s.createdAt,
    updated_at: s.updatedAt,
    synced_at: new Date().toISOString()
  }));

  const { error } = await supabase.from("focus_sessions").upsert(rows);

  if (error) throw error;
}

export async function pullCloudSessions(userId: string) {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { data, error } = await supabase
    .from("focus_sessions")
    .select("*")
    .eq("user_id", userId)
    .order("start_time", { ascending: false });

  if (error) throw error;

  for (const row of data ?? []) {
    const session: FocusSession = {
      id: row.id,
      deviceId: row.device_id,
      title: row.title,
      tag: row.tag,
      mode: row.mode,
      startTime: row.start_time,
      endTime: row.end_time ?? undefined,
      plannedMinutes: row.planned_minutes,
      actualMinutes: row.actual_minutes,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      syncedAt: row.synced_at ?? undefined
    };

    await saveSession(session);
  }
}
