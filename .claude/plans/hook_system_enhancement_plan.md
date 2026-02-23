# Hook System Enhancement Plan

## Summary

8 changes across 8 files: convert frontend auditor to Node.js for line-level checking, add backend auditor, fix context duplication, improve logging, remove verbose badges, add .ts routing and log rotation.

---

## Execution Order

### 1. Create `.claude/hooks/design-auditor.mjs` (NEW)

Node.js replacement for the bash design-auditor. Line-level checking with per-occurrence validation.

**Structure:**
- Read stdin JSON, parse `tool_input.file_path`
- Early exit: skip non-tsx, skip `components/ui/*.tsx`
- Read file, split into lines
- Extract imports (track Card, Button, react-icons, etc.)
- Run checks line-by-line, collect `{line, rule, message, snippet}`
- Output: JSON `{systemMessage}` to stdout on pass, violations to stderr + exit 2 on block

**Checks (11 rules):**

| # | Rule ID | What it catches | Scope |
|---|---------|----------------|-------|
| 1 | `hardcoded-gray` | `text-gray-500`, `bg-slate-800`, etc. | Any string on line (className, cn, clsx) |
| 2 | `arbitrary-pixels` | `[38px]`, `[15px]`, etc. | Any string on line |
| 3 | `fixed-container-width` | `w-[Npx]` where N > 48 on div/section/main | Line-level, whitelists small sizes |
| 4 | `page-missing-max-width` | Top-level wrapper without `max-w-` | Only in `page.tsx`/`layout.tsx` files |
| 5 | `icon-button-aria` | `<Button size="icon"` without `aria-label` | Per-element (same line or adjacent lines) |
| 6 | `fake-card` | `<div` with `bg-card` but no Card import | Line + import check |
| 7 | `fake-button` | `<div`/`<span` with `onClick` without `role="button"` | Per-element on same line |
| 8 | `hardcoded-color` | `text-red-500`, `bg-blue-600`, etc. | Per-occurrence on line |
| 9 | `image-fixed-width` | `<img`/`<Image` with `width=` but no responsive class | Per-element |
| 10 | `non-lucide-icons` | `from 'react-icons'`, `from '@heroicons'` | Import check |
| 11 | `missing-stroke-width` | Lucide icon usage without `strokeWidth={1.5}` nearby | Best-effort line check |

**Enhanced log format:**
```
[HH:MM:SS] design-auditor | File.tsx | Checked: 11 rules | ✓ PASS
[HH:MM:SS] design-auditor | File.tsx | Checked: 11 rules | ✗ BLOCKED [hardcoded-gray:L42, icon-button-aria:L87]
```

**No external dependencies** — uses only `fs`, `path`, `process` (Node builtins).

---

### 2. Create `.claude/hooks/backend-auditor.sh` (NEW)

Bash script for backend architectural rule enforcement. File-level grep is appropriate here because violations are binary (a service should NEVER import HTTPException).

**Checks by file type:**

| File Type | Rule ID | Pattern |
|-----------|---------|---------|
| `*/services/**/*.py` | `service-httpexception-import` | `from fastapi.*import.*HTTPException` |
| `*/services/**/*.py` | `service-httpexception-raise` | `raise HTTPException(` |
| `*/repositories/**/*.py` | `repo-commit` | `\.commit()` |
| `*/api/**/*.py` | `route-imports-models` | `from app\.models` or `from app.models` |
| `*/services/**/*.py`, `*/repositories/**/*.py` | `missing-return-type` | `def method(...):` without `->` (exclude `__init__`, `__repr__`) |

**Scope:** Only `backend/app/**/*.py`. Early exit for non-Python and non-backend files.

**Same enhanced log format as design-auditor.**

---

### 3. Modify `.claude/hooks/context-router.sh`

Three changes:

**a) Add `.ts` file handling** in `load_frontend_context()`:
- Add `*.ts` case before the existing `*.tsx` case
- Route `hooks/forms/*.ts` to `form-patterns.md`
- Route new `.ts` files to `file-organization.md`
- Do NOT load `accessibility.md` for `.ts` files (not UI code)

**b) Replace ASCII badge boxes** (lines 195-220) with single-line messages:
- Frontend: `"Frontend context loaded for {filename}"`
- Backend: `"Backend context loaded for {filename}"`

**c) Add log rotation** at the top of the script:
- If `hooks.log` exceeds 500 lines, truncate to the last 200

---

### 4. Modify `.claude/hooks/memory-refresh.sh`

Replace the ASCII badge box (lines 39-58) with a compact single-line systemMessage:
```
"Memory refresh (edit #N): Enforce semantic tokens, shadcn components, Tailwind scale, aria-labels, lucide icons (frontend). Services commit, repos flush, domain exceptions, type hints, layered architecture (backend)."
```

---

### 5. Modify `.claude/hooks/session-init.sh`

Two changes:

**a) Create marker files** after loading context. Parse `session_id` from input, compute marker paths using the same cross-platform temp logic as context-router, then `touch` both `$FRONTEND_MARKER` and `$BACKEND_MARKER`. This prevents context-router from re-loading core context on the first post-compaction edit.

**b) Replace ASCII badge box** with a compact single-line systemMessage.

---

### 6. Update `.claude/settings.json`

- Change PostToolUse design-auditor command: `bash .claude/hooks/design-auditor.sh` → `node .claude/hooks/design-auditor.mjs`
- Add backend-auditor as second PostToolUse hook:
  ```json
  {
    "type": "command",
    "command": "bash .claude/hooks/backend-auditor.sh",
    "timeout": 10
  }
  ```

---

### 7. Update `.claude/HOOKS.md`

- Add `backend-auditor.sh` to the hook scripts list
- Update design-auditor description to mention Node.js
- Update log format examples to show enhanced format with rule names
- Remove `test-hooks.sh` reference from troubleshooting (line ~144, file doesn't exist)
- Add "Backend Architecture Auditor" section documenting the 5 checks
- Update marker file documentation to note session-init creates them

---

### 8. Delete `.claude/hooks/design-auditor.sh`

Only after step 6 (settings.json already points to `.mjs`).

---

## Verification

After all changes:

1. **Syntax check**: `node --check .claude/hooks/design-auditor.mjs` (no runtime, just parse)
2. **Syntax check**: `bash -n .claude/hooks/backend-auditor.sh`
3. **Syntax check**: `bash -n .claude/hooks/context-router.sh`
4. **Syntax check**: `bash -n .claude/hooks/memory-refresh.sh`
5. **Syntax check**: `bash -n .claude/hooks/session-init.sh`
6. **JSON validation**: `jq . .claude/settings.json` (valid JSON)
7. **Functional test**: Pipe test JSON into each hook script and verify output format
8. **Integration**: Make a small edit to a frontend .tsx file, check hooks.log for new format

---

## Files Touched

| File | Action |
|------|--------|
| `.claude/hooks/design-auditor.mjs` | Create |
| `.claude/hooks/backend-auditor.sh` | Create |
| `.claude/hooks/context-router.sh` | Modify |
| `.claude/hooks/memory-refresh.sh` | Modify |
| `.claude/hooks/session-init.sh` | Modify |
| `.claude/settings.json` | Modify |
| `.claude/HOOKS.md` | Modify |
| `.claude/hooks/design-auditor.sh` | Delete |
