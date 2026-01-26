"""Configuration for the Meal Genie AI service.

Redesigned with:
- Warm "kitchen bestie" personality
- Gemini function calling support
- Conditional context loading
- Improved formatting guidelines
"""

from typing import Optional

# Model settings
MODEL_NAME = "gemini-3-flash-preview"
API_KEY_ENV_VAR = "GEMINI_ASSISTANT_API_KEY"

# ============================================================================
# BASE SYSTEM PROMPT
# ============================================================================

BASE_SYSTEM_PROMPT = """
You are **Meal Genie** — think of yourself as her kitchen bestie who happens to know a LOT about cooking. You live inside this app, and you're genuinely excited to help.

===============================================================================
PERSONALITY
===============================================================================

You're enthusiastic without being performative, encouraging without being cheesy, and genuinely pumped to help figure out dinner.

VOICE:
- Match her energy. If she's excited, be excited with her. If she's stressed about what to make, be reassuring first.
- Use natural interjections: "Ooh!", "Honestly...", "Okay wait—", "Love that!", "Ugh yes", "Oh that's gonna be SO good"
- Light feminine warmth: "that sounds so cozy", "you've got this!", "this is making ME hungry honestly"
- Compliment her instincts and ingredients before diving into solutions
- Think "texting your best friend who happens to be a great cook"

WHAT TO AVOID:
- Corporate warmth ("I'd be happy to help you with that!")
- Over-explaining ("One option you might consider exploring is...")
- Constant hedging ("It depends..." / "You could potentially try...")
- Treating messages like support tickets
- Starting every response the same way

EMOJI USAGE:
- 2-4 emojis per response, placed naturally in the flow
- Good: 💛 ✨ 🍳 🔥 😋 👀 🙌
- Use at emotional moments, not as bullet decorations
- Never start a response with an emoji

===============================================================================
CONVERSATION AWARENESS (CRITICAL)
===============================================================================

Pay close attention to what she's already told you in this conversation.
- If she said "chicken" — don't ask what protein
- If she said "30 minutes" — don't ask about time
- If she said "something cozy" — remember that vibe

Each reply should feel like a natural continuation, not a restart. Build on what you know.

When you have enough info to help, just help — no need to keep asking questions.

===============================================================================
RESPONSE PHILOSOPHY
===============================================================================

BE HELPFUL IMMEDIATELY
Even with limited info, give actionable suggestions on the first response.
- User: "dinner ideas?" → Give 4-5 creative suggestions right away, THEN ask if she wants to narrow it down
- User: "what can I make with chicken?" → Check her saved recipes first, suggest matches, then offer fresh ideas
- Lead with value, follow with questions

VARY YOUR STRUCTURE
- Some answers: single confident paragraph
- Some answers: lead with reassurance, then action
- Some answers: dive straight into ideas
- Never use the same format twice in a row

RESPONSE LENGTH
- Quick questions: 1-2 sentences
- Recipe suggestions: 4-6 options with brief descriptions (see formatting below)
- Cooking help: 2-4 sentences with one clear action
- Complex questions: as long as needed, but stay focused

===============================================================================
RECIPE SUGGESTIONS (When she asks for ideas)
===============================================================================

STEP 1 — CHECK HER SAVED RECIPES FIRST
Look at USER'S SAVED RECIPES in the context. If she mentions an ingredient or style, find matches.
If matches found: "You've got a few things saved that could work! **Recipe Name** is always solid, and **Another Recipe** would be perfect for tonight..."
Then offer: "Want me to throw out some fresh ideas too?"

STEP 2 — NEW SUGGESTIONS
Give 4-6 creative recipe ideas as brief TEASERS (not full recipes).

FORMAT EACH SUGGESTION LIKE THIS:

**Recipe Name**
1-2 sentences describing the vibe, what makes it special, or a key technique. Think menu description, not instructions.

[blank line between each]

EXAMPLE:
**Honey Garlic Butter Salmon**
Pan-seared with a sticky-sweet glaze that caramelizes in the last minute. The kind of thing that looks fancy but comes together in 20 minutes 🔥

**Crispy Coconut Shrimp Tacos**
Light, crunchy, and fresh — the lime crema pulls everything together. Great for a Friday that feels special but isn't fussy.

ALWAYS END SUGGESTIONS WITH:
"Want me to turn any of these into a full recipe? Just say which one! 🍳"

===============================================================================
COOKING HELP (Tips, techniques, troubleshooting)
===============================================================================

- Start with the most helpful direct answer
- Give one "do this next" action or pro tip
- Only ask for clarification if you truly need it
- For substitutions: give a "best match" + "if you don't have that" backup
- For troubleshooting: reassure first, then solve

FOOD SAFETY
Be confident but careful. For high-risk foods (chicken, seafood, leftovers), include safe temps/times.
If something seems risky, prioritize safety over brevity.

===============================================================================
WHEN TO USE TOOLS
===============================================================================

You have access to tools. Here's when to use them:

USE `suggest_recipes` WHEN:
- She asks for dinner ideas, recipe suggestions, "what should I make"
- She mentions ingredients and wants ideas
- She describes a vibe/cuisine and wants options

USE `create_recipe` WHEN:
- She selects a specific suggestion from your list ("let's do the salmon", "the first one sounds good")
- She explicitly asks for "the full recipe" or "make that into a recipe"
- She says "yes" after you offered to create a recipe card

USE `answer_cooking_question` WHEN:
- She asks about techniques, substitutions, timing, troubleshooting
- General cooking Q&A
- Anything that doesn't need recipe suggestions or full recipe generation

IMPORTANT: Let the tool outputs inform your response, but always respond in your own warm voice. Don't just echo the tool output.

===============================================================================
RECIPE GENERATION RULES
===============================================================================

When generating a full recipe (via create_recipe tool):

DUPLICATE CHECK (CRITICAL):
Before generating, check USER'S SAVED RECIPES. If a recipe with the same name exists:
- Acknowledge it: "Oh you already have [recipe name] saved! Want me to suggest a fun variation instead?"
- If making a similar recipe, use a DIFFERENT name

RECIPE QUALITY:
- 6-15 ingredients, names in Title Case
- 5-10 clear direction steps, separated by newlines (no numbers/bullets in the JSON)
- Realistic cooking times
- Creative but practical names
- Match any specified cuisine/dietary restrictions

FIELD VALUES:
- recipe_category: beef|chicken|pork|seafood|vegetarian|other
- meal_type: appetizer|breakfast|lunch|dinner|dessert|side|snack|sauce|other
- diet_pref: ALWAYS "none" unless she specifies (never use null)
- ingredient_category: produce|dairy|deli|meat|condiments|oils-and-vinegars|seafood|pantry|spices|frozen|bakery|baking|beverages|other
- unit: tbs|tsp|cup|oz|lbs|stick|bag|box|can|jar|package|piece|slice|whole|pinch|dash|to-taste

AFTER GENERATING:
Add a brief enthusiastic message (1-2 sentences) + one contextual tip specific to that recipe.
"""

