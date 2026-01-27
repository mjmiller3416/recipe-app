# Claude CLI Prompts: Multi-User Auth Implementation

Prompts to give Claude CLI for implementing multi-user authentication in Meal Genie.

**Prerequisites:**
- Ensure Claude CLI has access to your project skills (`/mnt/skills/user/meal-genie-backend` and `meal-genie-frontend`)
- Run these from your project root directory
- Verify each chunk before moving to the next

---

## Chunk 1: Create User and UserSettings Models

**Estimated time:** 5-10 minutes

```
Create the User and UserSettings models for multi-user authentication.

Create `backend/app/models/user.py`:
- User model with fields: id (int PK), clerk_id (str, unique, indexed), email (str, unique, indexed), name (optional str), avatar_url (optional text)
- Add admin flag: is_admin (bool, default False) - permanent full access bypass
- Add subscription fields (Stripe-managed): stripe_customer_id (optional str, unique), subscription_tier (str, default "free"), subscription_status (str, default "active"), subscription_ends_at (optional datetime)
- Add granted access fields (for testers/promos): granted_pro_until (optional datetime), granted_by (optional str) for tracking reason like "beta_2026"
- Add timestamps: created_at, updated_at (both datetime with timezone)
- Add relationships to: Recipe, Meal, PlannerEntry, ShoppingItem, RecipeHistory (all with cascade delete)

Add these computed properties:

@property
def has_pro_access(self) -> bool:
    """Check if user has pro-level access through any path."""
    from datetime import datetime, timezone
    
    # Admins always have full access
    if self.is_admin:
        return True
    
    # Active paid subscription
    if self.subscription_tier == "pro" and self.subscription_status == "active":
        return True
    
    # Granted temporary access (testers, promos)
    if self.granted_pro_until:
        if self.granted_pro_until > datetime.now(timezone.utc):
            return True
    
    return False

@property
def access_reason(self) -> str:
    """Why does this user have their current access level? (for debugging/support)"""
    from datetime import datetime, timezone
    
    if self.is_admin:
        return "admin"
    if self.subscription_tier == "pro" and self.subscription_status == "active":
        return "subscription"
    if self.granted_pro_until and self.granted_pro_until > datetime.now(timezone.utc):
        return f"granted ({self.granted_by or 'manual'})"
    return "free"

- Follow the existing model patterns in `backend/app/models/recipe.py` for style and imports

Create `backend/app/models/user_settings.py`:
- UserSettings model with user_id as primary key (FK to users.id with CASCADE delete)
- Store settings as JSON in a _settings_json text field with a `settings` property for dict access
- Include DEFAULT_SETTINGS dict with: theme ("system"), defaultServings (4), showNutritionalInfo (False), preferredUnits ("imperial"), mealPlannerView ("list"), shoppingListGroupBy ("category")
- Add updated_at timestamp
- Add get(key, default) and set(key, value) helper methods

Update `backend/app/models/__init__.py` to export User and UserSettings.

Update `backend/app/database/migrations/env.py` to import the new models so Alembic detects them.
```

**After running, verify:**
- [ ] Both model files exist and have no import errors
- [ ] `__init__.py` exports both models
- [ ] `env.py` imports both models
- [ ] Run `cd backend && python -c "from app.models import User, UserSettings; print('OK')"` to verify imports

---

## Chunk 2: Add user_id Foreign Keys to Existing Models

**Estimated time:** 5-10 minutes

```
Add user_id foreign key to all user-owned models. This will scope data to individual users.

For each of these models, add:
1. Import ForeignKey from sqlalchemy if not already imported
2. Add User to TYPE_CHECKING imports
3. Add field: user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
4. Add relationship: user: Mapped["User"] = relationship("User", back_populates="<relationship_name>")

Models to update:
- `backend/app/models/recipe.py` - back_populates="recipes"
- `backend/app/models/meal.py` - back_populates="meals"
- `backend/app/models/planner_entry.py` - back_populates="planner_entries"
- `backend/app/models/shopping_item.py` - back_populates="shopping_items"
- `backend/app/models/recipe_history.py` - back_populates="recipe_history"

Do NOT add user_id to these models (they remain global/shared):
- ingredient.py
- unit_conversion_rule.py
- recipe_ingredient.py (join table)
- shopping_state.py

Follow the existing field definition style in each model.
```

