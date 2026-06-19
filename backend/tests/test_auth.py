def test_health(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_login_success(client):
    response = client.post(
        "/api/v1/learn/auth/login",
        json={"email": "student@training.local", "password": "learn123"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == "student@training.local"
    assert data["user"]["display_name"] == "Ученик 1"


def test_login_invalid_credentials(client):
    response = client.post(
        "/api/v1/learn/auth/login",
        json={"email": "student@training.local", "password": "wrong"},
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "invalid_credentials"
    assert response.json()["message"] == "Неверный email или пароль"


def test_modules_list_requires_auth(client):
    response = client.get("/api/v1/learn/modules")
    assert response.status_code == 401


def test_modules_list_with_auth(client):
    login = client.post(
        "/api/v1/learn/auth/login",
        json={"email": "student@training.local", "password": "learn123"},
    )
    token = login.json()["access_token"]
    response = client.get(
        "/api/v1/learn/modules",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    items = response.json()["items"]
    assert len(items) == 1
    assert items[0]["id"] == "orientation-v1"
    assert items[0]["title"] == "Основной интерфейс"
    assert items[0]["progress_percent"] == 0
    assert items[0]["total_steps"] == 5
