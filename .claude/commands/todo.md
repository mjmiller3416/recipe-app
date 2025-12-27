# TODO Generator

Generate a formatted TODO item from this problem description and append it to `frontend/TODO.md`.

## Problem Description

$ARGUMENTS

## Instructions

### Step 1: Search the Codebase

Use Grep and Glob to identify the most relevant file(s) related to the issue. Look for:
- Component names mentioned in the description
- Related functionality keywords
- File patterns that match the feature area

### Step 2: Generate the TODO Item

Create a formatted TODO entry with these fields:

```markdown
### [Action-Oriented Title]
- **Location**: `path/to/file.tsx`
- **Issue**: [Clear description of the problem or missing feature]
- **Solution**: [High-level approach to fix or implement]
```

**Title Guidelines:**
- Start with a verb (Add, Fix, Enable, Prevent, Implement, Update)
- Keep it concise (5-8 words max)
- Make it scannable

**Location Guidelines:**
- Use forward slashes in paths
- Include the most relevant file (if multiple files, pick the primary one)
- Use paths relative to `frontend/` when inside the frontend directory

**Issue Guidelines:**
- Describe what's wrong or missing from the user's perspective
- Use em-dashes (—) instead of double hyphens
- Be specific about the behavior

**Solution Guidelines:**
- Suggest a concrete approach, not just "fix the bug"
- Reference specific code patterns when applicable
- Keep it to 1-2 sentences

### Step 3: Ask for Priority

Ask the user which priority level to assign:

- **🟠 High Priority** — Blocking issues, broken core functionality
- **🟡 Medium Priority** — Important improvements, notable UX issues
- **🔵 Low Priority** — Nice-to-haves, polish, future enhancements

### Step 4: Append to TODO.md

1. Read `frontend/TODO.md` to find the correct priority section
2. Append the new TODO item at the end of the appropriate section (before the next `##` heading)
3. Confirm the addition to the user

### Output Format

After completing all steps, confirm with:

```
✅ Added to TODO.md under [Priority Level]:

### [Title]
- **Location**: `[path]`
- **Issue**: [issue]
- **Solution**: [solution]
```

## Important Notes

- Always search the codebase first to provide accurate file locations
- If multiple files are relevant, mention the primary file in Location and note others in the Solution
- If you can't find a relevant file, ask the user for clarification
- Keep the TODO concise — the goal is quick capture, not detailed specs
