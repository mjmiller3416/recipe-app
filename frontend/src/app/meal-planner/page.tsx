import { Suspense } from "react";
import { MealPlannerPage } from "@/app/meal-planner/_components";

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
    <Suspense>
      <MealPlannerPage />
    </Suspense>
  );
}
