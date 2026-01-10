"""Add flagged column to shopping_states

Revision ID: d5e6f7a8b9c0
Revises: c4d5e6f7a8b9
Create Date: 2026-01-10

Persists the flagged status in shopping_states so it survives
shopping list regeneration when meal plan changes.
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd5e6f7a8b9c0'
down_revision: Union[str, Sequence[str], None] = 'c4d5e6f7a8b9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add flagged column with default False for existing rows."""
    op.add_column(
        'shopping_states',
        sa.Column('flagged', sa.Boolean(), nullable=False, server_default='0')
    )


def downgrade() -> None:
    """Remove flagged column."""
    op.drop_column('shopping_states', 'flagged')
