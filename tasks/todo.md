# Fix: Meal Planner Page Cut Off on Different Screens

## Problem
The Meal Planner page appears cut off on some computers while displaying correctly on others.

## Analysis
In [PageLayout.tsx:164](frontend/src/components/layout/PageLayout.tsx#L164), the `fillViewport` mode uses `h-screen` (CSS `100vh`):

```tsx
<div className={cn("h-screen flex flex-col overflow-hidden bg-background", className)}>
```

**Why this causes problems:**
- `100vh` represents the full viewport height, but on different browsers/systems, this doesn't account for:
  - Browser chrome (address bar, tabs, toolbars)
  - Windows display scaling settings
  - Browser extensions taking up vertical space
- The result: `100vh` is larger than the actual visible area, causing content to be cut off

**Solution:** Use `h-dvh` (dynamic viewport height) instead of `h-screen`. The `dvh` unit calculates the actual visible viewport height accounting for browser UI.

## Plan

- [x] Update `PageLayout.tsx` to use `h-dvh` instead of `h-screen` in fillViewport mode
- [x] Verify the change

## Files Changed
- `frontend/src/components/layout/PageLayout.tsx` (line 164)

## Review

### Summary
Changed the viewport height calculation from `h-screen` (100vh) to `h-dvh` (100dvh) in the `fillViewport` mode of PageLayout. This ensures the page content fills exactly the visible viewport height, accounting for browser UI elements.

### What Changed
- **PageLayout.tsx line 164**: `h-screen` → `h-dvh`

### Why This Fixes the Issue
The `dvh` (dynamic viewport height) unit was introduced specifically to solve the `100vh` problem. Unlike `vh` which uses the "largest possible viewport", `dvh` uses the actual visible viewport height and dynamically adjusts when browser UI appears or disappears.

### Browser Support
`dvh` is supported in all modern browsers (Chrome 108+, Firefox 101+, Safari 15.4+, Edge 108+).
