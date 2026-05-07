"use client";

import * as React from "react";
import { getSupabase } from "@/lib/supabase";

type Theme = "light" | "dark";

type ThemeContextValue = {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
};

const ThemeContext = React.createContext<ThemeContextValue | undefined>(undefined);
const STORAGE_KEY = "zinvest-theme";

function persistTheme(theme: Theme, userId?: string) {
  localStorage.setItem(STORAGE_KEY, theme);
  if (userId) {
    localStorage.setItem(`${STORAGE_KEY}:${userId}`, theme);
  }
}

async function syncThemeToProfile(userId: string, theme: Theme) {
  const supabase = getSupabase();
  if (!supabase) return;
  await supabase
    .from("users")
    .update({ theme_preference: theme })
    .eq("id", userId);
}

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
  document.documentElement.classList.toggle("dark", theme === "dark");
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = React.useState<Theme>("light");
  const [userId, setUserId] = React.useState<string | null>(null);

  const setTheme = React.useCallback(
    (nextTheme: Theme) => {
      setThemeState(nextTheme);
      applyTheme(nextTheme);
      persistTheme(nextTheme, userId ?? undefined);
      if (userId) {
        void syncThemeToProfile(userId, nextTheme).catch(() => {});
      }
    },
    [userId],
  );

  const toggleTheme = React.useCallback(() => {
    setTheme(theme === "light" ? "dark" : "light");
  }, [theme, setTheme]);

  React.useEffect(() => {
    const sessionRaw = localStorage.getItem("zinvest-session");
    let session: { id?: string } | null = null;
    if (sessionRaw) {
      try {
        session = JSON.parse(sessionRaw) as { id?: string };
      } catch {
        session = null;
      }
    }
    const nextUserId = session?.id ?? null;
    setUserId(nextUserId);
    const userStored = nextUserId ? localStorage.getItem(`${STORAGE_KEY}:${nextUserId}`) : null;
    const stored = userStored ?? localStorage.getItem(STORAGE_KEY);
    const initial: Theme = stored === "dark" || stored === "light" ? stored : "light";
    setThemeState(initial);
    applyTheme(initial);
  }, []);

  return <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = React.useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
