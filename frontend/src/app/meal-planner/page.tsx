import { Suspense } from "react";
import { MealPlannerPage } from "@/app/meal-planner/_components";
import { Skeleton } from "@/components/ui/skeleton";

function MealPlannerLoading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="px-6 py-4 mx-auto max-w-7xl">
          <Skeleton className="w-40 h-8" />
        </div>
      </div>
      <div className="px-6 py-8 mx-auto max-w-7xl">
        <Skeleton className="w-full h-64 rounded-lg" />
      </div>
    </div>
  );
}

/**
 * Meal Planner Page
 *
 * Route: /meal-planner
 *
 * Uses PageLayout with fixedViewport prop for fixed viewport behavior.
 * The sidebar meal list scrolls independently within the fixed viewport.
 */
export default function Page() {
  return (
    <Suspense fallback={<MealPlannerLoading />}>
      <MealPlannerPage />
    </Suspense>
  );
}
