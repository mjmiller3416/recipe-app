#!/bin/bash
# Session initialization hook
# Re-injects critical context after compaction or session resume

# Read hook input from stdin
INPUT=$(cat)

# Parse JSON input
SOURCE=$(echo "$INPUT" | jq -r '.source // "unknown"')

# Only run on compaction (to re-inject context)
if [ "$SOURCE" = "compact" ]; then
    # Get git branch (if in a git repo)
    BRANCH=$(git branch --show-current || echo "N/A")

    # Get project root (assuming script is in .claude/hooks/)
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

    # ========================================
    # RELOAD FULL CONTEXT MODULES
    # ========================================

    # Build combined context from critical modules
    FRONTEND_CONTEXT=""
    FRONTEND_CONTEXT+=$(cat "$PROJECT_ROOT/.claude/context/frontend/frontend-core.md")
    FRONTEND_CONTEXT+=$'\n\n'
    FRONTEND_CONTEXT+=$(cat "$PROJECT_ROOT/.claude/context/frontend/design-tokens.md")
    FRONTEND_CONTEXT+=$'\n\n'
    FRONTEND_CONTEXT+=$(cat "$PROJECT_ROOT/.claude/context/frontend/accessibility.md")
    FRONTEND_CONTEXT+=$'\n\n'
    FRONTEND_CONTEXT+=$(cat "$PROJECT_ROOT/.claude/context/frontend/component-inventory.md")

    BACKEND_CONTEXT=""
    BACKEND_CONTEXT+=$(cat "$PROJECT_ROOT/.claude/context/backend/backend-core.md")
    BACKEND_CONTEXT+=$'\n\n'
    BACKEND_CONTEXT+=$(cat "$PROJECT_ROOT/.claude/context/backend/architecture.md")
    BACKEND_CONTEXT+=$'\n\n'
    BACKEND_CONTEXT+=$(cat "$PROJECT_ROOT/.claude/context/backend/exceptions.md")

    COMBINED_CONTEXT="$FRONTEND_CONTEXT"$'\n\n'"$BACKEND_CONTEXT"

    # Output minimal status + reloaded context modules (CLAUDE.md is
    # already re-injected by the harness on compaction — no need to
    # restate its rules here, just the deeper module content it doesn't carry)
    jq -n --arg ctx "$COMBINED_CONTEXT" --arg branch "$BRANCH" '{
        systemMessage: "🔄 Context modules reloaded after compaction (branch: \($branch))",
        hookSpecificOutput: {
            hookEventName: "SessionStart",
            additionalContext: $ctx
        }
    }'
fi

exit 0
