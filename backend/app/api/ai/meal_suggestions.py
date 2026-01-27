"""API router for meal-specific AI suggestions."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.ai.dtos import MealSuggestionsRequestDTO, MealSuggestionsResponseDTO
from app.ai.services import get_meal_suggestions_service
from app.api.dependencies import require_pro
from app.database.db import get_session
from app.models.user import User
from app.services.usage_service import UsageService

router = APIRouter()


@router.post("", response_model=MealSuggestionsResponseDTO)
async def get_meal_suggestions(
    request: MealSuggestionsRequestDTO,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_pro),
) -> MealSuggestionsResponseDTO:
    """
    Get AI-generated side dish suggestions and cooking tip for a meal.

    Args:
        request: The meal details to generate suggestions for

    Returns:
        Response with side dish suggestions and cooking tip on success
    """
    try:
        service = get_meal_suggestions_service()
        result = service.generate_suggestions(request)

        if not result.success:
            raise HTTPException(
                status_code=500, detail=result.error or "Suggestions generation failed"
            )

        # Track usage (silent fail - don't break AI feature for tracking issues)
        try:
            UsageService(session, current_user.id).increment("ai_suggestions_requested")
        except Exception:
            pass

        return result

    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Suggestions generation failed: {str(e)}"
        )
