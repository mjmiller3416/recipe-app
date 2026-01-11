"""API router for Meal Genie conversational AI."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.db import get_session
from app.ai.dtos import (
    MealGenieRequestDTO,
    MealGenieResponseDTO,
)
from app.ai.services import get_meal_genie_service
from app.ai.services.user_context_builder import UserContextBuilder

router = APIRouter()


@router.post("/ask", response_model=MealGenieResponseDTO)
async def ask_meal_genie(
    request: MealGenieRequestDTO,
    session: Session = Depends(get_session),
) -> MealGenieResponseDTO:
    """
    Send a message to Meal Genie and get a response.

    Args:
        request: The chat request with message and optional conversation history
        session: Database session for fetching user context

    Returns:
        Response with AI-generated answer
    """
    try:
        # Build user context from database
        context_builder = UserContextBuilder(session)
        user_context = context_builder.build_context()

        service = get_meal_genie_service()
        result = service.ask(
            message=request.message,
            conversation_history=request.conversation_history,
            user_context=user_context,
        )

        if not result["success"]:
            raise HTTPException(
                status_code=500, detail=result.get("error", "Failed to get response")
            )

        return MealGenieResponseDTO(
            success=True,
            response=result["response"],
            error=None,
        )

    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Meal Genie error: {str(e)}")
