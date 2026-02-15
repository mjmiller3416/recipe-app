# Accessibility (a11y)

**ARIA labels, keyboard navigation, and screen reader support.**

## ARIA Labels on Icon Buttons (CRITICAL)

**Every icon-only button MUST have aria-label with specific, descriptive context:**

```tsx
import { X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

// CORRECT - descriptive aria-label
<Button size="icon" variant="ghost" aria-label="Close dialog">
  <X className="size-4" strokeWidth={1.5} />
</Button>

<Button size="icon" variant="destructive" aria-label="Delete recipe">
  <Trash2 className="size-4" strokeWidth={1.5} />
</Button>

// WRONG - missing aria-label
<Button size="icon">
  <X className="size-4" strokeWidth={1.5} />
</Button>
```

Use specific labels: "Delete recipe" not "Delete", "Close dialog" not "Close".

## Form Labeling

All form inputs MUST have `<Label htmlFor>`. See form-patterns.md for standard field patterns.

For helper text, use `aria-describedby` linking to the helper element's `id`.

## Keyboard Navigation for Custom Interactive Elements

**When using a div as an interactive element (instead of `<button>` or `<a>`):**

```tsx
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

Prefer `<Button>` over this pattern whenever possible.

## Focus Management

shadcn Dialog/Sheet/Popover handle focus trapping automatically. Do not add custom focus management for these.

shadcn components include `focus-visible` ring styles. Do not override them.

## Screen Reader Considerations

**Visually hidden text:**
```tsx
<span className="sr-only">Loading recipes...</span>
```

**Live regions for dynamic announcements:**
```tsx
<div role="alert" aria-live="assertive">
  {error && <p className="text-destructive">{error}</p>}
</div>
```

**Descriptive link text:** Use "View Chocolate Cake recipe" not "Click here".

## Semantic HTML

Use semantic elements (`<nav>`, `<main>`, `<article>`, `<section>`, `<h1>`-`<h6>`) instead of generic `<div>`. Screen readers rely on proper document structure.

## Alt Text for Images

```tsx
import Image from "next/image";

// Meaningful alt text
<Image
  src={recipe.imageUrl}
  alt={`${recipe.name} - ${recipe.category} recipe`}
  width={400}
  height={300}
/>

// Decorative images
<Image
  src="/decorative-pattern.png"
  alt=""
  aria-hidden="true"
  width={100}
  height={100}
/>
```

## Loading States

Loading states must be accessible. See component-patterns.md for spinner patterns.
Add `<span className="sr-only">` for screen reader announcements alongside visual spinners.

## Disabled States

Use `disabled` prop on `<Button>` (automatically sets `aria-disabled`).
For custom elements, add `aria-disabled="true"` and `opacity-50 cursor-not-allowed`.

## Checklist

Before completing UI work, verify:

- [ ] All icon buttons have descriptive aria-label
- [ ] All form inputs have Label with htmlFor
- [ ] Custom interactive elements have role, tabIndex, and keyboard handlers
- [ ] Images have descriptive alt text (or `alt=""` + `aria-hidden` if decorative)
- [ ] Loading/error states announced to screen readers (sr-only or aria-live)
- [ ] Semantic HTML used for document structure
- [ ] Color is not the only way to convey information
