"""app/api/meals.py

FastAPI router for meal endpoints.
Handles meal CRUD operations (separate from planner state).
"""

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database.db import get_session
from app.dtos.meal_dtos import (
    MealCreateDTO,
    MealFilterDTO,
    MealResponseDTO,
    MealUpdateDTO,
)
from app.services.meal_service import (
    InvalidRecipeError,
    MealSaveError,
    MealService,
)

router = APIRouter()


@router.get("", response_model=List[MealResponseDTO])
def list_meals(
    name_pattern: Optional[str] = Query(None, description="Search by meal name"),
    tags: Optional[str] = Query(None, description="Comma-separated list of tags"),
    favorites_only: bool = Query(False, description="Filter to favorites only"),
    saved: Optional[bool] = Query(None, description="Filter by saved status (true=saved, false=transient, omit=all)"),
    limit: Optional[int] = Query(None, ge=1, le=100),
    offset: Optional[int] = Query(None, ge=0),
    session: Session = Depends(get_session),
):
    """
    List meals with optional filters.

    Filters are stackable (AND logic):
    - name_pattern: Case-insensitive name search
    - tags: Comma-separated, meals must have ALL specified tags
    - favorites_only: Filter to favorites
    - saved: Filter by saved status (true=saved only, false=transient only)
    """
    # Parse tags if provided
    tag_list = None
    if tags:
        tag_list = [t.strip() for t in tags.split(",") if t.strip()]

    filter_dto = MealFilterDTO(
        name_pattern=name_pattern,
        tags=tag_list,
        favorites_only=favorites_only,
        saved_only=saved,
        limit=limit,
        offset=offset,
    )

    service = MealService(session)
    return service.filter_meals(filter_dto)


@router.get("/favorites", response_model=List[MealResponseDTO])
def get_favorites(session: Session = Depends(get_session)):
    """Get all favorite meals."""
    service = MealService(session)
    return service.get_favorite_meals()


@router.get("/by-recipe/{recipe_id}", response_model=List[MealResponseDTO])
def get_meals_by_recipe(recipe_id: int, session: Session = Depends(get_session)):
    """Get all meals that contain a specific recipe (main or side)."""
    service = MealService(session)
    return service.get_meals_by_recipe(recipe_id)


@router.get("/{meal_id}", response_model=MealResponseDTO)
def get_meal(meal_id: int, session: Session = Depends(get_session)):
    """Get a single meal by ID."""
    service = MealService(session)
    meal = service.get_meal(meal_id)
    if not meal:
        raise HTTPException(status_code=404, detail="Meal not found")
    return meal


@router.post("", response_model=MealResponseDTO, status_code=201)
def create_meal(
    meal_data: MealCreateDTO,
    session: Session = Depends(get_session),
):
    """
    Create a new meal.

    - meal_name: Required, 1-255 characters
    - main_recipe_id: Required, must exist
    - side_recipe_ids: Optional, max 3, maintains order
    - is_favorite: Optional, defaults to false
    - tags: Optional list of strings
    """
    service = MealService(session)
    try:
        return service.create_meal(meal_data)
    except InvalidRecipeError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except MealSaveError as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{meal_id}", response_model=MealResponseDTO)
def update_meal(
    meal_id: int,
    update_data: MealUpdateDTO,
    session: Session = Depends(get_session),
):
    """Update an existing meal."""
    service = MealService(session)
    try:
        meal = service.update_meal(meal_id, update_data)
        if not meal:
            raise HTTPException(status_code=404, detail="Meal not found")
        return meal
    except InvalidRecipeError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except MealSaveError as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{meal_id}")
def delete_meal(meal_id: int, session: Session = Depends(get_session)):
    """
    Delete a meal.

    Note: This will CASCADE delete any planner entries referencing this meal.
    """
    service = MealService(session)
    if not service.delete_meal(meal_id):
        raise HTTPException(status_code=404, detail="Meal not found")
    return {"message": "Meal deleted successfully"}


@router.post("/{meal_id}/favorite", response_model=MealResponseDTO)
def toggle_favorite(meal_id: int, session: Session = Depends(get_session)):
    """Toggle the favorite status of a meal."""
    service = MealService(session)
    meal = service.toggle_favorite(meal_id)
    if not meal:
        raise HTTPException(status_code=404, detail="Meal not found")
    return meal


@router.post("/{meal_id}/save", response_model=MealResponseDTO)
def toggle_save(meal_id: int, session: Session = Depends(get_session)):
    """
    Toggle the saved status of a meal.

    Saved meals persist permanently.
    Unsaved (transient) meals are deleted when they leave the planner.
    """
    service = MealService(session)
    meal = service.toggle_save(meal_id)
    if not meal:
        raise HTTPException(status_code=404, detail="Meal not found")
    return meal


@router.post("/{meal_id}/sides/{recipe_id}", response_model=MealResponseDTO)
def add_side_recipe(
    meal_id: int,
    recipe_id: int,
    session: Session = Depends(get_session),
):
    """
    Add a side recipe to a meal.

    Maximum of 3 side recipes allowed.
    """
    service = MealService(session)
    try:
        meal = service.add_side_recipe(meal_id, recipe_id)
        if not meal:
            raise HTTPException(status_code=404, detail="Meal not found")
        return meal
    except InvalidRecipeError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except MealSaveError as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{meal_id}/sides/{recipe_id}", response_model=MealResponseDTO)
def remove_side_recipe(
    meal_id: int,
    recipe_id: int,
    session: Session = Depends(get_session),
):
    """Remove a side recipe from a meal."""
    service = MealService(session)
    try:
        meal = service.remove_side_recipe(meal_id, recipe_id)
        if not meal:
            raise HTTPException(status_code=404, detail="Meal not found")
        return meal
    except MealSaveError as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{meal_id}/sides/reorder", response_model=MealResponseDTO)
def reorder_side_recipes(
    meal_id: int,
    side_recipe_ids: List[int],
    session: Session = Depends(get_session),
):
    """
    Reorder the side recipes of a meal.

    The provided list must contain the same recipe IDs as the current sides.
    """
    service = MealService(session)
    try:
        meal = service.reorder_side_recipes(meal_id, side_recipe_ids)
        if not meal:
            raise HTTPException(status_code=404, detail="Meal not found")
        return meal
    except InvalidRecipeError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except MealSaveError as e:
        raise HTTPException(status_code=500, detail=str(e))
