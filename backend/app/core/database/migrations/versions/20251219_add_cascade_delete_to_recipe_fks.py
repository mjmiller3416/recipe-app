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
from sqlalchemy import text


# revision identifiers, used by Alembic.
revision: str = '7a8b9c0d1e2f'
down_revision: Union[str, Sequence[str], None] = '6f0a15703ba1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def get_fk_constraint_name(conn, table_name: str, column_name: str) -> str | None:
    """Query PostgreSQL to find the actual FK constraint name."""
    result = conn.execute(text("""
        SELECT tc.constraint_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY'
            AND tc.table_name = :table_name
            AND kcu.column_name = :column_name
    """), {"table_name": table_name, "column_name": column_name})
    row = result.fetchone()
    return row[0] if row else None


def upgrade() -> None:
    """Add CASCADE DELETE to recipe foreign keys."""
    conn = op.get_bind()

    # Update recipe_ingredients.recipe_id FK
    fk_name = get_fk_constraint_name(conn, 'recipe_ingredients', 'recipe_id')
    if fk_name:
        op.drop_constraint(fk_name, 'recipe_ingredients', type_='foreignkey')
    op.create_foreign_key(
        'recipe_ingredients_recipe_id_fkey',
        'recipe_ingredients',
        'recipe',
        ['recipe_id'],
        ['id'],
        ondelete='CASCADE'
    )

    # Update recipe_history.recipe_id FK
    fk_name = get_fk_constraint_name(conn, 'recipe_history', 'recipe_id')
    if fk_name:
        op.drop_constraint(fk_name, 'recipe_history', type_='foreignkey')
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
    conn = op.get_bind()

    # Revert recipe_ingredients.recipe_id FK
    fk_name = get_fk_constraint_name(conn, 'recipe_ingredients', 'recipe_id')
    if fk_name:
        op.drop_constraint(fk_name, 'recipe_ingredients', type_='foreignkey')
    op.create_foreign_key(
        'recipe_ingredients_recipe_id_fkey',
        'recipe_ingredients',
        'recipe',
        ['recipe_id'],
        ['id']
    )

    # Revert recipe_history.recipe_id FK
    fk_name = get_fk_constraint_name(conn, 'recipe_history', 'recipe_id')
    if fk_name:
        op.drop_constraint(fk_name, 'recipe_history', type_='foreignkey')
    op.create_foreign_key(
        'recipe_history_recipe_id_fkey',
        'recipe_history',
        'recipe',
        ['recipe_id'],
        ['id']
    )
