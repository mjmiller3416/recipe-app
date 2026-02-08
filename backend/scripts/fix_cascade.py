"""One-time script to add CASCADE DELETE to recipe foreign keys."""

import os
import sys

# Add the backend directory to the path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text

# Get database URL from environment or use the Railway one
DATABASE_URL = os.environ.get("DATABASE_URL")

if not DATABASE_URL:
    print("ERROR: DATABASE_URL environment variable not set")
    print("\nRun this with: railway run python scripts/fix_cascade.py")
    sys.exit(1)

print(f"Connecting to database...")
engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    # First, check current constraints
    print("\nChecking current FK constraints...")
    result = conn.execute(text("""
        SELECT tc.constraint_name, tc.table_name, rc.delete_rule
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
            ON tc.constraint_name = kcu.constraint_name
        LEFT JOIN information_schema.referential_constraints rc
            ON tc.constraint_name = rc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
            AND tc.table_name IN ('recipe_ingredients', 'recipe_history')
            AND kcu.column_name = 'recipe_id'
    """))

    constraints = result.fetchall()
    for row in constraints:
        print(f"  {row[1]}.recipe_id -> constraint: {row[0]}, delete_rule: {row[2]}")

    if not constraints:
        print("  No constraints found!")
        sys.exit(1)

    # Check if already has CASCADE
    all_cascade = all(row[2] == 'CASCADE' for row in constraints)
    if all_cascade:
        print("\nAll constraints already have CASCADE DELETE. Nothing to do!")
        sys.exit(0)

    print("\nApplying CASCADE DELETE fix...")

    # Fix recipe_ingredients
    for row in constraints:
        if row[1] == 'recipe_ingredients' and row[2] != 'CASCADE':
            print(f"  Fixing {row[1]}...")
            conn.execute(text(f'ALTER TABLE recipe_ingredients DROP CONSTRAINT "{row[0]}"'))
            conn.execute(text('''
                ALTER TABLE recipe_ingredients
                ADD CONSTRAINT recipe_ingredients_recipe_id_fkey
                FOREIGN KEY (recipe_id) REFERENCES recipe(id) ON DELETE CASCADE
            '''))
            print(f"    Done!")

        if row[1] == 'recipe_history' and row[2] != 'CASCADE':
            print(f"  Fixing {row[1]}...")
            conn.execute(text(f'ALTER TABLE recipe_history DROP CONSTRAINT "{row[0]}"'))
            conn.execute(text('''
                ALTER TABLE recipe_history
                ADD CONSTRAINT recipe_history_recipe_id_fkey
                FOREIGN KEY (recipe_id) REFERENCES recipe(id) ON DELETE CASCADE
            '''))
            print(f"    Done!")

    conn.commit()
    print("\nCASCADE DELETE fix applied successfully!")