import unittest

from pydantic import ValidationError

from main import FieldObservation, build_assessment


def observation(**overrides):
    values = {
        "field_id": "field-17",
        "crop": "maize",
        "growth_stage": "flowering",
        "land_surface_temp_c": 36,
        "esi": 0.72,
        "precipitation_mm": 12,
        "water_demand_mm": 18,
        "period_days": 7,
        "heat_shock_threshold_c": 36,
        "baseline_lst_c": 33,
        "thermal_tolerance_c": 2,
    }
    values.update(overrides)
    return FieldObservation(**values)


class EcostressAssessmentTests(unittest.TestCase):
    def test_builds_crop_warnings_and_water_balance(self):
        result = build_assessment(observation())

        self.assertEqual(result.heat_shock.status, "warning")
        self.assertEqual(result.canopy_thermal_resilience.status, "outside_tolerance")
        self.assertEqual(result.canopy_thermal_resilience.temperature_delta_c, 3)
        self.assertEqual(result.water_deficit_balance.status, "deficit")
        self.assertEqual(result.water_deficit_balance.deficit_mm, 6)
        self.assertEqual(result.esi, 0.72)

    def test_skips_crop_specific_assessments_without_thresholds(self):
        result = build_assessment(
            observation(
                heat_shock_threshold_c=None,
                baseline_lst_c=None,
                thermal_tolerance_c=None,
            )
        )

        self.assertEqual(result.heat_shock.status, "threshold_required")
        self.assertEqual(result.canopy_thermal_resilience.status, "not_assessed")

    def test_balanced_water_period_has_no_deficit_or_surplus(self):
        result = build_assessment(
            observation(precipitation_mm=18, water_demand_mm=18)
        )

        self.assertEqual(result.water_deficit_balance.status, "balanced_or_surplus")
        self.assertEqual(result.water_deficit_balance.deficit_mm, 0)
        self.assertEqual(result.water_deficit_balance.surplus_mm, 0)

    def test_rejects_esi_outside_documented_range(self):
        with self.assertRaises(ValidationError):
            observation(esi=1.1)


if __name__ == "__main__":
    unittest.main()
