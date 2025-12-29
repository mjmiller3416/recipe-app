"""Service for generating cooking tips using Gemini."""

import os
from typing import Optional
from dotenv import load_dotenv

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
        api_key = os.getenv("GEMINI_COOKING_TIP_API_KEY") or os.getenv("GEMINI_API_KEY")
        _genai_client = genai.Client(api_key=api_key)
    return _genai_client


# Prompt for generating cooking tips
TIP_PROMPT = """Generate a single, helpful cooking tip. The tip should be:
- Practical and actionable
- About 1-2 sentences long
- Related to cooking techniques, ingredient handling, food safety, kitchen efficiency, or flavor enhancement
- Suitable for home cooks of all skill levels

Just provide the tip text directly, no prefix like "Tip:" or bullet points."""

# Model configuration
MODEL_NAME = "gemini-2.0-flash"


class CookingTipService:
    """Service for generating cooking tips using Gemini AI."""

    def __init__(self):
        """Initialize the cooking tip service."""
        # Use dedicated key if set, otherwise fall back to shared key
        self.api_key = os.getenv("GEMINI_COOKING_TIP_API_KEY") or os.getenv("GEMINI_API_KEY")
        if not self.api_key:
            raise ValueError(
                "GEMINI_COOKING_TIP_API_KEY or GEMINI_API_KEY environment variable is not set"
            )

    def generate_tip(self) -> dict:
        """
        Generate a random cooking tip.

        Returns:
            dict with 'success', 'tip', and optional 'error'
        """
        try:
            client = _get_genai_client()

            # Generate the tip
            response = client.models.generate_content(
                model=MODEL_NAME,
                contents=[TIP_PROMPT],
            )

            # Extract the text from the response
            if response and response.candidates:
                for candidate in response.candidates:
                    if candidate.content and candidate.content.parts:
                        for part in candidate.content.parts:
                            if hasattr(part, "text") and part.text:
                                return {
                                    "success": True,
                                    "tip": part.text.strip(),
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
