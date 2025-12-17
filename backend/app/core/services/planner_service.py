"""app/core/services/planner_service.py

Service layer for managing planner entry operations.
Handles only the planner state - meal CRUD is in meal_service.py.
"""

# -- Imports -------------------------------------------------------------------------------------
from __future__ import annotations

from typing import List, Optional

from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from ..dtos.planner_dtos import (
    PlannerEntryResponseDTO,
    PlannerSummaryDTO,
    RecipeCardDTO,
)
from ..models.meal import Meal
from ..models.planner_entry import PlannerEntry
from ..repositories.meal_repo import MealRepo
from ..repositories.planner_repo import MAX_PLANNER_ENTRIES, PlannerRepo


# -- Exceptions ----------------------------------------------------------------------------------
class PlannerFullError(Exception):
    """Raised when the planner is at maximum capacity."""
    pass


class InvalidMealError(Exception):
    """Raised when a meal ID is invalid."""
    pass


class EntryNotFoundError(Exception):
    """Raised when a planner entry is not found."""
    pass


# -- Planner Service -----------------------------------------------------------------------------
class PlannerService:
    """Service for planner entry operations with business logic."""

    def __init__(self, session: Session | None = None):
        """
        Initialize the PlannerService with a database session and repositories.
        If no session is provided, a new session is created.
        """
        if session is None:
            from app.core.database.db import create_session
            session = create_session()
        self.session = session
        self.repo = PlannerRepo(self.session)
        self.meal_repo = MealRepo(self.session)

    # -- Add to Planner --------------------------------------------------------------------------
    def add_meal_to_planner(
        self, meal_id: int, position: Optional[int] = None
    ) -> PlannerEntryResponseDTO:
        """
        Add a meal to the planner.

        Args:
            meal_id: ID of the meal to add
            position: Optional position (defaults to end)

        Returns:
            Created planner entry as DTO

        Raises:
            PlannerFullError: If planner is at capacity (15 entries)
            InvalidMealError: If meal ID doesn't exist
        """
        try:
            # Check capacity
            if self.repo.is_at_capacity():
                raise PlannerFullError(
                    f"Planner is at maximum capacity ({MAX_PLANNER_ENTRIES} entries)"
                )

            # Validate meal exists
            valid_ids = self.meal_repo.validate_meal_ids([meal_id])
            if meal_id not in valid_ids:
                raise InvalidMealError(f"Meal ID {meal_id} does not exist")

            # Add entry
            entry = self.repo.add_entry(meal_id, position)
            self.session.commit()

            # Refresh to get relationships
            entry = self.repo.get_by_id(entry.id)
            return self._entry_to_response_dto(entry)

        except (PlannerFullError, InvalidMealError):
            self.session.rollback()
            raise
        except SQLAlchemyError as e:
            self.session.rollback()
            raise RuntimeError(f"Failed to add meal to planner: {e}") from e

    def add_meals_to_planner(self, meal_ids: List[int]) -> List[PlannerEntryResponseDTO]:
        """
        Add multiple meals to the planner.

        Args:
            meal_ids: List of meal IDs to add

        Returns:
            List of created planner entries as DTOs

        Raises:
            PlannerFullError: If adding would exceed capacity
            InvalidMealError: If any meal ID doesn't exist
        """
        try:
            current_count = self.repo.count()
            if current_count + len(meal_ids) > MAX_PLANNER_ENTRIES:
                raise PlannerFullError(
                    f"Cannot add {len(meal_ids)} meals: would exceed "
                    f"maximum capacity ({MAX_PLANNER_ENTRIES})"
                )

            # Validate all meal IDs
            valid_ids = self.meal_repo.validate_meal_ids(meal_ids)
            invalid_ids = [mid for mid in meal_ids if mid not in valid_ids]
            if invalid_ids:
                raise InvalidMealError(f"Meal IDs {invalid_ids} do not exist")

            # Add entries
            entries = []
            for meal_id in meal_ids:
                entry = self.repo.add_entry(meal_id)
                entries.append(entry)

            self.session.commit()

            # Refresh and convert to DTOs
            result = []
            for entry in entries:
                entry = self.repo.get_by_id(entry.id)
                result.append(self._entry_to_response_dto(entry))

            return result

        except (PlannerFullError, InvalidMealError):
            self.session.rollback()
            raise
        except SQLAlchemyError as e:
            self.session.rollback()
            raise RuntimeError(f"Failed to add meals to planner: {e}") from e

    # -- Read Operations -------------------------------------------------------------------------
    def get_entry(self, entry_id: int) -> Optional[PlannerEntryResponseDTO]:
        """
        Get a planner entry by ID.

        Args:
            entry_id: ID of the entry

        Returns:
            Entry as DTO or None if not found
        """
        try:
            entry = self.repo.get_by_id(entry_id)
            return self._entry_to_response_dto(entry) if entry else None
        except SQLAlchemyError:
            return None

    def get_all_entries(
        self,
        meal_id: Optional[int] = None,
        completed: Optional[bool] = None,
    ) -> List[PlannerEntryResponseDTO]:
        """
        Get planner entries with optional filtering.

        Args:
            meal_id: Filter by specific meal ID
            completed: Filter by completion status (True/False/None for all)

        Returns:
            List of entries as DTOs matching the filters
        """
        try:
            # Apply filters based on parameters
            if meal_id is not None:
                entries = self.repo.get_by_meal_id(meal_id)
                # Apply completion filter if also specified
                if completed is not None:
                    entries = [e for e in entries if e.is_completed == completed]
            elif completed is True:
                entries = self.repo.get_completed_entries()
            elif completed is False:
                entries = self.repo.get_incomplete_entries()
            else:
                entries = self.repo.get_all()

            return [self._entry_to_response_dto(e) for e in entries]
        except SQLAlchemyError:
            return []

    def get_meal_ids(self) -> List[int]:
        """
        Get all meal IDs in the planner.

        Returns:
            List of meal IDs in position order
        """
        try:
            return self.repo.get_meal_ids()
        except SQLAlchemyError:
            return []

    def get_summary(self) -> PlannerSummaryDTO:
        """
        Get a summary of the current planner state.

        Returns:
            PlannerSummaryDTO with counts and status
        """
        try:
            entries = self.repo.get_all()
            total_entries = len(entries)
            completed = sum(1 for e in entries if e.is_completed)

            # Count total recipes across all meals
            total_recipes = 0
            meal_names = []
            for entry in entries:
                if entry.meal:
                    meal_names.append(entry.meal.meal_name)
                    total_recipes += 1 + len(entry.meal.side_recipe_ids)

            return PlannerSummaryDTO(
                total_entries=total_entries,
                completed_entries=completed,
                incomplete_entries=total_entries - completed,
                total_recipes=total_recipes,
                meal_names=meal_names,
                is_at_capacity=(total_entries >= MAX_PLANNER_ENTRIES),
                max_capacity=MAX_PLANNER_ENTRIES,
            )
        except SQLAlchemyError as e:
            return PlannerSummaryDTO(
                total_entries=0,
                completed_entries=0,
                incomplete_entries=0,
                total_recipes=0,
                meal_names=[],
                is_at_capacity=False,
                max_capacity=MAX_PLANNER_ENTRIES,
                error=str(e),
            )

    # -- Update Operations -----------------------------------------------------------------------
    def reorder_entries(self, entry_ids: List[int]) -> bool:
        """
        Reorder planner entries.

        Args:
            entry_ids: List of entry IDs in desired order

        Returns:
            True if successful
        """
        try:
            result = self.repo.reorder_entries(entry_ids)
            self.session.commit()
            return result
        except SQLAlchemyError:
            self.session.rollback()
            return False

    def toggle_completion(self, entry_id: int) -> Optional[PlannerEntryResponseDTO]:
        """
        Toggle the completion status of a planner entry.

        Args:
            entry_id: ID of the entry

        Returns:
            Updated entry as DTO or None if not found
        """
        try:
            entry = self.repo.toggle_completion(entry_id)
            if not entry:
                return None

            self.session.commit()
            entry = self.repo.get_by_id(entry.id)
            return self._entry_to_response_dto(entry)
        except SQLAlchemyError:
            self.session.rollback()
            return None

    def mark_completed(self, entry_id: int) -> Optional[PlannerEntryResponseDTO]:
        """
        Mark a planner entry as completed.

        Args:
            entry_id: ID of the entry

        Returns:
            Updated entry as DTO or None if not found
        """
        try:
            entry = self.repo.mark_completed(entry_id)
            if not entry:
                return None

            self.session.commit()
            entry = self.repo.get_by_id(entry.id)
            return self._entry_to_response_dto(entry)
        except SQLAlchemyError:
            self.session.rollback()
            return None

    def mark_incomplete(self, entry_id: int) -> Optional[PlannerEntryResponseDTO]:
        """
        Mark a planner entry as incomplete.

        Args:
            entry_id: ID of the entry

        Returns:
            Updated entry as DTO or None if not found
        """
        try:
            entry = self.repo.mark_incomplete(entry_id)
            if not entry:
                return None

            self.session.commit()
            entry = self.repo.get_by_id(entry.id)
            return self._entry_to_response_dto(entry)
        except SQLAlchemyError:
            self.session.rollback()
            return None

    # -- Remove Operations -----------------------------------------------------------------------
    def remove_entry(self, entry_id: int) -> bool:
        """
        Remove a planner entry.
        Note: This does NOT delete the underlying meal.

        Args:
            entry_id: ID of the entry

        Returns:
            True if removed, False if not found
        """
        try:
            result = self.repo.remove_entry(entry_id)
            self.session.commit()
            return result
        except SQLAlchemyError:
            self.session.rollback()
            return False

    def remove_entries_by_meal(self, meal_id: int) -> int:
        """
        Remove all planner entries for a specific meal.

        Args:
            meal_id: ID of the meal

        Returns:
            Number of entries removed
        """
        try:
            count = self.repo.remove_entries_by_meal_id(meal_id)
            self.session.commit()
            return count
        except SQLAlchemyError:
            self.session.rollback()
            return 0

    def clear_planner(self) -> int:
        """
        Clear all entries from the planner.

        Returns:
            Number of entries cleared
        """
        try:
            count = self.repo.clear_all()
            self.session.commit()
            return count
        except SQLAlchemyError:
            self.session.rollback()
            return 0

    def clear_completed(self) -> int:
        """
        Clear all completed entries from the planner.

        Returns:
            Number of entries cleared
        """
        try:
            count = self.repo.clear_completed()
            self.session.commit()
            return count
        except SQLAlchemyError:
            self.session.rollback()
            return 0

    # -- Helper Methods --------------------------------------------------------------------------
    def _entry_to_response_dto(self, entry: PlannerEntry) -> PlannerEntryResponseDTO:
        """
        Convert a PlannerEntry model to a response DTO.

        Args:
            entry: PlannerEntry model

        Returns:
            PlannerEntryResponseDTO
        """
        meal = entry.meal
        return PlannerEntryResponseDTO(
            id=entry.id,
            meal_id=entry.meal_id,
            position=entry.position,
            is_completed=entry.is_completed,
            completed_at=entry.completed_at.isoformat() if entry.completed_at else None,
            scheduled_date=entry.scheduled_date.isoformat() if entry.scheduled_date else None,
            meal_name=meal.meal_name if meal else None,
            main_recipe_id=meal.main_recipe_id if meal else None,
            side_recipe_ids=meal.side_recipe_ids if meal else [],
            main_recipe=RecipeCardDTO.from_recipe(meal.main_recipe) if meal else None,
        )
