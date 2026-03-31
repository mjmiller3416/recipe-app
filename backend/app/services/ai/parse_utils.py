"""Shared parsing utilities for AI services.

Type-safe conversion helpers and common DTO construction logic
used across recipe generation, nutrition estimation, and other AI services.
"""

from typing import Optional

from app.dtos.nutrition_dtos import NutritionFactsDTO


def safe_int(value: object) -> Optional[int]:
    """Safely convert a value to int, returning None on failure."""
    if value is None:
        return None
    try:
        return int(float(value))
    except (ValueError, TypeError):
        return None


def safe_float(value: object) -> Optional[float]:
    """Safely convert a value to float, returning None on failure."""
    if value is None:
        return None
    try:
        return round(float(value), 1)
    except (ValueError, TypeError):
        return None


def parse_nutrition_dict(data: dict) -> Optional[NutritionFactsDTO]:
    """Parse a nutrition facts dictionary into a NutritionFactsDTO.

    Handles missing fields and type coercion from AI responses
    where values may arrive as strings, floats, or nulls.

    Args:
        data: Raw nutrition facts dictionary from an AI response.

    Returns:
        A NutritionFactsDTO with is_ai_estimated=True, or None if data is empty/falsy.
    """
    if not data:
        return None

    return NutritionFactsDTO(
        calories=safe_int(data.get("calories")),
        protein_g=safe_float(data.get("protein_g")),
        total_fat_g=safe_float(data.get("total_fat_g")),
        saturated_fat_g=safe_float(data.get("saturated_fat_g")),
        trans_fat_g=safe_float(data.get("trans_fat_g")),
        cholesterol_mg=safe_float(data.get("cholesterol_mg")),
        sodium_mg=safe_float(data.get("sodium_mg")),
        total_carbs_g=safe_float(data.get("total_carbs_g")),
        dietary_fiber_g=safe_float(data.get("dietary_fiber_g")),
        total_sugars_g=safe_float(data.get("total_sugars_g")),
        is_ai_estimated=True,
    )
