"""copy_prod_to_local.py

Copy production database to local SQLite, transforming user_id from 1 to 2.

Usage:
    python app/scripts/copy_prod_to_local.py

This script:
1. Connects to Railway PostgreSQL (read-only)
2. Connects to local SQLite
3. Clears all local data
4. Copies all production data
5. Transforms user_id from 1 to 2 for all user-owned data

IMPORTANT: Production database is READ-ONLY. No changes will be made to production.
"""

import os
import sys
from datetime import datetime

# Add the backend directory to the path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Production database URL (Railway PostgreSQL)
PROD_DATABASE_URL = "postgresql://postgres:TYxbWOeqBjmCZKxFadeDyzjXKEgzeyiC@crossover.proxy.rlwy.net:53795/railway"

# Local database URL (SQLite)
LOCAL_DATABASE_URL = "sqlite:///app/database/app_data.db"

# Source user_id in production
SOURCE_USER_ID = 1

# Target user_id in local
TARGET_USER_ID = 2


def get_engines():
    """Create database engines for prod and local."""
    prod_engine = create_engine(PROD_DATABASE_URL, echo=False)
    local_engine = create_engine(LOCAL_DATABASE_URL, echo=False)
    return prod_engine, local_engine


def clear_local_tables(local_session):
    """Clear all local tables in correct order (respecting foreign keys)."""
    print("\n🗑️  Clearing local tables...")

    # Order matters for foreign key constraints (children first)
    tables_to_clear = [
        "shopping_item_contributions",
        "shopping_items",
        "planner_entries",
        "meals",
        "recipe_history",
        "recipe_ingredients",
        "recipe",
        "ingredients",
        "unit_conversion_rules",
        "user_settings",
        "user_usage",
        # Don't clear users - we need user 2 to exist
    ]

    for table in tables_to_clear:
        try:
            local_session.execute(text(f"DELETE FROM {table}"))
            print(f"   ✓ Cleared {table}")
        except Exception as e:
            print(f"   ⚠ Could not clear {table}: {e}")

    local_session.commit()
    print("   Done clearing tables.")


def copy_users(prod_session, local_session):
    """Copy/update user data. Ensure user 2 exists locally."""
    print("\n👤 Handling users...")

    # Get user 1 from production
    result = prod_session.execute(text("SELECT * FROM users WHERE id = :id"), {"id": SOURCE_USER_ID})
    prod_user = result.mappings().first()

    if not prod_user:
        print(f"   ⚠ User {SOURCE_USER_ID} not found in production!")
        return

    # Check if user 2 exists locally
    local_result = local_session.execute(text("SELECT id FROM users WHERE id = :id"), {"id": TARGET_USER_ID})
    local_user = local_result.first()

    if local_user:
        print(f"   ✓ User {TARGET_USER_ID} already exists locally, updating...")
        # Update existing user with prod user's subscription/settings but keep local clerk_id
        local_session.execute(text("""
            UPDATE users SET
                is_admin = :is_admin,
                subscription_tier = :subscription_tier,
                subscription_status = :subscription_status,
                subscription_ends_at = :subscription_ends_at,
                granted_pro_until = :granted_pro_until,
                granted_by = :granted_by,
                updated_at = :updated_at
            WHERE id = :id
        """), {
            "id": TARGET_USER_ID,
            "is_admin": prod_user["is_admin"],
            "subscription_tier": prod_user["subscription_tier"],
            "subscription_status": prod_user["subscription_status"],
            "subscription_ends_at": prod_user["subscription_ends_at"],
            "granted_pro_until": prod_user["granted_pro_until"],
            "granted_by": prod_user["granted_by"],
            "updated_at": datetime.utcnow(),
        })
    else:
        print(f"   ⚠ User {TARGET_USER_ID} does not exist locally. You'll need to sign in first.")
        return

    local_session.commit()
    print(f"   ✓ User {TARGET_USER_ID} updated with production settings")


