"""app/core/models/unit_conversion_rule.py

SQLAlchemy model for ingredient-specific unit conversion rules.
"""

# ── Imports ─────────────────────────────────────────────────────────────────────────────────────────────────
from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, String, func
from sqlalchemy.orm import Mapped, mapped_column

from ..database.base import Base


# ── UnitConversionRule Model ───────────────────────────────────────────────────────────────────────────────
class UnitConversionRule(Base):
    """SQLAlchemy model for ingredient-specific unit conversion rules.

    Example: Convert butter from tablespoons to sticks (8 tbs = 1 stick).
    """

    __tablename__ = "unit_conversion_rules"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    ingredient_name: Mapped[str] = mapped_column(String, nullable=False, index=True)
    from_unit: Mapped[str] = mapped_column(String, nullable=False)
    to_unit: Mapped[str] = mapped_column(String, nullable=False)
    factor: Mapped[float] = mapped_column(Float, nullable=False)
    round_up: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now()
    )
