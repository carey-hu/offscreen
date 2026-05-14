import { useCallback, useEffect, useState } from "react";
import { UserSettings } from "../types";
import { getSettings, saveSettings } from "../lib/storage";
import { pushSettings, scheduleSync } from "../lib/cloudSync";

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

  const refresh = useCallback(async () => {
    const s = await getSettings();
    setSettings(s);
    try {
      localStorage.setItem(THEME_KEY, s.theme);
    } catch {
      /* ignore */
    }
  }, []);

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
      const next = await new Promise<UserSettings>((resolve) => {
        setSettings((prev) => {
          const merged = { ...prev, ...patch, updatedAt: new Date().toISOString() };
          resolve(merged);
          return merged;
        });
      });
      try {
        await saveSettings(next);
      } catch (e) {
        console.warn("[settings] save failed", e);
      }
      pushSettings(next);
      scheduleSync();
      if (patch.theme) {
        try {
          localStorage.setItem(THEME_KEY, patch.theme);
        } catch {
          /* ignore */
        }
      }
    },
    []
  );

  return { settings, loading, update, refresh };
}
