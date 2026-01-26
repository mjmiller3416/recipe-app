"""app/core/auth_config.py

Authentication configuration using pydantic-settings.
Manages Clerk JWT validation settings and development mode bypass.
"""

from functools import lru_cache
from typing import Optional

from pydantic_settings import BaseSettings, SettingsConfigDict


class AuthSettings(BaseSettings):
    """
    Authentication settings loaded from environment variables.

    Attributes:
        clerk_secret_key: Clerk secret key for API calls (sk_xxx)
        clerk_publishable_key: Clerk publishable key (pk_xxx)
        clerk_jwks_url: URL to fetch Clerk's JWKS for JWT verification
        auth_disabled: When True, bypasses JWT validation (for local dev)
        dev_user_id: User ID to use when auth_disabled is True
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Clerk configuration
    clerk_secret_key: Optional[str] = None
    clerk_publishable_key: Optional[str] = None
    clerk_jwks_url: str = "https://api.clerk.com/v1/jwks"

    # Development mode bypass
    auth_disabled: bool = False
    dev_user_id: int = 1

    @property
    def is_configured(self) -> bool:
        """Check if Clerk is properly configured for production use."""
        return bool(self.clerk_secret_key and self.clerk_publishable_key)


@lru_cache()
def get_auth_settings() -> AuthSettings:
    """
    Get cached auth settings instance.

    Uses lru_cache to ensure settings are loaded once and reused,
    avoiding repeated .env file reads.
    """
    return AuthSettings()
