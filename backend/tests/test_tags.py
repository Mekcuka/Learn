import pytest
from fastapi import HTTPException

from app.services.authoring import normalize_tag, validate_tags


def test_normalize_tag_strips_hash():
    assert normalize_tag("  #Демо  ") == "Демо"
    assert normalize_tag("Старт") == "Старт"


def test_validate_tags_normalizes_and_dedupes():
    assert validate_tags(["#Демо", " демо ", "Старт"]) == ["Демо", "Старт"]


def test_validate_tags_empty():
    assert validate_tags(None) == []
    assert validate_tags([]) == []


def test_validate_tags_max_count():
    with pytest.raises(HTTPException) as exc:
        validate_tags([f"tag{i}" for i in range(9)])
    assert exc.value.status_code == 422


def test_validate_tags_max_length():
    with pytest.raises(HTTPException) as exc:
        validate_tags(["x" * 33])
    assert exc.value.status_code == 422
