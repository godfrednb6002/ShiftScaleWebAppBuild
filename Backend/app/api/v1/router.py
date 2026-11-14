"""API v1 Router aggregation."""
from fastapi import APIRouter

from app.api.v1.endpoints import gaez, smap, vegetation

api_router = APIRouter()

api_router.include_router(gaez.router)
api_router.include_router(smap.router)
api_router.include_router(vegetation.router)
