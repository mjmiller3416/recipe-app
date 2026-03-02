"""app/dtos/wizard_dtos.py

Pydantic DTOs for the wizard recipe generation flow.
"""

from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel, Field

from .assistant_dtos import GeneratedIngredientDTO
from .nutrition_dtos import NutritionFactsDTO


# ── Request DTOs ─────────────────────────────────────────────────────────────


class WizardGenerationPreferencesDTO(BaseModel):
    """Optional preferences to guide AI recipe generation."""

    cuisine: Optional[str] = None
    dietary: Optional[str] = None
    difficulty: Optional[str] = None
    servings: Optional[int] = Field(None, ge=1)
    meal_type: Optional[str] = None


class WizardGenerationRequestDTO(BaseModel):
    """Request DTO for wizard-based AI recipe generation."""

    prompt: str = Field(..., min_length=1, max_length=500)
    preferences: Optional[WizardGenerationPreferencesDTO] = None
    generate_image: bool = False
    estimate_nutrition: bool = True


# ── Response DTOs ────────────────────────────────────────────────────────────


class WizardGeneratedRecipeDTO(BaseModel):
    """Extended recipe DTO with wizard-specific fields (description, prep/cook time, difficulty)."""

    recipe_name: str
    recipe_category: str = "other"
    meal_type: str = "dinner"
    diet_pref: Optional[str] = None
    description: Optional[str] = None
    prep_time: Optional[int] = None
    cook_time: Optional[int] = None
    total_time: Optional[int] = None
    difficulty: Optional[str] = None
    servings: Optional[int] = None
    directions: Optional[str] = None
    notes: Optional[str] = None
    ingredients: List[GeneratedIngredientDTO] = []


class WizardGenerationResponseDTO(BaseModel):
    """Response DTO for wizard-based AI recipe generation."""

    success: bool
    recipe: Optional[WizardGeneratedRecipeDTO] = None
    nutrition_facts: Optional[NutritionFactsDTO] = None
    reference_image_data: Optional[str] = None
    banner_image_data: Optional[str] = None
    error: Optional[str] = None
