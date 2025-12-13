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
    # Rename default_image_path to reference_image_path
    op.alter_column('recipe', 'default_image_path', new_column_name='reference_image_path')


def downgrade() -> None:
    """Downgrade schema."""
    # Rename reference_image_path back to default_image_path
    op.alter_column('recipe', 'reference_image_path', new_column_name='default_image_path')
