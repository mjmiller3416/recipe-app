"""Tests for meal and planner functionality.

Tests cover:
- Creating a meal (main required, sides optional)
- Updating meal (name, recipes, favorite, tags)
- Deleting a meal (verify planner entry cascades)
- Side recipe array operations (add, remove, reorder - no holes)
- Adding/removing meals from planner (meal persists after removal)
- Planner ordering (position management)
- Planner entry completion (is_completed, completed_at)
- Planner limit enforcement (max 15)
- Tag filtering (case-insensitive, multiple tags)
- Recipe deletion impact (which meals affected)
"""

import pytest

from app.core.models.meal import Meal
from app.core.models.planner_entry import PlannerEntry
from app.core.models.recipe import Recipe
from app.core.repositories.meal_repo import MealRepo
from app.core.repositories.planner_repo import MAX_PLANNER_ENTRIES, PlannerRepo
from app.core.services.meal_service import MealService
from app.core.services.planner_service import PlannerFullError, PlannerService
from app.core.dtos.meal_dtos import MealCreateDTO, MealUpdateDTO


class TestMealCreation:
    """Tests for creating meals."""

    def test_create_meal_with_main_recipe_only(self, db_session, sample_recipe):
        """Create a meal with only a main recipe (required)."""
        meal = Meal(
            meal_name="Simple Meal",
            main_recipe_id=sample_recipe.id,
        )
        db_session.add(meal)
        db_session.commit()

        assert meal.id is not None
        assert meal.meal_name == "Simple Meal"
        assert meal.main_recipe_id == sample_recipe.id
        assert meal.side_recipe_ids == []
        assert meal.is_favorite is False
        assert meal.tags == []

    def test_create_meal_with_side_recipes(self, db_session, sample_recipe):
        """Create a meal with side recipes."""
        # Create additional recipes for sides
        side1 = Recipe(recipe_name="Side 1", recipe_category="Side", meal_type="Side")
        side2 = Recipe(recipe_name="Side 2", recipe_category="Side", meal_type="Side")
        db_session.add_all([side1, side2])
        db_session.commit()

        meal = Meal(
            meal_name="Full Meal",
            main_recipe_id=sample_recipe.id,
        )
        meal.side_recipe_ids = [side1.id, side2.id]
        db_session.add(meal)
        db_session.commit()

        assert meal.side_recipe_ids == [side1.id, side2.id]

    def test_meal_max_three_sides(self, db_session, sample_recipe):
        """Verify maximum of 3 side recipes."""
        meal = Meal(
            meal_name="Test Meal",
            main_recipe_id=sample_recipe.id,
        )

        with pytest.raises(ValueError, match="Maximum of 3"):
            meal.side_recipe_ids = [1, 2, 3, 4]


class TestMealUpdate:
    """Tests for updating meals."""

    def test_update_meal_name(self, db_session, sample_meal):
        """Update a meal's name."""
        sample_meal.meal_name = "Updated Meal Name"
        db_session.commit()

        db_session.refresh(sample_meal)
        assert sample_meal.meal_name == "Updated Meal Name"

    def test_update_meal_favorite(self, db_session, sample_meal):
        """Toggle meal favorite status."""
        assert sample_meal.is_favorite is False

        sample_meal.is_favorite = True
        db_session.commit()

        db_session.refresh(sample_meal)
        assert sample_meal.is_favorite is True

    def test_update_meal_tags(self, db_session, sample_meal):
        """Update meal tags."""
        sample_meal.tags = ["quick", "healthy", "family"]
        db_session.commit()

        db_session.refresh(sample_meal)
        assert sample_meal.tags == ["quick", "healthy", "family"]


class TestSideRecipeOperations:
    """Tests for side recipe array operations."""

    def test_add_side_recipe(self, db_session, sample_meal, sample_side_recipe):
        """Add a side recipe to a meal."""
        result = sample_meal.add_side_recipe(sample_side_recipe.id)
        db_session.commit()

        assert result is True
        assert sample_side_recipe.id in sample_meal.side_recipe_ids

    def test_add_side_recipe_at_max_capacity(self, db_session, sample_meal):
        """Cannot add side recipe when at max capacity."""
        # Add 3 sides
        sample_meal.side_recipe_ids = [100, 101, 102]

        result = sample_meal.add_side_recipe(103)
        assert result is False
        assert len(sample_meal.side_recipe_ids) == 3

    def test_remove_side_recipe(self, db_session, sample_meal, sample_side_recipe):
        """Remove a side recipe from a meal."""
        sample_meal.side_recipe_ids = [sample_side_recipe.id, 100, 101]
        db_session.commit()

        result = sample_meal.remove_side_recipe(100)
        db_session.commit()

        assert result is True
        assert sample_meal.side_recipe_ids == [sample_side_recipe.id, 101]

    def test_side_recipe_array_stays_contiguous(self, db_session, sample_meal):
        """Removing a middle side recipe keeps array contiguous."""
        sample_meal.side_recipe_ids = [1, 2, 3]

        sample_meal.remove_side_recipe(2)

        # Array should be [1, 3], not [1, None, 3]
        assert sample_meal.side_recipe_ids == [1, 3]
        assert len(sample_meal.side_recipe_ids) == 2


