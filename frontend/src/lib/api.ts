// src/lib/api.ts
// API client for Meal Genie backend

import type {
  RecipeResponseDTO,
  RecipeCardDTO,
  RecipeFilterDTO,
  RecipeGroupResponseDTO,
  RecipeGroupCreateDTO,
  RecipeGroupUpdateDTO,
  RecipeGroupAssignmentDTO,
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
  FullBackup,
  RestorePreview,
  RestoreResult,
  ImageGenerationResponseDTO,
  BannerGenerationResponseDTO,
  CookingTipResponseDTO,
  CookingStreakDTO,
  DashboardStatsDTO,
  MealGenieMessage,
  MealGenieResponseDTO,
  RecipeGenerationResponseDTO,
  MealSuggestionsRequestDTO,
  MealSuggestionsResponseDTO,
  UnitsResponseDTO,
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
  options?: RequestInit,
  token?: string | null
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options?.headers as Record<string, string>),
  };

  // Add Authorization header if token is provided
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
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
   * @param filters - Optional filter parameters
   * @param token - Optional auth token for authenticated requests
   */
  list: (filters?: Partial<RecipeFilterDTO>, token?: string | null): Promise<RecipeResponseDTO[]> => {
    const query = filters ? buildQueryString(filters) : "";
    return fetchApi<RecipeResponseDTO[]>(`/api/recipes${query}`, undefined, token);
  },

  /**
   * List recipes as lightweight cards
   * @param filters - Optional filter parameters
   * @param token - Optional auth token for authenticated requests
   */
  listCards: (
    filters?: {
      recipe_category?: string;
      meal_type?: string;
      favorites_only?: boolean;
      search_term?: string;
      limit?: number;
    },
    token?: string | null
  ): Promise<RecipeCardDTO[]> => {
    const query = filters ? buildQueryString(filters) : "";
    return fetchApi<RecipeCardDTO[]>(`/api/recipes/cards${query}`, undefined, token);
  },

  /**
   * Get a single recipe by ID
   * @param id - Recipe ID
   * @param token - Optional auth token for authenticated requests
   */
  get: (id: number, token?: string | null): Promise<RecipeResponseDTO> =>
    fetchApi<RecipeResponseDTO>(`/api/recipes/${id}`, undefined, token),

  /**
   * Create a new recipe
   * @param data - Recipe data
   * @param token - Optional auth token for authenticated requests
   */
  create: (data: RecipeCreateDTO, token?: string | null): Promise<RecipeResponseDTO> =>
    fetchApi<RecipeResponseDTO>(
      "/api/recipes",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      token
    ),

  /**
   * Update an existing recipe
   * @param id - Recipe ID
   * @param data - Recipe data to update
   * @param token - Optional auth token for authenticated requests
   */
  update: (id: number, data: RecipeUpdateDTO, token?: string | null): Promise<RecipeResponseDTO> =>
    fetchApi<RecipeResponseDTO>(
      `/api/recipes/${id}`,
      {
        method: "PUT",
        body: JSON.stringify(data),
      },
      token
    ),

  /**
   * Delete a recipe
   * @param id - Recipe ID
   * @param token - Optional auth token for authenticated requests
   */
  delete: (id: number, token?: string | null): Promise<void> =>
    fetchApi<void>(`/api/recipes/${id}`, { method: "DELETE" }, token),

  /**
   * Toggle favorite status
   * @param id - Recipe ID
   * @param token - Optional auth token for authenticated requests
   */
  toggleFavorite: (id: number, token?: string | null): Promise<RecipeResponseDTO> =>
    fetchApi<RecipeResponseDTO>(
      `/api/recipes/${id}/favorite`,
      {
        method: "POST",
      },
      token
    ),

  /**
   * Get unique categories
   * @param token - Optional auth token for authenticated requests
   */
  getCategories: (token?: string | null): Promise<string[]> =>
    fetchApi<string[]>("/api/recipes/categories", undefined, token),

  /**
   * Get unique meal types
   * @param token - Optional auth token for authenticated requests
   */
  getMealTypes: (token?: string | null): Promise<string[]> =>
    fetchApi<string[]>("/api/recipes/meal-types", undefined, token),
};

// ============================================================================
// Meal Planner API
// ============================================================================

