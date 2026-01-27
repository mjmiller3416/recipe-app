#!/usr/bin/env python3
"""
Toggle authentication mode for local testing.

Usage:
    python scripts/toggle_auth.py        # Show current mode
    python scripts/toggle_auth.py dev    # Enable dev mode (no auth)
    python scripts/toggle_auth.py prod   # Enable prod mode (real auth)
"""

import sys
from pathlib import Path

ENV_FILE = Path(__file__).parent.parent / ".env"

def get_current_mode() -> str:
    """Read current AUTH_DISABLED value."""
    if not ENV_FILE.exists():
        return "unknown"

    content = ENV_FILE.read_text()
    for line in content.splitlines():
        if line.startswith("AUTH_DISABLED="):
            value = line.split("=", 1)[1].strip().lower()
            return "dev" if value == "true" else "prod"
    return "prod"  # Default if not set

def set_mode(mode: str) -> None:
    """Set AUTH_DISABLED in .env file."""
    if not ENV_FILE.exists():
        print(f"Error: {ENV_FILE} not found")
        sys.exit(1)

    content = ENV_FILE.read_text()
    lines = content.splitlines()
    new_value = "true" if mode == "dev" else "false"

    found = False
    for i, line in enumerate(lines):
        if line.startswith("AUTH_DISABLED="):
            lines[i] = f"AUTH_DISABLED={new_value}"
            found = True
            break

    if not found:
        # Add after the comment block
        for i, line in enumerate(lines):
            if "Clerk Authentication" in line:
                lines.insert(i + 2, f"AUTH_DISABLED={new_value}")
                found = True
                break

    ENV_FILE.write_text("\n".join(lines) + "\n")
    print(f"✓ Switched to {mode.upper()} mode (AUTH_DISABLED={new_value})")
    print(f"  Restart the backend server for changes to take effect.")

def main():
    if len(sys.argv) == 1:
        mode = get_current_mode()
        print(f"Current mode: {mode.upper()}")
        print(f"\nUsage:")
        print(f"  python scripts/toggle_auth.py dev   # Bypass auth (fast local dev)")
        print(f"  python scripts/toggle_auth.py prod  # Real auth (test like production)")
        return

    mode = sys.argv[1].lower()
    if mode not in ("dev", "prod"):
        print(f"Error: Mode must be 'dev' or 'prod', got '{mode}'")
        sys.exit(1)

    set_mode(mode)

if __name__ == "__main__":
    main()
