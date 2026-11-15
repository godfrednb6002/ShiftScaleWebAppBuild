import unittest
from unittest.mock import Mock, patch

from fastapi import HTTPException

from app.api.v1.endpoints.weather import get_weather_forecast
from app.schemas.weather import WeatherForecastResponse
from app.services import open_meteo


def make_forecast_payload() -> dict:
    return {
        "timezone": "Africa/Accra",
        "daily_units": {
            "time": "iso8601",
            "temperature_2m_max": "°C",
            "temperature_2m_min": "°C",
            "precipitation_sum": "mm",
            "wind_speed_10m_max": "km/h",
            "weather_code": "wmo code",
        },
        "daily": {
            "time": ["2026-11-16", "2026-11-17"],
            "temperature_2m_max": [31.2, 30.5],
            "temperature_2m_min": [22.1, 21.8],
            "precipitation_sum": [2.4, 0.0],
            "wind_speed_10m_max": [14.0, 12.5],
            "weather_code": [61, 3],
        },
    }


class TestOpenMeteoService(unittest.TestCase):
    @patch("app.services.open_meteo.requests.get")
    def test_requests_daily_forecast_and_parses_units(self, get: Mock) -> None:
        response = Mock()
        response.json.return_value = make_forecast_payload()
        get.return_value = response

        result = open_meteo.fetch_weather_forecast(6.7, -1.6)

        self.assertIsInstance(result, WeatherForecastResponse)
        self.assertEqual(len(result.daily), 2)
        self.assertEqual(result.daily[0].temperature_max_c, 31.2)
        self.assertEqual(result.daily[0].precipitation_mm, 2.4)
        self.assertEqual(result.daily[1].weather_code, 3)
        self.assertEqual(result.timezone, "Africa/Accra")
        self.assertEqual(
            get.call_args.kwargs["params"],
            {
                "latitude": 6.7,
                "longitude": -1.6,
                "daily": "temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max,weather_code",
                "forecast_days": 7,
                "timezone": "auto",
                "temperature_unit": "celsius",
                "wind_speed_unit": "kmh",
                "precipitation_unit": "mm",
            },
        )

    def test_rejects_forecast_day_count_outside_range(self) -> None:
        with self.assertRaisesRegex(ValueError, "forecast_days"):
            open_meteo.fetch_weather_forecast(0, 0, forecast_days=17)

    @patch("app.services.open_meteo.requests.get")
    def test_translates_timeout(self, get: Mock) -> None:
        import requests

        get.side_effect = requests.Timeout()
        with self.assertRaises(open_meteo.OpenMeteoTimeoutError):
            open_meteo.fetch_weather_forecast(0, 0)

    @patch("app.services.open_meteo.requests.get")
    def test_rejects_malformed_daily_arrays(self, get: Mock) -> None:
        response = Mock()
        payload = make_forecast_payload()
        payload["daily"]["precipitation_sum"] = [2.4]
        response.json.return_value = payload
        get.return_value = response

        with self.assertRaisesRegex(open_meteo.OpenMeteoResponseError, "precipitation_sum"):
            open_meteo.fetch_weather_forecast(0, 0)

    @patch("app.api.v1.endpoints.weather.fetch_weather_forecast")
    def test_endpoint_maps_upstream_errors(self, fetch: Mock) -> None:
        fetch.side_effect = open_meteo.OpenMeteoResponseError("upstream error")
        with self.assertRaises(HTTPException) as raised:
            get_weather_forecast(0, 0, 7)
        self.assertEqual(raised.exception.status_code, 502)

        fetch.side_effect = open_meteo.OpenMeteoTimeoutError("timeout")
        with self.assertRaises(HTTPException) as raised:
            get_weather_forecast(0, 0, 7)
        self.assertEqual(raised.exception.status_code, 504)


if __name__ == "__main__":
    unittest.main()
