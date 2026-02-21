"""app/repositories/user_ingredient_unit_repo.py

Repository for managing user ingredient unit CRUD operations.
"""

# -- Imports -------------------------------------------------------------------------------------
from __future__ import annotations

from typing import Dict, List, Optional

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..models.user_ingredient_unit import UserIngredientUnit


# -- UserIngredientUnit Repository ---------------------------------------------------------------
class UserIngredientUnitRepo:
    """Repository for user ingredient unit operations."""

    def __init__(self, session: Session):
        """Initialize the UserIngredientUnit Repository with a database session."""
        self.session = session

    # -- Create Operations -----------------------------------------------------------------------
    def create(
        self,
        user_id: int,
        value: str,
        label: str,
        is_custom: bool,
        position: int,
        unit_type: str = "count",
    ) -> UserIngredientUnit:
        """
        Create and persist a new UserIngredientUnit to the database.

        Args:
            user_id: ID of the user who owns this unit
            value: Slug value (e.g., "oz", "tsp", "bag")
            label: Display name (e.g., "oz", "tsp", "bag")
            is_custom: True if user-created, False if built-in
            position: Sort order position (0-based)
            unit_type: Classification - "mass", "volume", or "count"

        Returns:
            Saved UserIngredientUnit with assigned ID
        """
        unit = UserIngredientUnit(
            user_id=user_id,
            value=value,
            label=label,
            unit_type=unit_type,
            is_custom=is_custom,
            is_enabled=True,
            position=position,
        )
        self.session.add(unit)
        self.session.flush()
        self.session.refresh(unit)
        return unit

    def seed_defaults(
        self, user_id: int, defaults: List[Dict[str, str]]
    ) -> List[UserIngredientUnit]:
        """
        Seed default built-in ingredient units for a new user.

        Args:
            user_id: ID of the user to seed units for
            defaults: List of dicts with 'value', 'label', and 'unit_type' keys

        Returns:
            List of created UserIngredientUnit instances
        """
        units = []
        for position, item in enumerate(defaults):
            unit = UserIngredientUnit(
                user_id=user_id,
                value=item["value"],
                label=item["label"],
                unit_type=item["unit_type"],
                is_custom=False,
                is_enabled=True,
                position=position,
            )
            self.session.add(unit)
            units.append(unit)

        self.session.flush()
        for unit in units:
            self.session.refresh(unit)
        return units

    # -- Read Operations -------------------------------------------------------------------------
    def get_by_id(self, unit_id: int, user_id: int) -> Optional[UserIngredientUnit]:
        """
        Get a unit by ID.

        Args:
            unit_id: ID of the unit to load
            user_id: ID of the user who owns the unit

        Returns:
            UserIngredientUnit if found and owned by user, None otherwise
        """
        stmt = (
            select(UserIngredientUnit)
            .where(UserIngredientUnit.id == unit_id)
            .where(UserIngredientUnit.user_id == user_id)
        )
        result = self.session.execute(stmt)
        return result.scalar_one_or_none()

    def get_by_value(self, value: str, user_id: int) -> Optional[UserIngredientUnit]:
        """
        Get a unit by slug value for a specific user.

        Args:
            value: Slug value of the unit
            user_id: ID of the user whose units to search

        Returns:
            UserIngredientUnit if found, None otherwise
        """
        stmt = (
            select(UserIngredientUnit)
            .where(UserIngredientUnit.user_id == user_id)
            .where(func.lower(UserIngredientUnit.value) == value.lower())
        )
        result = self.session.execute(stmt)
        return result.scalar_one_or_none()

    def get_all(self, user_id: int, include_disabled: bool = False) -> List[UserIngredientUnit]:
        """
        Get all units for a specific user, ordered by position.

        Args:
            user_id: ID of the user whose units to retrieve
            include_disabled: If True, include disabled units

        Returns:
            List of units belonging to the user
        """
        stmt = (
            select(UserIngredientUnit)
            .where(UserIngredientUnit.user_id == user_id)
        )
        if not include_disabled:
            stmt = stmt.where(UserIngredientUnit.is_enabled == True)
        stmt = stmt.order_by(UserIngredientUnit.position)

        result = self.session.execute(stmt)
        return list(result.scalars().all())

    # -- Update Operations -----------------------------------------------------------------------
    def update(
        self,
        unit_id: int,
        user_id: int,
        label: Optional[str] = None,
        is_enabled: Optional[bool] = None,
    ) -> Optional[UserIngredientUnit]:
        """
        Update an existing unit.

        Args:
            unit_id: ID of the unit to update
            user_id: ID of the user who owns the unit
            label: New label (optional)
            is_enabled: New enabled state (optional)

        Returns:
            Updated UserIngredientUnit if found, None otherwise
        """
        unit = self.get_by_id(unit_id, user_id)
        if not unit:
            return None

        if label is not None:
            unit.label = label
        if is_enabled is not None:
            unit.is_enabled = is_enabled

        self.session.flush()
        return unit

    def bulk_update_positions(
        self, user_id: int, position_map: Dict[int, int]
    ) -> None:
        """
        Update positions for multiple units.

        Args:
            user_id: ID of the user who owns the units
            position_map: Dict mapping unit_id -> new_position
        """
        for unit_id, new_position in position_map.items():
            stmt = (
                select(UserIngredientUnit)
                .where(UserIngredientUnit.id == unit_id)
                .where(UserIngredientUnit.user_id == user_id)
            )
            result = self.session.execute(stmt)
            unit = result.scalar_one_or_none()
            if unit:
                unit.position = new_position

        self.session.flush()

    def bulk_update(
        self,
        user_id: int,
        items: List[Dict],
    ) -> None:
        """
        Bulk update multiple units (enabled state and position).

        Args:
            user_id: ID of the user who owns the units
            items: List of dicts with 'id', 'is_enabled', 'position' keys
        """
        for item in items:
            stmt = (
                select(UserIngredientUnit)
                .where(UserIngredientUnit.id == item["id"])
                .where(UserIngredientUnit.user_id == user_id)
            )
            result = self.session.execute(stmt)
            unit = result.scalar_one_or_none()
            if unit:
                unit.is_enabled = item["is_enabled"]
                unit.position = item["position"]

        self.session.flush()

    # -- Delete Operations -----------------------------------------------------------------------
    def delete(self, unit_id: int, user_id: int) -> bool:
        """
        Delete a unit by ID if it belongs to the user.

        Args:
            unit_id: ID of the unit to delete
            user_id: ID of the user who owns the unit

        Returns:
            True if deleted, False if not found or not owned
        """
        unit = self.get_by_id(unit_id, user_id)
        if unit:
            self.session.delete(unit)
            self.session.flush()
            return True
        return False

    # -- Utility Methods -------------------------------------------------------------------------
    def count(self, user_id: int) -> int:
        """
        Count total number of units for a specific user.

        Args:
            user_id: ID of the user whose units to count

        Returns:
            Total count of units belonging to the user
        """
        stmt = (
            select(func.count())
            .select_from(UserIngredientUnit)
            .where(UserIngredientUnit.user_id == user_id)
        )
        return self.session.execute(stmt).scalar() or 0

    def count_custom(self, user_id: int) -> int:
        """
        Count total number of custom units for a specific user.

        Args:
            user_id: ID of the user whose custom units to count

        Returns:
            Total count of custom units belonging to the user
        """
        stmt = (
            select(func.count())
            .select_from(UserIngredientUnit)
            .where(UserIngredientUnit.user_id == user_id)
            .where(UserIngredientUnit.is_custom == True)
        )
        return self.session.execute(stmt).scalar() or 0

    def get_max_position(self, user_id: int) -> int:
        """
        Get the maximum position value for a user's units.

        Args:
            user_id: ID of the user

        Returns:
            Maximum position value, or -1 if no units exist
        """
        stmt = (
            select(func.max(UserIngredientUnit.position))
            .where(UserIngredientUnit.user_id == user_id)
        )
        result = self.session.execute(stmt).scalar()
        return result if result is not None else -1
