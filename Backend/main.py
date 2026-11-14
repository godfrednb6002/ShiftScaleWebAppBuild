import os
from datetime import date

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="ShiftScale API", version="0.1.0")

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

# CORS setup
origins = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in origins],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "ShiftScale Backend is running!", "status": "healthy"}

@app.get("/api/health")
def health_check():
    return {"status": "ok"}


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
