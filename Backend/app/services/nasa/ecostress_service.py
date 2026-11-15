"""Business logic and assessment builder for NASA ECOSTRESS."""
from uuid import uuid4
from app.schemas.ecostress import (
    AssessmentResponse,
    CatalogResponse,
    FieldObservation,
    HeatShockResult,
    ThermalResilienceResult,
    WaterBalanceResult,
)

ECOSTRESS_CATALOG = CatalogResponse(
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
