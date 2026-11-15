from datetime import date
import unittest
from unittest.mock import Mock, patch

from fastapi import HTTPException
from fastapi.testclient import TestClient

from app.main import create_application
from app.api.v1.endpoints.nasa_power import (
    get_climate_profile,
    get_daily_climate_data,
)
from app.schemas.nasa_power import (
    DailyClimateRecord,
    NasaPowerDailyResponse,
)
from app.services.nasa import nasa_power
from app.services.nasa.power_analytics import build_climate_profile


START_DATE = date(2024, 1, 1)
END_DATE = date(2024, 1, 2)
PROFILE_START_DATE = date(2023, 1, 1)
PROFILE_END_DATE = date(2024, 2, 1)


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


class TestNasaPowerClimateProfile(unittest.TestCase):
    def setUp(self) -> None:
        self.response = NasaPowerDailyResponse(
            latitude=6.7,
            longitude=-1.6,
            elevation_m=220,
            start_date=date(2023, 1, 1),
            end_date=date(2024, 2, 1),
            units={},
            daily=[
                DailyClimateRecord(
                    date=date(2023, 1, 1),
                    t2m_c=20,
                    t2m_max_c=32,
                    t2m_min_c=15,
                    precipitation_mm_day=1,
                    relative_humidity_pct=60,
                    wind_speed_m_s=2,
                    allsky_sfc_sw_down_mj_m2_day=18,
                ),
                DailyClimateRecord(
                    date=date(2023, 1, 2),
                    t2m_c=22,
                    t2m_max_c=29,
                    t2m_min_c=16,
                    precipitation_mm_day=2,
                    relative_humidity_pct=62,
                    wind_speed_m_s=2,
                    allsky_sfc_sw_down_mj_m2_day=19,
                ),
                DailyClimateRecord(
                    date=date(2023, 2, 1),
                    t2m_c=24,
                    t2m_max_c=31,
                    t2m_min_c=17,
                    precipitation_mm_day=4,
                    relative_humidity_pct=64,
                    wind_speed_m_s=3,
                    allsky_sfc_sw_down_mj_m2_day=20,
                ),
                DailyClimateRecord(
                    date=date(2024, 1, 1),
                    t2m_c=26,
                    t2m_max_c=31,
                    t2m_min_c=18,
                    precipitation_mm_day=3,
                    relative_humidity_pct=66,
                    wind_speed_m_s=3,
                    allsky_sfc_sw_down_mj_m2_day=21,
                ),
                DailyClimateRecord(
                    date=date(2024, 2, 1),
                    t2m_c=28,
                    t2m_max_c=29,
                    t2m_min_c=19,
                    precipitation_mm_day=None,
                    relative_humidity_pct=68,
                    wind_speed_m_s=4,
                    allsky_sfc_sw_down_mj_m2_day=22,
                ),
            ],
        )

    def test_builds_monthly_and_annual_observed_summaries(self) -> None:
        profile = build_climate_profile(self.response)

        self.assertEqual(profile.monthly[0].month, "Jan")
        self.assertEqual(profile.monthly[0].precipitation, 3)
        self.assertEqual(profile.monthly[0].hot_days, 1)
        self.assertEqual(profile.monthly[1].precipitation, 4)
        self.assertEqual(profile.monthly[1].hot_days, 0.5)
        self.assertEqual(profile.annual[0].precipitation, 7)
        self.assertEqual(profile.annual[0].temperature, 22)
        self.assertEqual(profile.annual[0].hot_days, 2)
        self.assertEqual(profile.mean_annual_rainfall, 5)
        self.assertEqual(profile.mean_annual_hot_days, 1.5)
        self.assertAlmostEqual(profile.annual_rainfall_variability, 0.4)

    @patch("app.api.v1.endpoints.nasa_power.fetch_daily_climate_data")
    def test_endpoint_aggregates_daily_data(self, fetch: Mock) -> None:
        fetch.return_value = self.response

        profile = get_climate_profile(
            6.7, -1.6, PROFILE_START_DATE, PROFILE_END_DATE
        )

        self.assertEqual(profile.latitude, 6.7)
        self.assertEqual(len(profile.monthly), 12)
        self.assertEqual(len(profile.annual), 2)
        fetch.assert_called_once_with(
            latitude=6.7,
            longitude=-1.6,
            start_date=PROFILE_START_DATE,
            end_date=PROFILE_END_DATE,
        )

    def test_endpoint_rejects_reversed_date_range(self) -> None:
        with self.assertRaises(HTTPException) as raised:
            get_climate_profile(0, 0, END_DATE, START_DATE)
        self.assertEqual(raised.exception.status_code, 422)

    @patch("app.api.v1.endpoints.nasa_power.fetch_daily_climate_data")
    def test_endpoint_maps_upstream_failure(self, fetch: Mock) -> None:
        fetch.side_effect = nasa_power.NasaPowerResponseError("upstream error")

        with self.assertRaises(HTTPException) as raised:
            get_climate_profile(0, 0, PROFILE_START_DATE, PROFILE_END_DATE)
        self.assertEqual(raised.exception.status_code, 502)

    @patch("app.api.v1.endpoints.nasa_power.fetch_daily_climate_data")
    def test_http_route_returns_compact_profile(self, fetch: Mock) -> None:
        fetch.return_value = self.response
        client = TestClient(create_application())

        result = client.get(
            "/api/v1/nasa/power/climate-profile",
            params={
                "latitude": 6.7,
                "longitude": -1.6,
                "start_date": PROFILE_START_DATE.isoformat(),
                "end_date": PROFILE_END_DATE.isoformat(),
            },
        )

        self.assertEqual(result.status_code, 200)
        payload = result.json()
        self.assertEqual(len(payload["monthly"]), 12)
        self.assertEqual(payload["annual"][0]["year"], 2023)
        self.assertEqual(payload["mean_annual_rainfall"], 5)
