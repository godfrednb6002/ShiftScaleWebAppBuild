import json
import logging
from typing import Any
from urllib.parse import quote

import requests
from pydantic import ValidationError

from app.schemas.crop_rotation import (
    CropRotationRecommendation,
    CropRotationRequest,
)

logger = logging.getLogger(__name__)

GEMINI_GENERATE_CONTENT_URL = (
    "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
)
GEMINI_RESPONSE_SCHEMA = {
    "type": "OBJECT",
    "properties": {
        "title": {"type": "STRING"},
        "summary": {"type": "STRING"},
        "crop_sequence": {
            "type": "ARRAY",
            "items": {
                "type": "OBJECT",
                "properties": {
                    "crop": {"type": "STRING"},
                    "crop_family": {"type": "STRING"},
                    "start_month": {"type": "INTEGER"},
                    "end_month": {"type": "INTEGER"},
                    "duration_days": {"type": "INTEGER"},
                    "purpose": {"type": "STRING"},
                },
                "required": [
                    "crop",
                    "crop_family",
                    "start_month",
                    "end_month",
                    "duration_days",
                    "purpose",
                ],
            },
        },
        "rationale": {"type": "STRING"},
        "considerations": {"type": "ARRAY", "items": {"type": "STRING"}},
        "local_checks": {"type": "ARRAY", "items": {"type": "STRING"}},
    },
    "required": [
        "title",
        "summary",
        "crop_sequence",
        "rationale",
        "considerations",
        "local_checks",
    ],
}

SYSTEM_INSTRUCTION = """
You are an agricultural planning assistant. Produce a practical, well-balanced
crop-rotation draft from the farmer's context.

IMPORTANT: Respect the farmer's crop selection. Incorporate all or most of the
farmer's selected crops into the rotation plan across sequential phases or
compatible seasons. Do not artificially truncate the plan to only 2 or 3 crops
when the farmer has selected 4 or more crops; create a multi-phase rotation
that accommodates their chosen crop portfolio (up to 8 phases if appropriate),
adding a suitable cover crop only when beneficial for soil regeneration.

Write for farmers with no technical training. Use simple everyday English,
short sentences, and familiar words. Avoid jargon and abbreviations. If a
technical farming term is needed, explain it in simple words right away. Give
clear, practical actions. Use plain-language plant groups in crop_family, such
as "grain crop", "bean or pea crop", or "root crop"; avoid technical family
names. Keep the summary to one or two short sentences, and keep each reason,
consideration, and local check brief.

Do not claim access to satellite or live climate data. Do not invent
measurements, yield predictions, percent benefits, or guaranteed outcomes. Use
month numbers 1 through 12 for planting windows. Explain uncertainty and what a
local farm adviser should verify. Return only the requested structured JSON.
""".strip()


class GeminiRotationError(Exception):
    """Base error for Gemini rotation-plan generation."""


class GeminiRotationTimeoutError(GeminiRotationError):
    """Gemini did not respond before the request timeout."""


class GeminiRotationConfigurationError(GeminiRotationError):
    """Gemini credentials or model configuration are missing."""


class GeminiRotationUpstreamError(GeminiRotationError):
    """Gemini returned an unsuccessful response."""


class GeminiRotationResponseError(GeminiRotationError):
    """Gemini returned a missing or invalid rotation plan."""


def _build_prompt(request: CropRotationRequest) -> str:
    crop_count = len(request.selected_crops)
    min_phases = max(2, min(crop_count, 8))
    context = {
        "preferred_crops": request.selected_crops,
        "selected_crop_count": crop_count,
        "soil_type": request.soil_type,
        "farming_system": request.farming_system,
        "farm_region": request.farm_region,
        "farm_district": request.farm_district,
        "farm_area_hectares": request.farm_area_hectares,
    }
    return (
        f"Create a clear, practical crop rotation plan incorporating the {crop_count} selected crops. "
        f"Include a sequence of at least {min_phases} distinct phases so that the farmer's selected crops "
        "(and optionally a cover crop) are featured in a sustainable planting order. "
        "For each phase, include the crop name, planting months (start_month and end_month as 1-12), "
        "duration_days in the field, a plain-language plant group (crop_family), and a concise reason (purpose) "
        "for planting it in that order. Align with regional agro-climatic seasons carefully without claiming "
        "unsupported measurements.\n\n"
        f"Farm context JSON:\n{json.dumps(context, ensure_ascii=True)}"
    )


