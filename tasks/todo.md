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

- [ ] Update `PageLayout.tsx` to use `h-dvh` instead of `h-screen` in fillViewport mode
- [ ] Verify the change

## Files to Change
- `frontend/src/components/layout/PageLayout.tsx` (line 164)
