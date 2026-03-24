"""add status and admin_notes to feedback

Revision ID: 859c39c40946
Revises: 7f3d7aaf21f9
Create Date: 2026-03-24 17:11:26.905953

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '859c39c40946'
down_revision: Union[str, Sequence[str], None] = '7f3d7aaf21f9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('feedback', sa.Column('status', sa.String(length=20), server_default='new', nullable=False))
    op.add_column('feedback', sa.Column('admin_notes', sa.Text(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('feedback', 'admin_notes')
    op.drop_column('feedback', 'status')
