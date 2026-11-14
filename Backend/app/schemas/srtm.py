"""Schemas for NASA SRTM terrain analysis and tasks."""
from pydantic import BaseModel


class TerrainSample(BaseModel):
    latitude: float
    longitude: float
    elevation: float


class DatasetTask(BaseModel):
    id: int
    name: str
    dataset: str
    summary: str
    objective: str
    source: str
    rationale: str
    steps: list[str]


class TerrainSummary(BaseModel):
    sample_count: int
    minimum_elevation: float
    maximum_elevation: float
    average_elevation: float
    elevation_range: float
