"""app/core/utils/conversion_utils.py

Safe type conversion utilities for robust data processing.

# ── Internal Index ──────────────────────────────────────────────────────────────────────
#
# ── Safe Type Conversions ───────────────────────────────────────────────────────────────
# safe_float_conversion()       -> Convert to float with fallback
# safe_int_conversion()         -> Convert to int with fallback
# safe_bool_conversion()        -> Convert to bool with fallback
#
# ── Numeric Range Parsing ───────────────────────────────────────────────────────────────
# extract_numeric_range()       -> Parse numeric ranges from text
# parse_servings_range()        -> Parse serving ranges specifically
#
# ── Data Structure Conversions ──────────────────────────────────────────────────────────
# dict_to_obj()                 -> Convert dict to object with attributes
# flatten_dict()                -> Flatten nested dictionaries
# normalize_dict_keys()         -> Normalize dictionary key formatting
#
# ── Collection Conversions ──────────────────────────────────────────────────────────────
# ensure_list()                 -> Ensure value is a list
# split_and_clean()             -> Split string and clean elements
# deduplicate_preserve_order()  -> Remove duplicates keeping order

"""

# ── Imports ─────────────────────────────────────────────────────────────────────────────────────────────────
from __future__ import annotations

import re
from typing import Any, Dict, List, Optional

__all__ = [
    # Safe Type Conversions
    'safe_float_conversion', 'safe_int_conversion', 'safe_bool_conversion',

    # Numeric Range Parsing
    'extract_numeric_range', 'parse_servings_range',

    # Data Structure Conversions
    'dict_to_obj', 'flatten_dict', 'normalize_dict_keys', 'serialize_form_payload',

    # Collection Conversions
    'ensure_list', 'split_and_clean', 'deduplicate_preserve_order',
]


# ── Safe Type Conversions ───────────────────────────────────────────────────────────────────────────────────
def safe_float_conversion(value: Any, default: float = 0.0) -> float:
    """
    Convert value to float safely with fallback.

    Args:
        value: Value to convert (any type)
        default: Default value if conversion fails

    Returns:
        float: Converted value or default

    Examples:
        safe_float_conversion("3.14") -> 3.14
        safe_float_conversion("invalid", 0.0) -> 0.0
        safe_float_conversion("  2.5  ") -> 2.5
        safe_float_conversion(None) -> 0.0
        safe_float_conversion("") -> 0.0
    """
    if value is None:
        return default

    # Handle already numeric types
    if isinstance(value, (int, float)):
        return float(value)

    # Handle string conversion
    if isinstance(value, str):
        value = value.strip()
        if not value:
            return default

        # Remove common non-numeric characters
        cleaned = re.sub(r'[^\d\.\-\+]', '', value)
        if not cleaned:
            return default

        try:
            return float(cleaned)
        except (ValueError, TypeError):
            return default

    # Try direct conversion for other types
    try:
        return float(value)
    except (ValueError, TypeError):
        return default

def safe_int_conversion(value: Any, default: int = 0) -> int:
    """
    Convert value to int safely with fallback.

    Args:
        value: Value to convert (any type)
        default: Default value if conversion fails

    Returns:
        int: Converted value or default

    Examples:
        safe_int_conversion("42") -> 42
        safe_int_conversion("3.7") -> 3
        safe_int_conversion("invalid", 0) -> 0
        safe_int_conversion("  25  ") -> 25
    """
    if value is None:
        return default

    # Handle already numeric types
    if isinstance(value, int):
        return value
    if isinstance(value, float):
        return int(value)

    # Handle string conversion
    if isinstance(value, str):
        value = value.strip()
        if not value:
            return default

        # First try safe_float_conversion, then convert to int
        float_value = safe_float_conversion(value, None)
        if float_value is not None:
            return int(float_value)
        return default

    # Try direct conversion for other types
    try:
        return int(float(value))
    except (ValueError, TypeError):
        return default

def safe_bool_conversion(value: Any, default: bool = False) -> bool:
    """
    Convert value to bool safely with fallback.

    Args:
        value: Value to convert (any type)
        default: Default value if conversion fails

    Returns:
        bool: Converted value or default

    Examples:
        safe_bool_conversion("true") -> True
        safe_bool_conversion("1") -> True
        safe_bool_conversion("false") -> False
        safe_bool_conversion("0") -> False
        safe_bool_conversion("yes") -> True
    """
    if value is None:
        return default

    # Handle already bool type
    if isinstance(value, bool):
        return value

    # Handle numeric types
    if isinstance(value, (int, float)):
        return bool(value)

    # Handle string conversion
    if isinstance(value, str):
        value = value.strip().lower()
        if value in ('true', '1', 'yes', 'on', 'enabled'):
            return True
        elif value in ('false', '0', 'no', 'off', 'disabled', ''):
            return False
        return default

    # Use Python's default bool conversion
    try:
        return bool(value)
    except:
        return default


