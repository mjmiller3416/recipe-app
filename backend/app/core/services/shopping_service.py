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
from ..repositories.planner_repo import PlannerRepo
from ..repositories.shopping_repo import ShoppingRepo


# ── Shopping Service ────────────────────────────────────────────────────────────────────────────────────────
class ShoppingService:
    """Service for shopping list operations with business logic."""

    def __init__(self, session: Session | None = None):
        """Initialize the ShoppingService with a database session and repositories.
        If no session is provided, a new session is created."""
        if session is None:
            from app.core.database.db import create_session
            session = create_session()
        self.session = session
        self.shopping_repo = ShoppingRepo(self.session)
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
            # Empty selection yields empty result
            if not recipe_ids:
                return ShoppingListGenerationResultDTO(
                    success=True,
                    items_created=0,
                    items_updated=0,
                    total_items=0,
                    message="No recipes provided"
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

            # Apply saved states to items
            for item in recipe_items:
                if item.state_key:
                    saved_state = self.shopping_repo.get_shopping_state(item.state_key)
                    if saved_state:
                        item.have = saved_state.checked

            # save new items
            items_created = 0
            for item in recipe_items:
                self.shopping_repo.create_shopping_item(item)
                items_created += 1
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
        Extract all recipe IDs from meal selections.

        Args:
            meal_ids (List[int]): List of meal selection IDs.

        Returns:
            List[int]: List of recipe IDs used in the meals.
        """
        recipe_ids = []
        for meal_id in meal_ids:
            meal = self.planner_repo.get_meal_selection_by_id(meal_id)
            if meal:
                recipe_ids.append(meal.main_recipe_id)
                if meal.side_recipe_1_id:
                    recipe_ids.append(meal.side_recipe_1_id)
                if meal.side_recipe_2_id:
                    recipe_ids.append(meal.side_recipe_2_id)
                if meal.side_recipe_3_id:
                    recipe_ids.append(meal.side_recipe_3_id)
        return recipe_ids

    def get_recipe_ids_from_meals(self, meal_ids: List[int]) -> List[int]:
        """
        Public alias for extracting all recipe IDs from saved meal selections.

        Args:
            meal_ids (List[int]): List of meal selection IDs.

        Returns:
            List[int]: Flattened list of recipe IDs used in those meals.
        """
        return self._extract_recipe_ids_from_meals(meal_ids)

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

            # convert to response DTOs
            item_dtos = [self._item_to_response_dto(item) for item in items]

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
                unit=create_dto.unit
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
                        item.state_key, item.quantity, item.unit or "", item.have
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
                    item.state_key, item.quantity, item.unit or "", item.have
                )

            self.shopping_repo.update_item(item)
            self.session.commit()
            return True

        except SQLAlchemyError:
            self.session.rollback()
            return False

    def clear_completed_items(self) -> int:
        """
        Clear all completed (have=True) shopping items and return count deleted.
        """
        from sqlalchemy import delete

        from app.core.models.shopping_item import ShoppingItem
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
                        item.state_key, item.quantity, item.unit or "", item.have
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
                total_qty = sum(qty for _, qty, _ in contributions)
                class _Item:
                    pass
                item = _Item()
                item.ingredient_name = ingredient_name
                item.total_quantity = total_qty
                item.unit = unit
                # build recipe_breakdown list
                item.recipe_breakdown = [
                    type('Rpt', (), {'recipe_name': rn, 'quantity': q, 'unit': u})
                    for rn, q, u in contributions
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
    def _item_to_response_dto(self, item: ShoppingItem) -> ShoppingItemResponseDTO:
        """Convert a ShoppingItem model to a response DTO."""
        return ShoppingItemResponseDTO(
            id=item.id,
            ingredient_name=item.ingredient_name,
            quantity=item.quantity,
            unit=item.unit,
            category=item.category,
            source=item.source,
            have=item.have,
            state_key=item.state_key
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
