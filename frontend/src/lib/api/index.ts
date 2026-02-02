// Barrel re-export — maintains backward compatibility
// All existing imports like `import { recipeApi } from "@/lib/api"` continue to work.

// Core infrastructure
export { ApiError, fetchApi, buildQueryString, API_BASE } from "./client";

// Domain API modules
export { recipeApi } from "./recipe";
export { plannerApi } from "./planner";
export { shoppingApi } from "./shopping";
export { ingredientApi } from "./ingredients";
export { uploadApi } from "./upload";
export { imageGenerationApi, cookingTipApi, mealSuggestionsApi, mealGenieApi } from "./ai";
export { dashboardApi } from "./dashboard";
export { dataManagementApi } from "./data-management";
export { feedbackApi } from "./feedback";
export { unitConversionApi } from "./units";
export { settingsApi } from "./settings";
export { recipeGroupApi } from "./recipe-groups";
