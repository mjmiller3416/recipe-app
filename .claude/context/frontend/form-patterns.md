# Form Patterns

**Standard patterns for forms, inputs, and validation.**

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

**Required fields with asterisk:**
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

**Form with required fields note:**
```tsx
<form className="space-y-6">
  <p className="text-sm text-muted-foreground">
    Fields marked with <span className="text-destructive">*</span> are required
  </p>

  {/* Form fields */}
</form>
```

## Validation Display

**Error state:**
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

**Success state:**
```tsx
<div className="space-y-2">
  <Label htmlFor="name">Recipe Name</Label>
  <Input
    id="name"
    className={cn(isValid && "border-green-500")}
    value={name}
  />
  {isValid && (
    <p className="text-sm text-green-600">Looks good!</p>
  )}
</div>
```

## Textarea Fields

**Standard textarea:**
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

**Standard select:**
```tsx
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

<div className="space-y-2">
  <Label htmlFor="category">Category</Label>
  <Select value={category} onValueChange={setCategory}>
    <SelectTrigger id="category" className="h-10">
      <SelectValue placeholder="Select category" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="breakfast">Breakfast</SelectItem>
      <SelectItem value="lunch">Lunch</SelectItem>
      <SelectItem value="dinner">Dinner</SelectItem>
      <SelectItem value="dessert">Dessert</SelectItem>
    </SelectContent>
  </Select>
</div>
```

## Project-Specific Input Components

**QuantityInput** - For ingredient quantities (fractions, decimals, whole numbers)
See: `components/forms/QuantityInput.tsx`

**SmartIngredientInput** - Autocomplete for ingredient names
See: `components/forms/SmartIngredientInput.tsx`

## Form Submission

**Handle form submission with loading states** - See [component-patterns.md](.claude/context/frontend/component-patterns.md) for loading state patterns.

```tsx
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);
  try {
    await saveRecipe(formData);
  } catch (error) {
    // Handle error
  } finally {
    setIsLoading(false);
  }
};
```

## Form Validation Patterns

**Basic validation example:**
```tsx
const [errors, setErrors] = useState<Record<string, string>>({});

const validate = () => {
  const newErrors: Record<string, string> = {};

  if (!name.trim()) {
    newErrors.name = "Recipe name is required";
  }

  if (servings < 1) {
    newErrors.servings = "Servings must be at least 1";
  }

  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};

const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  if (!validate()) return;

  // Submit form
};
```