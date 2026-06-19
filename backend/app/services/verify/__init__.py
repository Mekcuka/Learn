"""Verify engine — strategy dispatch by verify_type."""

from ._common import LEGACY_MANUAL_TYPES, is_manual_verify_type
from .lesson import run_lesson_verify
from .manual import verify_manual_lesson, verify_manual_self_study
from .quiz_passed import verify_quiz_passed_lesson
from .self_study import run_self_study_verify

__all__ = [
    "LEGACY_MANUAL_TYPES",
    "is_manual_verify_type",
    "run_lesson_verify",
    "run_self_study_verify",
    "verify_manual_lesson",
    "verify_manual_self_study",
    "verify_quiz_passed_lesson",
]
