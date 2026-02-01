#!/bin/bash
# Session initialization hook
# Re-injects critical context after compaction or session resume

# Read hook input from stdin
INPUT=$(cat)

# Parse JSON input
SOURCE=$(echo "$INPUT" | jq -r '.source // "unknown"')

# Only run on compaction (to re-inject context)
if [ "$SOURCE" = "compact" ]; then
    echo "🔄 Context refreshed after compaction"
    echo ""

    # Get git branch (if in a git repo)
    BRANCH=$(git branch --show-current 2>/dev/null || echo "N/A")
    echo "📋 Active branch: $BRANCH"
    echo "📂 Project: Recipe App (Next.js 16 + FastAPI)"
    echo ""

    # Get project root (assuming script is in .claude/hooks/)
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

    # ========================================
    # RELOAD FULL CONTEXT MODULES
    # ========================================
    echo "⚡ Reloading Core Context:"
    echo ""

    # Frontend context (always load)
    echo "# FRONTEND CONTEXT"
    echo ""
    cat "$PROJECT_ROOT/.claude/context/frontend/frontend-core.md"
    echo ""
    cat "$PROJECT_ROOT/.claude/context/frontend/design-tokens.md"
    echo ""
    cat "$PROJECT_ROOT/.claude/context/frontend/accessibility.md"
    echo ""
    cat "$PROJECT_ROOT/.claude/context/frontend/component-inventory.md"
    echo ""

    # Backend context (always load)
    echo "# BACKEND CONTEXT"
    echo ""
    cat "$PROJECT_ROOT/.claude/context/backend/backend-core.md"
    echo ""
    cat "$PROJECT_ROOT/.claude/context/backend/architecture.md"
    echo ""
    cat "$PROJECT_ROOT/.claude/context/backend/exceptions.md"
    echo ""
    cat "$PROJECT_ROOT/.claude/context/backend/architecture-patterns.md"
    echo ""

    echo "✅ Full context reloaded after compaction"
    echo ""
fi

exit 0
