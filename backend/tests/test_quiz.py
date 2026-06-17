from app.models.user import User
from app.services.auth import hash_password


def test_get_module_quiz(client, db_session):
    login = client.post(
        "/api/v1/learn/auth/login",
        json={"email": "student@training.local", "password": "learn123"},
    )
    headers = {"Authorization": f"Bearer {login.json()['access_token']}"}
    response = client.get("/api/v1/learn/modules/orientation-v1/quiz", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["module_id"] == "orientation-v1"
    assert len(data["questions"]) >= 1
    assert "correct_option_ids" not in str(data)


def test_submit_quiz_passes_and_completes_lesson(client, db_session):
    login = client.post(
        "/api/v1/learn/auth/login",
        json={"email": "student@training.local", "password": "learn123"},
    )
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    for lesson_id in [
        "lesson-01-login-context",
        "lesson-02-create-project",
        "lesson-03-navigation",
        "lesson-04-job-journal",
    ]:
        client.post(f"/api/v1/learn/lessons/{lesson_id}/start", headers=headers)
        client.post(f"/api/v1/learn/lessons/{lesson_id}/verify", headers=headers)

    quiz = client.get("/api/v1/learn/modules/orientation-v1/quiz", headers=headers).json()
    answers = []
    for question in quiz["questions"]:
        if question["id"] == "q1":
            selected = ["a"]
        elif question["id"] == "q2":
            selected = ["a"]
        elif question["id"] == "q3":
            selected = ["a"]
        elif question["id"] == "q4":
            selected = ["a"]
        elif question["id"] == "q5":
            selected = ["a"]
        else:
            selected = [question["options"][0]["id"]]
        answers.append({"question_id": question["id"], "selected_option_ids": selected})

    response = client.post(
        "/api/v1/learn/modules/orientation-v1/quiz/submit",
        headers=headers,
        json={"answers": answers, "lesson_id": "lesson-05-mini-quiz"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["passed"] is True
    assert data["score_percent"] == 100
    assert data["lesson_completed"] is True

    lesson = client.get("/api/v1/learn/lessons/lesson-05-mini-quiz", headers=headers).json()
    state = next(item for item in lesson["lesson_states"] if item["lesson_id"] == "lesson-05-mini-quiz")
    assert state["status"] == "completed"


def test_submit_quiz_fails_with_wrong_answers(client, db_session):
    login = client.post(
        "/api/v1/learn/auth/login",
        json={"email": "student@training.local", "password": "learn123"},
    )
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    quiz = client.get("/api/v1/learn/modules/orientation-v1/quiz", headers=headers).json()
    answers = [
        {"question_id": question["id"], "selected_option_ids": [question["options"][-1]["id"]]}
        for question in quiz["questions"]
    ]

    response = client.post(
        "/api/v1/learn/modules/orientation-v1/quiz/submit",
        headers=headers,
        json={"answers": answers, "lesson_id": "lesson-05-mini-quiz"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["passed"] is False
    assert data["lesson_completed"] is False
