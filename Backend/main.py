
import os
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from pydantic import BaseModel
from datetime import date
from fastapi import FastAPI, Query
from typing import Literal
from uuid import UUID, uuid4

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict, Field

load_dotenv()

app = FastAPI(title="ShiftScale API", version="0.2.0")


GIBS_TILE_BASE_URL = "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best"
SMAP_TILE_MATRIX_SET = "GoogleMapsCompatible_Level6"
SMAP_LAYERS = {
    "surface": {
        "dataset": "NASA SMAP L3 Passive Day Soil Moisture",
        "layer_id": "SMAP_L3_Passive_Day_Soil_Moisture",
        "measurement": {
            "name": "Surface soil moisture",
            "unit": "m^3/m^3",
            "depth": "surface",
            "method": "passive radiometer observation",
        },
    },
    "root_zone": {
        "dataset": "NASA SMAP L4 Analyzed Root Zone Soil Moisture",
        "layer_id": "SMAP_L4_Analyzed_Root_Zone_Soil_Moisture",
        "measurement": {
            "name": "Root-zone soil moisture",
            "unit": "m^3/m^3",
            "depth": "root zone (model-derived)",
            "method": "12z instantaneous model analysis",
        },
    },
}
VEGETATION_LAYERS = {
    "modis_ndvi": {
        "dataset": "MODIS Terra 8-Day Vegetation Index",
        "layer_id": "MODIS_Terra_NDVI_8Day",
        "platform": "Terra MODIS",
        "metric": "NDVI",
        "temporal_resolution": "rolling 8-day composite",
        "tile_matrix_set": "GoogleMapsCompatible_Level9",
        "tile_format": "image/png",
        "max_zoom": 9,
    },
    "modis_evi": {
        "dataset": "MODIS Terra 8-Day Enhanced Vegetation Index",
        "layer_id": "MODIS_Terra_EVI_8Day",
        "platform": "Terra MODIS",
        "metric": "EVI",
        "temporal_resolution": "rolling 8-day composite",
        "tile_matrix_set": "GoogleMapsCompatible_Level9",
        "tile_format": "image/png",
        "max_zoom": 9,
    },
    "landsat_reflectance": {
        "dataset": "Harmonized Landsat Sentinel-2 Landsat Nadir BRDF-Adjusted Reflectance",
        "layer_id": "HLS_L30_Nadir_BRDF_Adjusted_Reflectance",
        "platform": "Landsat 8/9 OLI",
        "metric": "surface reflectance",
        "temporal_resolution": "observation-based",
        "tile_matrix_set": "GoogleMapsCompatible_Level12",
        "tile_format": "image/png",
        "max_zoom": 12,
    },
}


class TerrainSample(BaseModel):
    latitude: float
    longitude: float
    elevation: float


class DatasetTask(BaseModel):
    id: int
    name: str
    dataset: str
    summary: str
    objective: str
    source: str
    rationale: str
    steps: list[str]


class TerrainSummary(BaseModel):
    sample_count: int
    minimum_elevation: float
    maximum_elevation: float
    average_elevation: float
    elevation_range: float


DATASET_3_TASK = DatasetTask(
    id=3,
    name="NASA SRTM Terrain Analysis",
    dataset="SRTM",
    summary="Analyze terrain elevation and slope variation across the mission area using NASA SRTM data.",
    objective="Identify ridgelines, valleys, and elevation breaks needed for terrain assessment and planning.",
    source="NASA Shuttle Radar Topography Mission (SRTM)",
    rationale="SRTM provides consistent global elevation data that helps teams evaluate terrain risk, drainage patterns, and site suitability.",
    steps=[
        "Load the SRTM dataset for the mission region.",
        "Filter invalid or missing elevation values.",
        "Calculate elevation statistics for the selected area.",
        "Map slope and relief patterns to locate ridges and valleys.",
        "Summarize terrain conditions for mission planning decisions.",
    ],
)


def summarize_srtm(samples: list[TerrainSample]) -> TerrainSummary:
    if not samples:
        return TerrainSummary(
            sample_count=0,
            minimum_elevation=0.0,
            maximum_elevation=0.0,
            average_elevation=0.0,
            elevation_range=0.0,
        )

    elevations = [sample.elevation for sample in samples]
    minimum_elevation = min(elevations)
    maximum_elevation = max(elevations)
    average_elevation = sum(elevations) / len(elevations)

    return TerrainSummary(
        sample_count=len(samples),
        minimum_elevation=round(minimum_elevation, 2),
        maximum_elevation=round(maximum_elevation, 2),
        average_elevation=round(average_elevation, 2),
        elevation_range=round(maximum_elevation - minimum_elevation, 2),
    )


