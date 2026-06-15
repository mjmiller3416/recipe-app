"""app/api/admin.py

Admin panel API routes for user management and feedback review.
All routes require admin access.
"""

from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.auth import get_current_user, require_admin
from app.database.db import get_session
from app.dtos.admin_dtos import (
    AdminFeedbackDetailDTO,
    AdminFeedbackListResponseDTO,
    AdminFeedbackUpdateDTO,
    AdminGrantProDTO,
    AdminToggleAdminDTO,
    AdminUserListDTO,
    AdminUserListResponseDTO,
)
from app.models.user import User
from app.services.admin_service import (
    AdminFeedbackNotFoundError,
    AdminSaveError,
    AdminUserNotFoundError,
    CannotDeleteSelfError,
    CannotDemoteSelfError,
    AdminService,
)

router = APIRouter()


# ── User Management ──────────────────────────────────────────────────────────


@router.get("/users", response_model=AdminUserListResponseDTO)
def list_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    session: Session = Depends(get_session),
    current_admin: User = Depends(require_admin),
) -> AdminUserListResponseDTO:
    """List all users with pagination."""
    service = AdminService(session, current_admin.id)
    return service.list_users(skip=skip, limit=limit)


@router.patch("/users/{user_id}/pro", response_model=AdminUserListDTO)
def grant_pro(
    user_id: int,
    dto: AdminGrantProDTO,
    session: Session = Depends(get_session),
    current_admin: User = Depends(require_admin),
) -> AdminUserListDTO:
    """Grant temporary pro access to a user."""
    service = AdminService(session, current_admin.id)
    try:
        return service.grant_pro(user_id, dto)
    except AdminUserNotFoundError:
        raise HTTPException(status_code=404, detail="User not found")
    except AdminSaveError:
        raise HTTPException(status_code=500, detail="Failed to grant pro access")


@router.delete("/users/{user_id}/pro", response_model=AdminUserListDTO)
def revoke_pro(
    user_id: int,
    session: Session = Depends(get_session),
    current_admin: User = Depends(require_admin),
) -> AdminUserListDTO:
    """Revoke granted pro access from a user."""
    service = AdminService(session, current_admin.id)
    try:
        return service.revoke_pro(user_id)
    except AdminUserNotFoundError:
        raise HTTPException(status_code=404, detail="User not found")
    except AdminSaveError:
        raise HTTPException(status_code=500, detail="Failed to revoke pro access")


@router.patch("/users/{user_id}/admin", response_model=AdminUserListDTO)
def toggle_admin(
    user_id: int,
    dto: AdminToggleAdminDTO,
    session: Session = Depends(get_session),
    current_admin: User = Depends(require_admin),
) -> AdminUserListDTO:
    """Toggle admin flag on a user."""
    service = AdminService(session, current_admin.id)
    try:
        return service.toggle_admin(user_id, dto.is_admin)
    except CannotDemoteSelfError:
        raise HTTPException(
            status_code=400, detail="Cannot remove your own admin access"
        )
    except AdminUserNotFoundError:
        raise HTTPException(status_code=404, detail="User not found")
    except AdminSaveError:
        raise HTTPException(status_code=500, detail="Failed to toggle admin flag")


@router.delete(
    "/users/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_user(
    user_id: int,
    session: Session = Depends(get_session),
    current_admin: User = Depends(require_admin),
) -> None:
    """Delete a user and all their data."""
    service = AdminService(session, current_admin.id)
    try:
        service.delete_user(user_id)
    except CannotDeleteSelfError:
        raise HTTPException(
            status_code=400, detail="Cannot delete your own account"
        )
    except AdminUserNotFoundError:
        raise HTTPException(status_code=404, detail="User not found")
    except AdminSaveError:
        raise HTTPException(status_code=500, detail="Failed to delete user")


# ── Feedback Management ──────────────────────────────────────────────────────


@router.get("/feedback", response_model=AdminFeedbackListResponseDTO)
def list_feedback(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    category: Optional[str] = Query(None),
    feedback_status: Optional[str] = Query(None, alias="status"),
    user_id: Optional[int] = Query(None),
    date_from: Optional[datetime] = Query(None),
    date_to: Optional[datetime] = Query(None),
    session: Session = Depends(get_session),
    current_admin: User = Depends(require_admin),
) -> AdminFeedbackListResponseDTO:
    """List all feedback with optional filters."""
    service = AdminService(session, current_admin.id)
    return service.list_feedback(
        skip=skip,
        limit=limit,
        category=category,
        status=feedback_status,
        user_id=user_id,
        date_from=date_from,
        date_to=date_to,
    )


@router.get("/feedback/{feedback_id}", response_model=AdminFeedbackDetailDTO)
def get_feedback(
    feedback_id: int,
    session: Session = Depends(get_session),
    current_admin: User = Depends(require_admin),
) -> AdminFeedbackDetailDTO:
    """Get a single feedback detail."""
    service = AdminService(session, current_admin.id)
    try:
        return service.get_feedback(feedback_id)
    except AdminFeedbackNotFoundError:
        raise HTTPException(status_code=404, detail="Feedback not found")


@router.patch("/feedback/{feedback_id}", response_model=AdminFeedbackDetailDTO)
def update_feedback(
    feedback_id: int,
    dto: AdminFeedbackUpdateDTO,
    session: Session = Depends(get_session),
    current_admin: User = Depends(require_admin),
) -> AdminFeedbackDetailDTO:
    """Update feedback status and/or admin notes."""
    service = AdminService(session, current_admin.id)
    try:
        return service.update_feedback(feedback_id, dto)
    except AdminFeedbackNotFoundError:
        raise HTTPException(status_code=404, detail="Feedback not found")
    except AdminSaveError:
        raise HTTPException(status_code=500, detail="Failed to update feedback")
