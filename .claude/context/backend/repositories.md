# Repositories (Data Access Layer)

**Repositories NEVER commit - only flush(). Services handle transactions.**

## Critical Rule: NEVER Commit

```python
# ✅ Correct - Repository uses flush()
def create(self, dto: CreateDTO) -> Entity:
    entity = Entity(**dto.model_dump())
    self.session.add(entity)
    self.session.flush()  # Get ID without committing
    return entity

# ❌ NEVER DO THIS - Repository commits
def create(self, dto: CreateDTO) -> Entity:
    entity = Entity(**dto.model_dump())
    self.session.add(entity)
    self.session.commit()  # WRONG! Service's job!
    return entity
```

## Required Structure

```python
class EntityRepo:
    def __init__(self, session: Session, user_id: int):
        self.session = session
        self.user_id = user_id  # For tenant isolation
```

## User Isolation (CRITICAL)

**Every query MUST filter by user_id:**

```python
# ✅ Correct - filters by user_id
def get_all(self) -> List[Entity]:
    stmt = select(Entity).where(Entity.user_id == self.user_id)
    return list(self.session.scalars(stmt).all())

# ❌ SECURITY ISSUE - returns ALL users' data
def get_all(self) -> List[Entity]:
    stmt = select(Entity)  # Missing user_id filter!
    return list(self.session.scalars(stmt).all())
```

## Eager Loading (Avoid N+1 Queries)

```python
# ✅ Correct - single query with JOIN
stmt = (
    select(Recipe)
    .options(joinedload(Recipe.ingredients))
    .where(Recipe.id == recipe_id)
)
recipe = self.session.scalars(stmt).unique().first()  # .unique() is CRITICAL

# ❌ N+1 problem - separate query for EACH ingredient
recipe = self.session.get(Recipe, recipe_id)
for ing in recipe.ingredients:  # Triggers N queries!
    print(ing.name)
```

## What Repositories CANNOT Do

- ❌ Call `session.commit()` (services commit)
- ❌ Contain business logic or validation
- ❌ Raise domain exceptions (return None or empty lists)

## Error Handling

Repositories return `None` or `[]` - they don't raise domain exceptions. Services check results and raise exceptions.

```python
# ✅ Repository returns None
def get_by_id(self, id: int) -> Optional[Entity]:
    stmt = select(Entity).where(Entity.id == id, Entity.user_id == self.user_id)
    return self.session.scalars(stmt).first()  # Returns None if not found

# ✅ Service raises exception
def get(self, id: int) -> Entity:
    entity = self.repo.get_by_id(id)
    if not entity:
        raise EntityNotFoundError(f"Entity {id} not found")
    return entity
```

**See:** [app/repositories/recipe_repo.py](../../backend/app/repositories/recipe_repo.py) for complete reference implementation.
