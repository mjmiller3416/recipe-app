# Data Fetching Patterns

**Client-side fetching via React Query. Pages are shells; Views own all data fetching.**

## Page.tsx Patterns

Pages are thin shells that render a single View component. They do NOT fetch data.

**Pattern 1 — Suspense wrapper (preferred for data-heavy pages):**
```tsx
import { Suspense } from "react";
import { ViewComponent } from "./_components";

function PageLoading() {
  return <Skeleton layout />; // Custom skeleton matching the page layout
}

export default function Page() {
  return (
    <Suspense fallback={<PageLoading />}>
      <ViewComponent />
    </Suspense>
  );
}
```

**Pattern 2 — Direct passthrough (simpler pages):**
```tsx
import { ViewComponent } from "./_components";

export default function Page() {
  return <ViewComponent />;
}
```

**Route params** — extracted inside client components, NOT at the page level:
```tsx
// ✅ View component extracts params
export function FullRecipeView() {
  const params = useParams();
  const recipeId = Number(params.id);
  const { recipe, loading } = useRecipeView(recipeId);
}

// ❌ Page extracts and passes as props (avoid)
export default function Page({ params }: { params: { id: string } }) {
  return <FullRecipeView recipeId={Number(params.id)} />;
}
```

## View Component Data Fetching

Views call React Query hooks directly. Data is self-contained, not prop-drilled from pages.

```tsx
// Parallel queries — destructure loading/error per query
const { data: statsData, isLoading: statsLoading } = useDashboardStats();
const { data: plannerEntries } = usePlannerEntries();
const { data: shoppingData } = useShoppingList();
```

**Complex views** extract logic into custom view hooks:
```tsx
const { recipe, loading, isFavorite, directions, groupedIngredients } = useRecipeView(recipeId);
```

**Edit-mode fetching** uses `useEffect` + direct API call (not React Query):
```tsx
useEffect(() => {
  if (!isEditMode || !recipeId) return;
  async function fetchRecipe() {
    try {
      const token = await getToken();
      const recipe = await recipeApi.get(recipeId!, token);
      setInitialData(recipe);
    } catch (error) {
      toast.error("Failed to load recipe");
      router.push("/recipes");
    } finally {
      setIsFetching(false);
    }
  }
  fetchRecipe();
}, [recipeId, isEditMode]);
```

## Query Keys & Stale Times

**Hierarchical query key factories** in `hooks/api/queryKeys.ts`:
```tsx
export const plannerQueryKeys = {
  all: ["planner"] as const,
  entries: () => [...plannerQueryKeys.all, "entries"] as const,
  meal: (id: number) => [...plannerQueryKeys.all, "meal", id] as const,
};
```

**Stale times by data volatility:**

| Data Type | Stale Time | Examples |
|-----------|-----------|---------|
| Frequently changing | `0` | Planner entries, shopping list |
| Moderate | `30000` (30s) | Recipes, dashboard stats, single meal |
| Slow-changing | `300000` (5m) | Categories, meal types |
| Static | `Infinity` | Units, cooking tips |

## Loading / Error / Empty State Guard Order

**Always guard in this order: loading → error → empty → render.**

```tsx
export function ShoppingListView() {
  const { data, isLoading, error, refetch } = useShoppingList();

  // 1. Loading
  if (isLoading) return <ShoppingSkeleton />;

  // 2. Error
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="rounded-full bg-destructive/10 p-4 mb-4">
          <ShoppingCart className="size-8 text-destructive" strokeWidth={1.5} />
        </div>
        <h3 className="text-lg font-semibold">Something went wrong</h3>
        <p className="text-sm text-muted-foreground mt-1 mb-4">
          {getErrorMessage(error, "Failed to load shopping list")}
        </p>
        <Button onClick={() => refetch()}>Try Again</Button>
      </div>
    );
  }

  // 3. Empty
  if (!data?.items.length) return <EmptyState />;

  // 4. Render
  return <ShoppingContent data={data} />;
}
```