# CORS setup
origins = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in origins],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class FieldObservation(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, allow_inf_nan=False)

    field_id: str = Field(min_length=1, description="Client-assigned field identifier")
    crop: str = Field(min_length=1, description="Crop name")
    growth_stage: str = Field(
        min_length=1,
        description="Crop stage; use 'flowering' to enable the flowering heat warning",
    )
    land_surface_temp_c: float = Field(description="ECOSTRESS land-surface temperature in Celsius")
    esi: float = Field(ge=0, le=1, description="Caller-provided ESI value on a 0-1 scale")
    precipitation_mm: float = Field(ge=0, description="Precipitation over the observation period")
    water_demand_mm: float = Field(ge=0, description="Water demand over the same period")
    period_days: int = Field(gt=0, description="Length of the observation period")
    heat_shock_threshold_c: float | None = Field(
        default=None,
        description="Crop-specific LST warning threshold; required for a flowering assessment",
    )
    baseline_lst_c: float | None = Field(
        default=None,
        description="Reference LST for the same field/crop stage",
    )
    thermal_tolerance_c: float | None = Field(
        default=None,
        ge=0,
        description="Allowed absolute LST difference from the supplied baseline",
    )


class CatalogResponse(BaseModel):
    dataset: str
    platform: str
    inputs: list[str]
    outputs: list[str]
    use_cases: list[str]
    limitations: list[str]


class HeatShockResult(BaseModel):
    status: Literal["warning", "no_warning", "not_applicable", "threshold_required"]
    threshold_c: float | None
    message: str


class ThermalResilienceResult(BaseModel):
    status: Literal["within_tolerance", "outside_tolerance", "not_assessed"]
    baseline_lst_c: float | None
    temperature_delta_c: float | None
    tolerance_c: float | None


class WaterBalanceResult(BaseModel):
    status: Literal["deficit", "balanced_or_surplus"]
    precipitation_mm: float
    water_demand_mm: float
    deficit_mm: float
    surplus_mm: float


class AssessmentResponse(BaseModel):
    assessment_id: UUID
    field_id: str
    crop: str
    growth_stage: str
    period_days: int
    land_surface_temp_c: float
    esi: float
    heat_shock: HeatShockResult
    canopy_thermal_resilience: ThermalResilienceResult
    water_deficit_balance: WaterBalanceResult


def build_assessment(observation: FieldObservation) -> AssessmentResponse:
    is_flowering = observation.growth_stage.casefold() == "flowering"

    if not is_flowering:
        heat_shock = HeatShockResult(
            status="not_applicable",
            threshold_c=observation.heat_shock_threshold_c,
            message="Flowering heat-shock warning is only evaluated during flowering.",
        )
    elif observation.heat_shock_threshold_c is None:
        heat_shock = HeatShockResult(
            status="threshold_required",
            threshold_c=None,
            message="Supply a crop-specific heat_shock_threshold_c to evaluate flowering heat shock.",
        )
    elif observation.land_surface_temp_c >= observation.heat_shock_threshold_c:
        heat_shock = HeatShockResult(
            status="warning",
            threshold_c=observation.heat_shock_threshold_c,
            message="Land-surface temperature is at or above the supplied flowering threshold.",
        )
    else:
        heat_shock = HeatShockResult(
            status="no_warning",
            threshold_c=observation.heat_shock_threshold_c,
            message="Land-surface temperature is below the supplied flowering threshold.",
        )

    if (
        observation.baseline_lst_c is None
        or observation.thermal_tolerance_c is None
    ):
        thermal_resilience = ThermalResilienceResult(
            status="not_assessed",
            baseline_lst_c=observation.baseline_lst_c,
            temperature_delta_c=None,
            tolerance_c=observation.thermal_tolerance_c,
        )
    else:
        temperature_delta = observation.land_surface_temp_c - observation.baseline_lst_c
        thermal_resilience = ThermalResilienceResult(
            status=(
                "within_tolerance"
                if abs(temperature_delta) <= observation.thermal_tolerance_c
                else "outside_tolerance"
            ),
            baseline_lst_c=observation.baseline_lst_c,
            temperature_delta_c=round(temperature_delta, 2),
            tolerance_c=observation.thermal_tolerance_c,
        )

    balance = observation.precipitation_mm - observation.water_demand_mm
    water_balance = WaterBalanceResult(
        status="deficit" if balance < 0 else "balanced_or_surplus",
        precipitation_mm=observation.precipitation_mm,
        water_demand_mm=observation.water_demand_mm,
        deficit_mm=round(max(0, -balance), 2),
        surplus_mm=round(max(0, balance), 2),
    )

    return AssessmentResponse(
        assessment_id=uuid4(),
        field_id=observation.field_id,
        crop=observation.crop,
        growth_stage=observation.growth_stage,
        period_days=observation.period_days,
        land_surface_temp_c=observation.land_surface_temp_c,
        esi=observation.esi,
        heat_shock=heat_shock,
        canopy_thermal_resilience=thermal_resilience,
        water_deficit_balance=water_balance,
    )


