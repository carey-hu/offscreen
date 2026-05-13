import { useCallback, useEffect, useState } from "react";
import { Task } from "../types";
import { deleteTask, getTasks, saveTask } from "../lib/storage";

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const data = await getTasks();
    setTasks(data);
    setLoading(false);
  }, []);

  const upsert = useCallback(
    async (task: Task) => {
      await saveTask(task);
      await refresh();
    },
    [refresh]
  );

  const remove = useCallback(
    async (id: string) => {
      await deleteTask(id);
      await refresh();
    },
    [refresh]
  );

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { tasks, loading, refresh, upsert, remove };
}
