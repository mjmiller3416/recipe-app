#!/usr/bin/env python3
"""
Read-only diagnostic for issue #131: for every group of recipes currently
sharing the same (off-path) Cloudinary image URL — as flagged by
`remediate_recipe_image_keys.py`'s COLLISIONS DETECTED section — report each
member's user_id and created_at.

This answers one question before anyone hand-regenerates images: are these
collisions cross-user duplicates (same dish copied to a second account, where
sharing the source photo is arguably correct) or same-user/same-catalog
corruption (where one side is genuinely showing the wrong photo)?

Makes no writes. Safe to run against prod at any time, including after
`remediate_recipe_image_keys.py --apply` (it will just report zero
collisions at that point, since every recipe will be on its own path).

Usage
-----
    python scripts/check_image_collision_ownership.py --database-url "postgresql://..."
"""

import argparse
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
    if database_url:
        connect_args = {}
        if database_url.startswith("sqlite"):
            connect_args["check_same_thread"] = False
        engine = create_engine(database_url, connect_args=connect_args)
    else:
        from app.database.db import engine

    return sessionmaker(autocommit=False, autoflush=False, bind=engine)()


def is_cloudinary_url(url: str | None) -> bool:
    if not url or not isinstance(url, str):
        return False
    return url.startswith("http") and "/upload/" in url and "res.cloudinary.com" in url


def check(session) -> None:
    rows = session.execute(
        text(
            "SELECT id, recipe_name, image_key, user_id, created_at, "
            "reference_image_path, banner_image_path FROM recipe ORDER BY id"
        )
    ).mappings().all()
    print(f"Scanning {len(rows)} recipes...\n")

    groups: dict[str, list[dict]] = {}
    for row in rows:
        image_key = row["image_key"]
        if not image_key:
            continue
        for field, image_type in IMAGE_FIELDS:
            url = row[field]
            if not url or not is_cloudinary_url(url):
                continue
            if f"/recipes/{image_key}/" in url:
                continue  # already on its own canonical path
            groups.setdefault(url, []).append(
                {
                    "id": row["id"],
                    "recipe_name": row["recipe_name"],
                    "user_id": row["user_id"],
                    "created_at": row["created_at"],
                    "image_type": image_type,
                }
            )

    collisions = {url: members for url, members in groups.items() if len(members) > 1}

    if not collisions:
        print("No collisions found (either the catalog is clean, or --apply already ran).")
        return

    same_user_groups = 0
    cross_user_groups = 0

    print("=" * 60)
    print(f"COLLISION OWNERSHIP ({len(collisions)} groups)")
    print("=" * 60)
    for url, members in collisions.items():
        user_ids = {m["user_id"] for m in members}
        tag = "SAME USER" if len(user_ids) == 1 else "CROSS USER"
        if len(user_ids) == 1:
            same_user_groups += 1
        else:
            cross_user_groups += 1
        print(f"\n  [{tag}] {url}")
        for m in sorted(members, key=lambda m: m["created_at"]):
            print(
                f"      recipe {m['id']:>4} user={m['user_id']:<4} "
                f"created={m['created_at']}  ({m['recipe_name']}) [{m['image_type']}]"
            )

    print("\n" + "=" * 60)
    print("Summary")
    print("=" * 60)
    print(f"  Collision groups          : {len(collisions)}")
    print(f"  Same user_id both sides   : {same_user_groups}")
    print(f"  Different user_id sides   : {cross_user_groups}")
    print(
        "\n  SAME USER groups are the ones most likely to be genuine wrong-photo "
        "corruption (one recipe in the user's own catalog stole another's asset) "
        "and are worth spot-checking after --apply.\n"
        "  CROSS USER groups are more consistent with a legitimate duplicate-to-"
        "another-account copy of the same dish sharing its source photo."
    )


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--database-url", type=str, default=None)
    args = parser.parse_args()

    session = create_db_session(args.database_url)
    try:
        check(session)
    finally:
        session.close()


if __name__ == "__main__":
    main()
