I'll analyze the `RecipeImage.tsx` file for design system compliance violations. Since this file is in `components/recipe/` (not `components/ui/`), I need to apply **Part A rules** (component usage).

## Scanning for Violations

Let me check the file against the design system rules:

**Rogue List:**

1. **Line 70-75: Fake Card Pattern (A1 Violation)** - `ImagePlaceholder` uses a raw `<div>` with background styling (`bg-gradient-to-br from-elevated via-hover to-elevated`) instead of using the `<Card>` component.

2. **Line 72: Hardcoded color tokens** - Uses `from-elevated via-hover to-elevated` which are valid tokens, but the entire placeholder div pattern could potentially use Card. However, looking more closely, this is a gradient placeholder for an image loading state - not a semantic "card" container. The `bg-gradient-to-br` pattern here is appropriate for a visual placeholder effect.

Let me re-examine more carefully:

- **Lines 70-75**: The `ImagePlaceholder` is a **visual placeholder element** (gradient background with icon) - not a content container. This is **NOT a violation** of A1 because it's not trying to be a card, it's a background fill for empty image states.

- **Line 79-81**: Uses semantic tokens (`text-muted-foreground`, `opacity-40`) - **Compliant**

- **Line 151**: Uses `absolute inset-0` with `placeholderClassName` - **Compliant**

- **Lines 159-165**: Standard image styling with transitions - **Compliant**

- **Lines 230-233**: Uses `bg-elevated` for the container background - **Compliant** (semantic token)

- **Line 246**: Uses `bg-gradient-to-t from-background via-background/40 to-transparent` - **Compliant** (semantic tokens)

Looking through the entire file again for Part A violations:
- **A1 (Fake Cards)**: No div is pretending to be a Card
- **A2 (Raw Buttons)**: No buttons in this file
- **A3 (Raw Badges)**: No badges in this file
- **A4 (Manual Sizing)**: No form elements
- **A5 (Redundant Interaction Classes)**: No base components with manual hover/transition
- **A6 (Token Standardization)**: All colors use semantic tokens (`elevated`, `hover`, `muted-foreground`, `background`, etc.)

## Summary

**Γ£à No violations found!**

This file is **fully compliant** with the design system rules:

`Γÿà Insight ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ`
1. **Context-appropriate patterns**: The `ImagePlaceholder` uses a gradient div intentionally - it's not a "fake card" but a visual background effect for empty/loading image states. Not every styled div is a card violation.

2. **Semantic tokens throughout**: The file consistently uses design tokens (`elevated`, `hover`, `muted-foreground`, `background`) rather than hardcoded colors like `gray-500`.

3. **Clean component composition**: The file exports three well-defined components (`RecipeImage`, `RecipeCardImage`, `RecipeHeroImage`) with clear purposes and appropriate prop interfaces.
`ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ`

The `RecipeImage.tsx` file follows the design system correctly - no fixes needed!
