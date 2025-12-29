# GitHub Issues to TODO Sync

Sync open GitHub issues to `frontend/TODO.md`, adding any issues not already present.

## Instructions

### Step 1: Fetch GitHub Issues

Run the following command to get all open issues from the repository:

```bash
gh issue list --state open --json number,title,body,labels --limit 100
```

Parse the JSON output to extract:
- Issue number (e.g., `#42`)
- Issue title
- Issue body (for context)
- Labels (to help determine priority)

### Step 2: Read Current TODO.md

Read `frontend/TODO.md` and scan for existing GitHub issue references. Look for patterns like:
- `#[number]` in section titles (e.g., `### #29 [Feedback] AI Image Style Concern`)
- Issue numbers mentioned anywhere in the file

Build a list of issue numbers already tracked in TODO.md.

### Step 3: Identify Missing Issues

Compare the fetched GitHub issues against the tracked issues. Any issue number from GitHub that does NOT appear in TODO.md is considered "missing" and needs to be added.

### Step 4: Format and Add Missing Issues

For each missing issue, create a TODO entry:

```markdown
### #[number] [Issue Title]
- **Location**: TBD (requires investigation)
- **Issue**: [First 1-2 sentences of issue body, or full body if short]
- **Solution**: Investigate and implement based on issue description.
```

**Priority Assignment Rules:**
- Labels containing `bug`, `critical`, `urgent` → 🟠 High Priority
- Labels containing `enhancement`, `feature` → 🟡 Medium Priority
- Labels containing `help wanted`, `good first issue`, `low` → 🔵 Low Priority
- No labels or unclear → 🟡 Medium Priority (default)

Append each new issue to the appropriate priority section in TODO.md.

### Step 5: Report Results

After syncing, provide a summary:

```
✅ GitHub Issues Sync Complete

📥 Fetched: [X] open issues from GitHub
📋 Already tracked: [Y] issues in TODO.md
➕ Added: [Z] new issues

New issues added:
- #[number]: [title] → [Priority]
- #[number]: [title] → [Priority]
...

No action needed for:
- #[number]: [title] (already in TODO.md)
...
```

If no new issues were found:
```
✅ TODO.md is up to date — all [X] open GitHub issues are already tracked.
```

## Prerequisites

This command requires the GitHub CLI (`gh`). If not installed:

**Windows (winget):**
```bash
winget install --id GitHub.cli
```

**Windows (scoop):**
```bash
scoop install gh
```

**Mac (Homebrew):**
```bash
brew install gh
```

After installing, authenticate with:
```bash
gh auth login
```

## Important Notes

- Only sync OPEN issues (closed issues should not be added)
- Preserve existing TODO.md formatting and content
- Issues already in the ✅ Completed section should be ignored (they're resolved)
- If `gh` CLI is not authenticated, prompt the user to run `gh auth login`
- If there are no open issues, report that the repository has no open issues to sync