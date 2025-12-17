"""app/api/planner.py

FastAPI router for planner entry endpoints.
"""

from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database.db import get_session
from app.core.dtos.planner_dtos import (
    PlannerEntryCreateDTO,
    PlannerEntryResponseDTO,
    PlannerEntryUpdateDTO,
    PlannerEntriesReorderDTO,
    PlannerSummaryDTO,
    PlannerValidationDTO,
)
from app.core.services.planner_service import PlannerService

router = APIRouter()


@router.get("/entries", response_model=List[PlannerEntryResponseDTO])
def get_all_planner_entries(session: Session = Depends(get_session)):
    """Get all planner entries ordered by position."""
    service = PlannerService(session)
    return service.get_all_planner_entries()


@router.get("/entries/completed", response_model=List[PlannerEntryResponseDTO])
def get_completed_entries(session: Session = Depends(get_session)):
    """Get all completed planner entries."""
    service = PlannerService(session)
    return service.get_completed_entries()


@router.get("/entries/pending", response_model=List[PlannerEntryResponseDTO])
def get_pending_entries(session: Session = Depends(get_session)):
    """Get all pending (not completed) planner entries."""
    service = PlannerService(session)
    return service.get_pending_entries()


@router.get("/summary", response_model=PlannerSummaryDTO)
def get_planner_summary(session: Session = Depends(get_session)):
    """Get a summary of the current planner."""
    service = PlannerService(session)
    return service.get_planner_summary()


@router.get("/validate", response_model=PlannerValidationDTO)
def validate_planner_state(session: Session = Depends(get_session)):
    """Validate the current planner state and check capacity."""
    service = PlannerService(session)
    return service.validate_planner_state()


@router.get("/entries/{entry_id}", response_model=PlannerEntryResponseDTO)
def get_planner_entry(entry_id: int, session: Session = Depends(get_session)):
    """Get a single planner entry by ID."""
    service = PlannerService(session)
    entry = service.get_planner_entry(entry_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Planner entry not found")
    return entry


@router.get("/meals/{meal_id}/entries", response_model=List[PlannerEntryResponseDTO])
def get_entries_by_meal(meal_id: int, session: Session = Depends(get_session)):
    """Get all planner entries for a specific meal."""
    service = PlannerService(session)
    return service.get_entries_by_meal(meal_id)


@router.post("/entries", response_model=PlannerEntryResponseDTO, status_code=201)
def add_meal_to_planner(
    create_data: PlannerEntryCreateDTO,
    session: Session = Depends(get_session),
):
    """Add a meal to the planner (create a planner entry)."""
    service = PlannerService(session)
    entry = service.add_meal_to_planner(create_data)
    if not entry:
        raise HTTPException(
            status_code=400,
            detail="Failed to add meal to planner. Check that meal ID is valid and max capacity not exceeded."
        )
    return entry


@router.put("/entries/{entry_id}", response_model=PlannerEntryResponseDTO)
def update_planner_entry(
    entry_id: int,
    update_data: PlannerEntryUpdateDTO,
    session: Session = Depends(get_session),
):
    """Update an existing planner entry."""
    service = PlannerService(session)
    entry = service.update_planner_entry(entry_id, update_data)
    if not entry:
        raise HTTPException(
            status_code=404,
            detail="Planner entry not found or update failed"
        )
    return entry


@router.delete("/entries/{entry_id}")
def remove_meal_from_planner(entry_id: int, session: Session = Depends(get_session)):
    """Remove a meal from the planner (delete planner entry). The meal itself is not deleted."""
    service = PlannerService(session)
    if not service.remove_meal_from_planner(entry_id):
        raise HTTPException(status_code=404, detail="Planner entry not found")
    return {"message": "Meal removed from planner successfully"}


@router.delete("/clear")
def clear_planner(session: Session = Depends(get_session)):
    """Clear all entries from the planner."""
    service = PlannerService(session)
    if not service.clear_planner():
        raise HTTPException(status_code=500, detail="Failed to clear planner")
    return {"message": "Planner cleared successfully"}


@router.post("/entries/reorder")
def reorder_planner_entries(
    reorder_data: PlannerEntriesReorderDTO,
    session: Session = Depends(get_session),
):
    """Reorder all planner entries according to the provided list of entry IDs."""
    service = PlannerService(session)
    if not service.reorder_planner_entries(reorder_data):
        raise HTTPException(
            status_code=400,
            detail="Failed to reorder planner entries. Check that all entry IDs are valid."
        )
    return {"message": "Planner entries reordered successfully"}


@router.post("/entries/{entry_id}/complete", response_model=PlannerEntryResponseDTO)
def mark_entry_completed(entry_id: int, session: Session = Depends(get_session)):
    """Mark a planner entry as completed."""
    service = PlannerService(session)
    entry = service.mark_entry_completed(entry_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Planner entry not found")
    return entry


@router.post("/entries/{entry_id}/incomplete", response_model=PlannerEntryResponseDTO)
def mark_entry_incomplete(entry_id: int, session: Session = Depends(get_session)):
    """Mark a planner entry as incomplete."""
    service = PlannerService(session)
    entry = service.mark_entry_incomplete(entry_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Planner entry not found")
    return entry
