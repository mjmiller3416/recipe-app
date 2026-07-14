"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";

interface AssistantContextValue {
  isOpen: boolean;
  openAssistant: () => void;
  closeAssistant: () => void;
  setOpen: (open: boolean) => void;
}

const AssistantContext = createContext<AssistantContextValue | null>(null);

export function AssistantProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const openAssistant = useCallback(() => setIsOpen(true), []);
  const closeAssistant = useCallback(() => setIsOpen(false), []);
  const setOpen = useCallback((open: boolean) => setIsOpen(open), []);

  return (
    <AssistantContext.Provider
      value={{ isOpen, openAssistant, closeAssistant, setOpen }}
    >
      {children}
    </AssistantContext.Provider>
  );
}

export function useAssistantDialog() {
  const context = useContext(AssistantContext);
  if (!context) {
    throw new Error("useAssistantDialog must be used within an AssistantProvider");
  }
  return context;
}
