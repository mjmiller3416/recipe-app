# Meal Genie: Multi-User Authentication Implementation

A task-by-task guide for adding multi-user support with Clerk authentication.

**Target Architecture:**
- Auth Provider: Clerk
- Backend: FastAPI + SQLAlchemy (existing)
- Frontend: Next.js 14 + React 19 (existing)
- Database: SQLite (local) / PostgreSQL (Railway production)

---

## Phase 1: Backend Models & Migrations

These tasks create the database foundation for multi-user support.

---

### Task 1.1: Create User Model

**File:** `backend/app/models/user.py` (new file)

```python
"""app/models/user.py

SQLAlchemy ORM model for application users.
Integrates with Clerk for authentication.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import DateTime, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..database.base import Base

if TYPE_CHECKING:
    from .meal import Meal
    from .planner_entry import PlannerEntry
    from .recipe import Recipe
    from .recipe_history import RecipeHistory
    from .shopping_item import ShoppingItem


def _utcnow() -> datetime:
    """Return current UTC datetime."""
    return datetime.now(timezone.utc)


class User(Base):
    """
    Application user linked to Clerk authentication.
    
    Users own recipes, meals, planner entries, and shopping items.
    The clerk_id links to the external Clerk user for JWT validation.
    """
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    
    # Clerk integration
    clerk_id: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    
    # User info (synced from Clerk)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    avatar_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Subscription fields (Stripe-ready, implement later)
    stripe_customer_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, unique=True)
    subscription_tier: Mapped[str] = mapped_column(String(50), default="free", nullable=False)
    subscription_status: Mapped[str] = mapped_column(String(50), default="active", nullable=False)
    subscription_ends_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, onupdate=_utcnow, nullable=False)

    # ── Relationships ───────────────────────────────────────────────────────
    recipes: Mapped[List["Recipe"]] = relationship(
        "Recipe",
        back_populates="user",
        cascade="all, delete-orphan",
        passive_deletes=True
    )
    
    meals: Mapped[List["Meal"]] = relationship(
        "Meal",
        back_populates="user",
        cascade="all, delete-orphan",
        passive_deletes=True
    )
    
    planner_entries: Mapped[List["PlannerEntry"]] = relationship(
        "PlannerEntry",
        back_populates="user",
        cascade="all, delete-orphan",
        passive_deletes=True
    )
    
    shopping_items: Mapped[List["ShoppingItem"]] = relationship(
        "ShoppingItem",
        back_populates="user",
        cascade="all, delete-orphan",
        passive_deletes=True
    )
    
    recipe_history: Mapped[List["RecipeHistory"]] = relationship(
        "RecipeHistory",
        back_populates="user",
        cascade="all, delete-orphan",
        passive_deletes=True
    )

    # ── Helper Methods ──────────────────────────────────────────────────────
    def __repr__(self) -> str:
        return f"<User(id={self.id}, email='{self.email}', access='{self.access_reason}')>"
    
    @property
    def has_pro_access(self) -> bool:
        """Check if user has pro-level access through any path."""
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
        if self.is_admin:
            return "admin"
        if self.subscription_tier == "pro" and self.subscription_status == "active":
            return "subscription"
        if self.granted_pro_until and self.granted_pro_until > datetime.now(timezone.utc):
            return f"granted ({self.granted_by or 'manual'})"
        return "free"
```

**After creating:** Update `backend/app/models/__init__.py` to export User.

**Note:** The model above needs the additional fields. Add these after `subscription_ends_at`:

```python
    # ── Admin Flag ──────────────────────────────────────────────────────
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    
    # ── Granted Access (for testers, promos) ────────────────────────────
    granted_pro_until: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    granted_by: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)  # "beta_2026", "promo", etc.
```

And add `Boolean` to the sqlalchemy imports.

---

### Task 1.2: Create UserSettings Model

**File:** `backend/app/models/user_settings.py` (new file)

```python
"""app/models/user_settings.py

SQLAlchemy ORM model for user preferences/settings.
Stores settings as JSON for flexibility.
"""

from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Any, Dict, Optional

from sqlalchemy import DateTime, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..database.base import Base


def _utcnow() -> datetime:
    """Return current UTC datetime."""
    return datetime.now(timezone.utc)


# Default settings for new users
DEFAULT_SETTINGS: Dict[str, Any] = {
    "theme": "system",
    "defaultServings": 4,
    "showNutritionalInfo": False,
    "preferredUnits": "imperial",
    "mealPlannerView": "list",
    "shoppingListGroupBy": "category",
}


class UserSettings(Base):
    """
    User preferences and application settings.
    
    Settings are stored as JSON for flexibility - new settings can be
    added without migrations. The frontend useSettings hook syncs with this.
    """
    __tablename__ = "user_settings"

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True
    )
    
    _settings_json: Mapped[str] = mapped_column(
        "settings_json",
        Text,
        default=lambda: json.dumps(DEFAULT_SETTINGS),
        nullable=False
    )
    
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=_utcnow,
        onupdate=_utcnow,
        nullable=False
    )

    # ── Relationship ────────────────────────────────────────────────────────
    user: Mapped["User"] = relationship("User", backref="settings", uselist=False)

    # ── Properties ──────────────────────────────────────────────────────────
    @property
    def settings(self) -> Dict[str, Any]:
        """Get settings as dictionary."""
        try:
            return json.loads(self._settings_json)
        except (json.JSONDecodeError, TypeError):
            return DEFAULT_SETTINGS.copy()
    
    @settings.setter
    def settings(self, value: Dict[str, Any]) -> None:
        """Set settings from dictionary."""
        # Merge with defaults to ensure all keys exist
        merged = DEFAULT_SETTINGS.copy()
        merged.update(value)
        self._settings_json = json.dumps(merged)
    
    def get(self, key: str, default: Any = None) -> Any:
        """Get a specific setting value."""
        return self.settings.get(key, default)
    
    def set(self, key: str, value: Any) -> None:
        """Set a specific setting value."""
        current = self.settings
        current[key] = value
        self.settings = current
```

