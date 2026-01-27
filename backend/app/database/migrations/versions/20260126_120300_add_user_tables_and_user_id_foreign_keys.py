"""Add user tables and user_id foreign keys

Revision ID: 4da72da66574
Revises: g2b3c4d5e6f7
Create Date: 2026-01-26 12:03:00.337615

This migration:
1. Creates users and user_settings tables
2. Inserts Maryann's user record (owns all existing data)
3. Adds user_id foreign keys to recipe, meals, planner_entries, shopping_items, recipe_history
4. Migrates existing data to belong to Maryann (user_id = 1)

When Maryann signs in with Clerk using her email, the auth system will:
- See no user with her clerk_id
- Find an unclaimed user (clerk_id='pending_claim') matching her email
- Claim that account by updating clerk_id
- She gets all existing data

Anyone else signing in gets a fresh, empty account.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '4da72da66574'
down_revision: Union[str, Sequence[str], None] = 'g2b3c4d5e6f7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # ==========================================================================
    # STEP 1: Create users table
    # ==========================================================================
    op.create_table('users',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('clerk_id', sa.String(length=255), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=True),
        sa.Column('avatar_url', sa.Text(), nullable=True),
        sa.Column('is_admin', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('stripe_customer_id', sa.String(length=255), nullable=True),
        sa.Column('subscription_tier', sa.String(length=50), nullable=False, server_default='free'),
        sa.Column('subscription_status', sa.String(length=50), nullable=False, server_default='active'),
        sa.Column('subscription_ends_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('granted_pro_until', sa.DateTime(timezone=True), nullable=True),
        sa.Column('granted_by', sa.String(length=100), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('stripe_customer_id')
    )
    op.create_index(op.f('ix_users_clerk_id'), 'users', ['clerk_id'], unique=True)
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)

    # ==========================================================================
    # STEP 2a: Create user_settings table
    # ==========================================================================
    op.create_table('user_settings',
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('settings_json', sa.Text(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('user_id')
    )

    # ==========================================================================
    # STEP 2b: Create user_usage table for tracking AI feature usage
    # ==========================================================================
    op.create_table('user_usage',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('month', sa.String(length=7), nullable=False),  # Format: YYYY-MM
        sa.Column('ai_images_generated', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('ai_suggestions_requested', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('ai_assistant_messages', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('recipes_created', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'month', name='uq_user_usage_user_month')
    )
    op.create_index('ix_user_usage_user_id', 'user_usage', ['user_id'])
    op.create_index('ix_user_usage_month', 'user_usage', ['month'])

    # ==========================================================================
    # STEP 3: Insert Maryann's user record (owns all existing data)
    # clerk_id='pending_claim' will be updated when she signs in with Clerk
    # is_admin=true gives permanent full access regardless of subscription
    # ==========================================================================
    op.execute("""
        INSERT INTO users (
            clerk_id, email, name, is_admin,
            subscription_tier, subscription_status,
            created_at, updated_at
        ) VALUES (
            'pending_claim',
            'mmaryannr@gmail.com',
            'Maryann',
            true,
            'free',
            'active',
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
        )
    """)

    # ==========================================================================
    # STEP 4: Add user_id columns as NULLABLE (temporarily)
    # ==========================================================================
    op.add_column('recipe', sa.Column('user_id', sa.Integer(), nullable=True))
    op.add_column('meals', sa.Column('user_id', sa.Integer(), nullable=True))
    op.add_column('planner_entries', sa.Column('user_id', sa.Integer(), nullable=True))
    op.add_column('shopping_items', sa.Column('user_id', sa.Integer(), nullable=True))
    op.add_column('recipe_history', sa.Column('user_id', sa.Integer(), nullable=True))

    # ==========================================================================
    # STEP 5: Migrate existing data to Maryann (user_id = 1)
    # ==========================================================================
    op.execute("UPDATE recipe SET user_id = 1 WHERE user_id IS NULL")
    op.execute("UPDATE meals SET user_id = 1 WHERE user_id IS NULL")
    op.execute("UPDATE planner_entries SET user_id = 1 WHERE user_id IS NULL")
    op.execute("UPDATE shopping_items SET user_id = 1 WHERE user_id IS NULL")
    op.execute("UPDATE recipe_history SET user_id = 1 WHERE user_id IS NULL")

    # ==========================================================================
    # STEP 6: Alter columns to NOT NULL (now that all rows have values)
    # SQLite doesn't support ALTER COLUMN, so we use batch_alter_table
    # ==========================================================================
    with op.batch_alter_table('recipe') as batch_op:
        batch_op.alter_column('user_id', nullable=False)

    with op.batch_alter_table('meals') as batch_op:
        batch_op.alter_column('user_id', nullable=False)
        # Also fix created_at nullable while we're here
        batch_op.alter_column('created_at', nullable=False)

    with op.batch_alter_table('planner_entries') as batch_op:
        batch_op.alter_column('user_id', nullable=False)

    with op.batch_alter_table('shopping_items') as batch_op:
        batch_op.alter_column('user_id', nullable=False)

    with op.batch_alter_table('recipe_history') as batch_op:
        batch_op.alter_column('user_id', nullable=False)

    # ==========================================================================
    # STEP 7: Add foreign key constraints and indexes
    # Using batch operations for SQLite compatibility
    # ==========================================================================
    with op.batch_alter_table('recipe') as batch_op:
        batch_op.create_index('ix_recipe_user_id', ['user_id'], unique=False)
        batch_op.create_foreign_key('fk_recipe_user_id', 'users', ['user_id'], ['id'], ondelete='CASCADE')

    with op.batch_alter_table('meals') as batch_op:
        batch_op.create_index('ix_meals_user_id', ['user_id'], unique=False)
        batch_op.create_foreign_key('fk_meals_user_id', 'users', ['user_id'], ['id'], ondelete='CASCADE')

    with op.batch_alter_table('planner_entries') as batch_op:
        batch_op.create_index('ix_planner_entries_user_id', ['user_id'], unique=False)
        batch_op.create_foreign_key('fk_planner_entries_user_id', 'users', ['user_id'], ['id'], ondelete='CASCADE')

    with op.batch_alter_table('shopping_items') as batch_op:
        batch_op.create_index('ix_shopping_items_user_id', ['user_id'], unique=False)
        batch_op.create_foreign_key('fk_shopping_items_user_id', 'users', ['user_id'], ['id'], ondelete='CASCADE')

    with op.batch_alter_table('recipe_history') as batch_op:
        batch_op.create_index('ix_recipe_history_user_id', ['user_id'], unique=False)
        batch_op.create_foreign_key('fk_recipe_history_user_id', 'users', ['user_id'], ['id'], ondelete='CASCADE')
        # Note: Existing recipe_id FK doesn't have CASCADE, but SQLite anonymous FKs
        # can't be easily modified. CASCADE behavior handled at app level.

    # ==========================================================================
    # STEP 8: Add missing indexes on recipe table (detected by autogenerate)
    # ==========================================================================
    op.create_index(op.f('ix_recipe_is_favorite'), 'recipe', ['is_favorite'], unique=False)
    op.create_index(op.f('ix_recipe_meal_type'), 'recipe', ['meal_type'], unique=False)
    op.create_index(op.f('ix_recipe_recipe_category'), 'recipe', ['recipe_category'], unique=False)

    # ==========================================================================
    # STEP 9: Add missing indexes and constraint on ingredients table
    # Using batch mode for SQLite unique constraint support
    # ==========================================================================
    with op.batch_alter_table('ingredients') as batch_op:
        batch_op.create_index('ix_ingredients_ingredient_category', ['ingredient_category'], unique=False)
        batch_op.create_index('ix_ingredients_ingredient_name', ['ingredient_name'], unique=False)
        batch_op.create_unique_constraint('uq_ingredient_name_category', ['ingredient_name', 'ingredient_category'])

    # Note: STEP 10 (recipe_ingredients FK CASCADE) removed - SQLite anonymous FKs
    # can't be modified by name. Will be handled in PostgreSQL migration or app level.


def downgrade() -> None:
    """Downgrade schema - reverse all changes."""
    # Note: STEP 10 was removed (recipe_ingredients FK) - nothing to reverse

    # ==========================================================================
    # Reverse STEP 9: Remove ingredient indexes and constraint
    # ==========================================================================
    with op.batch_alter_table('ingredients') as batch_op:
        batch_op.drop_constraint('uq_ingredient_name_category', type_='unique')
        batch_op.drop_index('ix_ingredients_ingredient_name')
        batch_op.drop_index('ix_ingredients_ingredient_category')

    # ==========================================================================
    # Reverse STEP 8: Remove recipe indexes
    # ==========================================================================
    op.drop_index(op.f('ix_recipe_recipe_category'), table_name='recipe')
    op.drop_index(op.f('ix_recipe_meal_type'), table_name='recipe')
    op.drop_index(op.f('ix_recipe_is_favorite'), table_name='recipe')

    # ==========================================================================
    # Reverse STEP 7: Remove foreign keys and indexes
    # ==========================================================================
    with op.batch_alter_table('recipe_history') as batch_op:
        batch_op.drop_constraint('fk_recipe_history_user_id', type_='foreignkey')
        batch_op.drop_index('ix_recipe_history_user_id')

    with op.batch_alter_table('shopping_items') as batch_op:
        batch_op.drop_constraint('fk_shopping_items_user_id', type_='foreignkey')
        batch_op.drop_index('ix_shopping_items_user_id')

    with op.batch_alter_table('planner_entries') as batch_op:
        batch_op.drop_constraint('fk_planner_entries_user_id', type_='foreignkey')
        batch_op.drop_index('ix_planner_entries_user_id')

    with op.batch_alter_table('meals') as batch_op:
        batch_op.drop_constraint('fk_meals_user_id', type_='foreignkey')
        batch_op.drop_index('ix_meals_user_id')

    with op.batch_alter_table('recipe') as batch_op:
        batch_op.drop_constraint('fk_recipe_user_id', type_='foreignkey')
        batch_op.drop_index('ix_recipe_user_id')

    # ==========================================================================
    # Reverse STEPS 4-6: Remove user_id columns
    # Note: Data loss is expected - existing data will lose user association
    # ==========================================================================
    with op.batch_alter_table('recipe_history') as batch_op:
        batch_op.drop_column('user_id')

    with op.batch_alter_table('shopping_items') as batch_op:
        batch_op.drop_column('user_id')

    with op.batch_alter_table('planner_entries') as batch_op:
        batch_op.drop_column('user_id')

    with op.batch_alter_table('meals') as batch_op:
        batch_op.drop_column('user_id')
        batch_op.alter_column('created_at', nullable=True)

    with op.batch_alter_table('recipe') as batch_op:
        batch_op.drop_column('user_id')

    # ==========================================================================
    # Reverse STEP 2b: Drop user_usage table
    # ==========================================================================
    op.drop_index('ix_user_usage_month', table_name='user_usage')
    op.drop_index('ix_user_usage_user_id', table_name='user_usage')
    op.drop_table('user_usage')

    # ==========================================================================
    # Reverse STEPS 1-3: Drop user tables (this deletes Maryann's user record)
    # ==========================================================================
    op.drop_table('user_settings')
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_index(op.f('ix_users_clerk_id'), table_name='users')
    op.drop_table('users')
