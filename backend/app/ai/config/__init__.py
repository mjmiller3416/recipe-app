"""Configuration modules for AI services."""

from .cooking_tips_config import (
    TIP_CATEGORIES,
    TIP_PROMPT_TEMPLATE,
    MODEL_NAME as COOKING_TIP_MODEL,
    TEMPERATURE as COOKING_TIP_TEMPERATURE,
    MAX_OUTPUT_TOKENS as COOKING_TIP_MAX_TOKENS,
    API_KEY_ENV_VAR as COOKING_TIP_API_KEY_ENV,
)
from .image_generation_config import (
    PROMPT_TEMPLATE as IMAGE_PROMPT_TEMPLATE,
    BANNER_PROMPT_TEMPLATE as IMAGE_BANNER_PROMPT_TEMPLATE,
    MODEL_NAME as IMAGE_MODEL,
    ASPECT_RATIO as IMAGE_ASPECT_RATIO,
    BANNER_ASPECT_RATIO as IMAGE_BANNER_ASPECT_RATIO,
    API_KEY_ENV_VAR as IMAGE_API_KEY_ENV,
)
from .meal_genie import (
    TOOL_DEFINITIONS,
    MODEL_NAME as MEAL_GENIE_MODEL,
    API_KEY_ENV_VAR as MEAL_GENIE_API_KEY_ENV,
    get_full_system_prompt,
    build_user_context_prompt,
    should_include_ingredients,
    should_include_shopping_list,
)

__all__ = [
    # Cooking Tips
    "TIP_CATEGORIES",
    "TIP_PROMPT_TEMPLATE",
    "COOKING_TIP_MODEL",
    "COOKING_TIP_TEMPERATURE",
    "COOKING_TIP_MAX_TOKENS",
    "COOKING_TIP_API_KEY_ENV",
    # Image Generation
    "IMAGE_PROMPT_TEMPLATE",
    "IMAGE_BANNER_PROMPT_TEMPLATE",
    "IMAGE_MODEL",
    "IMAGE_ASPECT_RATIO",
    "IMAGE_BANNER_ASPECT_RATIO",
    "IMAGE_API_KEY_ENV",
    # Meal Genie
    "TOOL_DEFINITIONS",
    "MEAL_GENIE_MODEL",
    "MEAL_GENIE_API_KEY_ENV",
    "get_full_system_prompt",
    "build_user_context_prompt",
    "should_include_ingredients",
    "should_include_shopping_list",
]
