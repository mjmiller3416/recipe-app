# Fix TODO

Select a TODO from the list, implement it, and add it to the Changelog.

## Arguments (optional)

$ARGUMENTS

## Instructions

### Step 1: List Incomplete TODOs

Read `frontend/TODO.md` and list all items from the priority sections.

Display as a numbered list grouped by priority:

```
🟠 HIGH PRIORITY
1. Re-enable Ingredient Form Validation

🟡 MEDIUM PRIORITY
2. Allow Leading Decimals in Ingredient Quantities
3. Auto-Scroll to New Ingredient Row
4. Fix Squared-Off Card Shadows
...

🔵 LOW PRIORITY
5. Prevent Accidental Ingredient Deletion via Keyboard
...
```

**If `$ARGUMENTS` provided:** Skip the list and find the TODO matching the argument (by number or title keywords).

### Step 2: Select TODO

Ask: "Which TODO would you like to fix? (enter number)"

Wait for the user to respond before proceeding.

### Step 3: Implement the TODO

**This is the main work step.**

1. Read the selected TODO's **Location**, **Issue**, and **Solution** fields
2. Navigate to the specified file(s)
3. Implement the fix/feature as described in the Solution
4. Follow the CLAUDE.md guidelines:
   - Simple changes, minimal code impact
   - No over-engineering
   - If clarification is needed, ask the user before proceeding
5. Verify the implementation works correctly

### Step 4: Move to Completed Section

After implementation is verified:

1. Remove the TODO from its current priority section in `frontend/TODO.md`
2. Add it to the `## ✅ Completed` section (at the top of that section, just below the `## ✅ Completed` heading)
3. Keep the same format: Title, Location, Issue, Solution

### Step 5: Generate Changelog Entry

Create a user-friendly changelog entry:

- Use today's date: `## YYYY-MM-DD - [Title]`
- Title options: "New Features", "Improvements", or "Bug Fixes" (based on the change type)
- Write from the USER's perspective, not developer's:
  - Good: "Ingredient quantities now accept leading decimals like .5"
  - Bad: "Updated regex in QuantityInput.tsx to allow leading decimals"

### Step 6: Update Changelog File

1. Read `frontend/src/data/changelog.ts`
2. Find the `CHANGELOG_MD` template literal
3. **Prepend** the new entry immediately after the opening backtick
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
## 2024-12-28 - Bug Fixes
- New fix description

## 2024-12-27 - Latest Updates
- Existing change
`;
```

### Step 7: Confirm Success

Display a summary:

```
✅ Fixed!

Completed: [TODO Title]
Files changed: [list of modified files]

Changelog entry added:
## YYYY-MM-DD - [Title]
- [User-friendly change description]

The "What's New" indicator will appear for users who haven't seen this update.
```

## File Locations

- **TODO file**: `frontend/TODO.md`
- **Changelog file**: `frontend/src/data/changelog.ts`

## Notes

- Entries must be **prepended** (newest first) to trigger the new update indicator
- If multiple TODOs are fixed in one session, they can share the same changelog entry date
- Keep changes simple and focused on the TODO's stated solution