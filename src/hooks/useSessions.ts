import { useCallback, useEffect, useState } from "react";
import { FocusSession } from "../types";
import { clearSessions, deleteSession, getSessions, saveSession } from "../lib/storage";

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
      await refresh();
    },
    [refresh]
  );

  const remove = useCallback(
    async (id: string) => {
      await deleteSession(id);
      await refresh();
    },
    [refresh]
  );

  const clear = useCallback(async () => {
    await clearSessions();
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
