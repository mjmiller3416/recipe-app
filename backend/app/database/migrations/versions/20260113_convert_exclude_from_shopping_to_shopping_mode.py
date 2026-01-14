"""Convert exclude_from_shopping boolean to shopping_mode enum string

Revision ID: e6f7a8b9c0d1
Revises: d5e6f7a8b9c0
Create Date: 2026-01-13

Changes the exclude_from_shopping boolean field to a shopping_mode string field
that supports three states: 'all', 'produce_only', 'none'.

Data migration:
- False (included) -> 'all'
- True (excluded) -> 'none'
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e6f7a8b9c0d1'
down_revision: Union[str, Sequence[str], None] = 'd5e6f7a8b9c0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Convert exclude_from_shopping boolean to shopping_mode string."""
    # Step 1: Add new shopping_mode column with default 'all'
    op.add_column(
        'planner_entries',
        sa.Column('shopping_mode', sa.String(20), nullable=False, server_default='all')
    )

    # Step 2: Migrate existing data
    # exclude_from_shopping=False -> 'all' (already default)
    # exclude_from_shopping=True -> 'none'
    op.execute("""
        UPDATE planner_entries
        SET shopping_mode = 'none'
        WHERE exclude_from_shopping = 1
    """)

    # Step 3: Drop the old column
    op.drop_column('planner_entries', 'exclude_from_shopping')


def downgrade() -> None:
    """Convert shopping_mode string back to exclude_from_shopping boolean."""
    # Step 1: Add back the boolean column
    op.add_column(
        'planner_entries',
        sa.Column('exclude_from_shopping', sa.Boolean(), nullable=False, server_default='0')
    )

    # Step 2: Migrate data back
    # 'none' -> True (excluded)
    # 'all' or 'produce_only' -> False (included)
    op.execute("""
        UPDATE planner_entries
        SET exclude_from_shopping = 1
        WHERE shopping_mode = 'none'
    """)

    # Step 3: Drop the shopping_mode column
    op.drop_column('planner_entries', 'shopping_mode')
