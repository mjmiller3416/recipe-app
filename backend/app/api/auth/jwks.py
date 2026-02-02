"""app/api/auth/jwks.py

JWKS (JSON Web Key Set) fetching and caching infrastructure for Clerk authentication.
Provides public key retrieval for JWT signature verification.
"""

import logging
import time

import httpx
from fastapi import Depends, HTTPException, status
from jose import JWTError, jwt

from ...core.auth_config import AuthSettings, get_auth_settings

logger = logging.getLogger(__name__)

# ── JWKS Caching ────────────────────────────────────────────────────────────
# Cache Clerk's JWKS to avoid fetching on every request
_jwks_cache: dict = {}
_jwks_cache_time: float = 0
JWKS_CACHE_TTL = 3600  # 1 hour in seconds


async def get_clerk_jwks(
    settings: AuthSettings = Depends(get_auth_settings),
) -> dict:
    """
    Fetch and cache Clerk's JWKS (JSON Web Key Set).

    The JWKS contains public keys used to verify JWT signatures.
    Keys are cached for 1 hour to minimize external API calls.

    The JWKS endpoint is PUBLIC and does NOT require authentication.
    The URL is derived from the Clerk publishable key (see auth_config.py).

    If the fetch fails, returns stale cache if available.

    Returns:
        dict: The JWKS containing signing keys.

    Raises:
        HTTPException 503: If JWKS fetch fails and no cache available.
    """
    global _jwks_cache, _jwks_cache_time

    current_time = time.time()

    # Return cached JWKS if still valid
    if _jwks_cache and (current_time - _jwks_cache_time) < JWKS_CACHE_TTL:
        return _jwks_cache

    # Get the effective JWKS URL (derived from publishable key or explicit override)
    jwks_url = settings.effective_jwks_url
    if not jwks_url:
        logger.error(
            "No JWKS URL available. Ensure CLERK_PUBLISHABLE_KEY is set, "
            "or provide an explicit CLERK_JWKS_URL."
        )
        if _jwks_cache:
            logger.warning("Using stale JWKS cache due to missing URL")
            return _jwks_cache
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication not configured",
        )

    # Fetch fresh JWKS from Clerk
    # NOTE: The JWKS endpoint is PUBLIC - no Authorization header needed
    try:
        logger.debug(f"Fetching JWKS from: {jwks_url}")
        async with httpx.AsyncClient() as client:
            response = await client.get(
                jwks_url,
                timeout=10.0,
            )
            logger.debug(f"JWKS response status: {response.status_code}")
            response.raise_for_status()
            _jwks_cache = response.json()
            _jwks_cache_time = current_time
            logger.debug(f"JWKS cached successfully - {len(_jwks_cache.get('keys', []))} keys")
            return _jwks_cache
    except httpx.HTTPStatusError as e:
        logger.error(f"JWKS HTTP error: status={e.response.status_code}, body={e.response.text[:200]}")
        if _jwks_cache:
            logger.warning("Using stale JWKS cache after HTTP error")
            return _jwks_cache
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication service unavailable",
        )
    except Exception as e:
        logger.error(f"JWKS fetch exception: {type(e).__name__}: {e}")
        # Return stale cache if available
        if _jwks_cache:
            logger.warning("Using stale JWKS cache after exception")
            return _jwks_cache
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication service unavailable",
        )


def _get_signing_key(jwks: dict, token: str) -> dict:
    """
    Extract the signing key from JWKS that matches the token's kid.

    Args:
        jwks: The JSON Web Key Set from Clerk.
        token: The JWT to verify.

    Returns:
        dict: The matching JWK for verification.

    Raises:
        HTTPException 401: If no matching key found or token header invalid.
    """
    try:
        unverified_header = jwt.get_unverified_header(token)
        kid = unverified_header.get("kid")
        logger.debug(f"Token kid={kid}, JWKS has kids={[k.get('kid') for k in jwks.get('keys', [])]}")

        for key in jwks.get("keys", []):
            if key.get("kid") == kid:
                return key

        logger.error(f"No matching key found for kid={kid}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unable to find signing key",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except JWTError as e:
        logger.error(f"Invalid token header: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token header: {e}",
            headers={"WWW-Authenticate": "Bearer"},
        )
