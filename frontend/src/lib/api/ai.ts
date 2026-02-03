import type {
  ImageGenerationResponseDTO,
  ImageGenerationType,
  BannerGenerationResponseDTO,
  CookingTipResponseDTO,
  MealGenieMessage,
  MealGenieResponseDTO,
  RecipeGenerationResponseDTO,
  MealSuggestionsRequestDTO,
  MealSuggestionsResponseDTO,
} from "@/types/ai";
import { fetchApi } from "./client";

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
    token?: string | null,
    imageType?: ImageGenerationType
  ): Promise<ImageGenerationResponseDTO> =>
    fetchApi<ImageGenerationResponseDTO>(
      "/api/ai/image-generation",
      {
        method: "POST",
        body: JSON.stringify({
          recipe_name: recipeName,
          ...(customPrompt && { custom_prompt: customPrompt }),
          ...(imageType && { image_type: imageType }),
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

export const cookingTipApi = {
  /**
   * Get a random cooking tip from AI
   * @param token - Optional auth token for authenticated requests
   * @returns Response with cooking tip on success
   */
  getTip: (token?: string | null): Promise<CookingTipResponseDTO> =>
    fetchApi<CookingTipResponseDTO>("/api/ai/cooking-tip", undefined, token),
};

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
