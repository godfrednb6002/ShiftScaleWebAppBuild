"""Business logic and helpers for NASA SRTM terrain analysis."""
from app.schemas.srtm import DatasetTask, TerrainSample, TerrainSummary

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
