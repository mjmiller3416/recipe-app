"""Service for estimating recipe nutrition facts using Gemini."""

import json
import logging
import re
from typing import Optional

from app.dtos.nutrition_dtos import (
    NutritionEstimationRequestDTO,
    NutritionEstimationResponseDTO,
    NutritionFactsDTO,
)
from app.services.ai.gemini_client import get_gemini_client
from app.services.ai.response_utils import extract_text_from_response

from .config import (
    API_KEY_ENV_VAR,
    MAX_OUTPUT_TOKENS,
    MODEL_NAME,
    PROMPT_TEMPLATE,
    TEMPERATURE,
)

logger = logging.getLogger(__name__)


class NutritionEstimationService:
    """Service for estimating nutrition facts using Gemini AI."""

    def __init__(self) -> None:
        """Initialize the nutrition estimation service."""
        get_gemini_client(API_KEY_ENV_VAR)

    def estimate(
        self, request: NutritionEstimationRequestDTO
    ) -> NutritionEstimationResponseDTO:
        """Estimate nutrition facts for a recipe based on its ingredients.

        Args:
            request: The estimation request with recipe name, ingredients, and servings.

        Returns:
            NutritionEstimationResponseDTO with estimated nutrition facts or error.
        """
        try:
            from google.genai import types

            client = get_gemini_client(API_KEY_ENV_VAR)

            # Build ingredients text
            ingredients_lines = []
            for ing in request.ingredients:
                parts = []
                if ing.quantity:
                    parts.append(str(ing.quantity))
                if ing.unit:
                    parts.append(ing.unit)
                parts.append(ing.ingredient_name)
                ingredients_lines.append("- " + " ".join(parts))

            ingredients_text = "\n".join(ingredients_lines) or "- No ingredients provided"
            servings = request.servings or 1

            prompt = PROMPT_TEMPLATE.format(
                recipe_name=request.recipe_name,
                servings=servings,
                ingredients_text=ingredients_text,
            )

            response = client.models.generate_content(
                model=MODEL_NAME,
                contents=[prompt],
                config=types.GenerateContentConfig(
                    temperature=TEMPERATURE,
                    max_output_tokens=MAX_OUTPUT_TOKENS,
                ),
            )

            raw_text = extract_text_from_response(response)
            if not raw_text:
                return NutritionEstimationResponseDTO(
                    success=False, error="No response from AI model"
                )

            # Extract JSON from response (handle markdown code blocks)
            json_match = re.search(r"\{[^}]+\}", raw_text, re.DOTALL)
            if not json_match:
                return NutritionEstimationResponseDTO(
                    success=False, error="Could not parse nutrition data from AI response"
                )

            data = json.loads(json_match.group())

            nutrition = NutritionFactsDTO(
                calories=_safe_int(data.get("calories")),
                protein_g=_safe_float(data.get("protein_g")),
                total_fat_g=_safe_float(data.get("total_fat_g")),
                saturated_fat_g=_safe_float(data.get("saturated_fat_g")),
                trans_fat_g=_safe_float(data.get("trans_fat_g")),
                cholesterol_mg=_safe_float(data.get("cholesterol_mg")),
                sodium_mg=_safe_float(data.get("sodium_mg")),
                total_carbs_g=_safe_float(data.get("total_carbs_g")),
                dietary_fiber_g=_safe_float(data.get("dietary_fiber_g")),
                total_sugars_g=_safe_float(data.get("total_sugars_g")),
                is_ai_estimated=True,
            )

            logger.info(
                f"[Nutrition] Estimated for '{request.recipe_name}': "
                f"{nutrition.calories} cal, {nutrition.protein_g}g protein"
            )

            return NutritionEstimationResponseDTO(
                success=True, nutrition_facts=nutrition
            )

        except json.JSONDecodeError as e:
            logger.error(f"[Nutrition] JSON parse error: {e}")
            return NutritionEstimationResponseDTO(
                success=False, error="Failed to parse nutrition data from AI response"
            )
        except ImportError:
            return NutritionEstimationResponseDTO(
                success=False, error="google-genai package is not installed"
            )
        except Exception as e:
            logger.error(f"[Nutrition] Estimation failed: {e}")
            return NutritionEstimationResponseDTO(
                success=False, error=f"Nutrition estimation failed: {str(e)}"
            )


def _safe_int(value: object) -> Optional[int]:
    """Safely convert a value to int, returning None on failure."""
    if value is None:
        return None
    try:
        return int(float(value))
    except (ValueError, TypeError):
        return None


def _safe_float(value: object) -> Optional[float]:
    """Safely convert a value to float, returning None on failure."""
    if value is None:
        return None
    try:
        return round(float(value), 1)
    except (ValueError, TypeError):
        return None


# Singleton instance
_service_instance: Optional[NutritionEstimationService] = None


def get_nutrition_estimation_service() -> NutritionEstimationService:
    """Get the singleton instance of the nutrition estimation service."""
    global _service_instance
    if _service_instance is None:
        _service_instance = NutritionEstimationService()
    return _service_instance
