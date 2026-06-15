"""app/repositories/admin_repo.py

Repository layer for admin operations. Handles direct database interactions
for user management and feedback review.
"""

from datetime import datetime
from typing import List, Optional, Tuple

from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from ..models.feedback import Feedback
from ..models.user import User


class AdminRepo:
    """Handles direct DB queries for admin operations."""

    def __init__(self, session: Session):
        self.session = session

    # ── User Queries ─────────────────────────────────────────────────────────

    def list_users(self, skip: int = 0, limit: int = 50) -> Tuple[List[User], int]:
        """List all users with pagination."""
        total = self.session.scalar(select(func.count(User.id)))

        stmt = (
            select(User)
            .order_by(User.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        users = list(self.session.scalars(stmt).all())
        return users, total or 0

    def get_user_by_id(self, user_id: int) -> Optional[User]:
        """Get a user by internal ID."""
        stmt = select(User).where(User.id == user_id)
        return self.session.scalars(stmt).first()

    def update_user_pro_grant(
        self,
        user: User,
        granted_pro_until: datetime,
        granted_by: str,
    ) -> User:
        """Grant pro access to a user. Flushes only."""
        user.granted_pro_until = granted_pro_until
        user.granted_by = granted_by
        self.session.flush()
        return user

    def revoke_user_pro_grant(self, user: User) -> User:
        """Revoke granted pro access from a user. Flushes only."""
        user.granted_pro_until = None
        user.granted_by = None
        self.session.flush()
        return user

    def update_user_admin_flag(self, user: User, is_admin: bool) -> User:
        """Update admin flag on a user. Flushes only."""
        user.is_admin = is_admin
        self.session.flush()
        return user

    def delete_user(self, user: User) -> None:
        """Delete a user (cascade handles related data). Flushes only."""
        self.session.delete(user)
        self.session.flush()

    # ── Feedback Queries ─────────────────────────────────────────────────────

    def list_feedback(
        self,
        skip: int = 0,
        limit: int = 50,
        category: Optional[str] = None,
        status: Optional[str] = None,
        user_id: Optional[int] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
    ) -> Tuple[List[Feedback], int]:
        """List feedback with optional filters and pagination."""
        base = select(Feedback)
        count_base = select(func.count(Feedback.id))

        # Apply filters
        if category:
            base = base.where(Feedback.category == category)
            count_base = count_base.where(Feedback.category == category)
        if status:
            base = base.where(Feedback.status == status)
            count_base = count_base.where(Feedback.status == status)
        if user_id is not None:
            base = base.where(Feedback.user_id == user_id)
            count_base = count_base.where(Feedback.user_id == user_id)
        if date_from:
            base = base.where(Feedback.created_at >= date_from)
            count_base = count_base.where(Feedback.created_at >= date_from)
        if date_to:
            base = base.where(Feedback.created_at <= date_to)
            count_base = count_base.where(Feedback.created_at <= date_to)

        total = self.session.scalar(count_base)

        stmt = (
            base
            .options(joinedload(Feedback.user))
            .order_by(Feedback.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        items = list(self.session.scalars(stmt).unique().all())
        return items, total or 0

    def get_feedback_by_id(self, feedback_id: int) -> Optional[Feedback]:
        """Get a single feedback with user eagerly loaded."""
        stmt = (
            select(Feedback)
            .options(joinedload(Feedback.user))
            .where(Feedback.id == feedback_id)
        )
        return self.session.scalars(stmt).first()

    def update_feedback(
        self,
        feedback: Feedback,
        status: Optional[str] = None,
        admin_notes: Optional[str] = None,
    ) -> Feedback:
        """Update feedback status and/or admin notes. Flushes only."""
        if status is not None:
            feedback.status = status
        if admin_notes is not None:
            feedback.admin_notes = admin_notes
        self.session.flush()
        return feedback
