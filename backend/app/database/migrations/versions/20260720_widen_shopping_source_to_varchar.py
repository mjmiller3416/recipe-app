"""widen shopping_items.source from enum to varchar for external app sources

Allows trusted first-party apps (e.g. "tada") to be stored as a source slug
alongside the built-in "recipe" and "manual" values.

Revision ID: e3b8a5c1f2d4
Revises: c9d2e4f7a3b5
Create Date: 2026-07-20 12:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'e3b8a5c1f2d4'
down_revision: Union[str, Sequence[str], None] = 'c9d2e4f7a3b5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Convert source from the shopping_source enum to VARCHAR(20)."""
    bind = op.get_bind()
    if bind.dialect.name == 'postgresql':
        op.alter_column(
            'shopping_items',
            'source',
            existing_type=sa.Enum('recipe', 'manual', name='shopping_source'),
            type_=sa.String(length=20),
            existing_nullable=False,
            postgresql_using='source::text',
        )
        op.execute('DROP TYPE shopping_source')
    else:
        # SQLite stores the enum as VARCHAR(6) with no constraint; rebuild to widen
        with op.batch_alter_table('shopping_items') as batch_op:
            batch_op.alter_column(
                'source',
                existing_type=sa.VARCHAR(length=6),
                type_=sa.String(length=20),
                existing_nullable=False,
            )


def downgrade() -> None:
    """Restore the shopping_source enum, coercing external sources to 'manual'."""
    op.execute("UPDATE shopping_items SET source = 'manual' WHERE source NOT IN ('recipe', 'manual')")

    bind = op.get_bind()
    if bind.dialect.name == 'postgresql':
        op.execute("CREATE TYPE shopping_source AS ENUM ('recipe', 'manual')")
        op.alter_column(
            'shopping_items',
            'source',
            existing_type=sa.String(length=20),
            type_=postgresql.ENUM('recipe', 'manual', name='shopping_source', create_type=False),
            existing_nullable=False,
            postgresql_using='source::shopping_source',
        )
    else:
        with op.batch_alter_table('shopping_items') as batch_op:
            batch_op.alter_column(
                'source',
                existing_type=sa.String(length=20),
                type_=sa.VARCHAR(length=6),
                existing_nullable=False,
            )
