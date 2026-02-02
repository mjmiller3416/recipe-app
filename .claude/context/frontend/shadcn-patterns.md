# shadcn/ui Patterns

**When and how to use shadcn/ui components correctly.**

## When to Use Card vs Raw Div

**Always use `<Card>` for:**
- Content containers with visual separation
- Recipe cards, meal cards, stat cards
- Settings panels
- Form sections

**Never use:**
```tsx
// ❌ Wrong - fake card
<div className="bg-card border border-border rounded-xl p-4">
```

**Always use:**
```tsx
// ✅ Right - real Card component
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>Content here</CardContent>
</Card>
```

## Button Variants and Sizes

**Variants:**
- `default` — Primary actions (save, submit, add)
- `secondary` — Secondary actions (cancel, back)
- `outline` — Tertiary actions, filters
- `ghost` — Subtle actions, icon buttons in headers
- `destructive` — Delete, remove, clear
- `link` — Text links with button behavior

**Sizes:**
- `sm` — Small buttons, compact UI
- `default` — Standard buttons (40px height)
- `lg` — Large buttons, CTAs
- `icon` — Icon-only buttons (see accessibility.md for aria-label requirements)

**Examples:**
```tsx
<Button variant="default">Save Recipe</Button>
<Button variant="outline" size="sm">Filter</Button>
```

## Badge Usage Patterns

**Variants:**
- `default` — General purpose
- `secondary` — Less emphasis
- `outline` — Subtle emphasis
- `destructive` — Errors, warnings

**Recipe-specific badges:**
```tsx
// Use semantic tokens for recipe badges
<Badge className="bg-recipe-category-bg text-recipe-category-text">
  {recipe.category}
</Badge>

<Badge className="bg-recipe-meal-type-bg text-recipe-meal-type-text">
  {recipe.mealType}
</Badge>

<Badge className="bg-recipe-dietary-bg text-recipe-dietary-text">
  {dietary}
</Badge>
```

## Input, Select, Textarea Components

**Always use with Label:**
```tsx
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

<div className="space-y-2">
  <Label htmlFor="name">Recipe Name</Label>
  <Input id="name" placeholder="Enter name" />
</div>
```

**Select pattern:**
```tsx
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

<Select value={value} onValueChange={setValue}>
  <SelectTrigger className="h-10">
    <SelectValue placeholder="Select category" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="breakfast">Breakfast</SelectItem>
    <SelectItem value="lunch">Lunch</SelectItem>
  </SelectContent>
</Select>
```

**Textarea pattern:**
```tsx
import { Textarea } from "@/components/ui/textarea";

<Textarea
  placeholder="Enter directions"
  rows={4}
  className="resize-none"
/>
```

## Dialog Patterns

```tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

<Dialog open={open} onOpenChange={setOpen}>
  <DialogTrigger asChild>
    <Button>Open Dialog</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Dialog Title</DialogTitle>
    </DialogHeader>
    {/* Content */}
  </DialogContent>
</Dialog>
```

## Adding New shadcn Components

**Command:**
```bash
npx shadcn@latest add button dialog card
```

**Important:**
- Components install to `components/ui/`
- **Never modify files in `components/ui/`** directly
- If you need customization, create a wrapper component
- Example: `components/common/CustomButton.tsx` wraps `ui/button.tsx`

## Common Mistakes

❌ **Don't:**
- Modify `components/ui/*` files
- Create fake versions of shadcn components
- Use raw HTML instead of shadcn components
- Use non-lucide icons

✅ **Do:**
- Use shadcn components as-is
- Extend with wrapper components if needed
- Follow shadcn composition patterns
- Check shadcn docs for component APIs