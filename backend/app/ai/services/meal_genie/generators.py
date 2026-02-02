"""app/ai/services/meal_genie/generators.py

AI content generation methods for Meal Genie.
Handles recipe suggestions, full recipe generation, and cooking question answers.
"""

# ── Imports ─────────────────────────────────────────────────────────────────────────────────────────────────
import json
from typing import Optional

from app.ai.config.meal_genie import MODEL_NAME
from app.ai.dtos.meal_genie_dtos import GeneratedRecipeDTO, GeneratedIngredientDTO


# ── Generators Mixin ────────────────────────────────────────────────────────────────────────────────────────
class GeneratorsMixin:
    """Mixin providing AI generation methods for Meal Genie."""

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
