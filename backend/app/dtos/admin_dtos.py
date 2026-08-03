"""Admin panel DTOs for user management."""

from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING, Any, List, Optional

from pydantic import BaseModel, Field

if TYPE_CHECKING:
    from app.models.user import User


# ── Current User DTO ─────────────────────────────────────────────────────────


class CurrentUserDTO(BaseModel):
    """Response DTO for the /api/users/me endpoint."""

    id: int
    email: str
    name: Optional[str] = None
    avatar_url: Optional[str] = None
    is_admin: bool
    subscription_tier: str
    has_pro_access: bool
    access_reason: str

    @classmethod
    def from_model(cls, user: User) -> CurrentUserDTO:
        return cls(
            id=user.id,
            email=user.email,
            name=user.name,
            avatar_url=user.avatar_url,
            is_admin=user.is_admin,
            subscription_tier=user.subscription_tier,
            has_pro_access=user.has_pro_access,
            access_reason=user.access_reason,
        )


# ── Admin User DTOs ─────────────────────────────────────────────────────────


class AdminUserListDTO(BaseModel):
    """Response DTO for a single user in admin listing."""

    id: int
    email: str
    name: Optional[str] = None
    avatar_url: Optional[str] = None
    subscription_tier: str
    subscription_status: str
    is_admin: bool
    has_pro_access: bool
    access_reason: str
    granted_pro_until: Optional[datetime] = None
    granted_by: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    @classmethod
    def from_model(cls, user: User) -> AdminUserListDTO:
        return cls(
            id=user.id,
            email=user.email,
            name=user.name,
            avatar_url=user.avatar_url,
            subscription_tier=user.subscription_tier,
            subscription_status=user.subscription_status,
            is_admin=user.is_admin,
            has_pro_access=user.has_pro_access,
            access_reason=user.access_reason,
            granted_pro_until=user.granted_pro_until,
            granted_by=user.granted_by,
            created_at=user.created_at,
            updated_at=user.updated_at,
        )


class AdminUserListResponseDTO(BaseModel):
    """Paginated response for admin user listing."""

    items: List[AdminUserListDTO]
    total: int


class AdminGrantProDTO(BaseModel):
    """Request DTO for granting pro access to a user."""

    granted_pro_until: datetime = Field(..., description="Expiration datetime for granted pro access")
    granted_by: str = Field(..., min_length=1, max_length=100, description="Who granted access")


class AdminToggleAdminDTO(BaseModel):
    """Request DTO for toggling admin flag on a user."""

    is_admin: bool


# ── Database Query DTOs ─────────────────────────────────────────────────────


class AdminQueryRequestDTO(BaseModel):
    """Request DTO for executing a read-only SQL query."""

    query: str = Field(..., min_length=1, max_length=10000)


class AdminQueryResponseDTO(BaseModel):
    """Response DTO for SQL query results."""

    columns: List[str]
    rows: List[List[Any]]
    row_count: int
    execution_time_ms: float
