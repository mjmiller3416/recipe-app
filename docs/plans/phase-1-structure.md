# Phase 1 — Structure: Route Groups, Public Root, Auth Isolation, Boundaries, Metadata

> Prerequisite reading: `00-ux-audit.md` §A, §B. This phase is mostly mechanical and
> unblocks every later phase. No visual redesign happens here.

**Goal:** Give the app a real public/private structure. After this phase: signed-out
visitors at `/` see a (placeholder) marketing page with no app chrome; auth pages render
bare; signed-in visitors at `/` land in the app with a server-side redirect (no blank
flash); bad URLs and errors show branded pages; shared links have proper metadata.

---

## 1. Restructure `app/` into route groups

Route groups don't change URLs — all app URLs stay identical. Target layout:

```
frontend/src/app/
  layout.tsx                 # root: html/body, fonts, providers, metadata ONLY (no chrome)
  not-found.tsx              # NEW branded 404
  error.tsx                  # NEW branded error boundary ("use client", reset button)
  global-error.tsx           # NEW minimal fallback for root-layout errors
  favicon.ico                # existing
  icon.png                   # NEW (see §5)
  apple-icon.png             # NEW (see §5)
  manifest.webmanifest       # NEW (see §5)
  api/upload/route.ts        # unchanged location

  (marketing)/
    layout.tsx               # NEW minimal marketing shell (see §2)
    page.tsx                 # NEW: the `/` route (see §2)

  (auth)/
    layout.tsx               # NEW: min-h-screen centered wrapper, bg-background
    sign-in/[[...sign-in]]/page.tsx     # moved
    sign-up/[[...sign-up]]/page.tsx     # moved
    sso-callback/page.tsx               # moved

  (app)/
    layout.tsx               # NEW: <AppLayout>{children}</AppLayout>
    dashboard/…              # moved as-is (incl. _components)
    recipes/…                # moved as-is
    meal-planner/…           # moved as-is
    shopping-list/…          # moved as-is
    settings/…               # moved as-is
    admin/…                  # moved as-is
```

Steps:
- `git mv` each feature directory into `(app)/`, auth routes into `(auth)/`.
- Root `app/layout.tsx`: keep fonts, `ClerkProvider`, `QueryProvider`, `<html>/<body>`;
  **remove** `ConditionalAppLayout` — children render directly.
- `(app)/layout.tsx`: client or server component that renders `<AppLayout>{children}</AppLayout>`
  (AppLayout is already client; the layout file itself can be a server component).
- **Delete** `components/layout/ConditionalAppLayout.tsx` and all references.
- Simplify sign-in/sign-up page wrappers: their current
  `min-h-screen flex items-center justify-center` div moves into `(auth)/layout.tsx`.
