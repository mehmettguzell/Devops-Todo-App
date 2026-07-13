from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field, field_validator


class EnergyLevel(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"


class TaskStatus(str, Enum):
    active = "active"
    completed = "completed"


class TaskCreate(BaseModel):
    title: str
    estimated_duration_minutes: int = Field(gt=0)
    energy_level: EnergyLevel

    @field_validator("title")
    @classmethod
    def title_must_not_be_blank(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            raise ValueError("title must not be empty")
        return stripped


class Task(BaseModel):
    id: int
    title: str
    estimated_duration_minutes: int
    energy_level: EnergyLevel
    status: TaskStatus
    created_at: datetime
    completed_at: datetime | None = None
