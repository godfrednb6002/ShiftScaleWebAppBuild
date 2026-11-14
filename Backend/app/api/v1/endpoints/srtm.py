"""API endpoints for SRTM terrain analysis tasks."""
from typing import Any
from fastapi import APIRouter, HTTPException

from app.schemas.srtm import TerrainSample, TerrainSummary
from app.services.nasa.srtm_service import DATASET_3_TASK, summarize_srtm

router = APIRouter(prefix="/tasks", tags=["SRTM Terrain Analysis"])


@router.get("", response_model=list[dict[str, Any]])
def list_tasks() -> list[dict[str, Any]]:
    return [DATASET_3_TASK.model_dump(mode="json")]


@router.get("/dataset-3", response_model=dict[str, Any])
def get_dataset_3_task() -> dict[str, Any]:
    return DATASET_3_TASK.model_dump(mode="json")


@router.get("/{task_id}", response_model=dict[str, Any])
def get_task(task_id: int) -> dict[str, Any]:
    if task_id != DATASET_3_TASK.id:
        raise HTTPException(status_code=404, detail="Task not found")
    return DATASET_3_TASK.model_dump(mode="json")


@router.post("/dataset-3/summary", response_model=TerrainSummary)
def get_dataset_3_summary(samples: list[TerrainSample]) -> TerrainSummary:
    return summarize_srtm(samples)
