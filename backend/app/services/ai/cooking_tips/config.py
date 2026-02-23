"""Configuration for the Cooking Tip AI service."""

# Model settings
MODEL_NAME = "gemini-2.0-flash"
TEMPERATURE = 0.9  # High temperature for variety
MAX_OUTPUT_TOKENS = 150  # Constrain output length

# Environment variable for API key
API_KEY_ENV_VAR = "GEMINI_TIP_API_KEY"
API_KEY_ENV_VAR_ALT = "GEMINI_COOKING_TIP_API_KEY"  # Alternative key name

# Diverse cooking categories to randomize tip topics
TIP_CATEGORIES = [
    "grilling and barbecue",
    "baking and pastry",
    "knife skills and cutting techniques",
    "sauce making",
    "marinating and brining",
    "stir-frying and wok cooking",
    "slow cooking and braising",
    "roasting vegetables",
    "cooking with herbs and spices",
    "egg preparation",
    "pasta cooking",
    "rice and grains",
    "soup and stock making",
    "seafood preparation",
    "meat preparation and resting",
    "food storage and preservation",
    "kitchen organization",
    "flavor balancing (salt, acid, fat, heat)",
    "caramelization and browning",
    "steaming and poaching",
    "deep frying",
    "meal prep efficiency",
    "substitutions and ingredient swaps",
    "leftover transformation",
    "breakfast cooking",
    "dessert techniques",
    "food safety and temperature",
    "cast iron care",
    "fresh produce selection",
    "freezing and thawing",
    # Additional categories for more variety
    "salad and vinaigrette building",
    "bread and yeast fermentation",
    "pressure cooker and Instant Pot",
    "pantry staples and mother sauces",
    "plating and texture contrast",
    "pickling and quick ferments",
    "budget shopping and ingredient maximizing",
]

# Prompt template for generating cooking tips (category inserted at runtime)
TIP_PROMPT_TEMPLATE = """Generate a single, helpful cooking tip about {category}. The tip should be:
- Practical and actionable
- About 1-2 sentences long
- Suitable for home cooks of all skill levels
- Something specific and useful, not generic advice
- Include one concrete detail (time, temperature, ratio, or specific tool) when appropriate

Avoid overused tips like "don't overcrowd the pan", "reserve pasta water", or "pat protein dry" unless providing a truly novel angle.

Just provide the tip text directly, no prefix like "Tip:" or bullet points."""
