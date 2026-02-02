# Alembic Migrations

**Database schema changes via Alembic. Always review auto-generated migrations before applying.**

## Common Commands

```bash
# Generate migration from model changes
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Rollback one migration
alembic downgrade -1

# Check current version
alembic current
```

## Critical Safety Rules

### Making Fields Required (3-Step Process)

```python
# ❌ NEVER DO THIS - breaks existing data
op.add_column('recipes', sa.Column('new_field', sa.String(100), nullable=False))

# ✅ CORRECT - Three steps:
def upgrade() -> None:
    # 1. Add as nullable
    op.add_column('recipes', sa.Column('new_field', sa.String(100), nullable=True))

    # 2. Backfill with default value
    op.execute("UPDATE recipes SET new_field = 'default' WHERE new_field IS NULL")

    # 3. Make non-nullable
    op.alter_column('recipes', 'new_field', existing_type=sa.String(100), nullable=False)
```

### Foreign Keys (Always Add Index)

```python
def upgrade() -> None:
    # 1. Add column
    op.add_column('ingredients', sa.Column('recipe_id', sa.Integer(), nullable=True))

    # 2. Add foreign key constraint
    op.create_foreign_key(
        'fk_ingredients_recipe',
        'ingredients',
        'recipes',
        ['recipe_id'],
        ['id'],
        ondelete='CASCADE'
    )

    # 3. CRITICAL: Add index for performance
    op.create_index('ix_ingredients_recipe_id', 'ingredients', ['recipe_id'])
```

## Common Mistakes to Avoid

- ❌ Add required columns without backfilling data first
- ❌ Drop columns/tables without backup
- ❌ Forget to create indexes on foreign keys
- ❌ Skip testing downgrades
- ❌ Modify existing migrations (create new ones instead)

## Quick Reference

| Operation | Command |
|-----------|---------|
| Add column | `op.add_column('table', sa.Column('name', sa.Type()))` |
| Drop column | `op.drop_column('table', 'column')` |
| Add index | `op.create_index('ix_name', 'table', ['column'])` |
| Add FK | `op.create_foreign_key('fk_name', 'source', 'target', ['col'], ['id'])` |
| Alter column | `op.alter_column('table', 'column', type_=sa.NewType())` |

**See:** [database/migrations/versions/](../../backend/database/migrations/versions/) for existing migrations.
