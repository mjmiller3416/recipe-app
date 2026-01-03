"""Add unit_conversion_rules table

Revision ID: 8b9c0d1e2f3a
Revises: 7a8b9c0d1e2f
Create Date: 2025-12-28

This migration adds the unit_conversion_rules table for storing
ingredient-specific unit conversions (e.g., butter tbs -> sticks).
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '8b9c0d1e2f3a'
down_revision: Union[str, Sequence[str], None] = '7a8b9c0d1e2f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'unit_conversion_rules',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('ingredient_name', sa.String(), nullable=False),
        sa.Column('from_unit', sa.String(), nullable=False),
        sa.Column('to_unit', sa.String(), nullable=False),
        sa.Column('factor', sa.Float(), nullable=False),
        sa.Column('round_up', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_unit_conversion_rules_ingredient_name', 'unit_conversion_rules', ['ingredient_name'])


def downgrade() -> None:
    op.drop_index('ix_unit_conversion_rules_ingredient_name')
    op.drop_table('unit_conversion_rules')
