"""app/services/shopping/aggregation.py

Aggregation and analysis mixin for shopping service.
Handles ingredient breakdown and recipe-level analysis.
"""

# -- Imports -------------------------------------------------------------------------------------
from typing import Any, List

from sqlalchemy.exc import SQLAlchemyError


# -- Aggregation Mixin ---------------------------------------------------------------------------
class AggregationMixin:
    """Mixin providing aggregation and breakdown analysis methods."""

    def get_ingredient_breakdown(self, recipe_ids: List[int]) -> Any:
        """
        Get detailed breakdown of ingredients by recipe.

        Args:
            recipe_ids (List[int]): List of recipe IDs.

        Returns:
            An object with attribute 'items', a list of breakdown items.
        """
        try:
            raw = self.shopping_repo.get_ingredient_breakdown(recipe_ids)

            class _BreakdownResponse:
                pass

            resp = _BreakdownResponse()
            resp.items = []
            for key, contributions in raw.items():
                parts = key.split("::")
                # capitalize ingredient name for proper formatting
                ingredient_name = parts[0].capitalize() if parts else ""
                unit = parts[1] if len(parts) > 1 else ""
                total_qty = sum(qty for _, qty, _, _ in contributions)

                class _Item:
                    pass

                item = _Item()
                item.ingredient_name = ingredient_name
                item.total_quantity = total_qty
                item.unit = unit
                # build recipe_breakdown list with usage_count
                item.recipe_breakdown = [
                    type(
                        "Rpt",
                        (),
                        {
                            "recipe_name": rn,
                            "quantity": q,
                            "unit": u,
                            "usage_count": cnt,
                        },
                    )
                    for rn, q, u, cnt in contributions
                ]
                resp.items.append(item)
            return resp
        except SQLAlchemyError:

            class _BreakdownResponse:
                pass

            resp = _BreakdownResponse()
            resp.items = []
            return resp
