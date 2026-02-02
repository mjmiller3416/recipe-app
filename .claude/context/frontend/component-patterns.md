# Component Patterns

**Common React component patterns and templates.**

## Icon Buttons (CRITICAL)

**Icon buttons MUST have aria-label** - See [accessibility.md](.claude/context/frontend/accessibility.md) for detailed patterns.

**Icon button sizes:**
- `size="icon"` with `size-4` icon — Standard (40px)
- `size="icon"` with `size-3` icon — Compact
- `size="icon"` with `size-5` icon — Prominent

## Icon + Text Layouts

**Standard patterns:**
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

**Standard empty state pattern:**
```tsx
import { FileX, Package, Calendar } from "lucide-react";

<div className="flex flex-col items-center justify-center py-12 text-center">
  {/* Icon in circle background */}
  <div className="rounded-full bg-muted p-4 mb-4">
    <FileX className="size-8 text-muted-foreground" strokeWidth={1.5} />
  </div>

  {/* Heading */}
  <h3 className="text-lg font-semibold">No recipes found</h3>

  {/* Description */}
  <p className="text-sm text-muted-foreground mt-1 mb-4">
    Try adjusting your filters or search terms
  </p>

  {/* Action button */}
  <Button>
    <Plus className="size-4 mr-2" strokeWidth={1.5} />
    Add Recipe
  </Button>
</div>
```

**Variants:**
```tsx
// Empty list (no results)
<FileX /> + "No recipes found"

// Empty shopping list
<Package /> + "Shopping list is empty"

// Empty meal planner
<Calendar /> + "No meals planned"
```

## Loading States

**Button loading state (REQUIRED for async actions):**
```tsx
import { Loader2 } from "lucide-react";

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

// Or with separate states
<Button disabled={isLoading}>
  {isLoading && <Loader2 className="size-4 mr-2 animate-spin" />}
  {isLoading ? "Saving..." : "Save Recipe"}
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

## Conditional Rendering with cn()

**Conditional classes:**
```tsx
import { cn } from "@/lib/utils";

<Card className={cn(
  "interactive cursor-pointer",
  isSelected && "ring-2 ring-primary",
  isDisabled && "opacity-50 cursor-not-allowed"
)}>
```

**Conditional variants:**
```tsx
<Badge variant={isDietary ? "default" : "secondary"}>
  {tag}
</Badge>

<Button
  variant={isDestructive ? "destructive" : "outline"}
  size={isCompact ? "sm" : "default"}
>
  {label}
</Button>
```

## Common Composition Patterns

**Card with header actions:**
```tsx
<Card>
  <CardHeader className="flex flex-row items-center justify-between space-y-0">
    <CardTitle>Recipe Name</CardTitle>
    <Button size="icon" variant="ghost" aria-label="Edit">
      <Edit className="size-4" strokeWidth={1.5} />
    </Button>
  </CardHeader>
  <CardContent>Content here</CardContent>
</Card>
```