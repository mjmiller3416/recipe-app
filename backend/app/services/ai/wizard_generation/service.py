"""Service for generating complete recipes via the wizard using Gemini."""

import json
import logging
from typing import Optional

from app.dtos.assistant_dtos import GeneratedIngredientDTO
from app.dtos.nutrition_dtos import NutritionFactsDTO
from app.dtos.wizard_dtos import (
    WizardGeneratedRecipeDTO,
    WizardGenerationRequestDTO,
    WizardGenerationResponseDTO,
)
from app.services.ai.gemini_client import get_gemini_client
from app.services.ai.parse_utils import parse_nutrition_dict, safe_int
from app.services.ai.response_utils import extract_text_from_response

from .config import (
    API_KEY_ENV_VAR,
    MAX_OUTPUT_TOKENS,
    MODEL_NAME,
    NUTRITION_SCHEMA,
    PROMPT_TEMPLATE,
    TEMPERATURE,
)

logger = logging.getLogger(__name__)


# ── Domain Exceptions ────────────────────────────────────────────────────────


class WizardGenerationError(Exception):
    """Raised when recipe generation fails."""

    pass


class WizardParseError(Exception):
    """Raised when AI response cannot be parsed."""

    pass


# ── Service ──────────────────────────────────────────────────────────────────


class WizardGenerationService:
    """Service for generating complete recipes using Gemini AI."""

    def __init__(self) -> None:
        """Initialize the wizard generation service."""
        get_gemini_client(API_KEY_ENV_VAR)

    def generate(
        self, request: WizardGenerationRequestDTO
    ) -> WizardGenerationResponseDTO:
        """Generate a complete recipe from a user prompt and optional preferences.

        Args:
            request: The generation request with prompt, preferences, and flags.

        Returns:
            WizardGenerationResponseDTO with recipe data, optional nutrition and images.

        Raises:
            WizardGenerationError: If the generation process fails entirely.
            WizardParseError: If the AI response cannot be parsed.
        """
        try:
            from google.genai import types

            client = get_gemini_client(API_KEY_ENV_VAR)

            # Build preferences text
            preferences_text = self._build_preferences_text(request)

            # Include nutrition schema in prompt if requested
            nutrition_schema = NUTRITION_SCHEMA if request.estimate_nutrition else ""

            prompt = PROMPT_TEMPLATE.format(
                prompt=request.prompt,
                preferences_text=preferences_text,
                nutrition_schema=nutrition_schema,
            )

            response = client.models.generate_content(
                model=MODEL_NAME,
                contents=[{"role": "user", "parts": [{"text": prompt}]}],
                config={
                    "temperature": TEMPERATURE,
                    "max_output_tokens": MAX_OUTPUT_TOKENS,
                    "response_mime_type": "application/json",
                },
            )

            raw_text = extract_text_from_response(response)
            if not raw_text:
                raise WizardGenerationError("No response from AI model")

            data = json.loads(raw_text)

            # Parse recipe
            recipe = self._parse_recipe(data)

            # Parse nutrition if included
            nutrition_facts: Optional[NutritionFactsDTO] = None
            if request.estimate_nutrition and "nutrition_facts" in data:
                nutrition_facts = parse_nutrition_dict(data["nutrition_facts"])

            logger.info(
                f"[Wizard] Generated recipe '{recipe.recipe_name}' "
                f"with {len(recipe.ingredients)} ingredients"
            )

            # Optional image generation
            reference_image_data: Optional[str] = None
            banner_image_data: Optional[str] = None
            if request.generate_image:
                reference_image_data, banner_image_data = (
                    self._generate_images(recipe.recipe_name)
                )

            return WizardGenerationResponseDTO(
                success=True,
                recipe=recipe,
                nutrition_facts=nutrition_facts,
                reference_image_data=reference_image_data,
                banner_image_data=banner_image_data,
            )

        except json.JSONDecodeError as e:
            logger.error(f"[Wizard] JSON parse error: {e}")
            raise WizardParseError(
                "Failed to parse recipe data from AI response"
            ) from e
        except (WizardGenerationError, WizardParseError):
            raise
        except ImportError as e:
            raise WizardGenerationError(
                "google-genai package is not installed"
            ) from e
        except Exception as e:
            logger.error(f"[Wizard] Generation failed: {e}")
            raise WizardGenerationError(
                f"Recipe generation failed: {str(e)}"
            ) from e

    # ── Private Helpers ──────────────────────────────────────────────────────

    @staticmethod
    def _build_preferences_text(request: WizardGenerationRequestDTO) -> str:
        """Build a preferences section for the prompt."""
        if not request.preferences:
            return ""

        prefs = request.preferences
        lines: list[str] = []
        if prefs.cuisine:
            lines.append(f"Cuisine: {prefs.cuisine}")
        if prefs.dietary:
            lines.append(f"Dietary preference: {prefs.dietary}")
        if prefs.difficulty:
            lines.append(f"Difficulty level: {prefs.difficulty}")
        if prefs.servings:
            lines.append(f"Servings: {prefs.servings}")
        if prefs.meal_type:
            lines.append(f"Meal type: {prefs.meal_type}")

        if not lines:
            return ""
        return "\nPreferences:\n" + "\n".join(f"- {line}" for line in lines)

    @staticmethod
    def _parse_recipe(data: dict) -> WizardGeneratedRecipeDTO:
        """Parse a recipe from the AI JSON response."""
        ingredients = [
            GeneratedIngredientDTO(**ing)
            for ing in data.get("ingredients", [])
        ]

        return WizardGeneratedRecipeDTO(
            recipe_name=data.get("recipe_name", "Untitled Recipe"),
            recipe_category=data.get("recipe_category", "other"),
            meal_type=data.get("meal_type", "dinner"),
            diet_pref=data.get("diet_pref", "none"),
            description=data.get("description"),
            prep_time=safe_int(data.get("prep_time")),
            cook_time=safe_int(data.get("cook_time")),
            total_time=safe_int(data.get("total_time")),
            difficulty=data.get("difficulty"),
            servings=safe_int(data.get("servings")),
            directions=data.get("directions"),
            notes=data.get("notes"),
            ingredients=ingredients,
        )

    @staticmethod
    def _generate_images(
        recipe_name: str,
    ) -> tuple[Optional[str], Optional[str]]:
        """Optionally generate recipe images. Failure is non-fatal."""
        try:
            from app.services.ai.image_generation import (
                get_image_generation_service,
            )

            image_service = get_image_generation_service()
            result = image_service.generate_dual_recipe_images(recipe_name)

            reference = result.get("reference_image_data") if result.get("success") else None
            banner = result.get("banner_image_data") if result.get("success") else None

            if not result.get("success"):
                errors = result.get("errors", [])
                logger.warning(
                    f"[Wizard] Image generation failed for '{recipe_name}': {errors}"
                )

            return reference, banner

        except Exception as e:
            logger.warning(
                f"[Wizard] Image generation skipped for '{recipe_name}': {e}"
            )
            return None, None


# ── Singleton ────────────────────────────────────────────────────────────────

_service_instance: Optional[WizardGenerationService] = None


def get_wizard_generation_service() -> WizardGenerationService:
    """Get the singleton instance of the wizard generation service."""
    global _service_instance
    if _service_instance is None:
        _service_instance = WizardGenerationService()
    return _service_instance
