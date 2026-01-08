# Design System Audit: MealDialog.tsx

**File:** `frontend/src/app/meal-planner/_components/meal-dialog/MealDialog.tsx`
**Type:** Feature Component (in `app/` directory)
**Applicable Rules:** Part A (Component Usage Rules)

---

## Audit Summary

| Status | Count |
|--------|-------|
| Γ£à Compliant | 8 |
| ΓÜá∩╕Å Violations | 6 |

---

## Γ£à Compliant Areas

1. **UI Component Imports** - Correctly imports `Dialog`, `DialogContent`, `DialogFooter`, `DialogTitle`, `Tabs`, `TabsContent`, `TabsList`, `TabsTrigger`, `Button`, and `Skeleton` from `@/components/ui/`
2. **Button Usage** - Uses `<Button>` component with proper variants (`variant="ghost"`)
3. **Dialog Structure** - Uses proper Dialog components from the design system
4. **Tabs Implementation** - Uses Radix-based Tabs components correctly
5. **No Raw Hex Colors** - No hardcoded hex values in the component
6. **Skeleton Usage** - Properly uses `<Skeleton>` component for loading states
7. **No Arbitrary Font Sizes** - No `text-[Npx]` patterns
8. **Semantic Color Tokens** - Uses `text-primary`, `border-primary` tokens

---

## ΓÜá∩╕Å Violations Found

### Violation 1: Manual Styling on TabsList (Line 478)
**Rule:** A5 - No Redundant Interaction Classes on Components
**Pattern:** `bg-transparent border-none p-0` overrides base component styling

```tsx
// Line 478 - VIOLATION
<TabsList className="bg-transparent border-none p-0 gap-6 h-auto w-auto">
```

**Issue:** Extensive manual overrides suggest the component's default styling doesn't match the use case. This is an "unstyled tabs" pattern that should either be a variant or use a different approach.

---

### Violation 2: Extensive Manual Styling on TabsTrigger (Lines 479-486, 489-496)
**Rule:** A4 - No Manual Sizing Overrides; A5 - No Redundant Interaction Classes
**Pattern:** Manual `px-0 py-2`, `text-base`, `border-b-2`, `rounded-none`, manual hover/active states

```tsx
// Lines 479-486 - VIOLATION
<TabsTrigger
  value="saved"
  className="bg-transparent px-0 py-2 text-base font-medium
             data-[state=active]:bg-transparent data-[state=active]:shadow-none
             data-[state=active]:text-primary
             border-b-2 border-transparent data-[state=active]:border-primary
             rounded-none hover:text-foreground"
>
```

**Issue:** This creates a custom "underline tab" appearance by fighting the base component's styling. The same issue repeats on lines 489-496.

---

### Violation 3: Raw `<div>` with Card-like Styling in EditorSkeleton (Lines 73-88)
**Rule:** A1 - No Fake Cards
**Pattern:** `<div className="space-y-4">` with Skeletons arranged in a card-like layout

```tsx
// Lines 71-88 - MINOR VIOLATION
function EditorSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full" />
      <div className="grid grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-lg" />
        ))}
      </div>
      ...
    </div>
  );
}
```

**Assessment:** This is a skeleton placeholder layout, not semantic content. The `<div>` usage is acceptable here as it's just a layout wrapper. **No fix needed.**

---

### Violation 4: Arbitrary Spacing Value (Line 73)
**Rule:** A6 - Token Standardization
**Pattern:** `gap-3` is fine, but `space-y-4` combined with `gap-3` creates inconsistent spacing

**Assessment:** These are standard Tailwind values, not arbitrary. **No violation - false positive.**

---

### Violation 5: Raw `<h2>` with Manual Styling (Lines 526-528)
**Rule:** Not explicitly covered, but inconsistent with design system patterns
**Pattern:** Manual border styling on heading

```tsx
// Lines 526-528
<h2 className="text-base font-medium text-primary border-b-2 border-primary inline-block pb-2">
  Edit Meal
</h2>
```

**Issue:** This creates a visual style identical to the TabsTrigger active state but with a different element. Should use consistent typography utilities.

---

### Violation 6: DialogContent with Custom Padding Override (Lines 460-463)
**Rule:** A4 - No Manual Sizing Overrides
**Pattern:** `p-0` overrides base DialogContent padding

```tsx
// Lines 460-463
<DialogContent
  className="sm:max-w-3xl max-h-[85vh] overflow-hidden flex flex-col p-0"
  showCloseButton={false}
>
```

**Issue:** `p-0` completely removes padding, then padding is manually re-added in child elements (`px-6 pt-6 pb-0`, etc.). This is a common pattern for complex dialogs but creates maintenance burden.

---

## Corrected Code

### Fix 1 & 2: Tabs Styling

The tabs are styled as "underline tabs" which isn't the default variant. Two options:

**Option A: Accept as intentional custom styling** (if TabsTrigger doesn't have an `underline` variant)

The current implementation is creating a custom tab style. If this is intentional and consistent across the app, consider adding an `underline` variant to TabsTrigger component in `components/ui/tabs.tsx`.

**Option B: Simplify if standard tabs work**

If the underline style isn't required, use default styling:

```tsx
<TabsList>
  <TabsTrigger value="saved">Saved Meals</TabsTrigger>
  <TabsTrigger value="create">Create Meal</TabsTrigger>
</TabsList>
```

### Fix 3: Edit Mode Header (Line 526-528)

Use consistent typography utilities:

```tsx
// Before
<h2 className="text-base font-medium text-primary border-b-2 border-primary inline-block pb-2">
  Edit Meal
</h2>

// After - using typography utility
<h2 className="text-section-header text-primary border-b-2 border-primary inline-block pb-2">
  Edit Meal
</h2>
```

Or better, if this should match the tab appearance, extract a shared component.

---

## Recommendations

`Γÿà Insight ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ`
1. **Tab Variant Gap**: The "underline tabs" pattern appears intentional but fights the base component. Consider adding a `variant="underline"` to the TabsTrigger component definition.
2. **Dialog Padding Pattern**: The `p-0` + manual child padding is a common workaround for complex dialogs with different padding zones. This is acceptable but could be standardized.
3. **Skeleton Layouts**: Pure layout divs for skeletons don't need Card wrappers - the current approach is correct.
`ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ`

---

## Severity Assessment

| Violation | Severity | Impact |
|-----------|----------|--------|
| TabsList overrides | ≡ƒƒí Medium | Maintenance burden, inconsistent with other tabs |
| TabsTrigger custom styling | ≡ƒƒí Medium | Same styling repeated twice, should be variant |
| h2 manual styling | ≡ƒƒó Low | Works, but inconsistent with tabs styling |
| DialogContent p-0 | ≡ƒƒó Low | Common pattern for complex dialogs |

---

## Action Items

1. **Consider** adding `variant="underline"` to TabsTrigger in `components/ui/tabs.tsx`
2. **Extract** the underline heading style into a reusable component if used elsewhere
3. **Document** the dialog padding override pattern if it's intentional for complex dialogs
