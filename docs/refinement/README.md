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
| 4 | [phase-4-flow-consistency.md](phase-4-flow-consistency.md) | ☐ not started | Wire the save→plan→shop loop, one meal-creation flow, empty-state CTAs, header/container/loading normalization, delete stub routes |
| 5 | [phase-5-polish.md](phase-5-polish.md) | ☐ not started | Theme-flash fix + unified theme model, mobile parity, assistant discoverability, settings truth, dead code, a11y |

Update the status column as phases land (☐ → 🔄 in progress → ✅ done + branch/PR ref).

## Standing deploy note

When Phase 1 ships to Railway: set `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL` and
`NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL` to `/` in prod (already done in local
`.env.local`), and add `NEXT_PUBLIC_APP_URL` for `metadataBase`.

## The four root causes (from the audit — the "why" behind everything)

1. **No front door** — `/` is a blank client redirect; auth pages render inside app chrome. → P1, P2
2. **Home answers "what data do I have?" not "what's next?"** — stat cards lead; mobile never sees Home. → P3
3. **Pages are silos** — planner→shopping unlinked; empty states have prose, no buttons; two meal-creation UIs. → P4
4. **Website fundamentals missing** — no 404/error/loading, no OG/SEO, theme flash, Arial body font, zoom disabled. → P1, P4, P5