def copy_table_with_user_id(prod_session, local_session, table_name, columns, id_column="id"):
    """Copy a table that has user_id, transforming from SOURCE to TARGET."""
    print(f"\n📋 Copying {table_name}...")

    # Fetch from production
    query = f"SELECT * FROM {table_name} WHERE user_id = :user_id"
    result = prod_session.execute(text(query), {"user_id": SOURCE_USER_ID})
    rows = result.mappings().all()

    if not rows:
        print(f"   ⚠ No rows found in {table_name} for user {SOURCE_USER_ID}")
        return {}

    # Track ID mapping (old_id -> new_id) for foreign key updates
    id_mapping = {}

    for row in rows:
        row_dict = dict(row)
        old_id = row_dict.get(id_column)

        # Transform user_id
        row_dict["user_id"] = TARGET_USER_ID

        # Remove the id for auto-increment (SQLite will assign new IDs)
        if id_column in row_dict and id_column == "id":
            del row_dict["id"]

        # Build insert query
        cols = ", ".join(row_dict.keys())
        placeholders = ", ".join([f":{k}" for k in row_dict.keys()])
        insert_query = f"INSERT INTO {table_name} ({cols}) VALUES ({placeholders})"

        try:
            result = local_session.execute(text(insert_query), row_dict)
            new_id = result.lastrowid
            if old_id and new_id:
                id_mapping[old_id] = new_id
        except Exception as e:
            print(f"   ⚠ Error inserting row: {e}")
            continue

    local_session.commit()
    print(f"   ✓ Copied {len(rows)} rows from {table_name}")
    return id_mapping


def copy_recipes(prod_session, local_session):
    """Copy recipes and return ID mapping."""
    print("\n📋 Copying recipes...")

    result = prod_session.execute(
        text("SELECT * FROM recipe WHERE user_id = :user_id"),
        {"user_id": SOURCE_USER_ID}
    )
    rows = result.mappings().all()

    if not rows:
        print("   ⚠ No recipes found")
        return {}

    id_mapping = {}

    for row in rows:
        row_dict = dict(row)
        old_id = row_dict.pop("id")
        row_dict["user_id"] = TARGET_USER_ID

        cols = ", ".join(row_dict.keys())
        placeholders = ", ".join([f":{k}" for k in row_dict.keys()])

        result = local_session.execute(
            text(f"INSERT INTO recipe ({cols}) VALUES ({placeholders})"),
            row_dict
        )
        id_mapping[old_id] = result.lastrowid

    local_session.commit()
    print(f"   ✓ Copied {len(rows)} recipes")
    return id_mapping


def copy_ingredients(prod_session, local_session):
    """Copy ingredients and return ID mapping."""
    print("\n📋 Copying ingredients...")

    result = prod_session.execute(
        text("SELECT * FROM ingredients WHERE user_id = :user_id"),
        {"user_id": SOURCE_USER_ID}
    )
    rows = result.mappings().all()

    if not rows:
        print("   ⚠ No ingredients found")
        return {}

    id_mapping = {}

    for row in rows:
        row_dict = dict(row)
        old_id = row_dict.pop("id")
        row_dict["user_id"] = TARGET_USER_ID

        cols = ", ".join(row_dict.keys())
        placeholders = ", ".join([f":{k}" for k in row_dict.keys()])

        try:
            result = local_session.execute(
                text(f"INSERT INTO ingredients ({cols}) VALUES ({placeholders})"),
                row_dict
            )
            id_mapping[old_id] = result.lastrowid
        except Exception as e:
            # May fail on unique constraint - ingredient already exists
            print(f"   ⚠ Skipping duplicate ingredient: {row_dict.get('ingredient_name')}")
            # Try to find existing ingredient
            existing = local_session.execute(
                text("SELECT id FROM ingredients WHERE ingredient_name = :name AND user_id = :uid"),
                {"name": row_dict["ingredient_name"], "uid": TARGET_USER_ID}
            ).first()
            if existing:
                id_mapping[old_id] = existing[0]

    local_session.commit()
    print(f"   ✓ Copied {len(id_mapping)} ingredients")
    return id_mapping


