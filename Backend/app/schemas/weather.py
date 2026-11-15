from datetime import date

from pydantic import BaseModel, Field


class DailyWeatherForecast(BaseModel):
    date: date
    temperature_max_c: float | None
    temperature_min_c: float | None
    precipitation_mm: float | None = Field(default=None, ge=0)
    wind_speed_max_kmh: float | None = Field(default=None, ge=0)
    weather_code: int | None = None


class WeatherForecastResponse(BaseModel):
    latitude: float
    longitude: float
    timezone: str
    units: dict[str, str]
    daily: list[DailyWeatherForecast]
