"""Verify engine — strategy dispatch by verify_type."""

from .lesson import run_lesson_verify
from .manual import verify_manual, verify_manual_lesson, verify_manual_self_study
from .quiz_passed import verify_quiz_passed_lesson, verify_quiz_passed_step
from .self_study import run_self_study_verify
from .step import run_verify

# Legacy demo-backed verify types fall back to manual confirmation.
_LEGACY_MANUAL_TYPES = frozenset({"resource_exists", "navigation", "job_completed"})

__all__ = [
    "run_lesson_verify",
    "run_self_study_verify",
    "run_verify",
    "verify_manual",
    "verify_manual_lesson",
    "verify_manual_self_study",
    "verify_quiz_passed_lesson",
    "verify_quiz_passed_step",
    "_LEGACY_MANUAL_TYPES",
]
