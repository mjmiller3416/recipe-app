"""app/core/repositories/shopping_repo.py

Repository for shopping list and shopping state operations.
Handles ingredient aggregation, manual items, and state persistence.
"""

# ── Imports ─────────────────────────────────────────────────────────────────────────────────────────────────
from __future__ import annotations

from collections import defaultdict
from typing import Any, Dict, List, Optional, Tuple

from sqlalchemy import and_, case, delete, func, select
from sqlalchemy.orm import Session, joinedload

from ..models.recipe_ingredient import RecipeIngredient
from ..models.ingredient import Ingredient
from ..models.shopping_item import ShoppingItem
from ..models.shopping_state import ShoppingState
from ..utils.unit_conversion import get_dimension, to_base_unit, to_display_unit
from ..services.unit_conversion_service import UnitConversionService


# ── Shopping Repository ─────────────────────────────────────────────────────────────────────────────────────
class ShoppingRepo:
    """Repository for shopping list operations."""

    def __init__(self, session: Session, user_id: int):
        """Initialize the Shopping Repository with a database session and user ID.

        Args:
            session: SQLAlchemy database session
            user_id: The ID of the current user for multi-tenant isolation
        """
        self.session = session
        self.user_id = user_id

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

    def aggregate_ingredients(
        self,
        recipe_ids: List[int],
        category_filter: Optional[str] = None
    ) -> List[ShoppingItem]:
        """
        Aggregate ingredients from recipes into shopping items.
        Groups by (ingredient_id, dimension) to properly handle different unit types.
        Tracks which recipes contribute to each ingredient.

        Args:
            recipe_ids (List[int]): List of recipe IDs to aggregate ingredients from.
            category_filter (Optional[str]): If provided, only include ingredients
                matching this category (e.g., "produce").

        Returns:
            List[ShoppingItem]: List of aggregated ShoppingItem objects with recipe_sources populated.
        """
        recipe_ingredients = self.get_recipe_ingredients(recipe_ids)

        # aggregate by (ingredient_id, dimension) to separate mass/volume/count
        aggregation: Dict[Tuple[int, str], Dict[str, Any]] = defaultdict(lambda: {
            "base_quantity": 0.0,
            "dimension": None,
            "original_unit": None,
            "category": None,
            "name": None,
            "recipe_names": set(),  # track contributing recipes
        })

        for ri in recipe_ingredients:
            ingredient: Ingredient = ri.ingredient

            # Skip if category filter doesn't match
            if category_filter and ingredient.ingredient_category != category_filter:
                continue

            dimension = get_dimension(ri.unit)
            key = (ri.ingredient_id, dimension)

            # convert to base unit for aggregation
            base_qty, _ = to_base_unit(ri.quantity or 0.0, ri.unit)

            data = aggregation[key]
            data["name"] = ingredient.ingredient_name
            data["category"] = ingredient.ingredient_category
            data["dimension"] = dimension
            data["original_unit"] = ri.unit or data["original_unit"]
            data["base_quantity"] += base_qty
            data["recipe_names"].add(ri.recipe.recipe_name)  # track recipe source

        # convert to ShoppingItem objects
        items: List[ShoppingItem] = []
        conversion_service = UnitConversionService(self.session, self.user_id)

        for data in aggregation.values():
            # convert from base unit to display unit
            display_qty, display_unit = to_display_unit(
                data["base_quantity"], data["dimension"], data["original_unit"]
            )

            # apply ingredient-specific conversion rules (e.g., butter tbs -> sticks)
            display_qty, display_unit = conversion_service.apply_conversion(
                data["name"], display_qty, display_unit
            )

            # create state key using dimension for persistence
            state_key = ShoppingState.create_key(data["name"], data["dimension"])

            item = ShoppingItem(
                ingredient_name=data["name"],
                quantity=display_qty,
                unit=display_unit,
                category=data["category"],
                source="recipe",
                have=False,
                state_key=state_key,
                recipe_sources=sorted(list(data["recipe_names"]))  # store as sorted list
            )
            items.append(item)

        return items

    def get_ingredient_breakdown(
            self,
            recipe_ids: List[int]
        ) -> Dict[str, List[Tuple[str, float, str, int]]]:
        """
        Get detailed breakdown of ingredients used in recipes.
        Groups by (ingredient, dimension) to properly handle different unit types.

        Args:
            recipe_ids (List[int]): List of recipe IDs to get breakdown for.

        Returns:
            Dict[str, List[Tuple[str, float, str, int]]]: Breakdown by ingredient key.
                Each tuple is (recipe_name, quantity, unit, usage_count).
        """
        recipe_ingredients = self.get_recipe_ingredients(recipe_ids)
        breakdown: Dict[str, List[Tuple[str, float, str, int]]] = defaultdict(list)

        # Aggregate by (ingredient, dimension, recipe) to combine duplicate recipes
        # Key: (ingredient_name, dimension, recipe_name)
        recipe_aggregation: Dict[Tuple[str, str, str], Dict[str, Any]] = defaultdict(lambda: {
            "base_quantity": 0.0,
            "dimension": None,
            "original_unit": None,
            "usage_count": 0,
        })

        for ri in recipe_ingredients:
            ingredient = ri.ingredient
            recipe = ri.recipe
            dimension = get_dimension(ri.unit)

            # convert to base unit for aggregation
            base_qty, _ = to_base_unit(ri.quantity or 0.0, ri.unit)

            agg_key = (ingredient.ingredient_name, dimension, recipe.recipe_name)
            data = recipe_aggregation[agg_key]
            data["base_quantity"] += base_qty
            data["dimension"] = dimension
            data["original_unit"] = ri.unit or data["original_unit"]
            data["usage_count"] += 1

        # Convert aggregated data to the expected format
        for (ingredient_name, dimension, recipe_name), data in recipe_aggregation.items():
            # convert from base unit to display unit
            display_qty, display_unit = to_display_unit(
                data["base_quantity"], data["dimension"], data["original_unit"]
            )

            # create breakdown key using dimension for state persistence
            ingredient_key = ShoppingState.create_key(ingredient_name, dimension)
            breakdown[ingredient_key].append((recipe_name, display_qty, display_unit, data["usage_count"]))

        return breakdown

    # ── Shopping Item CRUD Operations ───────────────────────────────────────────────────────────────────────
    def create_shopping_item(self, shopping_item: ShoppingItem, user_id: int) -> ShoppingItem:
        """
        Create and persist a new shopping item for a user.

        Args:
            shopping_item (ShoppingItem): Shopping item to create.
            user_id (int): ID of the user who owns this shopping item.

        Returns:
            ShoppingItem: Created shopping item with assigned ID.
        """
        shopping_item.user_id = user_id
        self.session.add(shopping_item)
        # flush to assign primary key and persist the new item
        self.session.flush()
        self.session.refresh(shopping_item)
        return shopping_item

    def add_manual_item(self, shopping_item: ShoppingItem, user_id: int) -> ShoppingItem:
        """
        Alias to create a manual shopping item for a user.
        """
        return self.create_shopping_item(shopping_item, user_id)

    def create_shopping_items_from_recipes(self, recipe_ids: List[int], user_id: int) -> List[ShoppingItem]:
        """
        Create and persist shopping items aggregated from given recipes for a user.
        """
        created_items: List[ShoppingItem] = []
        recipe_items = self.aggregate_ingredients(recipe_ids)
        for item in recipe_items:
            created = self.create_shopping_item(item, user_id)
            created_items.append(created)
        return created_items

    def get_shopping_item_by_id(self, item_id: int, user_id: Optional[int] = None) -> Optional[ShoppingItem]:
        """
        Get a shopping item by ID.

        Args:
            item_id (int): ID of the shopping item.
            user_id (Optional[int]): If provided, only return the item if it belongs to this user.
                Returns None if the item exists but belongs to a different user (no existence leak).

        Returns:
            Optional[ShoppingItem]: Shopping item or None if not found/not owned.
        """
        stmt = select(ShoppingItem).where(ShoppingItem.id == item_id)
        if user_id is not None:
            stmt = stmt.where(ShoppingItem.user_id == user_id)
        result = self.session.execute(stmt)
        return result.scalar_one_or_none()

    def update_item_status(self, item_id: int, have: bool, user_id: int) -> bool:
        """
        Update the 'have' status of a shopping item by ID if owned by user.
        """
        item = self.get_shopping_item_by_id(item_id, user_id)
        if not item:
            return False
        item.have = have
        return True

    def get_all_shopping_items(self, user_id: int, source: Optional[str] = None) -> List[ShoppingItem]:
        """
        Get all shopping items for a user, optionally filtered by source.

        Args:
            user_id (int): ID of the user whose shopping items to retrieve.
            source (Optional[str]): Filter by source ("recipe" or "manual").

        Returns:
            List[ShoppingItem]: List of shopping items belonging to the user.
        """
        stmt = select(ShoppingItem).where(ShoppingItem.user_id == user_id)
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

    def delete_item(self, item_id: int, user_id: int) -> bool:
        """
        Delete a shopping item by ID if owned by user.

        Args:
            item_id (int): ID of the shopping item to delete.
            user_id (int): ID of the user who owns the item.

        Returns:
            bool: True if deleted, False if not found/not owned.
        """
        stmt = (
            select(ShoppingItem)
            .where(ShoppingItem.id == item_id)
            .where(ShoppingItem.user_id == user_id)
        )
        result = self.session.execute(stmt)
        item = result.scalar_one_or_none()

        if item:
            self.session.delete(item)
            # flush to persist deletion immediately
            self.session.flush()
            return True
        return False

    def clear_shopping_items(self, user_id: int, source: Optional[str] = None) -> int:
        """
        Clear shopping items for a user, optionally filtered by source.

        Args:
            user_id (int): ID of the user whose items to clear.
            source (Optional[str]): Clear only items from this source.

        Returns:
            int: Number of items deleted.
        """
        stmt = delete(ShoppingItem).where(ShoppingItem.user_id == user_id)
        if source:
            stmt = stmt.where(ShoppingItem.source == source)

        result = self.session.execute(stmt)
        return result.rowcount

    def clear_recipe_items(self, user_id: int) -> int:
        """
        Clear all recipe-generated shopping items for a user.
        """
        return self.clear_shopping_items(user_id, source="recipe")

    # ── Shopping Item Search and Filter ─────────────────────────────────────────────────────────────────────
    def search_shopping_items(
        self,
        user_id: int,
        search_term: Optional[str] = None,
        source: Optional[str] = None,
        category: Optional[str] = None,
        have: Optional[bool] = None,
        limit: Optional[int] = None,
        offset: Optional[int] = None
        ) -> List[ShoppingItem]:
        """
        Search shopping items with filters for a specific user.

        Args:
            user_id (int): ID of the user whose items to search.
            search_term (Optional[str]): Search in ingredient names.
            source (Optional[str]): Filter by source.
            category (Optional[str]): Filter by category.
            have (Optional[bool]): Filter by have status.
            limit (Optional[int]): Limit results.
            offset (Optional[int]): Offset for pagination.

        Returns:
            List[ShoppingItem]: Filtered shopping items belonging to the user.
        """
        stmt = select(ShoppingItem).where(ShoppingItem.user_id == user_id)

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
    def get_shopping_state(self, key: str, user_id: int) -> Optional[ShoppingState]:
        """
        Get shopping state by key for a specific user.

        Args:
            key (str): State key.
            user_id (int): ID of the user whose state to retrieve.

        Returns:
            Optional[ShoppingState]: Shopping state or None if not found.
        """
        normalized_key = ShoppingState.normalize_key(key)
        stmt = (
            select(ShoppingState)
            .where(ShoppingState.user_id == user_id)
            .where(ShoppingState.key == normalized_key)
        )
        result = self.session.execute(stmt)
        return result.scalar_one_or_none()

    def get_shopping_states_batch(self, keys: List[str], user_id: int) -> Dict[str, ShoppingState]:
        """
        Get multiple shopping states by keys in a single query for a specific user.

        Args:
            keys (List[str]): List of state keys.
            user_id (int): ID of the user whose states to retrieve.

        Returns:
            Dict[str, ShoppingState]: Mapping from normalized key to ShoppingState.
        """
        if not keys:
            return {}
        normalized_keys = [ShoppingState.normalize_key(k) for k in keys]
        stmt = (
            select(ShoppingState)
            .where(ShoppingState.user_id == user_id)
            .where(ShoppingState.key.in_(normalized_keys))
        )
        result = self.session.execute(stmt)
        states = result.scalars().all()
        return {state.key: state for state in states}

    def save_shopping_state(
            self,
            key: str,
            quantity: float,
            unit: str,
            checked: bool,
            user_id: int,
            flagged: bool = False
        ) -> ShoppingState:
        """
        Save or update shopping state for a specific user.

        Args:
            key (str): State key.
            quantity (float): Quantity.
            unit (str): Unit.
            checked (bool): Checked status.
            user_id (int): ID of the user who owns this state.
            flagged (bool): Flagged status.

        Returns:
            ShoppingState: Saved shopping state.
        """
        normalized_key = ShoppingState.normalize_key(key)

        # try to get existing state for this user
        existing_state = self.get_shopping_state(normalized_key, user_id)

        if existing_state:
            # update existing state
            existing_state.quantity = quantity
            existing_state.unit = unit
            existing_state.checked = checked
            existing_state.flagged = flagged
            # flush so updates land before we refresh/read them back
            self.session.flush()
            state = existing_state
        else:
            state = ShoppingState(
                user_id=user_id,
                key=normalized_key,
                quantity=quantity,
                unit=unit,
                checked=checked,
                flagged=flagged
            )
            self.session.add(state)
            # flush to assign primary key and persist the new state
            self.session.flush()

        self.session.refresh(state)
        return state

    def toggle_shopping_state(self, key: str, user_id: int) -> Optional[bool]:
        """
        Toggle the checked status of a shopping state for a specific user.

        Args:
            key (str): State key.
            user_id (int): ID of the user whose state to toggle.

        Returns:
            Optional[bool]: New checked status or None if not found.
        """
        state = self.get_shopping_state(key, user_id)
        if state:
            state.checked = not state.checked
            return state.checked
        return None

    def clear_shopping_states(self, user_id: int) -> int:
        """
        Clear all shopping states for a specific user.

        Args:
            user_id (int): ID of the user whose states to clear.

        Returns:
            int: Number of states deleted.
        """
        stmt = delete(ShoppingState).where(ShoppingState.user_id == user_id)
        result = self.session.execute(stmt)
        return result.rowcount

    def delete_orphaned_states(self, valid_state_keys: List[str], user_id: int) -> int:
        """
        Delete shopping states that are no longer in the active shopping list for a user.

        Args:
            valid_state_keys (List[str]): List of state keys currently in use.
            user_id (int): ID of the user whose orphaned states to delete.

        Returns:
            int: Number of orphaned states deleted.
        """
        normalized_keys = [ShoppingState.normalize_key(k) for k in valid_state_keys if k]

        if not normalized_keys:
            # If no valid keys, delete ALL states for this user (shopping list is empty)
            stmt = delete(ShoppingState).where(ShoppingState.user_id == user_id)
        else:
            stmt = (
                delete(ShoppingState)
                .where(ShoppingState.user_id == user_id)
                .where(~ShoppingState.key.in_(normalized_keys))
            )

        result = self.session.execute(stmt)
        return result.rowcount

    # ── Utility Methods ─────────────────────────────────────────────────────────────────────────────────────
    def get_shopping_list_summary(self, user_id: int) -> Dict[str, Any]:
        """
        Get summary statistics for the shopping list using SQL COUNT for a specific user.

        Args:
            user_id (int): ID of the user whose summary to retrieve.

        Returns:
            Dict[str, Any]: Summary with counts and categories.
        """
        # Single query with conditional counts - no loading of all items
        stmt = (
            select(
                func.count(ShoppingItem.id).label('total'),
                func.count(case((ShoppingItem.have == True, 1))).label('checked'),
                func.count(case((ShoppingItem.source == 'recipe', 1))).label('recipe'),
                func.count(case((ShoppingItem.source == 'manual', 1))).label('manual')
            )
            .where(ShoppingItem.user_id == user_id)
        )
        result = self.session.execute(stmt).one()

        # Get distinct categories separately (simple indexed query)
        cat_stmt = (
            select(ShoppingItem.category)
            .distinct()
            .where(ShoppingItem.user_id == user_id)
            .where(ShoppingItem.category.isnot(None))
        )
        categories = sorted([row[0] for row in self.session.execute(cat_stmt)])

        total = result.total or 0
        checked = result.checked or 0

        return {
            "total_items": total,
            "checked_items": checked,
            "recipe_items": result.recipe or 0,
            "manual_items": result.manual or 0,
            "categories": categories,
            "completion_percentage": (checked / total * 100) if total > 0 else 0
        }

    def bulk_update_have_status(self, updates: List[Tuple[int, bool]], user_id: int) -> int:
        """
        Bulk update have status for multiple items belonging to a user.

        Args:
            updates (List[Tuple[int, bool]]): List of (item_id, have_status) tuples.
            user_id (int): ID of the user whose items to update.

        Returns:
            int: Number of items updated.
        """
        updated_count = 0
        for item_id, have_status in updates:
            item = self.get_shopping_item_by_id(item_id, user_id)
            if item:
                item.have = have_status
                updated_count += 1


        return updated_count

    def bulk_update_states(self, updates: Dict[str, bool], user_id: int) -> int:
        """
        Bulk update 'checked' status for multiple shopping states by key for a user.
        Args:
            updates: mapping of state key to new checked value.
            user_id: ID of the user whose states to update.
        Returns:
            Number of states updated.
        """
        updated_count = 0
        for key, checked in updates.items():
            state = self.get_shopping_state(key, user_id)
            if state:
                state.checked = checked
                updated_count += 1
        return updated_count
