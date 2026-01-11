"""Service for Meal Genie conversational AI using Gemini."""

import os
from typing import Optional, List
from dotenv import load_dotenv

from app.ai.dtos.meal_genie_dtos import MealGenieMessageDTO
from app.ai.config.meal_genie_config import (
    MODEL_NAME,
    API_KEY_ENV_VAR,
    get_system_prompt,
)

# Load environment variables
load_dotenv()

# Lazy import to avoid issues if package not installed
_genai_client = None


def _get_genai_client():
    """Lazy initialization of Gemini client for Meal Genie."""
    global _genai_client
    if _genai_client is None:
        from google import genai

        api_key = os.getenv(API_KEY_ENV_VAR)
        _genai_client = genai.Client(api_key=api_key)
    return _genai_client


class MealGenieService:
    """Service for Meal Genie conversational AI."""

    def __init__(self):
        """Initialize the Meal Genie service."""
        self.api_key = os.getenv(API_KEY_ENV_VAR)
        if not self.api_key:
            raise ValueError(f"{API_KEY_ENV_VAR} environment variable is not set")

    def ask(
        self,
        message: str,
        conversation_history: Optional[List[MealGenieMessageDTO]] = None,
        tool: str = "chat",
        user_context: str = "",
    ) -> dict:
        """
        Send a message to Meal Genie and get a response.

        Args:
            message: The user's message
            conversation_history: Optional list of previous messages for context
            tool: The tool to use (default: "chat", future: "recipe_search", etc.)
            user_context: Optional user context (recipes, meal plan, shopping list)

        Returns:
            dict with 'success', 'response', and optional 'error'
        """
        try:
            client = _get_genai_client()

            # Get the system prompt for the specified tool, with user context
            system_prompt = get_system_prompt(tool, user_context)

            # Build the conversation contents
            contents = []

            # Add system prompt as first message
            contents.append({"role": "user", "parts": [{"text": system_prompt}]})
            contents.append(
                {
                    "role": "model",
                    "parts": [
                        {
                            "text": "I understand! I'm Meal Genie, ready to help with cooking tips, ingredient substitutions, recipe ideas, and food safety questions. How can I assist you today?"
                        }
                    ],
                }
            )

            # Add conversation history if provided
            if conversation_history:
                for msg in conversation_history:
                    role = "user" if msg.role == "user" else "model"
                    contents.append({"role": role, "parts": [{"text": msg.content}]})

            # Add the current message
            contents.append({"role": "user", "parts": [{"text": message}]})

            # Generate response
            response = client.models.generate_content(
                model=MODEL_NAME,
                contents=contents,
            )

            # Extract the text from the response
            if response and response.candidates:
                for candidate in response.candidates:
                    if candidate.content and candidate.content.parts:
                        for part in candidate.content.parts:
                            if hasattr(part, "text") and part.text:
                                return {
                                    "success": True,
                                    "response": part.text.strip(),
                                    "error": None,
                                }

            return {
                "success": False,
                "response": None,
                "error": "No response from AI",
            }

        except ImportError:
            return {
                "success": False,
                "response": None,
                "error": "google-genai package is not installed",
            }
        except Exception as e:
            return {
                "success": False,
                "response": None,
                "error": str(e),
            }


# Singleton instance
_service_instance: Optional[MealGenieService] = None


def get_meal_genie_service() -> MealGenieService:
    """Get the singleton instance of the Meal Genie service."""
    global _service_instance
    if _service_instance is None:
        _service_instance = MealGenieService()
    return _service_instance