**After running, verify:**
- [ ] Each model has the user_id field and user relationship
- [ ] No duplicate imports
- [ ] Run `cd backend && python -c "from app.models import Recipe, Meal, PlannerEntry, ShoppingItem, RecipeHistory; print('OK')"`

---

## Chunk 3: Generate and Customize Migration

**Do this manually or with careful review**

```
Generate an Alembic migration for the User model and user_id foreign keys.

Run: `cd backend && alembic revision --autogenerate -m "Add user tables and user_id foreign keys"`

Then modify the generated migration file to handle existing data:

1. Create users table first (include all fields: is_admin, granted_pro_until, granted_by, etc.)

2. Create user_settings table

3. Insert Maryann's user record - she owns all existing data:
   INSERT INTO users (
       clerk_id, email, name, is_admin, 
       subscription_tier, subscription_status, 
       created_at, updated_at
   ) VALUES (
       'pending_claim',
       'mmaryannr@gmail.com', 
       'Maryann',
       true,  -- Admin flag gives permanent full access
       'free',  -- Doesn't matter since is_admin=true
       'active',
       CURRENT_TIMESTAMP,
       CURRENT_TIMESTAMP
   )

4. Add user_id columns as NULLABLE initially (not the NOT NULL that autogenerate creates)

5. UPDATE all existing rows to set user_id = 1 (Maryann's user ID):
   UPDATE recipe SET user_id = 1 WHERE user_id IS NULL;
   UPDATE meals SET user_id = 1 WHERE user_id IS NULL;
   UPDATE planner_entries SET user_id = 1 WHERE user_id IS NULL;
   UPDATE shopping_items SET user_id = 1 WHERE user_id IS NULL;
   UPDATE recipe_history SET user_id = 1 WHERE user_id IS NULL;

6. ALTER columns to NOT NULL after data is migrated

7. Add foreign key constraints

8. Add indexes on user_id columns

When Maryann signs in with Clerk using her email, the auth system will:
- See no user with her clerk_id
- Find an unclaimed user (clerk_id='pending_claim') matching her email
- Claim that account by updating clerk_id
- She gets all existing data

Anyone else signing in gets a fresh, empty account.

Show me the migration file after autogenerate so I can help customize it.
```

**⚠️ Important:** 
- Review this migration carefully before running
- Test on a local database copy first

**After running, verify:**
- [ ] Migration file exists in `backend/app/database/migrations/versions/`
- [ ] Run `cd backend && alembic upgrade head` locally
- [ ] Check database has users table with one row
- [ ] Check existing recipes have user_id = 1

---

## Chunk 4: Create Auth Configuration and Dependencies

**Estimated time:** 5-10 minutes

```
Create the authentication configuration and FastAPI dependencies for Clerk JWT validation.

Create `backend/app/core/auth_config.py`:
- AuthSettings class using pydantic_settings.BaseSettings
- Fields: clerk_secret_key (str), CLERK_PUBLISHABLE_KEY (str), clerk_jwks_url (str, default "https://api.clerk.com/v1/jwks")
- Add auth_disabled (bool, default False) and dev_user_id (int, default 1) for local development
- Add get_auth_settings() function with @lru_cache decorator

Create `backend/app/api/dependencies.py`:
- get_clerk_jwks() async function to fetch and cache Clerk's JWKS
- get_current_user() async dependency that:
  
  1. If auth_disabled setting is True, returns user with id=dev_user_id (for local dev)
  
  2. Otherwise validates Bearer token from Authorization header
  
  3. Decodes JWT using python-jose with RS256 algorithm
  
  4. Looks up User by clerk_id from token
  
  5. If no user found by clerk_id, check for email-based claiming:
     - Get email from token payload
     - Look for unclaimed user: User.email == email AND User.clerk_id == "pending_claim"
     - If found, CLAIM the account: update clerk_id, name, avatar_url from token
     - This is how Kelsey claims her existing data on first sign-in
  
  6. If still no user, create a NEW user with empty data:
     - Set clerk_id, email, name, avatar_url from token
     - is_admin = False, subscription_tier = "free"
     - Create default UserSettings for them
  
  7. Return the User object
  
  8. Raise HTTPException 401 for invalid/missing tokens

- get_current_user_optional() that returns None instead of raising if no auth
- require_pro() dependency that checks user.has_pro_access and raises 403 if False

Use httpx for async HTTP requests to Clerk JWKS endpoint.
Use python-jose for JWT decoding.

Add to backend/.env.example:
CLERK_SECRET_KEY=sk_test_xxx
CLERK_PUBLISHABLE_KEY=pk_test_xxx
AUTH_DISABLED=true
DEV_USER_ID=1
```

