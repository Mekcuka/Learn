from fastapi import APIRouter

from .lessons import router as lessons_router
from .modules import router as modules_router
from .quiz import router as quiz_router
from .slides import router as slides_router

router = APIRouter(prefix="/author", tags=["author"])
router.include_router(modules_router)
router.include_router(lessons_router)
router.include_router(slides_router)
router.include_router(quiz_router)

__all__ = ["router"]
