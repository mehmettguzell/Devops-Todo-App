def _create_task(client, **overrides):
    payload = {
        "title": "Write CI tests",
        "estimated_duration_minutes": 30,
        "energy_level": "medium",
    }
    payload.update(overrides)
    return client.post("/tasks", json=payload)


def test_create_task(client):
    response = _create_task(client)

    assert response.status_code == 201
    body = response.json()
    assert body["title"] == "Write CI tests"
    assert body["status"] == "active"
    assert body["fading_exempt"] is False


def test_create_task_rejects_blank_title(client):
    response = _create_task(client, title="   ")

    assert response.status_code == 422


def test_create_task_rejects_non_positive_duration(client):
    response = _create_task(client, estimated_duration_minutes=0)

    assert response.status_code == 422


def test_list_active_tasks_returns_created_task(client):
    _create_task(client)

    response = client.get("/tasks", params={"status": "active"})

    assert response.status_code == 200
    titles = [task["title"] for task in response.json()]
    assert "Write CI tests" in titles


def test_complete_task(client):
    task_id = _create_task(client).json()["id"]

    response = client.patch(f"/tasks/{task_id}/complete")

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "completed"
    assert body["completed_at"] is not None


def test_complete_task_not_found(client):
    response = client.patch("/tasks/999999/complete")

    assert response.status_code == 404


def test_revive_completed_task_conflicts(client):
    task_id = _create_task(client).json()["id"]
    client.patch(f"/tasks/{task_id}/complete")

    response = client.patch(f"/tasks/{task_id}/revive")

    assert response.status_code == 409


def test_update_fading_exempt(client):
    task_id = _create_task(client).json()["id"]

    response = client.patch(f"/tasks/{task_id}/fading", json={"fading_exempt": True})

    assert response.status_code == 200
    assert response.json()["fading_exempt"] is True


def test_update_fading_requires_a_field(client):
    task_id = _create_task(client).json()["id"]

    response = client.patch(f"/tasks/{task_id}/fading", json={})

    assert response.status_code == 422


def test_get_task(client):
    task_id = _create_task(client).json()["id"]

    response = client.get(f"/tasks/{task_id}")

    assert response.status_code == 200
    assert response.json()["id"] == task_id


def test_get_task_not_found(client):
    response = client.get("/tasks/999999")

    assert response.status_code == 404


def test_update_task(client):
    task_id = _create_task(client).json()["id"]

    response = client.patch(
        f"/tasks/{task_id}",
        json={"title": "Updated title", "estimated_duration_minutes": 45, "energy_level": "high"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["title"] == "Updated title"
    assert body["estimated_duration_minutes"] == 45
    assert body["energy_level"] == "high"


def test_update_task_partial(client):
    task_id = _create_task(client).json()["id"]

    response = client.patch(f"/tasks/{task_id}", json={"title": "Only title changed"})

    assert response.status_code == 200
    body = response.json()
    assert body["title"] == "Only title changed"
    assert body["estimated_duration_minutes"] == 30
    assert body["energy_level"] == "medium"


def test_update_task_requires_a_field(client):
    task_id = _create_task(client).json()["id"]

    response = client.patch(f"/tasks/{task_id}", json={})

    assert response.status_code == 422


def test_update_task_not_found(client):
    response = client.patch("/tasks/999999", json={"title": "Ghost"})

    assert response.status_code == 404


def test_uncomplete_task(client):
    task_id = _create_task(client).json()["id"]
    client.patch(f"/tasks/{task_id}/complete")

    response = client.patch(f"/tasks/{task_id}/uncomplete")

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "active"
    assert body["completed_at"] is None


def test_uncomplete_task_not_completed_conflicts(client):
    task_id = _create_task(client).json()["id"]

    response = client.patch(f"/tasks/{task_id}/uncomplete")

    assert response.status_code == 409


def test_uncomplete_task_not_found(client):
    response = client.patch("/tasks/999999/uncomplete")

    assert response.status_code == 404


def test_delete_task(client):
    task_id = _create_task(client).json()["id"]

    response = client.delete(f"/tasks/{task_id}")
    assert response.status_code == 204

    listing = client.get("/tasks", params={"status": "active"})
    assert task_id not in [task["id"] for task in listing.json()]


def test_delete_task_not_found(client):
    response = client.delete("/tasks/999999")

    assert response.status_code == 404
