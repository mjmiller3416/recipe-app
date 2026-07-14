# Pre-Release Refinement Initiative

Started 2026-07-12 from a full UX/layout/flow review (findings preserved in
[`00-ux-audit.md`](00-ux-audit.md)). Goal: shift Meal Genie from "dashboard web-app" to a
cohesive product website ahead of public release.

**Rollout: one phase at a time, in order.** Each phase doc is self-contained — it restates
the findings it addresses, so it can be executed in a fresh session without this history.

| Phase | Doc | Status | Summary |
|-------|-----|--------|---------|
| 1 | [phase-1-structure.md](phase-1-structure.md) | ✅ done 2026-07-13 (staging) | Route groups `(marketing)/(auth)/(app)`, public `/` with server-side auth redirect, bare auth pages, 404/error boundaries, metadata/icons/viewport |
| 2 | [phase-2-landing-page.md](phase-2-landing-page.md) | ✅ done 2026-07-13 (staging) | Real landing page from existing design tokens, privacy/terms (+public /whats-new), OG image, sitemap/robots. Refined 2026-07-13: screenshots replaced with live in-DOM product vignettes (wish→recipe hero, threaded how-it-works, planner/shopping slices, CTA card fan) |
| 3 | [phase-3-home-redesign.md](phase-3-home-redesign.md) | ✅ done 2026-07-13 (staging) | Today-first Home (Tonight card), one Home for all devices, GetStarted first-run flow, delete stat-card row |
| 4 | [phase-4-flow-consistency.md](phase-4-flow-consistency.md) | ✅ done 2026-07-13 (staging) | Save→plan→shop loop wired (planner↔shopping header links, plan toast, empty-state CTAs), one meal-creation flow (inverted per user feedback: two-panel `MealCreationOverlay` is the single surface, now with edit mode, saved-meal reuse, nav guards, and a mobile bottom-bar layout; `MealPreviewDialog`/`RecipePickerDialog` page-takeover deleted; global entries route via `/meal-planner?addMeal=1`), stub routes deleted, mobile More-sheet Add items, h1/nav-label/skeleton normalization, per-route `loading.tsx`, history-aware back |
| 4.5 | [phase-4.5-home-widgets.md](phase-4.5-home-widgets.md) | ✅ done 2026-07-13 (staging) | Home widget refit (2026-07-13 post-P3 review): streak → header chip replacing recipe/favorites chips, Chef's Tip cut, Roulette → "Surprise me" in MealCreationOverlay + empty-Tonight action, secondary widget row deleted |
| 5 | [phase-5-polish.md](phase-5-polish.md) | ✅ done 2026-07-13 (staging) | Blocking theme script (no flash), one theme model (`useTheme` → settings store, light/dark/system, mobile More-sheet toggle), Geist body font, assistant FAB (mobile) + "Generate a recipe" browser entry, settings truth (Meal Planning placeholder removed, dead keys pruned, hide-completed migrated, real version), dead code deleted, a11y (reduced motion, planner keyboard Enter/Space split, aria-labels, heading order) |

Update the status column as phases land (☐ → 🔄 in progress → ✅ done + branch/PR ref).

## Standing deploy note

When Phase 1 ships to Railway: set `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL` and
`NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL` to `/` in prod (already done in local
`.env.local`), and add `NEXT_PUBLIC_APP_URL` for `metadataBase`.

## The four root causes (from the audit — the "why" behind everything)

1. **No front door** — `/` is a blank client redirect; auth pages render inside app chrome. → P1, P2
2. **Home answers "what data do I have?" not "what's next?"** — stat cards lead; mobile never sees Home. → P3, P4.5
3. **Pages are silos** — planner→shopping unlinked; empty states have prose, no buttons; two meal-creation UIs. → P4
4. **Website fundamentals missing** — no 404/error/loading, no OG/SEO, theme flash, Arial body font, zoom disabled. → P1, P4, P5
