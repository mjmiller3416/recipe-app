# Parallel Execution Plan: Extract Shared Frontend Utilities

**Branch:** `refactor/extract-shared-utilities`

---

## Round 1 — All Independent (Run in Parallel)

### Task 1: `formatTime()` → `quantityUtils.ts`

Add to `frontend/src/lib/quantityUtils.ts`:

```ts
/**
 * Formats minutes into a compact time string for cards, badges, and inline displays.
 *
 * @param minutes - Duration in minutes (nullable)
 * @param fallback - String to return when minutes is null/undefined (default: em dash)
 * @returns Formatted string like "30m", "1h 30m", "2h", or the fallback
 */
export function formatTime(
  minutes: number | null | undefined,
  fallback: string = "\u2014"
): string {
  if (minutes == null || isNaN(minutes) || minutes <= 0) return fallback;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}
```

Remove inline implementations and import `formatTime` from `@/lib/quantityUtils`:

| File | Lines to Remove | Notes |
|------|----------------|-------|
| `components/recipe/RecipeCard.tsx` | 72-80 (inline arrow fn) | Direct replacement |
| `app/dashboard/_components/RecipeRouletteWidget.tsx` | 122-128 (inline arrow fn) | Use `formatTime(val, "N/A")` to preserve existing fallback |
| `app/meal-planner/_components/MealGridCard.tsx` | 41-48 (top-level fn) | Direct replacement |
| `app/meal-planner/_components/CompletedDropdown.tsx` | 38-45 (top-level fn) | Direct replacement |
| `app/meal-planner/_components/meal-display/RecipeStats.tsx` | 34-44 (`formatCookTime`) | Rename calls from `formatCookTime(x)` to `formatTime(x)` |
| `app/meal-planner/_components/meal-display/SelectedMealCard.tsx` | 43-50 (top-level fn) | Direct replacement |

Update `app/recipes/[id]/_components/recipe-utils.ts` — the recipe detail page uses `"45 min"` long format (not `"45m"`). Replace local `formatTime` with a wrapper that preserves the long format via `formatDuration`:

```ts
import { formatDuration } from "@/lib/quantityUtils";

// Preserves "45 min" long format for recipe detail pages
export const formatTime = (m: number | null) => m ? formatDuration(m) : "\u2014";
```

This keeps `RecipeHeaderCard.tsx` and `RecipePrintLayout.tsx` working with no import changes.

---

### Task 2: `ApiError` Dedupe

**Keep** canonical definition in `lib/api/base.ts` (lines 5-15).

**Update `lib/api-client.ts`:**
- Remove class definition (lines 19-29)
- Add: `import { ApiError } from "@/lib/api/base";`
- Add: `export { ApiError };`

**Update `lib/api-server.ts`:**
- Remove class definition (lines 16-26)
- Add: `import { ApiError } from "@/lib/api/base";`
- Add: `export { ApiError };`

---

### Task 3: Utility Functions → `lib/utils.ts` (Combined)

Add three functions to `frontend/src/lib/utils.ts`:

```ts
/**
 * Extracts a human-readable message from an unknown error.
 * Use in catch blocks where the error type is not guaranteed.
 */
export function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

/**
 * Triggers a browser download of a Blob as a file.
 * Creates and clicks a temporary anchor element, then cleans up.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Formats an ISO datetime string into a human-readable relative time.
 */
export function formatRelativeTime(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return "Today";
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 14) return "1 week ago";
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 60) return "1 month ago";
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} year${diffDays >= 730 ? "s" : ""} ago`;
}
```

**Replace `getErrorMessage` pattern** (11 occurrences):

| File | Occurrences | Fallback Messages |
|------|------------|-------------------|
| `components/settings/_components/data-management/BackupRestore.tsx` | 3 | "Failed to create backup", "Invalid backup file", "Failed to restore backup" |
| `components/settings/_components/data-management/ExportImport.tsx` | 4 | "Failed to preview import", "Failed to execute import", "Failed to export recipes", "Failed to download template" |
| `components/settings/_components/data-management/DeleteData.tsx` | 1 | "Failed to delete data" |
| `app/meal-planner/_components/meal-display/SelectedMealCard.tsx` | 1 | "Failed to load meal" (in JSX, not toast) |
| `app/recipes/_components/add-edit/ImageUploadCard.tsx` | 1 | "Image generation failed" |
| `app/shopping-list/_components/ShoppingListView.tsx` | 1 | "Failed to load shopping list" |

**Replace `downloadBlob` sequences** (3 occurrences):

| File | Location | Filename Pattern |
|------|----------|-----------------|
| `components/settings/_components/data-management/BackupRestore.tsx` | `handleCreateBackup` (lines 65-72) | `` `meal-genie-backup-${date}.json` `` |
| `components/settings/_components/data-management/ExportImport.tsx` | `handleExport` (lines 240-247) | `` `recipes_export_${date}.xlsx` `` |
| `components/settings/_components/data-management/ExportImport.tsx` | `handleDownloadTemplate` (lines 267-274) | `"recipe_import_template.xlsx"` |

**Remove `formatRelativeTime` implementations:**

| File | Lines to Remove |
|------|----------------|
| `app/meal-planner/_components/SavedMealCard.tsx` | 18-33 |
| `app/meal-planner/_components/meal-display/RecipeStats.tsx` | 50-81 |

---

### Task 4: `useLocalStorageState<T>()` Hook

**New file: `frontend/src/hooks/persistence/useLocalStorageState.ts`**

```ts
"use client";

