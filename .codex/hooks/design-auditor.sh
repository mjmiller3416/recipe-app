#!/bin/bash
# Design system auditor — deterministic violation checks
# PostToolUse hook: reports violations via systemMessage after edits
#
# Catches only grep-able, zero-ambiguity violations (no judgment calls).
# Deeper analysis is handled by the /audit skill on commit.
#
# Criteria IDs map to .claude/skills/audit/criteria/ checklists:
#   C.*  = component.md    (frontend)
#   S.*  = service.md      (backend)

# Read hook input from stdin
INPUT=$(cat)

# Parse JSON input
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

# Setup logging
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="$SCRIPT_DIR/hooks.log"

# Skip non-source files
case "$FILE_PATH" in
    *.json|*.md|*.lock|*.log|*.txt|*.yml|*.yaml|*.env*|*.sh|*.css|*.html)
        exit 0
        ;;
    *node_modules/*|*dist/*|*build/*|*.next/*|*__pycache__/*|*.git/*|*venv/*)
        exit 0
        ;;
esac

# Determine scope
IS_FRONTEND=false
IS_BACKEND=false

if [[ "$FILE_PATH" == *"frontend/src"* ]] || [[ "$FILE_PATH" == *"frontend\\src"* ]]; then
    IS_FRONTEND=true
elif [[ "$FILE_PATH" == *"backend/app"* ]] || [[ "$FILE_PATH" == *"backend\\app"* ]]; then
    IS_BACKEND=true
else
    exit 0
fi

# Get project root and resolve full path
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

if [[ "$FILE_PATH" == /* ]] || [[ "$FILE_PATH" =~ ^[A-Za-z]: ]]; then
    FULL_PATH="$FILE_PATH"
else
    FULL_PATH="$PROJECT_ROOT/$FILE_PATH"
fi

if [ ! -f "$FULL_PATH" ]; then
    exit 0
fi

FILE_CONTENT=$(cat "$FULL_PATH")
FILENAME=$(basename "$FILE_PATH")
VIOLATIONS=()

# ============================================================================
# FRONTEND CHECKS
# ============================================================================

if [ "$IS_FRONTEND" = true ]; then

    # C.1: Hardcoded color classes (Error)
    MATCH=$(echo "$FILE_CONTENT" | grep -nE '(text|bg|border)-(gray|slate|zinc|red|blue|green|yellow|purple|pink|neutral|stone|orange)-[0-9]' | head -3)
    if [ -n "$MATCH" ]; then
        VIOLATIONS+=("C.1 Error — Hardcoded color classes. Use semantic tokens (text-muted-foreground, bg-card, border-destructive).
$MATCH")
    fi

    # C.2: Arbitrary pixel values (Error)
    MATCH=$(echo "$FILE_CONTENT" | grep -nE '\-\[[0-9]+px\]' | head -3)
    if [ -n "$MATCH" ]; then
        VIOLATIONS+=("C.2 Error — Arbitrary pixel values. Use Tailwind scale (h-10, w-48, gap-4, p-6).
$MATCH")
    fi

    # .tsx-only checks
    if [[ "$FILE_PATH" =~ \.tsx$ ]]; then

        # C.4: Raw <button> elements (Error)
        MATCH=$(echo "$FILE_CONTENT" | grep -nE '<button[ >]' | head -3)
        if [ -n "$MATCH" ]; then
            VIOLATIONS+=("C.4 Error — Raw <button> element. Use <Button> from @/components/ui/button.
$MATCH")
        fi

        # C.13: react-icons imports (Error)
        MATCH=$(echo "$FILE_CONTENT" | grep -nE "from ['\"]react-icons" | head -3)
        if [ -n "$MATCH" ]; then
            VIOLATIONS+=("C.13 Error — Wrong icon library. Use lucide-react with strokeWidth={1.5}.
$MATCH")
        fi
    fi
fi

# ============================================================================
# BACKEND CHECKS
# ============================================================================

if [ "$IS_BACKEND" = true ] && [[ "$FILE_PATH" =~ \.py$ ]]; then

    # S.4: Repository calling commit() (Error)
    if [[ "$FILE_PATH" == *"repositories"* ]]; then
        MATCH=$(echo "$FILE_CONTENT" | grep -nE '\.commit\(\)' | head -3)
        if [ -n "$MATCH" ]; then
            VIOLATIONS+=("S.4 Error — Repository must NEVER call commit(). Use flush() only; services own transactions.
$MATCH")
        fi
    fi

    # Service-only checks
    if [[ "$FILE_PATH" == *"services"* ]]; then

        # S.6: HTTPException in service (Error)
        MATCH=$(echo "$FILE_CONTENT" | grep -nE 'raise HTTPException|from fastapi import.*HTTPException' | head -3)
        if [ -n "$MATCH" ]; then
            VIOLATIONS+=("S.6 Error — Services must raise domain exceptions, not HTTPException. Define <Entity><Problem>Error classes.
$MATCH")
        fi

        # S.10: Direct DB queries in service (Error)
        MATCH=$(echo "$FILE_CONTENT" | grep -nE 'session\.(execute|query)\(' | head -3)
        if [ -n "$MATCH" ]; then
            VIOLATIONS+=("S.10 Error — Direct DB query in service. All data access must go through the repository layer.
$MATCH")
        fi
    fi
fi

# ============================================================================
# RESULTS
# ============================================================================

VIOLATION_COUNT=${#VIOLATIONS[@]}

if [ $VIOLATION_COUNT -eq 0 ]; then
    echo "[$(date '+%H:%M:%S')] design-auditor | $FILENAME | ✓ Pass" >> "$LOG_FILE"
    exit 0
fi

# Build violation summary for systemMessage
SUMMARY="⚠️ $VIOLATION_COUNT violation(s) in $FILENAME:"

for i in "${!VIOLATIONS[@]}"; do
    SUMMARY+=$'\n\n'"  $((i+1)). ${VIOLATIONS[$i]}"
done

SUMMARY+=$'\n\n'"Fix these violations. Criteria ref: .claude/skills/audit/criteria/"

echo "[$(date '+%H:%M:%S')] design-auditor | $FILENAME | ✗ $VIOLATION_COUNT violation(s)" >> "$LOG_FILE"

# Output as systemMessage so Claude sees the details and can act on them
jq -n --arg msg "$SUMMARY" '{ "systemMessage": $msg }'
exit 0
