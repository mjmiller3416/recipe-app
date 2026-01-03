"""add recipe_sources to shopping_item

Revision ID: 30b55b0ac0d4
Revises: b2c3d4e5f6a7
Create Date: 2026-01-03 16:04:39.734338

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '30b55b0ac0d4'
down_revision: Union[str, Sequence[str], None] = 'b2c3d4e5f6a7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add recipe_sources JSON column to shopping_items."""
    op.add_column('shopping_items', sa.Column('recipe_sources', sa.JSON(), nullable=True))


def downgrade() -> None:
    """Remove recipe_sources column from shopping_items."""
    op.drop_column('shopping_items', 'recipe_sources')
