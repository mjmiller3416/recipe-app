# Backend Code Checklist

Use this checklist to audit backend code for compliance with project patterns and best practices.

## Architecture Compliance

### Layered Architecture
- [ ] **Routes only handle HTTP concerns** - No business logic in route functions
- [ ] **Services handle business logic** - Transaction management, orchestration
- [ ] **Repositories handle data access** - No commits, only queries and flush
- [ ] **Models define schema only** - Helper methods OK, but no business rules

### Layer Dependencies
- [ ] **Routes depend on Services** - Never import repos or models directly
- [ ] **Services depend on Repositories** - Never use raw session queries
- [ ] **Repositories depend on Models** - Direct session access is appropriate
- [ ] **No circular dependencies** - Clean import hierarchy

---

## Models

### SQLAlchemy 2.0 Style
- [ ] Uses `Mapped[Type]` annotations for all columns
- [ ] Uses `mapped_column()` instead of `Column()`
- [ ] Primary key defined with `primary_key=True, autoincrement=True`
- [ ] Relationships use `relationship()` with proper `back_populates`

### Field Definitions
- [ ] Required fields use `nullable=False`
- [ ] Optional fields use `Mapped[Optional[Type]]` and `nullable=True`
- [ ] String fields have appropriate length limits
- [ ] DateTime fields use `timezone=True`
- [ ] Fields with frequent queries have `index=True`

### Relationships
- [ ] Parent-child relationships have proper cascade rules
- [ ] `cascade="all, delete-orphan"` for owned children
- [ ] `ondelete="CASCADE"` or `ondelete="SET NULL"` on FK as needed
- [ ] `back_populates` matches on both sides

### Best Practices
- [ ] Has `__repr__` method for debugging
- [ ] `TYPE_CHECKING` used for circular import prevention
- [ ] Helper methods don't modify database state

---

## Repositories

### Query Patterns
- [ ] Uses SQLAlchemy 2.0 `select()` style
- [ ] Eager loading with `joinedload()` to prevent N+1
- [ ] Uses `.unique()` after `joinedload()` for collections
- [ ] Filter methods accept DTO parameters

### Transaction Handling
- [ ] **Never calls `session.commit()`** - Service responsibility
- [ ] Uses `session.flush()` when ID is needed before commit
- [ ] Uses `session.add()` for new entities
- [ ] Uses `session.delete()` for deletions

### Method Naming
- [ ] `get_by_id()` - Single entity lookup
- [ ] `get_all()` or `list_all()` - Full list
- [ ] `filter()` - Filtered query
- [ ] `create()` or `persist()` - New entity
- [ ] `update()` - Modify entity
- [ ] `delete()` - Remove entity
- [ ] `exists()` - Boolean check

---

## Services

### Transaction Management
- [ ] All write operations wrapped in try/except
- [ ] `session.commit()` called on success
- [ ] `session.rollback()` called on exception
- [ ] Re-raises domain exceptions (not swallowed)

### Exception Handling
- [ ] Uses domain-specific exceptions (not HTTPException)
- [ ] Exception messages are user-friendly
- [ ] Logs errors appropriately
- [ ] Never exposes internal details

### Business Logic
- [ ] Validation before database operations
- [ ] Duplicate checks before creation
- [ ] Authorization checks if applicable
- [ ] Related entity cleanup on deletion

### Dependencies
- [ ] Takes `session: Session` in constructor
- [ ] Creates repository instances internally
- [ ] Can accept multiple repositories if needed

---

## DTOs (Pydantic)

### Configuration
- [ ] Uses `model_config = ConfigDict(from_attributes=True)`
- [ ] All DTOs inherit from `BaseModel`
- [ ] Has appropriate `TYPE_CHECKING` imports

### Validation
- [ ] Required fields use `Field(...)` or just type annotation
- [ ] Optional fields use `Optional[Type]` with `None` default
- [ ] String fields have `min_length` / `max_length` as appropriate
- [ ] Numeric fields have `ge` / `le` constraints
- [ ] Pattern validation for constrained strings

### Field Validators
- [ ] `@field_validator` for string stripping
- [ ] Uses `mode="before"` for pre-validation transforms
- [ ] Handles `None` values appropriately

### DTO Types
- [ ] `CreateDTO` - All required fields for creation
- [ ] `UpdateDTO` - All optional fields for partial updates
- [ ] `ResponseDTO` - Full representation for API responses
- [ ] `CardDTO` - Lightweight for lists (if needed)
- [ ] `FilterDTO` - Query parameters with pagination

### Conversion Methods
- [ ] Has `from_model()` classmethod for model → DTO
- [ ] Handles None gracefully in conversion
- [ ] Converts datetime to ISO string format

---

## API Routes

### HTTP Standards
- [ ] GET for read operations (no body)
- [ ] POST for creation (201 status code)
- [ ] PUT for full updates
- [ ] PATCH for partial updates (if used)
- [ ] DELETE for removal

### Request Handling
- [ ] Uses `Query()` for query parameters
- [ ] Uses Pydantic models for request bodies
- [ ] Validates with `Depends(get_session)` for DB
- [ ] Path parameters have appropriate types

### Response Handling
- [ ] `response_model` specified for type safety
- [ ] Returns DTOs, not raw models
- [ ] Consistent response structure

### Error Handling
- [ ] Maps domain exceptions to HTTPException
- [ ] 404 for not found
- [ ] 409 for conflicts (duplicates)
- [ ] 400 for validation errors (Pydantic handles)
- [ ] 500 for unexpected errors

### Documentation
- [ ] Endpoint has docstring
- [ ] Query parameters documented
- [ ] Response model specified

---

## Database Migrations

### Migration Creation
- [ ] Uses descriptive name: `YYYYMMDD_description`
- [ ] Auto-generated with `--autogenerate` when possible
- [ ] Manual review of generated SQL

### Migration Content
- [ ] Has both `upgrade()` and `downgrade()` functions
- [ ] Downgrade reverses upgrade completely
- [ ] Handles data migration if needed
- [ ] Creates indexes for new foreign keys

### Safety
- [ ] No data loss in upgrade path
- [ ] Nullable columns for new required fields (then backfill)
- [ ] Index names are unique and descriptive

---

## Type Safety

### Type Hints
- [ ] All function parameters have type hints
- [ ] All function return types specified
- [ ] Uses `Optional[]` for nullable types
- [ ] Uses `list[]` (lowercase) for Python 3.9+

### Imports
- [ ] Uses `from __future__ import annotations` for forward refs
- [ ] `TYPE_CHECKING` for circular import prevention
- [ ] Proper generic types (`List`, `Dict`, `Optional`)

---

## Testing (if applicable)

### Test Structure
- [ ] Tests in `tests/` directory
- [ ] Test files named `test_*.py`
- [ ] Uses pytest fixtures for setup

### Test Coverage
- [ ] Happy path tested
- [ ] Error cases tested
- [ ] Edge cases considered

---

## Quick Audit Summary

| Area | Status | Notes |
|------|--------|-------|
| Architecture | ⬜ | |
| Models | ⬜ | |
| Repositories | ⬜ | |
| Services | ⬜ | |
| DTOs | ⬜ | |
| Routes | ⬜ | |
| Migrations | ⬜ | |
| Type Safety | ⬜ | |

Legend: ✅ Compliant | ⚠️ Needs Review | ❌ Non-compliant | ⬜ Not Checked