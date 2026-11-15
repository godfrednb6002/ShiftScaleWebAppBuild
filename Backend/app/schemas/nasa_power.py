from datetime import date

from pydantic import BaseModel


class DailyClimateRecord(BaseModel):
    date: date
    t2m_c: float | None
    t2m_max_c: float | None
    t2m_min_c: float | None
    precipitation_mm_day: float | None
    relative_humidity_pct: float | None
    wind_speed_m_s: float | None
    allsky_sfc_sw_down_mj_m2_day: float | None


class NasaPowerDailyResponse(BaseModel):
    latitude: float
    longitude: float
    elevation_m: float | None
    start_date: date
    end_date: date
    units: dict[str, str]
    daily: list[DailyClimateRecord]


class MonthlyClimateProfile(BaseModel):
    month: str
    precipitation: float | None
    hot_days: float | None


class AnnualClimateProfile(BaseModel):
    year: int
    precipitation: float | None
    temperature: float | None
    hot_days: int | None


class NasaPowerClimateProfile(BaseModel):
    latitude: float
    longitude: float
    start_date: date
    end_date: date
    monthly: list[MonthlyClimateProfile]
    annual: list[AnnualClimateProfile]
    mean_annual_rainfall: float | None
    mean_annual_hot_days: float | None
    annual_rainfall_variability: float | None
