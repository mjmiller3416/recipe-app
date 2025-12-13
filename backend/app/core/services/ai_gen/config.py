"""app/core/services/ai_gen/config.py

Configuration for AI image generation.
"""

from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Set

from app.config import AppPaths

# Model capabilities mapping
_MODEL_SIZES: Dict[str, Set[str]] = {
    "gpt-image-1": {"1024x1024", "1024x1536", "1536x1024"},
}


@dataclass
class ImageGenConfig:
    """Configuration for AI image generation.

    Attributes:
        model: OpenAI image model name
        default_size: Default image size (must be supported by model)
        quality: Image quality ("standard" or "high")
        output_root: Root directory for generated images
        dir_name: Subdirectory name under output_root
        allow_overwrite: Whether to regenerate existing images
        mock_mode: If True, simulates generation without API calls (for testing)
    """

    model: str = "gpt-image-1"
    default_size: str = "1024x1024"
    quality: str = "standard"
    output_root: Path = AppPaths.RECIPE_IMAGES_DIR.parent
    dir_name: str = "recipe_images"
    allow_overwrite: bool = False
    mock_mode: bool = False

    def __post_init__(self):
        """Validate configuration after initialization."""
        self._validate_configuration()

        # Ensure API key is available (unless in mock mode)
        if not self.mock_mode and not os.getenv("OPENAI_API_KEY"):
            raise RuntimeError("OPENAI_API_KEY environment variable is required")

    def _validate_configuration(self) -> None:
        """Validate model and size compatibility."""
        supported_sizes = _MODEL_SIZES.get(self.model)
        if not supported_sizes:
            available = list(_MODEL_SIZES.keys())
            raise ValueError(f"Unknown model '{self.model}'. Available: {available}")

        if self.default_size not in supported_sizes:
            raise ValueError(
                f"Size '{self.default_size}' not supported by {self.model}. "
                f"Available: {sorted(supported_sizes)}"
            )

    def output_dir(self) -> Path:
        """Get output directory, creating if necessary."""
        path = self.output_root / self.dir_name
        path.mkdir(parents=True, exist_ok=True)
        return path

    def get_supported_sizes(self) -> Set[str]:
        """Get all sizes supported by the current model."""
        return _MODEL_SIZES.get(self.model, set())

    def is_size_supported(self, size: str) -> bool:
        """Check if a size is supported by the current model."""
        return size in self.get_supported_sizes()
