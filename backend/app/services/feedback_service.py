"""Feedback service for persisting user feedback to the database."""

from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.dtos.feedback import FeedbackCreateDTO, FeedbackResponseDTO
from app.repositories.feedback_repo import FeedbackRepo


# ── Domain Exceptions ────────────────────────────────────────────────────────
class FeedbackSaveError(Exception):
    """Raised when feedback cannot be saved to the database."""
    pass


# ── Feedback Service ─────────────────────────────────────────────────────────
class FeedbackService:
    """Service for handling user feedback submission."""

    def __init__(self, session: Session, user_id: int):
        self.session = session
        self.user_id = user_id
        self.repo = FeedbackRepo(session)

    def submit_feedback(self, dto: FeedbackCreateDTO) -> FeedbackResponseDTO:
        """
        Persist user feedback to the database.

        Args:
            dto: Feedback data from the request

        Returns:
            FeedbackResponseDTO with success status

        Raises:
            FeedbackSaveError: If the database operation fails
        """
        try:
            feedback = self.repo.create(
                user_id=self.user_id,
                category=dto.category,
                message=dto.message,
                metadata_json=dto.metadata,
            )
            self.session.commit()
            return FeedbackResponseDTO.from_model(feedback)
        except SQLAlchemyError as e:
            self.session.rollback()
            raise FeedbackSaveError(f"Failed to save feedback: {e}") from e
