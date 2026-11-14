from datetime import date, datetime
import logging
import math
from typing import Any

import requests

from app.schemas.nasa_power import DailyClimateRecord, NasaPowerDailyResponse

logger = logging.getLogger(__name__)

NASA_POWER_DAILY_URL = "https://power.larc.nasa.gov/api/temporal/daily/point"
NASA_POWER_PARAMETERS = {
    "T2M": "t2m_c",
    "T2M_MAX": "t2m_max_c",
    "T2M_MIN": "t2m_min_c",
    "PRECTOTCORR": "precipitation_mm_day",
    "RH2M": "relative_humidity_pct",
    "WS2M": "wind_speed_m_s",
    "ALLSKY_SFC_SW_DWN": "allsky_sfc_sw_down_mj_m2_day",
}


class NasaPowerError(Exception):
    """Base error for NASA POWER request and response failures."""


class NasaPowerTimeoutError(NasaPowerError):
    """NASA POWER did not respond before the request timeout."""


class NasaPowerResponseError(NasaPowerError):
    """NASA POWER returned an unsuccessful or malformed response."""


def _parse_daily_response(
    payload: Any,
    requested_latitude: float,
    requested_longitude: float,
    start_date: date,
    end_date: date,
) -> NasaPowerDailyResponse:
    if not isinstance(payload, dict):
        raise NasaPowerResponseError("NASA POWER response must be a JSON object.")

    try:
        properties = payload["properties"]
        parameter_data = properties["parameter"]
        parameter_metadata = payload["parameters"]
        header = payload["header"]
        fill_value = header["fill_value"]
    except (KeyError, TypeError) as error:
        raise NasaPowerResponseError(
            "NASA POWER response is missing required fields."
        ) from error

    if not isinstance(parameter_data, dict) or not all(
        isinstance(parameter_data.get(code), dict) for code in NASA_POWER_PARAMETERS
    ):
        raise NasaPowerResponseError(
            "NASA POWER response is missing one or more requested climate parameters."
        )

    if not isinstance(parameter_metadata, dict):
        raise NasaPowerResponseError("NASA POWER parameter metadata is malformed.")
    units: dict[str, str] = {}
    for code in NASA_POWER_PARAMETERS:
        metadata = parameter_metadata.get(code)
        if not isinstance(metadata, dict) or not isinstance(metadata.get("units"), str):
            raise NasaPowerResponseError(
                f"NASA POWER response is missing units for {code}."
            )
        units[code] = metadata["units"]

    dates: set[date] = set()
    for code in NASA_POWER_PARAMETERS:
        for date_key in parameter_data[code]:
            try:
                observation_date = datetime.strptime(date_key, "%Y%m%d").date()
            except (TypeError, ValueError) as error:
                raise NasaPowerResponseError(
                    "NASA POWER returned an invalid observation date."
                ) from error
            if start_date <= observation_date <= end_date:
                dates.add(observation_date)

    records: list[DailyClimateRecord] = []
    try:
        for observation_date in sorted(dates):
            date_key = observation_date.strftime("%Y%m%d")
            values: dict[str, Any] = {"date": observation_date}
            for parameter, field in NASA_POWER_PARAMETERS.items():
                raw_value = parameter_data[parameter].get(date_key)
                if raw_value is None or raw_value == fill_value:
                    values[field] = None
                    continue
                if isinstance(raw_value, bool) or not isinstance(raw_value, (int, float)):
                    raise NasaPowerResponseError(
                        f"NASA POWER returned a non-numeric value for {parameter}."
                    )
                numeric_value = float(raw_value)
                if not math.isfinite(numeric_value):
                    raise NasaPowerResponseError(
                        f"NASA POWER returned a non-finite value for {parameter}."
                    )
                values[field] = numeric_value
            records.append(DailyClimateRecord.model_validate(values))
    except (KeyError, TypeError, ValueError) as error:
        raise NasaPowerResponseError(
            "NASA POWER response contains invalid daily observations."
        ) from error

    elevation: float | None = None
    try:
        coordinates = payload["geometry"]["coordinates"]
        if len(coordinates) >= 3 and coordinates[2] is not None:
            elevation = float(coordinates[2])
    except (KeyError, TypeError, ValueError, IndexError):
        logger.warning("NASA POWER response did not include a valid elevation.")

    return NasaPowerDailyResponse(
        latitude=requested_latitude,
        longitude=requested_longitude,
        elevation_m=elevation,
        start_date=start_date,
        end_date=end_date,
        units=units,
        daily=records,
    )


def fetch_daily_climate_data(
    latitude: float,
    longitude: float,
    start_date: date,
    end_date: date,
    timeout: float = 30,
) -> NasaPowerDailyResponse:
    """Fetch and validate daily agricultural climate data from NASA POWER."""
    if start_date > end_date:
        raise ValueError("start_date must be on or before end_date.")

    params = {
        "parameters": ",".join(NASA_POWER_PARAMETERS),
        "community": "AG",
        "longitude": longitude,
        "latitude": latitude,
        "start": start_date.strftime("%Y%m%d"),
        "end": end_date.strftime("%Y%m%d"),
        "format": "JSON",
        "time-standard": "UTC",
    }

    try:
        response = requests.get(NASA_POWER_DAILY_URL, params=params, timeout=timeout)
        response.raise_for_status()
    except requests.Timeout as error:
        raise NasaPowerTimeoutError("NASA POWER request timed out.") from error
    except requests.RequestException as error:
        status = error.response.status_code if error.response is not None else "unavailable"
        logger.warning("NASA POWER request failed (HTTP %s).", status)
        raise NasaPowerResponseError(
            f"NASA POWER request failed (HTTP {status})."
        ) from error

    try:
        payload = response.json()
    except ValueError as error:
        raise NasaPowerResponseError("NASA POWER returned invalid JSON.") from error

    return _parse_daily_response(
        payload, latitude, longitude, start_date, end_date
    )