def copy_recipe_ingredients(prod_session, local_session, recipe_mapping, ingredient_mapping):
    """Copy recipe_ingredients junction table with updated foreign keys."""
    print("\n📋 Copying recipe_ingredients...")

    # Get all recipe_ingredients for the recipes we copied
    old_recipe_ids = list(recipe_mapping.keys())
    if not old_recipe_ids:
        print("   ⚠ No recipes to link ingredients to")
        return

    placeholders = ",".join([f":r{i}" for i in range(len(old_recipe_ids))])
    params = {f"r{i}": rid for i, rid in enumerate(old_recipe_ids)}

    result = prod_session.execute(
        text(f"SELECT * FROM recipe_ingredients WHERE recipe_id IN ({placeholders})"),
        params
    )
    rows = result.mappings().all()

    if not rows:
        print("   ⚠ No recipe_ingredients found")
        return

    count = 0
    for row in rows:
        old_recipe_id = row["recipe_id"]
        old_ingredient_id = row["ingredient_id"]

        new_recipe_id = recipe_mapping.get(old_recipe_id)
        new_ingredient_id = ingredient_mapping.get(old_ingredient_id)

        if not new_recipe_id or not new_ingredient_id:
            continue

        try:
            local_session.execute(
                text("""
                    INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity, unit)
                    VALUES (:recipe_id, :ingredient_id, :quantity, :unit)
                """),
                {
                    "recipe_id": new_recipe_id,
                    "ingredient_id": new_ingredient_id,
                    "quantity": row["quantity"],
                    "unit": row["unit"],
                }
            )
            count += 1
        except Exception as e:
            print(f"   ⚠ Error linking ingredient: {e}")

    local_session.commit()
    print(f"   ✓ Copied {count} recipe_ingredients")


def copy_meals(prod_session, local_session, recipe_mapping):
    """Copy meals with updated recipe references."""
    print("\n📋 Copying meals...")

    result = prod_session.execute(
        text("SELECT * FROM meals WHERE user_id = :user_id"),
        {"user_id": SOURCE_USER_ID}
    )
    rows = result.mappings().all()

    if not rows:
        print("   ⚠ No meals found")
        return {}

    id_mapping = {}

    for row in rows:
        row_dict = dict(row)
        old_id = row_dict.pop("id")

        # Transform user_id
        row_dict["user_id"] = TARGET_USER_ID

        # Transform main_recipe_id
        old_main_recipe_id = row_dict["main_recipe_id"]
        new_main_recipe_id = recipe_mapping.get(old_main_recipe_id)
        if not new_main_recipe_id:
            print(f"   ⚠ Skipping meal {old_id}: main recipe {old_main_recipe_id} not found")
            continue
        row_dict["main_recipe_id"] = new_main_recipe_id

        # Transform side_recipe_ids JSON
        import json
        side_ids_json = row_dict.get("side_recipe_ids", "[]")
        if side_ids_json:
            try:
                old_side_ids = json.loads(side_ids_json) if isinstance(side_ids_json, str) else side_ids_json
                new_side_ids = [recipe_mapping.get(sid) for sid in old_side_ids if recipe_mapping.get(sid)]
                row_dict["side_recipe_ids"] = json.dumps(new_side_ids)
            except:
                row_dict["side_recipe_ids"] = "[]"

        cols = ", ".join(row_dict.keys())
        placeholders = ", ".join([f":{k}" for k in row_dict.keys()])

        try:
            result = local_session.execute(
                text(f"INSERT INTO meals ({cols}) VALUES ({placeholders})"),
                row_dict
            )
            id_mapping[old_id] = result.lastrowid
        except Exception as e:
            print(f"   ⚠ Error inserting meal: {e}")

    local_session.commit()
    print(f"   ✓ Copied {len(id_mapping)} meals")
    return id_mapping


def copy_planner_entries(prod_session, local_session, meal_mapping):
    """Copy planner_entries with updated meal references."""
    print("\n📋 Copying planner_entries...")

    result = prod_session.execute(
        text("SELECT * FROM planner_entries WHERE user_id = :user_id"),
        {"user_id": SOURCE_USER_ID}
    )
    rows = result.mappings().all()

    if not rows:
        print("   ⚠ No planner entries found")
        return {}

    id_mapping = {}

    for row in rows:
        row_dict = dict(row)
        old_id = row_dict.pop("id")

        # Transform user_id
        row_dict["user_id"] = TARGET_USER_ID

        # Transform meal_id
        old_meal_id = row_dict["meal_id"]
        new_meal_id = meal_mapping.get(old_meal_id)
        if not new_meal_id:
            print(f"   ⚠ Skipping entry {old_id}: meal {old_meal_id} not found")
            continue
        row_dict["meal_id"] = new_meal_id

        cols = ", ".join(row_dict.keys())
        placeholders = ", ".join([f":{k}" for k in row_dict.keys()])

        try:
            result = local_session.execute(
                text(f"INSERT INTO planner_entries ({cols}) VALUES ({placeholders})"),
                row_dict
            )
            id_mapping[old_id] = result.lastrowid
        except Exception as e:
            print(f"   ⚠ Error inserting planner entry: {e}")

    local_session.commit()
    print(f"   ✓ Copied {len(id_mapping)} planner entries")
    return id_mapping


