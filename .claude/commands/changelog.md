# Changelog Entry Generator

Generate a changelog entry from completed TODO items and add it to the changelog dialog.

## Arguments (optional)

$ARGUMENTS

## Instructions

### Step 1: Read Completed Items

Read `frontend/TODO.md` and find all items in the `## ✅ Completed` section.

### Step 2: Confirm Items to Include

Present the completed items to the user and ask which ones should be included in this changelog entry:

```
Found these completed items:
1. [Item 1 title]
2. [Item 2 title]
3. [Item 3 title]

Which items should be included in this changelog entry?
- All of them (default)
- Specific numbers (e.g., "1, 3")
- Custom entry (I'll describe what to add)
```

If arguments were provided, use those as the changelog content instead of reading from TODO.md.

### Step 3: Generate Entry Title

Ask the user for a title or suggest one:

```
Suggested title: "Latest Updates"

Options:
- Use suggested title
- "Bug Fixes"
- "New Features"
- "Improvements"
- Custom title
```

### Step 4: Format the Changelog Entry

Create a changelog entry object:

```tsx
{
  version: "YYYY-MM-DD",  // Today's date
  date: "Month DD, YYYY", // Today's date formatted
  title: "[Selected Title]",
  changes: [
    "User-friendly description of change 1",
    "User-friendly description of change 2",
  ],
}
```

**Change Description Guidelines:**
- Write from the user's perspective, not developer's
- Start with a verb or describe the improvement
- Keep each item to one line
- Avoid technical jargon (no "fixed bug in X component")
- Good: "Drag-and-drop reordering of ingredients when adding recipes"
- Bad: "Implemented dnd-kit sortable in IngredientRow.tsx"

### Step 5: Update ChangelogDialog.tsx

1. Read `frontend/src/components/common/ChangelogDialog.tsx`
2. Find the `CHANGELOG_ENTRIES` array
3. **Prepend** the new entry at the beginning of the array (position 0)
4. Ensure proper formatting with trailing comma

### Step 6: Clean Up TODO.md (Optional)

Ask the user:
```
Should I remove the added items from the Completed section in TODO.md?
- Yes, clean up (removes items from Completed section)
- No, keep them (items remain in TODO.md for reference)
```

### Step 7: Confirm

Output confirmation:

```
✅ Changelog updated!

Added entry for [date]:
### [Title]
- [Change 1]
- [Change 2]

The "What's New" indicator will now appear for users who haven't seen this update.
```

## Example Usage

```
/changelog
```
→ Reads from TODO.md completed section, asks for confirmation

```
/changelog Added dark mode support and improved recipe search
```
→ Creates entry with the provided description directly

## File Locations

- **TODO source**: `frontend/TODO.md` (Completed section)
- **Changelog target**: `frontend/src/components/common/ChangelogDialog.tsx`

## Notes

- New entries must be **prepended** (not appended) to trigger the new update indicator
- The `version` field must be unique — it's compared against localStorage
- Use today's date for the version to ensure uniqueness
- Multiple changelog updates on the same day should use the same version (they'll merge visually)
