""" app/core/utils/datetime.py

Utility functions for date & time operations.
"""

from datetime import datetime, timezone


def utcnow():
    return datetime.now(timezone.utc)
