"""Tests for the RecipeService.

Covers:
- Create: happy path, duplicate raises DuplicateRecipeError
- Read: get by ID, not found, user isolation
- Update: name change, not found raises RecipeSaveError
- Delete: happy path, not found
- Toggle favorite
- List filtered
- Deletion impact
- Resolve ingredient
"""

from unittest.mock import patch

import pytest

from app.dtos.ingredient_dtos import IngredientCreateDTO
from app.dtos.recipe_dtos import (
    RecipeCreateDTO,
    RecipeFilterDTO,
    RecipeIngredientDTO,
    RecipeUpdateDTO,
)
from app.models.ingredient import Ingredient
from app.models.meal import Meal
from app.models.recipe import Recipe
from app.services.recipe_service import (
    DuplicateRecipeError,
    RecipeSaveError,
    RecipeService,
)


# ---------------------------------------------------------------------------
# Create
# ---------------------------------------------------------------------------

class TestRecipeServiceCreate:
    """Tests for RecipeService.create_recipe_with_ingredients."""

    def test_create_recipe_happy_path(self, db_session, test_user):
        """Creating a valid recipe returns a persisted Recipe with an ID."""
        service = RecipeService(db_session, test_user.id)
        dto = RecipeCreateDTO(
            recipe_name="Grilled Chicken",
            recipe_category="American",
            meal_type="Dinner",
            servings=4,
            prep_time=15,
            cook_time=25,
            difficulty="Medium",
            ingredients=[
                RecipeIngredientDTO(
                    ingredient_name="Chicken Breast",
                    ingredient_category="Poultry",
                    quantity=2.0,
                    unit="lbs",
                ),
            ],
        )

        result = service.create_recipe_with_ingredients(dto)

        assert result.id is not None
        assert result.recipe_name == "Grilled Chicken"
        assert result.recipe_category == "American"
        assert result.servings == 4
        assert result.user_id == test_user.id

    def test_create_recipe_no_ingredients(self, db_session, test_user):
        """Creating a recipe with no ingredients succeeds."""
        service = RecipeService(db_session, test_user.id)
        dto = RecipeCreateDTO(
            recipe_name="Plain Toast",
            recipe_category="Breakfast",
            meal_type="Breakfast",
            ingredients=[],
        )

        result = service.create_recipe_with_ingredients(dto)

        assert result.id is not None
        assert result.recipe_name == "Plain Toast"

    def test_create_duplicate_raises_error(self, db_session, test_user, sample_recipe):
        """Creating a recipe with the same name and category raises DuplicateRecipeError."""
        service = RecipeService(db_session, test_user.id)
        dto = RecipeCreateDTO(
            recipe_name="Test Pasta",
            recipe_category="Italian",
            meal_type="Dinner",
        )

        with pytest.raises(DuplicateRecipeError, match="already exists"):
            service.create_recipe_with_ingredients(dto)


# ---------------------------------------------------------------------------
# Read
# ---------------------------------------------------------------------------

class TestRecipeServiceRead:
    """Tests for RecipeService.get_recipe."""

    def test_get_recipe(self, db_session, test_user, sample_recipe):
        """get_recipe returns the recipe for a valid ID."""
        service = RecipeService(db_session, test_user.id)

        result = service.get_recipe(sample_recipe.id)

        assert result is not None
        assert result.id == sample_recipe.id
        assert result.recipe_name == "Test Pasta"

    def test_get_recipe_not_found(self, db_session, test_user):
        """get_recipe returns None for a non-existent ID."""
        service = RecipeService(db_session, test_user.id)

        result = service.get_recipe(9999)

        assert result is None

    def test_get_recipe_user_isolation(
        self, db_session, test_user, second_user, sample_recipe
    ):
        """A recipe created by one user is invisible to another."""
        other_service = RecipeService(db_session, second_user.id)

        result = other_service.get_recipe(sample_recipe.id)

        assert result is None


# ---------------------------------------------------------------------------
# Update
# ---------------------------------------------------------------------------

