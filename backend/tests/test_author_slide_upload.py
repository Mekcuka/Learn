from pathlib import Path

from app.config import get_settings
from app.services.authoring.files import content_path_from_url

PNG_1X1 = (
    b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01"
    b"\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\x9cc\x00\x01"
    b"\x00\x00\x05\x00\x01\r\n-\xdb\x00\x00\x00\x00IEND\xaeB`\x82"
)

PNG_1X1_ALT = (
    b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01"
    b"\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x0cIDAT\x08\xd7c`\x00\x00"
    b"\x00\x02\x00\x01\xe2!\xbc3\x00\x00\x00\x00IEND\xaeB`\x82"
)


def test_slide_image_reupload_replaces_path(client, author_headers):
    module_id = "map-v1"
    create = client.post(
        f"/api/v1/learn/author/modules/{module_id}/lessons",
        headers=author_headers,
        json={
            "id": "lesson-test-slide-upload",
            "title": "Upload test",
            "verify_type": "manual",
        },
    )
    assert create.status_code == 201
    lesson_id = create.json()["id"]

    add_slide = client.post(
        f"/api/v1/learn/author/lessons/{lesson_id}/slides",
        headers=author_headers,
        json={"id": f"{lesson_id}-slide-01", "title": "Слайд 1"},
    )
    assert add_slide.status_code == 201
    slide_id = f"{lesson_id}-slide-01"

    first = client.post(
        f"/api/v1/learn/author/slides/{slide_id}/upload",
        headers=author_headers,
        files={"file": ("first.png", PNG_1X1, "image/png")},
    )
    assert first.status_code == 200
    first_path = first.json()["image_path"]
    assert first_path.startswith(f"/content/{module_id}/{lesson_id}/slide-01-")
    assert first_path.endswith(".png")

    first_file = content_path_from_url(first_path)
    assert first_file is not None
    assert first_file.is_file()
    assert first_file.read_bytes() == PNG_1X1

    second = client.post(
        f"/api/v1/learn/author/slides/{slide_id}/upload",
        headers=author_headers,
        files={"file": ("second.png", PNG_1X1_ALT, "image/png")},
    )
    assert second.status_code == 200
    second_path = second.json()["image_path"]
    assert second_path != first_path
    assert second_path.startswith(f"/content/{module_id}/{lesson_id}/slide-01-")

    second_file = content_path_from_url(second_path)
    assert second_file is not None
    assert second_file.is_file()
    assert second_file.read_bytes() == PNG_1X1_ALT
    assert not first_file.is_file()

    lesson = client.get(f"/api/v1/learn/author/lessons/{lesson_id}", headers=author_headers)
    assert lesson.status_code == 200
    assert lesson.json()["slides"][0]["image_path"] == second_path

    client.delete(f"/api/v1/learn/author/lessons/{lesson_id}", headers=author_headers)


def test_content_path_from_url_ignores_query_string():
    settings = get_settings()
    content_root = Path(settings.content_root).resolve()
    url = f"/content/map-v1/lesson-test/slide-01.png?v=123"
    resolved = content_path_from_url(url)
    assert resolved == content_root / "map-v1" / "lesson-test" / "slide-01.png"
