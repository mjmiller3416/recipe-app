"""app/core/services/recipe_service.py

RecipeService using SQLAlchemy repository pattern.
"""

# ── Imports ─────────────────────────────────────────────────────────────────────────────────────────────────

from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from _dev_tools import DebugLogger

from ..dtos.ingredient_dtos import IngredientCreateDTO
from ..dtos.recipe_dtos import (
    RecipeCreateDTO,
    RecipeFilterDTO,
    RecipeIngredientDTO,
    RecipeUpdateDTO)
from ..models.ingredient import Ingredient
from ..models.recipe import Recipe
from ..repositories.ingredient_repo import IngredientRepo
from ..repositories.recipe_repo import RecipeRepo


# ── Exceptions ──────────────────────────────────────────────────────────────────────────────────────────────
class RecipeSaveError(Exception):
    pass

class DuplicateRecipeError(Exception):
    pass


# ── Recipe Service ──────────────────────────────────────────────────────────────────────────────────────────
class RecipeService:
    """Service layer for managing recipes and their ingredients."""

    def __init__(self, session: Session | None = None):
        """
        Initialize the RecipeService with a database session and repositories.
        If no session is provided, a new session is created.
        """
        if session is None:
            from app.core.database.db import create_session
            session = create_session()
        self.session = session
        # ensure ingredient repository is created before passing into recipe repository
        self.ingredient_repo = IngredientRepo(self.session)
        self.recipe_repo = RecipeRepo(self.session, self.ingredient_repo)

    def create_recipe_with_ingredients(self, recipe_dto: RecipeCreateDTO) -> Recipe:
        if self.recipe_repo.recipe_exists(
            name=recipe_dto.recipe_name,
            category=recipe_dto.recipe_category
        ):
            raise DuplicateRecipeError(
                f"Recipe '{recipe_dto.recipe_name}' "
                f"in category '{recipe_dto.recipe_category}' already exists."
            )

        try:
            recipe = self.recipe_repo.persist_recipe_and_links(recipe_dto)
            self.session.commit()
            return recipe
        except SQLAlchemyError as err:
            self.session.rollback()
            raise RecipeSaveError(
                f"Unable to save recipe '{recipe_dto.recipe_name}': {err}"
            ) from err

    def resolve_ingredient(
        self, ing_dto: RecipeIngredientDTO
        ) -> Ingredient:
        """
        Resolve or create an Ingredient from an ingredient DTO.

        Args:
            ing_dto (RecipeIngredientDTO)

        Returns:
            Ingredient
        """
        if ing_dto.existing_ingredient_id:
            return self.ingredient_repo.get_by_id(ing_dto.existing_ingredient_id)

        dto = IngredientCreateDTO(
            ingredient_name=ing_dto.ingredient_name,
            ingredient_category=ing_dto.ingredient_category,
            quantity=ing_dto.quantity,
            unit=ing_dto.unit,
        )
        return self.ingredient_repo.get_or_create(dto)

    def list_filtered(self, filter_dto: RecipeFilterDTO) -> list[Recipe]:
        """
        List recipes based on filter criteria.

        Args:
            filter_dto (RecipeFilterDTO): Filter criteria for recipes.

        Returns:
            list[Recipe]: List of recipes matching the filter.
        """
        return self.recipe_repo.filter_recipes(filter_dto)

    def toggle_favorite(self, recipe_id: int) -> Recipe:
        """
        Toggle the favorite status of a recipe using the current session.

        Args:
            recipe_id (int): ID of the recipe to toggle.

        Returns:
            Recipe: The updated recipe with new favorite status.
        """
        # Use the repository bound to this service's session
        updated_recipe = self.recipe_repo.toggle_favorite(recipe_id)
        # persist the change
        try:
            self.session.commit()
        except Exception as e:
            self.session.rollback()
            DebugLogger.log("Failed to toggle recipe {recipe_id} favorite status, rolling back: {e}", "error")
            raise
        return updated_recipe

    def update_recipe_reference_image_path(self, recipe_id: int, image_path: str) -> Recipe | None:
        """
        Update a recipe's default image path.

        Args:
            recipe_id (int): ID of the recipe to update.
            image_path (str): New default image path to set.

        Returns:
            Recipe | None: The updated recipe or None if not found.
        """
        try:
            recipe = self.recipe_repo.get_by_id(recipe_id)
            if not recipe:
                return None

            recipe.reference_image_path = image_path
            self.session.commit()
            DebugLogger.log(f"Updated recipe {recipe_id} default image path to: {image_path}", "info")
            return recipe
        except Exception as e:
            self.session.rollback()
            DebugLogger.log(f"Failed to update recipe {recipe_id} default image path: {e}", "error")
            raise

    def update_recipe_banner_image_path(self, recipe_id: int, image_path: str) -> Recipe | None:
        """
        Update a recipe's banner image path.

        Args:
            recipe_id (int): ID of the recipe to update.
            image_path (str): New banner image path to set.

        Returns:
            Recipe | None: The updated recipe or None if not found.
        """
        try:
            recipe = self.recipe_repo.get_by_id(recipe_id)
            if not recipe:
                return None

            recipe.banner_image_path = image_path
            self.session.commit()
            DebugLogger.log(f"Updated recipe {recipe_id} banner image path to: {image_path}", "info")
            return recipe
        except Exception as e:
            self.session.rollback()
            DebugLogger.log(f"Failed to update recipe {recipe_id} banner image path: {e}", "error")
            raise

    def delete_recipe(self, recipe_id: int) -> bool:
        """Delete a recipe by ID."""
        try:
            recipe = self.recipe_repo.get_by_id(recipe_id)
            if not recipe:
                return False
            self.recipe_repo.delete_recipe(recipe)
            self.session.commit()
            return True
        except Exception as e:
            self.session.rollback()
            DebugLogger.log(f"Failed to delete recipe {recipe_id}: {e}", "error")
            raise

    def update_recipe(self, recipe_id: int, update_dto: RecipeUpdateDTO) -> Recipe:
        """
        Update an existing recipe and its ingredient links.
        """
        try:
            updated_recipe = self.recipe_repo.update_recipe(recipe_id, update_dto)
            if not updated_recipe:
                raise RecipeSaveError(f"Recipe {recipe_id} not found.")
            self.session.commit()
            return updated_recipe
        except SQLAlchemyError as err:
            self.session.rollback()
            raise RecipeSaveError(
                f"Unable to update recipe '{recipe_id}': {err}"
            ) from err

    def get_recipe(self, recipe_id: int) -> Recipe | None:
        """
        Retrieve a single recipe by ID.

        Args:
            recipe_id (int): ID of the recipe to retrieve.

        Returns:
            Optional[Recipe]: The Recipe if found, else None.
        """
        return self.recipe_repo.get_by_id(recipe_id)
