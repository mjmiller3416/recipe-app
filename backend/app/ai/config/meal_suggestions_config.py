"""Configuration for the Meal Suggestions AI service."""

# Model settings
MODEL_NAME = "gemini-2.0-flash"
TEMPERATURE = 0.8  # Varied tips
MAX_OUTPUT_TOKENS = 150  # Just need a short tip

# Environment variable for API key (reuses existing tip key)
API_KEY_ENV_VAR = "GEMINI_TIP_API_KEY"
API_KEY_ENV_VAR_ALT = "GEMINI_COOKING_TIP_API_KEY"

# System prompt for generating meal-specific cooking tip
MEAL_TIP_PROMPT = """You are a helpful culinary assistant. Given a specific dish, provide one practical cooking tip.

RULES:
- The tip should be specific to preparing THIS dish successfully
- Be concise and practical (1-2 sentences)
- Include a concrete detail when helpful (time, temperature, technique)
- Focus on something that will genuinely improve the result

Just provide the tip text directly, no prefix like "Tip:" or JSON formatting."""
