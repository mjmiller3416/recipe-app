"""app/api/shopping.py

FastAPI router for shopping list endpoints.
"""

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database.db import get_session
from app.core.dtos.shopping_dtos import (
    BulkOperationResultDTO,
    BulkStateUpdateDTO,
    ManualItemCreateDTO,
    ShoppingItemResponseDTO,
    ShoppingItemUpdateDTO,
    ShoppingListFilterDTO,
    ShoppingListGenerationDTO,
    ShoppingListGenerationResultDTO,
    ShoppingListResponseDTO,
)
from app.core.services.shopping_service import ShoppingService

router = APIRouter()


@router.get("", response_model=ShoppingListResponseDTO)
def get_shopping_list(
    source: Optional[str] = Query(None, pattern="^(recipe|manual)$"),
    category: Optional[str] = Query(None),
    have: Optional[bool] = Query(None),
    search_term: Optional[str] = Query(None),
    limit: Optional[int] = Query(None, ge=1, le=100),
    offset: Optional[int] = Query(None, ge=0),
    session: Session = Depends(get_session),
):
    """Get the shopping list with optional filters."""
    filters = ShoppingListFilterDTO(
        source=source,
        category=category,
        have=have,
        search_term=search_term,
        limit=limit,
        offset=offset,
    )

    service = ShoppingService(session)
    return service.get_shopping_list(filters)


@router.get("/items/{item_id}", response_model=ShoppingItemResponseDTO)
def get_shopping_item(item_id: int, session: Session = Depends(get_session)):
    """Get a single shopping item by ID."""
    service = ShoppingService(session)
    item = service.shopping_repo.get_shopping_item_by_id(item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Shopping item not found")
    return service._item_to_response_dto(item)


@router.post("/items", response_model=ShoppingItemResponseDTO, status_code=201)
def add_manual_item(
    item_data: ManualItemCreateDTO,
    session: Session = Depends(get_session),
):
    """Add a manual item to the shopping list."""
    service = ShoppingService(session)
    item = service.add_manual_item(item_data)
    if not item:
        raise HTTPException(status_code=500, detail="Failed to add item")
    return item


@router.patch("/items/{item_id}", response_model=ShoppingItemResponseDTO)
def update_shopping_item(
    item_id: int,
    update_data: ShoppingItemUpdateDTO,
    session: Session = Depends(get_session),
):
    """Update a shopping item."""
    service = ShoppingService(session)
    item = service.update_item(item_id, update_data)
    if not item:
        raise HTTPException(status_code=404, detail="Shopping item not found")
    return item


@router.patch("/items/{item_id}/toggle", response_model=dict)
def toggle_item_status(item_id: int, session: Session = Depends(get_session)):
    """Toggle the 'have' status of a shopping item."""
    service = ShoppingService(session)
    result = service.toggle_item_status(item_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Shopping item not found")
    return {"success": result}


@router.delete("/items/{item_id}")
def delete_shopping_item(item_id: int, session: Session = Depends(get_session)):
    """Delete a shopping item."""
    service = ShoppingService(session)
    if not service.delete_item(item_id):
        raise HTTPException(status_code=404, detail="Shopping item not found")
    return {"message": "Item deleted successfully"}


@router.post("/generate", response_model=ShoppingListGenerationResultDTO)
def generate_shopping_list(
    generation_data: ShoppingListGenerationDTO,
    session: Session = Depends(get_session),
):
    """Generate shopping list from recipe IDs."""
    service = ShoppingService(session)
    return service.generate_shopping_list(generation_data)


@router.post("/generate-from-planner", response_model=ShoppingListGenerationResultDTO)
def generate_from_planner(session: Session = Depends(get_session)):
    """Generate shopping list from active (non-completed) planner entries."""
    service = ShoppingService(session)
    return service.generate_from_active_planner()


@router.delete("/clear", response_model=BulkOperationResultDTO)
def clear_shopping_list(session: Session = Depends(get_session)):
    """Clear the entire shopping list."""
    service = ShoppingService(session)
    return service.clear_shopping_list()


@router.delete("/clear-manual", response_model=BulkOperationResultDTO)
def clear_manual_items(session: Session = Depends(get_session)):
    """Clear only manual items from the shopping list."""
    service = ShoppingService(session)
    return service.clear_manual_items()


@router.delete("/clear-recipe", response_model=BulkOperationResultDTO)
def clear_recipe_items(session: Session = Depends(get_session)):
    """Clear only recipe-generated items from the shopping list."""
    service = ShoppingService(session)
    return service.clear_recipe_items()


@router.delete("/clear-completed", response_model=dict)
def clear_completed_items(session: Session = Depends(get_session)):
    """Clear all completed (have=True) items from the shopping list."""
    service = ShoppingService(session)
    count = service.clear_completed_items()
    return {"message": f"Cleared {count} completed items", "deleted_count": count}


@router.patch("/bulk-update", response_model=BulkOperationResultDTO)
def bulk_update_status(
    update_data: BulkStateUpdateDTO,
    session: Session = Depends(get_session),
):
    """Bulk update 'have' status for multiple items."""
    service = ShoppingService(session)
    return service.bulk_update_status(update_data)


@router.get("/breakdown", response_model=List[dict])
def get_ingredient_breakdown(
    recipe_ids: str = Query(..., description="Comma-separated list of recipe IDs"),
    session: Session = Depends(get_session),
):
    """Get ingredient breakdown by recipe."""
    try:
        ids = [int(id.strip()) for id in recipe_ids.split(",") if id.strip()]
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid recipe IDs format")

    service = ShoppingService(session)
    breakdown = service.get_ingredient_breakdown(ids)

    # Convert to list of dicts for response
    result = []
    for item in breakdown.items:
        result.append({
            "ingredient_name": item.ingredient_name,
            "total_quantity": item.total_quantity,
            "unit": item.unit,
            "recipe_contributions": [
                {
                    "recipe_name": rb.recipe_name,
                    "quantity": rb.quantity,
                    "unit": rb.unit,
                    "usage_count": rb.usage_count,
                }
                for rb in item.recipe_breakdown
            ]
        })
    return result
