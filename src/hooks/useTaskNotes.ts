import { useCallback, useEffect, useState } from "react";
import { TaskNote } from "../types";
import { deleteTaskNote, getTaskNotes, saveTaskNote } from "../lib/storage";
import { deleteCloudTaskNote, pushTaskNote } from "../lib/cloudSync";

export function useTaskNotes(taskId: string | null) {
  const [notes, setNotes] = useState<TaskNote[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!taskId) {
      setNotes([]);
      return;
    }
    setLoading(true);
    const data = await getTaskNotes(taskId);
    setNotes(data);
    setLoading(false);
  }, [taskId]);

  const upsert = useCallback(
    async (note: TaskNote) => {
      await saveTaskNote(note);
      pushTaskNote(note);
      await refresh();
    },
    [refresh]
  );

  const remove = useCallback(
    async (id: string) => {
      await deleteTaskNote(id);
      deleteCloudTaskNote(id);
      await refresh();
    },
    [refresh]
  );

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { notes, loading, upsert, remove, refresh };
}
