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
    status TEXT NOT NULL CHECK (status IN ('active', 'completed')) DEFAULT 'active',
    created_at TEXT NOT NULL,
    completed_at TEXT
);
"""


def init_db() -> None:
    with get_connection() as conn:
        conn.execute(SCHEMA)
        conn.commit()


@contextmanager
def get_connection():
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()
