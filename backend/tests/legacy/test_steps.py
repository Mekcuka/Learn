"""Legacy module Step API tests — removed.

Module progress uses Lesson API only (`/api/v1/learn/lessons/*`, `/dashboard`).
See `tests/test_lessons.py` for active coverage.
"""

import pytest

pytestmark = pytest.mark.skip(
    reason="module Step API removed: progress tracked via Lesson API (2026-06-19)",
)
