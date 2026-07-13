from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query, status

from model.models import Task, TaskCreate, TaskFadingUpdate
from services import tasks as tasks_service
from services.fading import (
    TaskCompletedError,
    apply_fading_transitions,
    revive_task,
    update_task_fading,
)

router = APIRouter(prefix="/tasks", tags=["tasks"], dependencies=[Depends(apply_fading_transitions)])


@router.get("", response_model=list[Task])
def list_tasks(
    task_status: Literal["active", "completed", "archived"] = Query("active", alias="status"),
) -> list[Task]:
    if task_status == "active":
        rows = tasks_service.list_active_tasks()
    elif task_status == "archived":
        rows = tasks_service.list_archived_tasks()
    else:
        rows = tasks_service.list_completed_tasks()
    return [Task(**row) for row in rows]


@router.post("", response_model=Task, status_code=status.HTTP_201_CREATED)
def create_task(payload: TaskCreate) -> Task:
    row = tasks_service.create_task(
        payload.title,
        payload.estimated_duration_minutes,
        payload.energy_level,
        due_date=payload.due_date,
    )
    return Task(**row)


@router.patch("/{task_id}/complete", response_model=Task)
def complete_task(task_id: int) -> Task:
    try:
        row = tasks_service.complete_task(task_id)
    except tasks_service.TaskNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    except tasks_service.TaskArchivedError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Task is archived; revive it before completing",
        )
    return Task(**row)


@router.patch("/{task_id}/revive", response_model=Task)
def revive(task_id: int) -> Task:
    try:
        row = revive_task(task_id)
    except tasks_service.TaskNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    except TaskCompletedError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Task is completed; revive does not apply",
        )
    return Task(**row)


@router.patch("/{task_id}/fading", response_model=Task)
def update_fading(task_id: int, payload: TaskFadingUpdate) -> Task:
    try:
        row = update_task_fading(
            task_id,
            fading_exempt=payload.fading_exempt,
            due_date=payload.due_date,
            due_date_set=payload.due_date_set,
        )
    except tasks_service.TaskNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    return Task(**row)
