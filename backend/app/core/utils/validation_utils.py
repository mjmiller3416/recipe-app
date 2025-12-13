"""app/core/utils/validation_utils.py

Input validation utilities for consistent data validation across the application.

# ── Internal Index ──────────────────────────────────────────
#
# ── Validation Result Types ───────────────────────────────
# ValidationResult()            -> Container for validation results
#
# ── Basic Input Validation ───────────────────────────────
# validate_non_empty_input()    -> Check for non-empty values
# validate_min_length()         -> Validate minimum string length
# validate_max_length()         -> Validate maximum string length
#
# ── Pattern-Based Validation ───────────────────────────────
# validate_pattern_match()      -> Validate against regex patterns
# validate_alphanumeric_only()  -> Validate alphanumeric characters
#
# ── Numeric Validation ────────────────────────────────────
# validate_numeric_range()      -> Validate numeric values within range
# validate_positive_number()    -> Validate positive numbers
#
# ── Batch Validation ───────────────────────────────────────
# batch_validate_inputs()       -> Validate multiple inputs
# validate_required_fields()    -> Check required field presence
#
# ── Specialized Validators ─────────────────────────────────
# validate_choice_selection()   -> Validate against allowed choices
# validate_file_extension()     -> Validate file extensions

"""


# ── Imports ─────────────────────────────────────────────────────────────────────────────────────────────────
from __future__ import annotations

import re
from typing import Any, Dict, List, Optional, Pattern, Union

__all__ = [
    # Validation Result Types
    'ValidationResult',

    # Basic Input Validation
    'validate_non_empty_input', 'validate_min_length', 'validate_max_length',

    # Pattern-Based Validation
    'validate_pattern_match', 'validate_alphanumeric_only',

    # Numeric Validation
    'validate_numeric_range', 'validate_positive_number',

    # Batch Validation
    'batch_validate_inputs', 'validate_required_fields',

    # Specialized Validators
    'validate_choice_selection', 'validate_file_extension',
]


# ── Validation Result Types ─────────────────────────────────────────────────────────────────────────────────
class ValidationResult:
    """Container for validation results."""

    def __init__(self, is_valid: bool, error_message: str = ""):
        self.is_valid = is_valid
        self.error_message = error_message

    def __bool__(self) -> bool:
        return self.is_valid

    def __repr__(self) -> str:
        return f"ValidationResult(valid={self.is_valid}, error='{self.error_message}')"


# ── Basic Input Validation ──────────────────────────────────────────────────────────────────────────────────
def validate_non_empty_input(value: Any, field_name: str = "Field") -> ValidationResult:
    """
    Validate that input is not empty or whitespace-only.

    Args:
        value: Value to validate (will be converted to string)
        field_name: Name of field for error message

    Returns:
        ValidationResult: Result with is_valid and error_message

    Examples:
        validate_non_empty_input("hello", "Name") -> ValidationResult(True, "")
        validate_non_empty_input("", "Name") -> ValidationResult(False, "Name cannot be empty")
        validate_non_empty_input("   ", "Name") -> ValidationResult(False, "Name cannot be empty")
    """
    if value is None:
        return ValidationResult(False, f"{field_name} cannot be empty")

    text = str(value).strip()
    if not text:
        return ValidationResult(False, f"{field_name} cannot be empty")

    return ValidationResult(True)

def validate_min_length(value: str, min_length: int,
                       field_name: str = "Field") -> ValidationResult:
    """
    Validate minimum string length.

    Args:
        value: String to validate
        min_length: Minimum required length
        field_name: Name of field for error message

    Returns:
        ValidationResult: Validation result

    Examples:
        validate_min_length("hello", 3, "Name") -> ValidationResult(True, "")
        validate_min_length("hi", 3, "Name") -> ValidationResult(False, "Name must be at least 3 characters")
    """
    if not value:
        value = ""

    if len(value.strip()) < min_length:
        return ValidationResult(
            False,
            f"{field_name} must be at least {min_length} characters"
        )

    return ValidationResult(True)

