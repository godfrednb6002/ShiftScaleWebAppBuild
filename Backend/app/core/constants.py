"""Constants and data catalogs for Earth Observation and Agro-ecological datasets."""

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

GAEZ_CATALOG = {
    "dataset": "FAO Global Agro-Ecological Zoning",
    "version": "GAEZ v5",
    "baseline_year": 2020,
    "platform_url": "https://data.apps.fao.org/gaez/?lang=en",
    "fao_reference": "https://www.fao.org/gaez/en/",
    "indicators": [
        {
            "id": "length_of_growing_period",
            "name": "Length of Growing Period",
            "unit": "days",
            "status": "regional_data_access_not_implemented",
            "numeric_values_available": False,
            "requires_location": True,
        },
        {
            "id": "agro_ecological_suitability",
            "name": "Agro-ecological crop suitability",
            "unit": None,
            "status": "regional_data_access_not_implemented",
            "numeric_values_available": False,
            "requires_location": True,
        },
        {
            "id": "bimodal_rainfall_seasons",
            "name": "Regional rainfall-season profile",
            "unit": None,
            "status": "regional_data_access_not_implemented",
            "numeric_values_available": False,
            "requires_location": True,
        },
    ],
    "climate_inputs": {
        "historical_source": "AgERA5",
        "baseline_periods": ["1981-2000", "2001-2020"],
        "projection_source": "CMIP6 via ISIMIP3b",
        "projection_periods": ["2021-2040", "2041-2060", "2061-2080", "2081-2100"],
    },
}
