"use client";

import { useLocalStorageState } from "./useLocalStorageState";

const STORAGE_KEY = "meal-genie-get-started-complete";

/**
 * Persisted flag for the Home first-run experience.
 *
 * Becomes true once the user has planned their first meal (a planner entry
 * has been observed). After that, the residual "plan your first meal"
 * progress banner never shows again — even if the planner is later emptied.
 *
 * @returns [isComplete, setComplete, isLoaded] tuple
 */
export function useGetStartedComplete(): [
  boolean,
  (value: boolean) => void,
  boolean,
] {
  const [isComplete, setIsComplete, isLoaded] = useLocalStorageState<boolean>(
    STORAGE_KEY,
    false
  );

  return [isComplete, setIsComplete, isLoaded];
}
