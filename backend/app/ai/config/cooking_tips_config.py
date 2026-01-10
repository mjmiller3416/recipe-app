"""Configuration for the Cooking Tip AI service."""

# Model settings
MODEL_NAME = "gemini-2.0-flash"
TEMPERATURE = 0.9  # High temperature for variety

# Category rotation settings
MAX_RECENT_CATEGORIES = 20  # Must cycle through 20 categories before repeating

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
]

# Prompt template for generating cooking tips (category inserted at runtime)
TIP_PROMPT_TEMPLATE = """Generate a single, helpful cooking tip about {category}. The tip should be:
- Practical and actionable
- About 1-2 sentences long
- Suitable for home cooks of all skill levels
- Something specific and useful, not generic advice

Just provide the tip text directly, no prefix like "Tip:" or bullet points."""
