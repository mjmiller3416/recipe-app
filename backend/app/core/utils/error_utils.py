"""app/core/utils/error_utils.py

Standardized error handling utilities for consistent error management.

# ── Internal Index ──────────────────────────────────────────────────────────────────────
#
# ── Error Logging & Handling ────────────────────────────────────────────────────────────
# log_and_handle_exception()    -> Log exception with context
# safe_execute_with_fallback()  -> Execute with error handling
# create_error_context()        -> Create error context info
#
# ── Exception Wrapping ──────────────────────────────────────────────────────────────────
# wrap_service_error()          -> Wrap service layer errors
# wrap_repository_error()       -> Wrap repository layer errors
# format_exception_details()    -> Format exception for logging
#
# ── Retry Logic ─────────────────────────────────────────────────────────────────────────
# retry_on_failure()            -> Retry function with exponential backoff
# is_retryable_error()          -> Check if error should be retried
#
# ── Error Recovery ──────────────────────────────────────────────────────────────────────
# graceful_degradation()        -> Provide fallback functionality
# error_boundary()              -> Decorator for error boundaries

"""

# ── Imports ──────────────────────────────────────────────────────────────────────────────────
from __future__ import annotations

import functools
import time
import traceback
from contextlib import contextmanager
from typing import Any, Callable, Dict, Optional

__all__ = [
    # Error Logging & Handling
    'log_and_handle_exception', 'safe_execute_with_fallback', 'create_error_context',

    # Exception Wrapping
    'wrap_service_error', 'wrap_repository_error', 'format_exception_details',

    # Retry Logic
    'retry_on_failure', 'is_retryable_error',

    # Error Recovery
    'graceful_degradation', 'error_boundary',
]


# ── Error Types ──────────────────────────────────────────────────────────────────────────────
class ServiceError(Exception):
    """Base exception for service layer errors."""

    def __init__(self, message: str, original_error: Optional[Exception] = None, context: Optional[Dict] = None):
        super().__init__(message)
        self.original_error = original_error
        self.context = context or {}

class RepositoryError(Exception):
    """Base exception for repository layer errors."""

    def __init__(self, message: str, original_error: Optional[Exception] = None, context: Optional[Dict] = None):
        super().__init__(message)
        self.original_error = original_error
        self.context = context or {}

class RetryableError(Exception):
    """Exception that indicates the operation should be retried."""
    pass


# ── Error Logging & Handling ─────────────────────────────────────────────────────────────────
def log_and_handle_exception(
    operation_name: str,
    exception: Exception,
    logger_func: Optional[Callable[[str, str], None]] = None,
    context: Optional[Dict[str, Any]] = None,
    fallback_value: Any = None
) -> Any:
    """
    Log exception with context and return fallback value.

    Args:
        operation_name: Name of the operation that failed
        exception: The exception that occurred
        logger_func: Optional logging function (message, level)
        context: Additional context information
        fallback_value: Value to return on error

    Returns:
        Any: The fallback value

    Examples:
        result = log_and_handle_exception(
            "user_lookup",
            e,
            logger.log,
            {"user_id": 123},
            fallback_value=None
        )
    """
    error_details = format_exception_details(exception, context)
    error_message = f"Error in {operation_name}: {error_details}"

    # Use provided logger or try to import DebugLogger as fallback
    if logger_func:
        logger_func(error_message, "error")
    else:
        try:
            from _dev_tools import DebugLogger
            DebugLogger.log(error_message, "error")
        except ImportError:
            # Fallback to print if no logger available
            print(f"ERROR: {error_message}")

    return fallback_value

def safe_execute_with_fallback(
    operation: Callable[..., Any],
    fallback: Any,
    error_context: str,
    logger_func: Optional[Callable[[str, str], None]] = None,
    *args,
    **kwargs
) -> Any:
    """
    Execute operation safely with fallback on error.

    Args:
        operation: Function to execute
        fallback: Value to return on error
        error_context: Context description for logging
        logger_func: Optional logging function
        *args: Arguments for operation
        **kwargs: Keyword arguments for operation

    Returns:
        Any: Operation result or fallback value

    Examples:
        result = safe_execute_with_fallback(
            lambda: risky_operation(param),
            fallback=[],
            "fetching_user_data"
        )
    """
    try:
        return operation(*args, **kwargs)
    except Exception as e:
        return log_and_handle_exception(
            error_context,
            e,
            logger_func,
            {"args": args, "kwargs": kwargs},
            fallback
        )

