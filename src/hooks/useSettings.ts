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

const THEME_KEY = "openfocus_theme";

export function useSettings() {
  const [settings, setSettings] = useState<UserSettings>(() => {
    const cachedTheme = typeof localStorage !== "undefined" ? localStorage.getItem(THEME_KEY) : null;
    return {
      ...DEFAULT_SETTINGS,
      theme:
        cachedTheme === "light" || cachedTheme === "dark" || cachedTheme === "system"
          ? (cachedTheme as UserSettings["theme"])
          : DEFAULT_SETTINGS.theme
    };
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSettings().then((s) => {
      setSettings(s);
      setLoading(false);
      try {
        localStorage.setItem(THEME_KEY, s.theme);
      } catch {
        /* ignore */
      }
    });
  }, []);

  const update = useCallback(
    async (patch: Partial<UserSettings>) => {
      setSettings((prev) => {
        const next = { ...prev, ...patch };
        saveSettings(next).catch(console.error);
        if (patch.theme) {
          try {
            localStorage.setItem(THEME_KEY, patch.theme);
          } catch {
            /* ignore */
          }
        }
        return next;
      });
    },
    []
  );

  return { settings, loading, update };
}
