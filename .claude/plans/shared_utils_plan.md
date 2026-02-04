# Plan: Extract Shared Frontend Utilities

**Branch:** `refactor/extract-shared-utilities`
**Scope:** 8 extractions across ~22 files, 5 new files
**Deferred:** #2 useAuth() boilerplate (minimal per-hook savings, warrants its own PR)

---

## Phase 1: Standalone Utility Functions

### 1A. `formatTime()` — add to `lib/quantityUtils.ts`, update 7 files

**Problem:** 9 independent time-formatting implementations across recipe cards, meal planner, dashboard, and recipe detail pages.

**New function in `frontend/src/lib/quantityUtils.ts`:**

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

**Remove inline implementations and import `formatTime` from `@/lib/quantityUtils`:**

| File | Lines to Remove | Notes |
|------|----------------|-------|
| `components/recipe/RecipeCard.tsx` | 72-80 (inline arrow fn) | Direct replacement |
| `app/dashboard/_components/RecipeRouletteWidget.tsx` | 122-128 (inline arrow fn) | Use `formatTime(val, "N/A")` to preserve existing fallback |
| `app/meal-planner/_components/MealGridCard.tsx` | 41-48 (top-level fn) | Direct replacement |
| `app/meal-planner/_components/CompletedDropdown.tsx` | 38-45 (top-level fn) | Direct replacement |
| `app/meal-planner/_components/meal-display/RecipeStats.tsx` | 34-44 (`formatCookTime`) | Rename calls from `formatCookTime(x)` to `formatTime(x)` |
| `app/meal-planner/_components/meal-display/SelectedMealCard.tsx` | 43-50 (top-level fn) | Direct replacement |

**Update `app/recipes/[id]/_components/recipe-utils.ts`:**

The recipe detail page uses `"45 min"` long format (not `"45m"`). Replace local `formatTime` with a wrapper that preserves the long format via `formatDuration`:

```ts
import { formatDuration } from "@/lib/quantityUtils";

// Preserves "45 min" long format for recipe detail pages
export const formatTime = (m: number | null) => m ? formatDuration(m) : "\u2014";
```

This keeps `RecipeHeaderCard.tsx` and `RecipePrintLayout.tsx` working with no import changes.

---

### 1B. `ApiError` class — dedupe 3 identical definitions

**Problem:** Byte-identical `ApiError` class in `lib/api/client.ts`, `lib/api-client.ts`, and `lib/api-server.ts`.

**Keep** canonical definition in `lib/api/client.ts` (lines 5-15).

**Update `lib/api-client.ts`:**
- Remove class definition (lines 19-29)
- Add: `import { ApiError } from "@/lib/api/client";`
- Add: `export { ApiError };`

**Update `lib/api-server.ts`:**
- Remove class definition (lines 16-26)
- Add: `import { ApiError } from "@/lib/api/client";`
- Add: `export { ApiError };`

---

### 1C. `getErrorMessage()` — add to `lib/utils.ts`, update 6 files

**Problem:** 11 occurrences of `error instanceof Error ? error.message : "fallback"` across 6 files.

**New function in `frontend/src/lib/utils.ts`:**

```ts
/**
 * Extracts a human-readable message from an unknown error.
 * Use in catch blocks where the error type is not guaranteed.
 */
export function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}
```

**Replace all 11 occurrences:**

| File | Occurrences | Fallback Messages |
|------|------------|-------------------|
| `components/settings/_components/data-management/BackupRestore.tsx` | 3 | "Failed to create backup", "Invalid backup file", "Failed to restore backup" |
| `components/settings/_components/data-management/ExportImport.tsx` | 4 | "Failed to preview import", "Failed to execute import", "Failed to export recipes", "Failed to download template" |
| `components/settings/_components/data-management/DeleteData.tsx` | 1 | "Failed to delete data" |
| `app/meal-planner/_components/meal-display/SelectedMealCard.tsx` | 1 | "Failed to load meal" (in JSX, not toast) |
| `app/recipes/_components/add-edit/ImageUploadCard.tsx` | 1 | "Image generation failed" |
| `app/shopping-list/_components/ShoppingListView.tsx` | 1 | "Failed to load shopping list" |

