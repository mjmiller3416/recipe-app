"""app/core/services/shopping_service.py

Service layer for shopping list operations and business logic.
Orchestrates repository operations and coordinates with meal planning.
"""

# ── Imports ─────────────────────────────────────────────────────────────────────────────────────────────────
from __future__ import annotations

from typing import Any, Dict, List, Optional, Union

from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from ..dtos.shopping_dtos import (
    BulkOperationResultDTO,
    BulkStateUpdateDTO,
    ManualItemCreateDTO,
    ShoppingItemResponseDTO,
    ShoppingItemUpdateDTO,
    ShoppingListFilterDTO,
    ShoppingListGenerationDTO,
    ShoppingListGenerationResultDTO,
    ShoppingListResponseDTO)
from ..models.shopping_item import ShoppingItem
from ..repositories.meal_repo import MealRepo
from ..repositories.planner_repo import PlannerRepo
from ..repositories.shopping_repo import ShoppingRepo


# ── Shopping Service ────────────────────────────────────────────────────────────────────────────────────────
class ShoppingService:
    """Service for shopping list operations with business logic."""

    def __init__(self, session: Session | None = None):
        """Initialize the ShoppingService with a database session and repositories.
        If no session is provided, a new session is created."""
        if session is None:
            from app.database.db import create_session
            session = create_session()
        self.session = session
        self.shopping_repo = ShoppingRepo(self.session)
        self.meal_repo = MealRepo(self.session)
        self.planner_repo = PlannerRepo(self.session)

    # ── Shopping List Generation ────────────────────────────────────────────────────────────────────────────
    def generate_shopping_list(
        self,
        meal_ids_or_dto: Union[List[int], ShoppingListGenerationDTO]
        ) -> ShoppingListGenerationResultDTO:
        """
        Generate shopping list from meal selections or from a ShoppingListGenerationDTO.

        Args:
            meal_ids_or_dto (List[int] or ShoppingListGenerationDTO): List of meal selection IDs or DTO.

        Returns:
            An object with attributes 'success', 'items_created', and 'items' (list of ShoppingItemResponseDTO).
        """
         # Extract recipe IDs from DTO if needed
        if isinstance(meal_ids_or_dto, ShoppingListGenerationDTO):
            recipe_ids = meal_ids_or_dto.recipe_ids
        else:
            recipe_ids = meal_ids_or_dto

        try:
            # Empty selection: clear recipe items and all states, then return
            if not recipe_ids:
                self.shopping_repo.clear_shopping_items(source="recipe")
                # Delete all orphaned states since there are no recipe items
                self.shopping_repo.delete_orphaned_states([])
                self.session.commit()
                # Count remaining items (manual items only)
                total_items = len(self.shopping_repo.get_all_shopping_items())
                return ShoppingListGenerationResultDTO(
                    success=True,
                    items_created=0,
                    items_updated=0,
                    total_items=total_items,
                    message="Cleared recipe items (no active meals)"
                )

            # Generate shopping list items
            result = self.generate_shopping_list_from_recipes(recipe_ids)
            return result

        except SQLAlchemyError as e:
            return ShoppingListGenerationResultDTO(
                success=False,
                items_created=0,
                items_updated=0,
                total_items=0,
                message="Failed to generate shopping list",
                errors=[str(e)]
            )

    def generate_shopping_list_from_recipes(self, recipe_ids: List[int]) -> ShoppingListGenerationResultDTO:
        """
        Generate shopping list from recipes with state restoration.

        Args:
            recipe_ids (List[int]): List of recipe IDs.

        Returns:
            ShoppingListGenerationResultDTO: Generation result with statistics.
        """
        try:
            # clear existing recipe-generated items
            deleted_count = self.shopping_repo.clear_shopping_items(source="recipe")

            # aggregate ingredients from recipes
            recipe_items = self.shopping_repo.aggregate_ingredients(recipe_ids)

            # Batch load all saved states in a single query (fixes N+1 problem)
            state_keys = [item.state_key for item in recipe_items if item.state_key]
            saved_states = self.shopping_repo.get_shopping_states_batch(state_keys)

            # Apply saved states to items (only if quantity hasn't increased)
            for item in recipe_items:
                if item.state_key:
                    normalized_key = item.state_key.lower().strip()
                    saved_state = saved_states.get(normalized_key)
                    if saved_state:
                        # If quantity increased, uncheck - user needs to collect more
                        # Use 0.01 tolerance to account for floating point rounding in unit conversion
                        if item.quantity > saved_state.quantity + 0.01:
                            item.have = False
                        else:
                            item.have = saved_state.checked
                        # Always restore flagged status (flags are user preference, not quantity-dependent)
                        item.flagged = saved_state.flagged

            # Update saved state quantities to match current quantities
            # This ensures future regenerations compare against accurate values
            # Save state for items that are checked OR flagged
            for item in recipe_items:
                if item.state_key and (item.have or item.flagged):
                    self.shopping_repo.save_shopping_state(
                        item.state_key, item.quantity, item.unit or "", item.have, item.flagged
                    )

            # save new items
            items_created = 0
            for item in recipe_items:
                self.shopping_repo.create_shopping_item(item)
                items_created += 1

            # Clean up orphaned states that no longer have corresponding items
            valid_state_keys = [item.state_key for item in recipe_items if item.state_key]
            self.shopping_repo.delete_orphaned_states(valid_state_keys)

            # commit transaction after creating all items
            self.session.commit()

            # get total count including manual items
            total_items = len(self.shopping_repo.get_all_shopping_items())

            return ShoppingListGenerationResultDTO(
                success=True,
                items_created=items_created,
                items_updated=0,
                total_items=total_items,
                message=f"Successfully generated shopping list with {items_created} recipe items"
            )

        except SQLAlchemyError as e:
            self.session.rollback()
            return ShoppingListGenerationResultDTO(
                success=False,
                items_created=0,
                items_updated=0,
                total_items=0,
                message=f"Database error: {e}",
                errors=[str(e)]
            )

    def _extract_recipe_ids_from_meals(self, meal_ids: List[int]) -> List[int]:
        """
        Extract all recipe IDs from meals.

        Args:
            meal_ids (List[int]): List of meal IDs.

        Returns:
            List[int]: List of recipe IDs used in the meals.
        """
        recipe_ids = []
        for meal_id in meal_ids:
            meal = self.meal_repo.get_by_id(meal_id)
            if meal:
                recipe_ids.extend(meal.get_all_recipe_ids())
        return recipe_ids

    def get_recipe_ids_from_meals(self, meal_ids: List[int]) -> List[int]:
        """
        Public alias for extracting all recipe IDs from meals.

        Args:
            meal_ids (List[int]): List of meal IDs.

        Returns:
            List[int]: Flattened list of recipe IDs used in those meals.
        """
        return self._extract_recipe_ids_from_meals(meal_ids)

    def generate_from_active_planner(self) -> ShoppingListGenerationResultDTO:
        """
        Generate shopping list from active planner entries with mode-aware filtering.

        Shopping modes:
        - 'all': Include all ingredients from the meal
        - 'produce_only': Include only produce category ingredients
        - 'none': Excluded (filtered out by get_shopping_entries)

        Returns:
            ShoppingListGenerationResultDTO: Generation result with statistics.
        """
        try:
            # Get planner entries (excludes 'none' mode entries)
            entries = self.planner_repo.get_shopping_entries()

            # Group recipe IDs by shopping mode
            all_recipe_ids: List[int] = []
            produce_only_recipe_ids: List[int] = []

            for entry in entries:
                if entry.meal:
                    recipe_ids = entry.meal.get_all_recipe_ids()
                    if entry.shopping_mode == "produce_only":
                        produce_only_recipe_ids.extend(recipe_ids)
                    else:  # 'all' mode (default)
                        all_recipe_ids.extend(recipe_ids)

            # Generate shopping list with mode-aware aggregation
            return self._generate_mode_aware_shopping_list(
                all_recipe_ids, produce_only_recipe_ids
            )

        except SQLAlchemyError as e:
            return ShoppingListGenerationResultDTO(
                success=False,
                items_created=0,
                items_updated=0,
                total_items=0,
                message="Failed to generate shopping list from planner",
                errors=[str(e)]
            )

    def _generate_mode_aware_shopping_list(
        self,
        all_recipe_ids: List[int],
        produce_only_recipe_ids: List[int]
    ) -> ShoppingListGenerationResultDTO:
        """
        Generate shopping list with mode-aware ingredient filtering.

        Args:
            all_recipe_ids: Recipe IDs to include all ingredients from
            produce_only_recipe_ids: Recipe IDs to include only produce from

        Returns:
            ShoppingListGenerationResultDTO: Generation result.
        """
        try:
            # Handle empty case
            if not all_recipe_ids and not produce_only_recipe_ids:
                self.shopping_repo.clear_shopping_items(source="recipe")
                self.shopping_repo.delete_orphaned_states([])
                self.session.commit()
                total_items = len(self.shopping_repo.get_all_shopping_items())
                return ShoppingListGenerationResultDTO(
                    success=True,
                    items_created=0,
                    items_updated=0,
                    total_items=total_items,
                    message="Cleared recipe items (no active meals)"
                )

            # Clear existing recipe items
            self.shopping_repo.clear_shopping_items(source="recipe")

            # Aggregate ingredients from "all" mode entries
            all_items = self.shopping_repo.aggregate_ingredients(all_recipe_ids) if all_recipe_ids else []

            # Aggregate only produce from "produce_only" mode entries
            produce_items = self.shopping_repo.aggregate_ingredients(
                produce_only_recipe_ids, category_filter="produce"
            ) if produce_only_recipe_ids else []

            # Merge items (combine quantities for duplicates)
            recipe_items = self._merge_shopping_items(all_items, produce_items)

            # Restore saved states (same logic as generate_shopping_list_from_recipes)
            state_keys = [item.state_key for item in recipe_items if item.state_key]
            saved_states = self.shopping_repo.get_shopping_states_batch(state_keys)

            for item in recipe_items:
                if item.state_key:
                    normalized_key = item.state_key.lower().strip()
                    saved_state = saved_states.get(normalized_key)
                    if saved_state:
                        if item.quantity > saved_state.quantity + 0.01:
                            item.have = False
                        else:
                            item.have = saved_state.checked
                        item.flagged = saved_state.flagged

            # Save states for checked/flagged items
            for item in recipe_items:
                if item.state_key and (item.have or item.flagged):
                    self.shopping_repo.save_shopping_state(
                        item.state_key, item.quantity, item.unit or "", item.have, item.flagged
                    )

            # Create shopping items
            items_created = 0
            for item in recipe_items:
                self.shopping_repo.create_shopping_item(item)
                items_created += 1

            # Clean up orphaned states
            valid_state_keys = [item.state_key for item in recipe_items if item.state_key]
            self.shopping_repo.delete_orphaned_states(valid_state_keys)

            self.session.commit()
            total_items = len(self.shopping_repo.get_all_shopping_items())

            return ShoppingListGenerationResultDTO(
                success=True,
                items_created=items_created,
                items_updated=0,
                total_items=total_items,
                message=f"Successfully generated shopping list with {items_created} recipe items"
            )

        except SQLAlchemyError as e:
            self.session.rollback()
            return ShoppingListGenerationResultDTO(
                success=False,
                items_created=0,
                items_updated=0,
                total_items=0,
                message=f"Database error: {e}",
                errors=[str(e)]
            )

    def _merge_shopping_items(
        self,
        items1: List[ShoppingItem],
        items2: List[ShoppingItem]
    ) -> List[ShoppingItem]:
        """
        Merge two lists of shopping items, combining quantities for duplicates.
        Uses state_key as the unique identifier for merging.
        """
        merged: Dict[str, ShoppingItem] = {}

        for item in items1:
            key = item.state_key or f"{item.ingredient_name}::{item.unit}"
            merged[key] = item

        for item in items2:
            key = item.state_key or f"{item.ingredient_name}::{item.unit}"
            if key in merged:
                # Combine quantities and recipe sources
                existing = merged[key]
                existing.quantity += item.quantity
                existing_sources = set(existing.recipe_sources or [])
                new_sources = set(item.recipe_sources or [])
                existing.recipe_sources = sorted(list(existing_sources | new_sources))
            else:
                merged[key] = item

        return list(merged.values())

    # ── Shopping List Retrieval ─────────────────────────────────────────────────────────────────────────────
    def get_shopping_list(
            self,
            filters: Optional[ShoppingListFilterDTO] = None
        ) -> ShoppingListResponseDTO:
        """
        Get the current shopping list with optional filters.

        Args:
            filters (Optional[ShoppingListFilterDTO]): Filter criteria.

        Returns:
            ShoppingListResponseDTO: Complete shopping list with metadata.
        """
        try:
            # apply filters if provided
            if filters:
                items = self.shopping_repo.search_shopping_items(
                    search_term=filters.search_term,
                    source=filters.source,
                    category=filters.category,
                    have=filters.have,
                    limit=filters.limit,
                    offset=filters.offset
                )
            else:
                items = self.shopping_repo.get_all_shopping_items()

            # convert to response DTOs - recipe_sources is now stored on the item itself
            item_dtos = [
                self._item_to_response_dto(item, item.recipe_sources or [])
                for item in items
            ]

            # get summary statistics
            summary = self.shopping_repo.get_shopping_list_summary()

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

    def _build_recipe_sources_map(self) -> Dict[str, List[str]]:
        """
        Build a mapping from state_key to list of recipe names.
        Uses the active planner entries to get recipe IDs, then fetches breakdown.
        """
        try:
            # Get recipe IDs from shopping entries (same as generate_from_active_planner)
            entries = self.planner_repo.get_shopping_entries()
            recipe_ids: List[int] = []
            for entry in entries:
                if entry.meal:
                    recipe_ids.extend(entry.meal.get_all_recipe_ids())

            if not recipe_ids:
                return {}

            # Get breakdown data
            breakdown = self.shopping_repo.get_ingredient_breakdown(recipe_ids)

            # Build mapping from state_key -> list of recipe names
            recipe_sources_map: Dict[str, List[str]] = {}
            for state_key, contributions in breakdown.items():
                # contributions is List[Tuple[recipe_name, quantity, unit, usage_count]]
                recipe_names = list(set(name for name, _, _, _ in contributions))
                recipe_sources_map[state_key] = recipe_names

            return recipe_sources_map
        except SQLAlchemyError:
            return {}

    # ── Manual Item Management ──────────────────────────────────────────────────────────────────────────────
    def add_manual_item(
            self,
            create_dto: ManualItemCreateDTO
        ) -> Optional[ShoppingItemResponseDTO]:
        """
        Add a manual item to the shopping list.

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

            created_item = self.shopping_repo.create_shopping_item(manual_item)
            self.session.commit()
            return self._item_to_response_dto(created_item)

        except SQLAlchemyError:
            self.session.rollback()
            return None

    def update_item(self, item_id: int, update_dto: ShoppingItemUpdateDTO
        ) -> Optional[ShoppingItemResponseDTO]:
        """
        Update a shopping item.

        Args:
            item_id (int): ID of the item to update.
            update_dto (ShoppingItemUpdateDTO): Update data.

        Returns:
            Optional[ShoppingItemResponseDTO]: Updated item or None if failed.
        """
        try:
            item = self.shopping_repo.get_shopping_item_by_id(item_id)
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
                # update state if this is a recipe item
                if item.state_key and item.source == "recipe":
                    self.shopping_repo.save_shopping_state(
                        item.state_key, item.quantity, item.unit or "", item.have, item.flagged
                    )

            updated_item = self.shopping_repo.update_item(item)
            self.session.commit()
            return self._item_to_response_dto(updated_item)

        except SQLAlchemyError:
            self.session.rollback()
            return None

    def delete_item(self, item_id: int) -> bool:
        """
        Delete a shopping item.

        Args:
            item_id (int): ID of the item to delete.

        Returns:
            bool: True if deleted successfully.
        """
        try:
            result = self.shopping_repo.delete_item(item_id)
            self.session.commit()
            return result
        except SQLAlchemyError:
            self.session.rollback()
            return False

    def clear_manual_items(self) -> BulkOperationResultDTO:
        """
        Clear all manual items from the shopping list.

        Returns:
            BulkOperationResultDTO: Operation result.
        """
        try:
            deleted_count = self.shopping_repo.clear_shopping_items(source="manual")
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
        Clear all recipe-generated items from the shopping list.

        Returns:
            BulkOperationResultDTO: Operation result.
        """
        try:
            deleted_count = self.shopping_repo.clear_shopping_items(source="recipe")
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
        Toggle the 'have' status of a shopping item.

        Args:
            item_id (int): ID of the item to toggle.

        Returns:
            Optional[bool]: New have status or None if failed.
        """
        try:
            item = self.shopping_repo.get_shopping_item_by_id(item_id)
            if not item:
                return False

            item.have = not item.have

            # update state for recipe items
            if item.state_key and item.source == "recipe":
                self.shopping_repo.save_shopping_state(
                    item.state_key, item.quantity, item.unit or "", item.have, item.flagged
                )

            self.shopping_repo.update_item(item)
            self.session.commit()
            return True

        except SQLAlchemyError:
            self.session.rollback()
            return False

    def toggle_item_flagged(self, item_id: int) -> Optional[bool]:
        """
        Toggle the 'flagged' status of a shopping item.

        Args:
            item_id (int): ID of the item to toggle.

        Returns:
            Optional[bool]: New flagged status or None if item not found.
        """
        try:
            item = self.shopping_repo.get_shopping_item_by_id(item_id)
            if not item:
                return None

            item.flagged = not item.flagged

            # persist flagged state for recipe items so it survives regeneration
            if item.state_key and item.source == "recipe":
                self.shopping_repo.save_shopping_state(
                    item.state_key, item.quantity, item.unit or "", item.have, item.flagged
                )

            self.shopping_repo.update_item(item)
            self.session.commit()
            return item.flagged

        except SQLAlchemyError:
            self.session.rollback()
            return None

    def clear_completed_items(self) -> int:
        """
        Clear all completed (have=True) shopping items and return count deleted.
        """
        from sqlalchemy import delete

        from app.models.shopping_item import ShoppingItem
        try:
            stmt = delete(ShoppingItem).where(ShoppingItem.have.is_(True))
            result = self.session.execute(stmt)
            self.session.commit()
            return result.rowcount
        except SQLAlchemyError:
            return 0

    def bulk_update_status(self, update_dto: BulkStateUpdateDTO) -> BulkOperationResultDTO:
        """
        Bulk update 'have' status for multiple shopping items.

        Args:
            update_dto (BulkStateUpdateDTO): DTO containing item_updates mapping (item_id -> have status).

        Returns:
            BulkOperationResultDTO: Operation result with count of updated items.
        """
        try:
            updated_count = 0
            for item_id, have in update_dto.item_updates.items():
                item = self.shopping_repo.get_shopping_item_by_id(item_id)
                if not item:
                    continue
                item.have = have
                # update state for recipe items
                if item.state_key and item.source == "recipe":
                    self.shopping_repo.save_shopping_state(
                        item.state_key, item.quantity, item.unit or "", item.have, item.flagged
                    )
                self.shopping_repo.update_item(item)
                updated_count += 1
            # commit transaction after bulk updates
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
        Get detailed breakdown of ingredients by recipe, returned as an object with 'items'.

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
            recipe_sources: Optional[List[str]] = None
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
            state_key=item.state_key,
            recipe_sources=recipe_sources or []
        )

    # ── Shopping List Management ────────────────────────────────────────────────────────────────────────────
    def clear_shopping_list(self) -> BulkOperationResultDTO:
        """
        Clear the entire shopping list.

        Returns:
            BulkOperationResultDTO: Operation result.
        """
        try:
            deleted_count = self.shopping_repo.clear_shopping_items()
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
        Get shopping list summary with attribute access and renamed fields.

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
        Search shopping items by ingredient name.

        Args:
            search_term (str): Substring to search within ingredient names.

        Returns:
            List of ShoppingItemResponseDTO or model instances matching the term.
        """
        # Perform search via repository
        items = self.shopping_repo.search_shopping_items(search_term=search_term)
        # Convert to response DTOs
        return [self._item_to_response_dto(item) for item in items]

    def get_shopping_list_summary(self) -> Dict[str, Any]:
        """
        Get summary statistics for the shopping list.

        Returns:
            Dict[str, Any]: Summary with counts and completion percentage.
        """
        try:
            return self.shopping_repo.get_shopping_list_summary()
        except SQLAlchemyError:
            return {
                "total_items": 0,
                "checked_items": 0,
                "recipe_items": 0,
                "manual_items": 0,
                "categories": [],
                "completion_percentage": 0
            }