@patch.object(RecipeService, "_sync_shopping_list_if_recipe_in_planner")
class TestRecipeServiceUpdate:
    """Tests for RecipeService.update_recipe."""

    def test_update_recipe_name(
        self, _mock_sync, db_session, test_user, sample_recipe
    ):
        """Updating the recipe name persists the new value."""
        service = RecipeService(db_session, test_user.id)
        update_dto = RecipeUpdateDTO(recipe_name="Updated Pasta")

        result = service.update_recipe(sample_recipe.id, update_dto)

        assert result.recipe_name == "Updated Pasta"

    def test_update_recipe_not_found(self, _mock_sync, db_session, test_user):
        """Updating a non-existent recipe raises RecipeSaveError."""
        service = RecipeService(db_session, test_user.id)
        update_dto = RecipeUpdateDTO(recipe_name="Ghost Recipe")

        with pytest.raises(RecipeSaveError, match="not found"):
            service.update_recipe(9999, update_dto)

    def test_update_recipe_difficulty(
        self, _mock_sync, db_session, test_user, sample_recipe
    ):
        """Updating difficulty persists the new value."""
        service = RecipeService(db_session, test_user.id)
        update_dto = RecipeUpdateDTO(difficulty="Hard")

        result = service.update_recipe(sample_recipe.id, update_dto)

        assert result.difficulty == "Hard"


# ---------------------------------------------------------------------------
# Delete
# ---------------------------------------------------------------------------

class TestRecipeServiceDelete:
    """Tests for RecipeService.delete_recipe."""

    def test_delete_recipe(self, db_session, test_user, sample_recipe):
        """Deleting an existing recipe returns True and it's gone afterward."""
        service = RecipeService(db_session, test_user.id)

        result = service.delete_recipe(sample_recipe.id)

        assert result is True
        assert service.get_recipe(sample_recipe.id) is None

    def test_delete_recipe_not_found(self, db_session, test_user):
        """Deleting a non-existent recipe returns False."""
        service = RecipeService(db_session, test_user.id)

        result = service.delete_recipe(9999)

        assert result is False

    def test_delete_recipe_cleans_up_side_references(self, db_session, test_user):
        """Deleting a recipe removes it from meals where it's a side dish."""
        service = RecipeService(db_session, test_user.id)

        main = Recipe(
            recipe_name="Main Dish",
            recipe_category="Entrees",
            meal_type="Dinner",
            user_id=test_user.id,
        )
        side = Recipe(
            recipe_name="Side Dish",
            recipe_category="Sides",
            meal_type="Side",
            user_id=test_user.id,
        )
        db_session.add_all([main, side])
        db_session.flush()

        meal = Meal(
            meal_name="Combo Meal",
            main_recipe_id=main.id,
            user_id=test_user.id,
            is_saved=True,
        )
        meal.side_recipe_ids = [side.id]
        db_session.add(meal)
        db_session.flush()

        service.delete_recipe(side.id)

        db_session.refresh(meal)
        assert side.id not in meal.side_recipe_ids


# ---------------------------------------------------------------------------
# Toggle Favorite
# ---------------------------------------------------------------------------

class TestRecipeServiceToggleFavorite:
    """Tests for RecipeService.toggle_favorite."""

    def test_toggle_favorite(self, db_session, test_user, sample_recipe):
        """Toggling a non-favorite recipe sets is_favorite to True."""
        service = RecipeService(db_session, test_user.id)
        assert sample_recipe.is_favorite is False

        result = service.toggle_favorite(sample_recipe.id)

        assert result is not None
        assert result.is_favorite is True

    def test_toggle_favorite_back(self, db_session, test_user, sample_recipe):
        """Toggling a favorite recipe sets is_favorite to False."""
        service = RecipeService(db_session, test_user.id)
        service.toggle_favorite(sample_recipe.id)  # True

        result = service.toggle_favorite(sample_recipe.id)  # False

        assert result.is_favorite is False

    def test_toggle_favorite_not_found(self, db_session, test_user):
        """Toggling a non-existent recipe returns None."""
        service = RecipeService(db_session, test_user.id)

        result = service.toggle_favorite(9999)

        assert result is None


