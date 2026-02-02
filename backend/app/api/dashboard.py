"""API router for dashboard stats."""

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.auth import get_current_user
from app.database.db import get_session
from app.dtos.dashboard_dtos import DashboardStatsDTO
from app.models.planner_entry import PlannerEntry
from app.models.recipe import Recipe
from app.models.shopping_item import ShoppingItem
from app.models.user import User

router = APIRouter()


@router.get("/stats", response_model=DashboardStatsDTO)
def get_dashboard_stats(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> DashboardStatsDTO:
    """
    Get lightweight dashboard statistics using COUNT queries for the current user.

    Returns counts for total recipes, favorites, planned meals, and shopping items.
    Much faster than fetching full objects.
    """
    user_id = current_user.id

    # Count all recipes for user
    total_recipes = (
        session.query(func.count(Recipe.id))
        .filter(Recipe.user_id == user_id)
        .scalar() or 0
    )

    # Count favorite recipes for user
    favorites = (
        session.query(func.count(Recipe.id))
        .filter(Recipe.user_id == user_id)
        .filter(Recipe.is_favorite == True)
        .scalar() or 0
    )

    # Count active planner entries for user (exclude cleared and completed)
    meals_planned = (
        session.query(func.count(PlannerEntry.id))
        .filter(PlannerEntry.user_id == user_id)
        .filter(PlannerEntry.is_cleared == False)
        .filter(PlannerEntry.is_completed == False)
        .scalar() or 0
    )

    # Count shopping items for user
    shopping_items = (
        session.query(func.count(ShoppingItem.id))
        .filter(ShoppingItem.user_id == user_id)
        .scalar() or 0
    )

    return DashboardStatsDTO(
        total_recipes=total_recipes,
        favorites=favorites,
        meals_planned=meals_planned,
        shopping_items=shopping_items,
    )
