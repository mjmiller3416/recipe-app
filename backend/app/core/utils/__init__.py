# File: app/core/utils/__init__.py

# ── Conversion Utilities ─────────────────────────────────────────────────────────────────────
from .conversion_utils import (
    SimpleObject,
    deduplicate_preserve_order,
    dict_to_obj,
    ensure_list,
    extract_numeric_range,
    flatten_dict,
    normalize_dict_keys,
    parse_servings_range,
    safe_bool_conversion,
    safe_float_conversion,
    safe_int_conversion,
    serialize_form_payload,
    split_and_clean)

# ── Date/Time and Singleton Utilities ──────────────────────────────────────────────────────
from .data_time_utils import utcnow

# ── Error Handling Utilities ────────────────────────────────────────────────────────────────
from .error_utils import (
    RepositoryError,
    RetryableError,
    ServiceError,
    create_error_context,
    error_boundary,
    format_exception_details,
    graceful_degradation,
    is_retryable_error,
    log_and_handle_exception,
    retry_on_failure,
    safe_execute_with_fallback,
    wrap_repository_error,
    wrap_service_error)

# ── Format Utilities ────────────────────────────────────────────────────────────────────────
from .format_utils import (
    abbreviate_unit,
    format_quantity,
    format_quantity_and_unit)

# ── Image Utilities ─────────────────────────────────────────────────────────────────────────
from .image_utils import (
    ImageFormat, ImageInfo,
    img_ai_generate_filename,
    img_ai_get_hash,
    img_ai_slugify,
    img_apply_circular_mask,
    img_apply_rounded_mask,
    img_cache_clear,
    img_cache_get,
    img_cache_get_key,
    img_cache_set,
    img_calc_scale_factor,
    img_convert_format,
    img_create_temp_path,
    img_crop_from_scaled_coords,
    img_crop_to_square,
    img_get_info,
    img_get_placeholder,
    img_intersect_bounds, img_qt_apply_round_path,
    img_qt_apply_round_path,
    img_qt_load_safe,
    img_qt_to_pixmap,
    img_resize_to_size,
    img_resolve_path,
    img_save_with_quality,
    img_scale_to_fit,
    img_validate_format,
    img_validate_path)

from .singleton import QSingleton
# ── Text Utilities ──────────────────────────────────────────────────────────────────────────
from .text_utils import (
    camel_to_title_case,
    extract_first_number,
    is_empty_or_whitespace,
    normalize_line_endings,
    safe_split_extract,
    sanitize_form_input,
    sanitize_multiline_input,
    snake_to_title_case,
    text_to_enum_key,
    truncate_with_ellipsis)

# ── Validation Utilities ────────────────────────────────────────────────────────────────────
from .validation_utils import (
    ValidationResult,
    batch_validate_inputs,
    validate_alphanumeric_only,
    validate_choice_selection,
    validate_file_extension,
    validate_max_length,
    validate_min_length,
    validate_non_empty_input,
    validate_numeric_range,
    validate_pattern_match,
    validate_positive_number,
    validate_required_fields)

__all__ = [
    # Conversion
    "SimpleObject",
    "deduplicate_preserve_order",
    "dict_to_obj",
    "ensure_list",
    "extract_numeric_range",
    "flatten_dict",
    "normalize_dict_keys",
    "parse_servings_range",
    "safe_bool_conversion",
    "safe_float_conversion",
    "safe_int_conversion",
    "serialize_form_payload",
    "split_and_clean",
    # Error Handling
    "RepositoryError",
    "RetryableError",
    "ServiceError",
    "create_error_context",
    "error_boundary",
    "format_exception_details",
    "graceful_degradation",
    "is_retryable_error",
    "log_and_handle_exception",
    "retry_on_failure",
    "safe_execute_with_fallback",
    "wrap_repository_error",
    "wrap_service_error",
    # Format
    "abbreviate_unit",
    "format_quantity",
    "format_quantity_and_unit",
    # Image
    "ImageFormat",
    "ImageInfo",
    "img_ai_generate_filename",
    "img_ai_get_hash",
    "img_ai_slugify",
    "img_apply_circular_mask",
    "img_apply_rounded_mask",
    "img_cache_clear",
    "img_cache_get",
    "img_cache_get_key",
    "img_cache_set",
    "img_calc_scale_factor",
    "img_convert_format",
    "img_create_temp_path",
    "img_crop_from_scaled_coords",
    "img_crop_to_square",
    "img_get_info",
    "img_get_placeholder",
    "img_intersect_bounds",
    "img_qt_apply_round_path",
    "img_qt_load_safe",
    "img_qt_to_pixmap",
    "img_resize_to_size",
    "img_resolve_path",
    "img_save_with_quality",
    "img_scale_to_fit",
    "img_validate_format",
    "img_validate_path",
    # Text
    "camel_to_title_case",
    "extract_first_number",
    "extract_numeric_range",
    "is_empty_or_whitespace",
    "normalize_line_endings",
    "safe_split_extract",
    "sanitize_form_input",
    "sanitize_multiline_input",
    "snake_to_title_case",
    "text_to_enum_key",
    "truncate_with_ellipsis",
    # Validation
    "ValidationResult",
    "batch_validate_inputs",
    "validate_alphanumeric_only",
    "validate_choice_selection",
    "validate_file_extension",
    "validate_max_length",
    "validate_min_length",
    "validate_non_empty_input",
    "validate_numeric_range",
    "validate_pattern_match",
    "validate_positive_number",
    "validate_required_fields",
    # Date/Time and Singleton
    "QSingleton",
    "utcnow",
]
