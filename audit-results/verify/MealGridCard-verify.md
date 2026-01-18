# Design System Audit Report: MealGridCard.tsx

**File:** `frontend/src/app/meal-planner/_components/MealGridCard.tsx`
**Applicable Rules:** Part A (Component Usage) - This file is in `app/` directory, not `components/ui/`

---

## Audit Summary

| Category | Status | Issues Found |
|----------|--------|--------------|
| A1. No Fake Cards | Γ£à Pass | Uses `<Card>` component |
| A2. No Raw Buttons | Γ£à Pass | Uses `<Button>` component |
| A3. No Raw Badges | Γ£à Pass | No badge-like elements misused |
| A4. No Manual Sizing Overrides | ΓÜá∩╕Å Violation | Manual icon sizing |
| A5. No Redundant Interaction Classes | Γ£à Pass | Uses `liftable` utility |
| A6. Token Standardization | ΓÜá∩╕Å Violation | Hardcoded color classes |
| Accessibility (G2) | Γ£à Pass | Has aria-labels |

---

## Violations Found

### Violation 1: Inconsistent Icon Sizing (Lines 133-141, 157-159, 174, 180)

**Rule A4/B4:** Icons should use consistent `size-*` classes and `strokeWidth={1.5}`

**Current Code:**
```tsx
// Line 133-141
<ShoppingCart
  className={cn(
    "size-3.5",  // Γ£à Good
    shoppingMode === "none" && "text-destructive",
    shoppingMode === "produce_only" && "text-warning",
    shoppingMode === "all" && "text-secondary"
  )}
  strokeWidth={1.5}  // Γ£à Good
/>

// Line 157-159
<Heart
  className="size-3.5 text-destructive fill-current"
  strokeWidth={1.5}
/>

// Lines 174, 180
<Users className="h-3.5 w-3.5" strokeWidth={1.5} />
<Clock className="h-3.5 w-3.5" strokeWidth={1.5} />
```

**Issue:** Lines 174 and 180 use `h-3.5 w-3.5` instead of the standardized `size-3.5` pattern used elsewhere in the same file.

**Fix:**
```tsx
<Users className="size-3.5" strokeWidth={1.5} />
<Clock className="size-3.5" strokeWidth={1.5} />
```

---

### Violation 2: Hardcoded Color in Strikethrough Span (Line 144)

**Rule A6:** No hardcoded colors - use semantic tokens

**Current Code:**
```tsx
<span className="w-4 h-0.5 bg-destructive rotate-[-45deg]" />
```

**Issue:** Uses arbitrary value `rotate-[-45deg]` instead of standard Tailwind class.

**Note:** `bg-destructive` is correct, but `rotate-[-45deg]` is an arbitrary value. However, this is a specialized visual indicator and the exact -45 degree rotation is intentional for the "crossed out" effect. **This is acceptable** as there's no standard Tailwind equivalent for exactly -45 degrees (only `rotate-45` exists for positive rotation).

**Status:** Γ£à Acceptable exception - visual design requirement

---

### Violation 3: Arbitrary Sizing on Strikethrough Span (Line 144)

**Rule A6:** Prefer standard Tailwind scale over arbitrary values

**Current Code:**
```tsx
<span className="w-4 h-0.5 bg-destructive rotate-[-45deg]" />
```

**Issue:** `h-0.5` (2px) is a standard Tailwind class, so this is fine.

**Status:** Γ£à Pass - uses standard scale

---

## Corrected Code

Only the icon sizing on lines 174 and 180 needs correction:

```tsx
// Line 171-184 - Corrected
<div className="flex items-center gap-3 text-xs text-muted-foreground">
  {item.servings != null && (
    <span className="flex items-center gap-1">
      <Users className="size-3.5" strokeWidth={1.5} />
      {item.servings} servings
    </span>
  )}
  {item.totalTime != null && (
    <span className="flex items-center gap-1">
      <Clock className="size-3.5" strokeWidth={1.5} />
      {formatTime(item.totalTime)}
    </span>
  )}
</div>
```

---

## Additional Observations (Not Violations)

### Positive Patterns Used Γ£à

1. **Line 88-104:** Correctly uses `<Card>` component instead of styled div
2. **Line 98:** Uses `liftable` utility class for hover animation (from design system)
3. **Line 107:** Uses `bg-elevated` semantic token
4. **Line 122-147:** Uses `<Button variant="ghost" size="icon-sm">` correctly
5. **Line 130:** Uses `bg-overlay-strong` semantic token
6. **Line 168:** Uses `text-foreground` and `text-primary` semantic tokens
7. **Line 171:** Uses `text-muted-foreground` semantic token
8. **Lines 131, 92:** Proper `aria-label` attributes on interactive elements

### Design System Alignment Γ£à

- Uses `cn()` utility for conditional class merging
- Proper use of the `liftable` interaction pattern
- Correct semantic color tokens (`text-destructive`, `text-warning`, `text-secondary`)
- Proper focus ring pattern (line 100)

---

## Summary

**Total Violations:** 1 minor (inconsistent icon sizing syntax)

**Severity:** Low - The component is well-structured and follows most design system rules. The only issue is a syntax inconsistency where `h-3.5 w-3.5` should be `size-3.5` for consistency with the rest of the file.

`Γÿà Insight ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ`
- The `size-*` utility is a shorthand for setting both width and height simultaneously, making code more concise and consistent
- This file demonstrates good use of the `liftable` utility class from globals.css, which provides the hover lift effect with proper easing
- The shopping mode color system (`text-destructive` ΓåÆ none, `text-warning` ΓåÆ produce_only, `text-secondary` ΓåÆ all) creates a clear visual language for state
`ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ`
