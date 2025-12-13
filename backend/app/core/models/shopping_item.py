"""app/core/models/shopping_item.py

SQLAlchemy ORM model for shopping list items.
Handles both recipe-generated and manually added shopping items.
"""

# ── Imports ─────────────────────────────────────────────────────────────────────────────────────────────────
from __future__ import annotations

from typing import Optional

from sqlalchemy import Boolean, Enum, Float, String
from sqlalchemy.orm import Mapped, mapped_column

from ..database.base import Base


# ── Shopping Item Model ─────────────────────────────────────────────────────────────────────────────────────
class ShoppingItem(Base):
    __tablename__ = "shopping_items"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    ingredient_name: Mapped[str] = mapped_column(String(255), nullable=False)
    quantity: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    unit: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    category: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    # source and status
    source: Mapped[str] = mapped_column(
        Enum("recipe", "manual", name="shopping_source"),
        nullable=False,
        default="manual"
    )
    have: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    # for recipe-generated items, store a key for state persistence
    state_key: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # ── String Representation ───────────────────────────────────────────────────────────────────────────────
    def __repr__(self) -> str:
        return f"<ShoppingItem(id={self.id}, name='{self.ingredient_name}', qty={self.quantity}, have={self.have})>"

    # ── Helper Methods ──────────────────────────────────────────────────────────────────────────────────────
    def key(self) -> str:
        """Generate a unique key for this shopping item."""
        if self.state_key:
            return self.state_key
        unit_str = self.unit or ""
        return f"{self.ingredient_name.lower().strip()}::{unit_str.lower().strip()}"

    def display_label(self) -> str:
        """Return a human-friendly label for UI display."""
        icon = "✓" if self.have else "○"
        unit_display = f" {self.unit}" if self.unit else ""
        return f"{icon} {self.ingredient_name}: {self.quantity}{unit_display}"

    def formatted_quantity(self) -> str:
        """Return formatted quantity string."""
        if self.quantity == int(self.quantity):
            return str(int(self.quantity))
        return f"{self.quantity:.2f}".rstrip('0').rstrip('.')

    @classmethod
    def create_from_recipe(
        cls,
        ingredient_name: str,
        quantity: float,
        unit: Optional[str] = None,
        category: Optional[str] = None
        ) -> "ShoppingItem":
        """
        Create a shopping item from recipe data.

        Args:
            ingredient_name (str): The name of the ingredient.
            quantity (float): The quantity of the ingredient.
            unit (Optional[str]): The unit of measurement, if any.
            category (Optional[str]): The category of the ingredient.

        Returns:
            ShoppingItem: A new shopping item instance.
        """
        return cls(
            ingredient_name=ingredient_name,
            quantity=quantity,
            unit=unit,
            category=category,
            source="recipe",
            have=False
        )

    @classmethod
    def create_manual(
        cls,
        ingredient_name: str,
        quantity: float,
        unit: Optional[str] = None
        ) -> "ShoppingItem":
        """
        Create a manual shopping item.

        Args:
            ingredient_name (str): The name of the ingredient.
            quantity (float): The quantity of the ingredient.
            unit (Optional[str]): The unit of measurement, if any.

        Returns:
            ShoppingItem: A new manual shopping item instance.
        """
        return cls(
            ingredient_name=ingredient_name,
            quantity=quantity,
            unit=unit,
            source="manual",
            have=False
        )
