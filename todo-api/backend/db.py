import os
from contextlib import contextmanager

import psycopg
from psycopg.rows import dict_row

DB_CONFIG = {
    "host": os.environ.get("POSTGRES_HOST", "localhost"),
    "port": os.environ.get("POSTGRES_PORT", "5432"),
    "dbname": os.environ.get("POSTGRES_DB", "postgres"),
    "user": os.environ.get("POSTGRES_USER", "postgres"),
    "password": os.environ.get("POSTGRES_PASSWORD", "postgres"),
}

SCHEMA = """
CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
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
        conn.execute(SCHEMA)
        conn.execute(FADING_SETTINGS_SCHEMA)
        conn.execute(
            """
            INSERT INTO fading_settings (id, fade_threshold_days, archive_threshold_days)
            SELECT 1, %s, %s
            WHERE NOT EXISTS (SELECT 1 FROM fading_settings WHERE id = 1)
            """,
            (DEFAULT_FADE_THRESHOLD_DAYS, DEFAULT_ARCHIVE_THRESHOLD_DAYS),
        )
        conn.commit()


@contextmanager
def get_connection():
    conn = psycopg.connect(row_factory=dict_row, **DB_CONFIG)
    try:
        yield conn
    finally:
        conn.close()