def create_error_context(
    operation: str,
    parameters: Optional[Dict[str, Any]] = None,
    user_context: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Create standardized error context information.

    Args:
        operation: Name of the operation
        parameters: Operation parameters
        user_context: User/session context

    Returns:
        Dict[str, Any]: Error context dictionary
    """
    context = {
        "operation": operation,
        "timestamp": time.time(),
        "parameters": parameters or {},
        "user_context": user_context or {},
    }

    return context


# ── Exception Wrapping ───────────────────────────────────────────────────────────────────────
def wrap_service_error(
    operation: str,
    original_error: Exception,
    context: Optional[Dict[str, Any]] = None
) -> ServiceError:
    """
    Wrap exception as ServiceError with context.

    Args:
        operation: Operation that failed
        original_error: Original exception
        context: Additional context

    Returns:
        ServiceError: Wrapped service error

    Examples:
        try:
            service_operation()
        except Exception as e:
            raise wrap_service_error("user_creation", e, {"user_id": 123})
    """
    message = f"Service operation '{operation}' failed: {str(original_error)}"
    return ServiceError(message, original_error, context)

def wrap_repository_error(
    operation: str,
    original_error: Exception,
    context: Optional[Dict[str, Any]] = None
) -> RepositoryError:
    """
    Wrap exception as RepositoryError with context.

    Args:
        operation: Repository operation that failed
        original_error: Original exception
        context: Additional context

    Returns:
        RepositoryError: Wrapped repository error

    Examples:
        try:
            db_operation()
        except Exception as e:
            raise wrap_repository_error("recipe_fetch", e, {"recipe_id": 456})
    """
    message = f"Repository operation '{operation}' failed: {str(original_error)}"
    return RepositoryError(message, original_error, context)

def format_exception_details(
    exception: Exception,
    context: Optional[Dict[str, Any]] = None
) -> str:
    """
    Format exception details for logging.

    Args:
        exception: Exception to format
        context: Additional context information

    Returns:
        str: Formatted exception details
    """
    details = [
        f"Type: {type(exception).__name__}",
        f"Message: {str(exception)}",
    ]

    if context:
        details.append(f"Context: {context}")

    # Add traceback for debugging (first few lines)
    try:
        tb_lines = traceback.format_exception(type(exception), exception, exception.__traceback__)
        if tb_lines and len(tb_lines) > 1:
            # Include the last meaningful line of traceback
            relevant_lines = [line.strip() for line in tb_lines[-3:] if line.strip()]
            if relevant_lines:
                details.append(f"Traceback: {' | '.join(relevant_lines)}")
    except Exception:
        # Don't let traceback formatting errors break error handling
        pass

    return " | ".join(details)


# ── Retry Logic ──────────────────────────────────────────────────────────────────────────────
def retry_on_failure(
    max_attempts: int = 3,
    delay: float = 1.0,
    backoff: float = 2.0,
    exceptions: tuple = (Exception,),
    logger_func: Optional[Callable[[str, str], None]] = None
):
    """
    Decorator to retry function on failure with exponential backoff.

    Args:
        max_attempts: Maximum number of retry attempts
        delay: Initial delay between retries (seconds)
        backoff: Multiplier for delay on each retry
        exceptions: Tuple of exceptions to catch and retry
        logger_func: Optional logging function

    Returns:
        Decorator function

    Examples:
        @retry_on_failure(max_attempts=3, delay=1.0)
        def unreliable_operation():
            # ... potentially failing operation
            pass
    """
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            last_exception = None
            current_delay = delay

            for attempt in range(max_attempts):
                try:
                    return func(*args, **kwargs)
                except exceptions as e:
                    last_exception = e

                    if attempt < max_attempts - 1:  # Don't delay after final attempt
                        if logger_func:
                            logger_func(
                                f"Attempt {attempt + 1} failed for {func.__name__}: {str(e)}. "
                                f"Retrying in {current_delay}s...",
                                "warning"
                            )

                        time.sleep(current_delay)
                        current_delay *= backoff
                    else:
                        if logger_func:
                            logger_func(
                                f"All {max_attempts} attempts failed for {func.__name__}: {str(e)}",
                                "error"
                            )

            # Re-raise the last exception if all attempts failed
            raise last_exception

        return wrapper
    return decorator

def is_retryable_error(exception: Exception) -> bool:
    """
    Determine if an error should be retried.

    Args:
        exception: Exception to check

    Returns:
        bool: True if error should be retried

    Examples:
        if is_retryable_error(e):
            # Retry the operation
            pass
    """
    # Retryable error types
    retryable_types = (
        RetryableError,
        ConnectionError,
        TimeoutError,
    )

    if isinstance(exception, retryable_types):
        return True

    # Check for specific error messages that indicate retryable conditions
    error_msg = str(exception).lower()
    retryable_messages = [
        'connection',
        'timeout',
        'temporary',
        'retry',
        'network',
        'unavailable',
    ]

    return any(msg in error_msg for msg in retryable_messages)


# ── Error Recovery ───────────────────────────────────────────────────────────────────────────
@contextmanager
def graceful_degradation(fallback_value: Any = None, logger_func: Optional[Callable[[str, str], None]] = None):
    """
    Context manager for graceful degradation on errors.

    Args:
        fallback_value: Value to return on error
        logger_func: Optional logging function

    Yields:
        Any: Context manager that handles errors gracefully

    Examples:
        with graceful_degradation(fallback_value=[]):
            risky_operation()
        # Returns [] if risky_operation fails
    """
    try:
        yield
    except Exception as e:
        if logger_func:
            logger_func(f"Graceful degradation activated: {str(e)}", "warning")
        else:
            try:
                from _dev_tools import DebugLogger
                DebugLogger.log(f"Graceful degradation activated: {str(e)}", "warning")
            except ImportError:
                pass

        return fallback_value

def error_boundary(
    fallback: Any = None,
    exceptions: tuple = (Exception,),
    logger_func: Optional[Callable[[str, str], None]] = None,
    reraise: bool = False
):
    """
    Decorator that creates an error boundary around a function.

    Args:
        fallback: Value to return on error
        exceptions: Tuple of exceptions to catch
        logger_func: Optional logging function
        reraise: Whether to re-raise the exception after handling

    Returns:
        Decorator function

    Examples:
        @error_boundary(fallback=[], exceptions=(ValueError, TypeError))
        def risky_function():
            # ... potentially failing operation
            pass
    """
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            try:
                return func(*args, **kwargs)
            except exceptions as e:
                error_context = create_error_context(
                    func.__name__,
                    {"args": args, "kwargs": kwargs}
                )

                log_and_handle_exception(
                    f"error_boundary:{func.__name__}",
                    e,
                    logger_func,
                    error_context
                )

                if reraise:
                    raise

                return fallback

        return wrapper
    return decorator
