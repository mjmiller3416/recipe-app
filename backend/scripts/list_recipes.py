#!/usr/bin/env python3
"""List all recipe IDs and names from the database."""

import sys
from pathlib import Path

# Add backend to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.database.db import SessionLocal
from app.models import Recipe

def main():
    session = SessionLocal()
    try:
        recipes = session.query(Recipe.id, Recipe.recipe_name).order_by(Recipe.id).all()
        print(f"\n{'ID':<5} Recipe Name")
        print("-" * 50)
        for id, name in recipes:
            print(f"{id:<5} {name}")
        print(f"\nTotal: {len(recipes)} recipes")
    finally:
        session.close()

if __name__ == "__main__":
    main()
