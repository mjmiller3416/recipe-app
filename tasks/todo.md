# Fix Bold Formatting in Meal Genie Assistant

## Problem
Markdown bold syntax (`**text**`) is showing as literal text instead of rendering as bold in the Meal Genie chat messages.

## Root Cause
Both `MealGenieChatContent.tsx` (line 275) and `MealGenieAssistant.tsx` (line 162) render message content as plain text using `{message.content}` without any markdown parsing.

## Plan

- [x] Install `react-markdown` package
- [x] Update `MealGenieChatContent.tsx` to render assistant messages with markdown
- [x] Update `MealGenieAssistant.tsx` to render assistant messages with markdown

## Review

### Changes Made

1. **package.json**: Added `react-markdown` v9.0.1 as a dependency

2. **MealGenieChatContent.tsx**:
   - Added import for `ReactMarkdown`
   - Wrapped assistant message content in `<ReactMarkdown>` component with prose styling

3. **MealGenieAssistant.tsx**:
   - Added import for `ReactMarkdown`
   - Wrapped assistant message content in `<ReactMarkdown>` component with prose styling

### How It Works
- User messages remain as plain text (no markdown parsing needed)
- Assistant messages are now parsed and rendered as markdown
- The `prose prose-sm` classes provide sensible typography defaults
- `[&>p]:m-0` removes default paragraph margins for tighter chat bubble spacing

### Next Steps
Run `npm install` in the frontend directory to install the new dependency, then test the Meal Genie chat.
