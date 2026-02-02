"""app/repositories/recipe_group_repo.py

Repository for managing recipe group CRUD operations.
"""

# -- Imports -------------------------------------------------------------------------------------
from __future__ import annotations

from typing import List, Optional

from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from ..models.recipe_group import RecipeGroup


# -- RecipeGroup Repository ----------------------------------------------------------------------
class RecipeGroupRepo:
    """Repository for recipe group operations."""

    def __init__(self, session: Session):
        """Initialize the RecipeGroup Repository with a database session."""
        self.session = session

    # -- Create Operations -----------------------------------------------------------------------
    def create(self, name: str, user_id: int) -> RecipeGroup:
        """
        Create and persist a new RecipeGroup to the database.

        Args:
            name: Name of the group
            user_id: ID of the user who owns this group

        Returns:
            Saved RecipeGroup with assigned ID
        """
        group = RecipeGroup(name=name, user_id=user_id)
        self.session.add(group)
        self.session.flush()
        self.session.refresh(group)
        return group

    # -- Read Operations -------------------------------------------------------------------------
    def get_by_id(self, group_id: int, user_id: int) -> Optional[RecipeGroup]:
        """
        Get a recipe group by ID.

        Args:
            group_id: ID of the group to load
            user_id: ID of the user who owns the group

        Returns:
            RecipeGroup if found and owned by user, None otherwise
        """
        stmt = (
            select(RecipeGroup)
            .where(RecipeGroup.id == group_id)
            .where(RecipeGroup.user_id == user_id)
        )
        result = self.session.execute(stmt)
        return result.scalar_one_or_none()

    def get_all(self, user_id: int) -> List[RecipeGroup]:
        """
        Get all recipe groups for a specific user.

        Args:
            user_id: ID of the user whose groups to retrieve

        Returns:
            List of all groups belonging to the user
        """
        stmt = (
            select(RecipeGroup)
            .where(RecipeGroup.user_id == user_id)
            .order_by(RecipeGroup.name)
        )
        result = self.session.execute(stmt)
        return list(result.scalars().all())

    def get_by_name(self, name: str, user_id: int) -> Optional[RecipeGroup]:
        """
        Get a recipe group by exact name (case-insensitive) for a specific user.

        Args:
            name: Name of the group
            user_id: ID of the user whose groups to search

        Returns:
            RecipeGroup if found, None otherwise
        """
        stmt = (
            select(RecipeGroup)
            .where(RecipeGroup.user_id == user_id)
            .where(func.lower(RecipeGroup.name) == name.lower())
        )
        result = self.session.execute(stmt)
        return result.scalar_one_or_none()

    def get_with_recipe_count(self, user_id: int) -> List[tuple[RecipeGroup, int]]:
        """
        Get all recipe groups with their recipe counts for a specific user.

        Args:
            user_id: ID of the user whose groups to retrieve

        Returns:
            List of tuples (RecipeGroup, recipe_count)
        """
        groups = self.get_all(user_id)
        result = []
        for group in groups:
            recipe_count = len(group.recipes)
            result.append((group, recipe_count))
        return result

    # -- Update Operations -----------------------------------------------------------------------
    def update(self, group_id: int, name: str, user_id: int) -> Optional[RecipeGroup]:
        """
        Update an existing RecipeGroup name.

        Args:
            group_id: ID of the group to update
            name: New name for the group
            user_id: ID of the user who owns the group

        Returns:
            Updated RecipeGroup if found, None otherwise
        """
        group = self.get_by_id(group_id, user_id)
        if not group:
            return None

        group.name = name
        self.session.flush()
        return group

    # -- Delete Operations -----------------------------------------------------------------------
    def delete(self, group_id: int, user_id: int) -> bool:
        """
        Delete a recipe group by ID if it belongs to the user.

        Args:
            group_id: ID of the group to delete
            user_id: ID of the user who owns the group

        Returns:
            True if deleted, False if not found or not owned
        """
        group = self.get_by_id(group_id, user_id)
        if group:
            self.session.delete(group)
            self.session.flush()
            return True
        return False

    # -- Recipe Assignment Operations ------------------------------------------------------------
    def add_recipe_to_group(self, group_id: int, recipe_id: int, user_id: int) -> bool:
        """
        Add a recipe to a group.

        Args:
            group_id: ID of the group
            recipe_id: ID of the recipe to add
            user_id: ID of the user who owns both

        Returns:
            True if added, False if group not found or recipe already in group
        """
        stmt = (
            select(RecipeGroup)
            .where(RecipeGroup.id == group_id)
            .where(RecipeGroup.user_id == user_id)
            .options(joinedload(RecipeGroup.recipes))
        )
        result = self.session.execute(stmt)
        group = result.unique().scalar_one_or_none()

        if not group:
            return False

        # Check if recipe is already in the group
        if any(r.id == recipe_id for r in group.recipes):
            return False

        # Import Recipe here to avoid circular import
        from ..models.recipe import Recipe

        stmt = select(Recipe).where(Recipe.id == recipe_id).where(Recipe.user_id == user_id)
        result = self.session.execute(stmt)
        recipe = result.scalar_one_or_none()

        if not recipe:
            return False

        group.recipes.append(recipe)
        self.session.flush()
        return True

    def remove_recipe_from_group(self, group_id: int, recipe_id: int, user_id: int) -> bool:
        """
        Remove a recipe from a group.

        Args:
            group_id: ID of the group
            recipe_id: ID of the recipe to remove
            user_id: ID of the user who owns both

        Returns:
            True if removed, False if group not found or recipe not in group
        """
        stmt = (
            select(RecipeGroup)
            .where(RecipeGroup.id == group_id)
            .where(RecipeGroup.user_id == user_id)
            .options(joinedload(RecipeGroup.recipes))
        )
        result = self.session.execute(stmt)
        group = result.unique().scalar_one_or_none()

        if not group:
            return False

        # Find and remove the recipe
        recipe_to_remove = None
        for recipe in group.recipes:
            if recipe.id == recipe_id:
                recipe_to_remove = recipe
                break

        if not recipe_to_remove:
            return False

        group.recipes.remove(recipe_to_remove)
        self.session.flush()
        return True

    def get_groups_for_recipe(self, recipe_id: int, user_id: int) -> List[RecipeGroup]:
        """
        Get all groups that contain a specific recipe.

        Args:
            recipe_id: ID of the recipe
            user_id: ID of the user who owns the groups

        Returns:
            List of groups containing this recipe
        """
        # Import Recipe here to avoid circular import
        from ..models.recipe import Recipe

        stmt = (
            select(Recipe)
            .where(Recipe.id == recipe_id)
            .where(Recipe.user_id == user_id)
            .options(joinedload(Recipe.groups))
        )
        result = self.session.execute(stmt)
        recipe = result.unique().scalar_one_or_none()

        if not recipe:
            return []

        return list(recipe.groups)

    # -- Utility Methods -------------------------------------------------------------------------
    def count(self, user_id: int) -> int:
        """
        Count total number of recipe groups for a specific user.

        Args:
            user_id: ID of the user whose groups to count

        Returns:
            Total count of groups belonging to the user
        """
        stmt = (
            select(func.count())
            .select_from(RecipeGroup)
            .where(RecipeGroup.user_id == user_id)
        )
        return self.session.execute(stmt).scalar() or 0
