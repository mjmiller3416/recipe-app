# UX / Layout / Flow Audit — 2026-07-12

Full findings from the pre-release refinement review. This document is the source of truth
for **why** each phase exists — the phase plans (`phase-*.md`) reference it. Line numbers
were accurate as of commit `398db603` (staging) and may drift.

All frontend paths are relative to `frontend/src/`.

---

## Root causes

The app feels like a "dashboard web-app" rather than a website because of four structural
issues, not dozens of small ones:

1. **No front door.** `app/page.tsx` is a client-side redirect that renders `null`, sniffs
   `window.innerWidth`, and bounces to `/dashboard` (desktop) or `/meal-planner` (mobile).
   Logged-out visitors hit a sign-in form with zero product context.
2. **The Home page answers "what data do I have?" not "what am I doing next?"** Four
   non-clickable stat cards lead; the useful content (Meals This Week) is 4th in visual
   hierarchy. Mobile users are redirected away and never see Home at all.
3. **Pages are silos, not a flow.** The core loop (save recipes → plan meals → shop) is
   never drawn in the UI. Planner has no link to the shopping list it feeds. Empty states
   describe next steps in prose but provide no buttons.
4. **Website fundamentals are missing.** No error/404/loading boundaries, no OG/social
   metadata, dark-theme flash for light users, Arial body-font fallback, pinch-zoom disabled.

---

## A. Shell, routing, auth

- **Auth pages render inside full app chrome.** `components/layout/ConditionalAppLayout.tsx:7`
  has `ISOLATED_ROUTES: string[] = []` (cleared at some point), so `/sign-in`, `/sign-up`,
  `/sso-callback` are wrapped in `AppLayout` — signed-out users see the TopNav (nav links,
  theme toggle, "What's New" popover, "?" avatar) and mobile bottom nav around the auth card.
  `TopNav.tsx:436` unconditionally calls `useShoppingList()`, which fires a 401 for
  logged-out users. **Worst first impression in the app.**
- **Zero route boundaries.** No `error.tsx`, `not-found.tsx`, `loading.tsx`,
  `global-error.tsx` anywhere under `app/`. Bad URLs / thrown errors show Next.js unbranded
  defaults. Only `/meal-planner` and `/recipes` have loading UX, via ad-hoc inline
  `<Suspense>` fallbacks in their `page.tsx`.
- **Redirect stubs pretending to be routes:**
  - `app/recipes/add/page.tsx` renders `null`, opens the global wizard, `router.replace("/recipes")`.
    The **mobile bottom-nav "Add" tab points here** (`MobileBottomNav.tsx:41`) and is
    special-cased to never show as active (`MobileBottomNav.tsx:117-121`).
  - `app/meal-planner/create/page.tsx` is a server `redirect("/meal-planner")`. Nothing links to it.
- **Double client-redirect chain:** `/` → (blank, JS width check) → `/dashboard` → (blank,
  second JS width check in `app/dashboard/page.tsx:13-21`) → possibly `/meal-planner`.
  `MOBILE_BREAKPOINT = 768` duplicated in both files.
- **Middleware** (`src/proxy.ts`): public routes are only `/sign-in*`, `/sign-up*`,
  `/sso-callback*`. Everything else calls `auth.protect()`.
- **Auth forms themselves are good:** custom, branded (genie Logo, shadcn Card/Input/InputOTP,
  Google OAuth, email+OTP flow, proper loading/error states) — the problem is the chrome
  around them, not the forms.
- Local `frontend/.env.local` already sets `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL`
  and `..._SIGN_UP_...` to `/` (from earlier planning). **Railway prod must mirror this at deploy.**

## B. Branding, theme, metadata

- **Design system is the strongest asset**: purple primary `#8b5cf6` / teal secondary
  `#14b8a6`, full status + 6 chart colors, layered shadow system (`--shadow-raised/elevated/floating`),
  animation tokens, rich `@utility` composites in `app/globals.css`. Dark is default; light
  is `.light` class on `<html>`.
