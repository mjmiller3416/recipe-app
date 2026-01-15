"""API router for Meal Genie conversational AI."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.db import get_session
from app.ai.dtos import (
    MealGenieRequestDTO,
    MealGenieResponseDTO,
    RecipeGenerationRequestDTO,
    RecipeGenerationResponseDTO,
)
from app.ai.services import get_meal_genie_service
from app.ai.services.image_generation_service import get_image_generation_service
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


@router.post("/generate-recipe", response_model=RecipeGenerationResponseDTO)
async def generate_recipe(
    request: RecipeGenerationRequestDTO,
    session: Session = Depends(get_session),
) -> RecipeGenerationResponseDTO:
    """
    Generate a complete recipe with optional AI image.

    This endpoint orchestrates:
    1. Calling Meal Genie with the recipe_create tool
    2. Parsing the generated recipe JSON
    3. Optionally generating an AI image for the recipe

    Args:
        request: The recipe generation request
        session: Database session for fetching user context

    Returns:
        Response with generated recipe data and optional image
    """
    try:
        # Build user context from database
        context_builder = UserContextBuilder(session)
        user_context = context_builder.build_context()

        # Generate recipe using Meal Genie
        service = get_meal_genie_service()
        result = service.generate_recipe(
            message=request.message,
            conversation_history=request.conversation_history,
            user_context=user_context,
        )

        if not result["success"]:
            return RecipeGenerationResponseDTO(
                success=False,
                error=result.get("error", "Failed to generate recipe"),
            )

        # If AI is asking for more info, return the message
        if result["needs_more_info"]:
            return RecipeGenerationResponseDTO(
                success=True,
                ai_message=result["ai_message"],
                needs_more_info=True,
            )

        # We have a recipe - optionally generate an image
        recipe = result["recipe"]
        image_data = None

        if request.generate_image and recipe:
            try:
                image_service = get_image_generation_service()
                image_result = image_service.generate_recipe_image(recipe.recipe_name)
                if image_result["success"]:
                    image_data = image_result["image_data"]
            except Exception:
                # Image generation failed, but we still have the recipe
                pass

        return RecipeGenerationResponseDTO(
            success=True,
            recipe=recipe,
            image_data=image_data,
            ai_message=result["ai_message"],
            needs_more_info=False,
        )

    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Recipe generation error: {str(e)}"
        )
