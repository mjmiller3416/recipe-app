#!/usr/bin/env python3
"""
Copy all recipes (with ingredients) from one user to another.

Usage:
    # Against Railway Postgres:
    python scripts/copy_user_recipes.py --database-url "postgresql://..." --from-user-id 1 --to-user-id 2

    # Against local SQLite (uses default from app config):
    python scripts/copy_user_recipes.py --from-user-id 1 --to-user-id 2

    # Dry run (preview what would be copied):
    python scripts/copy_user_recipes.py --database-url "..." --from-user-id 1 --to-user-id 2 --dry-run
"""

import argparse
import os
import sys
import uuid
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker


def _copy_cloudinary_asset(source_url: str | None, image_key: str, image_type: str) -> str | None:
    """Copy a Cloudinary image to a new public_id keyed by image_key.

    A copied recipe is a NEW, independent recipe and must own its own image
    asset; sharing the source's id/key-based asset would let either recipe's
    edits or deletion clobber the other. This duplicates the asset to the new
    key and returns the new secure_url.

    Best-effort: if Cloudinary is not configured or the copy fails, the original
    URL is returned unchanged (the duplicate then references the source asset
    read-only until its image is regenerated).
    """
    if not source_url:
        return source_url

    cloud_name = os.getenv("CLOUDINARY_CLOUD_NAME")
    if not cloud_name:
        return source_url

    try:
        import cloudinary
        import cloudinary.uploader

        cloudinary.config(
            cloud_name=cloud_name,
            api_key=os.getenv("CLOUDINARY_API_KEY"),
            api_secret=os.getenv("CLOUDINARY_API_SECRET"),
            secure=True,
        )
        result = cloudinary.uploader.upload(
            source_url,
            folder=f"meal-genie/recipes/{image_key}",
            public_id=f"{image_type}_{image_key}",
            overwrite=True,
            resource_type="image",
        )
        return result["secure_url"]
    except Exception as e:
        print(f"   ⚠ Could not copy Cloudinary {image_type} asset: {e}; keeping source URL")
        return source_url


def create_db_session(database_url: str | None = None):
    """Create a database session, optionally with a custom URL."""
    if database_url:
        connect_args = {}
        if database_url.startswith("sqlite"):
            connect_args["check_same_thread"] = False
        engine = create_engine(database_url, connect_args=connect_args)
    else:
        from app.database.db import engine

    session_factory = sessionmaker(
        autocommit=False, autoflush=False, bind=engine
    )
    return session_factory()


def validate_user(session, user_id: int, label: str) -> dict:
    """Check that a user exists and return basic info."""
    row = session.execute(
        text("SELECT id, email, name FROM users WHERE id = :uid"),
        {"uid": user_id},
    ).fetchone()
    if not row:
        print(f"Error: {label} user_id={user_id} not found in the database.")
        sys.exit(1)
    return {"id": row[0], "email": row[1], "name": row[2] or ""}


