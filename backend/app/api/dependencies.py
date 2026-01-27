"""app/api/dependencies.py

FastAPI dependencies for authentication and authorization.
Provides get_current_user and related dependencies for protecting routes.
"""

import logging
import time
from typing import Optional

import httpx
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from ..core.auth_config import AuthSettings, get_auth_settings
from ..database.db import get_session
from ..models.user import User
from ..services.user_service import UserService

logger = logging.getLogger(__name__)

# Security scheme for Bearer tokens
security = HTTPBearer(auto_error=False)

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
        print(f"[JWKS] Fetching from: {jwks_url}")
        async with httpx.AsyncClient() as client:
            response = await client.get(
                jwks_url,
                timeout=10.0,
            )
            print(f"[JWKS] Response status: {response.status_code}")
            response.raise_for_status()
            _jwks_cache = response.json()
            _jwks_cache_time = current_time
            print(f"[JWKS] SUCCESS - cached {len(_jwks_cache.get('keys', []))} keys")
            return _jwks_cache
    except httpx.HTTPStatusError as e:
        print(f"[JWKS] HTTP ERROR: status={e.response.status_code}, body={e.response.text[:200]}")
        if _jwks_cache:
            print("[JWKS] Using stale cache")
            return _jwks_cache
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication service unavailable",
        )
    except Exception as e:
        print(f"[JWKS] EXCEPTION: {type(e).__name__}: {e}")
        # Return stale cache if available
        if _jwks_cache:
            print("[JWKS] Using stale cache")
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
        print(f"[AUTH] Token kid={kid}, JWKS has kids={[k.get('kid') for k in jwks.get('keys', [])]}")

        for key in jwks.get("keys", []):
            if key.get("kid") == kid:
                return key

        print(f"[AUTH] ERROR: No matching key found for kid={kid}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unable to find signing key",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except JWTError as e:
        print(f"[AUTH] ERROR: Invalid token header: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token header: {e}",
            headers={"WWW-Authenticate": "Bearer"},
        )


# ── Authentication Dependencies ─────────────────────────────────────────────


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    session: Session = Depends(get_session),
    settings: AuthSettings = Depends(get_auth_settings),
) -> User:
    """
    Dependency to get the currently authenticated user.

    Flow:
    1. If auth_disabled, return dev user (for local development)
    2. Extract and validate Bearer token
    3. Decode JWT using Clerk's JWKS
    4. Look up or create user from token claims

    Usage:
        @router.get("/me")
        def get_profile(current_user: User = Depends(get_current_user)):
            return current_user

    Returns:
        User: The authenticated user.

    Raises:
        HTTPException 401: Missing or invalid token.
        HTTPException 500: Dev user not found (only in dev mode).
    """
    # Debug: Print auth state
    print(f"[AUTH] auth_disabled={settings.auth_disabled}, has_credentials={credentials is not None}")

    # Dev mode bypass - return configured dev user
    if settings.auth_disabled:
        print("[AUTH] Dev mode - bypassing authentication")
        user_service = UserService(session)
        dev_user = user_service.get_by_id(settings.dev_user_id)
        if not dev_user:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Dev user with id={settings.dev_user_id} not found. "
                f"Run migrations and seed data first.",
            )
        return dev_user

    # Require token in production mode
    if not credentials:
        print("[AUTH] No credentials provided - returning 401")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials
    print(f"[AUTH] Token received, length={len(token)}")

    # Get JWKS and find matching signing key
    print(f"[AUTH] Fetching JWKS...")
    jwks = await get_clerk_jwks(settings)
    print(f"[AUTH] Got JWKS with {len(jwks.get('keys', []))} keys")

    signing_key = _get_signing_key(jwks, token)
    print(f"[AUTH] Found signing key: kid={signing_key.get('kid', 'unknown')}")

    # Decode and verify JWT
    try:
        payload = jwt.decode(
            token,
            signing_key,
            algorithms=["RS256"],
            options={
                "verify_aud": False,  # Clerk doesn't always set aud
                "verify_iss": False,  # We trust Clerk's signature
            },
        )
        print(f"[AUTH] JWT decoded successfully, sub={payload.get('sub', 'unknown')}")
    except JWTError as e:
        print(f"[AUTH] JWT DECODE FAILED: {type(e).__name__}: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Extract claims from JWT
    # Clerk JWTs use 'sub' for user ID, and may include email in different fields
    clerk_id = payload.get("sub")
    email = (
        payload.get("email")
        or payload.get("primary_email_address")
        or payload.get("email_addresses", [{}])[0].get("email_address")
    )
    name = payload.get("name") or payload.get("first_name")
    avatar_url = payload.get("picture") or payload.get("image_url")

    if not clerk_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token missing required claim: sub",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token missing required claim: email",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Get or create user from token claims
    user_service = UserService(session)
    user = user_service.get_or_create_from_clerk(
        clerk_id=clerk_id,
        email=email,
        name=name,
        avatar_url=avatar_url,
    )

    return user


async def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    session: Session = Depends(get_session),
    settings: AuthSettings = Depends(get_auth_settings),
) -> Optional[User]:
    """
    Like get_current_user, but returns None instead of raising 401.

    Useful for endpoints that work differently for authenticated vs anonymous users.
    For example, a recipe list might show public recipes to everyone but
    include user's private recipes only when authenticated.

    Usage:
        @router.get("/recipes")
        def list_recipes(current_user: Optional[User] = Depends(get_current_user_optional)):
            if current_user:
                # Include user's private recipes
                ...
            else:
                # Public recipes only
                ...

    Returns:
        User if authenticated, None otherwise.
    """
    if not credentials and not settings.auth_disabled:
        return None

    try:
        return await get_current_user(credentials, session, settings)
    except HTTPException:
        return None


def require_pro(
    user: User = Depends(get_current_user),
) -> User:
    """
    Dependency that requires pro-level access.

    Checks the user's has_pro_access property, which considers:
    - Admin status (permanent access)
    - Active paid subscription
    - Temporary granted access (testers/promos)

    Usage:
        @router.post("/ai/generate-image")
        def generate_image(current_user: User = Depends(require_pro)):
            # Only pro users can access this
            ...

    Returns:
        User: The authenticated user with pro access.

    Raises:
        HTTPException 403: User doesn't have pro access.
    """
    if not user.has_pro_access:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Pro subscription required for this feature",
        )
    return user
