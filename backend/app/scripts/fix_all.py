"""Check and fix ALL FK constraints on recipe_ingredients."""
import os
from sqlalchemy import create_engine, text

DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    print("ERROR: Set DATABASE_URL first")
    exit(1)

engine = create_engine(DATABASE_URL)
with engine.connect() as conn:
    # Get ALL constraints on recipe_ingredients
    result = conn.execute(text("""
        SELECT tc.constraint_name, rc.delete_rule
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
            ON tc.constraint_name = kcu.constraint_name
        LEFT JOIN information_schema.referential_constraints rc
            ON tc.constraint_name = rc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
            AND tc.table_name = 'recipe_ingredients'
            AND kcu.column_name = 'recipe_id'
    """))

    constraints = result.fetchall()
    print("Constraints on recipe_ingredients.recipe_id:")
    print("-" * 50)

    to_drop = []
    for row in constraints:
        name, rule = row[0], row[1]
        print(f"  {name} -> {rule}")
        if rule != 'CASCADE':
            to_drop.append(name)

    if to_drop:
        print(f"\nDropping non-CASCADE constraints: {to_drop}")
        for name in to_drop:
            conn.execute(text(f'ALTER TABLE recipe_ingredients DROP CONSTRAINT "{name}"'))
            print(f"  Dropped {name}")
        conn.commit()
        print("\nDone! Try deleting a recipe now.")
    else:
        print("\nAll constraints are CASCADE. No changes needed.")
        print("\nIf delete still fails, check the exact error message in the app.")