import { useState, useEffect, useCallback } from "react";

interface UseLocalStorageStateOptions<T> {
  /** Maximum number of items to keep (for array values) */
  maxItems?: number;
  /** Custom deserializer — transform raw parsed JSON into the desired shape */
  deserialize?: (raw: unknown) => T;
}

/**
 * Generic hook for state persisted to localStorage with cross-tab
 * and same-window synchronization via CustomEvent + StorageEvent.
 *
 * @param key - localStorage key
 * @param initialValue - Default value when nothing is stored
 * @param options - Optional configuration
 * @returns [state, setState, isLoaded] tuple
 */
export function useLocalStorageState<T>(
  key: string,
  initialValue: T,
  options: UseLocalStorageStateOptions<T> = {}
): [T, (value: T | ((prev: T) => T)) => void, boolean] {
  const { maxItems, deserialize } = options;
  const eventName = `localStorage:${key}`;

  const [state, setStateInternal] = useState<T>(initialValue);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored);
        const value = deserialize ? deserialize(parsed) : parsed;
        setStateInternal(value);
      }
    } catch (err) {
      console.error(`[useLocalStorageState] Failed to load ${key}:`, err);
    }
    setIsLoaded(true);
  }, [key, deserialize]);

  // Listen for changes from other tabs (StorageEvent) and same window (CustomEvent)
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === key && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          const value = deserialize ? deserialize(parsed) : parsed;
          setStateInternal(value);
        } catch (err) {
          console.error(`[useLocalStorageState] Failed to parse ${key}:`, err);
        }
      }
    };

    const handleCustom = (e: Event) => {
      const customEvent = e as CustomEvent<T>;
      setStateInternal(customEvent.detail);
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener(eventName, handleCustom);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(eventName, handleCustom);
    };
  }, [key, eventName, deserialize]);

  const setState = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStateInternal((prev) => {
        const next = typeof value === "function" ? (value as (prev: T) => T)(prev) : value;
        const toStore = maxItems && Array.isArray(next) ? next.slice(-maxItems) : next;
        try {
          localStorage.setItem(key, JSON.stringify(toStore));
          window.dispatchEvent(new CustomEvent(eventName, { detail: toStore }));
        } catch (err) {
          console.error(`[useLocalStorageState] Failed to save ${key}:`, err);
        }
        return toStore as T;
      });
    },
    [key, eventName, maxItems]
  );

  return [state, setState, isLoaded];
}
```

**Refactor `hooks/persistence/useChatHistory.ts`:**
- Replace ~50 lines of manual localStorage/event code with `useLocalStorageState<MealGenieMessage[]>`
- Keep public API unchanged: `{ messages, addMessage, clearHistory, isLoaded }`
- `addMessage` becomes: `setState(prev => [...prev, message].slice(-MAX_MESSAGES))`

**Refactor `hooks/persistence/useRecentRecipes.ts`:**
- Replace ~50 lines of manual localStorage/event code with `useLocalStorageState<RecentRecipe[]>`
- Keep migration logic in the `deserialize` option
- Keep public API unchanged: `{ recentRecipes, addToRecent, removeFromRecent, clearRecent, isLoaded }`

---

### Task 5: `useChatScroll()` Hook

**New file: `frontend/src/hooks/ui/useChatScroll.ts`**

```ts
"use client";

