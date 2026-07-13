# Phase 4 — Flow Wiring & Consistency Pass

> Prerequisites: Phases 1–3. Reading: `00-ux-audit.md` §D, §E (root cause #3: pages are
> silos; the save → plan → shop loop is never drawn in the UI).

**Goal:** Make the core loop visible and traversable from every page, consolidate the
duplicated meal-creation flows, give every empty state a real button, and normalize the
patterns that make pages feel "built at different times" (headers, containers, loading,
titles).

---

## 1. Wire the core loop (highest impact in the whole initiative)

- **Planner → Shopping:** add a header action on `/meal-planner` — `Button variant="outline"`
  "Shopping list" with live remaining-count badge (reuse the `useShoppingList` badge logic
  from `TopNav.tsx`), linking to `/shopping-list`. This is the single biggest flow gap.
- **Shopping → Planner:** empty state (`ShoppingListView.tsx:367-388`) currently says "Add
  meals to your planner" with no link — add `Button` "Open meal planner".
- **Recipe → Plan:** after `AddToMealPlanDialog` succeeds, toast with action "View planner".
- **Recipe browser empty state** (`RecipeGrid.tsx:26-45`): add primary "Add your first
  recipe" (opens wizard) + secondary "✨ Generate with Meal Genie" (opens assistant).
  Also fix the hero description interpolating "…collection of **0** saved recipes" — swap
  to CTA-flavored copy when count is 0.
- **Planner empty state:** fix the grid gating (`MealPlannerView.tsx:622`) so the `MealGrid`
  with its dashed "Add Meal" card renders even when empty (or unify: one empty-state block
  that includes the add card). Kill the orphan "This Week's Menu" heading floating over
  nothing.
- Sweep remaining empty states: every "do X to get started" sentence gets the button that
  does X.

## 2. Consolidate meal creation (one flow, not two)

Today: in-planner `MealPreviewDialog` + `RecipePickerDialog` vs global `MealCreationOverlay`
(TopNav "Add Meal"). Same task, two UIs.

- **Investigate first** (30 min): compare both for feature completeness (side-recipe
  support, tag editing, validation) and code health. Default recommendation: **keep the
  in-planner flow** (it's integrated with the drag-drop grid and selection model) and make
  the global "Add Meal" entry points route to `/meal-planner?addMeal=1`, which the planner
  reads to auto-open the flow. Then delete `MealCreationOverlay` + its provider wiring from
  `AppLayout`.
- If investigation flips the decision (overlay is meaningfully better), invert: planner
  uses the overlay. Either way: **one** flow survives, both entry points reach it.

## 3. Delete stub routes; fix mobile Add

- Delete `app/(app)/recipes/add/page.tsx` and `app/(app)/meal-planner/create/page.tsx`.
- Grep for links to both (`/recipes/add` is referenced by the old mobile nav config;
  `MobileBottomNav` was restructured in Phase 3 so Add now lives in the More sheet — make
  those sheet items call `openWizard()` / the consolidated meal flow directly instead of
  navigating).
- Remove the `MobileBottomNav.tsx:117-121` active-state special case (dead once stub is gone).

## 4. Consistency normalization

**Headings & titles**
- `PageHeaderTitle` (`components/layout/PageHeader.tsx:42`): `<h2>` → `<h1>`. Every page
  gets exactly one `h1`. Recipe browser hero and recipe detail already use `h1` — verify no
  page double-h1s after the change.
- Align nav labels ↔ page titles. Recommendation: page titles win, nav follows content:
  nav "Meal Planner" stays, page title "Plan the Week" → "Meal Planner" (keep the good
  description line). Recipe browser nav "Recipe Browser" → "Recipes" (matches mobile).
  Desktop + mobile nav arrays use identical labels after this.

**Containers & header pattern**
- Standard: `max-w-7xl px-4 md:px-6 py-6`. Documented exceptions: recipe detail stays
  `max-w-5xl` (reading width), recipe browser hero stays full-bleed. Fix the recipes
  Suspense fallback padding mismatch (`app/recipes/page.tsx:5-22` uses `px-6 py-8`).
- `PageHeaderTitle` description placement: standardize on **stacked** (title above,
  description below — the Dashboard pattern) instead of inline-baseline; inline wraps badly.

**Loading states — one philosophy: skeletons that match final layout**
- Recipes: delete one of the two competing skeletons — keep the view-level skeleton
  (`RecipeBrowserView.tsx:606-619`), make the route `loading.tsx` render that same
  component so Suspense + query loading show identical UI (no double-flash).
- Planner: gate on `usePlannerEntries` `isLoading` so the empty state can't flash before
  data arrives; add a grid skeleton.
- Settings & Admin: replace full-screen spinners with simple sidebar+content skeletons.
- Add `loading.tsx` per app route rendering each page's skeleton (the boundaries Phase 1
  deliberately deferred).

**Back navigation**
- Recipe detail (`FullRecipeView.tsx:164-175`): `router.back()` → history-aware helper:
  if `window.history.length <= 1` (or a `document.referrer` from another origin), push
  `/recipes` instead. Small `lib/` util so other pages can reuse.
- Planner `popstate` hack (`MealPlannerView.tsx:125-147`): out of scope to rearchitect,
  but **de-duplicate the two identical discard `AlertDialog`s** (`:533-601`, `:663-731`)
  into one rendered once — pure extraction, no behavior change.

## 5. Verification / acceptance criteria

- [ ] New-user walkthrough with zero data touching only in-page CTAs: land on Home →
      add recipe → plan meal → reach shopping list — **without ever using the top/bottom
      nav**. (This is the definition of "the loop is wired.")
- [ ] Exactly one meal-creation UI remains; TopNav "Add Meal", planner add-card, and mobile
      More sheet all reach it.
- [ ] `/recipes/add` and `/meal-planner/create` return the branded 404.
- [ ] Every page: one `h1`, standard container, skeleton (not spinner, not flash-of-empty).
- [ ] Deep-link to a recipe in a fresh tab → Back goes to `/recipes`, not out of the app.
- [ ] tsc / lint / build pass; end-to-end pass with the `verify` skill.

## Out of scope

Mobile theme toggle & assistant discoverability (P5) · settings cleanup (P5) · shopping
sidebar on mobile (P5, if at all) · planner popstate rearchitecture (backlog).
