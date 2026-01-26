# Backend Patterns Reference

This document provides detailed patterns for each layer of the backend architecture.

## 1. Models (SQLAlchemy ORM)

Models define database tables using SQLAlchemy 2.0 style with `Mapped` type annotations.

### Basic Model Template

```python
"""app/models/entity.py

SQLAlchemy model for [entity description].
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import Boolean, DateTime, Integer, String, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


def _utcnow() -> datetime:
    """Return current UTC datetime."""
    return datetime.now(timezone.utc)


class Entity(Base):
    __tablename__ = "entity"

    # Primary key
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    # Required fields
    name: Mapped[str] = mapped_column(String(255), nullable=False)

    # Optional fields
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Fields with defaults
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow
    )

    # Indexed fields (for frequent queries)
    category: Mapped[str] = mapped_column(String(100), nullable=False, index=True)

    # Foreign keys
    parent_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("parent.id", ondelete="CASCADE"), nullable=True
    )

    # Relationships
    parent: Mapped[Optional["Parent"]] = relationship(
        "Parent", back_populates="children"
    )
    children: Mapped[List["Child"]] = relationship(
        "Child",
        back_populates="entity",
        cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"Entity(id={self.id}, name={self.name})"
```

### Relationship Patterns

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

# Many-to-One with SET NULL on delete
parent_id: Mapped[Optional[int]] = mapped_column(
    ForeignKey("parent.id", ondelete="SET NULL"), nullable=True
)

# Self-referential relationship
parent_id: Mapped[Optional[int]] = mapped_column(
    ForeignKey("entity.id"), nullable=True
)
children: Mapped[List["Entity"]] = relationship(
    "Entity",
    backref=backref("parent", remote_side=[id])
)
```

---

## 2. Repositories (Data Access)

Repositories handle all direct database queries. They do NOT commit transactions.

### Basic Repository Template

```python
"""app/repositories/entity_repo.py

Repository layer for Entity model.
"""

from typing import Optional, List

from sqlalchemy import select, func, delete
from sqlalchemy.orm import Session, joinedload

from app.models.entity import Entity
from app.dtos.entity_dtos import EntityCreateDTO, EntityFilterDTO


class EntityRepo:
    """Handles direct DB queries for the Entity model."""

    def __init__(self, session: Session):
        self.session = session

    # ── Create ───────────────────────────────────────────────────────────
    def create(self, dto: EntityCreateDTO) -> Entity:
        """Create a new entity."""
        entity = Entity(
            name=dto.name,
            description=dto.description,
            category=dto.category,
        )
        self.session.add(entity)
        self.session.flush()  # Get ID without committing
        return entity

    # ── Read ─────────────────────────────────────────────────────────────
    def get_by_id(self, entity_id: int) -> Optional[Entity]:
        """Get entity by ID with eager-loaded relationships."""
        stmt = (
            select(Entity)
            .options(joinedload(Entity.children))
            .where(Entity.id == entity_id)
        )
        return self.session.scalars(stmt).unique().first()

    def get_all(self) -> List[Entity]:
        """Get all entities."""
        stmt = select(Entity).order_by(Entity.name)
        return list(self.session.scalars(stmt).all())

    def filter(self, filter_dto: EntityFilterDTO) -> List[Entity]:
        """Filter entities based on criteria."""
        stmt = select(Entity)

        if filter_dto.category:
            stmt = stmt.where(Entity.category == filter_dto.category)

        if filter_dto.search_term:
            pattern = f"%{filter_dto.search_term}%"
            stmt = stmt.where(Entity.name.ilike(pattern))

        if filter_dto.is_active is not None:
            stmt = stmt.where(Entity.is_active == filter_dto.is_active)

        # Sorting
        if filter_dto.sort_by:
            column = getattr(Entity, filter_dto.sort_by, None)
            if column:
                if filter_dto.sort_order == "desc":
                    stmt = stmt.order_by(column.desc())
                else:
                    stmt = stmt.order_by(column.asc())

        # Pagination
        if filter_dto.offset:
            stmt = stmt.offset(filter_dto.offset)
        if filter_dto.limit:
            stmt = stmt.limit(filter_dto.limit)

        return list(self.session.scalars(stmt).unique().all())

    def exists(self, name: str) -> bool:
        """Check if entity with name exists (case-insensitive)."""
        stmt = select(func.count()).where(
            func.lower(Entity.name) == name.lower()
        )
        return self.session.execute(stmt).scalar() > 0

    # ── Update ───────────────────────────────────────────────────────────
    def update(self, entity: Entity, **kwargs) -> Entity:
        """Update entity fields."""
        for key, value in kwargs.items():
            if hasattr(entity, key):
                setattr(entity, key, value)
        return entity

    # ── Delete ───────────────────────────────────────────────────────────
    def delete(self, entity: Entity) -> None:
        """Delete an entity."""
        self.session.delete(entity)

    def delete_by_id(self, entity_id: int) -> bool:
        """Delete entity by ID. Returns True if deleted."""
        entity = self.get_by_id(entity_id)
        if entity:
            self.session.delete(entity)
            return True
        return False
