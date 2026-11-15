import math
from dataclasses import dataclass

from app.schemas.nasa_power import (
    AnnualClimateProfile,
    DailyClimateRecord,
    MonthlyClimateProfile,
    NasaPowerClimateProfile,
    NasaPowerDailyResponse,
)


@dataclass
class _ClimateBucket:
    precipitation: float = 0
    precipitation_days: int = 0
    temperature_total: float = 0
    temperature_days: int = 0
    hot_days: int = 0
    maximum_temperature_days: int = 0

    def add_record(self, record: DailyClimateRecord) -> None:
        if record.precipitation_mm_day is not None:
            self.precipitation += record.precipitation_mm_day
            self.precipitation_days += 1
        if record.t2m_c is not None:
            self.temperature_total += record.t2m_c
            self.temperature_days += 1
        if record.t2m_max_c is not None:
            self.maximum_temperature_days += 1
            if record.t2m_max_c > 30:
                self.hot_days += 1


def _average(values: list[float]) -> float | None:
    return sum(values) / len(values) if values else None


def build_climate_profile(
    response: NasaPowerDailyResponse,
) -> NasaPowerClimateProfile:
    monthly_by_year: dict[tuple[int, int], _ClimateBucket] = {}
    annual_buckets: dict[int, _ClimateBucket] = {}

    for record in response.daily:
        year = record.date.year
        month = record.date.month
        monthly_by_year.setdefault((year, month), _ClimateBucket()).add_record(record)
        annual_buckets.setdefault(year, _ClimateBucket()).add_record(record)

    monthly: list[MonthlyClimateProfile] = []
    for month in range(1, 13):
        buckets = [
            bucket
            for (_, bucket_month), bucket in monthly_by_year.items()
            if bucket_month == month
        ]
        monthly.append(
            MonthlyClimateProfile(
                month=response.start_date.replace(month=month, day=1).strftime("%b"),
                precipitation=_average(
                    [bucket.precipitation for bucket in buckets if bucket.precipitation_days]
                ),
                hot_days=_average(
                    [float(bucket.hot_days) for bucket in buckets if bucket.maximum_temperature_days]
                ),
            )
        )

    annual: list[AnnualClimateProfile] = []
    for year, bucket in sorted(annual_buckets.items()):
        annual.append(
            AnnualClimateProfile(
                year=year,
                precipitation=bucket.precipitation if bucket.precipitation_days else None,
                temperature=(
                    bucket.temperature_total / bucket.temperature_days
                    if bucket.temperature_days
                    else None
                ),
                hot_days=bucket.hot_days if bucket.maximum_temperature_days else None,
            )
        )

    annual_rainfall = [
        item.precipitation for item in annual if item.precipitation is not None
    ]
    mean_annual_rainfall = _average(annual_rainfall)
    if mean_annual_rainfall is None or mean_annual_rainfall == 0 or len(annual_rainfall) < 2:
        rainfall_variability = None
    else:
        variance = sum(
            (value - mean_annual_rainfall) ** 2 for value in annual_rainfall
        ) / len(annual_rainfall)
        rainfall_variability = math.sqrt(variance) / mean_annual_rainfall

    annual_hot_days = [
        float(item.hot_days) for item in annual if item.hot_days is not None
    ]

    return NasaPowerClimateProfile(
        latitude=response.latitude,
        longitude=response.longitude,
        start_date=response.start_date,
        end_date=response.end_date,
        monthly=monthly,
        annual=annual,
        mean_annual_rainfall=mean_annual_rainfall,
        mean_annual_hot_days=_average(annual_hot_days),
        annual_rainfall_variability=rainfall_variability,
    )
