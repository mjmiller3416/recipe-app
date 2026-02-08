"""DTOs for cooking tip generation."""

from pydantic import BaseModel
from typing import Optional


class CookingTipResponseDTO(BaseModel):
    """Response DTO for cooking tip generation."""

    success: bool
    tip: Optional[str] = None
    error: Optional[str] = None
