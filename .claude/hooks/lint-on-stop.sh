#!/bin/bash
# Stop hook: runs the custom ESLint report script and blocks if errors are found.
# Uses frontend/scripts/lint-report.mjs to generate a grouped markdown report,
# then feeds the summary back to Claude so it can fix the issues.

INPUT=$(cat)

# Guard against infinite loops
STOP_HOOK_ACTIVE=$(echo "$INPUT" | jq -r '.stop_hook_active // "false"')
if [ "$STOP_HOOK_ACTIVE" = "true" ]; then
    exit 0
fi

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
# Convert Git Bash path (/c/Users/...) to Windows path (C:/Users/...) for Node.js compatibility
PROJECT_ROOT=$(echo "$PROJECT_ROOT" | sed 's|^/\([a-zA-Z]\)/|\1:/|')
FRONTEND_DIR="$PROJECT_ROOT/frontend"
REPORT_FILE="$FRONTEND_DIR/lint-report.md"
LOG_FILE="$PROJECT_ROOT/.claude/hooks/hooks.log"
TIMESTAMP=$(date +"%H:%M:%S")

log() {
    echo "[$TIMESTAMP] lint-on-stop | $1" >> "$LOG_FILE"
}

# Skip if no frontend directory exists
if [ ! -d "$FRONTEND_DIR" ]; then
    exit 0
fi

# Get ALL changed frontend files (modified, staged, untracked - everything except deleted)
# Using git status --porcelain which shows all file states, then strip the status prefix
CHANGED_FILES=$(cd "$PROJECT_ROOT" && git status --porcelain 2>/dev/null | grep -v "^D" | sed 's/^...//' | grep "^frontend/.*\.\(ts\|tsx\|js\|jsx\)$")

# Skip if no frontend JS/TS files were changed
if [ -z "$CHANGED_FILES" ]; then
    log "No frontend TS/JS files changed, skipping lint"
    exit 0
fi

# Log what files we're linting
FILE_COUNT=$(echo "$CHANGED_FILES" | wc -l | tr -d ' ')
log "Linting $FILE_COUNT file(s): $(echo "$CHANGED_FILES" | tr '\n' ' ')"

# Convert to space-separated list of absolute paths
FILE_ARGS=""
while IFS= read -r file; do
    [ -n "$file" ] && FILE_ARGS="$FILE_ARGS $PROJECT_ROOT/$file"
done <<< "$CHANGED_FILES"

# Run the custom lint report script on only the changed files
NODE_OUTPUT=$(node "$FRONTEND_DIR/scripts/lint-report.mjs" -o "$REPORT_FILE" $FILE_ARGS 2>&1)
EXIT_CODE=$?

# Extract counts from the script output (format: "... (X errors, Y warnings, Z rules)")
# Using sed instead of grep -P for Git Bash compatibility
ERRORS=$(echo "$NODE_OUTPUT" | sed -n 's/.*(\([0-9]*\) errors.*/\1/p' | tail -1)
WARNINGS=$(echo "$NODE_OUTPUT" | sed -n 's/.*, \([0-9]*\) warnings.*/\1/p' | tail -1)
ERRORS=${ERRORS:-0}
WARNINGS=${WARNINGS:-0}
TOTAL=$((ERRORS + WARNINGS))

if [ $EXIT_CODE -eq 0 ]; then
    # Clean — no errors
    log "✓ No issues"
    echo "$NODE_OUTPUT"
    exit 0
elif [ $EXIT_CODE -eq 1 ]; then
    # ESLint found errors
    log "✗ $TOTAL problems ($ERRORS errors, $WARNINGS warnings) - BLOCKED"

    # Extract just the overview and summary-by-rule tables (not full details)
    SUMMARY=""
    if [ -f "$REPORT_FILE" ]; then
        SUMMARY=$(sed -n '/^## Overview$/,/^## Details$/p' "$REPORT_FILE" | head -n -1)
    fi

    # Block Claude from stopping and provide the lint summary
    jq -n \
        --arg reason "ESLint found errors. Fix them before stopping. Report at frontend/lint-report.md
$SUMMARY" \
        '{ "decision": "block", "reason": $reason }'
    exit 0
else
    # Script crashed (exit 2 = unexpected failure) — don't block, just warn
    log "⚠ Script failed (exit $EXIT_CODE)"
    echo "$NODE_OUTPUT" >&2
    exit 1
fi
