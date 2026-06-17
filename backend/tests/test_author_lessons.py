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


def test_student_forbidden_on_author_api(client):
    headers = _student_headers(client)
    response = client.get("/api/v1/learn/author/modules", headers=headers)
    assert response.status_code == 403
    assert response.json()["detail"]["detail"] == "forbidden"


def test_author_lists_modules(client):
    headers = _author_headers(client)
    response = client.get("/api/v1/learn/author/modules", headers=headers)
    assert response.status_code == 200
    modules = response.json()
    assert len(modules) >= 4
    assert modules[0]["title"] == "Основной интерфейс"


def test_author_lesson_crud_and_slides(client):
    headers = _author_headers(client)
    module_id = "map-v1"

    create = client.post(
        f"/api/v1/learn/author/modules/{module_id}/lessons",
        headers=headers,
        json={
            "id": "lesson-test-author",
            "title": "Тестовый урок",
            "summary": "Для pytest",
            "verify_type": "manual",
        },
    )
    assert create.status_code == 201
    lesson_id = create.json()["id"]
    assert create.json()["tags"] == []
    assert lesson_id == "lesson-test-author"

    update_tags = client.put(
        f"/api/v1/learn/author/lessons/{lesson_id}",
        headers=headers,
        json={"tags": ["#Карта", "Демо", "карта"]},
    )
    assert update_tags.status_code == 200
    assert update_tags.json()["tags"] == ["Карта", "Демо"]

    add_slide = client.post(
        f"/api/v1/learn/author/lessons/{lesson_id}/slides",
        headers=headers,
        json={
            "id": "lesson-test-author-slide-01",
            "title": "Слайд 1",
            "hotspots": [
                {
                    "id": "btn",
                    "label": "Кнопка",
                    "x_pct": 10,
                    "y_pct": 20,
                    "width_pct": 15,
                    "height_pct": 8,
                }
            ],
        },
    )
    assert add_slide.status_code == 201
    assert len(add_slide.json()["slides"]) == 1

    with_description = client.put(
        "/api/v1/learn/author/slides/lesson-test-author-slide-01",
        headers=headers,
        json={
            "hotspots": [
                {
                    "id": "btn",
                    "label": "Кнопка",
                    "x_pct": 10,
                    "y_pct": 20,
                    "width_pct": 15,
                    "height_pct": 8,
                    "description_html": "<p>Подсказка к зоне</p>",
                }
            ]
        },
    )
    assert with_description.status_code == 200
    assert with_description.json()["slides"][0]["hotspots"][0]["description_html"] == (
        "<p>Подсказка к зоне</p>"
    )

    invalid_hotspot = client.put(
        "/api/v1/learn/author/slides/lesson-test-author-slide-01",
        headers=headers,
        json={
            "hotspots": [
                {
                    "id": "bad",
                    "label": "Зона",
                    "x_pct": 90,
                    "y_pct": 10,
                    "width_pct": 20,
                    "height_pct": 10,
                }
            ]
        },
    )
    assert invalid_hotspot.status_code == 422

    export = client.get(f"/api/v1/learn/author/lessons/{lesson_id}/export", headers=headers)
    assert export.status_code == 200
    assert export.json()["id"] == lesson_id
    assert export.json()["tags"] == ["Карта", "Демо"]

    delete_slide = client.delete(
        "/api/v1/learn/author/slides/lesson-test-author-slide-01",
        headers=headers,
    )
    assert delete_slide.status_code == 200
    assert delete_slide.json()["slides"] == []

    delete_lesson = client.delete(f"/api/v1/learn/author/lessons/{lesson_id}", headers=headers)
    assert delete_lesson.status_code == 204


def test_auth_me_includes_role(client):
    headers = _author_headers(client)
    response = client.get("/api/v1/learn/auth/me", headers=headers)
    assert response.status_code == 200
    assert response.json()["role"] == "author"
