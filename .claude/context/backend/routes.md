# API Routes (FastAPI)

**Routes handle HTTP only - no business logic. Map domain exceptions to HTTP status codes.**

## Route Responsibilities

**Routes handle:**
- HTTP request/response
- Request validation (via Pydantic)
- Dependency injection (session, current_user)
- Error mapping (domain exceptions → HTTP status codes)
- DTO conversion (models → response DTOs)

**Routes CANNOT:**
- ❌ Contain business logic or validation
- ❌ Make direct database queries
- ❌ Import models directly for responses (use DTOs)
- ❌ Call repositories directly (use services)

## Required Structure

```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.db import get_session
from app.api.dependencies import get_current_user

router = APIRouter()

@router.get("/{entity_id}", response_model=EntityResponseDTO)
def get_entity(
    entity_id: int,
    session: Session = Depends(get_session),
    current_user: dict = Depends(get_current_user),
):
    service = EntityService(session, current_user["id"])
    try:
        entity = service.get(entity_id)
        return EntityResponseDTO.from_model(entity)
    except EntityNotFoundError:
        raise HTTPException(status_code=404, detail="Entity not found")
```

## Error Mapping (CRITICAL)

**Map domain exceptions to HTTP status codes:**

| Domain Exception | HTTP Status | Usage |
|-----------------|-------------|-------|
| `NotFoundError` | 404 | Resource doesn't exist |
| `DuplicateError` | 409 | Resource already exists |
| `LimitError` | 409 | Constraint exceeded |
| `ValidationError` | 400 | Invalid input data |
| `SaveError` / `DeleteError` | 500 | Database failure |
| Pydantic `ValidationError` | 422 | Request body validation (automatic) |

```python
@router.post("", response_model=EntityResponseDTO, status_code=201)
def create_entity(
    data: EntityCreateDTO,
    session: Session = Depends(get_session),
    current_user: dict = Depends(get_current_user),
):
    service = EntityService(session, current_user["id"])
    try:
        entity = service.create(data)
        return EntityResponseDTO.from_model(entity)

    # Map domain exceptions to HTTP status codes
    except DuplicateEntityError as e:
        raise HTTPException(status_code=409, detail=str(e))
    except EntityValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except EntitySaveError as e:
        raise HTTPException(status_code=500, detail=str(e))
```

## Query Parameters with Validation

```python
from typing import Optional
from fastapi import Query

@router.get("", response_model=List[EntityResponseDTO])
def list_entities(
    category: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    sort_order: str = Query("asc", pattern="^(asc|desc)$"),
    session: Session = Depends(get_session),
    current_user: dict = Depends(get_current_user),
):
    filter_dto = EntityFilterDTO(
        category=category,
        search=search,
        limit=limit,
        offset=offset,
        sort_order=sort_order,
    )
    service = EntityService(session, current_user["id"])
    entities = service.list_filtered(filter_dto)
    return [EntityResponseDTO.from_model(e) for e in entities]
```

## HTTP Method Mapping

| Method | Purpose | Status | Idempotent |
|--------|---------|--------|------------|
| GET | Retrieve resource(s) | 200 | Yes |
| POST | Create new resource | 201 | No |
| PUT | Full update | 200 | Yes |
| PATCH | Partial update | 200 | No |
| DELETE | Remove resource | 200/204 | Yes |

## Router Registration (main.py)

```python
from fastapi import FastAPI
from app.api import entities, recipes

app = FastAPI()

app.include_router(
    entities.router,
    prefix="/api/entities",
    tags=["entities"]
)
```

**See:** [app/api/recipes.py](../../backend/app/api/recipes.py) for complete reference implementation.
