"""Test configuration and fixtures for the backend tests."""

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database.base import Base


@pytest.fixture(scope="function")
def db_session():
    """Create a fresh in-memory database for each test."""
    # Create in-memory SQLite database
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    # Import all models to register them with the metadata
    from app.core.models.ingredient import Ingredient
    from app.core.models.meal import Meal
    from app.core.models.planner_entry import PlannerEntry
    from app.core.models.recipe import Recipe
    from app.core.models.recipe_history import RecipeHistory
    from app.core.models.recipe_ingredient import RecipeIngredient
    from app.core.models.shopping_item import ShoppingItem
    from app.core.models.shopping_state import ShoppingState

    # Create all tables
    Base.metadata.create_all(bind=engine)

    # Create session
    Session = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = Session()

    yield session

    # Cleanup
    session.close()
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def sample_recipe(db_session):
    """Create a sample recipe for testing."""
    from app.core.models.recipe import Recipe

    recipe = Recipe(
        recipe_name="Test Recipe",
        recipe_category="Main Course",
        meal_type="Dinner",
        total_time=30,
        servings=4,
    )
    db_session.add(recipe)
    db_session.commit()
    return recipe


@pytest.fixture
def sample_side_recipe(db_session):
    """Create a sample side recipe for testing."""
    from app.core.models.recipe import Recipe

    recipe = Recipe(
        recipe_name="Test Side",
        recipe_category="Side",
        meal_type="Side",
        total_time=15,
        servings=4,
    )
    db_session.add(recipe)
    db_session.commit()
    return recipe


@pytest.fixture
def sample_meal(db_session, sample_recipe):
    """Create a sample meal for testing."""
    from app.core.models.meal import Meal

    meal = Meal(
        meal_name="Test Meal",
        main_recipe_id=sample_recipe.id,
    )
    db_session.add(meal)
    db_session.commit()
    return meal