export const plannerApi = {
  /**
   * Get all meals, optionally filtered by saved status
   * @param filters - Optional filter parameters
   * @param token - Optional auth token for authenticated requests
   */
  getMeals: (filters?: { saved?: boolean }, token?: string | null): Promise<MealSelectionResponseDTO[]> => {
    const query = filters?.saved !== undefined ? `?saved=${filters.saved}` : "";
    return fetchApi<MealSelectionResponseDTO[]>(`/api/meals${query}`, undefined, token);
  },

  /**
   * Get planner summary
   * @param token - Optional auth token for authenticated requests
   */
  getSummary: (token?: string | null): Promise<MealPlanSummaryDTO> =>
    fetchApi<MealPlanSummaryDTO>("/api/planner/summary", undefined, token),

  /**
   * Get a single meal
   * @param id - Meal ID
   * @param token - Optional auth token for authenticated requests
   */
  getMeal: (id: number, token?: string | null): Promise<MealSelectionResponseDTO> =>
    fetchApi<MealSelectionResponseDTO>(`/api/meals/${id}`, undefined, token),

  /**
   * Create a new meal
   * @param data - Meal data
   * @param token - Optional auth token for authenticated requests
   */
  createMeal: (data: MealSelectionCreateDTO, token?: string | null): Promise<MealSelectionResponseDTO> =>
    fetchApi<MealSelectionResponseDTO>(
      "/api/meals",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      token
    ),

  /**
   * Update an existing meal
   * @param id - Meal ID
   * @param data - Meal data to update
   * @param token - Optional auth token for authenticated requests
   */
  updateMeal: (
    id: number,
    data: MealSelectionUpdateDTO,
    token?: string | null
  ): Promise<MealSelectionResponseDTO> =>
    fetchApi<MealSelectionResponseDTO>(
      `/api/meals/${id}`,
      {
        method: "PUT",
        body: JSON.stringify(data),
      },
      token
    ),

  /**
   * Delete a meal
   * @param id - Meal ID
   * @param token - Optional auth token for authenticated requests
   */
  deleteMeal: (id: number, token?: string | null): Promise<void> =>
    fetchApi<void>(`/api/meals/${id}`, { method: "DELETE" }, token),

  /**
   * Toggle meal saved status (saved meals persist after leaving planner)
   * @param id - Meal ID
   * @param token - Optional auth token for authenticated requests
   */
  toggleSave: (id: number, token?: string | null): Promise<MealSelectionResponseDTO> =>
    fetchApi<MealSelectionResponseDTO>(
      `/api/meals/${id}/save`,
      {
        method: "POST",
      },
      token
    ),

  /**
   * Add a recipe as a side dish to a meal
   * @param mealId - Meal ID
   * @param recipeId - Recipe ID to add as side
   * @param token - Optional auth token for authenticated requests
   */
  addSideToMeal: (mealId: number, recipeId: number, token?: string | null): Promise<MealSelectionResponseDTO> =>
    fetchApi<MealSelectionResponseDTO>(
      `/api/meals/${mealId}/sides/${recipeId}`,
      {
        method: "POST",
      },
      token
    ),

  /**
   * Clear planner entries
   * @param token - Optional auth token for authenticated requests
   */
  clearPlan: (token?: string | null): Promise<void> =>
    fetchApi<void>("/api/planner/clear", { method: "DELETE" }, token),

  /**
   * Remove a meal from the planner by meal ID (meal persists in Meals table)
   * @param mealId - Meal ID
   * @param token - Optional auth token for authenticated requests
   */
  removeFromPlanner: (mealId: number, token?: string | null): Promise<{ message: string }> =>
    fetchApi<{ message: string }>(
      `/api/planner/entries/by-meal/${mealId}`,
      {
        method: "DELETE",
      },
      token
    ),

  // -------------------------------------------------------------------------
  // Planner Entry Methods (Weekly Menu)
  // -------------------------------------------------------------------------

  /**
   * Get all planner entries with hydrated meal data
   * @param token - Optional auth token for authenticated requests
   */
  getEntries: (token?: string | null): Promise<PlannerEntryResponseDTO[]> =>
    fetchApi<PlannerEntryResponseDTO[]>("/api/planner/entries", undefined, token),

  /**
   * Add a meal to the planner (creates a PlannerEntry)
   * @param mealId - Meal ID
   * @param token - Optional auth token for authenticated requests
   */
  addToPlanner: (mealId: number, token?: string | null): Promise<PlannerEntryResponseDTO> =>
    fetchApi<PlannerEntryResponseDTO>(
      `/api/planner/entries/${mealId}`,
      {
        method: "POST",
      },
      token
    ),

  /**
   * Remove a planner entry by entry ID (meal persists)
   * @param entryId - Planner entry ID
   * @param token - Optional auth token for authenticated requests
   */
  removeEntry: (entryId: number, token?: string | null): Promise<{ message: string }> =>
    fetchApi<{ message: string }>(
      `/api/planner/entries/${entryId}`,
      {
        method: "DELETE",
      },
      token
    ),

  /**
   * Mark a planner entry as complete (records recipe history)
   * @param entryId - Planner entry ID
   * @param token - Optional auth token for authenticated requests
   */
  markComplete: (entryId: number, token?: string | null): Promise<PlannerEntryResponseDTO> =>
    fetchApi<PlannerEntryResponseDTO>(
      `/api/planner/entries/${entryId}/complete`,
      {
        method: "POST",
      },
      token
    ),

  /**
   * Mark a planner entry as incomplete
   * @param entryId - Planner entry ID
   * @param token - Optional auth token for authenticated requests
   */
  markIncomplete: (entryId: number, token?: string | null): Promise<PlannerEntryResponseDTO> =>
    fetchApi<PlannerEntryResponseDTO>(
      `/api/planner/entries/${entryId}/incomplete`,
      {
        method: "POST",
      },
      token
    ),

  /**
   * Cycle the shopping mode of a planner entry: all -> produce_only -> none -> all
   * @param entryId - Planner entry ID
   * @param token - Optional auth token for authenticated requests
   */
  cycleShoppingMode: (entryId: number, token?: string | null): Promise<PlannerEntryResponseDTO> =>
    fetchApi<PlannerEntryResponseDTO>(
      `/api/planner/entries/${entryId}/cycle-shopping-mode`,
      {
        method: "POST",
      },
      token
    ),

  /**
   * Clear all completed planner entries
   * @param token - Optional auth token for authenticated requests
   */
  clearCompleted: (token?: string | null): Promise<{ message: string }> =>
    fetchApi<{ message: string }>(
      "/api/planner/clear-completed",
      {
        method: "DELETE",
      },
      token
    ),

  /**
   * Reorder planner entries by providing entry IDs in desired order
   * @param entryIds - Array of entry IDs in desired order
   * @param token - Optional auth token for authenticated requests
   */
  reorderEntries: (
    entryIds: number[],
    token?: string | null
  ): Promise<{ success: boolean; message: string }> =>
    fetchApi<{ success: boolean; message: string }>(
      "/api/planner/entries/reorder",
      {
        method: "PUT",
        body: JSON.stringify({ entry_ids: entryIds }),
      },
      token
    ),

  /**
   * Get cooking streak information
   * Sends user's timezone to ensure correct date calculations
   * @param token - Optional auth token for authenticated requests
   */
  getStreak: (token?: string | null): Promise<CookingStreakDTO> => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return fetchApi<CookingStreakDTO>(
      `/api/planner/streak?tz=${encodeURIComponent(tz)}`,
      undefined,
      token
    );
  },
};

