import { MealPlannerPage } from "@/components/meal-planner";

/**
 * Meal Planner Page
 * 
 * Route: /meal-planner
 * 
 * IMPORTANT: The wrapper div with h-full and relative is required
 * for the MealPlannerPage's absolute positioning to work correctly.
 * This ensures the page never scrolls - only the sidebar meal list scrolls.
 */
export default function Page() {
  return (
    <div className="h-full relative">
      <MealPlannerPage />
    </div>
  );
}