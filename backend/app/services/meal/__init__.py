"""app/services/meal

Modular meal service package.
Combines core service, side recipe management, and query operations.
"""

from .query import QueryMixin
from .service import (
    InvalidRecipeError,
    MealNotFoundError,
    MealSaveError,
    MealServiceCore,
)
from .side_recipe import SideRecipeMixin


# ── Unified Service ─────────────────────────────────────────────────────────────────────────────
class MealService(SideRecipeMixin, QueryMixin, MealServiceCore):
    """Unified meal service combining all functionality.

    Inherits from:
    - MealServiceCore: Core CRUD operations, initialization, DTO conversion
    - SideRecipeMixin: Side recipe management (add, remove, reorder, cleanup)
    - QueryMixin: Advanced queries (filter, search, tags, recipe impact)
    """

    pass


__all__ = [
    "MealService",
    "MealSaveError",
    "MealNotFoundError",
    "InvalidRecipeError",
]
