def _auth_headers(client, email: str, password: str):
    login = client.post(
        "/api/v1/learn/auth/login",
        json={"email": email, "password": password},
    )
    assert login.status_code == 200
    token = login.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def _author_headers(client):
    return _auth_headers(client, "author@training.local", "author123")


def _student_headers(client):
    return _auth_headers(client, "student@training.local", "learn123")


def test_author_get_module_quiz_includes_correct_answers(client):
    headers = _author_headers(client)
    response = client.get("/api/v1/learn/author/modules/orientation-v1/quiz", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["module_id"] == "orientation-v1"
    assert len(data["questions"]) >= 1
    assert "correct_option_ids" in data["questions"][0]


def test_student_forbidden_on_author_quiz(client):
    headers = _student_headers(client)
    response = client.get("/api/v1/learn/author/modules/orientation-v1/quiz", headers=headers)
    assert response.status_code == 403


def test_author_update_module_quiz(client):
    headers = _author_headers(client)
    module_id = "map-v1"

    payload = {
        "pass_threshold_percent": 75,
        "questions": [
            {
                "id": "map-q1",
                "order": 1,
                "prompt_html": "<p>Где открывается карта проекта?</p>",
                "options": [
                    {"id": "a", "text": "В разделе «Карта»"},
                    {"id": "b", "text": "В журнале задач"},
                ],
                "correct_option_ids": ["a"],
            },
            {
                "id": "map-q2",
                "order": 2,
                "prompt_html": "<p>Что можно делать на карте?</p>",
                "options": [
                    {"id": "a", "text": "Смотреть слои и объекты"},
                    {"id": "b", "text": "Менять пароль"},
                ],
                "correct_option_ids": ["a"],
            },
        ],
    }

    update = client.put(
        f"/api/v1/learn/author/modules/{module_id}/quiz",
        headers=headers,
        json=payload,
    )
    assert update.status_code == 200
    data = update.json()
    assert data["pass_threshold_percent"] == 75
    assert len(data["questions"]) == 2
    assert data["questions"][0]["correct_option_ids"] == ["a"]

    student = client.get(f"/api/v1/learn/modules/{module_id}/quiz", headers=_student_headers(client))
    assert student.status_code == 200
    student_data = student.json()
    assert len(student_data["questions"]) == 2
    assert "correct_option_ids" not in str(student_data)


def test_author_update_quiz_validation(client):
    headers = _author_headers(client)
    response = client.put(
        "/api/v1/learn/author/modules/map-v1/quiz",
        headers=headers,
        json={"questions": []},
    )
    assert response.status_code == 422
    assert response.json()["message"] == "Добавьте хотя бы один вопрос"
