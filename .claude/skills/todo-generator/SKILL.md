---
name: todo
description: Generate formatted TODO items from problem descriptions and append them to frontend/TODO.md. Use when you want to quickly log a bug, feature request, or improvement.
---

# TODO Generator

Quickly create formatted TODO items from problem descriptions.

## Usage

```
/todo [describe the problem or feature request]
```

## Examples

```
/todo users can't enter .5 for ingredient quantities
/todo the delete button triggers on spacebar which causes accidental deletions
/todo add drag and drop reordering for ingredients
```

## Instructions

When the user describes a problem or feature request:

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
