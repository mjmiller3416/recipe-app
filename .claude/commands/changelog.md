# Changelog Entry Generator

Generate a changelog entry from completed TODO items and add it to the changelog.

## Arguments (optional)

$ARGUMENTS

## Instructions

### Step 1: Get Changelog Content

**If arguments were provided:** Use those as the changelog content directly.

**If no arguments:** Read `frontend/TODO.md`, find items in the `## ✅ Completed` section, and ask:

```
Found these completed items:
1. [Item 1]
2. [Item 2]

Which items to include? (all / specific numbers / custom description)
```

### Step 2: Generate Entry

Create a markdown entry with today's date:

```markdown
## YYYY-MM-DD - [Title]
- [Change 1 in user-friendly language]
- [Change 2 in user-friendly language]
```

**Guidelines:**
- Title: "Latest Updates", "New Features", "Bug Fixes", or "Improvements"
- Write changes from user's perspective (not developer's)
- Good: "Drag-and-drop reordering of ingredients"
- Bad: "Implemented dnd-kit in IngredientRow.tsx"

### Step 3: Update Changelog File

1. Read `frontend/src/data/changelog.ts`
2. Find the `CHANGELOG_MD` template literal
3. **Prepend** the new entry after the opening backtick
4. Save the file

**Example - Before:**
```typescript
const CHANGELOG_MD = `
## 2024-12-27 - Latest Updates
- Existing change
`;
```

**Example - After:**
```typescript
const CHANGELOG_MD = `
## 2024-12-28 - New Features
- New feature description

## 2024-12-27 - Latest Updates
- Existing change
`;
```

### Step 4: Confirm

```
✅ Changelog updated!

Added entry for [date]:
## [Title]
- [Changes...]

The "What's New" indicator will appear for users who haven't seen this update.
```

## File Location

- **Changelog file**: `frontend/src/data/changelog.ts`
- **TODO source**: `frontend/TODO.md` (Completed section)

## Notes

- Entries must be **prepended** (newest first) to trigger the new update indicator
- The date in `## YYYY-MM-DD` becomes the version - must be unique
- Multiple entries on the same day can use the same date
