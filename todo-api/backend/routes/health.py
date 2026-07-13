import psycopg
from fastapi import APIRouter, status
from fastapi.responses import JSONResponse

from db import get_connection

router = APIRouter(tags=["health"])


@router.get("/health/live")
def liveness() -> dict:
    """Process is up. No dependency checks — used for restart decisions."""
    return {"status": "ok"}


@router.get("/health/ready")
def readiness() -> JSONResponse:
    """Process can serve traffic. Checked before routing/load-balancer admission."""
    try:
        with get_connection() as conn:
            conn.execute("SELECT 1")
    except psycopg.Error:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={"status": "unavailable"},
        )
    return JSONResponse(status_code=status.HTTP_200_OK, content={"status": "ok"})

