"""Add stable image_key to recipe for environment-independent Cloudinary addressing

Revision ID: b7e3f1a9c2d4
Revises: f9a8b7c6d5e4
Create Date: 2026-06-18

Recipe images were addressed in Cloudinary by the recipe's auto-increment
primary key, which differs between SQLite (local) and Postgres (prod). Moving
recipes between environments (backup/restore, copy scripts) left image URLs
pointing at a different recipe's id-keyed asset, causing images to appear
"reassigned". This adds a stable per-recipe image_key (uuid hex) that is used
to address Cloudinary assets instead of the mutable primary key.

Existing rows are backfilled with fresh uuids; their already-stored absolute
Cloudinary URLs keep working, and future uploads/regenerations use the
image_key-based path.
"""

import uuid
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b7e3f1a9c2d4'
down_revision: Union[str, Sequence[str], None] = 'f9a8b7c6d5e4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Add the column as nullable so existing rows can be backfilled.
    with op.batch_alter_table('recipe') as batch_op:
        batch_op.add_column(sa.Column('image_key', sa.String(length=32), nullable=True))

    # 2. Backfill existing rows with unique uuid hex values. Generated in Python
    #    for portability (SQLite has no uuid function).
    conn = op.get_bind()
    rows = conn.execute(sa.text("SELECT id FROM recipe WHERE image_key IS NULL")).fetchall()
    for (recipe_id,) in rows:
        conn.execute(
            sa.text("UPDATE recipe SET image_key = :key WHERE id = :id"),
            {"key": uuid.uuid4().hex, "id": recipe_id},
        )

    # 3. Enforce NOT NULL now that every row has a value, and add a unique index.
    with op.batch_alter_table('recipe') as batch_op:
        batch_op.alter_column('image_key', existing_type=sa.String(length=32), nullable=False)
    op.create_index('ix_recipe_image_key', 'recipe', ['image_key'], unique=True)


def downgrade() -> None:
    op.drop_index('ix_recipe_image_key', table_name='recipe')
    with op.batch_alter_table('recipe') as batch_op:
        batch_op.drop_column('image_key')
