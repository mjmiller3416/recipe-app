"""app/core/services/planner_service.py

Service layer for managing meal planner state and meal selections.
Orchestrates repository operations and business logic.
"""

# ── Imports ─────────────────────────────────────────────────────────────────────────────────────────────────
from __future__ import annotations

from typing import List, Optional

from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from _dev_tools import DebugLogger

from ..dtos.planner_dtos import (
    MealPlanSaveResultDTO,
    MealPlanSummaryDTO,
    MealPlanValidationDTO,
    MealSelectionCreateDTO,
    MealSelectionResponseDTO,
    MealSelectionUpdateDTO,
    RecipeCardDTO)
from ..models.meal_selection import MealSelection
from ..repositories.planner_repo import PlannerRepo


# ── Planner Service ─────────────────────────────────────────────────────────────────────────────────────────
class PlannerService:
    """Service for meal planner operations with business logic."""

    def __init__(self, session: Session | None = None):
        """
        Initialize the PlannerService with a database session and repository.
        If no session is provided, a new session is created.
        """
        if session is None:
            from app.core.database.db import create_session
            session = create_session()
        self.session = session
        self.repo = PlannerRepo(self.session)

    # ── Meal Planner State Management ───────────────────────────────────────────────────────────────────────
    def load_saved_meal_ids(self) -> List[int]:
        """
        Load saved meal IDs from the database.

        Returns:
            List[int]: List of saved meal IDs from saved meal states.
        """
        try:
            return self.repo.get_saved_meal_ids()
        except SQLAlchemyError as e:
            DebugLogger.log(f"Failed to load saved meal IDs: {e}", "error")
            return []

    def get_saved_meal_plan(self) -> List[MealSelectionResponseDTO]:
        """
        Get the current saved meal plan with full recipe details.

        Returns:
            List[MealSelectionResponseDTO]: List of saved meals with recipe information.
        """
        try:
            saved_meals = self.repo.get_saved_meal_selections()
            return [self._meal_to_response_dto(meal) for meal in saved_meals]
        except SQLAlchemyError as e:
            raise RuntimeError(f"Failed to load saved meal plan: {e}")

    def saveMealPlan(self, meal_ids: List[int]) -> MealPlanSaveResultDTO:
        """
        Save a meal plan by storing the meal IDs.
        Validates meal IDs before saving.

        Args:
            meal_ids (List[int]): List of meal selection IDs to save.

        Returns:
            MealPlanSaveResultDTO: Result with saved meal count and any validation errors.
        """
        try:
            # validate meal IDs exist
            valid_ids = self.repo.validate_meal_ids(meal_ids)
            invalid_ids = [mid for mid in meal_ids if mid not in valid_ids]

            if invalid_ids:
                return MealPlanSaveResultDTO(
                    success=False,
                    saved_count=0,
                    invalid_ids=invalid_ids,
                    message=f"Invalid meal IDs found: {invalid_ids}"
                )

            # save the meal plan
            self.repo.save_active_meal_ids(valid_ids)
            self.session.commit()
            return MealPlanSaveResultDTO(
                success=True,
                saved_count=len(valid_ids),
                invalid_ids=[],
                message=f"Successfully saved {len(valid_ids)} meals to plan"
            )

        except SQLAlchemyError as e:
            self.session.rollback()
            return MealPlanSaveResultDTO(
                success=False,
                saved_count=0,
                invalid_ids=meal_ids,
                message=f"Database error: {e}"
            )

    def save_active_meal_ids(self, meal_ids: List[int]) -> None:
        """
        Save the active meal IDs to the database.

        Args:
            meal_ids (List[int]): List of meal IDs to save as active.
        """
        try:
            self.repo.save_active_meal_ids(meal_ids)
            self.session.commit()
        except SQLAlchemyError as e:
            self.session.rollback()
            DebugLogger.log(f"Failed to save active meal IDs, transaction rolled back: {e}", "error")
            raise

    def clear_meal_plan(self) -> bool:
        """
        Clear the current meal plan.

        Returns:
            bool: True if successful, False otherwise.
        """
        try:
            self.repo.clear_saved_meal_states()
            self.session.commit()
            return True
        except SQLAlchemyError:
            self.session.rollback()
            return False

    def get_meal_plan_summary(self) -> MealPlanSummaryDTO:
        """
        Get a summary of the current meal plan.

        Returns:
            MealPlanSummaryDTO: Summary with counts and basic meal information.
        """
        try:
            saved_meals = self.repo.get_saved_meal_selections()
            total_recipes = 0
            meal_names = []

            for meal in saved_meals:
                meal_names.append(meal.meal_name)
                # count main recipe + side recipes
                total_recipes += 1 + len(meal.get_side_recipes())

            return MealPlanSummaryDTO(
                total_meals=len(saved_meals),
                total_recipes=total_recipes,
                meal_names=meal_names,
                has_saved_plan=len(saved_meals) > 0
            )

        except SQLAlchemyError as e:
            return MealPlanSummaryDTO(
                total_meals=0,
                total_recipes=0,
                meal_names=[],
                has_saved_plan=False,
                error=str(e)
            )

    # ── Meal Selection Management ───────────────────────────────────────────────────────────────────────────
    def create_meal_selection(self, create_dto: MealSelectionCreateDTO) -> Optional[MealSelectionResponseDTO]:
        """
        Create a new meal selection with validation.

        Args:
            create_dto (MealSelectionCreateDTO): Data for creating the meal selection.

        Returns:
            Optional[MealSelectionResponseDTO]: Created meal selection or None if failed.
        """
        try:
            # validate recipe IDs exist
            recipe_ids = [create_dto.main_recipe_id]
            side_ids = [
                create_dto.side_recipe_1_id,
                create_dto.side_recipe_2_id,
                create_dto.side_recipe_3_id
            ]
            recipe_ids.extend([sid for sid in side_ids if sid is not None])

            valid_recipe_ids = self.repo.validate_recipe_ids(recipe_ids)

            if create_dto.main_recipe_id not in valid_recipe_ids:
                raise ValueError(f"Main recipe ID {create_dto.main_recipe_id} does not exist")

            # check side recipe IDs if provided
            for side_id in side_ids:
                if side_id is not None and side_id not in valid_recipe_ids:
                    raise ValueError(f"Side recipe ID {side_id} does not exist")

            # create the meal selection
            meal_selection = MealSelection(
                meal_name=create_dto.meal_name,
                main_recipe_id=create_dto.main_recipe_id,
                side_recipe_1_id=create_dto.side_recipe_1_id,
                side_recipe_2_id=create_dto.side_recipe_2_id,
                side_recipe_3_id=create_dto.side_recipe_3_id
            )

            created_meal = self.repo.create_meal_selection(meal_selection)
            self.session.commit()
            return self._meal_to_response_dto(created_meal)

        except (SQLAlchemyError, ValueError) as e:
            self.session.rollback()
            DebugLogger.log(f"Failed to create meal selection, transaction rolled back: {e}", "error")
            return None

    def update_meal_selection(self, meal_id: int, update_dto: MealSelectionUpdateDTO) -> Optional[MealSelectionResponseDTO]:
        """
        Update an existing meal selection.

        Args:
            meal_id (int): ID of the meal selection to update.
            update_dto (MealSelectionUpdateDTO): Updated data.

        Returns:
            Optional[MealSelectionResponseDTO]: Updated meal selection or None if failed.
        """
        try:
            # get existing meal
            existing_meal = self.repo.get_meal_selection_by_id(meal_id)
            if not existing_meal:
                return None

            # update fields from DTO
            if update_dto.meal_name is not None:
                existing_meal.meal_name = update_dto.meal_name

            if update_dto.main_recipe_id is not None:
                # validate main recipe exists
                valid_ids = self.repo.validate_recipe_ids([update_dto.main_recipe_id])
                if update_dto.main_recipe_id not in valid_ids:
                    raise ValueError(f"Main recipe ID {update_dto.main_recipe_id} does not exist")
                existing_meal.main_recipe_id = update_dto.main_recipe_id

            # update side recipes if provided
            side_updates = [
                (update_dto.side_recipe_1_id, 'side_recipe_1_id'),
                (update_dto.side_recipe_2_id, 'side_recipe_2_id'),
                (update_dto.side_recipe_3_id, 'side_recipe_3_id')
            ]

            for side_id, attr_name in side_updates:
                if side_id is not None:
                    if side_id > 0:  # validate if > 0
                        valid_ids = self.repo.validate_recipe_ids([side_id])
                        if side_id not in valid_ids:
                            raise ValueError(f"Side recipe ID {side_id} does not exist")
                    setattr(existing_meal, attr_name, side_id if side_id > 0 else None)

            updated_meal = self.repo.update_meal_selection(existing_meal)
            self.session.commit()
            return self._meal_to_response_dto(updated_meal)

        except (SQLAlchemyError, ValueError) as e:
            self.session.rollback()
            DebugLogger.log(f"Failed to update meal selection {meal_id}, transaction rolled back: {e}", "error")
            return None

    def get_meal_selection(self, meal_id: int) -> Optional[MealSelectionResponseDTO]:
        """
        Get a meal selection by ID.

        Args:
            meal_id (int): ID of the meal selection.

        Returns:
            Optional[MealSelectionResponseDTO]: Meal selection or None if not found.
        """
        try:
            meal = self.repo.get_meal_selection_by_id(meal_id)
            return self._meal_to_response_dto(meal) if meal else None
        except SQLAlchemyError:
            return None

    def get_all_meal_selections(self) -> List[MealSelectionResponseDTO]:
        """
        Get all meal selections.

        Returns:
            List[MealSelectionResponseDTO]: List of all meal selections.
        """
        try:
            meals = self.repo.get_all_meal_selections()
            return [self._meal_to_response_dto(meal) for meal in meals]
        except SQLAlchemyError:
            return []

    def delete_meal_selection(self, meal_id: int) -> bool:
        """
        Delete a meal selection.

        Args:
            meal_id (int): ID of the meal selection to delete.

        Returns:
            bool: True if deleted successfully, False otherwise.
        """
        try:
            result = self.repo.delete_meal_selection(meal_id)
            self.session.commit()
            return result
        except SQLAlchemyError:
            self.session.rollback()
            return False

    # ── Search and Query Operations ─────────────────────────────────────────────────────────────────────────
    def search_meals_by_recipe(self, recipe_id: int) -> List[MealSelectionResponseDTO]:
        """
        Find all meals that contain a specific recipe.

        Args:
            recipe_id (int): ID of the recipe to search for.

        Returns:
            List[MealSelectionResponseDTO]: List of meals containing the recipe.
        """
        try:
            meals = self.repo.get_meals_by_recipe_id(recipe_id)
            return [self._meal_to_response_dto(meal) for meal in meals]
        except SQLAlchemyError:
            return []

    def search_meals_by_name(self, name_pattern: str) -> List[MealSelectionResponseDTO]:
        """
        Search meals by name pattern.

        Args:
            name_pattern (str): Pattern to search for in meal names.

        Returns:
            List[MealSelectionResponseDTO]: List of matching meals.
        """
        try:
            meals = self.repo.get_meals_by_name_pattern(name_pattern)
            return [self._meal_to_response_dto(meal) for meal in meals]
        except SQLAlchemyError:
            return []

    # ── Helper Methods ──────────────────────────────────────────────────────────────────────────────────────
    def _meal_to_response_dto(self, meal: MealSelection) -> MealSelectionResponseDTO:
        """
        Convert a MealSelection model to a response DTO.

        Args:
            meal (MealSelection): Meal selection model.

        Returns:
            MealSelectionResponseDTO: Response DTO.
        """
        return MealSelectionResponseDTO(
        id=meal.id,
        meal_name=meal.meal_name,
        main_recipe_id=meal.main_recipe_id,
        side_recipe_1_id=meal.side_recipe_1_id,
        side_recipe_2_id=meal.side_recipe_2_id,
        side_recipe_3_id=meal.side_recipe_3_id,
        main_recipe=RecipeCardDTO.from_recipe(meal.main_recipe),
        side_recipe_1=RecipeCardDTO.from_recipe(meal.side_recipe_1),
        side_recipe_2=RecipeCardDTO.from_recipe(meal.side_recipe_2),
        side_recipe_3=RecipeCardDTO.from_recipe(meal.side_recipe_3),
        )

    # ── Validation Methods ───────────────────────────────────────────────────────────────────
    def validate_meal_plan(self, meal_ids: List[int]) -> MealPlanValidationDTO:
        """
        Validate a meal plan without saving it.

        Args:
            meal_ids (List[int]): List of meal IDs to validate.

        Returns:
            MealPlanValidationDTO: Validation result with details.
        """
        try:
            valid_ids = self.repo.validate_meal_ids(meal_ids)
            invalid_ids = [mid for mid in meal_ids if mid not in valid_ids]

            return MealPlanValidationDTO(
                is_valid=(len(invalid_ids) == 0),
                valid_ids=valid_ids,
                invalid_meal_ids=invalid_ids,
                total_meals=len(meal_ids),
                total_valid=len(valid_ids)
            )

        except SQLAlchemyError as e:
            return MealPlanValidationDTO(
                is_valid=False,
                valid_ids=[],
                invalid_meal_ids=meal_ids,
                total_meals=len(meal_ids),
                total_valid=0,
                error=str(e)
            )
