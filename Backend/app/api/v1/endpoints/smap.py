"""API endpoints for NASA SMAP soil moisture layers."""
from datetime import date
from typing import Optional
from fastapi import APIRouter, Query

from app.core.constants import SMAP_LAYERS
from app.schemas.earth_data import SMAPLayerResponse, SMAPLayersListResponse
from app.services.earth_data_service import earth_data_service

router = APIRouter(prefix="/smap", tags=["Earth observation"])


@router.get("/layers", response_model=SMAPLayersListResponse)
def get_smap_layers(observation_date: Optional[date] = Query(default=None, alias="date")):
    """Return public NASA GIBS tile configurations for both SMAP soil-moisture layers."""
    return {
        "layers": [
            earth_data_service.build_smap_layer(product, observation_date)
            for product in SMAP_LAYERS
        ]
    }


@router.get("/layer", response_model=SMAPLayerResponse)
def get_smap_surface_layer(
    observation_date: Optional[date] = Query(default=None, alias="date"),
):
    """Return the existing surface layer endpoint for backwards compatibility."""
    return earth_data_service.build_smap_layer("surface", observation_date)


@router.get("/layer/root-zone", response_model=SMAPLayerResponse)
def get_smap_root_zone_layer(
    observation_date: Optional[date] = Query(default=None, alias="date"),
):
    """Return public NASA GIBS tile configuration for the SMAP L4 root-zone product."""
    return earth_data_service.build_smap_layer("root_zone", observation_date)
