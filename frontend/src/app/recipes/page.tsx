import { Suspense } from "react";
import { RecipeBrowserView } from "./_components";
import { Skeleton } from "@/components/ui/skeleton";

function RecipesLoading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="px-6 py-4 mx-auto max-w-7xl">
          <Skeleton className="w-32 h-8" />
        </div>
      </div>
      <div className="px-6 py-8 mx-auto max-w-7xl">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function RecipesPage() {
  return (
    <Suspense fallback={<RecipesLoading />}>
      <RecipeBrowserView />
    </Suspense>
  );
}
