import re
import uuid

from fastapi import HTTPException, status

ALLOWED_VERIFY_TYPES = frozenset({"manual", "quiz_passed"})
ALLOWED_UPLOAD_TYPES = frozenset({"image/png", "image/webp", "image/svg+xml"})
MAX_UPLOAD_BYTES = 2 * 1024 * 1024


_CYRILLIC_TO_LATIN = {
    "а": "a",
    "б": "b",
    "в": "v",
    "г": "g",
    "д": "d",
    "е": "e",
    "ё": "e",
    "ж": "zh",
    "з": "z",
    "и": "i",
    "й": "y",
    "к": "k",
    "л": "l",
    "м": "m",
    "н": "n",
    "о": "o",
    "п": "p",
    "р": "r",
    "с": "s",
    "т": "t",
    "у": "u",
    "ф": "f",
    "х": "h",
    "ц": "ts",
    "ч": "ch",
    "ш": "sh",
    "щ": "sch",
    "ъ": "",
    "ы": "y",
    "ь": "",
    "э": "e",
    "ю": "yu",
    "я": "ya",
}


def _transliterate(value: str) -> str:
    chars: list[str] = []
    for char in value.lower():
        if char in _CYRILLIC_TO_LATIN:
            chars.append(_CYRILLIC_TO_LATIN[char])
        else:
            chars.append(char)
    return "".join(chars)


def slugify(value: str, *, prefix: str = "lesson") -> str:
    normalized = _transliterate(value).lower().strip()
    slug = re.sub(r"[^a-z0-9]+", "-", normalized).strip("-")
    if not slug:
        slug = uuid.uuid4().hex[:8]
    if prefix:
        slug = f"{prefix}-{slug}"
    return slug[:64]


def wiki_slugify(value: str) -> str:
    return slugify(value, prefix="")


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


def validate_quiz_questions(questions: list) -> None:
    if not questions:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "detail": "validation_error",
                "message": "Добавьте хотя бы один вопрос",
            },
        )

    seen_question_ids: set[str] = set()
    for index, question in enumerate(questions, start=1):
        question_id = getattr(question, "id", None) or question.get("id")
        prompt_html = (getattr(question, "prompt_html", None) or question.get("prompt_html") or "").strip()
        options = getattr(question, "options", None) or question.get("options") or []
        correct_option_ids = getattr(question, "correct_option_ids", None) or question.get("correct_option_ids") or []

        if not question_id:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail={
                    "detail": "validation_error",
                    "message": f"У вопроса {index} не указан id",
                },
            )
        if question_id in seen_question_ids:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail={
                    "detail": "validation_error",
                    "message": f"Повторяющийся id вопроса: {question_id}",
                },
            )
        seen_question_ids.add(question_id)

        if not prompt_html:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail={
                    "detail": "validation_error",
                    "message": f"У вопроса {index} пустой текст",
                },
            )
        if len(options) < 2:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail={
                    "detail": "validation_error",
                    "message": f"У вопроса {index} нужно минимум 2 варианта ответа",
                },
            )
        if not correct_option_ids:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail={
                    "detail": "validation_error",
                    "message": f"У вопроса {index} не отмечен правильный ответ",
                },
            )

        option_ids: set[str] = set()
        for option in options:
            option_id = getattr(option, "id", None) or option.get("id")
            option_text = (getattr(option, "text", None) or option.get("text") or "").strip()
            if not option_id:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail={
                        "detail": "validation_error",
                        "message": f"У вопроса {index} есть вариант без id",
                    },
                )
            if option_id in option_ids:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail={
                        "detail": "validation_error",
                        "message": f"У вопроса {index} повторяется id варианта: {option_id}",
                    },
                )
            option_ids.add(option_id)
            if not option_text:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail={
                        "detail": "validation_error",
                        "message": f"У вопроса {index} есть пустой вариант ответа",
                    },
                )

        for correct_id in correct_option_ids:
            if correct_id not in option_ids:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail={
                        "detail": "validation_error",
                        "message": f"У вопроса {index} указан несуществующий правильный ответ",
                    },
                )


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

        kind = item.get("kind", "region")
        if kind not in ("region", "zoom", "pin"):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail={
                    "detail": "validation_error",
                    "message": "Недопустимый kind hotspot: допустимы region, zoom, pin",
                },
            )

        fill_enabled = item.get("fill_enabled", True)
        if fill_enabled is False:
            entry_fill_enabled = False
        else:
            entry_fill_enabled = True

        fill_color = item.get("fill_color")
        border_color = item.get("border_color")
        allowed_hotspot_colors = {
            "yellow",
            "blue",
            "green",
            "red",
            "orange",
            "purple",
            "pink",
            "cyan",
            "gray",
            "lime",
        }
        if fill_color not in (None, ""):
            if fill_color not in allowed_hotspot_colors:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail={
                        "detail": "validation_error",
                        "message": "Недопустимый fill_color hotspot",
                    },
                )
        if border_color not in (None, ""):
            if border_color not in allowed_hotspot_colors:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail={
                        "detail": "validation_error",
                        "message": "Недопустимый border_color hotspot",
                    },
                )

        entry: dict = {
            "id": str(hotspot_id),
            "label": str(label),
            "x_pct": x_pct,
            "y_pct": y_pct,
            "width_pct": width_pct,
            "height_pct": height_pct,
            "pulse": item.get("pulse", True),
            "fill_enabled": entry_fill_enabled,
        }
        if kind != "region":
            entry["kind"] = kind
        if fill_color not in (None, ""):
            entry["fill_color"] = str(fill_color)
        if border_color not in (None, ""):
            entry["border_color"] = str(border_color)
        if item.get("description_html") not in (None, ""):
            entry["description_html"] = str(item["description_html"])
        callout_width = item.get("callout_width")
        if callout_width not in (None, ""):
            if callout_width not in ("compact", "normal", "wide"):
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail={
                        "detail": "validation_error",
                        "message": "Недопустимый callout_width: допустимы compact, normal, wide",
                    },
                )
            if kind == "pin":
                entry["callout_width"] = str(callout_width)
        callout_side = item.get("callout_side")
        if callout_side not in (None, ""):
            if callout_side not in ("auto", "left", "right", "top", "bottom"):
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail={
                        "detail": "validation_error",
                        "message": "Недопустимый callout_side: допустимы auto, left, right, top, bottom",
                    },
                )
            if kind == "pin" and callout_side != "auto":
                entry["callout_side"] = str(callout_side)
        validated.append(entry)
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