**After creating:** Update `backend/app/models/__init__.py` to export UserSettings.

---

### Task 1.2b: Create UserUsage Model

**File:** `backend/app/models/user_usage.py` (new file)

```python
"""app/models/user_usage.py

SQLAlchemy ORM model for tracking user feature usage.
Used for rate limiting, analytics, and enforcing subscription limits.
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
    
    # General feature usage (for future subscription limits)
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

**After creating:** Update `backend/app/models/__init__.py` to export UserUsage.

---

### Task 1.3: Update Models __init__.py

**File:** `backend/app/models/__init__.py`

Add the new models to the exports:

```python
# app/core/models/__init__.py

from .ingredient import Ingredient
from .meal import Meal
from .planner_entry import PlannerEntry
from .recipe import Recipe
from .recipe_history import RecipeHistory
from .recipe_ingredient import RecipeIngredient
from .shopping_item import ShoppingItem
from .shopping_state import ShoppingState
from .unit_conversion_rule import UnitConversionRule
from .user import User  # ADD
from .user_settings import UserSettings  # ADD
from .user_usage import UserUsage  # ADD

__all__ = [
    "Recipe",
    "RecipeIngredient",
    "RecipeHistory",
    "Ingredient",
    "Meal",
    "PlannerEntry",
    "ShoppingItem",
    "ShoppingState",
    "UnitConversionRule",
    "User",  # ADD
    "UserSettings",  # ADD
    "UserUsage",  # ADD
]
```

---

### Task 1.4: Add user_id to Recipe Model

**File:** `backend/app/models/recipe.py`

Add these imports and fields:

```python
# Add to imports
from sqlalchemy import ForeignKey

# Add to TYPE_CHECKING block
if TYPE_CHECKING:
    from .user import User

# Add this field after the existing fields (before relationships)
user_id: Mapped[int] = mapped_column(
    ForeignKey("users.id", ondelete="CASCADE"),
    nullable=False,  # Will need migration strategy for existing data
    index=True
)

# Add this relationship in the relationships section
user: Mapped["User"] = relationship("User", back_populates="recipes")
```

---

### Task 1.5: Add user_id to Meal Model

**File:** `backend/app/models/meal.py`

Add these imports and fields:

```python
# Add to imports (ForeignKey should already be imported)
# Just ensure it's there

# Add to TYPE_CHECKING block
if TYPE_CHECKING:
    from .user import User

# Add this field after created_at
user_id: Mapped[int] = mapped_column(
    ForeignKey("users.id", ondelete="CASCADE"),
    nullable=False,
    index=True
)

# Add this relationship
user: Mapped["User"] = relationship("User", back_populates="meals")
```

---

### Task 1.6: Add user_id to PlannerEntry Model

**File:** `backend/app/models/planner_entry.py`

```python
# Add to imports
from sqlalchemy import ForeignKey  # if not already present

# Add to TYPE_CHECKING block  
if TYPE_CHECKING:
    from .user import User

# Add this field
user_id: Mapped[int] = mapped_column(
    ForeignKey("users.id", ondelete="CASCADE"),
    nullable=False,
    index=True
)

# Add this relationship
user: Mapped["User"] = relationship("User", back_populates="planner_entries")
```

---

### Task 1.7: Add user_id to ShoppingItem Model

**File:** `backend/app/models/shopping_item.py`

```python
# Add to imports
from sqlalchemy import ForeignKey  # if not already present

# Add to TYPE_CHECKING block
if TYPE_CHECKING:
    from .user import User

# Add this field
user_id: Mapped[int] = mapped_column(
    ForeignKey("users.id", ondelete="CASCADE"),
    nullable=False,
    index=True
)

# Add this relationship
user: Mapped["User"] = relationship("User", back_populates="shopping_items")
```

---

### Task 1.8: Add user_id to RecipeHistory Model

**File:** `backend/app/models/recipe_history.py`

```python
# Add to imports
from sqlalchemy import ForeignKey  # if not already present

# Add to TYPE_CHECKING block
if TYPE_CHECKING:
    from .user import User

# Add this field
user_id: Mapped[int] = mapped_column(
    ForeignKey("users.id", ondelete="CASCADE"),
    nullable=False,
    index=True
)

