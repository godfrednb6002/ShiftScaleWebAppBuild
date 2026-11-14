from datetime import date

from fastapi import APIRouter, HTTPException, Query

from app.schemas.nasa_power import NasaPowerDailyResponse
from app.services.nasa.nasa_power import (
    NasaPowerResponseError,
    NasaPowerTimeoutError,
    fetch_daily_climate_data,
)

router = APIRouter()


@router.get(
    "/daily",
    response_model=NasaPowerDailyResponse,
    summary="Get NASA POWER daily climate data",
)
def get_daily_climate_data(
    latitude: float = Query(ge=-90, le=90),
    longitude: float = Query(ge=-180, le=180),
    start_date: date = Query(),
    end_date: date = Query(),
) -> NasaPowerDailyResponse:
    if start_date > end_date:
        raise HTTPException(
            status_code=422, detail="start_date must be on or before end_date."
        )

    try:
        return fetch_daily_climate_data(
            latitude=latitude,
            longitude=longitude,
            start_date=start_date,
            end_date=end_date,
        )
    except NasaPowerTimeoutError as error:
        raise HTTPException(status_code=504, detail=str(error)) from error
    except NasaPowerResponseError as error:
        raise HTTPException(status_code=502, detail=str(error)) from error
