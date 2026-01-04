"""app/core/services/meal_service.py

Service layer for managing meal CRUD operations.
Orchestrates repository operations and business logic for meals.
"""

# -- Imports -------------------------------------------------------------------------------------
from __future__ import annotations

from typing import List, Optional

from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from ..dtos.meal_dtos import (
    MealCreateDTO,
    MealFilterDTO,
    MealResponseDTO,
    MealUpdateDTO,
    RecipeCardDTO,
)
from ..models.meal import Meal
from ..models.recipe import Recipe
from ..repositories.meal_repo import MealRepo
from ..repositories.planner_repo import PlannerRepo


# -- Exceptions ----------------------------------------------------------------------------------
class MealSaveError(Exception):
    """Raised when a meal cannot be saved."""
    pass


class MealNotFoundError(Exception):
    """Raised when a meal is not found."""
    pass


class InvalidRecipeError(Exception):
    """Raised when a recipe ID is invalid."""
    pass


# -- Meal Service --------------------------------------------------------------------------------
class MealService:
    """Service for meal operations with business logic."""

    MAX_SIDE_RECIPES = 3

    def __init__(self, session: Session | None = None):
        """
        Initialize the MealService with a database session and repository.
        If no session is provided, a new session is created.
        """
        if session is None:
            from app.database.db import create_session
            session = create_session()
        self.session = session
        self.repo = MealRepo(self.session)
        self.planner_repo = PlannerRepo(self.session)

    # -- Create Operations -----------------------------------------------------------------------
    def create_meal(self, create_dto: MealCreateDTO) -> MealResponseDTO:
        """
        Create a new meal.

        Args:
            create_dto: Data for creating the meal

        Returns:
            Created meal as DTO

        Raises:
            InvalidRecipeError: If recipe IDs are invalid
            MealSaveError: If the meal cannot be saved
        """
        try:
            # Validate main recipe exists
            valid_ids = self.repo.validate_recipe_ids([create_dto.main_recipe_id])
            if create_dto.main_recipe_id not in valid_ids:
                raise InvalidRecipeError(
                    f"Main recipe ID {create_dto.main_recipe_id} does not exist"
                )

            # Validate side recipe IDs if provided
            side_ids = create_dto.side_recipe_ids or []
            if len(side_ids) > self.MAX_SIDE_RECIPES:
                raise InvalidRecipeError(
                    f"Maximum of {self.MAX_SIDE_RECIPES} side recipes allowed"
                )

            if side_ids:
                valid_side_ids = self.repo.validate_recipe_ids(side_ids)
                invalid_side_ids = [sid for sid in side_ids if sid not in valid_side_ids]
                if invalid_side_ids:
                    raise InvalidRecipeError(
                        f"Side recipe IDs {invalid_side_ids} do not exist"
                    )

            # Create the meal
            meal = Meal(
                meal_name=create_dto.meal_name,
                main_recipe_id=create_dto.main_recipe_id,
                is_favorite=create_dto.is_favorite or False,
            )
            meal.side_recipe_ids = side_ids
            meal.tags = create_dto.tags or []

            created_meal = self.repo.create_meal(meal)
            self.session.commit()

            # Refresh to get relationships
            created_meal = self.repo.get_by_id(created_meal.id)
            return self._meal_to_response_dto(created_meal)

        except (InvalidRecipeError, ValueError) as e:
            self.session.rollback()
            raise
        except SQLAlchemyError as e:
            self.session.rollback()
            raise MealSaveError(f"Failed to create meal: {e}") from e

    # -- Read Operations -------------------------------------------------------------------------
    def get_meal(self, meal_id: int) -> Optional[MealResponseDTO]:
        """
        Get a meal by ID.

        Args:
            meal_id: ID of the meal

        Returns:
            Meal as DTO or None if not found
        """
        try:
            meal = self.repo.get_by_id(meal_id)
            return self._meal_to_response_dto(meal) if meal else None
        except SQLAlchemyError:
            return None

    def get_all_meals(self) -> List[MealResponseDTO]:
        """
        Get all meals.

        Returns:
            List of all meals as DTOs
        """
        try:
            meals = self.repo.get_all()
            return [self._meal_to_response_dto(m) for m in meals]
        except SQLAlchemyError:
            return []

    def filter_meals(self, filter_dto: MealFilterDTO) -> List[MealResponseDTO]:
        """
        Filter meals with multiple criteria.

        Args:
            filter_dto: Filter criteria

        Returns:
            List of matching meals as DTOs
        """
        try:
            meals = self.repo.filter_meals(
                name_pattern=filter_dto.name_pattern,
                tags=filter_dto.tags,
                favorites_only=filter_dto.favorites_only,
                limit=filter_dto.limit,
                offset=filter_dto.offset
            )
            return [self._meal_to_response_dto(m) for m in meals]
        except SQLAlchemyError:
            return []

    def search_meals(self, search_term: str) -> List[MealResponseDTO]:
        """
        Search meals by name.

        Args:
            search_term: Search term

        Returns:
            List of matching meals as DTOs
        """
        try:
            meals = self.repo.get_by_name_pattern(search_term)
            return [self._meal_to_response_dto(m) for m in meals]
        except SQLAlchemyError:
            return []

    def get_favorite_meals(self) -> List[MealResponseDTO]:
        """
        Get all favorite meals.

        Returns:
            List of favorite meals as DTOs
        """
        try:
            meals = self.repo.get_favorites()
            return [self._meal_to_response_dto(m) for m in meals]
        except SQLAlchemyError:
            return []

    def get_meals_by_tags(
        self, tags: List[str], match_all: bool = True
    ) -> List[MealResponseDTO]:
        """
        Get meals by tags.

        Args:
            tags: List of tags to filter by
            match_all: If True, meals must have ALL tags

        Returns:
            List of matching meals as DTOs
        """
        try:
            meals = self.repo.get_by_tags(tags, match_all)
            return [self._meal_to_response_dto(m) for m in meals]
        except SQLAlchemyError:
            return []

    # -- Update Operations -----------------------------------------------------------------------
    def update_meal(
        self, meal_id: int, update_dto: MealUpdateDTO
    ) -> Optional[MealResponseDTO]:
        """
        Update an existing meal.

        Args:
            meal_id: ID of the meal to update
            update_dto: Updated data

        Returns:
            Updated meal as DTO or None if not found

        Raises:
            InvalidRecipeError: If recipe IDs are invalid
            MealSaveError: If the update fails
        """
        try:
            meal = self.repo.get_by_id(meal_id)
            if not meal:
                return None

            # Update meal name if provided
            if update_dto.meal_name is not None:
                meal.meal_name = update_dto.meal_name

            # Update main recipe if provided
            if update_dto.main_recipe_id is not None:
                valid_ids = self.repo.validate_recipe_ids([update_dto.main_recipe_id])
                if update_dto.main_recipe_id not in valid_ids:
                    raise InvalidRecipeError(
                        f"Main recipe ID {update_dto.main_recipe_id} does not exist"
                    )
                meal.main_recipe_id = update_dto.main_recipe_id

            # Update side recipes if provided
            if update_dto.side_recipe_ids is not None:
                side_ids = update_dto.side_recipe_ids
                if len(side_ids) > self.MAX_SIDE_RECIPES:
                    raise InvalidRecipeError(
                        f"Maximum of {self.MAX_SIDE_RECIPES} side recipes allowed"
                    )
                if side_ids:
                    valid_side_ids = self.repo.validate_recipe_ids(side_ids)
                    invalid_side_ids = [
                        sid for sid in side_ids if sid not in valid_side_ids
                    ]
                    if invalid_side_ids:
                        raise InvalidRecipeError(
                            f"Side recipe IDs {invalid_side_ids} do not exist"
                        )
                meal.side_recipe_ids = side_ids

            # Update favorite status if provided
            if update_dto.is_favorite is not None:
                meal.is_favorite = update_dto.is_favorite

            # Update tags if provided
            if update_dto.tags is not None:
                meal.tags = update_dto.tags

            updated_meal = self.repo.update(meal)
            self.session.commit()

            # Refresh to get relationships
            updated_meal = self.repo.get_by_id(updated_meal.id)
            return self._meal_to_response_dto(updated_meal)

        except (InvalidRecipeError, ValueError) as e:
            self.session.rollback()
            raise
        except SQLAlchemyError as e:
            self.session.rollback()
            raise MealSaveError(f"Failed to update meal: {e}") from e

    def toggle_favorite(self, meal_id: int) -> Optional[MealResponseDTO]:
        """
        Toggle the favorite status of a meal.

        Args:
            meal_id: ID of the meal

        Returns:
            Updated meal as DTO or None if not found
        """
        try:
            meal = self.repo.get_by_id(meal_id)
            if not meal:
                return None

            meal.is_favorite = not meal.is_favorite
            self.repo.update(meal)
            self.session.commit()

            return self._meal_to_response_dto(meal)
        except SQLAlchemyError:
            self.session.rollback()
            return None

    def add_side_recipe(
        self, meal_id: int, recipe_id: int
    ) -> Optional[MealResponseDTO]:
        """
        Add a side recipe to a meal.

        Args:
            meal_id: ID of the meal
            recipe_id: ID of the recipe to add

        Returns:
            Updated meal as DTO or None if not found

        Raises:
            InvalidRecipeError: If recipe ID is invalid or at max capacity
        """
        try:
            meal = self.repo.get_by_id(meal_id)
            if not meal:
                return None

            # Validate recipe exists
            valid_ids = self.repo.validate_recipe_ids([recipe_id])
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
        Remove a side recipe from a meal.

        Args:
            meal_id: ID of the meal
            recipe_id: ID of the recipe to remove

        Returns:
            Updated meal as DTO or None if not found
        """
        try:
            meal = self.repo.get_by_id(meal_id)
            if not meal:
                return None

            meal.remove_side_recipe(recipe_id)
            self.repo.update(meal)
            self.session.commit()

            return self._meal_to_response_dto(meal)
        except SQLAlchemyError as e:
            self.session.rollback()
            raise MealSaveError(f"Failed to remove side recipe: {e}") from e

    def reorder_side_recipes(
        self, meal_id: int, side_recipe_ids: List[int]
    ) -> Optional[MealResponseDTO]:
        """
        Reorder the side recipes of a meal.

        Args:
            meal_id: ID of the meal
            side_recipe_ids: New order of side recipe IDs

        Returns:
            Updated meal as DTO or None if not found

        Raises:
            InvalidRecipeError: If the provided IDs don't match existing sides
        """
        try:
            meal = self.repo.get_by_id(meal_id)
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

    # -- Delete Operations -----------------------------------------------------------------------
    def delete_meal(self, meal_id: int) -> bool:
        """
        Delete a meal.
        Note: This will CASCADE delete any planner entries referencing this meal.

        Args:
            meal_id: ID of the meal to delete

        Returns:
            True if deleted, False if not found
        """
        try:
            result = self.repo.delete(meal_id)
            self.session.commit()
            return result
        except SQLAlchemyError:
            self.session.rollback()
            return False

    # -- Recipe Impact Methods -------------------------------------------------------------------
    def get_meals_by_recipe(self, recipe_id: int) -> List[MealResponseDTO]:
        """
        Get all meals that contain a specific recipe (main or side).

        Args:
            recipe_id: ID of the recipe

        Returns:
            List of meals containing the recipe
        """
        try:
            meals = self.repo.get_meals_containing_recipe(recipe_id)
            return [self._meal_to_response_dto(m) for m in meals]
        except SQLAlchemyError:
            return []

    def get_meals_with_main_recipe(self, recipe_id: int) -> List[MealResponseDTO]:
        """
        Get all meals that use a recipe as main.

        Args:
            recipe_id: ID of the recipe

        Returns:
            List of meals with this recipe as main
        """
        try:
            meals = self.repo.get_meals_by_main_recipe(recipe_id)
            return [self._meal_to_response_dto(m) for m in meals]
        except SQLAlchemyError:
            return []

    def get_meals_with_side_recipe(self, recipe_id: int) -> List[MealResponseDTO]:
        """
        Get all meals that have a recipe as a side.

        Args:
            recipe_id: ID of the recipe

        Returns:
            List of meals with this recipe as a side
        """
        try:
            meals = self.repo.get_meals_with_side_recipe(recipe_id)
            return [self._meal_to_response_dto(m) for m in meals]
        except SQLAlchemyError:
            return []

    def clean_up_side_recipe(self, recipe_id: int) -> int:
        """
        Remove a recipe from all meals' side recipe lists.
        Called before a recipe is deleted.

        Args:
            recipe_id: ID of the recipe being deleted

        Returns:
            Number of meals updated
        """
        try:
            count = self.repo.remove_side_recipe_from_all_meals(recipe_id)
            self.session.commit()
            return count
        except SQLAlchemyError:
            self.session.rollback()
            return 0

    # -- Helper Methods --------------------------------------------------------------------------
    def _meal_to_response_dto(self, meal: Meal) -> MealResponseDTO:
        """
        Convert a Meal model to a response DTO.

        Args:
            meal: Meal model

        Returns:
            MealResponseDTO with hydrated main_recipe, side_recipes, and computed stats
        """
        # Hydrate side recipes by fetching from database
        side_recipes: List[RecipeCardDTO] = []
        side_ids = meal.side_recipe_ids
        if side_ids:
            # Fetch all side recipes in a single query
            recipes = (
                self.session.query(Recipe)
                .filter(Recipe.id.in_(side_ids))
                .all()
            )
            # Create a lookup dict to preserve order
            recipe_lookup = {r.id: r for r in recipes}
            # Build the list in the same order as side_recipe_ids
            for recipe_id in side_ids:
                if recipe_id in recipe_lookup:
                    side_recipes.append(
                        RecipeCardDTO.from_recipe(recipe_lookup[recipe_id])
                    )

        # Compute stats from recipe data
        total_cook_time = 0
        servings_list = []

        # Add main recipe stats
        if meal.main_recipe:
            if meal.main_recipe.total_time:
                total_cook_time += meal.main_recipe.total_time
            if meal.main_recipe.servings:
                servings_list.append(meal.main_recipe.servings)

        # Add side recipe stats
        for side_dto in side_recipes:
            if side_dto.total_time:
                total_cook_time += side_dto.total_time
            if side_dto.servings:
                servings_list.append(side_dto.servings)

        # Calculate average servings (rounded)
        avg_servings = round(sum(servings_list) / len(servings_list)) if servings_list else None

        # Get completion stats from planner
        completion_stats = self.planner_repo.get_completion_stats_for_meal(meal.id)
        times_cooked = completion_stats['times_cooked']
        last_cooked = completion_stats['last_cooked']

        return MealResponseDTO(
            id=meal.id,
            meal_name=meal.meal_name,
            main_recipe_id=meal.main_recipe_id,
            side_recipe_ids=meal.side_recipe_ids,
            is_favorite=meal.is_favorite,
            tags=meal.tags,
            created_at=meal.created_at.isoformat() if meal.created_at else None,
            main_recipe=RecipeCardDTO.from_recipe(meal.main_recipe),
            side_recipes=side_recipes,
            # Computed stats
            total_cook_time=total_cook_time if total_cook_time > 0 else None,
            avg_servings=avg_servings,
            times_cooked=times_cooked if times_cooked > 0 else None,
            last_cooked=last_cooked.isoformat() if last_cooked else None,
        )
