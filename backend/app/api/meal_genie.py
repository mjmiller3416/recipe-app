"""API router for Meal Genie conversational AI."""

from fastapi import APIRouter, HTTPException

from app.dtos.meal_genie_dtos import (
    MealGenieRequestDTO,
    MealGenieResponseDTO,
)
from app.services.meal_genie_service import get_meal_genie_service

router = APIRouter()


@router.post("/ask", response_model=MealGenieResponseDTO)
async def ask_meal_genie(request: MealGenieRequestDTO) -> MealGenieResponseDTO:
    """
    Send a message to Meal Genie and get a response.

    Args:
        request: The chat request with message and optional conversation history

    Returns:
        Response with AI-generated answer
    """
    try:
        service = get_meal_genie_service()
        result = service.ask(
            message=request.message,
            conversation_history=request.conversation_history,
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
