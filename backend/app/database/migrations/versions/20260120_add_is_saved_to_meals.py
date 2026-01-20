"""Add is_saved column to meals for transient meal support

Revision ID: f1a2b3c4d5e6
Revises: e6f7a8b9c0d1
Create Date: 2026-01-20

Adds is_saved boolean to support transient meals that are auto-deleted
when they leave the planner. Existing meals get is_saved = is_favorite.
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f1a2b3c4d5e6'
down_revision: Union[str, Sequence[str], None] = 'e6f7a8b9c0d1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add is_saved column, default False, then set is_saved=is_favorite for existing rows."""
    op.add_column(
        'meals',
        sa.Column('is_saved', sa.Boolean(), nullable=False, server_default='0')
    )
    # Migrate existing data: set is_saved = is_favorite to preserve favorited meals
    op.execute('UPDATE meals SET is_saved = is_favorite')


def downgrade() -> None:
    """Remove is_saved column."""
    op.drop_column('meals', 'is_saved')
