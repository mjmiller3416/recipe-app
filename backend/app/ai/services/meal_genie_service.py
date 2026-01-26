"""Redesigned Meal Genie service with Gemini function calling."""

import os
import json
from typing import Optional, List
from dotenv import load_dotenv

from app.ai.config.meal_genie_config import (
    MODEL_NAME,
    API_KEY_ENV_VAR,
    TOOL_DEFINITIONS,
    get_full_system_prompt,
    build_user_context_prompt,
    should_include_ingredients,
    should_include_shopping_list,
)
from app.ai.dtos.meal_genie_dtos import (
    MealGenieMessageDTO,
    GeneratedRecipeDTO,
    GeneratedIngredientDTO,
)

load_dotenv()


class MealGenieService:
    """Unified Meal Genie service with function calling."""

    def __init__(self):
        """Initialize the Meal Genie service."""
        self.api_key = os.getenv(API_KEY_ENV_VAR)
        if not self.api_key:
            raise ValueError(f"{API_KEY_ENV_VAR} environment variable is not set")
        self._client = None

    def _get_client(self):
        """Lazy initialization of Gemini client."""
        if self._client is None:
            from google import genai

            self._client = genai.Client(api_key=self.api_key)
        return self._client

    def chat(
        self,
        message: str,
        conversation_history: Optional[List[MealGenieMessageDTO]] = None,
        user_context_data: Optional[dict] = None,
    ) -> dict:
        """
        Main entry point for all Meal Genie interactions.

        The AI decides what action to take based on the message:
        - Suggest recipes
        - Generate a full recipe
        - Answer a cooking question

        Args:
            message: The user's message
            conversation_history: Optional list of previous messages
            user_context_data: Dict with saved_recipes, meal_plan, etc.

        Returns:
            dict with 'type' (chat|suggestions|recipe|error), 'response', and
            optionally 'recipe' or 'tool_args'
        """
        try:
            client = self._get_client()

            # Build context based on message content
            user_context = self._build_context(
                message, conversation_history, user_context_data
            )
            system_prompt = get_full_system_prompt(user_context)

            # Build conversation contents
            contents = self._build_contents(system_prompt, conversation_history, message)

            # Call Gemini with function calling
            response = client.models.generate_content(
                model=MODEL_NAME,
                contents=contents,
                config={
                    "tools": [{"function_declarations": TOOL_DEFINITIONS}],
                    "tool_config": {"function_calling_config": {"mode": "AUTO"}},
                    "temperature": 0.8,
                },
            )

            # Process the response
            return self._process_response(response, user_context_data, contents)

        except Exception as e:
            return {
                "type": "error",
                "response": None,
                "error": str(e),
            }

    def _build_context(
        self,
        message: str,
        history: Optional[List[MealGenieMessageDTO]],
        context_data: Optional[dict],
    ) -> str:
        """Build user context string based on message needs."""
        if not context_data:
            return ""

        saved_recipes = context_data.get("saved_recipes", [])
        meal_plan = context_data.get("meal_plan", [])
        recipe_ingredients = None
        shopping_list = None

        # Convert history to dict format for keyword detection
        history_dicts = None
        if history:
            history_dicts = [{"role": m.role, "content": m.content} for m in history]

        # Conditionally load ingredients
        if should_include_ingredients(message, history_dicts):
            recipe_ingredients = context_data.get("recipe_ingredients", {})

        # Conditionally load shopping list
        if should_include_shopping_list(message, history_dicts):
            shopping_list = context_data.get("shopping_list", {})

        return build_user_context_prompt(
            saved_recipes=saved_recipes,
            meal_plan=meal_plan,
            shopping_list=shopping_list,
            recipe_ingredients=recipe_ingredients,
        )

    def _build_contents(
        self,
        system_prompt: str,
        history: Optional[List[MealGenieMessageDTO]],
        message: str,
    ) -> list:
        """Build the conversation contents for Gemini."""
        contents = []

        # System prompt as initial user message + model acknowledgment
        contents.append({"role": "user", "parts": [{"text": system_prompt}]})
        contents.append(
            {
                "role": "model",
                "parts": [
                    {"text": "Got it! I'm Meal Genie, ready to help. What sounds good tonight? 🍳"}
                ],
            }
        )

        # Add conversation history
        if history:
            for msg in history:
                role = "user" if msg.role == "user" else "model"
                contents.append({"role": role, "parts": [{"text": msg.content}]})

        # Add the current message
        contents.append({"role": "user", "parts": [{"text": message}]})

        return contents

    def _process_response(
        self, response, user_context_data: Optional[dict], contents: list
    ) -> dict:
        """Process Gemini response, handling function calls."""
        if not response or not response.candidates:
            return {"type": "error", "response": None, "error": "No response from AI"}

        for candidate in response.candidates:
            if not candidate.content or not candidate.content.parts:
                continue

            for part in candidate.content.parts:
                # Check for function call
                if hasattr(part, "function_call") and part.function_call:
                    return self._handle_function_call(
                        part.function_call.name,
                        dict(part.function_call.args) if part.function_call.args else {},
                        user_context_data,
                        contents,
                    )

                # Regular text response
                if hasattr(part, "text") and part.text:
                    return {
                        "type": "chat",
                        "response": part.text.strip(),
                    }

        return {"type": "error", "response": None, "error": "Could not parse response"}

    def _handle_function_call(
        self,
        tool_name: str,
        args: dict,
        context_data: Optional[dict],
        contents: list,
    ) -> dict:
        """Execute a function call and return appropriate response."""

        if tool_name == "suggest_recipes":
            # Immediate Generation Loop: The function call tells us the user wants
            # suggestions, but we need to generate the actual text response.
            return self._generate_suggestions_response(args, context_data, contents)

        elif tool_name == "create_recipe":
            # Generate a full recipe with structured JSON
            recipe = self._generate_recipe_from_args(args)
            return {
                "type": "recipe",
                "response": f"Here's your {args.get('recipe_name', 'recipe')}! 🎉",
                "recipe": recipe,
                "tool_args": args,
            }

        elif tool_name == "answer_cooking_question":
            # For cooking questions, we use a follow-up call to get a proper response
            return self._generate_cooking_answer(args, contents)

        # Fallback
        return {"type": "chat", "response": None}

    def _generate_suggestions_response(
        self, args: dict, context_data: Optional[dict], contents: list
    ) -> dict:
        """Generate recipe suggestions text based on tool arguments."""
        client = self._get_client()

        # Build a prompt that includes context about what the user wants
        context_parts = []
        if args.get("main_ingredient"):
            context_parts.append(f"Main ingredient: {args['main_ingredient']}")
        if args.get("cuisine_style"):
            context_parts.append(f"Style: {args['cuisine_style']}")
        if args.get("dietary_restrictions"):
            context_parts.append(f"Dietary: {args['dietary_restrictions']}")
        if args.get("time_constraint"):
            context_parts.append(f"Time: {args['time_constraint']}")
        if args.get("mood_or_vibe"):
            context_parts.append(f"Vibe: {args['mood_or_vibe']}")

        context_str = ", ".join(context_parts) if context_parts else "general dinner ideas"

        # Check for saved recipes to reference
        saved_recipes_mention = ""
        if context_data and context_data.get("saved_recipes"):
            saved_recipes_mention = "\nRemember to check her saved recipes first and mention any relevant matches!"

        prompt = f"""Based on the user's request ({context_str}), suggest 4-6 creative recipe ideas.
{saved_recipes_mention}

Follow the 'RECIPE SUGGESTIONS' format from your system instructions:
- **Bold Recipe Name**
- 1-2 sentence description (menu teaser style, not instructions)
- Blank line between each
- End with: "Want me to turn any of these into a full recipe? Just say which one! 🍳"

Be warm, enthusiastic, and use 2-4 emojis naturally placed."""

        # Make a follow-up call to generate the suggestions text
        gen_response = client.models.generate_content(
            model=MODEL_NAME,
            contents=contents + [{"role": "user", "parts": [{"text": prompt}]}],
            config={"temperature": 0.8},
        )

        # Extract the text
        final_text = "Here are some ideas! 🍳"  # Fallback
        if gen_response and gen_response.candidates:
            for candidate in gen_response.candidates:
                if candidate.content and candidate.content.parts:
                    for part in candidate.content.parts:
                        if hasattr(part, "text") and part.text:
                            final_text = part.text.strip()
                            break

        return {
            "type": "suggestions",
            "response": final_text,
            "tool_args": args,
        }

    def _generate_cooking_answer(self, args: dict, contents: list) -> dict:
        """Generate a cooking question answer."""
        client = self._get_client()

        question_type = args.get("question_type", "general")
        context = args.get("context", "")

        prompt = f"""Answer this {question_type} cooking question. Context: {context}

Be warm and helpful. Start with the most direct answer, then add one pro tip.
Keep it concise (2-4 sentences unless it needs more detail).
Use your friendly Meal Genie personality."""

        gen_response = client.models.generate_content(
            model=MODEL_NAME,
            contents=contents + [{"role": "user", "parts": [{"text": prompt}]}],
            config={"temperature": 0.8},
        )

        final_text = "Let me help with that!"
        if gen_response and gen_response.candidates:
            for candidate in gen_response.candidates:
                if candidate.content and candidate.content.parts:
                    for part in candidate.content.parts:
                        if hasattr(part, "text") and part.text:
                            final_text = part.text.strip()
                            break

        return {
            "type": "chat",
            "response": final_text,
            "tool_args": args,
        }

    def _generate_recipe_from_args(self, args: dict) -> Optional[GeneratedRecipeDTO]:
        """Generate a structured recipe from tool arguments."""
        client = self._get_client()

        recipe_name = args.get("recipe_name", "Untitled Recipe")
        style_notes = args.get("style_notes", "")
        dietary = args.get("dietary_restrictions", "none")
        servings = args.get("servings", 4)

        generation_prompt = f"""Generate a complete recipe for: {recipe_name}
Style notes: {style_notes}
Dietary restrictions: {dietary}
Servings: {servings}

Return ONLY valid JSON (no markdown, no code blocks) with this exact structure:
{{
  "recipe_name": "{recipe_name}",
  "recipe_category": "beef|chicken|pork|seafood|vegetarian|other",
  "meal_type": "appetizer|breakfast|lunch|dinner|dessert|side|snack|sauce|other",
  "diet_pref": "{dietary if dietary else 'none'}",
  "total_time": <integer minutes>,
  "servings": {servings},
  "directions": "Step one.\\nStep two.\\nStep three...",
  "notes": "Optional tips or serving suggestions",
  "ingredients": [
    {{"ingredient_name": "Ingredient Name", "ingredient_category": "produce|dairy|meat|pantry|spices|etc", "quantity": 1.0, "unit": "cup|tbs|oz|lbs|etc"}}
  ]
}}

Rules:
- 6-15 ingredients, names in Title Case
- 5-10 direction steps, separated by \\n (no numbers)
- ingredient_category: produce|dairy|deli|meat|condiments|oils-and-vinegars|seafood|pantry|spices|frozen|bakery|baking|beverages|other
- unit: tbs|tsp|cup|oz|lbs|stick|bag|box|can|jar|package|piece|slice|whole|pinch|dash|to-taste
- diet_pref: always use "none" unless specified (never null)"""

        # Use JSON response mode for guaranteed JSON output
        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=[{"role": "user", "parts": [{"text": generation_prompt}]}],
            config={
                "temperature": 0.7,
                "response_mime_type": "application/json",
            },
        )

        # Parse JSON from response
        if response and response.candidates:
            for candidate in response.candidates:
                if candidate.content and candidate.content.parts:
                    for part in candidate.content.parts:
                        if hasattr(part, "text") and part.text:
                            try:
                                data = json.loads(part.text)
                                ingredients = [
                                    GeneratedIngredientDTO(**ing)
                                    for ing in data.get("ingredients", [])
                                ]
                                return GeneratedRecipeDTO(
                                    recipe_name=data.get("recipe_name", recipe_name),
                                    recipe_category=data.get("recipe_category", "other"),
                                    meal_type=data.get("meal_type", "dinner"),
                                    diet_pref=data.get("diet_pref", "none"),
                                    total_time=data.get("total_time"),
                                    servings=data.get("servings", servings),
                                    directions=data.get("directions"),
                                    notes=data.get("notes"),
                                    ingredients=ingredients,
                                )
                            except json.JSONDecodeError:
                                pass

        # Fallback: return empty recipe with just the name
        return GeneratedRecipeDTO(recipe_name=recipe_name, ingredients=[])

    # Legacy methods for backwards compatibility
    def ask(
        self,
        message: str,
        conversation_history: Optional[List[MealGenieMessageDTO]] = None,
        tool: str = "chat",
        user_context: str = "",
    ) -> dict:
        """Legacy ask method - routes to chat() with minimal context."""
        # This maintains backwards compatibility with existing /ask endpoint
        # Build minimal context data from the string
        result = self.chat(
            message=message,
            conversation_history=conversation_history,
            user_context_data=None,  # Legacy method doesn't have structured context
        )

        # Convert to legacy format
        return {
            "success": result.get("type") != "error",
            "response": result.get("response"),
            "error": result.get("error"),
        }

    def generate_recipe(
        self,
        message: str,
        conversation_history: Optional[List[MealGenieMessageDTO]] = None,
        user_context: str = "",
    ) -> dict:
        """Legacy generate_recipe method - preserved for backwards compatibility."""
        result = self.chat(
            message=message,
            conversation_history=conversation_history,
            user_context_data=None,
        )

        if result.get("type") == "error":
            return {
                "success": False,
                "recipe": None,
                "ai_message": None,
                "needs_more_info": False,
                "error": result.get("error"),
            }

        if result.get("recipe"):
            return {
                "success": True,
                "recipe": result["recipe"],
                "ai_message": result.get("response"),
                "needs_more_info": False,
                "error": None,
            }

        # No recipe generated - AI responded with chat
        return {
            "success": True,
            "recipe": None,
            "ai_message": result.get("response"),
            "needs_more_info": True,
            "error": None,
        }

    # These methods are kept for the /ask endpoint's recipe extraction
    def _extract_recipe_json(self, response: str) -> Optional[dict]:
        """Legacy method - extract recipe JSON from delimiter-wrapped response."""
        import re

        pattern = r"<<<RECIPE_JSON>>>(.*?)<<<END_RECIPE_JSON>>>"
        match = re.search(pattern, response, re.DOTALL)

        if match:
            try:
                json_str = match.group(1).strip()
                return json.loads(json_str)
            except json.JSONDecodeError:
                return None
        return None

    def _extract_ai_message(self, response: str) -> str:
        """Legacy method - extract message text outside JSON block."""
        import re

        pattern = r"<<<RECIPE_JSON>>>.*?<<<END_RECIPE_JSON>>>"
        message = re.sub(pattern, "", response, flags=re.DOTALL).strip()
        return message if message else "Here's your recipe!"


# Singleton instance
_service_instance: Optional[MealGenieService] = None


def get_meal_genie_service() -> MealGenieService:
    """Get the singleton instance of the Meal Genie service."""
    global _service_instance
    if _service_instance is None:
        _service_instance = MealGenieService()
    return _service_instance
