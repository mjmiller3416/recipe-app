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

    echo "⚡ Critical Reminders:"
    echo ""
    echo "Frontend:"
    echo "  • Use shadcn components, semantic tokens, no arbitrary values"
    echo "  • Icon buttons need aria-label"
    echo "  • Loading states required for async actions"
    echo ""
    echo "Backend:"
    echo "  • Services commit, repositories flush only"
    echo "  • Use domain exceptions (never raise HTTPException in services)"
    echo "  • Always use DTOs for request/response"
    echo ""
    echo "Git:"
    echo "  • Use conventional commits (feat:, fix:, refactor:, etc.)"
    echo "  • Include co-author line: Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
    echo ""
fi

exit 0
