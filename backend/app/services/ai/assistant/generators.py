"""app/services/ai/assistant/generators.py

AI content generation methods for the assistant.
Handles recipe suggestions, full recipe generation, and cooking question answers.
"""

import logging
from typing import Optional

from app.dtos.recipe_generation_dtos import (
    RecipeGeneratedDTO,
    RecipeGenerationPreferencesDTO,
    RecipeGenerationRequestDTO,
)
from app.services.ai.gemini_client import get_gemini_client
from app.services.ai.recipe_generation import get_recipe_generation_service
from app.services.ai.response_utils import extract_text_from_response

from .prompts import MODEL_NAME, API_KEY_ENV_VAR

logger = logging.getLogger(__name__)


class GeneratorsMixin:
    """Mixin providing AI generation methods for the assistant."""

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
            recipe = self._generate_recipe_from_args(args, context_data)
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
        client = get_gemini_client(API_KEY_ENV_VAR)

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
        final_text = extract_text_from_response(gen_response) or "Here are some ideas! 🍳"

        return {
            "type": "suggestions",
            "response": final_text,
            "tool_args": args,
        }

    def _generate_cooking_answer(self, args: dict, contents: list) -> dict:
        """Generate a cooking question answer."""
        client = get_gemini_client(API_KEY_ENV_VAR)

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

        final_text = extract_text_from_response(gen_response) or "Let me help with that!"

        return {
            "type": "chat",
            "response": final_text,
            "tool_args": args,
        }

    def _generate_recipe_from_args(
        self, args: dict, context_data: Optional[dict] = None
    ) -> Optional[RecipeGeneratedDTO]:
        """Generate a structured recipe by delegating to the recipe generation service.

        Bridges the assistant's tool-call arguments to the shared recipe
        generation service, which uses the same prompt template and parsing
        logic as the prompt-based generation flow.
        """
        recipe_name = args.get("recipe_name", "Untitled Recipe")
        style_notes = args.get("style_notes", "")
        dietary = args.get("dietary_restrictions", "")
        servings = args.get("servings", 4)

        # Build a natural-language prompt from the tool arguments
        prompt_parts = [f"Generate a complete recipe for: {recipe_name}"]
        if style_notes:
            prompt_parts.append(f"Style notes: {style_notes}")
        if dietary and dietary != "none":
            prompt_parts.append(f"Dietary restrictions: {dietary}")

        # Use user's enabled categories from context, falling back to service defaults
        allowed_categories = (
            context_data.get("allowed_categories", []) if context_data else []
        )

        request = RecipeGenerationRequestDTO(
            prompt="\n".join(prompt_parts),
            allowed_categories=allowed_categories,
            preferences=None,
            generate_image=False,
            estimate_nutrition=False,
        )
        # Override servings in the prompt via preferences if non-default
        if servings and servings != 4:
            request.preferences = RecipeGenerationPreferencesDTO(servings=servings)

        try:
            service = get_recipe_generation_service()
            result = service.generate(request)
            if result.success and result.recipe:
                return result.recipe
        except Exception as e:
            logger.warning(f"[Assistant] Recipe generation via service failed: {e}")

        # Fallback: return minimal recipe with just the name
        return RecipeGeneratedDTO(
            recipe_name=recipe_name,
            recipe_category="other",
            meal_type="dinner",
            ingredients=[],
        )
