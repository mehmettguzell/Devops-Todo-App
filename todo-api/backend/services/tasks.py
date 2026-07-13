from datetime import date, datetime, timezone

from db import get_connection
from model.models import EnergyLevel


def create_task(
    title: str,
    estimated_duration_minutes: int,
    energy_level: EnergyLevel,
    due_date: date | None = None,
) -> dict:
    created_at = datetime.now(timezone.utc).isoformat()
    with get_connection() as conn:
        cursor = conn.execute(
            """
            INSERT INTO tasks
                (title, estimated_duration_minutes, energy_level, status, created_at,
                 last_touched_at, fading_exempt, due_date)
            VALUES (?, ?, ?, 'active', ?, ?, 0, ?)
            """,
            (
                title,
                estimated_duration_minutes,
                energy_level.value,
                created_at,
                created_at,
                due_date.isoformat() if due_date else None,
            ),
        )
        conn.commit()
        row = conn.execute("SELECT * FROM tasks WHERE id = ?", (cursor.lastrowid,)).fetchone()
        return dict(row)


def list_active_tasks() -> list[dict]:
    with get_connection() as conn:
        rows = conn.execute(
            "SELECT * FROM tasks WHERE status IN ('active', 'faded') "
            "ORDER BY (status = 'faded'), created_at DESC"
        ).fetchall()
        return [dict(row) for row in rows]


def list_archived_tasks() -> list[dict]:
    with get_connection() as conn:
        rows = conn.execute(
            "SELECT * FROM tasks WHERE status = 'archived' ORDER BY last_touched_at DESC"
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


class TaskArchivedError(Exception):
    pass


def complete_task(task_id: int) -> dict:
    with get_connection() as conn:
        row = conn.execute("SELECT * FROM tasks WHERE id = ?", (task_id,)).fetchone()
        if row is None:
            raise TaskNotFoundError(task_id)
        if row["status"] == "archived":
            raise TaskArchivedError(task_id)

        if row["status"] in ("active", "faded"):
            completed_at = datetime.now(timezone.utc).isoformat()
            conn.execute(
                "UPDATE tasks SET status = 'completed', completed_at = ? WHERE id = ?",
                (completed_at, task_id),
            )
            conn.commit()
            row = conn.execute("SELECT * FROM tasks WHERE id = ?", (task_id,)).fetchone()

        return dict(row)

def delete_task(task_id: int) -> bool:
    with get_connection() as conn:
        row = conn.execute("DELETE FROM tasks WHERE id = ?", (task_id,))
        if row.rowcount == 0:
            raise TaskNotFoundError(task_id)
        conn.commit()