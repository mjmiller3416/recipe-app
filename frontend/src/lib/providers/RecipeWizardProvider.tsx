"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";

interface RecipeWizardContextValue {
  /** Whether the wizard dialog is open */
  isOpen: boolean;
  /** Open the wizard dialog */
  openWizard: () => void;
  /** Close the wizard dialog */
  closeWizard: () => void;
  /** Toggle open/close */
  setOpen: (open: boolean) => void;
}

const RecipeWizardContext = createContext<RecipeWizardContextValue | null>(null);

export function RecipeWizardProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const openWizard = useCallback(() => setIsOpen(true), []);
  const closeWizard = useCallback(() => setIsOpen(false), []);
  const setOpen = useCallback((open: boolean) => setIsOpen(open), []);

  return (
    <RecipeWizardContext.Provider
      value={{ isOpen, openWizard, closeWizard, setOpen }}
    >
      {children}
    </RecipeWizardContext.Provider>
  );
}

export function useRecipeWizardDialog() {
  const context = useContext(RecipeWizardContext);
  if (!context) {
    throw new Error(
      "useRecipeWizardDialog must be used within a RecipeWizardProvider"
    );
  }
  return context;
}
