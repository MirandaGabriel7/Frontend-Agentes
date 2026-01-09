// src/contexts/UiSettingsContext.tsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Theme } from "@mui/material/styles";
import { getAppTheme, AppThemeMode } from "../theme";

export type ThemeMode = "LIGHT" | "DARK" | "SYSTEM";

type UiSettingsContextType = {
  themeMode: ThemeMode;              // preferencia do user
  resolvedMode: AppThemeMode;        // light | dark aplicado
  muiTheme: Theme;                   // tema do MUI
  setThemeMode: (mode: ThemeMode) => void;
};

const UiSettingsContext = createContext<UiSettingsContextType | undefined>(undefined);

const LS_THEME_MODE = "planco_ui_theme_mode";

function systemMode(): AppThemeMode {
  if (typeof window === "undefined") return "light";
  return window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ? "dark" : "light";
}

export const UiSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem(LS_THEME_MODE) as ThemeMode | null;
    return saved ?? "LIGHT";
  });

  const [sysMode, setSysMode] = useState<AppThemeMode>(() => systemMode());

  // escuta mudança do sistema
  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!mq) return;

    const handler = () => setSysMode(mq.matches ? "dark" : "light");
    handler();

    try {
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    } catch {
      mq.addListener(handler);
      return () => mq.removeListener(handler);
    }
  }, []);

  const resolvedMode: AppThemeMode = useMemo(() => {
    if (themeMode === "SYSTEM") return sysMode;
    return themeMode === "DARK" ? "dark" : "light";
  }, [themeMode, sysMode]);

  const muiTheme = useMemo(() => getAppTheme(resolvedMode), [resolvedMode]);

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    localStorage.setItem(LS_THEME_MODE, mode);
  };

  const value: UiSettingsContextType = { themeMode, resolvedMode, muiTheme, setThemeMode };

  return <UiSettingsContext.Provider value={value}>{children}</UiSettingsContext.Provider>;
};

export const useUiSettings = () => {
  const ctx = useContext(UiSettingsContext);
  if (!ctx) throw new Error("useUiSettings must be used within UiSettingsProvider");
  return ctx;
};
