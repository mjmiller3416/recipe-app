"""rename reference_image_path to reference_image_path

Revision ID: 6bcddbb87700
Revises: a72f23af2b57
Create Date: 2025-08-30 14:03:01.444625

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = '6bcddbb87700'
down_revision: Union[str, Sequence[str], None] = 'a72f23af2b57'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # This migration was intended to rename default_image_path to reference_image_path,
    # but the previous migration (a72f23af2b57) already creates reference_image_path directly.
    # This is now a no-op for fresh databases.
    pass


def downgrade() -> None:
    """Downgrade schema."""
    # No-op - see upgrade comment
    pass
