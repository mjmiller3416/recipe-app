"""API router for Meal Genie conversational AI."""

from typing import List, Optional

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

# Keywords that indicate user wants shopping list context
SHOPPING_LIST_KEYWORDS = [
    "shopping list",
    "what i have",
    "what i've got",
    "ingredients i have",
    "use what i have",
    "with what i have",
    "from my list",
    "my ingredients",
    "available ingredients",
    "based on my",
]


def _should_include_shopping_list(
    message: str, conversation_history: Optional[List[dict]] = None
) -> bool:
    """Check if user's message or recent history references shopping list.

    Args:
        message: Current user message
        conversation_history: Optional list of previous conversation messages

    Returns:
        True if shopping list context should be included
    """
    text_to_check = message.lower()

    # Also check recent conversation history (last 3 user messages)
    if conversation_history:
        for entry in conversation_history[-6:]:  # Check more entries to find ~3 user msgs
            if entry.get("role") == "user":
                text_to_check += " " + entry.get("content", "").lower()

    return any(keyword in text_to_check for keyword in SHOPPING_LIST_KEYWORDS)


@router.post("/ask", response_model=MealGenieResponseDTO)
async def ask_meal_genie(
    request: MealGenieRequestDTO,
    session: Session = Depends(get_session),
) -> MealGenieResponseDTO:
    """
    Send a message to Meal Genie and get a response.

    The AI may decide to generate a recipe if the user asks for one.
    If a recipe is generated, it will be included in the response along
    with optional AI-generated images.

    Args:
        request: The chat request with message and optional conversation history
        session: Database session for fetching user context

    Returns:
        Response with AI-generated answer, optionally including recipe data
    """
    try:
        # Build user context from database
        # Only include shopping list if user explicitly references it
        include_shopping = _should_include_shopping_list(
            request.message, request.conversation_history
        )
        context_builder = UserContextBuilder(session)
        user_context = context_builder.build_context(include_shopping_list=include_shopping)

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

        response_text = result["response"]

        # Check if AI generated a recipe in the response
        recipe_data = service._extract_recipe_json(response_text)

        if recipe_data:
            # Recipe was generated - parse it and optionally generate images
            from app.ai.dtos.meal_genie_dtos import GeneratedRecipeDTO

            try:
                recipe = GeneratedRecipeDTO(**recipe_data)
                ai_message = service._extract_ai_message(response_text)

                # Generate images for the recipe
                reference_image_data = None
                banner_image_data = None
                try:
                    image_service = get_image_generation_service()
                    image_result = image_service.generate_dual_recipe_images(
                        recipe.recipe_name
                    )
                    if image_result["success"]:
                        reference_image_data = image_result.get("reference_image_data")
                        banner_image_data = image_result.get("banner_image_data")
                except Exception as e:
                    print(f"Image generation exception: {e}")

                return MealGenieResponseDTO(
                    success=True,
                    response=ai_message,
                    recipe=recipe,
                    reference_image_data=reference_image_data,
                    banner_image_data=banner_image_data,
                    error=None,
                )
            except Exception as e:
                # Failed to parse recipe, return as normal chat
                print(f"Failed to parse recipe: {e}")

        # Normal chat response (no recipe)
        return MealGenieResponseDTO(
            success=True,
            response=response_text,
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
        # Only include shopping list if user explicitly references it
        include_shopping = _should_include_shopping_list(
            request.message, request.conversation_history
        )
        context_builder = UserContextBuilder(session)
        user_context = context_builder.build_context(include_shopping_list=include_shopping)

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

        # We have a recipe - optionally generate images
        recipe = result["recipe"]
        reference_image_data = None
        banner_image_data = None

        if request.generate_image and recipe:
            try:
                image_service = get_image_generation_service()
                image_result = image_service.generate_dual_recipe_images(
                    recipe.recipe_name
                )
                if image_result["success"]:
                    reference_image_data = image_result.get("reference_image_data")
                    banner_image_data = image_result.get("banner_image_data")
                # Log any errors from image generation
                if image_result.get("errors"):
                    print(f"Image generation errors: {image_result['errors']}")
            except Exception as e:
                # Image generation failed, but we still have the recipe
                print(f"Image generation exception: {e}")

        return RecipeGenerationResponseDTO(
            success=True,
            recipe=recipe,
            reference_image_data=reference_image_data,
            banner_image_data=banner_image_data,
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
