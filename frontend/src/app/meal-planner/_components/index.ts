// Meal Planner Components
// Re-export all components for clean imports

export { MealPlannerPage } from "./MealPlannerView";
export { MealDialog } from "./meal-dialog/MealDialog";

// New Components (Redesign)
export { MealGrid } from "./MealGrid";
export { MealGridCard } from "./MealGridCard";
export { CompletedDropdown } from "./CompletedDropdown";
export { SelectedMealCard } from "./SelectedMealCard";
export { SideChip } from "./SideChip";
export { AISuggestionsPlaceholder } from "./AISuggestionsPlaceholder";
export { MealStats } from "./MealStats";

// Types
export type { MealGridItem } from "./MealGridCard";
export type { CompletedMealItem } from "./CompletedDropdown";
