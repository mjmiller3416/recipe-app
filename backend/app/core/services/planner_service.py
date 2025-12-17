"""app/core/services/planner_service.py

Service layer for managing planner entry operations and business logic.
Orchestrates repository operations and implements business rules.
"""

# ── Imports ─────────────────────────────────────────────────────────────────────────────────────────────────
from __future__ import annotations

from typing import List, Optional

from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from ..dtos.planner_dtos import (
    PlannerEntryCreateDTO,
    PlannerEntryResponseDTO,
    PlannerEntryUpdateDTO,
    PlannerEntriesReorderDTO,
    PlannerSummaryDTO,
    PlannerValidationDTO,
)
from ..dtos.meal_dtos import MealResponseDTO
from ..dtos.recipe_dtos import RecipeCardDTO
from ..models.planner_entry import PlannerEntry
from ..repositories.planner_repo import PlannerRepo
from ..repositories.meal_repo import MealRepo


# ── Planner Service ─────────────────────────────────────────────────────────────────────────────────────────
class PlannerService:
    """Service for planner entry operations with business logic."""

    def __init__(self, session: Session | None = None):
        """
        Initialize the PlannerService with a database session and repository.
        If no session is provided, a new session is created.
        """
        if session is None:
            from app.core.database.db import create_session
            session = create_session()
        self.session = session
        self.planner_repo = PlannerRepo(self.session)
        self.meal_repo = MealRepo(self.session)

    # ── Planner Entry CRUD Operations ───────────────────────────────────────────────────────────────────────
    def add_meal_to_planner(self, create_dto: PlannerEntryCreateDTO) -> Optional[PlannerEntryResponseDTO]:
        """
        Add a meal to the planner (create a planner entry).

        Args:
            create_dto: Data for creating the planner entry

        Returns:
            Created planner entry or None if failed
        """
        try:
            # Check if we can add more entries
            if not self.planner_repo.can_add_entry():
                raise ValueError(
                    f"Cannot add more entries. Maximum {self.planner_repo.MAX_PLANNER_ENTRIES} entries allowed."
                )

            # Validate meal exists
            valid_meal_ids = self.planner_repo.validate_meal_ids([create_dto.meal_id])
            if create_dto.meal_id not in valid_meal_ids:
                raise ValueError(f"Meal ID {create_dto.meal_id} does not exist")

            # Get next position
            next_position = self.planner_repo.get_next_position()

            # Create the planner entry
            entry = PlannerEntry(
                meal_id=create_dto.meal_id,
                position=next_position,
                scheduled_date=create_dto.scheduled_date
            )

            created_entry = self.planner_repo.create_entry(entry)
            self.session.commit()
            return self._entry_to_response_dto(created_entry)

        except (SQLAlchemyError, ValueError) as e:
            self.session.rollback()
            print(f"Failed to add meal to planner, transaction rolled back: {e}")
            return None

    def update_planner_entry(self, entry_id: int, update_dto: PlannerEntryUpdateDTO) -> Optional[PlannerEntryResponseDTO]:
        """
        Update an existing planner entry.

        Args:
            entry_id: ID of the planner entry to update
            update_dto: Updated data

        Returns:
            Updated planner entry or None if failed
        """
        try:
            # Get existing entry
            existing_entry = self.planner_repo.get_entry_by_id(entry_id, load_meal=False)
            if not existing_entry:
                return None

            # Update fields from DTO
            if update_dto.position is not None:
                # Use the repository method for position updates to maintain order
                self.planner_repo.update_entry_position(entry_id, update_dto.position)
                # Refresh the entry after position update
                self.session.refresh(existing_entry)

            if update_dto.is_completed is not None:
                if update_dto.is_completed:
                    existing_entry.mark_completed()
                else:
                    existing_entry.mark_incomplete()

            if update_dto.scheduled_date is not None:
                existing_entry.scheduled_date = update_dto.scheduled_date

            updated_entry = self.planner_repo.update_entry(existing_entry)
            self.session.commit()
            return self._entry_to_response_dto(updated_entry)

        except (SQLAlchemyError, ValueError) as e:
            self.session.rollback()
            print(f"Failed to update planner entry {entry_id}, transaction rolled back: {e}")
            return None

    def get_planner_entry(self, entry_id: int) -> Optional[PlannerEntryResponseDTO]:
        """
        Get a planner entry by ID.

        Args:
            entry_id: ID of the planner entry

        Returns:
            Planner entry or None if not found
        """
        try:
            entry = self.planner_repo.get_entry_by_id(entry_id)
            return self._entry_to_response_dto(entry) if entry else None
        except SQLAlchemyError:
            return None

    def get_all_planner_entries(self) -> List[PlannerEntryResponseDTO]:
        """
        Get all planner entries ordered by position.

        Returns:
            List of all planner entries
        """
        try:
            entries = self.planner_repo.get_all_entries()
            return [self._entry_to_response_dto(entry) for entry in entries]
        except SQLAlchemyError:
            return []

    def remove_meal_from_planner(self, entry_id: int) -> bool:
        """
        Remove a meal from the planner (delete planner entry).
        Note: This does NOT delete the underlying meal.

        Args:
            entry_id: ID of the planner entry to delete

        Returns:
            True if deleted successfully, False otherwise
        """
        try:
            result = self.planner_repo.delete_entry(entry_id)
            if result:
                # Normalize positions after deletion to avoid gaps
                self.planner_repo.normalize_positions()
            self.session.commit()
            return result
        except SQLAlchemyError:
            self.session.rollback()
            return False

    def clear_planner(self) -> bool:
        """
        Clear all entries from the planner.

        Returns:
            True if successful, False otherwise
        """
        try:
            self.planner_repo.clear_all_entries()
            self.session.commit()
            return True
        except SQLAlchemyError:
            self.session.rollback()
            return False

    # ── Position and Ordering ───────────────────────────────────────────────────────────────────────────────
    def reorder_planner_entries(self, reorder_dto: PlannerEntriesReorderDTO) -> bool:
        """
        Reorder all planner entries according to the provided list of entry IDs.

        Args:
            reorder_dto: New order of entry IDs

        Returns:
            True if reordered successfully, False otherwise
        """
        try:
            result = self.planner_repo.reorder_entries(reorder_dto.entry_ids)
            if result:
                self.session.commit()
            else:
                self.session.rollback()
            return result
        except SQLAlchemyError:
            self.session.rollback()
            return False

    def move_entry(self, entry_id: int, new_position: int) -> Optional[PlannerEntryResponseDTO]:
        """
        Move a planner entry to a new position.

        Args:
            entry_id: ID of the entry to move
            new_position: New position (0-indexed)

        Returns:
            Updated planner entry or None if failed
        """
        try:
            if not self.planner_repo.update_entry_position(entry_id, new_position):
                return None

            self.session.commit()
            entry = self.planner_repo.get_entry_by_id(entry_id)
            return self._entry_to_response_dto(entry) if entry else None

        except SQLAlchemyError:
            self.session.rollback()
            return None

    # ── Completion Management ───────────────────────────────────────────────────────────────────────────────
    def mark_entry_completed(self, entry_id: int) -> Optional[PlannerEntryResponseDTO]:
        """
        Mark a planner entry as completed.

        Args:
            entry_id: ID of the planner entry

        Returns:
            Updated planner entry or None if failed
        """
        try:
            entry = self.planner_repo.get_entry_by_id(entry_id, load_meal=False)
            if not entry:
                return None

            entry.mark_completed()
            updated_entry = self.planner_repo.update_entry(entry)
            self.session.commit()
            return self._entry_to_response_dto(updated_entry)

        except SQLAlchemyError:
            self.session.rollback()
            return None

    def mark_entry_incomplete(self, entry_id: int) -> Optional[PlannerEntryResponseDTO]:
        """
        Mark a planner entry as incomplete.

        Args:
            entry_id: ID of the planner entry

        Returns:
            Updated planner entry or None if failed
        """
        try:
            entry = self.planner_repo.get_entry_by_id(entry_id, load_meal=False)
            if not entry:
                return None

            entry.mark_incomplete()
            updated_entry = self.planner_repo.update_entry(entry)
            self.session.commit()
            return self._entry_to_response_dto(updated_entry)

        except SQLAlchemyError:
            self.session.rollback()
            return None

    # ── Query Operations ────────────────────────────────────────────────────────────────────────────────────
    def get_completed_entries(self) -> List[PlannerEntryResponseDTO]:
        """
        Get all completed planner entries.

        Returns:
            List of completed entries
        """
        try:
            entries = self.planner_repo.get_completed_entries()
            return [self._entry_to_response_dto(entry) for entry in entries]
        except SQLAlchemyError:
            return []

    def get_pending_entries(self) -> List[PlannerEntryResponseDTO]:
        """
        Get all pending (not completed) planner entries.

        Returns:
            List of pending entries
        """
        try:
            entries = self.planner_repo.get_pending_entries()
            return [self._entry_to_response_dto(entry) for entry in entries]
        except SQLAlchemyError:
            return []

    def get_entries_by_meal(self, meal_id: int) -> List[PlannerEntryResponseDTO]:
        """
        Get all planner entries for a specific meal.

        Args:
            meal_id: ID of the meal

        Returns:
            List of planner entries for the meal
        """
        try:
            entries = self.planner_repo.get_entries_by_meal_id(meal_id)
            return [self._entry_to_response_dto(entry) for entry in entries]
        except SQLAlchemyError:
            return []

    # ── Summary and Validation ──────────────────────────────────────────────────────────────────────────────
    def get_planner_summary(self) -> PlannerSummaryDTO:
        """
        Get a summary of the current planner.

        Returns:
            Summary with counts and status information
        """
        try:
            total_entries = self.planner_repo.count_entries()
            completed = self.planner_repo.count_completed_entries()
            pending = self.planner_repo.count_pending_entries()

            # Count total recipes in planner
            entries = self.planner_repo.get_all_entries()
            total_recipes = 0
            for entry in entries:
                if entry.meal:
                    # Count main recipe + side recipes
                    total_recipes += 1 + len(entry.meal.side_recipe_ids)

            return PlannerSummaryDTO(
                total_entries=total_entries,
                completed_entries=completed,
                pending_entries=pending,
                total_recipes=total_recipes,
                has_entries=(total_entries > 0)
            )

        except SQLAlchemyError as e:
            return PlannerSummaryDTO(
                total_entries=0,
                completed_entries=0,
                pending_entries=0,
                total_recipes=0,
                has_entries=False,
                error=str(e)
            )

    def validate_planner_state(self) -> PlannerValidationDTO:
        """
        Validate the current planner state.

        Returns:
            Validation result with capacity information
        """
        try:
            current_count = self.planner_repo.count_entries()
            max_count = self.planner_repo.MAX_PLANNER_ENTRIES
            can_add_more = current_count < max_count

            return PlannerValidationDTO(
                is_valid=True,
                can_add_more=can_add_more,
                current_count=current_count,
                max_count=max_count
            )

        except SQLAlchemyError as e:
            return PlannerValidationDTO(
                is_valid=False,
                can_add_more=False,
                current_count=0,
                max_count=self.planner_repo.MAX_PLANNER_ENTRIES,
                error=str(e)
            )

    # ── Helper Methods ──────────────────────────────────────────────────────────────────────────────────────
    def _entry_to_response_dto(self, entry: PlannerEntry) -> PlannerEntryResponseDTO:
        """
        Convert a PlannerEntry model to a response DTO.

        Args:
            entry: PlannerEntry model

        Returns:
            Response DTO
        """
        # Convert meal to response DTO if loaded
        meal_dto = None
        if entry.meal:
            meal = entry.meal
            main_recipe = RecipeCardDTO.from_recipe(meal.main_recipe) if meal.main_recipe else None

            # Get side recipes
            side_recipes = []
            if meal.side_recipe_ids:
                side_recipe_dict = self.meal_repo.get_recipes_for_meals(meal.side_recipe_ids)
                for recipe_id in meal.side_recipe_ids:
                    if recipe_id in side_recipe_dict:
                        side_recipes.append(RecipeCardDTO.from_recipe(side_recipe_dict[recipe_id]))

            meal_dto = MealResponseDTO.from_meal(
                meal=meal,
                main_recipe=main_recipe,
                side_recipes=side_recipes
            )

        return PlannerEntryResponseDTO(
            id=entry.id,
            meal_id=entry.meal_id,
            position=entry.position,
            is_completed=entry.is_completed,
            completed_at=entry.completed_at,
            scheduled_date=entry.scheduled_date,
            meal=meal_dto
        )