// ============================================================================
// Shopping List API
// ============================================================================

export const shoppingApi = {
  /**
   * Get shopping list with optional filters.
   * Shopping list is automatically synced when planner changes occur.
   * @param filters - Optional filter parameters
   * @param token - Optional auth token for authenticated requests
   */
  getList: (
    filters?: ShoppingListFilterDTO,
    token?: string | null
  ): Promise<ShoppingListResponseDTO> => {
    const query = filters ? buildQueryString(filters as Record<string, unknown>) : "";
    return fetchApi<ShoppingListResponseDTO>(`/api/shopping${query}`, undefined, token);
  },

  /**
   * Get a single shopping item
   * @param id - Shopping item ID
   * @param token - Optional auth token for authenticated requests
   */
  getItem: (id: number, token?: string | null): Promise<ShoppingItemResponseDTO> =>
    fetchApi<ShoppingItemResponseDTO>(`/api/shopping/items/${id}`, undefined, token),

  /**
   * Add a manual item
   * @param data - Manual item data
   * @param token - Optional auth token for authenticated requests
   */
  addItem: (data: ManualItemCreateDTO, token?: string | null): Promise<ShoppingItemResponseDTO> =>
    fetchApi<ShoppingItemResponseDTO>(
      "/api/shopping/items",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      token
    ),

  /**
   * Update a shopping item
   * @param id - Shopping item ID
   * @param data - Item data to update
   * @param token - Optional auth token for authenticated requests
   */
  updateItem: (
    id: number,
    data: ShoppingItemUpdateDTO,
    token?: string | null
  ): Promise<ShoppingItemResponseDTO> =>
    fetchApi<ShoppingItemResponseDTO>(
      `/api/shopping/items/${id}`,
      {
        method: "PATCH",
        body: JSON.stringify(data),
      },
      token
    ),

  /**
   * Toggle item have status
   * @param id - Shopping item ID
   * @param token - Optional auth token for authenticated requests
   */
  toggleItem: (id: number, token?: string | null): Promise<{ success: boolean }> =>
    fetchApi<{ success: boolean }>(
      `/api/shopping/items/${id}/toggle`,
      {
        method: "PATCH",
      },
      token
    ),

  /**
   * Toggle item flagged status
   * @param id - Shopping item ID
   * @param token - Optional auth token for authenticated requests
   */
  toggleFlagged: (id: number, token?: string | null): Promise<{ success: boolean; flagged: boolean }> =>
    fetchApi<{ success: boolean; flagged: boolean }>(
      `/api/shopping/items/${id}/toggle-flag`,
      {
        method: "PATCH",
      },
      token
    ),

  /**
   * Delete a shopping item
   * @param id - Shopping item ID
   * @param token - Optional auth token for authenticated requests
   */
  deleteItem: (id: number, token?: string | null): Promise<void> =>
    fetchApi<void>(`/api/shopping/items/${id}`, { method: "DELETE" }, token),

  /**
   * Generate shopping list from recipes
   * @param data - Generation parameters
   * @param token - Optional auth token for authenticated requests
   */
  generate: (
    data: ShoppingListGenerationDTO,
    token?: string | null
  ): Promise<ShoppingListGenerationResultDTO> =>
    fetchApi<ShoppingListGenerationResultDTO>(
      "/api/shopping/generate",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      token
    ),

  /**
   * Generate shopping list from active planner entries.
   * @deprecated Shopping list is now automatically synced when planner changes.
   * This method is kept for backwards compatibility but is no longer necessary.
   * @param token - Optional auth token for authenticated requests
   */
  generateFromPlanner: (token?: string | null): Promise<ShoppingListGenerationResultDTO> =>
    fetchApi<ShoppingListGenerationResultDTO>(
      "/api/shopping/generate-from-planner",
      {
        method: "POST",
      },
      token
    ),

  /**
   * Clear entire shopping list
   * @param token - Optional auth token for authenticated requests
   */
  clear: (token?: string | null): Promise<BulkOperationResultDTO> =>
    fetchApi<BulkOperationResultDTO>(
      "/api/shopping/clear",
      {
        method: "DELETE",
      },
      token
    ),

  /**
   * Clear only manual items
   * @param token - Optional auth token for authenticated requests
   */
  clearManual: (token?: string | null): Promise<BulkOperationResultDTO> =>
    fetchApi<BulkOperationResultDTO>(
      "/api/shopping/clear-manual",
      {
        method: "DELETE",
      },
      token
    ),

  /**
   * Clear completed items
   * @param token - Optional auth token for authenticated requests
   */
  clearCompleted: (token?: string | null): Promise<{ message: string; deleted_count: number }> =>
    fetchApi<{ message: string; deleted_count: number }>(
      "/api/shopping/clear-completed",
      { method: "DELETE" },
      token
    ),

  /**
   * Bulk update item status
   * @param itemUpdates - Map of item IDs to their new have status
   * @param token - Optional auth token for authenticated requests
   */
  bulkUpdate: (
    itemUpdates: Record<number, boolean>,
    token?: string | null
  ): Promise<BulkOperationResultDTO> =>
    fetchApi<BulkOperationResultDTO>(
      "/api/shopping/bulk-update",
      {
        method: "PATCH",
        body: JSON.stringify({ item_updates: itemUpdates }),
      },
      token
    ),

  /**
   * Get ingredient breakdown
   * @param recipeIds - Array of recipe IDs
   * @param token - Optional auth token for authenticated requests
   */
  getBreakdown: (recipeIds: number[], token?: string | null): Promise<IngredientBreakdownDTO[]> =>
    fetchApi<IngredientBreakdownDTO[]>(
      `/api/shopping/breakdown?recipe_ids=${recipeIds.join(",")}`,
      undefined,
      token
    ),
};

