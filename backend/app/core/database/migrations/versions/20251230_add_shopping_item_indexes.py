"""Add indexes to shopping_items table for performance

Revision ID: 9c0d1e2f3a4b
Revises: 8b9c0d1e2f3a
Create Date: 2025-12-30

This migration adds indexes to frequently filtered columns in the
shopping_items table to improve query performance.
"""

from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = '9c0d1e2f3a4b'
down_revision: Union[str, Sequence[str], None] = '8b9c0d1e2f3a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add indexes for frequently filtered columns
    op.create_index('ix_shopping_items_category', 'shopping_items', ['category'])
    op.create_index('ix_shopping_items_source', 'shopping_items', ['source'])
    op.create_index('ix_shopping_items_have', 'shopping_items', ['have'])


def downgrade() -> None:
    op.drop_index('ix_shopping_items_have', table_name='shopping_items')
    op.drop_index('ix_shopping_items_source', table_name='shopping_items')
    op.drop_index('ix_shopping_items_category', table_name='shopping_items')
