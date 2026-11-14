"""Business logic and service layer for Earth Observation data."""
from datetime import date
from typing import Dict, Any, Optional

from app.core.constants import (
    GIBS_TILE_BASE_URL,
    SMAP_TILE_MATRIX_SET,
    SMAP_LAYERS,
    VEGETATION_LAYERS,
    GAEZ_CATALOG,
)


class EarthDataService:
    @staticmethod
    def get_gaez_catalog() -> Dict[str, Any]:
        """Describe the global GAEZ source and expose which regional data are not integrated yet."""
        return {
            **GAEZ_CATALOG,
            "integration_scope": "global metadata catalog",
            "api_key_required": False,
            "numeric_values_available": False,
            "regional_season_calibration": {
                "available": False,
                "reason": "LGP and rainfall-season profiles require location-specific GAEZ and climate data.",
                "major_minor_months_assumed": False,
            },
            "references": {
                "gaez_v5_platform": GAEZ_CATALOG["platform_url"],
                "fao_gaez": GAEZ_CATALOG["fao_reference"],
            },
        }

    @staticmethod
    def build_smap_layer(product: str, observation_date: Optional[date]) -> Dict[str, Any]:
        """Build metadata and tile URL configuration for a SMAP soil moisture layer."""
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

    @staticmethod
    def build_vegetation_layer(product: str, observation_date: Optional[date]) -> Dict[str, Any]:
        """Build metadata and tile URL configuration for a vegetation or reflectance layer."""
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


earth_data_service = EarthDataService()