```

### Query Patterns

```python
# Avoid N+1 with joinedload
stmt = (
    select(Recipe)
    .options(
        joinedload(Recipe.ingredients),
        joinedload(Recipe.history),
    )
    .where(Recipe.id == recipe_id)
)

# Aggregate queries
stmt = (
    select(func.count())
    .select_from(Entity)
    .where(Entity.is_active == True)
)
count = self.session.execute(stmt).scalar()

# Subqueries
subquery = (
    select(Child.parent_id)
    .where(Child.status == "active")
    .subquery()
)
stmt = select(Parent).where(Parent.id.in_(subquery))
```

---

## 3. Services (Business Logic)

Services orchestrate business logic and manage transactions.

### Basic Service Template

```python
"""app/services/entity_service.py

Service layer for Entity operations.
"""

from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.dtos.entity_dtos import (
    EntityCreateDTO,
    EntityUpdateDTO,
    EntityFilterDTO,
)
from app.models.entity import Entity
from app.repositories.entity_repo import EntityRepo


# ── Domain Exceptions ────────────────────────────────────────────────────
class EntitySaveError(Exception):
    """Raised when entity cannot be saved."""
    pass


class DuplicateEntityError(Exception):
    """Raised when entity with same name already exists."""
    pass


class EntityNotFoundError(Exception):
    """Raised when entity is not found."""
    pass


# ── Service ──────────────────────────────────────────────────────────────
class EntityService:
    """Service layer for managing entities."""

    def __init__(self, session: Session):
        self.session = session
        self.repo = EntityRepo(session)

    def create(self, dto: EntityCreateDTO) -> Entity:
        """Create a new entity with validation."""
        # Business rule: no duplicates
        if self.repo.exists(dto.name):
            raise DuplicateEntityError(
                f"Entity '{dto.name}' already exists."
            )

        try:
            entity = self.repo.create(dto)
            self.session.commit()
            return entity
        except SQLAlchemyError as e:
            self.session.rollback()
            raise EntitySaveError(f"Failed to create entity: {e}") from e

    def get(self, entity_id: int) -> Entity:
        """Get entity by ID or raise if not found."""
        entity = self.repo.get_by_id(entity_id)
        if not entity:
            raise EntityNotFoundError(f"Entity {entity_id} not found")
        return entity

    def get_or_none(self, entity_id: int) -> Optional[Entity]:
        """Get entity by ID or return None."""
        return self.repo.get_by_id(entity_id)

    def list_filtered(self, filter_dto: EntityFilterDTO) -> list[Entity]:
        """List entities with optional filters."""
        return self.repo.filter(filter_dto)

    def update(self, entity_id: int, dto: EntityUpdateDTO) -> Entity:
        """Update an existing entity."""
        entity = self.repo.get_by_id(entity_id)
        if not entity:
            raise EntityNotFoundError(f"Entity {entity_id} not found")

        try:
            # Only update provided fields
            update_data = dto.model_dump(exclude_unset=True)
            self.repo.update(entity, **update_data)
            self.session.commit()
            return entity
        except SQLAlchemyError as e:
            self.session.rollback()
            raise EntitySaveError(f"Failed to update entity: {e}") from e

    def delete(self, entity_id: int) -> bool:
        """Delete an entity by ID."""
        try:
            entity = self.repo.get_by_id(entity_id)
            if not entity:
                return False

            # Business logic before deletion
            self._cleanup_related_data(entity)

            self.repo.delete(entity)
            self.session.commit()
            return True
        except SQLAlchemyError as e:
            self.session.rollback()
            raise EntitySaveError(f"Failed to delete entity: {e}") from e

    def _cleanup_related_data(self, entity: Entity) -> None:
        """Clean up related data before deletion (if needed)."""
        # Implement any cleanup logic here
        pass
