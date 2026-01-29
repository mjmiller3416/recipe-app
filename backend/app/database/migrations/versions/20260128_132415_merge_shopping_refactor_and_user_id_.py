"""merge_shopping_refactor_and_user_id_branches

Revision ID: eacf0ae64c36
Revises: h8i9j0k1l2m3, h3c4d5e6f7g8
Create Date: 2026-01-28 13:24:15.007571

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'eacf0ae64c36'
down_revision: Union[str, Sequence[str], None] = ('h8i9j0k1l2m3', 'h3c4d5e6f7g8')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
