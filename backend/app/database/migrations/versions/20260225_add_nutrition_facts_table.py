"""Add nutrition_facts table

Revision ID: 58d413ef2c47
Revises: 5a6b7c8d9e0f
Create Date: 2026-02-25

Adds the nutrition_facts table for per-serving nutrition data,
linked one-to-one with the recipe table.
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '58d413ef2c47'
down_revision: Union[str, Sequence[str], None] = '5a6b7c8d9e0f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'nutrition_facts',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('recipe_id', sa.Integer(), nullable=False),
        sa.Column('calories', sa.Integer(), nullable=True),
        sa.Column('protein_g', sa.Float(), nullable=True),
        sa.Column('total_fat_g', sa.Float(), nullable=True),
        sa.Column('saturated_fat_g', sa.Float(), nullable=True),
        sa.Column('trans_fat_g', sa.Float(), nullable=True),
        sa.Column('cholesterol_mg', sa.Float(), nullable=True),
        sa.Column('sodium_mg', sa.Float(), nullable=True),
        sa.Column('total_carbs_g', sa.Float(), nullable=True),
        sa.Column('dietary_fiber_g', sa.Float(), nullable=True),
        sa.Column('total_sugars_g', sa.Float(), nullable=True),
        sa.Column('is_ai_estimated', sa.Boolean(), nullable=False, server_default='0'),
        sa.ForeignKeyConstraint(['recipe_id'], ['recipe.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_nutrition_facts_recipe_id', 'nutrition_facts', ['recipe_id'], unique=True)


def downgrade() -> None:
    op.drop_index('ix_nutrition_facts_recipe_id', table_name='nutrition_facts')
    op.drop_table('nutrition_facts')
