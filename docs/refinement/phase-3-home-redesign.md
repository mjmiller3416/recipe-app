# Phase 3 — Home Redesign: Today-First, One Home for All Devices, First-Run Experience

> Prerequisites: Phase 1 (route groups; `/` redirects signed-in → `/dashboard`).
> Reading: `00-ux-audit.md` §C (root cause #2: home answers "what data do I have?"
> instead of "what am I doing next?").

**Goal:** Rebuild `/dashboard` as a today-first Home that works at every viewport, kill the
desktop/mobile fork (mobile users get a Home for the first time), and replace the
four-isolated-zeros first-run with a single guided setup experience.

---

## 1. Kill the device fork

- `app/(app)/dashboard/page.tsx`: delete the `MOBILE_BREAKPOINT` check and mobile →
  `/meal-planner` redirect entirely. Convert to a server wrapper (`export const metadata =
  { title: "Home" }`) rendering the client `HomeView`.
- The root `(marketing)/page.tsx` redirect stays `→ /dashboard` for **all** signed-in users.
- **Mobile bottom nav** (`components/layout/MobileBottomNav.tsx`): replace the "Add" tab
  with **Home** (`/dashboard`, `House` icon). Result: Home · Planner · Recipes · Shopping ·
  More. Rationale for dropping the Add tab: it currently points at the `/recipes/add`
  redirect stub and can never show active; Phase 4 gives every empty state and page a
  contextual Add CTA, and "Add Recipe"/"Add Meal" remain in the More sheet. *(Alternative
  considered: keep a center Add tab and leave Home out of mobile nav — rejected because a
  Home that mobile can't reach recreates the current two-homes problem.)*
- Desktop TopNav "Home" label already matches — no change.

## 2. New layout (top → bottom)

Rename `DashboardView` → `HomeView` (keep file colocation in `dashboard/_components/`).

1. **Greeting header** (keep) — but make the subtitle state-aware instead of always
   "Time to cook something amazing! You have 0 meals planned":
   - has uncompleted meals → "You have N meals planned this week."
   - all cooked → "All caught up — N meals cooked this week. 🎉"
   - empty → "Let's plan your week." (no fake enthusiasm over zeros)
2. **Tonight card** (NEW, the hero) — the next uncompleted planner entry (lowest
   `position` from `usePlannerEntries`, same logic the carousel uses):
   - Large recipe banner image, meal name, main + side recipe names, total time/servings.
   - Actions: **Mark cooked** (existing `useMarkComplete`) · **View recipe**.
   - If no uncompleted entries but recipes exist: swap to a "Plan your week" prompt card —
     CTA opens the planner (and roulette suggestion inline: "or spin for inspiration").
3. **This Week strip** — repurpose the existing `MealCarouselWidget` (it's well-built) as
   the row under Tonight; exclude the entry already shown in the Tonight card.
4. **Shopping status card** — compact: "N items left to get" + progress bar + link. This is
   a slimmed `ShoppingListWidget` (drop the per-category breakdown on Home; the full page
   has it).
5. **Secondary row** — CookingStreak · Chef's Tip · Recipe Roulette. Garnish lives below
   the fold; unchanged internally except fixes in §4.
6. **Stat cards: delete the row.** Recipes/favorites counts move into small linked chips in
   the greeting header area if wanted (`BookOpen` 42 · `Heart` 12 → link to `/recipes`,
   `/recipes?favoritesOnly=true`). "Meals planned" and "shopping items" are now redundant
   (Tonight + shopping card carry them). Keep `StatCard` component — Shopping List page
   still uses it.

Responsive: single column on mobile (Tonight → shopping → week strip → secondary),
two-column at `lg` (Tonight spans 2/3, shopping 1/3; strip full-width below).

## 3. First-run experience (`GetStartedCard`)

When `useDashboardStats` reports `total_recipes === 0` **and** there are no planner entries:
replace everything below the greeting with one card:

```
Welcome to Meal Genie 🧞  Three steps to your first planned week:

  ① Add your first recipe          [ Add a recipe ] [ Import from URL ] [ ✨ Ask Meal Genie ]
  ② Plan your first meal           [ Plan a meal ]        (enabled once ① done)
  ③ Shop from your auto-list       Your shopping list builds itself from the plan.
```

- Step ①'s three buttons: open the global recipe wizard (`useRecipeWizard` context — the
  wizard already supports manual entry AND URL import), and open the Assistant popup
  pre-focused (this is the one place the AI features get advertised in-app).
- Checkmark steps as satisfied (recipes > 0 → ① done; planner entries > 0 → ② done).
  Once recipes exist but no meals: show the normal layout with the "Plan your week" Tonight
  variant, plus a slim residual progress banner until step ② completes, then never again
  (`localStorage` flag via a `hooks/persistence` hook, consistent with existing patterns).
- Partial-empty states elsewhere on Home keep their current per-widget empty states but
  **every one gets a real button** (Phase 4 does this sweep app-wide; do the Home ones here).

## 4. Fixes to fold in while touching these files

(All from audit §C code smells:)
- `ShoppingListWidget`: actually use the passed `shoppingData` prop or remove the prop and
  the duplicate parent fetch in `DashboardView` — one fetch, not two.
- Replace `window.addEventListener(PLANNER_EVENTS.UPDATED, …)` custom-event syncing in
  Home widgets with React Query invalidation (`queryClient.invalidateQueries` with the
  existing queryKeys factory) in the mutation hooks. If other pages depend on the window
  events, keep firing them but Home should not consume them.
- `ChefTipWidget`: raw `<button>` → `<Button variant="ghost" size="icon" aria-label=…>`;
  null tip → friendly fallback line instead of an empty card.
- Remove `MOBILE_BREAKPOINT` constants from both former redirect sites.

## 5. Verification / acceptance criteria

- [ ] Mobile (≤ 767px): Home is reachable from bottom nav, renders single-column, no
      redirect to planner. Desktop unchanged in reachability.
- [ ] Fresh user (empty DB / new account): sees GetStartedCard; all three step-① buttons
      work; completing steps checks them off.
- [ ] Existing user with a plan: Tonight card shows the correct next meal; Mark cooked
      advances it and updates streak + counts without a reload.
- [ ] No layout shift on load: every card has a skeleton matching its final size.
- [ ] `npx tsc`, lint, build pass. Verify end-to-end with the `verify` skill.

## Out of scope

Planner/shopping page changes (P4) · nav label unification (P4) · assistant FAB (P5).
Consider later: rename route `/dashboard` → `/home` (defer — churn for little gain; nav
already says "Home").
