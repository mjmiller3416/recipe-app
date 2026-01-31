"""Add recipe_groups table and recipe_group_association

Revision ID: a0b1c2d3e4f5
Revises: eacf0ae64c36
Create Date: 2026-01-30

This migration adds:
- recipe_groups table for user-defined recipe collections
- recipe_group_association table for many-to-many relationship with recipes
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a0b1c2d3e4f5'
down_revision: Union[str, Sequence[str], None] = 'eacf0ae64c36'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create recipe_groups table
    op.create_table(
        'recipe_groups',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_recipe_groups_user_id', 'recipe_groups', ['user_id'])

    # Create recipe_group_association table (many-to-many)
    op.create_table(
        'recipe_group_association',
        sa.Column('recipe_id', sa.Integer(), nullable=False),
        sa.Column('group_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['recipe_id'], ['recipe.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['group_id'], ['recipe_groups.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('recipe_id', 'group_id')
    )


def downgrade() -> None:
    op.drop_table('recipe_group_association')
    op.drop_index('ix_recipe_groups_user_id')
    op.drop_table('recipe_groups')
