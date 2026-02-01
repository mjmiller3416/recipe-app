#!/bin/bash
# Design system auditor for frontend .tsx files
# Runs on EVERY Edit/Write to catch violations

# Read hook input from stdin
INPUT=$(cat)

# Parse JSON input
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

# Only run on frontend .tsx files
if [[ "$FILE_PATH" != *"frontend/src"* ]] || [[ "$FILE_PATH" != *".tsx" ]]; then
    exit 0
fi

# Get project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "🔍 Design System Audit: $(basename "$FILE_PATH")"
echo ""

# Read the file content
if [ ! -f "$PROJECT_ROOT/$FILE_PATH" ]; then
    echo "⚠️  File not found, skipping audit"
    exit 0
fi

FILE_CONTENT=$(cat "$PROJECT_ROOT/$FILE_PATH")

# Check for common violations
VIOLATIONS=0

# Check 1: Hardcoded colors
if echo "$FILE_CONTENT" | grep -qE 'text-(gray|slate|zinc|neutral|stone)-[0-9]+|bg-(gray|slate|zinc|neutral|stone)-[0-9]+'; then
    echo "❌ Hardcoded gray colors found"
    echo "   Use semantic tokens: text-muted-foreground, bg-card"
    VIOLATIONS=$((VIOLATIONS + 1))
fi

# Check 2: Arbitrary pixel values
if echo "$FILE_CONTENT" | grep -qE 'className="[^"]*\[[0-9]+px\]'; then
    echo "❌ Arbitrary pixel values found"
    echo "   Use Tailwind scale: h-10, w-48, gap-4"
    VIOLATIONS=$((VIOLATIONS + 1))
fi

# Check 3: Icon buttons without aria-label
if echo "$FILE_CONTENT" | grep -qE '<Button[^>]*size="icon"'; then
    # Check if ANY Button with size="icon" is missing aria-label
    if ! echo "$FILE_CONTENT" | grep -qE '<Button[^>]*size="icon"[^>]*aria-label='; then
        echo "⚠️  Icon button(s) may be missing aria-label"
        echo "   Example: <Button size=\"icon\" aria-label=\"Close\">"
        VIOLATIONS=$((VIOLATIONS + 1))
    fi
fi

# Check 4: Fake cards (divs with bg-card but no Card import)
if echo "$FILE_CONTENT" | grep -qE '<div[^>]*className="[^"]*bg-card'; then
    if ! echo "$FILE_CONTENT" | grep -qE 'import.*Card.*from.*@/components/ui/card'; then
        echo "⚠️  Using bg-card on div instead of <Card> component"
        echo "   Import Card from @/components/ui/card"
        VIOLATIONS=$((VIOLATIONS + 1))
    fi
fi

# Summary
echo ""
if [ $VIOLATIONS -eq 0 ]; then
    echo "✅ No design system violations detected"
else
    echo "📚 Found $VIOLATIONS violation(s)"
    echo "   Review: .claude/context/frontend/frontend-core.md"
fi

echo ""

exit 0