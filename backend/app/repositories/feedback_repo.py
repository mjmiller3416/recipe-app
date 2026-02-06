"""app/repositories/feedback_repo.py

Repository for persisting user feedback submissions.
"""

# -- Imports -------------------------------------------------------------------------------------
from __future__ import annotations

from typing import Optional

from sqlalchemy.orm import Session

from ..models.feedback import Feedback


# -- Feedback Repository -------------------------------------------------------------------------
class FeedbackRepo:
    """Repository for feedback persistence operations."""

    def __init__(self, session: Session):
        """Initialize the Feedback Repository with a database session."""
        self.session = session

    def create(
        self,
        user_id: int,
        category: str,
        message: str,
        metadata_json: Optional[dict] = None,
    ) -> Feedback:
        """
        Create and persist a new feedback entry.

        Args:
            user_id: ID of the user submitting feedback
            category: Feedback category (e.g., "Bug Report", "Feature Request")
            message: Feedback message content
            metadata_json: Optional context metadata (page URL, viewport, etc.)

        Returns:
            Saved Feedback with assigned ID and timestamps
        """
        feedback = Feedback(
            user_id=user_id,
            category=category,
            message=message,
            metadata_json=metadata_json,
        )
        self.session.add(feedback)
        self.session.flush()
        self.session.refresh(feedback)
        return feedback
