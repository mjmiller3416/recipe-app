# app/core/services/ai_gen/__init__.py

from .config import ImageGenConfig
from .recipe_helper import RecipeImageHelper
from .service import ImageGenService, ImageRequest


def create_recipe_service(*, mock_mode: bool = False) -> RecipeImageHelper:
    """Convenience factory for recipe image generation.
    
    Args:
        mock_mode: If True, enables mock mode for testing without API calls
    """
    config = ImageGenConfig(mock_mode=mock_mode)
    service = ImageGenService(config)
    return RecipeImageHelper(service, config)

__all__ = ['ImageGenService', 'ImageGenConfig', 'RecipeImageHelper', 'ImageRequest', 'create_recipe_service']

