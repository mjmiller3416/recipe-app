# Meal Genie Backend Documentation

Reference for architecture decisions, patterns, and workflows. For API details, see FastAPI docs at `/docs`. For model/DTO fields, read the source files directly.

## Architecture Overview

```
Routes (app/api/) → Services (app/services/) → Repositories (app/repositories/) → Models (app/models/)
```

**Key principle:** Every route injects `current_user` via FastAPI dependency. Services and repos receive `(session, user_id)` to enforce tenant isolation. All domain models have a `user_id` foreign key.

```python
# Standard route pattern
@router.get("/things")
def list_things(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    service = ThingService(session, current_user.id)
    return service.list_all()
```

## Directory Structure

```
backend/app/
├── api/                    # Route handlers (including api/ai/ for AI endpoints)
│   └── dependencies.py     # Auth: get_current_user, require_pro
├── ai/                     # AI feature implementations
│   ├── config/             # Prompts and AI settings
│   ├── dtos/               # AI-specific request/response models
│   └── services/           # AI service logic
├── models/                 # SQLAlchemy ORM models
├── repositories/           # Data access layer
├── services/               # Business logic layer
├── dtos/                   # Pydantic validation models
├── core/auth_config.py     # Clerk auth settings
├── database/db.py          # DB connection and session
└── main.py                 # FastAPI app entry point
```

## Authentication & Multi-Tenancy

### Auth Flow

Uses Clerk JWT (RS256). The JWKS URL is auto-derived from the publishable key (base64 decode → Clerk frontend API → `/.well-known/jwks.json`).

```
Bearer Token → get_current_user dependency
    ├─ AUTH_DISABLED=true? → return dev user (DEV_USER_ID)
    ├─ Fetch & cache JWKS (1hr TTL)
    ├─ Decode JWT, extract claims (sub, email, name, picture)
    └─ get_or_create_from_clerk() → User
```

### Account Claiming

Pre-provisioned users (family members not yet signed up) have `clerk_id = "pending_claim"`. When they sign in with a matching email, `get_or_create_from_clerk()` claims the account and links it to their real Clerk identity. This preserves any data you've set up for them.

### Subscription Access

`User.has_pro_access` checks three paths:
1. `is_admin = True` — permanent bypass
2. `subscription_tier = "pro"` + `subscription_status = "active"`
3. `granted_pro_until > now()` — temporary access for testers

Use `require_pro` dependency to gate pro-only endpoints.

## Key Patterns

### Diff-Based Shopping Sync

Shopping list items aren't regenerated from scratch—they use **diff-based sync** to preserve user edits (checked status, manual additions).

How it works:
- `ShoppingItemContribution` tracks which planner entries contribute to each item
- `aggregation_key` format: `"ingredient_name::dimension"` (e.g., `"butter::mass"`)
- When planner changes, system compares desired vs actual state and applies minimal updates
- Recipe sources are computed from contributions, not stored as a field

Why: If you check off "chicken" and then add another meal with chicken, the checked status persists while the quantity updates.

### Shopping Modes

Planner entries have a `shopping_mode` enum:
- `normal` — contributes to shopping list
- `excluded` — doesn't contribute (eating out, leftovers)
- `manual` — user manually manages ingredients

### Unit Conversion

`app/utils/unit_conversion.py` handles dimension detection (mass/volume/count) for ingredient aggregation. Custom per-ingredient rules stored in `UnitConversionRule` model.

### Soft Delete for Planner

`PlannerEntry.is_cleared` is a soft-delete that hides entries from the active view but preserves cooking history for streak calculation.

## AI Features

All AI features use Google Gemini. Configuration lives in `app/ai/config/`, services in `app/ai/services/`.

**Meal Genie Assistant** (`meal_genie_service.py`):
- Conversational AI with function calling
- Uses `user_context_builder.py` to inject user's recipes, meals, planner state
- Personality tuned for encouraging, friendly tone

**Recipe Generation**: Creates full recipe with dual images (reference square + banner).

**Usage Tracking**: `UsageService` tracks monthly AI calls per user in `UserUsage` model.

## Adding a New Feature

1. **Model** (`app/models/new_feature.py`)
   ```python
   class NewFeature(Base):
       __tablename__ = "new_features"
       id: Mapped[int] = mapped_column(primary_key=True)
       name: Mapped[str] = mapped_column(String(255))
       user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
   ```

2. **DTOs** (`app/dtos/new_feature_dtos.py`) — Pydantic models for create/update/response

3. **Repository** (`app/repositories/new_feature_repo.py`) — takes `(session, user_id)`

4. **Service** (`app/services/new_feature_service.py`) — takes `(session, user_id)`, instantiates repo

5. **Routes** (`app/api/new_feature.py`) — uses `Depends(get_current_user)`

6. **Register** in `main.py`: `app.include_router(new_feature_router, prefix="/api/new-features")`

7. **Migration**: `alembic revision --autogenerate -m "add new_features table"`

## Migrations

```bash
alembic revision --autogenerate -m "description"  # Generate from model changes
alembic upgrade head                               # Apply pending
alembic downgrade -1                               # Rollback one
```

Always include `user_id` FK with `ondelete="CASCADE"` and `index=True` on new domain models.

## Constraints & Limits

| Feature | Limit | Why |
|---------|-------|-----|
| Planner entries | 15 max | UI/UX—weekly planning scope |
| Side recipes per meal | 3 max | Practical meal composition |
| Meal tags | 20 max, 50 chars each | Performance |
| Pagination | 100 items max | Response size |

## Environment Variables

See `.env.example` for full list. Key ones:

- `AUTH_DISABLED=true` — bypass auth for local dev
- `DEV_USER_ID` — user ID when auth disabled (default: 1)
- `CLERK_PUBLISHABLE_KEY` — used to derive JWKS URL
- `GEMINI_*_API_KEY` — separate keys for different AI features (rate limiting)

## Gotchas

**SQLite foreign keys**: Enabled via `PRAGMA foreign_keys=ON` listener in `db.py`. If you're seeing FK violations not caught, check this is running.

**Cascade deletes**: All domain models cascade from User. Recipe → RecipeIngredient, Meal → PlannerEntry also cascade. Check `ondelete="CASCADE"` on FKs.

**Session management**: Routes get session via `Depends(get_session)`. Don't create sessions manually in services/repos—they receive it from the route.

**Timezone handling**: Streak calculation (`/api/planner/streak`) requires `tz` query param from client. Server stores UTC, client converts.

**AI API keys**: Using separate Gemini keys per feature allows independent rate limiting. All defined in env vars.