"""API router for dashboard stats."""

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database.db import get_session
from app.dtos.dashboard_dtos import DashboardStatsDTO
from app.models.recipe import Recipe
from app.models.planner_entry import PlannerEntry
from app.models.shopping_item import ShoppingItem

router = APIRouter()


@router.get("/stats", response_model=DashboardStatsDTO)
def get_dashboard_stats(session: Session = Depends(get_session)) -> DashboardStatsDTO:
    """
    Get lightweight dashboard statistics using COUNT queries.

    Returns counts for total recipes, favorites, planned meals, and shopping items.
    Much faster than fetching full objects.
    """
    # Count all recipes
    total_recipes = session.query(func.count(Recipe.id)).scalar() or 0

    # Count favorite recipes
    favorites = session.query(func.count(Recipe.id)).filter(Recipe.is_favorite == True).scalar() or 0

    # Count planner entries (all entries, not just active)
    meals_planned = session.query(func.count(PlannerEntry.id)).scalar() or 0

    # Count shopping items
    shopping_items = session.query(func.count(ShoppingItem.id)).scalar() or 0

    return DashboardStatsDTO(
        total_recipes=total_recipes,
        favorites=favorites,
        meals_planned=meals_planned,
        shopping_items=shopping_items,
    )
