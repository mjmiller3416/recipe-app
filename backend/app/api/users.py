"""app/api/users.py

User profile API routes.
"""

from fastapi import APIRouter, Depends

from app.api.auth import get_current_user
from app.dtos.admin_dtos import CurrentUserDTO
from app.models.user import User

router = APIRouter()


@router.get("/me", response_model=CurrentUserDTO)
def get_current_user_profile(
    current_user: User = Depends(get_current_user),
) -> CurrentUserDTO:
    """Get the current user's profile including admin status."""
    return CurrentUserDTO.from_model(current_user)
