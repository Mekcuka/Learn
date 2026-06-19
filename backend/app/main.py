import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.gzip import GZipMiddleware

from app.api.v1.learn import router as learn_router
from app.config import get_settings
from app.db import Base, SessionLocal, engine
from app.exceptions import (
    http_exception_handler,
    unhandled_exception_handler,
    validation_exception_handler,
)
from app.middleware.request_id import RequestIdMiddleware
from app.middleware.static_cache import StaticCacheControlMiddleware
from app.seed.data import run_seed


@asynccontextmanager
async def lifespan(_app: FastAPI):
    if os.getenv("TESTING"):
        yield
        return

    get_settings.cache_clear()
    settings = get_settings()

    import app.models  # noqa: F401 — register models

    if os.getenv("DB_CREATE_ALL", "").lower() == "true":
        Base.metadata.create_all(bind=engine)
    if settings.seed_on_startup:
        db = SessionLocal()
        try:
            run_seed(db)
        finally:
            db.close()
    yield


app = FastAPI(title="Learn Portal API", version="0.1.0", lifespan=lifespan)
_settings = get_settings()
app.add_middleware(RequestIdMiddleware)
app.add_middleware(StaticCacheControlMiddleware)
app.add_middleware(GZipMiddleware, minimum_size=1024)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in _settings.cors_origins.split(",") if origin.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_exception_handler(HTTPException, http_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(Exception, unhandled_exception_handler)
app.include_router(learn_router, prefix="/api/v1/learn")


@app.get("/health")
def health():
    return {"status": "ok"}
