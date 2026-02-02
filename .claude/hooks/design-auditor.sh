#!/bin/bash
# Design system auditor for frontend .tsx files
# BLOCKS edits with design violations (exit 2)

# Read hook input from stdin
INPUT=$(cat)

# Parse JSON input
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

# Setup logging
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="$SCRIPT_DIR/hooks.log"

# Only run on frontend .tsx files
if [[ "$FILE_PATH" != *"frontend/src"* ]] && [[ "$FILE_PATH" != *"frontend\\src"* ]]; then
    exit 0
fi

if [[ ! "$FILE_PATH" =~ \.tsx$ ]]; then
    exit 0
fi

# Get project root
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Determine full path (handle both absolute and relative paths)
if [[ "$FILE_PATH" == /* ]] || [[ "$FILE_PATH" =~ ^[A-Za-z]: ]]; then
    FULL_PATH="$FILE_PATH"
else
    FULL_PATH="$PROJECT_ROOT/$FILE_PATH"
fi

# Read the file content
if [ ! -f "$FULL_PATH" ]; then
    exit 0
fi

FILE_CONTENT=$(cat "$FULL_PATH")

# Collect violations with specific messages
VIOLATIONS=()

# ============================================================================
# VIOLATION CHECKS
# ============================================================================

# Check 1: Hardcoded gray colors
if echo "$FILE_CONTENT" | grep -qE 'text-(gray|slate|zinc|neutral|stone)-[0-9]+|bg-(gray|slate|zinc|neutral|stone)-[0-9]+'; then
    VIOLATIONS+=("Hardcoded gray colors found - use semantic tokens (text-muted-foreground, bg-card)")
fi

# Check 2: Arbitrary pixel values in className
if echo "$FILE_CONTENT" | grep -qE 'className="[^"]*\[[0-9]+px\]'; then
    VIOLATIONS+=("Arbitrary pixel values [Npx] found - use Tailwind scale (h-10, w-48, gap-4)")
fi

# Check 3: Fixed widths without responsive modifiers
if echo "$FILE_CONTENT" | grep -qE 'className="[^"]*w-\[[0-9]+px\]' && \
   ! echo "$FILE_CONTENT" | grep -qE '(sm:|md:|lg:|xl:|2xl:)w-'; then
    VIOLATIONS+=("Fixed width without responsive modifiers - use responsive design (sm:, md:, lg:)")
fi

# Check 4: Fixed heights on containers (anti-pattern for responsive)
if echo "$FILE_CONTENT" | grep -qE 'className="[^"]*h-\[[0-9]+px\].*<div|<section|<main'; then
    VIOLATIONS+=("Fixed pixel height on container - use min-h, max-h, or h-full for flexibility")
fi

# Check 5: Icon buttons without aria-label
if echo "$FILE_CONTENT" | grep -qE '<Button[^>]*size="icon"'; then
    if ! echo "$FILE_CONTENT" | grep -qE '<Button[^>]*size="icon"[^>]*aria-label='; then
        VIOLATIONS+=("Icon button missing aria-label - add aria-label=\"Description\"")
    fi
fi

# Check 6: Fake cards (divs with bg-card but no Card import)
if echo "$FILE_CONTENT" | grep -qE '<div[^>]*className="[^"]*bg-card'; then
    if ! echo "$FILE_CONTENT" | grep -qE 'import.*Card.*from.*@/components/ui/card'; then
        VIOLATIONS+=("Using bg-card on div - import and use <Card> component instead")
    fi
fi

# Check 7: Fake buttons (divs/spans with onClick)
if echo "$FILE_CONTENT" | grep -qE '<(div|span)[^>]*onClick='; then
    if ! echo "$FILE_CONTENT" | grep -qE 'role="button"|type="button"'; then
        VIOLATIONS+=("Using div/span with onClick - use <Button> component or add role=\"button\"")
    fi
fi

# Check 8: Missing responsive container classes
if echo "$FILE_CONTENT" | grep -qE '<div[^>]*className="[^"]*container[^"]*"'; then
    if ! echo "$FILE_CONTENT" | grep -qE 'max-w-|px-|mx-auto'; then
        VIOLATIONS+=("Container without width constraints - add max-w-* and px-* for responsive padding")
    fi
fi

# Check 9: Hardcoded other colors (blue, red, etc.)
if echo "$FILE_CONTENT" | grep -qE '(text|bg|border)-(red|blue|green|yellow|purple|pink|indigo)-[0-9]+' && \
   ! echo "$FILE_CONTENT" | grep -qE 'text-destructive|bg-destructive|border-destructive|bg-primary|text-primary'; then
    VIOLATIONS+=("Hardcoded color classes - use semantic tokens (primary, destructive, muted)")
fi

# Check 10: Images without responsive sizing
if echo "$FILE_CONTENT" | grep -qE '<(img|Image)[^>]*width="[0-9]+"'; then
    if ! echo "$FILE_CONTENT" | grep -qE 'className="[^"]*w-|className="[^"]*(sm:|md:|lg:)'; then
        VIOLATIONS+=("Image with fixed width - use responsive width classes (w-full, sm:w-1/2)")
    fi
fi

# ============================================================================
# RESULTS & BLOCKING
# ============================================================================

FILENAME=$(basename "$FILE_PATH")
VIOLATION_COUNT=${#VIOLATIONS[@]}

if [ $VIOLATION_COUNT -eq 0 ]; then
    # No violations - allow edit
    echo "[$(date '+%H:%M:%S')] design-auditor | $FILENAME | ✓ No violations" >> "$LOG_FILE"

    jq -n --arg msg "✓ Design audit passed: $FILENAME" '{
        systemMessage: $msg
    }'

    exit 0
else
    # Violations found - BLOCK edit
    echo "[$(date '+%H:%M:%S')] design-auditor | $FILENAME | ✗ $VIOLATION_COUNT violation(s) - BLOCKED" >> "$LOG_FILE"

    # Send detailed feedback to Claude via stderr
    echo "🚫 Design system violations in $FILENAME:" >&2
    echo "" >&2

    for i in "${!VIOLATIONS[@]}"; do
        echo "  $((i+1)). ${VIOLATIONS[$i]}" >&2
    done

    echo "" >&2
    echo "Fix these violations before proceeding." >&2
    echo "Reference: .claude/context/frontend/frontend-core.md" >&2

    # Exit 2 = BLOCK the edit
    exit 2
fi
