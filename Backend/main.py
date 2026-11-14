
import os
from typing import Literal
from uuid import UUID, uuid4

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict, Field

load_dotenv()

app = FastAPI(title="ShiftScale API", version="0.2.0")

origins = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in origins],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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


def build_assessment(observation: FieldObservation) -> AssessmentResponse:
    is_flowering = observation.growth_stage.casefold() == "flowering"

    if not is_flowering:
        heat_shock = HeatShockResult(
            status="not_applicable",
            threshold_c=observation.heat_shock_threshold_c,
            message="Flowering heat-shock warning is only evaluated during flowering.",
        )
    elif observation.heat_shock_threshold_c is None:
        heat_shock = HeatShockResult(
            status="threshold_required",
            threshold_c=None,
            message="Supply a crop-specific heat_shock_threshold_c to evaluate flowering heat shock.",
        )
    elif observation.land_surface_temp_c >= observation.heat_shock_threshold_c:
        heat_shock = HeatShockResult(
            status="warning",
            threshold_c=observation.heat_shock_threshold_c,
            message="Land-surface temperature is at or above the supplied flowering threshold.",
        )
    else:
        heat_shock = HeatShockResult(
            status="no_warning",
            threshold_c=observation.heat_shock_threshold_c,
            message="Land-surface temperature is below the supplied flowering threshold.",
        )

    if (
        observation.baseline_lst_c is None
        or observation.thermal_tolerance_c is None
    ):
        thermal_resilience = ThermalResilienceResult(
            status="not_assessed",
            baseline_lst_c=observation.baseline_lst_c,
            temperature_delta_c=None,
            tolerance_c=observation.thermal_tolerance_c,
        )
    else:
        temperature_delta = observation.land_surface_temp_c - observation.baseline_lst_c
        thermal_resilience = ThermalResilienceResult(
            status=(
                "within_tolerance"
                if abs(temperature_delta) <= observation.thermal_tolerance_c
                else "outside_tolerance"
            ),
            baseline_lst_c=observation.baseline_lst_c,
            temperature_delta_c=round(temperature_delta, 2),
            tolerance_c=observation.thermal_tolerance_c,
        )

    balance = observation.precipitation_mm - observation.water_demand_mm
    water_balance = WaterBalanceResult(
        status="deficit" if balance < 0 else "balanced_or_surplus",
        precipitation_mm=observation.precipitation_mm,
        water_demand_mm=observation.water_demand_mm,
        deficit_mm=round(max(0, -balance), 2),
        surplus_mm=round(max(0, balance), 2),
    )

    return AssessmentResponse(
        assessment_id=uuid4(),
        field_id=observation.field_id,
        crop=observation.crop,
        growth_stage=observation.growth_stage,
        period_days=observation.period_days,
        land_surface_temp_c=observation.land_surface_temp_c,
        esi=observation.esi,
        heat_shock=heat_shock,
        canopy_thermal_resilience=thermal_resilience,
        water_deficit_balance=water_balance,
    )


@app.get("/")
def read_root():
    return {"message": "ShiftScale Backend is running!", "status": "healthy"}


@app.get("/api/health")
def health_check():
    return {"status": "ok"}


@app.get("/api/catalog/ecostress", response_model=CatalogResponse)
def get_ecostress_catalog():
    return CatalogResponse(
        dataset="NASA ECOSTRESS L2_LSTE",
        platform="Thermal infrared instrument on the International Space Station",
        inputs=[
            "ECOSTRESS land-surface temperature (LST)",
            "Caller-provided Evaporative Stress Index (ESI, 0-1)",
            "Precipitation and water demand for a matching period",
        ],
        outputs=[
            "Land-surface temperature in Celsius",
            "Evaporative Stress Index (reported as supplied)",
            "Flowering heat-shock warning",
            "Canopy thermal resilience relative to a supplied baseline/tolerance",
            "Water deficit or surplus balance",
        ],
        use_cases=[
            "Crop flowering heat-shock warnings",
            "Canopy thermal resilience",
            "Water deficit balance",
        ],
        limitations=[
            "This local API does not fetch NASA, weather, or precipitation data.",
            "ESI is returned as supplied; it is not derived from LST or precipitation.",
            "Heat-shock thresholds and thermal baselines are crop/field-specific and must be supplied by the caller.",
            "Water balance is precipitation minus water demand over the same period; it does not model irrigation, runoff, or soil storage.",
        ],
    )


@app.post("/api/assessments/ecostress", response_model=AssessmentResponse)
def create_ecostress_assessment(observation: FieldObservation):
    return build_assessment(observation)
from app.main import app

__all__ = ["app"]