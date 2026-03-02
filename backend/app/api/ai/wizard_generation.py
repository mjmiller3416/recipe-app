"""API router for AI-powered wizard recipe generation."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.auth import require_pro
from app.database.db import get_session
from app.dtos.wizard_dtos import (
    WizardGenerationRequestDTO,
    WizardGenerationResponseDTO,
)
from app.models.user import User
from app.services.ai.wizard_generation import get_wizard_generation_service
from app.services.ai.wizard_generation.service import (
    WizardGenerationError,
    WizardParseError,
)
from app.services.usage_service import UsageService

router = APIRouter()


@router.post("", response_model=WizardGenerationResponseDTO)
async def generate_recipe(
    request: WizardGenerationRequestDTO,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_pro),
) -> WizardGenerationResponseDTO:
    """Generate a complete recipe from a text prompt using AI.

    Args:
        request: User prompt, optional preferences, and feature flags.

    Returns:
        Generated recipe with optional nutrition facts and images.
    """
    try:
        service = get_wizard_generation_service()
        result = service.generate(request)

        if not result.success:
            raise HTTPException(
                status_code=500, detail=result.error or "Recipe generation failed"
            )

        # Track usage (silent fail)
        try:
            UsageService(session, current_user.id).increment("ai_suggestions_requested")
        except Exception:
            pass

        return result

    except HTTPException:
        raise
    except WizardParseError as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to parse AI response: {str(e)}"
        )
    except WizardGenerationError as e:
        raise HTTPException(
            status_code=500, detail=f"Recipe generation failed: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Recipe generation failed: {str(e)}"
        )
