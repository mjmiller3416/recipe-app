"""Feedback DTOs for user feedback submission."""

from pydantic import BaseModel, Field
from typing import Optional


class FeedbackCreateDTO(BaseModel):
    """Request DTO for submitting feedback."""

    category: str = Field(..., min_length=1, max_length=50)
    message: str = Field(..., min_length=10, max_length=5000)


class FeedbackResponseDTO(BaseModel):
    """Response DTO for feedback submission."""

    success: bool
    issue_url: Optional[str] = None
    message: str
