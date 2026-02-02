"""app/ai/services/meal_genie/service.py

Core Meal Genie service logic.
Handles chat interface, context building, and response processing.
"""

# ── Imports ─────────────────────────────────────────────────────────────────────────────────────────────────
import os
from typing import Optional, List
from dotenv import load_dotenv

from app.ai.config.meal_genie import (
    MODEL_NAME,
    API_KEY_ENV_VAR,
    TOOL_DEFINITIONS,
    get_full_system_prompt,
    build_user_context_prompt,
    should_include_ingredients,
    should_include_shopping_list,
)
from app.ai.dtos.meal_genie_dtos import MealGenieMessageDTO

load_dotenv()


# ── Core Service ────────────────────────────────────────────────────────────────────────────────────────────
class MealGenieServiceCore:
    """Core Meal Genie service with chat interface and response processing."""

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
        """Execute a function call and return appropriate response.

        This method is implemented by the GeneratorsMixin.
        Subclasses should override this to provide actual implementation.
        """
        raise NotImplementedError("_handle_function_call must be implemented by subclass")