# ── Numeric Range Parsing ───────────────────────────────────────────────────────────────────────────────────
def extract_numeric_range(text: str) -> tuple[Optional[int], Optional[int]]:
    """
    Extract numeric range from text string.

    Args:
        text: Text containing range (e.g., "4-6", "2 to 8")

    Returns:
        tuple[int | None, int | None]: (min_value, max_value)

    Examples:
        extract_numeric_range("4-6 servings") -> (4, 6)
        extract_numeric_range("2 to 8 hours") -> (2, 8)
        extract_numeric_range("5 minutes") -> (5, None)
        extract_numeric_range("No numbers") -> (None, None)
    """
    if not text:
        return (None, None)

    # Look for range patterns: "4-6", "2 to 8", "1-2", etc.
    range_patterns = [
        r'(\d+)\s*-\s*(\d+)',           # "4-6"
        r'(\d+)\s+to\s+(\d+)',          # "2 to 8"
        r'(\d+)\s*–\s*(\d+)',           # "4–6" (em dash)
        r'(\d+)\s*—\s*(\d+)',           # "4—6" (em dash)
    ]

    for pattern in range_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            min_val = safe_int_conversion(match.group(1))
            max_val = safe_int_conversion(match.group(2))
            return (min_val, max_val)

    # Look for single number
    single_match = re.search(r'\d+', text)
    if single_match:
        value = safe_int_conversion(single_match.group())
        return (value, None)

    return (None, None)

def parse_servings_range(servings_text: str) -> int:
    """
    Parse servings field, handling ranges by taking the minimum value.

    Args:
        servings_text: Text containing serving information

    Returns:
        int: Parsed serving count (minimum if range)

    Examples:
        parse_servings_range("4-6") -> 4
        parse_servings_range("2 to 4 people") -> 2
        parse_servings_range("8") -> 8
        parse_servings_range("serves 6-8") -> 6
    """
    if not servings_text:
        return 0

    min_val, max_val = extract_numeric_range(servings_text.strip())
    return min_val if min_val is not None else 0


# ── Data Structure Conversions ──────────────────────────────────────────────────────────────────────────────
class SimpleObject:
    """Simple object for dict-to-object conversion."""

    def __init__(self, **kwargs):
        for key, value in kwargs.items():
            setattr(self, key, value)

    def __repr__(self):
        attrs = ', '.join(f"{k}={v!r}" for k, v in self.__dict__.items())
        return f"SimpleObject({attrs})"


def dict_to_obj(data: Dict[str, Any]) -> SimpleObject:
    """
    Convert dictionary to object with attributes.

    Args:
        data: Dictionary to convert

    Returns:
        SimpleObject: Object with dictionary keys as attributes

    Examples:
        obj = dict_to_obj({"name": "John", "age": 30})
        obj.name -> "John"
        obj.age -> 30
    """
    if not isinstance(data, dict):
        return SimpleObject()

    # Convert nested dictionaries recursively
    converted = {}
    for key, value in data.items():
        if isinstance(value, dict):
            converted[key] = dict_to_obj(value)
        elif isinstance(value, list):
            converted[key] = [dict_to_obj(item) if isinstance(item, dict) else item
                             for item in value]
        else:
            converted[key] = value

    return SimpleObject(**converted)

def flatten_dict(data: Dict[str, Any], separator: str = '_') -> Dict[str, Any]:
    """
    Flatten nested dictionary structure.

    Args:
        data: Nested dictionary to flatten
        separator: Separator for nested keys

    Returns:
        Dict[str, Any]: Flattened dictionary

    Examples:
        flatten_dict({"user": {"name": "John", "age": 30}})
        -> {"user_name": "John", "user_age": 30}
    """
    def _flatten(obj: Any, parent_key: str = '') -> Dict[str, Any]:
        items = []

        if isinstance(obj, dict):
            for key, value in obj.items():
                new_key = f"{parent_key}{separator}{key}" if parent_key else key
                items.extend(_flatten(value, new_key).items())
        else:
            return {parent_key: obj}

        return dict(items)

    return _flatten(data)

