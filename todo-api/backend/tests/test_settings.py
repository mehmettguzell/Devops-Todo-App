def test_get_fading_settings_returns_defaults(client):
    response = client.get("/settings/fading")

    assert response.status_code == 200
    assert response.json() == {
        "fade_threshold_days": 7,
        "archive_threshold_days": 21,
    }


def test_update_fading_settings(client):
    response = client.put(
        "/settings/fading",
        json={"fade_threshold_days": 3, "archive_threshold_days": 10},
    )

    assert response.status_code == 200
    assert response.json() == {
        "fade_threshold_days": 3,
        "archive_threshold_days": 10,
    }
    assert client.get("/settings/fading").json()["fade_threshold_days"] == 3


def test_update_fading_settings_rejects_archive_not_greater_than_fade(client):
    response = client.put(
        "/settings/fading",
        json={"fade_threshold_days": 10, "archive_threshold_days": 10},
    )

    assert response.status_code == 422


def test_update_fading_settings_rejects_non_positive_values(client):
    response = client.put(
        "/settings/fading",
        json={"fade_threshold_days": 0, "archive_threshold_days": 5},
    )

    assert response.status_code == 422
