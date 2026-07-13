from fastapi import APIRouter, HTTPException, status

from model.models import FadingSettings, FadingSettingsUpdate
from services import settings as settings_service

router = APIRouter(prefix="/settings", tags=["settings"])


@router.get("/fading", response_model=FadingSettings)
def get_fading_settings() -> FadingSettings:
    return FadingSettings(**settings_service.get_fading_settings())


@router.put("/fading", response_model=FadingSettings)
def update_fading_settings(payload: FadingSettingsUpdate) -> FadingSettings:
    try:
        row = settings_service.update_fading_settings(
            payload.fade_threshold_days, payload.archive_threshold_days
        )
    except settings_service.InvalidFadingSettingsError as error:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(error))
    return FadingSettings(**row)
