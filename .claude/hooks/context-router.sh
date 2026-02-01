#!/bin/bash
# Cross-platform context router for Recipe App
# Loads appropriate context modules based on file path being edited

# Read hook input from stdin
INPUT=$(cat)

# Parse JSON input
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')
SESSION_ID=$(echo "$INPUT" | jq -r '.session_id // "default"')

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
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Helper function to load context modules
load_frontend_context() {
    if [ -f "$FRONTEND_MARKER" ]; then
        return 0
    fi
    touch "$FRONTEND_MARKER" 2>/dev/null || true

    echo "📦 Loading Frontend Context Modules"
    echo ""

    # ========================================
    # ALWAYS LOAD (core context for ALL frontend files)
    # ========================================
    cat "$PROJECT_ROOT/.claude/context/frontend/frontend-core.md"
    echo ""
    cat "$PROJECT_ROOT/.claude/context/frontend/design-tokens.md"
    echo ""
    cat "$PROJECT_ROOT/.claude/context/frontend/accessibility.md"
    echo ""

    # ========================================
    # CONDITIONALLY LOAD based on file path
    # (Order matters: most specific patterns FIRST)
    # ========================================
    case "$FILE_PATH" in
        # Forms: Check BEFORE generic .tsx
        *Form.tsx|*forms/*.tsx|*/add/page.tsx|*/edit/*/page.tsx)
            echo "📝 Loading form patterns..."
            cat "$PROJECT_ROOT/.claude/context/frontend/form-patterns.md"
            echo ""
            ;;

        # Pages/Layouts: Check BEFORE generic .tsx
        *page.tsx|*layout.tsx)
            echo "📐 Loading layout patterns..."
            cat "$PROJECT_ROOT/.claude/context/frontend/layout-patterns.md"
            echo ""
            cat "$PROJECT_ROOT/.claude/context/frontend/component-patterns.md"
            echo ""
            ;;

        # Generic components: Catch-all for .tsx files
        *.tsx)
            echo "🧩 Loading component patterns..."
            cat "$PROJECT_ROOT/.claude/context/frontend/component-patterns.md"
            echo ""
            cat "$PROJECT_ROOT/.claude/context/frontend/shadcn-patterns.md"
            echo ""
            ;;
    esac

    # ========================================
    # NEW FILE creation (file doesn't exist yet)
    # ========================================
    if [ ! -f "$PROJECT_ROOT/$FILE_PATH" ]; then
        echo "📁 Loading file organization (new file)..."
        cat "$PROJECT_ROOT/.claude/context/frontend/file-organization.md"
        echo ""
    fi

    echo "✅ Frontend context loaded for session $SESSION_ID"
    echo ""
}

load_backend_context() {
    if [ -f "$BACKEND_MARKER" ]; then
        return 0
    fi
    touch "$BACKEND_MARKER" 2>/dev/null || true

    echo "📦 Loading Backend Context Modules"
    echo ""

    # ========================================
    # ALWAYS LOAD (core + cross-cutting concerns)
    # ========================================
    cat "$PROJECT_ROOT/.claude/context/backend/backend-core.md"
    echo ""
    cat "$PROJECT_ROOT/.claude/context/backend/architecture.md"
    echo ""
    cat "$PROJECT_ROOT/.claude/context/backend/exceptions.md"
    echo ""

    # ========================================
    # CONDITIONALLY LOAD based on file path
    # Load related modules (files have dependencies)
    # ========================================
    case "$FILE_PATH" in
        */models/*.py)
            echo "🗄️ Loading models + DTOs..."
            cat "$PROJECT_ROOT/.claude/context/backend/models.md"
            echo ""
            cat "$PROJECT_ROOT/.claude/context/backend/dtos.md"
            echo ""
            ;;

        */services/*.py)
            echo "⚙️ Loading services + repos + DTOs..."
            cat "$PROJECT_ROOT/.claude/context/backend/services.md"
            echo ""
            cat "$PROJECT_ROOT/.claude/context/backend/repositories.md"
            echo ""
            cat "$PROJECT_ROOT/.claude/context/backend/dtos.md"
            echo ""
            ;;

        */repositories/*.py)
            echo "📂 Loading repositories + models..."
            cat "$PROJECT_ROOT/.claude/context/backend/repositories.md"
            echo ""
            cat "$PROJECT_ROOT/.claude/context/backend/models.md"
            echo ""
            ;;

        */api/*.py)
            echo "🛣️ Loading routes + DTOs..."
            cat "$PROJECT_ROOT/.claude/context/backend/routes.md"
            echo ""
            cat "$PROJECT_ROOT/.claude/context/backend/dtos.md"
            echo ""
            ;;

        */dtos/*.py)
            echo "📋 Loading DTOs + models..."
            cat "$PROJECT_ROOT/.claude/context/backend/dtos.md"
            echo ""
            cat "$PROJECT_ROOT/.claude/context/backend/models.md"
            echo ""
            ;;

        */migrations/*.py)
            echo "🔄 Loading migrations + models..."
            cat "$PROJECT_ROOT/.claude/context/backend/migrations.md"
            echo ""
            cat "$PROJECT_ROOT/.claude/context/backend/models.md"
            echo ""
            ;;
    esac

    echo "✅ Backend context loaded for session $SESSION_ID"
    echo ""
}

# Route based on file path
if [[ "$FILE_PATH" == *"frontend/src"* ]]; then
    load_frontend_context
elif [[ "$FILE_PATH" == *"backend/app"* ]]; then
    load_backend_context
fi

# Always exit successfully
exit 0