def copy_recipes(session, from_user_id: int, to_user_id: int, dry_run: bool = False) -> None:
    """Copy all recipes and ingredients from one user to another."""

    # Get source recipes
    recipes = session.execute(
        text("""
            SELECT id, recipe_name, recipe_category, meal_type, diet_pref,
                   prep_time, cook_time, servings, directions, notes,
                   reference_image_path, banner_image_path,
                   is_favorite, is_ai_generated
            FROM recipe
            WHERE user_id = :uid
            ORDER BY id
        """),
        {"uid": from_user_id},
    ).fetchall()

    if not recipes:
        print("No recipes found for source user.")
        return

    print(f"Found {len(recipes)} recipes to copy.\n")

    if dry_run:
        for r in recipes:
            print(f"  Would copy: {r[1]} ({r[2]}, {r[3]})")
        print(f"\nDry run complete. No changes made.")
        return

    # Build ingredient cache for target user (name+category -> id)
    existing_ingredients = session.execute(
        text("""
            SELECT id, ingredient_name, ingredient_category
            FROM ingredients
            WHERE user_id = :uid
        """),
        {"uid": to_user_id},
    ).fetchall()
    ingredient_cache = {(row[1].lower(), row[2].lower()): row[0] for row in existing_ingredients}

    copied = 0
    skipped = 0

    for r in recipes:
        recipe_name = r[1]

        # Check if target user already has a recipe with this name
        exists = session.execute(
            text("SELECT id FROM recipe WHERE user_id = :uid AND recipe_name = :name"),
            {"uid": to_user_id, "name": recipe_name},
        ).fetchone()

        if exists:
            print(f"  [SKIP] {recipe_name} (already exists for target user)")
            skipped += 1
            continue

        # Give the copy its own stable image_key and duplicate the Cloudinary
        # asset so the new recipe does not share the source's image.
        new_image_key = uuid.uuid4().hex
        new_reference_path = _copy_cloudinary_asset(r[10], new_image_key, "reference")
        new_banner_path = _copy_cloudinary_asset(r[11], new_image_key, "banner")

        # Insert recipe for target user
        result = session.execute(
            text("""
                INSERT INTO recipe (
                    recipe_name, recipe_category, meal_type, diet_pref,
                    prep_time, cook_time, servings, directions, notes,
                    reference_image_path, banner_image_path, image_key,
                    is_favorite, is_ai_generated, user_id, created_at
                ) VALUES (
                    :recipe_name, :recipe_category, :meal_type, :diet_pref,
                    :prep_time, :cook_time, :servings, :directions, :notes,
                    :reference_image_path, :banner_image_path, :image_key,
                    :is_favorite, :is_ai_generated, :user_id, NOW()
                ) RETURNING id
            """),
            {
                "recipe_name": r[1],
                "recipe_category": r[2],
                "meal_type": r[3],
                "diet_pref": r[4],
                "prep_time": r[5],
                "cook_time": r[6],
                "servings": r[7],
                "directions": r[8],
                "notes": r[9],
                "reference_image_path": new_reference_path,
                "banner_image_path": new_banner_path,
                "image_key": new_image_key,
                "is_favorite": r[12],
                "is_ai_generated": r[13],
                "user_id": to_user_id,
            },
        )
        new_recipe_id = result.fetchone()[0]

        # Get source recipe's ingredients
        source_ingredients = session.execute(
            text("""
                SELECT i.ingredient_name, i.ingredient_category, ri.quantity, ri.unit
                FROM recipe_ingredients ri
                JOIN ingredients i ON i.id = ri.ingredient_id
                WHERE ri.recipe_id = :rid
            """),
            {"rid": r[0]},
        ).fetchall()

        # Copy ingredients, reusing existing ones for the target user
        for ing in source_ingredients:
            ing_name, ing_category, quantity, unit = ing
            cache_key = (ing_name.lower(), ing_category.lower())

            if cache_key in ingredient_cache:
                ing_id = ingredient_cache[cache_key]
            else:
                # Create ingredient for target user
                ing_result = session.execute(
                    text("""
                        INSERT INTO ingredients (ingredient_name, ingredient_category, user_id)
                        VALUES (:name, :category, :uid)
                        RETURNING id
                    """),
                    {"name": ing_name, "category": ing_category, "uid": to_user_id},
                )
                ing_id = ing_result.fetchone()[0]
                ingredient_cache[cache_key] = ing_id

            # Link ingredient to recipe
            session.execute(
                text("""
                    INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity, unit)
                    VALUES (:rid, :iid, :qty, :unit)
                """),
                {"rid": new_recipe_id, "iid": ing_id, "qty": quantity, "unit": unit},
            )

        ing_count = len(source_ingredients)
        print(f"  [OK] {recipe_name} ({ing_count} ingredients)")
        copied += 1

    session.commit()
    print(f"\nDone! Copied {copied} recipes, skipped {skipped}.")


def main():
    parser = argparse.ArgumentParser(
        description="Copy all recipes from one user to another",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument("--from-user-id", type=int, required=True, help="Source user ID")
    parser.add_argument("--to-user-id", type=int, required=True, help="Target user ID")
    parser.add_argument("--database-url", type=str, default=None, help="Database URL (defaults to local SQLite)")
    parser.add_argument("--dry-run", action="store_true", help="Preview what would be copied without making changes")

    args = parser.parse_args()

    if args.from_user_id == args.to_user_id:
        print("Error: --from-user-id and --to-user-id must be different.")
        sys.exit(1)

    print()
    print("Recipe Copier")
    print("=" * 40)
    print(f"Database: {args.database_url or 'local (default)'}")
    print(f"From user: {args.from_user_id}")
    print(f"To user:   {args.to_user_id}")
    if args.dry_run:
        print("Mode: DRY RUN")
    print()

    session = create_db_session(args.database_url)

    try:
        source = validate_user(session, args.from_user_id, "Source")
        target = validate_user(session, args.to_user_id, "Target")
        print(f"Source: {source['name']} ({source['email']})")
        print(f"Target: {target['name']} ({target['email']})")
        print()

        copy_recipes(session, args.from_user_id, args.to_user_id, dry_run=args.dry_run)

    except Exception as e:
        session.rollback()
        print(f"\nError: {e}")
        raise
    finally:
        session.close()


if __name__ == "__main__":
    main()
