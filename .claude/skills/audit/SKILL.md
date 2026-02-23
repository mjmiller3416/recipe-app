---
name: audit
description: Audit files against project standards using parallel isolated subagents
disable-model-invocation: true
---

# Audit Skill — Orchestrator

**Purpose**: Run structured code audits against project-specific criteria. Each file is audited by an isolated subagent with a clean context window, guaranteeing consistent quality regardless of how many files are audited.

## Usage

```bash
/audit staged                        # All staged files (auto-classified)
/audit component <path> [path...]    # Specific component file(s)
/audit page <path> [path...]         # Page-level file(s) and views
/audit service <path> [path...]      # Backend service/repository file(s)
/audit directory <path>              # All auditable files in a directory
/audit structure                     # Project-wide file organization
```

`$ARGUMENTS` contains the raw text after `/audit`.

---

## Preprocessed Context

### Staged Files
!`git diff --cached --name-only`

### Staged Diff
!`git diff --cached`

---

## Workflow

```
Parse $ARGUMENTS → resolve file list
        ↓
Classify each file → audit type
        ↓
Tier each file → full or lightweight audit
        ↓
Load criteria and context per tier
        ↓
Dispatch parallel Task subagents (1 per file)
        ↓
Collect reports → compile unified summary
```

---

## Step 1: Parse Arguments and Resolve Files

Parse `$ARGUMENTS` to extract the **mode** (first word) and **targets** (remaining words).

### `staged`

Use the preprocessed **Staged Files** list above. If empty, stop and tell the user:
> No staged files found. Stage changes with `git add` and try again.

The preprocessed **Staged Diff** above contains the full diff for subagent context.

### `component` / `page` / `service`

Targets are explicit file paths from `$ARGUMENTS`. Validate each path exists using the Glob tool. Report and skip any invalid paths.

If no valid paths remain, stop and tell the user:
> No valid file paths found. Check the paths and try again.

### `directory`

A single directory path from `$ARGUMENTS`. Use Glob to resolve all auditable files:
- Include: `**/*.tsx`, `**/*.ts`, `**/*.py`
- Exclude: `node_modules`, `__pycache__`, `*.test.*`, `*.spec.*`, `*.d.ts`

If the directory doesn't exist or contains no auditable files, stop and report the error.

### `structure`

No file list needed. This dispatches a single subagent to examine overall project layout. Skip directly to Step 4 with audit type `structure`.

### No Arguments

If `$ARGUMENTS` is empty, display the usage reference above and stop.

---

## Step 2: Classify Files by Audit Type

For `component`, `page`, and `service` modes, the audit type comes directly from the command. **Skip this step.**

For `staged` and `directory` modes, classify each file using first-match routing:

| Path Pattern | Audit Type | Criteria File |
|---|---|---|
| `frontend/**/page.tsx` | page | `page.md` |
| `frontend/**/*View.tsx` or `*View.ts` | page | `page.md` |
| `frontend/**/components/**` | component | `component.md` |
| `frontend/**/hooks/**` | component | `component.md` |
| `frontend/**/_components/**` (non-View) | component | `component.md` |
| `frontend/**/*.tsx` or `*.ts` (catch-all) | component | `component.md` |
| `backend/**/services/**` | service | `service.md` |
| `backend/**/repositories/**` | service | `service.md` |
| `backend/**/*.py` (catch-all) | service | `service.md` |

**Skip files that match none of these patterns** (config files, JSON, CSS, markdown, migration scripts, test files, `__init__.py`). Note them as skipped in the final report.

---

## Step 3: Tier Each File

Before loading context, assess the diff size for each file to determine audit depth. For non-staged modes where no diff exists, always use **full**.

Count the changed lines for each file:

```bash
git diff --cached -- {file_path} | grep -c '^[+-]'
```

| Changed Lines | Tier | Reference Standards |
|---|---|---|
| < 20 | **Lightweight** | Omit — use criteria + `general.md` only |
| ≥ 20 | **Full** | Inline all reference standards per criteria file |

Include the tier assignment in each file's subagent prompt so the auditor understands the audit scope.

> **Note**: For explicit modes (`component`, `page`, `service`, `directory`) where you have no diff context, always assign **full** tier regardless.

---

## Step 4: Load Criteria and Resolve Context References

For the matched audit type, read these files:

1. **Type-specific criteria**: `.claude/skills/audit/criteria/{type}.md` (e.g., `component.md`, `page.md`, `service.md`, `structure.md`)
2. **General criteria**: `.claude/skills/audit/criteria/general.md` (always included)
3. **Report template**: `.claude/skills/audit/report-template.md` (always included)

