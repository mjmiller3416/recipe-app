"""Check all FK constraints referencing recipe table."""
import os
from sqlalchemy import create_engine, text

DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    print("ERROR: Set DATABASE_URL first")
    exit(1)

engine = create_engine(DATABASE_URL)
with engine.connect() as conn:
    result = conn.execute(text("""
        SELECT tc.table_name, kcu.column_name, tc.constraint_name, rc.delete_rule
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
            ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.referential_constraints rc
            ON tc.constraint_name = rc.constraint_name
        JOIN information_schema.constraint_column_usage ccu
            ON rc.unique_constraint_name = ccu.constraint_name
        WHERE ccu.table_name = 'recipe'
        ORDER BY tc.table_name
    """))

    print("FK constraints referencing recipe table:")
    print("-" * 70)
    for row in result:
        status = "OK" if row[3] == "CASCADE" else "NEEDS FIX"
        print(f"  {row[0]}.{row[1]} -> {row[2]} ({row[3]}) [{status}]")