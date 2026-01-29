"""app/core/services/shopping_service.py

Service layer for shopping list operations and business logic.
Uses diff-based sync to keep shopping items in sync with planner state.
"""

# ── Imports ─────────────────────────────────────────────────────────────────────────────────────────────────
from __future__ import annotations

import logging
from collections import defaultdict
from typing import Any, Dict, List, Optional

from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

from ..dtos.shopping_dtos import (
    BulkOperationResultDTO,
    BulkStateUpdateDTO,
    ManualItemCreateDTO,
    RecipeSourceDTO,
    ShoppingItemResponseDTO,
    ShoppingItemUpdateDTO,
    ShoppingListFilterDTO,
    ShoppingListGenerationDTO,
    ShoppingListGenerationResultDTO,
    ShoppingListResponseDTO,
)
from ..models.shopping_item import ShoppingItem
from ..repositories.meal_repo import MealRepo
from ..repositories.planner_repo import PlannerRepo
from ..repositories.shopping_repo import ShoppingRepo
from ..services.unit_conversion_service import UnitConversionService
from ..utils.unit_conversion import get_dimension, to_base_unit, to_display_unit


# ── Shopping Service ────────────────────────────────────────────────────────────────────────────────────────
class ShoppingService:
    """Service for shopping list operations with diff-based sync."""

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

    # ── Core Sync Method ────────────────────────────────────────────────────────────────────────────────────
    def sync_shopping_list(self) -> Dict[str, int]:
        """
        Synchronize shopping list with current planner state using diff-based algorithm.

        This is the core method that should be called after ANY planner mutation.
        It compares desired state (from active planner entries) with current state
        and applies minimal updates.

        Returns:
            Dict with counts: items_created, items_updated, items_deleted, contributions_synced
        """
        try:
            # 1. Get active planner entries (not completed, not cleared, shopping_mode != 'none')
            active_entries = self.planner_repo.get_shopping_entries(self.user_id)

            # 2. Calculate desired contributions from all active entries
            # Structure: {aggregation_key: {(entry_id, recipe_id): {base_qty, dimension, category, name}}}
            desired_contributions: Dict[str, Dict[tuple, Dict[str, Any]]] = defaultdict(dict)

            conversion_service = UnitConversionService(self.session, self.user_id)

            for entry in active_entries:
                if not entry.meal:
                    continue

                recipe_ids = entry.meal.get_all_recipe_ids()
                category_filter = "produce" if entry.shopping_mode == "produce_only" else None

                # Get contributions for this entry
                entry_contributions = self.shopping_repo.aggregate_ingredients_for_entry(
                    recipe_ids, entry.id, category_filter
                )

                # Merge into desired state
                for agg_key, contrib_list in entry_contributions.items():
                    for contrib in contrib_list:
                        key = (entry.id, contrib.recipe_id)
                        if key not in desired_contributions[agg_key]:
                            desired_contributions[agg_key][key] = {
                                "base_quantity": 0.0,
                                "dimension": contrib.dimension,
                                "planner_entry_id": entry.id,
                                "recipe_id": contrib.recipe_id,
                                "original_unit": contrib.original_unit,
                            }
                        desired_contributions[agg_key][key]["base_quantity"] += contrib.base_quantity
                        # Keep track of original_unit (prefer non-None)
                        if contrib.original_unit and not desired_contributions[agg_key][key].get("original_unit"):
                            desired_contributions[agg_key][key]["original_unit"] = contrib.original_unit

            # 3. Get current recipe items from database
            current_items = self.shopping_repo.get_items_by_aggregation_keys(
                list(desired_contributions.keys())
            )

            # Also get any recipe items that might be orphaned (not in desired state)
            all_recipe_items = {
                item.aggregation_key: item
                for item in self.shopping_repo.get_all_shopping_items(source="recipe")
                if item.aggregation_key
            }

            stats = {
                "items_created": 0,
                "items_updated": 0,
                "items_deleted": 0,
                "contributions_synced": 0,
            }

            # 4. Process each desired aggregation key
            for agg_key, contributions in desired_contributions.items():
                # Calculate total base quantity
                total_base_qty = sum(c["base_quantity"] for c in contributions.values())

                # Get sample contribution for metadata
                sample_contrib = next(iter(contributions.values()))
                dimension = sample_contrib["dimension"]

                # Find the first non-None original_unit from all contributions
                original_unit = None
                for contrib_data in contributions.values():
                    if contrib_data.get("original_unit"):
                        original_unit = contrib_data["original_unit"]
                        break

                # Get ingredient info from the aggregation key
                parts = agg_key.split("::")
                ingredient_name = parts[0] if parts else "Unknown"

                # Look up category from first recipe ingredient
                category = self._get_ingredient_category(ingredient_name)

                # Calculate display quantity (pass original_unit for unit preservation)
                display_qty, display_unit = to_display_unit(
                    total_base_qty, dimension, original_unit
                )

                # Apply ingredient-specific conversion rules
                display_qty, display_unit = conversion_service.apply_conversion(
                    ingredient_name, display_qty, display_unit
                )

                if agg_key in current_items:
                    # Update existing item
                    item = current_items[agg_key]
                    old_qty = item.quantity

                    # Update quantity and unit
                    item.quantity = display_qty
                    item.unit = display_unit

                    # If quantity INCREASED, uncheck (user needs to collect more)
                    if display_qty > old_qty + 0.01:
                        item.have = False

                    # Sync contributions
                    self._sync_item_contributions(item, contributions)
                    stats["items_updated"] += 1
                else:
                    # Create new item
                    item = ShoppingItem.create_from_recipe(
                        ingredient_name=ingredient_name.capitalize(),
                        quantity=display_qty,
                        unit=display_unit,
                        category=category,
                        aggregation_key=agg_key.lower().strip()
                    )
                    self.shopping_repo.create_shopping_item(item)

                    # Create contributions
                    self._sync_item_contributions(item, contributions)
                    stats["items_created"] += 1

                stats["contributions_synced"] += len(contributions)

                # Remove from all_recipe_items so we know it's not orphaned
                if agg_key in all_recipe_items:
                    del all_recipe_items[agg_key]

            # 5. Delete orphaned items (items no longer in desired state)
            for agg_key, item in all_recipe_items.items():
                if agg_key not in desired_contributions:
                    self.shopping_repo.delete_item(item.id)
                    stats["items_deleted"] += 1

            logger.debug(f"Sync complete - stats: {stats}")
            self.session.commit()
            return stats

        except SQLAlchemyError as e:
            logger.error(f"Shopping sync SQLAlchemyError: {type(e).__name__}: {e}")
            logger.error(f"Error details: {e.args}")
            self.session.rollback()
            raise RuntimeError(f"Failed to sync shopping list: {e}") from e

    def _sync_item_contributions(
        self,
        item: ShoppingItem,
        desired_contributions: Dict[tuple, Dict[str, Any]]
    ) -> None:
        """
        Sync contributions for a single shopping item.

        Args:
            item: The shopping item to sync contributions for
            desired_contributions: Dict of (entry_id, recipe_id) -> contribution data
        """
        # Delete all existing contributions for this item
        self.shopping_repo.delete_contributions_for_item(item.id)

        # Create new contributions
        for (entry_id, recipe_id), data in desired_contributions.items():
            self.shopping_repo.add_contribution(
                shopping_item_id=item.id,
                recipe_id=recipe_id,
                planner_entry_id=entry_id,
                base_quantity=data["base_quantity"],
                dimension=data["dimension"]
            )

    def _get_ingredient_category(self, ingredient_name: str) -> Optional[str]:
        """
        Look up the category for an ingredient by name.

        Args:
            ingredient_name: Name of the ingredient

        Returns:
            Category string or None
        """
        from ..models.ingredient import Ingredient
        from sqlalchemy import select

        stmt = select(Ingredient.ingredient_category).where(
            Ingredient.ingredient_name.ilike(ingredient_name)
        ).limit(1)
        result = self.session.execute(stmt)
        row = result.first()
        return row[0] if row else None

    # ── Shopping List Retrieval ─────────────────────────────────────────────────────────────────────────────
    def get_shopping_list(
            self,
            filters: Optional[ShoppingListFilterDTO] = None
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
                    offset=filters.offset
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
                categories=summary["categories"]
            )

        except SQLAlchemyError:
            return ShoppingListResponseDTO(
                items=[],
                total_items=0,
                checked_items=0,
                recipe_items=0,
                manual_items=0,
                categories=[]
            )

    def _get_recipe_sources_for_item(self, item: ShoppingItem) -> List[RecipeSourceDTO]:
        """Get recipe sources with counts for a shopping item from its contributions."""
        if item.source != "recipe":
            return []

        # Try to get from eagerly loaded contributions
        if item.contributions:
            from collections import Counter

            from sqlalchemy import select

            from ..models.recipe import Recipe

            # Count how many times each recipe_id appears in contributions
            recipe_id_counts = Counter(c.recipe_id for c in item.contributions)

            if recipe_id_counts:
                # Fetch recipe names for the IDs
                recipe_ids = list(recipe_id_counts.keys())
                stmt = select(Recipe.id, Recipe.recipe_name).where(Recipe.id.in_(recipe_ids))
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

    # ── Manual Item Management ──────────────────────────────────────────────────────────────────────────────
    def add_manual_item(
            self,
            create_dto: ManualItemCreateDTO
        ) -> Optional[ShoppingItemResponseDTO]:
        """
        Add a manual item to the shopping list for the current user.

        Args:
            create_dto (ManualItemCreateDTO): Manual item data.

        Returns:
            Optional[ShoppingItemResponseDTO]: Created item or None if failed.
        """
        try:
            manual_item = ShoppingItem.create_manual(
                ingredient_name=create_dto.ingredient_name,
                quantity=create_dto.quantity,
                unit=create_dto.unit,
                category=create_dto.category
            )

            created_item = self.shopping_repo.create_shopping_item(manual_item, self.user_id)
            self.session.commit()
            return self._item_to_response_dto(created_item)

        except SQLAlchemyError:
            self.session.rollback()
            return None

    def update_item(self, item_id: int, update_dto: ShoppingItemUpdateDTO
        ) -> Optional[ShoppingItemResponseDTO]:
        """
        Update a shopping item for the current user.

        Args:
            item_id (int): ID of the item to update.
            update_dto (ShoppingItemUpdateDTO): Update data.

        Returns:
            Optional[ShoppingItemResponseDTO]: Updated item or None if failed/not owned.
        """
        try:
            item = self.shopping_repo.get_shopping_item_by_id(item_id, self.user_id)
            if not item:
                return None

            # update fields from DTO
            if update_dto.ingredient_name is not None:
                item.ingredient_name = update_dto.ingredient_name
            if update_dto.quantity is not None:
                item.quantity = update_dto.quantity
            if update_dto.unit is not None:
                item.unit = update_dto.unit
            if update_dto.category is not None:
                item.category = update_dto.category
            if update_dto.have is not None:
                item.have = update_dto.have

            updated_item = self.shopping_repo.update_item(item)
            self.session.commit()
            return self._item_to_response_dto(updated_item)

        except SQLAlchemyError:
            self.session.rollback()
            return None

    def delete_item(self, item_id: int) -> bool:
        """
        Delete a shopping item for the current user.

        Args:
            item_id (int): ID of the item to delete.

        Returns:
            bool: True if deleted successfully.
        """
        try:
            result = self.shopping_repo.delete_item(item_id, self.user_id)
            self.session.commit()
            return result
        except SQLAlchemyError:
            self.session.rollback()
            return False

    def clear_manual_items(self) -> BulkOperationResultDTO:
        """
        Clear all manual items from the shopping list for the current user.

        Returns:
            BulkOperationResultDTO: Operation result.
        """
        try:
            deleted_count = self.shopping_repo.clear_shopping_items(self.user_id, source="manual")
            self.session.commit()
            return BulkOperationResultDTO(
                success=True,
                updated_count=deleted_count,
                message=f"Cleared {deleted_count} manual items"
            )

        except SQLAlchemyError as e:
            self.session.rollback()
            return BulkOperationResultDTO(
                success=False,
                updated_count=0,
                message="Failed to clear manual items",
                errors=[str(e)]
            )

    def clear_recipe_items(self) -> BulkOperationResultDTO:
        """
        Clear all recipe-generated items from the shopping list for the current user.

        Returns:
            BulkOperationResultDTO: Operation result.
        """
        try:
            deleted_count = self.shopping_repo.clear_shopping_items(self.user_id, source="recipe")
            self.session.commit()
            return BulkOperationResultDTO(
                success=True,
                updated_count=deleted_count,
                message=f"Cleared {deleted_count} recipe items"
            )

        except SQLAlchemyError as e:
            self.session.rollback()
            return BulkOperationResultDTO(
                success=False,
                updated_count=0,
                message="Failed to clear recipe items",
                errors=[str(e)]
            )

    # ── Item Status Management ──────────────────────────────────────────────────────────────────────────────
    def toggle_item_status(self, item_id: int) -> Optional[bool]:
        """
        Toggle the 'have' status of a shopping item for the current user.

        Args:
            item_id (int): ID of the item to toggle.

        Returns:
            Optional[bool]: True if successful, None/False if failed.
        """
        try:
            item = self.shopping_repo.get_shopping_item_by_id(item_id, self.user_id)
            if not item:
                return False

            item.have = not item.have
            self.shopping_repo.update_item(item)
            self.session.commit()
            return True

        except SQLAlchemyError:
            self.session.rollback()
            return False

    def toggle_item_flagged(self, item_id: int) -> Optional[bool]:
        """
        Toggle the 'flagged' status of a shopping item for the current user.

        Args:
            item_id (int): ID of the item to toggle.

        Returns:
            Optional[bool]: New flagged status or None if item not found/not owned.
        """
        try:
            item = self.shopping_repo.get_shopping_item_by_id(item_id, self.user_id)
            if not item:
                return None

            item.flagged = not item.flagged
            self.shopping_repo.update_item(item)
            self.session.commit()
            return item.flagged

        except SQLAlchemyError:
            self.session.rollback()
            return None

    def clear_completed_items(self) -> int:
        """
        Clear all completed (have=True) shopping items for the current user and return count deleted.
        """
        from sqlalchemy import delete
        from app.models.shopping_item import ShoppingItem

        try:
            stmt = (
                delete(ShoppingItem)
                .where(ShoppingItem.user_id == self.user_id)
                .where(ShoppingItem.have.is_(True))
            )
            result = self.session.execute(stmt)
            self.session.commit()
            return result.rowcount
        except SQLAlchemyError:
            self.session.rollback()
            return 0

    def bulk_update_status(self, update_dto: BulkStateUpdateDTO) -> BulkOperationResultDTO:
        """
        Bulk update 'have' status for multiple shopping items for the current user.

        Args:
            update_dto (BulkStateUpdateDTO): DTO containing item_updates mapping.

        Returns:
            BulkOperationResultDTO: Operation result with count of updated items.
        """
        try:
            updated_count = 0
            for item_id, have in update_dto.item_updates.items():
                item = self.shopping_repo.get_shopping_item_by_id(item_id, self.user_id)
                if not item:
                    continue
                item.have = have
                self.shopping_repo.update_item(item)
                updated_count += 1

            self.session.commit()
            return BulkOperationResultDTO(
                success=True,
                updated_count=updated_count,
                message=f"Updated {updated_count} items"
            )
        except SQLAlchemyError as e:
            self.session.rollback()
            return BulkOperationResultDTO(
                success=False,
                updated_count=0,
                message="Failed to bulk update items",
                errors=[str(e)]
            )

    # ── Analysis and Breakdown ──────────────────────────────────────────────────────────────────────────────
    def get_ingredient_breakdown(self, recipe_ids: List[int]) -> Any:
        """
        Get detailed breakdown of ingredients by recipe.

        Args:
            recipe_ids (List[int]): List of recipe IDs.

        Returns:
            An object with attribute 'items', a list of breakdown items.
        """
        try:
            raw = self.shopping_repo.get_ingredient_breakdown(recipe_ids)

            class _BreakdownResponse:
                pass

            resp = _BreakdownResponse()
            resp.items = []
            for key, contributions in raw.items():
                parts = key.split("::")
                # capitalize ingredient name for proper formatting
                ingredient_name = parts[0].capitalize() if parts else ""
                unit = parts[1] if len(parts) > 1 else ""
                total_qty = sum(qty for _, qty, _, _ in contributions)

                class _Item:
                    pass

                item = _Item()
                item.ingredient_name = ingredient_name
                item.total_quantity = total_qty
                item.unit = unit
                # build recipe_breakdown list with usage_count
                item.recipe_breakdown = [
                    type('Rpt', (), {'recipe_name': rn, 'quantity': q, 'unit': u, 'usage_count': cnt})
                    for rn, q, u, cnt in contributions
                ]
                resp.items.append(item)
            return resp
        except SQLAlchemyError:
            class _BreakdownResponse:
                pass
            resp = _BreakdownResponse()
            resp.items = []
            return resp

    # ── Helper Methods ──────────────────────────────────────────────────────────────────────────────────────
    def _item_to_response_dto(
            self,
            item: ShoppingItem,
            recipe_sources: Optional[List[RecipeSourceDTO]] = None
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
            recipe_sources=recipe_sources or []
        )

    # ── Shopping List Management ────────────────────────────────────────────────────────────────────────────
    def clear_shopping_list(self) -> BulkOperationResultDTO:
        """
        Clear the entire shopping list for the current user.

        Returns:
            BulkOperationResultDTO: Operation result.
        """
        try:
            deleted_count = self.shopping_repo.clear_shopping_items(self.user_id)
            self.session.commit()
            return BulkOperationResultDTO(
                success=True,
                updated_count=deleted_count,
                message=f"Cleared {deleted_count} items from shopping list"
            )

        except SQLAlchemyError as e:
            self.session.rollback()
            return BulkOperationResultDTO(
                success=False,
                updated_count=0,
                message="Failed to clear shopping list",
                errors=[str(e)]
            )

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
        summary.total_items = summary_data.get('total_items', 0)
        # map 'checked_items' to 'completed_items'
        summary.completed_items = summary_data.get('checked_items', 0)
        summary.manual_items = summary_data.get('manual_items', 0)
        summary.recipe_items = summary_data.get('recipe_items', 0)
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
        items = self.shopping_repo.search_shopping_items(self.user_id, search_term=search_term)
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
                "completion_percentage": 0
            }

    # ── Generate Methods (for API compatibility) ────────────────────────────────────────────────────────────
    def generate_shopping_list(self, generation_dto: ShoppingListGenerationDTO) -> ShoppingListGenerationResultDTO:
        """
        Generate shopping list from recipe IDs.
        This now uses the sync mechanism internally.

        Args:
            generation_dto: DTO with recipe_ids to generate from.

        Returns:
            ShoppingListGenerationResultDTO with operation statistics.
        """
        # For now, this method is kept for API compatibility but uses sync internally
        try:
            stats = self.sync_shopping_list()
            total_items = len(self.shopping_repo.get_all_shopping_items())
            return ShoppingListGenerationResultDTO(
                success=True,
                items_created=stats["items_created"],
                items_updated=stats["items_updated"],
                total_items=total_items,
                message=f"Synced shopping list: {stats['items_created']} created, {stats['items_updated']} updated, {stats['items_deleted']} deleted"
            )
        except Exception as e:
            return ShoppingListGenerationResultDTO(
                success=False,
                items_created=0,
                items_updated=0,
                total_items=0,
                message=str(e),
                errors=[str(e)]
            )

    def generate_from_active_planner(self) -> ShoppingListGenerationResultDTO:
        """
        Generate shopping list from active planner entries.
        This method now just calls sync_shopping_list() for backwards compatibility.
        """
        try:
            stats = self.sync_shopping_list()
            total_items = len(self.shopping_repo.get_all_shopping_items())
            return ShoppingListGenerationResultDTO(
                success=True,
                items_created=stats["items_created"],
                items_updated=stats["items_updated"],
                total_items=total_items,
                message=f"Synced shopping list: {stats['items_created']} created, {stats['items_updated']} updated, {stats['items_deleted']} deleted"
            )
        except Exception as e:
            return ShoppingListGenerationResultDTO(
                success=False,
                items_created=0,
                items_updated=0,
                total_items=0,
                message=str(e),
                errors=[str(e)]
            )