class TestMealDeletion:
    """Tests for meal deletion."""

    def test_delete_meal(self, db_session, sample_meal):
        """Delete a meal."""
        meal_id = sample_meal.id
        db_session.delete(sample_meal)
        db_session.commit()

        result = db_session.query(Meal).filter(Meal.id == meal_id).first()
        assert result is None

    def test_delete_meal_cascades_to_planner_entries(self, db_session, sample_meal):
        """Deleting a meal cascades to its planner entries."""
        # Add meal to planner
        entry = PlannerEntry(meal_id=sample_meal.id, position=0)
        db_session.add(entry)
        db_session.commit()
        entry_id = entry.id

        # Delete the meal
        db_session.delete(sample_meal)
        db_session.commit()

        # Planner entry should be deleted
        result = db_session.query(PlannerEntry).filter(PlannerEntry.id == entry_id).first()
        assert result is None


class TestPlannerOperations:
    """Tests for planner entry operations."""

    def test_add_meal_to_planner(self, db_session, sample_meal):
        """Add a meal to the planner."""
        repo = PlannerRepo(db_session)
        entry = repo.add_entry(sample_meal.id)
        db_session.commit()

        assert entry.id is not None
        assert entry.meal_id == sample_meal.id
        assert entry.position == 0
        assert entry.is_completed is False

    def test_remove_from_planner_keeps_meal(self, db_session, sample_meal):
        """Removing from planner does NOT delete the meal."""
        repo = PlannerRepo(db_session)
        entry = repo.add_entry(sample_meal.id)
        db_session.commit()

        # Remove from planner
        repo.remove_entry(entry.id)
        db_session.commit()

        # Meal should still exist
        meal = db_session.query(Meal).filter(Meal.id == sample_meal.id).first()
        assert meal is not None
        assert meal.meal_name == sample_meal.meal_name

    def test_planner_position_ordering(self, db_session, sample_recipe):
        """Planner entries maintain correct position ordering."""
        # Create multiple meals
        meals = []
        for i in range(3):
            meal = Meal(meal_name=f"Meal {i}", main_recipe_id=sample_recipe.id)
            db_session.add(meal)
            meals.append(meal)
        db_session.commit()

        # Add to planner
        repo = PlannerRepo(db_session)
        for meal in meals:
            repo.add_entry(meal.id)
        db_session.commit()

        # Check positions
        entries = repo.get_all()
        for i, entry in enumerate(entries):
            assert entry.position == i

    def test_reorder_planner_entries(self, db_session, sample_recipe):
        """Reorder planner entries."""
        # Create and add meals
        meals = []
        for i in range(3):
            meal = Meal(meal_name=f"Meal {i}", main_recipe_id=sample_recipe.id)
            db_session.add(meal)
            meals.append(meal)
        db_session.commit()

        repo = PlannerRepo(db_session)
        entries = []
        for meal in meals:
            entries.append(repo.add_entry(meal.id))
        db_session.commit()

        # Reorder (reverse)
        repo.reorder_entries([entries[2].id, entries[1].id, entries[0].id])
        db_session.commit()

        # Verify new order
        reordered = repo.get_all()
        assert reordered[0].meal_id == meals[2].id
        assert reordered[1].meal_id == meals[1].id
        assert reordered[2].meal_id == meals[0].id


class TestPlannerCompletion:
    """Tests for planner entry completion tracking."""

    def test_mark_entry_completed(self, db_session, sample_meal):
        """Mark a planner entry as completed."""
        repo = PlannerRepo(db_session)
        entry = repo.add_entry(sample_meal.id)
        db_session.commit()

        entry.mark_completed()
        db_session.commit()

        db_session.refresh(entry)
        assert entry.is_completed is True
        assert entry.completed_at is not None

    def test_mark_entry_incomplete(self, db_session, sample_meal):
        """Mark a completed entry as incomplete."""
        repo = PlannerRepo(db_session)
        entry = repo.add_entry(sample_meal.id)
        entry.mark_completed()
        db_session.commit()

        entry.mark_incomplete()
        db_session.commit()

        db_session.refresh(entry)
        assert entry.is_completed is False
        assert entry.completed_at is None

    def test_toggle_completion(self, db_session, sample_meal):
        """Toggle completion status."""
        repo = PlannerRepo(db_session)
        entry = repo.add_entry(sample_meal.id)
        db_session.commit()

        # Toggle to completed
        result = entry.toggle_completion()
        assert result is True
        assert entry.is_completed is True

        # Toggle to incomplete
        result = entry.toggle_completion()
        assert result is False
        assert entry.is_completed is False


class TestPlannerCapacity:
    """Tests for planner capacity limit."""

    def test_planner_max_15_entries(self, db_session, sample_recipe):
        """Enforce maximum 15 planner entries."""
        # Create 15 meals
        meals = []
        for i in range(MAX_PLANNER_ENTRIES):
            meal = Meal(meal_name=f"Meal {i}", main_recipe_id=sample_recipe.id)
            db_session.add(meal)
            meals.append(meal)
        db_session.commit()

        repo = PlannerRepo(db_session)
        for meal in meals:
            repo.add_entry(meal.id)
        db_session.commit()

        # Verify at capacity
        assert repo.is_at_capacity() is True
        assert repo.count() == MAX_PLANNER_ENTRIES


