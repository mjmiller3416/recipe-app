"""Drop total_time column from recipe table

Revision ID: f9a8b7c6d5e4
Revises: 5664b355b32b
Create Date: 2026-06-17

Backfills cook_time from total_time for old records that never had
prep/cook split, then drops the total_time column. The Recipe model
now provides total_time as a hybrid_property (prep_time + cook_time).
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f9a8b7c6d5e4'
down_revision: Union[str, Sequence[str], None] = '5664b355b32b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Backfill: copy total_time into cook_time for records that have
    # total_time but no cook_time (pre-wizard recipes)
    op.execute(
        "UPDATE recipe SET cook_time = total_time "
        "WHERE cook_time IS NULL AND total_time IS NOT NULL"
    )

    with op.batch_alter_table('recipe') as batch_op:
        batch_op.drop_column('total_time')


def downgrade() -> None:
    with op.batch_alter_table('recipe') as batch_op:
        batch_op.add_column(sa.Column('total_time', sa.Integer(), nullable=True))

    # Re-populate total_time from prep_time + cook_time
    op.execute(
        "UPDATE recipe SET total_time = "
        "COALESCE(prep_time, 0) + COALESCE(cook_time, 0) "
        "WHERE prep_time IS NOT NULL OR cook_time IS NOT NULL"
    )
