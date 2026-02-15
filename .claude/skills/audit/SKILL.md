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
Map audit type → criteria + context files
        ↓
Read criteria, context, and report template files
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

No file list needed. This dispatches a single subagent to examine overall project layout. Skip directly to Step 3 with audit type `structure`.

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

## Step 3: Load Criteria and Resolve Context References

For the matched audit type, read these files:

1. **Type-specific criteria**: `.claude/skills/audit/criteria/{type}.md` (e.g., `component.md`, `page.md`, `service.md`, `structure.md`)
2. **General criteria**: `.claude/skills/audit/criteria/general.md` (always included)
3. **Report template**: `.claude/skills/audit/report-template.md` (always included)

Then parse the criteria file's **Reference Standards** section for `@` references. Each `@`-prefixed path is project-root-relative.

**Resolution rule**: Extract all paths matching `` `@<path>` `` from the criteria file. Read each `<path>` relative to the project root. These become the subagent's reference context.

If a referenced file doesn't exist, log a warning and continue — don't abort the audit.

---

## Step 4: Dispatch Subagents

Dispatch **one Task subagent per file**, all in parallel (single message with multiple Task calls).

### Task Parameters

- **`subagent_type`**: `"auditor"`
- **`description`**: `"Audit {filename}"`

### Subagent Prompt Template

Build each subagent's prompt by inlining all necessary content. The auditor agent definition provides the workflow, role, and constraints automatically — the prompt only needs to supply the task-specific data.

```
## Target

- **File**: {file_path}
- **Audit Type**: {component | page | service | structure}

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

## Reference Standards

{for each context file in the mapping:}

### {context filename}

{full contents of the context file}

{end for each}

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

For `structure` mode, dispatch a **single subagent**. The target is the project root, not a single file. Modify the prompt to instruct the subagent to use Glob and Bash (`ls`) to examine the directory layout holistically, rather than reading a single file.

---

## Step 5: Compile Unified Report

After all subagents return, compile their reports into a unified summary.

### Unified Report Format

```markdown
# Audit Report

**Mode**: {staged | component | page | service | directory | structure}
**Files Audited**: {count}
**Date**: {YYYY-MM-DD}

---

## Overall Summary

| Verdict | Files |
|---------|-------|
| PASS | {n} |
| PASS WITH WARNINGS | {n} |
| FAIL | {n} |

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

### Cross-Cutting Detection

Scan all returned reports for findings sharing the same **criteria ID** across 2+ files. Group these as cross-cutting concerns. Common examples:
- C.1 (hardcoded colors) in multiple components
- C.6 (missing `aria-label`) across icon buttons
- S.4 (repo calling `commit()`) in multiple repositories
- G.4 (`any` type usage) across files

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
| All subagents fail | Report errors, suggest checking file paths |

---

## Examples

### Staged Files

```bash
/audit staged
```

`git diff --cached --name-only` returns:
- `frontend/src/components/recipe/RecipeCard.tsx` → **component** audit
- `frontend/src/app/recipes/_components/RecipesView.tsx` → **page** audit
- `backend/app/services/recipe/core.py` → **service** audit

→ 3 subagents dispatched in parallel, each with appropriate criteria and context
→ Unified report with cross-cutting analysis

### Specific Components

```bash
/audit component frontend/src/components/common/StatCard.tsx frontend/src/components/recipe/RecipeCard.tsx
```

→ 2 subagents, both with `component.md` + `general.md` criteria
→ Compiled report highlights shared patterns between the two

### Directory

```bash
/audit directory backend/app/services
```

→ Globs all `.py` files in services directory
→ All classified as **service** audit type
→ Cross-cutting analysis reveals systematic patterns (e.g., missing rollback across services)
