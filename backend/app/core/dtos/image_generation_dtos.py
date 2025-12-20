"""DTOs for AI image generation."""

from pydantic import BaseModel
from typing import Optional


class ImageGenerationRequestDTO(BaseModel):
    """Request DTO for generating an AI image."""

    recipe_name: str


class ImageGenerationResponseDTO(BaseModel):
    """Response DTO for image generation."""

    success: bool
    image_data: Optional[str] = None  # Base64 encoded image data
    error: Optional[str] = None
