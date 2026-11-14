"""FastAPI application factory and middleware configuration."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.logging import configure_logging
from app.schemas.earth_data import RootResponse


def create_application() -> FastAPI:
    """Build and configure the FastAPI application."""
    configure_logging()

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

    # Root endpoint
    @application.get("/", response_model=RootResponse, tags=["General"])
    def read_root():
        return {"message": "ShiftScale Backend is running!", "status": "healthy"}

    # Include API routes under /api
    application.include_router(api_router, prefix="/api")

    return application


app = create_application()
