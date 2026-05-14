import { useCallback, useEffect, useState } from "react";
import { FocusSession } from "../types";
import { clearSessions, deleteSession, getSessions, saveSession } from "../lib/storage";
import { deleteCloudSession, pushSession } from "../lib/cloudSync";

export function useSessions() {
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const data = await getSessions();
    setSessions(data);
    setLoading(false);
  }, []);

  const upsert = useCallback(
    async (session: FocusSession) => {
      await saveSession(session);
      pushSession(session);
      await refresh();
    },
    [refresh]
  );

  const remove = useCallback(
    async (id: string) => {
      await deleteSession(id);
      deleteCloudSession(id);
      await refresh();
    },
    [refresh]
  );

  const clear = useCallback(async () => {
    const all = await getSessions();
    await clearSessions();
    for (const s of all) deleteCloudSession(s.id);
    await refresh();
  }, [refresh]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    sessions,
    loading,
    refresh,
    upsert,
    remove,
    clear
  };
}
