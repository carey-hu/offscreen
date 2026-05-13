import { useCallback, useEffect, useState } from "react";
import { UserSettings } from "../types";
import { getSettings, saveSettings } from "../lib/storage";

const DEFAULT_SETTINGS: UserSettings = {
  defaultMode: "pomodoro",
  pomodoroMinutes: 25,
  shortBreakMinutes: 5,
  longFocusMinutes: 50,
  theme: "system",
  notificationEnabled: false
};

export function useSettings() {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSettings().then((s) => {
      setSettings(s);
      setLoading(false);
    });
  }, []);

  const update = useCallback(
    async (patch: Partial<UserSettings>) => {
      setSettings((prev) => {
        const next = { ...prev, ...patch };
        saveSettings(next).catch(console.error);
        return next;
      });
    },
    []
  );

  return { settings, loading, update };
}
