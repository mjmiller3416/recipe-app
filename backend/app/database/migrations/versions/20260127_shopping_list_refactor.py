"""Shopping list architectural refactor - diff-based sync

Revision ID: h3c4d5e6f7g8
Revises: g2b3c4d5e6f7
Create Date: 2026-01-27

This migration implements the shopping list architectural refactor:
1. Creates shopping_item_contributions junction table for tracking recipe/entry contributions
2. Adds aggregation_key column to shopping_items (replaces state_key)
3. Migrates existing state_key values to aggregation_key
4. Drops state_key and recipe_sources columns from shopping_items
5. Drops shopping_states table (no longer needed with contributions model)
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'h3c4d5e6f7g8'
down_revision: Union[str, Sequence[str], None] = 'g2b3c4d5e6f7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Apply shopping list refactor migration."""

    # 1. Create the new shopping_item_contributions table
    op.create_table(
        'shopping_item_contributions',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('shopping_item_id', sa.Integer(), nullable=False),
        sa.Column('recipe_id', sa.Integer(), nullable=False),
        sa.Column('planner_entry_id', sa.Integer(), nullable=False),
        sa.Column('base_quantity', sa.Float(), nullable=False),
        sa.Column('dimension', sa.String(20), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['shopping_item_id'], ['shopping_items.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['recipe_id'], ['recipe.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['planner_entry_id'], ['planner_entries.id'], ondelete='CASCADE'),
        sa.UniqueConstraint('shopping_item_id', 'recipe_id', 'planner_entry_id',
                           name='uq_contribution_item_recipe_entry')
    )

    # Create indexes for efficient lookups
    op.create_index('idx_contributions_item', 'shopping_item_contributions', ['shopping_item_id'])
    op.create_index('idx_contributions_entry', 'shopping_item_contributions', ['planner_entry_id'])
    op.create_index('idx_contributions_recipe', 'shopping_item_contributions', ['recipe_id'])

    # 2. Add aggregation_key column to shopping_items
    op.add_column(
        'shopping_items',
        sa.Column('aggregation_key', sa.String(255), nullable=True)
    )
    op.create_index('ix_shopping_items_aggregation_key', 'shopping_items', ['aggregation_key'], unique=True)

    # 3. Migrate state_key values to aggregation_key
    # Use raw SQL for data migration
    op.execute("""
        UPDATE shopping_items
        SET aggregation_key = state_key
        WHERE state_key IS NOT NULL
    """)

    # 4. Drop state_key column
    op.drop_column('shopping_items', 'state_key')

    # 5. Drop recipe_sources column
    op.drop_column('shopping_items', 'recipe_sources')

    # 6. Drop shopping_states table
    op.drop_table('shopping_states')


def downgrade() -> None:
    """Reverse the shopping list refactor migration."""

    # 1. Recreate shopping_states table
    op.create_table(
        'shopping_states',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('key', sa.String(255), nullable=False),
        sa.Column('quantity', sa.Float(), nullable=False),
        sa.Column('unit', sa.String(50), nullable=False),
        sa.Column('checked', sa.Boolean(), nullable=False, default=False),
        sa.Column('flagged', sa.Boolean(), nullable=False, default=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('key')
    )

    # 2. Add recipe_sources column back
    op.add_column(
        'shopping_items',
        sa.Column('recipe_sources', sa.JSON(), nullable=True)
    )

    # 3. Add state_key column back
    op.add_column(
        'shopping_items',
        sa.Column('state_key', sa.String(255), nullable=True)
    )

    # 4. Migrate aggregation_key values back to state_key
    op.execute("""
        UPDATE shopping_items
        SET state_key = aggregation_key
        WHERE aggregation_key IS NOT NULL
    """)

    # 5. Drop aggregation_key index and column
    op.drop_index('ix_shopping_items_aggregation_key', 'shopping_items')
    op.drop_column('shopping_items', 'aggregation_key')

    # 6. Drop contributions table indexes
    op.drop_index('idx_contributions_recipe', 'shopping_item_contributions')
    op.drop_index('idx_contributions_entry', 'shopping_item_contributions')
    op.drop_index('idx_contributions_item', 'shopping_item_contributions')

    # 7. Drop shopping_item_contributions table
    op.drop_table('shopping_item_contributions')
