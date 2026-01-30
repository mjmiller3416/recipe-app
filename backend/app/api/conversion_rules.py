"""app/api/conversion_rules.py

FastAPI router for unit conversion rule endpoints.
All endpoints require authentication and are scoped to the current user.
"""

from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.database.db import get_session
from app.dtos.unit_conversion_dtos import (
    UnitConversionRuleCreateDTO,
    UnitConversionRuleResponseDTO,
    UnitConversionRuleUpdateDTO,
    UnitOptionDTO,
    UnitsResponseDTO,
)
from app.models.user import User
from app.services.unit_conversion_service import UnitConversionService
from app.utils import unit_conversion

router = APIRouter()


@router.get("/units", response_model=UnitsResponseDTO)
async def get_units(
    current_user: User = Depends(get_current_user),
):
    """
    Get all available ingredient units.

    Returns a list of units that can be used in recipes and shopping lists.
    Backend is the authoritative source for available units.
    """
    # Collect all units from the conversion module
    all_units = []

    # Add mass units
    for unit_code in unit_conversion.MASS_UNITS.keys():
        all_units.append(UnitOptionDTO(value=unit_code, label=unit_code))

    # Add volume units with proper display labels
    volume_labels = {"tbs": "Tbs", "tsp": "tsp", "cup": "cup"}
    for unit_code in unit_conversion.VOLUME_UNITS.keys():
        label = volume_labels.get(unit_code, unit_code)
        all_units.append(UnitOptionDTO(value=unit_code, label=label))

    # Add count units (excluding empty string)
    count_labels = {
        "stick": "stick",
        "bag": "bag",
        "box": "box",
        "can": "can",
        "jar": "jar",
        "package": "package",
        "piece": "piece",
        "slice": "slice",
        "whole": "whole",
        "pinch": "pinch",
        "dash": "dash",
        "to-taste": "to taste",
    }
    for unit_code in unit_conversion.COUNT_UNITS:
        if unit_code:  # Skip empty string
            label = count_labels.get(unit_code, unit_code)
            all_units.append(UnitOptionDTO(value=unit_code, label=label))

    return UnitsResponseDTO(units=all_units)


def _rule_to_response_dto(rule) -> UnitConversionRuleResponseDTO:
    """Convert a UnitConversionRule model to response DTO."""
    return UnitConversionRuleResponseDTO(
        id=rule.id,
        ingredient_name=rule.ingredient_name,
        from_unit=rule.from_unit,
        to_unit=rule.to_unit,
        factor=rule.factor,
        round_up=rule.round_up,
        created_at=rule.created_at,
    )


@router.get("", response_model=List[UnitConversionRuleResponseDTO])
async def list_rules(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """List all unit conversion rules for the current user."""
    service = UnitConversionService(session, current_user.id)
    rules = service.get_all()
    return [_rule_to_response_dto(r) for r in rules]


@router.get("/{rule_id}", response_model=UnitConversionRuleResponseDTO)
async def get_rule(
    rule_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Get a single rule by ID."""
    service = UnitConversionService(session, current_user.id)
    rule = service.get_by_id(rule_id)
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    return _rule_to_response_dto(rule)


@router.post("", response_model=UnitConversionRuleResponseDTO, status_code=201)
async def create_rule(
    rule_data: UnitConversionRuleCreateDTO,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Create a new unit conversion rule."""
    service = UnitConversionService(session, current_user.id)
    try:
        rule = service.create_rule(rule_data)
        return _rule_to_response_dto(rule)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{rule_id}", response_model=UnitConversionRuleResponseDTO)
async def update_rule(
    rule_id: int,
    update_data: UnitConversionRuleUpdateDTO,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Update an existing rule."""
    service = UnitConversionService(session, current_user.id)
    try:
        rule = service.update_rule(rule_id, update_data)
        if not rule:
            raise HTTPException(status_code=404, detail="Rule not found")
        return _rule_to_response_dto(rule)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{rule_id}")
async def delete_rule(
    rule_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Delete a rule by ID."""
    service = UnitConversionService(session, current_user.id)
    try:
        if not service.delete_rule(rule_id):
            raise HTTPException(status_code=404, detail="Rule not found")
        return {"message": "Rule deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
