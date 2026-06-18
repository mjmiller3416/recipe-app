"""Tests for the MealService (modular: Core + SideRecipeMixin + QueryMixin).

Covers:
- Create: happy path, invalid recipe, too many sides, with sides
- Read: get by ID, not found, user isolation, get all
- Update: name, not found, tags
- Toggle save
- Delete: success, not found
- Side recipes: add, at capacity, remove
"""

from unittest.mock import patch

import pytest
from pydantic import ValidationError

from app.dtos.meal_dtos import MealCreateDTO, MealResponseDTO, MealUpdateDTO
from app.models.recipe import Recipe
from app.services.meal import InvalidRecipeError, MealService
from app.services.meal.service import MealServiceCore


# ---------------------------------------------------------------------------
# Local fixtures
# ---------------------------------------------------------------------------

@pytest.fixture()
def side_recipe(db_session, test_user):
    """Insert and return a second recipe suitable for use as a side dish."""
    recipe = Recipe(
        recipe_name="Side Salad",
        recipe_category="Salads",
        meal_type="Side",
        servings=2,
        prep_time=5,
        cook_time=0,
        difficulty="Easy",
        user_id=test_user.id,
    )
    db_session.add(recipe)
    db_session.flush()
    return recipe


def _make_extra_side_recipes(db_session, test_user, count: int) -> list[Recipe]:
    """Create *count* extra side recipes and return them as a list."""
    recipes = []
    for i in range(count):
        r = Recipe(
            recipe_name=f"Extra Side {i + 1}",
            recipe_category="Sides",
            meal_type="Side",
            servings=2,
            prep_time=3,
            cook_time=0,
            difficulty="Easy",
            user_id=test_user.id,
        )
        db_session.add(r)
        recipes.append(r)
    db_session.flush()
    return recipes


# ---------------------------------------------------------------------------
# Create
# ---------------------------------------------------------------------------

@patch.object(MealServiceCore, "_sync_shopping_list_if_meal_in_planner")
class TestMealServiceCreate:
    """Tests for MealService.create_meal."""

    def test_create_meal_happy_path(
        self, _mock_sync, db_session, test_user, sample_recipe
    ):
        """A minimal valid create produces a correctly-populated response DTO."""
        service = MealService(db_session, test_user.id)
        dto = MealCreateDTO(
            meal_name="Pasta Night",
            main_recipe_id=sample_recipe.id,
            side_recipe_ids=[],
            tags=[],
            is_saved=True,
        )

        result = service.create_meal(dto)

        assert isinstance(result, MealResponseDTO)
        assert result.meal_name == "Pasta Night"
        assert result.main_recipe_id == sample_recipe.id
        assert result.side_recipe_ids == []
        assert result.is_saved is True
        assert result.tags == []
        assert result.id is not None
        # Main recipe card should be hydrated
        assert result.main_recipe is not None
        assert result.main_recipe.recipe_name == "Test Pasta"

    def test_create_meal_invalid_main_recipe(self, _mock_sync, db_session, test_user):
        """Creating a meal with a non-existent main recipe raises InvalidRecipeError."""
        service = MealService(db_session, test_user.id)
        dto = MealCreateDTO(
            meal_name="Ghost Meal",
            main_recipe_id=9999,
            side_recipe_ids=[],
            tags=[],
        )

        with pytest.raises(InvalidRecipeError, match="does not exist"):
            service.create_meal(dto)

    def test_create_meal_too_many_sides(
        self, _mock_sync, db_session, test_user, sample_recipe
    ):
        """Providing more than 3 side_recipe_ids is rejected at the DTO layer."""
        extras = _make_extra_side_recipes(db_session, test_user, 4)

        with pytest.raises(ValidationError, match="Maximum of 3"):
            MealCreateDTO(
                meal_name="Overloaded Meal",
                main_recipe_id=sample_recipe.id,
                side_recipe_ids=[r.id for r in extras],
                tags=[],
            )

    def test_create_meal_with_sides(
        self, _mock_sync, db_session, test_user, sample_recipe, side_recipe
    ):
        """Creating a meal with a valid side recipe includes it in the response."""
        service = MealService(db_session, test_user.id)
        dto = MealCreateDTO(
            meal_name="Full Dinner",
            main_recipe_id=sample_recipe.id,
            side_recipe_ids=[side_recipe.id],
            tags=["dinner"],
            is_saved=True,
        )

        result = service.create_meal(dto)

        assert side_recipe.id in result.side_recipe_ids
        assert len(result.side_recipes) == 1
        assert result.side_recipes[0].recipe_name == "Side Salad"


