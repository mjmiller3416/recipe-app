"""app/services/meal/query.py

Query and filtering mixin for meal service.
Handles advanced searches, filters, tag queries, and recipe impact queries.
"""

# -- Imports -------------------------------------------------------------------------------------
from typing import List

from sqlalchemy.exc import SQLAlchemyError

from ...dtos.meal_dtos import MealFilterDTO, MealResponseDTO


# -- Query Mixin ---------------------------------------------------------------------------------
class QueryMixin:
    """Mixin providing advanced query and filter methods for meals."""

    def filter_meals(self, filter_dto: MealFilterDTO) -> List[MealResponseDTO]:
        """
        Filter meals with multiple criteria for the current user.

        Args:
            filter_dto: Filter criteria

        Returns:
            List of matching meals as DTOs
        """
        try:
            meals = self.repo.filter_meals(
                user_id=self.user_id,
                name_pattern=filter_dto.name_pattern,
                tags=filter_dto.tags,
                saved_only=filter_dto.saved_only,
                limit=filter_dto.limit,
                offset=filter_dto.offset,
            )
            return [self._meal_to_response_dto(m) for m in meals]
        except SQLAlchemyError:
            return []

    def search_meals(self, search_term: str) -> List[MealResponseDTO]:
        """
        Search meals by name for the current user.

        Args:
            search_term: Search term

        Returns:
            List of matching meals as DTOs
        """
        try:
            meals = self.repo.get_by_name_pattern(search_term, self.user_id)
            return [self._meal_to_response_dto(m) for m in meals]
        except SQLAlchemyError:
            return []

    def get_meals_by_tags(
        self, tags: List[str], match_all: bool = True
    ) -> List[MealResponseDTO]:
        """
        Get meals by tags for the current user.

        Args:
            tags: List of tags to filter by
            match_all: If True, meals must have ALL tags

        Returns:
            List of matching meals as DTOs
        """
        try:
            meals = self.repo.get_by_tags(tags, self.user_id, match_all)
            return [self._meal_to_response_dto(m) for m in meals]
        except SQLAlchemyError:
            return []

    # -- Recipe Impact Queries -------------------------------------------------------------------
    def get_meals_by_recipe(self, recipe_id: int) -> List[MealResponseDTO]:
        """
        Get all meals that contain a specific recipe (main or side) for the current user.

        Args:
            recipe_id: ID of the recipe

        Returns:
            List of meals containing the recipe
        """
        try:
            meals = self.repo.get_meals_containing_recipe(recipe_id, self.user_id)
            return [self._meal_to_response_dto(m) for m in meals]
        except SQLAlchemyError:
            return []

    def get_meals_with_main_recipe(self, recipe_id: int) -> List[MealResponseDTO]:
        """
        Get all meals that use a recipe as main for the current user.

        Args:
            recipe_id: ID of the recipe

        Returns:
            List of meals with this recipe as main
        """
        try:
            meals = self.repo.get_meals_by_main_recipe(recipe_id, self.user_id)
            return [self._meal_to_response_dto(m) for m in meals]
        except SQLAlchemyError:
            return []

    def get_meals_with_side_recipe(self, recipe_id: int) -> List[MealResponseDTO]:
        """
        Get all meals that have a recipe as a side for the current user.

        Args:
            recipe_id: ID of the recipe

        Returns:
            List of meals with this recipe as a side
        """
        try:
            meals = self.repo.get_meals_with_side_recipe(recipe_id, self.user_id)
            return [self._meal_to_response_dto(m) for m in meals]
        except SQLAlchemyError:
            return []