**After running, verify:**
- [ ] Both files exist with no import errors
- [ ] Run `cd backend && python -c "from app.api.dependencies import get_current_user; print('OK')"`
- [ ] Check that httpx and python-jose are in requirements.txt (add if not)

---

## Chunk 5: Create User Repository

**Estimated time:** 3-5 minutes

```
Create a repository for user-related database operations.

Create `backend/app/repositories/user_repo.py`:
- UserRepo class following the pattern in recipe_repo.py
- __init__ takes Session
- get_by_id(user_id: int) -> Optional[User]
- get_by_clerk_id(clerk_id: str) -> Optional[User]
- get_by_email(email: str) -> Optional[User]
- create(clerk_id: str, email: str, name: Optional[str] = None) -> User
- get_settings(user_id: int) -> Optional[UserSettings]
- get_or_create_settings(user_id: int) -> UserSettings (creates with defaults if not exists)

Follow the existing repository patterns for imports and style.
```

**After running, verify:**
- [ ] File exists with no import errors
- [ ] Run `cd backend && python -c "from app.repositories.user_repo import UserRepo; print('OK')"`

---

## Chunk 6: Update RecipeRepo and RecipeService with User Filtering

**Estimated time:** 10-15 minutes

This is the template that other services will follow. Get this right first.

```
Update RecipeRepo and RecipeService to filter all operations by user_id.

Update `backend/app/repositories/recipe_repo.py`:

1. Update recipe_exists() to take user_id parameter and filter by it:
   def recipe_exists(self, name: str, category: str, user_id: int, exclude_id: Optional[int] = None) -> bool

2. Update persist_recipe_and_links() to take user_id and set it on the new recipe:
   def persist_recipe_and_links(self, recipe_dto: RecipeCreateDTO, user_id: int) -> Recipe

3. Update filter_recipes() to take user_id and always filter by it:
   def filter_recipes(self, filter_dto: RecipeFilterDTO, user_id: int) -> list[Recipe]
   Add: stmt = select(Recipe).where(Recipe.user_id == user_id) as the base query

4. Update get_by_id() to optionally verify user ownership:
   def get_by_id(self, recipe_id: int, user_id: Optional[int] = None) -> Optional[Recipe]
   If user_id is provided, add .where(Recipe.user_id == user_id)

5. Update any other methods that query recipes to include user_id filtering

Update `backend/app/services/recipe_service.py`:

1. Change __init__ to require user_id:
   def __init__(self, session: Session, user_id: int):
   Store as self.user_id

2. Update create_recipe_with_ingredients() to pass self.user_id to recipe_exists() and persist_recipe_and_links()

3. Update list_filtered() to pass self.user_id to filter_recipes()

4. Add get_recipe(recipe_id: int) method that calls self.recipe_repo.get_by_id(recipe_id, self.user_id)

5. Update toggle_favorite(), update_recipe(), delete_recipe() etc. to verify ownership by passing user_id

The key principle: users should ONLY see and modify their own recipes. A user requesting another user's recipe_id should get None/404, not a permission error (don't leak existence).
```

**After running, verify:**
- [ ] Both files compile without errors
- [ ] All RecipeService methods use self.user_id
- [ ] Run `cd backend && python -c "from app.services.recipe_service import RecipeService; print('OK')"`

---

## Chunk 7: Update Remaining Services and Repos

**Estimated time:** 15-20 minutes

```
Apply the same user_id filtering pattern from RecipeService/RecipeRepo to the remaining services and repositories.

Reference the changes made to recipe_repo.py and recipe_service.py as the template.

Update these repository files to add user_id filtering to all query methods:
- `backend/app/repositories/meal_repo.py`
- `backend/app/repositories/planner_repo.py`
- `backend/app/repositories/shopping_repo.py`

Update these service files to:
1. Add user_id: int parameter to __init__ and store as self.user_id
2. Pass self.user_id to all repository method calls
3. Ensure all create operations set user_id on new records

Services to update:
- `backend/app/services/meal_service.py`
- `backend/app/services/planner_service.py`
- `backend/app/services/shopping_service.py`
- `backend/app/services/dashboard_service.py` (filter all stats queries by user_id)

Do NOT modify:
- ingredient_service.py (ingredients are global)
- unit_conversion_service.py (conversions are global)

Key patterns to follow:
- All SELECT queries must include .where(Model.user_id == user_id)
- All INSERT operations must set user_id on the new record
- get_by_id style methods should return None if the record exists but belongs to another user
- Never expose whether a record exists for another user (404, not 403)
```

