from fastapi import APIRouter, HTTPException, Query

from app.schemas.weather import WeatherForecastResponse
from app.services.open_meteo import (
    OpenMeteoResponseError,
    OpenMeteoTimeoutError,
    fetch_weather_forecast,
)

router = APIRouter(tags=["Weather forecast"])


@router.get(
    "/forecast",
    response_model=WeatherForecastResponse,
    summary="Get a daily weather forecast",
)
def get_weather_forecast(
    latitude: float = Query(ge=-90, le=90),
    longitude: float = Query(ge=-180, le=180),
    forecast_days: int = Query(default=7, ge=1, le=16),
) -> WeatherForecastResponse:
    try:
        return fetch_weather_forecast(latitude, longitude, forecast_days)
    except OpenMeteoTimeoutError as error:
        raise HTTPException(status_code=504, detail=str(error)) from error
    except OpenMeteoResponseError as error:
        raise HTTPException(status_code=502, detail=str(error)) from error