def validate_max_length(value: str, max_length: int,
                       field_name: str = "Field") -> ValidationResult:
    """
    Validate maximum string length.

    Args:
        value: String to validate
        max_length: Maximum allowed length
        field_name: Name of field for error message

    Returns:
        ValidationResult: Validation result
    """
    if not value:
        return ValidationResult(True)

    if len(value) > max_length:
        return ValidationResult(
            False,
            f"{field_name} cannot exceed {max_length} characters"
        )

    return ValidationResult(True)


# ── Pattern-Based Validation ────────────────────────────────────────────────────────────────────────────────
def validate_pattern_match(value: str, pattern: Union[str, Pattern],
                          field_name: str = "Field",
                          error_message: Optional[str] = None) -> ValidationResult:
    """
    Validate string against regex pattern.

    Args:
        value: String to validate
        pattern: Regex pattern (string or compiled Pattern)
        field_name: Name of field for error message
        error_message: Custom error message (optional)

    Returns:
        ValidationResult: Validation result

    Examples:
        validate_pattern_match("abc123", r"^[a-z0-9]+$") -> ValidationResult(True, "")
        validate_pattern_match("ABC", r"^[a-z]+$") -> ValidationResult(False, "Field format is invalid")
    """
    if not value:
        return ValidationResult(False, error_message or f"{field_name} cannot be empty")

    if isinstance(pattern, str):
        pattern = re.compile(pattern)

    if not pattern.match(value):
        return ValidationResult(
            False,
            error_message or f"{field_name} format is invalid"
        )

    return ValidationResult(True)

def validate_alphanumeric_only(value: str, field_name: str = "Field",
                              allow_spaces: bool = True) -> ValidationResult:
    """
    Validate that string contains only alphanumeric characters.

    Args:
        value: String to validate
        field_name: Name of field for error message
        allow_spaces: Whether to allow spaces

    Returns:
        ValidationResult: Validation result
    """
    if not value:
        return ValidationResult(False, f"{field_name} cannot be empty")

    pattern = r'^[a-zA-Z0-9\s]+$' if allow_spaces else r'^[a-zA-Z0-9]+$'
    spaces_text = " and spaces" if allow_spaces else ""

    return validate_pattern_match(
        value,
        pattern,
        field_name,
        f"{field_name} can only contain letters, numbers{spaces_text}"
    )


# ── Numeric Validation ──────────────────────────────────────────────────────────────────────────────────────
def validate_numeric_range(value: Union[str, int, float],
                          min_value: Optional[Union[int, float]] = None,
                          max_value: Optional[Union[int, float]] = None,
                          field_name: str = "Field") -> ValidationResult:
    """
    Validate numeric value within range.

    Args:
        value: Value to validate (string will be converted)
        min_value: Minimum allowed value (optional)
        max_value: Maximum allowed value (optional)
        field_name: Name of field for error message

    Returns:
        ValidationResult: Validation result

    Examples:
        validate_numeric_range(5, 1, 10) -> ValidationResult(True, "")
        validate_numeric_range("15", 1, 10) -> ValidationResult(False, "Field must be between 1 and 10")
        validate_numeric_range(5, min_value=1) -> ValidationResult(True, "")
    """
    # Convert string to number
    try:
        if isinstance(value, str):
            if not value.strip():
                return ValidationResult(False, f"{field_name} must be a number")
            # Try int first, then float
            numeric_value = int(value) if value.isdigit() else float(value)
        else:
            numeric_value = value
    except (ValueError, TypeError):
        return ValidationResult(False, f"{field_name} must be a valid number")

    # Check range constraints
    if min_value is not None and numeric_value < min_value:
        if max_value is not None:
            return ValidationResult(
                False,
                f"{field_name} must be between {min_value} and {max_value}"
            )
        else:
            return ValidationResult(
                False,
                f"{field_name} must be at least {min_value}"
            )

    if max_value is not None and numeric_value > max_value:
        if min_value is not None:
            return ValidationResult(
                False,
                f"{field_name} must be between {min_value} and {max_value}"
            )
        else:
            return ValidationResult(
                False,
                f"{field_name} cannot exceed {max_value}"
            )

    return ValidationResult(True)

