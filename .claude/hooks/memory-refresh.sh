#!/bin/bash
# Memory refresh hook - periodic reminders to prevent context drift
# Runs every 10 edits to reinforce critical rules during long sessions

# Read hook input from stdin
INPUT=$(cat)

# Parse JSON input
SESSION_ID=$(echo "$INPUT" | jq -r '.session_id // "default"')

# Use cross-platform temp directory
if [ -n "$TEMP" ]; then
    MARKER_DIR="$TEMP"
elif [ -n "$TMPDIR" ]; then
    MARKER_DIR="$TMPDIR"
else
    MARKER_DIR="/tmp"
fi

# Count edits this session
COUNTER_FILE="$MARKER_DIR/claude-edit-count-$SESSION_ID"
if [ -f "$COUNTER_FILE" ]; then
    COUNT=$(cat "$COUNTER_FILE")
else
    COUNT=0
fi

COUNT=$((COUNT + 1))
echo "$COUNT" > "$COUNTER_FILE"

# Setup logging
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="$SCRIPT_DIR/hooks.log"

# Every 10 edits, inject critical rules reminder
if [ $((COUNT % 10)) -eq 0 ]; then
    echo "[$(date '+%H:%M:%S')] memory-refresh | Edit #$COUNT | Reminder injected" >> "$LOG_FILE"

    jq -n --argjson count "$COUNT" '{
        systemMessage: "
╔══════════════════════════════════════════════════════════════════╗
║  ⚡ MEMORY REFRESH (Edit #\($count)) - Critical Rules Reminder  ║
╠══════════════════════════════════════════════════════════════════╣
║  Frontend Rules:                                                 ║
║    • Use semantic tokens (text-muted-foreground, NOT gray-500)   ║
║    • shadcn components only (NO fake divs with bg-card)          ║
║    • Tailwind scale (h-10, NOT h-[38px])                         ║
║    • Icon buttons MUST have aria-label                           ║
║    • Icons from lucide-react with strokeWidth={1.5}              ║
║                                                                  ║
║  Backend Rules:                                                  ║
║    • Services commit/rollback transactions                       ║
║    • Repositories ONLY flush (NEVER commit)                      ║
║    • Use domain exceptions (NOT HTTPException in services)       ║
║    • All signatures MUST have type hints                         ║
║    • Follow layers: Routes → Services → Repositories → Models    ║
╚══════════════════════════════════════════════════════════════════╝
"
    }'
fi

exit 0
