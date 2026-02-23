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
    BRANCH=$(git branch --show-current  || echo "N/A")
    echo "📋 Active branch: $BRANCH"
    echo "📂 Project: Recipe App (Next.js 16 + FastAPI)"
    echo ""

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

    # Output with badge-style systemMessage + additionalContext
    jq -n --arg ctx "$COMBINED_CONTEXT" --arg branch "$BRANCH" '{
        systemMessage: "
╔══════════════════════════════════════════════════════════════════╗
║  🔄 CONTEXT RESTORED AFTER COMPACTION                            ║
╠══════════════════════════════════════════════════════════════════╣
║  📋 Active branch: \($branch)                                    ║
║  📂 Project: Recipe App (Next.js 16 + FastAPI)                   ║
║                                                                  ║
║  🚨 CRITICAL RULES RE-LOADED (enforce for remainder of session): ║
║                                                                  ║
║  Frontend:                                                       ║
║    ✓ Use semantic tokens (text-muted-foreground, NOT gray-500)  ║
║    ✓ shadcn components only (NO raw divs with bg-card)          ║
║    ✓ Tailwind scale (h-10, NOT h-[38px])                        ║
║    ✓ Icon buttons MUST have aria-label                          ║
║    ✓ Icons from lucide-react with strokeWidth={1.5}             ║
║                                                                  ║
║  Backend:                                                        ║
║    ✓ Services commit/rollback transactions                      ║
║    ✓ Repositories ONLY flush (NEVER commit)                     ║
║    ✓ Domain exceptions in services (NOT HTTPException)          ║
║    ✓ All signatures MUST have type hints                        ║
║    ✓ Follow layers: Routes → Services → Repos → Models          ║
║                                                                  ║
║  ⚡ Full context modules reloaded (frontend + backend core)      ║
╚══════════════════════════════════════════════════════════════════╝
",
        hookSpecificOutput: {
            hookEventName: "SessionStart",
            additionalContext: $ctx
        }
    }'
fi

exit 0
