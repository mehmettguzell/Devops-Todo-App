import os
import sqlite3
from contextlib import contextmanager

DATABASE_PATH = os.environ.get("DATABASE_PATH", "bitir.db")

SCHEMA = """
CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    estimated_duration_minutes INTEGER NOT NULL,
    energy_level TEXT NOT NULL CHECK (energy_level IN ('low', 'medium', 'high')),
    status TEXT NOT NULL CHECK (status IN ('active', 'faded', 'archived', 'completed')) DEFAULT 'active',
    created_at TEXT NOT NULL,
    completed_at TEXT,
    last_touched_at TEXT NOT NULL,
    fading_exempt INTEGER NOT NULL DEFAULT 0,
    due_date TEXT
);
"""

FADING_SETTINGS_SCHEMA = """
CREATE TABLE IF NOT EXISTS fading_settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    fade_threshold_days INTEGER NOT NULL,
    archive_threshold_days INTEGER NOT NULL
);
"""

DEFAULT_FADE_THRESHOLD_DAYS = 7
DEFAULT_ARCHIVE_THRESHOLD_DAYS = 21


def init_db() -> None:
    with get_connection() as conn:
        _migrate_tasks_table(conn)
        conn.execute(FADING_SETTINGS_SCHEMA)
        conn.execute(
            """
            INSERT INTO fading_settings (id, fade_threshold_days, archive_threshold_days)
            SELECT 1, ?, ?
            WHERE NOT EXISTS (SELECT 1 FROM fading_settings WHERE id = 1)
            """,
            (DEFAULT_FADE_THRESHOLD_DAYS, DEFAULT_ARCHIVE_THRESHOLD_DAYS),
        )
        conn.commit()


def _migrate_tasks_table(conn: sqlite3.Connection) -> None:
    """Create `tasks` with the current schema, or rebuild it in place if an older
    schema (from before task fading) already exists, preserving existing rows."""
    conn.execute(SCHEMA)

    columns = {row["name"] for row in conn.execute("PRAGMA table_info(tasks)").fetchall()}
    if "last_touched_at" in columns:
        return

    conn.execute(
        """
        CREATE TABLE tasks_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            estimated_duration_minutes INTEGER NOT NULL,
            energy_level TEXT NOT NULL CHECK (energy_level IN ('low', 'medium', 'high')),
            status TEXT NOT NULL CHECK (status IN ('active', 'faded', 'archived', 'completed')) DEFAULT 'active',
            created_at TEXT NOT NULL,
            completed_at TEXT,
            last_touched_at TEXT NOT NULL,
            fading_exempt INTEGER NOT NULL DEFAULT 0,
            due_date TEXT
        )
        """
    )
    conn.execute(
        """
        INSERT INTO tasks_new (id, title, estimated_duration_minutes, energy_level, status,
                                created_at, completed_at, last_touched_at, fading_exempt, due_date)
        SELECT id, title, estimated_duration_minutes, energy_level, status,
               created_at, completed_at, COALESCE(completed_at, created_at), 0, NULL
        FROM tasks
        """
    )
    conn.execute("DROP TABLE tasks")
    conn.execute("ALTER TABLE tasks_new RENAME TO tasks")


@contextmanager
def get_connection():
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()