// ============================================================================
// Ingredients API
// ============================================================================

export const ingredientApi = {
  /**
   * List or search ingredients
   * @param params - Optional search parameters
   * @param token - Optional auth token for authenticated requests
   */
  list: (
    params?: {
      search_term?: string;
      category?: string;
      limit?: number;
      offset?: number;
    },
    token?: string | null
  ): Promise<IngredientResponseDTO[]> => {
    const query = params ? buildQueryString(params) : "";
    return fetchApi<IngredientResponseDTO[]>(`/api/ingredients${query}`, undefined, token);
  },

  /**
   * Get ingredient categories
   * @param token - Optional auth token for authenticated requests
   */
  getCategories: (token?: string | null): Promise<string[]> =>
    fetchApi<string[]>("/api/ingredients/categories", undefined, token),

  /**
   * Get ingredient names for autocomplete
   * @param token - Optional auth token for authenticated requests
   */
  getNames: (token?: string | null): Promise<string[]> =>
    fetchApi<string[]>("/api/ingredients/names", undefined, token),

  /**
   * Get a single ingredient
   * @param id - Ingredient ID
   * @param token - Optional auth token for authenticated requests
   */
  get: (id: number, token?: string | null): Promise<IngredientResponseDTO> =>
    fetchApi<IngredientResponseDTO>(`/api/ingredients/${id}`, undefined, token),

  /**
   * Create a new ingredient
   * @param data - Ingredient data
   * @param token - Optional auth token for authenticated requests
   */
  create: (data: IngredientCreateDTO, token?: string | null): Promise<IngredientResponseDTO> =>
    fetchApi<IngredientResponseDTO>(
      "/api/ingredients",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      token
    ),

  /**
   * Search ingredients
   * @param data - Search parameters
   * @param token - Optional auth token for authenticated requests
   */
  search: (data: IngredientSearchDTO, token?: string | null): Promise<IngredientResponseDTO[]> =>
    fetchApi<IngredientResponseDTO[]>(
      "/api/ingredients/search",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      token
    ),
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
  tags?: string[];
}

