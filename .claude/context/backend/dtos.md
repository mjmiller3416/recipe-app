# DTOs (Pydantic Schemas)

**Pydantic v2 validation for request/response transformation.**

## Required Configuration

```python
from pydantic import BaseModel, ConfigDict

class EntityBaseDTO(BaseModel):
    # ✅ REQUIRED - allows reading from SQLAlchemy models
    model_config = ConfigDict(from_attributes=True)

    # Fields...
```

**Without `from_attributes=True`, `.from_model()` will fail.**

## DTO Types and Usage

| DTO Type | Purpose | Field Rules | Usage |
|----------|---------|-------------|-------|
| **CreateDTO** | New resource | All required fields | POST endpoints |
| **UpdateDTO** | Modify resource | ALL fields optional | PUT/PATCH endpoints |
| **ResponseDTO** | API output | Complete representation + id | All responses |
| **CardDTO** | Lightweight list | Minimal fields (id, name, image) | Lists/grids |
| **FilterDTO** | Query params | All optional | GET with filters |

## CreateDTO vs UpdateDTO

```python
# CreateDTO - required fields
class EntityCreateDTO(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    name: str = Field(..., min_length=1, max_length=255)
    category: str
    servings: int = Field(..., ge=1)
    description: Optional[str] = None  # Optional fields have default

# UpdateDTO - ALL fields optional (for partial updates)
class EntityUpdateDTO(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    category: Optional[str] = None
    servings: Optional[int] = Field(None, ge=1)
    description: Optional[str] = None

# Service uses exclude_unset to get only provided fields
update_data = dto.model_dump(exclude_unset=True)
```

## from_model() Pattern (CRITICAL)

```python
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.entity import Entity

class EntityResponseDTO(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: Optional[str]
    created_at: Optional[str]  # ISO format string, not datetime

    @classmethod
    def from_model(cls, entity: "Entity") -> "EntityResponseDTO":
        """Convert model to response DTO."""
        return cls(
            id=entity.id,
            name=entity.name,
            description=entity.description,
            # Convert datetime to ISO string
            created_at=entity.created_at.isoformat() if entity.created_at else None,
        )
```

## Validation Patterns

```python
from pydantic import Field, field_validator

class RecipeCreateDTO(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    servings: int = Field(..., ge=1, le=100)
    tags: List[str] = Field(default_factory=list)

    @field_validator("name", mode="before")
    @classmethod
    def strip_name(cls, v):
        """Strip whitespace."""
        if isinstance(v, str):
            return v.strip()
        return v

    @field_validator("tags")
    @classmethod
    def validate_tags(cls, v):
        """Enforce constraints."""
        if len(v) > 20:
            raise ValueError("Maximum 20 tags allowed")
        return v
```

## DateTime Handling (Store as ISO Strings)

```python
# ✅ Store as string in DTO
class EntityResponseDTO(BaseModel):
    created_at: Optional[str] = None  # ISO format string

    @classmethod
    def from_model(cls, entity: "Entity") -> "EntityResponseDTO":
        return cls(
            # Convert datetime to ISO string
            created_at=entity.created_at.isoformat() if entity.created_at else None
        )

# ❌ Don't store datetime objects in DTOs (serialization issues)
created_at: Optional[datetime] = None  # WRONG!
```

**See:** [app/dtos/recipe_dtos.py](../../backend/app/dtos/recipe_dtos.py) for complete reference implementation.
