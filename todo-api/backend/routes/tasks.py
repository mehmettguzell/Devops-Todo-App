from typing import Literal

from fastapi import APIRouter, HTTPException, Query, status

from model.models import Task, TaskCreate
from services import tasks as tasks_service

router = APIRouter(prefix="/tasks", tags=["tasks"])


@router.get("", response_model=list[Task])
def list_tasks(
    task_status: Literal["active", "completed"] = Query("active", alias="status"),
) -> list[Task]:
    if task_status == "active":
        rows = tasks_service.list_active_tasks()
    else:
        rows = tasks_service.list_completed_tasks()
    return [Task(**row) for row in rows]


@router.post("", response_model=Task, status_code=status.HTTP_201_CREATED)
def create_task(payload: TaskCreate) -> Task:
    row = tasks_service.create_task(payload.title, payload.estimated_duration_minutes, payload.energy_level)
    return Task(**row)


@router.patch("/{task_id}/complete", response_model=Task)
def complete_task(task_id: int) -> Task:
    try:
        row = tasks_service.complete_task(task_id)
    except tasks_service.TaskNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    return Task(**row)
