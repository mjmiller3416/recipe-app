"use client";

import { useEffect, useCallback, useRef } from "react";

export interface ShortcutConfig {
  /** Key or key combination (e.g., "s", "ctrl+s", "escape") */
  key: string;
  /** Callback when shortcut is triggered */
  action: () => void;
  /** Optional description for help display */
  description?: string;
  /** Whether to prevent default browser behavior */
  preventDefault?: boolean;
  /** Whether shortcut is enabled */
  enabled?: boolean;
}

interface UseKeyboardShortcutsOptions {
  /** Whether shortcuts are globally enabled */
  enabled?: boolean;
  /** Element to attach listeners to (defaults to window) */
  target?: HTMLElement | null;
}

/**
 * Parse a key combination string into its parts
 */
function parseKeyCombo(combo: string): { key: string; ctrl: boolean; alt: boolean; shift: boolean; meta: boolean } {
  const parts = combo.toLowerCase().split("+");
  return {
    key: parts[parts.length - 1],
    ctrl: parts.includes("ctrl"),
    alt: parts.includes("alt"),
    shift: parts.includes("shift"),
    meta: parts.includes("meta") || parts.includes("cmd"),
  };
}

/**
 * Check if a keyboard event matches a key combo
 */
function matchesKeyCombo(event: KeyboardEvent, combo: string): boolean {
  const { key, ctrl, alt, shift, meta } = parseKeyCombo(combo);

  const eventKey = event.key.toLowerCase();
  const matchesKey = eventKey === key || event.code.toLowerCase() === key;

  return (
    matchesKey &&
    event.ctrlKey === ctrl &&
    event.altKey === alt &&
    event.shiftKey === shift &&
    event.metaKey === meta
  );
}

/**
 * Hook for managing keyboard shortcuts
 *
 * @example
 * ```tsx
 * useKeyboardShortcuts([
 *   { key: "escape", action: () => setOpen(false) },
 *   { key: "ctrl+s", action: handleSave, preventDefault: true },
 * ]);
 * ```
 */
export function useKeyboardShortcuts(
  shortcuts: ShortcutConfig[],
  options: UseKeyboardShortcutsOptions = {}
): void {
  const { enabled = true, target = null } = options;
  const shortcutsRef = useRef(shortcuts);
  shortcutsRef.current = shortcuts;

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Don't trigger shortcuts when typing in inputs
      const target = event.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        // Allow escape to still work in inputs
        if (event.key !== "Escape") return;
      }

      for (const shortcut of shortcutsRef.current) {
        if (shortcut.enabled === false) continue;

        if (matchesKeyCombo(event, shortcut.key)) {
          if (shortcut.preventDefault !== false) {
            event.preventDefault();
          }
          shortcut.action();
          break;
        }
      }
    },
    [enabled]
  );

  useEffect(() => {
    const eventTarget = target ?? window;
    eventTarget.addEventListener("keydown", handleKeyDown as EventListener);
    return () => {
      eventTarget.removeEventListener("keydown", handleKeyDown as EventListener);
    };
  }, [handleKeyDown, target]);
}

/**
 * Hook for keyboard navigation through a list of entries
 *
 * @example
 * ```tsx
 * const { selectedIndex, setSelectedIndex } = useEntryNavigation({
 *   itemCount: items.length,
 *   onSelect: (index) => handleSelect(items[index]),
 *   enabled: isOpen,
 * });
 * ```
 */
export function useEntryNavigation({
  itemCount,
  onSelect,
  onEscape,
  enabled = true,
  loop = true,
}: {
  itemCount: number;
  onSelect?: (index: number) => void;
  onEscape?: () => void;
  enabled?: boolean;
  loop?: boolean;
}): {
  selectedIndex: number;
  setSelectedIndex: (index: number) => void;
} {
  const selectedIndexRef = useRef(0);
  const setSelectedIndex = useCallback((index: number) => {
    selectedIndexRef.current = index;
  }, []);

  useKeyboardShortcuts(
    [
      {
        key: "arrowdown",
        action: () => {
          const newIndex = selectedIndexRef.current + 1;
          if (newIndex < itemCount) {
            selectedIndexRef.current = newIndex;
          } else if (loop) {
            selectedIndexRef.current = 0;
          }
        },
      },
      {
        key: "arrowup",
        action: () => {
          const newIndex = selectedIndexRef.current - 1;
          if (newIndex >= 0) {
            selectedIndexRef.current = newIndex;
          } else if (loop) {
            selectedIndexRef.current = itemCount - 1;
          }
        },
      },
      {
        key: "enter",
        action: () => {
          if (onSelect && selectedIndexRef.current >= 0) {
            onSelect(selectedIndexRef.current);
          }
        },
      },
      {
        key: "escape",
        action: () => {
          onEscape?.();
        },
      },
    ],
    { enabled }
  );

  return {
    selectedIndex: selectedIndexRef.current,
    setSelectedIndex,
  };
}
