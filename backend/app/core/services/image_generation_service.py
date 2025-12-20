"""Service for generating AI images using Gemini."""

import os
import base64
from typing import Optional
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Lazy import to avoid issues if package not installed
_genai_client = None


def _get_genai_client():
    """Lazy initialization of Gemini client."""
    global _genai_client
    if _genai_client is None:
        from google import genai

        _genai_client = genai.Client()
    return _genai_client


# Prompt template for food photography
PROMPT_TEMPLATE = (
    "A professional food photograph of {recipe_name} captured at a 45-degree "
    "angle. The dish is placed on a rustic wooden table with cutting board, "
    "shallow depth of field, steam rising, scattered herbs and seasonings, "
    "complementary ingredients as props in soft-focus background, "
    "cozy home kitchen atmosphere, appetizing, high detail, "
    "no people, no hands, square format"
)

# Model configuration
MODEL_NAME = "gemini-2.5-flash-image"
ASPECT_RATIO = "1:1"  # Square format


class ImageGenerationService:
    """Service for generating recipe images using Gemini AI."""

    def __init__(self):
        """Initialize the image generation service."""
        self.api_key = os.getenv("GEMINI_API_KEY")
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY environment variable is not set")

    def generate_recipe_image(self, recipe_name: str) -> dict:
        """
        Generate an AI image for a recipe.

        Args:
            recipe_name: The name of the recipe to generate an image for.

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

            # Build the prompt
            prompt = PROMPT_TEMPLATE.format(recipe_name=recipe_name.strip())

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