```

---

## 4. DTOs (Pydantic Schemas)

DTOs validate and transform data between API and internal layers.

### DTO Template

```python
"""app/dtos/entity_dtos.py

Pydantic DTOs for entity operations.
"""

from __future__ import annotations

from typing import TYPE_CHECKING, List, Optional
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

if TYPE_CHECKING:
    from app.models.entity import Entity


# ── Base DTO ─────────────────────────────────────────────────────────────
class EntityBaseDTO(BaseModel):
    """Base DTO with common fields."""

    model_config = ConfigDict(from_attributes=True)

    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    category: str = Field(..., min_length=1)

    @field_validator("name", "category", mode="before")
    @classmethod
    def strip_strings(cls, v):
        if isinstance(v, str):
            return v.strip()
        return v


# ── Create DTO ───────────────────────────────────────────────────────────
class EntityCreateDTO(EntityBaseDTO):
    """DTO for creating a new entity."""
    pass


# ── Update DTO ───────────────────────────────────────────────────────────
class EntityUpdateDTO(BaseModel):
    """DTO for updating an entity. All fields optional."""

    model_config = ConfigDict(from_attributes=True)

    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    category: Optional[str] = Field(None, min_length=1)
    is_active: Optional[bool] = None

    @field_validator("name", "category", mode="before")
    @classmethod
    def strip_strings(cls, v):
        if isinstance(v, str) and v:
            return v.strip()
        return v


# ── Response DTO ─────────────────────────────────────────────────────────
class EntityResponseDTO(EntityBaseDTO):
    """DTO for API responses."""

    id: int
    is_active: bool = True
    created_at: Optional[str] = None  # ISO format

    @classmethod
    def from_model(cls, entity: "Entity") -> "EntityResponseDTO":
        """Convert model to response DTO."""
        return cls(
            id=entity.id,
            name=entity.name,
            description=entity.description,
            category=entity.category,
            is_active=entity.is_active,
            created_at=entity.created_at.isoformat() if entity.created_at else None,
        )


# ── Card DTO (lightweight) ───────────────────────────────────────────────
class EntityCardDTO(BaseModel):
    """Lightweight DTO for lists/grids."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    category: Optional[str] = None

    @classmethod
    def from_model(cls, entity: "Entity") -> "EntityCardDTO":
        return cls(
            id=entity.id,
            name=entity.name,
            category=entity.category,
        )


# ── Filter DTO ───────────────────────────────────────────────────────────
class EntityFilterDTO(BaseModel):
    """DTO for filtering queries."""

    model_config = ConfigDict(from_attributes=True)

    category: Optional[str] = None
    search_term: Optional[str] = None
    is_active: Optional[bool] = None
    sort_by: Optional[str] = Field(
        None, pattern="^(name|created_at|category)$"
    )
    sort_order: Optional[str] = Field("asc", pattern="^(asc|desc)$")
    limit: Optional[int] = Field(None, ge=1, le=100)
    offset: Optional[int] = Field(None, ge=0)
```

---

## 5. API Routes (FastAPI)

Routes handle HTTP concerns: validation, routing, and error mapping.

### Route Template

```python
"""app/api/entities.py

