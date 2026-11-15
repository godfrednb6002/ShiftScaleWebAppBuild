import json
import unittest
from unittest.mock import Mock, patch

from fastapi import HTTPException
from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.api.v1.endpoints.crop_rotation import post_crop_rotation_recommendation
from app.main import create_application
from app.schemas.crop_rotation import (
    CropRotationRecommendation,
    CropRotationRequest,
)
from app.services import gemini_rotation


def rotation_request() -> CropRotationRequest:
    return CropRotationRequest(
        selected_crops=["Maize", "Cowpea", "maize"],
        soil_type="Sandy loam",
        farming_system="Rain-fed",
        farm_region="Ashanti",
        farm_district="Ejura-Sekyedumase",
        farm_area_hectares=4.85,
    )


def recommendation_payload() -> dict:
    return {
        "title": "Cereal-legume rotation",
        "summary": "Alternate the selected cereal and legume crops.",
        "crop_sequence": [
            {
                "crop": "Maize",
                "crop_family": "Cereal",
                "start_month": 4,
                "end_month": 8,
                "duration_days": 120,
                "purpose": "Provide the main grain harvest.",
            },
            {
                "crop": "Cowpea",
                "crop_family": "Legume",
                "start_month": 9,
                "end_month": 11,
                "duration_days": 75,
                "purpose": "Add a legume phase and soil cover.",
            },
        ],
        "rationale": "The sequence alternates crop families.",
        "considerations": ["Plant with reliable rainfall."],
        "local_checks": ["Confirm local seed availability."],
    }


class TestGeminiRotationService(unittest.TestCase):
    @patch("app.services.gemini_rotation.requests.post")
    def test_sends_private_key_and_parses_structured_plan(self, post: Mock) -> None:
        response = Mock()
        response.json.return_value = {
            "candidates": [
                {"content": {"parts": [{"text": json.dumps(recommendation_payload())}]}}
            ]
        }
        post.return_value = response

        result = gemini_rotation.generate_rotation_recommendation(
            rotation_request(),
            api_key="test-key",
            model="gemini-test",
        )

        self.assertIsInstance(result, CropRotationRecommendation)
        self.assertEqual(len(result.crop_sequence), 2)
        self.assertEqual(result.crop_sequence[1].crop, "Cowpea")
        self.assertEqual(
            post.call_args.kwargs["headers"]["x-goog-api-key"],
            "test-key",
        )
        self.assertNotIn("key=", post.call_args.args[0])
        request_text = post.call_args.kwargs["json"]["contents"][0]["parts"][0]["text"]
        self.assertIn('"preferred_crops": ["Maize", "Cowpea"]', request_text)
        self.assertIn('"farm_area_hectares": 4.85', request_text)
        system_instruction = post.call_args.kwargs["json"]["systemInstruction"]["parts"][0]["text"]
        self.assertIn("simple everyday English", system_instruction)
        self.assertIn("short sentences", system_instruction)

    def test_requires_an_api_key(self) -> None:
        with self.assertRaisesRegex(
            gemini_rotation.GeminiRotationConfigurationError,
            "GEMINI_API_KEY",
        ):
            gemini_rotation.generate_rotation_recommendation(
                rotation_request(),
                api_key=None,
                model="gemini-test",
            )

    @patch("app.services.gemini_rotation.requests.post")
    def test_translates_timeout(self, post: Mock) -> None:
        import requests

        post.side_effect = requests.Timeout()
        with self.assertRaises(gemini_rotation.GeminiRotationTimeoutError):
            gemini_rotation.generate_rotation_recommendation(
                rotation_request(),
                api_key="test-key",
                model="gemini-test",
            )

    @patch("app.services.gemini_rotation.requests.post")
    def test_rejects_malformed_or_unrelated_plan(self, post: Mock) -> None:
        response = Mock()
        response.json.return_value = {
            "candidates": [{"content": {"parts": [{"text": "{not json"}]}}]
        }
        post.return_value = response
        with self.assertRaises(gemini_rotation.GeminiRotationResponseError):
            gemini_rotation.generate_rotation_recommendation(
                rotation_request(),
                api_key="test-key",
                model="gemini-test",
            )

        response.json.return_value = {
            "candidates": [
                {
                    "content": {
                        "parts": [
                            {
                                "text": json.dumps(
                                    {
                                        **recommendation_payload(),
                                        "crop_sequence": [
                                            {
                                                **recommendation_payload()["crop_sequence"][0],
                                                "crop": "Rice",
                                            },
                                            {
                                                **recommendation_payload()["crop_sequence"][1],
                                                "crop": "Sorghum",
                                            },
                                        ],
                                    }
                                )
                            }
                        ]
                    }
                }
            ]
        }
        with self.assertRaisesRegex(
            gemini_rotation.GeminiRotationResponseError,
            "selected crops",
        ):
            gemini_rotation.generate_rotation_recommendation(
                rotation_request(),
                api_key="test-key",
                model="gemini-test",
            )

    def test_rejects_identical_crops_in_rotation(self) -> None:
        plan = recommendation_payload()
        plan["crop_sequence"][1]["crop"] = "Maize"
        with self.assertRaises(ValidationError):
            CropRotationRecommendation.model_validate(plan)

    def test_endpoint_returns_service_configuration_error(self) -> None:
        with patch(
            "app.api.v1.endpoints.crop_rotation.settings.gemini_api_key",
            None,
        ):
            with self.assertRaises(HTTPException) as raised:
                post_crop_rotation_recommendation(rotation_request())
        self.assertEqual(raised.exception.status_code, 503)

    @patch("app.api.v1.endpoints.crop_rotation.generate_rotation_recommendation")
    def test_route_is_mounted_and_serializes_a_plan(self, generate: Mock) -> None:
        generate.return_value = CropRotationRecommendation.model_validate(
            recommendation_payload()
        )
        with (
            patch(
                "app.api.v1.endpoints.crop_rotation.settings.gemini_api_key",
                None,
            ),
            TestClient(create_application()) as client,
        ):
            response = client.post(
                "/api/v1/crop-rotation/recommendation",
                json={
                    "selected_crops": ["Maize", "Cowpea"],
                    "soil_type": "Sandy loam",
                    "farming_system": "Rain-fed",
                    "farm_region": "Ashanti",
                    "farm_district": "Ejura-Sekyedumase",
                    "farm_area_hectares": 4.85,
                },
            )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["crop_sequence"][0]["crop"], "Maize")

    def test_route_explains_when_gemini_key_is_missing(self) -> None:
        with (
            patch(
                "app.api.v1.endpoints.crop_rotation.settings.gemini_api_key",
                None,
            ),
            TestClient(create_application()) as client,
        ):
            response = client.post(
                "/api/v1/crop-rotation/recommendation",
                json=rotation_request().model_dump(),
            )

        self.assertEqual(response.status_code, 503)
        self.assertIn("GEMINI_API_KEY", response.json()["detail"])


if __name__ == "__main__":
    unittest.main()
