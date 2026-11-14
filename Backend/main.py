"""Application entrypoint for uvicorn server."""
import uvicorn
from app.main import app, create_application
from app.core.config import settings

# Export models and services for backward-compatibility with tests importing from main
from app.schemas.ecostress import FieldObservation, AssessmentResponse, CatalogResponse
from app.services.nasa.ecostress_service import build_assessment
from app.schemas.srtm import TerrainSample, TerrainSummary, DatasetTask
from app.services.nasa.srtm_service import DATASET_3_TASK, summarize_srtm

__all__ = [
    "app",
    "create_application",
    "FieldObservation",
    "AssessmentResponse",
    "CatalogResponse",
    "build_assessment",
    "TerrainSample",
    "TerrainSummary",
    "DatasetTask",
    "DATASET_3_TASK",
    "summarize_srtm",
]

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.environment == "development",
    )
