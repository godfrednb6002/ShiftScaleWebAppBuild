import os
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from pydantic import BaseModel

load_dotenv()

app = FastAPI(title="ShiftScale API", version="0.1.0")


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


DATASET_3_TASK = DatasetTask(
    id=3,
    name="NASA SRTM Terrain Analysis",
    dataset="SRTM",
    summary="Analyze terrain elevation and slope variation across the mission area using NASA SRTM data.",
    objective="Identify ridgelines, valleys, and elevation breaks needed for terrain assessment and planning.",
    source="NASA Shuttle Radar Topography Mission (SRTM)",
    rationale="SRTM provides consistent global elevation data that helps teams evaluate terrain risk, drainage patterns, and site suitability.",
    steps=[
        "Load the SRTM dataset for the mission region.",
        "Filter invalid or missing elevation values.",
        "Calculate elevation statistics for the selected area.",
        "Map slope and relief patterns to locate ridges and valleys.",
        "Summarize terrain conditions for mission planning decisions.",
    ],
)


def summarize_srtm(samples: list[TerrainSample]) -> TerrainSummary:
    if not samples:
        return TerrainSummary(
            sample_count=0,
            minimum_elevation=0.0,
            maximum_elevation=0.0,
            average_elevation=0.0,
            elevation_range=0.0,
        )

    elevations = [sample.elevation for sample in samples]
    minimum_elevation = min(elevations)
    maximum_elevation = max(elevations)
    average_elevation = sum(elevations) / len(elevations)

    return TerrainSummary(
        sample_count=len(samples),
        minimum_elevation=round(minimum_elevation, 2),
        maximum_elevation=round(maximum_elevation, 2),
        average_elevation=round(average_elevation, 2),
        elevation_range=round(maximum_elevation - minimum_elevation, 2),
    )


# CORS setup
origins = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in origins],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root() -> dict[str, Any]:
    return {"message": "ShiftScale Backend is running!", "status": "healthy"}


@app.get("/api/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/tasks")
def list_tasks() -> list[dict[str, Any]]:
    return [DATASET_3_TASK.model_dump(mode="json")]


@app.get("/api/tasks/dataset-3")
def get_dataset_3_task() -> dict[str, Any]:
    return DATASET_3_TASK.model_dump(mode="json")


@app.get("/api/tasks/{task_id}")
def get_task(task_id: int) -> dict[str, Any]:
    if task_id != DATASET_3_TASK.id:
        raise HTTPException(status_code=404, detail="Task not found")
    return DATASET_3_TASK.model_dump(mode="json")


@app.post("/api/tasks/dataset-3/summary")
def get_dataset_3_summary(samples: list[TerrainSample]) -> TerrainSummary:
    return summarize_srtm(samples)
