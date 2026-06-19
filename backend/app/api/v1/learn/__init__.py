from fastapi import APIRouter

from app.api.v1.learn.auth import router as auth_router
from app.api.v1.learn.author import router as author_router
from app.api.v1.learn.author_wiki import router as author_wiki_router
from app.api.v1.learn.lessons import router as lessons_router
from app.api.v1.learn.modules import router as modules_router
from app.api.v1.learn.self_study import router as self_study_router
from app.api.v1.learn.wiki import router as wiki_router

router = APIRouter()
router.include_router(auth_router)
router.include_router(author_router)
router.include_router(author_wiki_router)
router.include_router(modules_router)
router.include_router(lessons_router)
router.include_router(self_study_router)
router.include_router(wiki_router)
