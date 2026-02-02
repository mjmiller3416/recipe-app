"""app/ai/services/meal_genie

Modular Meal Genie service package.
Combines core service and AI generators.
"""

from typing import Optional

from .service import MealGenieServiceCore
from .generators import GeneratorsMixin


# ── Unified Service ─────────────────────────────────────────────────────────────────────────────────────────
class MealGenieService(GeneratorsMixin, MealGenieServiceCore):
    """Unified Meal Genie service combining all functionality.

    Inherits from:
    - MealGenieServiceCore: Core chat logic, context building, response processing
    - GeneratorsMixin: AI generation methods (suggestions, recipes, cooking answers)
    """

    pass


# ── Singleton Pattern ───────────────────────────────────────────────────────────────────────────────────────
_service_instance: Optional[MealGenieService] = None


def get_meal_genie_service() -> MealGenieService:
    """Get the singleton instance of the Meal Genie service."""
    global _service_instance
    if _service_instance is None:
        _service_instance = MealGenieService()
    return _service_instance


__all__ = [
    "MealGenieService",
    "get_meal_genie_service",
]