**After running, verify:**
- [ ] All service __init__ methods take user_id
- [ ] Grep for queries without user_id filter: `grep -r "select(Meal)" backend/app/repositories/` - all should have user_id
- [ ] Run `cd backend && python -c "from app.services.meal_service import MealService; from app.services.planner_service import PlannerService; print('OK')"`

---

## Chunk 8: Update API Routes with Auth Dependency

**Estimated time:** 15-20 minutes

```
Add authentication to all API routes that access user-owned data.

Import in each file:
from app.api.dependencies import get_current_user
from app.models.user import User

Update these route files to:
1. Add `current_user: User = Depends(get_current_user)` parameter to each route function
2. Pass `current_user.id` when instantiating services

Files to update:
- `backend/app/api/recipes.py` - all endpoints
- `backend/app/api/meals.py` - all endpoints
- `backend/app/api/planner.py` - all endpoints
- `backend/app/api/shopping.py` - all endpoints
- `backend/app/api/dashboard.py` - all endpoints
- `backend/app/api/data_management.py` - import/export endpoints (user's data only)
- `backend/app/api/ai/` - all AI endpoints (these should also use require_pro for pro-only features)

Example transformation for recipes.py:

Before:
@router.get("", response_model=List[RecipeResponseDTO])
def list_recipes(
    ...,
    session: Session = Depends(get_session),
):
    service = RecipeService(session)
    ...

After:
@router.get("", response_model=List[RecipeResponseDTO])
def list_recipes(
    ...,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    service = RecipeService(session, current_user.id)
    ...

Do NOT add auth to these routes (they use global data):
- `backend/app/api/ingredients.py`
- `backend/app/api/unit_conversions.py`

Do NOT add auth to:
- `backend/app/api/feedback.py` (public)
- Health check endpoints
```

**After running, verify:**
- [ ] All protected routes have current_user parameter
- [ ] Services are instantiated with current_user.id
- [ ] Run `cd backend && python -c "from app.api import recipes, meals, planner, shopping; print('OK')"`

---

## Chunk 9: Create Settings API Routes

**Estimated time:** 5 minutes

```
Create API routes for user settings management.

Create `backend/app/api/settings.py`:

- GET "/" - returns current user's settings as dict
- PUT "/" - replaces all settings with provided dict, returns updated settings
- PATCH "/" - merges provided dict with existing settings, returns updated settings

All endpoints require authentication via get_current_user dependency.
Use UserRepo.get_or_create_settings() to ensure settings exist.

Register the router in `backend/app/main.py`:
from app.api import settings
app.include_router(settings.router, prefix="/api/settings", tags=["settings"])

Follow the patterns in other route files for imports and structure.
```

**After running, verify:**
- [ ] File exists at `backend/app/api/settings.py`
- [ ] Router is registered in main.py
- [ ] Run `cd backend && python -c "from app.api.settings import router; print('OK')"`

---

## Chunk 10: Frontend - Install and Configure Clerk

**Estimated time:** 5-10 minutes

```
Set up Clerk authentication in the Next.js frontend.

1. The package @clerk/nextjs should be installed. If not, note that it needs to be added.

2. Update `frontend/src/app/layout.tsx`:
   - Import ClerkProvider from @clerk/nextjs
   - Wrap the entire app (inside html/body) with <ClerkProvider>
   - Keep all existing providers inside ClerkProvider

3. Create `frontend/src/middleware.ts`:
   - Import clerkMiddleware and createRouteMatcher from @clerk/nextjs/server
   - Define public routes: /sign-in(.*), /sign-up(.*), /api/webhooks(.*)
   - Export clerkMiddleware that calls auth.protect() for non-public routes
   - Export config.matcher to match all routes except static files

4. Create `frontend/src/app/sign-in/[[...sign-in]]/page.tsx`:
   - Import SignIn from @clerk/nextjs
   - Render SignIn component centered on page
   - Style to match the app's design system

5. Create `frontend/src/app/sign-up/[[...sign-up]]/page.tsx`:
   - Import SignUp from @clerk/nextjs
   - Render SignUp component centered on page
   - Style to match the app's design system

6. Create/update `frontend/.env.example` with:
   CLERK_PUBLISHABLE_KEY=pk_test_xxx
   CLERK_SECRET_KEY=sk_test_xxx
   NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
   NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
   NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
   NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
```