# ---------------------------------------------------------------------------
# Read
# ---------------------------------------------------------------------------

@patch.object(MealServiceCore, "_sync_shopping_list_if_meal_in_planner")
class TestMealServiceRead:
    """Tests for MealService.get_meal and get_all_meals."""

    def test_get_meal(self, _mock_sync, db_session, test_user, sample_recipe):
        """get_meal returns a DTO matching the created meal."""
        service = MealService(db_session, test_user.id)
        created = service.create_meal(
            MealCreateDTO(
                meal_name="Readable Meal",
                main_recipe_id=sample_recipe.id,
            )
        )

        result = service.get_meal(created.id)

        assert result is not None
        assert result.id == created.id
        assert result.meal_name == "Readable Meal"

    def test_get_meal_not_found(self, _mock_sync, db_session, test_user):
        """get_meal returns None for a non-existent ID."""
        service = MealService(db_session, test_user.id)

        result = service.get_meal(9999)

        assert result is None

    def test_get_meal_user_isolation(
        self, _mock_sync, db_session, test_user, second_user, sample_recipe
    ):
        """A meal created by one user is invisible to another user."""
        owner_service = MealService(db_session, test_user.id)
        created = owner_service.create_meal(
            MealCreateDTO(
                meal_name="Private Meal",
                main_recipe_id=sample_recipe.id,
            )
        )

        other_service = MealService(db_session, second_user.id)
        result = other_service.get_meal(created.id)

        assert result is None

    def test_get_all_meals(self, _mock_sync, db_session, test_user, sample_recipe):
        """get_all_meals returns every meal belonging to the user."""
        service = MealService(db_session, test_user.id)
        service.create_meal(
            MealCreateDTO(
                meal_name="Meal One",
                main_recipe_id=sample_recipe.id,
            )
        )
        service.create_meal(
            MealCreateDTO(
                meal_name="Meal Two",
                main_recipe_id=sample_recipe.id,
            )
        )

        results = service.get_all_meals()

        assert len(results) == 2
        names = {r.meal_name for r in results}
        assert names == {"Meal One", "Meal Two"}


# ---------------------------------------------------------------------------
# Update
# ---------------------------------------------------------------------------

@patch.object(MealServiceCore, "_sync_shopping_list_if_meal_in_planner")
class TestMealServiceUpdate:
    """Tests for MealService.update_meal."""

    def test_update_meal_name(self, _mock_sync, db_session, test_user, sample_recipe):
        """Updating the meal_name field persists the new value."""
        service = MealService(db_session, test_user.id)
        created = service.create_meal(
            MealCreateDTO(
                meal_name="Old Name",
                main_recipe_id=sample_recipe.id,
            )
        )

        result = service.update_meal(
            created.id,
            MealUpdateDTO(meal_name="New Name"),
        )

        assert result is not None
        assert result.meal_name == "New Name"

    def test_update_meal_not_found(self, _mock_sync, db_session, test_user):
        """Updating a non-existent meal returns None."""
        service = MealService(db_session, test_user.id)

        result = service.update_meal(9999, MealUpdateDTO(meal_name="Nope"))

        assert result is None

    def test_update_meal_tags(self, _mock_sync, db_session, test_user, sample_recipe):
        """Updating tags replaces the previous tag list."""
        service = MealService(db_session, test_user.id)
        created = service.create_meal(
            MealCreateDTO(
                meal_name="Tagged Meal",
                main_recipe_id=sample_recipe.id,
                tags=["old-tag"],
            )
        )
        assert created.tags == ["old-tag"]

        result = service.update_meal(
            created.id,
            MealUpdateDTO(tags=["new-tag", "another-tag"]),
        )

        assert result is not None
        assert set(result.tags) == {"new-tag", "another-tag"}