@app.get("/")
def read_root() -> dict[str, Any]:
    return {"message": "ShiftScale Backend is running!", "status": "healthy"}


@app.get("/api/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/tasks")
def list_tasks() -> list[dict[str, Any]]:
    return [DATASET_3_TASK.model_dump(mode="json")]


@app.get("/api/tasks/dataset-3")
def get_dataset_3_task() -> dict[str, Any]:
    return DATASET_3_TASK.model_dump(mode="json")


@app.get("/api/tasks/{task_id}")
def get_task(task_id: int) -> dict[str, Any]:
    if task_id != DATASET_3_TASK.id:
        raise HTTPException(status_code=404, detail="Task not found")
    return DATASET_3_TASK.model_dump(mode="json")


@app.post("/api/tasks/dataset-3/summary")
def get_dataset_3_summary(samples: list[TerrainSample]) -> TerrainSummary:
    return summarize_srtm(samples)

def _smap_layer_response(
    product: str,
    observation_date: date | None,
) -> dict:
    layer = SMAP_LAYERS[product]
    date_segment = f"{observation_date.isoformat()}/" if observation_date else ""
    tile_url_template = (
        f"{GIBS_TILE_BASE_URL}/{layer['layer_id']}/default/"
        f"{date_segment}{SMAP_TILE_MATRIX_SET}/{{z}}/{{y}}/{{x}}.png"
    )

    return {
        "product": product,
        "dataset": layer["dataset"],
        "layer_id": layer["layer_id"],
        "provider": "NASA EOSDIS Global Imagery Browse Services (GIBS)",
        "protocol": "WMTS",
        "measurement": layer["measurement"],
        "representation": "rendered-map-tiles",
        "tile_url_template": tile_url_template,
        "tile_matrix_set": SMAP_TILE_MATRIX_SET,
        "tile_format": "image/png",
        "min_zoom": 0,
        "max_zoom": 6,
        "observation_date": observation_date.isoformat() if observation_date else None,
        "date_behavior": (
            "Requested date" if observation_date else "NASA GIBS default observation date"
        ),
        "requires_api_key": False,
        "features": {
            "surface_soil_moisture_map": product == "surface",
            "root_zone_moisture": product == "root_zone",
            "drought_hazard_score": False,
            "irrigation_trigger_alerts": False,
        },
        "limitations": [
            "Tiles are rendered images and do not provide numeric per-pixel measurements.",
            *(
                [
                    "Root-zone moisture is a model-derived product, not a direct radiometer measurement.",
                    "Root-zone values are volumetric moisture, not saturation percentages.",
                ]
                if product == "root_zone"
                else []
            ),
            "Drought scores and irrigation alerts are not part of this integration.",
        ],
        "references": {
            "smap": "https://www.earthdata.nasa.gov/data/platforms/space-based-platforms/smap",
            "gibs_wmts": "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/wmts.cgi?SERVICE=WMTS&REQUEST=GetCapabilities",
        },
    }


@app.get("/api/smap/layers", tags=["Earth observation"])
def get_smap_layers(observation_date: date | None = Query(default=None, alias="date")):
    """Return public NASA GIBS tile configurations for both SMAP soil-moisture layers."""
    return {
        "layers": [
            _smap_layer_response(product, observation_date)
            for product in SMAP_LAYERS
        ]
    }


