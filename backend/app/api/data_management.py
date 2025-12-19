"""app/api/data_management.py

FastAPI router for data management endpoints (import/export).
"""

from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from io import BytesIO
import json

from app.core.database.db import get_session
from app.core.dtos.data_management_dtos import (
    DuplicateResolutionDTO,
    ExportFilterDTO,
    ImportPreviewDTO,
    ImportResultDTO,
)
from app.core.services.data_management_service import DataManagementService

router = APIRouter()

# Maximum file size: 10MB
MAX_FILE_SIZE = 10 * 1024 * 1024


@router.post("/import/preview", response_model=ImportPreviewDTO)
async def preview_import(
    file: UploadFile = File(...),
    session: Session = Depends(get_session),
):
    """
    Upload an xlsx file and get a preview of what will be imported.

    Returns information about:
    - Total recipes found in file
    - New recipes that will be created
    - Duplicate recipes that need resolution
    - Any validation errors
    """
    # Validate file type
    if not file.filename or not file.filename.endswith(".xlsx"):
        raise HTTPException(
            status_code=400,
            detail="Invalid file format. Please upload an .xlsx file",
        )

    # Read file content
    content = await file.read()

    # Validate file size
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail="File too large. Maximum size is 10MB",
        )

    service = DataManagementService(session)

    # Parse xlsx
    recipes, validation_errors = service.parse_xlsx(content)

    if validation_errors and not recipes:
        # If we have validation errors and no recipes, return them in the preview
        return ImportPreviewDTO(
            total_recipes=0,
            new_recipes=0,
            duplicate_recipes=[],
            validation_errors=validation_errors,
        )

    # Get preview with duplicate detection
    preview = service.get_import_preview(recipes)
    preview.validation_errors = validation_errors

    return preview


@router.post("/import/execute", response_model=ImportResultDTO)
async def execute_import(
    file: UploadFile = File(...),
    resolutions: str = Form(default="[]"),
    session: Session = Depends(get_session),
):
    """
    Execute the import with user-specified duplicate resolutions.

    The resolutions parameter is a JSON string array of DuplicateResolutionDTO objects.
    Each resolution specifies how to handle a duplicate:
    - "skip": Don't import this recipe
    - "update": Update the existing recipe with new data
    - "rename": Create new recipe with a different name (requires new_name field)
    """
    # Validate file type
    if not file.filename or not file.filename.endswith(".xlsx"):
        raise HTTPException(
            status_code=400,
            detail="Invalid file format. Please upload an .xlsx file",
        )

    # Read file content
    content = await file.read()

    # Validate file size
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail="File too large. Maximum size is 10MB",
        )

    # Parse resolutions JSON
    try:
        resolutions_data = json.loads(resolutions)
        resolution_dtos = [DuplicateResolutionDTO(**r) for r in resolutions_data]
    except (json.JSONDecodeError, ValueError) as e:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid resolutions format: {str(e)}",
        )

    service = DataManagementService(session)

    # Parse xlsx
    recipes, validation_errors = service.parse_xlsx(content)

    if validation_errors and not recipes:
        return ImportResultDTO(
            success=False,
            created_count=0,
            updated_count=0,
            skipped_count=0,
            errors=[e.message for e in validation_errors],
        )

    # Execute import
    result = service.execute_import(recipes, resolution_dtos)

    return result


@router.get("/export")
async def export_recipes(
    recipe_category: Optional[str] = Query(None),
    meal_type: Optional[str] = Query(None),
    favorites_only: bool = Query(False),
    session: Session = Depends(get_session),
):
    """
    Export recipes to an xlsx file.

    Optional filters:
    - recipe_category: Only export recipes from this category
    - meal_type: Only export recipes with this meal type
    - favorites_only: Only export favorited recipes
    """
    filter_dto = ExportFilterDTO(
        recipe_category=recipe_category,
        meal_type=meal_type,
        favorites_only=favorites_only,
    )

    service = DataManagementService(session)
    xlsx_bytes = service.export_recipes_to_xlsx(filter_dto)

    return StreamingResponse(
        BytesIO(xlsx_bytes),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=recipes_export.xlsx"},
    )


@router.get("/template")
async def download_template():
    """
    Download an empty xlsx template with the correct format for importing recipes.

    The template includes:
    - Recipes sheet with all column headers
    - Ingredients sheet with all column headers
    - Example data to show the expected format
    """
    service = DataManagementService(None)  # No session needed for template
    xlsx_bytes = service.generate_template_xlsx()

    return StreamingResponse(
        BytesIO(xlsx_bytes),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=recipe_import_template.xlsx"},
    )
