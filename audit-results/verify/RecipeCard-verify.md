# Design System Audit Report: RecipeCard.tsx

**File:** `frontend/src/components/recipe/RecipeCard.tsx`  
**File Type:** Component usage (applies **Part A** rules)  
**Audit Date:** 2026-01-18

---

## Summary

| Status | Count |
|--------|-------|
| Γ£à Compliant | 15 |
| ΓÜá∩╕Å Violations | 7 |

---

## Violations Found

### 1. **A6 - Arbitrary Value** (Line 156)
**Issue:** `w-16 h-16` is fine, but the overall thumbnail container uses hardcoded sizing
```tsx
// Line 156
<div className="relative w-16 h-16 flex-shrink-0 overflow-hidden rounded-lg bg-elevated">
```
**Status:** Γ£à Actually compliant - uses standard Tailwind scale (`w-16` = 64px, `h-16` = 64px)

---

### 2. **A5 - Redundant Interaction Classes** (Lines 160, 232, 338)
**Issue:** Manual `transition-transform duration-300` added to images that may already have parent hover handling
```tsx
// Line 160
className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"

// Line 232
className="w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"

// Line 338
className="w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
```
**Verdict:** ΓÜá∩╕Å Minor - These are intentional image zoom effects, but the implementation is inconsistent (110% vs 105% scale). Consider standardizing.

---

### 3. **A6 - Inconsistent Spacing** (Multiple Lines)
**Issue:** Mixed spacing values used throughout the component

| Location | Current | Issue |
|----------|---------|-------|
| Line 154 | `gap-3 p-3` | Γ£à Fine for compact layout |
| Line 171 | `gap-3 mt-1` | ΓÜá∩╕Å Mixing `mt-1` with gaps |
| Line 266 | `p-6 space-y-4` | Γ£à Compliant |
| Line 272 | `gap-6` | Γ£à Compliant |
| Line 344 | `p-6 md:p-8` | Γ£à Compliant |
| Line 346 | `space-y-4 mb-6` | ΓÜá∩╕Å Mixing `space-y` with margin |
| Line 391 | `space-y-3 mb-6` | ΓÜá∩╕Å Mixing `space-y` with margin |
| Line 429 | `gap-6 pt-4` | Γ£à Compliant |

**Lines 171, 346, 391:** Mixing margin utilities with spacing utilities creates inconsistent rhythm.

---

### 4. **A6 - Hardcoded Colors** (Line 237-239)
**Issue:** Using `bg-gradient-to-t from-background via-background/40 to-transparent` is fine, but the opacity value is arbitrary
```tsx
// Lines 237-239
<div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 ease-out group-hover:scale-105"
     style={{ transformOrigin: 'center center' }}
/>
```
**Verdict:** Γ£à Acceptable - uses semantic `background` token with opacity modifier

---

### 5. **A1 - Potential Fake Card Pattern** (Line 156, 228, 334)
**Issue:** Using `<div>` with `bg-elevated` for image containers
```tsx
// Line 156 (small card)
<div className="relative w-16 h-16 flex-shrink-0 overflow-hidden rounded-lg bg-elevated">

// Line 228 (medium card)
<div className="relative w-full aspect-[4/3] overflow-hidden bg-elevated">

// Line 334 (large card)
<div className="relative w-full md:w-1/3 aspect-square md:aspect-auto overflow-hidden bg-elevated">
```
**Verdict:** Γ£à Acceptable - These are image containers, not content cards. Using `bg-elevated` as a placeholder background for images before they load is a valid pattern.

---

### 6. **C4 - Z-Index Missing** (Line 243)
**Issue:** Absolute positioned favorite button without explicit z-index
```tsx
// Line 243
<div className="absolute top-4 right-4">
  <FavoriteButton ... />
</div>
```
**Verdict:** ΓÜá∩╕Å Should add `z-10` to ensure button stays above image overlay

---

### 7. **A6 - Arbitrary Aspect Ratio** (Line 228)
**Issue:** `aspect-[4/3]` is an arbitrary value
```tsx
// Line 228
<div className="relative w-full aspect-[4/3] overflow-hidden bg-elevated">
```
**Verdict:** Γ£à Acceptable - `aspect-[4/3]` is a common photography ratio, and Tailwind 4's arbitrary values are acceptable for aspect ratios since there's no built-in `aspect-4/3` class.

---

## Confirmed Violations to Fix

### Violation 1: Missing z-index on positioned elements (Lines 243, 254)
```tsx
// CURRENT (Line 243)
<div className="absolute top-4 right-4">

// FIXED
<div className="absolute top-4 right-4 z-10">
```

```tsx
// CURRENT (Line 254)
<div className="absolute top-4 left-4">

// FIXED
<div className="absolute top-4 left-4 z-10">
```

---

### Violation 2: Inconsistent hover scale (Lines 160 vs 232, 338)
```tsx
// CURRENT (Line 160) - small card uses 110%
className="... group-hover:scale-110"

// CURRENT (Lines 232, 338) - medium/large cards use 105%
className="... group-hover:scale-105"
```

**Recommendation:** Standardize to `group-hover:scale-105` for a more subtle, professional effect across all sizes.

---

### Violation 3: Mixed spacing pattern (Line 171)
```tsx
// CURRENT
<div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">

// RECOMMENDATION
// Parent should handle all spacing via gap/space-y, not mix with margins
```

---

## Corrected Code

Here are the specific line fixes:

```tsx
// Line 160 - Standardize scale
className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"

// Line 243 - Add z-index
<div className="absolute top-4 right-4 z-10">

// Line 254 - Add z-index  
<div className="absolute top-4 left-4 z-10">
```

---

## Compliance Checklist

| Rule | Status | Notes |
|------|--------|-------|
| A1 - No Fake Cards | Γ£à | Uses `<Card>` component properly |
| A2 - No Raw Buttons | Γ£à | Uses `<FavoriteButton>` component |
| A3 - No Raw Badges | Γ£à | Uses `<RecipeBadge>` component |
| A4 - No Manual Sizing | Γ£à | Components use size props |
| A5 - No Redundant States | ΓÜá∩╕Å | Image transitions are intentional but inconsistent |
| A6 - Token Standardization | ΓÜá∩╕Å | Minor spacing inconsistencies |
| G1 - Focus Management | Γ£à | Cards have `tabIndex={0}` and `onKeyDown` |
| G2 - Screen Reader Support | Γ£à | Cards have `aria-label` |

---

## Overall Assessment

**Grade: B+**

The component is well-structured and follows most design system rules. Key strengths:
- Proper use of `<Card>`, `<FavoriteButton>`, and `<RecipeBadge>` components
- Good accessibility with keyboard support and aria-labels
- Consistent use of semantic color tokens

Minor improvements needed:
1. Add `z-10` to absolutely positioned overlay elements
2. Standardize image hover scale effect (105% everywhere)
3. Consider simplifying mixed margin/gap patterns

`Γÿà Insight ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ`
**Why z-index matters for overlays:** When an image container has both an image and an overlay (like the gradient on hover), any buttons positioned on top need explicit z-index to ensure they remain clickable. Without it, the overlay div (which scales with the image) could intercept clicks.

**The image scale pattern:** Using `group-hover:scale-105` on images inside `overflow-hidden` containers is a classic "zoom on hover" effect. The overflow clipping ensures the scaled image doesn't break the card boundaries.
`ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ`
