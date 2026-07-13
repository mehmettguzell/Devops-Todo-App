from db import get_connection


class InvalidFadingSettingsError(Exception):
    pass


def get_fading_settings() -> dict:
    with get_connection() as conn:
        row = conn.execute(
            "SELECT fade_threshold_days, archive_threshold_days FROM fading_settings WHERE id = 1"
        ).fetchone()
        return dict(row)


def update_fading_settings(fade_threshold_days: int, archive_threshold_days: int) -> dict:
    if archive_threshold_days <= fade_threshold_days:
        raise InvalidFadingSettingsError(
            "archive_threshold_days must be greater than fade_threshold_days"
        )

    with get_connection() as conn:
        conn.execute(
            "UPDATE fading_settings SET fade_threshold_days = ?, archive_threshold_days = ? WHERE id = 1",
            (fade_threshold_days, archive_threshold_days),
        )
        conn.commit()
        row = conn.execute(
            "SELECT fade_threshold_days, archive_threshold_days FROM fading_settings WHERE id = 1"
        ).fetchone()
        return dict(row)
