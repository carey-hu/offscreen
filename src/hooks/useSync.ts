import { useCallback, useEffect, useRef, useState } from "react";
import { isCloudSyncAvailable, registerSyncCallback, syncAll } from "../lib/cloudSync";

export type SyncStatus = "idle" | "syncing" | "error" | "offline";

const LAST_SYNC_KEY = "openfocus_last_sync_at";

interface Options {
  // Called after a successful pull so the React state can be refreshed
  // from IndexedDB and the UI re-renders with new data.
  onSynced: () => Promise<void>;
}

export function useSync({ onSynced }: Options) {
  const [status, setStatus] = useState<SyncStatus>(
    isCloudSyncAvailable() ? "idle" : "offline"
  );
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(() => {
    try {
      const v = localStorage.getItem(LAST_SYNC_KEY);
      return v ? new Date(v) : null;
    } catch {
      return null;
    }
  });
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);

  const syncNow = useCallback(async () => {
    if (!isCloudSyncAvailable()) {
      setStatus("offline");
      return;
    }
    if (inFlight.current) return;
    inFlight.current = true;
    setStatus("syncing");
    setError(null);
    try {
      await syncAll();
      await onSynced();
      const now = new Date();
      setLastSyncAt(now);
      try {
        localStorage.setItem(LAST_SYNC_KEY, now.toISOString());
      } catch {
        /* ignore */
      }
      setStatus("idle");
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      setStatus("error");
      console.warn("[sync]", msg);
    } finally {
      inFlight.current = false;
    }
  }, [onSynced]);

  // Auto-pull on mount + register as the scheduleSync target
  useEffect(() => {
    registerSyncCallback(syncNow);
    if (isCloudSyncAvailable()) {
      syncNow();
    }
  }, [syncNow]);

  // Re-sync when the tab regains focus (catches changes from other devices)
  useEffect(() => {
    if (!isCloudSyncAvailable()) return;
    const onVis = () => {
      if (document.visibilityState === "visible") syncNow();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [syncNow]);

  return { status, lastSyncAt, error, syncNow };
}
