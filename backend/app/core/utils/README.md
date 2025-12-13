# Core Utilities

Small, reusable helpers that handle **low-level, cross-cutting operations** shared across the application.

## Traits of a Core Utility

- **Plumbing, not policy** → Provides foundational behavior, not business rules.
- **Reusable** → Shared across multiple services, modules, or layers.
- **Stateless or minimally stateful** → Prefer pure functions; minimal caching allowed.
- **Supporting role** → Enables workflows but doesn’t decide them.
- **Clear dependency rules** → No imports from `ui`, `services`, or feature modules.
- **Deterministic and testable** → Pure in/out whenever possible.

## What belongs here

- String formatting, parsing, slugifying
- Type coercion: `safe_int`, `to_bool`, etc.
- Date/time utilities
- File/path manipulation
- Converters between generic framework types (e.g., QImage <-> bytes)
- Lightweight numerical/unit conversions

## What doesn’t belong

- Business rules or workflow coordination
- UI imports or widget creation
- Service, repository, or database access
- Config lookups or global state

## Folder structure suggestion

```
app/core/utils/
  __init__.py
  strings.py
  collections.py
  coercion.py
  time.py
  paths.py
  images.py
  numeric.py
  units.py
  concurrency.py
  errors.py
  README.md
```
