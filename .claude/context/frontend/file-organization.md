# File Organization

**Directory structure, naming conventions, and where to create files.**

## Directory Structure

| Type | Location | Purpose |
|------|----------|---------|
| Pages | `src/app/[page]/page.tsx` | Next.js App Router pages |
| Page-specific components | `src/app/[page]/_components/` | Components used only by that page |
| Shared components | `src/components/common/` | Reusable components across app |
| Domain components | `src/components/[domain]/` | Domain-specific (recipe, meal-planner, etc.) |
| shadcn/ui primitives | `src/components/ui/` | **Don't modify these** |
| Form components | `src/components/forms/` | Custom form inputs (QuantityInput, etc.) |
| Layout components | `src/components/layout/` | Sidebar, nav, page header, mobile nav |
| Auth components | `src/components/auth/` | Sign-in, sign-up, user menu |
| Hooks | `src/hooks/` | Custom React hooks |
| API hooks | `src/hooks/api/` | React Query hooks for all API calls |
| Types | `src/types/` | TypeScript type definitions |
| Utilities | `src/lib/` | Helper functions, constants |
| API client | `src/lib/api.ts` | Typed API methods |
| Design tokens | `src/app/globals.css` | Tailwind CSS variables |

## Where to Create Components

**Page-specific component:**
```
src/app/recipes/_components/
  ├── RecipeFilters.tsx     (only used on recipes page)
  ├── RecipeSort.tsx        (only used on recipes page)
  └── RecipeBulkActions.tsx (only used on recipes page)
```

**Domain component (used across multiple pages):**
```
src/components/recipe/
  ├── RecipeCard.tsx        (used in dashboard, recipes, search)
  ├── RecipeCardGrid.tsx    (used in recipes, favorites)
  └── RecipeImage.tsx       (used in card, detail page)
```

**Shared component (used across domains):**
```
src/components/common/
  ├── FilterBar.tsx         (used by recipes, meal-planner)
  ├── StatsCard.tsx         (used by dashboard, settings)
  └── EmptyState.tsx        (used everywhere)
```

## Naming Conventions

**Components:**
- PascalCase: `RecipeCard.tsx`, `MealPlanner.tsx`
- Descriptive: `RecipeCardGrid.tsx` not `Grid.tsx`
- Suffix with type when ambiguous: `RecipeForm.tsx`, `RecipeDialog.tsx`

**Hooks:**
- camelCase with "use" prefix: `useRecipes.ts`, `useSettings.ts`
- API hooks in `hooks/api/`: `useRecipes.ts`, `usePlanner.ts`

**Types:**
- PascalCase: `RecipeCardData`, `MealSelection`
- Suffix with type: `RecipeFormData`, `RecipeCardProps`

**Files:**
- Component file matches component name: `RecipeCard.tsx` exports `RecipeCard`
- One component per file (except small related components)

## Import Organization

**Standard import order:**
1. React and Next.js
2. External libraries
3. UI components (shadcn/ui)
4. Icons (lucide-react)
5. Internal components
6. Hooks
7. Utilities and types

## Reference File Patterns

**For patterns, look at existing implementations:**

| Pattern | Reference File |
|---------|---------------|
| Recipe card | `components/recipe/RecipeCard.tsx` |
| Form layout | `app/recipes/add/page.tsx` |
| Dialog usage | `app/meal-planner/_components/MealDialog.tsx` |
| Filter UI | `components/common/FilterBar.tsx` |
| Loading states | Any component with React Query |
| Page structure | `app/recipes/page.tsx` |
| API hook | `hooks/api/useRecipes.ts` |
| Custom form input | `components/forms/QuantityInput.tsx` |
| Empty state | `components/common/EmptyState.tsx` |

## When to Create New Files

**Create a new component when:**
- Logic is reused in 2+ places
- Component exceeds ~100 lines
- Component has distinct responsibility
- Component needs separate testing

**Don't create a new component when:**
- Used only once in parent
- Extraction doesn't improve clarity
- Component is < 20 lines
- Over-abstracting simple JSX

## Folder Nesting Guidelines

**Maximum nesting depth: 3 levels**

✅ **Good:**
```
src/components/recipe/RecipeCard.tsx
src/app/recipes/[id]/page.tsx
```

❌ **Too deep:**
```
src/components/recipe/card/display/RecipeCard.tsx
```

**Group related files in domain folders:**
```
src/components/recipe/
  ├── RecipeCard.tsx
  ├── RecipeCardGrid.tsx
  ├── RecipeImage.tsx
  └── RecipeBadges.tsx
```
