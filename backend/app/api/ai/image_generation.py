"""API router for AI image generation."""

import base64

from fastapi import APIRouter, Depends, HTTPException

from app.ai.dtos import (
    ImageGenerationRequestDTO,
    ImageGenerationResponseDTO,
    BannerGenerationRequestDTO,
    BannerGenerationResponseDTO,
)
from app.ai.services import get_image_generation_service
from app.api.dependencies import require_pro
from app.models.user import User

router = APIRouter()


@router.post("", response_model=ImageGenerationResponseDTO)
async def generate_recipe_image(
    request: ImageGenerationRequestDTO,
    current_user: User = Depends(require_pro),
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


@router.post("/banner", response_model=BannerGenerationResponseDTO)
async def generate_banner_image(
    request: BannerGenerationRequestDTO,
    current_user: User = Depends(require_pro),
) -> BannerGenerationResponseDTO:
    """
    Generate a banner (21:9) image from an existing reference image.

    Uses the reference image as visual input to create a wider banner version
    that maintains the same food presentation and styling.

    Args:
        request: Request containing recipe name and base64 encoded reference image

    Returns:
        Response with base64 encoded banner image data on success
    """
    if not request.recipe_name or not request.recipe_name.strip():
        raise HTTPException(status_code=400, detail="Recipe name is required")

    if not request.reference_image_data:
        raise HTTPException(status_code=400, detail="Reference image data is required")

    try:
        service = get_image_generation_service()

        # Decode base64 reference image to bytes
        reference_bytes = base64.b64decode(request.reference_image_data)

        result = service.generate_banner_from_reference(
            request.recipe_name, reference_bytes
        )

        if not result["success"]:
            raise HTTPException(
                status_code=500,
                detail=result.get("error") or "Banner generation failed",
            )

        return BannerGenerationResponseDTO(
            success=True,
            banner_image_data=result.get("image_data"),
            error=None,
        )

    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Banner generation failed: {str(e)}")