For **full tier** files only: parse the criteria file's **Reference Standards** section for `@` references. Each `@`-prefixed path is project-root-relative.

**Resolution rule**: Extract all paths matching `` `@<path>` `` from the criteria file. Read each `<path>` relative to the project root. These become the subagent's reference context.

For **lightweight tier** files: skip reference standard resolution entirely.

If a referenced file doesn't exist, log a warning and continue — don't abort the audit.

---

## Step 5: Dispatch Subagents

Before dispatching, print: "Dispatching {n} subagents: [list filenames]" and confirm the count matches your auditable file list. If counts don't match, reconcile before proceeding.

Dispatch **one Task subagent per file**, all in parallel (single message with multiple Task calls). Do not dispatch in batches.

### Task Parameters

- **`subagent_type`**: `"auditor"`
- **`description`**: `"Audit {filename} [{tier} audit]"`

### Subagent Prompt Template

Build each subagent's prompt by inlining all necessary content. The auditor agent definition provides the workflow, role, and constraints automatically — the prompt only needs to supply the task-specific data.

```
## Target

- **File**: {file_path}
- **Audit Type**: {component | page | service | structure}
- **Audit Tier**: {Full | Lightweight}

{IF lightweight tier:}
> This is a lightweight audit (< 20 lines changed). Evaluate against
> type-specific criteria and general criteria only. Reference standards
> are omitted intentionally.
{END IF}

{IF staged mode:}
## Diff

```diff
{per-file diff from: git diff --cached -- {file_path}}
```

{END IF}

---

## Type-Specific Criteria

{full contents of the matched criteria file, e.g., component.md}

---

## General Criteria

{full contents of general.md}

---

{IF full tier:}
## Reference Standards

{for each context file in the mapping:}

### {context filename}

{full contents of the context file}

{end for each}

{END IF}

---

## Report Template

{full contents of report-template.md}
```

### Per-File Diffs (Staged Mode)

For `staged` mode, extract each file's individual diff:

```bash
git diff --cached -- {file_path}
```

Include this in that file's subagent prompt under the Diff section.

### Structure Mode — Special Case

For `structure` mode, dispatch a **single subagent**. The target is the project root, not a single file. Modify the prompt to instruct the subagent to use Glob and Bash (`ls`) to examine the directory layout holistically, rather than reading a single file. Structure audits always use **full** tier.

---

## Step 6: Compile Unified Report

After all subagents return, validate their output before compiling.

### Handling Empty or Failed Returns

If a subagent returns empty output or no report content:
- Mark that file with verdict **AUDIT ERROR**
- Include it in the Per-File Reports section with: "Subagent completed but returned no report. Re-run `/audit component {file_path}` to audit individually."
- **Do not attempt to audit the file inline** — a silent fallback produces a report that looks valid but wasn't generated by the correct process
- Count AUDIT ERROR files separately in the Overall Summary

If **all** subagents return empty, stop and report:
> All subagents returned empty output. Try auditing a single file with `/audit component {path}` to diagnose.

Otherwise, compile all valid reports into a unified summary.

### Unified Report Format

```markdown
# Audit Report

**Mode**: {staged | component | page | service | directory | structure}
**Files Audited**: {count} ({n} full, {n} lightweight)
**Date**: {YYYY-MM-DD}

---

## Overall Summary

| Verdict | Files |
|---------|-------|
| PASS | {n} |
| PASS WITH WARNINGS | {n} |
| FAIL | {n} |
| AUDIT ERROR | {n} |

| Severity | Total |
|----------|-------|
| Errors | {n} |
| Warnings | {n} |
| Suggestions | {n} |

---

## Cross-Cutting Concerns

> Patterns found across multiple files. Address these systematically.

### {Pattern description}
- **Criteria**: {ID, e.g., C.1}
- **Severity**: {Error | Warning}
- **Affected files**: {list}
- **Action**: {one-sentence fix guidance}

{If none: "None identified."}

---

## Per-File Reports

{Include each subagent report verbatim, ordered by:}
{1. FAIL verdict first}
{2. PASS WITH WARNINGS second}
{3. PASS last}

---

## Skipped Files

{Files skipped during classification, with reason. If none: "None."}

---

## Next Steps

{Actionable items ordered by impact, e.g.:}
1. Fix all Errors (blocks passing audit)
2. Address cross-cutting warnings
3. Review per-file suggestions
```

### Save Report to File

After displaying the unified report to the user, persist it to the `audits/` directory at the project root.