export interface MealSelectionUpdateDTO {
  meal_name?: string;
  main_recipe_id?: number;
  side_recipe_ids?: number[];
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
   * @param token - Optional auth token for authenticated requests
   * @returns The path to the uploaded image
   */
  uploadRecipeImage: async (
    file: File,
    recipeId: number,
    imageType: "reference" | "banner" = "reference",
    token?: string | null
  ): Promise<{ success: boolean; path: string; filename: string }> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("recipeId", recipeId.toString());
    formData.append("imageType", imageType);

    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}/api/upload`, {
      method: "POST",
      body: formData,
      headers,
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

  /**
   * Upload a base64 encoded image to Cloudinary
   * Used for AI-generated images
   * @param imageData - Base64 encoded image data
   * @param recipeId - The recipe ID (used to organize the file)
   * @param imageType - Either "reference" (thumbnail) or "banner" (hero image)
   * @param token - Optional auth token for authenticated requests
   * @returns The path to the uploaded image
   */
  uploadBase64Image: async (
    imageData: string,
    recipeId: number,
    imageType: "reference" | "banner" = "reference",
    token?: string | null
  ): Promise<{ success: boolean; path: string; filename: string }> => {
    const formData = new FormData();
    formData.append("image_data", imageData);
    formData.append("recipeId", recipeId.toString());
    formData.append("imageType", imageType);

    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}/api/upload/base64`, {
      method: "POST",
      body: formData,
      headers,
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
   * @param token - Optional auth token for authenticated requests
   * @returns Response with base64 encoded image data on success
   */
  generate: (
    recipeName: string,
    customPrompt?: string,
    token?: string | null
  ): Promise<ImageGenerationResponseDTO> =>
    fetchApi<ImageGenerationResponseDTO>(
      "/api/ai/image-generation",
      {
        method: "POST",
        body: JSON.stringify({
          recipe_name: recipeName,
          ...(customPrompt && { custom_prompt: customPrompt }),
        }),
      },
      token
    ),

  /**
   * Generate a banner image from a reference image
   * @param recipeName - The name of the recipe
   * @param referenceImageData - Base64 encoded reference image
   * @param token - Optional auth token for authenticated requests
   * @returns Response with base64 encoded banner image data on success
   */
  generateBanner: (
    recipeName: string,
    referenceImageData: string,
    token?: string | null
  ): Promise<BannerGenerationResponseDTO> =>
    fetchApi<BannerGenerationResponseDTO>(
      "/api/ai/image-generation/banner",
      {
        method: "POST",
        body: JSON.stringify({
          recipe_name: recipeName,
          reference_image_data: referenceImageData,
        }),
      },
      token
    ),
};

// ============================================================================
// Cooking Tip API
// ============================================================================

export const cookingTipApi = {
  /**
   * Get a random cooking tip from AI
   * @param token - Optional auth token for authenticated requests
   * @returns Response with cooking tip on success
   */
  getTip: (token?: string | null): Promise<CookingTipResponseDTO> =>
    fetchApi<CookingTipResponseDTO>("/api/ai/cooking-tip", undefined, token),
};

// ============================================================================
// Meal Suggestions API
// ============================================================================

export const mealSuggestionsApi = {
  /**
   * Get AI-powered side dish suggestions and cooking tip for a meal
   * @param request The meal details to generate suggestions for
   * @param token - Optional auth token for authenticated requests
   * @returns Response with suggestions on success
   */
  getSuggestions: (
    request: MealSuggestionsRequestDTO,
    token?: string | null
  ): Promise<MealSuggestionsResponseDTO> =>
    fetchApi<MealSuggestionsResponseDTO>(
      "/api/ai/meal-suggestions",
      {
        method: "POST",
        body: JSON.stringify(request),
      },
      token
    ),
};

