"""Progress service: lesson state backfill for newly published lessons."""


def test_get_lesson_backfills_missing_lesson_state(client, author_headers, student_headers):
    lesson_id = "lesson-state-backfill-api"
    module_id = "orientation-v1"

    create = client.post(
        f"/api/v1/learn/author/modules/{module_id}/lessons",
        headers=author_headers,
        json={"id": lesson_id, "title": "Backfill state", "verify_type": "manual"},
    )
    assert create.status_code == 201

    publish = client.post(
        f"/api/v1/learn/author/lessons/{lesson_id}/publish",
        headers=author_headers,
    )
    assert publish.status_code == 200

    lesson = client.get(f"/api/v1/learn/lessons/{lesson_id}", headers=student_headers)
    assert lesson.status_code == 200
    state = next((item for item in lesson.json()["lesson_states"] if item["lesson_id"] == lesson_id), None)
    assert state is not None

    start = client.post(f"/api/v1/learn/lessons/{lesson_id}/start", headers=student_headers)
    assert start.status_code != 404

    client.delete(f"/api/v1/learn/author/lessons/{lesson_id}", headers=author_headers)
