"""Tests for self-study assignments API."""


def test_list_self_study_assignments(client, student_headers):
    response = client.get("/api/v1/learn/self-study/assignments", headers=student_headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data["items"]) >= 1
    assignment = data["items"][0]
    assert assignment["id"] == "self-study-test-v1"
    assert assignment["total_steps"] == 7
    assert assignment["completed_steps"] == 0


def test_self_study_flow(client, student_headers):
    assignment_id = "self-study-test-v1"
    step1 = "ss-step-01-create-project"
    step2 = "ss-step-02-import-gdp"

    detail = client.get(f"/api/v1/learn/self-study/assignments/{assignment_id}", headers=student_headers)
    assert detail.status_code == 200
    body = detail.json()
    assert body["title"] == "Тестовое задание: модель энергосистемы"
    assert len(body["steps"]) == 7
    states = {item["step_id"]: item["status"] for item in body["step_states"]}
    assert states[step1] == "active"
    assert states[step2] == "locked"

    start = client.post(
        f"/api/v1/learn/self-study/assignments/{assignment_id}/steps/{step1}/start",
        headers=student_headers,
    )
    assert start.status_code == 200

    verify1 = client.post(
        f"/api/v1/learn/self-study/assignments/{assignment_id}/steps/{step1}/verify",
        headers=student_headers,
    )
    assert verify1.status_code == 200
    assert verify1.json()["status"] == "passed"

    detail2 = client.get(f"/api/v1/learn/self-study/assignments/{assignment_id}", headers=student_headers)
    states2 = {item["step_id"]: item["status"] for item in detail2.json()["step_states"]}
    assert states2[step1] == "completed"
    assert states2[step2] == "active"

    client.post(
        f"/api/v1/learn/self-study/assignments/{assignment_id}/steps/{step2}/start",
        headers=student_headers,
    )
    complete2 = client.post(
        f"/api/v1/learn/self-study/assignments/{assignment_id}/steps/{step2}/complete-manual",
        headers=student_headers,
    )
    assert complete2.status_code == 200
    assert complete2.json()["status"] == "completed"


def test_verify_locked_self_study_step_rejected(client, student_headers):
    response = client.post(
        "/api/v1/learn/self-study/assignments/self-study-test-v1/steps/ss-step-03-scenario-params/verify",
        headers=student_headers,
    )
    assert response.status_code == 400
