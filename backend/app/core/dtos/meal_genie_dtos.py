"""DTOs for Meal Genie conversational AI."""

from pydantic import BaseModel
from typing import Optional, List, Literal


class MealGenieMessageDTO(BaseModel):
    """A single message in the conversation."""

    role: Literal["user", "assistant"]
    content: str


class MealGenieRequestDTO(BaseModel):
    """Request DTO for Meal Genie chat."""

    message: str
    conversation_history: Optional[List[MealGenieMessageDTO]] = None


class MealGenieResponseDTO(BaseModel):
    """Response DTO for Meal Genie chat."""

    success: bool
    response: Optional[str] = None
    error: Optional[str] = None