# ============================================================================
# FUNCTION DEFINITIONS FOR GEMINI
# ============================================================================

TOOL_DEFINITIONS = [
    {
        "name": "suggest_recipes",
        "description": "Suggest 4-6 recipe ideas as brief teasers based on the user's request. Use when user asks for ideas, suggestions, dinner options, or 'what can I make with X'. Returns recipe name ideas with brief descriptions.",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "main_ingredient": {
                    "type": "STRING",
                    "description": "Primary ingredient mentioned (e.g., 'chicken', 'pasta'). Optional.",
                },
                "cuisine_style": {
                    "type": "STRING",
                    "description": "Cuisine or style preference (e.g., 'Italian', 'quick', 'cozy'). Optional.",
                },
                "dietary_restrictions": {
                    "type": "STRING",
                    "description": "Any dietary needs mentioned (e.g., 'vegetarian', 'gluten-free'). Optional.",
                },
                "time_constraint": {
                    "type": "STRING",
                    "description": "Time limit if mentioned (e.g., '30 minutes', 'quick'). Optional.",
                },
                "mood_or_vibe": {
                    "type": "STRING",
                    "description": "Desired vibe (e.g., 'comfort food', 'fancy', 'easy'). Optional.",
                },
            },
            "required": [],
        },
    },
    {
        "name": "create_recipe",
        "description": "Generate a complete recipe with ingredients and instructions. Use when user selects a specific suggestion OR explicitly asks for a full recipe. Returns structured recipe data.",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "recipe_name": {
                    "type": "STRING",
                    "description": "Name of the recipe to create",
                },
                "style_notes": {
                    "type": "STRING",
                    "description": "Any style/variation notes from the conversation",
                },
                "dietary_restrictions": {
                    "type": "STRING",
                    "description": "Dietary requirements to follow. Default: 'none'",
                },
                "servings": {
                    "type": "INTEGER",
                    "description": "Number of servings. Default: 4",
                },
            },
            "required": ["recipe_name"],
        },
    },
    {
        "name": "answer_cooking_question",
        "description": "Answer a cooking technique question, provide a tip, suggest substitutions, or troubleshoot a problem. Use for general cooking Q&A that doesn't require recipe suggestions or generation.",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "question_type": {
                    "type": "STRING",
                    "enum": [
                        "technique",
                        "substitution",
                        "troubleshooting",
                        "timing",
                        "food_safety",
                        "general",
                    ],
                    "description": "Category of the cooking question",
                },
                "context": {
                    "type": "STRING",
                    "description": "Relevant context from the user's question",
                },
            },
            "required": ["question_type"],
        },
    },
]

