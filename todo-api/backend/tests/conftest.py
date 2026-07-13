import pytest
from fastapi.testclient import TestClient

import main
from db import get_connection, init_db


@pytest.fixture(scope="session", autouse=True)
def _init_test_db():
    init_db()


@pytest.fixture(autouse=True)
def _reset_tables():
    yield
    with get_connection() as conn:
        conn.execute("TRUNCATE TABLE tasks RESTART IDENTITY")
        conn.execute(
            "UPDATE fading_settings SET fade_threshold_days = 7, archive_threshold_days = 21 "
            "WHERE id = 1"
        )
        conn.commit()


@pytest.fixture
def client():
    return TestClient(main.app)
