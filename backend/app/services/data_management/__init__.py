"""app/services/data_management

Modular data management service package.
Combines core service, import operations, export operations, backup, and restore.
"""

from .backup import BackupOperationsMixin
from .export_ops import ExportOperationsMixin
from .import_ops import ImportOperationsMixin
from .restore import RestoreOperationsMixin
from .service import DataManagementServiceCore


# ── Unified Service ─────────────────────────────────────────────────────────────────────────────
class DataManagementService(
    RestoreOperationsMixin,
    BackupOperationsMixin,
    ExportOperationsMixin,
    ImportOperationsMixin,
    DataManagementServiceCore,
):
    """Unified data management service combining all functionality.

    Inherits from:
    - DataManagementServiceCore: Initialization and shared helpers
    - ImportOperationsMixin: xlsx parsing, import preview, import execution
    - ExportOperationsMixin: Export to xlsx, generate template
    - BackupOperationsMixin: Full backup export, data clearing, Cloudinary cleanup
    - RestoreOperationsMixin: Restore preview, restore execution
    """

    pass


__all__ = [
    "DataManagementService",
]
