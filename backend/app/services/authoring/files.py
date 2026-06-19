from pathlib import Path

from fastapi import HTTPException, status

from app.config import get_settings


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
