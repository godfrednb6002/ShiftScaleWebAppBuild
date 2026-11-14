from fastapi import APIRouter

from app.api.v1.endpoints import health, nasa_power

api_router = APIRouter()
api_router.include_router(health.router, tags=["health"])
api_router.include_router(
    nasa_power.router,
    prefix="/v1/nasa/power",
    tags=["NASA POWER"],
)
