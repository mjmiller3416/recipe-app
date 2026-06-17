"""app/core/repositories/nutrition_repo.py

Repository layer for NutritionFacts model. Handles direct database interactions
for recipe nutrition data.
"""

from typing import Optional

from sqlalchemy.orm import Session

from ..dtos.nutrition_dtos import NutritionFactsDTO
from ..models.nutrition_facts import NutritionFacts


class NutritionRepo:
    """Handles direct DB queries for the NutritionFacts model."""

    def __init__(self, session: Session) -> None:
        self.session = session

    def get_by_recipe_id(self, recipe_id: int) -> Optional[NutritionFacts]:
        """Get nutrition facts for a recipe.

        Args:
            recipe_id: ID of the recipe.

        Returns:
            NutritionFacts or None if not found.
        """
        return (
            self.session.query(NutritionFacts)
            .filter(NutritionFacts.recipe_id == recipe_id)
            .first()
        )

    def create_or_update(
        self, recipe_id: int, dto: NutritionFactsDTO
    ) -> NutritionFacts:
        """Create or update nutrition facts for a recipe.

        Args:
            recipe_id: ID of the recipe.
            dto: Nutrition facts data.

        Returns:
            The created or updated NutritionFacts record.
        """
        existing = self.get_by_recipe_id(recipe_id)

        if existing:
            existing.calories = dto.calories
            existing.protein_g = dto.protein_g
            existing.total_fat_g = dto.total_fat_g
            existing.saturated_fat_g = dto.saturated_fat_g
            existing.trans_fat_g = dto.trans_fat_g
            existing.cholesterol_mg = dto.cholesterol_mg
            existing.sodium_mg = dto.sodium_mg
            existing.total_carbs_g = dto.total_carbs_g
            existing.dietary_fiber_g = dto.dietary_fiber_g
            existing.total_sugars_g = dto.total_sugars_g
            existing.is_ai_estimated = dto.is_ai_estimated
            self.session.flush()
            return existing

        nutrition = NutritionFacts(
            recipe_id=recipe_id,
            calories=dto.calories,
            protein_g=dto.protein_g,
            total_fat_g=dto.total_fat_g,
            saturated_fat_g=dto.saturated_fat_g,
            trans_fat_g=dto.trans_fat_g,
            cholesterol_mg=dto.cholesterol_mg,
            sodium_mg=dto.sodium_mg,
            total_carbs_g=dto.total_carbs_g,
            dietary_fiber_g=dto.dietary_fiber_g,
            total_sugars_g=dto.total_sugars_g,
            is_ai_estimated=dto.is_ai_estimated,
        )
        self.session.add(nutrition)
        self.session.flush()
        return nutrition

    def delete_by_recipe_id(self, recipe_id: int) -> None:
        """Delete nutrition facts for a recipe.

        Args:
            recipe_id: ID of the recipe.
        """
        existing = self.get_by_recipe_id(recipe_id)
        if existing:
            self.session.delete(existing)
            self.session.flush()
