import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.learn import router as learn_router
from app.config import get_settings
from app.db import Base, SessionLocal, engine
from app.seed.data import run_seed


@asynccontextmanager
async def lifespan(_app: FastAPI):
    if os.getenv("TESTING"):
        yield
        return

    get_settings.cache_clear()

    import app.models  # noqa: F401 — register models

    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        run_seed(db)
    finally:
        db.close()
    yield


app = FastAPI(title="Learn Portal API", version="0.1.0", lifespan=lifespan)
_settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in _settings.cors_origins.split(",") if origin.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(learn_router, prefix="/api/v1/learn")


@app.get("/health")
def health():
    return {"status": "ok"}
