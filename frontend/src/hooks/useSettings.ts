"use client";

import { useState, useEffect, useCallback } from "react";

// ============================================================================
// TYPES
// ============================================================================

export interface UserProfile {
  displayName: string;
  email: string;
  avatar: string; // URL or empty string
}

export interface AppearanceSettings {
  theme: "light" | "dark" | "system";
  // Future: accentColor, fontSize, etc.
}

export interface MealPlanningSettings {
  defaultServings: number;
  weekStartDay: "sunday" | "monday";
  defaultMealTypes: string[];
  // Future: showNutrition, etc.
}

export interface RecipePreferences {
  measurementUnit: "imperial" | "metric";
  dietaryRestrictions: string[];
  allergenAlerts: string[];
  defaultBrowserView: "grid" | "list";
  defaultSortOrder: "alphabetical" | "recent" | "cookTime";
  quickFilters: string[]; // IDs of quick filters to display (max 5)
}

export interface ShoppingListSettings {
  categorySortOrder: "alphabetical" | "custom";
  autoClearChecked: "manual" | "onRefresh" | "daily";
  combineDuplicates: boolean;
}

export interface DataManagementSettings {
  // Placeholder for future settings
  autoBackup: boolean;
  backupFrequency: "daily" | "weekly" | "monthly";
}

export interface AIFeaturesSettings {
  imageGenerationPrompt: string;
}

export interface AppSettings {
  profile: UserProfile;
  appearance: AppearanceSettings;
  mealPlanning: MealPlanningSettings;
  recipePreferences: RecipePreferences;
  shoppingList: ShoppingListSettings;
  dataManagement: DataManagementSettings;
  aiFeatures: AIFeaturesSettings;
}

// ============================================================================
// DEFAULT VALUES
// ============================================================================

export const DEFAULT_SETTINGS: AppSettings = {
  profile: {
    displayName: "User",
    email: "",
    avatar: "",
  },
  appearance: {
    theme: "dark",
  },
  mealPlanning: {
    defaultServings: 4,
    weekStartDay: "sunday",
    defaultMealTypes: ["Breakfast", "Lunch", "Dinner"],
  },
  recipePreferences: {
    measurementUnit: "imperial",
    dietaryRestrictions: [],
    allergenAlerts: [],
    defaultBrowserView: "grid",
    defaultSortOrder: "alphabetical",
    quickFilters: ["breakfast", "lunch", "dinner", "sides", "new"],
  },
  shoppingList: {
    categorySortOrder: "alphabetical",
    autoClearChecked: "manual",
    combineDuplicates: true,
  },
  dataManagement: {
    autoBackup: false,
    backupFrequency: "weekly",
  },
  aiFeatures: {
    imageGenerationPrompt:
      "A professional food photograph of {recipe_name} captured at a 45-degree angle. The dish is placed on a rustic wooden table with cutting board, shallow depth of field, steam rising, scattered herbs and seasonings, complementary ingredients as props in soft-focus background, cozy home kitchen atmosphere, appetizing, high detail, no people, no hands, square format",
  },
};

// ============================================================================
// STORAGE KEY
// ============================================================================

const SETTINGS_STORAGE_KEY = "meal-genie-settings";

// ============================================================================
// HOOK
// ============================================================================

interface UseSettingsReturn {
  /**
   * Current settings state
   */
  settings: AppSettings;
  /**
   * Whether settings have been loaded from storage
   */
  isLoaded: boolean;
  /**
   * Update a specific section of settings
   */
  updateSettings: <K extends keyof AppSettings>(
    section: K,
    values: Partial<AppSettings[K]>
  ) => void;
  /**
   * Update multiple sections at once
   */
  updateMultipleSections: (updates: Partial<AppSettings>) => void;
  /**
   * Save current settings to storage
   */
  saveSettings: () => void;
  /**
   * Reset settings to defaults
   */
  resetSettings: () => void;
  /**
   * Reset a specific section to defaults
   */
  resetSection: <K extends keyof AppSettings>(section: K) => void;
  /**
   * Check if current settings differ from saved settings
   */
  hasUnsavedChanges: boolean;
  /**
   * Discard unsaved changes and reload from storage
   */
  discardChanges: () => void;
}

