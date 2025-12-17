"""Refactor meals and planner

Revision ID: abc123def456
Revises: 9d7223f8cc90
Create Date: 2025-12-17 07:10:00.000000

"""
from typing import Sequence, Union
from datetime import datetime, timezone

import sqlalchemy as sa
from alembic import op


# revision identifiers, used by Alembic.
revision: str = 'abc123def456'
down_revision: Union[str, Sequence[str], None] = '9d7223f8cc90'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    Refactor meal_selections -> meals and saved_meal_states -> planner_entries.
    
    Key changes:
    1. Create new `meals` table with JSON side_recipe_ids, is_favorite, tags
    2. Create new `planner_entries` table with position, is_completed, completed_at, scheduled_date
    3. Migrate data from meal_selections to meals
    4. Migrate data from saved_meal_states to planner_entries
    5. Drop old tables
    """
    
    # Get database connection
    conn = op.get_bind()
    
    # ─── Step 1: Create new meals table ─────────────────────────────────────────────────────────────────────
    op.create_table(
        'meals',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('meal_name', sa.String(length=255), nullable=False),
        sa.Column('main_recipe_id', sa.Integer(), nullable=False),
        sa.Column('side_recipe_ids', sa.JSON(), nullable=False),
        sa.Column('is_favorite', sa.Boolean(), nullable=False, server_default='0'),
        sa.Column('tags', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['main_recipe_id'], ['recipe.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    
    # ─── Step 2: Create new planner_entries table ───────────────────────────────────────────────────────────
    op.create_table(
        'planner_entries',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('meal_id', sa.Integer(), nullable=False),
        sa.Column('position', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('is_completed', sa.Boolean(), nullable=False, server_default='0'),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('scheduled_date', sa.Date(), nullable=True),
        sa.ForeignKeyConstraint(['meal_id'], ['meals.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    
    # ─── Step 3: Migrate data from meal_selections to meals ─────────────────────────────────────────────────
    # Get all meal selections
    meal_selections = conn.execute(sa.text("""
        SELECT id, meal_name, main_recipe_id, side_recipe_1_id, side_recipe_2_id, side_recipe_3_id
        FROM meal_selections
    """)).fetchall()
    
    # Transform and insert into meals
    for meal in meal_selections:
        meal_id, meal_name, main_recipe_id, side1, side2, side3 = meal
        
        # Build side_recipe_ids JSON array (filter out NULL values)
        side_recipe_ids = []
        for side_id in [side1, side2, side3]:
            if side_id is not None:
                side_recipe_ids.append(side_id)
        
        # Use current timestamp for created_at
        created_at = datetime.now(timezone.utc)
        
        # Insert into meals table
        conn.execute(sa.text("""
            INSERT INTO meals (id, meal_name, main_recipe_id, side_recipe_ids, is_favorite, tags, created_at)
            VALUES (:id, :meal_name, :main_recipe_id, :side_recipe_ids, :is_favorite, :tags, :created_at)
        """), {
            'id': meal_id,
            'meal_name': meal_name,
            'main_recipe_id': main_recipe_id,
            'side_recipe_ids': sa.JSON.NULL_VALUE if not side_recipe_ids else side_recipe_ids,
            'is_favorite': False,
            'tags': sa.JSON.NULL_VALUE,
            'created_at': created_at
        })
    
    # ─── Step 4: Migrate data from saved_meal_states to planner_entries ─────────────────────────────────────
    # Get all saved meal states
    saved_meal_states = conn.execute(sa.text("""
        SELECT id, meal_id FROM saved_meal_states ORDER BY id
    """)).fetchall()
    
    # Transform and insert into planner_entries
    for position, state in enumerate(saved_meal_states):
        state_id, meal_id = state
        
        # Insert into planner_entries table
        conn.execute(sa.text("""
            INSERT INTO planner_entries (meal_id, position, is_completed, completed_at, scheduled_date)
            VALUES (:meal_id, :position, :is_completed, :completed_at, :scheduled_date)
        """), {
            'meal_id': meal_id,
            'position': position,
            'is_completed': False,
            'completed_at': None,
            'scheduled_date': None
        })
    
    # ─── Step 5: Drop old tables ────────────────────────────────────────────────────────────────────────────
    op.drop_table('saved_meal_states')
    op.drop_table('meal_selections')


def downgrade() -> None:
    """
    Reverse the refactoring (restore old schema).
    
    WARNING: This will lose data that doesn't fit the old schema:
    - is_favorite and tags from meals
    - is_completed, completed_at, scheduled_date from planner_entries
    - Side recipes beyond first 3 in non-contiguous order
    """
    
    # Get database connection
    conn = op.get_bind()
    
    # ─── Step 1: Recreate old meal_selections table ─────────────────────────────────────────────────────────
    op.create_table(
        'meal_selections',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('meal_name', sa.String(length=255), nullable=False),
        sa.Column('main_recipe_id', sa.Integer(), nullable=False),
        sa.Column('side_recipe_1_id', sa.Integer(), nullable=True),
        sa.Column('side_recipe_2_id', sa.Integer(), nullable=True),
        sa.Column('side_recipe_3_id', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['main_recipe_id'], ['recipe.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['side_recipe_1_id'], ['recipe.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['side_recipe_2_id'], ['recipe.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['side_recipe_3_id'], ['recipe.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    
    # ─── Step 2: Recreate old saved_meal_states table ───────────────────────────────────────────────────────
    op.create_table(
        'saved_meal_states',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('meal_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['meal_id'], ['meal_selections.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    
    # ─── Step 3: Migrate data from meals to meal_selections ─────────────────────────────────────────────────
    # Get all meals
    meals = conn.execute(sa.text("""
        SELECT id, meal_name, main_recipe_id, side_recipe_ids FROM meals
    """)).fetchall()
    
    # Transform and insert into meal_selections
    for meal in meals:
        meal_id, meal_name, main_recipe_id, side_recipe_ids_json = meal
        
        # Parse side_recipe_ids JSON array
        import json
        side_recipe_ids = json.loads(side_recipe_ids_json) if side_recipe_ids_json else []
        
        # Map to fixed slots (pad with NULL)
        side1 = side_recipe_ids[0] if len(side_recipe_ids) > 0 else None
        side2 = side_recipe_ids[1] if len(side_recipe_ids) > 1 else None
        side3 = side_recipe_ids[2] if len(side_recipe_ids) > 2 else None
        
        # Insert into meal_selections table
        conn.execute(sa.text("""
            INSERT INTO meal_selections (id, meal_name, main_recipe_id, side_recipe_1_id, side_recipe_2_id, side_recipe_3_id)
            VALUES (:id, :meal_name, :main_recipe_id, :side1, :side2, :side3)
        """), {
            'id': meal_id,
            'meal_name': meal_name,
            'main_recipe_id': main_recipe_id,
            'side1': side1,
            'side2': side2,
            'side3': side3
        })
    
    # ─── Step 4: Migrate data from planner_entries to saved_meal_states ─────────────────────────────────────
    # Get all planner entries
    planner_entries = conn.execute(sa.text("""
        SELECT meal_id FROM planner_entries ORDER BY position
    """)).fetchall()
    
    # Transform and insert into saved_meal_states
    for entry in planner_entries:
        meal_id = entry[0]
        
        # Insert into saved_meal_states table
        conn.execute(sa.text("""
            INSERT INTO saved_meal_states (meal_id) VALUES (:meal_id)
        """), {'meal_id': meal_id})
    
    # ─── Step 5: Drop new tables ────────────────────────────────────────────────────────────────────────────
    op.drop_table('planner_entries')
    op.drop_table('meals')
