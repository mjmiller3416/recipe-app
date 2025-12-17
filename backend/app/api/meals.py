"""app/api/meals.py

FastAPI router for meal endpoints.
"""

from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database.db import get_session
from app.core.dtos.meal_dtos import (
    MealCreateDTO,
    MealDeletionImpactDTO,
    MealFilterDTO,
    MealResponseDTO,
    MealSideRecipeAddDTO,
    MealSideRecipeReorderDTO,
    MealTagAddDTO,
    MealUpdateDTO,
)
from app.core.services.meal_service import MealService

router = APIRouter()


@router.get("/", response_model=List[MealResponseDTO])
def get_all_meals(session: Session = Depends(get_session)):
    """Get all meals."""
    service = MealService(session)
    return service.get_all_meals()


@router.get("/filter", response_model=List[MealResponseDTO])
def filter_meals(
    name_pattern: str = Query(None, description="Pattern to search in meal names"),
    tags: List[str] = Query(None, description="Tags to filter by (AND logic)"),
    is_favorite: bool = Query(None, description="Filter by favorite status"),
    main_recipe_id: int = Query(None, description="Filter by main recipe ID"),
    contains_recipe_id: int = Query(None, description="Filter by meals containing this recipe"),
    limit: int = Query(None, ge=1, le=100, description="Maximum number of results"),
    offset: int = Query(None, ge=0, description="Number of results to skip"),
    session: Session = Depends(get_session),
):
    """Filter meals based on various criteria."""
    filter_dto = MealFilterDTO(
        name_pattern=name_pattern,
        tags=tags,
        is_favorite=is_favorite,
        main_recipe_id=main_recipe_id,
        contains_recipe_id=contains_recipe_id,
        limit=limit,
        offset=offset
    )
    service = MealService(session)
    return service.filter_meals(filter_dto)


@router.get("/favorites", response_model=List[MealResponseDTO])
def get_favorite_meals(session: Session = Depends(get_session)):
    """Get all favorite meals."""
    service = MealService(session)
    return service.get_favorite_meals()


@router.get("/search", response_model=List[MealResponseDTO])
def search_meals(
    name: str = Query(None, description="Search by meal name"),
    recipe_id: int = Query(None, description="Search by recipe ID (main or side)"),
    tags: List[str] = Query(None, description="Search by tags (AND logic)"),
    session: Session = Depends(get_session),
):
    """Search meals by name, recipe, or tags."""
    service = MealService(session)
    
    if name:
        return service.search_meals_by_name(name)
    elif recipe_id:
        return service.search_meals_by_recipe(recipe_id)
    elif tags:
        return service.get_meals_by_tags(tags)
    else:
        raise HTTPException(
            status_code=400,
            detail="At least one search parameter (name, recipe_id, or tags) is required"
        )


@router.get("/{meal_id}", response_model=MealResponseDTO)
def get_meal(meal_id: int, session: Session = Depends(get_session)):
    """Get a single meal by ID."""
    service = MealService(session)
    meal = service.get_meal(meal_id)
    if not meal:
        raise HTTPException(status_code=404, detail="Meal not found")
    return meal


@router.get("/{meal_id}/deletion-impact", response_model=MealDeletionImpactDTO)
def get_meal_deletion_impact(meal_id: int, session: Session = Depends(get_session)):
    """Get information about what will be affected if this meal is deleted."""
    service = MealService(session)
    impact = service.get_meal_deletion_impact(meal_id)
    if not impact:
        raise HTTPException(status_code=404, detail="Meal not found")
    return impact


@router.post("/", response_model=MealResponseDTO, status_code=201)
def create_meal(
    create_data: MealCreateDTO,
    session: Session = Depends(get_session),
):
    """Create a new meal."""
    service = MealService(session)
    meal = service.create_meal(create_data)
    if not meal:
        raise HTTPException(
            status_code=400,
            detail="Failed to create meal. Check that recipe IDs are valid."
        )
    return meal


@router.put("/{meal_id}", response_model=MealResponseDTO)
def update_meal(
    meal_id: int,
    update_data: MealUpdateDTO,
    session: Session = Depends(get_session),
):
    """Update an existing meal."""
    service = MealService(session)
    meal = service.update_meal(meal_id, update_data)
    if not meal:
        raise HTTPException(
            status_code=404,
            detail="Meal not found or update failed"
        )
    return meal


@router.delete("/{meal_id}")
def delete_meal(meal_id: int, session: Session = Depends(get_session)):
    """Delete a meal."""
    service = MealService(session)
    if not service.delete_meal(meal_id):
        raise HTTPException(status_code=404, detail="Meal not found")
    return {"message": "Meal deleted successfully"}


@router.post("/{meal_id}/side-recipes", response_model=MealResponseDTO)
def add_side_recipe(
    meal_id: int,
    add_data: MealSideRecipeAddDTO,
    session: Session = Depends(get_session),
):
    """Add a side recipe to a meal."""
    service = MealService(session)
    meal = service.add_side_recipe(meal_id, add_data.recipe_id)
    if not meal:
        raise HTTPException(
            status_code=400,
            detail="Failed to add side recipe. Check that meal exists, recipe is valid, and maximum 3 sides not exceeded."
        )
    return meal


@router.delete("/{meal_id}/side-recipes/{recipe_id}", response_model=MealResponseDTO)
def remove_side_recipe(
    meal_id: int,
    recipe_id: int,
    session: Session = Depends(get_session),
):
    """Remove a side recipe from a meal."""
    service = MealService(session)
    meal = service.remove_side_recipe(meal_id, recipe_id)
    if not meal:
        raise HTTPException(
            status_code=404,
            detail="Meal not found or recipe not in side recipes"
        )
    return meal


@router.put("/{meal_id}/side-recipes/reorder", response_model=MealResponseDTO)
def reorder_side_recipes(
    meal_id: int,
    reorder_data: MealSideRecipeReorderDTO,
    session: Session = Depends(get_session),
):
    """Reorder side recipes in a meal."""
    service = MealService(session)
    meal = service.reorder_side_recipes(meal_id, reorder_data.side_recipe_ids)
    if not meal:
        raise HTTPException(
            status_code=400,
            detail="Failed to reorder side recipes. Check that meal exists and all recipe IDs are valid."
        )
    return meal


@router.post("/{meal_id}/tags", response_model=MealResponseDTO)
def add_tag(
    meal_id: int,
    tag_data: MealTagAddDTO,
    session: Session = Depends(get_session),
):
    """Add a tag to a meal."""
    service = MealService(session)
    meal = service.add_tag(meal_id, tag_data.tag)
    if not meal:
        raise HTTPException(status_code=404, detail="Meal not found")
    return meal


@router.delete("/{meal_id}/tags/{tag}", response_model=MealResponseDTO)
def remove_tag(
    meal_id: int,
    tag: str,
    session: Session = Depends(get_session),
):
    """Remove a tag from a meal."""
    service = MealService(session)
    meal = service.remove_tag(meal_id, tag)
    if not meal:
        raise HTTPException(status_code=404, detail="Meal not found")
    return meal
