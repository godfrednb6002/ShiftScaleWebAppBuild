"""Schemas for NASA ECOSTRESS assessments."""
from typing import Literal
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field


class FieldObservation(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, allow_inf_nan=False)

    field_id: str = Field(min_length=1, description="Client-assigned field identifier")
    crop: str = Field(min_length=1, description="Crop name")
    growth_stage: str = Field(
        min_length=1,
        description="Crop stage; use 'flowering' to enable the flowering heat warning",
    )
    land_surface_temp_c: float = Field(description="ECOSTRESS land-surface temperature in Celsius")
    esi: float = Field(ge=0, le=1, description="Caller-provided ESI value on a 0-1 scale")
    precipitation_mm: float = Field(ge=0, description="Precipitation over the observation period")
    water_demand_mm: float = Field(ge=0, description="Water demand over the same period")
    period_days: int = Field(gt=0, description="Length of the observation period")
    heat_shock_threshold_c: float | None = Field(
        default=None,
        description="Crop-specific LST warning threshold; required for a flowering assessment",
    )
    baseline_lst_c: float | None = Field(
        default=None,
        description="Reference LST for the same field/crop stage",
    )
    thermal_tolerance_c: float | None = Field(
        default=None,
        ge=0,
        description="Allowed absolute LST difference from the supplied baseline",
    )


class CatalogResponse(BaseModel):
    dataset: str
    platform: str
    inputs: list[str]
    outputs: list[str]
    use_cases: list[str]
    limitations: list[str]


class HeatShockResult(BaseModel):
    status: Literal["warning", "no_warning", "not_applicable", "threshold_required"]
    threshold_c: float | None
    message: str


class ThermalResilienceResult(BaseModel):
    status: Literal["within_tolerance", "outside_tolerance", "not_assessed"]
    baseline_lst_c: float | None
    temperature_delta_c: float | None
    tolerance_c: float | None


class WaterBalanceResult(BaseModel):
    status: Literal["deficit", "balanced_or_surplus"]
    precipitation_mm: float
    water_demand_mm: float
    deficit_mm: float
    surplus_mm: float


class AssessmentResponse(BaseModel):
    assessment_id: UUID
    field_id: str
    crop: str
    growth_stage: str
    period_days: int
    land_surface_temp_c: float
    esi: float
    heat_shock: HeatShockResult
    canopy_thermal_resilience: ThermalResilienceResult
    water_deficit_balance: WaterBalanceResult