def normalize_dict_keys(data: Dict[str, Any], case_style: str = 'snake') -> Dict[str, Any]:
    """
    Normalize dictionary keys to consistent case style.

    Args:
        data: Dictionary with keys to normalize
        case_style: Target case style ('snake', 'camel', 'pascal')

    Returns:
        Dict[str, Any]: Dictionary with normalized keys

    Examples:
        normalize_dict_keys({"firstName": "John"}, "snake")
        -> {"first_name": "John"}
    """
    def to_snake_case(text: str) -> str:
        # Convert camelCase/PascalCase to snake_case
        s1 = re.sub('(.)([A-Z][a-z]+)', r'\1_\2', text)
        return re.sub('([a-z0-9])([A-Z])', r'\1_\2', s1).lower()

    def to_camel_case(text: str) -> str:
        # Convert snake_case to camelCase
        components = text.split('_')
        return components[0] + ''.join(word.capitalize() for word in components[1:])

    def to_pascal_case(text: str) -> str:
        # Convert snake_case to PascalCase
        return ''.join(word.capitalize() for word in text.split('_'))

    converters = {
        'snake': to_snake_case,
        'camel': to_camel_case,
        'pascal': to_pascal_case,
    }

    converter = converters.get(case_style, to_snake_case)

    normalized = {}
    for key, value in data.items():
        new_key = converter(str(key))
        if isinstance(value, dict):
            normalized[new_key] = normalize_dict_keys(value, case_style)
        else:
            normalized[new_key] = value

    return normalized


# ── Collection Conversions ──────────────────────────────────────────────────────────────────────────────────
def serialize_form_payload(
    form_data: Dict[str, Any],
    field_transformations: Optional[Dict[str, callable]] = None
) -> Dict[str, Any]:
    """
    Transform form data into a serialized payload with type conversions.

    Args:
        form_data: Raw form data dictionary
        field_transformations: Optional transformations for specific fields

    Returns:
        Dict[str, Any]: Transformed payload ready for API/service calls

    Examples:
        raw_data = {"servings": "4", "time": "30 mins"}
        transformations = {"servings": int, "time": lambda x: int(x.split()[0])}
        payload = serialize_form_payload(raw_data, transformations)
        # Returns: {"servings": 4, "time": 30}
    """
    if field_transformations is None:
        field_transformations = {}

    payload = {}

    for field_name, value in form_data.items():
        if field_name in field_transformations:
            try:
                payload[field_name] = field_transformations[field_name](value)
            except (ValueError, TypeError, AttributeError):
                payload[field_name] = value  # Keep original on transformation error
        else:
            payload[field_name] = value

    return payload

def ensure_list(value: Any) -> List[Any]:
    """
    Ensure value is a list.

    Args:
        value: Value to convert to list

    Returns:
        List[Any]: Value as list

    Examples:
        ensure_list("item") -> ["item"]
        ensure_list(["a", "b"]) -> ["a", "b"]
        ensure_list(None) -> []
        ensure_list(("a", "b")) -> ["a", "b"]
    """
    if value is None:
        return []

    if isinstance(value, list):
        return value

    if isinstance(value, (tuple, set)):
        return list(value)

    if isinstance(value, str):
        return [value]

    # Try to iterate (for other iterable types)
    try:
        return list(value)
    except TypeError:
        return [value]

def split_and_clean(text: str, delimiter: str = ',', strip_empty: bool = True) -> List[str]:
    """
    Split string and clean resulting elements.

    Args:
        text: String to split
        delimiter: Split delimiter
        strip_empty: Whether to remove empty strings

    Returns:
        List[str]: Cleaned list of strings

    Examples:
        split_and_clean("a, b, c") -> ["a", "b", "c"]
        split_and_clean("x,,y,", strip_empty=True) -> ["x", "y"]
        split_and_clean("  a  |  b  ", "|") -> ["a", "b"]
    """
    if not text:
        return []

    parts = text.split(delimiter)
    cleaned = [part.strip() for part in parts]

    if strip_empty:
        cleaned = [part for part in cleaned if part]

    return cleaned

def deduplicate_preserve_order(items: List[Any]) -> List[Any]:
    """
    Remove duplicates from list while preserving order.

    Args:
        items: List with potential duplicates

    Returns:
        List[Any]: List with duplicates removed, order preserved

    Examples:
        deduplicate_preserve_order([1, 2, 2, 3, 1]) -> [1, 2, 3]
        deduplicate_preserve_order(["a", "b", "a"]) -> ["a", "b"]
    """
    seen = set()
    result = []

    for item in items:
        if item not in seen:
            seen.add(item)
            result.append(item)

    return result
