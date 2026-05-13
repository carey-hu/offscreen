import { useEffect } from "react";
import { UserSettings } from "../types";

export function useThemeApplier(theme: UserSettings["theme"]) {
  useEffect(() => {
    const apply = (mode: "light" | "dark") => {
      const root = document.documentElement;
      if (mode === "dark") root.classList.add("dark");
      else root.classList.remove("dark");
    };

    if (theme === "system") {
      const mql = window.matchMedia("(prefers-color-scheme: dark)");
      apply(mql.matches ? "dark" : "light");
      const onChange = (e: MediaQueryListEvent) => apply(e.matches ? "dark" : "light");
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    }

    apply(theme);
  }, [theme]);
}
