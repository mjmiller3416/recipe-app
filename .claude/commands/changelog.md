# Changelog Entry Generator

Generate a changelog entry from completed TODO items and add it to the changelog.

## Arguments (optional)

$ARGUMENTS

## Instructions

### Step 1: Get Changelog Content

**Check the argument format to determine the workflow:**

#### Option A: TODO Reference (e.g., `#14`)

If the argument matches `#N` where N is a number:

1. Read `frontend/TODO.md`
2. Find the item with heading `### N.` (e.g., `### 14. Reorder Shopping List Stats Layout`)
3. Extract the item's **title** (the heading text after the number)
4. Move the item to the `## ✅ Completed` section:
   - Remove the entire item block (heading + all content until next `###` or section)
   - Add it to the top of the Completed section (after `## ✅ Completed`)
   - Remove the number prefix from the heading (e.g., `### 14. Title` → `### Title`)
5. Use the title as the changelog content
6. Save the updated TODO.md

#### Option B: Direct Description

If the argument is plain text (not a `#N` reference):
- Use the provided text directly as the changelog content

#### Option C: No Arguments

If no arguments provided, read `frontend/TODO.md`, find items in the `## ✅ Completed` section, and ask:

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

**For TODO reference (`#N`):**
```
✅ Done!

- Moved TODO #N "[Title]" to Completed section
- Added changelog entry for [date]:
  - [Change description]

The "What's New" indicator will appear for users who haven't seen this update.
```

**For direct description or selection:**
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

## Usage Examples

```
/changelog #14
```
→ Finds TODO item 14, moves it to Completed, adds to changelog

```
/changelog Added dark mode support
```
→ Creates changelog entry with "Added dark mode support"

```
/changelog
```
→ Lists completed items and asks which to include

## Notes

- Entries must be **prepended** (newest first) to trigger the new update indicator
- The date in `## YYYY-MM-DD` becomes the version - must be unique
- Multiple entries on the same day can use the same date
- TODO items are identified by their `### N.` heading pattern
