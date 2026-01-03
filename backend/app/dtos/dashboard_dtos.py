"""DTOs for dashboard stats."""

from pydantic import BaseModel


class DashboardStatsDTO(BaseModel):
    """Response DTO for dashboard statistics."""

    total_recipes: int
    favorites: int
    meals_planned: int
    shopping_items: int
