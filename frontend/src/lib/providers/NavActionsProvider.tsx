"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";

interface NavActionsContextValue {
  actions: ReactNode | null;
  isPinned: boolean;
  setNavActions: (actions: ReactNode) => void;
  setPinned: (pinned: boolean) => void;
  clearNavActions: () => void;
}

const NavActionsContext = createContext<NavActionsContextValue | null>(null);

export function NavActionsProvider({ children }: { children: ReactNode }) {
  const [actions, setActionsState] = useState<ReactNode | null>(null);
  const [isPinned, setIsPinned] = useState(false);

  const setNavActions = useCallback((newActions: ReactNode) => {
    setActionsState(newActions);
  }, []);

  const setPinned = useCallback((pinned: boolean) => {
    setIsPinned(pinned);
  }, []);

  const clearNavActions = useCallback(() => {
    setActionsState(null);
    setIsPinned(false);
  }, []);

  return (
    <NavActionsContext.Provider
      value={{ actions, isPinned, setNavActions, setPinned, clearNavActions }}
    >
      {children}
    </NavActionsContext.Provider>
  );
}

export function useNavActions() {
  const context = useContext(NavActionsContext);
  if (!context) {
    throw new Error("useNavActions must be used within a NavActionsProvider");
  }
  return context;
}
