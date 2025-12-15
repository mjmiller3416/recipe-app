// src/lib/api.ts
// API client for Meal Genie backend

import type {
  RecipeResponseDTO,
  RecipeCardDTO,
  RecipeFilterDTO,
  MealSelectionResponseDTO,
  MealPlanSummaryDTO,
  ShoppingListResponseDTO,
  ShoppingItemResponseDTO,
  ShoppingListGenerationResultDTO,
  IngredientResponseDTO,
} from "@/types";

// API base URL from environment variable or default to localhost
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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
   * Get all meal selections
   */
  getMeals: (): Promise<MealSelectionResponseDTO[]> =>
    fetchApi<MealSelectionResponseDTO[]>("/api/planner/meals"),

  /**
   * Get saved meal plan
   */
  getSavedPlan: (): Promise<MealSelectionResponseDTO[]> =>
    fetchApi<MealSelectionResponseDTO[]>("/api/planner/saved"),

  /**
   * Get meal plan summary
   */
  getSummary: (): Promise<MealPlanSummaryDTO> =>
    fetchApi<MealPlanSummaryDTO>("/api/planner/summary"),

  /**
   * Get a single meal selection
   */
  getMeal: (id: number): Promise<MealSelectionResponseDTO> =>
    fetchApi<MealSelectionResponseDTO>(`/api/planner/meals/${id}`),

  /**
   * Create a new meal selection
   */
  createMeal: (data: MealSelectionCreateDTO): Promise<MealSelectionResponseDTO> =>
    fetchApi<MealSelectionResponseDTO>("/api/planner/meals", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  /**
   * Update an existing meal selection
   */
  updateMeal: (
    id: number,
    data: MealSelectionUpdateDTO
  ): Promise<MealSelectionResponseDTO> =>
    fetchApi<MealSelectionResponseDTO>(`/api/planner/meals/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  /**
   * Delete a meal selection
   */
  deleteMeal: (id: number): Promise<void> =>
    fetchApi<void>(`/api/planner/meals/${id}`, { method: "DELETE" }),

  /**
   * Save meal plan
   */
  savePlan: (mealIds: number[]): Promise<MealPlanSaveResultDTO> =>
    fetchApi<MealPlanSaveResultDTO>("/api/planner/save", {
      method: "POST",
      body: JSON.stringify(mealIds),
    }),

  /**
   * Clear meal plan
   */
  clearPlan: (): Promise<void> =>
    fetchApi<void>("/api/planner/clear", { method: "DELETE" }),
};

// ============================================================================
// Shopping List API
// ============================================================================

export const shoppingApi = {
  /**
   * Get shopping list with optional filters
   */
  getList: (filters?: ShoppingListFilterDTO): Promise<ShoppingListResponseDTO> => {
    const query = filters ? buildQueryString(filters) : "";
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
  side_recipe_1_id?: number | null;
  side_recipe_2_id?: number | null;
  side_recipe_3_id?: number | null;
}

export interface MealSelectionUpdateDTO {
  meal_name?: string;
  main_recipe_id?: number;
  side_recipe_1_id?: number | null;
  side_recipe_2_id?: number | null;
  side_recipe_3_id?: number | null;
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
  }[];
}

// Export the error class for use in components
export { ApiError };
