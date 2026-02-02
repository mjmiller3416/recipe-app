"""app/services/meal/side_recipe.py

Side recipe management mixin for meal service.
Handles adding, removing, reordering side recipes.
"""

# -- Imports -------------------------------------------------------------------------------------
from typing import List, Optional

from sqlalchemy.exc import SQLAlchemyError

from ...dtos.meal_dtos import MealResponseDTO


# -- Side Recipe Mixin ---------------------------------------------------------------------------
class SideRecipeMixin:
    """Mixin providing side recipe management methods for meals."""

    def add_side_recipe(
        self, meal_id: int, recipe_id: int
    ) -> Optional[MealResponseDTO]:
        """
        Add a side recipe to a meal for the current user.

        Args:
            meal_id: ID of the meal
            recipe_id: ID of the recipe to add

        Returns:
            Updated meal as DTO or None if not found/not owned

        Raises:
            InvalidRecipeError: If recipe ID is invalid or at max capacity
        """
        from .service import InvalidRecipeError, MealSaveError

        try:
            meal = self.repo.get_by_id(meal_id, self.user_id)
            if not meal:
                return None

            # Validate recipe exists and belongs to user
            valid_ids = self.repo.validate_recipe_ids([recipe_id], self.user_id)
            if recipe_id not in valid_ids:
                raise InvalidRecipeError(f"Recipe ID {recipe_id} does not exist")

            # Try to add the side recipe
            if not meal.add_side_recipe(recipe_id):
                raise InvalidRecipeError(
                    f"Cannot add recipe: either at max capacity ({self.MAX_SIDE_RECIPES}) "
                    f"or recipe already exists in sides"
                )

            self.repo.update(meal)
            self.session.commit()

            # Sync shopping list if meal is in planner
            self._sync_shopping_list_if_meal_in_planner(meal_id)

            return self._meal_to_response_dto(meal)
        except InvalidRecipeError:
            self.session.rollback()
            raise
        except SQLAlchemyError as e:
            self.session.rollback()
            raise MealSaveError(f"Failed to add side recipe: {e}") from e

    def remove_side_recipe(
        self, meal_id: int, recipe_id: int
    ) -> Optional[MealResponseDTO]:
        """
        Remove a side recipe from a meal for the current user.

        Args:
            meal_id: ID of the meal
            recipe_id: ID of the recipe to remove

        Returns:
            Updated meal as DTO or None if not found/not owned
        """
        from .service import MealSaveError

        try:
            meal = self.repo.get_by_id(meal_id, self.user_id)
            if not meal:
                return None

            meal.remove_side_recipe(recipe_id)
            self.repo.update(meal)
            self.session.commit()

            # Sync shopping list if meal is in planner
            self._sync_shopping_list_if_meal_in_planner(meal_id)

            return self._meal_to_response_dto(meal)
        except SQLAlchemyError as e:
            self.session.rollback()
            raise MealSaveError(f"Failed to remove side recipe: {e}") from e

    def reorder_side_recipes(
        self, meal_id: int, side_recipe_ids: List[int]
    ) -> Optional[MealResponseDTO]:
        """
        Reorder the side recipes of a meal for the current user.

        Args:
            meal_id: ID of the meal
            side_recipe_ids: New order of side recipe IDs

        Returns:
            Updated meal as DTO or None if not found/not owned

        Raises:
            InvalidRecipeError: If the provided IDs don't match existing sides
        """
        from .service import InvalidRecipeError, MealSaveError

        try:
            meal = self.repo.get_by_id(meal_id, self.user_id)
            if not meal:
                return None

            # Validate that the new order contains the same IDs
            current_sides = set(meal.side_recipe_ids)
            new_sides = set(side_recipe_ids)
            if current_sides != new_sides:
                raise InvalidRecipeError(
                    "New side recipe order must contain the same recipes"
                )

            meal.side_recipe_ids = side_recipe_ids
            self.repo.update(meal)
            self.session.commit()

            return self._meal_to_response_dto(meal)
        except InvalidRecipeError:
            self.session.rollback()
            raise
        except SQLAlchemyError as e:
            self.session.rollback()
            raise MealSaveError(f"Failed to reorder side recipes: {e}") from e

    def clean_up_side_recipe(self, recipe_id: int) -> int:
        """
        Remove a recipe from all meals' side recipe lists for the current user.
        Called before a recipe is deleted.

        Args:
            recipe_id: ID of the recipe being deleted

        Returns:
            Number of meals updated
        """
        try:
            count = self.repo.remove_side_recipe_from_all_meals(recipe_id, self.user_id)
            self.session.commit()
            return count
        except SQLAlchemyError:
            self.session.rollback()
            return 0
