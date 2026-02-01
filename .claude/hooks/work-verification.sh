#!/bin/bash
# Work verification hook for Stop event
# Verifies work is complete before Claude stops

# Read hook input from stdin
INPUT=$(cat)

# Parse JSON input
STOP_HOOK_ACTIVE=$(echo "$INPUT" | jq -r '.stop_hook_active // "false"')

# Guard against infinite loops - if hook already ran, allow stop
if [ "$STOP_HOOK_ACTIVE" = "true" ]; then
    echo '{"ok": true}'
    exit 0
fi

# Get project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "🔍 Verifying work completion..."
echo ""

ISSUES=0

# Check for uncommitted changes
cd "$PROJECT_ROOT"
if ! git diff --quiet 2>/dev/null || ! git diff --cached --quiet 2>/dev/null; then
    UNCOMMITTED=$(git status --short 2>/dev/null | wc -l)
    if [ "$UNCOMMITTED" -gt 0 ]; then
        echo "⚠️  Found $UNCOMMITTED uncommitted change(s)"
        echo ""
        git status --short
        echo ""
        echo "Consider committing your changes before stopping."
        ISSUES=$((ISSUES + 1))
    fi
fi

# Check for untracked files that might be important
UNTRACKED=$(git ls-files --others --exclude-standard 2>/dev/null | grep -v "node_modules\|venv\|__pycache__\|\.pyc$\|\.log$" | wc -l)
if [ "$UNTRACKED" -gt 0 ]; then
    echo "⚠️  Found $UNTRACKED untracked file(s) (excluding common ignores)"
    ISSUES=$((ISSUES + 1))
fi

# Summary
if [ $ISSUES -eq 0 ]; then
    echo "✅ Work verification passed"
    echo '{"ok": true}'
else
    echo ""
    echo "⚠️  Work may be incomplete. Continue anyway? (hook will allow)"
    echo '{"ok": true, "warnings": '$ISSUES'}'
fi

exit 0