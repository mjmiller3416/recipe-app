# Structure Audit Criteria

> File and directory organization audit checklist. Applied with `general.md`.
> Used for `/audit structure` and `/audit directory` commands.

## Reference Standards

- `@.claude/context/frontend/structure.md` — Component location rules, `_components` convention, file size thresholds, hooks organization, barrel exports, nesting depth
- `@.claude/context/frontend/component-inventory.md` — Available components and pre-flight checklist

---

## Checklist

### Frontend File Organization

| # | Check | Severity |
|---|-------|----------|
| T.1 | Components placed in correct directory per location rules — ref `@structure.md` | Warning |
| T.2 | Route-specific components in `app/[route]/_components/` with underscore prefix | Warning |
| T.3 | No cross-page `_components` imports — shared components belong in `components/` | Error |
| T.4 | File sizes within thresholds (component: 500, hook: 400, view: 700 lines) | Warning |
| T.5 | Domain types in `types/{domain}.ts` — component props defined inline | Warning |
| T.6 | Hooks in correct subfolder: `api/`, `forms/`, `persistence/`, `ui/` | Warning |
| T.7 | API client layer: one file per backend domain in `lib/api/` | Suggestion |
| T.8 | Max nesting depth: 3 organizational levels from `src/` | Warning |
| T.9 | Barrel exports (`index.ts`) used for directories with 3+ public exports | Suggestion |

### Backend File Organization

| # | Check | Severity |
|---|-------|----------|
| T.10 | Routes in `app/api/`, services in `app/services/`, repos in `app/repositories/`, models in `app/models/`, DTOs in `app/dtos/` | Error |
| T.11 | Complex services use modular package (Core + Mixins) — not a single oversized file | Warning |
| T.12 | Each service has a corresponding repository (not querying directly) | Warning |

### General Organization

| # | Check | Severity |
|---|-------|----------|
| T.13 | No orphaned files (files not imported or referenced anywhere) | Suggestion |
| T.14 | No duplicate functionality across files (two components/services doing the same thing) | Warning |
| T.15 | Utilities have descriptive names — not `utils2.ts` or `helpers-new.ts` | Warning |

---

## Common Anti-Patterns

| Pattern | Severity |
|---------|----------|
| Components in `components/` that are only used by one page (should be in `_components/`) | Suggestion |
| Page-specific types in `types/` instead of inline | Suggestion |
| Hook in root `hooks/` instead of a subfolder | Warning |
| Backend logic in wrong layer directory (e.g., business logic file in `api/`) | Error |