// ============================================================================
// Meal Genie API
// ============================================================================

export const mealGenieApi = {
  /**
   * Send a message to Meal Genie
   * AI decides whether to chat, suggest recipes, or generate a full recipe
   * @param message The user's message
   * @param conversationHistory Optional previous messages for context
   * @param token - Optional auth token for authenticated requests
   * @returns Response with AI-generated answer, optionally including recipe
   */
  chat: (
    message: string,
    conversationHistory?: MealGenieMessage[],
    token?: string | null
  ): Promise<MealGenieResponseDTO> =>
    fetchApi<MealGenieResponseDTO>(
      "/api/ai/meal-genie/chat",
      {
        method: "POST",
        body: JSON.stringify({
          message,
          conversation_history: conversationHistory,
        }),
      },
      token
    ),

  /**
   * Send a message to Meal Genie (alias for chat)
   * @deprecated Use chat() instead
   * @param message The user's message
   * @param conversationHistory Optional previous messages for context
   * @param token - Optional auth token for authenticated requests
   */
  ask: (
    message: string,
    conversationHistory?: MealGenieMessage[],
    token?: string | null
  ): Promise<MealGenieResponseDTO> =>
    fetchApi<MealGenieResponseDTO>(
      "/api/ai/meal-genie/chat",
      {
        method: "POST",
        body: JSON.stringify({
          message,
          conversation_history: conversationHistory,
        }),
      },
      token
    ),

  /**
   * Generate a recipe with optional AI image
   * @deprecated Use chat() instead - it handles recipe generation automatically
   * @param message The user's message/request
   * @param conversationHistory Optional previous messages for context
   * @param generateImage Whether to generate an AI image (default: true)
   * @param token - Optional auth token for authenticated requests
   * @returns Response with generated recipe and optional image
   */
  generateRecipe: (
    message: string,
    conversationHistory?: MealGenieMessage[],
    generateImage = true,
    token?: string | null
  ): Promise<RecipeGenerationResponseDTO> =>
    fetchApi<RecipeGenerationResponseDTO>(
      "/api/ai/meal-genie/generate-recipe",
      {
        method: "POST",
        body: JSON.stringify({
          message,
          conversation_history: conversationHistory,
          generate_image: generateImage,
        }),
      },
      token
    ),
};

// ============================================================================
// Dashboard API
// ============================================================================

export const dashboardApi = {
  /**
   * Get lightweight dashboard statistics (counts only)
   * @param token - Optional auth token for authenticated requests
   * @returns Dashboard stats with recipe, meal, and shopping counts
   */
  getStats: (token?: string | null): Promise<DashboardStatsDTO> =>
    fetchApi<DashboardStatsDTO>("/api/dashboard/stats", undefined, token),
};

// ============================================================================
// Data Management API (Import/Export)
// ============================================================================

