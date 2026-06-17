"""merge wizard nutrition and admin migration heads

Revision ID: 5664b355b32b
Revises: 58d413ef2c47, 24f4f817c85d
Create Date: 2026-06-15 20:59:30.314826

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '5664b355b32b'
down_revision: Union[str, Sequence[str], None] = ('58d413ef2c47', '24f4f817c85d')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