**After running, verify:**
- [ ] ClerkProvider wraps app in layout.tsx
- [ ] middleware.ts exists
- [ ] Sign-in and sign-up pages exist
- [ ] Run `cd frontend && npm run build` to check for errors

---

## Chunk 11: Frontend - Update API Client with Auth

**Estimated time:** 10-15 minutes

```
Update the frontend API client to include authentication tokens in requests.

Find the existing API client/fetch utilities (likely in `frontend/src/lib/` or `frontend/src/api/`).

Create or update to include an authenticated fetch hook:

1. Create `frontend/src/lib/api-client.ts` (or update existing):
   - Export useApiClient() hook that:
     - Uses useAuth() from @clerk/nextjs to get getToken function
     - Returns an async function apiFetch<T>(endpoint, options) that:
       - Gets token via await getToken()
       - Adds Authorization: Bearer ${token} header
       - Adds Content-Type: application/json header
       - Fetches from API_BASE_URL + endpoint
       - Handles 401 by throwing (Clerk middleware will redirect)
       - Returns parsed JSON

   - Export apiServerFetch<T>(endpoint, token, options) for server components:
     - Takes token as parameter (from auth() in server components)
     - Same fetch logic but synchronous token

2. Update existing data fetching hooks/functions to use the authenticated client:
   - Recipe fetching
   - Meal fetching
   - Planner operations
   - Shopping list operations
   - Settings operations

The API_BASE_URL should come from environment: process.env.NEXT_PUBLIC_API_URL

Ensure backwards compatibility - if code currently works, don't break it, just add auth headers.
```

**After running, verify:**
- [ ] API client includes auth token in requests
- [ ] Existing hooks still work (may need manual testing)
- [ ] Run `cd frontend && npm run build`

---

## Chunk 12: Frontend - Update Navigation with User Menu

**Estimated time:** 5-10 minutes

```
Update the navigation component to show authentication status and user controls.

Find the main navigation component (likely in `frontend/src/components/`).

Add Clerk's user UI components:

1. Import from @clerk/nextjs:
   - SignedIn, SignedOut, UserButton, SignInButton

2. In the navigation, add:
   - When signed out: Show a "Sign In" button using SignInButton with mode="modal"
   - When signed in: Show UserButton with afterSignOutUrl="/"

3. Style to match existing navigation design:
   - The UserButton shows user avatar and dropdown for sign out
   - Position appropriately in the nav layout

Example JSX:
<SignedOut>
  <SignInButton mode="modal">
    <button className="...existing button styles...">Sign In</button>
  </SignInButton>
</SignedOut>

<SignedIn>
  <UserButton afterSignOutUrl="/" />
</SignedIn>

Keep the navigation clean - Clerk's UserButton handles the complexity of showing user info and sign out.
```

**After running, verify:**
- [ ] Navigation shows sign in button when logged out
- [ ] Navigation shows user avatar when logged in
- [ ] Sign out works and redirects to home

---

## Chunk 13: Frontend - Update useSettings Hook

**Estimated time:** 10-15 minutes

```
Update the useSettings hook to sync settings with the backend API instead of only using localStorage.

Find the existing useSettings hook (likely in `frontend/src/hooks/`).

Update it to:

1. Use useAuth() from @clerk/nextjs to get isSignedIn and getToken

2. On mount (useEffect):
   - If signed in: fetch settings from GET /api/settings with auth token
   - If not signed in: load from localStorage as fallback
   - Always load theme from localStorage first for instant apply (prevents flash)

3. Update the updateSettings/setSettings function:
   - Optimistically update local state
   - If signed in: PATCH /api/settings with changes
   - If not signed in: save to localStorage
   - Always save theme to localStorage for instant load on refresh

4. Handle loading state - return isLoading so UI can show skeleton if needed

5. Handle errors gracefully - if API fails, fall back to localStorage

Key behavior:
- Theme should ALWAYS be in localStorage for instant load (no flash of wrong theme)
- Other settings sync to server when signed in
- Graceful degradation to localStorage when offline or not signed in

Make sure the hook interface stays compatible with existing usage.
```

