"""Build user context string for Meal Genie prompts.

This module aggregates user data (recipes, meal plan, shopping list) into a
formatted context string that can be injected into the AI system prompt.
"""

from typing import List
from sqlalchemy.orm import Session

from app.repositories.recipe_repo import RecipeRepo
from app.repositories.planner_repo import PlannerRepo
from app.repositories.shopping_repo import ShoppingRepo
from app.dtos.recipe_dtos import RecipeFilterDTO


class UserContextBuilder:
    """Builds formatted user context for AI prompts."""

    def __init__(self, session: Session):
        """Initialize with database session."""
        self.recipe_repo = RecipeRepo(session)
        self.planner_repo = PlannerRepo(session)
        self.shopping_repo = ShoppingRepo(session)

    def build_context(self) -> str:
        """
        Build complete user context string.

        Returns:
            Formatted context string with recipes, meal plan, and shopping list.
            Returns empty string if no user data exists.
        """
        sections: List[str] = []

        recipes_context = self._build_recipes_context()
        if recipes_context:
            sections.append(recipes_context)

        meal_plan_context = self._build_meal_plan_context()
        if meal_plan_context:
            sections.append(meal_plan_context)

        shopping_context = self._build_shopping_context()
        if shopping_context:
            sections.append(shopping_context)

        if not sections:
            return ""

        return "\n\n".join(sections)

    def _build_recipes_context(self) -> str:
        """Build saved recipes summary."""
        filter_dto = RecipeFilterDTO()
        recipes = self.recipe_repo.filter_recipes(filter_dto)

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
        """Build current meal plan summary."""
        entries = self.planner_repo.get_incomplete_entries()

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
        """Build shopping list summary."""
        items = self.shopping_repo.get_all_shopping_items()

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
