"""app/services/planner/batch.py

Batch operations mixin for planner service.
Handles bulk clearing of planner entries.
"""

# -- Imports -------------------------------------------------------------------------------------
from sqlalchemy.exc import SQLAlchemyError


# -- Batch Operations Mixin ----------------------------------------------------------------------
class BatchOperationsMixin:
    """Mixin providing batch clear operations."""

    # -- Clear Operations ------------------------------------------------------------------------
    def clear_planner(self) -> int:
        """
        Clear all entries from the planner for the current user.
        Transient meals are deleted when their entries are cleared.

        Returns:
            Number of entries cleared
        """
        try:
            # Get all meal IDs before clearing
            entries = self.repo.get_all(self.user_id)
            meal_ids = list(set(e.meal_id for e in entries))

            count = self.repo.clear_all(self.user_id)

            # Clean up transient meals
            for meal_id in meal_ids:
                self._cleanup_transient_meal(meal_id)

            self.session.commit()

            # Sync shopping list (will remove all recipe items since planner is empty)
            if count > 0:
                self._sync_shopping_list()

            return count
        except SQLAlchemyError:
            self.session.rollback()
            return 0

    def clear_completed(self) -> int:
        """
        Clear all completed entries from the planner for the current user.
        Transient meals are deleted if they have no remaining active entries.

        Returns:
            Number of entries cleared
        """
        try:
            # Get meal IDs from completed entries before clearing
            completed_entries = self.repo.get_completed_entries(self.user_id)
            meal_ids = list(set(e.meal_id for e in completed_entries))

            count = self.repo.clear_completed(self.user_id)

            # Clean up transient meals
            for meal_id in meal_ids:
                self._cleanup_transient_meal(meal_id)

            self.session.commit()

            # Sync shopping list after clearing completed entries
            # (completed entries weren't contributing, but clearing might allow orphan cleanup)
            if count > 0:
                self._sync_shopping_list()

            return count
        except SQLAlchemyError:
            self.session.rollback()
            return 0
