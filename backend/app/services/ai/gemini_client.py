"""Shared Gemini client factory for AI services.

Provides a lazy-initialized client factory that eliminates the duplicated
client initialization pattern across individual AI services.
"""

import os
from typing import Optional

from dotenv import load_dotenv

load_dotenv()

# Cache of initialized clients keyed by resolved API key
_clients: dict[str, object] = {}


def get_gemini_client(api_key_env: str, fallback_env: Optional[str] = None) -> object:
    """Get a lazily-initialized Gemini client for the given API key env var.

    Args:
        api_key_env: Primary environment variable name for the API key.
        fallback_env: Optional fallback environment variable if primary is unset.

    Returns:
        A google.genai.Client instance.

    Raises:
        ValueError: If no API key is found in any of the specified env vars.
    """
    api_key = os.getenv(api_key_env)
    if not api_key and fallback_env:
        api_key = os.getenv(fallback_env)

    if not api_key:
        env_names = api_key_env if not fallback_env else f"{api_key_env} or {fallback_env}"
        raise ValueError(f"API key not found. Set {env_names}.")

    if api_key not in _clients:
        from google import genai

        _clients[api_key] = genai.Client(api_key=api_key)

    return _clients[api_key]
