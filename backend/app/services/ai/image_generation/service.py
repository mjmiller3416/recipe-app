"""Service for generating AI images using Gemini."""

import base64
from typing import Optional

from app.services.ai.gemini_client import get_gemini_client
from app.services.ai.response_utils import extract_image_data

from .config import (
    PROMPT_TEMPLATE,
    BANNER_PROMPT_TEMPLATE,
    BANNER_FROM_REFERENCE_PROMPT,
    MODEL_NAME,
    ASPECT_RATIO,
    BANNER_ASPECT_RATIO,
    API_KEY_ENV_VAR,
)


class ImageGenerationService:
    """Service for generating recipe images using Gemini AI."""

    def __init__(self) -> None:
        """Initialize the image generation service."""
        # Validate eagerly so we fail fast if misconfigured
        get_gemini_client(API_KEY_ENV_VAR)

    def generate_recipe_image(
        self, recipe_name: str, custom_prompt: str = None, aspect_ratio: str = "1:1"
    ) -> dict:
        """Generate an AI image for a recipe.

        Args:
            recipe_name: The name of the recipe to generate an image for.
            custom_prompt: Optional custom prompt template (must include {recipe_name}).
            aspect_ratio: Image aspect ratio (default "1:1").

        Returns:
            dict with 'success', 'image_data' (base64), and optional 'error'.
        """
        if not recipe_name or not recipe_name.strip():
            return {
                "success": False,
                "image_data": None,
                "error": "Recipe name is required",
            }

        try:
            from google.genai import types

            client = get_gemini_client(API_KEY_ENV_VAR)

            # Build the prompt - use custom_prompt if provided and valid, else use default
            template = (
                custom_prompt
                if custom_prompt and "{recipe_name}" in custom_prompt
                else PROMPT_TEMPLATE
            )
            prompt = template.format(recipe_name=recipe_name.strip())

            # Generate the image with specified aspect ratio
            response = client.models.generate_content(
                model=MODEL_NAME,
                contents=[prompt],
                config=types.GenerateContentConfig(
                    response_modalities=["IMAGE"],
                    image_config=types.ImageConfig(
                        aspect_ratio=aspect_ratio,
                    ),
                ),
            )

            # Extract the image data from the response
            image_data = extract_image_data(response)
            if image_data:
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

    def generate_banner_from_reference(
        self, recipe_name: str, reference_image_bytes: bytes
    ) -> dict:
        """Generate a banner image using the reference image as visual input.

        Args:
            recipe_name: The name of the recipe.
            reference_image_bytes: The reference image as bytes.

        Returns:
            dict with 'success', 'image_data' (base64), and optional 'error'.
        """
        try:
            from google.genai import types

            client = get_gemini_client(API_KEY_ENV_VAR)

            # Build prompt with recipe name
            prompt = BANNER_FROM_REFERENCE_PROMPT.format(recipe_name=recipe_name.strip())

            # Create multimodal content: image + text prompt
            response = client.models.generate_content(
                model=MODEL_NAME,
                contents=[
                    types.Part.from_bytes(data=reference_image_bytes, mime_type="image/png"),
                    prompt,
                ],
                config=types.GenerateContentConfig(
                    response_modalities=["IMAGE"],
                    image_config=types.ImageConfig(
                        aspect_ratio=BANNER_ASPECT_RATIO,
                    ),
                ),
            )

            # Extract the image data from the response
            image_data = extract_image_data(response)
            if image_data:
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

    def generate_dual_recipe_images(self, recipe_name: str) -> dict:
        """Generate both reference (1:1) and banner (21:9) images for a recipe.

        Args:
            recipe_name: The name of the recipe to generate images for.

        Returns:
            dict with 'success', 'reference_image_data', 'banner_image_data', and 'errors'.
        """
        result = {
            "success": False,
            "reference_image_data": None,
            "banner_image_data": None,
            "errors": [],
        }

        # Generate reference image (1:1 square)
        ref_result = self.generate_recipe_image(
            recipe_name,
            custom_prompt=PROMPT_TEMPLATE,
            aspect_ratio=ASPECT_RATIO,
        )
        if ref_result["success"]:
            result["reference_image_data"] = ref_result["image_data"]
        else:
            result["errors"].append(f"Reference: {ref_result.get('error')}")

        # Generate banner image using reference image as input (if available)
        if ref_result["success"]:
            # Decode reference image to bytes for use as visual input
            reference_bytes = base64.b64decode(ref_result["image_data"])
            banner_result = self.generate_banner_from_reference(
                recipe_name, reference_bytes
            )
        else:
            # Fallback: generate banner independently if reference failed
            banner_result = self.generate_recipe_image(
                recipe_name,
                custom_prompt=BANNER_PROMPT_TEMPLATE,
                aspect_ratio=BANNER_ASPECT_RATIO,
            )

        if banner_result["success"]:
            result["banner_image_data"] = banner_result["image_data"]
        else:
            result["errors"].append(f"Banner: {banner_result.get('error')}")

        # Success if at least one image was generated
        result["success"] = bool(
            result["reference_image_data"] or result["banner_image_data"]
        )

        return result


# Singleton instance
_service_instance: Optional[ImageGenerationService] = None


def get_image_generation_service() -> ImageGenerationService:
    """Get the singleton instance of the image generation service."""
    global _service_instance
    if _service_instance is None:
        _service_instance = ImageGenerationService()
    return _service_instance
