# Accessibility (a11y)

**ARIA labels, keyboard navigation, and screen reader support.**

## ARIA Labels Required on Icon Buttons (CRITICAL)

**Icon-only buttons MUST have aria-label with descriptive context:**

```tsx
import { X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

// ✅ Correct - descriptive aria-label
<Button size="icon" variant="ghost" aria-label="Close dialog">
  <X className="size-4" strokeWidth={1.5} />
</Button>

<Button size="icon" variant="destructive" aria-label="Delete recipe">
  <Trash2 className="size-4" strokeWidth={1.5} />
</Button>

// ❌ Wrong - missing aria-label
<Button size="icon">
  <X className="size-4" strokeWidth={1.5} />
</Button>
```

Use specific labels like "Delete recipe" (not just "Delete"), "Close dialog" (not just "Close").

## Form Labeling (htmlFor Attributes)

**All form inputs MUST have associated labels:**

```tsx
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

// ✅ Correct - Label with htmlFor
<div className="space-y-2">
  <Label htmlFor="recipe-name">Recipe Name</Label>
  <Input
    id="recipe-name"
    placeholder="Enter recipe name"
  />
</div>

// ❌ Wrong - no htmlFor or id
<div className="space-y-2">
  <Label>Recipe Name</Label>
  <Input placeholder="Enter recipe name" />
</div>
```

**Required field indicators:**
```tsx
<Label htmlFor="name">
  Recipe Name <span className="text-destructive">*</span>
</Label>
```

**Helper text with aria-describedby:**
```tsx
<div className="space-y-2">
  <Label htmlFor="servings">Servings</Label>
  <Input
    id="servings"
    aria-describedby="servings-help"
  />
  <p id="servings-help" className="text-sm text-muted-foreground">
    Number of people this recipe serves
  </p>
</div>
```

## Keyboard Navigation

**Interactive elements must be keyboard accessible:**

**Custom interactive elements:**
```tsx
// Make divs keyboard accessible
<div
  role="button"
  tabIndex={0}
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick();
    }
  }}
  className="cursor-pointer"
>
  Clickable content
</div>
```

## Focus Management

**Dialog focus management:**
```tsx
import { Dialog, DialogContent } from "@/components/ui/dialog";

// shadcn Dialog handles focus automatically
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    {/* Focus is trapped inside dialog */}
  </DialogContent>
</Dialog>
```

**Focus visible styles:**
```tsx
// Ensure focus is visible (shadcn components have this built-in)
<Button className="focus-visible:ring-2 focus-visible:ring-primary">
  Button
</Button>
```

## Screen Reader Considerations

**Visually hidden text (sr-only) or aria-label:**
```tsx
<button aria-label="Close dialog">
  <X className="size-4" />
</button>
```

**Live regions for announcements:**
```tsx
// Announce form errors
<div role="alert" aria-live="assertive">
  {error && <p className="text-destructive">{error}</p>}
</div>
```

**Use descriptive link text** ("View Chocolate Cake recipe" not "Click here")

## Semantic HTML

**Use semantic elements** (`<nav>`, `<main>`, `<article>`, `<section>`, `<h1>`-`<h6>`) instead of generic `<div>` elements. Screen readers rely on proper document structure.

## Alt Text for Images

**Meaningful alt text:**
```tsx
import Image from "next/image";

// ✅ Descriptive alt text
<Image
  src={recipe.imageUrl}
  alt={`${recipe.name} - ${recipe.category} recipe`}
  width={400}
  height={300}
/>

// For decorative images
<Image
  src="/decorative-pattern.png"
  alt=""
  aria-hidden="true"
  width={100}
  height={100}
/>
```

## Loading States

**Accessible loading indicators:**
```tsx
import { Loader2 } from "lucide-react";

// Screen reader announcement
<div className="flex items-center gap-2">
  <Loader2 className="size-4 animate-spin" />
  <span className="sr-only">Loading recipes...</span>
  <span aria-hidden="true" className="text-sm text-muted-foreground">
    Loading...
  </span>
</div>

// Button loading state
<Button disabled={isLoading}>
  {isLoading && (
    <>
      <Loader2 className="size-4 mr-2 animate-spin" />
      <span className="sr-only">Saving recipe...</span>
    </>
  )}
  {isLoading ? "Saving..." : "Save Recipe"}
</Button>
```

## Disabled States

**Communicate disabled state:**
```tsx
// Disabled button (automatically has aria-disabled)
<Button disabled>Cannot Submit</Button>

// Custom disabled element
<div
  role="button"
  aria-disabled="true"
  className="opacity-50 cursor-not-allowed"
>
  Disabled action
</div>
```

## Common Accessibility Violations

❌ **Don't:**
- Icon buttons without aria-label
- Form inputs without labels
- Clickable divs without role/keyboard handling
- Missing alt text on images
- Low contrast text
- Focus states removed

✅ **Do:**
- Add aria-label to icon buttons
- Use Label with htmlFor for all inputs
- Use semantic HTML (button, nav, main, etc.)
- Provide descriptive alt text
- Use semantic tokens (contrast guaranteed)
- Keep focus visible styles

## Testing Checklist

Before completing UI work:

- [ ] All icon buttons have aria-label
- [ ] All form inputs have Label with htmlFor
- [ ] Interactive elements are keyboard accessible (Tab, Enter, Space)
- [ ] Focus is visible on all interactive elements
- [ ] Screen reader can understand the page structure
- [ ] Images have descriptive alt text
- [ ] Loading states are announced to screen readers
- [ ] Color is not the only way to convey information