# ---------------------------------------------------------------------------
# List Filtered
# ---------------------------------------------------------------------------

class TestRecipeServiceListFiltered:
    """Tests for RecipeService.list_filtered."""

    def test_list_all(self, db_session, test_user, sample_recipe):
        """list_filtered with no filters returns all user recipes."""
        service = RecipeService(db_session, test_user.id)
        filter_dto = RecipeFilterDTO()

        results = service.list_filtered(filter_dto)

        assert len(results) >= 1
        ids = [r.id for r in results]
        assert sample_recipe.id in ids

    def test_filter_by_category(self, db_session, test_user, sample_recipe):
        """list_filtered with a category filter narrows results."""
        service = RecipeService(db_session, test_user.id)

        # Create a recipe in a different category
        other = Recipe(
            recipe_name="Tacos",
            recipe_category="Mexican",
            meal_type="Dinner",
            user_id=test_user.id,
        )
        db_session.add(other)
        db_session.flush()

        filter_dto = RecipeFilterDTO(recipe_category="Italian")
        results = service.list_filtered(filter_dto)

        names = [r.recipe_name for r in results]
        assert "Test Pasta" in names
        assert "Tacos" not in names

    def test_filter_favorites_only(self, db_session, test_user, sample_recipe):
        """list_filtered with favorites_only excludes non-favorites."""
        service = RecipeService(db_session, test_user.id)
        filter_dto = RecipeFilterDTO(favorites_only=True)

        results = service.list_filtered(filter_dto)

        assert all(r.is_favorite for r in results)


# ---------------------------------------------------------------------------
# Deletion Impact
# ---------------------------------------------------------------------------

class TestRecipeServiceDeletionImpact:
    """Tests for RecipeService.get_recipe_deletion_impact."""

    def test_no_impact(self, db_session, test_user, sample_recipe):
        """A recipe not used in any meal has zero impact."""
        service = RecipeService(db_session, test_user.id)

        impact = service.get_recipe_deletion_impact(sample_recipe.id)

        assert impact.total_affected == 0
        assert impact.meals_to_delete == []
        assert impact.meals_to_update == []

    def test_impact_as_main(self, db_session, test_user, sample_recipe):
        """A recipe used as a main recipe reports meals_to_delete."""
        service = RecipeService(db_session, test_user.id)
        meal = Meal(
            meal_name="Pasta Night",
            main_recipe_id=sample_recipe.id,
            user_id=test_user.id,
            is_saved=True,
        )
        db_session.add(meal)
        db_session.flush()

        impact = service.get_recipe_deletion_impact(sample_recipe.id)

        assert impact.total_affected >= 1
        assert len(impact.meals_to_delete) >= 1


# ---------------------------------------------------------------------------
# Resolve Ingredient
# ---------------------------------------------------------------------------

class TestRecipeServiceResolveIngredient:
    """Tests for RecipeService.resolve_ingredient."""

    def test_resolve_by_existing_id(
        self, db_session, test_user, sample_ingredient
    ):
        """resolve_ingredient with an existing_ingredient_id returns that ingredient."""
        service = RecipeService(db_session, test_user.id)
        ing_dto = RecipeIngredientDTO(
            existing_ingredient_id=sample_ingredient.id,
            ingredient_name="Spaghetti",
            ingredient_category="Pasta",
        )

        result = service.resolve_ingredient(ing_dto)

        assert result.id == sample_ingredient.id

    def test_resolve_creates_new(self, db_session, test_user):
        """resolve_ingredient without an existing ID creates a new ingredient."""
        service = RecipeService(db_session, test_user.id)
        ing_dto = RecipeIngredientDTO(
            ingredient_name="Fresh Basil",
            ingredient_category="Herbs",
            quantity=0.5,
            unit="cups",
        )

        result = service.resolve_ingredient(ing_dto)

        assert result is not None
        assert result.ingredient_name == "Fresh Basil"
        assert result.ingredient_category == "Herbs"
