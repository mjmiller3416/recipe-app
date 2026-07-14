"use client";

import { useCallback, useEffect, useState } from "react";
import {
  useSettings,
  LEGACY_THEME_STORAGE_KEY,
  type AppearanceSettings,
} from "@/hooks/persistence/useSettings";

export type ThemePreference = AppearanceSettings["theme"]; // "light" | "dark" | "system"
export type ResolvedTheme = "light" | "dark";

function resolveTheme(preference: ThemePreference): ResolvedTheme {
  if (preference === "system") {
    return window.matchMedia("(prefers-color-scheme: light)").matches
      ? "light"
      : "dark";
  }
  return preference;
}

function applyTheme(resolved: ResolvedTheme) {
  const root = document.documentElement;
  // Force all CSS variable changes into a single frame (see .no-transition in globals.css)
  root.classList.add("no-transition");
  root.classList.toggle("light", resolved === "light");
  requestAnimationFrame(() => {
    root.classList.remove("no-transition");
  });
}

interface UseThemeReturn {
  /** The user's stored preference, including "system" */
  theme: ThemePreference;
  /** The preference resolved against the OS setting — what's actually on screen */
  resolvedTheme: ResolvedTheme;
  /** Set an explicit preference (persists via the settings store) */
  setTheme: (preference: ThemePreference) => void;
  /** Binary flip of the currently resolved theme */
  toggleTheme: () => void;
}

/**
 * Single source of truth for theming.
 *
 * The preference lives in the settings store (`settings.appearance.theme`), so
 * the Settings page, the TopNav toggle, and the mobile More sheet can never
 * disagree — every instance syncs through useSettings' "settings-updated"
 * event and persists to localStorage + API through the same path.
 *
 * First paint is handled by the blocking inline script in the root layout;
 * this hook only keeps the DOM class in sync afterwards.
 */
export function useTheme(): UseThemeReturn {
  const { settings, updateSettings, isLoaded } = useSettings();
  const preference = settings.appearance.theme;

  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() =>
    typeof window === "undefined" ? "dark" : resolveTheme(preference)
  );

  // Apply the preference to the DOM; track OS changes while on "system"
  useEffect(() => {
    const apply = () => {
      const resolved = resolveTheme(preference);
      setResolvedTheme(resolved);
      applyTheme(resolved);
    };
    apply();

    if (preference === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: light)");
      mediaQuery.addEventListener("change", apply);
      return () => mediaQuery.removeEventListener("change", apply);
    }
  }, [preference]);

  // One-time migration off the pre-unification "theme" localStorage key
  useEffect(() => {
    if (!isLoaded) return;
    const legacy = localStorage.getItem(LEGACY_THEME_STORAGE_KEY);
    if (legacy !== "light" && legacy !== "dark") return;
    localStorage.removeItem(LEGACY_THEME_STORAGE_KEY);
    if (legacy !== preference) {
      updateSettings("appearance", { theme: legacy });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- migration runs once, when settings finish loading
  }, [isLoaded]);

  const setTheme = useCallback(
    (next: ThemePreference) => {
      updateSettings("appearance", { theme: next });
    },
    [updateSettings]
  );

  const toggleTheme = useCallback(() => {
    setTheme(resolvedTheme === "light" ? "dark" : "light");
  }, [resolvedTheme, setTheme]);

  return { theme: preference, resolvedTheme, setTheme, toggleTheme };
}
