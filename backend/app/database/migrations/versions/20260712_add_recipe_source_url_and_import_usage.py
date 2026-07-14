"""Add source_url to recipe and recipes_imported to user_usage

Revision ID: c9d2e4f7a3b5
Revises: b7e3f1a9c2d4
Create Date: 2026-07-12

Supports the import-recipe-from-URL feature: recipes remember the page they
were imported from (for attribution and the "imported" badge), and monthly
usage tracking gains a counter for imports.
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c9d2e4f7a3b5'
down_revision: Union[str, Sequence[str], None] = 'b7e3f1a9c2d4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'recipe',
        sa.Column('source_url', sa.String(length=2048), nullable=True)
    )
    op.add_column(
        'user_usage',
        sa.Column('recipes_imported', sa.Integer(), nullable=False, server_default='0')
    )


def downgrade() -> None:
    op.drop_column('user_usage', 'recipes_imported')
    op.drop_column('recipe', 'source_url')
