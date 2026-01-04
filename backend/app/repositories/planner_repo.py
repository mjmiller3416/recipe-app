"""app/core/repositories/planner_repo.py

Repository for managing planner entry operations.
Handles only the planner state - meal CRUD is in meal_repo.py.
"""

# -- Imports -------------------------------------------------------------------------------------
from __future__ import annotations

from typing import List, Optional

from sqlalchemy import delete, func, select, update
from sqlalchemy.orm import Session, joinedload

from ..models.meal import Meal
from ..models.planner_entry import PlannerEntry


# -- Constants -----------------------------------------------------------------------------------
MAX_PLANNER_ENTRIES = 15


# -- Planner Repository --------------------------------------------------------------------------
class PlannerRepo:
    """Repository for planner entry operations."""

    def __init__(self, session: Session):
        """Initialize the Planner Repository with a database session."""
        self.session = session

    # -- Create Operations -----------------------------------------------------------------------
    def add_entry(self, meal_id: int, position: Optional[int] = None) -> PlannerEntry:
        """
        Add a meal to the planner.

        Args:
            meal_id: ID of the meal to add
            position: Optional position (defaults to next available)

        Returns:
            Created PlannerEntry
        """
        if position is None:
            position = self._get_next_position()

        entry = PlannerEntry(meal_id=meal_id, position=position)
        self.session.add(entry)
        self.session.flush()
        self.session.refresh(entry)
        return entry

    # -- Read Operations -------------------------------------------------------------------------
    def get_by_id(self, entry_id: int) -> Optional[PlannerEntry]:
        """
        Get a planner entry by ID with eager-loaded meal and recipe.

        Args:
            entry_id: ID of the entry

        Returns:
            PlannerEntry if found, None otherwise
        """
        stmt = (
            select(PlannerEntry)
            .where(PlannerEntry.id == entry_id)
            .options(
                joinedload(PlannerEntry.meal).joinedload(Meal.main_recipe)
            )
        )
        result = self.session.execute(stmt)
        return result.scalar_one_or_none()

    def get_all(self) -> List[PlannerEntry]:
        """
        Get all active planner entries ordered by position, with eager-loaded relationships.
        Excludes cleared entries.

        Returns:
            List of all active planner entries
        """
        stmt = (
            select(PlannerEntry)
            .where(PlannerEntry.is_cleared == False)
            .options(
                joinedload(PlannerEntry.meal).joinedload(Meal.main_recipe)
            )
            .order_by(PlannerEntry.position)
        )
        result = self.session.execute(stmt)
        return result.scalars().unique().all()

    def get_by_meal_id(self, meal_id: int) -> List[PlannerEntry]:
        """
        Get all planner entries for a specific meal.

        Args:
            meal_id: ID of the meal

        Returns:
            List of planner entries for this meal
        """
        stmt = (
            select(PlannerEntry)
            .where(PlannerEntry.meal_id == meal_id)
            .options(
                joinedload(PlannerEntry.meal).joinedload(Meal.main_recipe)
            )
            .order_by(PlannerEntry.position)
        )
        result = self.session.execute(stmt)
        return result.scalars().unique().all()

    def get_meal_ids(self) -> List[int]:
        """
        Get all meal IDs currently in the planner.

        Returns:
            List of meal IDs in position order
        """
        stmt = (
            select(PlannerEntry.meal_id)
            .order_by(PlannerEntry.position)
        )
        result = self.session.execute(stmt)
        return list(result.scalars().all())

    def get_completed_entries(self) -> List[PlannerEntry]:
        """
        Get all completed planner entries that haven't been cleared.
        Used for the completed dropdown UI.

        Returns:
            List of completed entries (excludes cleared)
        """
        stmt = (
            select(PlannerEntry)
            .where(PlannerEntry.is_completed == True)
            .where(PlannerEntry.is_cleared == False)
            .options(
                joinedload(PlannerEntry.meal).joinedload(Meal.main_recipe)
            )
            .order_by(PlannerEntry.position)
        )
        result = self.session.execute(stmt)
        return result.scalars().unique().all()

    def get_cooking_history_entries(self) -> List[PlannerEntry]:
        """
        Get all entries with completion history for streak calculation.
        Includes cleared entries to preserve cooking history.

        Returns:
            List of all entries that have ever been completed
        """
        stmt = (
            select(PlannerEntry)
            .where(PlannerEntry.completed_at.isnot(None))
        )
        result = self.session.execute(stmt)
        return result.scalars().unique().all()

    def get_incomplete_entries(self) -> List[PlannerEntry]:
        """
        Get all incomplete planner entries that haven't been cleared.

        Returns:
            List of incomplete entries (excludes cleared)
        """
        stmt = (
            select(PlannerEntry)
            .where(PlannerEntry.is_completed == False)
            .where(PlannerEntry.is_cleared == False)
            .options(
                joinedload(PlannerEntry.meal).joinedload(Meal.main_recipe)
            )
            .order_by(PlannerEntry.position)
        )
        result = self.session.execute(stmt)
        return result.scalars().unique().all()

    def get_shopping_entries(self) -> List[PlannerEntry]:
        """
        Get incomplete planner entries that are NOT excluded from shopping.

        Returns:
            List of entries to include in shopping list generation
        """
        stmt = (
            select(PlannerEntry)
            .where(PlannerEntry.is_completed == False)
            .where(PlannerEntry.exclude_from_shopping == False)
            .options(
                joinedload(PlannerEntry.meal).joinedload(Meal.main_recipe)
            )
            .order_by(PlannerEntry.position)
        )
        result = self.session.execute(stmt)
        return result.scalars().unique().all()

    # -- Update Operations -----------------------------------------------------------------------
    def update(self, entry: PlannerEntry) -> PlannerEntry:
        """
        Update a planner entry.

        Args:
            entry: PlannerEntry with changes

        Returns:
            Updated entry
        """
        merged = self.session.merge(entry)
        self.session.flush()
        return merged

    def update_position(self, entry_id: int, new_position: int) -> Optional[PlannerEntry]:
        """
        Update the position of a planner entry.

        Args:
            entry_id: ID of the entry
            new_position: New position value

        Returns:
            Updated entry or None if not found
        """
        entry = self.get_by_id(entry_id)
        if not entry:
            return None

        entry.position = new_position
        self.session.flush()
        return entry

    def reorder_entries(self, entry_ids: List[int]) -> bool:
        """
        Reorder entries based on the provided ID order.
        Sets positions to 0, 1, 2, ... based on ID order.

        Args:
            entry_ids: List of entry IDs in desired order

        Returns:
            True if successful
        """
        for position, entry_id in enumerate(entry_ids):
            stmt = (
                update(PlannerEntry)
                .where(PlannerEntry.id == entry_id)
                .values(position=position)
            )
            self.session.execute(stmt)
        self.session.flush()
        return True

    def mark_completed(self, entry_id: int) -> Optional[PlannerEntry]:
        """
        Mark a planner entry as completed.

        Args:
            entry_id: ID of the entry

        Returns:
            Updated entry or None if not found
        """
        entry = self.get_by_id(entry_id)
        if not entry:
            return None

        entry.mark_completed()
        self.session.flush()
        return entry

    def mark_incomplete(self, entry_id: int) -> Optional[PlannerEntry]:
        """
        Mark a planner entry as incomplete.

        Args:
            entry_id: ID of the entry

        Returns:
            Updated entry or None if not found
        """
        entry = self.get_by_id(entry_id)
        if not entry:
            return None

        entry.mark_incomplete()
        self.session.flush()
        return entry

    def toggle_completion(self, entry_id: int) -> Optional[PlannerEntry]:
        """
        Toggle the completion status of a planner entry.

        Args:
            entry_id: ID of the entry

        Returns:
            Updated entry or None if not found
        """
        entry = self.get_by_id(entry_id)
        if not entry:
            return None

        entry.toggle_completion()
        self.session.flush()
        return entry

    def toggle_exclude_from_shopping(self, entry_id: int) -> Optional[PlannerEntry]:
        """
        Toggle the exclude_from_shopping status of a planner entry.

        Args:
            entry_id: ID of the entry

        Returns:
            Updated entry or None if not found
        """
        entry = self.get_by_id(entry_id)
        if not entry:
            return None

        entry.toggle_exclude_from_shopping()
        self.session.flush()
        return entry

    # -- Delete Operations -----------------------------------------------------------------------
    def remove_entry(self, entry_id: int) -> bool:
        """
        Remove a planner entry by ID.
        Does NOT delete the underlying meal.

        Args:
            entry_id: ID of the entry to remove

        Returns:
            True if removed, False if not found
        """
        entry = self.get_by_id(entry_id)
        if entry:
            self.session.delete(entry)
            self.session.flush()
            self._normalize_positions()
            return True
        return False

    def remove_entries_by_meal_id(self, meal_id: int) -> int:
        """
        Remove all planner entries for a specific meal.

        Args:
            meal_id: ID of the meal

        Returns:
            Number of entries removed
        """
        stmt = delete(PlannerEntry).where(PlannerEntry.meal_id == meal_id)
        result = self.session.execute(stmt)
        self.session.flush()
        self._normalize_positions()
        return result.rowcount

    def clear_all(self) -> int:
        """
        Clear all planner entries.

        Returns:
            Number of entries cleared
        """
        stmt = delete(PlannerEntry)
        result = self.session.execute(stmt)
        self.session.flush()
        return result.rowcount

    def clear_completed(self) -> int:
        """
        Soft-delete all completed planner entries by marking them as cleared.
        Preserves cooking history for streak calculation.

        Returns:
            Number of entries cleared
        """
        stmt = (
            update(PlannerEntry)
            .where(PlannerEntry.is_completed == True)
            .where(PlannerEntry.is_cleared == False)
            .values(is_cleared=True)
        )
        result = self.session.execute(stmt)
        self.session.flush()
        self._normalize_positions()
        return result.rowcount

    # -- Utility Methods -------------------------------------------------------------------------
    def count(self) -> int:
        """
        Count total number of active planner entries (excludes cleared).

        Returns:
            Total count of active entries
        """
        stmt = (
            select(func.count())
            .select_from(PlannerEntry)
            .where(PlannerEntry.is_cleared == False)
        )
        return self.session.execute(stmt).scalar() or 0

    def count_completed(self) -> int:
        """
        Count completed planner entries.

        Returns:
            Count of completed entries
        """
        stmt = (
            select(func.count())
            .select_from(PlannerEntry)
            .where(PlannerEntry.is_completed == True)
        )
        return self.session.execute(stmt).scalar() or 0

    def get_completion_stats_for_meal(self, meal_id: int) -> dict:
        """
        Get completion statistics for a specific meal.

        Args:
            meal_id: ID of the meal

        Returns:
            dict with 'times_cooked' (int) and 'last_cooked' (datetime or None)
        """
        stmt = (
            select(
                func.count(PlannerEntry.id).label('times_cooked'),
                func.max(PlannerEntry.completed_at).label('last_cooked')
            )
            .where(PlannerEntry.meal_id == meal_id)
            .where(PlannerEntry.is_completed == True)
        )
        result = self.session.execute(stmt).first()
        return {
            'times_cooked': result.times_cooked or 0,
            'last_cooked': result.last_cooked
        }

    def is_at_capacity(self) -> bool:
        """
        Check if the planner is at maximum capacity.

        Returns:
            True if at capacity (15 entries)
        """
        return self.count() >= MAX_PLANNER_ENTRIES

    def _get_next_position(self) -> int:
        """
        Get the next available position.

        Returns:
            Next position value
        """
        stmt = select(func.max(PlannerEntry.position))
        max_pos = self.session.execute(stmt).scalar()
        return (max_pos or -1) + 1

    def _normalize_positions(self) -> None:
        """
        Normalize positions to be contiguous (0, 1, 2, ...).
        Called after deletions to prevent gaps.
        """
        entries = self.get_all()
        for i, entry in enumerate(entries):
            if entry.position != i:
                entry.position = i
        self.session.flush()
