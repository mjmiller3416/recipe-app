"""app/core/utils/singleton_mixin.py

Provides a mixin for creating singleton classes.
"""

from PySide6.QtCore import QObject


# ── Singleton Mixin ─────────────────────────────────────────────────────────────────────────────────────────
class QSingleton(QObject):
    """A singleton base class for QObject-derived classes."""
    _instances = {}

    def __new__(cls, *args, **kwargs):
        if cls not in cls._instances:
            instance = super().__new__(cls)
            cls._instances[cls] = instance
        return cls._instances[cls]

    def __init__(self, *args, **kwargs):
        # Prevent re-initialization
        if hasattr(self, '_initialized'):
            return
        super().__init__(*args, **kwargs)
        self._initialized = True
