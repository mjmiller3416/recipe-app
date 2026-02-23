# Layout Patterns

## PageHeader (Composition API)

`@/components/layout/PageHeader` uses composition, NOT props.

Sub-components:
- `PageHeader` — wrapper: `bg-background`, `max-w-7xl`, horizontal padding
- `PageHeaderContent` — flex row: `flex items-end gap-4`
- `PageHeaderTitle` — accepts `title: string`, optional `description: string`
- `PageHeaderActions` — right-aligned: `flex items-center gap-2`

```tsx
import {
  PageHeader,
  PageHeaderContent,
  PageHeaderTitle,
  PageHeaderActions,
} from "@/components/layout/PageHeader";

<PageHeader>
  <PageHeaderContent>
    <PageHeaderTitle title="Recipes" description="Browse and manage" />
    <PageHeaderActions>
      <Button>
        <Plus className="size-4 mr-2" strokeWidth={1.5} />
        Add Recipe
      </Button>
    </PageHeaderActions>
  </PageHeaderContent>
</PageHeader>
```

Without actions:
```tsx
<PageHeader>
  <PageHeaderContent>
    <PageHeaderTitle title="Shopping List" />
  </PageHeaderContent>
</PageHeader>
```

## AppLayout

`@/components/layout/AppLayout` is the root layout component. It renders `TopNav`, `MobileBottomNav`, the assistant popup, and `<main>` with `flex-1 pb-20 md:pb-0`.

## Standard Page Structure

```tsx
<div className="flex flex-col h-full">
  <PageHeader>...</PageHeader>
  <div className="flex-1 overflow-auto p-6 space-y-6">
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">Section Title</h2>
      {/* content */}
    </section>
  </div>
</div>
```

## Section Spacing Scale

| Token | Use |
|-------|-----|
| `space-y-6` | Between major page sections |
| `space-y-4` | Within a section (heading to content) |
| `gap-4` | Between grid/flex items (cards, list rows) |
| `gap-2` | Between small related items (badges, icon+text) |

## Grid vs Flex

**Grid** — equal-sized items in columns (card grids, dashboards):
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {recipes.map((r) => <RecipeCard key={r.id} recipe={r} />)}
</div>

// Auto-fit (cards fill available space)
<div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
```

**Flex** — variable-size items, toolbars, controls:
```tsx
// Toolbar
<div className="flex items-center justify-between gap-4">

// Filter chips
<div className="flex items-center gap-2 flex-wrap">

// Vertical stack
<div className="flex flex-col gap-4">
```

## Responsive Patterns

Breakpoints: `sm:640` `md:768` `lg:1024` `xl:1280`

```tsx
// Grid columns by breakpoint
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

// Show/hide by breakpoint
<div className="hidden md:block">   // desktop only
<div className="md:hidden">         // mobile only

// Stack mobile, row desktop
<div className="flex flex-col md:flex-row md:items-center gap-4">
```

## Mobile Navigation

Use `Sheet` component for mobile nav drawers.
