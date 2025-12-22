"""Feedback DTOs for user feedback submission."""

from pydantic import BaseModel, Field
from typing import Optional, Dict


class FeedbackCreateDTO(BaseModel):
    """Request DTO for submitting feedback."""

    category: str = Field(..., min_length=1, max_length=50)
    message: str = Field(..., min_length=10, max_length=5000)
    metadata: Optional[Dict[str, Optional[str]]] = Field(
        default=None,
        description="Optional context metadata (e.g., page_url, viewport)"
    )


class FeedbackResponseDTO(BaseModel):
    """Response DTO for feedback submission."""

    success: bool
    issue_url: Optional[str] = None
    message: str
