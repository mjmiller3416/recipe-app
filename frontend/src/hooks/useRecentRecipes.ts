"use client";

import { useState, useEffect, useCallback } from "react";
import { getRecipeEmoji } from "@/lib/recipeEmoji";

// ============================================================================
// TYPES
// ============================================================================

export interface RecentRecipe {
  id: number;
  name: string;
  emoji: string;
  viewedAt: number; // timestamp for ordering
}

// ============================================================================
// CONSTANTS
// ============================================================================

const STORAGE_KEY = "meal-genie-recent-recipes";
const MAX_RECENT_RECIPES = 3;
const CUSTOM_EVENT_NAME = "recent-recipes-updated";

// ============================================================================
// HOOK
// ============================================================================

interface UseRecentRecipesReturn {
  /**
   * List of recently viewed recipes (most recent first)
   */
  recentRecipes: RecentRecipe[];
  /**
   * Whether the hook has loaded from storage
   */
  isLoaded: boolean;
  /**
   * Add a recipe to the recent list
   */
  addToRecent: (recipe: { id: number; name: string; category?: string }) => void;
  /**
   * Remove a recipe from the recent list
   */
  removeFromRecent: (id: number) => void;
  /**
   * Clear all recent recipes
   */
  clearRecent: () => void;
}

/**
 * Hook for tracking recently viewed recipes in localStorage.
 *
 * @example
 * ```tsx
 * const { recentRecipes, addToRecent } = useRecentRecipes();
 *
 * // When viewing a recipe detail page
 * useEffect(() => {
 *   addToRecent({ id: recipe.id, name: recipe.name, category: recipe.category });
 * }, [recipe.id]);
 * ```
 */
export function useRecentRecipes(): UseRecentRecipesReturn {
  const [recentRecipes, setRecentRecipes] = useState<RecentRecipe[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from storage on mount + listen for updates from other components
  useEffect(() => {
    // Initial load from localStorage
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as RecentRecipe[];
        const sorted = parsed.sort((a, b) => b.viewedAt - a.viewedAt);
        setRecentRecipes(sorted.slice(0, MAX_RECENT_RECIPES));
      }
    } catch (error) {
      console.error("[useRecentRecipes] Failed to load recent recipes:", error);
    } finally {
      setIsLoaded(true);
    }

    // Listen for custom event from same window (when another component updates)
    const handleCustomEvent = (e: Event) => {
      const customEvent = e as CustomEvent<RecentRecipe[]>;
      if (customEvent.detail) {
        setRecentRecipes(customEvent.detail);
      }
    };

    // Listen for storage event from other tabs/windows
    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue) as RecentRecipe[];
          const sorted = parsed.sort((a, b) => b.viewedAt - a.viewedAt);
          setRecentRecipes(sorted.slice(0, MAX_RECENT_RECIPES));
        } catch (error) {
          console.error("[useRecentRecipes] Failed to parse storage event:", error);
        }
      }
    };

    window.addEventListener(CUSTOM_EVENT_NAME, handleCustomEvent);
    window.addEventListener("storage", handleStorageEvent);

    return () => {
      window.removeEventListener(CUSTOM_EVENT_NAME, handleCustomEvent);
      window.removeEventListener("storage", handleStorageEvent);
    };
  }, []);

  // Save to storage and notify other components in same window
  const saveToStorage = useCallback((recipes: RecentRecipe[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(recipes));
      // Defer event dispatch to avoid "setState during render" errors
      // when multiple components use this hook simultaneously
      queueMicrotask(() => {
        window.dispatchEvent(
          new CustomEvent(CUSTOM_EVENT_NAME, { detail: recipes })
        );
      });
    } catch (error) {
      console.error("[useRecentRecipes] Failed to save recent recipes:", error);
    }
  }, []);

  // Add a recipe to recent list
  const addToRecent = useCallback(
    (recipe: { id: number; name: string; category?: string }) => {
      setRecentRecipes((prev) => {
        // Remove if already exists
        const filtered = prev.filter((r) => r.id !== recipe.id);

        // Add to front with current timestamp
        const newRecipe: RecentRecipe = {
          id: recipe.id,
          name: recipe.name,
          emoji: getRecipeEmoji(recipe.name, recipe.category),
          viewedAt: Date.now(),
        };

        // Keep only the max allowed
        const updated = [newRecipe, ...filtered].slice(0, MAX_RECENT_RECIPES);

        // Save to storage
        saveToStorage(updated);

        return updated;
      });
    },
    [saveToStorage]
  );

  // Remove a recipe from recent list
  const removeFromRecent = useCallback(
    (id: number) => {
      setRecentRecipes((prev) => {
        const updated = prev.filter((r) => r.id !== id);
        saveToStorage(updated);
        return updated;
      });
    },
    [saveToStorage]
  );

  // Clear all recent recipes
  const clearRecent = useCallback(() => {
    setRecentRecipes([]);
    saveToStorage([]);
  }, [saveToStorage]);

  return {
    recentRecipes,
    isLoaded,
    addToRecent,
    removeFromRecent,
    clearRecent,
  };
}
