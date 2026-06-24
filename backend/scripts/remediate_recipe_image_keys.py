#!/usr/bin/env python3
"""
One-time remediation for recipe images corrupted before the stable image_key fix.

Background
----------
Recipe images used to be addressed in Cloudinary by the recipe's auto-increment
primary key. Because that id differs between environments (local SQLite vs prod
Postgres), recipes moved between databases kept image URLs that point at a
*different* recipe's id-based asset (`meal-genie/recipes/{old_id}/{type}_{old_id}`).
The durable fix adds a stable per-recipe `image_key`, but it does NOT rewrite the
URLs already stored on existing rows.

What this script does
---------------------
For every recipe whose stored image URL is NOT already on its own image_key path,
it copies the asset the URL currently points at to the recipe's canonical path
(`meal-genie/recipes/{image_key}/{type}_{image_key}`) and rewrites the stored URL.
After this, every recipe owns a private, collision-proof asset and no recipe's
upload can ever clobber another's.

IMPORTANT: re-keying copies whatever image the URL CURRENTLY resolves to. It
freezes each recipe's current image as a private copy — it cannot recover an
original image that was already overwritten in Cloudinary. Recipes that are
visibly showing the WRONG image will keep showing it (now isolated); review the
flagged rows and regenerate those manually.

Usage
-----
    # Dry run (default) against Railway Postgres — reports, changes nothing:
    python scripts/remediate_recipe_image_keys.py --database-url "postgresql://..."

    # Apply the re-key (requires CLOUDINARY_* env vars):
    python scripts/remediate_recipe_image_keys.py --database-url "postgresql://..." --apply

    # Limit to one user:
    python scripts/remediate_recipe_image_keys.py --database-url "..." --user-id 1 --apply
"""

import argparse
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

IMAGE_FIELDS = (
    ("reference_image_path", "reference"),
    ("banner_image_path", "banner"),
)


def create_db_session(database_url: str | None):
    """Create a database session, optionally with a custom URL."""
    if database_url:
        connect_args = {}
        if database_url.startswith("sqlite"):
            connect_args["check_same_thread"] = False
        engine = create_engine(database_url, connect_args=connect_args)
    else:
        from app.database.db import engine

    return sessionmaker(autocommit=False, autoflush=False, bind=engine)()


def is_cloudinary_url(url: str | None) -> bool:
    """True if the URL is a Cloudinary-hosted image we can re-fetch and re-key."""
    if not url or not isinstance(url, str):
        return False
    return url.startswith("http") and "/upload/" in url and "res.cloudinary.com" in url


def configure_cloudinary():
    """Configure the Cloudinary SDK from env. Returns the module or None."""
    cloud_name = os.getenv("CLOUDINARY_CLOUD_NAME")
    if not cloud_name:
        return None
    import cloudinary
    cloudinary.config(
        cloud_name=cloud_name,
        api_key=os.getenv("CLOUDINARY_API_KEY"),
        api_secret=os.getenv("CLOUDINARY_API_SECRET"),
        secure=True,
    )
    return cloudinary


def remediate(session, user_id: int | None, apply: bool, limit: int | None) -> None:
    """Scan recipes and re-key off-path Cloudinary images onto their image_key."""
    query = (
        "SELECT id, recipe_name, image_key, reference_image_path, banner_image_path "
        "FROM recipe"
    )
    params: dict = {}
    if user_id is not None:
        query += " WHERE user_id = :uid"
        params["uid"] = user_id
    query += " ORDER BY id"
    if limit:
        query += f" LIMIT {int(limit)}"

    rows = session.execute(text(query), params).mappings().all()
    print(f"Scanning {len(rows)} recipes...\n")

    cloudinary = None
    if apply:
        cloudinary = configure_cloudinary()
        if cloudinary is None:
            print("ERROR: --apply requires CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET in env.")
            sys.exit(1)
        import cloudinary.uploader  # noqa: F401

    stats = {"canonical": 0, "rekeyed": 0, "would_rekey": 0, "skipped": 0, "failed": 0}

    for row in rows:
        image_key = row["image_key"]
        if not image_key:
            print(f"  [WARN] recipe {row['id']} has no image_key; run migrations first. Skipping.")
            continue

        for field, image_type in IMAGE_FIELDS:
            url = row[field]
            if not url:
                continue

            if not is_cloudinary_url(url):
                # Local/seed placeholder or non-Cloudinary URL — nothing to re-key.
                stats["skipped"] += 1
                continue

            canonical_segment = f"/recipes/{image_key}/"
            if canonical_segment in url:
                stats["canonical"] += 1
                continue

            label = f"recipe {row['id']} ({row['recipe_name']}) [{image_type}]"
            target = f"meal-genie/recipes/{image_key}/{image_type}_{image_key}"

            if not apply:
                stats["would_rekey"] += 1
                print(f"  [WOULD RE-KEY] {label}\n      from: {url}\n      to:   {target}")
                continue

            try:
                result = cloudinary.uploader.upload(
                    url,
                    folder=f"meal-genie/recipes/{image_key}",
                    public_id=f"{image_type}_{image_key}",
                    overwrite=True,
                    resource_type="image",
                )
                new_url = result["secure_url"]
                session.execute(
                    text(f"UPDATE recipe SET {field} = :url WHERE id = :id"),
                    {"url": new_url, "id": row["id"]},
                )
                stats["rekeyed"] += 1
                print(f"  [RE-KEYED] {label} -> {new_url}")
            except Exception as e:
                stats["failed"] += 1
                print(f"  [FAILED] {label}: {e} (source asset may have been deleted; "
                      f"regenerate this image manually)")

    if apply:
        session.commit()

    print("\n" + "=" * 60)
    print("Remediation summary")
    print("=" * 60)
    print(f"  Already on image_key path : {stats['canonical']}")
    if apply:
        print(f"  Re-keyed                  : {stats['rekeyed']}")
    else:
        print(f"  Would re-key              : {stats['would_rekey']}")
    print(f"  Skipped (non-Cloudinary)  : {stats['skipped']}")
    print(f"  Failed                    : {stats['failed']}")
    if not apply:
        print("\nDry run — no changes made. Re-run with --apply to perform the re-key.")
    print("\nNOTE: re-keying freezes each recipe's CURRENT image as a private copy. "
          "Recipes that already display the wrong image must be regenerated manually.")


def main():
    parser = argparse.ArgumentParser(
        description="Re-key off-path recipe Cloudinary images onto their stable image_key.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument("--database-url", type=str, default=None,
                        help="Database URL (defaults to local app config)")
    parser.add_argument("--user-id", type=int, default=None,
                        help="Limit remediation to a single user's recipes")
    parser.add_argument("--apply", action="store_true",
                        help="Perform the re-key (default is a dry run)")
    parser.add_argument("--limit", type=int, default=None,
                        help="Process at most N recipes (for testing)")
    args = parser.parse_args()

    print()
    print("Recipe Image Re-Key Remediation")
    print("=" * 40)
    print(f"Database: {args.database_url or 'local (default)'}")
    print(f"User:     {args.user_id if args.user_id is not None else 'ALL'}")
    print(f"Mode:     {'APPLY' if args.apply else 'DRY RUN'}")
    print()

    session = create_db_session(args.database_url)
    try:
        remediate(session, args.user_id, args.apply, args.limit)
    except Exception as e:
        session.rollback()
        print(f"\nError: {e}")
        raise
    finally:
        session.close()


if __name__ == "__main__":
    main()
