# SQLAlchemy Models

**SQLAlchemy 2.0 style - ALWAYS use Mapped[] annotations.**

## Critical Rules

```python
# ✅ Correct - SQLAlchemy 2.0 style
from sqlalchemy.orm import Mapped, mapped_column

id: Mapped[int] = mapped_column(primary_key=True)
name: Mapped[str] = mapped_column(String(255), nullable=False)
description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

# ❌ Wrong - Old style (DO NOT USE)
id = Column(Integer, primary_key=True)
name = Column(String(255), nullable=False)
```

## Required on ALL Domain Models

```python
# User isolation (CRITICAL - ALWAYS include)
user_id: Mapped[int] = mapped_column(
    ForeignKey("users.id", ondelete="CASCADE"),
    index=True,  # REQUIRED for query performance
    nullable=False
)

user: Mapped["User"] = relationship("User", back_populates="entities")
```

**Why:**
- Ensures data scoped to user
- `ondelete="CASCADE"` auto-cleanup when user deleted
- `index=True` optimizes WHERE user_id queries

## Common Patterns Quick Reference

| Type | Pattern |
|------|---------|
| Primary key | `id: Mapped[int] = mapped_column(primary_key=True)` |
| Required string | `name: Mapped[str] = mapped_column(String(255), nullable=False)` |
| Optional string | `description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)` |
| Boolean w/ default | `is_active: Mapped[bool] = mapped_column(Boolean, default=True)` |
| DateTime w/ default | `created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)` |
| Indexed field | `category: Mapped[str] = mapped_column(String(100), index=True)` |
| Foreign key | `parent_id: Mapped[int] = mapped_column(ForeignKey("parent.id", ondelete="CASCADE"))` |

## Relationships (Critical Rules)

```python
# One-to-Many (parent side)
children: Mapped[List["Child"]] = relationship(
    "Child",
    back_populates="parent",
    cascade="all, delete-orphan"  # Delete children when parent deleted
)

# Many-to-One (child side)
parent_id: Mapped[int] = mapped_column(ForeignKey("parent.id"))
parent: Mapped["Parent"] = relationship("Parent", back_populates="children")
```

**CRITICAL: Always use `.unique()` after `joinedload`**

```python
# ✅ Prevents duplicate rows
stmt = select(Recipe).options(joinedload(Recipe.ingredients))
recipe = session.scalars(stmt).unique().first()

# ❌ Returns duplicates if multiple ingredients
recipe = session.scalars(stmt).first()  # WRONG!
```

## DateTime Pattern (Use timezone-aware)

```python
from datetime import datetime, timezone

def _utcnow() -> datetime:
    """Return current UTC datetime."""
    return datetime.now(timezone.utc)

created_at: Mapped[datetime] = mapped_column(
    DateTime(timezone=True),  # IMPORTANT: timezone=True
    default=_utcnow
)
```

## Constraints

```python
from sqlalchemy import UniqueConstraint, CheckConstraint, Index

__table_args__ = (
    UniqueConstraint('user_id', 'name', name='uq_user_recipe_name'),
    CheckConstraint('servings > 0', name='check_servings_positive'),
    Index('ix_user_date', 'user_id', 'planned_date'),
)
```

## What Models CANNOT Do

- ❌ Business logic or validation
- ❌ Database queries or session management
- ❌ Computed properties that require DB access

**See:** [app/models/recipe.py](../../backend/app/models/recipe.py) for complete reference implementation.
