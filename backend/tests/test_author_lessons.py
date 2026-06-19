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
    assert response.json()["detail"] == "forbidden"


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
    assert with_description.json()["slide"]["hotspots"][0]["description_html"] == (
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

    pin_hotspot = client.put(
        "/api/v1/learn/author/slides/lesson-test-author-slide-01",
        headers=headers,
        json={
            "hotspots": [
                {
                    "id": "pin-1",
                    "label": "Метка",
                    "x_pct": 48,
                    "y_pct": 48,
                    "width_pct": 2,
                    "height_pct": 2,
                    "kind": "pin",
                    "description_html": "<p>Точка</p>",
                }
            ]
        },
    )
    assert pin_hotspot.status_code == 200
    saved = pin_hotspot.json()["slide"]["hotspots"][0]
    assert saved["kind"] == "pin"
    assert saved["description_html"] == "<p>Точка</p>"

    pin_callout_width = client.put(
        "/api/v1/learn/author/slides/lesson-test-author-slide-01",
        headers=headers,
        json={
            "hotspots": [
                {
                    "id": "pin-1",
                    "label": "Метка",
                    "x_pct": 48,
                    "y_pct": 48,
                    "width_pct": 2,
                    "height_pct": 2,
                    "kind": "pin",
                    "description_html": "<p>Точка</p>",
                    "callout_width": "wide",
                }
            ]
        },
    )
    assert pin_callout_width.status_code == 200
    assert pin_callout_width.json()["slide"]["hotspots"][0]["callout_width"] == "wide"

    pin_callout_side = client.put(
        "/api/v1/learn/author/slides/lesson-test-author-slide-01",
        headers=headers,
        json={
            "hotspots": [
                {
                    "id": "pin-1",
                    "label": "Метка",
                    "x_pct": 48,
                    "y_pct": 48,
                    "width_pct": 2,
                    "height_pct": 2,
                    "kind": "pin",
                    "description_html": "<p>Точка</p>",
                    "callout_side": "top",
                }
            ]
        },
    )
    assert pin_callout_side.status_code == 200
    assert pin_callout_side.json()["slide"]["hotspots"][0]["callout_side"] == "top"

    fill_hotspot = client.put(
        "/api/v1/learn/author/slides/lesson-test-author-slide-01",
        headers=headers,
        json={
            "hotspots": [
                {
                    "id": "fill-1",
                    "label": "Зона",
                    "x_pct": 10,
                    "y_pct": 10,
                    "width_pct": 20,
                    "height_pct": 10,
                    "fill_enabled": False,
                    "fill_color": "green",
                }
            ]
        },
    )
    assert fill_hotspot.status_code == 200
    saved_fill = fill_hotspot.json()["slide"]["hotspots"][0]
    assert saved_fill["fill_enabled"] is False
    assert saved_fill["fill_color"] == "green"

    pin_fill = client.put(
        "/api/v1/learn/author/slides/lesson-test-author-slide-01",
        headers=headers,
        json={
            "hotspots": [
                {
                    "id": "pin-fill-1",
                    "label": "Метка",
                    "kind": "pin",
                    "x_pct": 50,
                    "y_pct": 50,
                    "width_pct": 2,
                    "height_pct": 2,
                    "fill_color": "orange",
                }
            ]
        },
    )
    assert pin_fill.status_code == 200
    saved_pin = pin_fill.json()["slide"]["hotspots"][0]
    assert saved_pin["kind"] == "pin"
    assert saved_pin["fill_color"] == "orange"

    invalid_fill_color = client.put(
        "/api/v1/learn/author/slides/lesson-test-author-slide-01",
        headers=headers,
        json={
            "hotspots": [
                {
                    "id": "bad-fill",
                    "label": "Зона",
                    "x_pct": 10,
                    "y_pct": 10,
                    "width_pct": 20,
                    "height_pct": 10,
                    "fill_color": "purple",
                }
            ]
        },
    )
    assert invalid_fill_color.status_code == 422

    invalid_kind = client.put(
        "/api/v1/learn/author/slides/lesson-test-author-slide-01",
        headers=headers,
        json={
            "hotspots": [
                {
                    "id": "bad-kind",
                    "label": "X",
                    "x_pct": 10,
                    "y_pct": 10,
                    "width_pct": 5,
                    "height_pct": 5,
                    "kind": "arrow",
                }
            ]
        },
    )
    assert invalid_kind.status_code == 422

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


def test_author_reorder_lessons(client):
    headers = _author_headers(client)
    module_id = "map-v1"

    list_before = client.get(f"/api/v1/learn/author/modules/{module_id}/lessons", headers=headers)
    assert list_before.status_code == 200
    lessons = list_before.json()
    assert len(lessons) >= 2

    reversed_ids = [lesson["id"] for lesson in reversed(lessons)]
    reorder = client.patch(
        f"/api/v1/learn/author/modules/{module_id}/lessons/reorder",
        headers=headers,
        json={"lesson_ids": reversed_ids},
    )
    assert reorder.status_code == 200
    reordered = reorder.json()
    assert [item["id"] for item in reordered] == reversed_ids
    assert [item["order"] for item in reordered] == list(range(1, len(reordered) + 1))

    restore = client.patch(
        f"/api/v1/learn/author/modules/{module_id}/lessons/reorder",
        headers=headers,
        json={"lesson_ids": [lesson["id"] for lesson in lessons]},
    )
    assert restore.status_code == 200


def test_author_reorder_lessons_validation(client):
    headers = _author_headers(client)
    module_id = "map-v1"

    list_resp = client.get(f"/api/v1/learn/author/modules/{module_id}/lessons", headers=headers)
    lessons = list_resp.json()
    invalid = client.patch(
        f"/api/v1/learn/author/modules/{module_id}/lessons/reorder",
        headers=headers,
        json={"lesson_ids": [lesson["id"] for lesson in lessons[:1]]},
    )
    assert invalid.status_code == 422
    assert invalid.json()["detail"] == "validation_error"


def test_auth_me_includes_role(client):
    headers = _author_headers(client)
    response = client.get("/api/v1/learn/auth/me", headers=headers)
    assert response.status_code == 200
    assert response.json()["role"] == "author"
