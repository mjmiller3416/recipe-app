"""app/services/shopping/service.py

Core shopping service with initialization, list retrieval, and helper methods.
"""

# -- Imports -------------------------------------------------------------------------------------
from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional

from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

from ...dtos.shopping_dtos import (
    RecipeSourceDTO,
    ShoppingItemResponseDTO,
    ShoppingListFilterDTO,
    ShoppingListResponseDTO,
)
from ...models.shopping_item import ShoppingItem
from ...repositories.meal_repo import MealRepo
from ...repositories.planner import PlannerRepo
from ...repositories.shopping import ShoppingRepo


# -- Core Service --------------------------------------------------------------------------------
class ShoppingServiceCore:
    """Core shopping service with initialization and list retrieval."""

    def __init__(self, session: Session, user_id: int):
        """
        Initialize the ShoppingService with a database session and user ID.

        Args:
            session: SQLAlchemy database session (required).
            user_id: ID of the authenticated user (required for multi-tenant isolation).
        """
        self.session = session
        self.user_id = user_id
        self.shopping_repo = ShoppingRepo(self.session, user_id)
        self.meal_repo = MealRepo(self.session)
        self.planner_repo = PlannerRepo(self.session)

    # -- Shopping List Retrieval -----------------------------------------------------------------
    def get_shopping_list(
        self, filters: Optional[ShoppingListFilterDTO] = None
    ) -> ShoppingListResponseDTO:
        """
        Get the current shopping list with optional filters.
        This is now a pure read operation - no auto-generation.

        Args:
            filters (Optional[ShoppingListFilterDTO]): Filter criteria.

        Returns:
            ShoppingListResponseDTO: Complete shopping list with metadata.
        """
        try:
            # apply filters if provided
            if filters:
                items = self.shopping_repo.search_shopping_items(
                    user_id=self.user_id,
                    search_term=filters.search_term,
                    source=filters.source,
                    category=filters.category,
                    have=filters.have,
                    limit=filters.limit,
                    offset=filters.offset,
                )
            else:
                items = self.shopping_repo.get_all_shopping_items(self.user_id)

            # convert to response DTOs with recipe sources from contributions
            item_dtos = []
            for item in items:
                recipe_sources = self._get_recipe_sources_for_item(item)
                item_dtos.append(self._item_to_response_dto(item, recipe_sources))

            # get summary statistics
            summary = self.shopping_repo.get_shopping_list_summary(self.user_id)

            return ShoppingListResponseDTO(
                items=item_dtos,
                total_items=summary["total_items"],
                checked_items=summary["checked_items"],
                recipe_items=summary["recipe_items"],
                manual_items=summary["manual_items"],
                categories=summary["categories"],
            )

        except SQLAlchemyError:
            return ShoppingListResponseDTO(
                items=[],
                total_items=0,
                checked_items=0,
                recipe_items=0,
                manual_items=0,
                categories=[],
            )

    def _get_recipe_sources_for_item(
        self, item: ShoppingItem
    ) -> List[RecipeSourceDTO]:
        """Get recipe sources with counts for a shopping item from its contributions."""
        if item.source != "recipe":
            return []

        # Try to get from eagerly loaded contributions
        if item.contributions:
            from collections import Counter

            from sqlalchemy import select

            from ...models.recipe import Recipe

            # Count how many times each recipe_id appears in contributions
            recipe_id_counts = Counter(c.recipe_id for c in item.contributions)

            if recipe_id_counts:
                # Fetch recipe names for the IDs
                recipe_ids = list(recipe_id_counts.keys())
                stmt = select(Recipe.id, Recipe.recipe_name).where(
                    Recipe.id.in_(recipe_ids)
                )
                result = self.session.execute(stmt)
                id_to_name = {row[0]: row[1] for row in result}

                # Build RecipeSourceDTO list with counts, sorted by name
                sources = [
                    RecipeSourceDTO(recipe_name=id_to_name[rid], count=count)
                    for rid, count in recipe_id_counts.items()
                    if rid in id_to_name
                ]
                return sorted(sources, key=lambda s: s.recipe_name)

        # Fallback to repo method (returns List[str], convert to DTOs with count=1)
        names = self.shopping_repo.get_recipe_names_for_item(item.id)
        return [RecipeSourceDTO(recipe_name=name, count=1) for name in names]

    # -- Helper Methods --------------------------------------------------------------------------
    def _item_to_response_dto(
        self,
        item: ShoppingItem,
        recipe_sources: Optional[List[RecipeSourceDTO]] = None,
    ) -> ShoppingItemResponseDTO:
        """Convert a ShoppingItem model to a response DTO."""
        return ShoppingItemResponseDTO(
            id=item.id,
            ingredient_name=item.ingredient_name,
            quantity=item.quantity,
            unit=item.unit,
            category=item.category,
            source=item.source,
            have=item.have,
            flagged=item.flagged,
            state_key=item.aggregation_key,  # Use aggregation_key as state_key for API compatibility
            recipe_sources=recipe_sources or [],
        )

    # -- Shopping List Management ----------------------------------------------------------------
    def clear_shopping_list(self) -> Dict[str, Any]:
        """
        Clear the entire shopping list for the current user.

        Returns:
            Dict with success, updated_count, message, and optional errors.
        """
        from ...dtos.shopping_dtos import BulkOperationResultDTO

        try:
            deleted_count = self.shopping_repo.clear_shopping_items(self.user_id)
            self.session.commit()
            return BulkOperationResultDTO(
                success=True,
                updated_count=deleted_count,
                message=f"Cleared {deleted_count} items from shopping list",
            ).model_dump()

        except SQLAlchemyError as e:
            self.session.rollback()
            return BulkOperationResultDTO(
                success=False,
                updated_count=0,
                message="Failed to clear shopping list",
                errors=[str(e)],
            ).model_dump()

    def get_shopping_summary(self) -> Any:
        """
        Get shopping list summary with attribute access and renamed fields for the current user.

        Returns:
            An object with attributes total_items, completed_items, manual_items, recipe_items.
        """
        # Retrieve raw summary data as dict
        summary_data = self.get_shopping_list_summary()

        # Build simple object for attribute access
        class _Summary:
            pass

        summary = _Summary()
        summary.total_items = summary_data.get("total_items", 0)
        # map 'checked_items' to 'completed_items'
        summary.completed_items = summary_data.get("checked_items", 0)
        summary.manual_items = summary_data.get("manual_items", 0)
        summary.recipe_items = summary_data.get("recipe_items", 0)
        return summary

    def search_items(self, search_term: str) -> list:
        """
        Search shopping items by ingredient name for the current user.

        Args:
            search_term (str): Substring to search within ingredient names.

        Returns:
            List of ShoppingItemResponseDTO or model instances matching the term.
        """
        # Perform search via repository
        items = self.shopping_repo.search_shopping_items(
            self.user_id, search_term=search_term
        )
        # Convert to response DTOs
        return [self._item_to_response_dto(item) for item in items]

    def get_shopping_list_summary(self) -> Dict[str, Any]:
        """
        Get summary statistics for the shopping list for the current user.

        Returns:
            Dict[str, Any]: Summary with counts and completion percentage.
        """
        try:
            return self.shopping_repo.get_shopping_list_summary(self.user_id)
        except SQLAlchemyError:
            return {
                "total_items": 0,
                "checked_items": 0,
                "recipe_items": 0,
                "manual_items": 0,
                "categories": [],
                "completion_percentage": 0,
            }
