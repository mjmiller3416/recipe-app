"""Service for generating cooking tips using Gemini."""

import logging
import os
import random
import re
import threading
from collections import deque
from typing import Optional
from dotenv import load_dotenv

from app.ai.dtos.cooking_tip_dtos import CookingTipResponseDTO
from app.ai.config.cooking_tips_config import (
    TIP_CATEGORIES,
    TIP_PROMPT_TEMPLATE,
    MODEL_NAME,
    TEMPERATURE,
    MAX_OUTPUT_TOKENS,
    API_KEY_ENV_VAR,
    API_KEY_ENV_VAR_ALT,
)

logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

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
        # Validate that at least one API key is set (matches _get_genai_client logic)
        if not os.getenv(API_KEY_ENV_VAR_ALT) and not os.getenv(API_KEY_ENV_VAR):
            raise ValueError(
                f"Either {API_KEY_ENV_VAR_ALT} or {API_KEY_ENV_VAR} must be set"
            )

        # Instance state for thread-safe category rotation and tip deduplication
        self._shuffled_categories: list[str] = []
        self._recent_tips: deque = deque(maxlen=50)
        self._lock = threading.Lock()

    def _get_next_category(self) -> str:
        """Get next category using shuffle bag algorithm."""
        with self._lock:
            if not self._shuffled_categories:
                self._shuffled_categories = TIP_CATEGORIES.copy()
                random.shuffle(self._shuffled_categories)
            return self._shuffled_categories.pop()

    def _normalize_tip(self, tip: str) -> str:
        """Normalize tip for comparison: lowercase, no punctuation, collapsed spaces."""
        tip = tip.lower()
        tip = re.sub(r'[^\w\s]', '', tip)
        tip = re.sub(r'\s+', ' ', tip).strip()
        return tip

    def _jaccard_similarity(self, a: str, b: str) -> float:
        """Calculate Jaccard similarity between two normalized tips."""
        words_a = set(a.split())
        words_b = set(b.split())
        if not words_a or not words_b:
            return 0.0
        intersection = words_a & words_b
        union = words_a | words_b
        return len(intersection) / len(union)

    def _is_duplicate(self, tip: str) -> bool:
        """Check if tip is too similar to recent tips."""
        normalized = self._normalize_tip(tip)
        for recent in self._recent_tips:
            if self._jaccard_similarity(normalized, recent) > 0.6:
                return True
        return False

    def _clean_tip(self, tip: str) -> str:
        """Remove common prefixes and clean up formatting."""
        # Remove common prefixes
        tip = re.sub(r'^(Tip:|Chef\'s Tip:|Pro Tip:|\*|\-|•)\s*', '', tip, flags=re.IGNORECASE)
        # Remove quotes if wrapped
        tip = tip.strip('"\'')
        return tip.strip()

    def generate_tip(self) -> CookingTipResponseDTO:
        """
        Generate a random cooking tip with deduplication.

        Returns:
            CookingTipResponseDTO with success status, tip text, and optional error
        """
        try:
            from google.genai import types

            client = _get_genai_client()
            max_retries = 3

            for attempt in range(max_retries):
                # Pick a category using shuffle bag (guarantees full rotation)
                category = self._get_next_category()
                prompt = TIP_PROMPT_TEMPLATE.format(category=category)

                # Generate the tip with constrained output
                response = client.models.generate_content(
                    model=MODEL_NAME,
                    contents=[prompt],
                    config=types.GenerateContentConfig(
                        temperature=TEMPERATURE,
                        max_output_tokens=MAX_OUTPUT_TOKENS,
                    ),
                )

                # Extract the text from the response
                if response and response.candidates:
                    for candidate in response.candidates:
                        if candidate.content and candidate.content.parts:
                            for part in candidate.content.parts:
                                if hasattr(part, "text") and part.text:
                                    tip_text = self._clean_tip(part.text.strip())

                                    # Check for duplicate tips
                                    if self._is_duplicate(tip_text):
                                        logger.info(f"[ChefTip] Duplicate detected, retrying ({attempt + 1}/{max_retries})")
                                        continue

                                    # Track this tip to prevent future duplicates
                                    normalized = self._normalize_tip(tip_text)
                                    self._recent_tips.append(normalized)

                                    logger.info(f"[ChefTip] Category: {category} | Generated: {tip_text[:60]}...")
                                    return CookingTipResponseDTO(
                                        success=True,
                                        tip=tip_text,
                                        error=None,
                                    )

            # All retries exhausted (rare edge case)
            return CookingTipResponseDTO(
                success=False,
                tip=None,
                error="Could not generate unique tip after retries",
            )

        except ImportError:
            return CookingTipResponseDTO(
                success=False,
                tip=None,
                error="google-genai package is not installed",
            )
        except Exception as e:
            return CookingTipResponseDTO(
                success=False,
                tip=None,
                error=str(e),
            )


# Singleton instance
_service_instance: Optional[CookingTipService] = None


def get_cooking_tip_service() -> CookingTipService:
    """Get the singleton instance of the cooking tip service."""
    global _service_instance
    if _service_instance is None:
        _service_instance = CookingTipService()
    return _service_instance
