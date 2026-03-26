"""scope shopping_items aggregation_key unique constraint to user_id

Revision ID: 24f4f817c85d
Revises: 859c39c40946
Create Date: 2026-03-26 19:50:43.988206

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = '24f4f817c85d'
down_revision: Union[str, Sequence[str], None] = '859c39c40946'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Replace global unique on aggregation_key with per-user unique."""
    op.drop_index('ix_shopping_items_aggregation_key', table_name='shopping_items')
    op.create_index('ix_shopping_items_aggregation_key', 'shopping_items', ['aggregation_key'], unique=False)
    op.create_unique_constraint('uq_shopping_item_aggregation_user', 'shopping_items', ['aggregation_key', 'user_id'])


def downgrade() -> None:
    """Restore global unique on aggregation_key."""
    op.drop_constraint('uq_shopping_item_aggregation_user', 'shopping_items', type_='unique')
    op.drop_index('ix_shopping_items_aggregation_key', table_name='shopping_items')
    op.create_index('ix_shopping_items_aggregation_key', 'shopping_items', ['aggregation_key'], unique=True)