---

### 1D. `downloadBlob()` — add to `lib/utils.ts`, update 2 files

**Problem:** 3 identical 8-line blob download sequences.

**New function in `frontend/src/lib/utils.ts`:**

```ts
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
```

**Replace in:**

| File | Location | Filename Pattern |
|------|----------|-----------------|
| `components/settings/_components/data-management/BackupRestore.tsx` | `handleCreateBackup` (lines 65-72) | `` `meal-genie-backup-${date}.json` `` |
| `components/settings/_components/data-management/ExportImport.tsx` | `handleExport` (lines 240-247) | `` `recipes_export_${date}.xlsx` `` |
| `components/settings/_components/data-management/ExportImport.tsx` | `handleDownloadTemplate` (lines 267-274) | `"recipe_import_template.xlsx"` |

---

### 1E. `formatRelativeTime()` — add to `lib/utils.ts`, update 2 files

**Problem:** 2 near-identical implementations (SavedMealCard handles years, RecipeStats doesn't).

**New function in `frontend/src/lib/utils.ts`** (based on SavedMealCard version, the more complete one):

```ts
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

**Remove inline implementations:**

| File | Lines to Remove |
|------|----------------|
| `app/meal-planner/_components/SavedMealCard.tsx` | 18-33 |
| `app/meal-planner/_components/meal-display/RecipeStats.tsx` | 50-81 (gains year handling) |

---

## Phase 2: Hook Extractions

### 2A. `useLocalStorageState<T>()` — new file, refactor 2 hooks

**Problem:** `useChatHistory` and `useRecentRecipes` share ~50 lines of identical localStorage + event sync infrastructure.

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
 * @param eventName - CustomEvent name for same-window sync
 * @param initialValue - Default value before first load
 * @param options - Optional configuration
 * @returns [state, setState, isLoaded]
 */
export function useLocalStorageState<T>(
  key: string,
  eventName: string,
  initialValue: T,
  options?: UseLocalStorageStateOptions<T>
): [T, (updater: T | ((prev: T) => T)) => void, boolean] {
  const [state, setStateInternal] = useState<T>(initialValue);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored);
        const value = options?.deserialize ? options.deserialize(parsed) : parsed;
        setStateInternal(
          options?.maxItems && Array.isArray(value)
            ? (value.slice(-options.maxItems) as T)
            : value
        );
      }
    } catch (err) {
      console.error(`[useLocalStorageState] Failed to load ${key}:`, err);
    }
    setIsLoaded(true);
  }, [key]);

  // Listen for same-window CustomEvent + cross-tab StorageEvent
  useEffect(() => {
    const handleCustom = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail !== undefined) setStateInternal(detail);
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key !== key || !e.newValue) return;
      try {
        const parsed = JSON.parse(e.newValue);
        const value = options?.deserialize ? options.deserialize(parsed) : parsed;
        setStateInternal(value);
      } catch (err) {
        console.error(`[useLocalStorageState] Failed to sync ${key}:`, err);
      }
    };

    window.addEventListener(eventName, handleCustom);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener(eventName, handleCustom);
      window.removeEventListener("storage", handleStorage);
    };
  }, [key, eventName]);

  // Setter that persists to localStorage and dispatches sync events
  const setState = useCallback(
    (updater: T | ((prev: T) => T)) => {
      setStateInternal((prev) => {
        const next = typeof updater === "function" ? (updater as (prev: T) => T)(prev) : updater;
        try {
          localStorage.setItem(key, JSON.stringify(next));
          queueMicrotask(() => {
            window.dispatchEvent(new CustomEvent(eventName, { detail: next }));
          });
        } catch (err) {
          console.error(`[useLocalStorageState] Failed to save ${key}:`, err);
        }
        return next;
      });
    },
    [key, eventName]
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

### 2B. `useChatScroll()` — new hook for MealGenie

**Problem:** Both MealGenie chat components independently implement auto-scroll + fade indicator logic (~20 lines each).

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

## Phase 3: Component Extractions

### 3A. `<ChatMessageList>` + shared constants — new MealGenie components

**Problem:** ~150 shared lines between MealGenieAssistant.tsx and MealGenieChatContent.tsx (message rendering, loading indicator, empty state, suggestion buttons).

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

Renders:
- Scroll container with top/bottom fade overlays
- Message bubbles with role-based styling (user right-aligned, assistant left-aligned)
- ReactMarkdown for assistant messages
- Loading indicator (Sparkles animation + "Thinking...")
- Optional `afterLoadingSlot` for extra content (e.g., "View Recipe Draft" button)

```ts
interface ChatMessageListProps {
  messages: MealGenieMessage[];
  isPending: boolean;
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  showTopFade: boolean;
  showBottomFade: boolean;
  afterLoadingSlot?: React.ReactNode;
}
```

**Update MealGenieAssistant.tsx:** Replace scroll logic with `useChatScroll`, message rendering with `<ChatMessageList>`, local SUGGESTIONS with import from constants. (~80 lines removed)

**Update MealGenieChatContent.tsx:** Same treatment, passing `afterLoadingSlot={pendingRecipeButton}`. (~80 lines removed)

---

### 3B. `<InlineGroupCreator>` — new shared form component

**Problem:** ManageGroupsDialog and RecipePreferencesSection have near-identical inline group creation UI (~50 shared lines each).

**New file: `frontend/src/components/common/InlineGroupCreator.tsx`**

```ts
interface InlineGroupCreatorProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  isPending?: boolean;
  disabled?: boolean;
  placeholder?: string;
  size?: "sm" | "default";    // sm = h-8 w-8, default = h-9 w-9
  maxLength?: number;
}
```

Renders:
```
<div "flex items-center gap-2 px-3 py-2 rounded-md bg-card border border-border">
  <FolderOpen icon />
  <Input with autoFocus, Enter-to-submit, Escape-to-cancel />
  <Button size="icon"> Check or Loader2 </Button>
  <Button size="icon"> X </Button>
