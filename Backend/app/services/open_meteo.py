from datetime import date
import logging
import math
from typing import Any

import requests

from app.schemas.weather import DailyWeatherForecast, WeatherForecastResponse

logger = logging.getLogger(__name__)

OPEN_METEO_FORECAST_URL = "https://api.open-meteo.com/v1/forecast"
FORECAST_PARAMETERS = {
    "temperature_2m_max": "temperature_max_c",
    "temperature_2m_min": "temperature_min_c",
    "precipitation_sum": "precipitation_mm",
    "wind_speed_10m_max": "wind_speed_max_kmh",
    "weather_code": "weather_code",
}


class OpenMeteoError(Exception):
    """Base error for Open-Meteo forecast requests and responses."""


class OpenMeteoTimeoutError(OpenMeteoError):
    """Open-Meteo did not respond before the request timeout."""


class OpenMeteoResponseError(OpenMeteoError):
    """Open-Meteo returned an unsuccessful or malformed response."""


def _parse_number(value: Any, parameter: str) -> float | None:
    if value is None:
        return None
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise OpenMeteoResponseError(
            f"Open-Meteo returned a non-numeric value for {parameter}."
        )
    parsed = float(value)
    if not math.isfinite(parsed):
        raise OpenMeteoResponseError(
            f"Open-Meteo returned a non-finite value for {parameter}."
        )
    return parsed


def _parse_forecast_response(
    payload: Any,
    requested_latitude: float,
    requested_longitude: float,
) -> WeatherForecastResponse:
    if not isinstance(payload, dict):
        raise OpenMeteoResponseError("Open-Meteo response must be a JSON object.")

    daily = payload.get("daily")
    units_payload = payload.get("daily_units")
    timezone = payload.get("timezone")
    if not isinstance(daily, dict) or not isinstance(units_payload, dict):
        raise OpenMeteoResponseError("Open-Meteo response is missing daily data.")
    if not isinstance(timezone, str):
        raise OpenMeteoResponseError("Open-Meteo response is missing its timezone.")

    dates = daily.get("time")
    if not isinstance(dates, list) or not all(isinstance(item, str) for item in dates):
        raise OpenMeteoResponseError("Open-Meteo returned invalid forecast dates.")

    for parameter in FORECAST_PARAMETERS:
        values = daily.get(parameter)
        if not isinstance(values, list) or len(values) != len(dates):
            raise OpenMeteoResponseError(
                f"Open-Meteo forecast values for {parameter} are malformed."
            )

    units: dict[str, str] = {}
    for parameter in FORECAST_PARAMETERS:
        unit = units_payload.get(parameter)
        if not isinstance(unit, str):
            raise OpenMeteoResponseError(
                f"Open-Meteo response is missing units for {parameter}."
            )
        units[parameter] = unit

    records: list[DailyWeatherForecast] = []
    try:
        for index, forecast_date in enumerate(dates):
            record_date = date.fromisoformat(forecast_date)
            values = {
                field: _parse_number(daily[parameter][index], parameter)
                for parameter, field in FORECAST_PARAMETERS.items()
            }
            weather_code = values.pop("weather_code")
            if weather_code is not None and not weather_code.is_integer():
                raise OpenMeteoResponseError(
                    "Open-Meteo returned an invalid weather code."
                )
            records.append(
                DailyWeatherForecast(
                    date=record_date,
                    weather_code=int(weather_code) if weather_code is not None else None,
                    **values,
                )
            )
    except ValueError as error:
        raise OpenMeteoResponseError(
            "Open-Meteo returned an invalid forecast date."
        ) from error

    return WeatherForecastResponse(
        latitude=requested_latitude,
        longitude=requested_longitude,
        timezone=timezone,
        units=units,
        daily=records,
    )


def fetch_weather_forecast(
    latitude: float,
    longitude: float,
    forecast_days: int = 7,
    timeout: float = 20,
) -> WeatherForecastResponse:
    """Fetch daily weather forecasts from Open-Meteo."""
    if not 1 <= forecast_days <= 16:
        raise ValueError("forecast_days must be between 1 and 16.")

    params = {
        "latitude": latitude,
        "longitude": longitude,
        "daily": ",".join(FORECAST_PARAMETERS),
        "forecast_days": forecast_days,
        "timezone": "auto",
        "temperature_unit": "celsius",
        "wind_speed_unit": "kmh",
        "precipitation_unit": "mm",
    }

    try:
        response = requests.get(OPEN_METEO_FORECAST_URL, params=params, timeout=timeout)
        response.raise_for_status()
    except requests.Timeout as error:
        raise OpenMeteoTimeoutError("Open-Meteo forecast request timed out.") from error
    except requests.RequestException as error:
        status = error.response.status_code if error.response is not None else "unavailable"
        logger.warning("Open-Meteo request failed (HTTP %s).", status)
        raise OpenMeteoResponseError(
            f"Open-Meteo request failed (HTTP {status})."
        ) from error

    try:
        payload = response.json()
    except ValueError as error:
        raise OpenMeteoResponseError("Open-Meteo returned invalid JSON.") from error

    return _parse_forecast_response(payload, latitude, longitude)
