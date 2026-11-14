"""API endpoints for NASA Landsat and MODIS vegetation layers."""
from datetime import date
from typing import Optional
from fastapi import APIRouter, Query

from app.core.constants import VEGETATION_LAYERS
from app.schemas.earth_data import VegetationLayersListResponse
from app.services.earth_data_service import earth_data_service

router = APIRouter(prefix="/landsat-modis", tags=["Earth observation"])


@router.get("/layers", response_model=VegetationLayersListResponse)
def get_landsat_modis_layers(
    observation_date: Optional[date] = Query(default=None, alias="date"),
):
    """Return public NASA GIBS vegetation and Landsat reflectance tile configurations."""
    return {
        "layers": [
            earth_data_service.build_vegetation_layer(product, observation_date)
            for product in VEGETATION_LAYERS
        ],
        "derived_metrics": {
            "ndvi": "MODIS Terra NDVI map layer is available as rendered imagery.",
            "evi": "MODIS Terra EVI map layer is available as rendered imagery.",
            "bsi": "Not available from these rendered GIBS tiles; requires numeric surface-reflectance bands.",
            "canopy_cover": "Not calculated; requires numeric imagery and a validated method.",
            "bare_fallow_exposure": "Not calculated; requires numeric imagery and field/time-series rules.",
            "cover_crop_validation": "Not calculated; requires field boundaries and numeric imagery.",
        },
        "requires_api_key": False,
    }
