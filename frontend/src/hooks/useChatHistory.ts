"use client";

import { useState, useEffect, useCallback } from "react";
import type { MealGenieMessage } from "@/types/ai";

// ============================================================================
// CONSTANTS
// ============================================================================

const STORAGE_KEY = "meal-genie-chat-history";
const MAX_MESSAGES = 50;
const CUSTOM_EVENT_NAME = "chat-history-updated";

// ============================================================================
// HOOK
// ============================================================================

interface UseChatHistoryReturn {
  /**
   * List of chat messages
   */
  messages: MealGenieMessage[];
  /**
   * Whether the hook has loaded from storage
   */
  isLoaded: boolean;
  /**
   * Add a single message to the chat history
   */
  addMessage: (message: MealGenieMessage) => void;
  /**
   * Clear all chat history
   */
  clearHistory: () => void;
}

/**
 * Hook for persisting Meal Genie chat history in localStorage.
 *
 * @example
 * ```tsx
 * const { messages, addMessage, clearHistory } = useChatHistory();
 *
 * // Add a user message
 * addMessage({ role: "user", content: "What can I make with chicken?" });
 *
 * // Add an assistant response
 * addMessage({ role: "assistant", content: "Here are some ideas..." });
 * ```
 */
export function useChatHistory(): UseChatHistoryReturn {
  const [messages, setMessages] = useState<MealGenieMessage[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from storage on mount + listen for updates from other components
  useEffect(() => {
    // Initial load from localStorage
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as MealGenieMessage[];
        setMessages(parsed.slice(-MAX_MESSAGES));
      }
    } catch (error) {
      console.error("[useChatHistory] Failed to load chat history:", error);
    } finally {
      setIsLoaded(true);
    }

    // Listen for custom event from same window (when another component updates)
    const handleCustomEvent = (e: Event) => {
      const customEvent = e as CustomEvent<MealGenieMessage[]>;
      if (customEvent.detail) {
        setMessages(customEvent.detail);
      }
    };

    // Listen for storage event from other tabs/windows
    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue) as MealGenieMessage[];
          setMessages(parsed.slice(-MAX_MESSAGES));
        } catch (error) {
          console.error("[useChatHistory] Failed to parse storage event:", error);
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
  const saveToStorage = useCallback((msgs: MealGenieMessage[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(msgs));
      // Defer event dispatch to avoid "setState during render" errors
      queueMicrotask(() => {
        window.dispatchEvent(
          new CustomEvent(CUSTOM_EVENT_NAME, { detail: msgs })
        );
      });
    } catch (error) {
      console.error("[useChatHistory] Failed to save chat history:", error);
    }
  }, []);

  // Add a message to chat history
  const addMessage = useCallback(
    (message: MealGenieMessage) => {
      setMessages((prev) => {
        const updated = [...prev, message].slice(-MAX_MESSAGES);
        saveToStorage(updated);
        return updated;
      });
    },
    [saveToStorage]
  );

  // Clear all chat history
  const clearHistory = useCallback(() => {
    setMessages([]);
    saveToStorage([]);
  }, [saveToStorage]);

  return {
    messages,
    isLoaded,
    addMessage,
    clearHistory,
  };
}
