---
description: Run batch audits on multiple UI components
argument-hint: [path-pattern]
---

Run the batch audit PowerShell script to audit multiple components for design system compliance.

**If an argument is provided:** Update the `$pattern` variable in `scripts/batch-audit.ps1` to match the provided path pattern: $ARGUMENTS

**Then execute the script:**
```
powershell -ExecutionPolicy Bypass -File scripts/batch-audit.ps1
```

**Important Notes:**
- This script runs the `/ds-fix` command on each file individually (full context per file)
- Results are saved to `audit-results/` directory as individual markdown files
- Each file gets the complete audit with all design system rules from `.claude/commands/audit.md`

**After completion:** Summarize how many files were audited, and highlight any common issues found across multiple files.