def _auth_headers(client):
    login = client.post(
        "/api/v1/learn/auth/login",
        json={"email": "student@training.local", "password": "learn123"},
    )
    token = login.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_api_error_format_includes_request_id(client):
    response = client.post(
        "/api/v1/learn/auth/login",
        json={"email": "wrong@training.local", "password": "bad"},
    )
    assert response.status_code == 401
    body = response.json()
    assert body["detail"] == "invalid_credentials"
    assert body["message"] == "Неверный email или пароль"
    assert body["request_id"]
    assert response.headers.get("X-Request-ID") == body["request_id"]


def test_get_lesson_fields_meta_omits_slides(client):
    headers = _auth_headers(client)
    full = client.get("/api/v1/learn/lessons/lesson-02-create-project", headers=headers)
    meta = client.get(
        "/api/v1/learn/lessons/lesson-02-create-project?fields=meta",
        headers=headers,
    )
    assert meta.status_code == 200
    meta_data = meta.json()
    full_data = full.json()
    assert meta_data["id"] == full_data["id"]
    assert meta_data["title"] == full_data["title"]
    assert meta_data["slides"] == []
    assert meta_data["quiz"] is None
    assert len(full_data["slides"]) == 3
