# Frontend Organization Rules

**Rules for keeping the frontend structure consistent as the app grows.**

## Where Components Live

This is the most common decision you'll make. One rule:

| Used by | Location |
|---------|----------|
| **One page only** | `app/{page}/_components/` |
| **Multiple pages** | `components/{domain}/` |
| **Everywhere, no domain** | `components/common/` |
| **Form inputs** | `components/forms/` |
| **Layout/nav/shell** | `components/layout/` |
| **shadcn/ui primitives** | `components/ui/` — never modify these |
| **Static content/data** | `data/` — changelog, defaults, static copy |

**When a page component starts being used on a second page**, move it from `_components/` to `components/{domain}/`. Don't pre-emptively put things in `components/` "just in case."

### `components/common/` entry criteria

A component belongs in `common/` only if it's used by **2+ unrelated domains** (e.g., dashboard and shopping-list both use `StatCard`). If it's recipe-specific, it goes in `components/recipe/` even if multiple recipe-related pages use it. Audit `common/` when it exceeds ~18 files — something domain-specific probably snuck in.

## The `_components` Convention

- **Inside `app/`** — always use `_components/`. The underscore prevents Next.js from treating it as a route segment.
- **Inside `components/`** — never use `_components/`. The underscore has no meaning there. Use plain folder names.

### What belongs in `_components/`

`_components/` holds everything a page owns privately — not just `.tsx` components:

| File type | Example | Belongs? |
|-----------|---------|----------|
| **Components** (`.tsx`) | `MealGrid.tsx` | Yes |
| **Page-specific hooks** (`.ts`) | `useRecipeForm.ts` | Yes — if only used by this page's tree |
| **Page-specific utilities** (`.ts`) | `recipe-utils.ts` | Yes — if only consumed within this page |
| **Page-specific styles** (`.css`) | `print-styles.css` | Yes — if scoped to this page's components |

The organizing principle is **page ownership**, not file type. When any of these files are needed by a second page, promote them to their shared home (`hooks/`, `lib/`, `components/`, or `globals.css`).

### Cross-page imports

**Never import from another page's `_components/`.** If `meal-planner/_components/` needs something from `recipes/_components/`, that file must be promoted to a shared location (`components/{domain}/`). Cross-page `_components/` imports create hidden coupling between pages.

## Sub-folders Within `_components`

| Condition | Structure |
|-----------|-----------|
| **< 10 top-level entries** | Flat — no sub-folders needed |
| **10-15 top-level entries** with a clear sub-feature | One sub-folder for the feature (e.g. `print/`, `meal-display/`) |
| **15+ top-level entries** | Likely a sign the page is doing too much — consider splitting the route |

**Counting method:** Count files and directories at the top level of `_components/`, not recursive totals. A sub-folder counts as 1 entry. A well-organized directory with 6 files and 3 sub-folders has 9 entries — the sub-folders are doing their job.

**When creating a sub-folder, the contents must be a cohesive feature**, not a code-type grouping. Good: `print/` (has its own hook, styles, and components). Bad: `dialogs/` (arbitrary grouping by component type).

A sub-folder should have **3+ files** to justify its existence. Two files don't need a folder — the filenames alone are enough.

## File Size Thresholds

| What | Watch at | Act at |
|------|----------|--------|
| **Component** | 300 lines | 500 lines — extract inline sub-components or split |
| **Hook** | 250 lines | 400 lines — extract types to `types/`, split logic |
| **View component** (page orchestrator) | 500 lines | 700 lines — extract sections into sibling components |
| **Utility file** | 300 lines | 500 lines — split by concern |

"View" components (`MealPlannerView.tsx`, `RecipeBrowserView.tsx`) will always be larger than leaf components — that's fine. But if they have inline sub-components defined in the same file, extract those into their own files.

## Types

### Where types live

| Type | Location |
|------|----------|
| **Domain types** (recipe, meal, planner, category, etc.) | `types/{domain}.ts` |
| **Generic utility types** (shared across domains) | `types/common.ts` |
| **Component props** | Inline in the component file |
| **Hook return types / internal interfaces** | Inline in the hook file, unless 5+ interfaces |

