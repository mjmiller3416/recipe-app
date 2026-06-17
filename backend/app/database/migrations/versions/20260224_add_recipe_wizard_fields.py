"""Add wizard fields to recipe table (description, prep_time, cook_time, difficulty)

Revision ID: 5a6b7c8d9e0f
Revises: 3f4a5b6c7d8e
Create Date: 2026-02-24

Adds new columns to support the Recipe Wizard: description, prep_time,
cook_time (split from total_time), and difficulty.
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '5a6b7c8d9e0f'
down_revision: Union[str, Sequence[str], None] = '7f3d7aaf21f9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('recipe', sa.Column('description', sa.Text(), nullable=True))
    op.add_column('recipe', sa.Column('prep_time', sa.Integer(), nullable=True))
    op.add_column('recipe', sa.Column('cook_time', sa.Integer(), nullable=True))
    op.add_column('recipe', sa.Column('difficulty', sa.String(20), nullable=True))


def downgrade() -> None:
    op.drop_column('recipe', 'difficulty')
    op.drop_column('recipe', 'cook_time')
    op.drop_column('recipe', 'prep_time')
    op.drop_column('recipe', 'description')
