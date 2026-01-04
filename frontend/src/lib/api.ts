// src/lib/api.ts
// API client for Meal Genie backend

import type {
  RecipeResponseDTO,
  RecipeCardDTO,
  RecipeFilterDTO,
  MealSelectionResponseDTO,
  MealPlanSummaryDTO,
  PlannerEntryResponseDTO,
  ShoppingListResponseDTO,
  ShoppingItemResponseDTO,
  ShoppingListGenerationResultDTO,
  IngredientResponseDTO,
  ImportPreviewDTO,
  ImportResultDTO,
  DuplicateResolutionDTO,
  ExportFilterDTO,
  ImageGenerationResponseDTO,
  CookingTipResponseDTO,
  CookingStreakDTO,
  DashboardStatsDTO,
  MealGenieMessage,
  MealGenieResponseDTO,
} from "@/types";

// API base URL from environment variable or default to localhost
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://192.168.1.213:8000";

// ============================================================================
// Core fetch wrapper with error handling
// ============================================================================

class ApiError extends Error {
  status: number;
  details?: Record<string, unknown>;

  constructor(message: string, status: number, details?: Record<string, unknown>) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    let errorMessage = `API Error: ${response.status}`;
    let details: Record<string, unknown> | undefined;

    try {
      const errorData = await response.json();
      errorMessage = errorData.detail || errorData.message || errorMessage;
      details = errorData;
    } catch {
      // Ignore JSON parse errors
    }

    throw new ApiError(errorMessage, response.status, details);
  }

  // Handle empty responses
  const text = await response.text();
  if (!text) {
    return {} as T;
  }

  return JSON.parse(text);
}

// ============================================================================
// Query string builder for filters
// ============================================================================

function buildQueryString(params: Record<string, unknown>): string {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== null && value !== undefined && value !== "") {
      searchParams.append(key, String(value));
    }
  }

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : "";
}

// ============================================================================
// Recipe API
// ============================================================================