### Preventing `common.ts` bloat

`common.ts` is only for types that genuinely don't belong to any domain. Before adding a type there, ask: "Does this belong to a domain that has (or should have) its own type file?" If yes, put it there.

If `common.ts` exceeds ~100 lines, audit it — something domain-specific probably snuck in.

## Hooks

### Folder structure

| Category | Location | Contains |
|----------|----------|----------|
| `hooks/api/` | React Query hooks for API calls | `useRecipes.ts`, `usePlanner.ts`, etc. |
| `hooks/forms/` | Form state and validation logic | `useRecipeFilters.ts`, etc. |
| `hooks/persistence/` | localStorage, settings, cached state | `useSettings.ts`, etc. |
| `hooks/ui/` | DOM interactions, scroll, drag-and-drop | `useSortableDnd.ts`, etc. |

**Don't create new hook categories lightly.** Most hooks fit into one of these four. If you think you need a fifth, you probably have a hook that fits in an existing category with a better name.

### Page-specific hooks

Hooks used by only one page live in that page's `_components/` folder (e.g. `useRecipeForm.ts`, `useRecipeView.ts`). Only move to `hooks/` when a second page needs it.

### Non-hook support files

`hooks/api/` may contain non-hook support files that are exclusively consumed by the API hooks in that directory — query key factories (`queryKeys.ts`), event dispatchers (`events.ts`), etc. These are React Query infrastructure, not HTTP client code, so they belong with the hooks rather than in `lib/api/`.

## Barrel Exports (`index.ts`)

| Directory | Barrel export? |
|-----------|---------------|
| `app/{page}/_components/` | **Yes** — always |
| Sub-folders within `_components/` | **Yes** — if the sub-folder has 3+ files |
| `hooks/` and `hooks/{category}/` | **Yes** — always |
| `lib/api/` | **Yes** — single barrel re-export |
| `components/{domain}/` | **No** — import directly by filename |
| `components/ui/` | **No** — shadcn default, don't modify |
| `types/` | **No** — import directly by filename |

Barrel exports earn their keep at module boundaries (`_components/`, `hooks/`, `lib/api/`) where they define a public API. In `components/`, direct filename imports are clearer and more grep-friendly.

## API Client Layer (`lib/api/`)

One file per backend domain, matching the backend route structure:

| Backend route | API client file |
|---------------|----------------|
| `/api/recipes` | `lib/api/recipe.ts` |
| `/api/planner` | `lib/api/planner.ts` |
| `/api/ai/assistant` | `lib/api/ai.ts` |

Don't combine multiple domains into one file. Don't split one domain across multiple files. One-to-one mapping keeps things findable.

## Utilities (`lib/`)

### Naming

Name utility files by **what they do**, not `utils.ts` or `helpers.ts`:

```
✅  filterUtils.ts, imageUtils.ts, quantityUtils.ts
❌  utils2.ts, helpers.ts, misc.ts
```

The one exception is `utils.ts` which holds truly generic utilities (`cn()`, `formatQuantity()`, `getErrorMessage()`). Keep it generic — if a function is recipe-specific, it belongs in `recipeCardMapper.ts` or similar.

### When `lib/` gets crowded

If `lib/` exceeds ~15 files, group domain-specific utilities:

```
lib/
  └── recipe/
      ├── cardMapper.ts
      ├── icon.ts
      ├── validation.ts
  ├── filterUtils.ts          # cross-domain, stays at root
  ├── imageUtils.ts           # cross-domain, stays at root
  ├── utils.ts                # generic, stays at root
```

## Breakpoints

Always use Tailwind's standard breakpoints in CSS classes:

| Prefix | Width |
|--------|-------|
| `sm` | 640px |
| `md` | 768px |
| `lg` | 1024px |
| `xl` | 1280px |

When breakpoints are needed in JS, import from a single source of truth:

