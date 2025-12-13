""" app/core/database/migrations/env.py
Alembic migration environment setup for the recipe_app project.

This script configures the Alembic migration context, loads environment variables,
and ensures that all SQLAlchemy models are registered for migrations. It supports
both offline and online migration modes.

Key functionalities:
- Loads environment variables from a .env file located at the project root.
- Adds the project root to sys.path for module resolution.
- Configures the Alembic context with the database URL, using DATABASE_URL from
    the environment if available.
- Imports SQLAlchemy models to register their metadata for migrations.
- Defines functions to run migrations in both offline and online modes.

Usage:
This script is automatically invoked by Alembic when running migration commands.
"""

import os
import sys
# ── Imports ─────────────────────────────────────────────────────────────────────────────
from logging.config import fileConfig
from pathlib import Path

from alembic import context
from dotenv import load_dotenv
from sqlalchemy import engine_from_config, pool

# load .env file (project root assumed)
load_dotenv(dotenv_path=Path(__file__).resolve().parents[4] / ".env")

# add project root to sys.path
sys.path.append(str(Path(__file__).resolve().parents[4]))

# ── Alembic Config ──────────────────────────────────────────────────────────────────────
config = context.config
fileConfig(config.config_file_name)

# Override URL if DATABASE_URL is set
database_url = os.getenv("DATABASE_URL")
if database_url:
    config.set_main_option("sqlalchemy.url", database_url)

# ── Import metadata ─────────────────────────────────────────────────────────────────────
from app.core.database.base import Base
from app.core.models.ingredient import Ingredient
# import all models to register them with metadata
from app.core.models.recipe import Recipe
from app.core.models.recipe_history import RecipeHistory
from app.core.models.recipe_ingredient import RecipeIngredient

target_metadata = Base.metadata

# ── Run Migrations ──────────────────────────────────────────────────────────────────────
def run_migrations_offline():
    context.configure(
        url=config.get_main_option("sqlalchemy.url"),
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online():
    connectable = engine_from_config(
        config.get_section(config.config_ini_section),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
        )
        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
