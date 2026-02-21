"""app/repositories/user_ingredient_category_repo.py

Repository for managing user ingredient category CRUD operations.
"""

# -- Imports -------------------------------------------------------------------------------------
from __future__ import annotations

from typing import Dict, List, Optional

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..models.user_ingredient_category import UserIngredientCategory


# -- UserIngredientCategory Repository ----------------------------------------------------------
class UserIngredientCategoryRepo:
    """Repository for user ingredient category operations."""

    def __init__(self, session: Session):
        """Initialize the UserIngredientCategory Repository with a database session."""
        self.session = session

    # -- Create Operations -----------------------------------------------------------------------
    def create(
        self,
        user_id: int,
        value: str,
        label: str,
        is_custom: bool,
        position: int,
    ) -> UserIngredientCategory:
        """
        Create and persist a new UserIngredientCategory to the database.

        Args:
            user_id: ID of the user who owns this category
            value: Slug value (e.g., "produce", "dairy")
            label: Display name (e.g., "Produce", "Dairy")
            is_custom: True if user-created, False if built-in
            position: Sort order position (0-based)

        Returns:
            Saved UserIngredientCategory with assigned ID
        """
        category = UserIngredientCategory(
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
    ) -> List[UserIngredientCategory]:
        """
        Seed default built-in ingredient categories for a new user.

        Args:
            user_id: ID of the user to seed categories for
            defaults: List of dicts with 'value' and 'label' keys

        Returns:
            List of created UserIngredientCategory instances
        """
        categories = []
        for position, item in enumerate(defaults):
            category = UserIngredientCategory(
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
    def get_by_id(self, category_id: int, user_id: int) -> Optional[UserIngredientCategory]:
        """
        Get an ingredient category by ID.

        Args:
            category_id: ID of the category to load
            user_id: ID of the user who owns the category

        Returns:
            UserIngredientCategory if found and owned by user, None otherwise
        """
        stmt = (
            select(UserIngredientCategory)
            .where(UserIngredientCategory.id == category_id)
            .where(UserIngredientCategory.user_id == user_id)
        )
        result = self.session.execute(stmt)
        return result.scalar_one_or_none()

    def get_by_value(self, value: str, user_id: int) -> Optional[UserIngredientCategory]:
        """
        Get an ingredient category by slug value for a specific user.

        Args:
            value: Slug value of the category
            user_id: ID of the user whose categories to search

        Returns:
            UserIngredientCategory if found, None otherwise
        """
        stmt = (
            select(UserIngredientCategory)
            .where(UserIngredientCategory.user_id == user_id)
            .where(func.lower(UserIngredientCategory.value) == value.lower())
        )
        result = self.session.execute(stmt)
        return result.scalar_one_or_none()

    def get_all(self, user_id: int, include_disabled: bool = False) -> List[UserIngredientCategory]:
        """
        Get all ingredient categories for a specific user, ordered by position.

        Args:
            user_id: ID of the user whose categories to retrieve
            include_disabled: If True, include disabled categories

        Returns:
            List of ingredient categories belonging to the user
        """
        stmt = (
            select(UserIngredientCategory)
            .where(UserIngredientCategory.user_id == user_id)
        )
        if not include_disabled:
            stmt = stmt.where(UserIngredientCategory.is_enabled == True)
        stmt = stmt.order_by(UserIngredientCategory.position)

        result = self.session.execute(stmt)
        return list(result.scalars().all())

    # -- Update Operations -----------------------------------------------------------------------
    def update(
        self,
        category_id: int,
        user_id: int,
        label: Optional[str] = None,
        is_enabled: Optional[bool] = None,
    ) -> Optional[UserIngredientCategory]:
        """
        Update an existing ingredient category.

        Args:
            category_id: ID of the category to update
            user_id: ID of the user who owns the category
            label: New label (optional)
            is_enabled: New enabled state (optional)

        Returns:
            Updated UserIngredientCategory if found, None otherwise
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
        Update positions for multiple ingredient categories.

        Args:
            user_id: ID of the user who owns the categories
            position_map: Dict mapping category_id -> new_position
        """
        for category_id, new_position in position_map.items():
            stmt = (
                select(UserIngredientCategory)
                .where(UserIngredientCategory.id == category_id)
                .where(UserIngredientCategory.user_id == user_id)
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
        Bulk update multiple ingredient categories (enabled state and position).

        Args:
            user_id: ID of the user who owns the categories
            items: List of dicts with 'id', 'is_enabled', 'position' keys
        """
        for item in items:
            stmt = (
                select(UserIngredientCategory)
                .where(UserIngredientCategory.id == item["id"])
                .where(UserIngredientCategory.user_id == user_id)
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
        Delete an ingredient category by ID if it belongs to the user.

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
        Count total number of ingredient categories for a specific user.

        Args:
            user_id: ID of the user whose categories to count

        Returns:
            Total count of ingredient categories belonging to the user
        """
        stmt = (
            select(func.count())
            .select_from(UserIngredientCategory)
            .where(UserIngredientCategory.user_id == user_id)
        )
        return self.session.execute(stmt).scalar() or 0

    def count_custom(self, user_id: int) -> int:
        """
        Count total number of custom ingredient categories for a specific user.

        Args:
            user_id: ID of the user whose custom categories to count

        Returns:
            Total count of custom ingredient categories belonging to the user
        """
        stmt = (
            select(func.count())
            .select_from(UserIngredientCategory)
            .where(UserIngredientCategory.user_id == user_id)
            .where(UserIngredientCategory.is_custom == True)
        )
        return self.session.execute(stmt).scalar() or 0

    def get_max_position(self, user_id: int) -> int:
        """
        Get the maximum position value for a user's ingredient categories.

        Args:
            user_id: ID of the user

        Returns:
            Maximum position value, or -1 if no categories exist
        """
        stmt = (
            select(func.max(UserIngredientCategory.position))
            .where(UserIngredientCategory.user_id == user_id)
        )
        result = self.session.execute(stmt).scalar()
        return result if result is not None else -1