import { useState, useEffect, useRef } from "react";

/**
 * Manages auto-scroll and fade indicators for a scrollable chat container.
 *
 * @param deps - Values that trigger re-scroll when changed (e.g., messages array, isPending)
 * @returns Refs and fade states for the scroll container
 */
export function useChatScroll(deps: unknown[]) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showTopFade, setShowTopFade] = useState(false);
  const [showBottomFade, setShowBottomFade] = useState(false);

  // Auto-scroll to bottom when deps change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, deps);

  // Track scroll position for fade indicators
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      setShowTopFade(scrollTop > 8);
      setShowBottomFade(scrollTop + clientHeight < scrollHeight - 8);
    };
    handleScroll();
    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, deps);

  return { messagesEndRef, scrollContainerRef, showTopFade, showBottomFade };
}
```

**Update `hooks/ui/index.ts`** — add `export { useChatScroll } from "./useChatScroll";`

---

### Task 6: `<InlineGroupCreator>` Component

**New file: `frontend/src/components/common/InlineGroupCreator.tsx`**

```tsx
"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FolderOpen, Check, X, Loader2 } from "lucide-react";

interface InlineGroupCreatorProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  isPending?: boolean;
  disabled?: boolean;
  placeholder?: string;
  size?: "sm" | "default";
  maxLength?: number;
}

export function InlineGroupCreator({
  value,
  onChange,
  onSubmit,
  onCancel,
  isPending = false,
  disabled = false,
  placeholder = "New group name",
  size = "default",
  maxLength = 50,
}: InlineGroupCreatorProps) {
  const iconSize = size === "sm" ? "h-4 w-4" : "h-5 w-5";
  const buttonSize = size === "sm" ? "h-8 w-8" : "h-9 w-9";
  const inputHeight = size === "sm" ? "h-8" : "h-9";

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && value.trim() && !disabled && !isPending) {
      e.preventDefault();
      onSubmit();
    } else if (e.key === "Escape") {
      onCancel();
    }
  };

  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-card border border-border">
      <FolderOpen className={`${iconSize} text-muted-foreground shrink-0`} />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        maxLength={maxLength}
        disabled={disabled || isPending}
        autoFocus
        className={`${inputHeight} flex-1`}
      />
      <Button
        size="icon"
        variant="ghost"
        className={buttonSize}
        onClick={onSubmit}
        disabled={!value.trim() || disabled || isPending}
      >
        {isPending ? (
          <Loader2 className={`${iconSize} animate-spin`} />
        ) : (
          <Check className={iconSize} />
        )}
      </Button>
      <Button
        size="icon"
        variant="ghost"
        className={buttonSize}
        onClick={onCancel}
        disabled={isPending}
      >
        <X className={iconSize} />
      </Button>
    </div>
  );
}
```

**Update ManageGroupsDialog.tsx:** Replace lines 188-229 with `<InlineGroupCreator ... size="default" />`. Remove `handleKeyDown`.

**Update RecipePreferencesSection.tsx:** Replace lines 327-368 with `<InlineGroupCreator ... size="sm" />`. Remove `handleGroupKeyDown`.

---

## Round 2 — Has Prerequisites

### Task 7: `<ChatMessageList>` + Constants

> **Requires:** Task 5 (`useChatScroll`) completed

**New file: `frontend/src/components/meal-genie/constants.ts`**

```ts
import { ChefHat, Lightbulb, Calendar } from "lucide-react";

export const CHAT_SUGGESTIONS = [
  { icon: ChefHat, text: "What can I make with chicken?", color: "text-primary" },
  { icon: Lightbulb, text: "Quick weeknight dinner ideas", color: "text-secondary" },
  { icon: Calendar, text: "Help me plan meals for the week", color: "text-success" },
] as const;
```

**New file: `frontend/src/components/meal-genie/ChatMessageList.tsx`**

```tsx
"use client";

import ReactMarkdown from "react-markdown";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MealGenieMessage } from "@/types/meal-genie";

interface ChatMessageListProps {
  messages: MealGenieMessage[];
  isPending: boolean;
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  showTopFade: boolean;
  showBottomFade: boolean;
  afterLoadingSlot?: React.ReactNode;
}