@app.get("/api/smap/layer", tags=["Earth observation"])
def get_smap_surface_layer(
    observation_date: date | None = Query(default=None, alias="date"),
):
    """Return the existing surface layer endpoint for backwards compatibility."""
    return _smap_layer_response("surface", observation_date)


@app.get("/api/smap/layer/root-zone", tags=["Earth observation"])
def get_smap_root_zone_layer(
    observation_date: date | None = Query(default=None, alias="date"),
):
    """Return public NASA GIBS tile configuration for the SMAP L4 root-zone product."""
    return _smap_layer_response("root_zone", observation_date)


def _vegetation_layer_response(
    product: str,
    observation_date: date | None,
) -> dict:
    layer = VEGETATION_LAYERS[product]
    date_segment = f"{observation_date.isoformat()}/" if observation_date else ""
    tile_url_template = (
        f"{GIBS_TILE_BASE_URL}/{layer['layer_id']}/default/"
        f"{date_segment}{layer['tile_matrix_set']}/{{z}}/{{y}}/{{x}}."
        f"{layer['tile_format'].removeprefix('image/')}"
    )

    return {
        "product": product,
        "dataset": layer["dataset"],
        "layer_id": layer["layer_id"],
        "platform": layer["platform"],
        "metric": layer["metric"],
        "temporal_resolution": layer["temporal_resolution"],
        "provider": "NASA EOSDIS Global Imagery Browse Services (GIBS)",
        "protocol": "WMTS",
        "representation": "rendered-map-tiles",
        "numeric_values_available": False,
        "tile_url_template": tile_url_template,
        "tile_matrix_set": layer["tile_matrix_set"],
        "tile_format": layer["tile_format"],
        "min_zoom": 0,
        "max_zoom": layer["max_zoom"],
        "observation_date": observation_date.isoformat() if observation_date else None,
        "date_behavior": (
            "Requested date; imagery follows the product's temporal resolution"
            if observation_date
            else "NASA GIBS default observation date"
        ),
        "requires_api_key": False,
        "limitations": [
            "Tiles are rendered imagery and do not provide numeric per-pixel values or reflectance bands.",
            "Bare Soil Index (BSI), canopy metrics, bare-fallow detection, and cover-crop validation are not calculated.",
        ],
        "references": {
            "gibs_wmts": "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/wmts.cgi?SERVICE=WMTS&REQUEST=GetCapabilities",
            "landsat": "https://earthexplorer.usgs.gov/",
            "modis": "https://lpdaac.usgs.gov/products/",
        },
    }


@app.get("/api/landsat-modis/layers", tags=["Earth observation"])
def get_landsat_modis_layers(
    observation_date: date | None = Query(default=None, alias="date"),
):
    """Return public NASA GIBS vegetation and Landsat reflectance tile configurations."""
    return {
        "layers": [
            _vegetation_layer_response(product, observation_date)
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
@app.get("/api/catalog/ecostress", response_model=CatalogResponse)
def get_ecostress_catalog():
    return CatalogResponse(
        dataset="NASA ECOSTRESS L2_LSTE",
        platform="Thermal infrared instrument on the International Space Station",
        inputs=[
            "ECOSTRESS land-surface temperature (LST)",
            "Caller-provided Evaporative Stress Index (ESI, 0-1)",
            "Precipitation and water demand for a matching period",
        ],
        outputs=[
            "Land-surface temperature in Celsius",
            "Evaporative Stress Index (reported as supplied)",
            "Flowering heat-shock warning",
            "Canopy thermal resilience relative to a supplied baseline/tolerance",
            "Water deficit or surplus balance",
        ],
        use_cases=[
            "Crop flowering heat-shock warnings",
            "Canopy thermal resilience",
            "Water deficit balance",
        ],
        limitations=[
            "This local API does not fetch NASA, weather, or precipitation data.",
            "ESI is returned as supplied; it is not derived from LST or precipitation.",
            "Heat-shock thresholds and thermal baselines are crop/field-specific and must be supplied by the caller.",
            "Water balance is precipitation minus water demand over the same period; it does not model irrigation, runoff, or soil storage.",
        ],
    )


@app.post("/api/assessments/ecostress", response_model=AssessmentResponse)
def create_ecostress_assessment(observation: FieldObservation):
    return build_assessment(observation)
from app.main import app

__all__ = ["app"]