def _response_text(payload: Any) -> str:
    if not isinstance(payload, dict):
        raise GeminiRotationResponseError("Gemini returned an invalid response.")
    candidates = payload.get("candidates")
    if not isinstance(candidates, list) or not candidates:
        raise GeminiRotationResponseError("Gemini returned no rotation recommendation.")

    candidate = candidates[0]
    content = candidate.get("content") if isinstance(candidate, dict) else None
    parts = content.get("parts") if isinstance(content, dict) else None
    if not isinstance(parts, list):
        raise GeminiRotationResponseError("Gemini returned no recommendation text.")
    text = "".join(
        part["text"]
        for part in parts
        if isinstance(part, dict) and isinstance(part.get("text"), str)
    )
    if not text:
        raise GeminiRotationResponseError("Gemini returned no recommendation text.")
    return text


def _parse_recommendation(payload: Any) -> CropRotationRecommendation:
    try:
        parsed = json.loads(_response_text(payload))
        return CropRotationRecommendation.model_validate(parsed)
    except (json.JSONDecodeError, ValidationError, TypeError, ValueError) as error:
        raise GeminiRotationResponseError(
            "Gemini returned a rotation plan that did not match the expected format."
        ) from error


def generate_rotation_recommendation(
    request: CropRotationRequest,
    api_key: str | None,
    model: str,
    timeout: float = 45,
) -> CropRotationRecommendation:
    if not api_key or not api_key.strip():
        raise GeminiRotationConfigurationError(
            "Gemini is not configured. Add GEMINI_API_KEY to Backend/.env."
        )
    if not model or not model.strip():
        raise GeminiRotationConfigurationError("No Gemini model is configured.")

    url = GEMINI_GENERATE_CONTENT_URL.format(model=quote(model.strip(), safe=""))
    body = {
        "systemInstruction": {"parts": [{"text": SYSTEM_INSTRUCTION}]},
        "contents": [{"role": "user", "parts": [{"text": _build_prompt(request)}]}],
        "generationConfig": {
            "responseMimeType": "application/json",
            "responseSchema": GEMINI_RESPONSE_SCHEMA,
            "temperature": 0.3,
            "maxOutputTokens": 1_800,
        },
    }

    try:
        response = requests.post(
            url,
            headers={
                "Content-Type": "application/json",
                "x-goog-api-key": api_key.strip(),
            },
            json=body,
            timeout=timeout,
        )
        response.raise_for_status()
    except requests.Timeout as error:
        raise GeminiRotationTimeoutError(
            "Gemini rotation-plan request timed out."
        ) from error
    except requests.RequestException as error:
        status = error.response.status_code if error.response is not None else "unavailable"
        logger.warning("Gemini rotation request failed (HTTP %s).", status)
        raise GeminiRotationUpstreamError(
            f"Gemini rotation request failed (HTTP {status})."
        ) from error

    try:
        payload = response.json()
    except ValueError as error:
        raise GeminiRotationResponseError("Gemini returned invalid JSON.") from error

    recommendation = _parse_recommendation(payload)
    selected = {crop.casefold() for crop in request.selected_crops}
    if not any(
        crop in phase.crop.casefold() or phase.crop.casefold() in crop
        for crop in selected
        for phase in recommendation.crop_sequence
    ):
        raise GeminiRotationResponseError(
            "Gemini's plan did not include any of the selected crops."
        )
    return recommendation
