# Component Usage Patterns

> Correct usage patterns for shadcn/ui and custom components in Meal Genie.

## Buttons

### Basic Button Variants

```tsx
import { Button } from "@/components/ui/button";

// Primary action
<Button>Save Recipe</Button>

// Secondary action
<Button variant="secondary">Cancel</Button>

// Subtle/ghost action
<Button variant="ghost">View Details</Button>

// Outline
<Button variant="outline">Export</Button>

// Destructive
<Button variant="destructive">Delete</Button>

// Link style
<Button variant="link">Learn more</Button>
```

### Button Sizes

```tsx
// Small (32px) - dense UI, tables
<Button size="sm">Add</Button>

// Default (40px) - standard forms
<Button>Submit</Button>

// Large (48px) - hero CTAs
<Button size="lg">Get Started</Button>
```

### Icon Buttons

```tsx
import { Plus, X, Settings } from "lucide-react";

// Icon-only button (MUST have aria-label)
<Button size="icon" variant="ghost" aria-label="Add item">
  <Plus className="size-4" strokeWidth={1.5} />
</Button>

// Icon with text
<Button>
  <Plus className="size-4 mr-2" strokeWidth={1.5} />
  Add Recipe
</Button>
```

### Loading State

```tsx
import { Loader2 } from "lucide-react";

<Button disabled>
  <Loader2 className="size-4 mr-2 animate-spin" />
  Saving...
</Button>
```

---

## Cards

### Basic Card

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";

// Simple card with padding
<Card className="p-4">
  Content here
</Card>

// Full structured card
<Card>
  <CardHeader>
    <CardTitle>Recipe Title</CardTitle>
    <CardDescription>A delicious meal</CardDescription>
  </CardHeader>
  <CardContent>
    Main content here
  </CardContent>
  <CardFooter>
    <Button>Save</Button>
  </CardFooter>
</Card>
```

### Interactive Card

```tsx
// Clickable card with lift effect
<Card className="interactive cursor-pointer">
  <CardContent className="p-4">
    Click me
  </CardContent>
</Card>

// Subtle interaction for smaller cards
<Card className="interactive-subtle cursor-pointer">
  <CardContent className="p-3">
    Small card
  </CardContent>
</Card>
```

### Card with Image

```tsx
<Card className="overflow-hidden">
  <div className="image-zoom-wrapper aspect-video">
    <img src={imageUrl} alt={title} className="object-cover w-full h-full" />
  </div>
  <CardContent className="p-4">
    <CardTitle>{title}</CardTitle>
  </CardContent>
</Card>
```

---

## Badges

### Badge Variants

```tsx
import { Badge } from "@/components/ui/badge";

// Default (primary)
<Badge>Category</Badge>

// Secondary
<Badge variant="secondary">Tag</Badge>

// Outline
<Badge variant="outline">Status</Badge>

// Destructive
<Badge variant="destructive">Error</Badge>
```

### Recipe-Specific Badges

```tsx
// Category badge (purple)
<Badge className="bg-recipe-category-bg text-recipe-category-text">
  Italian
</Badge>

// Meal type badge (teal)
<Badge className="bg-recipe-meal-type-bg text-recipe-meal-type-text">
  Dinner
</Badge>

// Dietary badge (neutral)
<Badge className="bg-recipe-dietary-bg text-recipe-dietary-text">
  Vegetarian
</Badge>
```

---

## Form Inputs

### Text Input

```tsx
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

<div className="space-y-2">
  <Label htmlFor="name">
    Recipe Name <span className="text-destructive">*</span>
  </Label>
  <Input
    id="name"
    placeholder="Enter recipe name"
  />
  <p className="text-sm text-muted-foreground">
    Give your recipe a descriptive name
  </p>
</div>
```

### Input with Icon

```tsx
import { Search } from "lucide-react";

<div className="relative">
  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
  <Input className="pl-10" placeholder="Search recipes..." />
</div>
```

### Textarea

```tsx
import { Textarea } from "@/components/ui/textarea";

<div className="space-y-2">
  <Label htmlFor="description">Description</Label>
  <Textarea
    id="description"
    placeholder="Describe your recipe..."
    className="min-h-[100px]"
  />
</div>
```

### Select

```tsx
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

<div className="space-y-2">
  <Label>Category</Label>
  <Select>
    <SelectTrigger>
      <SelectValue placeholder="Select category" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="italian">Italian</SelectItem>
      <SelectItem value="mexican">Mexican</SelectItem>
      <SelectItem value="asian">Asian</SelectItem>
    </SelectContent>
  </Select>
</div>
```

### Checkbox

```tsx
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

<div className="flex items-center gap-2">
  <Checkbox id="favorite" />
  <Label htmlFor="favorite" className="cursor-pointer">
    Mark as favorite
  </Label>
</div>
```

### Switch

```tsx
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

<div className="flex items-center justify-between">
  <Label htmlFor="notifications">Enable notifications</Label>
  <Switch id="notifications" />
</div>
```

---

## Dialogs & Modals

### Basic Dialog

```tsx
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

