#!/bin/bash
# Cross-platform context router for Recipe App
# Loads appropriate context modules based on file path being edited

# Read hook input from stdin
INPUT=$(cat)

# Parse JSON input
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')
SESSION_ID=$(echo "$INPUT" | jq -r '.session_id // "default"')

# Setup logging
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="$SCRIPT_DIR/hooks.log"

# Early exit for non-source files (performance optimization)
case "$FILE_PATH" in
    # Skip these file types entirely
    *.json|*.md|*.lock|*.log|*.txt|*.yml|*.yaml|*.env*|*.sh)
        exit 0
        ;;
    # Skip these directories
    *node_modules/*|*dist/*|*build/*|*.next/*|*__pycache__/*|*.git/*|*venv/*)
        exit 0
        ;;
esac

# Use cross-platform temp directory
# Windows: $TEMP, macOS/Linux: $TMPDIR or /tmp
if [ -n "$TEMP" ]; then
    MARKER_DIR="$TEMP"
elif [ -n "$TMPDIR" ]; then
    MARKER_DIR="$TMPDIR"
else
    MARKER_DIR="/tmp"
fi

# Define marker file paths
FRONTEND_MARKER="$MARKER_DIR/claude-frontend-context-$SESSION_ID"
BACKEND_MARKER="$MARKER_DIR/claude-backend-context-$SESSION_ID"

# Get project root (assuming script is in .claude/hooks/)
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Initialize context variable
CONTEXT=""

# Helper function to load frontend context modules
load_frontend_context() {
    # ========================================
    # CORE CONTEXT: Load once per session (static, file-independent)
    # ========================================
    if [ ! -f "$FRONTEND_MARKER" ]; then
        touch "$FRONTEND_MARKER" 2>/dev/null || true

        CONTEXT+=$(cat "$PROJECT_ROOT/.claude/context/frontend/frontend-core.md")
        CONTEXT+=$'\n\n'
        CONTEXT+=$(cat "$PROJECT_ROOT/.claude/context/frontend/design-tokens.md")
        CONTEXT+=$'\n\n'
        CONTEXT+=$(cat "$PROJECT_ROOT/.claude/context/frontend/component-inventory.md")
        CONTEXT+=$'\n\n'
    fi

    # ========================================
    # CONDITIONAL CONTEXT: Load on EVERY edit based on file path
    # (Order matters: most specific patterns FIRST)
    # ========================================

    # Accessibility is always relevant for frontend files
    CONTEXT+=$(cat "$PROJECT_ROOT/.claude/context/frontend/accessibility.md")
    CONTEXT+=$'\n\n'

    case "$FILE_PATH" in
        # Forms: Check BEFORE generic .tsx
        *Form.tsx|*forms/*.tsx|*/add/page.tsx|*/edit/*/page.tsx)
            CONTEXT+=$(cat "$PROJECT_ROOT/.claude/context/frontend/form-patterns.md")
            CONTEXT+=$'\n\n'
            ;;

        # Pages/Layouts: Check BEFORE generic .tsx
        *page.tsx|*layout.tsx)
            CONTEXT+=$(cat "$PROJECT_ROOT/.claude/context/frontend/layout-patterns.md")
            CONTEXT+=$'\n\n'
            CONTEXT+=$(cat "$PROJECT_ROOT/.claude/context/frontend/component-patterns.md")
            CONTEXT+=$'\n\n'
            ;;

        # Generic components: Catch-all for .tsx files
        *.tsx)
            CONTEXT+=$(cat "$PROJECT_ROOT/.claude/context/frontend/component-patterns.md")
            CONTEXT+=$'\n\n'
            CONTEXT+=$(cat "$PROJECT_ROOT/.claude/context/frontend/shadcn-patterns.md")
            CONTEXT+=$'\n\n'
            ;;
    esac

    # ========================================
    # NEW FILE creation (file doesn't exist yet)
    # ========================================
    if [ ! -f "$PROJECT_ROOT/$FILE_PATH" ]; then
        CONTEXT+=$(cat "$PROJECT_ROOT/.claude/context/frontend/file-organization.md")
        CONTEXT+=$'\n\n'
    fi

    # Log execution
    echo "[$(date '+%H:%M:%S')] context-router | $(basename "$FILE_PATH") | Frontend context loaded" >> "$LOG_FILE"
}

load_backend_context() {
    # ========================================
    # CORE CONTEXT: Load once per session (static, file-independent)
    # ========================================
    if [ ! -f "$BACKEND_MARKER" ]; then
        touch "$BACKEND_MARKER" 2>/dev/null || true

        CONTEXT+=$(cat "$PROJECT_ROOT/.claude/context/backend/backend-core.md")
        CONTEXT+=$'\n\n'
        CONTEXT+=$(cat "$PROJECT_ROOT/.claude/context/backend/architecture.md")
        CONTEXT+=$'\n\n'
        CONTEXT+=$(cat "$PROJECT_ROOT/.claude/context/backend/architecture-patterns.md")
        CONTEXT+=$'\n\n'
    fi

    # ========================================
    # CONDITIONAL CONTEXT: Load on EVERY edit based on file path
    # ========================================

    # Exceptions context is always relevant for backend files
    CONTEXT+=$(cat "$PROJECT_ROOT/.claude/context/backend/exceptions.md")
    CONTEXT+=$'\n\n'

    case "$FILE_PATH" in
        */models/*.py)
            CONTEXT+=$(cat "$PROJECT_ROOT/.claude/context/backend/models.md")
            CONTEXT+=$'\n\n'
            CONTEXT+=$(cat "$PROJECT_ROOT/.claude/context/backend/dtos.md")
            CONTEXT+=$'\n\n'
            ;;

        */services/*.py|*/services/*/*.py)
            CONTEXT+=$(cat "$PROJECT_ROOT/.claude/context/backend/services.md")
            CONTEXT+=$'\n\n'
            CONTEXT+=$(cat "$PROJECT_ROOT/.claude/context/backend/repositories.md")
            CONTEXT+=$'\n\n'
            CONTEXT+=$(cat "$PROJECT_ROOT/.claude/context/backend/dtos.md")
            CONTEXT+=$'\n\n'
            ;;

        */repositories/*.py)
            CONTEXT+=$(cat "$PROJECT_ROOT/.claude/context/backend/repositories.md")
            CONTEXT+=$'\n\n'
            CONTEXT+=$(cat "$PROJECT_ROOT/.claude/context/backend/models.md")
            CONTEXT+=$'\n\n'
            ;;

        */api/*.py)
            CONTEXT+=$(cat "$PROJECT_ROOT/.claude/context/backend/routes.md")
            CONTEXT+=$'\n\n'
            CONTEXT+=$(cat "$PROJECT_ROOT/.claude/context/backend/dtos.md")
            CONTEXT+=$'\n\n'
            ;;

        */dtos/*.py)
            CONTEXT+=$(cat "$PROJECT_ROOT/.claude/context/backend/dtos.md")
            CONTEXT+=$'\n\n'
            CONTEXT+=$(cat "$PROJECT_ROOT/.claude/context/backend/models.md")
            CONTEXT+=$'\n\n'
            ;;

        */migrations/*.py)
            CONTEXT+=$(cat "$PROJECT_ROOT/.claude/context/backend/migrations.md")
            CONTEXT+=$'\n\n'
            CONTEXT+=$(cat "$PROJECT_ROOT/.claude/context/backend/models.md")
            CONTEXT+=$'\n\n'
            ;;
    esac

    # Log execution
    echo "[$(date '+%H:%M:%S')] context-router | $(basename "$FILE_PATH") | Backend context loaded" >> "$LOG_FILE"
}

# Route based on file path
# Handle both forward slashes (Unix/Git) and backslashes (Windows)
if [[ "$FILE_PATH" == *"frontend/src"* ]] || [[ "$FILE_PATH" == *"frontend\\src"* ]]; then
    load_frontend_context
elif [[ "$FILE_PATH" == *"backend/app"* ]] || [[ "$FILE_PATH" == *"backend\\app"* ]]; then
    load_backend_context
fi

# Output JSON with additionalContext if we loaded anything
if [ -n "$CONTEXT" ]; then
    # Determine which context was loaded for the message
    if [[ "$FILE_PATH" == *"frontend"* ]]; then
        CONTEXT_TYPE="Frontend"
        BADGE_MESSAGE="
╔══════════════════════════════════════════════════════════════════╗
║  ✅ FRONTEND CONTEXT LOADED - $(basename "$FILE_PATH")
╠══════════════════════════════════════════════════════════════════╣
║  Active Rules:                                                   ║
║    • Use semantic tokens (text-muted-foreground, NOT gray-500)   ║
║    • shadcn components only (NO raw divs)                        ║
║    • Tailwind scale (h-10, NOT h-[38px])                         ║
║    • Icon buttons MUST have aria-label                           ║
║    • Icons from lucide-react with strokeWidth={1.5}              ║
╚══════════════════════════════════════════════════════════════════╝
"
    else
        CONTEXT_TYPE="Backend"
        BADGE_MESSAGE="
╔══════════════════════════════════════════════════════════════════╗
║  ✅ BACKEND CONTEXT LOADED - $(basename "$FILE_PATH")
╠══════════════════════════════════════════════════════════════════╣
║  Active Rules:                                                   ║
║    • Services commit/rollback, Repositories ONLY flush           ║
║    • Domain exceptions in services (NOT HTTPException)           ║
║    • All signatures MUST have type hints                         ║
║    • Follow layers: Routes → Services → Repos → Models           ║
╚══════════════════════════════════════════════════════════════════╝
"
    fi

    # Use jq to create properly escaped JSON with badge-style message
    jq -n --arg ctx "$CONTEXT" --arg msg "$BADGE_MESSAGE" '{
        systemMessage: $msg,
        hookSpecificOutput: {
            hookEventName: "PreToolUse",
            additionalContext: $ctx
        }
    }'
fi

exit 0
