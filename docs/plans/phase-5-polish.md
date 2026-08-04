# Phase 5 — Polish: Theme, Mobile Parity, A11y, Settings Truth, Dead Code

> Prerequisites: Phases 1–4. Reading: `00-ux-audit.md` §B, §E. Everything here is
> independent and can be PR'd piecemeal — ordered by user-visible impact.

---

## 1. Theme correctness (visible on every single load)

- **Kill the theme flash:** add a blocking inline `<script>` in root layout `<head>`
  (before paint) that reads `localStorage("theme")` (fallback `prefers-color-scheme`) and
  sets the `light` class on `<html>`. Use `dangerouslySetInnerHTML` on a tiny IIFE —
  standard pattern. Then the `useEffect` application in `TopNav.tsx:417-482` becomes
  state-sync only.
- **Unify the two theme models:** Settings → Appearance offers light/dark/**system**;
  the TopNav toggle is binary. Make the TopNav toggle cycle or (simpler) make it binary
  but write through the same settings store (`useSettings`) so the two never disagree.
  Extract theme logic out of TopNav into a small `hooks/ui/useTheme.ts`.
- **Mobile parity:** add the theme toggle to the mobile "More" sheet
  (`MobileBottomNav.tsx`) — currently mobile users must dig into Settings.

## 2. Typography & viewport

- `globals.css:1160`: `font-family: Arial, Helvetica, sans-serif` →
  `font-family: var(--font-sans)`. Audit visually after — any text that changes appearance
  was silently rendering Arial.
- Confirm pinch-zoom stayed re-enabled (done in Phase 1 viewport change).

## 3. Assistant discoverability

The assistant can draft complete recipes into the wizard and nothing advertises it.
- Mobile: promote "Ask Meal Genie" from a buried More-sheet row — recommendation: a
  Sparkles FAB (bottom-right, above the bottom nav, `shadow-floating`) shown on Recipes and
  Planner pages. Keep the More-sheet entry too.
- Desktop: keep the TopNav sparkle but add contextual entry points: "✨ Generate a recipe"
  in the recipe wizard's first step and in the browser's quick-filter row.
- Respect a dismissed/never-show preference via `useSettings`.

## 4. Settings truth (stop advertising what doesn't exist)

From audit §D-Settings:
- "Meal Planning" `PlaceholderSection` (`SettingsView.tsx:57-64`): either wire the existing
  `MealPlanningSection` file in, or remove the category from `CategoryNav` until real.
  **Recommendation: remove from nav** — placeholder settings erode trust pre-launch.
- Unwired section files (`RecipeCategoriesSection`, `IngredientCategoriesSection`,
  `UnitConversionsSection`, …): wire each in or delete; decide per-file by checking whether
  its backing API/hooks exist and work.
- `DEFAULT_SETTINGS` keys with no UI (`measurementUnit`, `dietaryRestrictions`,
  `allergenAlerts`, `defaultBrowserView`, `combineDuplicates`, `autoBackup`): delete keys
  that nothing reads; file follow-up issues for ones worth building (use `/todo`).
- Shopping "hide completed" raw localStorage read (`ShoppingListView.tsx:63-66`): migrate
  into `useSettings` (shopping section) so it syncs like everything else.
- Hardcoded "Meal Genie v1.0.0" footer: read version from `package.json` or drop it.

## 5. Dead code & scaffolding removal

- `components/layout/RecentRecipeChip.tsx` (`RecentRecipesSection` — sidebar era, never
  imported) — delete. Check whether `hooks/persistence/useRecentRecipes` has other
  consumers before deleting it too.
- `components/auth/UserMenu.tsx` — superseded by `TopNavUserMenu` / mobile sheet; verify
  zero imports, delete.
- `components/marketing/` empty dir (if Phase 2 didn't claim it) — delete.
- `public/next.svg`, `public/vercel.svg` (if Phase 1 didn't already) — delete.
- `public/logo.svg` hardcodes `#000` — regenerate to match brand purple or `currentColor`
  usage notes.

## 6. Accessibility pass

- Heading order (Phase 4 made every page single-`h1`; verify h2/h3 nesting below).
- Keyboard: recipe cards, carousel nav, planner drag-grid — every mouse interaction needs
  a keyboard path; drag-and-drop needs at minimum an alternative (move up/down actions in
  the card menu).
- `prefers-reduced-motion`: framer-motion is used heavily (roulette slot-machine, carousel
  strip, hero shimmer) — wrap with `useReducedMotion()` or a global `MotionConfig
  reducedMotion="user"` in AppLayout.
- Icon-only buttons: audit for `aria-label` (project rule; spot-check found violations like
  the ChefTip refresh pre-Phase-3).
- Color contrast spot-check on `text-muted-foreground` over tinted cards (streak widget
  gradient) in both themes.

## 7. Verification / acceptance criteria

- [ ] Hard-reload in light mode: zero dark flash (test with cache disabled + CPU throttle).
- [ ] Theme changed in Settings reflects in TopNav toggle and vice versa; works on mobile.
- [ ] No Arial rendering anywhere (spot-check computed styles).
- [x] Settings shows only functional options; no placeholder sections.
- [x] `npx tsc`, lint, build; grep confirms deleted components have zero references.
      (Lint: 9 pre-existing errors in untouched files — set-state-in-effect ×5,
      unescaped entities ×3, compiler memoization ×1 — all present at HEAD before
      this phase; every file touched in Phase 5 lints clean.)
- [ ] Keyboard-only walkthrough of the core loop succeeds.
- [ ] Lighthouse a11y ≥ 95 on Home, Recipes, Planner, Shopping.

## Backlog (explicitly deferred, not forgotten)

- Planner `popstate`/history rearchitecture (`MealPlannerView.tsx:125-147`).
- Shopping recipe-source filter on mobile (currently `lg`-only).
- `window` custom-event bus (`PLANNER_EVENTS`) fully replaced by React Query invalidation
  app-wide (Home consumers done in Phase 3).
- "Add to shopping list" directly from a recipe (new capability, not refinement).
- Route rename `/dashboard` → `/home`.
- Public pricing page when monetization turns on (`has_pro_access` exists in the model).
