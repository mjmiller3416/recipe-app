"""app/services/recipe_group_service.py

Service layer for managing recipe group CRUD operations.
Orchestrates repository operations and business logic for recipe groups.
"""

# -- Imports -------------------------------------------------------------------------------------
from __future__ import annotations

from typing import List

from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from ..dtos.recipe_group_dtos import (
    RecipeGroupAssignmentDTO,
    RecipeGroupCreateDTO,
    RecipeGroupResponseDTO,
    RecipeGroupUpdateDTO,
)
from ..repositories.recipe_group_repo import RecipeGroupRepo


# -- Exceptions ----------------------------------------------------------------------------------
class RecipeGroupNotFoundError(Exception):
    """Raised when a recipe group is not found."""
    pass


class DuplicateRecipeGroupError(Exception):
    """Raised when attempting to create a group with a duplicate name."""
    pass


class RecipeGroupSaveError(Exception):
    """Raised when a recipe group cannot be saved."""
    pass


# -- RecipeGroup Service -------------------------------------------------------------------------
class RecipeGroupService:
    """Service for recipe group operations with business logic."""

    def __init__(self, session: Session, user_id: int):
        """
        Initialize the RecipeGroupService with a database session and user ID.

        Args:
            session: SQLAlchemy database session (required).
            user_id: ID of the authenticated user (required for multi-tenant isolation).
        """
        self.session = session
        self.user_id = user_id
        self.repo = RecipeGroupRepo(self.session)

    # -- Create Operations -----------------------------------------------------------------------
    def create_group(self, create_dto: RecipeGroupCreateDTO) -> RecipeGroupResponseDTO:
        """
        Create a new recipe group for the current user.

        Args:
            create_dto: Data for creating the group

        Returns:
            Created group as DTO

        Raises:
            DuplicateRecipeGroupError: If a group with this name already exists
            RecipeGroupSaveError: If the group cannot be saved
        """
        try:
            # Check for duplicate name (case-insensitive)
            existing = self.repo.get_by_name(create_dto.name, self.user_id)
            if existing:
                raise DuplicateRecipeGroupError(
                    f"A group with the name '{create_dto.name}' already exists"
                )

            # Create the group
            group = self.repo.create(create_dto.name, self.user_id)
            self.session.commit()

            return RecipeGroupResponseDTO.from_model(group, recipe_count=0)

        except (DuplicateRecipeGroupError, ValueError) as e:
            self.session.rollback()
            raise
        except SQLAlchemyError as e:
            self.session.rollback()
            raise RecipeGroupSaveError(f"Failed to create recipe group: {str(e)}")

    # -- Read Operations -------------------------------------------------------------------------
    def get_all_groups(self) -> List[RecipeGroupResponseDTO]:
        """
        Get all recipe groups for the current user with recipe counts.

        Returns:
            List of all groups belonging to the user
        """
        groups_with_counts = self.repo.get_with_recipe_count(self.user_id)
        return [
            RecipeGroupResponseDTO.from_model(group, recipe_count=count)
            for group, count in groups_with_counts
        ]

    def get_group_by_id(self, group_id: int) -> RecipeGroupResponseDTO:
        """
        Get a recipe group by ID.

        Args:
            group_id: ID of the group to retrieve

        Returns:
            Group as DTO

        Raises:
            RecipeGroupNotFoundError: If group not found or not owned by user
        """
        group = self.repo.get_by_id(group_id, self.user_id)
        if not group:
            raise RecipeGroupNotFoundError(f"Recipe group {group_id} not found")

        recipe_count = len(group.recipes)
        return RecipeGroupResponseDTO.from_model(group, recipe_count=recipe_count)

    def get_groups_for_recipe(self, recipe_id: int) -> List[RecipeGroupResponseDTO]:
        """
        Get all groups that contain a specific recipe.

        Args:
            recipe_id: ID of the recipe

        Returns:
            List of groups containing this recipe
        """
        groups = self.repo.get_groups_for_recipe(recipe_id, self.user_id)
        return [
            RecipeGroupResponseDTO.from_model(group, recipe_count=len(group.recipes))
            for group in groups
        ]

    # -- Update Operations -----------------------------------------------------------------------
    def update_group(self, group_id: int, update_dto: RecipeGroupUpdateDTO) -> RecipeGroupResponseDTO:
        """
        Update a recipe group's name.

        Args:
            group_id: ID of the group to update
            update_dto: Data for updating the group

        Returns:
            Updated group as DTO

        Raises:
            RecipeGroupNotFoundError: If group not found or not owned by user
            DuplicateRecipeGroupError: If new name conflicts with existing group
            RecipeGroupSaveError: If the group cannot be updated
        """
        try:
            # Check if group exists
            group = self.repo.get_by_id(group_id, self.user_id)
            if not group:
                raise RecipeGroupNotFoundError(f"Recipe group {group_id} not found")

            # Check for duplicate name (case-insensitive), excluding current group
            existing = self.repo.get_by_name(update_dto.name, self.user_id)
            if existing and existing.id != group_id:
                raise DuplicateRecipeGroupError(
                    f"A group with the name '{update_dto.name}' already exists"
                )

            # Update the group
            updated_group = self.repo.update(group_id, update_dto.name, self.user_id)
            self.session.commit()

            if not updated_group:
                raise RecipeGroupNotFoundError(f"Recipe group {group_id} not found")

            recipe_count = len(updated_group.recipes)
            return RecipeGroupResponseDTO.from_model(updated_group, recipe_count=recipe_count)

        except (RecipeGroupNotFoundError, DuplicateRecipeGroupError, ValueError) as e:
            self.session.rollback()
            raise
        except SQLAlchemyError as e:
            self.session.rollback()
            raise RecipeGroupSaveError(f"Failed to update recipe group: {str(e)}")

    # -- Delete Operations -----------------------------------------------------------------------
    def delete_group(self, group_id: int) -> None:
        """
        Delete a recipe group.

        Args:
            group_id: ID of the group to delete

        Raises:
            RecipeGroupNotFoundError: If group not found or not owned by user
        """
        try:
            deleted = self.repo.delete(group_id, self.user_id)
            if not deleted:
                raise RecipeGroupNotFoundError(f"Recipe group {group_id} not found")

            self.session.commit()

        except RecipeGroupNotFoundError as e:
            self.session.rollback()
            raise
        except SQLAlchemyError as e:
            self.session.rollback()
            raise RecipeGroupSaveError(f"Failed to delete recipe group: {str(e)}")

    # -- Recipe Assignment Operations ------------------------------------------------------------
    def assign_recipe_to_groups(self, recipe_id: int, assignment_dto: RecipeGroupAssignmentDTO) -> List[RecipeGroupResponseDTO]:
        """
        Assign a recipe to the specified groups (replaces existing assignments).

        Args:
            recipe_id: ID of the recipe
            assignment_dto: Group IDs to assign

        Returns:
            List of groups the recipe is now assigned to

        Raises:
            RecipeGroupSaveError: If assignment fails
        """
        try:
            # Get current groups for the recipe
            current_groups = self.repo.get_groups_for_recipe(recipe_id, self.user_id)
            current_group_ids = {g.id for g in current_groups}
            new_group_ids = set(assignment_dto.group_ids)

            # Remove recipe from groups no longer in the list
            for group_id in current_group_ids - new_group_ids:
                self.repo.remove_recipe_from_group(group_id, recipe_id, self.user_id)

            # Add recipe to new groups
            for group_id in new_group_ids - current_group_ids:
                self.repo.add_recipe_to_group(group_id, recipe_id, self.user_id)

            self.session.commit()

            # Return updated group list
            return self.get_groups_for_recipe(recipe_id)

        except SQLAlchemyError as e:
            self.session.rollback()
            raise RecipeGroupSaveError(f"Failed to assign recipe to groups: {str(e)}")

    def add_recipe_to_group(self, group_id: int, recipe_id: int) -> RecipeGroupResponseDTO:
        """
        Add a recipe to a group.

        Args:
            group_id: ID of the group
            recipe_id: ID of the recipe

        Returns:
            Updated group as DTO

        Raises:
            RecipeGroupNotFoundError: If group not found or not owned by user
            RecipeGroupSaveError: If assignment fails
        """
        try:
            added = self.repo.add_recipe_to_group(group_id, recipe_id, self.user_id)
            if not added:
                # Group not found or recipe already in group
                group = self.repo.get_by_id(group_id, self.user_id)
                if not group:
                    raise RecipeGroupNotFoundError(f"Recipe group {group_id} not found")
                # Recipe already in group - just return current state
                self.session.commit()
                return RecipeGroupResponseDTO.from_model(group, recipe_count=len(group.recipes))

            self.session.commit()
            return self.get_group_by_id(group_id)

        except RecipeGroupNotFoundError as e:
            self.session.rollback()
            raise
        except SQLAlchemyError as e:
            self.session.rollback()
            raise RecipeGroupSaveError(f"Failed to add recipe to group: {str(e)}")

    def remove_recipe_from_group(self, group_id: int, recipe_id: int) -> RecipeGroupResponseDTO:
        """
        Remove a recipe from a group.

        Args:
            group_id: ID of the group
            recipe_id: ID of the recipe

        Returns:
            Updated group as DTO

        Raises:
            RecipeGroupNotFoundError: If group not found or not owned by user
            RecipeGroupSaveError: If removal fails
        """
        try:
            removed = self.repo.remove_recipe_from_group(group_id, recipe_id, self.user_id)
            if not removed:
                # Group not found or recipe not in group
                group = self.repo.get_by_id(group_id, self.user_id)
                if not group:
                    raise RecipeGroupNotFoundError(f"Recipe group {group_id} not found")
                # Recipe not in group - just return current state
                self.session.commit()
                return RecipeGroupResponseDTO.from_model(group, recipe_count=len(group.recipes))

            self.session.commit()
            return self.get_group_by_id(group_id)

        except RecipeGroupNotFoundError as e:
            self.session.rollback()
            raise
        except SQLAlchemyError as e:
            self.session.rollback()
            raise RecipeGroupSaveError(f"Failed to remove recipe from group: {str(e)}")