See component-patterns.md for skeleton and empty state templates.

## Mutation Patterns

**Simple mutation** — mutate, invalidate, dispatch:
```tsx
return useMutation({
  mutationFn: async (data: CreateDTO) => {
    const token = await getToken();
    return recipeApi.create(data, token);
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: recipeQueryKeys.all });
    dispatchRecipeUpdate();
  },
});
```

**Optimistic mutation** — cancel → snapshot → update → rollback on error:
```tsx
return useMutation({
  mutationFn: async (recipeId: number) => { /* ... */ },

  onMutate: async (recipeId) => {
    await queryClient.cancelQueries({ queryKey: recipeQueryKeys.all });
    const previous = queryClient.getQueryData(recipeQueryKeys.list());

    queryClient.setQueryData(recipeQueryKeys.list(), (old) =>
      old?.map((r) => r.id === recipeId ? { ...r, is_favorite: !r.is_favorite } : r)
    );
    return { previous };
  },

  onError: (_err, _id, context) => {
    if (context?.previous) {
      queryClient.setQueryData(recipeQueryKeys.list(), context.previous);
    }
  },

  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: recipeQueryKeys.all });
  },
});
```

**Mutation feedback** — toast notifications for user-facing actions:
```tsx
toggleItem.mutate(itemId, {
  onSuccess: () => toast.success("Item updated"),
  onError: () => toast.error("Failed to update"),
});
```

## Cache Invalidation

**Hierarchical** — invalidate broad or narrow:
```tsx
queryClient.invalidateQueries({ queryKey: plannerQueryKeys.all });      // All planner
queryClient.invalidateQueries({ queryKey: plannerQueryKeys.entries() }); // Just entries
queryClient.removeQueries({ queryKey: plannerQueryKeys.meal(mealId) });  // Specific meal
```

**Cross-domain chains** — mutations that affect other domains:
```tsx
// Planner mutation also invalidates shopping + dashboard
onSettled: () => {
  queryClient.invalidateQueries({ queryKey: dashboardQueryKeys.stats() });
  queryClient.invalidateQueries({ queryKey: shoppingQueryKeys.list() });
  dispatchPlannerUpdate(); // Event for widgets outside React Query
};
```

**Event dispatch** (`hooks/api/events.ts`) for sidebar/widget refresh:
```tsx
export const dispatchPlannerUpdate = () =>
  window.dispatchEvent(new Event("planner-updated"));
```

## Auth Integration

All hooks use Clerk's `useAuth()`. Token is passed to every API call:
```tsx
const { getToken } = useAuth();

return useQuery({
  queryFn: async () => {
    const token = await getToken();
    return recipeApi.list(filters, token);
  },
});
```

**Auth-guarded queries** — wait for auth before fetching:
```tsx
const { getToken, isLoaded, isSignedIn } = useAuth();

return useQuery({
  queryKey: shoppingQueryKeys.list(),
  queryFn: async () => { /* ... */ },
  enabled: isLoaded && isSignedIn,
});
```

## Checklist

Before completing page or view work, verify:

- [ ] Page is a thin shell (no data fetching, no business logic)
- [ ] Data-heavy pages use Suspense with a custom skeleton fallback
- [ ] View fetches its own data via React Query hooks (not prop-drilled from page)
- [ ] Route params extracted via `useParams()` inside client component
- [ ] Guard order: loading → error → empty → render
- [ ] Error state has retry button (`refetch()`)
- [ ] Empty state has contextual icon and call-to-action
- [ ] Mutations invalidate affected query keys (including cross-domain)
- [ ] Optimistic mutations include rollback in `onError`
- [ ] Query keys use hierarchical factories from `queryKeys.ts`
- [ ] Auth token injected via `getToken()` in every `queryFn`
- [ ] Stale time set based on data volatility, not a default
