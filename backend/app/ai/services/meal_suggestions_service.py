"""Service for generating meal-specific cooking tips using Gemini."""

import logging
import os
import re
from typing import Optional
from dotenv import load_dotenv

from app.ai.dtos.meal_suggestions_dtos import (
    MealSuggestionsRequestDTO,
    MealSuggestionsResponseDTO,
)
from app.ai.config.meal_suggestions_config import (
    MEAL_TIP_PROMPT,
    MODEL_NAME,
    TEMPERATURE,
    MAX_OUTPUT_TOKENS,
    API_KEY_ENV_VAR,
    API_KEY_ENV_VAR_ALT,
)

logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Lazy import to avoid issues if package not installed
_genai_client = None


def _get_genai_client():
    """Lazy initialization of Gemini client for meal suggestions."""
    global _genai_client
    if _genai_client is None:
        from google import genai

        # Use dedicated key if set, otherwise fall back to shared key
        api_key = os.getenv(API_KEY_ENV_VAR_ALT) or os.getenv(API_KEY_ENV_VAR)
        _genai_client = genai.Client(api_key=api_key)
    return _genai_client


def _clean_tip(tip: str) -> str:
    """Remove common prefixes and clean up formatting."""
    # Remove common prefixes
    tip = re.sub(r"^(Tip:|Chef's Tip:|Pro Tip:|Cooking Tip:|\*|\-|•)\s*", "", tip, flags=re.IGNORECASE)
    # Remove quotes if wrapped
    tip = tip.strip('"\'')
    return tip.strip()


class MealSuggestionsService:
    """Service for generating meal-specific cooking tips."""

    def __init__(self):
        """Initialize the meal suggestions service."""
        # Validate that at least one API key is set
        if not os.getenv(API_KEY_ENV_VAR_ALT) and not os.getenv(API_KEY_ENV_VAR):
            raise ValueError(
                f"Either {API_KEY_ENV_VAR_ALT} or {API_KEY_ENV_VAR} must be set"
            )

    def generate_suggestions(
        self, request: MealSuggestionsRequestDTO
    ) -> MealSuggestionsResponseDTO:
        """
        Generate a cooking tip for a meal.

        Args:
            request: The meal details to generate a tip for

        Returns:
            MealSuggestionsResponseDTO with tip or error
        """
        try:
            from google.genai import types

            client = _get_genai_client()

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
            if response and response.candidates:
                for candidate in response.candidates:
                    if candidate.content and candidate.content.parts:
                        for part in candidate.content.parts:
                            if hasattr(part, "text") and part.text:
                                tip_text = _clean_tip(part.text.strip())

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
