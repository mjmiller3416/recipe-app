# Layout Patterns

**Page structure, section spacing, and responsive design patterns.**

## Page Structure

**Standard page layout:**
```tsx
import { PageHeader } from "@/components/layout/PageHeader";

export default function RecipesPage() {
  return (
    <div className="flex flex-col h-full">
      {/* Page header */}
      <PageHeader
        title="Recipes"
        description="Browse and manage your recipes"
      />

      {/* Main content */}
      <div className="flex-1 overflow-auto p-6 space-y-6">
        <section>
          {/* Section content */}
        </section>
      </div>
    </div>
  );
}
```

**Page with actions:**
```tsx
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

<PageHeader
  title="Recipes"
  description="Browse and manage your recipes"
  actions={
    <Button>
      <Plus className="size-4 mr-2" strokeWidth={1.5} />
      Add Recipe
    </Button>
  }
/>
```

## Section Spacing Conventions

**Standard spacing:**
```tsx
<div className="flex-1 overflow-auto p-6 space-y-6">
  {/* Section 1 */}
  <section className="space-y-4">
    <h2 className="text-xl font-semibold">Recent Recipes</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Cards */}
    </div>
  </section>

  {/* Section 2 */}
  <section className="space-y-4">
    <h2 className="text-xl font-semibold">Popular Recipes</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Cards */}
    </div>
  </section>
</div>
```

**Spacing scale:**
- `space-y-6` — Between major page sections
- `space-y-4` — Within a section (heading to content)
- `gap-4` — Between grid/flex items (cards, buttons)
- `gap-2` — Between related small items (badges, icons)

## Grid vs Flex Layouts

**Grid for card layouts:**
```tsx
// Responsive card grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {recipes.map((recipe) => (
    <RecipeCard key={recipe.id} recipe={recipe} />
  ))}
</div>

// Auto-fit grid (cards size to content)
<div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
  {items.map((item) => (
    <Card key={item.id}>{item.content}</Card>
  ))}
</div>
```

**Flex for toolbars and controls:**
```tsx
// Horizontal toolbar
<div className="flex items-center justify-between gap-4">
  <h1 className="text-2xl font-bold">Recipes</h1>
  <Button>Add Recipe</Button>
</div>

// Filter bar
<div className="flex items-center gap-2 flex-wrap">
  <Button variant="outline" size="sm">All</Button>
  <Button variant="outline" size="sm">Breakfast</Button>
  <Button variant="outline" size="sm">Lunch</Button>
</div>

// Vertical stack
<div className="flex flex-col gap-4">
  <FilterBar />
  <RecipeGrid />
</div>
```

## Responsive Patterns

**Mobile-first breakpoints (sm:640px, md:768px, lg:1024px, xl:1280px):**
```tsx
// Grid: stack mobile, columns desktop
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

// Visibility: hide/show by breakpoint
<div className="hidden md:block">Desktop only</div>
<div className="md:hidden">Mobile only</div>

// Flex: stack mobile, row desktop
<div className="flex flex-col md:flex-row md:items-center gap-4">
```

## Mobile Navigation

**Mobile nav toggle:**
```tsx
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

<Sheet>
  <SheetTrigger asChild>
    <Button
      variant="ghost"
      size="icon"
      className="md:hidden"
      aria-label="Open menu"
    >
      <Menu className="size-5" strokeWidth={1.5} />
    </Button>
  </SheetTrigger>
  <SheetContent side="left">
    {/* Mobile navigation content */}
  </SheetContent>
</Sheet>
```

## Sidebar Integration

**Desktop sidebar layout:**
```tsx
import { AppSidebar } from "@/components/layout/AppSidebar";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen">
      <AppSidebar className="hidden md:flex" />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
```

## Container Max Widths

**Content containers:**
```tsx
// Narrow content (forms, articles)
<div className="max-w-2xl mx-auto p-6">
  {/* Form content */}
</div>

// Standard content (most pages)
<div className="max-w-7xl mx-auto p-6">
  {/* Page content */}
</div>

// Full width (dashboards, tables)
<div className="w-full p-6">
  {/* Full-width content */}
</div>
```

## Scrollable Sections

**Scrollable card list:**
```tsx
<div className="flex-1 overflow-auto">
  <div className="space-y-4 p-6">
    {items.map((item) => (
      <Card key={item.id}>{item.content}</Card>
    ))}
  </div>
</div>
```

## Split Layout Patterns

**Two-column or sidebar layout:**
```tsx
// Equal columns
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

// Sidebar + main (fixed sidebar width)
<div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
```