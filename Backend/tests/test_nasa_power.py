from datetime import date
import unittest
from unittest.mock import Mock, patch

from fastapi import HTTPException

from app.api.v1.endpoints.nasa_power import get_daily_climate_data
from app.schemas.nasa_power import NasaPowerDailyResponse
from app.services.nasa import nasa_power


START_DATE = date(2024, 1, 1)
END_DATE = date(2024, 1, 2)


def make_power_payload() -> dict:
    parameter_values = {
        "T2M": {"20240101": 21.5, "20240102": -999.0},
        "T2M_MAX": {"20240101": 28.0, "20240102": 29.0},
        "T2M_MIN": {"20240101": 16.0, "20240102": 17.0},
        "PRECTOTCORR": {"20240101": 0.0, "20240102": 1.2},
        "RH2M": {"20240101": 65.0, "20240102": 70.0},
        "WS2M": {"20240101": 2.0, "20240102": 2.5},
        "ALLSKY_SFC_SW_DWN": {"20240101": 18.0, "20240102": 19.0},
    }
    units = {
        "T2M": "C",
        "T2M_MAX": "C",
        "T2M_MIN": "C",
        "PRECTOTCORR": "mm/day",
        "RH2M": "%",
        "WS2M": "m/s",
        "ALLSKY_SFC_SW_DWN": "MJ/m^2/day",
    }
    return {
        "geometry": {"coordinates": [-1.6, 6.7, 220.0]},
        "properties": {"parameter": parameter_values},
        "header": {"fill_value": -999.0},
        "parameters": {
            code: {"units": unit} for code, unit in units.items()
        },
    }


class TestNasaPowerService(unittest.TestCase):
    @patch("app.services.nasa.nasa_power.requests.get")
    def test_requests_requested_coordinates_dates_and_seven_parameters(
        self, get: Mock
    ) -> None:
        response = Mock()
        response.json.return_value = make_power_payload()
        get.return_value = response

        result = nasa_power.fetch_daily_climate_data(
            latitude=12.3456,
            longitude=-45.6789,
            start_date=START_DATE,
            end_date=END_DATE,
        )

        self.assertIsInstance(result, NasaPowerDailyResponse)
        self.assertEqual(len(result.daily), 2)
        self.assertEqual(result.daily[0].t2m_c, 21.5)
        self.assertIsNone(result.daily[1].t2m_c)
        self.assertEqual(result.units["PRECTOTCORR"], "mm/day")
        request = get.call_args
        self.assertEqual(
            request.args[0],
            nasa_power.NASA_POWER_DAILY_URL,
        )
        self.assertEqual(
            request.kwargs["params"],
            {
                "parameters": "T2M,T2M_MAX,T2M_MIN,PRECTOTCORR,RH2M,WS2M,ALLSKY_SFC_SW_DWN",
                "community": "AG",
                "longitude": -45.6789,
                "latitude": 12.3456,
                "start": "20240101",
                "end": "20240102",
                "format": "JSON",
                "time-standard": "UTC",
            },
        )

    def test_rejects_reversed_date_range(self) -> None:
        with self.assertRaisesRegex(ValueError, "start_date"):
            nasa_power.fetch_daily_climate_data(
                latitude=0,
                longitude=0,
                start_date=END_DATE,
                end_date=START_DATE,
            )

    @patch("app.services.nasa.nasa_power.requests.get")
    def test_translates_timeout(self, get: Mock) -> None:
        import requests

        get.side_effect = requests.Timeout()
        with self.assertRaises(nasa_power.NasaPowerTimeoutError):
            nasa_power.fetch_daily_climate_data(
                0, 0, START_DATE, END_DATE
            )

    @patch("app.services.nasa.nasa_power.requests.get")
    def test_rejects_malformed_response(self, get: Mock) -> None:
        response = Mock()
        response.json.return_value = {"properties": {}}
        get.return_value = response
        with self.assertRaises(nasa_power.NasaPowerResponseError):
            nasa_power.fetch_daily_climate_data(
                0, 0, START_DATE, END_DATE
            )

    @patch("app.api.v1.endpoints.nasa_power.fetch_daily_climate_data")
    def test_endpoint_maps_upstream_errors_to_gateway_responses(
        self, fetch: Mock
    ) -> None:
        fetch.side_effect = nasa_power.NasaPowerResponseError("upstream error")
        with self.assertRaises(HTTPException) as raised:
            get_daily_climate_data(0, 0, START_DATE, END_DATE)
        self.assertEqual(raised.exception.status_code, 502)

        fetch.side_effect = nasa_power.NasaPowerTimeoutError("timeout")
        with self.assertRaises(HTTPException) as raised:
            get_daily_climate_data(0, 0, START_DATE, END_DATE)
        self.assertEqual(raised.exception.status_code, 504)
