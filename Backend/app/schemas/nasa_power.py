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