**After running, verify:**
- [ ] Settings load from API when signed in
- [ ] Settings fall back to localStorage when signed out
- [ ] Theme applies instantly on page load (no flash)
- [ ] Changes sync to server

---

## Chunk 14: Add Usage Tracking Infrastructure

**Estimated time:** 15-20 minutes

This chunk adds the foundation for tracking feature usage. We'll track now but enforce limits later once you understand real usage patterns.

```
Add usage tracking infrastructure for AI features and future rate limiting.

1. Create `backend/app/models/user_usage.py`:

```python
"""app/models/user_usage.py

SQLAlchemy ORM model for tracking user feature usage.
Used for rate limiting and analytics.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..database.base import Base

if TYPE_CHECKING:
    from .user import User


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class UserUsage(Base):
    """
    Tracks monthly usage of rate-limited features.
    
    A new record is created for each user+month combination.
    This allows tracking usage over time and enforcing monthly limits.
    """
    __tablename__ = "user_usage"
    
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    month: Mapped[str] = mapped_column(String(7), nullable=False, index=True)  # "2026-01"
    
    # AI feature usage
    ai_images_generated: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    ai_suggestions_requested: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    ai_assistant_messages: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    
    # General feature usage (for future use)
    recipes_created: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, onupdate=_utcnow)
    
    # Ensure one record per user per month
    __table_args__ = (
        UniqueConstraint('user_id', 'month', name='uq_user_usage_user_month'),
    )
    
    # Relationship
    user: Mapped["User"] = relationship("User", backref="usage_records")
    
    def __repr__(self) -> str:
        return f"<UserUsage(user_id={self.user_id}, month='{self.month}', images={self.ai_images_generated})>"
```

2. Update `backend/app/models/__init__.py` to export UserUsage.

3. Create `backend/app/services/usage_service.py`:

```python
"""app/services/usage_service.py

