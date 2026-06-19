def test_dashboard_lists_modules_and_lessons(client, student_headers):
    response = client.get("/api/v1/learn/dashboard", headers=student_headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data["modules"]) == 1
    module = data["modules"][0]
    assert module["id"] == "orientation-v1"
    assert module["title"] == "Основной интерфейс"
    assert len(module["lessons"]) == 5
    assert module["lessons"][0]["status"] == "active"
    assert module["lessons"][0]["slide_count"] >= 1
    assert "tags" in module["lessons"][0]
    assert module["lessons"][0]["tags"] == ["Старт"]


def test_get_lesson_includes_slides_and_hotspots(client, student_headers):
    response = client.get("/api/v1/learn/lessons/lesson-02-create-project", headers=student_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Создание проекта"
    assert data["tags"] == ["Проекты"]
    assert len(data["slides"]) == 3
    assert len(data["slides"][0]["hotspots"]) >= 1
    assert data["slides"][0]["image_path"].startswith("/content/")
    assert len(data["module_lessons"]) == 5


def test_lesson_flow_manual_steps(client, student_headers):
    lesson1 = "lesson-01-login-context"
    lesson2 = "lesson-02-create-project"

    start = client.post(f"/api/v1/learn/lessons/{lesson1}/start", headers=student_headers)
    assert start.status_code == 200

    verify1 = client.post(f"/api/v1/learn/lessons/{lesson1}/verify", headers=student_headers)
    assert verify1.status_code == 200
    assert verify1.json()["status"] == "passed"

    detail = client.get(f"/api/v1/learn/lessons/{lesson2}", headers=student_headers)
    states = {item["lesson_id"]: item["status"] for item in detail.json()["lesson_states"]}
    assert states[lesson1] == "completed"
    assert states[lesson2] == "active"

    client.post(f"/api/v1/learn/lessons/{lesson2}/start", headers=student_headers)
    verify2 = client.post(f"/api/v1/learn/lessons/{lesson2}/verify", headers=student_headers)
    assert verify2.status_code == 200
    assert verify2.json()["status"] == "passed"

    detail2 = client.get(f"/api/v1/learn/lessons/{lesson2}", headers=student_headers)
    assert detail2.json()["progress_percent"] == 40


def test_verify_locked_lesson_rejected(client, student_headers):
    response = client.post(
        "/api/v1/learn/lessons/lesson-03-navigation/verify",
        headers=student_headers,
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "invalid_lesson_transition"
