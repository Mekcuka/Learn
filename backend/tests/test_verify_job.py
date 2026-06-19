"""Legacy job_completed verify test — deprecated.

`job_completed` verify type falls back to manual in Learn MVP (`app/services/verify/`).
Demo API polling removed; see `test_verify_demo.py` skip note.
"""

import pytest

pytestmark = pytest.mark.skip(
    reason="job_completed Demo verify deprecated: manual fallback only (2026-06-18)",
)


def test_job_completed_verify_removed_placeholder() -> None:
    """Keeps module visible in pytest collection."""
