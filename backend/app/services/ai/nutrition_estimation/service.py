"""Service for estimating recipe nutrition facts using Gemini."""

import json
import logging
import re
from typing import Optional

from app.dtos.nutrition_dtos import (
    NutritionEstimationRequestDTO,
    NutritionEstimationResponseDTO,
)
from app.services.ai.gemini_client import get_gemini_client
from app.services.ai.parse_utils import parse_nutrition_dict
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

            nutrition = parse_nutrition_dict(data)

            if nutrition:
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


# Singleton instance
_service_instance: Optional[NutritionEstimationService] = None


def get_nutrition_estimation_service() -> NutritionEstimationService:
    """Get the singleton instance of the nutrition estimation service."""
    global _service_instance
    if _service_instance is None:
        _service_instance = NutritionEstimationService()
    return _service_instance