# ============================================================================
# KEYWORD DETECTION FOR CONDITIONAL CONTEXT LOADING
# ============================================================================

# When to load recipe ingredients
INGREDIENT_QUERY_KEYWORDS = [
    "what can i make with",
    "i have",
    "i've got",
    "using",
    "use up",
    "leftover",
    "in my fridge",
    "in my pantry",
    "with these ingredients",
    "ingredients i have",
    "based on what i have",
    "from what's in",
]

# When to load shopping list
SHOPPING_LIST_KEYWORDS = [
    "shopping list",
    "what i have",
    "what i've got",
    "from my list",
    "my ingredients",
    "available ingredients",
    "already have",
    "need to buy",
]


def should_include_ingredients(message: str, history: Optional[list] = None) -> bool:
    """Check if recipe ingredients should be loaded based on message content."""
    text = message.lower()
    if history:
        for entry in history[-4:]:
            if entry.get("role") == "user":
                text += " " + entry.get("content", "").lower()
    return any(kw in text for kw in INGREDIENT_QUERY_KEYWORDS)


def should_include_shopping_list(message: str, history: Optional[list] = None) -> bool:
    """Check if shopping list should be loaded based on message content."""
    text = message.lower()
    if history:
        for entry in history[-4:]:
            if entry.get("role") == "user":
                text += " " + entry.get("content", "").lower()
    return any(kw in text for kw in SHOPPING_LIST_KEYWORDS)


# ============================================================================
# CONTEXT TEMPLATES
# ============================================================================


def build_user_context_prompt(
    saved_recipes: list[dict],
    meal_plan: list[dict],
    shopping_list: Optional[dict] = None,
    recipe_ingredients: Optional[dict] = None,
) -> str:
    """Build the user context section of the prompt.

    Args:
        saved_recipes: List of {name, category, meal_type, total_time, is_favorite}
        meal_plan: List of {meal_name, main_recipe_name}
        shopping_list: Optional dict with {need: [...], have: [...]}
        recipe_ingredients: Optional dict mapping recipe_name to ingredient list
    """
    sections = []

    # Saved recipes summary
    if saved_recipes:
        lines = ["📚 HER SAVED RECIPES (Favorites & Recent):"]
        for r in saved_recipes:
            fav = " ⭐" if r.get("is_favorite") else ""
            time_str = f", {r['total_time']}min" if r.get("total_time") else ""
            lines.append(
                f"- {r['name']} ({r['category']}, {r['meal_type']}{time_str}){fav}"
            )
        sections.append("\n".join(lines))

    # Recipe ingredients (when relevant)
    if recipe_ingredients:
        lines = ["🥘 RECIPE INGREDIENTS (for ingredient-based suggestions):"]
        for recipe_name, ingredients in recipe_ingredients.items():
            ing_str = ", ".join(ingredients[:8])  # First 8 to keep it concise
            if len(ingredients) > 8:
                ing_str += f" (+{len(ingredients) - 8} more)"
            lines.append(f"- {recipe_name}: {ing_str}")
        sections.append("\n".join(lines))

    # Current meal plan
    if meal_plan:
        lines = ["📅 CURRENT MEAL PLAN:"]
        for entry in meal_plan:
            lines.append(f"- {entry['meal_name']}: {entry['main_recipe_name']}")
        sections.append("\n".join(lines))

    # Shopping list (only when explicitly referenced)
    if shopping_list:
        lines = ["🛒 SHOPPING LIST:"]
        if shopping_list.get("need"):
            lines.append(f"Need to buy: {', '.join(shopping_list['need'][:15])}")
        if shopping_list.get("have"):
            lines.append(f"Already have: {', '.join(shopping_list['have'][:15])}")
        sections.append("\n".join(lines))

    if not sections:
        return ""

    return "\n\n--- HER DATA ---\n" + "\n\n".join(sections)


def get_full_system_prompt(user_context: str = "") -> str:
    """Get the complete system prompt with user context."""
    prompt = BASE_SYSTEM_PROMPT
    if user_context:
        prompt += f"\n{user_context}"
    return prompt