def validate_positive_number(value: Union[str, int, float],
                           field_name: str = "Field",
                           allow_zero: bool = False) -> ValidationResult:
    """
    Validate that value is a positive number.

    Args:
        value: Value to validate
        field_name: Name of field for error message
        allow_zero: Whether zero is considered valid

    Returns:
        ValidationResult: Validation result
    """
    min_value = 0 if allow_zero else 0.01
    return validate_numeric_range(
        value,
        min_value=min_value,
        field_name=field_name
    )


# ── Batch Validation ────────────────────────────────────────────────────────────────────────────────────────
def batch_validate_inputs(inputs: Dict[str, Any],
                         validators: Dict[str, List[callable]]) -> Dict[str, str]:
    """
    Validate multiple inputs with their respective validators.

    Args:
        inputs: Dictionary of field_name -> value pairs
        validators: Dictionary of field_name -> list of validator functions

    Returns:
        Dict[str, str]: Dictionary of field_name -> error_message for failed validations

    Examples:
        inputs = {"name": "John", "age": "25"}
        validators = {
            "name": [lambda v: validate_non_empty_input(v, "Name")],
            "age": [lambda v: validate_numeric_range(v, 1, 120, "Age")]
        }
        result = batch_validate_inputs(inputs, validators)
        # Returns {} if all valid, or {"field": "error message"} for errors
    """
    errors = {}

    for field_name, value in inputs.items():
        if field_name not in validators:
            continue

        for validator in validators[field_name]:
            result = validator(value)
            if not result.is_valid:
                errors[field_name] = result.error_message
                break  # Stop at first error for this field

    return errors

def validate_required_fields(inputs: Dict[str, Any],
                           required_fields: List[str]) -> Dict[str, str]:
    """
    Validate that required fields are present and non-empty.

    Args:
        inputs: Dictionary of field values
        required_fields: List of field names that are required

    Returns:
        Dict[str, str]: Dictionary of errors for missing/empty required fields

    Examples:
        inputs = {"name": "John", "email": ""}
        required_fields = ["name", "email", "phone"]
        result = validate_required_fields(inputs, required_fields)
        # Returns {"email": "Email cannot be empty", "phone": "Phone is required"}
    """
    errors = {}

    for field in required_fields:
        if field not in inputs:
            # Format field name nicely for error message
            display_name = field.replace('_', ' ').title()
            errors[field] = f"{display_name} is required"
            continue

        result = validate_non_empty_input(inputs[field], field.replace('_', ' ').title())
        if not result.is_valid:
            errors[field] = result.error_message

    return errors


# ── Specialized Validators ──────────────────────────────────────────────────────────────────────────────────
def validate_choice_selection(value: Any, valid_choices: List[Any],
                            field_name: str = "Field") -> ValidationResult:
    """
    Validate that value is one of the allowed choices.

    Args:
        value: Value to validate
        valid_choices: List of valid choice values
        field_name: Name of field for error message

    Returns:
        ValidationResult: Validation result
    """
    if value not in valid_choices:
        return ValidationResult(
            False,
            f"{field_name} must be one of: {', '.join(map(str, valid_choices))}"
        )

    return ValidationResult(True)

def validate_file_extension(filename: str, allowed_extensions: List[str],
                          field_name: str = "File") -> ValidationResult:
    """
    Validate file has allowed extension.

    Args:
        filename: Filename to validate
        allowed_extensions: List of allowed extensions (with or without dots)
        field_name: Name of field for error message

    Returns:
        ValidationResult: Validation result

    Examples:
        validate_file_extension("image.jpg", [".jpg", ".png"]) -> ValidationResult(True, "")
        validate_file_extension("doc.txt", ["jpg", "png"]) -> ValidationResult(False, "...")
    """
    if not filename:
        return ValidationResult(False, f"{field_name} name cannot be empty")

    # Normalize extensions (ensure they start with dot)
    normalized_extensions = []
    for ext in allowed_extensions:
        if not ext.startswith('.'):
            ext = '.' + ext
        normalized_extensions.append(ext.lower())

    file_ext = None
    if '.' in filename:
        file_ext = '.' + filename.split('.')[-1].lower()

    if file_ext not in normalized_extensions:
        ext_display = ', '.join(normalized_extensions)
        return ValidationResult(
            False,
            f"{field_name} must have one of these extensions: {ext_display}"
        )

    return ValidationResult(True)