<Dialog>
  <DialogTrigger asChild>
    <Button>Open Dialog</Button>
  </DialogTrigger>
  <DialogContent className="max-w-[500px]">
    <DialogHeader>
      <DialogTitle>Edit Recipe</DialogTitle>
      <DialogDescription>
        Make changes to your recipe here.
      </DialogDescription>
    </DialogHeader>

    {/* Form content */}
    <div className="space-y-4 py-4">
      <Input placeholder="Recipe name" />
    </div>

    <DialogFooter>
      <Button variant="outline">Cancel</Button>
      <Button>Save changes</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Confirmation Dialog

```tsx
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="destructive">Delete</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
      <AlertDialogDescription>
        This action cannot be undone. This will permanently delete the recipe.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction className="bg-destructive text-destructive-foreground">
        Delete
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

---

## Dropdowns & Menus

```tsx
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Trash, Share } from "lucide-react";

<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="icon" aria-label="More options">
      <MoreHorizontal className="size-4" strokeWidth={1.5} />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    <DropdownMenuLabel>Actions</DropdownMenuLabel>
    <DropdownMenuSeparator />
    <DropdownMenuItem>
      <Edit className="size-4 mr-2" strokeWidth={1.5} />
      Edit
    </DropdownMenuItem>
    <DropdownMenuItem>
      <Share className="size-4 mr-2" strokeWidth={1.5} />
      Share
    </DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem className="text-destructive">
      <Trash className="size-4 mr-2" strokeWidth={1.5} />
      Delete
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

---

## Tabs

```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

<Tabs defaultValue="ingredients">
  <TabsList>
    <TabsTrigger value="ingredients">Ingredients</TabsTrigger>
    <TabsTrigger value="directions">Directions</TabsTrigger>
    <TabsTrigger value="nutrition">Nutrition</TabsTrigger>
  </TabsList>
  <TabsContent value="ingredients">
    Ingredients list...
  </TabsContent>
  <TabsContent value="directions">
    Step by step...
  </TabsContent>
  <TabsContent value="nutrition">
    Nutrition info...
  </TabsContent>
</Tabs>
```

---

## Loading States

### Skeleton

```tsx
import { Skeleton } from "@/components/ui/skeleton";

// Text skeleton
<Skeleton className="h-4 w-[200px]" />

// Card skeleton
<Card>
  <Skeleton className="aspect-video w-full" />
  <CardContent className="p-4 space-y-2">
    <Skeleton className="h-5 w-3/4" />
    <Skeleton className="h-4 w-1/2" />
  </CardContent>
</Card>
```

### Spinner

```tsx
import { Loader2 } from "lucide-react";

// Inline spinner
<Loader2 className="size-4 animate-spin" />

// Page/section loading
<div className="flex items-center justify-center py-12">
  <Loader2 className="size-8 animate-spin text-muted-foreground" />
</div>
```

---

## Empty States

```tsx
import { FileX } from "lucide-react";

<div className="flex flex-col items-center justify-center py-12 text-center">
  <div className="rounded-full bg-muted p-4 mb-4">
    <FileX className="size-8 text-muted-foreground" strokeWidth={1.5} />
  </div>
  <h3 className="text-lg font-semibold">No recipes found</h3>
  <p className="text-sm text-muted-foreground mt-1 mb-4">
    Try adjusting your search or filters
  </p>
  <Button>Add Recipe</Button>
</div>
```

---

## Tooltips

```tsx
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";

<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <Button variant="ghost" size="icon" aria-label="More info">
        <Info className="size-4" strokeWidth={1.5} />
      </Button>
    </TooltipTrigger>
    <TooltipContent>
      <p>Additional information here</p>
    </TooltipContent>
  </Tooltip>
</TooltipProvider>
```

---

## Common Patterns

### Icon + Text Alignment

```tsx
// Always use flex + items-center + gap
<div className="flex items-center gap-2">
  <Clock className="size-4 text-muted-foreground" strokeWidth={1.5} />
  <span className="text-sm">30 minutes</span>
</div>
```

### Grid Layouts

```tsx
// Responsive grid for cards
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {items.map(item => (
    <Card key={item.id}>...</Card>
  ))}
</div>
```

### List Items

```tsx
// Interactive list items
<div className="space-y-2">
  {items.map(item => (
    <div
      key={item.id}
      className="flex items-center justify-between p-3 rounded-lg hover:bg-accent cursor-pointer transition-colors"
    >
      <span>{item.name}</span>
      <ChevronRight className="size-4 text-muted-foreground" />
    </div>
  ))}
</div>
```

### Form Layout

```tsx
// Standard form with consistent spacing
<form className="space-y-6">
  <div className="space-y-4">
    <div className="space-y-2">
      <Label htmlFor="title">Title</Label>
      <Input id="title" />
    </div>

    <div className="space-y-2">
      <Label htmlFor="description">Description</Label>
      <Textarea id="description" />
    </div>
  </div>

  <div className="flex justify-end gap-3">
    <Button type="button" variant="outline">Cancel</Button>
    <Button type="submit">Save</Button>
  </div>
</form>
```
