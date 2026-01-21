"""Remove is_favorite column from meals

Revision ID: g2b3c4d5e6f7
Revises: f1a2b3c4d5e6
Create Date: 2026-01-20

With is_saved now handling persistence, is_favorite is redundant for meals.
Recipe favorites remain unaffected.
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'g2b3c4d5e6f7'
down_revision: Union[str, Sequence[str], None] = 'f1a2b3c4d5e6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Remove is_favorite column from meals table."""
    op.drop_column('meals', 'is_favorite')


def downgrade() -> None:
    """Restore is_favorite column to meals table."""
    op.add_column(
        'meals',
        sa.Column('is_favorite', sa.Boolean(), nullable=False, server_default='0')
    )
    # Copy is_saved back to is_favorite for rollback
    op.execute('UPDATE meals SET is_favorite = is_saved')
