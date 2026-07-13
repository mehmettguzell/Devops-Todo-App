from datetime import date, datetime, timezone

from db import get_connection
from services.tasks import TaskNotFoundError


class TaskCompletedError(Exception):
    pass


def _parse_datetime(value: str) -> datetime:
    return datetime.fromisoformat(value)


def _parse_date(value: str) -> date:
    return date.fromisoformat(value)


def apply_fading_transitions() -> None:
    """Advance active/faded tasks to faded/archived based on elapsed untouched time,
    per data-model.md's "Effective fade/archive clock". Skips exempt tasks and tasks
    whose due date has not yet passed. Never moves a task backward (that only happens
    via explicit revive/exempt/due-date actions)."""
    now = datetime.now(timezone.utc)

    with get_connection() as conn:
        settings_row = conn.execute(
            "SELECT fade_threshold_days, archive_threshold_days FROM fading_settings WHERE id = 1"
        ).fetchone()
        fade_threshold_days = settings_row["fade_threshold_days"]
        archive_threshold_days = settings_row["archive_threshold_days"]

        rows = conn.execute(
            "SELECT id, status, last_touched_at, due_date FROM tasks "
            "WHERE status IN ('active', 'faded') AND fading_exempt = 0"
        ).fetchall()

        for row in rows:
            due_date = date.fromisoformat(row["due_date"]) if row["due_date"] else None
            if due_date is not None and due_date > now.date():
                continue

            last_touched_at = _parse_datetime(row["last_touched_at"])
            effective_start = last_touched_at
            if due_date is not None:
                due_date_start = datetime.combine(due_date, datetime.min.time(), tzinfo=timezone.utc)
                if due_date_start > effective_start:
                    effective_start = due_date_start

            elapsed_days = (now - effective_start).total_seconds() / 86400

            if elapsed_days >= archive_threshold_days:
                new_status = "archived"
            elif elapsed_days >= fade_threshold_days:
                new_status = "faded"
            else:
                new_status = row["status"]

            if new_status != row["status"]:
                conn.execute("UPDATE tasks SET status = %s WHERE id = %s", (new_status, row["id"]))

        conn.commit()


def revive_task(task_id: int) -> dict:
    with get_connection() as conn:
        row = conn.execute("SELECT * FROM tasks WHERE id = %s", (task_id,)).fetchone()
        if row is None:
            raise TaskNotFoundError(task_id)
        if row["status"] == "completed":
            raise TaskCompletedError(task_id)

        if row["status"] != "active":
            now = datetime.now(timezone.utc).isoformat()
            conn.execute(
                "UPDATE tasks SET status = 'active', last_touched_at = %s WHERE id = %s",
                (now, task_id),
            )
            conn.commit()
            row = conn.execute("SELECT * FROM tasks WHERE id = %s", (task_id,)).fetchone()

        return dict(row)


def update_task_fading(
    task_id: int,
    fading_exempt: bool | None,
    due_date: date | None,
    due_date_set: bool,
) -> dict:
    with get_connection() as conn:
        row = conn.execute("SELECT * FROM tasks WHERE id = %s", (task_id,)).fetchone()
        if row is None:
            raise TaskNotFoundError(task_id)

        now = datetime.now(timezone.utc)
        now_iso = now.isoformat()

        new_fading_exempt = row["fading_exempt"] if fading_exempt is None else int(fading_exempt)
        new_due_date = row["due_date"] if not due_date_set else (due_date.isoformat() if due_date else None)

        now_protects = bool(new_fading_exempt) or (
            new_due_date is not None and date.fromisoformat(new_due_date) > now.date()
        )

        new_status = row["status"]
        new_last_touched_at = row["last_touched_at"]

        if row["status"] in ("faded", "archived") and now_protects:
            new_status = "active"
            new_last_touched_at = now_iso
        elif fading_exempt is False and row["fading_exempt"]:
            new_last_touched_at = now_iso

        conn.execute(
            """
            UPDATE tasks
            SET fading_exempt = %s, due_date = %s, status = %s, last_touched_at = %s
            WHERE id = %s
            """,
            (new_fading_exempt, new_due_date, new_status, new_last_touched_at, task_id),
        )
        conn.commit()
        row = conn.execute("SELECT * FROM tasks WHERE id = %s", (task_id,)).fetchone()
        return dict(row)
