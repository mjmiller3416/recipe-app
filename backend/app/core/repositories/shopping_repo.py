"""app/core/repositories/shopping_repo.py

Repository for shopping list and shopping state operations.
Handles ingredient aggregation, manual items, and state persistence.
"""

# ── Imports ─────────────────────────────────────────────────────────────────────────────────────────────────
from __future__ import annotations

from collections import defaultdict
from typing import Any, Dict, List, Optional, Tuple

from sqlalchemy import and_, delete, select
from sqlalchemy.orm import Session, joinedload

from ..models.recipe_ingredient import RecipeIngredient
from ..models.ingredient import Ingredient
from ..models.shopping_item import ShoppingItem
from ..models.shopping_state import ShoppingState


# ── Shopping Repository ─────────────────────────────────────────────────────────────────────────────────────
class ShoppingRepo:
    """Repository for shopping list operations."""

    # unit conversion mappings
    _CONVERSIONS: Dict[str, Dict[str, float]] = {
        "butter": {"stick": 8.0, "tbsp": 1.0},
        "flour": {"cup": 16.0, "tbsp": 1.0},
        "sugar": {"cup": 16.0, "tbsp": 1.0},
    }

    def __init__(self, session: Session):
        """Initialize the Shopping Repository with a database session."""
        self.session = session

    # ── Unit Conversion ─────────────────────────────────────────────────────────────────────────────────────
    def _convert_quantity(self, name: str, qty: float, unit: str) -> Tuple[float, str]:
        """
        Convert ingredient quantity to a standard unit if applicable.

        Args:
            name (str): Ingredient name.
            qty (float): Quantity to convert.
            unit (str): Current unit of the ingredient.

        Returns:
            Tuple[float, str]: Converted quantity and unit.
        """
        key = name.lower()
        if key in self._CONVERSIONS:
            group = self._CONVERSIONS[key]
            factor = group.get(unit)
            if factor is None:
                return qty, unit

            qty_base = qty * factor
            # Find the best unit representation
            for u, f in sorted(group.items(), key=lambda it: -it[1]):
                if qty_base % f == 0:
                    return qty_base // f, u
            return qty_base / group.get(unit, 1.0), unit
        return qty, unit

    # ── Recipe Ingredient Aggregation ───────────────────────────────────────────────────────────────────────
    def get_recipe_ingredients(self, recipe_ids: List[int]) -> List[RecipeIngredient]:
        """
        Fetch all recipe ingredients for given recipe IDs.
        Handles duplicate recipe IDs by counting occurrences and scaling quantities.

        Args:
            recipe_ids (List[int]): List of recipe IDs to fetch ingredients for.

        Returns:
            List[RecipeIngredient]: List of RecipeIngredient objects with loaded relationships.
        """
        if not recipe_ids:
            return []

        # Count occurrences of each recipe ID
        from collections import Counter
        recipe_counts = Counter(recipe_ids)
        unique_recipe_ids = list(recipe_counts.keys())

        stmt = select(RecipeIngredient).where(
            RecipeIngredient.recipe_id.in_(unique_recipe_ids)
        ).options(
            joinedload(RecipeIngredient.ingredient),
            joinedload(RecipeIngredient.recipe)
        )
        recipe_ingredients = self.session.scalars(stmt).unique().all()

        # Duplicate recipe ingredients based on count
        result = []
        for ri in recipe_ingredients:
            count = recipe_counts[ri.recipe_id]
            for _ in range(count):
                result.append(ri)

        return result

    def aggregate_ingredients(self, recipe_ids: List[int]) -> List[ShoppingItem]:
        """
        Aggregate ingredients from recipes into shopping items.

        Args:
            recipe_ids (List[int]): List of recipe IDs to aggregate ingredients from.

        Returns:
            List[ShoppingItem]: List of aggregated ShoppingItem objects.
        """
        recipe_ingredients = self.get_recipe_ingredients(recipe_ids)

        # aggregate by ingredient ID
        aggregation: Dict[int, Dict[str, Any]] = defaultdict(lambda: {
            "quantity": 0.0,
            "unit": None,
            "category": None,
            "name": None,
        })

        for ri in recipe_ingredients:
            ingredient: Ingredient = ri.ingredient
            data = aggregation[ri.ingredient_id]
            data["name"] = ingredient.ingredient_name
            data["category"] = ingredient.ingredient_category
            data["unit"] = ri.unit or data["unit"]
            data["quantity"] += ri.quantity or 0.0

        # convert to ShoppingItem objects
        items: List[ShoppingItem] = []
        for data in aggregation.values():
            # apply unit conversions
            converted_qty, converted_unit = self._convert_quantity(
                data["name"], data["quantity"], data["unit"] or ""
            )

            # create state key for persistence
            state_key = ShoppingState.create_key(data["name"], converted_unit)

            item = ShoppingItem(
                ingredient_name=data["name"],
                quantity=converted_qty,
                unit=converted_unit,
                category=data["category"],
                source="recipe",
                have=False,
                state_key=state_key
            )
            items.append(item)

        return items

    def get_ingredient_breakdown(
            self,
            recipe_ids: List[int]
        ) -> Dict[str, List[Tuple[str, float, str]]]:
        """
        Get detailed breakdown of ingredients used in recipes.

        Args:
            recipe_ids (List[int]): List of recipe IDs to get breakdown for.

        Returns:
            Dict[str, List[Tuple[str, float, str]]]: Breakdown by ingredient key.
        """
        recipe_ingredients = self.get_recipe_ingredients(recipe_ids)
        breakdown: Dict[str, List[Tuple[str, float, str]]] = defaultdict(list)

        # First, aggregate by ingredient and recipe to combine duplicate recipes
        recipe_aggregation: Dict[str, Dict[str, Dict[str, Any]]] = defaultdict(lambda: defaultdict(lambda: {
            "quantity": 0.0,
            "unit": None
        }))

        for ri in recipe_ingredients:
            ingredient = ri.ingredient
            recipe = ri.recipe

            # apply unit conversions
            converted_qty, converted_unit = self._convert_quantity(
                ingredient.ingredient_name, ri.quantity or 0.0, ri.unit or ""
            )

            # create breakdown key using normalized format for state persistence
            key = ShoppingState.create_key(ingredient.ingredient_name, converted_unit)

            # Aggregate by recipe name within each ingredient
            recipe_data = recipe_aggregation[key][recipe.recipe_name]
            recipe_data["quantity"] += converted_qty
            recipe_data["unit"] = converted_unit

        # Convert aggregated data to the expected format
        for ingredient_key, recipes in recipe_aggregation.items():
            for recipe_name, recipe_data in recipes.items():
                breakdown[ingredient_key].append((recipe_name, recipe_data["quantity"], recipe_data["unit"]))

        return breakdown

    # ── Shopping Item CRUD Operations ───────────────────────────────────────────────────────────────────────
    def create_shopping_item(self, shopping_item: ShoppingItem) -> ShoppingItem:
        """
        Create and persist a new shopping item.

        Args:
            shopping_item (ShoppingItem): Shopping item to create.

        Returns:
            ShoppingItem: Created shopping item with assigned ID.
        """
        self.session.add(shopping_item)
        # flush to assign primary key and persist the new item
        self.session.flush()
        self.session.refresh(shopping_item)
        return shopping_item

    def add_manual_item(self, shopping_item: ShoppingItem) -> ShoppingItem:
        """
        Alias to create a manual shopping item.
        """
        return self.create_shopping_item(shopping_item)

    def create_shopping_items_from_recipes(self, recipe_ids: List[int]) -> List[ShoppingItem]:
        """
        Create and persist shopping items aggregated from given recipes.
        """
        created_items: List[ShoppingItem] = []
        recipe_items = self.aggregate_ingredients(recipe_ids)
        for item in recipe_items:
            created = self.create_shopping_item(item)
            created_items.append(created)
        return created_items

    def get_shopping_item_by_id(self, item_id: int) -> Optional[ShoppingItem]:
        """
        Get a shopping item by ID.

        Args:
            item_id (int): ID of the shopping item.

        Returns:
            Optional[ShoppingItem]: Shopping item or None if not found.
        """
        stmt = select(ShoppingItem).where(ShoppingItem.id == item_id)
        result = self.session.execute(stmt)
        return result.scalar_one_or_none()

    def update_item_status(self, item_id: int, have: bool) -> bool:
        """
        Update the 'have' status of a shopping item by ID.
        """
        item = self.get_shopping_item_by_id(item_id)
        if not item:
            return False
        item.have = have
        return True

    def get_all_shopping_items(self, source: Optional[str] = None) -> List[ShoppingItem]:
        """
        Get all shopping items, optionally filtered by source.

        Args:
            source (Optional[str]): Filter by source ("recipe" or "manual").

        Returns:
            List[ShoppingItem]: List of shopping items.
        """
        stmt = select(ShoppingItem)
        if source:
            stmt = stmt.where(ShoppingItem.source == source)

        result = self.session.execute(stmt)
        return result.scalars().all()

    def update_item(self, shopping_item: ShoppingItem) -> ShoppingItem:
        """
        Update an existing shopping item.

        Args:
            shopping_item (ShoppingItem): Shopping item to update.

        Returns:
            ShoppingItem: Updated shopping item.
        """
        merged_item = self.session.merge(shopping_item)
        return merged_item

    def delete_item(self, item_id: int) -> bool:
        """
        Delete a shopping item by ID.

        Args:
            item_id (int): ID of the shopping item to delete.

        Returns:
            bool: True if deleted, False if not found.
        """
        stmt = select(ShoppingItem).where(ShoppingItem.id == item_id)
        result = self.session.execute(stmt)
        item = result.scalar_one_or_none()

        if item:
            self.session.delete(item)
            # flush to persist deletion immediately
            self.session.flush()
            return True
        return False

    def clear_shopping_items(self, source: Optional[str] = None) -> int:
        """
        Clear shopping items, optionally filtered by source.

        Args:
            source (Optional[str]): Clear only items from this source.

        Returns:
            int: Number of items deleted.
        """
        stmt = delete(ShoppingItem)
        if source:
            stmt = stmt.where(ShoppingItem.source == source)

        result = self.session.execute(stmt)
        return result.rowcount

    def clear_recipe_items(self) -> int:
        """
        Clear all recipe-generated shopping items.
        """
        return self.clear_shopping_items(source="recipe")

    # ── Shopping Item Search and Filter ─────────────────────────────────────────────────────────────────────
    def search_shopping_items(
        self,
        search_term: Optional[str] = None,
        source: Optional[str] = None,
        category: Optional[str] = None,
        have: Optional[bool] = None,
        limit: Optional[int] = None,
        offset: Optional[int] = None
        ) -> List[ShoppingItem]:
        """
        Search shopping items with filters.

        Args:
            search_term (Optional[str]): Search in ingredient names.
            source (Optional[str]): Filter by source.
            category (Optional[str]): Filter by category.
            have (Optional[bool]): Filter by have status.
            limit (Optional[int]): Limit results.
            offset (Optional[int]): Offset for pagination.

        Returns:
            List[ShoppingItem]: Filtered shopping items.
        """
        stmt = select(ShoppingItem)

        # apply filters
        filters = []
        if search_term:
            filters.append(ShoppingItem.ingredient_name.ilike(f"%{search_term}%"))
        if source:
            filters.append(ShoppingItem.source == source)
        if category:
            filters.append(ShoppingItem.category == category)
        if have is not None:
            filters.append(ShoppingItem.have == have)

        if filters:
            stmt = stmt.where(and_(*filters))

        if offset:
            stmt = stmt.offset(offset)
        if limit:
            stmt = stmt.limit(limit)

        result = self.session.execute(stmt)
        return result.scalars().all()

    # ── Shopping State Operations ───────────────────────────────────────────────────────────────────────────
    def get_shopping_state(self, key: str) -> Optional[ShoppingState]:
        """
        Get shopping state by key.

        Args:
            key (str): State key.

        Returns:
            Optional[ShoppingState]: Shopping state or None if not found.
        """
        normalized_key = ShoppingState.normalize_key(key)
        stmt = select(ShoppingState).where(ShoppingState.key == normalized_key)
        result = self.session.execute(stmt)
        return result.scalar_one_or_none()

    def save_shopping_state(
            self,
            key: str,
            quantity: float,
            unit: str,
            checked: bool
        ) -> ShoppingState:
        """
        Save or update shopping state.

        Args:
            key (str): State key.
            quantity (float): Quantity.
            unit (str): Unit.
            checked (bool): Checked status.

        Returns:
            ShoppingState: Saved shopping state.
        """
        normalized_key = ShoppingState.normalize_key(key)

        # try to get existing state
        existing_state = self.get_shopping_state(normalized_key)

        if existing_state:
            # update existing state
            existing_state.quantity = quantity
            existing_state.unit = unit
            existing_state.checked = checked
            # flush so updates land before we refresh/read them back
            self.session.flush()
            state = existing_state
        else:
            state = ShoppingState(
                key=normalized_key,
                quantity=quantity,
                unit=unit,
                checked=checked
            )
            self.session.add(state)
            # flush to assign primary key and persist the new state
            self.session.flush()

        self.session.refresh(state)
        return state

    def toggle_shopping_state(self, key: str) -> Optional[bool]:
        """
        Toggle the checked status of a shopping state.

        Args:
            key (str): State key.

        Returns:
            Optional[bool]: New checked status or None if not found.
        """
        state = self.get_shopping_state(key)
        if state:
            state.checked = not state.checked
            return state.checked
        return None

    def clear_shopping_states(self) -> int:
        """
        Clear all shopping states.

        Returns:
            int: Number of states deleted.
        """
        stmt = delete(ShoppingState)
        result = self.session.execute(stmt)
        return result.rowcount

    # ── Utility Methods ─────────────────────────────────────────────────────────────────────────────────────
    def get_shopping_list_summary(self) -> Dict[str, Any]:
        """
        Get summary statistics for the shopping list.

        Returns:
            Dict[str, Any]: Summary with counts and categories.
        """
        all_items = self.get_all_shopping_items()

        total_items = len(all_items)
        checked_items = sum(1 for item in all_items if item.have)
        recipe_items = sum(1 for item in all_items if item.source == "recipe")
        manual_items = sum(1 for item in all_items if item.source == "manual")

        categories = list(set(item.category for item in all_items if item.category))
        categories.sort()

        return {
            "total_items": total_items,
            "checked_items": checked_items,
            "recipe_items": recipe_items,
            "manual_items": manual_items,
            "categories": categories,
            "completion_percentage": (
                checked_items / total_items * 100) if total_items > 0 else 0
        }

    def bulk_update_have_status(self, updates: List[Tuple[int, bool]]) -> int:
        """
        Bulk update have status for multiple items.

        Args:
            updates (List[Tuple[int, bool]]): List of (item_id, have_status) tuples.

        Returns:
            int: Number of items updated.
        """
        updated_count = 0
        for item_id, have_status in updates:
            item = self.get_shopping_item_by_id(item_id)
            if item:
                item.have = have_status
                updated_count += 1


        return updated_count

    def bulk_update_states(self, updates: Dict[str, bool]) -> int:
        """
        Bulk update 'checked' status for multiple shopping states by key.
        Args:
            updates: mapping of state key to new checked value.
        Returns:
            Number of states updated.
        """
        updated_count = 0
        for key, checked in updates.items():
            state = self.get_shopping_state(key)
            if state:
                state.checked = checked
                updated_count += 1
        return updated_count