class TestTagFiltering:
    """Tests for tag filtering."""

    def test_filter_by_single_tag(self, db_session, sample_recipe):
        """Filter meals by a single tag (case-insensitive)."""
        meal1 = Meal(meal_name="Meal 1", main_recipe_id=sample_recipe.id)
        meal1.tags = ["Quick", "Healthy"]
        meal2 = Meal(meal_name="Meal 2", main_recipe_id=sample_recipe.id)
        meal2.tags = ["Slow", "Comfort"]
        db_session.add_all([meal1, meal2])
        db_session.commit()

        repo = MealRepo(db_session)
        results = repo.get_by_tags(["quick"])

        assert len(results) == 1
        assert results[0].meal_name == "Meal 1"

    def test_filter_by_multiple_tags_and_logic(self, db_session, sample_recipe):
        """Filter meals by multiple tags (AND logic)."""
        meal1 = Meal(meal_name="Meal 1", main_recipe_id=sample_recipe.id)
        meal1.tags = ["Quick", "Healthy"]
        meal2 = Meal(meal_name="Meal 2", main_recipe_id=sample_recipe.id)
        meal2.tags = ["Quick", "Comfort"]
        db_session.add_all([meal1, meal2])
        db_session.commit()

        repo = MealRepo(db_session)
        results = repo.get_by_tags(["quick", "healthy"], match_all=True)

        assert len(results) == 1
        assert results[0].meal_name == "Meal 1"


class TestRecipeDeletionImpact:
    """Tests for recipe deletion impact on meals."""

    def test_get_meals_with_main_recipe(self, db_session, sample_recipe):
        """Find meals that use a recipe as main."""
        meal1 = Meal(meal_name="Meal 1", main_recipe_id=sample_recipe.id)
        meal2 = Meal(meal_name="Meal 2", main_recipe_id=sample_recipe.id)
        db_session.add_all([meal1, meal2])
        db_session.commit()

        repo = MealRepo(db_session)
        results = repo.get_meals_by_main_recipe(sample_recipe.id)

        assert len(results) == 2

    def test_get_meals_with_side_recipe(self, db_session, sample_recipe, sample_side_recipe):
        """Find meals that have a recipe as a side."""
        meal1 = Meal(meal_name="Meal 1", main_recipe_id=sample_recipe.id)
        meal1.side_recipe_ids = [sample_side_recipe.id]
        meal2 = Meal(meal_name="Meal 2", main_recipe_id=sample_recipe.id)
        db_session.add_all([meal1, meal2])
        db_session.commit()

        repo = MealRepo(db_session)
        results = repo.get_meals_with_side_recipe(sample_side_recipe.id)

        assert len(results) == 1
        assert results[0].meal_name == "Meal 1"

    def test_remove_side_recipe_from_all_meals(self, db_session, sample_recipe, sample_side_recipe):
        """Remove a recipe from all meals' side recipe lists."""
        meal1 = Meal(meal_name="Meal 1", main_recipe_id=sample_recipe.id)
        meal1.side_recipe_ids = [sample_side_recipe.id, 100]
        meal2 = Meal(meal_name="Meal 2", main_recipe_id=sample_recipe.id)
        meal2.side_recipe_ids = [sample_side_recipe.id]
        db_session.add_all([meal1, meal2])
        db_session.commit()

        repo = MealRepo(db_session)
        count = repo.remove_side_recipe_from_all_meals(sample_side_recipe.id)
        db_session.commit()

        assert count == 2

        db_session.refresh(meal1)
        db_session.refresh(meal2)
        assert sample_side_recipe.id not in meal1.side_recipe_ids
        assert sample_side_recipe.id not in meal2.side_recipe_ids
        assert meal1.side_recipe_ids == [100]  # Other side remains
        assert meal2.side_recipe_ids == []


class TestMealHelperMethods:
    """Tests for meal helper methods."""

    def test_get_all_recipe_ids(self, db_session, sample_meal, sample_side_recipe):
        """Get all recipe IDs from a meal."""
        sample_meal.side_recipe_ids = [sample_side_recipe.id, 100]
        db_session.commit()

        all_ids = sample_meal.get_all_recipe_ids()

        assert sample_meal.main_recipe_id in all_ids
        assert sample_side_recipe.id in all_ids
        assert 100 in all_ids
        assert len(all_ids) == 3

    def test_has_recipe(self, db_session, sample_meal, sample_side_recipe):
        """Check if meal contains a specific recipe."""
        sample_meal.side_recipe_ids = [sample_side_recipe.id]
        db_session.commit()

        # Main recipe
        assert sample_meal.has_recipe(sample_meal.main_recipe_id) is True
        # Side recipe
        assert sample_meal.has_recipe(sample_side_recipe.id) is True
        # Non-existent
        assert sample_meal.has_recipe(99999) is False
