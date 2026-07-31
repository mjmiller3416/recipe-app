"""drop_feedback_table

Revision ID: 687a6a7ea1b6
Revises: e3b8a5c1f2d4
Create Date: 2026-07-30 23:20:28.956032

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import sqlite

# revision identifiers, used by Alembic.
revision: str = '687a6a7ea1b6'
down_revision: Union[str, Sequence[str], None] = 'e3b8a5c1f2d4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.drop_index(op.f('ix_feedback_user_id'), table_name='feedback')
    op.drop_table('feedback')


def downgrade() -> None:
    """Downgrade schema."""
    op.create_table('feedback',
    sa.Column('id', sa.INTEGER(), nullable=False),
    sa.Column('user_id', sa.INTEGER(), nullable=False),
    sa.Column('category', sa.VARCHAR(length=50), nullable=False),
    sa.Column('message', sa.TEXT(), nullable=False),
    sa.Column('metadata_json', sqlite.JSON(), nullable=True),
    sa.Column('created_at', sa.DATETIME(), nullable=False),
    sa.Column('status', sa.VARCHAR(length=20), server_default=sa.text("'new'"), nullable=False),
    sa.Column('admin_notes', sa.TEXT(), nullable=True),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_feedback_user_id'), 'feedback', ['user_id'], unique=False)
