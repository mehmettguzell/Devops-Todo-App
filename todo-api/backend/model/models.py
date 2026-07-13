from datetime import date, datetime
from enum import Enum

from pydantic import BaseModel, Field, field_validator, model_validator


class EnergyLevel(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"


class TaskStatus(str, Enum):
    active = "active"
    faded = "faded"
    archived = "archived"
    completed = "completed"


class TaskCreate(BaseModel):
    title: str
    estimated_duration_minutes: int = Field(gt=0)
    energy_level: EnergyLevel
    due_date: date | None = None

    @field_validator("title")
    @classmethod
    def title_must_not_be_blank(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            raise ValueError("title must not be empty")
        return stripped


class TaskUpdate(BaseModel):
    title: str | None = None
    estimated_duration_minutes: int | None = Field(default=None, gt=0)
    energy_level: EnergyLevel | None = None

    @field_validator("title")
    @classmethod
    def title_must_not_be_blank(cls, value: str | None) -> str | None:
        if value is None:
            return value
        stripped = value.strip()
        if not stripped:
            raise ValueError("title must not be empty")
        return stripped

    @model_validator(mode="after")
    def at_least_one_field_present(self) -> "TaskUpdate":
        if self.title is None and self.estimated_duration_minutes is None and self.energy_level is None:
            raise ValueError("at least one of title, estimated_duration_minutes or energy_level must be provided")
        return self


class TaskFadingUpdate(BaseModel):
    fading_exempt: bool | None = None
    due_date: date | None = None
    due_date_set: bool = False
    """Internal marker distinguishing "clear due_date" from "leave it unchanged";
    set programmatically from the raw request body, not part of the JSON schema."""

    @model_validator(mode="before")
    @classmethod
    def track_due_date_presence(cls, data: object) -> object:
        if isinstance(data, dict):
            data = dict(data)
            data["due_date_set"] = "due_date" in data
        return data

    @model_validator(mode="after")
    def at_least_one_field_present(self) -> "TaskFadingUpdate":
        if self.fading_exempt is None and not self.due_date_set:
            raise ValueError("at least one of fading_exempt or due_date must be provided")
        return self


class FadingSettings(BaseModel):
    fade_threshold_days: int
    archive_threshold_days: int


class FadingSettingsUpdate(BaseModel):
    fade_threshold_days: int = Field(gt=0)
    archive_threshold_days: int = Field(gt=0)


class Task(BaseModel):
    id: int
    title: str
    estimated_duration_minutes: int
    energy_level: EnergyLevel
    status: TaskStatus
    created_at: datetime
    completed_at: datetime | None = None
    last_touched_at: datetime
    fading_exempt: bool
    due_date: date | None = None
