"""app/core/repositories/planner_repo.py

Repository for managing planner entry operations.
"""

# ── Imports ─────────────────────────────────────────────────────────────────────────────────────────────────
from __future__ import annotations

from typing import List, Optional

from sqlalchemy import delete, select, func
from sqlalchemy.orm import Session, joinedload

from ..models.planner_entry import PlannerEntry
from ..models.meal import Meal


# ── Planner Repository ──────────────────────────────────────────────────────────────────────────────────────
class PlannerRepo:
    """Repository for planner entry operations."""

    MAX_PLANNER_ENTRIES = 15

    def __init__(self, session: Session):
        """Initialize the Planner Repository with a database session."""
        self.session = session

    # ── Planner Entry CRUD Operations ───────────────────────────────────────────────────────────────────────
    def create_entry(self, entry: PlannerEntry) -> PlannerEntry:
        """
        Create and persist a new PlannerEntry to the database.

        Args:
            entry: Unsaved PlannerEntry model instance (id should be None)

        Returns:
            Saved PlannerEntry instance with assigned ID
        """
        if entry.id is not None:
            raise ValueError("Cannot create a planner entry that already has an ID.")

        self.session.add(entry)
        self.session.flush()
        self.session.refresh(entry)
        return entry

    def update_entry(self, entry: PlannerEntry) -> PlannerEntry:
        """
        Update an existing PlannerEntry in the database.

        Args:
            entry: PlannerEntry model instance with valid ID

        Returns:
            Updated planner entry
        """
        if entry.id is None:
            raise ValueError("Cannot update a planner entry without an ID.")

        merged_entry = self.session.merge(entry)
        self.session.flush()
        return merged_entry

    def get_entry_by_id(self, entry_id: int, load_meal: bool = True) -> Optional[PlannerEntry]:
        """
        Load a PlannerEntry from the database by ID.

        Args:
            entry_id: ID of the planner entry to load
            load_meal: Whether to eagerly load the meal relationship

        Returns:
            Loaded PlannerEntry or None if not found
        """
        stmt = select(PlannerEntry).where(PlannerEntry.id == entry_id)

        if load_meal:
            stmt = stmt.options(
                joinedload(PlannerEntry.meal).joinedload(Meal.main_recipe)
            )

        result = self.session.execute(stmt)
        return result.scalar_one_or_none()

    def get_all_entries(self, load_meal: bool = True) -> List[PlannerEntry]:
        """
        Get all planner entries ordered by position.

        Args:
            load_meal: Whether to eagerly load the meal relationship

        Returns:
            List of all planner entries ordered by position
        """
        stmt = select(PlannerEntry).order_by(PlannerEntry.position)

        if load_meal:
            stmt = stmt.options(
                joinedload(PlannerEntry.meal).joinedload(Meal.main_recipe)
            )

        result = self.session.execute(stmt)
        return result.scalars().unique().all()

    def delete_entry(self, entry_id: int) -> bool:
        """
        Delete a planner entry by ID.

        Args:
            entry_id: ID of the planner entry to delete

        Returns:
            True if deleted, False if not found
        """
        stmt = select(PlannerEntry).where(PlannerEntry.id == entry_id)
        result = self.session.execute(stmt)
        entry = result.scalar_one_or_none()

        if entry:
            self.session.delete(entry)
            self.session.flush()
            return True
        return False

    def clear_all_entries(self) -> int:
        """
        Clear all planner entries from the database.

        Returns:
            Number of entries deleted
        """
        stmt = delete(PlannerEntry)
        result = self.session.execute(stmt)
        self.session.flush()
        return result.rowcount

    # ── Position Management ─────────────────────────────────────────────────────────────────────────────────
    def get_next_position(self) -> int:
        """
        Get the next available position for a new planner entry.

        Returns:
            Next position value (0-indexed)
        """
        stmt = select(func.max(PlannerEntry.position))
        result = self.session.execute(stmt)
        max_position = result.scalar()
        return 0 if max_position is None else max_position + 1

    def reorder_entries(self, entry_ids_in_order: List[int]) -> bool:
        """
        Reorder planner entries according to the provided list of entry IDs.

        Args:
            entry_ids_in_order: List of entry IDs in the desired order

        Returns:
            True if reordered successfully, False otherwise
        """
        # Get all entries
        entries = {entry.id: entry for entry in self.get_all_entries(load_meal=False)}

        # Verify all IDs exist
        if not all(eid in entries for eid in entry_ids_in_order):
            return False

        # Update positions
        for new_position, entry_id in enumerate(entry_ids_in_order):
            entries[entry_id].position = new_position

        self.session.flush()
        return True

    def update_entry_position(self, entry_id: int, new_position: int) -> bool:
        """
        Update the position of a specific entry and adjust other entries accordingly.

        Args:
            entry_id: ID of the entry to move
            new_position: New position for the entry

        Returns:
            True if updated successfully, False otherwise
        """
        entry = self.get_entry_by_id(entry_id, load_meal=False)
        if not entry:
            return False

        old_position = entry.position
        if old_position == new_position:
            return True

        # Get all entries ordered by position
        all_entries = self.get_all_entries(load_meal=False)

        # Remove the entry from its current position
        all_entries = [e for e in all_entries if e.id != entry_id]

        # Insert at new position
        all_entries.insert(new_position, entry)

        # Update all positions
        for idx, e in enumerate(all_entries):
            e.position = idx

        self.session.flush()
        return True

    def normalize_positions(self) -> None:
        """
        Normalize all planner entry positions to be contiguous (0, 1, 2, ...).
        Useful after deletions to ensure no gaps.
        """
        entries = self.get_all_entries(load_meal=False)
        for idx, entry in enumerate(entries):
            entry.position = idx
        self.session.flush()

    # ── Query Methods ───────────────────────────────────────────────────────────────────────────────────────
    def get_entries_by_meal_id(self, meal_id: int, load_meal: bool = True) -> List[PlannerEntry]:
        """
        Get all planner entries for a specific meal.

        Args:
            meal_id: ID of the meal
            load_meal: Whether to eagerly load the meal relationship

        Returns:
            List of planner entries for the meal
        """
        stmt = select(PlannerEntry).where(PlannerEntry.meal_id == meal_id).order_by(PlannerEntry.position)

        if load_meal:
            stmt = stmt.options(
                joinedload(PlannerEntry.meal).joinedload(Meal.main_recipe)
            )

        result = self.session.execute(stmt)
        return result.scalars().unique().all()

    def get_completed_entries(self, load_meal: bool = True) -> List[PlannerEntry]:
        """
        Get all completed planner entries.

        Args:
            load_meal: Whether to eagerly load the meal relationship

        Returns:
            List of completed planner entries
        """
        stmt = select(PlannerEntry).where(
            PlannerEntry.is_completed == True
        ).order_by(PlannerEntry.position)

        if load_meal:
            stmt = stmt.options(
                joinedload(PlannerEntry.meal).joinedload(Meal.main_recipe)
            )

        result = self.session.execute(stmt)
        return result.scalars().unique().all()

    def get_pending_entries(self, load_meal: bool = True) -> List[PlannerEntry]:
        """
        Get all pending (not completed) planner entries.

        Args:
            load_meal: Whether to eagerly load the meal relationship

        Returns:
            List of pending planner entries
        """
        stmt = select(PlannerEntry).where(
            PlannerEntry.is_completed == False
        ).order_by(PlannerEntry.position)

        if load_meal:
            stmt = stmt.options(
                joinedload(PlannerEntry.meal).joinedload(Meal.main_recipe)
            )

        result = self.session.execute(stmt)
        return result.scalars().unique().all()

    # ── Validation Methods ──────────────────────────────────────────────────────────────────────────────────
    def validate_meal_ids(self, meal_ids: List[int]) -> List[int]:
        """
        Validate the given meal IDs against the database.

        Args:
            meal_ids: List of meal IDs to validate

        Returns:
            List of valid meal IDs that exist in the database
        """
        if not meal_ids:
            return []

        stmt = select(Meal.id).where(Meal.id.in_(meal_ids))
        result = self.session.execute(stmt)
        return result.scalars().all()

    def can_add_entry(self) -> bool:
        """
        Check if a new entry can be added (respects max limit).

        Returns:
            True if can add, False if at max capacity
        """
        return self.count_entries() < self.MAX_PLANNER_ENTRIES

    # ── Utility Methods ─────────────────────────────────────────────────────────────────────────────────────
    def count_entries(self) -> int:
        """
        Count total number of planner entries.

        Returns:
            Total count of planner entries
        """
        stmt = select(func.count()).select_from(PlannerEntry)
        return self.session.execute(stmt).scalar() or 0

    def count_completed_entries(self) -> int:
        """
        Count number of completed planner entries.

        Returns:
            Count of completed entries
        """
        stmt = select(func.count()).select_from(PlannerEntry).where(
            PlannerEntry.is_completed == True
        )
        return self.session.execute(stmt).scalar() or 0

    def count_pending_entries(self) -> int:
        """
        Count number of pending planner entries.

        Returns:
            Count of pending entries
        """
        stmt = select(func.count()).select_from(PlannerEntry).where(
            PlannerEntry.is_completed == False
        )
        return self.session.execute(stmt).scalar() or 0
