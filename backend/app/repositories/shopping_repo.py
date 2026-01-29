"""app/core/repositories/shopping_repo.py

Repository for shopping list operations.
Handles ingredient aggregation, manual items, and contribution management.
"""

# ── Imports ─────────────────────────────────────────────────────────────────────────────────────────────────
from __future__ import annotations

from collections import defaultdict
from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Tuple

from sqlalchemy import and_, case, delete, func, select
from sqlalchemy.orm import Session, joinedload

from ..models.ingredient import Ingredient
from ..models.recipe_ingredient import RecipeIngredient
from ..models.shopping_item import ShoppingItem
from ..models.shopping_item_contribution import ShoppingItemContribution
from ..services.unit_conversion_service import UnitConversionService
from ..utils.unit_conversion import get_dimension, to_base_unit, to_display_unit


# ── Data Classes for Aggregation ────────────────────────────────────────────────────────────────────────────
@dataclass
class AggregatedIngredient:
    """Data class for aggregated ingredient data."""
    name: str
    category: Optional[str]
    dimension: str
    base_quantity: float
    original_unit: Optional[str]
    recipe_ids: set  # Set of recipe IDs that contribute


@dataclass
class ContributionData:
    """Data class for a single contribution to a shopping item."""
    recipe_id: int
    planner_entry_id: int
    base_quantity: float
    dimension: str
    original_unit: str | None = None


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

    def aggregate_ingredients_for_entry(
        self,
        recipe_ids: List[int],
        planner_entry_id: int,
        category_filter: Optional[str] = None
    ) -> Dict[str, List[ContributionData]]:
        """
        Aggregate ingredients from recipes for a single planner entry.
        Returns contribution data grouped by aggregation_key.

        Args:
            recipe_ids: List of recipe IDs in this entry
            planner_entry_id: The planner entry ID
            category_filter: If provided, only include ingredients matching this category

        Returns:
            Dict mapping aggregation_key to list of ContributionData
        """
        recipe_ingredients = self.get_recipe_ingredients(recipe_ids)
        contributions: Dict[str, List[ContributionData]] = defaultdict(list)

        for ri in recipe_ingredients:
            ingredient: Ingredient = ri.ingredient

            # Skip if category filter doesn't match
            if category_filter and ingredient.ingredient_category != category_filter:
                continue

            dimension = get_dimension(ri.unit)
            agg_key = ShoppingItem.make_aggregation_key(ingredient.ingredient_name, dimension)

            # Convert to base unit for aggregation
            base_qty, _ = to_base_unit(ri.quantity or 0.0, ri.unit)

            contributions[agg_key].append(ContributionData(
                recipe_id=ri.recipe_id,
                planner_entry_id=planner_entry_id,
                base_quantity=base_qty,
                dimension=dimension,
                original_unit=ri.unit
            ))

        return contributions

    def aggregate_ingredients(
        self,
        recipe_ids: List[int],
        category_filter: Optional[str] = None
    ) -> List[AggregatedIngredient]:
        """
        Aggregate ingredients from recipes into AggregatedIngredient objects.
        Groups by (ingredient_name, dimension) to properly handle different unit types.

        Args:
            recipe_ids: List of recipe IDs to aggregate ingredients from.
            category_filter: If provided, only include ingredients matching this category.

        Returns:
            List of AggregatedIngredient objects.
        """
        recipe_ingredients = self.get_recipe_ingredients(recipe_ids)

        # Aggregate by (ingredient_name, dimension)
        aggregation: Dict[str, AggregatedIngredient] = {}

        for ri in recipe_ingredients:
            ingredient: Ingredient = ri.ingredient

            # Skip if category filter doesn't match
            if category_filter and ingredient.ingredient_category != category_filter:
                continue

            dimension = get_dimension(ri.unit)
            agg_key = ShoppingItem.make_aggregation_key(ingredient.ingredient_name, dimension)

            # Convert to base unit for aggregation
            base_qty, _ = to_base_unit(ri.quantity or 0.0, ri.unit)

            if agg_key not in aggregation:
                aggregation[agg_key] = AggregatedIngredient(
                    name=ingredient.ingredient_name,
                    category=ingredient.ingredient_category,
                    dimension=dimension,
                    base_quantity=0.0,
                    original_unit=ri.unit,
                    recipe_ids=set()
                )

            data = aggregation[agg_key]
            data.base_quantity += base_qty
            data.original_unit = ri.unit or data.original_unit
            data.recipe_ids.add(ri.recipe_id)

        return list(aggregation.values())

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

            # create breakdown key using dimension
            ingredient_key = ShoppingItem.make_aggregation_key(ingredient_name, dimension)
            breakdown[ingredient_key].append((recipe_name, display_qty, display_unit, data["usage_count"]))

        return breakdown

    # ── Shopping Item CRUD Operations ───────────────────────────────────────────────────────────────────────
    def create_shopping_item(self, shopping_item: ShoppingItem, user_id: Optional[int] = None) -> ShoppingItem:
        """
        Create and persist a new shopping item for a user.

        Args:
            shopping_item (ShoppingItem): Shopping item to create.
            user_id (Optional[int]): ID of the user who owns this shopping item. If not provided, uses self.user_id.

        Returns:
            ShoppingItem: Created shopping item with assigned ID.
        """
        shopping_item.user_id = user_id if user_id is not None else self.user_id
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

    def get_shopping_item_by_id(self, item_id: int, user_id: Optional[int] = None) -> Optional[ShoppingItem]:
        """
        Get a shopping item by ID.

        Args:
            item_id (int): ID of the shopping item.
            user_id (Optional[int]): If provided, only return the item if it belongs to this user.
                Returns None if the item exists but belongs to a different user (no existence leak).
                If not provided, uses self.user_id.

        Returns:
            Optional[ShoppingItem]: Shopping item or None if not found/not owned.
        """
        effective_user_id = user_id if user_id is not None else self.user_id
        stmt = select(ShoppingItem).where(
            ShoppingItem.id == item_id,
            ShoppingItem.user_id == effective_user_id
        )
        result = self.session.execute(stmt)
        return result.scalar_one_or_none()

    def get_shopping_item_by_aggregation_key(self, aggregation_key: str) -> Optional[ShoppingItem]:
        """
        Get a shopping item by its aggregation key.

        Args:
            aggregation_key: The aggregation key to look up.

        Returns:
            ShoppingItem or None if not found.
        """
        normalized_key = aggregation_key.lower().strip()
        stmt = select(ShoppingItem).where(
            ShoppingItem.aggregation_key == normalized_key,
            ShoppingItem.user_id == self.user_id
        )
        result = self.session.execute(stmt)
        return result.scalar_one_or_none()

    def get_recipe_items_with_contributions(self) -> List[ShoppingItem]:
        """
        Get all recipe-source shopping items with their contributions eagerly loaded.

        Returns:
            List of ShoppingItem with contributions loaded.
        """
        stmt = select(ShoppingItem).where(
            ShoppingItem.source == "recipe",
            ShoppingItem.user_id == self.user_id
        ).options(
            joinedload(ShoppingItem.contributions)
        )
        result = self.session.execute(stmt)
        return result.scalars().unique().all()

    def get_items_by_aggregation_keys(self, keys: List[str]) -> Dict[str, ShoppingItem]:
        """
        Get multiple shopping items by their aggregation keys.

        Args:
            keys: List of aggregation keys.

        Returns:
            Dict mapping normalized key to ShoppingItem.
        """
        if not keys:
            return {}

        normalized_keys = [k.lower().strip() for k in keys]
        stmt = select(ShoppingItem).where(
            ShoppingItem.aggregation_key.in_(normalized_keys),
            ShoppingItem.user_id == self.user_id
        ).options(
            joinedload(ShoppingItem.contributions)
        )
        result = self.session.execute(stmt)
        items = result.scalars().unique().all()
        return {item.aggregation_key: item for item in items if item.aggregation_key}

    def update_item_status(self, item_id: int, have: bool, user_id: Optional[int] = None) -> bool:
        """
        Update the 'have' status of a shopping item by ID if owned by user.
        """
        effective_user_id = user_id if user_id is not None else self.user_id
        item = self.get_shopping_item_by_id(item_id, effective_user_id)
        if not item:
            return False
        item.have = have
        return True

    def get_all_shopping_items(self, user_id: Optional[int] = None, source: Optional[str] = None) -> List[ShoppingItem]:
        """
        Get all shopping items for a user, optionally filtered by source.

        Args:
            user_id (Optional[int]): ID of the user whose shopping items to retrieve. Defaults to self.user_id.
            source (Optional[str]): Filter by source ("recipe" or "manual").

        Returns:
            List[ShoppingItem]: List of shopping items belonging to the user.
        """
        effective_user_id = user_id if user_id is not None else self.user_id
        stmt = select(ShoppingItem).where(ShoppingItem.user_id == effective_user_id)
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

    def delete_item(self, item_id: int, user_id: Optional[int] = None) -> bool:
        """
        Delete a shopping item by ID if owned by user.

        Args:
            item_id (int): ID of the shopping item to delete.
            user_id (Optional[int]): ID of the user who owns the item. Defaults to self.user_id.

        Returns:
            bool: True if deleted, False if not found/not owned.
        """
        effective_user_id = user_id if user_id is not None else self.user_id
        stmt = (
            select(ShoppingItem)
            .where(ShoppingItem.id == item_id)
            .where(ShoppingItem.user_id == effective_user_id)
        )
        result = self.session.execute(stmt)
        item = result.scalar_one_or_none()

        if item:
            self.session.delete(item)
            # flush to persist deletion immediately
            self.session.flush()
            return True
        return False

    def clear_shopping_items(self, user_id: Optional[int] = None, source: Optional[str] = None) -> int:
        """
        Clear shopping items for a user, optionally filtered by source.

        Args:
            user_id (Optional[int]): ID of the user whose items to clear. Defaults to self.user_id.
            source (Optional[str]): Clear only items from this source.

        Returns:
            int: Number of items deleted.
        """
        effective_user_id = user_id if user_id is not None else self.user_id
        stmt = delete(ShoppingItem).where(ShoppingItem.user_id == effective_user_id)
        if source:
            stmt = stmt.where(ShoppingItem.source == source)

        result = self.session.execute(stmt)
        return result.rowcount

    def clear_recipe_items(self, user_id: Optional[int] = None) -> int:
        """
        Clear all recipe-generated shopping items for a user.
        """
        effective_user_id = user_id if user_id is not None else self.user_id
        return self.clear_shopping_items(effective_user_id, source="recipe")

    # ── Contribution Management ─────────────────────────────────────────────────────────────────────────────
    def add_contribution(
        self,
        shopping_item_id: int,
        recipe_id: int,
        planner_entry_id: int,
        base_quantity: float,
        dimension: str
    ) -> ShoppingItemContribution:
        """
        Add a contribution to a shopping item.

        Args:
            shopping_item_id: ID of the shopping item
            recipe_id: ID of the recipe
            planner_entry_id: ID of the planner entry
            base_quantity: Quantity in base units
            dimension: Dimension (mass, volume, count, unknown)

        Returns:
            Created ShoppingItemContribution
        """
        contribution = ShoppingItemContribution(
            shopping_item_id=shopping_item_id,
            recipe_id=recipe_id,
            planner_entry_id=planner_entry_id,
            base_quantity=base_quantity,
            dimension=dimension
        )
        self.session.add(contribution)
        self.session.flush()
        return contribution

    def delete_contributions_for_entry(self, planner_entry_id: int) -> int:
        """
        Delete all contributions from a specific planner entry.

        Args:
            planner_entry_id: ID of the planner entry

        Returns:
            Number of contributions deleted
        """
        stmt = delete(ShoppingItemContribution).where(
            ShoppingItemContribution.planner_entry_id == planner_entry_id
        )
        result = self.session.execute(stmt)
        return result.rowcount

    def delete_contributions_for_item(self, shopping_item_id: int) -> int:
        """
        Delete all contributions for a shopping item.

        Args:
            shopping_item_id: ID of the shopping item

        Returns:
            Number of contributions deleted
        """
        stmt = delete(ShoppingItemContribution).where(
            ShoppingItemContribution.shopping_item_id == shopping_item_id
        )
        result = self.session.execute(stmt)
        return result.rowcount

    def get_contributions_by_entry(self, planner_entry_id: int) -> List[ShoppingItemContribution]:
        """
        Get all contributions from a specific planner entry.

        Args:
            planner_entry_id: ID of the planner entry

        Returns:
            List of contributions
        """
        stmt = select(ShoppingItemContribution).where(
            ShoppingItemContribution.planner_entry_id == planner_entry_id
        )
        result = self.session.execute(stmt)
        return result.scalars().all()

    def get_items_without_contributions(self) -> List[ShoppingItem]:
        """
        Get recipe items that have no contributions (orphans to be deleted).

        Returns:
            List of ShoppingItem with no contributions
        """
        # Subquery to get item IDs with contributions
        has_contributions = select(ShoppingItemContribution.shopping_item_id).distinct()

        stmt = select(ShoppingItem).where(
            and_(
                ShoppingItem.source == "recipe",
                ShoppingItem.user_id == self.user_id,
                ~ShoppingItem.id.in_(has_contributions)
            )
        )
        result = self.session.execute(stmt)
        return result.scalars().all()

    def delete_orphaned_recipe_items(self) -> int:
        """
        Delete recipe items that have no contributions.

        Returns:
            Number of items deleted
        """
        orphans = self.get_items_without_contributions()
        count = 0
        for item in orphans:
            self.session.delete(item)
            count += 1
        if count > 0:
            self.session.flush()
        return count

    # ── Shopping Item Search and Filter ─────────────────────────────────────────────────────────────────────
    def search_shopping_items(
        self,
        user_id: Optional[int] = None,
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
            user_id (Optional[int]): ID of the user whose items to search. Defaults to self.user_id.
            search_term (Optional[str]): Search in ingredient names.
            source (Optional[str]): Filter by source.
            category (Optional[str]): Filter by category.
            have (Optional[bool]): Filter by have status.
            limit (Optional[int]): Limit results.
            offset (Optional[int]): Offset for pagination.

        Returns:
            List[ShoppingItem]: Filtered shopping items belonging to the user.
        """
        effective_user_id = user_id if user_id is not None else self.user_id
        stmt = select(ShoppingItem).where(ShoppingItem.user_id == effective_user_id)

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

    # ── Utility Methods ─────────────────────────────────────────────────────────────────────────────────────
    def get_shopping_list_summary(self, user_id: Optional[int] = None) -> Dict[str, Any]:
        """
        Get summary statistics for the shopping list using SQL COUNT for a specific user.

        Args:
            user_id (Optional[int]): ID of the user whose summary to retrieve. Defaults to self.user_id.

        Returns:
            Dict[str, Any]: Summary with counts and categories.
        """
        effective_user_id = user_id if user_id is not None else self.user_id
        # Single query with conditional counts - no loading of all items
        stmt = (
            select(
                func.count(ShoppingItem.id).label('total'),
                func.count(case((ShoppingItem.have == True, 1))).label('checked'),
                func.count(case((ShoppingItem.source == 'recipe', 1))).label('recipe'),
                func.count(case((ShoppingItem.source == 'manual', 1))).label('manual')
            )
            .where(ShoppingItem.user_id == effective_user_id)
        )
        result = self.session.execute(stmt).one()

        # Get distinct categories separately (simple indexed query)
        cat_stmt = (
            select(ShoppingItem.category)
            .distinct()
            .where(ShoppingItem.user_id == effective_user_id)
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

    def bulk_update_have_status(self, updates: List[Tuple[int, bool]], user_id: Optional[int] = None) -> int:
        """
        Bulk update have status for multiple items belonging to a user.

        Args:
            updates (List[Tuple[int, bool]]): List of (item_id, have_status) tuples.
            user_id (Optional[int]): ID of the user whose items to update. Defaults to self.user_id.

        Returns:
            int: Number of items updated.
        """
        effective_user_id = user_id if user_id is not None else self.user_id
        updated_count = 0
        for item_id, have_status in updates:
            item = self.get_shopping_item_by_id(item_id, effective_user_id)
            if item:
                item.have = have_status
                updated_count += 1

        return updated_count

    def get_recipe_names_for_item(self, item_id: int) -> List[str]:
        """
        Get recipe names that contribute to a shopping item.

        Args:
            item_id: ID of the shopping item

        Returns:
            List of recipe names
        """
        from ..models.recipe import Recipe

        stmt = select(Recipe.recipe_name).distinct().join(
            ShoppingItemContribution,
            ShoppingItemContribution.recipe_id == Recipe.id
        ).where(
            ShoppingItemContribution.shopping_item_id == item_id
        )
        result = self.session.execute(stmt)
        return sorted([row[0] for row in result])
