"""DTOs for AI image generation."""

from pydantic import BaseModel
from typing import Optional


class ImageGenerationRequestDTO(BaseModel):
    """Request DTO for generating an AI image."""

    recipe_name: str
    custom_prompt: Optional[str] = None  # Custom prompt template (must include {recipe_name})


class ImageGenerationResponseDTO(BaseModel):
    """Response DTO for image generation."""

    success: bool
    reference_image_data: Optional[str] = None  # Base64 encoded (1:1 square)
    banner_image_data: Optional[str] = None  # Base64 encoded (21:9 ultrawide)
    error: Optional[str] = None


class BannerGenerationRequestDTO(BaseModel):
    """Request DTO for generating banner from reference image."""

    recipe_name: str
    reference_image_data: str  # Base64 encoded reference image


class BannerGenerationResponseDTO(BaseModel):
    """Response DTO for banner generation."""

    success: bool
    banner_image_data: Optional[str] = None  # Base64 encoded (21:9 ultrawide)
    error: Optional[str] = None
