# Phase 4.5 — Home Widget Refit: Every Element Serves "What's Next"

> Prerequisites: Phase 3 (today-first Home) and Phase 4 (`MealCreationOverlay` as the single
> meal-creation surface). Slots **before** Phase 5.
> Reading: findings restated in §0 below (this doc is self-contained).

**Goal:** Remove the secondary widget row from Home so every remaining element serves the
save → plan → shop → cook loop: promote the cooking streak to the header (it's the reward
for "Mark cooked"), cut the Chef's Tip, and move Recipe Roulette to the moment a meal is
actually being chosen.

---

## 0. Findings this phase addresses (2026-07-13 post-P3 review)

- The secondary row (Streak · Chef's Tip · Roulette) is a widget junk drawer: three
  unrelated cards at equal weight, none participating in the core loop. It drags the page
  back toward the "dashboard web-app" feel the initiative exists to escape.
- **Broken feedback loop:** "Mark cooked" (the hero action, above the fold) feeds the
  streak (below the fold). Cause and effect are visually disconnected.
- **Chef's Tip is a horoscope:** AI-generated generic text with no connection to the
  user's data. The only version that earns a place is one contextual to a specific recipe
  — which belongs on the recipe detail page, not Home.
- **Roulette is decision support at the wrong moment.** Nobody lands on Home wanting a
  random recipe; the want appears while *choosing* a meal. `PlanWeekCard`'s own copy
  ("or spin the Recipe Roulette below for inspiration") admits its real job is feeding
  the planner.
- The header's recipe-count/favorites chips are "what data do I have?" stats — exactly
  what the audit (§C, root cause #2) said to kill. The streak is a straight upgrade in
  that slot.

## 1. Promote the streak to the header

- New compact `StreakChip` (colocate in `dashboard/_components/`), replacing **both**
  recipe-count and favorites chips in the `HomeView` header (recipes/favorites remain one
  nav click away — the chips add nothing).
- Chip: pill `Button variant="outline"` with `Flame` icon + "N-day streak"; when
  `current_streak === 0`, muted flame + "Start a streak". Data from the existing
  `useCookingStreak`.
- Clicking opens a shadcn `Popover` containing the week-activity dot grid + streak message
  (move that markup over from `CookingStreakWidget`, then delete the widget).
- **Visible at all viewports** — the old chips were `hidden sm:flex`; the streak chip must
  not be. Mobile finally has a Home (P3); its motivational element shouldn't be
  desktop-only.
- Styling stays calm: standard pill, no gradient (the old widget's
  `from-primary/30 to-chart-4/20` gradient was louder than everything around it).
- Streak invalidation on `useMarkComplete` already exists in the planner mutation hooks —
  the chip should update live when Tonight's meal is marked cooked; verify, don't rebuild.

## 2. Cut Chef's Tip from Home

- Delete `ChefTipWidget.tsx` and its `HomeView` usage.
- Delete `useCookingTip` / `useRefreshCookingTip` from `hooks/api/useAI.ts` and the barrel
  (`hooks/api/index.ts`) — Home was the only consumer (verified 2026-07-13).
- **Keep the backend tips endpoint** — the feature's future is a per-recipe contextual tip
  on the recipe detail page ("You're searing chicken — pat it dry first"), which needs the
  endpoint to accept recipe context. That's backend work; see Out of scope.

## 3. Move Recipe Roulette to the choosing moment

- Delete `RecipeRouletteWidget.tsx` and its `HomeView` usage. The slot-machine animation
  goes with it — the reincarnations below are one-tap picks, not spectacles.
- **`MealCreationOverlay` — "Surprise me":** add a `Dices`-icon button to the recipe
  browser panel that picks a random recipe from the **currently filtered/searched list**
  (so "surprise me with a 30-minute dinner" works for free) and selects it exactly as a
  tap on its card would. Random-pick logic is ~10 lines (avoid re-picking the current
  selection); reimplement inline, don't port the widget.
- **`PlanWeekCard` (empty Tonight state):** remove the stale "or spin the Recipe Roulette
  below for inspiration" line. Add a secondary `outline` button **"Surprise me"** that
  picks a random recipe (via `useRecipeCards`) and navigates to its detail page — where
  "Add to meal plan" continues the loop. (This card only renders when recipes exist but
  nothing is planned, so the list is never empty.)

## 4. Layout cleanup

- `HomeView`: delete the secondary-row grid entirely — the page ends at the This Week
  strip. Update the component doc comment (currently promises "secondary widgets").
- Remove dead imports; prune the `hooks/api/index.ts` barrel.
- **Resist refilling the space.** A shorter Home is the point. The only future candidate
  that would earn a row is a "Cook again" strip (recently cooked via `RecipeHistory` /
  favorites) because it feeds planning — optional, not a gap.

## 5. Verification / acceptance criteria

- [ ] Streak chip renders in the Home header at **all** viewports; popover shows the week
      grid; marking Tonight cooked updates the chip without a reload.
- [ ] Home has no secondary row and no Chef's Tip or Roulette anywhere; recipe/favorites
      chips are gone.
- [ ] "Surprise me" in `MealCreationOverlay` respects active search/filters and selects
      the recipe like a normal tap.
- [ ] Empty Tonight card's "Surprise me" opens a random recipe's detail page.
- [ ] Deleted: `CookingStreakWidget.tsx`, `ChefTipWidget.tsx`, `RecipeRouletteWidget.tsx`,
      `useCookingTip`/`useRefreshCookingTip` (barrel updated).
- [ ] `npx tsc`, lint, build pass. Verify end-to-end with the `verify` skill
      (DEV_USER_ID 2 = full data, 3 = one recipe, 1 = empty).

## Out of scope

Contextual per-recipe Chef's Tip on the recipe detail page (needs the tips endpoint to
accept recipe context — pair with P5 or later) · "Cook again" strip (future, optional) ·
removing the backend tips endpoint (keep it).
