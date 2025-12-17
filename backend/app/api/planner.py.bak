"""app/api/planner.py

FastAPI router for meal planner endpoints.
"""

from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database.db import get_session
from app.core.dtos.planner_dtos import (
    MealPlanSaveResultDTO,
    MealPlanSummaryDTO,
    MealSelectionCreateDTO,
    MealSelectionResponseDTO,
    MealSelectionUpdateDTO,
)
from app.core.services.planner_service import PlannerService

router = APIRouter()


@router.get("/meals", response_model=List[MealSelectionResponseDTO])
def get_all_meals(session: Session = Depends(get_session)):
    """Get all meal selections."""
    service = PlannerService(session)
    return service.get_all_meal_selections()


@router.get("/saved", response_model=List[MealSelectionResponseDTO])
def get_saved_meal_plan(session: Session = Depends(get_session)):
    """Get the saved meal plan with full recipe details."""
    service = PlannerService(session)
    try:
        return service.get_saved_meal_plan()
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/summary", response_model=MealPlanSummaryDTO)
def get_meal_plan_summary(session: Session = Depends(get_session)):
    """Get a summary of the current meal plan."""
    service = PlannerService(session)
    return service.get_meal_plan_summary()


@router.get("/meals/{meal_id}", response_model=MealSelectionResponseDTO)
def get_meal_selection(meal_id: int, session: Session = Depends(get_session)):
    """Get a single meal selection by ID."""
    service = PlannerService(session)
    meal = service.get_meal_selection(meal_id)
    if not meal:
        raise HTTPException(status_code=404, detail="Meal selection not found")
    return meal


@router.post("/meals", response_model=MealSelectionResponseDTO, status_code=201)
def create_meal_selection(
    create_data: MealSelectionCreateDTO,
    session: Session = Depends(get_session),
):
    """Create a new meal selection."""
    service = PlannerService(session)
    meal = service.create_meal_selection(create_data)
    if not meal:
        raise HTTPException(
            status_code=400,
            detail="Failed to create meal selection. Check that recipe IDs are valid."
        )
    return meal


@router.put("/meals/{meal_id}", response_model=MealSelectionResponseDTO)
def update_meal_selection(
    meal_id: int,
    update_data: MealSelectionUpdateDTO,
    session: Session = Depends(get_session),
):
    """Update an existing meal selection."""
    service = PlannerService(session)
    meal = service.update_meal_selection(meal_id, update_data)
    if not meal:
        raise HTTPException(
            status_code=404,
            detail="Meal selection not found or update failed"
        )
    return meal


@router.delete("/meals/{meal_id}")
def delete_meal_selection(meal_id: int, session: Session = Depends(get_session)):
    """Delete a meal selection."""
    service = PlannerService(session)
    if not service.delete_meal_selection(meal_id):
        raise HTTPException(status_code=404, detail="Meal selection not found")
    return {"message": "Meal selection deleted successfully"}


@router.post("/save", response_model=MealPlanSaveResultDTO)
def save_meal_plan(
    meal_ids: List[int],
    session: Session = Depends(get_session),
):
    """Save a meal plan with the specified meal IDs."""
    service = PlannerService(session)
    return service.saveMealPlan(meal_ids)


@router.delete("/clear")
def clear_meal_plan(session: Session = Depends(get_session)):
    """Clear the current meal plan."""
    service = PlannerService(session)
    if not service.clear_meal_plan():
        raise HTTPException(status_code=500, detail="Failed to clear meal plan")
    return {"message": "Meal plan cleared successfully"}
