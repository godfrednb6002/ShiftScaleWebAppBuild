from fastapi import APIRouter, HTTPException

from app.core.config import settings
from app.schemas.crop_rotation import (
    CropRotationRecommendation,
    CropRotationRequest,
)
from app.services.gemini_rotation import (
    GeminiRotationConfigurationError,
    GeminiRotationResponseError,
    GeminiRotationTimeoutError,
    GeminiRotationUpstreamError,
    generate_rotation_recommendation,
)

router = APIRouter(tags=["Crop rotation"])


@router.post(
    "/recommendation",
    response_model=CropRotationRecommendation,
    summary="Generate an AI crop-rotation recommendation",
)
def post_crop_rotation_recommendation(
    request: CropRotationRequest,
) -> CropRotationRecommendation:
    try:
        return generate_rotation_recommendation(
            request=request,
            api_key=(
                settings.gemini_api_key.get_secret_value()
                if settings.gemini_api_key
                else None
            ),
            model=settings.gemini_model,
        )
    except GeminiRotationConfigurationError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error
    except GeminiRotationTimeoutError as error:
        raise HTTPException(status_code=504, detail=str(error)) from error
    except GeminiRotationUpstreamError as error:
        raise HTTPException(status_code=502, detail=str(error)) from error
    except GeminiRotationResponseError as error:
        raise HTTPException(status_code=502, detail=str(error)) from error
