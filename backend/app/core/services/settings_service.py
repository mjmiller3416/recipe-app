"""app/core/services/settings_service.py

Service for managing application settings and updating configurations.
"""

# ── Imports ─────────────────────────────────────────────────────────────────────────────────────────────────
from __future__ import annotations
import json
from pathlib import Path
from typing import Any, Dict, Optional

from _dev_tools import DebugLogger
from app.config import AppPaths
from ..utils import QSingleton


class SettingsService(QSingleton):
    """Service for managing application settings with default and user override support."""

    def __init__(self):
        super().__init__()
        self.default_settings_file = AppPaths.CONFIG_DIR / "default_settings.json"
        self.user_settings_file = AppPaths.USER_DATA_DIR / "user_settings.json"
        self._settings: Dict[str, Any] = {}
        self._load_settings()

    @classmethod
    def _get_instance(cls):
        """Get the singleton instance, creating it if necessary."""
        if cls not in cls._instances:
            cls._instances[cls] = cls()
        return cls._instances[cls]

    def _load_settings(self) -> None:
        """Load settings from default and user files, merging them together."""
        try:
            # Load default settings
            defaults = self._load_json_file(self.default_settings_file)
            if not defaults:
                DebugLogger.log("No default settings found, creating empty defaults", "warning")
                defaults = {}

            # Load user settings (if they exist)
            user_overrides = {}
            if self.user_settings_file.exists():
                user_overrides = self._load_json_file(self.user_settings_file) or {}

            # Merge defaults with user overrides
            self._settings = self._merge_dicts(defaults, user_overrides)
            DebugLogger.log("Settings loaded successfully", "info")

        except Exception as e:
            DebugLogger.log(f"Error loading settings: {e}", "error")
            self._settings = {}

    def _load_json_file(self, file_path: Path) -> Optional[Dict[str, Any]]:
        """Load JSON data from a file."""
        try:
            if not file_path.exists():
                return None

            with open(file_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            DebugLogger.log(f"Error loading JSON file {file_path}: {e}", "error")
            return None

    def _merge_dicts(self, default: Dict[str, Any], override: Dict[str, Any]) -> Dict[str, Any]:
        """Recursively merge two dictionaries, with override values taking precedence."""
        result = default.copy()
        for key, value in override.items():
            if key in result and isinstance(result[key], dict) and isinstance(value, dict):
                result[key] = self._merge_dicts(result[key], value)
            else:
                result[key] = value
        return result

    def _save_user_settings(self) -> bool:
        """Save current settings to user settings file."""
        try:
            # Ensure the directory exists
            self.user_settings_file.parent.mkdir(parents=True, exist_ok=True)

            with open(self.user_settings_file, 'w', encoding='utf-8') as f:
                json.dump(self._settings, f, indent=2, ensure_ascii=False)

            DebugLogger.log("User settings saved successfully", "info")
            return True
        except Exception as e:
            DebugLogger.log(f"Error saving user settings: {e}", "error")
            return False

    def get(self, key_path: str, default=None) -> Any:
        """Get a setting value using dot notation (e.g., 'user.username')."""
        keys = key_path.split('.')
        value = self._settings

        for key in keys:
            if isinstance(value, dict) and key in value:
                value = value[key]
            else:
                return default

        return value

    def set(self, key_path: str, value: Any) -> bool:
        """Set a setting value using dot notation (e.g., 'user.username')."""
        keys = key_path.split('.')
        target = self._settings

        # Navigate to the parent of the target key
        for key in keys[:-1]:
            if key not in target:
                target[key] = {}
            elif not isinstance(target[key], dict):
                target[key] = {}
            target = target[key]

        # Set the final value
        target[keys[-1]] = value
        return self._save_user_settings()

    def get_category(self, category: str) -> Dict[str, Any]:
        """Get all settings for a specific category."""
        return self._settings.get(category, {})

    def set_category(self, category: str, values: Dict[str, Any]) -> bool:
        """Set all values for a specific category."""
        self._settings[category] = values
        return self._save_user_settings()

    def reset_to_defaults(self, category: Optional[str] = None) -> bool:
        """Reset settings to defaults. If category is specified, only reset that category."""
        try:
            defaults = self._load_json_file(self.default_settings_file)
            if not defaults:
                DebugLogger.log("No default settings to reset to", "error")
                return False

            if category:
                if category in defaults:
                    self._settings[category] = defaults[category].copy()
                    DebugLogger.log(f"Reset {category} settings to defaults", "info")
                else:
                    DebugLogger.log(f"Category {category} not found in defaults", "warning")
                    return False
            else:
                self._settings = defaults.copy()
                DebugLogger.log("Reset all settings to defaults", "info")

            return self._save_user_settings()
        except Exception as e:
            DebugLogger.log(f"Error resetting settings: {e}", "error")
            return False

    def reload(self) -> None:
        """Reload settings from files."""
        self._load_settings()