FastAPI router for entity endpoints.
"""

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database.db import get_session
from app.dtos.entity_dtos import (
    EntityCreateDTO,
    EntityUpdateDTO,
    EntityResponseDTO,
    EntityCardDTO,
    EntityFilterDTO,
)
from app.services.entity_service import (
    EntityService,
    EntityNotFoundError,
    DuplicateEntityError,
    EntitySaveError,
)

router = APIRouter()


# ── List ─────────────────────────────────────────────────────────────────
@router.get("", response_model=List[EntityResponseDTO])
def list_entities(
    category: Optional[str] = Query(None),
    search_term: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    sort_by: Optional[str] = Query(None, pattern="^(name|created_at)$"),
    sort_order: str = Query("asc", pattern="^(asc|desc)$"),
    limit: Optional[int] = Query(None, ge=1, le=100),
    offset: Optional[int] = Query(None, ge=0),
    session: Session = Depends(get_session),
):
    """List entities with optional filters."""
    filter_dto = EntityFilterDTO(
        category=category,
        search_term=search_term,
        is_active=is_active,
        sort_by=sort_by,
        sort_order=sort_order,
        limit=limit,
        offset=offset,
    )
    service = EntityService(session)
    entities = service.list_filtered(filter_dto)
    return [EntityResponseDTO.from_model(e) for e in entities]


@router.get("/cards", response_model=List[EntityCardDTO])
def list_entity_cards(
    category: Optional[str] = Query(None),
    limit: Optional[int] = Query(None, ge=1, le=100),
    session: Session = Depends(get_session),
):
    """List entities as lightweight cards."""
    filter_dto = EntityFilterDTO(category=category, limit=limit)
    service = EntityService(session)
    entities = service.list_filtered(filter_dto)
    return [EntityCardDTO.from_model(e) for e in entities]


# ── Get One ──────────────────────────────────────────────────────────────
@router.get("/{entity_id}", response_model=EntityResponseDTO)
def get_entity(
    entity_id: int,
    session: Session = Depends(get_session),
):
    """Get a single entity by ID."""
    service = EntityService(session)
    try:
        entity = service.get(entity_id)
        return EntityResponseDTO.from_model(entity)
    except EntityNotFoundError:
        raise HTTPException(status_code=404, detail="Entity not found")


# ── Create ───────────────────────────────────────────────────────────────
@router.post("", response_model=EntityResponseDTO, status_code=201)
def create_entity(
    data: EntityCreateDTO,
    session: Session = Depends(get_session),
):
    """Create a new entity."""
    service = EntityService(session)
    try:
        entity = service.create(data)
        return EntityResponseDTO.from_model(entity)
    except DuplicateEntityError as e:
        raise HTTPException(status_code=409, detail=str(e))
    except EntitySaveError as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Update ───────────────────────────────────────────────────────────────
@router.put("/{entity_id}", response_model=EntityResponseDTO)
def update_entity(
    entity_id: int,
    data: EntityUpdateDTO,
    session: Session = Depends(get_session),
):
    """Update an existing entity."""
    service = EntityService(session)
    try:
        entity = service.update(entity_id, data)
        return EntityResponseDTO.from_model(entity)
    except EntityNotFoundError:
        raise HTTPException(status_code=404, detail="Entity not found")
    except EntitySaveError as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Delete ───────────────────────────────────────────────────────────────
@router.delete("/{entity_id}")
def delete_entity(
    entity_id: int,
    session: Session = Depends(get_session),
):
    """Delete an entity."""
    service = EntityService(session)
    try:
        if not service.delete(entity_id):
            raise HTTPException(status_code=404, detail="Entity not found")
        return {"message": "Entity deleted successfully"}
    except EntitySaveError as e:
        raise HTTPException(status_code=500, detail=str(e))
```

---

## 6. Alembic Migrations

### Creating a Migration

```bash
# Auto-generate from model changes
alembic revision --autogenerate -m "add_field_to_entity"

# Create empty migration for manual changes
alembic revision -m "custom_migration"
```

### Migration Template

```python
"""Add field to entity table

Revision ID: 20260115_add_field
Revises: previous_revision
Create Date: 2026-01-15

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers
revision = '20260115_add_field'
down_revision = 'previous_revision'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add new column
    op.add_column(
        'entity',
        sa.Column('new_field', sa.String(100), nullable=True)
    )

    # Add index
    op.create_index(
        'ix_entity_new_field',
        'entity',
        ['new_field']
    )


def downgrade() -> None:
    op.drop_index('ix_entity_new_field', table_name='entity')
    op.drop_column('entity', 'new_field')
```

### Common Migration Operations

```python
# Add column
op.add_column('table', sa.Column('field', sa.String(100), nullable=True))

# Drop column
op.drop_column('table', 'field')

# Add index
op.create_index('ix_table_field', 'table', ['field'])

# Add foreign key
op.add_column('child', sa.Column('parent_id', sa.Integer(), nullable=True))
op.create_foreign_key(
    'fk_child_parent',
    'child', 'parent',
    ['parent_id'], ['id'],
    ondelete='CASCADE'
)

# Alter column
op.alter_column('table', 'field',
    existing_type=sa.String(100),
    type_=sa.String(255),
    existing_nullable=True
)
```