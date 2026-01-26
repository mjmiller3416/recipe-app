"""Build user context data for Meal Genie prompts.

This module aggregates user data (recipes, meal plan, shopping list) into
structured data that can be used with the config's build_user_context_prompt().
"""

from typing import Dict, List, Optional
from sqlalchemy.orm import Session

from app.repositories.recipe_repo import RecipeRepo
from app.repositories.planner_repo import PlannerRepo
from app.repositories.shopping_repo import ShoppingRepo
from app.dtos.recipe_dtos import RecipeFilterDTO


class UserContextBuilder:
    """Builds structured user context data for AI prompts."""

    def __init__(self, session: Session, user_id: int):
        """Initialize with database session and user ID."""
        self.session = session
        self.user_id = user_id
        self.recipe_repo = RecipeRepo(session)
        self.planner_repo = PlannerRepo(session)
        self.shopping_repo = ShoppingRepo(session)

    def build_context_data(
        self,
        include_ingredients: bool = False,
        include_shopping_list: bool = False,
    ) -> dict:
        """
        Build structured context data dict.

        This returns a dict that can be passed to build_user_context_prompt()
        in meal_genie_config.py.

        Args:
            include_ingredients: Whether to include recipe ingredients.
            include_shopping_list: Whether to include shopping list.

        Returns:
            Dict with saved_recipes, meal_plan, and optionally
            recipe_ingredients and shopping_list.
        """
        data: Dict[str, any] = {
            "saved_recipes": self._get_saved_recipes(),
            "meal_plan": self._get_meal_plan(),
        }

        if include_ingredients:
            data["recipe_ingredients"] = self._get_recipe_ingredients()

        if include_shopping_list:
            data["shopping_list"] = self._get_shopping_list()

        return data

    def build_context(self, include_shopping_list: bool = False) -> str:
        """
        Build complete user context string (legacy method for backwards compat).

        Args:
            include_shopping_list: Whether to include shopping list in context.

        Returns:
            Formatted context string with recipes, meal plan, and optionally shopping list.
        """
        sections: List[str] = []

        recipes_context = self._build_recipes_context()
        if recipes_context:
            sections.append(recipes_context)

        meal_plan_context = self._build_meal_plan_context()
        if meal_plan_context:
            sections.append(meal_plan_context)

        if include_shopping_list:
            shopping_context = self._build_shopping_context()
            if shopping_context:
                sections.append(shopping_context)

        if not sections:
            return ""

        return "\n\n".join(sections)

    def _get_saved_recipes(self) -> List[dict]:
        """Get saved recipes limited to 30 (favorites + 20 recent).

        This prevents context window bloat while still providing useful data.
        """
        filter_dto = RecipeFilterDTO()
        all_recipes = self.recipe_repo.filter_recipes(filter_dto, self.user_id)

        if not all_recipes:
            return []

        # Sort by created_at desc (most recent first)
        all_recipes.sort(
            key=lambda r: r.created_at,
            reverse=True,
        )

        # Take all favorites + top 20 non-favorites
        favorites = [r for r in all_recipes if r.is_favorite]
        others = [r for r in all_recipes if not r.is_favorite][:20]

        # Combine and limit to ~30
        display_recipes = (favorites + others)[:30]

        return [
            {
                "name": r.recipe_name,
                "category": r.recipe_category,
                "meal_type": r.meal_type,
                "total_time": r.total_time,
                "is_favorite": r.is_favorite,
            }
            for r in display_recipes
        ]

    def _get_recipe_ingredients(self) -> Dict[str, List[str]]:
        """Get ingredients for each recipe (for ingredient-based queries)."""
        filter_dto = RecipeFilterDTO()
        recipes = self.recipe_repo.filter_recipes(filter_dto, self.user_id)
        result: Dict[str, List[str]] = {}

        for recipe in recipes:
            if recipe.ingredients:
                ingredients = [
                    ri.ingredient.ingredient_name
                    for ri in recipe.ingredients
                    if ri.ingredient
                ]
                if ingredients:
                    result[recipe.recipe_name] = ingredients

        return result

    def _get_meal_plan(self) -> List[dict]:
        """Get current meal plan entries."""
        entries = self.planner_repo.get_incomplete_entries(self.user_id)

        return [
            {
                "meal_name": entry.meal.meal_name if entry.meal else "Unknown",
                "main_recipe_name": (
                    entry.meal.main_recipe.recipe_name
                    if entry.meal and entry.meal.main_recipe
                    else "Unknown"
                ),
            }
            for entry in entries
        ]

    def _get_shopping_list(self) -> dict:
        """Get shopping list split by have/need."""
        items = self.shopping_repo.get_all_shopping_items(self.user_id)
        return {
            "need": [i.ingredient_name for i in items if not i.have],
            "have": [i.ingredient_name for i in items if i.have],
        }

    # Legacy methods for backwards compatibility with old config
    def _build_recipes_context(self) -> str:
        """Build saved recipes summary (legacy format)."""
        filter_dto = RecipeFilterDTO()
        recipes = self.recipe_repo.filter_recipes(filter_dto, self.user_id)

        if not recipes:
            return ""

        lines = ["USER'S SAVED RECIPES:"]
        for r in recipes:
            fav = " [FAVORITE]" if r.is_favorite else ""
            time_str = f", {r.total_time}min" if r.total_time else ""
            lines.append(
                f"- {r.recipe_name} ({r.recipe_category}, {r.meal_type}{time_str}){fav}"
            )

        return "\n".join(lines)

    def _build_meal_plan_context(self) -> str:
        """Build current meal plan summary (legacy format)."""
        entries = self.planner_repo.get_incomplete_entries(self.user_id)

        if not entries:
            return ""

        lines = ["CURRENT MEAL PLAN (upcoming meals):"]
        for entry in entries:
            meal = entry.meal
            recipe_name = (
                meal.main_recipe.recipe_name if meal.main_recipe else "Unknown"
            )
            lines.append(f"- {meal.meal_name}: {recipe_name}")

        return "\n".join(lines)

    def _build_shopping_context(self) -> str:
        """Build shopping list summary (legacy format)."""
        items = self.shopping_repo.get_all_shopping_items(self.user_id)

        if not items:
            return ""

        need = [i.ingredient_name for i in items if not i.have]
        have = [i.ingredient_name for i in items if i.have]

        lines = ["SHOPPING LIST:"]
        if need:
            lines.append(f"Need to buy: {', '.join(need)}")
        if have:
            lines.append(f"Already have: {', '.join(have)}")

        return "\n".join(lines)
