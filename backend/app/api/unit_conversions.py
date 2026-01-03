"""app/api/unit_conversions.py

FastAPI router for unit conversion rule endpoints.
"""

from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.db import get_session
from app.dtos.unit_conversion_dtos import (
    UnitConversionRuleCreateDTO,
    UnitConversionRuleResponseDTO,
    UnitConversionRuleUpdateDTO,
)
from app.services.unit_conversion_service import UnitConversionService

router = APIRouter()


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
def list_rules(session: Session = Depends(get_session)):
    """List all unit conversion rules."""
    service = UnitConversionService(session)
    rules = service.get_all()
    return [_rule_to_response_dto(r) for r in rules]


@router.get("/{rule_id}", response_model=UnitConversionRuleResponseDTO)
def get_rule(rule_id: int, session: Session = Depends(get_session)):
    """Get a single rule by ID."""
    service = UnitConversionService(session)
    rule = service.get_by_id(rule_id)
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    return _rule_to_response_dto(rule)


@router.post("", response_model=UnitConversionRuleResponseDTO, status_code=201)
def create_rule(
    rule_data: UnitConversionRuleCreateDTO,
    session: Session = Depends(get_session),
):
    """Create a new unit conversion rule."""
    service = UnitConversionService(session)
    try:
        rule = service.create_rule(rule_data)
        return _rule_to_response_dto(rule)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{rule_id}", response_model=UnitConversionRuleResponseDTO)
def update_rule(
    rule_id: int,
    update_data: UnitConversionRuleUpdateDTO,
    session: Session = Depends(get_session),
):
    """Update an existing rule."""
    service = UnitConversionService(session)
    try:
        rule = service.update_rule(rule_id, update_data)
        if not rule:
            raise HTTPException(status_code=404, detail="Rule not found")
        return _rule_to_response_dto(rule)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{rule_id}")
def delete_rule(rule_id: int, session: Session = Depends(get_session)):
    """Delete a rule by ID."""
    service = UnitConversionService(session)
    try:
        if not service.delete_rule(rule_id):
            raise HTTPException(status_code=404, detail="Rule not found")
        return {"message": "Rule deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
