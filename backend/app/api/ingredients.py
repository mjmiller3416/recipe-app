"""app/api/ingredients.py

FastAPI router for ingredient endpoints.
"""

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database.db import get_session
from app.dtos.ingredient_dtos import (
    IngredientCreateDTO,
    IngredientResponseDTO,
    IngredientSearchDTO,
    IngredientUpdateDTO,
)
from app.services.ingredient_service import IngredientService

router = APIRouter()


def _ingredient_to_response_dto(ingredient) -> IngredientResponseDTO:
    """Convert an Ingredient model to IngredientResponseDTO."""
    return IngredientResponseDTO(
        id=ingredient.id,
        ingredient_name=ingredient.ingredient_name,
        ingredient_category=ingredient.ingredient_category,
    )


@router.get("", response_model=List[IngredientResponseDTO])
def list_ingredients(
    search_term: Optional[str] = Query(None, min_length=1),
    category: Optional[str] = Query(None),
    limit: Optional[int] = Query(None, ge=1, le=100),
    offset: Optional[int] = Query(None, ge=0),
    session: Session = Depends(get_session),
):
    """List or search ingredients."""
    service = IngredientService(session)

    if search_term:
        ingredients = service.search_ingredients(search_term, category)
    elif category:
        ingredients = service.get_ingredients_by_category(category)
    else:
        ingredients = service.get_all_ingredients()

    # Apply limit/offset if provided
    if offset:
        ingredients = ingredients[offset:]
    if limit:
        ingredients = ingredients[:limit]

    return [_ingredient_to_response_dto(ing) for ing in ingredients]


@router.get("/categories", response_model=List[str])
def get_ingredient_categories(session: Session = Depends(get_session)):
    """Get unique ingredient categories."""
    service = IngredientService(session)
    return service.get_ingredient_categories()


@router.get("/names", response_model=List[str])
def get_ingredient_names(session: Session = Depends(get_session)):
    """Get all unique ingredient names for autocomplete."""
    service = IngredientService(session)
    return service.list_all_ingredient_names()


@router.get("/{ingredient_id}", response_model=IngredientResponseDTO)
def get_ingredient(ingredient_id: int, session: Session = Depends(get_session)):
    """Get a single ingredient by ID."""
    service = IngredientService(session)
    ingredient = service.get_ingredient_by_id(ingredient_id)
    if not ingredient:
        raise HTTPException(status_code=404, detail="Ingredient not found")
    return _ingredient_to_response_dto(ingredient)


@router.post("", response_model=IngredientResponseDTO, status_code=201)
def create_ingredient(
    ingredient_data: IngredientCreateDTO,
    session: Session = Depends(get_session),
):
    """Create a new ingredient or return existing one."""
    service = IngredientService(session)
    try:
        ingredient = service.create_ingredient(ingredient_data)
        return _ingredient_to_response_dto(ingredient)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/bulk", response_model=List[IngredientResponseDTO], status_code=201)
def bulk_create_ingredients(
    ingredients_data: List[IngredientCreateDTO],
    session: Session = Depends(get_session),
):
    """Bulk create ingredients. Returns existing ingredients if they already exist."""
    service = IngredientService(session)
    try:
        ingredients = service.bulk_create_ingredients(ingredients_data)
        return [_ingredient_to_response_dto(ing) for ing in ingredients]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{ingredient_id}", response_model=IngredientResponseDTO)
def update_ingredient(
    ingredient_id: int,
    update_data: IngredientUpdateDTO,
    session: Session = Depends(get_session),
):
    """Update an existing ingredient."""
    service = IngredientService(session)
    try:
        ingredient = service.update_ingredient(ingredient_id, update_data)
        if not ingredient:
            raise HTTPException(status_code=404, detail="Ingredient not found")
        return _ingredient_to_response_dto(ingredient)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{ingredient_id}")
def delete_ingredient(ingredient_id: int, session: Session = Depends(get_session)):
    """Delete an ingredient."""
    service = IngredientService(session)
    try:
        if not service.delete_ingredient(ingredient_id):
            raise HTTPException(status_code=404, detail="Ingredient not found")
        return {"message": "Ingredient deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/search", response_model=List[IngredientResponseDTO])
def search_ingredients(
    search_data: IngredientSearchDTO,
    session: Session = Depends(get_session),
):
    """Search ingredients using a search DTO."""
    service = IngredientService(session)
    ingredients = service.find_matching_ingredients(search_data)

    # Apply limit/offset if provided
    if search_data.offset:
        ingredients = ingredients[search_data.offset:]
    if search_data.limit:
        ingredients = ingredients[:search_data.limit]

    return [_ingredient_to_response_dto(ing) for ing in ingredients]
