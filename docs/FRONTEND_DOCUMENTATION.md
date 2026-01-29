# Meal Genie Frontend Documentation

Architecture decisions and patterns for the Next.js frontend. For component APIs, types, and hooks, read the source files directly.

## Tech Stack

- **Next.js 16** with App Router
- **React 19** with React Query 5 for server state
- **TypeScript 5** for type safety
- **Tailwind CSS 4** with CSS variables for theming
- **shadcn/ui** (New York style) built on Radix UI
- **dnd-kit** for drag-and-drop
- **Framer Motion** for animations

## Directory Structure

```
src/
├── app/                      # Next.js App Router pages
│   ├── [page]/
│   │   ├── page.tsx          # Page component
│   │   └── _components/      # Page-specific components
│   ├── layout.tsx            # Root layout
│   └── globals.css           # Design tokens & global styles
├── components/
│   ├── ui/                   # shadcn/ui primitives (don't modify)
│   ├── common/               # Shared across pages
│   ├── forms/                # Form inputs (QuantityInput, etc.)
│   ├── recipe/               # Recipe-specific (RecipeCard, etc.)
│   ├── layout/               # App structure (Sidebar, AppLayout)
│   ├── meal-genie/           # AI assistant components
│   └── settings/             # Settings-specific
├── hooks/
│   └── api/                  # React Query hooks wrapping API client
├── lib/
│   ├── api.ts                # API client (all backend calls)
│   ├── api-server.ts         # Server-side API client
│   ├── constants.ts          # Dropdowns, categories, static data
│   ├── filterUtils.ts        # Recipe filtering logic
│   ├── formValidation.ts     # Validation helpers
│   └── utils.ts              # cn() and other utilities
└── types/
    └── index.ts              # All TypeScript interfaces
```

## Key Patterns

### Page Structure

Pages live in `app/[page]/page.tsx`. Page-specific components go in `app/[page]/_components/`. Shared components go in `components/`.

```typescript
// app/recipes/page.tsx
export default function RecipesPage() {
  return <RecipeBrowser />;
}

// app/recipes/_components/RecipeBrowser.tsx
// Complex page-specific component
```

### Component Organization

| Directory | Purpose | Examples |
|-----------|---------|----------|
| `ui/` | shadcn primitives — don't edit | Button, Card, Dialog |
| `common/` | Reusable across pages | FavoriteButton, StatsCard, FilterBar |
| `recipe/` | Recipe domain components | RecipeCard, RecipeBadge, RecipeImage |
| `layout/` | App structure | Sidebar, AppLayout, PageHeader |
| `forms/` | Specialized inputs | QuantityInput, SmartIngredientInput |

### API Layer

All backend calls go through `lib/api.ts`. Never call fetch directly in components.

```typescript
// lib/api.ts - API client with typed methods
export const recipeApi = {
  list: () => fetchApi<RecipeCardDTO[]>("/api/recipes/cards"),
  get: (id: number) => fetchApi<RecipeResponseDTO>(`/api/recipes/${id}`),
  create: (data: RecipeCreateDTO) => fetchApi("/api/recipes", { method: "POST", body: data }),
  // ...
};
```

### React Query Hooks

Wrap API calls in hooks for components. All hooks in `hooks/api/`.

```typescript
// hooks/api/useRecipes.ts
export function useRecipeCards(filters?: RecipeFilters) {
  return useQuery({
    queryKey: ["recipes", "cards", filters],
    queryFn: () => recipeApi.listCards(filters),
  });
}

// In components
const { data: recipes, isLoading } = useRecipeCards(filters);
```

**Naming conventions:**
- `useXxx` — query hook (fetches data)
- `useCreateXxx`, `useUpdateXxx`, `useDeleteXxx` — mutation hooks
- `useToggleXxx` — toggle mutation

### Types

All types in `types/index.ts`. Types mirror backend DTOs with some frontend-specific mappings.

```typescript
// Backend DTO format (snake_case)
interface RecipeCardDTO {
  id: number;
  recipe_name: string;
  is_favorite: boolean;
}

// Frontend mapped format (camelCase) - used in some components
interface RecipeCardData {
  id: number;
  name: string;
  isFavorite: boolean;
}
```

## Styling & Theming

### Design Tokens

All colors defined as CSS variables in `globals.css`. **Never use hardcoded Tailwind colors.**

```css
/* globals.css */
:root {
  --background: #0f0f14;
  --foreground: #f1f0f5;
  --primary: #8b5cf6;      /* Purple */
  --secondary: #14b8a6;    /* Teal */
  --muted: #1e1e2a;
  /* ... */
}
```

```tsx
// ✅ Correct - uses semantic tokens
<div className="bg-background text-foreground border-border">

// ❌ Wrong - hardcoded colors
<div className="bg-gray-900 text-gray-100 border-gray-700">
```

### Class Merging

Use `cn()` for conditional classes:

```typescript
import { cn } from "@/lib/utils";

<Button className={cn("base-class", isActive && "active-class")} />
```

### shadcn/ui Components

Add new components via CLI:

```bash
npx shadcn@latest add button dialog card
```

Components install to `components/ui/`. Don't modify these directly — extend with wrapper components if needed.

## File Reference

| Need to... | Look in... |
|------------|------------|
| Add a page | `src/app/` |
| Add shared component | `src/components/common/` |
| Add API method | `src/lib/api.ts` |
| Add React Query hook | `src/hooks/api/` |
| Add TypeScript type | `src/types/index.ts` |
| Add constant/dropdown | `src/lib/constants.ts` |
| Modify design tokens | `src/app/globals.css` |

## Reference Files

For code patterns, look at existing implementations:

| Pattern | Reference |
|---------|-----------|
| Page with filters | `app/recipes/page.tsx` |
| Complex component | `app/recipes/_components/RecipeBrowser.tsx` |
| API hooks | `hooks/api/useRecipes.ts` |
| Form with validation | `app/recipes/add/page.tsx` |
| Drag-and-drop | `app/meal-planner/_components/` |
| AI integration | `components/meal-genie/` |

## Gotchas

**Client vs Server components:** Pages are server components by default. Add `"use client"` for hooks, state, or browser APIs.

**Image optimization:** Use `RecipeImage` component which handles fallbacks. For static images, use Next.js `Image` from `next/image`.

**Form state:** We use controlled components with `useState`, not form libraries. Validation in `lib/formValidation.ts`.

**Clerk auth:** Middleware in `src/proxy.ts`. API calls automatically include auth token via `apiClientFetch`.

**React Query keys:** Always include filter params in query keys for proper cache invalidation.