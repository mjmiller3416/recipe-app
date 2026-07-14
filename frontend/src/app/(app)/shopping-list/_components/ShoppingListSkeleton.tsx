import { Skeleton } from "@/components/ui/skeleton";

/**
 * ShoppingListSkeleton — full-page skeleton matching ShoppingListView's final
 * layout (header, stat cards, progress bar, category groups). Used by the
 * route loading boundary and the view's query-loading state.
 */
export function ShoppingListSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="pt-6 px-4 mx-auto max-w-7xl md:px-6">
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-5 w-80" />
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>

        {/* Progress bar */}
        <Skeleton className="h-2 w-full rounded-full mb-6" />

        {/* Category groups */}
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="w-24 h-4" />
              <div className="space-y-1">
                {[1, 2, 3].map((j) => (
                  <Skeleton key={j} className="w-full h-12 rounded-xl" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
