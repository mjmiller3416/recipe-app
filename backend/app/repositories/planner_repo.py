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
    def add_entry(self, meal_id: int, user_id: int, position: Optional[int] = None) -> PlannerEntry:
        """
        Add a meal to the planner for a specific user.

        Args:
            meal_id: ID of the meal to add
            user_id: ID of the user who owns this planner entry
            position: Optional position (defaults to next available)

        Returns:
            Created PlannerEntry
        """
        if position is None:
            position = self._get_next_position(user_id)

        entry = PlannerEntry(meal_id=meal_id, position=position, user_id=user_id)
        self.session.add(entry)
        self.session.flush()
        self.session.refresh(entry)
        return entry

    # -- Read Operations -------------------------------------------------------------------------
    def get_by_id(self, entry_id: int, user_id: Optional[int] = None) -> Optional[PlannerEntry]:
        """
        Get a planner entry by ID with eager-loaded meal and recipe.

        Args:
            entry_id: ID of the entry
            user_id: If provided, only return the entry if it belongs to this user.
                Returns None if the entry exists but belongs to a different user (no existence leak).

        Returns:
            PlannerEntry if found and owned by user, None otherwise
        """
        stmt = (
            select(PlannerEntry)
            .where(PlannerEntry.id == entry_id)
            .options(
                joinedload(PlannerEntry.meal).joinedload(Meal.main_recipe)
            )
        )
        if user_id is not None:
            stmt = stmt.where(PlannerEntry.user_id == user_id)
        result = self.session.execute(stmt)
        return result.scalar_one_or_none()

    def get_all(self, user_id: int) -> List[PlannerEntry]:
        """
        Get all active planner entries ordered by position, with eager-loaded relationships.
        Excludes cleared entries.

        Args:
            user_id: ID of the user whose planner entries to retrieve

        Returns:
            List of all active planner entries belonging to the user
        """
        stmt = (
            select(PlannerEntry)
            .where(PlannerEntry.user_id == user_id)
            .where(PlannerEntry.is_cleared == False)
            .options(
                joinedload(PlannerEntry.meal).joinedload(Meal.main_recipe)
            )
            .order_by(PlannerEntry.position)
        )
        result = self.session.execute(stmt)
        return result.scalars().unique().all()

    def get_by_meal_id(self, meal_id: int, user_id: int) -> List[PlannerEntry]:
        """
        Get all planner entries for a specific meal belonging to a user.

        Args:
            meal_id: ID of the meal
            user_id: ID of the user whose entries to retrieve

        Returns:
            List of planner entries for this meal belonging to the user
        """
        stmt = (
            select(PlannerEntry)
            .where(PlannerEntry.user_id == user_id)
            .where(PlannerEntry.meal_id == meal_id)
            .options(
                joinedload(PlannerEntry.meal).joinedload(Meal.main_recipe)
            )
            .order_by(PlannerEntry.position)
        )
        result = self.session.execute(stmt)
        return result.scalars().unique().all()

    def get_meal_ids(self, user_id: int) -> List[int]:
        """
        Get all meal IDs currently in the planner for a specific user.

        Args:
            user_id: ID of the user whose meal IDs to retrieve

        Returns:
            List of meal IDs in position order belonging to the user
        """
        stmt = (
            select(PlannerEntry.meal_id)
            .where(PlannerEntry.user_id == user_id)
            .order_by(PlannerEntry.position)
        )
        result = self.session.execute(stmt)
        return list(result.scalars().all())

    def get_completed_entries(self, user_id: int) -> List[PlannerEntry]:
        """
        Get all completed planner entries that haven't been cleared for a specific user.
        Used for the completed dropdown UI.

        Args:
            user_id: ID of the user whose completed entries to retrieve

        Returns:
            List of completed entries (excludes cleared) belonging to the user
        """
        stmt = (
            select(PlannerEntry)
            .where(PlannerEntry.user_id == user_id)
            .where(PlannerEntry.is_completed == True)
            .where(PlannerEntry.is_cleared == False)
            .options(
                joinedload(PlannerEntry.meal).joinedload(Meal.main_recipe)
            )
            .order_by(PlannerEntry.position)
        )
        result = self.session.execute(stmt)
        return result.scalars().unique().all()

    def get_cooking_history_entries(self, user_id: int) -> List[PlannerEntry]:
        """
        Get all entries with completion history for streak calculation for a specific user.
        Includes cleared entries to preserve cooking history.

        Args:
            user_id: ID of the user whose cooking history to retrieve

        Returns:
            List of all entries that have ever been completed belonging to the user
        """
        stmt = (
            select(PlannerEntry)
            .where(PlannerEntry.user_id == user_id)
            .where(PlannerEntry.completed_at.isnot(None))
        )
        result = self.session.execute(stmt)
        return result.scalars().unique().all()

    def get_incomplete_entries(self, user_id: int) -> List[PlannerEntry]:
        """
        Get all incomplete planner entries that haven't been cleared for a specific user.

        Args:
            user_id: ID of the user whose incomplete entries to retrieve

        Returns:
            List of incomplete entries (excludes cleared) belonging to the user
        """
        stmt = (
            select(PlannerEntry)
            .where(PlannerEntry.user_id == user_id)
            .where(PlannerEntry.is_completed == False)
            .where(PlannerEntry.is_cleared == False)
            .options(
                joinedload(PlannerEntry.meal).joinedload(Meal.main_recipe)
            )
            .order_by(PlannerEntry.position)
        )
        result = self.session.execute(stmt)
        return result.scalars().unique().all()

    def get_shopping_entries(self, user_id: int) -> List[PlannerEntry]:
        """
        Get incomplete planner entries that have any shopping mode except 'none' for a user.

        Args:
            user_id: ID of the user whose shopping entries to retrieve

        Returns:
            List of entries to include in shopping list generation belonging to the user
        """
        stmt = (
            select(PlannerEntry)
            .where(PlannerEntry.user_id == user_id)
            .where(PlannerEntry.is_completed == False)
            .where(PlannerEntry.is_cleared == False)
            .where(PlannerEntry.shopping_mode != 'none')
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

    def update_position(self, entry_id: int, new_position: int, user_id: int) -> Optional[PlannerEntry]:
        """
        Update the position of a planner entry if owned by the user.

        Args:
            entry_id: ID of the entry
            new_position: New position value
            user_id: ID of the user who owns the entry

        Returns:
            Updated entry or None if not found/not owned
        """
        entry = self.get_by_id(entry_id, user_id)
        if not entry:
            return None

        entry.position = new_position
        self.session.flush()
        return entry

    def reorder_entries(self, entry_ids: List[int], user_id: int) -> bool:
        """
        Reorder entries based on the provided ID order for a specific user.
        Sets positions to 0, 1, 2, ... based on ID order.

        Args:
            entry_ids: List of entry IDs in desired order
            user_id: ID of the user who owns the entries

        Returns:
            True if successful
        """
        for position, entry_id in enumerate(entry_ids):
            stmt = (
                update(PlannerEntry)
                .where(PlannerEntry.id == entry_id)
                .where(PlannerEntry.user_id == user_id)
                .values(position=position)
            )
            self.session.execute(stmt)
        self.session.flush()
        return True

    def mark_completed(self, entry_id: int, user_id: int) -> Optional[PlannerEntry]:
        """
        Mark a planner entry as completed if owned by the user.

        Args:
            entry_id: ID of the entry
            user_id: ID of the user who owns the entry

        Returns:
            Updated entry or None if not found/not owned
        """
        entry = self.get_by_id(entry_id, user_id)
        if not entry:
            return None

        entry.mark_completed()
        self.session.flush()
        return entry

    def mark_incomplete(self, entry_id: int, user_id: int) -> Optional[PlannerEntry]:
        """
        Mark a planner entry as incomplete if owned by the user.

        Args:
            entry_id: ID of the entry
            user_id: ID of the user who owns the entry

        Returns:
            Updated entry or None if not found/not owned
        """
        entry = self.get_by_id(entry_id, user_id)
        if not entry:
            return None

        entry.mark_incomplete()
        self.session.flush()
        return entry

    def cycle_shopping_mode(self, entry_id: int, user_id: int) -> Optional[PlannerEntry]:
        """
        Cycle the shopping mode of a planner entry if owned by the user: all -> produce_only -> none -> all.

        Args:
            entry_id: ID of the entry
            user_id: ID of the user who owns the entry

        Returns:
            Updated entry or None if not found/not owned
        """
        entry = self.get_by_id(entry_id, user_id)
        if not entry:
            return None

        entry.cycle_shopping_mode()
        self.session.flush()
        return entry

    # -- Delete Operations -----------------------------------------------------------------------
    def remove_entry(self, entry_id: int, user_id: int) -> bool:
        """
        Remove a planner entry by ID if owned by the user.
        Does NOT delete the underlying meal.

        Args:
            entry_id: ID of the entry to remove
            user_id: ID of the user who owns the entry

        Returns:
            True if removed, False if not found/not owned
        """
        entry = self.get_by_id(entry_id, user_id)
        if entry:
            self.session.delete(entry)
            self.session.flush()
            self._normalize_positions(user_id)
            return True
        return False

    def remove_entries_by_meal_id(self, meal_id: int, user_id: int) -> int:
        """
        Remove all planner entries for a specific meal belonging to a user.

        Args:
            meal_id: ID of the meal
            user_id: ID of the user whose entries to remove

        Returns:
            Number of entries removed
        """
        stmt = (
            delete(PlannerEntry)
            .where(PlannerEntry.user_id == user_id)
            .where(PlannerEntry.meal_id == meal_id)
        )
        result = self.session.execute(stmt)
        self.session.flush()
        self._normalize_positions(user_id)
        return result.rowcount

    def clear_all(self, user_id: int) -> int:
        """
        Clear all planner entries for a specific user.

        Args:
            user_id: ID of the user whose entries to clear

        Returns:
            Number of entries cleared
        """
        stmt = delete(PlannerEntry).where(PlannerEntry.user_id == user_id)
        result = self.session.execute(stmt)
        self.session.flush()
        return result.rowcount

    def clear_completed(self, user_id: int) -> int:
        """
        Soft-delete all completed planner entries by marking them as cleared for a user.
        Preserves cooking history for streak calculation.

        Args:
            user_id: ID of the user whose completed entries to clear

        Returns:
            Number of entries cleared
        """
        stmt = (
            update(PlannerEntry)
            .where(PlannerEntry.user_id == user_id)
            .where(PlannerEntry.is_completed == True)
            .where(PlannerEntry.is_cleared == False)
            .values(is_cleared=True)
        )
        result = self.session.execute(stmt)
        self.session.flush()
        self._normalize_positions(user_id)
        return result.rowcount

    # -- Utility Methods -------------------------------------------------------------------------
    def count(self, user_id: int) -> int:
        """
        Count total number of active planner entries (excludes cleared) for a user.

        Args:
            user_id: ID of the user whose entries to count

        Returns:
            Total count of active entries belonging to the user
        """
        stmt = (
            select(func.count())
            .select_from(PlannerEntry)
            .where(PlannerEntry.user_id == user_id)
            .where(PlannerEntry.is_cleared == False)
        )
        return self.session.execute(stmt).scalar() or 0

    def count_completed(self, user_id: int) -> int:
        """
        Count completed planner entries for a user.

        Args:
            user_id: ID of the user whose completed entries to count

        Returns:
            Count of completed entries belonging to the user
        """
        stmt = (
            select(func.count())
            .select_from(PlannerEntry)
            .where(PlannerEntry.user_id == user_id)
            .where(PlannerEntry.is_completed == True)
        )
        return self.session.execute(stmt).scalar() or 0

    def count_active_entries_for_meal(self, meal_id: int, user_id: int) -> int:
        """
        Count active (non-cleared) planner entries for a specific meal belonging to a user.
        Used for transient meal cleanup logic.

        Args:
            meal_id: ID of the meal
            user_id: ID of the user whose entries to count

        Returns:
            Count of active entries referencing this meal belonging to the user
        """
        stmt = (
            select(func.count())
            .select_from(PlannerEntry)
            .where(PlannerEntry.user_id == user_id)
            .where(PlannerEntry.meal_id == meal_id)
            .where(PlannerEntry.is_cleared == False)
        )
        return self.session.execute(stmt).scalar() or 0

    def count_all_entries_for_meal(self, meal_id: int, user_id: int) -> int:
        """
        Count all planner entries (active + cleared) for a specific meal belonging to a user.
        Used to preserve cooking history when cleaning up transient meals.

        Args:
            meal_id: ID of the meal
            user_id: ID of the user whose entries to count

        Returns:
            Count of all entries (including cleared) referencing this meal belonging to the user
        """
        stmt = (
            select(func.count())
            .select_from(PlannerEntry)
            .where(PlannerEntry.user_id == user_id)
            .where(PlannerEntry.meal_id == meal_id)
        )
        return self.session.execute(stmt).scalar() or 0

    def get_completion_stats_for_meal(self, meal_id: int, user_id: int) -> dict:
        """
        Get completion statistics for a specific meal belonging to a user.

        Args:
            meal_id: ID of the meal
            user_id: ID of the user whose stats to get

        Returns:
            dict with 'times_cooked' (int) and 'last_cooked' (datetime or None)
        """
        stmt = (
            select(
                func.count(PlannerEntry.id).label('times_cooked'),
                func.max(PlannerEntry.completed_at).label('last_cooked')
            )
            .where(PlannerEntry.user_id == user_id)
            .where(PlannerEntry.meal_id == meal_id)
            .where(PlannerEntry.is_completed == True)
        )
        result = self.session.execute(stmt).first()
        return {
            'times_cooked': result.times_cooked or 0,
            'last_cooked': result.last_cooked
        }

    def is_at_capacity(self, user_id: int) -> bool:
        """
        Check if the planner is at maximum capacity for a user.

        Args:
            user_id: ID of the user whose planner to check

        Returns:
            True if at capacity (15 entries)
        """
        return self.count(user_id) >= MAX_PLANNER_ENTRIES

    def _get_next_position(self, user_id: int) -> int:
        """
        Get the next available position for a user.

        Args:
            user_id: ID of the user whose position to calculate

        Returns:
            Next position value
        """
        stmt = (
            select(func.max(PlannerEntry.position))
            .where(PlannerEntry.user_id == user_id)
        )
        max_pos = self.session.execute(stmt).scalar()
        return (max_pos or -1) + 1

    def _normalize_positions(self, user_id: int) -> None:
        """
        Normalize positions to be contiguous (0, 1, 2, ...) for a user.
        Called after deletions to prevent gaps.

        Args:
            user_id: ID of the user whose positions to normalize
        """
        entries = self.get_all(user_id)
        for i, entry in enumerate(entries):
            if entry.position != i:
                entry.position = i
        self.session.flush()
