"use client";

import { createContext, useContext, useEffect, useState } from "react";

type ThemeContextType = { dark: boolean; toggle: () => void };

const THEME_KEY = "theme";

export const ThemeContext = createContext<ThemeContextType>({
  dark: false,
  toggle: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // null = not yet read from storage; prevents the sync effect from
  // running with the SSR default (false) and briefly erasing the dark class
  // that the inline <head> script already applied.
  const [dark, setDark] = useState<boolean | null>(null);

  // Read saved preference (or system preference) once on mount
  useEffect(() => {
    const saved = localStorage.getItem(THEME_KEY);
    const isDark =
      saved === "dark" ||
      (saved === null && window.matchMedia("(prefers-color-scheme: dark)").matches);
    setDark(isDark);
  }, []);

  // Sync <html> class and localStorage only after the real preference is known
  useEffect(() => {
    if (dark === null) return;
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem(THEME_KEY, dark ? "dark" : "light");
  }, [dark]);

  return (
    // Expose boolean externally; null is an internal initialization detail
    <ThemeContext.Provider
      value={{ dark: dark ?? false, toggle: () => setDark((d) => !(d ?? false)) }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
