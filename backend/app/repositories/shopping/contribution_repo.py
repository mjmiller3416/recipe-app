"""app/repositories/shopping/contribution_repo.py

Repository for shopping item contribution management.
Handles tracking which planner entries contribute to shopping items.
"""

# ── Imports ─────────────────────────────────────────────────────────────────────────────────────────────────
from __future__ import annotations

from typing import List

from sqlalchemy import and_, delete, select
from sqlalchemy.orm import Session

from ...models.shopping_item import ShoppingItem
from ...models.shopping_item_contribution import ShoppingItemContribution


# ── Shopping Contribution Repository ────────────────────────────────────────────────────────────────────────
class ShoppingContributionRepo:
    """Repository for shopping item contribution management."""

    def __init__(self, session: Session, user_id: int):
        """Initialize the Shopping Contribution Repository.

        Args:
            session: SQLAlchemy database session
            user_id: The ID of the current user for multi-tenant isolation
        """
        self.session = session
        self.user_id = user_id

    # ── Contribution Management ─────────────────────────────────────────────────────────────────────────────
    def add_contribution(
        self,
        shopping_item_id: int,
        recipe_id: int,
        planner_entry_id: int,
        base_quantity: float,
        dimension: str
    ) -> ShoppingItemContribution:
        """
        Add a contribution to a shopping item.

        Args:
            shopping_item_id: ID of the shopping item
            recipe_id: ID of the recipe
            planner_entry_id: ID of the planner entry
            base_quantity: Quantity in base units
            dimension: Dimension (mass, volume, count, unknown)

        Returns:
            Created ShoppingItemContribution
        """
        contribution = ShoppingItemContribution(
            shopping_item_id=shopping_item_id,
            recipe_id=recipe_id,
            planner_entry_id=planner_entry_id,
            base_quantity=base_quantity,
            dimension=dimension
        )
        self.session.add(contribution)
        self.session.flush()
        return contribution

    def delete_contributions_for_entry(self, planner_entry_id: int) -> int:
        """
        Delete all contributions from a specific planner entry.

        Args:
            planner_entry_id: ID of the planner entry

        Returns:
            Number of contributions deleted
        """
        stmt = delete(ShoppingItemContribution).where(
            ShoppingItemContribution.planner_entry_id == planner_entry_id
        )
        result = self.session.execute(stmt)
        return result.rowcount

    def delete_contributions_for_item(self, shopping_item_id: int) -> int:
        """
        Delete all contributions for a shopping item.

        Args:
            shopping_item_id: ID of the shopping item

        Returns:
            Number of contributions deleted
        """
        stmt = delete(ShoppingItemContribution).where(
            ShoppingItemContribution.shopping_item_id == shopping_item_id
        )
        result = self.session.execute(stmt)
        return result.rowcount

    def get_contributions_by_entry(self, planner_entry_id: int) -> List[ShoppingItemContribution]:
        """
        Get all contributions from a specific planner entry.

        Args:
            planner_entry_id: ID of the planner entry

        Returns:
            List of contributions
        """
        stmt = select(ShoppingItemContribution).where(
            ShoppingItemContribution.planner_entry_id == planner_entry_id
        )
        result = self.session.execute(stmt)
        return result.scalars().all()

    def get_items_without_contributions(self) -> List[ShoppingItem]:
        """
        Get recipe items that have no contributions (orphans to be deleted).

        Returns:
            List of ShoppingItem with no contributions
        """
        # Subquery to get item IDs with contributions
        has_contributions = select(ShoppingItemContribution.shopping_item_id).distinct()

        stmt = select(ShoppingItem).where(
            and_(
                ShoppingItem.source == "recipe",
                ShoppingItem.user_id == self.user_id,
                ~ShoppingItem.id.in_(has_contributions)
            )
        )
        result = self.session.execute(stmt)
        return result.scalars().all()

    def delete_orphaned_recipe_items(self) -> int:
        """
        Delete recipe items that have no contributions.

        Returns:
            Number of items deleted
        """
        orphans = self.get_items_without_contributions()
        count = 0
        for item in orphans:
            self.session.delete(item)
            count += 1
        if count > 0:
            self.session.flush()
        return count
