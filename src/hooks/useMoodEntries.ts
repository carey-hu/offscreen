import { useCallback, useEffect, useState } from "react";
import { MoodEntry } from "../types";
import {
  getAllMoodEntries,
  saveMoodEntry,
  deleteMoodEntry
} from "../lib/storage";
import { deleteCloudMoodEntry, scheduleSync } from "../lib/cloudSync";

export function useMoodEntries() {
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const data = await getAllMoodEntries();
    setEntries(data);
    setLoading(false);
  }, []);

  const upsert = useCallback(
    async (entry: MoodEntry) => {
      await saveMoodEntry(entry);
      scheduleSync();
      await refresh();
    },
    [refresh]
  );

  const remove = useCallback(
    async (id: string) => {
      await deleteMoodEntry(id);
      try {
        await deleteCloudMoodEntry(id);
      } catch {
        // softDeleteOne already logged; tombstone queue will retry next sync.
      }
      scheduleSync();
      await refresh();
    },
    [refresh]
  );

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { entries, loading, upsert, remove, refresh };
}