export const dataManagementApi = {
  /**
   * Upload xlsx file and get import preview
   * @param file - The xlsx file to import
   * @param token - Optional auth token for authenticated requests
   * @returns Preview with duplicate info and validation errors
   */
  previewImport: async (file: File, token?: string | null): Promise<ImportPreviewDTO> => {
    const formData = new FormData();
    formData.append("file", file);

    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}/api/data-management/import/preview`, {
      method: "POST",
      body: formData,
      headers,
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
   * @param token - Optional auth token for authenticated requests
   * @returns Result with counts and errors
   */
  executeImport: async (
    file: File,
    resolutions: DuplicateResolutionDTO[],
    token?: string | null
  ): Promise<ImportResultDTO> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("resolutions", JSON.stringify(resolutions));

    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}/api/data-management/import/execute`, {
      method: "POST",
      body: formData,
      headers,
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
   * @param token - Optional auth token for authenticated requests
   * @returns Blob of the xlsx file
   */
  exportRecipes: async (filters?: ExportFilterDTO, token?: string | null): Promise<Blob> => {
    const query = filters ? buildQueryString(filters as Record<string, unknown>) : "";

    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}/api/data-management/export${query}`, { headers });

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
   * @param token - Optional auth token for authenticated requests
   * @returns Blob of the template file
   */
  downloadTemplate: async (token?: string | null): Promise<Blob> => {
    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}/api/data-management/template`, { headers });

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
   * @param token - Optional auth token for authenticated requests
   * @returns Object with success status and counts of deleted records
   */
  clearAllData: async (token?: string | null): Promise<{ success: boolean; deleted_counts: Record<string, number> }> => {
    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}/api/data-management/clear-all`, {
      method: "DELETE",
      headers,
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

  /**
   * Export full backup including all database data
   * @param token - Optional auth token for authenticated requests
   * @returns FullBackup object (frontend adds settings before download)
   */
  exportFullBackup: async (token?: string | null): Promise<FullBackup> => {
    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}/api/data-management/backup/full`, { headers });

    if (!response.ok) {
      const error = await response.json();
      throw new ApiError(
        error.detail || "Failed to export backup",
        response.status
      );
    }

    return response.json();
  },

  /**
   * Preview restore from backup file
   * @param file - The JSON backup file
   * @param token - Optional auth token for authenticated requests
   * @returns RestorePreview with counts and warnings
   */
  previewRestore: async (file: File, token?: string | null): Promise<RestorePreview> => {
    const formData = new FormData();
    formData.append("file", file);

    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}/api/data-management/restore/preview`, {
      method: "POST",
      body: formData,
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new ApiError(
        error.detail || "Failed to preview restore",
        response.status
      );
    }

    return response.json();
  },

  /**
   * Execute restore from backup file
   * @param file - The JSON backup file
   * @param clearExisting - Whether to clear existing data first (default true)
   * @param token - Optional auth token for authenticated requests
   * @returns RestoreResult with counts, errors, and settings to restore
   */
  executeRestore: async (
    file: File,
    clearExisting: boolean = true,
    token?: string | null
  ): Promise<RestoreResult> => {
    const formData = new FormData();
    formData.append("file", file);

    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(
      `${API_BASE}/api/data-management/restore/execute?clear_existing=${clearExisting}`,
      {
        method: "POST",
        body: formData,
        headers,
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new ApiError(
        error.detail || "Failed to execute restore",
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
   * @param token - Optional auth token for authenticated requests
   * @returns Response with success status and optional issue URL
   */
  submit: (data: FeedbackSubmitDTO, token?: string | null): Promise<FeedbackResponseDTO> =>
    fetchApi<FeedbackResponseDTO>(
      "/api/feedback",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      token
    ),
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
   * Get all available ingredient units
   * @param token - Optional auth token for authenticated requests
   */
  getUnits: (token?: string | null): Promise<UnitsResponseDTO> =>
    fetchApi<UnitsResponseDTO>("/api/unit-conversions/units", undefined, token),

  /**
   * List all unit conversion rules
   * @param token - Optional auth token for authenticated requests
   */
  list: (token?: string | null): Promise<UnitConversionRuleDTO[]> =>
    fetchApi<UnitConversionRuleDTO[]>("/api/unit-conversions", undefined, token),

  /**
   * Get a single rule by ID
   * @param id - Rule ID
   * @param token - Optional auth token for authenticated requests
   */
  get: (id: number, token?: string | null): Promise<UnitConversionRuleDTO> =>
    fetchApi<UnitConversionRuleDTO>(`/api/unit-conversions/${id}`, undefined, token),

  /**
   * Create a new unit conversion rule
   * @param data - Rule data
   * @param token - Optional auth token for authenticated requests
   */
  create: (data: UnitConversionRuleCreateDTO, token?: string | null): Promise<UnitConversionRuleDTO> =>
    fetchApi<UnitConversionRuleDTO>(
      "/api/unit-conversions",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      token
    ),

  /**
   * Delete a unit conversion rule
   * @param id - Rule ID
   * @param token - Optional auth token for authenticated requests
   */
  delete: (id: number, token?: string | null): Promise<void> =>
    fetchApi<void>(
      `/api/unit-conversions/${id}`,
      {
        method: "DELETE",
      },
      token
    ),
};

// ============================================================================
// Settings API
// ============================================================================

export const settingsApi = {
  /**
   * Get current user's settings
   * @param token - Auth token for authenticated requests
   * @returns User settings object
   */
  get: (token: string | null): Promise<Record<string, unknown>> =>
    fetchApi<Record<string, unknown>>("/api/settings", undefined, token),

  /**
   * Replace all user settings with provided values
   * @param settings - Complete settings object
   * @param token - Auth token for authenticated requests
   * @returns Updated settings object
   */
  replace: (settings: Record<string, unknown>, token: string | null): Promise<Record<string, unknown>> =>
    fetchApi<Record<string, unknown>>(
      "/api/settings",
      {
        method: "PUT",
        body: JSON.stringify(settings),
      },
      token
    ),

  /**
   * Merge provided settings with existing settings (partial update)
   * @param partialSettings - Partial settings to merge
   * @param token - Auth token for authenticated requests
   * @returns Updated settings object
   */
  update: (partialSettings: Record<string, unknown>, token: string | null): Promise<Record<string, unknown>> =>
    fetchApi<Record<string, unknown>>(
      "/api/settings",
      {
        method: "PATCH",
        body: JSON.stringify(partialSettings),
      },
      token
    ),
};

// ============================================================================
// Recipe Groups API
// ============================================================================

export const recipeGroupApi = {
  /**
   * List all recipe groups for the current user
   * @param token - Auth token for authenticated requests
   * @returns Array of recipe groups with recipe counts
   */
  list: (token: string | null): Promise<RecipeGroupResponseDTO[]> =>
    fetchApi<RecipeGroupResponseDTO[]>("/api/recipe-groups", undefined, token),

  /**
   * Get a single recipe group by ID
   * @param id - Group ID
   * @param token - Auth token for authenticated requests
   * @returns Recipe group details
   */
  get: (id: number, token: string | null): Promise<RecipeGroupResponseDTO> =>
    fetchApi<RecipeGroupResponseDTO>(`/api/recipe-groups/${id}`, undefined, token),

  /**
   * Create a new recipe group
   * @param data - Group data (name)
   * @param token - Auth token for authenticated requests
   * @returns Created recipe group
   */
  create: (data: RecipeGroupCreateDTO, token: string | null): Promise<RecipeGroupResponseDTO> =>
    fetchApi<RecipeGroupResponseDTO>(
      "/api/recipe-groups",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      token
    ),

  /**
   * Update a recipe group's name
   * @param id - Group ID
   * @param data - Updated group data
   * @param token - Auth token for authenticated requests
   * @returns Updated recipe group
   */
  update: (id: number, data: RecipeGroupUpdateDTO, token: string | null): Promise<RecipeGroupResponseDTO> =>
    fetchApi<RecipeGroupResponseDTO>(
      `/api/recipe-groups/${id}`,
      {
        method: "PUT",
        body: JSON.stringify(data),
      },
      token
    ),

  /**
   * Delete a recipe group
   * @param id - Group ID
   * @param token - Auth token for authenticated requests
   */
  delete: (id: number, token: string | null): Promise<void> =>
    fetchApi<void>(
      `/api/recipe-groups/${id}`,
      {
        method: "DELETE",
      },
      token
    ),

  /**
   * Get all groups that contain a specific recipe
   * @param recipeId - Recipe ID
   * @param token - Auth token for authenticated requests
   * @returns Array of groups containing this recipe
   */
  getGroupsForRecipe: (recipeId: number, token: string | null): Promise<RecipeGroupResponseDTO[]> =>
    fetchApi<RecipeGroupResponseDTO[]>(
      `/api/recipe-groups/by-recipe/${recipeId}`,
      undefined,
      token
    ),

  /**
   * Assign a recipe to specific groups (replaces existing assignments)
   * @param recipeId - Recipe ID
   * @param data - Group IDs to assign
   * @param token - Auth token for authenticated requests
   * @returns Updated list of groups for the recipe
   */
  assignRecipeToGroups: (
    recipeId: number,
    data: RecipeGroupAssignmentDTO,
    token: string | null
  ): Promise<RecipeGroupResponseDTO[]> =>
    fetchApi<RecipeGroupResponseDTO[]>(
      `/api/recipe-groups/by-recipe/${recipeId}/assign`,
      {
        method: "PUT",
        body: JSON.stringify(data),
      },
      token
    ),

  /**
   * Add a recipe to a group
   * @param groupId - Group ID
   * @param recipeId - Recipe ID
   * @param token - Auth token for authenticated requests
   * @returns Updated recipe group
   */
  addRecipeToGroup: (
    groupId: number,
    recipeId: number,
    token: string | null
  ): Promise<RecipeGroupResponseDTO> =>
    fetchApi<RecipeGroupResponseDTO>(
      `/api/recipe-groups/${groupId}/recipes/${recipeId}`,
      {
        method: "POST",
      },
      token
    ),

  /**
   * Remove a recipe from a group
   * @param groupId - Group ID
   * @param recipeId - Recipe ID
   * @param token - Auth token for authenticated requests
   * @returns Updated recipe group
   */
  removeRecipeFromGroup: (
    groupId: number,
    recipeId: number,
    token: string | null
  ): Promise<RecipeGroupResponseDTO> =>
    fetchApi<RecipeGroupResponseDTO>(
      `/api/recipe-groups/${groupId}/recipes/${recipeId}`,
      {
        method: "DELETE",
      },
      token
    ),
};

// Export the error class for use in components
export { ApiError };
