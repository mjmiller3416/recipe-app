"""app/utils/unit_conversion.py

Unit dimension classification and conversion utilities for shopping list aggregation.
Converts quantities within the same dimension (mass, volume, count) to enable proper aggregation.
"""

from __future__ import annotations

import math
from typing import Tuple

# ── Dimension Constants ────────────────────────────────────────────────────────────────────────────────────────
DIMENSION_MASS = "mass"
DIMENSION_VOLUME = "volume"
DIMENSION_COUNT = "count"
DIMENSION_UNKNOWN = "unknown"


# ── Unit Conversion Mappings ───────────────────────────────────────────────────────────────────────────────────
# NOTE: These must match INGREDIENT_UNITS in frontend/src/lib/constants.ts
# Only units that can be selected in the frontend combobox should be listed here

# Mass units: convert to grams as base unit
MASS_UNITS: dict[str, float] = {
    "oz": 28.3495,
    "lbs": 453.592,
}

# Volume units: convert to milliliters as base unit
VOLUME_UNITS: dict[str, float] = {
    "tsp": 4.92892,
    "tbs": 14.7868,
    "cup": 236.588,
}

# Count units: no conversion needed, just track as count dimension
# NOTE: These must match INGREDIENT_UNITS in frontend/src/lib/constants.ts
# Only units that can be selected in the frontend combobox should be listed here
COUNT_UNITS: set[str] = {
    "",  # empty string = count (for items with no unit)
    # From frontend INGREDIENT_UNITS (count-type only)
    "stick",
    "bag",
    "box",
    "can",
    "jar",
    "package",
    "piece",
    "slice",
    "whole",
    "pinch",
    "dash",
    "to-taste",
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


def round_to_friendly(quantity: float, unit: str) -> float:
    """
    Round quantity to user-friendly fraction increments (always rounds UP for shopping).

    Unit-specific rounding (rounds UP to nearest increment):
    - cup, lbs, oz: 1/4 increments (e.g., 1.3 cup -> 1.5 cup)
    - tsp, tbs: 1/8 increments (e.g., 0.3 tsp -> 0.375 tsp)
    - Count units (can, bag, piece, etc.): whole numbers

    Args:
        quantity: The quantity to round.
        unit: The unit (determines rounding increment).

    Returns:
        User-friendly rounded quantity.
    """
    if quantity <= 0:
        return quantity

    # Count units should always be whole numbers
    normalized = normalize_unit(unit)
    if normalized in COUNT_UNITS or normalized == "":
        return math.ceil(quantity)

    # tsp and tbs: round UP to nearest 1/8
    if normalized in {"tsp", "tbs"}:
        return math.ceil(quantity * 8) / 8

    # cup, lbs, oz (and any other measurable unit): round UP to nearest 1/4
    return math.ceil(quantity * 4) / 4


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
    Convert from base unit to a sensible display unit with user-friendly rounding.

    Args:
        base_quantity: Quantity in base units (grams for mass, ml for volume).
        dimension: The dimension (mass, volume, count, unknown).
        original_unit: Optional original unit - preserves unit type when provided.

    Returns:
        Tuple of (display_quantity, display_unit)
    """
    normalized_original = normalize_unit(original_unit)

    if dimension == DIMENSION_MASS:
        # If original unit provided, convert back to that unit type
        if normalized_original in MASS_UNITS:
            factor = MASS_UNITS[normalized_original]
            display_label = _get_mass_display_label(normalized_original)
            qty = base_quantity / factor
            return round_to_friendly(qty, display_label), display_label
        # Fallback: use lbs for large quantities, oz for everything else
        if base_quantity >= 453.592:  # 1 lb or more
            qty = base_quantity / 453.592
            return round_to_friendly(qty, "lbs"), "lbs"
        # Use oz for anything under 1 lb (oz is the smallest frontend mass unit)
        qty = base_quantity / 28.3495
        return round_to_friendly(qty, "oz"), "oz"

    if dimension == DIMENSION_VOLUME:
        # If original unit provided, convert back to that unit type
        if normalized_original in VOLUME_UNITS:
            factor = VOLUME_UNITS[normalized_original]
            display_label = _get_volume_display_label(normalized_original)
            qty = base_quantity / factor
            return round_to_friendly(qty, display_label), display_label
        # Fallback: choose sensible unit based on quantity
        if base_quantity >= 236.588:  # 1 cup or more
            qty = base_quantity / 236.588
            return round_to_friendly(qty, "cup"), "cup"
        if base_quantity >= 14.7868:  # 1 Tbs or more
            qty = base_quantity / 14.7868
            return round_to_friendly(qty, "Tbs"), "Tbs"
        # For smaller volumes, use tsp (not ml - ml isn't valid in frontend)
        # Minimum practical amount is 0.25 tsp
        tsp_qty = base_quantity / 4.92892
        if tsp_qty < 0.25:
            tsp_qty = 0.25  # Minimum practical kitchen amount
        return round_to_friendly(tsp_qty, "tsp"), "tsp"

    # Count or unknown: keep original unit, round to whole number
    return round_to_friendly(base_quantity, normalized_original or ""), normalized_original or ""


def _get_volume_display_label(normalized_unit: str) -> str:
    """Map normalized volume unit to frontend-compatible display label."""
    # Frontend units: tbs, tsp, cup
    if normalized_unit == "tbs":
        return "Tbs"  # Capitalize for display
    if normalized_unit == "tsp":
        return "tsp"
    if normalized_unit == "cup":
        return "cup"
    return normalized_unit


def _get_mass_display_label(normalized_unit: str) -> str:
    """Map normalized mass unit to frontend-compatible display label."""
    # Frontend units: oz, lbs
    if normalized_unit == "lbs":
        return "lbs"
    if normalized_unit == "oz":
        return "oz"
    return normalized_unit
