"""app/core/repositories/meal_repo.py

Repository for managing meal CRUD operations.
"""

# ── Imports ─────────────────────────────────────────────────────────────────────────────────────────────────
from __future__ import annotations

from typing import List, Optional

from sqlalchemy import select, func, or_, and_
from sqlalchemy.orm import Session, joinedload

from ..models.meal import Meal
from ..models.recipe import Recipe


# ── Meal Repository ─────────────────────────────────────────────────────────────────────────────────────────
class MealRepo:
    """Repository for meal operations."""

    def __init__(self, session: Session):
        """Initialize the Meal Repository with a database session."""
        self.session = session

    # ── CRUD Operations ─────────────────────────────────────────────────────────────────────────────────────
    def create_meal(self, meal: Meal) -> Meal:
        """
        Create and persist a new Meal to the database.

        Args:
            meal: Unsaved Meal model instance (id should be None)

        Returns:
            Saved Meal instance with assigned ID
        """
        if meal.id is not None:
            raise ValueError("Cannot create a meal that already has an ID.")

        self.session.add(meal)
        self.session.flush()
        self.session.refresh(meal)
        return meal

    def update_meal(self, meal: Meal) -> Meal:
        """
        Update an existing Meal in the database.

        Args:
            meal: Meal model instance with valid ID

        Returns:
            Updated meal
        """
        if meal.id is None:
            raise ValueError("Cannot update a meal without an ID.")

        merged_meal = self.session.merge(meal)
        self.session.flush()
        return merged_meal

    def get_meal_by_id(self, meal_id: int, load_recipes: bool = True) -> Optional[Meal]:
        """
        Load a Meal from the database by ID.

        Args:
            meal_id: ID of the meal to load
            load_recipes: Whether to eagerly load the main recipe relationship

        Returns:
            Loaded Meal or None if not found
        """
        stmt = select(Meal).where(Meal.id == meal_id)
        
        if load_recipes:
            stmt = stmt.options(joinedload(Meal.main_recipe))
        
        result = self.session.execute(stmt)
        return result.scalar_one_or_none()

    def get_all_meals(self, load_recipes: bool = True) -> List[Meal]:
        """
        Get all meals.

        Args:
            load_recipes: Whether to eagerly load the main recipe relationship

        Returns:
            List of all meals
        """
        stmt = select(Meal)
        
        if load_recipes:
            stmt = stmt.options(joinedload(Meal.main_recipe))
        
        result = self.session.execute(stmt)
        return result.scalars().all()

    def delete_meal(self, meal_id: int) -> bool:
        """
        Delete a meal by ID.

        Args:
            meal_id: ID of the meal to delete

        Returns:
            True if deleted, False if not found
        """
        stmt = select(Meal).where(Meal.id == meal_id)
        result = self.session.execute(stmt)
        meal = result.scalar_one_or_none()

        if meal:
            self.session.delete(meal)
            self.session.flush()
            return True
        return False

    # ── Query and Filter Operations ─────────────────────────────────────────────────────────────────────────
    def filter_meals(
        self,
        name_pattern: Optional[str] = None,
        tags: Optional[List[str]] = None,
        is_favorite: Optional[bool] = None,
        main_recipe_id: Optional[int] = None,
        contains_recipe_id: Optional[int] = None,
        limit: Optional[int] = None,
        offset: Optional[int] = None,
        load_recipes: bool = True
    ) -> List[Meal]:
        """
        Filter meals based on various criteria.

        Args:
            name_pattern: Pattern to search for in meal names (case-insensitive)
            tags: List of tags (AND logic: meal must have all specified tags)
            is_favorite: Filter by favorite status
            main_recipe_id: Filter by main recipe ID
            contains_recipe_id: Filter meals containing this recipe (main or side)
            limit: Maximum number of results
            offset: Number of results to skip
            load_recipes: Whether to eagerly load recipe relationships

        Returns:
            List of matching meals
        """
        stmt = select(Meal)

        # Apply filters
        if name_pattern:
            stmt = stmt.where(Meal.meal_name.ilike(f"%{name_pattern}%"))

        if is_favorite is not None:
            stmt = stmt.where(Meal.is_favorite == is_favorite)

        if main_recipe_id is not None:
            stmt = stmt.where(Meal.main_recipe_id == main_recipe_id)

        if contains_recipe_id is not None:
            # Check if recipe is main or in side_recipe_ids JSON array
            # For SQLite, we need to check JSON containment
            stmt = stmt.where(
                or_(
                    Meal.main_recipe_id == contains_recipe_id,
                    func.json_each(Meal.side_recipe_ids).table_valued("value").c.value == str(contains_recipe_id)
                )
            )

        # Tag filtering (case-insensitive, AND logic)
        if tags:
            for tag in tags:
                # Check if tag exists in the tags array (case-insensitive)
                stmt = stmt.where(
                    func.exists(
                        select(1).select_from(
                            func.json_each(Meal.tags).table_valued("value")
                        ).where(
                            func.lower(func.json_each(Meal.tags).table_valued("value").c.value) == tag.lower()
                        )
                    )
                )

        # Pagination
        if offset is not None:
            stmt = stmt.offset(offset)
        if limit is not None:
            stmt = stmt.limit(limit)

        # Load relationships
        if load_recipes:
            stmt = stmt.options(joinedload(Meal.main_recipe))

        result = self.session.execute(stmt)
        return result.scalars().unique().all()

    def get_meals_by_name_pattern(self, name_pattern: str, load_recipes: bool = True) -> List[Meal]:
        """
        Get meals by name pattern (case-insensitive).

        Args:
            name_pattern: Pattern to search for in meal names
            load_recipes: Whether to eagerly load recipe relationships

        Returns:
            List of matching meals
        """
        return self.filter_meals(name_pattern=name_pattern, load_recipes=load_recipes)

    def get_meals_by_recipe_id(self, recipe_id: int, load_recipes: bool = True) -> List[Meal]:
        """
        Get all meals that contain a specific recipe (main or side).

        Args:
            recipe_id: ID of the recipe to search for
            load_recipes: Whether to eagerly load recipe relationships

        Returns:
            List of meals containing the recipe
        """
        return self.filter_meals(contains_recipe_id=recipe_id, load_recipes=load_recipes)

    def get_favorite_meals(self, load_recipes: bool = True) -> List[Meal]:
        """
        Get all favorite meals.

        Args:
            load_recipes: Whether to eagerly load recipe relationships

        Returns:
            List of favorite meals
        """
        return self.filter_meals(is_favorite=True, load_recipes=load_recipes)

    def get_meals_by_tags(self, tags: List[str], load_recipes: bool = True) -> List[Meal]:
        """
        Get meals that have all specified tags (AND logic, case-insensitive).

        Args:
            tags: List of tags to filter by
            load_recipes: Whether to eagerly load recipe relationships

        Returns:
            List of meals with all specified tags
        """
        return self.filter_meals(tags=tags, load_recipes=load_recipes)

    # ── Validation Methods ──────────────────────────────────────────────────────────────────────────────────
    def validate_meal_ids(self, meal_ids: List[int]) -> List[int]:
        """
        Validate the given meal IDs against the database.

        Args:
            meal_ids: List of meal IDs to validate

        Returns:
            List of valid meal IDs that exist in the database
        """
        if not meal_ids:
            return []

        stmt = select(Meal.id).where(Meal.id.in_(meal_ids))
        result = self.session.execute(stmt)
        return result.scalars().all()

    def validate_recipe_ids(self, recipe_ids: List[int]) -> List[int]:
        """
        Validate the given recipe IDs against the database.

        Args:
            recipe_ids: List of recipe IDs to validate

        Returns:
            List of valid recipe IDs that exist in the database
        """
        if not recipe_ids:
            return []

        stmt = select(Recipe.id).where(Recipe.id.in_(recipe_ids))
        result = self.session.execute(stmt)
        return result.scalars().all()

    # ── Utility Methods ─────────────────────────────────────────────────────────────────────────────────────
    def count_meals(self) -> int:
        """
        Count total number of meals in the database.

        Returns:
            Total count of meals
        """
        stmt = select(func.count()).select_from(Meal)
        return self.session.execute(stmt).scalar() or 0

    def get_recipes_for_meals(self, side_recipe_ids: List[int]) -> dict[int, Recipe]:
        """
        Get recipe objects for a list of recipe IDs.

        Args:
            side_recipe_ids: List of recipe IDs

        Returns:
            Dictionary mapping recipe ID to Recipe object
        """
        if not side_recipe_ids:
            return {}

        stmt = select(Recipe).where(Recipe.id.in_(side_recipe_ids))
        result = self.session.execute(stmt)
        recipes = result.scalars().all()
        return {recipe.id: recipe for recipe in recipes}
