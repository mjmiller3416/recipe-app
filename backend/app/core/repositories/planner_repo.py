"""app/core/repositories/planner_repo.py

Repository for managing meal planner state and meal selections.
"""

# ── Imports ─────────────────────────────────────────────────────────────────────────────────────────────────
from __future__ import annotations

from typing import List, Literal, Optional

from sqlalchemy import delete, select, func
from sqlalchemy.orm import Session, joinedload

from ..models.meal_selection import MealSelection
from ..models.recipe import Recipe
from ..models.saved_meal_state import SavedMealState


# ── Planner Repository ──────────────────────────────────────────────────────────────────────────────────────
class PlannerRepo:
    """Repository for meal planner operations."""

    def __init__(self, session: Session):
        """Initialize the Planner Repository with a database session."""
        self.session = session

    # ── Saved Meal State Operations ─────────────────────────────────────────────────────────────────────────
    def get_saved_meal_ids(self) -> List[int]:
        """
        Load saved meal IDs from the database.

        Returns:
            List[int]: List of saved meal IDs.
        """
        stmt = select(SavedMealState.meal_id)
        result = self.session.execute(stmt)
        return result.scalars().all()

    def save_active_meal_ids(self, meal_ids: List[int]) -> None:
        """
        Save the active meal IDs to the database atomically.
        Clears existing saved states and saves new ones.

        Args:
            meal_ids (List[int]): List of meal IDs to save.
        """
        # clear existing saved states
        self.clear_saved_meal_states()

        # save new meal IDs
        for meal_id in meal_ids:
            saved_state = SavedMealState(meal_id=meal_id)
            self.session.add(saved_state)
        # flush so new saved meal states can be read immediately in this session
        self.session.flush()

    def clear_saved_meal_states(self) -> None:
        """Clear all saved meal states from the database."""
        stmt = delete(SavedMealState)
        self.session.execute(stmt)

    def get_saved_meal_states(self) -> List[SavedMealState]:
        """
        Get all saved meal states with their associated meal selections.

        Returns:
            List[SavedMealState]: List of saved meal states with loaded relationships.
        """
        stmt = select(SavedMealState).options(
            joinedload(SavedMealState.meal_selection).joinedload(MealSelection.main_recipe),
            joinedload(SavedMealState.meal_selection).joinedload(MealSelection.side_recipe_1),
            joinedload(SavedMealState.meal_selection).joinedload(MealSelection.side_recipe_2),
            joinedload(SavedMealState.meal_selection).joinedload(MealSelection.side_recipe_3),
        )
        result = self.session.execute(stmt)
        return result.scalars().unique().all()  # added unique() for joinedload

    # ── Meal Selection Operations ───────────────────────────────────────────────────────────────────────────
    def create_meal_selection(self, meal_selection: MealSelection) -> MealSelection:
        """
        Create and persist a new MealSelection to the database.

        Args:
            meal_selection (MealSelection): Unsaved model instance (id should be None)

        Returns:
            MealSelection: Saved instance with assigned ID
        """
        if meal_selection.id is not None:
            raise ValueError("Cannot create a meal selection that already has an ID.")

        self.session.add(meal_selection)
        # ensure the INSERT is flushed so the instance becomes persistent and gets its ID
        self.session.flush()
        self.session.refresh(meal_selection)
        return meal_selection

    def update_meal_selection(self, meal_selection: MealSelection) -> MealSelection:
        """
        Update an existing MealSelection in the database.

        Args:
            meal_selection (MealSelection): Model instance with valid ID

        Returns:
            MealSelection: Updated meal selection
        """
        if meal_selection.id is None:
            raise ValueError("Cannot update a meal selection without an ID.")

        # merge the instance with the session
        merged_meal = self.session.merge(meal_selection)
        return merged_meal

    def get_meal_selection_by_id(self, meal_id: int) -> Optional[MealSelection]:
        """
        Load a MealSelection from the database by ID with all relationships.

        Args:
            meal_id (int): ID of the meal to load

        Returns:
            Optional[MealSelection]: Loaded model or None if not found
        """
        stmt = select(MealSelection).where(MealSelection.id == meal_id).options(
            joinedload(MealSelection.main_recipe),
            joinedload(MealSelection.side_recipe_1),
            joinedload(MealSelection.side_recipe_2),
            joinedload(MealSelection.side_recipe_3)
        )
        result = self.session.execute(stmt)
        return result.scalar_one_or_none()

    def get_all_meal_selections(self) -> List[MealSelection]:
        """
        Get all meal selections with their associated recipes.

        Returns:
            List[MealSelection]: List of all meal selections with loaded relationships.
        """
        stmt = select(MealSelection).options(
            joinedload(MealSelection.main_recipe),
            joinedload(MealSelection.side_recipe_1),
            joinedload(MealSelection.side_recipe_2),
            joinedload(MealSelection.side_recipe_3)
        )
        result = self.session.execute(stmt)
        return result.scalars().all()

    def delete_meal_selection(self, meal_id: int) -> bool:
        """
        Delete a meal selection by ID.

        Args:
            meal_id (int): ID of the meal selection to delete

        Returns:
            bool: True if deleted, False if not found
        """
        stmt = select(MealSelection).where(MealSelection.id == meal_id)
        result = self.session.execute(stmt)
        meal_selection = result.scalar_one_or_none()

        if meal_selection:
            self.session.delete(meal_selection)
            # flush to push the delete before any follow-up queries
            self.session.flush()
            return True
        return False

    def remove_recipe_from_meal(self, meal_id: int, slot: Literal["side_1", "side_2", "side_3"]
        ) -> Optional[MealSelection]:
        """
        Remove a recipe from a specific slot in a meal selection.

        Note: Only side recipe slots can be cleared. To remove the main recipe,
        use delete_meal_selection() instead as a meal cannot exist without a main recipe.

        Args:
            meal_id (int): ID of the meal selection to modify
            slot (str): The recipe slot to clear ("side_1", "side_2", or "side_3")

        Returns:
            Optional[MealSelection]: Updated meal selection, or None if not found
        """
        meal_selection = self.get_meal_selection_by_id(meal_id)
        if not meal_selection:
            return None

        slot_mapping = {
            "side_1": "side_recipe_1_id",
            "side_2": "side_recipe_2_id",
            "side_3": "side_recipe_3_id",
        }

        attr_name = slot_mapping.get(slot)
        if not attr_name:
            raise ValueError(f"Invalid slot '{slot}'. Must be one of: {list(slot_mapping.keys())}")

        setattr(meal_selection, attr_name, None)
        self.session.flush()
        return meal_selection

    # ── Validation Methods ──────────────────────────────────────────────────────────────────────────────────
    def validate_meal_ids(self, meal_ids: List[int]) -> List[int]:
        """
        Validate the given meal IDs against the database.

        Args:
            meal_ids (List[int]): List of meal IDs to validate

        Returns:
            List[int]: List of valid meal IDs that exist in the database.
        """
        if not meal_ids:
            return []

        stmt = select(MealSelection.id).where(MealSelection.id.in_(meal_ids))
        result = self.session.execute(stmt)
        return result.scalars().all()

    def validate_recipe_ids(self, recipe_ids: List[int]) -> List[int]:
        """
        Validate the given recipe IDs against the database.

        Args:
            recipe_ids (List[int]): List of recipe IDs to validate

        Returns:
            List[int]: List of valid recipe IDs that exist in the database.
        """
        if not recipe_ids:
            return []

        stmt = select(Recipe.id).where(Recipe.id.in_(recipe_ids))
        result = self.session.execute(stmt)
        return result.scalars().all()

    # ── Query Methods ───────────────────────────────────────────────────────────────────────────────────────
    def get_meals_by_recipe_id(self, recipe_id: int) -> List[MealSelection]:
        """
        Get all meal selections that contain a specific recipe (main or side).

        Args:
            recipe_id (int): ID of the recipe to search for

        Returns:
            List[MealSelection]: List of meal selections containing the recipe
        """
        stmt = select(MealSelection).where(
            (MealSelection.main_recipe_id == recipe_id) |
            (MealSelection.side_recipe_1_id == recipe_id) |
            (MealSelection.side_recipe_2_id == recipe_id) |
            (MealSelection.side_recipe_3_id == recipe_id)
        ).options(
            joinedload(MealSelection.main_recipe),
            joinedload(MealSelection.side_recipe_1),
            joinedload(MealSelection.side_recipe_2),
            joinedload(MealSelection.side_recipe_3)
        )
        result = self.session.execute(stmt)
        return result.scalars().all()

    def get_meals_by_name_pattern(self, name_pattern: str) -> List[MealSelection]:
        """
        Get meal selections by name pattern (case-insensitive).

        Args:
            name_pattern (str): Pattern to search for in meal names

        Returns:
            List[MealSelection]: List of matching meal selections
        """
        stmt = select(MealSelection).where(
            MealSelection.meal_name.ilike(f"%{name_pattern}%")
        ).options(
            joinedload(MealSelection.main_recipe),
            joinedload(MealSelection.side_recipe_1),
            joinedload(MealSelection.side_recipe_2),
            joinedload(MealSelection.side_recipe_3)
        )
        result = self.session.execute(stmt)
        return result.scalars().all()

    # ── Utility Methods ─────────────────────────────────────────────────────────────────────────────────────
    def get_saved_meal_selections(self) -> List[MealSelection]:
        """
        Get all currently saved meal selections with their recipes.

        Returns:
            List[MealSelection]: List of saved meal selections with loaded relationships.
        """
        saved_ids = self.get_saved_meal_ids()
        if not saved_ids:
            return []

        stmt = select(MealSelection).where(
            MealSelection.id.in_(saved_ids)
        ).options(
            joinedload(MealSelection.main_recipe),
            joinedload(MealSelection.side_recipe_1),
            joinedload(MealSelection.side_recipe_2),
            joinedload(MealSelection.side_recipe_3)
        )
        result = self.session.execute(stmt)
        return result.scalars().all()

    def count_meal_selections(self) -> int:
        """
        Count total number of meal selections in the database.

        Returns:
            int: Total count of meal selections
        """
        stmt = select(func.count()).select_from(MealSelection)
        return self.session.execute(stmt).scalar() or 0

    def count_saved_meal_states(self) -> int:
        """
        Count total number of saved meal states.

        Returns:
            int: Total count of saved meal states
        """
        stmt = select(func.count()).select_from(SavedMealState)
        return self.session.execute(stmt).scalar() or 0
