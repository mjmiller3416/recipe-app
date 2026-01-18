"""API router for AI image generation."""

from fastapi import APIRouter, HTTPException

from app.ai.dtos import (
    ImageGenerationRequestDTO,
    ImageGenerationResponseDTO,
)
from app.ai.services import get_image_generation_service

router = APIRouter()


@router.post("", response_model=ImageGenerationResponseDTO)
async def generate_recipe_image(
    request: ImageGenerationRequestDTO,
) -> ImageGenerationResponseDTO:
    """
    Generate an AI image for a recipe based on its name.

    The image is generated using Gemini AI with a professional food photography style.

    Args:
        request: Request containing the recipe name

    Returns:
        Response with base64 encoded image data on success
    """
    if not request.recipe_name or not request.recipe_name.strip():
        raise HTTPException(status_code=400, detail="Recipe name is required")

    try:
        service = get_image_generation_service()
        result = service.generate_dual_recipe_images(request.recipe_name)

        if not result["success"]:
            errors = result.get("errors", [])
            raise HTTPException(
                status_code=500,
                detail="; ".join(errors) if errors else "Image generation failed",
            )

        return ImageGenerationResponseDTO(
            success=True,
            reference_image_data=result.get("reference_image_data"),
            banner_image_data=result.get("banner_image_data"),
            error=None,
        )

    except HTTPException:
        raise
    except ValueError as e:
        # Configuration errors (e.g., missing API key)
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image generation failed: {str(e)}")
