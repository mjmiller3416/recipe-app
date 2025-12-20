"""Add CASCADE DELETE to recipe foreign keys

Revision ID: 7a8b9c0d1e2f
Revises: 6f0a15703ba1
Create Date: 2025-12-19

This migration adds ON DELETE CASCADE to foreign keys in:
- recipe_ingredients.recipe_id
- recipe_history.recipe_id

This ensures that when a recipe is deleted, related records are automatically
cleaned up at the database level (required for PostgreSQL).
"""

from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = '7a8b9c0d1e2f'
down_revision: Union[str, Sequence[str], None] = '6f0a15703ba1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add CASCADE DELETE to recipe foreign keys."""
    # Update recipe_ingredients.recipe_id FK
    op.drop_constraint(
        'recipe_ingredients_recipe_id_fkey',
        'recipe_ingredients',
        type_='foreignkey'
    )
    op.create_foreign_key(
        'recipe_ingredients_recipe_id_fkey',
        'recipe_ingredients',
        'recipe',
        ['recipe_id'],
        ['id'],
        ondelete='CASCADE'
    )

    # Update recipe_history.recipe_id FK
    op.drop_constraint(
        'recipe_history_recipe_id_fkey',
        'recipe_history',
        type_='foreignkey'
    )
    op.create_foreign_key(
        'recipe_history_recipe_id_fkey',
        'recipe_history',
        'recipe',
        ['recipe_id'],
        ['id'],
        ondelete='CASCADE'
    )


def downgrade() -> None:
    """Remove CASCADE DELETE from recipe foreign keys."""
    # Revert recipe_ingredients.recipe_id FK
    op.drop_constraint(
        'recipe_ingredients_recipe_id_fkey',
        'recipe_ingredients',
        type_='foreignkey'
    )
    op.create_foreign_key(
        'recipe_ingredients_recipe_id_fkey',
        'recipe_ingredients',
        'recipe',
        ['recipe_id'],
        ['id']
    )

    # Revert recipe_history.recipe_id FK
    op.drop_constraint(
        'recipe_history_recipe_id_fkey',
        'recipe_history',
        type_='foreignkey'
    )
    op.create_foreign_key(
        'recipe_history_recipe_id_fkey',
        'recipe_history',
        'recipe',
        ['recipe_id'],
        ['id']
    )
