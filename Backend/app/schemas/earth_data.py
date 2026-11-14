"""Pydantic schemas for Earth Observation and Agro-ecological data."""
from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str = "ok"


class RootResponse(BaseModel):
    message: str
    status: str


class SMAPMeasurement(BaseModel):
    name: str
    unit: str
    depth: str
    method: str


class SMAPFeatures(BaseModel):
    surface_soil_moisture_map: bool
    root_zone_moisture: bool
    drought_hazard_score: bool = False
    irrigation_trigger_alerts: bool = False


class SMAPLayerResponse(BaseModel):
    product: str
    dataset: str
    layer_id: str
    provider: str
    protocol: str
    measurement: SMAPMeasurement
    representation: str
    tile_url_template: str
    tile_matrix_set: str
    tile_format: str
    min_zoom: int
    max_zoom: int
    observation_date: Optional[str] = None
    date_behavior: str
    requires_api_key: bool = False
    features: SMAPFeatures
    limitations: List[str]
    references: Dict[str, str]


class SMAPLayersListResponse(BaseModel):
    layers: List[SMAPLayerResponse]


class VegetationLayerResponse(BaseModel):
    product: str
    dataset: str
    layer_id: str
    platform: str
    metric: str
    temporal_resolution: str
    provider: str
    protocol: str
    representation: str
    numeric_values_available: bool = False
    tile_url_template: str
    tile_matrix_set: str
    tile_format: str
    min_zoom: int
    max_zoom: int
    observation_date: Optional[str] = None
    date_behavior: str
    requires_api_key: bool = False
    limitations: List[str]
    references: Dict[str, str]


class VegetationLayersListResponse(BaseModel):
    layers: List[VegetationLayerResponse]
    derived_metrics: Dict[str, str]
    requires_api_key: bool = False


class GAEZIndicator(BaseModel):
    id: str
    name: str
    unit: Optional[str] = None
    status: str
    numeric_values_available: bool
    requires_location: bool


class GAEZCatalogResponse(BaseModel):
    dataset: str
    version: str
    baseline_year: int
    platform_url: str
    fao_reference: str
    indicators: List[GAEZIndicator]
    climate_inputs: Dict[str, Any]
    integration_scope: str
    api_key_required: bool
    numeric_values_available: bool
    regional_season_calibration: Dict[str, Any]
    references: Dict[str, str]
