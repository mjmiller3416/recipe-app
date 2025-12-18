"use client";

import { useEffect, useCallback, useRef, useState } from "react";

/**
 * Configuration for a keyboard shortcut
 */
export interface ShortcutConfig {
  /** The key to listen for (e.g., 'n', 'Escape', 'ArrowDown') */
  key: string;
  /** Whether Ctrl (or Cmd on Mac) must be pressed */
  ctrl?: boolean;
  /** Whether Shift must be pressed */
  shift?: boolean;
  /** Whether Alt must be pressed */
  alt?: boolean;
  /** The action to perform when shortcut is triggered */
  action: () => void;
  /** Description of the shortcut (for help modal) */
  description: string;
  /** Whether the shortcut is currently enabled */
  enabled?: boolean;
}

/**
 * Hook for managing keyboard shortcuts
 *
 * @param shortcuts - Array of shortcut configurations
 * @param options - Additional options
 *
 * @example
 * ```tsx
 * useKeyboardShortcuts([
 *   { key: 'n', action: () => openModal(), description: 'Create new meal' },
 *   { key: 'Escape', action: () => closeModal(), description: 'Close modal' },
 *   { key: 'k', ctrl: true, action: () => openSearch(), description: 'Open search' },
 * ]);
 * ```
 */
export function useKeyboardShortcuts(
  shortcuts: ShortcutConfig[],
  options: { enabled?: boolean } = {}
) {
  const { enabled = true } = options;
  const shortcutsRef = useRef(shortcuts);

  // Keep shortcuts ref up to date
  useEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Don't trigger shortcuts in input fields, textareas, or contenteditable
      const target = event.target as HTMLElement;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target.isContentEditable
      ) {
        // Still allow Escape in input fields
        if (event.key !== "Escape") {
          return;
        }
      }

      for (const shortcut of shortcutsRef.current) {
        // Skip disabled shortcuts
        if (shortcut.enabled === false) continue;

        // Check key match (case-insensitive for letters)
        const keyMatch =
          event.key.toLowerCase() === shortcut.key.toLowerCase() ||
          event.key === shortcut.key;

        if (!keyMatch) continue;

        // Check modifier keys
        const ctrlMatch = shortcut.ctrl
          ? event.ctrlKey || event.metaKey
          : !event.ctrlKey && !event.metaKey;

        const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;

        const altMatch = shortcut.alt ? event.altKey : !event.altKey;

        if (ctrlMatch && shiftMatch && altMatch) {
          event.preventDefault();
          shortcut.action();
          return;
        }
      }
    },
    [enabled]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}

/**
 * Hook for entry navigation with arrow keys
 */
export function useEntryNavigation<T extends { id: number | string }>(
  entries: T[],
  options: {
    onSelect?: (entry: T, index: number) => void;
    onToggle?: (entry: T) => void;
    onRemove?: (entry: T) => void;
    enabled?: boolean;
  } = {}
) {
  const { onSelect, onToggle, onRemove, enabled = true } = options;
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // Reset selection when entries change significantly
  useEffect(() => {
    if (selectedIndex !== null && selectedIndex >= entries.length) {
      setSelectedIndex(entries.length > 0 ? entries.length - 1 : null);
    }
  }, [entries.length, selectedIndex]);

  const selectedEntry = selectedIndex !== null ? entries[selectedIndex] : null;

  const shortcuts: ShortcutConfig[] = [
    {
      key: "ArrowDown",
      action: () => {
        const newIndex =
          selectedIndex === null ? 0 : Math.min(selectedIndex + 1, entries.length - 1);
        setSelectedIndex(newIndex);
        onSelect?.(entries[newIndex], newIndex);
      },
      description: "Select next entry",
      enabled: enabled && entries.length > 0,
    },
    {
      key: "ArrowUp",
      action: () => {
        const newIndex =
          selectedIndex === null
            ? entries.length - 1
            : Math.max(selectedIndex - 1, 0);
        setSelectedIndex(newIndex);
        onSelect?.(entries[newIndex], newIndex);
      },
      description: "Select previous entry",
      enabled: enabled && entries.length > 0,
    },
    {
      key: " ", // Space
      action: () => {
        if (selectedEntry && onToggle) {
          onToggle(selectedEntry);
        }
      },
      description: "Toggle selected entry",
      enabled: enabled && selectedEntry !== null && !!onToggle,
    },
    {
      key: "Delete",
      action: () => {
        if (selectedEntry && onRemove) {
          onRemove(selectedEntry);
        }
      },
      description: "Remove selected entry",
      enabled: enabled && selectedEntry !== null && !!onRemove,
    },
    {
      key: "Backspace",
      action: () => {
        if (selectedEntry && onRemove) {
          onRemove(selectedEntry);
        }
      },
      description: "Remove selected entry",
      enabled: enabled && selectedEntry !== null && !!onRemove,
    },
    {
      key: "Escape",
      action: () => {
        setSelectedIndex(null);
      },
      description: "Clear selection",
      enabled: enabled && selectedIndex !== null,
    },
  ];

  useKeyboardShortcuts(shortcuts, { enabled });

  return {
    selectedIndex,
    selectedEntry,
    setSelectedIndex,
    clearSelection: () => setSelectedIndex(null),
  };
}