"""app/api/settings.py

API routes for user settings management.
Provides endpoints to read and update user preferences.
"""

from typing import Any, Dict

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.auth import get_current_user
from app.database.db import get_session
from app.models.user import User
from app.repositories.user_repo import UserRepo

router = APIRouter()


@router.get("", response_model=Dict[str, Any])
def get_settings(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Get current user's settings.

    Returns the user's settings as a dictionary. If no settings exist,
    creates default settings and returns them.
    """
    repo = UserRepo(session)
    user_settings = repo.get_or_create_settings(current_user.id)
    session.commit()
    return user_settings.settings


@router.put("", response_model=Dict[str, Any])
def replace_settings(
    new_settings: Dict[str, Any],
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Replace all user settings with provided values.

    The new settings completely replace existing settings. Missing keys
    will be filled in from defaults by the model's setter.
    """
    repo = UserRepo(session)
    user_settings = repo.get_or_create_settings(current_user.id)
    user_settings.settings = new_settings
    session.commit()
    return user_settings.settings


@router.patch("", response_model=Dict[str, Any])
def update_settings(
    partial_settings: Dict[str, Any],
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Merge provided settings with existing settings.

    Only the keys provided in the request body are updated.
    Existing settings not included in the request are preserved.
    """
    repo = UserRepo(session)
    user_settings = repo.get_or_create_settings(current_user.id)

    # Merge partial update with existing settings
    current = user_settings.settings
    current.update(partial_settings)
    user_settings.settings = current

    session.commit()
    return user_settings.settings
