"""Service for generating AI images using Gemini."""

import os
import base64
from typing import Optional
from dotenv import load_dotenv

from app.ai.config.image_generation_config import (
    PROMPT_TEMPLATE,
    MODEL_NAME,
    API_KEY_ENV_VAR,
)

# Load environment variables
load_dotenv()

# Lazy import to avoid issues if package not installed
_genai_client = None


def _get_genai_client():
    """Lazy initialization of Gemini client."""
    global _genai_client
    if _genai_client is None:
        from google import genai

        api_key = os.getenv(API_KEY_ENV_VAR)
        _genai_client = genai.Client(api_key=api_key)
    return _genai_client


class ImageGenerationService:
    """Service for generating recipe images using Gemini AI."""

    def __init__(self):
        """Initialize the image generation service."""
        self.api_key = os.getenv(API_KEY_ENV_VAR)
        if not self.api_key:
            raise ValueError(f"{API_KEY_ENV_VAR} environment variable is not set")

    def generate_recipe_image(
        self, recipe_name: str, custom_prompt: str = None
    ) -> dict:
        """
        Generate an AI image for a recipe.

        Args:
            recipe_name: The name of the recipe to generate an image for.
            custom_prompt: Optional custom prompt template (must include {recipe_name}).

        Returns:
            dict with 'success', 'image_data' (base64), and optional 'error'
        """
        if not recipe_name or not recipe_name.strip():
            return {
                "success": False,
                "image_data": None,
                "error": "Recipe name is required",
            }

        try:
            client = _get_genai_client()

            # Build the prompt - use custom_prompt if provided and valid, else use default
            template = (
                custom_prompt
                if custom_prompt and "{recipe_name}" in custom_prompt
                else PROMPT_TEMPLATE
            )
            prompt = template.format(recipe_name=recipe_name.strip())

            # Generate the image
            response = client.models.generate_content(
                model=MODEL_NAME,
                contents=[prompt],
            )

            # Extract the image data from the response
            if response and response.candidates:
                for candidate in response.candidates:
                    if candidate.content and candidate.content.parts:
                        for part in candidate.content.parts:
                            # Check for inline_data (image)
                            if hasattr(part, "inline_data") and part.inline_data:
                                image_data = part.inline_data.data
                                # The data might already be base64 string or bytes
                                if isinstance(image_data, bytes):
                                    image_data = base64.b64encode(image_data).decode(
                                        "utf-8"
                                    )
                                return {
                                    "success": True,
                                    "image_data": image_data,
                                    "error": None,
                                }

            return {
                "success": False,
                "image_data": None,
                "error": "No image data in response",
            }

        except ImportError:
            return {
                "success": False,
                "image_data": None,
                "error": "google-genai package is not installed",
            }
        except Exception as e:
            return {
                "success": False,
                "image_data": None,
                "error": str(e),
            }


# Singleton instance
_service_instance: Optional[ImageGenerationService] = None


def get_image_generation_service() -> ImageGenerationService:
    """Get the singleton instance of the image generation service."""
    global _service_instance
    if _service_instance is None:
        _service_instance = ImageGenerationService()
    return _service_instance
