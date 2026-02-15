# Audit Report Template

> Standardized output format for auditor subagent summaries. Use this template exactly.

---

## Format

```markdown
## Audit Report: {relative_file_path}

**Audit Type:** {component | page | service | structure}
**Criteria Applied:** {criteria_file} + general.md
**Verdict:** {PASS | PASS WITH WARNINGS | FAIL}

### Summary

| Severity | Count |
|----------|-------|
| Errors | {n} |
| Warnings | {n} |
| Suggestions | {n} |

---

### Findings

> List each finding ordered by severity (Errors first, then Warnings, then Suggestions).
> If no findings, write "No issues found." and skip to Notes.

#### {Error|Warning|Suggestion}: {criteria_id} — {short_title}

- **Location:** Line {n} (or "General" if file-wide)
- **Description:** {What the violation is and why it matters}
- **Code:**
  ```{lang}
  {offending code snippet — keep to relevant lines only}
  ```
- **Fix:**
  ```{lang}
  {proposed corrected code}
  ```

---

### Notes

> Optional. Positive observations, context about tradeoffs, or items that were close calls.
> Keep brief — 1-3 sentences max.
```

## Rules

1. **One finding per checklist item** — if the same violation appears multiple times, list the first occurrence and note "also at lines X, Y, Z"
2. **Concrete fixes only** — every Error and Warning must include a `Fix` code block. Suggestions may omit it if the improvement is subjective.
3. **Use criteria IDs** — reference the checklist item number (e.g., `C.5`, `G.4`, `S.1`) so findings trace back to specific criteria
4. **Keep code snippets minimal** — show only the relevant lines, not entire functions
5. **Verdict is mechanical** — apply the verdict logic from `general.md`, no subjective overrides
