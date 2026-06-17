def _auth_headers(client):
    login = client.post(
        "/api/v1/learn/auth/login",
        json={"email": "student@training.local", "password": "learn123"},
    )
    token = login.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_dashboard_lists_modules_and_lessons(client):
    headers = _auth_headers(client)
    response = client.get("/api/v1/learn/dashboard", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data["modules"]) == 4
    titles = [module["title"] for module in data["modules"]]
    assert titles == [
        "Основной интерфейс",
        "Импорт данных",
        "Кустование",
        "Карта",
    ]
    module = data["modules"][0]
    assert module["id"] == "orientation-v1"
    assert len(module["lessons"]) == 5
    assert module["lessons"][0]["status"] == "active"
    assert module["lessons"][0]["slide_count"] >= 1
    assert "tags" in module["lessons"][0]
    assert module["lessons"][0]["tags"] == ["Старт", "Демо"]
    assert len(data["modules"][1]["lessons"]) == 2


def test_get_lesson_includes_slides_and_hotspots(client):
    headers = _auth_headers(client)
    response = client.get("/api/v1/learn/lessons/lesson-02-create-project", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Создание проекта"
    assert data["tags"] == ["Демо", "Проекты"]
    assert len(data["slides"]) == 3
    assert len(data["slides"][0]["hotspots"]) >= 1
    assert data["slides"][0]["image_path"].startswith("/content/")
    assert len(data["module_lessons"]) == 5


def test_lesson_flow_manual_and_mock_resource(client):
    headers = _auth_headers(client)
    lesson1 = "lesson-01-login-context"
    lesson2 = "lesson-02-create-project"

    start = client.post(f"/api/v1/learn/lessons/{lesson1}/start", headers=headers)
    assert start.status_code == 200

    verify1 = client.post(f"/api/v1/learn/lessons/{lesson1}/verify", headers=headers)
    assert verify1.status_code == 200
    assert verify1.json()["status"] == "passed"

    detail = client.get(f"/api/v1/learn/lessons/{lesson2}", headers=headers)
    states = {item["lesson_id"]: item["status"] for item in detail.json()["lesson_states"]}
    assert states[lesson1] == "completed"
    assert states[lesson2] == "active"

    client.post(f"/api/v1/learn/lessons/{lesson2}/start", headers=headers)
    verify2 = client.post(f"/api/v1/learn/lessons/{lesson2}/verify", headers=headers)
    assert verify2.status_code == 200
    assert verify2.json()["status"] == "passed"
    assert verify2.json()["data"]["resource_id"] == "mock-project-id"

    detail2 = client.get(f"/api/v1/learn/lessons/{lesson2}", headers=headers)
    assert detail2.json()["project_id"] == "mock-project-id"
    assert detail2.json()["progress_percent"] == 40


def test_verify_locked_lesson_rejected(client):
    headers = _auth_headers(client)
    response = client.post(
        "/api/v1/learn/lessons/lesson-03-navigation/verify",
        headers=headers,
    )
    assert response.status_code == 400
    assert response.json()["detail"]["detail"] == "invalid_lesson_transition"