export const recipeApi = {
  /**
   * List recipes with optional filters
   */
  list: (filters?: Partial<RecipeFilterDTO>): Promise<RecipeResponseDTO[]> => {
    const query = filters ? buildQueryString(filters) : "";
    return fetchApi<RecipeResponseDTO[]>(`/api/recipes${query}`);
  },

  /**
   * List recipes as lightweight cards
   */
  listCards: (filters?: {
    recipe_category?: string;
    meal_type?: string;
    favorites_only?: boolean;
    search_term?: string;
    limit?: number;
  }): Promise<RecipeCardDTO[]> => {
    const query = filters ? buildQueryString(filters) : "";
    return fetchApi<RecipeCardDTO[]>(`/api/recipes/cards${query}`);
  },

  /**
   * Get a single recipe by ID
   */
  get: (id: number): Promise<RecipeResponseDTO> =>
    fetchApi<RecipeResponseDTO>(`/api/recipes/${id}`),

  /**
   * Create a new recipe
   */
  create: (data: RecipeCreateDTO): Promise<RecipeResponseDTO> =>
    fetchApi<RecipeResponseDTO>("/api/recipes", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  /**
   * Update an existing recipe
   */
  update: (id: number, data: RecipeUpdateDTO): Promise<RecipeResponseDTO> =>
    fetchApi<RecipeResponseDTO>(`/api/recipes/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  /**
   * Delete a recipe
   */
  delete: (id: number): Promise<void> =>
    fetchApi<void>(`/api/recipes/${id}`, { method: "DELETE" }),

  /**
   * Toggle favorite status
   */
  toggleFavorite: (id: number): Promise<RecipeResponseDTO> =>
    fetchApi<RecipeResponseDTO>(`/api/recipes/${id}/favorite`, {
      method: "POST",
    }),

  /**
   * Get unique categories
   */
  getCategories: (): Promise<string[]> =>
    fetchApi<string[]>("/api/recipes/categories"),

  /**
   * Get unique meal types
   */
  getMealTypes: (): Promise<string[]> =>
    fetchApi<string[]>("/api/recipes/meal-types"),
};

// ============================================================================
// Meal Planner API
// ============================================================================

export const plannerApi = {
  /**
   * Get all meals
   */
  getMeals: (): Promise<MealSelectionResponseDTO[]> =>
    fetchApi<MealSelectionResponseDTO[]>("/api/meals"),

  /**
   * Get planner summary
   */
  getSummary: (): Promise<MealPlanSummaryDTO> =>
    fetchApi<MealPlanSummaryDTO>("/api/planner/summary"),

  /**
   * Get a single meal
   */
  getMeal: (id: number): Promise<MealSelectionResponseDTO> =>
    fetchApi<MealSelectionResponseDTO>(`/api/meals/${id}`),

  /**
   * Create a new meal
   */
  createMeal: (data: MealSelectionCreateDTO): Promise<MealSelectionResponseDTO> =>
    fetchApi<MealSelectionResponseDTO>("/api/meals", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  /**
   * Update an existing meal
   */
  updateMeal: (
    id: number,
    data: MealSelectionUpdateDTO
  ): Promise<MealSelectionResponseDTO> =>
    fetchApi<MealSelectionResponseDTO>(`/api/meals/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  /**
   * Delete a meal
   */
  deleteMeal: (id: number): Promise<void> =>
    fetchApi<void>(`/api/meals/${id}`, { method: "DELETE" }),

  /**
   * Toggle meal favorite status
   */
  toggleFavorite: (id: number): Promise<MealSelectionResponseDTO> =>
    fetchApi<MealSelectionResponseDTO>(`/api/meals/${id}/favorite`, {
      method: "POST",
    }),

  /**
   * Add a recipe as a side dish to a meal
   */
  addSideToMeal: (mealId: number, recipeId: number): Promise<MealSelectionResponseDTO> =>
    fetchApi<MealSelectionResponseDTO>(`/api/meals/${mealId}/sides/${recipeId}`, {
      method: "POST",
    }),

  /**
   * Clear planner entries
   */
  clearPlan: (): Promise<void> =>
    fetchApi<void>("/api/planner/clear", { method: "DELETE" }),

  /**
   * Remove a meal from the planner by meal ID (meal persists in Meals table)
   */
  removeFromPlanner: (mealId: number): Promise<{ message: string }> =>
    fetchApi<{ message: string }>(`/api/planner/entries/by-meal/${mealId}`, {
      method: "DELETE",
    }),

  // -------------------------------------------------------------------------
  // Planner Entry Methods (Weekly Menu)
  // -------------------------------------------------------------------------

  /**
   * Get all planner entries with hydrated meal data
   */
  getEntries: (): Promise<PlannerEntryResponseDTO[]> =>
    fetchApi<PlannerEntryResponseDTO[]>("/api/planner/entries"),

  /**
   * Add a meal to the planner (creates a PlannerEntry)
   */
  addToPlanner: (mealId: number): Promise<PlannerEntryResponseDTO> =>
    fetchApi<PlannerEntryResponseDTO>(`/api/planner/entries/${mealId}`, {
      method: "POST",
    }),

  /**
   * Remove a planner entry by entry ID (meal persists)
   */
  removeEntry: (entryId: number): Promise<{ message: string }> =>
    fetchApi<{ message: string }>(`/api/planner/entries/${entryId}`, {
      method: "DELETE",
    }),

  /**
   * Toggle completion status of a planner entry
   */
  toggleCompletion: (entryId: number): Promise<PlannerEntryResponseDTO> =>
    fetchApi<PlannerEntryResponseDTO>(`/api/planner/entries/${entryId}/toggle`, {
      method: "POST",
    }),

  /**
   * Toggle exclude_from_shopping status of a planner entry
   */
  toggleExcludeFromShopping: (entryId: number): Promise<PlannerEntryResponseDTO> =>
    fetchApi<PlannerEntryResponseDTO>(`/api/planner/entries/${entryId}/toggle-shopping`, {
      method: "POST",
    }),

  /**
   * Clear all completed planner entries
   */
  clearCompleted: (): Promise<{ message: string }> =>
    fetchApi<{ message: string }>("/api/planner/clear-completed", {
      method: "DELETE",
    }),

  /**
   * Reorder planner entries by providing entry IDs in desired order
   */
  reorderEntries: (
    entryIds: number[]
  ): Promise<{ success: boolean; message: string }> =>
    fetchApi<{ success: boolean; message: string }>("/api/planner/entries/reorder", {
      method: "PUT",
      body: JSON.stringify({ entry_ids: entryIds }),
    }),

  /**
   * Get cooking streak information
   * Sends user's timezone to ensure correct date calculations
   */
  getStreak: (): Promise<CookingStreakDTO> => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return fetchApi<CookingStreakDTO>(`/api/planner/streak?tz=${encodeURIComponent(tz)}`);
  },
};

// ============================================================================
// Shopping List API
// ============================================================================

export const shoppingApi = {
  /**
   * Get shopping list with optional filters
   * @param filters - Optional filter parameters
   * @param autoGenerate - If true, regenerates from planner before returning
   */
  getList: (filters?: ShoppingListFilterDTO, autoGenerate = false): Promise<ShoppingListResponseDTO> => {
    const params = { ...(filters || {}), auto_generate: autoGenerate };
    const query = buildQueryString(params as Record<string, unknown>);
    return fetchApi<ShoppingListResponseDTO>(`/api/shopping${query}`);
  },

  /**
   * Get a single shopping item
   */
  getItem: (id: number): Promise<ShoppingItemResponseDTO> =>
    fetchApi<ShoppingItemResponseDTO>(`/api/shopping/items/${id}`),

  /**
   * Add a manual item
   */
  addItem: (data: ManualItemCreateDTO): Promise<ShoppingItemResponseDTO> =>
    fetchApi<ShoppingItemResponseDTO>("/api/shopping/items", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  /**
   * Update a shopping item
   */
  updateItem: (
    id: number,
    data: ShoppingItemUpdateDTO
  ): Promise<ShoppingItemResponseDTO> =>
    fetchApi<ShoppingItemResponseDTO>(`/api/shopping/items/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  /**
   * Toggle item have status
   */
  toggleItem: (id: number): Promise<{ success: boolean }> =>
    fetchApi<{ success: boolean }>(`/api/shopping/items/${id}/toggle`, {
      method: "PATCH",
    }),

  /**
   * Toggle item flagged status
   */
  toggleFlagged: (id: number): Promise<{ success: boolean; flagged: boolean }> =>
    fetchApi<{ success: boolean; flagged: boolean }>(`/api/shopping/items/${id}/toggle-flag`, {
      method: "PATCH",
    }),

  /**
   * Delete a shopping item
   */
  deleteItem: (id: number): Promise<void> =>
    fetchApi<void>(`/api/shopping/items/${id}`, { method: "DELETE" }),

  /**
   * Generate shopping list from recipes
   */
  generate: (
    data: ShoppingListGenerationDTO
  ): Promise<ShoppingListGenerationResultDTO> =>
    fetchApi<ShoppingListGenerationResultDTO>("/api/shopping/generate", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  /**
   * Generate shopping list from active planner entries
   */
  generateFromPlanner: (): Promise<ShoppingListGenerationResultDTO> =>
    fetchApi<ShoppingListGenerationResultDTO>("/api/shopping/generate-from-planner", {
      method: "POST",
    }),

  /**
   * Clear entire shopping list
   */
  clear: (): Promise<BulkOperationResultDTO> =>
    fetchApi<BulkOperationResultDTO>("/api/shopping/clear", {
      method: "DELETE",
    }),

  /**
   * Clear only manual items
   */
  clearManual: (): Promise<BulkOperationResultDTO> =>
    fetchApi<BulkOperationResultDTO>("/api/shopping/clear-manual", {
      method: "DELETE",
    }),

  /**
   * Clear completed items
   */
  clearCompleted: (): Promise<{ message: string; deleted_count: number }> =>
    fetchApi<{ message: string; deleted_count: number }>(
      "/api/shopping/clear-completed",
      { method: "DELETE" }
    ),

  /**
   * Bulk update item status
   */
  bulkUpdate: (
    itemUpdates: Record<number, boolean>
  ): Promise<BulkOperationResultDTO> =>
    fetchApi<BulkOperationResultDTO>("/api/shopping/bulk-update", {
      method: "PATCH",
      body: JSON.stringify({ item_updates: itemUpdates }),
    }),

  /**
   * Get ingredient breakdown
   */
  getBreakdown: (recipeIds: number[]): Promise<IngredientBreakdownDTO[]> =>
    fetchApi<IngredientBreakdownDTO[]>(
      `/api/shopping/breakdown?recipe_ids=${recipeIds.join(",")}`
    ),
};

// ============================================================================
// Ingredients API
// ============================================================================

export const ingredientApi = {
  /**
   * List or search ingredients
   */
  list: (params?: {
    search_term?: string;
    category?: string;
    limit?: number;
    offset?: number;
  }): Promise<IngredientResponseDTO[]> => {
    const query = params ? buildQueryString(params) : "";
    return fetchApi<IngredientResponseDTO[]>(`/api/ingredients${query}`);
  },

  /**
   * Get ingredient categories
   */
  getCategories: (): Promise<string[]> =>
    fetchApi<string[]>("/api/ingredients/categories"),

  /**
   * Get ingredient names for autocomplete
   */
  getNames: (): Promise<string[]> =>
    fetchApi<string[]>("/api/ingredients/names"),

  /**
   * Get a single ingredient
   */
  get: (id: number): Promise<IngredientResponseDTO> =>
    fetchApi<IngredientResponseDTO>(`/api/ingredients/${id}`),

  /**
   * Create a new ingredient
   */
  create: (data: IngredientCreateDTO): Promise<IngredientResponseDTO> =>
    fetchApi<IngredientResponseDTO>("/api/ingredients", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  /**
   * Search ingredients
   */
  search: (data: IngredientSearchDTO): Promise<IngredientResponseDTO[]> =>
    fetchApi<IngredientResponseDTO[]>("/api/ingredients/search", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

// ============================================================================
// Type definitions for request DTOs (matching backend)
// ============================================================================

export interface RecipeIngredientDTO {
  existing_ingredient_id?: number | null;
  ingredient_name: string;
  ingredient_category: string;
  quantity?: number | null;
  unit?: string | null;
}

export interface RecipeCreateDTO {
  recipe_name: string;
  recipe_category: string;
  meal_type?: string;
  diet_pref?: string | null;
  total_time?: number | null;
  servings?: number | null;
  directions?: string | null;
  notes?: string | null;
  reference_image_path?: string | null;
  banner_image_path?: string | null;
  ingredients?: RecipeIngredientDTO[];
}

export interface RecipeUpdateDTO {
  recipe_name?: string;
  recipe_category?: string;
  meal_type?: string;
  diet_pref?: string | null;
  total_time?: number | null;
  servings?: number | null;
  directions?: string | null;
  notes?: string | null;
  reference_image_path?: string | null;
  banner_image_path?: string | null;
  ingredients?: RecipeIngredientDTO[];
  is_favorite?: boolean;
}

export interface MealSelectionCreateDTO {
  meal_name: string;
  main_recipe_id: number;
  side_recipe_ids?: number[];
  is_favorite?: boolean;
  tags?: string[];
}

export interface MealSelectionUpdateDTO {
  meal_name?: string;
  main_recipe_id?: number;
  side_recipe_ids?: number[];
  is_favorite?: boolean;
  tags?: string[];
}

export interface MealPlanSaveResultDTO {
  success: boolean;
  saved_count: number;
  invalid_ids: number[];
  message: string;
}

export interface ManualItemCreateDTO {
  ingredient_name: string;
  quantity: number;
  unit?: string | null;
  category?: string | null;
}

export interface ShoppingItemUpdateDTO {
  ingredient_name?: string;
  quantity?: number;
  unit?: string | null;
  category?: string | null;
  have?: boolean;
}

export interface ShoppingListFilterDTO {
  source?: "recipe" | "manual";
  category?: string;
  have?: boolean;
  search_term?: string;
  limit?: number;
  offset?: number;
}

export interface ShoppingListGenerationDTO {
  recipe_ids: number[];
  include_manual_items?: boolean;
  clear_existing?: boolean;
}

export interface BulkOperationResultDTO {
  success: boolean;
  updated_count: number;
  message: string;
  errors?: string[];
}

export interface IngredientCreateDTO {
  ingredient_name: string;
  ingredient_category: string;
}

export interface IngredientSearchDTO {
  search_term: string;
  category?: string | null;
  limit?: number | null;
  offset?: number | null;
}

export interface IngredientBreakdownDTO {
  ingredient_name: string;
  total_quantity: number;
  unit: string;
  recipe_contributions: {
    recipe_name: string;
    quantity: number;
    unit: string | null;
    usage_count: number;
  }[];
}

// ============================================================================
// Image Upload API
// ============================================================================

export const uploadApi = {
  /**
   * Upload a recipe image to Cloudinary
   * @param file - The image file to upload
   * @param recipeId - The recipe ID (used to organize the file)
   * @param imageType - Either "reference" (thumbnail) or "banner" (hero image)
   * @returns The path to the uploaded image
   */
  uploadRecipeImage: async (
    file: File,
    recipeId: number,
    imageType: "reference" | "banner" = "reference"
  ): Promise<{ success: boolean; path: string; filename: string }> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("recipeId", recipeId.toString());
    formData.append("imageType", imageType);

    const response = await fetch(`${API_BASE}/api/upload`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new ApiError(
        error.detail || "Failed to upload image",
        response.status
      );
    }

    return response.json();
  },
};

// ============================================================================
// Image Generation API
// ============================================================================

export const imageGenerationApi = {
  /**
   * Generate an AI image for a recipe based on its name
   * @param recipeName - The name of the recipe to generate an image for
   * @param customPrompt - Optional custom prompt template (must include {recipe_name})
   * @returns Response with base64 encoded image data on success
   */
  generate: (
    recipeName: string,
    customPrompt?: string
  ): Promise<ImageGenerationResponseDTO> =>
    fetchApi<ImageGenerationResponseDTO>("/api/generate-image", {
      method: "POST",
      body: JSON.stringify({
        recipe_name: recipeName,
        ...(customPrompt && { custom_prompt: customPrompt }),
      }),
    }),
};

// ============================================================================
// Cooking Tip API
// ============================================================================

export const cookingTipApi = {
  /**
   * Get a random cooking tip from AI
   * @returns Response with cooking tip on success
   */
  getTip: (): Promise<CookingTipResponseDTO> =>
    fetchApi<CookingTipResponseDTO>("/api/cooking-tip"),
};

// ============================================================================
// Meal Genie API
// ============================================================================

export const mealGenieApi = {
  /**
   * Send a message to Meal Genie and get an AI response
   * @param message The user's message
   * @param conversationHistory Optional previous messages for context
   * @returns Response with AI-generated answer
   */
  ask: (
    message: string,
    conversationHistory?: MealGenieMessage[]
  ): Promise<MealGenieResponseDTO> =>
    fetchApi<MealGenieResponseDTO>("/api/meal-genie/ask", {
      method: "POST",
      body: JSON.stringify({
        message,
        conversation_history: conversationHistory,
      }),
    }),
};

// ============================================================================
// Dashboard API
// ============================================================================

export const dashboardApi = {
  /**
   * Get lightweight dashboard statistics (counts only)
   * @returns Dashboard stats with recipe, meal, and shopping counts
   */
  getStats: (): Promise<DashboardStatsDTO> =>
    fetchApi<DashboardStatsDTO>("/api/dashboard/stats"),
};

// ============================================================================
// Data Management API (Import/Export)
// ============================================================================

export const dataManagementApi = {
  /**
   * Upload xlsx file and get import preview
   * @param file - The xlsx file to import
   * @returns Preview with duplicate info and validation errors
   */
  previewImport: async (file: File): Promise<ImportPreviewDTO> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${API_BASE}/api/data-management/import/preview`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new ApiError(
        error.detail || "Failed to preview import",
        response.status
      );
    }

    return response.json();
  },

  /**
   * Execute import with duplicate resolutions
   * @param file - The xlsx file to import
   * @param resolutions - How to handle each duplicate
   * @returns Result with counts and errors
   */
  executeImport: async (
    file: File,
    resolutions: DuplicateResolutionDTO[]
  ): Promise<ImportResultDTO> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("resolutions", JSON.stringify(resolutions));

    const response = await fetch(`${API_BASE}/api/data-management/import/execute`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new ApiError(
        error.detail || "Failed to execute import",
        response.status
      );
    }

    return response.json();
  },

  /**
   * Export recipes to xlsx file
   * @param filters - Optional filters for which recipes to export
   * @returns Blob of the xlsx file
   */
  exportRecipes: async (filters?: ExportFilterDTO): Promise<Blob> => {
    const query = filters ? buildQueryString(filters as Record<string, unknown>) : "";
    const response = await fetch(`${API_BASE}/api/data-management/export${query}`);

    if (!response.ok) {
      const error = await response.json();
      throw new ApiError(
        error.detail || "Failed to export recipes",
        response.status
      );
    }

    return response.blob();
  },

  /**
   * Download xlsx template for import
   * @returns Blob of the template file
   */
  downloadTemplate: async (): Promise<Blob> => {
    const response = await fetch(`${API_BASE}/api/data-management/template`);

    if (!response.ok) {
      const error = await response.json();
      throw new ApiError(
        error.detail || "Failed to download template",
        response.status
      );
    }

    return response.blob();
  },

  /**
   * Delete all data from the database
   * @returns Object with success status and counts of deleted records
   */
  clearAllData: async (): Promise<{ success: boolean; deleted_counts: Record<string, number> }> => {
    const response = await fetch(`${API_BASE}/api/data-management/clear-all`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new ApiError(
        error.detail || "Failed to clear data",
        response.status
      );
    }

    return response.json();
  },
};

