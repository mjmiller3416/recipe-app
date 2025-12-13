"""app/core/services/ai_gen/background_manager.py

Background image generation manager for recipes.

Handles asynchronous generation of recipe images without blocking the UI.
"""

from __future__ import annotations

import asyncio
import threading
from pathlib import Path
from typing import Optional

from _dev_tools import DebugLogger
from app.core.database.db import DatabaseSession
from app.core.services import RecipeService
from app.core.utils import img_ai_slugify

from .config import ImageGenConfig
from .recipe_helper import RecipeImageHelper
from .service import ImageGenService


class BackgroundImageManager:
    """Manages background generation of recipe images."""

    _instance: Optional[BackgroundImageManager] = None
    _lock = threading.Lock()

    def __new__(cls):
        """Ensure singleton instance."""
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        """Initialize the background manager."""
        if not hasattr(self, '_initialized'):
            self._initialized = True
            self._loop: Optional[asyncio.AbstractEventLoop] = None
            self._thread: Optional[threading.Thread] = None
            self._start_event_loop()

    def _start_event_loop(self):
        """Start the background event loop in a separate thread."""
        def run_loop():
            self._loop = asyncio.new_event_loop()
            asyncio.set_event_loop(self._loop)
            self._loop.run_forever()

        self._thread = threading.Thread(target=run_loop, daemon=True)
        self._thread.start()

        # Wait for loop to be ready
        while self._loop is None:
            pass

    def generate_recipe_images(self, recipe_id: int, recipe_name: str) -> tuple[str, str]:
        """Generate images for a recipe in the background.

        Args:
            recipe_id: The recipe ID
            recipe_name: The recipe name

        Returns:
            Tuple of (reference_path, banner_path) that will be generated
        """
        # Generate predictable paths
        reference_path = self._get_image_path(recipe_name, recipe_id, "standard", "1024x1024")
        banner_path = self._get_image_path(recipe_name, recipe_id, "banner", "1792x1024")

        # Schedule async generation
        asyncio.run_coroutine_threadsafe(
            self._generate_images_async(recipe_id, recipe_name, reference_path, banner_path),
            self._loop
        )

        return str(reference_path), str(banner_path)

    def _get_image_path(self, recipe_name: str, recipe_id: int, image_type: str, size: str) -> Path:
        """Generate predictable image path.

        Args:
            recipe_name: The recipe name
            recipe_id: The recipe ID
            image_type: Type of image (standard or banner)
            size: Image dimensions

        Returns:
            Path where the image will be saved
        """
        import os
        mock_mode = os.getenv("AI_GEN_MOCK_MODE", "false").lower() == "true"
        config = ImageGenConfig(mock_mode=mock_mode)
        slug = img_ai_slugify(recipe_name)
        filename = f"{slug}-{recipe_id}-{image_type}-{size}.png"
        return config.output_dir() / filename

    async def _generate_images_async(self, recipe_id: int, recipe_name: str,
                                     reference_path: str, banner_path: str):
        """Generate images asynchronously.

        Args:
            recipe_id: The recipe ID
            recipe_name: The recipe name
            reference_path: Path for reference image
            banner_path: Path for banner image
        """
        try:
            DebugLogger.log(
                f"Starting background image generation for recipe {recipe_id}: {recipe_name}",
                "info"
            )

            # Check if mock mode is enabled (for testing)
            import os
            mock_mode = os.getenv("AI_GEN_MOCK_MODE", "false").lower() == "true"

            # Initialize services
            config = ImageGenConfig(mock_mode=mock_mode)
            service = ImageGenService(config)
            helper = RecipeImageHelper(service, config)

            # Generate standard image first
            DebugLogger.log(f"Generating standard image for recipe {recipe_id}", "info")
            standard_path = await helper.generate_for_recipe(recipe_name, "standard")

            # Ensure the reference path exists before generating banner
            ref_path_obj = Path(reference_path)
            if standard_path != ref_path_obj:
                ref_path_obj.parent.mkdir(parents=True, exist_ok=True)
                # Copy instead of rename to keep original for banner generation
                import shutil
                shutil.copy2(standard_path, ref_path_obj)

            # Generate banner using standard as reference
            DebugLogger.log(f"Generating banner image for recipe {recipe_id}", "info")
            banner_generated = await helper.generate_for_recipe(
                recipe_name,
                "banner",
                reference_image_path=standard_path  # Use original path
            )

            # Copy banner to predictable path
            banner_path_obj = Path(banner_path)
            if banner_generated != banner_path_obj:
                banner_path_obj.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(banner_generated, banner_path_obj)

            # Clean up temporary files if different from final paths
            if standard_path != ref_path_obj:
                standard_path.unlink(missing_ok=True)
            if banner_generated != banner_path_obj:
                banner_generated.unlink(missing_ok=True)

            # Update database with actual paths (they should match what we predicted)
            with DatabaseSession() as session:
                service = RecipeService(session)
                service.update_recipe_reference_image_path(recipe_id, str(ref_path_obj))
                service.update_recipe_banner_image_path(recipe_id, str(banner_path_obj))

            DebugLogger.log(
                f"Successfully generated images for recipe {recipe_id}: {recipe_name}",
                "info"
            )

        except Exception as e:
            DebugLogger.log(
                f"Failed to generate images for recipe {recipe_id}: {e}",
                "error"
            )

    def shutdown(self):
        """Shutdown the background event loop."""
        if self._loop and self._loop.is_running():
            self._loop.call_soon_threadsafe(self._loop.stop)
            if self._thread:
                self._thread.join(timeout=5)


def get_background_manager() -> BackgroundImageManager:
    """Get the singleton background manager instance."""
    return BackgroundImageManager()
