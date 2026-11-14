"""API endpoints for NASA ECOSTRESS data and assessments."""
from fastapi import APIRouter

from app.schemas.ecostress import AssessmentResponse, CatalogResponse, FieldObservation
from app.services.nasa.ecostress_service import ECOSTRESS_CATALOG, build_assessment

router = APIRouter(tags=["NASA ECOSTRESS"])


@router.get("/catalog/ecostress", response_model=CatalogResponse)
def get_ecostress_catalog():
    return ECOSTRESS_CATALOG


@router.post("/assessments/ecostress", response_model=AssessmentResponse)
def create_ecostress_assessment(observation: FieldObservation):
    return build_assessment(observation)
