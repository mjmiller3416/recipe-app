"""Shared text processing utilities for AI services."""

import re


def clean_tip(tip: str) -> str:
    """Remove common prefixes and clean up formatting.

    Strips prefixes like "Tip:", "Chef's Tip:", "Pro Tip:", bullet markers,
    and surrounding quotes from AI-generated text.

    Args:
        tip: Raw tip text from AI response.

    Returns:
        Cleaned tip string.
    """
    tip = re.sub(
        r"^(Tip:|Chef's Tip:|Pro Tip:|Cooking Tip:|\*|\-|•)\s*",
        "",
        tip,
        flags=re.IGNORECASE,
    )
    tip = tip.strip("\"'")
    return tip.strip()