**Filename format**: `audits/{mode}-{YYYY-MM-DD}-{HHmmss}.md`

- `{mode}` — the audit mode (`staged`, `component`, `page`, `service`, `directory`, `structure`)
- `{YYYY-MM-DD}-{HHmmss}` — timestamp at audit completion (e.g., `143022` for 2:30:22 PM)

Examples:
- `audits/staged-2026-02-18-143022.md`
- `audits/component-2026-02-18-091503.md`
- `audits/directory-2026-02-18-160045.md`

Use the **Write** tool to create the file. The `audits/` directory is gitignored — reports are local-only reference artifacts.

After writing, confirm to the user:

```
Report saved to audits/{filename}.
```

### Cross-Cutting Detection

Scan all returned reports for findings sharing the same **criteria ID** across 2+ files. Group these as cross-cutting concerns. Common examples:
- C.1 (hardcoded colors) in multiple components
- C.6 (missing `aria-label`) across icon buttons
- S.4 (repo calling `commit()`) in multiple repositories
- G.4 (`any` type usage) across files

---

## Step 7: Write Audit Manifest

After displaying the unified report, write a machine-readable manifest so the `/git commit` workflow can verify that staged files were audited before committing.

**Manifest path**: `.claude/last-audit.json` (project root, gitignored)

### When to Write

Write the manifest when **all** of these are true:
- The audit mode is `staged` (other modes don't gate commits)
- At least one file was audited (not all skipped)
- The audit completed (even if some files FAIL)

**Do NOT write a manifest** for `component`, `page`, `service`, `directory`, or `structure` modes — these are ad-hoc audits not tied to the commit flow.

### Manifest Format

```json
{
  "timestamp": "2026-02-18T14:30:00Z",
  "files": {
    "frontend/src/components/recipe/RecipeBrowserView.tsx": {
      "blobHash": "<hash>",
      "verdict": "PASS",
      "tier": "full"
    },
    "frontend/src/components/layout/TopNav.tsx": {
      "blobHash": "<hash>",
      "verdict": "PASS WITH WARNINGS",
      "tier": "lightweight"
    }
  },
  "skipped": [
    "frontend/src/app/globals.css"
  ]
}
```

### How to Compute Blob Hashes

For each audited file, compute its blob hash from the **staged content** (not the working tree):

```bash
git ls-files -s -- <file_path>
```

This outputs the staged blob hash (column 2). Use that value — it fingerprints the exact content that was audited. If the file is edited after auditing, re-staging changes the hash and the commit workflow will detect the mismatch.

### Fields

| Field | Description |
|-------|-------------|
| `timestamp` | ISO 8601 timestamp of when the audit completed |
| `files` | Map of audited file paths → `{ blobHash, verdict, tier }` |
| `files[].blobHash` | Git blob hash of the staged content at audit time |
| `files[].verdict` | `"PASS"`, `"PASS WITH WARNINGS"`, or `"FAIL"` |
| `files[].tier` | `"full"` or `"lightweight"` — records which audit depth was applied |
| `skipped` | Array of file paths skipped during classification |

### Writing the Manifest

Use the **Write** tool to write the JSON to `.claude/last-audit.json`. Overwrite any existing manifest — only the most recent audit matters.

After writing, confirm to the user:

```
Audit manifest saved. Run `/git commit` when ready.
```

If any files have a `FAIL` verdict, also note:

```
⚠ {n} file(s) failed audit. `/git commit` will block until failures are resolved and re-audited.
```

---

## Error Handling

| Scenario | Action |
|---|---|
| No arguments provided | Display usage reference and stop |
| Unknown audit mode | Report `Unknown mode: {mode}`, display usage, stop |
| No staged files | Report "No staged files found" and stop |
| Invalid file path(s) | Report invalid paths, audit remaining valid files |
| Empty directory | Report "No auditable files in {path}" and stop |
| Subagent returns error | Include error in that file's section, continue with others |

---

## Example: Staged Audit

```bash
/audit staged
```

`git diff --cached --name-only` returns 4 files. After tiering:

| File | Type | Changed Lines | Tier |
|---|---|---|---|
| `RecipeBrowserView.tsx` | page | 243 | Full |
| `FilterSortControls.tsx` | component | 18 | Lightweight |
| `RecipeCard.tsx` | component | 4 | Lightweight |
| `backend/services/recipe/core.py` | service | 31 | Full |

→ 2 full subagents receive all reference standards inlined  
→ 2 lightweight subagents receive criteria + `general.md` only  
→ All 4 dispatched in parallel  
→ Unified report with cross-cutting analysis
