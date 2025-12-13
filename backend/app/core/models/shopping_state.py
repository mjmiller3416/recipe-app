"""app/core/models/shopping_state.py

SQLAlchemy ORM model for shopping item state persistence.
Tracks the 'checked' state of shopping list items from recipe sources.
"""

# ── Imports ─────────────────────────────────────────────────────────────────────────────────────────────────
from __future__ import annotations

from typing import Optional

from sqlalchemy import Boolean, Float, String
from sqlalchemy.orm import Mapped, mapped_column

from ..database.base import Base


# ── Shopping State Model ────────────────────────────────────────────────────────────────────────────────────
class ShoppingState(Base):
    __tablename__ = "shopping_states"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    key: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    quantity: Mapped[float] = mapped_column(Float, nullable=False)
    unit: Mapped[str] = mapped_column(String(50), nullable=False)
    checked: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    # ── String Representation ───────────────────────────────────────────────────────────────────────────────
    def __repr__(self) -> str:
        return f"<ShoppingState(key='{self.key}', checked={self.checked})>"

    # ── Helper Methods ──────────────────────────────────────────────────────────────────────────────────────
    @classmethod
    def normalize_key(cls, key: str) -> str:
        """Normalize a key for consistent storage."""
        return key.strip().lower()

    @classmethod
    def create_key(cls, ingredient_name: str, unit: Optional[str] = None) -> str:
        """
        Create a normalized key from ingredient name and unit.

        Args:
            ingredient_name (str): The name of the ingredient.
            unit (Optional[str]): The unit of measurement, if any.
        """
        unit_str = unit.strip().lower().rstrip(".") if unit else ""
        return f"{ingredient_name.strip().lower()}::{unit_str}"
