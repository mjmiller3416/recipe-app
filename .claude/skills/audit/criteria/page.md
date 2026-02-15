# Page Audit Criteria

> Page-level file audit checklist. Applied with `general.md`.
> Covers both `page.tsx` files and their associated View components.

## Reference Standards

- `@.claude/context/frontend/frontend-core.md` — Critical rules and pre-edit checklist
- `@.claude/context/frontend/layout-patterns.md` — PageHeader composition API, standard page structure, spacing, responsive patterns
- `@.claude/context/frontend/data-fetching.md` — React Query patterns, guard order, query keys, mutations, cache invalidation
- `@.claude/context/frontend/structure.md` — View component location, `_components` convention

---

## Checklist

### Page Structure

| # | Check | Severity |
|---|-------|----------|
| P.1 | `page.tsx` is a thin wrapper — delegates to a View component, minimal logic | Warning |
| P.2 | View component lives in `app/[route]/_components/[Name]View.tsx` | Warning |
| P.3 | No imports from another page's `_components/` directory | Error |

### Data Fetching

| # | Check | Severity | Grep Pattern |
|---|-------|----------|-------------|
| P.4 | Uses React Query hooks (`useQuery`/`useMutation`) — not raw `fetch` or `useEffect` for data loading | Error | `useEffect.*fetch\(` |
| P.5 | Guard order: loading → error → empty → render (CRITICAL — all four states handled) | Error | _(visual: check conditional rendering order)_ |
| P.6 | Query keys use factory functions from `queryKeys.ts` — not inline arrays | Warning | `queryKey: \[` (inline array instead of factory) |
| P.7 | Stale times configured by data volatility — ref `@data-fetching.md` | Suggestion | _(visual check)_ |

### Mutations & Cache

| # | Check | Severity |
|---|-------|----------|
| P.8 | Mutations invalidate related query caches on success | Warning |
| P.9 | Optimistic updates include rollback on error (if used) | Warning |

### Layout

| # | Check | Severity |
|---|-------|----------|
| P.10 | Uses PageHeader composition API (PageHeaderContent, PageHeaderTitle, PageHeaderActions) — not custom header markup | Warning |
| P.11 | Consistent section spacing (space-y-6 between sections, space-y-4 within, gap-4 for items) | Suggestion |
| P.12 | Responsive grid patterns use standard breakpoints (md, lg, xl) | Suggestion |

### Loading & Suspense

| # | Check | Severity |
|---|-------|----------|
| P.13 | Loading skeleton provided for Suspense fallback or query loading state | Warning |
| P.14 | Skeleton shape approximates loaded content layout | Suggestion |

---

## Common Anti-Patterns

| Pattern | Severity |
|---------|----------|
| Fetching data in `page.tsx` instead of the View component | Warning |
| Multiple `useEffect` calls that could be a single React Query hook | Warning |
| Missing error boundary or error state handling | Error |
| Prop-drilling data through 3+ levels instead of using hooks | Suggestion |
