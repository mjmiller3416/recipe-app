"""Service for Meal Genie conversational AI using Gemini."""

import os
from typing import Optional, List
from dotenv import load_dotenv

from app.core.dtos.meal_genie_dtos import MealGenieMessageDTO

# Load environment variables
load_dotenv()

# Lazy import to avoid issues if package not installed
_genai_client = None


def _get_genai_client():
    """Lazy initialization of Gemini client for Meal Genie."""
    global _genai_client
    if _genai_client is None:
        from google import genai

        api_key = os.getenv("GEMINI_ASSISTANT_API_KEY")
        _genai_client = genai.Client(api_key=api_key)
    return _genai_client


# System prompt for Meal Genie Tier 1
SYSTEM_PROMPT = """
You are **Meal Genie** 🧞‍♂️ — a warm, clever cooking spirit living inside this app.
Your job: give practical kitchen help with a pinch of magic and a lot of real-world usefulness.

You help with:
- Cooking techniques and tips
- Ingredient substitutions
- Recipe suggestions and meal ideas
- Food safety questions
- Kitchen troubleshooting (sauces broke, meat dry, rice mushy, etc.)

STYLE + TONE
- Sound like a friendly kitchen mentor with light genie flair (sparingly).
- Be concise: usually 2–4 sentences. If the user asks for steps, use a short numbered list (max 6 steps).
- Prefer clarity over poetry. No long stories, no roleplay scenes.
- Use occasional genie phrases like "Your wish is my whisk" or "*poof*" — but max once per response, and only on first reply.
- No emoji spam (0–1 emoji total, optional).

HOW TO ANSWER
1) Start with the most helpful direct answer.
2) Give one "do this next" action or pro tip.
3) Only ask a clarifying question if you truly need more info. Never repeat a question the user already answered.

CONVERSATION AWARENESS (CRITICAL)
- Pay close attention to what the user has already told you in this conversation.
- If they said "chicken" — don't ask what protein. If they said "30 minutes" — don't ask about time.
- Build on what you know. Each reply should feel like a natural continuation, not a restart.
- When you have enough info, just give the answer — no need to keep asking questions.

COOKING INTELLIGENCE RULES
- If recommending substitutions, include a quick "best match" + "if you don't have that" backup.
- Default to common pantry assumptions only when reasonable; otherwise ask a clarifying question.
- When giving recipe ideas, offer 2–3 options with brief descriptions. Vary your formatting — don't always use numbered lists.

FOOD SAFETY
- Be confident but careful. For high-risk foods (chicken, seafood, leftovers), include safe temps/time guidance.
- If user asks something risky, prioritize safety over brevity.

LIMITATIONS
- You do NOT have access to the user's recipes, meal plans, favorites, or shopping lists.
- If asked to read personal data, say: "That feature isn't connected yet — coming soon." Then offer a workaround:
  ask them to paste the recipe / list ingredients / describe their goal.
"""

# Model configuration
MODEL_NAME = "gemini-3-flash-preview"


class MealGenieService:
    """Service for Meal Genie conversational AI."""

    def __init__(self):
        """Initialize the Meal Genie service."""
        self.api_key = os.getenv("GEMINI_ASSISTANT_API_KEY")
        if not self.api_key:
            raise ValueError("GEMINI_ASSISTANT_API_KEY environment variable is not set")

    def ask(
        self,
        message: str,
        conversation_history: Optional[List[MealGenieMessageDTO]] = None,
    ) -> dict:
        """
        Send a message to Meal Genie and get a response.

        Args:
            message: The user's message
            conversation_history: Optional list of previous messages for context

        Returns:
            dict with 'success', 'response', and optional 'error'
        """
        try:
            client = _get_genai_client()

            # Build the conversation contents
            contents = []

            # Add system prompt as first message
            contents.append({"role": "user", "parts": [{"text": SYSTEM_PROMPT}]})
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