# ---------------------------------------------------------------------------
# Toggle Save
# ---------------------------------------------------------------------------

@patch.object(MealServiceCore, "_sync_shopping_list_if_meal_in_planner")
class TestMealServiceToggleSave:
    """Tests for MealService.toggle_save."""

    def test_toggle_save(self, _mock_sync, db_session, test_user, sample_recipe):
        """Toggling a saved meal sets is_saved to False, and vice versa."""
        service = MealService(db_session, test_user.id)
        created = service.create_meal(
            MealCreateDTO(
                meal_name="Saveable Meal",
                main_recipe_id=sample_recipe.id,
                is_saved=True,
            )
        )
        assert created.is_saved is True

        toggled = service.toggle_save(created.id)

        assert toggled is not None
        assert toggled.is_saved is False

        # Toggle back
        toggled_again = service.toggle_save(created.id)
        assert toggled_again.is_saved is True


# ---------------------------------------------------------------------------
# Delete
# ---------------------------------------------------------------------------

@patch.object(MealServiceCore, "_sync_shopping_list_if_meal_in_planner")
class TestMealServiceDelete:
    """Tests for MealService.delete_meal."""

    def test_delete_meal(self, _mock_sync, db_session, test_user, sample_recipe):
        """Deleting an existing meal returns True and the meal is gone afterward."""
        service = MealService(db_session, test_user.id)
        created = service.create_meal(
            MealCreateDTO(
                meal_name="Doomed Meal",
                main_recipe_id=sample_recipe.id,
            )
        )

        deleted = service.delete_meal(created.id)

        assert deleted is True
        assert service.get_meal(created.id) is None

    def test_delete_meal_not_found(self, _mock_sync, db_session, test_user):
        """Deleting a non-existent meal returns False."""
        service = MealService(db_session, test_user.id)

        result = service.delete_meal(9999)

        assert result is False


# ---------------------------------------------------------------------------
# Side Recipes
# ---------------------------------------------------------------------------

@patch.object(MealServiceCore, "_sync_shopping_list_if_meal_in_planner")
class TestMealServiceSideRecipes:
    """Tests for SideRecipeMixin: add_side_recipe, remove_side_recipe."""

    def test_add_side_recipe(
        self, _mock_sync, db_session, test_user, sample_recipe, side_recipe
    ):
        """Adding a valid side recipe to an empty-sides meal succeeds."""
        service = MealService(db_session, test_user.id)
        created = service.create_meal(
            MealCreateDTO(
                meal_name="Base Meal",
                main_recipe_id=sample_recipe.id,
                side_recipe_ids=[],
            )
        )
        assert created.side_recipe_ids == []

        result = service.add_side_recipe(created.id, side_recipe.id)

        assert result is not None
        assert side_recipe.id in result.side_recipe_ids

    def test_add_side_recipe_at_capacity(
        self, _mock_sync, db_session, test_user, sample_recipe
    ):
        """Adding a 4th side recipe when 3 already exist raises InvalidRecipeError."""
        service = MealService(db_session, test_user.id)
        sides = _make_extra_side_recipes(db_session, test_user, 4)

        created = service.create_meal(
            MealCreateDTO(
                meal_name="Full Sides Meal",
                main_recipe_id=sample_recipe.id,
                side_recipe_ids=[s.id for s in sides[:3]],
            )
        )
        assert len(created.side_recipe_ids) == 3

        with pytest.raises(InvalidRecipeError, match="max capacity"):
            service.add_side_recipe(created.id, sides[3].id)

    def test_remove_side_recipe(
        self, _mock_sync, db_session, test_user, sample_recipe, side_recipe
    ):
        """Removing a side recipe leaves the side list empty."""
        service = MealService(db_session, test_user.id)
        created = service.create_meal(
            MealCreateDTO(
                meal_name="Meal With Side",
                main_recipe_id=sample_recipe.id,
                side_recipe_ids=[side_recipe.id],
            )
        )
        assert side_recipe.id in created.side_recipe_ids

        result = service.remove_side_recipe(created.id, side_recipe.id)

        assert result is not None
        assert result.side_recipe_ids == []
