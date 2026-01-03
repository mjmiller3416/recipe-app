"""merge migration heads

Revision ID: 6f0a15703ba1
Revises: 6bcddbb87700, b1c2d3e4f5a6
Create Date: 2025-12-18 21:45:15.662355

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '6f0a15703ba1'
down_revision: Union[str, Sequence[str], None] = ('6bcddbb87700', 'b1c2d3e4f5a6')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