- Delete the old `app/page.tsx` width-sniffing splitter and the old `app/dashboard/page.tsx`
  **root-level** splitter stays for now (mobile→planner redirect inside `/dashboard` is
  removed in Phase 3 — don't remove it here, it preserves current mobile behavior).
- Delete the empty `app/_components/` directory.

## 2. Public root: `(marketing)/page.tsx`

Server component:

```tsx
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function RootPage() {
  const { userId } = await auth();
  if (userId) redirect("/dashboard");
  return <LandingPage />;   // Phase 1: minimal placeholder; Phase 2 builds the real one
}
```

- Phase-1 placeholder `LandingPage`: centered `Logo` + "Meal Genie" + one-line tagline +
  primary "Get started" → `/sign-up` and ghost "Sign in" → `/sign-in`. Uses existing tokens
  (`bg-background`, `text-primary`, shadcn `Button`). Enough to not be embarrassing; Phase 2
  replaces it.
- `(marketing)/layout.tsx`: plain wrapper for now (Phase 2 adds header/footer). Must NOT
  import AppLayout/TopNav.
- Why this works with auth: local `.env.local` already sets both Clerk fallback-redirect
  vars to `/`, so post-login users hit `/` → server sees `userId` → `redirect("/dashboard")`
  with zero client flash. **Deploy note: mirror both env vars to `/` on Railway prod**
  (see `landing-page-launch-todos` memory / long-term roadmap).

## 3. Middleware (`src/proxy.ts`)

Add public routes:

```ts
const isPublicRoute = createRouteMatcher([
  "/",                // landing
  "/privacy(.*)",     // Phase 2 content, route reserved now
  "/terms(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/sso-callback(.*)",
]);
```

Matcher config stays unchanged.

## 4. Route boundaries

- `app/not-found.tsx`: branded — `Logo`, "Page not found", short copy, `Button` links to
  `/` and `/recipes`. Server component is fine.
- `app/error.tsx`: `"use client"`, receives `{ error, reset }`, branded card with
  "Something went wrong" + "Try again" (`reset()`) + "Go home" link.
- `app/global-error.tsx`: minimal (must render its own `<html><body>`), plain text + reload
  button. Rare path; keep tiny.
- Do **not** add per-route `loading.tsx` here — loading-state normalization is Phase 4.

## 5. Metadata, icons, viewport

In root `app/layout.tsx`:

```ts
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: {
    default: "Meal Genie — Recipes, meal planning, and smart shopping lists",
    template: "%s · Meal Genie",
  },
  description: "Save recipes, plan your week, and get an auto-built shopping list. AI-powered recipe import and generation.",
  openGraph: {
    siteName: "Meal Genie",
    type: "website",
    url: "/",
  },
  twitter: { card: "summary_large_image" },
};
```

- Add `NEXT_PUBLIC_APP_URL` to `.env.local` + document in CLAUDE.md env list + set on Railway.
- Per-page titles: add `export const metadata = { title: "…" }` to the **server** page
  wrappers — Recipes, Meal Planner, Shopping List, Settings, Admin, Sign in, Sign up.
  (`/dashboard` is a client page; it gets a title in Phase 3 when it's rebuilt.)
- **Viewport:** remove `maximumScale: 1, userScalable: false` from the viewport export —
  re-enables pinch zoom (a11y requirement).
- **Icons:** generate from `components/layout/Logo.tsx` artwork — `app/icon.png` (512×512,
  purple `#8b5cf6` genie on transparent or dark bg) and `app/apple-icon.png` (180×180,
  solid bg). Next serves these by file convention.
- `app/manifest.webmanifest`: name, short_name "Meal Genie", theme_color `#8b5cf6`,
  background_color (dark bg token value), icons.
- The OG **image** itself (`opengraph-image.png`) is a Phase 2 deliverable (needs landing
  visual language); the metadata scaffolding above ships now.
- Delete `public/next.svg`, `public/vercel.svg`.

## 6. Verification / acceptance criteria

- [ ] `npx tsc` and `npm run build` pass; `npm run lint` clean.
- [ ] All app URLs unchanged (`/dashboard`, `/recipes`, `/recipes/[id]`, `/meal-planner`,
      `/shopping-list`, `/settings`, `/admin`).
- [ ] Signed **out**: `/` shows placeholder landing, **no TopNav / bottom nav**, no 401s in
      the network tab; `/sign-in` and `/sign-up` render bare and centered; `/recipes`
      redirects to sign-in.
- [ ] Signed **in**: `/` server-redirects to `/dashboard` (no blank flash — check with JS
      throttled); mobile still ends up on `/meal-planner` (via the existing dashboard
      redirect, removed in Phase 3).
- [ ] `/nonexistent-url` shows the branded 404.
- [ ] Sign-in → land on `/` → `/dashboard` flow works end-to-end (use the `verify` skill:
      backend + frontend + authenticated browser session).
- [ ] View-source shows title template, description, OG tags.

## Out of scope (later phases)

Real landing content (P2) · privacy/terms copy (P2) · OG image (P2) · home redesign & killing
the mobile redirect (P3) · loading.tsx normalization (P4) · theme-flash fix (P5).
