// src/contexts/ThemeModeContext.tsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Theme } from "@mui/material/styles";
import { getAppTheme, AppThemeMode } from "../theme";

export type ThemePreference = "LIGHT" | "DARK" | "SYSTEM";

type ThemeModeContextType = {
  preference: ThemePreference;
  resolvedMode: AppThemeMode; // light | dark
  muiTheme: Theme;
  setPreference: (p: ThemePreference) => void;
};

const ThemeModeContext = createContext<ThemeModeContextType | undefined>(undefined);

const STORAGE_KEY = "planco_theme_preference";

function getSystemMode(): AppThemeMode {
  if (typeof window === "undefined") return "light";
  return window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ? "dark" : "light";
}

export const ThemeModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [preference, setPreferenceState] = useState<ThemePreference>(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as ThemePreference | null;
    return saved ?? "LIGHT";
  });

  const [systemMode, setSystemMode] = useState<AppThemeMode>(() => getSystemMode());

  // escuta mudança do sistema (se user escolher SYSTEM)
  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!mq) return;

    const handler = () => setSystemMode(mq.matches ? "dark" : "light");
    handler();

    // compat
    try {
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    } catch {
      mq.addListener(handler);
      return () => mq.removeListener(handler);
    }
  }, []);

  const resolvedMode: AppThemeMode = useMemo(() => {
    if (preference === "SYSTEM") return systemMode;
    return preference === "DARK" ? "dark" : "light";
  }, [preference, systemMode]);

  const muiTheme = useMemo(() => getAppTheme(resolvedMode), [resolvedMode]);

  const setPreference = (p: ThemePreference) => {
    setPreferenceState(p);
    localStorage.setItem(STORAGE_KEY, p);
  };

  const value: ThemeModeContextType = { preference, resolvedMode, muiTheme, setPreference };

  return <ThemeModeContext.Provider value={value}>{children}</ThemeModeContext.Provider>;
};

export const useThemeMode = () => {
  const ctx = useContext(ThemeModeContext);
  if (!ctx) throw new Error("useThemeMode must be used within ThemeModeProvider");
  return ctx;
};