```ts
// lib/breakpoints.ts
export const BREAKPOINTS = { sm: 640, md: 768, lg: 1024, xl: 1280 } as const;
```

Never hardcode pixel values in components. Never invent custom breakpoints unless a component genuinely can't work with the standard set.

## Naming Conventions

| What | Convention | Example |
|------|-----------|---------|
| **Components** | PascalCase, descriptive | `RecipeHeaderCard.tsx`, `MealGrid.tsx` |
| **Hooks** | camelCase, `use` prefix | `useRecipes.ts`, `useSettings.ts` |
| **Utilities** | camelCase, descriptive | `filterUtils.ts`, `quantityUtils.ts` |
| **Types** | camelCase file, PascalCase exports | `recipe.ts` → `RecipeCardData` |
| **Constants** | UPPER_SNAKE_CASE | `MEAL_TYPES`, `BREAKPOINTS` |
| **API files** | kebab-case matching route | `data-management.ts`, `recipe-groups.ts` |

One component per file. The filename matches the default export.

## Max Nesting Depth

Counting from `src/`:

```
✅  src / app / recipes / _components / RecipeBrowserView.tsx           (3 levels)
✅  src / app / recipes / [id] / _components / print / PrintPreview.tsx (4 levels — [id] is a route, not organizational)
❌  src / app / recipes / _components / browser / filters / RecipeFilters.tsx  (4 organizational levels — too deep)
```

Route segments (`[id]`, `edit`) don't count toward organizational depth — they're dictated by your URL structure. But `_components` sub-folders do count. Keep organizational nesting to 3 levels max from `src/`.

## Checklist: Adding a New Feature

1. **Types** → `types/{domain}.ts` (or add to existing domain file)
2. **API client** → `lib/api/{domain}.ts` (or add to existing)
3. **API hook** → `hooks/api/use{Domain}.ts` (or add to existing)
4. **Components** → `app/{page}/_components/` (start page-scoped)
5. **Promote to shared** only when a second page needs it → `components/{domain}/`

**Start page-scoped. Promote when reuse is real, not hypothetical.**

## Checklist: Before Committing

- [ ] Is a component over 500 lines? → Extract inline sub-components
- [ ] Is a hook over 400 lines? → Move types out, split logic
- [ ] Did I add types to `common.ts`? → Check if they belong in a domain file
- [ ] Did I create a sub-folder with only 1-2 files? → Flatten it
- [ ] Did I use `_components/` outside of `app/`? → Use a plain folder name
- [ ] Did I hardcode a pixel breakpoint? → Use Tailwind's standard breakpoints
- [ ] Is a page-scoped component now used on a second page? → Move to `components/{domain}/`
- [ ] Did I name something `helpers.ts` or `utils2.ts`? → Rename to what it does
- [ ] Is `lib/` over 15 files? → Consider domain grouping
- [ ] Did I import from another page's `_components/`? → Promote the file to `components/{domain}/`
- [ ] Does a new `_components/` sub-folder have a barrel export? → Add `index.ts` if 3+ files
- [ ] Did I add a component to `common/`? → Verify it's used by 2+ unrelated domains

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
| Form layout | `app/recipes/_components/add-edit/AddEditRecipeView.tsx` |
| Dialog usage | `app/meal-planner/_components/MealPreviewDialog.tsx` |
| Filter UI | `components/common/FilterBar.tsx` |
| Loading states | Any component with React Query |
| Page structure | `app/recipes/page.tsx` |
| API hook | `hooks/api/useRecipes.ts` |
| Persistence hook | `hooks/persistence/useSettings.ts` |
| UI hook | `hooks/ui/useSortableDnd.ts` |
| Custom form input | `components/forms/QuantityInput.tsx` |

## When to Create New Files

**Create a new component when:**
- Logic is reused in 2+ places
- Component exceeds ~100 lines
- Component has distinct responsibility

**Don't create a new component when:**
- Used only once in parent and < 100 lines
- Extraction doesn't improve clarity
- Over-abstracting simple JSX