def copy_shopping_items(prod_session, local_session):
    """Copy shopping_items."""
    print("\n📋 Copying shopping_items...")

    result = prod_session.execute(
        text("SELECT * FROM shopping_items WHERE user_id = :user_id"),
        {"user_id": SOURCE_USER_ID}
    )
    rows = result.mappings().all()

    if not rows:
        print("   ⚠ No shopping items found")
        return {}

    id_mapping = {}

    for row in rows:
        row_dict = dict(row)
        old_id = row_dict.pop("id")
        row_dict["user_id"] = TARGET_USER_ID

        cols = ", ".join(row_dict.keys())
        placeholders = ", ".join([f":{k}" for k in row_dict.keys()])

        try:
            result = local_session.execute(
                text(f"INSERT INTO shopping_items ({cols}) VALUES ({placeholders})"),
                row_dict
            )
            id_mapping[old_id] = result.lastrowid
        except Exception as e:
            print(f"   ⚠ Error inserting shopping item: {e}")

    local_session.commit()
    print(f"   ✓ Copied {len(id_mapping)} shopping items")
    return id_mapping


def copy_shopping_item_contributions(prod_session, local_session, shopping_mapping, recipe_mapping, entry_mapping):
    """Copy shopping_item_contributions with updated foreign keys."""
    print("\n📋 Copying shopping_item_contributions...")

    old_item_ids = list(shopping_mapping.keys())
    if not old_item_ids:
        print("   ⚠ No shopping items to link")
        return

    placeholders = ",".join([f":i{i}" for i in range(len(old_item_ids))])
    params = {f"i{i}": iid for i, iid in enumerate(old_item_ids)}

    result = prod_session.execute(
        text(f"SELECT * FROM shopping_item_contributions WHERE shopping_item_id IN ({placeholders})"),
        params
    )
    rows = result.mappings().all()

    if not rows:
        print("   ⚠ No contributions found")
        return

    count = 0
    for row in rows:
        new_item_id = shopping_mapping.get(row["shopping_item_id"])
        new_recipe_id = recipe_mapping.get(row["recipe_id"])
        new_entry_id = entry_mapping.get(row["planner_entry_id"])

        if not all([new_item_id, new_recipe_id, new_entry_id]):
            continue

        try:
            local_session.execute(
                text("""
                    INSERT INTO shopping_item_contributions
                    (shopping_item_id, recipe_id, planner_entry_id, base_quantity, dimension)
                    VALUES (:item_id, :recipe_id, :entry_id, :qty, :dim)
                """),
                {
                    "item_id": new_item_id,
                    "recipe_id": new_recipe_id,
                    "entry_id": new_entry_id,
                    "qty": row["base_quantity"],
                    "dim": row["dimension"],
                }
            )
            count += 1
        except Exception as e:
            print(f"   ⚠ Error inserting contribution: {e}")

    local_session.commit()
    print(f"   ✓ Copied {count} contributions")


def copy_recipe_history(prod_session, local_session, recipe_mapping):
    """Copy recipe_history with updated recipe references."""
    print("\n📋 Copying recipe_history...")

    result = prod_session.execute(
        text("SELECT * FROM recipe_history WHERE user_id = :user_id"),
        {"user_id": SOURCE_USER_ID}
    )
    rows = result.mappings().all()

    if not rows:
        print("   ⚠ No recipe history found")
        return

    count = 0
    for row in rows:
        row_dict = dict(row)
        row_dict.pop("id")
        row_dict["user_id"] = TARGET_USER_ID

        old_recipe_id = row_dict["recipe_id"]
        new_recipe_id = recipe_mapping.get(old_recipe_id)
        if not new_recipe_id:
            continue
        row_dict["recipe_id"] = new_recipe_id

        cols = ", ".join(row_dict.keys())
        placeholders = ", ".join([f":{k}" for k in row_dict.keys()])

        try:
            local_session.execute(
                text(f"INSERT INTO recipe_history ({cols}) VALUES ({placeholders})"),
                row_dict
            )
            count += 1
        except Exception as e:
            print(f"   ⚠ Error inserting history: {e}")

    local_session.commit()
    print(f"   ✓ Copied {count} history records")


