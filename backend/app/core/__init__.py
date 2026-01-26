"""app/core/__init__.py

Core configuration and utilities.
"""

from .auth_config import AuthSettings, get_auth_settings

__all__ = ["AuthSettings", "get_auth_settings"]
