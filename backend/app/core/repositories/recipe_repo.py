"""app/core/repositories/recipes/repo.py

Repository layer for Recipe model. Handles all direct database interactions
related to recipes, including related ingredients and history.
"""

# ── Imports ─────────────────────────────────────────────────────────────────────────────────────────────────
from datetime import datetime
from typing import List, Optional

from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from ..dtos.recipe_dtos import (
    RecipeCreateDTO,
    RecipeFilterDTO,
    RecipeIngredientDTO,
    RecipeUpdateDTO)
from ..models.recipe import Recipe
from ..models.recipe_history import RecipeHistory
from ..models.meal_selection import MealSelection
from ..models.recipe_ingredient import RecipeIngredient
from ..repositories.ingredient_repo import IngredientRepo


# ── Recipe Repository ───────────────────────────────────────────────────────────────────────────────────────
class RecipeRepo:
    """Handles direct DB queries for the Recipe model."""

    def __init__(self, session: Session, ingredient_repo: Optional[IngredientRepo] = None):
        """Initialize Recipe Repository with a database session and ingredient repository.
        If no ingredient_repo is provided, a default IngredientRepo is created."""
        self.session = session
        # allow defaulting to a new IngredientRepo for backward compatibility
        self.ingredient_repo = ingredient_repo or IngredientRepo(session)

    def persist_recipe_and_links(self, recipe_dto: RecipeCreateDTO) -> Recipe:
        recipe = Recipe(
            recipe_name=recipe_dto.recipe_name,
            recipe_category=recipe_dto.recipe_category,
            meal_type=recipe_dto.meal_type,
            total_time=recipe_dto.total_time,
            servings=recipe_dto.servings,
            directions=recipe_dto.directions,
            notes=recipe_dto.notes,
            reference_image_path=recipe_dto.reference_image_path,
            banner_image_path=recipe_dto.banner_image_path
        )
        self.session.add(recipe)
        # flush so recipe gets its primary key before linking ingredients
        self.session.flush()

        for ing in recipe_dto.ingredients:
            ingredient = self.ingredient_repo.get_or_create(ing)
            # flush to ensure ingredient has an ID before creating the link row
            self.session.flush()
            link = RecipeIngredient(
                recipe_id=recipe.id,
                ingredient_id=ingredient.id,
                quantity=ing.quantity,
                unit=ing.unit
            )
            self.session.add(link)

        return recipe

    def get_all_recipes(self) -> List[Recipe]:
        """
        Returns all recipes with their ingredients (eager loaded).

        Returns:
            List[Recipe]: A list of all recipes with their ingredients loaded.
        """
        stmt = select(Recipe).options(joinedload(Recipe.ingredients))
        return self.session.scalars(stmt).unique().all()

    def get_by_id(self, recipe_id: int) -> Optional[Recipe]:
        """
        Returns a single recipe by ID, with ingredients and history.

        Args:
            recipe_id (int): The ID of the recipe to retrieve.

        Returns:
            Optional[Recipe]: The recipe with the given ID, or None if not found.
        """
        stmt = (
            select(Recipe)
            .options(
                joinedload(Recipe.ingredients),
                joinedload(Recipe.history),
            )
            .where(Recipe.id == recipe_id)
        )
        return self.session.scalars(stmt).unique().first()

    def get_last_cooked_date(self, recipe_id: int) -> Optional[datetime]:
        """
        Returns the most recent cooked_at datetime for a recipe.

        Args:
            recipe_id (int): The ID of the recipe to check.

        Returns:
            Optional[datetime]: The last cooked date, or None if no history exists.
        """
        stmt = (
            select(RecipeHistory.cooked_at)
            .where(RecipeHistory.recipe_id == recipe_id)
            .order_by(RecipeHistory.cooked_at.desc())
            .limit(1)
        )
        result = self.session.execute(stmt).scalar_one_or_none()
        return result

    def update_recipe(self, recipe_id: int, update_dto: RecipeUpdateDTO) -> Optional[Recipe]:
        """
        Update a recipe's core fields and replace ingredient links.
        """
        recipe = self.get_by_id(recipe_id)
        if not recipe:
            return None

        update_data = update_dto.model_dump(exclude_unset=True)

        for field in [
            "recipe_name",
            "recipe_category",
            "meal_type",
            "diet_pref",
            "total_time",
            "servings",
            "directions",
            "notes",
            "reference_image_path",
            "banner_image_path",
            "is_favorite",
        ]:
            if field in update_data:
                setattr(recipe, field, update_data[field])

        if "ingredients" in update_data and update_data["ingredients"] is not None:
            recipe.ingredients.clear()
            # flush to persist removal of old links before adding replacements
            self.session.flush()
            for ing in update_data["ingredients"]:
                ing_dto = (
                    RecipeIngredientDTO(**ing)
                    if isinstance(ing, dict)
                    else ing
                )
                ingredient = self.ingredient_repo.get_or_create(ing_dto)
                # flush so ingredient has an ID before we append the new link
                self.session.flush()
                recipe.ingredients.append(
                    RecipeIngredient(
                        recipe_id=recipe.id,
                        ingredient_id=ingredient.id,
                        quantity=ing_dto.quantity,
                        unit=ing_dto.unit,
                    )
                )

        return recipe

    def create_recipe(self, recipe: Recipe) -> Recipe:
        """
        Adds and returns a new recipe.

        Args:
            recipe (Recipe): The recipe instance to add.

        Returns:
            Recipe: The newly created recipe with ID and other defaults set.
        """
        self.session.add(recipe)
        self.session.refresh(recipe)
        return recipe

    def delete_recipe(self, recipe: Recipe) -> None:
        """
        Delete the given recipe.

        Args:
            recipe (Recipe): The recipe instance to delete.

        Note:
            Related data is handled by database foreign key rules:
            - Recipe ingredients and history: CASCADE (deleted)
            - Meal selections (main recipe): CASCADE (deleted)
            - Meal selections (side recipe): SET NULL
        """
        self.session.delete(recipe)

    def recipe_exists(self, name: str, category: str) -> bool:
        """
        Check if a recipe exists with the same name and category (case-insensitive).
        Args:
            name (str): The name of the recipe.
            category (str): The category of the recipe.

        Returns:
            bool: True if a recipe with the same name and category exists, False otherwise.
        """
        return (
            self.session.query(Recipe)
            .filter(
                func.lower(Recipe.recipe_name) == name.strip().lower(),
                func.lower(Recipe.recipe_category) == category.strip().lower()
            )
            .first()
            is not None
        )

    def filter_recipes(self, filter_dto: RecipeFilterDTO) -> list[Recipe]:
        """
        Filter and sort recipes based on various criteria.

        Args:
            filter_dto (RecipeFilterDTO): DTO containing filter, sort, and pagination criteria.

        Returns:
            List[Recipe]: A list of recipes that match the specified criteria.
        """
        # Start with a base query to select recipes and eager-load ingredients
        stmt = select(Recipe).options(joinedload(Recipe.ingredients))

        # Apply filters based on the DTO
        if filter_dto.recipe_category and filter_dto.recipe_category not in ["All", "Filter"]:
            stmt = stmt.where(Recipe.recipe_category == filter_dto.recipe_category)

        if filter_dto.favorites_only:
            stmt = stmt.where(Recipe.is_favorite == True)

        if filter_dto.search_term:
            # Use ilike for case-insensitive search
            search_pattern = f"%{filter_dto.search_term}%"
            stmt = stmt.where(Recipe.recipe_name.ilike(search_pattern))

        # Apply sorting
        if filter_dto.sort_by:
            sort_column = getattr(Recipe, filter_dto.sort_by, None)
            if sort_column:
                if filter_dto.sort_order == 'desc':
                    stmt = stmt.order_by(sort_column.desc())
                else:
                    stmt = stmt.order_by(sort_column.asc())

        # Apply pagination
        if filter_dto.offset:
            stmt = stmt.offset(filter_dto.offset)

        if filter_dto.limit:
            stmt = stmt.limit(filter_dto.limit)

        # Execute the query and return the results
        result = self.session.scalars(stmt).unique().all()
        return result

    def toggle_favorite(self, recipe_id: int) -> Recipe:
        """
        Toggle the favorite status of a recipe.

        Args:
            recipe_id (int): ID of the recipe to toggle.

        Returns:
            Recipe: The updated recipe with new favorite status.
        """
        recipe = self.get_by_id(recipe_id)
        if recipe is None:
            return None
        recipe.is_favorite = not recipe.is_favorite
        return recipe