export function ChatMessageList({
  messages,
  isPending,
  scrollContainerRef,
  messagesEndRef,
  showTopFade,
  showBottomFade,
  afterLoadingSlot,
}: ChatMessageListProps) {
  return (
    <div className="relative flex-1 min-h-0">
      {/* Top fade */}
      <div
        className={cn(
          "absolute top-0 left-0 right-0 h-6 bg-gradient-to-b from-background to-transparent z-10 pointer-events-none transition-opacity",
          showTopFade ? "opacity-100" : "opacity-0"
        )}
      />

      {/* Scroll container */}
      <div
        ref={scrollContainerRef}
        className="h-full overflow-y-auto px-4 py-2 space-y-3"
      >
        {messages.map((message, index) => (
          <div
            key={index}
            className={cn(
              "flex",
              message.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            <div
              className={cn(
                "max-w-[85%] rounded-2xl px-4 py-2",
                message.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              )}
            >
              {message.role === "assistant" ? (
                <ReactMarkdown className="prose prose-sm dark:prose-invert max-w-none">
                  {message.content}
                </ReactMarkdown>
              ) : (
                <p className="text-sm">{message.content}</p>
              )}
            </div>
          </div>
        ))}

        {isPending && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-2xl px-4 py-2 flex items-center gap-2">
              <Sparkles className="h-4 w-4 animate-pulse text-primary" />
              <span className="text-sm text-muted-foreground">Thinking...</span>
            </div>
          </div>
        )}

        {afterLoadingSlot}

        <div ref={messagesEndRef} />
      </div>

      {/* Bottom fade */}
      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-background to-transparent z-10 pointer-events-none transition-opacity",
          showBottomFade ? "opacity-100" : "opacity-0"
        )}
      />
    </div>
  );
}
```

**Update MealGenieAssistant.tsx:** Replace scroll logic with `useChatScroll`, message rendering with `<ChatMessageList>`, local SUGGESTIONS with import from constants. (~80 lines removed)

**Update MealGenieChatContent.tsx:** Same treatment, passing `afterLoadingSlot={pendingRecipeButton}`. (~80 lines removed)

---

### Task 8: Barrel Export Updates

> **Requires:** Tasks 1, 3, and 5 completed

| File | New Exports |
|------|-------------|
| `lib/quantityUtils.ts` | `formatTime` (alongside existing `formatDuration`) |
| `lib/utils.ts` | `getErrorMessage`, `downloadBlob`, `formatRelativeTime` |
| `hooks/ui/index.ts` | `useChatScroll` |

No changes needed to `hooks/persistence/index.ts` — public API of refactored hooks is unchanged.

---

## Verification (Run After All Tasks Complete)

1. **TypeScript:** `npx tsc` from `frontend/` — catch import/type errors
2. **Lint:** `npm run lint` from `frontend/` — catch unused imports/variables
3. **Build:** `npm run build` from `frontend/` — verify production build
4. **Manual checks:**
   - Recipe cards (small/medium/large) show `"30m"`, `"1h 30m"` format
   - Recipe detail page shows `"45 min"`, `"1h 30m"` long format
   - RecipeRoulette widget shows `"N/A"` for null times
   - Meal planner cards/dropdowns show correct short format
   - MealGenie chat (dashboard widget + popup): messages render, auto-scroll works, fade indicators work
   - Settings > Data Management: backup download, recipe export, template download all trigger file saves
   - Settings > Recipe Preferences: inline group creation works
   - Recipe detail > Manage Groups: inline group creation works
   - Chat history persists across page navigation, syncs between dashboard + popup
   - Recent recipes persist and sync across tabs

---

## Summary

| Round | Task | Description | New Files | Files Modified |
|-------|------|-------------|-----------|----------------|
| 1 | 1 | `formatTime()` | 0 | 8 |
| 1 | 2 | `ApiError` dedupe | 0 | 2 |
| 1 | 3 | `getErrorMessage`, `downloadBlob`, `formatRelativeTime` | 0 | 9 |
| 1 | 4 | `useLocalStorageState` | 1 | 2 |
| 1 | 5 | `useChatScroll` | 1 | 1 |
| 1 | 6 | `InlineGroupCreator` | 1 | 2 |
| 2 | 7 | `ChatMessageList` + constants | 2 | 2 |
| 2 | 8 | Barrel exports | 0 | 3 |
| **Total** | | | **5 new** | **~22 modified** |