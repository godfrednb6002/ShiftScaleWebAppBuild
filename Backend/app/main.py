"""FastAPI application factory and middleware configuration."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.core.config import settings
from app.schemas.earth_data import HealthResponse, RootResponse


def create_application() -> FastAPI:
    """Build and configure the FastAPI application."""
    application = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
    )

    # Configure CORS
    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Core health & root endpoints
    @application.get("/", response_model=RootResponse, tags=["General"])
    def read_root():
        return {"message": "ShiftScale Backend is running!", "status": "healthy"}

    @application.get("/api/health", response_model=HealthResponse, tags=["General"])
    def health_check():
        return {"status": "ok"}

    # Include modular API v1 routers under /api
    application.include_router(api_router, prefix="/api")

    return application
