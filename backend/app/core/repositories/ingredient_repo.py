"""app/core/repositories/ingredient_repo.py

Provides database operations for Ingredient entities.
"""

# ── Imports ─────────────────────────────────────────────────────────────────────────────────────────────────
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models.ingredient import Ingredient


# ── Ingredient Repository ───────────────────────────────────────────────────────────────────────────────────
class IngredientRepo:
    """Handles ingredient-specific database operations."""

    def __init__(self, session: Session):
        """Initialize the Ingredient Repository with a database session."""
        self.session = session

    # ── CRUD Operations ─────────────────────────────────────────────────────────────────────────────────────
    def get_all(self) -> list[Ingredient]:
        """
        Return all ingredients.

        Returns:
            list[Ingredient]: A list of all ingredients in the database.
        """
        return self.session.execute(select(Ingredient)).scalars().unique().all()

    def get_by_id(self, ingredient_id: int) -> Ingredient | None:
        """
        Fetch a single ingredient by ID.

        Args:
            ingredient_id (int): The ID of the ingredient to retrieve.

        Returns:
            Ingredient | None: The ingredient with the given ID, or None if not found.
        """
        return self.session.get(Ingredient, ingredient_id)

    def delete(self, ingredient: Ingredient) -> None:
        """Delete the provided ingredient."""
        self.session.delete(ingredient)

    def add(self, ingredient: Ingredient) -> None:
        """Add a new ingredient to the session."""
        self.session.add(ingredient)

    # ── Search and Retrieval ────────────────────────────────────────────────────────────────────────────────
    def find_by_name_category(self, name: str, category: str) -> Ingredient | None:
        """
        Return a single matching ingredient by name+category (case-insensitive).

        Args:
            name (str): The name of the ingredient to search for.
            category (str): The category of the ingredient to search for.

        Returns:
            Ingredient | None: The matching ingredient, or None if not found.
        """
        stmt = (
            select(Ingredient)
            .where(Ingredient.ingredient_name.ilike(name.strip()))
            .where(Ingredient.ingredient_category.ilike(category.strip()))
        )
        return self.session.execute(stmt).scalars().unique().first()

    def search_by_name(self, term: str, category: str | None = None) -> list[Ingredient]:
        """
        Search for ingredients with name containing a term (optionally filtered by category).

        Args:
            term (str): The search term to look for in ingredient names.
            category (str | None): The category to filter by, if provided.

        Returns:
            list[Ingredient]: A list of ingredients matching the search criteria.
        """
        stmt = select(Ingredient).where(Ingredient.ingredient_name.ilike(f"%{term.strip()}%"))
        if category:
            stmt = stmt.where(Ingredient.ingredient_category.ilike(category.strip()))
        return self.session.execute(stmt).scalars().unique().all()

    def get_distinct_names(self) -> list[str]:
        """
        Return a list of all unique ingredient names.

        Returns:
            list[str]: A list of distinct ingredient names.
        """
        stmt = select(Ingredient.ingredient_name).distinct()
        results = self.session.execute(stmt).scalars().all()
        return results

    def get_or_create(self, dto) -> Ingredient:
        """
        Get existing ingredient or create new one based on name and category.

        Args:
            dto: Data Transfer Object containing ingredient_name and ingredient_category.

        Returns:
            Ingredient: The existing ingredient if found, or a new Ingredient instance.
        """
        existing = self.find_by_name_category(dto.ingredient_name, dto.ingredient_category)
        if existing:
            return existing

        new_ingredient = Ingredient(
            ingredient_name=dto.ingredient_name,
            ingredient_category=dto.ingredient_category
        )
        self.add(new_ingredient)
        # flush so SQLAlchemy assigns an ID and the new ingredient is queryable immediately
        self.session.flush()
        return new_ingredient
