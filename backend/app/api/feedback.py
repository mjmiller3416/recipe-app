"""Feedback API endpoints for user feedback submission."""

from fastapi import APIRouter, Depends

from app.api.dependencies import get_current_user
from app.dtos.feedback import FeedbackCreateDTO, FeedbackResponseDTO
from app.models.user import User
from app.services.feedback_service import FeedbackService

router = APIRouter()


@router.post("", response_model=FeedbackResponseDTO)
async def submit_feedback(
    feedback: FeedbackCreateDTO,
    current_user: User = Depends(get_current_user),
) -> FeedbackResponseDTO:
    """Submit user feedback as a GitHub issue.

    Creates a new GitHub issue with the feedback content.
    The issue is labeled based on the feedback category.
    Requires authentication.
    """
    service = FeedbackService()
    return await service.submit_feedback(feedback)
