"""Configuration for the Nutrition Estimation AI service."""

# Model settings
MODEL_NAME = "gemini-2.0-flash"
TEMPERATURE = 0.3  # Low temperature for factual accuracy
MAX_OUTPUT_TOKENS = 1024

# Environment variable for API key (reuses the assistant key)
API_KEY_ENV_VAR = "GEMINI_NUTRITION_API_KEY"

# Prompt template for estimating nutrition facts
PROMPT_TEMPLATE = """You are a professional nutritionist. Estimate the nutrition facts PER SERVING for this recipe.

Recipe: {recipe_name}
Servings: {servings}

Ingredients:
{ingredients_text}

Return ONLY valid JSON with these exact fields (all numeric values, no units in values):
{{
  "calories": <integer or null>,
  "protein_g": <float or null>,
  "total_fat_g": <float or null>,
  "saturated_fat_g": <float or null>,
  "trans_fat_g": <float or null>,
  "cholesterol_mg": <float or null>,
  "sodium_mg": <float or null>,
  "total_carbs_g": <float or null>,
  "dietary_fiber_g": <float or null>,
  "total_sugars_g": <float or null>
}}

Be realistic and base estimates on standard USDA nutrition data. Round to 1 decimal place for grams, whole numbers for mg and calories. Return ONLY the JSON object, no other text."""
