"""API v1 Router aggregation."""
from fastapi import APIRouter

from app.api.v1.endpoints import (
    ecostress,
    gaez,
    health,
    crop_rotation,
    nasa_power,
    smap,
    srtm,
    vegetation,
)

api_router = APIRouter()

# Health check
api_router.include_router(health.router, tags=["health"])

# Agro-ecological & Earth observation
api_router.include_router(gaez.router)
api_router.include_router(smap.router)
api_router.include_router(vegetation.router)

# NASA POWER & SRTM & ECOSTRESS
api_router.include_router(
    nasa_power.router,
    prefix="/v1/nasa/power",
    tags=["NASA POWER"],
)
api_router.include_router(srtm.router)
api_router.include_router(ecostress.router)
api_router.include_router(
    crop_rotation.router,
    prefix="/v1/crop-rotation",
)
