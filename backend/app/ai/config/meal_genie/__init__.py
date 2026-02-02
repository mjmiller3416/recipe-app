"""app/ai/config/meal_genie

Meal Genie AI configuration package.
Provides prompts, tools, and context building for the Meal Genie assistant.
"""

from .prompts import MODEL_NAME, API_KEY_ENV_VAR, get_full_system_prompt
from .tools import TOOL_DEFINITIONS
from .context import (
    build_user_context_prompt,
    should_include_ingredients,
    should_include_shopping_list,
)

__all__ = [
    "MODEL_NAME",
    "API_KEY_ENV_VAR",
    "TOOL_DEFINITIONS",
    "get_full_system_prompt",
    "build_user_context_prompt",
    "should_include_ingredients",
    "should_include_shopping_list",
]