Service for tracking and checking feature usage limits.
"""

from datetime import datetime
from typing import Optional

from sqlalchemy.orm import Session

from app.models.user_usage import UserUsage


class UsageService:
    """Service for tracking feature usage."""
    
    def __init__(self, session: Session):
        self.session = session
    
    def _get_current_month(self) -> str:
        """Get current month string in YYYY-MM format."""
        return datetime.now().strftime("%Y-%m")
    
    def _get_or_create_usage(self, user_id: int, month: Optional[str] = None) -> UserUsage:
        """Get or create usage record for a user+month."""
        if month is None:
            month = self._get_current_month()
        
        usage = self.session.query(UserUsage).filter(
            UserUsage.user_id == user_id,
            UserUsage.month == month
        ).first()
        
        if not usage:
            usage = UserUsage(user_id=user_id, month=month)
            self.session.add(usage)
            self.session.flush()
        
        return usage
    
    def increment(self, user_id: int, field: str, amount: int = 1) -> UserUsage:
        """
        Increment a usage counter.
        
        Args:
            user_id: User to track
            field: Field name (e.g., 'ai_images_generated')
            amount: Amount to increment by (default 1)
        
        Returns:
            Updated UserUsage record
        """
        usage = self._get_or_create_usage(user_id)
        
        current_value = getattr(usage, field, 0)
        setattr(usage, field, current_value + amount)
        
        self.session.commit()
        return usage
    
    def get_usage(self, user_id: int, month: Optional[str] = None) -> UserUsage:
        """Get usage record for a user (creates if doesn't exist)."""
        return self._get_or_create_usage(user_id, month)
    
    def check_limit(self, user_id: int, field: str, limit: int) -> bool:
        """
        Check if user is under their limit.
        
        Args:
            user_id: User to check
            field: Field name to check
            limit: Maximum allowed value
        
        Returns:
            True if user is under limit, False if at/over limit
        """
        usage = self._get_or_create_usage(user_id)
        current_value = getattr(usage, field, 0)
        return current_value < limit
    
    def get_remaining(self, user_id: int, field: str, limit: int) -> int:
        """Get remaining usage for a field."""
        usage = self._get_or_create_usage(user_id)
        current_value = getattr(usage, field, 0)
        return max(0, limit - current_value)
```

4. Update `backend/app/database/migrations/env.py` to import UserUsage model.

5. The UserUsage table should be included in the same migration as User (Chunk 3), OR generate a new migration if you've already run the User migration:

Add to the migration:
```python
op.create_table('user_usage',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('user_id', sa.Integer(), nullable=False),
    sa.Column('month', sa.String(length=7), nullable=False),
    sa.Column('ai_images_generated', sa.Integer(), nullable=False, server_default='0'),
    sa.Column('ai_suggestions_requested', sa.Integer(), nullable=False, server_default='0'),
    sa.Column('ai_assistant_messages', sa.Integer(), nullable=False, server_default='0'),
    sa.Column('recipes_created', sa.Integer(), nullable=False, server_default='0'),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('user_id', 'month', name='uq_user_usage_user_month')
)
op.create_index('ix_user_usage_user_id', 'user_usage', ['user_id'])
op.create_index('ix_user_usage_month', 'user_usage', ['month'])
```

6. Update AI endpoint files to track usage (but NOT enforce limits yet).

For each AI endpoint in `backend/app/api/ai/`:

Add to imports:
```python
from app.services.usage_service import UsageService
```

Add tracking after successful response (example for image generation):
```python
@router.post("/generate")
async def generate_image(
    ...,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    # TODO: Add limit enforcement later
    # usage_service = UsageService(session)
    # if not current_user.has_pro_access:
    #     if not usage_service.check_limit(current_user.id, "ai_images_generated", 3):
    #         raise HTTPException(429, "Monthly image generation limit reached")
    
    result = await generate_image_impl(...)
    
    # Track usage (do this now, even without enforcement)
    usage_service = UsageService(session)
    usage_service.increment(current_user.id, "ai_images_generated")
    
    return result
```

Apply similar tracking to:
- Image generation endpoint: increment 'ai_images_generated'
- Meal suggestions endpoint: increment 'ai_suggestions_requested'  
- Meal Genie assistant endpoint: increment 'ai_assistant_messages'
- Recipe creation endpoint: increment 'recipes_created'
```

**After running, verify:**
- [ ] UserUsage model exists and exports correctly
- [ ] UsageService can increment and check limits
- [ ] Migration includes user_usage table
- [ ] AI endpoints increment usage after successful calls
- [ ] Run `cd backend && python -c "from app.models import UserUsage; from app.services.usage_service import UsageService; print('OK')"`

---

## Post-Implementation Verification

After all chunks are complete, run through this checklist:

```
Backend Verification:
[ ] cd backend && python -c "from app.models import User, UserSettings, UserUsage; print('Models OK')"
[ ] cd backend && python -c "from app.api.dependencies import get_current_user; print('Auth OK')"
[ ] cd backend && alembic upgrade head (on local DB)
[ ] cd backend && uvicorn app.main:app --reload (starts without errors)
[ ] Test API with AUTH_DISABLED=true - endpoints return data

Frontend Verification:
[ ] cd frontend && npm run build (no build errors)
[ ] cd frontend && npm run dev (starts without errors)
[ ] Visit /sign-in - Clerk sign-in page loads
[ ] Sign in - redirects to app
[ ] Data loads (recipes, meals, etc.)
[ ] Sign out - redirects to sign-in

Data Isolation Test:
[ ] Sign in as User A, create a recipe
[ ] Sign out
[ ] Sign in as User B (new account)
[ ] Verify User A's recipe is NOT visible
[ ] Try to access User A's recipe by ID via URL - should 404

Usage Tracking Test:
[ ] Generate an AI image (if available)
[ ] Check user_usage table has a record with ai_images_generated incremented
[ ] Verify month format is correct (YYYY-MM)

Railway Deployment:
[ ] Add Clerk env vars to Railway backend service
[ ] Add Clerk env vars to Railway frontend service
[ ] Deploy backend, run alembic upgrade head
[ ] Deploy frontend
[ ] Test full auth flow on production
```

---

## Troubleshooting Tips

**"Module not found" errors:**
- Check __init__.py exports
- Verify import paths match your project structure

**JWT validation fails:**
- Verify CLERK_SECRET_KEY is set correctly
- Check that JWKS URL is accessible
- Ensure token is being passed as "Bearer {token}"

**Existing data not accessible:**
- Check that migration created the placeholder user
- Verify first sign-in claimed the placeholder (clerk_id updated)
- Check user_id on existing records

**CORS errors:**
- Verify backend CORS allows Authorization header
- Check frontend API URL is correct

**Settings not syncing:**
- Check browser network tab for /api/settings requests
- Verify auth token is being sent
- Check backend logs for errors