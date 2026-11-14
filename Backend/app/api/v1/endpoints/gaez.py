"""API endpoints for agro-ecological data (GAEZ)."""
from fastapi import APIRouter
from app.schemas.earth_data import GAEZCatalogResponse
from app.services.earth_data_service import earth_data_service

router = APIRouter(prefix="/gaez", tags=["Agro-ecological data"])


@router.get("/catalog", response_model=GAEZCatalogResponse)
def get_gaez_catalog():
    """Describe the global GAEZ source and expose which regional data are not integrated yet."""
    return earth_data_service.get_gaez_catalog()
