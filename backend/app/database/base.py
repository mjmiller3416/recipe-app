"""app/core/database/base.py 

Defines the base class for all ORM models.
"""

# ── Imports ─────────────────────────────────────────────────────────────────────────────
from sqlalchemy.orm import declarative_base

Base = declarative_base()
