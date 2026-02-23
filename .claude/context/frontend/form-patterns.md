# Form Patterns

Project-specific form field patterns. All fields use shadcn/ui primitives with semantic tokens.

## Form Field Structure

**Basic field with label:**
```tsx
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

<div className="space-y-2">
  <Label htmlFor="recipe-name">Recipe Name</Label>
  <Input
    id="recipe-name"
    placeholder="Enter recipe name"
    value={name}
    onChange={(e) => setName(e.target.value)}
  />
</div>
```

**Field with helper text:**
```tsx
<div className="space-y-2">
  <Label htmlFor="servings">Servings</Label>
  <Input
    id="servings"
    type="number"
    min="1"
    value={servings}
    onChange={(e) => setServings(e.target.value)}
  />
  <p className="text-sm text-muted-foreground">
    Number of people this recipe serves
  </p>
</div>
```

## Required Field Indicators

```tsx
<div className="space-y-2">
  <Label htmlFor="name">
    Recipe Name <span className="text-destructive">*</span>
  </Label>
  <Input
    id="name"
    required
    placeholder="Enter recipe name"
  />
</div>
```

**Optional "required fields" note at top of form:**
```tsx
<p className="text-sm text-muted-foreground">
  Fields marked with <span className="text-destructive">*</span> are required
</p>
```

## Error State Display

Use `border-destructive` and `text-destructive` -- never hardcoded colors.

```tsx
<div className="space-y-2">
  <Label htmlFor="name">
    Recipe Name <span className="text-destructive">*</span>
  </Label>
  <Input
    id="name"
    className={cn(error && "border-destructive")}
    value={name}
    onChange={(e) => setName(e.target.value)}
  />
  {error && (
    <p className="text-sm text-destructive">{error}</p>
  )}
</div>
```

## Textarea Fields

Always use `resize-none` on Textarea.

```tsx
import { Textarea } from "@/components/ui/textarea";

<div className="space-y-2">
  <Label htmlFor="directions">
    Directions <span className="text-destructive">*</span>
  </Label>
  <Textarea
    id="directions"
    placeholder="Enter cooking directions..."
    rows={6}
    className="resize-none"
    value={directions}
    onChange={(e) => setDirections(e.target.value)}
  />
  <p className="text-sm text-muted-foreground">
    Separate steps with line breaks
  </p>
</div>
```

## Select Fields

See shadcn-patterns.md for Select component usage.

## Project-Specific Input Components

**QuantityInput** -- For ingredient quantities (fractions, decimals, whole numbers).
Path: `components/forms/QuantityInput.tsx`

**IngredientAutocomplete** -- Autocomplete for ingredient names.
Path: `components/forms/IngredientAutocomplete.tsx`

## Form Submission

See component-patterns.md for loading state patterns on submit buttons.
