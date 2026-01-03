"""Updates to relationships

Revision ID: 03d9762722ed
Revises: 63850dca5ec4
Create Date: 2025-07-02 20:25:07.888306

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = '03d9762722ed'
down_revision: Union[str, Sequence[str], None] = '63850dca5ec4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    with op.batch_alter_table("recipe_ingredients", schema=None) as batch_op:
        batch_op.create_foreign_key(
            "fk_recipe_ingredients_ingredient_id",
            referent_table="ingredients",
            local_cols=["ingredient_id"],
            remote_cols=["id"]
        )
        batch_op.create_foreign_key(
            "fk_recipe_ingredients_recipe_id",
            referent_table="recipe",
            local_cols=["recipe_id"],
            remote_cols=["id"]
        )

def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table("recipe_ingredients", schema=None) as batch_op:
        batch_op.drop_constraint("fk_recipe_ingredients_ingredient_id", type_="foreignkey")
        batch_op.drop_constraint("fk_recipe_ingredients_recipe_id", type_="foreignkey")
