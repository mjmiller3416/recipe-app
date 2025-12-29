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

from typing import Optional, Sequence, Union

from alembic import op
from sqlalchemy import text


# revision identifiers, used by Alembic.
revision: str = '7a8b9c0d1e2f'
down_revision: Union[str, Sequence[str], None] = '6f0a15703ba1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def get_fk_constraint_name(conn, table_name: str, column_name: str) -> Optional[str]:
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


def fk_has_cascade(conn, constraint_name: str) -> bool:
    """Check if a FK constraint already has ON DELETE CASCADE."""
    result = conn.execute(text("""
        SELECT rc.delete_rule
        FROM information_schema.referential_constraints rc
        WHERE rc.constraint_name = :constraint_name
    """), {"constraint_name": constraint_name})
    row = result.fetchone()
    return row[0] == 'CASCADE' if row else False


def upgrade() -> None:
    """Add CASCADE DELETE to recipe foreign keys."""
    conn = op.get_bind()

    # Skip for SQLite - it doesn't support ALTER CONSTRAINT and handles cascades differently
    if conn.dialect.name == 'sqlite':
        print("SQLite detected - skipping CASCADE DELETE migration (not supported)")
        return

    print("Starting CASCADE DELETE migration...")

    # Update recipe_ingredients.recipe_id FK
    print("Checking recipe_ingredients.recipe_id FK...")
    fk_name = get_fk_constraint_name(conn, 'recipe_ingredients', 'recipe_id')
    print(f"  Found constraint: {fk_name}")

    if fk_name:
        if fk_has_cascade(conn, fk_name):
            print("  Already has CASCADE, skipping...")
        else:
            print(f"  Dropping constraint {fk_name}...")
            op.drop_constraint(fk_name, 'recipe_ingredients', type_='foreignkey')
            print("  Creating new constraint with CASCADE...")
            op.create_foreign_key(
                'recipe_ingredients_recipe_id_fkey',
                'recipe_ingredients',
                'recipe',
                ['recipe_id'],
                ['id'],
                ondelete='CASCADE'
            )
    else:
        print("  No existing FK found, creating new one...")
        op.create_foreign_key(
            'recipe_ingredients_recipe_id_fkey',
            'recipe_ingredients',
            'recipe',
            ['recipe_id'],
            ['id'],
            ondelete='CASCADE'
        )

    # Update recipe_history.recipe_id FK
    print("Checking recipe_history.recipe_id FK...")
    fk_name = get_fk_constraint_name(conn, 'recipe_history', 'recipe_id')
    print(f"  Found constraint: {fk_name}")

    if fk_name:
        if fk_has_cascade(conn, fk_name):
            print("  Already has CASCADE, skipping...")
        else:
            print(f"  Dropping constraint {fk_name}...")
            op.drop_constraint(fk_name, 'recipe_history', type_='foreignkey')
            print("  Creating new constraint with CASCADE...")
            op.create_foreign_key(
                'recipe_history_recipe_id_fkey',
                'recipe_history',
                'recipe',
                ['recipe_id'],
                ['id'],
                ondelete='CASCADE'
            )
    else:
        print("  No existing FK found, creating new one...")
        op.create_foreign_key(
            'recipe_history_recipe_id_fkey',
            'recipe_history',
            'recipe',
            ['recipe_id'],
            ['id'],
            ondelete='CASCADE'
        )

    print("Migration complete!")


def downgrade() -> None:
    """Remove CASCADE DELETE from recipe foreign keys."""
    conn = op.get_bind()

    # Skip for SQLite
    if conn.dialect.name == 'sqlite':
        print("SQLite detected - skipping CASCADE DELETE downgrade")
        return

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
