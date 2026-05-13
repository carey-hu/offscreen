import { useCallback, useEffect, useState } from "react";
import { MoodEntry } from "../types";
import {
  getAllMoodEntries,
  saveMoodEntry,
  deleteMoodEntry
} from "../lib/storage";

export function useMoodEntries() {
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    const data = await getAllMoodEntries();
    setEntries(data);
    setLoading(false);
  }, []);

  const upsert = useCallback(
    async (entry: MoodEntry) => {
      await saveMoodEntry(entry);
      await refresh();
    },
    [refresh]
  );

  const remove = useCallback(
    async (id: string) => {
      await deleteMoodEntry(id);
      await refresh();
    },
    [refresh]
  );

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { entries, loading, upsert, remove, refresh };
}