</div>
```

**Update ManageGroupsDialog.tsx:** Replace lines 188-229 with `<InlineGroupCreator ... size="default" />`. Remove `handleKeyDown`.

**Update RecipePreferencesSection.tsx:** Replace lines 327-368 with `<InlineGroupCreator ... size="sm" />`. Remove `handleGroupKeyDown`.

---

## Phase 4: Barrel Export Updates

| File | New Exports |
|------|-------------|
| `lib/quantityUtils.ts` | `formatTime` (alongside existing `formatDuration`) |
| `lib/utils.ts` | `getErrorMessage`, `downloadBlob`, `formatRelativeTime` |
| `hooks/ui/index.ts` | `useChatScroll` |

No changes needed to `hooks/persistence/index.ts` — public API of refactored hooks is unchanged.

---

## Verification

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

| # | Extraction | Impact | New Files | Files Modified |
|---|-----------|--------|-----------|----------------|
| 1A | `formatTime()` | HIGH | 0 | 8 |
| 1B | `ApiError` dedupe | HIGH | 0 | 2 |
| 1C | `getErrorMessage()` | MEDIUM | 0 | 7 (incl. utils.ts) |
| 1D | `downloadBlob()` | MEDIUM | 0 | 3 (incl. utils.ts) |
| 1E | `formatRelativeTime()` | MEDIUM | 0 | 3 (incl. utils.ts) |
| 2A | `useLocalStorageState` | MEDIUM | 1 | 2 |
| 2B | `useChatScroll` | MEDIUM | 1 | 3 (incl. index) |
| 3A | `ChatMessageList` | HIGH | 2 | 2 |
| 3B | `InlineGroupCreator` | MEDIUM | 1 | 2 |
| **Total** | | | **5 new** | **~22 modified** |

### Deferred

**useAuth() + getToken() boilerplate** (#2 from original proposal): Every hook's `queryFn` is unique in API call, arguments, and return type. A minimal `useGetToken()` wrapper saves only 1 line per hook. A meaningful `useAuthenticatedQuery`/`useAuthenticatedMutation` abstraction changes every hook's API shape and warrants its own focused PR.
