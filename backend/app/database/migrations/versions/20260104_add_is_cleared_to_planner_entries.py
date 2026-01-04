"""Add is_cleared column to planner_entries for soft-delete

Revision ID: c4d5e6f7a8b9
Revises: 30b55b0ac0d4
Create Date: 2026-01-04

Adds a boolean flag to soft-delete completed entries while preserving
cooking history for streak calculation.
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c4d5e6f7a8b9'
down_revision: Union[str, Sequence[str], None] = '30b55b0ac0d4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add is_cleared column with default False for existing rows."""
    op.add_column(
        'planner_entries',
        sa.Column('is_cleared', sa.Boolean(), nullable=False, server_default='0')
    )


def downgrade() -> None:
    """Remove is_cleared column."""
    op.drop_column('planner_entries', 'is_cleared')