/**
 * Hook for managing application settings with localStorage persistence.
 * 
 * Phase 1: localStorage (current)
 * Phase 2: API calls (future - swap internals, component code unchanged)
 * 
 * @example
 * ```tsx
 * const { settings, updateSettings, saveSettings, hasUnsavedChanges } = useSettings();
 * 
 * // Update profile
 * updateSettings('profile', { displayName: 'John' });
 * 
 * // Save to storage
 * saveSettings();
 * ```
 */
export function useSettings(): UseSettingsReturn {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [savedSettings, setSavedSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load settings from storage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<AppSettings>;
        // Deep merge with defaults to handle new settings fields
        const merged = deepMergeSettings(DEFAULT_SETTINGS, parsed);
        setSettings(merged);
        setSavedSettings(merged);
      }
    } catch (error) {
      console.error("[useSettings] Failed to load settings:", error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Update a specific section
  const updateSettings = useCallback(
    <K extends keyof AppSettings>(section: K, values: Partial<AppSettings[K]>) => {
      setSettings((prev) => ({
        ...prev,
        [section]: {
          ...prev[section],
          ...values,
        },
      }));
    },
    []
  );

  // Update multiple sections at once
  const updateMultipleSections = useCallback((updates: Partial<AppSettings>) => {
    setSettings((prev) => {
      const newSettings = { ...prev };
      
      if (updates.profile) {
        newSettings.profile = { ...prev.profile, ...updates.profile };
      }
      if (updates.appearance) {
        newSettings.appearance = { ...prev.appearance, ...updates.appearance };
      }
      if (updates.mealPlanning) {
        newSettings.mealPlanning = { ...prev.mealPlanning, ...updates.mealPlanning };
      }
      if (updates.recipePreferences) {
        newSettings.recipePreferences = { ...prev.recipePreferences, ...updates.recipePreferences };
      }
      if (updates.shoppingList) {
        newSettings.shoppingList = { ...prev.shoppingList, ...updates.shoppingList };
      }
      if (updates.dataManagement) {
        newSettings.dataManagement = { ...prev.dataManagement, ...updates.dataManagement };
      }
      if (updates.aiFeatures) {
        newSettings.aiFeatures = { ...prev.aiFeatures, ...updates.aiFeatures };
      }

      return newSettings;
    });
  }, []);

  // Save to storage
  const saveSettings = useCallback(() => {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
      setSavedSettings(settings);
      
      // Dispatch event for other components to react
      window.dispatchEvent(new CustomEvent("settings-updated", { detail: settings }));
    } catch (error) {
      console.error("[useSettings] Failed to save settings:", error);
      throw error;
    }
  }, [settings]);

  // Reset all settings to defaults
  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
  }, []);

  // Reset a specific section to defaults
  const resetSection = useCallback(<K extends keyof AppSettings>(section: K) => {
    setSettings((prev) => ({
      ...prev,
      [section]: DEFAULT_SETTINGS[section],
    }));
  }, []);

  // Check if there are unsaved changes
  const hasUnsavedChanges = JSON.stringify(settings) !== JSON.stringify(savedSettings);

  // Discard changes and reload from saved
  const discardChanges = useCallback(() => {
    setSettings(savedSettings);
  }, [savedSettings]);

  return {
    settings,
    isLoaded,
    updateSettings,
    updateMultipleSections,
    saveSettings,
    resetSettings,
    resetSection,
    hasUnsavedChanges,
    discardChanges,
  };
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Deep merge settings with defaults, ensuring all required fields exist
 */
function deepMergeSettings(defaults: AppSettings, source: Partial<AppSettings>): AppSettings {
  return {
    profile: {
      ...defaults.profile,
      ...(source.profile || {}),
    },
    appearance: {
      ...defaults.appearance,
      ...(source.appearance || {}),
    },
    mealPlanning: {
      ...defaults.mealPlanning,
      ...(source.mealPlanning || {}),
    },
    recipePreferences: {
      ...defaults.recipePreferences,
      ...(source.recipePreferences || {}),
    },
    shoppingList: {
      ...defaults.shoppingList,
      ...(source.shoppingList || {}),
    },
    dataManagement: {
      ...defaults.dataManagement,
      ...(source.dataManagement || {}),
    },
    aiFeatures: {
      ...defaults.aiFeatures,
      ...(source.aiFeatures || {}),
    },
  };
}