# General Audit Criteria

> Applied alongside every type-specific criteria file. Defines severity levels and cross-cutting standards.

---

## Severity Definitions

| Level | Meaning | Action |
|-------|---------|--------|
| **Error** | Violates a critical project rule (CLAUDE.md "Never Violate" rules, security issues, broken architecture boundaries) | Must fix. Blocks verdict. |
| **Warning** | Violates an established project pattern or best practice | Should fix. Does not block but degrades quality. |
| **Suggestion** | Opportunity to improve clarity, consistency, or maintainability | Consider fixing. No impact on verdict. |

## Verdict Logic

| Condition | Verdict |
|-----------|---------|
| 1+ Errors | **FAIL** |
| 0 Errors, 1+ Warnings | **PASS WITH WARNINGS** |
| 0 Errors, 0 Warnings | **PASS** |

---

## Checklist

### Imports & Dependencies

| # | Check | Severity | Grep Pattern |
|---|-------|----------|-------------|
| G.1 | Absolute imports using `@/` prefix (no relative `../` beyond one level) | Warning | `from '\.\./\.\./` |
| G.2 | Imports grouped by category: external → `@/components/ui` → `@/components` → `@/hooks` → `@/lib` → `@/types` | Suggestion | _(visual check)_ |
| G.3 | No unused imports | Warning | _(TypeScript compiler / visual check)_ |

### Type Safety

| # | Check | Severity | Grep Pattern |
|---|-------|----------|-------------|
| G.4 | No `any` type usage — use explicit types or generics | Warning | `: any[\s;,\)]` |
| G.5 | Exported functions have explicit return types | Suggestion | _(visual check)_ |
| G.6 | No type assertions (`as`) unless justified with comment | Suggestion | ` as [A-Z]` |

### Code Quality

| # | Check | Severity | Grep Pattern |
|---|-------|----------|-------------|
| G.7 | No commented-out code blocks (stale code, not explanatory comments) | Warning | _(visual check)_ |
| G.8 | No hardcoded magic strings/numbers for repeated values — use constants | Suggestion | _(visual check)_ |
| G.9 | File size within thresholds — ref `@.claude/context/frontend/structure.md` | Warning | _(line count)_ |

**File size thresholds:**
- Component: 500 lines
- Hook: 400 lines
- View: 700 lines

### Naming Conventions

| # | Check | Severity |
|---|-------|----------|
| G.10 | Components: PascalCase (file and export name) | Warning |
| G.11 | Hooks: camelCase with `use` prefix (file and export name) | Warning |
| G.12 | Types/Interfaces: PascalCase | Warning |
| G.13 | Variables/functions: camelCase | Suggestion |