def copy_unit_conversion_rules(prod_session, local_session):
    """Copy unit_conversion_rules."""
    print("\n📋 Copying unit_conversion_rules...")

    result = prod_session.execute(
        text("SELECT * FROM unit_conversion_rules WHERE user_id = :user_id"),
        {"user_id": SOURCE_USER_ID}
    )
    rows = result.mappings().all()

    if not rows:
        print("   ⚠ No conversion rules found")
        return

    count = 0
    for row in rows:
        row_dict = dict(row)
        row_dict.pop("id")
        row_dict["user_id"] = TARGET_USER_ID

        cols = ", ".join(row_dict.keys())
        placeholders = ", ".join([f":{k}" for k in row_dict.keys()])

        try:
            local_session.execute(
                text(f"INSERT INTO unit_conversion_rules ({cols}) VALUES ({placeholders})"),
                row_dict
            )
            count += 1
        except Exception as e:
            print(f"   ⚠ Error inserting rule: {e}")

    local_session.commit()
    print(f"   ✓ Copied {count} conversion rules")


def copy_user_settings(prod_session, local_session):
    """Copy user_settings."""
    print("\n📋 Copying user_settings...")

    result = prod_session.execute(
        text("SELECT * FROM user_settings WHERE user_id = :user_id"),
        {"user_id": SOURCE_USER_ID}
    )
    row = result.mappings().first()

    if not row:
        print("   ⚠ No user settings found")
        return

    row_dict = dict(row)
    row_dict["user_id"] = TARGET_USER_ID

    # Delete existing settings for target user
    local_session.execute(
        text("DELETE FROM user_settings WHERE user_id = :user_id"),
        {"user_id": TARGET_USER_ID}
    )

    cols = ", ".join(row_dict.keys())
    placeholders = ", ".join([f":{k}" for k in row_dict.keys()])

    try:
        local_session.execute(
            text(f"INSERT INTO user_settings ({cols}) VALUES ({placeholders})"),
            row_dict
        )
        local_session.commit()
        print("   ✓ Copied user settings")
    except Exception as e:
        print(f"   ⚠ Error inserting settings: {e}")


def main():
    """Main migration function."""
    print("=" * 60)
    print("🚀 Production → Local Database Migration")
    print("=" * 60)
    print(f"\nSource: Production (user_id={SOURCE_USER_ID})")
    print(f"Target: Local SQLite (user_id={TARGET_USER_ID})")
    print("\n⚠️  This will REPLACE all local data!")

    # Confirm
    response = input("\nProceed? (yes/no): ")
    if response.lower() != "yes":
        print("Aborted.")
        return

    # Create engines and sessions
    prod_engine, local_engine = get_engines()
    ProdSession = sessionmaker(bind=prod_engine)
    LocalSession = sessionmaker(bind=local_engine)

    prod_session = ProdSession()
    local_session = LocalSession()

    try:
        # Step 1: Clear local tables
        clear_local_tables(local_session)

        # Step 2: Handle users
        copy_users(prod_session, local_session)

        # Step 3: Copy recipes (need ID mapping)
        recipe_mapping = copy_recipes(prod_session, local_session)

        # Step 4: Copy ingredients (need ID mapping)
        ingredient_mapping = copy_ingredients(prod_session, local_session)

        # Step 5: Copy recipe_ingredients (junction table)
        copy_recipe_ingredients(prod_session, local_session, recipe_mapping, ingredient_mapping)

        # Step 6: Copy meals (depends on recipes)
        meal_mapping = copy_meals(prod_session, local_session, recipe_mapping)

        # Step 7: Copy planner entries (depends on meals)
        entry_mapping = copy_planner_entries(prod_session, local_session, meal_mapping)

        # Step 8-9: Skip shopping items (schema mismatch with production)
        # Shopping items will regenerate from planner data via sync_shopping_list()
        print("\n🛒 Skipping shopping items (will regenerate from planner data)")

        # Step 10: Copy recipe history
        copy_recipe_history(prod_session, local_session, recipe_mapping)

        # Step 11: Copy unit conversion rules
        copy_unit_conversion_rules(prod_session, local_session)

        # Step 12: Copy user settings
        copy_user_settings(prod_session, local_session)

        print("\n" + "=" * 60)
        print("✅ Migration complete!")
        print("=" * 60)

    except Exception as e:
        print(f"\n❌ Migration failed: {e}")
        import traceback
        traceback.print_exc()
        local_session.rollback()
    finally:
        prod_session.close()
        local_session.close()


if __name__ == "__main__":
    main()
