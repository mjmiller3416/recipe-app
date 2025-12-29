"""app/core/utils/unit_conversion.py

Unit dimension classification and conversion utilities for shopping list aggregation.
Converts quantities within the same dimension (mass, volume, count) to enable proper aggregation.
"""

from __future__ import annotations

from typing import Tuple

# ── Dimension Constants ────────────────────────────────────────────────────────────────────────────────────────
DIMENSION_MASS = "mass"
DIMENSION_VOLUME = "volume"
DIMENSION_COUNT = "count"
DIMENSION_UNKNOWN = "unknown"


# ── Unit Conversion Mappings ───────────────────────────────────────────────────────────────────────────────────
# Mass units: convert to grams as base unit
MASS_UNITS: dict[str, float] = {
    "g": 1.0,
    "gram": 1.0,
    "grams": 1.0,
    "kg": 1000.0,
    "kilogram": 1000.0,
    "kilograms": 1000.0,
    "oz": 28.3495,
    "ounce": 28.3495,
    "ounces": 28.3495,
    "lb": 453.592,
    "lbs": 453.592,
    "pound": 453.592,
    "pounds": 453.592,
}

# Volume units: convert to milliliters as base unit
VOLUME_UNITS: dict[str, float] = {
    "ml": 1.0,
    "milliliter": 1.0,
    "milliliters": 1.0,
    "l": 1000.0,
    "liter": 1000.0,
    "liters": 1000.0,
    "tsp": 4.92892,
    "teaspoon": 4.92892,
    "teaspoons": 4.92892,
    "tbsp": 14.7868,
    "tablespoon": 14.7868,
    "tablespoons": 14.7868,
    "fl oz": 29.5735,
    "fluid ounce": 29.5735,
    "fluid ounces": 29.5735,
    "cup": 236.588,
    "cups": 236.588,
    "pint": 473.176,
    "pints": 473.176,
    "quart": 946.353,
    "quarts": 946.353,
    "gallon": 3785.41,
    "gallons": 3785.41,
}

# Count units: no conversion needed, just track as count dimension
COUNT_UNITS: set[str] = {
    "",  # empty string = count
    "piece",
    "pieces",
    "item",
    "items",
    "whole",
    "can",
    "cans",
    "package",
    "packages",
    "pkg",
    "clove",
    "cloves",
    "head",
    "heads",
    "bunch",
    "bunches",
    "slice",
    "slices",
    "stick",
    "sticks",
    "sprig",
    "sprigs",
    "leaf",
    "leaves",
    "ear",
    "ears",
    "stalk",
    "stalks",
    "strip",
    "strips",
    "fillet",
    "fillets",
    "breast",
    "breasts",
    "thigh",
    "thighs",
    "leg",
    "legs",
    "wing",
    "wings",
    "large",
    "medium",
    "small",
}


# ── Helper Functions ───────────────────────────────────────────────────────────────────────────────────────────
def normalize_unit(unit: str | None) -> str:
    """
    Normalize a unit string for consistent lookup.

    Args:
        unit: The unit string to normalize.

    Returns:
        Normalized lowercase unit string with whitespace stripped.
    """
    if not unit:
        return ""
    return unit.strip().lower().rstrip(".")


def get_dimension(unit: str | None) -> str:
    """
    Determine the dimension (mass, volume, count, unknown) of a unit.

    Args:
        unit: The unit string to classify.

    Returns:
        One of: DIMENSION_MASS, DIMENSION_VOLUME, DIMENSION_COUNT, DIMENSION_UNKNOWN
    """
    normalized = normalize_unit(unit)

    if normalized in MASS_UNITS:
        return DIMENSION_MASS
    if normalized in VOLUME_UNITS:
        return DIMENSION_VOLUME
    if normalized in COUNT_UNITS:
        return DIMENSION_COUNT

    return DIMENSION_UNKNOWN


def to_base_unit(quantity: float, unit: str | None) -> Tuple[float, str]:
    """
    Convert a quantity to its base unit within its dimension.

    Mass → grams, Volume → milliliters, Count/Unknown → unchanged.

    Args:
        quantity: The quantity to convert.
        unit: The unit of the quantity.

    Returns:
        Tuple of (converted_quantity, base_unit_name)
    """
    normalized = normalize_unit(unit)
    dimension = get_dimension(unit)

    if dimension == DIMENSION_MASS:
        factor = MASS_UNITS.get(normalized, 1.0)
        return quantity * factor, "g"

    if dimension == DIMENSION_VOLUME:
        factor = VOLUME_UNITS.get(normalized, 1.0)
        return quantity * factor, "ml"

    # Count or unknown: keep as-is
    return quantity, normalized


def to_display_unit(base_quantity: float, dimension: str, original_unit: str | None = None) -> Tuple[float, str]:
    """
    Convert from base unit to a sensible display unit.

    Args:
        base_quantity: Quantity in base units (grams for mass, ml for volume).
        dimension: The dimension (mass, volume, count, unknown).
        original_unit: Optional original unit for count/unknown dimensions.

    Returns:
        Tuple of (display_quantity, display_unit)
    """
    if dimension == DIMENSION_MASS:
        # Prefer lbs/oz for US-style display
        if base_quantity >= 453.592:  # 1 lb or more
            return round(base_quantity / 453.592, 2), "lbs"
        if base_quantity >= 28.3495:  # 1 oz or more
            return round(base_quantity / 28.3495, 2), "oz"
        return round(base_quantity, 2), "g"

    if dimension == DIMENSION_VOLUME:
        if base_quantity >= 236.588:  # 1 cup or more
            return round(base_quantity / 236.588, 2), "cups"
        if base_quantity >= 14.7868:  # 1 tbsp or more
            return round(base_quantity / 14.7868, 2), "tbsp"
        if base_quantity >= 4.92892:  # 1 tsp or more
            return round(base_quantity / 4.92892, 2), "tsp"
        return round(base_quantity, 2), "ml"

    # Count or unknown: keep original unit
    return base_quantity, normalize_unit(original_unit) or ""
