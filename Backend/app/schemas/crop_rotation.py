from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


CropName = Annotated[str, Field(min_length=1, max_length=60)]


class CropRotationRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    selected_crops: list[CropName] = Field(min_length=1, max_length=12)
    soil_type: str = Field(min_length=1, max_length=80)
    farming_system: str = Field(min_length=1, max_length=80)
    farm_region: str | None = Field(default=None, max_length=80)
    farm_district: str | None = Field(default=None, max_length=80)
    farm_area_hectares: float | None = Field(default=None, gt=0, le=1_000_000)

    @field_validator("selected_crops")
    @classmethod
    def remove_duplicate_crops(cls, crops: list[str]) -> list[str]:
        unique_crops: list[str] = []
        seen: set[str] = set()
        for crop in crops:
            normalized = crop.casefold()
            if normalized not in seen:
                unique_crops.append(crop)
                seen.add(normalized)
        return unique_crops


class CropRotationPhase(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    crop: str = Field(min_length=1, max_length=100)
    crop_family: str = Field(min_length=1, max_length=100)
    start_month: int = Field(ge=1, le=12)
    end_month: int = Field(ge=1, le=12)
    duration_days: int = Field(ge=1, le=365)
    purpose: str = Field(min_length=1, max_length=500)


class CropRotationRecommendation(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    title: str = Field(min_length=1, max_length=120)
    summary: str = Field(min_length=1, max_length=600)
    crop_sequence: list[CropRotationPhase] = Field(min_length=2, max_length=5)
    rationale: str = Field(min_length=1, max_length=1_000)
    considerations: list[str] = Field(min_length=1, max_length=6)
    local_checks: list[str] = Field(min_length=1, max_length=6)

    @model_validator(mode="after")
    def require_crop_diversity(self) -> "CropRotationRecommendation":
        if len({phase.crop.casefold() for phase in self.crop_sequence}) < 2:
            raise ValueError("A rotation must include at least two distinct crops.")
        return self
