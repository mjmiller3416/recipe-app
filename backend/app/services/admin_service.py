"""app/services/admin_service.py

Service layer for admin operations. Handles user management
and feedback review business logic.
"""

from datetime import datetime
from typing import Optional

from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from ..dtos.admin_dtos import (
    AdminFeedbackDetailDTO,
    AdminFeedbackListItemDTO,
    AdminFeedbackListResponseDTO,
    AdminFeedbackUpdateDTO,
    AdminGrantProDTO,
    AdminUserListDTO,
    AdminUserListResponseDTO,
)
from ..repositories.admin_repo import AdminRepo


# ── Domain Exceptions ────────────────────────────────────────────────────────


class AdminUserNotFoundError(Exception):
    """Raised when the target user is not found."""
    pass


class AdminFeedbackNotFoundError(Exception):
    """Raised when the target feedback is not found."""
    pass


class CannotDeleteSelfError(Exception):
    """Raised when an admin tries to delete their own account."""
    pass


class CannotDemoteSelfError(Exception):
    """Raised when an admin tries to remove their own admin flag."""
    pass


class AdminSaveError(Exception):
    """Raised when an admin operation fails to persist."""
    pass


VALID_FEEDBACK_STATUSES = {"new", "read", "in_progress", "resolved"}


# ── Admin Service ────────────────────────────────────────────────────────────


class AdminService:
    """Service for admin panel operations."""

    def __init__(self, session: Session, current_user_id: int):
        self.session = session
        self.current_user_id = current_user_id
        self.repo = AdminRepo(session)

    # ── User Management ──────────────────────────────────────────────────────

    def list_users(self, skip: int = 0, limit: int = 50) -> AdminUserListResponseDTO:
        """List all users with pagination."""
        users, total = self.repo.list_users(skip=skip, limit=limit)
        return AdminUserListResponseDTO(
            items=[AdminUserListDTO.from_model(u) for u in users],
            total=total,
        )

    def grant_pro(self, user_id: int, dto: AdminGrantProDTO) -> AdminUserListDTO:
        """Grant temporary pro access to a user."""
        user = self.repo.get_user_by_id(user_id)
        if not user:
            raise AdminUserNotFoundError(f"User {user_id} not found")

        try:
            user = self.repo.update_user_pro_grant(
                user,
                granted_pro_until=dto.granted_pro_until,
                granted_by=dto.granted_by,
            )
            self.session.commit()
            return AdminUserListDTO.from_model(user)
        except SQLAlchemyError as e:
            self.session.rollback()
            raise AdminSaveError(f"Failed to grant pro access: {e}") from e

    def revoke_pro(self, user_id: int) -> AdminUserListDTO:
        """Revoke granted pro access from a user."""
        user = self.repo.get_user_by_id(user_id)
        if not user:
            raise AdminUserNotFoundError(f"User {user_id} not found")

        try:
            user = self.repo.revoke_user_pro_grant(user)
            self.session.commit()
            return AdminUserListDTO.from_model(user)
        except SQLAlchemyError as e:
            self.session.rollback()
            raise AdminSaveError(f"Failed to revoke pro access: {e}") from e

    def toggle_admin(self, user_id: int, is_admin: bool) -> AdminUserListDTO:
        """Toggle admin flag on a user."""
        if user_id == self.current_user_id and not is_admin:
            raise CannotDemoteSelfError("Cannot remove your own admin access")

        user = self.repo.get_user_by_id(user_id)
        if not user:
            raise AdminUserNotFoundError(f"User {user_id} not found")

        try:
            user = self.repo.update_user_admin_flag(user, is_admin=is_admin)
            self.session.commit()
            return AdminUserListDTO.from_model(user)
        except SQLAlchemyError as e:
            self.session.rollback()
            raise AdminSaveError(f"Failed to toggle admin flag: {e}") from e

    def delete_user(self, user_id: int) -> None:
        """Delete a user and all their data."""
        if user_id == self.current_user_id:
            raise CannotDeleteSelfError("Cannot delete your own account")

        user = self.repo.get_user_by_id(user_id)
        if not user:
            raise AdminUserNotFoundError(f"User {user_id} not found")

        try:
            self.repo.delete_user(user)
            self.session.commit()
        except SQLAlchemyError as e:
            self.session.rollback()
            raise AdminSaveError(f"Failed to delete user: {e}") from e

    # ── Feedback Management ──────────────────────────────────────────────────

    def list_feedback(
        self,
        skip: int = 0,
        limit: int = 50,
        category: Optional[str] = None,
        status: Optional[str] = None,
        user_id: Optional[int] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
    ) -> AdminFeedbackListResponseDTO:
        """List all feedback with optional filters."""
        items, total = self.repo.list_feedback(
            skip=skip,
            limit=limit,
            category=category,
            status=status,
            user_id=user_id,
            date_from=date_from,
            date_to=date_to,
        )
        return AdminFeedbackListResponseDTO(
            items=[AdminFeedbackListItemDTO.from_model(f) for f in items],
            total=total,
        )

    def get_feedback(self, feedback_id: int) -> AdminFeedbackDetailDTO:
        """Get a single feedback detail."""
        feedback = self.repo.get_feedback_by_id(feedback_id)
        if not feedback:
            raise AdminFeedbackNotFoundError(f"Feedback {feedback_id} not found")
        return AdminFeedbackDetailDTO.from_model(feedback)

    def update_feedback(
        self, feedback_id: int, dto: AdminFeedbackUpdateDTO
    ) -> AdminFeedbackDetailDTO:
        """Update feedback status and/or admin notes."""
        feedback = self.repo.get_feedback_by_id(feedback_id)
        if not feedback:
            raise AdminFeedbackNotFoundError(f"Feedback {feedback_id} not found")

        try:
            feedback = self.repo.update_feedback(
                feedback,
                status=dto.status,
                admin_notes=dto.admin_notes,
            )
            self.session.commit()
            return AdminFeedbackDetailDTO.from_model(feedback)
        except SQLAlchemyError as e:
            self.session.rollback()
            raise AdminSaveError(f"Failed to update feedback: {e}") from e