# Add this relationship
user: Mapped["User"] = relationship("User", back_populates="recipe_history")
```

---

### Task 1.9: Update Alembic env.py

**File:** `backend/app/database/migrations/env.py`

Add the new model imports so Alembic detects them:

```python
# Add to the model imports section
from app.models.user import User
from app.models.user_settings import UserSettings
```

---

### Task 1.10: Generate Alembic Migration

Run this command from the `backend` directory:

```bash
alembic revision --autogenerate -m "Add user tables and user_id foreign keys"
```

**Important:** Review the generated migration file before running it. The auto-generated migration will try to add NOT NULL `user_id` columns to tables that already have data. You'll need to modify it for the migration strategy (see Task 1.11).

---

### Task 1.11: Modify Migration for Existing Data

The generated migration needs to handle existing data. Modify it to:

1. Create User and UserSettings tables first (including is_admin and granted_pro_until fields)
2. Add user_id columns as NULLABLE initially
3. Create Kelsey's user with her actual email and is_admin=true
4. Assign existing data to her user
5. Make user_id NOT NULL after data is migrated

**Example migration modification:**

```python
def upgrade() -> None:
    # 1. Create users table (with all fields)
    op.create_table('users',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('clerk_id', sa.String(length=255), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=True),
        sa.Column('avatar_url', sa.Text(), nullable=True),
        sa.Column('is_admin', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('stripe_customer_id', sa.String(length=255), nullable=True),
        sa.Column('subscription_tier', sa.String(length=50), nullable=False, server_default='free'),
        sa.Column('subscription_status', sa.String(length=50), nullable=False, server_default='active'),
        sa.Column('subscription_ends_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('granted_pro_until', sa.DateTime(timezone=True), nullable=True),
        sa.Column('granted_by', sa.String(length=100), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('clerk_id'),
        sa.UniqueConstraint('email'),
        sa.UniqueConstraint('stripe_customer_id')
    )
    op.create_index('ix_users_clerk_id', 'users', ['clerk_id'])
    op.create_index('ix_users_email', 'users', ['email'])
    
    # 2. Create user_settings table
    op.create_table('user_settings',
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('settings_json', sa.Text(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('user_id')
    )
    
    # 2b. Create user_usage table (for tracking feature usage)
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
    
    # 3. Create Kelsey's user - she owns all existing data
    # ⚠️ REPLACE WITH HER ACTUAL EMAIL
    op.execute("""
        INSERT INTO users (
            clerk_id, email, name, is_admin,
            subscription_tier, subscription_status,
            created_at, updated_at
        ) VALUES (
            'pending_claim',
            'REPLACE_WITH_KELSEY_EMAIL',
            'Kelsey',
            true,
            'free',
            'active',
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
        )
    """)
    
    # 4. Add user_id columns as NULLABLE first
    op.add_column('recipe', sa.Column('user_id', sa.Integer(), nullable=True))
    op.add_column('meals', sa.Column('user_id', sa.Integer(), nullable=True))
    op.add_column('planner_entries', sa.Column('user_id', sa.Integer(), nullable=True))
    op.add_column('shopping_items', sa.Column('user_id', sa.Integer(), nullable=True))
    op.add_column('recipe_history', sa.Column('user_id', sa.Integer(), nullable=True))
    
    # 5. Assign existing data to Kelsey (user id=1)
    op.execute("UPDATE recipe SET user_id = 1 WHERE user_id IS NULL")
    op.execute("UPDATE meals SET user_id = 1 WHERE user_id IS NULL")
    op.execute("UPDATE planner_entries SET user_id = 1 WHERE user_id IS NULL")
    op.execute("UPDATE shopping_items SET user_id = 1 WHERE user_id IS NULL")
    op.execute("UPDATE recipe_history SET user_id = 1 WHERE user_id IS NULL")
    
    # 6. Make user_id NOT NULL and add foreign keys
    op.alter_column('recipe', 'user_id', nullable=False)
    op.alter_column('meals', 'user_id', nullable=False)
    op.alter_column('planner_entries', 'user_id', nullable=False)
    op.alter_column('shopping_items', 'user_id', nullable=False)
    op.alter_column('recipe_history', 'user_id', nullable=False)
    
    # 7. Add foreign key constraints and indexes
    op.create_foreign_key('fk_recipe_user', 'recipe', 'users', ['user_id'], ['id'], ondelete='CASCADE')
    op.create_foreign_key('fk_meals_user', 'meals', 'users', ['user_id'], ['id'], ondelete='CASCADE')
    op.create_foreign_key('fk_planner_entries_user', 'planner_entries', 'users', ['user_id'], ['id'], ondelete='CASCADE')
    op.create_foreign_key('fk_shopping_items_user', 'shopping_items', 'users', ['user_id'], ['id'], ondelete='CASCADE')
    op.create_foreign_key('fk_recipe_history_user', 'recipe_history', 'users', ['user_id'], ['id'], ondelete='CASCADE')
    
    op.create_index('ix_recipe_user_id', 'recipe', ['user_id'])
    op.create_index('ix_meals_user_id', 'meals', ['user_id'])
    op.create_index('ix_planner_entries_user_id', 'planner_entries', ['user_id'])
    op.create_index('ix_shopping_items_user_id', 'shopping_items', ['user_id'])
    op.create_index('ix_recipe_history_user_id', 'recipe_history', ['user_id'])
```

**How account claiming works:**
- When Kelsey signs in with Clerk using her email, the auth system will:
  1. Look for a user with her Clerk ID (won't find one)
  2. Look for an unclaimed user matching her email (finds the one we created)
  3. Claims it by updating clerk_id from 'pending_claim' to her actual Clerk ID
  4. She now has access to all existing recipes, meals, etc.
- Anyone else signing in gets a fresh, empty account

---

### Task 1.12: Run Migration

```bash
# From backend directory
alembic upgrade head
```

**Test locally first**, then deploy to Railway and run against production.

---

## Phase 2: Auth Dependencies & Middleware

These tasks add the authentication layer to FastAPI.

---

### Task 2.1: Install Auth Dependencies

```bash
# From backend directory
pip install python-jose[cryptography] httpx

# Update requirements.txt
pip freeze > requirements.txt
```

Or add manually to `requirements.txt`:
```
python-jose[cryptography]>=3.3.0
httpx>=0.27.0
```

---

### Task 2.2: Create Auth Configuration

**File:** `backend/app/core/auth_config.py` (new file)

```python
"""app/core/auth_config.py

Clerk authentication configuration.
"""

import os
from functools import lru_cache

from pydantic_settings import BaseSettings


class AuthSettings(BaseSettings):
    """Authentication settings loaded from environment."""
    
    # Clerk settings
    clerk_secret_key: str = ""
    clerk_publishable_key: str = ""
    clerk_jwks_url: str = "https://api.clerk.com/v1/jwks"
    
    # For local development without auth
    auth_disabled: bool = False
    dev_user_id: int = 1  # User ID to use when auth is disabled
    
    class Config:
        env_file = ".env"
        extra = "ignore"


@lru_cache
def get_auth_settings() -> AuthSettings:
    """Get cached auth settings."""
    return AuthSettings()
```

---

### Task 2.3: Create Auth Dependencies

**File:** `backend/app/api/dependencies.py` (new file)

```python
"""app/api/dependencies.py

FastAPI dependencies for authentication and authorization.
"""

from typing import Optional

import httpx
from fastapi import Depends, HTTPException, Header, status
from jose import jwt, JWTError
from sqlalchemy.orm import Session

from app.core.auth_config import get_auth_settings
from app.database.db import get_session
from app.models.user import User
from app.models.user_settings import UserSettings, DEFAULT_SETTINGS


# Cache for Clerk JWKS (JSON Web Key Set)
_jwks_cache: Optional[dict] = None


async def get_clerk_jwks() -> dict:
    """Fetch Clerk's JWKS for JWT verification."""
    global _jwks_cache
    
    if _jwks_cache is not None:
        return _jwks_cache
    
    settings = get_auth_settings()
    async with httpx.AsyncClient() as client:
        response = await client.get(
            settings.clerk_jwks_url,
            headers={"Authorization": f"Bearer {settings.clerk_secret_key}"}
        )
        response.raise_for_status()
        _jwks_cache = response.json()
        return _jwks_cache


def clear_jwks_cache() -> None:
    """Clear JWKS cache (useful for testing or key rotation)."""
    global _jwks_cache
    _jwks_cache = None


async def get_current_user(
    authorization: Optional[str] = Header(None, alias="Authorization"),
    session: Session = Depends(get_session),
) -> User:
    """
    Validate Clerk JWT and return the current user.
    
    Creates user record on first authentication (Clerk handles registration).
    
    Raises:
        HTTPException: 401 if token is missing or invalid
    """
    settings = get_auth_settings()
    
    # Development mode: skip auth and return dev user
    if settings.auth_disabled:
        user = session.query(User).filter(User.id == settings.dev_user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Dev user not found. Run migrations first."
            )
        return user
    
    # Validate authorization header
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authorization header",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header format",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = authorization[7:]  # Remove "Bearer " prefix
    
    try:
        # Get JWKS for verification
        jwks = await get_clerk_jwks()
        
        # Decode without verification first to get the key ID
        unverified_header = jwt.get_unverified_header(token)
        
        # Find the matching key
        rsa_key = None
        for key in jwks.get("keys", []):
            if key.get("kid") == unverified_header.get("kid"):
                rsa_key = key
                break
        
        if not rsa_key:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Unable to find appropriate key",
            )
        
        # Verify and decode the token
        payload = jwt.decode(
            token,
            rsa_key,
            algorithms=["RS256"],
            options={"verify_aud": False}  # Clerk doesn't always set audience
        )
        
        clerk_id: str = payload.get("sub")
        if not clerk_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: missing subject",
            )
        
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Get or create user
    user = session.query(User).filter(User.clerk_id == clerk_id).first()
    
    if not user:
        # Get email from token for matching
        email_from_token = payload.get("email", "")
        
        # Check if there's an unclaimed user with this email
        # This is how Kelsey claims her existing data
        unclaimed_user = session.query(User).filter(
            User.email == email_from_token,
            User.clerk_id == "pending_claim"
        ).first()
        
        if unclaimed_user:
            # Claim the existing account
            unclaimed_user.clerk_id = clerk_id
            unclaimed_user.name = payload.get("name") or unclaimed_user.name
            unclaimed_user.avatar_url = payload.get("image_url")
            session.commit()
            session.refresh(unclaimed_user)
            return unclaimed_user
        
        # Create new user (fresh account, no existing data)
        user = User(
            clerk_id=clerk_id,
            email=email_from_token or f"{clerk_id}@clerk.user",
            name=payload.get("name"),
            avatar_url=payload.get("image_url"),
        )
        session.add(user)
        session.flush()
        
        # Create default settings for new user
        settings_record = UserSettings(user_id=user.id)
        session.add(settings_record)
        
        session.commit()
        session.refresh(user)
    
    return user


async def get_current_user_optional(
    authorization: Optional[str] = Header(None, alias="Authorization"),
    session: Session = Depends(get_session),
) -> Optional[User]:
    """
    Optional user authentication - returns None if not authenticated.
    Useful for endpoints that work with or without auth.
    """
    if not authorization:
        return None
    
    try:
        return await get_current_user(authorization, session)
    except HTTPException:
        return None


def require_pro(user: User = Depends(get_current_user)) -> User:
    """
    Dependency that requires Pro-level access.
    Use for premium-only endpoints.
    
    Pro access can come from:
    - is_admin flag (you and Kelsey)
    - Active paid subscription
    - Granted temporary access (testers)
    """
    if not user.has_pro_access:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This feature requires a Pro subscription"
        )
    return user
```

---

### Task 2.4: Add Environment Variables

**File:** `backend/.env` (update existing)

```bash
# Clerk Authentication
CLERK_SECRET_KEY=sk_test_xxxxxxxxxxxxx
CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxx

# Development mode (set to true to bypass auth locally)
AUTH_DISABLED=true
DEV_USER_ID=1
```

**For Railway:** Add these same variables in the Railway dashboard under Variables.

---

## Phase 3: Update Services with User Filtering

These tasks modify services to filter data by user.

---

### Task 3.1: Create User Repository

**File:** `backend/app/repositories/user_repo.py` (new file)

```python
"""app/repositories/user_repo.py

Repository for user operations.
"""

from typing import Optional

from sqlalchemy.orm import Session

from app.models.user import User
from app.models.user_settings import UserSettings


class UserRepo:
    """Repository for user database operations."""

    def __init__(self, session: Session):
        self.session = session

    def get_by_id(self, user_id: int) -> Optional[User]:
        """Get user by ID."""
        return self.session.query(User).filter(User.id == user_id).first()

    def get_by_clerk_id(self, clerk_id: str) -> Optional[User]:
        """Get user by Clerk ID."""
        return self.session.query(User).filter(User.clerk_id == clerk_id).first()

    def get_by_email(self, email: str) -> Optional[User]:
        """Get user by email."""
        return self.session.query(User).filter(User.email == email).first()

    def create(self, clerk_id: str, email: str, name: Optional[str] = None) -> User:
        """Create a new user."""
        user = User(clerk_id=clerk_id, email=email, name=name)
        self.session.add(user)
        self.session.flush()
        return user

    def get_settings(self, user_id: int) -> Optional[UserSettings]:
        """Get user settings."""
        return self.session.query(UserSettings).filter(
            UserSettings.user_id == user_id
        ).first()

    def get_or_create_settings(self, user_id: int) -> UserSettings:
        """Get or create user settings."""
        settings = self.get_settings(user_id)
        if not settings:
            settings = UserSettings(user_id=user_id)
            self.session.add(settings)
            self.session.flush()
        return settings
```

---

### Task 3.1b: Create Usage Service

**File:** `backend/app/services/usage_service.py` (new file)

```python
"""app/services/usage_service.py

Service for tracking and checking feature usage limits.
Tracks usage now, enforcement comes later.
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

---

### Task 3.2: Update RecipeRepo with User Filtering

**File:** `backend/app/repositories/recipe_repo.py`

Add `user_id` parameter to methods that read/write recipes:

```python
# Update recipe_exists method
def recipe_exists(
    self, 
    name: str, 
    category: str, 
    user_id: int,  # ADD
    exclude_id: Optional[int] = None
) -> bool:
    """Check if a recipe with this name/category exists for this user."""
    stmt = select(Recipe).where(
        Recipe.recipe_name == name,
        Recipe.recipe_category == category,
        Recipe.user_id == user_id,  # ADD
    )
    if exclude_id:
        stmt = stmt.where(Recipe.id != exclude_id)
    result = self.session.execute(stmt)
    return result.scalar_one_or_none() is not None

# Update persist_recipe_and_links method signature
def persist_recipe_and_links(
    self, 
    recipe_dto: RecipeCreateDTO, 
    user_id: int  # ADD
) -> Recipe:
    recipe = Recipe(
        recipe_name=recipe_dto.recipe_name,
        # ... existing fields ...
        user_id=user_id,  # ADD
    )
    # ... rest unchanged

# Update filter_recipes method
def filter_recipes(
    self, 
    filter_dto: RecipeFilterDTO, 
    user_id: int  # ADD
) -> list[Recipe]:
    stmt = select(Recipe).where(Recipe.user_id == user_id)  # ADD base filter
    # ... apply other filters to stmt
    
# Update get_by_id to optionally verify ownership
def get_by_id(
    self, 
    recipe_id: int, 
    user_id: Optional[int] = None  # ADD
) -> Optional[Recipe]:
    stmt = select(Recipe).where(Recipe.id == recipe_id)
    if user_id is not None:
        stmt = stmt.where(Recipe.user_id == user_id)
    # ... rest unchanged
```

---

### Task 3.3: Update RecipeService with User Context

**File:** `backend/app/services/recipe_service.py`

```python
class RecipeService:
    """Service layer for managing recipes and their ingredients."""

    def __init__(self, session: Session, user_id: int):  # ADD user_id
        self.session = session
        self.user_id = user_id  # ADD
        self.ingredient_repo = IngredientRepo(self.session)
        self.recipe_repo = RecipeRepo(self.session, self.ingredient_repo)
        self.meal_repo = MealRepo(self.session)

    def create_recipe_with_ingredients(self, recipe_dto: RecipeCreateDTO) -> Recipe:
        if self.recipe_repo.recipe_exists(
            name=recipe_dto.recipe_name,
            category=recipe_dto.recipe_category,
            user_id=self.user_id  # ADD
        ):
            raise DuplicateRecipeError(...)

        try:
            recipe = self.recipe_repo.persist_recipe_and_links(
                recipe_dto, 
                user_id=self.user_id  # ADD
            )
            self.session.commit()
            return recipe
        # ... rest unchanged

    def list_filtered(self, filter_dto: RecipeFilterDTO) -> list[Recipe]:
        return self.recipe_repo.filter_recipes(filter_dto, self.user_id)  # ADD

    def get_recipe(self, recipe_id: int) -> Optional[Recipe]:
        """Get recipe by ID, scoped to current user."""
        return self.recipe_repo.get_by_id(recipe_id, self.user_id)  # ADD user filter
    
    # Update other methods similarly...
```

---

### Task 3.4: Update MealService with User Context

**File:** `backend/app/services/meal_service.py`

Apply the same pattern:

```python
class MealService:
    def __init__(self, session: Session, user_id: int):  # ADD user_id
        self.session = session
        self.user_id = user_id  # ADD
        self.repo = MealRepo(self.session)
        # ...

    def create_meal(self, create_dto: MealCreateDTO) -> MealResponseDTO:
        # Add user_id when creating
        meal = self.repo.create(create_dto, user_id=self.user_id)
        # ...

    def filter_meals(self, filter_dto: MealFilterDTO) -> List[MealResponseDTO]:
        # Filter by user
        meals = self.repo.filter(filter_dto, user_id=self.user_id)
        # ...
```

---

### Task 3.5: Update MealRepo with User Filtering

**File:** `backend/app/repositories/meal_repo.py`

Add `user_id` filtering to all query methods.

---

### Task 3.6: Update PlannerService with User Context

**File:** `backend/app/services/planner_service.py`

Add `user_id` to constructor and filter all queries.

---

### Task 3.7: Update PlannerRepo with User Filtering

**File:** `backend/app/repositories/planner_repo.py`

Add `user_id` to all methods.

---

### Task 3.8: Update ShoppingService with User Context

**File:** `backend/app/services/shopping_service.py`

Add `user_id` to constructor and filter all queries.

---

### Task 3.9: Update ShoppingRepo with User Filtering

**File:** `backend/app/repositories/shopping_repo.py`

Add `user_id` to all methods.

---

### Task 3.10: Update DashboardService with User Context

**File:** `backend/app/services/dashboard_service.py`

Filter all stats queries by user.

---

## Phase 4: Update API Routes

These tasks add authentication to your API endpoints.

---

### Task 4.1: Update Recipe Routes

**File:** `backend/app/api/recipes.py`

```python
from app.api.dependencies import get_current_user
from app.models.user import User

@router.get("", response_model=List[RecipeResponseDTO])
def list_recipes(
    # ... existing params ...
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),  # ADD
):
    """List recipes for the current user."""
    service = RecipeService(session, current_user.id)  # ADD user_id
    # ... rest unchanged


@router.post("", response_model=RecipeResponseDTO, status_code=201)
def create_recipe(
    recipe_data: RecipeCreateDTO,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),  # ADD
):
    """Create a new recipe for the current user."""
    service = RecipeService(session, current_user.id)  # ADD user_id
    # ... rest unchanged


@router.get("/{recipe_id}", response_model=RecipeResponseDTO)
def get_recipe(
    recipe_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),  # ADD
):
    """Get a single recipe by ID (must belong to current user)."""
    service = RecipeService(session, current_user.id)
    recipe = service.get_recipe(recipe_id)
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    return _recipe_to_response_dto(recipe)

# Apply same pattern to PUT, DELETE endpoints...
```

---

### Task 4.2: Update Meal Routes

**File:** `backend/app/api/meals.py`

Add `current_user: User = Depends(get_current_user)` to all endpoints and pass `current_user.id` to MealService.

---

### Task 4.3: Update Planner Routes

**File:** `backend/app/api/planner.py`

Add auth dependency and user filtering.

---

### Task 4.4: Update Shopping Routes

**File:** `backend/app/api/shopping.py`

Add auth dependency and user filtering.

---

### Task 4.5: Update Dashboard Routes

**File:** `backend/app/api/dashboard.py`

Add auth dependency and user filtering.

---

### Task 4.6: Create Settings Routes

**File:** `backend/app/api/settings.py` (new file)

```python
"""app/api/settings.py

FastAPI router for user settings endpoints.
"""

from typing import Any, Dict

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.database.db import get_session
from app.models.user import User
from app.repositories.user_repo import UserRepo

router = APIRouter()


@router.get("")
def get_settings(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """Get current user's settings."""
    repo = UserRepo(session)
    settings = repo.get_or_create_settings(current_user.id)
    return settings.settings


@router.put("")
def update_settings(
    new_settings: Dict[str, Any],
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """Update current user's settings."""
    repo = UserRepo(session)
    settings = repo.get_or_create_settings(current_user.id)
    settings.settings = new_settings
    session.commit()
    return settings.settings


@router.patch("")
def patch_settings(
    partial_settings: Dict[str, Any],
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """Partially update settings (merge with existing)."""
    repo = UserRepo(session)
    settings = repo.get_or_create_settings(current_user.id)
    
    current = settings.settings
    current.update(partial_settings)
    settings.settings = current
    
    session.commit()
    return settings.settings
```

---

### Task 4.7: Register Settings Router

**File:** `backend/app/main.py`

```python
from app.api import settings  # ADD import

# ADD router registration
app.include_router(settings.router, prefix="/api/settings", tags=["settings"])
```

---

### Task 4.8: Update CORS for Auth Headers

**File:** `backend/app/main.py`

Ensure CORS allows the Authorization header (should already work with `allow_headers=["*"]` but verify).

---

## Phase 5: Frontend - Clerk Integration

These tasks add Clerk to the Next.js frontend.

---

### Task 5.1: Install Clerk

```bash
# From frontend directory
npm install @clerk/nextjs
```

---

### Task 5.2: Configure Clerk Environment

**File:** `frontend/.env.local` (create or update)

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxx
CLERK_SECRET_KEY=sk_test_xxxxxxxxxxxxx

NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
```

---

### Task 5.3: Add ClerkProvider to Layout

**File:** `frontend/src/app/layout.tsx`

```tsx
import { ClerkProvider } from '@clerk/nextjs'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          {/* Your existing providers/layout */}
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}
```

---

### Task 5.4: Create Auth Middleware

**File:** `frontend/src/middleware.ts` (new file)

```typescript
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// Define which routes are public (don't require auth)
const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)',  // For Clerk/Stripe webhooks later
])

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
```

---

### Task 5.5: Create Sign-In Page

**File:** `frontend/src/app/sign-in/[[...sign-in]]/page.tsx` (new file)

```tsx
import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignIn />
    </div>
  )
}
```

---

### Task 5.6: Create Sign-Up Page

**File:** `frontend/src/app/sign-up/[[...sign-up]]/page.tsx` (new file)

```tsx
import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignUp />
    </div>
  )
}
```

---

### Task 5.7: Update API Client with Auth

**File:** `frontend/src/lib/api.ts` (update existing)

```typescript
import { useAuth } from '@clerk/nextjs'

// Create a hook for authenticated API calls
export function useApiClient() {
  const { getToken } = useAuth()

  return async function apiFetch<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = await getToken()
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        ...options.headers,
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    })

    if (!response.ok) {
      if (response.status === 401) {
        // Token expired or invalid - Clerk will handle redirect
        throw new Error('Unauthorized')
      }
      throw new Error(`API error: ${response.status}`)
    }

    return response.json()
  }
}

// For server components or non-hook contexts
export async function apiServerFetch<T>(
  endpoint: string,
  token: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      ...options.headers,
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`)
  }

  return response.json()
}
```

---

### Task 5.8: Update Navigation with User Menu

Update your navigation component to show sign in/out and user avatar:

```tsx
import { SignedIn, SignedOut, UserButton, SignInButton } from '@clerk/nextjs'

export function Navigation() {
  return (
    <nav>
      {/* Your existing nav items */}
      
      <SignedOut>
        <SignInButton mode="modal">
          <button className="btn">Sign In</button>
        </SignInButton>
      </SignedOut>
      
      <SignedIn>
        <UserButton afterSignOutUrl="/" />
      </SignedIn>
    </nav>
  )
}
```

---

### Task 5.9: Update useSettings Hook

**File:** `frontend/src/hooks/useSettings.ts` (update existing)

Migrate from localStorage to API-backed settings:

```typescript
import { useAuth } from '@clerk/nextjs'
import { useCallback, useEffect, useState } from 'react'

const API_BASE = process.env.NEXT_PUBLIC_API_URL

interface Settings {
  theme: 'light' | 'dark' | 'system'
  defaultServings: number
  // ... other settings
}

const DEFAULT_SETTINGS: Settings = {
  theme: 'system',
  defaultServings: 4,
  // ...
}

export function useSettings() {
  const { getToken, isSignedIn } = useAuth()
  const [settings, setSettingsState] = useState<Settings>(DEFAULT_SETTINGS)
  const [isLoading, setIsLoading] = useState(true)

  // Load settings on mount
  useEffect(() => {
    async function loadSettings() {
      if (!isSignedIn) {
        // Use localStorage for non-authenticated users
        const stored = localStorage.getItem('settings')
        if (stored) {
          setSettingsState(JSON.parse(stored))
        }
        setIsLoading(false)
        return
      }

      try {
        const token = await getToken()
        const response = await fetch(`${API_BASE}/api/settings`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        
        if (response.ok) {
          const data = await response.json()
          setSettingsState(data)
          // Also store theme in localStorage for instant load
          localStorage.setItem('theme', data.theme)
        }
      } catch (error) {
        console.error('Failed to load settings:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadSettings()
  }, [isSignedIn, getToken])

  // Update settings
  const updateSettings = useCallback(
    async (newSettings: Partial<Settings>) => {
      const updated = { ...settings, ...newSettings }
      setSettingsState(updated)

      // Always store theme locally for instant load
      if (newSettings.theme) {
        localStorage.setItem('theme', newSettings.theme)
      }

      if (!isSignedIn) {
        localStorage.setItem('settings', JSON.stringify(updated))
        return
      }

      try {
        const token = await getToken()
        await fetch(`${API_BASE}/api/settings`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(newSettings),
        })
      } catch (error) {
        console.error('Failed to save settings:', error)
      }
    },
    [settings, isSignedIn, getToken]
  )

  return { settings, updateSettings, isLoading }
}
```

---

### Task 5.10: Add Railway Environment Variables

In Railway dashboard, add for frontend:

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxxxx
CLERK_SECRET_KEY=sk_live_xxxxx
```

---

## Phase 6: Testing & Security Verification

---

### Task 6.1: Test Data Isolation

Create a test file or manually verify:

1. Sign up as User A
2. Create a recipe
3. Sign out
4. Sign up as User B
5. Verify User B cannot see User A's recipe
6. Verify API returns 404 (not 403) for User A's recipe ID

---

### Task 6.2: Test Auth Flow

1. Visit app while signed out → redirected to sign-in
2. Sign in → redirected to app
3. Refresh page → stays signed in
4. Sign out → redirected to sign-in
5. API calls without token → 401 error

---

### Task 6.3: Test Settings Migration

1. Sign in as first user (claims existing data)
2. Verify all existing recipes/meals are accessible
3. Verify settings sync between devices

---

## Checklist Summary

```
Phase 1: Backend Models & Migrations
[ ] 1.1   Create User model
[ ] 1.2   Create UserSettings model
[ ] 1.2b  Create UserUsage model
[ ] 1.3   Update models __init__.py
[ ] 1.4   Add user_id to Recipe
[ ] 1.5   Add user_id to Meal
[ ] 1.6   Add user_id to PlannerEntry
[ ] 1.7   Add user_id to ShoppingItem
[ ] 1.8   Add user_id to RecipeHistory
[ ] 1.9   Update Alembic env.py
[ ] 1.10  Generate Alembic migration
[ ] 1.11  Modify migration for existing data (includes user_usage table)
[ ] 1.12  Run migration

Phase 2: Auth Dependencies
[ ] 2.1  Install auth dependencies
[ ] 2.2  Create auth_config.py
[ ] 2.3  Create dependencies.py
[ ] 2.4  Add environment variables

Phase 3: Update Services
[ ] 3.1   Create UserRepo
[ ] 3.1b  Create UsageService
[ ] 3.2   Update RecipeRepo
[ ] 3.3   Update RecipeService
[ ] 3.4   Update MealService
[ ] 3.5   Update MealRepo
[ ] 3.6   Update PlannerService
[ ] 3.7   Update PlannerRepo
[ ] 3.8   Update ShoppingService
[ ] 3.9   Update ShoppingRepo
[ ] 3.10  Update DashboardService

Phase 4: Update API Routes
[ ] 4.1  Update recipes.py
[ ] 4.2  Update meals.py
[ ] 4.3  Update planner.py
[ ] 4.4  Update shopping.py
[ ] 4.5  Update dashboard.py
[ ] 4.6  Create settings.py
[ ] 4.7  Register settings router
[ ] 4.8  Verify CORS config
[ ] 4.9  Add usage tracking to AI endpoints

Phase 5: Frontend Clerk
[ ] 5.1  Install @clerk/nextjs
[ ] 5.2  Configure environment
[ ] 5.3  Add ClerkProvider
[ ] 5.4  Create middleware
[ ] 5.5  Create sign-in page
[ ] 5.6  Create sign-up page
[ ] 5.7  Update API client
[ ] 5.8  Update navigation
[ ] 5.9  Update useSettings hook
[ ] 5.10 Add Railway variables

Phase 6: Testing
[ ] 6.1  Test data isolation
[ ] 6.2  Test auth flow
[ ] 6.3  Test settings migration
[ ] 6.4  Test usage tracking (verify increments on AI calls)
```

---

## Next Steps After Auth

Once authentication is working:

1. **Clerk Dashboard Setup** - Configure allowed domains, branding, etc.
2. **Error Monitoring** - Add Sentry for production error tracking
3. **Feature Flags** - Stub out premium feature checks
4. **Stripe Integration** - When ready for subscriptions