"""Service for generating cooking tips using Gemini."""

import logging
import os
import random
from typing import Optional
from dotenv import load_dotenv

from app.ai.config.cooking_tips_config import (
    TIP_CATEGORIES,
    TIP_PROMPT_TEMPLATE,
    MODEL_NAME,
    TEMPERATURE,
    MAX_RECENT_CATEGORIES,
    API_KEY_ENV_VAR,
    API_KEY_ENV_VAR_ALT,
)

logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Track recently used categories to prevent repetition
_recent_categories: list[str] = []


def _get_next_category() -> str:
    """Get a random category that hasn't been used recently."""
    global _recent_categories

    # Get categories not recently used
    available = [c for c in TIP_CATEGORIES if c not in _recent_categories]

    # If we've exhausted all categories, reset the recent list
    if not available:
        _recent_categories = []
        available = TIP_CATEGORIES.copy()

    # Pick a random category from available ones
    category = random.choice(available)

    # Track it as recently used
    _recent_categories.append(category)
    if len(_recent_categories) > MAX_RECENT_CATEGORIES:
        _recent_categories.pop(0)

    return category


# Lazy import to avoid issues if package not installed
_genai_client = None


def _get_genai_client():
    """Lazy initialization of Gemini client for cooking tips."""
    global _genai_client
    if _genai_client is None:
        from google import genai

        # Use dedicated key if set, otherwise fall back to shared key
        api_key = os.getenv(API_KEY_ENV_VAR_ALT) or os.getenv(API_KEY_ENV_VAR)
        _genai_client = genai.Client(api_key=api_key)
    return _genai_client


class CookingTipService:
    """Service for generating cooking tips using Gemini AI."""

    def __init__(self):
        """Initialize the cooking tip service."""
        # Use dedicated key if set, otherwise fall back to shared key
        self.api_key = os.getenv(API_KEY_ENV_VAR)
        if not self.api_key:
            raise ValueError(
                f"{API_KEY_ENV_VAR} environment variable is not set"
            )

    def generate_tip(self) -> dict:
        """
        Generate a random cooking tip.

        Returns:
            dict with 'success', 'tip', and optional 'error'
        """
        try:
            from google.genai import types

            client = _get_genai_client()

            # Pick a category that hasn't been used recently
            category = _get_next_category()
            prompt = TIP_PROMPT_TEMPLATE.format(category=category)

            # Generate the tip with high temperature for variety
            response = client.models.generate_content(
                model=MODEL_NAME,
                contents=[prompt],
                config=types.GenerateContentConfig(
                    temperature=TEMPERATURE,
                ),
            )

            # Extract the text from the response
            if response and response.candidates:
                for candidate in response.candidates:
                    if candidate.content and candidate.content.parts:
                        for part in candidate.content.parts:
                            if hasattr(part, "text") and part.text:
                                tip_text = part.text.strip()
                                # Debug logging for tip consistency testing
                                logger.info(f"[ChefTip] Category: {category} | Generated: {tip_text[:60]}...")
                                return {
                                    "success": True,
                                    "tip": tip_text,
                                    "error": None,
                                }

            return {
                "success": False,
                "tip": None,
                "error": "No tip in response",
            }

        except ImportError:
            return {
                "success": False,
                "tip": None,
                "error": "google-genai package is not installed",
            }
        except Exception as e:
            return {
                "success": False,
                "tip": None,
                "error": str(e),
            }


# Singleton instance
_service_instance: Optional[CookingTipService] = None


def get_cooking_tip_service() -> CookingTipService:
    """Get the singleton instance of the cooking tip service."""
    global _service_instance
    if _service_instance is None:
        _service_instance = CookingTipService()
    return _service_instance