// ============================================================================
// Feedback API
// ============================================================================

export interface FeedbackSubmitDTO {
  category: string;
  message: string;
  /** Optional metadata included with feedback (e.g., page URL, viewport) */
  metadata?: Record<string, string | undefined>;
}

export interface FeedbackResponseDTO {
  success: boolean;
  issue_url?: string;
  message: string;
}

export const feedbackApi = {
  /**
   * Submit user feedback as a GitHub issue
   * @param data - The feedback category and message
   * @returns Response with success status and optional issue URL
   */
  submit: (data: FeedbackSubmitDTO): Promise<FeedbackResponseDTO> =>
    fetchApi<FeedbackResponseDTO>("/api/feedback", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

// ============================================================================
// Unit Conversion Rules API
// ============================================================================

export interface UnitConversionRuleDTO {
  id: number;
  ingredient_name: string;
  from_unit: string;
  to_unit: string;
  factor: number;
  round_up: boolean;
  created_at: string;
}

export interface UnitConversionRuleCreateDTO {
  ingredient_name: string;
  from_unit: string;
  to_unit: string;
  factor: number;
  round_up?: boolean;
}

export const unitConversionApi = {
  /**
   * List all unit conversion rules
   */
  list: (): Promise<UnitConversionRuleDTO[]> =>
    fetchApi<UnitConversionRuleDTO[]>("/api/unit-conversions"),

  /**
   * Get a single rule by ID
   */
  get: (id: number): Promise<UnitConversionRuleDTO> =>
    fetchApi<UnitConversionRuleDTO>(`/api/unit-conversions/${id}`),

  /**
   * Create a new unit conversion rule
   */
  create: (data: UnitConversionRuleCreateDTO): Promise<UnitConversionRuleDTO> =>
    fetchApi<UnitConversionRuleDTO>("/api/unit-conversions", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  /**
   * Delete a unit conversion rule
   */
  delete: (id: number): Promise<void> =>
    fetchApi<void>(`/api/unit-conversions/${id}`, {
      method: "DELETE",
    }),
};

// Export the error class for use in components
export { ApiError };
