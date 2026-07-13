# Phase 2 — Landing Page MVP + Launch Hygiene

> Prerequisites: Phase 1 complete (route groups exist, `/` is public, marketing layout
> stub in place). Reading: `00-ux-audit.md` §B.

**Goal:** Replace the Phase-1 placeholder with a real marketing landing page that reads as
"the same product, before you sign in" — plus the pages/assets a public site legally and
practically needs (privacy, terms, OG image, sitemap, robots).

**Anti-disjointedness principles (why this won't feel bolted-on):**
1. Build from the **existing design system** — same tokens (`bg-background`, `text-primary`
   purple, teal accents), same Geist type, same shadcn Button/Card/Badge, same genie `Logo`,
   same shadow/animation utilities from `globals.css`.
2. Feature visuals are **real in-app screenshots** (dark theme, the default), not stock art.
3. The marketing header is a slimmed-down cousin of the TopNav (same height/logo placement),
   so the transition after sign-in feels like the chrome "filled in," not switched.

---

## 1. Marketing shell (`app/(marketing)/layout.tsx`)

- **Header:** sticky, `h-16` (matches TopNav), `bg-background/80 backdrop-blur-sm border-b`:
  `Logo` + "Meal Genie" left; right: `Button variant="ghost"` "Sign in" → `/sign-in`,
  `Button` "Get started" → `/sign-up`. No nav links needed at MVP.
- **Footer:** logo, one-line tagline, links: Privacy · Terms · What's New (changelog) ·
  contact email. `text-muted-foreground text-sm`.
- Components live in `app/(marketing)/_components/` (note: `components/marketing/` exists
  and is empty — either use it or delete it; prefer `_components` colocation to match the
  rest of the app).

## 2. Landing page sections (`app/(marketing)/page.tsx`)

Keep the signed-in redirect from Phase 1. Section order:

1. **Hero** — headline + subcopy + primary CTA + product screenshot.
   - Suggested headline direction: "Your week's meals, planned in minutes." or
     "Save recipes. Plan the week. Shopping list writes itself." (pick one voice; the
     second mirrors the product's actual core loop, which sections 2–4 then echo).
   - Subcopy ≤ 2 lines. CTA: "Get started free" → `/sign-up`; secondary ghost "Sign in".
   - Screenshot: recipe browser or planner in dark theme, inside a subtle
     `shadow-floating` rounded frame, slight perspective ok. Consider a soft purple radial
     glow behind it (`--primary` at low alpha) — the app's own glow shadows exist as tokens.
2. **How it works — 3 steps** (this *is* the core loop; it doubles as onboarding education):
   ① Save recipes — type them, **import from any URL**, or let Meal Genie generate one.
   ② Plan your week — drag meals into your weekly menu.
   ③ Shop once — your shopping list builds itself from the plan, aggregated and sorted by aisle.
3. **Feature grid** (4–6 cards, shadcn `Card`, lucide icons `strokeWidth={1.5}`):
   AI recipe generation & import · Meal Genie assistant (chat that drafts recipes) ·
   Auto shopping list with pantry check-off · Nutrition facts · Cooking streaks ·
   Weekly planner. One screenshot-backed highlight card is worth more than six text cards —
   consider 2 large (screenshot) + 4 small.
4. **Final CTA band** — repeat headline variant + "Get started free".

Implementation notes:
- All server components except any animation wrappers. Use `next/image` for screenshots
  with proper `sizes` (these are the LCP).
- Respect `prefers-reduced-motion` for any entrance animations; keep animation minimal —
  this page must feel fast.
- Mobile-first: hero stacks, screenshot full-width, header CTAs stay visible.

## 3. Screenshots + OG image (assets)

- Capture via the local stack (use the `verify` skill to launch backend + frontend with an
  authenticated session; seed data via `backend/scripts/seed_database.py` so screenshots
  aren't empty). Playwright MCP `browser_take_screenshot` at 1440×900, dark theme.
- Store under `frontend/public/images/landing/`. Capture: recipe browser (hero), planner
  with a filled week, shopping list with progress, assistant popup with a generated recipe.
- **OG image:** `app/opengraph-image.png` (1200×630) — logo + headline + screenshot crop on
  dark bg. File-convention route; the Phase-1 metadata picks it up automatically.

## 4. Privacy & Terms (`(marketing)/privacy/page.tsx`, `(marketing)/terms/page.tsx`)

- Simple prose layout: `max-w-3xl` centered, `text-page-title` h1, dated.
- Draft standard SaaS privacy/terms content covering: account data via Clerk, recipe/user
  content storage, Cloudinary image hosting, Google Gemini processing of prompts (AI
  features), cookies/localStorage, data export/delete (the app already has Data Management
  export/delete — reference it), contact email.
- **Flag clearly at top of each file (code comment): placeholder legal copy — owner must
  review before public launch.**
- These were already on the pre-launch checklist (see `landing-page-launch-todos` memory).

## 5. SEO plumbing

- `app/sitemap.ts`: `/`, `/privacy`, `/terms`, `/sign-in`, `/sign-up`.
- `app/robots.ts`: allow `/`, `/privacy`, `/terms`; disallow the app routes (they're
  auth-gated anyway); reference sitemap.
- Per-page metadata for privacy/terms.
- Optional (cheap win): JSON-LD `SoftwareApplication` script on the landing page.

## 6. Verification / acceptance criteria

- [ ] Lighthouse on `/` (mobile): Performance ≥ 90, a11y ≥ 95, SEO ≥ 95.
- [ ] Landing renders correctly signed-out; signed-in users still bounce to the app.
- [ ] All CTAs land on working auth pages; post-signup flow returns into the app.
- [ ] OG preview correct (check with an OG debugger or view-source meta tags).
- [ ] Page is fully responsive 360px → 1920px; reduced-motion honored.
- [ ] Footer links work; privacy/terms readable on mobile.

## Out of scope

Pricing/tiers page (product has `has_pro_access` plumbing but no public pricing yet — revisit
at monetization) · blog/docs · analytics · light-theme marketing variant (dark-only is fine
and matches the app default).
