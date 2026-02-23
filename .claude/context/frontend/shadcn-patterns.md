# shadcn/ui Patterns

## Card

**Always use `<Card>` instead of styled divs for content containers.**

```tsx
import { Card, CardHeader, CardTitle, CardContent, CardAction } from "@/components/ui/card";

// ❌ <div className="bg-card border border-border rounded-xl p-4">
// ✅
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardAction><Button size="icon" aria-label="Edit"><Pencil /></Button></CardAction>
  </CardHeader>
  <CardContent>Content</CardContent>
</Card>
```

**Props:**
- `size`: `"sm"` | `"default"` | `"lg"`
- `interactive`: boolean — adds hover/focus/active states for clickable cards

**GOTCHA: Card applies `flex-col` by default. Add `flex-row` explicitly for horizontal layouts.**

## Button

**Variants:** `default`, `secondary`, `outline`, `ghost`, `destructive`, `link`, `dashed`

**Sizes:** `sm`, `default`, `lg`, `icon`, `icon-sm`, `icon-lg`

**Shape prop:** `shape="default"` (rounded-lg) | `shape="pill"` (rounded-full)

```tsx
<Button variant="default">Save Recipe</Button>
<Button variant="outline" size="sm">Filter</Button>
<Button variant="dashed" shape="pill">+ Add Item</Button>
<Button size="icon" aria-label="Close"><X strokeWidth={1.5} /></Button>
```

## Badge

**Variants:** `default`, `secondary`, `outline`, `destructive`, `success`, `warning`, `info`, `muted`

**Recipe-specific badges use semantic tokens:**
```tsx
<Badge className="bg-recipe-category-bg text-recipe-category-text">{recipe.category}</Badge>
<Badge className="bg-recipe-meal-type-bg text-recipe-meal-type-text">{recipe.mealType}</Badge>
<Badge className="bg-recipe-dietary-bg text-recipe-dietary-text">{dietary}</Badge>
```

## Form Components

See `form-patterns.md` for Input/Select/Textarea patterns.

## Dialog

```tsx
<Dialog open={open} onOpenChange={setOpen}>
  <DialogTrigger asChild><Button>Open</Button></DialogTrigger>
  <DialogContent>
    <DialogHeader><DialogTitle>Title</DialogTitle></DialogHeader>
    {/* Content */}
  </DialogContent>
</Dialog>
```

## Adding shadcn Components

```bash
npx shadcn@latest add <name>
```

Never modify `components/ui/` directly -- create wrappers in `components/common/` if needed.