- **Theme flash:** theme applied via `useEffect` in `TopNav.tsx:417-482` (localStorage →
  `classList.toggle`). No blocking inline head script → light-mode users get a dark flash.
  `suppressHydrationWarning` masks the mismatch. Settings offers light/dark/**system** but
  TopNav toggle is binary — model mismatch between the two entry points.
- **Body font is Arial.** `globals.css:1160` hardcodes `font-family: Arial, Helvetica, sans-serif`;
  Geist (loaded in `app/layout.tsx:9-17`) only applies where `font-sans` is used.
- **Metadata is bare** (`app/layout.tsx:27-30`): title + description only. No `metadataBase`,
  no OpenGraph/Twitter card, no OG image, no sitemap/robots, no manifest, no apple-icon.
  Shared links preview as bare text. `public/` still has default `next.svg`/`vercel.svg`.
- **Pinch-zoom disabled:** viewport sets `maximumScale: 1, userScalable: false`
  (`app/layout.tsx:19-25`) — accessibility problem for public release.
- Logo: `components/layout/Logo.tsx` inline SVG, `currentColor` (inherits `text-primary`).
  Mirror at `public/logo.svg` hardcodes `#000`. No wordmark/lockup, no icon set.

## C. Home page (`/dashboard`)

- Structure (`app/dashboard/_components/DashboardView.tsx`): greeting header → 4 StatCards
  (Total Recipes / Favorites / Meals Planned / Shopping Items — **not clickable, not
  actionable**) → CookingStreak + ChefTip row → MealCarouselWidget ("Meals This Week") →
  ShoppingListWidget + RecipeRoulette + QuickAddForm grid.
- **Hierarchy inverted:** "Meals This Week" (the actual answer to "what am I cooking?") is
  4th. Stats lead.
- **Mobile can never reach it** — `dashboard/page.tsx` redirects mobile → `/meal-planner`.
  Desktop nav labels it "Home"; mobile nav has no Home entry. Two different homes by device.
- **First-run is four isolated zeros:** each widget has its own small empty state ("No recipes
  yet — Add some recipes to spin the wheel!", "No meals planned", "No items on your list")
  but none has a primary action button, and there's no unified welcome/get-started flow.
- Header subtitle always reads "Time to cook something amazing! You have 0 meals planned" —
  tone-deaf when empty.
- Code smells: `ShoppingListWidget` declares a `shoppingData` prop but destructures `{}` and
  refetches via its own hook (DashboardView's fetch is wasted); widgets sync via
  `window.addEventListener(PLANNER_EVENTS.UPDATED, ...)` custom events instead of React Query
  invalidation; `ChefTipWidget` renders a raw `<button>` (violates project Button rule) and
  renders `{tip}` = null as an empty card when the AI call fails.

## D. Per-page findings

### `/recipes` (RecipeBrowserView)
- Full-bleed hero + `<h1>` "Find your next meal", search, quick filters. Good bones.
- **Empty state has no CTA** (`components/recipe/browser/RecipeGrid.tsx:26-45`): "Your recipe
  collection is empty. Start by adding some recipes!" — no button (the only button renders
  when filters are active). Hero also interpolates "…collection of **0** saved recipes."
- **Two competing skeletons double-flash:** Suspense fallback in `app/recipes/page.tsx:5-22`
  (bordered header + 6 cards, `px-6 py-8`) vs the view's own `isLoading` branch
  (`RecipeBrowserView.tsx:606-619`, hero skeleton + 8 cards, PageLayout padding). Neither
  matches the loaded layout.
- Card click saves scroll+filter state to sessionStorage (good restore behavior).

### `/recipes/[id]` (FullRecipeView)
- Custom layout, no PageLayout: hero image, overlaid Back + favorite, RecipeHeaderCard pulled
  up `-mt-16`, ingredients/directions columns. Container `max-w-5xl px-6` (everything else
  is `max-w-7xl px-4 md:px-6`).
- **Back button uses `router.back()`** (`FullRecipeView.tsx:164-175`) — for shared/deep links
  this exits the app or goes somewhere unexpected. Needs history-aware fallback to `/recipes`.
- `RecipeSkeleton` is the best loading treatment in the app; `RecipeNotFound` has a proper
  "Back to Recipes" link (the one well-handled dead end).
- Actions: Add to Meal Plan (side-to-existing or new meal), Manage Groups, Edit, Print, Share,
  Delete. **No "add to shopping list."**

### `/meal-planner` (MealPlannerView)
- Title "Plan the Week" (nav says "Meal Planner"/"Planner" — mismatch). Drag-drop MealGrid +
  SelectedMealCard detail panel.
- **Empty-state wart:** grid is gated by `gridItems.length > 0 || selectedMealId !== null`
  (`MealPlannerView.tsx:622`), so new users don't see the grid or its dashed "Add Meal" card —
  just an orphan "This Week's Menu" heading over empty space with a lone button far below.
- **No loading gate on entries** — `entries` defaults to `[]`, so the empty state can flash
  before data arrives. Suspense fallback is a header bar + one block.
- **Fragile back handling:** manual `history.pushState` + `popstate` interception +
  `setNavigationBypass` hack (`MealPlannerView.tsx:125-147`) when the picker is open.
- **Duplicated discard AlertDialog** — same dialog copy-pasted into two return branches
  (`:533-601`, `:663-731`).
- **Two different meal-creation UIs app-wide:** in-planner `MealPreviewDialog` +
  `RecipePickerDialog` vs the global `MealCreationOverlay` (opened from TopNav "Add Meal",
  routes to `/meal-planner` on save). Same task, two flows.
- **No link to the shopping list it feeds.** (Biggest flow gap in the app.)

### `/shopping-list` (ShoppingListView)
- Good: StatCards + progress, QuickAddForm always available, clean low-shift skeleton,
  pinned nav actions.
- Empty state (`ShoppingListView.tsx:367-388`): "Add meals to your planner or use the form
  above" — **references the planner with no link**.
- Recipe-source filter sidebar is `hidden lg:block` — feature silently disappears on
  tablet/mobile.
- "Hide completed" is a raw `localStorage` read in the view (`:63-66`), bypassing the
  settings system.

### `/settings` (SettingsView)
- **"Meal Planning" category is a `PlaceholderSection`** advertising "default serving sizes,
  week start day, meal types" with nothing configurable (`SettingsView.tsx:57-64`). Meanwhile
  `DEFAULT_SETTINGS` (`hooks/persistence/useSettings.ts:73-124`) contains
  `measurementUnit`, `dietaryRestrictions`, `allergenAlerts`, `defaultBrowserView`,
  `combineDuplicates`, `autoBackup` — none surfaced in UI.
- Section files exist on disk but are **not wired into the render switch**
  (`MealPlanningSection`, `RecipeCategoriesSection`, `IngredientCategoriesSection`,
  `UnitConversionsSection`, …). Half-finished surface.
- Loading is a full-screen spinner ("Loading settings...") → layout jump. Hardcoded
  "Meal Genie v1.0.0" footer.

### `/admin` (AdminView)
- Reasonable (loading spinner + Access Denied state). Same spinner-not-skeleton pattern.

## E. Cross-cutting

### Onboarding: effectively none
No first-run experience, tour, sample data, or welcome flow anywhere. Only scattered
per-widget microcopy. The most likely first stop (recipe browser) has an empty state with
no CTA. The AI assistant — the app's most differentiating feature (can generate a full
recipe draft into the wizard) — is never advertised.

### Assistant discoverability
Single global `AssistantPopup` (mounted in `AppLayout.tsx:33`). Desktop: one small Sparkles
icon in TopNav + buried "Ask Meal Genie" in avatar menu. Mobile: **only** via More sheet.
No floating bubble, no contextual entry points.

### Mobile/desktop divergence
- Mobile never sees Home; desktop nav calls it "Home."
- Nav labels differ: "Home / Meal Planner / Recipe Browser / Shopping List" (desktop) vs
  "Planner / Recipes / Add / Shopping" (mobile).
- Desktop "Add" = dropdown (Recipe + Meal); mobile "Add" = recipe-only stub route.
- No theme toggle on mobile (Settings → Appearance only).
- Shopping recipe-source sidebar desktop-only.

### Consistency drift ("built at different times")
- **Headers diverge 3 ways:** standard PageHeader `<h2>` (Dashboard/Planner/Shopping/Settings/
  Admin) vs hero `<h1>` (Recipe Browser) vs no page header, custom hero (Recipe Detail).
  Several pages have no `<h1>` at all.
- **Title ↔ nav-label mismatches:** "Plan the Week" vs "Meal Planner"; "Find your next meal"
  vs "Recipe Browser."
- **Containers differ:** `max-w-7xl px-4 md:px-6 py-6` (most) vs `max-w-5xl px-6` (detail)
  vs `px-6 py-8` (recipes Suspense fallback).
- **Description placement:** inline baseline-aligned next to title (`PageHeader.tsx:38-49`,
  wraps awkwardly) vs stacked (DashboardView).
- **Loading treatments:** good skeletons (Recipes/Shopping/Detail) vs full-screen spinners
  (Settings/Admin) vs nothing (Planner entries).
- `pinActionsToNav` used only by Recipe Browser + Shopping List → scroll behavior differs
  per page.

### Dead / stale code
- `components/layout/RecentRecipeChip.tsx` (`RecentRecipesSection` — references a sidebar
  that no longer exists; never imported).
- `components/auth/UserMenu.tsx` (superseded by TopNavUserMenu / mobile sheet).
- Redirect stubs (`/recipes/add`, `/meal-planner/create`).
- `app/_components/` empty dir; `public/next.svg`, `public/vercel.svg` scaffolding.
- `components/marketing/` exists but is empty.
