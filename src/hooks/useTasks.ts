import { useCallback, useEffect, useState } from "react";
import { Task } from "../types";
import { deleteTask, getTasks, saveTask } from "../lib/storage";
import { deleteCloudTask, pushTask, scheduleSync } from "../lib/cloudSync";

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
      const stamped = { ...task, updatedAt: new Date().toISOString() };
      await saveTask(stamped);
      pushTask(stamped);
      scheduleSync();
      await refresh();
    },
    [refresh]
  );

  const remove = useCallback(
    async (id: string) => {
      await deleteTask(id);
      await deleteCloudTask(id);
      scheduleSync();
      await refresh();
    },
    [refresh]
  );

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { tasks, loading, refresh, upsert, remove };
}
