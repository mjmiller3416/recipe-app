"""Configuration for the Image Generation AI service."""

# Model settings
MODEL_NAME = "gemini-2.5-flash-image"

# Aspect ratios
ASPECT_RATIO = "1:1"  # Square format for reference/thumbnail images
BANNER_ASPECT_RATIO = "21:9"  # Ultrawide format for banner images (Gemini's widest)

# Environment variable for API key
API_KEY_ENV_VAR = "GEMINI_IMAGE_API_KEY"

# Default prompt template for square food photography (reference images)
PROMPT_TEMPLATE = (
    "A professional food photograph of {recipe_name} captured at a 45-degree "
    "angle. The dish is placed on a rustic wooden table with cutting board, "
    "shallow depth of field, steam rising, scattered herbs and seasonings, "
    "complementary ingredients as props in soft-focus background, "
    "cozy home kitchen atmosphere, appetizing, high detail, "
    "no people, no hands, square format"
)

# Prompt template for wide banner images
BANNER_PROMPT_TEMPLATE = (
    "A professional food photograph of {recipe_name} in wide panoramic format. "
    "The dish is placed on a rustic wooden table with cutting board, "
    "shallow depth of field, steam rising, scattered herbs and seasonings, "
    "complementary ingredients arranged horizontally as props in soft-focus background, "
    "cozy home kitchen atmosphere, appetizing, high detail, "
    "no people, no hands, ultrawide cinematic composition"
)
