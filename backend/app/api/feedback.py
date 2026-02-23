"""Feedback API endpoints for user feedback submission."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.auth import get_current_user
from app.database.db import get_session
from app.dtos.feedback import FeedbackCreateDTO, FeedbackResponseDTO
from app.models.user import User
from app.services.feedback_service import FeedbackSaveError, FeedbackService

router = APIRouter()


@router.post("", response_model=FeedbackResponseDTO)
def submit_feedback(
    feedback: FeedbackCreateDTO,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> FeedbackResponseDTO:
    """Submit user feedback.

    Persists feedback to the database for review.
    Requires authentication.
    """
    service = FeedbackService(session, current_user.id)
    try:
        return service.submit_feedback(feedback)
    except FeedbackSaveError:
        raise HTTPException(
            status_code=500,
            detail="Failed to submit feedback. Please try again.",
        )
