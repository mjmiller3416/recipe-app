"""Refactor meals and planner entities

Revision ID: b1c2d3e4f5a6
Revises: 9d7223f8cc90
Create Date: 2025-12-16

This migration:
1. Creates new 'meals' table with JSON arrays for side_recipe_ids and tags
2. Creates new 'planner_entries' table with position and completion tracking
3. Migrates data from 'meal_selections' to 'meals'
4. Migrates data from 'saved_meal_states' to 'planner_entries'
5. Drops old tables 'meal_selections' and 'saved_meal_states'
"""

import json
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = 'b1c2d3e4f5a6'
down_revision: Union[str, Sequence[str], None] = '9d7223f8cc90'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema and migrate data."""
    # Create connection for data migration
    conn = op.get_bind()

    # -- Step 1: Create new 'meals' table --
    op.create_table(
        'meals',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('meal_name', sa.String(length=255), nullable=False),
        sa.Column('main_recipe_id', sa.Integer(), nullable=False),
        sa.Column('side_recipe_ids', sa.Text(), nullable=True, default='[]'),
        sa.Column('is_favorite', sa.Boolean(), nullable=False, default=False),
        sa.Column('tags', sa.Text(), nullable=True, default='[]'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.ForeignKeyConstraint(['main_recipe_id'], ['recipe.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # -- Step 2: Create new 'planner_entries' table --
    op.create_table(
        'planner_entries',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('meal_id', sa.Integer(), nullable=False),
        sa.Column('position', sa.Integer(), nullable=False, default=0),
        sa.Column('is_completed', sa.Boolean(), nullable=False, default=False),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('scheduled_date', sa.Date(), nullable=True),
        sa.ForeignKeyConstraint(['meal_id'], ['meals.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # -- Step 3: Migrate data from meal_selections to meals --
    # Check if old tables exist before migrating
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()

    if 'meal_selections' in tables:
        # Fetch all meal_selections
        meal_selections = conn.execute(
            sa.text("""
                SELECT id, meal_name, main_recipe_id,
                       side_recipe_1_id, side_recipe_2_id, side_recipe_3_id
                FROM meal_selections
            """)
        ).fetchall()

        for row in meal_selections:
            meal_id = row[0]
            meal_name = row[1]
            main_recipe_id = row[2]
            side_1 = row[3]
            side_2 = row[4]
            side_3 = row[5]

            # Build side_recipe_ids array (filtering None values)
            side_ids = [sid for sid in [side_1, side_2, side_3] if sid is not None]
            side_ids_json = json.dumps(side_ids)

            # Insert into meals table with same ID to maintain FK relationships
            conn.execute(
                sa.text("""
                    INSERT INTO meals (id, meal_name, main_recipe_id, side_recipe_ids, is_favorite, tags)
                    VALUES (:id, :meal_name, :main_recipe_id, :side_recipe_ids, :is_favorite, :tags)
                """),
                {
                    'id': meal_id,
                    'meal_name': meal_name,
                    'main_recipe_id': main_recipe_id,
                    'side_recipe_ids': side_ids_json,
                    'is_favorite': False,
                    'tags': '[]'
                }
            )

    # -- Step 4: Migrate data from saved_meal_states to planner_entries --
    if 'saved_meal_states' in tables:
        # Fetch all saved_meal_states ordered by ID for position assignment
        saved_states = conn.execute(
            sa.text("""
                SELECT id, meal_id
                FROM saved_meal_states
                ORDER BY id
            """)
        ).fetchall()

        for position, row in enumerate(saved_states):
            state_id = row[0]
            meal_id = row[1]

            # Check if the meal exists in the new meals table
            meal_exists = conn.execute(
                sa.text("SELECT id FROM meals WHERE id = :meal_id"),
                {'meal_id': meal_id}
            ).fetchone()

            if meal_exists:
                conn.execute(
                    sa.text("""
                        INSERT INTO planner_entries (meal_id, position, is_completed)
                        VALUES (:meal_id, :position, :is_completed)
                    """),
                    {
                        'meal_id': meal_id,
                        'position': position,
                        'is_completed': False
                    }
                )

    # -- Step 5: Drop old tables --
    if 'saved_meal_states' in tables:
        op.drop_table('saved_meal_states')

    if 'meal_selections' in tables:
        op.drop_table('meal_selections')


def downgrade() -> None:
    """Downgrade schema and restore old structure."""
    conn = op.get_bind()

    # -- Step 1: Recreate old tables --
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

    op.create_table(
        'saved_meal_states',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('meal_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['meal_id'], ['meal_selections.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # -- Step 2: Migrate data back from meals to meal_selections --
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()

    if 'meals' in tables:
        meals = conn.execute(
            sa.text("""
                SELECT id, meal_name, main_recipe_id, side_recipe_ids
                FROM meals
            """)
        ).fetchall()

        for row in meals:
            meal_id = row[0]
            meal_name = row[1]
            main_recipe_id = row[2]
            side_ids_json = row[3] or '[]'

            try:
                side_ids = json.loads(side_ids_json)
            except (json.JSONDecodeError, TypeError):
                side_ids = []

            side_1 = side_ids[0] if len(side_ids) > 0 else None
            side_2 = side_ids[1] if len(side_ids) > 1 else None
            side_3 = side_ids[2] if len(side_ids) > 2 else None

            conn.execute(
                sa.text("""
                    INSERT INTO meal_selections
                    (id, meal_name, main_recipe_id, side_recipe_1_id, side_recipe_2_id, side_recipe_3_id)
                    VALUES (:id, :meal_name, :main_recipe_id, :side_1, :side_2, :side_3)
                """),
                {
                    'id': meal_id,
                    'meal_name': meal_name,
                    'main_recipe_id': main_recipe_id,
                    'side_1': side_1,
                    'side_2': side_2,
                    'side_3': side_3
                }
            )

    # -- Step 3: Migrate data back from planner_entries to saved_meal_states --
    if 'planner_entries' in tables:
        entries = conn.execute(
            sa.text("""
                SELECT meal_id
                FROM planner_entries
                ORDER BY position
            """)
        ).fetchall()

        for row in entries:
            meal_id = row[0]

            # Check if meal exists in restored meal_selections
            meal_exists = conn.execute(
                sa.text("SELECT id FROM meal_selections WHERE id = :meal_id"),
                {'meal_id': meal_id}
            ).fetchone()

            if meal_exists:
                conn.execute(
                    sa.text("""
                        INSERT INTO saved_meal_states (meal_id)
                        VALUES (:meal_id)
                    """),
                    {'meal_id': meal_id}
                )

    # -- Step 4: Drop new tables --
    if 'planner_entries' in tables:
        op.drop_table('planner_entries')

    if 'meals' in tables:
        op.drop_table('meals')
