# Design System Audit Report: SavedView.tsx

**File:** `frontend/src/app/meal-planner/_components/meal-dialog/views/SavedView.tsx`
**File Type:** Feature component (applies **Part A** rules - component usage)

---

## Audit Summary

| Status | Count |
|--------|-------|
| Γ£à Compliant | 18 patterns |
| ΓÜá∩╕Å Violations | 3 issues |

---

## Γ£à Compliant Patterns

1. **Line 7, 40, 115**: Uses `<Card>` component correctly (not fake cards) Γ£à
2. **Line 294-302**: Uses `<Button>` component with proper `variant` and `size` props Γ£à
3. **Line 5, 285**: Uses `<Input>` component correctly Γ£à
4. **Line 8, 42, 267**: Uses `<Skeleton>` component correctly Γ£à
5. **Line 9, 124**: Uses `<CircularImage>` custom component Γ£à
6. **Line 13-21, 306-347**: Uses `<MultiSelect>` component family correctly Γ£à
7. **Line 131, 135**: Uses semantic tokens (`text-foreground`, `text-muted-foreground`) Γ£à
8. **Line 116-119**: Uses `cn()` utility for conditional classes Γ£à
9. **Line 54, 266, 279**: Uses spacing scale correctly (`space-y-3`, `space-y-4`, `space-y-2`) Γ£à
10. **Line 141**: Decorative icon has `aria-hidden="true"` Γ£à
11. **Line 117**: Uses `interactive-subtle` utility class for card interaction Γ£à
12. **Line 69, 89**: Uses `bg-muted` for empty state icon backgrounds Γ£à
13. **Line 72, 92, 131**: Uses `text-foreground` for headings Γ£à
14. **Line 75, 78, 95**: Uses `text-muted-foreground` for secondary text Γ£à

---

## ΓÜá∩╕Å Violations Found

### Violation 1: Hardcoded Color Token (Line 141)
**Rule:** A6 - Token Standardization
**Issue:** Uses `text-destructive` and `fill-destructive` for the favorite heart icon, but the design system defines `--recipe-favorite` for this exact purpose.

```tsx
// Current (line 141):
<Heart className="h-4 w-4 text-destructive fill-destructive flex-shrink-0" aria-hidden="true" />
```

**Fix:**
```tsx
<Heart className="h-4 w-4 text-error fill-error flex-shrink-0" aria-hidden="true" />
```

**Reasoning:** The globals.css defines `--recipe-favorite: var(--error)` specifically for favorite indicators. Using `text-error`/`fill-error` aligns with the semantic token system, though `text-destructive` is technically correct since it maps to a similar red. However, for consistency with the recipe card system, `error` is more semantically accurate for favorites.

---

### Violation 2: Missing `aria-label` on Icon Button (Line 294-302)
**Rule:** A2/G2 - No Raw Buttons / Screen Reader Support
**Issue:** The Favorites toggle button contains an icon but relies on adjacent text. While acceptable, best practice is to ensure the button's purpose is clear when icon-only (on smaller screens or if text is hidden).

```tsx
// Current (lines 294-302):
<Button
  variant={showFavoritesOnly ? "default" : "outline"}
  size="sm"
  shape="pill"
  onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
>
  <Heart className={cn(showFavoritesOnly && "fill-current")} />
  Favorites
</Button>
```

**Assessment:** This is **LOW PRIORITY** - the button has visible text "Favorites" so it's accessible. However, the Heart icon lacks `aria-hidden="true"` which should be added for decorative icons adjacent to text.

**Fix:**
```tsx
<Button
  variant={showFavoritesOnly ? "default" : "outline"}
  size="sm"
  shape="pill"
  onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
>
  <Heart className={cn(showFavoritesOnly && "fill-current")} aria-hidden="true" />
  Favorites
</Button>
```

---

### Violation 3: Missing Loading State for Async Action (Lines 246-257)
**Rule:** D1/Critical Rule 10 - Loading States Required
**Issue:** When clicking a meal card to add it to the planner, there's a loading state (`addingMealId`) but the error case resets `addingMealId` to `null`, yet there's no success reset. The loading UX is handled via `opacity-50` on the card (line 119), which is acceptable but could be enhanced.

**Assessment:** This is **INFORMATIONAL** - the pattern is acceptable. The `addingMealId` is cleared implicitly when the dialog closes (via `onEntryCreated` callback likely closing the dialog). The `opacity-50 pointer-events-none` pattern (line 119) is compliant.

---

## Corrected Code Sections

### Line 141 - Fix favorite heart color:
```tsx
{meal.is_favorite && (
  <Heart className="h-4 w-4 text-error fill-error flex-shrink-0" aria-hidden="true" />
)}
```

### Line 300 - Add aria-hidden to decorative icon:
```tsx
<Heart className={cn(showFavoritesOnly && "fill-current")} aria-hidden="true" />
```

---

## Full Corrected MealCard Component (Lines 111-146)

```tsx
function MealCard({ meal, isAdding, onClick }: MealCardProps) {
  const sideCount = meal.side_recipes?.length ?? 0;

  return (
    <Card
      className={cn(
        "cursor-pointer overflow-hidden interactive-subtle",
        "p-0 gap-0",
        isAdding && "opacity-50 pointer-events-none"
      )}
      onClick={onClick}
    >
      <div className="flex items-center gap-3 p-3">
        <CircularImage
          src={meal.main_recipe?.reference_image_path ?? undefined}
          alt={meal.meal_name}
          size="lg"
          zoom={1.3}
        />
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-foreground line-clamp-1">
            {meal.meal_name}
          </h3>
          {sideCount > 0 && (
            <p className="text-xs text-muted-foreground">
              +{sideCount} side{sideCount !== 1 ? "s" : ""}
            </p>
          )}
        </div>
        {meal.is_favorite && (
          <Heart className="h-4 w-4 text-error fill-error flex-shrink-0" aria-hidden="true" />
        )}
      </div>
    </Card>
  );
}
```

---

## Full Corrected Favorites Button (Lines 293-303)

```tsx
{/* Favorites Toggle */}
<Button
  variant={showFavoritesOnly ? "default" : "outline"}
  size="sm"
  shape="pill"
  onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
>
  <Heart className={cn(showFavoritesOnly && "fill-current")} aria-hidden="true" />
  Favorites
</Button>
```

---

`Γÿà Insight ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ`
**Key Takeaways from this Audit:**
1. **Semantic color tokens matter** - Using `text-error` for favorites aligns with `--recipe-favorite` defined in globals.css, maintaining consistency across recipe-related components
2. **Decorative icons need `aria-hidden`** - Icons next to text labels should be hidden from screen readers to avoid redundant announcements
3. **The `interactive-subtle` utility** is a great pattern for clickable cards - it provides the lift-on-hover and press feedback defined in the design system
`ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ`

---

## Recommendations

| Priority | Action | Impact |
|----------|--------|--------|
| ≡ƒö┤ High | Change `text-destructive` to `text-error` on favorite icon | Semantic consistency |
| ≡ƒƒí Medium | Add `aria-hidden="true"` to Favorites button icon | Accessibility |
| ≡ƒƒó Low | None required | - |

**Overall Grade: A-** (Minor accessibility and token consistency issues)
