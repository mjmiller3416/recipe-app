"""app/core/models/shopping_item_contribution.py

SQLAlchemy ORM model for tracking recipe/planner contributions to shopping items.
This junction table enables diff-based sync: we can track exactly which planner entries
and recipes contribute to each shopping item's quantity.
"""

# ── Imports ─────────────────────────────────────────────────────────────────────────────────────────────────
from __future__ import annotations

from sqlalchemy import Float, ForeignKey, Index, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..database.base import Base


# ── Shopping Item Contribution Model ───────────────────────────────────────────────────────────────────────
class ShoppingItemContribution(Base):
    """
    Junction table tracking which planner entries and recipes contribute to each shopping item.

    This enables:
    - Accurate quantity tracking: sum base_quantity from all contributions
    - Proper removal: when a planner entry is removed, delete its contributions
    - Recipe attribution: know exactly which recipes contribute to each item
    """
    __tablename__ = "shopping_item_contributions"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    # Foreign keys
    shopping_item_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("shopping_items.id", ondelete="CASCADE"),
        nullable=False
    )
    recipe_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("recipe.id", ondelete="CASCADE"),
        nullable=False
    )
    planner_entry_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("planner_entries.id", ondelete="CASCADE"),
        nullable=False
    )

    # Quantity in base units (grams for mass, ml for volume, count for count)
    base_quantity: Mapped[float] = mapped_column(Float, nullable=False)

    # Dimension for this contribution (mass, volume, count, unknown)
    dimension: Mapped[str] = mapped_column(String(20), nullable=False)

    # ── Relationships ──────────────────────────────────────────────────────────────────────────────────────
    shopping_item: Mapped["ShoppingItem"] = relationship(
        "ShoppingItem",
        back_populates="contributions"
    )

    # ── Constraints ────────────────────────────────────────────────────────────────────────────────────────
    __table_args__ = (
        # Each (item, recipe, planner_entry) combination should be unique
        UniqueConstraint(
            "shopping_item_id", "recipe_id", "planner_entry_id",
            name="uq_contribution_item_recipe_entry"
        ),
        # Indexes for efficient lookups
        Index("idx_contributions_item", "shopping_item_id"),
        Index("idx_contributions_entry", "planner_entry_id"),
        Index("idx_contributions_recipe", "recipe_id"),
    )

    # ── String Representation ──────────────────────────────────────────────────────────────────────────────
    def __repr__(self) -> str:
        return (
            f"<ShoppingItemContribution("
            f"item_id={self.shopping_item_id}, "
            f"recipe_id={self.recipe_id}, "
            f"entry_id={self.planner_entry_id}, "
            f"qty={self.base_quantity})>"
        )
