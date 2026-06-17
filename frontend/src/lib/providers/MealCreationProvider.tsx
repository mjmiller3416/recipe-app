"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";

interface MealCreationContextValue {
  isOpen: boolean;
  openMealCreation: () => void;
  closeMealCreation: () => void;
  setOpen: (open: boolean) => void;
}

const MealCreationContext = createContext<MealCreationContextValue | null>(null);

export function MealCreationProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const openMealCreation = useCallback(() => setIsOpen(true), []);
  const closeMealCreation = useCallback(() => setIsOpen(false), []);
  const setOpen = useCallback((open: boolean) => setIsOpen(open), []);

  return (
    <MealCreationContext.Provider
      value={{ isOpen, openMealCreation, closeMealCreation, setOpen }}
    >
      {children}
    </MealCreationContext.Provider>
  );
}

export function useMealCreationDialog() {
  const context = useContext(MealCreationContext);
  if (!context) {
    throw new Error(
      "useMealCreationDialog must be used within a MealCreationProvider"
    );
  }
  return context;
}
