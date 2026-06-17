def _auth_headers(client):
    login = client.post(
        "/api/v1/learn/auth/login",
        json={"email": "student@training.local", "password": "learn123"},
    )
    token = login.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_module_steps_includes_states(client):
    headers = _auth_headers(client)
    response = client.get("/api/v1/learn/modules/orientation-v1/steps", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["module_id"] == "orientation-v1"
    assert len(data["steps"]) == 5
    assert len(data["step_states"]) == 5
    assert data["step_states"][0]["status"] == "active"
    assert data["step_states"][1]["status"] == "locked"
    assert data["current_step_id"] == "step-01-login-context"


def test_step_flow_manual_and_mock_resource(client):
    headers = _auth_headers(client)
    module_id = "orientation-v1"

    start = client.post(
        f"/api/v1/learn/modules/{module_id}/steps/step-01-login-context/start",
        headers=headers,
    )
    assert start.status_code == 200

    verify1 = client.post(
        f"/api/v1/learn/modules/{module_id}/steps/step-01-login-context/verify",
        headers=headers,
    )
    assert verify1.status_code == 200
    assert verify1.json()["status"] == "passed"

    progress = client.get(f"/api/v1/learn/modules/{module_id}/progress", headers=headers)
    states = {item["step_id"]: item["status"] for item in progress.json()["step_states"]}
    assert states["step-01-login-context"] == "completed"
    assert states["step-02-create-project"] == "active"
    assert progress.json()["current_step_id"] == "step-02-create-project"

    client.post(
        f"/api/v1/learn/modules/{module_id}/steps/step-02-create-project/start",
        headers=headers,
    )
    verify2 = client.post(
        f"/api/v1/learn/modules/{module_id}/steps/step-02-create-project/verify",
        headers=headers,
    )
    assert verify2.status_code == 200
    assert verify2.json()["status"] == "passed"
    assert verify2.json()["data"]["resource_id"] == "mock-project-id"

    flow = client.get(f"/api/v1/learn/modules/{module_id}/steps", headers=headers)
    assert flow.json()["project_id"] == "mock-project-id"
    assert flow.json()["progress_percent"] == 40


def test_verify_locked_step_rejected(client):
    headers = _auth_headers(client)
    response = client.post(
        "/api/v1/learn/modules/orientation-v1/steps/step-03-navigation/verify",
        headers=headers,
    )
    assert response.status_code == 400
    assert response.json()["detail"]["detail"] == "invalid_step_transition"


def _complete_step(client, headers, module_id: str, step_id: str) -> None:
    client.post(
        f"/api/v1/learn/modules/{module_id}/steps/{step_id}/start",
        headers=headers,
    )
    client.post(
        f"/api/v1/learn/modules/{module_id}/steps/{step_id}/verify",
        headers=headers,
    )


def test_full_flow_through_journal(client):
    headers = _auth_headers(client)
    module_id = "orientation-v1"

    _complete_step(client, headers, module_id, "step-01-login-context")
    _complete_step(client, headers, module_id, "step-02-create-project")
    _complete_step(client, headers, module_id, "step-03-navigation")
    _complete_step(client, headers, module_id, "step-04-job-journal")

    flow = client.get(f"/api/v1/learn/modules/{module_id}/steps", headers=headers)
    data = flow.json()
    assert data["progress_percent"] == 80
    assert data["current_step_id"] == "step-05-mini-quiz"
    assert data["project_id"] == "mock-project-id"

    states = {item["step_id"]: item["status"] for item in data["step_states"]}
    assert states["step-04-job-journal"] == "completed"
    assert states["step-05-mini-quiz"] == "active"


def test_modules_progress_updates_after_steps(client):
    headers = _auth_headers(client)
    modules = client.get("/api/v1/learn/modules", headers=headers)
    assert modules.json()["items"][0]["progress_percent"] == 0

    _complete_step(client, headers, "orientation-v1", "step-01-login-context")

    modules = client.get("/api/v1/learn/modules", headers=headers)
    item = modules.json()["items"][0]
    assert item["progress_percent"] == 20
    assert item["completed_steps"] == 1
