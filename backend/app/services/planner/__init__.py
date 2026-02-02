"""app/services/planner

Modular planner service package.
Combines core service, entry management, status management, and batch operations.
"""

from .batch import BatchOperationsMixin
from .entry import EntryManagementMixin, EntryNotFoundError, InvalidMealError, PlannerFullError
from .service import PlannerServiceCore
from .status import StatusManagementMixin


# ── Unified Service ─────────────────────────────────────────────────────────────────────────────
class PlannerService(
    BatchOperationsMixin,
    StatusManagementMixin,
    EntryManagementMixin,
    PlannerServiceCore,
):
    """Unified planner service combining all functionality.

    Inherits from:
    - PlannerServiceCore: Initialization, read operations, helpers
    - EntryManagementMixin: Entry creation, removal, transient meal cleanup
    - StatusManagementMixin: Reordering, shopping mode, completion status
    - BatchOperationsMixin: Bulk clear operations
    """

    pass


__all__ = [
    "PlannerService",
    "PlannerFullError",
    "InvalidMealError",
    "EntryNotFoundError",
]
