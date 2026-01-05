## Audit Summary for `label.tsx`

### Status: RESOLVED

All violations have been fixed.

### Violations Found & Fixed

| Rule | Status | Issue | Resolution |
|------|--------|-------|------------|
| Size Variants | ✅ Fixed | No `cva` variants for `default`, `sm`, `lg` | Added `cva` with size variants using design tokens |
| Typography | ✅ Fixed | Uses `leading-none` instead of design system line-height tokens | Now uses `--text-sm--line`, `--text-xs--line`, `--text-base--line` |
| Color Tokens | ✅ Fixed | No explicit semantic color (relies on inheritance) | Added explicit `text-foreground` |
| Disabled States | ✅ | Correctly handles `group-data-[disabled=true]` and `peer-disabled` | No changes needed |
| Font Weight | ✅ | Uses `font-medium` correctly | No changes needed |

### Changes Applied

1. **Added `cva` with size variants:**
   - `default`: `text-sm` with `--text-sm--line` line-height (14px/20px)
   - `sm`: `text-xs` with `--text-xs--line` line-height (12px/16px)
   - `lg`: `text-base` with `--text-base--line` line-height (16px/24px)

2. **Added explicit semantic color:** `text-foreground` for consistent color across container contexts

3. **Exported `labelVariants`** for external use with `cn()`

### Usage Examples

```tsx
// Default size (14px)
<Label>Email Address</Label>

// Small size for dense forms (12px)
<Label size="sm">Optional field</Label>

// Large size for prominent labels (16px)
<Label size="lg">Section Title</Label>

// Using labelVariants directly
import { labelVariants } from "@/components/ui/label"
<span className={cn(labelVariants({ size: "sm" }), "custom-class")}>Custom label</span>
```
