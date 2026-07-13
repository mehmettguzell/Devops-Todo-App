from datetime import datetime, timezone

from db import get_connection
from model.models import EnergyLevel


def create_task(title: str, estimated_duration_minutes: int, energy_level: EnergyLevel) -> dict:
    created_at = datetime.now(timezone.utc).isoformat()
    with get_connection() as conn:
        cursor = conn.execute(
            """
            INSERT INTO tasks (title, estimated_duration_minutes, energy_level, status, created_at)
            VALUES (?, ?, ?, 'active', ?)
            """,
            (title, estimated_duration_minutes, energy_level.value, created_at),
        )
        conn.commit()
        row = conn.execute("SELECT * FROM tasks WHERE id = ?", (cursor.lastrowid,)).fetchone()
        return dict(row)


def list_active_tasks() -> list[dict]:
    with get_connection() as conn:
        rows = conn.execute(
            "SELECT * FROM tasks WHERE status = 'active' ORDER BY created_at DESC"
        ).fetchall()
        return [dict(row) for row in rows]


def list_completed_tasks() -> list[dict]:
    with get_connection() as conn:
        rows = conn.execute(
            "SELECT * FROM tasks WHERE status = 'completed' ORDER BY completed_at DESC"
        ).fetchall()
        return [dict(row) for row in rows]


class TaskNotFoundError(Exception):
    pass


def complete_task(task_id: int) -> dict:
    with get_connection() as conn:
        row = conn.execute("SELECT * FROM tasks WHERE id = ?", (task_id,)).fetchone()
        if row is None:
            raise TaskNotFoundError(task_id)

        if row["status"] == "active":
            completed_at = datetime.now(timezone.utc).isoformat()
            conn.execute(
                "UPDATE tasks SET status = 'completed', completed_at = ? WHERE id = ?",
                (completed_at, task_id),
            )
            conn.commit()
            row = conn.execute("SELECT * FROM tasks WHERE id = ?", (task_id,)).fetchone()

        return dict(row)
