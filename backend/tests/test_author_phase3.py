"""Phase 3 author API: duplicate, revisions, draft/publish."""


def _create_test_lesson(client, headers, *, lesson_id: str = "lesson-phase3-test", module_id: str = "orientation-v1"):
    create = client.post(
        f"/api/v1/learn/author/modules/{module_id}/lessons",
        headers=headers,
        json={"id": lesson_id, "title": "Phase3 test", "verify_type": "manual"},
    )
    assert create.status_code == 201
    client.post(
        f"/api/v1/learn/author/lessons/{lesson_id}/slides",
        headers=headers,
        json={"id": f"{lesson_id}-slide-01", "title": "Слайд 1", "caption_html": "<p>Published</p>"},
    )
    return lesson_id


def test_duplicate_lesson(client, author_headers):
    source_id = _create_test_lesson(client, author_headers, lesson_id="lesson-phase3-dup-src")

    duplicate = client.post(
        f"/api/v1/learn/author/lessons/{source_id}/duplicate",
        headers=author_headers,
        json={"new_id": "lesson-phase3-dup-copy", "title_suffix": " (копия)"},
    )
    assert duplicate.status_code == 201
    body = duplicate.json()
    assert body["id"] == "lesson-phase3-dup-copy"
    assert body["title"].endswith("(копия)")
    assert len(body["slides"]) == 1
    assert body["slides"][0]["caption_html"] == "<p>Published</p>"

    client.delete(f"/api/v1/learn/author/lessons/{source_id}", headers=author_headers)
    client.delete(f"/api/v1/learn/author/lessons/lesson-phase3-dup-copy", headers=author_headers)


def test_draft_list_reflects_working_snapshot(client, author_headers):
    lesson_id = _create_test_lesson(client, author_headers, lesson_id="lesson-phase3-list")

    publish_initial = client.post(
        f"/api/v1/learn/author/lessons/{lesson_id}/publish",
        headers=author_headers,
    )
    assert publish_initial.status_code == 200

    client.put(
        f"/api/v1/learn/author/lessons/{lesson_id}",
        headers=author_headers,
        json={"title": "Черновое название"},
    )
    client.put(
        f"/api/v1/learn/author/slides/{lesson_id}-slide-01",
        headers=author_headers,
        json={"caption_html": "<p>Draft caption</p>"},
    )

    module_id = "orientation-v1"
    listing = client.get(f"/api/v1/learn/author/modules/{module_id}/lessons", headers=author_headers)
    assert listing.status_code == 200
    item = next(row for row in listing.json() if row["id"] == lesson_id)
    assert item["title"] == "Черновое название"
    assert item["slide_count"] == 1
    assert item["has_unpublished_changes"] is True

    client.delete(f"/api/v1/learn/author/lessons/{lesson_id}", headers=author_headers)


def test_draft_publish_isolation(client, author_headers, student_headers):
    lesson_id = _create_test_lesson(client, author_headers, lesson_id="lesson-phase3-draft")

    publish_initial = client.post(
        f"/api/v1/learn/author/lessons/{lesson_id}/publish",
        headers=author_headers,
    )
    assert publish_initial.status_code == 200

    update = client.put(
        f"/api/v1/learn/author/slides/{lesson_id}-slide-01",
        headers=author_headers,
        json={"caption_html": "<p>Draft caption</p>"},
    )
    assert update.status_code == 200
    assert update.json()["has_unpublished_changes"] is True

    author_view = client.get(f"/api/v1/learn/author/lessons/{lesson_id}", headers=author_headers)
    assert author_view.json()["slides"][0]["caption_html"] == "<p>Draft caption</p>"

    student_view = client.get(f"/api/v1/learn/lessons/{lesson_id}", headers=student_headers)
    assert student_view.status_code == 200
    assert student_view.json()["slides"][0]["caption_html"] == "<p>Published</p>"

    draft_preview = client.get(
        f"/api/v1/learn/lessons/{lesson_id}?draft=1",
        headers=author_headers,
    )
    assert draft_preview.status_code == 200
    assert draft_preview.json()["slides"][0]["caption_html"] == "<p>Draft caption</p>"

    publish = client.post(f"/api/v1/learn/author/lessons/{lesson_id}/publish", headers=author_headers)
    assert publish.status_code == 200
    assert publish.json()["has_unpublished_changes"] is False

    student_after = client.get(f"/api/v1/learn/lessons/{lesson_id}", headers=student_headers)
    assert student_after.json()["slides"][0]["caption_html"] == "<p>Draft caption</p>"

    client.delete(f"/api/v1/learn/author/lessons/{lesson_id}", headers=author_headers)


def test_student_forbidden_draft_preview(client, author_headers, student_headers):
    lesson_id = _create_test_lesson(client, author_headers, lesson_id="lesson-phase3-student-draft")

    publish = client.post(
        f"/api/v1/learn/author/lessons/{lesson_id}/publish",
        headers=author_headers,
    )
    assert publish.status_code == 200

    client.put(
        f"/api/v1/learn/author/slides/{lesson_id}-slide-01",
        headers=author_headers,
        json={"caption_html": "<p>Draft only</p>"},
    )

    student_draft = client.get(
        f"/api/v1/learn/lessons/{lesson_id}?draft=1",
        headers=student_headers,
    )
    assert student_draft.status_code == 403
    assert student_draft.json()["detail"] == "forbidden"

    client.delete(f"/api/v1/learn/author/lessons/{lesson_id}", headers=author_headers)


def test_revisions_list_and_rollback(client, author_headers):
    lesson_id = _create_test_lesson(client, author_headers, lesson_id="lesson-phase3-rev")

    client.post(f"/api/v1/learn/author/lessons/{lesson_id}/publish", headers=author_headers)
    client.put(
        f"/api/v1/learn/author/slides/{lesson_id}-slide-01",
        headers=author_headers,
        json={"caption_html": "<p>Version B</p>"},
    )
    client.post(f"/api/v1/learn/author/lessons/{lesson_id}/publish", headers=author_headers)

    manual_revision = client.post(
        f"/api/v1/learn/author/lessons/{lesson_id}/revisions",
        headers=author_headers,
        json={"label": "Ручной снимок"},
    )
    assert manual_revision.status_code == 201

    revisions = client.get(f"/api/v1/learn/author/lessons/{lesson_id}/revisions", headers=author_headers)
    assert revisions.status_code == 200
    items = revisions.json()["items"]
    assert len(items) >= 2
    manual = next((item for item in items if item["summary"] == "Ручной снимок"), items[0])

    client.put(
        f"/api/v1/learn/author/slides/{lesson_id}-slide-01",
        headers=author_headers,
        json={"caption_html": "<p>Version C</p>"},
    )
    client.post(f"/api/v1/learn/author/lessons/{lesson_id}/publish", headers=author_headers)

    rollback = client.post(
        f"/api/v1/learn/author/lessons/{lesson_id}/revisions/{manual['id']}/rollback",
        headers=author_headers,
    )
    assert rollback.status_code == 200
    assert rollback.json()["slides"][0]["caption_html"] == "<p>Version B</p>"

    client.delete(f"/api/v1/learn/author/lessons/{lesson_id}", headers=author_headers)
