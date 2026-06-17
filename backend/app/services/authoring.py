import re
import uuid
from pathlib import Path

from fastapi import HTTPException, status

from app.config import get_settings

ALLOWED_VERIFY_TYPES = frozenset({"manual", "resource_exists", "navigation", "quiz_passed", "job_completed"})
ALLOWED_UPLOAD_TYPES = frozenset({"image/png", "image/webp", "image/svg+xml"})
MAX_UPLOAD_BYTES = 2 * 1024 * 1024


def slugify(value: str, *, prefix: str = "lesson") -> str:
    normalized = value.lower().strip()
    slug = re.sub(r"[^a-z0-9]+", "-", normalized).strip("-")
    if not slug:
        slug = uuid.uuid4().hex[:8]
    return f"{prefix}-{slug}"[:64]


MAX_TAG_COUNT = 8
MAX_TAG_LENGTH = 32


def normalize_tag(value: str) -> str:
    tag = value.strip()
    if tag.startswith("#"):
        tag = tag[1:].strip()
    return tag


def validate_tags(tags: list[str] | None) -> list[str]:
    if not tags:
        return []
    validated: list[str] = []
    seen: set[str] = set()
    for raw in tags:
        tag = normalize_tag(str(raw))
        if not tag:
            continue
        if len(tag) > MAX_TAG_LENGTH:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail={
                    "detail": "validation_error",
                    "message": f"Хештег длиннее {MAX_TAG_LENGTH} символов",
                },
            )
        key = tag.casefold()
        if key in seen:
            continue
        seen.add(key)
        validated.append(tag)
        if len(validated) > MAX_TAG_COUNT:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail={
                    "detail": "validation_error",
                    "message": f"Не больше {MAX_TAG_COUNT} хештегов",
                },
            )
    return validated


def validate_verify_type(verify_type: str) -> None:
    if verify_type not in ALLOWED_VERIFY_TYPES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "detail": "validation_error",
                "message": f"Недопустимый verify_type: {verify_type}",
            },
        )


def validate_hotspots(hotspots: list[dict]) -> list[dict]:
    validated: list[dict] = []
    for item in hotspots:
        hotspot_id = item.get("id")
        label = item.get("label")
        if not hotspot_id or not label:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail={
                    "detail": "validation_error",
                    "message": "У hotspot обязательны id и label",
                },
            )
        try:
            x_pct = float(item["x_pct"])
            y_pct = float(item["y_pct"])
            width_pct = float(item["width_pct"])
            height_pct = float(item["height_pct"])
        except (KeyError, TypeError, ValueError) as exc:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail={
                    "detail": "validation_error",
                    "message": "Координаты hotspot должны быть числами",
                },
            ) from exc

        if x_pct + width_pct > 100.01 or y_pct + height_pct > 100.01:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail={
                    "detail": "validation_error",
                    "message": "Hotspot выходит за границы изображения",
                },
            )

        validated.append(
            {
                "id": str(hotspot_id),
                "label": str(label),
                "x_pct": x_pct,
                "y_pct": y_pct,
                "width_pct": width_pct,
                "height_pct": height_pct,
                "pulse": item.get("pulse", True),
                **(
                    {"description_html": str(item["description_html"])}
                    if item.get("description_html") not in (None, "")
                    else {}
                ),
            }
        )
    return validated


def hotspots_to_storage(hotspots: list[dict]) -> dict:
    return {"hotspots": validate_hotspots(hotspots)}


def validate_upload(content_type: str | None, size: int) -> None:
    if content_type not in ALLOWED_UPLOAD_TYPES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "detail": "validation_error",
                "message": "Допустимы только PNG, WebP и SVG",
            },
        )
    if size > MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "detail": "validation_error",
                "message": "Файл больше 2 МБ",
            },
        )


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
