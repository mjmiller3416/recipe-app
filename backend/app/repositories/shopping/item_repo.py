"""app/repositories/shopping/item_repo.py

Repository for individual shopping item CRUD operations.
Handles creating, reading, updating, and deleting shopping items.
"""

# ── Imports ─────────────────────────────────────────────────────────────────────────────────────────────────
from __future__ import annotations

from typing import Dict, List, Optional

from sqlalchemy import delete, select
from sqlalchemy.orm import Session, joinedload

from ...models.shopping_item import ShoppingItem


# ── Shopping Item Repository ────────────────────────────────────────────────────────────────────────────────
class ShoppingItemRepo:
    """Repository for individual shopping item CRUD operations."""

    def __init__(self, session: Session, user_id: int):
        """Initialize the Shopping Item Repository.

        Args:
            session: SQLAlchemy database session
            user_id: The ID of the current user for multi-tenant isolation
        """
        self.session = session
        self.user_id = user_id

    # ── Shopping Item CRUD Operations ───────────────────────────────────────────────────────────────────────
    def create_shopping_item(self, shopping_item: ShoppingItem, user_id: Optional[int] = None) -> ShoppingItem:
        """
        Create and persist a new shopping item for a user.

        Args:
            shopping_item (ShoppingItem): Shopping item to create.
            user_id (Optional[int]): ID of the user who owns this shopping item. If not provided, uses self.user_id.

        Returns:
            ShoppingItem: Created shopping item with assigned ID.
        """
        shopping_item.user_id = user_id if user_id is not None else self.user_id
        self.session.add(shopping_item)
        # flush to assign primary key and persist the new item
        self.session.flush()
        self.session.refresh(shopping_item)
        return shopping_item

    def add_manual_item(self, shopping_item: ShoppingItem, user_id: int) -> ShoppingItem:
        """
        Alias to create a manual shopping item for a user.
        """
        return self.create_shopping_item(shopping_item, user_id)

    def get_shopping_item_by_id(self, item_id: int, user_id: Optional[int] = None) -> Optional[ShoppingItem]:
        """
        Get a shopping item by ID.

        Args:
            item_id (int): ID of the shopping item.
            user_id (Optional[int]): If provided, only return the item if it belongs to this user.
                Returns None if the item exists but belongs to a different user (no existence leak).
                If not provided, uses self.user_id.

        Returns:
            Optional[ShoppingItem]: Shopping item or None if not found/not owned.
        """
        effective_user_id = user_id if user_id is not None else self.user_id
        stmt = select(ShoppingItem).where(
            ShoppingItem.id == item_id,
            ShoppingItem.user_id == effective_user_id
        )
        result = self.session.execute(stmt)
        return result.scalar_one_or_none()

    def get_shopping_item_by_aggregation_key(self, aggregation_key: str) -> Optional[ShoppingItem]:
        """
        Get a shopping item by its aggregation key.

        Args:
            aggregation_key: The aggregation key to look up.

        Returns:
            ShoppingItem or None if not found.
        """
        normalized_key = aggregation_key.lower().strip()
        stmt = select(ShoppingItem).where(
            ShoppingItem.aggregation_key == normalized_key,
            ShoppingItem.user_id == self.user_id
        )
        result = self.session.execute(stmt)
        return result.scalar_one_or_none()

    def get_recipe_items_with_contributions(self) -> List[ShoppingItem]:
        """
        Get all recipe-source shopping items with their contributions eagerly loaded.

        Returns:
            List of ShoppingItem with contributions loaded.
        """
        stmt = select(ShoppingItem).where(
            ShoppingItem.source == "recipe",
            ShoppingItem.user_id == self.user_id
        ).options(
            joinedload(ShoppingItem.contributions)
        )
        result = self.session.execute(stmt)
        return result.scalars().unique().all()

    def get_items_by_aggregation_keys(self, keys: List[str]) -> Dict[str, ShoppingItem]:
        """
        Get multiple shopping items by their aggregation keys.

        Args:
            keys: List of aggregation keys.

        Returns:
            Dict mapping normalized key to ShoppingItem.
        """
        if not keys:
            return {}

        normalized_keys = [k.lower().strip() for k in keys]
        stmt = select(ShoppingItem).where(
            ShoppingItem.aggregation_key.in_(normalized_keys),
            ShoppingItem.user_id == self.user_id
        ).options(
            joinedload(ShoppingItem.contributions)
        )
        result = self.session.execute(stmt)
        items = result.scalars().unique().all()
        return {item.aggregation_key: item for item in items if item.aggregation_key}

    def update_item_status(self, item_id: int, have: bool, user_id: Optional[int] = None) -> bool:
        """
        Update the 'have' status of a shopping item by ID if owned by user.
        """
        effective_user_id = user_id if user_id is not None else self.user_id
        item = self.get_shopping_item_by_id(item_id, effective_user_id)
        if not item:
            return False
        item.have = have
        return True

    def get_all_shopping_items(self, user_id: Optional[int] = None, source: Optional[str] = None) -> List[ShoppingItem]:
        """
        Get all shopping items for a user, optionally filtered by source.

        Args:
            user_id (Optional[int]): ID of the user whose shopping items to retrieve. Defaults to self.user_id.
            source (Optional[str]): Filter by source ("recipe" or "manual").

        Returns:
            List[ShoppingItem]: List of shopping items belonging to the user.
        """
        effective_user_id = user_id if user_id is not None else self.user_id
        stmt = select(ShoppingItem).where(ShoppingItem.user_id == effective_user_id)
        if source:
            stmt = stmt.where(ShoppingItem.source == source)

        result = self.session.execute(stmt)
        return result.scalars().all()

    def update_item(self, shopping_item: ShoppingItem) -> ShoppingItem:
        """
        Update an existing shopping item.

        Args:
            shopping_item (ShoppingItem): Shopping item to update.

        Returns:
            ShoppingItem: Updated shopping item.
        """
        merged_item = self.session.merge(shopping_item)
        return merged_item

    def delete_item(self, item_id: int, user_id: Optional[int] = None) -> bool:
        """
        Delete a shopping item by ID if owned by user.

        Args:
            item_id (int): ID of the shopping item to delete.
            user_id (Optional[int]): ID of the user who owns the item. Defaults to self.user_id.

        Returns:
            bool: True if deleted, False if not found/not owned.
        """
        effective_user_id = user_id if user_id is not None else self.user_id
        stmt = (
            select(ShoppingItem)
            .where(ShoppingItem.id == item_id)
            .where(ShoppingItem.user_id == effective_user_id)
        )
        result = self.session.execute(stmt)
        item = result.scalar_one_or_none()

        if item:
            self.session.delete(item)
            # flush to persist deletion immediately
            self.session.flush()
            return True
        return False

    def clear_shopping_items(self, user_id: Optional[int] = None, source: Optional[str] = None) -> int:
        """
        Clear shopping items for a user, optionally filtered by source.

        Args:
            user_id (Optional[int]): ID of the user whose items to clear. Defaults to self.user_id.
            source (Optional[str]): Clear only items from this source.

        Returns:
            int: Number of items deleted.
        """
        effective_user_id = user_id if user_id is not None else self.user_id
        stmt = delete(ShoppingItem).where(ShoppingItem.user_id == effective_user_id)
        if source:
            stmt = stmt.where(ShoppingItem.source == source)

        result = self.session.execute(stmt)
        return result.rowcount

    def clear_recipe_items(self, user_id: Optional[int] = None) -> int:
        """
        Clear all recipe-generated shopping items for a user.
        """
        effective_user_id = user_id if user_id is not None else self.user_id
        return self.clear_shopping_items(effective_user_id, source="recipe")
