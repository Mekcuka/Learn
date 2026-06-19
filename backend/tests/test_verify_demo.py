"""Legacy Demo API verify tests — deprecated.

Demo API polling (`demo_client.py`) removed from Learn MVP verify engine.
Active types: `manual`, `quiz_passed`; legacy types fall back to manual.
See `app/services/verify/` package and `docs/features/learn/impl-log.md`.
"""

import pytest

pytestmark = pytest.mark.skip(
    reason="demo_client deprecated: Learn verify uses manual/quiz_passed only (2026-06-18)",
)


def test_demo_client_removed_placeholder() -> None:
    """Keeps module visible in pytest collection."""
