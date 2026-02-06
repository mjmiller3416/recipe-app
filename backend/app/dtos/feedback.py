"""Feedback DTOs for user feedback submission."""

from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING, Dict, Optional

from pydantic import BaseModel, Field

if TYPE_CHECKING:
    from app.models.feedback import Feedback


class FeedbackCreateDTO(BaseModel):
    """Request DTO for submitting feedback."""

    category: str = Field(..., min_length=1, max_length=50)
    message: str = Field(..., min_length=10, max_length=5000)
    metadata: Optional[Dict[str, Optional[str]]] = Field(
        default=None,
        description="Optional context metadata (e.g., page_url, viewport)",
    )


class FeedbackResponseDTO(BaseModel):
    """Response DTO for feedback submission."""

    success: bool
    message: str
    id: Optional[int] = None
    created_at: Optional[datetime] = None

    @classmethod
    def from_model(cls, feedback: Feedback) -> FeedbackResponseDTO:
        """Create a response DTO from a Feedback model instance."""
        return cls(
            success=True,
            message="Thank you for your feedback! It has been submitted successfully.",
            id=feedback.id,
            created_at=feedback.created_at,
        )
