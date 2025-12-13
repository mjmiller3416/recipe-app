"""app/core/utils/text_utils.py

Text processing and string manipulation utilities.

# ── Internal Index ──────────────────────────────────────────
#
# ── String Cleaning & Sanitization ──────────────────────────
# sanitize_form_input()         -> Clean form input text
# sanitize_multiline_input()    -> Clean multiline text
#
# ── Case & Format Transformations ───────────────────────────
# text_to_enum_key()           -> Convert text to enum key
# snake_to_title_case()        -> Convert snake_case to Title Case
# camel_to_title_case()        -> Convert camelCase to Title Case
#
# ── String Extraction & Parsing ─────────────────────────────
# safe_split_extract()         -> Safely extract from split string
# extract_first_number()       -> Get first number from text
#
# ── String Validation Helpers ───────────────────────────────
# is_empty_or_whitespace()     -> Check for empty/whitespace
# truncate_with_ellipsis()     -> Truncate text with ellipsis
# normalize_line_endings()     -> Normalize line endings

"""

# ── Imports ─────────────────────────────────────────────────────────────────────────────────────────────────
from __future__ import annotations

import re
from typing import Optional

__all__ = [
    # String Cleaning & Sanitization
    'sanitize_form_input', 'sanitize_multiline_input',

    # Case & Format Transformations
    'text_to_enum_key', 'snake_to_title_case', 'camel_to_title_case',

    # String Extraction & Parsing
    'safe_split_extract', 'extract_first_number',

    # String Validation Helpers
    'is_empty_or_whitespace', 'truncate_with_ellipsis', 'normalize_line_endings',
]


# ── String Cleaning & Sanitization ──────────────────────────────────────────────────────────────────────────
def sanitize_form_input(text: str) -> str:
    """
    Clean and normalize form input text.

    Args:
        text: Raw input text from form fields

    Returns:
        str: Cleaned text with normalized whitespace

    Examples:
        "  hello world  " -> "hello world"
        "\t\ntest\r\n" -> "test"
        "" -> ""
    """
    if not text:
        return ""

    # Strip whitespace and normalize internal whitespace
    return re.sub(r'\s+', ' ', text.strip())

def sanitize_multiline_input(text: str) -> str:
    """
    Clean multiline input while preserving line structure.

    Args:
        text: Raw multiline input text

    Returns:
        str: Cleaned text with normalized line endings and trimmed lines

    Examples:
        "  line1  \r\n  line2  " -> "line1\nline2"
    """
    if not text:
        return ""

    # Split lines, strip each, filter empty, rejoin
    lines = [line.strip() for line in text.splitlines()]
    return '\n'.join(line for line in lines if line)


# ── Case & Format Transformations ───────────────────────────────────────────────────────────────────────────
def text_to_enum_key(text: str) -> str:
    """
    Convert display text to enum-style key.

    Args:
        text: Display text to convert

    Returns:
        str: Uppercase enum key with underscores

    Examples:
        "Meal Type" -> "MEAL_TYPE"
        "quick & easy" -> "QUICK_EASY"
        "  Multi   Word  " -> "MULTI_WORD"
    """
    if not text:
        return ""

    # Clean, replace non-alphanumeric with underscore, convert to uppercase
    cleaned = sanitize_form_input(text)
    enum_key = re.sub(r'[^a-zA-Z0-9]+', '_', cleaned)
    return enum_key.upper().strip('_')

def snake_to_title_case(text: str) -> str:
    """
    Convert snake_case to Title Case.

    Args:
        text: Snake case text

    Returns:
        str: Title case text

    Examples:
        "recipe_category" -> "Recipe Category"
        "meal_type_setting" -> "Meal Type Setting"
        "quick_recipes" -> "Quick Recipes"
    """
    if not text:
        return ""

    return text.replace('_', ' ').title()

def camel_to_title_case(text: str) -> str:
    """
    Convert camelCase to Title Case.

    Args:
        text: Camel case text

    Returns:
        str: Title case text

    Examples:
        "recipeCategory" -> "Recipe Category"
        "mealTypeSetting" -> "Meal Type Setting"
        "XMLHttpRequest" -> "XML Http Request"
    """
    if not text:
        return ""

    # Insert space before uppercase letters (except at start)
    spaced = re.sub(r'(?<!^)(?=[A-Z][a-z])', ' ', text)
    # Handle sequences of capitals like "XMLHttp" -> "XML Http"
    spaced = re.sub(r'([A-Z])([A-Z][a-z])', r'\1 \2', spaced)
    return spaced.title()


# ── String Extraction & Parsing ─────────────────────────────────────────────────────────────────────────────
def safe_split_extract(text: str, delimiter: str, index: int,
                      default: str = "") -> str:
    """
    Safely extract element from split string.

    Args:
        text: String to split
        delimiter: Split delimiter
        index: Index to extract
        default: Default value if extraction fails

    Returns:
        str: Extracted element or default

    Examples:
        ("1-2", "-", 0) -> "1"
        ("1-2", "-", 1) -> "2"
        ("1-2", "-", 2) -> ""
        ("single", "-", 0) -> "single"
    """
    if not text:
        return default

    try:
        parts = text.split(delimiter)
        return parts[index].strip() if index < len(parts) else default
    except (IndexError, AttributeError):
        return default

def extract_first_number(text: str) -> Optional[int]:
    """
    Extract first number from text string.

    Args:
        text: Text containing numbers

    Returns:
        int | None: First number found or None

    Examples:
        "Serves 4-6 people" -> 4
        "2 cups flour" -> 2
        "No numbers here" -> None
        "Mix 1.5 cups" -> 1
    """
    if not text:
        return None

    match = re.search(r'\d+', text)
    return int(match.group()) if match else None


# ── String Validation Helpers ───────────────────────────────────────────────────────────────────────────────
def is_empty_or_whitespace(text: str) -> bool:
    """
    Check if text is empty or contains only whitespace.

    Args:
        text: Text to check

    Returns:
        bool: True if empty/whitespace only

    Examples:
        "" -> True
        "   " -> True
        "hello" -> False
        " hello " -> False
    """
    return not text or not text.strip()

def truncate_with_ellipsis(text: str, max_length: int,
                          ellipsis: str = "...") -> str:
    """
    Truncate text with ellipsis if over max length.

    Args:
        text: Text to truncate
        max_length: Maximum allowed length
        ellipsis: Ellipsis string to append

    Returns:
        str: Truncated text with ellipsis if needed

    Examples:
        ("Hello World", 8) -> "Hello..."
        ("Short", 10) -> "Short"
        ("", 5) -> ""
    """
    if not text or len(text) <= max_length:
        return text

    truncate_at = max_length - len(ellipsis)
    if truncate_at <= 0:
        return ellipsis[:max_length]

    return text[:truncate_at] + ellipsis

def normalize_line_endings(text: str) -> str:
    """
    Normalize line endings to Unix-style (\n).

    Args:
        text: Text with mixed line endings

    Returns:
        str: Text with normalized line endings
    """
    if not text:
        return ""

    # Convert CRLF and CR to LF
    return text.replace('\r\n', '\n').replace('\r', '\n')
