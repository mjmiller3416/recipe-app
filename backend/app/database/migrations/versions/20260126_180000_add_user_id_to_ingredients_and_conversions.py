"""Add user_id to ingredients and unit_conversion_rules

Revision ID: a1b2c3d4e5f6
Revises: efdfb2d763f7
Create Date: 2026-01-26 18:00:00.000000

Adds user ownership to ingredients and unit conversion rules tables.
Existing data is assigned to user_id=1 (Maryann).
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'h8i9j0k1l2m3'
down_revision: Union[str, Sequence[str], None] = 'efdfb2d763f7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema.

    Adds user_id column to ingredients and unit_conversion_rules tables
    for multi-user support. Existing data is assigned to user_id=1 (Maryann).
    """
    # --- Ingredients ---
    # For SQLite, we need batch mode to handle constraint changes
    with op.batch_alter_table('ingredients', recreate='always') as batch_op:
        # Add user_id column (with default for existing rows)
        batch_op.add_column(sa.Column('user_id', sa.Integer(), nullable=False, server_default='1'))

        # Create index for fast user lookups
        batch_op.create_index('ix_ingredients_user_id', ['user_id'], unique=False)

        # Add foreign key to users table
        batch_op.create_foreign_key(
            'fk_ingredients_user_id',
            'users',
            ['user_id'],
            ['id'],
            ondelete='CASCADE'
        )

        # Drop old unique constraint and create new one that includes user_id
        batch_op.drop_constraint('uq_ingredient_name_category', type_='unique')
        batch_op.create_unique_constraint(
            'uq_ingredient_user_name_category',
            ['user_id', 'ingredient_name', 'ingredient_category']
        )

    # Remove the server default after migration (not needed for new rows)
    with op.batch_alter_table('ingredients') as batch_op:
        batch_op.alter_column('user_id', server_default=None)

    # --- Unit Conversion Rules ---
    with op.batch_alter_table('unit_conversion_rules', recreate='always') as batch_op:
        # Add user_id column (with default for existing rows)
        batch_op.add_column(sa.Column('user_id', sa.Integer(), nullable=False, server_default='1'))

        # Create index for fast user lookups
        batch_op.create_index('ix_unit_conversion_rules_user_id', ['user_id'], unique=False)

        # Add foreign key to users table
        batch_op.create_foreign_key(
            'fk_unit_conversion_rules_user_id',
            'users',
            ['user_id'],
            ['id'],
            ondelete='CASCADE'
        )

    # Remove the server default after migration
    with op.batch_alter_table('unit_conversion_rules') as batch_op:
        batch_op.alter_column('user_id', server_default=None)


def downgrade() -> None:
    """Downgrade schema."""
    # --- Unit Conversion Rules ---
    with op.batch_alter_table('unit_conversion_rules', recreate='always') as batch_op:
        batch_op.drop_constraint('fk_unit_conversion_rules_user_id', type_='foreignkey')
        batch_op.drop_index('ix_unit_conversion_rules_user_id')
        batch_op.drop_column('user_id')

    # --- Ingredients ---
    with op.batch_alter_table('ingredients', recreate='always') as batch_op:
        # Drop new unique constraint and recreate old one
        batch_op.drop_constraint('uq_ingredient_user_name_category', type_='unique')
        batch_op.create_unique_constraint(
            'uq_ingredient_name_category',
            ['ingredient_name', 'ingredient_category']
        )
        batch_op.drop_constraint('fk_ingredients_user_id', type_='foreignkey')
        batch_op.drop_index('ix_ingredients_user_id')
        batch_op.drop_column('user_id')
