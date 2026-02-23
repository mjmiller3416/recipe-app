"""Service for generating meal-specific cooking tips using Gemini."""

import logging
from typing import Optional

from app.dtos.meal_suggestions_dtos import (
    MealSuggestionsRequestDTO,
    MealSuggestionsResponseDTO,
)
from app.services.ai.gemini_client import get_gemini_client
from app.services.ai.response_utils import extract_text_from_response
from app.services.ai.text_utils import clean_tip

from .config import (
    MEAL_TIP_PROMPT,
    MODEL_NAME,
    TEMPERATURE,
    MAX_OUTPUT_TOKENS,
    API_KEY_ENV_VAR,
    API_KEY_ENV_VAR_ALT,
)

logger = logging.getLogger(__name__)


class MealSuggestionsService:
    """Service for generating meal-specific cooking tips."""

    def __init__(self) -> None:
        """Initialize the meal suggestions service."""
        # Validate eagerly so we fail fast if misconfigured
        get_gemini_client(API_KEY_ENV_VAR, API_KEY_ENV_VAR_ALT)

    def generate_suggestions(
        self, request: MealSuggestionsRequestDTO
    ) -> MealSuggestionsResponseDTO:
        """Generate a cooking tip for a meal.

        Args:
            request: The meal details to generate a tip for.

        Returns:
            MealSuggestionsResponseDTO with tip or error.
        """
        try:
            from google.genai import types

            client = get_gemini_client(API_KEY_ENV_VAR, API_KEY_ENV_VAR_ALT)

            # Build context for the dish
            category_text = f" ({request.main_recipe_category})" if request.main_recipe_category else ""
            meal_type_text = f" for {request.meal_type}" if request.meal_type else ""

            user_prompt = f"Dish: {request.main_recipe_name}{category_text}{meal_type_text}"

            # Generate tip
            response = client.models.generate_content(
                model=MODEL_NAME,
                contents=[
                    {"role": "user", "parts": [{"text": MEAL_TIP_PROMPT}]},
                    {"role": "model", "parts": [{"text": "I understand. I'll provide a concise, practical cooking tip."}]},
                    {"role": "user", "parts": [{"text": user_prompt}]},
                ],
                config=types.GenerateContentConfig(
                    temperature=TEMPERATURE,
                    max_output_tokens=MAX_OUTPUT_TOKENS,
                ),
            )

            # Extract text from response
            tip_text = extract_text_from_response(response)
            if tip_text:
                tip_text = clean_tip(tip_text)

                logger.info(
                    f"[MealSuggestions] Generated tip for: {request.main_recipe_name}"
                )

                return MealSuggestionsResponseDTO(
                    success=True,
                    cooking_tip=tip_text,
                    error=None,
                )

            return MealSuggestionsResponseDTO(
                success=False,
                cooking_tip=None,
                error="Could not generate tip from AI response",
            )

        except ImportError:
            return MealSuggestionsResponseDTO(
                success=False,
                cooking_tip=None,
                error="google-genai package is not installed",
            )
        except Exception as e:
            logger.error(f"[MealSuggestions] Error generating tip: {e}")
            return MealSuggestionsResponseDTO(
                success=False,
                cooking_tip=None,
                error=str(e),
            )


# Singleton instance
_service_instance: Optional[MealSuggestionsService] = None


def get_meal_suggestions_service() -> MealSuggestionsService:
    """Get the singleton instance of the meal suggestions service."""
    global _service_instance
    if _service_instance is None:
        _service_instance = MealSuggestionsService()
    return _service_instance
