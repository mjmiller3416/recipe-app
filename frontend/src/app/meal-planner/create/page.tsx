import { redirect } from "next/navigation";

/**
 * CreateMealRoute - Redirects to meal planner
 *
 * The meal creation flow has been moved to a dialog-based approach
 * within the MealPlannerView. This route now redirects to maintain
 * backwards compatibility with any existing links.
 */
export default function CreateMealRoute() {
  redirect("/meal-planner");
}
