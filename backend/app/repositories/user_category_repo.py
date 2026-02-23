"""app/repositories/user_category_repo.py

Repository for managing user category CRUD operations.
"""

# -- Imports -------------------------------------------------------------------------------------
from __future__ import annotations

from typing import Dict, List, Optional

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..models.user_category import UserCategory


# -- UserCategory Repository ---------------------------------------------------------------------
class UserCategoryRepo:
    """Repository for user category operations."""

    def __init__(self, session: Session):
        """Initialize the UserCategory Repository with a database session."""
        self.session = session

    # -- Create Operations -----------------------------------------------------------------------
    def create(
        self,
        user_id: int,
        value: str,
        label: str,
        is_custom: bool,
        position: int,
    ) -> UserCategory:
        """
        Create and persist a new UserCategory to the database.

        Args:
            user_id: ID of the user who owns this category
            value: Slug value (e.g., "beef", "instant-pot")
            label: Display name (e.g., "Beef", "Instant Pot")
            is_custom: True if user-created, False if built-in
            position: Sort order position (0-based)

        Returns:
            Saved UserCategory with assigned ID
        """
        category = UserCategory(
            user_id=user_id,
            value=value,
            label=label,
            is_custom=is_custom,
            is_enabled=True,
            position=position,
        )
        self.session.add(category)
        self.session.flush()
        self.session.refresh(category)
        return category

    def seed_defaults(
        self, user_id: int, defaults: List[Dict[str, str]]
    ) -> List[UserCategory]:
        """
        Seed default built-in categories for a new user.

        Args:
            user_id: ID of the user to seed categories for
            defaults: List of dicts with 'value' and 'label' keys

        Returns:
            List of created UserCategory instances
        """
        categories = []
        for position, item in enumerate(defaults):
            category = UserCategory(
                user_id=user_id,
                value=item["value"],
                label=item["label"],
                is_custom=False,
                is_enabled=True,
                position=position,
            )
            self.session.add(category)
            categories.append(category)

        self.session.flush()
        for cat in categories:
            self.session.refresh(cat)
        return categories

    # -- Read Operations -------------------------------------------------------------------------
    def get_by_id(self, category_id: int, user_id: int) -> Optional[UserCategory]:
        """
        Get a category by ID.

        Args:
            category_id: ID of the category to load
            user_id: ID of the user who owns the category

        Returns:
            UserCategory if found and owned by user, None otherwise
        """
        stmt = (
            select(UserCategory)
            .where(UserCategory.id == category_id)
            .where(UserCategory.user_id == user_id)
        )
        result = self.session.execute(stmt)
        return result.scalar_one_or_none()

    def get_by_value(self, value: str, user_id: int) -> Optional[UserCategory]:
        """
        Get a category by slug value for a specific user.

        Args:
            value: Slug value of the category
            user_id: ID of the user whose categories to search

        Returns:
            UserCategory if found, None otherwise
        """
        stmt = (
            select(UserCategory)
            .where(UserCategory.user_id == user_id)
            .where(func.lower(UserCategory.value) == value.lower())
        )
        result = self.session.execute(stmt)
        return result.scalar_one_or_none()

    def get_all(self, user_id: int, include_disabled: bool = False) -> List[UserCategory]:
        """
        Get all categories for a specific user, ordered by position.

        Args:
            user_id: ID of the user whose categories to retrieve
            include_disabled: If True, include disabled categories

        Returns:
            List of categories belonging to the user
        """
        stmt = (
            select(UserCategory)
            .where(UserCategory.user_id == user_id)
        )
        if not include_disabled:
            stmt = stmt.where(UserCategory.is_enabled == True)
        stmt = stmt.order_by(UserCategory.position)

        result = self.session.execute(stmt)
        return list(result.scalars().all())

    # -- Update Operations -----------------------------------------------------------------------
    def update(
        self,
        category_id: int,
        user_id: int,
        label: Optional[str] = None,
        is_enabled: Optional[bool] = None,
    ) -> Optional[UserCategory]:
        """
        Update an existing category.

        Args:
            category_id: ID of the category to update
            user_id: ID of the user who owns the category
            label: New label (optional)
            is_enabled: New enabled state (optional)

        Returns:
            Updated UserCategory if found, None otherwise
        """
        category = self.get_by_id(category_id, user_id)
        if not category:
            return None

        if label is not None:
            category.label = label
        if is_enabled is not None:
            category.is_enabled = is_enabled

        self.session.flush()
        return category

    def bulk_update_positions(
        self, user_id: int, position_map: Dict[int, int]
    ) -> None:
        """
        Update positions for multiple categories.

        Args:
            user_id: ID of the user who owns the categories
            position_map: Dict mapping category_id -> new_position
        """
        for category_id, new_position in position_map.items():
            stmt = (
                select(UserCategory)
                .where(UserCategory.id == category_id)
                .where(UserCategory.user_id == user_id)
            )
            result = self.session.execute(stmt)
            category = result.scalar_one_or_none()
            if category:
                category.position = new_position

        self.session.flush()

    def bulk_update(
        self,
        user_id: int,
        items: List[Dict],
    ) -> None:
        """
        Bulk update multiple categories (enabled state and position).

        Args:
            user_id: ID of the user who owns the categories
            items: List of dicts with 'id', 'is_enabled', 'position' keys
        """
        for item in items:
            stmt = (
                select(UserCategory)
                .where(UserCategory.id == item["id"])
                .where(UserCategory.user_id == user_id)
            )
            result = self.session.execute(stmt)
            category = result.scalar_one_or_none()
            if category:
                category.is_enabled = item["is_enabled"]
                category.position = item["position"]

        self.session.flush()

    # -- Delete Operations -----------------------------------------------------------------------
    def delete(self, category_id: int, user_id: int) -> bool:
        """
        Delete a category by ID if it belongs to the user.

        Args:
            category_id: ID of the category to delete
            user_id: ID of the user who owns the category

        Returns:
            True if deleted, False if not found or not owned
        """
        category = self.get_by_id(category_id, user_id)
        if category:
            self.session.delete(category)
            self.session.flush()
            return True
        return False

    # -- Utility Methods -------------------------------------------------------------------------
    def count(self, user_id: int) -> int:
        """
        Count total number of categories for a specific user.

        Args:
            user_id: ID of the user whose categories to count

        Returns:
            Total count of categories belonging to the user
        """
        stmt = (
            select(func.count())
            .select_from(UserCategory)
            .where(UserCategory.user_id == user_id)
        )
        return self.session.execute(stmt).scalar() or 0

    def count_custom(self, user_id: int) -> int:
        """
        Count total number of custom categories for a specific user.

        Args:
            user_id: ID of the user whose custom categories to count

        Returns:
            Total count of custom categories belonging to the user
        """
        stmt = (
            select(func.count())
            .select_from(UserCategory)
            .where(UserCategory.user_id == user_id)
            .where(UserCategory.is_custom == True)
        )
        return self.session.execute(stmt).scalar() or 0

    def get_max_position(self, user_id: int) -> int:
        """
        Get the maximum position value for a user's categories.

        Args:
            user_id: ID of the user

        Returns:
            Maximum position value, or -1 if no categories exist
        """
        stmt = (
            select(func.max(UserCategory.position))
            .where(UserCategory.user_id == user_id)
        )
        result = self.session.execute(stmt).scalar()
        return result if result is not None else -1
