"""app/core/utils/format_utils.py

Formatting utilities for recipe display including quantity formatting and unit abbreviations.

# ── Internal Index ──────────────────────────────────────────
#
# ── Quantity Formatting ─────────────────────────────────────
# format_quantity()             -> Convert decimals to fractions
#
# ── Unit Abbreviations ──────────────────────────────────────
# abbreviate_unit()             -> Convert unit names to abbreviations
#
# ── Combined Formatting ─────────────────────────────────────
# format_quantity_and_unit()    -> Format both quantity and unit

"""

# ── Imports ─────────────────────────────────────────────────────────────────────────────────────────────────
from __future__ import annotations

from fractions import Fraction
from typing import Dict

__all__ = [
    # Quantity Formatting
    'format_quantity',

    # Unit Abbreviations
    'UNIT_ABBREVIATIONS', 'abbreviate_unit',

    # Combined Formatting
    'format_quantity_and_unit',
]


# ── Quantity Formatting ─────────────────────────────────────────────────────────────────────────────────────
def format_quantity(decimal_value: float) -> str:
    """
    Convert decimal quantities to human-readable fractions or whole numbers.

    Args:
        decimal_value: The numeric quantity to format

    Returns:
        str: Formatted quantity as whole number, fraction, or mixed number

    Examples:
        1.0 -> "1"
        0.5 -> "1/2"
        1.5 -> "1 1/2"
        0.25 -> "1/4"
        2.33 -> "2 1/3"
        0.125 -> "1/8"
    """
    if decimal_value <= 0:
        return ""

    # Handle whole numbers
    if decimal_value == int(decimal_value):
        return str(int(decimal_value))

    # Convert to fraction
    try:
        frac = Fraction(decimal_value).limit_denominator(16)  # Limit to common cooking fractions

        # If it's a proper fraction (numerator < denominator)
        if frac.numerator < frac.denominator:
            return f"{frac.numerator}/{frac.denominator}"

        # If it's an improper fraction, convert to mixed number
        whole_part = frac.numerator // frac.denominator
        remainder = frac.numerator % frac.denominator

        if remainder == 0:
            return str(whole_part)
        else:
            return f"{whole_part} {remainder}/{frac.denominator}"

    except (ValueError, ZeroDivisionError):
        # Fallback to decimal with 2 places if fraction conversion fails
        return f"{decimal_value:.2f}".rstrip('0').rstrip('.')


# ── Unit Abbreviations ──────────────────────────────────────────────────────────────────────────────────────
UNIT_ABBREVIATIONS: Dict[str, str] = {
    # Volume measurements
    "tablespoons": "Tbs",
    "tablespoon": "Tbs",
    "teaspoons": "tsp",
    "teaspoon": "tsp",
    "cups": "cups",
    "cup": "cup",
    "pints": "pts",
    "pint": "pt",
    "quarts": "qts",
    "quart": "qt",
    "gallons": "gal",
    "gallon": "gal",
    "fluid ounces": "fl oz",
    "fluid ounce": "fl oz",
    "milliliters": "ml",
    "milliliter": "ml",
    "liters": "l",
    "liter": "l",

    # Weight measurements
    "pounds": "lbs",
    "pound": "lb",
    "ounces": "oz",
    "ounce": "oz",
    "grams": "g",
    "gram": "g",
    "kilograms": "kg",
    "kilogram": "kg",

    # Keep these units unchanged (special/descriptive)
    "cloves": "cloves",
    "clove": "clove",
    "fillets": "fillets",
    "fillet": "fillet",
    "whole": "whole",
    "pieces": "pieces",
    "piece": "piece",
    "slices": "slices",
    "slice": "slice",
    "sprigs": "sprigs",
    "sprig": "sprig",
    "leaves": "leaves",
    "leaf": "leaf",
    "stalks": "stalks",
    "stalk": "stalk",
    "bulbs": "bulbs",
    "bulb": "bulb",
    "heads": "heads",
    "head": "head",
    "bunches": "bunches",
    "bunch": "bunch",
    "packages": "packages",
    "package": "package",
    "cans": "cans",
    "can": "can",
    "bottles": "bottles",
    "bottle": "bottle",
    "jars": "jars",
    "jar": "jar",
}

def abbreviate_unit(unit: str) -> str:
    """
    Convert unit names to their abbreviated forms for display.

    Args:
        unit: The full unit name to abbreviate

    Returns:
        str: The abbreviated unit, or original if no abbreviation exists

    Examples:
        "tablespoons" -> "Tbs"
        "teaspoons" -> "tsp"
        "cloves" -> "cloves" (unchanged)
        "cups" -> "cups" (unchanged)
    """
    if not unit:
        return ""

    # Convert to lowercase for lookup, but preserve original case for unknown units
    unit_lower = unit.lower().strip()
    return UNIT_ABBREVIATIONS.get(unit_lower, unit)


# ── Combined Formatting ─────────────────────────────────────────────────────────────────────────────────────
def format_quantity_and_unit(quantity: float, unit: str) -> tuple[str, str]:
    """
    Format both quantity and unit for consistent display.

    Args:
        quantity: The numeric quantity
        unit: The unit name

    Returns:
        tuple: (formatted_quantity, abbreviated_unit)

    Examples:
        (1.5, "tablespoons") -> ("1 1/2", "Tbs")
        (2.0, "cloves") -> ("2", "cloves")
        (0.25, "cups") -> ("1/4", "cups")
    """
    formatted_qty = format_quantity(quantity)
    abbreviated_unit = abbreviate_unit(unit)

    return formatted_qty, abbreviated_unit
