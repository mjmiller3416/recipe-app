"""app/core/services/meal_service.py

Service layer for managing meal operations and business logic.
Orchestrates repository operations and implements business rules.
"""

# ── Imports ─────────────────────────────────────────────────────────────────────────────────────────────────
from __future__ import annotations

from typing import List, Optional

from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from ..dtos.meal_dtos import (
    MealCreateDTO,
    MealDeletionImpactDTO,
    MealFilterDTO,
    MealResponseDTO,
    MealUpdateDTO,
)
from ..dtos.recipe_dtos import RecipeCardDTO
from ..models.meal import Meal
from ..repositories.meal_repo import MealRepo


# ── Meal Service ────────────────────────────────────────────────────────────────────────────────────────────
class MealService:
    """Service for meal operations with business logic."""

    def __init__(self, session: Session | None = None):
        """
        Initialize the MealService with a database session and repository.
        If no session is provided, a new session is created.
        """
        if session is None:
            from app.core.database.db import create_session
            session = create_session()
        self.session = session
        self.repo = MealRepo(self.session)

    # ── Meal CRUD Operations ────────────────────────────────────────────────────────────────────────────────
    def create_meal(self, create_dto: MealCreateDTO) -> Optional[MealResponseDTO]:
        """
        Create a new meal with validation.

        Args:
            create_dto: Data for creating the meal

        Returns:
            Created meal or None if failed
        """
        try:
            # Validate recipe IDs exist
            recipe_ids = [create_dto.main_recipe_id] + create_dto.side_recipe_ids
            valid_recipe_ids = self.repo.validate_recipe_ids(recipe_ids)

            if create_dto.main_recipe_id not in valid_recipe_ids:
                raise ValueError(f"Main recipe ID {create_dto.main_recipe_id} does not exist")

            # Check side recipe IDs if provided
            for side_id in create_dto.side_recipe_ids:
                if side_id not in valid_recipe_ids:
                    raise ValueError(f"Side recipe ID {side_id} does not exist")

            # Create the meal
            meal = Meal(
                meal_name=create_dto.meal_name,
                main_recipe_id=create_dto.main_recipe_id,
                side_recipe_ids=create_dto.side_recipe_ids,
                is_favorite=create_dto.is_favorite,
                tags=create_dto.tags
            )

            created_meal = self.repo.create_meal(meal)
            self.session.commit()
            return self._meal_to_response_dto(created_meal)

        except (SQLAlchemyError, ValueError) as e:
            self.session.rollback()
            print(f"Failed to create meal, transaction rolled back: {e}")
            return None

    def update_meal(self, meal_id: int, update_dto: MealUpdateDTO) -> Optional[MealResponseDTO]:
        """
        Update an existing meal.

        Args:
            meal_id: ID of the meal to update
            update_dto: Updated data

        Returns:
            Updated meal or None if failed
        """
        try:
            # Get existing meal
            existing_meal = self.repo.get_meal_by_id(meal_id, load_recipes=False)
            if not existing_meal:
                return None

            # Update fields from DTO
            if update_dto.meal_name is not None:
                existing_meal.meal_name = update_dto.meal_name

            if update_dto.main_recipe_id is not None:
                # Validate main recipe exists
                valid_ids = self.repo.validate_recipe_ids([update_dto.main_recipe_id])
                if update_dto.main_recipe_id not in valid_ids:
                    raise ValueError(f"Main recipe ID {update_dto.main_recipe_id} does not exist")
                existing_meal.main_recipe_id = update_dto.main_recipe_id

            if update_dto.side_recipe_ids is not None:
                # Validate all side recipe IDs
                if update_dto.side_recipe_ids:
                    valid_ids = self.repo.validate_recipe_ids(update_dto.side_recipe_ids)
                    for side_id in update_dto.side_recipe_ids:
                        if side_id not in valid_ids:
                            raise ValueError(f"Side recipe ID {side_id} does not exist")
                existing_meal.side_recipe_ids = update_dto.side_recipe_ids

            if update_dto.is_favorite is not None:
                existing_meal.is_favorite = update_dto.is_favorite

            if update_dto.tags is not None:
                existing_meal.tags = update_dto.tags

            updated_meal = self.repo.update_meal(existing_meal)
            self.session.commit()
            return self._meal_to_response_dto(updated_meal)

        except (SQLAlchemyError, ValueError) as e:
            self.session.rollback()
            print(f"Failed to update meal {meal_id}, transaction rolled back: {e}")
            return None

    def get_meal(self, meal_id: int) -> Optional[MealResponseDTO]:
        """
        Get a meal by ID.

        Args:
            meal_id: ID of the meal

        Returns:
            Meal or None if not found
        """
        try:
            meal = self.repo.get_meal_by_id(meal_id)
            return self._meal_to_response_dto(meal) if meal else None
        except SQLAlchemyError:
            return None

    def get_all_meals(self) -> List[MealResponseDTO]:
        """
        Get all meals.

        Returns:
            List of all meals
        """
        try:
            meals = self.repo.get_all_meals()
            return [self._meal_to_response_dto(meal) for meal in meals]
        except SQLAlchemyError:
            return []

    def delete_meal(self, meal_id: int) -> bool:
        """
        Delete a meal.

        Args:
            meal_id: ID of the meal to delete

        Returns:
            True if deleted successfully, False otherwise
        """
        try:
            result = self.repo.delete_meal(meal_id)
            self.session.commit()
            return result
        except SQLAlchemyError:
            self.session.rollback()
            return False

    # ── Search and Filter Operations ────────────────────────────────────────────────────────────────────────
    def filter_meals(self, filter_dto: MealFilterDTO) -> List[MealResponseDTO]:
        """
        Filter meals based on criteria.

        Args:
            filter_dto: Filter criteria

        Returns:
            List of matching meals
        """
        try:
            meals = self.repo.filter_meals(
                name_pattern=filter_dto.name_pattern,
                tags=filter_dto.tags,
                is_favorite=filter_dto.is_favorite,
                main_recipe_id=filter_dto.main_recipe_id,
                contains_recipe_id=filter_dto.contains_recipe_id,
                limit=filter_dto.limit,
                offset=filter_dto.offset
            )
            return [self._meal_to_response_dto(meal) for meal in meals]
        except SQLAlchemyError:
            return []

    def search_meals_by_name(self, name_pattern: str) -> List[MealResponseDTO]:
        """
        Search meals by name pattern.

        Args:
            name_pattern: Pattern to search for in meal names

        Returns:
            List of matching meals
        """
        try:
            meals = self.repo.get_meals_by_name_pattern(name_pattern)
            return [self._meal_to_response_dto(meal) for meal in meals]
        except SQLAlchemyError:
            return []

    def search_meals_by_recipe(self, recipe_id: int) -> List[MealResponseDTO]:
        """
        Find all meals that contain a specific recipe.

        Args:
            recipe_id: ID of the recipe to search for

        Returns:
            List of meals containing the recipe
        """
        try:
            meals = self.repo.get_meals_by_recipe_id(recipe_id)
            return [self._meal_to_response_dto(meal) for meal in meals]
        except SQLAlchemyError:
            return []

    def get_favorite_meals(self) -> List[MealResponseDTO]:
        """
        Get all favorite meals.

        Returns:
            List of favorite meals
        """
        try:
            meals = self.repo.get_favorite_meals()
            return [self._meal_to_response_dto(meal) for meal in meals]
        except SQLAlchemyError:
            return []

    def get_meals_by_tags(self, tags: List[str]) -> List[MealResponseDTO]:
        """
        Get meals that have all specified tags.

        Args:
            tags: List of tags to filter by (AND logic)

        Returns:
            List of meals with all specified tags
        """
        try:
            meals = self.repo.get_meals_by_tags(tags)
            return [self._meal_to_response_dto(meal) for meal in meals]
        except SQLAlchemyError:
            return []

    # ── Side Recipe Operations ──────────────────────────────────────────────────────────────────────────────
    def add_side_recipe(self, meal_id: int, recipe_id: int) -> Optional[MealResponseDTO]:
        """
        Add a side recipe to a meal.

        Args:
            meal_id: ID of the meal
            recipe_id: ID of the recipe to add as a side

        Returns:
            Updated meal or None if failed
        """
        try:
            meal = self.repo.get_meal_by_id(meal_id, load_recipes=False)
            if not meal:
                return None

            # Validate recipe exists
            valid_ids = self.repo.validate_recipe_ids([recipe_id])
            if recipe_id not in valid_ids:
                raise ValueError(f"Recipe ID {recipe_id} does not exist")

            # Add side recipe
            if not meal.add_side_recipe(recipe_id):
                raise ValueError("Cannot add side recipe: maximum 3 sides allowed")

            updated_meal = self.repo.update_meal(meal)
            self.session.commit()
            return self._meal_to_response_dto(updated_meal)

        except (SQLAlchemyError, ValueError) as e:
            self.session.rollback()
            print(f"Failed to add side recipe to meal {meal_id}: {e}")
            return None

    def remove_side_recipe(self, meal_id: int, recipe_id: int) -> Optional[MealResponseDTO]:
        """
        Remove a side recipe from a meal.

        Args:
            meal_id: ID of the meal
            recipe_id: ID of the recipe to remove

        Returns:
            Updated meal or None if failed
        """
        try:
            meal = self.repo.get_meal_by_id(meal_id, load_recipes=False)
            if not meal:
                return None

            if not meal.remove_side_recipe(recipe_id):
                raise ValueError(f"Recipe ID {recipe_id} not found in side recipes")

            updated_meal = self.repo.update_meal(meal)
            self.session.commit()
            return self._meal_to_response_dto(updated_meal)

        except (SQLAlchemyError, ValueError) as e:
            self.session.rollback()
            print(f"Failed to remove side recipe from meal {meal_id}: {e}")
            return None

    def reorder_side_recipes(self, meal_id: int, ordered_ids: List[int]) -> Optional[MealResponseDTO]:
        """
        Reorder side recipes in a meal.

        Args:
            meal_id: ID of the meal
            ordered_ids: New order of side recipe IDs

        Returns:
            Updated meal or None if failed
        """
        try:
            meal = self.repo.get_meal_by_id(meal_id, load_recipes=False)
            if not meal:
                return None

            if not meal.reorder_side_recipes(ordered_ids):
                raise ValueError("Invalid side recipe order")

            updated_meal = self.repo.update_meal(meal)
            self.session.commit()
            return self._meal_to_response_dto(updated_meal)

        except (SQLAlchemyError, ValueError) as e:
            self.session.rollback()
            print(f"Failed to reorder side recipes for meal {meal_id}: {e}")
            return None

    # ── Tag Operations ──────────────────────────────────────────────────────────────────────────────────────
    def add_tag(self, meal_id: int, tag: str) -> Optional[MealResponseDTO]:
        """
        Add a tag to a meal.

        Args:
            meal_id: ID of the meal
            tag: Tag to add

        Returns:
            Updated meal or None if failed
        """
        try:
            meal = self.repo.get_meal_by_id(meal_id, load_recipes=False)
            if not meal:
                return None

            meal.add_tag(tag)
            updated_meal = self.repo.update_meal(meal)
            self.session.commit()
            return self._meal_to_response_dto(updated_meal)

        except SQLAlchemyError as e:
            self.session.rollback()
            print(f"Failed to add tag to meal {meal_id}: {e}")
            return None

    def remove_tag(self, meal_id: int, tag: str) -> Optional[MealResponseDTO]:
        """
        Remove a tag from a meal.

        Args:
            meal_id: ID of the meal
            tag: Tag to remove

        Returns:
            Updated meal or None if failed
        """
        try:
            meal = self.repo.get_meal_by_id(meal_id, load_recipes=False)
            if not meal:
                return None

            meal.remove_tag(tag)
            updated_meal = self.repo.update_meal(meal)
            self.session.commit()
            return self._meal_to_response_dto(updated_meal)

        except SQLAlchemyError as e:
            self.session.rollback()
            print(f"Failed to remove tag from meal {meal_id}: {e}")
            return None

    # ── Deletion Impact ─────────────────────────────────────────────────────────────────────────────────────
    def get_meal_deletion_impact(self, meal_id: int) -> Optional[MealDeletionImpactDTO]:
        """
        Get information about what will be affected if this meal is deleted.

        Args:
            meal_id: ID of the meal

        Returns:
            Deletion impact information or None if meal not found
        """
        try:
            meal = self.repo.get_meal_by_id(meal_id, load_recipes=False)
            if not meal:
                return None

            # Count planner entries referencing this meal
            planner_entries_count = len(meal.planner_entries)
            in_active_planner = planner_entries_count > 0

            return MealDeletionImpactDTO(
                meal_id=meal.id,
                meal_name=meal.meal_name,
                planner_entries_count=planner_entries_count,
                in_active_planner=in_active_planner
            )

        except SQLAlchemyError:
            return None

    # ── Helper Methods ──────────────────────────────────────────────────────────────────────────────────────
    def _meal_to_response_dto(self, meal: Meal) -> MealResponseDTO:
        """
        Convert a Meal model to a response DTO.

        Args:
            meal: Meal model

        Returns:
            Response DTO
        """
        # Get main recipe
        main_recipe = RecipeCardDTO.from_recipe(meal.main_recipe) if meal.main_recipe else None

        # Get side recipes
        side_recipes = []
        if meal.side_recipe_ids:
            side_recipe_dict = self.repo.get_recipes_for_meals(meal.side_recipe_ids)
            # Maintain order from side_recipe_ids array
            for recipe_id in meal.side_recipe_ids:
                if recipe_id in side_recipe_dict:
                    side_recipes.append(RecipeCardDTO.from_recipe(side_recipe_dict[recipe_id]))

        return MealResponseDTO.from_meal(
            meal=meal,
            main_recipe=main_recipe,
            side_recipes=side_recipes
        )
