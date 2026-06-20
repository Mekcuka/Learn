from pathlib import Path

from fastapi import HTTPException, status

from app.config import get_settings


def content_path_from_url(image_path: str) -> Path | None:
    """Resolve a `/content/...` URL to a filesystem path (ignores query string)."""
    base_path = image_path.split("?", 1)[0]
    if not base_path.startswith("/content/"):
        return None
    relative = base_path.removeprefix("/content/")
    settings = get_settings()
    return Path(settings.content_root).resolve() / Path(relative)


def delete_lesson_content_file(image_path: str, module_id: str, lesson_id: str) -> None:
    """Remove a prior slide image file when it lives in the target lesson folder."""
    path = content_path_from_url(image_path)
    if path is None or not path.is_file():
        return

    settings = get_settings()
    lesson_dir = (Path(settings.content_root).resolve() / module_id / lesson_id).resolve()
    if path.resolve().parent != lesson_dir:
        return

    path.unlink(missing_ok=True)


def write_content_file(module_id: str, lesson_id: str, filename: str, data: bytes) -> str:
    settings = get_settings()
    content_root = Path(settings.content_root).resolve()
    if ".." in module_id or ".." in lesson_id or ".." in filename:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"detail": "validation_error", "message": "Недопустимый путь"},
        )

    target_dir = content_root / module_id / lesson_id
    target_dir.mkdir(parents=True, exist_ok=True)
    target_path = target_dir / filename
    target_path.write_bytes(data)

    return f"/content/{module_id}/{lesson_id}/{filename}"


def write_wiki_content_file(filename: str, data: bytes) -> str:
    settings = get_settings()
    content_root = Path(settings.content_root).resolve()
    if ".." in filename or "/" in filename or "\\" in filename:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"detail": "validation_error", "message": "Недопустимый путь"},
        )

    target_dir = content_root / "wiki"
    target_dir.mkdir(parents=True, exist_ok=True)
    target_path = target_dir / filename
    target_path.write_bytes(data)

    return f"/content/wiki/{filename}"
