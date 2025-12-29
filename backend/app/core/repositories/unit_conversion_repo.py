"""app/core/repositories/unit_conversion_repo.py

Provides database operations for UnitConversionRule entities.
"""

# ── Imports ─────────────────────────────────────────────────────────────────────────────────────────────────
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models.unit_conversion_rule import UnitConversionRule


# ── Unit Conversion Repository ─────────────────────────────────────────────────────────────────────────────
class UnitConversionRepo:
    """Handles unit conversion rule database operations."""

    def __init__(self, session: Session):
        """Initialize the repository with a database session."""
        self.session = session

    # ── CRUD Operations ─────────────────────────────────────────────────────────────────────────────────────
    def get_all(self) -> list[UnitConversionRule]:
        """Return all unit conversion rules."""
        return self.session.execute(select(UnitConversionRule)).scalars().all()

    def get_by_id(self, rule_id: int) -> UnitConversionRule | None:
        """Fetch a single rule by ID."""
        return self.session.get(UnitConversionRule, rule_id)

    def add(self, rule: UnitConversionRule) -> None:
        """Add a new rule to the session."""
        self.session.add(rule)

    def delete(self, rule: UnitConversionRule) -> None:
        """Delete the provided rule."""
        self.session.delete(rule)

    # ── Search and Retrieval ────────────────────────────────────────────────────────────────────────────────
    def find_by_ingredient(self, ingredient_name: str) -> list[UnitConversionRule]:
        """Find all rules for a specific ingredient (case-insensitive)."""
        stmt = select(UnitConversionRule).where(
            UnitConversionRule.ingredient_name.ilike(ingredient_name.strip())
        )
        return self.session.execute(stmt).scalars().all()

    def find_matching_rule(
        self, ingredient_name: str, from_unit: str
    ) -> UnitConversionRule | None:
        """Find a rule matching ingredient name and from_unit (case-insensitive)."""
        stmt = (
            select(UnitConversionRule)
            .where(UnitConversionRule.ingredient_name.ilike(ingredient_name.strip()))
            .where(UnitConversionRule.from_unit.ilike(from_unit.strip()))
        )
        return self.session.execute(stmt).scalars().first()
