# Component Patterns

## Icon Buttons

Icon buttons MUST have `aria-label`. See accessibility.md for detailed patterns.

- `size="icon"` + `size-4` icon — Standard (40px)
- `size="icon"` + `size-3` icon — Compact
- `size="icon"` + `size-5` icon — Prominent

## Icon + Text Layouts

```tsx
import { Clock, Plus } from "lucide-react";

// Info display
<div className="flex items-center gap-2">
  <Clock className="size-4 text-muted-foreground" strokeWidth={1.5} />
  <span className="text-sm">30 minutes</span>
</div>

// Button with icon
<Button>
  <Plus className="size-4 mr-2" strokeWidth={1.5} />
  Add Recipe
</Button>
```

## Empty States

```tsx
<div className="flex flex-col items-center justify-center py-12 text-center">
  <div className="rounded-full bg-muted p-4 mb-4">
    <FileX className="size-8 text-muted-foreground" strokeWidth={1.5} />
  </div>
  <h3 className="text-lg font-semibold">No recipes found</h3>
  <p className="text-sm text-muted-foreground mt-1 mb-4">
    Try adjusting your filters or search terms
  </p>
  <Button>
    <Plus className="size-4 mr-2" strokeWidth={1.5} />
    Add Recipe
  </Button>
</div>
```

Contextual icons: FileX (no results), Package (empty list), Calendar (no plans).

## Loading States

**Button loading (REQUIRED for async actions):**
```tsx
<Button disabled={isLoading}>
  {isLoading ? (
    <>
      <Loader2 className="size-4 mr-2 animate-spin" />
      Saving...
    </>
  ) : (
    "Save Recipe"
  )}
</Button>
```

**Full-page loading:**
```tsx
<div className="flex items-center justify-center py-12">
  <Loader2 className="size-8 animate-spin text-muted-foreground" strokeWidth={1.5} />
</div>
```

**Inline loading:**
```tsx
<div className="flex items-center gap-2">
  <Loader2 className="size-4 animate-spin" strokeWidth={1.5} />
  <span className="text-sm text-muted-foreground">Loading recipes...</span>
</div>
```

## Conditional Classes with cn()

```tsx
import { cn } from "@/lib/utils";

<Card className={cn(
  "interactive cursor-pointer",
  isSelected && "ring-2 ring-primary",
  isDisabled && "opacity-50 cursor-not-allowed"
)}>
```

## Card with Header Actions

Use `CardAction` for header action buttons (not manual flex layout on CardHeader):
```tsx
<Card>
  <CardHeader>
    <CardTitle>Recipe Name</CardTitle>
    <CardAction>
      <Button size="icon" variant="ghost" aria-label="Edit recipe">
        <Edit className="size-4" strokeWidth={1.5} />
      </Button>
    </CardAction>
  </CardHeader>
  <CardContent>Content here</CardContent>
</Card>
```
