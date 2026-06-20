def test_reset_progress_clears_lesson_stats(client, student_headers):
    lesson_id = "lesson-01-login-context"

    start = client.post(f"/api/v1/learn/lessons/{lesson_id}/start", headers=student_headers)
    assert start.status_code == 200

    verify = client.post(f"/api/v1/learn/lessons/{lesson_id}/verify", headers=student_headers)
    assert verify.status_code == 200
    assert verify.json()["status"] == "passed"

    dashboard_before = client.get("/api/v1/learn/dashboard", headers=student_headers)
    assert dashboard_before.status_code == 200
    module = dashboard_before.json()["modules"][0]
    assert module["completed_lessons"] >= 1

    reset = client.post("/api/v1/learn/profile/reset-progress", headers=student_headers)
    assert reset.status_code == 200
    body = reset.json()
    assert body["modules_reset"] >= 1
    assert "сброшена" in body["message"].lower()

    dashboard_after = client.get("/api/v1/learn/dashboard", headers=student_headers)
    assert dashboard_after.status_code == 200
    module_after = dashboard_after.json()["modules"][0]
    assert module_after["completed_lessons"] == 0
    assert module_after["progress_percent"] == 0
    assert module_after["lessons"][0]["status"] == "active"


def test_reset_progress_requires_auth(client):
    response = client.post("/api/v1/learn/profile/reset-progress")
    assert response.status_code == 401
